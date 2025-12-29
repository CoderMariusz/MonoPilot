/**
 * BOMItemsTable Component (Story 02.5a - MVP)
 * Displays BOM items in a table with all 4 states
 *
 * Features:
 * - 6 columns: Seq, Component, Type, Qty, UoM, Operation, Actions
 * - Type badges with color coding (RM, ING, PKG, WIP)
 * - Scrap percentage display (if > 0)
 * - Action buttons (Edit, Delete) with permission checks
 * - Total input summary footer
 * - All 4 UI states: loading, empty, error, success
 *
 * Acceptance Criteria:
 * - AC-01: Items list display within 500ms for 100 items
 * - AC-01-b: Row display with all fields
 * - AC-01-c: Scrap percentage display
 * - AC-09: Permission enforcement (canEdit prop)
 */

'use client'

import React, { useMemo } from 'react'
import { MoreHorizontal, Pencil, Trash2, Package, AlertCircle, RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { BOMItem, BOMItemProductType } from '@/lib/types/bom'

// ========================================
// Type Definitions
// ========================================

export interface BOMItemsTableProps {
  /** BOM ID for context */
  bomId: string
  /** List of BOM items to display */
  items: BOMItem[]
  /** Whether data is loading */
  isLoading?: boolean
  /** Error message if fetch failed */
  error?: string | null
  /** Whether user can edit (has technical.U/D permissions) */
  canEdit?: boolean
  /** BOM expected output quantity (for footer) */
  bomOutputQty?: number
  /** BOM expected output UoM (for footer) */
  bomOutputUom?: string
  /** Callback when Add button is clicked */
  onAdd?: () => void
  /** Callback when Edit is clicked on an item */
  onEdit?: (item: BOMItem) => void
  /** Callback when Delete is clicked on an item */
  onDelete?: (item: BOMItem) => void
  /** Callback to retry loading on error */
  onRetry?: () => void
}

// ========================================
// Type Badge Configuration
// ========================================

const TYPE_BADGE_CONFIG: Record<BOMItemProductType, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string; className: string }> = {
  RM: {
    variant: 'default',
    label: 'Raw Material',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ING: {
    variant: 'secondary',
    label: 'Ingredient',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  PKG: {
    variant: 'outline',
    label: 'Packaging',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  WIP: {
    variant: 'destructive',
    label: 'Work in Progress',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
}

// ========================================
// Helper Functions
// ========================================

/**
 * Format quantity with proper decimal places
 */
function formatQuantity(value: number): string {
  // Remove trailing zeros after decimal
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
}

/**
 * Format scrap percentage
 */
function formatScrapPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Calculate totals grouped by UoM
 */
function calculateTotalsByUom(items: BOMItem[]): Record<string, number> {
  return items.reduce((acc, item) => {
    const uom = item.uom
    if (!acc[uom]) {
      acc[uom] = 0
    }
    acc[uom] += item.quantity
    return acc
  }, {} as Record<string, number>)
}

/**
 * Format total input string
 */
function formatTotalInput(totals: Record<string, number>): string {
  const parts = Object.entries(totals)
    .map(([uom, qty]) => `${formatQuantity(qty)} ${uom}`)
  return parts.join(' + ') || '0'
}

// ========================================
// Sub-Components
// ========================================

/**
 * Type badge component for product types
 */
function ProductTypeBadge({ type }: { type: BOMItemProductType }) {
  const config = TYPE_BADGE_CONFIG[type] || TYPE_BADGE_CONFIG.RM

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className)}
      aria-label={`Product type: ${config.label}`}
      title={config.label}
    >
      {type}
    </Badge>
  )
}

/**
 * Loading skeleton rows
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-busy="true" aria-label="Loading BOM items">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 ml-auto" />
        </div>
      ))}
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ onAdd, canEdit }: { onAdd?: () => void; canEdit?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      role="status"
      aria-label="No BOM items"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No components added yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        A BOM needs at least one component to define the recipe.
      </p>
      {canEdit && onAdd && (
        <Button onClick={onAdd} size="lg">
          + Add First Component
        </Button>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Tip: Start by adding raw materials, then ingredients and packaging.
      </p>
    </div>
  )
}

/**
 * Error state component
 */
function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to Load BOM Items</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Actions dropdown menu for each row
 */
function ActionsDropdown({
  item,
  onEdit,
  onDelete,
}: {
  item: BOMItem
  onEdit?: (item: BOMItem) => void
  onDelete?: (item: BOMItem) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${item.product_name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit?.(item)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete?.(item)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ========================================
// Main Component
// ========================================

export function BOMItemsTable({
  bomId,
  items,
  isLoading = false,
  error = null,
  canEdit = true,
  bomOutputQty = 0,
  bomOutputUom = '',
  onAdd,
  onEdit,
  onDelete,
  onRetry,
}: BOMItemsTableProps) {
  // Sort items by sequence
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sequence - b.sequence),
    [items]
  )

  // Calculate totals by UoM
  const totalsByUom = useMemo(() => calculateTotalsByUom(sortedItems), [sortedItems])
  const totalInputDisplay = useMemo(() => formatTotalInput(totalsByUom), [totalsByUom])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">BOM Items</h3>
          {canEdit && (
            <Button size="sm" disabled>
              + Add Item
            </Button>
          )}
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">BOM Items</h3>
        </div>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    )
  }

  // Empty state
  if (sortedItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">BOM Items</h3>
          {canEdit && onAdd && (
            <Button size="sm" onClick={onAdd}>
              + Add Item
            </Button>
          )}
        </div>
        <div className="border rounded-lg">
          <EmptyState onAdd={onAdd} canEdit={canEdit} />
        </div>
      </div>
    )
  }

  // Success state - render table
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">BOM Items</h3>
        {canEdit && onAdd && (
          <Button size="sm" onClick={onAdd}>
            + Add Item
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table aria-label="BOM items table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]" aria-label="Sequence">Seq</TableHead>
              <TableHead className="min-w-[200px]" aria-label="Component">Component</TableHead>
              <TableHead className="w-[80px]" aria-label="Type">Type</TableHead>
              <TableHead className="w-[100px] text-right" aria-label="Quantity">Qty</TableHead>
              <TableHead className="w-[80px]" aria-label="Unit of Measure">UoM</TableHead>
              <TableHead className="w-[150px]" aria-label="Operation">Operation</TableHead>
              {canEdit && (
                <TableHead className="w-[60px] text-right" aria-label="Actions">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <React.Fragment key={item.id}>
                {/* Main row */}
                <TableRow>
                  <TableCell className="font-mono text-sm">{item.sequence}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.product_code}</div>
                      <div className="text-sm text-muted-foreground">{item.product_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductTypeBadge type={item.product_type} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatQuantity(item.quantity)}
                  </TableCell>
                  <TableCell>{item.uom}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.operation_seq
                      ? `Op ${item.operation_seq}: ${item.operation_name || 'Unknown'}`
                      : '-'}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <ActionsDropdown item={item} onEdit={onEdit} onDelete={onDelete} />
                    </TableCell>
                  )}
                </TableRow>
                {/* Sub-row for scrap (only if > 0) */}
                {item.scrap_percent > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell></TableCell>
                    <TableCell colSpan={canEdit ? 6 : 5} className="py-1">
                      <span className="text-xs text-muted-foreground">
                        Scrap: {formatScrapPercent(item.scrap_percent)}
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} className="text-sm">
                <div className="flex justify-between items-center">
                  <span>
                    <strong>Total Items:</strong> {sortedItems.length}
                  </span>
                  <span>
                    <strong>Total Input:</strong> {totalInputDisplay} |{' '}
                    <strong>Expected Output:</strong> {formatQuantity(bomOutputQty)} {bomOutputUom}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

export default BOMItemsTable
