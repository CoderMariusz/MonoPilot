/**
 * Unit Tests: Scanner Output Zod Schemas
 * Story 04.7b: Output Registration Scanner
 *
 * Tests validation schemas for scanner input:
 * - WO barcode validation
 * - Scanner output registration
 * - By-product registration
 * - Print label request
 */

import { describe, it, expect } from 'vitest'
import { z, ZodError } from 'zod'

// Define schemas inline for testing (will be imported from scanner-output.ts when implemented)
const validateWOSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
})

const scannerOutputSchema = z.object({
  wo_id: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  qa_status: z.enum(['approved', 'pending', 'rejected'], {
    required_error: 'QA status is required',
  }),
  batch_number: z.string().min(1, 'Batch number is required'),
  expiry_date: z.string().datetime(),
  location_id: z.string().uuid('Invalid location ID'),
  operator_badge: z.string().optional(),
})

const byProductSchema = z
  .object({
    wo_id: z.string().uuid(),
    main_output_lp_id: z.string().uuid(),
    by_product_id: z.string().uuid(),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
    qa_status: z.enum(['approved', 'pending', 'rejected']),
    batch_number: z.string().min(1),
    expiry_date: z.string().datetime(),
    location_id: z.string().uuid(),
    zero_qty_confirmed: z.boolean().optional(),
  })
  .refine((data) => data.quantity > 0 || data.zero_qty_confirmed === true, {
    message: 'Quantity is 0 and not confirmed',
    path: ['quantity'],
  })

const printLabelSchema = z.object({
  zpl_content: z.string().min(1, 'ZPL content is required'),
  printer_id: z.string().uuid().optional(),
})

describe('Scanner Output Zod Schemas', () => {
  // ============================================================================
  // validateWOSchema - Barcode Validation
  // ============================================================================
  describe('validateWOSchema', () => {
    it('should accept valid barcode string', () => {
      // Arrange
      const input = { barcode: 'WO-2025-0156' }

      // Act
      const result = validateWOSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.barcode).toBe('WO-2025-0156')
      }
    })

    it('should reject empty barcode', () => {
      // Arrange
      const input = { barcode: '' }

      // Act
      const result = validateWOSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Barcode is required')
      }
    })

    it('should reject missing barcode', () => {
      // Arrange
      const input = {}

      // Act
      const result = validateWOSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // scannerOutputSchema - Output Registration
  // ============================================================================
  describe('scannerOutputSchema', () => {
    const validInput = {
      wo_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 250,
      qa_status: 'approved',
      batch_number: 'B-2025-0156',
      expiry_date: '2025-02-14T00:00:00Z',
      location_id: '123e4567-e89b-12d3-a456-426614174001',
    }

    it('should accept valid scanner output input', () => {
      // Act
      const result = scannerOutputSchema.safeParse(validInput)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid wo_id (not UUID)', () => {
      // Arrange
      const input = { ...validInput, wo_id: 'invalid-uuid' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid work order ID')
      }
    })

    it('should reject quantity = 0', () => {
      // Arrange
      const input = { ...validInput, quantity: 0 }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Quantity must be greater than 0')
      }
    })

    it('should reject negative quantity', () => {
      // Arrange
      const input = { ...validInput, quantity: -10 }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept decimal quantity', () => {
      // Arrange
      const input = { ...validInput, quantity: 250.5 }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept qa_status approved', () => {
      // Arrange
      const input = { ...validInput, qa_status: 'approved' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept qa_status pending', () => {
      // Arrange
      const input = { ...validInput, qa_status: 'pending' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept qa_status rejected', () => {
      // Arrange
      const input = { ...validInput, qa_status: 'rejected' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid qa_status', () => {
      // Arrange
      const input = { ...validInput, qa_status: 'invalid' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject empty batch_number', () => {
      // Arrange
      const input = { ...validInput, batch_number: '' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Batch number is required')
      }
    })

    it('should reject invalid expiry_date format', () => {
      // Arrange
      const input = { ...validInput, expiry_date: '2025-02-14' } // Missing time

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept valid ISO datetime for expiry_date', () => {
      // Arrange
      const input = { ...validInput, expiry_date: '2025-02-14T00:00:00.000Z' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid location_id', () => {
      // Arrange
      const input = { ...validInput, location_id: 'not-a-uuid' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid location ID')
      }
    })

    it('should accept optional operator_badge', () => {
      // Arrange
      const input = { ...validInput, operator_badge: 'OP-12345' }

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.operator_badge).toBe('OP-12345')
      }
    })

    it('should accept missing operator_badge', () => {
      // Arrange
      const input = { ...validInput }
      delete (input as Record<string, unknown>).operator_badge

      // Act
      const result = scannerOutputSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // byProductSchema - By-Product Registration
  // ============================================================================
  describe('byProductSchema', () => {
    const validByProductInput = {
      wo_id: '123e4567-e89b-12d3-a456-426614174000',
      main_output_lp_id: '123e4567-e89b-12d3-a456-426614174002',
      by_product_id: '123e4567-e89b-12d3-a456-426614174003',
      quantity: 45,
      qa_status: 'approved' as const,
      batch_number: 'B-2025-0156-BP1',
      expiry_date: '2025-02-14T00:00:00Z',
      location_id: '123e4567-e89b-12d3-a456-426614174001',
    }

    it('should accept valid by-product input', () => {
      // Act
      const result = byProductSchema.safeParse(validByProductInput)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept quantity = 0 when zero_qty_confirmed is true', () => {
      // Arrange
      const input = { ...validByProductInput, quantity: 0, zero_qty_confirmed: true }

      // Act
      const result = byProductSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject quantity = 0 without zero_qty_confirmed', () => {
      // Arrange
      const input = { ...validByProductInput, quantity: 0 }

      // Act
      const result = byProductSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Quantity is 0 and not confirmed')
      }
    })

    it('should reject quantity = 0 when zero_qty_confirmed is false', () => {
      // Arrange
      const input = { ...validByProductInput, quantity: 0, zero_qty_confirmed: false }

      // Act
      const result = byProductSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject negative quantity', () => {
      // Arrange
      const input = { ...validByProductInput, quantity: -5 }

      // Act
      const result = byProductSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Quantity cannot be negative')
      }
    })

    it('should require main_output_lp_id as valid UUID', () => {
      // Arrange
      const input = { ...validByProductInput, main_output_lp_id: 'invalid' }

      // Act
      const result = byProductSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should require by_product_id as valid UUID', () => {
      // Arrange
      const input = { ...validByProductInput, by_product_id: 'invalid' }

      // Act
      const result = byProductSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // printLabelSchema - Print Label Request
  // ============================================================================
  describe('printLabelSchema', () => {
    it('should accept valid ZPL content', () => {
      // Arrange
      const input = {
        zpl_content: '^XA^FO50,50^BY3^BC,100,Y,N,N^FD123456^FS^XZ',
      }

      // Act
      const result = printLabelSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject empty ZPL content', () => {
      // Arrange
      const input = { zpl_content: '' }

      // Act
      const result = printLabelSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('ZPL content is required')
      }
    })

    it('should accept optional printer_id', () => {
      // Arrange
      const input = {
        zpl_content: '^XA^XZ',
        printer_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      // Act
      const result = printLabelSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid printer_id (not UUID)', () => {
      // Arrange
      const input = {
        zpl_content: '^XA^XZ',
        printer_id: 'invalid-printer',
      }

      // Act
      const result = printLabelSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept missing printer_id', () => {
      // Arrange
      const input = { zpl_content: '^XA^XZ' }

      // Act
      const result = printLabelSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * validateWOSchema (3 tests):
 *   - Valid barcode
 *   - Empty barcode rejection
 *   - Missing barcode rejection
 *
 * scannerOutputSchema (15 tests):
 *   - Valid input acceptance
 *   - Invalid wo_id rejection
 *   - Zero/negative quantity rejection
 *   - Decimal quantity acceptance
 *   - QA status validation (approved/pending/rejected)
 *   - Invalid QA status rejection
 *   - Empty batch_number rejection
 *   - Expiry date format validation
 *   - Invalid location_id rejection
 *   - Optional operator_badge
 *
 * byProductSchema (7 tests):
 *   - Valid input acceptance
 *   - Zero qty with confirmation
 *   - Zero qty without confirmation rejection
 *   - Zero qty with false confirmation rejection
 *   - Negative qty rejection
 *   - UUID validation
 *
 * printLabelSchema (5 tests):
 *   - Valid ZPL content
 *   - Empty ZPL rejection
 *   - Optional printer_id
 *   - Invalid printer_id rejection
 *   - Missing printer_id acceptance
 *
 * Total: 30 tests
 */
