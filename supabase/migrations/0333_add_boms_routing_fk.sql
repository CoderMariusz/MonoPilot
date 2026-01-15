-- ============================================================================
-- Migration: 0333_add_boms_routing_fk.sql
-- Purpose: Add FK constraint from boms.routing_id to routings.id
-- Date: 2026-01-14
-- ============================================================================

-- Add FK constraint (routing_id already exists but without FK)
ALTER TABLE boms
  ADD CONSTRAINT fk_boms_routing
  FOREIGN KEY (routing_id) REFERENCES routings(id) ON DELETE SET NULL;

-- Comment
COMMENT ON COLUMN boms.routing_id IS 'Reference to routing for labor cost calculation (optional)';
