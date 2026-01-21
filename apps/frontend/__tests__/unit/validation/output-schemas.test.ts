/**
 * Unit Tests: Output Registration Validation Schemas (Story 04.7a)
 * Phase: GREEN - Tests should PASS
 *
 * Tests Zod validation schemas for output registration:
 * - registerOutputSchema - Main output registration
 * - registerByProductSchema - By-product registration
 * - createOutputSchemaWithSettings - Dynamic QA requirement
 *
 * Acceptance Criteria Coverage:
 * - FR-PROD-011: Input validation
 * - FR-PROD-013: By-product validation
 */

import { describe, it, expect } from 'vitest'

import {
  registerOutputSchema,
  registerByProductSchema,
  createOutputSchemaWithSettings,
} from '@/lib/validation/output-schemas'

describe('Output Registration Validation Schemas (Story 04.7a)', () => {
  // ============================================================================
  // registerOutputSchema Tests
  // ============================================================================
  describe('registerOutputSchema', () => {
    describe('wo_id validation', () => {
      it('accepts valid UUID', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('rejects invalid UUID', () => {
        const input = {
          wo_id: 'not-a-uuid',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error?.issues[0].message).toBe('Invalid work order ID')
        }
      })
    })

    describe('quantity validation', () => {
      it('AC: rejects quantity = 0 with "Quantity must be greater than 0"', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 0,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error?.issues[0].message).toBe(
            'Quantity must be greater than 0'
          )
        }
      })

      it('rejects negative quantity', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: -100,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('accepts positive decimal quantity', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500.5,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('uom validation', () => {
      it('requires uom to be non-empty', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: '',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error?.issues[0].message).toBe(
            'Unit of measure is required'
          )
        }
      })

      it('accepts valid uom', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('batch_number validation', () => {
      it('requires batch_number', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: '',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error?.issues[0].message).toBe('Batch number is required')
        }
      })

      it('rejects batch_number > 50 chars', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'A'.repeat(51),
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    describe('qa_status validation', () => {
      it('accepts approved status', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          qa_status: 'approved',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('accepts pending status', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          qa_status: 'pending',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('accepts rejected status', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          qa_status: 'rejected',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('rejects invalid qa_status', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          qa_status: 'invalid',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('allows undefined qa_status (optional)', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('location_id validation', () => {
      it('requires valid UUID', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: 'invalid-uuid',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error?.issues[0].message).toBe('Invalid location')
        }
      })
    })

    describe('expiry_date validation', () => {
      it('accepts valid date string', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('rejects invalid date string', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: 'not-a-date',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error?.issues[0].message).toBe('Invalid expiry date')
        }
      })
    })

    describe('notes validation', () => {
      it('allows empty notes', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
          notes: '',
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('rejects notes > 500 chars', () => {
        const input = {
          wo_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 500,
          uom: 'kg',
          batch_number: 'B-2025-001',
          location_id: '550e8400-e29b-41d4-a716-446655440001',
          expiry_date: '2025-02-15',
          notes: 'A'.repeat(501),
        }
        const result = registerOutputSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })
  })

  // ============================================================================
  // createOutputSchemaWithSettings Tests
  // ============================================================================
  describe('createOutputSchemaWithSettings()', () => {
    it('AC: requires qa_status when require_qa_on_output=true', () => {
      const schema = createOutputSchemaWithSettings(true)
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 500,
        uom: 'kg',
        batch_number: 'B-2025-001',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-02-15',
        // qa_status omitted
      }
      const result = schema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.issues[0].message).toBe('QA status is required')
      }
    })

    it('AC: allows null qa_status when require_qa_on_output=false', () => {
      const schema = createOutputSchemaWithSettings(false)
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 500,
        uom: 'kg',
        batch_number: 'B-2025-001',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-02-15',
        // qa_status omitted - should be allowed
      }
      const result = schema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('validates qa_status when provided and require_qa=true', () => {
      const schema = createOutputSchemaWithSettings(true)
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 500,
        uom: 'kg',
        batch_number: 'B-2025-001',
        qa_status: 'approved',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-02-15',
      }
      const result = schema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // registerByProductSchema Tests
  // ============================================================================
  describe('registerByProductSchema', () => {
    it('accepts valid by-product input', () => {
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        main_output_lp_id: '550e8400-e29b-41d4-a716-446655440002',
        by_product_id: '550e8400-e29b-41d4-a716-446655440003',
        quantity: 45,
        uom: 'kg',
        batch_number: 'B-2025-001-BP-GERM',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-03-15',
      }
      const result = registerByProductSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('allows quantity = 0 for by-products (with warning)', () => {
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        main_output_lp_id: '550e8400-e29b-41d4-a716-446655440002',
        by_product_id: '550e8400-e29b-41d4-a716-446655440003',
        quantity: 0,
        uom: 'kg',
        batch_number: 'B-2025-001-BP-GERM',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-03-15',
      }
      const result = registerByProductSchema.safeParse(input)
      expect(result.success).toBe(true) // Validation passes, warning at service level
    })

    it('rejects negative quantity', () => {
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        main_output_lp_id: '550e8400-e29b-41d4-a716-446655440002',
        by_product_id: '550e8400-e29b-41d4-a716-446655440003',
        quantity: -10,
        uom: 'kg',
        batch_number: 'B-2025-001-BP-GERM',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-03-15',
      }
      const result = registerByProductSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.issues[0].message).toBe('Quantity cannot be negative')
      }
    })

    it('requires main_output_lp_id as UUID', () => {
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        main_output_lp_id: 'not-a-uuid',
        by_product_id: '550e8400-e29b-41d4-a716-446655440003',
        quantity: 45,
        uom: 'kg',
        batch_number: 'B-2025-001-BP-GERM',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-03-15',
      }
      const result = registerByProductSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('requires by_product_id as UUID', () => {
      const input = {
        wo_id: '550e8400-e29b-41d4-a716-446655440000',
        main_output_lp_id: '550e8400-e29b-41d4-a716-446655440002',
        by_product_id: 'invalid',
        quantity: 45,
        uom: 'kg',
        batch_number: 'B-2025-001-BP-GERM',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        expiry_date: '2025-03-15',
      }
      const result = registerByProductSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

/**
 * Test Coverage Summary for Story 04.7a - Validation Schemas
 * ==========================================================
 *
 * registerOutputSchema: 19 tests
 *   - wo_id (2)
 *   - quantity (3)
 *   - uom (2)
 *   - batch_number (2)
 *   - qa_status (5)
 *   - location_id (1)
 *   - expiry_date (2)
 *   - notes (2)
 *
 * createOutputSchemaWithSettings: 3 tests
 *   - QA required
 *   - QA optional
 *   - QA provided
 *
 * registerByProductSchema: 5 tests
 *   - Valid input
 *   - Zero quantity
 *   - Negative quantity
 *   - main_output_lp_id
 *   - by_product_id
 *
 * Total: 27 tests
 * Status: ALL PASS (GREEN phase)
 */
