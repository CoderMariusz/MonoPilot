/**
 * LP Error State Component
 * Story 05.1: License Plates UI
 */

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface LPErrorStateProps {
  onRetry: () => void
}

export function LPErrorState({ onRetry }: LPErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="error-state">
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertTriangle className="h-12 w-12 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load License Plates</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Unable to retrieve license plate data. Please check your connection and try again.
      </p>
      <div className="flex gap-2">
        <Button onClick={onRetry}>Retry</Button>
        <Button variant="outline" onClick={() => window.open('/support', '_blank')}>
          Contact Support
        </Button>
      </div>
    </div>
  )
}
