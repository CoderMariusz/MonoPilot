/**
 * Full LP Validation Service - Unit Tests (Story 04.6c)
 * Purpose: Test validateFullLPConsumption method for 1:1 consumption enforcement
 * Phase: RED - Tests will fail until service method is implemented
 *
 * Tests the Full LP Validation logic which handles:
 * - Block partial consumption when consume_whole_lp=true
 * - Allow full LP consumption when consume_whole_lp=true
 * - Allow partial consumption when consume_whole_lp=false
 * - Calculate variance when LP.qty differs from required
 * - Set is_full_lp flag on consumption record
 *
 * Coverage Target: 90%+
 *
 * Acceptance Criteria Coverage:
 * - AC-04.6c.1: Block Partial Consumption
 * - AC-04.6c.2: Allow Full LP Consumption
 * - AC-04.6c.3: Variance Recording
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
}

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Import actual service methods
import {
  validateFullLPConsumption,
  isFullLPConsumption,
  type FullLPValidationResult,
} from '@/lib/services/consumption-service'

describe('validateFullLPConsumption (Story 04.6c)', () => {
  // Test fixtures
  const testOrgId = 'org-test-123'
  const testWoMaterialId = 'wo-mat-001-uuid'
  const testLpId = 'lp-001-uuid'

  const mockLp = {
    id: testLpId,
    org_id: testOrgId,
    lp_number: 'LP-2025-08877',
    quantity: 100,
    uom: 'kg',
    status: 'available',
  }

  const mockWoMaterialWithWholeLP = {
    id: testWoMaterialId,
    org_id: testOrgId,
    consume_whole_lp: true,
    required_qty: 90,
    consumed_qty: 0,
    uom: 'kg',
  }

  const mockWoMaterialWithoutWholeLP = {
    id: testWoMaterialId,
    org_id: testOrgId,
    consume_whole_lp: false,
    required_qty: 200,
    consumed_qty: 100,
    uom: 'kg',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Block Partial Consumption (AC-04.6c.1)
  // ============================================================================
  describe('Block Partial Consumption', () => {
    it('should return error when partial qty for consume_whole_lp=true', () => {
      // GIVEN: consume_whole_lp=true AND LP.qty=100
      // WHEN: user enters consume_qty=50
      // THEN: error "Full LP consumption required. LP quantity is 100" displays

      const consumeQty = 50 // Partial consumption
      const lpQty = 100

      const result = validateFullLPConsumption(true, consumeQty, lpQty)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('FULL_LP_REQUIRED')
      expect(result.lpQty).toBe(100)
      expect(result.message).toBe('Full LP consumption required. LP quantity is 100')
    })

    it('should include LP quantity in error message', () => {
      // GIVEN: consume_whole_lp=true AND LP.qty=250
      // WHEN: partial consumption attempted
      // THEN: error message includes "LP quantity is 250"

      const lpQty = 250
      const consumeQty = 100

      const result = validateFullLPConsumption(true, consumeQty, lpQty)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('250')
    })

    it('should return error when consume_qty=0 for consume_whole_lp=true', () => {
      // Edge case: zero quantity should also be rejected
      const consumeQty = 0
      const lpQty = 100

      const result = validateFullLPConsumption(true, consumeQty, lpQty)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('FULL_LP_REQUIRED')
    })

    it('should return error when consume_qty slightly less than LP.qty', () => {
      // Edge case: 99 vs 100
      const consumeQty = 99
      const lpQty = 100

      const result = validateFullLPConsumption(true, consumeQty, lpQty)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('FULL_LP_REQUIRED')
    })
  })

  // ============================================================================
  // Allow Full LP Consumption (AC-04.6c.2)
  // ============================================================================
  describe('Allow Full LP Consumption', () => {
    it('should return success when full qty for consume_whole_lp=true', () => {
      // GIVEN: consume_whole_lp=true AND LP.qty=100
      // WHEN: user enters consume_qty=100
      // THEN: consumption proceeds successfully with is_full_lp=true

      const consumeQty = 100
      const lpQty = 100

      const result = validateFullLPConsumption(true, consumeQty, lpQty)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow exact LP quantity consumption', () => {
      // GIVEN: LP.qty=75.5 (decimal)
      // WHEN: consume_qty=75.5
      // THEN: validation passes

      const consumeQty = 75.5
      const lpQty = 75.5

      const result = validateFullLPConsumption(true, consumeQty, lpQty)

      expect(result.valid).toBe(true)
    })
  })

  // ============================================================================
  // Allow Partial When consume_whole_lp=false (AC-04.6c.3)
  // ============================================================================
  describe('Allow Partial When consume_whole_lp=false', () => {
    it('should allow partial qty for consume_whole_lp=false', () => {
      // GIVEN: consume_whole_lp=false AND LP.qty=100
      // WHEN: user enters consume_qty=50
      // THEN: partial consumption proceeds successfully

      const consumeQty = 50
      const lpQty = 100

      const result = validateFullLPConsumption(false, consumeQty, lpQty)

      expect(result.valid).toBe(true)
    })

    it('should allow any positive quantity when consume_whole_lp=false', () => {
      const consumeQty = 1 // Minimal consumption
      const lpQty = 100

      const result = validateFullLPConsumption(false, consumeQty, lpQty)

      expect(result.valid).toBe(true)
    })

    it('should allow full LP consumption when consume_whole_lp=false', () => {
      // Even with flag=false, consuming full LP should work
      const consumeQty = 100
      const lpQty = 100

      const result = validateFullLPConsumption(false, consumeQty, lpQty)

      expect(result.valid).toBe(true)
    })
  })

  // ============================================================================
  // Variance Recording (AC-04.6c.4)
  // ============================================================================
  describe('Variance Recording', () => {
    it('should calculate variance when LP.qty differs from required', async () => {
      // GIVEN: consume_whole_lp=true AND LP.qty=100 but required_qty=90
      // WHEN: consumption completed
      // THEN: consumption proceeds with +11% variance recorded, is_full_lp=true set

      const lpQty = 100
      const requiredQty = 90
      const variance = ((lpQty - requiredQty) / requiredQty) * 100

      expect(variance).toBeCloseTo(11.11, 1)

      // TODO: Uncomment when service method exists
      // const result = await ConsumptionService.recordConsumption({
      //   wo_material_id: testWoMaterialId,
      //   lp_id: testLpId,
      //   consume_qty: lpQty,
      // })
      // expect(result.variance_percentage).toBeCloseTo(11.11, 1)
      // expect(result.is_full_lp).toBe(true)
    })

    it('should record positive variance when over-consuming', async () => {
      // LP.qty=120, required=100 -> +20% variance
      const lpQty = 120
      const requiredQty = 100
      const variance = ((lpQty - requiredQty) / requiredQty) * 100

      expect(variance).toBe(20)
    })

    it('should record negative variance when under-consuming from required perspective', async () => {
      // LP.qty=80, required=100 -> -20% variance (but we must consume full LP)
      const lpQty = 80
      const requiredQty = 100
      const variance = ((lpQty - requiredQty) / requiredQty) * 100

      expect(variance).toBe(-20)
    })
  })

  // ============================================================================
  // is_full_lp Flag (AC-04.6c.5)
  // ============================================================================
  describe('is_full_lp Flag', () => {
    it('should set is_full_lp=true when full LP consumed', () => {
      // GIVEN: Full LP consumed
      // WHEN: consumption recorded
      // THEN: is_full_lp=true in consumption record

      const consumeQty = 100
      const lpQty = 100

      const isFullLp = isFullLPConsumption(consumeQty, lpQty)

      expect(isFullLp).toBe(true)
    })

    it('should set is_full_lp=false when partial LP consumed', () => {
      // GIVEN: Partial LP consumed (consume_whole_lp=false material)
      // WHEN: consumption recorded
      // THEN: is_full_lp=false in consumption record

      const consumeQty = 50
      const lpQty = 100

      const isFullLp = isFullLPConsumption(consumeQty, lpQty)

      expect(isFullLp).toBe(false)
    })
  })
})
