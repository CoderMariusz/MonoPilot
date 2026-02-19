-- Migration: Create product_tags and product_tag_assignments tables for Story 02.16
-- Features: Many-to-many tags with color support

-- Tags table
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tag assignments (many-to-many)
CREATE TABLE IF NOT EXISTS product_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Indexes
CREATE INDEX idx_product_tags_org_id ON product_tags(org_id);
CREATE INDEX idx_product_tags_name ON product_tags(name);
CREATE INDEX idx_product_tag_assignments_product_id ON product_tag_assignments(product_id);
CREATE INDEX idx_product_tag_assignments_tag_id ON product_tag_assignments(tag_id);
CREATE INDEX idx_product_tag_assignments_org_id ON product_tag_assignments(org_id);

-- Enable RLS
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_tags
CREATE POLICY product_tags_select ON product_tags
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_tags_insert ON product_tags
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_tags_update ON product_tags
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_tags_delete ON product_tags
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- RLS Policies for product_tag_assignments
CREATE POLICY product_tag_assignments_select ON product_tag_assignments
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_tag_assignments_insert ON product_tag_assignments
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_tag_assignments_delete ON product_tag_assignments
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER product_tags_updated_at
  BEFORE UPDATE ON product_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent deletion of tags with assignments
CREATE OR REPLACE FUNCTION check_tag_deletable()
RETURNS TRIGGER AS $$
DECLARE
  assignment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO assignment_count
  FROM product_tag_assignments
  WHERE tag_id = OLD.id;
  
  IF assignment_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete tag: assigned to products';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_tags_prevent_delete
  BEFORE DELETE ON product_tags
  FOR EACH ROW EXECUTE FUNCTION check_tag_deletable();

-- Grant permissions
GRANT ALL ON product_tags TO authenticated;
GRANT ALL ON product_tags TO service_role;
GRANT ALL ON product_tag_assignments TO authenticated;
GRANT ALL ON product_tag_assignments TO service_role;