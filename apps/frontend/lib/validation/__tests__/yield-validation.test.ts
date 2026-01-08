/**
 * Validation Schema Tests: Yield Tracking
 * Story: 04.4 - Yield Tracking
 * Phase: RED - Tests should FAIL (schema not yet implemented)
 *
 * Tests Zod validation schemas for Yield Tracking:
 * - updateYieldSchema (PATCH request body)
 * - yieldLogSchema (yield_logs table record)
 * - yieldResponseSchema (API response)
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)
 */

import { describe, it, expect } from 'vitest'
import {
  updateYieldSchema,
  yieldLogSchema,
  yieldResponseSchema,
  type UpdateYieldInput,
  type YieldLogInput,
  type YieldResponseData,
} from '@/lib/validation/yield-validation'

describe('Yield Validation Schemas (Story 04.4)', () => {
  // ==========================================================================
  // updateYieldSchema - PATCH /api/production/work-orders/:id/yield
  // ==========================================================================
  describe('updateYieldSchema', () => {
    /**
     * Valid Inputs
     */
    describe('Valid Inputs', () => {
      it('should accept valid produced_quantity', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 950,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept produced_quantity with optional notes', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 950,
          notes: 'Adjusted after recount',
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept zero produced_quantity', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 0,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept decimal produced_quantity', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 950.5,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept produced_quantity with many decimal places', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 950.1234,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept empty notes string', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 500,
          notes: '',
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept notes at maximum length (1000 chars)', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 500,
          notes: 'A'.repeat(1000),
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept large produced_quantity', () => {
        const input: UpdateYieldInput = {
          produced_quantity: 9999999.9999,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    /**
     * Invalid Inputs - produced_quantity
     */
    describe('Invalid produced_quantity', () => {
      it('should reject negative produced_quantity (AC-2)', () => {
        const input = {
          produced_quantity: -50,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('positive')
        }
      })

      it('should reject missing produced_quantity', () => {
        const input = {}

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject non-numeric produced_quantity (string) (AC-2)', () => {
        const input = {
          produced_quantity: 'ABC',
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('number')
        }
      })

      it('should reject null produced_quantity', () => {
        const input = {
          produced_quantity: null,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject undefined produced_quantity', () => {
        const input = {
          produced_quantity: undefined,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject NaN as produced_quantity', () => {
        const input = {
          produced_quantity: NaN,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject Infinity as produced_quantity', () => {
        const input = {
          produced_quantity: Infinity,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject -Infinity as produced_quantity', () => {
        const input = {
          produced_quantity: -Infinity,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject boolean as produced_quantity', () => {
        const input = {
          produced_quantity: true,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject array as produced_quantity', () => {
        const input = {
          produced_quantity: [950],
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject object as produced_quantity', () => {
        const input = {
          produced_quantity: { value: 950 },
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    /**
     * Invalid Inputs - notes
     */
    describe('Invalid notes', () => {
      it('should reject notes exceeding 1000 characters', () => {
        const input = {
          produced_quantity: 500,
          notes: 'A'.repeat(1001),
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('1000')
        }
      })

      it('should reject non-string notes', () => {
        const input = {
          produced_quantity: 500,
          notes: 123,
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject array as notes', () => {
        const input = {
          produced_quantity: 500,
          notes: ['note1', 'note2'],
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    /**
     * Unknown Fields
     */
    describe('Unknown Fields', () => {
      it('should strip unknown fields', () => {
        const input = {
          produced_quantity: 500,
          unknown_field: 'should be stripped',
        }

        const result = updateYieldSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect('unknown_field' in result.data).toBe(false)
        }
      })
    })
  })

  // ==========================================================================
  // yieldLogSchema - yield_logs table record validation
  // ==========================================================================
  describe('yieldLogSchema', () => {
    /**
     * Valid Inputs
     */
    describe('Valid Inputs', () => {
      it('should accept valid yield log entry', () => {
        const input: YieldLogInput = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept yield log with optional notes', () => {
        const input: YieldLogInput = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 500,
          new_quantity: 950,
          old_yield_percent: 50,
          new_yield_percent: 95,
          notes: 'Adjusted after recount',
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept overproduction yield (>100%)', () => {
        const input: YieldLogInput = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 1000,
          new_quantity: 1100,
          old_yield_percent: 100,
          new_yield_percent: 110,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept zero quantities', () => {
        const input: YieldLogInput = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 0,
          old_yield_percent: 0,
          new_yield_percent: 0,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept decimal yield percentages', () => {
        const input: YieldLogInput = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 500,
          new_quantity: 954,
          old_yield_percent: 50.0,
          new_yield_percent: 95.4,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    /**
     * Invalid Inputs - wo_id
     */
    describe('Invalid wo_id', () => {
      it('should reject invalid UUID for wo_id', () => {
        const input = {
          wo_id: 'not-a-uuid',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing wo_id', () => {
        const input = {
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject empty string wo_id', () => {
        const input = {
          wo_id: '',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    /**
     * Invalid Inputs - quantities
     */
    describe('Invalid quantities', () => {
      it('should reject negative old_quantity', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: -100,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject negative new_quantity', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: -500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing old_quantity', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing new_quantity', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          old_yield_percent: 0,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    /**
     * Invalid Inputs - yield percentages
     */
    describe('Invalid yield percentages', () => {
      it('should reject negative old_yield_percent', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: -10,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject negative new_yield_percent', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: -50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing old_yield_percent', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 500,
          new_yield_percent: 50,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing new_yield_percent', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should accept high yield percent (allow overproduction > 100%)', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 1000,
          new_quantity: 1500,
          old_yield_percent: 100,
          new_yield_percent: 150,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject yield percent above maximum (10000%)', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 1000,
          new_quantity: 1000000,
          old_yield_percent: 100,
          new_yield_percent: 10001,
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    /**
     * Invalid Inputs - notes
     */
    describe('Invalid notes in yieldLogSchema', () => {
      it('should reject notes exceeding 1000 characters', () => {
        const input = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          old_quantity: 0,
          new_quantity: 500,
          old_yield_percent: 0,
          new_yield_percent: 50,
          notes: 'N'.repeat(1001),
        }

        const result = yieldLogSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })
  })

  // ==========================================================================
  // yieldResponseSchema - API response validation
  // ==========================================================================
  describe('yieldResponseSchema', () => {
    /**
     * Valid Responses
     */
    describe('Valid Responses', () => {
      it('should accept valid yield response', () => {
        const response: YieldResponseData = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 950,
          yield_percent: 95.0,
          yield_color: 'green',
          yield_label: 'Excellent',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(true)
      })

      it('should accept response with yellow yield_color', () => {
        const response: YieldResponseData = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 750,
          yield_percent: 75.0,
          yield_color: 'yellow',
          yield_label: 'Below Target',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(true)
      })

      it('should accept response with red yield_color', () => {
        const response: YieldResponseData = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 650,
          yield_percent: 65.0,
          yield_color: 'red',
          yield_label: 'Low Yield',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(true)
      })
    })

    /**
     * Invalid Responses
     */
    describe('Invalid Responses', () => {
      it('should reject invalid yield_color', () => {
        const response = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 950,
          yield_percent: 95.0,
          yield_color: 'blue', // Invalid color
          yield_label: 'Excellent',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(false)
      })

      it('should reject missing wo_id', () => {
        const response = {
          produced_quantity: 950,
          yield_percent: 95.0,
          yield_color: 'green',
          yield_label: 'Excellent',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(false)
      })

      it('should reject missing yield_percent', () => {
        const response = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 950,
          yield_color: 'green',
          yield_label: 'Excellent',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(false)
      })

      it('should reject missing yield_color', () => {
        const response = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 950,
          yield_percent: 95.0,
          yield_label: 'Excellent',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(false)
      })

      it('should reject missing yield_label', () => {
        const response = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 950,
          yield_percent: 95.0,
          yield_color: 'green',
          updated_at: '2025-01-08T14:00:00Z',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(false)
      })

      it('should reject invalid updated_at format', () => {
        const response = {
          wo_id: '12345678-1234-4234-a234-123456789012',
          produced_quantity: 950,
          yield_percent: 95.0,
          yield_color: 'green',
          yield_label: 'Excellent',
          updated_at: 'not-a-date',
        }

        const result = yieldResponseSchema.safeParse(response)
        expect(result.success).toBe(false)
      })
    })
  })

  // ==========================================================================
  // Type Exports Verification
  // ==========================================================================
  describe('Type Exports', () => {
    it('should export UpdateYieldInput type', () => {
      const input: UpdateYieldInput = {
        produced_quantity: 950,
        notes: 'Test note',
      }
      expect(input).toBeDefined()
    })

    it('should export YieldLogInput type', () => {
      const log: YieldLogInput = {
        wo_id: '12345678-1234-4234-a234-123456789012',
        old_quantity: 0,
        new_quantity: 500,
        old_yield_percent: 0,
        new_yield_percent: 50,
      }
      expect(log).toBeDefined()
    })

    it('should export YieldResponseData type', () => {
      const response: YieldResponseData = {
        wo_id: '12345678-1234-4234-a234-123456789012',
        produced_quantity: 950,
        yield_percent: 95.0,
        yield_color: 'green',
        yield_label: 'Excellent',
        updated_at: '2025-01-08T14:00:00Z',
      }
      expect(response).toBeDefined()
    })
  })
})

/**
 * Test Summary for Story 04.4 - Yield Validation Schemas
 * ======================================================
 *
 * Test Coverage:
 * - updateYieldSchema: 23 tests
 *   - Valid inputs: 8 tests
 *   - Invalid produced_quantity: 11 tests
 *   - Invalid notes: 3 tests
 *   - Unknown fields: 1 test
 *
 * - yieldLogSchema: 18 tests
 *   - Valid inputs: 5 tests
 *   - Invalid wo_id: 3 tests
 *   - Invalid quantities: 4 tests
 *   - Invalid yield percentages: 6 tests
 *
 * - yieldResponseSchema: 9 tests
 *   - Valid responses: 3 tests
 *   - Invalid responses: 6 tests
 *
 * - Type Exports: 3 tests
 *
 * Total: 53 test cases
 *
 * Acceptance Criteria Covered:
 * - AC-2: produced_quantity validation (nonnegative, numeric)
 * - AC-3: yield_percent range (0-10000 for overproduction)
 * - AC-5: notes field validation (max 1000 chars)
 * - AC-4: yield_color enum (green/yellow/red)
 *
 * Status: RED (schemas not implemented yet)
 */
