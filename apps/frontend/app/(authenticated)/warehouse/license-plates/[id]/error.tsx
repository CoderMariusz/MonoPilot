/**
 * License Plate Detail Error Boundary
 * Story 05.6: LP Detail Page
 *
 * Error state with retry button
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function LicensePlateDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('LP Detail Error:', error)
  }, [error])

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="lp-detail-error">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/warehouse/license-plates')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to License Plates
        </Button>
      </div>

      {/* Error Alert */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to Load License Plate</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>Unable to retrieve license plate information from the server.</p>

          <div className="space-y-2">
            <p className="font-medium">Error Details:</p>
            <p className="text-sm font-mono bg-destructive/10 p-2 rounded">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="text-sm text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-medium">Possible Causes:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>License plate does not exist</li>
              <li>You don&apos;t have permission to view this license plate</li>
              <li>Network connectivity issue</li>
              <li>Server temporarily unavailable</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/warehouse/license-plates')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to LP List
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Helpful Info */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">Need Help?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>If you continue to experience issues:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your internet connection</li>
            <li>Verify the license plate number is correct</li>
            <li>Try refreshing the page</li>
            <li>Contact your system administrator if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
