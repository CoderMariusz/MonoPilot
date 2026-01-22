/**
 * Import Result Summary Component
 * Story 07.5: SO Clone/Import
 *
 * Summary of import results with success/error counts
 * - Success/error summary statistics
 * - List of created order numbers
 * - Error details for failed rows
 * - View Orders button (navigates to list)
 * - Download error report (CSV)
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import type { ImportDialogResult } from '@/lib/validation/sales-order-import'

// =============================================================================
// Types
// =============================================================================

interface ImportResultSummaryProps {
  /** Import result data */
  result: ImportDialogResult
  /** Callback when Close button is clicked */
  onClose: () => void
}

// =============================================================================
// Helpers
// =============================================================================

function downloadErrorsAsCSV(errors: ImportDialogResult['errors']): void {
  const headers = ['Row Number', 'Error Message']
  const rows = errors.map((err) => [err.row.toString(), `"${err.error.replace(/"/g, '""')}"`])
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// =============================================================================
// Component
// =============================================================================

export function ImportResultSummary({ result, onClose }: ImportResultSummaryProps) {
  const router = useRouter()

  const hasErrors = result.summary.errors_count > 0
  const hasSuccess = result.summary.orders_created > 0

  const handleViewOrders = () => {
    onClose()
    // Navigate to orders list filtered by today's creation date
    router.push('/shipping/sales-orders?created=today')
  }

  const handleDownloadErrors = () => {
    downloadErrorsAsCSV(result.errors)
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {!hasErrors ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex gap-3">
          <CheckCircle
            className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-green-900">Import successful</p>
            <p className="text-sm text-green-800 mt-0.5">
              {result.summary.orders_created} order
              {result.summary.orders_created !== 1 ? 's' : ''} created with{' '}
              {result.summary.lines_imported} line
              {result.summary.lines_imported !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ) : hasSuccess ? (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex gap-3">
          <AlertCircle
            className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-yellow-900">Import completed with errors</p>
            <p className="text-sm text-yellow-800 mt-0.5">
              {result.summary.orders_created} order
              {result.summary.orders_created !== 1 ? 's' : ''} created,{' '}
              {result.summary.errors_count} row
              {result.summary.errors_count !== 1 ? 's' : ''} skipped
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
          <AlertCircle
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-red-900">Import failed</p>
            <p className="text-sm text-red-800 mt-0.5">
              No orders were created. {result.summary.errors_count} row
              {result.summary.errors_count !== 1 ? 's' : ''} had errors.
            </p>
          </div>
        </div>
      )}

      {/* Created Orders */}
      {result.created_orders.length > 0 && (
        <div>
          <p className="font-medium text-sm mb-3 flex items-center gap-2">
            Created Orders
            <Badge variant="secondary">{result.created_orders.length}</Badge>
          </p>
          <div className="border rounded-lg divide-y max-h-48 overflow-auto">
            {result.created_orders.map((order) => (
              <div
                key={order.id}
                className="px-3 py-2 flex items-center justify-between hover:bg-muted/50"
              >
                <div>
                  <span className="font-medium text-sm">{order.order_number}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    - {order.customer_code}
                  </span>
                  <span className="text-muted-foreground text-xs ml-2">
                    ({order.lines_count} line{order.lines_count !== 1 ? 's' : ''})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    onClose()
                    router.push(`/shipping/sales-orders/${order.id}`)
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">View order {order.order_number}</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-sm flex items-center gap-2">
              Errors
              <Badge variant="destructive">{result.errors.length}</Badge>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadErrors}
              className="h-7"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Download Errors
            </Button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-auto space-y-1.5">
            {result.errors.map((err, idx) => (
              <p key={idx} className="text-xs text-red-700">
                <span className="font-medium">Row {err.row}:</span> {err.error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {hasSuccess && (
          <Button onClick={handleViewOrders}>
            <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
            View Orders
          </Button>
        )}
      </div>
    </div>
  )
}

export default ImportResultSummary
