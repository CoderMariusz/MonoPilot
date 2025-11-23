# Story 2.19: Backward Traceability

**Epic:** 2 - Technical Core
**Batch:** 2D - Traceability & Dashboard
**Status:** Draft
**Priority:** P1 (High)
**Story Points:** 8
**Created:** 2025-01-23

---

## Goal

Implement backward traceability functionality that allows QC Managers to trace a product or License Plate (LP) backward through the production chain to see all source materials and genealogy.

## User Story

**As a** QC Manager
**I want** to trace a product backward to its source materials
**So that** I can identify all ingredients and suppliers that went into it

---

## Problem Statement

When investigating product quality issues or verifying supplier compliance, QC teams need to quickly identify:
- All raw materials used in a finished product
- All parent LPs that were consumed during production
- Supplier information and batch numbers for source materials
- Complete production history and genealogy

Without backward traceability, root cause analysis and supplier verification are time-consuming and incomplete.

---

## Acceptance Criteria

### AC-2.19.1: Backward Trace Search Interface

**Given** the user has QC Manager or Technical role
**When** they navigate to `/technical/tracing` and select the "Backward Trace" tab
**Then** they see a tracing interface with:
- Search form with fields:
  - LP ID (text input with autocomplete)
  - OR Batch Number (text input)
  - Max Depth (number input, default: 20, max: 50)
- "Trace Backward" button (primary action)
- Results section (initially empty)

**And** the interface includes:
- Help text explaining backward traceability
- Example: "Find all source materials that went into this product"
- Loading state during trace execution

**Success Criteria:**
- Form validates that either LP ID or Batch Number is provided
- Autocomplete suggests LP IDs as user types
- Max depth is validated (1-50)
- Consistent UX with Forward Trace tab

---

### AC-2.19.2: Execute Backward Trace Query

**Given** I have entered a valid LP ID or Batch Number
**When** I click "Trace Backward"
**Then** the system executes a backward trace query
**And** displays a tree structure showing:
- **Root Node**: The starting LP (finished product)
- **Parent Nodes**: All LPs that contributed to the root via:
  - Combines (many → 1)
  - Transforms (WO inputs)
  - Splits (original LP before split)
- **Source Materials**: LPs at the top of the tree (no parents)
- **Supplier Info**: For source material LPs, display supplier and batch

**And** for each node, display:
- LP Number (clickable)
- Product Code and Name
- Quantity and UOM
- Batch Number
- Supplier (for source materials)
- Received Date
- Depth level (how far back)

**API Endpoint:**
```
POST /api/technical/tracing/backward
Body: {
  lp_id?: string,
  batch_number?: string,
  max_depth?: number
}
Response: {
  root_lp: LP,
  trace_tree: TraceNode[],
  summary: {
    total_ancestors: number,
    total_source_materials: number,
    max_depth: number,
    suppliers: Supplier[]
  }
}
```

**Success Criteria:**
- Query completes in < 60 seconds for 1000+ LPs
- Recursive CTE correctly traverses lp_genealogy table in reverse
- Accurately identifies source materials (LPs with no parents)
- Supplier information retrieved from LP metadata

---

### AC-2.19.3: Tree Structure with Expand/Collapse

**Given** backward trace results are displayed
**Then** the tree is initially collapsed to depth 2
**And** nodes at depth 2+ show expand/collapse icons

**When** I click the expand icon on a node
**Then** its parent nodes are revealed (going further back)
**And** the icon changes to a collapse icon

**When** I click the collapse icon on a node
**Then** its parent nodes are hidden
**And** the icon changes back to expand icon

**And** tree includes visual indicators:
- Inverted tree layout (root at bottom, sources at top)
- Lines connecting child → parent nodes
- Relationship type badges (consumed_by, combined_into, split_from)
- Depth badges showing how many levels back

**Success Criteria:**
- Tree layout is inverted (sources at top, product at bottom)
- Smooth expand/collapse animations
- Clear visual distinction from forward trace
- Keyboard navigation supported

---

### AC-2.19.4: Source Material Highlighting

**Given** backward trace results are displayed
**Then** source material LPs (no parents) are visually highlighted with:
- Special badge: "Source Material"
- Border color: blue
- Icon: package or supplier icon

**And** for source materials, additional info is shown:
- Supplier name and code
- Purchase Order reference
- Received date
- COA (Certificate of Analysis) status if available

**When** I click a source material node
**Then** the detail drawer shows:
- Complete supplier information
- Purchase order details
- Receiving inspection data
- COA documents (if attached)
- "View Supplier" quick action

**Success Criteria:**
- Source materials easy to identify at a glance
- Supplier info accurately retrieved from purchase orders
- Quick navigation to supplier details
- COA status clearly indicated (available, pending, missing)

---

### AC-2.19.5: Supplier Summary Section

**Given** backward trace results are displayed
**Then** a "Supplier Summary" card is shown above the tree with:
- **Total Unique Suppliers**: Count of distinct suppliers in trace
- **Supplier List**: Table with columns:
  - Supplier Name
  - Supplier Code
  - Materials Provided (count)
  - Total Quantity
  - "View Details" action
- **Filter by Supplier**: Dropdown to highlight specific supplier's materials in tree

**When** I select a supplier from the dropdown
**Then** only that supplier's materials are highlighted in the tree
**And** other nodes are dimmed (grayed out)

**When** I click "View Details" for a supplier
**Then** navigate to supplier detail page

**Success Criteria:**
- Supplier summary accurately aggregates from trace results
- Filter provides quick visual focus on one supplier
- Easy navigation to supplier details
- Clear indication of supplier contribution

---

### AC-2.19.6: Work Order Context

**Given** backward trace results are displayed
**And** a traced LP was produced by a Work Order
**Then** the WO is shown as a context node between parent and child LPs

**And** WO nodes display:
- WO Number (clickable)
- Product being produced
- WO status (completed, in_progress, closed)
- Production date
- Operation (if routing used)

**When** I click a WO node
**Then** a detail drawer opens showing:
- WO header info
- All input materials (consumed LPs)
- All output products (produced LPs)
- Yield percentage
- "View Full WO" quick action

**Success Criteria:**
- WO context provides production process visibility
- Clear visual distinction between LP nodes and WO nodes
- Easy navigation to full WO details
- Yield data helps identify production efficiency

---

### AC-2.19.7: Trace Summary Statistics

**Given** backward trace results are displayed
**Then** above the tree, show a summary card with:
- **Total Ancestors**: Count of all parent LPs found
- **Total Source Materials**: Count of LPs with no parents (raw materials)
- **Unique Suppliers**: Count of distinct suppliers
- **Max Depth Reached**: How far back the trace went
- **Execution Time**: How long the trace took

**And** summary is color-coded:
- Green: Simple trace (< 50 LPs)
- Yellow: Moderate trace (50-200 LPs)
- Orange: Complex trace (200+ LPs)

**Success Criteria:**
- Summary calculated accurately from trace results
- Helps users understand product complexity
- Visual indicators for trace scope

---

### AC-2.19.8: Export Backward Trace Results

**Given** backward trace results are displayed
**When** I click "Export Results" button
**Then** a dropdown menu shows export options:
- Export as PDF
- Export as Excel
- Export as JSON
- Export Supplier List (Excel)

**When** I select an export format
**Then** file download begins immediately
**And** exported file contains:
- Summary statistics
- Complete tree structure (all nodes)
- Supplier summary table
- For each LP: all visible details including supplier info
- Timestamp and generated-by user

**API Endpoint:**
```
GET /api/technical/tracing/backward/:trace_id/export
Query: ?format=pdf|excel|json|supplier_list
Response: File download
```

**Success Criteria:**
- PDF includes formatted tree with inverted layout
- Excel has flattened structure (one row per LP with parent references)
- Supplier List export is a separate table optimized for supplier analysis
- JSON is machine-readable (for integrations)
- Filename includes timestamp: backward-trace-{lp_number}-{date}.pdf

---

### AC-2.19.9: Performance with Large Datasets

**Given** a backward trace query that returns 1000+ LPs
**When** the trace executes
**Then** it completes within 60 seconds

**And** the UI handles large results gracefully:
- Virtual scrolling for > 500 nodes
- Lazy loading of deep ancestors (depth > 5)
- Paginated export for > 1000 nodes

**And** backend optimizations include:
- Indexed queries on lp_genealogy(child_lp_id, parent_lp_id)
- Max depth limit enforced (default: 20, max: 50)
- Query timeout after 60 seconds
- Result caching (15 min TTL)

**Success Criteria:**
- Performance target met: < 60 seconds for 1000 LPs
- UI remains responsive during large traces
- No memory leaks or browser freezes
- Clear progress indicator during execution

---

### AC-2.19.10: Integration with Supplier Compliance

**Given** backward trace results include source materials
**When** viewing the trace
**Then** each source material node shows a compliance indicator:
- Green checkmark: Supplier has valid certifications
- Yellow warning: Certifications expiring soon (< 30 days)
- Red alert: Missing or expired certifications

**And** when hovering over the compliance indicator
**Then** a tooltip shows:
- Certification type (e.g., Organic, Kosher, Halal)
- Expiration date
- Last audit date

**When** I click the compliance indicator
**Then** navigate to supplier certification page

**Success Criteria:**
- Compliance data fetched from supplier records
- Real-time expiration checking
- Quick visibility into supplier compliance status
- Integration with Epic 6 (Suppliers & Compliance)

---

## Technical Requirements

### Database Schema

**Table: lp_genealogy** (same as Story 2.18)
```sql
-- Same schema as forward traceability
-- Backward trace uses reverse traversal (child_lp_id → parent_lp_id)
```

**Table: traceability_links**
```sql
CREATE TABLE traceability_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  link_type VARCHAR(20) NOT NULL, -- consumption, production
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT traceability_links_type_check CHECK (link_type IN ('consumption', 'production')),
  CONSTRAINT traceability_links_quantity_positive CHECK (quantity > 0),
  CONSTRAINT traceability_links_wo_or_to CHECK (
    (work_order_id IS NOT NULL AND transfer_order_id IS NULL) OR
    (work_order_id IS NULL AND transfer_order_id IS NOT NULL)
  )
);

CREATE INDEX idx_traceability_links_lp ON traceability_links(lp_id);
CREATE INDEX idx_traceability_links_wo ON traceability_links(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_traceability_links_date ON traceability_links(transaction_date);
```

### API Endpoints

1. **POST /api/technical/tracing/backward**
   - Body: BackwardTraceInput
   - Returns: { root_lp, trace_tree, summary }
   - Auth: QC Manager, Technical, Admin

2. **GET /api/technical/tracing/backward/:trace_id/export**
   - Query: format (pdf, excel, json, supplier_list)
   - Returns: File download
   - Auth: QC Manager, Technical, Admin

### RLS Policies

- **SELECT lp_genealogy:** org_id = auth.jwt()->>'org_id' (via license_plates join)
- **SELECT traceability_links:** org_id = auth.jwt()->>'org_id' (via license_plates join)
- **INSERT:** org_id = auth.jwt()->>'org_id' AND role IN ('technical', 'admin')
- **UPDATE/DELETE:** Not applicable (immutable records)

---

## Implementation Status

### ⏳ Pending
- [ ] Backward trace recursive CTE query
- [ ] Service layer (genealogy-service.ts - backward method)
- [ ] API routes (POST /api/technical/tracing/backward)
- [ ] Backward trace page UI
- [ ] Inverted tree rendering component
- [ ] Source material highlighting
- [ ] Supplier summary section
- [ ] WO context nodes
- [ ] Export functionality (incl. supplier list)
- [ ] Supplier compliance integration
- [ ] Performance optimization
- [ ] Tests (unit, integration, E2E)

---

## Testing Checklist

### Unit Tests
- [ ] Backward trace recursive query (1, 3, 10 levels)
- [ ] Source material identification (LPs with no parents)
- [ ] Supplier aggregation logic
- [ ] Summary calculation (ancestors, source materials, suppliers)
- [ ] Max depth enforcement

### Integration Tests
- [ ] Backward trace API with valid LP ID
- [ ] Backward trace API with valid Batch Number
- [ ] Backward trace API with invalid ID (404 error)
- [ ] Backward trace with > 1000 LPs (performance)
- [ ] RLS policy enforcement (org isolation)
- [ ] Supplier data retrieval from purchase orders
- [ ] Export generation (PDF, Excel, JSON, Supplier List)

### E2E Tests
- [ ] Search by LP ID → view backward trace tree
- [ ] Expand/collapse parent nodes in tree
- [ ] Click source material node → view supplier details in drawer
- [ ] Filter by supplier → highlight only that supplier's materials
- [ ] Click WO context node → view WO details
- [ ] Export results as Supplier List (Excel)
- [ ] Compliance indicator shows correct status
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
- 🔄 Epic 3: Work Orders (work_order_id FK, WO context nodes)
- 🔄 Epic 5: Transfer Orders (transfer_order_id FK)
- 🔄 Epic 6: Suppliers (supplier info for source materials)

### Enables
- ✅ Story 2.20: Recall Simulation (uses backward trace)
- ✅ Story 2.21: Genealogy Tree View (visualization)
- 🔄 Epic 6: Supplier Compliance Tracking (compliance indicators)

---

## Notes

- Backward traceability is critical for supplier verification and root cause analysis
- Source material identification is key differentiator from forward trace
- Supplier compliance integration provides proactive quality management
- Inverted tree layout (sources at top) matches industry conventions
- Genealogy and traceability records are immutable for audit trail integrity

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2d-traceability.md`
- PRD: `docs/epics/epic-2-technical.md` (Story 2.19)
- Migration: `apps/frontend/lib/supabase/migrations/024_create_lp_genealogy_table.sql`
- Migration: `apps/frontend/lib/supabase/migrations/025_create_traceability_links_table.sql`
- Service: `apps/frontend/lib/services/genealogy-service.ts`
