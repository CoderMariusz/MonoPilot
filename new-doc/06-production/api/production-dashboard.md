# Production Dashboard Service

**Story:** 04.1 - Production Dashboard
**Epic:** 4 - Production Floor Management
**Module:** `lib/services/production-dashboard-service.ts`

## Overview

The **Production Dashboard Service** provides real-time KPI calculations, active work order tracking, and alert management for the production dashboard. It aggregates data from multiple tables to present a unified view of production floor status.

---

## Interfaces

### `KPIData`

Key Performance Indicators displayed at the top of the dashboard.

```typescript
interface KPIData {
  orders_today: number;        // Completed orders today
  units_produced_today: number; // Total units produced today
  avg_yield_today: number;     // Weighted average yield percentage
  active_wos: number;          // Work orders in progress/paused
  material_shortages: number;  // Count of material shortages
}
```

### `ActiveWorkOrder`

Work order data for the active WO table.

```typescript
interface ActiveWorkOrder {
  id: string;
  wo_number: string;
  product_name: string;
  planned_qty: number;
  output_qty: number;
  status: string;
  progress_percent: number;
  started_at: string;
  line_name: string;
}
```

### `Alert`

Production alerts for the alert panel.

```typescript
interface Alert {
  id: string;
  type: 'material_shortage' | 'wo_delayed' | 'quality_hold';
  severity: 'warning' | 'critical';
  description: string;
  wo_id?: string;
  created_at: string;
}
```

---

## API Reference

### `getKPIs(orgId: string): Promise<KPIData>`

Calculates and returns KPI data for the production dashboard (AC-4.1.1).

**Calculations:**

1. **Orders Today**: Count of work orders with `status = 'completed'` and `completed_at` within today
2. **Units Produced Today**: Sum of `qty` from `production_outputs` created today
3. **Avg Yield Today**: Weighted average `(SUM(output_qty) / SUM(planned_qty)) * 100` for completed WOs today
4. **Active WOs**: Count of work orders with `status IN ('in_progress', 'paused')`
5. **Material Shortages**: Count of materials where available < required

**Example:**

```typescript
import { getKPIs } from '@/lib/services/production-dashboard-service';

const kpis = await getKPIs('org-uuid-here');
// Returns:
// {
//   orders_today: 5,
//   units_produced_today: 1250,
//   avg_yield_today: 98.5,
//   active_wos: 3,
//   material_shortages: 0
// }
```

---

### `getActiveWorkOrders(orgId: string, limit?: number): Promise<ActiveWorkOrder[]>`

Returns list of active work orders for the dashboard table (AC-4.1.2).

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `orgId` | `string` | - | Organization UUID |
| `limit` | `number` | `10` | Maximum number of WOs to return |

**Query Details:**
- Filters by `status IN ('in_progress', 'paused')`
- Joins with `products` and `production_lines` tables
- Orders by `started_at` ascending (oldest first)
- Calculates `progress_percent = (output_qty / planned_qty) * 100`

**Example:**

```typescript
import { getActiveWorkOrders } from '@/lib/services/production-dashboard-service';

const activeWOs = await getActiveWorkOrders('org-uuid-here', 5);
// Returns array of ActiveWorkOrder objects
```

---

### `getAlerts(orgId: string, limit?: number): Promise<Alert[]>`

Returns production alerts sorted by severity and timestamp (AC-4.1.3).

**Alert Types:**

| Type | Source | Severity |
|------|--------|----------|
| `material_shortage` | `wo_materials` table | `warning` |
| `wo_delayed` | WOs past `scheduled_completion_date + 4h` | `warning` |
| `quality_hold` | `license_plates` with `qa_status = 'hold'` | `critical` |

**Sorting:**
1. Severity (critical first)
2. Timestamp (newest first)

**Example:**

```typescript
import { getAlerts } from '@/lib/services/production-dashboard-service';

const alerts = await getAlerts('org-uuid-here', 5);
// Returns array of Alert objects
```

---

## Database Queries

### KPI Queries

```sql
-- Orders completed today
SELECT id FROM work_orders
WHERE org_id = $1
  AND status = 'completed'
  AND completed_at >= TODAY
  AND completed_at < TOMORROW;

-- Units produced today
SELECT qty FROM production_outputs
WHERE org_id = $1
  AND created_at >= TODAY
  AND created_at < TOMORROW;

-- Yield calculation (completed WOs today)
SELECT planned_qty, output_qty FROM work_orders
WHERE org_id = $1
  AND status = 'completed'
  AND completed_at >= TODAY;

-- Active work orders count
SELECT id FROM work_orders
WHERE org_id = $1
  AND status IN ('in_progress', 'paused');
```

### Active WO Query

```sql
SELECT
  wo.id,
  wo.wo_number,
  p.name as product_name,
  wo.planned_qty,
  wo.output_qty,
  wo.status,
  wo.started_at,
  pl.name as line_name
FROM work_orders wo
LEFT JOIN products p ON wo.product_id = p.id
LEFT JOIN production_lines pl ON wo.production_line_id = pl.id
WHERE wo.org_id = $1
  AND wo.status IN ('in_progress', 'paused')
ORDER BY wo.started_at ASC
LIMIT $2;
```

---

## React Integration

### Dashboard Component Example

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { KPIData, ActiveWorkOrder, Alert } from '@/lib/services/production-dashboard-service';

export function ProductionDashboard({ orgId }: { orgId: string }) {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [activeWOs, setActiveWOs] = useState<ActiveWorkOrder[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      const [kpiRes, woRes, alertRes] = await Promise.all([
        fetch(`/api/production/dashboard/kpis?org_id=${orgId}`),
        fetch(`/api/production/dashboard/active-wos?org_id=${orgId}`),
        fetch(`/api/production/dashboard/alerts?org_id=${orgId}`),
      ]);

      setKpis(await kpiRes.json());
      setActiveWOs(await woRes.json());
      setAlerts(await alertRes.json());
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [orgId, refreshInterval]);

  return (
    <div className="grid gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard title="Orders Today" value={kpis?.orders_today} />
        <KPICard title="Units Produced" value={kpis?.units_produced_today} />
        <KPICard title="Avg Yield" value={`${kpis?.avg_yield_today}%`} />
        <KPICard title="Active WOs" value={kpis?.active_wos} />
        <KPICard title="Shortages" value={kpis?.material_shortages} alert />
      </div>

      {/* Active WO Table */}
      <ActiveWOTable data={activeWOs} />

      {/* Alert Panel */}
      <AlertPanel alerts={alerts} />
    </div>
  );
}
```

---

## Multi-tenant Security

All queries filter by `org_id` to ensure proper data isolation:

```typescript
.eq('org_id', orgId)
```

The service uses `createServerSupabaseAdmin()` which bypasses RLS for server-side operations. Client-facing API routes should verify user's org membership before calling service methods.

---

## Performance Considerations

1. **Batch Queries**: KPI calculation runs 5 separate queries - consider using a database function for single round-trip
2. **Caching**: Dashboard data can be cached for `dashboard_refresh_seconds` (from Production Settings)
3. **Indexes**: Ensure indexes on `org_id`, `status`, `completed_at`, `created_at` columns
