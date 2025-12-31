-- Migration: Work order triggers
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: Triggers for status history tracking and timestamp updates

-- ============================================================================
-- FUNCTION: record_wo_status_change
-- Purpose: Record status changes in wo_status_history table
-- ============================================================================

CREATE OR REPLACE FUNCTION record_wo_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only record if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO wo_status_history (
      wo_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.updated_by,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION record_wo_status_change IS 'Trigger function to record WO status changes (Story 03.10)';

-- ============================================================================
-- TRIGGER: tr_wo_status_history
-- Purpose: Fire after status column update
-- ============================================================================

DROP TRIGGER IF EXISTS tr_wo_status_history ON work_orders;

CREATE TRIGGER tr_wo_status_history
  AFTER UPDATE OF status ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_wo_status_change();

COMMENT ON TRIGGER tr_wo_status_history ON work_orders IS 'Record status transitions in history table';

-- ============================================================================
-- FUNCTION: update_wo_timestamp
-- Purpose: Auto-update updated_at on any modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wo_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_wo_timestamp IS 'Auto-update updated_at timestamp (Story 03.10)';

-- ============================================================================
-- TRIGGER: tr_wo_update_timestamp
-- Purpose: Fire before any update to update timestamp
-- ============================================================================

DROP TRIGGER IF EXISTS tr_wo_update_timestamp ON work_orders;

CREATE TRIGGER tr_wo_update_timestamp
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_wo_timestamp();

COMMENT ON TRIGGER tr_wo_update_timestamp ON work_orders IS 'Auto-update updated_at on modification';

-- ============================================================================
-- FUNCTION: record_wo_initial_status
-- Purpose: Record initial draft status on WO creation
-- ============================================================================

CREATE OR REPLACE FUNCTION record_wo_initial_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record initial status on creation
  INSERT INTO wo_status_history (
    wo_id,
    from_status,
    to_status,
    changed_by,
    changed_at
  )
  VALUES (
    NEW.id,
    NULL,
    NEW.status,
    NEW.created_by,
    NOW()
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION record_wo_initial_status IS 'Record initial WO status on creation (Story 03.10)';

-- ============================================================================
-- TRIGGER: tr_wo_initial_status
-- Purpose: Fire after WO creation to record initial status
-- ============================================================================

DROP TRIGGER IF EXISTS tr_wo_initial_status ON work_orders;

CREATE TRIGGER tr_wo_initial_status
  AFTER INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_wo_initial_status();

COMMENT ON TRIGGER tr_wo_initial_status ON work_orders IS 'Record initial status on WO creation';
