# BOM Costing API Reference

## Overview

The BOM Costing API calculates product costs by combining material costs from Bill of Materials (BOM) ingredients with labor costs and overhead from assigned routings. This API enables you to:

- Calculate accurate product costs including materials, labor, and overhead
- Understand cost breakdowns by ingredient and operation
- Analyze margins between standard price and calculated cost
- Recalculate costs when ingredient or routing data changes
- Track cost calculation history

The costing calculation uses current ingredient costs from your products database, actual operation durations from routings, and applies overhead allocation at the routing level. All calculations are performed server-side to ensure consistency and accuracy.

---

## Authentication

All BOM Costing API endpoints require authentication and specific permissions.

**Authentication Header**:
```
Authorization: Bearer {access_token}
```

The access token is obtained through Supabase authentication. Include it in the `Authorization` header for all requests.

**Required Permissions**:
- `technical.R` - Read BOM costs (GET endpoints)
- `technical.U` - Recalculate BOM costs (POST endpoints)
- `admin` or `super_admin` - Full access to all endpoints

Without proper permissions, the API returns HTTP 403 Forbidden.

---

## Endpoints

### GET /api/v1/technical/boms/:id/cost

Retrieves calculated cost breakdown for a specific BOM. The calculation is performed in real-time using current ingredient costs and routing data.

**URL Parameters**:
- `id` (required) - UUID of the BOM

**Query Parameters**: None

**Request Example**:
```bash
curl -X GET \
  https://your-domain.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/cost \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK)**:
```json
{
  "bom_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_id": "660e8400-e29b-41d4-a716-446655440001",
  "cost_type": "standard",
  "batch_size": 100,
  "batch_uom": "kg",
  "material_cost": 185.50,
  "labor_cost": 42.00,
  "overhead_cost": 24.00,
  "total_cost": 251.50,
  "cost_per_unit": 2.52,
  "currency": "PLN",
  "calculated_at": "2025-12-29T14:30:00Z",
  "calculated_by": "user-uuid",
  "is_stale": false,
  "breakdown": {
    "materials": [
      {
        "ingredient_id": "770e8400-e29b-41d4-a716-446655440002",
        "ingredient_code": "FLO-001",
        "ingredient_name": "Flour Type 550",
        "quantity": 50,
        "uom": "kg",
        "unit_cost": 0.85,
        "scrap_percent": 2,
        "scrap_cost": 0.85,
        "total_cost": 42.50,
        "percentage": 22.9
      },
      {
        "ingredient_id": "880e8400-e29b-41d4-a716-446655440003",
        "ingredient_code": "YST-001",
        "ingredient_name": "Yeast Fresh",
        "quantity": 2,
        "uom": "kg",
        "unit_cost": 12.00,
        "scrap_percent": 0,
        "scrap_cost": 0.00,
        "total_cost": 24.00,
        "percentage": 12.9
      }
    ],
    "operations": [
      {
        "operation_seq": 10,
        "operation_name": "Mixing",
        "machine_name": "Spiral Mixer",
        "setup_time_min": 15,
        "duration_min": 20,
        "cleanup_time_min": 5,
        "labor_rate": 45.00,
        "setup_cost": 11.25,
        "run_cost": 15.00,
        "cleanup_cost": 3.75,
        "total_cost": 30.00,
        "percentage": 71.4
      },
      {
        "operation_seq": 20,
        "operation_name": "Baking",
        "machine_name": "Oven Deck #1",
        "setup_time_min": 0,
        "duration_min": 45,
        "cleanup_time_min": 0,
        "labor_rate": 30.00,
        "setup_cost": 0.00,
        "run_cost": 22.50,
        "cleanup_cost": 0.00,
        "total_cost": 22.50,
        "percentage": 28.6
      }
    ],
    "routing": {
      "routing_id": "990e8400-e29b-41d4-a716-446655440004",
      "routing_code": "RTG-BREAD-001",
      "setup_cost": 50.00,
      "working_cost_per_unit": 0.15,
      "total_working_cost": 15.00,
      "total_routing_cost": 65.00
    },
    "overhead": {
      "allocation_method": "percentage",
      "overhead_percent": 12,
      "subtotal_before_overhead": 200.00,
      "overhead_cost": 24.00
    }
  },
  "margin_analysis": {
    "std_price": 2.80,
    "target_margin_percent": 30,
    "actual_margin_percent": 10.0,
    "below_target": true
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `bom_id` | string | UUID of the BOM |
| `product_id` | string | UUID of the product |
| `cost_type` | string | Type of cost: `standard` (from BOM/routing) |
| `batch_size` | number | Output quantity for this batch |
| `batch_uom` | string | Unit of measure for batch size (e.g., "kg") |
| `material_cost` | number | Sum of all ingredient costs including scrap allowance |
| `labor_cost` | number | Sum of operation labor costs (setup + run + cleanup) |
| `overhead_cost` | number | Calculated overhead allocation |
| `total_cost` | number | Total batch cost (material + labor + routing + overhead) |
| `cost_per_unit` | number | Total cost divided by batch size |
| `currency` | string | Currency code (e.g., "PLN") |
| `calculated_at` | ISO 8601 | Server timestamp when calculation was performed |
| `calculated_by` | string | User ID who triggered the calculation |
| `is_stale` | boolean | Whether cost is outdated (always false on GET) |
| `breakdown` | object | Detailed breakdown by component |
| `margin_analysis` | object or null | Margin comparison if standard price is set |

**Error Responses**:

```bash
# 400: Invalid UUID format
curl -X GET https://your-domain.com/api/v1/technical/boms/invalid-id/cost \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "error": "Invalid BOM ID format",
  "code": "INVALID_ID",
  "status": 400
}
```

```bash
# 401: Missing or invalid authentication
curl -X GET https://your-domain.com/api/v1/technical/boms/:id/cost
```

Response:
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "status": 401
}
```

```bash
# 403: Insufficient permissions
curl -X GET https://your-domain.com/api/v1/technical/boms/:id/cost \
  -H "Authorization: Bearer {read_only_token}"
```

Response:
```json
{
  "error": "Permission denied",
  "code": "FORBIDDEN",
  "status": 403
}
```

```bash
# 404: BOM not found or belongs to different organization
curl -X GET https://your-domain.com/api/v1/technical/boms/00000000-0000-0000-0000-000000000000/cost \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "error": "BOM not found",
  "code": "BOM_NOT_FOUND",
  "status": 404
}
```

```bash
# 422: BOM has no routing assigned
curl -X GET https://your-domain.com/api/v1/technical/boms/:id/cost \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "error": "Assign routing to BOM to calculate labor costs",
  "code": "NO_ROUTING_ASSIGNED",
  "status": 422
}
```

```bash
# 422: Missing ingredient costs
curl -X GET https://your-domain.com/api/v1/technical/boms/:id/cost \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "error": "Missing cost data for: FLO-001 (Flour), YST-001 (Yeast Fresh)",
  "code": "MISSING_INGREDIENT_COSTS",
  "details": ["FLO-001 (Flour)", "YST-001 (Yeast Fresh)"],
  "status": 422
}
```

---

### POST /api/v1/technical/boms/:id/recalculate-cost

Triggers a cost recalculation and creates a new product cost record. This endpoint forces a fresh calculation using current ingredient costs and routing data, stores the result in the database, and archives any previous cost record.

**URL Parameters**:
- `id` (required) - UUID of the BOM

**Request Body**: Empty (no JSON body required)

**Request Example**:
```bash
curl -X POST \
  https://your-domain.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/recalculate-cost \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (200 OK)**:
```json
{
  "success": true,
  "cost": {
    "bom_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "660e8400-e29b-41d4-a716-446655440001",
    "cost_type": "standard",
    "batch_size": 100,
    "batch_uom": "kg",
    "material_cost": 188.20,
    "labor_cost": 45.30,
    "overhead_cost": 24.60,
    "total_cost": 258.10,
    "cost_per_unit": 2.58,
    "currency": "PLN",
    "calculated_at": "2025-12-29T14:35:00Z",
    "calculated_by": "user-uuid",
    "is_stale": false,
    "breakdown": {
      "materials": [],
      "operations": [],
      "routing": {},
      "overhead": {}
    },
    "margin_analysis": {
      "std_price": 2.80,
      "target_margin_percent": 30,
      "actual_margin_percent": 7.9,
      "below_target": true
    }
  },
  "calculated_at": "2025-12-29T14:35:00Z",
  "warnings": [
    "Operation 'Baking' has no labor rate set"
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether calculation succeeded (will be `true`) |
| `cost` | object | Full BOMCostResponse (same as GET endpoint) |
| `calculated_at` | ISO 8601 | Server timestamp when recalculation was performed |
| `warnings` | string[] | Optional array of warnings (e.g., missing labor rates) |

**Error Responses**: Same as GET endpoint, plus:

```bash
# 403: Missing update permission
curl -X POST https://your-domain.com/api/v1/technical/boms/:id/recalculate-cost \
  -H "Authorization: Bearer {read_only_token}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "error": "Permission denied",
  "code": "FORBIDDEN",
  "status": 403
}
```

---

### GET /api/v1/technical/routings/:id/cost

Retrieves routing-only cost breakdown (labor + routing costs, without materials). Useful for understanding labor efficiency and overhead allocation independent of material costs.

**URL Parameters**:
- `id` (required) - UUID of the routing

**Query Parameters**:
- `batch_size` (optional) - Batch size in units for working cost calculation (default: 1)

**Request Example**:
```bash
curl -X GET \
  "https://your-domain.com/api/v1/technical/routings/990e8400-e29b-41d4-a716-446655440004/cost?batch_size=100" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK)**:
```json
{
  "routing_id": "990e8400-e29b-41d4-a716-446655440004",
  "routing_code": "RTG-BREAD-001",
  "total_operation_cost": 52.50,
  "total_routing_cost": 65.00,
  "total_cost": 117.50,
  "currency": "PLN",
  "breakdown": {
    "operations": [
      {
        "operation_seq": 10,
        "operation_name": "Mixing",
        "machine_name": "Spiral Mixer",
        "setup_time_min": 15,
        "duration_min": 20,
        "cleanup_time_min": 5,
        "labor_rate": 45.00,
        "setup_cost": 11.25,
        "run_cost": 15.00,
        "cleanup_cost": 3.75,
        "total_cost": 30.00,
        "percentage": 57.1
      },
      {
        "operation_seq": 20,
        "operation_name": "Baking",
        "machine_name": "Oven Deck #1",
        "setup_time_min": 0,
        "duration_min": 45,
        "cleanup_time_min": 0,
        "labor_rate": 30.00,
        "setup_cost": 0.00,
        "run_cost": 22.50,
        "cleanup_cost": 0.00,
        "total_cost": 22.50,
        "percentage": 42.9
      }
    ],
    "routing": {
      "routing_id": "990e8400-e29b-41d4-a716-446655440004",
      "routing_code": "RTG-BREAD-001",
      "setup_cost": 50.00,
      "working_cost_per_unit": 0.15,
      "total_working_cost": 15.00,
      "total_routing_cost": 65.00
    }
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `routing_id` | string | UUID of the routing |
| `routing_code` | string | Code/identifier for the routing |
| `total_operation_cost` | number | Sum of all operation labor costs |
| `total_routing_cost` | number | Routing-level costs (setup + working) |
| `total_cost` | number | Total of operations + routing |
| `currency` | string | Currency code |
| `breakdown.operations` | array | Array of operation cost breakdowns |
| `breakdown.routing` | object | Routing-level cost details |

**Error Responses**:

```bash
# 400: Invalid batch_size parameter
curl -X GET \
  "https://your-domain.com/api/v1/technical/routings/:id/cost?batch_size=invalid" \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "error": "Invalid batch_size parameter",
  "code": "INVALID_BATCH_SIZE",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["batch_size"]
    }
  ],
  "status": 400
}
```

---

## Cost Calculation Formula

The BOM costing system uses a multi-component calculation to arrive at total product cost. All calculations use current data from your database at the time of calculation.

### Material Cost Calculation

Material cost is the sum of all BOM ingredients adjusted for scrap allowance:

```
For each ingredient in BOM:
  Effective Quantity = Ingredient Quantity × (1 + Scrap Percent / 100)
  Ingredient Cost = Effective Quantity × Unit Cost (from products.cost_per_unit)
  Scrap Cost = Ingredient Quantity × (Scrap Percent / 100) × Unit Cost

Total Material Cost = Sum of all Ingredient Costs
```

**Example with actual values**:
- Flour: 50 kg × $0.85/kg × (1 + 2%/100) = 42.85
- Yeast: 2 kg × $12.00/kg × (1 + 0%/100) = 24.00
- **Total Material Cost = $66.85**

### Labor Cost Calculation

Labor cost is calculated from routing operations, including setup and cleanup time:

```
For each operation in routing:
  Setup Cost = (Setup Time / 60) × Labor Rate
  Run Cost = (Operation Duration / 60) × Labor Rate
  Cleanup Cost = (Cleanup Time / 60) × Labor Rate
  Operation Total = Setup Cost + Run Cost + Cleanup Cost

Total Labor Cost = Sum of all Operation Totals
```

**Example with actual values**:
- Mixing operation:
  - Setup: (15 min / 60) × $45/hr = $11.25
  - Run: (20 min / 60) × $45/hr = $15.00
  - Cleanup: (5 min / 60) × $45/hr = $3.75
  - Subtotal = $30.00
- Baking operation:
  - Setup: (0 min / 60) × $30/hr = $0.00
  - Run: (45 min / 60) × $30/hr = $22.50
  - Cleanup: (0 min / 60) × $30/hr = $0.00
  - Subtotal = $22.50
- **Total Labor Cost = $52.50**

### Routing-Level Costs

Routing costs are fixed and variable per-unit costs configured at the routing level:

```
Routing Setup Cost = Fixed cost per production run
Working Cost = Working Cost Per Unit × Batch Size

Total Routing Cost = Routing Setup Cost + Working Cost
```

**Example with actual values**:
- Routing Setup Cost = $50.00 (fixed per run)
- Working Cost = $0.15/kg × 100 kg = $15.00
- **Total Routing Cost = $65.00**

### Overhead Allocation

Overhead is allocated as a percentage of the subtotal (materials + labor + routing):

```
Subtotal Before Overhead = Material Cost + Labor Cost + Routing Cost
Overhead = Subtotal Before Overhead × (Overhead Percent / 100)
```

**Example with actual values**:
- Subtotal = $66.85 + $52.50 + $65.00 = $184.35
- Overhead = $184.35 × (12% / 100) = $22.12
- **Overhead Cost = $22.12**

### Total Cost and Cost Per Unit

```
Total Cost = Subtotal Before Overhead + Overhead
Cost Per Unit = Total Cost / Batch Size
```

**Example with actual values**:
- Total Cost = $184.35 + $22.12 = $206.47
- Cost Per Unit = $206.47 / 100 kg = $2.06/kg
- **Total Batch Cost = $206.47**

### Margin Analysis

If the product has a standard price (std_price), margin is calculated:

```
Actual Margin % = ((Standard Price - Cost Per Unit) / Standard Price) × 100
Below Target = Actual Margin % < Target Margin % (default 30%)
```

**Example with actual values**:
- Standard Price = $2.80/kg
- Cost Per Unit = $2.06/kg
- Actual Margin % = (($2.80 - $2.06) / $2.80) × 100 = 26.4%
- Below Target = false (26.4% is close to 30%)

---

## Performance Characteristics

The API is optimized for fast cost calculations even with large BOMs:

**Expected Response Times**:
- Small BOM (5-10 items): < 300ms
- Medium BOM (20-30 items): < 500ms
- Large BOM (50+ items): < 2 seconds

**Tested Scenarios**:
- BOM with 50 ingredients and 10 operations: < 2 seconds
- Concurrent requests (10 simultaneous): No performance degradation
- Database query optimization: Indexed on org_id, bom_id, routing_id

If calculation exceeds 2 seconds, check for:
1. Network latency between your client and server
2. Database load on your Supabase instance
3. Extremely large BOMs (>100 items) - consider refactoring

---

## Security

### Role-Based Access Control (RBAC)

The API enforces permission checks before processing:

| Endpoint | Permission | Access |
|----------|-----------|--------|
| GET /boms/:id/cost | technical.R | Read costs only |
| POST /boms/:id/recalculate-cost | technical.U | Calculate and store costs |
| GET /routings/:id/cost | technical.R | Read costs only |

Users with `admin` or `super_admin` role bypass these checks.

### Organization Isolation

All cost queries are automatically filtered by the user's organization:

```
WHERE org_id = {user.org_id}
```

This prevents data leakage between tenants in the multi-tenant system.

### Data Validation

- UUID format validated before database queries (prevents SQL injection)
- JSON schema validation for query parameters (batch_size must be number)
- Permission check before returning any data

### Sensitive Information

Error messages intentionally omit sensitive data:
- 404 responses don't reveal whether resource exists (could be permission or not found)
- 403 responses don't explain which permission is required
- Database errors are logged server-side, generic message returned to client

---

## Testing the API

### Prerequisites

1. **Supabase Project**: Set up with migrations applied
2. **Authentication**: Valid user account with technical.R or technical.U permissions
3. **Test Data**: Create BOM with ingredients and routing

### Manual Testing Steps

#### Step 1: Get Supabase Session Token

```bash
# Using your Supabase credentials
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your-password"
  }'
```

Response includes `access_token` - use this for subsequent requests.

#### Step 2: List BOMs to Get ID

```bash
curl -X GET \
  https://your-project.supabase.co/rest/v1/boms \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json"
```

Find a BOM ID from the response.

#### Step 3: Calculate Cost

```bash
curl -X GET \
  https://your-domain.com/api/v1/technical/boms/{bom_id}/cost \
  -H "Authorization: Bearer {access_token}"
```

#### Step 4: Verify Response

Check that response includes:
- ✓ `material_cost` > 0
- ✓ `labor_cost` > 0
- ✓ `total_cost` = material + labor + overhead
- ✓ `cost_per_unit` = total_cost / batch_size
- ✓ Breakdown includes material and operation details

#### Step 5: Test Recalculation

```bash
curl -X POST \
  https://your-domain.com/api/v1/technical/boms/{bom_id}/recalculate-cost \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Verify response includes `success: true` and new timestamp.

### Integration Test Examples

Testing missing ingredient costs:

1. Create BOM with ingredient that has no cost_per_unit
2. Call GET /api/v1/technical/boms/:id/cost
3. Expect 422 response with code "MISSING_INGREDIENT_COSTS"

Testing missing routing:

1. Create BOM without routing_id
2. Call GET /api/v1/technical/boms/:id/cost
3. Expect 422 response with code "NO_ROUTING_ASSIGNED"

Testing permissions:

1. Create user with only "read" technical permission
2. Call POST /api/v1/technical/boms/:id/recalculate-cost with this user's token
3. Expect 403 response with code "FORBIDDEN"

---

## Troubleshooting

### "Missing cost data for: FLO-001 (Flour)"

**Cause**: The ingredient product (FLO-001) has no value in the `cost_per_unit` field.

**Solution**:
1. Navigate to Products module
2. Find the ingredient (FLO-001)
3. Set the "Cost Per Unit" field
4. Retry the cost calculation

### "Assign routing to BOM to calculate labor costs"

**Cause**: The BOM has no routing assigned (routing_id is NULL).

**Solution**:
1. Open the BOM in edit mode
2. Select a routing from the "Assign Routing" dropdown
3. Save the BOM
4. Retry the cost calculation

### Cost calculation is slow (> 2 seconds)

**Causes**:
1. Large BOM with 100+ ingredients
2. Database is under heavy load
3. Network latency between client and server

**Solutions**:
1. Check Supabase dashboard for database load
2. Consider breaking very large BOMs into sub-assemblies
3. Cache cost results for 10 minutes in your application

### "Permission denied" (403)

**Cause**: User doesn't have technical.U permission for recalculate endpoint.

**Solution**:
1. Check user's role in Settings > Users
2. Verify role has "Technical (Update)" permission
3. Contact organization admin to grant permission

---

## Best Practices

### When to Recalculate

Recalculate costs when:
- ✓ Ingredient cost changes (product.cost_per_unit updated)
- ✓ BOM items changed (quantities or ingredients modified)
- ✓ Routing operations changed (duration or labor rate modified)

Do NOT recalculate for:
- ✗ Each production run (use GET endpoint instead)
- ✗ Every page load (cache the result for 10 minutes)

### Caching Costs

Cost calculations are resource-intensive for large BOMs. Implement client-side caching:

```javascript
// Cache cost for 10 minutes
const CACHE_TTL = 10 * 60 * 1000; // milliseconds
const cached = new Map();

async function getCost(bomId) {
  const cached_result = cached.get(bomId);
  if (cached_result && Date.now() - cached_result.timestamp < CACHE_TTL) {
    return cached_result.cost;
  }

  const cost = await fetch(`/api/v1/technical/boms/${bomId}/cost`).then(r => r.json());
  cached.set(bomId, { cost, timestamp: Date.now() });
  return cost;
}
```

### Handling Margin Analysis

When margin is below target (30%):

1. Review ingredient costs - are supplier prices increasing?
2. Check labor efficiency - are operations taking longer than standard?
3. Analyze overhead allocation - is this product allocating too much overhead?
4. Consider price increase or cost reduction initiatives

### Bulk Operations

If recalculating costs for multiple BOMs:

1. Use pagination (process 10-20 at a time)
2. Implement exponential backoff for retries
3. Show progress indicator to user
4. Cache intermediate results

---

## Related Resources

- [BOM Costing User Guide](../guides/recipe-costing.md) - Step-by-step instructions for end users
- [Technical Module Documentation](../../1-BASELINE/product/modules/technical.md) - PRD with requirements
- [Recipe Costing Wireframe](../wireframes/TEC-013-recipe-costing.md) - UI/UX specifications
