/**
 * TaxCodeRateBadge Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Displays tax rate with color coding
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { getRateBadgeColor, formatRate } from '@/lib/utils/tax-code-helpers'

interface TaxCodeRateBadgeProps {
  rate: number
}

export function TaxCodeRateBadge({ rate }: TaxCodeRateBadgeProps) {
  const { bg, text } = getRateBadgeColor(rate)
  const formattedRate = formatRate(rate)

  return (
    <Badge className={`${bg} ${text} border-none`} variant="outline">
      {formattedRate}
    </Badge>
  )
}
