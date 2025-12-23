/**
 * DefaultBadge Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Displays star icon for default tax code
 */

'use client'

import { Star } from 'lucide-react'

interface DefaultBadgeProps {
  isDefault: boolean
}

export function DefaultBadge({ isDefault }: DefaultBadgeProps) {
  if (!isDefault) return null

  return (
    <Star
      className="h-4 w-4 text-yellow-500 fill-yellow-500"
      aria-label="Default tax code"
    />
  )
}
