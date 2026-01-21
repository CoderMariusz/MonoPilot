/**
 * Unit Tests: OutputProgressCard Component (Story 04.7d)
 *
 * Tests progress display with:
 * - Quantities (planned, output, remaining)
 * - Progress bar and percentage
 * - Over-production handling
 * - Status badges
 * - Loading state
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OutputProgressCard } from '../OutputProgressCard'
import type { WOProgressResponse } from '@/lib/services/output-aggregation-service'

// Mock progress data
const mockProgress: WOProgressResponse = {
  wo_id: 'wo-123',
  wo_number: 'WO-2025-0001',
  planned_qty: 1000,
  output_qty: 700,
  progress_percent: 70,
  remaining_qty: 300,
  outputs_count: 5,
  is_complete: false,
  auto_complete_enabled: true,
  status: 'in_progress',
}

describe('OutputProgressCard Component (Story 04.7d)', () => {
  // ============================================================================
  // Loading State Tests
  // ============================================================================
  describe('Loading State', () => {
    it('displays skeleton when loading', () => {
      render(<OutputProgressCard progress={null} isLoading={true} />)
      expect(screen.getByTestId('progress-card-skeleton')).toBeInTheDocument()
    })

    it('does not show data when loading', () => {
      render(<OutputProgressCard progress={mockProgress} isLoading={true} />)
      expect(screen.queryByTestId('output-progress-card')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty State Tests
  // ============================================================================
  describe('Empty State', () => {
    it('displays no data message when progress is null', () => {
      render(<OutputProgressCard progress={null} />)
      expect(screen.getByText('No progress data available')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Quantities Display Tests
  // ============================================================================
  describe('Quantities Display', () => {
    it('displays planned quantity', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('planned-qty')).toHaveTextContent('1,000')
    })

    it('displays output quantity', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('output-qty')).toHaveTextContent('700')
    })

    it('displays remaining quantity', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('remaining-qty')).toHaveTextContent('300')
    })

    it('displays unit of measure', () => {
      render(<OutputProgressCard progress={mockProgress} uom="lbs" />)
      // UoM should appear multiple times
      const uomElements = screen.getAllByText('lbs')
      expect(uomElements.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Progress Bar Tests
  // ============================================================================
  describe('Progress Bar', () => {
    it('displays progress percentage', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('progress-percent')).toHaveTextContent('70.0%')
    })

    it('displays progress bar', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
    })

    it('has correct aria attributes', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('aria-label', 'Production progress: 70.0%')
    })
  })

  // ============================================================================
  // Over-production Tests
  // ============================================================================
  describe('Over-production', () => {
    const overProductionProgress: WOProgressResponse = {
      ...mockProgress,
      output_qty: 1200,
      progress_percent: 120,
      remaining_qty: 0,
    }

    it('displays >100% percentage', () => {
      render(<OutputProgressCard progress={overProductionProgress} />)
      expect(screen.getByTestId('progress-percent')).toHaveTextContent('120.0%')
    })

    it('displays over-production message', () => {
      render(<OutputProgressCard progress={overProductionProgress} />)
      expect(screen.getByTestId('over-production-message')).toBeInTheDocument()
      expect(screen.getByText(/20.0% above planned/)).toBeInTheDocument()
    })

    it('styles output qty in green for over-production', () => {
      render(<OutputProgressCard progress={overProductionProgress} />)
      const outputQty = screen.getByTestId('output-qty')
      expect(outputQty).toHaveClass('text-green-600')
    })
  })

  // ============================================================================
  // Completion Status Tests
  // ============================================================================
  describe('Completion Status', () => {
    it('displays complete badge when is_complete is true', () => {
      const completeProgress: WOProgressResponse = {
        ...mockProgress,
        is_complete: true,
        status: 'completed',
      }
      render(<OutputProgressCard progress={completeProgress} />)
      expect(screen.getByTestId('complete-badge')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('displays auto-complete badge when enabled and not complete', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('auto-complete-badge')).toBeInTheDocument()
      expect(screen.getByText('Auto-Complete On')).toBeInTheDocument()
    })

    it('does not display auto-complete badge when completed', () => {
      const completeProgress: WOProgressResponse = {
        ...mockProgress,
        is_complete: true,
        auto_complete_enabled: true,
      }
      render(<OutputProgressCard progress={completeProgress} />)
      expect(screen.queryByTestId('auto-complete-badge')).not.toBeInTheDocument()
    })

    it('displays WO status badge', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('wo-status')).toHaveTextContent('in progress')
    })
  })

  // ============================================================================
  // Outputs Count Tests
  // ============================================================================
  describe('Outputs Count', () => {
    it('displays outputs count', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByTestId('outputs-count')).toHaveTextContent('5')
    })

    it('uses singular "output" for count of 1', () => {
      const singleOutput: WOProgressResponse = {
        ...mockProgress,
        outputs_count: 1,
      }
      render(<OutputProgressCard progress={singleOutput} />)
      expect(screen.getByText(/output registered/)).toBeInTheDocument()
      expect(screen.queryByText(/outputs registered/)).not.toBeInTheDocument()
    })

    it('uses plural "outputs" for count > 1', () => {
      render(<OutputProgressCard progress={mockProgress} />)
      expect(screen.getByText(/outputs registered/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Number Formatting Tests
  // ============================================================================
  describe('Number Formatting', () => {
    it('formats large numbers with commas', () => {
      const largeProgress: WOProgressResponse = {
        ...mockProgress,
        planned_qty: 50000,
        output_qty: 32500,
        remaining_qty: 17500,
      }
      render(<OutputProgressCard progress={largeProgress} />)
      expect(screen.getByTestId('planned-qty')).toHaveTextContent('50,000')
      expect(screen.getByTestId('output-qty')).toHaveTextContent('32,500')
      expect(screen.getByTestId('remaining-qty')).toHaveTextContent('17,500')
    })
  })
})

/**
 * Test Coverage Summary for OutputProgressCard (Story 04.7d)
 * ===========================================================
 *
 * Loading State: 2 tests
 *   - Skeleton display
 *   - Data not shown while loading
 *
 * Empty State: 1 test
 *   - No data message
 *
 * Quantities Display: 4 tests
 *   - Planned qty
 *   - Output qty
 *   - Remaining qty
 *   - Unit of measure
 *
 * Progress Bar: 3 tests
 *   - Percentage display
 *   - Bar element
 *   - Aria attributes
 *
 * Over-production: 3 tests
 *   - >100% percentage
 *   - Over-production message
 *   - Green styling
 *
 * Completion Status: 4 tests
 *   - Complete badge
 *   - Auto-complete badge (when not complete)
 *   - No auto-complete badge (when complete)
 *   - WO status badge
 *
 * Outputs Count: 3 tests
 *   - Count display
 *   - Singular form
 *   - Plural form
 *
 * Number Formatting: 1 test
 *   - Large numbers with commas
 *
 * Total: 21 tests
 */
