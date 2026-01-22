/**
 * Component Tests: CustomerDataTable (Story 07.1)
 * Phase: RED - All tests should FAIL (no implementation exists)
 *
 * Tests the CustomerDataTable component:
 * - Displays customer list with columns
 * - Sorting on column headers
 * - Row click navigation
 * - Status badges (active/inactive)
 * - Category badges
 * - Empty state
 * - Loading state
 *
 * Wireframe: SHIP-001
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// @ts-expect-error - Component does not exist yet
import { CustomerDataTable } from '@/components/shipping/customers/CustomerDataTable'

// Mock data
const mockCustomers = [
  {
    id: 'cust-1',
    customer_code: 'ACME001',
    name: 'ACME Corporation',
    category: 'wholesale',
    email: 'info@acme.com',
    phone: '+1-555-0100',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'cust-2',
    customer_code: 'BESTCO',
    name: 'Best Company Ltd',
    category: 'retail',
    email: 'sales@bestco.com',
    phone: '+1-555-0200',
    is_active: true,
    created_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'cust-3',
    customer_code: 'TESTINC',
    name: 'Test Inc',
    category: 'distributor',
    email: null,
    phone: null,
    is_active: false,
    created_at: '2025-01-03T00:00:00Z',
  },
]

describe('CustomerDataTable Component (Story 07.1)', () => {
  const mockOnRowClick = vi.fn()
  const mockOnSort = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // COLUMN DISPLAY
  // ===========================================================================

  describe('Column Display', () => {
    it('should display customer_code column', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('columnheader', { name: /code/i })).toBeInTheDocument()
      expect(screen.getByText('ACME001')).toBeInTheDocument()
    })

    it('should display name column', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
      expect(screen.getByText('ACME Corporation')).toBeInTheDocument()
    })

    it('should display category column with badge', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('columnheader', { name: /category/i })).toBeInTheDocument()
      expect(screen.getByTestId('category-badge-wholesale')).toBeInTheDocument()
      expect(screen.getByTestId('category-badge-retail')).toBeInTheDocument()
      expect(screen.getByTestId('category-badge-distributor')).toBeInTheDocument()
    })

    it('should display email column', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument()
      expect(screen.getByText('info@acme.com')).toBeInTheDocument()
    })

    it('should display phone column', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('columnheader', { name: /phone/i })).toBeInTheDocument()
      expect(screen.getByText('+1-555-0100')).toBeInTheDocument()
    })

    it('should display status column with active/inactive badge', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
      expect(screen.getAllByTestId('status-badge-active')).toHaveLength(2)
      expect(screen.getByTestId('status-badge-inactive')).toBeInTheDocument()
    })

    it('should handle null email/phone gracefully', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      // Third customer has null email/phone - should show dash or empty
      const rows = screen.getAllByTestId('customer-row')
      const thirdRow = rows[2]

      // Should not throw error, should render something (dash, empty, N/A)
      expect(thirdRow).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SORTING
  // ===========================================================================

  describe('Sorting', () => {
    it('should call onSort when clicking Code header', async () => {
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      await user.click(screen.getByRole('columnheader', { name: /code/i }))

      expect(mockOnSort).toHaveBeenCalledWith('customer_code', 'asc')
    })

    it('should toggle sort direction on second click', async () => {
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
          sortBy="customer_code"
          sortOrder="asc"
        />
      )

      await user.click(screen.getByRole('columnheader', { name: /code/i }))

      expect(mockOnSort).toHaveBeenCalledWith('customer_code', 'desc')
    })

    it('should call onSort when clicking Name header', async () => {
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      await user.click(screen.getByRole('columnheader', { name: /name/i }))

      expect(mockOnSort).toHaveBeenCalledWith('name', 'asc')
    })

    it('should show sort indicator on sorted column', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
          sortBy="name"
          sortOrder="asc"
        />
      )

      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      expect(within(nameHeader).getByTestId('sort-indicator-asc')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ROW INTERACTION
  // ===========================================================================

  describe('Row Interaction', () => {
    it('should call onRowClick with customer id when row clicked', async () => {
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      await user.click(screen.getAllByTestId('customer-row')[0])

      expect(mockOnRowClick).toHaveBeenCalledWith('cust-1')
    })

    it('should show hover state on row', async () => {
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const row = screen.getAllByTestId('customer-row')[0]
      await user.hover(row)

      expect(row).toHaveClass('hover:bg-muted')
    })

    it('should have cursor pointer on rows', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const row = screen.getAllByTestId('customer-row')[0]
      expect(row).toHaveClass('cursor-pointer')
    })
  })

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(
        <CustomerDataTable
          data={[]}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByTestId('customers-empty')).toBeInTheDocument()
      expect(screen.getByText(/no customers yet/i)).toBeInTheDocument()
    })

    it('should show Create Customer button in empty state', () => {
      render(
        <CustomerDataTable
          data={[]}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('button', { name: /create customer/i })).toBeInTheDocument()
    })

    it('should call onCreate when Create button clicked', async () => {
      const mockOnCreate = vi.fn()
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={[]}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
          onCreate={mockOnCreate}
        />
      )

      await user.click(screen.getByRole('button', { name: /create customer/i }))

      expect(mockOnCreate).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe('Loading State', () => {
    it('should show loading spinner when isLoading=true', () => {
      render(
        <CustomerDataTable
          data={[]}
          isLoading={true}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should show skeleton rows when loading', () => {
      render(
        <CustomerDataTable
          data={[]}
          isLoading={true}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5) // Default skeleton count
    })

    it('should hide table content when loading', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={true}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      // Data rows should not be visible during loading
      expect(screen.queryByText('ACME001')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // STATUS BADGES
  // ===========================================================================

  describe('Status Badges', () => {
    it('should render green badge for active customers', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const activeBadges = screen.getAllByTestId('status-badge-active')
      activeBadges.forEach((badge) => {
        expect(badge).toHaveClass('bg-green')
      })
    })

    it('should render gray badge for inactive customers', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const inactiveBadge = screen.getByTestId('status-badge-inactive')
      expect(inactiveBadge).toHaveClass('bg-gray')
    })
  })

  // ===========================================================================
  // CATEGORY BADGES
  // ===========================================================================

  describe('Category Badges', () => {
    it('should render wholesale badge correctly', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const wholesaleBadge = screen.getByTestId('category-badge-wholesale')
      expect(wholesaleBadge).toHaveTextContent('wholesale')
    })

    it('should render retail badge correctly', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const retailBadge = screen.getByTestId('category-badge-retail')
      expect(retailBadge).toHaveTextContent('retail')
    })

    it('should render distributor badge correctly', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const distributorBadge = screen.getByTestId('category-badge-distributor')
      expect(distributorBadge).toHaveTextContent('distributor')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper table role', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have proper row roles', () => {
      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1) // Header + data rows
    })

    it('should have keyboard navigable rows', async () => {
      const user = userEvent.setup()

      render(
        <CustomerDataTable
          data={mockCustomers}
          isLoading={false}
          onRowClick={mockOnRowClick}
          onSort={mockOnSort}
        />
      )

      const firstRow = screen.getAllByTestId('customer-row')[0]
      firstRow.focus()

      await user.keyboard('{Enter}')

      expect(mockOnRowClick).toHaveBeenCalledWith('cust-1')
    })
  })
})

/**
 * Test Coverage Summary for Story 07.1 - CustomerDataTable
 * =========================================================
 *
 * Column Display: 7 tests
 *   - customer_code column
 *   - name column
 *   - category column with badge
 *   - email column
 *   - phone column
 *   - status column
 *   - null values handling
 *
 * Sorting: 4 tests
 *   - Click Code header
 *   - Toggle sort direction
 *   - Click Name header
 *   - Sort indicator
 *
 * Row Interaction: 3 tests
 *   - onClick with id
 *   - Hover state
 *   - Cursor pointer
 *
 * Empty State: 3 tests
 *   - Show empty message
 *   - Create button
 *   - onCreate callback
 *
 * Loading State: 3 tests
 *   - Spinner
 *   - Skeleton rows
 *   - Hide content
 *
 * Status Badges: 2 tests
 *   - Active (green)
 *   - Inactive (gray)
 *
 * Category Badges: 3 tests
 *   - Wholesale
 *   - Retail
 *   - Distributor
 *
 * Accessibility: 3 tests
 *   - Table role
 *   - Row roles
 *   - Keyboard navigation
 *
 * Total: 28 tests
 * Status: ALL FAIL (RED phase - no implementation)
 */
