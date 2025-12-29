-- Migration: Create production_lines and related junction tables
-- Story: 01.11 - Production Lines CRUD
-- Purpose: Create production lines with machine assignments and product compatibility
--
-- Features:
-- - Production line master data (code, name, warehouse, default_output_location, status)
-- - Machine assignment with sequence order (junction table: production_line_machines)
-- - Product compatibility (junction table: production_line_products)
-- - Multi-tenant with org_id
-- - Status: active, maintenance, inactive, setup
-- - Code immutability when work orders exist
-- - Capacity calculation (bottleneck = MIN(machine.units_per_hour))
-- - Audit fields (created_at, updated_at, created_by, updated_by)

-- =============================================================================
-- TABLE: production_lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Warehouse and location
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    default_output_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT production_lines_org_code_unique UNIQUE(org_id, code),
    CONSTRAINT production_lines_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
    CONSTRAINT production_lines_status_check CHECK (status IN ('active', 'maintenance', 'inactive', 'setup'))
);

-- =============================================================================
-- TABLE: production_line_machines (Junction Table)
-- =============================================================================

CREATE TABLE IF NOT EXISTS production_line_machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT plm_line_machine_unique UNIQUE(line_id, machine_id),
    CONSTRAINT plm_line_sequence_unique UNIQUE(line_id, sequence_order),
    CONSTRAINT plm_sequence_positive CHECK (sequence_order > 0)
);

-- =============================================================================
-- TABLE: production_line_products (Junction Table)
-- =============================================================================
-- COMMENTED OUT: Requires products table (will be added in Technical module migration)

-- CREATE TABLE IF NOT EXISTS production_line_products (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
--     line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

--     -- Constraints
--     CONSTRAINT plp_line_product_unique UNIQUE(line_id, product_id)
-- );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- production_lines indexes
CREATE INDEX IF NOT EXISTS idx_production_lines_org ON production_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_warehouse ON production_lines(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_status ON production_lines(status);
CREATE INDEX IF NOT EXISTS idx_production_lines_code ON production_lines(code);

-- production_line_machines indexes
CREATE INDEX IF NOT EXISTS idx_plm_line ON production_line_machines(line_id);
CREATE INDEX IF NOT EXISTS idx_plm_machine ON production_line_machines(machine_id);
CREATE INDEX IF NOT EXISTS idx_plm_sequence ON production_line_machines(line_id, sequence_order);

-- production_line_products indexes (COMMENTED OUT: table doesn't exist yet)
-- CREATE INDEX IF NOT EXISTS idx_plp_line ON production_line_products(line_id);
-- CREATE INDEX IF NOT EXISTS idx_plp_product ON production_line_products(product_id);

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_production_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_production_lines_updated_at_trigger
BEFORE UPDATE ON production_lines
FOR EACH ROW
EXECUTE FUNCTION update_production_lines_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE production_lines IS 'Production line master data with warehouse and status (Story 01.11)';
COMMENT ON COLUMN production_lines.code IS 'Unique line identifier (uppercase alphanumeric + hyphens, org-scoped)';
COMMENT ON COLUMN production_lines.status IS 'Operational status: active (default), maintenance, inactive, setup';
COMMENT ON COLUMN production_lines.warehouse_id IS 'Parent warehouse (required)';
COMMENT ON COLUMN production_lines.default_output_location_id IS 'Default output location for production (optional)';

COMMENT ON TABLE production_line_machines IS 'Machine assignments to production lines with sequence order (Story 01.11)';
COMMENT ON COLUMN production_line_machines.sequence_order IS 'Processing order (1, 2, 3... no gaps, no duplicates)';

-- COMMENT ON TABLE production_line_products IS 'Product compatibility for production lines (empty = unrestricted) (Story 01.11)';

COMMENT ON CONSTRAINT production_lines_org_code_unique ON production_lines IS 'Line codes must be unique within organization';
COMMENT ON CONSTRAINT production_lines_code_format ON production_lines IS 'Line code must be uppercase alphanumeric with hyphens';
COMMENT ON CONSTRAINT production_lines_status_check ON production_lines IS 'Status must be: active, maintenance, inactive, or setup';
COMMENT ON CONSTRAINT plm_line_machine_unique ON production_line_machines IS 'Machine can only be assigned once per line';
COMMENT ON CONSTRAINT plm_line_sequence_unique ON production_line_machines IS 'Sequence order must be unique within line';
COMMENT ON CONSTRAINT plm_sequence_positive ON production_line_machines IS 'Sequence order must start from 1';
-- COMMENT ON CONSTRAINT plp_line_product_unique ON production_line_products IS 'Product can only be assigned once per line';
