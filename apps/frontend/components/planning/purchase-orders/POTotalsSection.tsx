/**
 * PO Totals Section Component
 * Story 03.4: PO Totals + Tax Calculations
 *
 * Display subtotal, tax, discount, shipping, and total for a purchase order.
 * Handles mixed tax rates with breakdown tooltip.
 *
 * States:
 * - Loading: Shows skeleton placeholders
 * - Error: Shows error message with retry option
 * - Empty: Shows zero values (rare case)
 * - Success: Shows formatted totals with currency
 *
 * Per wireframes PLAN-005 and PLAN-006.
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TaxBreakdownTooltip } from './TaxBreakdownTooltip'
import { cn } from '@/lib/utils'
import type { Currency, TaxBreakdownItem } from '@/lib/types/purchase-order'

// ============================================================================
// TYPES
// ============================================================================

export interface POTotalsSectionProps {
  /** Subtotal before tax, discount, and shipping */
  subtotal: number
  /** Total tax amount */
  taxAmount: number
  /** Total discount amount */
  discountTotal: number
  /** Shipping cost */
  shippingCost: number
  /** Grand total (subtotal + tax - discount + shipping) */
  total: number
  /** Per-rate tax breakdown for mixed rates */
  taxBreakdown?: TaxBreakdownItem[]
  /** Currency code (PLN, EUR, USD, GBP) */
  currency: Currency
  /** Received value (for detail page) */
  receivedValue?: number
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Retry callback for error state */
  onRetry?: () => void
  /** Show in compact mode (for modals) */
  compact?: boolean
  /** Additional class names */
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number, currency: Currency): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return amount < 0 ? `-${formatted}` : formatted
}

const formatCurrencyWithCode = (amount: number, currency: Currency): string => {
  const formatted = formatCurrency(amount, currency)
  // Add currency code suffix for clarity
  return `${formatted} ${currency}`
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TotalLineProps {
  label: string
  value: number
  currency: Currency
  variant?: 'default' | 'discount' | 'total' | 'received' | 'outstanding'
  showCurrencyCode?: boolean
  children?: React.ReactNode
}

function TotalLine({
  label,
  value,
  currency,
  variant = 'default',
  showCurrencyCode = false,
  children,
}: TotalLineProps) {
  const valueClasses = cn(
    'font-medium tabular-nums text-right',
    {
      'text-green-600': variant === 'discount' || variant === 'received',
      'text-orange-600': variant === 'outstanding',
      'font-bold text-base': variant === 'total',
    }
  )

  const formattedValue = showCurrencyCode
    ? formatCurrencyWithCode(value, currency)
    : formatCurrency(value, currency)

  // For discount, show negative
  const displayValue = variant === 'discount' && value > 0
    ? `-${formatCurrency(value, currency)}${showCurrencyCode ? ` ${currency}` : ''}`
    : formattedValue

  return (
    <div className="flex justify-between items-center text-sm gap-4">
      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <span>{label}</span>
        {children}
      </div>
      <span className={valueClasses}>{displayValue}</span>
    </div>
  )
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingSkeleton({ compact }: { compact?: boolean }) {
  const lineHeight = compact ? 'h-4' : 'h-5'

  return (
    <div
      className={cn(
        'border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/50',
        compact && 'p-3'
      )}
      aria-label="Loading totals"
    >
      <div className={cn('space-y-2 max-w-sm ml-auto', compact && 'space-y-1.5')}>
        <div className="flex justify-between">
          <Skeleton className={cn('w-16', lineHeight)} />
          <Skeleton className={cn('w-24', lineHeight)} />
        </div>
        <div className="flex justify-between">
          <Skeleton className={cn('w-12', lineHeight)} />
          <Skeleton className={cn('w-20', lineHeight)} />
        </div>
        <div className="flex justify-between">
          <Skeleton className={cn('w-14', lineHeight)} />
          <Skeleton className={cn('w-24', lineHeight)} />
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between">
          <Skeleton className={cn('w-10', lineHeight)} />
          <Skeleton className={cn('w-28', lineHeight)} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({
  error,
  onRetry,
  compact,
}: {
  error: string
  onRetry?: () => void
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'border border-destructive/50 rounded-lg p-4 bg-destructive/5',
        compact && 'p-3'
      )}
      role="alert"
      aria-label="Error loading totals"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm text-destructive font-medium">
            Failed to calculate totals
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function POTotalsSection({
  subtotal,
  taxAmount,
  discountTotal,
  shippingCost,
  total,
  taxBreakdown,
  currency,
  receivedValue,
  isLoading = false,
  error = null,
  onRetry,
  compact = false,
  className,
}: POTotalsSectionProps) {
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false)

  // Determine if we have multiple tax rates
  const hasMultipleTaxRates = taxBreakdown && taxBreakdown.length > 1
  const hasSingleTaxRate = taxBreakdown && taxBreakdown.length === 1
  const taxRateLabel = hasSingleTaxRate
    ? `Tax (${taxBreakdown[0].rate}%)`
    : hasMultipleTaxRates
      ? 'Tax (mixed)'
      : 'Tax'

  // Calculate outstanding if received value is provided
  const outstanding = receivedValue !== undefined ? total - receivedValue : undefined

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton compact={compact} />
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} compact={compact} />
  }

  // Empty state - show zeros
  const isEmpty = subtotal === 0 && taxAmount === 0 && total === 0
  if (isEmpty) {
    return (
      <div
        className={cn(
          'border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/50',
          compact && 'p-3',
          className
        )}
        aria-label="No totals to display"
      >
        <div className={cn('space-y-2 max-w-sm ml-auto', compact && 'space-y-1.5')}>
          <p className="text-sm text-muted-foreground text-right">
            Add lines to see totals
          </p>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div
      className={cn(
        'border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/50',
        compact && 'p-3',
        className
      )}
      role="region"
      aria-label="Purchase order totals"
    >
      <div className={cn('space-y-2 max-w-sm ml-auto', compact && 'space-y-1.5')}>
        {/* Subtotal */}
        <TotalLine
          label="Subtotal:"
          value={subtotal}
          currency={currency}
          showCurrencyCode={!compact}
        />

        {/* Discount (only show if > 0) */}
        {discountTotal > 0 && (
          <TotalLine
            label="Discount:"
            value={discountTotal}
            currency={currency}
            variant="discount"
            showCurrencyCode={!compact}
          />
        )}

        {/* Tax */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm gap-4">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <span>{taxRateLabel}:</span>
              {hasMultipleTaxRates && (
                <>
                  {/* Expandable toggle for inline breakdown */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                    aria-label={showTaxBreakdown ? 'Hide tax breakdown' : 'Show tax breakdown'}
                    aria-expanded={showTaxBreakdown}
                  >
                    {showTaxBreakdown ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                  {/* Tooltip for quick view */}
                  <TaxBreakdownTooltip
                    taxBreakdown={taxBreakdown}
                    totalTax={taxAmount}
                    currency={currency}
                  />
                </>
              )}
            </div>
            <span className="font-medium tabular-nums text-right">
              {formatCurrency(taxAmount, currency)}
              {!compact && ` ${currency}`}
            </span>
          </div>

          {/* Inline Tax Breakdown (expanded) */}
          {showTaxBreakdown && taxBreakdown && taxBreakdown.length > 0 && (
            <div
              className="pl-4 space-y-1 animate-in slide-in-from-top-1 duration-200"
              role="list"
              aria-label="Tax breakdown by rate"
            >
              {[...taxBreakdown].sort((a, b) => b.rate - a.rate).map((item, index) => (
                <div
                  key={`${item.rate}-${index}`}
                  className="flex justify-between text-xs text-gray-500 dark:text-gray-400"
                  role="listitem"
                >
                  <span>
                    {item.rate}% on {formatCurrency(item.subtotal, currency)}:
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(item.tax, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping Cost (only show if > 0 or in compact mode) */}
        {(shippingCost > 0 || !compact) && (
          <TotalLine
            label="Shipping Cost:"
            value={shippingCost}
            currency={currency}
            showCurrencyCode={!compact}
          />
        )}

        {/* Separator */}
        <Separator className="my-2" />

        {/* Total */}
        <TotalLine
          label="Total:"
          value={total}
          currency={currency}
          variant="total"
          showCurrencyCode={!compact}
        />

        {/* Received/Outstanding (for detail page) */}
        {receivedValue !== undefined && (
          <>
            <Separator className="my-2" />
            <TotalLine
              label="Received Value:"
              value={receivedValue}
              currency={currency}
              variant="received"
              showCurrencyCode={!compact}
            />
            {outstanding !== undefined && outstanding > 0 && (
              <TotalLine
                label="Outstanding:"
                value={outstanding}
                currency={currency}
                variant="outstanding"
                showCurrencyCode={!compact}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default POTotalsSection
