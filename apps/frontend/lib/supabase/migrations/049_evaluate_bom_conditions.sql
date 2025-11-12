-- Migration: 049_evaluate_bom_conditions.sql
-- Description: RPC function to evaluate conditional BOM items based on WO flags
-- Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
-- Created: 2025-01-12

-- ============================================================================
-- FUNCTION: evaluate_condition_rule
-- Purpose: Evaluate a single condition rule against WO context
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluate_condition_rule(
  p_rule JSONB,
  p_context JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_field TEXT;
  v_operator TEXT;
  v_value TEXT;
  v_context_value JSONB;
BEGIN
  -- Extract rule components
  v_field := p_rule->>'field';
  v_operator := p_rule->>'operator';
  v_value := p_rule->>'value';

  -- Get context value for the field
  v_context_value := p_context->v_field;

  -- Evaluate based on operator
  CASE v_operator
    WHEN 'equals' THEN
      RETURN (v_context_value::TEXT = v_value);
    
    WHEN 'not_equals' THEN
      RETURN (v_context_value::TEXT != v_value);
    
    WHEN 'contains' THEN
      -- For arrays (e.g., order_flags)
      IF jsonb_typeof(v_context_value) = 'array' THEN
        RETURN (v_context_value @> to_jsonb(v_value));
      ELSE
        -- For strings
        RETURN (v_context_value::TEXT LIKE '%' || v_value || '%');
      END IF;
    
    WHEN 'not_contains' THEN
      -- For arrays
      IF jsonb_typeof(v_context_value) = 'array' THEN
        RETURN NOT (v_context_value @> to_jsonb(v_value));
      ELSE
        -- For strings
        RETURN NOT (v_context_value::TEXT LIKE '%' || v_value || '%');
      END IF;
    
    WHEN 'greater_than' THEN
      RETURN ((v_context_value::TEXT)::NUMERIC > v_value::NUMERIC);
    
    WHEN 'less_than' THEN
      RETURN ((v_context_value::TEXT)::NUMERIC < v_value::NUMERIC);
    
    WHEN 'in' THEN
      -- Value is a JSON array
      RETURN (to_jsonb(v_context_value::TEXT) <@ (p_rule->'value'));
    
    ELSE
      RAISE EXCEPTION 'Unknown operator: %', v_operator;
  END CASE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- If evaluation fails, return FALSE (rule not met)
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: evaluate_bom_item_condition
-- Purpose: Evaluate full condition (with AND/OR logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluate_bom_item_condition(
  p_condition JSONB,
  p_context JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_type TEXT;
  v_rules JSONB;
  v_rule JSONB;
  v_result BOOLEAN;
  v_rule_result BOOLEAN;
BEGIN
  -- If condition is NULL, item is unconditional (always required)
  IF p_condition IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Extract condition type and rules
  v_type := p_condition->>'type';
  v_rules := p_condition->'rules';

  -- Initialize result based on type
  IF v_type = 'AND' THEN
    v_result := TRUE;
  ELSIF v_type = 'OR' THEN
    v_result := FALSE;
  ELSE
    RAISE EXCEPTION 'Invalid condition type: %', v_type;
  END IF;

  -- Evaluate each rule
  FOR v_rule IN SELECT * FROM jsonb_array_elements(v_rules)
  LOOP
    v_rule_result := evaluate_condition_rule(v_rule, p_context);

    -- Apply AND/OR logic
    IF v_type = 'AND' THEN
      v_result := v_result AND v_rule_result;
      -- Short-circuit: if any rule is false, result is false
      IF NOT v_result THEN
        RETURN FALSE;
      END IF;
    ELSIF v_type = 'OR' THEN
      v_result := v_result OR v_rule_result;
      -- Short-circuit: if any rule is true, result is true
      IF v_result THEN
        RETURN TRUE;
      END IF;
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: evaluate_bom_materials
-- Purpose: Get filtered BOM items for a WO based on order flags
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluate_bom_materials(
  p_bom_id INTEGER,
  p_wo_context JSONB
)
RETURNS TABLE (
  bom_item_id INTEGER,
  material_id INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  sequence INTEGER,
  is_conditional BOOLEAN,
  condition_met BOOLEAN,
  condition JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id AS bom_item_id,
    bi.material_id,
    bi.quantity,
    bi.uom,
    bi.sequence,
    (bi.condition IS NOT NULL) AS is_conditional,
    evaluate_bom_item_condition(bi.condition, p_wo_context) AS condition_met,
    bi.condition
  FROM bom_items bi
  WHERE bi.bom_id = p_bom_id
    AND bi.is_by_product = FALSE  -- Only materials, not by-products
    -- Include item if:
    -- 1. It's unconditional (condition IS NULL), OR
    -- 2. It's conditional AND condition is met
    AND (
      bi.condition IS NULL 
      OR 
      evaluate_bom_item_condition(bi.condition, p_wo_context)
    )
  ORDER BY bi.sequence ASC, bi.id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_all_bom_materials_with_evaluation
-- Purpose: Get ALL BOM items with condition evaluation (for UI display)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_bom_materials_with_evaluation(
  p_bom_id INTEGER,
  p_wo_context JSONB
)
RETURNS TABLE (
  bom_item_id INTEGER,
  material_id INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  sequence INTEGER,
  is_conditional BOOLEAN,
  condition_met BOOLEAN,
  condition JSONB,
  is_by_product BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id AS bom_item_id,
    bi.material_id,
    bi.quantity,
    bi.uom,
    bi.sequence,
    (bi.condition IS NOT NULL) AS is_conditional,
    evaluate_bom_item_condition(bi.condition, p_wo_context) AS condition_met,
    bi.condition,
    bi.is_by_product
  FROM bom_items bi
  WHERE bi.bom_id = p_bom_id
  ORDER BY 
    bi.is_by_product ASC,  -- Materials first, then by-products
    bi.sequence ASC, 
    bi.id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON FUNCTION evaluate_condition_rule IS 
'Evaluates a single condition rule against WO context. 
Supports operators: equals, not_equals, contains, not_contains, greater_than, less_than, in.
Example rule: {"field": "order_flags", "operator": "contains", "value": "organic"}';

COMMENT ON FUNCTION evaluate_bom_item_condition IS 
'Evaluates full condition with AND/OR logic. 
Returns TRUE if condition is met or NULL (unconditional).
Example: {"type": "OR", "rules": [{"field": "order_flags", "operator": "contains", "value": "organic"}]}';

COMMENT ON FUNCTION evaluate_bom_materials IS 
'Returns filtered BOM materials for a Work Order based on order flags.
Only returns materials where condition is NULL (unconditional) or condition evaluates to TRUE.
Example context: {"order_flags": ["organic", "gluten_free"], "customer_id": 123}';

COMMENT ON FUNCTION get_all_bom_materials_with_evaluation IS 
'Returns ALL BOM items (materials + by-products) with condition evaluation results.
Used for UI to show which items will be included vs excluded based on WO context.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
Example 1: Simple organic flag
SELECT * FROM evaluate_bom_materials(
  123,  -- BOM ID
  '{"order_flags": ["organic"]}'::JSONB
);

Example 2: Multiple flags (gluten-free AND vegan)
SELECT * FROM evaluate_bom_materials(
  123,
  '{"order_flags": ["gluten_free", "vegan"]}'::JSONB
);

Example 3: Customer-specific packaging
SELECT * FROM evaluate_bom_materials(
  123,
  '{"customer_id": 456, "order_flags": ["custom_packaging"]}'::JSONB
);

Example 4: Get all items with evaluation (for UI)
SELECT * FROM get_all_bom_materials_with_evaluation(
  123,
  '{"order_flags": ["organic"]}'::JSONB
);

-- This returns:
-- bom_item_id | material_id | quantity | condition_met | is_conditional
-- 1           | 100         | 10.0     | TRUE          | FALSE  (unconditional)
-- 2           | 101         | 5.0      | TRUE          | TRUE   (organic condition met)
-- 3           | 102         | 3.0      | FALSE         | TRUE   (non-organic, excluded)
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

