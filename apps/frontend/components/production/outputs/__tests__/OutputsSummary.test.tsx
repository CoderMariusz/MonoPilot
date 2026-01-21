/**
 * Unit Tests: OutputsSummary Component (Story 04.7d)
 *
 * Tests summary display with:
 * - Total outputs count and quantity
 * - Breakdown by QA status
 * - Loading state
 * - Number formatting
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OutputsSummary } from '../OutputsSummary'
import type { OutputsSummary as OutputsSummaryType } from '@/lib/services/output-aggregation-service'

// Mock summary data
const mockSummary: OutputsSummaryType = {
  total_outputs: 10,
  total_qty: 3500,
  approved_count: 5,
  approved_qty: 2000,
  pending_count: 3,
  pending_qty: 1000,
  rejected_count: 2,
  rejected_qty: 500,
}

describe('OutputsSummary Component (Story 04.7d)', () => {
  // ============================================================================
  // Loading State Tests
  // ============================================================================
  describe('Loading State', () => {
    it('displays skeleton when loading', () => {
      render(<OutputsSummary summary={mockSummary} isLoading={true} />)
      expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
    })

    it('does not show data when loading', () => {
      render(<OutputsSummary summary={mockSummary} isLoading={true} />)
      expect(screen.queryByTestId('outputs-summary')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Total Display Tests
  // ============================================================================
  describe('Total Display', () => {
    it('displays total outputs count', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-total-count')).toHaveTextContent('10')
    })

    it('displays total quantity', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-total-qty')).toHaveTextContent('3,500')
    })
  })

  // ============================================================================
  // Approved Stats Tests
  // ============================================================================
  describe('Approved Stats', () => {
    it('displays approved count', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-approved-count')).toHaveTextContent('5')
    })

    it('displays approved quantity', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-approved-qty')).toHaveTextContent('2,000')
    })
  })

  // ============================================================================
  // Pending Stats Tests
  // ============================================================================
  describe('Pending Stats', () => {
    it('displays pending count', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-pending-count')).toHaveTextContent('3')
    })

    it('displays pending quantity', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-pending-qty')).toHaveTextContent('1,000')
    })
  })

  // ============================================================================
  // Rejected Stats Tests
  // ============================================================================
  describe('Rejected Stats', () => {
    it('displays rejected count', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-rejected-count')).toHaveTextContent('2')
    })

    it('displays rejected quantity', () => {
      render(<OutputsSummary summary={mockSummary} />)
      expect(screen.getByTestId('stat-rejected-qty')).toHaveTextContent('500')
    })
  })

  // ============================================================================
  // Unit of Measure Tests
  // ============================================================================
  describe('Unit of Measure', () => {
    it('displays default UoM (kg)', () => {
      render(<OutputsSummary summary={mockSummary} />)
      const uomElements = screen.getAllByText('kg')
      expect(uomElements.length).toBe(4) // Total, Approved, Pending, Rejected
    })

    it('displays custom UoM', () => {
      render(<OutputsSummary summary={mockSummary} uom="lbs" />)
      const uomElements = screen.getAllByText('lbs')
      expect(uomElements.length).toBe(4)
    })
  })

  // ============================================================================
  // Number Formatting Tests
  // ============================================================================
  describe('Number Formatting', () => {
    it('formats large quantities with commas', () => {
      const largeSummary: OutputsSummaryType = {
        total_outputs: 100,
        total_qty: 125000,
        approved_count: 75,
        approved_qty: 100000,
        pending_count: 20,
        pending_qty: 20000,
        rejected_count: 5,
        rejected_qty: 5000,
      }
      render(<OutputsSummary summary={largeSummary} />)
      expect(screen.getByTestId('stat-total-qty')).toHaveTextContent('125,000')
      expect(screen.getByTestId('stat-approved-qty')).toHaveTextContent('100,000')
    })
  })

  // ============================================================================
  // Zero Values Tests
  // ============================================================================
  describe('Zero Values', () => {
    it('displays zero counts correctly', () => {
      const emptyStats: OutputsSummaryType = {
        total_outputs: 0,
        total_qty: 0,
        approved_count: 0,
        approved_qty: 0,
        pending_count: 0,
        pending_qty: 0,
        rejected_count: 0,
        rejected_qty: 0,
      }
      render(<OutputsSummary summary={emptyStats} />)
      expect(screen.getByTestId('stat-total-count')).toHaveTextContent('0')
      expect(screen.getByTestId('stat-total-qty')).toHaveTextContent('0')
    })
  })
})

/**
 * Test Coverage Summary for OutputsSummary (Story 04.7d)
 * ======================================================
 *
 * Loading State: 2 tests
 *   - Skeleton display
 *   - Data not shown while loading
 *
 * Total Display: 2 tests
 *   - Count
 *   - Quantity
 *
 * Approved Stats: 2 tests
 *   - Count
 *   - Quantity
 *
 * Pending Stats: 2 tests
 *   - Count
 *   - Quantity
 *
 * Rejected Stats: 2 tests
 *   - Count
 *   - Quantity
 *
 * Unit of Measure: 2 tests
 *   - Default UoM
 *   - Custom UoM
 *
 * Number Formatting: 1 test
 *   - Large numbers
 *
 * Zero Values: 1 test
 *   - Empty stats
 *
 * Total: 14 tests
 */
