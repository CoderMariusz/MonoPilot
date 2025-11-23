-- Migration 028: Create Work Orders Stub Table
-- Epic 2 Batch 2D - Traceability
-- Status: STUB - Full implementation will be in Epic 3 (Production)
-- This is a minimal table structure for testing traceability functionality

-- Work Orders Table (STUB)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identifiers
  wo_number VARCHAR(50) NOT NULL UNIQUE,

  -- Product to Produce
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantities
  planned_quantity DECIMAL(12,3) NOT NULL,
  produced_quantity DECIMAL(12,3) DEFAULT 0,
  uom VARCHAR(10) NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- Values: draft, released, in_progress, completed, closed, cancelled

  -- Dates
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,

  -- Location (stub)
  production_line_id UUID REFERENCES machines(id) ON DELETE SET NULL,

  -- Routing (stub)
  routing_id UUID,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT work_orders_status_check CHECK (
    status IN ('draft', 'released', 'in_progress', 'completed', 'closed', 'cancelled')
  ),
  CONSTRAINT work_orders_planned_quantity_positive CHECK (planned_quantity > 0),
  CONSTRAINT work_orders_produced_quantity_non_negative CHECK (produced_quantity >= 0)
);

-- Indexes
CREATE INDEX idx_work_orders_org ON work_orders(org_id);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_dates ON work_orders(planned_start_date, planned_end_date);

-- RLS Policies
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view WOs in their organization
CREATE POLICY "Users can view work orders in their org"
  ON work_orders FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- INSERT: Production/Technical/Admin can create WOs
CREATE POLICY "Production/Technical/Admin can create work orders"
  ON work_orders FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('production', 'technical', 'admin')
  );

-- UPDATE: Production/Technical/Admin can update WOs
CREATE POLICY "Production/Technical/Admin can update work orders"
  ON work_orders FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('production', 'technical', 'admin')
  );

-- DELETE: Admin only
CREATE POLICY "Admin can delete work orders"
  ON work_orders FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Trigger: Update updated_at timestamp
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE work_orders IS 'Work Orders - STUB for Epic 2 testing. Full implementation in Epic 3.';
COMMENT ON COLUMN work_orders.wo_number IS 'Unique work order identifier (e.g., WO-2024-001)';
COMMENT ON COLUMN work_orders.status IS 'Current status: draft, released, in_progress, completed, closed, cancelled';
