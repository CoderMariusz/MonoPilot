/**
 * Dashboard Error Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Error state for the shipping dashboard
 */

'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export interface DashboardErrorProps {
  error: Error
  onRetry: () => void
  cachedData?: {
    lastUpdated: string
  }
}

export function DashboardError({ error, onRetry, cachedData }: DashboardErrorProps) {
  return (
    <Alert variant="destructive" role="alert" data-testid="dashboard-error">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Dashboard</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>Failed to load: {error.message || 'An unexpected error occurred'}</p>

        {cachedData && (
          <p className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
            Showing cached data from {new Date(cachedData.lastUpdated).toLocaleString()}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default DashboardError
