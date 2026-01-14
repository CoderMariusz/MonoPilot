# BOM-Routing Costs API Reference

Story: 02.9 - BOM-Routing Costs

## Overview

The BOM-Routing Costs API calculates complete product costs from Bills of Materials (BOM) and their associated production routings. This API supports:

- Material costs from BOM items with scrap allowances
- Labor costs from routing operations
- Setup and working costs from routing configuration
- Overhead calculations as a percentage of subtotal
- Cost comparison between BOM versions

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api/technical
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by the client SDK).

**Required Roles**: Any authenticated user can read costs. Recalculation requires write access to the BOM.

## Endpoints

### GET /api/technical/boms/{id}/cost

Calculate and return the complete cost breakdown for a BOM.

#### Request

```bash
curl -X GET "https://your-domain.com/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/cost?quantity=10" \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | BOM ID to calculate cost for |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| quantity | integer | 1 | Number of output units to calculate working cost for |

#### Response

**Status: 200 OK**

```json
{
  "materialCost": 450.25,
  "laborCost": 125.50,
  "setupCost": 50.00,
  "workingCost": 75.00,
  "overheadCost": 70.08,
  "totalCost": 770.83,
  "currency": "PLN",
  "calculatedAt": "2026-01-14T10:30:00.000Z",
  "breakdown": {
    "materials": [
      {
        "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "productCode": "FLOUR-001",
        "productName": "All-Purpose Flour",
        "quantity": 25.0,
        "scrapPercent": 2.0,
        "effectiveQuantity": 25.5,
        "unitCost": 12.50,
        "lineCost": 318.75,
        "uom": "kg"
      },
      {
        "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "productCode": "SUGAR-001",
        "productName": "Granulated Sugar",
        "quantity": 10.0,
        "scrapPercent": 1.0,
        "effectiveQuantity": 10.1,
        "unitCost": 13.00,
        "lineCost": 131.50,
        "uom": "kg"
      }
    ],
    "operations": [
      {
        "operationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "operationName": "Mixing",
        "sequence": 10,
        "duration": 30,
        "setupTime": 0,
        "cleanupTime": 10,
        "laborRate": 75.00,
        "laborCost": 50.00
      },
      {
        "operationId": "d4e5f6a7-b8c9-0123-defa-234567890123",
        "operationName": "Baking",
        "sequence": 20,
        "duration": 45,
        "setupTime": 0,
        "cleanupTime": 15,
        "laborRate": 75.00,
        "laborCost": 75.50
      }
    ]
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| materialCost | number | Sum of all material costs including scrap allowance |
| laborCost | number | Sum of all operation labor costs |
| setupCost | number | Fixed setup cost from routing (per batch) |
| workingCost | number | Variable working cost (per unit x quantity) |
| overheadCost | number | Overhead percentage applied to subtotal |
| totalCost | number | Sum of all cost components |
| currency | string | Currency code (default: PLN) |
| calculatedAt | string | ISO 8601 timestamp of calculation |
| breakdown.materials | array | Detailed material cost lines |
| breakdown.operations | array | Detailed operation cost lines |

#### Error Responses

**Status: 400 Bad Request** - Invalid quantity parameter

```json
{
  "error": "Invalid quantity parameter. Must be a positive integer."
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 404 Not Found** - BOM not found or not in user's organization

```json
{
  "error": "BOM not found"
}
```

**Status: 500 Internal Server Error**

```json
{
  "error": "Database connection error",
  "code": "DATABASE_ERROR"
}
```

---

### POST /api/technical/boms/{id}/recalculate-cost

Recalculate BOM cost and save the result to the product_costs table.

#### Request

```bash
curl -X POST "https://your-domain.com/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/recalculate-cost" \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | BOM ID to recalculate cost for |

#### Response

**Status: 200 OK**

```json
{
  "success": true,
  "cost": {
    "bom_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cost_type": "standard",
    "batch_size": 100,
    "batch_uom": "kg",
    "material_cost": 450.25,
    "labor_cost": 125.50,
    "overhead_cost": 70.08,
    "total_cost": 770.83,
    "cost_per_unit": 7.71,
    "currency": "PLN",
    "calculated_at": "2026-01-14T10:30:00.000Z",
    "calculated_by": "e5f6a7b8-c9d0-1234-efab-567890123456",
    "is_stale": false,
    "breakdown": {
      "materials": [
        {
          "ingredient_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "ingredient_code": "FLOUR-001",
          "ingredient_name": "All-Purpose Flour",
          "quantity": 25.0,
          "uom": "kg",
          "unit_cost": 12.50,
          "scrap_percent": 2.0,
          "scrap_cost": 6.25,
          "total_cost": 318.75,
          "percentage": 70.8
        }
      ],
      "operations": [
        {
          "operation_seq": 10,
          "operation_name": "Mixing",
          "machine_name": null,
          "setup_time_min": 0,
          "duration_min": 30,
          "cleanup_time_min": 10,
          "labor_rate": 75.00,
          "setup_cost": 0,
          "run_cost": 37.50,
          "cleanup_cost": 12.50,
          "total_cost": 50.00,
          "percentage": 39.8
        }
      ],
      "routing": {
        "routing_id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
        "routing_code": "RTG-001",
        "setup_cost": 50.00,
        "working_cost_per_unit": 0.75,
        "total_working_cost": 75.00,
        "total_routing_cost": 125.00
      },
      "overhead": {
        "allocation_method": "percentage",
        "overhead_percent": 10,
        "subtotal_before_overhead": 700.75,
        "overhead_cost": 70.08
      }
    },
    "margin_analysis": null
  },
  "calculated_at": "2026-01-14T10:30:00.000Z",
  "warnings": []
}
```

#### Warnings

The response may include warnings if certain operations could not be completed:

```json
{
  "success": true,
  "cost": { ... },
  "calculated_at": "2026-01-14T10:30:00.000Z",
  "warnings": ["Cost saved but product_costs record failed"]
}
```

#### Error Responses

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 404 Not Found**

```json
{
  "error": "BOM not found"
}
```

**Status: 500 Internal Server Error**

```json
{
  "error": "Failed to calculate cost",
  "code": "DATABASE_ERROR"
}
```

---

### GET /api/technical/routings/{id}/cost

Get the labor and overhead costs for a routing (standalone, without BOM materials).

#### Request

```bash
curl -X GET "https://your-domain.com/api/technical/routings/f6a7b8c9-d0e1-2345-fabc-678901234567/cost" \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Routing ID to calculate cost for |

#### Response

**Status: 200 OK**

```json
{
  "routing_id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
  "routing_code": "RTG-001",
  "total_operation_cost": 125.50,
  "total_routing_cost": 125.00,
  "total_cost": 250.50,
  "currency": "PLN",
  "breakdown": {
    "operations": [
      {
        "operation_seq": 10,
        "operation_name": "Mixing",
        "machine_name": null,
        "setup_time_min": 0,
        "duration_min": 30,
        "cleanup_time_min": 10,
        "labor_rate": 75.00,
        "setup_cost": 0,
        "run_cost": 37.50,
        "cleanup_cost": 12.50,
        "total_cost": 50.00,
        "percentage": 39.8
      },
      {
        "operation_seq": 20,
        "operation_name": "Baking",
        "machine_name": null,
        "setup_time_min": 0,
        "duration_min": 45,
        "cleanup_time_min": 15,
        "labor_rate": 75.00,
        "setup_cost": 0,
        "run_cost": 56.25,
        "cleanup_cost": 18.75,
        "total_cost": 75.50,
        "percentage": 60.2
      }
    ],
    "routing": {
      "routing_id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
      "routing_code": "RTG-001",
      "setup_cost": 50.00,
      "working_cost_per_unit": 75.00,
      "total_working_cost": 75.00,
      "total_routing_cost": 125.00
    }
  }
}
```

#### Error Responses

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 404 Not Found**

```json
{
  "error": "Routing not found"
}
```

**Status: 500 Internal Server Error**

```json
{
  "error": "Failed to fetch routing operations"
}
```

---

## Cost Calculation Formula

The BOM cost calculation follows this formula from ADR-009:

```
Total Cost = Material + Labor + Setup + Working + Overhead

Where:
- Material = SUM(bom_item.quantity x (1 + scrap_percent/100) x product.cost_per_unit)
- Labor = SUM((op.duration + op.cleanup_time) / 60 x op.labor_cost_per_hour)
- Setup = routing.setup_cost (fixed per batch)
- Working = routing.working_cost_per_unit x quantity
- Overhead = (Material + Labor + Setup + Working) x routing.overhead_percent / 100
```

### Material Cost Calculation

Each BOM item's cost includes scrap allowance:

```
Effective Quantity = quantity x (1 + scrap_percent / 100)
Line Cost = Effective Quantity x unit_cost
```

**Example:**
- Quantity: 100 kg
- Scrap %: 2%
- Unit Cost: 10 PLN/kg
- Effective Quantity: 100 x 1.02 = 102 kg
- Line Cost: 102 x 10 = 1020 PLN

### Labor Cost Calculation

Each operation's labor cost is calculated from duration and cleanup time:

```
Total Minutes = duration + cleanup_time
Labor Cost = (Total Minutes / 60) x labor_cost_per_hour
```

**Example:**
- Duration: 30 minutes
- Cleanup: 10 minutes
- Labor Rate: 75 PLN/hour
- Total Minutes: 40
- Labor Cost: (40 / 60) x 75 = 50 PLN

---

## Code Examples

### TypeScript/React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query keys for cache management
export const bomCostKeys = {
  all: ['bom-cost'] as const,
  detail: (bomId: string) => [...bomCostKeys.all, bomId] as const,
}

// Fetch BOM cost
async function fetchBOMCost(bomId: string) {
  const response = await fetch(`/api/technical/boms/${bomId}/cost`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch cost')
  }
  return response.json()
}

// Hook to fetch BOM cost
export function useBOMCost(bomId: string) {
  return useQuery({
    queryKey: bomCostKeys.detail(bomId),
    queryFn: () => fetchBOMCost(bomId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!bomId,
  })
}

// Hook to recalculate cost
export function useRecalculateCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bomId: string) => {
      const response = await fetch(`/api/technical/boms/${bomId}/recalculate-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to recalculate')
      }
      return response.json()
    },
    onSuccess: (_data, bomId) => {
      queryClient.invalidateQueries({ queryKey: bomCostKeys.detail(bomId) })
    },
  })
}
```

### React Component Example

```tsx
import { useBOMCost, useRecalculateCost } from '@/lib/hooks/use-bom-cost'
import { formatCurrency } from '@/lib/utils/format-currency'

function CostSummary({ bomId }: { bomId: string }) {
  const { data: cost, isLoading, error, refetch } = useBOMCost(bomId)
  const { mutateAsync: recalculate, isPending } = useRecalculateCost()

  if (isLoading) return <div>Loading costs...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!cost) return <div>No cost data available</div>

  const handleRecalculate = async () => {
    await recalculate(bomId)
    await refetch()
  }

  return (
    <div>
      <h2>Cost Summary</h2>
      <p>Material: {formatCurrency(cost.materialCost, cost.currency)}</p>
      <p>Labor: {formatCurrency(cost.laborCost, cost.currency)}</p>
      <p>Setup: {formatCurrency(cost.setupCost, cost.currency)}</p>
      <p>Working: {formatCurrency(cost.workingCost, cost.currency)}</p>
      <p>Overhead: {formatCurrency(cost.overheadCost, cost.currency)}</p>
      <p><strong>Total: {formatCurrency(cost.totalCost, cost.currency)}</strong></p>
      <button onClick={handleRecalculate} disabled={isPending}>
        {isPending ? 'Recalculating...' : 'Recalculate Cost'}
      </button>
    </div>
  )
}
```

### Python

```python
import requests

# Fetch BOM cost
response = requests.get(
    'https://your-domain.com/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/cost',
    params={'quantity': 10}
)
cost_data = response.json()
print(f"Total Cost: {cost_data['totalCost']} {cost_data['currency']}")

# Recalculate cost
recalc_response = requests.post(
    'https://your-domain.com/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/recalculate-cost'
)
result = recalc_response.json()
if result['success']:
    print(f"New Cost: {result['cost']['total_cost']}")
```

---

## Database Schema

### product_costs Table

Stores calculated costs with effective date tracking:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization ID (multi-tenancy) |
| product_id | UUID | Product being costed |
| cost_type | TEXT | 'standard', 'actual', or 'planned' |
| material_cost | DECIMAL(15,4) | Sum of ingredient costs |
| labor_cost | DECIMAL(15,4) | Sum of operation labor costs |
| overhead_cost | DECIMAL(15,4) | Overhead percentage applied |
| total_cost | DECIMAL(15,4) | Total cost including overhead |
| effective_from | DATE | Start date when cost applies |
| effective_to | DATE | End date (NULL = currently active) |
| calculation_method | TEXT | 'bom_routing', 'actual_production', or 'manual' |

### Routing Cost Fields

The routings table includes cost configuration:

| Column | Type | Description |
|--------|------|-------------|
| setup_cost | DECIMAL(15,4) | Fixed setup cost per batch |
| working_cost_per_unit | DECIMAL(15,4) | Variable cost per unit produced |
| overhead_percent | DECIMAL(5,2) | Overhead percentage to apply |
| currency | VARCHAR(3) | Currency code (default: PLN) |

### Routing Operation Cost Fields

Each routing_operations record includes:

| Column | Type | Description |
|--------|------|-------------|
| estimated_duration_minutes | INTEGER | Run time in minutes |
| cleanup_time | INTEGER | Cleanup time in minutes |
| labor_cost_per_hour | DECIMAL(15,4) | Hourly labor rate |

---

## Validation Schemas (Zod)

### BOM Cost Request

```typescript
const bomCostRequestSchema = z.object({
  bom_id: z.string().uuid('Invalid BOM ID'),
})
```

### Routing Cost Query

```typescript
const routingCostQuerySchema = z.object({
  batch_size: z.coerce.number().positive('Batch size must be positive').default(1),
})
```

### BOM Cost Response

```typescript
const bomCostResponseSchema = z.object({
  bom_id: z.string().uuid(),
  product_id: z.string().uuid(),
  cost_type: z.literal('standard'),
  batch_size: z.number().positive(),
  batch_uom: z.string(),
  material_cost: z.number().min(0),
  labor_cost: z.number().min(0),
  overhead_cost: z.number().min(0),
  total_cost: z.number().min(0),
  cost_per_unit: z.number().min(0),
  currency: z.string(),
  calculated_at: z.string().datetime(),
  calculated_by: z.string(),
  is_stale: z.boolean(),
  breakdown: z.object({
    materials: z.array(materialCostBreakdownSchema),
    operations: z.array(operationCostBreakdownSchema),
    routing: routingCostBreakdownSchema,
    overhead: overheadBreakdownSchema,
  }),
  margin_analysis: z.object({
    std_price: z.number().nullable(),
    target_margin_percent: z.number(),
    actual_margin_percent: z.number().nullable(),
    below_target: z.boolean(),
  }).optional(),
})
```

---

## Rate Limiting

No explicit rate limiting is applied. Standard Supabase per-function rate limits apply (100 requests per minute per IP address).

---

## Changelog

### v1.0 (2026-01-14)

- Initial release with complete BOM cost calculation
- GET /api/technical/boms/{id}/cost endpoint
- POST /api/technical/boms/{id}/recalculate-cost endpoint
- GET /api/technical/routings/{id}/cost endpoint
- Material, labor, setup, working, and overhead cost components
- Scrap percentage support for materials
- Cost breakdown by material and operation
- product_costs table for cost history
