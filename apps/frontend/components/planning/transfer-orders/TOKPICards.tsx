/**
 * TO KPI Summary Cards Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays 4 KPI cards: Open TOs, In Transit, Overdue, This Week
 */

'use client'

import { FileText, Truck, AlertTriangle, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { TOSummary } from '@/lib/hooks/use-transfer-orders'

interface TOKPICardsProps {
  summary: TOSummary | undefined
  loading?: boolean
  onCardClick?: (filter: 'open' | 'in_transit' | 'overdue' | 'this_week') => void
}

interface KPICardConfig {
  id: 'open' | 'in_transit' | 'overdue' | 'this_week'
  label: string
  description: string
  icon: React.ElementType
  valueKey: keyof TOSummary
  bgColor: string
  iconColor: string
  hoverColor: string
}

const kpiCards: KPICardConfig[] = [
  {
    id: 'open',
    label: 'Open TOs',
    description: 'Active transfers',
    icon: FileText,
    valueKey: 'open_count',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-100',
  },
  {
    id: 'in_transit',
    label: 'In Transit',
    description: "Shipped, not recv'd",
    icon: Truck,
    valueKey: 'in_transit_count',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverColor: 'hover:bg-purple-100',
  },
  {
    id: 'overdue',
    label: 'Overdue',
    description: 'Past planned date',
    icon: AlertTriangle,
    valueKey: 'overdue_count',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    hoverColor: 'hover:bg-red-100',
  },
  {
    id: 'this_week',
    label: 'This Week',
    description: 'TOs created',
    icon: Calendar,
    valueKey: 'this_week_count',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    hoverColor: 'hover:bg-green-100',
  },
]

export function TOKPICards({ summary, loading, onCardClick }: TOKPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border rounded-lg bg-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => {
        const Icon = card.icon
        const value = summary?.[card.valueKey] ?? 0
        const isClickable = onCardClick !== undefined

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onCardClick?.(card.id)}
            disabled={!isClickable}
            className={cn(
              'p-4 border rounded-lg bg-white text-left transition-all',
              isClickable && 'cursor-pointer',
              isClickable && card.hoverColor,
              !isClickable && 'cursor-default'
            )}
            aria-label={`${card.label}: ${value}. ${card.description}. Click to filter.`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
              <div className={cn('p-2 rounded-full', card.bgColor)}>
                <Icon className={cn('h-5 w-5', card.iconColor)} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default TOKPICards
