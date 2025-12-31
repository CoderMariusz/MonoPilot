/**
 * WO Delete Confirm Dialog Component
 * Story 03.10: Work Order CRUD
 * Delete confirmation for draft work orders per PLAN-013
 */

'use client'

import { Loader2, AlertTriangle } from 'lucide-react'
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

interface WODeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woNumber: string
  onConfirm: () => void
  isDeleting?: boolean
}

export function WODeleteConfirmDialog({
  open,
  onOpenChange,
  woNumber,
  onConfirm,
  isDeleting = false,
}: WODeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Work Order
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete work order{' '}
                <strong className="font-mono">{woNumber}</strong>?
              </p>
              <p className="text-red-600">
                This action cannot be undone. The work order will be permanently removed.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default WODeleteConfirmDialog
