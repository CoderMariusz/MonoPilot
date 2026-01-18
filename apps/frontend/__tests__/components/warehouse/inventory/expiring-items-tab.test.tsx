/**
 * Tests: Expiring Items Tab
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Component tests for expiring items functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ExpiryBadge, calculateTier } from '@/components/warehouse/inventory/ExpiryBadge'
import { ExpiringDaysSlider } from '@/components/warehouse/inventory/ExpiringDaysSlider'
import { ExpiringItemsSummary } from '@/components/warehouse/inventory/ExpiringItemsSummary'
import { ExpiringItemsBulkActions } from '@/components/warehouse/inventory/ExpiringItemsBulkActions'
import { ExpiringItemsTable } from '@/components/warehouse/inventory/ExpiringItemsTable'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Create query client wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

// Mock data
const mockExpiringItems = [
  {
    lp_id: 'lp-1',
    lp_number: 'LP-2025-0001',
    product_id: 'prod-1',
    product_name: 'Cocoa Mass',
    product_sku: 'RM-COCOA-001',
    quantity: 50.0,
    uom: 'kg',
    location_id: 'loc-1',
    location_code: 'A-01-02',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main WH',
    batch_number: 'BCH-890',
    expiry_date: '2026-01-10',
    days_until_expiry: -5,
    tier: 'expired' as const,
    unit_cost: 10.0,
    value: 500.0,
  },
  {
    lp_id: 'lp-2',
    lp_number: 'LP-2025-0002',
    product_id: 'prod-2',
    product_name: 'Butter Unsalted',
    product_sku: 'RM-BUTTER-001',
    quantity: 15.0,
    uom: 'kg',
    location_id: 'loc-2',
    location_code: 'B-02-01',
    warehouse_id: 'wh-2',
    warehouse_name: 'Cold WH',
    batch_number: 'BUT-789',
    expiry_date: '2026-01-16',
    days_until_expiry: 1,
    tier: 'critical' as const,
    unit_cost: 15.0,
    value: 225.0,
  },
  {
    lp_id: 'lp-3',
    lp_number: 'LP-2025-0003',
    product_id: 'prod-3',
    product_name: 'Yogurt Plain',
    product_sku: 'RM-YOGURT-001',
    quantity: 60.0,
    uom: 'kg',
    location_id: 'loc-3',
    location_code: 'B-04-01',
    warehouse_id: 'wh-2',
    warehouse_name: 'Cold WH',
    batch_number: 'YOG-890',
    expiry_date: '2026-01-25',
    days_until_expiry: 10,
    tier: 'warning' as const,
    unit_cost: 8.0,
    value: 480.0,
  },
  {
    lp_id: 'lp-4',
    lp_number: 'LP-2025-0004',
    product_id: 'prod-4',
    product_name: 'Wheat Flour',
    product_sku: 'RM-FLOUR-001',
    quantity: 100.0,
    uom: 'kg',
    location_id: 'loc-4',
    location_code: 'A-03-01',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main WH',
    batch_number: 'FLR-456',
    expiry_date: '2026-03-15',
    days_until_expiry: 60,
    tier: 'ok' as const,
    unit_cost: 5.0,
    value: 500.0,
  },
]

const mockSummary = {
  expired: 5,
  critical: 12,
  warning: 15,
  ok: 20,
  total_value: 28500.0,
}

describe('ExpiryBadge', () => {
  it('renders expired badge correctly', () => {
    render(<ExpiryBadge daysRemaining={-5} />)

    const badge = screen.getByTestId('expiry-badge')
    expect(badge).toHaveTextContent('Expired 5d ago')
    expect(badge).toHaveAttribute('data-tier', 'expired')
    expect(badge).toHaveClass('bg-red-500')
  })

  it('renders critical badge correctly', () => {
    render(<ExpiryBadge daysRemaining={3} />)

    const badge = screen.getByTestId('expiry-badge')
    expect(badge).toHaveTextContent('3d')
    expect(badge).toHaveAttribute('data-tier', 'critical')
    expect(badge).toHaveClass('bg-orange-500')
  })

  it('renders warning badge correctly', () => {
    render(<ExpiryBadge daysRemaining={15} />)

    const badge = screen.getByTestId('expiry-badge')
    expect(badge).toHaveTextContent('15d')
    expect(badge).toHaveAttribute('data-tier', 'warning')
    expect(badge).toHaveClass('bg-yellow-500')
  })

  it('renders ok badge correctly', () => {
    render(<ExpiryBadge daysRemaining={45} />)

    const badge = screen.getByTestId('expiry-badge')
    expect(badge).toHaveTextContent('45d')
    expect(badge).toHaveAttribute('data-tier', 'ok')
    expect(badge).toHaveClass('bg-green-500')
  })
})

describe('calculateTier', () => {
  it('returns expired for negative days', () => {
    expect(calculateTier(-1)).toBe('expired')
    expect(calculateTier(-100)).toBe('expired')
  })

  it('returns critical for 0-7 days', () => {
    expect(calculateTier(0)).toBe('critical')
    expect(calculateTier(7)).toBe('critical')
  })

  it('returns warning for 8-30 days', () => {
    expect(calculateTier(8)).toBe('warning')
    expect(calculateTier(30)).toBe('warning')
  })

  it('returns ok for 31+ days', () => {
    expect(calculateTier(31)).toBe('ok')
    expect(calculateTier(100)).toBe('ok')
  })
})

describe('ExpiringDaysSlider', () => {
  it('renders with correct initial value', () => {
    const onDaysChange = vi.fn()
    render(<ExpiringDaysSlider days={30} onDaysChange={onDaysChange} />)

    expect(screen.getByTestId('expiring-days-slider')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText(/Show items expiring within/)).toBeInTheDocument()
  })

  it('calls onDaysChange when slider changes', async () => {
    const onDaysChange = vi.fn()
    render(<ExpiringDaysSlider days={30} onDaysChange={onDaysChange} />)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '45' } })

    expect(onDaysChange).toHaveBeenCalledWith(45)
  })

  it('is disabled when disabled prop is true', () => {
    const onDaysChange = vi.fn()
    render(<ExpiringDaysSlider days={30} onDaysChange={onDaysChange} disabled />)

    const slider = screen.getByRole('slider')
    expect(slider).toBeDisabled()
  })
})

describe('ExpiringItemsSummary', () => {
  it('renders all tier cards with correct counts', () => {
    const onTierClick = vi.fn()
    render(
      <ExpiringItemsSummary
        summary={mockSummary}
        onTierClick={onTierClick}
        activeTier="all"
      />
    )

    expect(screen.getByTestId('expiring-items-summary')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Expired
    expect(screen.getByText('12')).toBeInTheDocument() // Critical
    expect(screen.getByText('15')).toBeInTheDocument() // Warning
    expect(screen.getByText('20')).toBeInTheDocument() // OK
  })

  it('calls onTierClick when card is clicked', async () => {
    const user = userEvent.setup()
    const onTierClick = vi.fn()
    render(
      <ExpiringItemsSummary
        summary={mockSummary}
        onTierClick={onTierClick}
        activeTier="all"
      />
    )

    const expiredCard = screen.getByTestId('tier-card-expired')
    await user.click(expiredCard)

    expect(onTierClick).toHaveBeenCalledWith('expired')
  })

  it('toggles filter off when clicking active tier', async () => {
    const user = userEvent.setup()
    const onTierClick = vi.fn()
    render(
      <ExpiringItemsSummary
        summary={mockSummary}
        onTierClick={onTierClick}
        activeTier="expired"
      />
    )

    const expiredCard = screen.getByTestId('tier-card-expired')
    await user.click(expiredCard)

    expect(onTierClick).toHaveBeenCalledWith('all')
  })

  it('renders skeleton when loading', () => {
    const onTierClick = vi.fn()
    render(
      <ExpiringItemsSummary
        summary={undefined}
        onTierClick={onTierClick}
        activeTier="all"
        isLoading
      />
    )

    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    const onTierClick = vi.fn()
    render(
      <ExpiringItemsSummary
        summary={mockSummary}
        onTierClick={onTierClick}
        activeTier="all"
      />
    )

    const expiredCard = screen.getByTestId('tier-card-expired')
    expiredCard.focus()
    await user.keyboard('{Enter}')

    expect(onTierClick).toHaveBeenCalledWith('expired')
  })
})

describe('ExpiringItemsBulkActions', () => {
  it('does not render when no items selected', () => {
    const onAction = vi.fn()
    const onClear = vi.fn()
    const { container } = render(
      <ExpiringItemsBulkActions
        selectedCount={0}
        onAction={onAction}
        onClear={onClear}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders toolbar when items are selected', () => {
    const onAction = vi.fn()
    const onClear = vi.fn()
    render(
      <ExpiringItemsBulkActions
        selectedCount={5}
        onAction={onAction}
        onClear={onClear}
      />
    )

    expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument()
    expect(screen.getByText('5 items selected')).toBeInTheDocument()
    expect(screen.getByText('Move to Quarantine')).toBeInTheDocument()
    expect(screen.getByText('Create Adjustment')).toBeInTheDocument()
    expect(screen.getByText('Print Labels')).toBeInTheDocument()
  })

  it('calls onAction with correct action type', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onClear = vi.fn()
    render(
      <ExpiringItemsBulkActions
        selectedCount={5}
        onAction={onAction}
        onClear={onClear}
      />
    )

    await user.click(screen.getByText('Move to Quarantine'))
    expect(onAction).toHaveBeenCalledWith('quarantine')

    await user.click(screen.getByText('Create Adjustment'))
    expect(onAction).toHaveBeenCalledWith('adjust')

    await user.click(screen.getByText('Print Labels'))
    expect(onAction).toHaveBeenCalledWith('print_labels')
  })

  it('calls onClear when Clear button is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onClear = vi.fn()
    render(
      <ExpiringItemsBulkActions
        selectedCount={5}
        onAction={onAction}
        onClear={onClear}
      />
    )

    await user.click(screen.getByText('Clear'))
    expect(onClear).toHaveBeenCalled()
  })

  it('shows singular text for 1 item', () => {
    const onAction = vi.fn()
    const onClear = vi.fn()
    render(
      <ExpiringItemsBulkActions
        selectedCount={1}
        onAction={onAction}
        onClear={onClear}
      />
    )

    expect(screen.getByText('1 item selected')).toBeInTheDocument()
  })
})

describe('ExpiringItemsTable', () => {
  const defaultProps = {
    data: mockExpiringItems,
    selectedIds: [],
    onSelectionChange: vi.fn(),
    page: 1,
    onPageChange: vi.fn(),
    pagination: {
      page: 1,
      limit: 50,
      total: 4,
      pages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with data', () => {
    render(<ExpiringItemsTable {...defaultProps} />)

    expect(screen.getByTestId('expiring-items-table')).toBeInTheDocument()
    expect(screen.getByText('LP-2025-0001')).toBeInTheDocument()
    expect(screen.getByText('Cocoa Mass')).toBeInTheDocument()
    expect(screen.getByText('LP-2025-0002')).toBeInTheDocument()
    expect(screen.getByText('Butter Unsalted')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<ExpiringItemsTable {...defaultProps} data={[]} />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('No Expiring Items')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    render(<ExpiringItemsTable {...defaultProps} isLoading />)

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
  })

  it('applies correct row colors based on tier', () => {
    render(<ExpiringItemsTable {...defaultProps} />)

    const rows = screen.getAllByRole('row').slice(1) // Skip header row

    // Check that rows have tier data attribute
    expect(rows[0]).toHaveAttribute('data-tier', 'expired')
    expect(rows[1]).toHaveAttribute('data-tier', 'critical')
    expect(rows[2]).toHaveAttribute('data-tier', 'warning')
    expect(rows[3]).toHaveAttribute('data-tier', 'ok')
  })

  it('selects item when checkbox clicked', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <ExpiringItemsTable
        {...defaultProps}
        onSelectionChange={onSelectionChange}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // First item checkbox (index 0 is select all)

    expect(onSelectionChange).toHaveBeenCalledWith(['lp-1'])
  })

  it('selects all items when select all checkbox clicked', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <ExpiringItemsTable
        {...defaultProps}
        onSelectionChange={onSelectionChange}
      />
    )

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(selectAllCheckbox)

    expect(onSelectionChange).toHaveBeenCalledWith([
      'lp-1',
      'lp-2',
      'lp-3',
      'lp-4',
    ])
  })

  it('deselects all when all selected and select all clicked', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <ExpiringItemsTable
        {...defaultProps}
        selectedIds={['lp-1', 'lp-2', 'lp-3', 'lp-4']}
        onSelectionChange={onSelectionChange}
      />
    )

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(selectAllCheckbox)

    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it('renders pagination when multiple pages', () => {
    render(
      <ExpiringItemsTable
        {...defaultProps}
        pagination={{
          page: 1,
          limit: 2,
          total: 4,
          pages: 2,
        }}
      />
    )

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('calls onPageChange when pagination buttons clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <ExpiringItemsTable
        {...defaultProps}
        onPageChange={onPageChange}
        pagination={{
          page: 1,
          limit: 2,
          total: 4,
          pages: 2,
        }}
      />
    )

    await user.click(screen.getByText('Next'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables previous button on first page', () => {
    render(
      <ExpiringItemsTable
        {...defaultProps}
        page={1}
        pagination={{
          page: 1,
          limit: 2,
          total: 4,
          pages: 2,
        }}
      />
    )

    expect(screen.getByText('Previous')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(
      <ExpiringItemsTable
        {...defaultProps}
        page={2}
        pagination={{
          page: 2,
          limit: 2,
          total: 4,
          pages: 2,
        }}
      />
    )

    expect(screen.getByText('Next')).toBeDisabled()
  })

  it('renders expiry badges in days column', () => {
    render(<ExpiringItemsTable {...defaultProps} />)

    const badges = screen.getAllByTestId('expiry-badge')
    expect(badges.length).toBe(4)
    expect(badges[0]).toHaveTextContent('Expired 5d ago')
    expect(badges[1]).toHaveTextContent('1d')
    expect(badges[2]).toHaveTextContent('10d')
    expect(badges[3]).toHaveTextContent('60d')
  })

  it('renders color legend', () => {
    render(<ExpiringItemsTable {...defaultProps} />)

    expect(screen.getByText('Color Legend:')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Critical (0-7 days)')).toBeInTheDocument()
    expect(screen.getByText('Warning (8-30 days)')).toBeInTheDocument()
    expect(screen.getByText('OK (31+ days)')).toBeInTheDocument()
  })

  it('renders LP links correctly', () => {
    render(<ExpiringItemsTable {...defaultProps} />)

    const lpLink = screen.getByRole('link', { name: 'LP-2025-0001' })
    expect(lpLink).toHaveAttribute('href', '/warehouse/license-plates/lp-1')
  })
})
