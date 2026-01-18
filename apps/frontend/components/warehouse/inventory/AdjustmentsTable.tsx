/**
 * Adjustments Table Component
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MoreVertical, Eye, Check, X, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Adjustment, AdjustmentPagination } from '@/lib/types/adjustment'
import { ADJUSTMENT_STATUS_CONFIG, ADJUSTMENT_REASON_CONFIG } from '@/lib/types/adjustment'
import { format } from 'date-fns'

interface AdjustmentsTableProps {
  data: Adjustment[]
  isLoading: boolean
  pagination: AdjustmentPagination
  page: number
  canApprove: boolean
  onPageChange: (page: number) => void
  onRowClick?: (adjustment: Adjustment) => void
  onApprove?: (adjustment: Adjustment) => void
  onReject?: (adjustment: Adjustment) => void
  onViewLP?: (adjustment: Adjustment) => void
}

export function AdjustmentsTable({
  data,
  isLoading,
  pagination,
  page,
  canApprove,
  onPageChange,
  onRowClick,
  onApprove,
  onReject,
  onViewLP,
}: AdjustmentsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg" data-testid="adjustments-loading">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>LP Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Original Qty</TableHead>
              <TableHead>New Qty</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Adjusted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const formatDateTime = (date: string): string => {
    try {
      return format(new Date(date), 'yyyy-MM-dd HH:mm')
    } catch {
      return date
    }
  }

  const formatVariance = (variance: number, uom: string): { text: string; className: string } => {
    if (variance > 0) {
      return {
        text: `+${variance.toLocaleString()} ${uom}`,
        className: 'text-green-600 font-medium',
      }
    }
    return {
      text: `${variance.toLocaleString()} ${uom}`,
      className: 'text-red-600 font-medium',
    }
  }

  const calculateVariancePercent = (original: number, variance: number): string => {
    if (original === 0) return variance > 0 ? '+100%' : '0%'
    const pct = (variance / original) * 100
    return pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`
  }

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto" data-testid="adjustments-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>LP Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Original Qty</TableHead>
              <TableHead className="text-right">New Qty</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Adjusted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No adjustments found
                </TableCell>
              </TableRow>
            ) : (
              data.map((adjustment) => {
                const statusConfig = ADJUSTMENT_STATUS_CONFIG[adjustment.status]
                const reasonConfig = ADJUSTMENT_REASON_CONFIG[adjustment.reason_code]
                const variance = formatVariance(adjustment.variance_qty, adjustment.uom)
                const variancePct = calculateVariancePercent(adjustment.original_qty, adjustment.variance_qty)

                return (
                  <TableRow
                    key={adjustment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick?.(adjustment)}
                    data-testid="adjustment-row"
                    tabIndex={0}
                    role="button"
                    aria-label={`Adjustment for ${adjustment.lp_number}, ${adjustment.variance_qty} ${adjustment.uom}, status ${statusConfig.label}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick?.(adjustment)
                      }
                    }}
                  >
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(adjustment.adjustment_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-primary hover:underline">
                          {adjustment.lp_number}
                        </div>
                        {adjustment.batch_number && (
                          <div className="text-xs text-muted-foreground">
                            Batch: {adjustment.batch_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{adjustment.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {adjustment.product_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {adjustment.original_qty.toLocaleString()} {adjustment.uom}
                    </TableCell>
                    <TableCell className="text-right">
                      {adjustment.new_qty.toLocaleString()} {adjustment.uom}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={variance.className}>
                              <div>{variance.text}</div>
                              <div className="text-xs opacity-75">
                                {formatValue(adjustment.variance_value)}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{variancePct}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(reasonConfig.className, 'hover:' + reasonConfig.className)}
                      >
                        {reasonConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{adjustment.adjusted_by_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(statusConfig.className, 'hover:' + statusConfig.className)}
                        role="status"
                        aria-label={`Status: ${statusConfig.label}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {adjustment.status === 'pending' && canApprove ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onApprove?.(adjustment)}
                            aria-label="Approve adjustment"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onReject?.(adjustment)}
                            aria-label="Reject adjustment"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid="row-actions"
                              aria-label="Actions menu"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onRowClick?.(adjustment)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewLP?.(adjustment)}>
                              <Package className="h-4 w-4 mr-2" />
                              View LP
                            </DropdownMenuItem>
                            {adjustment.status === 'pending' && canApprove && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onApprove?.(adjustment)}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onReject?.(adjustment)}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * pagination.limit) + 1}-
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === pagination.pages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
