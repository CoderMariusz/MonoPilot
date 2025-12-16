# Epic 05 Warehouse - MVP Dependency Analysis

**Date:** 2025-12-16
**Status:** CRITICAL PATH IDENTIFIED
**Conclusion:** Epic 05 Phase 0 (LP Foundation) is THE CRITICAL BLOCKER for Epic 04 Production Phase 1. Minimum LP infrastructure must ship FIRST.

---

## Executive Summary

Analysis of Epic 05 (Warehouse Module) reveals that **8 stories in Phase 0** are the **CRITICAL PATH** for unblocking Epic 04 Production Phase 1 (10 blocked stories, 18-24 days of work).

**Key Finding:** Epic 04 Production CANNOT deliver material consumption or output registration without the License Plate (LP) infrastructure from Epic 05. This makes Epic 05 Phase 0 the highest priority work in the entire system.

**Recommendation:** Implement **LP-First Strategy** - Phase 0 delivers ONLY what Epic 04 needs, deferring GRN, ASN, Scanner, and advanced features to later phases.

---

## LP Critical Path Analysis

### What Epic 04 Production Phase 1 Absolutely Needs

| Epic 04 Story | Minimum Warehouse Requirement | Why Required |
|---------------|-------------------------------|--------------|
| 04.6a Consumption Desktop | `license_plates` table | Read LP qty, location |
| 04.6a Consumption Desktop | LP status='available' check | Validate consumable |
| 04.6a Consumption Desktop | LP qty decrement service | Reduce LP on consume |
| 04.6b Consumption Scanner | LP barcode lookup | Scan LP in scanner |
| 04.6c 1:1 Consumption | LP full qty validation | Consume entire LP |
| 04.6d Consumption Correction | LP qty increment service | Reverse consumption |
| 04.6e Over-Consumption | LP qty comparison | Validate against requirement |
| 04.7a Output Desktop | LP creation service | Create finished goods LP |
| 04.7b Output Scanner | LP creation + label | Create LP, print label |
| 04.7c By-Product | LP creation service | Create by-product LP |
| 04.7d Multiple Outputs | Multi-LP creation | Create multiple LPs per WO |
| 04.8 Material Reservations | `lp_reservations` table | Reserve LP for WO |
| ALL | `lp_genealogy` table | Track consumed->output links |
| ALL | FIFO/FEFO query | Pick oldest/soonest expiry |

### Minimum LP Tables Needed

```sql
-- 1. license_plates (CRITICAL)
CREATE TABLE license_plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'available',  -- available, reserved, consumed, blocked
  qa_status TEXT NOT NULL DEFAULT 'pending', -- pending, passed, failed, quarantine
  batch_number TEXT,
  expiry_date DATE,
  wo_id UUID,                                -- WO that created this LP (output)
  consumed_by_wo_id UUID,                    -- WO that consumed this LP
  source TEXT NOT NULL DEFAULT 'manual',     -- manual, receipt, production
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, lp_number)
);

-- 2. lp_genealogy (CRITICAL)
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID NOT NULL REFERENCES license_plates(id),
  operation_type TEXT NOT NULL,              -- split, merge, consume, output
  quantity DECIMAL(15,4) NOT NULL,
  operation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wo_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. lp_reservations (CRITICAL)
CREATE TABLE lp_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  wo_id UUID REFERENCES work_orders(id),
  reserved_qty DECIMAL(15,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',     -- active, released, consumed
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  reserved_by UUID REFERENCES users(id)
);

-- 4. warehouse_settings (Foundation)
CREATE TABLE warehouse_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  auto_generate_lp_number BOOLEAN DEFAULT true,
  lp_number_prefix TEXT DEFAULT 'LP',
  lp_number_sequence_length INTEGER DEFAULT 8,
  enable_fifo BOOLEAN DEFAULT true,
  enable_fefo BOOLEAN DEFAULT false,
  enable_split_merge BOOLEAN DEFAULT true,
  require_qa_on_receipt BOOLEAN DEFAULT true,
  default_qa_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Minimum LP Services Needed

```typescript
// 1. license-plate-service.ts (CRITICAL)

export class LicensePlateService {
  // CREATE - For production output
  async createLP(data: CreateLPDTO): Promise<LicensePlate> {
    // Generate LP number, create record
  }

  // READ - For consumption lookup
  async getLPById(lpId: string): Promise<LicensePlate> {
    // Return LP with product, location
  }

  async getLPByNumber(orgId: string, lpNumber: string): Promise<LicensePlate> {
    // Barcode lookup
  }

  async getAvailableLPsForProduct(
    orgId: string,
    productId: string,
    options: { fifo?: boolean; fefo?: boolean }
  ): Promise<LicensePlate[]> {
    // FIFO/FEFO pick suggestions
  }

  // UPDATE - For consumption
  async consumeLP(lpId: string, qty: number, woId: string): Promise<void> {
    // Decrement qty, record consumed_by_wo_id
    // If qty = 0, set status = 'consumed'
  }

  async updateQty(lpId: string, newQty: number): Promise<void> {
    // For corrections
  }

  // STATUS
  async blockLP(lpId: string, reason: string): Promise<void> {
    // Set status = 'blocked'
  }

  async unblockLP(lpId: string): Promise<void> {
    // Set status = 'available'
  }

  async updateQAStatus(lpId: string, qaStatus: QAStatus): Promise<void> {
    // For QA workflow
  }
}

// 2. lp-genealogy-service.ts (CRITICAL)

export class LPGenealogyService {
  async createLink(
    parentLPId: string,
    childLPId: string,
    operationType: 'split' | 'merge' | 'consume' | 'output',
    qty: number,
    woId?: string
  ): Promise<LPGenealogy> {
    // Record parent -> child relationship
  }

  async getParentLPs(lpId: string): Promise<LPGenealogy[]> {
    // For backward traceability
  }

  async getChildLPs(lpId: string): Promise<LPGenealogy[]> {
    // For forward traceability
  }

  async getGenealogyTree(lpId: string, maxDepth: number = 10): Promise<GenealogyTree> {
    // Full tree for visualization
  }
}

// 3. lp-reservation-service.ts (CRITICAL)

export class LPReservationService {
  async reserveLP(lpId: string, woId: string, qty: number): Promise<LPReservation> {
    // Create reservation, update LP status
  }

  async releaseReservation(reservationId: string): Promise<void> {
    // Release reservation, update LP status
  }

  async consumeReservation(reservationId: string): Promise<void> {
    // Mark reservation consumed
  }

  async getReservationsForWO(woId: string): Promise<LPReservation[]> {
    // Get all reservations for a WO
  }
}

// 4. fifo-fefo-service.ts (CRITICAL)

export class FifoFefoService {
  async suggestLPsForPick(
    orgId: string,
    productId: string,
    requiredQty: number,
    options: { fifo?: boolean; fefo?: boolean }
  ): Promise<LPPickSuggestion[]> {
    // Return ordered LPs for consumption
    // FEFO: ORDER BY expiry_date ASC, created_at ASC
    // FIFO: ORDER BY created_at ASC
  }
}
```

### Minimum LP UI Needed

```
apps/frontend/app/(authenticated)/warehouse/
  license-plates/
    page.tsx                    -- LP list (search, filter, pagination)
    [id]/page.tsx              -- LP detail (read-only)
    components/
      LPTable.tsx              -- Data table with actions
      LPFilters.tsx            -- Status, QA, location filters
      LPDetailPanel.tsx        -- Side panel for LP detail
      LPSearchInput.tsx        -- Barcode/number search
      LPStatusBadge.tsx        -- Status indicator
```

**What Can Be Deferred:**
- Split/Merge UI (Phase 0, but lower priority)
- Genealogy tree visualization (Phase 3)
- Full receiving workflow UI (Phase 1)
- Scanner UI (Phase 2)

---

## What Can Be Deferred

### Phase 1 (Defer to After Epic 04 Unblocked)

| Feature | PRD FRs | Why Deferrable |
|---------|---------|----------------|
| GRN from PO | WH-FR-003 | Epic 04 creates LPs via output, not receipt |
| GRN from TO | WH-FR-004 | Transfer receiving not needed for production |
| ASN Processing | WH-FR-015 | Pre-notification is nice-to-have |
| Stock Moves audit | WH-FR-005 | Production tracks via genealogy |
| Label Printing | WH-FR-014 | Epic 04 can defer label printing |
| Dashboard | WH-FR-030 | Aggregation can wait |

### Phase 2 (Defer Further)

| Feature | PRD FRs | Why Deferrable |
|---------|---------|----------------|
| Scanner Receive | WH-FR-011 | Desktop receiving works first |
| Scanner Move | WH-FR-012 | Desktop moves work first |
| Scanner Putaway | WH-FR-013 | Nice-to-have for now |
| Scanner Pick | WH-FR-019, 020 | FIFO/FEFO query exists, scanner is UX |

### Phase 3 (Defer to Enterprise)

| Feature | PRD FRs | Why Deferrable |
|---------|---------|----------------|
| GS1 GTIN | WH-FR-017 | Internal barcodes work |
| GS1 SSCC | WH-FR-018 | Pallet codes not critical |
| Pallet Management | WH-FR-016 | LP-level tracking sufficient |
| Catch Weight | WH-FR-021 | Standard weight works |
| Cycle Counts | WH-FR-023 | Manual adjustments work |
| Zone Management | WH-FR-026 | Single location type works |

---

## Story Breakdown Strategy

### Phase 0: LP Foundation ONLY (CRITICAL PATH)

**Goal:** Unblock Epic 04 Production Phase 1
**Stories:** 8
**Days:** 8-12

| Story | Name | Complexity | Days | CRITICAL |
|-------|------|------------|------|----------|
| 05.0 | Warehouse Settings | M | 2 | Foundation |
| **05.1** | **LP Table + Basic Service** | **L** | **3** | **YES** |
| **05.2** | **LP Genealogy** | **M** | **2** | **YES** |
| **05.3** | **LP Reservations** | **M** | **2** | **YES** |
| **05.4** | **FIFO/FEFO Pick Suggestions** | **M** | **2** | **YES** |
| 05.5 | LP CRUD (Desktop) | M | 2 | UI |
| 05.6 | LP Split/Merge | M | 2 | Partial consume |
| 05.7 | QA Status Management | M | 1 | Consumption validation |

**Day 4 Milestone:** Stories 05.0, 05.1 complete = Epic 04 can start consumption work
**Day 8 Milestone:** Stories 05.2, 05.3, 05.4 complete = Epic 04 has full LP infrastructure
**Day 12 Milestone:** Phase 0 complete = Epic 04 Production Phase 1 fully unblocked

### Phase 1: GRN/ASN Receiving

**Goal:** Complete receiving workflows
**Stories:** 8
**Days:** 10-14

| Story | Name | Complexity | Days |
|-------|------|------------|------|
| 05.8 | GRN from PO | L | 3 |
| 05.9 | GRN from TO | M | 2 |
| 05.10 | ASN Management | M | 2 |
| 05.11 | Stock Moves | M | 2 |
| 05.12 | Batch/Expiry Tracking | M | 2 |
| 05.13 | Over-Receipt Control | S | 1 |
| 05.14 | Label Printing (ZPL) | M | 2 |
| 05.15 | Warehouse Dashboard | M | 2 |

### Phase 2: Advanced (Pallets, Scanner, GS1)

Deferred to future sprints.

---

## MVP Scope Definition

### Absolute Minimum to Unblock Epic 04

| Component | Minimum Scope | What Epic 04 Needs |
|-----------|---------------|-------------------|
| `license_plates` table | All columns from architecture | LP lookup, qty tracking |
| LP Service | create, read, consume, updateQty | Output registration, consumption |
| `lp_genealogy` table | parent/child, operation type | Traceability |
| Genealogy Service | createLink, getParents, getChildren | Forward/backward trace |
| `lp_reservations` table | lp_id, wo_id, qty, status | Material allocation |
| Reservation Service | reserve, release, consume | WO material management |
| FIFO/FEFO Query | ORDER BY created_at/expiry_date | Consumption ordering |
| LP Desktop List | Search, filter, view | Manual management |

### What Epic 04 Production Phase 1 Does NOT Need

| Feature | Why Not Needed Yet |
|---------|-------------------|
| GRN/ASN | Production creates LPs via output, not receipt |
| Scanner workflows | Desktop consumption works first |
| Pallet management | LP-level tracking sufficient |
| GS1 barcodes | Internal LP numbers work |
| Cycle counts | Manual adjustments work |
| Expiry alerts | Production checks LP.expiry_date directly |
| Label printing | Can print manually or defer |
| Location capacity | Production doesn't check capacity |
| Zone management | Single location type works |

---

## Dependency Map

### Epic 04 Production Stories Waiting

```
+-----------------------------------------------------------------------------+
|                      EPIC 04 PRODUCTION BLOCKED STORIES                      |
+-----------------------------------------------------------------------------+
| Story   | Name                    | Waiting For                             |
|---------|-------------------------|------------------------------------------|
| 04.6a   | Consumption Desktop     | license_plates table, consume service    |
| 04.6b   | Consumption Scanner     | LP barcode lookup                        |
| 04.6c   | 1:1 Consumption         | LP full qty validation                   |
| 04.6d   | Consumption Correction  | LP qty increment                         |
| 04.6e   | Over-Consumption        | LP qty comparison                        |
| 04.7a   | Output Desktop          | LP creation service                      |
| 04.7b   | Output Scanner          | LP creation + label                      |
| 04.7c   | By-Product Registration | LP creation service                      |
| 04.7d   | Multiple Outputs        | Multi-LP creation                        |
| 04.8    | Material Reservations   | lp_reservations table                    |
+-----------------------------------------------------------------------------+
| TOTAL BLOCKED: 10 stories, 18-24 days of work                               |
+-----------------------------------------------------------------------------+
```

### What Unblocks Them First

```
Day 1-2:   05.0 Warehouse Settings
                |
Day 2-4:   05.1 LP Table + Basic Service
                |
                +----> Epic 04 can START stories 04.6a, 04.7a (consumption/output desktop)
                |
Day 4-6:   05.2 LP Genealogy
                |
                +----> Epic 04 traceability enabled
                |
Day 6-8:   05.3 LP Reservations
                |
                +----> Epic 04.8 Material Reservations can start
                |
Day 8-10:  05.4 FIFO/FEFO Pick Suggestions
                |
                +----> Epic 04 consumption ordering enabled
                |
Day 10-12: 05.5-05.7 (Desktop UI, Split/Merge, QA Status)
                |
                +----> Epic 04 Production Phase 1 FULLY UNBLOCKED
```

### Critical Sequence

```
05.0 (Settings) → 05.1 (LP Table) → 05.2 (Genealogy) → 05.3 (Reservations) → 05.4 (FIFO/FEFO)
     |                |                  |                  |                    |
     |                |                  |                  |                    v
     |                |                  |                  |         04.6a-e consumption
     |                |                  |                  v
     |                |                  |          04.8 reservations
     |                |                  v
     |                |           04.7a-d output traceability
     |                v
     |         04.6a, 04.7a basic consumption/output
     v
   All Epic 04 Phase 1 dependencies met
```

---

## Implementation Timeline

### Week 1: Phase 0 (Days 1-5)

| Day | Story | Deliverable | Epic 04 Impact |
|-----|-------|-------------|----------------|
| 1 | 05.0 | warehouse_settings table | Foundation ready |
| 2-3 | 05.1 | license_plates table + service | **04.6a, 04.7a CAN START** |
| 3-4 | 05.2 | lp_genealogy table + service | Traceability ready |
| 4-5 | 05.3 | lp_reservations table + service | **04.8 CAN START** |

### Week 2: Phase 0 Complete (Days 6-10)

| Day | Story | Deliverable | Epic 04 Impact |
|-----|-------|-------------|----------------|
| 6-7 | 05.4 | FIFO/FEFO service | Consumption ordering |
| 7-8 | 05.5 | LP desktop UI | Manual management |
| 8-9 | 05.6 | Split/Merge service | Partial consumption |
| 9-10 | 05.7 | QA status service | Consumption validation |

**End of Week 2: Epic 04 Production Phase 1 FULLY UNBLOCKED**

### Parallel Development

```
Week 1-2:  Epic 05 Phase 0 (LP Foundation)
           |
           |  Epic 04 Phase 0 (WO Lifecycle) - CAN RUN IN PARALLEL
           |
Week 2+:   Epic 04 Phase 1 (Consumption/Output) - STARTS AFTER DAY 4
           |
Week 3-4:  Epic 05 Phase 1 (GRN/ASN)
           |
Week 4-5:  Epic 05 Phase 2 (Scanner)
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Phase 0 takes longer than 10 days | HIGH | LOW | Focus only on LP Foundation, defer everything else |
| LP schema needs changes after Epic 04 starts | MEDIUM | MEDIUM | Review schema with Epic 04 stories before starting |
| Genealogy complexity underestimated | MEDIUM | LOW | Simple parent/child model, defer tree visualization |
| RLS policies incorrect | HIGH | LOW | Test multi-tenant isolation early |
| Performance issues with LP queries | MEDIUM | LOW | Add indexes early, test with 10K LPs |

---

## Conclusion

**Epic 05 Warehouse Phase 0 is THE CRITICAL PATH for the entire system.**

### Key Decisions:

1. **LP-First Strategy Approved**
   - Phase 0 delivers ONLY LP infrastructure
   - GRN, ASN, Scanner deferred to Phase 1+
   - Minimum viable LP to unblock Epic 04

2. **8-12 Day Phase 0 Timeline**
   - Day 4: 05.1 complete = Epic 04 can start consumption/output work
   - Day 10: Phase 0 complete = Epic 04 fully unblocked

3. **Parallel Development Enabled**
   - Epic 04 Phase 0 (WO lifecycle) runs in parallel
   - Epic 04 Phase 1 starts after Day 4
   - Epic 05 Phase 1+ starts after Phase 0

### Implementation Path:

```
TODAY
  |
  v
05.0 (Settings) → 05.1 (LP Table) → 05.2 (Genealogy)
  |                    |
  |                    +----> Epic 04.6a, 04.7a START
  |
  +---> 05.3 (Reservations) → 05.4 (FIFO/FEFO)
              |                    |
              +----> 04.8 START    +----> Consumption ordering
              |
              v
        05.5-05.7 (UI, Split/Merge, QA)
              |
              v
        EPIC 04 PRODUCTION PHASE 1 FULLY UNBLOCKED
              |
              v
        Epic 05 Phase 1 (GRN/ASN) continues
```

### Next Steps:

1. **Create Phase 0 stories (05.0-05.7)** - HIGHEST PRIORITY
2. **Begin Phase 0 development immediately**
3. **Start Epic 04 Phase 1 stories after Day 4**
4. **Track Phase 0 progress daily as critical path**

**Status: RED - This is the blocker. Start immediately.**

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial MVP dependency analysis with LP critical path | ARCHITECT-AGENT |
