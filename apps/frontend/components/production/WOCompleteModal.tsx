'use client'

/**
 * WO Complete Modal (Story 04.2c)
 * AC-12: Confirmation modal with WO summary, yield %, warnings
 * AC-13: Low yield warning if < 80%
 */

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
import { CheckCircle2, Loader2, AlertTriangle, Check, X, Package, TrendingUp } from 'lucide-react'
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
  product_name: string
  status: string
  planned_qty: number
  produced_qty: number
  yield_percent: number
  yield_color: 'green' | 'yellow' | 'red'
  low_yield_warning: boolean
  operations: {
    id: string
    sequence: number
    operation_name: string
    status: string
  }[]
  all_operations_completed: boolean
  incomplete_operations: string[]
  require_operation_sequence: boolean
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
        description: data.data?.message || `Work order ${woNumber} completed successfully`,
      })

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

  // Get yield badge color classes
  const getYieldBadgeClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200'
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
            {/* WO Summary - AC-12 */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">WO Number</span>
                <span className="font-medium">{preview.wo_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Product</span>
                <span className="font-medium">{preview.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Planned Qty</span>
                <span className="font-medium flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {preview.planned_qty.toLocaleString()} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Produced Qty</span>
                <span className="font-medium">
                  {preview.produced_qty.toLocaleString()} units
                </span>
              </div>
              {/* Yield Display - AC-6, AC-12 */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Yield
                </span>
                <Badge
                  variant="outline"
                  className={`font-bold ${getYieldBadgeClasses(preview.yield_color)}`}
                >
                  {preview.yield_percent.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">{preview.status}</Badge>
              </div>
            </div>

            {/* AC-13: Low Yield Warning (yellow) */}
            {preview.low_yield_warning && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Low yield detected ({preview.yield_percent.toFixed(1)}%). Please verify before completing.
                </AlertDescription>
              </Alert>
            )}

            {/* Operations Status */}
            {preview.operations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Operations
                  {preview.require_operation_sequence && (
                    <span className="text-xs text-muted-foreground ml-2">(sequence required)</span>
                  )}
                </h4>
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

            {/* Warnings (non-blocking) */}
            {preview.warnings.length > 0 && preview.can_complete && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  {preview.warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Cannot Complete Warning (blocking) */}
            {!preview.can_complete && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {preview.incomplete_operations.length > 0 && preview.require_operation_sequence
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
            Confirm Completion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
