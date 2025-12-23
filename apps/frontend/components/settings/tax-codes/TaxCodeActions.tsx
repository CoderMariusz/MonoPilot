/**
 * TaxCodeActions Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Row actions dropdown menu (Edit, Set Default, Delete)
 */

'use client'

import { MoreVertical, Pencil, Star, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TaxCode } from '@/lib/types/tax-code'

interface TaxCodeActionsProps {
  taxCode: TaxCode
  onEdit: () => void
  onSetDefault: () => void
  onDelete: () => void
  canEdit: boolean
  canDelete: boolean
}

export function TaxCodeActions({
  taxCode,
  onEdit,
  onSetDefault,
  onDelete,
  canEdit,
  canDelete,
}: TaxCodeActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {canEdit && !taxCode.is_default && (
          <DropdownMenuItem onClick={onSetDefault}>
            <Star className="h-4 w-4 mr-2" />
            Set as Default
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
