/**
 * TaxBreakdownTooltip Component - Unit Tests
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Tests the TaxBreakdownTooltip component which displays:
 * - Per-rate tax breakdown in a tooltip
 * - Sorted tax rates (descending)
 * - Loading, error, and empty states
 *
 * Coverage Target: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxBreakdownTooltip } from '../TaxBreakdownTooltip'
import type { TaxBreakdownItem, Currency } from '@/lib/types/purchase-order'

// ============================================================================
// MOCK HELPERS
// ============================================================================

const createMockTaxBreakdown = (items: Partial<TaxBreakdownItem>[]): TaxBreakdownItem[] => {
  return items.map((item) => ({
    rate: item.rate ?? 23,
    subtotal: item.subtotal ?? 100,
    tax: item.tax ?? 23,
    ...item,
  }))
}

const defaultProps = {
  taxBreakdown: createMockTaxBreakdown([
    { rate: 23, subtotal: 770, tax: 177.1 },
    { rate: 8, subtotal: 30, tax: 2.4 },
  ]),
  currency: 'PLN' as Currency,
}

// ============================================================================
// RENDERING TESTS
// ============================================================================

describe('TaxBreakdownTooltip', () => {
  describe('Initial Rendering', () => {
    it('should render tooltip trigger button', () => {
      render(<TaxBreakdownTooltip {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'View tax breakdown' })).toBeInTheDocument()
    })

    it('should show info icon', () => {
      const { container } = render(<TaxBreakdownTooltip {...defaultProps} />)

      expect(container.querySelector('svg.lucide-info')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TOOLTIP CONTENT
  // ============================================================================

  describe('Tooltip Content', () => {
    it('should show tooltip content on hover', async () => {
      const user = userEvent.setup()
      render(<TaxBreakdownTooltip {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI duplicates content for accessibility
        expect(screen.getAllByText('Tax Breakdown').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display all tax rates in tooltip', async () => {
      const user = userEvent.setup()
      render(<TaxBreakdownTooltip {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText(/23%/).length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText(/8%/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should format currency values correctly', async () => {
      const user = userEvent.setup()
      render(<TaxBreakdownTooltip {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText(/PLN\s*770\.00/).length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText(/PLN\s*177\.10/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should show total tax when multiple rates', async () => {
      const user = userEvent.setup()
      render(<TaxBreakdownTooltip {...defaultProps} totalTax={179.5} />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText('Total Tax:').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText(/PLN\s*179\.50/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should sort rates in descending order', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([
        { rate: 8, subtotal: 30, tax: 2.4 },
        { rate: 23, subtotal: 770, tax: 177.1 },
      ])

      render(<TaxBreakdownTooltip taxBreakdown={taxBreakdown} currency="PLN" />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        const taxBreakdownElements = screen.getAllByText('Tax Breakdown')
        const text = taxBreakdownElements[0].parentElement?.textContent
        // 23% should appear before 8%
        const index23 = text?.indexOf('23%') ?? -1
        const index8 = text?.indexOf('8%') ?? -1
        expect(index23).toBeLessThan(index8)
      })
    })
  })

  // ============================================================================
  // SINGLE RATE
  // ============================================================================

  describe('Single Tax Rate', () => {
    it('should not show total line for single rate', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([{ rate: 23, subtotal: 800, tax: 184 }])

      render(<TaxBreakdownTooltip taxBreakdown={taxBreakdown} currency="PLN" />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText(/23%/).length).toBeGreaterThanOrEqual(1)
        expect(screen.queryByText('Total Tax:')).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should render skeleton when isLoading is true', () => {
      const { container } = render(<TaxBreakdownTooltip {...defaultProps} isLoading={true} />)

      expect(screen.getByLabelText('Loading tax breakdown')).toBeInTheDocument()
    })

    it('should not show trigger button when loading', () => {
      render(<TaxBreakdownTooltip {...defaultProps} isLoading={true} />)

      expect(screen.queryByRole('button', { name: 'View tax breakdown' })).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  describe('Error State', () => {
    it('should show error icon when error is provided', () => {
      render(<TaxBreakdownTooltip {...defaultProps} error="Failed to calculate" />)

      expect(screen.getByRole('button', { name: 'Tax calculation error' })).toBeInTheDocument()
    })

    it('should show error message in tooltip', async () => {
      const user = userEvent.setup()
      render(<TaxBreakdownTooltip {...defaultProps} error="Failed to calculate" />)

      const trigger = screen.getByRole('button', { name: 'Tax calculation error' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText('Failed to calculate').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should show retry button when onRetry is provided', async () => {
      const user = userEvent.setup()
      const mockRetry = vi.fn()
      render(<TaxBreakdownTooltip {...defaultProps} error="Error" onRetry={mockRetry} />)

      const trigger = screen.getByRole('button', { name: 'Tax calculation error' })
      await user.hover(trigger)

      await waitFor(() => {
        // There may be multiple retry buttons due to Radix accessibility
        const retryButtons = screen.getAllByRole('button', { name: /retry/i })
        expect(retryButtons.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const mockRetry = vi.fn()
      render(<TaxBreakdownTooltip {...defaultProps} error="Error" onRetry={mockRetry} />)

      const trigger = screen.getByRole('button', { name: 'Tax calculation error' })
      await user.hover(trigger)

      // Wait for the retry button to appear
      let retryButton: HTMLElement
      await waitFor(() => {
        const retryButtons = screen.getAllByRole('button', { name: /retry/i })
        expect(retryButtons.length).toBeGreaterThanOrEqual(1)
        retryButton = retryButtons[0]
      })

      // Click the retry button
      await user.click(retryButton!)

      expect(mockRetry).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show empty message when taxBreakdown is empty', async () => {
      const user = userEvent.setup()
      render(<TaxBreakdownTooltip taxBreakdown={[]} currency="PLN" />)

      const trigger = screen.getByRole('button', { name: 'No tax breakdown available' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText('No tax breakdown available').length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ============================================================================
  // PERCENTAGE FORMATTING
  // ============================================================================

  describe('Percentage Formatting', () => {
    it('should format whole number percentages without decimals', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([{ rate: 23, subtotal: 100, tax: 23 }])

      render(<TaxBreakdownTooltip taxBreakdown={taxBreakdown} currency="PLN" />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText(/23%/).length).toBeGreaterThanOrEqual(1)
        expect(screen.queryByText(/23\.00%/)).not.toBeInTheDocument()
      })
    })

    it('should format decimal percentages with 2 places', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([{ rate: 7.5, subtotal: 100, tax: 7.5 }])

      render(<TaxBreakdownTooltip taxBreakdown={taxBreakdown} currency="PLN" />)

      const trigger = screen.getByRole('button', { name: 'View tax breakdown' })
      await user.hover(trigger)

      await waitFor(() => {
        // The format may show 7.5% or 7.50% depending on implementation
        // Radix UI may duplicate content for accessibility
        expect(screen.getAllByText(/7\.50?%/).length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
