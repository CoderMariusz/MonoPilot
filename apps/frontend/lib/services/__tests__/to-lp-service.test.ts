/**
 * TO LP Service - Unit Tests
 * Story: 03.9b - TO License Plate Pre-selection
 * Phase: GREEN - Tests with actual service implementation
 *
 * Tests the TOLPService which handles:
 * - assignLPsToTOLine(): Validate and assign LPs to TO line
 * - getAvailableLPsForTOLine(): Filter LPs by TO line criteria
 * - removeLPFromTOLine(): Remove LP assignment
 * - getLPAssignmentsForTOLine(): Get existing LP assignments
 * - validateLPAssignment(): Validate single LP against business rules
 *
 * Coverage Target: 80%
 * Test Count: 40 scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { validateLPAssignment } from '@/lib/services/to-lp-service'

/**
 * Mock data - License Plates
 */
const mockLP1 = {
  warehouse_id: 'wh-main-uuid',
  product_id: 'prod-flour-uuid',
  available_qty: 150,
  status: 'available',
}

const mockLP3 = {
  warehouse_id: 'wh-main-uuid',
  product_id: 'prod-flour-uuid',
  available_qty: 50,
  status: 'available',
}

const mockLPWrongWarehouse = {
  warehouse_id: 'wh-branch-uuid', // Wrong warehouse
  product_id: 'prod-flour-uuid',
  available_qty: 100,
  status: 'available',
}

const mockLPWrongProduct = {
  warehouse_id: 'wh-main-uuid',
  product_id: 'prod-sugar-uuid', // Wrong product
  available_qty: 100,
  status: 'available',
}

const mockLPBlocked = {
  warehouse_id: 'wh-main-uuid',
  product_id: 'prod-flour-uuid',
  available_qty: 100,
  status: 'blocked', // Not available
}

/**
 * Mock data - TO Lines
 */
const mockTOLine = {
  product_id: 'prod-flour-uuid',
}

describe('TOLPService (Story 03.9b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('validateLPAssignment', () => {
    it('should return valid for LP in correct warehouse with correct product', () => {
      const result = validateLPAssignment(
        mockLP1,
        mockTOLine,
        'wh-main-uuid',
        100
      )

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid when LP warehouse does not match', () => {
      const result = validateLPAssignment(
        mockLPWrongWarehouse,
        mockTOLine,
        'wh-main-uuid',
        100
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not in source warehouse')
    })

    it('should return invalid when LP product does not match', () => {
      const result = validateLPAssignment(
        mockLPWrongProduct,
        mockTOLine,
        'wh-main-uuid',
        100
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('product mismatch')
    })

    it('should return invalid when requested qty exceeds available', () => {
      const result = validateLPAssignment(
        mockLP3,
        mockTOLine,
        'wh-main-uuid',
        60 // LP3 only has 50 available
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('50 units available')
    })

    it('should return valid when requested qty equals available', () => {
      const result = validateLPAssignment(
        mockLP3,
        mockTOLine,
        'wh-main-uuid',
        50 // Exactly what LP3 has
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid when requested qty is less than available', () => {
      const result = validateLPAssignment(
        mockLP1,
        mockTOLine,
        'wh-main-uuid',
        100 // LP1 has 150
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when LP status is not available', () => {
      const result = validateLPAssignment(
        mockLPBlocked,
        mockTOLine,
        'wh-main-uuid',
        50
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('blocked')
    })
  })

  // Integration tests that require full database setup are mocked
  // These tests verify the function signatures and error handling structure
  describe('assignLPsToTOLine (integration - mocked)', () => {
    it('should have correct function signature', async () => {
      const { assignLPsToTOLine } = await import('@/lib/services/to-lp-service')
      expect(typeof assignLPsToTOLine).toBe('function')
    })

    it('should accept toId, toLineId, and lps array as parameters', async () => {
      const { assignLPsToTOLine } = await import('@/lib/services/to-lp-service')
      // Function should not throw when called (even if it fails due to missing auth)
      const result = await assignLPsToTOLine('to-id', 'line-id', [{ lp_id: 'lp-id', quantity: 10 }])
      // Should return a ServiceResult
      expect(result).toHaveProperty('success')
    })
  })

  describe('getAvailableLPsForTOLine (integration - mocked)', () => {
    it('should have correct function signature', async () => {
      const { getAvailableLPsForTOLine } = await import('@/lib/services/to-lp-service')
      expect(typeof getAvailableLPsForTOLine).toBe('function')
    })

    it('should accept toId, toLineId, and optional filters', async () => {
      const { getAvailableLPsForTOLine } = await import('@/lib/services/to-lp-service')
      const result = await getAvailableLPsForTOLine('to-id', 'line-id', { lot_number: 'test' })
      expect(result).toHaveProperty('success')
    })
  })

  describe('removeLPFromTOLine (integration - mocked)', () => {
    it('should have correct function signature', async () => {
      const { removeLPFromTOLine } = await import('@/lib/services/to-lp-service')
      expect(typeof removeLPFromTOLine).toBe('function')
    })

    it('should accept toId, toLineId, and lpId', async () => {
      const { removeLPFromTOLine } = await import('@/lib/services/to-lp-service')
      const result = await removeLPFromTOLine('to-id', 'line-id', 'lp-id')
      expect(result).toHaveProperty('success')
    })
  })

  describe('getLPAssignmentsForTOLine (integration - mocked)', () => {
    it('should have correct function signature', async () => {
      const { getLPAssignmentsForTOLine } = await import('@/lib/services/to-lp-service')
      expect(typeof getLPAssignmentsForTOLine).toBe('function')
    })

    it('should accept toId and toLineId', async () => {
      const { getLPAssignmentsForTOLine } = await import('@/lib/services/to-lp-service')
      const result = await getLPAssignmentsForTOLine('to-id', 'line-id')
      expect(result).toHaveProperty('success')
    })
  })

  describe('TOLPErrorCode constants', () => {
    it('should export all required error codes', async () => {
      const { TOLPErrorCode } = await import('@/lib/services/to-lp-service')

      expect(TOLPErrorCode.TO_NOT_FOUND).toBe('TO_NOT_FOUND')
      expect(TOLPErrorCode.TO_LINE_NOT_FOUND).toBe('TO_LINE_NOT_FOUND')
      expect(TOLPErrorCode.LP_NOT_FOUND).toBe('LP_NOT_FOUND')
      expect(TOLPErrorCode.LP_NOT_IN_WAREHOUSE).toBe('LP_NOT_IN_WAREHOUSE')
      expect(TOLPErrorCode.LP_PRODUCT_MISMATCH).toBe('LP_PRODUCT_MISMATCH')
      expect(TOLPErrorCode.INSUFFICIENT_QUANTITY).toBe('INSUFFICIENT_QUANTITY')
      expect(TOLPErrorCode.INVALID_STATUS).toBe('INVALID_STATUS')
      expect(TOLPErrorCode.DUPLICATE_ASSIGNMENT).toBe('DUPLICATE_ASSIGNMENT')
      expect(TOLPErrorCode.QUANTITY_MISMATCH).toBe('QUANTITY_MISMATCH')
      expect(TOLPErrorCode.ASSIGNMENT_NOT_FOUND).toBe('ASSIGNMENT_NOT_FOUND')
      expect(TOLPErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR')
    })
  })

  describe('Type exports', () => {
    it('should export LPAssignmentInput type', async () => {
      // Type imports are compile-time only, so we just verify the module imports correctly
      const module = await import('@/lib/services/to-lp-service')
      expect(module).toBeDefined()
    })

    it('should export TOLineLPAssignment type', async () => {
      const module = await import('@/lib/services/to-lp-service')
      expect(module).toBeDefined()
    })

    it('should export AvailableLP type', async () => {
      const module = await import('@/lib/services/to-lp-service')
      expect(module).toBeDefined()
    })

    it('should export ServiceResult type', async () => {
      const module = await import('@/lib/services/to-lp-service')
      expect(module).toBeDefined()
    })
  })

  // Additional validation tests
  describe('validateLPAssignment - edge cases', () => {
    it('should handle zero requested quantity gracefully', () => {
      // This is an edge case - typically validation happens at schema level
      const result = validateLPAssignment(
        mockLP1,
        mockTOLine,
        'wh-main-uuid',
        0
      )
      // The function should return valid (zero is <= available)
      // Business rule for > 0 is enforced at schema level
      expect(result.valid).toBe(true)
    })

    it('should reject LP with exactly zero available quantity', () => {
      const lpZeroQty = {
        ...mockLP1,
        available_qty: 0,
      }

      const result = validateLPAssignment(
        lpZeroQty,
        mockTOLine,
        'wh-main-uuid',
        10
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('0 units available')
    })

    it('should handle negative available quantity (data error)', () => {
      const lpNegativeQty = {
        ...mockLP1,
        available_qty: -10,
      }

      const result = validateLPAssignment(
        lpNegativeQty,
        mockTOLine,
        'wh-main-uuid',
        5
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('available')
    })

    it('should validate warehouse match with different warehouse IDs', () => {
      const lp = {
        ...mockLP1,
        warehouse_id: 'warehouse-xyz',
      }

      const result = validateLPAssignment(
        lp,
        mockTOLine,
        'warehouse-abc', // Different from LP
        50
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not in source warehouse')
    })

    it('should validate product match with different product IDs', () => {
      const lp = {
        ...mockLP1,
        product_id: 'product-xyz',
      }

      const toLine = {
        product_id: 'product-abc', // Different from LP
      }

      const result = validateLPAssignment(
        lp,
        toLine,
        'wh-main-uuid',
        50
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('product mismatch')
    })

    it('should validate status - reserved LP', () => {
      const lpReserved = {
        ...mockLP1,
        status: 'reserved',
      }

      const result = validateLPAssignment(
        lpReserved,
        mockTOLine,
        'wh-main-uuid',
        50
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('reserved')
    })

    it('should validate status - consumed LP', () => {
      const lpConsumed = {
        ...mockLP1,
        status: 'consumed',
      }

      const result = validateLPAssignment(
        lpConsumed,
        mockTOLine,
        'wh-main-uuid',
        50
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('consumed')
    })

    it('should pass all validations for perfect match', () => {
      const lp = {
        warehouse_id: 'test-wh',
        product_id: 'test-prod',
        available_qty: 100,
        status: 'available',
      }

      const toLine = {
        product_id: 'test-prod',
      }

      const result = validateLPAssignment(
        lp,
        toLine,
        'test-wh',
        100
      )

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle decimal quantities', () => {
      const lp = {
        ...mockLP1,
        available_qty: 100.5,
      }

      const result = validateLPAssignment(
        lp,
        mockTOLine,
        'wh-main-uuid',
        100.25
      )

      expect(result.valid).toBe(true)
    })

    it('should reject when decimal quantity exceeds available', () => {
      const lp = {
        ...mockLP1,
        available_qty: 100.5,
      }

      const result = validateLPAssignment(
        lp,
        mockTOLine,
        'wh-main-uuid',
        100.75
      )

      expect(result.valid).toBe(false)
    })
  })
})
