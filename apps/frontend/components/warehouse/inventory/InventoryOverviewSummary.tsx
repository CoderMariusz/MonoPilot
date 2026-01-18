/**
 * Inventory Overview Summary Component
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Summary bar showing:
 * - "Showing X-Y of Z items"
 * - Total LPs, Total Qty, Total Value
 * - Export buttons (CSV, Excel)
 */

'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { InventorySummary, InventoryPagination } from '@/lib/types/inventory-overview'
import { FileDown, FileSpreadsheet, Package, Scale, DollarSign } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

// =============================================================================
// Types
// =============================================================================

interface InventoryOverviewSummaryProps {
  summary: InventorySummary
  pagination: InventoryPagination
  onExportCSV: () => void
  onExportExcel: () => void
  isExporting?: boolean
  isLoading?: boolean
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function SummarySkeleton() {
  return (
    <div
      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg"
      data-testid="summary-skeleton"
    >
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function InventoryOverviewSummary({
  summary,
  pagination,
  onExportCSV,
  onExportExcel,
  isExporting = false,
  isLoading = false,
}: InventoryOverviewSummaryProps) {
  if (isLoading) {
    return <SummarySkeleton />
  }

  const { total_lps, total_qty, total_value } = summary
  const { page, limit, total } = pagination
  const start = total > 0 ? (page - 1) * limit + 1 : 0
  const end = Math.min(page * limit, total)

  return (
    <div
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg"
      data-testid="inventory-overview-summary"
      role="region"
      aria-label="Inventory summary"
    >
      {/* Summary Stats */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6">
        {/* Pagination Info */}
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{start}-{end}</span> of{' '}
          <span className="font-medium text-foreground">{total}</span> items
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-px bg-border" aria-hidden="true" />

        {/* Totals */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">{formatNumber(total_lps)} LPs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">{formatNumber(total_qty)} kg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">{formatCurrency(total_value)}</span>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          disabled={isExporting || total === 0}
          data-testid="export-csv"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          disabled={isExporting || total === 0}
          data-testid="export-excel"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Mobile Summary (Stacked)
// =============================================================================

export function InventoryOverviewSummaryMobile({
  summary,
  pagination,
  onExportCSV,
  onExportExcel,
  isExporting = false,
}: InventoryOverviewSummaryProps) {
  const { total_lps, total_qty, total_value } = summary
  const { page, limit, total } = pagination
  const start = total > 0 ? (page - 1) * limit + 1 : 0
  const end = Math.min(page * limit, total)

  return (
    <div
      className="space-y-4 p-4 bg-muted/50 rounded-lg md:hidden"
      data-testid="inventory-overview-summary-mobile"
    >
      {/* Pagination Info */}
      <div className="text-sm text-center text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}-{end}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> items
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-background rounded-md">
          <div className="text-xs text-muted-foreground">LPs</div>
          <div className="font-semibold">{formatNumber(total_lps)}</div>
        </div>
        <div className="p-2 bg-background rounded-md">
          <div className="text-xs text-muted-foreground">Qty</div>
          <div className="font-semibold">{formatNumber(total_qty)}</div>
        </div>
        <div className="p-2 bg-background rounded-md">
          <div className="text-xs text-muted-foreground">Value</div>
          <div className="font-semibold">{formatCurrency(total_value)}</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          disabled={isExporting || total === 0}
          className="flex-1"
        >
          <FileDown className="h-4 w-4 mr-2" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          disabled={isExporting || total === 0}
          className="flex-1"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel
        </Button>
      </div>
    </div>
  )
}
