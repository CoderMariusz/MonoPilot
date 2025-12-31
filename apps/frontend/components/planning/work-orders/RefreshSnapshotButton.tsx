/**
 * Refresh Snapshot Button - Story 03.11a
 *
 * Button to refresh BOM snapshot with confirmation dialog
 *
 * @module components/planning/work-orders/RefreshSnapshotButton
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { useRefreshSnapshot } from '@/lib/hooks/use-wo-materials'
import { canModifySnapshot } from '@/lib/services/wo-materials-service'

interface RefreshSnapshotButtonProps {
  woId: string
  woStatus: string
  onSuccess?: () => void
}

/**
 * Button to refresh BOM snapshot
 *
 * - Only visible for draft/planned WOs
 * - Shows confirmation dialog before refresh
 * - Displays loading state during API call
 * - Shows success/error toast notifications
 *
 * @param woId - UUID of the Work Order
 * @param woStatus - Current WO status
 * @param onSuccess - Callback after successful refresh
 *
 * @example
 * ```tsx
 * <RefreshSnapshotButton
 *   woId={wo.id}
 *   woStatus={wo.status}
 *   onSuccess={() => refetch()}
 * />
 * ```
 */
export function RefreshSnapshotButton({
  woId,
  woStatus,
  onSuccess,
}: RefreshSnapshotButtonProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { mutate, isPending } = useRefreshSnapshot()

  const canRefresh = canModifySnapshot(woStatus)

  const handleConfirm = () => {
    mutate(woId, {
      onSuccess: (data) => {
        toast({
          title: 'Materials refreshed successfully',
          description: data.message,
        })
        setOpen(false)
        onSuccess?.()
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        setOpen(false)
      },
    })
  }

  // Don't render if WO cannot be modified
  if (!canRefresh) {
    return null
  }

  return (
    <TooltipProvider>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="refresh-snapshot-button"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh from BOM
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh materials from the latest BOM version</p>
          </TooltipContent>
        </Tooltip>

        <AlertDialogContent role="alertdialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh BOM Snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace current materials with the latest BOM data.
              Any manual changes to the materials list will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
