-- =============================================
-- Fix superadmin RLS policies to use is_superadmin() helper
-- instead of direct profiles table query (which causes recursive RLS)
-- =============================================

-- Also ensure the user's auth.users metadata has role = 'superadmin'
-- This is required for is_superadmin() to work
-- Run this for your admin user:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "superadmin"}'::jsonb WHERE id = '<admin-user-id>';

-- =============================================
-- FIX: customers table
-- =============================================
DROP POLICY IF EXISTS "superadmin_customers_all" ON customers;
CREATE POLICY "superadmin_customers_all" ON customers
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: organizations table
-- =============================================
DROP POLICY IF EXISTS "superadmin_full_access" ON organizations;
CREATE POLICY "superadmin_full_access" ON organizations
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: assistants table
-- =============================================
DROP POLICY IF EXISTS "superadmin_assistants_all" ON assistants;
CREATE POLICY "superadmin_assistants_all" ON assistants
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: calls table
-- =============================================
DROP POLICY IF EXISTS "superadmin_calls_all" ON calls;
CREATE POLICY "superadmin_calls_all" ON calls
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: leads table
-- =============================================
DROP POLICY IF EXISTS "superadmin_leads_all" ON leads;
CREATE POLICY "superadmin_leads_all" ON leads
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: tasks table
-- =============================================
DROP POLICY IF EXISTS "superadmin_tasks_all" ON tasks;
CREATE POLICY "superadmin_tasks_all" ON tasks
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: notes table
-- =============================================
DROP POLICY IF EXISTS "superadmin_notes_all" ON notes;
CREATE POLICY "superadmin_notes_all" ON notes
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: availability table
-- =============================================
DROP POLICY IF EXISTS "superadmin_availability_all" ON availability;
CREATE POLICY "superadmin_availability_all" ON availability
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: user_settings table
-- =============================================
DROP POLICY IF EXISTS "superadmin_settings_all" ON user_settings;
CREATE POLICY "superadmin_settings_all" ON user_settings
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: messages table
-- =============================================
DROP POLICY IF EXISTS "superadmin_messages_all" ON messages;
CREATE POLICY "superadmin_messages_all" ON messages
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: conversations table
-- =============================================
DROP POLICY IF EXISTS "superadmin_conversations_all" ON conversations;
CREATE POLICY "superadmin_conversations_all" ON conversations
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: conversation_participants table
-- =============================================
DROP POLICY IF EXISTS "superadmin_conv_participants_all" ON conversation_participants;
CREATE POLICY "superadmin_conv_participants_all" ON conversation_participants
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: call_protocols table
-- =============================================
DROP POLICY IF EXISTS "superadmin_call_protocols_all" ON call_protocols;
CREATE POLICY "superadmin_call_protocols_all" ON call_protocols
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: customer_tags table
-- =============================================
DROP POLICY IF EXISTS "superadmin_customer_tags_all" ON customer_tags;
CREATE POLICY "superadmin_customer_tags_all" ON customer_tags
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: customer_tag_assignments table
-- =============================================
DROP POLICY IF EXISTS "superadmin_tag_assignments_all" ON customer_tag_assignments;
CREATE POLICY "superadmin_tag_assignments_all" ON customer_tag_assignments
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: customer_activities table
-- =============================================
DROP POLICY IF EXISTS "superadmin_customer_activities_all" ON customer_activities;
CREATE POLICY "superadmin_customer_activities_all" ON customer_activities
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: lead_scores table
-- =============================================
DROP POLICY IF EXISTS "superadmin_lead_scores_all" ON lead_scores;
CREATE POLICY "superadmin_lead_scores_all" ON lead_scores
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: working_hours table
-- =============================================
DROP POLICY IF EXISTS "superadmin_working_hours_all" ON working_hours;
CREATE POLICY "superadmin_working_hours_all" ON working_hours
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: time_off_requests table
-- =============================================
DROP POLICY IF EXISTS "superadmin_time_off_all" ON time_off_requests;
CREATE POLICY "superadmin_time_off_all" ON time_off_requests
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: webhook_configs table
-- =============================================
DROP POLICY IF EXISTS "superadmin_webhooks_all" ON webhook_configs;
CREATE POLICY "superadmin_webhooks_all" ON webhook_configs
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: kpi_goals table
-- =============================================
DROP POLICY IF EXISTS "superadmin_goals_all" ON kpi_goals;
CREATE POLICY "superadmin_goals_all" ON kpi_goals
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: announcements table
-- =============================================
DROP POLICY IF EXISTS "superadmin_announcements_all" ON announcements;
CREATE POLICY "superadmin_announcements_all" ON announcements
  FOR ALL USING (is_superadmin());

-- =============================================
-- FIX: audit_log table
-- =============================================
DROP POLICY IF EXISTS "superadmin_audit_all" ON audit_log;
CREATE POLICY "superadmin_audit_all" ON audit_log
  FOR ALL USING (is_superadmin());

-- =============================================
-- CRITICAL: Ensure admin user has role in auth.users metadata
-- Without this, is_superadmin() will always return false!
-- =============================================
-- Run this separately with your admin user's ID:
-- UPDATE auth.users
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "superadmin"}'::jsonb
-- WHERE email = 'g.stetter@gmx.net';
