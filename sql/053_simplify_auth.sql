-- =============================================
-- Simplify auth: is_superadmin() reads profiles.role directly
-- No more dependency on JWT token refresh for role checks
-- =============================================

-- New is_superadmin(): reads profiles.role directly (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Also create is_sales() helper for sales-specific policies
CREATE OR REPLACE FUNCTION is_sales_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'sales')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Simplify role change trigger: only update profiles.role
-- No more sync to auth.users.raw_user_meta_data needed
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
    RETURN NEW;
  END IF;

  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Insufficient privileges: only superadmins can change a profile role';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
