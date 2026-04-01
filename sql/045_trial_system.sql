-- =============================================
-- Call Lana: Trial system — 30 days OR 25€ credit
-- Every new user gets a trial subscription automatically.
-- Trial expires when: 30 days pass OR balance reaches 0.
-- =============================================

-- 1. Add trial fields to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_active boolean NOT NULL DEFAULT false;

-- 2. Function: Auto-create trial subscription on user signup
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only create if no subscription exists yet
  IF NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = NEW.id) THEN
    INSERT INTO subscriptions (
      user_id, plan, balance_cents, service_active,
      trial_started_at, trial_ends_at, trial_active,
      included_minutes, plan_price_cents
    ) VALUES (
      NEW.id, 'trial', 2500, true,
      now(), now() + interval '30 days', true,
      100, 0
    );

    -- Log the welcome credit
    INSERT INTO billing_transactions (user_id, type, amount_cents, description)
    VALUES (NEW.id, 'credit', 2500, 'Willkommens-Guthaben (30-Tage-Testphase)');
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger on new auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_trial_subscription();

-- 4. Update plan escalation trigger to allow service_role (for webhook plan updates)
CREATE OR REPLACE FUNCTION prevent_plan_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Allow service_role (webhooks, edge functions) and superadmins
  IF OLD.plan IS DISTINCT FROM NEW.plan
     AND NOT is_superadmin()
     AND current_setting('role', true) != 'service_role'
  THEN
    RAISE EXCEPTION 'Plan change not permitted';
  END IF;
  RETURN NEW;
END;
$$;
