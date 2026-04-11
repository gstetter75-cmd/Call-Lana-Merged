-- =============================================
-- Cleanup: replace all remaining raw_user_meta_data policies
-- with is_superadmin() / is_sales_or_admin() helpers
-- =============================================

-- Fix customer_tags read policy
DROP POLICY IF EXISTS "read_tags" ON customer_tags;
CREATE POLICY "read_tags" ON customer_tags FOR SELECT USING (is_sales_or_admin());

-- Fix customer_tag_assignments policy
DROP POLICY IF EXISTS "manage_tag_assignments" ON customer_tag_assignments;
CREATE POLICY "manage_tag_assignments" ON customer_tag_assignments FOR ALL USING (is_sales_or_admin());

-- Fix email_templates read policy
DROP POLICY IF EXISTS "read_email_templates" ON email_templates;
CREATE POLICY "read_email_templates" ON email_templates FOR SELECT USING (is_sales_or_admin());

-- Fix kpi_goals read policy
DROP POLICY IF EXISTS "read_goals" ON kpi_goals;
CREATE POLICY "read_goals" ON kpi_goals FOR SELECT USING (is_sales_or_admin());

-- Remove duplicate subscriptions superadmin policy (old pattern)
DROP POLICY IF EXISTS "superadmin_subscriptions" ON subscriptions;

-- Fix error_logs superadmin policy
DROP POLICY IF EXISTS "superadmin_error_logs_all" ON error_logs;
CREATE POLICY "superadmin_error_logs_all" ON error_logs FOR ALL USING (is_superadmin());
