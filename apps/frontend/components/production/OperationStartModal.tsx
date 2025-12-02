'use client'

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
import { PlayCircle, Loader2, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Operation {
  id: string
  sequence: number
  operation_name: string
  status: string
  expected_duration_minutes: number | null
}

interface OperationStartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  woNumber: string
  operation: Operation | null
  onSuccess: () => void
}

export function OperationStartModal({
  open,
  onOpenChange,
  woId,
  woNumber,
  operation,
  onSuccess,
}: OperationStartModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleStart = async () => {
    if (!operation) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/production/work-orders/${woId}/operations/${operation.id}/start`,
        { method: 'POST' },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start operation')
      }

      toast({
        title: 'Success',
        description: `Operation '${operation.operation_name}' started`,
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start operation',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!operation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            Start Operation
          </DialogTitle>
          <DialogDescription>
            Start operation for work order <strong>{woNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sequence</span>
              <span className="font-medium">{operation.sequence}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Operation</span>
              <span className="font-medium">{operation.operation_name}</span>
            </div>
            {operation.expected_duration_minutes && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expected Duration</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {operation.expected_duration_minutes} min
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Starting this operation will change its status to &quot;In Progress&quot; and record the
            start time.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Start Operation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
