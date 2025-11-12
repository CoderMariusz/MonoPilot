-- Migration: 048_bom_conditional_items.sql
-- Description: Add conditional items support for order-specific material selection
-- Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: bom_items
-- Add condition JSONB column for order flags
-- ============================================================================

-- Add condition column (JSON structure for conditional logic)
ALTER TABLE bom_items 
  ADD COLUMN IF NOT EXISTS condition JSONB;

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

/**
 * Validate condition JSON structure
 * Ensures condition has valid fields and types
 */
CREATE OR REPLACE FUNCTION validate_bom_item_condition(p_condition JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- If condition is NULL, it's always valid (unconditional item)
  IF p_condition IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Condition must be an object
  IF jsonb_typeof(p_condition) != 'object' THEN
    RAISE EXCEPTION 'Condition must be a JSON object';
  END IF;

  -- Check for valid keys
  IF NOT (p_condition ?& ARRAY['type', 'rules']) THEN
    RAISE EXCEPTION 'Condition must have "type" and "rules" fields';
  END IF;

  -- Validate type
  IF p_condition->>'type' NOT IN ('AND', 'OR') THEN
    RAISE EXCEPTION 'Condition type must be "AND" or "OR"';
  END IF;

  -- Validate rules is an array
  IF jsonb_typeof(p_condition->'rules') != 'array' THEN
    RAISE EXCEPTION 'Condition rules must be an array';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Validate condition before insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_item_condition()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate condition if present
  IF NEW.condition IS NOT NULL THEN
    IF NOT validate_bom_item_condition(NEW.condition) THEN
      RAISE EXCEPTION 'Invalid condition structure';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_bom_item_condition_trigger ON bom_items;
CREATE TRIGGER validate_bom_item_condition_trigger
  BEFORE INSERT OR UPDATE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_item_condition();

-- ============================================================================
-- INDEXES
-- Add GIN index for efficient JSONB queries
-- ============================================================================

-- GIN index for condition queries
CREATE INDEX IF NOT EXISTS idx_bom_items_condition 
  ON bom_items USING GIN (condition jsonb_path_ops)
  WHERE condition IS NOT NULL;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN bom_items.condition IS 
'Optional JSONB condition for order-specific material selection. 
Example: {"type": "OR", "rules": [{"field": "order_flags", "operator": "contains", "value": "organic"}]}
NULL = unconditional (always required)';

COMMENT ON FUNCTION validate_bom_item_condition IS 
'Validates condition JSON structure. Condition must have type (AND/OR) and rules array.';

COMMENT ON FUNCTION check_bom_item_condition IS 
'Trigger function to validate condition structure before insert/update on bom_items.';

-- ============================================================================
-- EXAMPLE CONDITIONS
-- ============================================================================

/*
Example 1: Organic ingredients (single rule)
{
  "type": "OR",
  "rules": [
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "organic"
    }
  ]
}

Example 2: Gluten-free AND vegan (multiple rules with AND)
{
  "type": "AND",
  "rules": [
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "gluten_free"
    },
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "vegan"
    }
  ]
}

Example 3: Premium OR export orders
{
  "type": "OR",
  "rules": [
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "premium"
    },
    {
      "field": "order_type",
      "operator": "equals",
      "value": "export"
    }
  ]
}

Example 4: Customer-specific packaging
{
  "type": "AND",
  "rules": [
    {
      "field": "customer_id",
      "operator": "equals",
      "value": 123
    },
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "custom_packaging"
    }
  ]
}
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

