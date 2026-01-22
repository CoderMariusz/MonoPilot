/**
 * AllergenWarningBanner Component
 * Story: 07.9 - Pick Confirmation Desktop
 * Phase: GREEN - Full implementation
 *
 * Prominent warning banner for allergen conflicts between product and customer restrictions.
 */

'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

export interface AllergenWarningBannerProps {
  product: {
    name: string
    allergens: string[]
  }
  customerRestrictions: string[]
  onAcknowledge: () => void
}

/**
 * Find conflicting allergens between product and customer restrictions
 */
function findConflictingAllergens(
  productAllergens: string[] | null | undefined,
  customerRestrictions: string[] | null | undefined
): string[] {
  if (!productAllergens || !customerRestrictions) {
    return []
  }

  const normalizedCustomer = customerRestrictions.map((r) => r.toLowerCase())

  return productAllergens.filter((allergen) =>
    normalizedCustomer.includes(allergen.toLowerCase())
  )
}

export function AllergenWarningBanner({
  product,
  customerRestrictions,
  onAcknowledge,
}: AllergenWarningBannerProps): JSX.Element | null {
  const [acknowledged, setAcknowledged] = useState(false)

  const conflictingAllergens = findConflictingAllergens(product.allergens, customerRestrictions)

  // Don't render if no conflict
  if (conflictingAllergens.length === 0) {
    return null
  }

  const handleAcknowledge = (checked: boolean) => {
    setAcknowledged(checked)
    if (checked) {
      onAcknowledge()
    }
  }

  return (
    <Alert
      variant="destructive"
      className="bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
      data-testid="allergen-warning"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="h-5 w-5" data-testid="warning-icon" />
      <AlertTitle className="text-red-800 dark:text-red-200 font-bold">
        ALLERGEN ALERT
      </AlertTitle>
      <AlertDescription className="text-red-700 dark:text-red-300">
        <p className="mb-2">
          Product <strong>{product.name}</strong> contains{' '}
          <strong className="uppercase">
            {conflictingAllergens.map((a) => a.toUpperCase()).join(', ')}
          </strong>
          .
        </p>
        <p className="mb-3">
          Customer has restrictions for:{' '}
          <strong className="uppercase">
            {conflictingAllergens.map((a) => a.toUpperCase()).join(', ')}
          </strong>
        </p>

        <div className="flex items-center space-x-2 mt-3 p-2 bg-white/50 dark:bg-black/20 rounded">
          <Checkbox
            id="acknowledge-allergen"
            checked={acknowledged}
            onCheckedChange={handleAcknowledge}
          />
          <Label
            htmlFor="acknowledge-allergen"
            className="text-sm font-medium cursor-pointer text-red-800 dark:text-red-200"
          >
            I acknowledge this allergen warning and confirm it is safe to proceed
          </Label>
        </div>
      </AlertDescription>
    </Alert>
  )
}
