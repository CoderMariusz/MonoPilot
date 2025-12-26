/**
 * BOM Validation Schema - Unit Tests (Story 02.4)
 * Purpose: Test Zod schemas for BOM creation and update
 * Phase: GREEN - Tests should pass with implemented schemas
 *
 * Tests the BOM Zod schemas which validate:
 * - createBOMSchema: Product selection, date ranges, output quantities
 * - updateBOMSchema: Partial updates with date validation
 *
 * Coverage Target: 95%+
 * Test Count: 49 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-09, AC-13: Date range validation
 * - AC-12: Date ordering (effective_to > effective_from)
 * - AC-13: Output quantity validation (> 0)
 */

import { describe, it, expect } from 'vitest'
import { createBOMSchema, updateBOMSchema } from '@/lib/validation/bom-schema'
import type { CreateBOMInput, UpdateBOMInput } from '@/lib/validation/bom-schema'

describe('BOM Validation Schemas (Story 02.4)', () => {
  // ============================================
  // CREATE BOM SCHEMA TESTS
  // ============================================
  describe('createBOMSchema', () => {
    // Test Product ID validation
    describe('product_id field', () => {
      it('should require product_id', () => {
        const data = {
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('product_id')
        }
      })

      it('should accept valid UUID for product_id', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID format', () => {
        const data = {
          product_id: 'not-a-uuid',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid product')
        }
      })

      it('should reject null product_id', () => {
        const data = {
          product_id: null,
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // Test effective_from validation
    describe('effective_from field', () => {
      it('should require effective_from', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('effective_from')
        }
      })

      it('should accept valid ISO date for effective_from', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept date with time (ISO datetime)', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01T10:30:00Z',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid date format', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '01/01/2024',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid date')
        }
      })

      it('should reject invalid string', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: 'not-a-date',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // Test effective_to validation
    describe('effective_to field', () => {
      it('should allow null effective_to (ongoing)', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          effective_to: null,
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow valid ISO date for effective_to', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          effective_to: '2024-12-31',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow undefined effective_to (optional)', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
          // effective_to not provided
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid date format for effective_to', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          effective_to: '12/31/2024',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject effective_to before effective_from', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-12-31',
          effective_to: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            'Effective To must be after Effective From'
          )
        }
      })

      it('should allow effective_to equal to effective_from (single day)', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          effective_to: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow effective_to after effective_from', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          effective_to: '2024-12-31',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test status field
    describe('status field', () => {
      it('should default status to "draft" when not provided', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('draft')
        }
      })

      it('should accept "draft" status', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          status: 'draft',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept "active" status', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          status: 'active',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid status values', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          status: 'phased_out',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // Test output_qty validation
    describe('output_qty field', () => {
      it('should require output_qty', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('output_qty')
        }
      })

      it('should accept positive output_qty', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept decimal output_qty', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100.5,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject zero output_qty', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 0,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            'Output quantity must be greater than 0'
          )
        }
      })

      it('should reject negative output_qty', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: -50,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            'Output quantity must be greater than 0'
          )
        }
      })

      it('should reject excessively large quantity', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 9999999999,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('too large')
        }
      })

      it('should handle very small positive quantity', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 0.001,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test output_uom validation
    describe('output_uom field', () => {
      it('should require output_uom', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('output_uom')
        }
      })

      it('should accept valid UoM codes', () => {
        const validUoMs = ['kg', 'pcs', 'box', 'liter', 'meter', 'dozen']

        validUoMs.forEach((uom) => {
          const data = {
            product_id: '550e8400-e29b-41d4-a716-446655440000',
            effective_from: '2024-01-01',
            output_qty: 100,
            output_uom: uom,
          }

          const result = createBOMSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should reject empty output_uom', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: '',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required')
        }
      })

      it('should reject UoM longer than 20 characters', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'this_is_a_very_long_unit_of_measure',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('too long')
        }
      })
    })

    // Test notes field
    describe('notes field', () => {
      it('should allow notes to be optional', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow notes to be null', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
          notes: null,
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept notes text', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
          notes: 'Updated formula with new supplier',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject notes longer than 2000 characters', () => {
        const longNotes = 'a'.repeat(2001)
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
          notes: longNotes,
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('too long')
        }
      })

      it('should allow notes exactly 2000 characters', () => {
        const notes = 'a'.repeat(2000)
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
          notes,
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test complete valid BOM
    describe('Complete valid BOM', () => {
      it('should validate complete BOM with all fields', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          effective_to: '2024-12-31',
          status: 'active',
          output_qty: 100,
          output_uom: 'kg',
          notes: 'Complete BOM v1',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(expect.objectContaining(data))
        }
      })

      it('should validate minimal valid BOM', () => {
        const data = {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          effective_from: '2024-01-01',
          output_qty: 100,
          output_uom: 'kg',
        }

        const result = createBOMSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('draft') // Default value
        }
      })
    })
  })

  // ============================================
  // UPDATE BOM SCHEMA TESTS
  // ============================================
  describe('updateBOMSchema', () => {
    it('should allow empty update (all fields optional)', () => {
      const data = {}

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow updating only status', () => {
      const data = {
        status: 'active',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow updating only effective_to', () => {
      const data = {
        effective_to: '2024-12-31',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow updating dates', () => {
      const data = {
        effective_from: '2024-01-01',
        effective_to: '2024-12-31',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow changing status to phased_out', () => {
      const data = {
        status: 'phased_out',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow changing status to inactive', () => {
      const data = {
        status: 'inactive',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status on update', () => {
      const data = {
        status: 'unknown_status',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject effective_to before effective_from on update', () => {
      const data = {
        effective_from: '2024-12-31',
        effective_to: '2024-01-01',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Effective To must be after Effective From'
        )
      }
    })

    it('should allow updating multiple fields at once', () => {
      const data = {
        effective_from: '2024-01-01',
        effective_to: '2024-12-31',
        status: 'active',
        output_qty: 150,
        output_uom: 'pcs',
        notes: 'Updated notes',
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate output_qty constraints on update', () => {
      const data = {
        output_qty: 0,
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Output quantity must be greater than 0'
        )
      }
    })

    it('should validate notes length on update', () => {
      const data = {
        notes: 'a'.repeat(2001),
      }

      const result = updateBOMSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
