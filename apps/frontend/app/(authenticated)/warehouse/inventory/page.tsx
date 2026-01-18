/**
 * Warehouse Inventory Browser Page
 * Feature: WH-INV-001 - Inventory Browser & Cycle Counts
 *
 * Consolidates 5 tabs:
 * 1. Overview - Inventory summary by Product/Location/Warehouse
 * 2. Aging Report - FIFO/FEFO aging analysis
 * 3. Expiring Items - Items approaching or past expiry
 * 4. Cycle Counts - Inventory count planning and execution
 * 5. Adjustments - Stock adjustment history and approval
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Package,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';
import {
  InventoryOverviewTab,
  AgingReportTab,
  ExpiringItemsTab,
  CycleCountsTab,
  AdjustmentsTab
} from '@/components/warehouse/inventory';

interface InventoryKPI {
  total_lps: number;
  total_value: number;
  expiring_soon: number;
  expired: number;
}

async function fetchInventoryKPIs(): Promise<InventoryKPI> {
  const response = await fetch('/api/warehouse/dashboard/inventory-kpis');
  if (!response.ok) throw new Error('Failed to fetch KPIs');
  return response.json();
}

export default function InventoryBrowserPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['inventory-kpis'],
    queryFn: fetchInventoryKPIs,
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Browser</h1>
          <p className="text-muted-foreground">
            Comprehensive inventory management and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total LP Count</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisLoading ? '...' : kpis?.total_lps.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Active License Plates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisLoading ? '...' : `$${kpis?.total_value.toLocaleString() || '0'}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory at cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {kpisLoading ? '...' : kpis?.expiring_soon || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
            {!kpisLoading && kpis && kpis.expiring_soon > 0 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setActiveTab('expiring')}
              >
                View Items →
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {kpisLoading ? '...' : kpis?.expired || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Past expiry date
            </p>
            {!kpisLoading && kpis && kpis.expired > 0 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-red-600"
                onClick={() => setActiveTab('expiring')}
              >
                Urgent Action →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Items</TabsTrigger>
          <TabsTrigger value="cycles">Cycle Counts</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryOverviewTab />
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <AgingReportTab />
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <ExpiringItemsTab />
        </TabsContent>

        <TabsContent value="cycles" className="space-y-4">
          <CycleCountsTab />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <AdjustmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
