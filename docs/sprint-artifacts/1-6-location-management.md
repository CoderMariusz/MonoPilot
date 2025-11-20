# Story 1.6: Location Management

Status: ready-for-dev

## Story

As an **Admin**,
I want to define locations within warehouses,
so that I can track where inventory is stored.

## Acceptance Criteria

### FR-SET-005: Location Management

**AC-005.1**: Admin może stworzyć location:
- Navigate to /settings/warehouses/:id/locations lub /settings/locations
- Click "Add Location" button
- Form fields:
  - code: required, unique within warehouse, uppercase alphanumeric + hyphens (e.g., LOC-A01)
  - name: required, max 100 chars
  - warehouse_id: required, dropdown or auto-filled if from warehouse detail
  - type: required, dropdown (Receiving, Production, Storage, Shipping, Transit, Quarantine)
  - zone: optional, text input (enabled by zone_enabled toggle)
  - zone_enabled: boolean toggle, default false
  - capacity: optional, number input (enabled by capacity_enabled toggle)
  - capacity_enabled: boolean toggle, default false
  - barcode: auto-generated, can override
  - is_active: toggle, default true
- Validation: code unique within warehouse, show error if duplicate
- On save: location created with auto-generated barcode

**AC-005.2**: Zone and capacity optional fields:
- zone_enabled toggle controls visibility of zone input
  - If false: zone field hidden, zone = NULL in DB
  - If true: zone field visible, required
- capacity_enabled toggle controls visibility of capacity input
  - If false: capacity field hidden, capacity = NULL in DB
  - If true: capacity field visible, required (must be > 0)
- Toggles stored in DB (zone_enabled, capacity_enabled boolean columns)
- Purpose: Allows simple locations (no zone/capacity) or detailed locations

**AC-005.3**: Barcode auto-generated:
- Format: LOC-{warehouse_code}-{sequence}
- Example: warehouse code = WH-01, sequence = 001 → LOC-WH-01-001
- Sequence: auto-increment per warehouse (1, 2, 3, ...)
- User can override barcode (manual input), but must be unique globally
- Barcode displayed as QR code on location detail page
- QR code generation: use qrcode library

**AC-005.4**: Locations table nested under warehouse:
- Navigate to /settings/warehouses/:id → "Locations" tab
- Table columns: Code, Name, Type, Zone, Capacity, Barcode, Active, Actions
- Zone column: show zone name or "N/A" if zone_enabled = false
- Capacity column: show number or "N/A" if capacity_enabled = false
- Filter by type (All, Receiving, Production, Storage, Shipping, Transit, Quarantine)
- Search by code or name
- Sort by code, name, type, created_at

**AC-005.5**: Cannot delete location if used as warehouse default:
- FK constraint ON DELETE RESTRICT on warehouses.default_*_location_id
- Error message: "Cannot delete - this is the default receiving location for Warehouse X"
- Offer: "Change warehouse default first, then delete"
- Archive option: set is_active = false (soft disable)

**AC-005.6**: Location detail page:
- Navigate to /settings/locations/:id
- Display: code, name, warehouse, type, zone, capacity, barcode (as text + QR code)
- QR code: scannable, contains location barcode
- Actions: Edit, Archive/Activate, Print QR Code
- Related entities: LPs in this location (Epic 5), WOs using this location (Epic 4)

**AC-005.7**: Bulk location creation:
- Option 1: CSV import (upload file with columns: code, name, type, zone, capacity)
- Option 2: Quick Add mode (add multiple locations in single form)
- Validation: check all codes unique, valid types
- On save: all locations created, show success count
- Error handling: show row-by-row errors if validation fails

**AC-005.8**: Cache invalidation events:
- On location create/update/delete: emit 'location.created/updated/deleted' event
- Epic 4, 5, 6, 7 refetch location list on event
- Redis cache TTL: 5 min
- Cache key: `locations:{warehouse_id}`

## Tasks / Subtasks

### Task 1: Database Schema - Locations Table (AC: 005.1, 005.2, 005.3, 005.5)
- [ ] Create `locations` table migration:
  - [ ] id UUID PK
  - [ ] org_id UUID FK → organizations (RLS key)
  - [ ] warehouse_id UUID FK → warehouses (ON DELETE RESTRICT)
  - [ ] code VARCHAR(50) NOT NULL
  - [ ] name VARCHAR(100) NOT NULL
  - [ ] type VARCHAR(20) NOT NULL (enum: receiving, production, storage, shipping, transit, quarantine)
  - [ ] zone VARCHAR(100) (nullable)
  - [ ] zone_enabled BOOLEAN DEFAULT false
  - [ ] capacity DECIMAL(10,2) (nullable, supports fractional units)
  - [ ] capacity_enabled BOOLEAN DEFAULT false
  - [ ] barcode VARCHAR(100) UNIQUE NOT NULL
  - [ ] is_active BOOLEAN DEFAULT true
  - [ ] created_by UUID FK → users
  - [ ] updated_by UUID FK → users
  - [ ] created_at TIMESTAMP DEFAULT NOW()
  - [ ] updated_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, warehouse_id, code)
- [ ] Add unique constraint: (barcode) - globally unique
- [ ] Add check constraint: IF zone_enabled = true THEN zone NOT NULL
- [ ] Add check constraint: IF capacity_enabled = true THEN capacity > 0
- [ ] Add indexes: org_id, warehouse_id, type, barcode
- [ ] CRITICAL: idx_locations_warehouse ON (warehouse_id) - prevents 30s query on 500+ locations
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Run migration and verify schema

### Task 2: Barcode Generation Service (AC: 005.3)
- [ ] Create BarcodeGeneratorService
  - [ ] generateLocationBarcode(warehouseCode: string, orgId: string)
    - [ ] Query: get next sequence number for warehouse
    - [ ] Sequence logic: SELECT MAX(sequence) FROM locations WHERE warehouse_id = X, increment by 1
    - [ ] Format: `LOC-${warehouseCode}-${sequence.toString().padStart(3, '0')}`
    - [ ] Example: WH-01, sequence 1 → LOC-WH-01-001
    - [ ] Return barcode string
  - [ ] validateBarcode(barcode: string)
    - [ ] Check unique globally (not just per warehouse)
    - [ ] Return boolean
  - [ ] generateQRCode(barcode: string)
    - [ ] Use qrcode library
    - [ ] Generate data URL (base64 image)
    - [ ] Size: 300x300px, error correction: Medium
    - [ ] Return data URL

### Task 3: Location Service - Core Logic (AC: 005.1, 005.2, 005.4, 005.5)
- [ ] Create LocationService class/module
  - [ ] createLocation(input: CreateLocationInput)
    - [ ] Validate: code unique within warehouse
    - [ ] Validate: zone/capacity rules (if enabled, must have value)
    - [ ] Generate barcode if not provided
    - [ ] Validate: barcode unique globally
    - [ ] Insert location record
    - [ ] Return location object
    - [ ] Emit cache event: 'location.created'
  - [ ] updateLocation(id: string, input: UpdateLocationInput)
    - [ ] Validate: location exists, belongs to org
    - [ ] Validate: code still unique within warehouse if changed
    - [ ] Validate: zone/capacity rules
    - [ ] Validate: barcode unique if changed
    - [ ] Update location record
    - [ ] Return updated location
    - [ ] Emit cache event: 'location.updated'
  - [ ] getLocations(warehouseId: string, filters?: LocationFilters)
    - [ ] Query locations WHERE warehouse_id = warehouseId
    - [ ] Apply filters: type, is_active, search (code/name)
    - [ ] Sort by specified column
    - [ ] Return locations array
  - [ ] deleteLocation(id: string, orgId: string)
    - [ ] Validate: location exists, belongs to org
    - [ ] Check: not used as warehouse default (query warehouses table)
    - [ ] Try DELETE (FK constraints will prevent if has dependencies)
    - [ ] Catch constraint error → return friendly error message
    - [ ] Alternative: soft delete (is_active = false)
    - [ ] Emit cache event: 'location.deleted'

### Task 4: Zod Validation Schemas (AC: 005.1, 005.2)
- [ ] Create CreateLocationSchema
  - [ ] warehouse_id: z.string().uuid()
  - [ ] code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50)
  - [ ] name: z.string().min(1).max(100)
  - [ ] type: z.enum(['receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine'])
  - [ ] zone: z.string().max(100).optional()
  - [ ] zone_enabled: z.boolean().default(false)
  - [ ] capacity: z.number().positive().optional()
  - [ ] capacity_enabled: z.boolean().default(false)
  - [ ] barcode: z.string().max(100).optional() (auto-generated if not provided)
  - [ ] is_active: z.boolean().default(true)
- [ ] Add custom refinements:
  - [ ] .refine(data => !data.zone_enabled || data.zone, 'Zone required when zone_enabled is true')
  - [ ] .refine(data => !data.capacity_enabled || data.capacity, 'Capacity required when capacity_enabled is true')
- [ ] Create UpdateLocationSchema (extends CreateLocationSchema)

### Task 5: API Endpoints (AC: 005.1, 005.4, 005.5, 005.6)
- [ ] Implement GET /api/settings/locations
  - [ ] Query params: warehouse_id, type?, is_active?, search?
  - [ ] Filter by org_id (from JWT)
  - [ ] Call LocationService.getLocations
  - [ ] Return locations array
  - [ ] Auth: Authenticated user
  - [ ] Cache: Redis 5 min TTL, key: locations:{warehouse_id}
- [ ] Implement POST /api/settings/locations
  - [ ] Body: CreateLocationInput
  - [ ] Validate: Zod schema
  - [ ] Call LocationService.createLocation
  - [ ] Return created location with barcode and QR code
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: locations:{warehouse_id}
- [ ] Implement PUT /api/settings/locations/:id
  - [ ] Body: UpdateLocationInput
  - [ ] Validate: Zod schema
  - [ ] Call LocationService.updateLocation
  - [ ] Return updated location
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: locations:{warehouse_id}
- [ ] Implement DELETE /api/settings/locations/:id
  - [ ] Call LocationService.deleteLocation
  - [ ] Return success or error message
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: locations:{warehouse_id}
- [ ] Implement GET /api/settings/locations/:id
  - [ ] Return location detail with QR code data URL
  - [ ] Auth: Authenticated user

### Task 6: Frontend Locations List Page (AC: 005.4)
- [ ] Create /app/settings/warehouses/[id]/locations/page.tsx (nested under warehouse)
- [ ] Create /app/settings/locations/page.tsx (global locations list)
- [ ] Implement LocationsTable component
  - [ ] Columns: Code, Name, Type, Zone, Capacity, Barcode, Active, Actions
  - [ ] Type column: badge with color per type
  - [ ] Zone column: show zone or "N/A" badge
  - [ ] Capacity column: show number or "N/A" badge
  - [ ] Active column: badge (green/gray)
  - [ ] Actions: Edit, Archive/Activate, View Detail, Print QR
  - [ ] Filter by type (dropdown: All, 6 types)
  - [ ] Search input (filter by code/name)
  - [ ] Sort by code, name, type, created_at
- [ ] Fetch data: GET /api/settings/locations?warehouse_id=X
  - [ ] Use SWR for caching
  - [ ] Auto-refresh every 5 min
  - [ ] Loading state, error state

### Task 7: Location Form Modal (AC: 005.1, 005.2)
- [ ] Create LocationFormModal component
  - [ ] Triggered by "Add Location" button or Edit action
  - [ ] Mode: create or edit
- [ ] Form fields:
  - [ ] Warehouse: dropdown (if global) or pre-filled (if from warehouse detail)
  - [ ] Code: uppercase input, validation feedback
  - [ ] Name: text input
  - [ ] Type: dropdown (6 types with icons/colors)
  - [ ] Zone: text input (visible only if zone_enabled = true)
  - [ ] Zone Enabled: toggle switch
  - [ ] Capacity: number input (visible only if capacity_enabled = true)
  - [ ] Capacity Enabled: toggle switch
  - [ ] Barcode: text input (pre-filled with auto-generated, can override)
  - [ ] Is Active: toggle switch
- [ ] Toggle logic:
  - [ ] zone_enabled toggle: show/hide zone input
  - [ ] capacity_enabled toggle: show/hide capacity input
  - [ ] On toggle off: clear field value
- [ ] Form submission:
  - [ ] Validate: Zod schema
  - [ ] POST /api/settings/locations (create) or PUT (update)
  - [ ] Success: close modal, refresh table, toast
  - [ ] Error: show validation errors inline

### Task 8: Location Detail Page (AC: 005.6)
- [ ] Create /app/settings/locations/[id]/page.tsx
- [ ] Display sections:
  - [ ] Basic Info: code, name, warehouse (link), type, zone, capacity, active status
  - [ ] Barcode: text + QR code image (generated in backend)
  - [ ] Actions: Edit, Archive/Activate, Print QR Code
- [ ] Print QR Code functionality:
  - [ ] Button: "Print QR Code"
  - [ ] Opens print-friendly page with large QR code + location code
  - [ ] Use window.print() or generate PDF
- [ ] Related entities (future):
  - [ ] LPs in this location (Epic 5) - show count, link to LP list
  - [ ] WOs using this location (Epic 4) - show count

### Task 9: Bulk Location Creation (AC: 005.7) - Optional Enhancement
- [ ] Option 1: CSV Import
  - [ ] Upload CSV file (columns: code, name, type, zone, capacity)
  - [ ] Parse CSV, validate each row
  - [ ] Show preview table with validation status
  - [ ] On confirm: bulk insert locations
  - [ ] Show success count, error count with details
- [ ] Option 2: Quick Add Mode
  - [ ] Form with "Add Another" button
  - [ ] Adds new row to form (multi-row editing)
  - [ ] On submit: create all locations in batch
  - [ ] Validate all rows before submission
- [ ] Recommendation: Skip for MVP, add in Phase 2

### Task 10: QR Code Integration (AC: 005.3, 005.6)
- [ ] Install library: `pnpm add qrcode`
- [ ] Backend: Generate QR code on location creation
  - [ ] Call BarcodeGeneratorService.generateQRCode(barcode)
  - [ ] Return data URL in API response
- [ ] Frontend: Display QR code on detail page
  - [ ] Show as <img src={qrCodeDataUrl} />
  - [ ] Size: 300x300px
  - [ ] Download button: save QR code as PNG
- [ ] Print QR Code page:
  - [ ] Large QR code (600x600px)
  - [ ] Location code text below
  - [ ] Warehouse name
  - [ ] Print button (triggers window.print)

### Task 11: Cache Invalidation & Events (AC: 005.8)
- [ ] Implement cache event emitter
  - [ ] After location create/update/delete: emit event
  - [ ] Event format: { type: 'location.created', org_id, warehouse_id, location_id, timestamp }
  - [ ] Use Supabase Realtime or Redis pub/sub
- [ ] Implement cache invalidation
  - [ ] On event: invalidate Redis cache key `locations:{warehouse_id}`
  - [ ] Frontend: invalidate SWR cache on event
  - [ ] Epic 4, 5, 6, 7 subscribe to these events (future)

### Task 12: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Barcode generation (correct format, sequence increment)
  - [ ] Location validation (code uniqueness, zone/capacity rules)
  - [ ] QR code generation (valid data URL)
- [ ] Integration tests:
  - [ ] POST location → created with auto-generated barcode
  - [ ] POST location with manual barcode → saved if unique
  - [ ] POST location with duplicate code → error
  - [ ] PUT location → update zone_enabled, zone cleared if disabled
  - [ ] DELETE location used as warehouse default → FK constraint error
  - [ ] Archive location → is_active = false
  - [ ] Cache invalidation on create/update
  - [ ] RLS policy: User A cannot access User B's locations
- [ ] E2E tests (Playwright):
  - [ ] Create location → appears in table with QR code
  - [ ] Edit location → toggle zone_enabled, zone field appears/disappears
  - [ ] Archive location → hidden from active list
  - [ ] Cannot delete location used as default → error shown
  - [ ] Print QR code → print dialog opens
  - [ ] Filter locations by type → correct results

### Task 13: Performance Optimization (AC: 005.4)
- [ ] Database indexes:
  - [ ] idx_locations_warehouse ON (warehouse_id) - CRITICAL (prevents 30s query)
  - [ ] idx_locations_org_id ON (org_id)
  - [ ] idx_locations_type ON (org_id, type) - for filtering
  - [ ] idx_locations_barcode ON (barcode) - for unique constraint
- [ ] Redis caching:
  - [ ] Cache GET locations response (5 min TTL)
  - [ ] Key: `locations:{warehouse_id}:{filters}`
  - [ ] Invalidate on create/update/delete
- [ ] Frontend optimization:
  - [ ] SWR caching (stale-while-revalidate)
  - [ ] Lazy load location details (only fetch when needed)
  - [ ] Virtualized table if >500 locations (react-window)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Dialog, Badge, Switch, Tabs)
- **Forms**: React Hook Form + Zod validation
- **Database**: PostgreSQL 15 via Supabase
- **QR Code**: qrcode library (Node.js) for backend generation
- **Cache**: Redis (Upstash) for location list caching
- **Events**: Supabase Realtime or Redis pub/sub for cache invalidation

### Architecture Patterns
- **Multi-tenancy**: RLS policy on locations table (org_id isolation)
- **Hierarchical Data**: Locations belong to warehouses (parent-child relationship)
- **Auto-Generated Barcode**: LOC-{warehouse_code}-{sequence} format
- **Optional Fields**: zone_enabled, capacity_enabled toggles control field visibility
- **Soft Delete**: is_active flag instead of hard delete
- **Cache Invalidation**: Events emitted on mutations, consumed by other epics
- **FK Constraints**: ON DELETE RESTRICT prevents accidental data loss

### Key Technical Decisions

1. **Barcode Format**:
   ```
   LOC-{warehouse_code}-{sequence}
   Examples:
   - Warehouse WH-01, location 1 → LOC-WH-01-001
   - Warehouse WH-01, location 15 → LOC-WH-01-015
   - Warehouse MAIN, location 200 → LOC-MAIN-200

   Sequence: auto-increment per warehouse
   Global uniqueness: barcode unique across all orgs (UNIQUE constraint)
   ```

2. **Location Types**:
   - Receiving: Where POs receive inventory
   - Production: Where WOs output finished goods
   - Storage: Long-term inventory storage
   - Shipping: Where SOs pick from
   - Transit: Temporary storage during moves
   - Quarantine: QA holds, blocked inventory

3. **Optional Fields (Zone, Capacity)**:
   - Purpose: Allow simple locations (just code/name/type) or detailed locations (with zone/capacity tracking)
   - Toggle pattern: zone_enabled/capacity_enabled boolean flags control visibility
   - DB constraint: IF zone_enabled = true THEN zone NOT NULL
   - UI: Toggles show/hide input fields dynamically

4. **QR Code Usage**:
   - Generated on location creation
   - Stored as barcode text in DB (QR generated on-demand from text)
   - Use cases: Scan QR on mobile to record LP moves, find location, check inventory
   - Print QR: Stick on physical location shelves

5. **Critical Index** (Tech Spec Gap 4):
   - idx_locations_warehouse ON (warehouse_id)
   - Without this: 500+ locations query takes 30s → timeout errors
   - With this: <300ms query time
   - Must be created in migration

### Security Considerations
- **RLS Policy**: org_id check prevents cross-org access
- **Admin Only**: Only admins can create/edit/delete locations
- **FK Constraints**: Prevent accidental deletion of locations used as warehouse defaults
- **Barcode Uniqueness**: Global unique constraint prevents conflicts
- **Audit Trail**: created_by, updated_by tracked

### Project Structure Notes

Expected file locations:
```
app/
  settings/
    warehouses/
      [id]/
        locations/
          page.tsx          # Locations list (nested under warehouse)
    locations/
      page.tsx              # Global locations list
      [id]/
        page.tsx            # Location detail with QR code
  api/
    settings/
      locations/
        route.ts            # GET, POST
        [id]/
          route.ts          # GET, PUT, DELETE

lib/
  services/
    LocationService.ts      # Location CRUD logic
    BarcodeGeneratorService.ts  # Barcode generation, QR code
  validation/
    locationSchemas.ts      # Zod schemas

components/
  settings/
    LocationsTable.tsx      # Table view component
    LocationFormModal.tsx   # Create/edit form
    LocationDetailCard.tsx  # Detail view with QR code

supabase/
  migrations/
    XXXX_create_locations.sql  # Locations table with critical index
```

### Data Model

```typescript
interface Location {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  warehouse_id: string          // FK → warehouses
  code: string                  // Unique within warehouse (e.g., LOC-A01)
  name: string                  // Display name
  type: LocationType            // Enum: receiving, production, storage, shipping, transit, quarantine
  zone?: string                 // Optional (controlled by zone_enabled)
  zone_enabled: boolean         // Default false
  capacity?: number             // Optional (controlled by capacity_enabled)
  capacity_enabled: boolean     // Default false
  barcode: string               // Auto-generated, globally unique
  is_active: boolean            // Default true
  created_by: string            // FK → users
  updated_by: string            // FK → users
  created_at: Date
  updated_at: Date
}

enum LocationType {
  Receiving = 'receiving',
  Production = 'production',
  Storage = 'storage',
  Shipping = 'shipping',
  Transit = 'transit',
  Quarantine = 'quarantine'
}

// Unique constraints:
// - (org_id, warehouse_id, code)
// - (barcode) - globally unique
// Indexes:
// - idx_locations_warehouse ON (warehouse_id) - CRITICAL
// - org_id, type, barcode
// RLS: org_id = auth.jwt()->>'org_id'
```

### API Endpoints

```typescript
GET    /api/settings/locations
  Query: { warehouse_id, type?, is_active?, search? }
  Response: Location[]
  Auth: Authenticated
  Cache: 5 min TTL

POST   /api/settings/locations
  Body: CreateLocationInput
  Response: Location (with barcode and QR code data URL)
  Auth: Admin only
  Validation: Unique code within warehouse, barcode globally unique

GET    /api/settings/locations/:id
  Response: Location (with QR code data URL)
  Auth: Authenticated

PUT    /api/settings/locations/:id
  Body: UpdateLocationInput
  Response: Location
  Auth: Admin only
  Validation: Zone/capacity rules, barcode unique

DELETE /api/settings/locations/:id
  Response: { success: boolean } or { error: string }
  Auth: Admin only
  Note: FK constraints may prevent deletion
```

### Zod Validation Schemas

```typescript
const CreateLocationSchema = z.object({
  warehouse_id: z.string().uuid(),
  code: z.string()
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase, numbers, hyphens only')
    .min(2).max(50),
  name: z.string().min(1).max(100),
  type: z.enum(['receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine']),
  zone: z.string().max(100).optional(),
  zone_enabled: z.boolean().default(false),
  capacity: z.number().positive().optional(),
  capacity_enabled: z.boolean().default(false),
  barcode: z.string().max(100).optional(),
  is_active: z.boolean().default(true)
}).refine(
  data => !data.zone_enabled || data.zone,
  { message: 'Zone required when zone_enabled is true', path: ['zone'] }
).refine(
  data => !data.capacity_enabled || data.capacity,
  { message: 'Capacity required when capacity_enabled is true', path: ['capacity'] }
)
```

### Testing Strategy

**Unit Tests** (Vitest):
- Barcode generation (format, sequence, uniqueness)
- Zone/capacity validation rules
- QR code generation (valid data URL)
- Location type enum validation

**Integration Tests** (Vitest + Supabase Test Client):
- Create location → auto-generated barcode correct format
- Create location with duplicate code in warehouse → error
- Create location with duplicate barcode globally → error
- Update location → toggle zone_enabled, zone cleared
- Delete location used as warehouse default → FK constraint error
- Query locations by warehouse → idx_locations_warehouse used (EXPLAIN query)
- RLS: User A cannot access User B's locations

**E2E Tests** (Playwright):
- Create location flow (form → save → appears in table)
- Edit location (toggle zone_enabled, zone field appears)
- Archive/activate location
- Cannot delete location used as default → error shown
- Print QR code → print dialog opens
- Filter locations by type → correct results
- Search locations → correct results

### Performance Targets
- Location list load (500 locations): <300ms p95 (with idx_locations_warehouse)
- Create location: <300ms
- Update location: <250ms
- QR code generation: <100ms
- Cache hit rate: >80%

### Learnings from Previous Stories

**From Story 1.5 (Warehouse Configuration)**

Story 1.5 is in status "drafted", expected patterns:
- Warehouses table created with default location FKs
- Circular dependency: warehouse → locations → warehouse defaults
- This story (1.6) creates locations, then Story 1.5 updates warehouse defaults

**Key Integration:**
- Locations FK to warehouses (warehouse_id)
- Warehouses FK to locations (default_*_location_id)
- Resolution: create warehouse → create locations → update warehouse
- UI flow: after creating warehouse, show banner "Add locations to set defaults"

**Critical Index:**
- Tech Spec Gap 4 warns: missing idx_locations_warehouse causes 30s query on 500+ locations
- This story MUST create this index in migration

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.6]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-005]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Location-Management]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Critical-Index-Performance]

### Prerequisites

**Story 1.5**: Warehouse Configuration (warehouses table, warehouse_id FK needed)

### Dependencies

**External Services:**
- Supabase (Database)
- Redis (Upstash) for caching

**Libraries:**
- qrcode (QR code generation)
- @supabase/supabase-js (Supabase client)
- react-hook-form, zod (form validation)
- swr (data fetching/caching)
- shadcn/ui (Table, Dialog, Badge, Switch, Tabs components)

**Internal Dependencies:**
- warehouses table (from Story 1.5)
- users table (from Story 1.2) for created_by/updated_by

**Downstream:**
- Epic 3: PO receiving uses default_receiving_location_id
- Epic 4: WO production uses production type locations
- Epic 5: LP storage uses storage type locations
- Epic 6: QA quarantine uses quarantine type locations
- Epic 7: Shipping uses default_shipping_location_id

## Dev Agent Record

### Context Reference

Story Context: [docs/sprint-artifacts/1-6-location-management.context.xml](./1-6-location-management.context.xml)

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
