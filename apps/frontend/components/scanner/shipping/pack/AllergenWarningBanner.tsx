/**
 * Allergen Warning Banner Component (Story 07.12)
 * Purpose: Yellow banner for allergen alerts
 * Features: Customer restrictions display, acknowledgment checkbox
 */

'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface AllergenWarningBannerProps {
  restrictions: string[]
  productAllergens?: string[]
  visible: boolean
  onAcknowledge?: () => void
  acknowledged?: boolean
  onDismiss?: () => void
  className?: string
}

export function AllergenWarningBanner({
  restrictions,
  productAllergens = [],
  visible,
  onAcknowledge,
  acknowledged = false,
  onDismiss,
  className,
}: AllergenWarningBannerProps) {
  if (!visible || restrictions.length === 0) return null

  // Find matching allergens
  const matches = productAllergens.filter((a) =>
    restrictions.some((r) => r.toLowerCase() === a.toLowerCase())
  )

  return (
    <div
      data-testid="allergen-warning-banner"
      className={cn(
        'p-4 bg-yellow-400',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-yellow-900 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-yellow-900">ALLERGEN ALERT</p>
          <p className="text-sm text-yellow-800 mt-1">
            Customer restricted: {restrictions.join(', ')}
          </p>
          {matches.length > 0 && (
            <p className="text-sm text-yellow-800 mt-1 font-medium">
              Product contains: {matches.join(', ')}
            </p>
          )}

          {/* Acknowledgment checkbox */}
          {onAcknowledge && (
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                data-testid="allergen-acknowledge"
                checked={acknowledged}
                onChange={onAcknowledge}
                className="h-5 w-5 rounded border-yellow-600 text-yellow-700 focus:ring-yellow-500"
              />
              <span className="text-sm text-yellow-900">
                I acknowledge the allergen risk
              </span>
            </label>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-800 hover:text-yellow-900 p-1"
            aria-label="Dismiss"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  )
}

export default AllergenWarningBanner
