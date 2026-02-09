/**
 * Products List Page (Story 02.1 - TEC-001)
 * Product catalog management with CRUD operations
 *
 * Features:
 * - ProductsDataTable with all 4 UI states
 * - Search, filter, sort, pagination
 * - Create/Edit product modal
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ProductsDataTable } from '@/components/technical/products/ProductsDataTable'
import { ProductFormModal } from '@/components/technical/ProductFormModal'
import type { ProductFilters } from '@/components/technical/products/ProductFilters'
import type { Product } from '@/lib/types/product'

interface PaginationState {
  page: number
  limit: number
  total: number
}

interface SortingState {
  field: 'code' | 'name' | 'type' | 'version' | 'created_at'
  order: 'asc' | 'desc'
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    type: null,
    status: null,
    archived: false,
  })

  // Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
  })

  // Sorting
  const [sorting, setSorting] = useState<SortingState>({
    field: 'code',
    order: 'asc',
  })

  // Check for create URL param
  useEffect(() => {
    const createParam = searchParams.get('create')
    if (createParam === 'true') {
      setShowCreateModal(true)
      // Clean up URL without reloading
      router.replace('/technical/products', { scroll: false })
    }
  }, [searchParams, router])

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      params.append('sort', sorting.field)
      params.append('order', sorting.order)
      params.append('archived', filters.archived.toString())

      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.type) {
        params.append('type', filters.type)
      }
      if (filters.status) {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/technical/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result = await response.json()
      setProducts(result.data || [])
      setPagination({
        ...pagination,
        total: result.pagination?.total || 0,
      })
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Fetch on filter/sort/page changes
  useEffect(() => {
    fetchProducts()
  }, [filters, sorting, pagination.page])

  // Handlers
  const handleRefresh = () => {
    fetchProducts()
  }

  const handleRowClick = (product: Product) => {
    router.push(`/technical/products/${product.id}`)
  }

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
  }

  const handleModalSuccess = () => {
    setShowCreateModal(false)
    fetchProducts() // Refresh the product list
    toast({
      title: 'Success',
      description: 'Product created successfully',
    })
  }

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    // Reset to page 1 when filters change
    setPagination({ ...pagination, page: 1 })
  }

  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination)
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Products</h1>
        <p className="text-slate-600 mt-1">
          Manage your product catalog (Raw Materials, WIP, Finished Goods,
          Packaging, By-Products)
        </p>
      </div>

      <ProductsDataTable
        products={products}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onRowClick={handleRowClick}
        onCreateClick={handleCreateClick}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {/* Product Creation Modal */}
      <ProductFormModal
        product={null}
        open={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
