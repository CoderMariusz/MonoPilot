/**
 * GRN Validation Schema Tests (Story 05.10)
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  createGRNSchema,
  updateGRNSchema,
  createGRNItemSchema,
  updateGRNItemSchema,
  cancelGRNSchema,
  grnQuerySchema,
  grnStatusEnum,
  grnSourceTypeEnum,
  qaStatusEnum,
} from '../grn-schemas'

describe('GRN Validation Schemas', () => {
  // ===========================================================================
  // Enum Tests
  // ===========================================================================

  describe('grnStatusEnum', () => {
    it('accepts valid statuses', () => {
      expect(grnStatusEnum.safeParse('draft').success).toBe(true)
      expect(grnStatusEnum.safeParse('completed').success).toBe(true)
      expect(grnStatusEnum.safeParse('cancelled').success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(grnStatusEnum.safeParse('pending').success).toBe(false)
      expect(grnStatusEnum.safeParse('active').success).toBe(false)
    })
  })

  describe('grnSourceTypeEnum', () => {
    it('accepts valid source types', () => {
      expect(grnSourceTypeEnum.safeParse('po').success).toBe(true)
      expect(grnSourceTypeEnum.safeParse('to').success).toBe(true)
      expect(grnSourceTypeEnum.safeParse('production').success).toBe(true)
      expect(grnSourceTypeEnum.safeParse('return').success).toBe(true)
      expect(grnSourceTypeEnum.safeParse('adjustment').success).toBe(true)
    })

    it('rejects invalid source type', () => {
      expect(grnSourceTypeEnum.safeParse('manual').success).toBe(false)
      expect(grnSourceTypeEnum.safeParse('transfer').success).toBe(false)
    })
  })

  describe('qaStatusEnum', () => {
    it('accepts valid QA statuses', () => {
      expect(qaStatusEnum.safeParse('pending').success).toBe(true)
      expect(qaStatusEnum.safeParse('passed').success).toBe(true)
      expect(qaStatusEnum.safeParse('failed').success).toBe(true)
      expect(qaStatusEnum.safeParse('quarantine').success).toBe(true)
    })

    it('rejects invalid QA status', () => {
      expect(qaStatusEnum.safeParse('approved').success).toBe(false)
    })
  })

  // ===========================================================================
  // Create GRN Item Schema Tests
  // ===========================================================================

  describe('createGRNItemSchema', () => {
    const validItem = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      received_qty: 100,
      uom: 'KG',
    }

    it('accepts valid minimal item', () => {
      const result = createGRNItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.qa_status).toBe('pending') // default
        expect(result.data.ordered_qty).toBe(0) // default
      }
    })

    it('accepts valid full item', () => {
      const fullItem = {
        ...validItem,
        ordered_qty: 120,
        batch_number: 'BATCH-001',
        supplier_batch_number: 'SUP-001',
        gtin: '12345678901234',
        catch_weight_kg: 99.5,
        expiry_date: '2026-01-01',
        manufacture_date: '2025-01-01',
        location_id: '123e4567-e89b-12d3-a456-426614174001',
        qa_status: 'passed',
        notes: 'Test notes',
      }
      const result = createGRNItemSchema.safeParse(fullItem)
      expect(result.success).toBe(true)
    })

    it('rejects missing product_id', () => {
      const result = createGRNItemSchema.safeParse({
        received_qty: 100,
        uom: 'KG',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid product_id format', () => {
      const result = createGRNItemSchema.safeParse({
        ...validItem,
        product_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('rejects zero received_qty', () => {
      const result = createGRNItemSchema.safeParse({
        ...validItem,
        received_qty: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative received_qty', () => {
      const result = createGRNItemSchema.safeParse({
        ...validItem,
        received_qty: -10,
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty uom', () => {
      const result = createGRNItemSchema.safeParse({
        ...validItem,
        uom: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid GTIN length', () => {
      const result = createGRNItemSchema.safeParse({
        ...validItem,
        gtin: '123456789', // Too short
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid date format', () => {
      const result = createGRNItemSchema.safeParse({
        ...validItem,
        expiry_date: '01-01-2026', // Wrong format
      })
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // Create GRN Schema Tests
  // ===========================================================================

  describe('createGRNSchema', () => {
    const validGRN = {
      source_type: 'adjustment',
      warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
      location_id: '123e4567-e89b-12d3-a456-426614174001',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174002',
          received_qty: 100,
          uom: 'KG',
        },
      ],
    }

    it('accepts valid minimal GRN', () => {
      const result = createGRNSchema.safeParse(validGRN)
      expect(result.success).toBe(true)
    })

    it('accepts valid GRN with multiple items', () => {
      const grnWithItems = {
        ...validGRN,
        items: [
          { product_id: '123e4567-e89b-12d3-a456-426614174002', received_qty: 100, uom: 'KG' },
          { product_id: '123e4567-e89b-12d3-a456-426614174003', received_qty: 50, uom: 'LB' },
        ],
      }
      const result = createGRNSchema.safeParse(grnWithItems)
      expect(result.success).toBe(true)
    })

    it('accepts valid GRN with optional fields', () => {
      const fullGRN = {
        ...validGRN,
        supplier_id: '123e4567-e89b-12d3-a456-426614174004',
        receipt_date: '2025-01-01T10:00:00.000Z',
        notes: 'Test GRN notes',
      }
      const result = createGRNSchema.safeParse(fullGRN)
      expect(result.success).toBe(true)
    })

    it('rejects missing source_type', () => {
      const { source_type, ...rest } = validGRN
      const result = createGRNSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('rejects missing warehouse_id', () => {
      const { warehouse_id, ...rest } = validGRN
      const result = createGRNSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('rejects missing location_id', () => {
      const { location_id, ...rest } = validGRN
      const result = createGRNSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('rejects empty items array', () => {
      const result = createGRNSchema.safeParse({
        ...validGRN,
        items: [],
      })
      expect(result.success).toBe(false)
    })

    it('requires po_id for PO source type', () => {
      const result = createGRNSchema.safeParse({
        ...validGRN,
        source_type: 'po',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('PO ID required')
      }
    })

    it('accepts PO source type with po_id', () => {
      const result = createGRNSchema.safeParse({
        ...validGRN,
        source_type: 'po',
        po_id: '123e4567-e89b-12d3-a456-426614174005',
      })
      expect(result.success).toBe(true)
    })

    it('requires to_id for TO source type', () => {
      const result = createGRNSchema.safeParse({
        ...validGRN,
        source_type: 'to',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('TO ID required')
      }
    })

    it('accepts TO source type with to_id', () => {
      const result = createGRNSchema.safeParse({
        ...validGRN,
        source_type: 'to',
        to_id: '123e4567-e89b-12d3-a456-426614174006',
      })
      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // Update GRN Schema Tests
  // ===========================================================================

  describe('updateGRNSchema', () => {
    it('accepts valid update with location_id', () => {
      const result = updateGRNSchema.safeParse({
        location_id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid update with notes', () => {
      const result = updateGRNSchema.safeParse({
        notes: 'Updated notes',
      })
      expect(result.success).toBe(true)
    })

    it('accepts empty update object', () => {
      const result = updateGRNSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects invalid location_id format', () => {
      const result = updateGRNSchema.safeParse({
        location_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // Update GRN Item Schema Tests
  // ===========================================================================

  describe('updateGRNItemSchema', () => {
    it('accepts valid partial update', () => {
      const result = updateGRNItemSchema.safeParse({
        received_qty: 150,
      })
      expect(result.success).toBe(true)
    })

    it('accepts full update', () => {
      const result = updateGRNItemSchema.safeParse({
        received_qty: 150,
        batch_number: 'NEW-BATCH',
        expiry_date: '2026-12-31',
        qa_status: 'passed',
      })
      expect(result.success).toBe(true)
    })

    it('accepts empty update object', () => {
      const result = updateGRNItemSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects zero received_qty', () => {
      const result = updateGRNItemSchema.safeParse({
        received_qty: 0,
      })
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // Cancel GRN Schema Tests
  // ===========================================================================

  describe('cancelGRNSchema', () => {
    it('accepts valid cancellation reason', () => {
      const result = cancelGRNSchema.safeParse({
        reason: 'Entered in error',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing reason', () => {
      const result = cancelGRNSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects empty reason', () => {
      const result = cancelGRNSchema.safeParse({
        reason: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects reason exceeding max length', () => {
      const result = cancelGRNSchema.safeParse({
        reason: 'x'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // GRN Query Schema Tests
  // ===========================================================================

  describe('grnQuerySchema', () => {
    it('accepts empty query params', () => {
      const result = grnQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(50)
        expect(result.data.sort).toBe('created_at')
        expect(result.data.order).toBe('desc')
      }
    })

    it('accepts valid filter params', () => {
      const result = grnQuerySchema.safeParse({
        search: 'GRN-2025',
        status: 'completed',
        source_type: 'po',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        from_date: '2025-01-01',
        to_date: '2025-12-31',
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid pagination params', () => {
      const result = grnQuerySchema.safeParse({
        page: '2',
        limit: '25',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(25)
      }
    })

    it('coerces string numbers to numbers', () => {
      const result = grnQuerySchema.safeParse({
        page: '5',
        limit: '100',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.page).toBe('number')
        expect(typeof result.data.limit).toBe('number')
      }
    })

    it('rejects limit exceeding max', () => {
      const result = grnQuerySchema.safeParse({
        limit: 200,
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid date format', () => {
      const result = grnQuerySchema.safeParse({
        from_date: '01-01-2025',
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid sort options', () => {
      const sortOptions = ['grn_number', 'receipt_date', 'created_at', 'total_qty']
      for (const sort of sortOptions) {
        const result = grnQuerySchema.safeParse({ sort })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid sort option', () => {
      const result = grnQuerySchema.safeParse({
        sort: 'invalid_field',
      })
      expect(result.success).toBe(false)
    })
  })
})
