/**
 * Unit Tests: Purchase Order Validation Schemas
 * Story: 03.3 PO CRUD + Lines
 *
 * Tests Zod validation schemas:
 * - createPOSchema
 * - updatePOSchema
 * - createPOLineSchema
 * - updatePOLineSchema
 * - currencyEnum
 * - poStatusEnum
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPOSchema,
  updatePOSchema,
  createPOLineSchema,
  updatePOLineSchema,
  currencyEnum,
  poStatusEnum,
} from '../purchase-order'

describe('Purchase Order Validation Schemas', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const validPOData = {
    supplier_id: '550e8400-e29b-41d4-a716-446655440000',
    warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
    expected_delivery_date: tomorrow,
    currency: 'EUR',
    tax_code_id: '550e8400-e29b-41d4-a716-446655440002',
    payment_terms: 'Net 30',
    notes: 'Test PO',
  }

  const validLineData = {
    product_id: '550e8400-e29b-41d4-a716-446655440000',
    quantity: 100,
    unit_price: 2.50,
    uom: 'kg',
    discount_percent: 0,
  }

  describe('currencyEnum', () => {
    it('AC-02-2: Should accept valid currencies PLN', () => {
      // Act
      const result = currencyEnum.safeParse('PLN')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBe('PLN')
    })

    it('Should accept valid currencies EUR', () => {
      // Act
      const result = currencyEnum.safeParse('EUR')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBe('EUR')
    })

    it('Should accept valid currencies USD', () => {
      // Act
      const result = currencyEnum.safeParse('USD')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBe('USD')
    })

    it('Should accept valid currencies GBP', () => {
      // Act
      const result = currencyEnum.safeParse('GBP')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBe('GBP')
    })

    it('Should reject invalid currency', () => {
      // Act
      const result = currencyEnum.safeParse('INVALID')

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should reject empty string', () => {
      // Act
      const result = currencyEnum.safeParse('')

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('poStatusEnum', () => {
    it('Should accept valid status draft', () => {
      // Act
      const result = poStatusEnum.safeParse('draft')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept valid status submitted', () => {
      // Act
      const result = poStatusEnum.safeParse('submitted')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept valid status pending_approval', () => {
      // Act
      const result = poStatusEnum.safeParse('pending_approval')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept valid status confirmed', () => {
      // Act
      const result = poStatusEnum.safeParse('confirmed')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept valid status receiving', () => {
      // Act
      const result = poStatusEnum.safeParse('receiving')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept valid status closed', () => {
      // Act
      const result = poStatusEnum.safeParse('closed')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept valid status cancelled', () => {
      // Act
      const result = poStatusEnum.safeParse('cancelled')

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should reject invalid status', () => {
      // Act
      const result = poStatusEnum.safeParse('invalid_status')

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('createPOLineSchema', () => {
    it('AC-03-1: Should validate minimal valid line', () => {
      // Arrange
      const data = {
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 100,
        unit_price: 2.50,
        uom: 'kg',
      }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('AC-03-1: Should validate line with all optional fields', () => {
      // Arrange
      const data = {
        ...validLineData,
        expected_delivery_date: tomorrow,
        notes: 'Special handling required',
      }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('AC-03-1: Should reject missing product_id', () => {
      // Arrange
      const data = { ...validLineData }
      delete data.product_id

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].code).toBe('invalid_type')
    })

    it('AC-03-1: Should reject missing quantity', () => {
      // Arrange
      const data = { ...validLineData }
      delete data.quantity

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-03-1: Should reject missing unit_price', () => {
      // Arrange
      const data = { ...validLineData }
      delete data.unit_price

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-03-1: Should reject missing uom', () => {
      // Arrange
      const data = { ...validLineData }
      delete data.uom

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-03-4: Should reject negative quantity', () => {
      // Arrange
      const data = { ...validLineData, quantity: -1 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('positive')
    })

    it('AC-03-4: Should reject zero quantity', () => {
      // Arrange
      const data = { ...validLineData, quantity: 0 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should reject negative unit_price', () => {
      // Arrange
      const data = { ...validLineData, unit_price: -10 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should accept zero unit_price (for donations/samples)', () => {
      // Arrange
      const data = { ...validLineData, unit_price: 0 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('AC-03-4: Should reject discount > 100%', () => {
      // Arrange
      const data = { ...validLineData, discount_percent: 150 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('100')
    })

    it('AC-03-4: Should accept discount = 0%', () => {
      // Arrange
      const data = { ...validLineData, discount_percent: 0 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('AC-03-4: Should accept discount = 100%', () => {
      // Arrange
      const data = { ...validLineData, discount_percent: 100 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept decimal discount percentages', () => {
      // Arrange
      const data = { ...validLineData, discount_percent: 10.5 }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should reject invalid product_id format', () => {
      // Arrange
      const data = { ...validLineData, product_id: 'not-a-uuid' }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should reject uom with excessive length', () => {
      // Arrange
      const data = { ...validLineData, uom: 'a'.repeat(25) }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should reject notes exceeding max length', () => {
      // Arrange
      const data = { ...validLineData, notes: 'a'.repeat(501) }

      // Act
      const result = createPOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('createPOSchema', () => {
    it('AC-02-1: Should validate minimal valid PO', () => {
      // Arrange
      const data = {
        supplier_id: '550e8400-e29b-41d4-a716-446655440000',
        warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        expected_delivery_date: tomorrow,
      }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('AC-02-1: Should validate PO with all fields', () => {
      // Arrange
      const data = {
        ...validPOData,
        lines: [validLineData],
      }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('AC-02-3: Should reject missing supplier_id', () => {
      // Arrange
      const data = { ...validPOData }
      delete data.supplier_id

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('required')
    })

    it('AC-02-3: Should reject missing warehouse_id', () => {
      // Arrange
      const data = { ...validPOData }
      delete data.warehouse_id

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-02-3: Should reject missing expected_delivery_date', () => {
      // Arrange
      const data = { ...validPOData }
      delete data.expected_delivery_date

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-02-3: Should reject invalid supplier_id format', () => {
      // Arrange
      const data = { ...validPOData, supplier_id: 'not-uuid' }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-02-3: Should reject past delivery date', () => {
      // Arrange
      const data = { ...validPOData, expected_delivery_date: yesterday }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('future')
    })

    it('Should accept today as delivery date', () => {
      // Arrange
      const data = { ...validPOData, expected_delivery_date: today }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should default currency to PLN', () => {
      // Arrange
      const data = {
        supplier_id: '550e8400-e29b-41d4-a716-446655440000',
        warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        expected_delivery_date: tomorrow,
      }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.currency).toBe('PLN')
    })

    it('Should reject invalid currency', () => {
      // Arrange
      const data = { ...validPOData, currency: 'INVALID' }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should accept optional tax_code_id', () => {
      // Arrange
      const data = {
        ...validPOData,
        tax_code_id: '550e8400-e29b-41d4-a716-446655440002',
      }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should accept null tax_code_id', () => {
      // Arrange
      const data = { ...validPOData, tax_code_id: null }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should reject notes exceeding max length', () => {
      // Arrange
      const data = { ...validPOData, notes: 'a'.repeat(2001) }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should accept lines array', () => {
      // Arrange
      const data = {
        ...validPOData,
        lines: [validLineData, validLineData],
      }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.lines?.length).toBe(2)
    })

    it('Should reject lines array exceeding max count', () => {
      // Arrange
      const lines = Array(201).fill(validLineData)
      const data = { ...validPOData, lines }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('AC-02-4: Should allow creating PO without lines', () => {
      // Arrange
      const data = {
        supplier_id: '550e8400-e29b-41d4-a716-446655440000',
        warehouse_id: '550e8400-e29b-41d4-a716-446655440001',
        expected_delivery_date: tomorrow,
      }

      // Act
      const result = createPOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('updatePOSchema', () => {
    it('Should validate empty update (all fields optional)', () => {
      // Arrange
      const data = {}

      // Act
      const result = updatePOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should validate partial update', () => {
      // Arrange
      const data = {
        expected_delivery_date: tomorrow,
        notes: 'Updated notes',
      }

      // Act
      const result = updatePOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should reject invalid currency in update', () => {
      // Arrange
      const data = { currency: 'INVALID' }

      // Act
      const result = updatePOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(false)
    })

    it('Should accept valid currency in update', () => {
      // Arrange
      const data = { currency: 'EUR' }

      // Act
      const result = updatePOSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('updatePOLineSchema', () => {
    it('Should validate partial line update', () => {
      // Arrange
      const data = { quantity: 200 }

      // Act
      const result = updatePOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should validate line update with delete flag', () => {
      // Arrange
      const data = { _delete: true }

      // Act
      const result = updatePOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })

    it('Should validate update with line id', () => {
      // Arrange
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 150,
      }

      // Act
      const result = updatePOLineSchema.safeParse(data)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
