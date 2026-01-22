-- =============================================================================
-- Migration 137: Create Pick Lists Tables + RLS Policies
-- Story: 07.8 - Pick List Generation + Wave Picking
-- Purpose: Track pick lists and pick lines for warehouse order fulfillment
-- =============================================================================

-- =============================================================================
-- Pick Lists Table - Main pick list header
-- =============================================================================

CREATE TABLE IF NOT EXISTS pick_lists (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pick_list_number TEXT NOT NULL,

  -- Pick Type
  pick_type TEXT NOT NULL DEFAULT 'single_order'
    CHECK (pick_type IN ('single_order', 'wave')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),

  -- Priority
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  wave_id UUID, -- Optional grouping for advanced wave management

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT pick_lists_org_number_unique UNIQUE(org_id, pick_list_number)
);

-- =============================================================================
-- Pick List Lines Table - Individual pick lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS pick_list_lines (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pick_list_id UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE,

  -- Source Reference
  sales_order_line_id UUID NOT NULL REFERENCES sales_order_lines(id),

  -- Pick Location and Product
  license_plate_id UUID REFERENCES license_plates(id), -- Suggested LP
  location_id UUID NOT NULL REFERENCES locations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  lot_number TEXT,

  -- Quantities
  quantity_to_pick DECIMAL(15,4) NOT NULL CHECK (quantity_to_pick > 0),
  quantity_picked DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (quantity_picked >= 0),

  -- Pick Sequence (route optimization order)
  pick_sequence INTEGER NOT NULL DEFAULT 0,

  -- Line Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'picked', 'short')),

  -- Picked Reference
  picked_license_plate_id UUID REFERENCES license_plates(id), -- Actual picked LP
  picked_at TIMESTAMPTZ,
  picked_by UUID REFERENCES users(id),

  -- Notes
  short_pick_reason TEXT,
  notes TEXT
);

-- =============================================================================
-- Pick List Number Sequence per Organization per Year
-- =============================================================================

CREATE TABLE IF NOT EXISTS pick_list_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pick_list_seq_org_year_unique UNIQUE(org_id, year)
);

-- =============================================================================
-- Function to Generate Next Pick List Number
-- Format: PL-YYYY-NNNNN
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_pick_list_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_val BIGINT;
  v_pl_number TEXT;
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM NOW());

  -- Upsert sequence and get next value
  INSERT INTO pick_list_number_sequences (org_id, year, current_value)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET
    current_value = pick_list_number_sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_next_val;

  -- Format PL number: PL-YYYY-NNNNN
  v_pl_number := 'PL-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

  RETURN v_pl_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Pick Lists indexes
CREATE INDEX IF NOT EXISTS idx_pick_lists_org_status ON pick_lists(org_id, status);
CREATE INDEX IF NOT EXISTS idx_pick_lists_assigned ON pick_lists(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pick_lists_org_created ON pick_lists(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pick_lists_priority ON pick_lists(org_id, priority, created_at);

-- Pick List Lines indexes
CREATE INDEX IF NOT EXISTS idx_pick_list_lines_list ON pick_list_lines(pick_list_id);
CREATE INDEX IF NOT EXISTS idx_pick_list_lines_status ON pick_list_lines(status);
CREATE INDEX IF NOT EXISTS idx_pick_list_lines_location ON pick_list_lines(location_id);
CREATE INDEX IF NOT EXISTS idx_pick_list_lines_sequence ON pick_list_lines(pick_list_id, pick_sequence);
CREATE INDEX IF NOT EXISTS idx_pick_list_lines_so_line ON pick_list_lines(sales_order_line_id);

-- =============================================================================
-- RLS Policies - Pick Lists
-- =============================================================================

ALTER TABLE pick_lists ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "pick_lists_select_org" ON pick_lists
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "pick_lists_insert_org" ON pick_lists
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Update: Org isolation
CREATE POLICY "pick_lists_update_org" ON pick_lists
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation
CREATE POLICY "pick_lists_delete_org" ON pick_lists
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- RLS Policies - Pick List Lines
-- =============================================================================

ALTER TABLE pick_list_lines ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "pick_list_lines_select_org" ON pick_list_lines
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "pick_list_lines_insert_org" ON pick_list_lines
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Update: Org isolation
CREATE POLICY "pick_list_lines_update_org" ON pick_list_lines
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation
CREATE POLICY "pick_list_lines_delete_org" ON pick_list_lines
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- RLS Policies - Pick List Number Sequences
-- =============================================================================

ALTER TABLE pick_list_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pick_list_seq_org" ON pick_list_number_sequences
FOR ALL TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Trigger to Auto-Set org_id on Pick List Lines from Pick List
-- =============================================================================

CREATE OR REPLACE FUNCTION set_pick_list_line_org_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set org_id from parent pick_list
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id FROM pick_lists WHERE id = NEW.pick_list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_pick_list_lines_set_org_id
BEFORE INSERT ON pick_list_lines
FOR EACH ROW EXECUTE FUNCTION set_pick_list_line_org_id();

-- =============================================================================
-- Junction Table: Pick List to Sales Orders (for tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS pick_list_sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_list_id UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pick_list_so_unique UNIQUE(pick_list_id, sales_order_id)
);

CREATE INDEX IF NOT EXISTS idx_pick_list_so_pl ON pick_list_sales_orders(pick_list_id);
CREATE INDEX IF NOT EXISTS idx_pick_list_so_so ON pick_list_sales_orders(sales_order_id);

-- RLS for junction table
ALTER TABLE pick_list_sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pick_list_so_select" ON pick_list_sales_orders
FOR SELECT TO authenticated
USING (
  pick_list_id IN (
    SELECT id FROM pick_lists
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

CREATE POLICY "pick_list_so_insert" ON pick_list_sales_orders
FOR INSERT TO authenticated
WITH CHECK (
  pick_list_id IN (
    SELECT id FROM pick_lists
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

CREATE POLICY "pick_list_so_delete" ON pick_list_sales_orders
FOR DELETE TO authenticated
USING (
  pick_list_id IN (
    SELECT id FROM pick_lists
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);
