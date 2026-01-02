/**
 * PO Delete Confirm Dialog Component
 * Story 03.3: PO CRUD + Lines
 * Delete confirmation dialog
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
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

interface PODeleteConfirmDialogProps {
  isOpen: boolean
  poNumber: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function PODeleteConfirmDialog({
  isOpen,
  poNumber,
  onConfirm,
  onCancel,
}: PODeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{poNumber}</strong>? This action
            cannot be undone. All line items will also be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default PODeleteConfirmDialog
