/**
 * LP Status Badge Component
 * Story 05.1: License Plates UI
 * Bug Fix: Expired LPs now show "Expired" status instead of "Available"
 */

import { Badge } from '@/components/ui/badge'
import type { LPStatus } from '@/lib/types/license-plate'
import { cn } from '@/lib/utils'

interface LPStatusBadgeProps {
  status: LPStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
  expiryDate?: string | null
}

const statusConfig: Record<
  LPStatus | 'expired',
  {
    label: string
    className: string
    icon: string
  }
> = {
  available: {
    label: 'Available',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
    icon: '✓',
  },
  reserved: {
    label: 'Reserved',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    icon: '🔒',
  },
  consumed: {
    label: 'Consumed',
    className: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
    icon: '✓',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
    icon: '⛔',
  },
  expired: {
    label: 'Expired',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
    icon: '🔴',
  },
}

export function LPStatusBadge({ status, size = 'md', className, expiryDate }: LPStatusBadgeProps) {
  // Check if LP is expired
  let effectiveStatus: LPStatus | 'expired' = status
  
  if (expiryDate && status !== 'blocked' && status !== 'consumed') {
    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
    
    if (expiry < today) {
      effectiveStatus = 'expired'
    }
  }

  const config = statusConfig[effectiveStatus]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeClasses[size], className)}
      role="status"
      aria-label={`Status: ${config.label}`}
      data-testid="status-badge"
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}
