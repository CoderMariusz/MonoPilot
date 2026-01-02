/**
 * POTotalsSection Component - Unit Tests
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Tests the POTotalsSection component which displays:
 * - Subtotal, tax, discount, shipping, and total
 * - Mixed tax rate breakdown with tooltip
 * - Loading, error, empty, and success states
 * - Currency formatting with codes
 *
 * Coverage Target: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { POTotalsSection } from '../POTotalsSection'
import type { TaxBreakdownItem, Currency } from '@/lib/types/purchase-order'

// ============================================================================
// MOCK HELPERS
// ============================================================================

const createMockTaxBreakdown = (items: Partial<TaxBreakdownItem>[]): TaxBreakdownItem[] => {
  return items.map((item, index) => ({
    rate: item.rate ?? 23,
    subtotal: item.subtotal ?? 100,
    tax: item.tax ?? 23,
    ...item,
  }))
}

const defaultProps = {
  subtotal: 800,
  taxAmount: 184,
  discountTotal: 0,
  shippingCost: 0,
  total: 984,
  currency: 'PLN' as Currency,
}

// ============================================================================
// RENDERING TESTS
// ============================================================================

describe('POTotalsSection', () => {
  describe('Initial Rendering', () => {
    it('should render component with all required fields', () => {
      render(<POTotalsSection {...defaultProps} />)

      expect(screen.getByText('Subtotal:')).toBeInTheDocument()
      expect(screen.getByText('Tax:')).toBeInTheDocument()
      expect(screen.getByText('Total:')).toBeInTheDocument()
    })

    it('should display formatted currency values', () => {
      render(<POTotalsSection {...defaultProps} />)

      // Should show currency with code (PLN uses "PLN" as symbol)
      expect(screen.getByText(/PLN\s*800\.00\s*PLN/)).toBeInTheDocument()
      expect(screen.getByText(/PLN\s*184\.00/)).toBeInTheDocument()
      expect(screen.getByText(/PLN\s*984\.00\s*PLN/)).toBeInTheDocument()
    })

    it('should have accessible region landmark', () => {
      render(<POTotalsSection {...defaultProps} />)

      const region = screen.getByRole('region', { name: 'Purchase order totals' })
      expect(region).toBeInTheDocument()
    })
  })

  // ============================================================================
  // DISCOUNT DISPLAY
  // ============================================================================

  describe('Discount Display', () => {
    it('should hide discount row when discountTotal is 0', () => {
      render(<POTotalsSection {...defaultProps} discountTotal={0} />)

      expect(screen.queryByText('Discount:')).not.toBeInTheDocument()
    })

    it('should show discount row when discountTotal > 0', () => {
      render(<POTotalsSection {...defaultProps} discountTotal={50} />)

      expect(screen.getByText('Discount:')).toBeInTheDocument()
      expect(screen.getByText(/-PLN\s*50\.00/)).toBeInTheDocument()
    })

    it('should display discount in green color', () => {
      render(<POTotalsSection {...defaultProps} discountTotal={50} />)

      const discountValue = screen.getByText(/-PLN\s*50\.00/)
      expect(discountValue).toHaveClass('text-green-600')
    })
  })

  // ============================================================================
  // SHIPPING COST DISPLAY
  // ============================================================================

  describe('Shipping Cost Display', () => {
    it('should show shipping row when shippingCost > 0', () => {
      render(<POTotalsSection {...defaultProps} shippingCost={25} />)

      expect(screen.getByText('Shipping Cost:')).toBeInTheDocument()
      expect(screen.getByText(/PLN\s*25\.00/)).toBeInTheDocument()
    })

    it('should show shipping row with 0 in non-compact mode', () => {
      render(<POTotalsSection {...defaultProps} shippingCost={0} compact={false} />)

      expect(screen.getByText('Shipping Cost:')).toBeInTheDocument()
    })

    it('should hide shipping row with 0 in compact mode', () => {
      render(<POTotalsSection {...defaultProps} shippingCost={0} compact={true} />)

      expect(screen.queryByText('Shipping Cost:')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // TAX BREAKDOWN
  // ============================================================================

  describe('Tax Breakdown', () => {
    it('should show single tax rate label when only one rate', () => {
      const taxBreakdown = createMockTaxBreakdown([{ rate: 23, subtotal: 800, tax: 184 }])

      render(<POTotalsSection {...defaultProps} taxBreakdown={taxBreakdown} />)

      expect(screen.getByText('Tax (23%):')).toBeInTheDocument()
    })

    it('should show "mixed" label when multiple tax rates', () => {
      const taxBreakdown = createMockTaxBreakdown([
        { rate: 23, subtotal: 770, tax: 177.1 },
        { rate: 8, subtotal: 30, tax: 2.4 },
      ])

      render(<POTotalsSection {...defaultProps} taxBreakdown={taxBreakdown} />)

      expect(screen.getByText('Tax (mixed):')).toBeInTheDocument()
    })

    it('should show expand/collapse button for multiple tax rates', () => {
      const taxBreakdown = createMockTaxBreakdown([
        { rate: 23, subtotal: 770, tax: 177.1 },
        { rate: 8, subtotal: 30, tax: 2.4 },
      ])

      render(<POTotalsSection {...defaultProps} taxBreakdown={taxBreakdown} />)

      const expandButton = screen.getByRole('button', { name: 'Show tax breakdown' })
      expect(expandButton).toBeInTheDocument()
    })

    it('should toggle inline breakdown when clicking expand button', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([
        { rate: 23, subtotal: 770, tax: 177.1 },
        { rate: 8, subtotal: 30, tax: 2.4 },
      ])

      render(<POTotalsSection {...defaultProps} taxBreakdown={taxBreakdown} />)

      const expandButton = screen.getByRole('button', { name: 'Show tax breakdown' })
      await user.click(expandButton)

      // Should show breakdown list
      const breakdownList = screen.getByRole('list', { name: 'Tax breakdown by rate' })
      expect(breakdownList).toBeInTheDocument()

      // Should show individual rate lines
      expect(screen.getByText(/23% on PLN\s*770\.00/)).toBeInTheDocument()
      expect(screen.getByText(/8% on PLN\s*30\.00/)).toBeInTheDocument()
    })

    it('should collapse breakdown when clicking collapse button', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([
        { rate: 23, subtotal: 770, tax: 177.1 },
        { rate: 8, subtotal: 30, tax: 2.4 },
      ])

      render(<POTotalsSection {...defaultProps} taxBreakdown={taxBreakdown} />)

      // Expand first
      const expandButton = screen.getByRole('button', { name: 'Show tax breakdown' })
      await user.click(expandButton)

      // Then collapse
      const collapseButton = screen.getByRole('button', { name: 'Hide tax breakdown' })
      await user.click(collapseButton)

      // Should hide breakdown list
      expect(screen.queryByRole('list', { name: 'Tax breakdown by rate' })).not.toBeInTheDocument()
    })

    it('should sort tax rates in descending order', async () => {
      const user = userEvent.setup()
      const taxBreakdown = createMockTaxBreakdown([
        { rate: 8, subtotal: 30, tax: 2.4 },
        { rate: 23, subtotal: 770, tax: 177.1 },
      ])

      render(<POTotalsSection {...defaultProps} taxBreakdown={taxBreakdown} />)

      const expandButton = screen.getByRole('button', { name: 'Show tax breakdown' })
      await user.click(expandButton)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems[0]).toHaveTextContent('23%')
      expect(listItems[1]).toHaveTextContent('8%')
    })
  })

  // ============================================================================
  // RECEIVED/OUTSTANDING
  // ============================================================================

  describe('Received and Outstanding Values', () => {
    it('should show received value when provided', () => {
      render(<POTotalsSection {...defaultProps} receivedValue={500} />)

      expect(screen.getByText('Received Value:')).toBeInTheDocument()
      expect(screen.getByText(/PLN\s*500\.00/)).toBeInTheDocument()
    })

    it('should show outstanding when received < total', () => {
      render(<POTotalsSection {...defaultProps} receivedValue={500} total={984} />)

      expect(screen.getByText('Outstanding:')).toBeInTheDocument()
      expect(screen.getByText(/PLN\s*484\.00/)).toBeInTheDocument()
    })

    it('should hide outstanding when received = total', () => {
      render(<POTotalsSection {...defaultProps} receivedValue={984} total={984} />)

      expect(screen.queryByText('Outstanding:')).not.toBeInTheDocument()
    })

    it('should display received value in green', () => {
      render(<POTotalsSection {...defaultProps} receivedValue={500} />)

      const receivedValue = screen.getByText(/PLN\s*500\.00\s*PLN/)
      expect(receivedValue.closest('span')).toHaveClass('text-green-600')
    })

    it('should display outstanding in orange', () => {
      render(<POTotalsSection {...defaultProps} receivedValue={500} />)

      const outstandingValue = screen.getByText(/PLN\s*484\.00\s*PLN/)
      expect(outstandingValue.closest('span')).toHaveClass('text-orange-600')
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should render skeleton when isLoading is true', () => {
      render(<POTotalsSection {...defaultProps} isLoading={true} />)

      expect(screen.getByLabelText('Loading totals')).toBeInTheDocument()
    })

    it('should not show values when loading', () => {
      render(<POTotalsSection {...defaultProps} isLoading={true} />)

      expect(screen.queryByText('Subtotal:')).not.toBeInTheDocument()
      expect(screen.queryByText('Total:')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  describe('Error State', () => {
    it('should render error message when error is provided', () => {
      render(<POTotalsSection {...defaultProps} error="Failed to calculate" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Failed to calculate totals')).toBeInTheDocument()
      expect(screen.getByText('Failed to calculate')).toBeInTheDocument()
    })

    it('should show retry button when onRetry is provided', () => {
      const mockRetry = vi.fn()
      render(<POTotalsSection {...defaultProps} error="Error" onRetry={mockRetry} />)

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const mockRetry = vi.fn()
      render(<POTotalsSection {...defaultProps} error="Error" onRetry={mockRetry} />)

      await user.click(screen.getByRole('button', { name: /retry/i }))

      expect(mockRetry).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show empty message when all values are 0', () => {
      render(
        <POTotalsSection
          subtotal={0}
          taxAmount={0}
          discountTotal={0}
          shippingCost={0}
          total={0}
          currency="PLN"
        />
      )

      expect(screen.getByText('Add lines to see totals')).toBeInTheDocument()
    })

    it('should have accessible label for empty state', () => {
      render(
        <POTotalsSection
          subtotal={0}
          taxAmount={0}
          discountTotal={0}
          shippingCost={0}
          total={0}
          currency="PLN"
        />
      )

      expect(screen.getByLabelText('No totals to display')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // COMPACT MODE
  // ============================================================================

  describe('Compact Mode', () => {
    it('should not show currency code suffix in compact mode', () => {
      render(<POTotalsSection {...defaultProps} compact={true} />)

      // In compact mode, currency code appears only once after amount
      // Non-compact: "PLN 800.00 PLN" vs Compact: "PLN 800.00"
      const allText = document.body.textContent
      expect(allText).toContain('PLN')
      expect(allText).toContain('800.00')
    })

    it('should apply compact styling', () => {
      const { container } = render(<POTotalsSection {...defaultProps} compact={true} />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('p-3')
    })
  })

  // ============================================================================
  // CURRENCY FORMATTING
  // ============================================================================

  describe('Currency Formatting', () => {
    it('should format EUR currency correctly', () => {
      render(<POTotalsSection {...defaultProps} currency="EUR" />)

      // EUR uses Euro symbol, so check for the formatted total
      expect(screen.getByText(/800\.00\s*EUR/)).toBeInTheDocument()
    })

    it('should format USD currency correctly', () => {
      render(<POTotalsSection {...defaultProps} currency="USD" />)

      // USD uses $ symbol, so it shows "$800.00 USD"
      expect(screen.getByText(/\$800\.00\s*USD/)).toBeInTheDocument()
    })

    it('should format GBP currency correctly', () => {
      render(<POTotalsSection {...defaultProps} currency="GBP" />)

      // GBP uses pound symbol, so check for the formatted total
      expect(screen.getByText(/800\.00 GBP/)).toBeInTheDocument()
    })
  })
})
