'use client'

/**
 * WOResumeModal Component
 * Story: 04.2b - WO Pause/Resume
 *
 * A confirmation modal for resuming a paused work order. Displays pause context
 * (reason, duration, notes) and requires user confirmation before resuming.
 *
 * States:
 * - Initial (Confirmation View): Summary card displayed, buttons enabled
 * - Submitting: Loading spinner, buttons disabled
 * - API Error: Red error banner at top
 * - Success: Modal closes automatically
 */

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPauseReasonIcon } from './PauseReasonSelect'
import type { PauseReason } from '@/lib/validation/production-schemas'

/**
 * Pause info passed to the modal
 */
export interface PauseInfo {
  paused_at: string
  pause_reason: PauseReason
  pause_reason_label: string
  notes?: string
  paused_by_user: {
    id: string
    full_name: string
  }
  duration_so_far?: number // minutes
}

export interface WOResumeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrderId: string
  workOrderNumber: string
  pauseInfo: PauseInfo
  onSuccess: () => void
  onError: (error: Error) => void
}

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
}

/**
 * Format date for display
 */
function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WOResumeModal({
  open,
  onOpenChange,
  workOrderId,
  workOrderNumber,
  pauseInfo,
  onSuccess,
  onError,
}: WOResumeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [liveDuration, setLiveDuration] = useState(0)

  // Calculate live duration
  const calculateDuration = useCallback(() => {
    const pausedAt = new Date(pauseInfo.paused_at).getTime()
    const now = Date.now()
    return Math.floor((now - pausedAt) / 60000)
  }, [pauseInfo.paused_at])

  // Update duration every minute
  useEffect(() => {
    if (!open) return

    setLiveDuration(calculateDuration())

    const interval = setInterval(() => {
      setLiveDuration(calculateDuration())
    }, 60000)

    return () => clearInterval(interval)
  }, [open, calculateDuration])

  const { icon: ReasonIcon, color: reasonColor } = getPauseReasonIcon(pauseInfo.pause_reason)

  // Reset error when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setApiError(null)
    }
    onOpenChange(newOpen)
  }

  // Handle resume
  const handleResume = async () => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      const response = await fetch(`/api/production/work-orders/${workOrderId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to resume work order')
      }

      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resume work order')
      setApiError(error.message)
      onError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resume Work Order</DialogTitle>
          <DialogDescription>Ready to resume production?</DialogDescription>
        </DialogHeader>

        {/* API Error Banner */}
        {apiError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Pause Summary Card */}
        <Card className="mt-4 bg-slate-50 dark:bg-slate-900">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-sm mb-4">Pause Summary</h4>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Work Order</dt>
                <dd className="font-medium">{workOrderNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paused At</dt>
                <dd className="font-medium">{formatDateTime(pauseInfo.paused_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium" aria-live="polite">
                  {formatDuration(liveDuration)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="font-medium flex items-center gap-2">
                  <ReasonIcon className={cn('h-4 w-4', reasonColor)} />
                  {pauseInfo.pause_reason_label}
                </dd>
              </div>
              {pauseInfo.notes && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium text-right max-w-[200px] truncate" title={pauseInfo.notes}>
                    {pauseInfo.notes}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paused By</dt>
                <dd className="font-medium">{pauseInfo.paused_by_user.full_name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-4">
          Resuming will set the status back to &ldquo;In Progress&rdquo; and the pause duration will
          be recorded.
        </p>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleResume}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Production
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default WOResumeModal
