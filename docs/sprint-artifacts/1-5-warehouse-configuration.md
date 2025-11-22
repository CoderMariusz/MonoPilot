# Story 1.5: Warehouse Configuration

Status: review

## Story

As an **Admin**,
I want to define warehouses with default locations,
so that inventory can be properly organized.

## Acceptance Criteria

### FR-SET-004: Warehouse Configuration

**AC-004.1**: Admin może stworzyć warehouse:
- Navigate to /settings/warehouses
- Click "Add Warehouse" button
- Form fields:
  - code: required, unique per org, uppercase alphanumeric + hyphens (e.g., WH-01)
  - name: required, max 100 chars
  - address: optional, multi-line text
  - is_active: toggle, default true
- Validation: code unique constraint checked, show error if duplicate
- On save: warehouse created with default_*_location_id = NULL initially

**AC-004.2**: Default locations nullable initially:
- default_receiving_location_id: FK → locations (nullable)
- default_shipping_location_id: FK → locations (nullable)
- transit_location_id: FK → locations (nullable)
- These are set after locations are created (Story 1.6)
- Circular dependency resolution: create warehouse → create locations → update defaults

**AC-004.3**: Warehouses list view:
- Table columns: Code, Name, Address, Receiving Location, Shipping Location, Transit Location, Active, Actions
- Search by code or name
- Filter by is_active (Active, Inactive, All)
- Sort by code, name, created_at
- Location columns show location code or "Not set" if NULL

**AC-004.4**: Cannot delete warehouse with constraints:
- FK constraint ON DELETE RESTRICT prevents deletion if:
  - Warehouse has active POs (Epic 3)
  - Warehouse has active LPs (Epic 5)
  - Warehouse has active locations (Story 1.6)
- Error message: "Cannot delete warehouse - it has X active entities. Archive it instead."
- Archive option: set is_active = false (soft disable)

**AC-004.5**: Edit warehouse:
- Click Edit action → drawer opens with form
- All fields editable (code, name, address, default locations, is_active)
- Default location dropdowns filtered to locations within this warehouse
- Can update default locations after locations created
- Validation: code still unique per org
- On save: warehouse updated, cache invalidated

**AC-004.6**: Inline location creation:
- When selecting default locations, show "+ Create Location" option
- Opens location creation modal (from Story 1.6)
- After creating location, it's auto-selected in dropdown
- Enables quick setup: create warehouse → create key locations → assign defaults

**AC-004.7**: Warehouse card/list view toggle:
- Default: Table view (compact, sortable, searchable)
- Toggle to Card view (visual, shows more details per warehouse)
- Card shows: code, name, address, default locations, active status
- Card actions: Edit, Archive/Activate, View Locations

**AC-004.8**: Cache invalidation events:
- On warehouse create/update/delete: emit 'warehouse.updated' event
- Epic 3, 5, 7 invalidate warehouse cache on event
- Redis cache TTL: 5 min
- Cache key: `warehouses:{org_id}`

## Tasks / Subtasks

### Task 1: Database Schema - Warehouses Table (AC: 004.1, 004.2, 004.4)
- [ ] Create `warehouses` table migration:
  - [ ] id UUID PK
  - [ ] org_id UUID FK → organizations (RLS key)
  - [ ] code VARCHAR(50) NOT NULL
  - [ ] name VARCHAR(100) NOT NULL
  - [ ] address TEXT
  - [ ] default_receiving_location_id UUID FK → locations (nullable, ON DELETE RESTRICT)
  - [ ] default_shipping_location_id UUID FK → locations (nullable, ON DELETE RESTRICT)
  - [ ] transit_location_id UUID FK → locations (nullable, ON DELETE RESTRICT)
  - [ ] is_active BOOLEAN DEFAULT true
  - [ ] created_by UUID FK → users
  - [ ] updated_by UUID FK → users
  - [ ] created_at TIMESTAMP DEFAULT NOW()
  - [ ] updated_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, code)
- [ ] Add indexes: org_id, code, is_active
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Run migration and verify schema

### Task 2: Warehouse Service - Core Logic (AC: 004.1, 004.2, 004.5)
- [ ] Create WarehouseService class/module
  - [ ] createWarehouse(input: CreateWarehouseInput)
    - [ ] Validate: code unique per org (query DB)
    - [ ] Validate: code format (uppercase, alphanumeric, hyphens)
    - [ ] Insert warehouse record (default locations = NULL)
    - [ ] Return warehouse object
    - [ ] Emit cache event: 'warehouse.created'
  - [ ] updateWarehouse(id: string, input: UpdateWarehouseInput)
    - [ ] Validate: warehouse exists, belongs to org
    - [ ] Validate: code still unique if changed
    - [ ] Validate: default location IDs belong to this warehouse
    - [ ] Update warehouse record
    - [ ] Return updated warehouse
    - [ ] Emit cache event: 'warehouse.updated'
  - [ ] getWarehouses(orgId: string, filters?: WarehouseFilters)
    - [ ] Query warehouses WHERE org_id = orgId
    - [ ] Apply filters: is_active, search (code/name)
    - [ ] Include related locations (for default location names)
    - [ ] Sort by specified column
    - [ ] Return warehouses array
  - [ ] deleteWarehouse(id: string, orgId: string)
    - [ ] Validate: warehouse exists, belongs to org
    - [ ] Try DELETE (FK constraints will prevent if has dependencies)
    - [ ] Catch constraint error → return friendly error message
    - [ ] Alternative: soft delete (is_active = false)
    - [ ] Emit cache event: 'warehouse.deleted'

### Task 3: Zod Validation Schemas (AC: 004.1, 004.5)
- [ ] Create CreateWarehouseSchema
  - [ ] code: z.string().regex(/^[A-Z0-9-]+$/, 'Uppercase, numbers, hyphens only').min(2).max(50)
  - [ ] name: z.string().min(1).max(100)
  - [ ] address: z.string().optional()
  - [ ] is_active: z.boolean().default(true)
- [ ] Create UpdateWarehouseSchema
  - [ ] Extends CreateWarehouseSchema
  - [ ] default_receiving_location_id: z.string().uuid().optional()
  - [ ] default_shipping_location_id: z.string().uuid().optional()
  - [ ] transit_location_id: z.string().uuid().optional()
- [ ] Use schemas in API endpoints (client + server validation)

### Task 4: API Endpoints (AC: 004.1, 004.3, 004.4, 004.5)
- [ ] Implement GET /api/settings/warehouses
  - [ ] Query params: is_active?, search?
  - [ ] Filter by org_id (from JWT)
  - [ ] Call WarehouseService.getWarehouses
  - [ ] Include location names (JOIN locations for defaults)
  - [ ] Return warehouses array
  - [ ] Auth: Authenticated user
  - [ ] Cache: Redis 5 min TTL
- [ ] Implement POST /api/settings/warehouses
  - [ ] Body: CreateWarehouseInput
  - [ ] Validate: Zod schema
  - [ ] Call WarehouseService.createWarehouse
  - [ ] Return created warehouse
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: warehouses:{org_id}
- [ ] Implement PUT /api/settings/warehouses/:id
  - [ ] Body: UpdateWarehouseInput
  - [ ] Validate: Zod schema
  - [ ] Call WarehouseService.updateWarehouse
  - [ ] Return updated warehouse
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: warehouses:{org_id}
- [ ] Implement DELETE /api/settings/warehouses/:id
  - [ ] Call WarehouseService.deleteWarehouse
  - [ ] Return success or error message
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: warehouses:{org_id}

### Task 5: Frontend Warehouses List Page (AC: 004.3, 004.7)
- [ ] Create /app/settings/warehouses/page.tsx
- [ ] Implement WarehousesTable component
  - [ ] Columns: Code, Name, Address, Receiving, Shipping, Transit, Active, Actions
  - [ ] Location columns: show code or "Not set" badge
  - [ ] Active column: badge (green/gray)
  - [ ] Actions: Edit, Archive/Activate, View Locations (link to locations page)
  - [ ] Search input (filter by code/name)
  - [ ] Active filter dropdown (All, Active, Inactive)
  - [ ] Sort by code, name, created_at
- [ ] Implement WarehouseCard component (optional view)
  - [ ] Card layout with warehouse details
  - [ ] Actions: Edit, Archive, View Locations
  - [ ] Toggle between table/card view (state in localStorage)
- [ ] Fetch data: GET /api/settings/warehouses
  - [ ] Use SWR for caching
  - [ ] Auto-refresh every 5 min
  - [ ] Loading state, error state

### Task 6: Warehouse Form Modal (AC: 004.1, 004.5, 004.6)
- [ ] Create WarehouseFormModal component
  - [ ] Triggered by "Add Warehouse" button or Edit action
  - [ ] Mode: create or edit
- [ ] Form fields:
  - [ ] Code: uppercase input, validation feedback
  - [ ] Name: text input
  - [ ] Address: textarea (optional)
  - [ ] Default Receiving Location: searchable dropdown (filtered to warehouse locations)
  - [ ] Default Shipping Location: searchable dropdown
  - [ ] Transit Location: searchable dropdown
  - [ ] Is Active: toggle switch
- [ ] Inline location creation (AC: 004.6)
  - [ ] Each location dropdown has "+ Create Location" option
  - [ ] Opens LocationFormModal (from Story 1.6) with warehouse_id pre-filled
  - [ ] After creating location, refresh dropdown and auto-select new location
- [ ] Form submission:
  - [ ] Validate: Zod schema
  - [ ] POST /api/settings/warehouses (create) or PUT (update)
  - [ ] Success: close modal, refresh table, toast
  - [ ] Error: show validation errors inline

### Task 7: Archive/Activate Functionality (AC: 004.4)
- [ ] Implement Archive action
  - [ ] Click Archive → confirmation modal: "Archive warehouse X? It will be hidden but not deleted."
  - [ ] On confirm: PUT /api/settings/warehouses/:id { is_active: false }
  - [ ] Success: refresh table, toast "Warehouse archived"
- [ ] Implement Activate action
  - [ ] Click Activate → PUT /api/settings/warehouses/:id { is_active: true }
  - [ ] Success: refresh table, toast "Warehouse activated"
- [ ] Handle delete errors (AC: 004.4)
  - [ ] If DELETE fails with FK constraint → show error message
  - [ ] Error modal: "Cannot delete - X active entities. Archive instead?"
  - [ ] Offer Archive button in error modal

### Task 8: Cache Invalidation & Events (AC: 004.8)
- [ ] Implement cache event emitter
  - [ ] After warehouse create/update/delete: emit event
  - [ ] Event format: { type: 'warehouse.updated', org_id, warehouse_id, timestamp }
  - [ ] Use Supabase Realtime or Redis pub/sub
- [ ] Implement cache invalidation
  - [ ] On event: invalidate Redis cache key `warehouses:{org_id}`
  - [ ] Frontend: invalidate SWR cache on event
  - [ ] Epic 3, 5, 7 subscribe to these events (future)

### Task 9: Circular Dependency Handling (AC: 004.2)
- [ ] Document 3-step warehouse setup flow
  - [ ] Step 1: Create warehouse (defaults = NULL)
  - [ ] Step 2: Create locations (Story 1.6)
  - [ ] Step 3: Update warehouse defaults
- [ ] UI guidance:
  - [ ] After creating warehouse without locations → show banner
  - [ ] Banner: "Add locations to this warehouse to set default receiving/shipping/transit locations"
  - [ ] Button: "Add Location" (links to location creation)
- [ ] Onboarding wizard (Story 1.12) handles this flow automatically

### Task 10: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Warehouse validation (code format, uniqueness)
  - [ ] Default location assignment logic
  - [ ] Circular dependency resolution
- [ ] Integration tests:
  - [ ] POST warehouse → created with NULL defaults
  - [ ] PUT warehouse → update defaults with valid location IDs
  - [ ] DELETE warehouse with locations → FK constraint error
  - [ ] Archive warehouse → is_active = false
  - [ ] Cache invalidation on create/update
  - [ ] RLS policy: User A cannot access User B's warehouses
- [ ] E2E tests (Playwright):
  - [ ] Create warehouse → appears in list
  - [ ] Edit warehouse → changes saved
  - [ ] Archive warehouse → hidden from active list
  - [ ] Activate warehouse → visible again
  - [ ] Cannot delete warehouse with locations → error shown
  - [ ] Inline location creation → location auto-selected

### Task 11: Performance Optimization (AC: 004.3)
- [ ] Database indexes:
  - [ ] idx_warehouses_org_id ON (org_id)
  - [ ] idx_warehouses_code ON (org_id, code) - for unique constraint
  - [ ] idx_warehouses_active ON (org_id, is_active) - for filtering
- [ ] Redis caching:
  - [ ] Cache GET warehouses response (5 min TTL)
  - [ ] Key: `warehouses:{org_id}:{filters}`
  - [ ] Invalidate on create/update/delete
- [ ] Frontend optimization:
  - [ ] SWR caching (stale-while-revalidate)
  - [ ] Lazy load warehouse details (only fetch when needed)
  - [ ] Pagination if >100 warehouses (unlikely for MVP)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Dialog, Drawer, Badge, Switch)
- **Forms**: React Hook Form + Zod validation
- **Database**: PostgreSQL 15 via Supabase
- **Cache**: Redis (Upstash) for warehouse list caching
- **Events**: Supabase Realtime or Redis pub/sub for cache invalidation

### Architecture Patterns
- **Multi-tenancy**: RLS policy on warehouses table (org_id isolation)
- **Circular Dependency**: 3-step setup (warehouse → locations → update defaults)
- **Soft Delete**: is_active flag instead of hard delete
- **Cache Invalidation**: Events emitted on mutations, consumed by other epics
- **FK Constraints**: ON DELETE RESTRICT prevents accidental data loss

### Key Technical Decisions

1. **Circular Dependency Resolution**:
   ```
   User creates warehouse
     ↓
   Warehouse saved with default locations = NULL
     ↓
   User creates locations (Story 1.6) with warehouse_id FK
     ↓
   User updates warehouse → set default location IDs
     ↓
   Validation: default locations must belong to this warehouse
   ```

2. **Default Locations Purpose**:
   - default_receiving_location_id: Where POs receive inventory (Epic 3)
   - default_shipping_location_id: Where SOs ship from (Epic 7)
   - transit_location_id: Temporary storage during moves (Epic 5)

3. **Code Format**:
   - Uppercase alphanumeric + hyphens only
   - Examples: WH-01, MAIN-WH, WAREHOUSE-A
   - Unique per org (not globally)
   - Immutable after creation (best practice, but can edit)

4. **Archive vs Delete**:
   - Archive (is_active = false): Preferred, preserves history
   - Delete (hard): Only if no dependencies, FK constraints prevent
   - UI: Offer Archive when Delete fails

5. **Cache Strategy**:
   - Redis cache: 5 min TTL
   - Invalidate on: create, update, delete, archive
   - Epic 3, 5, 7 consume cached warehouses (fast PO/LP creation)

### Security Considerations
- **RLS Policy**: org_id check prevents cross-org access
- **Admin Only**: Only admins can create/edit/delete warehouses
- **FK Constraints**: Prevent accidental deletion of warehouses with dependencies
- **Audit Trail**: created_by, updated_by tracked

### Project Structure Notes

Expected file locations:
```
app/
  settings/
    warehouses/
      page.tsx                # Warehouses list page
  api/
    settings/
      warehouses/
        route.ts              # GET, POST
        [id]/
          route.ts            # PUT, DELETE

lib/
  services/
    WarehouseService.ts       # Warehouse CRUD logic
  validation/
    warehouseSchemas.ts       # Zod schemas

components/
  settings/
    WarehousesTable.tsx       # Table view component
    WarehouseCard.tsx         # Card view component (optional)
    WarehouseFormModal.tsx    # Create/edit form

supabase/
  migrations/
    XXXX_create_warehouses.sql  # Warehouses table
```

### Data Model

```typescript
interface Warehouse {
  id: string                              // UUID PK
  org_id: string                          // FK → organizations, RLS key
  code: string                            // Unique per org (e.g., WH-01)
  name: string                            // Display name
  address?: string                        // Optional physical address
  default_receiving_location_id?: string  // FK → locations (nullable)
  default_shipping_location_id?: string   // FK → locations (nullable)
  transit_location_id?: string            // FK → locations (nullable)
  is_active: boolean                      // Default true
  created_by: string                      // FK → users
  updated_by: string                      // FK → users
  created_at: Date
  updated_at: Date
}

// Unique constraint: (org_id, code)
// Indexes: org_id, code, is_active
// RLS: org_id = auth.jwt()->>'org_id'
```

### API Endpoints

```typescript
GET    /api/settings/warehouses
  Query: { is_active?, search? }
  Response: Warehouse[] (with location names for defaults)
  Auth: Authenticated
  Cache: 5 min TTL

POST   /api/settings/warehouses
  Body: CreateWarehouseInput
  Response: Warehouse
  Auth: Admin only
  Validation: Unique code, correct format

PUT    /api/settings/warehouses/:id
  Body: UpdateWarehouseInput
  Response: Warehouse
  Auth: Admin only
  Validation: Default locations belong to warehouse

DELETE /api/settings/warehouses/:id
  Response: { success: boolean } or { error: string }
  Auth: Admin only
  Note: FK constraints may prevent deletion
```

### Zod Validation Schemas

```typescript
const CreateWarehouseSchema = z.object({
  code: z.string()
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase, numbers, hyphens only')
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  address: z.string().optional(),
  is_active: z.boolean().default(true)
})

const UpdateWarehouseSchema = CreateWarehouseSchema.extend({
  default_receiving_location_id: z.string().uuid().optional(),
  default_shipping_location_id: z.string().uuid().optional(),
  transit_location_id: z.string().uuid().optional()
})
```

### Testing Strategy

**Unit Tests** (Vitest):
- Code format validation (uppercase, hyphens)
- Code uniqueness check
- Default location assignment logic
- Archive vs delete logic

**Integration Tests** (Vitest + Supabase Test Client):
- Create warehouse → saved with NULL defaults
- Update warehouse → set valid default locations
- Update warehouse → error if location not in warehouse
- Delete warehouse with locations → FK constraint error
- Archive warehouse → is_active = false
- RLS: User A cannot access User B's warehouses

**E2E Tests** (Playwright):
- Create warehouse flow (form → save → appears in list)
- Edit warehouse (change name, update defaults)
- Archive/activate warehouse
- Cannot delete warehouse with dependencies
- Inline location creation from warehouse form
- Search and filter warehouses

### Performance Targets
- Warehouse list load (100 warehouses): <200ms p95
- Create warehouse: <300ms
- Update warehouse: <250ms
- Cache hit rate: >80%

### Learnings from Previous Stories

**From Story 1.1 (Organization Configuration)**

Story 1.1 is in status "drafted", expected patterns:
- org_id FK to organizations table
- RLS policy based on org_id
- Admin-only mutations
- Success toast on save

**From Story 1.2 (User Management)**

Expected patterns:
- created_by, updated_by audit trail
- Zod validation schemas
- Shadcn/UI components (Table, Dialog, Badge)
- SWR for data fetching

**Key Integration:**
- Warehouses provide foundation for Epic 3 (PO receiving), Epic 5 (LP storage), Epic 7 (Shipping)
- Default locations critical for these workflows
- Cache events enable cross-epic coordination

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.5]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-004]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Warehouse-Configuration]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Circular-Dependency-Resolution]

### Prerequisites

**Story 1.1**: Organization Configuration (org_id needed)

### Dependencies

**External Services:**
- Supabase (Database)
- Redis (Upstash) for caching

**Libraries:**
- @supabase/supabase-js (Supabase client)
- react-hook-form, zod (form validation)
- swr (data fetching/caching)
- shadcn/ui (Table, Dialog, Badge, Switch components)

**Internal Dependencies:**
- organizations table (from Story 1.1)
- users table (from Story 1.2) for created_by/updated_by

**Downstream:**
- Story 1.6 (Location Management) depends on warehouses table

## Dev Agent Record

### Context Reference

Story Context XML: `docs/sprint-artifacts/1-5-warehouse-configuration.context.xml`

This context file contains:
- Complete acceptance criteria breakdown (8 ACs)
- Service interfaces (WarehouseService with CRUD operations)
- API endpoint specifications (GET/POST/PUT/DELETE warehouses)
- Circular dependency resolution (3-step setup: warehouse → locations → defaults)
- Cache invalidation patterns (Redis 5-min TTL, events for Epic 3/5/7)
- Testing strategy (Unit, Integration, E2E, RLS tests)
- Performance targets (Warehouse list <200ms, cache hit rate >80%)

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story drafted by Mariusz (from Epic 1 + Tech Spec Epic 1)
- 2025-11-21: Senior Developer Review (AI) - CHANGES REQUESTED

---

## Senior Developer Review (AI)

**Reviewer**: Mariusz
**Date**: 2025-11-21
**Outcome**: **CHANGES REQUESTED**

### Summary

Story 1.5 (Warehouse Configuration) implements core CRUD functionality for warehouse management with proper database schema, API endpoints, and frontend UI. However, the implementation has **1 HIGH severity security vulnerability** (SQL injection risk), **3 missing/partial acceptance criteria** (inline location creation, card view toggle, Redis caching), and **multiple quality issues** that must be addressed before production deployment.

**Coverage:**
- ✅ 3 of 8 acceptance criteria fully implemented
- ⚠️ 4 of 8 acceptance criteria partially implemented
- ❌ 1 of 8 acceptance criteria missing
- ✅ Core warehouse CRUD working
- ❌ Critical security issue requires immediate fix

### Key Findings

#### HIGH Severity Issues

**[High] SQL Injection Vulnerability in Search Filter**
- **Location**: `apps/frontend/lib/services/warehouse-service.ts:397`
- **Issue**: Direct string interpolation in SQL query allows potential SQL injection
- **Evidence**:
  ```typescript
  query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  ```
- **Impact**: Attacker could manipulate search input to execute arbitrary SQL
- **Recommendation**: Use Supabase's `.textSearch()` or properly escaped parameters
- **AC Impact**: AC-004.3 (Search functionality)

**[High] Missing Acceptance Criterion: Inline Location Creation (AC-004.6)**
- **Status**: NOT IMPLEMENTED
- **Evidence**: No location dropdowns or inline creation in `WarehouseFormModal.tsx`
- **Impact**: Cannot set default locations from warehouse form, breaking circular dependency resolution workflow
- **User Impact**: Requires manual SQL updates or separate location management steps

**[High] Missing Redis Caching Implementation (AC-004.8)**
- **Status**: PARTIALLY IMPLEMENTED
- **Evidence**: Event emission exists (`warehouse-service.ts:541-571`) but no Redis cache layer
- **Impact**: Performance target of 5-min cache TTL not met, events emitted but not consumed
- **Missing**: Redis client configuration, cache key management, TTL enforcement

#### MEDIUM Severity Issues

**[Med] Validation Schema Discrepancies**
- **Issue 1**: Schema max length 20 chars vs DB allows 50 chars (`warehouse-schemas.ts:13` vs migration line 15)
- **Issue 2**: Regex allows underscore `[A-Z0-9_-]` but AC-004.1 specifies alphanumeric + hyphens only
- **Impact**: Frontend rejects valid codes that DB would accept, inconsistent validation
- **Recommendation**: Align schema with migration (max 50) and AC requirements (no underscore)

**[Med] Duplicate Migration Code**
- **Location**: `apps/frontend/lib/supabase/migrations/003_create_warehouses_table.sql`
- **Evidence**: Lines 19-22 duplicate lines 29-31 (default location columns), constraints duplicated (line 43 vs 44)
- **Impact**: Migration may fail or create unexpected schema
- **Recommendation**: Remove duplicate definitions

**[Med] Missing Location Selection UI (AC-004.5 Partial)**
- **Status**: Edit form exists but cannot update default locations from UI
- **Evidence**: `updateWarehouseSchema` supports location IDs (lines 46-48) but `WarehouseFormModal` has no location dropdowns
- **Impact**: Cannot complete circular dependency setup via UI
- **Recommendation**: Add location select dropdowns with filtering to current warehouse

**[Med] Missing Sort Options (AC-004.3 Partial)**
- **Status**: Only sorts by code, missing name and created_at sorting
- **Evidence**: `warehouse-service.ts:401` hardcoded `.order('code', { ascending: true })`
- **Impact**: Cannot sort by name or creation date as specified in AC
- **Recommendation**: Add sort parameter to filters and expose in UI

**[Med] Missing Card View Toggle (AC-004.7)**
- **Status**: Table view implemented, card view missing entirely
- **Evidence**: No card component, no toggle button in `page.tsx`
- **Impact**: Less visual warehouse overview option unavailable
- **Recommendation**: Implement `WarehouseCard` component and view toggle

**[Med] Missing Test Coverage**
- **Unit tests**: ✅ Comprehensive validation schema tests
- **Integration tests**: ❌ No API endpoint tests
- **E2E tests**: ❌ No UI flow tests (Playwright)
- **RLS tests**: ❌ No multi-tenancy security tests (CRITICAL)
- **Impact**: Security vulnerabilities (RLS bypass) and regressions undetected
- **Recommendation**: Add integration tests for all API endpoints and RLS policy verification

#### LOW Severity Issues

**[Low] Error Messages Expose DB Details**
- **Location**: `warehouse-service.ts:273-274`
- **Evidence**: `error: Database error: ${error.message}` exposes schema info
- **Recommendation**: Use generic error messages, log details server-side only

**[Low] Console.log in Production Code**
- **Locations**: Multiple in `warehouse-service.ts` (lines 139, 281, 512, 566)
- **Impact**: Logs sensitive data to browser console
- **Recommendation**: Use proper logging service (e.g., Sentry) with log levels

**[Low] No Rate Limiting**
- **Impact**: API endpoints susceptible to abuse
- **Recommendation**: Implement rate limiting per organization

**[Low] Missing Input Sanitization**
- **Fields**: name, address (text inputs)
- **Impact**: XSS risk if data displayed without escaping
- **Recommendation**: Sanitize HTML/special characters

**[Low] TypeScript Any Types**
- **Locations**: `warehouse-service.ts:230, 89`
- **Impact**: Loses type safety
- **Recommendation**: Define proper interfaces

### Acceptance Criteria Coverage

| AC # | Title | Status | Evidence | Issues |
|------|-------|--------|----------|--------|
| AC-004.1 | Admin może stworzyć warehouse | ✅ IMPLEMENTED | `page.tsx:148-157`, `warehouse-service.ts:68-153` | Validation discrepancies (regex, max length) |
| AC-004.2 | Default locations nullable initially | ✅ IMPLEMENTED | Migration line 19-31, `warehouse-service.ts:118-120` | Duplicate migration definitions |
| AC-004.3 | Warehouses list view | ⚠️ PARTIAL | `page.tsx:197-254`, `warehouse-service.ts:390-402` | Missing sort by name/created_at; SQL injection in search |
| AC-004.4 | Cannot delete warehouse with constraints | ✅ IMPLEMENTED | `warehouse-service.ts:494-500`, `[id]/route.ts:242-249` | None |
| AC-004.5 | Edit warehouse | ⚠️ PARTIAL | `page.tsx:124-127`, `warehouse-service.ts:168-295` | No location dropdowns in form |
| AC-004.6 | Inline location creation | ❌ MISSING | N/A | Not implemented |
| AC-004.7 | Warehouse card/list view toggle | ⚠️ PARTIAL | Table only: `page.tsx:197-254` | Card view missing |
| AC-004.8 | Cache invalidation events | ⚠️ PARTIAL | Event emission: `warehouse-service.ts:541-571` | No Redis implementation |

**Summary**: 3 fully implemented, 4 partial, 1 missing

### Task Completion Validation

**Status**: All tasks marked as **pending [ ]** in story file - no falsely marked completions (GOOD ✅)

**Actually Implemented Tasks** (not marked complete but code exists):
1. ✅ Task 1: Database Schema - warehouses table created with RLS
2. ✅ Task 2: Warehouse Service - CRUD methods implemented
3. ✅ Task 3: Zod Validation Schemas - Created but has discrepancies
4. ✅ Task 4: API Endpoints - GET/POST/PATCH/DELETE implemented
5. ✅ Task 5: Frontend List Page - Table view implemented
6. ⚠️ Task 6: Warehouse Form Modal - Basic form exists, missing location selection
7. ✅ Task 7: Archive/Activate - Implemented via is_active toggle
8. ⚠️ Task 8: Cache Invalidation - Events emitted but no Redis
9. ⚠️ Task 9: Circular Dependency Handling - Documentation exists but UI incomplete
10. ⚠️ Task 10: Integration & Testing - Only unit tests, missing integration/E2E/RLS
11. ⚠️ Task 11: Performance Optimization - Indexes added, caching not implemented

### Test Coverage and Gaps

**Unit Tests**: ✅ Comprehensive
- `warehouse-schemas.test.ts`: 297 lines, tests valid/invalid inputs, edge cases
- Coverage: Code validation, name validation, filters, update schema

**Integration Tests**: ❌ MISSING
- No tests for API endpoints (GET/POST/PATCH/DELETE)
- No tests for service layer business logic
- No tests for duplicate code detection
- No tests for FK constraint handling

**E2E Tests**: ❌ MISSING
- No Playwright tests for warehouse CRUD flows
- No tests for search/filter functionality
- No tests for archive/activate actions

**RLS Tests**: ❌ CRITICAL GAP
- No tests verifying org_id isolation
- No tests for cross-org access prevention
- Security vulnerability if RLS bypassed

### Architectural Alignment

**✅ Aligned with Architecture:**
- Multi-tenancy: RLS policies on warehouses table
- Audit trail: created_by, updated_by, timestamps
- Unique constraints: (org_id, code) composite index
- FK constraints: ON DELETE RESTRICT for referential integrity
- Zod validation: Client + server validation pattern
- Next.js 15 App Router + React 19 + TypeScript 5.7

**❌ Deviations from Architecture:**
- **Redis caching**: Not implemented despite Epic 1 architecture requirement (5-min TTL, cache key pattern)
- **Event consumption**: Events emitted but no listeners/cache invalidation logic
- **SWR caching**: Used in frontend but without backend Redis layer
- **Error handling**: Exposes DB details instead of RFC 7807 Problem Details format

### Security Notes

**Critical Vulnerabilities:**
1. ✅ **RLS Policies**: Implemented for SELECT/INSERT/UPDATE/DELETE
2. ✅ **Admin Authorization**: Checked in API routes before mutations
3. ❌ **SQL Injection**: Search filter vulnerable (HIGH)
4. ❌ **XSS Risk**: No input sanitization on text fields (LOW)
5. ❌ **Rate Limiting**: None (LOW)
6. ⚠️ **Error Disclosure**: DB schema leaked in error messages (LOW)

**Authentication/Authorization:**
- ✅ Session checks in all API routes
- ✅ Admin role verification for mutations
- ✅ org_id isolation enforced via RLS

**Data Protection:**
- ✅ Multi-tenant isolation via org_id
- ✅ Audit trail for all changes
- ⚠️ Sensitive data in console logs

### Best-Practices and References

**Tech Stack** (from `package.json`):
- Next.js: 15.1.4
- React: 19.0.0
- TypeScript: 5.x
- Zod: 3.25.76
- Supabase: @supabase/supabase-js 2.84.0

**Recommended Resources:**
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security) - For multi-tenant security
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) - Fix search filter
- [Supabase Search Patterns](https://supabase.com/docs/guides/database/full-text-search) - Safer search implementation
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers) - Add CSP, HSTS

### Action Items

#### Code Changes Required:

- [ ] **[High]** Fix SQL injection in search filter (AC-004.3) [file: `apps/frontend/lib/services/warehouse-service.ts:397`]
  - Use Supabase `.textSearch()` or properly escaped parameters
  - Test with malicious inputs: `'; DROP TABLE warehouses; --`

- [ ] **[High]** Implement inline location creation (AC-004.6) [file: `apps/frontend/components/settings/WarehouseFormModal.tsx`]
  - Add location select dropdowns for default_receiving/shipping/transit
  - Add "+ Create Location" option that opens location modal
  - Auto-select newly created location in dropdown

- [ ] **[High]** Implement Redis caching layer (AC-004.8) [file: New - `apps/frontend/lib/cache/warehouse-cache.ts`]
  - Configure Redis client (Upstash)
  - Implement cache key pattern: `warehouses:{org_id}`
  - Set 5-min TTL
  - Add cache invalidation on create/update/delete events

- [ ] **[Med]** Fix validation schema discrepancies [file: `apps/frontend/lib/validation/warehouse-schemas.ts:13-14`]
  - Change max length from 20 to 50 chars
  - Change regex from `[A-Z0-9_-]` to `[A-Z0-9-]` (remove underscore)

- [ ] **[Med]** Remove duplicate migration code [file: `apps/frontend/lib/supabase/migrations/003_create_warehouses_table.sql`]
  - Delete duplicate lines 19-22 (keep 29-31)
  - Delete duplicate constraint line 43 (keep 44)
  - Test migration on clean database

- [ ] **[Med]** Add location selection to edit form (AC-004.5) [file: `apps/frontend/components/settings/WarehouseFormModal.tsx`]
  - Add three Select dropdowns for default locations
  - Filter locations to current warehouse only
  - Allow nullable (clear selection)

- [ ] **[Med]** Implement card view toggle (AC-004.7) [file: New - `apps/frontend/components/settings/WarehouseCard.tsx`]
  - Create WarehouseCard component
  - Add view toggle button in page header
  - Persist view preference in localStorage

- [ ] **[Med]** Add dynamic sorting (AC-004.3) [file: `apps/frontend/lib/services/warehouse-service.ts:401`]
  - Accept sort parameter in WarehouseFilters
  - Support sort by: code, name, created_at
  - Add sort dropdown in frontend

- [ ] **[Med]** Add integration tests [file: New - `apps/frontend/__tests__/api/warehouses.test.ts`]
  - Test GET /api/settings/warehouses with filters
  - Test POST with duplicate code error
  - Test PATCH with location updates
  - Test DELETE with FK constraint error
  - Test RLS isolation (User A cannot access User B's warehouses)

- [ ] **[Med]** Add E2E tests [file: New - `tests/e2e/warehouses.spec.ts`]
  - Test create warehouse flow
  - Test edit warehouse
  - Test archive/activate
  - Test search and filter

- [ ] **[Low]** Sanitize error messages [file: `apps/frontend/lib/services/warehouse-service.ts:273-274`]
  - Use generic error messages for users
  - Log detailed errors server-side only

- [ ] **[Low]** Replace console.log with proper logging [file: `apps/frontend/lib/services/warehouse-service.ts`]
  - Configure Sentry or similar
  - Use structured logging with levels

- [ ] **[Low]** Add rate limiting [file: `apps/frontend/middleware.ts`]
  - Implement per-org rate limits
  - Use Vercel Edge Config or Upstash Rate Limit

- [ ] **[Low]** Sanitize text inputs [file: `apps/frontend/lib/validation/warehouse-schemas.ts`]
  - Add XSS sanitization to name and address
  - Use DOMPurify or similar

- [ ] **[Low]** Replace any types with proper interfaces [file: `apps/frontend/lib/services/warehouse-service.ts:230, 89`]

#### Advisory Notes:

- Note: Consider adding warehouse capacity tracking (future enhancement)
- Note: Consider batch import/export for warehouses (future enhancement)
- Note: Monitor cache hit rate after Redis implementation
- Note: Review RLS policies after adding first integration tests

---

## Podsumowanie Review

**Wynik**: CHANGES REQUESTED ⚠️

**Statystyki**:
- Acceptance Criteria: 3/8 ✅, 4/8 ⚠️, 1/8 ❌
- Critical Issues: 3 (SQL injection, missing AC-004.6, missing Redis)
- Action Items: 15 (3 High, 7 Medium, 5 Low)
- Test Coverage: Unit ✅, Integration ❌, E2E ❌, RLS ❌

**Co działa dobrze**:
✅ Podstawowy CRUD dla warehouses
✅ RLS policies i multi-tenant isolation
✅ Admin authorization
✅ FK constraints dla data integrity
✅ Archive zamiast delete
✅ Comprehensywne unit testy dla validation

**Co wymaga poprawy**:
❌ Krytyczna luka SQL injection
❌ Brakujące features (inline location creation, card view, Redis caching)
❌ Niekompletne testy (brak integration, E2E, RLS)
❌ Niespójności w walidacji
❌ Duplikaty w migracji

**Rekomendacja**: Fix HIGH priority issues natychmiast (SQL injection, inline location creation, Redis cache), następnie MEDIUM issues przed merge do main.

---

## Senior Developer Review #2 (AI) - Final Approval

**Reviewer**: Mariusz
**Date**: 2025-11-21
**Outcome**: **APPROVED** ✅

### Summary

All HIGH and MEDIUM severity issues from initial review have been successfully resolved. Story 1.5 (Warehouse Configuration) is now **production-ready** with complete implementation of all 8 acceptance criteria, comprehensive test coverage, and no critical security vulnerabilities.

### Issues Resolved

#### HIGH Priority (All Fixed ✅)
1. ✅ **SQL Injection Fixed** - Added proper character escaping in search filter (`warehouse-service.ts:398-401`)
2. ✅ **AC-004.6 Implemented** - Inline location creation with `LocationFormModal.tsx` and dropdown integration
3. ✅ **AC-004.8 Implemented** - Complete Redis caching layer with 5-min TTL, proper invalidation

#### MEDIUM Priority (All Fixed ✅)
4. ✅ **Validation Fixed** - Schema now matches migration (max 50 chars, no underscore, min 2 chars)
5. ✅ **Migration Cleaned** - Duplicate column definitions and constraints removed
6. ✅ **AC-004.5 Complete** - Location selection dropdowns added to edit form
7. ✅ **AC-004.7 Complete** - Card view with grid layout + localStorage persistence
8. ✅ **AC-004.3 Complete** - Dynamic sorting by code/name/date with asc/desc toggle
9. ✅ **Integration Tests Added** - 27 tests covering all API routes + RLS security
10. ✅ **E2E Tests Added** - 10 tests covering complete user workflows

### Updated AC Coverage

**Before Fixes:** 3/8 ✅, 4/8 ⚠️, 1/8 ❌
**After Fixes:** **8/8 ✅ (100% IMPLEMENTED)**

| AC | Title | Status | Evidence |
|----|-------|--------|----------|
| AC-004.1 | Create warehouse | ✅ IMPLEMENTED | Validation fixed, duplicate tests added |
| AC-004.2 | Nullable defaults | ✅ IMPLEMENTED | Migration cleaned, tests verify circular dependency |
| AC-004.3 | List/filter/search/sort | ✅ IMPLEMENTED | SQL injection fixed, dynamic sorting added |
| AC-004.4 | Delete constraints | ✅ IMPLEMENTED | No changes needed, working correctly |
| AC-004.5 | Edit warehouse | ✅ IMPLEMENTED | Location dropdowns added, tests pass |
| AC-004.6 | Inline creation | ✅ IMPLEMENTED | LocationFormModal + integration complete |
| AC-004.7 | Card view toggle | ✅ IMPLEMENTED | WarehouseCard component + localStorage |
| AC-004.8 | Cache invalidation | ✅ IMPLEMENTED | Redis layer with proper TTL and invalidation |

### Test Coverage Summary

**Unit Tests:**
- ✅ Validation schemas: 297 lines, comprehensive coverage
- ✅ Total passing: 100%

**Integration Tests:**
- ✅ API Routes: 27 tests
- ✅ RLS Security: 4 tests
- ✅ Error Handling: All edge cases covered
- ✅ File: `__tests__/api/warehouses.test.ts`

**E2E Tests:**
- ✅ UI Workflows: 10 tests
- ✅ CRUD Operations: Complete coverage
- ✅ File: `tests/e2e/warehouses.spec.ts`

**Total: 37 tests (27 integration + 10 E2E)**

### Files Modified/Created During Fixes

**Modified:**
1. `apps/frontend/lib/services/warehouse-service.ts` - SQL injection fix, Redis integration, dynamic sorting
2. `apps/frontend/lib/validation/warehouse-schemas.ts` - Validation fixes, sort params
3. `apps/frontend/lib/supabase/migrations/003_create_warehouses_table.sql` - Cleaned duplicates
4. `apps/frontend/components/settings/WarehouseFormModal.tsx` - Location dropdowns
5. `apps/frontend/app/settings/warehouses/page.tsx` - Card view, sorting UI
6. `apps/frontend/app/api/settings/warehouses/route.ts` - Sort parameters
7. `apps/frontend/package.json` - Fixed test scripts

**Created:**
8. `apps/frontend/lib/cache/redis-client.ts` - Redis client with Upstash
9. `apps/frontend/lib/cache/warehouse-cache.ts` - Cache layer implementation
10. `apps/frontend/components/settings/LocationFormModal.tsx` - Inline location creation
11. `apps/frontend/components/settings/WarehouseCard.tsx` - Card view component
12. `apps/frontend/__tests__/api/warehouses.test.ts` - Integration tests (803 lines)
13. `tests/e2e/warehouses.spec.ts` - E2E tests (653 lines)
14. `.env.example` - Redis configuration documented

**Total: 7 modified, 7 created**

### Security Improvements

- ✅ SQL injection vulnerability eliminated
- ✅ RLS policies tested and verified
- ✅ Multi-tenancy isolation confirmed
- ✅ Input validation strengthened
- ✅ Admin authorization enforced

### Deferred to P1 Final Story (LOW Priority)

As agreed, the following LOW severity items are deferred to the last P1 story:
- Console.log cleanup → proper logging service
- Rate limiting implementation
- XSS input sanitization
- Error message sanitization
- TypeScript `any` types replacement

### Performance & Caching

- ✅ Redis caching: 5-min TTL as specified
- ✅ Cache key pattern: `warehouses:{org_id}` ✓
- ✅ Cache invalidation: On create/update/delete ✓
- ✅ Graceful fallback: Works without Redis ✓
- ✅ Event emission: Supabase channels integrated ✓

### Final Verdict

**Status**: **APPROVED FOR PRODUCTION** ✅

**Quality Metrics:**
- AC Coverage: 100% (8/8)
- Test Coverage: Comprehensive (37 tests)
- Security: All critical issues resolved
- Performance: Redis caching implemented
- Code Quality: Clean, maintainable, well-documented

**Recommendation**: Story 1.5 is **ready to merge** to main branch and deploy to production. All acceptance criteria met, all tests passing, no blocking issues remaining.

---
