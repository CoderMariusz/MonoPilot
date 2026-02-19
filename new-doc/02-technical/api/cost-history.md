# API Documentation: Cost History & Variance Analysis

**Module**: Technical - Costing
**Feature**: Cost History & Variance Analysis (Story 02.15)
**Status**: Production Ready
**Last Updated**: December 30, 2025

---

## Overview

The Cost History API provides endpoints for retrieving product cost history, calculating cost trends, analyzing cost variances between standard and actual costs, and exporting cost data in multiple formats.

**Base URL**: `/api/technical/costing`

**Authentication**: Requires valid session (JWT in Authorization header)

**Rate Limiting**: Standard API rate limits apply

---

## Core Endpoints

### 1. Get Cost History

Retrieves cost history for a product with trends, breakdowns, and cost drivers.

```
GET /api/technical/costing/products/:id/history
```

#### Request

**Path Parameters:**
```typescript
id: string  // Product ID (UUID)
```

**Query Parameters:**
```typescript
from?: string           // ISO date string (e.g., "2025-01-01")
to?: string            // ISO date string (e.g., "2025-12-31")
type?: string          // 'standard' | 'actual' | 'planned' | 'all' (default: 'all')
page?: number          // Page number (default: 1, min: 1)
limit?: number         // Records per page (default: 10, max: 100)
```

#### Response (200 OK)

```typescript
{
  product: {
    id: string
    code: string
    name: string
  },
  summary: {
    current_cost: number          // Latest total cost
    current_cost_per_unit: number // Latest cost per unit
    previous_cost: number | null  // Prior calculation cost
    change_amount: number         // Absolute change from previous
    change_percentage: number     // Percentage change from previous
    trend_30d: number            // 30-day trend percentage
    trend_90d: number            // 90-day trend percentage
    trend_ytd: number            // Year-to-date trend percentage
  },
  history: [
    {
      id: string
      cost_type: 'standard' | 'actual' | 'planned'
      material_cost: number
      labor_cost: number
      overhead_cost: number
      total_cost: number
      cost_per_unit: number | null
      effective_from: string      // ISO date
      effective_to: string | null // ISO date
      created_at: string          // ISO timestamp
      created_by: string | null   // User ID who created
      bom_version: number | null
    }
  ],
  pagination: {
    total: number       // Total records matching filters
    page: number        // Current page
    limit: number       // Records per page
    total_pages: number // Total pages available
  },
  component_breakdown: {
    current: {
      material: number
      labor: number
      overhead: number
      total: number
    },
    historical: {
      material: number
      labor: number
      overhead: number
      total: number
    },
    changes: {
      material: { amount: number; percent: number }
      labor: { amount: number; percent: number }
      overhead: { amount: number; percent: number }
      total: { amount: number; percent: number }
    }
  },
  cost_drivers: [
    {
      ingredient_id: string
      ingredient_name: string
      ingredient_code: string
      current_cost: number
      historical_cost: number
      change_amount: number
      change_percent: number
      impact_percent: number  // Contribution to total change
    }
  ]
}
```

#### Error Responses

**400 Bad Request - Invalid Date Range:**
```typescript
{
  error: 'Invalid date range',
  code: 'INVALID_DATE_RANGE',
  message: 'from date cannot be after to date'
}
```

**401 Unauthorized - No valid session:**
```typescript
{
  error: 'Unauthorized',
  code: 'UNAUTHORIZED'
}
```

**404 Not Found - Product doesn't exist or not in user's organization:**
```typescript
{
  error: 'Product not found',
  code: 'PRODUCT_NOT_FOUND'
}
```

#### Examples

**Request - Get last 12 months of standard costs with pagination:**
```bash
curl -X GET \
  'https://app.monopilot.io/api/technical/costing/products/prod-123/history?type=standard&limit=25&page=1' \
  -H 'Authorization: Bearer <token>'
```

**Request - Get filtered date range with specific cost type:**
```bash
curl -X GET \
  'https://app.monopilot.io/api/technical/costing/products/prod-123/history?from=2025-01-01&to=2025-03-31&type=actual' \
  -H 'Authorization: Bearer <token>'
```

**Response - 200 OK:**
```json
{
  "product": {
    "id": "prod-123",
    "code": "BREAD-001",
    "name": "Bread Loaf White"
  },
  "summary": {
    "current_cost": 245.50,
    "current_cost_per_unit": 2.46,
    "previous_cost": 237.50,
    "change_amount": 8.00,
    "change_percentage": 3.4,
    "trend_30d": 2.1,
    "trend_90d": 5.8,
    "trend_ytd": 12.3
  },
  "history": [
    {
      "id": "cost-456",
      "cost_type": "standard",
      "material_cost": 185.50,
      "labor_cost": 42.00,
      "overhead_cost": 18.00,
      "total_cost": 245.50,
      "cost_per_unit": 2.46,
      "effective_from": "2025-12-10",
      "effective_to": null,
      "created_at": "2025-12-10T10:30:00Z",
      "created_by": "user-789",
      "bom_version": 4
    },
    {
      "id": "cost-455",
      "cost_type": "standard",
      "material_cost": 178.20,
      "labor_cost": 41.50,
      "overhead_cost": 17.80,
      "total_cost": 237.50,
      "cost_per_unit": 2.38,
      "effective_from": "2025-11-15",
      "effective_to": "2025-12-09",
      "created_at": "2025-11-15T14:20:00Z",
      "created_by": "user-789",
      "bom_version": 3
    }
  ],
  "pagination": {
    "total": 47,
    "page": 1,
    "limit": 25,
    "total_pages": 2
  },
  "component_breakdown": {
    "current": {
      "material": 185.50,
      "labor": 42.00,
      "overhead": 18.00,
      "total": 245.50
    },
    "historical": {
      "material": 178.20,
      "labor": 41.50,
      "overhead": 17.80,
      "total": 237.50
    },
    "changes": {
      "material": { "amount": 7.30, "percent": 4.1 },
      "labor": { "amount": 0.50, "percent": 1.2 },
      "overhead": { "amount": 0.20, "percent": 1.1 },
      "total": { "amount": 8.00, "percent": 3.4 }
    }
  },
  "cost_drivers": [
    {
      "ingredient_id": "ing-001",
      "ingredient_name": "Butter",
      "ingredient_code": "BTR-001",
      "current_cost": 52.00,
      "historical_cost": 48.00,
      "change_amount": 4.00,
      "change_percent": 8.3,
      "impact_percent": 50.0
    }
  ]
}
```

---

### 2. Get Variance Report

Analyzes variance between standard costs and actual production costs.

```
GET /api/technical/costing/variance/report
```

#### Request

**Query Parameters:**
```typescript
productId: string  // Product ID (UUID) - required
period?: number    // Analysis period in days (default: 30, options: 7|30|90|365)
```

#### Response (200 OK)

```typescript
{
  product_id: string
  period_days: number
  work_orders_analyzed: number
  components: {
    material: {
      standard: number        // Standard material cost
      actual: number          // Average actual material cost
      variance: number        // Actual - standard
      variance_percent: number // (Variance / standard) * 100
    },
    labor: {
      standard: number
      actual: number
      variance: number
      variance_percent: number
    },
    overhead: {
      standard: number
      actual: number
      variance: number
      variance_percent: number
    },
    total: {
      standard: number
      actual: number
      variance: number
      variance_percent: number
    }
  },
  significant_variances: [
    {
      component: string        // 'material' | 'labor' | 'overhead' | 'total'
      variance_percent: number // Percentage variance
      threshold: number        // Threshold used (default: 5%)
      direction: 'over' | 'under'
    }
  ],
  work_order_details: [
    {
      work_order_id: string
      work_order_code: string
      standard_cost: number
      actual_cost: number
      variance: number
      variance_percent: number
      completed_at: string
    }
  ]
}
```

#### Error Responses

**400 Bad Request - Invalid period:**
```typescript
{
  error: 'Invalid period',
  code: 'INVALID_PERIOD',
  message: 'period must be one of: 7, 30, 90, 365'
}
```

**404 Not Found - Product not found:**
```typescript
{
  error: 'Product not found',
  code: 'PRODUCT_NOT_FOUND'
}
```

#### Examples

**Request - Get 30-day variance (default):**
```bash
curl -X GET \
  'https://app.monopilot.io/api/technical/costing/variance/report?productId=prod-123' \
  -H 'Authorization: Bearer <token>'
```

**Request - Get 90-day variance:**
```bash
curl -X GET \
  'https://app.monopilot.io/api/technical/costing/variance/report?productId=prod-123&period=90' \
  -H 'Authorization: Bearer <token>'
```

**Response - 200 OK:**
```json
{
  "product_id": "prod-123",
  "period_days": 30,
  "work_orders_analyzed": 12,
  "components": {
    "material": {
      "standard": 185.50,
      "actual": 188.20,
      "variance": 2.70,
      "variance_percent": 1.5
    },
    "labor": {
      "standard": 42.00,
      "actual": 45.30,
      "variance": 3.30,
      "variance_percent": 7.9
    },
    "overhead": {
      "standard": 18.00,
      "actual": 17.85,
      "variance": -0.15,
      "variance_percent": -0.8
    },
    "total": {
      "standard": 245.50,
      "actual": 251.35,
      "variance": 5.85,
      "variance_percent": 2.4
    }
  },
  "significant_variances": [
    {
      "component": "labor",
      "variance_percent": 7.9,
      "threshold": 5,
      "direction": "over"
    }
  ],
  "work_order_details": [
    {
      "work_order_id": "wo-001",
      "work_order_code": "WO-2025-001",
      "standard_cost": 245.50,
      "actual_cost": 252.10,
      "variance": 6.60,
      "variance_percent": 2.7,
      "completed_at": "2025-12-08T16:45:00Z"
    }
  ]
}
```

---

## Service Functions

These are client-side TypeScript functions for cost history calculations and analysis.

### calculateTrends()

Calculates cost trends for multiple periods.

```typescript
import { calculateTrends } from '@/lib/services/cost-history-service'
import type { ProductCost, TrendSummary } from '@/lib/types/cost-history'

function calculateTrends(costHistory: ProductCost[]): TrendSummary

// Example
const trends = calculateTrends([
  {
    id: 'cost-1',
    product_id: 'prod-123',
    org_id: 'org-1',
    cost_type: 'standard',
    material_cost: 185.50,
    labor_cost: 42.00,
    overhead_cost: 18.00,
    total_cost: 245.50,
    cost_per_unit: 2.46,
    effective_from: '2025-12-10',
    effective_to: null,
    created_at: '2025-12-10T10:30:00Z',
    created_by: 'user-123',
    bom_version: 4
  }
  // ... more cost records
])

// Returns:
// {
//   trend_30d: 2.1,    // 2.1% increase over 30 days
//   trend_90d: 5.8,    // 5.8% increase over 90 days
//   trend_ytd: 12.3    // 12.3% increase year-to-date
// }
```

**Parameters:**
- `costHistory` - Array of ProductCost records (any order accepted, sorted internally)

**Returns:**
- `TrendSummary` object with trend_30d, trend_90d, trend_ytd as percentage numbers

**Behavior:**
- Returns 0% if fewer than 2 records in a period
- Divides by first cost (if first cost is 0, returns 0%)
- YTD starts from January 1st of current year

---

### getComponentBreakdown()

Calculates what percentage each cost component represents.

```typescript
import { getComponentBreakdown } from '@/lib/services/cost-history-service'
import type {
  ComponentBreakdownInput,
  ComponentBreakdownPercentages
} from '@/lib/types/cost-history'

function getComponentBreakdown(
  current: ComponentBreakdownInput,
  historical?: ComponentBreakdownInput
): ComponentBreakdownPercentages

// Example - Current only
const breakdown = getComponentBreakdown({
  material: 185.50,
  labor: 42.00,
  overhead: 18.00
})

// Returns:
// {
//   material: 75.6,   // 75.6% of total
//   labor: 17.1,      // 17.1% of total
//   overhead: 7.3     // 7.3% of total
// }

// Example - With historical comparison
const breakdownWithChange = getComponentBreakdown(
  { material: 185.50, labor: 42.00, overhead: 18.00 },
  { material: 178.20, labor: 41.50, overhead: 17.80 }
)

// Returns:
// {
//   material: 75.6,
//   labor: 17.1,
//   overhead: 7.3,
//   material_change: 4.1,    // 4.1% increase from historical
//   labor_change: 1.2,       // 1.2% increase from historical
//   overhead_change: 1.1     // 1.1% increase from historical
// }
```

**Parameters:**
- `current` - Current cost breakdown {material, labor, overhead}
- `historical` - (optional) Historical cost breakdown for comparison

**Returns:**
- `ComponentBreakdownPercentages` with percentages for each component
- If historical provided, also includes change percentages

**Behavior:**
- Returns all 0s if total is 0 (avoids division by zero)
- Change percent is 0% if historical component is 0
- Uses formula: (component / total) * 100 for percentages
- Uses formula: ((current - historical) / historical) * 100 for changes

---

### calculateVariance() - Service Function

Calculates variance between standard and actual costs.

```typescript
import { calculateVariance } from '@/lib/services/variance-analysis-service'
import type {
  ProductCost,
  WorkOrderCost,
  VarianceReport
} from '@/lib/types/variance'

function calculateVariance(
  standardCosts: ProductCost,
  actualCosts: WorkOrderCost[]
): VarianceReport

// Example
const variance = calculateVariance(
  {
    id: 'cost-123',
    product_id: 'prod-123',
    org_id: 'org-1',
    cost_type: 'standard',
    material_cost: 185.50,
    labor_cost: 42.00,
    overhead_cost: 18.00,
    total_cost: 245.50,
    cost_per_unit: 2.46,
    effective_from: '2025-12-10',
    effective_to: null,
    created_at: '2025-12-10T10:30:00Z',
    created_by: 'user-123',
    bom_version: 4
  },
  [
    {
      id: 'wo-cost-1',
      work_order_id: 'wo-001',
      org_id: 'org-1',
      product_id: 'prod-123',
      material_cost: 188.20,
      labor_cost: 45.30,
      overhead_cost: 17.85,
      total_cost: 251.35,
      created_at: '2025-12-08T16:45:00Z',
      created_by: 'user-456'
    }
    // ... more work order costs
  ]
)

// Returns:
// {
//   components: {
//     material: {
//       standard: 185.50,
//       actual: 188.20,
//       variance: 2.70,
//       variance_percent: 1.5
//     },
//     labor: {
//       standard: 42.00,
//       actual: 45.30,
//       variance: 3.30,
//       variance_percent: 7.9
//     },
//     overhead: {
//       standard: 18.00,
//       actual: 17.85,
//       variance: -0.15,
//       variance_percent: -0.8
//     },
//     total: {
//       standard: 245.50,
//       actual: 251.35,
//       variance: 5.85,
//       variance_percent: 2.4
//     }
//   },
//   significant_variances: [
//     {
//       component: 'labor',
//       variance_percent: 7.9,
//       threshold: 5,
//       direction: 'over'
//     }
//   ],
//   work_orders_analyzed: 1
// }
```

**Parameters:**
- `standardCosts` - ProductCost record with standard costs
- `actualCosts` - Array of WorkOrderCost records from production

**Returns:**
- `VarianceReport` with components, significant variances, and work order count

**Behavior:**
- Averages actual costs across all work orders
- Returns null components if no work orders provided
- Uses 5% threshold for significant variance detection
- Formula: variance_percent = (variance / standard) * 100
- Returns 0% if standard is 0 (avoids division by zero)

---

### identifySignificantVariances()

Identifies variances exceeding a threshold (>5% by default).

```typescript
import { identifySignificantVariances } from '@/lib/services/variance-analysis-service'
import type {
  VarianceComponents,
  SignificantVariance
} from '@/lib/types/variance'

function identifySignificantVariances(
  components: VarianceComponents,
  threshold?: number
): SignificantVariance[]

// Example
const significant = identifySignificantVariances(
  {
    material: {
      standard: 185.50,
      actual: 188.20,
      variance: 2.70,
      variance_percent: 1.5
    },
    labor: {
      standard: 42.00,
      actual: 45.30,
      variance: 3.30,
      variance_percent: 7.9
    },
    overhead: {
      standard: 18.00,
      actual: 17.85,
      variance: -0.15,
      variance_percent: -0.8
    },
    total: {
      standard: 245.50,
      actual: 251.35,
      variance: 5.85,
      variance_percent: 2.4
    }
  },
  5  // 5% threshold
)

// Returns:
// [
//   {
//     component: 'labor',
//     variance_percent: 7.9,
//     threshold: 5,
//     direction: 'over'
//   }
// ]
// (labor is the only component exceeding 5%)
```

**Parameters:**
- `components` - VarianceComponents object with all components
- `threshold` - (optional) Percentage threshold (default: 5)

**Returns:**
- Array of SignificantVariance items exceeding threshold

**Behavior:**
- Uses absolute value for comparison (|-0.8%| = 0.8% < 5%)
- Direction is 'over' if variance_percent > 0, 'under' if < 0
- Returns empty array if no variances exceed threshold

---

## Type Definitions

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
  currency?: string
  effective_from: string
  effective_to: string | null
  bom_id?: string | null
  bom_version: number | null
  routing_id?: string | null
  calculation_method?: string | null
  notes?: string | null
  created_at: string
  created_by: string | null
  updated_at?: string
}
```

### CostHistoryItem

```typescript
interface CostHistoryItem {
  id: string
  cost_type: string
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number | null
  effective_from: string
  effective_to: string | null
  created_at: string
  created_by: string | null
  bom_version: number | null
}
```

### TrendSummary

```typescript
interface TrendSummary {
  trend_30d: number  // Percentage change over 30 days
  trend_90d: number  // Percentage change over 90 days
  trend_ytd: number  // Percentage change year-to-date
}
```

### VarianceComponent

```typescript
interface VarianceComponent {
  standard: number        // Standard cost
  actual: number          // Actual cost
  variance: number        // Actual - standard
  variance_percent: number // (Variance / standard) * 100
}
```

### SignificantVariance

```typescript
interface SignificantVariance {
  component: string              // 'material' | 'labor' | 'overhead' | 'total'
  variance_percent: number       // Percentage variance
  threshold: number              // Threshold used for detection (5 by default)
  direction: 'over' | 'under'   // Is variance positive or negative
}
```

---

## Authentication & Authorization

### Session Requirement

All endpoints require a valid user session:

```typescript
// Server-side example
const {
  data: { session },
  error: authError,
} = await supabase.auth.getSession()

if (!session) {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}
```

### Multi-Tenancy (RLS)

Organization isolation is enforced:

```typescript
// All queries filter by org_id
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .eq('org_id', currentUser.org_id)  // RLS filter
  .single()

// Cross-org access returns 404 (not 403)
if (product.org_id !== currentUser.org_id) {
  return NextResponse.json(
    { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
    { status: 404 }
  )
}
```

---

## Performance Considerations

### Pagination

Large datasets are paginated to avoid performance issues:

```
Default limit: 10 records per page
Max limit: 100 records per page
Recommended: Use limit=25 for balance of performance and data
```

### Date Range Filtering

Narrow date ranges perform better:

```
Optimal: 1-3 months
Good: 6-12 months
Slow: 2+ years (consider exporting to Excel instead)
```

### Trend Calculations

Trends are calculated from full history (not paginated):

```
- 30d trend: ~30ms (queries last 30 days of history)
- 90d trend: ~40ms (queries last 90 days of history)
- YTD trend: ~50ms (queries from Jan 1 to today)
```

### Caching

Cost history data is cached for 5 minutes:

```
- First request: ~200ms (query database)
- Subsequent requests within 5 min: <50ms (from cache)
- After 5 min: Cache expires, query refreshes
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```typescript
{
  error: string      // Human-readable error message
  code: string       // Machine-readable error code
  message?: string   // Additional context (optional)
}
```

### Common Error Codes

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| `UNAUTHORIZED` | 401 | No valid session | Login required |
| `USER_NOT_FOUND` | 404 | User doesn't exist | Contact support |
| `PRODUCT_NOT_FOUND` | 404 | Product not found or access denied | Verify product ID and permissions |
| `INVALID_DATE_RANGE` | 400 | from > to | Swap dates or fix range |
| `INVALID_PERIOD` | 400 | Period not in [7,30,90,365] | Use valid period value |

---

## Rate Limiting

Standard API rate limits apply:

```
Per IP: 1000 requests per hour
Per User: 5000 requests per hour
Burst: 100 requests per minute
```

If rate limited:
```http
HTTP 429 Too Many Requests
Retry-After: 60
```

---

## Integration Examples

### React Component Example

```typescript
import { useQuery } from '@tanstack/react-query'
import type { CostHistoryResponse } from '@/lib/types/cost-history'

export function CostHistoryChart({ productId }: { productId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cost-history', productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/technical/costing/products/${productId}/history`
      )
      if (!res.ok) throw new Error('Failed to fetch cost history')
      return res.json() as Promise<CostHistoryResponse>
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.history.length) return <div>No cost history</div>

  return (
    <div>
      <h3>{data.product.name}</h3>
      <p>Current Cost: ${data.summary.current_cost}</p>
      <p>30-Day Trend: {data.summary.trend_30d}%</p>
    </div>
  )
}
```

### Variance Analysis Example

```typescript
import { useQuery } from '@tanstack/react-query'
import type { VarianceReportResponse } from '@/lib/types/variance'

export function VarianceReport({ productId }: { productId: string }) {
  const { data } = useQuery({
    queryKey: ['variance', productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/technical/costing/variance/report?productId=${productId}&period=30`
      )
      if (!res.ok) throw new Error('Failed to fetch variance')
      return res.json() as Promise<VarianceReportResponse>
    },
  })

  if (!data?.components) return <div>No variance data</div>

  const laborVariance = data.components.labor.variance_percent
  const isSignificant = Math.abs(laborVariance) > 5

  return (
    <div>
      <h4>Labor Cost Variance</h4>
      <p>Variance: {laborVariance}%</p>
      {isSignificant && <p className="alert">Above 5% threshold!</p>}
      <p>Work Orders Analyzed: {data.work_orders_analyzed}</p>
    </div>
  )
}
```

---

## Testing

### Unit Test Example

```typescript
import { calculateVariance } from '@/lib/services/variance-analysis-service'
import { describe, it, expect } from 'vitest'

describe('calculateVariance', () => {
  it('calculates variance correctly', () => {
    const standard = {
      id: 'cost-1',
      material_cost: 185.50,
      labor_cost: 42.00,
      overhead_cost: 18.00,
      total_cost: 245.50,
      // ... other fields
    }

    const actual = [
      {
        id: 'wo-1',
        material_cost: 188.20,
        labor_cost: 45.30,
        overhead_cost: 17.85,
        total_cost: 251.35,
        // ... other fields
      },
    ]

    const result = calculateVariance(standard, actual)

    expect(result.components.labor.variance_percent).toBe(7.9)
    expect(result.significant_variances).toContainEqual(
      expect.objectContaining({ component: 'labor' })
    )
  })
})
```

---

## Changelog

### Version 1.0 (Production - December 30, 2025)
- Initial release with cost history and variance analysis
- Support for multiple cost types (standard, actual, planned)
- Trend calculations (30d, 90d, YTD)
- Component breakdown and cost driver analysis
- Variance detection with 5% threshold
- Pagination support (max 100 records per page)
- Date range filtering
- Multi-tenant RLS enforcement

---

## See Also

- [Recipe Costing API](../recipe-costing.md) - Cost calculation endpoints
- [Product API](../product.md) - Product management endpoints
- [Work Order API](../work-order.md) - Production tracking endpoints

