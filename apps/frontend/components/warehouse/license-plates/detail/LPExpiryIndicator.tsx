/**
 * LP Expiry Indicator Component
 * Story 05.6: LP Detail Page
 *
 * Expiry date with color-coded warning
 */

import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'

interface LPExpiryIndicatorProps {
  expiryDate: string | null
}

export function LPExpiryIndicator({ expiryDate }: LPExpiryIndicatorProps) {
  if (!expiryDate) {
    return <span className="text-sm text-gray-400">N/A</span>
  }

  const daysRemaining = differenceInDays(parseISO(expiryDate), new Date())
  const formattedDate = format(parseISO(expiryDate), 'MMM dd, yyyy')

  // Expired (< 0 days)
  if (daysRemaining < 0) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          EXPIRED
        </span>
        <span className="text-sm text-red-600">{formattedDate}</span>
      </div>
    )
  }

  // Critical (0-7 days)
  if (daysRemaining <= 7) {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-600">
          {formattedDate} ({daysRemaining} days)
        </span>
      </div>
    )
  }

  // Warning (8-30 days)
  if (daysRemaining <= 30) {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-600">
          {formattedDate} ({daysRemaining} days)
        </span>
      </div>
    )
  }

  // Normal (> 30 days)
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <span className="text-sm text-green-600">
        {formattedDate} ({daysRemaining} days)
      </span>
    </div>
  )
}
