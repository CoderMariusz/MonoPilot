-- Migration 027: Create License Plates Stub Table
-- Epic 2 Batch 2D - Traceability
-- Status: STUB - Full implementation will be in Epic 5 (Warehouse)
-- This is a minimal table structure for testing traceability functionality

-- License Plates Table (STUB)
CREATE TABLE IF NOT EXISTS public.license_plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identifiers
  lp_number VARCHAR(50) NOT NULL UNIQUE,
  batch_number VARCHAR(50),

  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantity
  quantity DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  -- Values: available, consumed, shipped, quarantine, recalled

  -- Location (stub - full implementation in Epic 5)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Dates
  manufacturing_date DATE,
  expiry_date DATE,
  received_date DATE,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT license_plates_status_check CHECK (
    status IN ('available', 'consumed', 'shipped', 'quarantine', 'recalled')
  ),
  CONSTRAINT license_plates_quantity_positive CHECK (quantity > 0)
);

-- Indexes
CREATE INDEX idx_license_plates_org ON license_plates(org_id);
CREATE INDEX idx_license_plates_product ON license_plates(product_id);
CREATE INDEX idx_license_plates_batch ON license_plates(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_license_plates_status ON license_plates(status);
CREATE INDEX idx_license_plates_location ON license_plates(location_id) WHERE location_id IS NOT NULL;

-- RLS Policies
ALTER TABLE license_plates ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view LPs in their organization
CREATE POLICY "Users can view license plates in their org"
  ON license_plates FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- INSERT: Technical/Admin can create LPs
CREATE POLICY "Technical/Admin can create license plates"
  ON license_plates FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse')
  );

-- UPDATE: Technical/Admin can update LPs
CREATE POLICY "Technical/Admin can update license plates"
  ON license_plates FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse')
  );

-- DELETE: Admin only
CREATE POLICY "Admin can delete license plates"
  ON license_plates FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Trigger: Update updated_at timestamp
CREATE TRIGGER update_license_plates_updated_at
  BEFORE UPDATE ON license_plates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE license_plates IS 'License Plates (LP) - STUB for Epic 2 testing. Full implementation in Epic 5.';
COMMENT ON COLUMN license_plates.lp_number IS 'Unique LP identifier (e.g., LP-2024-001)';
COMMENT ON COLUMN license_plates.batch_number IS 'Batch number for traceability';
COMMENT ON COLUMN license_plates.status IS 'Current status: available, consumed, shipped, quarantine, recalled';
