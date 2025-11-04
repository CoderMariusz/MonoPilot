-- Migration 054: Production Lines Table
-- Creates production_lines table with warehouse relationship
-- Adds line_id to boms, work_orders, and bom_items tables

-- ==========================================
-- 1. Create production_lines table
-- ==========================================
CREATE TABLE IF NOT EXISTS production_lines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_production_lines_warehouse ON production_lines(warehouse_id);
CREATE INDEX idx_production_lines_active ON production_lines(is_active);
CREATE INDEX idx_production_lines_status ON production_lines(status);

COMMENT ON TABLE production_lines IS 'Production lines for manufacturing operations';
COMMENT ON COLUMN production_lines.code IS 'Unique line code (e.g., LINE-4, LINE-5)';
COMMENT ON COLUMN production_lines.status IS 'Line operational status';
COMMENT ON COLUMN production_lines.warehouse_id IS 'Optional warehouse association';

-- ==========================================
-- 2. Add line_id to BOMs (array - multi-line support)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'boms' AND column_name = 'line_id'
  ) THEN
    ALTER TABLE boms 
      ADD COLUMN line_id INTEGER[];
  END IF;
END $$;

COMMENT ON COLUMN boms.line_id IS 'Array of production line IDs. NULL = available on all lines';

-- ==========================================
-- 3. Add line_id to Work Orders (single line - FK)
-- ==========================================
DO $$
BEGIN
  -- Drop old line_number if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'line_number'
  ) THEN
    ALTER TABLE work_orders DROP COLUMN line_number;
  END IF;
  
  -- Add new line_id FK (initially allow NULL for migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'line_id'
  ) THEN
    ALTER TABLE work_orders 
      ADD COLUMN line_id INTEGER REFERENCES production_lines(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_orders_line ON work_orders(line_id);

COMMENT ON COLUMN work_orders.line_id IS 'Production line where this WO will be executed';

-- ==========================================
-- 4. Add line_id to BOM Items (array - line-specific materials)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bom_items' AND column_name = 'line_id'
  ) THEN
    ALTER TABLE bom_items
      ADD COLUMN line_id INTEGER[] NULL;
  END IF;
END $$;

COMMENT ON COLUMN bom_items.line_id IS 'Array of line IDs for this material. NULL = available on all lines from parent BOM. Enables line-specific materials (e.g., Box 12 for Line 4, Box 34 for Line 5)';

-- ==========================================
-- 5. Seed production lines data
-- ==========================================
INSERT INTO production_lines (code, name, status, is_active) VALUES
  ('LINE-4', 'Production Line 4', 'active', true),
  ('LINE-5', 'Production Line 5', 'active', true),
  ('LINE-6', 'Production Line 6', 'active', true)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 6. Backfill existing data (set default line for existing WOs)
-- ==========================================
DO $$
DECLARE
  default_line_id INTEGER;
BEGIN
  -- Get first available production line
  SELECT id INTO default_line_id FROM production_lines WHERE is_active = true ORDER BY id LIMIT 1;
  
  IF default_line_id IS NOT NULL THEN
    -- Update existing WOs without line_id
    UPDATE work_orders 
    SET line_id = default_line_id 
    WHERE line_id IS NULL;
  END IF;
END $$;

-- Now make line_id NOT NULL on work_orders
ALTER TABLE work_orders 
  ALTER COLUMN line_id SET NOT NULL;

