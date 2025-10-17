-- Phase 16: LP Numbering Trigger Migration
-- This migration implements automated LP numbering with parent-child relationship support

-- Create sequence for LP numbering
CREATE SEQUENCE lp_seq START 1 INCREMENT 1;

-- Create function to generate LP number
CREATE OR REPLACE FUNCTION gen_lp_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_num TEXT;
    parent_lp_num TEXT;
    new_lp_number TEXT;
BEGIN
    -- Only generate if lp_number is not provided
    IF NEW.lp_number IS NULL OR NEW.lp_number = '' THEN
        -- Get next sequence number
        seq_num := LPAD(nextval('lp_seq')::TEXT, 8, '0');
        
        -- Check if parent_lp_number is present
        IF NEW.parent_lp_number IS NOT NULL AND NEW.parent_lp_number != '' THEN
            -- Use parent_lp_number-<SEQ8> format
            new_lp_number := NEW.parent_lp_number || '-' || seq_num;
        ELSE
            -- Check if parent_lp_id is present
            IF NEW.parent_lp_id IS NOT NULL THEN
                -- Get parent LP number
                SELECT lp_number INTO parent_lp_num 
                FROM license_plates 
                WHERE id = NEW.parent_lp_id;
                
                IF parent_lp_num IS NOT NULL THEN
                    -- Use <parent.lp_number>-<SEQ8> format
                    new_lp_number := parent_lp_num || '-' || seq_num;
                ELSE
                    -- Fallback to <SEQ8> format
                    new_lp_number := seq_num;
                END IF;
            ELSE
                -- Use <SEQ8> format
                new_lp_number := seq_num;
            END IF;
        END IF;
        
        -- Set the generated LP number
        NEW.lp_number := new_lp_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for LP number generation
CREATE TRIGGER trigger_gen_lp_number
    BEFORE INSERT ON license_plates
    FOR EACH ROW
    EXECUTE FUNCTION gen_lp_number();

-- Add check constraint for LP number format
ALTER TABLE license_plates 
ADD CONSTRAINT check_lp_number_format 
CHECK (lp_number ~ '^[A-Z0-9-]+$');

-- Add comments for documentation
COMMENT ON SEQUENCE lp_seq IS 'Sequence for generating unique LP numbers';
COMMENT ON FUNCTION gen_lp_number() IS 'Trigger function to generate LP numbers with parent-child support';

-- Add example usage comments
COMMENT ON CONSTRAINT check_lp_number_format ON license_plates IS 'LP number must contain only uppercase letters, numbers, and hyphens';
