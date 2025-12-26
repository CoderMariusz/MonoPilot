-- Migration: Create product_types table
-- Story: 02.1 - Products CRUD + Types
-- Purpose: Product type reference table with 5 default types (RM, WIP, FG, PKG, BP)
-- RLS: Per-organization isolation using ADR-013 pattern

-- Create utility function for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create product_types table
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_product_types_org_code UNIQUE(org_id, code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_types_org_code ON product_types(org_id, code);
CREATE INDEX IF NOT EXISTS idx_product_types_org_active ON product_types(org_id, is_active);

-- Enable RLS
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read access for all org users
CREATE POLICY product_types_org_isolation
  ON product_types
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: Write access for ADMIN roles only
CREATE POLICY product_types_admin_write
  ON product_types
  FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT r.code
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = auth.uid()
    ) IN ('SUPER_ADMIN', 'ADMIN')
  );

-- Trigger: Auto-update updated_at
CREATE TRIGGER trg_product_types_updated_at
  BEFORE UPDATE ON product_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to seed default product types for an organization
CREATE OR REPLACE FUNCTION seed_default_product_types(target_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert 5 default product types
  INSERT INTO product_types (org_id, code, name, description, color, is_default, is_active, display_order)
  VALUES
    (target_org_id, 'RM', 'Raw Material', 'Ingredients and raw materials', 'blue', true, true, 1),
    (target_org_id, 'WIP', 'Work in Progress', 'Semi-finished products', 'yellow', true, true, 2),
    (target_org_id, 'FG', 'Finished Goods', 'Final products ready for sale', 'green', true, true, 3),
    (target_org_id, 'PKG', 'Packaging', 'Packaging materials', 'purple', true, true, 4),
    (target_org_id, 'BP', 'Byproduct', 'Production byproducts', 'orange', true, true, 5)
  ON CONFLICT (org_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE product_types IS 'Product type reference table with org-specific types (RM, WIP, FG, PKG, BP)';
COMMENT ON FUNCTION seed_default_product_types IS 'Seeds 5 default product types for a given organization';
