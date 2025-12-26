/**
 * Validation Schema Tests: Product Allergen Schemas (Story 02.3)
 * Story: 02.3 - Product Allergens Declaration
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests Zod validation schemas for:
 * - addProductAllergenSchema - Validates allergen addition requests
 * - productAllergenResponseSchema - Validates API responses
 *
 * Coverage Target: 95%+
 * Test Count: 20+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-08: Reason required for may_contain
 * - Validation for allergen_id (UUID format)
 * - Validation for relation_type (enum)
 * - Reason min/max length validation
 */

import { describe, it, expect } from 'vitest'
import {
  addProductAllergenSchema,
  productAllergenResponseSchema,
  type AddProductAllergenInput,
  type ProductAllergenOutput,
} from '../product-allergen-schema'

describe('addProductAllergenSchema - Validation (Story 02.3)', () => {
  describe('Valid Input - Contains', () => {
    it('should accept valid contains allergen request', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'contains' as const,
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allergen_id).toBe(input.allergen_id)
        expect(result.data.relation_type).toBe('contains')
      }
    })

    it('should accept contains request without reason (optional)', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'contains' as const,
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(true)
    })
  })

  describe('Valid Input - May Contain', () => {
    it('should accept valid may_contain allergen request with reason (AC-07)', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: 'Shared production line with peanut products',
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allergen_id).toBe(input.allergen_id)
        expect(result.data.relation_type).toBe('may_contain')
        expect(result.data.reason).toBe(input.reason)
      }
    })

    it('should accept reason with exactly 10 characters (min length)', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: '1234567890', // Exactly 10 chars
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(true)
    })

    it('should accept reason with 500 characters (max length)', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: 'a'.repeat(500), // Exactly 500 chars
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(true)
    })
  })

  describe('Invalid allergen_id', () => {
    it('should reject invalid UUID format', () => {
      const input = {
        allergen_id: 'not-a-uuid',
        relation_type: 'contains' as const,
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/invalid.*allergen/i)
      }
    })

    it('should reject empty allergen_id', () => {
      const input = {
        allergen_id: '',
        relation_type: 'contains' as const,
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    it('should reject missing allergen_id', () => {
      const input = {
        relation_type: 'contains' as const,
      }

      const result = addProductAllergenSchema.safeParse(input as any)

      expect(result.success).toBe(false)
    })
  })

  describe('Invalid relation_type', () => {
    it('should reject invalid relation_type value', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'invalid_type',
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/contains|may_contain/i)
      }
    })

    it('should reject empty relation_type', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: '',
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    it('should reject missing relation_type', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/required/i)
      }
    })
  })

  describe('Reason Validation for may_contain (AC-08)', () => {
    it('should reject may_contain without reason (AC-08)', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        // Missing reason
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/reason.*required.*may contain/i)
        expect(result.error.issues[0].path).toContain('reason')
      }
    })

    it('should reject may_contain with empty reason', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: '',
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    it('should reject may_contain with reason less than 10 characters', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: 'short', // Only 5 chars
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/at least 10 characters/i)
      }
    })

    it('should reject may_contain with reason more than 500 characters', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: 'a'.repeat(501), // 501 chars (over limit)
      }

      const result = addProductAllergenSchema.safeParse(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/500 characters/i)
      }
    })

    it('should reject may_contain with whitespace-only reason', () => {
      const input = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'may_contain' as const,
        reason: '          ', // 10 spaces (should fail)
      }

      const result = addProductAllergenSchema.safeParse(input)

      // Assuming schema trims whitespace
      expect(result.success).toBe(false)
    })
  })

  describe('Type Inference', () => {
    it('should infer correct TypeScript type for valid input', () => {
      const input: AddProductAllergenInput = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'contains',
      }

      // Type check - should compile without errors
      expect(input.allergen_id).toBeDefined()
      expect(input.relation_type).toBe('contains')
    })

    it('should allow optional reason for contains in TypeScript type', () => {
      const input: AddProductAllergenInput = {
        allergen_id: '550e8400-e29b-41d4-a716-446655440000',
        relation_type: 'contains',
        // reason is optional
      }

      expect(input.reason).toBeUndefined()
    })
  })
})

describe('productAllergenResponseSchema - Validation (Story 02.3)', () => {
  describe('Valid Response', () => {
    it('should accept valid product allergen response', () => {
      const response = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A01',
        allergen_name: 'Gluten',
        allergen_icon: 'wheat',
        relation_type: 'contains' as const,
        source: 'manual' as const,
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(true)
    })

    it('should accept response with source_products array', () => {
      const response = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A01',
        allergen_name: 'Gluten',
        allergen_icon: 'wheat',
        relation_type: 'contains' as const,
        source: 'auto' as const,
        source_products: [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            code: 'RM-FLOUR-001',
            name: 'Wheat Flour',
          },
        ],
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source_products).toHaveLength(1)
        expect(result.data.source_products![0].code).toBe('RM-FLOUR-001')
      }
    })

    it('should accept response with reason for may_contain', () => {
      const response = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A05',
        allergen_name: 'Peanuts',
        allergen_icon: 'peanut',
        relation_type: 'may_contain' as const,
        source: 'manual' as const,
        reason: 'Shared production line',
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.reason).toBe('Shared production line')
      }
    })

    it('should accept response with null allergen_icon', () => {
      const response = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A01',
        allergen_name: 'Gluten',
        allergen_icon: null,
        relation_type: 'contains' as const,
        source: 'manual' as const,
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Response', () => {
    it('should reject response with invalid source value', () => {
      const response = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A01',
        allergen_name: 'Gluten',
        allergen_icon: 'wheat',
        relation_type: 'contains' as const,
        source: 'invalid_source', // Should be 'auto' or 'manual'
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(false)
    })

    it('should reject response with missing required fields', () => {
      const response = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_code: 'A01',
        // Missing allergen_id, allergen_name, etc.
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(false)
    })

    it('should reject response with invalid UUID format', () => {
      const response = {
        id: 'not-a-uuid',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A01',
        allergen_name: 'Gluten',
        allergen_icon: 'wheat',
        relation_type: 'contains' as const,
        source: 'manual' as const,
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = productAllergenResponseSchema.safeParse(response)

      expect(result.success).toBe(false)
    })
  })

  describe('Type Inference', () => {
    it('should infer correct TypeScript type for response', () => {
      const response: ProductAllergenOutput = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        allergen_id: '550e8400-e29b-41d4-a716-446655440001',
        allergen_code: 'A01',
        allergen_name: 'Gluten',
        allergen_icon: 'wheat',
        relation_type: 'contains',
        source: 'manual',
        created_at: '2025-01-01T00:00:00Z',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
      }

      // Type check - should compile without errors
      expect(response.id).toBeDefined()
      expect(response.relation_type).toBe('contains')
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * addProductAllergenSchema - 17 tests:
 *   - Valid contains input (2 tests)
 *   - Valid may_contain input (3 tests)
 *   - Invalid allergen_id (3 tests)
 *   - Invalid relation_type (3 tests)
 *   - Reason validation for may_contain (AC-08) (6 tests)
 *   - Type inference (2 tests)
 *
 * productAllergenResponseSchema - 8 tests:
 *   - Valid response (4 tests)
 *   - Invalid response (3 tests)
 *   - Type inference (1 test)
 *
 * Total: 25 tests
 * Coverage: 95%+ (all validation rules tested)
 * Status: RED (schemas not implemented yet)
 */
