/**
 * Cycle Counts Table Component
 * Wireframe: WH-INV-001 - Cycle Counts Tab (Screen 5)
 * PRD: FR-023 (Cycle Count)
 */

'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Play, Edit, X, FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CycleCount, CycleCountPagination } from '@/lib/types/cycle-count'
import { CYCLE_COUNT_STATUS_CONFIG, CYCLE_COUNT_TYPE_CONFIG } from '@/lib/types/cycle-count'
import { format } from 'date-fns'

interface CycleCountsTableProps {
  data: CycleCount[]
  isLoading: boolean
  pagination: CycleCountPagination
  page: number
  onPageChange: (page: number) => void
  onRowClick?: (count: CycleCount) => void
  onStart?: (count: CycleCount) => void
  onContinue?: (count: CycleCount) => void
  onEdit?: (count: CycleCount) => void
  onCancel?: (count: CycleCount) => void
  onComplete?: (count: CycleCount) => void
  onViewReport?: (count: CycleCount) => void
  onExport?: (count: CycleCount) => void
}

export function CycleCountsTable({
  data,
  isLoading,
  pagination,
  page,
  onPageChange,
  onRowClick,
  onStart,
  onContinue,
  onEdit,
  onCancel,
  onComplete,
  onViewReport,
  onExport,
}: CycleCountsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg" data-testid="cycle-counts-loading">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Count #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const calculateProgress = (count: CycleCount): number => {
    if (count.total_items === 0) return 0
    return Math.round((count.counted_items / count.total_items) * 100)
  }

  const formatScheduledDate = (date: string): string => {
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch {
      return date
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto" data-testid="cycle-counts-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Count #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No cycle counts found
                </TableCell>
              </TableRow>
            ) : (
              data.map((count) => {
                const statusConfig = CYCLE_COUNT_STATUS_CONFIG[count.status]
                const typeConfig = CYCLE_COUNT_TYPE_CONFIG[count.count_type]
                const progress = calculateProgress(count)

                return (
                  <TableRow
                    key={count.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick?.(count)}
                    data-testid="cycle-count-row"
                    tabIndex={0}
                    role="button"
                    aria-label={`Cycle count ${count.count_number}, status ${statusConfig.label}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick?.(count)
                      }
                    }}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-primary hover:underline">
                          {count.count_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created by: {count.created_by_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(typeConfig.className, 'hover:' + typeConfig.className)}
                      >
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{count.warehouse_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {count.scope_details.lp_count} LPs
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{count.scope}</div>
                        {count.scope_details.locations && (
                          <div className="text-xs text-muted-foreground">
                            {count.scope_details.locations} locations
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatScheduledDate(count.scheduled_date)}</TableCell>
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
                    <TableCell>
                      {count.status === 'in_progress' ? (
                        <div className="space-y-1">
                          <Progress
                            value={progress}
                            className="h-2 w-24"
                            aria-label={`Progress: ${progress}%`}
                          />
                          <div className="text-xs text-muted-foreground">
                            {count.counted_items}/{count.total_items} ({progress}%)
                          </div>
                        </div>
                      ) : count.status === 'completed' ? (
                        <span className="text-sm text-muted-foreground">
                          {count.counted_items}/{count.total_items}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {count.total_items} items
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {count.status === 'completed' && count.accuracy_pct !== undefined ? (
                        <span
                          className={cn(
                            'font-medium',
                            count.accuracy_pct >= 98
                              ? 'text-green-600'
                              : count.accuracy_pct >= 95
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          )}
                        >
                          {count.accuracy_pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuItem onClick={() => onRowClick?.(count)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {count.status === 'planned' && (
                            <>
                              <DropdownMenuItem onClick={() => onStart?.(count)}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Count
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit?.(count)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onCancel?.(count)}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}

                          {count.status === 'in_progress' && (
                            <>
                              <DropdownMenuItem onClick={() => onContinue?.(count)}>
                                <Play className="h-4 w-4 mr-2" />
                                Continue Count
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onComplete?.(count)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Complete Count
                              </DropdownMenuItem>
                            </>
                          )}

                          {count.status === 'completed' && (
                            <>
                              <DropdownMenuItem onClick={() => onViewReport?.(count)}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onExport?.(count)}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
