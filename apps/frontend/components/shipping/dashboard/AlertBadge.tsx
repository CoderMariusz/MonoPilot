/**
 * Alert Badge Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Individual alert badge with icon, title, count, severity
 */

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface AlertBadgeProps {
  title: string
  count: number
  severity: AlertSeverity
  icon: ReactNode
  onClick: () => void
}

const severityStyles: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200',
  warning: 'bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200',
  info: 'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200',
}

export function AlertBadge({
  title,
  count,
  severity,
  icon,
  onClick,
}: AlertBadgeProps) {
  return (
    <button
      data-testid={`alert-badge-${title}`}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        severityStyles[severity],
        count === 0 && 'opacity-50'
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-lg font-bold tabular-nums">{count}</p>
      </div>
    </button>
  )
}

export default AlertBadge
