/**
 * Allergens List Page
 * Story: 01.12 - Allergens Management
 *
 * Displays 14 EU-mandated allergens in read-only mode
 * - Multi-language support (EN, PL, DE, FR)
 * - Search across all language fields
 * - Icon display with fallback
 * - No Add/Edit/Delete actions (regulatory data)
 */

'use client'

import { useAllergens } from '@/lib/hooks/use-allergens'
import { AllergensDataTable, AllergenReadOnlyBanner } from '@/components/settings/allergens'

export default function AllergensPage() {
  const { data: allergens, isLoading, error, refetch } = useAllergens()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Allergens</h1>
        <p className="text-muted-foreground">
          EU-mandated allergens list for food labeling compliance (EU Regulation 1169/2011)
        </p>
      </div>

      {/* Read-only banner */}
      <AllergenReadOnlyBanner />

      {/* Data table */}
      <AllergensDataTable
        allergens={allergens || []}
        isLoading={isLoading}
        error={error?.message}
        onRetry={refetch}
        userLanguage="en" // TODO: Get from user preferences
      />
    </div>
  )
}
