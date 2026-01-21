/**
 * Over-Consumption Schema Validation Tests
 * Story: 04.6e - Over-Consumption Control
 *
 * Tests Zod validation schemas for over-consumption requests,
 * approvals, and rejections.
 *
 * RED PHASE: All tests should FAIL until schemas are implemented.
 */

import { describe, it, expect } from 'vitest'
import {
  overConsumptionRequestSchema,
  overConsumptionApprovalSchema,
  overConsumptionRejectionSchema,
} from '@/lib/validation/production-schemas'

describe('Over-Consumption Validation Schemas (Story 04.6e)', () => {
  // ==========================================================================
  // overConsumptionRequestSchema
  // ==========================================================================
  describe('overConsumptionRequestSchema', () => {
    describe('Valid Requests', () => {
      it('should accept valid request with all required fields', () => {
        const validRequest = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: 10,
        }

        const result = overConsumptionRequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept request with decimal quantity', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: 10.5,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(true)
      })

      it('should accept request with very small quantity', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: 0.001,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(true)
      })
    })

    describe('Missing Required Fields', () => {
      it('should reject request missing wo_material_id', () => {
        const request = {
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: 10,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('wo_material_id')
        }
      })

      it('should reject request missing lp_id', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          requested_qty: 10,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('lp_id')
        }
      })

      it('should reject request missing requested_qty', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('requested_qty')
        }
      })
    })

    describe('Invalid UUID Format', () => {
      it('should reject invalid wo_material_id UUID', () => {
        const request = {
          wo_material_id: 'not-a-uuid',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: 10,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toMatch(/invalid material id/i)
        }
      })

      it('should reject invalid lp_id UUID', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: 'invalid-lp',
          requested_qty: 10,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toMatch(/invalid lp id/i)
        }
      })
    })

    describe('Invalid Quantity', () => {
      it('should reject negative requested_qty', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: -10,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toMatch(/positive/i)
        }
      })

      it('should reject zero requested_qty', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: 0,
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })

      it('should reject string quantity', () => {
        const request = {
          wo_material_id: '550e8400-e29b-41d4-a716-446655440001',
          lp_id: '550e8400-e29b-41d4-a716-446655440002',
          requested_qty: '10',
        }

        const result = overConsumptionRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })
    })
  })

  // ==========================================================================
  // overConsumptionApprovalSchema
  // ==========================================================================
  describe('overConsumptionApprovalSchema', () => {
    describe('Valid Approvals', () => {
      it('should accept approval with request_id only', () => {
        const approval = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(true)
      })

      it('should accept approval with optional reason', () => {
        const approval = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'Additional material needed due to higher moisture content',
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(true)
      })

      it('should accept approval with empty string reason', () => {
        const approval = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: '',
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(true)
      })

      it('should accept approval with undefined reason', () => {
        const approval = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: undefined,
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Approvals', () => {
      it('should reject approval missing request_id', () => {
        const approval = {
          reason: 'Some reason',
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('request_id')
        }
      })

      it('should reject invalid request_id UUID', () => {
        const approval = {
          request_id: 'not-a-uuid',
          reason: 'Some reason',
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toMatch(/invalid request id/i)
        }
      })

      it('should reject reason exceeding 500 characters', () => {
        const approval = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'A'.repeat(501),
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(false)
      })

      it('should accept reason at exactly 500 characters', () => {
        const approval = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'A'.repeat(500),
        }

        const result = overConsumptionApprovalSchema.safeParse(approval)
        expect(result.success).toBe(true)
      })
    })
  })

  // ==========================================================================
  // overConsumptionRejectionSchema
  // ==========================================================================
  describe('overConsumptionRejectionSchema', () => {
    describe('Valid Rejections', () => {
      it('should accept valid rejection with reason', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'Investigate waste',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(true)
      })

      it('should accept rejection with minimum 1 character reason', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'X',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(true)
      })

      it('should accept rejection with maximum 500 character reason', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'A'.repeat(500),
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(true)
      })
    })

    describe('Missing Required Fields', () => {
      it('should reject missing request_id', () => {
        const rejection = {
          reason: 'Investigate waste',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('request_id')
        }
      })

      it('should reject missing reason', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('reason')
        }
      })
    })

    describe('Invalid Reason', () => {
      it('should reject empty reason string', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: '',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toMatch(/rejection reason is required/i)
        }
      })

      it('should reject reason exceeding 500 characters', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: 'A'.repeat(501),
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(false)
      })

      it('should reject whitespace-only reason', () => {
        const rejection = {
          request_id: '550e8400-e29b-41d4-a716-446655440001',
          reason: '   ',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(false)
      })
    })

    describe('Invalid UUID', () => {
      it('should reject invalid request_id UUID', () => {
        const rejection = {
          request_id: 'invalid-uuid',
          reason: 'Investigate waste',
        }

        const result = overConsumptionRejectionSchema.safeParse(rejection)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toMatch(/invalid request id/i)
        }
      })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * overConsumptionRequestSchema (12 tests):
 *   - Valid request with all fields
 *   - Decimal quantity
 *   - Very small quantity
 *   - Missing wo_material_id
 *   - Missing lp_id
 *   - Missing requested_qty
 *   - Invalid wo_material_id UUID
 *   - Invalid lp_id UUID
 *   - Negative quantity
 *   - Zero quantity
 *   - String quantity
 *
 * overConsumptionApprovalSchema (8 tests):
 *   - Request ID only
 *   - With optional reason
 *   - Empty string reason
 *   - Undefined reason
 *   - Missing request_id
 *   - Invalid UUID
 *   - Reason exceeding 500 chars
 *   - Reason at 500 chars boundary
 *
 * overConsumptionRejectionSchema (9 tests):
 *   - Valid rejection with reason
 *   - Minimum 1 char reason
 *   - Maximum 500 char reason
 *   - Missing request_id
 *   - Missing reason
 *   - Empty reason string
 *   - Reason exceeding 500 chars
 *   - Whitespace-only reason
 *   - Invalid UUID
 *
 * Total: 29 tests
 */
