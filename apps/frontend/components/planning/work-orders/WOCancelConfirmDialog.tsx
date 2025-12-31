/**
 * WO Cancel Confirm Dialog Component
 * Story 03.10: Work Order CRUD
 * Cancel confirmation with reason input per PLAN-013
 */

'use client'

import { useState } from 'react'
import { Loader2, XCircle } from 'lucide-react'
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

interface WOCancelConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woNumber: string
  onConfirm: (reason?: string) => void
  isCancelling?: boolean
}

export function WOCancelConfirmDialog({
  open,
  onOpenChange,
  woNumber,
  onConfirm,
  isCancelling = false,
}: WOCancelConfirmDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('')
    }
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-500" />
            Cancel Work Order
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to cancel work order{' '}
                <strong className="font-mono">{woNumber}</strong>?
              </p>
              <p className="text-orange-600">
                This will mark the work order as cancelled. It cannot be reactivated.
              </p>
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason (optional)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Enter reason for cancellation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={isCancelling}
                />
                <p className="text-xs text-gray-500">
                  Maximum 500 characters
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep Open</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isCancelling}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
          >
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Work Order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default WOCancelConfirmDialog
