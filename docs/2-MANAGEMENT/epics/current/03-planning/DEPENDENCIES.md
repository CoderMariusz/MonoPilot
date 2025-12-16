# Epic 03 Planning - Dependencies & Integration

**Cross-epic integration requirements and blockers.**

Date: 2025-12-16
Status: ANALYZED - READY FOR COORDINATION

---

## Hard Dependencies (MUST Complete Before Starting)

Epic 03 cannot start until these are 100% complete:

### Epic 01: Settings & Infrastructure

| Story | Feature | Required For | Status | Days to Complete |
|-------|---------|--------------|--------|------------------|
| **01.1** | Organization Context + RLS | All Epic 03 tables | ~80% | Verify complete |
| **01.8** | Warehouses CRUD | TO from/to warehouse, WO location | ~80% | Verify complete |
| **01.10** | Roles + RBAC | PO approval workflow | ~80% | Verify for approvals |

**Why Blocked:**
- 01.1: RLS policies control which suppliers/PO/WO users see
- 01.8: Transfer orders require warehouse definitions
- 01.10: Approval roles determine who can submit/approve PO

**Verification Checklist:**
- [ ] Epic 01.1: org_id on all tables, RLS policies deployed
- [ ] Epic 01.8: warehouse table with org_id, location support
- [ ] Epic 01.10: role_permissions table with plan_approve role

---

### Epic 02: Technical Module

| Story | Feature | Required For | Status | Days to Complete |
|-------|---------|--------------|--------|------------------|
| **02.1** | Products CRUD + Types | PO lines, WO product selection | ~80% | Verify complete |
| **02.4** | BOMs CRUD | WO BOM snapshot, material lists | ~80% | Verify complete |
| **02.5a** | BOM Items (Core) | WO line-item composition | ~80% | Verify complete |

**Why Blocked:**
- 02.1: PO lines reference product_id + prices
- 02.4: WO creation requires valid BOM
- 02.5a: WO lines populated from BOM items

**Verification Checklist:**
- [ ] Epic 02.1: products table, product_types, pricing
- [ ] Epic 02.4: boms table with status, versioning
- [ ] Epic 02.5a: bom_items table with qty, sequencing

---

## Soft Dependencies (Helpful but Not Blocking)

### Epic 01: Settings & Infrastructure

| Story | Feature | Helps With | Impact | Workaround |
|-------|---------|-----------|--------|-----------|
| **01.9** | Locations CRUD | TO putaway location, WO location | Medium | Defaults work fine |
| **01.11** | Production Lines | WO production line selection | Low | Can leave empty |
| **01.12** | Shifts | WO shift assignment | Low | Not used in Phase 1 |

**Recommendation:** Could implement in parallel with Phase 1 but not required for MVP.

---

## Internal Epic 03 Dependencies

### Story Dependencies within Phase 1

```
03.1 (Suppliers)
  └─ 03.2 (Supplier-Products) [requires 03.1]
  └─ 03.3 (PO CRUD) [requires suppliers]

03.3 (PO CRUD)
  ├─ 03.4 (PO Calculations) [line totals, tax]
  ├─ 03.5a (PO Approval Setup) [config]
  ├─ 03.5b (PO Approval Workflow) [requires 03.5a + roles]
  ├─ 03.6 (PO Bulk Ops) [mass PO creation]
  └─ 03.7 (PO Status) [state machine]

03.8 (TO CRUD)
  ├─ 03.9a (TO Partial) [qty tracking]
  └─ 03.9b (TO LP Selection) [DEFERRED to Phase 2]

03.10 (WO CRUD)
  ├─ 03.11a (WO BOM Snapshot) [immutable copy]
  ├─ 03.11b (WO Reservations) [DEFERRED to Phase 2]
  ├─ 03.12 (WO Operations) [routing copy]
  ├─ 03.13 (Material Availability) [DEFERRED to Phase 2]
  └─ 03.14 (WO Scheduling) [DEFERRED to Phase 2]

03.15 (WO Gantt)
  └─ requires 03.10 (WO list + dates)

03.16 (Planning Dashboard)
  ├─ requires 03.3 (PO count, approval queue)
  ├─ requires 03.8 (TO count)
  └─ requires 03.10 (WO count, status)

03.17 (Planning Settings)
  ├─ requires 03.1 (default supplier)
  ├─ requires 03.5a (approval threshold)
  └─ requires 01.8 (default warehouse)
```

---

## Deferred Stories (Epic 05 Dependency)

### Why These 4 Stories Are Deferred

| Story | Title | Blocks | Reason | When Available |
|-------|-------|--------|--------|-----------------|
| **03.9b** | TO LP Selection | TO workflows | Requires LP table (Epic 05.1) | Week 2 (Day 4) |
| **03.11b** | WO Reservations | WO workflows | Requires FIFO/FEFO (Epic 05.3) | Week 2 (Day 12) |
| **03.13** | Material Availability | WO creation | Requires LP inventory lookup (Epic 05.3) | Week 2 (Day 12) |
| **03.14** | WO Scheduling | Planning | Requires capacity + WO execution (Epic 04/05) | Week 4+ |

### Epic 05 Critical Milestones for Epic 03

```
Day 1:     Epic 05 Phase 0 starts
Day 4:     Epic 05.1 (LP Table) COMPLETE
           ↓
           Epic 03.9b CAN START (LP selection available)

Day 12:    Epic 05 Phase 0 COMPLETE (all 8 stories)
           ↓
           Epic 03.11b, 03.13 CAN START (reservations + FIFO available)

Week 4:    Epic 04 Phase 1 + Epic 05 Phase 1 stable
           ↓
           Epic 03.14 CAN START (scheduling with capacity)
```

### Integration Points for Deferred Stories

**03.9b (TO LP Selection)** ← Epic 05.1, 05.2
```yaml
API Call: GET /api/warehouse/lp?warehouse_id={id}&product_id={id}
Returns: List of available LPs for outbound transfer
Feature: Pre-select which LPs to transfer (FIFO order by receipt date)
```

**03.11b (WO Reservations)** ← Epic 05.3
```yaml
API Call: POST /api/warehouse/reservations/reserve
Payload: wo_id, product_id, qty, reservation_type (FIFO|FEFO)
Returns: Reserved LP list with hold lock
Feature: Lock LPs for WO materials, prevent use elsewhere
```

**03.13 (Material Availability)** ← Epic 05.3
```yaml
API Call: GET /api/warehouse/inventory/available?product_id={id}
Returns: Available qty (unreserved LPs), on-order (PO + GRN in transit)
Feature: Warn if WO > available + on-order
```

---

## Provides to Downstream Modules

### To Epic 04: Production

| Epic 04 Story | Needs From Epic 03 | Dependency | Impact |
|---------------|-------------------|-----------|--------|
| **04.1** | PO deliveries tracked | 03.3, 03.9 | Can plan WO when materials arrive |
| **04.2-04.5** | WO master + operations | 03.10, 03.12 | Execute WO from planning |
| **04.6-04.8** | WO BOM snapshot | 03.11a | Use frozen BOM for consumption |
| **04.9-04.11** | WO history | 03.10 | Calculate OEE from WO data |

**Timeline:** Epic 03 Phase 1 must be 50% complete before Epic 04 starts consuming

---

### To Epic 05: Warehouse

| Epic 05 Story | Needs From Epic 03 | Dependency | Impact |
|---------------|-------------------|-----------|--------|
| **05.0-05.3** | None | Independent | LP foundation doesn't depend on planning |
| **05.8** | ASN from PO | 03.3 | Create GRN matched to PO |
| **05.9-05.11** | PO reference | 03.3 | Link GRN back to purchase order |
| **05.16-05.23** | TO reference | 03.8 | Link LP movement to transfer order |

**Timeline:** Epic 05 Phase 0 starts independently. Epic 05 Phase 1 waits for Epic 03.3 (PO)

---

### To Epic 06: Quality

| Epic 06 Story | Needs From Epic 03 | Dependency | Impact |
|---------------|-------------------|-----------|--------|
| **06.1-06.3** | Supplier master | 03.1 | Quality holds linked to suppliers |
| **06.5** | Incoming inspection | 03.3, 05.8 | Inspect GRN from PO |
| **06.6-06.7** | In-process inspection | 04, 03.10 | Inspect materials during WO |
| **06.9** | Sampling plans | 03.1, 03.3 | Inspection sampling based on supplier risk |

**Timeline:** Epic 06 Phase 1 waits for Epic 03 + Epic 04 data

---

### To Epic 07: Shipping

| Epic 07 Story | Needs From Epic 03 | Dependency | Impact |
|---------------|-------------------|-----------|--------|
| **07.1** | Customer orders | Separate module | Sales → Planning → Production → Shipping |
| **07.5** | LP allocation (FEFO) | 03, 05 | Use expiry-sorted LPs for outbound |

**Timeline:** Epic 07 waits for full Epic 03 + Epic 05 + Epic 04 operational

---

## Integration Test Points

### Integration Point 1: PO → GRN

**Epic 03.3 → Epic 05.8**

```yaml
Test Scenario: Create PO in Epic 03, receive in Epic 05
1. Create PO with 2 lines:
   - Line 1: Product A, Qty 100
   - Line 2: Product B, Qty 50
2. Verify PO appears in GRN creation dropdown
3. Create GRN from PO:
   - System pre-populates lines from PO
   - Verify quantities match
4. Create LPs from GRN:
   - Verify each LP has correct product + qty
5. Verify PO status updates to "Received"
```

**Pass Criteria:**
- [ ] GRN correctly references PO
- [ ] LPs created with source='po'
- [ ] PO status transitions to Received
- [ ] No duplicate LPs created

---

### Integration Point 2: WO → Consumption

**Epic 03.10 + Epic 03.11a → Epic 04.6**

```yaml
Test Scenario: Create WO with BOM, consume materials
1. Create WO for Product (which has BOM with 3 ingredients)
2. Verify BOM snapshot captured at creation time
3. In Epic 04: Start production (04.2a)
4. Record material consumption (04.6a):
   - System shows BOM snapshot ingredients
   - Scan or select LP for each ingredient
   - Verify qty deducted from LP
5. Verify genealogy: Output LP linked to consumed LPs
```

**Pass Criteria:**
- [ ] BOM snapshot immutable after WO creation
- [ ] Consumption references BOM lines
- [ ] Genealogy traces input → output LPs

---

### Integration Point 3: WO → Scheduling

**Epic 03.10 + Epic 03.14 → Epic 04 + Epic 05**

```yaml
Test Scenario: Schedule WO considering capacity + inventory
1. Create multiple WOs with target dates
2. In Epic 03.14 (WO Scheduling):
   - View Gantt timeline
   - Check capacity (from Epic 01.11)
   - Check inventory (from Epic 05)
3. Drag WO to reschedule
4. System calculates:
   - Material availability by target date
   - Capacity headroom
   - Potential conflicts
5. Save new schedule
```

**Pass Criteria:**
- [ ] Scheduling considers capacity
- [ ] Warns if materials unavailable by target date
- [ ] Recalculates availability when moved

---

### Integration Point 4: PO Approval → Routing

**Epic 03.5b → Downstream workflows**

```yaml
Test Scenario: Multi-role approval workflow
1. User 1 (Planner) creates PO with $15,000
2. User 2 (Approver) receives notification
3. User 2 approves PO
4. PO status changes to "Approved"
5. Finance system can process payment
6. Warehouse can receive goods
```

**Pass Criteria:**
- [ ] RLS: only org users see PO
- [ ] Role checks: only approver role can approve
- [ ] Notification sent to approver
- [ ] Status transitions atomic

---

## Critical Path for Full Operational System

```
Week 1-2:  Epic 01.1 ✅ → Epic 03.1-03.2 (Suppliers)
Week 2-3:  Epic 02.1 ✅ → Epic 03.3 (PO CRUD)
Week 3-4:  Epic 01.10 ✅ → Epic 03.5b (PO Approval)
Week 5-6:  Epic 01.8 ✅ → Epic 03.8 (TO CRUD)
Week 6-7:  Epic 02.4 ✅ → Epic 03.10 (WO CRUD)
Week 7-8:  Epic 02.5a ✅ → Epic 03.11a (WO BOM)

PARALLEL:  Epic 05 Phase 0 starts Week 1
Week 3:    Epic 05.1 complete → Epic 03.9b UNBLOCKED
Week 4:    Epic 05 Phase 0 complete → Epic 03.11b, 03.13 UNBLOCKED

Week 8-9:  Epic 03 ready for integration testing
Week 9+:   Epic 04, 05, 06 integration begins
```

---

## Resource Coordination

### When to Assign Developers

| Phase | Dev Count | Assignment | Timeline |
|-------|-----------|-----------|----------|
| **Phase 1: Foundation** | 1-2 | Epic 03 team starts after Epic 01, 02 verified | Week 5-6 |
| **Phase 1: PO Workflows** | 2 | Both devs for parallel PO + TO | Week 6-7 |
| **Phase 1: WO Advanced** | 1-2 | Depends on parallel Epic 05 progress | Week 7-9 |
| **Phase 2: Deferred** | 1 | After Epic 05 Phase 0 complete | Week 3-4 onward |

### Blocking Scenarios

| Scenario | Impact | Mitigation |
|----------|--------|-----------|
| Epic 01 delays | Epic 03 stalls completely | Start with epic-less schema if needed (temp) |
| Epic 02 delays | Epic 03.10 (WO) stalls | Stub BOM lookup with test data |
| Epic 05 delays | Deferred stories + Phase 2 blocked | Acceptable - defer 4 stories to Phase 2 |

---

## Dependency Checklist

Before starting Epic 03 Phase 1, verify:

### Epic 01 Prerequisites
- [ ] 01.1: Org context working, RLS policies on base tables
- [ ] 01.8: Warehouses table created with org_id scoping
- [ ] 01.10: Roles table with at least 3 roles (admin, planner, approver)
- [ ] Database: org_id column added to all Epic 03 tables

### Epic 02 Prerequisites
- [ ] 02.1: Products table live with pricing
- [ ] 02.4: BOMs CRUD working
- [ ] 02.5a: BOM Items functional
- [ ] Database: product_id references valid

### Data Seed Requirements
- [ ] 1+ Supplier created per test org
- [ ] 2+ Products created per test org
- [ ] 1+ BOM created for a product
- [ ] 1+ Warehouse created per test org

### API Contract Requirements
- [ ] RLS policies return only org_id scoped data
- [ ] product service exposes price lookup
- [ ] BOM service exposes item list + snapshot export
- [ ] warehouse service exposes list

---

## Parallel Work Plan

### Ideal: 2 Developers + 1 DevOps

```
Timeline: Weeks 1-4
├─ Dev 1: Epic 03 Phase 1 (03.1-03.12)
├─ Dev 2: Epic 05 Phase 0 (05.0-05.7) [if available]
└─ Parallel: Test integration points (PO → GRN)

Timeline: Weeks 5-8
├─ Dev 1: Epic 03 Phase 1 completion (03.15-03.17)
├─ Dev 2: Epic 04 Phase 0 (04.1-04.5)
└─ Parallel: Integration testing (WO → Consumption)

Timeline: Week 9+
├─ Dev 1: Epic 03 Phase 2 (if MRP needed)
├─ Dev 2: Epic 04 Phase 1 (04.6-04.8) [after Epic 05.1]
└─ Parallel: Production readiness testing
```

---

## Rollback & Rollforward Plan

### If Epic 01 Incomplete

**Blocker Severity:** CRITICAL
**Workaround:** None - cannot proceed
**Resolution:** Complete Epic 01 first

### If Epic 02 Incomplete

**Blocker Severity:** CRITICAL
**Workaround:** Create test BOM manually for 03.10 testing
**Resolution:** Complete Epic 02 Product + BOM before WO testing

### If Epic 05 Delays

**Blocker Severity:** MEDIUM
**Workaround:** Defer 03.9b, 03.11b, 03.13, 03.14 to Phase 2
**Resolution:** Phase 1 still complete without LP features

---

## Validation Checklist

- [ ] All hard dependencies verified complete
- [ ] Integration points identified and documented
- [ ] Test scenarios created for each integration
- [ ] Rollback plan documented
- [ ] Resource allocation confirmed
- [ ] Parallel work plan signed off by PMs

---

**Document Version:** 1.0
**Last Updated:** 2025-12-16
**Created By:** TECH-WRITER
**Status:** APPROVED FOR COORDINATION
