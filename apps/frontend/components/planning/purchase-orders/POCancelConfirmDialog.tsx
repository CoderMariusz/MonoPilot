/**
 * PO Cancel Confirm Dialog Component
 * Story 03.3: PO CRUD + Lines
 * Cancel confirmation with reason input
 */

'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Ban } from 'lucide-react'

interface POCancelConfirmDialogProps {
  isOpen: boolean
  poNumber: string
  onConfirm: (reason?: string) => Promise<void>
  onCancel: () => void
}

export function POCancelConfirmDialog({
  isOpen,
  poNumber,
  onConfirm,
  onCancel,
}: POCancelConfirmDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    setIsCancelling(true)
    try {
      await onConfirm(reason || undefined)
      setReason('')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleClose = () => {
    if (!isCancelling) {
      setReason('')
      onCancel()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel <strong>{poNumber}</strong>? This will mark
            the purchase order as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="cancel-reason">Cancellation Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for cancellation..."
            className="mt-2"
            disabled={isCancelling}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep PO</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isCancelling}
            className="gap-2"
          >
            {isCancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Cancel PO
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default POCancelConfirmDialog
