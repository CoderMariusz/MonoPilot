/**
 * WO KPI Cards Component
 * Story 03.10: Work Order CRUD
 * Displays 4 KPI summary cards per PLAN-013:
 * - Scheduled Today
 * - In Progress
 * - On Hold
 * - This Week
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, Play, Pause, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WOKPISummary } from '@/lib/types/work-order'
import { workOrderKeys } from '@/lib/hooks/use-work-orders'

interface WOKPICardsProps {
  onCardClick?: (filter: {
    status?: string
    dateFilter?: 'today' | 'this_week'
  }) => void
  className?: string
}

/**
 * Fetch KPI summary from API
 */
async function fetchKPISummary(): Promise<WOKPISummary> {
  const response = await fetch('/api/planning/work-orders/summary')

  if (!response.ok) {
    // Return defaults on error
    return {
      scheduled_today_count: 0,
      in_progress_count: 0,
      on_hold_count: 0,
      this_week_count: 0,
    }
  }

  const data = await response.json()
  return data.data || data
}

const KPI_CARDS = [
  {
    id: 'scheduled_today',
    title: 'Scheduled Today',
    subtitle: 'Ready to start',
    icon: Calendar,
    valueKey: 'scheduled_today_count' as keyof WOKPISummary,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
    filter: { dateFilter: 'today' as const },
    actionLabel: 'View All',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    subtitle: 'Active production',
    icon: Play,
    valueKey: 'in_progress_count' as keyof WOKPISummary,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    hoverBorder: 'hover:border-yellow-300',
    filter: { status: 'in_progress' },
    actionLabel: 'Monitor',
  },
  {
    id: 'on_hold',
    title: 'On Hold',
    subtitle: 'Awaiting action',
    icon: Pause,
    valueKey: 'on_hold_count' as keyof WOKPISummary,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    hoverBorder: 'hover:border-orange-300',
    filter: { status: 'on_hold' },
    actionLabel: 'Resolve',
  },
  {
    id: 'this_week',
    title: 'This Week',
    subtitle: 'WOs created',
    icon: CalendarDays,
    valueKey: 'this_week_count' as keyof WOKPISummary,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    hoverBorder: 'hover:border-green-300',
    filter: { dateFilter: 'this_week' as const },
    actionLabel: 'View Report',
  },
]

export function WOKPICards({ onCardClick, className }: WOKPICardsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: workOrderKeys.summary(),
    queryFn: fetchKPISummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {KPI_CARDS.map((card) => (
          <Card key={card.id} className="border border-red-100 bg-red-50">
            <CardContent className="p-4 text-center text-red-600 text-sm">
              Failed to load
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {KPI_CARDS.map((card) => {
        const Icon = card.icon
        const value = data?.[card.valueKey] ?? 0

        return (
          <Card
            key={card.id}
            className={cn(
              'border transition-all cursor-pointer',
              card.hoverBorder,
              'hover:shadow-md'
            )}
            onClick={() => onCardClick?.(card.filter)}
            tabIndex={0}
            role="button"
            aria-label={`${card.title} card: ${value} work orders, click to ${card.actionLabel.toLowerCase()}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCardClick?.(card.filter)
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </div>
                <div className={cn('p-2.5 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-5 w-5', card.iconColor)} />
                </div>
              </div>
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-xs text-gray-500 hover:text-gray-700 mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onCardClick?.(card.filter)
                }}
                aria-label={`${card.actionLabel} for ${card.title}`}
              >
                [{card.actionLabel}]
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default WOKPICards
