-- =============================================
-- Call Lana: Secure public lead insert policy
-- Replaces the overly permissive WITH CHECK (true) policy.
-- Only allows anonymous inserts with safe defaults —
-- prevents setting status, assigned_to, organization_id, or value.
-- =============================================

-- Drop the old permissive policy
DROP POLICY IF EXISTS "public_insert_leads" ON leads;

-- New policy: only allow insert if dangerous fields are not set
-- This ensures anonymous users can only create basic leads,
-- not assign themselves to orgs or manipulate status/value.
CREATE POLICY "public_insert_leads_safe" ON leads
  FOR INSERT
  WITH CHECK (
    -- Must provide company_name (NOT NULL anyway)
    company_name IS NOT NULL
    -- Anonymous inserts must not set privileged fields
    AND assigned_to IS NULL
    AND organization_id IS NULL
    AND status = 'new'
    AND (value IS NULL OR value = 0)
  );
