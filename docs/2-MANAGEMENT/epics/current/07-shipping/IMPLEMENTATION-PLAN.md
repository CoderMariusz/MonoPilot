# Epic 07 - Shipping Module - Implementation Plan

**Date:** 2026-01-15
**Epic:** 07-shipping (Customers, Sales Orders, Picking, Packing, Shipping, Returns)
**Status:** Phase 1-3 Stories Defined | Implementation NOT STARTED
**Total Stories:** 24 (16 Phase 1 + 8 Phase 2-3)
**Max Parallel Tracks:** 4
**Story Definition:** 100% complete

---

## Prerequisites (Must Be COMPLETE Before Starting)

| Dependency | Story | Provides | Critical For |
|------------|-------|----------|--------------|
| Org Context + RLS | 01.1 | org_id, users, roles, RLS | ALL stories |
| Products | 02.1 | products table | 07.2, 07.6, 07.7 |
| Allergens | 01.12 | allergens table | 07.6 |
| License Plates | 05.1 | license_plates table | 07.7 (allocation) |
| LP Reservations | 05.3 | lp_reservations service | 07.7 (allocation) |
| FIFO/FEFO | 05.3 | pick suggestions | 07.9, 07.10 |
| Pallets (optional) | 05.22 | pallets table | 07.21 (load planning) |

**CRITICAL:** Epic 05 Warehouse COMPLETE ✅ → Epic 07 UNBLOCKED!

---

## Phase Structure

### Phase 1 - MVP Core (16 stories)
**Goal:** Complete order-to-ship cycle (customers → SO → pick → pack → ship → RMA)
**Timeline:** 60-79 days sequential | 40-50 days parallel
**Stories:** 07.1-07.16

### Phase 2-3 - Advanced Features (8 stories)
**Goal:** Carrier integration, dock management, advanced analytics
**Timeline:** 48-64 days
**Stories:** 07.17-07.24

---

## Dependency Graph (Critical Path)

```
LEVEL 0: External Prerequisites (Epic 01, 02, 05)
└── 01.1, 02.1, 01.12, 05.1, 05.3

LEVEL 1: Foundation (can start immediately)
├── 07.1 - Customers CRUD [M, 3-4d]
└── 07.15 - Shipping Dashboard [M, 3-4d] ← 01.1

LEVEL 2: Sales Orders Core
├── 07.2 - Sales Orders Core [L, 5-7d] ← 07.1, 02.1
└── 07.4 - SO Line Pricing [M, 3d] ← 07.2

LEVEL 3: SO Workflows (parallel possible)
├── 07.3 - SO Status Workflow [M, 3d] ← 07.2
├── 07.5 - SO Clone/Import [M, 3-4d] ← 07.2
└── 07.6 - SO Allergen Validation [M, 2-3d] ← 07.2, 01.12

LEVEL 4: Inventory Allocation (CRITICAL)
└── 07.7 - Inventory Allocation [L, 5-7d] ← 07.2, 05.1, 05.3

LEVEL 5: Picking (parallel possible)
├── 07.8 - Pick List Generation [L, 4-5d] ← 07.7
├── 07.9 - Pick Confirmation Desktop [M, 3-4d] ← 07.8, 05.3
└── 07.10 - Pick Scanner [M, 3-4d] ← 07.8, 05.3

LEVEL 6: Packing (parallel possible)
├── 07.11 - Packing Shipment Creation [L, 4-5d] ← 07.9/07.10
├── 07.12 - Packing Scanner [M, 3-4d] ← 07.9/07.10
└── 07.13 - SSCC & BOL Labels [M, 3-4d] ← 07.11, 05.22 (optional)

LEVEL 7: Shipment & Returns
├── 07.14 - Shipment Manifest & Ship [M, 2-3d] ← 07.13
└── 07.16 - RMA Core CRUD [L, 5-7d] ← 07.2
```

**Critical Path:** 07.1 → 07.2 → 07.7 → 07.8 → 07.9 → 07.11 → 07.13 → 07.14 = ~29-40 days sequential

---

## Phase 1: MVP Implementation Order

### Sprint 1-2: Foundation (Days 1-11)

| Track | Story | Complexity | Days | Dependencies |
|-------|-------|------------|------|--------------|
| A | **07.1** Customers CRUD | M | 3-4 | 01.1 |
| B | **07.15** Shipping Dashboard | M | 3-4 | 01.1 |
| C | *(wait for 07.1)* | - | - | - |
| D | *(buffer)* | - | - | - |

**After 07.1 completes:**
| A | **07.2** Sales Orders Core | L | 5-7 | 07.1, 02.1 |
| B | *(continue 07.15)* | - | - | - |

### Sprint 3-4: SO Workflows (Days 12-22)

| Track | Story | Complexity | Days | Dependencies |
|-------|-------|------------|------|--------------|
| A | **07.4** SO Line Pricing | M | 3 | 07.2 |
| B | **07.3** SO Status Workflow | M | 3 | 07.2 |
| C | **07.5** SO Clone/Import | M | 3-4 | 07.2 |
| D | **07.6** SO Allergen Validation | M | 2-3 | 07.2, 01.12 |

### Sprint 5-6: Allocation & Picking (Days 23-40)

| Track | Story | Complexity | Days | Dependencies |
|-------|-------|------------|------|--------------|
| A | **07.7** Inventory Allocation | L | 5-7 | 07.2, 05.1, 05.3 |
| B | *(wait for 07.7)* | - | - | - |

**After 07.7 completes:**
| A | **07.8** Pick List Generation | L | 4-5 | 07.7 |
| B | **07.9** Pick Desktop | M | 3-4 | 07.8, 05.3 |
| C | **07.10** Pick Scanner | M | 3-4 | 07.8, 05.3 |

### Sprint 7-8: Packing & Shipping (Days 41-60)

| Track | Story | Complexity | Days | Dependencies |
|-------|-------|------------|------|--------------|
| A | **07.11** Packing Desktop | L | 4-5 | 07.9/07.10 |
| B | **07.12** Packing Scanner | M | 3-4 | 07.9/07.10 |
| C | **07.13** SSCC & BOL Labels | M | 3-4 | 07.11 |
| D | **07.16** RMA Core CRUD | L | 5-7 | 07.2 |

**After 07.13 completes:**
| A | **07.14** Shipment Manifest & Ship | M | 2-3 | 07.13 |

**Total Phase 1:** 60-79 days sequential | ~40-50 days with 4 parallel tracks

---

## Phase 2-3: Advanced Features

### Phase 2 Dependency Graph

```
LEVEL 1: Customer & SO Advanced (parallel possible)
├── 07.17 - Customer Advanced [M, 3-4d] ← 07.1
├── 07.18 - SO Advanced [M, 4-5d] ← 07.2
└── 07.23 - Customer Pricing [M, 4-5d] ← 07.1, 07.2

LEVEL 2: Pick & Pack Advanced
├── 07.19 - Pick Optimization [L, 5-7d] ← 07.8
└── 07.22 - Packing Advanced [M, 3-4d] ← 07.11

LEVEL 3: Enterprise Integration (parallel possible)
├── 07.20 - Carrier Integration [XL, 10-14d] ← 07.14
└── 07.21 - Dock & Loading [L, 7-10d] ← 07.14, 05.22

LEVEL 4: Analytics
└── 07.24 - Shipping Reports [L, 7-10d] ← 07.2, 07.14
```

### Phase 2-3 Stories Quick Reference

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 07.17 | Customer Advanced Features | M | 3-4 | 07.1 |
| 07.18 | SO Advanced Features | M | 4-5 | 07.2 |
| 07.19 | Pick Optimization & Batch | L | 5-7 | 07.8 |
| 07.20 | Carrier Integration | XL | 10-14 | 07.14 |
| 07.21 | Dock & Loading Management | L | 7-10 | 07.14, 05.22 |
| 07.22 | Packing Advanced Features | M | 3-4 | 07.11 |
| 07.23 | Customer Pricing Agreements | M | 4-5 | 07.1, 07.2 |
| 07.24 | Shipping Reports & Analytics | L | 7-10 | 07.2, 07.14 |

**Critical Path (Phase 2-3):** Can parallelize into 3 tracks → **~14-17 days with parallel execution**

---

## Updated Timeline Estimate

| Phase | Stories | Sequential Days | Parallel Days | Status |
|-------|---------|----------------|---------------|--------|
| Phase 1 (MVP) | 16 | 60-79 | 40-50 | STORIES DEFINED ✅ |
| Phase 2-3 (Advanced) | 8 | 48-64 | 14-17 | STORIES DEFINED ✅ |
| **TOTAL** | **24** | **108-143** | **54-67** | **0% implemented** |

**Note:** Phase 2-3 can start after Phase 1 core features (07.1-07.14) complete.

---

## Blockers & Risks

| Blocker/Risk | Impact | Status | Mitigation |
|--------------|--------|--------|------------|
| Epic 05 dependency (allocation) | CRITICAL | RESOLVED ✅ | Epic 05 COMPLETE 2026-01-09 |
| Sales order complexity | HIGH | MITIGATED | Stories well-defined, clear AC |
| Carrier API integration | MEDIUM | PLANNED | Use 07.20 for Phase 2 carrier work |
| Multi-carrier support | MEDIUM | PLANNED | Start with 1 carrier, expand later |

---

**Generated:** 2026-01-15 08:45 UTC
**Author:** ORCHESTRATOR + ARCHITECT-AGENT
**Epic Owner:** Shipping Module
**Story Definition:** 100% complete (24 stories, ~850KB documentation)
**Implementation Status:** Ready to start (all dependencies satisfied)
