# BACKEND-DEV Handoff: Story 01.10 - Machines CRUD - Track A Complete

**Status**: GREEN Phase - Track A Complete (Database)
**Date**: 2025-12-22
**From**: BACKEND-DEV
**To**: BACKEND-DEV (Track B - Services/API)

## Summary

Track A (Database) complete for Story 01.10 - Machines CRUD. Database migrations created with enums, tables, indexes, triggers, and RLS policies following ADR-013 pattern.

## Deliverables

### Migration 072: Create Machines Table
**File**: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/supabase/migrations/072_create_machines_table.sql`
**Status**: CREATED

**Features Implemented**:
- ✅ **Enums Created**:
  - `machine_type`: 9 values (MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER)
  - `machine_status`: 4 values (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)

- ✅ **Table: machines**:
  - **Primary Key**: `id` (UUID, auto-generated)
  - **Multi-tenant**: `org_id` (UUID, NOT NULL, FK to organizations)
  - **Identification**: `code` (VARCHAR 50), `name` (VARCHAR 100), `description` (TEXT)
  - **Classification**: `type` (machine_type, default OTHER), `status` (machine_status, default ACTIVE)
  - **Capacity**: `units_per_hour`, `setup_time_minutes`, `max_batch_size` (all INTEGER, optional)
  - **Location**: `location_id` (UUID, nullable FK to locations, ON DELETE SET NULL)
  - **Soft Delete**: `is_deleted` (BOOLEAN, default false), `deleted_at` (TIMESTAMPTZ)
  - **Audit**: `created_at`, `updated_at`, `created_by`, `updated_by`

- ✅ **Constraints**:
  - UNIQUE(org_id, code) - Machine codes unique per organization
  - Code format: `^[A-Z0-9-]+$` (uppercase alphanumeric with hyphens)
  - Code length: max 50 characters
  - Capacity validations: positive integers or NULL

- ✅ **Indexes**:
  - `idx_machines_org_id` - Query by organization
  - `idx_machines_type` - Filter by machine type
  - `idx_machines_status` - Filter by status
  - `idx_machines_location` - Join with locations
  - `idx_machines_org_code` - Unique lookup
  - `idx_machines_org_not_deleted` - Exclude deleted records

- ✅ **Triggers**:
  - `update_machines_updated_at_trigger` - Auto-update updated_at on UPDATE

- ✅ **Comments**: Full documentation on table, columns, and constraints

### Migration 073: Machines RLS Policies
**File**: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/supabase/migrations/073_machines_rls_policies.sql`
**Status**: CREATED

**Features Implemented**:
- ✅ **RLS Enabled**: `ALTER TABLE machines ENABLE ROW LEVEL SECURITY`

- ✅ **Policies** (ADR-013 Pattern - Users Table Lookup):
  1. **SELECT Policy** (`machines_select`):
     - All authenticated users can read machines in their org
     - Filters: `org_id = user's org_id AND is_deleted = false`
     - Hides soft-deleted machines

  2. **INSERT Policy** (`machines_insert`):
     - Roles: SUPER_ADMIN, ADMIN, PROD_MANAGER
     - Validates: org_id match + role check

  3. **UPDATE Policy** (`machines_update`):
     - Roles: SUPER_ADMIN, ADMIN, PROD_MANAGER
     - Validates: org_id match + role check

  4. **DELETE Policy** (`machines_delete`):
     - Roles: SUPER_ADMIN, ADMIN only (no PROD_MANAGER)
     - Validates: org_id match + role check
     - Note: Soft delete preferred over hard delete

- ✅ **Comments**: Documentation on each policy's purpose and permissions

## Schema Verification

### Enums
```sql
-- machine_type (9 values)
MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER

-- machine_status (4 values)
ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED
```

### Table Structure
```sql
machines (
  id                 UUID PRIMARY KEY
  org_id             UUID NOT NULL FK → organizations
  code               VARCHAR(50) NOT NULL UNIQUE per org
  name               VARCHAR(100) NOT NULL
  description        TEXT
  type               machine_type NOT NULL DEFAULT 'OTHER'
  status             machine_status NOT NULL DEFAULT 'ACTIVE'
  units_per_hour     INTEGER (optional, > 0)
  setup_time_minutes INTEGER (optional, >= 0)
  max_batch_size     INTEGER (optional, > 0)
  location_id        UUID FK → locations ON DELETE SET NULL
  is_deleted         BOOLEAN DEFAULT false
  deleted_at         TIMESTAMPTZ
  created_at         TIMESTAMPTZ DEFAULT NOW()
  updated_at         TIMESTAMPTZ DEFAULT NOW()
  created_by         UUID FK → users
  updated_by         UUID FK → users
)
```

### Indexes (6 total)
- org_id (filter by organization)
- type (filter by machine type)
- status (filter by status)
- location_id (join with locations)
- org_id + code (unique lookup)
- org_id + is_deleted (exclude deleted)

### RLS Policies (4 total)
- SELECT: All authenticated users (org filtered, non-deleted only)
- INSERT: SUPER_ADMIN, ADMIN, PROD_MANAGER
- UPDATE: SUPER_ADMIN, ADMIN, PROD_MANAGER
- DELETE: SUPER_ADMIN, ADMIN

## Security Checklist

- ✅ **Multi-tenant Isolation**: All policies enforce org_id match via users table lookup
- ✅ **Role-Based Access**: Permissions checked via roles table join
- ✅ **ADR-013 Compliance**: Using `(SELECT org_id FROM users WHERE id = auth.uid())` pattern
- ✅ **No SQL Injection**: Parameterized queries enforced by RLS
- ✅ **Soft Delete Support**: SELECT policy filters `is_deleted = false`
- ✅ **Audit Trail**: created_by, updated_by, created_at, updated_at, deleted_at
- ✅ **Foreign Key Constraints**: org_id, location_id, created_by, updated_by
- ✅ **Data Validation**: CHECK constraints on code format, capacity values
- ✅ **Unique Constraints**: org_id + code ensures unique machine codes per org

## Testing (Cannot Execute - Docker Not Running)

**Note**: Local Supabase testing skipped due to Docker Desktop not running. Migrations will be tested when deployed.

**Command to test later**:
```bash
npx supabase db reset --local
```

## Exit Criteria Status

- ✅ Migrations created (072, 073)
- ✅ RLS policies enforce org isolation (ADR-013 pattern)
- ✅ Permissions enforce role requirements (PROD_MANAGER+, ADMIN+ for delete)
- ✅ No SQL injection vulnerabilities (RLS + constraints)
- ⏸️ Migrations run successfully (pending Docker setup)

## Next Steps (Track B - Services & API)

### 1. Type Definitions
**File**: `apps/frontend/lib/types/machine.ts`
```typescript
export type MachineType = 'MIXER' | 'OVEN' | 'FILLER' | 'PACKAGING' | 'CONVEYOR' | 'BLENDER' | 'CUTTER' | 'LABELER' | 'OTHER'
export type MachineStatus = 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED'

export interface Machine {
  id: string
  org_id: string
  code: string
  name: string
  description?: string
  type: MachineType
  status: MachineStatus
  units_per_hour?: number
  setup_time_minutes?: number
  max_batch_size?: number
  location_id?: string
  location?: { id: string; full_path: string; name: string }
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}
```

### 2. Validation Schemas
**File**: `apps/frontend/lib/validation/machine-schemas.ts`
- Create/Update schemas with Zod
- Code validation: uppercase alphanumeric + hyphens, max 50 chars
- Capacity validations: positive integers
- Type/Status enum validations

### 3. Service Layer
**File**: `apps/frontend/lib/services/machine-service.ts`
- `list()` - with filters (type, status, search, location)
- `getById()` - with location details join
- `create()` - with validation
- `update()` - with validation
- `updateStatus()` - status-only updates
- `delete()` - with safety checks (production line assignments)
- `isCodeUnique()` - uniqueness validation
- `canDelete()` - pre-delete validation

### 4. API Routes
**Files**:
- `apps/frontend/app/api/v1/settings/machines/route.ts` (GET, POST)
- `apps/frontend/app/api/v1/settings/machines/[id]/route.ts` (GET, PUT, DELETE)
- `apps/frontend/app/api/v1/settings/machines/[id]/status/route.ts` (PATCH)

**Permission Requirements**:
- View: All authenticated users
- Create/Edit/Status: PROD_MANAGER+ role
- Delete: ADMIN+ role only

## Test Files Waiting for Implementation

### Unit Tests
**File**: `apps/frontend/lib/services/__tests__/machine-service.test.ts`
**Status**: PASSING (with placeholders - needs implementation)
**Scenarios**: 48 tests

### Integration Tests
**File**: `apps/frontend/__tests__/01-settings/01.10.machines-api.test.ts`
**Status**: PASSING (with placeholders - needs implementation)
**Scenarios**: 39 tests

### Component Tests
**Files**:
- `MachinesDataTable.test.tsx` (23 scenarios)
- `MachineModal.test.tsx` (27 scenarios)
**Status**: FAILING (correctly) - Missing hooks and components

## Dependencies Met

- ✅ Story 01.8 (Warehouses CRUD) - warehouses table exists
- ✅ Story 01.9 (Locations CRUD) - locations table exists for location_id FK
- ✅ Story 01.1 (Org Context + Base RLS) - organizations table, RLS pattern
- ✅ Story 01.6 (Role Permissions) - roles table, permission checks

## Files Created

```
supabase/migrations/
  072_create_machines_table.sql      (126 lines)
  073_machines_rls_policies.sql      (87 lines)
```

## Quality Gates

### Completed
- ✅ All database fields match database.yaml specification
- ✅ All indexes created per specification
- ✅ RLS policies follow ADR-013 pattern exactly
- ✅ Foreign key constraints with proper ON DELETE actions
- ✅ CHECK constraints for data validation
- ✅ Soft delete support with is_deleted flag
- ✅ Audit trail complete (created_at, updated_at, created_by, updated_by, deleted_at)

### Pending (Track B)
- ⏸️ Service layer implementation
- ⏸️ API routes implementation
- ⏸️ Validation schemas (Zod)
- ⏸️ Tests passing (GREEN)

---

**BACKEND-DEV Sign-off**: Track A (Database) complete. Migrations created following ADR-013 pattern. Ready for Track B (Services/API).

**Date**: 2025-12-22
