/**
 * Unit Tests: YieldIndicator Component (Story 04.7a)
 *
 * Tests yield display with color-coded indicators:
 * - Green: >= 95%
 * - Yellow: 80-94%
 * - Red: < 80%
 * - N/A: null value
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { YieldIndicator } from '../YieldIndicator'

describe('YieldIndicator Component (Story 04.7a)', () => {
  // ============================================================================
  // Color Coding Tests (FR-PROD-014)
  // ============================================================================
  describe('Color Coding', () => {
    it('AC: displays green indicator for yield >= 95%', () => {
      render(<YieldIndicator value={95} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-green-100')
      expect(screen.getByText('95.0%')).toBeInTheDocument()
    })

    it('AC: displays green indicator for yield = 100%', () => {
      render(<YieldIndicator value={100} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-green-100')
      expect(screen.getByText('100.0%')).toBeInTheDocument()
    })

    it('AC: displays yellow indicator for yield 80-94%', () => {
      render(<YieldIndicator value={85} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-yellow-100')
      expect(screen.getByText('85.0%')).toBeInTheDocument()
    })

    it('AC: displays yellow indicator at boundary (80%)', () => {
      render(<YieldIndicator value={80} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-yellow-100')
      expect(screen.getByText('80.0%')).toBeInTheDocument()
    })

    it('AC: displays yellow indicator at boundary (94%)', () => {
      render(<YieldIndicator value={94} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-yellow-100')
      expect(screen.getByText('94.0%')).toBeInTheDocument()
    })

    it('AC: displays red indicator for yield < 80%', () => {
      render(<YieldIndicator value={75} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-red-100')
      expect(screen.getByText('75.0%')).toBeInTheDocument()
    })

    it('AC: displays red indicator at boundary (79%)', () => {
      render(<YieldIndicator value={79} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-red-100')
      expect(screen.getByText('79.0%')).toBeInTheDocument()
    })

    it('displays green for over-production yield (> 100%)', () => {
      render(<YieldIndicator value={110} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-green-100')
      expect(screen.getByText('110.0%')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // N/A Display Tests
  // ============================================================================
  describe('N/A Display', () => {
    it('AC: displays N/A for null value', () => {
      render(<YieldIndicator value={null} />)
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('displays red styling for N/A value', () => {
      render(<YieldIndicator value={null} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('bg-red-100')
    })
  })

  // ============================================================================
  // Trend Indicator Tests
  // ============================================================================
  describe('Trend Indicator', () => {
    it('displays positive trend with + sign', () => {
      render(<YieldIndicator value={95} trend={2.5} />)
      expect(screen.getByText('+2.5%')).toBeInTheDocument()
    })

    it('displays negative trend without + sign', () => {
      render(<YieldIndicator value={85} trend={-3.2} />)
      expect(screen.getByText('-3.2%')).toBeInTheDocument()
    })

    it('displays zero trend', () => {
      render(<YieldIndicator value={90} trend={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('does not display trend when not provided', () => {
      render(<YieldIndicator value={90} />)
      // Trend indicator would show + or - sign, not just %
      expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument()
      expect(screen.queryByText(/-\d.*%$/)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Size Variants Tests
  // ============================================================================
  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<YieldIndicator value={95} size="sm" />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('text-xs')
    })

    it('renders medium size (default)', () => {
      render(<YieldIndicator value={95} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('text-sm')
    })

    it('renders large size', () => {
      render(<YieldIndicator value={95} size="lg" />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveClass('text-base')
    })
  })

  // ============================================================================
  // Label Display Tests
  // ============================================================================
  describe('Label Display', () => {
    it('does not show label by default', () => {
      render(<YieldIndicator value={95} />)
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument()
    })

    it('shows "Excellent" label for green yield when showLabel is true', () => {
      render(<YieldIndicator value={95} showLabel />)
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('shows "Below Target" label for yellow yield when showLabel is true', () => {
      render(<YieldIndicator value={85} showLabel />)
      expect(screen.getByText('Below Target')).toBeInTheDocument()
    })

    it('shows "Low Yield" label for red yield when showLabel is true', () => {
      render(<YieldIndicator value={65} showLabel />)
      expect(screen.getByText('Low Yield')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('Accessibility', () => {
    it('has accessible aria-label', () => {
      render(<YieldIndicator value={95} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveAttribute('aria-label', 'Yield: 95.0% - Excellent')
    })

    it('includes N/A in aria-label for null value', () => {
      render(<YieldIndicator value={null} />)
      const indicator = screen.getByTestId('yield-indicator')
      expect(indicator).toHaveAttribute('aria-label', 'Yield: N/A')
    })
  })

  // ============================================================================
  // Decimal Formatting Tests
  // ============================================================================
  describe('Decimal Formatting', () => {
    it('formats yield with 1 decimal place', () => {
      render(<YieldIndicator value={95.567} />)
      expect(screen.getByText('95.6%')).toBeInTheDocument()
    })

    it('shows .0 for whole numbers', () => {
      render(<YieldIndicator value={90} />)
      expect(screen.getByText('90.0%')).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for YieldIndicator (Story 04.7a)
 * ======================================================
 *
 * Color Coding: 8 tests
 *   - Green at 95%
 *   - Green at 100%
 *   - Yellow at 85%
 *   - Yellow at 80% (boundary)
 *   - Yellow at 94% (boundary)
 *   - Red at 75%
 *   - Red at 79% (boundary)
 *   - Green at 110% (over-production)
 *
 * N/A Display: 2 tests
 *   - N/A text
 *   - Red styling
 *
 * Trend Indicator: 4 tests
 *   - Positive trend
 *   - Negative trend
 *   - Zero trend
 *   - No trend
 *
 * Size Variants: 3 tests
 *   - Small, Medium, Large
 *
 * Label Display: 4 tests
 *   - Default hidden
 *   - Excellent
 *   - Below Target
 *   - Low Yield
 *
 * Accessibility: 2 tests
 *   - aria-label with value
 *   - aria-label with N/A
 *
 * Decimal Formatting: 2 tests
 *   - Rounding
 *   - Whole numbers
 *
 * Total: 25 tests
 */
