# Story 2.6: BOM CRUD

Status: ready-for-dev

## Story

As a **Technical user**,
I want to create and manage Bills of Materials,
So that we define product recipes.

## Acceptance Criteria

### AC-2.6.1: BOM List View
**Given** the user has Technical role or higher
**When** they navigate to /technical/boms
**Then** they see a table/list of BOMs grouped by product

**And** each group shows:
- Product code and name
- Number of BOM versions
- Latest version number
- Active BOM indicator

**And** can expand product to see all versions with:
- Version number
- Effective date range (from - to)
- Status (Draft, Active, Phased Out, Inactive)
- Items count
- Actions (View, Edit, Delete, Clone, Compare)

### AC-2.6.2: Create BOM Form
**When** clicking "Add BOM"
**Then** a form/modal opens with:
- product_id (dropdown with search, required)
- version (auto-generated, read-only, shows "Will be 1.0" if first BOM)
- effective_from (date picker, required)
- effective_to (date picker, optional)
- status (dropdown: Draft, Active, Phased Out, Inactive, default Draft)
- output_qty (number input, default 1.0, must be > 0)
- output_uom (from selected product, read-only)
- notes (textarea, optional)

**And** all dropdowns properly populated
**And** inline validation on blur

### AC-2.6.3: Version Auto-Assignment
**When** saving BOM
**Then** version is auto-assigned:
- If first BOM dla product → version = "1.0"
- If subsequent BOM → version = max(existing_versions) + 0.1
  - Example: existing v1.0, v1.1 → new BOM gets v1.2

**And** version is immutable after creation

### AC-2.6.4: BOM Created Successfully
**When** BOM saved successfully
**Then** success toast displayed
**And** navigate to BOM Detail page /technical/boms/:id
**And** audit trail entry created (created_by, created_at)

### AC-2.6.5: Edit BOM
**Given** a BOM exists
**When** clicking Edit
**Then** Edit form opens with all fields except:
- product_id (immutable)
- version (immutable)

**And** can update:
- effective_from / effective_to (with date overlap validation)
- status
- output_qty / output_uom
- notes

### AC-2.6.6: Delete BOM
**Given** a BOM exists
**When** clicking Delete
**Then** confirmation modal appears:
"Delete BOM v1.0 for Product X? This will also delete all BOM items. This action cannot be undone."

**When** confirming
**Then** BOM and all bom_items deleted (cascade)
**And** success toast: "BOM v1.0 deleted"

**And** cannot delete if BOM is referenced by WOs (FK constraint, Epic 3 integration)

### AC-2.6.7: Search and Filter
**Given** BOM list page
**Then** can search by:
- Product code
- Product name

**And** can filter by:
- Status (Draft, Active, Phased Out, Inactive)
- Date range (BOMs active during specific period)

**And** can sort by:
- Product name
- Version
- Effective date
- Status

## Tasks / Subtasks

### Task 1: Database Schema & Migrations (AC: 2.6.1-2.6.3)
- [ ] Create `boms` table migration:
  ```sql
  CREATE TABLE boms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    version VARCHAR(10) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    output_qty DECIMAL(10,3) NOT NULL DEFAULT 1.0,
    output_uom VARCHAR(10) NOT NULL,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_bom_version UNIQUE (org_id, product_id, version),
    CONSTRAINT check_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT check_output_qty CHECK (output_qty > 0),
    CONSTRAINT check_status CHECK (status IN ('draft', 'active', 'phased_out', 'inactive'))
  );
  ```
- [ ] Add indexes:
  ```sql
  CREATE INDEX idx_boms_org ON boms(org_id);
  CREATE INDEX idx_boms_product ON boms(org_id, product_id);
  CREATE INDEX idx_boms_dates ON boms(org_id, product_id, effective_from, effective_to);
  CREATE INDEX idx_boms_status ON boms(org_id, status);
  ```
- [ ] Add RLS policy:
  ```sql
  ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
  CREATE POLICY boms_org_isolation ON boms
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  ```
- [ ] Add date overlap validation trigger (deferred to Story 2.8)
- [ ] Run migration and verify schema

### Task 2: API Endpoints (AC: 2.6.1-2.6.6)
- [ ] Implement GET /api/technical/boms
  - [ ] Query params: product_id?, status?, search?, sort_by?, limit?, offset?
  - [ ] Return: BOM[] (with items count, product info)
  - [ ] Grouped by product_id if no product_id filter
  - [ ] Apply search/filter/sort
  - [ ] Paginated (50 per page default)
  - [ ] Cache: 5 min TTL
- [ ] Implement POST /api/technical/boms
  - [ ] Body: CreateBOMInput (Zod validation)
  - [ ] Auto-assign version:
    ```typescript
    const maxVersion = await getMaxVersion(org_id, product_id)
    const newVersion = maxVersion ? incrementVersion(maxVersion) : '1.0'
    ```
  - [ ] Insert BOM record with created_by from JWT
  - [ ] Return: BOM object
  - [ ] Require Technical role or higher
- [ ] Implement PUT /api/technical/boms/:id
  - [ ] Body: UpdateBOMInput (Zod validation)
  - [ ] Cannot update product_id or version
  - [ ] Update record with updated_by, updated_at
  - [ ] Invalidate cache
  - [ ] Return: BOM object
- [ ] Implement GET /api/technical/boms/:id
  - [ ] Query param: include_items? (default false)
  - [ ] Return: BOM object (with items[] if requested)
  - [ ] Cache: 5 min TTL
- [ ] Implement DELETE /api/technical/boms/:id
  - [ ] Check if BOM has WO references (FK constraint will block, return clear error)
  - [ ] Delete BOM (cascade delete bom_items)
  - [ ] Invalidate cache
  - [ ] Return: { success: true }

### Task 3: Zod Validation Schemas (AC: 2.6.2-2.6.5)
- [ ] Create lib/validation/bom-schemas.ts
  ```typescript
  export const CreateBOMSchema = z.object({
    product_id: z.string().uuid('Invalid product ID'),
    effective_from: z.string().datetime('Invalid date format'),
    effective_to: z.string().datetime('Invalid date format').optional()
      .refine((val, ctx) => {
        if (val && ctx.parent.effective_from) {
          return new Date(val) > new Date(ctx.parent.effective_from)
        }
        return true
      }, 'effective_to must be after effective_from'),
    status: z.enum(['draft', 'active', 'phased_out', 'inactive']),
    output_qty: z.number().positive('Output quantity must be positive'),
    output_uom: z.string().min(1, 'UoM is required'),
    notes: z.string().optional()
  })

  export const UpdateBOMSchema = CreateBOMSchema.omit({ product_id: true })
  ```
- [ ] Use schemas in both client and server validation

### Task 4: Frontend BOM List Page (AC: 2.6.1, 2.6.7)
- [ ] Create /app/technical/boms/page.tsx
- [ ] Implement BOMList component:
  - [ ] Grouped by product (collapsible sections)
  - [ ] Each product section shows BOM versions table
  - [ ] Columns: Version, Date Range, Status, Items Count, Actions
  - [ ] Search bar (product code/name)
  - [ ] Filter dropdowns (status, date range)
  - [ ] Sort controls
- [ ] Use SWR dla data fetching with 5 min cache
- [ ] Loading states (skeleton loaders)
- [ ] Empty state: "No BOMs yet. Create your first BOM to get started."

### Task 5: Frontend Create/Edit BOM Form (AC: 2.6.2-2.6.5)
- [ ] Create components/technical/BOMForm.tsx
- [ ] Implement react-hook-form with CreateBOMSchema
- [ ] Product selector:
  - [ ] Dropdown with search (Combobox component)
  - [ ] Fetch products from /api/technical/products
  - [ ] Show: code, name, type
  - [ ] On select → populate output_uom from product
- [ ] Date pickers dla effective_from / effective_to
  - [ ] Use shadcn/ui Calendar component
  - [ ] Inline validation: effective_to > effective_from
- [ ] Status dropdown (4 options)
- [ ] Output quantity input (number, default 1.0)
- [ ] Notes textarea
- [ ] Version display (read-only):
  - [ ] Show "Version will be X.Y" (calculate on client after product selected)
  - [ ] Fetch max version: GET /api/technical/boms?product_id=X&_max_version_only
- [ ] Submit button → POST or PUT
- [ ] Success toast → navigate to BOM detail page

### Task 6: Frontend BOM Detail Page (AC: 2.6.4)
- [ ] Create /app/technical/boms/[id]/page.tsx
- [ ] Header section:
  - [ ] Product name and code
  - [ ] BOM version badge
  - [ ] Status badge (color-coded)
  - [ ] Effective date range
  - [ ] Actions: Edit, Delete, Clone, Compare (buttons)
- [ ] Tabs:
  - [ ] Items (Story 2.7)
  - [ ] Allergens (Story 2.14)
  - [ ] History (future)
- [ ] Audit trail footer:
  - [ ] Created by {user} on {date}
  - [ ] Last updated by {user} on {date}

### Task 7: Delete BOM Confirmation (AC: 2.6.6)
- [ ] Create components/technical/DeleteBOMModal.tsx
- [ ] Confirmation message z BOM version i product name
- [ ] Warning: "This will also delete X items"
- [ ] Two buttons: Cancel, Delete (red, destructive)
- [ ] On delete → API call → success toast → navigate to list

### Task 8: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] CreateBOMSchema validation (valid/invalid inputs)
  - [ ] Version increment logic (1.0 → 1.1, 1.9 → 2.0)
  - [ ] Date validation (effective_to > effective_from)
- [ ] Integration tests (lib/api/__tests__/boms.test.ts):
  - [ ] POST /api/technical/boms → BOM created with v1.0
  - [ ] POST again dla same product → v1.1 assigned
  - [ ] PUT /api/technical/boms/:id → fields updated
  - [ ] DELETE /api/technical/boms/:id → cascade delete items
  - [ ] GET /api/technical/boms?product_id=X → filtered results
- [ ] E2E tests (__tests__/e2e/bom-crud.spec.ts):
  - [ ] Navigate to /technical/boms
  - [ ] Click "Add BOM"
  - [ ] Fill form with valid data
  - [ ] Submit → BOM created, navigate to detail page
  - [ ] Edit BOM → update status → success
  - [ ] Delete BOM → confirm → BOM removed from list
  - [ ] Search BOMs by product name → results filtered

### Task 9: Documentation & Cleanup
- [ ] Update TypeScript interfaces (lib/types/bom.ts)
- [ ] Add API route documentation (JSDoc comments)
- [ ] Update seed script (add sample BOMs dla demo products)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Form, Table, Dialog, Combobox, Calendar)
- **Forms**: React Hook Form + Zod validation
- **Database**: PostgreSQL 15 via Supabase
- **State**: SWR for data fetching/caching

### Architecture Patterns
- **Multi-tenancy**: org_id isolation via RLS
- **Audit Trail**: created_by, updated_by, created_at, updated_at
- **Version Management**: Auto-increment logic (X.Y format)
- **Cascade Delete**: bom_items deleted when BOM deleted

### Key Technical Decisions
1. **Version Format**: X.Y (e.g., 1.0, 1.1, 2.0) - simple, readable, auto-incremented
2. **Version Auto-Increment**: Backend calculates version (client shows preview)
3. **Date Overlap**: Story 2.8 adds validation trigger (this story just saves dates)
4. **Product-BOM Relationship**: One product can have multiple BOMs (versioned)

### Security Considerations
- **RLS Policy**: Enforce org_id isolation
- **Role Check**: Technical role or higher dla write operations
- **FK Constraints**: ON DELETE RESTRICT dla products (cannot delete product with BOMs)
- **Input Validation**: Zod schemas prevent SQL injection

### Project Structure
```
app/
  technical/
    boms/
      page.tsx                    # BOM list page (grouped by product)
      [id]/
        page.tsx                  # BOM detail page
  api/
    technical/
      boms/
        route.ts                  # GET /api/technical/boms, POST
        [id]/
          route.ts                # GET /api/technical/boms/:id, PUT, DELETE

lib/
  validation/
    bom-schemas.ts                # CreateBOMSchema, UpdateBOMSchema
  api/
    BOMService.ts                 # API client methods
  types/
    bom.ts                        # BOM, BOMItem interfaces

components/
  technical/
    BOMList.tsx                   # BOM list grouped by product
    BOMForm.tsx                   # Create/Edit BOM form
    BOMDetail.tsx                 # BOM detail page components
    DeleteBOMModal.tsx            # Delete confirmation modal

supabase/
  migrations/
    20XX_create_boms_table.sql    # Database migration
```

### Testing Strategy
**Unit Tests**: Zod schemas, version increment logic
**Integration Tests**: API endpoints, database operations, RLS policies
**E2E Tests**: Complete BOM CRUD flow, search/filter

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.6]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#BOMs-Table]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Workflow-1]

### Prerequisites
**Epic 2 Batch 2A:**
- Products table (product_id FK)
- Technical Settings (status, module activation)

**Epic 1:**
- Organizations (org_id FK)
- Users (created_by, updated_by)

### Dependencies
**External Services:**
- Supabase (Database, Auth)

**Libraries:**
- react-hook-form (form state)
- zod (validation)
- @supabase/supabase-js (Supabase client)
- shadcn/ui (Form, Table, Dialog, Combobox, Calendar, Toast)

## Dev Agent Record

### Context Reference
<!-- Will be filled during implementation -->

### Agent Model Used
<!-- Will be filled during implementation -->

### Debug Log References
<!-- Will be added during implementation -->

### Completion Notes List
<!-- Will be added after story completion -->

### File List
<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code (from Epic 2 + Tech Spec Epic 2 Batch 2B)
