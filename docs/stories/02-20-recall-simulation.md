# Story 2.20: Recall Simulation

**Epic:** 2 - Technical Core
**Batch:** 2D - Traceability & Dashboard
**Status:** Draft
**Priority:** P0 (Critical)
**Story Points:** 13
**Created:** 2025-01-23

---

## Goal

Implement recall simulation functionality that combines forward and backward traceability to quickly identify all affected inventory, calculate business impact, and generate regulatory-compliant reports for FDA/EU compliance.

## User Story

**As a** QC Manager
**I want** to simulate a product recall
**So that** I can quickly assess the scope, cost, and regulatory requirements if we need to recall a batch

---

## Problem Statement

When quality issues are discovered, companies must rapidly determine:
- Total scope of affected inventory (upstream and downstream)
- Financial impact of a potential recall
- Locations of all affected products
- Customer shipments that need to be retrieved
- Regulatory reporting requirements (FDA FSMA, EU regulations)

Without recall simulation capabilities, companies:
- Underestimate recall scope, leading to incomplete recalls
- Face regulatory penalties for delayed or incomplete reporting
- Incur higher costs due to poor planning
- Risk brand damage from ineffective recalls

---

## Acceptance Criteria

### AC-2.20.1: Recall Simulation Interface

**Given** the user has QC Manager, Technical, or Admin role
**When** they navigate to `/technical/tracing` and select the "Recall Simulation" tab
**Then** they see a simulation interface with:
- Page title: "Recall Simulation"
- Prominent warning banner: "This is a simulation. No inventory will be affected."
- Search form with fields:
  - LP ID (text input with autocomplete)
  - OR Batch Number (text input)
  - Include Shipped Products (checkbox, default: true)
  - Include Customer Notifications (checkbox, default: true)
- "Run Simulation" button (large, primary action with warning color)
- Results section (initially empty)

**And** the interface includes:
- Help text explaining recall simulation
- Estimated execution time indicator
- Recent simulations history (last 5)

**Success Criteria:**
- Form validates that either LP ID or Batch Number is provided
- Warning banner clearly indicates simulation mode
- Checkboxes control scope of simulation
- Clean, serious UI matching the gravity of recalls

---

### AC-2.20.2: Execute Recall Simulation

**Given** I have entered a valid LP ID or Batch Number
**When** I click "Run Simulation"
**Then** the system executes both forward and backward traces simultaneously
**And** displays a comprehensive recall summary with:

**Section 1: Affected Inventory**
- Total Affected LPs: Count and list
- Total Quantity: Sum across all affected LPs
- Total Estimated Value: Sum of (quantity × unit_cost)
- Status Breakdown:
  - Available in warehouse
  - In production (WIP)
  - Shipped to customers
  - Already consumed/disposed

**Section 2: Location Analysis**
- Affected Warehouses: Count and list
- Affected Zones: Detailed breakdown by warehouse
- Location Map: Visual map showing affected sites
- Retrieval Complexity: Rating (Low, Medium, High)

**Section 3: Customer Impact** (if include_shipped = true)
- Customers Affected: Count of unique customers
- Customer List: Table with customer name, shipped qty, ship date
- Total Shipped Quantity: Sum
- Notification Status: Draft, Ready to Send
- Estimated Retrieval Cost: Shipping + handling

**Section 4: Financial Impact**
- Product Value: Sum of affected inventory value
- Retrieval Cost: Estimated cost to retrieve shipped goods
- Disposal Cost: Estimated disposal/destruction cost
- Lost Revenue: Estimated sales impact
- **Total Estimated Cost**: Grand total

**Section 5: Regulatory Compliance**
- Reportable to FDA: Yes/No (based on product type)
- Report Due Date: Calculated based on discovery date
- Report Status: Draft, Not Yet Filed
- Export Options: FDA JSON, FDA XML, EU XML

**API Endpoint:**
```
POST /api/technical/tracing/recall
Body: {
  lp_id?: string,
  batch_number?: string,
  include_shipped?: boolean,
  include_notifications?: boolean
}
Response: {
  simulation_id: string,
  forward_trace: TraceNode[],
  backward_trace: TraceNode[],
  summary: RecallSummary,
  regulatory: RegulatoryInfo,
  execution_time_ms: number
}
```

**Success Criteria:**
- Simulation completes in < 30 seconds
- All calculations are accurate
- Financial estimates use real cost data
- Regulatory requirements auto-determined by product type

---

### AC-2.20.3: Trace Tree Visualization in Simulation

**Given** recall simulation results are displayed
**Then** show a combined trace tree with:
- **Center**: Root LP/Batch (highlighted in red)
- **Left Side**: Backward trace (source materials)
- **Right Side**: Forward trace (downstream products)
- Color coding:
  - Red: Affected and available (must be retrieved)
  - Orange: Affected and in production (must be scrapped)
  - Gray: Affected and already consumed/disposed
  - Black: Affected and shipped (customer recall)

**And** tree nodes show:
- LP Number
- Product Code
- Quantity
- Location
- Status
- Impact severity (critical, high, medium, low)

**When** I expand nodes
**Then** see full genealogy tree as in Stories 2.18/2.19

**Success Criteria:**
- Combined tree provides complete picture
- Color coding immediately shows severity
- Easy to understand at a glance
- Interactive exploration supported

---

### AC-2.20.4: Export Regulatory Reports

**Given** recall simulation results are displayed
**When** I click "Export Regulatory Reports" button
**Then** a modal opens with export options:
- **FDA FSMA JSON** (Food Safety Modernization Act)
- **FDA FSMA XML** (alternative format)
- **EU XML** (European Union regulations)
- **Internal Report PDF** (executive summary)
- **Detailed Excel** (all affected LPs with full details)

**When** I select an export format
**Then** file download begins immediately
**And** exported file contains:

**FDA JSON/XML includes:**
- Report ID and timestamp
- Company information (from org settings)
- Product details (code, name, lot/batch)
- Reason for recall (manual input field)
- Affected quantity and distribution
- Corrective actions (manual input field)
- Contact information

**EU XML includes:**
- RASFF (Rapid Alert System) format
- Product identification
- Risk classification
- Distribution information
- Actions taken

**Internal PDF includes:**
- Executive summary (1 page)
- Affected inventory breakdown
- Financial impact summary
- Customer notification list
- Recommended actions

**API Endpoint:**
```
GET /api/technical/tracing/recall/:simulation_id/export
Query: ?format=fda_json|fda_xml|eu_xml|pdf|excel
Response: File download
```

**Success Criteria:**
- FDA formats pass FSMA validation
- EU format passes RASFF validation
- PDF is executive-friendly (charts, summaries)
- Excel is comprehensive (all data for analysis)
- Filename includes timestamp: recall-simulation-{batch}-{date}.pdf

---

### AC-2.20.5: Customer Notification Draft

**Given** recall simulation results show shipped products
**And** include_notifications = true
**When** viewing simulation results
**Then** a "Customer Notifications" section shows:
- **Draft Email Template**: Pre-filled email with:
  - Subject: "Important Product Recall Notice - [Product Name]"
  - Body: Professional recall notice with:
    - Product details (code, lot, batch)
    - Reason for recall (input field)
    - Quantities shipped to customer
    - Instructions for return
    - Contact information
    - Legal disclaimers
- **Customer List**: Table with:
  - Customer Name
  - Contact Email
  - Shipped Quantity
  - Ship Date
  - Notification Status (Draft, Pending, Sent)
  - "Preview Email" button

**When** I click "Preview Email" for a customer
**Then** a modal shows the complete email with customer-specific details

**When** I click "Prepare Notifications"
**Then** all draft emails are marked as "Pending"
**And** can be sent via Epic 6 (Customer module integration)

**Success Criteria:**
- Email template is professional and legally sound
- Personalized for each customer (name, quantity, dates)
- Compliance with recall notification regulations
- Integration point with customer communication module

---

### AC-2.20.6: Recall Action Plan Generation

**Given** recall simulation results are displayed
**When** I click "Generate Action Plan" button
**Then** an action plan document is created with:

**Immediate Actions (0-24 hours):**
- [ ] Quarantine all affected inventory in warehouses
- [ ] Halt production using affected materials
- [ ] Notify QC Manager and Plant Manager
- [ ] Prepare regulatory reports

**Short-term Actions (1-7 days):**
- [ ] Retrieve affected products from customers
- [ ] File FDA/EU recall reports
- [ ] Send customer notifications
- [ ] Arrange disposal of affected inventory
- [ ] Investigate root cause

**Long-term Actions (1-4 weeks):**
- [ ] Implement corrective actions
- [ ] Verify supplier compliance
- [ ] Update procedures to prevent recurrence
- [ ] Close out regulatory reporting

**And** each action has:
- Assigned to: (dropdown with users)
- Due Date: (auto-calculated based on priority)
- Status: (Not Started, In Progress, Completed)
- Notes: (text area)

**When** I click "Export Action Plan"
**Then** download as PDF or Excel checklist

**Success Criteria:**
- Action plan covers all critical steps
- Tasks prioritized by urgency
- Assignable to team members
- Exportable for tracking

---

### AC-2.20.7: Recall Cost Estimation

**Given** recall simulation results are displayed
**Then** the financial impact section shows detailed cost breakdown:

**Product Value:**
- Available inventory: qty × unit_cost
- WIP inventory: qty × partial_cost
- Shipped inventory: qty × unit_cost

**Retrieval Cost:**
- Shipping cost: customer_count × avg_shipping_cost
- Handling labor: hours × labor_rate
- Coordination overhead: fixed_cost

**Disposal Cost:**
- Destruction cost: qty × disposal_rate
- Landfill fees: qty × landfill_rate
- Documentation: fixed_cost

**Lost Revenue:**
- Cancelled orders: estimated based on product demand
- Lost sales: opportunity_cost × weeks_out_of_stock

**Total Estimated Cost:**
- Sum of all above categories
- Confidence interval: ± 20% (displayed)

**And** costs are configurable via settings:
- Avg shipping cost per customer
- Labor rate
- Disposal rate
- Landfill rate

**Success Criteria:**
- Cost estimates use real data where available
- Formula is transparent (hover shows calculation)
- Configurable rates in org settings
- Confidence interval acknowledges uncertainty

---

### AC-2.20.8: Recall History and Comparisons

**Given** I am on the Recall Simulation page
**Then** a sidebar shows "Recent Simulations" with:
- Last 10 simulations
- Date/time
- Batch/LP ID
- Total affected LPs
- Estimated cost
- "View" and "Compare" actions

**When** I click "View" on a past simulation
**Then** load that simulation's results

**When** I select 2 simulations and click "Compare"
**Then** show a comparison view with:
- Side-by-side summary statistics
- Difference in affected LPs
- Difference in cost
- Common affected items (overlap)
- Visual charts showing differences

**Success Criteria:**
- Simulations are persisted to database
- History helps track trends over time
- Comparison helps analyze impact of different batches
- Export comparison report as PDF

---

### AC-2.20.9: Performance and Optimization

**Given** a recall simulation query that affects 1000+ LPs
**When** the simulation executes
**Then** it completes within 30 seconds

**And** backend optimizations include:
- Parallel execution of forward + backward traces
- Indexed queries on lp_genealogy and traceability_links
- Aggregation queries optimized with CTEs
- Result caching (simulation results cached for 1 hour)

**And** the UI handles large results gracefully:
- Paginated affected LP list (100 per page)
- Virtual scrolling for tree visualization
- Progressive loading of customer list
- Export offloaded to background job for > 1000 LPs

**Success Criteria:**
- Performance target met: < 30 seconds for 1000+ LPs
- UI remains responsive during simulation
- Progress indicator shows stages (trace, aggregate, report)
- Background export for large datasets

---

### AC-2.20.10: Role-Based Access Control

**Given** a user with Viewer or Production role
**When** they navigate to `/technical/tracing`
**Then** the "Recall Simulation" tab is not visible

**Given** a user with QC Manager or Technical role
**When** they navigate to the Recall Simulation tab
**Then** they can run simulations and view results
**But** cannot export regulatory reports (Admin only)

**Given** a user with Admin role
**When** they navigate to the Recall Simulation tab
**Then** they have full access including:
- Run simulations
- Export regulatory reports
- Generate customer notifications
- Access simulation history
- Compare simulations

**Success Criteria:**
- RLS policies enforce org_id filtering
- API returns 403 for unauthorized users
- Frontend hides tabs/buttons based on role
- Clear permission error messages

---

## Technical Requirements

### Database Schema

**Table: recall_simulations**
```sql
CREATE TABLE recall_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Input
  lp_id UUID REFERENCES license_plates(id) ON DELETE SET NULL,
  batch_number VARCHAR(50),
  include_shipped BOOLEAN NOT NULL DEFAULT true,
  include_notifications BOOLEAN NOT NULL DEFAULT true,

  -- Results (JSON)
  summary JSONB NOT NULL,
  forward_trace JSONB NOT NULL,
  backward_trace JSONB NOT NULL,
  regulatory_info JSONB,

  -- Metadata
  execution_time_ms INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT recall_simulations_lp_or_batch CHECK (
    lp_id IS NOT NULL OR batch_number IS NOT NULL
  )
);

CREATE INDEX idx_recall_simulations_org ON recall_simulations(org_id);
CREATE INDEX idx_recall_simulations_created ON recall_simulations(created_at DESC);
CREATE INDEX idx_recall_simulations_batch ON recall_simulations(batch_number) WHERE batch_number IS NOT NULL;
```

### API Endpoints

1. **POST /api/technical/tracing/recall**
   - Body: RecallSimulationInput
   - Returns: { simulation_id, forward_trace, backward_trace, summary, regulatory }
   - Auth: QC Manager, Technical, Admin

2. **GET /api/technical/tracing/recall/:simulation_id**
   - Returns: Complete simulation results
   - Auth: QC Manager, Technical, Admin

3. **GET /api/technical/tracing/recall/:simulation_id/export**
   - Query: format (fda_json, fda_xml, eu_xml, pdf, excel)
   - Returns: File download
   - Auth: Admin only

4. **GET /api/technical/tracing/recall/history**
   - Query: limit, offset
   - Returns: { simulations: RecallSimulation[], total: number }
   - Auth: QC Manager, Technical, Admin

5. **POST /api/technical/tracing/recall/compare**
   - Body: { simulation_ids: [string, string] }
   - Returns: { comparison: ComparisonReport }
   - Auth: QC Manager, Technical, Admin

### RLS Policies

- **SELECT recall_simulations:** org_id = auth.jwt()->>'org_id'
- **INSERT recall_simulations:** org_id = auth.jwt()->>'org_id' AND role IN ('qc_manager', 'technical', 'admin')
- **UPDATE/DELETE:** Not applicable (immutable after creation)

---

## Implementation Status

### ⏳ Pending
- [ ] Database migration (recall_simulations table)
- [ ] Recall simulation service (combines forward + backward)
- [ ] Cost estimation algorithms
- [ ] Regulatory report generators (FDA, EU formats)
- [ ] Customer notification template generator
- [ ] Action plan generator
- [ ] API routes
- [ ] Recall simulation page UI
- [ ] Combined tree visualization
- [ ] Export functionality (5 formats)
- [ ] Simulation history and comparison
- [ ] Performance optimization
- [ ] Tests (unit, integration, E2E)

---

## Testing Checklist

### Unit Tests
- [ ] Recall summary aggregation logic
- [ ] Cost estimation calculations (all categories)
- [ ] FDA JSON format validation
- [ ] EU XML format validation
- [ ] Customer notification template generation
- [ ] Action plan generation logic

### Integration Tests
- [ ] Recall simulation API with valid LP ID
- [ ] Recall simulation API with valid Batch Number
- [ ] Simulation with include_shipped = false
- [ ] Simulation with > 1000 affected LPs
- [ ] Export generation (all 5 formats)
- [ ] Simulation history retrieval
- [ ] Simulation comparison logic
- [ ] RLS policy enforcement

### E2E Tests
- [ ] Run recall simulation → view results
- [ ] Export FDA JSON → validate format
- [ ] Export internal PDF → verify content
- [ ] Generate customer notifications → preview emails
- [ ] Generate action plan → export as PDF
- [ ] View simulation history → load past simulation
- [ ] Compare two simulations → view differences
- [ ] Role-based access (QC Manager can simulate, Admin can export)
- [ ] Performance with 1000+ affected LPs

### Performance Tests
- [ ] Simulation with 100 LPs (target: < 5 seconds)
- [ ] Simulation with 500 LPs (target: < 15 seconds)
- [ ] Simulation with 1000+ LPs (target: < 30 seconds)
- [ ] Export generation for 1000+ LPs (background job)
- [ ] Concurrent simulations (5 users)

---

## Dependencies

### Requires
- ✅ Story 2.18: Forward Traceability (forward trace function)
- ✅ Story 2.19: Backward Traceability (backward trace function)
- ✅ Epic 1: Organizations, Users, Roles
- 🔄 Epic 5: License Plates, Locations
- 🔄 Epic 3: Work Orders
- 🔄 Epic 6: Customers (for customer notifications)

### Enables
- 🔄 Epic 6: Supplier Compliance (recall triggers supplier audits)
- 🔄 Epic 8: NPD (recall data informs formulation changes)

---

## Notes

- Recall simulation is P0 critical for regulatory compliance (FDA FSMA)
- Performance target (< 30 seconds) is non-negotiable for usability
- Regulatory export formats must pass official validation
- Customer notification templates require legal review before production use
- Cost estimation formulas should be validated with Finance team
- Simulation results are immutable audit records

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2d-traceability.md`
- PRD: `docs/epics/epic-2-technical.md` (Story 2.20)
- FDA FSMA Guidance: https://www.fda.gov/food/food-safety-modernization-act-fsma
- EU RASFF: https://ec.europa.eu/food/safety/rasff_en
- Service: `apps/frontend/lib/services/recall-service.ts`
