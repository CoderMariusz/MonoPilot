'use client'

/**
 * CompleteOperationModal Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Modal to capture yield percentage and notes when completing an operation.
 * Includes all states: loading (submitting), validation error, API error, success.
 */

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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, Clock, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { YieldInput } from './YieldInput'
import { DurationDisplay, formatDuration } from './DurationDisplay'

export interface WOOperation {
  id: string
  sequence: number
  operation_name: string
  status: string
  started_at: string | null
  expected_duration_minutes: number | null
  expected_yield_percent?: number | null
}

export interface CompleteOperationInput {
  actual_yield_percent: number
  notes?: string
}

export interface CompleteOperationModalProps {
  /** Operation to complete */
  operation: WOOperation | null
  /** Work order ID */
  woId: string
  /** Work order number for display */
  woNumber: string
  /** Current user name */
  operatorName?: string
  /** Total operations count */
  totalOperations?: number
  /** Modal open state */
  open: boolean
  /** Callback to close modal */
  onClose: () => void
  /** Callback on successful complete */
  onComplete: (input: CompleteOperationInput) => Promise<void>
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function calculateDuration(startedAt: string | null): number {
  if (!startedAt) return 0
  const start = new Date(startedAt)
  const now = new Date()
  return Math.round((now.getTime() - start.getTime()) / 60000)
}

export function CompleteOperationModal({
  operation,
  woId,
  woNumber,
  operatorName,
  totalOperations,
  open,
  onClose,
  onComplete,
}: CompleteOperationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [yieldPercent, setYieldPercent] = useState(100)
  const [yieldError, setYieldError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [notesError, setNotesError] = useState<string | null>(null)
  const [currentDuration, setCurrentDuration] = useState(0)
  const { toast } = useToast()

  // Reset form when modal opens
  useEffect(() => {
    if (open && operation) {
      const defaultYield = operation.expected_yield_percent ?? 100
      setYieldPercent(defaultYield)
      setYieldError(null)
      setNotes('')
      setNotesError(null)
      setCurrentDuration(calculateDuration(operation.started_at))
    }
  }, [open, operation])

  // Update duration every minute
  useEffect(() => {
    if (!open || !operation?.started_at) return

    const interval = setInterval(() => {
      setCurrentDuration(calculateDuration(operation.started_at))
    }, 60000)

    return () => clearInterval(interval)
  }, [open, operation?.started_at])

  // Validate yield
  const validateYield = useCallback((value: number): boolean => {
    if (value < 0) {
      setYieldError('Yield must be between 0% and 100%')
      return false
    }
    if (value > 100) {
      setYieldError('Yield must be between 0% and 100%')
      return false
    }
    setYieldError(null)
    return true
  }, [])

  // Validate notes
  const validateNotes = useCallback((value: string): boolean => {
    if (value.length > 2000) {
      setNotesError('Notes cannot exceed 2000 characters')
      return false
    }
    setNotesError(null)
    return true
  }, [])

  const handleYieldChange = (value: number) => {
    setYieldPercent(value)
    validateYield(value)
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNotes(value)
    validateNotes(value)
  }

  const handleSubmit = async () => {
    if (!operation) return

    // Validate
    const isYieldValid = validateYield(yieldPercent)
    const isNotesValid = validateNotes(notes)

    if (!isYieldValid || !isNotesValid) {
      return
    }

    setIsSubmitting(true)

    try {
      await onComplete({
        actual_yield_percent: yieldPercent,
        notes: notes || undefined,
      })

      toast({
        title: 'Success',
        description: `Operation '${operation.operation_name}' completed with ${yieldPercent.toFixed(1)}% yield`,
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to complete operation',
        variant: 'destructive',
      })
      // Modal stays open for retry
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && !yieldError && !notesError) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!operation) return null

  const hasErrors = !!yieldError || !!notesError

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-[500px]"
        onKeyDown={handleKeyDown}
        aria-describedby="complete-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Complete Operation: {operation.operation_name}
          </DialogTitle>
          <DialogDescription id="complete-modal-description">
            Complete operation for work order <strong>{woNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Operation Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            {totalOperations && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sequence</span>
                <span className="font-medium">
                  Operation {operation.sequence} of {totalOperations}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Started
              </span>
              <span className="font-medium">
                {formatDate(operation.started_at)} {formatTime(operation.started_at)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration (auto)</span>
              <span className="font-medium" aria-live="polite">
                {formatDuration(currentDuration)}
              </span>
            </div>

            {operation.expected_duration_minutes && (
              <div className="text-sm">
                <DurationDisplay
                  expected={operation.expected_duration_minutes}
                  actual={currentDuration}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Yield Input */}
          <div className="space-y-2">
            <YieldInput
              value={yieldPercent}
              onChange={handleYieldChange}
              error={yieldError || undefined}
              disabled={isSubmitting}
              label="Actual Yield (%)"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add completion notes..."
              value={notes}
              onChange={handleNotesChange}
              disabled={isSubmitting}
              rows={3}
              className={cn(
                'resize-none',
                notesError && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-describedby={notesError ? 'notes-error' : undefined}
            />
            {notesError && (
              <p id="notes-error" className="text-sm text-destructive">
                {notesError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {notes.length}/2000 characters
            </p>
          </div>

          {/* Operator Info */}
          {operatorName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Operator: {operatorName} (current user)</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || hasErrors}
            className={cn(
              'gap-2 bg-green-600 hover:bg-green-700',
              hasErrors && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CompleteOperationModal
