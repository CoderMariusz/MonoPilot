# Epic 05 - Warehouse Module - Implementation Plan v2.0

**Date:** 2026-01-02
**Epic:** 05-warehouse (License Plates, GRN/ASN, Stock Moves, Scanner)
**Status:** Ready for Implementation
**Total Stories:** 40 (8 Phase 0 + 8 Phase 1 + 8 Phase 2 + 10 Phase 3 + 6 Phase 4)
**Max Parallel Tracks:** 4
**CRITICAL:** Phase 0 UNBLOCKS Epic 04 Production (10 stories waiting)

---

## Changelog v2.0

| Issue | Original | Corrected |
|-------|----------|-----------|
| Sprint 1 false parallelism | 4 tracks "parallel" with dependencies | Split into Sprint 1a/1b with realistic sequencing |
| 05.12 dependency inconsistency | Listed as 05.1 only | Corrected to 05.1 + 05.8 (batch tracking needs GRN context) |
| 05.23 impossible parallelism | Same sprint as 05.20-05.22 | Moved to dedicated Sprint 8 |
| Epic 04 milestone too optimistic | Day 4-5 | Day 7-8 with 2-day buffer |
| Sprint 9 overloaded | Mixed Phase 3 + Phase 4 | Split into Sprint 9 (Phase 3) and Sprint 10 (Phase 4) |
| Total timeline underestimated | 74 days | 82 days (realistic with buffers) |

---

## Prerequisites (Must Be COMPLETE Before Starting)

| Dependency | Story | Provides | Critical For |
|------------|-------|----------|--------------|
| Org Context + RLS | 01.1 | org_id, users, roles, RLS | ALL stories |
| Settings Navigation | 01.2 | Settings shell | 05.0 |
| Role Permissions | 01.6 | RBAC | 05.0 |
| Warehouses | 01.8 | warehouses table | 05.1, 05.8, 05.9 |
| Locations | 01.9 | locations table | 05.1, 05.11 |
| Products CRUD | 02.1 | products table | 05.1 |
| Purchase Orders | 03.3 | purchase_orders, po_lines | 05.8, 05.11 |
| Transfer Orders | 03.8 | transfer_orders, to_lines | 05.9, 05.12 |
| Work Orders | 03.10 | work_orders | Epic 04 consumption |

---

## Corrected Dependency Graph

```
LEVEL 0: External Prerequisites (Epic 01 + 02 + 03)
└── 01.1, 01.2, 01.6, 01.8, 01.9, 02.1, 03.3, 03.8, 03.10

LEVEL 1: Foundation (Phase 0 Start - CRITICAL PATH)
└── 05.0 - Warehouse Settings [M, 3d] ← 01.1, 01.2, 01.6

LEVEL 2: LP Core Infrastructure (Phase 0 - UNBLOCKS EPIC 04)
└── 05.1 - LP Table + Service [L, 4d] ← 05.0, 01.8, 01.9, 02.1 ★★★

LEVEL 3: LP Extensions (Phase 0 - Parallel after 05.1)
├── 05.2 - LP Genealogy [M, 2d] ← 05.1
├── 05.3 - LP Reservations [M, 2d] ← 05.1
├── 05.4 - FIFO/FEFO Pick [M, 2d] ← 05.1
├── 05.5 - LP CRUD Desktop [M, 2d] ← 05.1
└── 05.7 - QA Status Mgmt [M, 2d] ← 05.1

LEVEL 4: LP Advanced (Phase 0 Complete)
└── 05.6 - LP Split/Merge [M, 3d] ← 05.1, 05.2

★★★ EPIC 04 PRODUCTION PHASE 1 CAN START AFTER LEVEL 2 (Day 7-8) ★★★

LEVEL 5: Goods Receipt Foundation (Phase 1)
├── 05.8 - GRN from PO [L, 4d] ← 05.1, 03.3
├── 05.9 - GRN from TO [M, 3d] ← 05.1, 03.8
└── 05.11 - Stock Moves [M, 3d] ← 05.1

LEVEL 6: Goods Receipt Extensions (Phase 1)
├── 05.10 - ASN Management [M, 3d] ← 05.8
├── 05.12 - Batch/Expiry Tracking [M, 2d] ← 05.1, 05.8 ← CORRECTED
├── 05.13 - Over-Receipt Control [S, 1d] ← 05.8
├── 05.14 - Label Printing [M, 3d] ← 05.1
└── 05.15 - Warehouse Dashboard [M, 3d] ← 05.1, 05.8, 05.11

LEVEL 7: Scanner Foundation (Phase 2)
└── 05.16 - Scanner Login + Session [S, 1d] ← 05.0

LEVEL 8: Scanner Core Operations (Phase 2)
├── 05.17 - Scanner Receive [L, 4d] ← 05.8, 05.16
├── 05.18 - Scanner Move [M, 2d] ← 05.11, 05.16
├── 05.19 - Scanner Putaway [M, 3d] ← 05.4, 05.11, 05.16
├── 05.20 - Scanner Split [S, 1d] ← 05.6, 05.16
├── 05.21 - Scanner Merge [S, 1d] ← 05.6, 05.16
└── 05.22 - Scanner Pick [M, 3d] ← 05.4, 05.16

LEVEL 9: Scanner Polish (Phase 2 - MUST WAIT FOR ALL SCANNER)
└── 05.23 - Scanner UI Components [M, 2d] ← 05.16, 05.17, 05.18, 05.19, 05.20, 05.21, 05.22

LEVEL 10: Advanced Features - Part A (Phase 3)
├── 05.24 - GS1 GTIN Support [M, 3d] ← 05.17
├── 05.26 - Pallet Management [L, 4d] ← 05.1
├── 05.27 - Catch Weight [M, 2d] ← 05.1
└── 05.28 - Shelf Life Calc [S, 1d] ← 05.12

LEVEL 11: Advanced Features - Part B (Phase 3)
├── 05.25 - GS1 SSCC Support [M, 3d] ← 05.24, 05.26
├── 05.29 - Location Capacity [M, 3d] ← 05.0, 05.11
├── 05.30 - Zone Management [M, 3d] ← 05.0
├── 05.31 - LP Genealogy Tree [M, 2d] ← 05.2
├── 05.32 - Stock Adjustments [M, 2d] ← 05.11
└── 05.33 - Expiry Alerts [S, 1d] ← 05.12

LEVEL 12: Inventory Management (Phase 4)
├── 05.34 - Cycle Count Planning [M, 3d] ← 05.0
├── 05.35 - Cycle Count Execution [L, 4d] ← 05.34
├── 05.36 - Inventory Browser [M, 2d] ← 05.1
├── 05.37 - Aging Report [S, 1d] ← 05.4
├── 05.38 - Inventory Summary [S, 1d] ← 05.36
└── 05.39 - Warehouse Polish [M, 2d] ← ALL
```

---

## Corrected Sprint Plan (Max 4 Parallel Tracks)

### Sprint 1a: Phase 0 - Foundation (Days 1-3) ★ SEQUENTIAL ★

**Goal:** Establish warehouse settings foundation
**Tracks:** 1 (sequential - no parallelism possible)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.0** Warehouse Settings | M | 3 | 01.1, 01.2, 01.6 | `context/05.0/*.yaml` |

**Blockers:** None (prerequisites assumed complete)
**Output:** Warehouse settings UI, configuration tables

---

### Sprint 1b: Phase 0 - LP Core (Days 4-7) ★ CRITICAL PATH ★

**Goal:** Deliver LP table + service - UNBLOCK Epic 04
**Tracks:** 1 (sequential - 05.1 depends on 05.0)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.1** LP Table + Service | L | 4 | 05.0, 01.8, 01.9, 02.1 | `context/05.1/*.yaml` |

**Blockers:** 05.0 must be complete

**★★★ CRITICAL MILESTONE: Day 7-8 ★★★**
- ✅ Epic 04 Production Phase 1 (10 stories) CAN START
- ✅ `license_plates` table available with RLS
- ✅ LP service methods ready (create, consume, block)
- ✅ 2-day buffer included for unexpected issues

---

### Sprint 2: Phase 0 - LP Extensions (Days 8-12)

**Goal:** Complete LP foundation features
**Tracks:** 4 (TRUE parallelism - all depend only on 05.1)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.2** LP Genealogy | M | 2 | 05.1 | `context/05.2/*.yaml` |
| B | **05.3** LP Reservations | M | 2 | 05.1 | `context/05.3/*.yaml` |
| C | **05.4** FIFO/FEFO Pick | M | 2 | 05.1 | `context/05.4/*.yaml` |
| D | **05.5** LP CRUD Desktop | M | 2 | 05.1 | `context/05.5/*.yaml` |

**Blockers:** All tracks wait for 05.1 (Sprint 1b)
**Output:** Genealogy tracking, reservations, pick algorithms, desktop UI

---

### Sprint 3: Phase 0 Complete (Days 13-17)

**Goal:** Finish LP foundation, start QA/Split-Merge
**Tracks:** 2 + buffer

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.6** LP Split/Merge | M | 3 | 05.1, 05.2 | `context/05.6/*.yaml` |
| B | **05.7** QA Status Mgmt | M | 2 | 05.1 | `context/05.7/*.yaml` |
| C | (buffer/catchup) | - | - | - | - |
| D | (buffer/catchup) | - | - | - | - |

**Blockers:**
- Track A waits for 05.2 (Sprint 2)
- Track B can start immediately (depends on 05.1)

**★ PHASE 0 COMPLETE: Day 17 ★**
- All LP foundation stories delivered
- Epic 04 fully unblocked

---

### Sprint 4: Phase 1 - Goods Receipt Core (Days 18-25)

**Goal:** GRN workflows from PO/TO + Stock Moves
**Tracks:** 4

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.8** GRN from PO | L | 4 | 05.1, 03.3 | `context/05.8/*.yaml` |
| B | **05.9** GRN from TO | M | 3 | 05.1, 03.8 | `context/05.9/*.yaml` |
| C | **05.11** Stock Moves | M | 3 | 05.1 | `context/05.11/*.yaml` |
| D | **05.14** Label Printing | M | 3 | 05.1 | `context/05.14/*.yaml` |

**Blockers:**
- Track A needs 03.3 (Epic 03 PO)
- Track B needs 03.8 (Epic 03 TO)
- Track C, D can start immediately

---

### Sprint 5: Phase 1 - Goods Receipt Extensions (Days 26-32)

**Goal:** ASN, Batch/Expiry, Over-Receipt, Dashboard
**Tracks:** 4

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.10** ASN Management | M | 3 | 05.8 | `context/05.10/*.yaml` |
| B | **05.12** Batch/Expiry Tracking | M | 2 | 05.1, 05.8 | `context/05.12/*.yaml` |
| C | **05.13** Over-Receipt Control | S | 1 | 05.8 | `context/05.13/*.yaml` |
| D | **05.15** Warehouse Dashboard | M | 3 | 05.1, 05.8, 05.11 | `context/05.15/*.yaml` |

**Blockers:**
- Track A, B, C wait for 05.8 (Sprint 4)
- Track D waits for 05.8 + 05.11 (Sprint 4)

**★ PHASE 1 COMPLETE: Day 32 ★**
- Full receiving workflows operational
- ASN, batch tracking, dashboard ready

---

### Sprint 6: Phase 2 - Scanner Foundation + Core (Days 33-40)

**Goal:** Scanner login + primary operations
**Tracks:** 4 (with internal sequencing)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.16** Scanner Login | S | 1 | 05.0 | `context/05.16/*.yaml` |
| A→ | **05.17** Scanner Receive | L | 4 | 05.8, 05.16 | `context/05.17/*.yaml` |
| B | **05.18** Scanner Move | M | 2 | 05.11, 05.16 | `context/05.18/*.yaml` |
| C | **05.19** Scanner Putaway | M | 3 | 05.4, 05.11, 05.16 | `context/05.19/*.yaml` |
| D | **05.22** Scanner Pick | M | 3 | 05.4, 05.16 | `context/05.22/*.yaml` |

**Blockers:**
- 05.16 starts Day 33, completes Day 33
- 05.17 starts Day 34 (after 05.16)
- 05.18, 05.19, 05.22 start Day 34 (after 05.16)

**Note:** Track A is sequential (05.16 → 05.17)

---

### Sprint 7: Phase 2 - Scanner Split/Merge (Days 41-43)

**Goal:** Scanner split/merge operations
**Tracks:** 2

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.20** Scanner Split | S | 1 | 05.6, 05.16 | `context/05.20/*.yaml` |
| B | **05.21** Scanner Merge | S | 1 | 05.6, 05.16 | `context/05.21/*.yaml` |

**Blockers:**
- Both wait for 05.6 (Sprint 3) + 05.16 (Sprint 6)

---

### Sprint 8: Phase 2 Complete - Scanner Polish (Days 44-46)

**Goal:** Scanner UI components (AFTER all scanner stories)
**Tracks:** 1

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.23** Scanner UI Components | M | 2 | 05.16-05.22 | `context/05.23/*.yaml` |

**Blockers:** ALL scanner stories (05.16-05.22) must be complete

**★ PHASE 2 COMPLETE: Day 46 ★**
- Full mobile scanner operations
- Touch-optimized UI (48px+ buttons)
- Audio feedback

---

### Sprint 9: Phase 3 - Advanced Features A (Days 47-54)

**Goal:** GS1 GTIN, Pallets, Catch Weight, Shelf Life
**Tracks:** 4

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.24** GS1 GTIN Support | M | 3 | 05.17 | `context/05.24/*.yaml` |
| B | **05.26** Pallet Management | L | 4 | 05.1 | `context/05.26/*.yaml` |
| C | **05.27** Catch Weight | M | 2 | 05.1 | `context/05.27/*.yaml` |
| D | **05.28** Shelf Life Calc | S | 1 | 05.12 | `context/05.28/*.yaml` |

**Blockers:**
- Track A waits for 05.17 (Sprint 6)
- Track B, C can start immediately (depend on 05.1)
- Track D waits for 05.12 (Sprint 5)

---

### Sprint 10: Phase 3 - Advanced Features B (Days 55-62)

**Goal:** GS1 SSCC, Zones, Capacity, Genealogy Tree
**Tracks:** 4

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.25** GS1 SSCC Support | M | 3 | 05.24, 05.26 | `context/05.25/*.yaml` |
| B | **05.29** Location Capacity | M | 3 | 05.0, 05.11 | `context/05.29/*.yaml` |
| C | **05.30** Zone Management | M | 3 | 05.0 | `context/05.30/*.yaml` |
| D | **05.31** LP Genealogy Tree | M | 2 | 05.2 | `context/05.31/*.yaml` |

**Blockers:**
- Track A waits for 05.24 + 05.26 (Sprint 9)
- Track B waits for 05.11 (Sprint 4)
- Track C can start after 05.0 (Sprint 1a)
- Track D waits for 05.2 (Sprint 2)

---

### Sprint 11: Phase 3 Complete (Days 63-66)

**Goal:** Stock Adjustments, Expiry Alerts
**Tracks:** 2

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.32** Stock Adjustments | M | 2 | 05.11 | `context/05.32/*.yaml` |
| B | **05.33** Expiry Alerts | S | 1 | 05.12 | `context/05.33/*.yaml` |

**Blockers:**
- Track A waits for 05.11 (Sprint 4)
- Track B waits for 05.12 (Sprint 5)

**★ PHASE 3 COMPLETE: Day 66 ★**
- Enterprise features operational
- GS1, pallets, zones, adjustments ready

---

### Sprint 12: Phase 4 - Inventory Planning (Days 67-72)

**Goal:** Cycle Count Planning, Inventory Browser
**Tracks:** 2

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.34** Cycle Count Planning | M | 3 | 05.0 | `context/05.34/*.yaml` |
| B | **05.36** Inventory Browser | M | 2 | 05.1 | `context/05.36/*.yaml` |

**Blockers:**
- Track A can start after 05.0 (Sprint 1a)
- Track B can start after 05.1 (Sprint 1b)

---

### Sprint 13: Phase 4 - Inventory Execution (Days 73-78)

**Goal:** Cycle Count Execution, Reports
**Tracks:** 3

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.35** Cycle Count Execution | L | 4 | 05.34 | `context/05.35/*.yaml` |
| B | **05.37** Aging Report | S | 1 | 05.4 | `context/05.37/*.yaml` |
| C | **05.38** Inventory Summary | S | 1 | 05.36 | `context/05.38/*.yaml` |

**Blockers:**
- Track A waits for 05.34 (Sprint 12)
- Track B waits for 05.4 (Sprint 2)
- Track C waits for 05.36 (Sprint 12)

---

### Sprint 14: Phase 4 Complete - Polish (Days 79-82)

**Goal:** Final polish and integration
**Tracks:** 1

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **05.39** Warehouse Polish | M | 2 | ALL | `context/05.39/*.yaml` |

**Blockers:** ALL previous stories must be complete

**★ PHASE 4 COMPLETE: Day 82 ★**
- Full warehouse module delivered
- All integration tests passing

---

## Timeline Summary

| Phase | Sprint(s) | Days | Stories | Key Deliverable |
|-------|-----------|------|---------|-----------------|
| **Phase 0** | 1a, 1b, 2, 3 | 1-17 | 8 | LP Foundation, **Epic 04 Unblocked** |
| **Phase 1** | 4, 5 | 18-32 | 8 | Goods Receipt (GRN/ASN) |
| **Phase 2** | 6, 7, 8 | 33-46 | 8 | Scanner Workflows |
| **Phase 3** | 9, 10, 11 | 47-66 | 10 | Advanced Features |
| **Phase 4** | 12, 13, 14 | 67-82 | 6 | Inventory Management |

**Total: 82 days** (vs original 74 days - 8 days added for realistic sequencing + buffers)

---

## Critical Path Analysis (Corrected)

### Primary Critical Path (Longest Sequential Chain)
```
05.0 [3d] → 05.1 [4d] → 05.8 [4d] → 05.17 [4d] → 05.24 [3d] → 05.25 [3d]
= 21 days minimum for GS1 SSCC capability
```

### Epic 04 Unblocking Path (HIGHEST PRIORITY)
```
05.0 [3d] → 05.1 [4d] = 7 days + 1 day buffer = Day 7-8 milestone
```

### Scanner Critical Path
```
05.0 [3d] → 05.1 [4d] → 05.8 [4d] → 05.16 [1d] → 05.17 [4d] → 05.23 [2d]
= 18 days from start to scanner polish
```

### Inventory Critical Path
```
05.0 [3d] → 05.34 [3d] → 05.35 [4d] → 05.39 [2d]
= 12 days (can run parallel to other paths)
```

---

## Epic 04 Production Unblocking Strategy (Corrected)

### Timeline with Buffer

| Day | Milestone | Epic 04 Impact |
|-----|-----------|----------------|
| 3 | 05.0 Complete | Settings ready |
| **7-8** | **05.1 Complete** | **★ Epic 04 Phase 1 CAN START ★** |
| 10 | 05.2, 05.3, 05.4 Complete | Genealogy, Reservations, FIFO ready |
| 17 | Phase 0 Complete | Epic 04 fully unblocked |

### What Epic 04 Gets (by Day)

| Day | Available | Epic 04 Stories Unblocked |
|-----|-----------|---------------------------|
| 7-8 | `license_plates` table, LP service | 04.6a-e (Material Consumption), 04.7a-d (Output Registration) |
| 10 | `lp_reservations` table | 04.8 (Material Reservations) |
| 10 | FIFO/FEFO pick service | 04.9 (FIFO/FEFO Pick) |
| 10 | `lp_genealogy` table | 04.10 (Genealogy Tracking) |

---

## Parallel Track Utilization Analysis

| Sprint | Tracks Used | Efficiency | Notes |
|--------|-------------|------------|-------|
| 1a | 1/4 | 25% | Sequential (foundation) |
| 1b | 1/4 | 25% | Sequential (critical path) |
| 2 | 4/4 | 100% | True parallelism |
| 3 | 2/4 | 50% | + buffer capacity |
| 4 | 4/4 | 100% | True parallelism |
| 5 | 4/4 | 100% | True parallelism |
| 6 | 4/4 | 100% | Internal sequencing |
| 7 | 2/4 | 50% | Small stories |
| 8 | 1/4 | 25% | Sequential (polish) |
| 9 | 4/4 | 100% | True parallelism |
| 10 | 4/4 | 100% | True parallelism |
| 11 | 2/4 | 50% | Final Phase 3 |
| 12 | 2/4 | 50% | Start Phase 4 |
| 13 | 3/4 | 75% | Phase 4 execution |
| 14 | 1/4 | 25% | Final polish |

**Average Track Utilization:** ~65% (realistic for dependency-heavy work)

---

## Blockers & Risks (Updated)

| Risk | Impact | Phase | Mitigation | Status |
|------|--------|-------|------------|--------|
| **05.0 delay impacts entire epic** | CRITICAL | 0 | Single-track focus, daily progress checks | WATCH |
| **05.1 delay blocks Epic 04** | CRITICAL | 0 | 2-day buffer added, escalation plan ready | MITIGATED |
| Epic 03 (PO/TO) incomplete | HIGH | 1 | Verify 03.3, 03.8 before Day 18 | CHECK |
| LP data model errors | HIGH | 0 | Architecture review Day 1-2 | PLAN |
| Genealogy complexity | MEDIUM | 0 | Simple parent/child first | PLAN |
| Scanner device compatibility | MEDIUM | 2 | Test Android + iOS Day 33 | PLAN |
| GS1 barcode edge cases | MEDIUM | 3 | Real barcode test suite | PLAN |
| Label printer integration | MEDIUM | 1 | ZPL standard, Zebra devices | PLAN |
| Performance 100K+ LPs | MEDIUM | ALL | Index strategy, pagination | PLAN |
| 05.23 blocked by all scanner | LOW | 2 | Moved to dedicated Sprint 8 | MITIGATED |

---

## Stories Quick Reference (with Sprint Assignment)

### Phase 0 - LP Foundation (8 stories) ★ CRITICAL ★

| ID | Name | Size | Days | Key Dependencies | Sprint |
|----|------|------|------|------------------|--------|
| 05.0 | Warehouse Settings | M | 3 | 01.1, 01.2, 01.6 | 1a |
| 05.1 | LP Table + Service | L | 4 | 05.0, 01.8, 01.9, 02.1 | 1b |
| 05.2 | LP Genealogy | M | 2 | 05.1 | 2 |
| 05.3 | LP Reservations | M | 2 | 05.1 | 2 |
| 05.4 | FIFO/FEFO Pick | M | 2 | 05.1 | 2 |
| 05.5 | LP CRUD Desktop | M | 2 | 05.1 | 2 |
| 05.6 | LP Split/Merge | M | 3 | 05.1, 05.2 | 3 |
| 05.7 | QA Status Mgmt | M | 2 | 05.1 | 3 |

### Phase 1 - Goods Receipt (8 stories)

| ID | Name | Size | Days | Key Dependencies | Sprint |
|----|------|------|------|------------------|--------|
| 05.8 | GRN from PO | L | 4 | 05.1, 03.3 | 4 |
| 05.9 | GRN from TO | M | 3 | 05.1, 03.8 | 4 |
| 05.10 | ASN Management | M | 3 | 05.8 | 5 |
| 05.11 | Stock Moves | M | 3 | 05.1 | 4 |
| 05.12 | Batch/Expiry Tracking | M | 2 | 05.1, 05.8 | 5 |
| 05.13 | Over-Receipt Control | S | 1 | 05.8 | 5 |
| 05.14 | Label Printing | M | 3 | 05.1 | 4 |
| 05.15 | Warehouse Dashboard | M | 3 | 05.1, 05.8, 05.11 | 5 |

### Phase 2 - Scanner Workflows (8 stories)

| ID | Name | Size | Days | Key Dependencies | Sprint |
|----|------|------|------|------------------|--------|
| 05.16 | Scanner Login + Session | S | 1 | 05.0 | 6 |
| 05.17 | Scanner Receive | L | 4 | 05.8, 05.16 | 6 |
| 05.18 | Scanner Move | M | 2 | 05.11, 05.16 | 6 |
| 05.19 | Scanner Putaway | M | 3 | 05.4, 05.11, 05.16 | 6 |
| 05.20 | Scanner Split | S | 1 | 05.6, 05.16 | 7 |
| 05.21 | Scanner Merge | S | 1 | 05.6, 05.16 | 7 |
| 05.22 | Scanner Pick | M | 3 | 05.4, 05.16 | 6 |
| 05.23 | Scanner UI Components | M | 2 | 05.16-05.22 | 8 |

### Phase 3 - Advanced Features (10 stories)

| ID | Name | Size | Days | Key Dependencies | Sprint |
|----|------|------|------|------------------|--------|
| 05.24 | GS1 GTIN Support | M | 3 | 05.17 | 9 |
| 05.25 | GS1 SSCC Support | M | 3 | 05.24, 05.26 | 10 |
| 05.26 | Pallet Management | L | 4 | 05.1 | 9 |
| 05.27 | Catch Weight | M | 2 | 05.1 | 9 |
| 05.28 | Shelf Life Calc | S | 1 | 05.12 | 9 |
| 05.29 | Location Capacity | M | 3 | 05.0, 05.11 | 10 |
| 05.30 | Zone Management | M | 3 | 05.0 | 10 |
| 05.31 | LP Genealogy Tree | M | 2 | 05.2 | 10 |
| 05.32 | Stock Adjustments | M | 2 | 05.11 | 11 |
| 05.33 | Expiry Alerts | S | 1 | 05.12 | 11 |

### Phase 4 - Inventory Management (6 stories)

| ID | Name | Size | Days | Key Dependencies | Sprint |
|----|------|------|------|------------------|--------|
| 05.34 | Cycle Count Planning | M | 3 | 05.0 | 12 |
| 05.35 | Cycle Count Execution | L | 4 | 05.34 | 13 |
| 05.36 | Inventory Browser | M | 2 | 05.1 | 12 |
| 05.37 | Aging Report | S | 1 | 05.4 | 13 |
| 05.38 | Inventory Summary | S | 1 | 05.36 | 13 |
| 05.39 | Warehouse Polish | M | 2 | ALL | 14 |

---

## Definition of Done (Per Story)

- [ ] All context YAML files reviewed
- [ ] Database migration created (if applicable)
- [ ] RLS policies applied (ADR-013)
- [ ] API endpoints implemented
- [ ] Service layer with business logic
- [ ] Zod validation schemas
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests (API + database)
- [ ] E2E smoke test (critical flow)
- [ ] Mobile responsive (scanner: 48px+ touch targets)
- [ ] PROJECT-STATE.md updated

---

## Handoff Instructions for Orchestrator (Updated)

```yaml
epic: "05-warehouse"
version: "2.0"
base_path: "docs/2-MANAGEMENT/epics/current/05-warehouse/"
context_path: "context/{story_id}/"
story_md_pattern: "{story_id}.{slug}.md"

execution_order:
  sprint_1a_foundation: ["05.0"]  # SEQUENTIAL - Days 1-3
  sprint_1b_lp_core: ["05.1"]     # SEQUENTIAL - Days 4-7 ★ EPIC 04 UNBLOCK ★
  sprint_2_lp_extensions: ["05.2", "05.3", "05.4", "05.5"]  # PARALLEL - Days 8-12
  sprint_3_lp_complete: ["05.6", "05.7"]  # Days 13-17
  sprint_4_grn_core: ["05.8", "05.9", "05.11", "05.14"]  # PARALLEL - Days 18-25
  sprint_5_grn_ext: ["05.10", "05.12", "05.13", "05.15"]  # PARALLEL - Days 26-32
  sprint_6_scanner_core: ["05.16", "05.17", "05.18", "05.19", "05.22"]  # Days 33-40
  sprint_7_scanner_split: ["05.20", "05.21"]  # Days 41-43
  sprint_8_scanner_polish: ["05.23"]  # Days 44-46
  sprint_9_advanced_a: ["05.24", "05.26", "05.27", "05.28"]  # PARALLEL - Days 47-54
  sprint_10_advanced_b: ["05.25", "05.29", "05.30", "05.31"]  # PARALLEL - Days 55-62
  sprint_11_advanced_c: ["05.32", "05.33"]  # Days 63-66
  sprint_12_inventory_plan: ["05.34", "05.36"]  # Days 67-72
  sprint_13_inventory_exec: ["05.35", "05.37", "05.38"]  # Days 73-78
  sprint_14_polish: ["05.39"]  # Days 79-82

max_parallel_agents: 4

critical_milestones:
  - day: 7-8
    story: "05.1"
    unblocks: "Epic 04 Production Phase 1 (10 stories)"
    buffer: "2 days included"
  
  - day: 17
    stories: ["05.0", "05.1", "05.2", "05.3", "05.4", "05.5", "05.6", "05.7"]
    milestone: "Phase 0 Complete - Epic 04 fully unblocked"
  
  - day: 32
    milestone: "Phase 1 Complete - Goods Receipt operational"
  
  - day: 46
    milestone: "Phase 2 Complete - Scanner workflows operational"
  
  - day: 66
    milestone: "Phase 3 Complete - Advanced features operational"
  
  - day: 82
    milestone: "Phase 4 Complete - Full warehouse module delivered"

sequencing_rules:
  - "Sprint 1a and 1b are STRICTLY sequential"
  - "05.23 MUST wait for ALL scanner stories (05.16-05.22)"
  - "05.12 depends on BOTH 05.1 AND 05.8"
  - "05.6 depends on BOTH 05.1 AND 05.2"
  - "Buffers in Sprint 3 can absorb Phase 0 delays"

agent_context_template: |
  Read the following files before implementing:
  1. {context_path}/_index.yaml - dependencies, deliverables
  2. {context_path}/database.yaml - tables, RLS
  3. {context_path}/api.yaml - endpoints, validation
  4. {context_path}/frontend.yaml - components, pages
  5. {context_path}/tests.yaml - acceptance criteria
```

---

## Final Review Checklist v2.0

### Corrections Applied ✅

- [x] Sprint 1 split into 1a (05.0) and 1b (05.1) - realistic sequencing
- [x] 05.12 dependency corrected to include 05.8
- [x] 05.23 moved to dedicated Sprint 8 (after all scanner stories)
- [x] Epic 04 milestone moved to Day 7-8 with buffer
- [x] Sprint 9 split - Phase 3 and Phase 4 now separate
- [x] Total timeline updated to 82 days
- [x] Track utilization analysis added
- [x] Sequencing rules documented for orchestrator

### Remaining Considerations

- [ ] Epic 03 completion verification needed before Day 18
- [ ] Architecture review for LP data model recommended Day 1-2
- [ ] Scanner device testing strategy for Day 33
- [ ] Performance benchmarks for 100K+ LP scale

---

**Generated:** 2026-01-02
**Version:** 2.0
**Author:** Claude (AI Agent)
**Changes:** Corrected false parallelism, dependency inconsistencies, unrealistic milestones
**Total Duration:** 82 days (14 sprints)
**Critical Path:** 05.0 → 05.1 → Epic 04 Unblock (Day 7-8)
