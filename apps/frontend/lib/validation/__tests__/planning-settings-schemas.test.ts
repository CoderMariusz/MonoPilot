/**
 * Unit Tests: Planning Settings Validation Schemas
 * Story: 03.17 - Planning Settings (Module Configuration)
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests Zod validation schemas for planning settings:
 * - Auto-number format validation (must contain YYYY and NNNNN)
 * - Prefix validation (1-10 chars, alphanumeric + dash only)
 * - Numeric range validation (thresholds, limits, transit days, etc.)
 * - Boolean toggle validation
 * - Array validation (approval roles)
 * - Enum validation (payment terms, currency)
 * - Partial updates support
 *
 * Coverage Target: 90%
 * Test Count: 40+ tests
 */

import { describe, it, expect } from 'vitest'
import {
  planningSettingsSchema,
  planningSettingsUpdateSchema,
  type PlanningSettingsInput,
} from '@/lib/validation/planning-settings-schemas'
import { PLANNING_SETTINGS_DEFAULTS } from '@/lib/types/planning-settings'

describe('03.17 Planning Settings Schemas', () => {
  describe('Auto-Number Format Validation', () => {
    it('should accept valid format YYYY-NNNNN', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_format: 'YYYY-NNNNN',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.po_auto_number_format).toBe('YYYY-NNNNN')
      }
    })

    it('should accept valid format NNNNN-YYYY', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_format: 'NNNNN-YYYY',
      })

      expect(result.success).toBe(true)
    })

    it('should accept format with prefix PO-YYYY-NNNNN', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_format: 'PO-YYYY-NNNNN',
      })

      expect(result.success).toBe(true)
    })

    it('should reject format missing YYYY', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_format: 'NNNNN',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('YYYY')
      }
    })

    it('should reject format missing NNNNN', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_format: 'YYYY',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('NNNNN')
      }
    })

    it('should reject format with neither YYYY nor NNNNN', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_format: 'INVALID',
      })

      expect(result.success).toBe(false)
    })

    it('should validate TO auto-number format', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_auto_number_format: 'TO-YYYY-NNNNN',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid TO auto-number format', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_auto_number_format: 'YYYY-INVALID',
      })

      expect(result.success).toBe(false)
    })

    it('should validate WO auto-number format', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_auto_number_format: 'WO-YYYY-NNNNN',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Auto-Number Prefix Validation', () => {
    it('should accept valid prefix PO-', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PO-',
      })

      expect(result.success).toBe(true)
    })

    it('should accept single character prefix', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'P',
      })

      expect(result.success).toBe(true)
    })

    it('should accept alphanumeric prefix', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'P2O1-',
      })

      expect(result.success).toBe(true)
    })

    it('should accept 10 character prefix', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PO-12345-X',
      })

      expect(result.success).toBe(true)
    })

    it('should reject empty prefix', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('cannot be empty')
      }
    })

    it('should reject prefix over 10 characters', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PURCHASE-ORDER-',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('max 10')
      }
    })

    it('should reject prefix with invalid characters @', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PO@',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('alphanumeric')
      }
    })

    it('should reject prefix with invalid characters #', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PO#',
      })

      expect(result.success).toBe(false)
    })

    it('should reject prefix with invalid characters $', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PO$',
      })

      expect(result.success).toBe(false)
    })

    it('should reject prefix with spaces', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_auto_number_prefix: 'PO ',
      })

      expect(result.success).toBe(false)
    })

    it('should validate TO prefix', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_auto_number_prefix: 'TO-',
      })

      expect(result.success).toBe(true)
    })

    it('should validate WO prefix', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_auto_number_prefix: 'WO-',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Approval Threshold Validation', () => {
    it('should accept null approval threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_threshold: null,
      })

      expect(result.success).toBe(true)
    })

    it('should accept positive approval threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_threshold: 5000,
      })

      expect(result.success).toBe(true)
    })

    it('should accept zero approval threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_threshold: 0,
      })

      expect(result.success).toBe(true)
    })

    it('should reject negative approval threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_threshold: -100,
      })

      expect(result.success).toBe(false)
    })

    it('should accept decimal approval threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_threshold: 5000.50,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Overproduction Limit Validation', () => {
    it('should accept 0% limit', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_overproduction_limit: 0,
      })

      expect(result.success).toBe(true)
    })

    it('should accept 10% limit', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_overproduction_limit: 10,
      })

      expect(result.success).toBe(true)
    })

    it('should accept 100% limit', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_overproduction_limit: 100,
      })

      expect(result.success).toBe(true)
    })

    it('should reject negative limit', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_overproduction_limit: -5,
      })

      expect(result.success).toBe(false)
    })

    it('should reject limit over 100%', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_overproduction_limit: 150,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('0-100')
      }
    })
  })

  describe('Transit Days Validation', () => {
    it('should accept 0 transit days', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_default_transit_days: 0,
      })

      expect(result.success).toBe(true)
    })

    it('should accept 1 transit day', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_default_transit_days: 1,
      })

      expect(result.success).toBe(true)
    })

    it('should accept 365 transit days', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_default_transit_days: 365,
      })

      expect(result.success).toBe(true)
    })

    it('should reject negative transit days', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_default_transit_days: -1,
      })

      expect(result.success).toBe(false)
    })

    it('should reject transit days over 365', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_default_transit_days: 400,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('365')
      }
    })

    it('should reject decimal transit days', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        to_default_transit_days: 1.5,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Scheduling Buffer Validation', () => {
    it('should accept 0 hours buffer', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_default_scheduling_buffer_hours: 0,
      })

      expect(result.success).toBe(true)
    })

    it('should accept 2 hours buffer', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_default_scheduling_buffer_hours: 2,
      })

      expect(result.success).toBe(true)
    })

    it('should accept 168 hours buffer (1 week)', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_default_scheduling_buffer_hours: 168,
      })

      expect(result.success).toBe(true)
    })

    it('should reject negative buffer', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_default_scheduling_buffer_hours: -1,
      })

      expect(result.success).toBe(false)
    })

    it('should reject buffer over 168 hours', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_default_scheduling_buffer_hours: 200,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('168')
      }
    })

    it('should reject decimal buffer hours', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        wo_default_scheduling_buffer_hours: 2.5,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Toggle/Boolean Validation', () => {
    it('should accept po_require_approval true', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_require_approval: true,
      })

      expect(result.success).toBe(true)
    })

    it('should accept po_require_approval false', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_require_approval: false,
      })

      expect(result.success).toBe(true)
    })

    it('should accept all boolean fields', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_require_approval: true,
        to_allow_partial_shipments: false,
        to_require_lp_selection: true,
        wo_material_check: false,
        wo_copy_routing: true,
        wo_auto_select_bom: false,
        wo_require_bom: true,
        wo_allow_overproduction: false,
      })

      expect(result.success).toBe(true)
    })

    it('should reject non-boolean value', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_require_approval: 'true',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Approval Roles Array Validation', () => {
    it('should accept array of valid roles', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_roles: ['admin', 'manager'],
      })

      expect(result.success).toBe(true)
    })

    it('should accept single role in array', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_roles: ['admin'],
      })

      expect(result.success).toBe(true)
    })

    it('should reject empty array', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_roles: [],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one')
      }
    })

    it('should reject non-array value', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_approval_roles: 'admin',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Payment Terms Enum Validation', () => {
    it('should accept Net 30', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_payment_terms: 'Net 30',
      })

      expect(result.success).toBe(true)
    })

    it('should accept Net 60', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_payment_terms: 'Net 60',
      })

      expect(result.success).toBe(true)
    })

    it('should accept Net 90', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_payment_terms: 'Net 90',
      })

      expect(result.success).toBe(true)
    })

    it('should accept 2/10 Net 30', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_payment_terms: '2/10 Net 30',
      })

      expect(result.success).toBe(true)
    })

    it('should accept Due on Receipt', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_payment_terms: 'Due on Receipt',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid payment terms', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_payment_terms: 'Net 120',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Currency Enum Validation', () => {
    it('should accept PLN', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_currency: 'PLN',
      })

      expect(result.success).toBe(true)
    })

    it('should accept EUR', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_currency: 'EUR',
      })

      expect(result.success).toBe(true)
    })

    it('should accept USD', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_currency: 'USD',
      })

      expect(result.success).toBe(true)
    })

    it('should accept GBP', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_currency: 'GBP',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid currency', () => {
      const result = planningSettingsSchema.safeParse({
        ...PLANNING_SETTINGS_DEFAULTS,
        po_default_currency: 'JPY',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Partial Updates Support', () => {
    it('should allow empty object (partial update)', () => {
      const result = planningSettingsUpdateSchema.safeParse({})

      expect(result.success).toBe(true)
    })

    it('should allow single field update', () => {
      const result = planningSettingsUpdateSchema.safeParse({
        po_require_approval: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.po_require_approval).toBe(true)
        expect(result.data.po_auto_number_prefix).toBeUndefined()
      }
    })

    it('should allow multiple field updates', () => {
      const result = planningSettingsUpdateSchema.safeParse({
        po_require_approval: true,
        po_approval_threshold: 5000,
        to_allow_partial_shipments: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.po_require_approval).toBe(true)
        expect(result.data.po_approval_threshold).toBe(5000)
        expect(result.data.to_allow_partial_shipments).toBe(false)
      }
    })

    it('should allow all fields in update', () => {
      const result = planningSettingsUpdateSchema.safeParse({
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin'],
        po_auto_number_prefix: 'PUR-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 60',
        po_default_currency: 'EUR',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 2,
        wo_material_check: false,
        wo_copy_routing: true,
        wo_auto_select_bom: false,
        wo_require_bom: true,
        wo_allow_overproduction: true,
        wo_overproduction_limit: 15,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 4,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Complete Valid Settings', () => {
    it('should accept complete valid settings object', () => {
      const result = planningSettingsSchema.safeParse({
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin', 'manager'],
        po_auto_number_prefix: 'PO-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 30',
        po_default_currency: 'PLN',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 10,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
      })

      expect(result.success).toBe(true)
    })
  })
})

/**
 * Test Summary for Story 03.17 - Planning Settings Schemas
 * ===========================================================
 *
 * Test Coverage:
 * - Auto-Number Format: 7 tests (valid/invalid, all document types)
 * - Auto-Number Prefix: 11 tests (length, characters, validation)
 * - Approval Threshold: 5 tests (null, ranges, decimals)
 * - Overproduction Limit: 5 tests (ranges 0-100%)
 * - Transit Days: 6 tests (ranges 0-365)
 * - Scheduling Buffer: 6 tests (ranges 0-168)
 * - Toggles/Booleans: 4 tests
 * - Approval Roles Array: 4 tests
 * - Payment Terms Enum: 6 tests
 * - Currency Enum: 5 tests
 * - Partial Updates: 4 tests
 * - Complete Valid Settings: 1 test
 * - Total: 64 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - planningSettingsSchema not defined
 * - planningSettingsUpdateSchema not defined
 * - Zod validation not implemented
 *
 * Coverage Target: 90%
 */
