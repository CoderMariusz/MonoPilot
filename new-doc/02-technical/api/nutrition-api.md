# Nutrition API Reference

**Story**: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
**Version**: 1.0
**Last Updated**: 2025-12-29
**Base URL**: `/api/technical/nutrition`

## Overview

The Nutrition API provides endpoints for:
- Retrieving product nutrition data
- Calculating nutrition from BOM ingredients
- Manually overriding nutrition data with audit trail
- Generating FDA and EU format labels
- Looking up FDA RACC values
- Managing ingredient nutrition data

All endpoints require authentication and enforce multi-tenant isolation via `org_id`.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Product Nutrition Endpoints](#product-nutrition-endpoints)
3. [Calculation Endpoints](#calculation-endpoints)
4. [Label Generation Endpoints](#label-generation-endpoints)
5. [RACC Reference Endpoints](#racc-reference-endpoints)
6. [Ingredient Nutrition Endpoints](#ingredient-nutrition-endpoints)
7. [Error Handling](#error-handling)
8. [Rate Limits](#rate-limits)

---

## Authentication

All endpoints require authentication via Supabase session token.

**Headers**:
```http
Authorization: Bearer <supabase_access_token>
```

**Multi-Tenancy**:
- All requests are automatically scoped to user's `org_id`
- RLS (Row Level Security) policies enforce data isolation
- Attempting to access another org's data returns `404 Not Found`

---

## Product Nutrition Endpoints

### GET `/api/technical/nutrition/products/:id`

Retrieve nutrition facts for a specific product.

**Parameters**:
- `id` (path, required): Product UUID

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "serving_size": 50,
  "serving_unit": "g",
  "servings_per_container": 16,
  "energy_kcal": 265,
  "energy_kj": 1109,
  "protein_g": 8.9,
  "fat_g": 3.2,
  "saturated_fat_g": 0.6,
  "trans_fat_g": 0,
  "carbohydrate_g": 49.1,
  "sugar_g": 3.1,
  "added_sugar_g": 0,
  "fiber_g": 2.8,
  "sodium_mg": 490,
  "salt_g": 1.25,
  "cholesterol_mg": 0,
  "vitamin_d_mcg": 0,
  "calcium_mg": 40,
  "iron_mg": 2.4,
  "potassium_mg": 170,
  "is_manual_override": true,
  "override_source": "lab_test",
  "override_reference": "LAB-2024-98765",
  "override_notes": "AOAC method, tested by XYZ Labs",
  "override_by": "user-uuid",
  "override_at": "2024-12-29T14:35:22Z",
  "calculated_at": null,
  "bom_version_used": null,
  "bom_id_used": null,
  "fda_racc_category": "bread",
  "fda_racc_value_g": 50,
  "created_at": "2024-11-01T09:15:30Z",
  "updated_at": "2024-12-29T14:35:22Z"
}
```

**Response** (404 Not Found):
```json
{
  "error": "Product nutrition not found",
  "code": "NOT_FOUND"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`
  }
})

const nutrition = await response.json()
console.log(`Energy: ${nutrition.energy_kcal} kcal`)
```

**Example Request** (cURL):
```bash
curl -X GET \
  https://app.monopilot.com/api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

---

## Calculation Endpoints

### POST `/api/technical/nutrition/products/:id/calculate`

Calculate nutrition facts from BOM ingredients using weighted average.

**Parameters**:
- `id` (path, required): Product UUID

**Request Body**:
```json
{
  "bom_id": "optional-bom-uuid",
  "actual_yield_kg": 0.475,
  "allow_partial": false
}
```

**Field Descriptions**:
- `bom_id` (optional): Specific BOM to use. If omitted, uses active BOM.
- `actual_yield_kg` (optional): Actual production yield for concentration adjustment. If omitted, uses expected output from BOM.
- `allow_partial` (optional, default `false`): If `true`, calculates even if some ingredients are missing nutrition data.

**Response** (200 OK):
```json
{
  "ingredients": [
    {
      "id": "ing-uuid-1",
      "name": "Wheat Flour",
      "code": "FLOUR-001",
      "quantity": 300,
      "unit": "g",
      "nutrients": {
        "energy_kcal": 364,
        "protein_g": 10.3,
        "fat_g": 1.2,
        "carbohydrate_g": 76.3
      },
      "contribution_percent": 75.2
    },
    {
      "id": "ing-uuid-2",
      "name": "Water",
      "code": "WATER-001",
      "quantity": 180,
      "unit": "ml",
      "nutrients": {
        "energy_kcal": 0,
        "protein_g": 0,
        "fat_g": 0,
        "carbohydrate_g": 0
      },
      "contribution_percent": 0
    }
  ],
  "yield": {
    "expected_kg": 0.5,
    "actual_kg": 0.475,
    "factor": 1.053
  },
  "total_per_batch": {
    "energy_kcal": 1092,
    "protein_g": 30.9,
    "fat_g": 3.6,
    "carbohydrate_g": 228.9
  },
  "per_100g": {
    "energy_kcal": 230,
    "protein_g": 6.5,
    "fat_g": 0.76,
    "carbohydrate_g": 48.2
  },
  "missing_ingredients": [],
  "warnings": [],
  "metadata": {
    "bom_version": 3,
    "bom_id": "bom-uuid",
    "calculated_at": "2024-12-29T15:30:45Z"
  }
}
```

**Response** (400 Bad Request - Missing Ingredients):
```json
{
  "error": "Missing nutrition data for ingredients",
  "code": "MISSING_INGREDIENT_NUTRITION",
  "missing": [
    {
      "id": "ing-uuid-3",
      "name": "Dark Chocolate Chips",
      "code": "CHOC-001",
      "quantity": 100
    }
  ]
}
```

**Response** (404 Not Found - No BOM):
```json
{
  "error": "No active BOM found for this product",
  "code": "NO_ACTIVE_BOM"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000/calculate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    actual_yield_kg: 0.475,
    allow_partial: false
  })
})

const calculation = await response.json()
console.log(`Per 100g: ${calculation.per_100g.energy_kcal} kcal`)
```

**Calculation Logic**:

1. **Weighted Average**:
   ```
   For each nutrient:
   Total = SUM(ingredient_value_per_100g × ingredient_qty_kg × 10)
   ```

2. **Yield Adjustment**:
   ```
   Yield Factor = Expected Output / Actual Output
   Adjusted Total = Total × Yield Factor
   ```

3. **Per 100g Conversion**:
   ```
   Per 100g = (Adjusted Total / Actual Output in grams) × 100
   ```

**Performance**:
- Typical response time: ~1.8s for 20-ingredient BOM
- Benchmark: <2s for up to 50 ingredients

---

### PUT `/api/technical/nutrition/products/:id/override`

Manually override nutrition data with audit trail.

**Parameters**:
- `id` (path, required): Product UUID

**Request Body**:
```json
{
  "serving_size": 50,
  "serving_unit": "g",
  "servings_per_container": 16,
  "source": "lab_test",
  "reference": "LAB-2024-98765",
  "notes": "AOAC method, tested by XYZ Labs, expires 2025-12-20",
  "energy_kcal": 265,
  "energy_kj": 1109,
  "protein_g": 8.9,
  "fat_g": 3.2,
  "saturated_fat_g": 0.6,
  "trans_fat_g": 0,
  "carbohydrate_g": 49.1,
  "sugar_g": 3.1,
  "added_sugar_g": 0,
  "fiber_g": 2.8,
  "sodium_mg": 490,
  "salt_g": 1.25,
  "cholesterol_mg": 0,
  "vitamin_d_mcg": 0,
  "calcium_mg": 40,
  "iron_mg": 2.4,
  "potassium_mg": 170
}
```

**Field Descriptions**:
- `serving_size` (required): Serving size value
- `serving_unit` (required): One of `g`, `ml`, `oz`, `cup`, `tbsp`, `piece`
- `servings_per_container` (optional): Number of servings
- `source` (required): One of `lab_test`, `supplier_coa`, `database`, `calculated`, `manual`
- `reference` (required): Reference ID or document number
- `notes` (optional): Additional notes for audit trail
- All nutrient values are **per 100g or per 100ml**

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "serving_size": 50,
  "serving_unit": "g",
  "servings_per_container": 16,
  "is_manual_override": true,
  "override_source": "lab_test",
  "override_reference": "LAB-2024-98765",
  "override_notes": "AOAC method, tested by XYZ Labs, expires 2025-12-20",
  "override_by": "user-uuid",
  "override_at": "2024-12-29T14:35:22Z",
  "energy_kcal": 265,
  "protein_g": 8.9,
  "fat_g": 3.2,
  "updated_at": "2024-12-29T14:35:22Z"
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Validation failed: Energy (kcal) must be non-negative",
  "code": "VALIDATION_ERROR"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000/override', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    serving_size: 50,
    serving_unit: 'g',
    source: 'lab_test',
    reference: 'LAB-2024-98765',
    energy_kcal: 265,
    protein_g: 8.9,
    fat_g: 3.2,
    carbohydrate_g: 49.1
  })
})

const updated = await response.json()
console.log(`Override saved at: ${updated.override_at}`)
```

**Audit Trail**:
- System automatically records `override_by` (user UUID)
- System automatically records `override_at` (timestamp)
- Previous values are preserved (query via history endpoint)

---

## Label Generation Endpoints

### GET `/api/technical/nutrition/products/:id/label`

Generate nutrition label in FDA 2016 or EU format.

**Parameters**:
- `id` (path, required): Product UUID
- `format` (query, optional): `fda` (default) or `eu`
- `include_allergens` (query, optional): `true` or `false` (default `false`)

**Response** (200 OK):
```json
{
  "html_content": "<div style=\"border: 2px solid black; padding: 8px;\">...</div>",
  "format": "fda",
  "product": {
    "name": "Artisan Sourdough Bread",
    "code": "BREAD-001"
  }
}
```

**Response** (400 Bad Request - Missing Serving Size):
```json
{
  "error": "Serving size required for label generation",
  "code": "VALIDATION_ERROR"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000/label?format=fda&include_allergens=true', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`
  }
})

const label = await response.json()
document.getElementById('label-preview').innerHTML = label.html_content
```

**Export Formats**:

**PDF Export**:
```javascript
const response = await fetch('/api/technical/nutrition/products/:id/label/pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'fda',
    width: 4,
    height: 6
  })
})

const blob = await response.blob()
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'nutrition-label.pdf'
a.click()
```

**SVG Export**:
```javascript
const response = await fetch('/api/technical/nutrition/products/:id/label/svg', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'fda'
  })
})

const svg = await response.text()
// Save or display SVG
```

**Label Typography (FDA 2016 Compliant)**:
- Title "Nutrition Facts": 18pt bold, uppercase
- "Calories": 16pt bold
- Nutrients: 8pt
- Footnote: 7pt

**Required Nutrients (FDA 2016)**:
- Calories, Total Fat, Saturated Fat, Trans Fat, Cholesterol, Sodium
- Total Carbohydrate, Dietary Fiber, Total Sugars, Added Sugars
- Protein, Vitamin D, Calcium, Iron, Potassium

---

## RACC Reference Endpoints

### GET `/api/technical/nutrition/racc`

Get the complete FDA RACC (Reference Amount Customarily Consumed) table.

**Parameters**: None

**Response** (200 OK):
```json
{
  "bread": {
    "racc_g": 50,
    "description": "Bread (excluding sweet quick type), rolls"
  },
  "cookies": {
    "racc_g": 30,
    "description": "Cookies, crackers (excluding graham crackers)"
  },
  "milk": {
    "racc_g": 240,
    "racc_ml": 240,
    "description": "Milk, buttermilk, milk-based drinks"
  },
  "cheese": {
    "racc_g": 30,
    "description": "Cheese (all varieties except cottage cheese)"
  }
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/racc', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`
  }
})

const raccTable = await response.json()

// Build dropdown of categories
const categories = Object.keys(raccTable)
categories.forEach(cat => {
  console.log(`${cat}: ${raccTable[cat].racc_g}g - ${raccTable[cat].description}`)
})
```

### GET `/api/technical/nutrition/racc/:category`

Lookup FDA RACC for a specific product category.

**Parameters**:
- `category` (path, required): Product category (e.g., `bread`, `cookies`, `milk`)

**Response** (200 OK):
```json
{
  "category": "bread",
  "racc_grams": 50,
  "racc_description": "Bread (excluding sweet quick type), rolls",
  "common_servings": [
    {
      "description": "1 serving (50g)",
      "grams": 50
    },
    {
      "description": "1 slice (25g)",
      "grams": 25
    },
    {
      "description": "2 slices (50g)",
      "grams": 50
    }
  ]
}
```

**Response** (404 Not Found):
```json
{
  "error": "RACC category not found",
  "code": "NOT_FOUND"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/racc/bread', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`
  }
})

const racc = await response.json()
console.log(`FDA RACC for bread: ${racc.racc_grams}g`)
```

---

## Ingredient Nutrition Endpoints

### GET `/api/technical/nutrition/ingredients/:id`

Get nutrition data for a specific ingredient.

**Parameters**:
- `id` (path, required): Ingredient/Product UUID

**Response** (200 OK):
```json
{
  "id": "ing-uuid",
  "org_id": "org-uuid",
  "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
  "per_unit": 100,
  "unit": "g",
  "source": "usda_database",
  "source_id": "NDB-20081",
  "source_date": "2024-01-15",
  "confidence": "high",
  "notes": "USDA SR-28, Wheat flour, white, all-purpose",
  "energy_kcal": 364,
  "energy_kj": 1523,
  "protein_g": 10.3,
  "fat_g": 1.2,
  "saturated_fat_g": 0.2,
  "carbohydrate_g": 76.3,
  "fiber_g": 2.7,
  "sugar_g": 0.3,
  "sodium_mg": 2,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "error": "Ingredient nutrition not found",
  "code": "NOT_FOUND"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/ingredients/550e8400-e29b-41d4-a716-446655440000', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`
  }
})

const nutrition = await response.json()
console.log(`${nutrition.source}: ${nutrition.energy_kcal} kcal per ${nutrition.per_unit}${nutrition.unit}`)
```

---

### POST `/api/technical/nutrition/ingredients/:id`

Add or update ingredient nutrition data.

**Parameters**:
- `id` (path, required): Ingredient/Product UUID

**Request Body**:
```json
{
  "per_unit": 100,
  "unit": "g",
  "source": "supplier_coa",
  "source_id": "COA-FLOUR-2024-Q4",
  "source_date": "2024-10-15",
  "confidence": "high",
  "notes": "Supplier: ABC Mills, Lot: 2024-1015",
  "energy_kcal": 364,
  "energy_kj": 1523,
  "protein_g": 10.3,
  "fat_g": 1.2,
  "saturated_fat_g": 0.2,
  "trans_fat_g": 0,
  "carbohydrate_g": 76.3,
  "sugar_g": 0.3,
  "fiber_g": 2.7,
  "sodium_mg": 2,
  "salt_g": 0.005,
  "cholesterol_mg": 0,
  "vitamin_d_mcg": 0,
  "calcium_mg": 15,
  "iron_mg": 1.2,
  "potassium_mg": 107,
  "moisture_g": 12
}
```

**Field Descriptions**:
- `per_unit` (optional, default `100`): Basis for nutrient values
- `unit` (optional, default `g`): `g` or `ml`
- `source` (required): One of `usda_database`, `supplier_coa`, `lab_test`, `manufacturer_spec`, `calculated`, `manual`
- `source_id` (optional): External reference ID
- `source_date` (optional): Date of source data (ISO 8601)
- `confidence` (optional, default `medium`): `high`, `medium`, `low`
- `notes` (optional): Additional context
- All nutrient values per `per_unit` (default per 100g/100ml)

**Response** (200 OK):
```json
{
  "id": "ing-uuid",
  "org_id": "org-uuid",
  "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
  "per_unit": 100,
  "unit": "g",
  "source": "supplier_coa",
  "source_id": "COA-FLOUR-2024-Q4",
  "confidence": "high",
  "energy_kcal": 364,
  "protein_g": 10.3,
  "updated_at": "2024-12-29T16:00:00Z"
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Validation failed: Protein must be non-negative",
  "code": "VALIDATION_ERROR"
}
```

**Example Request** (JavaScript):
```javascript
const response = await fetch('/api/technical/nutrition/ingredients/550e8400-e29b-41d4-a716-446655440000', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'supplier_coa',
    source_id: 'COA-FLOUR-2024-Q4',
    confidence: 'high',
    energy_kcal: 364,
    protein_g: 10.3,
    fat_g: 1.2,
    carbohydrate_g: 76.3
  })
})

const saved = await response.json()
console.log(`Ingredient nutrition saved: ${saved.id}`)
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found or user doesn't have access |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `MISSING_INGREDIENT_NUTRITION` | 400 | Cannot calculate due to missing ingredient data |
| `NO_ACTIVE_BOM` | 404 | Product has no active BOM |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Example Error Handling (JavaScript)

```javascript
try {
  const response = await fetch('/api/technical/nutrition/products/:id/calculate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ actual_yield_kg: 0.475 })
  })

  if (!response.ok) {
    const error = await response.json()

    switch (error.code) {
      case 'MISSING_INGREDIENT_NUTRITION':
        console.error('Missing ingredients:', error.missing)
        // Prompt user to add ingredient data
        break

      case 'NO_ACTIVE_BOM':
        console.error('No BOM found')
        // Redirect to BOM creation
        break

      case 'VALIDATION_ERROR':
        console.error('Invalid input:', error.error)
        // Show validation errors to user
        break

      default:
        console.error('Unexpected error:', error.error)
    }

    return
  }

  const calculation = await response.json()
  console.log('Calculation successful:', calculation)

} catch (err) {
  console.error('Network error:', err)
}
```

---

## Rate Limits

**Current Limits** (per organization):
- **100 requests per minute** for calculation endpoints
- **500 requests per minute** for read endpoints (GET)
- **50 requests per minute** for write endpoints (POST/PUT)

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1672531200
```

**Rate Limit Exceeded Response** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 42
}
```

**Best Practices**:
- Cache RACC table locally (changes infrequently)
- Batch ingredient nutrition updates when possible
- Use webhooks for real-time updates instead of polling

---

## Appendix: Complete Request/Response Examples

### Example 1: Calculate Nutrition from BOM

**Request**:
```http
POST /api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000/calculate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actual_yield_kg": 0.475
}
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ingredients": [
    {
      "id": "flour-uuid",
      "name": "Wheat Flour",
      "code": "FLOUR-001",
      "quantity": 300,
      "unit": "g",
      "nutrients": {
        "energy_kcal": 364,
        "protein_g": 10.3,
        "fat_g": 1.2,
        "carbohydrate_g": 76.3
      },
      "contribution_percent": 82.5
    }
  ],
  "yield": {
    "expected_kg": 0.5,
    "actual_kg": 0.475,
    "factor": 1.053
  },
  "per_100g": {
    "energy_kcal": 265,
    "protein_g": 8.9,
    "fat_g": 3.2,
    "carbohydrate_g": 49.1
  },
  "metadata": {
    "bom_version": 3,
    "calculated_at": "2024-12-29T15:30:45Z"
  }
}
```

### Example 2: Manual Override with Lab Test

**Request**:
```http
PUT /api/technical/nutrition/products/550e8400-e29b-41d4-a716-446655440000/override
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "serving_size": 50,
  "serving_unit": "g",
  "source": "lab_test",
  "reference": "LAB-2024-98765",
  "notes": "AOAC method, XYZ Labs",
  "energy_kcal": 265,
  "protein_g": 8.9,
  "fat_g": 3.2,
  "carbohydrate_g": 49.1,
  "sodium_mg": 490
}
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "is_manual_override": true,
  "override_source": "lab_test",
  "override_reference": "LAB-2024-98765",
  "override_by": "user-uuid",
  "override_at": "2024-12-29T14:35:22Z",
  "energy_kcal": 265,
  "updated_at": "2024-12-29T14:35:22Z"
}
```

---

**Document Version**: 1.0
**Story**: 02.13 - Nutrition Calculation
**Last Updated**: 2025-12-29
**Contact**: For API issues, see [Technical Support]
