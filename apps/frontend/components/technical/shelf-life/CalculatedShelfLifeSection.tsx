/**
 * Calculated Shelf Life Section Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Displays the calculated shelf life with breakdown:
 * - Shortest ingredient identification
 * - Processing impact
 * - Safety buffer
 * - Recalculate button
 * - Needs recalculation badge
 */

'use client'

import { RefreshCw, AlertTriangle, Info, Beaker } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface CalculatedShelfLifeSectionProps {
  calculatedDays: number | null
  calculationMethod: string
  shortestIngredient: {
    id: string
    name: string
    days: number
  } | null
  processingImpactDays: number
  safetyBufferPercent: number
  safetyBufferDays: number
  needsRecalculation: boolean
  onRecalculate: () => void
  isRecalculating: boolean
  hasActiveBom: boolean
  missingIngredients?: { id?: string; name?: string; ingredient_id?: string; ingredient_name?: string }[]
}

export function CalculatedShelfLifeSection({
  calculatedDays,
  calculationMethod,
  shortestIngredient,
  processingImpactDays,
  safetyBufferPercent,
  safetyBufferDays,
  needsRecalculation,
  onRecalculate,
  isRecalculating,
  hasActiveBom,
  missingIngredients = [],
}: CalculatedShelfLifeSectionProps) {
  const hasMissingIngredients = missingIngredients.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Calculated Shelf Life
          </CardTitle>
          {needsRecalculation && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs Recalculation
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calculation Method */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            Calculation Method:{' '}
            <span className="font-medium text-foreground">
              {calculationMethod === 'auto_min_ingredients'
                ? 'Minimum from Ingredients'
                : 'Manual'}
            </span>
          </span>
        </div>

        {/* Error state: Missing ingredients */}
        {hasMissingIngredients && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">
                  Cannot calculate - missing ingredient data:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {missingIngredients.map((ingredient) => (
                    <li key={ingredient.id || ingredient.ingredient_id}>
                      {ingredient.name || ingredient.ingredient_name} (no shelf life configured)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error state: No active BOM */}
        {!hasActiveBom && !hasMissingIngredients && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">No active BOM found</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Create an active BOM to calculate shelf life from ingredients, or set shelf life
                  manually.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calculation breakdown */}
        {hasActiveBom && !hasMissingIngredients && calculatedDays != null && (
          <div className="space-y-3">
            {/* Shortest ingredient */}
            {shortestIngredient && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Shortest Ingredient:</span>
                <span className="font-medium">
                  {shortestIngredient.name} ({shortestIngredient.days} days)
                </span>
              </div>
            )}

            {/* Processing impact */}
            {processingImpactDays !== 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Processing Impact:</span>
                <span
                  className={cn(
                    'font-medium',
                    processingImpactDays > 0 ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {processingImpactDays > 0 ? '-' : '+'}
                  {Math.abs(processingImpactDays)} days
                  {processingImpactDays > 0 && ' (heat treatment)'}
                </span>
              </div>
            )}

            {/* Safety buffer */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Safety Buffer ({safetyBufferPercent}%):
              </span>
              <span className="font-medium text-red-600">-{safetyBufferDays} days</span>
            </div>

            <Separator />

            {/* Final calculated value */}
            <div
              className={cn(
                'flex justify-between items-center p-3 rounded-md transition-colors duration-500',
                needsRecalculation ? 'bg-yellow-50' : 'bg-muted/50'
              )}
            >
              <span className="font-medium">Calculated Shelf Life:</span>
              <span className="text-xl font-bold">{calculatedDays} days</span>
            </div>
          </div>
        )}

        {/* Recalculate button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onRecalculate}
          disabled={isRecalculating || !hasActiveBom}
        >
          {isRecalculating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalculate from Ingredients
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
