/**
 * AllergenReadOnlyBanner Component
 * Story: 01.12 - Allergens Management
 *
 * Info banner explaining read-only EU allergens
 */

'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export function AllergenReadOnlyBanner() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm text-blue-800">
        EU-mandated allergens are system-managed and cannot be edited or deleted.
        Contact support for custom allergen requests.
      </AlertDescription>
    </Alert>
  )
}
