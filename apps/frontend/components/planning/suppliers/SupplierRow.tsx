/**
 * Supplier Row Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Table row for desktop view
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Power,
  PowerOff,
  Trash2,
  Download,
  Package,
} from 'lucide-react'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierRowProps {
  supplier: Supplier
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onViewDetails: () => void
  onDeactivate?: () => void
  onActivate?: () => void
  onDelete?: () => void
  onExport?: () => void
  hasOpenPOs?: boolean
}

export function SupplierRow({
  supplier,
  selected,
  onSelect,
  onEdit,
  onViewDetails,
  onDeactivate,
  onActivate,
  onDelete,
  onExport,
  hasOpenPOs,
}: SupplierRowProps) {
  const canDelete = !supplier.has_open_pos && !supplier.products_count && !supplier.purchase_orders_count

  return (
    <TableRow
      data-testid={`supplier-row-${supplier.code}`}
      className={selected ? 'bg-muted/50' : undefined}
    >
      {/* Selection Checkbox */}
      <TableCell className="w-12">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label={`Select ${supplier.name}`}
          data-testid="checkbox-supplier"
          data-supplier-id={supplier.id}
          data-has-open-pos={hasOpenPOs}
        />
      </TableCell>

      {/* Code */}
      <TableCell
        className="font-mono font-medium cursor-pointer"
        onClick={onViewDetails}
        data-testid="cell-code"
      >
        {supplier.code}
      </TableCell>

      {/* Name + Status */}
      <TableCell className="cursor-pointer" onClick={onViewDetails} data-testid="cell-name">
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={supplier.is_active ? 'default' : 'secondary'}
              className={
                supplier.is_active
                  ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-800'
              }
              data-testid="cell-status"
            >
              {supplier.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-muted-foreground">{supplier.payment_terms}</span>
          </div>
        </div>
      </TableCell>

      {/* Contact Name */}
      <TableCell onClick={onViewDetails} className="cursor-pointer">
        {supplier.contact_name || <span className="text-muted-foreground">(No contact)</span>}
      </TableCell>

      {/* Email */}
      <TableCell onClick={onViewDetails} className="cursor-pointer">
        {supplier.contact_email ? (
          <a
            href={`mailto:${supplier.contact_email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:underline"
          >
            {supplier.contact_email}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Phone */}
      <TableCell onClick={onViewDetails} className="cursor-pointer">
        {supplier.contact_phone || <span className="text-muted-foreground">-</span>}
      </TableCell>

      {/* Products Count */}
      <TableCell onClick={onViewDetails} className="cursor-pointer text-right">
        <span className="text-sm">
          {supplier.products_count ?? 0} products
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right w-24">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            data-testid="button-edit-supplier"
            aria-label={`Edit ${supplier.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Actions for supplier ${supplier.code} ${supplier.name}`}
                aria-haspopup="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" role="menu" aria-label="Supplier actions">
              <DropdownMenuItem onClick={onViewDetails} role="menuitem">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} role="menuitem">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Supplier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewDetails} role="menuitem">
                <Package className="mr-2 h-4 w-4" />
                Assign Products
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {supplier.is_active && onDeactivate && (
                <DropdownMenuItem
                  onClick={onDeactivate}
                  role="menuitem"
                  disabled={hasOpenPOs}
                >
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}

              {!supplier.is_active && onActivate && (
                <DropdownMenuItem onClick={onActivate} role="menuitem">
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}

              {onExport && (
                <DropdownMenuItem onClick={onExport} role="menuitem">
                  <Download className="mr-2 h-4 w-4" />
                  Export Supplier Data
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                  disabled={!canDelete}
                  role="menuitem"
                  data-testid={canDelete ? 'button-delete-supplier' : 'button-delete-supplier-with-pos'}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}
