/**
 * Allergen Banner Component (Story 07.10)
 * Red warning banner for allergen conflicts
 */

'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface AllergenBannerProps {
  allergens: string[]
  customer_restrictions: string[]
  onAcknowledge: () => void
  acknowledged: boolean
  className?: string
}

export function AllergenBanner({
  allergens,
  customer_restrictions,
  onAcknowledge,
  acknowledged,
  className,
}: AllergenBannerProps) {
  // Find conflicting allergens
  const conflicts = allergens.filter((a) =>
    customer_restrictions.some((r) => r.toLowerCase() === a.toLowerCase())
  )

  if (conflicts.length === 0) return null

  return (
    <div
      data-testid="allergen-banner"
      className={cn(
        'p-4 rounded-lg min-h-[48px]',
        'flex flex-col gap-3',
        className
      )}
      style={{ backgroundColor: 'rgb(220, 38, 38)' }} // DC2626
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          data-testid="warning-icon"
          className="h-6 w-6 text-white flex-shrink-0"
        />
        <span className="text-white font-bold text-lg">
          ALLERGEN ALERT: Contains {conflicts.join(', ')}
        </span>
      </div>
      <label className="flex items-center gap-3 text-white cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={onAcknowledge}
          className="h-5 w-5 rounded border-white focus:ring-2 focus:ring-white"
          aria-label="Acknowledge allergen warning"
        />
        <span className="text-sm">
          I acknowledge the risk and will separate handling
        </span>
      </label>
    </div>
  )
}

export default AllergenBanner
