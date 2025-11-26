/**
 * Products List Page
 * Story: 2.1 Product CRUD
 * AC-2.1.1: Product List View
 * AC-2.1.2: Search & Filtering
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, ArrowUpDown, Eye, History, BookOpen, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductFormModal } from '@/components/technical/ProductFormModal'
import { ProductDeleteDialog } from '@/components/technical/ProductDeleteDialog'

// Product type interface
interface Product {
  id: string
  code: string
  name: string
  type: 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP' | 'CUSTOM'
  description?: string
  category?: string
  uom: string
  version: number
  status: 'active' | 'inactive' | 'obsolete'
  shelf_life_days?: number
  min_stock_qty?: number
  max_stock_qty?: number
  reorder_point?: number
  cost_per_unit?: number
  created_at: string
  updated_at: string
  bom_count?: number
}

// Product type labels and colors
const PRODUCT_TYPES: Record<string, { label: string; color: string }> = {
  RM: { label: 'Raw Material', color: 'bg-blue-500' },
  WIP: { label: 'Work In Progress', color: 'bg-orange-500' },
  FG: { label: 'Finished Good', color: 'bg-green-500' },
  PKG: { label: 'Packaging', color: 'bg-purple-500' },
  BP: { label: 'By-Product', color: 'bg-gray-500' },
  CUSTOM: { label: 'Custom', color: 'bg-cyan-500' },
}

// Status colors
const STATUS_COLORS: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
  active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  inactive: { variant: 'secondary', className: '' },
  obsolete: { variant: 'destructive', className: '' },
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeView, setActiveView] = useState<'products' | 'boms'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Handle ?create=true query param to auto-open modal
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      // Clean up URL
      router.replace('/technical/products', { scroll: false })
    }
  }, [searchParams, router])

  // Sorting
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'type' | 'status' | 'version'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const { toast } = useToast()

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('sort', sortBy)
      params.append('order', sortDirection)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`/api/technical/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result = await response.json()
      setProducts(result.data || [])
      setTotal(result.pagination?.total || 0)
      setTotalPages(result.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch on filter/sort/page/search changes
  useEffect(() => {
    fetchProducts()
  }, [typeFilter, statusFilter, sortBy, sortDirection, page, debouncedSearch])

  // Handlers
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
  }

  const handleDelete = (product: Product) => {
    setDeletingProduct(product)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingProduct(null)
  }

  const handleSaveSuccess = () => {
    fetchProducts()
    handleCloseModal()
  }

  const handleDeleteSuccess = () => {
    fetchProducts()
    setDeletingProduct(null)
  }

  // Badge components
  const getTypeBadge = (type: string) => {
    const config = PRODUCT_TYPES[type] || PRODUCT_TYPES.CUSTOM
    return (
      <Badge className={`${config.color} text-white`}>
        {type}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.active
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/technical/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div>
              <CardTitle>Technical Management</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {activeView === 'products'
                  ? 'Manage your product catalog (Raw Materials, WIP, Finished Goods, Packaging, By-Products)'
                  : 'Manage Bills of Materials and product recipes'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'products' | 'boms')} className="w-full">
              <TabsList>
                <TabsTrigger value="products">
                  Products
                </TabsTrigger>
                <TabsTrigger value="boms">
                  <BookOpen className="mr-2 h-4 w-4" />
                  BOMs
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 ml-4">
              {activeView === 'products' ? (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              ) : (
                <Button onClick={() => router.push('/technical/boms?create=true')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create BOM
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {activeView === 'boms' ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bills of Materials</h3>
            <p className="text-gray-600 mb-6">
              Manage BOMs and product recipes in the dedicated BOM management interface.
            </p>
            <Button onClick={() => router.push('/technical/boms')} size="lg">
              <BookOpen className="mr-2 h-4 w-4" />
              Go to BOM Management
            </Button>
          </div>
        ) : (
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
            <div className="flex gap-4 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RM">Raw Material</SelectItem>
                  <SelectItem value="WIP">Work In Progress</SelectItem>
                  <SelectItem value="FG">Finished Good</SelectItem>
                  <SelectItem value="PKG">Packaging</SelectItem>
                  <SelectItem value="BP">By-Product</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="obsolete">Obsolete</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="version">Version</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Direction */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No products found matching your criteria.'
                : 'No products found. Create your first product to get started.'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>BOMs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium font-mono">{product.code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{getTypeBadge(product.type)}</TableCell>
                      <TableCell className="text-gray-600">{product.uom}</TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell className="text-gray-600">v{product.version.toFixed(1)}</TableCell>
                      <TableCell>
                        {product.bom_count !== undefined ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/technical/products/${product.id}?tab=boms`)}
                            title={`View ${product.bom_count} BOM${product.bom_count !== 1 ? 's' : ''}`}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            {product.bom_count}
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/technical/products/${product.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/technical/products/${product.id}?tab=history`)}
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} products
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </CardContent>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Delete Dialog */}
      {deletingProduct && (
        <ProductDeleteDialog
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
