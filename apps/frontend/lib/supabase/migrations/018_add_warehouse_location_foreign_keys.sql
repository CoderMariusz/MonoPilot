-- Migration 018: Add Missing Foreign Key Constraints from Warehouses to Locations
-- Fixes POST REST error: "Could not find a relationship between 'warehouses' and 'locations'"
-- Date: 2025-11-23
--
-- Issue: Migration 003 created warehouses.default_*_location_id columns but noted:
--   "Foreign key constraints for default locations will be added in migration 004
--    after the locations table is created to avoid circular dependency issues."
--
-- However, migration 004 NEVER added these foreign key constraints!
--
-- Resolution: Add the missing foreign key constraints now that both tables exist.
--
-- Background (from migration 003 comments):
--   Circular dependency resolution flow:
--   1. Create warehouse with default_*_location_id = NULL (migration 003)
--   2. Create locations with warehouse_id FK (migration 004)
--   3. Add FK constraints from warehouses to locations (THIS MIGRATION)
--
-- Why this matters:
--   - PostgREST uses FK relationships to join tables in queries
--   - Without FKs, queries with .select('*, locations(*)') fail with 500 error
--   - GET /api/settings/warehouses was returning 500 due to missing FK

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add FK constraint: warehouses.default_receiving_location_id -> locations.id
-- ON DELETE RESTRICT: Cannot delete a location if it's set as a default receiving location
ALTER TABLE public.warehouses
ADD CONSTRAINT warehouses_default_receiving_location_id_fkey
FOREIGN KEY (default_receiving_location_id)
REFERENCES public.locations(id)
ON DELETE RESTRICT;

-- Add FK constraint: warehouses.default_shipping_location_id -> locations.id
-- ON DELETE RESTRICT: Cannot delete a location if it's set as a default shipping location
ALTER TABLE public.warehouses
ADD CONSTRAINT warehouses_default_shipping_location_id_fkey
FOREIGN KEY (default_shipping_location_id)
REFERENCES public.locations(id)
ON DELETE RESTRICT;

-- Add FK constraint: warehouses.transit_location_id -> locations.id
-- ON DELETE RESTRICT: Cannot delete a location if it's set as a transit location
ALTER TABLE public.warehouses
ADD CONSTRAINT warehouses_transit_location_id_fkey
FOREIGN KEY (transit_location_id)
REFERENCES public.locations(id)
ON DELETE RESTRICT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration, verify with:
-- SELECT conname, contype, conrelid::regclass, confrelid::regclass
-- FROM pg_constraint
-- WHERE conname LIKE 'warehouses_default%' OR conname LIKE 'warehouses_transit%';
--
-- Expected output should include:
--   - warehouses_default_receiving_location_id_fkey (f) public.warehouses -> public.locations
--   - warehouses_default_shipping_location_id_fkey  (f) public.warehouses -> public.locations
--   - warehouses_transit_location_id_fkey          (f) public.warehouses -> public.locations

COMMENT ON TABLE public.warehouses IS 'Migration 018: Added missing FK constraints to locations table';
