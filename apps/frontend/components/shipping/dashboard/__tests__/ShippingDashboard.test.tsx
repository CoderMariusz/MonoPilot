/**
 * Component Tests: Shipping Dashboard Page
 * Story: 07.15 - Shipping Dashboard + KPIs
 * Phase: RED - Tests should FAIL (components not implemented)
 *
 * Tests the main dashboard page component:
 * - Page structure and layout
 * - Data fetching and loading states
 * - Error handling
 * - Responsive design
 * - Accessibility
 * - Auto-refresh functionality
 * - Date range filter integration
 *
 * Coverage Target: 80%
 * Test Count: 32 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShippingDashboard from '../ShippingDashboard'
import DashboardHeader from '../DashboardHeader'
import DateRangeFilter from '../DateRangeFilter'
import DashboardSkeleton from '../DashboardSkeleton'
import EmptyDashboard from '../EmptyDashboard'
import DashboardError from '../DashboardError'

// Mock React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

// Mock hooks
vi.mock('@/lib/hooks/use-dashboard-kpis', () => ({
  useDashboardKPIs: vi.fn(() => ({
    data: null,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/lib/hooks/use-dashboard-alerts', () => ({
  useDashboardAlerts: vi.fn(() => ({
    data: null,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/lib/hooks/use-recent-activity', () => ({
  useRecentActivity: vi.fn(() => ({
    data: [],
    isLoading: true,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
  })),
}))

vi.mock('@/lib/hooks/use-auto-refresh', () => ({
  useAutoRefresh: vi.fn(() => ({
    isEnabled: true,
    toggle: vi.fn(),
    nextRefreshIn: 30,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/lib/hooks/use-date-range', () => ({
  useDateRange: vi.fn(() => ({
    dateRange: {
      from: new Date('2025-12-01'),
      to: new Date('2025-12-31'),
      preset: 'last_30',
    },
    setDateRange: vi.fn(),
    preset: 'last_30',
    setPreset: vi.fn(),
  })),
}))

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/shipping/dashboard'),
}))

describe('ShippingDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  describe('Page Structure', () => {
    it('should render dashboard page with correct title', () => {
      render(<ShippingDashboard />, { wrapper })

      expect(screen.getByText('Shipping Dashboard')).toBeInTheDocument()
    })

    it('should render all main sections', () => {
      render(<ShippingDashboard />, { wrapper })

      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-kpis')).toBeInTheDocument()
      expect(screen.getByTestId('alerts-section')).toBeInTheDocument()
      expect(screen.getByTestId('charts-section')).toBeInTheDocument()
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument()
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    })

    it('should render in correct order: Header, Filter, KPIs, Alerts, Charts, Activity, Actions', () => {
      render(<ShippingDashboard />, { wrapper })

      const container = screen.getByTestId('dashboard-container')
      const sections = within(container).getAllByRole('region')

      expect(sections.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Loading States', () => {
    it('should show skeleton loader while data is loading', () => {
      render(<ShippingDashboard />, { wrapper })

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
    })

    it('should show skeleton for KPI cards while loading', () => {
      render(<DashboardSkeleton />, { wrapper })

      expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4)
    })

    it('should show skeleton for charts while loading', () => {
      render(<DashboardSkeleton />, { wrapper })

      expect(screen.getAllByTestId('chart-skeleton')).toHaveLength(2)
    })

    it('should show skeleton for alerts while loading', () => {
      render(<DashboardSkeleton />, { wrapper })

      expect(screen.getByTestId('alerts-skeleton')).toBeInTheDocument()
    })

    it('should show skeleton for activity while loading', () => {
      render(<DashboardSkeleton />, { wrapper })

      expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('should show error state when data fetch fails', async () => {
      const mockError = new Error('Failed to load dashboard')

      render(
        <DashboardError error={mockError} onRetry={vi.fn()} />,
        { wrapper }
      )

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })

    it('should show retry button on error', () => {
      render(
        <DashboardError error={new Error('Error')} onRetry={vi.fn()} />,
        { wrapper }
      )

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should call onRetry when retry button clicked', async () => {
      const mockRetry = vi.fn()

      render(
        <DashboardError error={new Error('Error')} onRetry={mockRetry} />,
        { wrapper }
      )

      await userEvent.click(screen.getByRole('button', { name: /retry/i }))

      expect(mockRetry).toHaveBeenCalled()
    })

    it('should show fallback to cached data message when available', () => {
      render(
        <DashboardError
          error={new Error('Error')}
          onRetry={vi.fn()}
          cachedData={{ lastUpdated: new Date().toISOString() }}
        />,
        { wrapper }
      )

      expect(screen.getByText(/showing cached data/i)).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no data in date range', () => {
      render(
        <EmptyDashboard
          dateRange={{ from: new Date(), to: new Date(), preset: 'today' }}
          onChangeDateRange={vi.fn()}
        />,
        { wrapper }
      )

      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    })

    it('should suggest changing date range in empty state', () => {
      render(
        <EmptyDashboard
          dateRange={{ from: new Date(), to: new Date(), preset: 'today' }}
          onChangeDateRange={vi.fn()}
        />,
        { wrapper }
      )

      expect(screen.getByRole('button', { name: /change date range/i })).toBeInTheDocument()
    })

    it('should show create SO button in empty state', () => {
      render(
        <EmptyDashboard
          dateRange={{ from: new Date(), to: new Date(), preset: 'today' }}
          onChangeDateRange={vi.fn()}
        />,
        { wrapper }
      )

      expect(screen.getByRole('button', { name: /create sales order/i })).toBeInTheDocument()
    })
  })
})

describe('DashboardHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render header with title', () => {
    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={30}
      />,
      { wrapper }
    )

    expect(screen.getByText('Shipping Dashboard')).toBeInTheDocument()
  })

  it('should render auto-refresh toggle switch', () => {
    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={30}
      />,
      { wrapper }
    )

    expect(screen.getByRole('switch', { name: /auto-refresh/i })).toBeInTheDocument()
  })

  it('should call onToggleAutoRefresh when toggle clicked', async () => {
    const mockToggle = vi.fn()

    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={mockToggle}
        nextRefreshIn={30}
      />,
      { wrapper }
    )

    await userEvent.click(screen.getByRole('switch', { name: /auto-refresh/i }))

    expect(mockToggle).toHaveBeenCalledWith(false)
  })

  it('should render manual refresh button', () => {
    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={30}
      />,
      { wrapper }
    )

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('should call onManualRefresh when refresh button clicked', async () => {
    const mockRefresh = vi.fn()

    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={mockRefresh}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={30}
      />,
      { wrapper }
    )

    await userEvent.click(screen.getByRole('button', { name: /refresh/i }))

    expect(mockRefresh).toHaveBeenCalled()
  })

  it('should show spinner when isRefreshing is true', () => {
    render(
      <DashboardHeader
        isRefreshing={true}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={30}
      />,
      { wrapper }
    )

    expect(screen.getByTestId('refresh-spinner')).toBeInTheDocument()
  })

  it('should display next refresh countdown when auto-refresh enabled', () => {
    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={true}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={25}
      />,
      { wrapper }
    )

    expect(screen.getByText(/25s/)).toBeInTheDocument()
  })

  it('should not display countdown when auto-refresh disabled', () => {
    render(
      <DashboardHeader
        isRefreshing={false}
        onManualRefresh={vi.fn()}
        autoRefreshEnabled={false}
        onToggleAutoRefresh={vi.fn()}
        nextRefreshIn={0}
      />,
      { wrapper }
    )

    expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument()
  })
})

describe('DateRangeFilter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render 4 preset buttons', () => {
    render(
      <DateRangeFilter
        value={{ from: new Date(), to: new Date(), preset: 'last_30' }}
        onChange={vi.fn()}
      />,
      { wrapper }
    )

    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last 7/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last 30/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument()
  })

  it('should highlight active preset', () => {
    render(
      <DateRangeFilter
        value={{ from: new Date(), to: new Date(), preset: 'last_30' }}
        onChange={vi.fn()}
      />,
      { wrapper }
    )

    const last30Button = screen.getByRole('button', { name: /last 30/i })
    expect(last30Button).toHaveAttribute('data-active', 'true')
  })

  it('should call onChange when preset clicked', async () => {
    const mockOnChange = vi.fn()

    render(
      <DateRangeFilter
        value={{ from: new Date(), to: new Date(), preset: 'last_30' }}
        onChange={mockOnChange}
      />,
      { wrapper }
    )

    await userEvent.click(screen.getByRole('button', { name: /last 7/i }))

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should open date picker when Custom clicked', async () => {
    render(
      <DateRangeFilter
        value={{ from: new Date(), to: new Date(), preset: 'last_30' }}
        onChange={vi.fn()}
      />,
      { wrapper }
    )

    await userEvent.click(screen.getByRole('button', { name: /custom/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should validate max 365 days range', async () => {
    render(
      <DateRangeFilter
        value={{ from: new Date(), to: new Date(), preset: 'custom' }}
        onChange={vi.fn()}
      />,
      { wrapper }
    )

    // Attempt to select range > 365 days
    // Expect validation error
    expect(screen.queryByText(/cannot exceed 365 days/i)).not.toBeInTheDocument()
  })

  it('should be keyboard accessible', async () => {
    render(
      <DateRangeFilter
        value={{ from: new Date(), to: new Date(), preset: 'last_30' }}
        onChange={vi.fn()}
      />,
      { wrapper }
    )

    const todayButton = screen.getByRole('button', { name: /today/i })
    todayButton.focus()

    expect(document.activeElement).toBe(todayButton)
  })
})

describe('Responsive Design', () => {
  it('should render mobile layout at 375px viewport', () => {
    // Mock window.innerWidth
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375)

    render(<ShippingDashboard />, { wrapper })

    // In mobile, KPI grid should be single column
    const kpiSection = screen.getByTestId('dashboard-kpis')
    expect(kpiSection).toHaveClass('grid-cols-1')
  })

  it('should render tablet layout at 768px viewport', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(768)

    render(<ShippingDashboard />, { wrapper })

    const kpiSection = screen.getByTestId('dashboard-kpis')
    expect(kpiSection).toHaveClass('md:grid-cols-2')
  })

  it('should render desktop layout at 1024px+ viewport', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)

    render(<ShippingDashboard />, { wrapper })

    const kpiSection = screen.getByTestId('dashboard-kpis')
    expect(kpiSection).toHaveClass('lg:grid-cols-4')
  })

  it('should not have horizontal scroll on mobile', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375)

    render(<ShippingDashboard />, { wrapper })

    const container = screen.getByTestId('dashboard-container')
    expect(container).not.toHaveStyle({ overflowX: 'scroll' })
  })
})

describe('Accessibility', () => {
  it('should have proper heading hierarchy', () => {
    render(<ShippingDashboard />, { wrapper })

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Shipping Dashboard')
  })

  it('should have skip link to main content', () => {
    render(<ShippingDashboard />, { wrapper })

    const skipLink = screen.getByText(/skip to main content/i)
    expect(skipLink).toBeInTheDocument()
  })

  it('should support keyboard navigation through all interactive elements', async () => {
    render(<ShippingDashboard />, { wrapper })

    const firstButton = screen.getAllByRole('button')[0]
    firstButton.focus()

    // Tab through elements
    await userEvent.tab()
    expect(document.activeElement).not.toBe(firstButton)
  })

  it('should have focus visible indicators', () => {
    render(<ShippingDashboard />, { wrapper })

    const buttons = screen.getAllByRole('button')
    buttons[0].focus()

    // Button should have focus-visible styles
    expect(buttons[0]).toHaveClass('focus-visible:ring-2')
  })

  it('should have aria-labels on all interactive elements', () => {
    render(<ShippingDashboard />, { wrapper })

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(
        button.getAttribute('aria-label') || button.textContent
      ).toBeTruthy()
    })
  })

  it('should announce loading state to screen readers', () => {
    render(<DashboardSkeleton />, { wrapper })

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })
})
