-- =============================================
-- Secure role changes: only superadmins can modify user roles
-- =============================================

-- Ensure the no_role_escalation trigger function blocks non-admin role changes
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if role hasn't changed
  IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
    RETURN NEW;
  END IF;

  -- Only superadmins can change roles
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Insufficient privileges: only superadmins can change a profile role';
  END IF;

  -- Sync role to auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS no_role_escalation ON profiles;
CREATE TRIGGER no_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_escalation();

-- Remove the separate sync trigger (now combined into no_role_escalation)
DROP TRIGGER IF EXISTS sync_role_to_auth_metadata ON profiles;
