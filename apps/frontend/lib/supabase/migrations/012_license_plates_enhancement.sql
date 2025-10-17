-- Phase 12: License Plates Enhancement Migration
-- This migration enhances license plates with parent-child relationships and origin tracking

-- Add parent-child relationship tracking
ALTER TABLE license_plates 
ADD COLUMN parent_lp_id INTEGER REFERENCES license_plates(id) ON DELETE SET NULL,
ADD COLUMN parent_lp_number TEXT NULL;

-- Add stage suffix for operation tracking
ALTER TABLE license_plates 
ADD COLUMN stage_suffix TEXT NULL;

-- Add origin tracking
ALTER TABLE license_plates 
ADD COLUMN origin_type TEXT NOT NULL DEFAULT 'GRN',
ADD COLUMN origin_ref JSONB NULL;

-- Add unique constraint on lp_number
ALTER TABLE license_plates 
ADD CONSTRAINT unique_lp_number UNIQUE (lp_number);

-- Add indexes for performance
CREATE INDEX idx_license_plates_parent_lp_id ON license_plates(parent_lp_id);
CREATE INDEX idx_license_plates_parent_lp_number ON license_plates(parent_lp_number);
CREATE INDEX idx_license_plates_stage_suffix ON license_plates(stage_suffix);
CREATE INDEX idx_license_plates_origin_type ON license_plates(origin_type);

-- Add comments for documentation
COMMENT ON COLUMN license_plates.parent_lp_id IS 'Parent license plate for internal splits';
COMMENT ON COLUMN license_plates.parent_lp_number IS 'External parent LP number from GRN';
COMMENT ON COLUMN license_plates.stage_suffix IS 'Operation stage suffix (-R, -S, -D, etc.)';
COMMENT ON COLUMN license_plates.origin_type IS 'Origin type (GRN, WO_OUTPUT, SPLIT, etc.)';
COMMENT ON COLUMN license_plates.origin_ref IS 'JSONB reference to origin record';

-- Add check constraint for stage suffix format
ALTER TABLE license_plates 
ADD CONSTRAINT check_stage_suffix_format 
CHECK (stage_suffix IS NULL OR stage_suffix ~ '^-[A-Z]$');

-- Add check constraint for origin type
ALTER TABLE license_plates 
ADD CONSTRAINT check_origin_type 
CHECK (origin_type IN ('GRN', 'WO_OUTPUT', 'SPLIT', 'ADJUST', 'TRANSFER'));
