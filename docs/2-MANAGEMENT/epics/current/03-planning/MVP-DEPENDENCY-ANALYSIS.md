# Epic 03 Planning - MVP Dependency Analysis

**Date:** 2025-12-16
**Status:** READY FOR IMPLEMENTATION
**Conclusion:** Epic 03 requires Epic 01.1 (Org+RLS), Epic 01.X (Warehouses, Tax Codes), and Epic 02.1 (Products), 02.4 (BOMs), 02.7 (Routings). LP-dependent stories deferred.

---

## Executive Summary

Analysis of Epic 03 (Planning Module) reveals a well-scoped MVP that creates the operational backbone connecting Technical Module to Production and Warehouse operations.

**Key Finding:** Epic 03 has 4 stories that depend on License Plates (Epic 05). These are properly deferred, allowing the remaining 15 stories to proceed without blockers.

**Recommendation:** Proceed with Epic 03 MVP (10 stories) after Epic 01 foundation and Epic 02 core stories are complete. The deferred stories (03.9b, 03.11b, 03.13, 03.14) can be implemented after Epic 05.

---

## Module Dependency Matrix

```
+---------------------------------------------------------------------------+
|              PLANNING MODULE PROVIDES TO DOWNSTREAM EPICS                  |
+-----------+------------+-------------+-------------+----------------------+
| Planning  | Production | Warehouse   | Quality     | Finance              |
| Provides  | Epic 04    | Epic 05     | Epic 06     | Epic 09              |
+-----------+------------+-------------+-------------+----------------------+
| WO        | HARD       | SOFT        | -           | -                    |
| wo_mats   | HARD       | SOFT        | -           | -                    |
| wo_ops    | HARD       | -           | -           | -                    |
| PO        | -          | HARD        | -           | SOFT                 |
| TO        | -          | HARD        | -           | -                    |
| Suppliers | -          | SOFT        | SOFT        | SOFT                 |
+-----------+------------+-------------+-------------+----------------------+

+---------------------------------------------------------------------------+
|              PLANNING MODULE REQUIRES FROM OTHER EPICS                     |
+-----------+------------+------------+-------------+------------------------+
| Planning  | Settings   | Settings   | Technical   | Warehouse              |
| Needs     | Epic 01.1  | Epic 01.X  | Epic 02     | Epic 05                |
|           | (Org+RLS)  | (Infra)    |             | (LPs)                  |
+-----------+------------+------------+-------------+------------------------+
| Org+RLS   | HARD       | -          | -           | -                      |
| Users     | HARD       | -          | -           | -                      |
| Roles     | HARD       | -          | -           | -                      |
+-----------+------------+------------+-------------+------------------------+
| Warehouses| -          | HARD       | -           | -                      |
| Tax Codes | -          | HARD       | -           | -                      |
| Lines     | -          | OPTIONAL   | -           | -                      |
| Machines  | -          | OPTIONAL   | -           | -                      |
+-----------+------------+------------+-------------+------------------------+
| Products  | -          | -          | HARD        | -                      |
| BOMs      | -          | -          | HARD (WO)   | -                      |
| BOM Items | -          | -          | HARD (WO)   | -                      |
| Routings  | -          | -          | OPTIONAL    | -                      |
| Rout Ops  | -          | -          | OPTIONAL    | -                      |
+-----------+------------+------------+-------------+------------------------+
| LPs       | -          | -          | -           | DEFERRED (4 stories)   |
+-----------+------------+------------+-------------+------------------------+

Legend:
- HARD = System breaks without it
- SOFT = Works but limited functionality
- OPTIONAL = Feature works if present, gracefully handles absence
- DEFERRED = Required for future story (after Epic 05)
```

---

## Dependency Graph (Visual)

```
                         +-----------------+
                         |   SETTINGS      |
                         |   Epic 01.1     |
                         |   (Org+RLS)     |
                         +--------+--------+
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
           +----------------+          +----------------+
           | SETTINGS 01.X  |          |   TECHNICAL    |
           | (Warehouses,   |          |   Epic 02      |
           |  Tax Codes)    |          | (Products,     |
           +-------+--------+          |  BOMs, Rtgs)   |
                   |                   +-------+--------+
                   |                           |
                   +-------------+-------------+
                                 |
                                 v
                         +----------------+
                         |    PLANNING    |
                         |    Epic 03     |
                         +-------+--------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
+----------------+      +----------------+      +----------------+
| SUPPLIERS      |      | ORDERS         |      | WORK ORDERS    |
| (03.1, 03.2)   |      | (PO: 03.3-03.6)|      | (03.10-03.14)  |
|                |      | (TO: 03.8-03.9)|      |                |
+----------------+      +-------+--------+      +-------+--------+
                                |                       |
                                v                       v
                        +----------------+      +----------------+
                        |   WAREHOUSE    |      |  PRODUCTION    |
                        |   Epic 05      |<-----|   Epic 04      |
                        | (PO Receive,   |      | (WO Execute)   |
                        |  TO Ship/Recv) |      +----------------+
                        +-------+--------+
                                |
                                v
                        +----------------+
                        | DEFERRED       |
                        | LP-Dependent   |
                        | (03.9b, 03.11b,|
                        |  03.13, 03.14) |
                        +----------------+
```

---

## Current vs Required MVP Scope

### Current Epic 03 Scope (19 Total Stories)

| Category | Stories | Count |
|----------|---------|-------|
| MVP (P0) | 03.1, 03.2, 03.3, 03.4, 03.8, 03.10, 03.11a, 03.12, 03.15, 03.16 | 10 |
| Phase 1 (P1) | 03.5a, 03.5b, 03.6, 03.9a, 03.17 | 5 |
| Deferred (Epic 05+) | 03.9b, 03.11b, 03.13, 03.14 | 4 |
| **Total** | | **19** |

### What Epic 03 Creates for Downstream

| What Epic 03 Creates | Why Essential |
|----------------------|---------------|
| Suppliers | Vendor master data for procurement |
| Supplier-Products | Product sourcing with lead times |
| Purchase Orders | Procurement lifecycle, triggers receiving |
| Transfer Orders | Inter-warehouse movements |
| Work Orders | Production planning, triggers execution |
| wo_materials | Material requirements for production |
| wo_operations | Process steps for production |
| Planning Settings | Module configuration |

### What Epic 03 Defers (Safe)

| What Deferred | Why Safe |
|---------------|----------|
| TO LP Pre-Selection (03.9b) | Requires LP table from Epic 05 |
| WO Material Reservation (03.11b) | Requires LP table for reservations |
| WO Material Availability (03.13) | Requires LP inventory queries |
| WO Gantt Chart (03.14) | Complex viz, Could Have priority |

---

## Dependency Analysis by Story

### Suppliers (03.1, 03.2)

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 03.1 | 01.1 (Org+RLS), 01.X (Tax Codes) | suppliers table | 03.2, 03.3 |
| 03.2 | 03.1, 02.1 (Products) | supplier_products | 03.3, 03.4 |

### Purchase Orders (03.3-03.6)

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 03.3 | 03.1, 03.2, 01.X (Warehouses) | purchase_orders, po_lines | Epic 05, 03.4 |
| 03.4 | 03.3 | Bulk PO feature | Efficiency |
| 03.5a | 03.3, 03.16 | Approval config | 03.5b |
| 03.5b | 03.5a | Approval workflow | Process control |
| 03.6 | 03.16 | Configurable statuses | Flexibility |

### Transfer Orders (03.8-03.9)

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 03.8 | 01.X (Warehouses), 02.1 | transfer_orders, to_lines | Epic 05, 03.9a |
| 03.9a | 03.8 | Partial shipment feature | Flexibility |
| 03.9b | 03.8, Epic 05 (LPs) | to_line_lps | **DEFERRED** |

### Work Orders (03.10-03.14)

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 03.10 | 02.1, 02.4 (BOMs), 01.X (Lines) | work_orders | Epic 04, 03.11a |
| 03.11a | 03.10, 02.5a (BOM Items) | wo_materials | Epic 04 |
| 03.11b | 03.11a, Epic 05 (LPs) | Material reservations | **DEFERRED** |
| 03.12 | 03.10, 02.8 (Routing Ops) | wo_operations | Epic 04 |
| 03.13 | 03.10, Epic 05 (LPs) | Availability check | **DEFERRED** |
| 03.14 | 03.10, 03.12 | Gantt visualization | **DEFERRED** |

### Dashboard & Settings (03.15-03.16)

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 03.15 | 03.3, 03.8, 03.10 | Dashboard UI | Visibility |
| 03.16 | 01.1 | planning_settings | All Planning stories |

---

## Story Index with Dependencies

| Story | Name | Priority | Complexity | Dependencies | Status |
|------:|------|----------|------------|--------------|--------|
| 03.1 | Suppliers CRUD | P0 | M | 01.1, 01.X | Ready |
| 03.2 | Supplier-Products | P0 | M | 03.1, 02.1 | Ready |
| 03.3 | PO CRUD + Lines | P0 | L | 03.1, 03.2, 01.X | Ready |
| 03.4 | Bulk PO Creation | P0 | M | 03.3 | Ready |
| 03.5a | PO Approval Setup | P1 | S | 03.3, 03.16 | Ready |
| 03.5b | PO Approval Workflow | P1 | M | 03.5a | Ready |
| 03.6 | Configurable PO Status | P1 | M | 03.16 | Ready |
| 03.8 | TO CRUD + Lines | P0 | L | 01.X, 02.1 | Ready |
| 03.9a | TO Partial Shipments | P1 | S | 03.8 | Ready |
| 03.9b | TO LP Pre-Selection | P1 | M | 03.8, Epic 05 | **DEFERRED** |
| 03.10 | WO CRUD + BOM Auto | P0 | L | 02.1, 02.4, 01.X | Ready |
| 03.11a | WO Materials Snapshot | P0 | L | 03.10, 02.5a | Ready |
| 03.11b | WO Material Reserve | P1 | M | 03.11a, Epic 05 | **DEFERRED** |
| 03.12 | WO Operations Copy | P0 | M | 03.10, 02.8 | Ready |
| 03.13 | WO Material Avail | P1 | M | 03.10, Epic 05 | **DEFERRED** |
| 03.14 | WO Gantt Chart | P2 | L | 03.10, 03.12 | **DEFERRED** |
| 03.15 | Planning Dashboard | P0 | M | 03.3, 03.8, 03.10 | Ready |
| 03.16 | Planning Settings | P0 | M | 01.1 | Ready |
| 03.17 | Configurable WO Status | P1 | M | 03.16 | Ready |

**Total Stories:** 19 (15 ready + 4 deferred)
**MVP Stories:** 10 (P0)
**Phase 1 Stories:** 5 (P1, not LP-dependent)
**Deferred Stories:** 4 (require Epic 05)

---

## Effort Estimation

### By Phase (1 developer)

| Phase | Stories | Complexity Mix | Days |
|-------|---------|----------------|------|
| MVP Foundation | 03.1, 03.2, 03.16 | M+M+M | 4-5 |
| MVP PO | 03.3, 03.4 | L+M | 4-6 |
| MVP TO | 03.8 | L | 3-4 |
| MVP WO | 03.10, 03.11a, 03.12 | L+L+M | 6-8 |
| MVP Dashboard | 03.15 | M | 2-3 |
| **Total MVP** | **10 stories** | | **19-26 days** |
| Phase 1 (non-LP) | 03.5a, 03.5b, 03.6, 03.9a, 03.17 | S+M+M+S+M | 5-7 |
| **Total Ready** | **15 stories** | | **24-33 days** |

### Deferred (After Epic 05)

| Story | Dependencies | Days |
|-------|--------------|------|
| 03.9b | Epic 05 LPs | 2-3 |
| 03.11b | Epic 05 LPs | 3-4 |
| 03.13 | Epic 05 LPs | 3-4 |
| 03.14 | 03.10, 03.12 | 4-5 |
| **Total Deferred** | | **12-16 days** |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| BOM snapshot logic bugs | High | Medium | Comprehensive tests, opus model |
| Status lifecycle inconsistencies | Medium | Medium | State machine validation |
| LP dependency blocks features | Low | N/A | Stories properly deferred |
| Warehouse validation (same warehouse TO) | Low | Medium | AC covers validation |
| Bulk PO grouping errors | Low | Low | Unit tests for grouping |
| Approval workflow edge cases | Medium | Medium | Scenario-based testing |
| WO-BOM date matching bugs | Medium | Medium | Integration tests |

### Dependency Risks (All Mitigated)

| Dependency | Risk | Mitigation Status |
|------------|------|-------------------|
| Epic 01.1 (Org+RLS) | REQUIRED | Must complete first |
| Epic 01.X (Warehouses) | REQUIRED | Must complete first |
| Epic 02.1 (Products) | REQUIRED | Must complete first |
| Epic 02.4/02.5a (BOMs) | REQUIRED | Must complete first |
| Epic 02.7/02.8 (Routings) | OPTIONAL | Nullable FK, graceful handling |
| Epic 05 (LPs) | MITIGATED | 4 stories properly deferred |

---

## Implementation Path

```
Epic 01.1 (Org + RLS) --> Epic 01.X (Warehouses, Tax Codes)
    |
    v
Epic 02.1 (Products) --> Epic 02.4/02.5a (BOMs) --> Epic 02.7/02.8 (Routings)
    |
    v
Epic 03 MVP (03.1, 03.2, 03.3, 03.4, 03.8, 03.10, 03.11a, 03.12, 03.15, 03.16)
    |
    +---> Epic 04 Production CAN START (has WO, wo_materials, wo_operations)
    |
    +---> Epic 05 Warehouse CAN START (has PO, TO for receiving/transfer)
    |
    v
Epic 05 Complete (License Plates created)
    |
    v
Epic 03 Deferred Stories (03.9b, 03.11b, 03.13, 03.14)
```

---

## Conclusion

**Epic 03 Planning Module is READY FOR IMPLEMENTATION.**

### Key Strengths:

1. **Clear Dependencies**: Requires only Epic 01.1/01.X + Epic 02.1/02.4/02.7
2. **Smart Deferral**: LP-dependent stories (03.9b, 03.11b, 03.13, 03.14) properly deferred
3. **Optional FK Pattern**: Lines, Machines, Routings are NULLABLE - no hard blockers
4. **Complete Foundation**: 15 ready stories provide full operational backbone
5. **Enables Downstream**: Epic 04 and 05 can start after MVP complete

### What Makes This MVP Strong:

- **Suppliers + Products**: Complete vendor sourcing
- **Purchase Orders**: Full procurement lifecycle
- **Transfer Orders**: Inter-warehouse movements
- **Work Orders**: Production planning with BOM snapshots
- **Dashboard**: Real-time operational visibility
- **Settings**: Configurable behavior

### No Scope Changes Needed:

- Current 15 ready stories are sufficient for MVP + Phase 1
- Deferred stories (4) have clear prerequisite (Epic 05)
- Optional dependencies handled gracefully

**Status: GREEN - Proceed with implementation**

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial MVP dependency analysis | ARCHITECT-AGENT |
