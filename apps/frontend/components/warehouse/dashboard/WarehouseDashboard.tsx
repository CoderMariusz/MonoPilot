/**
 * Warehouse Dashboard Component
 * Story: 05.7 - Warehouse Dashboard
 * Main container with data fetching and state management
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { KPICards } from './KPICards';
import { LowStockAlerts } from './LowStockAlerts';
import { ExpiringLPsWidget } from './ExpiringLPsWidget';
import { BlockedLPsWidget } from './BlockedLPsWidget';
import { ActivityFeed } from './ActivityFeed';
import { QuickActions } from './QuickActions';
import type { DashboardKPIs, DashboardAlerts, DashboardActivity } from '@/lib/types/warehouse-dashboard';
import { format } from 'date-fns';

export function WarehouseDashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch KPIs
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useQuery<DashboardKPIs>({
    queryKey: ['warehouse-dashboard-kpis'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/dashboard/kpis');
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      return res.json();
    },
    refetchInterval: 60000, // 60 seconds
  });

  // Fetch Alerts
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useQuery<DashboardAlerts>({
    queryKey: ['warehouse-dashboard-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/dashboard/alerts');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Fetch Activity
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery<DashboardActivity>({
    queryKey: ['warehouse-dashboard-activity'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/dashboard/activity?limit=20');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchKpis(), refetchAlerts(), refetchActivity()]);
    setLastUpdated(new Date());
  };

  const hasError = kpisError || alertsError || activityError;

  // Show empty state if no LPs exist
  if (!kpisLoading && kpis && kpis.total_lps === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Warehouse Dashboard</h1>
          <QuickActions />
        </div>

        <div
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
          data-testid="empty-state"
        >
          <div className="mb-6 text-muted-foreground">
            <svg
              className="mx-auto h-24 w-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">No License Plates Yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Get started by receiving your first shipment. Create a GRN from a Purchase Order or
            Transfer Order to create License Plates and begin tracking your inventory.
          </p>
          <QuickActions />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="last-updated">
            Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={kpisLoading || alertsLoading || activityLoading}
            data-testid="refresh-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <QuickActions />
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            Failed to load some dashboard data. Please try refreshing.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <KPICards kpis={kpis} isLoading={kpisLoading} />

      {/* Alert Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LowStockAlerts
          alerts={alerts?.low_stock || []}
          isLoading={alertsLoading}
        />
        <ExpiringLPsWidget
          alerts={alerts?.expiring_items || []}
          isLoading={alertsLoading}
        />
        <BlockedLPsWidget
          alerts={alerts?.blocked_lps || []}
          isLoading={alertsLoading}
        />
      </div>

      {/* Activity Feed */}
      <ActivityFeed
        activities={activity?.activities || []}
        isLoading={activityLoading}
      />
    </div>
  );
}
