-- =============================================
-- Call Lana: Add vapi_call_id to calls table
-- Enables reliable call identification in webhook handlers
-- instead of fragile phone_number matching.
-- =============================================

ALTER TABLE calls ADD COLUMN IF NOT EXISTS vapi_call_id text;

-- Unique constraint: each VAPI call should only have one record
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_vapi_call_id
  ON calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;

-- Performance index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id_lookup
  ON calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;
