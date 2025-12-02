/**
 * Reverse Consumption Dialog Component
 * Story 4.10: Consumption Correction
 * Confirmation dialog for reversing a consumption record (AC-4.10.1)
 */

'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Consumption {
  id: string
  lp_number: string
  consumed_qty: number
  uom: string
  material_name: string
  consumed_at: string
}

interface ReverseConsumptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  consumption: Consumption
  onSuccess: () => void
}

export function ReverseConsumptionDialog({
  open,
  onOpenChange,
  woId,
  consumption,
  onSuccess,
}: ReverseConsumptionDialogProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Reason is required for reversal')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(
        `/api/production/work-orders/${woId}/consume/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consumption_id: consumption.id,
            reason: reason.trim(),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setError('Only Manager or Admin can reverse consumption')
        } else {
          setError(result.error || 'Failed to reverse consumption')
        }
        return
      }

      toast({
        title: 'Success',
        description: `Reversed consumption of ${consumption.consumed_qty} ${consumption.uom} from ${consumption.lp_number}`,
      })

      setReason('')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Error reversing consumption:', err)
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Reverse Consumption?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Are you sure you want to reverse this consumption record?</p>
              <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Material: </span>
                  <span className="font-medium">{consumption.material_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">LP: </span>
                  <span className="font-mono">{consumption.lp_number}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quantity: </span>
                  <span className="font-mono">
                    {consumption.consumed_qty} {consumption.uom}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Consumed at: </span>
                  <span>{formatDate(consumption.consumed_at)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-gray-900">
                  Reason for reversal <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter reason for reversing this consumption..."
                  maxLength={500}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
                <strong>Warning:</strong> The LP quantity will be restored and status changed back to &quot;reserved&quot;.
                This action is logged for audit compliance.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting} onClick={() => setReason('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reverse Consumption
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
