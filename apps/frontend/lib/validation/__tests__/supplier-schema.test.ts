/**
 * Supplier Schema Validation Tests
 * Story: 03.1 - Suppliers CRUD + Master Data
 * Phase: GREEN - Tests use actual implementation
 *
 * Tests the Zod validation schema for supplier CRUD operations.
 * Covers:
 * - Required field validation (code, name, currency, tax_code_id, payment_terms)
 * - Code format validation (2-20 chars, uppercase alphanumeric + hyphen)
 * - Name validation (2-100 chars)
 * - Email format validation
 * - Optional field validation
 * - Currency enum validation
 * - Payment terms validation
 *
 * Coverage Target: 95%+
 * Test Count: 55+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-02: Supplier Code Format and uniqueness
 * - AC-03: Create Supplier with Required Fields
 * - AC-04: Supplier Field Validation
 */

import { describe, it, expect } from 'vitest'
import {
  supplierSchema,
  createSupplierSchema,
  updateSupplierSchema,
  bulkDeactivateSchema,
  bulkActivateSchema,
  exportSuppliersSchema,
  supplierListQuerySchema,
} from '../supplier-schema'

describe('Story 03.1: supplierSchema Validation', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  describe('Valid Supplier Data', () => {
    it('should accept valid supplier data with all required fields', () => {
      const validData = {
        code: 'SUP-001',
        name: 'Mill Co Ltd',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept supplier with minimum required fields only (AC-03)', () => {
      const minimalData = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('should accept supplier with all optional fields', () => {
      const fullData = {
        code: 'SUP-001',
        name: 'Mill Co Ltd',
        contact_name: 'John Smith',
        contact_email: 'john@mill.com',
        contact_phone: '+48123456789',
        address: 'ul. Zbozowa 10',
        city: 'Warsaw',
        postal_code: '00-001',
        country: 'PL',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
        notes: 'Trusted supplier for grain',
        is_active: true,
      }

      const result = supplierSchema.safeParse(fullData)
      expect(result.success).toBe(true)
    })

    it('should accept supplier with optional fields as empty strings (transforms to null)', () => {
      const dataWithEmptyOptionals = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
        notes: '',
      }

      const result = supplierSchema.safeParse(dataWithEmptyOptionals)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.contact_name).toBeNull()
        expect(result.data.contact_email).toBeNull()
        expect(result.data.notes).toBeNull()
      }
    })

    it('should accept supplier with is_active=false', () => {
      const inactiveSupplier = {
        code: 'SUP-001',
        name: 'Inactive Mill',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
        is_active: false,
      }

      const result = supplierSchema.safeParse(inactiveSupplier)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(false)
      }
    })

    it('should default is_active to true when not provided', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })
  })

  describe('Code Field Validation (AC-02)', () => {
    it('should accept valid code: SUP-001', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid code with minimum 2 characters', () => {
      const data = {
        code: 'AB',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid code with maximum 20 characters', () => {
      const data = {
        code: 'SUPPLIER-00000000001', // 20 chars
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept code with numbers', () => {
      const data = {
        code: 'SUP123',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept code with hyphens', () => {
      const data = {
        code: 'SUP-001-A',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty code', () => {
      const data = {
        code: '',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('should reject code with less than 2 characters', () => {
      const data = {
        code: 'A',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('should reject code with more than 20 characters', () => {
      const data = {
        code: 'SUPPLIER-000000000001', // 21 chars
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 20 characters')
      }
    })

    it('should reject code with lowercase letters', () => {
      const data = {
        code: 'sup-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters, numbers, and hyphens')
      }
    })

    it('should reject code with special characters (@, !, #, etc)', () => {
      const invalidCodes = ['SUP@001', 'SUP!001', 'SUP#001', 'SUP.001', 'SUP_001']

      invalidCodes.forEach((code) => {
        const data = {
          code,
          name: 'Mill Co',
          currency: 'PLN',
          tax_code_id: validUUID,
          payment_terms: 'Net 30',
        }

        const result = supplierSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('uppercase letters, numbers, and hyphens')
        }
      })
    })

    it('should reject code with spaces', () => {
      const data = {
        code: 'SUP 001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters, numbers, and hyphens')
      }
    })
  })

  describe('Name Field Validation', () => {
    it('should accept valid name with 2 characters minimum', () => {
      const data = {
        code: 'SUP-001',
        name: 'AB',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid name with 100 characters maximum', () => {
      const longName = 'A'.repeat(100)
      const data = {
        code: 'SUP-001',
        name: longName,
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept name with special characters and spaces', () => {
      const names = ['Mill & Co', 'Smith Co. Ltd', "John's Mill", 'Cafe Bernard']

      names.forEach((name) => {
        const data = {
          code: 'SUP-001',
          name,
          currency: 'PLN',
          tax_code_id: validUUID,
          payment_terms: 'Net 30',
        }

        const result = supplierSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty name', () => {
      const data = {
        code: 'SUP-001',
        name: '',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('should reject name with less than 2 characters', () => {
      const data = {
        code: 'SUP-001',
        name: 'A',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('should reject name with more than 100 characters', () => {
      const longName = 'A'.repeat(101)
      const data = {
        code: 'SUP-001',
        name: longName,
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 100 characters')
      }
    })
  })

  describe('Email Validation (AC-04)', () => {
    it('should accept valid email format', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_email: 'john@mill.com',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept email with subdomain', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_email: 'john.smith@purchasing.mill.com',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty contact_email (optional field)', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_email: '',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.contact_email).toBeNull()
      }
    })

    it('should reject invalid email format', () => {
      const invalidEmails = ['invalid', 'invalid@', '@invalid.com']

      invalidEmails.forEach((email) => {
        const data = {
          code: 'SUP-001',
          name: 'Mill Co',
          contact_email: email,
          currency: 'PLN',
          tax_code_id: validUUID,
          payment_terms: 'Net 30',
        }

        const result = supplierSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('email')
        }
      })
    })
  })

  describe('Currency Validation', () => {
    it('should accept all supported currencies (PLN, EUR, USD, GBP)', () => {
      const currencies = ['PLN', 'EUR', 'USD', 'GBP'] as const

      currencies.forEach((currency) => {
        const data = {
          code: 'SUP-001',
          name: 'Mill Co',
          currency,
          tax_code_id: validUUID,
          payment_terms: 'Net 30',
        }

        const result = supplierSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject unsupported currency', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'JPY',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject lowercase currency', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'pln',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Tax Code ID Validation', () => {
    it('should accept valid UUID for tax_code_id', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const invalidIds = ['not-a-uuid', '550e8400', '550e8400-e29b-41d4-a716', '12345']

      invalidIds.forEach((id) => {
        const data = {
          code: 'SUP-001',
          name: 'Mill Co',
          currency: 'PLN',
          tax_code_id: id,
          payment_terms: 'Net 30',
        }

        const result = supplierSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid')
        }
      })
    })

    it('should reject empty tax_code_id', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: '',
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Payment Terms Validation', () => {
    it('should accept valid payment terms', () => {
      const paymentTerms = ['Net 30', 'Net 60', '2/10 Net 30', 'COD', 'Prepaid']

      paymentTerms.forEach((terms) => {
        const data = {
          code: 'SUP-001',
          name: 'Mill Co',
          currency: 'PLN',
          tax_code_id: validUUID,
          payment_terms: terms,
        }

        const result = supplierSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty payment_terms', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: '',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should accept payment_terms with maximum 100 characters', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'A'.repeat(100),
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject payment_terms with more than 100 characters', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'A'.repeat(101),
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 100 characters')
      }
    })
  })

  describe('Optional Fields Validation', () => {
    it('should accept contact_name with valid length (max 100)', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_name: 'John Smith',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject contact_name exceeding 100 characters', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_name: 'A'.repeat(101),
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept contact_phone with valid format (max 50)', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        contact_phone: '+48123456789',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept address with valid length (max 200)', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        address: 'ul. Zbozowa 10, 00-001 Warsaw',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept country as ISO 3166-1 alpha-2 code (exactly 2 chars)', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        country: 'PL',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject country code that is not exactly 2 characters', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        country: 'POL',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 3166-1')
      }
    })

    it('should accept notes with valid length (max 1000)', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        notes: 'Trusted supplier for grain. Fast delivery. Good quality.',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject notes with more than 1000 characters', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        notes: 'A'.repeat(1001),
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 1000 characters')
      }
    })
  })

  describe('Missing Required Fields', () => {
    it('should reject missing code field', () => {
      const data = {
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing name field', () => {
      const data = {
        code: 'SUP-001',
        currency: 'PLN',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing currency field', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        tax_code_id: validUUID,
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing tax_code_id field', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        payment_terms: 'Net 30',
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing payment_terms field', () => {
      const data = {
        code: 'SUP-001',
        name: 'Mill Co',
        currency: 'PLN',
        tax_code_id: validUUID,
      }

      const result = supplierSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Update Schema (partial)', () => {
    it('should allow partial updates', () => {
      const partialData = {
        name: 'New Name',
      }

      const result = updateSupplierSchema.safeParse(partialData)
      expect(result.success).toBe(true)
    })

    it('should allow updating single field', () => {
      const result = updateSupplierSchema.safeParse({ payment_terms: 'Net 60' })
      expect(result.success).toBe(true)
    })

    it('should still validate field constraints on update', () => {
      const result = updateSupplierSchema.safeParse({ name: 'A' })
      expect(result.success).toBe(false)
    })
  })

  describe('Bulk Deactivate Schema', () => {
    it('should accept valid supplier_ids array', () => {
      const data = {
        supplier_ids: [validUUID, '660e8400-e29b-41d4-a716-446655440001'],
      }

      const result = bulkDeactivateSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept optional reason', () => {
      const data = {
        supplier_ids: [validUUID],
        reason: 'No longer active vendor',
      }

      const result = bulkDeactivateSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty supplier_ids array', () => {
      const data = {
        supplier_ids: [],
      }

      const result = bulkDeactivateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUIDs in array', () => {
      const data = {
        supplier_ids: ['invalid-id'],
      }

      const result = bulkDeactivateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Bulk Activate Schema', () => {
    it('should accept valid supplier_ids array', () => {
      const data = {
        supplier_ids: [validUUID],
      }

      const result = bulkActivateSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty array', () => {
      const data = {
        supplier_ids: [],
      }

      const result = bulkActivateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Export Schema', () => {
    it('should accept valid export options', () => {
      const data = {
        supplier_ids: [validUUID],
        format: 'xlsx',
        include_products: true,
        include_purchase_history: false,
      }

      const result = exportSuppliersSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should default to empty array for supplier_ids', () => {
      const data = {
        format: 'xlsx',
      }

      const result = exportSuppliersSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.supplier_ids).toEqual([])
      }
    })
  })

  describe('List Query Schema', () => {
    it('should accept valid query params', () => {
      const data = {
        status: 'active',
        search: 'Mill',
        page: '1',
        limit: '20',
        sort: 'name',
        order: 'desc',
      }

      const result = supplierListQuerySchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should apply defaults', () => {
      const data = {}

      const result = supplierListQuerySchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('all')
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sort).toBe('code')
        expect(result.data.order).toBe('asc')
      }
    })

    it('should reject invalid status', () => {
      const data = {
        status: 'invalid',
      }

      const result = supplierListQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should cap limit at 100', () => {
      const data = {
        limit: '200',
      }

      const result = supplierListQuerySchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
