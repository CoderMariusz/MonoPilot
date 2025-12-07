/**
 * LP Status Badge Component
 * Story 5.1-5.4: LP Core UI
 * Displays license plate status with color coding
 */

'use client'

import { Badge } from '@/components/ui/badge'

interface LPStatusBadgeProps {
  status: 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged' | 'split' | 'deleted'
  className?: string
}

const statusConfig: Record<LPStatusBadgeProps['status'], { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
  available: { label: 'Available', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  reserved: { label: 'Reserved', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  consumed: { label: 'Consumed', variant: 'secondary', className: '' },
  shipped: { label: 'Shipped', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
  quarantine: { label: 'Quarantine', variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600 text-black' },
  recalled: { label: 'Recalled', variant: 'destructive', className: '' },
  merged: { label: 'Merged', variant: 'default', className: 'bg-orange-500 hover:bg-orange-600' },
  split: { label: 'Split', variant: 'default', className: 'bg-indigo-500 hover:bg-indigo-600' },
  deleted: { label: 'Deleted', variant: 'secondary', className: 'bg-gray-400' },
}

export function LPStatusBadge({ status, className = '' }: LPStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  )
}
