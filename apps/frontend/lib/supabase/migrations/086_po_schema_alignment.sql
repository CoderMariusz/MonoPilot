-- Migration 086: PO Schema Alignment
-- Story: 0-15-po-database-api-alignment
-- Adds missing columns to po_header and po_line to match architecture.md

-- Phase 1: Add missing columns to po_header
ALTER TABLE po_header
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,6) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS requested_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promised_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snapshot_supplier_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS snapshot_supplier_vat VARCHAR(50),
  ADD COLUMN IF NOT EXISTS snapshot_supplier_address TEXT,
  ADD COLUMN IF NOT EXISTS asn_ref VARCHAR(50),
  ADD COLUMN IF NOT EXISTS net_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Phase 2: Add missing columns to po_line
ALTER TABLE po_line
  ADD COLUMN IF NOT EXISTS requested_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promised_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS default_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,4) DEFAULT 0;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_po_header_approved_by ON po_header(approved_by);
CREATE INDEX IF NOT EXISTS idx_po_line_default_location ON po_line(default_location_id);

-- Phase 3: Backfill supplier snapshots for existing POs
UPDATE po_header ph
SET
  snapshot_supplier_name = s.name,
  snapshot_supplier_vat = s.vat_number,
  snapshot_supplier_address = s.address
FROM suppliers s
WHERE ph.supplier_id = s.id
  AND ph.snapshot_supplier_name IS NULL;

-- Phase 4: Calculate totals for existing POs
UPDATE po_header ph
SET
  net_total = COALESCE((
    SELECT SUM(pl.quantity * pl.unit_price)
    FROM po_line pl
    WHERE pl.po_id = ph.id
  ), 0),
  vat_total = COALESCE((
    SELECT SUM(pl.quantity * pl.unit_price * COALESCE(pl.vat_rate, 0))
    FROM po_line pl
    WHERE pl.po_id = ph.id
  ), 0)
WHERE ph.net_total IS NULL OR ph.net_total = 0;

UPDATE po_header
SET gross_total = net_total + vat_total
WHERE gross_total IS NULL OR gross_total = 0;
