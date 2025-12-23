# Backend Dev Handoff - Story 01.9 Track B

**Story:** 01.9 - Warehouse Locations Management
**Phase:** 3 GREEN
**Track:** B - API + Service
**Date:** 2025-12-21
**Status:** COMPLETE - Ready for Testing

---

## Implementation Summary

Successfully created **6 API routes** and refactored **location-service.ts** with hierarchical operations for warehouse location management.

### Files Created/Modified

#### 1. Types
- **File:** `apps/frontend/lib/types/location.ts`
- **Status:** NEW
- **Exports:**
  - `LocationLevel` - Enum type: zone, aisle, rack, bin
  - `LocationType` - Enum type: bulk, pallet, shelf, floor, staging
  - `Location` - Core location interface
  - `LocationNode` - Tree node with children
  - `LocationTreeResponse` - API response type
  - `CreateLocationInput` - Creation payload
  - `UpdateLocationInput` - Update payload (immutable: code, level, parent_id)
  - `LocationListParams` - Query parameters
  - `CanDeleteResult` - Validation result

#### 2. Validation Schemas
- **File:** `apps/frontend/lib/validation/location-schemas.ts`
- **Status:** REFACTORED (updated for Story 01.9)
- **Changes:**
  - Updated enums to match Story 01.9 spec (zone/aisle/rack/bin levels)
  - Replaced old location types with new hierarchy types
  - Added `createLocationSchema` with hierarchy validation
  - Added `updateLocationSchema` (immutable fields enforced)
  - Added `locationListParamsSchema` for query params
  - Removed bulk create schema (not needed for 01.9)

#### 3. Location Service
- **File:** `apps/frontend/lib/services/location-service.ts`
- **Status:** REFACTORED (complete rewrite)
- **New Methods:**
  - `list()` - Tree or flat view with filters
  - `getById()` - Get location by ID
  - `create()` - Create with hierarchy validation
  - `update()` - Update (immutable: code, level, parent_id)
  - `deleteLocation()` - Delete with validation
  - `getTree()` - Recursive subtree query
  - `getAncestors()` - Parent chain
  - `getDescendants()` - All children
  - `canDelete()` - Validation (checks children + inventory)
  - `validateHierarchy()` - Parent/child level validation
  - `updateCapacity()` - Denormalize capacity stats
- **Helpers:**
  - `buildTree()` - Convert flat list to hierarchical tree
  - `calculateCapacityPercent()` - Compute capacity percentage

#### 4. API Routes

##### a) List & Create
- **File:** `apps/frontend/app/api/settings/warehouses/[warehouseId]/locations/route.ts`
- **Methods:** GET, POST
- **GET Features:**
  - Query params: view (tree/flat), level, type, parent_id, search, include_capacity
  - Tree view builds hierarchical structure
  - Flat view returns array
- **POST Features:**
  - Role check: SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER
  - Validation: hierarchy rules, code uniqueness
  - Returns 201 on success

##### b) Get, Update, Delete by ID
- **File:** `apps/frontend/app/api/settings/warehouses/[warehouseId]/locations/[id]/route.ts`
- **Methods:** GET, PUT, DELETE
- **GET:** Fetch single location
- **PUT:**
  - Role check: SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER
  - Immutable fields: code, level, parent_id
- **DELETE:**
  - Role check: SUPER_ADMIN, ADMIN only
  - Validation: cannot delete if has children or inventory

##### c) Subtree
- **File:** `apps/frontend/app/api/settings/warehouses/[warehouseId]/locations/[id]/tree/route.ts`
- **Method:** GET
- **Features:**
  - Recursive query for subtree under location
  - Returns nested LocationNode[]

---

## API Endpoint Summary

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/settings/warehouses/:warehouseId/locations` | Required | All | List locations (tree/flat) |
| POST | `/api/settings/warehouses/:warehouseId/locations` | Required | Admin/WH Manager | Create location |
| GET | `/api/settings/warehouses/:warehouseId/locations/:id` | Required | All | Get location by ID |
| PUT | `/api/settings/warehouses/:warehouseId/locations/:id` | Required | Admin/WH Manager | Update location |
| DELETE | `/api/settings/warehouses/:warehouseId/locations/:id` | Required | Admin only | Delete location |
| GET | `/api/settings/warehouses/:warehouseId/locations/:id/tree` | Required | All | Get subtree |

---

## Key Features Implemented

### 1. Hierarchical Validation
- Root locations must be `level = zone`
- Valid parent-child relationships:
  - Zone → Aisle
  - Aisle → Rack
  - Rack → Bin
  - Bin cannot have children

### 2. Immutable Fields
- `code`, `level`, `parent_id` cannot be changed after creation
- Enforced in update schema and service layer

### 3. Delete Validation
- Cannot delete if location has children
- Cannot delete if location has inventory (when license_plates table exists)
- Returns descriptive error with count

### 4. Tree Operations
- Build nested tree from flat location list
- Query subtree under specific location
- Get ancestor chain (breadcrumb path)
- Get all descendants

### 5. Capacity Tracking
- Denormalized fields: `current_pallets`, `current_weight_kg`
- Calculate capacity percentage based on max values
- Support for both pallet count and weight limits

### 6. Multi-Tenancy
- All queries filtered by `org_id`
- Warehouse ownership verification
- RLS policy enforcement (via database triggers)

---

## Error Handling

### HTTP Status Codes
- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Validation error (invalid input, has children, has inventory)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (warehouse, location)
- `409` - Conflict (duplicate code)
- `500` - Internal server error

### Error Codes
- `UNAUTHORIZED` - Auth failure
- `ORG_NOT_FOUND` - Organization not found
- `WAREHOUSE_NOT_FOUND` - Warehouse not found
- `LOCATION_NOT_FOUND` - Location not found
- `DUPLICATE_CODE` - Code already exists in warehouse
- `INVALID_HIERARCHY` - Invalid parent-child level combination
- `HAS_CHILDREN` - Cannot delete location with children
- `HAS_INVENTORY` - Cannot delete location with inventory

---

## Security Checklist

- [x] All input validated with Zod schemas
- [x] All queries filtered by org_id
- [x] Warehouse ownership verified
- [x] Role-based permissions enforced
- [x] No hardcoded secrets
- [x] Parameterized queries only (via Supabase)
- [x] Auth checks on all endpoints
- [x] Proper error messages (no sensitive data leak)

---

## Database Schema

Using existing migration: `supabase/migrations/061_create_locations_table.sql`

### Table: locations
- Primary key: `id` (UUID)
- Foreign keys: `org_id`, `warehouse_id`, `parent_id`
- Hierarchical fields: `level`, `full_path`, `depth`, `parent_id`
- Capacity fields: `max_pallets`, `max_weight_kg`, `current_pallets`, `current_weight_kg`
- Constraints: unique (org_id, warehouse_id, code)

### Triggers
- `compute_location_full_path()` - Auto-compute path and depth
- `validate_location_hierarchy()` - Enforce hierarchy rules
- `update_locations_updated_at()` - Auto-update timestamp

---

## Testing Recommendations

### Unit Tests Needed
1. `location-service.ts`:
   - [ ] `list()` - tree vs flat view
   - [ ] `create()` - hierarchy validation
   - [ ] `update()` - immutable fields
   - [ ] `deleteLocation()` - validation checks
   - [ ] `validateHierarchy()` - all level combinations
   - [ ] `buildTree()` - tree structure correctness

2. API Routes:
   - [ ] GET `/locations` - query params, tree/flat
   - [ ] POST `/locations` - validation, role checks
   - [ ] PUT `/locations/:id` - immutable fields
   - [ ] DELETE `/locations/:id` - delete validation
   - [ ] GET `/locations/:id/tree` - subtree query

### Integration Tests Needed
1. Full location lifecycle:
   - Create zone
   - Create aisle under zone
   - Create rack under aisle
   - Create bin under rack
   - Update bin
   - Delete bin
   - Try to delete rack with aisle (should fail)

2. Error scenarios:
   - Create zone with parent (should fail)
   - Create bin as root (should fail)
   - Create aisle under rack (should fail)
   - Duplicate code in warehouse (should fail)

---

## Areas for Refactoring (SENIOR-DEV)

1. **Service Layer:**
   - Extract auth/org_id logic to middleware or helper
   - Consolidate repeated Supabase queries
   - Add caching for tree queries (Redis)
   - Optimize buildTree() for large datasets (>1000 locations)

2. **Error Handling:**
   - Create centralized error factory
   - Standardize error response format
   - Add error codes enum

3. **Type Safety:**
   - Create shared ServiceResult<T> type
   - Extract role checking to helper function

4. **Performance:**
   - Add database indexes for common queries
   - Consider materialized view for tree structure
   - Add pagination to list endpoint

---

## Next Steps

1. **Testing Phase:**
   - Write unit tests for service methods
   - Write API integration tests
   - Test hierarchy validation edge cases

2. **Frontend Integration (Track A):**
   - Create location tree components
   - Add create/edit modals
   - Implement drag-and-drop (Phase 2)

3. **Documentation:**
   - Add OpenAPI spec for endpoints
   - Create usage examples
   - Update PRD with implementation notes

---

## Handoff Notes

### What's Working
- All 6 API routes created and functional
- Location service fully refactored with hierarchical operations
- Validation schemas aligned with Story 01.9
- Database schema already exists (migration 061)

### Known Limitations
- Inventory check in `canDelete()` is commented out (license_plates table doesn't exist yet)
- No pagination on list endpoint (should add for large datasets)
- Tree building is in-memory (may need optimization for 1000+ locations)

### Dependencies
- Database migration 061 must be applied
- User role system must be in place
- Warehouse table must exist

---

**Tests Status:** Not Created (needs TEST-DEV)
**Coverage:** N/A
**Ready for:** Test Phase (Story 01.9 Track C)

---

## File Paths (Absolute)

```
C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\lib\types\location.ts
C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\lib\validation\location-schemas.ts
C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\lib\services\location-service.ts
C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\app\api\settings\warehouses\[warehouseId]\locations\route.ts
C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\app\api\settings\warehouses\[warehouseId]\locations\[id]\route.ts
C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\app\api\settings\warehouses\[warehouseId]\locations\[id]\tree\route.ts
```
