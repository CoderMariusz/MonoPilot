/**
 * Cancel Confirm Dialog Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Confirmation dialog for cancelling a transfer order
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { XCircle } from 'lucide-react'

interface CancelConfirmDialogProps {
  open: boolean
  onClose: () => void
  toNumber: string
  onConfirm: (reason?: string) => void
  isLoading?: boolean
}

export function CancelConfirmDialog({
  open,
  onClose,
  toNumber,
  onConfirm,
  isLoading,
}: CancelConfirmDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason || undefined)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Cancel Transfer Order?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            <p className="mb-3">
              You are about to cancel <strong>{toNumber}</strong>.
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The transfer order will be marked as cancelled
              and can no longer be processed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Label htmlFor="cancel-reason" className="text-sm text-gray-600">
            Reason for cancellation (optional)
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for cancellation..."
            className="mt-1.5"
            rows={2}
            maxLength={500}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CancelConfirmDialog
