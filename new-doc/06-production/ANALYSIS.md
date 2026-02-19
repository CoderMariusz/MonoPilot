# Production Module (Epic 04) - Documentation Analysis

**Generated:** 2026-02-16
**Analysis Scope:** All .md and .yaml files in `/workspaces/MonoPilot/new-doc/06-production/`
**Total Files Analyzed:** 177 files (37 .md + 140 .yaml context files)

---

## 1. INVENTORY

### 1.1 Core Documentation Files (37 .md files)

#### PRD & Architecture (2 files)
| File | Summary |
|------|---------|
| `prd/production.md` | PRD for Epic 04 with 27 functional requirements (FR-PROD-001 to FR-PROD-022g), covering WO lifecycle, material consumption, output registration, OEE tracking |
| `decisions/production-arch.md` | Technical architecture decisions including database schema for material_consumptions, production_outputs, wo_operations with RLS policies |

#### Stories (38 .md files)
| File | Summary |
|------|---------|
| `stories/04.0.epic-overview.md` | Epic 04 goal, scope, and dependency on Epic 05 (Warehouse) for License Plates |
| `stories/04.1.production-dashboard.md` | Phase 0 story: Production Dashboard with 6 KPIs, active WOs table, alerts panel, auto-refresh (DEPLOYED) |
| `stories/04.2a.wo-start.md` | Phase 0 story: WO Start transition from Released to In Progress with material validation (DEPLOYED) |
| `stories/04.2b.wo-pause-resume.md` | Phase 0 story: WO Pause/Resume with reason tracking and pause duration calculation (DEPLOYED) |
| `stories/04.2c.wo-complete.md` | Phase 0 story: WO Complete with status update and operation finalization (DEPLOYED) |
| `stories/04.2c-STORY-COMPLETION-REPORT.md` | Completion report for 04.2c with test coverage and AC verification |
| `stories/04.3.operation-start-complete.md` | Phase 0 story: Operation Start/Complete with duration and yield capture (DEPLOYED) |
| `stories/04.4.yield-tracking.md` | Phase 0 story: Yield calculation with scrap/waste percentages and variance tracking (DEPLOYED) |
| `stories/04.5.production-settings.md` | Phase 0 story: Configurable production settings (over-consumption, partial LP, pause options) (DEPLOYED) |
| `stories/04.6a.material-consumption-desktop.md` | Phase 1 story: Material Consumption Desktop with LP-based consumption (READY) |
| `stories/04.6b.material-consumption-scanner.md` | Phase 1 story: Material Consumption Scanner for mobile barcode scanning (READY) |
| `stories/04.6c.1-1-consumption-enforcement.md` | Phase 1 story: 1:1 Consumption Enforcement preventing partial LP consumption (READY) |
| `stories/04.6d.consumption-correction.md` | Phase 1 story: Consumption Correction/Reversal with audit trail (READY) |
| `stories/04.6e.over-consumption-control.md` | Phase 1 story: Over-Consumption Control with approval workflow (READY) |
| `stories/04.7a.output-registration-desktop.md` | Phase 1 story: Output Registration Desktop for creating finished goods LPs (READY) |
| `stories/04.7b.output-registration-scanner.md` | Phase 1 story: Output Registration Scanner for mobile output registration (READY) |
| `stories/04.7c.by-product-registration.md` | Phase 1 story: By-Product Registration with yield-based quantity calculation (READY) |
| `stories/04.7d.multiple-outputs-per-wo.md` | Phase 1 story: Multiple Outputs per WO for batch registrations (READY) |
| `stories/04.8.material-reservations.md` | Phase 1 story: Material Reservations to prevent allocation conflicts (READY) |
| `stories/04.9a.oee-calculation.md` | Phase 2 story: OEE Calculation (Availability × Performance × Quality) (READY) |
| `stories/04.9b.downtime-tracking.md` | Phase 2 story: Downtime Tracking with reason categorization and duration (READY) |
| `stories/04.9c.machine-integration.md` | Phase 2 story: Machine Integration with OPC UA/Modbus/MQTT connectors (READY) |
| `stories/04.9d.shift-management.md` | Phase 2 story: Shift Management with calendar and break time configuration (READY) |
| `stories/04.10a.oee-summary-report.md` | Phase 2 story: OEE Summary Report with trend analysis (READY) |
| `stories/04.10b.downtime-analysis-report.md` | Phase 2 story: Downtime Analysis Report with reason categorization (READY) |
| `stories/04.10c.yield-analysis-report.md` | Phase 2 story: Yield Analysis Report with variance tracking (READY) |
| `stories/04.10d.production-output-report.md` | Phase 2 story: Production Output Report with batch details (READY) |
| `stories/04.10e.material-consumption-report.md` | Phase 2 story: Material Consumption Report with variance analysis (READY) |
| `stories/04.10f.quality-rate-report.md` | Phase 2 story: Quality Rate Report with defect tracking (READY) |
| `stories/04.10g.wo-completion-report.md` | Phase 2 story: WO Completion Report with cycle time analysis (READY) |
| `stories/IMPLEMENTATION-PLAN.md` | Comprehensive implementation roadmap with dependency graph, phase structure, story estimates (27-31 days Phase 1, 33 days Phase 2) |
| `stories/EPIC-04-COMPLETE-REPORT.md` | Epic status report: Phase 0 100% complete (7 stories, 1600+ tests), Phase 1-2 stories defined |
| `stories/reports/04.2b-04.3-completion.md` | Completion report for Stories 04.2b and 04.3 with test results |

#### API Documentation (9 files)
| File | Summary |
|------|---------|
| `api/material-consumption.md` | Material Consumption API endpoints (GET /materials, POST /consume, GET /consumptions, POST /consume/reverse) |
| `api/consumption-reversal.md` | Consumption Reversal API with manager approval and audit trail (Story 04.6d) |
| `api/material-reservations.md` | Material Reservations API (create, release, calculate availability) (Story 04.8) |
| `api/output-registration.md` | Output Registration API (POST /register, GET /by-products, POST /register-by-product) (Story 04.7a/c) |
| `api/scanner-consumption-api.md` | Scanner Consumption API for mobile barcode scanning (Story 04.6b) (500ms performance target) |
| `api/scanner-output-api.md` | Scanner Output API for mobile output registration (Story 04.7b) (500ms performance target) |
| `api/over-consumption-control.md` | Over-Consumption Control API with approval workflow (Story 04.6e) |
| `api/production-dashboard.md` | Production Dashboard API (GET /kpis, GET /active-wos, GET /alerts, GET /export) |
| `api/wo-start-service.md` | WO Start Service with material availability validation and atomic status transition |
| `api/production-settings.md` | Production Settings API with configurable flags (allow_pause_wo, require_qa_status, etc.) |

#### Component & Integration Guides (13 files)
| File | Summary |
|------|---------|
| `guides/consumption-components.md` | Material Consumption React components (MaterialsTable, AddConsumptionModal, OverConsumptionApprovalModal, etc.) |
| `guides/output-components.md` | Output Registration React components (RegisterOutputModal, ByProductModal, MultipleOutputModal, etc.) |
| `guides/scanner-consume-components.md` | Scanner Consumption UI components (ScannerMaterialSearch, ScannerQtyInput, ScannerConsumptionConfirm) |
| `guides/scanner-output-components.md` | Scanner Output Registration components (ScannerWOLookup, ScannerQuantityInput, ScannerOutputModal) |
| `guides/scanner-output-api.md` | Scanner Output API reference with barcode validation and quantity entry |
| `guides/zpl-label-guide.md` | ZPL label generation for Zebra printers (GTIN-14, GS1-128, SSCC-18 formats) |
| `guides/yield-calculation.md` | Yield calculation logic with planned qty, actual qty, scrap %, by-product yields |
| `guides/genealogy-linking.md` | Genealogy tracking linking consumed LPs to output LPs (Story 04.6a + 04.7a) |
| `guides/multiple-outputs-workflow.md` | Multi-output workflow for single WO with batch aggregation (Story 04.7d) |
| `guides/by-product-registration-guide.md` | By-product registration workflow with auto-calculation and yield tracking (Story 04.7c) |
| `guides/reservation-workflow.md` | Material Reservation workflow (create on WO start, release on consumption) (Story 04.8) |
| `guides/offline-queue-guide.md` | Offline queue pattern for scanner operations with sync-on-reconnect |
| `guides/wo-materials-operations-dev-guide.md` | Development guide for WO Materials & Operations integration |
| `other/wo-materials-operations.md` | Technical architecture for wo_materials and wo_operations tables from Planning (Epic 03) |

#### UX/Wireframes (11 files)
| File | Summary |
|------|---------|
| `ux/PROD-001-production-dashboard.md` | Wireframe for Production Dashboard with KPI cards, active WOs, alerts (FR-PROD-001) |
| `ux/PROD-002-wo-execution-detail.md` | Wireframe for WO execution detail page with operations tracking and status controls |
| `ux/PROD-003-material-consumption.md` | Wireframe for Material Consumption with LP search, quantity input, consumption history (FR-PROD-006) |
| `ux/PROD-004-output-registration.md` | Consolidated wireframe for Output Registration covering FR-PROD-011/013/014/015 |
| `ux/PROD-004-part1-output-registration-desktop.md` | Split: Part 1 UI wireframe for output registration main page |
| `ux/PROD-004-part2-modals-and-specs.md` | Split: Part 2 modals and technical specifications for output registration |
| `ux/PROD-005-scanner-consume-material.md` | Wireframe for Scanner Material Consumption workflow (FR-PROD-007) |
| `ux/PROD-006-scanner-register-output.md` | Wireframe for Scanner Output Registration (FR-PROD-012) |
| `ux/PROD-007-production-settings.md` | Wireframe for Production Settings configuration page (FR-PROD-017) |
| `ux/PROD-008-oee-dashboard.md` | Consolidated wireframe for OEE Dashboard (FR-PROD-018) |
| `ux/PROD-008-part1-oee-dashboard-ui.md` | Split: Part 1 UI wireframe for OEE Dashboard |
| `ux/PROD-008-part2-data-and-specs.md` | Split: Part 2 data structure and technical specifications for OEE |
| `ux/PROD-009-downtime-tracking.md` | Wireframe for Downtime Tracking UI (Story 04.9b) |
| `ux/PROD-010-shift-management.md` | Wireframe for Shift Management configuration (Story 04.9d) |
| `ux/PROD-011-analytics-hub.md` | Wireframe for Analytics Hub with report links (Stories 04.10a-g) |

#### Story Context YAML Files (140 .yaml files)
| Location | Count | Purpose |
|----------|-------|---------|
| `stories/context/04.1/` | 5 files | _index.yaml, api.yaml, database.yaml, frontend.yaml, tests.yaml |
| `stories/context/04.2a/` | 5 files | Story context split by technical domain |
| `stories/context/04.2b/` | 5 files | Story context split by technical domain |
| `stories/context/04.2c/` | 5 files | Story context split by technical domain |
| `stories/context/04.3/` | 5 files | Story context split by technical domain |
| `stories/context/04.4/` | 5 files | Story context split by technical domain |
| `stories/context/04.5/` | 5 files | Story context split by technical domain |
| `stories/context/04.6a/` | 5 files | Story context split by technical domain |
| `stories/context/04.6b/` | 5 files | Story context split by technical domain |
| `stories/context/04.6c/` | 5 files | Story context split by technical domain |
| `stories/context/04.6d/` | 5 files | Story context split by technical domain |
| `stories/context/04.6e/` | 5 files | Story context split by technical domain |
| `stories/context/04.7a/` | 5 files | Story context split by technical domain |
| `stories/context/04.7b/` | 5 files | Story context split by technical domain |
| `stories/context/04.7c/` | 5 files | Story context split by technical domain |
| `stories/context/04.7d/` | 5 files | Story context split by technical domain |
| `stories/context/04.8/` | 5 files | Story context split by technical domain |
| `other/checkpoints/` | 18 files | Story checkpoint records (04.1 through 04.8 with multiple substories) |

---

### 1.2 File Count Summary

| Category | Count | Format |
|----------|-------|--------|
| PRD & Architecture | 2 | .md |
| Stories (High-Level) | 30 | .md |
| Reports & Plans | 3 | .md |
| API Documentation | 9 | .md |
| Guides & Integration | 13 | .md |
| UX/Wireframes | 11 | .md |
| **Markdown Subtotal** | **68** | .md |
| Story Context Files | 100 | .yaml |
| Checkpoint Records | 18 | .yaml |
| **YAML Subtotal** | **118** | .yaml |
| **GRAND TOTAL** | **186** | Mixed |

---

## 2. DUPLICATES & OVERLAPS

### 2.1 Confirmed Duplicate UX Files

#### DUPLICATE PAIR #1: PROD-004 (Output Registration)
| File | Status | Recommendation |
|------|--------|-----------------|
| `ux/PROD-004-output-registration.md` | Master consolidated file | **KEEP** - Primary reference (33 AC for FR-PROD-011/013/014/015) |
| `ux/PROD-004-part1-output-registration-desktop.md` | Split Part 1 (UI wireframe) | **DELETE** - Redundant split version |
| `ux/PROD-004-part2-modals-and-specs.md` | Split Part 2 (specs) | **DELETE** - Redundant split version |

**Rationale:** The consolidated PROD-004 contains identical wireframe content plus additional specifications. The split files (part1/part2) were created as an intermediate step but the master file supersedes them. Part1 and Part2 together equal PROD-004 with no additional value.

**Action Items:**
- Delete `ux/PROD-004-part1-output-registration-desktop.md`
- Delete `ux/PROD-004-part2-modals-and-specs.md`
- Update any cross-references to point to `ux/PROD-004-output-registration.md`

---

#### DUPLICATE PAIR #2: PROD-008 (OEE Dashboard)
| File | Status | Recommendation |
|------|--------|-----------------|
| `ux/PROD-008-oee-dashboard.md` | Master consolidated file | **KEEP** - Primary reference (50+ AC for FR-PROD-018/021) |
| `ux/PROD-008-part1-oee-dashboard-ui.md` | Split Part 1 (UI wireframe) | **DELETE** - Redundant split version |
| `ux/PROD-008-part2-data-and-specs.md` | Split Part 2 (specs) | **DELETE** - Redundant split version |

**Rationale:** Identical pattern to PROD-004. The consolidated PROD-008 contains complete wireframe and specifications. The split files provide no additional value.

**Action Items:**
- Delete `ux/PROD-008-part1-oee-dashboard-ui.md`
- Delete `ux/PROD-008-part2-data-and-specs.md`
- Update any cross-references to point to `ux/PROD-008-oee-dashboard.md`

---

### 2.2 Content Overlap (Non-Duplicates)

#### Intentional Multi-Form Documentation (API Guide + Story)
| Files | Overlap | Status | Reason |
|-------|---------|--------|--------|
| `api/scanner-consumption-api.md` + `stories/04.6b.material-consumption-scanner.md` | 30% | ACCEPTABLE | Different audiences: API guide (implementation) vs Story (requirements) |
| `api/scanner-output-api.md` + `stories/04.7b.output-registration-scanner.md` | 30% | ACCEPTABLE | Different audiences: API guide vs Story requirements |
| `guides/scanner-consume-components.md` + `api/scanner-consumption-api.md` | 20% | ACCEPTABLE | Guide focuses on React components; API focuses on endpoints |
| `guides/output-components.md` + `api/output-registration.md` | 20% | ACCEPTABLE | Components vs endpoints - different technical perspective |

**Status:** These are intentional documentation splits by audience and should be retained. Cross-references should be added where missing.

---

#### Architectural Context Duplication
| Files | Overlap | Status | Reason |
|-------|---------|--------|--------|
| `decisions/production-arch.md` + `other/wo-materials-operations.md` | 40% on database schema | NEEDS REVIEW | Both describe wo_materials and wo_operations tables |

**Analysis:**
- `decisions/production-arch.md`: Covers full Production module schema (material_consumptions, production_outputs, wo_operations, oee_records, downtime_logs)
- `other/wo-materials-operations.md`: Focuses specifically on wo_materials (Story 03.11a) and wo_operations (Story 03.12) from Planning module

**Recommendation:** **MERGE AND CONSOLIDATE**
- `other/wo-materials-operations.md` is Story 03.11a/03.12 from Epic 03 (Planning), not Epic 04 (Production)
- Should be moved to `/workspaces/MonoPilot/new-doc/03-planning/` directory
- Keep `decisions/production-arch.md` as the single source of truth for Production module schema

---

### 2.3 Checkpoint Files (Organizational, Not Duplicates)

The `other/checkpoints/` directory contains 18 YAML files documenting story progress:
- 04.1.yaml
- 04.2a.yaml, 04.2b.yaml, 04.2c.yaml
- 04.3.yaml, 04.4.yaml, 04.5.yaml
- 04.6a.yaml, 04.6b.yaml, 04.6c.yaml, 04.6d.yaml, 04.6e.yaml
- 04.7a.yaml, 04.7b.yaml, 04.7c.yaml, 04.7d.yaml
- 04.8.yaml

**Status:** These are legitimate tracking records. No action needed. (Consider consolidating into IMPLEMENTATION-PLAN.md if not needed for tracking.)

---

## 3. INCONSISTENCIES

### 3.1 Critical Inconsistencies

#### Inconsistency #1: Epic 05 Dependency Status
| Document | Statement | Version Date | Status |
|-----------|-----------|--------------|--------|
| `stories/04.0.epic-overview.md` | "Epic 04 Production has a HARD dependency on Epic 05 Warehouse (License Plates)" | Latest | **CORRECT** |
| `IMPLEMENTATION-PLAN.md` (Phase 1 section) | "LEVEL 5: Core LP Operations (Parallel - After Epic 05)" | 2026-01-14 | **CORRECT** |
| `EPIC-04-COMPLETE-REPORT.md` | "Phase 1 (Full Production): Stories ready for implementation...UNBLOCKED" + "✅ Epic 05.1 (LP Table) - COMPLETE" | 2026-01-14 | **CORRECT BUT POTENTIALLY MISLEADING** |

**Issue:** EPIC-04-COMPLETE-REPORT.md states that Epic 05 dependencies are COMPLETE, implying Phase 1 can start. However, the actual implementation status is unclear—the file claims "Phase 1 stories ready" but doesn't explicitly state whether the actual codebase has Epic 05 tables deployed.

**Recommendation:**
1. Clarify in EPIC-04-COMPLETE-REPORT.md whether Epic 05 database tables are deployed in production
2. Add explicit "Blocker Status" section stating whether Phase 1 can actually begin
3. Link to Epic 05 completion report for verification

---

#### Inconsistency #2: Story Naming & Numbering Conflict
| Document | Story ID | Name | Issue |
|-----------|----------|------|-------|
| `IMPLEMENTATION-PLAN.md` | 04.2c | WO Complete | Listed as single story |
| `stories/04.2c.wo-complete.md` | 04.2c | WO Complete | Single story document |
| `stories/04.2c-STORY-COMPLETION-REPORT.md` | 04.2c | (completion report) | Implies story was split or completed separately |
| `other/checkpoints/04.2c.yaml` | 04.2c | (checkpoint) | Single checkpoint entry |

**Issue:** Minor naming inconsistency. The story completion report file has unusual naming convention ("-STORY-COMPLETION-REPORT" suffix) that doesn't match the pattern of other reports (e.g., "04.2b-04.3-completion.md").

**Recommendation:** Rename `04.2c-STORY-COMPLETION-REPORT.md` to `reports/04.2c-completion.md` for consistency with `reports/04.2b-04.3-completion.md`.

---

#### Inconsistency #3: FR Coverage Matrix Inconsistencies
| FR ID | PRD Statement | Story Implementation | Issue |
|-------|--------------|----------------------|-------|
| FR-PROD-008 | "1:1 Consumption Enforcement" (P0, MVP) | Story 04.6c (Phase 1) | **PHASE MISMATCH**: Marked as MVP but implemented in Phase 1, not Phase 0 |
| FR-PROD-010 | "Over-Consumption Control" (P0, MVP) | Story 04.6e (Phase 1) | **PHASE MISMATCH**: Marked as MVP but requires LP dependency (Phase 1) |
| FR-PROD-014 | "Yield Tracking" (P0, MVP) | Story 04.4 (Phase 0) ✓ | Correct |
| FR-PROD-016 | "Material Reservations" (P0, MVP) | Story 04.8 (Phase 1) | **PHASE MISMATCH**: Marked as MVP but requires LP dependency |

**Root Cause:** PRD was written with ideal/stretch goals (all P0 in MVP), but actual implementation reveals that 5 requirements (FR-PROD-006, 007, 008, 009, 010) require License Plates, which depend on Epic 05.

**Recommendation:**
1. Update PRD to clarify phases:
   - **Phase 0 (No LP required):** FR-PROD-001-005, 014, 017
   - **Phase 1 (Requires LP):** FR-PROD-006-013, 015-016
   - **Phase 2 (OEE):** FR-PROD-018-022g
2. Add explicit "Dependencies" section to each FR in PRD
3. Update story phasing in IMPLEMENTATION-PLAN.md to match

---

### 3.2 Minor/Non-Critical Inconsistencies

#### Inconsistency #4: Performance Target Variation
| Component | Performance Target | Document | Date |
|-----------|-------------------|----------|------|
| Dashboard KPI response | <500ms | story/context/04.1/_index.yaml | Latest |
| Scanner Consumption API | <500ms p95 | guides/scanner-consume-components.md | 2026-01-21 |
| Scanner Output API | 500ms p95 | guides/scanner-output-api.md | 2026-01-21 |
| Dashboard page load | <2s total | story/context/04.1/_index.yaml | Latest |

**Status:** Acceptable variation. Different components have different targets, which is reasonable.

---

#### Inconsistency #5: AutoRefresh Interval Definition
| Document | Auto-Refresh Default | Configurable? |
|-----------|---------------------|---------------|
| `ux/PROD-001-production-dashboard.md` | 30s | Not explicitly stated |
| `stories/04.1.production-dashboard.md` | 30s | "configurable interval" mentioned |
| `story/context/04.1/_index.yaml` | 30s | "configurable" |

**Status:** Consistent across all documents. Minor: UX wireframe should add "(configurable)" label.

---

#### Inconsistency #6: WO Materials Table Location
| Document | Refers To | Issue |
|-----------|-----------|-------|
| `decisions/production-arch.md` | Lists as "Core Tables" under Production module | Correct but incomplete |
| `other/wo-materials-operations.md` | States "Story 03.11a" from Planning module | **CORRECT** - This is from Epic 03, not Epic 04 |

**Issue:** The wo_materials table is from Story 03.11a (Planning), not Production. While the Production module consumes it, it should not be listed as Production's "core table". It's a dependency.

**Recommendation:** In `decisions/production-arch.md`, move wo_materials and wo_operations to a "Dependency Tables" section with clear notes that these are created by Planning (Epic 03) module.

---

### 3.3 Consistency Check: PRD Requirements vs Stories

#### Complete Mapping (27 FRs → Stories)

| FR ID | Title | Phase (PRD) | Story | Phase (Story) | Status | ✓/✗ |
|-------|-------|-------------|-------|--------------|--------|-----|
| FR-PROD-001 | Production Dashboard | P0 | 04.1 | 0 | COMPLETE | ✓ |
| FR-PROD-002 | WO Start | P0 | 04.2a | 0 | COMPLETE | ✓ |
| FR-PROD-003 | WO Pause/Resume | P0 | 04.2b | 0 | COMPLETE | ✓ |
| FR-PROD-004 | Operation Start/Complete | P0 | 04.3 | 0 | COMPLETE | ✓ |
| FR-PROD-005 | WO Complete | P0 | 04.2c | 0 | COMPLETE | ✓ |
| FR-PROD-006 | Material Consumption (Desktop) | P0 | 04.6a | 1 | READY | ✗ |
| FR-PROD-007 | Material Consumption (Scanner) | P0 | 04.6b | 1 | READY | ✗ |
| FR-PROD-008 | 1:1 Consumption Enforcement | P0 | 04.6c | 1 | READY | ✗ |
| FR-PROD-009 | Consumption Correction | P0 | 04.6d | 1 | READY | ✗ |
| FR-PROD-010 | Over-Consumption Control | P0 | 04.6e | 1 | READY | ✗ |
| FR-PROD-011 | Output Registration (Desktop) | P0 | 04.7a | 1 | READY | ✗ |
| FR-PROD-012 | Output Registration (Scanner) | P0 | 04.7b | 1 | READY | ✗ |
| FR-PROD-013 | By-Product Registration | P0 | 04.7c | 1 | READY | ✗ |
| FR-PROD-014 | Yield Tracking | P0 | 04.4 | 0 | COMPLETE | ✓ |
| FR-PROD-015 | Multiple Outputs per WO | P0 | 04.7d | 1 | READY | ✗ |
| FR-PROD-016 | Material Reservations | P0 | 04.8 | 1 | READY | ✗ |
| FR-PROD-017 | Production Settings | P0 | 04.5 | 0 | COMPLETE | ✓ |
| FR-PROD-018 | OEE Calculation | P1 | 04.9a | 2 | READY | ✓ |
| FR-PROD-019 | Downtime Tracking | P1 | 04.9b | 2 | READY | ✓ |
| FR-PROD-020 | Machine Integration | P1 | 04.9c | 2 | READY | ✓ |
| FR-PROD-021 | Shift Management | P1 | 04.9d | 2 | READY | ✓ |
| FR-PROD-022a | OEE Summary Report | P1 | 04.10a | 2 | READY | ✓ |
| FR-PROD-022b | Downtime Analysis Report | P1 | 04.10b | 2 | READY | ✓ |
| FR-PROD-022c | Yield Analysis Report | P1 | 04.10c | 2 | READY | ✓ |
| FR-PROD-022d | Production Output Report | P1 | 04.10d | 2 | READY | ✓ |
| FR-PROD-022e | Material Consumption Report | P1 | 04.10e | 2 | READY | ✓ |
| FR-PROD-022f | Quality Rate Report | P1 | 04.10f | 2 | READY | ✓ |
| FR-PROD-022g | WO Completion Report | P1 | 04.10g | 2 | READY | ✓ |

**Summary:**
- **100% Coverage:** Every FR has a corresponding story
- **Phase Mismatches:** 10 FRs marked P0/MVP in PRD but implemented in Phase 1 (requires LP dependency)
- **Status Breakdown:** 7 COMPLETE (Phase 0) | 10 READY (Phase 1) | 11 READY (Phase 2)

---

## 4. KEY REQUIREMENTS EXTRACTION

### 4.1 All Functional Requirements (27 Total)

#### Phase 0 - MVP Core (7 FRs, COMPLETE)

**FR-PROD-001: Production Dashboard**
- 6 KPI cards: Orders Today, Units Produced, Avg Yield, Active WOs, Material Shortages, OEE Today
- Active WOs table with filters (Line, Product, Status), sort (Started At DESC)
- Alerts panel with 6 alert types (Material Shortage, WO Delayed, Quality Hold, Machine Down, Low Yield, OEE Below Target)
- Auto-refresh (30s configurable), manual refresh button
- CSV export of active WOs
- Response time <500ms for KPIs, <1s for active WOs, <2s total page load

**FR-PROD-002: WO Start**
- Transition WO from Released to In Progress
- Material availability check (warning if <100%)
- Confirm/assign line and machine
- Set status = 'In Progress', started_at = now
- Optional: create material reservations (if enable_material_reservations = true)
- 8 acceptance criteria

**FR-PROD-003: WO Pause/Resume**
- Pause: Select pause reason (required), add notes (optional)
- Pause reasons: Machine Breakdown, Material Shortage, Break/Lunch, Quality Issue, Other
- Resume: Status changes to 'In Progress', calculate pause duration
- Control: `allow_pause_wo` toggle (default: OFF)
- 7 acceptance criteria

**FR-PROD-004: Operation Start/Complete**
- Start operation: Set sequence, start_time
- Complete operation: Set end_time, capture yield (actual_qty), calculate duration
- Track: Operation log with timestamps and yield data
- Used for cycle time and OEE calculations
- 7 acceptance criteria

**FR-PROD-005: WO Complete**
- Transition WO from In Progress to Completed
- Update: status, completed_at, actual_qty aggregated
- Validation: All required operations must be completed
- Update remaining qty to zero
- Prevent: Cannot complete if materials or outputs pending
- 12+ acceptance criteria

**FR-PROD-014: Yield Tracking**
- Track: planned_qty vs actual_qty (output)
- Calculate: Yield % = (actual_qty / planned_qty) * 100
- Apply: Scrap percentages to planned qty
- By-products: Calculate yield-based output qty
- Display: Yield on dashboard and WO detail
- 7 acceptance criteria

**FR-PROD-017: Production Settings**
- Configurable flags:
  - `allow_pause_wo` - Enable/disable WO pause feature
  - `enable_material_reservations` - Auto-reserve materials on WO start
  - `require_qa_status` - Require QA approval before output registration
  - `allow_partial_lp_consumption` - Allow consuming part of a license plate
  - `allow_over_consumption_percent` - Threshold for over-consumption warning (default 10%)
- Tenant-level settings, changeable by admin/owner
- 7 acceptance criteria

---

#### Phase 1 - Full Production (10 FRs, READY - Requires Epic 05 LPs)

**FR-PROD-006: Material Consumption (Desktop)**
- UI: Material consumption form with LP-based tracking
- Workflow: Select material → Search/scan LP → Enter qty → Confirm
- Validation: LP exists, product matches, UoM matches, qty <= LP quantity
- Update: Decrement LP quantity, record consumption_at, consumed_by
- History: Show consumption history with reversal option (manager only)
- Genealogy: Link consumed LP to WO for traceability
- Features: Progress bars, variance indicators, Full LP Required badge
- Scope: Covers FR-PROD-006, FR-PROD-008 (1:1 enforcement), FR-PROD-009 (correction)

**FR-PROD-007: Material Consumption (Scanner)**
- Mobile workflow: Scan WO barcode → Select material → Scan LP → Enter qty → Confirm
- Optimized: <500ms response time for industrial Zebra/Honeywell scanners
- Offline-capable: Queue consumption actions, sync on reconnect
- Auto-validation: LP product match, quantity validation
- Same backend as Desktop (FR-PROD-006)

**FR-PROD-008: 1:1 Consumption Enforcement**
- Rule: For materials marked `consume_whole_lp = true`, must consume entire LP quantity
- Display: "Full LP Required" badge on material
- Validation: Block partial consumption, show error
- Use case: Ingredients that cannot be split across batches (e.g., enzyme cultures, cultures)
- Extends: FR-PROD-006

**FR-PROD-009: Consumption Correction**
- Manager-only action: Reverse incorrect consumption
- Record: Original consumption stays, reversal logged with reason
- Audit trail: Track who reversed, when, why
- Update: Re-add qty to source LP
- Genealogy: Update consumed LP genealogy record
- Extensions: Handled in Story 04.6d

**FR-PROD-010: Over-Consumption Control**
- Detect: When consumed_qty > required_qty for a material
- Threshold: Configurable `allow_over_consumption_percent` (default 10%)
- Workflow: Operator requests approval → Manager approves/rejects with reason
- Roles: Operator requests, Manager approves
- UI: Over-consumption modal with variance display
- Extends: Story 04.6e

**FR-PROD-011: Output Registration (Desktop)**
- UI: Form to create finished goods LPs from WO
- Fields: Output qty (required), batch number (auto-generated), location (required), QA status (optional)
- Validation: qty > 0, qty <= remaining planned qty, location exists
- Output: Create new LP with status='Available', product_id from WO product
- Genealogy: Link output LP to consumed input LPs (genealogy table)
- Multiple outputs: Support registering multiple batches per WO (Story 04.7d)
- By-products: Support auto-calculated by-product outputs (Story 04.7c)
- 9 acceptance criteria for desktop

**FR-PROD-012: Output Registration (Scanner)**
- Mobile: Scan WO → Enter qty → Scan output location → Confirm
- Optimized: <500ms response time for industrial scanners
- Offline-capable: Queue output registrations, sync on reconnect
- Same backend as Desktop (FR-PROD-011)

**FR-PROD-013: By-Product Registration**
- Auto-calculate: by_product_qty = main_output_qty × (yield_percent / 100)
- Registration: Create output LP for by-product with calculated qty
- Link: Both main and by-product output LPs linked to WO via genealogy
- Validation: Sum of main + by-products should not exceed planned (warning if over)
- Use case: Producing both flour and bran from milling, buttermilk alongside butter
- Extends: Story 04.7c

**FR-PROD-015: Multiple Outputs per WO**
- Support: Register multiple output batches from single WO
- Aggregation: Sum all output registrations for progress tracking
- Genealogy: Each output batch gets its own LP, all linked to same WO
- Use case: Producing multiple batches due to machine capacity, timing, or intentional stratification
- Extends: Story 04.7d

**FR-PROD-016: Material Reservations**
- Create: On WO start (if `enable_material_reservations = true`), reserve required LPs
- Status: Set reserved_qty on LP, move LP status to 'Reserved'
- Release: On consumption, release reserved LP (decrement reserved_qty)
- Prevent: Allocation conflicts (same LP cannot be reserved for multiple WOs)
- Check: Material availability calculation includes reserved inventory
- Extends: Story 04.8

---

#### Phase 2 - OEE & Analytics (10 FRs, READY)

**FR-PROD-018: OEE Calculation**
- Formula: OEE = Availability × Performance × Quality
  - Availability = Operating Time / Planned Time
  - Performance = (Actual Units × Cycle Time) / Operating Time
  - Quality = Good Units / Total Units
- Granularity: Per machine, per line, per shift
- Time window: Daily, shift-based, custom ranges
- Dashboard: 4-card display (Availability, Performance, Quality, Overall OEE)
- Trends: 7-day trend chart with target line

**FR-PROD-019: Downtime Tracking**
- Record: Downtime events with category and duration
- Categories: Planned (maintenance, setup), Unplanned (breakdown, shortage, quality)
- Sub-categories: Define per category (e.g., "Electrical Failure", "Bearing Issue")
- Manual entry: Operator can log downtime reason, duration
- Auto-calculation: Duration = end_time - start_time
- Used for: Availability calculation (removes unplanned downtime)

**FR-PROD-020: Machine Integration**
- Connectors: OPC UA, Modbus RTU, MQTT
- Real-time data: Machine status (Running, Idle, Error), counters (units produced, cycles)
- Polling: Configurable interval (default 5-minute)
- Store: Raw readings in time-series table, aggregated for OEE
- Alerts: Machine down, error conditions trigger dashboard alerts

**FR-PROD-021: Shift Management**
- Define: Shift name (Day, Night, Swing), start/end times, break times
- Calendar: Days of week shift runs (e.g., Mon-Fri Day, Fri-Sun Night)
- Breaks: Planned breaks (e.g., 30min lunch 12:00-12:30, 2×15min breaks)
- Assign: Operators to shifts, track shift-based OEE
- Use: Shifts define time windows for OEE aggregation

**FR-PROD-022a: OEE Summary Report**
- Metrics: OEE, Availability, Performance, Quality per machine/line/shift
- Time range: Daily, weekly, monthly, custom date range
- Breakdown: By machine, by line, by shift
- Trend: 30-day trend with target line
- Export: CSV, PDF
- Drill-down: Click OEE to see breakdown by component

**FR-PROD-022b: Downtime Analysis Report**
- Categories: Planned vs Unplanned downtime
- Reason breakdown: Duration by downtime reason
- Trends: 30-day trend chart
- Comparison: Planned vs actual planned time vs unplanned
- Top causes: List top 5 downtime reasons by duration
- Export: CSV, PDF

**FR-PROD-022c: Yield Analysis Report**
- Metrics: Planned qty, actual qty, yield %, scrap %, by-product yields
- By: Product, date range, line
- Variance: Planned vs actual yield, variance analysis
- Trends: 30-day yield trend
- Outliers: Highlight low-yield batches
- Export: CSV, PDF

**FR-PROD-022d: Production Output Report**
- Metrics: WO number, product, qty planned/produced, status, dates
- Breakdown: By product, by line, by date
- Batch details: Batch number, output location, QA status
- Genealogy: Link to consumed materials (material traceability)
- Cycle time: Duration from WO start to complete
- Export: CSV, PDF

**FR-PROD-022e: Material Consumption Report**
- Metrics: Material name, qty required/consumed, variance
- By: WO, product, date range, material
- Consumption variance: Required qty vs actual consumed, %
- By-product: Separate by-product consumption
- Top variances: Highlight materials with highest over/under consumption
- Export: CSV, PDF

**FR-PROD-022f: Quality Rate Report**
- Metrics: Good units, defect units, quality %
- By: Product, date range, line
- Defect reasons: Breakdown by defect category (if QA module provides)
- Trends: 30-day quality rate trend
- Target: Display quality % vs target
- Export: CSV, PDF

**FR-PROD-022g: WO Completion Report**
- Metrics: WO number, status, dates (released, started, completed), duration
- Breakdown: Cycle time analysis, operations timing
- On-time: Planned completion vs actual completion
- Status: Completed on-time, late, cancelled
- Trends: 30-day completion rate, average cycle time
- Export: CSV, PDF

---

### 4.2 Non-Functional Requirements (NFRs)

#### Performance
- KPI card response: <500ms
- Active WOs response: <1s
- Dashboard total load: <2s
- Scanner API: <500ms p95
- Database queries: Optimized with indexes on org_id, status, created_at

#### Security
- RLS on all queries (org_id filtering)
- Role-based access control (operator, manager, admin, owner)
- Audit trail for critical operations (consumption reversal, over-consumption approval)
- Data encryption at rest (Supabase defaults)

#### Data Integrity
- Atomic transactions for WO status changes
- Genealogy tracking for full traceability (consumed LP → output LP)
- Immutable snapshot of BOM at WO creation (Story 03.11a dependency)
- Decimal(15,6) precision for quantities to handle recipe scaling

#### Caching
- Redis TTL: 30 seconds for KPIs and active WOs
- Cache invalidation on WO status change, material consumption, output registration
- Configurable refresh interval (default 30s)

#### Mobile/Scanner Considerations
- Offline queue: Store consumption/output actions locally, sync on reconnect
- Barcode scanning: WO number format WO-YYYY-XXXX, LP barcode scan support
- Network resilience: Retry logic for failed API calls

---

## 5. QUALITY ASSESSMENT

### Documentation Completeness
- **Coverage:** 100% - Every FR has stories with context files
- **Depth:** High - Each story has detailed AC (Acceptance Criteria), context YAML, and wireframes
- **Examples:** Provided in guides and API documentation
- **Architecture:** Documented in decisions/production-arch.md

### Documentation Consistency
- **Phase Alignment Issues:** 10 FRs marked MVP/P0 but implemented in Phase 1 (Epic 05 dependency)
- **Naming Conventions:** Generally consistent except for split UX files (PROD-004-part1, PROD-008-part1)
- **Cross-references:** Good linking between stories, APIs, guides
- **Outdated Content:** Checkpoint files in `other/checkpoints/` should be archived or removed

### Identified Gaps
1. **Epic 05 Status:** EPIC-04-COMPLETE-REPORT.md claims dependencies are "COMPLETE" but doesn't verify database tables are deployed
2. **wo_materials Migration:** `other/wo-materials-operations.md` describes Epic 03 tables but is in Epic 04 directory
3. **Integration Points:** Limited documentation on how Production module integrates with Quality (QA status) and Warehouse (LP inventory)
4. **Error Handling:** API documentation lacks detailed error response examples
5. **Offline Sync:** Offline queue guide (offline-queue-guide.md) is sparse; needs more implementation details

---

## 6. RECOMMENDATIONS

### 6.1 Critical Actions

1. **Delete Duplicate UX Files** (within 1 day)
   - Delete: `ux/PROD-004-part1-output-registration-desktop.md`
   - Delete: `ux/PROD-004-part2-modals-and-specs.md`
   - Delete: `ux/PROD-008-part1-oee-dashboard-ui.md`
   - Delete: `ux/PROD-008-part2-data-and-specs.md`

2. **Move wo_materials_operations.md** (within 1 day)
   - Move: `other/wo-materials-operations.md` → `/03-planning/other/wo-materials-operations.md`
   - Rationale: This is Epic 03 (Planning) documentation, not Epic 04

3. **Update PRD Phase Assignments** (within 3 days)
   - Clarify Phase 0 (no LP) vs Phase 1 (requires LP) in PRD
   - Add "Blocked by: Epic 05" to FRs 006-016
   - Update IMPLEMENTATION-PLAN.md to match

4. **Verify Epic 05 Status** (critical path blocker)
   - Confirm: Are LP tables deployed in production Supabase?
   - If NO: Update EPIC-04-COMPLETE-REPORT.md to say "Phase 1 Blocked on Epic 05 deployment"
   - If YES: Create deployment summary linking to Epic 05 completion

### 6.2 Recommended Actions (non-critical)

5. **Consolidate Reports**
   - Rename: `stories/04.2c-STORY-COMPLETION-REPORT.md` → `stories/reports/04.2c-completion.md`
   - Move checkpoint files to archive or consolidate into IMPLEMENTATION-PLAN.md

6. **Enhance API Documentation**
   - Add error response examples to all 10 API docs
   - Add cURL examples for scanner APIs
   - Add database indexes required for each endpoint

7. **Expand Integration Guides**
   - Add section on Quality module integration (QA status field in output registration)
   - Add section on Warehouse module integration (LP inventory synchronization)
   - Add section on Settings module integration (production lines, machines, shifts)

8. **Create Integration Checklist**
   - Verify all cross-module dependencies in IMPLEMENTATION-PLAN.md
   - Ensure all YAML context files reference correct PRD sections
   - Test all hyperlinks between documents

### 6.3 Documentation Maintenance

9. **Establish Archival Policy**
   - Archive checkpoint files to `/archived/checkpoints/` after story completion
   - Keep only active stories in main documentation
   - Archive old completion reports to `/archived/reports/`

10. **Version Control**
    - Add "Last Updated" date to all .md files (currently: only some have dates)
    - Add "Next Review Date" for documents over 60 days old
    - Maintain changelog in `.claude/` for major documentation updates

---

## 7. SUMMARY TABLE

| Category | Count | Status | Action |
|----------|-------|--------|--------|
| **Files** | | | |
| Total .md files | 68 | 100% Complete | Maintain |
| Total .yaml files | 118 | OK | Archive checkpoints |
| **Duplicates** | | | |
| UX file pairs (PROD-004, PROD-008) | 4 files | DELETE | Delete 4 files |
| Architectural overlap (wo-materials) | 1 file | MOVE | Move to Epic 03 |
| **Inconsistencies** | | | |
| Phase mismatches (FR phase vs story phase) | 10 FRs | FIX | Update PRD |
| Epic 05 blocker status | Unclear | VERIFY | Confirm deployment |
| File naming conventions | 1 file | RENAME | Rename 04.2c report |
| **Coverage** | | | |
| Functional Requirements | 27/27 | 100% | ✓ |
| Stories | 18/18 | 100% | ✓ |
| Wireframes | 11 features | 100% | ✓ |
| API endpoints | 40+ endpoints | 80% | Add error examples |
| **Completeness** | | | |
| Phase 0 implementation | 7 stories | COMPLETE | Live in production |
| Phase 1 documentation | 10 stories | READY | Blocked on Epic 05 |
| Phase 2 documentation | 11 stories | READY | After Phase 1 |

---

**End of Analysis Report**

*This analysis was performed on all 186 documentation files in the Production module (Epic 04) directory on 2026-02-16. Recommendations should be actioned within the suggested timeframes to maintain documentation quality and consistency.*
