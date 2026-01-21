/**
 * Validation Schema Tests: By-Product Schemas
 * Story: 04.7c - By-Product Registration
 * Phase: RED - Tests should FAIL until schemas implemented
 *
 * Tests Zod validation schemas for by-product registration:
 * - registerByProductSchema: Request to register a by-product
 * - byProductStatusSchema: By-product status for display
 * - byProductsListSchema: Array of by-product statuses
 *
 * Related PRD: docs/1-BASELINE/product/modules/PRODUCTION.md (FR-PROD-013)
 */

import { describe, it, expect } from 'vitest'

// Import schemas to be created
import {
  registerByProductSchema,
  byProductStatusSchema,
  byProductsListSchema,
} from '@/lib/validation/by-product-schemas'

describe('By-Product Validation Schemas (Story 04.7c)', () => {
  // ============================================================================
  // registerByProductSchema Tests
  // ============================================================================
  describe('registerByProductSchema', () => {
    const validRequest = {
      wo_id: '550e8400-e29b-41d4-a716-446655440000',
      main_output_lp_id: '550e8400-e29b-41d4-a716-446655440001',
      by_product_id: '550e8400-e29b-41d4-a716-446655440002',
      by_product_material_id: '550e8400-e29b-41d4-a716-446655440003',
      quantity: 50,
      uom: 'kg',
      location_id: '550e8400-e29b-41d4-a716-446655440004',
    }

    it('should reject empty object', () => {
      const result = registerByProductSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject missing wo_id', () => {
      const { wo_id, ...rest } = validRequest
      const result = registerByProductSchema.safeParse(rest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('wo_id'))).toBe(true)
      }
    })

    it('should reject invalid wo_id (not UUID)', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        wo_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing by_product_id', () => {
      const { by_product_id, ...rest } = validRequest
      const result = registerByProductSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should reject missing by_product_material_id', () => {
      const { by_product_material_id, ...rest } = validRequest
      const result = registerByProductSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should reject missing quantity', () => {
      const { quantity, ...rest } = validRequest
      const result = registerByProductSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    /**
     * AC: Zero qty warning with confirmation
     * Schema should accept quantity = 0 (handled by UI warning)
     */
    it('should accept quantity = 0', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        quantity: 0,
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative quantity', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        quantity: -10,
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing uom', () => {
      const { uom, ...rest } = validRequest
      const result = registerByProductSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should reject empty uom', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        uom: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing location_id', () => {
      const { location_id, ...rest } = validRequest
      const result = registerByProductSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should accept valid complete request', () => {
      const result = registerByProductSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    /**
     * AC: Batch auto-generated with format {main_batch}-BP-{code}
     */
    it('should accept optional batch_number', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        batch_number: 'B-2025-0156-BP-BRAN',
      })
      expect(result.success).toBe(true)
    })

    it('should reject batch_number over 50 characters', () => {
      const longBatch = 'a'.repeat(51)
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        batch_number: longBatch,
      })
      expect(result.success).toBe(false)
    })

    it('should accept batch_number at exactly 50 characters', () => {
      const maxBatch = 'a'.repeat(50)
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        batch_number: maxBatch,
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional qa_status approved', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        qa_status: 'approved',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional qa_status pending', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        qa_status: 'pending',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional qa_status rejected', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        qa_status: 'rejected',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid qa_status', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        qa_status: 'invalid_status',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional expiry_date', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        expiry_date: '2025-12-31',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional notes', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        notes: 'Test notes for by-product',
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes over 500 characters', () => {
      const longNotes = 'a'.repeat(501)
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        notes: longNotes,
      })
      expect(result.success).toBe(false)
    })

    it('should accept decimal quantity', () => {
      const result = registerByProductSchema.safeParse({
        ...validRequest,
        quantity: 45.5,
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // byProductStatusSchema Tests
  // ============================================================================
  describe('byProductStatusSchema', () => {
    const validStatus = {
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      product_name: 'Wheat Bran',
      product_code: 'SKU-BP-BRAN',
      material_id: '550e8400-e29b-41d4-a716-446655440001',
      yield_percent: 5,
      expected_qty: 50,
      actual_qty: 45,
      uom: 'kg',
      lp_count: 2,
      status: 'registered' as const,
      last_registered_at: '2025-01-21T10:00:00Z',
    }

    it('should accept valid status object', () => {
      const result = byProductStatusSchema.safeParse(validStatus)
      expect(result.success).toBe(true)
    })

    it('should reject missing product_id', () => {
      const { product_id, ...rest } = validStatus
      const result = byProductStatusSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should reject missing product_name', () => {
      const { product_name, ...rest } = validStatus
      const result = byProductStatusSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should reject missing product_code', () => {
      const { product_code, ...rest } = validStatus
      const result = byProductStatusSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should accept status = registered', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        status: 'registered',
      })
      expect(result.success).toBe(true)
    })

    it('should accept status = not_registered', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        status: 'not_registered',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid status value', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should accept null last_registered_at', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        last_registered_at: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept zero expected_qty', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        expected_qty: 0,
      })
      expect(result.success).toBe(true)
    })

    it('should accept zero actual_qty', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        actual_qty: 0,
      })
      expect(result.success).toBe(true)
    })

    it('should accept zero lp_count', () => {
      const result = byProductStatusSchema.safeParse({
        ...validStatus,
        lp_count: 0,
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // byProductsListSchema Tests
  // ============================================================================
  describe('byProductsListSchema', () => {
    const validStatus = {
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      product_name: 'Wheat Bran',
      product_code: 'SKU-BP-BRAN',
      material_id: '550e8400-e29b-41d4-a716-446655440001',
      yield_percent: 5,
      expected_qty: 50,
      actual_qty: 45,
      uom: 'kg',
      lp_count: 2,
      status: 'registered' as const,
      last_registered_at: '2025-01-21T10:00:00Z',
    }

    it('should accept empty array', () => {
      const result = byProductsListSchema.safeParse([])
      expect(result.success).toBe(true)
    })

    it('should accept array with valid statuses', () => {
      const result = byProductsListSchema.safeParse([validStatus, validStatus])
      expect(result.success).toBe(true)
    })

    it('should reject array with invalid status', () => {
      const result = byProductsListSchema.safeParse([validStatus, { invalid: true }])
      expect(result.success).toBe(false)
    })

    it('should reject non-array', () => {
      const result = byProductsListSchema.safeParse(validStatus)
      expect(result.success).toBe(false)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * registerByProductSchema (24 tests):
 *   - Required field validation (wo_id, by_product_id, etc.)
 *   - UUID validation
 *   - Quantity validation (min 0, negative rejection)
 *   - UoM validation
 *   - Optional fields (batch_number, qa_status, expiry_date, notes)
 *   - Max length validation
 *
 * byProductStatusSchema (11 tests):
 *   - Required fields
 *   - Status enum validation
 *   - Nullable fields
 *   - Zero values
 *
 * byProductsListSchema (4 tests):
 *   - Empty array
 *   - Valid array
 *   - Invalid items
 *   - Type validation
 *
 * Total: 39 tests
 */
