/**
 * Unreserve Confirmation Dialog Component
 * Story 4.7: Material Reservation (Desktop)
 * Confirmation dialog for cancelling a reservation (AC-4.7.5)
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
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Reservation {
  id: string
  lp_number: string
  reserved_qty: number
  sequence_number: number
}

interface UnreserveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  reservation: Reservation
  materialName: string
  uom: string
  onSuccess: () => void
}

export function UnreserveConfirmDialog({
  open,
  onOpenChange,
  woId,
  reservation,
  materialName,
  uom,
  onSuccess,
}: UnreserveConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    try {
      setSubmitting(true)

      const response = await fetch(
        `/api/production/work-orders/${woId}/materials/reservations/${reservation.id}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.message || 'Failed to cancel reservation',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: `Reservation for ${reservation.lp_number} cancelled`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error cancelling reservation:', error)
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
          <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Are you sure you want to cancel this reservation?</p>
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
              <p className="text-orange-600">
                The LP will be released back to &quot;available&quot; status.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Keep Reservation</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel Reservation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
