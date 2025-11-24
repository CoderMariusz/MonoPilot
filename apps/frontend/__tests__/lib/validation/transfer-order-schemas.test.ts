/**
 * Transfer Order Validation Schemas Unit Tests
 * Story 3.6 & 3.7: Transfer Orders and TO Lines
 * Test validation schemas for create/update operations
 */

import { describe, it, expect } from 'vitest'
import {
  createTransferOrderSchema,
  updateTransferOrderSchema,
  changeToStatusSchema,
  createToLineSchema,
  updateToLineSchema,
} from '@/lib/validation/transfer-order-schemas'

describe('Transfer Order Schemas', () => {
  describe('createTransferOrderSchema', () => {
    it('should validate valid TO creation data', () => {
      const validData = {
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        planned_ship_date: new Date('2025-01-15'),
        planned_receive_date: new Date('2025-01-16'),
        notes: 'Test transfer order',
      }

      const result = createTransferOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject when from_warehouse = to_warehouse', () => {
      const invalidData = {
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174000', // Same as from
        planned_ship_date: new Date('2025-01-15'),
        planned_receive_date: new Date('2025-01-16'),
      }

      const result = createTransferOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('different')
      }
    })

    it('should reject when receive_date < ship_date', () => {
      const invalidData = {
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        planned_ship_date: new Date('2025-01-16'),
        planned_receive_date: new Date('2025-01-15'), // Before ship date
      }

      const result = createTransferOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('on or after')
      }
    })

    it('should accept when receive_date = ship_date', () => {
      const validData = {
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        planned_ship_date: new Date('2025-01-15'),
        planned_receive_date: new Date('2025-01-15'), // Same day
      }

      const result = createTransferOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID formats', () => {
      const invalidData = {
        from_warehouse_id: 'not-a-uuid',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        planned_ship_date: new Date('2025-01-15'),
        planned_receive_date: new Date('2025-01-16'),
      }

      const result = createTransferOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should trim notes longer than 1000 characters', () => {
      const longNotes = 'a'.repeat(1001)
      const invalidData = {
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        planned_ship_date: new Date('2025-01-15'),
        planned_receive_date: new Date('2025-01-16'),
        notes: longNotes,
      }

      const result = createTransferOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1000')
      }
    })
  })

  describe('updateTransferOrderSchema', () => {
    it('should validate partial TO updates', () => {
      const validData = {
        planned_ship_date: new Date('2025-01-20'),
        notes: 'Updated notes',
      }

      const result = updateTransferOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate all fields optional', () => {
      const emptyData = {}

      const result = updateTransferOrderSchema.safeParse(emptyData)
      expect(result.success).toBe(true)
    })
  })

  describe('changeToStatusSchema - AC-3.6.7', () => {
    it('should accept valid status: planned', () => {
      const result = changeToStatusSchema.safeParse({ status: 'planned' })
      expect(result.success).toBe(true)
    })

    it('should accept valid status: cancelled', () => {
      const result = changeToStatusSchema.safeParse({ status: 'cancelled' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const result = changeToStatusSchema.safeParse({ status: 'invalid_status' })
      expect(result.success).toBe(false)
    })

    it('should reject draft status (not allowed in status change)', () => {
      const result = changeToStatusSchema.safeParse({ status: 'draft' })
      expect(result.success).toBe(false)
    })
  })

  describe('createToLineSchema - Story 3.7', () => {
    it('should validate valid TO line creation', () => {
      const validData = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 10.5,
        notes: 'Test line',
      }

      const result = createToLineSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject zero quantity', () => {
      const invalidData = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0,
      }

      const result = createToLineSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('greater than 0')
      }
    })

    it('should reject negative quantity', () => {
      const invalidData = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: -5,
      }

      const result = createToLineSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow notes to be optional', () => {
      const validData = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 10,
      }

      const result = createToLineSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject notes longer than 500 characters', () => {
      const longNotes = 'a'.repeat(501)
      const invalidData = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 10,
        notes: longNotes,
      }

      const result = createToLineSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500')
      }
    })
  })

  describe('updateToLineSchema', () => {
    it('should validate partial TO line updates', () => {
      const validData = {
        quantity: 15,
      }

      const result = updateToLineSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow all fields to be optional', () => {
      const emptyData = {}

      const result = updateToLineSchema.safeParse(emptyData)
      expect(result.success).toBe(true)
    })

    it('should reject negative quantity in update', () => {
      const invalidData = {
        quantity: -10,
      }

      const result = updateToLineSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
