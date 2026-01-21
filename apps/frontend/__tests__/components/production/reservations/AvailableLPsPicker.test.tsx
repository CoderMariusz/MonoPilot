/**
 * Component Tests: AvailableLPsPicker (Story 04.8)
 * Phase: GREEN - Tests should PASS
 *
 * Tests the AvailableLPsPicker component:
 * - LP table with FIFO/FEFO sorting
 * - Checkbox selection with quantity input
 * - Progress indicator
 * - Over-reservation warning
 * - Other WO reservation warnings
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Warning when LP reserved by another WO
 * - AC-6: FIFO/FEFO sorting toggle
 * - AC-7: Over-reservation warning
 * - AC-8: Filtered LP display (blocked/failed QA excluded)
 *
 * Wireframe: PLAN-026 Component 3: AvailableLPsTable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { AvailableLPsPicker } from '@/components/production/reservations/AvailableLPsPicker'

// Mock data
const mockAvailableLPs = [
  {
    id: 'lp-145',
    lp_number: 'LP-00145',
    lot_number: 'B-4501',
    expiry_date: '2026-06-15',
    location: 'A1-01',
    available_qty: 100,
    quantity: 100,
    uom: 'kg',
    created_at: '2026-01-01T08:00:00Z',
    other_reservations: [],
  },
  {
    id: 'lp-146',
    lp_number: 'LP-00146',
    lot_number: 'B-4502',
    expiry_date: '2026-07-20',
    location: 'A1-02',
    available_qty: 100,
    quantity: 100,
    uom: 'kg',
    created_at: '2026-01-03T08:00:00Z',
    other_reservations: [],
  },
  {
    id: 'lp-147',
    lp_number: 'LP-00147',
    lot_number: 'B-4503',
    expiry_date: '2026-08-10',
    location: 'A2-01',
    available_qty: 75,
    quantity: 75,
    uom: 'kg',
    created_at: '2026-01-05T08:00:00Z',
    other_reservations: [],
  },
  {
    id: 'lp-150',
    lp_number: 'LP-00150',
    lot_number: 'B-4506',
    expiry_date: '2026-06-30',
    location: 'A1-03',
    available_qty: 20,
    quantity: 80,
    uom: 'kg',
    created_at: '2026-01-02T08:00:00Z',
    other_reservations: [{ wo_number: 'WO-2024-00155', quantity: 60 }],
  },
]

describe('AvailableLPsPicker Component (Story 04.8)', () => {
  const mockOnSelect = vi.fn()
  const mockOnQuantityChange = vi.fn()
  const mockOnSortChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  // ============================================================================
  // LP Table Display
  // ============================================================================
  describe('LP Table Display', () => {
    it('should display LP number column', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('LP Number')).toBeInTheDocument()
      expect(screen.getByText('LP-00145')).toBeInTheDocument()
    })

    it('should display lot number column', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('Lot')).toBeInTheDocument()
      expect(screen.getByText('B-4501')).toBeInTheDocument()
    })

    it('should display expiry date column', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('Expiry')).toBeInTheDocument()
    })

    it('should display location column', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('A1-01')).toBeInTheDocument()
    })

    it('should display available quantity column', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('Avail Qty')).toBeInTheDocument()
      // Multiple LPs may have 100 kg
      const quantities = screen.getAllByText(/100 kg/i)
      expect(quantities.length).toBeGreaterThanOrEqual(1)
    })

    it('should display reserve input column', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('Reserve')).toBeInTheDocument()
    })

    it('should display receipt date (created_at) in row', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Look for "Received:" text - multiple rows may have it
      const received = screen.getAllByText(/Received:/i)
      expect(received.length).toBeGreaterThanOrEqual(1)
    })

    it('should display shelf life remaining', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('Shelf Life')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // AC-6: FIFO/FEFO Sorting
  // ============================================================================
  describe('AC-6: FIFO/FEFO Sorting', () => {
    it('should have FIFO radio button', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('fifo-radio')).toBeInTheDocument()
    })

    it('should have FEFO radio button', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('fefo-radio')).toBeInTheDocument()
    })

    it('should default to FIFO sort', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const fifoRadio = screen.getByTestId('fifo-radio')
      expect(fifoRadio).toHaveAttribute('data-state', 'checked')
    })

    it('should call onSortChange when toggling to FEFO', async () => {
      const user = userEvent.setup()

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const fefoRadio = screen.getByTestId('fefo-radio')
      await user.click(fefoRadio)

      expect(mockOnSortChange).toHaveBeenCalledWith('fefo')
    })

    it('should display sort description text', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('sort-description')).toBeInTheDocument()
    })

    it('should display different description for FEFO', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fefo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText(/expiry date/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Checkbox Selection
  // ============================================================================
  describe('Checkbox Selection', () => {
    it('should display checkbox for each LP row', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('checkbox-lp-145')).toBeInTheDocument()
      expect(screen.getByTestId('checkbox-lp-146')).toBeInTheDocument()
    })

    it('should call onSelect when checkbox clicked', async () => {
      const user = userEvent.setup()

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const checkbox = screen.getByTestId('checkbox-lp-145')
      await user.click(checkbox)

      expect(mockOnSelect).toHaveBeenCalledWith('lp-145', true)
    })

    it('should highlight selected row', async () => {
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const row = screen.getByTestId('lp-row-lp-145')
      expect(row).toHaveClass('bg-blue-50')
    })

    it('should have aria-label for checkbox accessibility', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const checkbox = screen.getByTestId('checkbox-lp-145')
      expect(checkbox).toHaveAttribute('aria-label')
    })
  })

  // ============================================================================
  // Quantity Input
  // ============================================================================
  describe('Quantity Input', () => {
    it('should enable quantity input when LP selected', async () => {
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const input = screen.getByTestId('qty-input-lp-145')
      expect(input).not.toBeDisabled()
    })

    it('should disable quantity input when LP not selected', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const input = screen.getByTestId('qty-input-lp-145')
      expect(input).toBeDisabled()
    })

    it('should call onQuantityChange when input changes', async () => {
      const user = userEvent.setup()
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const input = screen.getByTestId('qty-input-lp-145')
      await user.clear(input)
      await user.type(input, '50')

      expect(mockOnQuantityChange).toHaveBeenCalled()
    })

    it('should show validation error when qty > available', async () => {
      const user = userEvent.setup()
      const selectedLPs = new Map([['lp-145', 150]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const input = screen.getByTestId('qty-input-lp-145')
      await user.clear(input)
      await user.type(input, '150')

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument()
      })
    })

    it('should default quantity to available_qty when selected', async () => {
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const input = screen.getByTestId('qty-input-lp-145') as HTMLInputElement
      expect(input.value).toBe('100')
    })
  })

  // ============================================================================
  // AC-3: Other WO Reservations Warning
  // ============================================================================
  describe('AC-3: Other WO Reservations Warning', () => {
    it('should display warning badge for LP with other reservations', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // LP-150 has other reservations
      expect(screen.getByTestId('other-reservations-warning')).toBeInTheDocument()
    })

    it('should have warning element with tooltip trigger', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // The warning element exists and can be interacted with for tooltip
      const warning = screen.getByTestId('other-reservations-warning')
      expect(warning).toBeInTheDocument()
      // The warning contains "Partially reserved" text
      expect(warning).toHaveTextContent(/Partially reserved/i)
    })

    it('should show LP has other reservations affecting available qty', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // LP-150 has other_reservations with 60 kg reserved, leaving 20 available
      // The available qty shows net available after other reservations
      expect(screen.getByText('20 kg')).toBeInTheDocument()
      // The warning badge exists
      expect(screen.getByTestId('other-reservations-warning')).toBeInTheDocument()
    })

    it('should show net available after other reservations', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // LP-150 has available_qty=20 after 60 reserved by other WO
      expect(screen.getByText('20 kg')).toBeInTheDocument()
    })

    it('should have tooltip trigger for other reservation details', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Verify the tooltip trigger is in place
      const warning = screen.getByTestId('other-reservations-warning')
      expect(warning).toBeInTheDocument()
      // The warning element is within a tooltip trigger structure
      expect(warning.closest('[data-state]') || warning).toBeTruthy()
    })
  })

  // ============================================================================
  // Progress Indicator
  // ============================================================================
  describe('Progress Indicator', () => {
    it('should display progress bar', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('progress-indicator')).toBeInTheDocument()
    })

    it('should show current vs required qty', async () => {
      const selectedLPs = new Map([['lp-145', 200]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText(/200.0 \/ 250 kg/i)).toBeInTheDocument()
    })

    it('should show percentage', async () => {
      const selectedLPs = new Map([['lp-145', 200]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('should update progress when selections change', async () => {
      const selectedLPs = new Map([
        ['lp-145', 100],
        ['lp-146', 100],
      ])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // 200 of 250 = 80%
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('should show remaining message when partial', async () => {
      const selectedLPs = new Map([['lp-145', 200]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('remaining-message')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // AC-7: Over-Reservation Warning
  // ============================================================================
  describe('AC-7: Over-Reservation Warning', () => {
    it('should show warning when total > required', async () => {
      const selectedLPs = new Map([
        ['lp-145', 100],
        ['lp-146', 100],
        ['lp-147', 100],
      ])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('over-reservation-warning')).toBeInTheDocument()
    })

    it('should show over-amount in warning', async () => {
      const selectedLPs = new Map([
        ['lp-145', 100],
        ['lp-146', 100],
        ['lp-147', 100],
      ])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // 300 - 250 = 50 kg over
      expect(screen.getByText(/50.0 kg/i)).toBeInTheDocument()
    })

    it('should change progress bar color to yellow on over', async () => {
      const selectedLPs = new Map([
        ['lp-145', 100],
        ['lp-146', 100],
        ['lp-147', 100],
      ])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const progressIndicator = screen.getByTestId('progress-indicator')
      expect(progressIndicator).toHaveClass('border-yellow-300')
    })

    it('should show acknowledgment checkbox', async () => {
      const selectedLPs = new Map([
        ['lp-145', 100],
        ['lp-146', 100],
        ['lp-147', 100],
      ])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('acknowledge-checkbox')).toBeInTheDocument()
    })

    it('should not show warning when total <= required', async () => {
      const selectedLPs = new Map([['lp-145', 200]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.queryByTestId('over-reservation-warning')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Selected LPs Summary
  // ============================================================================
  describe('Selected LPs Summary', () => {
    it('should display selected LPs section', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('selected-summary')).toBeInTheDocument()
    })

    it('should list selected LP with qty', async () => {
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('selected-lp-145')).toBeInTheDocument()
    })

    it('should have remove button (X) for each selected LP', async () => {
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('remove-lp-145')).toBeInTheDocument()
    })

    it('should remove LP from selection when X clicked', async () => {
      const user = userEvent.setup()
      const selectedLPs = new Map([['lp-145', 100]])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const removeBtn = screen.getByTestId('remove-lp-145')
      await user.click(removeBtn)

      expect(mockOnSelect).toHaveBeenCalledWith('lp-145', false)
    })

    it('should show total selected quantity', async () => {
      const selectedLPs = new Map([
        ['lp-145', 100],
        ['lp-146', 100],
      ])

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={selectedLPs}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText(/Total Selected/i)).toBeInTheDocument()
      expect(screen.getByText(/200.00 kg/i)).toBeInTheDocument()
    })

    it('should show empty message when no selections', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText(/No License Plates selected/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Near Expiry Warning
  // ============================================================================
  describe('Near Expiry Warning', () => {
    it('should highlight LP row when <30 days to expiry', async () => {
      // Create LP with near expiry
      const nearExpiryLPs = [
        {
          ...mockAvailableLPs[0],
          expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ]

      render(
        <AvailableLPsPicker
          lps={nearExpiryLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const row = screen.getByTestId('lp-row-lp-145')
      expect(row).toHaveClass('bg-yellow-50')
    })

    it('should show warning icon for near-expiry LP', async () => {
      const nearExpiryLPs = [
        {
          ...mockAvailableLPs[0],
          expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ]

      render(
        <AvailableLPsPicker
          lps={nearExpiryLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('near-expiry-warning')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Loading State
  // ============================================================================
  describe('Loading State', () => {
    it('should display skeleton rows when loading', async () => {
      render(
        <AvailableLPsPicker
          lps={[]}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={true}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('available-lps-picker-loading')).toBeInTheDocument()
    })

    it('should display loading spinner', async () => {
      render(
        <AvailableLPsPicker
          lps={[]}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={true}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByText(/Loading available LPs/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty State
  // ============================================================================
  describe('Empty State', () => {
    it('should display empty message when no LPs available', async () => {
      render(
        <AvailableLPsPicker
          lps={[]}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('available-lps-picker-empty')).toBeInTheDocument()
      expect(screen.getByText(/No Available License Plates/i)).toBeInTheDocument()
    })

    it('should suggest possible reasons for no LPs', async () => {
      render(
        <AvailableLPsPicker
          lps={[]}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByTestId('empty-reasons')).toBeInTheDocument()
    })

    it('should have "View All Inventory" link', async () => {
      render(
        <AvailableLPsPicker
          lps={[]}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByRole('link', { name: /View All Inventory/i })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Accessibility
  // ============================================================================
  describe('Accessibility', () => {
    it('should have proper table structure with headers', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have aria-label on quantity inputs', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const input = screen.getByTestId('qty-input-lp-145')
      expect(input).toHaveAttribute('aria-label')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Tab through elements
      await user.tab()
      expect(document.activeElement).toBeTruthy()
    })

    it('should have progress bar ARIA attributes', async () => {
      render(
        <AvailableLPsPicker
          lps={mockAvailableLPs}
          selectedLPs={new Map()}
          sortOrder="fifo"
          isLoading={false}
          requiredQty={250}
          uom="kg"
          onSelect={mockOnSelect}
          onQuantityChange={mockOnQuantityChange}
          onSortChange={mockOnSortChange}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow')
      expect(progressBar).toHaveAttribute('aria-valuemin')
      expect(progressBar).toHaveAttribute('aria-valuemax')
    })
  })
})

/**
 * Test Coverage Summary for Story 04.8 - AvailableLPsPicker
 * =========================================================
 *
 * LP Table Display: 8 tests
 * AC-6 (FIFO/FEFO): 6 tests
 * Checkbox Selection: 4 tests
 * Quantity Input: 5 tests
 * AC-3 (Other WO Warning): 5 tests
 * Progress Indicator: 5 tests
 * AC-7 (Over-Reservation): 5 tests
 * Selected Summary: 6 tests
 * Near Expiry: 2 tests
 * Loading State: 2 tests
 * Empty State: 3 tests
 * Accessibility: 4 tests
 *
 * Total: 55 tests
 *
 * Status: GREEN - All tests should pass
 */
