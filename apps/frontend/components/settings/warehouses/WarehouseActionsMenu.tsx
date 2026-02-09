/**
 * WarehouseActionsMenu Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Dropdown menu with row actions: Edit, Set Default, Disable/Enable
 */

'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Edit, Star, Ban, CheckCircle, MapPin } from 'lucide-react'
import type { Warehouse } from '@/lib/types/warehouse'

interface WarehouseActionsMenuProps {
  warehouse: Warehouse
  onEdit: () => void
  onSetDefault: () => void
  onDisable: () => void
  onEnable: () => void
  onManageLocations?: () => void
}

export function WarehouseActionsMenu({
  warehouse,
  onEdit,
  onSetDefault,
  onDisable,
  onEnable,
  onManageLocations,
}: WarehouseActionsMenuProps) {
  const isActive = warehouse.is_active
  const isDefault = warehouse.is_default

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Actions for warehouse ${warehouse.code}`}
          className="opacity-100 visible"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="ml-1">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Warehouse
        </DropdownMenuItem>

        {onManageLocations && (
          <DropdownMenuItem onClick={onManageLocations}>
            <MapPin className="h-4 w-4 mr-2" />
            Manage Locations
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {!isDefault && isActive && (
          <DropdownMenuItem onClick={onSetDefault}>
            <Star className="h-4 w-4 mr-2" />
            Set as Default
          </DropdownMenuItem>
        )}

        {isActive ? (
          <DropdownMenuItem
            onClick={onDisable}
            className="text-destructive focus:text-destructive"
            disabled={isDefault}
          >
            <Ban className="h-4 w-4 mr-2" />
            Disable Warehouse
            {isDefault && (
              <span className="ml-2 text-xs text-muted-foreground">(is default)</span>
            )}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onEnable}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Enable Warehouse
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
