-- Migration 061: Atomic LP Number Generation
-- Purpose: Fix Story 1.7.1 AC-4 Gap 1 - LP counter race condition
-- Date: 2025-11-16
-- Dependencies: license_plates table
-- Reference: Story 1-7-1 AC-4 Gap 1

-- =============================================
-- 1. CREATE SEQUENCE FOR LP COUNTER
-- =============================================
-- Sequence tracks daily LP counter (resets at midnight via trigger)

CREATE SEQUENCE IF NOT EXISTS lp_daily_sequence
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE lp_daily_sequence IS 'Daily counter for License Plate number generation (LP-YYYYMMDD-NNN)';

-- =============================================
-- 2. CREATE TABLE TO TRACK LAST RESET DATE
-- =============================================
-- Stores the last date when sequence was reset (for midnight reset logic)

CREATE TABLE IF NOT EXISTS lp_sequence_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Enforce single row
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_sequence_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row
INSERT INTO lp_sequence_state (id, last_reset_date, last_sequence_number)
VALUES (1, CURRENT_DATE, 0)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE lp_sequence_state IS 'Tracks LP sequence reset state for daily counter reset';

-- =============================================
-- 3. FUNCTION: GENERATE LP NUMBER (ATOMIC)
-- =============================================
-- Generates LP number in format: LP-YYYYMMDD-NNN
-- Thread-safe: Uses PostgreSQL sequence for atomicity
-- Auto-resets counter at midnight

CREATE OR REPLACE FUNCTION generate_lp_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_date DATE;
  v_last_reset_date DATE;
  v_sequence_number INTEGER;
  v_lp_number TEXT;
BEGIN
  -- Get current date
  v_current_date := CURRENT_DATE;

  -- Get last reset date from state table
  SELECT last_reset_date INTO v_last_reset_date
  FROM lp_sequence_state
  WHERE id = 1
  FOR UPDATE; -- Lock row to prevent race condition

  -- Check if we need to reset the sequence (new day)
  IF v_current_date > v_last_reset_date THEN
    -- Reset sequence to 1
    PERFORM setval('lp_daily_sequence', 1, false); -- false = next nextval() returns 1

    -- Update state table
    UPDATE lp_sequence_state
    SET last_reset_date = v_current_date,
        last_sequence_number = 0,
        updated_at = NOW()
    WHERE id = 1;

    v_sequence_number := 1;
  ELSE
    -- Get next sequence number (atomic increment)
    v_sequence_number := nextval('lp_daily_sequence');

    -- Update state table
    UPDATE lp_sequence_state
    SET last_sequence_number = v_sequence_number,
        updated_at = NOW()
    WHERE id = 1;
  END IF;

  -- Generate LP number: LP-YYYYMMDD-NNN
  v_lp_number := 'LP-' ||
                 to_char(v_current_date, 'YYYYMMDD') || '-' ||
                 lpad(v_sequence_number::text, 3, '0');

  RETURN v_lp_number;
END;
$$;

COMMENT ON FUNCTION generate_lp_number IS 'Generates atomic LP number with daily counter reset (LP-YYYYMMDD-NNN)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_lp_number TO authenticated;

-- =============================================
-- 4. FUNCTION: VALIDATE LP NUMBER UNIQUENESS
-- =============================================
-- Validates that LP number doesn't already exist in database
-- Used for Gap 5: LP uniqueness validation

CREATE OR REPLACE FUNCTION validate_lp_uniqueness(p_lp_number TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if LP number already exists
  SELECT EXISTS(
    SELECT 1 FROM license_plates WHERE lp_number = p_lp_number
  ) INTO v_exists;

  -- Return true if unique (not exists), false if duplicate
  RETURN NOT v_exists;
END;
$$;

COMMENT ON FUNCTION validate_lp_uniqueness IS 'Validates LP number uniqueness before insert (returns true if unique)';

GRANT EXECUTE ON FUNCTION validate_lp_uniqueness TO authenticated;

-- =============================================
-- 5. FUNCTION: GET CURRENT LP SEQUENCE INFO
-- =============================================
-- Returns current sequence state (for debugging/monitoring)

CREATE OR REPLACE FUNCTION get_lp_sequence_info()
RETURNS TABLE (
  current_date DATE,
  last_reset_date DATE,
  last_sequence_number INTEGER,
  next_lp_number TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_info RECORD;
  v_next_seq INTEGER;
BEGIN
  -- Get current state
  SELECT * INTO v_info
  FROM lp_sequence_state
  WHERE id = 1;

  -- Peek at next sequence number without incrementing
  v_next_seq := currval('lp_daily_sequence') + 1;

  -- If new day, next sequence is 1
  IF CURRENT_DATE > v_info.last_reset_date THEN
    v_next_seq := 1;
  END IF;

  -- Return info
  RETURN QUERY
  SELECT
    CURRENT_DATE,
    v_info.last_reset_date,
    v_info.last_sequence_number,
    'LP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(v_next_seq::text, 3, '0');
END;
$$;

COMMENT ON FUNCTION get_lp_sequence_info IS 'Returns current LP sequence state for monitoring';

GRANT EXECUTE ON FUNCTION get_lp_sequence_info TO authenticated;

-- =============================================
-- 6. EXAMPLE USAGE
-- =============================================
-- Generate LP number:
--   SELECT generate_lp_number(); → 'LP-20251116-001'
--   SELECT generate_lp_number(); → 'LP-20251116-002'
--   SELECT generate_lp_number(); → 'LP-20251116-003'
--
-- Validate uniqueness:
--   SELECT validate_lp_uniqueness('LP-20251116-001'); → false (exists)
--   SELECT validate_lp_uniqueness('LP-20251116-999'); → true (unique)
--
-- Get sequence info:
--   SELECT * FROM get_lp_sequence_info();

-- =============================================
-- ROLLBACK (if needed)
-- =============================================
-- DROP FUNCTION IF EXISTS get_lp_sequence_info();
-- DROP FUNCTION IF EXISTS validate_lp_uniqueness(TEXT);
-- DROP FUNCTION IF EXISTS generate_lp_number();
-- DROP TABLE IF EXISTS lp_sequence_state;
-- DROP SEQUENCE IF EXISTS lp_daily_sequence;
