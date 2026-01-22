'use client'

/**
 * ApproveModal Component
 * Story: 06.3 - Product Specifications
 *
 * Confirmation dialog for approving a specification.
 * Shows warning about superseding existing specs.
 * Optional approval notes field.
 */

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
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

export interface ApproveModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Specification name */
  specName: string
  /** Specification number */
  specNumber: string
  /** Product name */
  productName: string
  /** Whether approval is in progress */
  approving?: boolean
  /** Callback when approval is confirmed */
  onConfirm: (notes?: string) => void
}

export function ApproveModal({
  open,
  onOpenChange,
  specName,
  specNumber,
  productName,
  approving = false,
  onConfirm,
}: ApproveModalProps) {
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNotes('')
    }
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Specification?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to approve specification{' '}
                <span className="font-semibold">{specNumber}</span> -{' '}
                <span className="font-medium">{specName}</span>.
              </p>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important</p>
                    <p>
                      Approving this specification will activate it and automatically
                      supersede any existing active specifications for{' '}
                      <span className="font-medium">{productName}</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={2}
                  maxLength={500}
                  disabled={approving}
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length}/500 characters
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ApproveModal
