-- Migration 052: Fix generate_to_number LPAD parameter types
-- Purpose: ensure LPAD receives text input to avoid type mismatch errors

CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TEXT AS $$
DECLARE
  next_seq INTEGER;
  year_part TEXT;
  next_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 'TO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_seq
  FROM to_header
  WHERE number LIKE 'TO-' || year_part || '-%';

  next_number := 'TO-' || year_part || '-' || LPAD(next_seq::TEXT, 3, '0');
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_to_number IS 'Generate sequential transfer order number in format TO-YYYY-### with proper text padding.';

