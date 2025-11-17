# Story 1.3: FSMA 204 Compliance Enhancements

Status: ready-for-dev

## Story

As a **Quality Manager / Compliance Officer**,
I want **FSMA 204-compliant traceability with Critical Tracking Events (CTEs) and Key Data Elements (KDEs)**,
so that **recall simulation can be executed in <30 seconds and FDA traceability requirements are met by 2028 deadline**.

## Acceptance Criteria

### AC-1: FSMA 204 Data Model Extensions
- Extend `license_plates` table with FSMA 204 KDEs: traceability_lot_code, harvest_date, cooling_date, first_land_date (for seafood)
- Create `fsma_tracking_events` table with columns: id, org_id, event_type (creation, transformation, shipping, receiving), lp_id, location_id, timestamp, reference_doc (PO/WO/TO number), created_by
- Create `fsma_ftl_products` table to flag Food Traceability List products: id, org_id, product_id, ftl_category (leafy greens, fresh herbs, tropical fruits, etc.), requires_harvest_date, requires_cooling_date
- RLS policy: org_id isolation on all FSMA tables
- Indexes: (org_id, event_type, timestamp), (lp_id, event_type)

### AC-2: Critical Tracking Events (CTE) Capture
- CTE #1: Receiving - Auto-log when GRN created (capture supplier, po_number, received_date, location)
- CTE #2: Transformation - Auto-log when WO output registered (capture wo_number, line, operator, materials consumed)
- CTE #3: Shipping - Auto-log when TO shipped (capture destination, shipment_date, carrier info)
- CTE #4: Creation - Auto-log when new LP created (capture origin_type, parent_lp, batch info)
- CTE logging integrated into existing API calls (GRNsAPI, WorkOrdersAPI, TransferOrdersAPI)
- No manual CTE creation - fully automatic based on business operations

### AC-3: Recall Simulation Engine
- Create `TraceabilityAPI.simulateRecall(lp_number, reason)` method
- Perform bidirectional trace: backward (find all source materials) + forward (find all derived products)
- Generate recall report with: affected_lps (count + list), affected_customers (if shipped), affected_locations, total_quantity, trace_tree (visual)
- Performance requirement: <30 seconds for 100+ LP genealogy tree (recursive CTE query optimization)
- Recall report includes: product descriptions, batch numbers, expiry dates, current locations, qa_status

### AC-4: FSMA 204 Compliance Report
- Create `TraceabilityAPI.generateFSMA204Report(start_date, end_date, product_id?)` method
- Report sections: FTL products summary, CTEs logged (count by type), traceability coverage (% of LPs with complete genealogy), missing KDEs warnings
- Export to PDF with FDA-compliant format (product name, lot code, quantity, location, dates)
- Report filters: date range, FTL category, location, supplier
- 1-touch recall drill: user selects LP → recall report generated in UI

### AC-5: Food Traceability List (FTL) Management UI
- New page: `/settings/fsma-compliance` (Admin/Manager only)
- Tab 1: FTL Products - Table view: product, FTL category, KDE requirements, compliance status
- Tab 2: Tracking Events - Log view: timestamp, event type, LP, reference doc, location, user
- Tab 3: Recall Simulation - Input: LP number, reason → Output: Recall report with affected entities
- Mark products as FTL (dropdown: leafy greens, fresh herbs, tropical fruits, cheeses, seafood, etc.)
- Visual indicator on Product detail page if product is FTL-listed

### AC-6: KDE Validation on Operations
- GRN receiving: If FTL product → require traceability_lot_code (validate non-empty)
- GRN receiving: If FTL + harvest_date required → validate harvest_date provided
- WO output: If FTL product → inherit traceability_lot_code from parent LP (or generate new)
- Validation errors block operation: "This product is on FSMA Food Traceability List. Please provide harvest date."
- Scanner UI: Show FTL badge + required KDE fields highlighted

### AC-7: Traceability Completeness Dashboard
- Widget on `/dashboard`: "FSMA 204 Compliance Score"
- Metrics: % FTL products with complete KDEs, % LPs with full genealogy, CTEs logged (last 30 days), recall readiness score (0-100)
- Red/yellow/green status indicators
- Drill-down: Click metric → see non-compliant products/LPs
- Export compliance summary to CSV

### AC-8: Documentation
- Update `docs/architecture.md` with FSMA 204 data model and CTE workflow
- Document KDE requirements per FTL category
- Update `docs/API_REFERENCE.md` with TraceabilityAPI new methods
- Add compliance note: FSMA 204 deadline (Jan 2026 for large entities, Jan 2027 for small)

## Tasks / Subtasks

### Task 1: FSMA 204 Data Model (AC-1) - 5 hours
- [ ] 1.1: Create migration `XXX_fsma_204_compliance.sql`
- [ ] 1.2: Extend `license_plates` table with KDE columns (traceability_lot_code, harvest_date, cooling_date, first_land_date)
- [ ] 1.3: Create `fsma_tracking_events` table with CTE schema
- [ ] 1.4: Create `fsma_ftl_products` table with FTL category mapping
- [ ] 1.5: Add RLS policies for org_id isolation
- [ ] 1.6: Create indexes for performance (org_id, event_type, timestamp), (lp_id, event_type)
- [ ] 1.7: Run `pnpm gen-types` to regenerate TypeScript types

### Task 2: CTE Auto-Logging (AC-2) - 6 hours
- [ ] 2.1: Update `GRNsAPI.create()` to log CTE_RECEIVING event
- [ ] 2.2: Update `WorkOrdersAPI.registerOutput()` to log CTE_TRANSFORMATION event
- [ ] 2.3: Update `TransferOrdersAPI.ship()` to log CTE_SHIPPING event
- [ ] 2.4: Update `LicensePlatesAPI.create()` to log CTE_CREATION event
- [ ] 2.5: Create `FSMATrackingAPI.logEvent()` helper method
- [ ] 2.6: Add unit tests for CTE logging (verify event created on operation)

### Task 3: Recall Simulation Engine (AC-3) - 8 hours
- [ ] 3.1: Create `TraceabilityAPI` class (if not exists, or extend existing)
- [ ] 3.2: Implement `simulateRecall(lp_number, reason)` method
- [ ] 3.3: Write recursive CTE query for bidirectional trace (backward + forward)
- [ ] 3.4: Optimize query performance (<30s for 100+ LP tree)
- [ ] 3.5: Generate recall report structure (affected_lps, customers, locations, qty)
- [ ] 3.6: Add unit tests for recall simulation (verify tree completeness)

### Task 4: FSMA 204 Compliance Report (AC-4) - 5 hours
- [ ] 4.1: Implement `TraceabilityAPI.generateFSMA204Report(start_date, end_date, product_id?)`
- [ ] 4.2: Query CTEs logged in date range (group by event type)
- [ ] 4.3: Calculate traceability coverage (% LPs with complete genealogy)
- [ ] 4.4: Identify missing KDEs (FTL products without required fields)
- [ ] 4.5: Export to PDF with FDA-compliant format (use jsPDF or similar)
- [ ] 4.6: Add unit tests for report generation

### Task 5: FTL Management UI (AC-5) - 7 hours
- [ ] 5.1: Create `/settings/fsma-compliance` page
- [ ] 5.2: Implement RBAC check (Admin/Manager only)
- [ ] 5.3: Tab 1: FTL Products table (product, category, KDE reqs, compliance status)
- [ ] 5.4: Tab 2: Tracking Events log (timestamp, event type, LP, ref doc)
- [ ] 5.5: Tab 3: Recall Simulation UI (input: LP + reason → recall report)
- [ ] 5.6: Create `<FTLProductsTable>` component
- [ ] 5.7: Create `<TrackingEventsLog>` component
- [ ] 5.8: Create `<RecallSimulator>` component
- [ ] 5.9: Add FTL badge on Product detail page

### Task 6: KDE Validation (AC-6) - 4 hours
- [ ] 6.1: Add FTL product check on GRN receiving
- [ ] 6.2: Validate traceability_lot_code required for FTL products
- [ ] 6.3: Validate harvest_date if FTL category requires it (leafy greens, etc.)
- [ ] 6.4: Add validation errors to API responses (block operation if missing)
- [ ] 6.5: Update Scanner UI to show FTL badge + highlight required KDE fields
- [ ] 6.6: Add unit tests for KDE validation (valid/invalid scenarios)

### Task 7: Compliance Dashboard Widget (AC-7) - 4 hours
- [ ] 7.1: Create `<FSMA204ComplianceWidget>` component
- [ ] 7.2: Query metrics: % FTL with KDEs, % LPs with genealogy, CTEs logged (30d)
- [ ] 7.3: Calculate recall readiness score (0-100 based on completeness)
- [ ] 7.4: Implement red/yellow/green status indicators
- [ ] 7.5: Drill-down modal: show non-compliant products/LPs
- [ ] 7.6: Export compliance summary to CSV

### Task 8: E2E Tests (5 hours)
- [ ] 8.1: E2E test: Receive GRN → verify CTE_RECEIVING logged
- [ ] 8.2: E2E test: Register WO output → verify CTE_TRANSFORMATION logged
- [ ] 8.3: E2E test: Mark product as FTL → validation blocks GRN without lot code
- [ ] 8.4: E2E test: Recall simulation → verify affected LPs identified
- [ ] 8.5: E2E test: FSMA 204 report → verify PDF export
- [ ] 8.6: E2E test: Compliance dashboard widget shows metrics

### Task 9: Documentation (AC-8) - 2 hours
- [ ] 9.1: Run `pnpm docs:update` to regenerate API docs
- [ ] 9.2: Update `docs/architecture.md` with FSMA 204 data model diagram
- [ ] 9.3: Document CTE workflow and KDE requirements per FTL category
- [ ] 9.4: Add compliance section: FSMA 204 deadline (Jan 2026/2027)

**Total Estimated Effort:** 46 hours (~6 days)

## Dev Notes

### Requirements Source
[Source: docs/MonoPilot-PRD-2025-11-13.md#LP-Genealogy, lines 116-126]

**FSMA 204 Requirements:**
- License Plate-based genealogy (already implemented)
- Forward + backward traceability (already implemented)
- **NEW**: Recall simulation in <30 seconds (performance optimization needed)
- **NEW**: Critical Tracking Events (CTE) capture (4 event types)
- **NEW**: Key Data Elements (KDE) for Food Traceability List products
- **NEW**: FSMA 204 compliance reporting
- Compliance deadline: January 2026 (large entities), January 2027 (small entities)

[Source: docs/MonoPilot-PRD-2025-11-13.md#Compliance, lines 513-514]
**Regulatory Context:**
- FSMA 204: Food Traceability Rule (FDA, deadline July 2028)
- Focus: Food Traceability List (FTL) products - leafy greens, fresh herbs, tropical fruits, cheeses, seafood, etc.

### Architecture Constraints

**FSMA 204 Key Data Elements (KDEs):**
Food Traceability List products must capture:
- **Traceability Lot Code** (TLC) - unique identifier for each lot/batch
- **Product Description** (already exists)
- **Quantity and Unit of Measure** (already exists)
- **Location** (already exists)
- **Reference Document Number** (PO/WO/TO number - already exists)
- **Harvest Date** (for produce) - NEW
- **Cooling Date** (for produce requiring cooling) - NEW
- **First Land Date** (for seafood) - NEW
- **Ship Date / Receive Date** (already tracked via TO/GRN)

**Critical Tracking Events (CTEs):**
FSMA 204 requires logging:
1. **Creation** - Initial packing or production
2. **Transformation** - Processing/manufacturing (WO output)
3. **Shipping** - Transfer/shipment to another location
4. **Receiving** - Receipt of materials/products (GRN)

**Performance Requirements:**
- Recall simulation: <30 seconds for 100+ LP genealogy tree
- Use recursive CTEs (Common Table Expressions) in PostgreSQL for tree traversal
- Index on (lp_id, parent_lp_id, consumed_by_wo_id) for fast genealogy queries

**Food Traceability List (FTL) Categories:**
- Leafy greens (requires harvest_date)
- Fresh herbs (requires harvest_date)
- Tropical fruits (requires harvest_date)
- Fresh-cut fruits and vegetables (requires harvest_date + cooling_date)
- Cheeses (hard, soft, semi-soft)
- Shell eggs
- Nut butters
- Cucumbers, peppers, tomatoes
- Sprouts
- Fresh seafood (requires first_land_date)

### Testing Strategy

**Risk-Based E2E Coverage:**
- HIGH RISK: Recall simulation (regulatory compliance, data integrity) = E2E required
- HIGH RISK: KDE validation (FTL products blocked without required fields) = E2E required
- COMPLEX: CTE auto-logging (multi-table operations) = E2E required
- Simple: Compliance dashboard metrics = unit test sufficient

**E2E Test Scenarios:**
1. Receive FTL product without lot code → blocked (validation error)
2. Receive FTL product with all KDEs → CTE_RECEIVING logged
3. Register WO output for FTL product → CTE_TRANSFORMATION logged + TLC inherited
4. Recall simulation on LP → affected LPs/locations/customers identified <30s
5. FSMA 204 report export → PDF downloaded with correct data
6. Compliance dashboard shows correct metrics (% complete, CTEs logged)

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/lib/supabase/migrations/XXX_fsma_204_compliance.sql` - New tables + LP extensions
- `apps/frontend/lib/api/fsmaTracking.ts` - New FSMATrackingAPI class
- `apps/frontend/lib/api/traceability.ts` - Extend with simulateRecall() and generateFSMA204Report()
- `apps/frontend/lib/api/grns.ts` - Update create() to log CTE_RECEIVING
- `apps/frontend/lib/api/workOrders.ts` - Update registerOutput() to log CTE_TRANSFORMATION
- `apps/frontend/lib/api/transferOrders.ts` - Update ship() to log CTE_SHIPPING
- `apps/frontend/lib/api/licensePlates.ts` - Update create() to log CTE_CREATION + KDE validation
- `apps/frontend/app/settings/fsma-compliance/page.tsx` - FSMA compliance UI
- `apps/frontend/components/FTLProductsTable.tsx` - FTL products management
- `apps/frontend/components/TrackingEventsLog.tsx` - CTE log view
- `apps/frontend/components/RecallSimulator.tsx` - Recall simulation UI
- `apps/frontend/components/FSMA204ComplianceWidget.tsx` - Dashboard widget
- `apps/frontend/__tests__/fsmaTracking.test.ts` - Unit tests
- `apps/frontend/e2e/fsma-204-compliance.spec.ts` - E2E tests
- `docs/architecture.md` - FSMA 204 documentation

### MVP Scope

✅ **MVP Features** (ship this):
- KDE capture for FTL products (3 new fields: lot_code, harvest_date, cooling_date)
- 4 CTE types auto-logged (creation, transformation, shipping, receiving)
- Recall simulation with <30s performance
- Basic FTL product management UI
- Compliance dashboard widget

❌ **Growth Phase** (defer):
- Advanced FTL categories (exotic fruits, specialty cheeses)
- Multi-language compliance reports (Spanish, French)
- Blockchain-based immutable traceability (for premium tier)
- AI-powered recall impact prediction
- Real-time FSMA 204 compliance monitoring with alerts
- Integration with FDA FSVP (Foreign Supplier Verification Program)
- Automated supplier KDE validation (API integration)

### Dependencies

**Prerequisites:**
- Existing LP genealogy system (already implemented)
- Forward/backward traceability (already implemented - `apps/frontend/lib/api/traceability.ts`)
- GRNsAPI, WorkOrdersAPI, TransferOrdersAPI (already implemented)

**Blocks:**
- None (Story 1.1 pgAudit and Story 1.2 E-Signatures are independent)

### References

- [FDA FSMA 204 Final Rule](https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods)
- [FSMA 204 Food Traceability List](https://www.fda.gov/food/food-safety-modernization-act-fsma/food-traceability-list)
- [FSMA 204 Compliance Deadlines](https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-204-compliance-dates)
- [Best Practices for Traceability in Food Manufacturing](https://www.fda.gov/media/145838/download)

### Learnings from Previous Stories

**From Story 1.1 (pgAudit Extension):**
- RLS policy pattern for org_id isolation → apply to fsma_tracking_events table
- Performance testing required (<5% overhead in 1.1, <30s recall in 1.3)
- CSV export pattern → extend to FSMA 204 report PDF export

**From Story 1.2 (Electronic Signatures):**
- Audit integration pattern → link CTEs to electronic signatures for critical events
- API class pattern: FSMATrackingAPI follows same structure as ElectronicSignaturesAPI
- Modal UI pattern → apply to Recall Simulator component

**Reuse Patterns:**
- TraceabilityAPI already exists with forward/backward trace → extend with recall simulation
- Product detail page pattern → add FTL badge similar to allergen badges
- Compliance dashboard widget → similar to existing KPI widgets on /dashboard

### FSMA 204 Compliance Checklist

**For MonoPilot to be FSMA 204 compliant:**
- [x] License Plate-based inventory (atomic traceability unit) - Already implemented
- [x] Forward traceability (where did this batch go?) - Already implemented
- [x] Backward traceability (where did this product come from?) - Already implemented
- [ ] **NEW**: Critical Tracking Events logged for all 4 event types
- [ ] **NEW**: Key Data Elements captured for FTL products
- [ ] **NEW**: Recall simulation in <30 seconds
- [ ] **NEW**: FSMA 204 compliance report export
- [ ] **NEW**: FTL product flagging and KDE validation
- [ ] **NEW**: Traceability completeness dashboard

**Post-MVP (before Jan 2026 deadline for large entities):**
- [ ] Supplier KDE validation (inbound traceability from suppliers)
- [ ] Customer notification workflow (recall alert to downstream customers)
- [ ] FDA-compliant sortable spreadsheet export (required format for inspections)
- [ ] Annual traceability audit (verify all FTL products have complete records)

## Dev Agent Record

### Context Reference

- **Story Context File**: `docs/sprint-artifacts/1-3-fsma-204-compliance-enhancements.context.xml`
- Generated: 2025-11-16
- Includes: FSMA 204 requirements (CTEs, KDEs, FTL categories), recall simulation algorithm, performance requirements (<30s), compliance reporting

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
