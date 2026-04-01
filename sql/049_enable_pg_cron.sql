-- =============================================
-- Call Lana: pg_cron jobs (already deployed to live DB)
-- This file documents the cron jobs configured on the Supabase instance.
-- Run manually if setting up a new environment.
-- =============================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;

-- Hourly: expire trials past 30 days or with 0 balance
SELECT cron.schedule('expire-trials', '0 * * * *', 'SELECT expire_stale_trials()');

-- Daily at 3:00 AM: cleanup processed webhook events older than 7 days
SELECT cron.schedule('cleanup-webhooks', '0 3 * * *', 'SELECT cleanup_webhook_events()');
