/**
 * LP Assignment Badge Component
 * Story 03.9b: TO License Plate Pre-selection
 * Status badge showing LP assignment state for TO lines
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react'

interface LPAssignmentBadgeProps {
  assignedQty: number
  requiredQty: number
  lpCount: number
  uom?: string
}

/**
 * LPAssignmentBadge - displays LP assignment status for a TO line
 *
 * States:
 * - Green (complete): assigned qty = required qty
 * - Yellow (partial): assigned qty > 0 but < required qty
 * - Gray (none): no LPs assigned
 */
export function LPAssignmentBadge({
  assignedQty,
  requiredQty,
  lpCount,
  uom = 'kg',
}: LPAssignmentBadgeProps) {
  const formatNumber = (num: number) =>
    num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  // Determine badge state
  if (lpCount === 0 || assignedQty === 0) {
    // Gray: No LPs assigned
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
        <Circle className="h-3 w-3 mr-1" />
        No LPs
      </Badge>
    )
  }

  if (assignedQty >= requiredQty) {
    // Green: Complete assignment
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {lpCount} LP{lpCount !== 1 ? 's' : ''} ({formatNumber(assignedQty)}/{formatNumber(requiredQty)} {uom})
      </Badge>
    )
  }

  // Yellow: Partial assignment
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
      <AlertCircle className="h-3 w-3 mr-1" />
      Partial ({formatNumber(assignedQty)}/{formatNumber(requiredQty)} {uom})
    </Badge>
  )
}

export default LPAssignmentBadge
