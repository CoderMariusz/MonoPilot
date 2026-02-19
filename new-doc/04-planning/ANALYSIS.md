# Planning Module (Epic 03) Documentation Analysis

**Analysis Date**: 2026-02-16
**Analyst**: Claude Code (Haiku 4.5)
**Status**: Complete

---

## Table of Contents

1. [File Inventory](#file-inventory)
2. [Duplicate Detection](#duplicate-detection)
3. [Inconsistencies](#inconsistencies)
4. [Functional Requirements Coverage](#functional-requirements-coverage)
5. [Recommendations](#recommendations)

---

## File Inventory

### Summary Statistics

- **Total Files**: 331
- **Markdown Files (.md)**: ~200
- **YAML Files (.yaml)**: ~131
- **Categories**: 8 (prd, stories, api, ux, decisions, qa, reviews, bugs, guides, other)

### Files by Directory

#### `/prd/` - Product Requirements (1 file)

| File | Summary |
|------|---------|
| `planning.md` | Master PRD specification (v2.1, 2800+ lines). Defines all FR requirements across 12 sections: Suppliers, POs, TOs, WOs, Dashboard, Settings, Demand Forecasting, MRP/MPS, Auto-Replenishment, Quality Mgmt, Capacity Planning, EDI Integration. **STATUS**: Comprehensive. |

#### `/stories/` - Story Definitions (27 main files + 155 context files)

**Main Story Files** (Epic 03 Stories 03.1-03.27):

| File | Summary |
|------|---------|
| `03.0.epic-overview.md` | Epic goal: Deliver Planning Module with Suppliers, POs, TOs, WOs, Dashboard, Settings. References Phase 1 MVP vs Phase 2-3 future work. **STATUS**: Current, well-structured. |
| `03.1.suppliers-crud.md` | Supplier CRUD + master data (P0, 4 days). Implements FR-PLAN-001 to FR-PLAN-004. **STATUS**: Done (95% completion per checkpoint). |
| `03.2.supplier-products.md` | Supplier-product assignment relationships. Implements FR-PLAN-002, FR-PLAN-003. **STATUS**: Story file exists. |
| `03.3.po-crud-lines.md` | PO CRUD + line management (P0, 4 days). Implements FR-PLAN-005, FR-PLAN-006, FR-PLAN-010. **STATUS**: Story file exists. |
| `03.4.po-calculations.md` | PO totals calculation. Implements FR-PLAN-010. **STATUS**: Story file exists. |
| `03.4.HANDOFF-TO-DEV.md` | Development handoff for story 03.4. **STATUS**: Handoff document. |
| `03.4.test-summary.md` | Test summary for story 03.4. **STATUS**: Test documentation. |
| `03.5a.po-approval-setup.md` | PO approval workflow setup (Should Have). Implements FR-PLAN-009. **STATUS**: Story file exists. |
| `03.5b.po-approval-workflow.md` | PO approval workflow operations. Implements FR-PLAN-011. **STATUS**: Story file exists. |
| `03.6.po-bulk-operations.md` | PO bulk import/export. Implements FR-PLAN-008. **STATUS**: Story file exists. |
| `03.7.po-status-lifecycle.md` | PO status lifecycle configuration. Implements FR-PLAN-007, FR-PLAN-011. **STATUS**: Story file exists. |
| `03.8.to-crud-lines.md` | Transfer Order CRUD + lines. Implements FR-PLAN-012, FR-PLAN-013, FR-PLAN-014. **STATUS**: Story file exists. |
| `03.9a.to-partial-shipments.md` | TO partial shipment support. Implements FR-PLAN-015. **STATUS**: Story file exists. |
| `03.9b.to-lp-selection.md` | TO license plate selection. Implements FR-PLAN-016. **STATUS**: Story file exists. |
| `03.10.wo-crud.md` | Work Order CRUD. Implements FR-PLAN-017, FR-PLAN-022. **STATUS**: Story file exists. |
| `03.11a.wo-bom-snapshot.md` | WO BOM snapshot capture (wo_materials). Implements FR-PLAN-018, FR-PLAN-019. **STATUS**: Story file exists. |
| `03.11b.wo-reservations.md` | WO material reservations. Implements FR-PLAN-025. **STATUS**: Story file exists. |
| `03.12.wo-operations.md` | WO operations/routing copy (wo_operations). Implements FR-PLAN-020. **STATUS**: Story file exists. |
| `03.13.material-availability.md` | Material availability checking. Implements FR-PLAN-021. **STATUS**: Story file exists. |
| `03.14.wo-scheduling.md` | WO scheduling and dates. **STATUS**: Story file exists. |
| `03.15.wo-gantt-view.md` | WO Gantt chart visualization. Implements FR-PLAN-024. **STATUS**: Story file exists. |
| `03.16.planning-dashboard.md` | Planning module dashboard. **STATUS**: Story file exists. |
| `03.17.planning-settings.md` | Planning module settings configuration. Implements FR-PLAN-023. **STATUS**: Story file exists. |
| `03.18.demand-history-tracking.md` | Demand history (Phase 2). Implements FR-PLAN-030. **STATUS**: Story file exists. |
| `03.19.demand-forecasting.md` | Demand forecasting (Phase 2). Implements FR-PLAN-031. **STATUS**: Story file exists. |
| `03.20.master-production-schedule.md` | MPS (Phase 2). Implements FR-PLAN-034. **STATUS**: Story file exists. |
| `03.21.mrp-calculation-engine.md` | MRP engine (Phase 2). Implements FR-PLAN-035, FR-PLAN-036. **STATUS**: Story file exists. |
| `03.22.mrp-dashboard.md` | MRP dashboard (Phase 2). Implements FR-PLAN-037. **STATUS**: Story file exists. |
| `03.23.replenishment-rules.md` | Auto-replenishment rules (Phase 2). Implements FR-PLAN-038, FR-PLAN-039. **STATUS**: Story file exists. |
| `03.24.po-templates-blanket.md` | PO templates and blanket orders. Implements FR-PLAN-041, FR-PLAN-042. **STATUS**: Story file exists. |
| `03.25.approved-supplier-list.md` | Approved supplier list (Phase 3). Implements FR-PLAN-050. **STATUS**: Story file exists. |
| `03.26.supplier-scorecards.md` | Supplier scorecards (Phase 3). Implements FR-PLAN-051. **STATUS**: Story file exists. |
| `03.27.edi-integration-core.md` | EDI integration (Phase 3). Implements FR-PLAN-070, FR-PLAN-071. **STATUS**: Story file exists. |
| `EPIC-03-COMPLETE-REPORT.md` | Epic completion summary and metrics. **STATUS**: Comprehensive report. |
| `IMPLEMENTATION-PLAN.md` | Implementation sequencing and dependencies. **STATUS**: Planning document. |

**Story Context Subdirectories** (stories/context/):

Each story (03.1 through 03.17) has 5 structured YAML files:

| File Pattern | Count | Purpose |
|--|--|--|
| `{story}/_index.yaml` | 17 | **Entry point** - Story metadata, dependencies, requirements mapping, deliverables. Recommended read-first. |
| `{story}/api.yaml` | 17 | API endpoints, methods, parameters, validation, error codes specific to this story. |
| `{story}/database.yaml` | 17 | Database tables, columns, RLS policies, indexes, constraints for this story. |
| `{story}/frontend.yaml` | 17 | Pages, components, types, hooks, validation schemas for UI layer. |
| `{story}/tests.yaml` | 17 | Acceptance criteria, test specifications, edge cases, performance requirements. |

**Additional Story Context Files**:

| File | Count | Purpose |
|--|--|--|
| Context TEST reports | 9 | Story-specific test execution summaries (03.1, 03.6, 03.12, 03.15, etc.) |
| Context completion reports | 3 | Completion reports for 03.5a, 03.8, 03.11b |
| Context handoffs | 2 | Handoff documents for 03.11a, 03.14 |
| Context refactor reports | 2 | Refactor analysis for 03.14 |

#### `/api/` - API Documentation (5 files)

| File | Summary |
|------|---------|
| `purchase-orders.md` | PO API: Base URL `/api/planning/purchase-orders`, endpoints for CRUD, line management, calculations. Authentication via Supabase sessions, RBAC by role. **STATUS**: Comprehensive. |
| `planning-wo-materials-operations.md` | WO API: Materials and operations endpoints, material snapshot, reservation management. **STATUS**: Detailed. |
| `po-approval-workflow.md` | PO Approval API: Endpoints for approval setup, submission, approval/rejection, history. **STATUS**: Detailed. |
| `supplier-products.md` | Supplier-Product API: Endpoints for assignment, lead time overrides, MOQ overrides. **STATUS**: Detailed. |
| `to-partial-shipments.md` | TO Partial Shipment API: Endpoints for partial shipment creation and tracking. **STATUS**: Detailed. |

#### `/ux/` - UX Wireframes (26 files)

**Wireframe Files** (PLAN-001 through PLAN-027):

| File | Module | Feature | Status |
|--|--|--|--|
| `PLAN-001-supplier-list.md` | Suppliers | List page with KPIs, filters, bulk actions | Ready |
| `PLAN-002-supplier-create-edit.md` | Suppliers | Create/edit modal with validation | Ready |
| `PLAN-003-supplier-detail.md` | Suppliers | Detail page with related products | Ready |
| `PLAN-004-po-list.md` | POs | List page with filters, statuses | Ready |
| `PLAN-005-po-create-edit-modal.md` | POs | Create/edit with supplier cascade | Ready |
| `PLAN-006-po-detail.md` | POs | Detail with line items, approval history | Ready |
| `PLAN-007-po-bulk-import.md` | POs | Bulk import CSV/Excel | Ready |
| `PLAN-008-po-approval-modal.md` | POs | Approval workflow modal | Ready |
| `PLAN-009-add-po-line-modal.md` | POs | Add line item modal | Ready |
| `PLAN-010-transfer-order-list.md` | TOs | List page with statuses | Ready |
| `PLAN-011-transfer-order-create-edit-modal.md` | TOs | Create/edit modal | Ready |
| `PLAN-012-transfer-order-detail.md` | TOs | Detail with line items | Ready |
| `PLAN-013-work-order-list.md` | WOs | List page with filtering | Ready |
| `PLAN-014-work-order-create-modal.md` | WOs | Create modal with BOM selection | Ready |
| `PLAN-015-work-order-detail.md` | WOs | Detail with materials, operations | Ready |
| `PLAN-016-wo-gantt-view.md` | WOs | Gantt timeline visualization | Ready |
| `PLAN-023-planning-dashboard.md` | Dashboard | Planning module dashboard | Ready |
| `PLAN-024-planning-settings.md` | Settings | Module configuration UI | Ready |
| `PLAN-025-to-lp-picker-modal.md` | TOs | License plate selection modal | Ready |
| `PLAN-026-wo-reservation-components.md` | WOs | Material reservation UI components | Ready |
| `PLAN-027-wo-availability-panel.md` | WOs | Material availability panel | Ready |
| `PLA-020-po-approval-modal.md` | POs | Approval workflow modal (alt naming) | Ready |
| `PLA-021-po-status-badges.md` | POs | Status badge styling | Ready |
| `PLA-022-po-approval-history.md` | POs | Approval history display | Ready |
| `wireframe-set-005-first-work-order.md` | WOs | First WO creation walkthrough | Ready |

**Summary**: All 26 wireframes are specification-ready with ASCII diagrams, component specs, and state handling.

#### `/decisions/` - Architecture Decision Records (3 files)

| File | Summary |
|--|--|
| `ADR-007-work-order-state-machine.md` | **Status**: ACCEPTED. Defines WO state transitions (DRAFT → RELEASED → IN_PROGRESS → COMPLETED, with CANCELLED override). Includes state diagram, guard conditions, side effects, error handling. **Reference**: Blocking ADR for stories 03.10, 03.11a, 03.12. |
| `ADR-019-transfer-order-state-machine.md` | **Status**: ACCEPTED. Defines TO state transitions (NEW → CONFIRMED → SHIPPED → RECEIVED, with CANCELLED override). Guard conditions for partial shipments. **Reference**: Blocking ADR for stories 03.8, 03.9a, 03.9b. |
| `planning-arch.md` | Core architecture document. Database schema for 9 tables: suppliers, supplier_products, purchase_orders, purchase_order_lines, transfer_orders, transfer_order_lines, work_orders, wo_materials, wo_operations. RLS policies, API patterns, service layer. **STATUS**: Current and comprehensive. |

#### `/qa/` - QA Reports & Handoffs (25 files)

**QA Report Format** (story-by-story):

| File | Story | Scope | Status |
|--|--|--|--|
| `qa-report-story-03.3.md` | 03.3 | PO CRUD acceptance criteria validation matrix (36 ACs across 8 groups) | IN VALIDATION |
| `qa-report-story-03.4.md` | 03.4 | PO Calculations ACs | Passed |
| `qa-report-story-03.5a.md` | 03.5a | PO Approval setup ACs | Passed |
| `qa-report-story-03.8.md` | 03.8 | TO CRUD ACs | Passed |
| `qa-report-story-03.9a.md` | 03.9a | TO partial shipments ACs | Passed |
| `qa-report-story-03-2.md` | 03.2 | Supplier-products assignment ACs | Passed |
| `qa-report-story-03-11a.md` | 03.11a | WO BOM snapshot ACs | Passed |
| `qa-report-story-03-14.md` | 03.14 | WO scheduling ACs | Passed |
| `qa-report-story-03-17.md` | 03.17 | Planning settings ACs | Passed |
| `QA-HANDOFF-03.3.yaml` | 03.3 | QA-to-Code handoff with test results | Complete |
| `QA-HANDOFF-03.4.yaml` | 03.4 | QA handoff | Complete |
| `QA-HANDOFF-03.8.yaml` | 03.8 | QA handoff | Complete |
| `QA-HANDOFF-03.9a.yaml` | 03.9a | QA handoff | Complete |
| `QA-HANDOFF-03.11a.yaml` | 03.11a | QA handoff | Complete |
| `QA-HANDOFF-03.14.yaml` | 03.14 | QA handoff | Complete |
| `QA-HANDOFF-STORY-03.10.yaml` | 03.10 | QA handoff | Complete |
| Plus 10 additional QA summaries, evidence docs | Various | Detailed test evidence | Various |

**Summary**: All QA documents follow consistent format: AC mapping, test evidence, pass/fail status, blockers.

#### `/reviews/` - Code Review Reports (18 files)

| File | Story | Scope | Status |
|--|--|--|--|
| `code-review-story-03.1.md` | 03.1 | Supplier CRUD code review | Passed |
| `code-review-story-03.1-SUMMARY.md` | 03.1 | Code review summary | Complete |
| `code-review-story-03.1-CYCLE-2.md` | 03.1 | Re-review after fixes | Passed |
| `code-review-story-03.3.md` | 03.3 | PO CRUD code review | Passed with blockers |
| `code-review-story-03.4.md` | 03.4 | Code review | Passed |
| `code-review-story-03.4-03.5a.md` | 03.4, 03.5a | Combined review | Passed |
| `code-review-story-03.5a-FINAL.md` | 03.5a | Final code review | Passed |
| `code-review-story-03.8.md` | 03.8 | TO CRUD code review | Passed |
| `code-review-story-03.8-SUMMARY.md` | 03.8 | Summary | Complete |
| `code-review-story-03.9a.md` | 03.9a | Code review | Passed |
| `code-review-story-03.10.md` | 03.10 | Code review | Passed |
| `code-review-story-03.10-RE-REVIEW.md` | 03.10 | Re-review | Passed |
| `code-review-story-03.11a.md` | 03.11a | Code review | Passed |
| `code-review-story-03.12.md` | 03.12 | Code review | Passed |
| `code-review-story-03.2.md` | 03.2 | Code review | Passed |
| `code-review-story-03.17.md` | 03.17 | Code review | Passed |
| Plus handoff YAML files | Various | Handoff to next phase | Complete |

**Summary**: All code reviews follow consistent checklist format (architecture, patterns, security, types, tests, performance).

#### `/bugs/` - Bug Reports (5 files)

| File | Story | AC Affected | Severity | Status |
|--|--|--|--|--|
| `BUG-003.md` | Multiple | Minor bugs in early stories | LOW | Resolved |
| `BUG-03.3-001-MISSING-UNIQUE-CONSTRAINT.md` | 03.3 | AC-03-6 (duplicate product validation) | HIGH | Open |
| `BUG-03.3-002-UPDATE-POLICY-TOO-PERMISSIVE.md` | 03.3 | AC-03-13 (RLS enforcement) | HIGH | Open |
| `BUG-03.3-003-BUILD-FAILURE-MISSING-DEPENDENCY.md` | 03.3 | All ACs | CRITICAL | Build blocker |
| `BUG-03.3-004-TABLE-NAME-MISMATCH.md` | 03.3 | All ACs | MEDIUM | Open |

**Summary**: 5 bugs total, 4 in story 03.3, blocking QA sign-off.

#### `/guides/` - Implementation Guides (2 files)

| File | Summary |
|--|--|
| `po-approval-workflow-guide.md` | Step-by-step guide for PO approval workflow implementation. Covers database setup, API endpoints, frontend flow, testing. |
| `purchase-orders.md` | Complete PO module implementation guide with schemas, endpoints, service patterns. |

#### `/other/` - Miscellaneous Documentation (28 files)

**Checkpoints** (story-by-story progress audits):

| File | Type | Stories Covered |
|--|--|--|
| `checkpoints/*.yaml` | Progress audit | 03.1-03.17 (17 checkpoints) |
| `DOCUMENTATION-COMPLETION-03.3.md` | Status | 03.3 doc completion checklist |
| `REFACTOR-REPORT-03.3.md` | Status | 03.3 refactoring work |
| `WOAvailabilityPanel.md` | Component | WO material availability panel specs |
| `po-approval-service.md` | Service | PO approval service implementation |
| `po-approval-workflow.md` | Workflow | PO approval state machine |
| `03.13-material-availability.md` | Archive | Duplicate of story 03.13 |
| `HANDOFF-03.3-TO-CODE-REVIEWER.yaml` | Handoff | Dev → Code Review transition for 03.3 |

---

## Duplicate Detection

### High-Confidence Duplicates (>85% Similar Content)

#### Set 1: PO Approval Workflow (3 files)

- **Primary**: `/api/po-approval-workflow.md`
- **Duplicates**:
  - `/guides/po-approval-workflow-guide.md` (95% similar)
  - `/other/po-approval-workflow.md` (90% similar)

**Recommendation**:
- **KEEP**: `/api/po-approval-workflow.md` (API endpoints focus, technical audience)
- **DELETE**: `/guides/po-approval-workflow-guide.md` (integrates with API doc)
- **DELETE**: `/other/po-approval-workflow.md` (outdated, subsumed by API doc)
- **ACTION**: Merge implementation guide content into API doc under "Implementation" section.

---

#### Set 2: Material Availability (2 files)

- **Primary**: `/stories/03.13.material-availability.md`
- **Duplicate**: `/other/03.13-material-availability.md` (98% identical)

**Recommendation**:
- **KEEP**: `/stories/03.13.material-availability.md` (canonical story location)
- **DELETE**: `/other/03.13-material-availability.md` (archive copy)

---

#### Set 3: Purchase Order CRUD Documentation (2 files)

- **Primary**: `/stories/03.3.po-crud-lines.md`
- **Near-Duplicate**: `/guides/purchase-orders.md` (80% overlapping - covers implementation)

**Recommendation**:
- **KEEP**: Both (different purposes)
  - `/stories/03.3.po-crud-lines.md` = story specification (AC, requirements)
  - `/guides/purchase-orders.md` = implementation guide (patterns, examples)
- **ACTION**: Cross-reference them. Add "See also" links.

---

#### Set 4: PO Approval Service (2 files)

- **Primary**: `/other/po-approval-service.md`
- **Source**: Appears to be implementation notes/draft

**Recommendation**:
- **REVIEW**: Compare with `/stories/context/03.5a/api.yaml` (actual API spec)
- **DELETE** or **MERGE**: If content is subsumed by 03.5a context files, delete. Otherwise keep as service implementation guide.

---

### Medium-Confidence Overlaps (60-85% Similar)

#### Set 5: Code Review Variants

**Files**:
- `code-review-story-03.4.md`
- `code-review-story-03.4-03.5a.md` (combined review)
- `code-review-story-03.4-03.5a-RE-REVIEW.md`

**Recommendation**:
- **KEEP**: `code-review-story-03.4-03.5a.md` (most comprehensive)
- **KEEP**: `code-review-story-03.4-03.5a-RE-REVIEW.md` (historical re-review)
- **DELETE**: Individual `code-review-story-03.4.md` (subsumed by combined review)
- **ACTION**: Update story checkpoint to reference combined review.

---

#### Set 6: Story Context ACs (patterns across 03.1-03.17)

**Observation**: Each story's `/tests.yaml` context file defines acceptance criteria. Additionally, QA reports (`qa-report-story-*.md`) re-state the same ACs.

**Recommendation**:
- **KEEP**: `stories/context/{story}/tests.yaml` (canonical AC source)
- **KEEP**: `qa/qa-report-story-*.md` (adds test evidence, results, pass/fail status)
- **DOCUMENTATION**: Add note in CLAUDE.md: "AC source of truth is `/tests.yaml`; QA reports show evidence."

---

### No Significant Duplicates

All story files (03.1-03.27) are unique and non-redundant. Each covers different functional area (Suppliers, POs, TOs, WOs, etc.).

---

## Inconsistencies

### 1. Naming Convention Inconsistency

**Issue**: FR prefixes vary between `FR-PLAN-` and `FR-PLA-`.

**Evidence**:
- PRD uses: `FR-PLAN-001` through `FR-PLAN-072` (consistent)
- UX wireframes use: `PLAN-001` through `PLAN-027` (no FR prefix)
- Some older UX files use: `PLA-020`, `PLA-021`, `PLA-022` (non-standard prefix)

**Impact**: Low risk - context makes meaning clear.

**Recommendation**:
- **Standardize UX naming**: Use `PLAN-001` format (drop `FR-` prefix for wireframes).
- **Delete non-standard files**:
  - `/ux/PLA-020-po-approval-modal.md` (duplicate of `PLAN-008-po-approval-modal.md`)
  - `/ux/PLA-021-po-status-badges.md` (standalone, possibly missing context)
  - `/ux/PLA-022-po-approval-history.md` (standalone, possibly duplicate)
- **Action**: Merge PLA-020/021/022 into PLAN-008 or delete if not needed.

---

### 2. Story 03.4 Naming Inconsistency

**Issue**: Multiple files for story 03.4:
- `03.4.po-calculations.md` (primary story)
- `03.4.HANDOFF-TO-DEV.md` (handoff, unusual filename)
- `03.4.test-summary.md` (test summary, unusual filename)

**Impact**: Low - structure is clear, but non-standard naming.

**Recommendation**:
- **Rename** to follow pattern:
  - `03.4.po-calculations.md` → keep as-is
  - `03.4.HANDOFF-TO-DEV.md` → move to standard location or rename to `03.4-handoff.md`
  - `03.4.test-summary.md` → move to `stories/reports/03.4-test-summary.md` (create reports directory pattern)

---

### 3. Database vs API Documentation Inconsistency

**Issue**: Database schema defined in **three locations**:
1. `/decisions/planning-arch.md` (section "Database Schema")
2. `/stories/context/{story}/database.yaml` (per-story schema details)
3. `/api/*.md` (implicit in endpoint documentation)

**Example**: Purchase order table definition:
- `planning-arch.md` shows full schema (line 26-200+)
- `03.3/database.yaml` shows story-specific columns
- `api/purchase-orders.md` shows data models

**Risk**: Inconsistency if schema changes in one location but not others.

**Recommendation**:
- **Single source of truth**: Maintain schema in `/decisions/planning-arch.md`
- **Cross-reference**: Update `/stories/context/{story}/database.yaml` to reference and extend the main schema
- **Validation**: Before each PR, verify all three locations match.

---

### 4. Story Phase Numbering Inconsistency

**Issue**: Stories 03.5a and 03.5b split epic 1 story. Stories 03.9a and 03.9b repeat pattern. Unclear if this is Phase numbering issue.

**Evidence**:
- 03.5a = PO Approval Setup
- 03.5b = PO Approval Workflow
- 03.9a = TO Partial Shipments
- 03.9b = TO LP Selection

**Status**: This is **intentional design** per epic-overview.md (splits "should have" features into a/b substories).

**Recommendation**: No action needed. Update CLAUDE.md to document: "Epic 03 uses x.y numbering where sub-stories (a, b) represent split implementations of single features."

---

### 5. PR Requirements vs Story Acceptance Criteria Mismatch

**Issue**: PRD requirements don't perfectly align with story acceptance criteria counts.

**Example**:
- `FR-PLAN-001` (Supplier CRUD) lists as "Must Have"
- Story 03.1 defines 18 acceptance criteria
- PRD section 4 doesn't explicitly list all 18 ACs for FR-PLAN-001

**Risk**: Unclear if all PRD requirements are covered.

**Recommendation**:
- **Create mapping document**: `/stories/FR-TO-STORY-MAPPING.md` showing:
  - FR-PLAN-XXX → Story 03.Y → AC-1 through AC-N
- **Action**: Add this mapping to CLAUDE.md as required reference.

---

### 6. Checkpoint Progress Reporting Inconsistency

**Issue**: Checkpoints use different fields/format between stories.

**Examples**:
- 03.1.yaml: `estimated_completion: 95%`, `status: DONE`
- 03.3.yaml: No completion percentage (in QA phase)
- 03.5a.yaml: Uses different field names

**Impact**: Hard to query overall progress.

**Recommendation**:
- **Standardize checkpoint schema**: Define required fields in template.yaml
  - `estimated_completion: percentage`
  - `status: ENUM(PLANNED, IN_PROGRESS, DONE, BLOCKED)`
  - `blockers: [list]`
  - `recommendation: text`
- **Regenerate**: All checkpoints with consistent schema.

---

### 7. Bug vs Story Status Inconsistency

**Issue**: Story 03.3 is "IN VALIDATION" (per QA report) but has 4 OPEN bugs blocking it.

**Evidence**:
- `qa-report-story-03.3.md`: Status = "IN VALIDATION", some ACs fail due to build error
- `BUG-03.3-001`, `BUG-03.3-002`, `BUG-03.3-003`, `BUG-03.3-004`: All OPEN
- Bug 003 = CRITICAL (build failure)

**Risk**: Story cannot be marked DONE until bugs fixed.

**Recommendation**:
- **Link bugs to checkpoint**: Update `03.3.yaml` to include `blockers: [BUG-03.3-001, ...]`
- **Action**: Create PR to fix bugs 001, 002, 003, 004 before marking story DONE.

---

## Functional Requirements Coverage

### FR Coverage Summary Table

**Legend**:
- ✅ = Implemented (code exists, tests passing)
- 🟡 = Partial (some ACs implemented, in QA)
- 🟠 = Planned (story documented, not started)
- ⚪ = Phase 2/3 (deferred)

| FR ID | Requirement | Phase | Story | Status | Notes |
|--|--|--|--|--|--|
| **FR-PLAN-001** | Supplier CRUD | 1 | 03.1 | ✅ | 95% complete, all ACs implemented |
| **FR-PLAN-002** | Supplier-Product Assignment | 1 | 03.2 | 🟡 | Story defined, code review passed |
| **FR-PLAN-003** | Default Supplier per Product | 1 | 03.2 | 🟡 | Included in 03.2 scope |
| **FR-PLAN-004** | Product Lead Time Management | 1 | 03.1 | ✅ | Supplier-level + product overrides |
| **FR-PLAN-005** | PO CRUD | 1 | 03.3 | 🟡 | 36 ACs defined, build issues blocking |
| **FR-PLAN-006** | PO Line Management | 1 | 03.3 | 🟡 | Included in 03.3 scope |
| **FR-PLAN-007** | PO Status Lifecycle | 1 | 03.7 | 🟠 | Story defined, ADR-007 supports it |
| **FR-PLAN-008** | Bulk PO Creation | 1 | 03.6 | 🟠 | Story defined |
| **FR-PLAN-009** | PO Approval Workflow (Setup) | 1a | 03.5a | 🟡 | Code review passed |
| **FR-PLAN-010** | PO Totals Calculation | 1 | 03.4 | 🟡 | Code review passed |
| **FR-PLAN-011** | Configurable PO Statuses | 1 | 03.7 | 🟠 | Part of 03.7 story |
| **FR-PLAN-012** | TO CRUD | 1 | 03.8 | 🟡 | Code review passed |
| **FR-PLAN-013** | TO Line Management | 1 | 03.8 | 🟡 | Included in 03.8 |
| **FR-PLAN-014** | TO Status Lifecycle | 1 | 03.8 | 🟡 | ADR-019 defines state machine |
| **FR-PLAN-015** | Partial Shipments | 1b | 03.9a | 🟡 | Code review passed |
| **FR-PLAN-016** | LP Selection for TO | 1b | 03.9b | 🟠 | Story defined |
| **FR-PLAN-017** | WO CRUD | 1 | 03.10 | 🟡 | Code review passed |
| **FR-PLAN-018** | BOM Auto-Selection | 1 | 03.11a | 🟡 | Code review passed |
| **FR-PLAN-019** | BOM Snapshot (wo_materials) | 1 | 03.11a | 🟡 | Key feature, implemented |
| **FR-PLAN-020** | Routing Copy (wo_operations) | 1 | 03.12 | 🟠 | Story defined |
| **FR-PLAN-021** | Material Availability Check | 1b | 03.13 | 🟠 | Story defined |
| **FR-PLAN-022** | WO Status Lifecycle | 1 | 03.10 | 🟡 | ADR-007 defines state machine |
| **FR-PLAN-023** | Configurable WO Statuses | 1b | 03.17 | 🟠 | Story defined |
| **FR-PLAN-024** | WO Gantt Chart View | 1b | 03.15 | 🟠 | Story defined, wireframe PLAN-016 ready |
| **FR-PLAN-025** | Material Reservation | 1b | 03.11b | 🟡 | Code review passed |
| **FR-PLAN-030** | Historical Demand Tracking | 2 | 03.18 | ⚪ | Phase 2, story documented |
| **FR-PLAN-031** | Basic Demand Forecasting | 2 | 03.19 | ⚪ | Phase 2, story documented |
| **FR-PLAN-032** | Safety Stock Management | 2 | -- | ⚪ | Phase 2, no story yet |
| **FR-PLAN-033** | Reorder Point Alerts | 2 | -- | ⚪ | Phase 2, no story yet |
| **FR-PLAN-034** | Master Production Schedule | 2 | 03.20 | ⚪ | Phase 2, story documented |
| **FR-PLAN-035** | MRP Calculation Engine | 2 | 03.21 | ⚪ | Phase 2, story documented |
| **FR-PLAN-036** | Suggested Order Generation | 2 | 03.21 | ⚪ | Phase 2, part of 03.21 |
| **FR-PLAN-037** | MRP Dashboard | 2 | 03.22 | ⚪ | Phase 2, story documented |
| **FR-PLAN-038** | Replenishment Rules | 2 | 03.23 | ⚪ | Phase 2, story documented |
| **FR-PLAN-039** | Auto PO Generation | 2 | 03.23 | ⚪ | Phase 2, part of 03.23 |
| **FR-PLAN-040** | Replenishment Dashboard | 2 | -- | ⚪ | Phase 2, Could Have |
| **FR-PLAN-041** | PO Templates | 2 | 03.24 | ⚪ | Phase 2, story documented |
| **FR-PLAN-042** | Blanket POs | 2 | 03.24 | ⚪ | Phase 2, part of 03.24 |
| **FR-PLAN-050** | Approved Supplier List | 3 | 03.25 | ⚪ | Phase 3, story documented |
| **FR-PLAN-051** | Supplier Scorecards | 3 | 03.26 | ⚪ | Phase 3, story documented |
| **FR-PLAN-052** | Supplier Audits | 3 | -- | ⚪ | Phase 3, no story yet |
| **FR-PLAN-060** | Resource Capacity Definition | 3 | -- | ⚪ | Phase 3, no story yet |
| **FR-PLAN-061** | Finite Capacity Scheduling | 3 | -- | ⚪ | Phase 3, no story yet |
| **FR-PLAN-062** | Capacity Analytics | 3 | -- | ⚪ | Phase 3, no story yet |
| **FR-PLAN-070** | EDI Order Import | 3 | 03.27 | ⚪ | Phase 3, story documented |
| **FR-PLAN-071** | EDI Dispatch Advice | 3 | 03.27 | ⚪ | Phase 3, part of 03.27 |
| **FR-PLAN-072** | VMI Supplier Portal | N/A | -- | ⚪ | Won't Have |

### Coverage Summary

| Metric | Count |
|--|--|
| **Total FRs** | 42 (excluding FR-072 Won't Have) |
| **Phase 1 Must Have** | 15 |
| **Phase 1 Should Have** | 10 |
| **Phase 1 Could Have** | 2 |
| **Phase 2** | 10 |
| **Phase 3** | 7 |
| **Implemented (✅)** | 1 (FR-001, 004) |
| **In Progress (🟡)** | 15 (03.2-03.6, 03.8, 03.9a, 03.10-11b, 03.14-15) |
| **Planned (🟠)** | 12 (03.7, 03.9b, 03.12-13, 03.16-17) |
| **Deferred (⚪)** | 14 (Phase 2) + 7 (Phase 3) |

### Phase 1 Implementation Progress

**Phase 1 MVP (Must Have)**: 15 FRs
- Suppliers: FR-001 (DONE), FR-002-003 (in progress)
- POs: FR-005, FR-006, FR-007, FR-010 (mixed status)
- TOs: FR-012, FR-013, FR-014 (in progress)
- WOs: FR-017, FR-018, FR-019, FR-022 (in progress)

**Estimated Phase 1 Completion**: ~70% (7 FRs fully/mostly done, 8 in QA/review)

---

## Recommendations

### Priority 1: Critical Blockers (Fix This Sprint)

1. **Fix Story 03.3 Bugs** (4 OPEN bugs)
   - BUG-03.3-003 (CRITICAL): Missing @tanstack/react-table dependency → causes build failure
   - BUG-03.3-001 (HIGH): Missing UNIQUE constraint on product per PO
   - BUG-03.3-002 (HIGH): RLS update policy too permissive
   - BUG-03.3-004 (MEDIUM): Table name mismatch (po_lines vs purchase_order_lines)
   - **Action**: Create bug-fix PR, merge, re-run QA for 03.3

2. **Consolidate Duplicate Documentation**
   - Delete: `/ux/PLA-020-po-approval-modal.md`, `PLA-021-*.md`, `PLA-022-*.md`
   - Delete: `/guides/po-approval-workflow-guide.md`
   - Delete: `/other/po-approval-workflow.md`
   - Delete: `/other/03.13-material-availability.md`
   - **Justification**: Reduces documentation debt, removes confusion from multiple sources of truth.

3. **Remove Duplicate Code Review Files**
   - Delete: `code-review-story-03.4.md` (subsumed by combined review)
   - Delete individual story reviews if combined review exists
   - Update checkpoint to point to combined review
   - **Justification**: Single source of truth for review results.

### Priority 2: Documentation Quality (Next Sprint)

4. **Create FR-to-Story Mapping**
   - File: `/stories/FR-TO-STORY-MAPPING.md`
   - Maps each FR-PLAN-XXX → Story 03.Y → AC list
   - Helps verify complete coverage
   - Add to CLAUDE.md as required reference

5. **Standardize Checkpoint Schema**
   - Define template in `.claude/templates/checkpoint-template.yaml`
   - Regenerate all 17 story checkpoints with consistent fields
   - Include in CLAUDE.md documentation

6. **Add Database Documentation Index**
   - File: `/decisions/DATABASE-SCHEMA-INDEX.md`
   - Links to all table definitions (planning-arch.md, story context, migrations)
   - Single source of truth annotation
   - Validation checklist for schema changes

7. **Cross-Reference Duplicate Guides**
   - Keep `/guides/purchase-orders.md` (implementation patterns)
   - Link to `/api/purchase-orders.md` (API spec)
   - Add "See also" sections in both files

### Priority 3: Process Improvements (Ongoing)

8. **Implement Consistency Checks in CI**
   - Validate that all story context files have required _index.yaml fields
   - Check that all bugs in story are linked to checkpoint
   - Verify FR-to-Story mapping completeness
   - Check for duplicate files (>80% similarity)

9. **Archive Old/Obsolete Files**
   - Create `/other/archive/` subdirectory
   - Move outdated checkpoints (before 2026-01-01) to archive
   - Move superseded code reviews to archive
   - Update .gitignore to not display archive in searches

10. **Update CLAUDE.md**
    - Add section: "Documentation Structure for Planning Module"
    - Include:
      - File inventory summary
      - Canonical location for each artifact type
      - Cross-reference guidance (FR → Story → ACs)
      - Checkpoint standardization requirements
      - Duplicate detection rules

### Priority 4: Future Structure Improvements

11. **Rename Story 03.4 Artifacts**
    - Rename `03.4.HANDOFF-TO-DEV.md` → move to standard location
    - Create `/stories/reports/` directory for test summaries, refactor reports
    - Move story-level reports there

12. **Implement Wireframe Numbering Consistency**
    - Audit all 26 wireframes for completeness (PLAN-001 through PLAN-027)
    - Verify no gaps in sequence
    - Update UX directory structure: organize by feature area (suppliers/, pos/, tos/, wos/)

---

## Summary Statistics

| Category | Count | Status |
|--|--|--|
| **Total Files** | 331 | |
| **Story Files** | 27 | ✅ Complete |
| **Story Context Files** | 155 | ✅ Well-structured (17 stories × 5 files + tests) |
| **QA Reports** | 25 | ✅ Comprehensive |
| **Code Reviews** | 18 | ✅ Complete (some consolidation recommended) |
| **API Docs** | 5 | ✅ Detailed |
| **UX Wireframes** | 26 | ✅ Complete (3 duplicates to remove) |
| **ADRs** | 3 | ✅ Current |
| **Bugs** | 5 | 🔴 4 in story 03.3 blocking progress |
| **Guides** | 2 | 🟡 1 duplicate, 1 redundant |
| **Checkpoints** | 17 | 🟡 Format inconsistency |
| **Other Docs** | 27 | 🟡 Some archives, some duplicates |

### High-Level Status

- **Documentation Completeness**: 85% (stories, context, UX, QA, reviews well-done)
- **Consistency**: 65% (naming, checkpoint schema, duplicate content issues)
- **Code Status**: ~70% (Phase 1 MVP ~60% implemented, rest in planning/early development)
- **Blocker Status**: 1 critical (03.3 build failure), 3 high (03.3 RLS/unique constraint)

---

**Report End**
