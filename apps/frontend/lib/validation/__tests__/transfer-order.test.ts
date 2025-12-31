/**
 * Validation Schema Tests: Transfer Order Schemas (Story 03.8)
 * Purpose: Test Zod validation for transfer order CRUD operations
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests createTransferOrderSchema, updateTransferOrderSchema, and line schemas validation including:
 * - Required fields (from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date)
 * - Warehouse difference validation (from_warehouse_id != to_warehouse_id)
 * - Date range validation (planned_receive_date >= planned_ship_date)
 * - Priority enum validation (low, normal, high, urgent)
 * - Line schema validation (product_id, quantity > 0)
 * - Notes field max length (1000 for TO, 500 for lines)
 * - Partial updates (updateTransferOrderSchema allows optional fields)
 *
 * Coverage Target: 95%
 * Test Count: 40+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-03: Warehouse validation (from != to)
 * - AC-04: Date validation (receive >= ship)
 * - AC-05: Line validation
 * - AC-08: Duplicate product prevention (handled at service level)
 */

import { describe, it, expect } from 'vitest'
import {
  createTransferOrderSchema,
  updateTransferOrderSchema,
  createTOLineSchema,
  updateTOLineSchema,
  type CreateTransferOrderInput,
  type UpdateTransferOrderInput,
  type CreateTOLineInput,
  type UpdateTOLineInput,
} from '@/lib/validation/transfer-order'

describe('Transfer Order Validation Schemas (Story 03.8)', () => {
  describe('createTransferOrderSchema - Required Fields', () => {
    it('should accept valid TO with all required fields', () => {
      const validTO: CreateTransferOrderInput = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
        priority: 'normal',
      }

      const result = createTransferOrderSchema.safeParse(validTO)
      expect(result.success).toBe(true)
    })

    it('should accept TO with optional priority field', () => {
      const validTO: CreateTransferOrderInput = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(validTO)
      expect(result.success).toBe(true)
    })

    it('should reject TO missing from_warehouse_id', () => {
      const invalid = {
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('from_warehouse_id'))).toBe(true)
      }
    })

    it('should reject TO missing to_warehouse_id', () => {
      const invalid = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('to_warehouse_id'))).toBe(true)
      }
    })

    it('should reject TO missing planned_ship_date', () => {
      const invalid = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('planned_ship_date'))).toBe(true)
      }
    })

    it('should reject TO missing planned_receive_date', () => {
      const invalid = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
      }

      const result = createTransferOrderSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('planned_receive_date'))).toBe(true)
      }
    })
  })

  describe('createTransferOrderSchema - Warehouse Validation (AC-03)', () => {
    it('should reject TO when from_warehouse_id equals to_warehouse_id', () => {
      const sameWarehouseTO = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(sameWarehouseTO)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('to_warehouse_id'))
        expect(error?.message).toContain('must be different')
      }
    })

    it('should accept TO with different warehouse IDs', () => {
      const validTO = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(validTO)
      expect(result.success).toBe(true)
    })
  })

  describe('createTransferOrderSchema - Date Range Validation (AC-04)', () => {
    it('should accept TO when planned_receive_date equals planned_ship_date', () => {
      const sameDay = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-20',
      }

      const result = createTransferOrderSchema.safeParse(sameDay)
      expect(result.success).toBe(true)
    })

    it('should accept TO when planned_receive_date is after planned_ship_date', () => {
      const validDates = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-25',
      }

      const result = createTransferOrderSchema.safeParse(validDates)
      expect(result.success).toBe(true)
    })

    it('should reject TO when planned_receive_date is before planned_ship_date', () => {
      const invalidDates = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-25',
        planned_receive_date: '2024-12-20',
      }

      const result = createTransferOrderSchema.safeParse(invalidDates)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('planned_receive_date'))
        expect(error?.message).toContain('must be on or after')
      }
    })

    it('should accept valid ISO date formats', () => {
      const validDates = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      }

      const result = createTransferOrderSchema.safeParse(validDates)
      expect(result.success).toBe(true)
    })
  })

  describe('createTransferOrderSchema - Priority Validation', () => {
    it('should accept all valid priority values', () => {
      const validPriorities = ['low', 'normal', 'high', 'urgent']

      validPriorities.forEach(priority => {
        const result = createTransferOrderSchema.safeParse({
          from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
          to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
          planned_ship_date: '2024-12-20',
          planned_receive_date: '2024-12-22',
          priority: priority as any,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should default priority to normal when not provided', () => {
      const result = createTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('normal')
      }
    })

    it('should reject invalid priority values', () => {
      const result = createTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
        priority: 'critical',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createTransferOrderSchema - Notes Field', () => {
    it('should accept notes up to 1000 characters', () => {
      const result = createTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
        notes: 'a'.repeat(1000),
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes exceeding 1000 characters', () => {
      const result = createTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
        notes: 'a'.repeat(1001),
      })
      expect(result.success).toBe(false)
    })

    it('should accept null/undefined notes', () => {
      const result = createTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
        notes: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createTransferOrderSchema - UUID Validation', () => {
    it('should reject invalid warehouse UUIDs', () => {
      const invalidUUIDs = [
        { from_warehouse_id: 'not-a-uuid', to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002' },
        { from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001', to_warehouse_id: 'invalid' },
        { from_warehouse_id: '12345', to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002' },
      ]

      invalidUUIDs.forEach(uuid => {
        const result = createTransferOrderSchema.safeParse({
          ...uuid,
          planned_ship_date: '2024-12-20',
          planned_receive_date: '2024-12-22',
        })
        expect(result.success).toBe(false)
      })
    })

    it('should accept valid UUIDs', () => {
      const result = createTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-22',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateTransferOrderSchema - Partial Updates', () => {
    it('should accept partial updates with only priority', () => {
      const result = updateTransferOrderSchema.safeParse({
        priority: 'high',
      })
      expect(result.success).toBe(true)
    })

    it('should accept partial updates with only notes', () => {
      const result = updateTransferOrderSchema.safeParse({
        notes: 'Updated notes',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty partial update', () => {
      const result = updateTransferOrderSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept partial updates with warehouse change and validate', () => {
      const result = updateTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
      })
      expect(result.success).toBe(true)
    })

    it('should reject partial update with same warehouses', () => {
      const result = updateTransferOrderSchema.safeParse({
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(false)
    })

    it('should reject partial update with invalid date range', () => {
      const result = updateTransferOrderSchema.safeParse({
        planned_ship_date: '2024-12-25',
        planned_receive_date: '2024-12-20',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createTOLineSchema - Required Fields', () => {
    it('should accept valid line with required fields', () => {
      const validLine: CreateTOLineInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
      }

      const result = createTOLineSchema.safeParse(validLine)
      expect(result.success).toBe(true)
    })

    it('should accept line with optional notes', () => {
      const validLine: CreateTOLineInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
        notes: 'Special handling required',
      }

      const result = createTOLineSchema.safeParse(validLine)
      expect(result.success).toBe(true)
    })

    it('should reject line missing product_id', () => {
      const invalid = {
        quantity: 100,
      }

      const result = createTOLineSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('product_id'))).toBe(true)
      }
    })

    it('should reject line missing quantity', () => {
      const invalid = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
      }

      const result = createTOLineSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('quantity'))).toBe(true)
      }
    })
  })

  describe('createTOLineSchema - Quantity Validation (AC-05)', () => {
    it('should accept positive quantities', () => {
      const validQuantities = [1, 100, 1000.5, 0.0001, 999999.9999]

      validQuantities.forEach(qty => {
        const result = createTOLineSchema.safeParse({
          product_id: '550e8400-e29b-41d4-a716-446655440001',
          quantity: qty,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject zero quantity', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 0,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('quantity'))).toBe(true)
      }
    })

    it('should reject negative quantities', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: -100,
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric quantities', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 'not-a-number',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createTOLineSchema - Notes Field', () => {
    it('should accept notes up to 500 characters', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
        notes: 'a'.repeat(500),
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes exceeding 500 characters', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
        notes: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('should accept null/undefined notes', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
        notes: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createTOLineSchema - UUID Validation', () => {
    it('should reject invalid product UUIDs', () => {
      const invalidUUIDs = ['not-a-uuid', '12345', '', 'invalid-format']

      invalidUUIDs.forEach(id => {
        const result = createTOLineSchema.safeParse({
          product_id: id,
          quantity: 100,
        })
        expect(result.success).toBe(false)
      })
    })

    it('should accept valid product UUIDs', () => {
      const result = createTOLineSchema.safeParse({
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 100,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateTOLineSchema - Partial Updates', () => {
    it('should accept update with only quantity', () => {
      const result = updateTOLineSchema.safeParse({
        quantity: 200,
      })
      expect(result.success).toBe(true)
    })

    it('should accept update with only notes', () => {
      const result = updateTOLineSchema.safeParse({
        notes: 'Updated line notes',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty update', () => {
      const result = updateTOLineSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept update with both quantity and notes', () => {
      const result = updateTOLineSchema.safeParse({
        quantity: 250,
        notes: 'Updated notes',
      })
      expect(result.success).toBe(true)
    })

    it('should reject update with zero quantity', () => {
      const result = updateTOLineSchema.safeParse({
        quantity: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject update with negative quantity', () => {
      const result = updateTOLineSchema.safeParse({
        quantity: -50,
      })
      expect(result.success).toBe(false)
    })

    it('should reject update with invalid notes length', () => {
      const result = updateTOLineSchema.safeParse({
        notes: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle TO with all optional fields populated', () => {
      const fullTO = {
        from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
        planned_ship_date: '2024-12-20',
        planned_receive_date: '2024-12-25',
        priority: 'urgent',
        notes: 'Critical shipment - handle with care',
      }

      const result = createTransferOrderSchema.safeParse(fullTO)
      expect(result.success).toBe(true)
    })

    it('should handle line with all optional fields populated', () => {
      const fullLine = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 999.9999,
        notes: 'Fragile - keep in cool storage',
      }

      const result = createTOLineSchema.safeParse(fullLine)
      expect(result.success).toBe(true)
    })

    it('should validate date formats strictly (no invalid dates)', () => {
      const invalidDates = ['2024-13-01', '2024-12-32', 'not-a-date', '2024/12/20']

      invalidDates.forEach(date => {
        const result = createTransferOrderSchema.safeParse({
          from_warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
          to_warehouse_id: '550e8400-e29b-41d4-a716-446655440002',
          planned_ship_date: date,
          planned_receive_date: '2024-12-25',
        })
        expect(result.success).toBe(false)
      })
    })
  })
})
