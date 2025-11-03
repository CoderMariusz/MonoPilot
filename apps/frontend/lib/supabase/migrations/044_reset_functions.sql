-- Migration 044: System Functions and Triggers
-- Purpose: Recreate essential RPC functions and triggers
-- Date: 2025-01-21

-- =============================================
-- 1. PLANNING FUNCTIONS
-- =============================================

-- Generate PO Number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_number TEXT;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT 'PO-' || year_part || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(number FROM 'PO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1, 3, '0')
  INTO next_number
  FROM po_header
  WHERE number LIKE 'PO-' || year_part || '-%';
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Generate TO Number
CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TEXT AS $$
DECLARE
  next_number TEXT;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT 'TO-' || year_part || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(number FROM 'TO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1, 3, '0')
  INTO next_number
  FROM to_header
  WHERE number LIKE 'TO-' || year_part || '-%';
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Update PO Totals Trigger Function
CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE po_header 
  SET 
    net_total = COALESCE((
      SELECT SUM(pl.qty_ordered * pl.unit_price) 
      FROM po_line pl 
      WHERE pl.po_id = COALESCE(NEW.po_id, OLD.po_id)
    ), 0),
    vat_total = COALESCE((
      SELECT SUM(pl.qty_ordered * pl.unit_price * pl.vat_rate / 100) 
      FROM po_line pl 
      WHERE pl.po_id = COALESCE(NEW.po_id, OLD.po_id)
    ), 0),
    gross_total = COALESCE((
      SELECT SUM(pl.qty_ordered * pl.unit_price * (1 + pl.vat_rate / 100)) 
      FROM po_line pl 
      WHERE pl.po_id = COALESCE(NEW.po_id, OLD.po_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.po_id, OLD.po_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for PO totals update
CREATE TRIGGER trigger_update_po_totals
  AFTER INSERT OR UPDATE OR DELETE ON po_line
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();

-- =============================================
-- 2. CANCEL FUNCTIONS (updated for new tables)
-- =============================================

-- Cancel Purchase Order
CREATE OR REPLACE FUNCTION cancel_purchase_order(p_po_id INTEGER, p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS po_header
LANGUAGE plpgsql
AS $$
DECLARE
  v_old po_header;
  v_grn_count INTEGER;
BEGIN
  SELECT * INTO v_old FROM po_header WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  -- Check if GRNs exist
  SELECT COUNT(*) INTO v_grn_count FROM grns WHERE po_id = p_po_id;
  IF v_grn_count > 0 THEN
    RAISE EXCEPTION 'Cannot cancel purchase order with existing GRNs';
  END IF;

  IF v_old.status IN ('closed') THEN
    RAISE EXCEPTION 'Cannot cancel purchase order in status %', v_old.status;
  END IF;

  UPDATE po_header
     SET status = 'draft', updated_at = NOW()
   WHERE id = p_po_id
  RETURNING * INTO v_old;

  INSERT INTO audit_log(entity, entity_id, action, before, after, actor_id, created_at)
  VALUES ('po_header', p_po_id, 'cancel', 
          jsonb_build_object('status', v_old.status), 
          jsonb_build_object('status', 'draft'), 
          p_user_id, NOW());

  RETURN v_old;
END $$;

-- Cancel Transfer Order
CREATE OR REPLACE FUNCTION cancel_transfer_order(p_to_id INTEGER, p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS to_header
LANGUAGE plpgsql
AS $$
DECLARE
  v_old to_header;
BEGIN
  SELECT * INTO v_old FROM to_header WHERE id = p_to_id FOR UPDATE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Transfer order not found';
  END IF;

  IF v_old.status IN ('closed') THEN
    RAISE EXCEPTION 'Cannot cancel transfer order in status %', v_old.status;
  END IF;

  UPDATE to_header
     SET status = 'draft', updated_at = NOW()
   WHERE id = p_to_id
  RETURNING * INTO v_old;

  INSERT INTO audit_log(entity, entity_id, action, before, after, actor_id, created_at)
  VALUES ('to_header', p_to_id, 'cancel', 
          jsonb_build_object('status', v_old.status), 
          jsonb_build_object('status', 'draft'), 
          p_user_id, NOW());

  RETURN v_old;
END $$;

-- Cancel Work Order
CREATE OR REPLACE FUNCTION cancel_work_order(p_wo_id INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS work_orders
LANGUAGE plpgsql
AS $$
DECLARE
  v_old work_orders;
BEGIN
  SELECT * INTO v_old FROM work_orders WHERE id = p_wo_id FOR UPDATE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Work order not found';
  END IF;

  IF v_old.status IN ('in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel work order in status %', v_old.status;
  END IF;

  UPDATE work_orders
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = p_wo_id
  RETURNING * INTO v_old;

  INSERT INTO audit_log(entity, entity_id, action, before, after, created_at)
  VALUES ('work_orders', p_wo_id, 'cancel', 
          jsonb_build_object('status', v_old.status), 
          jsonb_build_object('status', 'cancelled'), 
          NOW());

  RETURN v_old;
END $$;

-- =============================================
-- 3. BOM SNAPSHOT FUNCTION
-- =============================================

-- Snapshot BOM to WO Materials
CREATE OR REPLACE FUNCTION snapshot_bom_on_wo_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert BOM items into wo_materials
  INSERT INTO wo_materials (wo_id, material_id, qty_per_unit, total_qty_needed, uom, production_line_restrictions, consume_whole_lp)
  SELECT 
    NEW.id,
    bi.material_id,
    bi.quantity as qty_per_unit,
    bi.quantity * NEW.quantity as total_qty_needed,
    bi.uom,
    bi.production_line_restrictions,
    bi.consume_whole_lp
  FROM bom_items bi
  WHERE bi.bom_id = NEW.bom_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to snapshot BOM on WO creation
CREATE TRIGGER trigger_snapshot_bom_on_wo_creation
  AFTER INSERT ON work_orders
  FOR EACH ROW
  WHEN (NEW.bom_id IS NOT NULL)
  EXECUTE FUNCTION snapshot_bom_on_wo_creation();

-- =============================================
-- 4. GUARD FUNCTIONS
-- =============================================

-- Guard BOM hard delete
CREATE OR REPLACE FUNCTION guard_boms_hard_delete() 
RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'Cannot hard-delete non-draft BOM. Status: %', OLD.status;
  END IF;
  
  IF EXISTS (SELECT 1 FROM work_orders WHERE bom_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot hard-delete BOM referenced by Work Orders';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for BOM delete guard
CREATE TRIGGER trg_boms_guard_delete
  BEFORE DELETE ON boms
  FOR EACH ROW EXECUTE FUNCTION guard_boms_hard_delete();

