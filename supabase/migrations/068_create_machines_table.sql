-- Migration: Create machines table
-- Story: 01.10 - Machines CRUD
-- Purpose: Create machines table with machine_type and machine_status enums
--
-- Features:
-- - 9 machine types (MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER)
-- - 4 machine statuses (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)
-- - Multi-tenant with org_id
-- - Optional location assignment (FK to locations)
-- - Capacity tracking (units_per_hour, setup_time_minutes, max_batch_size)
-- - Soft delete (is_deleted flag)
-- - Audit fields (created_at, updated_at, created_by, updated_by, deleted_at)

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Machine type enum (9 production machine types)
CREATE TYPE machine_type AS ENUM (
    'MIXER',
    'OVEN',
    'FILLER',
    'PACKAGING',
    'CONVEYOR',
    'BLENDER',
    'CUTTER',
    'LABELER',
    'OTHER'
);

-- Machine status enum (4 operational states)
CREATE TYPE machine_status AS ENUM (
    'ACTIVE',
    'MAINTENANCE',
    'OFFLINE',
    'DECOMMISSIONED'
);

-- =============================================================================
-- TABLE: machines
-- =============================================================================

CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Classification
    type machine_type NOT NULL DEFAULT 'OTHER',
    status machine_status NOT NULL DEFAULT 'ACTIVE',

    -- Capacity fields (all optional)
    units_per_hour INTEGER CHECK (units_per_hour IS NULL OR units_per_hour > 0),
    setup_time_minutes INTEGER CHECK (setup_time_minutes IS NULL OR setup_time_minutes >= 0),
    max_batch_size INTEGER CHECK (max_batch_size IS NULL OR max_batch_size > 0),

    -- Location assignment (optional FK to locations)
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT machines_org_code_unique UNIQUE(org_id, code),
    CONSTRAINT machines_code_format CHECK (code ~ '^[A-Z0-9-]{1,50}$'),
    CONSTRAINT machines_name_not_empty CHECK (char_length(TRIM(name)) > 0),
    CONSTRAINT machines_deleted_at_consistency CHECK (
        (is_deleted = true AND deleted_at IS NOT NULL) OR
        (is_deleted = false AND deleted_at IS NULL)
    )
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_machines_org_id ON machines(org_id);
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines(location_id);
CREATE INDEX IF NOT EXISTS idx_machines_org_code ON machines(org_id, code);
CREATE INDEX IF NOT EXISTS idx_machines_org_type ON machines(org_id, type);
CREATE INDEX IF NOT EXISTS idx_machines_org_status ON machines(org_id, status);
CREATE INDEX IF NOT EXISTS idx_machines_org_deleted ON machines(org_id, is_deleted);

-- =============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_machines_updated_at_trigger
BEFORE UPDATE ON machines
FOR EACH ROW
EXECUTE FUNCTION update_machines_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE machines IS 'Production machines with type, status, capacity, and location (Story 01.10)';
COMMENT ON COLUMN machines.code IS 'Unique machine identifier (1-50 chars, uppercase alphanumeric + hyphens)';
COMMENT ON COLUMN machines.type IS 'Machine type: MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER';
COMMENT ON COLUMN machines.status IS 'Operational status: ACTIVE (default), MAINTENANCE, OFFLINE, DECOMMISSIONED';
COMMENT ON COLUMN machines.units_per_hour IS 'Production rate (units per hour)';
COMMENT ON COLUMN machines.setup_time_minutes IS 'Setup/changeover time in minutes';
COMMENT ON COLUMN machines.max_batch_size IS 'Maximum batch size';
COMMENT ON COLUMN machines.location_id IS 'Optional FK to locations table (ON DELETE SET NULL preserves machine)';
COMMENT ON COLUMN machines.is_deleted IS 'Soft delete flag (true = deleted, used for historical references)';
COMMENT ON COLUMN machines.deleted_at IS 'Timestamp when machine was soft-deleted';

COMMENT ON CONSTRAINT machines_org_code_unique ON machines IS 'Machine codes must be unique within organization';
COMMENT ON CONSTRAINT machines_code_format ON machines IS 'Code must be 1-50 uppercase alphanumeric characters with hyphens';
COMMENT ON CONSTRAINT machines_deleted_at_consistency ON machines IS 'deleted_at must be set when is_deleted=true';
