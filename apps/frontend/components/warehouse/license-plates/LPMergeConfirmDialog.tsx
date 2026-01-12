/**
 * LP Merge Confirm Dialog Component (Story 05.18)
 * Confirmation dialog before executing merge operation
 *
 * Shows:
 * - LP count to be merged
 * - Warning about irreversible action
 * - Cancel and Confirm buttons
 *
 * Per AC-17
 */

'use client'

import { AlertTriangle } from 'lucide-react'
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

interface LPMergeConfirmDialogProps {
  open: boolean
  lpCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function LPMergeConfirmDialog({
  open,
  lpCount,
  onConfirm,
  onCancel,
}: LPMergeConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Merge
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <span>
                Are you sure you want to merge these {lpCount} LPs?
              </span>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  This will create 1 new LP and mark source LPs as consumed.
                  <br />
                  <strong>This action cannot be undone.</strong>
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm Merge</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
