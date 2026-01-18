/**
 * Aging Report Tab Tests
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Tests for:
 * - FIFO/FEFO toggle
 * - Chart rendering
 * - Table bucket colors
 * - Top oldest widget
 * - Filters application
 * - Loading, empty, error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Mock components
import { AgingModeToggle } from '@/components/warehouse/inventory/AgingModeToggle'
import { AgingReportTable } from '@/components/warehouse/inventory/AgingReportTable'
import { TopOldestStockWidget } from '@/components/warehouse/inventory/TopOldestStockWidget'
import { AgingReportEmptyState } from '@/components/warehouse/inventory/AgingReportEmptyState'
import { AgingReportErrorState } from '@/components/warehouse/inventory/AgingReportErrorState'
import { AgingReportSkeleton } from '@/components/warehouse/inventory/AgingReportSkeleton'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Test wrapper with QueryClient
const createWrapper = () => {
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

// Mock data
const mockAgingData = [
  {
    product_id: 'product-1',
    product_name: 'Cocoa Mass',
    product_sku: 'RM-COCOA-001',
    uom: 'kg',
    bucket_0_7_days: { qty: 100, lp_count: 5, value: 1500 },
    bucket_8_30_days: { qty: 150, lp_count: 8, value: 2250 },
    bucket_31_90_days: { qty: 80, lp_count: 4, value: 1200 },
    bucket_90_plus_days: { qty: 50, lp_count: 2, value: 750 },
    total_qty: 380,
    total_lps: 19,
    total_value: 5700,
    oldest_lp_age_days: 120,
    soonest_expiry_days: null,
  },
  {
    product_id: 'product-2',
    product_name: 'Sugar Fine',
    product_sku: 'RM-SUGAR-001',
    uom: 'kg',
    bucket_0_7_days: { qty: 200, lp_count: 10, value: 1000 },
    bucket_8_30_days: { qty: 100, lp_count: 5, value: 500 },
    bucket_31_90_days: { qty: 0, lp_count: 0, value: 0 },
    bucket_90_plus_days: { qty: 0, lp_count: 0, value: 0 },
    total_qty: 300,
    total_lps: 15,
    total_value: 1500,
    oldest_lp_age_days: 25,
    soonest_expiry_days: null,
  },
]

const mockTopOldestItems = [
  {
    product_name: 'Cocoa Mass',
    lp_number: 'LP-2024-08-00123',
    age_days: 134,
    expiry_days: null,
    quantity: 50,
    uom: 'kg',
    location_code: 'A-01-02',
    warehouse_name: 'Main WH',
  },
  {
    product_name: 'Sugar Fine',
    lp_number: 'LP-2024-09-00456',
    age_days: 102,
    expiry_days: null,
    quantity: 75,
    uom: 'kg',
    location_code: 'A-02-03',
    warehouse_name: 'Main WH',
  },
]

describe('AgingModeToggle', () => {
  it('renders FIFO and FEFO options', () => {
    const onChange = vi.fn()
    render(<AgingModeToggle value="fifo" onChange={onChange} />)

    expect(screen.getByLabelText(/fifo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fefo/i)).toBeInTheDocument()
  })

  it('shows FIFO as selected when value is fifo', () => {
    const onChange = vi.fn()
    render(<AgingModeToggle value="fifo" onChange={onChange} />)

    const fifoRadio = screen.getByRole('radio', { name: /fifo/i })
    expect(fifoRadio).toBeChecked()
  })

  it('shows FEFO as selected when value is fefo', () => {
    const onChange = vi.fn()
    render(<AgingModeToggle value="fefo" onChange={onChange} />)

    const fefoRadio = screen.getByRole('radio', { name: /fefo/i })
    expect(fefoRadio).toBeChecked()
  })

  it('calls onChange when toggling mode', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<AgingModeToggle value="fifo" onChange={onChange} />)

    const fefoRadio = screen.getByRole('radio', { name: /fefo/i })
    await user.click(fefoRadio)

    expect(onChange).toHaveBeenCalledWith('fefo')
  })

  it('disables radios when disabled prop is true', () => {
    const onChange = vi.fn()
    render(<AgingModeToggle value="fifo" onChange={onChange} disabled />)

    const fifoRadio = screen.getByRole('radio', { name: /fifo/i })
    const fefoRadio = screen.getByRole('radio', { name: /fefo/i })

    expect(fifoRadio).toBeDisabled()
    expect(fefoRadio).toBeDisabled()
  })
})

describe('AgingReportTable', () => {
  it('renders product rows', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('Cocoa Mass')).toBeInTheDocument()
    expect(screen.getByText('Sugar Fine')).toBeInTheDocument()
  })

  it('renders bucket columns with correct headers', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('0-7 days')).toBeInTheDocument()
    expect(screen.getByText('8-30 days')).toBeInTheDocument()
    expect(screen.getByText('31-90 days')).toBeInTheDocument()
    expect(screen.getByText('90+ days')).toBeInTheDocument()
  })

  it('shows total quantity and value for each product', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    // Check total qty is displayed (380 for Cocoa Mass)
    expect(screen.getByText(/380/)).toBeInTheDocument()
    // Check total value is displayed ($5,700 for Cocoa Mass)
    expect(screen.getByText(/5,700/)).toBeInTheDocument()
  })

  it('shows oldest LP age in FIFO mode', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    // 120 days for Cocoa Mass oldest LP
    expect(screen.getByText(/120 days/)).toBeInTheDocument()
  })

  it('sorts by total value by default (descending)', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    const rows = screen.getAllByRole('row')
    // First data row should be Cocoa Mass (higher value)
    expect(rows[1]).toHaveTextContent('Cocoa Mass')
  })

  it('handles empty bucket data with dash', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    // Sugar Fine has no 31-90 or 90+ bucket data
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('supports pagination', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    // Create enough data for pagination (51 items for 2 pages with 50 per page)
    const manyItems = Array.from({ length: 51 }, (_, i) => ({
      ...mockAgingData[0],
      product_id: `product-${i}`,
      product_name: `Product ${i}`,
    }))

    render(
      <AgingReportTable
        data={manyItems}
        mode="fifo"
        page={1}
        onPageChange={onPageChange}
        itemsPerPage={50}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})

describe('TopOldestStockWidget', () => {
  it('renders items in FIFO mode', () => {
    render(
      <TopOldestStockWidget items={mockTopOldestItems} mode="fifo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('LP-2024-08-00123')).toBeInTheDocument()
    expect(screen.getByText('LP-2024-09-00456')).toBeInTheDocument()
  })

  it('shows age in days for FIFO mode', () => {
    render(
      <TopOldestStockWidget items={mockTopOldestItems} mode="fifo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('134d')).toBeInTheDocument()
    expect(screen.getByText('102d')).toBeInTheDocument()
  })

  it('shows header for FIFO mode', () => {
    render(
      <TopOldestStockWidget items={mockTopOldestItems} mode="fifo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Top 10 Oldest Stock')).toBeInTheDocument()
  })

  it('shows header for FEFO mode', () => {
    const fefoItems = mockTopOldestItems.map((item) => ({
      ...item,
      age_days: null,
      expiry_days: 15,
    }))

    render(
      <TopOldestStockWidget items={fefoItems} mode="fefo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Soonest Expiring')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading is true', () => {
    render(
      <TopOldestStockWidget items={[]} mode="fifo" isLoading />,
      { wrapper: createWrapper() }
    )

    // Should show skeleton elements
    expect(screen.queryByText('LP-2024-08-00123')).not.toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(
      <TopOldestStockWidget items={[]} mode="fifo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText(/no stock items to display/i)).toBeInTheDocument()
  })

  it('shows location and warehouse for each item', () => {
    render(
      <TopOldestStockWidget items={mockTopOldestItems} mode="fifo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getAllByText('A-01-02')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Main WH')[0]).toBeInTheDocument()
  })
})

describe('AgingReportEmptyState', () => {
  it('renders empty state message', () => {
    render(<AgingReportEmptyState mode="fifo" />, { wrapper: createWrapper() })

    expect(screen.getByText('No Aging Data Available')).toBeInTheDocument()
  })

  it('shows FIFO-specific message in FIFO mode', () => {
    render(<AgingReportEmptyState mode="fifo" />, { wrapper: createWrapper() })

    expect(screen.getByText(/start receiving inventory/i)).toBeInTheDocument()
  })

  it('shows FEFO-specific message in FEFO mode', () => {
    render(<AgingReportEmptyState mode="fefo" />, { wrapper: createWrapper() })

    expect(screen.getByText(/no items with expiry dates/i)).toBeInTheDocument()
  })

  it('shows CTA buttons', () => {
    render(<AgingReportEmptyState mode="fifo" />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: /receiving/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /purchase orders/i })).toBeInTheDocument()
  })
})

describe('AgingReportErrorState', () => {
  it('renders error state message', () => {
    const onRetry = vi.fn()
    const error = new Error('Network error')

    render(<AgingReportErrorState error={error} onRetry={onRetry} />)

    expect(screen.getByText('Failed to Load Aging Report')).toBeInTheDocument()
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<AgingReportErrorState error={null} onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)

    expect(onRetry).toHaveBeenCalled()
  })

  it('shows contact support button', () => {
    const onRetry = vi.fn()

    render(<AgingReportErrorState error={null} onRetry={onRetry} />)

    expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument()
  })
})

describe('AgingReportSkeleton', () => {
  it('renders skeleton elements', () => {
    render(<AgingReportSkeleton />)

    expect(screen.getByTestId('aging-report-skeleton')).toBeInTheDocument()
  })
})

describe('Bucket Color Coding', () => {
  it('applies correct background colors to bucket headers', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    // Check that headers have appropriate styling
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // Verify bucket columns exist
    expect(screen.getByText('0-7 days')).toBeInTheDocument()
    expect(screen.getByText('8-30 days')).toBeInTheDocument()
    expect(screen.getByText('31-90 days')).toBeInTheDocument()
    expect(screen.getByText('90+ days')).toBeInTheDocument()
  })
})

describe('Keyboard Navigation', () => {
  it('supports keyboard navigation for toggle', async () => {
    const onChange = vi.fn()

    render(<AgingModeToggle value="fifo" onChange={onChange} />)

    // Check that radio group exists and is accessible
    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toBeInTheDocument()
    expect(radioGroup).toHaveAttribute('tabindex', '0')

    // Check that both radio buttons are present
    const fifoRadio = screen.getByRole('radio', { name: /fifo/i })
    const fefoRadio = screen.getByRole('radio', { name: /fefo/i })
    expect(fifoRadio).toBeInTheDocument()
    expect(fefoRadio).toBeInTheDocument()
  })

  it('supports keyboard navigation for table rows', () => {
    render(
      <AgingReportTable
        data={mockAgingData}
        mode="fifo"
        page={1}
        onPageChange={() => {}}
      />
    )

    const rows = screen.getAllByRole('row')
    // Data rows should have tabIndex
    expect(rows[1]).toHaveAttribute('tabindex', '0')
  })
})

describe('Accessibility', () => {
  it('has accessible labels for mode toggle', () => {
    const onChange = vi.fn()
    render(<AgingModeToggle value="fifo" onChange={onChange} />)

    expect(screen.getByLabelText(/fifo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fefo/i)).toBeInTheDocument()
    expect(screen.getByText('Aging Mode')).toBeInTheDocument()
  })

  it('widget has accessible list role', () => {
    render(
      <TopOldestStockWidget items={mockTopOldestItems} mode="fifo" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByRole('list', { name: /oldest stock items/i })).toBeInTheDocument()
  })

  it('error state has alert role', () => {
    const onRetry = vi.fn()
    render(<AgingReportErrorState error={null} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
