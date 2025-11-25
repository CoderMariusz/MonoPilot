# Story 2.18: Forward Traceability

**Epic:** 2 - Technical Core
**Batch:** 2D - Traceability & Dashboard
**Status:** Draft
**Priority:** P1 (High)
**Story Points:** 8
**Created:** 2025-01-23

---

## Goal

Implement forward traceability functionality that allows QC Managers to trace a License Plate (LP) or batch forward through the production chain to see where it was used and what products were created from it.

## User Story

**As a** QC Manager
**I want** to trace a material forward through production
**So that** I can see where it was used and identify all products that contain it

---

## Problem Statement

When quality issues are discovered with raw materials or intermediate products, QC teams need to quickly identify:
- All downstream products that used the affected material
- Where those products are located
- Which work orders consumed the material
- The complete genealogy tree of splits and transformations

Without forward traceability, recalls and quality investigations are slow, manual, and error-prone.

---

## Acceptance Criteria

### AC-2.18.1: Forward Trace Search Interface

**Given** the user has QC Manager or Technical role
**When** they navigate to `/technical/tracing`
**Then** they see a tracing interface with:
- Page title: "Product Traceability"
- Tab navigation: "Forward Trace", "Backward Trace", "Recall Simulation"
- Search form with fields:
  - LP ID (text input with autocomplete)
  - OR Batch Number (text input)
  - Max Depth (number input, default: 20, max: 50)
- "Trace Forward" button (primary action)
- Results section (initially empty)

**And** the interface includes:
- Help text explaining forward traceability
- Example LP IDs for testing
- Loading state during trace execution

**Success Criteria:**
- Form validates that either LP ID or Batch Number is provided
- Autocomplete suggests LP IDs as user types
- Max depth is validated (1-50)
- Clean, intuitive interface matching design system

---

### AC-2.18.2: Execute Forward Trace Query

**Given** I have entered a valid LP ID or Batch Number
**When** I click "Trace Forward"
**Then** the system executes a forward trace query
**And** displays a tree structure showing:
- **Root Node**: The starting LP with full details
- **Child Nodes**: All LPs created from the root via:
  - Splits (1 → many)
  - Combines (many → 1, showing as child)
  - Transforms (production output)
- **Work Orders**: All WOs that consumed the LP
- **Products**: All output products from those WOs

**And** for each node, display:
- LP Number (clickable)
- Product Code and Name
- Quantity and UOM
- Batch Number
- Status (available, consumed, shipped, quarantine)
- Location
- Expiry Date (if applicable)

**API Endpoint:**
```
POST /api/technical/tracing/forward
Body: {
  lp_id?: string,
  batch_number?: string,
  max_depth?: number
}
Response: {
  root_lp: LP,
  trace_tree: TraceNode[],
  summary: {
    total_descendants: number,
    total_work_orders: number,
    total_products: number,
    max_depth: number
  }
}
```

**Success Criteria:**
- Query completes in < 60 seconds for 1000+ LPs
- Recursive CTE correctly traverses lp_genealogy table
- No cycles in graph (prevented by path tracking)
- Accurate depth calculation

---

### AC-2.18.3: Tree Structure with Expand/Collapse

**Given** forward trace results are displayed
**Then** the tree is initially collapsed to depth 2
**And** nodes at depth 2+ show expand/collapse icons

**When** I click the expand icon on a node
**Then** its children are revealed
**And** the icon changes to a collapse icon

**When** I click the collapse icon on a node
**Then** its children are hidden
**And** the icon changes back to expand icon

**And** tree includes visual indicators:
- Indentation showing depth level
- Lines connecting parent → child nodes
- Relationship type badges (split, combine, transform)
- Count badges showing number of children

**Success Criteria:**
- Smooth expand/collapse animations
- State persists during session
- Keyboard navigation supported (arrow keys)
- Accessible (ARIA attributes)

---

### AC-2.18.4: Node Click for Details

**Given** forward trace results are displayed
**When** I click on any LP node in the tree
**Then** a side drawer opens showing complete LP details:
- **Header**: LP Number, Product Code/Name
- **Status Section**: Current status with badge
- **Quantity Section**: Available/Consumed/Shipped quantities
- **Location Section**: Current location with warehouse/zone
- **Batch Section**: Batch number, manufacturing date, expiry date
- **Genealogy Section**:
  - Parent LP(s) if applicable
  - Child LP(s) if applicable
  - Relationship types
- **Transaction History**: List of WO/TO references
- **Actions**: View Full Details (link to LP detail page)

**And** the drawer has:
- Close button (X icon)
- Responsive layout (mobile, tablet, desktop)
- Quick actions (View WO, View Location)

**Success Criteria:**
- Drawer loads data from GET /api/warehouse/license-plates/:id
- Lazy loaded (fetches on click)
- Error handling if LP not found
- Smooth open/close animation

---

### AC-2.18.5: Trace Summary Statistics

**Given** forward trace results are displayed
**Then** above the tree, show a summary card with:
- **Total Descendants**: Count of all child LPs found
- **Total Work Orders**: Count of WOs that consumed traced material
- **Total Products**: Count of unique products created
- **Max Depth Reached**: Deepest level in the tree
- **Execution Time**: How long the trace took

**And** summary is color-coded:
- Green: Normal trace (< 100 LPs)
- Yellow: Large trace (100-500 LPs)
- Orange: Very large trace (500+ LPs)

**Success Criteria:**
- Summary calculated accurately from trace results
- Execution time measured on backend
- Visual indicators help users understand scope

---

### AC-2.18.6: Export Forward Trace Results

**Given** forward trace results are displayed
**When** I click "Export Results" button
**Then** a dropdown menu shows export options:
- Export as PDF
- Export as Excel
- Export as JSON

**When** I select an export format
**Then** file download begins immediately
**And** exported file contains:
- Summary statistics
- Complete tree structure (all nodes)
- For each LP: all visible details
- Timestamp and generated-by user

**API Endpoint:**
```
GET /api/technical/tracing/forward/:trace_id/export
Query: ?format=pdf|excel|json
Response: File download
```

**Success Criteria:**
- PDF includes formatted tree with visual hierarchy
- Excel has flattened structure (one row per LP)
- JSON is machine-readable (for integrations)
- Filename includes timestamp: forward-trace-{lp_number}-{date}.pdf

---

### AC-2.18.7: Performance with Large Datasets

**Given** a forward trace query that returns 1000+ LPs
**When** the trace executes
**Then** it completes within 60 seconds

**And** the UI handles large results gracefully:
- Virtual scrolling for > 500 nodes
- Lazy loading of deep nodes (depth > 5)
- Paginated export for > 1000 nodes

**And** backend optimizations include:
- Indexed queries on lp_genealogy(parent_lp_id, child_lp_id)
- Max depth limit enforced (default: 20, max: 50)
- Query timeout after 60 seconds
- Result caching (15 min TTL)

**Success Criteria:**
- Performance target met: < 60 seconds for 1000 LPs
- UI remains responsive during large traces
- No memory leaks or browser freezes
- Clear progress indicator during execution

---

### AC-2.18.8: Error Handling

**Given** I submit a forward trace request
**When** the LP ID or Batch Number does not exist
**Then** an error message displays: "LP or Batch not found. Please check the ID and try again."

**When** the trace query times out (> 60 seconds)
**Then** an error message displays: "Trace operation timed out. Try reducing the max depth or contact support."

**When** the database connection fails
**Then** an error message displays: "Unable to connect to database. Please try again later."

**When** I don't have permission to view traceability data
**Then** an error message displays: "Access denied. QC Manager or Technical role required."

**Success Criteria:**
- User-friendly error messages (no technical jargon)
- Errors logged to backend for debugging
- Retry option provided where applicable
- Contact support link included

---

### AC-2.18.9: Role-Based Access Control

**Given** a user with Viewer role
**When** they navigate to `/technical/tracing`
**Then** they see an access denied message

**Given** a user with QC Manager or Technical role
**When** they navigate to `/technical/tracing`
**Then** they can view and execute forward traces

**Given** a user with Admin role
**When** they navigate to `/technical/tracing`
**Then** they have full access including export

**Success Criteria:**
- RLS policies enforce org_id filtering
- API returns 403 for unauthorized users
- Frontend hides tracing nav link for Viewer role
- Clear permission error messages

---

### AC-2.18.10: Breadcrumbs and Navigation

**Given** I am viewing forward trace results
**Then** breadcrumbs display: Technical > Tracing > Forward Trace

**When** I click "Technical" in breadcrumbs
**Then** I navigate to `/technical`

**When** I click "Tracing" in breadcrumbs
**Then** I navigate to `/technical/tracing` (clears results)

**And** page includes:
- Back button (browser history)
- Tab navigation to switch to Backward Trace or Recall Simulation
- Persistent search form at top

**Success Criteria:**
- Breadcrumbs match current page context
- Navigation doesn't lose unsaved trace results (confirmation prompt)
- Tab switching is smooth (no page reload)

---

## Technical Requirements

### Database Schema

**Table: lp_genealogy**
```sql
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  child_lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL, -- split, combine, transform
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE SET NULL,
  quantity_from_parent DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT lp_genealogy_type_check CHECK (relationship_type IN ('split', 'combine', 'transform')),
  CONSTRAINT lp_genealogy_no_self_reference CHECK (parent_lp_id != child_lp_id),
  CONSTRAINT lp_genealogy_quantity_positive CHECK (quantity_from_parent > 0)
);

CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(work_order_id) WHERE work_order_id IS NOT NULL;
```

### API Endpoints

1. **POST /api/technical/tracing/forward**
   - Body: ForwardTraceInput
   - Returns: { root_lp, trace_tree, summary }
   - Auth: QC Manager, Technical, Admin

2. **GET /api/technical/tracing/forward/:trace_id/export**
   - Query: format (pdf, excel, json)
   - Returns: File download
   - Auth: QC Manager, Technical, Admin

### RLS Policies

- **SELECT lp_genealogy:** org_id = auth.jwt()->>'org_id' (via license_plates join)
- **INSERT lp_genealogy:** org_id = auth.jwt()->>'org_id' AND role IN ('technical', 'admin')
- **UPDATE lp_genealogy:** Not applicable (immutable)
- **DELETE lp_genealogy:** Not applicable (cascade only)

---

## Implementation Status

### ⏳ Pending
- [ ] Database migration (lp_genealogy table)
- [ ] Forward trace recursive CTE query
- [ ] Service layer (genealogy-service.ts)
- [ ] API routes (POST /api/technical/tracing/forward)
- [ ] Validation schemas (trace-schemas.ts)
- [ ] Forward trace page UI
- [ ] Tree rendering component
- [ ] Node click drawer
- [ ] Export functionality
- [ ] Performance optimization
- [ ] Tests (unit, integration, E2E)

---

## Testing Checklist

### Unit Tests
- [ ] Forward trace recursive query (1, 3, 10 levels)
- [ ] Cycle detection in genealogy graph
- [ ] Summary calculation (descendants, WOs, products)
- [ ] Max depth enforcement

### Integration Tests
- [ ] Forward trace API with valid LP ID
- [ ] Forward trace API with valid Batch Number
- [ ] Forward trace API with invalid ID (404 error)
- [ ] Forward trace with > 1000 LPs (performance)
- [ ] RLS policy enforcement (org isolation)
- [ ] Export generation (PDF, Excel, JSON)

### E2E Tests
- [ ] Search by LP ID → view trace tree
- [ ] Expand/collapse nodes in tree
- [ ] Click node → view LP details in drawer
- [ ] Export results as PDF
- [ ] Error handling for non-existent LP
- [ ] Role-based access (Viewer denied, QC Manager allowed)

### Performance Tests
- [ ] Trace with 100 LPs (target: < 5 seconds)
- [ ] Trace with 500 LPs (target: < 20 seconds)
- [ ] Trace with 1000+ LPs (target: < 60 seconds)
- [ ] Virtual scrolling with 500+ nodes
- [ ] Memory usage during large trace

---

## Dependencies

### Requires
- ✅ Epic 1: Organizations, Users, Roles
- 🔄 Epic 5: License Plates (lp_genealogy references license_plates)
- 🔄 Epic 3: Work Orders (work_order_id FK)
- 🔄 Epic 5: Transfer Orders (transfer_order_id FK)

### Enables
- ✅ Story 2.19: Backward Traceability (same genealogy table)
- ✅ Story 2.20: Recall Simulation (uses forward trace)
- ✅ Story 2.21: Genealogy Tree View (visualization)

---

## Notes

- Forward traceability is critical for FDA compliance (FSMA)
- Genealogy records are immutable once created
- Cycle detection prevents infinite loops in malformed data
- Performance is key: large food manufacturers may have 10,000+ LPs
- Export formats must be regulatory-compliant

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2d-traceability.md`
- PRD: `docs/epics/epic-2-technical.md` (Story 2.18)
- Migration: `apps/frontend/lib/supabase/migrations/024_create_lp_genealogy_table.sql`
- Service: `apps/frontend/lib/services/genealogy-service.ts`
