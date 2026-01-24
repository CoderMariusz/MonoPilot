/**
 * SO Data Table Component
 * Story 07.2: Sales Orders Core
 *
 * Displays sales orders list with:
 * - Sorting, filtering, pagination
 * - Status badges
 * - Row actions (View, Edit, Delete, Confirm)
 * - Loading, empty, error states
 * - Keyboard navigation
 */

'use client'

import { useState, useCallback } from 'react'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Check,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  X,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SOStatusBadge } from './SOStatusBadge'
import { SalesOrderService, type SOStatus } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

export interface SalesOrder {
  id: string
  order_number: string
  customer_name?: string
  status: SOStatus
  order_date: string
  required_delivery_date: string
  total_amount?: number
  line_count?: number
}

interface SODataTableProps {
  data: SalesOrder[]
  loading?: boolean
  error?: string | null
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onConfirm?: (id: string) => void
  onView?: (id: string) => void
  onCreate?: () => void
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (field: string, order: 'asc' | 'desc') => void
  onSearch?: (term: string) => void
  onStatusFilter?: (status: string) => void
  testId?: string
  className?: string
}

// =============================================================================
// Column Configuration
// =============================================================================

const COLUMNS = [
  { id: 'order_number', label: 'Order #', sortable: true, width: '140px' },
  { id: 'customer_name', label: 'Customer', sortable: true, width: '200px' },
  { id: 'status', label: 'Status', sortable: true, width: '120px' },
  { id: 'order_date', label: 'Order Date', sortable: true, width: '120px' },
  { id: 'required_delivery_date', label: 'Delivery Date', sortable: true, width: '120px' },
  { id: 'total_amount', label: 'Total', sortable: true, width: '120px', align: 'right' as const },
  { id: 'line_count', label: 'Lines', sortable: false, width: '70px', align: 'right' as const },
  { id: 'actions', label: '', sortable: false, width: '80px', align: 'right' as const },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

// =============================================================================
// Component
// =============================================================================

export function SODataTable({
  data,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onConfirm,
  onView,
  onCreate,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  sortField = 'order_date',
  sortOrder = 'desc',
  onSortChange,
  onSearch,
  onStatusFilter,
  testId = 'so-data-table',
  className,
}: SODataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [localData, setLocalData] = useState<SalesOrder[]>(data)

  // Update local data when props change
  if (data !== localData && !loading) {
    setLocalData(data)
  }

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value)
      if (onSearch) {
        // Debounce: wait 300ms before calling
        const timeoutId = setTimeout(() => {
          onSearch(value)
        }, 300)
        return () => clearTimeout(timeoutId)
      }
    },
    [onSearch]
  )

  const handleClearSearch = () => {
    setSearchTerm('')
    if (onSearch) onSearch('')
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    if (onStatusFilter) {
      onStatusFilter(value === 'all' ? '' : value)
    }
  }

  const handleSort = (field: string) => {
    if (!onSortChange) return
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    onSortChange(field, newOrder)
  }

  const handleKeyDown = (e: React.KeyboardEvent, orderId: string) => {
    if (e.key === 'Enter' && onView) {
      onView(orderId)
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" data-testid="sort-indicator-asc" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" data-testid="sort-indicator-desc" />
    )
  }

  // Filter data locally based on search and status
  const filteredData = localData.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Error state
  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center" data-testid="so-error-state">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="loading-skeleton">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableHead key={col.id} style={{ width: col.width }}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} data-testid="skeleton-row">
                  {COLUMNS.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredData.length === 0 && !loading) {
    const isFiltered = searchTerm || statusFilter !== 'all'

    return (
      <div className={cn('space-y-4', className)}>
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40" data-testid="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty State */}
        <div
          className="border rounded-lg p-12 text-center"
          data-testid={isFiltered ? 'so-filtered-empty' : 'so-empty'}
        >
          {isFiltered ? (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                No Orders Match Your Filters
              </p>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  if (onSearch) onSearch('')
                  if (onStatusFilter) onStatusFilter('')
                }}
              >
                Clear All Filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                No Sales Orders Yet
              </p>
              <p className="text-gray-500 mb-4">
                Create your first sales order to get started.
              </p>
              {canCreate && onCreate && (
                <Button onClick={onCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sales Order
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} data-testid={testId}>
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40" data-testid="status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg">
        <Table role="table" aria-label="Sales order list">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none hover:bg-gray-50'
                  )}
                  onClick={() => col.sortable && handleSort(col.id)}
                  aria-sort={
                    col.sortable && sortField === col.id
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable && renderSortIcon(col.id)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((order) => {
              const canEditOrder = canEdit && order.status === 'draft'
              const canDeleteOrder = canDelete && order.status === 'draft'
              const canConfirmOrder = canEdit && order.status === 'draft'

              return (
                <TableRow
                  key={order.id}
                  data-testid="so-row"
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => onView?.(order.id)}
                  onKeyDown={(e) => handleKeyDown(e, order.id)}
                  tabIndex={0}
                >
                  <TableCell>
                    <span className="font-medium font-mono">{order.order_number}</span>
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>
                    <SOStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    {SalesOrderService.formatDate(order.order_date)}
                  </TableCell>
                  <TableCell>
                    {SalesOrderService.formatDate(order.required_delivery_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {SalesOrderService.formatCurrency(order.total_amount || 0)}
                  </TableCell>
                  <TableCell className="text-right">{order.line_count}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu for {order.order_number}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => onView?.(order.id)}
                          data-testid={`view-${order.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>

                        {canEditOrder && onEdit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(order.id)}
                            data-testid={`edit-${order.id}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        {canConfirmOrder && onConfirm && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onConfirm(order.id)}
                              data-testid={`confirm-${order.id}`}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Confirm
                            </DropdownMenuItem>
                          </>
                        )}

                        {canDeleteOrder && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(order.id)}
                              className="text-red-600"
                              data-testid={`delete-${order.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SODataTable
