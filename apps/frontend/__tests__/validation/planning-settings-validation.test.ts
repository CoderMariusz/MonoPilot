/**
 * Planning Settings Validation Test
 * Bug Fix Verification for P1×3 Validation Issues
 *
 * Tests for:
 * - Bug 1: Auto-Numbering Prefix validation (uppercase + dash only, consistent with tax-codes)
 * - Bug 2: Default Transit Days validation (>= 0, integer only)
 * - Bug 3: Approval Threshold validation (max 1,000,000)
 */

import { describe, it, expect } from 'vitest'
import { planningSettingsSchema } from '@/lib/validation/planning-settings-schemas'

describe('Planning Settings Validation - Bug Fixes', () => {
  // Valid base data for testing
  const validBaseData = {
    // PO Settings
    po_require_approval: false,
    po_approval_threshold: 10000,
    po_approval_roles: ['admin'],
    po_auto_number_prefix: 'PO-',
    po_auto_number_format: 'YYYY-NNNNN',
    po_default_payment_terms: 'Net 30' as const,
    po_default_currency: 'PLN' as const,

    // TO Settings
    to_allow_partial_shipments: false,
    to_require_lp_selection: false,
    to_auto_number_prefix: 'TO-',
    to_auto_number_format: 'YYYY-NNNNN',
    to_default_transit_days: 7,

    // WO Settings
    wo_material_check: false,
    wo_copy_routing: false,
    wo_auto_select_bom: false,
    wo_require_bom: false,
    wo_allow_overproduction: false,
    wo_overproduction_limit: 10,
    wo_auto_number_prefix: 'WO-',
    wo_auto_number_format: 'YYYY-NNNNN',
    wo_default_scheduling_buffer_hours: 2,
  }

  describe('Bug 1: Auto-Numbering Prefix Validation (match tax-codes pattern)', () => {
    describe('PO Prefix Validation', () => {
      it('should accept valid uppercase prefix with dash', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          po_auto_number_prefix: 'PO-2024-',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid uppercase alphanumeric prefix', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          po_auto_number_prefix: 'PO123',
        })
        expect(result.success).toBe(true)
      })

      it('should reject lowercase prefix', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          po_auto_number_prefix: 'po-',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('uppercase')
        }
      })

      it('should reject prefix with underscore', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          po_auto_number_prefix: 'PO_2024',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('uppercase')
        }
      })

      it('should reject prefix with special characters', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          po_auto_number_prefix: 'PO@#$',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('TO Prefix Validation', () => {
      it('should accept valid uppercase prefix', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          to_auto_number_prefix: 'TO-',
        })
        expect(result.success).toBe(true)
      })

      it('should reject lowercase prefix', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          to_auto_number_prefix: 'to-',
        })
        expect(result.success).toBe(false)
      })

      it('should reject prefix with underscore', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          to_auto_number_prefix: 'TO_2024',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('WO Prefix Validation', () => {
      it('should accept valid uppercase prefix', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          wo_auto_number_prefix: 'WO-',
        })
        expect(result.success).toBe(true)
      })

      it('should reject lowercase prefix', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          wo_auto_number_prefix: 'wo-',
        })
        expect(result.success).toBe(false)
      })

      it('should reject prefix with special characters', () => {
        const result = planningSettingsSchema.safeParse({
          ...validBaseData,
          wo_auto_number_prefix: 'WO@2024',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Bug 2: Default Transit Days Validation (>= 0, integer only)', () => {
    it('should accept valid positive integer', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        to_default_transit_days: 7,
      })
      expect(result.success).toBe(true)
    })

    it('should accept zero', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        to_default_transit_days: 0,
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative number', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        to_default_transit_days: -2,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('0')
      }
    })

    it('should reject decimal (non-integer)', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        to_default_transit_days: 7.5,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('integer')
      }
    })

    it('should reject value over max (365)', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        to_default_transit_days: 400,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('365')
      }
    })
  })

  describe('Bug 3: Approval Threshold Validation (max 1,000,000)', () => {
    it('should accept valid threshold within range', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        po_approval_threshold: 100000,
      })
      expect(result.success).toBe(true)
    })

    it('should accept threshold at max (1,000,000)', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        po_approval_threshold: 1000000,
      })
      expect(result.success).toBe(true)
    })

    it('should accept null threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        po_approval_threshold: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject threshold over 1,000,000', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        po_approval_threshold: 1000001,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1,000,000')
      }
    })

    it('should reject very large threshold (999,999,999)', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        po_approval_threshold: 999999999,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1,000,000')
      }
    })

    it('should reject negative threshold', () => {
      const result = planningSettingsSchema.safeParse({
        ...validBaseData,
        po_approval_threshold: -100,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('0')
      }
    })
  })
})
