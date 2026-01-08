'use client'

/**
 * WOPauseModal Component
 * Story: 04.2b - WO Pause/Resume
 *
 * A modal dialog for pausing a work order. Requires a mandatory pause reason
 * selection and allows optional notes. Triggered by WOPauseButton.
 *
 * States:
 * - Initial (Empty Form): Reason dropdown empty, submit disabled
 * - Partial (Reason Selected): Submit enabled
 * - Submitting: Form disabled, showing spinner
 * - Validation Error: Red error text on reason field
 * - API Error: Red error banner at top
 * - Success: Modal closes automatically
 */

import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PauseReasonSelect, type PauseReasonSelectProps } from './PauseReasonSelect'
import type { PauseReason } from '@/lib/validation/production-schemas'

/**
 * Pause record returned from API
 */
export interface WOPauseRecord {
  id: string
  wo_number: string
  status: string
  paused_at: string
  paused_by_user_id: string
  paused_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  pause_reason?: string
  notes?: string
}

export interface WOPauseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrderId: string
  workOrderNumber: string
  onSuccess: (pauseRecord: WOPauseRecord) => void
  onError: (error: Error) => void
}

export function WOPauseModal({
  open,
  onOpenChange,
  workOrderId,
  workOrderNumber,
  onSuccess,
  onError,
}: WOPauseModalProps) {
  const [reason, setReason] = useState<PauseReason | undefined>()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const notesLength = notes.length
  const maxNotesLength = 500
  const isOverLimit = notesLength > maxNotesLength

  // Form validity
  const isValid = !!reason && !isOverLimit

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form state on close
      setReason(undefined)
      setNotes('')
      setApiError(null)
      setValidationError(null)
    }
    onOpenChange(newOpen)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate reason
    if (!reason) {
      setValidationError('Please select a pause reason')
      return
    }

    // Validate notes length
    if (isOverLimit) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    setValidationError(null)

    try {
      const response = await fetch(`/api/production/work-orders/${workOrderId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to pause work order')
      }

      const result = await response.json()
      onSuccess(result.data || result)
      handleOpenChange(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pause work order')
      setApiError(error.message)
      onError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reason change
  const handleReasonChange = (value: PauseReason) => {
    setReason(value)
    setValidationError(null)
  }

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pause Work Order</DialogTitle>
            <DialogDescription>
              Pausing work order <strong>{workOrderNumber}</strong>. Please select a reason.
            </DialogDescription>
          </DialogHeader>

          {/* API Error Banner */}
          {apiError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            {/* Work Order Number (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Work Order</Label>
              <div className="font-medium">{workOrderNumber}</div>
            </div>

            {/* Pause Reason (required) */}
            <div className="space-y-1.5">
              <Label htmlFor="pause-reason">
                Pause Reason <span className="text-red-500">*</span>
              </Label>
              <PauseReasonSelect
                value={reason}
                onValueChange={handleReasonChange}
                disabled={isSubmitting}
                error={validationError ?? undefined}
              />
            </div>

            {/* Notes (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="pause-notes">Notes (Optional)</Label>
              <Textarea
                id="pause-notes"
                placeholder="Add notes about the pause (optional)..."
                value={notes}
                onChange={handleNotesChange}
                disabled={isSubmitting}
                rows={3}
                className={cn(isOverLimit && 'border-red-500 focus-visible:ring-red-500')}
                aria-describedby="notes-count"
              />
              <div
                id="notes-count"
                className={cn(
                  'text-xs text-muted-foreground text-right',
                  isOverLimit && 'text-red-500'
                )}
              >
                {notesLength}/{maxNotesLength}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pausing...
                </>
              ) : (
                'Pause Work Order'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default WOPauseModal
