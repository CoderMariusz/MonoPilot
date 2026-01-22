'use client'

/**
 * CloneVersionDialog Component
 * Story: 06.3 - Product Specifications
 *
 * Confirmation dialog for cloning a specification as a new version.
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
import { Copy, Loader2 } from 'lucide-react'

export interface CloneVersionDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Specification number */
  specNumber: string
  /** Current version number */
  currentVersion: number
  /** Whether cloning is in progress */
  cloning?: boolean
  /** Callback when clone is confirmed */
  onConfirm: () => void
}

export function CloneVersionDialog({
  open,
  onOpenChange,
  specNumber,
  currentVersion,
  cloning = false,
  onConfirm,
}: CloneVersionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-600" />
            Create New Version?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will create a new draft version of specification{' '}
                <span className="font-semibold">{specNumber}</span>.
              </p>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  The new version will be:
                </p>
                <ul className="text-sm text-blue-800 mt-1 ml-4 list-disc">
                  <li>Version <span className="font-mono font-semibold">v{currentVersion + 1}</span> (draft)</li>
                  <li>Copy of name, description, and review frequency</li>
                  <li>Effective date set to today</li>
                  <li>Ready for editing and approval</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                The current active specification will remain in use until the new
                version is approved.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cloning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={cloning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {cloning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Create New Version
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CloneVersionDialog
