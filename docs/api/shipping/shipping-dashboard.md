# Shipping Dashboard API Reference

Story: **07.15 - Shipping Dashboard + KPIs**

API endpoints for the shipping dashboard, providing real-time KPIs, alerts, and activity tracking.

## Base URL

```
/api/shipping/dashboard
```

## Authentication

All endpoints require authentication. Include `Authorization: Bearer {token}` header.
RLS policies ensure org isolation - users can only access data from their organization.

## Caching

All dashboard endpoints use Redis caching with 60-second TTL. Cache keys are org-scoped:
- `shipping:dashboard:kpis:{org_id}:{date_range_hash}`
- `shipping:dashboard:alerts:{org_id}:{date_range_hash}`
- `shipping:dashboard:activity:{org_id}:{limit}`

---

## Endpoints

### GET /api/shipping/dashboard

Get KPI metrics for the shipping dashboard.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| date_range | string | last_30 | Preset: today, last_7, last_30, week, month |
| date_from | ISO date | 30 days ago | Custom start date |
| date_to | ISO date | now | Custom end date |

**Success Response (200 OK):**

```typescript
{
  orders: {
    total: number;
    by_status: {
      draft: number;
      confirmed: number;
      allocated: number;
      picking: number;
      packing: number;
      shipped: number;
      delivered: number;
    };
    trend: {
      current: number;
      previous: number;
      percentage: number;
      direction: 'up' | 'down' | 'neutral';
    };
  };
  pick_lists: {
    total: number;
    by_status: {
      pending: number;
      assigned: number;
      in_progress: number;
      completed: number;
    };
    trend: {
      current: number;
      previous: number;
      percentage: number;
      direction: 'up' | 'down' | 'neutral';
    };
  };
  shipments: {
    total: number;
    by_status: {
      pending: number;
      packing: number;
      packed: number;
      shipped: number;
      delivered: number;
    };
    trend: {
      current: number;
      previous: number;
      percentage: number;
      direction: 'up' | 'down' | 'neutral';
    };
  };
  backorders: {
    count: number;
    total_value: number;
  };
  on_time_delivery_pct: number;
  avg_pick_time_hours: number;
  avg_pack_time_hours: number;
  last_updated: string;
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_DATE_RANGE | Date range exceeds 365 days |
| 401 | UNAUTHORIZED | Authentication required |
| 404 | ORG_NOT_FOUND | Organization not found |

**Example:**

```bash
# Default (last 30 days)
curl /api/shipping/dashboard \
  -H "Authorization: Bearer {token}"

# Today only
curl "/api/shipping/dashboard?date_range=today" \
  -H "Authorization: Bearer {token}"

# Custom date range
curl "/api/shipping/dashboard?date_from=2026-01-01&date_to=2026-01-15" \
  -H "Authorization: Bearer {token}"
```

---

### GET /api/shipping/dashboard/alerts

Get active alerts for the shipping dashboard.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| date_from | ISO date | 30 days ago | Start date |
| date_to | ISO date | now | End date |

**Success Response (200 OK):**

```typescript
{
  backorders: {
    count: number;
    items: Array<{
      so_line_id: string;
      product_name: string;
      qty_backordered: number;
    }>;
  };
  delayed_shipments: {
    count: number;
    items: Array<{
      so_id: string;
      order_number: string;
      promised_date: string;
      days_late: number;
    }>;
  };
  pending_picks_overdue: {
    count: number;
    items: Array<{
      pick_list_id: string;
      pick_list_number: string;
      created_at: string;
      hours_pending: number;
    }>;
  };
  allergen_conflicts: {
    count: number;
    items: Array<{
      so_id: string;
      order_number: string;
      customer_name: string;
      conflicting_allergens: string[];
    }>;
  };
  alert_summary: {
    critical: number;
    warning: number;
    info: number;
  };
}
```

**Alert Definitions:**

| Alert Type | Condition | Severity |
|------------|-----------|----------|
| Backorders | qty_allocated < qty_ordered | Critical |
| Delayed Shipments | promised_ship_date < today, not shipped | Critical (>=3 days) / Warning |
| Pending Picks >24h | status = pending, created >24h ago | Warning |
| Allergen Conflicts | allergen_validated = false | Warning |

**Example:**

```bash
curl /api/shipping/dashboard/alerts \
  -H "Authorization: Bearer {token}"
```

---

### GET /api/shipping/dashboard/recent-activity

Get recent activity timeline for the shipping module.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Number of activities (1-50) |

**Success Response (200 OK):**

```typescript
{
  activities: Array<{
    id: string;
    type: 'so_created' | 'so_confirmed' | 'so_shipped' | 'pick_completed' | 'shipment_packed';
    entity_type: 'sales_order' | 'pick_list' | 'shipment';
    entity_id: string;
    entity_number: string;
    description: string;
    created_at: string;
    created_by: {
      id: string;
      name: string;
    };
    status: 'success' | 'warning' | 'error';
  }>;
}
```

**Activity Types:**

| Type | Description | Icon |
|------|-------------|------|
| so_created | Sales order created | ShoppingCart |
| so_confirmed | Sales order confirmed | CheckCircle |
| so_shipped | Sales order shipped | Truck |
| pick_completed | Pick list completed | Package |
| shipment_packed | Shipment packed | Box |

**Example:**

```bash
# Default (10 items)
curl /api/shipping/dashboard/recent-activity \
  -H "Authorization: Bearer {token}"

# Get 25 items
curl "/api/shipping/dashboard/recent-activity?limit=25" \
  -H "Authorization: Bearer {token}"
```

---

## Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Dashboard page load | <500ms | p95 |
| KPIs API response | <200ms | p95, uses Redis cache |
| Alerts API response | <150ms | p95, uses Redis cache |
| Activity API response | <100ms | p95, uses Redis cache |
| Cache hit rate | >90% | 60-second TTL |

## Multi-Tenant Isolation

All queries are org-scoped via RLS policies. The org_id is extracted from the authenticated user's profile and applied to all database queries automatically.

## Cache Strategy

**Passive Invalidation (MVP):**
- TTL-based expiration (60 seconds)
- No active cache invalidation on data changes
- Acceptable for near-real-time dashboard (not real-time)

**Cache Fallback:**
- If Redis is unavailable, queries fall back to direct database access
- Warning banner displays: "Real-time data (caching unavailable)"

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-22 | Initial release |
