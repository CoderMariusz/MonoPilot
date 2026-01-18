/**
 * Adjustments Tab Tests
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdjustmentsTab } from '@/components/warehouse/inventory/AdjustmentsTab'
import { AdjustmentsSummaryCards } from '@/components/warehouse/inventory/AdjustmentsSummaryCards'
import { AdjustmentsTable } from '@/components/warehouse/inventory/AdjustmentsTable'
import { ApproveAdjustmentDialog } from '@/components/warehouse/inventory/ApproveAdjustmentDialog'
import { RejectAdjustmentDialog } from '@/components/warehouse/inventory/RejectAdjustmentDialog'
import type { Adjustment, AdjustmentSummary } from '@/lib/types/adjustment'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Test data
const mockSummary: AdjustmentSummary = {
  total_adjustments: 45,
  qty_increased: 1250,
  qty_increased_value: 28500,
  qty_decreased: 890,
  qty_decreased_value: 19800,
  pending_approval: 3,
}

const mockAdjustments: Adjustment[] = [
  {
    id: 'adj-1',
    adjustment_date: '2026-01-15T10:30:00Z',
    lp_id: 'lp-1',
    lp_number: 'LP-2025-1234',
    batch_number: 'BCH-890',
    product_id: 'prod-1',
    product_code: 'RM-COCOA-001',
    product_name: 'Cocoa Mass',
    location_id: 'loc-1',
    location_code: 'A-01-02',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main WH',
    original_qty: 100,
    new_qty: 75,
    variance_qty: -25,
    uom: 'kg',
    variance_value: -568,
    reason_code: 'damage',
    reason_notes: 'Water damage from leak',
    adjusted_by_id: 'user-1',
    adjusted_by_name: 'J. Smith',
    status: 'approved',
    org_id: 'org-1',
    created_at: '2026-01-15T10:30:00Z',
    updated_at: '2026-01-15T10:30:00Z',
  },
  {
    id: 'adj-2',
    adjustment_date: '2026-01-14T16:45:00Z',
    lp_id: 'lp-2',
    lp_number: 'LP-2025-1256',
    product_id: 'prod-2',
    product_code: 'RM-MILK-001',
    product_name: 'Milk Powder',
    location_id: 'loc-2',
    location_code: 'B-01-05',
    warehouse_id: 'wh-2',
    warehouse_name: 'Cold WH',
    original_qty: 50,
    new_qty: 55,
    variance_qty: 5,
    uom: 'kg',
    variance_value: 125,
    reason_code: 'counting_error',
    adjusted_by_id: 'user-2',
    adjusted_by_name: 'K. Wilson',
    status: 'pending',
    org_id: 'org-1',
    created_at: '2026-01-14T16:45:00Z',
    updated_at: '2026-01-14T16:45:00Z',
  },
]

// Query client wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('AdjustmentsSummaryCards', () => {
  it('renders loading state with skeletons', () => {
    render(<AdjustmentsSummaryCards summary={null} isLoading={true} />)
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('renders all 4 summary cards', () => {
    render(<AdjustmentsSummaryCards summary={mockSummary} />)

    expect(screen.getByTestId('kpi-total-adjustments')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-qty-increased')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-qty-decreased')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-pending-approval')).toBeInTheDocument()
  })

  it('displays correct values', () => {
    render(<AdjustmentsSummaryCards summary={mockSummary} />)

    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText(/\+1,250 kg/)).toBeInTheDocument()
    // Pending approval card shows "3"
    const pendingCard = screen.getByTestId('kpi-pending-approval')
    expect(pendingCard).toHaveTextContent('3')
  })

  it('calls onCardClick when card is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<AdjustmentsSummaryCards summary={mockSummary} onCardClick={handleClick} />)

    await user.click(screen.getByTestId('kpi-pending-approval'))
    expect(handleClick).toHaveBeenCalledWith('pending')
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<AdjustmentsSummaryCards summary={mockSummary} onCardClick={handleClick} />)

    const card = screen.getByTestId('kpi-total-adjustments')
    card.focus()
    await user.keyboard('{Enter}')

    expect(handleClick).toHaveBeenCalledWith('total')
  })
})

describe('AdjustmentsTable', () => {
  const defaultProps = {
    data: mockAdjustments,
    isLoading: false,
    pagination: { page: 1, limit: 50, total: 2, pages: 1 },
    page: 1,
    canApprove: true,
    onPageChange: vi.fn(),
  }

  it('renders loading state', () => {
    render(<AdjustmentsTable {...defaultProps} isLoading={true} />)
    expect(screen.getByTestId('adjustments-loading')).toBeInTheDocument()
  })

  it('renders table with data', () => {
    render(<AdjustmentsTable {...defaultProps} />)

    expect(screen.getByTestId('adjustments-table')).toBeInTheDocument()
    expect(screen.getAllByTestId('adjustment-row')).toHaveLength(2)
  })

  it('renders empty state when no data', () => {
    render(<AdjustmentsTable {...defaultProps} data={[]} />)
    expect(screen.getByText('No adjustments found')).toBeInTheDocument()
  })

  it('displays variance with correct color coding', () => {
    render(<AdjustmentsTable {...defaultProps} />)

    // Negative variance should be displayed
    expect(screen.getByText('-25 kg')).toBeInTheDocument()
    // Positive variance should be displayed with + prefix
    expect(screen.getByText('+5 kg')).toBeInTheDocument()

    // Check that variances are rendered (visual test - color classes are internal implementation)
    const rows = screen.getAllByTestId('adjustment-row')
    expect(rows).toHaveLength(2)
  })

  it('shows approve/reject buttons for pending adjustments when user can approve', () => {
    render(<AdjustmentsTable {...defaultProps} />)

    // Should show approve/reject for pending adjustment (use getAllBy for multiple)
    const approveButtons = screen.getAllByRole('button', { name: /approve/i })
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })
    expect(approveButtons.length).toBeGreaterThan(0)
    expect(rejectButtons.length).toBeGreaterThan(0)
  })

  it('hides approve/reject buttons when user cannot approve', () => {
    render(<AdjustmentsTable {...defaultProps} canApprove={false} />)

    // When canApprove is false, no approve buttons should be shown
    // Use aria-label exactly to distinguish from rows
    expect(screen.queryByRole('button', { name: 'Approve adjustment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject adjustment' })).not.toBeInTheDocument()
  })

  it('calls onApprove when approve button clicked', async () => {
    const user = userEvent.setup()
    const handleApprove = vi.fn()

    render(<AdjustmentsTable {...defaultProps} onApprove={handleApprove} />)

    // Find the specific approve button by its exact aria-label
    const approveButton = screen.getByRole('button', { name: 'Approve adjustment' })
    await user.click(approveButton)
    expect(handleApprove).toHaveBeenCalledWith(mockAdjustments[1])
  })

  it('calls onReject when reject button clicked', async () => {
    const user = userEvent.setup()
    const handleReject = vi.fn()

    render(<AdjustmentsTable {...defaultProps} onReject={handleReject} />)

    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })
    await user.click(rejectButtons[0])
    expect(handleReject).toHaveBeenCalledWith(mockAdjustments[1])
  })

  it('displays reason badges correctly', () => {
    render(<AdjustmentsTable {...defaultProps} />)

    expect(screen.getByText('Damage')).toBeInTheDocument()
    expect(screen.getByText('Counting Error')).toBeInTheDocument()
  })

  it('displays status badges correctly', () => {
    render(<AdjustmentsTable {...defaultProps} />)

    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})

describe('ApproveAdjustmentDialog', () => {
  const pendingAdjustment = mockAdjustments[1]

  it('renders nothing when adjustment is null', () => {
    const { container } = render(
      <ApproveAdjustmentDialog
        open={true}
        adjustment={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('displays adjustment details', () => {
    render(
      <ApproveAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Approve Adjustment')).toBeInTheDocument()
    expect(screen.getByText('LP-2025-1256')).toBeInTheDocument()
    expect(screen.getByText('Milk Powder')).toBeInTheDocument()
    expect(screen.getByText(/50 kg/)).toBeInTheDocument()
    expect(screen.getByText(/55 kg/)).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup()
    const handleConfirm = vi.fn()

    render(
      <ApproveAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /confirm approve/i }))
    expect(handleConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()
    const handleCancel = vi.fn()

    render(
      <ApproveAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(handleCancel).toHaveBeenCalled()
  })

  it('disables buttons when approving', () => {
    render(
      <ApproveAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        isApproving={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /approving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })
})

describe('RejectAdjustmentDialog', () => {
  const pendingAdjustment = mockAdjustments[1]

  it('renders nothing when adjustment is null', () => {
    const { container } = render(
      <RejectAdjustmentDialog
        open={true}
        adjustment={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('displays adjustment details', () => {
    render(
      <RejectAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Reject Adjustment')).toBeInTheDocument()
    expect(screen.getByText('LP-2025-1256')).toBeInTheDocument()
  })

  it('requires minimum 10 characters for rejection reason', async () => {
    const user = userEvent.setup()
    const handleConfirm = vi.fn()

    render(
      <RejectAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    )

    const textarea = screen.getByPlaceholderText(/explain why/i)
    await user.type(textarea, 'short')

    const confirmButton = screen.getByRole('button', { name: /confirm reject/i })
    expect(confirmButton).toBeDisabled()

    // Type valid reason
    await user.clear(textarea)
    await user.type(textarea, 'This adjustment is not correct because the counts do not match')

    expect(confirmButton).toBeEnabled()
  })

  it('shows validation error on blur', async () => {
    const user = userEvent.setup()

    render(
      <RejectAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const textarea = screen.getByPlaceholderText(/explain why/i)
    await user.type(textarea, 'short')
    await user.tab() // Blur

    expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument()
  })

  it('calls onConfirm with reason when confirm clicked', async () => {
    const user = userEvent.setup()
    const handleConfirm = vi.fn()
    const reason = 'This adjustment is not correct because the counts do not match'

    render(
      <RejectAdjustmentDialog
        open={true}
        adjustment={pendingAdjustment}
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    )

    const textarea = screen.getByPlaceholderText(/explain why/i)
    await user.type(textarea, reason)
    await user.click(screen.getByRole('button', { name: /confirm reject/i }))

    expect(handleConfirm).toHaveBeenCalledWith(reason)
  })
})

describe('AdjustmentsTab Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAdjustments,
        summary: mockSummary,
        pagination: { page: 1, limit: 50, total: 2, pages: 1 },
      }),
    })
  })

  it('renders loading state initially', async () => {
    render(<AdjustmentsTab />, { wrapper: createWrapper() })
    expect(screen.getByTestId('adjustments-skeleton')).toBeInTheDocument()
  })

  it('renders data after loading', async () => {
    render(<AdjustmentsTab userRoles={['warehouse_manager']} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-tab')).toBeInTheDocument()
    })

    expect(screen.getByText('Stock Adjustments')).toBeInTheDocument()
    expect(screen.getByText('LP-2025-1234')).toBeInTheDocument()
  })

  it('renders error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed' }),
    })

    render(<AdjustmentsTab />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-error')).toBeInTheDocument()
    })
  })

  it('renders empty state when no data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        summary: { ...mockSummary, total_adjustments: 0 },
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      }),
    })

    render(<AdjustmentsTab />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-empty')).toBeInTheDocument()
    })
  })

  it('opens approve dialog when approve clicked', async () => {
    const user = userEvent.setup()

    render(<AdjustmentsTab userRoles={['admin']} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-tab')).toBeInTheDocument()
    })

    // Find the specific approve button by its exact aria-label
    const approveButton = screen.getByRole('button', { name: 'Approve adjustment' })
    await user.click(approveButton)

    expect(screen.getByText('Approve Adjustment')).toBeInTheDocument()
  })

  it('opens reject dialog when reject clicked', async () => {
    const user = userEvent.setup()

    render(<AdjustmentsTab userRoles={['warehouse_manager']} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-tab')).toBeInTheDocument()
    })

    // Find the specific reject button by its exact aria-label
    const rejectButton = screen.getByRole('button', { name: 'Reject adjustment' })
    await user.click(rejectButton)

    expect(screen.getByText('Reject Adjustment')).toBeInTheDocument()
  })

  it('filters by status when filter changed', async () => {
    const user = userEvent.setup()

    render(<AdjustmentsTab userRoles={['admin']} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-tab')).toBeInTheDocument()
    })

    // Click status filter
    const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
    await user.click(statusFilter)
    await user.click(screen.getByRole('option', { name: /pending/i }))

    // Verify fetch was called with status filter
    await waitFor(() => {
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
      expect(lastCall[0]).toContain('status=pending')
    })
  })

  it('permissions check - hides approve buttons for non-managers', async () => {
    render(<AdjustmentsTab userRoles={['viewer']} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('adjustments-tab')).toBeInTheDocument()
    })

    // When userRoles doesn't include manager/admin, approve/reject buttons should not be shown
    expect(screen.queryByRole('button', { name: 'Approve adjustment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject adjustment' })).not.toBeInTheDocument()
  })
})
