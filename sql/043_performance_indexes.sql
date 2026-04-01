-- =============================================
-- Call Lana: Performance indexes for common query patterns
-- =============================================

-- Invoice period lookups (used in generate_monthly_invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_period
  ON invoices(period_start, period_end);

-- Appointment lookups by user + date (dashboard calendar view)
CREATE INDEX IF NOT EXISTS idx_appointments_user_date
  ON customer_appointments(user_id, appointment_date);

-- Call protocol lookups by customer (customer detail view)
CREATE INDEX IF NOT EXISTS idx_call_protocols_customer_date
  ON call_protocols(customer_id, called_at DESC);

-- Organization member role lookups (RLS policy evaluation)
CREATE INDEX IF NOT EXISTS idx_org_members_org_role
  ON organization_members(organization_id, role_in_org);

-- Lead scoring lookups
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead
  ON lead_scores(lead_id, calculated_at DESC);

-- Customer activity timeline (customer detail view)
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer
  ON customer_activities(customer_id, created_at DESC);

-- Notes by customer (customer detail view)
CREATE INDEX IF NOT EXISTS idx_notes_customer
  ON notes(customer_id, created_at DESC);
