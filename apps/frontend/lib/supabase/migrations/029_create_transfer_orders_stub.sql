-- Migration 029: Create Transfer Orders Stub Table
-- Epic 2 Batch 2D - Traceability
-- Status: STUB - Full implementation will be in Epic 5 (Warehouse)
-- This is a minimal table structure for testing traceability functionality

-- Transfer Orders Table (STUB)
CREATE TABLE IF NOT EXISTS public.transfer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identifiers
  to_number VARCHAR(50) NOT NULL UNIQUE,

  -- Locations
  from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- Values: draft, released, in_transit, completed, cancelled

  -- Dates
  planned_transfer_date DATE,
  actual_transfer_date DATE,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT transfer_orders_status_check CHECK (
    status IN ('draft', 'released', 'in_transit', 'completed', 'cancelled')
  ),
  CONSTRAINT transfer_orders_different_locations CHECK (
    from_location_id IS DISTINCT FROM to_location_id
  )
);

-- Indexes
CREATE INDEX idx_transfer_orders_org ON transfer_orders(org_id);
CREATE INDEX idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX idx_transfer_orders_from_location ON transfer_orders(from_location_id) WHERE from_location_id IS NOT NULL;
CREATE INDEX idx_transfer_orders_to_location ON transfer_orders(to_location_id) WHERE to_location_id IS NOT NULL;

-- RLS Policies
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view TOs in their organization
CREATE POLICY "Users can view transfer orders in their org"
  ON transfer_orders FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- INSERT: Warehouse/Admin can create TOs
CREATE POLICY "Warehouse/Admin can create transfer orders"
  ON transfer_orders FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('warehouse', 'admin')
  );

-- UPDATE: Warehouse/Admin can update TOs
CREATE POLICY "Warehouse/Admin can update transfer orders"
  ON transfer_orders FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('warehouse', 'admin')
  );

-- DELETE: Admin only
CREATE POLICY "Admin can delete transfer orders"
  ON transfer_orders FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Trigger: Update updated_at timestamp
CREATE TRIGGER update_transfer_orders_updated_at
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE transfer_orders IS 'Transfer Orders - STUB for Epic 2 testing. Full implementation in Epic 5.';
COMMENT ON COLUMN transfer_orders.to_number IS 'Unique transfer order identifier (e.g., TO-2024-001)';
COMMENT ON COLUMN transfer_orders.status IS 'Current status: draft, released, in_transit, completed, cancelled';
