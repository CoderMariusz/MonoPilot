-- Phase 24: License Plates Stage Suffix Enhancement
-- This migration updates stage suffix format to support 2-letter codes as per scanner spec

-- Drop existing constraint
ALTER TABLE license_plates 
DROP CONSTRAINT IF EXISTS check_stage_suffix_format;

-- Add new constraint for 2-letter stage suffix format
ALTER TABLE license_plates 
ADD CONSTRAINT check_stage_suffix_format 
CHECK (stage_suffix IS NULL OR stage_suffix ~ '^-[A-Z]{2}$');

-- Update comment to reflect 2-letter format
COMMENT ON COLUMN license_plates.stage_suffix IS 'Operation stage suffix (-RS, -SM, -DC, etc.) - 2-letter codes';

-- Add common stage suffix values as check constraint options
ALTER TABLE license_plates 
ADD CONSTRAINT check_stage_suffix_values 
CHECK (stage_suffix IS NULL OR stage_suffix IN (
    '-RS',  -- Roast
    '-SM',  -- Smoke  
    '-DC',  -- Dice
    '-GR',  -- Grind
    '-MX',  -- Mix
    '-PK',  -- Pack
    '-LB',  -- Label
    '-QC',  -- Quality Check
    '-ST',  -- Store
    '-SH'   -- Ship
));

-- Add comment for stage suffix values
COMMENT ON CONSTRAINT check_stage_suffix_values ON license_plates IS 'Valid 2-letter stage suffix codes for operations';
