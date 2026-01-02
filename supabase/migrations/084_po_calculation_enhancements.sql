-- Migration: PO Calculation Enhancements
-- Story: 03.4 - PO Totals + Tax Calculations
-- Date: 2025-01-02
--
-- Adds:
-- - shipping_cost column to purchase_orders
-- - tax_rate and tax_amount columns to purchase_order_lines (line-level tax)
-- - Updated triggers for line-level tax calculation (supports mixed rates)
-- - Trigger for shipping_cost updates
-- - Constraint for non-negative shipping_cost

-- ============================================================================
-- ADD SHIPPING_COST TO PURCHASE_ORDERS
-- ============================================================================

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(15,4) DEFAULT 0;

-- Add constraint for non-negative shipping cost
ALTER TABLE purchase_orders
ADD CONSTRAINT check_shipping_cost_positive
CHECK (shipping_cost >= 0);

COMMENT ON COLUMN purchase_orders.shipping_cost IS 'Shipping cost for the PO (header-level, not allocated to lines)';

-- ============================================================================
-- ADD LINE-LEVEL TAX COLUMNS TO PURCHASE_ORDER_LINES
-- ============================================================================

-- Add tax_rate column (line-level tax rate for mixed rate support)
ALTER TABLE purchase_order_lines
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;

-- Add tax_amount column (calculated tax for the line)
ALTER TABLE purchase_order_lines
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,4) DEFAULT 0;

-- Add constraint for tax_rate range
ALTER TABLE purchase_order_lines
ADD CONSTRAINT check_tax_rate_range
CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- Add constraint for non-negative discount_amount (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_discount_amount_positive'
  ) THEN
    ALTER TABLE purchase_order_lines
    ADD CONSTRAINT check_discount_amount_positive
    CHECK (discount_amount >= 0);
  END IF;
END $$;

COMMENT ON COLUMN purchase_order_lines.tax_rate IS 'Tax rate for this line (supports mixed rates per PO)';
COMMENT ON COLUMN purchase_order_lines.tax_amount IS 'Calculated: (line_total - discount_amount) * tax_rate / 100';

-- ============================================================================
-- UPDATE LINE CALCULATION TRIGGER FUNCTION
-- ============================================================================
-- Now includes tax_amount calculation based on line-level tax_rate

CREATE OR REPLACE FUNCTION calc_po_line_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate discount_amount from discount_percent
  NEW.discount_amount := ROUND(NEW.quantity * NEW.unit_price * (COALESCE(NEW.discount_percent, 0) / 100), 4);

  -- Calculate line_total (before discount is subtracted for subtotal purposes)
  NEW.line_total := ROUND(NEW.quantity * NEW.unit_price, 4);

  -- Calculate tax_amount on the discounted amount (line_total - discount_amount)
  NEW.tax_amount := ROUND((NEW.line_total - NEW.discount_amount) * (COALESCE(NEW.tax_rate, 0) / 100), 4);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE PO TOTALS TRIGGER FUNCTION
-- ============================================================================
-- Now supports:
-- - Line-level tax calculation (sum of line tax_amounts)
-- - Shipping cost in total calculation
-- - Formula: total = subtotal + tax + shipping - discount

CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_po_id UUID;
  v_subtotal DECIMAL(15,4);
  v_discount_total DECIMAL(15,4);
  v_tax_amount DECIMAL(15,4);
  v_shipping_cost DECIMAL(15,4);
BEGIN
  v_po_id := COALESCE(NEW.po_id, OLD.po_id);

  -- Calculate aggregates from all lines
  -- Subtotal: sum of line_total (quantity * unit_price before discount)
  -- Discount: sum of line discount_amount
  -- Tax: sum of line tax_amount (calculated on discounted amount)
  SELECT
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(discount_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_discount_total, v_tax_amount
  FROM purchase_order_lines
  WHERE po_id = v_po_id;

  -- Get current shipping_cost from PO
  SELECT COALESCE(shipping_cost, 0)
  INTO v_shipping_cost
  FROM purchase_orders
  WHERE id = v_po_id;

  -- Update PO totals
  -- Formula: total = subtotal + tax + shipping - discount
  UPDATE purchase_orders
  SET
    subtotal = v_subtotal,
    discount_total = v_discount_total,
    tax_amount = v_tax_amount,
    total = v_subtotal + v_tax_amount + v_shipping_cost - v_discount_total,
    updated_at = NOW()
  WHERE id = v_po_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NEW TRIGGER FUNCTION: Recalculate total when shipping_cost changes
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_po_total_with_shipping()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate total when shipping_cost changes
  -- Formula: total = subtotal + tax + shipping - discount
  NEW.total := NEW.subtotal + NEW.tax_amount + NEW.shipping_cost - NEW.discount_total;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shipping_cost updates
DROP TRIGGER IF EXISTS tr_po_shipping_update_totals ON purchase_orders;

CREATE TRIGGER tr_po_shipping_update_totals
  BEFORE UPDATE OF shipping_cost ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_po_total_with_shipping();

-- ============================================================================
-- ADD INDEX FOR FASTER LINE LOOKUPS BY PO (for trigger performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_po_lines_po_id ON purchase_order_lines(po_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION calc_po_line_totals() IS 'Trigger function: Calculate line discount_amount, line_total, and tax_amount (Story 03.4)';
COMMENT ON FUNCTION update_po_totals() IS 'Trigger function: Update PO header totals from lines with line-level tax and shipping (Story 03.4)';
COMMENT ON FUNCTION recalculate_po_total_with_shipping() IS 'Trigger function: Recalculate PO total when shipping_cost changes (Story 03.4)';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION recalculate_po_total_with_shipping() TO authenticated;
