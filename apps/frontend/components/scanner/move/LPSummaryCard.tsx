/**
 * LP Summary Card Component (Story 05.20)
 * Purpose: Display LP summary in a card format
 * Features: Compact and full modes, edit button, status badge
 */

'use client'

import { cn } from '@/lib/utils'
import { Edit2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { LPLookupResult } from '@/lib/validation/scanner-move'

interface LPSummaryCardProps {
  lp: LPLookupResult
  compact?: boolean
  showStatus?: boolean
  onEdit?: () => void
  className?: string
}

const statusColors: Record<string, string> = {
  available: 'bg-green-600',
  reserved: 'bg-blue-600',
  consumed: 'bg-gray-600',
  blocked: 'bg-red-600',
}

const qaStatusColors: Record<string, string> = {
  passed: 'bg-green-600',
  pending: 'bg-yellow-600',
  failed: 'bg-red-600',
  on_hold: 'bg-orange-600',
}

export function LPSummaryCard({
  lp,
  compact = false,
  showStatus = false,
  onEdit,
  className,
}: LPSummaryCardProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'bg-blue-50 border border-blue-200 rounded-lg p-3',
          'flex items-center justify-between',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-mono font-medium text-gray-900">{lp.lp_number}</div>
            <div className="text-sm text-gray-500">
              {lp.product.name} - {lp.quantity} {lp.uom}
            </div>
          </div>
        </div>
        {showStatus && (
          <Badge className={cn(statusColors[lp.status] || 'bg-gray-500')}>
            {lp.status.charAt(0).toUpperCase() + lp.status.slice(1)}
          </Badge>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label="Edit"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4',
        className
      )}
    >
      {/* Header with LP number and status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="font-mono font-bold text-lg text-gray-900">{lp.lp_number}</span>
        </div>
        <div className="flex items-center gap-2">
          {showStatus && (
            <Badge className={cn(statusColors[lp.status] || 'bg-gray-500')}>
              {lp.status.charAt(0).toUpperCase() + lp.status.slice(1)}
            </Badge>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Edit"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Product:</span>
          <span className="font-medium text-gray-900">{lp.product.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">SKU:</span>
          <span className="font-medium text-gray-900">{lp.product.sku}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Quantity:</span>
          <span className="font-medium text-gray-900">
            {lp.quantity} {lp.uom}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Location:</span>
          <span className="font-medium text-gray-900">{lp.location.code}</span>
        </div>
        {lp.batch_number && (
          <div className="flex justify-between">
            <span className="text-gray-500">Batch:</span>
            <span className="font-medium text-gray-900">{lp.batch_number}</span>
          </div>
        )}
        {lp.expiry_date && (
          <div className="flex justify-between">
            <span className="text-gray-500">Expiry:</span>
            <span className="font-medium text-gray-900">{lp.expiry_date}</span>
          </div>
        )}
        {lp.qa_status && (
          <div className="flex justify-between">
            <span className="text-gray-500">QA Status:</span>
            <Badge
              className={cn(
                qaStatusColors[lp.qa_status] || 'bg-gray-500',
                'text-xs'
              )}
            >
              {lp.qa_status.charAt(0).toUpperCase() + lp.qa_status.slice(1)}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

export default LPSummaryCard
