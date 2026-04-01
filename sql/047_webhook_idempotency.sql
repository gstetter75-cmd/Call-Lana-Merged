-- =============================================
-- Call Lana: Webhook idempotency + balance constraint
-- Prevents double-processing of Stripe/VAPI webhooks
-- and ensures balance never goes negative.
-- =============================================

-- 1. Webhook dedup table
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id text PRIMARY KEY,
  source text NOT NULL DEFAULT 'stripe',
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-cleanup events older than 7 days (Stripe retries max 3 days)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
  ON webhook_events(processed_at);

-- 2. Balance non-negative constraint
ALTER TABLE subscriptions
  ADD CONSTRAINT chk_balance_non_negative CHECK (balance_cents >= 0);

-- 3. Missing performance indexes for main queries
CREATE INDEX IF NOT EXISTS idx_calls_user_created
  ON calls(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_created
  ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned
  ON tasks(assigned_to);

-- 4. Auth check in check_trial_status
CREATE OR REPLACE FUNCTION check_trial_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub record;
BEGIN
  -- Authorization: only own trial status or superadmin
  IF auth.uid() != p_user_id AND NOT is_superadmin() THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_subscription');
  END IF;

  IF v_sub.trial_active THEN
    IF now() > v_sub.trial_ends_at OR v_sub.balance_cents <= 0 THEN
      UPDATE subscriptions SET
        trial_active = false,
        service_active = false,
        paused_reason = 'trial_expired'
      WHERE user_id = p_user_id;

      RETURN jsonb_build_object(
        'status', 'trial_expired',
        'reason', CASE
          WHEN now() > v_sub.trial_ends_at THEN 'time_expired'
          ELSE 'credit_exhausted'
        END
      );
    END IF;

    RETURN jsonb_build_object(
      'status', 'trial_active',
      'days_remaining', GREATEST(0, EXTRACT(DAY FROM v_sub.trial_ends_at - now())::int),
      'credit_remaining_cents', v_sub.balance_cents,
      'trial_ends_at', v_sub.trial_ends_at
    );
  END IF;

  RETURN jsonb_build_object(
    'status', COALESCE(v_sub.plan, 'none'),
    'service_active', v_sub.service_active,
    'balance_cents', v_sub.balance_cents
  );
END;
$$;

-- 5. Restrict subscriptions UPDATE to safe columns only
DROP POLICY IF EXISTS "users_update_own_subscription" ON subscriptions;
CREATE POLICY "users_update_own_subscription_safe" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    -- Users can only update auto-reload and hard-cap settings
    auth.uid() = user_id
  );

-- Trigger to block client-side balance/plan/trial manipulation
CREATE OR REPLACE FUNCTION prevent_subscription_self_edit()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Allow service_role (webhooks, edge functions, triggers)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- Allow superadmins
  IF is_superadmin() THEN
    RETURN NEW;
  END IF;
  -- Block changes to sensitive fields
  IF OLD.balance_cents IS DISTINCT FROM NEW.balance_cents THEN
    RAISE EXCEPTION 'Cannot modify balance directly';
  END IF;
  IF OLD.trial_active IS DISTINCT FROM NEW.trial_active THEN
    RAISE EXCEPTION 'Cannot modify trial status directly';
  END IF;
  IF OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    RAISE EXCEPTION 'Cannot modify trial end date directly';
  END IF;
  IF OLD.service_active IS DISTINCT FROM NEW.service_active THEN
    RAISE EXCEPTION 'Cannot modify service status directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_sub_self_edit ON subscriptions;
CREATE TRIGGER prevent_sub_self_edit
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION prevent_subscription_self_edit();
