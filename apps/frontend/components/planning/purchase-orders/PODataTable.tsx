/**
 * PO Data Table Component
 * Story 03.3: PO CRUD + Lines
 * DataTable with sorting, filtering, row selection per PLAN-004
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table'
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
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  X,
  Copy,
  Printer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LegacyPOStatusBadge as POStatusBadge } from './POStatusBadge'
import type { POListItem, POStatus } from '@/lib/types/purchase-order'
import { getRelativeDeliveryDate, isOverdue, canEditPO } from '@/lib/types/purchase-order'

interface PODataTableProps {
  data: POListItem[]
  isLoading?: boolean
  onRowClick?: (po: POListItem) => void
  onSelectionChange?: (ids: string[]) => void
  onEdit?: (po: POListItem) => void
  onSubmit?: (po: POListItem) => void
  onCancel?: (po: POListItem) => void
  onDuplicate?: (po: POListItem) => void
  onPrint?: (po: POListItem) => void
  className?: string
  /** Story 03.6: Enable row selection */
  selectable?: boolean
  /** Story 03.6: Currently selected row IDs */
  selectedIds?: string[]
  /** Story 03.6: Callback when a single row is selected */
  onRowSelect?: (id: string, selected: boolean) => void
  /** Story 03.6: Callback to select/deselect all rows */
  onSelectAll?: (selected: boolean) => void
  /** Story 03.6: Whether all rows are selected */
  isAllSelected?: boolean
  /** Story 03.6: Whether some but not all rows are selected */
  isPartiallySelected?: boolean
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PODataTable({
  data,
  isLoading = false,
  onRowClick,
  onSelectionChange,
  onEdit,
  onSubmit,
  onCancel,
  onDuplicate,
  onPrint,
  className,
  // Story 03.6: Selection props (accepted but may use internal state)
  selectable: _selectable,
  selectedIds: _selectedIds,
  onRowSelect: _onRowSelect,
  onSelectAll: _onSelectAll,
  isAllSelected: _isAllSelected,
  isPartiallySelected: _isPartiallySelected,
}: PODataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Update selection callback
  const handleSelectionChange = useCallback(
    (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue;
      setRowSelection(newSelection)
      const selectedIds = Object.keys(newSelection).filter((key) => newSelection[key])
      onSelectionChange?.(selectedIds.map((idx) => data[parseInt(idx)]?.id).filter(Boolean))
    },
    [data, onSelectionChange, rowSelection]
  )

  const columns: ColumnDef<POListItem>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select row ${row.index + 1}`}
            className="translate-y-[2px]"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: 'po_number',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[sorting=true]:text-primary"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            PO Number
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-mono font-medium text-sm">
            {row.original.po_number}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'supplier_name',
        header: 'Vendor',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.supplier_name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.lines_count} {row.original.lines_count === 1 ? 'line' : 'lines'}
            </div>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <POStatusBadge status={row.original.status as POStatus} size="sm" />
            {row.original.status === 'receiving' && row.original.receive_percent > 0 && (
              <span className="text-xs text-muted-foreground">
                {row.original.receive_percent}% received
              </span>
            )}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            {formatCurrency(row.original.total, row.original.currency)}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'expected_delivery_date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Expected Delivery
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => {
          const dateStr = row.original.expected_delivery_date
          const overdue = isOverdue(row.original as { expected_delivery_date: string; status: POStatus })
          return (
            <div>
              <div className={cn(overdue && 'text-red-600 font-medium')}>
                {formatDate(dateStr)}
              </div>
              <div className={cn('text-xs', overdue ? 'text-red-500' : 'text-muted-foreground')}>
                {getRelativeDeliveryDate(dateStr)}
              </div>
            </div>
          )
        },
        size: 140,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const po = row.original
          const canEdit = canEditPO(po.status as POStatus)

          return (
            <div className="flex items-center gap-1">
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(po)
                  }}
                  aria-label={`Edit ${po.po_number}`}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/planning/purchase-orders/${po.id}`)
                  }}
                  aria-label={`View ${po.po_number}`}
                >
                  View
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`More actions for ${po.po_number}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/planning/purchase-orders/${po.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit?.(po)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {po.status === 'draft' && (
                    <DropdownMenuItem onClick={() => onSubmit?.(po)}>
                      <Send className="mr-2 h-4 w-4" />
                      Submit for Approval
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDuplicate?.(po)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate PO
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPrint?.(po)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print PO
                  </DropdownMenuItem>
                  {!['closed', 'cancelled', 'receiving'].includes(po.status) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onCancel?.(po)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel PO
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        size: 120,
      },
    ],
    [router, onEdit, onSubmit, onCancel, onDuplicate, onPrint]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: handleSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  if (isLoading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-32" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-28" />
              </TableHead>
              <TableHead className="w-24">
                <Skeleton className="h-4 w-16" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
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
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No purchase orders found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick?.(row.original)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRowClick?.(row.original)
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default PODataTable
