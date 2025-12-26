/**
 * InheritanceBanner Component (Story 02.3 - MVP)
 * Purpose: Shows BOM allergen inheritance status with recalculate action
 *
 * Features (MVP):
 * - Blue/info banner showing auto-inheritance status
 * - Last updated timestamp
 * - BOM version used
 * - Ingredient count
 * - Recalculate button
 *
 * Props:
 * - inheritanceStatus: Inheritance metadata
 * - onRecalculate: Callback when recalculate button clicked
 * - loading: Recalculation in progress
 *
 * Usage:
 * <InheritanceBanner
 *   inheritanceStatus={status}
 *   onRecalculate={handleRecalculate}
 *   loading={isRecalculating}
 * />
 */

'use client'

import * as React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InheritanceStatus } from '@/lib/types/product-allergen'

interface InheritanceBannerProps {
  inheritanceStatus: InheritanceStatus
  onRecalculate: () => void
  loading?: boolean
  className?: string
}

export function InheritanceBanner({
  inheritanceStatus,
  onRecalculate,
  loading = false,
  className,
}: InheritanceBannerProps) {
  const { last_calculated, bom_version, ingredients_count, needs_recalculation } =
    inheritanceStatus

  // Don't show banner if no BOM exists
  if (!bom_version) {
    return null
  }

  // Format last calculated timestamp
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Alert
      className={cn(
        'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
        needs_recalculation && 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
        className
      )}
    >
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Auto-Inherited from BOM
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Last Updated:</span>{' '}
              {formatDate(last_calculated)} (BOM v{bom_version})
            </p>
            <p>
              <span className="font-medium">Ingredients:</span> {ingredients_count}{' '}
              {ingredients_count === 1 ? 'ingredient' : 'ingredients'} analyzed
            </p>
            {needs_recalculation && (
              <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                BOM has changed. Allergens may need recalculation.
              </p>
            )}
          </div>
          <Button
            onClick={onRecalculate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="mt-2 sm:mt-0 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
            aria-label="Recalculate allergens from BOM"
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', loading && 'animate-spin')}
              aria-hidden="true"
            />
            {loading ? 'Recalculating...' : 'Recalculate'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
