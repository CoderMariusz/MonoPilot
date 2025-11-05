-- Migration 059: Audit Log for Products and BOMs
-- Purpose: Add audit logging triggers for product and BOM changes with reason field
-- Date: 2025-11-05

-- ==========================================
-- 1. Product Audit Logging Function
-- ==========================================
CREATE OR REPLACE FUNCTION log_product_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type VARCHAR(50);
  v_old_value JSONB;
  v_new_value JSONB;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'create';
    v_old_value := NULL;
    v_new_value := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if it's an archive operation
    IF (OLD.is_active = true AND NEW.is_active = false) THEN
      v_event_type := 'archive';
    ELSE
      v_event_type := 'update';
    END IF;
    v_old_value := to_jsonb(OLD);
    v_new_value := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_event_type := 'delete';
    v_old_value := to_jsonb(OLD);
    v_new_value := NULL;
  END IF;
  
  -- Insert audit record
  INSERT INTO audit_events (
    entity_type, 
    entity_id, 
    event_type, 
    old_value, 
    new_value, 
    user_id, 
    reason,
    timestamp
  ) VALUES (
    'products',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_event_type,
    v_old_value,
    v_new_value,
    v_user_id::INTEGER,
    NULL, -- Reason will be set via separate update if provided by UI
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_product_audit() IS 'Logs all product changes (create/update/archive/delete) to audit_events table';

-- ==========================================
-- 2. BOM Audit Logging Function
-- ==========================================
CREATE OR REPLACE FUNCTION log_bom_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type VARCHAR(50);
  v_old_value JSONB;
  v_new_value JSONB;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'create';
    v_old_value := NULL;
    v_new_value := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if it's status change
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      IF (NEW.status = 'active') THEN
        v_event_type := 'activate';
      ELSIF (NEW.status = 'archived') THEN
        v_event_type := 'archive';
      ELSE
        v_event_type := 'status_change';
      END IF;
    ELSE
      v_event_type := 'update';
    END IF;
    v_old_value := to_jsonb(OLD);
    v_new_value := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_event_type := 'delete';
    v_old_value := to_jsonb(OLD);
    v_new_value := NULL;
  END IF;
  
  -- Insert audit record
  INSERT INTO audit_events (
    entity_type, 
    entity_id, 
    event_type, 
    old_value, 
    new_value, 
    user_id, 
    reason,
    timestamp
  ) VALUES (
    'boms',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_event_type,
    v_old_value,
    v_new_value,
    v_user_id::INTEGER,
    NULL, -- Reason will be set via separate update if provided by UI
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_bom_audit() IS 'Logs all BOM changes (create/update/activate/archive/delete) to audit_events table';

-- ==========================================
-- 3. BOM Items Audit Logging Function
-- ==========================================
CREATE OR REPLACE FUNCTION log_bom_items_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type VARCHAR(50);
  v_old_value JSONB;
  v_new_value JSONB;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'create';
    v_old_value := NULL;
    v_new_value := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_event_type := 'update';
    v_old_value := to_jsonb(OLD);
    v_new_value := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_event_type := 'delete';
    v_old_value := to_jsonb(OLD);
    v_new_value := NULL;
  END IF;
  
  -- Insert audit record
  INSERT INTO audit_events (
    entity_type, 
    entity_id, 
    event_type, 
    old_value, 
    new_value, 
    user_id, 
    reason,
    timestamp
  ) VALUES (
    'bom_items',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_event_type,
    v_old_value,
    v_new_value,
    v_user_id::INTEGER,
    NULL, -- Reason will be set via separate update if provided by UI
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_bom_items_audit() IS 'Logs all BOM item changes to audit_events table';

-- ==========================================
-- 4. Create Triggers
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

COMMENT ON TRIGGER product_audit_trigger ON products IS 'Audits all product changes';

-- BOM audit trigger
CREATE TRIGGER bom_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION log_bom_audit();

COMMENT ON TRIGGER bom_audit_trigger ON boms IS 'Audits all BOM changes';

-- BOM items audit trigger
CREATE TRIGGER bom_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION log_bom_items_audit();

COMMENT ON TRIGGER bom_items_audit_trigger ON bom_items IS 'Audits all BOM item changes';

-- ==========================================
-- 5. Helper Function to Add Reason
-- ==========================================
CREATE OR REPLACE FUNCTION add_audit_reason(
  p_entity_type VARCHAR(50),
  p_entity_id INTEGER,
  p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update the most recent audit event for this entity with the reason
  UPDATE audit_events
  SET reason = p_reason
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id::TEXT
    AND reason IS NULL
  ORDER BY timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_audit_reason(VARCHAR, INTEGER, TEXT) IS 'Adds a reason to the most recent audit event for an entity';

-- ==========================================
-- 6. Grant Permissions
-- ==========================================
GRANT EXECUTE ON FUNCTION add_audit_reason(VARCHAR, INTEGER, TEXT) TO authenticated;

