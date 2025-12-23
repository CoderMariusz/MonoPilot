/**
 * TaxCodeStatusBadge Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Displays tax code status (active, expired, scheduled)
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { getTaxCodeStatus, getStatusLabel } from '@/lib/utils/tax-code-helpers'
import type { TaxCode, TaxCodeStatus } from '@/lib/types/tax-code'

interface TaxCodeStatusBadgeProps {
  taxCode?: TaxCode
  status?: TaxCodeStatus
}

export function TaxCodeStatusBadge({ taxCode, status }: TaxCodeStatusBadgeProps) {
  const calculatedStatus = status || (taxCode ? getTaxCodeStatus(taxCode) : 'active')
  const label = getStatusLabel(calculatedStatus)

  const colorClasses = {
    active: 'bg-green-100 text-green-800 border-none',
    expired: 'bg-red-100 text-red-800 border-none',
    scheduled: 'bg-yellow-100 text-yellow-800 border-none',
  }

  return (
    <Badge className={colorClasses[calculatedStatus]} variant="outline">
      {label}
    </Badge>
  )
}
