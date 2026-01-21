/**
 * VarianceIndicator Component Tests
 * Story: 04.6e - Over-Consumption Control
 *
 * Tests the variance indicator component for proper rendering,
 * color coding, and icon selection based on variance percentage.
 *
 * RED PHASE: All tests should FAIL until component is implemented.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VarianceIndicator } from '../VarianceIndicator'

describe('VarianceIndicator Component (Story 04.6e)', () => {
  // ==========================================================================
  // Exact Match (0%) - Green
  // ==========================================================================
  describe('Exact Match (0% Variance)', () => {
    it('should render 0% for zero variance', () => {
      render(<VarianceIndicator variancePercent={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should render green color for 0% variance', () => {
      render(<VarianceIndicator variancePercent={0} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-green-600')
    })

    it('should render CheckCircle icon for 0% variance', () => {
      render(<VarianceIndicator variancePercent={0} />)
      const icon = screen.getByTestId('variance-icon')
      expect(icon).toHaveAttribute('data-icon', 'check-circle')
    })

    it('should display green background for exact match', () => {
      render(<VarianceIndicator variancePercent={0} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('bg-green-50')
    })
  })

  // ==========================================================================
  // Acceptable Variance (1-10%) - Yellow
  // ==========================================================================
  describe('Acceptable Variance (1-10%)', () => {
    it('should render +5% for 5% variance', () => {
      render(<VarianceIndicator variancePercent={5} />)
      expect(screen.getByText('+5%')).toBeInTheDocument()
    })

    it('should render yellow color for 5% variance', () => {
      render(<VarianceIndicator variancePercent={5} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-yellow-600')
    })

    it('should render AlertTriangle icon for acceptable variance', () => {
      render(<VarianceIndicator variancePercent={5} />)
      const icon = screen.getByTestId('variance-icon')
      expect(icon).toHaveAttribute('data-icon', 'alert-triangle')
    })

    it('should display yellow background for acceptable variance', () => {
      render(<VarianceIndicator variancePercent={5} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('bg-yellow-50')
    })

    it('should render +1% for boundary case at 1%', () => {
      render(<VarianceIndicator variancePercent={1} />)
      expect(screen.getByText('+1%')).toBeInTheDocument()
    })

    it('should render +10% for boundary case at 10%', () => {
      render(<VarianceIndicator variancePercent={10} />)
      expect(screen.getByText('+10%')).toBeInTheDocument()
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-yellow-600')
    })
  })

  // ==========================================================================
  // High Variance (>10%) - Red
  // ==========================================================================
  describe('High Variance (>10%)', () => {
    it('should render +15% for 15% variance', () => {
      render(<VarianceIndicator variancePercent={15} />)
      expect(screen.getByText('+15%')).toBeInTheDocument()
    })

    it('should render red color for high variance', () => {
      render(<VarianceIndicator variancePercent={15} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-red-600')
    })

    it('should render XCircle icon for high variance', () => {
      render(<VarianceIndicator variancePercent={15} />)
      const icon = screen.getByTestId('variance-icon')
      expect(icon).toHaveAttribute('data-icon', 'x-circle')
    })

    it('should display red background for high variance', () => {
      render(<VarianceIndicator variancePercent={15} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('bg-red-50')
    })

    it('should render +11% for boundary case at 11%', () => {
      render(<VarianceIndicator variancePercent={11} />)
      expect(screen.getByText('+11%')).toBeInTheDocument()
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-red-600')
    })

    it('should handle very high variance (50%)', () => {
      render(<VarianceIndicator variancePercent={50} />)
      expect(screen.getByText('+50%')).toBeInTheDocument()
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-red-600')
    })
  })

  // ==========================================================================
  // Decimal Formatting
  // ==========================================================================
  describe('Decimal Formatting', () => {
    it('should format 7.5% variance correctly', () => {
      render(<VarianceIndicator variancePercent={7.5} />)
      expect(screen.getByText('+7.5%')).toBeInTheDocument()
    })

    it('should format 0.5% variance correctly (rounds to acceptable)', () => {
      render(<VarianceIndicator variancePercent={0.5} />)
      expect(screen.getByText('+0.5%')).toBeInTheDocument()
    })

    it('should format 10.5% variance correctly (high variance)', () => {
      render(<VarianceIndicator variancePercent={10.5} />)
      expect(screen.getByText('+10.5%')).toBeInTheDocument()
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-red-600')
    })

    it('should round to 1 decimal place for 7.56%', () => {
      render(<VarianceIndicator variancePercent={7.56} />)
      expect(screen.getByText('+7.6%')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Size Variants
  // ==========================================================================
  describe('Size Variants', () => {
    it('should render small size variant', () => {
      render(<VarianceIndicator variancePercent={5} size="sm" />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-xs')
    })

    it('should render medium size (default)', () => {
      render(<VarianceIndicator variancePercent={5} />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-sm')
    })

    it('should render medium size explicitly', () => {
      render(<VarianceIndicator variancePercent={5} size="md" />)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-sm')
    })
  })

  // ==========================================================================
  // Accessibility
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have aria-label with variance status', () => {
      render(<VarianceIndicator variancePercent={5} />)
      expect(screen.getByLabelText(/variance.*5%/i)).toBeInTheDocument()
    })

    it('should have aria-hidden on icon', () => {
      render(<VarianceIndicator variancePercent={5} />)
      const icon = screen.getByTestId('variance-icon')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should indicate high variance status in aria-label', () => {
      render(<VarianceIndicator variancePercent={15} />)
      expect(screen.getByLabelText(/high variance/i)).toBeInTheDocument()
    })

    it('should indicate exact match status in aria-label', () => {
      render(<VarianceIndicator variancePercent={0} />)
      expect(screen.getByLabelText(/exact match/i)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle negative variance (under-consumption)', () => {
      render(<VarianceIndicator variancePercent={-5} />)
      expect(screen.getByText('-5%')).toBeInTheDocument()
      // Negative variance should show green (under budget)
      const indicator = screen.getByTestId('variance-indicator')
      expect(indicator).toHaveClass('text-green-600')
    })

    it('should handle very small positive variance (0.1%)', () => {
      render(<VarianceIndicator variancePercent={0.1} />)
      expect(screen.getByText('+0.1%')).toBeInTheDocument()
    })

    it('should handle null variance as 0%', () => {
      // @ts-expect-error Testing edge case
      render(<VarianceIndicator variancePercent={null} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle undefined variance as 0%', () => {
      // @ts-expect-error Testing edge case
      render(<VarianceIndicator variancePercent={undefined} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Exact Match (4 tests):
 *   - 0% text display
 *   - Green color class
 *   - CheckCircle icon
 *   - Green background
 *
 * Acceptable Variance (6 tests):
 *   - 5% display with + prefix
 *   - Yellow color class
 *   - AlertTriangle icon
 *   - Yellow background
 *   - Boundary at 1%
 *   - Boundary at 10%
 *
 * High Variance (6 tests):
 *   - 15% display with + prefix
 *   - Red color class
 *   - XCircle icon
 *   - Red background
 *   - Boundary at 11%
 *   - Very high variance (50%)
 *
 * Decimal Formatting (4 tests):
 *   - 7.5% format
 *   - 0.5% format
 *   - 10.5% format
 *   - Rounding to 1 decimal
 *
 * Size Variants (3 tests):
 *   - Small size
 *   - Medium default
 *   - Medium explicit
 *
 * Accessibility (4 tests):
 *   - aria-label with variance
 *   - aria-hidden on icon
 *   - High variance indication
 *   - Exact match indication
 *
 * Edge Cases (4 tests):
 *   - Negative variance
 *   - Very small variance
 *   - Null handling
 *   - Undefined handling
 *
 * Total: 31 tests
 */
