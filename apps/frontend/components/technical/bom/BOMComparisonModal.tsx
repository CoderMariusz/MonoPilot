/**
 * BOMComparisonModal Component (Story 02.14)
 * Side-by-side BOM version comparison with diff highlighting
 * FR-2.25: BOM Version Comparison
 *
 * Features:
 * - Version selector dropdowns (switch versions)
 * - Side-by-side table layout
 * - Diff highlighting (green=added, red=removed, yellow=modified)
 * - Summary stats (total changes, weight difference)
 * - Export to CSV
 * - All 4 UI states (loading, error, empty, success)
 * - Keyboard accessible
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  GitCompare,
  Plus,
  Minus,
  RefreshCw,
  ArrowRight,
  Download,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BOMVersionSelector } from './BOMVersionSelector'
import { DiffHighlighter, DiffRow, DiffBadge, getDiffRowClass } from './DiffHighlighter'
import { useBOMComparison, useBOMVersions } from '@/lib/hooks/use-bom-comparison'
import { cn } from '@/lib/utils'
import type {
  BomComparisonResponse,
  BomItemSummary,
  ModifiedItem,
  DiffType,
} from '@/lib/types/bom-advanced'

// ========================================
// Props Interface
// ========================================

export interface BOMComparisonModalProps {
  /** First BOM ID (base version) */
  bomId1: string
  /** Second BOM ID (compare version) */
  bomId2: string
  /** Product ID for version selector */
  productId: string
  /** Whether modal is open */
  isOpen: boolean
  /** Callback when modal closes */
  onClose: () => void
}

// ========================================
// Summary Card Component
// ========================================

interface SummaryCardProps {
  title: string
  value: number
  color: 'green' | 'red' | 'yellow' | 'gray'
  icon: React.ReactNode
}

function SummaryCard({ title, value, color, icon }: SummaryCardProps) {
  const colorStyles = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  const valueColors = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
  }

  return (
    <div className={cn('p-4 rounded-lg border', colorStyles[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className={cn('text-2xl font-bold', valueColors[color])}>{value}</p>
    </div>
  )
}

// ========================================
// Items Table Component
// ========================================

interface ItemsTableProps {
  title: string
  items: BomItemSummary[]
  type: 'added' | 'removed'
  icon: React.ReactNode
}

function ItemsTable({ title, items, type, icon }: ItemsTableProps) {
  if (items.length === 0) return null

  const rowClass = type === 'added' ? 'bg-green-50' : 'bg-red-50'
  const headerColor = type === 'added' ? 'text-green-700' : 'text-red-700'

  return (
    <AccordionItem value={type}>
      <AccordionTrigger className={cn('px-4', headerColor)}>
        <span className="flex items-center gap-2">
          {icon}
          {title} ({items.length})
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Scrap %</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={rowClass}>
                <TableCell>
                  <div>
                    <p className="font-medium font-mono">{item.component_code}</p>
                    <p className="text-sm text-muted-foreground">{item.component_name}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.quantity.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })} {item.uom}
                </TableCell>
                <TableCell className="text-right">
                  {item.scrap_percent > 0 ? `${item.scrap_percent.toFixed(1)}%` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.is_output ? 'Output' : 'Input'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  )
}

// ========================================
// Modified Items Table Component
// ========================================

interface ModifiedTableProps {
  items: ModifiedItem[]
}

function ModifiedTable({ items }: ModifiedTableProps) {
  if (items.length === 0) return null

  // Group modifications by component
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.component_id]) {
      acc[item.component_id] = {
        code: item.component_code,
        name: item.component_name,
        changes: [],
      }
    }
    acc[item.component_id].changes.push(item)
    return acc
  }, {} as Record<string, { code: string; name: string; changes: ModifiedItem[] }>)

  const fieldLabels: Record<string, string> = {
    quantity: 'Quantity',
    uom: 'Unit',
    scrap_percent: 'Scrap %',
    sequence: 'Sequence',
    operation_seq: 'Operation',
  }

  return (
    <AccordionItem value="modified">
      <AccordionTrigger className="px-4 text-yellow-700">
        <span className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Modified ({Object.keys(grouped).length} components, {items.length} changes)
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Field</TableHead>
              <TableHead className="text-right">Old Value</TableHead>
              <TableHead className="text-center"></TableHead>
              <TableHead className="text-right">New Value</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([componentId, group]) => (
              <React.Fragment key={componentId}>
                {group.changes.map((change, idx) => (
                  <TableRow key={`${componentId}-${change.field}`} className="bg-yellow-50">
                    {idx === 0 && (
                      <TableCell rowSpan={group.changes.length} className="align-top">
                        <div>
                          <p className="font-medium font-mono">{group.code}</p>
                          <p className="text-sm text-muted-foreground">{group.name}</p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {fieldLabels[change.field] || change.field}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono line-through text-muted-foreground">
                      {change.old_value}
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="h-4 w-4 text-yellow-600 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {change.new_value}
                    </TableCell>
                    <TableCell className="text-right">
                      {change.change_percent !== null && (
                        <span className={cn(
                          'text-sm',
                          change.change_percent > 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {change.change_percent > 0 ? '+' : ''}{change.change_percent.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  )
}

// ========================================
// BOMComparisonModal Component
// ========================================

export function BOMComparisonModal({
  bomId1: initialBomId1,
  bomId2: initialBomId2,
  productId,
  isOpen,
  onClose,
}: BOMComparisonModalProps) {
  // State for selected versions
  const [selectedBomId1, setSelectedBomId1] = useState(initialBomId1)
  const [selectedBomId2, setSelectedBomId2] = useState(initialBomId2)

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBomId1(initialBomId1)
      setSelectedBomId2(initialBomId2)
    }
  }, [isOpen, initialBomId1, initialBomId2])

  // Fetch comparison data
  const {
    data: comparison,
    isLoading,
    error,
    refetch,
  } = useBOMComparison(selectedBomId1, selectedBomId2, isOpen)

  // Export to CSV
  const handleExport = () => {
    if (!comparison) return

    const rows: string[][] = []

    // Header
    rows.push(['Type', 'Component Code', 'Component Name', 'Field', 'Old Value', 'New Value', 'Change %'])

    // Added items
    for (const item of comparison.differences.added) {
      rows.push(['Added', item.component_code, item.component_name, '', '', `${item.quantity} ${item.uom}`, ''])
    }

    // Removed items
    for (const item of comparison.differences.removed) {
      rows.push(['Removed', item.component_code, item.component_name, '', `${item.quantity} ${item.uom}`, '', ''])
    }

    // Modified items
    for (const item of comparison.differences.modified) {
      rows.push([
        'Modified',
        item.component_code,
        item.component_name,
        item.field,
        String(item.old_value),
        String(item.new_value),
        item.change_percent !== null ? `${item.change_percent.toFixed(1)}%` : '',
      ])
    }

    // Generate CSV
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bom-comparison-v${comparison.bom_1.version}-v${comparison.bom_2.version}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Check if versions are valid for comparison
  const canCompare = selectedBomId1 && selectedBomId2 && selectedBomId1 !== selectedBomId2

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare BOM Versions
          </DialogTitle>
          <DialogDescription>
            Select two versions to see what changed between them
          </DialogDescription>
        </DialogHeader>

        {/* Version Selectors */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b">
          <BOMVersionSelector
            productId={productId}
            selectedBomId={selectedBomId1}
            onChange={setSelectedBomId1}
            excludeBomId={selectedBomId2}
            label="Version 1 (Base)"
          />
          <BOMVersionSelector
            productId={productId}
            selectedBomId={selectedBomId2}
            onChange={setSelectedBomId2}
            excludeBomId={selectedBomId1}
            label="Version 2 (Compare)"
          />
        </div>

        {/* Content Area (scrollable) */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Comparison Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error.message}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Cannot Compare State */}
          {!canCompare && !isLoading && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select two different versions to compare</p>
            </div>
          )}

          {/* Success State */}
          {comparison && !isLoading && !error && (
            <div className="space-y-6">
              {/* Version Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Version {comparison.bom_1.version}</p>
                  <p className="font-medium">
                    {comparison.summary.total_items_v1} items
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {comparison.bom_1.status}
                  </Badge>
                </div>
                <ArrowRight className="h-8 w-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Version {comparison.bom_2.version}</p>
                  <p className="font-medium">
                    {comparison.summary.total_items_v2} items
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {comparison.bom_2.status}
                  </Badge>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <SummaryCard
                  title="Added"
                  value={comparison.summary.total_added}
                  color="green"
                  icon={<Plus className="h-4 w-4" />}
                />
                <SummaryCard
                  title="Removed"
                  value={comparison.summary.total_removed}
                  color="red"
                  icon={<Minus className="h-4 w-4" />}
                />
                <SummaryCard
                  title="Modified"
                  value={comparison.summary.total_modified}
                  color="yellow"
                  icon={<RefreshCw className="h-4 w-4" />}
                />
                <SummaryCard
                  title="Weight Change"
                  value={Math.round(comparison.summary.weight_change_percent)}
                  color="gray"
                  icon={comparison.summary.weight_change_percent > 0 ?
                    <Plus className="h-4 w-4" /> :
                    <Minus className="h-4 w-4" />
                  }
                />
              </div>

              {/* No Changes */}
              {comparison.summary.total_added === 0 &&
               comparison.summary.total_removed === 0 &&
               comparison.summary.total_modified === 0 && (
                <Alert>
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>No Differences</AlertTitle>
                  <AlertDescription>
                    These two versions have identical items.
                  </AlertDescription>
                </Alert>
              )}

              {/* Differences Accordion */}
              {(comparison.summary.total_added > 0 ||
                comparison.summary.total_removed > 0 ||
                comparison.summary.total_modified > 0) && (
                <Accordion
                  type="multiple"
                  defaultValue={['added', 'removed', 'modified']}
                  className="border rounded-lg"
                >
                  <ItemsTable
                    title="Added Items"
                    items={comparison.differences.added}
                    type="added"
                    icon={<Plus className="h-4 w-4" />}
                  />
                  <ItemsTable
                    title="Removed Items"
                    items={comparison.differences.removed}
                    type="removed"
                    icon={<Minus className="h-4 w-4" />}
                  />
                  <ModifiedTable items={comparison.differences.modified} />
                </Accordion>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!comparison || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Comparison
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BOMComparisonModal
