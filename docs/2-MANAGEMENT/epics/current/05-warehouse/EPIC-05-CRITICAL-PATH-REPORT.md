# Epic 05 Warehouse Module - LP Critical Path Report

**Date:** 2025-12-16
**Report Type:** Critical Path Analysis & Story Breakdown
**Status:** 🔴 **CRITICAL BLOCKER - START IMMEDIATELY**
**Total Stories:** 40 (8 Critical + 32 Deferred)
**Epic 04 Blocked:** 10 stories (18-24 days of work)

---

## Executive Summary

Epic 05 Warehouse Module is **THE CRITICAL BLOCKER** preventing Epic 04 Production Phase 1 from proceeding. Without License Plates infrastructure, Epic 04 cannot implement material consumption, output registration, or genealogy tracking.

### Critical Discovery

**10 Epic 04 Production stories are BLOCKED waiting for Epic 05 License Plates:**
- 04.6a-e: Material Consumption (5 stories, 10-14 days)
- 04.7a-d: Output Registration (4 stories, 10-14 days)
- 04.8: Material Reservations (1 story, 5-7 days)

**TOTAL BLOCKED WORK:** 18-24 days of production functionality

### Resolution: LP-First Strategy

**Phase 0 (CRITICAL PATH):** 8 stories, 8-12 days
- Minimum LP infrastructure to unblock Epic 04
- License Plates table, genealogy, reservations
- FIFO/FEFO picking algorithms
- Basic LP CRUD services and UI

**Timeline to Unblock:**
- Day 4: Story 05.1 complete → Epic 04 can begin consumption/output work
- Day 12: Phase 0 complete → Epic 04 Phase 1 fully unblocked

---

## Story Inventory (40 Total)

### Phase 0: LP Foundation (8 Stories) - 🔴 CRITICAL BLOCKER

| Story | Name | Complexity | Days | Blocks |
|-------|------|------------|------|--------|
| **05.0** | Warehouse Settings | M | 2-3 | All Epic 05 |
| **05.1** | LP Table + CRUD | L | 3-4 | **Epic 04.6, 04.7** |
| **05.2** | LP Genealogy Tracking | L | 3-4 | Epic 04.7 (output) |
| **05.3** | LP Reservations (FIFO/FEFO) | L | 3-4 | Epic 04.8 |
| **05.4** | LP Status Management | M | 2-3 | Epic 04.6 |
| **05.5** | LP Search & Filters | M | 2-3 | Epic 04.6, 04.7 |
| **05.6** | LP Detail & History | S | 1-2 | Epic 04 (visibility) |
| **05.7** | Warehouse Dashboard | M | 2-3 | Reporting |

**Phase 0 Total:** 8-12 days (1 developer)

**What Phase 0 Unblocks:**
- ✅ Epic 04.6a-e: Material Consumption (can start Day 4)
- ✅ Epic 04.7a-d: Output Registration (can start Day 4)
- ✅ Epic 04.8: Material Reservations (can start Day 8)
- ✅ Epic 04 Phase 1 fully unblocked by Day 12

### Phase 1: Goods Receipt (8 Stories) - After Phase 0

| Story | Name | Complexity | Days | Priority |
|-------|------|------------|------|----------|
| **05.8** | ASN CRUD + Items | M | 3-4 | P1 |
| **05.9** | ASN Receive Workflow | M | 3-4 | P1 |
| **05.10** | GRN CRUD + Items | L | 4-5 | P1 |
| **05.11** | GRN from PO (Create LPs) | L | 4-5 | P1 |
| **05.12** | GRN from TO (Create LPs) | M | 3-4 | P1 |
| **05.13** | GRN from Production (Already handled in Epic 04) | S | 1-2 | P1 |
| **05.14** | LP Label Printing (ZPL) | M | 2-3 | P1 |
| **05.15** | Over-Receipt Handling | S | 1-2 | P1 |

**Phase 1 Total:** 10-14 days

### Phase 2: Scanner & Movements (8 Stories) - After Phase 1

| Story | Name | Complexity | Days | Priority |
|-------|------|------------|------|----------|
| **05.16** | Stock Moves CRUD | M | 3-4 | P2 |
| **05.17** | LP Split Workflow | M | 3-4 | P2 |
| **05.18** | LP Merge Workflow | M | 3-4 | P2 |
| **05.19** | Scanner Receive | L | 4-5 | P2 |
| **05.20** | Scanner Putaway | M | 3-4 | P2 |
| **05.21** | Scanner Move | M | 3-4 | P2 |
| **05.22** | Putaway Suggestions | M | 2-3 | P2 |
| **05.23** | Scanner Offline Mode | L | 5-7 | P2 |

**Phase 2 Total:** 10-14 days

### Phase 3: Advanced Features (10 Stories) - After Phase 2

| Story | Name | Complexity | Days | Priority |
|-------|------|------------|------|----------|
| **05.24** | Pallets CRUD | M | 3-4 | P3 |
| **05.25** | Pallet LP Assignment | M | 2-3 | P3 |
| **05.26** | Pallet Labels (SSCC-18) | M | 2-3 | P3 |
| **05.27** | Catch Weight Handling | M | 3-4 | P3 |
| **05.28** | GS1 Barcode Integration | L | 4-5 | P3 |
| **05.29** | LP Block/Unblock | S | 1-2 | P3 |
| **05.30** | LP QA Status Workflow | M | 2-3 | P3 |
| **05.31** | Batch Tracking Advanced | M | 2-3 | P3 |
| **05.32** | Expiry Tracking Advanced | M | 2-3 | P3 |
| **05.33** | Location Zones & Capacity | M | 3-4 | P3 |

**Phase 3 Total:** 10-14 days

### Phase 4: Inventory & Reports (6 Stories) - After Phase 3

| Story | Name | Complexity | Days | Priority |
|-------|------|------------|------|----------|
| **05.34** | Inventory Browser & Summaries | M | 3-4 | P4 |
| **05.35** | Inventory Aging Report | M | 2-3 | P4 |
| **05.36** | Expiring Inventory Alert | M | 2-3 | P4 |
| **05.37** | Cycle Counts CRUD | M | 3-4 | P4 |
| **05.38** | Cycle Count Execution | M | 3-4 | P4 |
| **05.39** | Variance Approval & Adjustments | M | 2-3 | P4 |

**Phase 4 Total:** 8-10 days

---

## Effort Summary

### Critical Path (Phase 0 - 8 Stories)

| Priority | Stories | Days (1 dev) | Unblocks |
|----------|---------|--------------|----------|
| **P0 (CRITICAL)** | 8 | 8-12 | Epic 04 Phase 1 (10 stories) |

### Complete Epic (All 40 Stories)

| Phase | Stories | Days (1 dev) | Dependencies |
|-------|---------|--------------|--------------|
| **Phase 0** | 8 | 8-12 | Epic 03 (WOs), Epic 01 (Settings) |
| **Phase 1** | 8 | 10-14 | Phase 0 complete, Epic 03 (POs/TOs) |
| **Phase 2** | 8 | 10-14 | Phase 1 complete |
| **Phase 3** | 10 | 10-14 | Phase 2 complete |
| **Phase 4** | 6 | 8-10 | Phase 3 complete |
| **Total** | **40** | **46-64 days** | Sequential phases |

**Parallel Development Opportunity:**
- Epic 05 Phase 0 (8-12 days) + Epic 04 Phase 0 (10-14 days) = Can run in parallel
- Epic 05 Phase 1 (10-14 days) + Epic 04 Phase 1 (18-24 days) = Can overlap after Day 4

---

## LP Critical Path Analysis

### Minimum LP Infrastructure (Phase 0)

#### Database Tables Required

```sql
-- CRITICAL TABLE #1: license_plates
CREATE TABLE license_plates (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  lp_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'available', -- available, reserved, consumed
  qa_status TEXT NOT NULL DEFAULT 'pending', -- pending, passed, failed
  batch_number TEXT,
  expiry_date DATE,
  manufacture_date DATE,
  source TEXT NOT NULL, -- receipt, production, adjustment
  wo_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CRITICAL TABLE #2: lp_genealogy
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID NOT NULL REFERENCES license_plates(id),
  operation_type TEXT NOT NULL, -- consume, output, split, merge
  quantity DECIMAL(15,4) NOT NULL,
  wo_id UUID REFERENCES work_orders(id),
  operation_date TIMESTAMPTZ DEFAULT now()
);

-- CRITICAL TABLE #3: lp_reservations
CREATE TABLE lp_reservations (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  wo_id UUID REFERENCES work_orders(id),
  reserved_qty DECIMAL(15,4) NOT NULL,
  status TEXT DEFAULT 'active', -- active, released, consumed
  reserved_at TIMESTAMPTZ DEFAULT now()
);

-- CRITICAL TABLE #4: warehouse_settings
CREATE TABLE warehouse_settings (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  enable_fifo BOOLEAN DEFAULT true,
  enable_fefo BOOLEAN DEFAULT false,
  enable_batch_tracking BOOLEAN DEFAULT true,
  enable_expiry_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Services Required

```typescript
// CRITICAL SERVICE #1: license-plate-service.ts
export class LicensePlateService {
  // CRUD
  async createLP(data: CreateLPInput): Promise<LicensePlate>
  async getLP(id: string): Promise<LicensePlate | null>
  async listLPs(filters: LPFilters): Promise<LicensePlate[]>
  async updateLP(id: string, data: UpdateLPInput): Promise<LicensePlate>

  // Consumption (Epic 04.6)
  async consumeLP(lpId: string, consumeQty: number, woId: string): Promise<void>

  // Output (Epic 04.7)
  async createOutputLP(data: CreateOutputLPInput): Promise<LicensePlate>

  // Status management
  async updateStatus(lpId: string, status: LPStatus): Promise<void>
}

// CRITICAL SERVICE #2: lp-genealogy-service.ts
export class LPGenealogyService {
  async linkConsumption(parentLpId: string, childLpId: string, woId: string, qty: number): Promise<void>
  async linkOutput(consumedLpIds: string[], outputLpId: string, woId: string): Promise<void>
  async getGenealogyTree(lpId: string): Promise<GenealogyTree>
}

// CRITICAL SERVICE #3: lp-reservation-service.ts
export class LPReservationService {
  // FIFO/FEFO picking
  async findAvailableLPs(productId: string, warehouseId: string, strategy: 'FIFO' | 'FEFO'): Promise<LicensePlate[]>

  // Reservation (Epic 04.8)
  async reserveLPs(woId: string, materialId: string, qty: number): Promise<LPReservation[]>
  async releaseReservation(reservationId: string): Promise<void>
}
```

#### UI Components Required (Desktop Only for Phase 0)

```
apps/frontend/app/(authenticated)/warehouse/license-plates/
├── page.tsx                    -- LP list with filters
├── [id]/page.tsx               -- LP detail + history
└── components/
    ├── LPTable.tsx             -- DataTable with LP rows
    ├── LPFilters.tsx           -- Product, location, status filters
    ├── LPDetail.tsx            -- LP card with all fields
    ├── LPStatusBadge.tsx       -- Visual status indicators
    └── LPMovementHistory.tsx   -- Movement audit trail
```

**Deferred to Phase 1+:**
- GRN creation flow
- ASN workflows
- Scanner UI
- Pallets
- Label printing
- Split/merge

---

## Dependency Graph

```
                    ┌──────────────────┐
                    │ Epic 03 Planning │
                    │ (Work Orders)    │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼────────────────────┐
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Epic 04 Phase 0 │ │ Epic 05 Phase 0 │ │ Epic 01         │
│ (WO Lifecycle)  │ │ (LP Foundation) │ │ (Settings)      │
│ 7 stories       │ │ 8 stories       │ │                 │
│ 10-14 days      │ │ 8-12 days       │ │                 │
└─────────────────┘ └────────┬────────┘ └─────────────────┘
         │                   │
         │            ┌──────▼─────────┐
         │            │ Day 4: 05.1    │
         │            │ LP Table Ready │
         │            └──────┬─────────┘
         │                   │
         └───────────────────┼────────────────────┐
                             │                    │
         ┌───────────────────▼──────────┐         │
         │ Epic 04 Phase 1 UNBLOCKED    │         │
         │ 10 stories (18-24 days)      │         │
         ├──────────────────────────────┤         │
         │ 04.6a-e: Consumption (5)     │←────────┘
         │ 04.7a-d: Output (4)          │
         │ 04.8: Reservations (1)       │
         └──────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Epic 05 Phase 1+ │
                    │ (GRN, Scanner)   │
                    │ 32 stories       │
                    └──────────────────┘
```

---

## Critical Path Timeline

### Recommended Parallel Execution

```
Week 1-2: PARALLEL START
├─ Epic 05 Phase 0: Stories 05.0, 05.1, 05.2, 05.3 (LP Foundation)
└─ Epic 04 Phase 0: Stories 04.1-04.5 (WO Lifecycle)

Day 4 (Epic 05 Story 05.1 Complete):
├─ Epic 04 Phase 1 CAN START: 04.6a, 04.7a (Consumption/Output Desktop)
└─ Epic 05 Phase 0 CONTINUES: 05.4-05.7

Week 3 (Epic 05 Phase 0 Complete):
├─ Epic 04 Phase 1 FULLY UNBLOCKED: All 10 stories can proceed
└─ Epic 05 Phase 1 START: 05.8-05.15 (GRN, ASN)

Week 4-6:
├─ Epic 04 Phase 1 COMPLETES: Full production with LP tracking
└─ Epic 05 Phase 1 COMPLETES: Goods receipt workflows

Week 7+:
└─ Epic 05 Phase 2-4: Scanner, Advanced, Inventory (32 stories)
```

**Accelerated Timeline (2 Developers):**
- Dev 1: Epic 05 Phase 0 (8-12 days → 4-6 days)
- Dev 2: Epic 04 Phase 0 (10-14 days → 5-7 days)
- Day 4-6: Both devs on Epic 04 Phase 1 (18-24 days → 9-12 days)
- Week 4+: Both devs on Epic 05 Phase 1+ (32 stories)

**Total Time Savings:** 4-6 weeks with 2 developers vs sequential

---

## PRD Coverage (Phase 0 Only)

### Functional Requirements Mapped

| FR ID | Requirement | Stories | Coverage |
|-------|-------------|---------|----------|
| FR-WH-001 | LP CRUD | 05.1 | ✅ 100% |
| FR-WH-002 | LP Status Management | 05.4 | ✅ 100% |
| FR-WH-003 | LP Search & Filters | 05.5 | ✅ 100% |
| FR-WH-004 | LP Detail & History | 05.6 | ✅ 100% |
| FR-WH-005 | LP Genealogy | 05.2 | ✅ 100% |
| FR-WH-006 | LP Reservations | 05.3 | ✅ 100% |
| FR-WH-007 | FIFO/FEFO | 05.3 | ✅ 100% |
| FR-WH-008 | Warehouse Settings | 05.0 | ✅ 100% |
| FR-WH-009 | Warehouse Dashboard | 05.7 | ✅ 100% |

**Phase 0 Coverage:** 9/50 FRs (18%) - **By Design (LP Foundation Only)**

**Deferred to Phase 1:** ASN, GRN, Receiving (10 FRs)
**Deferred to Phase 2:** Scanner, Movements, Split/Merge (12 FRs)
**Deferred to Phase 3:** Pallets, GS1, Catch Weight, QA (10 FRs)
**Deferred to Phase 4:** Inventory, Cycle Counts, Reports (9 FRs)

---

## Implementation Roadmap

### Sprint 1-2: Phase 0 LP Foundation (8-12 days) - 🔴 START IMMEDIATELY

**Week 1:**
- Day 1-2: 05.0 Warehouse Settings (M, 2-3 days)
- Day 3-6: 05.1 LP Table + CRUD (L, 3-4 days)
  - **MILESTONE:** Day 4 = Epic 04 can start consumption/output

**Week 2:**
- Day 7-10: 05.2 LP Genealogy (L, 3-4 days)
- Day 11-14: 05.3 LP Reservations + FIFO/FEFO (L, 3-4 days)
  - **MILESTONE:** Day 12 = Epic 04 Phase 1 fully unblocked

**Week 2-3 (Parallel):**
- 05.4 LP Status Management (M, 2-3 days)
- 05.5 LP Search & Filters (M, 2-3 days)
- 05.6 LP Detail & History (S, 1-2 days)
- 05.7 Warehouse Dashboard (M, 2-3 days)

**Phase 0 Deliverable:** Complete LP infrastructure for Epic 04 Production

### Sprint 3-4: Phase 1 Goods Receipt (10-14 days)

**Implement ASN/GRN workflows:**
- 05.8-05.9: ASN (6-8 days)
- 05.10-05.13: GRN from PO/TO/Production (8-12 days)
- 05.14-05.15: Label printing, over-receipt (3-5 days)

**Phase 1 Deliverable:** Complete goods receipt and LP creation

### Sprint 5+: Phase 2-4 (32 stories, 28-38 days)

**Implement advanced features:**
- Phase 2: Scanner workflows (10-14 days)
- Phase 3: Pallets, GS1, advanced tracking (10-14 days)
- Phase 4: Inventory reports, cycle counts (8-10 days)

---

## Critical Findings

### 1. Epic 05 is THE Critical Path ⚠️

**Impact:**
- 10 Epic 04 stories BLOCKED (36% of Epic 04 functionality)
- 18-24 days of production work waiting
- Cannot implement material consumption or output registration
- Cannot track genealogy or traceability

**Resolution:**
- START Epic 05 Phase 0 IMMEDIATELY (highest priority)
- Parallel execution with Epic 04 Phase 0
- Day 4 milestone unlocks Epic 04 consumption/output

### 2. LP-First Strategy is Optimal ✅

**Phase 0 (8 stories, 8-12 days):**
- Provides MINIMUM infrastructure to unblock Epic 04
- Desktop-only UI (no scanner)
- No GRN/ASN workflows (direct LP CRUD for testing)
- FIFO/FEFO algorithms for reservations

**Benefits:**
- Fastest unblock time (12 days vs 30+ days for full warehouse)
- Early value delivery
- Parallel development with Epic 04
- Testable by Epic 04 team

### 3. Parallel Development Feasible ✅

**Week 1-2:**
- Epic 05 Phase 0 + Epic 04 Phase 0 = No conflicts
- Different tables, different services, different UI

**Week 3+:**
- Epic 04 Phase 1 + Epic 05 Phase 1 = Minor overlaps
- Both use LP table (read-only for Epic 04)
- Can run in parallel with coordination

### 4. Two-Developer Acceleration Possible ✅

**Timeline with 2 Devs:**
- Week 1: Epic 05 Phase 0 (50% each)
- Week 2-3: Epic 04 Phase 1 (both devs)
- Week 4+: Epic 05 Phase 1+ (both devs)

**Time Savings:** 4-6 weeks faster than sequential

### 5. LP CRUD is Sufficient for Phase 0 ✅

**What Epic 04 Needs:**
- `license_plates` table ✅
- LP.quantity (consume/output) ✅
- LP.status (available/reserved/consumed) ✅
- `lp_genealogy` (parent-child links) ✅
- FIFO/FEFO query for reservations ✅

**What Epic 04 Does NOT Need (Yet):**
- GRN workflows ❌ (can create test LPs directly)
- Scanner UI ❌ (desktop only)
- Pallets ❌
- Label printing ❌
- Cycle counts ❌

---

## Recommendations

### Immediate Actions (Day 1)

1. ✅ **APPROVE Epic 05 Phase 0 (LP-First Strategy)**
   - 8 stories, 8-12 days
   - Unblocks Epic 04 Phase 1 by Day 12
   - Highest ROI (unlocks 18-24 days of work)

2. ✅ **Assign to Dev Team Immediately**
   - Dev 1: Epic 05 Phase 0 (start with 05.0, 05.1)
   - Dev 2: Epic 04 Phase 0 (if available)
   - Use Opus for 05.1, 05.2, 05.3 (complex LP logic)
   - Use Sonnet for others (standard CRUD)

3. ⚠️ **Escalate to Product Owner**
   - Present Epic 05 as CRITICAL BLOCKER
   - Get priority approval for immediate start
   - Communicate Epic 04 dependency

### Short-Term (Week 1-2)

4. ✅ **Day 4 Milestone Coordination**
   - Epic 05 Story 05.1 complete
   - Epic 04 team notified
   - Integration testing: Create test LPs for consumption

5. ✅ **Day 12 Milestone Coordination**
   - Epic 05 Phase 0 complete
   - Epic 04 Phase 1 fully unblocked
   - Begin parallel development (Epic 04 Phase 1 + Epic 05 Phase 1)

6. 📋 **Create Full Phase 0 Stories**
   - Expand templates for 05.0-05.7
   - Add detailed ACs, API specs, DB schemas
   - Prepare for dev handoff

### Mid-Term (Week 3-4)

7. ✅ **Epic 04 Phase 1 Integration Testing**
   - Consumption workflows with real LPs
   - Output registration creating new LPs
   - Genealogy linking validated

8. ✅ **Epic 05 Phase 1 Planning**
   - Create full stories for GRN/ASN (05.8-05.15)
   - Prepare for goods receipt workflows
   - Design scanner UI

### Long-Term (Week 5+)

9. ✅ **Epic 05 Phase 2-4 Execution**
   - Scanner workflows (Phase 2)
   - Pallets, GS1, advanced (Phase 3)
   - Inventory, cycle counts (Phase 4)

10. ✅ **Epic 06-07 Preparation**
    - Quality module depends on LP QA status
    - Shipping module depends on LP picking
    - Plan integration points

---

## Conclusion

**Epic 05 Warehouse Module is THE CRITICAL BLOCKER for Epic 04 Production.**

### What We Have ✅
- Complete LP-First strategy (40 stories in 5 phases)
- Phase 0 roadmap (8 stories, 8-12 days)
- Clear unblock timeline (Day 4 partial, Day 12 complete)
- Parallel development plan

### What We Need ⚠️
- **IMMEDIATE START on Phase 0** (highest priority)
- Product Owner approval for resource allocation
- Coordination with Epic 04 team
- Full story creation for Phase 0 (8 stories)

### Critical Timeline 🎯

**Day 1:** START Epic 05 Phase 0
**Day 4:** Unblock Epic 04 consumption/output (partial)
**Day 12:** Unblock Epic 04 Phase 1 completely
**Week 4:** Epic 04 Phase 1 + Epic 05 Phase 1 in parallel
**Week 8+:** Epic 05 Phase 2-4 (scanner, advanced)

**Decision Point:** ✅ **APPROVE & START IMMEDIATELY**

Epic 05 Phase 0 is not just important - it's **THE BLOCKER** for the entire production workflow.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial LP critical path analysis | ORCHESTRATOR |

---

**Report Status:** 🔴 **CRITICAL - START PHASE 0 IMMEDIATELY**
**Blocker Impact:** 10 Epic 04 stories (18-24 days) waiting
**Unblock Time:** 8-12 days (Phase 0)
