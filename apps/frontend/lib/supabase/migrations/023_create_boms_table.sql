-- Migration: Create BOMs table
-- Story: 2.6 BOM CRUD
-- Description: Bills of Materials (BOM) table with versioning and date-based validity

-- Create BOM status enum
DO $$ BEGIN
  CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create boms table
CREATE TABLE IF NOT EXISTS boms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  version VARCHAR(10) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  status bom_status NOT NULL DEFAULT 'draft',
  output_qty DECIMAL(10,3) NOT NULL DEFAULT 1.0,
  output_uom VARCHAR(10) NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_bom_version UNIQUE (org_id, product_id, version),
  CONSTRAINT check_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT check_output_qty CHECK (output_qty > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boms_org ON boms(org_id);
CREATE INDEX IF NOT EXISTS idx_boms_product ON boms(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_boms_dates ON boms(org_id, product_id, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_boms_status ON boms(org_id, status);

-- Enable Row Level Security
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access BOMs from their organization
CREATE POLICY boms_org_isolation ON boms
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON boms TO authenticated;
GRANT USAGE ON SEQUENCE boms_id_seq TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_boms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_boms_updated_at
  BEFORE UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION update_boms_updated_at();

-- Add comment for documentation
COMMENT ON TABLE boms IS 'Bills of Materials (BOM) - product recipes with versioning and date-based validity';
COMMENT ON COLUMN boms.version IS 'Version number in X.Y format (e.g., 1.0, 1.1, 2.0)';
COMMENT ON COLUMN boms.effective_from IS 'Date when this BOM version becomes effective';
COMMENT ON COLUMN boms.effective_to IS 'Date when this BOM version expires (NULL = no end date)';
COMMENT ON COLUMN boms.status IS 'BOM status: draft (in development), active (in use), phased_out (being replaced), inactive (obsolete)';
COMMENT ON COLUMN boms.output_qty IS 'Output quantity produced by this BOM (e.g., 1.0 for a single unit)';
COMMENT ON COLUMN boms.output_uom IS 'Unit of measure for output quantity';
