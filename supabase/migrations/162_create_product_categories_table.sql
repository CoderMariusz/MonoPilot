-- Migration: Create product_categories table for Story 02.16
-- Features: Hierarchical categories, max 3 levels deep

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_product_categories_org_id ON product_categories(org_id);
CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX idx_product_categories_level ON product_categories(level);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY product_categories_select ON product_categories
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_categories_insert ON product_categories
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_categories_update ON product_categories
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY product_categories_delete ON product_categories
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate category level before insert/update
CREATE OR REPLACE FUNCTION calculate_category_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
  ELSE
    SELECT level + 1 INTO NEW.level
    FROM product_categories
    WHERE id = NEW.parent_id;
    
    IF NEW.level > 3 THEN
      RAISE EXCEPTION 'Category hierarchy cannot exceed 3 levels';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_categories_calculate_level
  BEFORE INSERT OR UPDATE OF parent_id ON product_categories
  FOR EACH ROW EXECUTE FUNCTION calculate_category_level();

-- Function to prevent deletion if category has children or products
CREATE OR REPLACE FUNCTION check_category_deletable()
RETURNS TRIGGER AS $$
DECLARE
  child_count INTEGER;
  product_count INTEGER;
BEGIN
  -- Check for children categories
  SELECT COUNT(*) INTO child_count
  FROM product_categories
  WHERE parent_id = OLD.id;
  
  IF child_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete category: has child categories';
  END IF;
  
  -- Check for associated products
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE category_id = OLD.id AND deleted_at IS NULL;
  
  IF product_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete category: has associated products';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_categories_prevent_delete
  BEFORE DELETE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION check_category_deletable();

-- Grant permissions
GRANT ALL ON product_categories TO authenticated;
GRANT ALL ON product_categories TO service_role;