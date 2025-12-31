/**
 * WO Data Table Component
 * Story 03.10: Work Order CRUD
 * ShadCN DataTable with sorting, filtering, row selection per PLAN-013
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Printer,
  PlayCircle,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WOListItem, WOStatus, WOPriority } from '@/lib/types/work-order'
import { getRelativeDate, calculateProgress, canTransitionStatus } from '@/lib/types/work-order'
import { WOStatusBadge } from './WOStatusBadge'
import { WOPriorityIndicator } from './WOPriorityBadge'

interface WODataTableProps {
  data: WOListItem[]
  loading?: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onRowClick: (wo: WOListItem) => void
  onEdit?: (wo: WOListItem) => void
  onDelete?: (wo: WOListItem) => void
  onPlan?: (wo: WOListItem) => void
  onRelease?: (wo: WOListItem) => void
  onCancel?: (wo: WOListItem) => void
  onDuplicate?: (wo: WOListItem) => void
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (field: string, order: 'asc' | 'desc') => void
  className?: string
}

const COLUMNS = [
  { id: 'wo_number', label: 'WO Number', sortable: true, width: '150px' },
  { id: 'product', label: 'Product', sortable: true, width: '250px' },
  { id: 'status', label: 'Status', sortable: true, width: '120px' },
  { id: 'planned_quantity', label: 'Qty', sortable: true, width: '100px', align: 'right' as const },
  { id: 'planned_start_date', label: 'Scheduled Date', sortable: true, width: '120px' },
  { id: 'progress', label: 'Progress', sortable: false, width: '100px' },
  { id: 'actions', label: '', sortable: false, width: '80px', align: 'right' as const },
]

export function WODataTable({
  data,
  loading = false,
  selectedIds,
  onSelectionChange,
  onRowClick,
  onEdit,
  onDelete,
  onPlan,
  onRelease,
  onCancel,
  onDuplicate,
  sortField = 'created_at',
  sortOrder = 'desc',
  onSortChange,
  className,
}: WODataTableProps) {
  const router = useRouter()

  const allSelected = data.length > 0 && selectedIds.length === data.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map((wo) => wo.id))
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    }
  }

  const handleSort = (field: string) => {
    if (!onSortChange) return
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    onSortChange(field, newOrder)
  }

  const formatQuantity = (qty: number, uom: string) => {
    return `${qty.toLocaleString()} ${uom}`
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.id} style={{ width: col.width }}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
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
    )
  }

  return (
    <div className={cn('border rounded-lg', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) {
                    (ref as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected
                  }
                }}
                onCheckedChange={handleSelectAll}
                aria-label="Select all work orders"
              />
            </TableHead>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.id}
                style={{ width: col.width }}
                className={cn(
                  col.align === 'right' && 'text-right',
                  col.sortable && 'cursor-pointer select-none hover:bg-gray-50'
                )}
                onClick={() => col.sortable && handleSort(col.id)}
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
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 1} className="text-center py-8 text-gray-500">
                No work orders found
              </TableCell>
            </TableRow>
          ) : (
            data.map((wo) => {
              const progress = calculateProgress(wo.produced_quantity, wo.planned_quantity)
              const isSelected = selectedIds.includes(wo.id)
              const canEdit = wo.status === 'draft'
              const canDelete = wo.status === 'draft'
              const canPlan = canTransitionStatus(wo.status, 'planned')
              const canRelease = canTransitionStatus(wo.status, 'released')
              const canCancelWO = canTransitionStatus(wo.status, 'cancelled')

              return (
                <TableRow
                  key={wo.id}
                  className={cn(
                    'cursor-pointer hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-blue-50'
                  )}
                  onClick={() => onRowClick(wo)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectRow(wo.id, checked as boolean)
                      }
                      aria-label={`Select ${wo.wo_number}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-medium font-mono">{wo.wo_number}</span>
                      <WOPriorityIndicator priority={wo.priority} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{wo.product_name}</span>
                      <div className="text-sm text-gray-500">{wo.product_code}</div>
                      {wo.production_line_name && (
                        <div className="text-xs text-gray-400">
                          Line: {wo.production_line_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <WOStatusBadge status={wo.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(wo.planned_quantity, wo.uom)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span>
                        {wo.planned_start_date
                          ? new Date(wo.planned_start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </span>
                      <div className="text-xs text-gray-500">
                        {getRelativeDate(wo.planned_start_date)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            progress >= 100
                              ? 'bg-green-500'
                              : progress > 0
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          )}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu for {wo.wo_number}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onRowClick(wo)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canEdit && onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(wo)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canPlan && onPlan && (
                          <DropdownMenuItem onClick={() => onPlan(wo)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Plan
                          </DropdownMenuItem>
                        )}
                        {canRelease && onRelease && (
                          <DropdownMenuItem onClick={() => onRelease(wo)}>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Release
                          </DropdownMenuItem>
                        )}
                        {canCancelWO && onCancel && (
                          <DropdownMenuItem
                            onClick={() => onCancel(wo)}
                            className="text-orange-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onDuplicate && (
                          <DropdownMenuItem onClick={() => onDuplicate(wo)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate WO
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => window.print()}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        {canDelete && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(wo)}
                              className="text-red-600"
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
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default WODataTable
