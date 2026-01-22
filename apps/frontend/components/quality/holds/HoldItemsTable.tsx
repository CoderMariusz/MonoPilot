/**
 * Hold Items Table Component
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.9: Display items table with reference links
 *
 * Shows items (LPs, WOs, batches) associated with a quality hold
 */

'use client'

import { Package, Factory, Barcode, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ReferenceType } from '@/lib/validation/quality-hold-validation'

export interface HoldItem {
  id: string
  hold_id: string
  reference_type: ReferenceType
  reference_id: string
  reference_display: string
  quantity_held?: number | null
  uom?: string | null
  location_id?: string | null
  location_name?: string | null
  notes?: string | null
  created_at: string
}

interface HoldItemsTableProps {
  items: HoldItem[]
  loading?: boolean
  className?: string
}

/**
 * Get icon for reference type
 */
function getReferenceIcon(type: ReferenceType) {
  switch (type) {
    case 'lp':
      return <Package className="h-4 w-4" />
    case 'wo':
      return <Factory className="h-4 w-4" />
    case 'batch':
      return <Barcode className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

/**
 * Get link for reference
 */
function getReferenceLink(type: ReferenceType, id: string): string | null {
  switch (type) {
    case 'lp':
      return `/warehouse/license-plates/${id}`
    case 'wo':
      return `/planning/work-orders/${id}`
    case 'batch':
      return null // Batch detail page not yet implemented
    default:
      return null
  }
}

/**
 * Get label for reference type
 */
function getReferenceTypeLabel(type: ReferenceType): string {
  switch (type) {
    case 'lp':
      return 'License Plate'
    case 'wo':
      return 'Work Order'
    case 'batch':
      return 'Batch'
    default:
      return type
  }
}

/**
 * Format quantity with UOM
 */
function formatQuantity(qty: number | null | undefined, uom: string | null | undefined): string {
  if (qty === null || qty === undefined) return '-'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(qty)
  return uom ? `${formatted} ${uom}` : formatted
}

export function HoldItemsTable({ items, loading, className }: HoldItemsTableProps) {
  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center',
          className
        )}
      >
        <Package className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm font-medium text-gray-900">No items on hold</p>
        <p className="mt-1 text-sm text-gray-500">
          This hold does not have any items associated with it.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const link = getReferenceLink(item.reference_type, item.reference_id)

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="flex w-fit items-center gap-1.5"
                  >
                    {getReferenceIcon(item.reference_type)}
                    {getReferenceTypeLabel(item.reference_type)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {link ? (
                    <Link
                      href={link}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.reference_display}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="font-mono">{item.reference_display}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatQuantity(item.quantity_held, item.uom)}
                </TableCell>
                <TableCell>
                  {item.location_name ? (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.location_name}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {item.notes ? (
                    <span className="truncate text-sm text-gray-600" title={item.notes}>
                      {item.notes}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Compact items list for card views
 */
interface HoldItemsListProps {
  items: HoldItem[]
  maxItems?: number
  className?: string
}

export function HoldItemsList({ items, maxItems = 3, className }: HoldItemsListProps) {
  if (!items || items.length === 0) {
    return <span className="text-sm text-gray-400">No items</span>
  }

  const displayItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  return (
    <div className={cn('space-y-1', className)}>
      {displayItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 text-sm"
        >
          {getReferenceIcon(item.reference_type)}
          <span className="font-mono text-gray-700">{item.reference_display}</span>
          {item.quantity_held && (
            <span className="text-gray-500">
              ({formatQuantity(item.quantity_held, item.uom)})
            </span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="text-sm text-gray-500">
          +{remainingCount} more item{remainingCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
