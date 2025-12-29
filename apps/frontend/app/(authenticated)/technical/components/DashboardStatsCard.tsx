'use client'

/**
 * DashboardStatsCard Component (Story 02.12)
 * AC-12.01 to AC-12.05: Reusable stats card with icon, value, breakdown, trend
 *
 * Props:
 * - icon: Lucide icon component
 * - title: Card title (Products, BOMs, Routings, Avg Cost)
 * - value: Main value (number or string)
 * - breakdown: Optional breakdown items (active/inactive counts)
 * - trend: Optional trend indicator (percent + direction)
 * - onClick: Navigation handler
 * - href: Alternative navigation link
 * - loading: Show skeleton
 */

import { type LucideIcon } from 'lucide-react'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface DashboardStatsCardProps {
  icon: LucideIcon
  title: string
  value: number | string
  breakdown?: Array<{
    label: string
    value: number
    type?: 'active' | 'inactive' | 'phased' | 'default'
  }>
  trend?: {
    percent: number
    direction: 'up' | 'down' | 'neutral'
  }
  onClick?: () => void
  href?: string
  loading?: boolean
  className?: string
}

// Skeleton for loading state
export function DashboardStatsCardSkeleton() {
  return (
    <Card
      className="h-[140px] transition-shadow"
      data-testid="stats-card-skeleton"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardStatsCard({
  icon: Icon,
  title,
  value,
  breakdown,
  trend,
  onClick,
  href,
  loading,
  className
}: DashboardStatsCardProps) {
  if (loading) {
    return <DashboardStatsCardSkeleton />
  }

  const TrendIcon = trend?.direction === 'up'
    ? ArrowUpIcon
    : trend?.direction === 'down'
    ? ArrowDownIcon
    : MinusIcon

  const trendColor = trend?.direction === 'up'
    ? 'text-red-600'
    : trend?.direction === 'down'
    ? 'text-green-600'
    : 'text-gray-500'

  const content = (
    <Card
      className={cn(
        'h-[140px] cursor-pointer transition-all hover:shadow-lg',
        'rounded-lg bg-white border shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
      onClick={onClick}
      data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      role="region"
      aria-label={`${title}: ${value}${breakdown ? `, ${breakdown.map(b => `${b.label}: ${b.value}`).join(', ')}` : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header with icon and title */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </div>
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>

        {/* Main value */}
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-bold text-gray-900">{value}</span>

          {/* Trend indicator */}
          {trend && trend.percent > 0 && (
            <div
              className={cn('flex items-center gap-1 text-sm', trendColor)}
              data-testid="trend-indicator"
              aria-label={`Trend: ${trend.direction === 'up' ? 'up' : trend.direction === 'down' ? 'down' : 'neutral'} ${trend.percent}%`}
            >
              <TrendIcon className="h-4 w-4" aria-hidden="true" />
              <span>{trend.percent}%</span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="flex gap-3 mt-auto">
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    item.type === 'active' ? 'bg-green-500' :
                    item.type === 'inactive' ? 'bg-gray-400' :
                    item.type === 'phased' ? 'bg-orange-500' :
                    'bg-blue-500'
                  )}
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-600">
                  {item.label}: <span className="font-medium">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}

export default DashboardStatsCard
