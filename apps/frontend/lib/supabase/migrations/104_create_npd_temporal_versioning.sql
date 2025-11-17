-- =============================================
-- Migration 104: NPD Temporal Versioning Constraints & Triggers
-- =============================================
-- Epic: NPD-6 (Database Schema & Infrastructure)
-- Story: NPD-6.5 - Create Temporal Versioning Constraints & Triggers
-- Purpose: EXCLUDE constraints for date overlap prevention + immutability triggers
-- Date: 2025-11-16
-- Dependencies: Migration 100 (npd_formulations table)
-- Pattern: NOVEL for MonoPilot - first use of EXCLUDE constraints + GENERATED columns
-- Compliance: FDA 21 CFR Part 11 (electronic records immutability)
-- =============================================

-- =============================================
-- SECTION 1: ENABLE REQUIRED EXTENSIONS
-- =============================================
-- btree_gist required for EXCLUDE constraints mixing equality (npd_project_id) and range (tstzrange)

CREATE EXTENSION IF NOT EXISTS btree_gist;

COMMENT ON EXTENSION btree_gist IS 'Required for EXCLUDE constraints using GiST index with btree operators (equality + range overlap)';

-- =============================================
-- SECTION 2: ADD COMPUTED COLUMN (is_current_version)
-- =============================================
-- Auto-calculated: TRUE if effective_to IS NULL AND status = 'approved'

ALTER TABLE npd_formulations
  ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN GENERATED ALWAYS AS (
    effective_to IS NULL AND status = 'approved'
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_npd_formulations_current
  ON npd_formulations(npd_project_id)
  WHERE is_current_version = TRUE;

COMMENT ON COLUMN npd_formulations.is_current_version IS 'Auto-calculated: TRUE if effective_to IS NULL AND status = approved. Indicates the active formulation version for a project. Partial index optimizes current version queries.';

-- =============================================
-- SECTION 3: EXCLUDE CONSTRAINT (PREVENT OVERLAPPING DATES)
-- =============================================
-- Prevents two formulations for same project with overlapping effective date ranges
-- Example: v1.0 (2025-01-01 to 2025-06-30) + v1.1 (2025-06-01 to NULL) → VIOLATION
-- Note: '[)' = inclusive start, exclusive end (half-open interval)
-- Note: WHERE clause excludes superseded versions from overlap check
-- Implementation detail:
--   We use daterange(effective_from, effective_to, '[)') instead of tstzrange(...)
--   because daterange with DATE columns is immutable and valid in index expressions.

ALTER TABLE npd_formulations
  ADD CONSTRAINT npd_formulations_no_overlap
  EXCLUDE USING gist (
    npd_project_id WITH =,
    daterange(effective_from, effective_to, '[)') WITH &&
  )
  WHERE (status != 'superseded');

COMMENT ON CONSTRAINT npd_formulations_no_overlap ON npd_formulations IS 'EXCLUDE constraint prevents overlapping effective date ranges for same NPD project. Uses GiST index with daterange. Superseded versions excluded from check. Enforces FR12 (Prevent overlapping versions).';

-- =============================================
-- SECTION 4: IMMUTABILITY TRIGGER (PREVENT LOCKED EDITS)
-- =============================================
-- Once formulation is locked (locked_at NOT NULL), it cannot be modified
-- Compliance: FDA 21 CFR Part 11 electronic records immutability

CREATE OR REPLACE FUNCTION prevent_locked_formulation_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- If formulation is locked, prevent any edits
  IF OLD.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify locked formulation. Version: %, Locked at: %, Locked by: %',
      OLD.version,
      OLD.locked_at,
      OLD.locked_by
    USING HINT = 'Create a new formulation version instead of editing locked version',
          ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_locked_formulation_edit() IS 'Trigger function prevents editing locked formulations (locked_at NOT NULL). Raises exception with version, locked_at, locked_by details. Enforces FR13 (Lock on approval for immutability).';

-- Create BEFORE UPDATE trigger
CREATE TRIGGER npd_formulation_immutable_on_lock
  BEFORE UPDATE ON npd_formulations
  FOR EACH ROW
  WHEN (OLD.locked_at IS NOT NULL)
  EXECUTE FUNCTION prevent_locked_formulation_edit();

COMMENT ON TRIGGER npd_formulation_immutable_on_lock ON npd_formulations IS 'BEFORE UPDATE trigger fires when locked_at IS NOT NULL. Calls prevent_locked_formulation_edit() to block modifications. Compliance: FDA 21 CFR Part 11.';

-- =============================================
-- SECTION 5: ADDITIONAL INDEXES FOR TEMPORAL QUERIES
-- =============================================
-- Optimize queries for "get current version" and "get version at specific date"

CREATE INDEX IF NOT EXISTS idx_npd_formulations_effective_range
  ON npd_formulations USING gist (
    npd_project_id,
    daterange(effective_from, effective_to, '[)')
  );

COMMENT ON INDEX idx_npd_formulations_effective_range IS 'GiST index for temporal queries: find formulation version effective at specific date. Supports queries like: WHERE daterange(effective_from, effective_to, ''[)'') @> date.';

-- =============================================
-- END OF MIGRATION 104
-- =============================================
-- Summary:
--   Extension enabled: 1 (btree_gist)
--   Columns added: 1 (is_current_version GENERATED ALWAYS AS)
--   EXCLUDE constraints: 1 (npd_formulations_no_overlap)
--   Trigger functions: 1 (prevent_locked_formulation_edit)
--   Triggers: 1 (npd_formulation_immutable_on_lock)
--   Indexes: 2 (idx_npd_formulations_current, idx_npd_formulations_effective_range)
-- Design:
--   EXCLUDE constraint = database-level enforcement (not just app validation)
--   tstzrange '[)' = inclusive start, exclusive end (standard temporal pattern)
--   Immutability trigger = compliance (FDA 21 CFR Part 11 electronic records)
--   GENERATED column = eliminates app logic for "current version" calculation
-- Enables:
--   FR12: Prevent overlapping formulation versions (database enforced)
--   FR13: Lock formulation on approval (immutability trigger)
--   Epic NPD-2: Formulation Versioning & Management
-- Testing:
--   Test 1: Create v1 (2025-01-01 to 2025-06-30), v2 (2025-07-01 to NULL) → SUCCESS
--   Test 2: Create v1 (2025-01-01 to 2025-06-30), v2 (2025-06-01 to NULL) → VIOLATION
--   Test 3: Lock v1, attempt UPDATE → EXCEPTION (trigger blocks edit)
--   Test 4: Query current version → uses partial index (WHERE is_current_version = TRUE)
-- Next Story:
--   6.6 - Setup Edge Functions CI/CD (npd_events processing infrastructure)
-- =============================================
