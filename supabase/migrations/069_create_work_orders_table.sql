-- Migration: Create work_orders table
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: Work orders header table for production scheduling
-- RLS: Per-organization isolation using ADR-013 pattern

-- ============================================================================
-- TABLE: work_orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS work_orders (
  -- Core fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_number VARCHAR(20) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  bom_id UUID REFERENCES boms(id) ON DELETE RESTRICT,
  routing_id UUID REFERENCES routings(id) ON DELETE RESTRICT,

  -- Quantity
  planned_quantity DECIMAL(15,4) NOT NULL CHECK (planned_quantity > 0),
  produced_quantity DECIMAL(15,4) DEFAULT 0 CHECK (produced_quantity >= 0),
  uom VARCHAR(20) NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planned', 'released', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled')),

  -- Scheduling dates
  planned_start_date DATE,
  planned_end_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,

  -- Assignments
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,

  -- Priority & Source
  priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  source_of_demand VARCHAR(30)
    CHECK (source_of_demand IS NULL OR source_of_demand IN ('manual', 'po', 'customer_order', 'forecast')),
  source_reference VARCHAR(50),

  -- Execution tracking (updated by Production module)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  actual_qty DECIMAL(15,4),
  yield_percent DECIMAL(5,2),

  -- WO expiry
  expiry_date DATE,

  -- Notes
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT wo_org_number_unique UNIQUE(org_id, wo_number)
);

-- Comments
COMMENT ON TABLE work_orders IS 'Work orders for production scheduling (Story 03.10)';
COMMENT ON COLUMN work_orders.wo_number IS 'WO number format: WO-YYYYMMDD-NNNN with daily reset per org';
COMMENT ON COLUMN work_orders.status IS 'Lifecycle: draft -> planned -> released -> in_progress -> completed -> closed';
COMMENT ON COLUMN work_orders.planned_quantity IS 'Quantity to produce, must be > 0';
COMMENT ON COLUMN work_orders.produced_quantity IS 'Actually produced quantity, updated by Production';
COMMENT ON COLUMN work_orders.priority IS 'Scheduling priority: low, normal, high, critical';
COMMENT ON COLUMN work_orders.source_of_demand IS 'Origin: manual, po, customer_order, forecast';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wo_org_status ON work_orders(org_id, status);
CREATE INDEX IF NOT EXISTS idx_wo_org_date ON work_orders(org_id, planned_start_date);
CREATE INDEX IF NOT EXISTS idx_wo_product ON work_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_wo_bom ON work_orders(bom_id) WHERE bom_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wo_line ON work_orders(production_line_id) WHERE production_line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wo_machine ON work_orders(machine_id) WHERE machine_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders(org_id, priority);
CREATE INDEX IF NOT EXISTS idx_wo_created_at ON work_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wo_number ON work_orders(wo_number);

-- ============================================================================
-- ENABLE RLS (policies in separate migration)
-- ============================================================================

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
