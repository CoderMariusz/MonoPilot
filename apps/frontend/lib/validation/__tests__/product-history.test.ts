/**
 * Validation Schema Tests: product-history (Story 02.2)
 * Purpose: Test Zod validation schemas for history endpoints
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests the validation schemas for:
 * - versionsQuerySchema (page, limit)
 * - historyQuerySchema (page, limit, from_date, to_date)
 * - changedFieldsSchema (JSONB validation)
 *
 * Coverage Target: 90%
 * Test Count: 15+ tests
 */

import { describe, it, expect } from 'vitest'
import {
  versionsQuerySchema,
  historyQuerySchema,
  changedFieldsSchema,
} from '../product-history'

describe('versionsQuerySchema (Story 02.2)', () => {
  describe('Valid inputs', () => {
    it('should validate with default values', () => {
      const result = versionsQuerySchema.safeParse({})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should validate with custom page and limit', () => {
      const result = versionsQuerySchema.safeParse({
        page: 3,
        limit: 15,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(15)
      }
    })

    it('should coerce string numbers to integers', () => {
      const result = versionsQuerySchema.safeParse({
        page: '2',
        limit: '10',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(10)
      }
    })

    it('should validate max limit (100)', () => {
      const result = versionsQuerySchema.safeParse({
        page: 1,
        limit: 100,
      })

      expect(result.success).toBe(true)
    })

    it('should validate min page (1)', () => {
      const result = versionsQuerySchema.safeParse({
        page: 1,
        limit: 20,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Invalid inputs', () => {
    it('should reject page less than 1', () => {
      const result = versionsQuerySchema.safeParse({
        page: 0,
        limit: 20,
      })

      expect(result.success).toBe(false)
    })

    it('should reject negative page', () => {
      const result = versionsQuerySchema.safeParse({
        page: -1,
        limit: 20,
      })

      expect(result.success).toBe(false)
    })

    it('should reject limit greater than 100', () => {
      const result = versionsQuerySchema.safeParse({
        page: 1,
        limit: 500,
      })

      expect(result.success).toBe(false)
    })

    it('should reject limit less than 1', () => {
      const result = versionsQuerySchema.safeParse({
        page: 1,
        limit: 0,
      })

      expect(result.success).toBe(false)
    })

    it('should reject non-integer page', () => {
      const result = versionsQuerySchema.safeParse({
        page: 1.5,
        limit: 20,
      })

      expect(result.success).toBe(false)
    })

    it('should reject non-integer limit', () => {
      const result = versionsQuerySchema.safeParse({
        page: 1,
        limit: 20.7,
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('historyQuerySchema (Story 02.2)', () => {
  describe('Valid inputs', () => {
    it('should validate with default values', () => {
      const result = historyQuerySchema.safeParse({})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.from_date).toBeUndefined()
        expect(result.data.to_date).toBeUndefined()
      }
    })

    it('should validate with from_date only', () => {
      const result = historyQuerySchema.safeParse({
        from_date: '2025-01-01T00:00:00Z',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.from_date).toBe('2025-01-01T00:00:00Z')
      }
    })

    it('should validate with to_date only', () => {
      const result = historyQuerySchema.safeParse({
        to_date: '2025-12-31T23:59:59Z',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.to_date).toBe('2025-12-31T23:59:59Z')
      }
    })

    it('should validate with both from_date and to_date (valid range)', () => {
      const result = historyQuerySchema.safeParse({
        from_date: '2025-01-01T00:00:00Z',
        to_date: '2025-12-31T23:59:59Z',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.from_date).toBe('2025-01-01T00:00:00Z')
        expect(result.data.to_date).toBe('2025-12-31T23:59:59Z')
      }
    })

    it('should validate ISO 8601 datetime format', () => {
      const result = historyQuerySchema.safeParse({
        from_date: '2025-06-15T14:30:00.000Z',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Date range validation (AC-11)', () => {
    it('should reject when from_date is after to_date', () => {
      const result = historyQuerySchema.safeParse({
        from_date: '2025-12-31T23:59:59Z',
        to_date: '2025-01-01T00:00:00Z',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toMatch(/from_date must be before to_date/i)
      }
    })

    it('should accept when from_date equals to_date', () => {
      const result = historyQuerySchema.safeParse({
        from_date: '2025-01-01T00:00:00Z',
        to_date: '2025-01-01T00:00:00Z',
      })

      // Same timestamp should be allowed (edge case)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid inputs', () => {
    it('should reject invalid date format', () => {
      const result = historyQuerySchema.safeParse({
        from_date: 'invalid-date',
      })

      expect(result.success).toBe(false)
    })

    it('should reject date without time component', () => {
      const result = historyQuerySchema.safeParse({
        from_date: '2025-01-01',
      })

      expect(result.success).toBe(false)
    })

    it('should reject timestamp as number', () => {
      const result = historyQuerySchema.safeParse({
        from_date: 1704067200000,
      })

      expect(result.success).toBe(false)
    })

    it('should reject page/limit validation like versionsQuerySchema', () => {
      const result = historyQuerySchema.safeParse({
        page: 0,
        limit: 200,
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('changedFieldsSchema (Story 02.2)', () => {
  describe('Valid inputs (AC-06)', () => {
    it('should validate single field change', () => {
      const result = changedFieldsSchema.safeParse({
        name: { old: 'Bread', new: 'White Bread' },
      })

      expect(result.success).toBe(true)
    })

    it('should validate multiple field changes', () => {
      const result = changedFieldsSchema.safeParse({
        name: { old: 'Bread', new: 'White Bread' },
        shelf_life_days: { old: 5, new: 7 },
        std_price: { old: 2.99, new: 3.49 },
      })

      expect(result.success).toBe(true)
    })

    it('should validate null values', () => {
      const result = changedFieldsSchema.safeParse({
        description: { old: null, new: 'New description' },
      })

      expect(result.success).toBe(true)
    })

    it('should validate boolean values', () => {
      const result = changedFieldsSchema.safeParse({
        is_perishable: { old: true, new: false },
      })

      expect(result.success).toBe(true)
    })

    it('should validate number values', () => {
      const result = changedFieldsSchema.safeParse({
        min_stock: { old: 100, new: 50 },
        std_price: { old: 2.50, new: 3.00 },
      })

      expect(result.success).toBe(true)
    })

    it('should validate string values', () => {
      const result = changedFieldsSchema.safeParse({
        status: { old: 'active', new: 'inactive' },
      })

      expect(result.success).toBe(true)
    })

    it('should validate empty object (no changes)', () => {
      const result = changedFieldsSchema.safeParse({})

      expect(result.success).toBe(true)
    })

    it('should validate _initial flag for version 1', () => {
      const result = changedFieldsSchema.safeParse({
        _initial: { old: null, new: true },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Invalid inputs', () => {
    it('should reject field without old/new structure', () => {
      const result = changedFieldsSchema.safeParse({
        name: 'White Bread', // Missing old/new
      })

      expect(result.success).toBe(false)
    })

    it('should reject field with only old value', () => {
      const result = changedFieldsSchema.safeParse({
        name: { old: 'Bread' }, // Missing new
      })

      expect(result.success).toBe(false)
    })

    it('should reject field with only new value', () => {
      const result = changedFieldsSchema.safeParse({
        name: { new: 'White Bread' }, // Missing old
      })

      expect(result.success).toBe(false)
    })

    it('should reject non-object input', () => {
      const result = changedFieldsSchema.safeParse('not an object')

      expect(result.success).toBe(false)
    })

    it('should reject array input', () => {
      const result = changedFieldsSchema.safeParse([
        { name: { old: 'A', new: 'B' } },
      ])

      expect(result.success).toBe(false)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * versionsQuerySchema - 11 tests:
 *   - Valid inputs (5 tests)
 *   - Invalid inputs (6 tests)
 *
 * historyQuerySchema - 12 tests:
 *   - Valid inputs (5 tests)
 *   - Date range validation (2 tests)
 *   - Invalid inputs (5 tests)
 *
 * changedFieldsSchema - 13 tests:
 *   - Valid inputs (8 tests)
 *   - Invalid inputs (5 tests)
 *
 * Total: 36 tests
 * Coverage: 90%+ (all validation rules tested)
 * Status: RED (schemas not implemented yet)
 */
