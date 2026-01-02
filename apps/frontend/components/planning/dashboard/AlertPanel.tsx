/**
 * Alert Panel Component
 * Story: 03.16 - Planning Dashboard
 *
 * Displays alerts grouped by type with:
 * - Severity indicators (warning, critical)
 * - Clickable navigation to entity details
 * - Empty, loading, and error states
 * - Keyboard navigation and ARIA support
 * - Responsive layout
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Package,
  AlertCircle,
} from 'lucide-react'
import type { Alert, AlertType, AlertSeverity, AlertEntityType } from '@/lib/types/planning-dashboard'

export interface AlertPanelProps {
  /** List of alerts */
  alerts: Alert[]
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Click handler for alert items */
  onAlertClick?: (alert: Alert) => void
  /** Retry handler for error state */
  onRetry?: () => void
  /** Additional class names */
  className?: string
}

// Alert type configuration
const ALERT_TYPE_CONFIG: Record<
  AlertType,
  {
    icon: React.ElementType
    label: string
    color: string
  }
> = {
  overdue_po: {
    icon: Clock,
    label: 'Overdue PO',
    color: 'text-red-600',
  },
  pending_approval: {
    icon: AlertCircle,
    label: 'Pending Approval',
    color: 'text-yellow-600',
  },
  low_inventory: {
    icon: Package,
    label: 'Low Inventory',
    color: 'text-orange-600',
  },
  material_shortage: {
    icon: AlertTriangle,
    label: 'Material Shortage',
    color: 'text-red-600',
  },
}

// Severity badge colors
const SEVERITY_CONFIG: Record<AlertSeverity, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  warning: {
    variant: 'secondary',
    label: 'Warning',
  },
  critical: {
    variant: 'destructive',
    label: 'Critical',
  },
}

// Get entity route
const getEntityRoute = (entityType: AlertEntityType, entityId: string): string => {
  switch (entityType) {
    case 'purchase_order':
      return `/planning/purchase-orders/${entityId}`
    case 'transfer_order':
      return `/planning/transfer-orders/${entityId}`
    case 'work_order':
      return `/planning/work-orders/${entityId}`
    default:
      return '#'
  }
}

interface AlertItemProps {
  alert: Alert
  onClick?: (alert: Alert) => void
}

/**
 * AlertItem - Single alert list item
 */
function AlertItem({ alert, onClick }: AlertItemProps) {
  const router = useRouter()
  const typeConfig = ALERT_TYPE_CONFIG[alert.type]
  const severityConfig = SEVERITY_CONFIG[alert.severity]
  const Icon = typeConfig.icon

  const handleClick = () => {
    if (onClick) {
      onClick(alert)
    } else {
      router.push(getEntityRoute(alert.entity_type, alert.entity_id))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        alert.severity === 'critical' && 'border-l-2 border-l-red-500 bg-red-50/30',
        alert.severity === 'warning' && 'border-l-2 border-l-yellow-500 bg-yellow-50/30'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${severityConfig.label} alert: ${alert.description}`}
      data-testid={`alert-item-${alert.id}`}
    >
      <div className={cn('mt-0.5', typeConfig.color)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">
            {alert.entity_number}
          </span>
          <Badge variant={severityConfig.variant} className="text-xs">
            {severityConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{alert.description}</p>
        {alert.days_overdue !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            {alert.days_overdue} day{alert.days_overdue !== 1 ? 's' : ''} overdue
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * AlertPanelSkeleton - Loading state for alert panel
 */
function AlertPanelSkeleton() {
  return (
    <div className="space-y-3" data-testid="alert-panel-loading">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * AlertPanelEmpty - Empty state for alert panel
 */
function AlertPanelEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="alert-panel-empty"
    >
      <CheckCircle className="h-12 w-12 text-green-500 mb-3" aria-hidden="true" />
      <p className="text-base font-medium text-gray-900">No alerts - all clear!</p>
      <p className="text-sm text-gray-500 mt-1">Keep up the good work!</p>
    </div>
  )
}

/**
 * AlertPanelError - Error state for alert panel
 */
function AlertPanelError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="alert-panel-error"
    >
      <AlertTriangle className="h-12 w-12 text-red-500 mb-3" aria-hidden="true" />
      <p className="text-base font-medium text-red-600">Failed to load alerts</p>
      <p className="text-sm text-gray-500 mt-1">{error}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
          aria-label="Retry loading alerts"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  )
}

/**
 * AlertPanel component for displaying dashboard alerts
 */
export function AlertPanel({
  alerts,
  loading = false,
  error,
  onAlertClick,
  onRetry,
  className,
}: AlertPanelProps) {
  // Sort alerts by severity (critical first) then by created_at
  const sortedAlerts = React.useMemo(() => {
    return [...alerts].sort((a, b) => {
      // Critical comes first
      if (a.severity === 'critical' && b.severity !== 'critical') return -1
      if (a.severity !== 'critical' && b.severity === 'critical') return 1
      // Then sort by created_at (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [alerts])

  // Group alerts by type
  const alertsByType = React.useMemo(() => {
    const groups: Record<AlertType, Alert[]> = {
      overdue_po: [],
      pending_approval: [],
      low_inventory: [],
      material_shortage: [],
    }
    sortedAlerts.forEach((alert) => {
      groups[alert.type].push(alert)
    })
    return groups
  }, [sortedAlerts])

  // Count by type for section headers
  const typeCounts = React.useMemo(() => {
    return Object.entries(alertsByType).reduce(
      (acc, [type, alerts]) => {
        acc[type as AlertType] = alerts.length
        return acc
      },
      {} as Record<AlertType, number>
    )
  }, [alertsByType])

  return (
    <Card className={cn('w-full', className)} data-testid="alert-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <span>Alerts</span>
          {!loading && !error && alerts.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <AlertPanelSkeleton />}
        {!loading && error && <AlertPanelError error={error} onRetry={onRetry} />}
        {!loading && !error && alerts.length === 0 && <AlertPanelEmpty />}
        {!loading && !error && alerts.length > 0 && (
          <div className="space-y-2" role="list" aria-label="Alerts list">
            {sortedAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onClick={onAlertClick} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertPanel
