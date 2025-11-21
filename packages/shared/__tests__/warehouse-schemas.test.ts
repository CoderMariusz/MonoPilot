import { describe, it, expect } from 'vitest'
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseFiltersSchema,
} from '../schemas'

/**
 * Unit Tests: Warehouse Validation Schemas
 * Story: 1.5 Warehouse Configuration
 * Task 10: Integration & Testing
 *
 * Tests all Zod validation schemas for warehouse configuration
 */

describe('createWarehouseSchema', () => {
  describe('Valid Inputs', () => {
    it('should accept valid warehouse data with all required fields', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'WH-01',
        name: 'Main Warehouse',
        is_active: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('WH-01')
        expect(result.data.name).toBe('Main Warehouse')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('should accept warehouse with address', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'WH-02',
        name: 'Secondary Warehouse',
        address: '123 Main St, City, Country',
        is_active: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.address).toBe('123 Main St, City, Country')
        expect(result.data.is_active).toBe(false)
      }
    })

    it('should default is_active to true when not provided', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'WH-03',
        name: 'Test Warehouse',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('should accept code with hyphens and numbers', () => {
      const validCodes = ['WH-01', 'WAREHOUSE-123', 'WH-MAIN', 'W1', 'CENTRAL-01']

      validCodes.forEach((code) => {
        const result = createWarehouseSchema.safeParse({
          code,
          name: 'Test Warehouse',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Invalid Inputs - Code Validation (AC-004.1)', () => {
    it('should reject code shorter than 2 characters', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'W',
        name: 'Test Warehouse',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 2 characters')
      }
    })

    it('should reject code longer than 50 characters', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'A'.repeat(51),
        name: 'Test Warehouse',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at most 50 characters')
      }
    })

    it('should reject code with lowercase letters', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'wh-01',
        name: 'Test Warehouse',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uppercase')
      }
    })

    it('should reject code with special characters', () => {
      const invalidCodes = ['WH_01', 'WH@01', 'WH.01', 'WH 01', 'WH/01']

      invalidCodes.forEach((code) => {
        const result = createWarehouseSchema.safeParse({
          code,
          name: 'Test Warehouse',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('uppercase, numbers, and hyphens only')
        }
      })
    })
  })

  describe('Invalid Inputs - Name Validation (AC-004.1)', () => {
    it('should reject empty name', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'WH-01',
        name: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required')
      }
    })

    it('should reject name longer than 100 characters', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'WH-01',
        name: 'A'.repeat(101),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at most 100 characters')
      }
    })

    it('should reject missing name', () => {
      const result = createWarehouseSchema.safeParse({
        code: 'WH-01',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('name')
      }
    })
  })
})

describe('updateWarehouseSchema', () => {
  describe('Valid Inputs', () => {
    it('should accept partial update with only code', () => {
      const result = updateWarehouseSchema.safeParse({
        code: 'WH-UPDATED',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('WH-UPDATED')
      }
    })

    it('should accept partial update with only name', () => {
      const result = updateWarehouseSchema.safeParse({
        name: 'Updated Warehouse Name',
      })

      expect(result.success).toBe(true)
    })

    it('should accept update with default locations (AC-004.5)', () => {
      const result = updateWarehouseSchema.safeParse({
        name: 'Updated Warehouse',
        default_receiving_location_id: '123e4567-e89b-12d3-a456-426614174000',
        default_shipping_location_id: '123e4567-e89b-12d3-a456-426614174001',
        transit_location_id: '123e4567-e89b-12d3-a456-426614174002',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.default_receiving_location_id).toBeDefined()
        expect(result.data.default_shipping_location_id).toBeDefined()
        expect(result.data.transit_location_id).toBeDefined()
      }
    })

    it('should accept is_active toggle', () => {
      const result = updateWarehouseSchema.safeParse({
        is_active: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(false)
      }
    })

    it('should accept empty update object', () => {
      const result = updateWarehouseSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Inputs', () => {
    it('should reject invalid UUID for default_receiving_location_id', () => {
      const result = updateWarehouseSchema.safeParse({
        default_receiving_location_id: 'not-a-uuid',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uuid')
      }
    })

    it('should reject invalid code format during update', () => {
      const result = updateWarehouseSchema.safeParse({
        code: 'invalid code',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uppercase, numbers, and hyphens only')
      }
    })
  })
})

describe('warehouseFiltersSchema', () => {
  describe('Valid Inputs', () => {
    it('should accept is_active filter as true', () => {
      const result = warehouseFiltersSchema.safeParse({
        is_active: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('should accept is_active filter as false', () => {
      const result = warehouseFiltersSchema.safeParse({
        is_active: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(false)
      }
    })

    it('should accept search filter', () => {
      const result = warehouseFiltersSchema.safeParse({
        search: 'Main Warehouse',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('Main Warehouse')
      }
    })

    it('should accept both filters together', () => {
      const result = warehouseFiltersSchema.safeParse({
        is_active: true,
        search: 'WH-01',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
        expect(result.data.search).toBe('WH-01')
      }
    })

    it('should accept empty filters', () => {
      const result = warehouseFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})
