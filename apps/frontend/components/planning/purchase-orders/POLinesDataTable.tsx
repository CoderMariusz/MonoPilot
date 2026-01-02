/**
 * PO Lines Data Table Component
 * Story 03.3: PO CRUD + Lines
 * Editable lines DataTable per PLAN-005
 */

'use client'

import { useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { POLine, Currency } from '@/lib/types/purchase-order'

interface POLinesDataTableProps {
  lines: POLine[]
  currency: Currency
  isEditable?: boolean
  isLoading?: boolean
  onAddLine?: () => void
  onEditLine?: (lineId: string) => void
  onDeleteLine?: (lineId: string) => void
  className?: string
}

const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const getLineStatusBadge = (status: POLine['status']) => {
  switch (status) {
    case 'complete':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
          OK
        </Badge>
      )
    case 'partial':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
          Partial
        </Badge>
      )
    case 'pending':
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
          0%
        </Badge>
      )
  }
}

export function POLinesDataTable({
  lines,
  currency,
  isEditable = false,
  isLoading = false,
  onAddLine,
  onEditLine,
  onDeleteLine,
  className,
}: POLinesDataTableProps) {
  const columns: ColumnDef<POLine>[] = useMemo(
    () => [
      {
        accessorKey: 'line_number',
        header: '#',
        cell: ({ row }) => (
          <span className="text-muted-foreground font-medium">
            {row.original.line_number}
          </span>
        ),
        size: 40,
      },
      {
        id: 'product',
        header: 'Product',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.product?.name || '-'}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.product?.code || ''}
            </div>
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.quantity} {row.original.uom}
          </span>
        ),
        size: 80,
      },
      {
        id: 'received',
        header: 'Received',
        cell: ({ row }) => (
          <div>
            <span className="font-medium">
              {row.original.received_qty} {row.original.uom}
            </span>
            {row.original.remaining_qty > 0 && (
              <div className="text-xs text-muted-foreground">
                {row.original.remaining_qty} remaining
              </div>
            )}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'unit_price',
        header: 'Unit Price',
        cell: ({ row }) => (
          <span>{formatCurrency(row.original.unit_price, currency)}</span>
        ),
        size: 100,
      },
      {
        id: 'tax',
        header: 'Tax',
        cell: ({ row }) => <span>{row.original.tax_rate}%</span>,
        size: 60,
      },
      {
        accessorKey: 'line_total',
        header: 'Line Total',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.line_total, currency)}
          </span>
        ),
        size: 100,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => getLineStatusBadge(row.original.status),
        size: 80,
      },
      ...(isEditable
        ? [
            {
              id: 'actions',
              cell: ({ row }: { row: { original: POLine } }) => (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditLine?.(row.original.id)}
                    aria-label={`Edit line ${row.original.line_number}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteLine?.(row.original.id)}
                    aria-label={`Delete line ${row.original.line_number}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
              size: 80,
            } as ColumnDef<POLine>,
          ]
        : []),
    ],
    [currency, isEditable, onEditLine, onDeleteLine]
  )

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="p-4 border-b flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          {isEditable && <Skeleton className="h-9 w-24" />}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-12" />
              </TableHead>
              {isEditable && (
                <TableHead>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                {isEditable && (
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg', className)}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">PO Lines</h3>
        {isEditable && (
          <Button size="sm" onClick={onAddLine} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Line
          </Button>
        )}
      </div>

      {/* Table */}
      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-3">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No Lines Added Yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add products to your purchase order to continue.
          </p>
          {isEditable && (
            <Button onClick={onAddLine} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Line
            </Button>
          )}
        </div>
      ) : (
        <>
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
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50/50 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {lines.length} {lines.length === 1 ? 'Line' : 'Lines'}
            </span>
            {isEditable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddLine}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Line
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default POLinesDataTable
