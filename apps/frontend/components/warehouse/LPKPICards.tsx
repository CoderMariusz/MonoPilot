/**
 * LP KPI Cards Component
 * Story 05.1: License Plates UI
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLPSummary } from '@/lib/hooks/use-license-plates'
import { Package, CheckCircle, Lock, AlertTriangle } from 'lucide-react'

interface LPKPICardsProps {
  onCardClick?: (type: 'total' | 'available' | 'reserved' | 'expiring') => void
}

export function LPKPICards({ onCardClick }: LPKPICardsProps) {
  const { data: summary, isLoading } = useLPSummary()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      testId: 'kpi-total-lps',
      type: 'total' as const,
      title: 'Total LPs',
      value: summary?.total_count || 0,
      description: `${(summary?.total_quantity || 0).toLocaleString()} KG total`,
      icon: Package,
      action: 'View All',
    },
    {
      testId: 'kpi-available',
      type: 'available' as const,
      title: 'Available',
      value: summary?.available_count || 0,
      description: `${summary?.available_percentage?.toFixed(1) || 0}% of total`,
      icon: CheckCircle,
      action: 'View Available',
    },
    {
      testId: 'kpi-reserved',
      type: 'reserved' as const,
      title: 'Reserved',
      value: summary?.reserved_count || 0,
      description: `${summary?.reserved_percentage?.toFixed(1) || 0}% of total`,
      icon: Lock,
      action: 'View Reserved',
    },
    {
      testId: 'kpi-expiring',
      type: 'expiring' as const,
      title: 'Expiring Soon',
      value: summary?.expiring_soon_count || 0,
      description: 'Next 7 days',
      icon: AlertTriangle,
      action: 'View Expiring',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.testId} data-testid={card.testId} className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
            {onCardClick && (
              <Button
                variant="link"
                size="sm"
                className="px-0 mt-2"
                onClick={() => onCardClick(card.type)}
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
