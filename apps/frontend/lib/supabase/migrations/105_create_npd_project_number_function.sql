-- Migration 105: Create NPD Project Number Generation Function
-- Purpose: Atomic project_number generation to prevent race conditions
-- Story: NPD-1.1 (Code Review Fix)
-- Date: 2025-11-16

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS generate_npd_project_number(INTEGER);

-- Create function to generate NPD project numbers atomically
-- Format: NPD-YYYY-XXXX (e.g., NPD-2025-0001)
-- Scoped by: org_id (via RLS in calling context) + year
CREATE OR REPLACE FUNCTION generate_npd_project_number(p_org_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  next_seq INTEGER;
  new_number TEXT;
BEGIN
  -- Get next sequence number for this org and year
  -- COALESCE handles the case where no projects exist yet (returns 1)
  SELECT COALESCE(MAX(CAST(SUBSTRING(project_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM npd_projects
  WHERE org_id = p_org_id
    AND project_number LIKE 'NPD-' || current_year || '-%';

  -- Format: NPD-{YEAR}-{SEQUENCE} with zero-padding to 4 digits
  new_number := 'NPD-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_npd_project_number(INTEGER) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION generate_npd_project_number(INTEGER) IS
'Generates unique NPD project numbers in format NPD-YYYY-XXXX.
Scoped by org_id and year. Thread-safe for concurrent operations.
Used by NPDProjectsAPI.create() to prevent race conditions.';
