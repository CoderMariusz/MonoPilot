/**
 * PO Actions Bar Component
 * Story 03.3: PO CRUD + Lines
 * Action buttons based on status per PLAN-006
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  Pencil,
  Send,
  CheckCircle,
  XCircle,
  CheckCheck,
  Ban,
  Copy,
  Printer,
  FileDown,
  MoreHorizontal,
  Mail,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PurchaseOrderWithLines, POStatus } from '@/lib/types/purchase-order'
import { canEditPO, canCancelPO } from '@/lib/types/purchase-order'

interface POActionsBarProps {
  po: PurchaseOrderWithLines
  onEdit?: () => void
  onSubmit?: () => Promise<void>
  onApprove?: () => Promise<void>
  onReject?: () => Promise<void>
  onConfirm?: () => Promise<void>
  onCancel?: () => Promise<void>
  onDuplicate?: () => void
  onPrint?: () => void
  onExportPDF?: () => void
  onEmailSupplier?: () => void
  onGoToReceiving?: () => void
  isSubmitting?: boolean
  className?: string
}

export function POActionsBar({
  po,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onConfirm,
  onCancel,
  onDuplicate,
  onPrint,
  onExportPDF,
  onEmailSupplier,
  onGoToReceiving,
  isSubmitting = false,
  className,
}: POActionsBarProps) {
  const status = po.status as POStatus
  const isEditable = canEditPO(status)
  const isCancelable = canCancelPO(status, po.receive_percent > 0)
  const hasLines = po.lines?.length > 0

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Primary Actions based on status */}

      {/* Draft: Edit and Submit */}
      {status === 'draft' && (
        <>
          <Button
            variant="outline"
            onClick={onEdit}
            disabled={isSubmitting}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !hasLines}
            className="gap-2"
            title={!hasLines ? 'Add at least one line to submit' : undefined}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit
          </Button>
        </>
      )}

      {/* Pending Approval: Approve and Reject */}
      {status === 'pending_approval' && (
        <>
          <Button
            onClick={onApprove}
            disabled={isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject
          </Button>
        </>
      )}

      {/* Approved: Confirm */}
      {status === 'approved' && (
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Confirm
        </Button>
      )}

      {/* Confirmed or Receiving: Go to Receiving */}
      {(status === 'confirmed' || status === 'receiving') && (
        <Button
          onClick={onGoToReceiving}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Go to Receiving
        </Button>
      )}

      {/* Print Button (always visible) */}
      <Button
        variant="outline"
        onClick={onPrint}
        disabled={isSubmitting}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isSubmitting}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate PO
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEmailSupplier}>
            <Mail className="mr-2 h-4 w-4" />
            Email Supplier
          </DropdownMenuItem>
          {isCancelable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onCancel}
                className="text-red-600 focus:text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel PO
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default POActionsBar
