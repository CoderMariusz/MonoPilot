/**
 * ASN Validation Schemas - Unit Tests (Story 05.8)
 * Purpose: Test Zod validation schemas for ASN operations
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests validation schemas:
 * - asnSchema
 * - asnItemSchema
 * - createASNSchema
 * - updateASNSchema
 * - updateASNItemSchema
 * - createASNFromPOSchema
 * - asnStatusEnum
 *
 * Coverage Target: 100% (all validation rules)
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Create ASN Header validation
 * - AC-5: ASN Item Management validation
 * - AC-12: Data Validation
 */

import { describe, it, expect } from 'vitest'
import {
  asnSchema,
  asnItemSchema,
  createASNSchema,
  updateASNSchema,
  updateASNItemSchema,
  createASNFromPOSchema,
  asnStatusEnum,
} from '../asn-schemas'

describe('ASN Validation Schemas (Story 05.8)', () => {
  // ==========================================================================
  // Enum Schemas
  // ==========================================================================
  describe('asnStatusEnum', () => {
    it('should accept valid status values', () => {
      expect(() => asnStatusEnum.parse('pending')).not.toThrow()
      expect(() => asnStatusEnum.parse('partial')).not.toThrow()
      expect(() => asnStatusEnum.parse('received')).not.toThrow()
      expect(() => asnStatusEnum.parse('cancelled')).not.toThrow()
    })

    it('should reject invalid status values', () => {
      expect(() => asnStatusEnum.parse('invalid')).toThrow()
      expect(() => asnStatusEnum.parse('active')).toThrow()
      expect(() => asnStatusEnum.parse('')).toThrow()
    })
  })

  // ==========================================================================
  // ASN Schema (Header)
  // ==========================================================================
  describe('asnSchema', () => {
    const validInput = {
      po_id: '123e4567-e89b-12d3-a456-426614174000',
      expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      carrier: 'FedEx',
      tracking_number: '1234567890',
      notes: 'Test ASN',
    }

    it('should accept valid ASN header input', () => {
      const result = asnSchema.parse(validInput)

      expect(result.po_id).toBe(validInput.po_id)
      expect(result.expected_date).toBe(validInput.expected_date)
      expect(result.carrier).toBe('FedEx')
    })

    it('should require po_id', () => {
      const input = { ...validInput }
      delete (input as any).po_id

      expect(() => asnSchema.parse(input)).toThrow('Invalid purchase order ID')
    })

    it('should validate po_id is UUID', () => {
      const input = { ...validInput, po_id: 'invalid-uuid' }

      expect(() => asnSchema.parse(input)).toThrow('Invalid purchase order ID')
    })

    it('should require expected_date', () => {
      const input = { ...validInput }
      delete (input as any).expected_date

      expect(() => asnSchema.parse(input)).toThrow()
    })

    it('should validate expected_date is not in the past', () => {
      const input = {
        ...validInput,
        expected_date: '2020-01-01',
      }

      expect(() => asnSchema.parse(input)).toThrow('Expected delivery date must be today or in the future')
    })

    it('should accept today as expected_date', () => {
      const today = new Date().toISOString().split('T')[0]
      const input = { ...validInput, expected_date: today }

      const result = asnSchema.parse(input)

      expect(result.expected_date).toBe(today)
    })

    it('should accept optional carrier', () => {
      const input = { ...validInput }
      delete (input as any).carrier

      const result = asnSchema.parse(input)

      expect(result.carrier).toBeUndefined()
    })

    it('should accept optional tracking_number', () => {
      const input = { ...validInput }
      delete (input as any).tracking_number

      const result = asnSchema.parse(input)

      expect(result.tracking_number).toBeUndefined()
    })

    it('should accept optional notes', () => {
      const input = { ...validInput }
      delete (input as any).notes

      const result = asnSchema.parse(input)

      expect(result.notes).toBeUndefined()
    })
  })

  // ==========================================================================
  // ASN Item Schema
  // ==========================================================================
  describe('asnItemSchema', () => {
    const validInput = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      expected_qty: 100,
      uom: 'KG',
      supplier_lp_number: 'SUP-LP-001',
      supplier_batch_number: 'SUP-BATCH-001',
      gtin: '12345678901234',
      expiry_date: '2026-12-31',
      notes: 'Test item',
    }

    it('should accept valid ASN item input', () => {
      const result = asnItemSchema.parse(validInput)

      expect(result.product_id).toBe(validInput.product_id)
      expect(result.expected_qty).toBe(100)
      expect(result.uom).toBe('KG')
    })

    it('should require product_id', () => {
      const input = { ...validInput }
      delete (input as any).product_id

      expect(() => asnItemSchema.parse(input)).toThrow('Invalid product ID')
    })

    it('should validate product_id is UUID', () => {
      const input = { ...validInput, product_id: 'invalid-uuid' }

      expect(() => asnItemSchema.parse(input)).toThrow('Invalid product ID')
    })

    it('should require expected_qty', () => {
      const input = { ...validInput }
      delete (input as any).expected_qty

      expect(() => asnItemSchema.parse(input)).toThrow()
    })

    it('should validate expected_qty is positive', () => {
      const input = { ...validInput, expected_qty: 0 }

      expect(() => asnItemSchema.parse(input)).toThrow('Expected quantity must be greater than 0')
    })

    it('should validate expected_qty is not negative', () => {
      const input = { ...validInput, expected_qty: -10 }

      expect(() => asnItemSchema.parse(input)).toThrow('Expected quantity must be greater than 0')
    })

    it('should require uom', () => {
      const input = { ...validInput }
      delete (input as any).uom

      expect(() => asnItemSchema.parse(input)).toThrow('Unit of measure is required')
    })

    it('should validate uom is not empty', () => {
      const input = { ...validInput, uom: '' }

      expect(() => asnItemSchema.parse(input)).toThrow('Unit of measure is required')
    })

    it('should accept optional supplier_lp_number', () => {
      const input = { ...validInput }
      delete (input as any).supplier_lp_number

      const result = asnItemSchema.parse(input)

      expect(result.supplier_lp_number).toBeUndefined()
    })

    it('should accept optional supplier_batch_number', () => {
      const input = { ...validInput }
      delete (input as any).supplier_batch_number

      const result = asnItemSchema.parse(input)

      expect(result.supplier_batch_number).toBeUndefined()
    })

    it('should validate GTIN is 14 digits', () => {
      const input = { ...validInput, gtin: '123' }

      expect(() => asnItemSchema.parse(input)).toThrow('GTIN must be 14 digits')
    })

    it('should accept valid 14-digit GTIN', () => {
      const input = { ...validInput, gtin: '12345678901234' }

      const result = asnItemSchema.parse(input)

      expect(result.gtin).toBe('12345678901234')
    })

    it('should accept optional gtin', () => {
      const input = { ...validInput }
      delete (input as any).gtin

      const result = asnItemSchema.parse(input)

      expect(result.gtin).toBeUndefined()
    })

    it('should accept optional expiry_date', () => {
      const input = { ...validInput }
      delete (input as any).expiry_date

      const result = asnItemSchema.parse(input)

      expect(result.expiry_date).toBeUndefined()
    })

    it('should accept optional notes', () => {
      const input = { ...validInput }
      delete (input as any).notes

      const result = asnItemSchema.parse(input)

      expect(result.notes).toBeUndefined()
    })
  })

  // ==========================================================================
  // Create ASN Schema (Header + Items)
  // ==========================================================================
  describe('createASNSchema', () => {
    const validInput = {
      header: {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        carrier: 'FedEx',
      },
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          expected_qty: 100,
          uom: 'KG',
        },
      ],
    }

    it('should accept valid create ASN input', () => {
      const result = createASNSchema.parse(validInput)

      expect(result.header.po_id).toBe(validInput.header.po_id)
      expect(result.items).toHaveLength(1)
    })

    it('should require at least one item', () => {
      const input = { ...validInput, items: [] }

      expect(() => createASNSchema.parse(input)).toThrow('At least one item is required')
    })

    it('should validate header fields', () => {
      const input = {
        ...validInput,
        header: { ...validInput.header, po_id: 'invalid' },
      }

      expect(() => createASNSchema.parse(input)).toThrow()
    })

    it('should validate item fields', () => {
      const input = {
        ...validInput,
        items: [{ ...validInput.items[0], expected_qty: -10 }],
      }

      expect(() => createASNSchema.parse(input)).toThrow()
    })

    it('should accept multiple items', () => {
      const input = {
        ...validInput,
        items: [
          validInput.items[0],
          {
            product_id: '123e4567-e89b-12d3-a456-426614174002',
            expected_qty: 50,
            uom: 'KG',
          },
        ],
      }

      const result = createASNSchema.parse(input)

      expect(result.items).toHaveLength(2)
    })
  })

  // ==========================================================================
  // Update ASN Schema
  // ==========================================================================
  describe('updateASNSchema', () => {
    it('should accept partial ASN header updates', () => {
      const input = {
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      }

      const result = updateASNSchema.parse(input)

      expect(result.expected_date).toBeDefined()
    })

    it('should accept carrier update only', () => {
      const input = {
        carrier: 'UPS',
      }

      const result = updateASNSchema.parse(input)

      expect(result.carrier).toBe('UPS')
    })

    it('should accept tracking_number update only', () => {
      const input = {
        tracking_number: '0987654321',
      }

      const result = updateASNSchema.parse(input)

      expect(result.tracking_number).toBe('0987654321')
    })

    it('should validate expected_date if provided', () => {
      const input = {
        expected_date: '2020-01-01',
      }

      expect(() => updateASNSchema.parse(input)).toThrow()
    })

    it('should accept empty update object', () => {
      const input = {}

      const result = updateASNSchema.parse(input)

      expect(result).toEqual({})
    })
  })

  // ==========================================================================
  // Update ASN Item Schema
  // ==========================================================================
  describe('updateASNItemSchema', () => {
    it('should accept partial ASN item updates', () => {
      const input = {
        expected_qty: 120,
      }

      const result = updateASNItemSchema.parse(input)

      expect(result.expected_qty).toBe(120)
    })

    it('should validate expected_qty if provided', () => {
      const input = {
        expected_qty: 0,
      }

      expect(() => updateASNItemSchema.parse(input)).toThrow()
    })

    it('should accept supplier_batch_number update', () => {
      const input = {
        supplier_batch_number: 'NEW-BATCH-001',
      }

      const result = updateASNItemSchema.parse(input)

      expect(result.supplier_batch_number).toBe('NEW-BATCH-001')
    })

    it('should validate GTIN if provided', () => {
      const input = {
        gtin: '123',
      }

      expect(() => updateASNItemSchema.parse(input)).toThrow()
    })
  })

  // ==========================================================================
  // Create ASN from PO Schema
  // ==========================================================================
  describe('createASNFromPOSchema', () => {
    const validInput = {
      po_id: '123e4567-e89b-12d3-a456-426614174000',
      expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      carrier: 'FedEx',
      tracking_number: '1234567890',
      notes: 'Auto-populated from PO',
    }

    it('should accept valid create ASN from PO input', () => {
      const result = createASNFromPOSchema.parse(validInput)

      expect(result.po_id).toBe(validInput.po_id)
      expect(result.expected_date).toBe(validInput.expected_date)
    })

    it('should require po_id', () => {
      const input = { ...validInput }
      delete (input as any).po_id

      expect(() => createASNFromPOSchema.parse(input)).toThrow()
    })

    it('should require expected_date', () => {
      const input = { ...validInput }
      delete (input as any).expected_date

      expect(() => createASNFromPOSchema.parse(input)).toThrow()
    })

    it('should accept optional carrier', () => {
      const input = { ...validInput }
      delete (input as any).carrier

      const result = createASNFromPOSchema.parse(input)

      expect(result.carrier).toBeUndefined()
    })

    it('should accept optional item_overrides', () => {
      const input = {
        ...validInput,
        item_overrides: [
          {
            po_line_id: '123e4567-e89b-12d3-a456-426614174001',
            expected_qty: 75,
            supplier_batch_number: 'BATCH-001',
          },
        ],
      }

      const result = createASNFromPOSchema.parse(input)

      expect(result.item_overrides).toHaveLength(1)
    })

    it('should validate item_overrides po_line_id is UUID', () => {
      const input = {
        ...validInput,
        item_overrides: [
          {
            po_line_id: 'invalid-uuid',
          },
        ],
      }

      expect(() => createASNFromPOSchema.parse(input)).toThrow()
    })

    it('should validate item_overrides expected_qty is positive', () => {
      const input = {
        ...validInput,
        item_overrides: [
          {
            po_line_id: '123e4567-e89b-12d3-a456-426614174001',
            expected_qty: -10,
          },
        ],
      }

      expect(() => createASNFromPOSchema.parse(input)).toThrow()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle very large expected_qty values', () => {
      const input = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        expected_qty: 999999.9999,
        uom: 'KG',
      }

      const result = asnItemSchema.parse(input)

      expect(result.expected_qty).toBe(999999.9999)
    })

    it('should handle very small expected_qty values', () => {
      const input = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        expected_qty: 0.0001,
        uom: 'KG',
      }

      const result = asnItemSchema.parse(input)

      expect(result.expected_qty).toBe(0.0001)
    })

    it('should trim whitespace from text fields', () => {
      const input = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        carrier: '  FedEx  ',
        tracking_number: '  1234567890  ',
      }

      const result = asnSchema.parse(input)

      expect(result.carrier).toBe('FedEx')
      expect(result.tracking_number).toBe('1234567890')
    })

    it('should handle long notes field', () => {
      const longNotes = 'A'.repeat(1000)
      const input = {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        notes: longNotes,
      }

      const result = asnSchema.parse(input)

      expect(result.notes).toBe(longNotes)
    })
  })
})
