-- Migration: Create warehouses table
-- Story: 01.8 - Warehouses CRUD
-- Purpose: Create warehouses table with type enum, address, contact, and default flag
--
-- Features:
-- - Warehouse types (GENERAL, RAW_MATERIALS, WIP, FINISHED_GOODS, QUARANTINE)
-- - Multi-tenant with org_id
-- - Default warehouse flag (only one per org via trigger)
-- - Address and contact information
-- - Soft delete (is_active flag)
-- - Audit fields (created_at, updated_at, created_by, updated_by, disabled_at, disabled_by)
-- - Location count (denormalized for performance)

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    location_count INTEGER DEFAULT 0,
    disabled_at TIMESTAMPTZ,
    disabled_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT warehouses_org_code_unique UNIQUE(org_id, code),
    CONSTRAINT warehouses_type_check CHECK (type IN ('GENERAL', 'RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE')),
    CONSTRAINT warehouses_code_format CHECK (code ~ '^[A-Z0-9-]{2,20}$'),
    CONSTRAINT warehouses_address_length CHECK (address IS NULL OR char_length(address) <= 500),
    CONSTRAINT warehouses_phone_length CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 20)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouses_org_id ON warehouses(org_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_code ON warehouses(org_id, code);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_type ON warehouses(org_id, type);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_active ON warehouses(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_default ON warehouses(org_id, is_default);

-- Comments
COMMENT ON TABLE warehouses IS 'Physical storage locations with type classification (Story 01.8)';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse identifier (2-20 chars, uppercase alphanumeric + hyphens)';
COMMENT ON COLUMN warehouses.type IS 'Warehouse classification: GENERAL, RAW_MATERIALS, WIP, FINISHED_GOODS, QUARANTINE';
COMMENT ON COLUMN warehouses.address IS 'Physical address (max 500 chars)';
COMMENT ON COLUMN warehouses.contact_email IS 'Warehouse manager/contact email';
COMMENT ON COLUMN warehouses.contact_phone IS 'Warehouse contact phone (max 20 chars)';
COMMENT ON COLUMN warehouses.is_default IS 'Default warehouse for new inventory operations (only one per org)';
COMMENT ON COLUMN warehouses.location_count IS 'Denormalized count of locations in warehouse (updated by trigger in Story 01.9)';
COMMENT ON COLUMN warehouses.disabled_at IS 'Timestamp when warehouse was disabled';
COMMENT ON COLUMN warehouses.disabled_by IS 'User who disabled the warehouse';

-- Trigger: Ensure single default warehouse per org (atomic operation)
-- AC-05: Set default warehouse (unsets previous default atomically)
CREATE OR REPLACE FUNCTION ensure_single_default_warehouse()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset previous default warehouse for this org
        UPDATE warehouses
        SET is_default = false, updated_at = NOW()
        WHERE org_id = NEW.org_id
          AND id != NEW.id
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_warehouse_trigger
BEFORE INSERT OR UPDATE OF is_default ON warehouses
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_warehouse();

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warehouses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouses_updated_at_trigger
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_warehouses_updated_at();
