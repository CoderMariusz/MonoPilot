/**
 * StaleCostWarning Component (Story 02.9)
 * Warning banner when cost data is outdated
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function StaleCostWarning() {
  return (
    <Alert
      className="mb-4 border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100"
      role="alert"
    >
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle>Cost data outdated</AlertTitle>
      <AlertDescription>
        Ingredient costs, BOM items, or routing have changed since last calculation.
        Click Recalculate for latest costs.
      </AlertDescription>
    </Alert>
  )
}
