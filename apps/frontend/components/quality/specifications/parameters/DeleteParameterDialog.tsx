'use client'

/**
 * DeleteParameterDialog Component
 * Story: 06.4 - Test Parameters
 *
 * Confirmation dialog for deleting a parameter.
 */

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

export interface DeleteParameterDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback to close dialog */
  onOpenChange: (open: boolean) => void
  /** Parameter name being deleted */
  parameterName: string
  /** Whether delete is in progress */
  deleting?: boolean
  /** Callback on confirm delete */
  onConfirm: () => void
}

export function DeleteParameterDialog({
  open,
  onOpenChange,
  parameterName,
  deleting = false,
  onConfirm,
}: DeleteParameterDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Parameter?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete parameter{' '}
            <span className="font-semibold text-foreground">&quot;{parameterName}&quot;</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm()
            }}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteParameterDialog
