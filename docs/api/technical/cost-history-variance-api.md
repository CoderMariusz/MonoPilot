# Cost History & Variance Analysis API Reference

Story: 02.15 - Cost History + Variance

## Overview

The Cost History & Variance API provides endpoints for tracking product cost changes over time and analyzing variances between standard and actual production costs. This enables manufacturers to identify cost trends, detect significant variances, and understand which ingredients drive cost changes.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api/technical/costing
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by the client SDK).

**Required Roles**:
- `GET`: Any authenticated user within the organization

## Endpoints

### GET /api/technical/costing/products/:id/history

Retrieve cost history for a specific product with trends, component breakdown, and cost drivers.

#### Request

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Product ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `from` | ISO date | - | Start date filter (YYYY-MM-DD) |
| `to` | ISO date | - | End date filter (YYYY-MM-DD) |
| `type` | string | `all` | Cost type: `standard`, `actual`, `planned`, or `all` |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Records per page (max: 100) |

```bash
curl -X GET "https://your-domain.com/api/technical/costing/products/550e8400-e29b-41d4-a716-446655440000/history?from=2026-01-01&to=2026-01-31&type=standard&page=1&limit=10" \
  -H "Content-Type: application/json"
```

#### Response

**Status: 200 OK**

```json
{
  "product": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "FG-001",
    "name": "Chocolate Chip Cookie"
  },
  "summary": {
    "current_cost": 12.50,
    "current_cost_per_unit": 0.25,
    "previous_cost": 11.80,
    "change_amount": 0.70,
    "change_percentage": 5.93,
    "trend_30d": 2.5,
    "trend_90d": 8.2,
    "trend_ytd": 12.5
  },
  "history": [
    {
      "id": "cost-001",
      "cost_type": "standard",
      "material_cost": 8.50,
      "labor_cost": 2.00,
      "overhead_cost": 2.00,
      "total_cost": 12.50,
      "cost_per_unit": 0.25,
      "effective_from": "2026-01-15T00:00:00Z",
      "effective_to": null,
      "created_at": "2026-01-15T10:30:00Z",
      "created_by": "user-123",
      "bom_version": 3
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "total_pages": 3
  },
  "component_breakdown": {
    "current": {
      "material": 8.50,
      "labor": 2.00,
      "overhead": 2.00,
      "total": 12.50
    },
    "historical": {
      "material": 8.00,
      "labor": 1.90,
      "overhead": 1.90,
      "total": 11.80
    },
    "changes": {
      "material": { "amount": 0.50, "percent": 6.25 },
      "labor": { "amount": 0.10, "percent": 5.26 },
      "overhead": { "amount": 0.10, "percent": 5.26 },
      "total": { "amount": 0.70, "percent": 5.93 }
    }
  },
  "cost_drivers": [
    {
      "ingredient_id": "ing-001",
      "ingredient_name": "Premium Chocolate Chips",
      "ingredient_code": "RM-CHOC-001",
      "current_cost": 3.50,
      "historical_cost": 3.00,
      "change_amount": 0.50,
      "change_percent": 16.67,
      "impact_percent": 45.5
    },
    {
      "ingredient_id": "ing-002",
      "ingredient_name": "Organic Flour",
      "ingredient_code": "RM-FLOUR-001",
      "current_cost": 2.00,
      "historical_cost": 1.80,
      "change_amount": 0.20,
      "change_percent": 11.11,
      "impact_percent": 28.3
    }
  ]
}
```

#### Response Fields

**Summary Object:**
| Field | Type | Description |
|-------|------|-------------|
| `current_cost` | number | Most recent total cost |
| `current_cost_per_unit` | number | Cost per unit of production |
| `previous_cost` | number | Previous cost record (null if only one record) |
| `change_amount` | number | Difference from previous cost |
| `change_percentage` | number | Percentage change from previous |
| `trend_30d` | number | 30-day trend percentage |
| `trend_90d` | number | 90-day trend percentage |
| `trend_ytd` | number | Year-to-date trend percentage |

**Cost Driver Object:**
| Field | Type | Description |
|-------|------|-------------|
| `ingredient_id` | UUID | Component/ingredient ID |
| `ingredient_name` | string | Display name |
| `ingredient_code` | string | SKU code |
| `current_cost` | number | Current cost contribution |
| `historical_cost` | number | Previous cost contribution |
| `change_amount` | number | Cost change amount |
| `change_percent` | number | Percentage change |
| `impact_percent` | number | Percentage of total cost change |

#### Error Responses

**Status: 400 Bad Request** - Invalid date range

```json
{
  "error": "Invalid date range",
  "code": "INVALID_DATE_RANGE",
  "message": "from date cannot be after to date"
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Status: 404 Not Found**

```json
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Status: 500 Internal Server Error**

```json
{
  "error": "Database error",
  "code": "DATABASE_ERROR"
}
```

---

### GET /api/technical/costing/variance/report

Generate a variance analysis report comparing standard costs to actual production costs.

#### Request

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `productId` | UUID | Yes | - | Product to analyze |
| `period` | number | No | 30 | Analysis period in days: 7, 30, 90, or 365 |

```bash
curl -X GET "https://your-domain.com/api/technical/costing/variance/report?productId=550e8400-e29b-41d4-a716-446655440000&period=30" \
  -H "Content-Type: application/json"
```

#### Response

**Status: 200 OK**

```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "period_days": 30,
  "work_orders_analyzed": 15,
  "components": {
    "material": {
      "standard": 8.50,
      "actual": 9.22,
      "variance": 0.72,
      "variance_percent": 8.47
    },
    "labor": {
      "standard": 2.00,
      "actual": 2.15,
      "variance": 0.15,
      "variance_percent": 7.50
    },
    "overhead": {
      "standard": 2.00,
      "actual": 1.95,
      "variance": -0.05,
      "variance_percent": -2.50
    },
    "total": {
      "standard": 12.50,
      "actual": 13.32,
      "variance": 0.82,
      "variance_percent": 6.56
    }
  },
  "significant_variances": [
    {
      "component": "material",
      "variance_percent": 8.47,
      "threshold": 5,
      "direction": "over"
    },
    {
      "component": "labor",
      "variance_percent": 7.50,
      "threshold": 5,
      "direction": "over"
    }
  ],
  "work_order_details": [
    {
      "work_order_id": "wo-001",
      "work_order_code": "WO-2026-00123",
      "standard_cost": 12.50,
      "actual_cost": 13.45,
      "variance": 0.95,
      "variance_percent": 7.60,
      "completed_at": "2026-01-10T15:30:00Z"
    },
    {
      "work_order_id": "wo-002",
      "work_order_code": "WO-2026-00124",
      "standard_cost": 12.50,
      "actual_cost": 13.20,
      "variance": 0.70,
      "variance_percent": 5.60,
      "completed_at": "2026-01-12T09:15:00Z"
    }
  ]
}
```

#### Response Fields

**Components Object:**

Each component (material, labor, overhead, total) contains:
| Field | Type | Description |
|-------|------|-------------|
| `standard` | number | Standard (expected) cost |
| `actual` | number | Actual production cost (averaged across work orders) |
| `variance` | number | Difference (actual - standard) |
| `variance_percent` | number | Percentage variance |

**Significant Variance Object:**
| Field | Type | Description |
|-------|------|-------------|
| `component` | string | Component name (material, labor, overhead, total) |
| `variance_percent` | number | Percentage variance |
| `threshold` | number | Threshold used (default: 5%) |
| `direction` | string | `over` (unfavorable) or `under` (favorable) |

**Work Order Detail Object:**
| Field | Type | Description |
|-------|------|-------------|
| `work_order_id` | UUID | Work order ID |
| `work_order_code` | string | Human-readable code |
| `standard_cost` | number | Expected cost |
| `actual_cost` | number | Actual recorded cost |
| `variance` | number | Cost difference |
| `variance_percent` | number | Percentage variance |
| `completed_at` | ISO date | Completion timestamp |

#### Empty Response (No Production Data)

When no work orders exist in the period:

```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "period_days": 30,
  "work_orders_analyzed": 0,
  "components": null,
  "significant_variances": [],
  "work_order_details": []
}
```

#### Error Responses

**Status: 400 Bad Request** - Missing productId

```json
{
  "error": "productId is required",
  "code": "MISSING_PRODUCT_ID"
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Status: 404 Not Found**

```json
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## Data Types

### ProductCost

```typescript
interface ProductCost {
  id: string
  product_id: string
  org_id: string
  cost_type: 'standard' | 'actual' | 'planned'
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number | null
  effective_from: string  // ISO date
  effective_to: string | null
  created_at: string
  created_by: string | null
  bom_version: number | null
}
```

### VarianceComponent

```typescript
interface VarianceComponent {
  standard: number
  actual: number
  variance: number
  variance_percent: number
}
```

### SignificantVariance

```typescript
interface SignificantVariance {
  component: string
  variance_percent: number
  threshold: number
  direction: 'over' | 'under'
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Fetch cost history
const historyResponse = await fetch(
  '/api/technical/costing/products/product-id/history?' +
  new URLSearchParams({
    from: '2026-01-01',
    to: '2026-01-31',
    type: 'standard',
    page: '1',
    limit: '20'
  })
);
const history = await historyResponse.json();

// Access trends
console.log(`30-day trend: ${history.summary.trend_30d}%`);
console.log(`Top cost driver: ${history.cost_drivers[0]?.ingredient_name}`);

// Fetch variance report
const varianceResponse = await fetch(
  '/api/technical/costing/variance/report?' +
  new URLSearchParams({
    productId: 'product-id',
    period: '30'
  })
);
const variance = await varianceResponse.json();

// Check for significant variances
variance.significant_variances.forEach(sv => {
  console.log(`${sv.component}: ${sv.variance_percent}% ${sv.direction} budget`);
});
```

### React Hook Usage

```typescript
import { useCostHistory } from '@/lib/hooks/use-cost-history';
import { useVarianceReport } from '@/lib/hooks/use-variance-report';

function CostAnalysisComponent({ productId }) {
  const {
    data: costHistory,
    isLoading: loadingHistory,
    error: historyError
  } = useCostHistory(productId, {
    from: '2026-01-01',
    type: 'standard',
    page: 1,
    limit: 10
  });

  const {
    data: variance,
    isLoading: loadingVariance
  } = useVarianceReport(productId, 30);

  if (loadingHistory || loadingVariance) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Current Cost: ${costHistory.summary.current_cost}</h2>
      <p>30-day trend: {costHistory.summary.trend_30d}%</p>

      {variance.significant_variances.length > 0 && (
        <div className="alert">
          Significant variances detected!
        </div>
      )}
    </div>
  );
}
```

---

## Calculation Details

### Trend Calculation

Trends compare the oldest cost to the newest cost within each period:

```
trend_percentage = ((newest_cost - oldest_cost) / oldest_cost) * 100
```

| Period | Description |
|--------|-------------|
| 30-day | Last 30 days from today |
| 90-day | Last 90 days from today |
| YTD | January 1st to today |

Returns 0% if:
- Less than 2 data points in period
- Oldest cost is 0 (prevents division by zero)

### Variance Calculation

Variance compares standard costs to averaged actual costs from work orders:

```
variance = actual - standard
variance_percent = (variance / standard) * 100
```

**Significant variance threshold**: 5% (default)

A variance is flagged as significant when:
- `|variance_percent| > 5%`
- Direction is `over` if positive (unfavorable), `under` if negative (favorable)

### Component Breakdown

Each cost is broken into three components:

| Component | Source |
|-----------|--------|
| Material | Raw material costs from BOM |
| Labor | Production labor costs from routing |
| Overhead | Facility, equipment, indirect costs |

---

## Database Schema

### cost_variances Table

```sql
CREATE TABLE cost_variances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  bom_id UUID REFERENCES boms(id),
  variance_date DATE NOT NULL,

  -- Standard vs Actual
  standard_material DECIMAL(12,4),
  actual_material DECIMAL(12,4),
  standard_labor DECIMAL(12,4),
  actual_labor DECIMAL(12,4),
  standard_overhead DECIMAL(12,4),
  actual_overhead DECIMAL(12,4),
  standard_total DECIMAL(12,4),
  actual_total DECIMAL(12,4),

  -- Calculated variances
  material_variance DECIMAL(12,4),
  labor_variance DECIMAL(12,4),
  overhead_variance DECIMAL(12,4),
  total_variance DECIMAL(12,4),
  variance_percent DECIMAL(6,2),
  variance_type TEXT CHECK (variance_type IN ('favorable', 'unfavorable')),

  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  work_order_id UUID REFERENCES work_orders(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### RLS Policies

All queries are filtered by organization:

- SELECT: Users can only read variances from their organization
- INSERT: Requires `owner`, `admin`, `finance_manager`, or `technical_manager` role
- UPDATE: Creator or users with `owner`, `admin`, `finance_manager` role
- DELETE: Admin/owner only

---

## Rate Limiting

Standard Supabase rate limits apply (100 requests per minute per IP).

## Changelog

### v1.0 (2026-01-14)

- Initial release
- Cost history endpoint with trends, breakdown, and drivers
- Variance report endpoint with component analysis
- Significant variance detection (5% threshold)
- Work order detail tracking
- Full RLS support for multi-tenancy
