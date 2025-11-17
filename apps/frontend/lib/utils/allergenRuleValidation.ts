/**
 * Allergen Rule Validation Utilities
 * Enforces allergen restrictions during Work Order creation
 */

export interface AllergenRule {
  lineId: number;
  ruleType: 'free-from' | 'allowed-only';
  allergens: string[];
}

export interface Product {
  id: number;
  name: string;
  allergens?: string[];
}

export interface ProductionLine {
  id: number;
  name: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  canOverride: boolean; // Can be overridden with e-signature
}

/**
 * Validate if a product can be scheduled on a production line based on allergen rules
 *
 * @param product - Product to schedule
 * @param line - Production line
 * @param rules - Array of allergen rules
 * @returns ValidationResult with errors, warnings, and override capability
 */
export function validateProductAllergenRules(
  product: Product,
  line: ProductionLine,
  rules: AllergenRule[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    canOverride: false,
  };

  // Find rule for this line
  const lineRule = rules.find((r) => r.lineId === line.id);

  // No rule = no restrictions
  if (!lineRule) {
    return result;
  }

  const productAllergens = product.allergens || [];

  if (lineRule.ruleType === 'free-from') {
    // Free-From Rule: Block products containing specified allergens
    const violatedAllergens = productAllergens.filter((allergen) =>
      lineRule.allergens.includes(allergen)
    );

    if (violatedAllergens.length > 0) {
      result.valid = false;
      result.canOverride = true; // Free-from violations can be overridden with signature
      result.errors.push(
        `Product "${product.name}" contains allergen(s): ${violatedAllergens.join(', ')}. ` +
          `Line "${line.name}" is designated as ${lineRule.allergens.map((a) => a.toUpperCase()).join('/')}-FREE.`
      );
      result.errors.push(
        `This violates the allergen-free policy. To proceed, an Admin/Manager must override with electronic signature.`
      );
    }
  } else if (lineRule.ruleType === 'allowed-only') {
    // Allowed-Only Rule: Only allow products containing specified allergens
    const hasAllowedAllergen = productAllergens.some((allergen) =>
      lineRule.allergens.includes(allergen)
    );

    if (!hasAllowedAllergen) {
      result.valid = false;
      result.canOverride = true; // Allowed-only violations can be overridden
      result.errors.push(
        `Product "${product.name}" does not contain required allergen(s): ${lineRule.allergens.join(', ')}. ` +
          `Line "${line.name}" is dedicated to ${lineRule.allergens.map((a) => a.toUpperCase()).join('/')}-containing products only.`
      );
      result.errors.push(
        `This violates the dedicated allergen line policy. To proceed, an Admin/Manager must override with electronic signature.`
      );
    } else {
      // Product is allowed, but warn if it has additional allergens
      const extraAllergens = productAllergens.filter(
        (allergen) => !lineRule.allergens.includes(allergen)
      );

      if (extraAllergens.length > 0) {
        result.warnings.push(
          `Note: Product "${product.name}" contains additional allergens not in the line's allowed list: ${extraAllergens.join(', ')}`
        );
      }
    }
  }

  return result;
}

/**
 * Batch validate multiple products against allergen rules
 * Useful for validating BOM items when creating a Work Order
 *
 * @param products - Array of products to validate
 * @param line - Production line
 * @param rules - Array of allergen rules
 * @returns Combined validation result
 */
export function validateMultipleProductsAllergenRules(
  products: Product[],
  line: ProductionLine,
  rules: AllergenRule[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    canOverride: false,
  };

  products.forEach((product) => {
    const productResult = validateProductAllergenRules(product, line, rules);

    if (!productResult.valid) {
      result.valid = false;
      result.canOverride = result.canOverride || productResult.canOverride;
      result.errors.push(...productResult.errors);
    }

    result.warnings.push(...productResult.warnings);
  });

  return result;
}

/**
 * Get human-readable description of an allergen rule
 *
 * @param rule - Allergen rule
 * @param lineName - Production line name
 * @returns Description string
 */
export function describeAllergenRule(rule: AllergenRule, lineName: string): string {
  const allergenList = rule.allergens.map((a) => a.toUpperCase()).join(', ');

  if (rule.ruleType === 'free-from') {
    return `${lineName} is designated as ${allergenList}-FREE. Products containing these allergens are blocked.`;
  } else {
    return `${lineName} is dedicated to ${allergenList}-containing products only. Other products are blocked.`;
  }
}

/**
 * Example integration with Work Orders API:
 *
 * ```typescript
 * import { validateProductAllergenRules } from '@/lib/utils/allergenRuleValidation';
 *
 * // In WorkOrdersAPI.create() or WO creation form:
 * const product = await ProductsAPI.getById(productId);
 * const line = await ProductionLinesAPI.getById(lineId);
 * const rules = await AllergenRulesAPI.getAll(); // Fetch from DB
 *
 * const validation = validateProductAllergenRules(product, line, rules);
 *
 * if (!validation.valid) {
 *   if (validation.canOverride) {
 *     // Show override modal - require e-signature
 *     const signature = await requestESignature(user, validation.errors.join('\n'));
 *     if (!signature) {
 *       throw new Error('Work Order creation blocked by allergen rule');
 *     }
 *     // Log override in audit_log
 *     await AuditAPI.log({
 *       action: 'wo_allergen_rule_override',
 *       resource_type: 'work_orders',
 *       resource_id: woId,
 *       details: { signature, validation },
 *     });
 *   } else {
 *     throw new Error(validation.errors.join('\n'));
 *   }
 * }
 * ```
 */
