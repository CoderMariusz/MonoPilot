-- Migration: Create machines table with machine_type and machine_status enums
-- Story: 01.10 - Machines CRUD
-- Purpose: Create machines table for production machine master data
--
-- Features:
-- - 9 machine types (MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER)
-- - 4 machine statuses (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)
-- - Multi-tenant with org_id
-- - Capacity tracking (units_per_hour, setup_time_minutes, max_batch_size)
-- - Location assignment (optional FK to locations table)
-- - Soft delete (is_deleted flag)
-- - Audit fields (created_at, updated_at, created_by, updated_by, deleted_at)

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Machine type enum (production machine types)
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

-- Machine status enum (operational status)
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
    units_per_hour INTEGER,
    setup_time_minutes INTEGER,
    max_batch_size INTEGER,

    -- Location assignment (optional)
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
    CONSTRAINT machines_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
    CONSTRAINT machines_code_length CHECK (char_length(code) <= 50),
    CONSTRAINT machines_units_per_hour_check CHECK (units_per_hour IS NULL OR units_per_hour > 0),
    CONSTRAINT machines_setup_time_check CHECK (setup_time_minutes IS NULL OR setup_time_minutes >= 0),
    CONSTRAINT machines_max_batch_size_check CHECK (max_batch_size IS NULL OR max_batch_size > 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_machines_org_id ON machines(org_id);
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines(location_id);
CREATE INDEX IF NOT EXISTS idx_machines_org_code ON machines(org_id, code);
CREATE INDEX IF NOT EXISTS idx_machines_org_not_deleted ON machines(org_id, is_deleted);

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

COMMENT ON TABLE machines IS 'Production machine master data with type, status, capacity, and location (Story 01.10)';
COMMENT ON COLUMN machines.code IS 'Unique machine identifier (uppercase alphanumeric + hyphens, max 50 chars)';
COMMENT ON COLUMN machines.type IS 'Machine type: MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER';
COMMENT ON COLUMN machines.status IS 'Operational status: ACTIVE (default), MAINTENANCE, OFFLINE, DECOMMISSIONED';
COMMENT ON COLUMN machines.units_per_hour IS 'Production rate (units per hour, optional)';
COMMENT ON COLUMN machines.setup_time_minutes IS 'Setup/changeover time in minutes (optional)';
COMMENT ON COLUMN machines.max_batch_size IS 'Maximum batch size (optional)';
COMMENT ON COLUMN machines.location_id IS 'Physical location assignment (optional FK to locations table)';
COMMENT ON COLUMN machines.is_deleted IS 'Soft delete flag (true = deleted)';
COMMENT ON COLUMN machines.deleted_at IS 'Timestamp when machine was deleted';

COMMENT ON CONSTRAINT machines_org_code_unique ON machines IS 'Machine codes must be unique within organization';
COMMENT ON CONSTRAINT machines_code_format ON machines IS 'Machine code must be uppercase alphanumeric with hyphens';
