/**
 * Supplier Card Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Card layout for mobile view
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
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
  Mail,
  Phone,
  Package,
} from 'lucide-react'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierCardProps {
  supplier: Supplier
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onViewDetails: () => void
  onDeactivate?: () => void
  onActivate?: () => void
  onDelete?: () => void
}

export function SupplierCard({
  supplier,
  selected,
  onSelect,
  onEdit,
  onViewDetails,
  onDeactivate,
  onActivate,
  onDelete,
}: SupplierCardProps) {
  const canDelete = !supplier.has_open_pos && !supplier.products_count && !supplier.purchase_orders_count

  return (
    <Card
      data-testid="supplier-card"
      className={`transition-colors ${selected ? 'border-primary bg-muted/50' : ''}`}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              aria-label={`Select ${supplier.name}`}
              data-testid="checkbox-supplier"
              className="mt-1"
            />
            <div className="flex-1 min-w-0" onClick={onViewDetails}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-medium">{supplier.code}</span>
                <span className="font-semibold truncate">{supplier.name}</span>
              </div>
              <Badge
                variant={supplier.is_active ? 'default' : 'secondary'}
                className={`mt-1 ${
                  supplier.is_active
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {supplier.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={`Actions for ${supplier.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {supplier.is_active && onDeactivate && (
                <DropdownMenuItem onClick={onDeactivate}>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
              {!supplier.is_active && onActivate && (
                <DropdownMenuItem onClick={onActivate}>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600"
                  disabled={!canDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="mt-3 space-y-1 text-sm" onClick={onViewDetails}>
          {supplier.contact_name && (
            <p className="text-muted-foreground">{supplier.contact_name}</p>
          )}
          {supplier.contact_email && (
            <p className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <a
                href={`mailto:${supplier.contact_email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:underline"
              >
                {supplier.contact_email}
              </a>
            </p>
          )}
          {supplier.contact_phone && (
            <p className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {supplier.contact_phone}
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-3">
            <span>{supplier.currency}</span>
            <span>{supplier.payment_terms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>{supplier.products_count ?? 0} products assigned</span>
          </div>
        </div>

        {/* Quick Actions - Touch Optimized */}
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-12" // 48dp height for touch
            onClick={onEdit}
            data-testid="button-edit-supplier"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-12"
            onClick={onViewDetails}
            data-testid="button-view-details"
          >
            <Eye className="mr-2 h-4 w-4" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
