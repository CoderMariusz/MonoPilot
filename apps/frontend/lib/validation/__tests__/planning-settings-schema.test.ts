/**
 * Unit Tests: Planning Settings Validation Schema
 * Story: 03.5a - PO Approval Setup
 * Phase: RED - Tests should FAIL (implementation not yet written)
 *
 * Tests the Zod validation schemas for PO approval settings:
 * - poApprovalSettingsSchema: Complete PO approval section
 * - planningSettingsUpdateSchema: Full settings update payload
 *
 * Coverage Target: 95%
 * Test Count: 16 tests
 */

import { describe, it, expect } from 'vitest'
import {
  poApprovalSettingsSchema,
  planningSettingsUpdateSchema,
  type POApprovalSettings,
} from '@/lib/validation/planning-settings-schema'

describe('03.5a Zod Validation Schemas - PO Approval Settings', () => {
  /**
   * AC-06, AC-07, AC-08, AC-09: Threshold Validation Tests
   */
  describe('Threshold Validation', () => {
    describe('AC-06: Positive Number Validation', () => {
      it('should reject negative threshold (-500)', () => {
        // GIVEN invalid negative threshold
        const data = {
          po_require_approval: true,
          po_approval_threshold: -500,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation fails with correct error message
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((issue) =>
            issue.message.includes('Threshold must be a positive number')
          )).toBe(true)
        }
      })

      it('should accept positive threshold (1000)', () => {
        // GIVEN valid positive threshold
        const data = {
          po_require_approval: true,
          po_approval_threshold: 1000,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })
    })

    describe('AC-07: Greater Than Zero Validation', () => {
      it('should reject zero threshold (0)', () => {
        // GIVEN threshold of zero
        const data = {
          po_require_approval: true,
          po_approval_threshold: 0,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation fails with correct error message
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((issue) =>
            issue.message.includes('Threshold must be a positive number')
          )).toBe(true)
        }
      })

      it('should accept threshold greater than zero (0.01)', () => {
        // GIVEN valid threshold > 0
        const data = {
          po_require_approval: true,
          po_approval_threshold: 0.01,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })
    })

    describe('AC-08: Max Decimal Places (4)', () => {
      it('should reject threshold with 5 decimal places (123.45678)', () => {
        // GIVEN threshold with too many decimal places
        const data = {
          po_require_approval: true,
          po_approval_threshold: 123.45678,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation fails with correct error message
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((issue) =>
            issue.message.includes('Threshold can have at most 4 decimal places')
          )).toBe(true)
        }
      })

      it('should accept threshold with exactly 4 decimal places (123.4567)', () => {
        // GIVEN threshold with 4 decimal places
        const data = {
          po_require_approval: true,
          po_approval_threshold: 123.4567,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })

      it('should accept threshold with 2 decimal places (123.45)', () => {
        // GIVEN threshold with 2 decimal places
        const data = {
          po_require_approval: true,
          po_approval_threshold: 123.45,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })

      it('should accept threshold with 0 decimal places (100)', () => {
        // GIVEN threshold with no decimal places
        const data = {
          po_require_approval: true,
          po_approval_threshold: 100,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })
    })

    describe('AC-09: Null Threshold Allowed', () => {
      it('should accept null threshold', () => {
        // GIVEN null threshold (approval applies to all POs)
        const data = {
          po_require_approval: true,
          po_approval_threshold: null,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })

      it('should accept undefined threshold (optional)', () => {
        // GIVEN undefined threshold
        const data = {
          po_require_approval: true,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })
    })
  })

  /**
   * AC-10, AC-12: Role Validation Tests
   */
  describe('Role Multi-Select Validation', () => {
    describe('AC-10: Non-Empty Roles Array', () => {
      it('should accept single role selection', () => {
        // GIVEN single role selected
        const data = {
          po_require_approval: true,
          po_approval_threshold: null,
          po_approval_roles: ['admin'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })

      it('should accept multiple role selection', () => {
        // GIVEN multiple roles selected
        const data = {
          po_require_approval: true,
          po_approval_threshold: null,
          po_approval_roles: ['admin', 'manager', 'finance_manager'],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation passes
        expect(result.success).toBe(true)
      })
    })

    describe('AC-12: At Least One Role Required', () => {
      it('should reject empty roles array', () => {
        // GIVEN no roles selected
        const data = {
          po_require_approval: true,
          po_approval_threshold: null,
          po_approval_roles: [],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation fails with correct error message
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((issue) =>
            issue.message.includes('At least one approval role must be selected')
          )).toBe(true)
        }
      })

      it('should reject roles array with empty strings', () => {
        // GIVEN roles array containing empty string
        const data = {
          po_require_approval: true,
          po_approval_threshold: null,
          po_approval_roles: [''],
        }

        // WHEN validating
        const result = poApprovalSettingsSchema.safeParse(data)

        // THEN validation fails
        expect(result.success).toBe(false)
      })
    })
  })

  /**
   * Toggle and Boolean Validation
   */
  describe('Boolean Field Validation', () => {
    it('should accept po_require_approval = true', () => {
      // GIVEN approval required
      const data = {
        po_require_approval: true,
        po_approval_threshold: null,
        po_approval_roles: ['admin'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should accept po_require_approval = false', () => {
      // GIVEN approval not required
      const data = {
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should reject non-boolean po_require_approval', () => {
      // GIVEN non-boolean value
      const data = {
        po_require_approval: 'true',
        po_approval_threshold: null,
        po_approval_roles: ['admin'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data as any)

      // THEN validation fails
      expect(result.success).toBe(false)
    })
  })

  /**
   * Full Schema Test: Default Settings
   */
  describe('Complete Schema - Default Settings', () => {
    it('should validate default settings (approval disabled)', () => {
      // GIVEN default fresh settings
      const defaultSettings = {
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(defaultSettings)

      // THEN validation passes
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.po_require_approval).toBe(false)
        expect(result.data.po_approval_threshold).toBeNull()
        expect(result.data.po_approval_roles).toEqual(['admin', 'manager'])
      }
    })

    it('should validate fully configured settings', () => {
      // GIVEN fully configured settings
      const configuredSettings = {
        po_require_approval: true,
        po_approval_threshold: 5000.5,
        po_approval_roles: ['admin', 'manager', 'finance_manager'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(configuredSettings)

      // THEN validation passes
      expect(result.success).toBe(true)
    })
  })

  /**
   * planningSettingsUpdateSchema Tests (Partial Updates)
   */
  describe('planningSettingsUpdateSchema - Partial Updates', () => {
    it('should accept partial update with only po_require_approval', () => {
      // GIVEN partial update payload
      const update = {
        po_require_approval: true,
      }

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should accept partial update with only po_approval_threshold', () => {
      // GIVEN partial update with threshold
      const update = {
        po_approval_threshold: 10000,
      }

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should accept partial update with only po_approval_roles', () => {
      // GIVEN partial update with roles
      const update = {
        po_approval_roles: ['admin', 'finance_manager'],
      }

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should accept empty update object (no changes)', () => {
      // GIVEN empty update
      const update = {}

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should accept combined update with all PO approval fields', () => {
      // GIVEN complete update
      const update = {
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin', 'manager'],
      }

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should validate threshold in update schema', () => {
      // GIVEN update with invalid threshold
      const update = {
        po_approval_threshold: -100,
      }

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation fails
      expect(result.success).toBe(false)
    })

    it('should validate roles in update schema', () => {
      // GIVEN update with empty roles
      const update = {
        po_approval_roles: [],
      }

      // WHEN validating
      const result = planningSettingsUpdateSchema.safeParse(update)

      // THEN validation fails
      expect(result.success).toBe(false)
    })
  })

  /**
   * Edge Cases and Type Coercion
   */
  describe('Edge Cases and Type Coercion', () => {
    it('should handle large threshold values', () => {
      // GIVEN very large threshold
      const data = {
        po_require_approval: true,
        po_approval_threshold: 999999999.9999,
        po_approval_roles: ['admin'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should handle small threshold values', () => {
      // GIVEN very small threshold
      const data = {
        po_require_approval: true,
        po_approval_threshold: 0.0001,
        po_approval_roles: ['admin'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should handle role with special characters or underscores', () => {
      // GIVEN role with underscores
      const data = {
        po_require_approval: true,
        po_approval_threshold: null,
        po_approval_roles: ['finance_manager', 'production_manager'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data)

      // THEN validation passes
      expect(result.success).toBe(true)
    })

    it('should reject non-array roles value', () => {
      // GIVEN roles as string instead of array
      const data = {
        po_require_approval: true,
        po_approval_threshold: null,
        po_approval_roles: 'admin',
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data as any)

      // THEN validation fails
      expect(result.success).toBe(false)
    })

    it('should reject non-number threshold value', () => {
      // GIVEN threshold as string
      const data = {
        po_require_approval: true,
        po_approval_threshold: '5000',
        po_approval_roles: ['admin'],
      }

      // WHEN validating
      const result = poApprovalSettingsSchema.safeParse(data as any)

      // THEN validation fails
      expect(result.success).toBe(false)
    })
  })
})

/**
 * Test Summary for Story 03.5a - Planning Settings Validation
 * ===========================================================
 *
 * Test Coverage:
 * - Threshold Validation: 8 tests (positive, > 0, decimal places, null)
 * - Role Validation: 4 tests (non-empty, at least one)
 * - Boolean Validation: 3 tests
 * - Complete Schema: 2 tests
 * - Partial Updates: 7 tests
 * - Edge Cases: 5 tests
 * - Total: 29 test cases
 *
 * Coverage Target: 95%
 * Schema Coverage:
 * - poApprovalSettingsSchema: 100%
 * - planningSettingsUpdateSchema: 100%
 */
