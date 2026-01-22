/**
 * CustomerOrderHistory Component
 * Story: 07.6 - SO Allergen Validation
 *
 * Paginated table of customer's sales order history.
 *
 * Features:
 * - Load orders on mount
 * - Loading, empty, error, success states
 * - Pagination (20 items per page)
 * - Status badges with colors
 * - View action to navigate to SO detail
 * - Sortable column headers
 *
 * Wireframe: SHIP-004
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ShoppingCart,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCustomerOrderHistory } from '@/lib/hooks/use-customer-order-history'

// =============================================================================
// Types
// =============================================================================

export interface CustomerOrder {
  id: string
  order_number: string
  order_date: string
  status: 'draft' | 'confirmed' | 'shipped' | 'cancelled' | 'on_hold' | 'allocated' | 'picking' | 'packing' | 'delivered'
  total_amount: number
  currency: string
  line_count: number
}

export interface CustomerOrderHistoryProps {
  /** Customer ID to fetch orders for */
  customerId: string
}

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  allocated: 'bg-purple-100 text-purple-800',
  picking: 'bg-indigo-100 text-indigo-800',
  packing: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-emerald-100 text-emerald-800',
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}

// =============================================================================
// Sub-Components
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const styles = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800'
  const displayStatus = status.replace('_', ' ')

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-none', styles)}
      data-testid={`status-badge-${status}`}
    >
      {displayStatus}
    </Badge>
  )
}

function LoadingState() {
  return (
    <div className="border rounded-md" data-testid="skeleton-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Lines</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} data-testid="skeleton-row">
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-14" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 space-y-4"
      data-testid="orders-empty"
    >
      <ShoppingCart
        className="h-12 w-12 text-muted-foreground"
        data-testid="shopping-cart-icon"
        aria-hidden="true"
      />
      <div className="text-center">
        <p className="text-lg font-semibold">No orders yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Orders for this customer will appear here
        </p>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 space-y-4"
      data-testid="orders-error"
    >
      <AlertCircle
        className="h-12 w-12 text-red-500"
        data-testid="alert-circle-icon"
        aria-hidden="true"
      />
      <div className="text-center">
        <p className="text-lg font-semibold text-red-800">
          Failed to load order history
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try again
        </p>
      </div>
      <Button onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function CustomerOrderHistory({ customerId }: CustomerOrderHistoryProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('order_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, error, refetch } = useCustomerOrderHistory({
    customerId,
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  })

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        setSortBy(field)
        setSortOrder('desc')
      }
    },
    [sortBy, sortOrder]
  )

  const handleViewOrder = useCallback(
    (orderId: string) => {
      router.push(`/shipping/sales-orders/${orderId}`)
    },
    [router]
  )

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (data && page < data.pagination.total_pages) {
      setPage(page + 1)
    }
  }

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 inline" aria-hidden="true" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline" aria-hidden="true" />
    )
  }

  // Loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Error state
  if (error) {
    return <ErrorState onRetry={refetch} />
  }

  // Empty state
  if (!data || data.orders.length === 0) {
    return <EmptyState />
  }

  const { orders, pagination } = data
  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, pagination.total)

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table aria-label="Customer Order History">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('order_number')}
                role="columnheader"
                aria-sort={
                  sortBy === 'order_number'
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                Order Number
                {renderSortIndicator('order_number')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('order_date')}
                role="columnheader"
                aria-sort={
                  sortBy === 'order_date'
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                Date
                {renderSortIndicator('order_date')}
              </TableHead>
              <TableHead role="columnheader">Status</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('total_amount')}
                role="columnheader"
                aria-sort={
                  sortBy === 'total_amount'
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                Total Amount
                {renderSortIndicator('total_amount')}
              </TableHead>
              <TableHead role="columnheader">Lines</TableHead>
              <TableHead role="columnheader">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: CustomerOrder) => (
              <TableRow key={order.id} data-testid="order-row">
                <TableCell className="font-mono font-medium">
                  {order.order_number}
                </TableCell>
                <TableCell>{formatDate(order.order_date)}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {formatCurrency(order.total_amount, order.currency)}
                </TableCell>
                <TableCell>{order.line_count}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrder(order.id)}
                    aria-label={`View order ${order.order_number}`}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {pagination.total} orders
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={page === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={page >= pagination.total_pages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CustomerOrderHistory
