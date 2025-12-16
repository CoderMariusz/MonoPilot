# Epic 05 Warehouse: Phase Breakdown

**Date:** 2025-12-16
**Status:** FINAL - Story Organization Complete
**Total Stories:** 40 (20 full specs + 20 templates)
**Total Effort:** 46-64 days (1 dev), 23-32 days (2 devs)
**MVP Phase:** Phases 0-1 (16 stories, 18-26 days)

---

## Overview: 5 Phases

Epic 05 Warehouse spans 5 development phases, organized from foundation → operations → advanced.

| Phase | Name | Stories | Days | Status | MVP | Blocks |
|-------|------|---------|------|--------|-----|--------|
| **Phase 0** | LP Foundation | 8 | 8-12 | ✅ Ready | Yes | Epic 04, 03 |
| **Phase 1** | GRN/ASN | 8 | 10-14 | ✅ Ready | Yes | Phase 2 |
| **Phase 2** | Scanner & Moves | 8 | 10-14 | ✅ Ready | No | Phase 3 |
| **Phase 3** | Pallets & GS1 | 10 | 10-14 | 📋 Template | No | Phase 4 |
| **Phase 4** | Inventory & Reports | 6 | 8-10 | 📋 Template | No | None |
| **TOTAL** | | **40** | **46-64** | Mixed | | |

---

## Phase 0: LP Foundation (8 stories) ✅ READY - START NOW

**Duration:** 8-12 days (1 developer)
**Timeline:** Week 1-2 (Days 1-12)
**Status:** Full specifications complete
**Complexity:** Medium (M, M, M, S, S, S, S, S)
**Priority:** CRITICAL - Blocks 14 downstream stories

### Stories

| ID | Name | Days | Complex | Status |
|----|------|------|---------|--------|
| **05.0** | Warehouse Settings | 2-3 | S | ✅ Full Spec |
| **05.1** | LP Table + CRUD | 3-4 | M | ✅ Full Spec |
| **05.2** | LP Genealogy | 3-4 | M | ✅ Full Spec |
| **05.3** | LP Reservations + FIFO/FEFO | 3-4 | M | ✅ Full Spec |
| **05.4** | LP Status Management | 2-3 | S | ✅ Full Spec |
| **05.5** | LP Search & Filters | 2-3 | S | ✅ Full Spec |
| **05.6** | LP Detail & History | 2-3 | S | ✅ Full Spec |
| **05.7** | Warehouse Dashboard | 2-3 | S | ✅ Full Spec |

### What Gets Built

**Core Infrastructure:**
- License Plate (LP) table with all required fields
- CRUD operations (create, read, update, list)
- Genealogy tracking (parent-child relationships)
- Reservation system with FIFO/FEFO algorithms
- Status management (state machine)

**User-Facing Features:**
- LP search with advanced filters
- LP detail page with full history
- Warehouse dashboard with KPIs
- Settings for LP numbering + strategy

### Dependencies

**Required Before This Phase:**
- Epic 01.1: Organization + RLS (for org_id enforcement)
- Epic 01.8: Warehouses CRUD (for warehouse_id references)
- Epic 01.9: Locations CRUD (for location_id references)
- Epic 02.1: Products CRUD (for product_id references)

**Provides to Downstream:**
- LP infrastructure for Epic 04 Phase 1 (consumption/output)
- LP references for Epic 03 deferred (WO reservations, TO LP selection)
- LP QA status for Epic 06 Phase 1 (quality holds)

### Critical Milestones

**Day 4 (Story 05.1 Complete):**
- LP Table fully operational
- Unblocks: Epic 04.6a, 04.7a (desktop consumption/output)
- Partial production flow working

**Day 12 (Phase 0 Complete):**
- All Phase 0 stories merged
- Unblocks: All Epic 04 Phase 1 (10 stories)
- Unblocks: All Epic 03 deferred (4 stories)
- Full production-to-warehouse integration enabled

### Key Implementation Details

**Database Schema (LP Foundation):**
```
license_plates:
  - id (UUID)
  - org_id (UUID) - multi-tenancy
  - product_id (UUID)
  - qty (decimal)
  - uom (string)
  - status (enum: available, reserved, consumed, blocked, expired)
  - source (enum: receipt, production, split, merge)
  - receipt_date (timestamp)
  - expiry_date (timestamp)
  - location_id (UUID)
  - supplier_id (UUID) - if from receipt
  - wo_id (UUID) - if from production
  - created_at, updated_at

lp_genealogy:
  - id (UUID)
  - org_id (UUID)
  - parent_lp_id (UUID)
  - child_lp_id (UUID)
  - qty (decimal)
  - reason (enum: split, merge, output, consumption)
  - created_at

lp_reservations:
  - id (UUID)
  - org_id (UUID)
  - lp_id (UUID)
  - wo_id (UUID)
  - qty_reserved (decimal)
  - created_at
```

**RLS Policies (CRITICAL):**
- All LP queries must include `AND org_id = current_org_id`
- Prevent cross-org data leakage
- Row-level security on every query

---

## Phase 1: GRN/ASN & Receipt (8 stories) ✅ READY

**Duration:** 10-14 days (1 developer)
**Timeline:** Week 3-4 (after Phase 0 complete)
**Status:** Full specifications complete
**Complexity:** Medium-Large (M, M, L, L, S, M, M, S)
**Priority:** High - Enables receipt-to-warehouse flow

### Stories

| ID | Name | Days | Complex | Status |
|----|------|------|---------|--------|
| **05.8** | ASN CRUD + Items | 3-4 | M | ✅ Full Spec |
| **05.9** | ASN Receive Workflow | 2-3 | S | ✅ Full Spec |
| **05.10** | GRN CRUD + Items | 4-5 | L | ✅ Full Spec |
| **05.11** | GRN from PO (Create LPs) | 3-4 | M | ✅ Full Spec |
| **05.12** | GRN from TO | 2-3 | S | ✅ Full Spec |
| **05.13** | Over-Receipt Control | 2-3 | S | ✅ Full Spec |
| **05.14** | LP Label Printing (ZPL) | 2-3 | M | ✅ Full Spec |
| **05.15** | *Merged with 05.13* | - | - | - |

### What Gets Built

**Goods Receipt Operations:**
- Advance Shipping Notification (ASN) processing
- Goods Receipt Note (GRN) creation from PO or TO
- LP generation from received items
- Label printing for LPs (ZPL format)
- Over-receipt approval workflow

**User-Facing Features:**
- ASN receive confirmation (quantity/quality check)
- GRN detail page with line-by-line LP creation
- Print labels for newly created LPs
- Over-receipt approval queue

### Dependencies

**Required Before This Phase:**
- **Phase 0 (all 8 stories)** - LP infrastructure
- Epic 03.3: Purchase Orders (for GRN from PO)
- Epic 03.8: Transfer Orders (for GRN from TO)

**Provides to Downstream:**
- Inventory data for Phase 2 (stock movements)
- LPs created by receipt (for consumption in Epic 04)

### Potential Split Pattern

**Story 05.11: GRN from PO (can split):**
- 05.11a: Core (3-4 days) - Single LP per line, basic flow
- 05.11b: Advanced (1-2 days) - Batch splitting, over-receipt approval

**Story 05.14: LP Label Printing (can split):**
- 05.14a: LP Labels (2-3 days) - License plate labels
- 05.14b: Pallet Labels (1-2 days) - SSCC-18 pallet labels

### Key Implementation Details

**Master-Detail Pattern (GRN + Items):**
- GRN header: reference_number, po_id, supplier_id, receipt_date, status
- GRN items: product_id, qty_ordered, qty_received, lp_ids[], notes
- Transaction: Create LP for each item quantity

**ZPL Label Generation:**
```
^XA
^FO50,50
^BY2,2,100
^BC^FDG{LP_ID}^FS
^FO50,200
^A0N,25,25
^FD{PRODUCT_NAME}^FS
^FO50,250
^A0N,20,20
^FDQTY: {QTY} {UOM}^FS
^FO50,300
^FD{EXPIRY_DATE}^FS
^XZ
```

---

## Phase 2: Scanner & Stock Movements (8 stories) ⚠️ 4 READY + 4 TEMPLATES

**Duration:** 10-14 days (1 developer)
**Timeline:** Week 7-8 (after Phase 1 complete)
**Status:** 4 full specs done, 4 templates need expansion
**Complexity:** Large-XLarge (M, L, L, M, L, L, L, L)
**Priority:** Medium - Enables mobile warehouse operations

### Stories (4 Full Specs)

| ID | Name | Days | Complex | Status |
|----|------|------|---------|--------|
| **05.16** | Stock Moves CRUD | 3-4 | M | ✅ Full Spec |
| **05.17** | LP Split Workflow | 4-5 | L | ✅ Full Spec |
| **05.18** | LP Merge Workflow | 4-5 | L | ✅ Full Spec |
| **05.19** | Scanner Receive | 3-4 | M | ✅ Full Spec |

### Stories (4 Templates - Need Full Specs)

| ID | Name | Days | Complex | Status |
|----|------|------|---------|--------|
| **05.20** | Scanner Putaway | 4-5 | L | 📋 Template |
| **05.21** | Scanner Move | 4-5 | L | 📋 Template |
| **05.22** | Putaway Suggestions | 3-4 | M | 📋 Template |
| **05.23** | Scanner Offline Mode | 2-3 | S | 📋 Template |

### What Gets Built

**Desktop Operations:**
- Stock move CRUD (move LP from location A to B)
- LP split (one LP into multiple)
- LP merge (multiple LPs into one)

**Mobile/Scanner Operations:**
- Scanner-based receiving (barcode → confirm)
- Scanner-based putaway (scan location, scan LP)
- Putaway suggestions (FIFO/zone hints)
- Offline operation queue (sync later)

### Dependencies

**Required Before This Phase:**
- Phase 1 (all 8 stories) - GRN/ASN workflows
- Designer review of scanner design system

**Provides to Downstream:**
- Mobile-first warehouse operations
- Real-time inventory visibility

### Desktop-First Strategy

**Phase 0-1:** Desktop UI only (faster development)
- Simpler interface
- No touch optimization
- Proven business logic

**Phase 2:** Add Scanner UI
- Wrap desktop services in mobile-friendly interface
- Touch targets 48x48dp minimum
- Audio feedback for confirmations
- Offline queue management

**Result:** Phase 2 completes in 10-14 days instead of 15-20 days

### Recommended Splits (Apply Before Implementation)

**05.20 Scanner Putaway → Split:**
- **05.20a:** Core Putaway (3-4 days)
  - Basic: Scan location + LP
  - Update location
  - Audio feedback
- **05.20b:** Putaway Suggestions (2-3 days)
  - Zone preference logic
  - FIFO/FEFO grouping
  - Capacity checks
  - Smart warnings

**05.21 Scanner Move → Split:**
- **05.21a:** Basic Move (2-3 days)
  - Scan source + dest location + LP
  - Update location
- **05.21b:** Advanced Move (2-3 days)
  - Multi-LP movements
  - Batch operations
  - Transfer between warehouses

**Apply these splits before Week 7 to keep stories at 3-5 days each**

---

## Phase 3: Pallets & GS1 (10 stories) 📋 TEMPLATES

**Duration:** 10-14 days (1 developer)
**Timeline:** Week 11-12 (after Phase 2 complete)
**Status:** Templates only - need full specs
**Complexity:** Medium-Large (M, M, M, M, M, L, L, M, L, L)
**Priority:** Medium - Advanced warehouse features

### Stories (Template IDs)

| ID | Name | Days | Complex | Purpose |
|----|------|------|---------|---------|
| **05.24** | Pallets CRUD | 3-4 | M | Pallet creation + assignment |
| **05.25** | Pallet LP Assignment | 2-3 | M | Add/remove LPs from pallet |
| **05.26** | Pallet Labels (SSCC-18) | 2-3 | M | SSCC-18 barcode generation |
| **05.27** | Pallet Close + Move All | 2-3 | M | Close pallet + move all LPs |
| **05.28** | Catch Weight Handling | 3-4 | M | Variable weight per LP |
| **05.29** | GS1 Barcode Integration | 3-4 | L | GTIN-14 + GS1-128 support |
| **05.30** | LP Block/Unblock Workflow | 2-3 | M | Quality hold on LP |
| **05.31** | LP QA Status Advanced | 2-3 | L | Inspection status tracking |
| **05.32** | Batch Tracking Advanced | 2-3 | L | Batch-level genealogy |
| **05.33** | Expiry Tracking Advanced | 2-3 | L | Shelf-life validation |

### What Gets Built

**Pallet Management:**
- Pallet creation + tracking
- LP-to-pallet assignment
- Pallet labels (SSCC-18 standard)
- Pallet movement + closure

**GS1 Compliance:**
- GTIN-14 product barcodes
- GS1-128 encoding (batch + expiry)
- SSCC-18 pallet barcodes
- Check digit validation

**Advanced LP Features:**
- Catch weight (variable quantity per LP)
- LP blocking for quality holds
- Batch-level traceability
- Expiry date validation + alerts

### Dependencies

**Required Before This Phase:**
- Phase 2 (all 8 stories) - Stock movements
- GS1 compliance guide (needed for story specs)
- Design review of label formats

### MVP Status

**Not in Phase 1 MVP** - Phase 3 is enterprise/compliance features
- MVP works with basic LPs + pallets can be added later
- GS1 compliance deferrable to Phase 3
- Catch weight handling not needed for MVP

---

## Phase 4: Inventory & Reporting (6 stories) 📋 TEMPLATES

**Duration:** 8-10 days (1 developer)
**Timeline:** Week 13-14 (after Phase 3 complete)
**Status:** Templates only - need full specs
**Complexity:** Small-Medium (S, M, M, M, S, M)
**Priority:** Low - Advanced reporting features

### Stories (Template IDs)

| ID | Name | Days | Complex | Purpose |
|----|------|------|---------|---------|
| **05.34** | Inventory Browser & Summaries | 2-3 | S | Inventory snapshot |
| **05.35** | Inventory Aging Report | 2-3 | M | Turnover analysis |
| **05.36** | Expiring Inventory Alerts | 2-3 | M | Expiry notifications |
| **05.37** | Cycle Counts CRUD | 2-3 | M | Count plan creation |
| **05.38** | Cycle Count Execution | 2-3 | S | Scanner count workflow |
| **05.39** | Variance Approval + Adjustments | 2-3 | M | Physical-vs-system reconciliation |

### What Gets Built

**Inventory Reporting:**
- Real-time inventory browser by location/product
- Aging analysis (turnover KPIs)
- Expiry alerts + notifications
- Inventory value summaries

**Cycle Counts:**
- Cycle count plan CRUD
- Scanner-based counting
- Variance detection + approval
- Automatic adjustments

### Dependencies

**Required Before This Phase:**
- Phase 3 (all 10 stories) - Pallet + GS1
- Data accumulated from operational use (for aging reports)

### MVP Status

**Not in Phase 1 MVP** - These are reporting features
- MVP works with real-time LP queries
- Cycle counting can be manual for MVP
- Aging reports nice-to-have, not critical

---

## Implementation Sequence (Recommended)

### Timeline Chart

```
Week 1-2:   Phase 0 (LP Foundation)           [8 stories, 8-12 days]
Week 3-4:   Phase 1 (GRN/ASN)                 [8 stories, 10-14 days]
Week 5-6:   Phase 2 Desktop (Moves, Split)    [4 stories, 8-10 days]
Week 7-8:   Phase 2 Scanner (+ Phase 1 end)   [4 stories, 6-10 days]
Week 9-10:  Phase 3 Pallets (+ Epic 04 OEE)   [10 stories, 10-14 days]
Week 11-12: Phase 4 Inventory (Cycle Counts)  [6 stories, 8-10 days]

Total: 46-64 days (1 dev), 23-32 days (2 devs parallel)
```

### Parallel Execution (2 Developers)

**While Dev 1 is on Phase 0:**
- Dev 2 works on Epic 04 Phase 0
- Day 4: Dev 2 can start Epic 04.6a-7a using Phase 0 LP

**While Dev 1 is on Phase 1:**
- Dev 2 works on Epic 04 Phase 1
- Both proceed in parallel (no blocking)

**While Dev 1 is on Phase 2-3:**
- Dev 2 works on Epic 03 Planning
- Epic 06 Quality can prepare for Phase 1 specs

**Result:** 3-epic system ready in 12-14 weeks instead of 20+ weeks

---

## Status Summary

| Phase | Stories | Status | When Ready | Critical |
|-------|---------|--------|-----------|----------|
| **0** | 8 | ✅ Full Specs | Week 1-2 | YES - Blocks all |
| **1** | 8 | ✅ Full Specs | Week 3-4 | YES - Phase 2+ dependent |
| **2** | 8 | ⚠️ 4 specs + 4 templates | Week 7-8 | NO - Internal work |
| **3** | 10 | 📋 Templates only | Week 9-10 | NO - Nice to have |
| **4** | 6 | 📋 Templates only | Week 11-12 | NO - Reporting only |

### Action Items

- [ ] Phase 0-1: Start immediately (Week 1, Day 1)
- [ ] Phase 2: Expand 4 templates to full specs (Week 5, before implementation)
- [ ] Phase 3: Create full specs (Week 8, before Phase 3 start)
- [ ] Phase 4: Create full specs (Week 10, before Phase 4 start)

---

## MVP vs Full System

### Phase 1 MVP (Phases 0-1 only)

**Includes:**
- License Plate creation + tracking
- FIFO/FEFO inventory
- GRN/ASN receipt processing
- Material consumption tracking
- Full genealogy

**Excludes:**
- Scanner workflows (Phase 2)
- Pallet management (Phase 3)
- GS1 compliance (Phase 3)
- Cycle counts (Phase 4)
- Advanced reporting (Phase 4)

**Result:** Complete, traceable production system ready for operations

### Full System (All Phases)

**Adds:**
- Mobile/scanner warehouse operations
- Pallet-level tracking
- GS1 barcode compliance
- Cycle counting
- Advanced inventory reporting

**Result:** Enterprise-grade warehouse management system

---

**Version:** 1.0
**Date:** 2025-12-16
**Author:** TECH-WRITER
**Status:** FINAL - READY FOR IMPLEMENTATION
