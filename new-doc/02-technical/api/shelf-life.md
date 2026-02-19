# Shelf Life API Documentation

**Module**: Technical
**Feature**: Shelf Life Calculation + Expiry Management (Story 02.11)
**Last Updated**: 2025-12-28
**Status**: Complete - All 7 Endpoints Tested

---

## Overview

The Shelf Life API manages product shelf life configuration, automatic calculation from Bill of Materials (BOM) ingredients, manual overrides with audit logging, and shipment eligibility checking based on remaining shelf life. All operations enforce multi-tenancy through org_id RLS policies.

### Key Concepts

- **Calculated Shelf Life**: Auto-calculated as minimum of ingredient shelf lives, minus processing impact and safety buffer
- **Override**: Manual adjustment with mandatory reason for audit trail
- **Final Shelf Life**: Either calculated or override value (override takes precedence)
- **FEFO**: First Expired, First Out - picking strategy that respects expiry dates
- **Storage Conditions**: Temperature, humidity, and special handling requirements
- **Audit Trail**: All changes logged with user, timestamp, old/new values, and reason

### Formula

```
calculated_days = MAX(1, MIN(ingredient_shelf_lives) - processing_impact_days - CEIL(shortest_shelf_life * safety_buffer_percent / 100))
```

---

## Authentication & Authorization

**All endpoints require**:
- Valid JWT token in `Authorization: Bearer <token>` header
- User organization membership (verified via RLS)
- Appropriate role for write operations

**Role Requirements**:
- `GET` endpoints: Any authenticated user
- `POST`/`PUT` endpoints: `admin`, `production_manager`, or `quality_manager`

---

## API Endpoints

### 1. Get Product Shelf Life Configuration

**Endpoint**: `GET /api/v1/technical/shelf-life/products/:id`

**Description**: Retrieves complete shelf life configuration for a product, including calculated values, BOM ingredients, and current settings.

**Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Response** (200 OK):
```typescript
{
  product_id: string
  product_code: string
  product_name: string
  bom_version: string | null
  bom_effective_date: string | null
  calculated_days: number | null
  calculation_method: 'auto_min_ingredients' | 'manual'
  shortest_ingredient_id: string | null
  shortest_ingredient_name: string | null
  shortest_ingredient_days: number | null
  processing_impact_days: number
  safety_buffer_percent: number
  safety_buffer_days: number
  override_days: number | null
  override_reason: string | null
  final_days: number
  storage_temp_min: number | null
  storage_temp_max: number | null
  storage_humidity_min: number | null
  storage_humidity_max: number | null
  storage_conditions: Array<{
    condition: string
    enabled: boolean
  }>
  storage_instructions: string | null
  shelf_life_mode: 'fixed' | 'rolling'
  label_format: 'best_before_day' | 'best_before_month' | 'use_by'
  picking_strategy: 'FIFO' | 'FEFO'
  min_remaining_for_shipment: number | null
  enforcement_level: 'suggest' | 'warn' | 'block'
  expiry_warning_days: number
  expiry_critical_days: number
  needs_recalculation: boolean
  calculated_at: string | null  // ISO 8601
  updated_at: string  // ISO 8601
  updated_by: string | null
  ingredients: Array<{
    id: string
    code: string
    name: string
    shelf_life_days: number | null
    shelf_life_source: string | null
    supplier_name: string | null
    specification_reference: string | null
    storage_temp_min: number | null
    storage_temp_max: number | null
    storage_humidity_min: number | null
    storage_humidity_max: number | null
    storage_conditions: string[]
    min_acceptable_on_receipt: number | null
    quarantine_required: boolean
    quarantine_duration_days: number | null
  }>
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | User not authenticated or org context missing |
| 404 | PRODUCT_NOT_FOUND | Product does not exist in user's org |

**Example Request**:
```bash
curl -X GET "https://api.monopilot.local/api/v1/technical/shelf-life/products/prod-123" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "product_id": "prod-123",
  "product_code": "BREAD-001",
  "product_name": "Bread Loaf White",
  "bom_version": "2.1",
  "bom_effective_date": "2024-01-15",
  "calculated_days": 10,
  "calculation_method": "auto_min_ingredients",
  "shortest_ingredient_id": "ing-456",
  "shortest_ingredient_name": "Yeast Fresh",
  "shortest_ingredient_days": 14,
  "processing_impact_days": 2,
  "safety_buffer_percent": 20,
  "safety_buffer_days": 2,
  "override_days": null,
  "override_reason": null,
  "final_days": 10,
  "storage_temp_min": 18,
  "storage_temp_max": 25,
  "storage_humidity_min": 40,
  "storage_humidity_max": 60,
  "storage_conditions": [
    { "condition": "original_packaging", "enabled": true },
    { "condition": "protect_sunlight", "enabled": true }
  ],
  "storage_instructions": "Store in cool, dry place away from direct sunlight.",
  "shelf_life_mode": "fixed",
  "label_format": "best_before_day",
  "picking_strategy": "FEFO",
  "min_remaining_for_shipment": 5,
  "enforcement_level": "warn",
  "expiry_warning_days": 7,
  "expiry_critical_days": 3,
  "needs_recalculation": false,
  "calculated_at": "2024-12-20T10:30:00Z",
  "updated_at": "2024-12-20T10:30:00Z",
  "updated_by": "user-789",
  "ingredients": [
    {
      "id": "ing-456",
      "code": "YEAST-001",
      "name": "Yeast Fresh",
      "shelf_life_days": 14,
      "shelf_life_source": "supplier",
      "supplier_name": "BioYeast Ltd.",
      "storage_temp_min": 2,
      "storage_temp_max": 8,
      "quarantine_required": false
    }
  ]
}
```

---

### 2. Calculate Shelf Life from BOM

**Endpoint**: `POST /api/v1/technical/shelf-life/products/:id/calculate`

**Description**: Calculates shelf life from BOM ingredients using the minimum ingredient rule. Requires an active BOM and all ingredients must have shelf life defined.

**Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Request Body**:
```typescript
{
  force?: boolean  // Force recalculation even if cached (default: false)
}
```

**Response** (200 OK):
```typescript
{
  calculated_days: number
  shortest_ingredient_id: string
  shortest_ingredient_name: string
  shortest_ingredient_days: number
  processing_impact_days: number
  safety_buffer_percent: number
  safety_buffer_days: number
  ingredients_analyzed: number
  missing_shelf_life: string[]
  calculation_timestamp: string  // ISO 8601
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | NO_ACTIVE_BOM | No active BOM found. Set shelf life manually or create BOM first. |
| 400 | MISSING_INGREDIENT_SHELF_LIFE | Missing shelf life for ingredient: {name} |
| 401 | UNAUTHORIZED | User not authenticated |
| 404 | PRODUCT_NOT_FOUND | Product does not exist |

**Example Request**:
```bash
curl -X POST "https://api.monopilot.local/api/v1/technical/shelf-life/products/prod-123/calculate" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "force": false
  }'
```

**Example Response**:
```json
{
  "calculated_days": 10,
  "shortest_ingredient_id": "ing-456",
  "shortest_ingredient_name": "Yeast Fresh",
  "shortest_ingredient_days": 14,
  "processing_impact_days": 2,
  "safety_buffer_percent": 20,
  "safety_buffer_days": 2,
  "ingredients_analyzed": 5,
  "missing_shelf_life": [],
  "calculation_timestamp": "2024-12-20T10:35:00Z"
}
```

---

### 3. Update Shelf Life Configuration

**Endpoint**: `PUT /api/v1/technical/shelf-life/products/:id`

**Description**: Updates shelf life configuration including override, storage conditions, FEFO settings, and expiry thresholds. Supports partial updates. Creates audit log entry automatically.

**Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Request Body** (all fields optional):
```typescript
{
  use_override?: boolean
  override_days?: number  // Required if use_override = true
  override_reason?: string  // Required if use_override = true, 10-500 chars
  processing_impact_days?: number  // -30 to 30 days
  safety_buffer_percent?: number  // 0 to 50%
  storage_temp_min?: number  // -40 to 100°C
  storage_temp_max?: number  // -40 to 100°C
  storage_humidity_min?: number | null  // 0 to 100%
  storage_humidity_max?: number | null  // 0 to 100%
  storage_conditions?: string[]  // e.g., ["original_packaging", "protect_sunlight"]
  storage_instructions?: string | null  // Max 500 chars
  shelf_life_mode?: 'fixed' | 'rolling'
  label_format?: 'best_before_day' | 'best_before_month' | 'use_by'
  picking_strategy?: 'FIFO' | 'FEFO'
  min_remaining_for_shipment?: number | null
  enforcement_level?: 'suggest' | 'warn' | 'block'
  expiry_warning_days?: number  // 1 to 90 days
  expiry_critical_days?: number  // 1 to 30 days
}
```

**Response** (200 OK): Same as GET endpoint

**Validation Rules**:

| Field | Rules |
|-------|-------|
| override_reason | Required if use_override = true AND override_days is set |
| storage_temp_min | Must be <= storage_temp_max |
| storage_humidity_min | Must be <= storage_humidity_max |
| expiry_critical_days | Must be <= expiry_warning_days |

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | OVERRIDE_REASON_REQUIRED | Override reason is required for audit trail |
| 400 | INVALID_TEMP_RANGE | Minimum temperature cannot exceed maximum |
| 400 | INVALID_HUMIDITY_RANGE | Minimum humidity cannot exceed maximum |
| 400 | INVALID_EXPIRY_THRESHOLD | Critical threshold must be <= warning threshold |
| 401 | UNAUTHORIZED | User not authenticated or lacks write permission |
| 404 | PRODUCT_NOT_FOUND | Product does not exist |

**Example Request**:
```bash
curl -X PUT "https://api.monopilot.local/api/v1/technical/shelf-life/products/prod-123" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "use_override": true,
    "override_days": 7,
    "override_reason": "Market standard for fresh bread is 7 days based on customer feedback",
    "storage_temp_min": 18,
    "storage_temp_max": 25,
    "shelf_life_mode": "fixed",
    "label_format": "best_before_day",
    "picking_strategy": "FEFO",
    "min_remaining_for_shipment": 5,
    "enforcement_level": "warn"
  }'
```

**Example Response**:
```json
{
  "product_id": "prod-123",
  "product_code": "BREAD-001",
  "product_name": "Bread Loaf White",
  "override_days": 7,
  "override_reason": "Market standard for fresh bread is 7 days based on customer feedback",
  "final_days": 7,
  "calculation_method": "manual",
  "calculated_at": "2024-12-20T10:40:00Z",
  "updated_at": "2024-12-20T10:40:00Z"
}
```

---

### 4. Get Ingredient Shelf Life

**Endpoint**: `GET /api/v1/technical/shelf-life/ingredients/:id`

**Description**: Retrieves shelf life configuration for an ingredient (raw material product).

**Parameters**:
```typescript
{
  id: string  // Ingredient/Product UUID
}
```

**Response** (200 OK):
```typescript
{
  id: string
  code: string
  name: string
  shelf_life_days: number | null
  shelf_life_source: 'supplier' | 'internal_testing' | 'regulatory' | 'industry_standard' | null
  supplier_name: string | null
  specification_reference: string | null
  storage_temp_min: number | null
  storage_temp_max: number | null
  storage_humidity_min: number | null
  storage_humidity_max: number | null
  storage_conditions: string[]
  min_acceptable_on_receipt: number | null
  quarantine_required: boolean
  quarantine_duration_days: number | null
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | User not authenticated |
| 404 | INGREDIENT_NOT_FOUND | Ingredient does not exist |

**Example Request**:
```bash
curl -X GET "https://api.monopilot.local/api/v1/technical/shelf-life/ingredients/ing-456" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response**:
```json
{
  "id": "ing-456",
  "code": "YEAST-001",
  "name": "Yeast Fresh",
  "shelf_life_days": 14,
  "shelf_life_source": "supplier",
  "supplier_name": "BioYeast Ltd.",
  "specification_reference": "SPEC-YEAST-2024-v1",
  "storage_temp_min": 2,
  "storage_temp_max": 8,
  "storage_humidity_min": null,
  "storage_humidity_max": null,
  "storage_conditions": ["refrigeration_required"],
  "min_acceptable_on_receipt": 12,
  "quarantine_required": false,
  "quarantine_duration_days": null
}
```

---

### 5. Update Ingredient Shelf Life

**Endpoint**: `POST /api/v1/technical/shelf-life/ingredients/:id`

**Description**: Updates ingredient shelf life. Automatically triggers recalculation for all products using this ingredient. Creates audit log entries for dependent products.

**Parameters**:
```typescript
{
  id: string  // Ingredient/Product UUID
}
```

**Request Body**:
```typescript
{
  shelf_life_days: number  // 1 to 3650 days
  shelf_life_source: 'supplier' | 'internal_testing' | 'regulatory' | 'industry_standard'
  supplier_name?: string | null
  specification_reference?: string | null
  storage_temp_min: number
  storage_temp_max: number
  storage_humidity_min?: number | null
  storage_humidity_max?: number | null
  storage_conditions?: string[]
  min_acceptable_on_receipt?: number | null
  quarantine_required?: boolean
  quarantine_duration_days?: number | null  // Required if quarantine_required = true
}
```

**Response** (200 OK): Same as GET Ingredient endpoint

**Validation Rules**:

| Field | Rules |
|-------|-------|
| shelf_life_days | Required, 1-3650, positive integer |
| shelf_life_source | Required, must be one of four sources |
| storage_temp_min | Required, must be <= storage_temp_max |
| storage_temp_max | Required, must be >= storage_temp_min |
| quarantine_duration_days | Required if quarantine_required = true |

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | QUARANTINE_DURATION_REQUIRED | Quarantine duration required when quarantine is enabled |
| 400 | INVALID_TEMP_RANGE | Minimum temperature cannot exceed maximum |
| 401 | UNAUTHORIZED | User not authenticated or lacks write permission |
| 404 | INGREDIENT_NOT_FOUND | Ingredient does not exist |

**Example Request**:
```bash
curl -X POST "https://api.monopilot.local/api/v1/technical/shelf-life/ingredients/ing-456" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "shelf_life_days": 14,
    "shelf_life_source": "supplier",
    "supplier_name": "BioYeast Ltd.",
    "specification_reference": "SPEC-YEAST-2024-v2",
    "storage_temp_min": 2,
    "storage_temp_max": 8,
    "storage_conditions": ["refrigeration_required"],
    "min_acceptable_on_receipt": 12,
    "quarantine_required": false
  }'
```

**Example Response**:
```json
{
  "id": "ing-456",
  "code": "YEAST-001",
  "name": "Yeast Fresh",
  "shelf_life_days": 14,
  "shelf_life_source": "supplier",
  "supplier_name": "BioYeast Ltd.",
  "specification_reference": "SPEC-YEAST-2024-v2",
  "storage_temp_min": 2,
  "storage_temp_max": 8,
  "min_acceptable_on_receipt": 12
}
```

---

### 6. Get Recalculation Queue

**Endpoint**: `GET /api/v1/technical/shelf-life/recalculation-queue`

**Description**: Returns list of products flagged for shelf life recalculation (e.g., due to BOM or ingredient changes). Use to identify products needing recalculation.

**Query Parameters**:
```typescript
{
  limit?: number  // Default: 50, Max: 500
  offset?: number  // Default: 0
}
```

**Response** (200 OK):
```typescript
{
  count: number
  products: Array<{
    product_id: string
    product_code: string
    product_name: string
    current_days: number | null
    last_calculated_at: string | null  // ISO 8601
    flagged_at: string  // ISO 8601
  }>
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | User not authenticated |

**Example Request**:
```bash
curl -X GET "https://api.monopilot.local/api/v1/technical/shelf-life/recalculation-queue?limit=10&offset=0" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response**:
```json
{
  "count": 3,
  "products": [
    {
      "product_id": "prod-123",
      "product_code": "BREAD-001",
      "product_name": "Bread Loaf White",
      "current_days": 10,
      "last_calculated_at": "2024-12-15T08:00:00Z",
      "flagged_at": "2024-12-20T10:30:00Z"
    },
    {
      "product_id": "prod-124",
      "product_code": "BREAD-002",
      "product_name": "Bread Loaf Brown",
      "current_days": 12,
      "last_calculated_at": "2024-12-15T08:00:00Z",
      "flagged_at": "2024-12-20T10:30:00Z"
    }
  ]
}
```

---

### 7. Bulk Recalculate Shelf Life

**Endpoint**: `POST /api/v1/technical/shelf-life/bulk-recalculate`

**Description**: Recalculates shelf life for multiple products. If product_ids not provided, processes all flagged products.

**Request Body**:
```typescript
{
  product_ids?: string[]  // If empty, recalculates all flagged products
}
```

**Response** (200 OK):
```typescript
{
  total_processed: number
  successful: number
  failed: number
  results: Array<{
    product_id: string
    product_name: string
    old_days: number
    new_days: number
    success: boolean
    error?: string  // Only if success = false
  }>
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | User not authenticated or lacks write permission |

**Example Request**:
```bash
curl -X POST "https://api.monopilot.local/api/v1/technical/shelf-life/bulk-recalculate" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": ["prod-123", "prod-124"]
  }'
```

**Example Response**:
```json
{
  "total_processed": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "product_id": "prod-123",
      "product_name": "Bread Loaf White",
      "old_days": 10,
      "new_days": 11,
      "success": true
    },
    {
      "product_id": "prod-124",
      "product_name": "Bread Loaf Brown",
      "old_days": 12,
      "new_days": 13,
      "success": true
    }
  ]
}
```

---

### 8. Get Audit Log

**Endpoint**: `GET /api/v1/technical/shelf-life/products/:id/audit`

**Description**: Retrieves audit trail of all shelf life changes for a product. Tracks calculation updates, overrides, configuration changes, and who made them.

**Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Query Parameters**:
```typescript
{
  limit?: number  // Default: 50, Max: 500
  offset?: number  // Default: 0
}
```

**Response** (200 OK):
```typescript
{
  total: number
  entries: Array<{
    id: string
    product_id: string
    action_type: 'calculate' | 'override' | 'update_config' | 'recalculate' | 'clear_override'
    old_value: Record<string, unknown> | null
    new_value: Record<string, unknown>
    change_reason: string | null
    changed_at: string  // ISO 8601
    changed_by: string  // User UUID
    changed_by_name: string  // User display name
  }>
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | User not authenticated or lacks write permission |
| 404 | PRODUCT_NOT_FOUND | Product does not exist |

**Example Request**:
```bash
curl -X GET "https://api.monopilot.local/api/v1/technical/shelf-life/products/prod-123/audit?limit=10&offset=0" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response**:
```json
{
  "total": 5,
  "entries": [
    {
      "id": "audit-1",
      "product_id": "prod-123",
      "action_type": "override",
      "old_value": {
        "override_days": null,
        "calculation_method": "auto_min_ingredients"
      },
      "new_value": {
        "override_days": 7,
        "calculation_method": "manual",
        "override_reason": "Market standard for fresh bread"
      },
      "change_reason": "Market standard for fresh bread is 7 days",
      "changed_at": "2024-12-20T10:40:00Z",
      "changed_by": "user-789",
      "changed_by_name": "Jan Kowalski"
    },
    {
      "id": "audit-2",
      "product_id": "prod-123",
      "action_type": "calculate",
      "old_value": null,
      "new_value": {
        "calculated_days": 10,
        "shortest_ingredient_id": "ing-456",
        "safety_buffer_days": 2
      },
      "change_reason": null,
      "changed_at": "2024-12-15T08:00:00Z",
      "changed_by": "user-890",
      "changed_by_name": "Anna Nowak"
    }
  ]
}
```

---

## Data Validation

All API endpoints validate request data using Zod schemas located in `apps/frontend/lib/validation/shelf-life-schemas.ts`.

### Common Validation Rules

| Field | Min | Max | Required | Rules |
|-------|-----|-----|----------|-------|
| shelf_life_days | 1 | 3650 | Yes | Positive integer |
| processing_impact_days | -30 | 30 | No | Integer |
| safety_buffer_percent | 0 | 50 | No | Percentage |
| storage_temp_min | -40 | 100 | No | Must be <= max |
| storage_temp_max | -40 | 100 | No | Must be >= min |
| storage_humidity_min | 0 | 100 | No | Must be <= max |
| storage_humidity_max | 0 | 100 | No | Must be >= min |
| override_reason | 10 | 500 | Conditional | Required if use_override = true |
| expiry_warning_days | 1 | 90 | No | Integer |
| expiry_critical_days | 1 | 30 | No | Must be <= warning |

---

## Error Handling

All errors follow this standard format:

```typescript
{
  error: {
    code: string  // Machine-readable error code
    message: string  // User-friendly message
    details?: {  // Optional additional context
      field?: string
      value?: unknown
      expected?: string
    }
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning | Recovery |
|------|------|---------|----------|
| UNAUTHORIZED | 401 | Missing or invalid auth token | Authenticate and retry |
| PRODUCT_NOT_FOUND | 404 | Product doesn't exist | Verify product ID |
| NO_ACTIVE_BOM | 400 | Cannot calculate without BOM | Create BOM first |
| MISSING_INGREDIENT_SHELF_LIFE | 400 | Ingredient has no shelf life | Configure ingredient shelf life |
| INVALID_TEMP_RANGE | 400 | Min temp > max temp | Correct temperature range |
| OVERRIDE_REASON_REQUIRED | 400 | Missing override reason | Provide audit reason |

---

## Integration Examples

### Calculate Product Shelf Life (TypeScript/React)

```typescript
import { getShelfLifeConfig, calculateShelfLife } from '@/lib/services/shelf-life-service'

async function getAndCalculateShelfLife(productId: string) {
  try {
    // Get current configuration
    const config = await getShelfLifeConfig(productId)
    if (!config) {
      console.log('No shelf life configuration found')
      return null
    }

    // Check if recalculation needed
    if (config.needs_recalculation) {
      const calculated = await calculateShelfLife(productId, true)  // force recalculate
      console.log(`Recalculated: ${calculated.calculated_days} days`)
      console.log(`Shortest ingredient: ${calculated.shortest_ingredient_name} (${calculated.shortest_ingredient_days} days)`)
    }

    return config
  } catch (error) {
    console.error('Failed to calculate shelf life:', error)
    throw error
  }
}
```

### Update Shelf Life Configuration (TypeScript/React)

```typescript
import { updateShelfLifeConfig } from '@/lib/services/shelf-life-service'

async function applyShelfLifeOverride(
  productId: string,
  overrideDays: number,
  reason: string
) {
  try {
    const updated = await updateShelfLifeConfig(productId, {
      use_override: true,
      override_days: overrideDays,
      override_reason: reason,
      storage_temp_min: 18,
      storage_temp_max: 25,
    })

    console.log(`Shelf life updated to ${updated.final_days} days`)
    return updated
  } catch (error) {
    console.error('Failed to update shelf life:', error)
    throw error
  }
}
```

### Check Shipment Eligibility (TypeScript)

```typescript
import { checkShipmentEligibility } from '@/lib/services/shelf-life-service'

async function canShipLot(lotId: string) {
  try {
    const eligibility = await checkShipmentEligibility(lotId)

    if (eligibility.blocked) {
      console.log(`Cannot ship: ${eligibility.message}`)
      return false
    }

    if (eligibility.requires_confirmation) {
      console.log(`Warning: ${eligibility.message}`)
      // Prompt user for confirmation
      return true  // If user confirms
    }

    console.log('Lot is eligible for shipment')
    return true
  } catch (error) {
    console.error('Failed to check eligibility:', error)
    throw error
  }
}
```

---

## Rate Limiting & Performance

- **Rate Limit**: 100 requests per minute per user
- **Timeout**: 30 seconds for all endpoints
- **Cache**: Calculations cached for 1 hour unless force=true

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-28 | 1.0.0 | Initial release with 8 endpoints |

