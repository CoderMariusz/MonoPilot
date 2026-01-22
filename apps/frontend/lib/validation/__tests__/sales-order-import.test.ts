/**
 * Sales Order Import Validation - Unit Tests (Story 07.5)
 * Purpose: Test Zod schemas for CSV validation and row validation
 * Phase: RED - Tests will fail until implementation exists
 *
 * Test Cases from tests.yaml:
 * - csvRowSchema validation
 * - csvFileSchema validation
 * - Required/optional field handling
 */

import { describe, it, expect } from 'vitest'

// Import schemas - will fail until implemented
import {
  csvRowSchema,
  csvFileSchema,
  csvHeadersSchema,
  importResultSchema,
} from '../sales-order-import'

describe('csvRowSchema Validation (Story 07.5)', () => {
  describe('Required Fields', () => {
    it('should reject empty customer_code', () => {
      const result = csvRowSchema.safeParse({
        customer_code: '',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('customer_code'))).toBe(true)
      }
    })

    it('should reject empty product_code', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: '',
        quantity: '10',
        unit_price: '10.50',
      })

      expect(result.success).toBe(false)
    })

    it('should reject empty quantity', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '',
        unit_price: '10.50',
      })

      expect(result.success).toBe(false)
    })

    it('should accept valid row with required fields only', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Quantity Validation', () => {
    it('should reject quantity = 0', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '0',
        unit_price: '10.50',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('greater than')
      }
    })

    it('should reject negative quantity', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '-5',
        unit_price: '10.50',
      })

      expect(result.success).toBe(false)
    })

    it('should accept positive integer quantity', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '100',
        unit_price: '10.50',
      })

      expect(result.success).toBe(true)
    })

    it('should accept positive decimal quantity', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10.5',
        unit_price: '10.50',
      })

      expect(result.success).toBe(true)
    })

    it('should reject non-numeric quantity', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: 'abc',
        unit_price: '10.50',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Unit Price Validation', () => {
    it('should reject negative unit_price', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '-5.00',
      })

      expect(result.success).toBe(false)
    })

    it('should accept unit_price = 0 (free items)', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '0',
      })

      expect(result.success).toBe(true)
    })

    it('should accept positive decimal unit_price', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.99',
      })

      expect(result.success).toBe(true)
    })

    it('should reject non-numeric unit_price', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: 'abc',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Optional Fields', () => {
    it('should accept customer_po when provided', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
        customer_po: 'PO-12345',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customer_po).toBe('PO-12345')
      }
    })

    it('should accept empty customer_po as null', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
        customer_po: '',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customer_po).toBeNull()
      }
    })

    it('should accept promised_ship_date in YYYY-MM-DD format', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
        promised_ship_date: '2025-12-20',
      })

      expect(result.success).toBe(true)
    })

    it('should reject promised_ship_date in invalid format', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
        promised_ship_date: '12/20/2025',
      })

      expect(result.success).toBe(false)
    })

    it('should accept notes field', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '10',
        unit_price: '10.50',
        notes: 'Rush order - handle with care',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Full Row Validation', () => {
    it('should accept complete valid row', () => {
      const result = csvRowSchema.safeParse({
        customer_code: 'ACME001',
        product_code: 'PROD-001',
        quantity: '100',
        unit_price: '10.50',
        customer_po: 'PO-12345',
        promised_ship_date: '2025-12-20',
        notes: 'Test notes',
      })

      expect(result.success).toBe(true)
    })

    it('should provide helpful error messages', () => {
      const result = csvRowSchema.safeParse({
        customer_code: '',
        product_code: '',
        quantity: '0',
        unit_price: '-5',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })
  })
})

describe('csvFileSchema Validation (Story 07.5)', () => {
  describe('File Type Validation', () => {
    it('should reject non-CSV file type', () => {
      const mockFile = {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024,
        name: 'orders.xlsx',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('CSV')
      }
    })

    it('should accept text/csv file type', () => {
      const mockFile = {
        type: 'text/csv',
        size: 1024,
        name: 'orders.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(true)
    })

    it('should accept application/csv file type', () => {
      const mockFile = {
        type: 'application/csv',
        size: 1024,
        name: 'orders.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(true)
    })
  })

  describe('File Size Validation', () => {
    it('should reject file > 5 MB', () => {
      const mockFile = {
        type: 'text/csv',
        size: 6 * 1024 * 1024, // 6 MB
        name: 'large.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5 MB')
      }
    })

    it('should accept file <= 5 MB', () => {
      const mockFile = {
        type: 'text/csv',
        size: 5 * 1024 * 1024, // 5 MB exactly
        name: 'valid.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(true)
    })

    it('should reject empty file (0 bytes)', () => {
      const mockFile = {
        type: 'text/csv',
        size: 0,
        name: 'empty.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(false)
    })

    it('should accept small file (1 byte)', () => {
      const mockFile = {
        type: 'text/csv',
        size: 1,
        name: 'tiny.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(true)
    })
  })

  describe('File Name Validation', () => {
    it('should accept file with .csv extension', () => {
      const mockFile = {
        type: 'text/csv',
        size: 1024,
        name: 'orders.csv',
      }

      const result = csvFileSchema.safeParse(mockFile)

      expect(result.success).toBe(true)
    })
  })
})

describe('csvHeadersSchema Validation (Story 07.5)', () => {
  describe('Required Headers', () => {
    it('should require customer_code header', () => {
      const headers = ['product_code', 'quantity', 'unit_price']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(false)
    })

    it('should require product_code header', () => {
      const headers = ['customer_code', 'quantity', 'unit_price']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(false)
    })

    it('should require quantity header', () => {
      const headers = ['customer_code', 'product_code', 'unit_price']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(false)
    })

    it('should accept all required headers', () => {
      const headers = ['customer_code', 'product_code', 'quantity', 'unit_price']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(true)
    })
  })

  describe('Optional Headers', () => {
    it('should accept optional customer_po header', () => {
      const headers = ['customer_code', 'product_code', 'quantity', 'unit_price', 'customer_po']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(true)
    })

    it('should accept optional promised_ship_date header', () => {
      const headers = ['customer_code', 'product_code', 'quantity', 'unit_price', 'promised_ship_date']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(true)
    })

    it('should accept optional notes header', () => {
      const headers = ['customer_code', 'product_code', 'quantity', 'unit_price', 'notes']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(true)
    })

    it('should accept all optional headers', () => {
      const headers = [
        'customer_code',
        'product_code',
        'quantity',
        'unit_price',
        'customer_po',
        'promised_ship_date',
        'notes',
      ]

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(true)
    })
  })

  describe('Header Case Sensitivity', () => {
    it('should handle lowercase headers', () => {
      const headers = ['customer_code', 'product_code', 'quantity', 'unit_price']

      const result = csvHeadersSchema.safeParse(headers)

      expect(result.success).toBe(true)
    })

    it('should handle headers with extra whitespace', () => {
      const headers = [' customer_code ', ' product_code ', ' quantity ', ' unit_price ']

      // Schema should trim headers
      const result = csvHeadersSchema.safeParse(headers.map(h => h.trim()))

      expect(result.success).toBe(true)
    })
  })
})

describe('importResultSchema Validation (Story 07.5)', () => {
  describe('Success Result', () => {
    it('should validate successful import result', () => {
      const result = {
        success: true,
        ordersCreated: 3,
        linesImported: 5,
        errorsCount: 0,
        errors: [],
        createdOrderNumbers: ['SO-2025-00001', 'SO-2025-00002', 'SO-2025-00003'],
      }

      const validated = importResultSchema.safeParse(result)

      expect(validated.success).toBe(true)
    })
  })

  describe('Partial Success Result', () => {
    it('should validate partial import result with errors', () => {
      const result = {
        success: true,
        ordersCreated: 2,
        linesImported: 3,
        errorsCount: 2,
        errors: [
          { rowNumber: 1, message: 'Customer INVALID not found' },
          { rowNumber: 4, message: 'Product MISSING not found' },
        ],
        createdOrderNumbers: ['SO-2025-00001', 'SO-2025-00002'],
      }

      const validated = importResultSchema.safeParse(result)

      expect(validated.success).toBe(true)
    })
  })

  describe('Error Result', () => {
    it('should validate failed import result', () => {
      const result = {
        success: false,
        ordersCreated: 0,
        linesImported: 0,
        errorsCount: 1,
        errors: [{ rowNumber: 0, message: 'CSV file is empty' }],
        createdOrderNumbers: [],
      }

      const validated = importResultSchema.safeParse(result)

      expect(validated.success).toBe(true)
    })
  })
})
