-- =============================================
-- Fix infinite recursion in conversation_participants RLS
-- The old policy referenced its own table causing recursion
-- =============================================

DROP POLICY IF EXISTS "users_read_own_participation" ON conversation_participants;
CREATE POLICY "users_read_own_participation" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_participation" ON conversation_participants;
CREATE POLICY "users_manage_participation" ON conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Remove duplicate superadmin policy
DROP POLICY IF EXISTS "superadmin_participants_all" ON conversation_participants;
