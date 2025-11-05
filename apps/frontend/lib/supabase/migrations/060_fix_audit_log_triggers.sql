-- Migration 060: Fix Audit Log Triggers to use audit_log instead of audit_events
-- Purpose: Update triggers from migration 059 to write to audit_log table
-- Date: 2025-11-05

-- ==========================================
-- 1. Product Audit Logging Function (Updated)
-- ==========================================
CREATE OR REPLACE FUNCTION log_product_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(50);
  v_before JSONB;
  v_after JSONB;
  v_actor_id UUID;
BEGIN
  -- Get current user ID
  v_actor_id := auth.uid();
  
  -- Determine action type
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if it's an archive operation
    IF (OLD.is_active = true AND NEW.is_active = false) THEN
      v_action := 'ARCHIVE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;
  
  -- Insert audit record into audit_log
  INSERT INTO audit_log (
    entity, 
    entity_id, 
    action, 
    before, 
    after, 
    actor_id, 
    created_at
  ) VALUES (
    'products',
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_before,
    v_after,
    v_actor_id,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_product_audit() IS 'Logs all product changes (create/update/archive/delete) to audit_log table';

-- ==========================================
-- 2. BOM Audit Logging Function (Updated)
-- ==========================================
CREATE OR REPLACE FUNCTION log_bom_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(50);
  v_before JSONB;
  v_after JSONB;
  v_actor_id UUID;
BEGIN
  -- Get current user ID
  v_actor_id := auth.uid();
  
  -- Determine action type
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if it's status change
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      IF (NEW.status = 'active') THEN
        v_action := 'ACTIVATE';
      ELSIF (NEW.status = 'archived') THEN
        v_action := 'ARCHIVE';
      ELSE
        v_action := 'STATUS_CHANGE';
      END IF;
    ELSE
      v_action := 'UPDATE';
    END IF;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;
  
  -- Insert audit record into audit_log
  INSERT INTO audit_log (
    entity, 
    entity_id, 
    action, 
    before, 
    after, 
    actor_id, 
    created_at
  ) VALUES (
    'boms',
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_before,
    v_after,
    v_actor_id,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_bom_audit() IS 'Logs all BOM changes (create/update/activate/archive/delete) to audit_log table';

-- ==========================================
-- 3. BOM Items Audit Logging Function (Updated)
-- ==========================================
CREATE OR REPLACE FUNCTION log_bom_items_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(50);
  v_before JSONB;
  v_after JSONB;
  v_actor_id UUID;
BEGIN
  -- Get current user ID
  v_actor_id := auth.uid();
  
  -- Determine action type
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;
  
  -- Insert audit record into audit_log
  INSERT INTO audit_log (
    entity, 
    entity_id, 
    action, 
    before, 
    after, 
    actor_id, 
    created_at
  ) VALUES (
    'bom_items',
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_before,
    v_after,
    v_actor_id,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_bom_items_audit() IS 'Logs all BOM item changes to audit_log table';

-- ==========================================
-- 4. Recreate Triggers (they will use updated functions)
-- ==========================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS product_audit_trigger ON products;
DROP TRIGGER IF EXISTS bom_audit_trigger ON boms;
DROP TRIGGER IF EXISTS bom_items_audit_trigger ON bom_items;

-- Product audit trigger
CREATE TRIGGER product_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_audit();

COMMENT ON TRIGGER product_audit_trigger ON products IS 'Audits all product changes to audit_log';

-- BOM audit trigger
CREATE TRIGGER bom_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION log_bom_audit();

COMMENT ON TRIGGER bom_audit_trigger ON boms IS 'Audits all BOM changes to audit_log';

-- BOM items audit trigger
CREATE TRIGGER bom_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION log_bom_items_audit();

COMMENT ON TRIGGER bom_items_audit_trigger ON bom_items IS 'Audits all BOM item changes to audit_log';

