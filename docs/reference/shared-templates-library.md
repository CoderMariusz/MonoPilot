# Shared Templates Library - MonoPilot
**Generated:** 2025-11-23
**Updated:** 2025-01-23 (Added Templates F, G, H)
**Purpose:** Reusable templates to reduce story context token usage by 60-80%
**Project:** MonoPilot (Food Manufacturing ERP)

---

## 📖 How to Use This Library

When creating story contexts, **reference these templates instead of rewriting everything**:
- ✅ **Use:** "See TEMPLATE-CRUD-01 for CRUD operations"
- ✅ **Customize:** Only document what's **DIFFERENT** from the template
- ✅ **Save:** 2,000-2,500 tokens per story (60-80% reduction)

**Example:**
```markdown
**Base Template:** TEMPLATE-CRUD-01 (Settings Master Data)
**Table:** machines
**Customizations:**
- Add field: `max_speed_units_per_hour` (INTEGER)
- Add FK: `production_line_id` → production_lines
- Validation: Unique machine_code per org
- UI: Line assignment dropdown on form
```
*Token count: ~500 tokens (83% savings!) ✅*

---

## 📐 ARCHITECTURE TEMPLATES

### TEMPLATE-ARCH-01: Settings Master Data CRUD

**Use Cases:** Warehouses, Locations, Machines, Production Lines, Allergens, Tax Codes, Suppliers

**Pattern:** Simple master data table with org_id scoping, soft delete, audit trail

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│           SETTINGS MASTER DATA ARCHITECTURE              │
└─────────────────────────────────────────────────────────┘

USER ACTION              SERVICE LAYER           DATABASE
────────────────────────────────────────────────────────────
Create Entity    →    service.create()      →  INSERT
                      - Validate uniqueness
                      - Check RLS (org_id)
                 ←    Entity                ←  RETURNING *

Read Entity      →    service.getById()     →  SELECT WHERE id AND org_id
                 ←    Entity | null         ←  ROW | NULL

List Entities    →    service.list()        →  SELECT WHERE org_id
                      - Filter by search          AND is_deleted=false
                      - Pagination                ORDER BY created_at DESC
                 ←    { data[], total }     ←  LIMIT/OFFSET

Update Entity    →    service.update()      →  UPDATE WHERE id AND org_id
                      - Validate changes
                      - Check constraints
                 ←    Entity                ←  RETURNING *

Delete Entity    →    service.delete()      →  UPDATE is_deleted=true
                      - Soft delete only         WHERE id AND org_id
                      - Check dependencies
                 ←    void                  ←  (Audit trail preserved)
```

**Standard Database Schema:**
```sql
CREATE TABLE {entity_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Entity-specific fields
  name TEXT NOT NULL,
  code TEXT,  -- Optional unique code
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- RLS Policy (multi-tenant isolation)
CREATE POLICY "{entity_name}_org_isolation" ON {entity_name}
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Indexes
CREATE INDEX idx_{entity_name}_org ON {entity_name}(org_id);
CREATE INDEX idx_{entity_name}_code ON {entity_name}(org_id, code) WHERE code IS NOT NULL;
```

**Standard API Endpoints:**
```typescript
// Next.js API Routes Pattern
GET    /api/settings/{entity_name}           → List (with filters, pagination)
POST   /api/settings/{entity_name}           → Create
GET    /api/settings/{entity_name}/[id]      → Read by ID
PUT    /api/settings/{entity_name}/[id]      → Update
DELETE /api/settings/{entity_name}/[id]      → Soft Delete
```

**Standard Service Pattern:**
```typescript
// apps/frontend/lib/services/{entity_name}-service.ts
export class EntityService {
  async create(data: EntityCreate): Promise<Entity> {
    // 1. Validate input
    // 2. Check uniqueness (code, name if required)
    // 3. Set org_id from session
    // 4. Insert with RLS auto-scoping
    // 5. Return created entity
  }

  async list(filters?: Filters, pagination?: Pagination): Promise<{ data: Entity[], total: number }> {
    // 1. Build query with org_id filter (RLS)
    // 2. Apply search filters (name, code)
    // 3. Exclude soft-deleted (is_deleted=false)
    // 4. Apply pagination (limit, offset)
    // 5. Return data + total count
  }

  async getById(id: string): Promise<Entity | null> {
    // 1. Query with org_id + id (RLS)
    // 2. Return entity or null
  }

  async update(id: string, data: EntityUpdate): Promise<Entity> {
    // 1. Verify entity exists + org ownership (RLS)
    // 2. Validate changes
    // 3. Update with updated_at = now()
    // 4. Return updated entity
  }

  async delete(id: string): Promise<void> {
    // 1. Check for dependencies (FK constraints)
    // 2. Soft delete: is_deleted=true, deleted_at=now()
    // 3. RLS ensures org_id match
  }
}
```

**Standard UI Components:**
```tsx
// List Page: /settings/{entity_name}
<SettingsListPage>
  <PageHeader title="{Entity Name}" />
  <SearchBar onSearch={handleSearch} />
  <AddButton onClick={openCreateModal} />
  <DataTable
    columns={[name, code, is_active, created_at]}
    data={entities}
    onEdit={openEditModal}
    onDelete={handleDelete}
  />
  <Pagination {...paginationProps} />
</SettingsListPage>

// Modal: Create/Edit Form
<EntityFormModal>
  <Input name="name" required />
  <Input name="code" optional />
  <Textarea name="description" optional />
  <Toggle name="is_active" defaultTrue />
  <SubmitButton />
</EntityFormModal>
```

**Standard Validation:**
```typescript
const entitySchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  code: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
});
```

**Standard Tests:**
```typescript
// Unit Tests (Vitest)
describe('EntityService', () => {
  it('creates entity with org_id scoping', async () => {});
  it('validates uniqueness of code per org', async () => {});
  it('soft deletes and preserves audit trail', async () => {});
});

// RLS Tests
describe('Entity RLS Policies', () => {
  it('prevents cross-org access', async () => {});
  it('allows org users to read own entities', async () => {});
});
```

---

### TEMPLATE-ARCH-02: Transactional Document (PO, TO, WO, SO)

**Use Cases:** Purchase Orders, Transfer Orders, Work Orders, Sales Orders, Shipments

**Pattern:** Header + Lines with status lifecycle, approval workflow, multi-step transactions

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│         TRANSACTIONAL DOCUMENT ARCHITECTURE              │
└─────────────────────────────────────────────────────────┘

DOCUMENT LIFECYCLE:
Draft → Confirmed → In Progress → Completed/Shipped → Closed

USER ACTION                SERVICE LAYER              DATABASE
──────────────────────────────────────────────────────────────────
Create Header      →    service.createHeader()    →  INSERT INTO {doc}_headers
                        - Auto-generate doc number
                        - Set status = 'draft'
                   ←    Header                     ←  RETURNING *

Add Line           →    service.addLine()         →  INSERT INTO {doc}_lines
                        - Validate product exists
                        - Calculate line totals
                        - Update header totals
                   ←    Line                       ←  RETURNING *

Confirm Document   →    service.confirm()         →  BEGIN TRANSACTION
                        - Validate all lines          UPDATE status = 'confirmed'
                        - Check availability          INSERT audit entry
                        - Reserve inventory (if SO)   COMMIT
                   ←    Header                     ←  RETURNING *

Process Document   →    service.process()         →  BEGIN TRANSACTION
                        - Update status                UPDATE status = 'in_progress'
                        - Create related records       INSERT related (GRN, Shipment, etc.)
                        - Update inventory             UPDATE inventory
                   ←    ProcessResult             ←  COMMIT | ROLLBACK

Complete Document  →    service.complete()        →  BEGIN TRANSACTION
                        - Final validations            UPDATE status = 'completed'
                        - Close lines                  UPDATE lines
                        - Update linked docs           UPDATE linked records
                   ←    Header                     ←  COMMIT
```

**Standard Database Schema:**
```sql
-- Header Table
CREATE TABLE {doc}_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Document fields
  doc_number TEXT NOT NULL,  -- Auto-generated
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, confirmed, in_progress, completed

  -- Relationships (varies by doc type)
  supplier_id UUID REFERENCES suppliers(id),  -- PO
  warehouse_id UUID REFERENCES warehouses(id), -- All
  customer_id UUID REFERENCES customers(id),   -- SO

  -- Dates
  doc_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_date DATE,
  actual_date DATE,

  -- Totals (calculated from lines)
  total_lines INTEGER DEFAULT 0,
  total_qty DECIMAL(15,3) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT false
);

-- Lines Table
CREATE TABLE {doc}_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  header_id UUID NOT NULL REFERENCES {doc}_headers(id) ON DELETE CASCADE,

  -- Line fields
  line_number INTEGER NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  ordered_qty DECIMAL(15,3) NOT NULL,
  received_qty DECIMAL(15,3) DEFAULT 0,  -- For receiving
  shipped_qty DECIMAL(15,3) DEFAULT 0,   -- For shipping

  -- Pricing (if applicable)
  unit_price DECIMAL(15,2),
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, partial, completed

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
CREATE POLICY "{doc}_headers_org_isolation" ON {doc}_headers
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "{doc}_lines_org_isolation" ON {doc}_lines
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Indexes
CREATE INDEX idx_{doc}_headers_org_status ON {doc}_headers(org_id, status);
CREATE INDEX idx_{doc}_headers_number ON {doc}_headers(org_id, doc_number);
CREATE INDEX idx_{doc}_lines_header ON {doc}_lines(header_id);
CREATE INDEX idx_{doc}_lines_product ON {doc}_lines(product_id);
```

**Standard Service Pattern:**
```typescript
export class DocumentService {
  async createHeader(data: HeaderCreate): Promise<Header> {
    // 1. Generate doc_number (e.g., PO-2024-0001)
    // 2. Set status = 'draft'
    // 3. Insert header with org_id
    // 4. Return header
  }

  async addLine(headerId: string, lineData: LineCreate): Promise<Line> {
    // 1. Validate header exists + status allows edits
    // 2. Get next line_number
    // 3. Validate product exists
    // 4. Calculate line_total = qty * price * (1 - discount%)
    // 5. Insert line
    // 6. Update header totals (total_lines++, total_qty, total_amount)
    // 7. Return line
  }

  async updateLine(lineId: string, data: LineUpdate): Promise<Line> {
    // 1. Validate line exists + header status allows edits
    // 2. Recalculate line_total if qty/price changed
    // 3. Update line
    // 4. Recalculate header totals
    // 5. Return updated line
  }

  async deleteLine(lineId: string): Promise<void> {
    // 1. Validate line exists + header status allows edits
    // 2. Delete line (cascade delete via FK)
    // 3. Recalculate header totals
  }

  async changeStatus(headerId: string, newStatus: string): Promise<Header> {
    // 1. Validate status transition rules
    // 2. Run status-specific validations
    // 3. BEGIN TRANSACTION
    // 4. Update header.status
    // 5. Execute status-specific side effects (e.g., reserve inventory)
    // 6. Insert audit log entry
    // 7. COMMIT
    // 8. Return updated header
  }

  async confirm(headerId: string): Promise<Header> {
    // 1. Validate header has lines
    // 2. Validate all line quantities > 0
    // 3. Check inventory availability (if SO)
    // 4. Change status to 'confirmed'
  }

  async complete(headerId: string, completionData: CompletionData): Promise<Header> {
    // 1. Validate all lines processed
    // 2. BEGIN TRANSACTION
    // 3. Update header.status = 'completed'
    // 4. Set actual_date = today
    // 5. Update linked documents (e.g., PO.received_qty)
    // 6. Create audit trail
    // 7. COMMIT
  }
}
```

**Standard Status Transitions:**
```typescript
const statusTransitions = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'on_hold'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  cancelled: [], // Terminal state
  closed: [], // Terminal state
};

function validateStatusChange(current: string, next: string): boolean {
  return statusTransitions[current]?.includes(next) ?? false;
}
```

**Standard UI Pattern:**
```tsx
// Header + Lines Page: /planning/{doc_type}/[id]
<DocumentDetailPage>
  <DocumentHeader doc={header} />
  <StatusBadge status={header.status} />
  <ActionButtons>
    {status === 'draft' && <ConfirmButton />}
    {status === 'confirmed' && <ProcessButton />}
    {status === 'in_progress' && <CompleteButton />}
  </ActionButtons>

  <LinesSection>
    <AddLineButton />
    <LinesTable
      columns={[line_number, product, ordered_qty, received_qty, status]}
      data={lines}
      onEdit={editLine}
      onDelete={deleteLine}
    />
  </LinesSection>

  <TotalsSummary>
    <TotalLines>{header.total_lines}</TotalLines>
    <TotalQty>{header.total_qty}</TotalQty>
    <TotalAmount>{header.total_amount}</TotalAmount>
  </TotalsSummary>
</DocumentDetailPage>
```

---

### TEMPLATE-ARCH-03: Traceability Entity (License Plate, Batch, Genealogy)

**Use Cases:** License Plates, Batches, Lot Numbers, Genealogy Records

**Pattern:** Traceable entity with parent/child relationships, status tracking, movement history

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│          TRACEABILITY ENTITY ARCHITECTURE                │
└─────────────────────────────────────────────────────────┘

TRACEABILITY PATTERN:
- Unique identifier (LP number, batch number, lot number)
- Parent/child relationships (genealogy tree)
- Status lifecycle (available, reserved, consumed, shipped)
- Movement audit trail (location changes)
- Source document links (PO, WO, TO)

USER ACTION              SERVICE LAYER              DATABASE
──────────────────────────────────────────────────────────────────
Create LP        →    service.create()          →  BEGIN TRANSACTION
                      - Generate LP number           INSERT INTO license_plates
                      - Link to source doc           INSERT INTO genealogy (if parent)
                      - Set initial location         INSERT INTO movements
                 ←    LP + Movement             ←  COMMIT

Move LP          →    service.move()            →  BEGIN TRANSACTION
                      - Validate destination         UPDATE lp.location_id
                      - Check permissions            INSERT INTO movements
                      - Update qty if split          UPDATE lp.qty (if split)
                 ←    LP + Movement             ←  COMMIT

Consume LP       →    service.consume()         →  BEGIN TRANSACTION
                      - Validate qty available       UPDATE lp.qty -= consumed
                      - Create genealogy link        UPDATE lp.status (if qty=0)
                      - Update WO consumption        INSERT INTO genealogy
                 ←    Consumption + Genealogy   ←  COMMIT

Split LP         →    service.split()           →  BEGIN TRANSACTION
                      - Validate qty > split_qty     UPDATE original.qty
                      - Create new LP                INSERT INTO new LP
                      - Link genealogy               INSERT INTO genealogy (parent)
                 ←    [Original LP, New LP]     ←  COMMIT

Merge LPs        →    service.merge()           →  BEGIN TRANSACTION
                      - Validate compatibility       UPDATE target.qty += source.qty
                      - Same product, batch, expiry  UPDATE source.status = 'consumed'
                      - Preserve traceability        INSERT INTO genealogy (merge)
                 ←    Merged LP                 ←  COMMIT

Trace Forward    →    service.traceForward()    →  RECURSIVE CTE
                      - Find all children            WITH RECURSIVE descendants AS (
                      - Follow genealogy tree          SELECT * FROM genealogy WHERE parent=X
                 ←    Tree of descendants       ←    UNION SELECT ... WHERE parent IN (...))

Trace Backward   →    service.traceBackward()   →  RECURSIVE CTE
                      - Find all ancestors           WITH RECURSIVE ancestors AS (
                      - Follow genealogy tree          SELECT * FROM genealogy WHERE child=X
                 ←    Tree of ancestors         ←    UNION SELECT ... WHERE child IN (...))
```

**Standard Database Schema:**
```sql
-- Traceability Entity (License Plate example)
CREATE TABLE license_plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Identifier
  lp_number TEXT NOT NULL,  -- Auto-generated: LP-2024-000001

  -- Product
  product_id UUID NOT NULL REFERENCES products(id),
  batch_number TEXT,
  lot_number TEXT,
  serial_number TEXT,

  -- Quantity
  qty DECIMAL(15,3) NOT NULL,
  uom TEXT NOT NULL,

  -- Dates
  manufactured_date DATE,
  expiry_date DATE,
  received_date DATE,

  -- Location & Status
  warehouse_id UUID REFERENCES warehouses(id),
  location_id UUID REFERENCES locations(id),
  status TEXT NOT NULL DEFAULT 'available',  -- available, reserved, consumed, shipped, quarantine

  -- Quality
  qa_status TEXT DEFAULT 'pending',  -- pending, passed, failed, quarantine

  -- Source
  source_type TEXT,  -- 'po', 'wo', 'to', 'adjustment'
  source_id UUID,

  -- Parent LP (for splits)
  parent_lp_id UUID REFERENCES license_plates(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

-- Genealogy Table (Parent-Child relationships)
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID NOT NULL REFERENCES license_plates(id),

  -- Relationship
  relationship_type TEXT NOT NULL,  -- 'split', 'merge', 'consumption', 'production'
  qty_consumed DECIMAL(15,3),

  -- Source (what caused this relationship)
  source_type TEXT,  -- 'wo', 'split', 'merge'
  source_id UUID,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Movement History
CREATE TABLE lp_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  lp_id UUID NOT NULL REFERENCES license_plates(id),

  -- Movement
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  movement_type TEXT NOT NULL,  -- 'receive', 'move', 'pick', 'putaway'
  qty DECIMAL(15,3),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- RLS Policies
CREATE POLICY "license_plates_org_isolation" ON license_plates
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "lp_genealogy_dual_fk_rls" ON lp_genealogy
  USING (
    EXISTS (SELECT 1 FROM license_plates WHERE id = parent_lp_id AND org_id = current_setting('app.current_org_id')::uuid)
    AND EXISTS (SELECT 1 FROM license_plates WHERE id = child_lp_id AND org_id = current_setting('app.current_org_id')::uuid)
  );

-- Indexes
CREATE INDEX idx_license_plates_org ON license_plates(org_id);
CREATE INDEX idx_license_plates_number ON license_plates(org_id, lp_number);
CREATE INDEX idx_license_plates_product ON license_plates(product_id, status);
CREATE INDEX idx_license_plates_location ON license_plates(location_id, status);
CREATE INDEX idx_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_movements_lp ON lp_movements(lp_id, created_at DESC);
```

**Standard Service Pattern:**
```typescript
export class LicensePlateService {
  async create(data: LPCreate): Promise<LP> {
    // 1. Generate LP number (LP-2024-000001)
    // 2. Validate product exists
    // 3. BEGIN TRANSACTION
    // 4. INSERT license_plate
    // 5. INSERT movement (receive)
    // 6. If parent_lp_id: INSERT genealogy (split)
    // 7. COMMIT
    // 8. Return LP
  }

  async move(lpId: string, toLocationId: string, qty?: number): Promise<LP> {
    // 1. Validate LP exists + status allows move
    // 2. Validate destination location exists
    // 3. BEGIN TRANSACTION
    // 4. If qty < lp.qty: Split LP (create new LP with remaining)
    // 5. UPDATE lp.location_id
    // 6. INSERT movement record
    // 7. COMMIT
    // 8. Return updated LP
  }

  async consume(lpId: string, woId: string, qtyConsumed: number): Promise<Consumption> {
    // 1. Validate LP has qty available
    // 2. Validate WO exists + status = 'in_progress'
    // 3. BEGIN TRANSACTION
    // 4. UPDATE lp.qty -= qtyConsumed
    // 5. If lp.qty = 0: UPDATE lp.status = 'consumed'
    // 6. INSERT genealogy (parent=LP, child=WO output LP, relationship='consumption')
    // 7. UPDATE wo_materials_consumed
    // 8. COMMIT
    // 9. Return consumption record
  }

  async split(lpId: string, splitQty: number): Promise<[LP, LP]> {
    // 1. Validate LP.qty > splitQty
    // 2. BEGIN TRANSACTION
    // 3. UPDATE original LP.qty -= splitQty
    // 4. INSERT new LP (same product, batch, expiry) with qty=splitQty
    // 5. INSERT genealogy (parent=original, child=new, relationship='split')
    // 6. COMMIT
    // 7. Return [original LP, new LP]
  }

  async traceForward(lpId: string): Promise<GenealogyTree> {
    // 1. Execute RECURSIVE CTE to find all descendants
    // 2. Build tree structure
    // 3. Return tree of children (where did this LP go?)
  }

  async traceBackward(lpId: string): Promise<GenealogyTree> {
    // 1. Execute RECURSIVE CTE to find all ancestors
    // 2. Build tree structure
    // 3. Return tree of parents (where did this LP come from?)
  }

  async recallSimulation(lpId: string): Promise<RecallImpact> {
    // 1. Trace forward to find all children (what was made from this?)
    // 2. Trace backward to find siblings (same batch/lot)
    // 3. Find all shipments containing affected LPs
    // 4. Return impact report (LPs, WOs, Shipments affected)
  }
}
```

**Standard Recursive Queries:**
```sql
-- Forward Trace (descendants)
WITH RECURSIVE descendants AS (
  -- Base case: start with target LP
  SELECT id, lp_number, parent_lp_id, 1 AS level
  FROM license_plates
  WHERE id = $1

  UNION ALL

  -- Recursive case: find children
  SELECT lp.id, lp.lp_number, lp.parent_lp_id, d.level + 1
  FROM license_plates lp
  INNER JOIN descendants d ON lp.parent_lp_id = d.id
  WHERE lp.org_id = current_setting('app.current_org_id')::uuid
)
SELECT * FROM descendants ORDER BY level, lp_number;

-- Backward Trace (ancestors)
WITH RECURSIVE ancestors AS (
  -- Base case: start with target LP
  SELECT id, lp_number, parent_lp_id, 1 AS level
  FROM license_plates
  WHERE id = $1

  UNION ALL

  -- Recursive case: find parents
  SELECT lp.id, lp.lp_number, lp.parent_lp_id, a.level + 1
  FROM license_plates lp
  INNER JOIN ancestors a ON lp.id = a.parent_lp_id
  WHERE lp.org_id = current_setting('app.current_org_id')::uuid
)
SELECT * FROM ancestors ORDER BY level DESC, lp_number;
```

---

### TEMPLATE-ARCH-04: Approval Workflow

**Use Cases:** PO Approval, Gate Approvals (NPD), Quality Hold Release, Costing Approval

**Pattern:** Multi-step approval with role-based permissions, approval history, notifications

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│            APPROVAL WORKFLOW ARCHITECTURE                │
└─────────────────────────────────────────────────────────┘

APPROVAL STATES:
pending_approval → approved / rejected → (optional: escalated)

USER ACTION              SERVICE LAYER              DATABASE
──────────────────────────────────────────────────────────────────
Request Approval →    service.requestApproval()  →  BEGIN TRANSACTION
                      - Validate approver role        UPDATE entity.status = 'pending_approval'
                      - Send notification             INSERT INTO approvals (pending)
                 ←    Approval Request          ←  COMMIT

Approve          →    service.approve()          →  BEGIN TRANSACTION
                      - Validate approver role        UPDATE approvals.status = 'approved'
                      - Execute post-approval         UPDATE entity.status = 'approved'
                      - Send notification             INSERT INTO audit_log
                 ←    Approval                  ←  COMMIT

Reject           →    service.reject()           →  BEGIN TRANSACTION
                      - Validate approver role        UPDATE approvals.status = 'rejected'
                      - Require rejection reason      UPDATE entity.status = 'rejected'
                      - Send notification             INSERT INTO audit_log
                 ←    Rejection                 ←  COMMIT

Escalate         →    service.escalate()         →  BEGIN TRANSACTION
                      - Check escalation rules        UPDATE approvals.escalated = true
                      - Notify higher authority       UPDATE approvals.approver_id = manager
                      - Send escalation notice        INSERT INTO audit_log
                 ←    Escalation                ←  COMMIT
```

**Standard Database Schema:**
```sql
-- Approvals Table (polymorphic)
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Polymorphic relationship (entity being approved)
  entity_type TEXT NOT NULL,  -- 'po', 'npd_project', 'quality_hold', 'costing'
  entity_id UUID NOT NULL,

  -- Approval details
  approval_type TEXT NOT NULL,  -- 'po_approval', 'gate_approval', 'hold_release', 'finance_approval'
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, escalated

  -- Approver
  requested_by UUID NOT NULL REFERENCES users(id),
  approver_id UUID REFERENCES users(id),  -- Who should approve
  approved_by UUID REFERENCES users(id),  -- Who actually approved

  -- Dates
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Notes
  request_notes TEXT,
  approval_notes TEXT,
  rejection_reason TEXT,

  -- Escalation
  escalated BOOLEAN DEFAULT false,
  escalated_to UUID REFERENCES users(id),
  escalated_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy
CREATE POLICY "approvals_org_isolation" ON approvals
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Indexes
CREATE INDEX idx_approvals_org_status ON approvals(org_id, status);
CREATE INDEX idx_approvals_approver ON approvals(approver_id, status);
CREATE INDEX idx_approvals_entity ON approvals(entity_type, entity_id);
```

**Standard Service Pattern:**
```typescript
export class ApprovalService {
  async requestApproval(entityType: string, entityId: string, approverId: string, notes?: string): Promise<Approval> {
    // 1. Validate entity exists
    // 2. Validate approver has required role
    // 3. BEGIN TRANSACTION
    // 4. UPDATE entity.approval_status = 'pending_approval'
    // 5. INSERT approval record (status='pending')
    // 6. COMMIT
    // 7. Send notification to approver
    // 8. Return approval record
  }

  async approve(approvalId: string, notes?: string): Promise<Approval> {
    // 1. Validate approval exists + status = 'pending'
    // 2. Validate current user is approver
    // 3. BEGIN TRANSACTION
    // 4. UPDATE approval.status = 'approved', approved_by, approved_at
    // 5. UPDATE approval.approval_notes = notes
    // 6. UPDATE entity.approval_status = 'approved'
    // 7. Execute post-approval logic (e.g., PO → send to supplier)
    // 8. INSERT audit log entry
    // 9. COMMIT
    // 10. Send approval confirmation notification
    // 11. Return updated approval
  }

  async reject(approvalId: string, reason: string): Promise<Approval> {
    // 1. Validate approval exists + status = 'pending'
    // 2. Validate current user is approver
    // 3. Validate reason provided
    // 4. BEGIN TRANSACTION
    // 5. UPDATE approval.status = 'rejected', approved_by, rejected_at, rejection_reason
    // 6. UPDATE entity.approval_status = 'rejected'
    // 7. INSERT audit log entry
    // 8. COMMIT
    // 9. Send rejection notification to requester
    // 10. Return updated approval
  }

  async escalate(approvalId: string, escalateToId: string): Promise<Approval> {
    // 1. Validate approval exists + status = 'pending'
    // 2. Validate escalation target has higher authority
    // 3. BEGIN TRANSACTION
    // 4. UPDATE approval.escalated = true, escalated_to, escalated_at
    // 5. UPDATE approval.approver_id = escalateToId
    // 6. INSERT audit log entry
    // 7. COMMIT
    // 8. Send escalation notifications
    // 9. Return updated approval
  }

  async getPendingApprovals(approverId: string): Promise<Approval[]> {
    // 1. Query approvals WHERE approver_id = approverId AND status = 'pending'
    // 2. Join with entity tables to get context
    // 3. Return list of pending approvals
  }

  async getApprovalHistory(entityType: string, entityId: string): Promise<Approval[]> {
    // 1. Query approvals WHERE entity_type = X AND entity_id = Y
    // 2. Order by created_at DESC
    // 3. Return approval history
  }
}
```

---

### TEMPLATE-ARCH-05: Scanner Workflow (Mobile/Barcode)

**Use Cases:** Receiving, Picking, Packing, Material Consumption, Inventory Count

**Pattern:** Guided step-by-step workflow with barcode validation, offline queue, error handling

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│            SCANNER WORKFLOW ARCHITECTURE                 │
└─────────────────────────────────────────────────────────┘

SCANNER PATTERN:
1. Show task list (My Picks, Open GRNs, etc.)
2. Select task → Enter guided workflow
3. Scan validation (location, LP, product)
4. Capture data (qty, condition)
5. Submit → Backend processing
6. Feedback → Next item or Complete

ONLINE MODE:
User Scan → Real-time Validation → Server → Response → Feedback

OFFLINE MODE:
User Scan → Local Validation → IndexedDB Queue → (Reconnect) → Sync

USER ACTION              FRONTEND                   BACKEND
──────────────────────────────────────────────────────────────────
View Tasks       →    GET /api/scanner/tasks    →  Query open tasks
                 ←    Task List                 ←  Filter by user role

Start Workflow   →    Navigate to workflow      →  (No API call)
                      - Load task details

Scan Barcode     →    Validate format           →  POST /api/scanner/validate
                      - Check expected type           - Verify entity exists
                 ←    Validation Result         ←    - Return entity details

Capture Data     →    Input qty, notes          →  (Local state)
                      - Client-side validation

Submit Step      →    POST /api/scanner/submit  →  BEGIN TRANSACTION
                      - Send scan data                - Update entity
                 ←    Success + Next Step       ←    - Create records
                                                      - COMMIT

Offline Queue    →    IndexedDB.add()           →  (No API - queued)
                      - Store operation
                      - Display queue count

Sync Queue       →    POST /api/scanner/batch   →  BEGIN TRANSACTION FOR EACH
                      - Send queued operations        - Process operation
                 ←    Sync Results              ←    - COMMIT or ROLLBACK
                                                      - Return results
```

**Standard Workflow Steps Pattern:**
```typescript
// Example: Receiving Workflow
const receivingWorkflow = [
  {
    step: 1,
    action: 'scan_location',
    prompt: 'Scan receiving location',
    validation: 'location_barcode',
  },
  {
    step: 2,
    action: 'scan_po',
    prompt: 'Scan PO number or ASN',
    validation: 'po_number',
  },
  {
    step: 3,
    action: 'scan_product',
    prompt: 'Scan product barcode',
    validation: 'product_barcode',
    expected: 'po_line.product_id',  // Must match PO
  },
  {
    step: 4,
    action: 'enter_qty',
    prompt: 'Enter quantity received',
    validation: 'number > 0',
    warning_if: 'qty > po_line.ordered_qty',
  },
  {
    step: 5,
    action: 'scan_batch_expiry',
    prompt: 'Scan batch number (optional)',
    validation: 'alphanumeric',
    optional: true,
  },
  {
    step: 6,
    action: 'confirm',
    prompt: 'Confirm receipt',
    summary: 'Display: Location, PO, Product, Qty, Batch',
  },
  {
    step: 7,
    action: 'submit',
    backend: 'POST /api/warehouse/receive',
    success: 'LP created, move to next item',
  },
];
```

**Standard Service Pattern:**
```typescript
export class ScannerService {
  // Validate scanned barcode
  async validateScan(barcodeType: string, barcodeValue: string, context?: any): Promise<ValidationResult> {
    // 1. Validate barcode format
    // 2. Query entity by barcode
    // 3. If context provided, validate match (e.g., scanned product matches expected)
    // 4. Return validation result + entity details
  }

  // Submit scanner operation (online)
  async submitScannerOperation(operation: ScannerOperation): Promise<OperationResult> {
    // 1. Validate all required fields
    // 2. BEGIN TRANSACTION
    // 3. Execute business logic (create LP, update qty, etc.)
    // 4. COMMIT
    // 5. Return result + next step guidance
  }

  // Queue operation (offline)
  async queueOperation(operation: ScannerOperation): Promise<void> {
    // 1. Validate operation structure
    // 2. Add to IndexedDB queue
    // 3. Update queue count in UI
  }

  // Sync queued operations (reconnect)
  async syncQueue(): Promise<SyncResult[]> {
    // 1. Get all queued operations from IndexedDB
    // 2. Sort by timestamp (FIFO)
    // 3. For each operation:
    //    - POST /api/scanner/batch
    //    - If success: Remove from queue
    //    - If fail: Mark as failed, keep in queue for retry
    // 4. Return sync results (success count, failed count, errors)
  }

  // Get offline queue status
  async getQueueStatus(): Promise<QueueStatus> {
    // 1. Count queued operations in IndexedDB
    // 2. Check network status
    // 3. Return { count, isOnline, lastSyncAt }
  }
}
```

**Standard UI Components:**
```tsx
// Scanner Workflow Component
<ScannerWorkflow workflow={receivingWorkflow}>
  <WorkflowHeader step={currentStep} totalSteps={7} />

  {currentStep.action === 'scan_location' && (
    <ScanStep
      prompt="Scan receiving location"
      onScan={handleLocationScan}
      expectedType="location"
    />
  )}

  {currentStep.action === 'enter_qty' && (
    <InputStep
      prompt="Enter quantity received"
      type="number"
      onSubmit={handleQtySubmit}
      validation={{ min: 1, max: poLine.ordered_qty }}
    />
  )}

  {currentStep.action === 'confirm' && (
    <ConfirmStep
      summary={operationSummary}
      onConfirm={handleSubmit}
      onCancel={handleCancel}
    />
  )}

  <OfflineIndicator queueCount={queueStatus.count} isOnline={queueStatus.isOnline} />
  <ProgressIndicator current={currentStep} total={totalSteps} />
</ScannerWorkflow>
```

**Standard Offline Queue Schema (IndexedDB):**
```typescript
// IndexedDB Schema
const scannerDBSchema = {
  name: 'ScannerDB',
  version: 1,
  stores: [
    {
      name: 'queue',
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'operation_type', keyPath: 'operation_type' },
        { name: 'status', keyPath: 'status' },
      ],
    },
  ],
};

interface QueuedOperation {
  id: string;  // UUID
  operation_type: string;  // 'receive', 'pick', 'move', etc.
  data: any;  // Operation-specific data
  timestamp: number;  // When queued
  status: 'pending' | 'failed';
  retry_count: number;
  error_message?: string;
}
```

**Standard Validation Responses:**
```typescript
interface ValidationResult {
  valid: boolean;
  entity?: any;  // Entity details if valid
  error?: string;  // Error message if invalid
  warning?: string;  // Warning (e.g., qty exceeds PO)
  metadata?: {
    expected?: string;  // Expected value for mismatch errors
    actual?: string;    // Actual scanned value
  };
}

// Example: Valid scan
{
  valid: true,
  entity: {
    id: 'uuid',
    lp_number: 'LP-2024-000123',
    product: { name: 'Sugar, White' },
    qty: 50,
    uom: 'kg',
  },
}

// Example: Invalid scan (wrong product)
{
  valid: false,
  error: 'Product mismatch',
  metadata: {
    expected: 'Sugar, White (SKU-001)',
    actual: 'Salt, Sea (SKU-002)',
  },
}

// Example: Valid with warning
{
  valid: true,
  warning: 'Quantity exceeds PO ordered qty',
  entity: { ... },
  metadata: {
    ordered_qty: 100,
    received_qty: 120,
  },
}
```

---

## 🗃️ DATABASE TEMPLATES

### TEMPLATE-DB-01: Multi-Tenant RLS Policy

**Use Case:** All org-scoped tables (40+ tables in MonoPilot)

**Standard RLS Pattern:**
```sql
-- Single-table RLS (most common)
CREATE POLICY "{table_name}_org_isolation" ON {table_name}
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- FK-based RLS (for tables without direct org_id)
CREATE POLICY "{table_name}_org_via_fk" ON {table_name}
  USING (
    EXISTS (
      SELECT 1 FROM {parent_table}
      WHERE id = {table_name}.{fk_column}
      AND org_id = current_setting('app.current_org_id')::uuid
    )
  );

-- Dual-FK RLS (for genealogy/junction tables)
CREATE POLICY "{table_name}_dual_fk_rls" ON {table_name}
  USING (
    EXISTS (SELECT 1 FROM {table_a} WHERE id = {fk_a} AND org_id = current_setting('app.current_org_id')::uuid)
    AND EXISTS (SELECT 1 FROM {table_b} WHERE id = {fk_b} AND org_id = current_setting('app.current_org_id')::uuid)
  );

-- Shared tables (no RLS - global data)
-- Example: allergens, countries, uom
-- No RLS policy needed
```

**RLS Test Template:**
```typescript
describe('RLS Policies - {table_name}', () => {
  it('prevents cross-org access', async () => {
    // 1. Create entity in org A
    // 2. Switch session to org B
    // 3. Attempt to read entity from org A
    // 4. Expect: No rows returned (RLS blocks)
  });

  it('allows org users to read own entities', async () => {
    // 1. Create entity in org A
    // 2. Query as org A user
    // 3. Expect: Entity returned
  });

  it('blocks UPDATE across orgs', async () => {
    // 1. Create entity in org A
    // 2. Switch to org B
    // 3. Attempt UPDATE
    // 4. Expect: Zero rows affected
  });

  it('blocks DELETE across orgs', async () => {
    // 1. Create entity in org A
    // 2. Switch to org B
    // 3. Attempt DELETE
    // 4. Expect: Zero rows affected
  });
});
```

---

### TEMPLATE-DB-02: Audit Trail

**Use Case:** Track who/when created/updated/deleted entities

**Standard Audit Fields:**
```sql
-- Add to every table
created_at TIMESTAMPTZ DEFAULT now(),
created_by UUID REFERENCES users(id),
updated_at TIMESTAMPTZ DEFAULT now(),
updated_by UUID REFERENCES users(id),
is_deleted BOOLEAN DEFAULT false,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES users(id)
```

**Auto-Update Trigger:**
```sql
-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Audit Log Table (for critical changes):**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- What changed
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'

  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],

  -- Who/When
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT now(),

  -- Context
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_log_org_table ON audit_log(org_id, table_name);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
```

---

### TEMPLATE-DB-03: Soft Delete

**Use Case:** Preserve data instead of hard delete (required for audit compliance)

**Pattern:**
```sql
-- Table structure
is_deleted BOOLEAN DEFAULT false,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES users(id)

-- Service layer
async delete(id: string): Promise<void> {
  // 1. Check for dependencies (FK constraints)
  // 2. UPDATE entity SET is_deleted=true, deleted_at=now(), deleted_by=current_user
  // 3. Do NOT use SQL DELETE
}

-- Queries (exclude soft-deleted)
SELECT * FROM {table_name}
WHERE org_id = current_setting('app.current_org_id')::uuid
  AND is_deleted = false;

-- Restore function (optional)
async restore(id: string): Promise<Entity> {
  // 1. UPDATE entity SET is_deleted=false, deleted_at=null, deleted_by=null
  // 2. Return restored entity
}
```

---

## 🎨 UI TEMPLATES

### TEMPLATE-UI-01: List Page (Settings)

**Use Case:** Warehouses, Locations, Machines, Products, etc.

**Standard Layout:**
```tsx
<SettingsListPage>
  {/* Header */}
  <PageHeader>
    <h1>{Entity Name}</h1>
    <AddButton onClick={openCreateModal} />
  </PageHeader>

  {/* Filters */}
  <FiltersBar>
    <SearchInput placeholder="Search by name or code" onSearch={handleSearch} />
    <FilterDropdown label="Status" options={['All', 'Active', 'Inactive']} />
  </FiltersBar>

  {/* Data Table */}
  <DataTable
    columns={[
      { key: 'name', label: 'Name', sortable: true },
      { key: 'code', label: 'Code', sortable: true },
      { key: 'is_active', label: 'Status', render: (val) => <StatusBadge active={val} /> },
      { key: 'created_at', label: 'Created', render: (val) => formatDate(val) },
      { key: 'actions', label: 'Actions', render: (row) => <ActionsMenu row={row} /> },
    ]}
    data={entities}
    loading={isLoading}
    emptyMessage="No entities found"
    onRowClick={openDetailModal}
  />

  {/* Pagination */}
  <Pagination
    currentPage={page}
    totalPages={Math.ceil(total / pageSize)}
    onPageChange={setPage}
  />

  {/* Modals */}
  <CreateEditModal
    isOpen={modalOpen}
    mode={modalMode}  // 'create' | 'edit'
    initialData={selectedEntity}
    onSubmit={handleSubmit}
    onClose={closeModal}
  />
</SettingsListPage>
```

**Standard Data Table Props:**
```typescript
interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}
```

---

### TEMPLATE-UI-02: Form Modal (Create/Edit)

**Use Case:** All CRUD forms

**Standard Layout:**
```tsx
<FormModal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Add Entity' : 'Edit Entity'}>
  <Form onSubmit={handleSubmit} schema={entitySchema}>
    {/* Required Fields */}
    <FormField
      name="name"
      label="Name"
      type="text"
      required
      placeholder="Enter entity name"
      error={errors.name}
    />

    {/* Optional Fields */}
    <FormField
      name="code"
      label="Code"
      type="text"
      placeholder="Auto-generated if empty"
      error={errors.code}
    />

    <FormField
      name="description"
      label="Description"
      type="textarea"
      rows={3}
      error={errors.description}
    />

    {/* Dropdowns (FK relationships) */}
    <FormField
      name="warehouse_id"
      label="Warehouse"
      type="select"
      options={warehouses.map(w => ({ value: w.id, label: w.name }))}
      required
      error={errors.warehouse_id}
    />

    {/* Toggle */}
    <FormField
      name="is_active"
      label="Active"
      type="toggle"
      defaultValue={true}
    />

    {/* Actions */}
    <FormActions>
      <CancelButton onClick={onClose} />
      <SubmitButton loading={isSubmitting} disabled={!isValid}>
        {mode === 'create' ? 'Create' : 'Update'}
      </SubmitButton>
    </FormActions>
  </Form>
</FormModal>
```

**Standard Validation (Zod):**
```typescript
import { z } from 'zod';

const entitySchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  code: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  warehouse_id: z.string().uuid('Valid warehouse required'),
  is_active: z.boolean().default(true),
});

type EntityFormData = z.infer<typeof entitySchema>;
```

---

### TEMPLATE-UI-03: Dashboard (KPI Cards + Charts)

**Use Case:** Production Dashboard, Quality Dashboard, Shipping Dashboard, Settings Dashboard

**Standard Layout:**
```tsx
<DashboardPage>
  <PageHeader>
    <h1>{Module} Dashboard</h1>
    <RefreshButton onClick={refetchData} />
  </PageHeader>

  {/* KPI Cards Row */}
  <KPIGrid>
    <KPICard
      title="Open Work Orders"
      value={kpis.openWOs}
      trend={{ value: '+12%', direction: 'up' }}
      icon={<WorkOrderIcon />}
      color="blue"
    />
    <KPICard
      title="Completed Today"
      value={kpis.completedToday}
      subtitle="Target: 50"
      icon={<CheckIcon />}
      color="green"
    />
    <KPICard
      title="Quality Holds"
      value={kpis.qualityHolds}
      trend={{ value: '-3', direction: 'down' }}
      icon={<AlertIcon />}
      color="red"
      onClick={() => navigate('/quality/holds')}
    />
    <KPICard
      title="Avg Cycle Time"
      value={`${kpis.avgCycleTime}h`}
      subtitle="Last 7 days"
      icon={<TimeIcon />}
      color="purple"
    />
  </KPIGrid>

  {/* Charts Row */}
  <ChartsGrid>
    <ChartCard title="Production by Day" span="2">
      <BarChart
        data={chartData.dailyProduction}
        xKey="date"
        yKey="qty"
        color="blue"
      />
    </ChartCard>

    <ChartCard title="Top Products" span="1">
      <PieChart
        data={chartData.topProducts}
        nameKey="product"
        valueKey="qty"
      />
    </ChartCard>
  </ChartsGrid>

  {/* Recent Activity Table */}
  <RecentActivityCard title="Recent Work Orders">
    <DataTable
      columns={[
        { key: 'wo_number', label: 'WO#' },
        { key: 'product', label: 'Product' },
        { key: 'status', label: 'Status' },
        { key: 'started_at', label: 'Started' },
      ]}
      data={recentWOs}
      compact
      limit={5}
    />
  </RecentActivityCard>

  {/* Auto-refresh indicator */}
  <AutoRefresh interval={30000} onRefresh={refetchData} />
</DashboardPage>
```

**Standard KPI Card Props:**
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  onClick?: () => void;
  loading?: boolean;
}
```

---

## 🧪 TESTING TEMPLATES

### TEMPLATE-TEST-01: Service Unit Test

**Use Case:** Test service layer business logic

**Standard Pattern:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityService } from '../entity-service';

describe('EntityService', () => {
  let service: EntityService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => ({ data: null, error: null })),
    };
    service = new EntityService(mockSupabase);
  });

  describe('create', () => {
    it('creates entity with org_id scoping', async () => {
      const input = { name: 'Test Entity', code: 'TEST-001' };
      const expected = { id: 'uuid', org_id: 'org-uuid', ...input };

      mockSupabase.single.mockResolvedValue({ data: expected, error: null });

      const result = await service.create(input);

      expect(mockSupabase.from).toHaveBeenCalledWith('entities');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Entity', org_id: expect.any(String) })
      );
      expect(result).toEqual(expected);
    });

    it('validates uniqueness of code per org', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

      await expect(service.create({ name: 'Test', code: 'DUPLICATE' }))
        .rejects
        .toThrow('Code already exists');
    });

    it('throws error if name is empty', async () => {
      await expect(service.create({ name: '', code: 'TEST' }))
        .rejects
        .toThrow('Name required');
    });
  });

  describe('update', () => {
    it('updates entity and returns updated data', async () => {
      const updates = { name: 'Updated Name' };
      const expected = { id: 'uuid', name: 'Updated Name' };

      mockSupabase.single.mockResolvedValue({ data: expected, error: null });

      const result = await service.update('uuid', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ ...updates, updated_at: expect.any(Date) })
      );
      expect(result).toEqual(expected);
    });

    it('throws error if entity not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      await expect(service.update('nonexistent', { name: 'Test' }))
        .rejects
        .toThrow('Entity not found');
    });
  });

  describe('delete', () => {
    it('soft deletes entity', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: 'uuid' }, error: null });

      await service.delete('uuid');

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: true,
          deleted_at: expect.any(Date),
        })
      );
    });

    it('checks for dependencies before delete', async () => {
      // Mock FK constraint violation
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: '23503', message: 'foreign key violation' },
      });

      await expect(service.delete('uuid'))
        .rejects
        .toThrow('Cannot delete: entity has dependencies');
    });
  });

  describe('list', () => {
    it('returns paginated entities excluding soft-deleted', async () => {
      const entities = [
        { id: '1', name: 'Entity 1', is_deleted: false },
        { id: '2', name: 'Entity 2', is_deleted: false },
      ];

      mockSupabase.select.mockResolvedValue({ data: entities, error: null });

      const result = await service.list({ limit: 10, offset: 0 });

      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(result.data).toEqual(entities);
    });

    it('filters by search term', async () => {
      await service.list({ search: 'test', limit: 10, offset: 0 });

      expect(mockSupabase.ilike).toHaveBeenCalledWith('name', '%test%');
    });
  });
});
```

---

### TEMPLATE-TEST-02: RLS Policy Test

**Use Case:** Validate multi-tenant data isolation

**Standard Pattern:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies - {table_name}', () => {
  let supabaseOrgA: SupabaseClient;
  let supabaseOrgB: SupabaseClient;
  let testEntityId: string;

  beforeAll(async () => {
    // Initialize clients for Org A and Org B
    supabaseOrgA = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY, {
      db: { schema: 'public' },
      global: { headers: { 'x-org-id': 'org-a-uuid' } },
    });

    supabaseOrgB = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY, {
      db: { schema: 'public' },
      global: { headers: { 'x-org-id': 'org-b-uuid' } },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testEntityId) {
      await supabaseOrgA.from('{table_name}').delete().eq('id', testEntityId);
    }
  });

  it('prevents cross-org SELECT', async () => {
    // 1. Create entity in Org A
    const { data: created } = await supabaseOrgA
      .from('{table_name}')
      .insert({ name: 'Test Entity', org_id: 'org-a-uuid' })
      .select()
      .single();

    testEntityId = created.id;

    // 2. Attempt to read from Org B
    const { data, error } = await supabaseOrgB
      .from('{table_name}')
      .select()
      .eq('id', testEntityId)
      .single();

    // 3. Expect: No rows returned (RLS blocks)
    expect(data).toBeNull();
    expect(error).toBeTruthy();  // Or data returns empty []
  });

  it('allows org users to SELECT own entities', async () => {
    // 1. Create entity in Org A
    const { data: created } = await supabaseOrgA
      .from('{table_name}')
      .insert({ name: 'Test Entity', org_id: 'org-a-uuid' })
      .select()
      .single();

    testEntityId = created.id;

    // 2. Query as Org A
    const { data } = await supabaseOrgA
      .from('{table_name}')
      .select()
      .eq('id', testEntityId)
      .single();

    // 3. Expect: Entity returned
    expect(data).toBeTruthy();
    expect(data.id).toBe(testEntityId);
  });

  it('prevents cross-org UPDATE', async () => {
    // 1. Create entity in Org A
    const { data: created } = await supabaseOrgA
      .from('{table_name}')
      .insert({ name: 'Test Entity', org_id: 'org-a-uuid' })
      .select()
      .single();

    testEntityId = created.id;

    // 2. Attempt UPDATE from Org B
    const { data, error } = await supabaseOrgB
      .from('{table_name}')
      .update({ name: 'Hacked Name' })
      .eq('id', testEntityId)
      .select();

    // 3. Expect: Zero rows affected
    expect(data).toEqual([]);  // Or check error
  });

  it('prevents cross-org DELETE', async () => {
    // 1. Create entity in Org A
    const { data: created } = await supabaseOrgA
      .from('{table_name}')
      .insert({ name: 'Test Entity', org_id: 'org-a-uuid' })
      .select()
      .single();

    testEntityId = created.id;

    // 2. Attempt DELETE from Org B
    const { data } = await supabaseOrgB
      .from('{table_name}')
      .delete()
      .eq('id', testEntityId)
      .select();

    // 3. Expect: Zero rows affected
    expect(data).toEqual([]);

    // 4. Verify entity still exists in Org A
    const { data: stillExists } = await supabaseOrgA
      .from('{table_name}')
      .select()
      .eq('id', testEntityId)
      .single();

    expect(stillExists).toBeTruthy();
  });

  it('allows org users to UPDATE own entities', async () => {
    // 1. Create entity in Org A
    const { data: created } = await supabaseOrgA
      .from('{table_name}')
      .insert({ name: 'Test Entity', org_id: 'org-a-uuid' })
      .select()
      .single();

    testEntityId = created.id;

    // 2. Update from Org A
    const { data } = await supabaseOrgA
      .from('{table_name}')
      .update({ name: 'Updated Name' })
      .eq('id', testEntityId)
      .select()
      .single();

    // 3. Expect: Entity updated
    expect(data.name).toBe('Updated Name');
  });
});
```

---

### TEMPLATE-TEST-03: Integration Test (E2E Flow)

**Use Case:** Test complete workflows (PO → ASN → GRN → LP, WO → Consumption → Output)

**Standard Pattern:**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { test } from '@playwright/test';

describe('Integration Test: PO → ASN → GRN → LP Flow', () => {
  let poId: string;
  let asnId: string;
  let grnId: string;
  let lpId: string;

  test('Complete receiving workflow', async ({ page }) => {
    // Step 1: Create Purchase Order
    await page.goto('/planning/purchase-orders');
    await page.click('text=Add PO');
    await page.fill('[name="supplier_id"]', 'supplier-uuid');
    await page.click('text=Add Line');
    await page.fill('[name="product_id"]', 'product-uuid');
    await page.fill('[name="ordered_qty"]', '100');
    await page.click('text=Save');

    // Expect: PO created with status = 'draft'
    await expect(page.locator('text=Status: Draft')).toBeVisible();
    poId = await page.locator('[data-testid="po-id"]').innerText();

    // Step 2: Confirm PO
    await page.click('text=Confirm PO');
    await expect(page.locator('text=Status: Confirmed')).toBeVisible();

    // Step 3: Create ASN
    await page.goto('/warehouse/asn');
    await page.click('text=Create ASN');
    await page.fill('[name="po_id"]', poId);
    await page.fill('[name="expected_date"]', '2024-12-25');
    await page.click('text=Add Line');
    await page.fill('[name="shipped_qty"]', '100');
    await page.click('text=Save');

    asnId = await page.locator('[data-testid="asn-id"]').innerText();

    // Step 4: Create GRN (Receive against ASN)
    await page.goto('/warehouse/receive');
    await page.click('text=Receive from ASN');
    await page.fill('[name="asn_id"]', asnId);
    await page.fill('[name="received_qty"]', '100');
    await page.fill('[name="batch_number"]', 'BATCH-2024-001');
    await page.fill('[name="expiry_date"]', '2025-12-25');
    await page.fill('[name="location_id"]', 'location-uuid');
    await page.click('text=Complete Receipt');

    // Expect: GRN created + LP auto-created
    await expect(page.locator('text=Receipt Complete')).toBeVisible();
    grnId = await page.locator('[data-testid="grn-id"]').innerText();
    lpId = await page.locator('[data-testid="lp-number"]').innerText();

    // Step 5: Verify LP created
    await page.goto(`/warehouse/license-plates/${lpId}`);
    await expect(page.locator('text=BATCH-2024-001')).toBeVisible();
    await expect(page.locator('text=100 kg')).toBeVisible();
    await expect(page.locator('text=Status: Available')).toBeVisible();

    // Step 6: Verify PO updated
    await page.goto(`/planning/purchase-orders/${poId}`);
    await expect(page.locator('text=Received: 100')).toBeVisible();
    await expect(page.locator('text=Status: Completed')).toBeVisible();
  });

  test('Validates over-receipt control', async ({ page }) => {
    // 1. Create PO with ordered_qty = 100
    // 2. Attempt to receive 120 (over-receipt)
    // 3. Expect: Warning shown but allowed (configurable)
    // OR Expect: Blocked with error (if over_receipt_allowed = false)
  });

  test('Prevents duplicate GRN for same ASN line', async ({ page }) => {
    // 1. Create ASN with qty = 100
    // 2. Create GRN #1 with received_qty = 100
    // 3. Attempt to create GRN #2 for same ASN line
    // 4. Expect: Error "ASN line already fully received"
  });

  test('Traces genealogy: PO → ASN → GRN → LP', async ({ page }) => {
    // 1. Navigate to LP detail
    await page.goto(`/warehouse/license-plates/${lpId}`);

    // 2. Click "View Source"
    await page.click('text=View Source');

    // 3. Expect: Genealogy tree shows PO → ASN → GRN → LP
    await expect(page.locator('text=Source PO: PO-2024-0001')).toBeVisible();
    await expect(page.locator('text=ASN: ASN-2024-0001')).toBeVisible();
    await expect(page.locator('text=GRN: GRN-2024-0001')).toBeVisible();
  });
});
```

---

## 📊 API TEMPLATES

### TEMPLATE-API-01: REST Endpoint Pattern

**Use Case:** All CRUD API endpoints

**Standard Pattern:**
```typescript
// apps/frontend/pages/api/settings/{entity_name}/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { EntityService } from '@/lib/services/entity-service';
import { withAuth } from '@/lib/middleware/auth';
import { z } from 'zod';

const entitySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(50).optional(),
  is_active: z.boolean().default(true),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const service = new EntityService(req.supabase);

  switch (req.method) {
    case 'GET':
      return handleList(req, res, service);
    case 'POST':
      return handleCreate(req, res, service);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse, service: EntityService) {
  try {
    const { search, limit = 20, offset = 0 } = req.query;

    const result = await service.list({
      search: search as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('List error:', error);
    return res.status(500).json({ error: 'Failed to fetch entities' });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse, service: EntityService) {
  try {
    // Validate input
    const parsed = entitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const entity = await service.create(parsed.data);
    return res.status(201).json(entity);
  } catch (error) {
    console.error('Create error:', error);

    // Handle specific errors
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'Code already exists' });
    }

    return res.status(500).json({ error: 'Failed to create entity' });
  }
}

export default withAuth(handler);
```

```typescript
// apps/frontend/pages/api/settings/{entity_name}/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { EntityService } from '@/lib/services/entity-service';
import { withAuth } from '@/lib/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const service = new EntityService(req.supabase);
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGetById(req, res, service, id as string);
    case 'PUT':
      return handleUpdate(req, res, service, id as string);
    case 'DELETE':
      return handleDelete(req, res, service, id as string);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetById(req: NextApiRequest, res: NextApiResponse, service: EntityService, id: string) {
  try {
    const entity = await service.getById(id);

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    return res.status(200).json(entity);
  } catch (error) {
    console.error('GetById error:', error);
    return res.status(500).json({ error: 'Failed to fetch entity' });
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse, service: EntityService, id: string) {
  try {
    const entity = await service.update(id, req.body);
    return res.status(200).json(entity);
  } catch (error) {
    console.error('Update error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    return res.status(500).json({ error: 'Failed to update entity' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, service: EntityService, id: string) {
  try {
    await service.delete(id);
    return res.status(204).end();
  } catch (error) {
    console.error('Delete error:', error);

    if (error.message.includes('dependencies')) {
      return res.status(409).json({ error: 'Cannot delete: entity has dependencies' });
    }

    return res.status(500).json({ error: 'Failed to delete entity' });
  }
}

export default withAuth(handler);
```

---

## 🎯 USAGE EXAMPLES

### Example 1: Creating Story Context for "Location Management CRUD"

**Without Template (OLD):**
```markdown
# Story Context: Location Management CRUD

## Architecture
[3,000 tokens describing full CRUD pattern, database schema, RLS policies, API endpoints, service layer, UI components, validation, testing...]
```
**Total: ~3,000 tokens**

**With Template (NEW):**
```markdown
# Story Context: Location Management CRUD

**Base Template:** TEMPLATE-ARCH-01 (Settings Master Data CRUD)

**Table:** locations

**Customizations:**
- Add field: `location_type` (TEXT) - 'storage', 'staging', 'production', 'quarantine'
- Add field: `capacity_units` (INTEGER) - optional max capacity
- Add field: `aisle` (TEXT), `row` (TEXT), `level` (TEXT) - warehouse positioning
- Add FK: `warehouse_id` → warehouses (required)
- Validation: Unique location_code per warehouse
- UI: Warehouse dropdown, location type selector
- Additional endpoint: GET /api/settings/locations/by-warehouse/{warehouse_id}
```
**Total: ~500 tokens (83% savings!)**

---

### Example 2: Creating Story Context for "Purchase Order Creation"

**Without Template (OLD):**
```markdown
# Story Context: Purchase Order Creation

## Architecture
[4,000 tokens describing document header + lines pattern, status lifecycle, approval workflow, transaction handling, API endpoints, service layer, UI, validation, testing...]
```
**Total: ~4,000 tokens**

**With Template (NEW):**
```markdown
# Story Context: Purchase Order Creation

**Base Template:** TEMPLATE-ARCH-02 (Transactional Document)

**Document Type:** Purchase Order (PO)

**Customizations:**
- Header fields:
  - `supplier_id` (FK to suppliers, required)
  - `requested_delivery_date` (DATE)
  - `payment_terms` (TEXT, optional)
- Line fields:
  - `tax_code_id` (FK to tax_codes, optional)
  - `expected_unit_price` (DECIMAL)
- Status flow: draft → pending_approval → approved → sent → receiving → completed
- Approval: Required if total_amount > $10,000 (configurable)
- UI: Supplier selector, bulk line import from CSV, auto-calculate tax
- Additional validation: Block confirm if no lines
- Integration: Send to supplier email on status = 'sent'
```
**Total: ~600 tokens (85% savings!)**

---

### Example 3: Creating Story Context for "License Plate Traceability"

**Without Template (OLD):**
```markdown
# Story Context: License Plate Traceability

## Architecture
[3,500 tokens describing traceability entity pattern, genealogy, movements, forward/backward trace, recursive queries, split/merge, service layer, UI, testing...]
```
**Total: ~3,500 tokens**

**With Template (NEW):**
```markdown
# Story Context: License Plate Traceability

**Base Template:** TEMPLATE-ARCH-03 (Traceability Entity)

**Entity:** License Plate (LP)

**Customizations:**
- Add field: `pallet_id` (FK to pallets, optional) - LP can be on pallet
- Add field: `storage_instructions` (TEXT) - e.g., "Keep frozen"
- Genealogy relationships: 'split', 'merge', 'consumption', 'production', 'adjustment'
- Movement types: 'receive', 'move', 'pick', 'putaway', 'cycle_count'
- UI: Genealogy tree visualization (D3.js), recall simulation button
- Additional queries:
  - Get LPs by expiry range (FEFO picking)
  - Get LPs by location (cycle count)
- Scanner integration: Scan LP → Show details, movements, genealogy
```
**Total: ~550 tokens (84% savings!)**

---

## 📏 TOKEN SAVINGS CALCULATOR

**Formula:**
```
Token Savings = (Original Tokens - Template Tokens) / Original Tokens × 100%

Average Story Context (without templates): 3,000 - 4,000 tokens
Average Story Context (with templates): 500 - 700 tokens

Savings per Story: ~2,500 - 3,300 tokens (70-83%)
```

**Project-Wide Savings (MonoPilot - 246 stories):**
```
Without Templates: 246 stories × 3,500 tokens = 861,000 tokens
With Templates: 246 stories × 600 tokens = 147,600 tokens

Total Savings: 713,400 tokens (83%)
```

**Cost Savings (based on Claude Sonnet pricing):**
```
Input tokens saved: 713,400 tokens
Cost per 1M tokens: $3.00
Savings: ~$2.14 per full project context load

Over 10 sessions: $21.40 saved
Over 100 sessions: $214 saved
```

---

## 🔄 TEMPLATE UPDATE POLICY

**When to Update Templates:**
- New pattern emerges (used in 3+ stories)
- Existing pattern evolves (security fix, performance improvement)
- Team feedback (template unclear or missing critical info)

**Version Control:**
- All templates are versioned (TEMPLATE-ARCH-01 v2.0)
- Breaking changes require new template ID (TEMPLATE-ARCH-01B)
- Update history tracked in this document

**Update Process:**
1. Identify pattern change
2. Update template in library
3. Notify team (Slack/email)
4. Update existing story contexts (optional, if critical)

---

## 📚 TEMPLATE INDEX

### Architecture Templates
- **TEMPLATE-ARCH-01** (Template A): Settings Master Data CRUD
- **TEMPLATE-ARCH-02** (Template B): Transactional Document (Header + Lines)
- **TEMPLATE-ARCH-03** (Template E): Traceability Entity (LP, Batch, Genealogy)
- **TEMPLATE-ARCH-04**: Approval Workflow
- **TEMPLATE-ARCH-05**: Scanner Workflow (Mobile/Barcode)

### Database Templates
- **TEMPLATE-DB-01**: Multi-Tenant RLS Policy
- **TEMPLATE-DB-02** (Template D): Audit Trail + Versioning
- **TEMPLATE-DB-03**: Soft Delete

### UI Templates
- **TEMPLATE-UI-01**: List Page (Settings)
- **TEMPLATE-UI-02**: Form Modal (Create/Edit)
- **TEMPLATE-UI-03** (Template G): Dashboard (KPI Cards + Charts) ✨ NEW

### Testing Templates
- **TEMPLATE-TEST-01** (Template F): Service Unit Test Suite ✨ NEW
- **TEMPLATE-TEST-02**: RLS Policy Test
- **TEMPLATE-TEST-03**: Integration Test (E2E Flow)

### API Templates
- **TEMPLATE-API-01**: REST Endpoint Pattern

### Business Logic Templates
- **TEMPLATE-BL-01** (Template C): Settings Configuration
- **TEMPLATE-BL-02** (Template H): Transaction Workflow (Multi-step) ✨ NEW

---

## 🆕 NEW TEMPLATES (2025-01-23)

### Template F: Test Suite Pattern
**File:** `docs/templates/template-f-test-suite-pattern.md`
**Use Case:** Unit tests for all service layers
**Token Savings:** ~3,500 tokens per story (80% reduction)
**Stories Using:** ~80 stories with service logic

**Contains:**
- Standard CRUD test suite
- RLS policy tests (cross-org access prevention)
- Validation tests (uniqueness, required fields)
- Error handling tests
- Cache invalidation tests
- Rollback/cleanup utilities

**Example Usage:**
```typescript
// Reference Template F, customize only entity-specific tests
describe('ProductService', () => {
  // ... standard CRUD tests from Template F

  // Add custom tests
  it('should validate product type is valid', async () => {
    // Custom validation test
  })
})
```

---

### Template G: Dashboard Pattern
**File:** `docs/templates/template-g-dashboard-pattern.md`
**Use Case:** Module dashboards (Technical, Planning, Production, etc.)
**Token Savings:** ~6,000 tokens per dashboard (75% reduction)
**Stories Using:** ~12 dashboard stories

**Contains:**
- KPI cards grid layout (4-6 metrics)
- Chart components (bar, line, pie)
- Recent activity table
- Auto-refresh (30s interval)
- Responsive design
- Loading skeletons

**Example Usage:**
```typescript
// Reference Template G, customize only KPIs and chart data
export async function getTechnicalDashboard(orgId: string) {
  // Use Template G structure
  // Customize:
  // - KPI 1: Total Products
  // - KPI 2: Active BOMs
  // - Chart 1: Products by Type
  // - Chart 2: BOMs Created Over Time
}
```

---

### Template H: Transaction Workflow
**File:** `docs/templates/template-h-transaction-workflow.md`
**Use Case:** Multi-step business transactions (PO→GRN→LP, WO execution, etc.)
**Token Savings:** ~7,500 tokens per workflow (75% reduction)
**Stories Using:** ~15 transaction stories

**Contains:**
- Transaction executor core
- Sequential step execution
- Automatic rollback on failure
- Step validation
- Context passing between steps
- Error aggregation

**Example Usage:**
```typescript
// Reference Template H, define workflow steps
const steps: TransactionStep[] = [
  { name: 'validate_po', execute: async (ctx) => { /* ... */ } },
  { name: 'create_grn', execute: async (ctx) => { /* ... */ }, rollback: async (ctx) => { /* ... */ } },
  { name: 'create_lp', execute: async (ctx) => { /* ... */ }, rollback: async (ctx) => { /* ... */ } },
]

return await executeTransaction({ steps, context: { orgId, userId, data } })
```

---

## ✅ CHECKLIST: When to Use Templates

Before creating a new story context, ask:

- [ ] Is this a CRUD operation? → Use **TEMPLATE-ARCH-01**
- [ ] Is this a document with lines (PO, WO, SO)? → Use **TEMPLATE-ARCH-02**
- [ ] Does it involve traceability (LP, Batch)? → Use **TEMPLATE-ARCH-03**
- [ ] Does it require approval workflow? → Use **TEMPLATE-ARCH-04**
- [ ] Is this a scanner/mobile workflow? → Use **TEMPLATE-ARCH-05**
- [ ] Does it need RLS policies? → Use **TEMPLATE-DB-01**
- [ ] Does it need audit trail? → Use **TEMPLATE-DB-02**
- [ ] Is it a list page? → Use **TEMPLATE-UI-01**
- [ ] Is it a form modal? → Use **TEMPLATE-UI-02**
- [ ] Is it a dashboard? → Use **TEMPLATE-UI-03**

**If YES to any:** Reference the template and document ONLY customizations!

---

**End of Shared Templates Library**

*This library will reduce MonoPilot story context token usage by 70-83%, enabling faster AI responses and lower costs.*
