/**
 * AllergenBadge Component (Story 02.3 - MVP)
 * Purpose: Small badge showing allergen count for Product List
 *
 * Features (MVP):
 * - Red badge for "Contains" allergens
 * - Orange badge for "May Contain" allergens
 * - Shows allergen count
 * - Accessible with screen reader support
 *
 * Props:
 * - containsCount: Number of "contains" allergens
 * - mayContainCount: Number of "may_contain" allergens
 *
 * Usage:
 * <AllergenBadge containsCount={3} mayContainCount={1} />
 */

'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AllergenBadgeProps {
  containsCount: number
  mayContainCount: number
  className?: string
}

export function AllergenBadge({
  containsCount,
  mayContainCount,
  className,
}: AllergenBadgeProps) {
  // Don't render if no allergens
  if (containsCount === 0 && mayContainCount === 0) {
    return null
  }

  // Prioritize "contains" allergens (more severe)
  const hasContains = containsCount > 0
  const count = hasContains ? containsCount : mayContainCount
  const label = hasContains ? 'allergens' : 'may contain'
  const ariaLabel = hasContains
    ? `${count} allergen${count !== 1 ? 's' : ''} present`
    : `May contain ${count} allergen${count !== 1 ? 's' : ''}`

  return (
    <Badge
      variant={hasContains ? 'destructive' : 'default'}
      className={cn(
        'text-xs font-medium',
        // Red for "contains" (destructive variant)
        // Orange for "may contain"
        !hasContains && 'bg-orange-500 text-white hover:bg-orange-600',
        className
      )}
      aria-label={ariaLabel}
    >
      {count} {label}
    </Badge>
  )
}
