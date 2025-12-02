/**
 * Consume Confirmation Dialog Component
 * Story 4.9: 1:1 Consumption Enforcement
 * Confirmation dialog for consuming a reserved LP (AC-4.9.2, AC-4.9.3)
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
import { Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Reservation {
  id: string
  lp_number: string
  reserved_qty: number
  sequence_number: number
  consume_whole_lp?: boolean
}

interface ConsumeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  reservation: Reservation
  materialName: string
  uom: string
  onSuccess: () => void
}

export function ConsumeConfirmDialog({
  open,
  onOpenChange,
  woId,
  reservation,
  materialName,
  uom,
  onSuccess,
}: ConsumeConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    try {
      setSubmitting(true)

      const response = await fetch(
        `/api/production/work-orders/${woId}/consume`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservation_id: reservation.id,
            qty: reservation.reserved_qty,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to consume material',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: `Consumed ${reservation.reserved_qty} ${uom} from ${reservation.lp_number}`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error consuming material:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Consumption</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Are you sure you want to consume this reserved material?</p>
              <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Material: </span>
                  <span className="font-medium">{materialName}</span>
                </div>
                <div>
                  <span className="text-gray-500">LP: </span>
                  <span className="font-mono">{reservation.lp_number}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quantity: </span>
                  <span className="font-mono">
                    {reservation.reserved_qty} {uom}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sequence: </span>
                  <span>#{reservation.sequence_number}</span>
                </div>
              </div>
              {reservation.consume_whole_lp && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Whole LP consumption required - entire quantity will be consumed</span>
                </div>
              )}
              <p className="text-blue-600">
                This action will deduct the quantity from the LP and mark it as consumed.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Consumption
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
