/**
 * Adjustments Summary Cards Component
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ClipboardList, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import type { AdjustmentSummary } from '@/lib/types/adjustment'

interface AdjustmentsSummaryCardsProps {
  summary: AdjustmentSummary | null | undefined
  isLoading?: boolean
  onCardClick?: (type: 'total' | 'increased' | 'decreased' | 'pending') => void
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatQty(value: number): string {
  if (value >= 0) {
    return `+${value.toLocaleString()} kg`
  }
  return `${value.toLocaleString()} kg`
}

export function AdjustmentsSummaryCards({
  summary,
  isLoading,
  onCardClick,
}: AdjustmentsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading adjustments summary">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      testId: 'kpi-total-adjustments',
      type: 'total' as const,
      title: 'Total Adjustments',
      value: summary?.total_adjustments || 0,
      description: 'Last 30 days',
      icon: ClipboardList,
      action: 'View All',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      format: 'number' as const,
    },
    {
      testId: 'kpi-qty-increased',
      type: 'increased' as const,
      title: 'Qty Increased',
      value: summary?.qty_increased || 0,
      subValue: summary?.qty_increased_value || 0,
      description: formatValue(summary?.qty_increased_value || 0),
      icon: TrendingUp,
      action: 'View Increases',
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50',
      format: 'qty' as const,
    },
    {
      testId: 'kpi-qty-decreased',
      type: 'decreased' as const,
      title: 'Qty Decreased',
      value: summary?.qty_decreased || 0,
      subValue: summary?.qty_decreased_value || 0,
      description: formatValue(summary?.qty_decreased_value || 0),
      icon: TrendingDown,
      action: 'View Decreases',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
      format: 'qty' as const,
    },
    {
      testId: 'kpi-pending-approval',
      type: 'pending' as const,
      title: 'Pending Approval',
      value: summary?.pending_approval || 0,
      description: 'Awaiting review',
      icon: Clock,
      action: 'Review',
      colorClass: 'text-yellow-600',
      bgClass: 'bg-yellow-50',
      format: 'number' as const,
    },
  ]

  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Adjustments summary"
    >
      {cards.map((card) => (
        <Card
          key={card.testId}
          data-testid={card.testId}
          className="cursor-pointer hover:border-primary/50 transition-colors"
          tabIndex={0}
          role="button"
          aria-label={`${card.title}: ${card.value} ${card.description}`}
          onClick={() => onCardClick?.(card.type)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onCardClick?.(card.type)
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgClass}`}>
              <card.icon className={`h-4 w-4 ${card.colorClass}`} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.format === 'qty' ? (
                <span className={card.type === 'increased' ? 'text-green-600' : 'text-red-600'}>
                  {card.type === 'increased' ? '+' : '-'}
                  {Math.abs(card.value).toLocaleString()} kg
                </span>
              ) : (
                card.value.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
            {onCardClick && (
              <Button
                variant="link"
                size="sm"
                className="px-0 mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onCardClick(card.type)
                }}
              >
                {card.action}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
