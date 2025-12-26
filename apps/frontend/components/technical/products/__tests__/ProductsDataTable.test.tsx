/**
 * ProductsDataTable Component Tests (Story 02.1 - TD-001)
 * Tests for products list data table with all 4 UI states
 *
 * Test Coverage:
 * - Loading state (skeleton)
 * - Empty state (no products)
 * - Error state (fetch failed)
 * - Success state (with data)
 * - Search functionality
 * - Type/status filtering
 * - Sorting
 * - Pagination
 * - Keyboard navigation
 * - Accessibility (WCAG 2.1 AA)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ProductsDataTable } from '../ProductsDataTable'
import type { Product } from '@/lib/types/product'

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    org_id: 'org-1',
    code: 'RM-001',
    name: 'Raw Material 1',
    description: 'Test raw material',
    product_type_id: 'type-rm',
    base_uom: 'kg',
    status: 'active',
    version: 1,
    barcode: '123456789',
    gtin: '12345678901234',
    category_id: 'cat-1',
    supplier_id: 'sup-1',
    lead_time_days: 7,
    moq: 100,
    std_price: 10.5,
    cost_per_unit: 8.0,
    min_stock: 50,
    max_stock: 500,
    expiry_policy: 'fixed',
    shelf_life_days: 365,
    storage_conditions: 'Cool, dry place',
    is_perishable: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  },
  {
    id: '2',
    org_id: 'org-1',
    code: 'FG-001',
    name: 'Finished Good 1',
    description: null,
    product_type_id: 'type-fg',
    base_uom: 'pcs',
    status: 'inactive',
    version: 2,
    barcode: null,
    gtin: null,
    category_id: null,
    supplier_id: null,
    lead_time_days: null,
    moq: null,
    std_price: 25.0,
    cost_per_unit: 15.0,
    min_stock: null,
    max_stock: null,
    expiry_policy: 'none',
    shelf_life_days: null,
    storage_conditions: null,
    is_perishable: false,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  },
]

describe('ProductsDataTable', () => {
  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      render(
        <ProductsDataTable
          products={[]}
          loading={true}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 0 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      // Should show loading indicator
      expect(screen.getByText(/loading products/i)).toBeInTheDocument()
      expect(screen.getByRole('status', { busy: true })).toBeInTheDocument()
    })

    it('should have aria-busy="true" during loading', () => {
      const { container } = render(
        <ProductsDataTable
          products={[]}
          loading={true}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 0 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const loadingElement = container.querySelector('[aria-busy="true"]')
      expect(loadingElement).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no products', () => {
      render(
        <ProductsDataTable
          products={[]}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 0 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      expect(screen.getByText(/no products found/i)).toBeInTheDocument()
      expect(
        screen.getByText(/you haven't created any products yet/i)
      ).toBeInTheDocument()
    })

    it('should show create CTA in empty state', () => {
      const onCreateClick = vi.fn()
      render(
        <ProductsDataTable
          products={[]}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={onCreateClick}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 0 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const createButton = screen.getByRole('button', {
        name: /create your first product/i,
      })
      expect(createButton).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should render error message when error occurs', () => {
      const error = new Error('Failed to fetch products')
      render(
        <ProductsDataTable
          products={[]}
          loading={false}
          error={error}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 0 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      expect(screen.getByText(/failed to load products/i)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should show retry button in error state', async () => {
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      const error = new Error('Network error')

      render(
        <ProductsDataTable
          products={[]}
          loading={false}
          error={error}
          onRefresh={onRefresh}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 0 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      expect(onRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Success State', () => {
    it('should render products table with data', () => {
      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      expect(screen.getByText('RM-001')).toBeInTheDocument()
      expect(screen.getByText('Raw Material 1')).toBeInTheDocument()
      expect(screen.getByText('FG-001')).toBeInTheDocument()
      expect(screen.getByText('Finished Good 1')).toBeInTheDocument()
    })

    it('should handle row click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={onRowClick}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const firstRow = screen.getByText('RM-001').closest('tr')
      await user.click(firstRow!)

      expect(onRowClick).toHaveBeenCalledWith(mockProducts[0])
    })
  })

  describe('Filters', () => {
    it('should handle search input', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={onFiltersChange}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search products/i)
      await user.type(searchInput, 'RM-001')

      // Should be debounced (300ms), so we need to wait
      await vi.waitFor(
        () => {
          expect(onFiltersChange).toHaveBeenCalledWith({
            search: 'RM-001',
            type: null,
            status: null,
          })
        },
        { timeout: 500 }
      )
    })

    it('should handle type filter change', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={onFiltersChange}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      // Click the select trigger to open dropdown
      const typeFilter = screen.getByLabelText(/filter by product type/i)
      await user.click(typeFilter)

      // Click the RM option
      const rmOption = await screen.findByRole('option', { name: /raw material/i })
      await user.click(rmOption)

      expect(onFiltersChange).toHaveBeenCalledWith({
        search: '',
        type: 'RM',
        status: null,
      })
    })

    it('should handle status filter change', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={onFiltersChange}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      // Click the select trigger to open dropdown
      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.click(statusFilter)

      // Click the Active option
      const activeOption = await screen.findByRole('option', { name: /^active$/i })
      await user.click(activeOption)

      expect(onFiltersChange).toHaveBeenCalledWith({
        search: '',
        type: null,
        status: 'active',
      })
    })
  })

  describe('Sorting', () => {
    it('should handle column sort', async () => {
      const user = userEvent.setup()
      const onSortingChange = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={onSortingChange}
        />
      )

      const nameHeader = screen.getByText(/product name/i)
      await user.click(nameHeader)

      expect(onSortingChange).toHaveBeenCalledWith({
        field: 'name',
        order: 'asc',
      })
    })

    it('should toggle sort order on same column', async () => {
      const user = userEvent.setup()
      const onSortingChange = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={onSortingChange}
        />
      )

      const codeHeader = screen.getByText(/product code/i)
      await user.click(codeHeader)

      expect(onSortingChange).toHaveBeenCalledWith({
        field: 'code',
        order: 'desc',
      })
    })
  })

  describe('Pagination', () => {
    it('should handle page change', async () => {
      const user = userEvent.setup()
      const onPaginationChange = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 50 }}
          onPaginationChange={onPaginationChange}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(onPaginationChange).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        total: 50,
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on table', () => {
      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Products table')
    })

    it('should have sortable headers with aria-sort', () => {
      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={vi.fn()}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const codeHeader = screen.getByText(/product code/i).closest('th')
      expect(codeHeader).toHaveAttribute('aria-sort', 'ascending')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()

      render(
        <ProductsDataTable
          products={mockProducts}
          loading={false}
          error={null}
          onRefresh={vi.fn()}
          onRowClick={onRowClick}
          onCreateClick={vi.fn()}
          filters={{ search: '', type: null, status: null }}
          onFiltersChange={vi.fn()}
          pagination={{ page: 1, limit: 20, total: 2 }}
          onPaginationChange={vi.fn()}
          sorting={{ field: 'code', order: 'asc' }}
          onSortingChange={vi.fn()}
        />
      )

      const firstRow = screen.getByText('RM-001').closest('tr')!
      firstRow.focus()
      await user.keyboard('{Enter}')

      expect(onRowClick).toHaveBeenCalledWith(mockProducts[0])
    })
  })
})
