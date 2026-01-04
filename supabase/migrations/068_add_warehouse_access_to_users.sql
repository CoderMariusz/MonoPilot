/**
 * Migration: Add warehouse_access_ids to users table
 * Story: 01.5b - User Warehouse Access Restrictions
 * Purpose: Enable warehouse-level access control for users
 *
 * Business Logic:
 * - NULL = All warehouses (for ADMIN/SUPER_ADMIN roles)
 * - NULL = No warehouses (for non-admin roles) - edge case
 * - [uuid[]] = Specific warehouses only
 * - [] = Explicitly no warehouse access
 */

-- Add warehouse_access_ids column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS warehouse_access_ids UUID[] DEFAULT NULL;

-- Index for efficient warehouse access queries
CREATE INDEX IF NOT EXISTS idx_users_warehouse_access
ON users USING GIN (warehouse_access_ids);

-- Comment
COMMENT ON COLUMN users.warehouse_access_ids IS 'Array of warehouse IDs user can access. NULL = all (admin) or none (non-admin), [] = explicit no access, [ids] = specific warehouses';

-- Note: RLS policies for warehouse filtering will be added in Story 01.5c
-- This migration only adds the column for Phase 1B (assignment UI + API)
