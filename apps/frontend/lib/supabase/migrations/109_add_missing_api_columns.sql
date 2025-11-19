-- Migration 109: Add Missing API Columns
-- Epic 0: Database & API Alignment
-- Date: 2025-11-18

-- ============================================================================
-- Phase 1: Critical Columns (Required for basic functionality)
-- ============================================================================

-- work_orders: Add wo_number for identification
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS wo_number text;

-- Generate wo_number for existing records
UPDATE work_orders
SET wo_number = 'WO-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(id::text, 6, '0')
WHERE wo_number IS NULL;

-- Make wo_number required and unique per org
ALTER TABLE work_orders ALTER COLUMN wo_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_wo_number_org
ON work_orders(org_id, wo_number);

-- po_line: Add default_location_id for receiving
ALTER TABLE po_line ADD COLUMN IF NOT EXISTS default_location_id integer REFERENCES locations(id);

-- to_line: Add LP tracking
ALTER TABLE to_line ADD COLUMN IF NOT EXISTS lp_id integer REFERENCES license_plates(id);
ALTER TABLE to_line ADD COLUMN IF NOT EXISTS batch text;

-- ============================================================================
-- Phase 2: Workflow Columns (Required for full workflow)
-- ============================================================================

-- work_orders: Actual execution tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_start timestamp;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_end timestamp;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_output_qty numeric;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS machine_id integer REFERENCES machines(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- to_header: Shipping/receiving workflow
ALTER TABLE to_header ADD COLUMN IF NOT EXISTS requested_date timestamp;
ALTER TABLE to_header ADD COLUMN IF NOT EXISTS planned_ship_date timestamp;
ALTER TABLE to_header ADD COLUMN IF NOT EXISTS actual_ship_date timestamp;
ALTER TABLE to_header ADD COLUMN IF NOT EXISTS planned_receive_date timestamp;
ALTER TABLE to_header ADD COLUMN IF NOT EXISTS actual_receive_date timestamp;
ALTER TABLE to_header ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- po_header: Date tracking and totals
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS promised_delivery_date timestamp;
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS requested_delivery_date timestamp;
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS payment_due_date timestamp;
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS gross_total numeric;
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS net_total numeric;
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS vat_total numeric;
ALTER TABLE po_header ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1.0;

-- po_line: VAT tracking
ALTER TABLE po_line ADD COLUMN IF NOT EXISTS vat_rate numeric;

-- ============================================================================
-- Phase 3: Enhanced Features (KPI and audit tracking)
-- ============================================================================

-- work_orders: KPI tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS kpi_scope text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS line_number text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS planned_boxes integer;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_boxes integer;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS box_weight_kg numeric;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS current_operation_seq integer DEFAULT 0;

-- work_orders: Closure tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES auth.users(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS closed_at timestamp;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS closed_source text;

-- work_orders: Source demand tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS source_demand_type text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS source_demand_id integer;

-- bom_history: Description field for notes
ALTER TABLE bom_history ADD COLUMN IF NOT EXISTS description text;

-- ============================================================================
-- Create function to generate WO numbers
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_wo_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_year text;
    v_seq integer;
    v_number text;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CASE
            WHEN wo_number ~ ('^WO-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(wo_number FROM '[0-9]+$') AS integer)
            ELSE 0
        END
    ), 0) + 1 INTO v_seq
    FROM work_orders;

    v_number := 'WO-' || v_year || '-' || LPAD(v_seq::text, 6, '0');

    RETURN v_number;
END;
$$;

-- ============================================================================
-- Create indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_orders_actual_start ON work_orders(actual_start);
CREATE INDEX IF NOT EXISTS idx_work_orders_machine_id ON work_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_kpi_scope ON work_orders(kpi_scope);
CREATE INDEX IF NOT EXISTS idx_to_header_actual_ship_date ON to_header(actual_ship_date);
CREATE INDEX IF NOT EXISTS idx_to_header_actual_receive_date ON to_header(actual_receive_date);
CREATE INDEX IF NOT EXISTS idx_po_header_promised_delivery ON po_header(promised_delivery_date);
CREATE INDEX IF NOT EXISTS idx_to_line_lp_id ON to_line(lp_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN work_orders.wo_number IS 'Human-readable work order number (WO-YYYY-NNNNNN)';
COMMENT ON COLUMN work_orders.actual_start IS 'Actual start datetime of production';
COMMENT ON COLUMN work_orders.actual_end IS 'Actual end datetime of production';
COMMENT ON COLUMN work_orders.actual_output_qty IS 'Actual quantity produced';
COMMENT ON COLUMN work_orders.kpi_scope IS 'KPI reporting scope (PR=Preparation, FG=Finished Goods)';
COMMENT ON COLUMN work_orders.source_demand_type IS 'Source of demand (Manual, SO, TO)';

COMMENT ON COLUMN to_header.actual_ship_date IS 'Actual date when items were shipped';
COMMENT ON COLUMN to_header.actual_receive_date IS 'Actual date when items were received';

COMMENT ON COLUMN po_header.gross_total IS 'Total amount including VAT';
COMMENT ON COLUMN po_header.net_total IS 'Total amount excluding VAT';
COMMENT ON COLUMN po_header.vat_total IS 'Total VAT amount';

COMMENT ON COLUMN to_line.lp_id IS 'License plate ID for transferred items';
COMMENT ON COLUMN to_line.batch IS 'Batch number for transferred items';
