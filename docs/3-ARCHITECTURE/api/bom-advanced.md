# BOM Advanced Features API Documentation

**Story:** 02.14 - BOM Advanced Features: Version Comparison, Yield & Scaling
**Status:** Production Ready
**Last Updated:** 2025-12-29
**API Version:** 1.0

---

## Overview

The BOM Advanced Features API provides four powerful endpoints for managing Bill of Materials (BOM) versions, analyzing production efficiency through yield calculations, and scaling batch sizes. These endpoints enable manufacturers to compare recipe versions, understand material requirements across production levels, and adjust batch sizes with automatic quantity scaling.

**Key Features:**
- Compare two BOM versions side-by-side with diff highlighting
- Explode multi-level BOMs to see all raw materials and sub-components
- Scale batch sizes with automatic quantity calculation
- Analyze and configure yield percentages

---

## Authentication & Authorization

All endpoints require authentication via JWT bearer token and respect role-based access control:

```bash
# Include JWT token in Authorization header
Authorization: Bearer <your_jwt_token>
```

**Required Roles:**
- **Read Operations** (GET): `admin`, `production_manager`, `planner`, `viewer`
- **Write Operations** (POST/PUT): `admin`, `production_manager`, `technical`

**Security:**
- All endpoints enforce Row-Level Security (RLS) - cross-tenant access returns 404
- Missing or invalid tokens return 401 Unauthorized
- Insufficient permissions return 403 Forbidden
- All responses omit sensitive org_id information

---

## Endpoints

### 1. Compare BOM Versions

Compare two BOM versions side-by-side to see what ingredients changed.

**Request**

```http
GET /api/technical/boms/:id/compare/:compareId
Authorization: Bearer <jwt_token>
```

**Parameters**

| Name | Location | Type | Description | Required |
|------|----------|------|-------------|----------|
| `id` | URL | UUID | First BOM ID (base version) | Yes |
| `compareId` | URL | UUID | Second BOM ID (comparison version) | Yes |

**Example Request**

```bash
curl -X GET "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/compare/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**

```json
{
  "bom_1": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0",
    "effective_from": "2025-01-01",
    "effective_to": null,
    "output_qty": 100,
    "output_uom": "kg",
    "status": "active",
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "component_id": "550e8400-e29b-41d4-a716-446655440100",
        "component_code": "FLOUR-001",
        "component_name": "All-Purpose Flour",
        "quantity": 50,
        "uom": "kg",
        "sequence": 1,
        "operation_seq": null,
        "scrap_percent": 0,
        "is_output": false
      }
    ]
  },
  "bom_2": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "version": "1.1",
    "effective_from": "2025-06-01",
    "effective_to": null,
    "output_qty": 100,
    "output_uom": "kg",
    "status": "active",
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "component_id": "550e8400-e29b-41d4-a716-446655440100",
        "component_code": "FLOUR-001",
        "component_name": "All-Purpose Flour",
        "quantity": 52,
        "uom": "kg",
        "sequence": 1,
        "operation_seq": null,
        "scrap_percent": 0,
        "is_output": false
      }
    ]
  },
  "differences": {
    "added": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "component_id": "550e8400-e29b-41d4-a716-446655440200",
        "component_code": "SALT-001",
        "component_name": "Kosher Salt",
        "quantity": 1.5,
        "uom": "kg",
        "sequence": 3,
        "operation_seq": null,
        "scrap_percent": 0,
        "is_output": false
      }
    ],
    "removed": [],
    "modified": [
      {
        "item_id": "550e8400-e29b-41d4-a716-446655440010",
        "component_id": "550e8400-e29b-41d4-a716-446655440100",
        "component_code": "FLOUR-001",
        "component_name": "All-Purpose Flour",
        "field": "quantity",
        "old_value": 50,
        "new_value": 52,
        "change_percent": 4.0
      }
    ]
  },
  "summary": {
    "total_items_v1": 3,
    "total_items_v2": 4,
    "total_added": 1,
    "total_removed": 0,
    "total_modified": 1,
    "weight_change_kg": 3.5,
    "weight_change_percent": 3.5
  }
}
```

**Status Codes**

| Code | Error | Reason |
|------|-------|--------|
| 200 | - | Comparison successful |
| 400 | `SAME_VERSION` | Cannot compare BOM to itself |
| 400 | `DIFFERENT_PRODUCTS` | Versions must be from the same product |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 404 | `BOM_NOT_FOUND` | BOM doesn't exist or belongs to different organization |

**Error Examples**

```bash
# Comparing same version
curl -X GET "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/compare/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer ..."

# Response (400)
{
  "error": "Cannot compare version to itself",
  "code": "SAME_VERSION"
}
```

---

### 2. Explode Multi-Level BOM

Get a recursive explosion of a BOM showing all raw materials and sub-components across multiple production levels.

**Request**

```http
GET /api/technical/boms/:id/explosion
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parameters**

| Name | Location | Type | Default | Description | Required |
|------|----------|------|---------|-------------|----------|
| `id` | URL | UUID | - | BOM ID to explode | Yes |
| `maxDepth` | Query | Integer | 10 | Maximum nesting depth (1-10) | No |
| `includeQuantities` | Query | Boolean | true | Include calculated quantities | No |

**Example Request**

```bash
curl -X GET "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/explosion?maxDepth=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**

```json
{
  "bom_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_code": "BREAD-001",
  "product_name": "Whole Wheat Bread",
  "output_qty": 100,
  "output_uom": "kg",
  "levels": [
    {
      "level": 1,
      "items": [
        {
          "item_id": "550e8400-e29b-41d4-a716-446655440010",
          "component_id": "550e8400-e29b-41d4-a716-446655440100",
          "component_code": "FLOUR-WHEAT",
          "component_name": "Whole Wheat Flour",
          "component_type": "raw",
          "quantity": 70,
          "cumulative_qty": 70,
          "uom": "kg",
          "scrap_percent": 0,
          "has_sub_bom": false,
          "path": ["550e8400-e29b-41d4-a716-446655440100"]
        },
        {
          "item_id": "550e8400-e29b-41d4-a716-446655440011",
          "component_id": "550e8400-e29b-41d4-a716-446655440101",
          "component_code": "DOUGH-BASE",
          "component_name": "Basic Dough Mix",
          "component_type": "wip",
          "quantity": 25,
          "cumulative_qty": 25,
          "uom": "kg",
          "scrap_percent": 2,
          "has_sub_bom": true,
          "path": ["550e8400-e29b-41d4-a716-446655440101"]
        }
      ]
    },
    {
      "level": 2,
      "items": [
        {
          "item_id": "550e8400-e29b-41d4-a716-446655440012",
          "component_id": "550e8400-e29b-41d4-a716-446655440102",
          "component_code": "WATER",
          "component_name": "Filtered Water",
          "component_type": "raw",
          "quantity": 15,
          "cumulative_qty": 15,
          "uom": "liters",
          "scrap_percent": 0,
          "has_sub_bom": false,
          "path": ["550e8400-e29b-41d4-a716-446655440101", "550e8400-e29b-41d4-a716-446655440102"]
        }
      ]
    }
  ],
  "total_levels": 2,
  "total_items": 3,
  "raw_materials_summary": [
    {
      "component_id": "550e8400-e29b-41d4-a716-446655440100",
      "component_code": "FLOUR-WHEAT",
      "component_name": "Whole Wheat Flour",
      "total_qty": 70,
      "uom": "kg"
    },
    {
      "component_id": "550e8400-e29b-41d4-a716-446655440102",
      "component_code": "WATER",
      "component_name": "Filtered Water",
      "total_qty": 15,
      "uom": "liters"
    }
  ]
}
```

**Status Codes**

| Code | Error | Reason |
|------|-------|--------|
| 200 | - | Explosion successful |
| 400 | - | Invalid query parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 404 | `BOM_NOT_FOUND` | BOM doesn't exist |
| 422 | `CIRCULAR_REFERENCE` | Circular BOM reference detected |

**Error Examples**

```bash
# Circular reference detected
curl -X GET "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/explosion" \
  -H "Authorization: Bearer ..."

# Response (422)
{
  "error": "Circular BOM reference detected",
  "code": "CIRCULAR_REFERENCE"
}
```

---

### 3. Scale BOM

Scale a BOM to a new batch size with automatic quantity calculation for all ingredients.

**Request**

```http
POST /api/technical/boms/:id/scale
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parameters**

| Name | Location | Type | Default | Description | Required |
|------|----------|------|---------|-------------|----------|
| `id` | URL | UUID | - | BOM ID to scale | Yes |
| `target_batch_size` | Body | Number | - | New output quantity | Conditional* |
| `target_uom` | Body | String | Original UOM | Unit of measurement for target | No |
| `scale_factor` | Body | Number | - | Direct multiplier (alternative to target_batch_size) | Conditional* |
| `preview_only` | Body | Boolean | true | If true, don't save changes | No |
| `round_decimals` | Body | Integer | 3 | Decimal places for rounding (0-6) | No |

*Either `target_batch_size` or `scale_factor` must be provided.

**Example Request**

```bash
curl -X POST "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/scale" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "target_batch_size": 150,
    "round_decimals": 3,
    "preview_only": true
  }'
```

**Response**

```json
{
  "original_batch_size": 100,
  "new_batch_size": 150,
  "scale_factor": 1.5,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "component_code": "FLOUR-001",
      "component_name": "All-Purpose Flour",
      "original_quantity": 50,
      "new_quantity": 75.0,
      "uom": "kg",
      "rounded": false
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "component_code": "YEAST-001",
      "component_name": "Active Dry Yeast",
      "original_quantity": 0.005,
      "new_quantity": 0.008,
      "uom": "kg",
      "rounded": true
    }
  ],
  "warnings": [
    "Active Dry Yeast rounded from 0.0075 to 0.008"
  ],
  "applied": false
}
```

**Status Codes**

| Code | Error | Reason |
|------|-------|--------|
| 200 | - | Scaling successful (preview or applied) |
| 400 | `INVALID_SCALE` | Batch size or factor must be positive |
| 400 | `MISSING_SCALE_PARAM` | Either target_batch_size or scale_factor required |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | Cannot modify BOM (insufficient permissions) |
| 404 | `BOM_NOT_FOUND` | BOM doesn't exist |

**Error Examples**

```bash
# Missing required parameter
curl -X POST "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/scale" \
  -H "Authorization: Bearer ..." \
  -d '{
    "preview_only": true
  }'

# Response (400)
{
  "error": "Either target_batch_size or scale_factor required",
  "code": "MISSING_SCALE_PARAM"
}
```

---

### 4. Get BOM Yield Analysis

Retrieve yield analysis for a BOM showing theoretical yield, expected yield, and loss factors.

**Request**

```http
GET /api/technical/boms/:id/yield
Authorization: Bearer <jwt_token>
```

**Parameters**

| Name | Location | Type | Description | Required |
|------|----------|------|-------------|----------|
| `id` | URL | UUID | BOM ID | Yes |
| `quantity` | Query | Number | Legacy: Planned quantity for calculation | No |

**Example Request**

```bash
curl -X GET "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/yield" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**

```json
{
  "bom_id": "550e8400-e29b-41d4-a716-446655440000",
  "theoretical_yield_percent": 95,
  "expected_yield_percent": 94,
  "input_total_kg": 500,
  "output_qty_kg": 475,
  "loss_factors": [
    {
      "type": "trim",
      "description": "Trimming and preparation",
      "loss_percent": 3
    },
    {
      "type": "moisture",
      "description": "Moisture loss during baking",
      "loss_percent": 2
    }
  ],
  "actual_yield_avg": null,
  "variance_from_expected": 1,
  "variance_warning": false
}
```

**Status Codes**

| Code | Error | Reason |
|------|-------|--------|
| 200 | - | Yield data retrieved |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 404 | `BOM_NOT_FOUND` | BOM doesn't exist |

---

### 5. Update BOM Yield Configuration

Configure expected yield percentage and variance threshold.

**Request**

```http
PUT /api/technical/boms/:id/yield
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parameters**

| Name | Location | Type | Default | Description | Required |
|------|----------|------|---------|-------------|----------|
| `id` | URL | UUID | - | BOM ID | Yes |
| `expected_yield_percent` | Body | Number | - | Target yield percentage (0-100) | Yes |
| `variance_threshold_percent` | Body | Number | 5 | Warning threshold (0-100) | No |

**Example Request**

```bash
curl -X PUT "https://app.monopilot.io/api/technical/boms/550e8400-e29b-41d4-a716-446655440000/yield" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "expected_yield_percent": 93,
    "variance_threshold_percent": 3
  }'
```

**Response**

Same as GET /api/technical/boms/:id/yield

**Status Codes**

| Code | Error | Reason |
|------|-------|--------|
| 200 | - | Yield configuration updated |
| 400 | `INVALID_YIELD` | Yield must be between 0 and 100 |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | Cannot modify BOM (insufficient permissions) |
| 404 | `BOM_NOT_FOUND` | BOM doesn't exist |

---

## Type Definitions

### BomComparisonResponse

```typescript
interface BomComparisonResponse {
  bom_1: BomVersion
  bom_2: BomVersion
  differences: {
    added: BomItemSummary[]
    removed: BomItemSummary[]
    modified: ModifiedItem[]
  }
  summary: {
    total_items_v1: number
    total_items_v2: number
    total_added: number
    total_removed: number
    total_modified: number
    weight_change_kg: number
    weight_change_percent: number
  }
}

interface BomVersion {
  id: string
  version: string
  effective_from: string // ISO date
  effective_to: string | null
  output_qty: number
  output_uom: string
  status: string
  items: BomItemSummary[]
}

interface BomItemSummary {
  id: string
  component_id: string
  component_code: string
  component_name: string
  quantity: number
  uom: string
  sequence: number
  operation_seq: number | null
  scrap_percent: number
  is_output: boolean
}

interface ModifiedItem {
  item_id: string
  component_id: string
  component_code: string
  component_name: string
  field: 'quantity' | 'uom' | 'scrap_percent' | 'sequence'
  old_value: string | number
  new_value: string | number
  change_percent: number | null
}
```

### BomExplosionResponse

```typescript
interface BomExplosionResponse {
  bom_id: string
  product_code: string
  product_name: string
  output_qty: number
  output_uom: string
  levels: ExplosionLevel[]
  total_levels: number
  total_items: number
  raw_materials_summary: RawMaterialSummary[]
}

interface ExplosionLevel {
  level: number
  items: ExplosionItem[]
}

interface ExplosionItem {
  item_id: string
  component_id: string
  component_code: string
  component_name: string
  component_type: 'raw' | 'wip' | 'finished' | 'packaging'
  quantity: number
  cumulative_qty: number
  uom: string
  scrap_percent: number
  has_sub_bom: boolean
  path: string[]
}

interface RawMaterialSummary {
  component_id: string
  component_code: string
  component_name: string
  total_qty: number
  uom: string
}
```

### ScaleBomResponse

```typescript
interface ScaleBomResponse {
  original_batch_size: number
  new_batch_size: number
  scale_factor: number
  items: ScaledItem[]
  warnings: string[]
  applied: boolean
}

interface ScaledItem {
  id: string
  component_code: string
  component_name: string
  original_quantity: number
  new_quantity: number
  uom: string
  rounded: boolean
}
```

### BomYieldResponse

```typescript
interface BomYieldResponse {
  bom_id: string
  theoretical_yield_percent: number
  expected_yield_percent: number | null
  input_total_kg: number
  output_qty_kg: number
  loss_factors: LossFactor[]
  actual_yield_avg: number | null
  variance_from_expected: number | null
  variance_warning: boolean
}

interface LossFactor {
  type: 'moisture' | 'trim' | 'process' | 'custom'
  description: string
  loss_percent: number
}
```

---

## Common Patterns

### Handling Rounding in Scale Operations

When scaling quantities, small values may require rounding. The API returns warnings and a `rounded` flag for each item:

```json
{
  "items": [
    {
      "component_code": "YEAST-001",
      "original_quantity": 0.005,
      "new_quantity": 0.008,
      "rounded": true
    }
  ],
  "warnings": ["Active Dry Yeast rounded from 0.0075 to 0.008"]
}
```

Always check the `warnings` array and `rounded` flags when displaying scaling results to users.

### Circular Reference Detection

The explosion endpoint automatically detects and prevents circular references. A circular reference occurs when:
- A component references itself
- Components form a cycle (A contains B, B contains A)
- Long chains form loops

All are detected using path tracking in the recursive query.

### Preview vs Apply Pattern

The scale endpoint supports preview mode by default (`preview_only: true`). This allows users to see scaled quantities before saving:

```bash
# Preview scaling (no database changes)
curl -X POST ".../scale" -d '{"target_batch_size": 150, "preview_only": true}'

# Apply scaling (save to database)
curl -X POST ".../scale" -d '{"target_batch_size": 150, "preview_only": false}'
```

---

## Rate Limiting

No explicit rate limits on these endpoints. However, complexity-based limits apply:
- BOM explosion limited to max 10 levels (configurable)
- Explosion queries abort after 1 second
- Maximum 1000 nodes returned per explosion

---

## Performance Considerations

1. **Explosion endpoint**: Uses recursive CTE with hard limits. Max 10 levels protects against performance degradation on deeply nested BOMs.

2. **Comparison endpoint**: Linear time complexity O(n) where n is total items. Suitable for BOMs with up to 1000 items.

3. **Scaling endpoint**: Linear time complexity. Preview mode is instant (no DB writes).

4. **Yield calculation**: Constant time. Computed from BOM structure.

---

## Testing Your Integration

### Using cURL

```bash
# 1. Get BOM ID first
BOM_ID="550e8400-e29b-41d4-a716-446655440000"

# 2. Test comparison
curl -X GET "https://app.monopilot.io/api/technical/boms/$BOM_ID/compare/$BOM_ID" \
  -H "Authorization: Bearer $TOKEN"

# 3. Test explosion
curl -X GET "https://app.monopilot.io/api/technical/boms/$BOM_ID/explosion?maxDepth=5" \
  -H "Authorization: Bearer $TOKEN"

# 4. Test scaling (preview)
curl -X POST "https://app.monopilot.io/api/technical/boms/$BOM_ID/scale" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_batch_size": 150, "preview_only": true}'

# 5. Test yield
curl -X GET "https://app.monopilot.io/api/technical/boms/$BOM_ID/yield" \
  -H "Authorization: Bearer $TOKEN"
```

### Using Node.js/TypeScript

```typescript
import fetch from 'node-fetch'

const API_BASE = 'https://app.monopilot.io/api/technical/boms'
const token = 'your_jwt_token'

async function compareBOMs(id1: string, id2: string) {
  const response = await fetch(`${API_BASE}/${id1}/compare/${id2}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

async function scaleBOM(id: string, newSize: number) {
  const response = await fetch(`${API_BASE}/${id}/scale`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      target_batch_size: newSize,
      preview_only: true
    })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}
```

---

## Support & Troubleshooting

**404 on valid BOM ID?**
- Check organization ownership. Cross-tenant access always returns 404.
- Verify BOM status is not 'archived'.

**Circular reference error on explosion?**
- Check your BOM structure for cycles. Run validation on components.
- Typically caused by: A contains B, B contains A.

**Rounding warnings on scale?**
- Expected for small quantities with high scale factors.
- Review warnings and adjust rounding decimals if needed.

**No yield data returned?**
- Ensure BOM has items with quantities and weights.
- Yield is calculated from input/output ratio.

---

## Changelog

### Version 1.0 (2025-12-29)
- Initial release with 4 endpoints (compare, explosion, scale, yield)
- Full RLS security
- 300+ automated tests
- Production ready
