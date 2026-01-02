/**
 * PO KPI Cards Component
 * Story 03.3: PO CRUD + Lines
 * Displays 4 KPI summary cards per PLAN-004:
 * - Open POs
 * - Pending Approval
 * - Overdue
 * - This Month
 */

'use client'

import { ShoppingCart, Clock, AlertTriangle, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePOSummary } from '@/lib/hooks/use-purchase-orders'
import type { POSummary } from '@/lib/types/purchase-order'

interface POKPICardsProps {
  onCardClick?: (filter: {
    type: 'open' | 'pending_approval' | 'overdue' | 'this_month'
  }) => void
  className?: string
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

const KPI_CARDS = [
  {
    id: 'open',
    title: 'Open POs',
    subtitle: 'Total value: ',
    icon: ShoppingCart,
    valueKey: 'open_count' as keyof POSummary,
    subtotalKey: 'open_total' as keyof POSummary,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
    actionLabel: 'View All',
    filterType: 'open' as const,
  },
  {
    id: 'pending_approval',
    title: 'Pending Approval',
    subtitle: '> threshold',
    icon: Clock,
    valueKey: 'pending_approval_count' as keyof POSummary,
    subtotalKey: null,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    hoverBorder: 'hover:border-yellow-300',
    actionLabel: 'Review Now',
    filterType: 'pending_approval' as const,
  },
  {
    id: 'overdue',
    title: 'Overdue',
    subtitle: 'Past expected date',
    icon: AlertTriangle,
    valueKey: 'overdue_count' as keyof POSummary,
    subtotalKey: null,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    hoverBorder: 'hover:border-red-300',
    actionLabel: 'View Overdue',
    filterType: 'overdue' as const,
  },
  {
    id: 'this_month',
    title: 'This Month',
    subtitle: ' POs created',
    icon: CalendarDays,
    valueKey: 'this_month_total' as keyof POSummary,
    subtotalKey: 'this_month_count' as keyof POSummary,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    hoverBorder: 'hover:border-green-300',
    actionLabel: 'View Report',
    filterType: 'this_month' as const,
    formatValue: true,
  },
]

export function POKPICards({ onCardClick, className }: POKPICardsProps) {
  const { data, isLoading, error } = usePOSummary()

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
        const displayValue = card.formatValue ? formatCurrency(value as number) : value
        const subtotal = card.subtotalKey ? data?.[card.subtotalKey] : null

        // Build subtitle based on card type
        let subtitleText = card.subtitle
        if (card.id === 'open' && subtotal !== null) {
          subtitleText = `${card.subtitle}${formatCurrency(subtotal as number)}`
        } else if (card.id === 'this_month' && subtotal !== null) {
          subtitleText = `${subtotal}${card.subtitle}`
        }

        return (
          <Card
            key={card.id}
            className={cn(
              'border transition-all cursor-pointer',
              card.hoverBorder,
              'hover:shadow-md'
            )}
            onClick={() => onCardClick?.({ type: card.filterType })}
            tabIndex={0}
            role="button"
            aria-label={`${card.title} card: ${displayValue}, click to ${card.actionLabel.toLowerCase()}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCardClick?.({ type: card.filterType })
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
                  <p className="text-xs text-gray-500">{subtitleText}</p>
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
                  onCardClick?.({ type: card.filterType })
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

export default POKPICards
