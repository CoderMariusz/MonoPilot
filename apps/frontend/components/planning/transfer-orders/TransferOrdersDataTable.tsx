/**
 * Transfer Orders DataTable Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Full-featured data table with search, filters, sorting, pagination
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileX,
  RefreshCw,
} from 'lucide-react'
import { TOStatusBadge } from './TOStatusBadge'
import { TOPriorityBadge } from './TOPriorityBadge'
import { TOActions, type TOAction } from './TOActions'
import { useTransferOrders } from '@/lib/hooks/use-transfer-orders'
import type { TOStatus, TOPriority, TOListParams, TransferOrderWithWarehouses } from '@/lib/types/transfer-order'
import { cn } from '@/lib/utils'

interface Warehouse {
  id: string
  code: string
  name: string
}

interface TransferOrdersDataTableProps {
  onCreateClick?: () => void
  onEditClick?: (to: TransferOrderWithWarehouses) => void
  onReleaseClick?: (to: TransferOrderWithWarehouses) => void
  onCancelClick?: (to: TransferOrderWithWarehouses) => void
  initialFilters?: Partial<TOListParams>
  canCreate?: boolean
  canEdit?: boolean
}

export function TransferOrdersDataTable({
  onCreateClick,
  onEditClick,
  onReleaseClick,
  onCancelClick,
  initialFilters = {},
  canCreate = true,
  canEdit = true,
}: TransferOrdersDataTableProps) {
  const router = useRouter()

  // State for filters and pagination
  const [search, setSearch] = useState(initialFilters.search || '')
  const [status, setStatus] = useState<TOStatus | 'all'>(
    (initialFilters.status as TOStatus) || 'all'
  )
  const [priority, setPriority] = useState<TOPriority | 'all'>(
    (initialFilters.priority as TOPriority) || 'all'
  )
  const [fromWarehouseId, setFromWarehouseId] = useState<string>('all')
  const [toWarehouseId, setToWarehouseId] = useState<string>('all')
  const [sort, setSort] = useState<TOListParams['sort']>(initialFilters.sort || 'created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>(initialFilters.order || 'desc')
  const [page, setPage] = useState(initialFilters.page || 1)
  const [limit] = useState(initialFilters.limit || 20)

  // Warehouses for filters
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)

  // Build query params
  const params: TOListParams = {
    page,
    limit,
    search: search.length >= 2 ? search : undefined,
    status: status !== 'all' ? status : undefined,
    priority: priority !== 'all' ? priority : undefined,
    from_warehouse_id: fromWarehouseId !== 'all' ? fromWarehouseId : undefined,
    to_warehouse_id: toWarehouseId !== 'all' ? toWarehouseId : undefined,
    sort,
    order,
  }

  const { data, isLoading, isError, refetch } = useTransferOrders(params)

  // Fetch warehouses for filter dropdowns
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        setLoadingWarehouses(true)
        const response = await fetch('/api/v1/settings/warehouses?status=active&limit=100')
        if (response.ok) {
          const result = await response.json()
          setWarehouses(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error)
      } finally {
        setLoadingWarehouses(false)
      }
    }
    fetchWarehouses()
  }, [])

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  // Handle sort
  const handleSort = (column: TOListParams['sort']) => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(column)
      setOrder('asc')
    }
    setPage(1)
  }

  // Get sort icon
  const getSortIcon = (column: TOListParams['sort']) => {
    if (sort !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />
    return order === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    )
  }

  // Handle row click
  const handleRowClick = (to: TransferOrderWithWarehouses) => {
    router.push(`/planning/transfer-orders/${to.id}`)
  }

  // Handle action
  const handleAction = (action: TOAction, to: TransferOrderWithWarehouses) => {
    switch (action) {
      case 'view':
        router.push(`/planning/transfer-orders/${to.id}`)
        break
      case 'edit':
        onEditClick?.(to)
        break
      case 'release':
        onReleaseClick?.(to)
        break
      case 'cancel':
        onCancelClick?.(to)
        break
      case 'duplicate':
        // TODO: Implement duplicate
        break
      case 'print':
        // TODO: Implement print
        break
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setPriority('all')
    setFromWarehouseId('all')
    setToWarehouseId('all')
    setPage(1)
  }

  const hasActiveFilters =
    search.length >= 2 ||
    status !== 'all' ||
    priority !== 'all' ||
    fromWarehouseId !== 'all' ||
    toWarehouseId !== 'all'

  const transferOrders = data?.data || []
  const totalItems = data?.meta.total || 0
  const totalPages = data?.meta.pages || 1

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <TableCell key={j}>
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

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <FileX className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to Load Transfer Orders
        </h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Unable to retrieve transfer order data. Please check your connection and try again.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by TO number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search transfer orders"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {canCreate && (
          <Button onClick={onCreateClick} data-testid="add-transfer-order-button">
            <Plus className="mr-2 h-4 w-4" />
            New Transfer Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={(v) => { setStatus(v as TOStatus | 'all'); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => { setPriority(v as TOPriority | 'all'); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={fromWarehouseId}
          onValueChange={(v) => { setFromWarehouseId(v); setPage(1); }}
          disabled={loadingWarehouses}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="From Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">From: All</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toWarehouseId}
          onValueChange={(v) => { setToWarehouseId(v); setPage(1); }}
          disabled={loadingWarehouses}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="To Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">To: All</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('to_number')}
                  className="flex items-center font-medium hover:text-gray-900"
                >
                  TO Number
                  {getSortIcon('to_number')}
                </button>
              </TableHead>
              <TableHead>From / To Warehouse</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center font-medium hover:text-gray-900"
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('planned_ship_date')}
                  className="flex items-center font-medium hover:text-gray-900"
                >
                  Planned Ship
                  {getSortIcon('planned_ship_date')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center font-medium hover:text-gray-900"
                >
                  Created
                  {getSortIcon('created_at')}
                </button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transferOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FileX className="h-10 w-10 text-gray-400 mb-3" />
                    {hasActiveFilters ? (
                      <>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          No matching transfer orders
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          No TOs match your current filters.
                        </p>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          No Transfer Orders Yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Create your first transfer order to move inventory between warehouses.
                        </p>
                        {canCreate && (
                          <Button size="sm" onClick={onCreateClick}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Transfer Order
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transferOrders.map((to) => (
                <TableRow
                  key={to.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(to)}
                >
                  <TableCell className="font-medium">{to.to_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{to.from_warehouse?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{to.from_warehouse?.code}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm">{to.to_warehouse?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{to.to_warehouse?.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TOStatusBadge status={to.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <TOPriorityBadge priority={to.priority} size="sm" />
                  </TableCell>
                  <TableCell>{formatDate(to.planned_ship_date)}</TableCell>
                  <TableCell>{formatDate(to.created_at)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <TOActions
                      toId={to.id}
                      toNumber={to.to_number}
                      status={to.status}
                      linesCount={to.lines_count || 0}
                      canEdit={canEdit}
                      onAction={(action) => handleAction(action, to)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferOrdersDataTable
