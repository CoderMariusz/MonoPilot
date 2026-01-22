/**
 * Import Preview Table Component
 * Story 07.5: SO Clone/Import
 *
 * Preview table showing CSV rows with validation status
 * - Table with 6 columns: Status, Customer, Product, Qty, Unit Price, Error
 * - Green checkmark for valid rows, red X for invalid
 * - Row count badge showing valid/total
 * - Scrollable container for many rows
 * - Error details in tooltip on hover
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import type { CSVPreviewRow } from '@/lib/validation/sales-order-import'

// =============================================================================
// Types
// =============================================================================

interface ImportPreviewTableProps {
  /** Parsed and validated CSV rows */
  rows: CSVPreviewRow[]
  /** Whether import is in progress */
  isImporting?: boolean
  /** Error message to display */
  error?: string | null
  /** Callback when Import button is clicked */
  onImport: () => Promise<void>
  /** Callback when Cancel button is clicked */
  onCancel: () => void
}

// =============================================================================
// Component
// =============================================================================

export function ImportPreviewTable({
  rows,
  isImporting = false,
  error = null,
  onImport,
  onCancel,
}: ImportPreviewTableProps) {
  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.length - validCount
  const canImport = validCount > 0 && !isImporting

  const handleImport = async () => {
    await onImport()
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Summary Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{validCount}</span> of{' '}
              <span className="font-medium text-foreground">{rows.length}</span> rows valid
            </p>
            {validCount > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                {validCount} valid
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                <X className="h-3 w-3 mr-1" aria-hidden="true" />
                {invalidCount} errors
              </Badge>
            )}
          </div>
        </div>

        {/* Table */}
        <div
          className={`border rounded-lg overflow-auto max-h-96 ${
            isImporting ? 'opacity-50 pointer-events-none' : ''
          }`}
          role="region"
          aria-label="CSV Preview Table"
          aria-busy={isImporting}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Status</TableHead>
                <TableHead>Customer Code</TableHead>
                <TableHead>Product Code</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.row}
                  className={row.valid ? 'bg-green-50/50' : 'bg-red-50/50'}
                >
                  <TableCell className="text-center">
                    {row.valid ? (
                      <Check
                        className="h-4 w-4 text-green-600 mx-auto"
                        aria-label="Valid row"
                      />
                    ) : (
                      <X
                        className="h-4 w-4 text-red-600 mx-auto"
                        aria-label="Invalid row"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {row.customer_code}
                  </TableCell>
                  <TableCell className="text-sm">{row.product_code}</TableCell>
                  <TableCell className="text-sm text-right">{row.quantity}</TableCell>
                  <TableCell className="text-sm text-right">
                    {row.unit_price || '(default)'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.error && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-red-600 underline decoration-dotted cursor-help inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" aria-hidden="true" />
                            Error
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p>{row.error}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Importing...
              </>
            ) : (
              `Import ${validCount} Order${validCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default ImportPreviewTable
