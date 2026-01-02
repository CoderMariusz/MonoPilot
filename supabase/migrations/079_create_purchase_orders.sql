-- Migration: Create Purchase Orders tables
-- Story: 03.3 - PO CRUD + Lines
-- Date: 2025-12-31
--
-- Creates:
-- - purchase_orders: PO header with supplier, dates, totals
-- - purchase_order_lines: PO line items with product, quantity, pricing
-- - po_status_history: Audit trail of status changes
-- - RLS policies following ADR-013 pattern
-- - Triggers for auto-calculation of totals
-- - PO number generation function (PO-YYYY-NNNNN format)

-- ============================================================================
-- PURCHASE ORDERS TABLE (Header)
-- ============================================================================

CREATE TABLE purchase_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number               VARCHAR(20) NOT NULL,
  supplier_id             UUID NOT NULL REFERENCES suppliers(id),
  currency                VARCHAR(3) NOT NULL DEFAULT 'PLN',
  tax_code_id             UUID REFERENCES tax_codes(id),
  expected_delivery_date  DATE NOT NULL,
  warehouse_id            UUID NOT NULL REFERENCES warehouses(id),
  status                  VARCHAR(20) NOT NULL DEFAULT 'draft',
  payment_terms           VARCHAR(50),
  shipping_method         VARCHAR(100),
  notes                   TEXT,
  internal_notes          TEXT,
  -- Approval fields (used by Story 03.5)
  approval_status         VARCHAR(20),
  approved_by             UUID REFERENCES users(id),
  approved_at             TIMESTAMPTZ,
  approval_notes          TEXT,
  -- Calculated totals (denormalized for performance)
  subtotal                DECIMAL(15,4) DEFAULT 0,
  tax_amount              DECIMAL(15,4) DEFAULT 0,
  total                   DECIMAL(15,4) DEFAULT 0,
  discount_total          DECIMAL(15,4) DEFAULT 0,
  -- Audit fields
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  created_by              UUID REFERENCES users(id),
  updated_by              UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT purchase_orders_org_number_unique UNIQUE(org_id, po_number),
  CONSTRAINT purchase_orders_status_check CHECK (
    status IN ('draft', 'submitted', 'pending_approval', 'confirmed', 'receiving', 'closed', 'cancelled')
  ),
  CONSTRAINT purchase_orders_currency_check CHECK (
    currency IN ('PLN', 'EUR', 'USD', 'GBP')
  )
);

-- Indexes for performance
CREATE INDEX idx_po_org_status ON purchase_orders(org_id, status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_po_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_po_created_at ON purchase_orders(created_at DESC);
CREATE INDEX idx_po_org_number ON purchase_orders(org_id, po_number);

-- ============================================================================
-- PURCHASE ORDER LINES TABLE
-- ============================================================================

CREATE TABLE purchase_order_lines (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id                   UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number             INTEGER NOT NULL,
  product_id              UUID NOT NULL REFERENCES products(id),
  quantity                DECIMAL(15,4) NOT NULL,
  uom                     VARCHAR(20) NOT NULL,
  unit_price              DECIMAL(15,4) NOT NULL,
  discount_percent        DECIMAL(5,2) DEFAULT 0,
  discount_amount         DECIMAL(15,4) DEFAULT 0,
  line_total              DECIMAL(15,4) NOT NULL,
  expected_delivery_date  DATE,
  confirmed_delivery_date DATE,
  received_qty            DECIMAL(15,4) DEFAULT 0,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT po_lines_po_line_unique UNIQUE(po_id, line_number),
  CONSTRAINT po_lines_quantity_positive CHECK (quantity > 0),
  CONSTRAINT po_lines_unit_price_nonneg CHECK (unit_price >= 0),
  CONSTRAINT po_lines_discount_range CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT po_lines_received_qty_range CHECK (received_qty >= 0)
);

-- Indexes for performance
CREATE INDEX idx_po_lines_po ON purchase_order_lines(po_id);
CREATE INDEX idx_po_lines_product ON purchase_order_lines(product_id);
CREATE INDEX idx_po_lines_po_line ON purchase_order_lines(po_id, line_number);

-- ============================================================================
-- PO STATUS HISTORY TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE po_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id         UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  from_status   VARCHAR(20),
  to_status     VARCHAR(20) NOT NULL,
  changed_by    UUID REFERENCES users(id),
  changed_at    TIMESTAMPTZ DEFAULT NOW(),
  notes         TEXT
);

-- Indexes for performance
CREATE INDEX idx_po_history_po ON po_status_history(po_id);
CREATE INDEX idx_po_history_changed_at ON po_status_history(changed_at DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PURCHASE ORDERS (ADR-013 pattern)
-- ============================================================================

-- SELECT: All authenticated users in org can read
CREATE POLICY po_select ON purchase_orders
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Only owner, admin, planner, production_manager can create
CREATE POLICY po_insert ON purchase_orders
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'planner', 'production_manager')
    )
  );

-- UPDATE: Only owner, admin, planner, production_manager can update
CREATE POLICY po_update ON purchase_orders
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'planner', 'production_manager')
    )
  );

-- DELETE: Only owner, admin, planner can delete DRAFT POs
CREATE POLICY po_delete ON purchase_orders
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND status = 'draft'
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'planner')
    )
  );

-- ============================================================================
-- RLS POLICIES - PURCHASE ORDER LINES (inherited via FK to purchase_orders)
-- ============================================================================

-- SELECT: Inherit from parent PO
CREATE POLICY po_lines_select ON purchase_order_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_lines.po_id
        AND po.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: Only when PO is in draft or submitted status
CREATE POLICY po_lines_insert ON purchase_order_lines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_lines.po_id
        AND po.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND po.status IN ('draft', 'submitted')
    )
  );

-- UPDATE: Only when PO is in draft or submitted status
CREATE POLICY po_lines_update ON purchase_order_lines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_lines.po_id
        AND po.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND po.status IN ('draft', 'submitted')
    )
  );

-- DELETE: Only when PO is draft AND received_qty = 0
CREATE POLICY po_lines_delete ON purchase_order_lines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_lines.po_id
        AND po.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND po.status = 'draft'
    )
    AND received_qty = 0
  );

-- ============================================================================
-- RLS POLICIES - PO STATUS HISTORY (inherited via FK to purchase_orders)
-- ============================================================================

-- SELECT: Inherit from parent PO
CREATE POLICY po_history_select ON po_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = po_status_history.po_id
        AND po.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: Only when PO is accessible
CREATE POLICY po_history_insert ON po_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = po_status_history.po_id
        AND po.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- FUNCTION: Generate PO Number (PO-YYYY-NNNNN format)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_po_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_next_seq INTEGER;
  v_prefix TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_prefix := 'PO-' || v_year || '-';

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(po_number FROM LENGTH(v_prefix) + 1) AS INTEGER)
  ), 0) + 1
  INTO v_next_seq
  FROM purchase_orders
  WHERE org_id = p_org_id
    AND po_number LIKE v_prefix || '%';

  RETURN v_prefix || LPAD(v_next_seq::TEXT, 5, '0');
END;
$$;

-- ============================================================================
-- TRIGGER FUNCTION: Auto-generate PO number on insert
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if po_number is null or empty
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := generate_po_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_auto_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_po_number();

-- ============================================================================
-- TRIGGER FUNCTION: Calculate line discount_amount and line_total
-- ============================================================================

CREATE OR REPLACE FUNCTION calc_po_line_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.discount_amount := ROUND(NEW.quantity * NEW.unit_price * (COALESCE(NEW.discount_percent, 0) / 100), 4);
  NEW.line_total := ROUND((NEW.quantity * NEW.unit_price) - NEW.discount_amount, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_line_calc_totals
  BEFORE INSERT OR UPDATE ON purchase_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION calc_po_line_totals();

-- ============================================================================
-- TRIGGER FUNCTION: Update PO header totals when lines change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_po_id UUID;
  v_subtotal DECIMAL(15,4);
  v_discount_total DECIMAL(15,4);
  v_tax_rate DECIMAL(5,2);
  v_tax_amount DECIMAL(15,4);
BEGIN
  v_po_id := COALESCE(NEW.po_id, OLD.po_id);

  -- Calculate aggregates from all lines
  SELECT
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(discount_amount), 0)
  INTO v_subtotal, v_discount_total
  FROM purchase_order_lines
  WHERE po_id = v_po_id;

  -- Get tax rate from PO's tax_code
  SELECT COALESCE(tc.rate, 0)
  INTO v_tax_rate
  FROM purchase_orders po
  LEFT JOIN tax_codes tc ON po.tax_code_id = tc.id
  WHERE po.id = v_po_id;

  v_tax_amount := ROUND(v_subtotal * (COALESCE(v_tax_rate, 0) / 100), 4);

  -- Update PO totals
  UPDATE purchase_orders
  SET
    subtotal = v_subtotal,
    discount_total = v_discount_total,
    tax_amount = v_tax_amount,
    total = v_subtotal + v_tax_amount,
    updated_at = NOW()
  WHERE id = v_po_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER tr_po_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_po_lines_updated_at
  BEFORE UPDATE ON purchase_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER FUNCTION: Auto-increment line_number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_po_line_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get next line number for this PO if not specified
  IF NEW.line_number IS NULL OR NEW.line_number = 0 THEN
    SELECT COALESCE(MAX(line_number), 0) + 1
    INTO NEW.line_number
    FROM purchase_order_lines
    WHERE po_id = NEW.po_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_lines_auto_number
  BEFORE INSERT ON purchase_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION generate_po_line_number();

-- ============================================================================
-- TRIGGER FUNCTION: Renumber lines after deletion
-- ============================================================================

CREATE OR REPLACE FUNCTION renumber_po_lines()
RETURNS TRIGGER AS $$
BEGIN
  -- Renumber all lines after the deleted line
  UPDATE purchase_order_lines
  SET line_number = line_number - 1
  WHERE po_id = OLD.po_id
    AND line_number > OLD.line_number;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_lines_renumber
  AFTER DELETE ON purchase_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION renumber_po_lines();

-- ============================================================================
-- TRIGGER FUNCTION: Record status history on status change
-- ============================================================================

CREATE OR REPLACE FUNCTION record_po_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO po_status_history (po_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_status_history
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_po_status_history();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_lines TO authenticated;
GRANT SELECT, INSERT ON po_status_history TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase_orders IS 'Purchase Order headers with supplier, dates, totals (Story 03.3)';
COMMENT ON TABLE purchase_order_lines IS 'PO line items with product, quantity, pricing (Story 03.3)';
COMMENT ON TABLE po_status_history IS 'Audit trail of PO status changes (Story 03.3)';

COMMENT ON COLUMN purchase_orders.po_number IS 'Auto-generated PO number in PO-YYYY-NNNNN format';
COMMENT ON COLUMN purchase_orders.status IS 'Lifecycle: draft -> submitted -> pending_approval -> confirmed -> receiving -> closed | cancelled';
COMMENT ON COLUMN purchase_orders.subtotal IS 'Sum of all line_total values (calculated by trigger)';
COMMENT ON COLUMN purchase_orders.tax_amount IS 'subtotal * tax_code.rate / 100 (calculated by trigger)';
COMMENT ON COLUMN purchase_orders.total IS 'subtotal + tax_amount (calculated by trigger)';
COMMENT ON COLUMN purchase_orders.discount_total IS 'Sum of all line discount_amount values (calculated by trigger)';

COMMENT ON COLUMN purchase_order_lines.line_number IS 'Auto-incremented line number per PO';
COMMENT ON COLUMN purchase_order_lines.discount_amount IS 'Calculated: quantity * unit_price * discount_percent / 100';
COMMENT ON COLUMN purchase_order_lines.line_total IS 'Calculated: (quantity * unit_price) - discount_amount';
COMMENT ON COLUMN purchase_order_lines.received_qty IS 'Cumulative received quantity from GRN (Epic 05)';

COMMENT ON FUNCTION generate_po_number(UUID) IS 'Generate next PO number as PO-YYYY-NNNNN for org/year';
COMMENT ON FUNCTION calc_po_line_totals() IS 'Trigger function: Calculate line discount_amount and line_total';
COMMENT ON FUNCTION update_po_totals() IS 'Trigger function: Update PO header totals when lines change';
COMMENT ON FUNCTION record_po_status_history() IS 'Trigger function: Record status change in history table';
