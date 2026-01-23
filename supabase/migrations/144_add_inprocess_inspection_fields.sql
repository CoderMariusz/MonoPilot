-- =============================================================================
-- Migration 144: Add In-Process Inspection Support (Story 06.10)
-- Purpose: Extend quality_inspections for WO operation integration
-- Critical for: In-process quality control during production
-- =============================================================================

BEGIN;

-- =============================================================================
-- Add WO and Operation columns to quality_inspections
-- =============================================================================

ALTER TABLE quality_inspections
ADD COLUMN IF NOT EXISTS wo_id UUID REFERENCES work_orders(id),
ADD COLUMN IF NOT EXISTS wo_operation_id UUID REFERENCES wo_operations(id);

COMMENT ON COLUMN quality_inspections.wo_id IS 'Reference to work order for in-process inspections';
COMMENT ON COLUMN quality_inspections.wo_operation_id IS 'Reference to specific WO operation for in-process inspections';

-- =============================================================================
-- Add routing_operation_id to wo_operations for tracking source
-- =============================================================================

ALTER TABLE wo_operations
ADD COLUMN IF NOT EXISTS routing_operation_id UUID REFERENCES routing_operations(id);

COMMENT ON COLUMN wo_operations.routing_operation_id IS 'Reference to source routing operation';

-- =============================================================================
-- Add QA-related columns to wo_operations
-- =============================================================================

ALTER TABLE wo_operations
ADD COLUMN IF NOT EXISTS qa_status TEXT DEFAULT 'pending'
    CHECK (qa_status IN ('pending', 'passed', 'failed', 'conditional', 'not_required')),
ADD COLUMN IF NOT EXISTS qa_inspection_id UUID REFERENCES quality_inspections(id);

COMMENT ON COLUMN wo_operations.qa_status IS 'QA inspection status: pending, passed, failed, conditional, not_required';
COMMENT ON COLUMN wo_operations.qa_inspection_id IS 'Reference to related quality inspection';

-- =============================================================================
-- Add QA-related columns to routing_operations
-- =============================================================================

ALTER TABLE routing_operations
ADD COLUMN IF NOT EXISTS requires_quality_check BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN routing_operations.requires_quality_check IS 'Whether this operation requires QA inspection';
COMMENT ON COLUMN routing_operations.is_critical IS 'Whether this is a critical operation (affects priority)';
COMMENT ON COLUMN routing_operations.description IS 'Description of the operation';

-- =============================================================================
-- Add auto-create settings to quality_settings
-- =============================================================================

ALTER TABLE quality_settings
ADD COLUMN IF NOT EXISTS auto_create_inspection_on_operation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_operation_qa_pass BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_next_operation_on_fail BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inspection_sla_hours INTEGER DEFAULT 2;

COMMENT ON COLUMN quality_settings.auto_create_inspection_on_operation IS 'Auto-create inspection when WO operation completes';
COMMENT ON COLUMN quality_settings.require_operation_qa_pass IS 'Require QA pass before next operation can start';
COMMENT ON COLUMN quality_settings.block_next_operation_on_fail IS 'Block next operation if QA fails';
COMMENT ON COLUMN quality_settings.inspection_sla_hours IS 'SLA hours for inspection completion';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_inspections_wo ON quality_inspections(wo_id) WHERE wo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_wo_operation ON quality_inspections(wo_operation_id) WHERE wo_operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_wo_type ON quality_inspections(org_id, wo_id, inspection_type)
    WHERE inspection_type = 'in_process';
CREATE INDEX IF NOT EXISTS idx_inspections_wo_pending ON quality_inspections(org_id, wo_id, status)
    WHERE inspection_type = 'in_process' AND status IN ('scheduled', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_wo_operations_qa_status ON wo_operations(qa_status) WHERE qa_status != 'not_required';
CREATE INDEX IF NOT EXISTS idx_wo_operations_routing_op ON wo_operations(routing_operation_id) WHERE routing_operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routing_ops_requires_qa ON routing_operations(requires_quality_check) WHERE requires_quality_check = true;

-- =============================================================================
-- Function: Auto-create in-process inspection on WO operation completion
-- =============================================================================

CREATE OR REPLACE FUNCTION create_inprocess_inspection_on_operation_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_settings RECORD;
    v_wo RECORD;
    v_spec_id UUID;
    v_inspection_number TEXT;
    v_routing_op RECORD;
BEGIN
    -- Only trigger on operation status change to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Get org_id from the work order
        SELECT wo.*, p.id as output_product_id
        INTO v_wo
        FROM work_orders wo
        JOIN products p ON p.id = wo.product_id
        WHERE wo.id = NEW.wo_id;

        -- Check if auto-create is enabled for in-process inspections
        SELECT * INTO v_settings
        FROM quality_settings
        WHERE org_id = v_wo.org_id;

        IF v_settings.auto_create_inspection_on_operation = true THEN

            -- Check if this operation requires inspection (from routing_operations)
            IF NEW.routing_operation_id IS NOT NULL THEN
                SELECT ro.* INTO v_routing_op
                FROM routing_operations ro
                WHERE ro.id = NEW.routing_operation_id
                  AND ro.requires_quality_check = true;
            END IF;

            IF v_routing_op.id IS NOT NULL THEN

                -- Get active specification for product (if exists)
                SELECT id INTO v_spec_id
                FROM quality_specifications
                WHERE org_id = v_wo.org_id
                  AND product_id = v_wo.output_product_id
                  AND status = 'active'
                ORDER BY effective_date DESC
                LIMIT 1;

                -- Generate inspection number
                v_inspection_number := generate_inspection_number(v_wo.org_id, 'in_process');

                -- Create inspection record
                INSERT INTO quality_inspections (
                    org_id,
                    inspection_number,
                    inspection_type,
                    reference_type,
                    reference_id,
                    product_id,
                    spec_id,
                    wo_id,
                    wo_operation_id,
                    batch_number,
                    status,
                    scheduled_date,
                    priority,
                    created_by
                ) VALUES (
                    v_wo.org_id,
                    v_inspection_number,
                    'in_process',
                    'wo_operation',
                    NEW.id,
                    v_wo.output_product_id,
                    v_spec_id,
                    NEW.wo_id,
                    NEW.id,
                    v_wo.batch_number,
                    'scheduled',
                    CURRENT_DATE,
                    CASE
                        WHEN v_routing_op.is_critical THEN 'high'
                        ELSE 'normal'
                    END,
                    NEW.completed_by
                );

            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on wo_operations table
DROP TRIGGER IF EXISTS trigger_create_inprocess_inspection ON wo_operations;
CREATE TRIGGER trigger_create_inprocess_inspection
    AFTER UPDATE ON wo_operations
    FOR EACH ROW
    EXECUTE FUNCTION create_inprocess_inspection_on_operation_complete();

-- =============================================================================
-- Function: Update WO operation QA status on inspection completion
-- =============================================================================

CREATE OR REPLACE FUNCTION update_wo_operation_qa_on_inspection()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on inspection completion for in_process type
    IF NEW.status = 'completed'
       AND NEW.inspection_type = 'in_process'
       AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Update WO operation QA status if operation reference exists
        IF NEW.wo_operation_id IS NOT NULL THEN
            UPDATE wo_operations
            SET qa_status = CASE NEW.result
                WHEN 'pass' THEN 'passed'
                WHEN 'fail' THEN 'failed'
                WHEN 'conditional' THEN 'conditional'
                ELSE 'pending'
            END,
            qa_inspection_id = NEW.id,
            updated_at = NOW()
            WHERE id = NEW.wo_operation_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_wo_operation_qa ON quality_inspections;
CREATE TRIGGER trigger_update_wo_operation_qa
    AFTER UPDATE ON quality_inspections
    FOR EACH ROW
    WHEN (NEW.inspection_type = 'in_process')
    EXECUTE FUNCTION update_wo_operation_qa_on_inspection();

-- =============================================================================
-- Update copy_routing_to_wo to include routing_operation_id
-- =============================================================================

CREATE OR REPLACE FUNCTION copy_routing_to_wo(
  p_wo_id UUID,
  p_org_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_routing_id UUID;
  v_wo_copy_routing BOOLEAN;
  v_operation_count INTEGER := 0;
BEGIN
  -- Get WO routing_id
  SELECT routing_id INTO v_routing_id
  FROM work_orders
  WHERE id = p_wo_id AND org_id = p_org_id;

  -- Check if WO exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  -- Check setting (default to TRUE if not set)
  SELECT COALESCE(wo_copy_routing, TRUE) INTO v_wo_copy_routing
  FROM planning_settings
  WHERE org_id = p_org_id;

  -- Default to TRUE if no settings row exists
  IF v_wo_copy_routing IS NULL THEN
    v_wo_copy_routing := TRUE;
  END IF;

  -- Exit if setting disabled or no routing
  IF v_wo_copy_routing = FALSE OR v_routing_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Check if operations already exist (idempotency)
  SELECT COUNT(*) INTO v_operation_count
  FROM wo_operations
  WHERE wo_id = p_wo_id;

  IF v_operation_count > 0 THEN
    -- Operations already copied, return existing count
    RETURN v_operation_count;
  END IF;

  -- Copy routing operations to wo_operations (now including routing_operation_id and QA fields)
  INSERT INTO wo_operations (
    wo_id,
    organization_id,
    routing_operation_id,
    sequence,
    operation_name,
    description,
    instructions,
    machine_id,
    line_id,
    expected_duration_minutes,
    expected_yield_percent,
    status,
    qa_status
  )
  SELECT
    p_wo_id,
    p_org_id,
    ro.id,
    ro.sequence,
    ro.operation_name,
    ro.description,
    ro.instructions,
    ro.machine_id,
    ro.line_id,
    COALESCE(ro.expected_duration_minutes, 0) + COALESCE(ro.setup_time_minutes, 0) + COALESCE(ro.cleanup_time_minutes, 0),
    ro.expected_yield_percent,
    'pending',
    CASE WHEN ro.requires_quality_check = true THEN 'pending' ELSE 'not_required' END
  FROM routing_operations ro
  WHERE ro.routing_id = v_routing_id
  ORDER BY ro.sequence;

  GET DIAGNOSTICS v_operation_count = ROW_COUNT;

  RETURN v_operation_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant Permissions
-- =============================================================================

-- Permissions already granted in base migration

COMMIT;
