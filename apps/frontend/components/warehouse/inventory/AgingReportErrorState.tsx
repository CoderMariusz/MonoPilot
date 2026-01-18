/**
 * AgingReportErrorState Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Error state for aging report when data fetch fails.
 */

'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AgingReportErrorStateProps {
  error: Error | null
  onRetry: () => void
}

export function AgingReportErrorState({
  error,
  onRetry,
}: AgingReportErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="aging-report-error-state"
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertCircle
          className="h-12 w-12 text-red-600"
          aria-hidden="true"
        />
      </div>

      <h3 className="text-lg font-semibold mb-2">Failed to Load Aging Report</h3>

      <p className="text-muted-foreground max-w-md mb-2">
        Unable to retrieve aging report data. Please check your connection and try again.
      </p>

      {error && (
        <p className="text-sm text-muted-foreground mb-6 font-mono bg-muted px-3 py-1 rounded">
          Error: {error.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={onRetry}>
          Retry
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open('/support', '_blank')}
        >
          Contact Support
        </Button>
      </div>
    </div>
  )
}
