/**
 * SO Lines Table Component
 * Story 07.2: Sales Orders Core
 *
 * Displays sales order lines with:
 * - Product, quantity, pricing columns
 * - Allocation status (ordered/allocated/picked/packed/shipped)
 * - Line actions (Edit, Delete)
 * - Add line button
 */

'use client'

import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SalesOrderService, type SalesOrderLine } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

interface SOLinesTableProps {
  lines: SalesOrderLine[]
  editable?: boolean
  loading?: boolean
  onAddLine?: () => void
  onEditLine?: (line: SalesOrderLine) => void
  onDeleteLine?: (lineId: string) => void
  className?: string
}

// =============================================================================
// Column Configuration
// =============================================================================

const COLUMNS = [
  { id: 'line_number', label: '#', width: '50px' },
  { id: 'product_name', label: 'Product', width: '250px' },
  { id: 'quantity_ordered', label: 'Ordered', width: '100px', align: 'right' as const },
  { id: 'quantity_allocated', label: 'Allocated', width: '100px', align: 'right' as const },
  { id: 'quantity_picked', label: 'Picked', width: '100px', align: 'right' as const },
  { id: 'quantity_packed', label: 'Packed', width: '100px', align: 'right' as const },
  { id: 'quantity_shipped', label: 'Shipped', width: '100px', align: 'right' as const },
  { id: 'unit_price', label: 'Unit Price', width: '100px', align: 'right' as const },
  { id: 'discount', label: 'Discount', width: '100px', align: 'right' as const },
  { id: 'line_total', label: 'Line Total', width: '120px', align: 'right' as const },
]

// =============================================================================
// Component
// =============================================================================

export function SOLinesTable({
  lines,
  editable = false,
  loading = false,
  onAddLine,
  onEditLine,
  onDeleteLine,
  className,
}: SOLinesTableProps) {
  const formatDiscount = (line: SalesOrderLine): string => {
    if (!line.discount_type || !line.discount_value) return '-'
    if (line.discount_type === 'percent') {
      return `${line.discount_value}%`
    }
    return SalesOrderService.formatCurrency(line.discount_value)
  }

  const calculateLineTotal = (line: SalesOrderLine): number => {
    const discount = line.discount_type && line.discount_value != null
      ? { type: line.discount_type, value: line.discount_value }
      : null
    return SalesOrderService.calculateLineTotal(line.quantity_ordered, line.unit_price, discount)
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col.id} style={{ width: col.width }}>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              ))}
              {editable && (
                <TableHead style={{ width: '80px' }}>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {editable && (
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

  // Empty state
  if (lines.length === 0) {
    return (
      <div className={cn('border rounded-lg p-8 text-center', className)}>
        <p className="text-gray-500 mb-4">No lines added yet</p>
        {editable && onAddLine && (
          <Button onClick={onAddLine} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add First Line
          </Button>
        )}
      </div>
    )
  }

  // Calculate order total
  const orderTotal = lines.reduce((sum, line) => sum + calculateLineTotal(line), 0)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(col.align === 'right' && 'text-right')}
                >
                  {col.label}
                </TableHead>
              ))}
              {editable && (
                <TableHead style={{ width: '80px' }} className="text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id || line.line_number}>
                <TableCell className="font-medium">{line.line_number}</TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">
                      {line.product?.name || 'Unknown Product'}
                    </span>
                    {line.product?.code && (
                      <div className="text-sm text-gray-500">{line.product.code}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {line.quantity_ordered.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {(line.quantity_allocated || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-amber-600">
                  {(line.quantity_picked || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-purple-600">
                  {(line.quantity_packed || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {(line.quantity_shipped || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {SalesOrderService.formatCurrency(line.unit_price)}
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {formatDiscount(line)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {SalesOrderService.formatCurrency(calculateLineTotal(line))}
                </TableCell>
                {editable && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEditLine && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEditLine(line)}
                          aria-label={`Edit line ${line.line_number}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteLine && line.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => onDeleteLine(line.id!)}
                          aria-label={`Delete line ${line.line_number}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Total */}
      <div className="flex justify-end">
        <div className="bg-gray-50 rounded-lg p-4 text-right">
          <span className="text-gray-600 mr-4">Order Total:</span>
          <span className="text-xl font-bold">
            {SalesOrderService.formatCurrency(orderTotal)}
          </span>
        </div>
      </div>

      {/* Add Line Button */}
      {editable && onAddLine && (
        <Button onClick={onAddLine} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
      )}
    </div>
  )
}

export default SOLinesTable
