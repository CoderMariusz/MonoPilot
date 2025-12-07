-- Migration 048: Extend License Plates for Epic 5
-- Batch 05A-1: LP Core (Stories 5.1-5.4)
-- Date: 2025-12-07

-- ============================================
-- 1. Add missing columns to license_plates
-- ============================================

-- current_qty: Tracks actual qty (quantity = original, current_qty = after consumption)
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS current_qty DECIMAL(12,3);

-- Update current_qty to match quantity where null
UPDATE license_plates SET current_qty = quantity WHERE current_qty IS NULL;

-- supplier_batch_number: External batch from supplier
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS supplier_batch_number VARCHAR(50);

-- qa_status: Quality status (pending/passed/failed/on_hold)
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS qa_status VARCHAR(20) DEFAULT 'pending';

-- warehouse_id: Direct warehouse reference
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- updated_by: Who last modified
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- ============================================
-- 2. Update status constraint to include 'reserved' and 'merged'
-- ============================================

ALTER TABLE license_plates DROP CONSTRAINT IF EXISTS license_plates_status_check;
ALTER TABLE license_plates ADD CONSTRAINT license_plates_status_check
  CHECK (status IN ('available', 'reserved', 'consumed', 'shipped', 'quarantine', 'recalled', 'merged', 'split'));

-- ============================================
-- 3. Add qa_status constraint
-- ============================================

ALTER TABLE license_plates ADD CONSTRAINT license_plates_qa_status_check
  CHECK (qa_status IS NULL OR qa_status IN ('pending', 'passed', 'failed', 'on_hold'));

-- ============================================
-- 4. Add indexes for Epic 5 queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_license_plates_org_status ON license_plates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_license_plates_org_product ON license_plates(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_license_plates_expiry ON license_plates(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_license_plates_warehouse ON license_plates(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_license_plates_qa_status ON license_plates(qa_status);
CREATE INDEX IF NOT EXISTS idx_license_plates_current_qty ON license_plates(current_qty) WHERE current_qty > 0;

-- ============================================
-- 5. Create warehouse_settings table (1:1 with warehouses)
-- ============================================

CREATE TABLE IF NOT EXISTS warehouse_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL UNIQUE REFERENCES warehouses(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- LP Number Generation
  lp_number_format VARCHAR(100) DEFAULT 'LP-{WH}-{YYYYMMDD}-{NNNN}',
  lp_number_prefix VARCHAR(20) DEFAULT 'LP',

  -- Receiving Settings
  allow_over_receipt BOOLEAN DEFAULT false,
  over_receipt_tolerance_percent DECIMAL(5,2) DEFAULT 0,

  -- Label Printing
  printer_ip VARCHAR(50),
  auto_print_on_receive BOOLEAN DEFAULT false,
  copies_per_label INTEGER DEFAULT 1,

  -- Expiry Settings
  default_expiry_days INTEGER DEFAULT 365,
  expiry_warning_days INTEGER DEFAULT 30,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for warehouse_settings
ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY warehouse_settings_select ON warehouse_settings
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY warehouse_settings_insert ON warehouse_settings
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY warehouse_settings_update ON warehouse_settings
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  ) WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY warehouse_settings_delete ON warehouse_settings
  FOR DELETE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- Trigger for updated_at
CREATE TRIGGER update_warehouse_settings_updated_at
  BEFORE UPDATE ON warehouse_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Create lp_number_sequence table (per org + warehouse + date)
-- ============================================

CREATE TABLE IF NOT EXISTS lp_number_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  sequence_date DATE NOT NULL,
  next_sequence INTEGER DEFAULT 1,

  UNIQUE(org_id, warehouse_id, sequence_date)
);

-- RLS for lp_number_sequence
ALTER TABLE lp_number_sequence ENABLE ROW LEVEL SECURITY;

CREATE POLICY lp_number_sequence_select ON lp_number_sequence
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY lp_number_sequence_insert ON lp_number_sequence
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY lp_number_sequence_update ON lp_number_sequence
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 7. Function to generate LP number
-- ============================================

CREATE OR REPLACE FUNCTION generate_lp_number(
  p_org_id UUID,
  p_warehouse_id UUID,
  p_format VARCHAR DEFAULT 'LP-{WH}-{YYYYMMDD}-{NNNN}'
)
RETURNS VARCHAR AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_seq INTEGER;
  v_warehouse_code VARCHAR;
  v_lp_number VARCHAR;
BEGIN
  -- Get warehouse code
  SELECT code INTO v_warehouse_code FROM warehouses WHERE id = p_warehouse_id;

  -- Get or create sequence for today
  INSERT INTO lp_number_sequence (org_id, warehouse_id, sequence_date, next_sequence)
  VALUES (p_org_id, p_warehouse_id, v_today, 1)
  ON CONFLICT (org_id, warehouse_id, sequence_date)
  DO UPDATE SET next_sequence = lp_number_sequence.next_sequence + 1
  RETURNING next_sequence INTO v_seq;

  -- Generate LP number from format
  v_lp_number := p_format;
  v_lp_number := REPLACE(v_lp_number, '{WH}', COALESCE(v_warehouse_code, 'WH'));
  v_lp_number := REPLACE(v_lp_number, '{YYYYMMDD}', TO_CHAR(v_today, 'YYYYMMDD'));
  v_lp_number := REPLACE(v_lp_number, '{YYYY}', TO_CHAR(v_today, 'YYYY'));
  v_lp_number := REPLACE(v_lp_number, '{MM}', TO_CHAR(v_today, 'MM'));
  v_lp_number := REPLACE(v_lp_number, '{DD}', TO_CHAR(v_today, 'DD'));
  v_lp_number := REPLACE(v_lp_number, '{NNNN}', LPAD(v_seq::TEXT, 4, '0'));
  v_lp_number := REPLACE(v_lp_number, '{NNN}', LPAD(v_seq::TEXT, 3, '0'));
  v_lp_number := REPLACE(v_lp_number, '{NN}', LPAD(v_seq::TEXT, 2, '0'));

  RETURN v_lp_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Grants
-- ============================================

GRANT ALL ON warehouse_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouse_settings TO authenticated;

GRANT ALL ON lp_number_sequence TO service_role;
GRANT SELECT, INSERT, UPDATE ON lp_number_sequence TO authenticated;

GRANT EXECUTE ON FUNCTION generate_lp_number TO authenticated;
GRANT EXECUTE ON FUNCTION generate_lp_number TO service_role;

-- ============================================
-- 9. Comments
-- ============================================

COMMENT ON TABLE warehouse_settings IS 'Per-warehouse settings for LP generation, receiving, and printing';
COMMENT ON TABLE lp_number_sequence IS 'Daily sequence counter for LP number generation per warehouse';
COMMENT ON FUNCTION generate_lp_number IS 'Generates unique LP number using configurable format with daily reset';
COMMENT ON COLUMN license_plates.current_qty IS 'Current quantity after consumption (quantity = original)';
COMMENT ON COLUMN license_plates.qa_status IS 'QA status: pending, passed, failed, on_hold';
COMMENT ON COLUMN license_plates.warehouse_id IS 'Direct warehouse reference for filtering';

-- ============================================
-- 10. Verification
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_plates' AND column_name = 'current_qty')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_settings')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_number_sequence')
  THEN
    RAISE NOTICE '✓ SUCCESS: Epic 5 LP Core migration complete';
  ELSE
    RAISE EXCEPTION 'FAILED: Missing tables or columns';
  END IF;
END $$;
