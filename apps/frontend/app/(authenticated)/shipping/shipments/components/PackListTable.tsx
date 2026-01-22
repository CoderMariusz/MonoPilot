/**
 * PackListTable Component (Story 07.11)
 * Displays shipment boxes with collapsible contents
 *
 * Features:
 * - Sortable by box_number, weight
 * - Collapsible contents rows
 * - Edit/Delete actions when editable
 * - Responsive design
 * - Keyboard navigation
 */

'use client'

import React, { useState, useCallback } from 'react'
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
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Package,
  Plus,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface BoxContent {
  id: string
  product_id: string
  product_name: string
  product_sku?: string
  license_plate_id: string
  lp_number: string
  lot_number: string
  quantity: number
}

export interface ShipmentBox {
  id: string
  box_number: number
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  sscc: string | null
  tracking_number: string | null
  created_at: string
  contents: BoxContent[]
}

export interface PackListTableProps {
  boxes: ShipmentBox[]
  onEditBox?: (boxId: string) => void
  onDeleteBox?: (boxId: string) => void
  onAddBox?: () => void
  isEditable?: boolean
  className?: string
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatWeight(weight: number | null): string {
  if (weight === null || weight === undefined) return '-'
  return `${weight.toFixed(1)} kg`
}

function formatDimensions(
  length: number | null,
  width: number | null,
  height: number | null
): string {
  if (length === null && width === null && height === null) return '-'
  if (length !== null && width !== null && height !== null) {
    return `${length} x ${width} x ${height} cm`
  }
  return '-'
}

function formatItemCount(count: number): string {
  return count === 1 ? '1 item' : `${count} items`
}

// =============================================================================
// Component
// =============================================================================

export function PackListTable({
  boxes,
  onEditBox,
  onDeleteBox,
  onAddBox,
  isEditable = true,
  className,
}: PackListTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<'box_number' | 'weight'>(
    'box_number'
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Toggle row expansion
  const toggleRow = useCallback((boxId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(boxId)) {
        next.delete(boxId)
      } else {
        next.add(boxId)
      }
      return next
    })
  }, [])

  // Handle sort
  const handleSort = useCallback(
    (column: 'box_number' | 'weight') => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    },
    [sortColumn]
  )

  // Sort boxes
  const sortedBoxes = [...boxes].sort((a, b) => {
    let comparison = 0
    if (sortColumn === 'box_number') {
      comparison = a.box_number - b.box_number
    } else if (sortColumn === 'weight') {
      const weightA = a.weight ?? 0
      const weightB = b.weight ?? 0
      comparison = weightA - weightB
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, boxId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleRow(boxId)
      }
    },
    [toggleRow]
  )

  // Empty state
  if (boxes.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No boxes in this shipment</p>
        {isEditable && onAddBox && (
          <Button variant="outline" onClick={onAddBox}>
            <Plus className="h-4 w-4 mr-2" />
            Add first box
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('box_number')}
            >
              Box
              {sortColumn === 'box_number' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('weight')}
            >
              Weight
              {sortColumn === 'weight' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHead>
            <TableHead className="hidden md:table-cell">Dimensions</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>SSCC</TableHead>
            {isEditable && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBoxes.map((box) => {
            const isExpanded = expandedRows.has(box.id)

            return (
              <React.Fragment key={box.id}>
                <TableRow className="group">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(box.id)}
                      onKeyDown={(e) => handleKeyDown(e, box.id)}
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? `Collapse Box ${box.box_number}`
                          : `Expand Box ${box.box_number}`
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    Box {box.box_number}
                  </TableCell>
                  <TableCell>{formatWeight(box.weight)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDimensions(box.length, box.width, box.height)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatItemCount(box.contents.length)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {box.sscc ? (
                      <span className="font-mono text-xs">{box.sscc}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {isEditable && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onEditBox && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEditBox(box.id)}
                            aria-label={`Edit Box ${box.box_number}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteBox && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => onDeleteBox(box.id)}
                            aria-label={`Delete Box ${box.box_number}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={isEditable ? 7 : 6} className="p-0">
                      <div className="px-6 py-4">
                        {box.contents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No items in this box
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>LP Number</TableHead>
                                <TableHead>Lot Number</TableHead>
                                <TableHead className="text-right">
                                  Quantity
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {box.contents.map((content) => (
                                <TableRow key={content.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">
                                        {content.product_name}
                                      </p>
                                      {content.product_sku && (
                                        <p className="text-xs text-muted-foreground">
                                          {content.product_sku}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {content.lp_number}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {content.lot_number}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {content.quantity}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default PackListTable

// =============================================================================
// ShipmentsTable Component
// =============================================================================

export interface Shipment {
  id: string
  shipment_number: string
  status: string
  sales_order_id: string
  sales_order?: { order_number: string }
  customer_id: string
  customer?: { name: string }
  total_boxes: number
  total_weight: number | null
  carrier: string | null
  tracking_number: string | null
  created_at: string
  packed_at: string | null
}

export interface ShipmentsTableProps {
  shipments: Shipment[]
  onRowClick?: (shipmentId: string) => void
  className?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  packing: 'bg-blue-100 text-blue-800',
  packed: 'bg-green-100 text-green-800',
  manifested: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  exception: 'bg-red-100 text-red-800',
}

export function ShipmentsTable({
  shipments,
  onRowClick,
  className,
}: ShipmentsTableProps) {
  // Empty state
  if (shipments.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No shipments found</p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shipment #</TableHead>
            <TableHead>SO #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Boxes</TableHead>
            <TableHead className="text-right">Weight</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow
              key={shipment.id}
              className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
              onClick={() => onRowClick?.(shipment.id)}
            >
              <TableCell className="font-medium">
                {shipment.shipment_number}
              </TableCell>
              <TableCell>
                {shipment.sales_order?.order_number || shipment.sales_order_id}
              </TableCell>
              <TableCell>
                {shipment.customer?.name || shipment.customer_id}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    'capitalize',
                    statusColors[shipment.status] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {shipment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {shipment.total_boxes}
              </TableCell>
              <TableCell className="text-right">
                {formatWeight(shipment.total_weight)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
