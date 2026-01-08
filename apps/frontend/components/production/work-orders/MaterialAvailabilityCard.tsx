/**
 * Material Availability Card Component - Story 04.2a
 *
 * Displays material availability information in a card format
 * with visual indicators (color coding, progress bars) for
 * availability status.
 *
 * @module components/production/work-orders/MaterialAvailabilityCard
 */

'use client'

import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Package } from 'lucide-react'

// Material interface matching what the test expects
export interface AvailabilityMaterial {
  wo_material_id: string
  product_id: string
  product_name: string
  required_qty: number
  available_qty: number
  availability_percent: number
  uom: string
}

export interface MaterialAvailabilityCardProps {
  materials: AvailabilityMaterial[]
  overallPercent: number
  className?: string
}

/**
 * Get color class based on availability percentage
 * - Green: 100% and above
 * - Yellow: 50-99%
 * - Red: below 50%
 */
function getStatusColor(percent: number): string {
  if (percent >= 100) return 'text-green-600'
  if (percent >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get background color for progress bar
 */
function getProgressBgColor(percent: number): string {
  if (percent >= 100) return 'bg-green-500'
  if (percent >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Get indicator class based on percentage
 */
function getIndicatorClass(percent: number): string {
  if (percent >= 100) return 'bg-green-500'
  if (percent >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Calculate shortage amount
 */
function calculateShortage(required: number, available: number): number {
  return required - available
}

/**
 * Format quantity with UOM
 */
function formatQty(qty: number, uom: string): string {
  return `${qty.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${uom}`
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 bg-muted rounded-full mb-3">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">No materials required</p>
    </div>
  )
}

/**
 * Material Availability Card Component
 *
 * Displays a card with material availability information including:
 * - Overall availability percentage in header
 * - Table with Material, Required, Available, % columns
 * - Color-coded indicators (green, yellow, red)
 * - Progress bars for each material
 * - Shortage highlighting
 *
 * @param materials - Array of materials with availability data
 * @param overallPercent - Overall availability percentage
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <MaterialAvailabilityCard
 *   materials={materialsData}
 *   overallPercent={85}
 * />
 * ```
 */
export function MaterialAvailabilityCard({
  materials,
  overallPercent,
  className,
}: MaterialAvailabilityCardProps) {
  const hasShortages = materials.some(m => m.availability_percent < 100)

  return (
    <Card className={cn('w-full', className)} data-testid="material-availability-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                getIndicatorClass(overallPercent)
              )}
              aria-hidden="true"
            />
            Material Availability
          </CardTitle>
          <span
            className={cn(
              'text-lg font-bold tabular-nums',
              getStatusColor(overallPercent)
            )}
            data-testid="overall-percent"
          >
            {overallPercent}%
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {materials.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table role="table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Material</TableHead>
                  <TableHead className="text-right">Required</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right w-[100px]">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const shortage = calculateShortage(
                    material.required_qty,
                    material.available_qty
                  )
                  const hasShortage = shortage > 0

                  return (
                    <TableRow
                      key={material.wo_material_id}
                      className={cn(
                        material.availability_percent < 50 && 'bg-red-50/50'
                      )}
                      data-testid={`material-row-${material.product_id}`}
                    >
                      {/* Material Name */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2.5 h-2.5 rounded-full flex-shrink-0',
                              getIndicatorClass(material.availability_percent)
                            )}
                            aria-label={`Status: ${material.availability_percent}% available`}
                          />
                          <span className="font-medium truncate">
                            {material.product_name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Required Quantity */}
                      <TableCell className="text-right tabular-nums">
                        {formatQty(material.required_qty, material.uom)}
                      </TableCell>

                      {/* Available Quantity */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="tabular-nums">
                            {formatQty(material.available_qty, material.uom)}
                          </span>
                          {hasShortage && (
                            <span
                              className="text-xs text-red-600 font-medium"
                              data-testid={`shortage-${material.product_id}`}
                            >
                              -{shortage} {material.uom}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Availability Percentage with Progress Bar */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1.5 min-w-[80px]">
                          <span
                            className={cn(
                              'text-sm font-medium tabular-nums',
                              getStatusColor(material.availability_percent)
                            )}
                            data-testid={`percent-${material.product_id}`}
                          >
                            {material.availability_percent}%
                          </span>
                          <Progress
                            value={Math.min(material.availability_percent, 100)}
                            className="h-1.5 w-full"
                            aria-valuenow={material.availability_percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            data-testid={`progress-${material.product_id}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MaterialAvailabilityCard
