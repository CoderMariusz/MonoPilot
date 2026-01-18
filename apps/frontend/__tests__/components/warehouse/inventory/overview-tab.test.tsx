/**
 * Inventory Overview Tab Tests
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Tests for:
 * - InventoryGroupingToggle
 * - InventoryOverviewFilters
 * - InventoryOverviewTable
 * - InventoryOverviewSummary
 * - InventoryOverviewTab
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Components
import { InventoryGroupingToggle, InventoryGroupingToggleMobile } from '@/components/warehouse/inventory/InventoryGroupingToggle'
import { InventoryOverviewFilters } from '@/components/warehouse/inventory/InventoryOverviewFilters'
import { InventoryOverviewTable } from '@/components/warehouse/inventory/InventoryOverviewTable'
import { InventoryOverviewSummary } from '@/components/warehouse/inventory/InventoryOverviewSummary'

// Types
import type {
  InventoryGroupBy,
  InventoryFilters,
  InventoryByProduct,
  InventoryByLocation,
  InventoryByWarehouse,
  InventoryPagination,
  InventorySummary,
} from '@/lib/types/inventory-overview'
import type { Warehouse } from '@/lib/types/warehouse'
import type { Location } from '@/lib/types/location'

// =============================================================================
// Test Setup
// =============================================================================

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
)

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/warehouse/inventory',
}))

// Mock media query hook
vi.mock('@/lib/hooks/use-media-query', () => ({
  useMediaQuery: () => false,
}))

// =============================================================================
// Test Data
// =============================================================================

const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-1',
    org_id: 'org-1',
    code: 'WH-01',
    name: 'Main Warehouse',
    type: 'GENERAL',
    address: '123 Main St',
    contact_email: 'wh@example.com',
    contact_phone: '555-1234',
    is_default: true,
    is_active: true,
    location_count: 10,
    disabled_at: null,
    disabled_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  },
  {
    id: 'wh-2',
    org_id: 'org-1',
    code: 'WH-02',
    name: 'Cold Storage',
    type: 'RAW_MATERIALS',
    address: '456 Cold Ave',
    contact_email: null,
    contact_phone: null,
    is_default: false,
    is_active: true,
    location_count: 5,
    disabled_at: null,
    disabled_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  },
]

const mockLocations: Location[] = [
  {
    id: 'loc-1',
    org_id: 'org-1',
    warehouse_id: 'wh-1',
    parent_id: null,
    code: 'A-01',
    name: 'Zone A',
    description: null,
    level: 'zone',
    full_path: 'A-01',
    depth: 0,
    location_type: 'bulk',
    max_pallets: 100,
    max_weight_kg: 10000,
    current_pallets: 50,
    current_weight_kg: 5000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  },
]

const mockFilters: InventoryFilters = {
  warehouse_id: undefined,
  location_id: undefined,
  product_id: undefined,
  status: 'available',
  date_from: undefined,
  date_to: undefined,
  search: '',
}

const mockProductData: InventoryByProduct[] = [
  {
    product_id: 'prod-1',
    product_name: 'Cocoa Mass',
    product_sku: 'RM-COCOA-001',
    available_qty: 180,
    reserved_qty: 75,
    blocked_qty: 30,
    total_qty: 285,
    lp_count: 12,
    locations_count: 3,
    avg_age_days: 45,
    total_value: 5700,
    uom: 'kg',
  },
  {
    product_id: 'prod-2',
    product_name: 'Sugar Fine',
    product_sku: 'RM-SUGAR-001',
    available_qty: 220,
    reserved_qty: 50,
    blocked_qty: 20,
    total_qty: 290,
    lp_count: 15,
    locations_count: 2,
    avg_age_days: 30,
    total_value: 4350,
    uom: 'kg',
  },
]

const mockLocationData: InventoryByLocation[] = [
  {
    location_id: 'loc-1',
    location_code: 'A-01-02',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main Warehouse',
    total_lps: 25,
    products_count: 8,
    total_qty: 1250,
    occupancy_pct: 75,
    total_value: 25000,
  },
]

const mockWarehouseData: InventoryByWarehouse[] = [
  {
    warehouse_id: 'wh-1',
    warehouse_name: 'Main Warehouse',
    total_lps: 150,
    products_count: 45,
    locations_count: 25,
    total_value: 150000,
    expiring_soon: 5,
    expired: 2,
  },
]

const mockPagination: InventoryPagination = {
  page: 1,
  limit: 50,
  total: 45,
  pages: 1,
}

const mockSummary: InventorySummary = {
  total_lps: 8452,
  total_qty: 547500,
  total_value: 1245670,
}

// =============================================================================
// InventoryGroupingToggle Tests
// =============================================================================

describe('InventoryGroupingToggle', () => {
  it('renders all three grouping options', () => {
    const onChange = vi.fn()
    render(<InventoryGroupingToggle value="product" onChange={onChange} />)

    expect(screen.getByText('By Product')).toBeInTheDocument()
    expect(screen.getByText('By Location')).toBeInTheDocument()
    expect(screen.getByText('By Warehouse')).toBeInTheDocument()
  })

  it('highlights the selected option', () => {
    const onChange = vi.fn()
    render(<InventoryGroupingToggle value="location" onChange={onChange} />)

    // The selected option should have primary styling
    const locationLabel = screen.getByText('By Location')
    expect(locationLabel.closest('label')).toHaveClass('text-primary')
  })

  it('calls onChange when a different option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InventoryGroupingToggle value="product" onChange={onChange} />)

    await user.click(screen.getByText('By Warehouse'))

    expect(onChange).toHaveBeenCalledWith('warehouse')
  })

  it('renders skeleton when loading', () => {
    const onChange = vi.fn()
    render(<InventoryGroupingToggle value="product" onChange={onChange} isLoading={true} />)

    expect(screen.getByTestId('grouping-toggle-skeleton')).toBeInTheDocument()
  })

  it('disables interaction when disabled prop is true', () => {
    const onChange = vi.fn()
    render(<InventoryGroupingToggle value="product" onChange={onChange} disabled={true} />)

    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toHaveAttribute('data-disabled')
  })
})

describe('InventoryGroupingToggleMobile', () => {
  it('renders as a select dropdown', () => {
    const onChange = vi.fn()
    render(<InventoryGroupingToggleMobile value="product" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

// =============================================================================
// InventoryOverviewFilters Tests
// =============================================================================

describe('InventoryOverviewFilters', () => {
  it('renders all filter controls', () => {
    const onFiltersChange = vi.fn()
    const onClearAll = vi.fn()

    render(
      <InventoryOverviewFilters
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        onClearAll={onClearAll}
        warehouses={mockWarehouses}
        locations={mockLocations}
      />
    )

    expect(screen.getByTestId('filter-warehouse')).toBeInTheDocument()
    expect(screen.getByTestId('filter-location')).toBeInTheDocument()
    expect(screen.getByTestId('filter-status')).toBeInTheDocument()
    expect(screen.getByTestId('filter-search')).toBeInTheDocument()
  })

  it('calls onFiltersChange when warehouse is selected', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    const onClearAll = vi.fn()

    render(
      <InventoryOverviewFilters
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        onClearAll={onClearAll}
        warehouses={mockWarehouses}
        locations={mockLocations}
      />
    )

    await user.click(screen.getByTestId('filter-warehouse'))
    await user.click(screen.getByText('Main Warehouse'))

    expect(onFiltersChange).toHaveBeenCalledWith({
      warehouse_id: 'wh-1',
      location_id: undefined,
    })
  })

  it('calls onFiltersChange with debounce when search input changes', async () => {
    const onFiltersChange = vi.fn()
    const onClearAll = vi.fn()

    render(
      <InventoryOverviewFilters
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        onClearAll={onClearAll}
        warehouses={mockWarehouses}
        locations={mockLocations}
      />
    )

    const searchInput = screen.getByTestId('filter-search')
    fireEvent.change(searchInput, { target: { value: 'cocoa' } })

    // Wait for debounce
    await waitFor(
      () => {
        expect(onFiltersChange).toHaveBeenCalledWith({ search: 'cocoa' })
      },
      { timeout: 500 }
    )
  })

  it('calls onClearAll when Clear All button is clicked', async () => {
    const onFiltersChange = vi.fn()
    const onClearAll = vi.fn()

    render(
      <InventoryOverviewFilters
        filters={{ ...mockFilters, warehouse_id: 'wh-1' }}
        onFiltersChange={onFiltersChange}
        onClearAll={onClearAll}
        warehouses={mockWarehouses}
        locations={mockLocations}
      />
    )

    const clearButton = screen.getByTestId('clear-filters')
    fireEvent.click(clearButton)

    expect(onClearAll).toHaveBeenCalled()
  })

  it('disables location dropdown when no warehouse is selected', () => {
    const onFiltersChange = vi.fn()
    const onClearAll = vi.fn()

    render(
      <InventoryOverviewFilters
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        onClearAll={onClearAll}
        warehouses={mockWarehouses}
        locations={mockLocations}
      />
    )

    const locationTrigger = screen.getByTestId('filter-location')
    expect(locationTrigger).toHaveAttribute('data-disabled')
  })
})

// =============================================================================
// InventoryOverviewTable Tests
// =============================================================================

describe('InventoryOverviewTable', () => {
  const defaultProps = {
    pagination: mockPagination,
    onPageChange: vi.fn(),
    onSort: vi.fn(),
    sortColumn: null,
    sortDirection: 'desc' as const,
    isLoading: false,
  }

  describe('Product Grouping', () => {
    it('renders product table with correct columns', () => {
      render(
        <InventoryOverviewTable
          data={mockProductData}
          groupBy="product"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('inventory-table-product')).toBeInTheDocument()
      expect(screen.getByText('Product')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('Reserved')).toBeInTheDocument()
      expect(screen.getByText('Blocked')).toBeInTheDocument()
      expect(screen.getByText('LP Count')).toBeInTheDocument()
      expect(screen.getByText('Avg Age')).toBeInTheDocument()
      expect(screen.getByText('Value')).toBeInTheDocument()
    })

    it('renders product data correctly', () => {
      render(
        <InventoryOverviewTable
          data={mockProductData}
          groupBy="product"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByText('Cocoa Mass')).toBeInTheDocument()
      expect(screen.getByText('RM-COCOA-001')).toBeInTheDocument()
      expect(screen.getByText('Sugar Fine')).toBeInTheDocument()
    })

    it('shows percentage breakdown for quantities', () => {
      render(
        <InventoryOverviewTable
          data={mockProductData}
          groupBy="product"
          {...defaultProps}
        />,
        { wrapper }
      )

      // Available percentage for Cocoa Mass: 180/285 = 63%
      expect(screen.getByText('63%')).toBeInTheDocument()
    })
  })

  describe('Location Grouping', () => {
    it('renders location table with correct columns', () => {
      render(
        <InventoryOverviewTable
          data={mockLocationData}
          groupBy="location"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('inventory-table-location')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Warehouse')).toBeInTheDocument()
      expect(screen.getByText('Total LPs')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Occupancy')).toBeInTheDocument()
    })

    it('renders location data with progress bar for occupancy', () => {
      render(
        <InventoryOverviewTable
          data={mockLocationData}
          groupBy="location"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByText('A-01-02')).toBeInTheDocument()
      expect(screen.getByText('Main Warehouse')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  describe('Warehouse Grouping', () => {
    it('renders warehouse table with correct columns', () => {
      render(
        <InventoryOverviewTable
          data={mockWarehouseData}
          groupBy="warehouse"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('inventory-table-warehouse')).toBeInTheDocument()
      expect(screen.getByText('Warehouse')).toBeInTheDocument()
      expect(screen.getByText('Locations')).toBeInTheDocument()
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('renders expiring/expired badges correctly', () => {
      render(
        <InventoryOverviewTable
          data={mockWarehouseData}
          groupBy="warehouse"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByText('5')).toBeInTheDocument() // expiring soon
      expect(screen.getByText('2')).toBeInTheDocument() // expired
    })
  })

  describe('Pagination', () => {
    it('renders pagination controls', () => {
      render(
        <InventoryOverviewTable
          data={mockProductData}
          groupBy="product"
          {...defaultProps}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      // Check that the pagination container has expected content
      const pagination = screen.getByTestId('pagination')
      expect(pagination).toHaveTextContent(/Showing/)
      expect(pagination).toHaveTextContent(/items/)
    })

    it('calls onPageChange when page button is clicked', async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()

      render(
        <InventoryOverviewTable
          data={mockProductData}
          groupBy="product"
          {...defaultProps}
          pagination={{ ...mockPagination, pages: 5 }}
          onPageChange={onPageChange}
        />,
        { wrapper }
      )

      await user.click(screen.getByRole('button', { name: 'Page 2' }))

      expect(onPageChange).toHaveBeenCalledWith(2)
    })
  })

  describe('Sorting', () => {
    it('calls onSort when column header is clicked', async () => {
      const user = userEvent.setup()
      const onSort = vi.fn()

      render(
        <InventoryOverviewTable
          data={mockProductData}
          groupBy="product"
          {...defaultProps}
          onSort={onSort}
        />,
        { wrapper }
      )

      await user.click(screen.getByText('Product'))

      expect(onSort).toHaveBeenCalledWith('product_name')
    })
  })

  describe('Loading State', () => {
    it('renders skeleton when loading', () => {
      render(
        <InventoryOverviewTable
          data={[]}
          groupBy="product"
          {...defaultProps}
          isLoading={true}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// InventoryOverviewSummary Tests
// =============================================================================

describe('InventoryOverviewSummary', () => {
  const defaultProps = {
    summary: mockSummary,
    pagination: mockPagination,
    onExportCSV: vi.fn(),
    onExportExcel: vi.fn(),
    isExporting: false,
    isLoading: false,
  }

  it('renders summary statistics', () => {
    render(<InventoryOverviewSummary {...defaultProps} />)

    expect(screen.getByText(/8,452 LPs/)).toBeInTheDocument()
    expect(screen.getByText(/547,500 kg/)).toBeInTheDocument()
  })

  it('renders pagination info', () => {
    render(<InventoryOverviewSummary {...defaultProps} />)

    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    expect(screen.getByText('1-45')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('renders export buttons', () => {
    render(<InventoryOverviewSummary {...defaultProps} />)

    expect(screen.getByTestId('export-csv')).toBeInTheDocument()
    expect(screen.getByTestId('export-excel')).toBeInTheDocument()
  })

  it('calls onExportCSV when CSV button is clicked', async () => {
    const user = userEvent.setup()
    const onExportCSV = vi.fn()

    render(<InventoryOverviewSummary {...defaultProps} onExportCSV={onExportCSV} />)

    await user.click(screen.getByTestId('export-csv'))

    expect(onExportCSV).toHaveBeenCalled()
  })

  it('calls onExportExcel when Excel button is clicked', async () => {
    const user = userEvent.setup()
    const onExportExcel = vi.fn()

    render(<InventoryOverviewSummary {...defaultProps} onExportExcel={onExportExcel} />)

    await user.click(screen.getByTestId('export-excel'))

    expect(onExportExcel).toHaveBeenCalled()
  })

  it('disables export buttons when exporting', () => {
    render(<InventoryOverviewSummary {...defaultProps} isExporting={true} />)

    expect(screen.getByTestId('export-csv')).toBeDisabled()
    expect(screen.getByTestId('export-excel')).toBeDisabled()
  })

  it('disables export buttons when total is 0', () => {
    render(
      <InventoryOverviewSummary
        {...defaultProps}
        pagination={{ ...mockPagination, total: 0 }}
      />
    )

    expect(screen.getByTestId('export-csv')).toBeDisabled()
    expect(screen.getByTestId('export-excel')).toBeDisabled()
  })

  it('renders skeleton when loading', () => {
    render(<InventoryOverviewSummary {...defaultProps} isLoading={true} />)

    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
  })
})
