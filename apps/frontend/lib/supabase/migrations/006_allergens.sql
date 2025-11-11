-- Migration 006: Allergens Table
-- Purpose: Allergen master data for food safety compliance
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE allergens (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_allergens_code ON allergens(code);
CREATE INDEX idx_allergens_active ON allergens(is_active);

-- Comments
COMMENT ON TABLE allergens IS 'Allergen master data for food safety and labeling compliance';
COMMENT ON COLUMN allergens.icon IS 'Icon identifier for UI display';

