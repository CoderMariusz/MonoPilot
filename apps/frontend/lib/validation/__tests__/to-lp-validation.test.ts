/**
 * Validation Schema Tests: TO LP Assignment Schemas (Story 03.9b)
 * Purpose: Test Zod validation for LP assignment to Transfer Order lines
 * Phase: RED - Tests will fail until service implementation
 *
 * Tests AssignLPsRequestSchema, AvailableLPsQuerySchema validation including:
 * - LPAssignmentSchema: lp_id (UUID), quantity (positive, max 99999.9999)
 * - AssignLPsRequestSchema: lps array (min 1, max 100)
 * - AvailableLPsQuerySchema: lot_number, expiry_from, expiry_to, search
 * - Date format validation (YYYY-MM-DD)
 * - Field length limits
 *
 * Coverage Target: 90%
 * Test Count: 25+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-03: Assign single LP validation
 * - AC-04: Assign multiple LPs validation
 * - AC-05: Quantity validation
 * - AC-06: LP not in source warehouse (schema level UUID validation)
 * - AC-08: Insufficient LP quantity (schema level bounds)
 */

import { describe, it, expect } from 'vitest'
import {
  LPAssignmentSchema,
  AssignLPsRequestSchema,
  AvailableLPsQuerySchema,
  RemoveLPRequestSchema,
  type LPAssignmentInput,
  type AssignLPsRequestInput,
  type AvailableLPsQueryInput,
} from '@/lib/validation/to-lp-validation'

describe('TO LP Validation Schemas (Story 03.9b)', () => {
  describe('LPAssignmentSchema - Single LP Assignment', () => {
    it('should accept valid LP assignment with UUID and positive quantity', () => {
      const validAssignment: LPAssignmentInput = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
      }

      const result = LPAssignmentSchema.safeParse(validAssignment)
      expect(result.success).toBe(true)
    })

    it('should accept decimal quantities', () => {
      const validAssignment: LPAssignmentInput = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100.5,
      }

      const result = LPAssignmentSchema.safeParse(validAssignment)
      expect(result.success).toBe(true)
    })

    it('should accept quantity at maximum boundary (99999.9999)', () => {
      const validAssignment: LPAssignmentInput = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 99999.9999,
      }

      const result = LPAssignmentSchema.safeParse(validAssignment)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for lp_id', () => {
      const invalid = {
        lp_id: 'not-a-valid-uuid',
        quantity: 100,
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const lpIdError = result.error.errors.find((e) => e.path.includes('lp_id'))
        expect(lpIdError).toBeDefined()
        expect(lpIdError?.message).toBe('Invalid LP ID')
      }
    })

    it('should reject empty string for lp_id', () => {
      const invalid = {
        lp_id: '',
        quantity: 100,
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject missing lp_id', () => {
      const invalid = {
        quantity: 100,
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject zero quantity', () => {
      const invalid = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 0,
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const qtyError = result.error.errors.find((e) => e.path.includes('quantity'))
        expect(qtyError).toBeDefined()
        expect(qtyError?.message).toBe('Quantity must be greater than 0')
      }
    })

    it('should reject negative quantity', () => {
      const invalid = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: -5,
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const qtyError = result.error.errors.find((e) => e.path.includes('quantity'))
        expect(qtyError).toBeDefined()
        expect(qtyError?.message).toBe('Quantity must be greater than 0')
      }
    })

    it('should reject quantity exceeding maximum (> 99999.9999)', () => {
      const invalid = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100000,
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const qtyError = result.error.errors.find((e) => e.path.includes('quantity'))
        expect(qtyError).toBeDefined()
        expect(qtyError?.message).toBe('Quantity too large')
      }
    })

    it('should reject missing quantity', () => {
      const invalid = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric quantity', () => {
      const invalid = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 'one hundred',
      }

      const result = LPAssignmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('AssignLPsRequestSchema - Bulk LP Assignment', () => {
    it('should accept valid request with single LP', () => {
      const validRequest: AssignLPsRequestInput = {
        lps: [
          {
            lp_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 100,
          },
        ],
      }

      const result = AssignLPsRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should accept valid request with multiple LPs', () => {
      const validRequest: AssignLPsRequestInput = {
        lps: [
          {
            lp_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 50,
          },
          {
            lp_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 30,
          },
          {
            lp_id: '550e8400-e29b-41d4-a716-446655440003',
            quantity: 20,
          },
        ],
      }

      const result = AssignLPsRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.lps).toHaveLength(3)
      }
    })

    it('should accept request with exactly 100 LPs (max boundary)', () => {
      const lps = Array.from({ length: 100 }, (_, i) => ({
        lp_id: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`,
        quantity: 1,
      }))

      // Fix UUIDs to be valid
      const validLPs = lps.map((lp, i) => ({
        lp_id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
        quantity: 1,
      }))

      const validRequest = { lps: validLPs }

      const result = AssignLPsRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject empty lps array', () => {
      const invalid = {
        lps: [],
      }

      const result = AssignLPsRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const lpsError = result.error.errors.find((e) => e.path.includes('lps'))
        expect(lpsError).toBeDefined()
        expect(lpsError?.message).toBe('At least one License Plate must be assigned')
      }
    })

    it('should reject more than 100 LPs', () => {
      const lps = Array.from({ length: 101 }, (_, i) => ({
        lp_id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
        quantity: 1,
      }))

      const invalid = { lps }

      const result = AssignLPsRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const lpsError = result.error.errors.find((e) => e.path.includes('lps'))
        expect(lpsError).toBeDefined()
        expect(lpsError?.message).toBe('Cannot assign more than 100 License Plates at once')
      }
    })

    it('should reject request with missing lps field', () => {
      const invalid = {}

      const result = AssignLPsRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject request with invalid LP in array', () => {
      const invalid = {
        lps: [
          {
            lp_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 50,
          },
          {
            lp_id: 'invalid-uuid',
            quantity: 30,
          },
        ],
      }

      const result = AssignLPsRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject request with zero quantity in array', () => {
      const invalid = {
        lps: [
          {
            lp_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 0,
          },
        ],
      }

      const result = AssignLPsRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject null as lps value', () => {
      const invalid = {
        lps: null,
      }

      const result = AssignLPsRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('AvailableLPsQuerySchema - Query Parameters', () => {
    it('should accept empty query (all optional)', () => {
      const validQuery: AvailableLPsQueryInput = {}

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept valid lot_number filter', () => {
      const validQuery: AvailableLPsQueryInput = {
        lot_number: 'B-4501',
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept valid expiry date range', () => {
      const validQuery: AvailableLPsQueryInput = {
        expiry_from: '2025-01-01',
        expiry_to: '2025-12-31',
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept valid search term', () => {
      const validQuery: AvailableLPsQueryInput = {
        search: 'LP-001',
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept all filters combined', () => {
      const validQuery: AvailableLPsQueryInput = {
        lot_number: 'B-450*',
        expiry_from: '2025-01-01',
        expiry_to: '2025-12-31',
        search: 'LP-001',
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should reject lot_number exceeding 50 characters', () => {
      const invalid = {
        lot_number: 'A'.repeat(51),
      }

      const result = AvailableLPsQuerySchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const lotError = result.error.errors.find((e) => e.path.includes('lot_number'))
        expect(lotError).toBeDefined()
        expect(lotError?.message).toBe('Lot number too long')
      }
    })

    it('should reject invalid expiry_from date format', () => {
      const invalid = {
        expiry_from: '01-01-2025', // Wrong format
      }

      const result = AvailableLPsQuerySchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const dateError = result.error.errors.find((e) => e.path.includes('expiry_from'))
        expect(dateError).toBeDefined()
        expect(dateError?.message).toBe('Invalid date format (YYYY-MM-DD)')
      }
    })

    it('should reject invalid expiry_to date format', () => {
      const invalid = {
        expiry_to: '2025/12/31', // Wrong separator
      }

      const result = AvailableLPsQuerySchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const dateError = result.error.errors.find((e) => e.path.includes('expiry_to'))
        expect(dateError).toBeDefined()
        expect(dateError?.message).toBe('Invalid date format (YYYY-MM-DD)')
      }
    })

    it('should reject text as date format', () => {
      const invalid = {
        expiry_from: 'invalid-date',
      }

      const result = AvailableLPsQuerySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject search term exceeding 100 characters', () => {
      const invalid = {
        search: 'A'.repeat(101),
      }

      const result = AvailableLPsQuerySchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        const searchError = result.error.errors.find((e) => e.path.includes('search'))
        expect(searchError).toBeDefined()
        expect(searchError?.message).toBe('Search term too long')
      }
    })

    it('should accept search at exactly 100 characters', () => {
      const validQuery: AvailableLPsQueryInput = {
        search: 'A'.repeat(100),
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept lot_number at exactly 50 characters', () => {
      const validQuery: AvailableLPsQueryInput = {
        lot_number: 'A'.repeat(50),
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept expiry_from only (partial date range)', () => {
      const validQuery: AvailableLPsQueryInput = {
        expiry_from: '2025-01-01',
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should accept expiry_to only (partial date range)', () => {
      const validQuery: AvailableLPsQueryInput = {
        expiry_to: '2025-12-31',
      }

      const result = AvailableLPsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })
  })

  describe('RemoveLPRequestSchema - Remove LP Assignment', () => {
    it('should accept valid UUID', () => {
      const validRequest = {
        lp_id: '550e8400-e29b-41d4-a716-446655440001',
      }

      const result = RemoveLPRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalid = {
        lp_id: 'not-a-uuid',
      }

      const result = RemoveLPRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject missing lp_id', () => {
      const invalid = {}

      const result = RemoveLPRequestSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })
})
