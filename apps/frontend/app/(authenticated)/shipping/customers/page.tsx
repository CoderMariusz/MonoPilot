/**
 * Customers List Page
 * Story: 07.1 - Customers CRUD
 *
 * Main customers list page with:
 * - DataTable with search, filters, sorting
 * - Create/Edit modal
 * - All 4 states: loading, error, empty, success
 * - Keyboard navigation
 *
 * Wireframe: SHIP-001
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Users, RefreshCw, WifiOff, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CustomerDataTable, type Customer } from '@/components/shipping/customers/CustomerDataTable'
import { CustomerModal, type Allergen } from '@/components/shipping/customers/CustomerModal'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type CustomerListParams,
} from '@/lib/hooks/use-customers'
import { useAllergens } from '@/lib/hooks/use-allergens'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type CategoryFilter = 'all' | 'retail' | 'wholesale' | 'distributor'
type StatusFilter = 'all' | 'active' | 'inactive'

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [params, setParams] = useState<CustomerListParams>({
    page: Number(searchParams.get('page')) || 1,
    limit: 25,
    search: searchParams.get('search') || undefined,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  })
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    (searchParams.get('category') as CategoryFilter) || 'all'
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  )
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Queries and mutations
  const queryParams: CustomerListParams = {
    ...params,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  }
  const { data, isLoading, error, refetch } = useCustomers(queryParams)
  const { data: allergensData } = useAllergens()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()

  const customers = data?.data || []
  const allergens: Allergen[] = (allergensData || []).map((a: { id: string; code: string; name: string }) => ({
    id: a.id,
    code: a.code,
    name: a.name,
  }))

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync URL with filters
  useEffect(() => {
    const urlParams = new URLSearchParams()
    if (params.search) urlParams.set('search', params.search)
    if (categoryFilter !== 'all') urlParams.set('category', categoryFilter)
    if (statusFilter !== 'all') urlParams.set('status', statusFilter)
    if (params.page && params.page > 1) urlParams.set('page', params.page.toString())
    if (params.sort_by && params.sort_by !== 'created_at') urlParams.set('sort_by', params.sort_by)
    if (params.sort_order && params.sort_order !== 'desc') urlParams.set('sort_order', params.sort_order)

    const newUrl = urlParams.toString() ? `?${urlParams.toString()}` : '/shipping/customers'
    router.replace(newUrl, { scroll: false })
  }, [params, categoryFilter, statusFilter, router])

  // Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setParams((prev) => ({ ...prev, search: searchTerm || undefined, page: 1 }))
  }, [searchTerm])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setParams((prev) => ({ ...prev, search: undefined, page: 1 }))
  }, [])

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value as CategoryFilter)
    setParams((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as StatusFilter)
    setParams((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setParams((prev) => ({ ...prev, sort_by: field, sort_order: order }))
  }, [])

  const handleRowClick = useCallback(
    (id: string) => {
      const customer = customers.find((c) => c.id === id)
      if (customer) {
        setEditingCustomer(customer as Customer)
        setShowModal(true)
      }
    },
    [customers]
  )

  const handleCreate = useCallback(() => {
    setEditingCustomer(null)
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingCustomer(null)
  }, [])

  const handleSubmit = useCallback(
    async (formData: any) => {
      if (editingCustomer) {
        await updateMutation.mutateAsync({
          id: editingCustomer.id,
          data: formData,
        })
        toast({
          title: 'Success',
          description: `Customer ${formData.name} updated successfully`,
        })
      } else {
        await createMutation.mutateAsync(formData)
        toast({
          title: 'Success',
          description: `Customer ${formData.name} created successfully`,
        })
      }
    },
    [editingCustomer, createMutation, updateMutation, toast]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteCustomerId) return

    try {
      await deleteMutation.mutateAsync(deleteCustomerId)
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      })
      setDeleteCustomerId(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete customer',
        variant: 'destructive',
      })
    }
  }, [deleteCustomerId, deleteMutation, toast])

  // Keyboard navigation for page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to create new customer
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleCreate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCreate])

  // Offline state
  if (isOffline) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage customer information</p>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center py-16 border rounded-lg"
          data-testid="error-offline"
        >
          <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No Internet Connection</h2>
          <p className="text-muted-foreground mt-2">
            Please check your connection and try again.
          </p>
          <Button className="mt-6" onClick={() => refetch()} data-testid="button-retry">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage customer information</p>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center py-16 border rounded-lg"
          data-testid="error-state"
        >
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold">Failed to Load Customers</h2>
          <p className="text-muted-foreground mt-2">
            Unable to retrieve customer data. Please try again.
          </p>
          <div className="flex gap-4 mt-6">
            <Button onClick={() => refetch()} data-testid="button-retry">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and shipping addresses
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-customer">
          <Plus className="h-4 w-4 mr-2" />
          Create Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary" data-testid="button-search">
            Search
          </Button>
        </form>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-40" data-testid="filter-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
            <SelectItem value="distributor">Distributor</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-32" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <CustomerDataTable
        data={customers}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        onSort={handleSort}
        sortBy={params.sort_by}
        sortOrder={params.sort_order}
        onCreate={handleCreate}
      />

      {/* Create/Edit Modal */}
      <CustomerModal
        isOpen={showModal}
        customer={editingCustomer as any}
        allergens={allergens}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              customer and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
