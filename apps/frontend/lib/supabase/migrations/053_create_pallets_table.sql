-- Epic 5 Batch 05B-2: Pallets (Stories 5.19-5.22)
-- Migration: Create pallets and pallet_lps tables

-- Pallets table
CREATE TABLE IF NOT EXISTS pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  pallet_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'shipped', 'received')),
  location_id UUID REFERENCES locations(id),
  warehouse_id UUID REFERENCES warehouses(id),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  UNIQUE(org_id, pallet_number)
);

-- Pallet LPs junction table
CREATE TABLE IF NOT EXISTS pallet_lps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES users(id),
  UNIQUE(pallet_id, lp_id)
);

-- Indexes
CREATE INDEX idx_pallets_org_status ON pallets(org_id, status);
CREATE INDEX idx_pallets_location ON pallets(location_id);
CREATE INDEX idx_pallets_warehouse ON pallets(warehouse_id);
CREATE INDEX idx_pallet_lps_pallet ON pallet_lps(pallet_id);
CREATE INDEX idx_pallet_lps_lp ON pallet_lps(lp_id);

-- RLS
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_lps ENABLE ROW LEVEL SECURITY;

CREATE POLICY pallets_org_isolation ON pallets FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);
CREATE POLICY pallet_lps_org_isolation ON pallet_lps FOR ALL USING (
  pallet_id IN (SELECT id FROM pallets WHERE org_id = current_setting('app.current_org_id')::uuid)
);

-- Auto-increment pallet number function
CREATE OR REPLACE FUNCTION generate_pallet_number(org_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  current_year TEXT;
  next_sequence INTEGER;
  new_pallet_number VARCHAR(50);
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(pallet_number FROM 'PLT-' || current_year || '-(.+)') AS INTEGER)), 0) + 1
  INTO next_sequence
  FROM pallets
  WHERE org_id = org_uuid
    AND pallet_number LIKE 'PLT-' || current_year || '-%';

  new_pallet_number := 'PLT-' || current_year || '-' || LPAD(next_sequence::TEXT, 5, '0');

  RETURN new_pallet_number;
END;
$$ LANGUAGE plpgsql;
