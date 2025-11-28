-- Migration 035: Work Order Materials, Operations, and Status Lifecycle
-- Epic 3 Batch 3C: Work Orders & Lifecycle Settings
-- Stories: 3.12, 3.14, 3.15, 3.16, 3.19, 3.20
-- Date: 2025-01-28

-- ============================================================================
-- 1. WO_MATERIALS Table (Story 3.12 - Materials Snapshot)
-- Immutable copy of BOM items at WO creation time
-- ============================================================================

CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Product reference (immutable snapshot)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_code VARCHAR(50) NOT NULL,  -- Snapshot at creation
  product_name VARCHAR(255) NOT NULL, -- Snapshot at creation

  -- Quantities
  quantity_per DECIMAL(15,6) NOT NULL,  -- Per output unit
  quantity_required DECIMAL(15,6) NOT NULL,  -- Total = quantity_per * WO.planned_quantity
  quantity_issued DECIMAL(15,6) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,

  -- BOM reference (for traceability)
  bom_id UUID REFERENCES boms(id) ON DELETE SET NULL,
  bom_item_id UUID REFERENCES bom_items(id) ON DELETE SET NULL,

  -- Sequence/order
  line_number INTEGER NOT NULL DEFAULT 1,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_materials_quantity_per_positive CHECK (quantity_per > 0),
  CONSTRAINT wo_materials_quantity_required_positive CHECK (quantity_required > 0),
  CONSTRAINT wo_materials_quantity_issued_non_negative CHECK (quantity_issued >= 0)
);

-- Indexes
CREATE INDEX idx_wo_materials_work_order ON wo_materials(work_order_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);
CREATE INDEX idx_wo_materials_org ON wo_materials(org_id);

-- RLS
ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY wo_materials_isolation ON wo_materials
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE wo_materials IS 'Immutable BOM snapshot for Work Orders - Story 3.12';
COMMENT ON COLUMN wo_materials.product_code IS 'Snapshot of product code at WO creation';
COMMENT ON COLUMN wo_materials.quantity_per IS 'Quantity per output unit from BOM';
COMMENT ON COLUMN wo_materials.quantity_required IS 'Total required = quantity_per * planned_quantity';

-- Trigger: Update updated_at
CREATE TRIGGER update_wo_materials_updated_at
  BEFORE UPDATE ON wo_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. WO_OPERATIONS Table (Story 3.14 - Routing Operations Copy)
-- Copy of routing operations for tracking progress
-- ============================================================================

CREATE TABLE wo_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Operation details (from routing)
  operation_number INTEGER NOT NULL,
  operation_name VARCHAR(255) NOT NULL,
  work_center_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  work_center_name VARCHAR(255),  -- Snapshot

  -- Times (from routing)
  setup_time_minutes DECIMAL(10,2) DEFAULT 0,
  run_time_minutes DECIMAL(10,2) DEFAULT 0,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Quantities
  quantity_completed DECIMAL(15,3) DEFAULT 0,
  quantity_scrapped DECIMAL(15,3) DEFAULT 0,

  -- Routing reference
  routing_id UUID,
  routing_operation_id UUID,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_operations_status_check CHECK (
    status IN ('pending', 'in_progress', 'completed', 'skipped')
  ),
  CONSTRAINT wo_operations_times_non_negative CHECK (
    setup_time_minutes >= 0 AND run_time_minutes >= 0
  )
);

-- Indexes
CREATE INDEX idx_wo_operations_work_order ON wo_operations(work_order_id);
CREATE INDEX idx_wo_operations_status ON wo_operations(status);
CREATE INDEX idx_wo_operations_org ON wo_operations(org_id);

-- RLS
ALTER TABLE wo_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY wo_operations_isolation ON wo_operations
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE wo_operations IS 'Routing operations copy for Work Orders - Story 3.14';
COMMENT ON COLUMN wo_operations.operation_number IS 'Sequence number from routing';
COMMENT ON COLUMN wo_operations.work_center_name IS 'Snapshot of work center name';

-- Trigger: Update updated_at
CREATE TRIGGER update_wo_operations_updated_at
  BEFORE UPDATE ON wo_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. Work Orders - Add missing columns (Stories 3.14, 3.16)
-- ============================================================================

-- Add source tracking columns (Story 3.16)
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_id UUID;

-- Add line_id for production line (Story 3.14, 3.21)
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL;

-- Add constraint for source_type
ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_source_type_check CHECK (
    source_type IN ('manual', 'purchase_order', 'customer_order', 'forecast', 'mrp')
  );

-- Index for line_id
CREATE INDEX IF NOT EXISTS idx_work_orders_line ON work_orders(line_id);

COMMENT ON COLUMN work_orders.source_type IS 'Origin: manual, purchase_order, customer_order, forecast, mrp';
COMMENT ON COLUMN work_orders.source_reference IS 'Reference number from source (e.g., PO number)';
COMMENT ON COLUMN work_orders.source_id IS 'UUID of source document';
COMMENT ON COLUMN work_orders.line_id IS 'Production line for Gantt grouping';

-- ============================================================================
-- 4. Transfer Orders - Add missing columns (Story 3.20)
-- ============================================================================

ALTER TABLE transfer_orders
  ADD COLUMN IF NOT EXISTS actual_ship_date DATE,
  ADD COLUMN IF NOT EXISTS actual_receive_date DATE,
  ADD COLUMN IF NOT EXISTS shipped_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id);

COMMENT ON COLUMN transfer_orders.actual_ship_date IS 'Actual shipment date';
COMMENT ON COLUMN transfer_orders.actual_receive_date IS 'Actual receive date';
COMMENT ON COLUMN transfer_orders.shipped_by IS 'User who shipped the transfer';
COMMENT ON COLUMN transfer_orders.received_by IS 'User who received the transfer';

-- ============================================================================
-- 5. PO Status History (Story 3.19)
-- ============================================================================

CREATE TABLE po_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_status_history_po ON po_status_history(po_id);
CREATE INDEX idx_po_status_history_org ON po_status_history(org_id);

-- RLS
ALTER TABLE po_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_status_history_isolation ON po_status_history
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE po_status_history IS 'PO status change audit trail - Story 3.19';

-- ============================================================================
-- 6. TO Status History (Story 3.20)
-- ============================================================================

CREATE TABLE to_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  to_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,

  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_to_status_history_to ON to_status_history(to_id);
CREATE INDEX idx_to_status_history_org ON to_status_history(org_id);

-- RLS
ALTER TABLE to_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY to_status_history_isolation ON to_status_history
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE to_status_history IS 'TO status change audit trail - Story 3.20';

-- ============================================================================
-- 7. Planning Settings - Add WO/TO settings (Stories 3.15, 3.20, 3.22)
-- ============================================================================

ALTER TABLE planning_settings
  -- WO Statuses (Story 3.15)
  ADD COLUMN IF NOT EXISTS wo_statuses JSONB NOT NULL DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "planned", "label": "Planned", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "released", "label": "Released", "color": "indigo", "is_default": false, "sequence": 3},
    {"code": "in_progress", "label": "In Progress", "color": "yellow", "is_default": false, "sequence": 4},
    {"code": "completed", "label": "Completed", "color": "green", "is_default": false, "sequence": 5},
    {"code": "closed", "label": "Closed", "color": "purple", "is_default": false, "sequence": 6},
    {"code": "cancelled", "label": "Cancelled", "color": "red", "is_default": false, "sequence": 7}
  ]'::jsonb,

  ADD COLUMN IF NOT EXISTS wo_default_status VARCHAR(50) DEFAULT 'draft',

  -- TO Statuses (Story 3.20)
  ADD COLUMN IF NOT EXISTS to_statuses JSONB NOT NULL DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "pending", "label": "Pending", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "in_transit", "label": "In Transit", "color": "yellow", "is_default": false, "sequence": 3},
    {"code": "received", "label": "Received", "color": "green", "is_default": false, "sequence": 4},
    {"code": "cancelled", "label": "Cancelled", "color": "red", "is_default": false, "sequence": 5}
  ]'::jsonb,

  ADD COLUMN IF NOT EXISTS to_default_status VARCHAR(50) DEFAULT 'draft',

  -- Gantt settings (Story 3.21)
  ADD COLUMN IF NOT EXISTS wo_gantt_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS wo_gantt_group_by VARCHAR(20) DEFAULT 'production_line';

COMMENT ON COLUMN planning_settings.wo_statuses IS 'JSONB array of custom WO statuses - Story 3.15';
COMMENT ON COLUMN planning_settings.to_statuses IS 'JSONB array of custom TO statuses - Story 3.20';
COMMENT ON COLUMN planning_settings.wo_gantt_group_by IS 'Gantt grouping: production_line, product, status';
