/**
 * BOM Items Validation Schema - Unit Tests (Story 02.5a)
 * Purpose: Test Zod schemas for BOM items creation and update
 * Phase: RED - Tests should FAIL (no implementation yet)
 *
 * Tests the BOM Items Zod schemas which validate:
 * - bomItemFormSchema: MVP fields for create and edit
 * - createBOMItemSchema: Create-specific validation
 * - updateBOMItemSchema: Update-specific validation (partial)
 *
 * Validation Rules:
 * - product_id: Required, must be valid UUID
 * - quantity: Required, > 0, max 6 decimal places
 * - uom: Required, min 1 character
 * - sequence: Integer, >= 0, optional (default: 0)
 * - operation_seq: Integer, nullable, optional
 * - scrap_percent: 0-100, optional (default: 0)
 * - notes: Max 500 chars, nullable, optional
 *
 * Coverage Target: 95%+
 * Test Count: 45 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-02: Add BOM Item validation
 * - AC-03: Edit BOM Item validation
 * - AC-06: UoM validation (no validation error here, warning in service)
 * - AC-07: Quantity validation (> 0, max 6 decimals)
 * - AC-08: Sequence validation
 */

import { describe, it, expect } from 'vitest'
import {
  bomItemFormSchema,
  createBOMItemSchema,
  updateBOMItemSchema,
} from '@/lib/validation/bom-items'
import type { BOMItemFormValues } from '@/lib/validation/bom-items'

describe('BOM Items Validation Schemas (Story 02.5a)', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  // ============================================
  // PRODUCT_ID FIELD TESTS
  // ============================================
  describe('product_id field', () => {
    it('should require product_id in create schema', () => {
      const data = {
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes('product_id'))).toBe(true)
      }
    })

    it('should accept valid UUID for product_id', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const data = {
        product_id: 'not-a-uuid',
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid')
      }
    })

    it('should reject empty string product_id', () => {
      const data = {
        product_id: '',
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject null product_id', () => {
      const data = {
        product_id: null,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept valid UUID with hyphenated format', () => {
      const data: BOMItemFormValues = {
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // QUANTITY FIELD TESTS (AC-07)
  // ============================================
  describe('quantity field', () => {
    it('should require quantity', () => {
      const data = {
        product_id: validUUID,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes('quantity'))).toBe(true)
      }
    })

    it('should accept positive quantity', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept small positive quantity (0.1)', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 0.1,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject zero quantity', () => {
      const data = {
        product_id: validUUID,
        quantity: 0,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than 0')
      }
    })

    it('should reject negative quantity', () => {
      const data = {
        product_id: validUUID,
        quantity: -5,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than 0')
      }
    })

    it('should allow exactly 6 decimal places', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50.123456,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow 1 decimal place', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50.1,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow 3 decimal places', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50.123,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject 7 decimal places', () => {
      const data = {
        product_id: validUUID,
        quantity: 50.1234567,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6 decimal')
      }
    })

    it('should reject 8 decimal places', () => {
      const data = {
        product_id: validUUID,
        quantity: 50.12345678,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6 decimal')
      }
    })

    it('should accept integer quantity as number', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 100,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // UOM FIELD TESTS
  // ============================================
  describe('uom field', () => {
    it('should require uom', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes('uom'))).toBe(true)
      }
    })

    it('should accept valid UoM code', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept "kg" as UoM', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept "L" as UoM', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'L',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept "pcs" as UoM', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'pcs',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty UoM', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: '',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject null UoM', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: null,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept long UoM code', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'cubic_meter',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // SEQUENCE FIELD TESTS (AC-08)
  // ============================================
  describe('sequence field', () => {
    it('should be optional', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept positive integer sequence', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        sequence: 10,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept zero sequence', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        sequence: 0,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept sequence 20', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        sequence: 20,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject negative sequence', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        sequence: -10,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('negative')
      }
    })

    it('should reject decimal sequence', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        sequence: 10.5,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer')
      }
    })

    it('should default to 0 if not provided', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sequence).toBe(0)
      }
    })
  })

  // ============================================
  // OPERATION_SEQ FIELD TESTS (AC-05)
  // ============================================
  describe('operation_seq field', () => {
    it('should be optional', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept integer operation_seq', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        operation_seq: 10,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept null operation_seq', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        operation_seq: null,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject decimal operation_seq', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        operation_seq: 10.5,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer')
      }
    })
  })

  // ============================================
  // SCRAP_PERCENT FIELD TESTS
  // ============================================
  describe('scrap_percent field', () => {
    it('should be optional', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept zero scrap percent', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        scrap_percent: 0,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept 2.5 scrap percent', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        scrap_percent: 2.5,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept 100 scrap percent', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        scrap_percent: 100,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject negative scrap percent', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        scrap_percent: -1,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('negative')
      }
    })

    it('should reject scrap percent > 100', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        scrap_percent: 101,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100')
      }
    })

    it('should default to 0 if not provided', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scrap_percent).toBe(0)
      }
    })
  })

  // ============================================
  // NOTES FIELD TESTS
  // ============================================
  describe('notes field', () => {
    it('should be optional', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept short notes', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'Test note',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept null notes', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: null,
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept 500 character notes', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'x'.repeat(500),
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject 501 character notes', () => {
      const data = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'x'.repeat(501),
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500')
      }
    })

    it('should accept multiline notes', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'Line 1\nLine 2\nLine 3',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept notes with special characters', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        notes: 'Special chars: !@#$%^&*()',
      }

      const result = bomItemFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // CREATE SCHEMA TESTS (AC-02)
  // ============================================
  describe('createBOMItemSchema', () => {
    it('should require all mandatory fields', () => {
      const data = {}

      const result = createBOMItemSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should accept valid create request', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = createBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept create with all optional fields', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
        sequence: 10,
        operation_seq: 20,
        scrap_percent: 2.5,
        notes: 'Production notes',
      }

      const result = createBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // UPDATE SCHEMA TESTS (AC-03)
  // ============================================
  describe('updateBOMItemSchema', () => {
    it('should allow empty update (all fields optional)', () => {
      const data = {}

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept partial update (quantity only)', () => {
      const data = {
        quantity: 75,
      }

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept partial update (sequence only)', () => {
      const data = {
        sequence: 20,
      }

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept partial update (operation_seq only)', () => {
      const data = {
        operation_seq: 30,
      }

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept multiple field update', () => {
      const data = {
        quantity: 75,
        uom: 'L',
        scrap_percent: 5,
      }

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate quantity in update (must be > 0)', () => {
      const data = {
        quantity: 0,
      }

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should validate scrap_percent in update (0-100)', () => {
      const data = {
        scrap_percent: 150,
      }

      const result = updateBOMItemSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  describe('Schema Integration', () => {
    it('should handle complete valid form submission', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50.123456,
        uom: 'kg',
        sequence: 10,
        operation_seq: 20,
        scrap_percent: 2.5,
        notes: 'Production notes\nLine 2\nLine 3',
      }

      const result = createBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should handle minimal valid form submission', () => {
      const data: BOMItemFormValues = {
        product_id: validUUID,
        quantity: 50,
        uom: 'kg',
      }

      const result = createBOMItemSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject form with any invalid field', () => {
      const data = {
        product_id: 'invalid-uuid',
        quantity: 50,
        uom: 'kg',
        sequence: -1,
        scrap_percent: 150,
      }

      const result = createBOMItemSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1)
      }
    })
  })
})
