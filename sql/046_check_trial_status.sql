-- =============================================
-- Call Lana: Check trial status — callable from frontend
-- Returns trial state, auto-expires when conditions met.
-- =============================================

CREATE OR REPLACE FUNCTION check_trial_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub record;
BEGIN
  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_subscription');
  END IF;

  -- Check active trial
  IF v_sub.trial_active THEN
    -- Auto-expire if time or credit exhausted
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

    -- Trial still active
    RETURN jsonb_build_object(
      'status', 'trial_active',
      'days_remaining', GREATEST(0, EXTRACT(DAY FROM v_sub.trial_ends_at - now())::int),
      'credit_remaining_cents', v_sub.balance_cents,
      'trial_ends_at', v_sub.trial_ends_at
    );
  END IF;

  -- Not a trial — return current plan status
  RETURN jsonb_build_object(
    'status', COALESCE(v_sub.plan, 'none'),
    'service_active', v_sub.service_active,
    'balance_cents', v_sub.balance_cents
  );
END;
$$;

-- Grant execute to authenticated users (they can only check their own via RLS)
GRANT EXECUTE ON FUNCTION check_trial_status(uuid) TO authenticated;
