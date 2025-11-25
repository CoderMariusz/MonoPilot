/**
 * Validation Schema Tests: Product Schemas
 * Batch 2A - Stories: 2.1, 2.4, 2.5
 *
 * Tests Zod validation schemas for products, allergens, and product types
 */

import { describe, it, expect } from 'vitest'
import {
  productCreateSchema,
  productUpdateSchema,
  allergenAssignmentSchema,
  productTypeCreateSchema,
  productTypeUpdateSchema,
  productListQuerySchema,
} from '@/lib/validation/product-schemas'

describe('Product Validation Schemas (Batch 2A)', () => {
  describe('productCreateSchema (Story 2.1)', () => {
    it('should accept valid product data', () => {
      const validProduct = {
        code: 'RM-FLOUR-01',
        name: 'Wheat Flour Premium',
        type: 'RM',
        uom: 'kg',
        description: 'High-quality wheat flour',
        status: 'active',
      }

      const result = productCreateSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })

    it('should accept product with all optional fields', () => {
      const fullProduct = {
        code: 'FG-BREAD-01',
        name: 'White Bread',
        type: 'FG',
        uom: 'pcs',
        description: 'Fresh white bread',
        category: 'Bakery',
        shelf_life_days: 5,
        min_stock_qty: 100,
        max_stock_qty: 500,
        reorder_point: 150,
        cost_per_unit: 2.50,
        status: 'active',
      }

      const result = productCreateSchema.safeParse(fullProduct)
      expect(result.success).toBe(true)
    })

    it('should reject product with code < 2 chars', () => {
      const invalid = {
        code: 'X',
        name: 'Test',
        type: 'RM',
        uom: 'kg',
      }

      const result = productCreateSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('code')
      }
    })

    it('should reject product with code > 50 chars', () => {
      const invalid = {
        code: 'A'.repeat(51),
        name: 'Test',
        type: 'RM',
        uom: 'kg',
      }

      const result = productCreateSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject product with invalid code characters', () => {
      const invalidCodes = ['test@code', 'test code', 'test!code', 'test#code']

      invalidCodes.forEach((code) => {
        const result = productCreateSchema.safeParse({
          code,
          name: 'Test',
          type: 'RM',
          uom: 'kg',
        })
        expect(result.success).toBe(false)
      })
    })

    it('should accept valid code formats', () => {
      const validCodes = ['RM-FLOUR', 'FG_BREAD_01', 'PKG-BOX-100', 'WIP-123']

      validCodes.forEach((code) => {
        const result = productCreateSchema.safeParse({
          code,
          name: 'Test',
          type: 'RM',
          uom: 'kg',
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid product type', () => {
      const invalid = {
        code: 'TEST-01',
        name: 'Test',
        type: 'INVALID',
        uom: 'kg',
      }

      const result = productCreateSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should accept all valid product types', () => {
      const validTypes = ['RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM']

      validTypes.forEach((type) => {
        const result = productCreateSchema.safeParse({
          code: 'TEST-01',
          name: 'Test',
          type,
          uom: 'kg',
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject missing required fields', () => {
      const noCode = { name: 'Test', type: 'RM', uom: 'kg' }
      const noName = { code: 'TEST', type: 'RM', uom: 'kg' }
      const noType = { code: 'TEST', name: 'Test', uom: 'kg' }
      const noUom = { code: 'TEST', name: 'Test', type: 'RM' }

      expect(productCreateSchema.safeParse(noCode).success).toBe(false)
      expect(productCreateSchema.safeParse(noName).success).toBe(false)
      expect(productCreateSchema.safeParse(noType).success).toBe(false)
      expect(productCreateSchema.safeParse(noUom).success).toBe(false)
    })

    it('should reject max_stock_qty <= min_stock_qty', () => {
      const invalid = {
        code: 'TEST-01',
        name: 'Test',
        type: 'RM',
        uom: 'kg',
        min_stock_qty: 100,
        max_stock_qty: 50, // Invalid: max < min
      }

      const result = productCreateSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should accept max_stock_qty > min_stock_qty', () => {
      const valid = {
        code: 'TEST-01',
        name: 'Test',
        type: 'RM',
        uom: 'kg',
        min_stock_qty: 50,
        max_stock_qty: 100,
      }

      const result = productCreateSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should default status to active', () => {
      const product = {
        code: 'TEST-01',
        name: 'Test',
        type: 'RM',
        uom: 'kg',
      }

      const result = productCreateSchema.safeParse(product)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
      }
    })

    it('should accept valid status values', () => {
      const statuses = ['active', 'inactive', 'obsolete']

      statuses.forEach((status) => {
        const result = productCreateSchema.safeParse({
          code: 'TEST-01',
          name: 'Test',
          type: 'RM',
          uom: 'kg',
          status,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('productUpdateSchema (Story 2.1)', () => {
    it('should accept partial update', () => {
      const result = productUpdateSchema.safeParse({ name: 'Updated Name' })
      expect(result.success).toBe(true)
    })

    it('should not allow code update', () => {
      // productUpdateSchema omits code field
      const result = productUpdateSchema.safeParse({
        code: 'NEW-CODE', // This should be stripped/ignored
        name: 'Updated',
      })

      // Should parse but code should not be in result
      expect(result.success).toBe(true)
      if (result.success) {
        expect('code' in result.data).toBe(false)
      }
    })

    it('should accept all updatable fields', () => {
      const result = productUpdateSchema.safeParse({
        name: 'Updated Name',
        type: 'FG',
        description: 'Updated description',
        status: 'inactive',
        uom: 'L',
        shelf_life_days: 10,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('allergenAssignmentSchema (Story 2.4)', () => {
    it('should accept valid allergen arrays', () => {
      const result = allergenAssignmentSchema.safeParse({
        contains: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        may_contain: ['550e8400-e29b-41d4-a716-446655440003'],
      })

      expect(result.success).toBe(true)
    })

    it('should default to empty arrays', () => {
      const result = allergenAssignmentSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.contains).toEqual([])
        expect(result.data.may_contain).toEqual([])
      }
    })

    it('should accept partial allergen data', () => {
      const onlyContains = allergenAssignmentSchema.safeParse({
        contains: ['550e8400-e29b-41d4-a716-446655440000'],
      })
      expect(onlyContains.success).toBe(true)

      const onlyMayContain = allergenAssignmentSchema.safeParse({
        may_contain: ['550e8400-e29b-41d4-a716-446655440001'],
      })
      expect(onlyMayContain.success).toBe(true)
    })
  })

  describe('productTypeCreateSchema (Story 2.5)', () => {
    it('should accept valid custom type', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'SEMI',
        name: 'Semi-Finished',
      })
      expect(result.success).toBe(true)
    })

    it('should reject lowercase code', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'semi',
        name: 'Semi-Finished',
      })
      expect(result.success).toBe(false)
    })

    it('should reject mixed case code', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'Semi',
        name: 'Semi-Finished',
      })
      expect(result.success).toBe(false)
    })

    it('should reject code with numbers', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'TYPE1',
        name: 'Type One',
      })
      expect(result.success).toBe(false)
    })

    it('should reject reserved default codes', () => {
      const reservedCodes = ['RM', 'WIP', 'FG', 'PKG', 'BP']

      reservedCodes.forEach((code) => {
        const result = productTypeCreateSchema.safeParse({
          code,
          name: 'Reserved Type',
        })
        expect(result.success).toBe(false)
      })
    })

    it('should reject code < 2 chars', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'X',
        name: 'Too Short',
      })
      expect(result.success).toBe(false)
    })

    it('should reject code > 10 chars', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'VERYLONGCODE',
        name: 'Too Long',
      })
      expect(result.success).toBe(false)
    })

    it('should reject name > 100 chars', () => {
      const result = productTypeCreateSchema.safeParse({
        code: 'TEST',
        name: 'A'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('productTypeUpdateSchema (Story 2.5)', () => {
    it('should accept name update', () => {
      const result = productTypeUpdateSchema.safeParse({
        name: 'Updated Name',
      })
      expect(result.success).toBe(true)
    })

    it('should accept is_active update', () => {
      const result = productTypeUpdateSchema.safeParse({
        is_active: false,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty update', () => {
      const result = productTypeUpdateSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('productListQuerySchema', () => {
    it('should accept valid query params', () => {
      const result = productListQuerySchema.safeParse({
        search: 'flour',
        type: 'RM',
        status: 'active',
        page: '2',
        limit: '25',
        sort: 'name',
        order: 'desc',
      })
      expect(result.success).toBe(true)
    })

    it('should coerce string numbers', () => {
      const result = productListQuerySchema.safeParse({
        page: '3',
        limit: '50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should apply defaults', () => {
      const result = productListQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(50)
        expect(result.data.sort).toBe('code')
        expect(result.data.order).toBe('asc')
      }
    })

    it('should accept type as array', () => {
      const result = productListQuerySchema.safeParse({
        type: ['RM', 'WIP'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject limit > 100', () => {
      const result = productListQuerySchema.safeParse({
        limit: '150',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid order value', () => {
      const result = productListQuerySchema.safeParse({
        order: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * productCreateSchema (14 tests):
 *   - Valid product data
 *   - All optional fields
 *   - Code length validation (min/max)
 *   - Code character validation
 *   - Valid code formats
 *   - Invalid product type
 *   - All valid product types
 *   - Missing required fields
 *   - max_stock_qty validation
 *   - Default status value
 *   - Valid status values
 *
 * productUpdateSchema (3 tests):
 *   - Partial update
 *   - Code update blocked
 *   - All updatable fields
 *
 * allergenAssignmentSchema (3 tests):
 *   - Valid allergen arrays
 *   - Default empty arrays
 *   - Partial data
 *
 * productTypeCreateSchema (8 tests):
 *   - Valid custom type
 *   - Lowercase rejection
 *   - Mixed case rejection
 *   - Numbers rejection
 *   - Reserved codes rejection
 *   - Code length validation
 *   - Name length validation
 *
 * productTypeUpdateSchema (3 tests):
 *   - Name update
 *   - is_active update
 *   - Empty update rejection
 *
 * productListQuerySchema (6 tests):
 *   - Valid query params
 *   - String coercion
 *   - Default values
 *   - Array type support
 *   - Limit max validation
 *   - Invalid order rejection
 *
 * Total: 37 tests
 */
