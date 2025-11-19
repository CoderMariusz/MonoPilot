-- Migration: Add extended columns to bom_items table
-- Purpose: Support all UI fields for BOM item management

-- Priority for sorting/processing order
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS priority INTEGER;

-- Production line specific fields
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS line_id INTEGER[];
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS production_lines TEXT[];
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS production_line_restrictions TEXT[];

-- Item flags
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT FALSE;

-- Cost and planning fields
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS unit_cost_std NUMERIC(12,4);
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS moq NUMERIC(12,4);

-- Scrap percentage (rename from scrap_percent if needed, or add as alias)
-- Note: scrap_percent already exists, adding scrap_std_pct as alternative name
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS scrap_std_pct NUMERIC(5,2);

-- Add comments
COMMENT ON COLUMN bom_items.priority IS 'Processing priority for this item (lower = higher priority)';
COMMENT ON COLUMN bom_items.line_id IS 'Array of production line IDs this item is specific to';
COMMENT ON COLUMN bom_items.production_lines IS 'Array of production line codes';
COMMENT ON COLUMN bom_items.production_line_restrictions IS 'Array of production line restrictions';
COMMENT ON COLUMN bom_items.is_optional IS 'Whether this item is optional in the BOM';
COMMENT ON COLUMN bom_items.is_phantom IS 'Whether this is a phantom/kit item (explodes into sub-components)';
COMMENT ON COLUMN bom_items.unit_cost_std IS 'Standard unit cost for this material';
COMMENT ON COLUMN bom_items.lead_time_days IS 'Lead time in days for this material';
COMMENT ON COLUMN bom_items.moq IS 'Minimum order quantity for this material';
COMMENT ON COLUMN bom_items.scrap_std_pct IS 'Standard scrap percentage (alternative to scrap_percent)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bom_items_priority ON bom_items(priority);
CREATE INDEX IF NOT EXISTS idx_bom_items_is_optional ON bom_items(is_optional) WHERE is_optional = TRUE;
CREATE INDEX IF NOT EXISTS idx_bom_items_is_phantom ON bom_items(is_phantom) WHERE is_phantom = TRUE;
