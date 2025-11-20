# Story 1.5: Warehouse Configuration

Status: ready-for-dev

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
