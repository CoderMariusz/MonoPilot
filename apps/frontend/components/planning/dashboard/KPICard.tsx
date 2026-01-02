/**
 * KPI Card Component
 * Story: 03.16 - Planning Dashboard
 *
 * Displays a single KPI metric card with:
 * - Title, value, and icon
 * - Clickable navigation to filtered lists
 * - Loading, error, and empty states
 * - Keyboard navigation and ARIA support
 * - Responsive layout
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Clock,
  ShoppingCart,
  Truck,
  Calendar,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'

// KPI Types
export type KPIType =
  | 'po_pending_approval'
  | 'po_this_month'
  | 'to_in_transit'
  | 'wo_scheduled_today'
  | 'wo_overdue'
  | 'open_orders'

export interface KPICardProps {
  /** KPI type identifier */
  type: KPIType
  /** Display title */
  title: string
  /** Numeric value */
  value: number
  /** Icon name */
  icon: KPIType
  /** Click handler */
  onClick?: () => void
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Optional trend data */
  trend?: {
    direction: 'up' | 'down'
    percentage: number
  }
  /** Optional comparison text */
  comparisonText?: string
  /** Retry handler for error state */
  onRetry?: () => void
  /** Additional class names */
  className?: string
}

// KPI configuration mapping
const KPI_CONFIG: Record<
  KPIType,
  {
    icon: React.ElementType
    bgColor: string
    iconColor: string
    hoverBorder: string
    route: string
  }
> = {
  po_pending_approval: {
    icon: Clock,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    hoverBorder: 'hover:border-yellow-300',
    route: '/planning/purchase-orders?approval_status=pending',
  },
  po_this_month: {
    icon: ShoppingCart,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
    route: '/planning/purchase-orders?created_this_month=true',
  },
  to_in_transit: {
    icon: Truck,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    hoverBorder: 'hover:border-orange-300',
    route: '/planning/transfer-orders?status=in_transit',
  },
  wo_scheduled_today: {
    icon: Calendar,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    hoverBorder: 'hover:border-green-300',
    route: '/planning/work-orders?scheduled_date=today',
  },
  wo_overdue: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    hoverBorder: 'hover:border-red-300',
    route: '/planning/work-orders?overdue=true',
  },
  open_orders: {
    icon: FileText,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverBorder: 'hover:border-purple-300',
    route: '/planning/purchase-orders?status=open',
  },
}

// Format large numbers
const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * KPICard component for displaying dashboard metrics
 */
export function KPICard({
  type,
  title,
  value,
  onClick,
  loading = false,
  error,
  trend,
  comparisonText,
  onRetry,
  className,
}: KPICardProps) {
  const router = useRouter()
  const config = KPI_CONFIG[type]
  const Icon = config.icon

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(config.route)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // Loading state
  if (loading) {
    return (
      <Card className={cn('border', className)} data-testid="kpi-card-loading">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card
        className={cn('border border-red-100 bg-red-50', className)}
        data-testid="kpi-card-error"
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-red-600">Failed to load KPI</p>
            <p className="text-xs text-red-500">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
                aria-label="Retry loading KPI"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayValue = formatNumber(value)

  return (
    <Card
      className={cn(
        'border transition-all cursor-pointer',
        config.hoverBorder,
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${displayValue}`}
      data-testid={`kpi-card-${type}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
            {trend && (
              <div
                className={cn(
                  'flex items-center text-xs',
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}
                aria-label={`Trend: ${trend.direction} ${trend.percentage}%`}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                <span>{trend.percentage}%</span>
              </div>
            )}
            {comparisonText && (
              <p className="text-xs text-gray-500">{comparisonText}</p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export interface KPICardsGridProps {
  /** KPI data */
  data: {
    po_pending_approval: number
    po_this_month: number
    to_in_transit: number
    wo_scheduled_today: number
    wo_overdue: number
    open_orders: number
  } | null
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Retry handler */
  onRetry?: () => void
  /** Card click handler */
  onCardClick?: (type: KPIType) => void
  /** Additional class names */
  className?: string
}

/**
 * KPICardsGrid - Grid layout for 6 KPI cards
 */
export function KPICardsGrid({
  data,
  loading = false,
  error,
  onRetry,
  onCardClick,
  className,
}: KPICardsGridProps) {
  const kpiCards: Array<{ type: KPIType; title: string }> = [
    { type: 'po_pending_approval', title: 'PO Pending Approval' },
    { type: 'po_this_month', title: 'PO This Month' },
    { type: 'to_in_transit', title: 'TO In Transit' },
    { type: 'wo_scheduled_today', title: 'WO Scheduled Today' },
    { type: 'wo_overdue', title: 'WO Overdue' },
    { type: 'open_orders', title: 'Open Orders' },
  ]

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
      role="region"
      aria-label="Key Performance Indicators"
    >
      {kpiCards.map((kpi) => (
        <KPICard
          key={kpi.type}
          type={kpi.type}
          title={kpi.title}
          value={data?.[kpi.type] ?? 0}
          icon={kpi.type}
          loading={loading}
          error={error}
          onRetry={onRetry}
          onClick={onCardClick ? () => onCardClick(kpi.type) : undefined}
        />
      ))}
    </div>
  )
}

export default KPICard
