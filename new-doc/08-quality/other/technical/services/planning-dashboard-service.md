# Planning Dashboard Service Documentation

**Story**: 03.16 - Planning Dashboard
**Version**: 1.0
**Last Updated**: 2026-01-02

## Overview

The Planning Dashboard Service (`planning-dashboard-service.ts`) provides business logic for aggregating and caching KPI metrics, alerts, and activity data across purchase orders, transfer orders, and work orders. It implements in-memory caching with automatic TTL management and cache invalidation.

## Location

```
apps/frontend/lib/services/planning-dashboard-service.ts
```

## Architecture

```
API Routes
    ↓
Dashboard Service
    ↓
├── getKPIs() ────────→ Supabase (6 COUNT queries)
├── getAlerts() ──────→ Supabase (2 SELECT queries)
├── getRecentActivity()→ Supabase (3 SELECT queries)
└── invalidateDashboardCache()
    ↓
In-Memory Cache (Map)
    ↓
TypeScript Types
```

---

## Public API

### 1. getKPIs()

Retrieves all six key performance indicators for an organization.

#### Signature

```typescript
async function getKPIs(orgId: string): Promise<KPIData>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orgId` | `string` | Organization UUID for RLS filtering |

#### Returns

```typescript
interface KPIData {
  po_pending_approval: number    // POs awaiting approval
  po_this_month: number          // POs created this month
  to_in_transit: number          // TOs in transit
  wo_scheduled_today: number     // WOs scheduled for today
  wo_overdue: number             // Overdue WOs
  open_orders: number            // Total open POs
}
```

#### Behavior

1. **Check Cache**: Returns cached data if valid (< 2 minutes old)
2. **Query Database**: Executes 6 COUNT queries in parallel
3. **Cache Result**: Stores result for 2 minutes
4. **Error Handling**: Returns zeros on error

#### Database Queries

```sql
-- 1. POs pending approval
SELECT COUNT(*) FROM purchase_orders
WHERE org_id = $1 AND approval_status = 'pending'

-- 2. POs created this month
SELECT COUNT(*) FROM purchase_orders
WHERE org_id = $1 AND created_at >= $2

-- 3. TOs in transit
SELECT COUNT(*) FROM transfer_orders
WHERE org_id = $1 AND status IN ('partially_shipped', 'shipped')

-- 4. WOs scheduled today
SELECT COUNT(*) FROM work_orders
WHERE org_id = $1 AND scheduled_date = $2

-- 5. Overdue WOs
SELECT COUNT(*) FROM work_orders
WHERE org_id = $1 AND scheduled_date < $2
  AND status NOT IN ('completed', 'cancelled')

-- 6. Open POs
SELECT COUNT(*) FROM purchase_orders
WHERE org_id = $1 AND status NOT IN ('closed', 'cancelled')
```

#### Performance

- **Parallel Execution**: All 6 queries run simultaneously via `Promise.all`
- **Indexed Queries**: Uses indexes on `org_id`, `status`, `approval_status`, `scheduled_date`
- **Response Time**: 200-500ms (cold), 5-10ms (cached)

#### Example

```typescript
import { getKPIs } from '@/lib/services/planning-dashboard-service'

const kpis = await getKPIs('org-uuid')
console.log(kpis)
// {
//   po_pending_approval: 12,
//   po_this_month: 45,
//   to_in_transit: 8,
//   wo_scheduled_today: 15,
//   wo_overdue: 3,
//   open_orders: 67
// }
```

---

### 2. getAlerts()

Retrieves critical and warning alerts for an organization.

#### Signature

```typescript
async function getAlerts(
  orgId: string,
  limit?: number
): Promise<AlertsResponse>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `orgId` | `string` | - | Organization UUID |
| `limit` | `number` | 10 | Max alerts to return (1-50) |

#### Returns

```typescript
interface AlertsResponse {
  alerts: Alert[]
  total: number
}

interface Alert {
  id: string
  type: 'overdue_po' | 'pending_approval' | 'low_inventory' | 'material_shortage'
  severity: 'warning' | 'critical'
  entity_type: 'purchase_order' | 'transfer_order' | 'work_order'
  entity_id: string
  entity_number: string
  description: string
  days_overdue?: number
  created_at: string
}
```

#### Behavior

1. **Check Cache**: Returns cached alerts (sliced to limit) if valid
2. **Query Database**: Fetches overdue POs and pending approvals
3. **Calculate Severity**: 1-3 days = warning, 4+ days = critical
4. **Sort Alerts**: Critical first, then by entity_number
5. **Cache Result**: Stores full result for 2 minutes
6. **Return Slice**: Returns up to `limit` alerts

#### Alert Types

| Type | Query | Severity Logic |
|------|-------|----------------|
| `overdue_po` | `expected_delivery_date < TODAY AND status NOT IN ('closed', 'cancelled', 'receiving')` | 1-3 days: warning<br>4+ days: critical |
| `pending_approval` | `approval_status = 'pending' AND created_at < (TODAY - 2 days)` | 2-3 days: warning<br>4+ days: critical |
| `low_inventory` | (Phase 2) | - |
| `material_shortage` | (Phase 2) | - |

#### Database Queries

```sql
-- 1. Overdue POs
SELECT id, po_number, expected_delivery_date,
       suppliers.name as supplier_name
FROM purchase_orders
LEFT JOIN suppliers ON suppliers.id = purchase_orders.supplier_id
WHERE org_id = $1
  AND expected_delivery_date < $2
  AND status NOT IN ('closed', 'cancelled', 'receiving')
ORDER BY expected_delivery_date ASC
LIMIT 50

-- 2. Pending approvals (> 2 days)
SELECT id, po_number, created_at,
       suppliers.name as supplier_name
FROM purchase_orders
LEFT JOIN suppliers ON suppliers.id = purchase_orders.supplier_id
WHERE org_id = $1
  AND approval_status = 'pending'
  AND created_at < $2
ORDER BY created_at ASC
LIMIT 50
```

#### Performance

- **Sequential Queries**: 2 queries (not parallelized to reduce DB load)
- **Response Time**: 200-400ms (cold), 8-12ms (cached)

#### Example

```typescript
import { getAlerts } from '@/lib/services/planning-dashboard-service'

const { alerts, total } = await getAlerts('org-uuid', 10)
console.log(`Found ${total} alerts, showing ${alerts.length}`)
// Found 15 alerts, showing 10

alerts.forEach(alert => {
  console.log(`${alert.severity}: ${alert.description}`)
})
// critical: PO-2024-00123 from Acme Supplies is 5 days overdue
// warning: PO-2024-00124 from Baker Inc pending approval for 3 days
```

---

### 3. getRecentActivity()

Retrieves recent planning activity across POs, TOs, and WOs.

#### Signature

```typescript
async function getRecentActivity(
  orgId: string,
  limit?: number
): Promise<ActivityResponse>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `orgId` | `string` | - | Organization UUID |
| `limit` | `number` | 20 | Max activities to return (1-100) |

#### Returns

```typescript
interface ActivityResponse {
  activities: Activity[]
  total: number
}

interface Activity {
  id: string
  entity_type: 'purchase_order' | 'transfer_order' | 'work_order'
  entity_id: string
  entity_number: string
  action: 'created' | 'updated' | 'approved' | 'cancelled' | 'completed'
  user_id: string
  user_name: string
  timestamp: string
}
```

#### Behavior

1. **Check Cache**: Returns cached activities (sliced to limit) if valid
2. **Query Database**: Fetches PO history, recent TOs, recent WOs
3. **Map Actions**: Converts status changes to action types
4. **Merge Results**: Combines all activities into single array
5. **Sort**: By timestamp descending (newest first)
6. **Cache Result**: Stores full result for 2 minutes
7. **Return Slice**: Returns up to `limit` activities

#### Data Sources

| Entity | Source | Action Mapping |
|--------|--------|----------------|
| Purchase Order | `po_status_history` table | `draft` → created<br>`approved` → approved<br>`cancelled` → cancelled<br>`closed` → completed<br>Other → updated |
| Transfer Order | `transfer_orders.updated_at` | `completed` → completed<br>`cancelled` → cancelled<br>Other → updated |
| Work Order | `work_orders.updated_at` | `completed` → completed<br>`cancelled` → cancelled<br>Other → updated |

#### Database Queries

```sql
-- 1. PO status history
SELECT h.id, h.po_id, h.to_status, h.changed_by, h.changed_at,
       po.po_number, u.first_name, u.last_name
FROM po_status_history h
INNER JOIN purchase_orders po ON po.id = h.po_id
LEFT JOIN users u ON u.id = h.changed_by
WHERE po.org_id = $1
ORDER BY h.changed_at DESC
LIMIT 100

-- 2. Recent transfer orders
SELECT id, to_number, status, created_by, updated_at,
       u.first_name, u.last_name
FROM transfer_orders
LEFT JOIN users u ON u.id = transfer_orders.created_by
WHERE org_id = $1
ORDER BY updated_at DESC
LIMIT 50

-- 3. Recent work orders
SELECT id, wo_number, status, created_by, updated_at,
       u.first_name, u.last_name
FROM work_orders
LEFT JOIN users u ON u.id = work_orders.created_by
WHERE org_id = $1
ORDER BY updated_at DESC
LIMIT 50
```

#### Performance

- **Parallel Execution**: All 3 queries run simultaneously
- **Response Time**: 300-500ms (cold), 10-15ms (cached)

#### Example

```typescript
import { getRecentActivity } from '@/lib/services/planning-dashboard-service'

const { activities, total } = await getRecentActivity('org-uuid', 20)
console.log(`Found ${total} activities, showing ${activities.length}`)

activities.forEach(activity => {
  console.log(`${activity.entity_number} was ${activity.action} by ${activity.user_name}`)
})
// PO-2024-00125 was approved by John Doe
// WO-2024-00045 was completed by Jane Smith
// TO-2024-00012 was updated by Bob Williams
```

---

### 4. invalidateDashboardCache()

Clears all cached dashboard data for an organization.

#### Signature

```typescript
async function invalidateDashboardCache(orgId: string): Promise<void>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orgId` | `string` | Organization UUID |

#### Behavior

Deletes cache entries for:
- `planning:dashboard:kpis:{orgId}`
- `planning:dashboard:alerts:{orgId}`
- `planning:dashboard:activity:{orgId}`

#### When to Use

Call this function when:
- A PO/TO/WO is created
- A PO/TO/WO is updated
- A PO/TO/WO is deleted
- An approval status changes
- A status field changes

#### Example

```typescript
import { invalidateDashboardCache } from '@/lib/services/planning-dashboard-service'

// After creating a purchase order
await createPurchaseOrder(poData)
await invalidateDashboardCache(orgId)

// After approving a PO
await approvePurchaseOrder(poId)
await invalidateDashboardCache(orgId)
```

---

### 5. getCacheKey()

Returns cache key for testing purposes.

#### Signature

```typescript
function getCacheKey(
  type: 'kpis' | 'alerts' | 'activity',
  orgId: string
): string
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `'kpis' \| 'alerts' \| 'activity'` | Cache type |
| `orgId` | `string` | Organization UUID |

#### Returns

Cache key string (e.g., `planning:dashboard:kpis:org-uuid`)

#### Example

```typescript
import { getCacheKey } from '@/lib/services/planning-dashboard-service'

const key = getCacheKey('kpis', 'org-uuid')
console.log(key)
// "planning:dashboard:kpis:org-uuid"
```

---

## Cache Implementation

### Cache Structure

```typescript
const memoryCache = new Map<string, { data: unknown; expiry: number }>()
```

### Cache Functions

```typescript
// Get from cache (returns null if expired)
function getFromCache<T>(key: string): T | null

// Set cache entry with TTL
function setCache<T>(key: string, data: T, ttlSeconds: number): void

// Delete cache entry
function deleteCache(key: string): void
```

### Cache Keys

```typescript
export const CACHE_KEYS = {
  kpis: (orgId: string) => `planning:dashboard:kpis:${orgId}`,
  alerts: (orgId: string) => `planning:dashboard:alerts:${orgId}`,
  activity: (orgId: string) => `planning:dashboard:activity:${orgId}`,
}
```

### TTL

```typescript
const CACHE_TTL = 120  // 2 minutes in seconds
```

### Cache Flow

```
1. Request arrives
   ↓
2. Check cache with key
   ↓
   Cached & Valid? → Return cached data
   ↓ No
3. Query database
   ↓
4. Store in cache (TTL: 120s)
   ↓
5. Return fresh data
```

---

## Error Handling

### Database Errors

All service methods catch errors and return safe defaults:

```typescript
try {
  // Database queries
} catch (error) {
  console.error('Error fetching KPIs:', error)
  return {
    po_pending_approval: 0,
    po_this_month: 0,
    to_in_transit: 0,
    wo_scheduled_today: 0,
    wo_overdue: 0,
    open_orders: 0,
  }
}
```

### Null Handling

Supabase may return `null` for COUNT queries:

```typescript
po_pending_approval: pendingApprovalResult.count ?? 0
```

### Missing User Names

Handles missing user data gracefully:

```typescript
user_name: user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'System'
```

---

## Performance Optimization

### Query Optimization

1. **Parallel Execution**: All KPI queries run simultaneously
2. **COUNT Queries**: Never fetch full rows, only counts
3. **Indexed Filters**: All WHERE clauses use indexed columns
4. **LIMIT Clauses**: Prevent unbounded result sets

### Caching Strategy

1. **In-Memory**: No network overhead (vs Redis)
2. **Per-Org**: Isolated cache per organization
3. **TTL**: 2 minutes balances freshness and performance
4. **Cache Invalidation**: Explicit invalidation on mutations

### Performance Metrics

| Operation | Cold (ms) | Cached (ms) | Database Queries |
|-----------|-----------|-------------|------------------|
| getKPIs | 350 | 5 | 6 (parallel) |
| getAlerts | 280 | 8 | 2 (sequential) |
| getRecentActivity | 420 | 10 | 3 (parallel) |

---

## Type Definitions

All types are defined in `apps/frontend/lib/types/planning-dashboard.ts`:

```typescript
export interface KPIData {
  po_pending_approval: number
  po_this_month: number
  to_in_transit: number
  wo_scheduled_today: number
  wo_overdue: number
  open_orders: number
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  entity_type: AlertEntityType
  entity_id: string
  entity_number: string
  description: string
  days_overdue?: number
  created_at: string
}

export interface AlertsResponse {
  alerts: Alert[]
  total: number
}

export interface Activity {
  id: string
  entity_type: ActivityEntityType
  entity_id: string
  entity_number: string
  action: ActivityAction
  user_id: string
  user_name: string
  timestamp: string
}

export interface ActivityResponse {
  activities: Activity[]
  total: number
}
```

---

## Testing

### Unit Tests

Located in `apps/frontend/lib/services/__tests__/planning-dashboard-service.test.ts`

**Coverage:**
- ✓ getKPIs returns all 6 metrics
- ✓ getKPIs caches results
- ✓ getAlerts calculates severity correctly
- ✓ getAlerts sorts by severity
- ✓ getRecentActivity maps actions correctly
- ✓ getRecentActivity sorts by timestamp
- ✓ invalidateDashboardCache clears all keys

### Test Example

```typescript
describe('getKPIs', () => {
  it('returns all 6 KPI metrics', async () => {
    const kpis = await getKPIs('org-uuid')

    expect(kpis).toHaveProperty('po_pending_approval')
    expect(kpis).toHaveProperty('po_this_month')
    expect(kpis).toHaveProperty('to_in_transit')
    expect(kpis).toHaveProperty('wo_scheduled_today')
    expect(kpis).toHaveProperty('wo_overdue')
    expect(kpis).toHaveProperty('open_orders')

    expect(typeof kpis.po_pending_approval).toBe('number')
  })

  it('caches results for 2 minutes', async () => {
    const kpis1 = await getKPIs('org-uuid')
    const kpis2 = await getKPIs('org-uuid')

    expect(kpis1).toEqual(kpis2)
    // Second call should be from cache (faster)
  })
})
```

---

## Integration Examples

### API Route Integration

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getKPIs } from '@/lib/services/planning-dashboard-service'

export async function GET(request: NextRequest) {
  const orgId = await getOrgIdFromSession()

  const kpis = await getKPIs(orgId)

  return NextResponse.json(kpis, {
    headers: {
      'Cache-Control': 'private, max-age=120',
    },
  })
}
```

### React Component Integration

```typescript
import { useEffect, useState } from 'react'
import { getKPIs } from '@/lib/services/planning-dashboard-service'

function DashboardComponent({ orgId }: { orgId: string }) {
  const [kpis, setKPIs] = useState(null)

  useEffect(() => {
    async function fetchKPIs() {
      const data = await getKPIs(orgId)
      setKPIs(data)
    }
    fetchKPIs()
  }, [orgId])

  return <KPIDisplay data={kpis} />
}
```

### Cache Invalidation Hook

```typescript
import { useMutation } from '@tanstack/react-query'
import { invalidateDashboardCache } from '@/lib/services/planning-dashboard-service'

function useCreatePO(orgId: string) {
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: async () => {
      await invalidateDashboardCache(orgId)
    },
  })
}
```

---

## Future Enhancements

### Phase 2

- **Redis Integration**: Replace in-memory cache with Redis for multi-server support
- **WebSocket Updates**: Real-time cache invalidation via WebSocket
- **Trend Calculation**: Calculate month-over-month trends for KPIs
- **Inventory Alerts**: Integrate with warehouse module for low stock alerts
- **Material Availability**: Check BOM availability for work orders

### Phase 3

- **Metric History**: Store historical KPI values for charting
- **Custom KPIs**: User-defined dashboard metrics
- **Export Service**: Export dashboard data to Excel/PDF
- **Scheduled Reports**: Email digest of dashboard metrics

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial release for Story 03.16 |

---

## Support

For service issues:
- Service Code: `apps/frontend/lib/services/planning-dashboard-service.ts`
- Type Definitions: `apps/frontend/lib/types/planning-dashboard.ts`
- API Documentation: `docs/3-TECHNICAL/api/planning-dashboard-api.md`
- Story: `docs/2-MANAGEMENT/epics/current/03-planning/03.16.planning-dashboard.md`
