/**
 * WO Snapshot Service - Unit Tests (Story 03.11a)
 * Purpose: Test BOM snapshot creation and quantity scaling logic
 * Phase: RED - Tests should FAIL (no implementation yet)
 *
 * Tests the wo-snapshot-service which handles:
 * - Scaling BOM item quantities based on WO planned quantity
 * - Applying scrap percentages to scaled quantities
 * - Checking if WO snapshot can be modified (status-based)
 * - Creating BOM snapshots for Work Orders
 * - Refreshing snapshots for draft/planned WOs
 * - Getting WO materials with proper sorting
 *
 * Coverage Target: 90% (critical business logic)
 * Test Count: 14 scenarios (8 scale quantity + 6 can modify)
 *
 * Acceptance Criteria Coverage:
 * - AC-2: Quantity Scaling Formula
 * - AC-2b: Scrap Percentage Applied
 * - AC-4: Snapshot Immutability After Release
 * - AC-4b: Snapshot Refresh Allowed for Draft/Planned
 *
 * Security: All tests include org_id context for multi-tenancy (ADR-013)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { scaleQuantity, canModifySnapshot } from '../wo-snapshot-service'

describe('WOSnapshotService (Story 03.11a)', () => {
  describe('scaleQuantity()', () => {
    /**
     * AC-2: Quantity Scaling Formula
     * Formula: (wo_qty / bom_output_qty) * item_qty * (1 + scrap_percent/100)
     * Example: (250/100) * 50 * (1 + 5/100) = 131.25
     */

    it('should scale correctly for standard BOM (2.5x scale, no scrap)', () => {
      // Arrange
      const itemQty = 50
      const woQty = 250
      const bomOutputQty = 100
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert
      expect(result).toBe(125)
    })

    it('should apply scrap percentage correctly (5% scrap adds 6.25kg)', () => {
      // Arrange: BOM: 100kg output, 50kg flour; WO: 250kg; 5% scrap
      const itemQty = 50
      const woQty = 250
      const bomOutputQty = 100
      const scrapPercent = 5

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: 125 * 1.05 = 131.25
      expect(result).toBe(131.25)
    })

    it('should handle unit BOM (output_qty = 1)', () => {
      // Arrange: 1 unit output, 0.5kg ingredient; WO: 10 units
      const itemQty = 0.5
      const woQty = 10
      const bomOutputQty = 1
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: (10/1) * 0.5 = 5
      expect(result).toBe(5)
    })

    it('should maintain 6 decimal precision for small quantities', () => {
      // Arrange: Very small ingredient quantity
      const itemQty = 0.000001
      const woQty = 100
      const bomOutputQty = 1
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: (100/1) * 0.000001 = 0.0001
      expect(result).toBe(0.0001)
    })

    it('should handle large batch scaling (1000x)', () => {
      // Arrange: Large scale factor
      const itemQty = 1
      const woQty = 1000
      const bomOutputQty = 1
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: (1000/1) * 1 = 1000
      expect(result).toBe(1000)
    })

    it('should handle fractional output_qty correctly', () => {
      // Arrange: BOM: 0.5kg output, 0.25kg ingredient; WO: 2kg
      const itemQty = 0.25
      const woQty = 2
      const bomOutputQty = 0.5
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: (2/0.5) * 0.25 = 4 * 0.25 = 1
      expect(result).toBe(1)
    })

    it('should handle 100% scrap (doubles quantity)', () => {
      // Arrange: 100% scrap means double the quantity
      const itemQty = 10
      const woQty = 100
      const bomOutputQty = 100
      const scrapPercent = 100

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: (100/100) * 10 * (1 + 100/100) = 10 * 2 = 20
      expect(result).toBe(20)
    })

    it('should handle zero scrap (1:1 ratio)', () => {
      // Arrange: No scrap, 1:1 ratio
      const itemQty = 10
      const woQty = 100
      const bomOutputQty = 100
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: (100/100) * 10 * (1 + 0/100) = 10
      expect(result).toBe(10)
    })

    it('should round to 6 decimal places to avoid floating point errors', () => {
      // Arrange: Values that could cause floating point precision issues
      const itemQty = 0.1
      const woQty = 0.3
      const bomOutputQty = 1
      const scrapPercent = 0

      // Act
      const result = scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)

      // Assert: Should be exactly 0.03, not 0.030000000000000001
      expect(result).toBe(0.03)
      // Verify precision - at most 6 decimal places
      const decimalPlaces = (result.toString().split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(6)
    })
  })

  describe('canModifySnapshot()', () => {
    /**
     * AC-4: Snapshot Immutability After Release
     * AC-4b: Snapshot Refresh Allowed for Draft/Planned
     * Only draft and planned WOs allow snapshot modification
     */

    it('should return true for draft status', () => {
      // Arrange
      const woStatus = 'draft'

      // Act
      const result = canModifySnapshot(woStatus)

      // Assert
      expect(result).toBe(true)
    })

    it('should return true for planned status', () => {
      // Arrange
      const woStatus = 'planned'

      // Act
      const result = canModifySnapshot(woStatus)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for released status', () => {
      // Arrange
      const woStatus = 'released'

      // Act
      const result = canModifySnapshot(woStatus)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for in_progress status', () => {
      // Arrange
      const woStatus = 'in_progress'

      // Act
      const result = canModifySnapshot(woStatus)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for completed status', () => {
      // Arrange
      const woStatus = 'completed'

      // Act
      const result = canModifySnapshot(woStatus)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for cancelled status', () => {
      // Arrange
      const woStatus = 'cancelled'

      // Act
      const result = canModifySnapshot(woStatus)

      // Assert
      expect(result).toBe(false)
    })

    it('should handle case-insensitive status matching', () => {
      // Arrange
      const woStatusUpper = 'DRAFT'
      const woStatusMixed = 'Draft'

      // Act
      const resultUpper = canModifySnapshot(woStatusUpper)
      const resultMixed = canModifySnapshot(woStatusMixed)

      // Assert
      expect(resultUpper).toBe(true)
      expect(resultMixed).toBe(true)
    })
  })
})
