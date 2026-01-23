-- =============================================================================
-- Migration 135: Create Sales Orders + Inventory Allocations Tables
-- Story: 07.2 + 07.7 - Sales Orders Core + Inventory Allocation
-- Purpose: Create sales_orders, sales_order_lines, and inventory_allocations
-- Note: Combined migration to resolve dependencies
-- =============================================================================

-- =============================================================================
-- PART 1: Sales Orders Tables (Story 07.2)
-- =============================================================================

-- =============================================================================
-- Sales Orders Table - Main order header
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales_orders (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,

  -- Customer and Address
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_po TEXT,
  shipping_address_id UUID NOT NULL REFERENCES customer_addresses(id),

  -- Dates
  order_date DATE NOT NULL,
  promised_ship_date DATE,
  required_delivery_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'allocated', 'picking', 'packing', 'shipped', 'delivered', 'cancelled')),

  -- Financials
  total_amount DECIMAL(15,2),

  -- Quality
  allergen_validated BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT uq_sales_orders_org_number UNIQUE(org_id, order_number)
);

-- Indexes for sales_orders
CREATE INDEX IF NOT EXISTS idx_sales_orders_org_status ON sales_orders(org_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_org_date ON sales_orders(org_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_ship_date ON sales_orders(org_id, promised_ship_date);

-- Updated_at trigger for sales_orders
CREATE OR REPLACE FUNCTION update_sales_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_sales_orders_updated_at
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_orders_updated_at();

-- RLS for sales_orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_orders_select_org" ON sales_orders
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sales_orders_insert_org" ON sales_orders
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sales_orders_update_org" ON sales_orders
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sales_orders_delete_org" ON sales_orders
  FOR DELETE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Sales Order Lines Table - Individual line items
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales_order_lines (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,

  -- Product
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  quantity_ordered DECIMAL(15,4) NOT NULL CHECK (quantity_ordered > 0),
  quantity_allocated DECIMAL(15,4) DEFAULT 0 CHECK (quantity_allocated >= 0),
  quantity_picked DECIMAL(15,4) DEFAULT 0 CHECK (quantity_picked >= 0),
  quantity_packed DECIMAL(15,4) DEFAULT 0 CHECK (quantity_packed >= 0),
  quantity_shipped DECIMAL(15,4) DEFAULT 0 CHECK (quantity_shipped >= 0),

  -- Pricing
  unit_price DECIMAL(15,4) NOT NULL CHECK (unit_price >= 0),
  line_total DECIMAL(15,2),

  -- Special requests
  requested_lot TEXT,
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_so_lines_order_line UNIQUE(sales_order_id, line_number)
);

-- Indexes for sales_order_lines
CREATE INDEX IF NOT EXISTS idx_so_lines_order ON sales_order_lines(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_so_lines_product ON sales_order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_so_lines_org ON sales_order_lines(org_id);

-- Auto-calculate line_total trigger
CREATE OR REPLACE FUNCTION calculate_so_line_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_total = NEW.quantity_ordered * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_so_lines_calculate_total
  BEFORE INSERT OR UPDATE OF quantity_ordered, unit_price ON sales_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION calculate_so_line_total();

-- RLS for sales_order_lines
ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "so_lines_select_org" ON sales_order_lines
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "so_lines_insert_org" ON sales_order_lines
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "so_lines_update_org" ON sales_order_lines
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "so_lines_delete_org" ON sales_order_lines
  FOR DELETE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Sales Order Number Sequence per Organization per Year
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales_order_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_so_seq_org_year UNIQUE(org_id, year)
);

-- RLS for sequences
ALTER TABLE sales_order_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "so_seq_org" ON sales_order_number_sequences
  FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Function to generate next SO number: SO-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_sales_order_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_val BIGINT;
  v_so_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());

  INSERT INTO sales_order_number_sequences (org_id, year, current_value)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET
    current_value = sales_order_number_sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_next_val;

  v_so_number := 'SO-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

  RETURN v_so_number;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for sales orders tables
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_order_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_order_number_sequences TO authenticated;

-- =============================================================================
-- PART 2: Inventory Allocations Table (Story 07.7)
-- =============================================================================

-- =============================================================================
-- Inventory Allocations Table - Tracks LP allocation to SO lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS inventory_allocations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relationships
  sales_order_line_id UUID NOT NULL REFERENCES sales_order_lines(id) ON DELETE CASCADE,
  license_plate_id UUID NOT NULL REFERENCES license_plates(id),

  -- Quantities
  quantity_allocated DECIMAL(15,4) NOT NULL CHECK (quantity_allocated > 0),
  quantity_picked DECIMAL(15,4) DEFAULT 0 CHECK (quantity_picked >= 0),

  -- Audit
  allocated_at TIMESTAMPTZ DEFAULT now(),
  allocated_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT uq_so_line_lp UNIQUE(sales_order_line_id, license_plate_id),
  CONSTRAINT allocation_qty_check CHECK (quantity_allocated > 0),
  CONSTRAINT picked_lte_allocated CHECK (quantity_picked <= quantity_allocated)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_allocations_so_line ON inventory_allocations(sales_order_line_id);
CREATE INDEX IF NOT EXISTS idx_allocations_lp ON inventory_allocations(license_plate_id);
CREATE INDEX IF NOT EXISTS idx_allocations_org_active ON inventory_allocations(org_id) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_org_so ON inventory_allocations(org_id, sales_order_line_id);
CREATE INDEX IF NOT EXISTS idx_allocations_created ON inventory_allocations(org_id, created_at DESC);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_inventory_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_allocations_updated_at
BEFORE UPDATE ON inventory_allocations
FOR EACH ROW EXECUTE FUNCTION update_inventory_allocations_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE inventory_allocations ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "allocations_select_org" ON inventory_allocations
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "allocations_insert_org" ON inventory_allocations
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Update: Org isolation
CREATE POLICY "allocations_update_org" ON inventory_allocations
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation
CREATE POLICY "allocations_delete_org" ON inventory_allocations
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Helper Function: Get Total Allocated Qty for LP
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lp_allocated_qty_so(p_lp_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_allocated DECIMAL(15,4);
BEGIN
  SELECT COALESCE(SUM(quantity_allocated - quantity_picked), 0)
  INTO v_allocated
  FROM inventory_allocations
  WHERE license_plate_id = p_lp_id
    AND released_at IS NULL;

  RETURN v_allocated;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_allocations TO authenticated;
