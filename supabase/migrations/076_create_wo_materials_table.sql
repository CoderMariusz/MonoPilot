-- Migration: Create wo_materials table (Story 03.11a)
-- Purpose: BOM snapshot for Work Orders - stores scaled quantities from BOM
-- Pattern: ADR-013 (RLS org isolation using users table lookup)
-- Status: IMMUTABLE after WO released (delete blocked by RLS)

-- ============================================================================
-- TABLE: wo_materials
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_materials (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Material info (denormalized for snapshot)
  material_name TEXT NOT NULL,

  -- Quantities
  required_qty DECIMAL(15,6) NOT NULL,
  consumed_qty DECIMAL(15,6) DEFAULT 0,
  reserved_qty DECIMAL(15,6) DEFAULT 0,

  -- Unit of measure
  uom TEXT NOT NULL,

  -- Display order
  sequence INTEGER DEFAULT 0,

  -- Consumption flags
  consume_whole_lp BOOLEAN DEFAULT false,

  -- By-product handling
  is_by_product BOOLEAN DEFAULT false,
  yield_percent DECIMAL(5,2),
  scrap_percent DECIMAL(5,2) DEFAULT 0,

  -- Conditional items (Phase 1)
  condition_flags JSONB,

  -- Audit trail
  bom_item_id UUID,
  bom_version INTEGER,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_required_qty CHECK (required_qty >= 0),
  CONSTRAINT chk_consumed_qty CHECK (consumed_qty >= 0),
  CONSTRAINT chk_reserved_qty CHECK (reserved_qty >= 0),
  CONSTRAINT chk_scrap_percent CHECK (scrap_percent >= 0 AND scrap_percent <= 100)
);

-- Comments
COMMENT ON TABLE wo_materials IS 'BOM snapshot for Work Orders - immutable after release (Story 03.11a)';
COMMENT ON COLUMN wo_materials.material_name IS 'Denormalized from products.name for snapshot preservation';
COMMENT ON COLUMN wo_materials.required_qty IS 'Scaled from BOM using formula: (wo_qty / bom_output_qty) * item_qty * (1 + scrap_percent/100)';
COMMENT ON COLUMN wo_materials.consumed_qty IS 'Updated by Epic 04 Production during consumption';
COMMENT ON COLUMN wo_materials.reserved_qty IS 'Populated by Story 03.11b Material Reservation';
COMMENT ON COLUMN wo_materials.is_by_product IS 'By-products have required_qty = 0, yield_percent preserved';
COMMENT ON COLUMN wo_materials.bom_item_id IS 'Reference to source bom_item for audit trail';
COMMENT ON COLUMN wo_materials.bom_version IS 'BOM version at snapshot time for audit';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_product ON wo_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_org ON wo_materials(organization_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (ADR-013 pattern)
-- ============================================================================

-- SELECT: Users can only read materials from their own organization
CREATE POLICY "wo_materials_org_isolation" ON wo_materials
FOR SELECT TO authenticated
USING (organization_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Only authorized roles can insert materials
CREATE POLICY "wo_materials_insert" ON wo_materials
FOR INSERT TO authenticated
WITH CHECK (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'planner', 'production_manager')
  )
);

-- UPDATE: Authorized roles can update (e.g., consumed_qty during production)
CREATE POLICY "wo_materials_update" ON wo_materials
FOR UPDATE TO authenticated
USING (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'planner', 'production_manager', 'production_operator')
  )
);

-- DELETE: Only allowed for draft/planned WOs by authorized roles
CREATE POLICY "wo_materials_delete" ON wo_materials
FOR DELETE TO authenticated
USING (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = wo_materials.wo_id
    AND wo.status IN ('draft', 'planned')
  )
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'planner')
  )
);
