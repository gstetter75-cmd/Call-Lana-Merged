-- =============================================
-- Call Lana: Server-side trial expiration
-- Expires trials that have passed 30 days or exhausted credit.
-- Should be called via pg_cron (hourly) or Edge Function cron trigger.
-- =============================================

CREATE OR REPLACE FUNCTION expire_stale_trials()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE subscriptions SET
    trial_active = false,
    service_active = false,
    paused_reason = CASE
      WHEN balance_cents <= 0 THEN 'trial_credit_exhausted'
      ELSE 'trial_time_expired'
    END
  WHERE trial_active = true
    AND (now() > trial_ends_at OR balance_cents <= 0);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Schedule hourly via pg_cron (if extension is available)
-- Run: SELECT cron.schedule('expire-trials', '0 * * * *', 'SELECT expire_stale_trials()');
-- Note: pg_cron must be enabled in Supabase dashboard under Extensions.

-- Cleanup old webhook events (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_webhook_events()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM webhook_events WHERE processed_at < now() - interval '7 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Schedule: SELECT cron.schedule('cleanup-webhooks', '0 3 * * *', 'SELECT cleanup_webhook_events()');
