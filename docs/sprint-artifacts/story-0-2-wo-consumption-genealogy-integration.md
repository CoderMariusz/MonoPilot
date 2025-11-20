# Story 0.2: WO → Consumption → Genealogy Integration Test

**Epic:** Sprint 0 (Gap 1: Integration Test Stories)
**Type:** Integration E2E Test
**Priority:** Critical (P0) - FDA Compliance
**Effort:** 1-2 days
**Owner:** Test Engineer + Senior Dev

---

## User Story

As a **QA Engineer**,
I want to verify the complete production flow with genealogy tracking works end-to-end,
So that we maintain FDA-compliant traceability from raw materials to finished goods.

---

## Business Context

This integration test validates the **most critical traceability flow for FDA compliance**:
1. **Planning Module (Epic 3):** Create Work Order with BOM snapshot
2. **Production Module (Epic 4):** Consume input materials (License Plates)
3. **Warehouse Module (Epic 5):** Update LP quantities and statuses
4. **Production Module (Epic 4):** Register output finished goods (new LPs)
5. **Warehouse Module (Epic 5):** Create genealogy tree linking inputs → outputs

This flow involves **multi-record atomic transactions** and is the foundation for:
- FDA 21 CFR Part 117 traceability requirements
- Product recall simulations (forward + backward trace)
- Batch genealogy tracking

---

## Integration Points Tested

| Module | Story | Table(s) | Operation |
|--------|-------|----------|-----------|
| Planning | 3.10 | work_orders, wo_materials | Create WO with BOM snapshot |
| Production | 4.7, 4.8 | wo_consumption | Consume input LPs |
| Warehouse | 5.2 | license_plates | Update LP qty, status |
| Production | 4.12, 4.13 | license_plates (output) | Register output LPs |
| Warehouse | 5.7, 5.29 | lp_genealogy | Create parent → child links |
| Production | 4.6 | work_orders | Complete WO |

---

## Acceptance Criteria

### AC 1: Happy Path - Production with Genealogy

**Given** a configured system with:
- **Product:** "Chocolate Bar 100g" (finished good)
- **BOM:**
  - Input: "Cocoa Powder 1kg" (qty: 0.5kg per bar)
  - Input: "Sugar 1kg" (qty: 0.3kg per bar)
  - Output: "Chocolate Bar 100g" (qty: 1 bar)
- **Input LPs in stock:**
  - LP-001: Cocoa Powder, 10kg, QA Status: Passed, Batch: COCOA-2025-001
  - LP-002: Sugar, 5kg, QA Status: Passed, Batch: SUGAR-2025-001

**When** executing the complete production flow:

1. **Create WO:**
   - Product: "Chocolate Bar 100g"
   - Planned Quantity: 10 bars
   - BOM Snapshot: Locked version (Cocoa 0.5kg, Sugar 0.3kg per bar)
   - WO Status: "Draft"

2. **Start WO:**
   - WO Status: "In Progress"
   - Materials Required:
     - Cocoa: 5kg (10 bars × 0.5kg)
     - Sugar: 3kg (10 bars × 0.3kg)

3. **Consume Materials:**
   - Scan LP-001 (Cocoa) → Consume 5kg
   - Scan LP-002 (Sugar) → Consume 3kg
   - Validate QA Status: Both "Passed" → Consumption allowed

4. **Register Output:**
   - Create Output LP: "Chocolate Bar" × 10 bars
   - New LP Number: LP-003 (auto-generated)
   - Batch: AUTO-WO-1234-20251120
   - Location: WH-A-FINISHED-GOODS
   - QA Status: "Pending" (default for finished goods)

5. **Complete WO:**
   - WO Status: "Completed"
   - Completed At: Timestamp

**Then** verify the following results:

**WO Updates:**
- ✅ `work_orders.status = 'Completed'`
- ✅ `work_orders.completed_at` timestamp set
- ✅ `wo_materials.consumed_qty` matches BOM requirements (Cocoa: 5kg, Sugar: 3kg)

**Input LP Updates:**
- ✅ LP-001 (Cocoa): `current_qty = 5kg` (10kg - 5kg consumed)
- ✅ LP-001: `status = 'Available'` (partial consumption, still has stock)
- ✅ LP-002 (Sugar): `current_qty = 2kg` (5kg - 3kg consumed)
- ✅ LP-002: `status = 'Available'`

**Output LP Created:**
- ✅ LP-003 exists with `lp_number` auto-generated
- ✅ `product_id` = Chocolate Bar
- ✅ `current_qty = 10` bars
- ✅ `batch_number = 'AUTO-WO-1234-20251120'` (WO-derived)
- ✅ `location_id` = WH-A-FINISHED-GOODS
- ✅ `qa_status = 'Pending'`
- ✅ `wo_id` = WO #1234 (links to source WO)

**Genealogy Records Created:**
- ✅ `lp_genealogy` row 1: parent_lp_id = LP-001 (Cocoa), child_lp_id = LP-003 (Chocolate), operation_type = 'consume', wo_id = WO#1234
- ✅ `lp_genealogy` row 2: parent_lp_id = LP-002 (Sugar), child_lp_id = LP-003 (Chocolate), operation_type = 'consume', wo_id = WO#1234

**Data Integrity:**
- ✅ All records have matching `org_id`
- ✅ No orphaned genealogy records (all parent/child LPs exist)
- ✅ Quantities reconcile: Consumed inputs = Required by BOM

---

### AC 2: Full Consumption Scenario (LP Depleted)

**Given** LP-001: Cocoa, 5kg (exactly needed for WO)
**When** consuming all 5kg for production
**Then** verify:
- ✅ LP-001: `current_qty = 0`
- ✅ LP-001: `status = 'Consumed'` (fully depleted)
- ✅ Genealogy still links LP-001 → LP-003

---

### AC 3: QA Hold Blocks Consumption

**Given** LP-001: Cocoa, 10kg, QA Status: **'Hold'** (contamination suspected)
**When** attempting to consume LP-001 for WO
**Then** verify:
- ❌ Consumption blocked
- ❌ Error: "Cannot consume LP-001: License Plate is on QA Hold. Release from hold before consuming."
- ✅ LP-001 qty unchanged (10kg)
- ✅ No consumption record created
- ✅ No genealogy record created

---

### AC 4: Over-Consumption Control

**Given** WO requires 5kg Cocoa
**And** warehouse setting: `allow_over_consumption = false`
**When** attempting to consume 6kg Cocoa (over limit)
**Then** verify:
- ❌ Consumption blocked
- ❌ Error: "Cannot consume: Over-consumption not allowed. Required: 5kg, Attempting: 6kg."
- ✅ LP-001 qty unchanged
- ✅ `wo_materials.consumed_qty = 0` (no partial consumption)

---

### AC 5: Transaction Atomicity - Consumption + Genealogy

**Given** WO in progress
**When** consumption succeeds BUT genealogy creation fails (e.g., circular dependency detected)
**Then** verify rollback integrity:
- ❌ No consumption record created
- ❌ LP qty unchanged
- ❌ No genealogy record created
- ✅ WO status = 'In Progress' (unchanged)

**Failure Scenarios to Test:**
1. Genealogy FK violation (child LP deleted during transaction) → Rollback
2. Circular dependency (LP-003 already ancestor of LP-001) → Rollback
3. Concurrent consumption (same LP by 2 WOs) → Optimistic lock → Rollback

---

### AC 6: Forward Traceability (Recall Simulation)

**Given** completed WO with genealogy:
- Input: LP-001 (Cocoa), LP-002 (Sugar)
- Output: LP-003 (Chocolate Bar)

**When** simulating recall of contaminated Cocoa (LP-001)
**Then** verify forward trace:
- ✅ Query: `SELECT child_lp_id FROM lp_genealogy WHERE parent_lp_id = 'LP-001'`
- ✅ Result: LP-003 (Chocolate Bar) identified as affected output
- ✅ Trace depth: 1 level (direct child)

**When** LP-003 used in another WO to make "Gift Box"
**Then** verify recursive trace:
- ✅ Query: `WITH RECURSIVE descendants AS (...)` finds LP-003 AND LP-004 (Gift Box)
- ✅ Trace depth: 2 levels (grandchild)

---

### AC 7: Backward Traceability (Root Cause Analysis)

**Given** contaminated output LP-003 (Chocolate Bar)
**When** tracing backward to identify source ingredients
**Then** verify backward trace:
- ✅ Query: `SELECT parent_lp_id FROM lp_genealogy WHERE child_lp_id = 'LP-003'`
- ✅ Result: LP-001 (Cocoa), LP-002 (Sugar) identified as inputs
- ✅ Batch numbers retrieved: COCOA-2025-001, SUGAR-2025-001
- ✅ Can trace further to supplier ASN/GRN (upstream traceability)

---

### AC 8: Multi-Step Genealogy Tree

**Given** complex production flow:
1. WO #1: LP-001 (Flour) + LP-002 (Yeast) → LP-003 (Dough)
2. WO #2: LP-003 (Dough) + LP-004 (Toppings) → LP-005 (Pizza)

**When** completing both WOs
**Then** verify genealogy tree:
- ✅ Level 1: LP-001, LP-002 → LP-003 (Dough production)
- ✅ Level 2: LP-003, LP-004 → LP-005 (Pizza assembly)
- ✅ Forward trace from LP-001 finds LP-003 AND LP-005 (2 levels deep)
- ✅ Backward trace from LP-005 finds LP-003, LP-001, LP-002, LP-004

---

### AC 9: By-Product Genealogy

**Given** BOM with by-product:
- Input: "Corn 10kg"
- Output 1: "Corn Oil 2L" (main product)
- Output 2: "Corn Meal 8kg" (by-product)

**When** completing WO
**Then** verify genealogy for by-products:
- ✅ LP-001 (Corn) → LP-002 (Corn Oil): operation_type = 'produce'
- ✅ LP-001 (Corn) → LP-003 (Corn Meal): operation_type = 'produce'
- ✅ Both outputs linked to same parent (1 input → 2 outputs)

---

### AC 10: Concurrent WO Consumption (Race Condition Test)

**Given** 2 WOs (WO #1, WO #2) both require LP-001 (Cocoa 10kg)
**When** both WOs attempt to consume simultaneously:
- WO #1: Consume 5kg
- WO #2: Consume 6kg (total would be 11kg > available 10kg)

**Then** verify concurrency handling:
- ✅ WO #1 consumes 5kg (first transaction succeeds)
- ❌ WO #2 blocked: Error: "Insufficient stock. LP-001 has 5kg available, requested 6kg."
- ✅ LP-001 final qty: 5kg (no double-consumption)
- ✅ Only 1 genealogy record created (WO #1 only)

---

## Test Data Setup

### Prerequisites

1. **Organization:** "Test Org A"
2. **Warehouse:** "Warehouse A"
3. **Location:** "WH-A-PRODUCTION", "WH-A-FINISHED-GOODS"
4. **Products:**
   - "Cocoa Powder 1kg" (Raw Material)
   - "Sugar 1kg" (Raw Material)
   - "Chocolate Bar 100g" (Finished Good)
5. **BOM:** Chocolate Bar (Cocoa 0.5kg, Sugar 0.3kg per bar)
6. **Input LPs:** LP-001 (Cocoa 10kg), LP-002 (Sugar 5kg), both QA: Passed

### Test Execution Order

1. AC 1 (Happy Path) - Baseline production flow
2. AC 2 (Full Consumption) - LP depletion scenario
3. AC 3 (QA Hold) - Consumption blocking
4. AC 4 (Over-Consumption) - Validation enforcement
5. AC 5 (Atomicity) - Rollback integrity
6. AC 6 (Forward Trace) - Recall simulation
7. AC 7 (Backward Trace) - Root cause analysis
8. AC 8 (Multi-Step) - Complex genealogy tree
9. AC 9 (By-Product) - Multiple outputs
10. AC 10 (Concurrency) - Race condition handling

---

## Success Criteria

- ✅ All 10 ACs pass without manual intervention
- ✅ Test runs in <45 seconds (optimized for CI/CD)
- ✅ Genealogy queries execute in <100ms (recursive CTEs optimized)
- ✅ No orphaned genealogy records (integrity enforced)
- ✅ FDA 21 CFR Part 117 compliance verified (full traceability)

---

## Technical Notes

**Test Framework:** Playwright E2E + SQL Queries
**Database:** PostgreSQL 15 with Recursive CTEs
**Test File:** `e2e/integration/wo-consumption-genealogy.spec.ts`

**Genealogy Queries (SQL):**
- Forward trace: `WITH RECURSIVE descendants AS (SELECT * FROM lp_genealogy WHERE parent_lp_id = X ...)`
- Backward trace: `WITH RECURSIVE ancestors AS (SELECT * FROM lp_genealogy WHERE child_lp_id = X ...)`

**Performance:**
- Index on `lp_genealogy(parent_lp_id, child_lp_id)` for fast recursion
- Limit recursion depth to 10 levels (prevent infinite loops)

---

## Dependencies

**Stories:**
- 3.10 (WO CRUD with BOM snapshot) - Epic 3
- 4.7, 4.8 (Material Consumption) - Epic 4
- 4.12, 4.13 (Output Registration) - Epic 4
- 4.6 (WO Complete) - Epic 4
- 5.7 (LP Genealogy Tracking) - Epic 5
- 5.29 (Genealogy Recording) - Epic 5
- 6.4 (QA Status Control) - Epic 6

**Database Tables:**
- work_orders, wo_materials, wo_consumption
- license_plates
- lp_genealogy
- products, boms, bom_items

---

## Definition of Done

- [ ] Test file created: `e2e/integration/wo-consumption-genealogy.spec.ts`
- [ ] All 10 ACs implemented as test cases
- [ ] SQL queries for forward/backward trace verified
- [ ] Test passes in local + CI/CD
- [ ] Performance benchmarks met (<45s total, <100ms per query)
- [ ] FDA compliance validated (full audit trail)
- [ ] Code reviewed by Senior Dev + QA Lead

---

**Created:** 2025-11-20
**Sprint:** Sprint 0 (Gap 1)
**Reference:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 1)
**FDA Compliance:** 21 CFR Part 117 (Food Safety Modernization Act)
