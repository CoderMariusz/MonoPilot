'use client'

/**
 * CompleteReviewDialog Component
 * Story: 06.3 - Product Specifications
 *
 * Dialog for completing a review cycle on a specification.
 * Updates last_review_date and recalculates next_review_date.
 */

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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ClipboardCheck, Loader2 } from 'lucide-react'

export interface CompleteReviewDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Specification name */
  specName: string
  /** Current next review date */
  nextReviewDate?: string | null
  /** Review frequency in days */
  reviewFrequencyDays: number
  /** Whether completion is in progress */
  completing?: boolean
  /** Callback when completion is confirmed */
  onConfirm: (notes?: string) => void
}

export function CompleteReviewDialog({
  open,
  onOpenChange,
  specName,
  nextReviewDate,
  reviewFrequencyDays,
  completing = false,
  onConfirm,
}: CompleteReviewDialogProps) {
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNotes('')
    }
    onOpenChange(isOpen)
  }

  // Calculate new review date
  const calculateNewReviewDate = () => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + reviewFrequencyDays)
    return newDate.toLocaleDateString()
  }

  // Format date for display
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            Complete Review
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4">
              <p>
                Mark the review as complete for{' '}
                <span className="font-semibold">{specName}</span>.
              </p>

              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Review Date:</span>
                  <span className="font-medium">{formatDate(nextReviewDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Review Frequency:</span>
                  <span className="font-medium">{reviewFrequencyDays} days</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">New Review Date:</span>
                  <span className="font-medium text-green-700">
                    {calculateNewReviewDate()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this review..."
                  rows={3}
                  maxLength={1000}
                  disabled={completing}
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length}/1000 characters
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={completing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={completing}>
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Complete Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CompleteReviewDialog
