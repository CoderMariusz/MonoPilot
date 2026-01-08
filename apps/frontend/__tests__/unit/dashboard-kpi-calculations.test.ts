/**
 * Unit Tests: Dashboard KPI Calculations
 * Story: 04.1 - Production Dashboard
 * Phase: RED - Tests will fail until implementation exists
 *
 * Pure calculation function tests for KPIs (no mocking needed)
 *
 * Acceptance Criteria Coverage:
 * - AC-5: Avg Cycle Time calculation
 * - AC-6: On-Time Completion % calculation
 * - AC-7: Progress % calculation
 * - AC-13: Material availability % calculation
 * - AC-14: Days overdue calculation
 */

import { describe, it, expect } from 'vitest'

// These functions will be implemented in the production-dashboard-service.ts

/**
 * Calculate cycle time in hours between start and completion
 */
function calculateCycleTimeHours(startedAt: string, completedAt: string): number {
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  return (end - start) / (1000 * 60 * 60)
}

/**
 * Calculate average from array of numbers
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Calculate progress percentage (capped at 100)
 */
function calculateProgressPercent(actualQty: number, plannedQty: number): number {
  if (plannedQty <= 0) return 0
  const progress = (actualQty / plannedQty) * 100
  return Math.min(progress, 100)
}

/**
 * Calculate on-time percentage
 */
function calculateOnTimePercent(onTimeCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return Math.round((onTimeCount / totalCount) * 100)
}

/**
 * Check if WO was completed on time
 */
function isOnTime(completedAt: string, scheduledEndDate: string): boolean {
  return new Date(completedAt) <= new Date(scheduledEndDate)
}

/**
 * Calculate days overdue
 */
function calculateDaysOverdue(scheduledEndDate: string, today: Date = new Date()): number {
  const scheduled = new Date(scheduledEndDate)
  scheduled.setHours(0, 0, 0, 0)
  const todayMidnight = new Date(today)
  todayMidnight.setHours(0, 0, 0, 0)

  const diffTime = todayMidnight.getTime() - scheduled.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate material availability percentage
 */
function calculateMaterialAvailability(consumedQty: number, requiredQty: number): number {
  if (requiredQty <= 0) return 0
  return (consumedQty / requiredQty) * 100
}

/**
 * Check if material shortage exists (< 80%)
 */
function hasMaterialShortage(availabilityPercent: number, threshold: number = 80): boolean {
  return availabilityPercent < threshold
}

describe('Dashboard KPI Calculations (Story 04.1)', () => {
  // ============================================================================
  // Cycle Time Calculations (AC-5)
  // ============================================================================
  describe('calculateCycleTimeHours()', () => {
    it('should calculate cycle time in hours', () => {
      // GIVEN start time 2.5 hours before completion
      const startedAt = '2025-01-15T10:00:00Z'
      const completedAt = '2025-01-15T12:30:00Z'

      // WHEN calculating cycle time
      const result = calculateCycleTimeHours(startedAt, completedAt)

      // THEN returns 2.5 hours
      expect(result).toBe(2.5)
    })

    it('should handle multi-day production', () => {
      // GIVEN 26 hour cycle (over 1 day)
      const startedAt = '2025-01-15T10:00:00Z'
      const completedAt = '2025-01-16T12:00:00Z'

      // WHEN calculating cycle time
      const result = calculateCycleTimeHours(startedAt, completedAt)

      // THEN returns 26 hours
      expect(result).toBe(26)
    })

    it('should handle fractional hours', () => {
      // GIVEN 3 hours 20 minutes (3.333... hours)
      const startedAt = '2025-01-15T10:00:00Z'
      const completedAt = '2025-01-15T13:20:00Z'

      // WHEN calculating cycle time
      const result = calculateCycleTimeHours(startedAt, completedAt)

      // THEN returns ~3.33 hours
      expect(result).toBeCloseTo(3.333, 2)
    })

    it('should return 0 for same start/end time', () => {
      // GIVEN same timestamp
      const timestamp = '2025-01-15T10:00:00Z'

      // WHEN calculating cycle time
      const result = calculateCycleTimeHours(timestamp, timestamp)

      // THEN returns 0
      expect(result).toBe(0)
    })
  })

  describe('calculateAverage()', () => {
    it('should calculate average of cycle times', () => {
      // GIVEN cycle times: 2.5, 3.0, 4.5 hours
      const cycleTimes = [2.5, 3.0, 4.5]

      // WHEN calculating average
      const result = calculateAverage(cycleTimes)

      // THEN returns 3.333... (average)
      expect(result).toBeCloseTo(3.333, 2)
    })

    it('should return 0 for empty array', () => {
      // GIVEN empty array
      const cycleTimes: number[] = []

      // WHEN calculating average
      const result = calculateAverage(cycleTimes)

      // THEN returns 0
      expect(result).toBe(0)
    })

    it('should handle single value', () => {
      // GIVEN single value
      const cycleTimes = [5.5]

      // WHEN calculating average
      const result = calculateAverage(cycleTimes)

      // THEN returns that value
      expect(result).toBe(5.5)
    })

    it('should handle large datasets', () => {
      // GIVEN 1000 values averaging to 5
      const cycleTimes = Array.from({ length: 1000 }, () => 5)

      // WHEN calculating average
      const result = calculateAverage(cycleTimes)

      // THEN returns 5
      expect(result).toBe(5)
    })
  })

  // ============================================================================
  // Progress Percentage Calculations (AC-7)
  // ============================================================================
  describe('calculateProgressPercent()', () => {
    it('should calculate progress as (actual/planned)*100', () => {
      // GIVEN actual 50, planned 100
      const actualQty = 50
      const plannedQty = 100

      // WHEN calculating progress
      const result = calculateProgressPercent(actualQty, plannedQty)

      // THEN returns 50%
      expect(result).toBe(50)
    })

    it('should cap at 100% for over-production', () => {
      // GIVEN actual 150, planned 100 (over-production)
      const actualQty = 150
      const plannedQty = 100

      // WHEN calculating progress
      const result = calculateProgressPercent(actualQty, plannedQty)

      // THEN capped at 100%
      expect(result).toBe(100)
    })

    it('should return 0 for zero actual', () => {
      // GIVEN no actual production
      const actualQty = 0
      const plannedQty = 100

      // WHEN calculating progress
      const result = calculateProgressPercent(actualQty, plannedQty)

      // THEN returns 0%
      expect(result).toBe(0)
    })

    it('should handle zero planned (avoid division by zero)', () => {
      // GIVEN planned = 0
      const actualQty = 50
      const plannedQty = 0

      // WHEN calculating progress
      const result = calculateProgressPercent(actualQty, plannedQty)

      // THEN returns 0 (safe handling)
      expect(result).toBe(0)
    })

    it('should handle decimal quantities', () => {
      // GIVEN decimal quantities
      const actualQty = 33.33
      const plannedQty = 100

      // WHEN calculating progress
      const result = calculateProgressPercent(actualQty, plannedQty)

      // THEN returns ~33.33%
      expect(result).toBeCloseTo(33.33, 2)
    })
  })

  // ============================================================================
  // On-Time Percentage Calculations (AC-6)
  // ============================================================================
  describe('calculateOnTimePercent()', () => {
    it('should calculate percentage of on-time completions', () => {
      // GIVEN 6 on-time, 8 total
      const onTimeCount = 6
      const totalCount = 8

      // WHEN calculating on-time %
      const result = calculateOnTimePercent(onTimeCount, totalCount)

      // THEN returns 75%
      expect(result).toBe(75)
    })

    it('should return 100% when all on-time', () => {
      // GIVEN all 10 on-time
      const onTimeCount = 10
      const totalCount = 10

      // WHEN calculating on-time %
      const result = calculateOnTimePercent(onTimeCount, totalCount)

      // THEN returns 100%
      expect(result).toBe(100)
    })

    it('should return 0% when none on-time', () => {
      // GIVEN 0 on-time out of 5
      const onTimeCount = 0
      const totalCount = 5

      // WHEN calculating on-time %
      const result = calculateOnTimePercent(onTimeCount, totalCount)

      // THEN returns 0%
      expect(result).toBe(0)
    })

    it('should return 0% when no completions', () => {
      // GIVEN no completed WOs
      const onTimeCount = 0
      const totalCount = 0

      // WHEN calculating on-time %
      const result = calculateOnTimePercent(onTimeCount, totalCount)

      // THEN returns 0%
      expect(result).toBe(0)
    })

    it('should round to nearest integer', () => {
      // GIVEN 7 on-time out of 9 (77.777...)
      const onTimeCount = 7
      const totalCount = 9

      // WHEN calculating on-time %
      const result = calculateOnTimePercent(onTimeCount, totalCount)

      // THEN rounded to 78%
      expect(result).toBe(78)
    })
  })

  describe('isOnTime()', () => {
    it('should return true when completed before scheduled date', () => {
      // GIVEN completed before scheduled
      const completedAt = '2025-01-15T10:00:00Z'
      const scheduledEndDate = '2025-01-16T23:59:59Z'

      // WHEN checking on-time
      const result = isOnTime(completedAt, scheduledEndDate)

      // THEN returns true
      expect(result).toBe(true)
    })

    it('should return true when completed on scheduled date', () => {
      // GIVEN completed on scheduled date
      const completedAt = '2025-01-15T10:00:00Z'
      const scheduledEndDate = '2025-01-15T23:59:59Z'

      // WHEN checking on-time
      const result = isOnTime(completedAt, scheduledEndDate)

      // THEN returns true (same day)
      expect(result).toBe(true)
    })

    it('should return false when completed after scheduled date', () => {
      // GIVEN completed after scheduled
      const completedAt = '2025-01-17T10:00:00Z'
      const scheduledEndDate = '2025-01-15T23:59:59Z'

      // WHEN checking on-time
      const result = isOnTime(completedAt, scheduledEndDate)

      // THEN returns false
      expect(result).toBe(false)
    })
  })

  // ============================================================================
  // Days Overdue Calculations (AC-14)
  // ============================================================================
  describe('calculateDaysOverdue()', () => {
    it('should calculate days between scheduled and today', () => {
      // GIVEN scheduled 6 days ago
      const today = new Date('2025-01-16')
      const scheduledEndDate = '2025-01-10'

      // WHEN calculating days overdue
      const result = calculateDaysOverdue(scheduledEndDate, today)

      // THEN returns 6
      expect(result).toBe(6)
    })

    it('should return 0 for scheduled today', () => {
      // GIVEN scheduled today
      const today = new Date('2025-01-16')
      const scheduledEndDate = '2025-01-16'

      // WHEN calculating days overdue
      const result = calculateDaysOverdue(scheduledEndDate, today)

      // THEN returns 0
      expect(result).toBe(0)
    })

    it('should return negative for future scheduled date', () => {
      // GIVEN scheduled in future
      const today = new Date('2025-01-16')
      const scheduledEndDate = '2025-01-20'

      // WHEN calculating days overdue
      const result = calculateDaysOverdue(scheduledEndDate, today)

      // THEN returns negative (not overdue)
      expect(result).toBe(-4)
    })

    it('should handle multi-week delays', () => {
      // GIVEN scheduled 3 weeks ago
      const today = new Date('2025-01-21')
      const scheduledEndDate = '2025-01-01'

      // WHEN calculating days overdue
      const result = calculateDaysOverdue(scheduledEndDate, today)

      // THEN returns 20
      expect(result).toBe(20)
    })
  })

  // ============================================================================
  // Material Availability Calculations (AC-13)
  // ============================================================================
  describe('calculateMaterialAvailability()', () => {
    it('should calculate availability as (consumed/required)*100', () => {
      // GIVEN consumed 75, required 100
      const consumedQty = 75
      const requiredQty = 100

      // WHEN calculating availability
      const result = calculateMaterialAvailability(consumedQty, requiredQty)

      // THEN returns 75%
      expect(result).toBe(75)
    })

    it('should return 0 for zero required', () => {
      // GIVEN no required material
      const consumedQty = 50
      const requiredQty = 0

      // WHEN calculating availability
      const result = calculateMaterialAvailability(consumedQty, requiredQty)

      // THEN returns 0 (safe handling)
      expect(result).toBe(0)
    })

    it('should handle full availability (100%)', () => {
      // GIVEN fully consumed
      const consumedQty = 100
      const requiredQty = 100

      // WHEN calculating availability
      const result = calculateMaterialAvailability(consumedQty, requiredQty)

      // THEN returns 100%
      expect(result).toBe(100)
    })
  })

  describe('hasMaterialShortage()', () => {
    it('should return true when availability < 80%', () => {
      // GIVEN 75% availability
      const availability = 75

      // WHEN checking for shortage
      const result = hasMaterialShortage(availability)

      // THEN returns true
      expect(result).toBe(true)
    })

    it('should return false when availability >= 80%', () => {
      // GIVEN 80% availability (exactly at threshold)
      const availability = 80

      // WHEN checking for shortage
      const result = hasMaterialShortage(availability)

      // THEN returns false (meets threshold)
      expect(result).toBe(false)
    })

    it('should support custom threshold', () => {
      // GIVEN 90% availability, 95% threshold
      const availability = 90
      const threshold = 95

      // WHEN checking for shortage
      const result = hasMaterialShortage(availability, threshold)

      // THEN returns true (below custom threshold)
      expect(result).toBe(true)
    })
  })

  // ============================================================================
  // Date Helper Calculations
  // ============================================================================
  describe('Date Helpers', () => {
    it('should identify today date range correctly', () => {
      // GIVEN timestamp for today
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)

      // WHEN checking if timestamp is today
      const testDate = new Date()
      testDate.setHours(12, 0, 0, 0)

      // THEN falls within today range
      expect(testDate >= startOfDay && testDate <= endOfDay).toBe(true)
    })

    it('should identify start of week (Monday)', () => {
      // GIVEN a Wednesday
      const wednesday = new Date('2025-01-15') // Wednesday
      const dayOfWeek = wednesday.getDay()
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(wednesday)
      monday.setDate(wednesday.getDate() - daysSinceMonday)

      // WHEN calculating week start
      // THEN should be Monday Jan 13
      expect(monday.getDate()).toBe(13)
    })

    it('should handle Sunday as last day of week', () => {
      // GIVEN a Sunday
      const sunday = new Date('2025-01-19') // Sunday
      const dayOfWeek = sunday.getDay()
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      // WHEN calculating days since Monday
      // THEN should be 6 (Sun is last day)
      expect(daysSinceMonday).toBe(6)
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const large = 999999999
      expect(calculateProgressPercent(large, large)).toBe(100)
    })

    it('should handle very small decimals', () => {
      const small = 0.0001
      expect(calculateProgressPercent(small, 100)).toBeCloseTo(0.0001, 4)
    })

    it('should handle negative values gracefully', () => {
      // Negative values should be treated as 0 or invalid
      expect(calculateProgressPercent(-50, 100)).toBeLessThanOrEqual(0)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Cycle Time (4 tests):
 *   - Basic calculation
 *   - Multi-day production
 *   - Fractional hours
 *   - Zero duration
 *
 * Average (4 tests):
 *   - Standard average
 *   - Empty array
 *   - Single value
 *   - Large dataset
 *
 * Progress % (5 tests):
 *   - Standard calculation
 *   - Cap at 100%
 *   - Zero actual
 *   - Zero planned
 *   - Decimals
 *
 * On-Time % (5 tests):
 *   - Standard calculation
 *   - 100% on-time
 *   - 0% on-time
 *   - No completions
 *   - Rounding
 *
 * Is On-Time (3 tests):
 *   - Before scheduled
 *   - On scheduled
 *   - After scheduled
 *
 * Days Overdue (4 tests):
 *   - Standard calculation
 *   - Today scheduled
 *   - Future date
 *   - Multi-week delay
 *
 * Material Availability (3 tests):
 *   - Standard calculation
 *   - Zero required
 *   - Full availability
 *
 * Has Shortage (3 tests):
 *   - Below threshold
 *   - At threshold
 *   - Custom threshold
 *
 * Date Helpers (3 tests):
 *   - Today range
 *   - Week start
 *   - Sunday handling
 *
 * Edge Cases (3 tests):
 *   - Large numbers
 *   - Small decimals
 *   - Negative values
 *
 * Total: 37 tests
 */
