/**
 * PO Bulk Schemas Validation Tests
 * Story: 03.6 - PO Bulk Operations
 * Phase: GREEN - Implementation exists
 *
 * Tests Zod schemas for:
 * - BulkPOImportRowSchema (single row validation)
 * - BulkCreatePORequestSchema (bulk create API request)
 * - BulkStatusUpdateSchema (bulk status update request)
 * - POExportRequestSchema (export request)
 *
 * Coverage Target: 90%+
 * Test Count: 50+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-02: Excel/CSV Import with Validation
 * - AC-04: Excel Export (3 Sheets)
 * - AC-05: Bulk Status Update
 * - AC-08: Validation Schemas
 */

import { describe, it, expect } from 'vitest'
import {
  BulkPOImportRowSchema,
  BulkCreatePORequestSchema,
  BulkStatusUpdateSchema,
  POExportRequestSchema,
} from '../po-bulk-schemas'

describe('Story 03.6: PO Bulk Schemas - Validation', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  describe('BulkPOImportRowSchema - Single Row Validation', () => {
    describe('Valid Row Data (AC-08)', () => {
      it('should accept row with product_code and quantity only', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 500,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should accept row with all optional fields', () => {
        const fullRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 500,
          expected_delivery: '2025-01-10',
          unit_price: 1.20,
          notes: 'Urgent order',
          warehouse_code: 'WH-MAIN',
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(fullRow)
        expect(result.success).toBe(true)
      })

      it('should accept large quantity values', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 999999.99,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should accept decimal quantities', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 123.45,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should accept decimal unit prices', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 500,
          unit_price: 1.234567,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should accept zero unit price (free product)', () => {
        const validRow = {
          product_code: 'RM-FREE-001',
          quantity: 100,
          unit_price: 0,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should accept notes up to 500 characters', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          notes: 'x'.repeat(500),
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid - Required Fields (AC-08)', () => {
      it('should reject row missing product_code', () => {
        const invalidRow = {
          quantity: 500,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.path.includes('product_code'))).toBe(true)
        }
      })

      it('should reject row with empty product_code', () => {
        const invalidRow = {
          product_code: '',
          quantity: 500,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should reject row with null product_code', () => {
        const invalidRow = {
          product_code: null,
          quantity: 500,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should reject row missing quantity', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.path.includes('quantity'))).toBe(true)
        }
      })

      it('should reject row with null quantity', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: null,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })
    })

    describe('Invalid - Quantity Validation (AC-08)', () => {
      it('should reject zero quantity', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 0,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should reject negative quantity', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: -100,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should reject quantity exceeding max limit', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 1000000.00,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should reject non-numeric quantity', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 'five hundred',
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })
    })

    describe('Invalid - Product Code Format (AC-08)', () => {
      it('should reject product_code exceeding max length (50 chars)', () => {
        const invalidRow = {
          product_code: 'RM-' + 'A'.repeat(50),
          quantity: 100,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should accept product_code at max length (50 chars)', () => {
        const validRow = {
          product_code: 'RM-' + 'A'.repeat(47), // total 50
          quantity: 100,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid - Optional Field Validation (AC-08)', () => {
      it('should reject negative unit_price', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          unit_price: -1.50,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should reject invalid ISO date format', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          expected_delivery: 'invalid-date',
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should accept valid ISO date format', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          expected_delivery: '2025-01-10',
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should reject notes exceeding 500 characters', () => {
        const invalidRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          notes: 'x'.repeat(501),
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(invalidRow)
        expect(result.success).toBe(false)
      })

      it('should accept empty notes (optional)', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          notes: '',
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it('should accept null optional fields', () => {
        const validRow = {
          product_code: 'RM-FLOUR-001',
          quantity: 100,
          unit_price: null,
          notes: null,
          expected_delivery: null,
        }

        // Act & Assert
        const result = BulkPOImportRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('BulkCreatePORequestSchema - API Request', () => {
    describe('Valid Request Data', () => {
      it('should accept minimal valid request', () => {
        const validRequest = {
          products: [
            { product_code: 'RM-FLOUR-001', quantity: 500 },
            { product_code: 'RM-SUGAR-001', quantity: 400 },
          ],
        }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept request with all optional fields', () => {
        const validRequest = {
          products: [
            { product_code: 'RM-FLOUR-001', quantity: 500, unit_price: 1.20 },
          ],
          default_warehouse_id: validUUID,
          default_expected_delivery: '2025-01-10',
        }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept request with max items (500)', () => {
        const products = Array.from({ length: 500 }, (_, i) => ({
          product_code: `RM-PRODUCT-${i}`,
          quantity: 100,
        }))
        const validRequest = { products }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Request Data', () => {
      it('should reject empty products array', () => {
        const invalidRequest = {
          products: [],
        }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject products exceeding max items (500)', () => {
        const products = Array.from({ length: 501 }, (_, i) => ({
          product_code: `RM-PRODUCT-${i}`,
          quantity: 100,
        }))
        const invalidRequest = { products }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid warehouse UUID', () => {
        const invalidRequest = {
          products: [
            { product_code: 'RM-FLOUR-001', quantity: 500 },
          ],
          default_warehouse_id: 'not-a-uuid',
        }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid expected_delivery format', () => {
        const invalidRequest = {
          products: [
            { product_code: 'RM-FLOUR-001', quantity: 500 },
          ],
          default_expected_delivery: 'invalid-date',
        }

        // Act & Assert
        const result = BulkCreatePORequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('BulkStatusUpdateSchema - Status Update Request', () => {
    describe('Valid Request Data', () => {
      it('should accept approve action with valid PO IDs', () => {
        const validRequest = {
          po_ids: [validUUID, validUUID],
          action: 'approve',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept reject action', () => {
        const validRequest = {
          po_ids: [validUUID],
          action: 'reject',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept cancel action', () => {
        const validRequest = {
          po_ids: [validUUID],
          action: 'cancel',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept confirm action', () => {
        const validRequest = {
          po_ids: [validUUID],
          action: 'confirm',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept request with reason text', () => {
        const validRequest = {
          po_ids: [validUUID],
          action: 'reject',
          reason: 'Supplier failed to respond',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept max PO count (100)', () => {
        const po_ids = Array.from({ length: 100 }, () => validUUID)
        const validRequest = {
          po_ids,
          action: 'approve',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Request Data (AC-05)', () => {
      it('should reject empty po_ids array', () => {
        const invalidRequest = {
          po_ids: [],
          action: 'approve',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid action value (AC-05)', () => {
        const invalidRequest = {
          po_ids: [validUUID],
          action: 'invalid',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid PO UUID format', () => {
        const invalidRequest = {
          po_ids: ['not-a-uuid'],
          action: 'approve',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject reason exceeding max length (500)', () => {
        const invalidRequest = {
          po_ids: [validUUID],
          action: 'reject',
          reason: 'x'.repeat(501),
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject po_ids count exceeding max (100)', () => {
        const po_ids = Array.from({ length: 101 }, () => validUUID)
        const invalidRequest = {
          po_ids,
          action: 'approve',
        }

        // Act & Assert
        const result = BulkStatusUpdateSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('POExportRequestSchema - Export Request', () => {
    describe('Valid Request Data (AC-04)', () => {
      it('should accept request with selected PO IDs', () => {
        const validRequest = {
          po_ids: [validUUID, validUUID, validUUID],
        }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept request with filters only', () => {
        const validRequest = {
          filters: {
            status: 'draft',
            supplier_id: validUUID,
            date_from: '2025-01-01',
            date_to: '2025-01-31',
          },
        }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept request with po_ids and filters', () => {
        const validRequest = {
          po_ids: [validUUID],
          filters: {
            status: 'draft',
          },
        }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept empty request (export all)', () => {
        const validRequest = {}

        // Act & Assert
        const result = POExportRequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })

      it('should accept max PO count for export (1000)', () => {
        const po_ids = Array.from({ length: 1000 }, () => validUUID)
        const validRequest = { po_ids }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(validRequest)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Request Data (AC-04)', () => {
      it('should reject po_ids exceeding export limit (1000)', () => {
        const po_ids = Array.from({ length: 1001 }, () => validUUID)
        const invalidRequest = { po_ids }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid PO UUID format', () => {
        const invalidRequest = {
          po_ids: ['invalid-uuid'],
        }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid supplier_id UUID', () => {
        const invalidRequest = {
          filters: {
            supplier_id: 'not-a-uuid',
          },
        }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })

      it('should reject invalid status filter value', () => {
        const invalidRequest = {
          filters: {
            status: 'invalid-status',
          },
        }

        // Act & Assert
        const result = POExportRequestSchema.safeParse(invalidRequest)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Schema Type Safety', () => {
    it('should infer correct types from BulkCreatePORequestSchema', () => {
      // This test verifies TypeScript inference - no runtime assertion needed
      const result = BulkCreatePORequestSchema.safeParse({
        products: [
          { product_code: 'RM-001', quantity: 100 },
        ],
      })
      if (result.success) {
        const data = result.data
        // TypeScript should know: data.products[0].product_code is string
        expect(typeof data.products[0].product_code).toBe('string')
        // TypeScript should know: data.products[0].quantity is number
        expect(typeof data.products[0].quantity).toBe('number')
      }
      expect(result.success).toBe(true)
    })
  })
})
