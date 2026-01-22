/**
 * TrackingDialog Component
 * Story 07.14: Shipment Manifest & Ship + Tracking
 *
 * Modal dialog displaying tracking information and timeline
 * - Fetches tracking data on open
 * - Loading/error/success states
 * - External tracking link
 * - Keyboard accessible
 */

'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Loader2, AlertCircle, RefreshCw, Truck } from 'lucide-react'
import { TrackingTimeline, type Timeline, type ShipmentStatusType } from './TrackingTimeline'
import { useShipmentManifest } from '@/lib/hooks/use-shipment-manifest'

// =============================================================================
// Types
// =============================================================================

export interface TrackingDialogProps {
  isOpen: boolean
  onClose: () => void
  shipmentId: string
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function TrackingLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-gray-900 font-medium mb-2">Failed to load tracking information</p>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function TrackingDialog({ isOpen, onClose, shipmentId }: TrackingDialogProps) {
  const { trackingInfo, isLoadingTracking, trackingError, fetchTracking, refetchTracking } =
    useShipmentManifest(shipmentId, { enabled: false })

  // Fetch tracking when dialog opens
  useEffect(() => {
    if (isOpen && shipmentId) {
      fetchTracking()
    }
  }, [isOpen, shipmentId, fetchTracking])

  const handleRetry = () => {
    refetchTracking()
  }

  const handleTrackOnline = () => {
    if (trackingInfo?.external_url) {
      window.open(trackingInfo.external_url, '_blank', 'noopener,noreferrer')
    }
  }

  const hasTrackingNumber = !!trackingInfo?.tracking_number
  const externalUrl = trackingInfo?.external_url

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        aria-label="Shipment tracking information"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Shipment Tracking
          </DialogTitle>
          <DialogDescription>
            Track the status and timeline of your shipment
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoadingTracking ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tracking information...
              </p>
              <TrackingLoadingSkeleton />
            </div>
          ) : trackingError ? (
            <ErrorState
              message={trackingError instanceof Error ? trackingError.message : 'Unknown error'}
              onRetry={handleRetry}
            />
          ) : trackingInfo ? (
            <div className="space-y-6">
              {/* Carrier Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Carrier Information</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Carrier:</span>
                  <span className="font-medium">{trackingInfo.carrier || 'Not specified'}</span>

                  <span className="text-gray-500">Tracking Number:</span>
                  <span className="font-medium font-mono">
                    {trackingInfo.tracking_number || 'Not available'}
                  </span>

                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium capitalize">
                    {trackingInfo.status.replace('_', ' ')}
                  </span>
                </div>

                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Track Online
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Shipment Timeline</h4>
                <TrackingTimeline
                  timeline={trackingInfo.timeline}
                  currentStatus={trackingInfo.status as ShipmentStatusType}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex gap-2">
          {hasTrackingNumber && externalUrl ? (
            <Button variant="outline" onClick={handleTrackOnline}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Track Online
            </Button>
          ) : (
            <Button variant="outline" disabled title="No tracking number available">
              <ExternalLink className="h-4 w-4 mr-2" />
              Track Online
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TrackingDialog
