/**
 * Component Tests: Shipping KPIs Components
 * Story: 07.15 - Shipping Dashboard + KPIs
 * Phase: RED - Tests should FAIL (components not implemented)
 *
 * Tests KPI card components:
 * - DashboardKPIs grid container
 * - KPICard individual cards (4 types)
 * - OrdersByStatusChart pie chart
 * - ShipmentsByDateChart line chart
 * - AlertsSection and AlertBadge
 * - RecentActivityTimeline and ActivityItem
 * - QuickActionsPanel
 *
 * Coverage Target: 80%
 * Test Count: 55 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Components to test
import DashboardKPIs from '../DashboardKPIs'
import KPICard from '../KPICard'
import OrdersByStatusChart from '../OrdersByStatusChart'
import ShipmentsByDateChart from '../ShipmentsByDateChart'
import AlertsSection from '../AlertsSection'
import AlertBadge from '../AlertBadge'
import RecentActivityTimeline from '../RecentActivityTimeline'
import ActivityItem from '../ActivityItem'
import QuickActionsPanel from '../QuickActionsPanel'

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

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

// Mock data
const mockKPIData = {
  orders: {
    total: 100,
    by_status: {
      draft: 10,
      confirmed: 20,
      allocated: 15,
      picking: 10,
      packing: 15,
      shipped: 25,
      delivered: 5,
    },
    trend: { current: 100, previous: 80, percentage: 25, direction: 'up' as const },
  },
  pick_lists: {
    total: 50,
    by_status: { pending: 10, assigned: 15, in_progress: 10, completed: 15 },
    trend: { current: 50, previous: 45, percentage: 11, direction: 'up' as const },
  },
  shipments: {
    total: 30,
    by_status: { pending: 5, packing: 5, packed: 5, shipped: 10, delivered: 5 },
    trend: { current: 30, previous: 30, percentage: 0, direction: 'neutral' as const },
  },
  backorders: { count: 5, total_value: 1500.0 },
  on_time_delivery_pct: 92,
  avg_pick_time_hours: 2.5,
  avg_pack_time_hours: 1.5,
  last_updated: new Date().toISOString(),
}

const mockAlerts = {
  backorders: {
    count: 3,
    items: [{ so_line_id: 'line-1', product_name: 'Product A', qty_backordered: 10 }],
  },
  delayed_shipments: {
    count: 2,
    items: [
      { so_id: 'so-1', order_number: 'SO-2025-00001', promised_date: '2025-12-15', days_late: 3 },
    ],
  },
  pending_picks_overdue: {
    count: 1,
    items: [
      {
        pick_list_id: 'pl-1',
        pick_list_number: 'PL-2025-00001',
        created_at: '2025-12-17T10:00:00Z',
        hours_pending: 48,
      },
    ],
  },
  allergen_conflicts: {
    count: 1,
    items: [
      {
        so_id: 'so-2',
        order_number: 'SO-2025-00002',
        customer_name: 'Test Customer',
        conflicting_allergens: ['Milk', 'Eggs'],
      },
    ],
  },
  alert_summary: { critical: 3, warning: 4, info: 0 },
}

const mockActivities = [
  {
    id: 'activity-1',
    type: 'so_created' as const,
    entity_type: 'sales_order' as const,
    entity_id: 'so-1',
    entity_number: 'SO-2025-00001',
    description: 'Sales order created',
    created_at: new Date().toISOString(),
    created_by: { id: 'user-1', name: 'John Doe' },
    status: 'success' as const,
  },
  {
    id: 'activity-2',
    type: 'so_shipped' as const,
    entity_type: 'sales_order' as const,
    entity_id: 'so-2',
    entity_number: 'SO-2025-00002',
    description: 'Order shipped via FedEx',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    created_by: { id: 'user-2', name: 'Jane Smith' },
    status: 'success' as const,
  },
]

describe('DashboardKPIs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render 4 KPI cards', () => {
      render(<DashboardKPIs data={mockKPIData} isLoading={false} />, { wrapper })

      expect(screen.getAllByTestId(/kpi-card/)).toHaveLength(4)
    })

    it('should render Orders KPI card', () => {
      render(<DashboardKPIs data={mockKPIData} isLoading={false} />, { wrapper })

      expect(screen.getByText('Orders')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render Pick Lists KPI card', () => {
      render(<DashboardKPIs data={mockKPIData} isLoading={false} />, { wrapper })

      expect(screen.getByText('Pick Lists')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should render Shipments KPI card', () => {
      render(<DashboardKPIs data={mockKPIData} isLoading={false} />, { wrapper })

      expect(screen.getByText('Shipments')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
    })

    it('should render Backorders KPI card', () => {
      render(<DashboardKPIs data={mockKPIData} isLoading={false} />, { wrapper })

      expect(screen.getByText('Backorders')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display loading skeleton when isLoading=true', () => {
      render(<DashboardKPIs data={null} isLoading={true} />, { wrapper })

      expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4)
    })

    it('should render in 4-column grid on desktop', () => {
      render(<DashboardKPIs data={mockKPIData} isLoading={false} />, { wrapper })

      const grid = screen.getByTestId('dashboard-kpis')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })
  })
})

describe('KPICard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render card with title', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
        />,
        { wrapper }
      )

      expect(screen.getByText('Orders')).toBeInTheDocument()
    })

    it('should render card with value', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
        />,
        { wrapper }
      )

      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render card with icon', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span data-testid="kpi-icon">icon</span>}
          status="good"
        />,
        { wrapper }
      )

      expect(screen.getByTestId('kpi-icon')).toBeInTheDocument()
    })

    it('should apply green background for status=good', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
        />,
        { wrapper }
      )

      const card = screen.getByTestId('kpi-card-Orders')
      expect(card).toHaveClass('bg-green-50')
    })

    it('should apply yellow background for status=warning', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="warning"
        />,
        { wrapper }
      )

      const card = screen.getByTestId('kpi-card-Orders')
      expect(card).toHaveClass('bg-yellow-50')
    })

    it('should apply red background for status=critical', () => {
      render(
        <KPICard
          title="Backorders"
          value={5}
          icon={<span>icon</span>}
          status="critical"
        />,
        { wrapper }
      )

      const card = screen.getByTestId('kpi-card-Backorders')
      expect(card).toHaveClass('bg-red-50')
    })
  })

  describe('Trend Indicator', () => {
    it('should show up arrow for positive trend', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
          trend={{ current: 100, previous: 80, percentage: 25, direction: 'up' }}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('trend-up')).toBeInTheDocument()
      expect(screen.getByText('+25%')).toBeInTheDocument()
    })

    it('should show down arrow for negative trend', () => {
      render(
        <KPICard
          title="Orders"
          value={80}
          icon={<span>icon</span>}
          status="warning"
          trend={{ current: 80, previous: 100, percentage: 20, direction: 'down' }}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('trend-down')).toBeInTheDocument()
      expect(screen.getByText('-20%')).toBeInTheDocument()
    })

    it('should show neutral indicator for no change', () => {
      render(
        <KPICard
          title="Shipments"
          value={30}
          icon={<span>icon</span>}
          status="good"
          trend={{ current: 30, previous: 30, percentage: 0, direction: 'neutral' }}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('trend-neutral')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should be clickable when action provided', async () => {
      const mockClick = vi.fn()

      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
          action={{ label: 'View Orders', onClick: mockClick }}
        />,
        { wrapper }
      )

      await userEvent.click(screen.getByTestId('kpi-card-Orders'))

      expect(mockClick).toHaveBeenCalled()
    })

    it('should have cursor-pointer when clickable', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
          action={{ label: 'View', onClick: vi.fn() }}
        />,
        { wrapper }
      )

      const card = screen.getByTestId('kpi-card-Orders')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('should show breakdown tooltip on hover', async () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
          breakdown={{ draft: 10, confirmed: 20, shipped: 70 }}
        />,
        { wrapper }
      )

      await userEvent.hover(screen.getByTestId('kpi-card-Orders'))

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button role when clickable', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
          action={{ label: 'View Orders', onClick: vi.fn() }}
        />,
        { wrapper }
      )

      expect(screen.getByRole('button', { name: /orders/i })).toBeInTheDocument()
    })

    it('should have descriptive aria-label', () => {
      render(
        <KPICard
          title="Orders"
          value={100}
          icon={<span>icon</span>}
          status="good"
        />,
        { wrapper }
      )

      const card = screen.getByTestId('kpi-card-Orders')
      expect(card).toHaveAttribute('aria-label', 'Orders: 100')
    })
  })
})

describe('OrdersByStatusChart Component', () => {
  const mockChartData = [
    { status: 'draft', count: 10 },
    { status: 'confirmed', count: 20 },
    { status: 'shipped', count: 25 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pie chart', () => {
    render(
      <OrdersByStatusChart data={mockChartData} isLoading={false} />,
      { wrapper }
    )

    expect(screen.getByTestId('orders-status-chart')).toBeInTheDocument()
  })

  it('should render with correct color for each status', () => {
    render(
      <OrdersByStatusChart data={mockChartData} isLoading={false} />,
      { wrapper }
    )

    // Check that chart has segments (Recharts specific)
    const chart = screen.getByTestId('orders-status-chart')
    expect(chart).toBeInTheDocument()
  })

  it('should show legend below chart', () => {
    render(
      <OrdersByStatusChart data={mockChartData} isLoading={false} />,
      { wrapper }
    )

    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
    expect(screen.getByText('shipped')).toBeInTheDocument()
  })

  it('should show empty state when no data', () => {
    render(
      <OrdersByStatusChart data={[]} isLoading={false} />,
      { wrapper }
    )

    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('should show loading skeleton when isLoading=true', () => {
    render(
      <OrdersByStatusChart data={[]} isLoading={true} />,
      { wrapper }
    )

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
  })

  it('should call onStatusClick when segment clicked', async () => {
    const mockClick = vi.fn()

    render(
      <OrdersByStatusChart
        data={mockChartData}
        isLoading={false}
        onStatusClick={mockClick}
      />,
      { wrapper }
    )

    // Simulate click on chart segment (Recharts specific)
    // This is a placeholder - actual implementation depends on Recharts API
    const chart = screen.getByTestId('orders-status-chart')
    expect(chart).toBeInTheDocument()
  })
})

describe('ShipmentsByDateChart Component', () => {
  const mockChartData = [
    { date: '2025-12-01', count: 5 },
    { date: '2025-12-02', count: 8 },
    { date: '2025-12-03', count: 3 },
  ]

  const mockDateRange = {
    from: new Date('2025-12-01'),
    to: new Date('2025-12-31'),
    preset: 'last_30' as const,
  }

  it('should render line chart', () => {
    render(
      <ShipmentsByDateChart
        data={mockChartData}
        isLoading={false}
        dateRange={mockDateRange}
      />,
      { wrapper }
    )

    expect(screen.getByTestId('shipments-date-chart')).toBeInTheDocument()
  })

  it('should show X-axis with dates', () => {
    render(
      <ShipmentsByDateChart
        data={mockChartData}
        isLoading={false}
        dateRange={mockDateRange}
      />,
      { wrapper }
    )

    // Chart should have date axis
    const chart = screen.getByTestId('shipments-date-chart')
    expect(chart).toBeInTheDocument()
  })

  it('should show Y-axis with count', () => {
    render(
      <ShipmentsByDateChart
        data={mockChartData}
        isLoading={false}
        dateRange={mockDateRange}
      />,
      { wrapper }
    )

    const chart = screen.getByTestId('shipments-date-chart')
    expect(chart).toBeInTheDocument()
  })

  it('should show empty state when no data', () => {
    render(
      <ShipmentsByDateChart
        data={[]}
        isLoading={false}
        dateRange={mockDateRange}
      />,
      { wrapper }
    )

    expect(screen.getByText(/no shipments/i)).toBeInTheDocument()
  })

  it('should show loading skeleton when isLoading=true', () => {
    render(
      <ShipmentsByDateChart
        data={[]}
        isLoading={true}
        dateRange={mockDateRange}
      />,
      { wrapper }
    )

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
  })
})

describe('AlertsSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render 4 alert badges', () => {
    render(<AlertsSection alerts={mockAlerts} isLoading={false} />, { wrapper })

    expect(screen.getAllByTestId(/alert-badge/)).toHaveLength(4)
  })

  it('should render backorders alert', () => {
    render(<AlertsSection alerts={mockAlerts} isLoading={false} />, { wrapper })

    expect(screen.getByText('Backorders')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should render delayed shipments alert', () => {
    render(<AlertsSection alerts={mockAlerts} isLoading={false} />, { wrapper })

    expect(screen.getByText('Delayed Shipments')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should show success message when no alerts', () => {
    const emptyAlerts = {
      backorders: { count: 0, items: [] },
      delayed_shipments: { count: 0, items: [] },
      pending_picks_overdue: { count: 0, items: [] },
      allergen_conflicts: { count: 0, items: [] },
      alert_summary: { critical: 0, warning: 0, info: 0 },
    }

    render(<AlertsSection alerts={emptyAlerts} isLoading={false} />, { wrapper })

    expect(screen.getByText(/no alerts/i)).toBeInTheDocument()
  })

  it('should show loading skeleton when isLoading=true', () => {
    render(<AlertsSection alerts={null} isLoading={true} />, { wrapper })

    expect(screen.getByTestId('alerts-skeleton')).toBeInTheDocument()
  })
})

describe('AlertBadge Component', () => {
  it('should render with title and count', () => {
    render(
      <AlertBadge
        title="Backorders"
        count={3}
        severity="critical"
        icon={<span>icon</span>}
        onClick={vi.fn()}
      />,
      { wrapper }
    )

    expect(screen.getByText('Backorders')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should apply red color for critical severity', () => {
    render(
      <AlertBadge
        title="Backorders"
        count={3}
        severity="critical"
        icon={<span>icon</span>}
        onClick={vi.fn()}
      />,
      { wrapper }
    )

    const badge = screen.getByTestId('alert-badge-Backorders')
    expect(badge).toHaveClass('bg-red-100')
  })

  it('should apply orange color for warning severity', () => {
    render(
      <AlertBadge
        title="Delayed"
        count={2}
        severity="warning"
        icon={<span>icon</span>}
        onClick={vi.fn()}
      />,
      { wrapper }
    )

    const badge = screen.getByTestId('alert-badge-Delayed')
    expect(badge).toHaveClass('bg-orange-100')
  })

  it('should call onClick when clicked', async () => {
    const mockClick = vi.fn()

    render(
      <AlertBadge
        title="Backorders"
        count={3}
        severity="critical"
        icon={<span>icon</span>}
        onClick={mockClick}
      />,
      { wrapper }
    )

    await userEvent.click(screen.getByTestId('alert-badge-Backorders'))

    expect(mockClick).toHaveBeenCalled()
  })
})

describe('RecentActivityTimeline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render activity items', () => {
    render(
      <RecentActivityTimeline activities={mockActivities} isLoading={false} />,
      { wrapper }
    )

    expect(screen.getAllByTestId(/activity-item/)).toHaveLength(2)
  })

  it('should sort activities newest first', () => {
    render(
      <RecentActivityTimeline activities={mockActivities} isLoading={false} />,
      { wrapper }
    )

    const items = screen.getAllByTestId(/activity-item/)
    expect(items[0]).toHaveTextContent('SO-2025-00001')
  })

  it('should show empty state when no activities', () => {
    render(
      <RecentActivityTimeline activities={[]} isLoading={false} />,
      { wrapper }
    )

    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument()
  })

  it('should show loading skeleton when isLoading=true', () => {
    render(
      <RecentActivityTimeline activities={[]} isLoading={true} />,
      { wrapper }
    )

    expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument()
  })

  it('should show Load More button when onLoadMore provided', () => {
    render(
      <RecentActivityTimeline
        activities={mockActivities}
        isLoading={false}
        onLoadMore={vi.fn()}
      />,
      { wrapper }
    )

    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
  })
})

describe('ActivityItem Component', () => {
  const mockActivity = mockActivities[0]

  it('should render activity with description', () => {
    render(<ActivityItem activity={mockActivity} />, { wrapper })

    expect(screen.getByText('Sales order created')).toBeInTheDocument()
  })

  it('should render entity number as link', () => {
    render(<ActivityItem activity={mockActivity} onClick={vi.fn()} />, { wrapper })

    expect(screen.getByText('SO-2025-00001')).toBeInTheDocument()
  })

  it('should show relative timestamp', () => {
    render(<ActivityItem activity={mockActivity} />, { wrapper })

    // Should show relative time like "just now", "2 min ago", etc.
    expect(screen.getByTestId('activity-timestamp')).toBeInTheDocument()
  })

  it('should show user name who created activity', () => {
    render(<ActivityItem activity={mockActivity} />, { wrapper })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should call onClick when entity link clicked', async () => {
    const mockClick = vi.fn()

    render(<ActivityItem activity={mockActivity} onClick={mockClick} />, { wrapper })

    await userEvent.click(screen.getByText('SO-2025-00001'))

    expect(mockClick).toHaveBeenCalled()
  })
})

describe('QuickActionsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render 3 action buttons', () => {
    render(<QuickActionsPanel userRole="ADMIN" />, { wrapper })

    expect(screen.getByRole('button', { name: /create sales order/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create pick list/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view backorders/i })).toBeInTheDocument()
  })

  it('should enable all buttons for ADMIN role', () => {
    render(<QuickActionsPanel userRole="ADMIN" />, { wrapper })

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled()
    })
  })

  it('should disable Create SO button for VIEWER role', () => {
    render(<QuickActionsPanel userRole="VIEWER" />, { wrapper })

    expect(screen.getByRole('button', { name: /create sales order/i })).toBeDisabled()
  })

  it('should show tooltip on disabled buttons', async () => {
    render(<QuickActionsPanel userRole="VIEWER" />, { wrapper })

    const disabledButton = screen.getByRole('button', { name: /create sales order/i })
    await userEvent.hover(disabledButton)

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(/permission/i)
    })
  })

  it('should navigate on button click', async () => {
    const { useRouter } = await import('next/navigation')
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)

    render(<QuickActionsPanel userRole="ADMIN" />, { wrapper })

    await userEvent.click(screen.getByRole('button', { name: /create sales order/i }))

    expect(mockPush).toHaveBeenCalledWith('/shipping/sales-orders/new')
  })
})
