/**
 * AllergenBadge Component
 * Story: 01.12 - Allergens Management
 *
 * Reusable badge for displaying allergen code + name
 * Used across modules (Technical, Shipping, Quality)
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { AllergenIcon } from './AllergenIcon'
import type { Allergen } from '@/lib/types/allergen'
import { getAllergenName } from '@/lib/types/allergen'

interface AllergenBadgeProps {
  allergen: Allergen
  language?: 'en' | 'pl' | 'de' | 'fr'
  showIcon?: boolean
}

export function AllergenBadge({ allergen, language = 'en', showIcon = true }: AllergenBadgeProps) {
  const name = getAllergenName(allergen, language)

  return (
    <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1">
      {showIcon && <AllergenIcon icon_url={allergen.icon_url} name={name} size={24} />}
      <span className="text-xs font-medium">
        {allergen.code} - {name}
      </span>
    </Badge>
  )
}
