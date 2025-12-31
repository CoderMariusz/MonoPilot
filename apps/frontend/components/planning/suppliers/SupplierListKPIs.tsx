/**
 * Supplier List KPI Cards
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * 4 KPI cards: Total, Active, Inactive, This Month
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, CheckCircle2, XCircle, CalendarDays } from 'lucide-react'
import type { SupplierSummary, SupplierStatusFilter } from '@/lib/types/supplier'

interface SupplierListKPIsProps {
  summary: SupplierSummary | undefined
  loading?: boolean
  onFilterChange?: (filter: SupplierStatusFilter) => void
}

export function SupplierListKPIs({
  summary,
  loading = false,
  onFilterChange,
}: SupplierListKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} data-testid="kpi-card">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      id: 'total',
      testId: 'kpi-card-total',
      label: 'Total Suppliers',
      value: summary?.total_count ?? 0,
      subtext: `${summary?.active_rate?.toFixed(2) ?? 0}% active rate`,
      subtextTestId: 'kpi-card-active-rate',
      icon: Building2,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      onClick: () => onFilterChange?.('all'),
    },
    {
      id: 'active',
      testId: 'kpi-card-active',
      label: 'Active Suppliers',
      value: summary?.active_count ?? 0,
      subtext: 'View All Active',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      onClick: () => onFilterChange?.('active'),
    },
    {
      id: 'inactive',
      testId: 'kpi-card-inactive',
      label: 'Inactive',
      value: summary?.inactive_count ?? 0,
      subtext: 'View Inactive',
      icon: XCircle,
      iconColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      onClick: () => onFilterChange?.('inactive'),
    },
    {
      id: 'this-month',
      testId: 'kpi-card-this-month',
      label: 'This Month',
      value: summary?.this_month_count ?? 0,
      subtext: 'Added',
      icon: CalendarDays,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
      onClick: undefined,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          data-testid="kpi-card"
          className={`cursor-pointer hover:shadow-md transition-shadow ${card.onClick ? 'hover:border-primary' : ''}`}
          onClick={card.onClick}
        >
          <CardContent className="p-6" data-testid={card.testId}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
                <p
                  className="text-xs text-muted-foreground mt-1"
                  data-testid={card.subtextTestId}
                >
                  {card.subtext}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
