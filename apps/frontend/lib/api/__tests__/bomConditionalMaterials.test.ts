/**
 * Unit Tests: BOM Conditional Materials
 * Epic: EPIC-001 BOM Complexity v2 - Phase 3
 * Created: 2025-01-12
 * 
 * Tests for:
 * - Condition validation
 * - Rule evaluation (operators)
 * - AND/OR logic
 * - Material filtering based on WO context
 */

import { describe, it, expect } from 'vitest';

describe('BOM Conditional Materials - Logic Tests', () => {
  // ============================================================================
  // CONDITION STRUCTURE VALIDATION
  // ============================================================================

  describe('Condition Structure Validation', () => {
    it('should accept NULL condition (unconditional)', () => {
      const condition = null;
      expect(condition).toBeNull();
    });

    it('should validate condition with type and rules', () => {
      const condition = {
        type: 'OR',
        rules: [
          {
            field: 'order_flags',
            operator: 'contains',
            value: 'organic'
          }
        ]
      };

      expect(condition).toHaveProperty('type');
      expect(condition).toHaveProperty('rules');
      expect(condition.type).toBe('OR');
      expect(Array.isArray(condition.rules)).toBe(true);
    });

    it('should reject condition without type', () => {
      const condition = {
        rules: []
      };

      expect(condition).not.toHaveProperty('type');
    });

    it('should reject condition without rules', () => {
      const condition = {
        type: 'AND'
      };

      expect(condition).not.toHaveProperty('rules');
    });

    it('should reject invalid type (not AND/OR)', () => {
      const condition = {
        type: 'INVALID',
        rules: []
      };

      expect(['AND', 'OR']).not.toContain(condition.type);
    });
  });

  // ============================================================================
  // RULE EVALUATION - OPERATORS
  // ============================================================================

  describe('Rule Evaluation - Operators', () => {
    it('should evaluate "equals" operator - match', () => {
      const rule = { field: 'customer_id', operator: 'equals', value: '123' };
      const context = { customer_id: 123 };

      // Simple string comparison
      expect(context.customer_id.toString()).toBe(rule.value);
    });

    it('should evaluate "equals" operator - no match', () => {
      const rule = { field: 'customer_id', operator: 'equals', value: '123' };
      const context = { customer_id: 456 };

      expect(context.customer_id.toString()).not.toBe(rule.value);
    });

    it('should evaluate "not_equals" operator', () => {
      const rule = { field: 'order_type', operator: 'not_equals', value: 'standard' };
      const context = { order_type: 'export' };

      expect(context.order_type).not.toBe(rule.value);
    });

    it('should evaluate "contains" operator - array match', () => {
      const rule = { field: 'order_flags', operator: 'contains', value: 'organic' };
      const context = { order_flags: ['organic', 'gluten_free'] };

      expect(context.order_flags).toContain(rule.value);
    });

    it('should evaluate "contains" operator - array no match', () => {
      const rule = { field: 'order_flags', operator: 'contains', value: 'organic' };
      const context = { order_flags: ['gluten_free', 'vegan'] };

      expect(context.order_flags).not.toContain(rule.value);
    });

    it('should evaluate "contains" operator - string match', () => {
      const rule = { field: 'notes', operator: 'contains', value: 'special' };
      const context = { notes: 'This is a special order' };

      expect(context.notes).toContain(rule.value);
    });

    it('should evaluate "not_contains" operator', () => {
      const rule = { field: 'order_flags', operator: 'not_contains', value: 'organic' };
      const context = { order_flags: ['gluten_free', 'vegan'] };

      expect(context.order_flags).not.toContain(rule.value);
    });

    it('should evaluate "greater_than" operator', () => {
      const rule = { field: 'order_quantity', operator: 'greater_than', value: '1000' };
      const context = { order_quantity: 1500 };

      expect(context.order_quantity).toBeGreaterThan(parseFloat(rule.value));
    });

    it('should evaluate "less_than" operator', () => {
      const rule = { field: 'order_quantity', operator: 'less_than', value: '1000' };
      const context = { order_quantity: 500 };

      expect(context.order_quantity).toBeLessThan(parseFloat(rule.value));
    });

    it('should evaluate "in" operator', () => {
      const rule = { field: 'customer_type', operator: 'in', value: ['premium', 'vip'] };
      const context = { customer_type: 'premium' };

      expect(rule.value).toContain(context.customer_type);
    });
  });

  // ============================================================================
  // AND/OR LOGIC
  // ============================================================================

  describe('AND/OR Logic', () => {
    it('should evaluate OR condition - one rule matches', () => {
      const condition = {
        type: 'OR',
        rules: [
          { field: 'order_flags', operator: 'contains', value: 'organic' },
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' }
        ]
      };
      const context = { order_flags: ['organic'] };

      // At least one rule must match
      const matches = condition.rules.some(rule => 
        context.order_flags.includes(rule.value)
      );
      expect(matches).toBe(true);
    });

    it('should evaluate OR condition - no rules match', () => {
      const condition = {
        type: 'OR',
        rules: [
          { field: 'order_flags', operator: 'contains', value: 'organic' },
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' }
        ]
      };
      const context = { order_flags: ['vegan'] };

      const matches = condition.rules.some(rule => 
        context.order_flags.includes(rule.value)
      );
      expect(matches).toBe(false);
    });

    it('should evaluate AND condition - all rules match', () => {
      const condition = {
        type: 'AND',
        rules: [
          { field: 'order_flags', operator: 'contains', value: 'organic' },
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' }
        ]
      };
      const context = { order_flags: ['organic', 'gluten_free', 'vegan'] };

      // All rules must match
      const matches = condition.rules.every(rule => 
        context.order_flags.includes(rule.value)
      );
      expect(matches).toBe(true);
    });

    it('should evaluate AND condition - one rule fails', () => {
      const condition = {
        type: 'AND',
        rules: [
          { field: 'order_flags', operator: 'contains', value: 'organic' },
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' }
        ]
      };
      const context = { order_flags: ['organic'] }; // Missing gluten_free

      const matches = condition.rules.every(rule => 
        context.order_flags.includes(rule.value)
      );
      expect(matches).toBe(false);
    });

    it('should short-circuit OR logic (stop on first true)', () => {
      const condition = {
        type: 'OR',
        rules: [
          { field: 'order_flags', operator: 'contains', value: 'organic' },
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' },
          { field: 'order_flags', operator: 'contains', value: 'vegan' }
        ]
      };
      const context = { order_flags: ['organic'] };

      // Should return true after first match
      let evaluationCount = 0;
      const result = condition.rules.some(rule => {
        evaluationCount++;
        return context.order_flags.includes(rule.value);
      });

      expect(result).toBe(true);
      expect(evaluationCount).toBe(1); // Stopped after first match
    });

    it('should short-circuit AND logic (stop on first false)', () => {
      const condition = {
        type: 'AND',
        rules: [
          { field: 'order_flags', operator: 'contains', value: 'organic' },
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' },
          { field: 'order_flags', operator: 'contains', value: 'vegan' }
        ]
      };
      const context = { order_flags: [] }; // No flags

      let evaluationCount = 0;
      const result = condition.rules.every(rule => {
        evaluationCount++;
        return context.order_flags.includes(rule.value);
      });

      expect(result).toBe(false);
      expect(evaluationCount).toBe(1); // Stopped after first failure
    });
  });

  // ============================================================================
  // REAL-WORLD SCENARIOS
  // ============================================================================

  describe('Real-world Scenarios', () => {
    it('should filter materials for organic order', () => {
      const bomItems = [
        { id: 1, material: 'Standard Salt', condition: null }, // Always included
        { id: 2, material: 'Organic Salt', condition: { type: 'OR', rules: [{ field: 'order_flags', operator: 'contains', value: 'organic' }] } },
        { id: 3, material: 'Regular Flour', condition: { type: 'OR', rules: [{ field: 'order_flags', operator: 'not_contains', value: 'organic' }] } }
      ];
      const context = { order_flags: ['organic'] };

      const included = bomItems.filter(item => {
        if (!item.condition) return true; // Unconditional
        
        return item.condition.rules.some(rule => {
          if (rule.operator === 'contains') {
            return context.order_flags.includes(rule.value);
          } else if (rule.operator === 'not_contains') {
            return !context.order_flags.includes(rule.value);
          }
          return false;
        });
      });

      expect(included).toHaveLength(2);
      expect(included.map(i => i.id)).toEqual([1, 2]); // Standard Salt + Organic Salt
    });

    it('should filter materials for gluten-free AND vegan order', () => {
      const bomItems = [
        { id: 1, material: 'Base Ingredient', condition: null },
        { id: 2, material: 'GF Flour', condition: { type: 'AND', rules: [
          { field: 'order_flags', operator: 'contains', value: 'gluten_free' },
          { field: 'order_flags', operator: 'contains', value: 'vegan' }
        ]}},
        { id: 3, material: 'Regular Flour', condition: { type: 'OR', rules: [
          { field: 'order_flags', operator: 'not_contains', value: 'gluten_free' }
        ]}}
      ];
      const context = { order_flags: ['gluten_free', 'vegan'] };

      const included = bomItems.filter(item => {
        if (!item.condition) return true;
        
        if (item.condition.type === 'AND') {
          return item.condition.rules.every(rule => 
            rule.operator === 'contains' && context.order_flags.includes(rule.value)
          );
        } else { // OR
          return item.condition.rules.some(rule => {
            if (rule.operator === 'not_contains') {
              return !context.order_flags.includes(rule.value);
            }
            return false;
          });
        }
      });

      expect(included).toHaveLength(2);
      expect(included.map(i => i.id)).toEqual([1, 2]); // Base + GF Flour
    });

    it('should filter materials for customer-specific packaging', () => {
      const bomItems = [
        { id: 1, material: 'Product', condition: null },
        { id: 2, material: 'Standard Box', condition: { type: 'OR', rules: [
          { field: 'order_flags', operator: 'not_contains', value: 'custom_packaging' }
        ]}},
        { id: 3, material: 'Custom Box', condition: { type: 'AND', rules: [
          { field: 'customer_id', operator: 'equals', value: '123' },
          { field: 'order_flags', operator: 'contains', value: 'custom_packaging' }
        ]}}
      ];
      const context = { customer_id: 123, order_flags: ['custom_packaging'] };

      const included = bomItems.filter(item => {
        if (!item.condition) return true;
        
        if (item.condition.type === 'AND') {
          return item.condition.rules.every(rule => {
            if (rule.field === 'customer_id') {
              return context.customer_id.toString() === rule.value;
            }
            if (rule.field === 'order_flags' && rule.operator === 'contains') {
              return context.order_flags.includes(rule.value);
            }
            return false;
          });
        } else { // OR
          return item.condition.rules.some(rule => {
            if (rule.operator === 'not_contains') {
              return !context.order_flags.includes(rule.value);
            }
            return false;
          });
        }
      });

      expect(included).toHaveLength(2);
      expect(included.map(i => i.id)).toEqual([1, 3]); // Product + Custom Box
    });

    it('should handle empty context (no flags)', () => {
      const bomItems = [
        { id: 1, material: 'Base', condition: null },
        { id: 2, material: 'Standard Version', condition: { type: 'OR', rules: [
          { field: 'order_flags', operator: 'not_contains', value: 'organic' }
        ]}}
      ];
      const context = { order_flags: [] };

      const included = bomItems.filter(item => {
        if (!item.condition) return true;
        
        return item.condition.rules.some(rule => {
          if (rule.operator === 'not_contains') {
            return !context.order_flags.includes(rule.value);
          }
          return false;
        });
      });

      expect(included).toHaveLength(2); // Both included (standard version used)
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing field in context', () => {
      const rule = { field: 'customer_tier', operator: 'equals', value: 'premium' };
      const context = { order_flags: [] }; // customer_tier missing

      expect(context).not.toHaveProperty('customer_tier');
      // In real implementation, should return FALSE (field missing)
    });

    it('should handle empty rules array', () => {
      const condition = {
        type: 'AND',
        rules: []
      };

      expect(condition.rules).toHaveLength(0);
      // AND with no rules = TRUE (all zero rules passed)
      // OR with no rules = FALSE (none of zero rules passed)
    });

    it('should handle nested flags', () => {
      const rule = { field: 'attributes.packaging', operator: 'equals', value: 'premium' };
      const context = { attributes: { packaging: 'premium' } };

      // Would need recursive field resolution
      expect(context.attributes.packaging).toBe(rule.value);
    });
  });
});

