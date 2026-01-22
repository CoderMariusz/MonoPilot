/**
 * RMAItemsTable Component
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * Displays RMA line items in a detail view with:
 * - Product info (code, name)
 * - Quantity expected vs received
 * - Lot number
 * - Reason notes
 * - Line-level disposition
 * - Edit/Delete actions (pending status only)
 *
 * Wireframe: RMA-003
 */

'use client'

import { useCallback } from 'react'
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
import { Pencil, Trash2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RMA_DISPOSITION_LABELS,
  type RMADisposition,
} from '@/lib/validation/rma-schemas'

export interface RMALineItem {
  id: string
  product_id: string
  product_code: string
  product_name: string
  quantity_expected: number
  quantity_received: number
  lot_number: string | null
  reason_notes: string | null
  disposition: RMADisposition | null
  created_at: string
}

interface RMAItemsTableProps {
  lines: RMALineItem[]
  loading?: boolean
  canEdit?: boolean
  onEdit?: (lineId: string) => void
  onDelete?: (lineId: string) => void
  testId?: string
}

export function RMAItemsTable({
  lines,
  loading = false,
  canEdit = false,
  onEdit,
  onDelete,
  testId = 'rma-items-table',
}: RMAItemsTableProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, lineId: string, action: 'edit' | 'delete') => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (action === 'edit') {
          onEdit?.(lineId)
        } else {
          onDelete?.(lineId)
        }
      }
    },
    [onEdit, onDelete]
  )

  // Loading state
  if (loading) {
    return (
      <div className="border rounded-md" data-testid={`${testId}-loading`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Qty Expected</TableHead>
              <TableHead>Qty Received</TableHead>
              <TableHead>Lot Number</TableHead>
              <TableHead>Disposition</TableHead>
              <TableHead>Notes</TableHead>
              {canEdit && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {canEdit && (
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
  if (!lines || lines.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 border rounded-md"
        data-testid={`${testId}-empty`}
      >
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No line items</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md" data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty Expected</TableHead>
            <TableHead className="text-right">Qty Received</TableHead>
            <TableHead>Lot Number</TableHead>
            <TableHead>Disposition</TableHead>
            <TableHead>Notes</TableHead>
            {canEdit && <TableHead className="w-20">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id} data-testid={`line-row-${line.id}`}>
              <TableCell>
                <div>
                  <span className="font-mono text-sm font-medium">
                    {line.product_code}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {line.product_name}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {line.quantity_expected.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <ReceiveProgress
                  expected={line.quantity_expected}
                  received={line.quantity_received}
                />
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {line.lot_number || '-'}
              </TableCell>
              <TableCell>
                {line.disposition ? (
                  <DispositionBadge disposition={line.disposition} />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    (use RMA)
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <p className="text-sm text-muted-foreground truncate">
                  {line.reason_notes || '-'}
                </p>
              </TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(line.id)}
                      onKeyDown={(e) => handleKeyDown(e, line.id, 'edit')}
                      aria-label={`Edit line ${line.product_code}`}
                      data-testid={`edit-line-${line.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete?.(line.id)}
                      onKeyDown={(e) => handleKeyDown(e, line.id, 'delete')}
                      aria-label={`Delete line ${line.product_code}`}
                      data-testid={`delete-line-${line.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Summary Row */}
      <div className="border-t px-4 py-3 bg-muted/30 flex justify-between items-center">
        <span className="text-sm font-medium">
          Total Lines: {lines.length}
        </span>
        <span className="text-sm text-muted-foreground">
          Total Expected: {lines.reduce((sum, l) => sum + l.quantity_expected, 0).toLocaleString()} |
          Total Received: {lines.reduce((sum, l) => sum + l.quantity_received, 0).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

/**
 * Receive Progress indicator
 */
function ReceiveProgress({
  expected,
  received,
}: {
  expected: number
  received: number
}) {
  const percentage = expected > 0 ? (received / expected) * 100 : 0
  const isComplete = received >= expected
  const isPartial = received > 0 && received < expected

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'font-medium',
          isComplete && 'text-green-600',
          isPartial && 'text-yellow-600'
        )}
      >
        {received.toLocaleString()}
      </span>
      {received > 0 && (
        <span className="text-xs text-muted-foreground">
          ({percentage.toFixed(0)}%)
        </span>
      )}
    </div>
  )
}

/**
 * Disposition Badge
 */
function DispositionBadge({ disposition }: { disposition: RMADisposition }) {
  const dispositionStyles: Record<RMADisposition, string> = {
    restock: 'bg-green-100 text-green-800',
    scrap: 'bg-red-100 text-red-800',
    quality_hold: 'bg-yellow-100 text-yellow-800',
    rework: 'bg-blue-100 text-blue-800',
  }

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-none', dispositionStyles[disposition])}
      data-testid={`disposition-badge-${disposition}`}
    >
      {RMA_DISPOSITION_LABELS[disposition]}
    </Badge>
  )
}

export { DispositionBadge }
