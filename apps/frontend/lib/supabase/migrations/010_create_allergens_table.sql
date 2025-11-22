-- Migration 010: Create allergens table for EU allergen management
-- Story: 1.9 - Allergen Management
-- Date: 2025-11-22
-- Description: Creates allergens table with 14 EU major allergens support,
--              custom allergen capability, RLS policies, and proper indexing

-- Create allergens table
CREATE TABLE IF NOT EXISTS allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_major BOOLEAN NOT NULL DEFAULT false,
    is_custom BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: allergen code must be unique per organization
    CONSTRAINT uq_allergens_org_code UNIQUE (org_id, code)
);

-- Create indexes for performance
-- Primary index for RLS queries filtering by org_id
CREATE INDEX idx_allergens_org_id ON allergens(org_id);

-- Composite index for filtered queries (major allergens, custom allergens)
CREATE INDEX idx_allergens_flags ON allergens(org_id, is_major, is_custom);

-- Index for code lookups
CREATE INDEX idx_allergens_code ON allergens(org_id, code);

-- Enable Row Level Security
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access allergens from their organization
CREATE POLICY allergens_org_isolation ON allergens
    FOR ALL
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Add helpful comments
COMMENT ON TABLE allergens IS 'Master data table for allergen library - 14 EU major allergens + custom allergens per organization';
COMMENT ON COLUMN allergens.code IS 'Unique allergen code per org (e.g., MILK, EGGS, CUSTOM-01)';
COMMENT ON COLUMN allergens.name IS 'Display name of allergen (e.g., "Milk", "Eggs")';
COMMENT ON COLUMN allergens.is_major IS 'True for 14 EU major allergens (Regulation EU 1169/2011)';
COMMENT ON COLUMN allergens.is_custom IS 'False for preloaded EU allergens, true for user-added custom allergens';

-- Add trigger for updated_at timestamp
CREATE TRIGGER set_allergens_updated_at
    BEFORE UPDATE ON allergens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON allergens TO authenticated;
GRANT INSERT, UPDATE, DELETE ON allergens TO authenticated;
