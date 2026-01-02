/**
 * Tax Breakdown Tooltip Component
 * Story 03.4: PO Totals + Tax Calculations
 *
 * Expandable tooltip showing per-rate tax breakdown.
 * Displays when a PO has multiple tax rates applied to different lines.
 *
 * States:
 * - Loading: Shows skeleton
 * - Error: Shows error message with retry
 * - Empty: Shows "No tax breakdown" message
 * - Success: Shows tax breakdown list
 */

'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Currency, TaxBreakdownItem } from '@/lib/types/purchase-order'

// ============================================================================
// TYPES
// ============================================================================

export interface TaxBreakdownTooltipProps {
  /** List of tax breakdown items sorted by rate descending */
  taxBreakdown: TaxBreakdownItem[]
  /** Total tax amount for display */
  totalTax?: number
  /** Currency code for formatting */
  currency: Currency
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Retry callback for error state */
  onRetry?: () => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatPercent = (rate: number): string => {
  return `${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TaxBreakdownTooltip({
  taxBreakdown,
  totalTax,
  currency,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: TaxBreakdownTooltipProps) {
  // Sort breakdown by rate descending
  const sortedBreakdown = [...taxBreakdown].sort((a, b) => b.rate - a.rate)

  // Calculate total if not provided
  const calculatedTotal = totalTax ?? sortedBreakdown.reduce((sum, item) => sum + item.tax, 0)

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <Skeleton className="h-4 w-4 rounded-full" aria-label="Loading tax breakdown" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-5 w-5 p-0 text-destructive', className)}
              aria-label="Tax calculation error"
            >
              <Info className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Empty state
  if (!sortedBreakdown.length) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-5 w-5 p-0 text-muted-foreground', className)}
              aria-label="No tax breakdown available"
            >
              <Info className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm text-muted-foreground">No tax breakdown available</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Success state - show breakdown
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-5 w-5 p-0 text-muted-foreground hover:text-foreground', className)}
            aria-label="View tax breakdown"
          >
            <Info className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className="min-w-[200px] p-3"
          align="end"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tax Breakdown
            </p>

            <div className="space-y-1.5">
              {sortedBreakdown.map((item, index) => (
                <div
                  key={`${item.rate}-${index}`}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatPercent(item.rate)} on {formatCurrency(item.subtotal, currency)}:
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(item.tax, currency)}
                  </span>
                </div>
              ))}
            </div>

            {sortedBreakdown.length > 1 && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between gap-4 text-sm font-semibold">
                  <span>Total Tax:</span>
                  <span className="tabular-nums">
                    {formatCurrency(calculatedTotal, currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default TaxBreakdownTooltip
