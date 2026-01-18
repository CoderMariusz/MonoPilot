/**
 * Expiring Items Summary Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * 4 clickable cards showing counts per expiry tier
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ExpirySummary, ExpiryTier } from '@/lib/validation/expiry-alert-schema'
import { AlertCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

interface ExpiringItemsSummaryProps {
  summary: ExpirySummary | undefined
  onTierClick: (tier: ExpiryTier | 'all') => void
  activeTier: ExpiryTier | 'all'
  isLoading?: boolean
  className?: string
}

interface TierCardProps {
  title: string
  tier: ExpiryTier
  count: number
  value: number
  isActive: boolean
  onClick: () => void
  icon: React.ReactNode
  colorClass: string
  bgClass: string
  borderClass: string
}

function TierCard({
  title,
  tier,
  count,
  value,
  isActive,
  onClick,
  icon,
  colorClass,
  bgClass,
  borderClass,
}: TierCardProps) {
  return (
    <Card
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${title}: ${count} items, $${value.toLocaleString()} value. Click to filter.`}
      className={cn(
        'cursor-pointer transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive && `ring-2 ${borderClass}`,
        bgClass
      )}
      data-testid={`tier-card-${tier}`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={colorClass}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', colorClass)}>{count}</div>
        <p className="text-xs text-muted-foreground">
          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </CardContent>
    </Card>
  )
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ExpiringItemsSummary({
  summary,
  onTierClick,
  activeTier,
  isLoading = false,
  className,
}: ExpiringItemsSummaryProps) {
  if (isLoading) {
    return <SummarySkeleton />
  }

  const cards: Array<{
    title: string
    tier: ExpiryTier
    count: number
    icon: React.ReactNode
    colorClass: string
    bgClass: string
    borderClass: string
  }> = [
    {
      title: 'Expired',
      tier: 'expired',
      count: summary?.expired ?? 0,
      icon: <AlertCircle className="h-4 w-4" />,
      colorClass: 'text-red-600',
      bgClass: 'hover:bg-red-50',
      borderClass: 'ring-red-500',
    },
    {
      title: 'Critical (0-7d)',
      tier: 'critical',
      count: summary?.critical ?? 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      colorClass: 'text-orange-600',
      bgClass: 'hover:bg-orange-50',
      borderClass: 'ring-orange-500',
    },
    {
      title: 'Warning (8-30d)',
      tier: 'warning',
      count: summary?.warning ?? 0,
      icon: <Clock className="h-4 w-4" />,
      colorClass: 'text-yellow-600',
      bgClass: 'hover:bg-yellow-50',
      borderClass: 'ring-yellow-500',
    },
    {
      title: 'OK (31+d)',
      tier: 'ok',
      count: summary?.ok ?? 0,
      icon: <CheckCircle className="h-4 w-4" />,
      colorClass: 'text-green-600',
      bgClass: 'hover:bg-green-50',
      borderClass: 'ring-green-500',
    },
  ]

  // Calculate value per tier (simplified - evenly distributed for now)
  const totalValue = summary?.total_value ?? 0
  const totalCount =
    (summary?.expired ?? 0) +
    (summary?.critical ?? 0) +
    (summary?.warning ?? 0) +
    (summary?.ok ?? 0)

  const getValueForTier = (count: number): number => {
    if (totalCount === 0) return 0
    return (count / totalCount) * totalValue
  }

  return (
    <div
      className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}
      data-testid="expiring-items-summary"
      role="group"
      aria-label="Expiry tier summary cards"
    >
      {cards.map((card) => (
        <TierCard
          key={card.tier}
          title={card.title}
          tier={card.tier}
          count={card.count}
          value={getValueForTier(card.count)}
          isActive={activeTier === card.tier}
          onClick={() =>
            onTierClick(activeTier === card.tier ? 'all' : card.tier)
          }
          icon={card.icon}
          colorClass={card.colorClass}
          bgClass={card.bgClass}
          borderClass={card.borderClass}
        />
      ))}
    </div>
  )
}
