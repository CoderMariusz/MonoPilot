/**
 * Pallet Status Badge Component
 * Story 5.19-5.22: Pallets UI
 * Displays pallet status with color coding
 */

'use client'

import { Badge } from '@/components/ui/badge'

interface PalletStatusBadgeProps {
  status: 'open' | 'closed' | 'shipped' | 'received'
  className?: string
}

const STATUS_CONFIG: Record<
  PalletStatusBadgeProps['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }
> = {
  open: { label: 'Open', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  closed: { label: 'Closed', variant: 'secondary', className: 'bg-gray-500 hover:bg-gray-600' },
  shipped: { label: 'Shipped', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
  received: { label: 'Received', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
}

export function PalletStatusBadge({ status, className = '' }: PalletStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  )
}
