/**
 * AllergenIcon Component
 * Story: 01.12 - Allergens Management
 *
 * Displays allergen icon with fallback
 * Sizes: 24x24 (list) or 48x48 (detail)
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface AllergenIconProps {
  icon_url: string | null
  name: string
  size?: 24 | 48
}

export function AllergenIcon({ icon_url, name, size = 24 }: AllergenIconProps) {
  if (!icon_url) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded"
        style={{ width: size, height: size }}
        aria-label={`${name} allergen icon (fallback)`}
      >
        <AlertTriangle className="text-muted-foreground" style={{ width: size / 2, height: size / 2 }} />
      </div>
    )
  }

  return (
    <Image
      src={icon_url}
      alt={`${name} allergen icon`}
      width={size}
      height={size}
      className="object-contain"
    />
  )
}
