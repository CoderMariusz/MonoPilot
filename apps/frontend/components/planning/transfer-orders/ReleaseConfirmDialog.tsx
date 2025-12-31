/**
 * Release Confirm Dialog Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Confirmation dialog for releasing TO to planned status
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
import { CheckCircle } from 'lucide-react'

interface ReleaseConfirmDialogProps {
  open: boolean
  onClose: () => void
  toNumber: string
  linesCount: number
  onConfirm: () => void
  isLoading?: boolean
}

export function ReleaseConfirmDialog({
  open,
  onClose,
  toNumber,
  linesCount,
  onConfirm,
  isLoading,
}: ReleaseConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <AlertDialogTitle>Release Transfer Order?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            <p className="mb-3">
              You are about to release <strong>{toNumber}</strong> with{' '}
              <strong>{linesCount} line{linesCount !== 1 ? 's' : ''}</strong>.
            </p>
            <p className="text-sm">
              After release:
            </p>
            <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Status will change to &quot;Planned&quot;</li>
              <li>The TO will be ready for warehouse processing</li>
              <li>Lines cannot be added or removed</li>
              <li>Header details can still be edited</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Releasing...' : 'Release TO'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ReleaseConfirmDialog
