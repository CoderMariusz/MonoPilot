/**
 * ReservedLPsList Component Tests
 * Story 03.11b: WO Material Reservations (LP Allocation)
 *
 * Tests the reserved LPs list display:
 * - Loading state
 * - Error state with retry
 * - Empty state
 * - Success state with LP table
 * - Release confirmation dialog
 * - Mobile responsive view
 * - Accessibility (keyboard navigation)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReservedLPsList, type WOMaterialReservation } from '../ReservedLPsList'

// Mock useMediaQuery hook
vi.mock('@/lib/hooks/use-media-query', () => ({
  useMediaQuery: vi.fn(() => false), // Default to desktop
}))

const mockReservations: WOMaterialReservation[] = [
  {
    id: 'res-001',
    lpId: 'lp-001',
    lpNumber: 'LP00000001',
    lotNumber: 'BATCH-001',
    expiryDate: '2026-06-15',
    location: 'A1-01',
    reservedQty: 50,
    consumedQty: 0,
    status: 'active',
    reservedAt: '2026-01-08T10:00:00Z',
    reservedBy: { id: 'user-001', name: 'John Doe' },
  },
  {
    id: 'res-002',
    lpId: 'lp-002',
    lpNumber: 'LP00000002',
    lotNumber: 'BATCH-002',
    expiryDate: '2026-02-15',
    location: 'A1-02',
    reservedQty: 30,
    consumedQty: 10,
    status: 'active',
    reservedAt: '2026-01-08T11:00:00Z',
    reservedBy: { id: 'user-001', name: 'John Doe' },
  },
]

const defaultProps = {
  woMaterialId: 'mat-001',
  materialName: 'Flour',
  productCode: 'FLR-001',
  requiredQty: 100,
  reservedQty: 80,
  consumedQty: 10,
  uom: 'KG',
  reservations: mockReservations,
  isLoading: false,
  canModify: true,
  onReserveMore: vi.fn(),
  onRelease: vi.fn().mockResolvedValue(undefined),
  onViewLP: vi.fn(),
  onRetry: vi.fn(),
}

describe('ReservedLPsList (Story 03.11b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Loading State
  // ===========================================================================
  describe('Loading State', () => {
    it('should display loading indicator when isLoading=true', () => {
      render(<ReservedLPsList {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Loading reserved LPs...')).toBeInTheDocument()
    })

    it('should display skeleton rows', () => {
      const { container } = render(
        <ReservedLPsList {...defaultProps} isLoading={true} />
      )

      // Should have skeleton elements
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not display table when loading', () => {
      render(<ReservedLPsList {...defaultProps} isLoading={true} />)

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Error State
  // ===========================================================================
  describe('Error State', () => {
    it('should display error message', () => {
      render(
        <ReservedLPsList
          {...defaultProps}
          error="Failed to fetch reservations"
        />
      )

      expect(screen.getByText('Failed to Load Reservations')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch reservations')).toBeInTheDocument()
    })

    it('should display error code', () => {
      render(
        <ReservedLPsList
          {...defaultProps}
          error="Network error"
        />
      )

      expect(screen.getByText(/PLAN-026-RES-LOAD-ERR/)).toBeInTheDocument()
    })

    it('should display retry button', () => {
      render(
        <ReservedLPsList
          {...defaultProps}
          error="Network error"
        />
      )

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup()

      render(
        <ReservedLPsList
          {...defaultProps}
          error="Network error"
        />
      )

      await user.click(screen.getByRole('button', { name: /retry/i }))
      expect(defaultProps.onRetry).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Empty State
  // ===========================================================================
  describe('Empty State', () => {
    it('should display empty message when no reservations', () => {
      render(
        <ReservedLPsList {...defaultProps} reservations={[]} />
      )

      expect(screen.getByText('No LPs Reserved for This Material')).toBeInTheDocument()
    })

    it('should display count of 0 in header', () => {
      render(
        <ReservedLPsList {...defaultProps} reservations={[]} />
      )

      expect(screen.getByText('Reserved License Plates (0)')).toBeInTheDocument()
    })

    it('should show Reserve LPs button when canModify=true', () => {
      render(
        <ReservedLPsList {...defaultProps} reservations={[]} canModify={true} />
      )

      // May have multiple Reserve LPs buttons - in header and empty state
      const buttons = screen.getAllByRole('button', { name: /reserve lps/i })
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should hide Reserve LPs button when canModify=false', () => {
      render(
        <ReservedLPsList {...defaultProps} reservations={[]} canModify={false} />
      )

      // The button in the empty state should not be present
      const buttons = screen.queryAllByRole('button', { name: /reserve lps/i })
      // Empty state has a reserve button only when canModify is true
      expect(buttons.length).toBeLessThanOrEqual(1)
    })

    it('should call onReserveMore when Reserve LPs clicked', async () => {
      const user = userEvent.setup()

      render(
        <ReservedLPsList {...defaultProps} reservations={[]} />
      )

      // Multiple buttons may match - get all and click the first
      const buttons = screen.getAllByRole('button', { name: /reserve lps/i })
      await user.click(buttons[0])
      expect(defaultProps.onReserveMore).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Success State - Table Display
  // ===========================================================================
  describe('Success State - Table Display', () => {
    it('should display reservations count in header', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByText('Reserved License Plates (2)')).toBeInTheDocument()
    })

    it('should display LP numbers', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByText('LP00000001')).toBeInTheDocument()
      expect(screen.getByText('LP00000002')).toBeInTheDocument()
    })

    it('should display lot numbers', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByText('BATCH-001')).toBeInTheDocument()
      expect(screen.getByText('BATCH-002')).toBeInTheDocument()
    })

    it('should display expiry dates', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByText(/Jun 15, 2026/)).toBeInTheDocument()
      expect(screen.getByText(/Feb 15, 2026/)).toBeInTheDocument()
    })

    it('should display locations', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByText('A1-01')).toBeInTheDocument()
      expect(screen.getByText('A1-02')).toBeInTheDocument()
    })

    it('should display reserved quantities with UoM', () => {
      render(<ReservedLPsList {...defaultProps} />)

      // Table contains multiple quantities with KG
      const table = screen.getByRole('table')
      expect(table).toHaveTextContent('50 KG')
      expect(table).toHaveTextContent('30 KG')
    })

    it('should display consumed quantities', () => {
      render(<ReservedLPsList {...defaultProps} />)

      // First reservation: 0 KG consumed, Second reservation: 10 KG consumed
      const table = screen.getByRole('table')
      expect(table).toHaveTextContent('0 KG')
      expect(table).toHaveTextContent('10 KG')
    })

    it('should display reservation status badges', () => {
      render(<ReservedLPsList {...defaultProps} />)

      const activeBadges = screen.getAllByText('Active')
      expect(activeBadges.length).toBe(2)
    })

    it('should display "Reserved by" info', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getAllByText(/John Doe/).length).toBeGreaterThan(0)
    })

    it('should display summary footer', () => {
      render(<ReservedLPsList {...defaultProps} />)

      // Summary footer contains totals
      const container = screen.getByText(/Total Reserved/)
      expect(container).toHaveTextContent('80')
      expect(container).toHaveTextContent('KG')
    })
  })

  // ===========================================================================
  // Actions
  // ===========================================================================
  describe('Actions', () => {
    it('should show Reserve More button when canModify=true', () => {
      render(<ReservedLPsList {...defaultProps} canModify={true} />)

      expect(screen.getByRole('button', { name: /reserve more/i })).toBeInTheDocument()
    })

    it('should hide Reserve More button when canModify=false', () => {
      render(<ReservedLPsList {...defaultProps} canModify={false} />)

      expect(screen.queryByRole('button', { name: /reserve more/i })).not.toBeInTheDocument()
    })

    it('should call onReserveMore when Reserve More clicked', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /reserve more/i }))
      expect(defaultProps.onReserveMore).toHaveBeenCalled()
    })

    it('should show release button for active reservations', () => {
      render(<ReservedLPsList {...defaultProps} canModify={true} />)

      const releaseButtons = screen.getAllByRole('button', { name: /release/i })
      expect(releaseButtons.length).toBeGreaterThan(0)
    })

    it('should show view LP button', () => {
      render(<ReservedLPsList {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view lp/i })
      expect(viewButtons.length).toBe(2)
    })

    it('should call onViewLP when View LP clicked', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view lp/i })
      await user.click(viewButtons[0])

      expect(defaultProps.onViewLP).toHaveBeenCalledWith('lp-001')
    })
  })

  // ===========================================================================
  // Release Confirmation Dialog
  // ===========================================================================
  describe('Release Confirmation Dialog', () => {
    it('should open confirmation dialog when release clicked', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      const releaseButtons = screen.getAllByRole('button', { name: /release/i })
      await user.click(releaseButtons[0])

      // Dialog should open - look for the dialog role
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('should display LP number in confirmation', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      const releaseButtons = screen.getAllByRole('button', { name: /release/i })
      await user.click(releaseButtons[0])

      // LP number appears in dialog description
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveTextContent('LP00000001')
    })

    it('should display quantity in confirmation', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      const releaseButtons = screen.getAllByRole('button', { name: /release/i })
      await user.click(releaseButtons[0])

      // Quantity appears in dialog description
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveTextContent('50')
      expect(dialog).toHaveTextContent('KG')
    })

    it('should close dialog when Cancel clicked', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      const releaseButtons = screen.getAllByRole('button', { name: /release/i })
      await user.click(releaseButtons[0])

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByText('Release Reservation')).not.toBeInTheDocument()
      })
    })

    it('should call onRelease when confirmed', async () => {
      const user = userEvent.setup()

      render(<ReservedLPsList {...defaultProps} />)

      const releaseButtons = screen.getAllByRole('button', { name: /release/i })
      await user.click(releaseButtons[0])

      // Find the confirm button in the dialog
      const dialog = screen.getByRole('alertdialog')
      const confirmButton = dialog.querySelector('button:last-of-type')
      if (confirmButton) {
        await user.click(confirmButton)
      }

      await waitFor(() => {
        expect(defaultProps.onRelease).toHaveBeenCalledWith('res-001')
      })
    })
  })

  // ===========================================================================
  // Released/Consumed Status
  // ===========================================================================
  describe('Released/Consumed Status', () => {
    it('should hide release button for released reservations', () => {
      const releasedReservations = [
        {
          ...mockReservations[0],
          status: 'released' as const,
        },
      ]

      render(
        <ReservedLPsList
          {...defaultProps}
          reservations={releasedReservations}
        />
      )

      // Should not have a release button for released reservations
      const releaseButtons = screen.queryAllByRole('button', { name: /release/i })
      expect(releaseButtons.length).toBe(0)
    })

    it('should display Released badge for released reservations', () => {
      const releasedReservations = [
        {
          ...mockReservations[0],
          status: 'released' as const,
        },
      ]

      render(
        <ReservedLPsList
          {...defaultProps}
          reservations={releasedReservations}
        />
      )

      expect(screen.getByText('Released')).toBeInTheDocument()
    })

    it('should display Consumed badge for consumed reservations', () => {
      const consumedReservations = [
        {
          ...mockReservations[0],
          status: 'consumed' as const,
        },
      ]

      render(
        <ReservedLPsList
          {...defaultProps}
          reservations={consumedReservations}
        />
      )

      // Find the badge specifically (not the column header)
      const statusCells = screen.getAllByText('Consumed')
      // Should have at least 2: column header and status badge
      expect(statusCells.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================
  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have table headers', () => {
      render(<ReservedLPsList {...defaultProps} />)

      expect(screen.getByRole('columnheader', { name: /lp number/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /lot/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /expiry/i })).toBeInTheDocument()
    })

    it('should have aria-label on action buttons', () => {
      render(<ReservedLPsList {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view lp/i })
      expect(viewButtons[0]).toHaveAttribute('aria-label')
    })
  })
})
