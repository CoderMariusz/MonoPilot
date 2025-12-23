-- Migration: Create locations table with hierarchical structure
-- Story: 01.9 - Warehouse Locations Management
-- Purpose: Hierarchical storage locations within warehouses (zone > aisle > rack > bin)
--
-- Features:
-- - 4-level hierarchy: zone (1) > aisle (2) > rack (3) > bin (4)
-- - Self-referencing parent_id for tree structure
-- - Auto-computed full_path (e.g., 'WH-001/ZONE-A/A01/R01/B001')
-- - Auto-computed depth (1-4)
-- - Capacity tracking (max/current pallets and weight)
-- - Location type classification (bulk, pallet, shelf, floor, staging)
-- - Hierarchical validation triggers
-- - Multi-tenant with org_id
-- - Audit fields

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Location level enum (hierarchical levels)
CREATE TYPE location_level AS ENUM ('zone', 'aisle', 'rack', 'bin');

-- Location type enum (storage type classification)
CREATE TYPE location_type AS ENUM ('bulk', 'pallet', 'shelf', 'floor', 'staging');

-- =============================================================================
-- TABLE: locations
-- =============================================================================

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES locations(id) ON DELETE RESTRICT,

    -- Basic fields
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Hierarchy fields
    level location_level NOT NULL,
    full_path VARCHAR(500),  -- Auto-computed: WH-001/ZONE-A/A01/R01/B001
    depth INT NOT NULL DEFAULT 1,

    -- Classification
    location_type location_type NOT NULL DEFAULT 'shelf',

    -- Capacity fields
    max_pallets INT,
    max_weight_kg DECIMAL(12,2),
    current_pallets INT DEFAULT 0,
    current_weight_kg DECIMAL(12,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT locations_org_warehouse_code_unique UNIQUE(org_id, warehouse_id, code),
    CONSTRAINT locations_depth_check CHECK(depth BETWEEN 1 AND 4),
    CONSTRAINT locations_max_pallets_check CHECK(max_pallets IS NULL OR max_pallets > 0),
    CONSTRAINT locations_max_weight_check CHECK(max_weight_kg IS NULL OR max_weight_kg > 0),
    CONSTRAINT locations_current_pallets_check CHECK(current_pallets >= 0),
    CONSTRAINT locations_current_weight_check CHECK(current_weight_kg >= 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse_id ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_level ON locations(level);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_full_path ON locations(full_path);
CREATE INDEX IF NOT EXISTS idx_locations_org_warehouse ON locations(org_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_warehouse_active ON locations(org_id, warehouse_id, is_active);

-- =============================================================================
-- TRIGGER FUNCTION: Compute full_path and depth
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_location_full_path()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_path VARCHAR(500);
    v_parent_depth INT;
    v_warehouse_code VARCHAR(20);
BEGIN
    -- If this is a root location (no parent)
    IF NEW.parent_id IS NULL THEN
        -- Get warehouse code
        SELECT code INTO v_warehouse_code
        FROM warehouses
        WHERE id = NEW.warehouse_id;

        -- Set full_path = warehouse_code/location_code
        NEW.full_path := v_warehouse_code || '/' || NEW.code;
        NEW.depth := 1;
    ELSE
        -- Get parent's full_path and depth
        SELECT full_path, depth INTO v_parent_path, v_parent_depth
        FROM locations
        WHERE id = NEW.parent_id;

        -- Set full_path = parent_path/location_code
        NEW.full_path := v_parent_path || '/' || NEW.code;
        NEW.depth := v_parent_depth + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_location_path
BEFORE INSERT OR UPDATE OF parent_id, code ON locations
FOR EACH ROW
EXECUTE FUNCTION compute_location_full_path();

-- =============================================================================
-- TRIGGER FUNCTION: Validate location hierarchy
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_location_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_level location_level;
BEGIN
    -- Root locations (no parent) must be zones
    IF NEW.parent_id IS NULL THEN
        IF NEW.level != 'zone' THEN
            RAISE EXCEPTION 'Root locations must be zones (level=zone)';
        END IF;
        RETURN NEW;
    END IF;

    -- Get parent's level
    SELECT level INTO v_parent_level
    FROM locations
    WHERE id = NEW.parent_id;

    -- Validate parent-child level relationships
    IF v_parent_level = 'zone' THEN
        IF NEW.level != 'aisle' THEN
            RAISE EXCEPTION 'Locations under zones must be aisles (level=aisle)';
        END IF;
    ELSIF v_parent_level = 'aisle' THEN
        IF NEW.level != 'rack' THEN
            RAISE EXCEPTION 'Locations under aisles must be racks (level=rack)';
        END IF;
    ELSIF v_parent_level = 'rack' THEN
        IF NEW.level != 'bin' THEN
            RAISE EXCEPTION 'Locations under racks must be bins (level=bin)';
        END IF;
    ELSIF v_parent_level = 'bin' THEN
        RAISE EXCEPTION 'Bins cannot have child locations';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_location_hierarchy
BEFORE INSERT OR UPDATE OF parent_id, level ON locations
FOR EACH ROW
EXECUTE FUNCTION validate_location_hierarchy();

-- =============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at_trigger
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE locations IS 'Hierarchical storage locations within warehouses (Story 01.9)';
COMMENT ON COLUMN locations.code IS 'Unique location code within warehouse (e.g., ZONE-A, A01, R01, B001)';
COMMENT ON COLUMN locations.level IS 'Hierarchical level: zone (1) > aisle (2) > rack (3) > bin (4)';
COMMENT ON COLUMN locations.full_path IS 'Auto-computed full path (e.g., WH-001/ZONE-A/A01/R01/B001)';
COMMENT ON COLUMN locations.depth IS 'Auto-computed depth (1-4)';
COMMENT ON COLUMN locations.location_type IS 'Storage type: bulk, pallet, shelf, floor, staging';
COMMENT ON COLUMN locations.max_pallets IS 'Maximum number of pallets (null = no limit)';
COMMENT ON COLUMN locations.max_weight_kg IS 'Maximum weight in kg (null = no limit)';
COMMENT ON COLUMN locations.current_pallets IS 'Current number of pallets (updated by inventory operations)';
COMMENT ON COLUMN locations.current_weight_kg IS 'Current weight in kg (updated by inventory operations)';

COMMENT ON CONSTRAINT locations_org_warehouse_code_unique ON locations IS 'Location codes must be unique within warehouse';
COMMENT ON CONSTRAINT locations_depth_check ON locations IS 'Depth must be between 1 and 4';
