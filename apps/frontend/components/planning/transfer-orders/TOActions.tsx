/**
 * TO Actions Dropdown Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays actions menu based on TO status and permissions
 */

'use client'

import { MoreHorizontal, Edit, Eye, CheckCircle, XCircle, Copy, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TOStatus } from '@/lib/types/transfer-order'
import { canEditTO, canRelease, canCancel } from '@/lib/types/transfer-order'

export type TOAction = 'view' | 'edit' | 'release' | 'cancel' | 'duplicate' | 'print'

interface TOActionsProps {
  toId: string
  toNumber: string
  status: TOStatus
  linesCount: number
  onAction: (action: TOAction) => void
  canEdit?: boolean // permission-based
}

export function TOActions({
  toId,
  toNumber,
  status,
  linesCount,
  onAction,
  canEdit = true,
}: TOActionsProps) {
  const isEditable = canEditTO(status) && canEdit
  const isReleasable = canRelease(status, linesCount) && canEdit
  const isCancellable = canCancel(status) && canEdit

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label={`Actions for ${toNumber}`}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAction('view')}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {status === 'draft' && isEditable && (
          <DropdownMenuItem onClick={() => onAction('edit')}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        {isReleasable && (
          <DropdownMenuItem onClick={() => onAction('release')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Release TO
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onAction('duplicate')}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate TO
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onAction('print')}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </DropdownMenuItem>

        {isCancellable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction('cancel')}
              className="text-red-600 focus:text-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel TO
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TOActions
