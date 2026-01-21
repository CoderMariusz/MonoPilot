/**
 * Validation Tests: Output Query Schema
 * Story: 04.7d - Multiple Outputs per WO
 *
 * Tests Zod schema for output query parameters
 *
 * RED PHASE - All tests should FAIL until schema is implemented
 */

import { describe, it, expect } from 'vitest'
import { outputQuerySchema } from '@/lib/validation/production-schemas'

describe('outputQuerySchema (Story 04.7d)', () => {
  // ============================================================================
  // Page Parameter Tests
  // ============================================================================
  describe('page parameter', () => {
    it('should default to 1 when not provided', () => {
      const result = outputQuerySchema.parse({})
      expect(result.page).toBe(1)
    })

    it('should accept valid page number', () => {
      const result = outputQuerySchema.parse({ page: 5 })
      expect(result.page).toBe(5)
    })

    it('should coerce string to number', () => {
      const result = outputQuerySchema.parse({ page: '3' })
      expect(result.page).toBe(3)
    })

    it('should reject page < 1', () => {
      expect(() => outputQuerySchema.parse({ page: 0 })).toThrow()
      expect(() => outputQuerySchema.parse({ page: -1 })).toThrow()
    })

    it('should reject non-integer page', () => {
      expect(() => outputQuerySchema.parse({ page: 1.5 })).toThrow()
    })
  })

  // ============================================================================
  // Limit Parameter Tests
  // ============================================================================
  describe('limit parameter', () => {
    it('should default to 20 when not provided', () => {
      const result = outputQuerySchema.parse({})
      expect(result.limit).toBe(20)
    })

    it('should accept valid limit', () => {
      const result = outputQuerySchema.parse({ limit: 50 })
      expect(result.limit).toBe(50)
    })

    it('should coerce string to number', () => {
      const result = outputQuerySchema.parse({ limit: '25' })
      expect(result.limit).toBe(25)
    })

    it('should reject limit < 1', () => {
      expect(() => outputQuerySchema.parse({ limit: 0 })).toThrow()
    })

    it('should reject limit > 100', () => {
      expect(() => outputQuerySchema.parse({ limit: 101 })).toThrow()
      expect(() => outputQuerySchema.parse({ limit: 150 })).toThrow()
    })

    it('should accept max limit of 100', () => {
      const result = outputQuerySchema.parse({ limit: 100 })
      expect(result.limit).toBe(100)
    })
  })

  // ============================================================================
  // QA Status Filter Tests
  // ============================================================================
  describe('qa_status parameter', () => {
    it('should be optional', () => {
      const result = outputQuerySchema.parse({})
      expect(result.qa_status).toBeUndefined()
    })

    it('should accept "approved"', () => {
      const result = outputQuerySchema.parse({ qa_status: 'approved' })
      expect(result.qa_status).toBe('approved')
    })

    it('should accept "pending"', () => {
      const result = outputQuerySchema.parse({ qa_status: 'pending' })
      expect(result.qa_status).toBe('pending')
    })

    it('should accept "rejected"', () => {
      const result = outputQuerySchema.parse({ qa_status: 'rejected' })
      expect(result.qa_status).toBe('rejected')
    })

    it('should reject invalid qa_status', () => {
      expect(() =>
        outputQuerySchema.parse({ qa_status: 'invalid' })
      ).toThrow()
    })
  })

  // ============================================================================
  // Location Filter Tests
  // ============================================================================
  describe('location_id parameter', () => {
    it('should be optional', () => {
      const result = outputQuerySchema.parse({})
      expect(result.location_id).toBeUndefined()
    })

    it('should accept valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = outputQuerySchema.parse({ location_id: uuid })
      expect(result.location_id).toBe(uuid)
    })

    it('should reject invalid UUID', () => {
      expect(() =>
        outputQuerySchema.parse({ location_id: 'not-a-uuid' })
      ).toThrow()
    })
  })

  // ============================================================================
  // Sort Parameter Tests
  // ============================================================================
  describe('sort parameter', () => {
    it('should default to "created_at"', () => {
      const result = outputQuerySchema.parse({})
      expect(result.sort).toBe('created_at')
    })

    it('should accept "created_at"', () => {
      const result = outputQuerySchema.parse({ sort: 'created_at' })
      expect(result.sort).toBe('created_at')
    })

    it('should accept "qty"', () => {
      const result = outputQuerySchema.parse({ sort: 'qty' })
      expect(result.sort).toBe('qty')
    })

    it('should accept "lp_number"', () => {
      const result = outputQuerySchema.parse({ sort: 'lp_number' })
      expect(result.sort).toBe('lp_number')
    })

    it('should reject invalid sort field', () => {
      expect(() => outputQuerySchema.parse({ sort: 'invalid' })).toThrow()
    })
  })

  // ============================================================================
  // Order Parameter Tests
  // ============================================================================
  describe('order parameter', () => {
    it('should default to "desc"', () => {
      const result = outputQuerySchema.parse({})
      expect(result.order).toBe('desc')
    })

    it('should accept "asc"', () => {
      const result = outputQuerySchema.parse({ order: 'asc' })
      expect(result.order).toBe('asc')
    })

    it('should accept "desc"', () => {
      const result = outputQuerySchema.parse({ order: 'desc' })
      expect(result.order).toBe('desc')
    })

    it('should reject invalid order', () => {
      expect(() => outputQuerySchema.parse({ order: 'ascending' })).toThrow()
    })
  })

  // ============================================================================
  // Combined Parameter Tests
  // ============================================================================
  describe('combined parameters', () => {
    it('should parse all parameters together', () => {
      const result = outputQuerySchema.parse({
        page: 2,
        limit: 50,
        qa_status: 'approved',
        location_id: '550e8400-e29b-41d4-a716-446655440000',
        sort: 'qty',
        order: 'asc',
      })

      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
      expect(result.qa_status).toBe('approved')
      expect(result.location_id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.sort).toBe('qty')
      expect(result.order).toBe('asc')
    })

    it('should apply defaults for missing parameters', () => {
      const result = outputQuerySchema.parse({
        qa_status: 'pending',
      })

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.qa_status).toBe('pending')
      expect(result.sort).toBe('created_at')
      expect(result.order).toBe('desc')
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * page parameter (5 tests):
 *   - Default value
 *   - Valid number
 *   - String coercion
 *   - Minimum validation
 *   - Integer validation
 *
 * limit parameter (6 tests):
 *   - Default value
 *   - Valid number
 *   - String coercion
 *   - Minimum validation
 *   - Maximum validation
 *   - Max boundary (100)
 *
 * qa_status parameter (5 tests):
 *   - Optional
 *   - Approved value
 *   - Pending value
 *   - Rejected value
 *   - Invalid value rejection
 *
 * location_id parameter (3 tests):
 *   - Optional
 *   - Valid UUID
 *   - Invalid UUID rejection
 *
 * sort parameter (5 tests):
 *   - Default value
 *   - created_at
 *   - qty
 *   - lp_number
 *   - Invalid rejection
 *
 * order parameter (4 tests):
 *   - Default value
 *   - asc
 *   - desc
 *   - Invalid rejection
 *
 * combined parameters (2 tests):
 *   - All parameters
 *   - Defaults with partial
 *
 * Total: 30 tests (RED - will fail until schema implemented)
 */
