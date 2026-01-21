/**
 * Unit Tests: Yield Service for Output Registration (Story 04.7a)
 * Phase: GREEN - Tests should PASS
 *
 * Tests yield calculation functions specific to output registration:
 * - calculateOutputYield() - Output qty / Planned qty
 * - calculateMaterialYield() - Planned material / Actual consumed
 * - getYieldColor() - Color thresholds (green >= 95%, yellow >= 80%, red < 80%)
 * - getYieldLabel() - N/A handling for null yields
 *
 * Acceptance Criteria Coverage:
 * - FR-PROD-014: Yield Tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  calculateOutputYield,
  calculateMaterialYield,
  getYieldColor,
  getYieldLabel,
  YIELD_THRESHOLDS_04_7A,
} from '@/lib/services/yield-service'

describe('YieldService for Output Registration (Story 04.7a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // calculateOutputYield Tests (FR-PROD-014)
  // ============================================================================
  describe('calculateOutputYield()', () => {
    it('AC: returns percentage rounded to 1 decimal', () => {
      // GIVEN: WO.planned_qty=1000, actual_output_qty=953
      const outputQty = 953
      const plannedQty = 1000

      // WHEN: calculateOutputYield is called
      const yield_percent = calculateOutputYield(outputQty, plannedQty)

      // THEN: Should return 95.3%
      expect(yield_percent).toBe(95.3)
    })

    it('AC: handles zero planned qty (returns null)', () => {
      // GIVEN: Planned qty = 0
      const outputQty = 100
      const plannedQty = 0

      // WHEN: calculateOutputYield is called
      const yield_percent = calculateOutputYield(outputQty, plannedQty)

      // THEN: Should return null (not infinity)
      expect(yield_percent).toBeNull()
    })

    it('AC: handles zero output (returns 0%)', () => {
      // GIVEN: No output yet
      const outputQty = 0
      const plannedQty = 1000

      // WHEN: calculateOutputYield is called
      const yield_percent = calculateOutputYield(outputQty, plannedQty)

      // THEN: Should return 0%
      expect(yield_percent).toBe(0)
    })

    it('calculates exact 95% correctly', () => {
      // GIVEN: Exactly 95% yield
      const outputQty = 950
      const plannedQty = 1000

      // WHEN: calculateOutputYield is called
      const yield_percent = calculateOutputYield(outputQty, plannedQty)

      // THEN: Should return exactly 95.0
      expect(yield_percent).toBe(95.0)
    })

    it('handles over-production (yield > 100%)', () => {
      // GIVEN: Over-production scenario
      const outputQty = 1100
      const plannedQty = 1000

      // WHEN: calculateOutputYield is called
      const yield_percent = calculateOutputYield(outputQty, plannedQty)

      // THEN: Should return 110.0%
      expect(yield_percent).toBe(110.0)
    })
  })

  // ============================================================================
  // calculateMaterialYield Tests (FR-PROD-014)
  // ============================================================================
  describe('calculateMaterialYield()', () => {
    it('AC: calculates material yield correctly', () => {
      // GIVEN: planned_material_qty=100, actual_consumed_qty=110
      const plannedMaterial = 100
      const actualConsumed = 110

      // WHEN: calculateMaterialYield is called
      // Formula: (planned / actual) * 100
      const yield_percent = calculateMaterialYield(plannedMaterial, actualConsumed)

      // THEN: Should return 90.9%
      expect(yield_percent).toBe(90.9)
    })

    it('returns 100% when exact material used', () => {
      // GIVEN: Exact material consumption
      const plannedMaterial = 100
      const actualConsumed = 100

      // WHEN: calculateMaterialYield is called
      const yield_percent = calculateMaterialYield(plannedMaterial, actualConsumed)

      // THEN: Should return 100%
      expect(yield_percent).toBe(100.0)
    })

    it('returns > 100% when less material consumed', () => {
      // GIVEN: Under-consumption (good efficiency)
      const plannedMaterial = 100
      const actualConsumed = 90

      // WHEN: calculateMaterialYield is called
      const yield_percent = calculateMaterialYield(plannedMaterial, actualConsumed)

      // THEN: Should return 111.1%
      expect(yield_percent).toBe(111.1)
    })

    it('handles zero actual consumed (returns null)', () => {
      // GIVEN: No consumption yet
      const plannedMaterial = 100
      const actualConsumed = 0

      // WHEN: calculateMaterialYield is called
      const yield_percent = calculateMaterialYield(plannedMaterial, actualConsumed)

      // THEN: Should return null (not infinity)
      expect(yield_percent).toBeNull()
    })

    it('handles zero planned material (returns null)', () => {
      // GIVEN: No planned material
      const plannedMaterial = 0
      const actualConsumed = 50

      // WHEN: calculateMaterialYield is called
      const yield_percent = calculateMaterialYield(plannedMaterial, actualConsumed)

      // THEN: Should return null
      expect(yield_percent).toBeNull()
    })
  })

  // ============================================================================
  // getYieldColor Tests - Story 04.7a thresholds
  // ============================================================================
  describe('getYieldColor() - 04.7a thresholds', () => {
    it('AC: returns green for >= 95%', () => {
      // GIVEN: Yield at 95%
      const yieldPercent = 95

      // WHEN: getYieldColor is called (using 04.7a thresholds)
      const color = getYieldColor(yieldPercent)

      // THEN: Should return green
      expect(color).toBe('green')
    })

    it('AC: returns green for 100%', () => {
      // GIVEN: Perfect yield
      const yieldPercent = 100

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should return green
      expect(color).toBe('green')
    })

    it('AC: returns yellow for 85% (80-94%)', () => {
      // GIVEN: Yield at 85%
      const yieldPercent = 85

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should return yellow
      expect(color).toBe('yellow')
    })

    it('AC: returns yellow for exactly 80%', () => {
      // GIVEN: Yield at boundary
      const yieldPercent = 80

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should return yellow (boundary inclusive)
      expect(color).toBe('yellow')
    })

    it('AC: returns yellow for 94%', () => {
      // GIVEN: Just below green threshold
      const yieldPercent = 94

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should return yellow
      expect(color).toBe('yellow')
    })

    it('AC: returns red for 75% (< 80%)', () => {
      // GIVEN: Yield below threshold
      const yieldPercent = 75

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should return red
      expect(color).toBe('red')
    })

    it('AC: returns red for 79%', () => {
      // GIVEN: Just below yellow threshold
      const yieldPercent = 79

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should return red
      expect(color).toBe('red')
    })

    it('returns green for over 100% (over-production)', () => {
      // GIVEN: Over-production
      const yieldPercent = 110

      // WHEN: getYieldColor is called
      const color = getYieldColor(yieldPercent)

      // THEN: Should still return green
      expect(color).toBe('green')
    })
  })

  // ============================================================================
  // getYieldLabel Tests
  // ============================================================================
  describe('getYieldLabel()', () => {
    it('AC: returns "N/A" for null yield', () => {
      // GIVEN: No outputs registered
      const yieldPercent = null

      // WHEN: getYieldLabel is called
      const label = getYieldLabel(yieldPercent)

      // THEN: Should return "N/A"
      expect(label).toBe('N/A')
    })

    it('returns numeric string for valid yield', () => {
      // GIVEN: Valid yield
      const yieldPercent = 95.5

      // WHEN: getYieldLabel is called
      const label = getYieldLabel(yieldPercent)

      // THEN: Should return formatted string
      expect(label).toBe('95.5%')
    })

    it('returns "0%" for zero yield', () => {
      // GIVEN: Zero yield
      const yieldPercent = 0

      // WHEN: getYieldLabel is called
      const label = getYieldLabel(yieldPercent)

      // THEN: Should return "0%"
      expect(label).toBe('0%')
    })
  })
})

/**
 * Test Coverage Summary for Story 04.7a - Yield Service
 * =====================================================
 *
 * calculateOutputYield: 5 tests
 *   - Rounded to 1 decimal
 *   - Zero planned (null)
 *   - Zero output (0%)
 *   - Exact 95%
 *   - Over-production
 *
 * calculateMaterialYield: 5 tests
 *   - Standard calculation
 *   - Exact match (100%)
 *   - Under-consumption (>100%)
 *   - Zero actual (null)
 *   - Zero planned (null)
 *
 * getYieldColor: 8 tests
 *   - Green at 95%
 *   - Green at 100%
 *   - Yellow at 85%
 *   - Yellow at 80%
 *   - Yellow at 94%
 *   - Red at 75%
 *   - Red at 79%
 *   - Green at 110%
 *
 * getYieldLabel: 3 tests
 *   - N/A for null
 *   - Formatted string
 *   - Zero handling
 *
 * Total: 21 tests
 * Status: ALL PASS (GREEN phase)
 */
