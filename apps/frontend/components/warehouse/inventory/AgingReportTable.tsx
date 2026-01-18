/**
 * AgingReportTable Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Table showing product-level aging breakdown with color-coded bucket columns.
 * Default sort by Total Value DESC.
 */

'use client'

import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductAgingData, AgingBucketData } from '@/lib/services/aging-report-service'

interface AgingReportTableProps {
  data: ProductAgingData[]
  mode: 'fifo' | 'fefo'
  page: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  className?: string
}

// Bucket background colors for table cells
const BUCKET_BG_COLORS = {
  '0-7': 'bg-green-50 text-green-900',
  '8-30': 'bg-yellow-50 text-yellow-900',
  '31-90': 'bg-orange-50 text-orange-900',
  '90+': 'bg-red-50 text-red-900',
} as const

type SortField = 'product_name' | 'total_qty' | 'total_value' | 'oldest_age' | null
type SortDirection = 'asc' | 'desc'

/**
 * Format bucket cell data
 */
function BucketCell({
  bucket,
  colorClass,
}: {
  bucket: AgingBucketData
  colorClass: string
}) {
  if (bucket.qty === 0 && bucket.lp_count === 0) {
    return (
      <TableCell className="text-center text-muted-foreground">
        -
      </TableCell>
    )
  }

  return (
    <TableCell className={cn('text-center', colorClass)}>
      <div className="flex flex-col">
        <span className="font-medium">
          {bucket.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs opacity-75">
          ${bucket.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs opacity-60">
          {bucket.lp_count} LP{bucket.lp_count !== 1 ? 's' : ''}
        </span>
      </div>
    </TableCell>
  )
}

/**
 * Sortable column header
 */
function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(field)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {isActive ? (
        currentDirection === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

export function AgingReportTable({
  data,
  mode,
  page,
  onPageChange,
  itemsPerPage = 50,
  className,
}: AgingReportTableProps) {
  const [sortField, setSortField] = useState<SortField>('total_value')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Sort and paginate data
  const sortedData = useMemo(() => {
    if (!data) return []

    const sorted = [...data].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'product_name':
          comparison = a.product_name.localeCompare(b.product_name)
          break
        case 'total_qty':
          comparison = a.total_qty - b.total_qty
          break
        case 'total_value':
          comparison = a.total_value - b.total_value
          break
        case 'oldest_age':
          if (mode === 'fifo') {
            comparison = (a.oldest_lp_age_days ?? 0) - (b.oldest_lp_age_days ?? 0)
          } else {
            comparison = (a.soonest_expiry_days ?? Infinity) - (b.soonest_expiry_days ?? Infinity)
          }
          break
        default:
          comparison = a.total_value - b.total_value
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [data, sortField, sortDirection, mode])

  // Paginate
  const paginatedData = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, page, itemsPerPage])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">
                  <SortableHeader
                    label="Product"
                    field="product_name"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className={cn('text-center min-w-[100px]', BUCKET_BG_COLORS['0-7'])}>
                  0-7 days
                </TableHead>
                <TableHead className={cn('text-center min-w-[100px]', BUCKET_BG_COLORS['8-30'])}>
                  8-30 days
                </TableHead>
                <TableHead className={cn('text-center min-w-[100px]', BUCKET_BG_COLORS['31-90'])}>
                  31-90 days
                </TableHead>
                <TableHead className={cn('text-center min-w-[100px]', BUCKET_BG_COLORS['90+'])}>
                  90+ days
                </TableHead>
                <TableHead className="text-right min-w-[100px]">
                  <SortableHeader
                    label="Total Qty"
                    field="total_qty"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="text-right min-w-[100px]">
                  <SortableHeader
                    label="Total Value"
                    field="total_value"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="text-right min-w-[120px]">
                  <SortableHeader
                    label={mode === 'fifo' ? 'Oldest LP Age' : 'Soonest Expiry'}
                    field="oldest_age"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((product) => (
                <TableRow
                  key={product.product_id}
                  className="hover:bg-muted/50"
                  tabIndex={0}
                  role="row"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.product_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.product_sku}
                      </span>
                    </div>
                  </TableCell>
                  <BucketCell
                    bucket={product.bucket_0_7_days}
                    colorClass={BUCKET_BG_COLORS['0-7']}
                  />
                  <BucketCell
                    bucket={product.bucket_8_30_days}
                    colorClass={BUCKET_BG_COLORS['8-30']}
                  />
                  <BucketCell
                    bucket={product.bucket_31_90_days}
                    colorClass={BUCKET_BG_COLORS['31-90']}
                  />
                  <BucketCell
                    bucket={product.bucket_90_plus_days}
                    colorClass={BUCKET_BG_COLORS['90+']}
                  />
                  <TableCell className="text-right font-medium">
                    {product.total_qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs text-muted-foreground">{product.uom}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${product.total_value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {mode === 'fifo' ? (
                      product.oldest_lp_age_days !== null ? (
                        <span className={cn(
                          'font-medium',
                          product.oldest_lp_age_days > 90 && 'text-red-600',
                          product.oldest_lp_age_days > 30 && product.oldest_lp_age_days <= 90 && 'text-orange-600'
                        )}>
                          {product.oldest_lp_age_days} days
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )
                    ) : (
                      product.soonest_expiry_days !== null ? (
                        <span className={cn(
                          'font-medium',
                          product.soonest_expiry_days < 0 && 'text-red-600',
                          product.soonest_expiry_days >= 0 && product.soonest_expiry_days <= 7 && 'text-orange-600',
                          product.soonest_expiry_days > 7 && product.soonest_expiry_days <= 30 && 'text-yellow-600'
                        )}>
                          {product.soonest_expiry_days < 0
                            ? `Expired ${Math.abs(product.soonest_expiry_days)} days ago`
                            : `${product.soonest_expiry_days} days`
                          }
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(page * itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} products
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Prev</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => onPageChange(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === page ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
