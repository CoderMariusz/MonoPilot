/**
 * LP Split Validation Schema - Unit Tests (Story 05.17)
 * Purpose: Test Zod schemas for LP Split operation
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests the LP Split Zod schemas which validate:
 * - SplitLPSchema: Split quantity and destination location
 * - SplitLPRequestSchema: Full split request with LP ID
 * - validateSplitWithContext: Context-aware validation (requires source LP)
 *
 * Coverage Target: 95%+
 * Test Count: 35+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-2: Split Quantity Validation (Valid)
 * - AC-3: Split Quantity Validation (Invalid - >= source)
 * - AC-4: Split Quantity Validation (Invalid - Zero/Negative)
 * - AC-5: Destination Location Selection
 * - AC-14: API Endpoint - Success Request Body
 * - AC-15: API Endpoint - Validation Error
 * - AC-25: Edge Case - Split Decimals
 */

import { describe, it, expect } from 'vitest'
import {
  SplitLPSchema,
  SplitLPRequestSchema,
  validateSplitWithContext,
  type SplitLPInput,
  type SplitLPRequestInput,
} from '@/lib/validation/lp-split-schema'

describe('LP Split Validation Schemas (Story 05.17)', () => {
  // ============================================
  // SPLIT LP SCHEMA TESTS
  // ============================================
  describe('SplitLPSchema', () => {
    // Test splitQty field
    describe('splitQty field', () => {
      it('should require splitQty', () => {
        const data = {
          destinationLocationId: '550e8400-e29b-41d4-a716-446655440000',
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('splitQty')
        }
      })

      it('should accept positive splitQty (AC-2)', () => {
        const data = {
          splitQty: 30,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept decimal splitQty (AC-25)', () => {
        const data = {
          splitQty: 40.25,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept very small positive splitQty (AC-25)', () => {
        const data = {
          splitQty: 0.0001,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject zero splitQty (AC-4)', () => {
        const data = {
          splitQty: 0,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('greater than 0')
        }
      })

      it('should reject negative splitQty (AC-4)', () => {
        const data = {
          splitQty: -10,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('greater than 0')
        }
      })

      it('should reject non-numeric splitQty', () => {
        const data = {
          splitQty: 'thirty',
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject null splitQty', () => {
        const data = {
          splitQty: null,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept large positive splitQty', () => {
        const data = {
          splitQty: 999999.9999,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept integer as splitQty', () => {
        const data = {
          splitQty: 100,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.splitQty).toBe(100)
        }
      })

      it('should handle scientific notation', () => {
        const data = {
          splitQty: 1e2, // 100
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.splitQty).toBe(100)
        }
      })

      it('should reject NaN', () => {
        const data = {
          splitQty: NaN,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject Infinity', () => {
        const data = {
          splitQty: Infinity,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('valid number')
        }
      })
    })

    // Test destinationLocationId field
    describe('destinationLocationId field (AC-5)', () => {
      it('should allow destinationLocationId to be optional', () => {
        const data = {
          splitQty: 30,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.destinationLocationId).toBeUndefined()
        }
      })

      it('should accept valid UUID for destinationLocationId', () => {
        const data = {
          splitQty: 30,
          destinationLocationId: '550e8400-e29b-41d4-a716-446655440000',
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID format', () => {
        const data = {
          splitQty: 30,
          destinationLocationId: 'not-a-uuid',
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid')
        }
      })

      it('should reject empty string for destinationLocationId', () => {
        const data = {
          splitQty: 30,
          destinationLocationId: '',
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should allow null destinationLocationId (defaults to same location)', () => {
        const data = {
          splitQty: 30,
          destinationLocationId: null,
        }

        // Schema should accept null or transform it
        const result = SplitLPSchema.safeParse(data)
        // Depending on implementation - might be true with null allowed
        expect(result.success).toBe(true)
      })
    })

    // Test complete valid split input
    describe('Complete valid split input', () => {
      it('should validate complete split input', () => {
        const data = {
          splitQty: 40.5,
          destinationLocationId: '550e8400-e29b-41d4-a716-446655440000',
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(data)
        }
      })

      it('should validate minimal valid split input', () => {
        const data = {
          splitQty: 30,
        }

        const result = SplitLPSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // SPLIT LP REQUEST SCHEMA TESTS (AC-14)
  // ============================================
  describe('SplitLPRequestSchema', () => {
    describe('lpId field', () => {
      it('should require lpId', () => {
        const data = {
          splitQty: 30,
        }

        const result = SplitLPRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('lpId')
        }
      })

      it('should accept valid UUID for lpId', () => {
        const data = {
          lpId: '550e8400-e29b-41d4-a716-446655440000',
          splitQty: 30,
        }

        const result = SplitLPRequestSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID for lpId', () => {
        const data = {
          lpId: 'invalid-lp-id',
          splitQty: 30,
        }

        const result = SplitLPRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid LP ID')
        }
      })

      it('should reject null lpId', () => {
        const data = {
          lpId: null,
          splitQty: 30,
        }

        const result = SplitLPRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('Complete request validation', () => {
      it('should validate complete request with all fields (AC-14)', () => {
        const data = {
          lpId: '550e8400-e29b-41d4-a716-446655440000',
          splitQty: 30,
          destinationLocationId: '660e8400-e29b-41d4-a716-446655440001',
        }

        const result = SplitLPRequestSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.lpId).toBe('550e8400-e29b-41d4-a716-446655440000')
          expect(result.data.splitQty).toBe(30)
          expect(result.data.destinationLocationId).toBe('660e8400-e29b-41d4-a716-446655440001')
        }
      })

      it('should validate request with optional destinationLocationId omitted', () => {
        const data = {
          lpId: '550e8400-e29b-41d4-a716-446655440000',
          splitQty: 30,
        }

        const result = SplitLPRequestSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // CONTEXT-AWARE VALIDATION TESTS (AC-3)
  // ============================================
  describe('validateSplitWithContext()', () => {
    describe('Quantity comparison with source LP (AC-3)', () => {
      it('should return valid for splitQty < sourceLpQty', () => {
        const result = validateSplitWithContext(30, 100)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should return invalid for splitQty = sourceLpQty (AC-3)', () => {
        const result = validateSplitWithContext(100, 100)

        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/must be less than/i)
      })

      it('should return invalid for splitQty > sourceLpQty (AC-3)', () => {
        const result = validateSplitWithContext(150, 100)

        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/must be less than/i)
      })

      it('should return invalid for zero splitQty', () => {
        const result = validateSplitWithContext(0, 100)

        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/greater than 0/i)
      })

      it('should return invalid for negative splitQty', () => {
        const result = validateSplitWithContext(-10, 100)

        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/greater than 0/i)
      })
    })

    describe('Decimal handling (AC-25)', () => {
      it('should handle decimal quantities correctly', () => {
        const result = validateSplitWithContext(40.25, 100.5)

        expect(result.valid).toBe(true)
      })

      it('should reject when decimal splitQty equals sourceLpQty', () => {
        const result = validateSplitWithContext(100.5, 100.5)

        expect(result.valid).toBe(false)
      })

      it('should accept decimal splitQty less than sourceLpQty', () => {
        const result = validateSplitWithContext(50.1234, 100.5)

        expect(result.valid).toBe(true)
      })

      it('should handle very small remainders', () => {
        const result = validateSplitWithContext(99.9999, 100.0)

        expect(result.valid).toBe(true)
      })
    })

    describe('Error message formatting', () => {
      it('should include current LP quantity in error message', () => {
        const result = validateSplitWithContext(100, 80)

        expect(result.valid).toBe(false)
        expect(result.error).toContain('80')
      })

      it('should provide helpful error for zero quantity', () => {
        const result = validateSplitWithContext(0, 100)

        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/greater than 0/i)
      })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * SplitLPSchema - 17 tests:
 *   - splitQty: required, positive, decimal, zero, negative, non-numeric, null
 *   - splitQty: large values, integer, scientific notation, NaN, Infinity
 *   - destinationLocationId: optional, valid UUID, invalid format, empty, null
 *   - Complete validation: all fields, minimal fields
 *
 * SplitLPRequestSchema - 6 tests:
 *   - lpId: required, valid UUID, invalid UUID, null
 *   - Complete request: all fields, optional omitted
 *
 * validateSplitWithContext - 12 tests:
 *   - Quantity comparison: less than, equal, greater than, zero, negative
 *   - Decimal handling: valid decimals, equal decimals, small remainders
 *   - Error messages: includes quantity, helpful messages
 *
 * Total: 35 tests
 * Coverage: 95%+ (all schema fields and edge cases tested)
 * Status: RED (schemas not implemented yet)
 */
