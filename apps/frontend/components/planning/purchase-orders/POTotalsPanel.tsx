/**
 * PO Totals Panel Component
 * Story 03.3: PO CRUD + Lines
 * Totals display panel per PLAN-005 and PLAN-006
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Currency, TaxBreakdownItem } from '@/lib/types/purchase-order'

interface POTotalsPanelProps {
  subtotal: number
  taxAmount: number
  taxBreakdown?: TaxBreakdownItem[]
  discountTotal?: number
  shippingCost?: number
  total: number
  currency: Currency
  receivedValue?: number
  className?: string
}

const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function POTotalsPanel({
  subtotal,
  taxAmount,
  taxBreakdown,
  discountTotal = 0,
  shippingCost = 0,
  total,
  currency,
  receivedValue,
  className,
}: POTotalsPanelProps) {
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false)
  const hasMultipleTaxRates = taxBreakdown && taxBreakdown.length > 1
  const outstanding = receivedValue !== undefined ? total - receivedValue : undefined

  return (
    <div className={cn('border rounded-lg p-4 bg-gray-50/50', className)}>
      <div className="space-y-2 max-w-sm ml-auto">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">
            {formatCurrency(subtotal, currency)}
          </span>
        </div>

        {/* Discount */}
        {discountTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="font-medium text-green-600">
              -{formatCurrency(discountTotal, currency)}
            </span>
          </div>
        )}

        {/* Tax */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">
                Tax{hasMultipleTaxRates ? ' (mixed)' : ''}:
              </span>
              {hasMultipleTaxRates && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                  aria-label={showTaxBreakdown ? 'Hide tax breakdown' : 'Show tax breakdown'}
                >
                  {showTaxBreakdown ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            <span className="font-medium">
              {formatCurrency(taxAmount, currency)}
            </span>
          </div>

          {/* Tax Breakdown */}
          {showTaxBreakdown && taxBreakdown && taxBreakdown.length > 0 && (
            <div className="pl-4 space-y-1">
              {taxBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-xs text-gray-500">
                  <span>{item.rate}% on {formatCurrency(item.subtotal, currency)}:</span>
                  <span>{formatCurrency(item.tax, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping Cost */}
        {shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping Cost:</span>
            <span className="font-medium">
              {formatCurrency(shippingCost, currency)}
            </span>
          </div>
        )}

        {/* Separator */}
        <Separator className="my-2" />

        {/* Total */}
        <div className="flex justify-between text-base font-bold">
          <span>Total:</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>

        {/* Received/Outstanding (for detail page) */}
        {receivedValue !== undefined && (
          <>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Received Value:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(receivedValue, currency)}
              </span>
            </div>
            {outstanding !== undefined && outstanding > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Outstanding:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(outstanding, currency)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default POTotalsPanel
