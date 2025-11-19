-- Migration 110: Create UoM Master Table
-- Provides predefined Units of Measure for products, license plates, etc.
-- Includes both metric and imperial systems

-- Create uom_master table
CREATE TABLE IF NOT EXISTS uom_master (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL,
  system VARCHAR(10) DEFAULT 'metric', -- 'metric', 'imperial', 'universal'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_uom_master_code ON uom_master(code);
CREATE INDEX IF NOT EXISTS idx_uom_master_category ON uom_master(category);

-- Enable RLS
ALTER TABLE uom_master ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read UoMs (no org_id needed - global reference table)
CREATE POLICY "uom_master_select_all" ON uom_master
  FOR SELECT USING (true);

-- Grant SELECT to authenticated and anon roles
GRANT SELECT ON uom_master TO authenticated, anon;

-- Insert predefined UoMs

-- Weight - Metric
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('KG', 'Kilogram', 'weight', 'metric'),
  ('G', 'Gram', 'weight', 'metric'),
  ('MG', 'Milligram', 'weight', 'metric'),
  ('T', 'Metric Ton', 'weight', 'metric');

-- Weight - Imperial
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('LB', 'Pound', 'weight', 'imperial'),
  ('OZ', 'Ounce', 'weight', 'imperial');

-- Volume - Metric
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('L', 'Liter', 'volume', 'metric'),
  ('ML', 'Milliliter', 'volume', 'metric'),
  ('M3', 'Cubic Meter', 'volume', 'metric');

-- Volume - Imperial
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('GAL', 'Gallon', 'volume', 'imperial'),
  ('QT', 'Quart', 'volume', 'imperial'),
  ('PT', 'Pint', 'volume', 'imperial'),
  ('FLOZ', 'Fluid Ounce', 'volume', 'imperial');

-- Length - Metric
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('M', 'Meter', 'length', 'metric'),
  ('CM', 'Centimeter', 'length', 'metric'),
  ('MM', 'Millimeter', 'length', 'metric'),
  ('KM', 'Kilometer', 'length', 'metric');

-- Length - Imperial
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('FT', 'Foot', 'length', 'imperial'),
  ('IN', 'Inch', 'length', 'imperial'),
  ('YD', 'Yard', 'length', 'imperial'),
  ('MI', 'Mile', 'length', 'imperial');

-- Count - Universal
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('EA', 'Each', 'count', 'universal'),
  ('PC', 'Piece', 'count', 'universal'),
  ('PK', 'Pack', 'count', 'universal'),
  ('DZ', 'Dozen', 'count', 'universal'),
  ('PR', 'Pair', 'count', 'universal'),
  ('SET', 'Set', 'count', 'universal'),
  ('ROLL', 'Roll', 'count', 'universal');

-- Container - Universal
INSERT INTO uom_master (code, display_name, category, system) VALUES
  ('BOX', 'Box', 'container', 'universal'),
  ('CTN', 'Carton', 'container', 'universal'),
  ('PLT', 'Pallet', 'container', 'universal'),
  ('CS', 'Case', 'container', 'universal'),
  ('BKT', 'Bucket', 'container', 'universal'),
  ('BAG', 'Bag', 'container', 'universal'),
  ('DRM', 'Drum', 'container', 'universal'),
  ('TUB', 'Tub', 'container', 'universal');

-- Comment
COMMENT ON TABLE uom_master IS 'Master table for Units of Measure - predefined metric/imperial values';
