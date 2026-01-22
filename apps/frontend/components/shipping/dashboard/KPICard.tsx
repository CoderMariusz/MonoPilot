/**
 * KPI Card Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Individual KPI card with:
 * - Title, value, icon
 * - Status-based background color
 * - Trend indicator
 * - Optional breakdown tooltip
 * - Click action
 */

'use client'

import { ReactNode, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendIndicator } from '@/lib/types/shipping-dashboard'

export type KPIStatus = 'good' | 'warning' | 'critical' | 'neutral'

export interface KPICardProps {
  title: string
  value: number
  icon: ReactNode
  status: KPIStatus
  trend?: TrendIndicator
  breakdown?: Record<string, number>
  action?: {
    label: string
    onClick: () => void
  }
}

const statusStyles: Record<KPIStatus, string> = {
  good: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  critical: 'bg-red-50 border-red-200',
  neutral: 'bg-gray-50 border-gray-200',
}

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-500',
}

export function KPICard({
  title,
  value,
  icon,
  status,
  trend,
  breakdown,
  action,
}: KPICardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const isClickable = !!action

  const cardContent = (
    <Card
      data-testid={`kpi-card-${title}`}
      aria-label={`${title}: ${value}`}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        'transition-all focus-visible:ring-2 focus-visible:ring-offset-2',
        statusStyles[status],
        isClickable && 'cursor-pointer hover:shadow-md'
      )}
      onClick={action?.onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          action?.onClick()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>

            {/* Trend indicator */}
            {trend && (
              <div className={cn('flex items-center gap-1 text-sm', trendColors[trend.direction])}>
                {trend.direction === 'up' && (
                  <TrendingUp className="h-4 w-4" data-testid="trend-up" />
                )}
                {trend.direction === 'down' && (
                  <TrendingDown className="h-4 w-4" data-testid="trend-down" />
                )}
                {trend.direction === 'neutral' && (
                  <Minus className="h-4 w-4" data-testid="trend-neutral" />
                )}
                <span className="font-medium tabular-nums">
                  {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                  {trend.percentage}%
                </span>
              </div>
            )}
          </div>

          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  if (breakdown) {
    return (
      <TooltipProvider>
        <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
          <TooltipTrigger asChild onMouseEnter={() => setShowTooltip(true)}>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3">
            <div className="space-y-1">
              <p className="font-medium text-sm mb-2">{title} Breakdown</p>
              {Object.entries(breakdown).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium tabular-nums">{val}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return cardContent
}

export default KPICard
