BEGIN;

-- Add routing_id to boms table
ALTER TABLE boms
ADD COLUMN routing_id UUID REFERENCES routings(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN boms.routing_id IS 'Reference to routing for labor cost calculation (optional)';

-- Add index for faster lookups
CREATE INDEX idx_boms_routing_id ON boms(routing_id);

COMMIT;

-- Rollback
-- ALTER TABLE boms DROP COLUMN routing_id;
-- DROP INDEX idx_boms_routing_id;
