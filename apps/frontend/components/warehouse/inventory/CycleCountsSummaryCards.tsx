/**
 * Cycle Counts Summary Cards Component
 * Wireframe: WH-INV-001 - Cycle Counts Tab (Screen 5)
 * PRD: FR-023 (Cycle Count)
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, PlayCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { CycleCountSummary } from '@/lib/types/cycle-count'

interface CycleCountsSummaryCardsProps {
  summary: CycleCountSummary | null | undefined
  isLoading?: boolean
  onCardClick?: (type: 'planned' | 'in_progress' | 'completed' | 'with_variances') => void
}

export function CycleCountsSummaryCards({
  summary,
  isLoading,
  onCardClick,
}: CycleCountsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading cycle count summary">
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
      testId: 'kpi-planned',
      type: 'planned' as const,
      title: 'Planned',
      value: summary?.planned_count || 0,
      description: 'Scheduled counts',
      icon: Calendar,
      action: 'Schedule Next',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
    },
    {
      testId: 'kpi-in-progress',
      type: 'in_progress' as const,
      title: 'In Progress',
      value: summary?.in_progress_count || 0,
      description: 'Currently counting',
      icon: PlayCircle,
      action: 'Continue',
      colorClass: 'text-yellow-600',
      bgClass: 'bg-yellow-50',
    },
    {
      testId: 'kpi-completed',
      type: 'completed' as const,
      title: 'Completed',
      value: summary?.completed_count || 0,
      description: 'This month',
      icon: CheckCircle2,
      action: 'View History',
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50',
    },
    {
      testId: 'kpi-with-variances',
      type: 'with_variances' as const,
      title: 'With Variances',
      value: summary?.with_variances_count || 0,
      description: 'Need review',
      icon: AlertTriangle,
      action: 'Review',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
    },
  ]

  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Cycle count summary"
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
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
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
