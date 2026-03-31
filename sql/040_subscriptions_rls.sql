-- =============================================
-- Call Lana: Add RLS policies to subscriptions table
-- Fixes 403 error when customers access their subscription data
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "users_read_own_subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own subscription (e.g. auto-reload settings)
CREATE POLICY "users_update_own_subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Superadmins can do everything
CREATE POLICY "superadmin_subscriptions_all" ON subscriptions
  FOR ALL USING (is_superadmin());

-- Note: INSERT/DELETE restricted to superadmins only (subscriptions are created
-- by the system via stripe-webhook, not by users directly)
