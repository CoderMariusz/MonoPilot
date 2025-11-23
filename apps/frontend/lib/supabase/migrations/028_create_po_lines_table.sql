-- Migration 028: Create po_lines table with totals recalculation trigger
-- Epic 3 Batch 3A: Purchase Orders & Suppliers
-- Story 3.2: PO Line Management
-- Date: 2025-01-23

-- Create po_lines table
CREATE TABLE po_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL,

  quantity NUMERIC(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,

  -- Calculated fields
  line_subtotal NUMERIC(15,2) NOT NULL,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total_with_tax NUMERIC(15,2) NOT NULL,

  expected_delivery_date DATE,
  received_qty NUMERIC(15,3) DEFAULT 0, -- Epic 5

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: sequence unique per PO
  CONSTRAINT idx_po_lines_sequence UNIQUE (po_id, sequence),

  -- Check constraints
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT unit_price_nonnegative CHECK (unit_price >= 0),
  CONSTRAINT discount_valid CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT line_subtotal_nonnegative CHECK (line_subtotal >= 0),
  CONSTRAINT line_total_nonnegative CHECK (line_total >= 0),
  CONSTRAINT tax_nonnegative CHECK (tax_amount >= 0),
  CONSTRAINT received_qty_nonnegative CHECK (received_qty >= 0)
);

-- Indexes
CREATE INDEX idx_po_lines_org ON po_lines(org_id);
CREATE INDEX idx_po_lines_po ON po_lines(po_id);
CREATE INDEX idx_po_lines_product ON po_lines(product_id);

-- RLS Policy
ALTER TABLE po_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_lines_isolation ON po_lines
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Comments
COMMENT ON TABLE po_lines IS 'Purchase order line items with automatic totals calculation - Story 3.2';
COMMENT ON COLUMN po_lines.sequence IS 'Line number (1, 2, 3...), unique within PO';
COMMENT ON COLUMN po_lines.line_subtotal IS 'quantity × unit_price';
COMMENT ON COLUMN po_lines.discount_amount IS 'line_subtotal × (discount_percent / 100)';
COMMENT ON COLUMN po_lines.line_total IS 'line_subtotal - discount_amount';
COMMENT ON COLUMN po_lines.tax_amount IS 'line_total × tax_rate (from supplier.tax_code_id)';
COMMENT ON COLUMN po_lines.line_total_with_tax IS 'line_total + tax_amount';

-- ============================================================================
-- TRIGGER: Recalculate PO totals when lines change (Story 3.2, AC-2.6)
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_po_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE purchase_orders
    SET
      subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM po_lines WHERE po_id = NEW.po_id),
      tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM po_lines WHERE po_id = NEW.po_id),
      total = (SELECT COALESCE(SUM(line_total_with_tax), 0) FROM po_lines WHERE po_id = NEW.po_id),
      updated_at = NOW()
    WHERE id = NEW.po_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE purchase_orders
    SET
      subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM po_lines WHERE po_id = OLD.po_id),
      tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM po_lines WHERE po_id = OLD.po_id),
      total = (SELECT COALESCE(SUM(line_total_with_tax), 0) FROM po_lines WHERE po_id = OLD.po_id),
      updated_at = NOW()
    WHERE id = OLD.po_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalc_po_totals
AFTER INSERT OR UPDATE OR DELETE ON po_lines
FOR EACH ROW
EXECUTE FUNCTION recalculate_po_totals();

COMMENT ON FUNCTION recalculate_po_totals IS 'Automatically recalculates PO totals when lines are added/updated/deleted - Story 3.2, AC-2.6';
