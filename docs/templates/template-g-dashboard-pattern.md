# Template G: Dashboard Pattern

**Use Case:** Module dashboards (Technical, Planning, Production, Quality, Warehouse, Shipping, NPD)
**Token Savings:** ~6,000 tokens per dashboard (vs 8,000 bez template)
**Stories Using:** ~12 dashboard stories across all epics

---

## Pattern Overview

Każdy moduł potrzebuje dashboardu z:
- ✅ KPI Cards (4-6 key metrics)
- ✅ Charts (bar, line, pie charts)
- ✅ Recent Activity Table (last 10 items)
- ✅ Auto-refresh (every 30s)
- ✅ Responsive grid layout

---

## Template Structure

### 1. Dashboard Page Component

```tsx
// app/(authenticated)/{module}/dashboard/page.tsx

'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { KPICard } from '@/components/dashboard/kpi-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table'
import { BarChart, LineChart, PieChart } from '@/components/charts'

export default function {Module}DashboardPage() {
  // Fetch dashboard data
  const { data, error, isLoading, mutate } = useSWR(
    '/api/{module}/dashboard',
    fetcher,
    { refreshInterval: 30000 } // Auto-refresh every 30s
  )

  // Handle refresh button
  const handleRefresh = () => {
    mutate()
  }

  if (isLoading) return <DashboardSkeleton />
  if (error) return <div>Error loading dashboard</div>

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{Module} Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date(data.updated_at).toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="KPI 1 Name"
          value={data.kpis.kpi1}
          trend={data.kpis.kpi1_trend}
          icon={<Icon1 className="h-4 w-4" />}
          description="Description of KPI 1"
          onClick={() => router.push('/{module}/kpi1-detail')}
        />
        <KPICard
          title="KPI 2 Name"
          value={data.kpis.kpi2}
          trend={data.kpis.kpi2_trend}
          icon={<Icon2 className="h-4 w-4" />}
          description="Description of KPI 2"
        />
        <KPICard
          title="KPI 3 Name"
          value={data.kpis.kpi3}
          subtitle={data.kpis.kpi3_subtitle}
          icon={<Icon3 className="h-4 w-4" />}
          color="green"
        />
        <KPICard
          title="KPI 4 Name"
          value={data.kpis.kpi4}
          trend={data.kpis.kpi4_trend}
          icon={<Icon4 className="h-4 w-4" />}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Chart 1 Title" description="Chart 1 description">
          <BarChart
            data={data.charts.chart1_data}
            xKey="label"
            yKey="value"
            color="hsl(var(--chart-1))"
            height={300}
          />
        </ChartCard>

        <ChartCard title="Chart 2 Title" description="Chart 2 description">
          <LineChart
            data={data.charts.chart2_data}
            xKey="date"
            yKey="count"
            color="hsl(var(--chart-2))"
            height={300}
          />
        </ChartCard>
      </div>

      {/* Additional Chart (Full Width) */}
      <ChartCard title="Chart 3 Title" description="Chart 3 description">
        <PieChart
          data={data.charts.chart3_data}
          nameKey="category"
          valueKey="count"
          height={400}
        />
      </ChartCard>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityTable
            data={data.recent_activity}
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'status', label: 'Status' },
              { key: 'created_at', label: 'Created', render: (val) => formatDate(val) },
            ]}
            emptyMessage="No recent activity"
            onRowClick={(row) => router.push(`/{module}/items/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}
```

---

### 2. API Endpoint

```typescript
// app/api/{module}/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/services/org-service'
import { get{Module}Dashboard } from '@/lib/services/{module}-dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = await getCurrentOrgId()
    const dashboard = await get{Module}Dashboard(orgId)

    return NextResponse.json({
      data: dashboard,
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('[{Module}] Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
```

---

### 3. Dashboard Service

```typescript
// lib/services/{module}-dashboard-service.ts

import { createServerSupabaseAdmin } from '@/lib/supabase/server-admin'

export interface {Module}Dashboard {
  kpis: {
    kpi1: number
    kpi1_trend: { value: string; direction: 'up' | 'down' | 'neutral' }
    kpi2: number
    kpi2_trend: { value: string; direction: 'up' | 'down' | 'neutral' }
    kpi3: number
    kpi3_subtitle: string
    kpi4: number
    kpi4_trend: { value: string; direction: 'up' | 'down' | 'neutral' }
  }
  charts: {
    chart1_data: Array<{ label: string; value: number }>
    chart2_data: Array<{ date: string; count: number }>
    chart3_data: Array<{ category: string; count: number }>
  }
  recent_activity: Array<{
    id: string
    name: string
    status: string
    created_at: string
  }>
}

export async function get{Module}Dashboard(orgId: string): Promise<{Module}Dashboard> {
  const supabase = createServerSupabaseAdmin()

  // ===========================================
  // KPI 1: Count of Active Items
  // ===========================================
  const { count: kpi1 } = await supabase
    .from('{table_name}')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')
    .eq('is_deleted', false)

  // Calculate trend (compare to last month)
  const lastMonthStart = new Date()
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  lastMonthStart.setDate(1)
  lastMonthStart.setHours(0, 0, 0, 0)

  const { count: kpi1_last_month } = await supabase
    .from('{table_name}')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .lte('created_at', lastMonthStart.toISOString())

  const kpi1_trend = calculateTrend(kpi1, kpi1_last_month)

  // ===========================================
  // KPI 2: Count of Pending Items
  // ===========================================
  const { count: kpi2 } = await supabase
    .from('{table_name}')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .eq('is_deleted', false)

  const kpi2_trend = { value: '+0%', direction: 'neutral' as const }

  // ===========================================
  // KPI 3: Custom Calculation
  // ===========================================
  const kpi3 = 0 // Calculate based on module logic
  const kpi3_subtitle = 'Subtitle text'

  // ===========================================
  // KPI 4: Another Metric
  // ===========================================
  const kpi4 = 0 // Calculate based on module logic
  const kpi4_trend = { value: '+0%', direction: 'neutral' as const }

  // ===========================================
  // Chart 1: Bar Chart Data (e.g., Items by Status)
  // ===========================================
  const { data: chart1_raw } = await supabase
    .from('{table_name}')
    .select('status')
    .eq('org_id', orgId)
    .eq('is_deleted', false)

  const chart1_data = aggregateByStatus(chart1_raw)

  // ===========================================
  // Chart 2: Line Chart Data (e.g., Items Created Over Time)
  // ===========================================
  const { data: chart2_raw } = await supabase
    .from('{table_name}')
    .select('created_at')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('created_at', last30Days().toISOString())
    .order('created_at', { ascending: true })

  const chart2_data = aggregateByDate(chart2_raw)

  // ===========================================
  // Chart 3: Pie Chart Data (e.g., Items by Category)
  // ===========================================
  const { data: chart3_raw } = await supabase
    .from('{table_name}')
    .select('category')
    .eq('org_id', orgId)
    .eq('is_deleted', false)

  const chart3_data = aggregateByCategory(chart3_raw)

  // ===========================================
  // Recent Activity: Last 10 Items
  // ===========================================
  const { data: recent_activity } = await supabase
    .from('{table_name}')
    .select('id, name, status, created_at')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    kpis: {
      kpi1,
      kpi1_trend,
      kpi2,
      kpi2_trend,
      kpi3,
      kpi3_subtitle,
      kpi4,
      kpi4_trend,
    },
    charts: {
      chart1_data,
      chart2_data,
      chart3_data,
    },
    recent_activity: recent_activity || [],
  }
}

// ===========================================
// Helper Functions
// ===========================================

function calculateTrend(current: number, previous: number) {
  if (previous === 0) return { value: '+0%', direction: 'neutral' as const }

  const change = ((current - previous) / previous) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  const value = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`

  return { value, direction: direction as 'up' | 'down' | 'neutral' }
}

function aggregateByStatus(data: Array<{ status: string }>) {
  const counts = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).map(([label, value]) => ({ label, value }))
}

function aggregateByDate(data: Array<{ created_at: string }>) {
  const counts = data.reduce((acc, item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

function aggregateByCategory(data: Array<{ category: string }>) {
  const counts = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).map(([category, count]) => ({ category, count }))
}

function last30Days() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date
}
```

---

### 4. Reusable Components

```tsx
// components/dashboard/kpi-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  onClick,
}: KPICardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  }

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-lg',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className={colorClasses[color]}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend.direction === 'up' && <ArrowUp className="h-3 w-3 text-green-600" />}
            {trend.direction === 'down' && <ArrowDown className="h-3 w-3 text-red-600" />}
            {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
            <span className="ml-1">{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Customization Examples

### Example 1: Technical Dashboard

```typescript
// lib/services/technical-dashboard-service.ts

export async function getTechnicalDashboard(orgId: string) {
  // KPI 1: Total Products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_deleted', false)

  // KPI 2: Active BOMs
  const { count: activeBOMs } = await supabase
    .from('boms')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')

  // Chart 1: Products by Type
  const { data: productsByType } = await supabase
    .from('products')
    .select('type')
    .eq('org_id', orgId)
    .eq('is_deleted', false)

  // ... etc
}
```

### Example 2: Planning Dashboard

```typescript
// lib/services/planning-dashboard-service.ts

export async function getPlanningDashboard(orgId: string) {
  // KPI 1: Open Purchase Orders
  const { count: openPOs } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('status', ['draft', 'submitted', 'confirmed'])

  // KPI 2: Pending Work Orders
  const { count: pendingWOs } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'pending')

  // Chart 1: POs by Status
  // Chart 2: WOs Created Over Time
  // ... etc
}
```

---

## Token Savings

**Without Template G:**
- Write 200+ lines for dashboard logic
- Write chart configurations
- Write KPI calculations
- **Total:** ~8,000 tokens

**With Template G:**
- Reference template + customize KPIs and charts
- **Total:** ~2,000 tokens (75% reduction)

**Project-Wide:**
- 12 dashboards × 6,000 tokens saved = 72,000 tokens saved

---

**END OF TEMPLATE G**
