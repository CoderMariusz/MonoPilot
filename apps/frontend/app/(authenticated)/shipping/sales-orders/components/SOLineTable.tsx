/**
 * SO Line Table Component
 * Story 07.4: SO Line Pricing
 *
 * Table displaying order lines with pricing columns:
 * - Unit Price, Discount, Line Total
 * - Edit and Delete actions
 */

'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SalesOrderService } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

interface LineDiscount {
  type: 'percent' | 'fixed'
  value: number
}

interface SOLine {
  id: string
  product: { name: string }
  quantity_ordered: number
  unit_price: number
  discount: LineDiscount | null
  line_total: number
}

interface SOLineTableProps {
  lines: SOLine[]
  onEdit: (lineId: string) => void
  onDelete: (lineId: string) => void
}

// =============================================================================
// Component
// =============================================================================

export function SOLineTable({ lines, onEdit, onDelete }: SOLineTableProps) {
  const formatDiscount = (discount: LineDiscount | null): string => {
    if (!discount) return '-'
    if (discount.type === 'percent') {
      return `${discount.value}%`
    }
    return SalesOrderService.formatCurrency(discount.value)
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Product</TableHead>
            <TableHead className="w-[100px] text-right">Qty</TableHead>
            <TableHead className="w-[100px] text-right">Unit Price</TableHead>
            <TableHead className="w-[100px] text-right">Discount</TableHead>
            <TableHead className="w-[120px] text-right">Line Total</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                No lines added
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">{line.product.name}</TableCell>
                <TableCell className="text-right">{line.quantity_ordered}</TableCell>
                <TableCell className="text-right">
                  {SalesOrderService.formatCurrency(line.unit_price)}
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {formatDiscount(line.discount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {SalesOrderService.formatCurrency(line.line_total)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(line.id)}
                      aria-label={`Edit line ${line.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => onDelete(line.id)}
                      aria-label={`Delete line ${line.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default SOLineTable
