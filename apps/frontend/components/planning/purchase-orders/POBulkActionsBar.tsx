/**
 * PO Bulk Actions Bar
 * Story: 03.6 - PO Bulk Operations
 * Bulk actions dropdown and bar per PLAN-004
 */

'use client'

import { useState, useCallback } from 'react'
import {
  CheckCircle,
  XCircle,
  Ban,
  Send,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useBulkStatusUpdate } from '@/lib/hooks/use-bulk-po-operations'
import { canPerformBulkAction, type BulkAction } from '@/lib/types/po-bulk'
import type { POStatus } from '@/lib/types/purchase-order'

interface POBulkActionsBarProps {
  selectedIds: string[]
  selectedStatuses: POStatus[]
  onExport: () => void
  onClearSelection: () => void
  className?: string
}

interface ConfirmDialogState {
  open: boolean
  action: BulkAction | null
  title: string
  description: string
  requiresReason: boolean
}

export function POBulkActionsBar({
  selectedIds,
  selectedStatuses,
  onExport,
  onClearSelection,
  className,
}: POBulkActionsBarProps) {
  const { toast } = useToast()
  const bulkStatusUpdate = useBulkStatusUpdate()

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: '',
    description: '',
    requiresReason: false,
  })
  const [reason, setReason] = useState('')

  const selectedCount = selectedIds.length

  // Check which actions are available
  const approveCheck = canPerformBulkAction('approve', selectedStatuses)
  const rejectCheck = canPerformBulkAction('reject', selectedStatuses)
  const cancelCheck = canPerformBulkAction('cancel', selectedStatuses)
  const confirmCheck = canPerformBulkAction('confirm', selectedStatuses)

  const handleActionClick = useCallback(
    (action: BulkAction) => {
      const actionConfig: Record<
        BulkAction,
        { title: string; description: string; requiresReason: boolean }
      > = {
        approve: {
          title: `Approve ${selectedCount} PO${selectedCount !== 1 ? 's' : ''}?`,
          description: 'These POs will be marked as approved and ready for confirmation.',
          requiresReason: false,
        },
        reject: {
          title: `Reject ${selectedCount} PO${selectedCount !== 1 ? 's' : ''}?`,
          description: 'Please provide a reason for rejection.',
          requiresReason: true,
        },
        cancel: {
          title: `Cancel ${selectedCount} PO${selectedCount !== 1 ? 's' : ''}?`,
          description: 'This action cannot be undone. Please provide a reason (optional).',
          requiresReason: false,
        },
        confirm: {
          title: `Confirm ${selectedCount} PO${selectedCount !== 1 ? 's' : ''}?`,
          description: 'These POs will be marked as confirmed and ready for sending to supplier.',
          requiresReason: false,
        },
      }

      const config = actionConfig[action]
      setConfirmDialog({
        open: true,
        action,
        title: config.title,
        description: config.description,
        requiresReason: config.requiresReason,
      })
      setReason('')
    },
    [selectedCount]
  )

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog.action) return

    if (confirmDialog.requiresReason && !reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for this action.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await bulkStatusUpdate.mutateAsync({
        po_ids: selectedIds,
        action: confirmDialog.action,
        reason: reason.trim() || undefined,
      })

      if (result.success_count > 0) {
        toast({
          title: 'Success',
          description: `${result.success_count} PO${result.success_count !== 1 ? 's' : ''} ${confirmDialog.action}${confirmDialog.action.endsWith('e') ? 'd' : 'ed'} successfully.${
            result.error_count > 0
              ? ` ${result.error_count} failed.`
              : ''
          }`,
        })
      } else {
        toast({
          title: 'Action Failed',
          description: `No POs were ${confirmDialog.action}${confirmDialog.action.endsWith('e') ? 'd' : 'ed'}. Check that POs are in the correct status.`,
          variant: 'destructive',
        })
      }

      setConfirmDialog((prev) => ({ ...prev, open: false }))
      onClearSelection()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform action',
        variant: 'destructive',
      })
    }
  }, [confirmDialog, reason, selectedIds, bulkStatusUpdate, toast, onClearSelection])

  const handleDialogClose = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }))
    setReason('')
  }, [])

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div
        className={`flex items-center justify-between p-3 bg-primary/5 border rounded-lg ${className}`}
        role="toolbar"
        aria-label="Bulk actions for selected POs"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedCount} PO{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground"
          >
            Clear selection
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Individual Action Buttons for common actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleActionClick('approve')}
            disabled={!approveCheck.allowed || bulkStatusUpdate.isPending}
            title={approveCheck.reason}
            className="gap-1"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            Approve
          </Button>

          {/* Bulk Actions Dropdown for less common actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Bulk Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleActionClick('approve')}
                disabled={!approveCheck.allowed}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                Approve Selected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleActionClick('reject')}
                disabled={!rejectCheck.allowed}
                className="gap-2"
              >
                <XCircle className="h-4 w-4 text-red-600" />
                Reject Selected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleActionClick('confirm')}
                disabled={!confirmCheck.allowed}
                className="gap-2"
              >
                <Send className="h-4 w-4 text-blue-600" />
                Confirm Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleActionClick('cancel')}
                disabled={!cancelCheck.allowed}
                className="gap-2 text-red-600"
              >
                <Ban className="h-4 w-4" />
                Cancel Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExport} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>

          {(confirmDialog.requiresReason || confirmDialog.action === 'cancel' || confirmDialog.action === 'reject') && (
            <div className="py-2">
              <Label htmlFor="action-reason">
                {confirmDialog.requiresReason ? 'Reason (required)' : 'Reason (optional)'}
              </Label>
              <Textarea
                id="action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter ${confirmDialog.action} reason...`}
                className="mt-2"
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkStatusUpdate.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={bulkStatusUpdate.isPending || (confirmDialog.requiresReason && !reason.trim())}
              className={
                confirmDialog.action === 'cancel' || confirmDialog.action === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {bulkStatusUpdate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmDialog.action === 'approve' && 'Approve'}
              {confirmDialog.action === 'reject' && 'Reject'}
              {confirmDialog.action === 'cancel' && 'Cancel POs'}
              {confirmDialog.action === 'confirm' && 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default POBulkActionsBar
