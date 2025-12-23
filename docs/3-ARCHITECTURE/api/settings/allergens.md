# Allergens API Documentation

**Story**: 01.12 - Allergens Management
**Module**: Settings
**Base Path**: `/api/v1/settings/allergens`
**Version**: 1.0.0
**Last Updated**: 2025-12-23

---

## Overview

The Allergens API provides read-only access to the 14 EU-mandated allergens as defined in EU Regulation (EU) No 1169/2011. This is global reference data shared across all organizations - unlike other resources in the system, allergens are NOT organization-scoped.

**Features**:
- Global reference data (no org_id filtering)
- 14 EU-mandated allergens (A01-A14)
- Multi-language support (EN, PL, DE, FR)
- Full-text search across all language fields
- Read-only enforcement (405 for POST/PUT/DELETE)
- Icon system with SVG support
- Performance-optimized (< 200ms for list, < 100ms for search)

**Use Cases**:
- Product allergen declaration (Technical module)
- Label generation (Shipping module)
- Quality control checks (Quality module)
- Supplier allergen tracking
- Multi-market compliance (EU, UK, Canada, USA)

---

## Authentication

All endpoints require authentication via Supabase Auth, but NO role-based permissions are enforced for reads.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response Codes**:
- `401 Unauthorized` - Missing or invalid authentication
- `405 Method Not Allowed` - Attempting to create/update/delete (read-only)

---

## Endpoints

### 1. List Allergens

```
GET /api/v1/settings/allergens
```

Returns all 14 EU-mandated allergens sorted by display order.

**Query Parameters**: None (always returns all 14 allergens)

**Performance Target**: < 200ms

**Success Response (200 OK)**:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "A01",
    "name_en": "Gluten",
    "name_pl": "Gluten",
    "name_de": "Gluten",
    "name_fr": "Gluten",
    "icon_url": "/icons/allergens/gluten.svg",
    "icon_svg": null,
    "is_eu_mandatory": true,
    "is_custom": false,
    "is_active": true,
    "display_order": 1,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "A02",
    "name_en": "Crustaceans",
    "name_pl": "Skorupiaki",
    "name_de": "Krebstiere",
    "name_fr": "Crustaces",
    "icon_url": "/icons/allergens/crustaceans.svg",
    "icon_svg": null,
    "is_eu_mandatory": true,
    "is_custom": false,
    "is_active": true,
    "display_order": 2,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
  // ... remaining 12 allergens
]
```

**Error Responses**:

```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch allergens",
  "details": "Database connection failed"
}
```

**Example Requests**:

```bash
# List all allergens
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/allergens"
```

**JavaScript/TypeScript**:

```typescript
// Fetch all allergens
const response = await fetch('/api/v1/settings/allergens', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const allergens = await response.json()

console.log(`Found ${allergens.length} allergens`) // 14
console.log(allergens[0].name_en) // "Gluten"
```

---

### 2. Get Allergen by ID

```
GET /api/v1/settings/allergens/:id
```

Returns details for a specific allergen.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Allergen ID |

**Performance Target**: < 100ms

**Success Response (200 OK)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "A07",
  "name_en": "Milk",
  "name_pl": "Mleko",
  "name_de": "Milch",
  "name_fr": "Lait",
  "icon_url": "/icons/allergens/milk.svg",
  "icon_svg": null,
  "is_eu_mandatory": true,
  "is_custom": false,
  "is_active": true,
  "display_order": 7,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Allergen not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 400 Bad Request
{
  "error": "Invalid allergen ID"
}
```

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/allergens/550e8400-e29b-41d4-a716-446655440000"
```

---

### 3. Create Allergen (Read-Only)

```
POST /api/v1/settings/allergens
```

Returns 405 Method Not Allowed. EU allergens are system-managed and cannot be created via API.

**Required Permissions**: None (always returns 405)

**Request Body**: Any

**Response (405 Method Not Allowed)**:

```json
{
  "error": "Method not allowed. EU allergens are read-only in MVP."
}
```

**Headers**:
```
Allow: GET
```

**Future Support**: Custom allergens will be supported in Phase 3 with organization-scoped entries.

**Example Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "A99", "name_en": "Custom"}' \
  "https://api.monopilot.com/api/v1/settings/allergens"
# Response: 405 Method Not Allowed
```

---

### 4. Update Allergen (Read-Only)

```
PUT /api/v1/settings/allergens/:id
```

Returns 405 Method Not Allowed. EU allergens are system-managed and cannot be modified.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Allergen ID |

**Request Body**: Any

**Response (405 Method Not Allowed)**:

```json
{
  "error": "Method not allowed. EU allergens are read-only in MVP."
}
```

**Headers**:
```
Allow: GET
```

**Example Request**:

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name_en": "Updated Name"}' \
  "https://api.monopilot.com/api/v1/settings/allergens/allergen-uuid"
# Response: 405 Method Not Allowed
```

---

### 5. Delete Allergen (Read-Only)

```
DELETE /api/v1/settings/allergens/:id
```

Returns 405 Method Not Allowed. EU allergens are system-managed and cannot be deleted.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Allergen ID |

**Response (405 Method Not Allowed)**:

```json
{
  "error": "Method not allowed. EU allergens are read-only in MVP."
}
```

**Headers**:
```
Allow: GET
```

**Example Request**:

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/allergens/allergen-uuid"
# Response: 405 Method Not Allowed
```

---

## Data Types

### Allergen Object

```typescript
interface Allergen {
  id: string                       // UUID
  code: string                     // Format: A01-A14 (regex: ^A[0-9]{2}$)
  name_en: string                  // English name (1-100 chars)
  name_pl: string                  // Polish name (1-100 chars)
  name_de: string | null           // German name (optional)
  name_fr: string | null           // French name (optional)
  icon_url: string | null          // Path to icon SVG (e.g., /icons/allergens/gluten.svg)
  icon_svg: string | null          // SVG content (future use)
  is_eu_mandatory: boolean         // True for EU Regulation 1169/2011 allergens
  is_custom: boolean               // False for EU allergens, true for org-specific (Phase 3)
  is_active: boolean               // Display visibility (always true for EU allergens)
  display_order: number            // Sort order (1-14 for EU allergens)
  created_at: string               // ISO 8601 timestamp
  updated_at: string               // ISO 8601 timestamp
}
```

### EU Allergen Codes

14 major allergens required by EU Regulation (EU) No 1169/2011:

```typescript
type AllergenCode =
  | 'A01'  // Gluten (cereals containing gluten)
  | 'A02'  // Crustaceans
  | 'A03'  // Eggs
  | 'A04'  // Fish
  | 'A05'  // Peanuts
  | 'A06'  // Soybeans
  | 'A07'  // Milk (including lactose)
  | 'A08'  // Nuts (tree nuts)
  | 'A09'  // Celery
  | 'A10'  // Mustard
  | 'A11'  // Sesame seeds
  | 'A12'  // Sulphites (>10mg/kg or >10mg/L SO2)
  | 'A13'  // Lupin
  | 'A14'  // Molluscs
```

### Language Support

Multi-language names for international compliance:

| Code | English | Polish | German | French |
|------|---------|--------|--------|--------|
| A01 | Gluten | Gluten | Gluten | Gluten |
| A02 | Crustaceans | Skorupiaki | Krebstiere | Crustaces |
| A03 | Eggs | Jaja | Eier | Oeufs |
| A04 | Fish | Ryby | Fisch | Poisson |
| A05 | Peanuts | Orzeszki ziemne | Erdnusse | Arachides |
| A06 | Soybeans | Soja | Soja | Soja |
| A07 | Milk | Mleko | Milch | Lait |
| A08 | Nuts | Orzechy | Schalenfruchte | Fruits a coque |
| A09 | Celery | Seler | Sellerie | Celeri |
| A10 | Mustard | Gorczyca | Senf | Moutarde |
| A11 | Sesame | Sezam | Sesam | Sesame |
| A12 | Sulphites | Siarczyny | Sulfite | Sulfites |
| A13 | Lupin | Lubin | Lupinen | Lupin |
| A14 | Molluscs | Mieczaki | Weichtiere | Mollusques |

---

## Security

### Row-Level Security (RLS)

Allergens have minimal RLS enforcement since they're global reference data:

```sql
-- SELECT: All authenticated users can read active allergens
CREATE POLICY allergens_select_authenticated
  ON allergens
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- NOTE: No INSERT/UPDATE/DELETE policies = read-only in MVP
```

### Global Reference Data Pattern

Unlike other resources (warehouses, machines, etc.), allergens are **NOT** filtered by `org_id`:

```typescript
// WRONG: Don't filter by org_id
const { data } = await supabase
  .from('allergens')
  .select('*')
  .eq('org_id', userOrgId) // DON'T DO THIS!

// CORRECT: Global data - no org filter
const { data } = await supabase
  .from('allergens')
  .select('*')
  .eq('is_active', true)
  .order('display_order')
```

**Why Global?**
- EU allergens are standardized across all food manufacturers
- Same 14 allergens apply to all organizations
- Multi-language support benefits all users
- No need for data duplication per organization

### Permission Matrix

| Role | List | View | Create | Update | Delete |
|------|------|------|--------|--------|--------|
| SUPER_ADMIN | Yes | Yes | No (405) | No (405) | No (405) |
| ADMIN | Yes | Yes | No (405) | No (405) | No (405) |
| PROD_MANAGER | Yes | Yes | No (405) | No (405) | No (405) |
| WAREHOUSE_MANAGER | Yes | Yes | No (405) | No (405) | No (405) |
| VIEWER | Yes | Yes | No (405) | No (405) | No (405) |

**Read-Only for ALL roles** (including SUPER_ADMIN).

---

## Search Functionality

While the API doesn't expose search as a query parameter, the service layer supports full-text search across all language fields using PostgreSQL's GIN index.

### Search Implementation (Service Layer)

```typescript
import { getAllergens } from '@/lib/services/allergen-service'

// Search across all language fields
const result = await getAllergens({
  search: 'milk' // Searches: code, name_en, name_pl, name_de, name_fr
})

// Returns: A07 - Milk
```

### Search Behavior

- **Case-insensitive**: "MILK" matches "Milk"
- **Multi-language**: "mleko" (Polish) matches A07
- **Code search**: "A07" matches directly
- **Partial match**: "glut" matches "Gluten"
- **Performance**: < 100ms using GIN index

### Search Examples

```typescript
// Search by English name
await getAllergens({ search: 'peanuts' })
// Returns: A05 - Peanuts

// Search by Polish name
await getAllergens({ search: 'orzechy' })
// Returns: A08 - Nuts

// Search by code
await getAllergens({ search: 'A12' })
// Returns: A12 - Sulphites

// Search by German name
await getAllergens({ search: 'milch' })
// Returns: A07 - Milk
```

---

## Performance Considerations

### Performance Targets

- **List**: < 200ms (always 14 allergens)
- **Get by ID**: < 100ms
- **Search**: < 100ms (GIN index optimization)

### Indexing

Database indexes for optimal performance:

```sql
-- Code lookup
CREATE INDEX idx_allergens_code ON allergens(code);

-- Display order sorting
CREATE INDEX idx_allergens_display_order ON allergens(display_order);

-- Full-text search (GIN index)
CREATE INDEX idx_allergens_search ON allergens USING GIN (
  to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
  )
);
```

### Caching Strategy

Since allergens are static reference data:

1. **Browser Cache**: Cache for 24 hours (HTTP Cache-Control header)
2. **Client State**: Store in React state/context for session duration
3. **No Pagination**: All 14 allergens fit in single response (~5KB)

```typescript
// Example: Cache in React context
const AllergensContext = createContext<Allergen[]>([])

export function AllergensProvider({ children }) {
  const { data: allergens } = useAllergens() // Fetches once, caches in state

  return (
    <AllergensContext.Provider value={allergens || []}>
      {children}
    </AllergensContext.Provider>
  )
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "details": "Additional context (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET |
| 400 | Bad Request | Invalid allergen ID format |
| 401 | Unauthorized | Missing or invalid authentication |
| 404 | Not Found | Allergen ID not found |
| 405 | Method Not Allowed | POST/PUT/DELETE attempts (read-only) |
| 500 | Internal Server Error | Database error |

---

## Testing Examples

### JavaScript/TypeScript

```typescript
// List all allergens
const allergens = await fetch('/api/v1/settings/allergens', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json())

console.log(allergens.length) // 14

// Get single allergen
const milk = await fetch(`/api/v1/settings/allergens/${milkId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json())

console.log(milk.code) // "A07"
console.log(milk.name_en) // "Milk"
console.log(milk.name_pl) // "Mleko"

// Attempt create (should fail)
const createResponse = await fetch('/api/v1/settings/allergens', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ code: 'A99', name_en: 'Custom' })
})

console.log(createResponse.status) // 405
console.log(createResponse.headers.get('Allow')) // "GET"
```

---

## Common Use Cases

### 1. Display Allergen List in Product Form

```typescript
import { useAllergens } from '@/lib/hooks/use-allergens'
import { AllergenBadge } from '@/components/settings/allergens'

function ProductForm() {
  const { data: allergens, isLoading } = useAllergens()

  return (
    <div>
      <label>Select Allergens</label>
      {allergens?.map(allergen => (
        <AllergenBadge key={allergen.id} allergen={allergen} language="en" />
      ))}
    </div>
  )
}
```

### 2. Get Localized Allergen Name

```typescript
import { getAllergenName } from '@/lib/types/allergen'

const allergen = { code: 'A07', name_en: 'Milk', name_pl: 'Mleko', ... }

const englishName = getAllergenName(allergen, 'en') // "Milk"
const polishName = getAllergenName(allergen, 'pl') // "Mleko"
const germanName = getAllergenName(allergen, 'de') // "Milch"
```

### 3. Search Allergens by Code

```typescript
import { getAllergenByCode } from '@/lib/services/allergen-service'

const result = await getAllergenByCode('A07')

if (result.success) {
  console.log(result.data.name_en) // "Milk"
}
```

### 4. Populate Dropdown for Multi-Select

```typescript
import { getAllergensForSelect } from '@/lib/services/allergen-service'

const options = await getAllergensForSelect('en')

// Returns:
// [
//   { value: "uuid-1", label: "Gluten", code: "A01", icon_url: "/icons/..." },
//   { value: "uuid-2", label: "Crustaceans", code: "A02", icon_url: "/icons/..." },
//   ...
// ]
```

---

## Integration with Other Modules

### Technical Module (Product Formulations)

Products can declare allergens using the allergens table:

```sql
CREATE TABLE product_allergens (
  product_id UUID REFERENCES products(id),
  allergen_id UUID REFERENCES allergens(id),
  PRIMARY KEY (product_id, allergen_id)
);
```

### Shipping Module (Label Generation)

Labels display allergen information in multiple languages:

```typescript
import { getAllergenName } from '@/lib/types/allergen'

function generateLabel(product: Product, language: 'en' | 'pl') {
  const allergenNames = product.allergens.map(a =>
    getAllergenName(a, language)
  ).join(', ')

  return `Allergens: ${allergenNames}`
}
```

### Quality Module (Supplier Checks)

Quality checks verify supplier allergen declarations match product spec:

```typescript
function validateSupplierAllergens(
  supplierAllergens: string[],
  productAllergens: Allergen[]
) {
  const supplierCodes = new Set(supplierAllergens)
  const productCodes = new Set(productAllergens.map(a => a.code))

  return [...productCodes].every(code => supplierCodes.has(code))
}
```

---

## Error Code Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ALLERGEN_NOT_FOUND` | 404 | Allergen ID does not exist |
| `INVALID_ALLERGEN_ID` | 400 | Allergen ID format invalid |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `METHOD_NOT_ALLOWED` | 405 | Attempted POST/PUT/DELETE (read-only) |
| `DATABASE_ERROR` | 500 | Database query failed |

---

## Regulatory Compliance

### EU Regulation (EU) No 1169/2011

All 14 allergens are mandated by EU food labeling regulation:

**Article 9(1)(c)**: "Any ingredient or processing aid listed in Annex II or derived from a substance or product listed in Annex II causing allergies or intolerances used in the manufacture or preparation of a food and still present in the finished product, even if in an altered form."

**Annex II**: Lists 14 substances or products causing allergies or intolerances.

**Labeling Requirement**: Must be emphasized in ingredient list (e.g., bold, italics, background color).

### Additional Markets

- **UK**: Same 14 allergens (UK Food Information Regulations 2014)
- **Canada**: 11 priority allergens (+ sesame = 12)
- **USA**: 9 major allergens (FASTER Act adds sesame = 10)
- **Australia/NZ**: 10 priority allergens

**Future Enhancement**: Add market-specific allergen mappings in Phase 3.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-23 | Initial release (Story 01.12) |

---

## Related Documentation

- [Allergen Component Documentation](../../frontend/components/allergens.md)
- [Allergen Developer Guide](../../guides/allergen-management.md)
- [Database Schema - Allergens Table](../../database/migrations/allergens.md)
- [Story 01.12 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.12.allergens-management.md)
