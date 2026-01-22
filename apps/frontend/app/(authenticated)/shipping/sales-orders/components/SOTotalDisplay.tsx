/**
 * SO Total Display Component
 * Story 07.4: SO Line Pricing
 *
 * Displays the calculated order total:
 * - Sum of all line totals
 * - Prominent styling
 */

'use client'

import { SalesOrderService } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

interface SOTotalDisplayProps {
  lines: Array<{ line_total: number | null }>
}

// =============================================================================
// Component
// =============================================================================

export function SOTotalDisplay({ lines }: SOTotalDisplayProps) {
  const total = lines.reduce((sum, line) => sum + (line.line_total || 0), 0)

  return (
    <div className="flex items-center justify-end gap-4 p-4 bg-gray-50 rounded-lg">
      <span className="text-gray-600">Order Total:</span>
      <span className="text-2xl font-bold">
        {SalesOrderService.formatCurrency(total)}
      </span>
    </div>
  )
}

export default SOTotalDisplay
