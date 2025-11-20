# Story 0.3: QA Hold Blocks Consumption Integration Test

**Epic:** Sprint 0 (Gap 1: Integration Test Stories)
**Type:** Integration E2E Test
**Priority:** Critical (P0) - Quality Control
**Effort:** 0.5-1 day
**Owner:** Test Engineer + QA Lead

---

## User Story

As a **QA Engineer**,
I want to verify that QA Hold status prevents material consumption across all modules,
So that contaminated or suspect materials never enter production.

---

## Business Context

This integration test validates the **critical quality control integration** between Epic 6 (Quality) and Epic 4 (Production):
- **Quality Module (Epic 6):** Places LPs on QA Hold
- **Production Module (Epic 4):** Blocks consumption of held LPs
- **Warehouse Module (Epic 5):** Enforces LP status during picking
- **Shipping Module (Epic 7):** Prevents shipping of held LPs

This is a **safety-critical feature** that prevents:
- Contaminated materials from being used in production
- Rejected batches from being shipped to customers
- FDA compliance violations (using non-approved materials)

---

## Integration Points Tested

| Module | Story | Operation | Expected Behavior |
|--------|-------|-----------|-------------------|
| Quality | 6.1, 6.6 | Place LP on QA Hold | `license_plates.qa_status = 'Hold'` |
| Production | 4.7, 4.8 | Attempt consumption | ❌ Blocked with error message |
| Warehouse | 5.14 | Attempt LP move | ❌ Blocked (held LPs can't move) |
| Shipping | 7.14 | Attempt picking | ❌ Blocked (only Passed LPs) |
| Quality | 6.8 | Release from hold | Consumption allowed after release |

---

## Acceptance Criteria

### AC 1: QA Hold Blocks Material Consumption (Happy Path)

**Given** system with:
- **Work Order:** WO #1234, requires "Flour 50kg"
- **License Plate:** LP-001, Flour 100kg, Location: WH-A-RAW, **QA Status: 'Passed'**

**When** QA places LP on hold:
1. Navigate to Quality > LP QA Management
2. Select LP-001
3. Click "Place on QA Hold"
4. Reason: "Contamination suspected - supplier recall"
5. Submit

**Then** verify LP status update:
- ✅ `license_plates.qa_status = 'Hold'` (updated from 'Passed')
- ✅ `license_plates.hold_reason = 'Contamination suspected - supplier recall'`
- ✅ `license_plates.held_at` timestamp set
- ✅ `license_plates.held_by_user_id` = current QA user

**When** Production attempts to consume LP-001 for WO #1234:
1. Navigate to Production > WO #1234 > Consume Materials
2. Scan LP-001 (Flour)
3. Enter qty: 50kg
4. Click "Consume"

**Then** verify consumption blocked:
- ❌ Consumption fails
- ❌ Error displayed: **"Cannot consume LP-001: License Plate is on QA Hold. Reason: Contamination suspected - supplier recall. Contact QA to release."**
- ✅ `wo_consumption` table: No record created
- ✅ `license_plates.current_qty = 100kg` (unchanged)
- ✅ `wo_materials.consumed_qty = 0` (unchanged)

---

### AC 2: QA Hold Blocks Scanner Consumption (Mobile App)

**Given** same scenario as AC 1 (LP-001 on hold)
**When** Operator uses Scanner PWA to consume:
1. Open Scanner App
2. Scan WO barcode: WO #1234
3. Scan LP barcode: LP-001
4. Enter qty: 50kg
5. Submit

**Then** verify consumption blocked in mobile:
- ❌ Scanner displays error: **"⚠️ LP-001 is on QA HOLD. Cannot consume. Contact QA department."**
- ❌ Scanner vibrates (haptic feedback) to alert operator
- ❌ Red error banner displayed
- ✅ No consumption record created
- ✅ Operator can retry with different LP

---

### AC 3: QA Hold Blocks Picking for Shipment

**Given** Sales Order SO #5678 requires "Flour 50kg"
**And** LP-001: Flour 100kg, QA Status: 'Hold'
**When** Warehouse attempts to pick LP-001 for SO:
1. Navigate to Shipping > Pick List
2. Scan LP-001 for SO #5678
3. Click "Pick"

**Then** verify picking blocked:
- ❌ Picking fails
- ❌ Error: **"Cannot pick LP-001: License Plate is on QA Hold. Only 'Passed' LPs can be shipped."**
- ✅ `shipment_picks` table: No record created
- ✅ SO status unchanged (still "Awaiting Picking")

---

### AC 4: QA Hold Blocks LP Movement

**Given** LP-001 on QA Hold, current location: WH-A-RAW
**When** Warehouse attempts to move LP to different location:
1. Navigate to Warehouse > LP Movements
2. Select LP-001
3. Target location: WH-A-PRODUCTION
4. Click "Move"

**Then** verify movement blocked:
- ❌ Movement fails
- ❌ Error: **"Cannot move LP-001: License Plate is on QA Hold. LPs must be Released from hold before moving to production areas."**
- ✅ LP location unchanged: WH-A-RAW
- ✅ `lp_movements` table: No record created

**Exception:** Moving to Quarantine location ALLOWED
**When** moving LP-001 to "QUARANTINE" location
**Then** verify:
- ✅ Movement succeeds (held LPs can be moved to quarantine only)
- ✅ `license_plates.location_id = QUARANTINE`

---

### AC 5: QA Release Enables Consumption

**Given** LP-001 on QA Hold (from AC 1)
**When** QA releases LP from hold:
1. Navigate to Quality > LP QA Management
2. Select LP-001
3. Click "Release from Hold"
4. New QA Status: "Passed"
5. Release reason: "Re-tested, contamination cleared"
6. Submit

**Then** verify LP release:
- ✅ `license_plates.qa_status = 'Passed'` (updated from 'Hold')
- ✅ `license_plates.hold_reason = NULL` (cleared)
- ✅ `license_plates.released_at` timestamp set
- ✅ `license_plates.released_by_user_id` = current QA user

**When** Production re-attempts consumption:
1. Navigate to Production > WO #1234 > Consume Materials
2. Scan LP-001
3. Enter qty: 50kg
4. Click "Consume"

**Then** verify consumption succeeds:
- ✅ Consumption allowed
- ✅ `wo_consumption` record created
- ✅ `license_plates.current_qty = 50kg` (100kg - 50kg consumed)
- ✅ `wo_materials.consumed_qty = 50kg`
- ✅ Genealogy record created (LP-001 → Output LP)

---

### AC 6: Pending QA Status Behavior (Configurable)

**Given** warehouse setting: `allow_consumption_of_pending_qa = false`
**And** LP-002: Sugar 100kg, QA Status: 'Pending' (newly received, awaiting QA test)
**When** Production attempts to consume LP-002
**Then** verify consumption blocked:
- ❌ Error: **"Cannot consume LP-002: QA Status is 'Pending'. Wait for QA approval before consuming."**
- ✅ No consumption record created

**Given** warehouse setting: `allow_consumption_of_pending_qa = true`
**When** Production re-attempts consumption
**Then** verify consumption allowed:
- ✅ Consumption succeeds (Pending allowed per configuration)
- ⚠️ Warning displayed: "Consuming Pending LP: LP-002 has not been QA tested yet."

---

### AC 7: Failed QA Status Blocks Consumption

**Given** LP-003: Cocoa 50kg, QA Status: 'Failed' (test results below spec)
**When** Production attempts to consume LP-003
**Then** verify consumption blocked:
- ❌ Error: **"Cannot consume LP-003: QA Status is 'Failed'. Failed LPs cannot be used in production. Dispose or return to supplier."**
- ✅ No consumption record created

---

### AC 8: Audit Trail for QA Status Changes

**Given** LP-001 lifecycle:
1. Created: QA Status = 'Pending'
2. Updated: QA Status = 'Passed' (by QA User A)
3. Updated: QA Status = 'Hold' (by QA User B, reason: contamination)
4. Updated: QA Status = 'Passed' (by QA User B, reason: re-tested)

**When** querying QA audit trail
**Then** verify all status changes logged:
- ✅ `qa_status_history` table has 4 rows
- ✅ Each row includes: `lp_id`, `old_status`, `new_status`, `reason`, `changed_by_user_id`, `changed_at`
- ✅ Can trace who placed hold and when
- ✅ Can trace who released and why

---

### AC 9: Multi-Tenant QA Isolation

**Given** 2 orgs: Org A, Org B
**And** Org A: LP-001 on QA Hold
**When** Org B attempts to view QA Hold queue
**Then** verify RLS isolation:
- ✅ Org B does not see LP-001 in their QA Hold list (RLS filters by org_id)
- ✅ Org B cannot release Org A's LP (cross-org action blocked)

---

### AC 10: Integration with GRN Receiving (Default QA Status)

**Given** warehouse setting: `default_qa_status_on_receipt = 'Hold'` (all new inventory on hold)
**When** receiving GRN and creating new LP (LP-004)
**Then** verify:
- ✅ LP-004 created with `qa_status = 'Hold'` (per warehouse config)
- ✅ LP-004 immediately blocked from consumption (no manual hold needed)
- ✅ QA must explicitly release LP-004 before use

---

## Test Data Setup

### Prerequisites

1. **Organization:** "Test Org A"
2. **Warehouse:** "Warehouse A"
3. **Locations:** "WH-A-RAW", "WH-A-PRODUCTION", "QUARANTINE"
4. **Products:** "Flour 50kg", "Sugar 100kg", "Cocoa Powder 50kg"
5. **License Plates:**
   - LP-001: Flour 100kg, QA: Passed → Hold (test transition)
   - LP-002: Sugar 100kg, QA: Pending (test pending scenario)
   - LP-003: Cocoa 50kg, QA: Failed (test failed scenario)
6. **Work Order:** WO #1234 (requires Flour, Sugar, Cocoa)
7. **Sales Order:** SO #5678 (for picking test)

### Test Execution Order

1. AC 1 (Desktop Consumption Block) - Core functionality
2. AC 2 (Scanner Consumption Block) - Mobile variant
3. AC 3 (Picking Block) - Shipping integration
4. AC 4 (Movement Block) - Warehouse integration
5. AC 5 (Release Flow) - Happy path completion
6. AC 6 (Pending Behavior) - Configurable setting
7. AC 7 (Failed Block) - Failed QA scenario
8. AC 8 (Audit Trail) - Compliance tracking
9. AC 9 (Multi-Tenant) - RLS verification
10. AC 10 (GRN Integration) - Receiving flow

---

## Success Criteria

- ✅ All 10 ACs pass without manual intervention
- ✅ Test runs in <20 seconds (focused integration test)
- ✅ All QA status transitions properly block/allow consumption
- ✅ Audit trail captures all status changes
- ✅ Multi-tenant isolation verified

---

## Technical Notes

**Test Framework:** Playwright E2E
**Database:** PostgreSQL 15
**Test File:** `e2e/integration/qa-hold-blocks-consumption.spec.ts`

**QA Status Enum:**
- `'Pending'` - Awaiting QA test
- `'Passed'` - Approved for use
- `'Failed'` - Rejected (cannot use)
- `'Hold'` - Temporarily blocked (investigation)

**Database Checks:**
- `CHECK (qa_status IN ('Pending', 'Passed', 'Failed', 'Hold'))`
- `CHECK (qa_status = 'Hold' → hold_reason IS NOT NULL)`

---

## Dependencies

**Stories:**
- 6.1 (LP QA Status Management) - Epic 6
- 6.6 (Quality Hold Creation) - Epic 6
- 6.8 (Hold Release Approval) - Epic 6
- 4.7, 4.8 (Material Consumption) - Epic 4
- 5.14 (LP Location Move) - Epic 5
- 7.14 (Only Pick QA Passed LPs) - Epic 7

**Database Tables:**
- license_plates
- qa_status_history (audit trail)
- wo_consumption
- shipment_picks
- lp_movements

---

## Definition of Done

- [ ] Test file created: `e2e/integration/qa-hold-blocks-consumption.spec.ts`
- [ ] All 10 ACs implemented as test cases
- [ ] Test passes in local + CI/CD
- [ ] Audit trail verified for compliance
- [ ] Code reviewed by QA Lead + Senior Dev
- [ ] Documentation updated with QA status workflow

---

**Created:** 2025-11-20
**Sprint:** Sprint 0 (Gap 1)
**Reference:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 1)
