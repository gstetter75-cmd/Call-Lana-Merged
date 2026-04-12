-- =============================================
-- Ensure 100% RLS coverage on all public tables
-- =============================================

-- onboarding_progress: add superadmin policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'superadmin_onboarding_all') THEN
    CREATE POLICY "superadmin_onboarding_all" ON onboarding_progress FOR ALL USING (is_superadmin());
  END IF;
END $$;

-- webhook_events: enable RLS + add policies
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'superadmin_webhook_events_all') THEN
    CREATE POLICY "superadmin_webhook_events_all" ON webhook_events FOR ALL USING (is_superadmin());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_insert_webhook_events') THEN
    CREATE POLICY "service_insert_webhook_events" ON webhook_events FOR INSERT WITH CHECK (true);
  END IF;
END $$;
