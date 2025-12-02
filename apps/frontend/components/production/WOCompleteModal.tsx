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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Loader2, AlertTriangle, Check, X, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WOCompleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  woNumber: string
  onSuccess: () => void
}

interface CompletionPreview {
  wo_id: string
  wo_number: string
  status: string
  planned_qty: number
  operations: {
    id: string
    sequence: number
    operation_name: string
    status: string
  }[]
  all_operations_completed: boolean
  incomplete_operations: string[]
  can_complete: boolean
  warnings: string[]
}

export function WOCompleteModal({
  open,
  onOpenChange,
  woId,
  woNumber,
  onSuccess,
}: WOCompleteModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState<CompletionPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchPreview()
    }
  }, [open, woId])

  const fetchPreview = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/complete`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load completion preview')
      }

      setPreview(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/complete`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete work order')
      }

      toast({
        title: 'Success',
        description: `Work order ${woNumber} completed successfully`,
      })

      if (data.data.genealogy_warnings?.length > 0) {
        toast({
          title: 'Warning',
          description: data.data.genealogy_warnings.join(', '),
          variant: 'default',
        })
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to complete work order',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Complete Work Order
          </DialogTitle>
          <DialogDescription>
            Complete work order <strong>{woNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : preview ? (
          <div className="space-y-4 py-4">
            {/* WO Summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">WO Number</span>
                <span className="font-medium">{preview.wo_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Planned Qty</span>
                <span className="font-medium flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {preview.planned_qty} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">{preview.status}</Badge>
              </div>
            </div>

            {/* Operations Status */}
            {preview.operations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Operations</h4>
                <div className="rounded-lg border p-3 space-y-2">
                  {preview.operations.map((op) => (
                    <div key={op.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {op.status === 'completed' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        {op.operation_name}
                      </span>
                      <Badge
                        variant={op.status === 'completed' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {op.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {preview.warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Cannot Complete Warning */}
            {!preview.can_complete && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {preview.incomplete_operations.length > 0
                    ? `Cannot complete: ${preview.incomplete_operations.length} operation(s) not completed (${preview.incomplete_operations.join(', ')})`
                    : `Cannot complete work order with status '${preview.status}'`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting || isLoading || !preview?.can_complete}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Complete WO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
