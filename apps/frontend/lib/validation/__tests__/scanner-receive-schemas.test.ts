/**
 * Scanner Receive Validation Schema Tests (Story 05.19)
 * Phase: TDD RED - Tests written before implementation
 */

import { describe, it, expect } from 'vitest'
import {
  scannerReceiveSchema,
  validateReceiptSchema,
  barcodeLookupSchema,
  pendingReceiptsQuerySchema,
} from '../scanner-receive'

describe('Scanner Receive Validation Schemas', () => {
  // ===========================================================================
  // scannerReceiveSchema Tests
  // ===========================================================================
  describe('scannerReceiveSchema', () => {
    it('should validate valid receipt data', () => {
      const validData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        batch_number: 'BATCH-001',
        expiry_date: '2026-01-01',
      }

      const result = scannerReceiveSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require po_id as UUID', () => {
      const invalidData = {
        po_id: 'not-a-uuid',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('po_id')
      }
    })

    it('should require po_line_id as UUID', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: 'invalid',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require warehouse_id as UUID', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: 'invalid',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require location_id as UUID', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: 'invalid',
        received_qty: 100,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require received_qty to be positive', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 0,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative received_qty', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: -10,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject received_qty exceeding max', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 9999999999,
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow optional batch_number', () => {
      const dataWithBatch = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        batch_number: 'BATCH-001',
      }

      const dataWithoutBatch = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
      }

      expect(scannerReceiveSchema.safeParse(dataWithBatch).success).toBe(true)
      expect(scannerReceiveSchema.safeParse(dataWithoutBatch).success).toBe(true)
    })

    it('should limit batch_number to 100 characters', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        batch_number: 'A'.repeat(101),
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate expiry_date format as YYYY-MM-DD', () => {
      const validData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        expiry_date: '2026-12-31',
      }

      const invalidData = {
        ...validData,
        expiry_date: '12/31/2026',
      }

      expect(scannerReceiveSchema.safeParse(validData).success).toBe(true)
      expect(scannerReceiveSchema.safeParse(invalidData).success).toBe(false)
    })

    it('should validate manufacture_date format as YYYY-MM-DD', () => {
      const validData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        manufacture_date: '2025-01-01',
      }

      expect(scannerReceiveSchema.safeParse(validData).success).toBe(true)
    })

    it('should limit notes to 500 characters', () => {
      const invalidData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        notes: 'A'.repeat(501),
      }

      const result = scannerReceiveSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow null for optional fields', () => {
      const dataWithNulls = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        location_id: '123e4567-e89b-12d3-a456-426614174003',
        received_qty: 100,
        batch_number: null,
        supplier_batch_number: null,
        expiry_date: null,
        manufacture_date: null,
        notes: null,
      }

      const result = scannerReceiveSchema.safeParse(dataWithNulls)
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // validateReceiptSchema Tests
  // ===========================================================================
  describe('validateReceiptSchema', () => {
    it('should validate pre-validation request', () => {
      const validData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        received_qty: 100,
      }

      const result = validateReceiptSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial fields for pre-validation', () => {
      const minimalData = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        received_qty: 100,
      }

      const result = validateReceiptSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // barcodeLookupSchema Tests
  // ===========================================================================
  describe('barcodeLookupSchema', () => {
    it('should require barcode', () => {
      const invalidData = {}
      const result = barcodeLookupSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require barcode to be non-empty', () => {
      const invalidData = { barcode: '' }
      const result = barcodeLookupSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should limit barcode to 100 characters', () => {
      const invalidData = { barcode: 'A'.repeat(101) }
      const result = barcodeLookupSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate valid barcode', () => {
      const validData = { barcode: 'PO-2025-00001' }
      const result = barcodeLookupSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow optional type field', () => {
      const dataWithType = { barcode: 'PO-2025-00001', type: 'po' }
      const dataWithoutType = { barcode: 'PO-2025-00001' }

      expect(barcodeLookupSchema.safeParse(dataWithType).success).toBe(true)
      expect(barcodeLookupSchema.safeParse(dataWithoutType).success).toBe(true)
    })

    it('should validate type enum values', () => {
      const validTypes = ['po', 'product', 'location']
      const invalidType = { barcode: 'TEST', type: 'invalid' }

      for (const type of validTypes) {
        const result = barcodeLookupSchema.safeParse({ barcode: 'TEST', type })
        expect(result.success).toBe(true)
      }

      expect(barcodeLookupSchema.safeParse(invalidType).success).toBe(false)
    })
  })

  // ===========================================================================
  // pendingReceiptsQuerySchema Tests
  // ===========================================================================
  describe('pendingReceiptsQuerySchema', () => {
    it('should validate empty query', () => {
      const result = pendingReceiptsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate warehouse_id as UUID', () => {
      const validData = { warehouse_id: '123e4567-e89b-12d3-a456-426614174000' }
      const invalidData = { warehouse_id: 'not-a-uuid' }

      expect(pendingReceiptsQuerySchema.safeParse(validData).success).toBe(true)
      expect(pendingReceiptsQuerySchema.safeParse(invalidData).success).toBe(false)
    })

    it('should allow optional search', () => {
      const dataWithSearch = { search: 'PO-2025' }
      const dataWithoutSearch = {}

      expect(pendingReceiptsQuerySchema.safeParse(dataWithSearch).success).toBe(true)
      expect(pendingReceiptsQuerySchema.safeParse(dataWithoutSearch).success).toBe(true)
    })

    it('should default limit to 50', () => {
      const result = pendingReceiptsQuerySchema.parse({})
      expect(result.limit).toBe(50)
    })

    it('should coerce limit from string', () => {
      const result = pendingReceiptsQuerySchema.parse({ limit: '25' })
      expect(result.limit).toBe(25)
    })

    it('should enforce limit min of 1', () => {
      const invalidData = { limit: 0 }
      const result = pendingReceiptsQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should enforce limit max of 100', () => {
      const invalidData = { limit: 101 }
      const result = pendingReceiptsQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
