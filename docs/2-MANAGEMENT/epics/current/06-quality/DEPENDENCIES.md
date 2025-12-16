# Epic 06: Quality Module - Dependencies & Integration

**Date:** 2025-12-16
**Status:** PLANNING
**Focus:** What Epic 06 needs from upstream epics to unblock
**Critical:** Epic 06 is last in sequence, integrates with ALL modules

---

## Executive Summary

Epic 06 Quality has **hard dependencies** on nearly every other epic, making it the **most integration-heavy** module:

| Upstream Epic | Provides | When Available | Epic 06 Phase | Status |
|---------------|----------|-----------------|--------------|--------|
| **Epic 05** | License Plates + QA Status | Day 12 (Phase 0) | Phase 1 | 🔴 CRITICAL |
| **Epic 04** | WO Operations + Production | Week 4 (Phase 1) | Phase 1-2 | 🔴 CRITICAL |
| **Epic 03** | PO + Suppliers | Week 8 (Phase 1) | Phase 1-2 | 🟡 HIGH |
| **Epic 02** | Products + Specs | Week 4 (Phase 2) | Phase 1 | 🟡 HIGH |
| **Epic 01** | Settings + RBAC | Week 1 (Phase 1A) | All phases | 🟢 MEDIUM |

**Key Finding:** Epic 06 **cannot start Phase 1** until Epic 05 Day 12 + Epic 04 Week 4 complete.

---

## HARD Dependencies - Critical Blockers

### Dependency 1: License Plates (Epic 05.1 - Day 4)

**What Epic 06 Needs:**
- `license_plates` table with CRUD operations
- LP created from GRN (Epic 05.11)
- LP genealogy available (`lp_genealogy` table)

**How Epic 06 Uses It:**
- Every incoming inspection is tied to 1+ LPs
- Inspection pass/fail updates `lp.qc_status`
- Hold blocks LP from warehouse picking
- Batch release updates LP to "released" status

**Dependencies Chain:**

```
Epic 05.1: LP Table Created
    ↓
    ├─ Unblocks Epic 04.6a (Material Consumption needs LP)
    └─ Unblocks Epic 06 Phase 1 (Incoming Inspection needs LP)

    Status: LP created but NOT yet quality-enabled
    Missing: qc_status column

Epic 05.4: LP QA Status Added
    ↓
    ├─ Adds qc_status enum (pending/pass/hold/reject)
    ├─ Adds qc_hold_lps table (LP blocking)
    └─ Unblocks Epic 06.3 (Quality Holds)

    Status: Quality integration ready
    Ready for: Full Phase 1 implementation
```

**Timeline Impact:**
- If Epic 05.1 delayed 1 day → Epic 06.5a (incoming inspection) delayed 1 day
- If Epic 05.4 delayed 2 days → Epic 06 Phase 1 delayed 2 days
- **Critical:** Day 12 milestone is HARD blocker for Epic 06 Phase 1 start

**Verification Checklist:**
- [ ] `license_plates` table exists with all columns
- [ ] LP CRUD API working (/api/warehouse/lps/)
- [ ] `lp.qc_status` column exists with enum constraint
- [ ] `qc_hold_lps` table exists for blocking
- [ ] Acceptance test: "Can create hold + LP blocked" passes
- [ ] Acceptance test: "Can release hold + LP unblocked" passes

**Test Scenario:**
```sql
-- Create LP from GRN
INSERT INTO license_plates (lp_code, org_id, product_id, qc_status)
VALUES ('LP-001', org_1, product_1, 'pending');

-- Create hold → LP blocked
INSERT INTO qc_hold_lps (lp_id, hold_id, created_at)
VALUES (1, 1, now());

-- Release hold → LP unblocked
DELETE FROM qc_hold_lps WHERE lp_id = 1;

-- Verify LP available for picking
SELECT qc_status FROM license_plates WHERE id = 1;
-- Result: pending (OR pass - for completed inspection)
```

---

### Dependency 2: LP Genealogy (Epic 05.2 - Day 8)

**What Epic 06 Needs:**
- `lp_genealogy` table linking parent → child LPs
- Genealogy updated during consumption/output (Epic 04)
- Traceability chain available

**How Epic 06 Uses It:**
- Incoming inspection traces LP back to GRN
- In-process traces LP through production
- Final inspection confirms genealogy complete
- CoA (Phase 3) includes genealogy chain

**Example Traceability:**
```
GRN (PO-001)
    ↓ Creates
LP-001 (Raw Material Batch A)
    ├─ Inspected ✓ (Incoming Inspection Phase 1)
    ├─ Used in WO-100
    ├─ Split into LP-002 (consumed) + LP-003 (waste)
    └─ Genealogy records this split (Epic 05.2)

LP-003 (WO-100 Output - Finished Product)
    ├─ Inspected ✓ (In-Process Inspection Phase 1)
    ├─ Final Inspection ✓ (Final Inspection Phase 1)
    ├─ Batch Release (Phase 1)
    ├─ CoA includes genealogy chain (Phase 3)
    └─ Genealogy: GRN → WO → Finished
```

**Timeline Impact:**
- If genealogy wrong → Traceability broken → Regulatory non-conformance
- **Critical:** Must be 100% correct before Phase 1 launch

**Verification Checklist:**
- [ ] Genealogy table created + populated
- [ ] Split operation updates genealogy correctly
- [ ] Merge operation updates genealogy correctly
- [ ] Can query genealogy chain: GRN → Finished
- [ ] CoA can include genealogy (Phase 3)

---

### Dependency 3: WO Operations (Epic 04.3 - Week 4)

**What Epic 06 Needs:**
- `work_orders` table with WO status (started, in-progress, completed)
- `operations` table with operation records (time, user, qty)
- Operation completion tracking

**How Epic 06 Uses It:**
- In-process inspection (Phase 1) records parameters during operations
- CCP monitoring (Phase 3) records measurements during operations
- Batch completion triggers final inspection (Phase 1)
- RCA investigates operations (Phase 2)

**Example Workflow:**
```
WO-100 Created (Epic 03 + 04)
    ↓
WO Started (Epic 04.2a)
    ├─ Can now do in-process inspection
    └─ 06.6: Record temp/time/agitation

Operation Started (Epic 04.3)
    ├─ Operation-001: Mix (30 min @ 50°C)
    ├─ Record temperature every 5 min (06.22 CCP)
    ├─ Alert if temp out of spec
    └─ Operation Complete (Epic 04.3)

WO Complete (Epic 04.2c)
    ├─ Final Inspection triggered (06.7)
    ├─ All tests must pass
    └─ Batch Release (06.10)
```

**Timeline Impact:**
- If operations incomplete → Can't do in-process inspection
- If operation timing wrong → CCP monitoring breaks
- **Critical:** Operations must be precisely recorded

**Verification Checklist:**
- [ ] Operations table tracks time + user
- [ ] Operation start/complete timestamps recorded
- [ ] Qty consumed per operation tracked
- [ ] WO state transitions correct (start→in-progress→complete)
- [ ] Can query operations per WO

---

### Dependency 4: Product Specifications (Epic 02.1 - Week 4)

**What Epic 06 Needs:**
- `products` table with all product attributes
- Product versioning available
- Specs stored per product version (immutable)

**How Epic 06 Uses It:**
- Product specifications (06.2) link to products
- Test parameters defined per product spec
- Incoming inspection compares test results to product spec
- CoA includes product info

**Example Data Model:**
```
products
├─ id: 1
├─ product_name: "Tomato Sauce 500g"
├─ current_version: 2
└─ active: true

product_versions
├─ id: 2.1
├─ product_id: 1
├─ version_number: 1
├─ formula_bom: (immutable)
└─ created_at: 2025-01-01

product_versions
├─ id: 2.2
├─ product_id: 1
├─ version_number: 2
├─ formula_bom: (updated formula)
└─ created_at: 2025-08-01 (after reformulation)

quality_specifications
├─ id: 1
├─ product_version_id: 2.2 ← Current spec
├─ test_type: incoming
├─ parameters: [temp, pH, viscosity]
└─ active: true
```

**Immutability Requirement:**
- WO captures product spec at creation time (Epic 03.11a BOM Snapshot)
- Quality inspection uses WO's product spec (not current product spec)
- This ensures inspection compares to what was produced, not what's in market now

**Timeline Impact:**
- If product specs incomplete → Can't define test parameters
- If specs not versioned → Traceability broken
- **Critical:** Product versioning must match BOM snapshot pattern

**Verification Checklist:**
- [ ] Products table created with versioning
- [ ] Product specs linked to product versions
- [ ] Specs immutable (no updates to active spec)
- [ ] WO captures product spec snapshot (Epic 03)
- [ ] Inspection reads from WO spec, not current product

---

### Dependency 5: PO Data (Epic 03.3 - Week 8)

**What Epic 06 Needs:**
- `purchase_orders` table with PO lines
- PO contains supplier + product + qty
- PO linked to GRN (Epic 05.11)

**How Epic 06 Uses It:**
- Incoming inspection references PO for expected qty/spec
- Supplier quality tracking (Phase 4) references supplier from PO
- Regulatory reporting (Phase 2) traces batch back to PO/supplier

**Example Workflow:**
```
PO-001 Created (Epic 03.3)
├─ Supplier: ABC Foods
├─ Product: Tomato Sauce
├─ Qty: 1000 kg
└─ Expected delivery: 2025-12-20

GRN-001 Created (Epic 05.11)
├─ Links to PO-001
├─ Creates LPs from PO
├─ Triggers Incoming Inspection (06.5a)
    └─ Inspection compares received qty to PO qty
    └─ Inspection references supplier from PO

Phase 4: Supplier Quality
    └─ Rate ABC Foods based on inspection results
    └─ Track PO compliance over time
```

**Timeline Impact:**
- If PO not linked to GRN → Can't trace incoming
- If supplier not tracked → Phase 4 supplier quality incomplete
- **Critical:** PO immutability critical for audit trail

**Verification Checklist:**
- [ ] PO table has supplier, product, qty
- [ ] GRN links back to PO
- [ ] Supplier info preserved on GRN
- [ ] Can query POI history for supplier
- [ ] PO immutable after receipt

---

## SOFT Dependencies - Can Work Around

### Dependency 6: Production History (Optional for Phase 1)

**What Epic 06 Could Use:**
- Historical production cycles with yields
- Historical defect rates per product
- Historical batch success rates

**How Epic 06 Could Use It (Optional):**
- Phase 3 HACCP: Predict CCP limits based on history
- Phase 2 NCR: Analyze RCA patterns
- Phase 4 CAPA: Verify effectiveness vs. historical baseline

**Timeline Impact:**
- **NOT a blocker for Phase 1 start**
- Can use manual defaults initially
- Data improves over time

---

### Dependency 7: Supplier Master Data (Optional for Phase 1)

**What Epic 06 Could Use:**
- Supplier contact info + audit schedule
- Supplier compliance certifications
- Historical supplier audit records

**How Epic 06 Could Use It (Optional):**
- Phase 4: Supplier audits + ratings
- Phase 2: NCR customer notification if customer-related

**Timeline Impact:**
- **NOT a blocker for Phase 1 start**
- Can add manually
- Phase 4 focuses on this

---

## Integration Points - Detailed

### Integration Point 1: Incoming Inspection

```
Sequence: GRN Created → Inspection Created → Hold/Release

1. GRN Created (Epic 05.11)
   │
   ├─ Input: PO-001 (Epic 03.3), Product Spec (Epic 02.1)
   ├─ Output: LPs created with qc_status = "pending"
   │
   ▼
2. Quality Inspection Created (06.5a)
   │
   ├─ Input: LP-001 from GRN, Product Spec, Sampling Plan
   ├─ Query: Product specs from Epic 02.1
   ├─ Query: Supplier from PO via GRN
   │
   ▼
3. Test Results Recorded (06.8)
   │
   ├─ Input: Test values from lab
   ├─ Query: Expected limits from Product Spec
   │
   ▼
4. Decision Logic
   │
   ├─ IF all tests pass
   │   ├─ Update: lp.qc_status = "pass"
   │   └─ Update: qc_hold_lps DELETE (if was held)
   │
   └─ IF any test fails
       ├─ Create: qc_hold record
       ├─ Create: qc_hold_lps link (blocks LP)
       ├─ Update: lp.qc_status = "hold"
       └─ Create: NCR record (06.4 basic)
```

**Integration Verification:**
- [ ] GRN creates LP with correct product + supplier
- [ ] Inspection reads product spec correctly
- [ ] Inspection reads sampling plan correctly
- [ ] Hold creation blocks LP from warehouse picking
- [ ] Hold release unblocks LP
- [ ] LP status visible in warehouse module

### Integration Point 2: In-Process Inspection

```
Sequence: WO Started → Operation Started → Record Parameters → Alert if OOS

1. WO Started (Epic 04.2a)
   │
   ├─ Input: WO-100 with product + spec
   ├─ Query: Product spec from WO (BOM snapshot)
   │
   ▼
2. Operation Started (Epic 04.3)
   │
   ├─ Input: Operation-001 (Mix, 30 min @ 50°C)
   ├─ Output: operation record created
   │
   ▼
3. Record CCP/In-Process Parameter (06.6 or 06.22)
   │
   ├─ Input: Measured temperature = 48°C
   ├─ Query: Expected limit from product spec = 50±2°C
   ├─ Query: WO operation spec = 50°C
   │
   ▼
4. Decision Logic
   │
   ├─ IF within spec → Log + Continue
   │
   └─ IF out of spec → Alert supervisor (06.24)
       ├─ Hold batch (06.3)
       ├─ Notify operator
       └─ (Phase 3) Execute corrective action (06.25)
```

**Integration Verification:**
- [ ] Can record inspection during WO operation
- [ ] WO product spec accessible from inspection screen
- [ ] Parameters match operation requirements
- [ ] Alerts trigger correctly when OOS
- [ ] Hold visible to operators

### Integration Point 3: Batch Release

```
Sequence: WO Complete → Final Inspection → Release → Warehouse Available

1. WO Complete (Epic 04.2c)
   │
   ├─ Input: All operations recorded + completed
   ├─ Output: WO status = "completed"
   │
   ▼
2. Final Inspection (06.7)
   │
   ├─ Input: LP-003 (output from WO-100)
   ├─ Query: All test results from incoming + in-process
   ├─ Query: Product spec release criteria
   │
   ▼
3. Decision Logic
   │
   ├─ IF all tests pass AND no holds
   │   ├─ Update: lp.qc_status = "released"
   │   ├─ Query: Update warehouse module (LP available)
   │   └─ Trigger: Picking possible now
   │
   └─ IF any test failed OR hold exists
       ├─ Create: NCR record
       ├─ Hold batch from release
       └─ Notify QA for investigation
```

**Integration Verification:**
- [ ] Final inspection requires WO completion
- [ ] All test results available for review
- [ ] Release updates LP status
- [ ] Warehouse sees released LP immediately
- [ ] Can't pick unreleased LP

### Integration Point 4: Traceability

```
Sequence: Raw Material → Production → Finished Product → CoA

1. Incoming Inspection
   │
   ├─ Input: LP-001 (raw material) from GRN-001
   ├─ Result: Inspection pass, qc_status = "pass"
   │
   ▼
2. Material Consumption (Epic 04.6)
   │
   ├─ Input: WO-100 uses LP-001
   ├─ Query: LP genealogy updated (Epic 05.2)
   │
   ▼
3. Output Registration (Epic 04.7)
   │
   ├─ Input: WO-100 produces LP-003 (finished product)
   ├─ Update: LP genealogy links LP-001 → WO-100 → LP-003
   │
   ▼
4. CoA Generation (Phase 3: 06.27b)
   │
   ├─ Query: Genealogy chain (GRN → LP-001 → WO-100 → LP-003)
   ├─ Query: All inspection results (incoming + in-process)
   ├─ Query: All CCP measurements (Phase 3)
   ├─ Output: CoA document with complete traceability
   │
   ▼
5. Customer Receives
   │
   ├─ CoA shows: Material source → Production → QA checks → Release
   └─ Full traceability available if customer questions batch
```

**Integration Verification:**
- [ ] Genealogy tracks raw → consumption → output
- [ ] Inspection results linked to genealogy
- [ ] CoA includes genealogy + all QA data
- [ ] Can audit batch back to supplier

---

## Timeline - Dependency Blocking

### Week 1-2: Foundation

```
Epic 05 Phase 0 Happening (CRITICAL PATH)
├─ Day 4: LP Table + CRUD (05.1)
│  └─ NOT QUALITY-ENABLED YET
├─ Day 8: LP Genealogy (05.2)
│  └─ NOT QUALITY-ENABLED YET
└─ Day 12: LP QA Status + Hold Blocking (05.4)
   └─ ✅ EPIC 06 READY TO START

Epic 04 Phase 0 Happening (Parallel)
├─ WO Lifecycle (04.1-04.5)
├─ Operations recording (04.3)
└─ ✅ Ready for in-process inspection
```

### Week 3-4: Production Core

```
Epic 04 Phase 1 Happening
├─ Material Consumption (04.6)
├─ Output Registration (04.7)
├─ Genealogy tracking (Epic 05.2 integration)
└─ ✅ Ready for batch release

Epic 05 Phase 1 Happening
├─ GRN workflows (05.11)
├─ Genealogy updates (05.2)
└─ ✅ Ready for incoming inspection
```

### Week 5-8: Planning + Scanner

```
Epic 03 Phase 1 Happening
├─ PO workflows (03.3)
├─ TO workflows (03.8)
└─ ✅ Ready for sourcing context

Epic 05 Phase 2 Happening
├─ Stock movements (05.16-05.23)
└─ ✅ Scanner ready (Phase 1 desktop, Phase 2 mobile)
```

### Week 9-12: Quality Phase 1 START ← All dependencies ready

```
✅ Epic 05.1 (LP table)
✅ Epic 05.2 (LP genealogy)
✅ Epic 05.4 (LP QA status + holds)
✅ Epic 04.3 (Operations recording)
✅ Epic 04.6/04.7 (Consumption/Output)
✅ Epic 02.1 (Product specs)
✅ Epic 03.3 (PO data)

READY TO START EPIC 06 PHASE 1
├─ 06.5a: Incoming Inspection (uses LP, specs, PO)
├─ 06.6: In-Process Inspection (uses operations)
├─ 06.7: Final Inspection (uses WO status)
├─ 06.8: Test Results (uses specs)
└─ All integration points working
```

---

## Dependency Risk Assessment

### Risk 1: LP QA Status Missing ❌ CRITICAL

**Risk:** If `lp.qc_status` not added to LP table, incoming inspection can't mark pass/fail

**Mitigation:**
- Epic 05.4 explicitly adds this column
- Acceptance test: "Can set lp.qc_status = pass/hold/reject"
- Database migration: Add NOT NULL constraint with default "pending"

**If Delayed:** Epic 06.5a blocked until fixed

---

### Risk 2: Hold Blocking Not Implemented ❌ CRITICAL

**Risk:** If `qc_hold_lps` table not created, holds don't prevent warehouse picking

**Mitigation:**
- Epic 05.4 creates qc_hold_lps table
- Warehouse module queries this table before pick confirmation
- Acceptance test: "Can't pick held LP"

**If Delayed:** Epic 06.3 blocked, warehouse can pick held batches

---

### Risk 3: Genealogy Incomplete ⚠️ HIGH

**Risk:** If genealogy not updated during consumption/output, traceability broken

**Mitigation:**
- Epic 04.6/04.7 updates genealogy during consumption/output
- Acceptance test: "Can trace LP back to GRN and forward to consumption"
- Epic 05.2 acceptance tests verify genealogy for all scenarios

**If Delayed:** Phase 3 CoA broken, regulatory non-conformance

---

### Risk 4: Product Spec Not Versioned ⚠️ HIGH

**Risk:** If specs not versioned, WO captures wrong spec (should be immutable)

**Mitigation:**
- Epic 03.11a (WO BOM Snapshot) must capture spec snapshot
- Acceptance test: "WO stores product spec at creation time"
- Epic 02.1 must support versioning

**If Delayed:** Quality data incorrect for historical batches

---

### Risk 5: PO Immutable ⚠️ MEDIUM

**Risk:** If PO can be edited after GRN, traceability fails

**Mitigation:**
- Epic 03.3 PO should be immutable after GRN created
- Status transition: Draft → Confirmed → GRN Received → (frozen)
- Acceptance test: "Can't edit PO after GRN"

**If Delayed:** Regulatory audit trail broken

---

## Dependency Verification Checklist

Before Epic 06 Phase 1 Implementation Starts:

### Epic 05 Verification (CRITICAL)

- [ ] LP table created with all columns
- [ ] `lp.qc_status` enum column exists (pending/pass/hold/reject)
- [ ] `qc_hold_lps` table exists
- [ ] Can create LP from GRN
- [ ] Can update lp.qc_status
- [ ] Can block/unblock LP via hold
- [ ] Genealogy table populated (LP parent/child links)
- [ ] Can query genealogy chain end-to-end

### Epic 04 Verification (CRITICAL)

- [ ] WO state transitions working (start→in-progress→complete)
- [ ] Operations recorded with timestamps
- [ ] Can query operations per WO
- [ ] Material consumption updates genealogy
- [ ] Output registration creates LP + genealogy
- [ ] WO status visible to quality module

### Epic 03 Verification (HIGH)

- [ ] PO contains supplier + product + qty
- [ ] GRN links to PO
- [ ] Supplier info accessible from GRN
- [ ] PO immutable after GRN created

### Epic 02 Verification (HIGH)

- [ ] Products created with specs
- [ ] Product specs versioned
- [ ] Test parameters linked to specs
- [ ] Specs immutable after product release

### Epic 01 Verification (MEDIUM)

- [ ] Org setup complete + RLS working
- [ ] Quality manager role created
- [ ] Quality approver role created

---

## Final Dependency Summary

| Upstream | When Ready | Blocks What | Status |
|----------|-----------|------------|--------|
| **Epic 05.1** | Day 4 | Inspection CRUD | 🟡 Unblocks partial |
| **Epic 05.4** | Day 12 | Holds + Status | 🔴 CRITICAL BLOCKER |
| **Epic 04.3** | Week 4 | In-Process | 🔴 CRITICAL BLOCKER |
| **Epic 02.1** | Week 4 | Specs | 🔴 CRITICAL BLOCKER |
| **Epic 03.3** | Week 8 | Supplier Data | 🟡 HIGH (Phase 2+) |

**Key Finding:** Epic 06 **cannot start until Day 12 AND Week 4** (both must complete)

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2025-12-16 | DRAFT | Initial dependency analysis |

---

**Status:** READY FOR REVIEW
**Critical Blocker:** Epic 05.4 (LP QA Status) must complete by Week 2 day 12
**Next Step:** Verify all upstream stories have acceptance tests for quality integration
