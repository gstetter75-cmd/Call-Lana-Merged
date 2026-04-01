-- =============================================
-- Call Lana: Secure atomic_balance_topup — only callable by service_role
-- Prevents clients from adding balance without paying through Stripe.
-- The Stripe webhook (running as service_role) is the only legitimate caller.
-- =============================================

REVOKE EXECUTE ON FUNCTION atomic_balance_topup(uuid, integer) FROM authenticated, anon;
