# Story 1.7: Machine Configuration

Status: ready-for-dev

## Story

As an **Admin**,
I want to define production machines,
so that I can track which machines are used in production.

## Acceptance Criteria

### FR-SET-006: Machine Configuration

**AC-006.1**: Admin może stworzyć machine:
- Navigate to /settings/production → "Machines" tab
- Click "Add Machine" button
- Form fields:
  - code: required, unique per org, uppercase alphanumeric + hyphens (e.g., MIX-01)
  - name: required, max 100 chars
  - status: dropdown (Active, Down, Maintenance), default Active
  - capacity_per_hour: optional, decimal number (e.g., 1000.5 units/hour)
  - line_ids: multi-select dropdown (optional, assign to production lines)
- Validation: code unique constraint checked, show error if duplicate
- On save: machine created, line assignments saved in machine_line_assignments table

**AC-006.2**: Machine status affects availability:
- Active: Available for WO assignment (Epic 4)
- Down: Not available, show warning if assigned to active WOs
- Maintenance: Scheduled unavailability, show maintenance schedule
- Status change triggers validation: warn if has active WOs
- Status badge color: Active (green), Down (red), Maintenance (yellow)

**AC-006.3**: Machine-line many-to-many assignment:
- Machine can be assigned to multiple lines (e.g., packaging machine shared across 2 lines)
- Line can have multiple machines (e.g., Line 1 has mixer, filler, capper)
- Assignment table: machine_line_assignments (machine_id, line_id)
- Unique constraint: (machine_id, line_id) - prevents duplicate assignments
- Can assign from machine side (this story) or line side (Story 1.8)

**AC-006.4**: Machines list view:
- Table columns: Code, Name, Status, Lines (count/names), Capacity, Actions
- Lines column: show comma-separated line codes or "No lines assigned"
- Search by code or name
- Filter by status (All, Active, Down, Maintenance)
- Sort by code, name, status, created_at

**AC-006.5**: Cannot delete machine with constraints:
- FK constraint ON DELETE RESTRICT prevents deletion if:
  - Machine assigned to active WOs (Epic 4)
  - Machine has historical usage (audit trail preservation)
- Error message: "Cannot delete machine - it has X active WOs. Archive it instead."
- Archive option: set status = 'maintenance' or soft delete with is_deleted flag
- Recommendation: Archive, not delete (preserve history)

**AC-006.6**: Edit machine:
- Click Edit action → drawer opens with form
- All fields editable (code, name, status, capacity, line assignments)
- Line assignments: multi-select dropdown shows all lines
- Can add/remove line assignments
- On save: machine updated, assignments updated (delete old, insert new)

**AC-006.7**: Machine detail page:
- Navigate to /settings/machines/:id
- Display: code, name, status, capacity, assigned lines (with links)
- Actions: Edit, Change Status, View WOs (Epic 4 link)
- Related entities: Active WOs using this machine (Epic 4), historical usage stats

**AC-006.8**: Cache invalidation events:
- On machine create/update/delete: emit 'machine.updated' event
- Epic 4 refetches machine list on event
- Redis cache TTL: 5 min
- Cache key: `machines:{org_id}`

## Tasks / Subtasks

### Task 1: Database Schema - Machines & Assignments Tables (AC: 006.1, 006.2, 006.3, 006.5)
- [ ] Create `machines` table migration:
  - [ ] id UUID PK
  - [ ] org_id UUID FK → organizations (RLS key)
  - [ ] code VARCHAR(50) NOT NULL
  - [ ] name VARCHAR(100) NOT NULL
  - [ ] status VARCHAR(20) NOT NULL (enum: active, down, maintenance)
  - [ ] capacity_per_hour DECIMAL(10,2) (nullable)
  - [ ] created_by UUID FK → users
  - [ ] updated_by UUID FK → users
  - [ ] created_at TIMESTAMP DEFAULT NOW()
  - [ ] updated_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, code)
- [ ] Add index: org_id, status
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Create `machine_line_assignments` table:
  - [ ] id UUID PK
  - [ ] machine_id UUID FK → machines (ON DELETE CASCADE)
  - [ ] line_id UUID FK → production_lines (ON DELETE CASCADE)
  - [ ] created_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (machine_id, line_id) - prevents race condition
- [ ] Add indexes: machine_id, line_id
- [ ] Run migration and verify schema

### Task 2: Machine Service - Core Logic (AC: 006.1, 006.2, 006.4, 006.5, 006.6)
- [ ] Create MachineService class/module
  - [ ] createMachine(input: CreateMachineInput)
    - [ ] Validate: code unique per org
    - [ ] Validate: status is valid enum value
    - [ ] Insert machine record
    - [ ] If line_ids provided: insert machine_line_assignments
    - [ ] Return machine object with assigned lines
    - [ ] Emit cache event: 'machine.created'
  - [ ] updateMachine(id: string, input: UpdateMachineInput)
    - [ ] Validate: machine exists, belongs to org
    - [ ] Validate: code still unique if changed
    - [ ] If status changing to Down/Maintenance: check active WOs, warn user
    - [ ] Update machine record
    - [ ] Update line assignments: delete old, insert new
    - [ ] Return updated machine
    - [ ] Emit cache event: 'machine.updated'
  - [ ] getMachines(orgId: string, filters?: MachineFilters)
    - [ ] Query machines WHERE org_id = orgId
    - [ ] Apply filters: status, search (code/name)
    - [ ] Include line assignments (JOIN machine_line_assignments → production_lines)
    - [ ] Sort by specified column
    - [ ] Return machines array with line names
  - [ ] deleteMachine(id: string, orgId: string)
    - [ ] Validate: machine exists, belongs to org
    - [ ] Check: not assigned to active WOs (query WOs table - Epic 4)
    - [ ] Try DELETE (FK constraints will prevent if has dependencies)
    - [ ] Catch constraint error → return friendly error message
    - [ ] Recommendation: Archive (status = 'maintenance') instead
    - [ ] Emit cache event: 'machine.deleted'

### Task 3: Zod Validation Schemas (AC: 006.1, 006.6)
- [ ] Create CreateMachineSchema
  - [ ] code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50)
  - [ ] name: z.string().min(1).max(100)
  - [ ] status: z.enum(['active', 'down', 'maintenance']).default('active')
  - [ ] capacity_per_hour: z.number().positive().optional()
  - [ ] line_ids: z.array(z.string().uuid()).optional()
- [ ] Create UpdateMachineSchema (extends CreateMachineSchema)
- [ ] Use schemas in API endpoints (client + server validation)

### Task 4: API Endpoints (AC: 006.1, 006.4, 006.5, 006.6, 006.7)
- [ ] Implement GET /api/settings/machines
  - [ ] Query params: status?, search?
  - [ ] Filter by org_id (from JWT)
  - [ ] Call MachineService.getMachines
  - [ ] Include line names (JOIN)
  - [ ] Return machines array
  - [ ] Auth: Authenticated user
  - [ ] Cache: Redis 5 min TTL
- [ ] Implement POST /api/settings/machines
  - [ ] Body: CreateMachineInput
  - [ ] Validate: Zod schema
  - [ ] Call MachineService.createMachine
  - [ ] Return created machine
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: machines:{org_id}
- [ ] Implement GET /api/settings/machines/:id
  - [ ] Return machine detail with assigned lines
  - [ ] Auth: Authenticated
- [ ] Implement PUT /api/settings/machines/:id
  - [ ] Body: UpdateMachineInput
  - [ ] Validate: Zod schema
  - [ ] Call MachineService.updateMachine
  - [ ] Return updated machine
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: machines:{org_id}
- [ ] Implement DELETE /api/settings/machines/:id
  - [ ] Call MachineService.deleteMachine
  - [ ] Return success or error message
  - [ ] Auth: Admin only
  - [ ] Invalidate cache: machines:{org_id}

### Task 5: Frontend Machines List Page (AC: 006.4)
- [ ] Create /app/settings/production/page.tsx with "Machines" tab
- [ ] Implement MachinesTable component
  - [ ] Columns: Code, Name, Status, Lines, Capacity, Actions
  - [ ] Status badge: color-coded (Active green, Down red, Maintenance yellow)
  - [ ] Lines column: comma-separated codes or "No lines" badge
  - [ ] Actions: Edit, Change Status, View Detail
  - [ ] Search input (filter by code/name)
  - [ ] Status filter dropdown (All, Active, Down, Maintenance)
  - [ ] Sort by code, name, status, created_at
- [ ] Fetch data: GET /api/settings/machines
  - [ ] Use SWR for caching
  - [ ] Auto-refresh every 5 min
  - [ ] Loading state, error state

### Task 6: Machine Form Modal (AC: 006.1, 006.6)
- [ ] Create MachineFormModal component
  - [ ] Triggered by "Add Machine" button or Edit action
  - [ ] Mode: create or edit
- [ ] Form fields:
  - [ ] Code: uppercase input, validation feedback
  - [ ] Name: text input
  - [ ] Status: dropdown (Active, Down, Maintenance) with colored badges
  - [ ] Capacity per Hour: number input (optional, decimal allowed)
  - [ ] Production Lines: multi-select searchable dropdown
- [ ] Line assignment UI:
  - [ ] Multi-select dropdown shows all production lines
  - [ ] Selected lines shown as badges (removable)
  - [ ] Can add/remove lines
- [ ] Form submission:
  - [ ] Validate: Zod schema
  - [ ] POST /api/settings/machines (create) or PUT (update)
  - [ ] Success: close modal, refresh table, toast
  - [ ] Error: show validation errors inline

### Task 7: Machine Status Change (AC: 006.2)
- [ ] Implement status change functionality
  - [ ] Quick status change: dropdown in table row
  - [ ] Or dedicated "Change Status" action → modal
- [ ] Status change validation:
  - [ ] If changing to Down/Maintenance: query active WOs using this machine
  - [ ] If active WOs found: show warning modal
  - [ ] Warning: "X active WOs use this machine. Changing status will affect production. Continue?"
  - [ ] On confirm: change status, log action
- [ ] Status change audit:
  - [ ] Log status changes in audit table (future)
  - [ ] Track: old_status, new_status, changed_by, reason, timestamp

### Task 8: Machine Detail Page (AC: 006.7)
- [ ] Create /app/settings/machines/[id]/page.tsx
- [ ] Display sections:
  - [ ] Basic Info: code, name, status (badge), capacity
  - [ ] Assigned Lines: list with links to line detail pages
  - [ ] Actions: Edit, Change Status
- [ ] Related entities (Epic 4 integration - future):
  - [ ] Active WOs using this machine (count, link to WO list)
  - [ ] Historical usage stats (total WOs, avg runtime, downtime)

### Task 9: Line Assignment Management (AC: 006.3)
- [ ] Implement line assignment logic
  - [ ] On machine create/update: receive line_ids array
  - [ ] Delete existing assignments: DELETE FROM machine_line_assignments WHERE machine_id = X
  - [ ] Insert new assignments: bulk INSERT line_ids
  - [ ] Handle race condition: unique constraint (machine_id, line_id) prevents duplicates
- [ ] Bidirectional assignment:
  - [ ] This story: assign lines to machine
  - [ ] Story 1.8: assign machines to line (reverse direction)
  - [ ] Both update same machine_line_assignments table
  - [ ] UI shows assignments from both perspectives

### Task 10: Cache Invalidation & Events (AC: 006.8)
- [ ] Implement cache event emitter
  - [ ] After machine create/update/delete: emit event
  - [ ] Event format: { type: 'machine.updated', org_id, machine_id, timestamp }
  - [ ] Use Supabase Realtime or Redis pub/sub
- [ ] Implement cache invalidation
  - [ ] On event: invalidate Redis cache key `machines:{org_id}`
  - [ ] Frontend: invalidate SWR cache on event
  - [ ] Epic 4 subscribes to these events (future)

### Task 11: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Machine validation (code format, status enum)
  - [ ] Line assignment logic (bulk insert, unique constraint)
  - [ ] Status change validation (warn if active WOs)
- [ ] Integration tests:
  - [ ] POST machine → created with line assignments
  - [ ] PUT machine → line assignments updated (old deleted, new inserted)
  - [ ] DELETE machine with active WOs → FK constraint error
  - [ ] Change status to Down → warning if active WOs
  - [ ] Unique constraint: (machine_id, line_id) prevents duplicate assignment
  - [ ] RLS policy: User A cannot access User B's machines
- [ ] E2E tests (Playwright):
  - [ ] Create machine → appears in list with assigned lines
  - [ ] Edit machine → change line assignments → saved
  - [ ] Change status → warning shown if active WOs
  - [ ] Cannot delete machine with WOs → error shown
  - [ ] Filter machines by status → correct results

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Dialog, Badge, MultiSelect)
- **Forms**: React Hook Form + Zod validation
- **Database**: PostgreSQL 15 via Supabase
- **Cache**: Redis (Upstash) for machine list caching
- **Events**: Supabase Realtime or Redis pub/sub for cache invalidation

### Architecture Patterns
- **Multi-tenancy**: RLS policy on machines table (org_id isolation)
- **Many-to-Many**: machine_line_assignments join table
- **Status Lifecycle**: Active → Down → Maintenance (affects WO assignment)
- **Soft Delete**: Status = 'maintenance' instead of hard delete (preserve history)
- **Cache Invalidation**: Events emitted on mutations, consumed by Epic 4
- **FK Constraints**: ON DELETE RESTRICT prevents accidental machine deletion

### Key Technical Decisions

1. **Machine Status**:
   - Active: Normal operation, available for WO assignment
   - Down: Unplanned downtime (breakdown), not available for new WOs
   - Maintenance: Planned downtime, scheduled unavailability
   - Status change triggers validation: warn if active WOs affected

2. **Many-to-Many Assignment**:
   ```
   machines ←→ machine_line_assignments ←→ production_lines

   Scenarios:
   - 1 machine → multiple lines (e.g., shared packaging machine)
   - 1 line → multiple machines (e.g., Line 1 has mixer, filler, capper)

   Assignment flow:
   - Story 1.7: Admin assigns lines to machine
   - Story 1.8: Admin assigns machines to line (reverse)
   - Both update same machine_line_assignments table
   ```

3. **Unique Constraint (machine_id, line_id)**:
   - Prevents duplicate assignments
   - Prevents race condition: 2 users assign same machine to same line simultaneously
   - Tech Spec Gap: This constraint critical for data integrity

4. **Capacity Per Hour**:
   - Optional field (some machines don't track capacity)
   - Decimal type (supports fractional units, e.g., 1000.5 kg/hour)
   - Future use: WO scheduling (Epic 4), capacity planning (Epic 3)

5. **Archive vs Delete**:
   - Archive: Set status = 'maintenance' or add is_deleted flag
   - Delete: Only if no WOs, no historical usage (rare)
   - Recommendation: Archive (preserve audit trail)

### Security Considerations
- **RLS Policy**: org_id check prevents cross-org access
- **Admin Only**: Only admins can create/edit/delete machines
- **FK Constraints**: Prevent accidental deletion of machines with active WOs
- **Audit Trail**: created_by, updated_by tracked, status changes logged

### Project Structure Notes

Expected file locations:
```
app/
  settings/
    production/
      page.tsx              # Machines tab (this story) + Lines tab (Story 1.8)
    machines/
      [id]/
        page.tsx            # Machine detail page
  api/
    settings/
      machines/
        route.ts            # GET, POST
        [id]/
          route.ts          # GET, PUT, DELETE

lib/
  services/
    MachineService.ts       # Machine CRUD, line assignment logic
  validation/
    machineSchemas.ts       # Zod schemas

components/
  settings/
    MachinesTable.tsx       # Table view component
    MachineFormModal.tsx    # Create/edit form

supabase/
  migrations/
    XXXX_create_machines.sql  # Machines + machine_line_assignments tables
```

### Data Model

```typescript
interface Machine {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  code: string                  // Unique per org (e.g., MIX-01)
  name: string                  // Display name
  status: MachineStatus         // Enum: active, down, maintenance
  capacity_per_hour?: number    // Optional, decimal
  created_by: string            // FK → users
  updated_by: string            // FK → users
  created_at: Date
  updated_at: Date
}

enum MachineStatus {
  Active = 'active',
  Down = 'down',
  Maintenance = 'maintenance'
}

interface MachineLineAssignment {
  id: string
  machine_id: string            // FK → machines (ON DELETE CASCADE)
  line_id: string               // FK → production_lines (ON DELETE CASCADE)
  created_at: Date
}

// Unique constraints:
// - machines: (org_id, code)
// - machine_line_assignments: (machine_id, line_id)
// Indexes: org_id, status, machine_id, line_id
// RLS: machines.org_id = auth.jwt()->>'org_id'
```

### API Endpoints

```typescript
GET    /api/settings/machines
  Query: { status?, search? }
  Response: Machine[] (with line names)
  Auth: Authenticated
  Cache: 5 min TTL

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
  Validation: Status change warnings

DELETE /api/settings/machines/:id
  Response: { success: boolean } or { error: string }
  Auth: Admin only
  Note: FK constraints may prevent deletion
```

### Testing Strategy

**Unit Tests** (Vitest):
- Machine validation (code format, status enum)
- Line assignment logic (bulk operations)
- Status change validation

**Integration Tests** (Vitest + Supabase Test Client):
- Create machine → line assignments saved
- Update machine → old assignments deleted, new inserted
- Delete machine with WOs → FK constraint error
- Unique constraint: duplicate assignment prevented
- RLS: User A cannot access User B's machines

**E2E Tests** (Playwright):
- Create machine flow (with line assignments)
- Edit machine (change status, update lines)
- Cannot delete machine with dependencies
- Filter/search machines

### Performance Targets
- Machine list load (100 machines): <200ms p95
- Create machine: <300ms
- Update machine: <250ms
- Cache hit rate: >80%

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.7]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-006]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Machine-Configuration]

### Prerequisites

**Story 1.5**: Warehouse Configuration (needed for context, but no direct FK)
**Story 1.8**: Production Line Configuration (lines table needed for assignments)

Note: Stories 1.7 and 1.8 can be developed in parallel, join table created in either story.

### Dependencies

**External Services:**
- Supabase (Database)
- Redis (Upstash) for caching

**Libraries:**
- @supabase/supabase-js, react-hook-form, zod, swr, shadcn/ui

**Internal Dependencies:**
- organizations, users tables
- production_lines table (from Story 1.8)

**Downstream:**
- Epic 4: WO operation assignment uses machines

## Dev Agent Record

### Context Reference

Story Context: [docs/sprint-artifacts/1-7-machine-configuration.context.xml](./1-7-machine-configuration.context.xml)

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
