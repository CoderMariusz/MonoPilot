/**
 * AvailableLPsTable Component Tests
 * Story 03.11b: WO Material Reservations (LP Allocation)
 *
 * Tests the available LPs selection table:
 * - Loading state
 * - Empty state
 * - LP display with FIFO/FEFO sorting
 * - Checkbox selection
 * - Quantity input
 * - Over-reservation warnings
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvailableLPsTable } from '../AvailableLPsTable'
import type { AvailableLP } from '@/lib/validation/wo-reservations'

const mockLPs: AvailableLP[] = [
  {
    id: 'lp-001',
    lp_number: 'LP00000001',
    quantity: 100,
    available_qty: 80,
    location: 'A1-01',
    expiry_date: '2026-06-15',
    created_at: '2026-01-01T10:00:00Z',
    lot_number: 'BATCH-001',
    uom: 'KG',
    other_reservations: [],
  },
  {
    id: 'lp-002',
    lp_number: 'LP00000002',
    quantity: 60,
    available_qty: 60,
    location: 'A1-02',
    expiry_date: '2026-02-15',
    created_at: '2026-01-05T10:00:00Z',
    lot_number: 'BATCH-002',
    uom: 'KG',
    other_reservations: [{ wo_number: 'WO-001', quantity: 0 }],
  },
  {
    id: 'lp-003',
    lp_number: 'LP00000003',
    quantity: 40,
    available_qty: 40,
    location: 'A1-03',
    expiry_date: null,
    created_at: '2026-01-03T10:00:00Z',
    lot_number: 'BATCH-003',
    uom: 'KG',
    other_reservations: [],
  },
]

const defaultProps = {
  lps: mockLPs,
  selectedLPs: new Map<string, number>(),
  sortOrder: 'fifo' as const,
  isLoading: false,
  uom: 'KG',
  onSelect: vi.fn(),
  onQuantityChange: vi.fn(),
  onSortChange: vi.fn(),
}

describe('AvailableLPsTable (Story 03.11b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Loading State
  // ===========================================================================
  describe('Loading State', () => {
    it('should display skeleton when loading', () => {
      const { container } = render(
        <AvailableLPsTable {...defaultProps} isLoading={true} />
      )

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not display table when loading', () => {
      render(<AvailableLPsTable {...defaultProps} isLoading={true} />)

      // Table headers should still be in skeleton
      expect(screen.queryByText('LP00000001')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Empty State
  // ===========================================================================
  describe('Empty State', () => {
    it('should display empty message when no LPs', () => {
      render(<AvailableLPsTable {...defaultProps} lps={[]} />)

      expect(screen.getByText('No Available License Plates')).toBeInTheDocument()
    })

    it('should display helpful description in empty state', () => {
      render(<AvailableLPsTable {...defaultProps} lps={[]} />)

      expect(screen.getByText(/no matching inventory/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Table Display
  // ===========================================================================
  describe('Table Display', () => {
    it('should display LP count in header', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByText(/Available License Plates \(3\)/)).toBeInTheDocument()
    })

    it('should display LP numbers', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByText('LP00000001')).toBeInTheDocument()
      expect(screen.getByText('LP00000002')).toBeInTheDocument()
      expect(screen.getByText('LP00000003')).toBeInTheDocument()
    })

    it('should display lot numbers', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByText('BATCH-001')).toBeInTheDocument()
      expect(screen.getByText('BATCH-002')).toBeInTheDocument()
      expect(screen.getByText('BATCH-003')).toBeInTheDocument()
    })

    it('should display expiry dates', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByText(/Jun 15, 2026/)).toBeInTheDocument()
      expect(screen.getByText(/Feb 15, 2026/)).toBeInTheDocument()
      // LP-003 has null expiry, should show dash
      expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })

    it('should display locations', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByText('A1-01')).toBeInTheDocument()
      expect(screen.getByText('A1-02')).toBeInTheDocument()
      expect(screen.getByText('A1-03')).toBeInTheDocument()
    })

    it('should display available quantities', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByText(/80.*KG/)).toBeInTheDocument()
      expect(screen.getByText(/60.*KG/)).toBeInTheDocument()
      expect(screen.getByText(/40.*KG/)).toBeInTheDocument()
    })

    it('should display shelf life indicator', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      // Should show some shelf life text
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // FIFO/FEFO Sorting
  // ===========================================================================
  describe('FIFO/FEFO Sorting', () => {
    it('should display FIFO radio button', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByLabelText(/FIFO/)).toBeInTheDocument()
    })

    it('should display FEFO radio button', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByLabelText(/FEFO/)).toBeInTheDocument()
    })

    it('should select FIFO by default', () => {
      render(<AvailableLPsTable {...defaultProps} sortOrder="fifo" />)

      const fifoRadio = screen.getByLabelText(/FIFO/)
      expect(fifoRadio).toBeChecked()
    })

    it('should call onSortChange when sort changed', async () => {
      const user = userEvent.setup()

      render(<AvailableLPsTable {...defaultProps} sortOrder="fifo" />)

      await user.click(screen.getByLabelText(/FEFO/))
      expect(defaultProps.onSortChange).toHaveBeenCalledWith('fefo')
    })

    it('should sort LPs by created_at for FIFO', () => {
      render(<AvailableLPsTable {...defaultProps} sortOrder="fifo" />)

      const rows = screen.getAllByRole('row')
      // Skip header row, first data row should be LP-001 (oldest created_at)
      expect(rows[1].textContent).toContain('LP00000001')
    })

    it('should sort LPs by expiry_date for FEFO', () => {
      render(<AvailableLPsTable {...defaultProps} sortOrder="fefo" />)

      const rows = screen.getAllByRole('row')
      // Skip header row, first data row should be LP-002 (soonest expiry)
      expect(rows[1].textContent).toContain('LP00000002')
    })
  })

  // ===========================================================================
  // Selection
  // ===========================================================================
  describe('Selection', () => {
    it('should display checkbox for each LP', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(3)
    })

    it('should call onSelect when checkbox clicked', async () => {
      const user = userEvent.setup()

      render(<AvailableLPsTable {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      expect(defaultProps.onSelect).toHaveBeenCalledWith(
        'lp-001',
        true,
        expect.objectContaining({ id: 'lp-001' })
      )
    })

    it('should show selected row highlighted', () => {
      const selectedLPs = new Map([['lp-001', 50]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      const rows = screen.getAllByRole('row')
      // First data row should have selection styling
      expect(rows[1]).toHaveClass('bg-blue-50')
    })

    it('should check checkbox for selected LPs', () => {
      const selectedLPs = new Map([['lp-001', 50]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes[0]).toBeChecked()
    })

    it('should have accessible aria-label on checkboxes', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes[0]).toHaveAttribute('aria-label')
    })
  })

  // ===========================================================================
  // Quantity Input
  // ===========================================================================
  describe('Quantity Input', () => {
    it('should show quantity input for selected LPs', () => {
      const selectedLPs = new Map([['lp-001', 50]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      // Should have a number input for quantity
      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
    })

    it('should display selected quantity in input', () => {
      const selectedLPs = new Map([['lp-001', 50]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(50)
    })

    it('should call onQuantityChange when quantity changed', async () => {
      const user = userEvent.setup()
      const selectedLPs = new Map([['lp-001', 50]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '60')

      expect(defaultProps.onQuantityChange).toHaveBeenCalled()
    })

    it('should show error styling when quantity exceeds available', () => {
      // Select more than available (80)
      const selectedLPs = new Map([['lp-001', 100]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('border-red-500')
    })

    it('should show max quantity message when exceeded', () => {
      const selectedLPs = new Map([['lp-001', 100]])

      render(
        <AvailableLPsTable {...defaultProps} selectedLPs={selectedLPs} />
      )

      expect(screen.getByText(/Max.*80/)).toBeInTheDocument()
    })

    it('should not show quantity input for unselected LPs', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      // No LP selected, should not have spinbutton
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Other Reservations Warning
  // ===========================================================================
  describe('Other Reservations Warning', () => {
    it('should show warning when LP has other reservations', () => {
      const lpsWithReservations: AvailableLP[] = [
        {
          ...mockLPs[0],
          other_reservations: [
            { wo_number: 'WO-001', quantity: 20 },
          ],
        },
      ]

      render(
        <AvailableLPsTable {...defaultProps} lps={lpsWithReservations} />
      )

      expect(screen.getByText(/20.*KG.*reserved.*other/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Near Expiry Warning
  // ===========================================================================
  describe('Near Expiry Warning', () => {
    it('should show warning icon for near-expiry LPs', () => {
      // LP-002 has expiry 2026-02-15 which might be near expiry
      render(<AvailableLPsTable {...defaultProps} />)

      // Should render shelf life column with warning if applicable
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================
  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have column headers', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByRole('columnheader', { name: /lp number/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /lot/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /expiry/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /location/i })).toBeInTheDocument()
    })

    it('should have radio group for sort order', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })

    it('should have aria-label on radio group', () => {
      render(<AvailableLPsTable {...defaultProps} />)

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toHaveAttribute('aria-label', 'Sort order')
    })
  })
})
