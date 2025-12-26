/**
 * BOMTimelineModal Component (Story 02.4)
 * Modal wrapper for BOM version timeline visualization
 *
 * Features:
 * - Full-width modal for timeline display
 * - Product info header
 * - Timeline component integration
 * - Navigation to BOM details on click
 * - All 4 UI states (loading, error, empty, success)
 *
 * Acceptance Criteria:
 * - AC-24 to AC-30: Timeline visualization in modal
 */

'use client'

import { useRouter } from 'next/navigation'
import { X, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useBOMTimeline } from '@/lib/hooks/use-boms'
import { BOMVersionTimeline } from './BOMVersionTimeline'

interface BOMTimelineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
  productCode?: string
  productName?: string
}

export function BOMTimelineModal({
  open,
  onOpenChange,
  productId,
  productCode,
  productName,
}: BOMTimelineModalProps) {
  const router = useRouter()

  // Fetch timeline data
  const {
    data: timeline,
    isLoading,
    error,
    refetch,
  } = useBOMTimeline(open ? productId : null)

  // Handle version click - navigate to BOM detail
  const handleVersionClick = (bomId: string) => {
    onOpenChange(false)
    router.push(`/technical/boms/${bomId}`)
  }

  // Product display info
  const displayCode = timeline?.product?.code || productCode || 'Unknown'
  const displayName = timeline?.product?.name || productName || 'Product'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>BOM Version Timeline</DialogTitle>
            </div>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono font-medium">{displayCode}</span>
            <span>-</span>
            <span>{displayName}</span>
            {timeline?.versions && (
              <Badge variant="secondary" className="ml-2">
                {timeline.versions.length} version
                {timeline.versions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Loading State */}
          {isLoading && (
            <div
              className="flex flex-col items-center justify-center py-12"
              role="status"
              aria-busy="true"
            >
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading timeline...
              </p>
              <div className="mt-6 w-full space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div
              className="flex flex-col items-center justify-center py-12"
              role="alert"
            >
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                Failed to Load Timeline
              </h3>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                {error instanceof Error
                  ? error.message
                  : 'Unable to load BOM timeline. Please try again.'}
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && timeline?.versions?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                No BOM Versions
              </h3>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                This product doesn't have any BOM versions yet. Create a BOM to
                start managing the bill of materials.
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  router.push(`/technical/boms/new?product_id=${productId}`)
                }}
                className="mt-4"
              >
                Create First BOM
              </Button>
            </div>
          )}

          {/* Success State - Timeline */}
          {!isLoading && !error && timeline?.versions && timeline.versions.length > 0 && (
            <div className="px-2">
              <BOMVersionTimeline
                versions={timeline.versions}
                currentDate={timeline.current_date || new Date().toISOString().split('T')[0]}
                onVersionClick={handleVersionClick}
              />

              {/* Legend */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Legend
                </h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400" />
                    <span className="text-sm">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300" />
                    <span className="text-sm">Draft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-400" />
                    <span className="text-sm">Phased Out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-200" />
                    <span className="text-sm">Inactive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white text-xs">Current</Badge>
                    <span className="text-sm">Currently Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BOMTimelineModal
