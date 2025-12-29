/**
 * BOM Alternative Validation - Unit Tests (Story 02.6)
 * Purpose: Test Zod schemas for BOM alternative request validation
 * Phase: GREEN - Tests implemented with actual assertions
 */

import { describe, it, expect } from 'vitest'
import { createAlternativeSchema, updateAlternativeSchema } from '../bom-alternative'

describe('createAlternativeSchema Validation (Story 02.6)', () => {
  const validUUID = '11111111-1111-1111-1111-111111111111'

  describe('alternative_product_id', () => {
    it('should reject when alternative_product_id is missing', () => {
      const result = createAlternativeSchema.safeParse({ quantity: 50, uom: 'kg' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('alternative_product_id'))).toBe(true)
      }
    })

    it('should reject when alternative_product_id is not a UUID', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: 'not-a-uuid',
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid UUID for alternative_product_id', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('quantity - required in create', () => {
    it('should reject when quantity is missing', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        uom: 'kg',
      })
      expect(result.success).toBe(false)
    })

    it('should reject quantity = 0', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 0,
        uom: 'kg',
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative quantity', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: -50,
        uom: 'kg',
      })
      expect(result.success).toBe(false)
    })

    it('should accept positive integer quantity', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })

    it('should accept decimal quantity with up to 6 places', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 48.123456,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })

    it('should reject quantity with > 6 decimal places', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 48.1234567,
        uom: 'kg',
      })
      expect(result.success).toBe(false)
    })

    it('should accept very small positive quantity', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 0.000001,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })

    it('should reject quantity as string (must be number)', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: '50',
        uom: 'kg',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('uom - required in create', () => {
    it('should reject when uom is missing', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty uom string', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: '',
      })
      expect(result.success).toBe(false)
    })

    it('should accept single character uom', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'g',
      })
      expect(result.success).toBe(true)
    })

    it('should accept multiple character uom (kg, lbs, L, etc.)', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('preference_order - optional in create', () => {
    it('should be optional', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })

    it('should reject preference_order = 1', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        preference_order: 1,
      })
      expect(result.success).toBe(false)
    })

    it('should reject preference_order = 0', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        preference_order: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative preference_order', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        preference_order: -1,
      })
      expect(result.success).toBe(false)
    })

    it('should accept preference_order = 2', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        preference_order: 2,
      })
      expect(result.success).toBe(true)
    })

    it('should accept any preference_order >= 2', () => {
      const values = [2, 3, 5, 10, 100]
      values.forEach(val => {
        const result = createAlternativeSchema.safeParse({
          alternative_product_id: validUUID,
          quantity: 50,
          uom: 'kg',
          preference_order: val,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject preference_order as decimal', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        preference_order: 2.5,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('notes - optional in create', () => {
    it('should be optional', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })

    it('should accept null notes', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept notes up to 500 characters', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'a'.repeat(500),
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes exceeding 500 characters', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('should accept empty notes string', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept notes with special characters', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: "Use when RM-001 unavailable; similar taste & texture!",
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Full createAlternativeSchema validation', () => {
    it('should validate minimal valid request', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      })
      expect(result.success).toBe(true)
    })

    it('should validate complete request', () => {
      const result = createAlternativeSchema.safeParse({
        alternative_product_id: validUUID,
        quantity: 48.5,
        uom: 'kg',
        preference_order: 2,
        notes: 'Alternative ingredient',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('updateAlternativeSchema Validation (Story 02.6)', () => {
  describe('All fields optional in update', () => {
    it('should accept empty update object', () => {
      const result = updateAlternativeSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('quantity - optional in update', () => {
    it('should be optional', () => {
      const result = updateAlternativeSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject quantity = 0 if provided', () => {
      const result = updateAlternativeSchema.safeParse({ quantity: 0 })
      expect(result.success).toBe(false)
    })

    it('should accept positive quantity', () => {
      const result = updateAlternativeSchema.safeParse({ quantity: 55 })
      expect(result.success).toBe(true)
    })

    it('should accept decimal quantity up to 6 places', () => {
      const result = updateAlternativeSchema.safeParse({ quantity: 55.555555 })
      expect(result.success).toBe(true)
    })

    it('should reject quantity with > 6 decimal places', () => {
      const result = updateAlternativeSchema.safeParse({ quantity: 55.5555555 })
      expect(result.success).toBe(false)
    })
  })

  describe('preference_order - optional in update', () => {
    it('should be optional', () => {
      const result = updateAlternativeSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject preference_order < 2 if provided', () => {
      const result = updateAlternativeSchema.safeParse({ preference_order: 1 })
      expect(result.success).toBe(false)
    })

    it('should accept preference_order >= 2', () => {
      const result = updateAlternativeSchema.safeParse({ preference_order: 3 })
      expect(result.success).toBe(true)
    })
  })

  describe('notes - optional in update', () => {
    it('should be optional', () => {
      const result = updateAlternativeSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept null notes', () => {
      const result = updateAlternativeSchema.safeParse({ notes: null })
      expect(result.success).toBe(true)
    })

    it('should accept notes up to 500 characters', () => {
      const result = updateAlternativeSchema.safeParse({ notes: 'a'.repeat(500) })
      expect(result.success).toBe(true)
    })

    it('should reject notes > 500 characters', () => {
      const result = updateAlternativeSchema.safeParse({ notes: 'a'.repeat(501) })
      expect(result.success).toBe(false)
    })
  })

  describe('Full updateAlternativeSchema validation', () => {
    it('should validate partial update (quantity only)', () => {
      const result = updateAlternativeSchema.safeParse({ quantity: 55 })
      expect(result.success).toBe(true)
    })

    it('should validate partial update (preference_order only)', () => {
      const result = updateAlternativeSchema.safeParse({ preference_order: 3 })
      expect(result.success).toBe(true)
    })

    it('should validate complete update', () => {
      const result = updateAlternativeSchema.safeParse({
        quantity: 55,
        uom: 'kg',
        preference_order: 3,
        notes: 'Updated notes',
      })
      expect(result.success).toBe(true)
    })
  })
})
