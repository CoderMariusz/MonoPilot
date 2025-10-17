-- Phase 15: WO Operations Enhancement Migration
-- This migration enhances WO operations table with detailed weight and loss tracking

-- Add planned weight tracking
ALTER TABLE wo_operations 
ADD COLUMN planned_input_weight NUMERIC(10,4) NULL,
ADD COLUMN planned_output_weight NUMERIC(10,4) NULL;

-- Add actual weight tracking
ALTER TABLE wo_operations 
ADD COLUMN actual_input_weight NUMERIC(10,4) NULL,
ADD COLUMN actual_output_weight NUMERIC(10,4) NULL;

-- Add loss tracking
ALTER TABLE wo_operations 
ADD COLUMN cooking_loss_weight NUMERIC(10,4) NULL,
ADD COLUMN trim_loss_weight NUMERIC(10,4) NULL,
ADD COLUMN marinade_gain_weight NUMERIC(10,4) NULL;

-- Add scrap breakdown
ALTER TABLE wo_operations 
ADD COLUMN scrap_breakdown JSONB NULL;

-- Add indexes for performance
CREATE INDEX idx_wo_operations_weights ON wo_operations(actual_input_weight, actual_output_weight);
CREATE INDEX idx_wo_operations_losses ON wo_operations(cooking_loss_weight, trim_loss_weight);

-- Add comments for documentation
COMMENT ON COLUMN wo_operations.planned_input_weight IS 'Planned input weight for operation';
COMMENT ON COLUMN wo_operations.planned_output_weight IS 'Planned output weight for operation';
COMMENT ON COLUMN wo_operations.actual_input_weight IS 'Actual input weight for operation';
COMMENT ON COLUMN wo_operations.actual_output_weight IS 'Actual output weight for operation';
COMMENT ON COLUMN wo_operations.cooking_loss_weight IS 'Cooking weight loss';
COMMENT ON COLUMN wo_operations.trim_loss_weight IS 'Trim weight loss';
COMMENT ON COLUMN wo_operations.marinade_gain_weight IS 'Marinade weight gain';
COMMENT ON COLUMN wo_operations.scrap_breakdown IS 'Detailed scrap categorization';

-- Add check constraints for weight values
ALTER TABLE wo_operations 
ADD CONSTRAINT check_weights_positive 
CHECK (
    (planned_input_weight IS NULL OR planned_input_weight >= 0) AND
    (planned_output_weight IS NULL OR planned_output_weight >= 0) AND
    (actual_input_weight IS NULL OR actual_input_weight >= 0) AND
    (actual_output_weight IS NULL OR actual_output_weight >= 0)
);

-- Add check constraints for loss values
ALTER TABLE wo_operations 
ADD CONSTRAINT check_losses_positive 
CHECK (
    (cooking_loss_weight IS NULL OR cooking_loss_weight >= 0) AND
    (trim_loss_weight IS NULL OR trim_loss_weight >= 0) AND
    (marinade_gain_weight IS NULL OR marinade_gain_weight >= 0)
);

-- Add check constraint for scrap breakdown JSONB structure
ALTER TABLE wo_operations 
ADD CONSTRAINT check_scrap_breakdown_structure 
CHECK (
    scrap_breakdown IS NULL OR 
    jsonb_typeof(scrap_breakdown) = 'array'
);
