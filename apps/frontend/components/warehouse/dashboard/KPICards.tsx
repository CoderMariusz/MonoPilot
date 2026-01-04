/**
 * KPI Cards Component
 * Story: 05.7 - Warehouse Dashboard
 * Displays 5 KPI metric cards
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Box, CheckCircle, Lock, TrendingDown, AlertTriangle } from 'lucide-react';
import type { DashboardKPIs } from '@/lib/types/warehouse-dashboard';

interface KPICardsProps {
  kpis: DashboardKPIs | undefined;
  isLoading: boolean;
}

const kpiConfig = [
  {
    id: 'total_lps',
    label: 'Total LPs',
    icon: Box,
    color: 'blue' as const,
    getValue: (kpis: DashboardKPIs) => kpis.total_lps,
    format: (val: number) => `${val.toLocaleString()} LPs`,
  },
  {
    id: 'available_lps',
    label: 'Available LPs',
    icon: CheckCircle,
    color: 'green' as const,
    getValue: (kpis: DashboardKPIs) => kpis.available_lps,
    format: (val: number) => `${val.toLocaleString()} Available`,
  },
  {
    id: 'reserved_lps',
    label: 'Reserved LPs',
    icon: Lock,
    color: 'orange' as const,
    getValue: (kpis: DashboardKPIs) => kpis.reserved_lps,
    format: (val: number) => `${val.toLocaleString()} Reserved`,
  },
  {
    id: 'consumed_today',
    label: 'Consumed Today',
    icon: TrendingDown,
    color: 'blue' as const,
    getValue: (kpis: DashboardKPIs) => kpis.consumed_today,
    format: (val: number) => `${val.toLocaleString()} Consumed`,
    subtitle: 'Since midnight',
  },
  {
    id: 'expiring_soon',
    label: 'Expiring Soon',
    icon: AlertTriangle,
    color: 'red' as const,
    getValue: (kpis: DashboardKPIs) => kpis.expiring_soon,
    format: (val: number) => `${val.toLocaleString()} Expiring`,
    subtitle: 'Next 30 days',
  },
];

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  red: 'bg-red-50 border-red-200 text-red-700',
};

export function KPICards({ kpis, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="kpi-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} data-testid={`skeleton-kpi-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="kpi-grid">
      {kpiConfig.map((config) => {
        const Icon = config.icon;
        const value = config.getValue(kpis);
        const colorClass = colorClasses[config.color];

        return (
          <Card
            key={config.id}
            className={`${colorClass} transition-all hover:shadow-md cursor-pointer`}
            data-testid={`kpi-card-${config.id}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              <Icon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config.format(value)}</div>
              {'subtitle' in config && config.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{config.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
