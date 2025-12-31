/**
 * Delete Line Dialog Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Confirmation dialog for deleting a TO line
 */

'use client'

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
import { Trash2 } from 'lucide-react'

interface DeleteLineDialogProps {
  open: boolean
  onClose: () => void
  lineNumber: number
  productName: string
  quantity: number
  uom: string
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteLineDialog({
  open,
  onClose,
  lineNumber,
  productName,
  quantity,
  uom,
  onConfirm,
  isLoading,
}: DeleteLineDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Delete Line Item?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            <p className="mb-2">
              You are about to delete line #{lineNumber}:
            </p>
            <div className="p-3 bg-gray-50 rounded-md mb-3">
              <p className="font-medium text-gray-900">{productName}</p>
              <p className="text-sm text-gray-600">
                Quantity: {quantity.toLocaleString()} {uom}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete Line'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteLineDialog
