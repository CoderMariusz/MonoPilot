/**
 * Deactivate Confirm Dialog Component
 * Story: 01.5a - User Management CRUD
 *
 * Confirmation dialog for user deactivation with warning
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
import type { User } from '@/lib/types/user'

interface DeactivateConfirmDialogProps {
  user: User
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeactivateConfirmDialog({
  user,
  open,
  onClose,
  onConfirm,
}: DeactivateConfirmDialogProps) {
  const userName = `${user.first_name} ${user.last_name}`

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate {userName}? They will no longer
            be able to log in.
            <br />
            <br />
            <span className="font-semibold text-destructive">
              Warning: This will also terminate all active sessions immediately.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
