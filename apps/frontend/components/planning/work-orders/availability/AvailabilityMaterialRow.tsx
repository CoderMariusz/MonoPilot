/**
 * Availability Material Row Component - Story 03.13
 *
 * Individual row displaying material availability status including
 * traffic light indicator, quantities, and coverage percentage.
 *
 * @module components/planning/work-orders/availability/AvailabilityMaterialRow
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { MaterialAvailability } from '@/lib/types/wo-availability'
import { formatShortage, formatCoverage, getStatusLabel } from '@/lib/types/wo-availability'
import { AvailabilityTrafficLight } from './AvailabilityTrafficLight'

export interface AvailabilityMaterialRowProps {
  material: MaterialAvailability
  className?: string
}

/**
 * Format quantity with UoM
 */
function formatQty(qty: number, uom: string): string {
  return `${qty.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${uom}`
}

/**
 * Get row background based on status
 */
function getRowBackground(status: MaterialAvailability['status']): string {
  switch (status) {
    case 'shortage':
    case 'no_stock':
      return 'bg-red-50/50'
    case 'low_stock':
      return 'bg-yellow-50/50'
    default:
      return ''
  }
}

/**
 * Material row component for availability table
 *
 * Displays:
 * - Traffic light status indicator
 * - Material name and code
 * - Required quantity
 * - Available quantity (with expired note if applicable)
 * - Shortage/surplus quantity
 * - Coverage percentage
 * - UoM
 *
 * @param material - Material availability data
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <AvailabilityMaterialRow material={material} />
 * ```
 */
export function AvailabilityMaterialRow({
  material,
  className,
}: AvailabilityMaterialRowProps) {
  const shortage = formatShortage(material.shortage_qty)
  const isLow = material.status === 'shortage' || material.status === 'no_stock'
  const hasExpired = material.expired_excluded_qty > 0

  const tooltipContent = (
    <div className="space-y-1 text-sm">
      <p className="font-semibold">
        {getStatusLabel(material.status)} - {formatCoverage(material.coverage_percent)} coverage
      </p>
      <p>Available: {formatQty(material.available_qty, material.uom)}</p>
      {material.reserved_qty > 0 && (
        <p>Reserved by others: {formatQty(material.reserved_qty, material.uom)}</p>
      )}
      {hasExpired && (
        <p>Excluded (expired): {formatQty(material.expired_excluded_qty, material.uom)}</p>
      )}
      {material.shortage_qty > 0 && (
        <p className="text-red-400">
          Need: {formatQty(material.shortage_qty, material.uom)} more
        </p>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TableRow
            data-testid={`availability-row-${material.product_id}`}
            className={cn(
              getRowBackground(material.status),
              'cursor-default',
              className
            )}
            tabIndex={0}
            role="row"
            aria-label={`${material.product_name}, ${material.product_code}, Required ${material.required_qty} ${material.uom}, Available ${material.available_qty} ${material.uom}, ${formatCoverage(material.coverage_percent)} coverage, ${getStatusLabel(material.status)}`}
          >
            {/* Traffic Light */}
            <TableCell className="w-12">
              <AvailabilityTrafficLight
                status={material.status}
                coveragePercent={material.coverage_percent}
                showTooltip={false}
              />
            </TableCell>

            {/* Material Name & Code */}
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium" data-testid="material-name">
                  {material.product_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {material.product_code}
                </span>
              </div>
            </TableCell>

            {/* Required */}
            <TableCell className="text-right tabular-nums" data-testid="required-qty">
              {material.required_qty.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </TableCell>

            {/* Available */}
            <TableCell className="text-right" data-testid="available-qty">
              <div className="flex flex-col items-end gap-0.5">
                <span className="tabular-nums">
                  {material.available_qty.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
                {hasExpired && (
                  <span className="text-xs text-muted-foreground">
                    ({material.expired_excluded_qty.toFixed(0)} exp.)
                  </span>
                )}
                {material.status === 'no_stock' && (
                  <span className="text-xs text-red-600 font-medium">No Stock</span>
                )}
                {isLow && !material.status.includes('no_stock') && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">Low</span>
                  </div>
                )}
              </div>
            </TableCell>

            {/* Shortage */}
            <TableCell
              className={cn(
                'text-right tabular-nums',
                shortage.isSurplus ? 'text-green-600' : isLow ? 'text-red-600' : ''
              )}
              data-testid="shortage-qty"
            >
              <div className="flex flex-col items-end gap-0.5">
                <span>
                  {shortage.isSurplus ? `-${Math.abs(material.shortage_qty).toFixed(2)}` : material.shortage_qty.toFixed(2)}
                </span>
                {shortage.isSurplus && (
                  <span className="text-xs text-green-600">(surplus)</span>
                )}
              </div>
            </TableCell>

            {/* Coverage */}
            <TableCell
              className={cn(
                'text-right tabular-nums font-medium',
                material.coverage_percent >= 100
                  ? 'text-green-600'
                  : material.coverage_percent >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
              )}
              data-testid="coverage-percent"
            >
              {formatCoverage(material.coverage_percent)}
            </TableCell>

            {/* UoM */}
            <TableCell className="text-muted-foreground" data-testid="uom">
              {material.uom}
            </TableCell>
          </TableRow>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Mobile card layout for material availability
 *
 * Used on screens < 768px
 */
export function AvailabilityMaterialCard({
  material,
  className,
}: AvailabilityMaterialRowProps) {
  const shortage = formatShortage(material.shortage_qty)
  const isLow = material.status === 'shortage' || material.status === 'no_stock'
  const hasExpired = material.expired_excluded_qty > 0

  return (
    <div
      className={cn(
        'border rounded-lg p-4 space-y-3',
        getRowBackground(material.status),
        className
      )}
      data-testid={`availability-card-${material.product_id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <AvailabilityTrafficLight
          status={material.status}
          coveragePercent={material.coverage_percent}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{material.product_name}</p>
          <p className="text-sm text-muted-foreground">{material.product_code}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Required</span>
          <p className="font-medium">{formatQty(material.required_qty, material.uom)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Available</span>
          <p className="font-medium">{formatQty(material.available_qty, material.uom)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Shortage</span>
          <p className={cn('font-medium', shortage.isSurplus ? 'text-green-600' : isLow ? 'text-red-600' : '')}>
            {shortage.isSurplus ? `${shortage.text}` : formatQty(material.shortage_qty, material.uom)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Coverage</span>
          <p className={cn(
            'font-medium',
            material.coverage_percent >= 100
              ? 'text-green-600'
              : material.coverage_percent >= 50
              ? 'text-yellow-600'
              : 'text-red-600'
          )}>
            {formatCoverage(material.coverage_percent)}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {(hasExpired || material.reserved_qty > 0) && (
        <div className="space-y-1 text-xs">
          {hasExpired && (
            <p className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              {material.expired_excluded_qty.toFixed(0)} {material.uom} excluded (expired)
            </p>
          )}
          {material.reserved_qty > 0 && (
            <p className="text-muted-foreground">
              {formatQty(material.reserved_qty, material.uom)} reserved by others
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default AvailabilityMaterialRow
