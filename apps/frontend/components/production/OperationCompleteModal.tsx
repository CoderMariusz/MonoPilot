'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Loader2, Clock, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Operation {
  id: string
  sequence: number
  operation_name: string
  status: string
  started_at: string | null
  expected_duration_minutes: number | null
}

interface OperationCompleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  woNumber: string
  operation: Operation | null
  totalOperations: number
  onSuccess: () => void
}

export function OperationCompleteModal({
  open,
  onOpenChange,
  woId,
  woNumber,
  operation,
  totalOperations,
  onSuccess,
}: OperationCompleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duration, setDuration] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [nextOperation, setNextOperation] = useState<{
    id: string
    sequence: number
    operation_name: string
  } | null>(null)
  const { toast } = useToast()

  // Calculate default duration when modal opens
  useEffect(() => {
    if (open && operation?.started_at) {
      const startedAt = new Date(operation.started_at)
      const now = new Date()
      const minutes = Math.round((now.getTime() - startedAt.getTime()) / 60000)
      setDuration(Math.max(1, minutes))
    }
    if (open) {
      setNotes('')
      setNextOperation(null)
    }
  }, [open, operation])

  const handleComplete = async () => {
    if (!operation) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/production/work-orders/${woId}/operations/${operation.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actual_duration_minutes: duration,
            notes: notes || undefined,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete operation')
      }

      if (data.data.next_operation) {
        setNextOperation(data.data.next_operation)
      }

      toast({
        title: 'Success',
        description: `Operation '${operation.operation_name}' completed`,
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete operation',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!operation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Complete Operation
          </DialogTitle>
          <DialogDescription>
            Complete operation for work order <strong>{woNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operation Details */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sequence</span>
              <span className="font-medium">
                Operation {operation.sequence} of {totalOperations}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Operation</span>
              <span className="font-medium">{operation.operation_name}</span>
            </div>
            {operation.started_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Started At</span>
                <span className="font-medium">
                  {new Date(operation.started_at).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actual Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated from start time. You can adjust if needed.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this operation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Next Operation Info */}
          {nextOperation && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Next: <strong>{nextOperation.operation_name}</strong> (Sequence{' '}
                {nextOperation.sequence})
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
