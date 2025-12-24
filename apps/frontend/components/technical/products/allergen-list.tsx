/**
 * AllergenList Component (Story 02.3 - MVP)
 * Purpose: Displays list of allergen declarations with badges and actions
 *
 * Features (MVP):
 * - Allergen icon + name display
 * - Source badge (AUTO/MANUAL) color-coded
 * - Source products display (for auto-inherited)
 * - Reason display (for may_contain)
 * - Remove action (respects permissions)
 *
 * Props:
 * - allergens: Array of product allergens
 * - onRemove: Callback when remove button clicked
 * - readOnly: Disable remove actions (for viewer role)
 *
 * Usage:
 * <AllergenList
 *   allergens={containsAllergens}
 *   onRemove={handleRemove}
 *   readOnly={!canEdit}
 * />
 */

'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDefaultAllergenIcon } from '@/lib/utils/allergen-icons'
import type { ProductAllergen } from '@/lib/types/product-allergen'

interface AllergenListProps {
  allergens: ProductAllergen[]
  onRemove?: (allergen: ProductAllergen) => void
  readOnly?: boolean
  className?: string
}

export function AllergenList({
  allergens,
  onRemove,
  readOnly = false,
  className,
}: AllergenListProps) {
  // Empty state
  if (allergens.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center',
          className
        )}
      >
        <p className="text-sm text-muted-foreground">No allergens declared</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {allergens.map((allergen) => (
        <AllergenListItem
          key={allergen.id}
          allergen={allergen}
          onRemove={onRemove}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}

interface AllergenListItemProps {
  allergen: ProductAllergen
  onRemove?: (allergen: ProductAllergen) => void
  readOnly?: boolean
}

function AllergenListItem({
  allergen,
  onRemove,
  readOnly = false,
}: AllergenListItemProps) {
  const isAuto = allergen.source === 'auto'
  const hasSourceProducts = allergen.source_products && allergen.source_products.length > 0

  return (
    <div
      className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
      role="article"
      aria-label={`Allergen: ${allergen.allergen_name}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon + Details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Allergen Icon */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            aria-hidden="true"
          >
            {allergen.allergen_icon ? (
              <img
                src={allergen.allergen_icon}
                alt=""
                className="w-5 h-5"
              />
            ) : (
              <span className="text-lg" role="img" aria-label={allergen.allergen_name}>
                {getDefaultAllergenIcon(allergen.allergen_code)}
              </span>
            )}
          </div>

          {/* Allergen Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {allergen.allergen_name}
              </h4>
              {/* Source Badge: AUTO (green) or MANUAL (blue) */}
              <Badge
                variant={isAuto ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  isAuto && 'bg-green-500 text-white hover:bg-green-600'
                )}
              >
                {isAuto ? 'AUTO' : 'MANUAL'}
              </Badge>
            </div>

            {/* Source Products (for auto-inherited) */}
            {isAuto && hasSourceProducts && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Source:</span>{' '}
                {allergen.source_products!.map((p) => p.name).join(', ')}
              </p>
            )}

            {/* Reason (for may_contain) */}
            {allergen.reason && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Reason:</span> {allergen.reason}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Remove Button */}
        {!readOnly && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(allergen)}
            className="flex-shrink-0 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            aria-label={`Remove ${allergen.allergen_name} allergen`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
