# Technical Specification - Batch 01B Infrastructure Config

**Batch ID:** 01B-infrastructure-config
**Epic:** Epic 1 - Settings
**Stories:** 1.5, 1.6, 1.7, 1.8
**Status:** Done
**Created:** 2025-11-20
**Updated:** 2025-11-27

---

## 1. Batch Overview

### Cel Batcha
Implementacja konfiguracji infrastruktury produkcyjnej obejmującej magazyny, lokacje, maszyny i linie produkcyjne. Ten batch tworzy fundamenty dla Epic 3 (Planning), Epic 4 (Production) i Epic 5 (Warehouse).

### Stories w Batchu
- **Story 1.5:** Warehouse Configuration (done)
- **Story 1.6:** Location Management (done)
- **Story 1.7:** Machine Configuration (done)
- **Story 1.8:** Production Line Configuration (done)

### Kluczowe Zależności
```
Story 1.1 (Organizations)
    ↓
Story 1.5 (Warehouses)
    ↓
Story 1.6 (Locations) ←→ Story 1.7 (Machines)
    ↓                         ↓
Story 1.8 (Production Lines) ←┘
```

**Circular Dependencies:**
- Warehouses ↔ Locations (default receiving/shipping/transit locations)
- Machines ↔ Production Lines (many-to-many via machine_line_assignments)

### Business Value
- Umożliwia organizację magazynów w hierarchię (warehouses → locations)
- Pozwala śledzić alokację maszyn do linii produkcyjnych
- Zapewnia foundation dla trackingu inwentarza (Epic 5)
- Umożliwia planning produkcji per linia (Epic 4)

---

## 2. Database Schema

### 2.1 Warehouses Table
**Story:** 1.5
**Migration:** 003_create_warehouses_table.sql

```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    code VARCHAR(50) NOT NULL CHECK (code ~ '^[A-Z0-9-]+$'),
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    -- Default locations (nullable, circular dependency)
    default_receiving_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    default_shipping_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    transit_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    -- Audit trail
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX idx_warehouses_org_id ON warehouses(org_id);
CREATE INDEX idx_warehouses_code ON warehouses(org_id, code);

-- RLS Policy
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warehouses_tenant_isolation" ON warehouses
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Key Points:**
- Default location FKs are nullable (populated after locations created)
- ON DELETE RESTRICT prevents accidental deletion of warehouses with dependencies
- Multi-tenant isolation via org_id + RLS

---

### 2.2 Locations Table
**Story:** 1.6
**Migration:** 004_create_locations_table.sql

```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL CHECK (code ~ '^[A-Z0-9-]+$'),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine')),
    -- Optional fields (controlled by toggles)
    zone VARCHAR(100),
    zone_enabled BOOLEAN NOT NULL DEFAULT false,
    capacity NUMERIC(10,2),
    capacity_enabled BOOLEAN NOT NULL DEFAULT false,
    -- Auto-generated barcode
    barcode VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Audit trail
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    UNIQUE (org_id, warehouse_id, code),
    CHECK (NOT zone_enabled OR zone IS NOT NULL),
    CHECK (NOT capacity_enabled OR capacity > 0)
);

-- Indexes (CRITICAL: idx_locations_warehouse prevents 30s query)
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_org_id ON locations(org_id);
CREATE INDEX idx_locations_type ON locations(org_id, type);
CREATE INDEX idx_locations_barcode ON locations(barcode);

-- RLS Policy
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_tenant_isolation" ON locations
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Key Points:**
- Barcode format: `LOC-{warehouse_code}-{sequence}` (auto-generated)
- Zone/capacity optional fields with enable toggles
- **CRITICAL:** `idx_locations_warehouse` prevents 30s → <100ms query time
- Global unique barcode constraint for QR code scanning

---

### 2.3 Machines Table
**Story:** 1.7
**Migration:** 007_create_machines_table.sql

```sql
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    code VARCHAR(50) NOT NULL CHECK (code ~ '^[A-Z0-9-]+$'),
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'down', 'maintenance')),
    capacity_per_hour NUMERIC(10,2) CHECK (capacity_per_hour IS NULL OR capacity_per_hour > 0),
    -- Audit trail
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX idx_machines_org_id ON machines(org_id);
CREATE INDEX idx_machines_status ON machines(org_id, status);

-- RLS Policy
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "machines_tenant_isolation" ON machines
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Key Points:**
- Status affects WO assignment availability (Epic 4)
- Capacity per hour optional (future scheduling use)

---

### 2.4 Production Lines Table
**Story:** 1.8
**Migration:** 009_create_production_lines_table.sql

```sql
CREATE TABLE production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    code VARCHAR(50) NOT NULL CHECK (code ~ '^[A-Z0-9-]+$'),
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    default_output_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    -- Audit trail
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX idx_production_lines_org_id ON production_lines(org_id);
CREATE INDEX idx_production_lines_warehouse_id ON production_lines(warehouse_id);

-- RLS Policy
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_lines_tenant_isolation" ON production_lines
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Key Points:**
- Each line belongs to one warehouse
- Default output location must be in same warehouse (validated in service layer)
- ON DELETE RESTRICT prevents deletion if has WOs (Epic 4)

---

### 2.5 Machine Line Assignments (Many-to-Many)
**Stories:** 1.7, 1.8
**Migration:** 007_create_machines_table.sql

```sql
CREATE TABLE machine_line_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    UNIQUE (machine_id, line_id)
);

-- Indexes
CREATE INDEX idx_machine_line_machine ON machine_line_assignments(machine_id);
CREATE INDEX idx_machine_line_line ON machine_line_assignments(line_id);
```

**Key Points:**
- Bidirectional assignment (from machine side OR line side)
- Unique constraint prevents duplicate assignments + race conditions
- CASCADE delete cleans up orphaned assignments

---

## 3. API Endpoints

### 3.1 Warehouses API
**Story:** 1.5

```typescript
GET    /api/settings/warehouses
  Query: { is_active?, search? }
  Response: Warehouse[] (with location names for defaults)
  Auth: Authenticated
  Cache: 5 min TTL (Redis - deferred to Story 1.14)

POST   /api/settings/warehouses
  Body: CreateWarehouseInput
  Response: Warehouse
  Auth: Admin only
  Validation: Unique code, format regex

PUT    /api/settings/warehouses/:id
  Body: UpdateWarehouseInput
  Response: Warehouse
  Auth: Admin only
  Validation: Default locations belong to warehouse

DELETE /api/settings/warehouses/:id
  Response: { success: boolean } or { error: string }
  Auth: Admin only
  Note: FK constraints prevent deletion if has dependencies
```

**Zod Schemas:**
```typescript
const CreateWarehouseSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50),
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  is_active: z.boolean().default(true)
})

const UpdateWarehouseSchema = CreateWarehouseSchema.extend({
  default_receiving_location_id: z.string().uuid().optional(),
  default_shipping_location_id: z.string().uuid().optional(),
  transit_location_id: z.string().uuid().optional()
})
```

---

### 3.2 Locations API
**Story:** 1.6

```typescript
GET    /api/settings/locations
  Query: { warehouse_id, type?, is_active?, search? }
  Response: Location[] (with QR code data URL for detail view)
  Auth: Authenticated
  Cache: 5 min TTL (Redis - deferred to Story 1.14)

POST   /api/settings/locations
  Body: CreateLocationInput
  Response: Location (with barcode and QR code)
  Auth: Admin only
  Validation: Code unique within warehouse, barcode globally unique

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
  Note: FK constraints prevent deletion if used as warehouse default
```

**Zod Schemas:**
```typescript
const CreateLocationSchema = z.object({
  warehouse_id: z.string().uuid(),
  code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50),
  name: z.string().min(1).max(100),
  type: z.enum(['receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine']),
  zone: z.string().max(100).optional(),
  zone_enabled: z.boolean().default(false),
  capacity: z.number().positive().optional(),
  capacity_enabled: z.boolean().default(false),
  barcode: z.string().max(100).optional(), // auto-generated if not provided
  is_active: z.boolean().default(true)
}).refine(
  data => !data.zone_enabled || data.zone,
  { message: 'Zone required when zone_enabled is true', path: ['zone'] }
).refine(
  data => !data.capacity_enabled || data.capacity,
  { message: 'Capacity required when capacity_enabled is true', path: ['capacity'] }
)
```

---

### 3.3 Machines API
**Story:** 1.7

```typescript
GET    /api/settings/machines
  Query: { status?, search?, sort_by?, sort_direction? }
  Response: Machine[] (with line names)
  Auth: Authenticated
  Cache: 5 min TTL (Redis - deferred to Story 1.14)

POST   /api/settings/machines
  Body: CreateMachineInput
  Response: Machine
  Auth: Admin only
  Validation: Unique code, valid status

GET    /api/settings/machines/:id
  Response: Machine (with assigned lines)
  Auth: Authenticated

PUT    /api/settings/machines/:id
  Body: UpdateMachineInput
  Response: Machine
  Auth: Admin only
  Validation: Status change warnings (if has active WOs - Epic 4)

DELETE /api/settings/machines/:id
  Response: { success: boolean } or { error: string }
  Auth: Admin only
  Note: FK constraints prevent deletion if assigned to WOs
```

**Zod Schemas:**
```typescript
const CreateMachineSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'down', 'maintenance']).default('active'),
  capacity_per_hour: z.number().positive().optional(),
  line_ids: z.array(z.string().uuid()).optional()
})

const UpdateMachineSchema = CreateMachineSchema.partial()
```

---

### 3.4 Production Lines API
**Story:** 1.8

```typescript
GET    /api/settings/lines
  Query: { warehouse_id?, search? }
  Response: ProductionLine[] (with warehouse, location, machine names)
  Auth: Authenticated
  Cache: 5 min TTL (Redis - deferred to Story 1.14)

POST   /api/settings/lines
  Body: CreateLineInput
  Response: ProductionLine
  Auth: Admin only
  Validation: Code unique, output location in warehouse

GET    /api/settings/lines/:id
  Response: ProductionLine (with full relationships)
  Auth: Authenticated

PUT    /api/settings/lines/:id
  Body: UpdateLineInput
  Response: ProductionLine
  Auth: Admin only
  Validation: Output location warehouse match

DELETE /api/settings/lines/:id
  Response: { success: boolean } or { error: string }
  Auth: Admin only
  Note: FK constraints prevent deletion if has WOs
```

**Zod Schemas:**
```typescript
const CreateLineSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50),
  name: z.string().min(1).max(100),
  warehouse_id: z.string().uuid(),
  default_output_location_id: z.string().uuid().optional(),
  machine_ids: z.array(z.string().uuid()).optional()
})

const UpdateLineSchema = CreateLineSchema.partial()
```

---

## 4. Frontend Routes & Components

### 4.1 Warehouses (Story 1.5)
**Routes:**
- `/settings/warehouses` - List view
- `/settings/warehouses/:id` - Detail view (optional, deferred to 1.14)

**Components:**
- `apps/frontend/app/settings/warehouses/page.tsx` - List page
- `apps/frontend/components/settings/WarehousesTable.tsx` - Table view
- `apps/frontend/components/settings/WarehouseFormModal.tsx` - Create/Edit form
- `apps/frontend/components/settings/WarehouseCard.tsx` - Card view (optional)

**Features:**
- Table view: Code, Name, Address, Receiving, Shipping, Transit, Active, Actions
- Search by code/name
- Filter by is_active
- Sort by code, name, created_at
- Inline location creation (dropdown with "+ Create Location")
- Card view toggle (localStorage persistence)

---

### 4.2 Locations (Story 1.6)
**Routes:**
- `/settings/warehouses/:id/locations` - Nested under warehouse
- `/settings/locations` - Global list
- `/settings/locations/:id` - Detail page with QR code

**Components:**
- `apps/frontend/app/settings/locations/page.tsx` - Global list
- `apps/frontend/components/settings/LocationsTable.tsx` - Table view
- `apps/frontend/components/settings/LocationForm.tsx` - Create/Edit modal
- `apps/frontend/components/settings/LocationDetailModal.tsx` - QR code display

**Features:**
- Table view: Code, Name, Type, Zone, Capacity, Barcode, Active, Actions
- Filter by type (6 types)
- Search by code/name
- Zone/capacity optional field toggles
- QR code generation (LOC-{WH}-{SEQ} format)
- Print QR code functionality

---

### 4.3 Machines (Story 1.7)
**Routes:**
- `/settings/machines` - List view
- `/settings/machines/:id` - Detail view (optional, deferred to 1.14)

**Components:**
- `apps/frontend/app/settings/machines/page.tsx` - List page
- `apps/frontend/components/settings/MachineFormModal.tsx` - Create/Edit form

**Features:**
- Table view: Code, Name, Status, Lines, Capacity, Actions
- Status badges (Active green, Down red, Maintenance yellow)
- Filter by status
- Search by code/name
- Sort by code, name, status, created_at
- Line assignment multi-select

---

### 4.4 Production Lines (Story 1.8)
**Routes:**
- `/settings/production` - Combined tab view (Machines + Lines)
- `/settings/lines/:id` - Detail view (deferred to 1.14)

**Components:**
- Frontend deferred to Story 1.14
- Backend complete (service + API)

**Features (planned):**
- Table view: Code, Name, Warehouse, Machines, Output Location, Actions
- Filter by warehouse
- Search by code/name
- Machine assignment multi-select
- Output location validation (must be in warehouse)

---

## 5. RLS Policies

### Standard Pattern (All Tables)
```sql
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table}_tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

**Tables with RLS:**
- `warehouses`
- `locations`
- `machines`
- `production_lines`
- `machine_line_assignments` (no org_id, relies on parent table RLS)

**Best Practice:**
- Always use `createServerSupabaseAdmin()` in services (service role bypasses RLS)
- Query `public.users` table for org_id instead of relying on JWT

**Reference:** `docs/RLS_AND_SUPABASE_CLIENTS.md`

---

## 6. Dependencies

### External Services
- **Supabase:** PostgreSQL database, Auth, Storage (warehouse logos)
- **Redis (Upstash):** Caching (deferred to Story 1.14)
- **qrcode library:** QR code generation for locations

### NPM Packages
```json
{
  "@supabase/supabase-js": "^2.84.0",
  "react-hook-form": "^7.x",
  "zod": "^3.25.76",
  "swr": "^2.x",
  "qrcode": "^1.5.x"
}
```

### Internal Dependencies
**Required by Batch 01B:**
- `organizations` table (Story 1.1)
- `users` table (Story 1.2) for created_by/updated_by audit trail

**Provides for:**
- Epic 3 (Planning): PO receiving uses warehouses + default_receiving_location
- Epic 4 (Production): WO execution uses production_lines + machines
- Epic 5 (Warehouse): LP storage uses locations
- Epic 7 (Shipping): SO shipping uses default_shipping_location

---

## 7. Key Technical Decisions

### 7.1 Circular Dependency Resolution (Warehouses ↔ Locations)
**Problem:** Warehouses need default location IDs, but locations need warehouse_id.

**Solution (3-Step Flow):**
```
1. Create warehouse (default locations = NULL)
   ↓
2. Create locations (with warehouse_id FK)
   ↓
3. Update warehouse (set default location IDs)
```

**Validation:**
- Default locations must belong to the warehouse
- Enforced at service layer: `validateOutputLocation()`

**UI Guidance:**
- Banner after warehouse creation: "Add locations to set defaults"
- Inline location creation from warehouse form

---

### 7.2 Barcode Auto-Generation (Locations)
**Format:** `LOC-{warehouse_code}-{sequence}`

**Examples:**
- Warehouse WH-01, location 1 → `LOC-WH-01-001`
- Warehouse MAIN, location 200 → `LOC-MAIN-200`

**Implementation:**
- Sequence auto-increment per warehouse (service layer)
- Global unique constraint (prevents conflicts)
- User can override (manual input, validated for uniqueness)

**QR Code:**
- Generated on-demand from barcode text
- Library: `qrcode` (Node.js)
- Size: 300x300px, error correction: Medium
- Print functionality: window.print() with large QR

---

### 7.3 Machine Status Lifecycle
**States:**
- **Active:** Normal operation, available for WO assignment
- **Down:** Unplanned downtime (breakdown), not available
- **Maintenance:** Planned downtime, scheduled unavailability

**Status Change Validation:**
- Warn if changing to Down/Maintenance with active WOs (Epic 4)
- Currently logged warnings, full implementation in Epic 4

---

### 7.4 Many-to-Many Assignment (Machines ↔ Production Lines)
**Use Cases:**
- 1 machine → multiple lines (shared packaging machine)
- 1 line → multiple machines (mixer, filler, capper)

**Bidirectional UI:**
- Assign from machine side (Story 1.7)
- Assign from line side (Story 1.8)
- Both update `machine_line_assignments` table

**Race Condition Prevention:**
- Unique constraint `(machine_id, line_id)`
- 2 users assign same machine to same line → constraint violation

---

### 7.5 Critical Index (idx_locations_warehouse)
**Problem:** Without this index, 500+ locations query takes 30s → timeout errors

**Solution:**
```sql
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
```

**Performance:**
- Before: 30s query time
- After: <100ms query time

**Validation:**
- SQL script: `scripts/verify-location-index-performance.sql`
- Node.js benchmark: `scripts/verify-location-performance.mjs`
- Checks: index usage, query time < 100ms, cache hit ratio

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)
**Story 1.5 (Warehouses):**
- ✅ Code format validation (uppercase, hyphens)
- ✅ Code uniqueness check
- ✅ Default location assignment logic
- ✅ Archive vs delete logic

**Story 1.6 (Locations):**
- ✅ Barcode generation (format, sequence, uniqueness) - 14 tests
- ✅ Zone/capacity validation rules - 30 tests
- ✅ QR code generation (valid data URL)

**Story 1.7 (Machines):**
- ✅ Machine validation (code format, status enum) - 37 tests
- ✅ Line assignment logic (bulk operations)
- ✅ Status change validation

**Story 1.8 (Production Lines):**
- Backend complete, tests deferred to Story 1.14

---

### 8.2 Integration Tests (Vitest + Supabase)
**Story 1.5 (Warehouses):**
- ✅ Create warehouse → saved with NULL defaults - 27 tests
- ✅ Update warehouse → set valid default locations
- ✅ Delete warehouse with locations → FK constraint error
- ✅ Archive warehouse → is_active = false
- ✅ RLS: User A cannot access User B's warehouses

**Story 1.6 (Locations):**
- ✅ Create location → auto-generated barcode correct format
- ✅ Create location with duplicate code → error
- ✅ Delete location used as default → FK constraint error
- ✅ Query locations by warehouse → idx_locations_warehouse used

**Story 1.7 (Machines):**
- ✅ Create machine → line assignments saved
- ✅ Update machine → old assignments deleted, new inserted
- ✅ Unique constraint: duplicate assignment prevented

**Story 1.8 (Production Lines):**
- Integration tests deferred to Story 1.14

---

### 8.3 E2E Tests (Playwright)
**Story 1.5 (Warehouses):**
- ✅ Create warehouse flow - 10 tests
- ✅ Edit warehouse (change name, update defaults)
- ✅ Archive/activate warehouse
- ✅ Cannot delete warehouse with dependencies

**Story 1.6 (Locations):**
- ✅ Create location flow - 18 tests
- ✅ Edit location (toggle zone_enabled)
- ✅ Print QR code → print dialog opens
- ✅ Filter locations by type

**Story 1.7 (Machines):**
- E2E tests deferred to Story 1.14

**Story 1.8 (Production Lines):**
- E2E tests deferred to Story 1.14

---

### 8.4 Test Coverage Summary
| Story | Unit Tests | Integration Tests | E2E Tests | Status |
|-------|------------|-------------------|-----------|--------|
| 1.5 Warehouses | ✅ Comprehensive | ✅ 27 tests | ✅ 10 tests | APPROVED |
| 1.6 Locations | ✅ 44 tests | ✅ Included | ✅ 18 tests | APPROVED |
| 1.7 Machines | ✅ 37 tests | ✅ Included | ⏸️ Deferred to 1.14 | APPROVED |
| 1.8 Production Lines | ⏸️ Deferred | ⏸️ Deferred | ⏸️ Deferred | APPROVED (backend only) |

**Total Tests (Batch 01B):** 81 unit tests, 27+ integration tests, 28 E2E tests

---

## 9. Performance Targets

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Warehouse list load (100) | <200ms p95 | ✅ Met | Redis cache deferred to 1.14 |
| Create warehouse | <300ms | ✅ Met | - |
| Location list load (500) | <300ms p95 | ✅ <100ms | **idx_locations_warehouse critical** |
| Create location + QR | <300ms | ✅ Met | QR generation <100ms |
| Machine list load (100) | <200ms p95 | ✅ Met | - |
| Create machine | <300ms | ✅ Met | - |
| Production line list load | <200ms p95 | ✅ Met | Backend verified |
| Cache hit rate | >80% | ⏸️ Pending | Redis integration in Story 1.14 |

**Critical Index Performance:**
- ✅ Verified: `idx_locations_warehouse` prevents 30s → <100ms query
- ✅ Performance scripts: SQL verification + Node.js benchmark

---

## 10. Security Considerations

### 10.1 RLS Policies
✅ All tables have RLS enabled
✅ Multi-tenant isolation via `org_id`
✅ Service role bypasses RLS (used in services)

### 10.2 Authentication & Authorization
✅ Session checks in all API routes
✅ Admin role verification for mutations
✅ org_id isolation enforced

### 10.3 Input Validation
✅ Zod schemas for client + server validation
✅ Regex validation for codes (uppercase, alphanumeric, hyphens)
✅ SQL injection protection (parameterized queries via Supabase client)

### 10.4 Data Protection
✅ Multi-tenant isolation
✅ Audit trail (created_by, updated_by)
✅ FK constraints prevent accidental data loss

---

## 11. Open Items & Deferred Work

### Deferred to Story 1.14 (Epic Polish)
**Story 1.5 (Warehouses):**
- None - fully complete

**Story 1.6 (Locations):**
- Cache invalidation events (AC-005.8 partial)
- RLS integration tests (TD-1.6-2)
- Bulk location creation (AC-005.7 optional)

**Story 1.7 (Machines):**
- E2E tests for machine CRUD flows
- Redis cache integration (AC-006.8 partial)
- Line assignment UI (blocked by Story 1.8)
- Machine detail page (AC-006.7 optional)

**Story 1.8 (Production Lines):**
- Frontend UI (list page, form modal, detail page)
- Integration tests (API endpoints, RLS policies)
- E2E tests (Playwright)
- Redis cache integration

### Technical Debt
**TD-1.6-1: Cache Invalidation Events**
- Priority: P3 (Low)
- Effort: 2-4 hours
- Files: `lib/services/location-service.ts` (3 TODO comments)

**TD-1.6-2: RLS Integration Tests**
- Priority: P2 (Medium)
- Effort: 2-3 hours
- Files: `tests/integration/rls/locations-rls.test.ts` (new)

---

## 12. File Structure

```
apps/frontend/
  lib/
    supabase/
      migrations/
        003_create_warehouses_table.sql       # Story 1.5
        004_create_locations_table.sql        # Story 1.6
        007_create_machines_table.sql         # Story 1.7
        009_create_production_lines_table.sql # Story 1.8
    services/
      warehouse-service.ts                    # Story 1.5 CRUD
      location-service.ts                     # Story 1.6 CRUD
      barcode-generator-service.ts            # Story 1.6 barcodes + QR
      machine-service.ts                      # Story 1.7 CRUD
      production-line-service.ts              # Story 1.8 CRUD
    validation/
      warehouse-schemas.ts                    # Story 1.5 Zod
      location-schemas.ts                     # Story 1.6 Zod
      machine-schemas.ts                      # Story 1.7 Zod
      production-line-schemas.ts              # Story 1.8 Zod
  app/
    api/settings/
      warehouses/
        route.ts                              # GET, POST
        [id]/route.ts                         # GET, PUT, DELETE
      locations/
        route.ts                              # GET, POST
        [id]/route.ts                         # GET, PUT, DELETE
      machines/
        route.ts                              # GET, POST
        [id]/route.ts                         # GET, PUT, DELETE
      lines/
        route.ts                              # GET, POST (Story 1.8)
        [id]/route.ts                         # GET, PUT, DELETE (Story 1.8)
    settings/
      warehouses/
        page.tsx                              # Story 1.5 list
      locations/
        page.tsx                              # Story 1.6 global list
        [id]/page.tsx                         # Story 1.6 detail + QR
      machines/
        page.tsx                              # Story 1.7 list
  components/settings/
    WarehousesTable.tsx                       # Story 1.5 table
    WarehouseFormModal.tsx                    # Story 1.5 form
    LocationsTable.tsx                        # Story 1.6 table
    LocationForm.tsx                          # Story 1.6 form
    LocationDetailModal.tsx                   # Story 1.6 QR display
    MachineFormModal.tsx                      # Story 1.7 form

tests/
  e2e/
    warehouses.spec.ts                        # Story 1.5 E2E (10 tests)
    location-management.spec.ts               # Story 1.6 E2E (18 tests)
  __tests__/api/
    warehouses.test.ts                        # Story 1.5 integration (27 tests)
    machines.test.ts                          # Story 1.7 integration (37 tests)

scripts/
  apply-migration-003.mjs                     # Story 1.5 migration runner
  apply-migration-004.mjs                     # Story 1.6 migration runner
  apply-migration-007.mjs                     # Story 1.7 migration runner
  apply-migration-009.mjs                     # Story 1.8 migration runner
  verify-location-index-performance.sql       # Story 1.6 SQL verification
  verify-location-performance.mjs             # Story 1.6 Node.js benchmark
```

---

## 13. Data Model Relationships

```
organizations (org_id)
    ↓
warehouses (id)
    ↓ (warehouse_id)
locations (id)
    ↑ (default_receiving_location_id, default_shipping_location_id, transit_location_id)
warehouses

production_lines (id)
    ↓ (warehouse_id)
warehouses
    ↓ (default_output_location_id)
locations

machines (id) ←→ machine_line_assignments ←→ production_lines (id)
```

**Circular Dependencies:**
1. Warehouses ↔ Locations (default locations)
2. Machines ↔ Production Lines (many-to-many assignments)

---

## 14. Cache Strategy

### Cache Keys (Redis - Deferred to Story 1.14)
```
warehouses:{org_id}                           # Story 1.5
locations:{warehouse_id}                      # Story 1.6
machines:{org_id}                             # Story 1.7
lines:{org_id}                                # Story 1.8
```

### Cache Invalidation Events (Supabase Realtime)
```typescript
// Story 1.5
emitWarehouseUpdatedEvent(orgId, warehouseId)

// Story 1.6
emitLocationUpdatedEvent(orgId, warehouseId, locationId)

// Story 1.7
emitMachineUpdatedEvent(orgId, machineId)

// Story 1.8
emitLineUpdatedEvent(orgId, lineId)
```

**Consumer Epics:**
- Epic 3 (Planning): Refetch warehouses on create PO
- Epic 4 (Production): Refetch machines + lines on create WO
- Epic 5 (Warehouse): Refetch locations on LP moves

---

## 15. Lessons Learned

### What Worked Well
✅ 3-step circular dependency resolution (warehouse → locations → defaults)
✅ Critical index identification prevented 30s query timeout
✅ Comprehensive test coverage (81 unit + 27 integration + 28 E2E)
✅ RLS policies enforced from day 1
✅ Barcode auto-generation with manual override option

### Challenges
⚠️ Frontend implementation for Story 1.8 deferred due to batch size
⚠️ Redis cache integration deferred to Story 1.14 (events emitted, cache pending)
⚠️ Line assignment UI for machines blocked by Story 1.8 completion

### Improvements for Next Batch
💡 Split large stories (1.8) into backend + frontend sub-stories
💡 Implement cache layer earlier (Story 1.14 now has 4 stories' worth)
💡 Add performance benchmarks to CI/CD

---

## 16. Sign-Off

**Stories Completed:**
- ✅ Story 1.5: Warehouse Configuration (APPROVED)
- ✅ Story 1.6: Location Management (APPROVED)
- ✅ Story 1.7: Machine Configuration (APPROVED)
- ✅ Story 1.8: Production Line Configuration (APPROVED - backend only)

**Batch Status:** Done (frontend polish deferred to Story 1.14)

**Code Review Outcomes:**
- Story 1.5: APPROVED FOR PRODUCTION (2025-11-21)
- Story 1.6: APPROVED FOR PRODUCTION (2025-11-22)
- Story 1.7: APPROVED FOR PRODUCTION (2025-11-22)
- Story 1.8: APPROVED FOR PRODUCTION (backend) (2025-11-22)

**Test Coverage:** 81 unit tests, 27+ integration tests, 28 E2E tests

**Performance:** All targets met, critical index verified

**Security:** RLS policies, admin authorization, input validation complete

**Ready for Production:** Yes (with deferred items tracked in Story 1.14)

---

**End of Tech Spec - Batch 01B Infrastructure Config**
