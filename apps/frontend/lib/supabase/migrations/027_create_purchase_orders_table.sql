-- Migration 027: Create purchase_orders table for Story 3.1
-- Epic 3 Batch 3A: Purchase Orders & Suppliers
-- Date: 2025-01-23

-- Create purchase_orders table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_number VARCHAR(20) NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  payment_terms VARCHAR(100),
  shipping_method VARCHAR(100),
  notes TEXT,

  -- Financial fields (all in supplier currency)
  currency VARCHAR(3) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Approval fields (Story 3.4)
  approval_status VARCHAR(20),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: PO number unique per org
  CONSTRAINT idx_po_org_number UNIQUE (org_id, po_number),

  -- Check constraints
  CONSTRAINT currency_valid CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP')),
  CONSTRAINT subtotal_nonnegative CHECK (subtotal >= 0),
  CONSTRAINT tax_nonnegative CHECK (tax_amount >= 0),
  CONSTRAINT total_nonnegative CHECK (total >= 0),
  CONSTRAINT approval_status_valid CHECK (approval_status IS NULL OR approval_status IN ('pending', 'approved', 'rejected'))
);

-- Indexes
CREATE INDEX idx_po_org ON purchase_orders(org_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_expected_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_po_approval_status ON purchase_orders(approval_status);

-- RLS Policy
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_isolation ON purchase_orders
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Comments
COMMENT ON TABLE purchase_orders IS 'Purchase orders - Story 3.1';
COMMENT ON COLUMN purchase_orders.po_number IS 'Auto-generated PO number: PO-YYYY-NNNN (e.g., PO-2025-0001)';
COMMENT ON COLUMN purchase_orders.currency IS 'Inherited from supplier currency';
COMMENT ON COLUMN purchase_orders.subtotal IS 'Sum of all PO line totals (calculated)';
COMMENT ON COLUMN purchase_orders.tax_amount IS 'Sum of all PO line taxes (calculated)';
COMMENT ON COLUMN purchase_orders.total IS 'subtotal + tax_amount (calculated)';
COMMENT ON COLUMN purchase_orders.approval_status IS 'Approval status: null (no approval needed), pending, approved, rejected';
