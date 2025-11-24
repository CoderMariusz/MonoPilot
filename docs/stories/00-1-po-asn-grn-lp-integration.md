# Story 0.1: PO → ASN → GRN → LP Integration Test

**Epic:** Sprint 0 (Gap 1: Integration Test Stories)
**Type:** Integration E2E Test
**Priority:** Critical (P0)
**Effort:** 1-2 days
**Owner:** Test Engineer + Senior Dev

---

## User Story

As a **QA Engineer**,
I want to verify the complete purchase order receiving flow works end-to-end,
So that we catch integration failures before production deployment.

---

## Business Context

This integration test validates the **most critical data flow in the warehouse module**:
1. **Planning Module (Epic 3):** Create Purchase Order
2. **Warehouse Module (Epic 5):** Create ASN (Advanced Shipping Notice)
3. **Warehouse Module (Epic 5):** Receive goods via GRN (Goods Receipt Note)
4. **Warehouse Module (Epic 5):** Auto-create License Plates for inventory
5. **Planning Module (Epic 3):** Update PO status and received quantities

This flow involves **5 database transactions across 8 tables** and is the foundation for all inventory receiving in MonoPilot.

---

## Integration Points Tested

| Module | Story | Table(s) | Operation |
|--------|-------|----------|-----------|
| Planning | 3.1, 3.2 | purchase_orders, po_lines | Create PO |
| Warehouse | 5.8, 5.9 | asns, asn_items | Create ASN from PO |
| Warehouse | 5.11 | grns, grn_items, license_plates | Receive GRN + create LPs |
| Planning | 5.13 | po_lines | Update received_qty |
| Warehouse | 5.2 | license_plates | Update LP qa_status |

---

## Acceptance Criteria

### AC 1: Happy Path - Complete PO Receiving Flow

**Given** a system with configured warehouse, supplier, and products
**When** executing the complete receiving flow:

1. **Create PO:**
   - Product: "Flour 50kg Bag"
   - Supplier: "SupplierA"
   - Quantity: 100 bags
   - Expected delivery: Tomorrow
   - PO status: "Confirmed"

2. **Create ASN:**
   - Link to PO #1
   - ASN status: "Pending"
   - Inherit all PO line items
   - Expected receipt date: Tomorrow

3. **Create GRN:**
   - Link to ASN #1
   - Scan 100 bags (1:1 with PO qty)
   - Batch: "BATCH-2025-001"
   - Expiry: 6 months from today
   - Location: "WH-A-RECEIVING"
   - QA Status: "Pending" (per warehouse settings)

**Then** verify the following results:

**PO Updates:**
- ✅ `po_lines.received_qty = 100` (matches GRN qty)
- ✅ `purchase_orders.status = 'Closed'` (all lines fully received)
- ✅ `purchase_orders.received_at` timestamp set

**ASN Updates:**
- ✅ `asns.status = 'Completed'`
- ✅ `asns.completed_at` timestamp set

**GRN Created:**
- ✅ `grns.id` exists with auto-generated GRN#
- ✅ `grns.asn_id` links to ASN #1
- ✅ `grns.status = 'Completed'`
- ✅ `grn_items` has 1 row (product: Flour, qty: 100)

**License Plates Created:**
- ✅ 1 LP created: `license_plates.lp_number` auto-generated (e.g., "LP-20251120-0001")
- ✅ `license_plates.product_id` = Flour
- ✅ `license_plates.current_qty = 100`
- ✅ `license_plates.batch_number = 'BATCH-2025-001'`
- ✅ `license_plates.expiry_date = TODAY + 6 months`
- ✅ `license_plates.location_id = WH-A-RECEIVING`
- ✅ `license_plates.qa_status = 'Pending'`
- ✅ `license_plates.grn_id` links to GRN #1

**Data Integrity:**
- ✅ All records have matching `org_id` (multi-tenant isolation)
- ✅ No orphaned records (all FKs valid)
- ✅ Quantities match: PO qty = ASN qty = GRN qty = LP total qty

---

### AC 2: Partial Receiving Scenario

**Given** PO for 100 bags
**When** GRN receives only 80 bags (partial shipment)
**Then** verify:
- ✅ `po_lines.received_qty = 80`
- ✅ `purchase_orders.status = 'Partially Received'` (not Closed)
- ✅ LP created for 80 bags only
- ✅ Remaining qty (20 bags) still open for future GRN

---

### AC 3: Over-Receipt Validation

**Given** PO for 100 bags
**And** warehouse setting: `allow_over_receipt = false`
**When** attempting to receive 110 bags
**Then** verify:
- ❌ GRN creation blocked
- ❌ Error: "Cannot over-receive: PO ordered 100, attempting 110. Enable over-receipt in settings to allow."
- ✅ No LP created
- ✅ PO status unchanged

---

### AC 4: Multi-Line PO Integration

**Given** PO with 3 line items:
- Line 1: Flour 50kg, qty 100
- Line 2: Sugar 25kg, qty 50
- Line 3: Salt 10kg, qty 200

**When** receiving all 3 items via GRN
**Then** verify:
- ✅ 3 LPs created (1 per line item)
- ✅ Each LP has correct product, qty, batch
- ✅ `po_lines.received_qty` updated for all 3 lines
- ✅ PO status = 'Closed' (all lines fully received)

---

### AC 5: Transaction Atomicity (Rollback Test)

**Given** PO and ASN created
**When** GRN creation fails mid-transaction (e.g., invalid location_id FK)
**Then** verify rollback integrity:
- ❌ No GRN record created
- ❌ No LP created
- ✅ ASN status = 'Pending' (unchanged)
- ✅ PO received_qty = 0 (unchanged)
- ✅ No partial data in database

**Failure Scenarios to Test:**
1. Invalid location_id → FK violation → Rollback
2. Invalid product_id → FK violation → Rollback
3. Duplicate LP number → Unique constraint → Rollback
4. Concurrent ASN processing → Optimistic lock → Rollback

---

### AC 6: QA Status Inheritance

**Given** warehouse setting: `default_qa_status_on_receipt = 'Passed'`
**When** creating GRN and LP
**Then** verify:
- ✅ `license_plates.qa_status = 'Passed'`
- ✅ LP immediately available for consumption (Story 6.4: Allow consumption of Passed LPs)

**Given** warehouse setting: `default_qa_status_on_receipt = 'Pending'`
**When** creating GRN and LP
**Then** verify:
- ✅ `license_plates.qa_status = 'Pending'`
- ✅ LP NOT consumable until QA approval (Story 6.4: Block consumption of Pending if configured)

---

### AC 7: Multiple GRNs for Same PO

**Given** PO for 100 bags
**When** receiving via 2 separate GRNs:
- GRN #1: 60 bags (Day 1)
- GRN #2: 40 bags (Day 3)
**Then** verify:
- ✅ 2 LPs created (1 per GRN)
- ✅ `po_lines.received_qty = 100` (cumulative)
- ✅ PO status = 'Closed' after GRN #2
- ✅ Both LPs have different batch numbers (if different shipments)

---

### AC 8: Cross-Org Isolation (Multi-Tenancy)

**Given** 2 orgs: Org A, Org B
**And** Org A creates PO #1
**When** Org B attempts to create GRN for PO #1 (cross-org attack)
**Then** verify:
- ❌ GRN creation blocked (RLS policy)
- ❌ Error: "Purchase Order not found" (PO hidden by RLS)
- ✅ No LP created for Org B
- ✅ Audit log: Unauthorized access attempt

---

## Test Data Setup

### Prerequisites

1. **Organization:** "Test Org A"
2. **Warehouse:** "Warehouse A" (org_id = Test Org A)
3. **Location:** "WH-A-RECEIVING" (warehouse_id = Warehouse A)
4. **Supplier:** "SupplierA" (org_id = Test Org A)
5. **Product:** "Flour 50kg Bag" (org_id = Test Org A, type = "Raw Material")
6. **Warehouse Setting:** `default_qa_status_on_receipt = 'Pending'`, `allow_over_receipt = false`

### Test Execution Order

1. Run AC 1 (Happy Path) first to validate baseline flow
2. Run AC 2 (Partial) to test partial receiving logic
3. Run AC 3 (Over-Receipt) to test validation blocking
4. Run AC 4 (Multi-Line) to test complex scenarios
5. Run AC 5 (Atomicity) to test rollback integrity
6. Run AC 6 (QA Status) to test settings inheritance
7. Run AC 7 (Multiple GRNs) to test cumulative logic
8. Run AC 8 (Multi-Tenancy) to test RLS isolation

---

## Success Criteria

- ✅ All 8 ACs pass without manual intervention
- ✅ Test runs in <30 seconds (optimized for CI/CD)
- ✅ No database state pollution between test runs (teardown cleanup)
- ✅ Generates detailed test report with pass/fail per AC
- ✅ Compatible with Playwright E2E framework (Next.js 15)

---

## Technical Notes

**Test Framework:** Playwright E2E (TypeScript)
**Database:** PostgreSQL 15 (Supabase)
**API Layer:** Next.js 15 App Router API routes
**Test File:** `e2e/integration/po-asn-grn-lp.spec.ts`

**Database Transactions:**
- Use `BEGIN TRANSACTION` / `ROLLBACK` for each test AC
- Ensure clean state before each test (delete test data)
- Mock external services (SendGrid email notifications)

**RLS Testing:**
- Create 2 test orgs (Org A, Org B) in `beforeAll()` hook
- Use Supabase client with different JWT tokens per org
- Verify RLS policies block cross-org access

---

## Dependencies

**Stories:**
- 3.1, 3.2 (PO CRUD) - Epic 3
- 5.8, 5.9 (ASN CRUD) - Epic 5
- 5.11 (GRN + LP Creation) - Epic 5
- 5.13 (Update PO Received Qty) - Epic 5
- 6.4 (QA Status Control) - Epic 6

**Database Tables:**
- purchase_orders, po_lines
- asns, asn_items
- grns, grn_items
- license_plates
- organizations, warehouses, locations, suppliers, products

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Test flakiness (timing issues) | Use `waitFor()` with explicit timeouts, retry failed assertions |
| Database connection pool exhaustion | Limit parallel test execution to 1 worker |
| Test data conflicts (duplicate LP numbers) | Use unique test prefixes: "TEST-LP-{timestamp}" |
| External service failures (SendGrid) | Mock all external API calls, no real emails sent |
| RLS policy changes break tests | CI/CD fails immediately, alerts team |

---

## Definition of Done

- [ ] Test file created: `e2e/integration/po-asn-grn-lp.spec.ts`
- [ ] All 8 ACs implemented as test cases
- [ ] Test passes in local environment (pnpm test:e2e)
- [ ] Test passes in CI/CD pipeline (GitHub Actions)
- [ ] Test report generated with detailed pass/fail per AC
- [ ] Code reviewed by Senior Dev
- [ ] Documentation updated with test coverage details

---

**Created:** 2025-11-20
**Sprint:** Sprint 0 (Gap 1)
**Reference:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 1)
