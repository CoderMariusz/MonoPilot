/**
 * Expiring Items Table Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Data table with color-coded rows, selection, and actions
 */

'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Trash2, Star, Clock, Calendar, Package } from 'lucide-react'
import { ExpiryBadge } from './ExpiryBadge'
import type { ExpiringLP, ExpiryTier } from '@/lib/validation/expiry-alert-schema'

interface ExpiringItemsTableProps {
  data: ExpiringLP[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  page: number
  onPageChange: (page: number) => void
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  isLoading?: boolean
  className?: string
}

/**
 * Get row background color based on expiry tier
 */
function getRowBgClass(tier: ExpiryTier): string {
  switch (tier) {
    case 'expired':
      return 'bg-red-50 hover:bg-red-100'
    case 'critical':
      return 'bg-orange-50 hover:bg-orange-100'
    case 'warning':
      return 'bg-yellow-50 hover:bg-yellow-100'
    case 'ok':
      return 'bg-green-50 hover:bg-green-100'
    default:
      return ''
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-2" data-testid="table-skeleton">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="empty-state"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Expiring Items</h3>
      <p className="text-muted-foreground max-w-md">
        No items are expiring within the selected time range. Adjust the slider
        to see items expiring further in the future.
      </p>
    </div>
  )
}

export function ExpiringItemsTable({
  data,
  selectedIds,
  onSelectionChange,
  page,
  onPageChange,
  pagination,
  isLoading = false,
  className,
}: ExpiringItemsTableProps) {
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map((item) => item.lp_id))
    }
  }, [data, selectedIds.length, onSelectionChange])

  const handleSelectItem = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((i) => i !== id))
      } else {
        onSelectionChange([...selectedIds, id])
      }
    },
    [selectedIds, onSelectionChange]
  )

  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length

  if (isLoading) {
    return <TableSkeleton />
  }

  if (data.length === 0) {
    return <EmptyState />
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="expiring-items-table">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(ref) => {
                    if (ref) {
                      (ref as HTMLButtonElement).dataset.state = isSomeSelected
                        ? 'indeterminate'
                        : isAllSelected
                          ? 'checked'
                          : 'unchecked'
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                />
              </TableHead>
              <TableHead>LP Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="text-center">Days</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.lp_id}
                className={cn(
                  getRowBgClass(item.tier),
                  'transition-colors'
                )}
                data-state={selectedIds.includes(item.lp_id) ? 'selected' : undefined}
                data-tier={item.tier}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(item.lp_id)}
                    onCheckedChange={() => handleSelectItem(item.lp_id)}
                    aria-label={`Select ${item.lp_number}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/warehouse/license-plates/${item.lp_id}`}
                    className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                  >
                    {item.lp_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    {item.product_sku && (
                      <div className="text-xs text-muted-foreground">
                        {item.product_sku}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {item.quantity.toLocaleString()} {item.uom}
                </TableCell>
                <TableCell>
                  <div>
                    <div>{item.location_code}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.warehouse_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.batch_number || '-'}</TableCell>
                <TableCell>
                  {new Date(item.expiry_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-center">
                  <ExpiryBadge daysRemaining={item.days_until_expiry} />
                </TableCell>
                <TableCell className="text-right">
                  ${item.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Actions for ${item.lp_number}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/warehouse/license-plates/${item.lp_id}`}>
                          <Package className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {item.tier === 'expired' && (
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Dispose
                        </DropdownMenuItem>
                      )}
                      {item.tier === 'critical' && (
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          Prioritize
                        </DropdownMenuItem>
                      )}
                      {(item.tier === 'critical' || item.tier === 'warning') && (
                        <DropdownMenuItem>
                          <Clock className="mr-2 h-4 w-4" />
                          Use First
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Package className="mr-2 h-4 w-4" />
                        Reserve
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pagination.pages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <span className="font-medium">Color Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-200" />
          Expired
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-orange-200" />
          Critical (0-7 days)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-yellow-200" />
          Warning (8-30 days)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-200" />
          OK (31+ days)
        </span>
      </div>
    </div>
  )
}
