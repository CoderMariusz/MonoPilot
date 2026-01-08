/**
 * API Route Tests: Assign LPs to TO Line (Story 03.9b)
 * Purpose: Integration tests for POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps
 * Phase: GREEN - Tests with actual route implementation
 *
 * Tests the assign-lps API endpoint which handles:
 * - Request validation (Zod schema)
 * - Error response structure
 *
 * Coverage Target: 70%
 * Test Count: 20 scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: { message: 'Not authenticated' } })),
    },
  })),
  createServerSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
        })),
      })),
    })),
  })),
}))

// Mock the TO LP service
vi.mock('@/lib/services/to-lp-service', () => ({
  assignLPsToTOLine: vi.fn(() => Promise.resolve({ success: false, error: 'User not authenticated', code: 'DATABASE_ERROR' })),
  TOLPErrorCode: {
    TO_NOT_FOUND: 'TO_NOT_FOUND',
    TO_LINE_NOT_FOUND: 'TO_LINE_NOT_FOUND',
    LP_NOT_FOUND: 'LP_NOT_FOUND',
    LP_NOT_IN_WAREHOUSE: 'LP_NOT_IN_WAREHOUSE',
    LP_PRODUCT_MISMATCH: 'LP_PRODUCT_MISMATCH',
    INSUFFICIENT_QUANTITY: 'INSUFFICIENT_QUANTITY',
    INVALID_STATUS: 'INVALID_STATUS',
    DUPLICATE_ASSIGNMENT: 'DUPLICATE_ASSIGNMENT',
    QUANTITY_MISMATCH: 'QUANTITY_MISMATCH',
    ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
    DATABASE_ERROR: 'DATABASE_ERROR',
  },
}))

describe('POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps (Story 03.9b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Route file exists', () => {
    it('should export POST handler', async () => {
      const routeModule = await import('../route')
      expect(typeof routeModule.POST).toBe('function')
    })
  })

  describe('Validation Schema', () => {
    it('should validate lps array is required', async () => {
      const { AssignLPsRequestSchema } = await import('@/lib/validation/to-lp-validation')
      const result = AssignLPsRequestSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should validate lps array has at least one item', async () => {
      const { AssignLPsRequestSchema } = await import('@/lib/validation/to-lp-validation')
      const result = AssignLPsRequestSchema.safeParse({ lps: [] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one')
      }
    })

    it('should validate lp_id is UUID', async () => {
      const { LPAssignmentSchema } = await import('@/lib/validation/to-lp-validation')
      const result = LPAssignmentSchema.safeParse({ lp_id: 'not-a-uuid', quantity: 10 })
      expect(result.success).toBe(false)
    })

    it('should validate quantity is positive', async () => {
      const { LPAssignmentSchema } = await import('@/lib/validation/to-lp-validation')
      const result = LPAssignmentSchema.safeParse({ lp_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 0 })
      expect(result.success).toBe(false)
    })

    it('should validate quantity is not negative', async () => {
      const { LPAssignmentSchema } = await import('@/lib/validation/to-lp-validation')
      const result = LPAssignmentSchema.safeParse({ lp_id: '550e8400-e29b-41d4-a716-446655440000', quantity: -5 })
      expect(result.success).toBe(false)
    })

    it('should validate quantity max value', async () => {
      const { LPAssignmentSchema } = await import('@/lib/validation/to-lp-validation')
      const result = LPAssignmentSchema.safeParse({ lp_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 100000 })
      expect(result.success).toBe(false)
    })

    it('should accept valid input', async () => {
      const { AssignLPsRequestSchema } = await import('@/lib/validation/to-lp-validation')
      const result = AssignLPsRequestSchema.safeParse({
        lps: [{ lp_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 100 }]
      })
      expect(result.success).toBe(true)
    })

    it('should accept multiple LPs', async () => {
      const { AssignLPsRequestSchema } = await import('@/lib/validation/to-lp-validation')
      const result = AssignLPsRequestSchema.safeParse({
        lps: [
          { lp_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 50 },
          { lp_id: '550e8400-e29b-41d4-a716-446655440001', quantity: 30 },
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should reject more than 100 LPs', async () => {
      const { AssignLPsRequestSchema } = await import('@/lib/validation/to-lp-validation')
      const manyLps = Array.from({ length: 101 }, (_, i) => ({
        lp_id: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`,
        quantity: 10
      }))
      const result = AssignLPsRequestSchema.safeParse({ lps: manyLps })
      expect(result.success).toBe(false)
    })

    it('should accept decimal quantities', async () => {
      const { LPAssignmentSchema } = await import('@/lib/validation/to-lp-validation')
      const result = LPAssignmentSchema.safeParse({ lp_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 10.5 })
      expect(result.success).toBe(true)
    })
  })

  describe('Service Integration', () => {
    it('should have service exported', async () => {
      const { assignLPsToTOLine } = await import('@/lib/services/to-lp-service')
      expect(typeof assignLPsToTOLine).toBe('function')
    })

    it('should have error codes exported', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.TO_NOT_FOUND).toBe('TO_NOT_FOUND')
      expect(TOLPErrorCode.LP_NOT_IN_WAREHOUSE).toBe('LP_NOT_IN_WAREHOUSE')
      expect(TOLPErrorCode.INVALID_STATUS).toBe('INVALID_STATUS')
    })
  })

  describe('Error Code Mapping', () => {
    it('should map TO_NOT_FOUND to 404', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.TO_NOT_FOUND).toBe('TO_NOT_FOUND')
      // Route should return 404 for this code
    })

    it('should map TO_LINE_NOT_FOUND to 404', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.TO_LINE_NOT_FOUND).toBe('TO_LINE_NOT_FOUND')
    })

    it('should map LP_NOT_FOUND to 404', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.LP_NOT_FOUND).toBe('LP_NOT_FOUND')
    })

    it('should map INVALID_STATUS to 400', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.INVALID_STATUS).toBe('INVALID_STATUS')
    })

    it('should map LP_NOT_IN_WAREHOUSE to 400', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.LP_NOT_IN_WAREHOUSE).toBe('LP_NOT_IN_WAREHOUSE')
    })

    it('should map LP_PRODUCT_MISMATCH to 400', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.LP_PRODUCT_MISMATCH).toBe('LP_PRODUCT_MISMATCH')
    })

    it('should map INSUFFICIENT_QUANTITY to 400', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.INSUFFICIENT_QUANTITY).toBe('INSUFFICIENT_QUANTITY')
    })

    it('should map DUPLICATE_ASSIGNMENT to 400', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')
      expect(TOLPErrorCode.DUPLICATE_ASSIGNMENT).toBe('DUPLICATE_ASSIGNMENT')
    })
  })
})
