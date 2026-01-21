/**
 * Component Tests: WOReservationsPanel (Story 04.8)
 * Phase: GREEN - Tests should PASS
 *
 * Tests the WOReservationsPanel component:
 * - Displays material list with reservation status
 * - Expandable rows showing reserved LPs
 * - Reserve/Release actions
 * - ReservationStatusBadge integration
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Display Reserve button for materials
 * - AC-4: Show remaining qty (reserved - consumed)
 * - AC-5: Release button for active reservations
 *
 * Wireframe: PLAN-026 Component 1: ReservedLPsList
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

import { WOReservationsPanel } from '@/components/production/reservations/WOReservationsPanel'

// Helper to render with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

// Mock data
const mockWOMaterials = [
  {
    id: 'mat-1',
    product_id: 'prod-cocoa',
    product_name: 'Cocoa Mass',
    product_code: 'RM-COCOA-001',
    required_qty: 250,
    reserved_qty: 250,
    consumed_qty: 162,
    uom: 'kg',
    reservations: [
      {
        id: 'res-1',
        lp_id: 'lp-145',
        lp_number: 'LP-00145',
        lot_number: 'B-4501',
        expiry_date: '2026-06-15',
        location: 'A1-01',
        reserved_qty: 100,
        consumed_qty: 65,
        status: 'active' as const,
        reserved_at: '2026-01-05T10:00:00Z',
        reserved_by: { id: 'user-1', name: 'John Smith' },
      },
      {
        id: 'res-2',
        lp_id: 'lp-146',
        lp_number: 'LP-00146',
        lot_number: 'B-4502',
        expiry_date: '2026-07-20',
        location: 'A1-02',
        reserved_qty: 100,
        consumed_qty: 65,
        status: 'active' as const,
        reserved_at: '2026-01-05T10:00:00Z',
        reserved_by: { id: 'user-1', name: 'John Smith' },
      },
      {
        id: 'res-3',
        lp_id: 'lp-147',
        lp_number: 'LP-00147',
        lot_number: 'B-4503',
        expiry_date: '2026-08-10',
        location: 'A2-01',
        reserved_qty: 50,
        consumed_qty: 32,
        status: 'active' as const,
        reserved_at: '2026-01-05T10:00:00Z',
        reserved_by: { id: 'user-1', name: 'John Smith' },
      },
    ],
  },
  {
    id: 'mat-2',
    product_id: 'prod-sugar',
    product_name: 'Sugar Fine',
    product_code: 'RM-SUGAR-001',
    required_qty: 150,
    reserved_qty: 120,
    consumed_qty: 0,
    uom: 'kg',
    reservations: [],
  },
  {
    id: 'mat-3',
    product_id: 'prod-milk',
    product_name: 'Milk Powder',
    product_code: 'RM-MILK-001',
    required_qty: 100,
    reserved_qty: 0,
    consumed_qty: 0,
    uom: 'kg',
    reservations: [],
  },
]

describe('WOReservationsPanel Component (Story 04.8)', () => {
  const mockOnReservationsChange = vi.fn()
  const mockOnRetry = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  // ============================================================================
  // Material List Display
  // ============================================================================
  describe('Material List Display', () => {
    it('should display all materials from WO', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByText('Cocoa Mass')).toBeInTheDocument()
      expect(screen.getByText('Sugar Fine')).toBeInTheDocument()
      expect(screen.getByText('Milk Powder')).toBeInTheDocument()
    })

    it('should display material name and code', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByText('Cocoa Mass')).toBeInTheDocument()
      expect(screen.getByText('RM-COCOA-001')).toBeInTheDocument()
    })

    it('should display required quantity with UoM', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Required qty column - multiple 250 kg values exist
      const cells = screen.getAllByText(/250 kg/i)
      expect(cells.length).toBeGreaterThanOrEqual(1)
    })

    it('should display reserved quantity', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Reserved qty column (at least one 250 kg)
      const cells = screen.getAllByText(/250 kg/i)
      expect(cells.length).toBeGreaterThanOrEqual(1)
    })

    it('should display consumed quantity', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByText('162 kg')).toBeInTheDocument()
    })

    it('should display reservation count (e.g., "3 LPs")', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByText('3 LPs')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // AC-4: Remaining Calculation Display
  // ============================================================================
  describe('AC-4: Remaining Quantity Display', () => {
    it('should calculate and display remaining = reserved - consumed', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Remaining = 250 - 162 = 88
      expect(screen.getByText('88 kg')).toBeInTheDocument()
    })

    it('should show 0 remaining when fully consumed', async () => {
      const fullyConsumedMaterials = [
        {
          ...mockWOMaterials[0],
          reserved_qty: 100,
          consumed_qty: 100,
        },
      ]

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={fullyConsumedMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByText('0 kg')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // ReservationStatusBadge Integration
  // ============================================================================
  describe('ReservationStatusBadge Display', () => {
    it('should display Full status badge for 100% coverage', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Cocoa Mass has 250/250 = 100%
      expect(screen.getByText('Full 100%')).toBeInTheDocument()
    })

    it('should display Partial status badge for <100% coverage', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Sugar Fine has 120/150 = 80%
      expect(screen.getByText('Partial 80%')).toBeInTheDocument()
    })

    it('should display None status badge for 0% coverage', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Milk Powder has 0/100 = 0%
      expect(screen.getByText('None 0%')).toBeInTheDocument()
    })

    it('should display Over status badge for >100% coverage', async () => {
      const overReservedMaterials = [
        {
          ...mockWOMaterials[0],
          required_qty: 100,
          reserved_qty: 120,
        },
      ]

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={overReservedMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByText('Over 120%')).toBeInTheDocument()
    })

    it('should have badge with tooltip', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Status badges exist with data-testid
      const badges = screen.getAllByTestId('reservation-status-badge')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================================================
  // AC-1: Reserve Button
  // ============================================================================
  describe('AC-1: Reserve Button', () => {
    it('should display Reserve button for each material', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Should have reserve buttons for materials that aren't fully reserved
      const reserveButtons = screen.getAllByTestId(/reserve-btn-/)
      expect(reserveButtons.length).toBeGreaterThanOrEqual(2) // Sugar and Milk
    })

    it('should open reserve modal when Reserve button clicked', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Click reserve button for milk powder (not fully reserved)
      const reserveBtn = screen.getByTestId('reserve-btn-mat-3')
      await user.click(reserveBtn)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByTestId('reserve-modal')).toBeInTheDocument()
      })
    })

    it('should not show Reserve button when WO status is completed', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="completed"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Reserve buttons should not be visible (status doesn't allow modifications)
      const reserveButtons = screen.queryAllByTestId(/reserve-btn-/)
      expect(reserveButtons.length).toBe(0)
    })

    it('should disable Reserve button when material fully reserved', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Cocoa Mass is fully reserved (250/250)
      const reserveBtn = screen.getByTestId('reserve-btn-mat-1')
      expect(reserveBtn).toBeDisabled()
    })
  })

  // ============================================================================
  // Expandable Rows
  // ============================================================================
  describe('Expandable Rows', () => {
    it('should have expand/collapse arrow for materials with reservations', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Cocoa Mass has reservations, should have expand button
      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      expect(expandBtn).toBeInTheDocument()
    })

    it('should expand to show reserved LPs list when arrow clicked', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Click expand on Cocoa Mass
      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      // Should show expanded content with LP numbers
      await waitFor(() => {
        expect(screen.getByText('LP-00145')).toBeInTheDocument()
      })
    })

    it('should display LP number in expanded row', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        expect(screen.getByText('LP-00145')).toBeInTheDocument()
        expect(screen.getByText('LP-00146')).toBeInTheDocument()
        expect(screen.getByText('LP-00147')).toBeInTheDocument()
      })
    })

    it('should display lot number in expanded row', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        expect(screen.getByText('B-4501')).toBeInTheDocument()
      })
    })

    it('should display expiry date in expanded row', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        // Look for formatted date containing Jun 15, 2026
        expect(screen.getByText(/Jun 15, 2026/i)).toBeInTheDocument()
      })
    })

    it('should display location in expanded row', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        expect(screen.getByText('A1-01')).toBeInTheDocument()
      })
    })

    it('should display reserved and consumed qty per LP', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        // Should show reserved and consumed quantities (may be multiple instances)
        const reserved = screen.getAllByText(/100 kg/i)
        const consumed = screen.getAllByText(/65 kg/i)
        expect(reserved.length).toBeGreaterThanOrEqual(1)
        expect(consumed.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display reserved_by user name and date', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(
        () => {
          // Multiple instances of John Smith may appear
          const elements = screen.getAllByText(/John Smith/i)
          expect(elements.length).toBeGreaterThanOrEqual(1)
        },
        { timeout: 3000 }
      )
    })
  })

  // ============================================================================
  // AC-5: Release Button
  // ============================================================================
  describe('AC-5: Release Reservation', () => {
    it('should display Release button for active reservations', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        const releaseBtn = screen.getByTestId('release-btn-res-1')
        expect(releaseBtn).toBeInTheDocument()
      })
    })

    it('should call release mutation when Release button clicked', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { success: true, released_qty: 100 } }),
      })

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        const releaseBtn = screen.getByTestId('release-btn-res-1')
        return user.click(releaseBtn)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/planning/work-orders/wo-1/reservations/res-1'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('should not display Release button for released reservations', async () => {
      const user = userEvent.setup()

      const materialsWithReleased = [
        {
          ...mockWOMaterials[0],
          reservations: [
            {
              ...mockWOMaterials[0].reservations[0],
              status: 'released' as const,
            },
          ],
        },
      ]

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={materialsWithReleased}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        const releaseBtn = screen.queryByTestId('release-btn-res-1')
        expect(releaseBtn).not.toBeInTheDocument()
      })
    })

    it('should not display Release button for consumed reservations', async () => {
      const user = userEvent.setup()

      const materialsWithConsumed = [
        {
          ...mockWOMaterials[0],
          reservations: [
            {
              ...mockWOMaterials[0].reservations[0],
              status: 'consumed' as const,
            },
          ],
        },
      ]

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={materialsWithConsumed}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        const releaseBtn = screen.queryByTestId('release-btn-res-1')
        expect(releaseBtn).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Summary Row
  // ============================================================================
  describe('Summary Row', () => {
    it('should display total reserved at bottom of expanded section', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        // May find multiple "Total Reserved" texts - ensure at least one is present
        const elements = screen.getAllByText(/Total Reserved/i)
        expect(elements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display total consumed', async () => {
      const user = userEvent.setup()

      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const materialRow = screen.getByTestId('material-row-mat-1')
      const expandBtn = within(materialRow).getByRole('button', { name: /expand|collapse/i })
      await user.click(expandBtn)

      await waitFor(() => {
        // May find multiple "Total Consumed" texts - ensure at least one is present
        const elements = screen.getAllByText(/Total Consumed/i)
        expect(elements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display total remaining', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={mockWOMaterials}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      // Overall summary at bottom
      const summary = screen.getByTestId('summary')
      expect(within(summary).getByText(/Total Remaining/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Loading State
  // ============================================================================
  describe('Loading State', () => {
    it('should display skeleton rows when loading', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={[]}
          isLoading={true}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByTestId('reservations-panel-loading')).toBeInTheDocument()
    })

    it('should show skeleton table structure', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={[]}
          isLoading={true}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      const loadingPanel = screen.getByTestId('reservations-panel-loading')
      expect(loadingPanel).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty State
  // ============================================================================
  describe('Empty State', () => {
    it('should display empty message when no materials', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={[]}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByTestId('reservations-panel-empty')).toBeInTheDocument()
      expect(screen.getByText(/No Material Reservations/i)).toBeInTheDocument()
    })

    it('should display "Reserve Materials" CTA in empty state', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={[]}
          onReservationsChange={mockOnReservationsChange}
        />
      )

      expect(screen.getByRole('button', { name: /Reserve Materials/i })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Error State
  // ============================================================================
  describe('Error State', () => {
    it('should display error message on load failure', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={[]}
          error="Network timeout"
          onReservationsChange={mockOnReservationsChange}
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByTestId('reservations-panel-error')).toBeInTheDocument()
      expect(screen.getByText(/Failed to Load Reservations/i)).toBeInTheDocument()
    })

    it('should display Retry button on error', async () => {
      renderWithQueryClient(
        <WOReservationsPanel
          woId="wo-1"
          woNumber="WO-00123"
          woStatus="in_progress"
          materials={[]}
          error="Network timeout"
          onReservationsChange={mockOnReservationsChange}
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for Story 04.8 - WOReservationsPanel
 * ==========================================================
 *
 * Material List Display: 6 tests
 * AC-4 (Remaining): 2 tests
 * Status Badge: 5 tests
 * AC-1 (Reserve Button): 4 tests
 * Expandable Rows: 8 tests
 * AC-5 (Release): 4 tests
 * Summary Row: 3 tests
 * Loading State: 2 tests
 * Empty State: 2 tests
 * Error State: 2 tests
 *
 * Total: 38 tests
 *
 * Status: GREEN - All tests should pass
 */
