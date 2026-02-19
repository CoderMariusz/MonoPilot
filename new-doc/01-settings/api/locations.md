# Locations API Documentation

**Story:** 01.9 - Warehouse Locations Management
**Module:** Settings
**Version:** 1.0
**Last Updated:** 2025-12-21

## Overview

The Locations API provides CRUD operations for managing hierarchical warehouse storage locations. Locations are organized in a 4-level tree structure: **zone > aisle > rack > bin**. Each location has capacity tracking, type classification, and auto-computed navigation paths.

**Base URL:** `/api/settings/warehouses/:warehouseId/locations`

**Authentication:** Required (Bearer token via Supabase Auth)
**Authorization:** Admin, Warehouse Manager (for create/update/delete)

## Hierarchical Structure

```
Warehouse (WH-001)
└─ Zone (ZONE-A) [level=zone, depth=1]
   └─ Aisle (A01) [level=aisle, depth=2]
      └─ Rack (R01) [level=rack, depth=3]
         └─ Bin (B001) [level=bin, depth=4]
```

**Full Path Example:** `WH-001/ZONE-A/A01/R01/B001`

## Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings/warehouses/:warehouseId/locations` | List locations (tree or flat) | Yes |
| POST | `/api/settings/warehouses/:warehouseId/locations` | Create location | Yes (Admin+) |
| GET | `/api/settings/warehouses/:warehouseId/locations/:id` | Get location by ID | Yes |
| PUT | `/api/settings/warehouses/:warehouseId/locations/:id` | Update location | Yes (Admin+) |
| DELETE | `/api/settings/warehouses/:warehouseId/locations/:id` | Delete location | Yes (Admin+) |
| GET | `/api/settings/warehouses/:warehouseId/locations/:id/tree` | Get subtree | Yes |

---

## 1. List Locations

**Endpoint:** `GET /api/settings/warehouses/:warehouseId/locations`

**Description:** Retrieve locations for a warehouse as a tree or flat list with optional filtering.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | `tree` \| `flat` | No | `tree` | Return format (nested tree or flat array) |
| `level` | `zone` \| `aisle` \| `rack` \| `bin` | No | - | Filter by hierarchical level |
| `type` | `bulk` \| `pallet` \| `shelf` \| `floor` \| `staging` | No | - | Filter by location type |
| `parent_id` | UUID \| `null` | No | - | Filter children of specific parent (null = root zones) |
| `search` | string | No | - | Search by code or name (case-insensitive) |
| `include_capacity` | boolean | No | `false` | Include current capacity statistics |

### Response (Tree View)

**Status Code:** `200 OK`

```json
{
  "locations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org_123",
      "warehouse_id": "wh_001",
      "parent_id": null,
      "code": "ZONE-A",
      "name": "Raw Materials Zone",
      "description": "Primary raw materials storage area",
      "level": "zone",
      "full_path": "WH-001/ZONE-A",
      "depth": 1,
      "location_type": "bulk",
      "max_pallets": 200,
      "max_weight_kg": 50000.00,
      "current_pallets": 145,
      "current_weight_kg": 36250.50,
      "capacity_percent": 72.5,
      "is_active": true,
      "created_at": "2025-12-20T10:00:00Z",
      "updated_at": "2025-12-21T08:30:00Z",
      "created_by": "user_123",
      "updated_by": "user_456",
      "children": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "code": "A01",
          "name": "Aisle 01",
          "level": "aisle",
          "full_path": "WH-001/ZONE-A/A01",
          "depth": 2,
          "children": [],
          "children_count": 5
        }
      ],
      "children_count": 10
    }
  ],
  "total_count": 45
}
```

### Response (Flat View)

When `view=flat`, returns array without nesting:

```json
{
  "locations": [
    { "id": "...", "code": "ZONE-A", "level": "zone", "depth": 1 },
    { "id": "...", "code": "A01", "level": "aisle", "depth": 2, "parent_id": "..." },
    { "id": "...", "code": "R01", "level": "rack", "depth": 3, "parent_id": "..." }
  ],
  "total_count": 45
}
```

### Error Responses

| Status Code | Error | Reason |
|-------------|-------|--------|
| `401` | Unauthorized | Missing or invalid authentication |
| `404` | Warehouse not found | Warehouse does not exist or not in user's org |
| `400` | Invalid query parameters | Validation failed on query params |
| `500` | Internal server error | Database or server error |

### cURL Example

```bash
# Get tree view of all locations in warehouse
curl -X GET "https://api.monopilot.com/api/settings/warehouses/wh_001/locations?view=tree" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only zones with capacity stats
curl -X GET "https://api.monopilot.com/api/settings/warehouses/wh_001/locations?level=zone&include_capacity=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search for location by code
curl -X GET "https://api.monopilot.com/api/settings/warehouses/wh_001/locations?search=B001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Create Location

**Endpoint:** `POST /api/settings/warehouses/:warehouseId/locations`

**Description:** Create a new location within a warehouse. Validates hierarchy rules (zone > aisle > rack > bin).

**Authorization:** Admin, Warehouse Manager

### Request Body

```json
{
  "code": "ZONE-B",
  "name": "Finished Goods Zone",
  "description": "Storage for finished products",
  "parent_id": null,
  "level": "zone",
  "location_type": "pallet",
  "max_pallets": 150,
  "max_weight_kg": 40000.00,
  "is_active": true
}
```

### Field Validation

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `code` | string | Yes | 1-50 chars, uppercase alphanumeric + hyphens (`^[A-Z0-9-]+$`) | Unique within warehouse |
| `name` | string | Yes | 2-255 chars | Display name |
| `description` | string | No | Max 1000 chars | Optional details |
| `parent_id` | UUID \| null | No | Must exist in same warehouse | Null for root zones |
| `level` | enum | Yes | `zone`, `aisle`, `rack`, `bin` | Hierarchy level |
| `location_type` | enum | No | `bulk`, `pallet`, `shelf`, `floor`, `staging` | Default: `shelf` |
| `max_pallets` | integer | No | > 0 | Null = unlimited |
| `max_weight_kg` | decimal | No | > 0 | Null = unlimited |
| `is_active` | boolean | No | - | Default: `true` |

### Hierarchy Validation Rules

| Parent Level | Allowed Child Level | Example |
|--------------|---------------------|---------|
| `null` (root) | `zone` only | Warehouse → Zone |
| `zone` | `aisle` only | ZONE-A → A01 |
| `aisle` | `rack` only | A01 → R01 |
| `rack` | `bin` only | R01 → B001 |
| `bin` | **None** (leaf node) | B001 cannot have children |

### Response

**Status Code:** `201 Created`

```json
{
  "location": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "org_id": "org_123",
    "warehouse_id": "wh_001",
    "parent_id": null,
    "code": "ZONE-B",
    "name": "Finished Goods Zone",
    "description": "Storage for finished products",
    "level": "zone",
    "full_path": "WH-001/ZONE-B",
    "depth": 1,
    "location_type": "pallet",
    "max_pallets": 150,
    "max_weight_kg": 40000.00,
    "current_pallets": 0,
    "current_weight_kg": 0.00,
    "capacity_percent": null,
    "is_active": true,
    "created_at": "2025-12-21T10:15:00Z",
    "updated_at": "2025-12-21T10:15:00Z",
    "created_by": "user_123",
    "updated_by": "user_123"
  },
  "message": "Location created successfully"
}
```

### Error Responses

| Status Code | Error | Reason |
|-------------|-------|--------|
| `400` | Invalid hierarchy | Wrong parent-child level combination (e.g., bin under zone) |
| `400` | Validation error | Missing required fields or invalid format |
| `401` | Unauthorized | No authentication token |
| `403` | Forbidden | User lacks Admin/Warehouse Manager role |
| `404` | Warehouse not found | Warehouse does not exist or not in user's org |
| `404` | Parent not found | parent_id does not exist or not in same warehouse |
| `409` | Duplicate code | Location code already exists in warehouse |
| `500` | Internal server error | Database or server error |

### cURL Example

```bash
# Create root zone
curl -X POST "https://api.monopilot.com/api/settings/warehouses/wh_001/locations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ZONE-C",
    "name": "Quarantine Zone",
    "level": "zone",
    "location_type": "staging",
    "max_pallets": 50
  }'

# Create aisle under zone
curl -X POST "https://api.monopilot.com/api/settings/warehouses/wh_001/locations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "A02",
    "name": "Aisle 02",
    "parent_id": "550e8400-e29b-41d4-a716-446655440000",
    "level": "aisle",
    "location_type": "pallet"
  }'
```

---

## 3. Get Location by ID

**Endpoint:** `GET /api/settings/warehouses/:warehouseId/locations/:id`

**Description:** Retrieve a single location by ID with full details.

### Path Parameters

- `warehouseId` (UUID) - Warehouse ID
- `id` (UUID) - Location ID

### Response

**Status Code:** `200 OK`

```json
{
  "location": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "org_id": "org_123",
    "warehouse_id": "wh_001",
    "parent_id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "A01",
    "name": "Aisle 01",
    "description": null,
    "level": "aisle",
    "full_path": "WH-001/ZONE-A/A01",
    "depth": 2,
    "location_type": "pallet",
    "max_pallets": 20,
    "max_weight_kg": 5000.00,
    "current_pallets": 15,
    "current_weight_kg": 3750.25,
    "capacity_percent": 75.0,
    "is_active": true,
    "created_at": "2025-12-20T10:05:00Z",
    "updated_at": "2025-12-21T09:00:00Z",
    "created_by": "user_123",
    "updated_by": "user_456"
  }
}
```

### Error Responses

| Status Code | Error | Reason |
|-------------|-------|--------|
| `401` | Unauthorized | Missing or invalid authentication |
| `404` | Location not found | Location does not exist or not in user's org |
| `500` | Internal server error | Database or server error |

### cURL Example

```bash
curl -X GET "https://api.monopilot.com/api/settings/warehouses/wh_001/locations/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4. Update Location

**Endpoint:** `PUT /api/settings/warehouses/:warehouseId/locations/:id`

**Description:** Update an existing location. **Immutable fields:** `code`, `level`, `parent_id` (cannot be changed after creation).

**Authorization:** Admin, Warehouse Manager

### Request Body

```json
{
  "name": "Aisle 01 - Updated",
  "description": "Primary raw materials aisle",
  "location_type": "shelf",
  "max_pallets": 25,
  "max_weight_kg": 6000.00,
  "is_active": true
}
```

### Updatable Fields

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | 2-255 chars |
| `description` | string | Max 1000 chars |
| `location_type` | enum | `bulk`, `pallet`, `shelf`, `floor`, `staging` |
| `max_pallets` | integer | > 0 or null |
| `max_weight_kg` | decimal | > 0 or null |
| `is_active` | boolean | Set false to disable location |

**Note:** `code`, `level`, and `parent_id` are **immutable** and will be ignored if provided.

### Response

**Status Code:** `200 OK`

```json
{
  "location": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "A01",
    "name": "Aisle 01 - Updated",
    "description": "Primary raw materials aisle",
    "location_type": "shelf",
    "max_pallets": 25,
    "max_weight_kg": 6000.00,
    "updated_at": "2025-12-21T11:30:00Z",
    "updated_by": "user_456"
  },
  "message": "Location updated successfully"
}
```

### Error Responses

| Status Code | Error | Reason |
|-------------|-------|--------|
| `400` | Validation error | Invalid field values |
| `401` | Unauthorized | No authentication token |
| `403` | Forbidden | User lacks Admin/Warehouse Manager role |
| `404` | Location not found | Location does not exist or not in user's org |
| `500` | Internal server error | Database or server error |

### cURL Example

```bash
curl -X PUT "https://api.monopilot.com/api/settings/warehouses/wh_001/locations/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aisle 01 - High Priority",
    "max_pallets": 30
  }'
```

---

## 5. Delete Location

**Endpoint:** `DELETE /api/settings/warehouses/:warehouseId/locations/:id`

**Description:** Delete a location. **Blocked if:**
- Location has child locations (delete children first, bottom-up)
- Location has inventory (relocate inventory first) - *enforced in warehouse module*

**Authorization:** Admin, Warehouse Manager

### Response

**Status Code:** `200 OK`

```json
{
  "message": "Location deleted successfully"
}
```

### Error Responses

| Status Code | Error | Reason |
|-------------|-------|--------|
| `400` | Cannot delete - has children | Location has child locations (e.g., zone with aisles) |
| `400` | Cannot delete - has inventory | Location contains license plates (warehouse module) |
| `401` | Unauthorized | No authentication token |
| `403` | Forbidden | User lacks Admin/Warehouse Manager role |
| `404` | Location not found | Location does not exist or not in user's org |
| `500` | Internal server error | Database or server error |

### cURL Example

```bash
curl -X DELETE "https://api.monopilot.com/api/settings/warehouses/wh_001/locations/550e8400-e29b-41d4-a716-446655440010" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. Get Location Subtree

**Endpoint:** `GET /api/settings/warehouses/:warehouseId/locations/:id/tree`

**Description:** Retrieve a location and all its descendants (children, grandchildren, etc.) as a tree structure.

### Response

**Status Code:** `200 OK`

```json
{
  "location": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "ZONE-A",
    "name": "Raw Materials Zone",
    "level": "zone",
    "children": [
      {
        "id": "...",
        "code": "A01",
        "level": "aisle",
        "children": [
          {
            "id": "...",
            "code": "R01",
            "level": "rack",
            "children": [
              { "id": "...", "code": "B001", "level": "bin", "children": [] }
            ]
          }
        ]
      }
    ]
  },
  "total_descendants": 35
}
```

### cURL Example

```bash
curl -X GET "https://api.monopilot.com/api/settings/warehouses/wh_001/locations/550e8400-e29b-41d4-a716-446655440000/tree" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Types

### LocationLevel Enum

| Value | Description | Depth |
|-------|-------------|-------|
| `zone` | Top-level storage zone | 1 |
| `aisle` | Aisle within zone | 2 |
| `rack` | Rack within aisle | 3 |
| `bin` | Bin within rack (leaf node) | 4 |

### LocationType Enum

| Value | Description | Typical Use |
|-------|-------------|-------------|
| `bulk` | Bulk storage area | Large-capacity floor storage |
| `pallet` | Pallet racking | Standard pallet rack systems |
| `shelf` | Shelf storage | Smaller items on shelving |
| `floor` | Floor marking | Floor-level storage areas |
| `staging` | Staging area | Temporary in/out processing |

---

## Multi-Tenancy & Security

### Org Isolation

All location operations are automatically filtered by `org_id` via Row Level Security (RLS):

- **SELECT:** Users can only see locations in their organization
- **INSERT:** Locations must belong to user's org warehouse
- **UPDATE/DELETE:** Only locations in user's org can be modified
- **Cross-tenant access:** Returns `404 Not Found` (not `403 Forbidden`)

### Role-Based Access Control

| Operation | Allowed Roles |
|-----------|---------------|
| **List** (GET) | All authenticated users |
| **View** (GET by ID) | All authenticated users |
| **Create** (POST) | Admin, Warehouse Manager |
| **Update** (PUT) | Admin, Warehouse Manager |
| **Delete** (DELETE) | Admin, Warehouse Manager |

---

## Database Triggers

### 1. Auto-Compute Full Path

**Trigger:** `compute_location_full_path()`

**When:** BEFORE INSERT OR UPDATE of `parent_id` or `code`

**Action:**
- Fetches warehouse code and parent's full_path
- Computes `full_path = warehouse_code/parent_path.../location_code`
- Sets `depth` based on parent's depth + 1

**Example:**
```
Parent: WH-001/ZONE-A (depth=1)
New Location: A01
Result: full_path = "WH-001/ZONE-A/A01", depth = 2
```

### 2. Validate Hierarchy

**Trigger:** `validate_location_hierarchy()`

**When:** BEFORE INSERT OR UPDATE of `parent_id` or `level`

**Action:**
- Root locations (parent_id=null) must be `zone`
- Zones can only have `aisle` children
- Aisles can only have `rack` children
- Racks can only have `bin` children
- Bins cannot have children

**Example Error:**
```sql
-- Attempting to create bin under zone
RAISE EXCEPTION 'Locations under zones must be aisles'
```

---

## Testing Examples

### JavaScript/TypeScript

```typescript
// List locations (tree view)
const response = await fetch(
  '/api/settings/warehouses/wh_001/locations?view=tree',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
const { locations, total_count } = await response.json()

// Create zone
const createResponse = await fetch(
  '/api/settings/warehouses/wh_001/locations',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'ZONE-D',
      name: 'WIP Zone',
      level: 'zone',
      location_type: 'bulk',
      max_pallets: 100
    })
  }
)
const { location } = await createResponse.json()

// Update location
await fetch(
  `/api/settings/warehouses/wh_001/locations/${locationId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Name',
      max_pallets: 150
    })
  }
)

// Delete location
await fetch(
  `/api/settings/warehouses/wh_001/locations/${locationId}`,
  {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
```

---

## Common Use Cases

### 1. Create Full 4-Level Hierarchy

```bash
# Step 1: Create zone
ZONE_ID=$(curl -s -X POST ".../locations" \
  -d '{"code":"ZONE-E","name":"New Zone","level":"zone"}' | jq -r '.location.id')

# Step 2: Create aisle under zone
AISLE_ID=$(curl -s -X POST ".../locations" \
  -d "{\"code\":\"A01\",\"name\":\"Aisle 01\",\"level\":\"aisle\",\"parent_id\":\"$ZONE_ID\"}" | jq -r '.location.id')

# Step 3: Create rack under aisle
RACK_ID=$(curl -s -X POST ".../locations" \
  -d "{\"code\":\"R01\",\"name\":\"Rack 01\",\"level\":\"rack\",\"parent_id\":\"$AISLE_ID\"}" | jq -r '.location.id')

# Step 4: Create bin under rack
curl -X POST ".../locations" \
  -d "{\"code\":\"B001\",\"name\":\"Bin 001\",\"level\":\"bin\",\"parent_id\":\"$RACK_ID\"}"
```

### 2. Search for Location by Code

```bash
curl "https://api.monopilot.com/api/settings/warehouses/wh_001/locations?search=B001" \
  -H "Authorization: Bearer TOKEN"
```

Response shows full path in breadcrumb format:
```json
{
  "locations": [{
    "code": "B001",
    "full_path": "WH-001/ZONE-A/A01/R01/B001"
  }]
}
```

### 3. Get All Zones

```bash
curl "https://api.monopilot.com/api/settings/warehouses/wh_001/locations?level=zone&view=flat" \
  -H "Authorization: Bearer TOKEN"
```

### 4. Delete Hierarchy Bottom-Up

```bash
# Must delete in order: bins → racks → aisles → zones
curl -X DELETE ".../locations/${BIN_ID}"     # Step 1
curl -X DELETE ".../locations/${RACK_ID}"    # Step 2
curl -X DELETE ".../locations/${AISLE_ID}"   # Step 3
curl -X DELETE ".../locations/${ZONE_ID}"    # Step 4
```

---

## Error Code Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WAREHOUSE_NOT_FOUND` | 404 | Warehouse does not exist or not in user's org |
| `LOCATION_NOT_FOUND` | 404 | Location does not exist or not in user's org |
| `DUPLICATE_CODE` | 409 | Location code already exists in warehouse |
| `INVALID_HIERARCHY` | 400 | Parent-child level combination not allowed |
| `HAS_CHILDREN` | 400 | Cannot delete location with child locations |
| `HAS_INVENTORY` | 400 | Cannot delete location with inventory |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks required role permissions |

---

## Performance Considerations

### Indexing

All queries are optimized with indexes on:
- `org_id` + `warehouse_id` (composite)
- `parent_id` (tree traversal)
- `level` (filtering)
- `location_type` (filtering)
- `full_path` (search)

### Pagination

Currently, all locations in a warehouse are returned. For warehouses with >1000 locations, consider adding pagination:

```
?limit=100&offset=0
```

*(Planned for Phase 2)*

### Tree Building

- Tree view builds hierarchy in-memory (O(n) algorithm)
- Single database query fetches all locations
- No N+1 query issues

---

## Related Documentation

- **Database Schema:** `docs/3-ARCHITECTURE/database/migrations/locations-hierarchy.md`
- **Frontend Components:** `docs/3-ARCHITECTURE/frontend/components/locations.md`
- **Developer Guide:** `docs/3-ARCHITECTURE/guides/location-hierarchy.md`
- **Story Specification:** `docs/2-MANAGEMENT/epics/current/01-settings/01.9.locations-crud.md`

---

**Document Version:** 1.0
**Story:** 01.9
**Status:** Implementation Complete (Backend), Frontend Pending
**Last Tested:** 2025-12-21
