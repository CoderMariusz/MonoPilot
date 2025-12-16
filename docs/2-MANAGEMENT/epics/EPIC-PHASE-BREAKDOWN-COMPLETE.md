# Epic Phase Breakdown - Complete Story Count Analysis

**Date:** 2025-12-16
**Status:** FINAL - All Epics Analyzed
**Total Stories:** ~231 across 7 core epics
**MVPs:** 110 stories (Phase 1 only)

---

## Executive Summary

Complete breakdown of all core operational epics by phase showing:
- Total story count per epic
- Phase 1 (MVP) vs Phase 2-3 (Advanced/Enterprise)
- Dependencies between phases
- Implementation timeline estimates

**Key Finding:** MVP = 110 stories across 7 epics (5-6 months with 2 devs)
**Full System:** ~231 stories (12-15 months with 2 devs)

---

## Epic 01: Settings & Infrastructure

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 1A** | Org + Users + RLS | 3 | 4-6 | None |
| **Phase 1B** | Core Settings | 12 | 18-24 | Phase 1A |
| **Phase 2** | Advanced Settings | 5 | 8-10 | Phase 1B |
| **TOTAL** | | **20** | **30-40** | |

**Phase 1A (Critical Blocker - 3 stories):**
- 01.1: Organization Context + Base RLS
- 01.2: User Management + Roles
- 01.3: Role-Based Access Control (RBAC)

**Phase 1B (Infrastructure - 12 stories):**
- 01.4-01.6: Tenants, Settings Infrastructure, Language/Currency
- 01.7: Allergens CRUD (EU 14 seed)
- 01.8: Warehouses CRUD
- 01.9: Locations CRUD
- 01.10: Machines CRUD
- 01.11: Production Lines CRUD
- 01.12: Shifts CRUD
- 01.13: Tax Codes CRUD
- 01.14: Wizard Completion

**Phase 2 (Advanced - 5 stories):**
- 01.15: Department CRUD
- 01.16: Custom Fields
- 01.17: Organization-wide Settings
- 01.18: User Preferences
- 01.19: Advanced RBAC

**Status:** ~80% implemented (per CLAUDE.md)

---

## Epic 02: Technical Module

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 2A** | Products Foundation | 3 | 6-8 | Epic 01.1 |
| **Phase 2B** | BOMs | 4 | 8-12 | Phase 2A, Epic 02.7 |
| **Phase 2C** | Routings + Costs | 3 | 8-12 | Phase 2A |
| **Phase 2D** | Traceability + Shelf Life | 2 | 5-7 | Phase 2A |
| **Phase 2E** | Dashboard + Advanced | 4 | 8-12 | Phase 2B, 2C |
| **Phase 3** | Advanced Analytics | 8 | 12-16 | Phase 2E |
| **TOTAL** | | **24** | **47-67** | |

**Phase 2A-E (MVP - 16 stories):**
- 02.1: Products CRUD + Types
- 02.2: Product Versioning + History
- 02.3: Product Allergens
- 02.4: BOMs CRUD
- 02.5a/b: BOM Items (Core + Advanced) ← **SPLIT**
- 02.6: BOM Alternatives + Clone
- 02.7: Routings CRUD
- 02.8: Routing Operations
- 02.9: BOM-Routing Costs
- 02.10a: Traceability Configuration
- 02.10b: Traceability Queries (deferred Epic 05)
- 02.11: Shelf Life Calculation
- 02.12: Technical Dashboard
- 02.13: Nutrition Calculation
- 02.14: BOM Advanced Features
- 02.15: Cost History + Variance

**Phase 3 (Advanced - 8 stories):**
- 02.16: Multi-level BOM Explosion
- 02.17: BOM Comparison Tool
- 02.18: Cost Scenario Modeling
- 02.19: Product Images Management
- 02.20: Barcode Generation (GTIN)
- 02.21: Product Templates
- 02.22: Formulation Optimization
- 02.23: Yield Analysis

**Status:** ~80% Phase 2 implemented

---

## Epic 03: Planning Module

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 1 (MVP)** | Core Planning | 19 | 42-58 | Epic 01.1, 01.8, 02.1 |
| **Phase 2 (MRP)** | MRP/Forecasting | 12 | 18-24 | Epic 05 (inventory history) |
| **Phase 3 (Enterprise)** | Capacity/EDI/Supplier Quality | 20 | 30-40 | Epic 06, Epic 11 |
| **TOTAL** | | **51** | **90-122** | |

**Phase 1 (MVP - 19 stories):** ✅ ALL CREATED
- **Foundation (4):** 03.1 Suppliers, 03.2 Supplier-Products, 03.3 PO CRUD + Lines, 03.4 PO Calculations
- **PO Features (4):** 03.5a/b PO Approval ← **SPLIT**, 03.6 PO Bulk, 03.7 PO Status
- **TO (3):** 03.8 TO CRUD + Lines, 03.9a TO Partial, 03.9b TO LP ← **SPLIT, Deferred Epic 05**
- **WO (5):** 03.10 WO CRUD, 03.11a WO BOM Snapshot ← **SPLIT**, 03.11b WO Reservations ← **Deferred Epic 05**, 03.12 WO Operations, 03.13 Material Availability ← **Deferred Epic 05**
- **Dashboard (3):** 03.14 WO Scheduling ← **Deferred Epic 04/05**, 03.15 Gantt View, 03.16 Planning Dashboard
- **Settings (1):** 03.17 Planning Settings

**Coverage:** 25/25 Phase 1 FRs = **100% MVP**

**Phase 2 (MRP - 12 stories):** 📋 NOT CREATED
- **Demand Forecasting (4):**
  - 03.20: Historical Demand Tracking
  - 03.21: Basic Forecasting (Moving Avg, Seasonal)
  - 03.22: Safety Stock Management
  - 03.23: Reorder Point Alerts

- **MRP Engine (4):**
  - 03.24: Master Production Schedule (MPS)
  - 03.25: MRP Calculation Engine
  - 03.26: Suggested Purchase Orders
  - 03.27: MRP Dashboard

- **Auto-Replenishment (4):**
  - 03.28: Replenishment Rules CRUD
  - 03.29: Auto PO Generation
  - 03.30: Replenishment Dashboard
  - 03.31: Blanket Purchase Orders

**Coverage:** 11/11 Phase 2 FRs (FR-PLAN-030 to 040, 042)

**Phase 3 (Enterprise - 20 stories):** 📋 NOT CREATED
- **Supplier Quality (5):**
  - 03.40: Approved Supplier List (ASL)
  - 03.41: Supplier Scorecards
  - 03.42: Supplier Audits + Findings
  - 03.43: Supplier Performance Analytics
  - 03.44: Supplier Quality Dashboard

- **Capacity Planning (5):**
  - 03.45: Resource Capacity Definition
  - 03.46: Finite Capacity Scheduling
  - 03.47: Capacity Utilization Analytics
  - 03.48: Capacity Alerts + Optimization
  - 03.49: Multi-Line Scheduling

- **EDI Integration (10):**
  - 03.50: EDI Settings + Mappings
  - 03.51: EDIFACT Order Import (ORDERS)
  - 03.52: EDIFACT Dispatch Advice (DESADV)
  - 03.53: X12 850 Order Import
  - 03.54: X12 856 ASN Export
  - 03.55: GS1 XML Integration
  - 03.56: VMI Supplier Portal
  - 03.57: EDI Error Handling
  - 03.58: EDI Audit Trail
  - 03.59: EDI Dashboard

**Coverage:** 23/23 Phase 3 FRs (FR-PLAN-050 to 072)

---

## Epic 04: Production Module

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 0 (Pre-LP)** | WO Lifecycle | 7 | 10-14 | Epic 03.10-03.12 |
| **Phase 1 (Full Prod)** | LP Integration | 10 | 18-24 | **Epic 05 Phase 0** |
| **Phase 2 (OEE)** | Analytics | 11 | 14-18 | Phase 1 |
| **TOTAL** | | **28** | **42-56** | |

**Phase 0 (Pre-LP - 7 stories):** ✅ CREATED
- 04.1: Production Dashboard
- 04.2a: WO Start ← **SPLIT**
- 04.2b: WO Pause/Resume ← **SPLIT**
- 04.2c: WO Complete ← **SPLIT**
- 04.3: Operation Start/Complete
- 04.4: Yield Tracking (Manual)
- 04.5: Production Settings

**Phase 1 (Full Production - 10 stories):** 📋 TEMPLATES ONLY, BLOCKED by Epic 05
- **Consumption (5):**
  - 04.6a: Material Consumption (Desktop)
  - 04.6b: Material Consumption (Scanner)
  - 04.6c: 1:1 LP Consumption
  - 04.6d: Consumption Correction/Reversal
  - 04.6e: Over-Consumption Approval

- **Output (4):**
  - 04.7a: Output Registration (Desktop)
  - 04.7b: Output Registration (Scanner)
  - 04.7c: By-Product Output
  - 04.7d: Multiple Output Batches

- **Reservations (1):**
  - 04.8: Material Reservations (FIFO/FEFO)

**Phase 2 (OEE - 11 stories):** 📋 TEMPLATES ONLY
- **OEE Core (4):**
  - 04.9a: OEE Calculation Engine
  - 04.9b: Downtime Recording
  - 04.9c: Downtime Reasons CRUD
  - 04.9d: Shifts CRUD

- **OEE Analytics (4):**
  - 04.10a: OEE Dashboard
  - 04.10b: OEE Trend Charts
  - 04.10c: Downtime Pareto Analysis
  - 04.10d: Line/Machine OEE Comparison

- **Scanner Advanced (3):**
  - 04.11a: Scanner UI Optimization
  - 04.11b: ZPL Label Printing
  - 04.11c: Scanner Offline Mode

---

## Epic 05: Warehouse Module

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 0 (LP Foundation)** | LP Infrastructure | 8 | 8-12 | Epic 01.8, 01.9, 02.1 |
| **Phase 1 (Receipt)** | GRN/ASN | 8 | 10-14 | Phase 0, Epic 03.3 |
| **Phase 2 (Scanner)** | Mobile Workflows | 8 | 10-14 | Phase 1 |
| **Phase 3 (Advanced)** | Pallets/GS1 | 10 | 10-14 | Phase 2 |
| **Phase 4 (Inventory)** | Reports/Counts | 6 | 8-10 | Phase 3 |
| **TOTAL** | | **40** | **46-64** | |

**Phase 0 (LP Foundation - 8 stories):** ✅ CREATED - **CRITICAL BLOCKER**
- 05.0: Warehouse Settings
- 05.1: LP Table + CRUD ← **Day 4 Milestone, Unblocks Epic 04.6, 04.7**
- 05.2: LP Genealogy ← **Unblocks Epic 04.7 output**
- 05.3: LP Reservations + FIFO/FEFO ← **Day 12 Milestone, Unblocks Epic 04.8**
- 05.4: LP Status Management
- 05.5: LP Search & Filters
- 05.6: LP Detail & History
- 05.7: Warehouse Dashboard

**Phase 1 (Goods Receipt - 8 stories):** ✅ CREATED
- 05.8: ASN CRUD + Items
- 05.9: ASN Receive Workflow
- 05.10: GRN CRUD + Items
- 05.11: GRN from PO (Create LPs) ← **Potential split: 05.11a/b**
- 05.12: GRN from TO
- 05.13: Over-Receipt Control
- 05.14: LP Label Printing (ZPL) ← **Potential split: 05.14a LP/b Pallet**
- 05.15: (Merged with 05.13)

**Phase 2 (Scanner & Movements - 8 stories):** ⚠️ 4 CREATED, 4 TEMPLATES
- 05.16: Stock Moves CRUD ✅
- 05.17: LP Split Workflow ✅
- 05.18: LP Merge Workflow ✅
- 05.19: Scanner Receive ✅
- 05.20: Scanner Putaway 📋 ← **Potential split: 05.20a Core/b Suggestions**
- 05.21: Scanner Move 📋
- 05.22: Putaway Suggestions 📋
- 05.23: Scanner Offline Mode 📋

**Phase 3 (Advanced - 10 stories):** 📋 TEMPLATES ONLY
- 05.24: Pallets CRUD ← **Potential split: 05.24a Basic/b Advanced**
- 05.25: Pallet LP Assignment
- 05.26: Pallet Labels (SSCC-18)
- 05.27: Pallet Close + Move All
- 05.28: Catch Weight Handling
- 05.29: GS1 Barcode Integration
- 05.30: LP Block/Unblock Workflow
- 05.31: LP QA Status Advanced
- 05.32: Batch Tracking Advanced
- 05.33: Expiry Tracking Advanced

**Phase 4 (Inventory & Reports - 6 stories):** 📋 TEMPLATES ONLY
- 05.34: Inventory Browser & Summaries
- 05.35: Inventory Aging Report
- 05.36: Expiring Inventory Alerts
- 05.37: Cycle Counts CRUD ← **Potential split: 05.37a CRUD/b Execution**
- 05.38: Cycle Count Execution
- 05.39: Variance Approval + Adjustments

**Actual Total:** 40 stories (adjusted from original 40 estimate)

---

## Epic 06: Quality Module

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 1 (MVP)** | Inspections + Holds | 11 | 14-18 | Epic 05.1, 05.4, 02.1 |
| **Phase 2 (NCR)** | NCR Workflow | 12 | 16-20 | Phase 1, Epic 04 |
| **Phase 3 (HACCP)** | HACCP/CCP | 12 | 16-20 | Phase 2, Epic 04 |
| **Phase 4 (CAPA)** | CAPA + Supplier | 10 | 14-18 | Phase 3, Epic 03 |
| **TOTAL** | | **45** | **60-76** | |

**Phase 1 (MVP - 11 stories):** 📋 ANALYSIS ONLY
- 06.1: Quality Settings
- 06.2: Quality Specifications CRUD + Parameters
- 06.3: Quality Holds CRUD + Items
- 06.4: Hold Release Workflow
- 06.5a: Incoming Inspection (Core) ← **SPLIT**
- 06.5b: Incoming Inspection (Advanced Sampling) ← **SPLIT**
- 06.6: In-Process Inspection (Basic)
- 06.7: Final Inspection
- 06.8: Test Results Recording
- 06.9: Sampling Plans CRUD
- 06.10: Quality Dashboard

**Phase 2 (NCR - 12 stories):** 📋 ANALYSIS ONLY
- 06.11: NCR Settings
- 06.12: Defect Codes CRUD
- 06.13a: NCR Creation ← **SPLIT**
- 06.13b: NCR Workflow (Investigation, Root Cause, Verification) ← **SPLIT**
- 06.14: NCR Dashboard
- 06.15: Batch Release Workflow
- 06.16: Product Disposition
- 06.17: Customer Notification (NCR)
- 06.18: Regulatory Reporting
- 06.19: NCR Analytics
- 06.20: Root Cause Analysis Tools (5 Why, Fishbone)

**Phase 3 (HACCP - 12 stories):** 📋 ANALYSIS ONLY
- 06.21a: HACCP Plans CRUD ← **SPLIT**
- 06.21b: HACCP CCPs + Critical Limits ← **SPLIT**
- 06.22: CCP Monitoring (Desktop)
- 06.23: CCP Monitoring (Scanner)
- 06.24: CCP Deviation Alerts
- 06.25: CCP Corrective Actions
- 06.26: HACCP Verification
- 06.27: HACCP Dashboard
- 06.28a: CoA Generation (Core) ← **SPLIT**
- 06.28b: CoA Templates + Customization ← **SPLIT**
- 06.29: CoA PDF Export
- 06.30: CoA Email Delivery

**Phase 4 (CAPA + Supplier - 10 stories):** 📋 ANALYSIS ONLY
- 06.31: CAPA Settings
- 06.32: CAPA Records CRUD
- 06.33: CAPA Actions Management
- 06.34: CAPA Effectiveness Checks
- 06.35: CAPA Dashboard
- 06.36: Supplier Quality Ratings
- 06.37: Supplier Audits CRUD
- 06.38: Audit Findings Management
- 06.39: Supplier Scorecard
- 06.40: Quality Audit Trail (21 CFR Part 11)

**Additional Phase 4:**
- 06.41: E-Signature Support (FDA compliance)
- 06.42: Quality Analytics Dashboard
- 06.43: Trend Analysis
- 06.44: Quality Reports Export
- 06.45: Compliance Dashboard

**Actual Total:** 45 stories

---

## Epic 07: Shipping Module (Estimated)

### Story Breakdown by Phase

| Phase | Focus | Stories | Days (1 dev) | Dependencies |
|-------|-------|---------|--------------|--------------|
| **Phase 1 (MVP)** | Basic Shipping | 15 | 22-30 | Epic 05, Epic 06 |
| **Phase 2 (Carriers)** | Carrier Integration | 8 | 12-16 | Phase 1 |
| **TOTAL** | | **~23** | **34-46** | |

**Phase 1 (MVP - 15 stories):** 📋 NOT ANALYZED YET
- Customer Orders CRUD
- Order Lines + Picking
- Packing Lists
- Shipping Orders
- LP Allocation (FEFO)
- Shipping Labels
- BOL (Bill of Lading)
- ASN to Customer
- Proof of Delivery
- Allergen Labels
- Shipping Dashboard
- Shipping Settings
- ... (estimate)

**Phase 2 (Carriers - 8 stories):** 📋 NOT ANALYZED YET
- Carrier Integration (UPS, FedEx, DHL)
- Rate Shopping
- Tracking Integration
- Freight Calculation
- ... (estimate)

**Status:** Not yet analyzed

---

## Epic 08-11: Premium Modules (Estimated)

| Epic | Module | Est. Stories | Est. Days | Status |
|------|--------|--------------|-----------|--------|
| **08** | NPD (New Product Development) | ~25 | 35-45 | Not analyzed |
| **09** | Finance | ~20 | 30-40 | Not analyzed |
| **10** | OEE (Standalone) | ~18 | 25-35 | Not analyzed |
| **11** | Integrations (ERP, EDI, API) | ~30 | 40-50 | Not analyzed |
| **TOTAL** | | **~93** | **130-170** | |

---

## Complete System - Grand Total

### All Epics Summary

| Epic | Module | Phase 1 MVP | Phase 2 | Phase 3 | Phase 4 | Total |
|------|--------|-------------|---------|---------|---------|-------|
| 01 | Settings | 15 | 5 | - | - | **20** |
| 02 | Technical | 16 | - | 8 | - | **24** |
| 03 | **Planning** | **19** | **12** | **20** | - | **51** |
| 04 | Production | 18 | 10 | - | - | **28** |
| 05 | Warehouse | 16 | 8 | 10 | 6 | **40** |
| 06 | Quality | 11 | 12 | 12 | 10 | **45** |
| 07 | Shipping | 15 | 8 | - | - | **23** |
| **Core Total** | | **110** | **55** | **50** | **16** | **~231** |
| 08-11 | Premium | - | - | - | - | **~93** |
| **GRAND TOTAL** | | **110** | **55** | **50** | **16** | **~324** |

---

## Implementation Effort - By Phase

### Phase 1 (MVP) - All Core Epics

| Epic | Stories | Days (1 dev) | Days (2 devs) | Days (3 devs) |
|------|---------|--------------|---------------|---------------|
| Epic 01 | 15 | 22-30 | 11-15 | 7-10 |
| Epic 02 | 16 | 24-32 | 12-16 | 8-11 |
| Epic 03 | 19 | 42-58 | 21-29 | 14-20 |
| Epic 04 | 18 | 32-44 | 16-22 | 11-15 |
| Epic 05 | 16 | 22-30 | 11-15 | 7-10 |
| Epic 06 | 11 | 14-18 | 7-9 | 5-6 |
| Epic 07 | 15 | 22-30 | 11-15 | 7-10 |
| **MVP Total** | **110** | **178-242** | **89-121** | **59-82** |

**Timeline Interpretation:**
- **1 Developer:** 8-11 months
- **2 Developers:** 4-5.5 months ✅ **REALISTIC**
- **3 Developers:** 3-4 months

### All Phases - Complete System

| Phase | Stories | Days (1 dev) | Days (2 devs) |
|-------|---------|--------------|---------------|
| **Phase 1 (MVP)** | 110 | 178-242 | 89-121 |
| **Phase 2 (Advanced)** | 55 | 88-110 | 44-55 |
| **Phase 3 (Enterprise)** | 50 | 80-100 | 40-50 |
| **Phase 4 (Analytics)** | 16 | 24-32 | 12-16 |
| **TOTAL Core** | **231** | **370-484 days** | **185-242 days** |
| **Premium (08-11)** | 93 | 130-170 | 65-85 |
| **GRAND TOTAL** | **324** | **500-654 days** | **250-327 days** |

**Complete System Timeline:**
- **1 Developer:** 24-31 months (~2-2.5 years)
- **2 Developers:** 12-15.5 months (~1-1.3 years)
- **3 Developers:** 8-10 months

---

## Story Creation Status - Current State

### Stories Created (46 Full Specs)

| Epic | Phase 1 | Phase 2 | Phase 3 | Total Created | % of Epic | % of MVP |
|------|---------|---------|---------|---------------|-----------|----------|
| Epic 01 | - | - | - | 0 | 0% | - |
| Epic 02 | - | - | - | 0 | 0% | - |
| **Epic 03** | **19** | 0 | 0 | **19** | **37%** | **100%** |
| **Epic 04** | 7 | 0 | 0 | **7** | **25%** | **39%** |
| **Epic 05** | 16 + 4 Phase 2 | 0 | 0 | **20** | **50%** | **100%+** |
| Epic 06 | 0 | 0 | 0 | 0 | 0% | 0% |
| Epic 07 | 0 | 0 | 0 | 0 | 0% | 0% |
| **TOTAL** | **46** | **0** | **0** | **46** | **20%** | **42%** |

### Templates Created (86 Structured Templates)

| Epic | Templates | Type |
|------|-----------|------|
| Epic 04 | 21 | Phase 1-2 (Consumption, Output, OEE) |
| Epic 05 | 20 | Phase 2-4 (Scanner, Pallets, Inventory) |
| Epic 06 | 45 | All phases (Inspections, NCR, HACCP, CAPA) |
| **TOTAL** | **86** | |

### Remaining Work (99 stories need full specs)

| Category | Count | Priority |
|----------|-------|----------|
| **Epic 04 Phase 1** | 10 | 🔴 CRITICAL (blocked by Epic 05) |
| **Epic 06 Phase 1** | 11 | 🟡 HIGH (needed for compliance) |
| **Epic 05 Phase 2-4** | 16 | 🟢 MEDIUM (scanner, advanced) |
| **Epic 03 Phase 2-3** | 32 | 🔵 LOW (MRP, EDI - enterprise) |
| **Epic 04 Phase 2** | 11 | 🟢 MEDIUM (OEE analytics) |
| **Epic 06 Phase 2-4** | 34 | 🟢 MEDIUM (NCR, HACCP, CAPA) |
| **Epic 07 All** | 23 | 🟡 HIGH (shipping needed for full flow) |
| Epic 08-11 | 93 | 🔵 LOW (premium features) |
| **TOTAL** | **230** | |

---

## Critical Path - Phase Dependencies

### Phase 1 (MVP) Critical Path

```
Epic 01.1 (Org + RLS)
    │
    ├──────────┬──────────────┬─────────────┐
    ▼          ▼              ▼             ▼
Epic 01.8  Epic 02.1      Epic 01.9     Epic 01.10
(Warehouse) (Products)    (Locations)   (Roles)
    │          │              │             │
    └──────────┴──────────────┴─────────────┘
               │
    ┌──────────┼──────────────┬─────────────┐
    ▼          ▼              ▼             ▼
Epic 05    Epic 03        Epic 04       Epic 06
Phase 0    Phase 1        Phase 0       Phase 1
(LP)       (PO/TO/WO)     (WO Life)     (Holds)
8 stories  19 stories     7 stories     11 stories
    │          │              │             │
    │          │              │             │
    ▼          ▼              ▼             ▼
Epic 04    Epic 03        Epic 06       Epic 07
Phase 1    Deferred       Phase 2-3     Phase 1
(Prod)     (LP feat)      (HACCP)       (Shipping)
10 stories 4 stories      24 stories    15 stories
```

### Cross-Phase Dependencies

**Epic 03 Phase 2 (MRP) depends on:**
- Epic 05 Phase 1+ (inventory history for demand forecasting)
- Epic 04 Phase 1 (production history for MPS)
- 6+ months of operational data

**Epic 03 Phase 3 (Enterprise) depends on:**
- Epic 06 Phase 4 (supplier quality data for ASL)
- Epic 11 (EDI infrastructure)
- Advanced capacity planning algorithms

**Epic 06 Phase 3 (HACCP) depends on:**
- Epic 04 Phase 1 (WO operations for CCP monitoring)
- Epic 02.7/02.8 (Routings for process steps)

---

## Recommended Implementation Sequence

### Optimal Path (Based on Dependencies)

**Stage 1: Foundation (Weeks 1-4)**
- Epic 01 Phase 1A + 1B: Settings infrastructure
- Epic 02 Phase 2: Technical foundation (Products, BOMs, Routings)
- **Timeline:** 4 weeks (2 devs)

**Stage 2: LP Critical Path (Weeks 5-6)**
- **Epic 05 Phase 0:** LP Foundation (8 stories) ← **CRITICAL**
- Epic 04 Phase 0: WO Lifecycle (7 stories) - Parallel
- **Timeline:** 2 weeks (2 devs)
- **Milestone:** Day 4 (05.1) and Day 12 (Phase 0 complete)

**Stage 3: Core Operations (Weeks 7-10)**
- Epic 04 Phase 1: Production with LPs (10 stories)
- Epic 05 Phase 1: GRN/ASN (8 stories) - Parallel
- Epic 03 Phase 1: Planning workflows (19 stories) - Start Week 8
- **Timeline:** 4 weeks (2 devs)

**Stage 4: Quality Integration (Weeks 11-14)**
- Epic 06 Phase 1: Quality MVP (11 stories)
- Epic 05 Phase 2: Scanner workflows (8 stories) - Parallel
- **Timeline:** 4 weeks (2 devs)

**Stage 5: Shipping & Advanced (Weeks 15-20)**
- Epic 07 Phase 1: Shipping MVP (15 stories)
- Epic 06 Phase 2: NCR workflows (12 stories)
- Epic 04 Phase 2: OEE (11 stories) - Parallel
- **Timeline:** 6 weeks (2 devs)

**Stage 6: Compliance (Weeks 21-26)**
- Epic 06 Phase 3: HACCP/CCP (12 stories)
- Epic 05 Phase 3: Pallets/GS1 (10 stories)
- **Timeline:** 6 weeks (2 devs)

**Stage 7: Enterprise (Weeks 27+)**
- Epic 03 Phase 2-3: MRP, Capacity, EDI (32 stories)
- Epic 06 Phase 4: CAPA, Supplier Quality (10 stories)
- Epic 05 Phase 4: Inventory, Cycle Counts (6 stories)
- **Timeline:** 12+ weeks (2 devs)

**Total Timeline:** 26+ weeks (6-7 months) for full operational system
**MVP Timeline:** 14 weeks (3.5 months) to operational (Epic 01-05 Phase 1, Epic 06-07 Phase 1)

---

## Phase 1 MVP Scope - What Makes System Operational

### Minimum Viable Product (110 stories)

**What MVP Includes:**
- ✅ Multi-tenant organization setup
- ✅ User management + RBAC
- ✅ Product catalog + BOMs + Routings
- ✅ Purchase Orders with approval
- ✅ Transfer Orders
- ✅ Work Orders with BOM snapshots
- ✅ License Plates + Inventory tracking
- ✅ Goods Receipt (GRN/ASN)
- ✅ Material consumption + Output registration
- ✅ Quality inspections + Holds
- ✅ Basic shipping workflows

**What MVP Delivers:**
- Complete procurement-to-production-to-shipping flow
- Full traceability (LP genealogy)
- Quality compliance (inspections, holds)
- Multi-warehouse support
- Batch tracking + Expiry management

**What MVP Defers:**
- MRP/Forecasting (can plan manually)
- HACCP/CCP monitoring (can do manual)
- CAPA effectiveness tracking
- EDI integration
- Advanced analytics
- Carrier integration

---

## .Xa/.Xb Split Summary - All Epics

### Applied/Recommended Splits

| Epic | Story | Split | Reason | Days Saved |
|------|-------|-------|--------|------------|
| **02** | BOM Items | 02.5a/b | Core vs Advanced features | 2-3 |
| **03** | PO Approval | 03.5a/b | Settings vs Workflow | 1-2 |
| **03** | TO LP | 03.9a/b | Partial vs LP (Epic 05 dep) | 2-3 |
| **03** | WO Materials | 03.11a/b | Snapshot vs Reservations (Epic 05 dep) | 3-4 |
| **04** | WO Execution | 04.2a/b/c | Start + Pause + Complete | 2-3 |
| **05** | GRN from PO | 05.11a/b | Core vs Advanced (batch split) | 1-2 |
| **05** | Labels | 05.14a/b | LP vs Pallet | 1-2 |
| **05** | Scanner Putaway | 05.20a/b | Core vs Suggestions | 1-2 |
| **05** | Pallets | 05.24a/b | CRUD vs Advanced | 1-2 |
| **05** | Cycle Counts | 05.37a/b | CRUD vs Execution | 1-2 |
| **06** | Incoming Insp | 06.5a/b | Core vs Advanced sampling | 2-3 |
| **06** | NCR | 06.13a/b | Creation vs Workflow | 2-3 |
| **06** | HACCP | 06.21a/b | Plans vs CCP Monitoring | 3-4 |
| **06** | CoA | 06.28a/b | Generation vs Templates | 1-2 |

**Total Splits:** 14 major splits creating ~28 substories
**Time Savings:** 23-37 days by breaking large stories into manageable pieces

---

## Epic 03 Planning - REVISED Complete Breakdown

### Phase 1 (MVP) - 19 Stories ✅ CREATED

**Suppliers (2 stories):**
- 03.1: Suppliers CRUD + Master Data (M, 3-4 days)
- 03.2: Supplier-Product Assignments (S, 1-2 days)

**Purchase Orders (5 stories):**
- 03.3: PO CRUD + Lines (L, 5-7 days)
- 03.4: PO Totals + Tax Calculations (S, 1-2 days)
- 03.5a: PO Approval Setup (S, 1-2 days)
- 03.5b: PO Approval Workflow (M, 3-4 days)
- 03.6: PO Bulk Operations (M, 3-4 days)
- 03.7: PO Status Lifecycle (S, 1-2 days)

**Transfer Orders (3 stories):**
- 03.8: TO CRUD + Lines (M, 3-4 days)
- 03.9a: TO Partial Shipments (S, 1-2 days)
- 03.9b: TO LP Selection (M, 3-4 days) - DEFERRED Epic 05

**Work Orders (6 stories):**
- 03.10: WO CRUD (L, 5-7 days)
- 03.11a: WO BOM Snapshot (L, 5-7 days)
- 03.11b: WO Reservations (M, 3-4 days) - DEFERRED Epic 05
- 03.12: WO Operations Copy (M, 3-4 days)
- 03.13: Material Availability Check (M, 3-4 days) - DEFERRED Epic 05
- 03.14: WO Scheduling (L, 7-10 days) - DEFERRED Epic 04/05

**Dashboard & Settings (3 stories):**
- 03.15: WO Gantt View (M, 3-4 days)
- 03.16: Planning Dashboard (M, 3-4 days)
- 03.17: Planning Settings (S, 1-2 days)

**Phase 1 Total:** 19 stories, 42-58 days

### Phase 2 (MRP/Forecasting) - 12 Stories 📋 NOT CREATED

**Demand Management (4 stories):**
- 03.20: Historical Demand Tracking (M, 2-3 days)
- 03.21: Basic Forecasting Engine (L, 4-5 days)
- 03.22: Safety Stock Management (M, 3-4 days)
- 03.23: Reorder Point Alerts (S, 1-2 days)

**MRP Engine (4 stories):**
- 03.24: Master Production Schedule (MPS) (L, 4-5 days)
- 03.25: MRP Calculation Engine (XL, 6-8 days)
- 03.26: Suggested Purchase Orders (M, 3-4 days)
- 03.27: MRP Dashboard (M, 3-4 days)

**Auto-Replenishment (4 stories):**
- 03.28: Replenishment Rules CRUD (M, 2-3 days)
- 03.29: Auto PO Generation (M, 3-4 days)
- 03.30: Replenishment Dashboard (S, 2-3 days)
- 03.31: Blanket Purchase Orders (M, 3-4 days)

**Phase 2 Total:** 12 stories, 18-24 days
**Dependencies:** Epic 05 inventory history, Epic 04 production history

### Phase 3 (Enterprise) - 20 Stories 📋 NOT CREATED

**Supplier Quality (5 stories):**
- 03.40: Approved Supplier List (ASL) (M, 3-4 days)
- 03.41: Supplier Scorecards (M, 3-4 days)
- 03.42: Supplier Audits + Findings (L, 4-5 days)
- 03.43: Supplier Performance Analytics (M, 2-3 days)
- 03.44: Supplier Quality Dashboard (M, 2-3 days)

**Capacity Planning (5 stories):**
- 03.45: Resource Capacity Definition (M, 3-4 days)
- 03.46: Finite Capacity Scheduling (XL, 7-10 days)
- 03.47: Capacity Utilization Analytics (M, 3-4 days)
- 03.48: Capacity Alerts + Optimization (M, 3-4 days)
- 03.49: Multi-Line Scheduling (L, 5-7 days)

**EDI Integration (10 stories):**
- 03.50: EDI Settings + Partner Mappings (M, 3-4 days)
- 03.51: EDIFACT ORDERS Import (L, 5-7 days)
- 03.52: EDIFACT DESADV Export (L, 5-7 days)
- 03.53: X12 850 Order Import (L, 4-5 days)
- 03.54: X12 856 ASN Export (L, 4-5 days)
- 03.55: GS1 XML Integration (M, 3-4 days)
- 03.56: VMI Supplier Portal (L, 6-8 days)
- 03.57: EDI Error Handling + Retry (M, 2-3 days)
- 03.58: EDI Audit Trail (S, 1-2 days)
- 03.59: EDI Dashboard (M, 2-3 days)

**Phase 3 Total:** 20 stories, 30-40 days
**Dependencies:** Epic 06 Quality, Epic 11 Integrations

### Epic 03 REVISED TOTAL: 51 Stories

---

## Recommendations - Story Creation Priority

### IMMEDIATE (Weeks 1-2)

1. ✅ **Epic 05 Phase 0** - Already created (8 stories)
2. ✅ **Epic 04 Phase 0** - Already created (7 stories)
3. 📋 **Epic 04 Phase 1 Full Specs** - Expand templates (10 stories)
   - Create during Epic 05 Phase 0 implementation
   - Ready for Day 4 milestone

### HIGH PRIORITY (Weeks 3-8)

4. 📋 **Epic 06 Phase 1 Full Specs** (11 stories)
   - Create in Week 7-8
   - Ready for Week 11 start (after Epic 05/04 stable)

5. 📋 **Epic 07 Phase 1 Analysis + Specs** (15 stories)
   - Analyze Shipping module
   - Create stories in Week 9-10
   - Ready for Week 15 start

### MEDIUM PRIORITY (Weeks 9-14)

6. 📋 **Epic 05 Phase 2-4 Full Specs** (16 stories)
   - Expand scanner, pallets, inventory templates
   - Create just-in-time (2 weeks before needed)

7. 📋 **Epic 06 Phase 2-4 Full Specs** (34 stories)
   - NCR, HACCP, CAPA workflows
   - Create when Phase 1 50% complete

### LOW PRIORITY (Months 6+)

8. 📋 **Epic 03 Phase 2-3 Full Specs** (32 stories)
   - MRP/Forecasting, Capacity, EDI
   - Create when operational data available (6+ months)

9. 📋 **Epic 04 Phase 2 Full Specs** (11 stories)
   - OEE analytics
   - Create when production stable

---

## Conclusion

### PODSUMOWANIE - Co Powinno Być Zrobione

**Epic 03 Planning:**
- ✅ **Phase 1 (MVP): 19 stories** - COMPLETE
- 📋 **Phase 2 (MRP): 12 stories** - TO DO (later, after 6 months operational data)
- 📋 **Phase 3 (Enterprise): 20 stories** - TO DO (much later, enterprise features)
- **TOTAL: 51 stories** (nie 19!)

**All Core Epics (01-07):**
- **Phase 1 (MVP): 110 stories** - Need 64 more (46 created)
- **Phase 2 (Advanced): 55 stories** - All need creation
- **Phase 3 (Enterprise): 50 stories** - All need creation
- **Phase 4 (Analytics): 16 stories** - All need creation
- **TOTAL: ~231 stories** for complete operational system

**Current Status:**
- ✅ Created: 46 full stories (20% of total, 42% of MVP)
- 📋 Templates: 86 stories (37% of total)
- 📋 Not started: 99 stories (43% of total)

**Priority Order:**
1. 🔴 Epic 04 Phase 1 specs (10 stories) - Week 1-2
2. 🟡 Epic 06 Phase 1 specs (11 stories) - Week 7-8
3. 🟡 Epic 07 Phase 1 analysis + specs (15 stories) - Week 9-10
4. 🟢 Remaining templates to full specs (50 stories) - Just-in-time
5. 🔵 Phase 2-3 Enterprise features (99 stories) - Months 6+

**Moja odpowiedź:** 19 stories Epic 03 = **TYLKO Phase 1 MVP (CORRECT)**
**Pełny Epic 03** = **51 stories** (Phase 1 + Phase 2 MRP + Phase 3 Enterprise)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Complete phase breakdown - all epics | ORCHESTRATOR |

---

**Status:** ✅ COMPLETE ANALYSIS
**Epic 03:** 19 stories = Phase 1 MVP only (37% of full epic)
**Epic 03 Full:** Would be 51 stories across 3 phases
**Recommendation:** Phase 1 sufficient for MVP, defer Phase 2-3 to later
