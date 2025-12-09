-- Migration 057: Create inventory_counts tables
-- Story 5.35: Inventory Count for physical inventory verification

-- ============================================
-- 1. Create inventory_counts table
-- ============================================
-- Records inventory count sessions

CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Count Identification
  count_number VARCHAR(50) NOT NULL,

  -- Location
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending = not started, in_progress = counting, completed = done, adjusted = variance reconciled

  -- Reason
  reason VARCHAR(50),
  -- cycle_count, audit, recount

  -- Statistics
  expected_lps INT NOT NULL DEFAULT 0,
  scanned_lps INT NOT NULL DEFAULT 0,
  found_lps INT NOT NULL DEFAULT 0,
  missing_lps INT NOT NULL DEFAULT 0,
  extra_lps INT NOT NULL DEFAULT 0,
  variance_pct DECIMAL(5,2),

  -- User Tracking
  initiated_by_user_id UUID NOT NULL REFERENCES users(id),
  completed_by_user_id UUID REFERENCES users(id),

  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT inventory_counts_org_number_unique UNIQUE (org_id, count_number),
  CONSTRAINT inventory_counts_status_check CHECK (
    status IN ('pending', 'in_progress', 'completed', 'adjusted')
  ),
  CONSTRAINT inventory_counts_reason_check CHECK (
    reason IS NULL OR reason IN ('cycle_count', 'audit', 'recount')
  ),
  CONSTRAINT inventory_counts_completed_check CHECK (
    (status NOT IN ('completed', 'adjusted') AND completed_at IS NULL AND completed_by_user_id IS NULL)
    OR (status IN ('completed', 'adjusted') AND completed_at IS NOT NULL AND completed_by_user_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_inventory_counts_org ON inventory_counts(org_id);
CREATE INDEX idx_inventory_counts_location ON inventory_counts(location_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX idx_inventory_counts_initiated ON inventory_counts(initiated_at DESC);

-- ============================================
-- 2. Create inventory_count_items table
-- ============================================
-- Records individual LP scan results during count

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,

  -- License Plate
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,

  -- Expected vs Scanned
  expected BOOLEAN NOT NULL DEFAULT true,
  -- true = LP was expected at location, false = LP was extra (not expected)

  -- Scan Details
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by_user_id UUID REFERENCES users(id),

  -- Variance
  variance VARCHAR(20),
  -- 'found' = expected and scanned, 'missing' = expected but not scanned, 'extra' = not expected but found

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT inventory_count_items_count_lp_unique UNIQUE (count_id, lp_id),
  CONSTRAINT inventory_count_items_variance_check CHECK (
    variance IS NULL OR variance IN ('found', 'missing', 'extra')
  ),
  CONSTRAINT inventory_count_items_scan_check CHECK (
    (scanned_at IS NULL AND scanned_by_user_id IS NULL)
    OR (scanned_at IS NOT NULL AND scanned_by_user_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_inventory_count_items_count ON inventory_count_items(count_id);
CREATE INDEX idx_inventory_count_items_lp ON inventory_count_items(lp_id);
CREATE INDEX idx_inventory_count_items_variance ON inventory_count_items(variance);
CREATE INDEX idx_inventory_count_items_expected ON inventory_count_items(expected);

-- ============================================
-- 3. RLS Policies for inventory_counts
-- ============================================
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view counts in their org"
  ON inventory_counts FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can create counts in their org"
  ON inventory_counts FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can update counts in their org"
  ON inventory_counts FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Service role full access to inventory_counts"
  ON inventory_counts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. RLS Policies for inventory_count_items
-- ============================================
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view count items via count org"
  ON inventory_count_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventory_counts ic
      WHERE ic.id = inventory_count_items.count_id
        AND ic.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

CREATE POLICY "Users can create count items via count org"
  ON inventory_count_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_counts ic
      WHERE ic.id = inventory_count_items.count_id
        AND ic.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

CREATE POLICY "Users can update count items via count org"
  ON inventory_count_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inventory_counts ic
      WHERE ic.id = inventory_count_items.count_id
        AND ic.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

CREATE POLICY "Service role full access to inventory_count_items"
  ON inventory_count_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Generate count number function
-- ============================================
CREATE OR REPLACE FUNCTION generate_count_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_seq INT;
  v_year TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YY');

  -- Get next sequence for org this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(count_number FROM 'CNT-' || v_year || '-(\d+)') AS INT)
  ), 0) + 1
  INTO v_seq
  FROM inventory_counts
  WHERE org_id = p_org_id
    AND count_number LIKE 'CNT-' || v_year || '-%';

  RETURN 'CNT-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON TABLE inventory_counts IS 'Physical inventory count sessions (Story 5.35)';
COMMENT ON TABLE inventory_count_items IS 'Individual LP scan results during inventory count';
COMMENT ON COLUMN inventory_counts.status IS 'pending/in_progress/completed/adjusted';
COMMENT ON COLUMN inventory_counts.reason IS 'cycle_count/audit/recount';
COMMENT ON COLUMN inventory_count_items.variance IS 'found/missing/extra';
COMMENT ON COLUMN inventory_count_items.expected IS 'true=LP expected at location, false=extra LP found';
