-- =============================================================================
-- Migration 088: Create License Plates Table + RLS Policies
-- Story: 05.1 - License Plates Table + CRUD
-- Purpose: Core inventory unit tracking for warehouse operations
-- Critical for: Epic 04 Production (material consumption & output registration)
-- =============================================================================

-- =============================================================================
-- License Plates Table - Core Inventory Unit
-- =============================================================================

CREATE TABLE IF NOT EXISTS license_plates (
  -- Identity (Phase 0)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lp_number TEXT NOT NULL,

  -- Product Reference (Phase 0)
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL CHECK (quantity >= 0),
  uom TEXT NOT NULL,

  -- Location (Phase 0)
  location_id UUID NOT NULL REFERENCES locations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Status (Phase 0)
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'consumed', 'blocked')),
  qa_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (qa_status IN ('pending', 'passed', 'failed', 'quarantine')),

  -- Tracking (Phase 0)
  batch_number TEXT,
  supplier_batch_number TEXT,
  expiry_date DATE,
  manufacture_date DATE,

  -- Source Reference (Phase 0)
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'receipt', 'production', 'return', 'adjustment', 'split')),
  po_number TEXT,

  -- Phase 1 Fields (GRN Integration)
  grn_id UUID,
  asn_id UUID,

  -- Production References (Phase 0 - Epic 04)
  wo_id UUID,
  consumed_by_wo_id UUID,
  parent_lp_id UUID REFERENCES license_plates(id),

  -- Phase 2 Fields (Catch Weight)
  catch_weight_kg DECIMAL(10,3),

  -- Phase 3 Fields (GS1)
  gtin TEXT,
  sscc TEXT,

  -- Phase 3 Fields (Pallets)
  pallet_id UUID,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT lp_org_number_unique UNIQUE(org_id, lp_number)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_lp_org_status ON license_plates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_lp_org_product ON license_plates(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_lp_org_location ON license_plates(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_lp_org_warehouse ON license_plates(org_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_lp_org_qa ON license_plates(org_id, qa_status);

-- FIFO/FEFO queries
CREATE INDEX IF NOT EXISTS idx_lp_expiry ON license_plates(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lp_created ON license_plates(created_at);

-- Search patterns
CREATE INDEX IF NOT EXISTS idx_lp_batch ON license_plates(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lp_number_search ON license_plates(org_id, lp_number text_pattern_ops);

-- Production references
CREATE INDEX IF NOT EXISTS idx_lp_wo ON license_plates(wo_id) WHERE wo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lp_consumed_by ON license_plates(consumed_by_wo_id) WHERE consumed_by_wo_id IS NOT NULL;

-- Parent reference (split/merge)
CREATE INDEX IF NOT EXISTS idx_lp_parent ON license_plates(parent_lp_id) WHERE parent_lp_id IS NOT NULL;

-- =============================================================================
-- LP Number Sequence per Organization
-- =============================================================================

CREATE TABLE IF NOT EXISTS lp_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Function to Generate Next LP Number
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_lp_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_length INT;
  v_next_val BIGINT;
  v_lp_number TEXT;
BEGIN
  -- Get settings (with defaults if not exists)
  SELECT
    COALESCE(lp_number_prefix, 'LP'),
    COALESCE(lp_number_sequence_length, 8)
  INTO v_prefix, v_length
  FROM warehouse_settings
  WHERE org_id = p_org_id;

  -- Use defaults if no settings
  IF v_prefix IS NULL THEN
    v_prefix := 'LP';
    v_length := 8;
  END IF;

  -- Upsert sequence and get next value
  INSERT INTO lp_number_sequences (org_id, current_value)
  VALUES (p_org_id, 1)
  ON CONFLICT (org_id)
  DO UPDATE SET
    current_value = lp_number_sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_next_val;

  -- Format LP number
  v_lp_number := v_prefix || LPAD(v_next_val::TEXT, v_length, '0');

  RETURN v_lp_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_lp_updated_at
BEFORE UPDATE ON license_plates
FOR EACH ROW EXECUTE FUNCTION update_lp_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE license_plates ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "lp_select_org" ON license_plates
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation + valid references
CREATE POLICY "lp_insert_org" ON license_plates
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND warehouse_id IN (
    SELECT id FROM warehouses
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND location_id IN (
    SELECT id FROM locations
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND product_id IN (
    SELECT id FROM products
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

-- Update: Org isolation + prevent consumed LP updates
CREATE POLICY "lp_update_org" ON license_plates
FOR UPDATE TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- Delete: Org isolation (soft delete preferred, but allow hard delete)
CREATE POLICY "lp_delete_org" ON license_plates
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS for sequence table
ALTER TABLE lp_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lp_seq_org" ON lp_number_sequences
FOR ALL TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
