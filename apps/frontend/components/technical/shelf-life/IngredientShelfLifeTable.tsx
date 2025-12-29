/**
 * Ingredient Shelf Life Table Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Read-only reference table showing BOM ingredient shelf lives:
 * - Columns: Ingredient, Days, Storage Temp, Notes
 * - Highlights shortest ingredient row
 * - Shows "Missing" badge for null shelf life
 * - Click to navigate/edit ingredient
 */

'use client'

import { ExternalLink, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IngredientShelfLife } from '@/lib/types/shelf-life'

interface IngredientShelfLifeTableProps {
  ingredients: IngredientShelfLife[]
  shortestIngredientId: string | null
  onIngredientClick?: (ingredientId: string) => void
}

// Helper to get ingredient ID (supports both naming conventions)
function getIngredientId(ingredient: IngredientShelfLife): string {
  return ingredient.id || ingredient.ingredient_id || ''
}

// Helper to get ingredient name
function getIngredientName(ingredient: IngredientShelfLife): string {
  return ingredient.name || ingredient.ingredient_name || ''
}

// Helper to get ingredient code
function getIngredientCode(ingredient: IngredientShelfLife): string {
  return ingredient.code || ingredient.ingredient_code || ''
}

export function IngredientShelfLifeTable({
  ingredients,
  shortestIngredientId,
  onIngredientClick,
}: IngredientShelfLifeTableProps) {
  // Sort ingredients to show shortest first
  const sortedIngredients = [...ingredients].sort((a, b) => {
    // Null shelf life days go to the end
    if (a.shelf_life_days == null) return 1
    if (b.shelf_life_days == null) return -1
    return a.shelf_life_days - b.shelf_life_days
  })

  // Find shortest ingredient name for summary
  const shortestIngredient = ingredients.find(
    (i) => getIngredientId(i) === shortestIngredientId
  )

  if (ingredients.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Ingredient Shelf Lives (Reference)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>No ingredients found in active BOM</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Ingredient Shelf Lives (Reference)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="w-24 text-right">Days</TableHead>
                <TableHead className="w-36">Storage Temp</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIngredients.map((ingredient) => {
                const ingredientId = getIngredientId(ingredient)
                const ingredientName = getIngredientName(ingredient)
                const ingredientCode = getIngredientCode(ingredient)
                const isShortest = ingredientId === shortestIngredientId
                const isMissing = ingredient.shelf_life_days == null

                return (
                  <TableRow
                    key={ingredientId}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      isShortest && 'bg-yellow-50',
                      isMissing && 'bg-red-50'
                    )}
                    onClick={() => onIngredientClick?.(ingredientId)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onIngredientClick?.(ingredientId)
                      }
                    }}
                    role="button"
                    aria-label={`Configure ${ingredientName} shelf life`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ingredientName}</span>
                        {isShortest && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                            Shortest
                          </Badge>
                        )}
                        {onIngredientClick && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{ingredientCode}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      {isMissing ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Missing
                        </Badge>
                      ) : (
                        <span className={cn('font-medium', isShortest && 'text-yellow-700')}>
                          {ingredient.shelf_life_days}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ingredient.storage_temp_min != null && ingredient.storage_temp_max != null ? (
                        <span className="text-sm">
                          {ingredient.storage_temp_min}-{ingredient.storage_temp_max}C
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ingredient.storage_conditions?.length > 0
                        ? ingredient.storage_conditions.join(', ').replace(/_/g, ' ')
                        : '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {shortestIngredient && shortestIngredient.shelf_life_days != null && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Shortest:</span> {getIngredientName(shortestIngredient)} (
            {shortestIngredient.shelf_life_days} days)
          </div>
        )}

        {/* Missing ingredients warning */}
        {ingredients.some((i) => i.shelf_life_days == null) && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Some ingredients are missing shelf life configuration. Click on the ingredient to
                configure.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
