# NPD Module Documentation Analysis
**Date**: 2026-02-16
**Scope**: /workspaces/MonoPilot/new-doc/09-npd/
**Analyzed Files**: 114 markdown and YAML files

---

## 1. INVENTORY: Complete File Listing

### PRD & Architecture (2 files)
| File | Type | Summary |
|------|------|---------|
| `prd/npd.md` | PRD | Complete NPD module specification (1,005 lines): Stage-Gate workflow, formulations, costing, compliance, handoff wizard, 74 functional requirements |
| `decisions/npd-arch.md` | Architecture | Architecture & design patterns (447 lines): Database schema, API design, data flows, security model, event sourcing, performance targets |

### Stories - Main Files (18 files)
| ID | File | Complexity | Est. Days | Summary |
|----|----|-----------|----------|---------|
| 08.1 | `stories/08.1.npd-settings-module-config.md` | S | 1-2 | NPD settings table, module activation toggle, costing thresholds, compliance doc requirements |
| 08.2 | `stories/08.2.npd-projects-crud-kanban.md` | L | 4-5 | NPD projects table, auto-generated number (NPD-YYYY-NNNNN), Kanban dashboard with 6 gate columns, drag-drop advancement |
| 08.3 | `stories/08.3.stage-gate-workflow.md` | L | 5-6 | Stage-Gate state machine (G0→G1→G2→G3→G4→Launched), gate checklists, approval workflow, reopen capability |
| 08.4 | `stories/08.4.formulations-crud-versioning.md` | L | 5-6 | Formulation CRUD with versioning (v1.0, v1.1, v2.0), effective dates, lineage tracking, versioning lock, overlap detection |
| 08.5 | `stories/08.5.allergen-aggregation-display.md` | M | 3-4 | Auto-aggregate allergens from formulation items, allergen declaration, 14 EU + 9 US allergens, cross-contamination warnings |
| 08.6 | `stories/08.6.gate-approvals-history.md` | M | 2-3 | Gate approval modal (approve/reject), role-based permissions, approval history timeline, e-signature support, email notifications |
| 08.7 | `stories/08.7.formulation-costing.md` | M | 3-4 | Target/estimated/actual cost tracking, cost variance calculation, variance alerts (warning 20%, blocker 50%), Finance approval workflow |
| 08.8 | `stories/08.8.compliance-documents-upload.md` | M | 3-4 | Document upload with drag-drop, categorization (HACCP, label, allergen, certificate), version history, download/preview |
| 08.9 | `stories/08.9.formulation-compare-clone.md` | M | 2-3 | Side-by-side formulation diff, highlight added/removed/changed items, cost comparison, clone to new version |
| 08.10 | `stories/08.10.risk-management.md` | M | 3-4 | Risk register with likelihood/impact matrix (risk score 1-9), mitigation plans, status tracking (open/mitigated/accepted) |
| 08.11 | `stories/08.11.handoff-wizard.md` | L | 5-6 | 8-step handoff wizard: validation → product decision → BOM transfer → pilot WO → execute → confirm, transactional execution, rollback |
| 08.12 | `stories/08.12.handoff-formulation-to-bom.md` | M | 3-4 | Convert formulation items to BOM items 1:1, set NPD origin flags, establish traceability, BOM numbering (BOM-{CODE}-v{VER}) |
| 08.13 | `stories/08.13.handoff-pilot-wo-creation.md` | M | 3-4 | Create pilot WO type, link to NPD project, use default routing from settings, auto-generate WO number (WO-PILOT-{PROJECT}-{SEQ}) |
| 08.14 | `stories/08.14.npd-only-mode-export.md` | M | 2-3 | NPD-only mode for R&D consultancies (no production), export to PDF/Excel recipe cards, standalone formulation development |
| 08.15 | `stories/08.15.event-sourcing-notifications.md` | M | 3-4 | Event sourcing with retry mechanism (3 retries, exponential backoff), notifications (gate approval, cost variance, handoff), audit trail |
| 08.16 | `stories/08.16.timeline-view-reporting.md` | M | 2-3 | Timeline view (Gantt-style), project duration bars, overdue highlighting, CSV export, reporting dashboard |
| 08.17 | `stories/08.17.finance-approval-workflow.md` | M | 2-3 | Finance approval workflow for costing, cost variance validation before handoff, blocker enforcement, approval history |
| 08.18 | `stories/08.18.access-control-audit-trail.md` | M | 2-3 | Role-based access control (NPD Lead, R&D, Regulatory, Finance, Production), RLS enforcement on all NPD tables, formulation access audit log |

### Stories - Context Files (90 files total)
Stories 08.1 through 08.18 each have a `context/` folder with:
- `_index.yaml` - Story metadata, dependencies, files to create/read
- `api.yaml` - API endpoints, request/response schemas
- `database.yaml` - Table definitions, RLS policies, indexes
- `frontend.yaml` - Components, pages, hooks, UX patterns
- `tests.yaml` - Acceptance criteria, test specifications
- `validation.yaml` (08.1 only) - Zod schemas

**Total context files**: 88 YAML files (18 stories × 5 files, minus 08.1 which has validation.yaml instead of tests/frontend)

### Implementation Planning (2 files)
| File | Summary |
|------|---------|
| `stories/IMPLEMENTATION-ROADMAP.yaml` | 18 stories across 3 phases (22-28 days Phase 1, 20-26 days Phase 2, 8-12 days Phase 3), timeline, dependencies, deliverables |
| `stories/implementation-plan.md` | Executive summary, phase breakdown, module value prop, module type (premium add-on, +$30/user/month) |

### UX Wireframes (15 files)
| ID | File | Feature | Summary |
|----|------|---------|---------|
| NPD-001 | `ux/NPD-001-projects-kanban-dashboard.md` | Kanban Dashboard | 6 gate columns, card design, filter panel, card shows priority/owner/target date |
| NPD-002 | `ux/NPD-002-project-detail-page.md` | Project Detail | Tabs for gate progress, formulations, costing, risks, documents, approval history |
| NPD-003 | `ux/NPD-003-stage-gate-timeline.md` | Stage-Gate Timeline | Horizontal stepper (G0-G4 + Launched), progress indicator, completion status, blocking conditions |
| NPD-004 | `ux/NPD-004-gate-checklist-panel.md` | Gate Checklist | Collapsible sections per gate, progress bar, required item badges, attach documents |
| NPD-005 | `ux/NPD-005-advance-gate-modal.md` | Advance Gate Modal | Show validation checklist, pass/fail icons, blocker explanations, proceed/cancel buttons |
| NPD-006 | `ux/NPD-006-formulation-list-page.md` | Formulation List | Columns: version, status, effective dates, item count, actions: view/edit/clone/compare |
| NPD-007 | `ux/NPD-007-formulation-editor.md` | Formulation Editor | Version input, total qty, ingredient search, percentage calculator, allergen preview |
| NPD-008 | `ux/NPD-008-handoff-wizard-8-steps.md` | Handoff Wizard | 8-step modal: validation → product → BOM → pilot WO → routing → summary → execute → confirm |
| NPD-009 | `ux/NPD-009-formulation-version-timeline.md` | Version Timeline | Horizontal timeline of formulation versions, effective date ranges, parent/child links |
| NPD-010 | `ux/NPD-010-gate-approval-modal.md` | Gate Approval Modal | Approve/reject buttons, notes input, e-signature field, rejection reason requirement |
| NPD-011 | `ux/NPD-011-approval-history-timeline.md` | Approval History | Vertical timeline of gate approvals, approver name/date, approval notes, rejection reason |
| NPD-012 | `ux/NPD-012-formulation-costing-card.md` | Costing Card | Target/estimated/actual costs, variance indicator (color-coded), cost history chart, approval status |
| NPD-013 | `ux/NPD-013-compliance-documents-section.md` | Compliance Docs | Upload with drag-drop, category filter, version history, download/preview, missing doc warnings |
| NPD-014 | `ux/NPD-014-formulation-compare-view.md` | Compare View | Side-by-side diff, highlight added/removed/changed items, cost difference, version selectors |
| NPD-015 | `ux/NPD-015-risk-register-matrix.md` | Risk Matrix | 3×3 likelihood/impact matrix, color-coded scores (1-9), table view with details |

---

## 2. DUPLICATES: Content Overlap Analysis

### HIGH PRIORITY DUPLICATES

#### A. Handoff Workflow (3 Stories - Potential Consolidation Candidates)

**Story 08.11 (Handoff Wizard)** vs **08.12 (BOM Conversion)** vs **08.13 (Pilot WO)**

**Findings:**
- **08.11**: 8-step UI wizard that CALLS 08.12 and 08.13 as part of the flow
- **08.12**: Standalone API endpoint for formulation → BOM conversion
- **08.13**: Standalone API endpoint for creating pilot WO

**Analysis:**
- **Not duplicates** - these are properly layered:
  - 08.11 = Frontend UI orchestration (Step 1-8 wizard flow)
  - 08.12 = Backend API for BOM creation logic
  - 08.13 = Backend API for Pilot WO creation logic
- **Potential issue**: 08.11 depends on 08.12 and 08.13 (hard dependencies), but they're listed as Phase 2. 08.11 itself is Phase 2, so execution order is correct.

**Recommendation**: KEEP ALL THREE - they are properly separated concerns. However, verify in implementation that:
- 08.11 wizard calls endpoints from 08.12 and 08.13
- Error handling in wizard propagates failures from backend

---

#### B. Gate Approvals (2 Stories - Potential Overlap)

**Story 08.3 (Stage-Gate Workflow)** mentions gate approvals
**Story 08.6 (Gate Approvals & History)** explicitly implements approvals

**Analysis:**
- **08.3**: Focus is on **workflow state machine** - advancing gates, entry criteria, checklist completion blocking
- **08.6**: Focus is on **approval modal UI** - approve/reject, notes, e-signature, approval history
- **Overlap**: Both mention "support gate approvals (FR-NPD-19)" and "approval history (FR-NPD-21, 22)"

**PRD Coverage:**
- FR-NPD-19: "System shall support gate approvals" - covered by 08.6
- FR-NPD-21: "System shall log approvals" - covered by 08.6
- FR-NPD-22: "System shall show approval history" - covered by 08.6
- FR-NPD-03: "Enforce gate entry criteria" - covered by 08.3

**Recommendation**: KEEP BOTH but clarify scope:
- **08.3** = Workflow state machine + checklist blocking logic
- **08.6** = Approval UI + approval logging

Current dependencies show 08.6 depends on 08.3, which is correct.

---

#### C. Costing & Finance Approval (2 Stories - Potential Overlap)

**Story 08.7 (Formulation Costing)** vs **Story 08.17 (Finance Approval Workflow)**

**Analysis:**
- **08.7**: Target/estimated/actual cost tracking, variance alerts, "Finance role shall approve costing"
- **08.17**: "Finance approval workflow for costing, cost variance validation before handoff"

**Findings:**
- These **significantly overlap** in scope
- Both mention FR-NPD-29: "Finance role shall approve costing"
- Both mention cost variance validation
- 08.7 mentions "Finance approval workflow" in its acceptance criteria
- 08.17 seems to be a duplicate of 08.7 functionality

**Recommendation**: **CONSOLIDATE INTO ONE STORY**
- **KEEP**: 08.7 "Formulation Costing" (already includes approval workflow)
- **DELETE**: 08.17 "Finance Approval Workflow" - this is redundant
- Verify that 08.7 covers all requirements from 08.17 (cost variance blocking handoff, approval UI, email notifications)

---

#### D. Allergen Aggregation (1 Story with Distributed References)

**Story 08.5 (Allergen Aggregation & Display)**

**Analysis:**
- **08.5** provides core allergen aggregation logic
- **08.4** (Formulations) references allergen preview in editor
- **08.8** (Compliance Documents) mentions allergen declaration
- **08.12** (BOM Handoff) mentions allergen transfer to BOM
- **Soft dependency**: 08.12 lists 08.5 as soft dependency ("Allergens not transferred to BOM if missing")

**Finding**: This is NOT a duplicate - 08.5 provides the core logic, other stories consume it. Proper separation of concerns.

**Recommendation**: KEEP - properly designed

---

#### E. Compliance Documents (1 Story with UX Component)

**Story 08.8 (Compliance Documents Upload)** vs UX files NPD-013

**Analysis:**
- 08.8 provides the backend: upload, categorization, version history, missing doc warnings
- NPD-013 provides the UI wireframe: drag-drop, file types, preview, validation

**Finding**: NPD-013 is intentionally separate as UX reference for 08.8. Not a duplicate.

**Recommendation**: KEEP - proper UX/story separation

---

### MEDIUM PRIORITY OVERLAPS

#### F. Reporting & Export (3 Stories)

**Stories 08.16 (Timeline View & Reporting)** mentions "CSV export"
**Story 08.14 (NPD-Only Mode & Export)** mentions "PDF/Excel export"
**PRD Section 8.4** mentions "Export to PDF/Excel"

**Analysis:**
- **08.14**: NPD-only mode PDF/Excel recipe cards (formulation export for consultancies)
- **08.16**: CSV export of projects, formulations, costing (reporting)
- **Scope**: Different export formats and different use cases
  - 08.14 = Recipe card export (single formulation as PDF/Excel)
  - 08.16 = Project list CSV export (multiple projects)

**Finding**: Not a duplicate, but related. Different export targets and formats.

**Recommendation**: KEEP BOTH but clarify:
- 08.14 = Formulation recipe card export (PDF/Excel) for NPD-only mode
- 08.16 = Project list CSV export for reporting

---

#### G. Risk Management (1 Story - Standalone)

**Story 08.10 (Risk Management)**

**Analysis:**
- Standalone risk register with likelihood/impact matrix
- No overlap with other stories
- UX wireframe NPD-015 provides the matrix visualization

**Recommendation**: KEEP - properly scoped

---

### LOW PRIORITY OVERLAPS

#### H. Event Sourcing (1 Story)

**Story 08.15 (Event Sourcing & Notifications)**

**Analysis:**
- Event sourcing with retry mechanism (3 retries, exponential backoff)
- Notifications (gate approval, cost variance, handoff)
- Cross-cutting concern that affects all other stories

**Finding**: Properly scoped as separate story. Not a duplicate.

**Recommendation**: KEEP - this should be implemented early to support other stories

---

## 3. INCONSISTENCIES: Contradictions & Conflicts

### CRITICAL INCONSISTENCIES

#### Issue 1: Story 08.17 (Finance Approval Workflow) is Redundant

**Conflict**:
- **Story 08.7** includes "Finance role shall approve costing" with approval workflow in acceptance criteria
- **Story 08.17** is titled "Finance Approval Workflow" and covers the same FR-NPD-29

**Evidence**:
- PRD (line 845): "FR-NPD-29 | Finance role shall approve costing | Must"
- 08.7 (lines 3-4): "Primary PRD: ... FR-NPD-29"
- 08.17 (context/_index.yaml): Lists FR-NPD-29 as covered
- Both stories map to same FR

**Impact**:
- Double coverage of same feature
- 08.17 is Phase 3 (Timeline Week 13-15) but 08.7 is Phase 1 (Week 1-6)
- Potential for duplicate work

**Recommendation**: **DELETE Story 08.17**
- Verify all FR requirements from 08.17 are covered by 08.7
- Update Phase 3 to remove 08.17 slot (3 stories → 2 stories)
- Recalculate Phase 3 timeline (8-12 days becomes ~4-6 days)

---

#### Issue 2: Story 08.14 (NPD-Only Mode Export) vs Story 08.16 (Timeline & Reporting) Export Scope Unclear

**Conflict**:
- **08.14**: "NPD-only mode shall export to PDF/Excel"
- **08.16**: Lists "CSV export (projects, formulations, costing)" as deliverable
- PRD mentions both PDF/Excel and CSV without clearly assigning to stories

**Evidence**:
- NPD-14.md (line 6): "Type: backend" - but export is often UI-heavy
- 08.16.md (line 4): "Features: Timeline view (Gantt) + CSV export + reporting"
- PRD (Section 8.3): "Export to PDF/Excel" under Handoff (no mention of CSV)
- PRD (Section 12, line 771): "`GET /api/npd/projects/:id/export`" - ambiguous endpoint

**Recommendation**: CLARIFY in documentation:
- **08.14** = Formulation/recipe card export (PDF/Excel) for NPD-only consultancy mode - KEEP
- **08.16** = Project list CSV export for reporting - CLARIFY as part of reporting feature
- Create separate FR for project CSV export to avoid ambiguity

---

#### Issue 3: Stage-Gate Gate Advancement Responsibility (08.2 vs 08.3)

**Conflict**:
- **08.2** (Projects CRUD & Kanban): "Drag-and-drop gate advancement" in MVP scope
- **08.3** (Stage-Gate Workflow): "Advance to next gate with approval" and "enforce entry criteria"

**Evidence**:
- 08.2.md (line 53): "Kanban dashboard with drag-drop gate advancement"
- 08.2.md (line 54): Same as 08.3 scope
- 08.3.md (line 46): "Full workflow gates: G0 → G1... cannot skip gates, proper sequence enforcement"
- 08.2 context/_index.yaml: Lists 08.3 as blocked dependency ("Needs gate checklists")

**Finding**: Not necessarily a conflict - 08.2 drag-drop is frontend UI, 08.3 is backend validation
- 08.2 provides UI for advancement
- 08.3 validates rules server-side
- BUT: 08.2 doesn't depend on 08.3, which seems wrong

**Recommendation**: **UPDATE DEPENDENCIES**
- 08.2 should depend on 08.3 for gate advancement validation
- OR split 08.2 into:
  - 08.2a: Projects CRUD (no gate advancement)
  - 08.2b: Kanban dashboard with advancement (depends on 08.3)

---

#### Issue 4: Formulation Approval/Lock Mechanism (08.4 vs 08.3)

**Conflict**:
- **08.4** (Formulations CRUD): "Lock formulation on approval" - Story 08.4 scope
- **08.3** (Stage-Gate Workflow): "Formulation locked" is G3 entry criteria and G3→G4 blocker

**Evidence**:
- 08.4.md (line 32): "POST /api/npd/formulations/:id/approve - Approve and lock"
- 08.3.md (line 52): "G3 approval, formulation locked, trials complete"
- PRD (line 819): "FR-NPD-13 | System shall lock formulation on approval | Must"
- Gate entry table (PRD line 114): "G3 → G4 | G3 approval, formulation locked, trials complete"

**Finding**: These are related but not conflicting:
- 08.4 provides the lock API (POST /approve)
- 08.3 uses the lock status in workflow validation
- **Potential issue**: Unclear who can approve (08.4 doesn't specify role)

**Recommendation**: CLARIFY in both stories:
- 08.4 should specify which roles can approve (NPD Lead? Regulatory? Director?)
- 08.3 should reference 08.4's approval endpoint for validation
- Update dependency: 08.3 depends on 08.4

---

### MODERATE INCONSISTENCIES

#### Issue 5: Pilot WO Costing Feedback Loop (08.7 vs 08.13)

**Conflict**:
- **08.7** (Costing): "Actual cost from pilot WO feeds back to 08.7"
- **08.13** (Pilot WO): No mention of feeding cost back to costing

**Evidence**:
- 08.13.md (line 38): "Actual cost from pilot WO feeds back to 08.7 costing (cost_actual field)"
- But in 08.13 acceptance criteria: No tests for cost feedback
- 08.7 context/database.yaml: No mention of pilot WO link

**Finding**: Unclear who is responsible for cost feedback
- Is it 08.13's job to feed cost back when WO is completed?
- Or is it a separate story (Phase 3)?

**Recommendation**: CLARIFY:
- **Option A**: 08.13 should be expanded to include cost feedback on WO completion
- **Option B**: Create separate Phase 2/3 story for cost feedback integration
- Update both stories to clarify the integration point

---

#### Issue 6: NPD-Only Mode Scope (08.1, 08.14, 08.11)

**Conflict**:
- **08.1** (Settings): `npd_only_mode` boolean toggle
- **08.14** (NPD-Only Export): Implements NPD-only mode export
- **08.11** (Handoff Wizard): "Dual mode support: Integrated (with Production) vs NPD-Only (export PDF)"

**Evidence**:
- NPD PRD (line 35): "npd_only_mode boolean false | NPD without Production (R&D consultancy)"
- 08.14.md (line 1): "NPD-Only Mode & Export"
- 08.11.md (line 46): "Dual mode support: ... NPD-Only (export PDF)"

**Finding**: Scope overlap:
- 08.1 creates the toggle (backend setting)
- 08.14 implements export for NPD-only mode
- 08.11 claims to support dual mode but marked as Phase 2

**Recommendation**: CLARIFY story scopes:
- **08.1** = Create NPD-only toggle in settings (already correct)
- **08.11** = Handoff wizard for INTEGRATED mode only (removes "NPD-only" from MVP)
- **08.14** = NPD-only export (separate feature, Phase 2)
- **OR consolidate**: 08.11 + 08.14 both handle NPD-only logic

Current state: **08.11 should not include NPD-only mode** - that's 08.14's job.

---

### DOCUMENTATION INCONSISTENCIES

#### Issue 7: Project Number Format Inconsistency

**Conflict**:
- **PRD** (line 57): "`project_number` string"
- **08.2** (line 47): "Project number auto-generation: NPD-YYYY-NNNNN"
- **08.2 context** database.yaml: "Format specification missing"
- **Arch doc** (line 47): "project_number VARCHAR(50) NOT NULL UNIQUE"

**Finding**: Format is specified in story but not in PRD or arch doc

**Recommendation**: ADD to PRD:
```
project_number format: NPD-YYYY-NNNNN
- NPD: module prefix
- YYYY: current year (auto)
- NNNNN: sequential number (auto-increment, resets yearly)
Example: NPD-2025-00001, NPD-2025-00002, ..., NPD-2026-00001
```

---

#### Issue 8: Formulation Number Format Inconsistency

**Conflict**:
- **PRD** (line 156): "formulation_number string | Version identifier (v1.0, v1.1, v2.0)"
- **Arch doc** (line 66): "formulation_number VARCHAR(20) NOT NULL -- v1.0, v1.1, v2.0"
- **08.4**: "Version number (auto-increment or manual)"

**Finding**: Unclear if manual entry is allowed for version numbers

**Recommendation**: CLARIFY in 08.4:
- Specify whether version numbers are auto-generated or user-editable
- If auto-generated, document the algorithm (e.g., major.minor format)
- If user-editable, specify validation rules

---

#### Issue 9: Allergen Declaration Scope (08.5, 08.8, 08.12)

**Conflict**:
- **08.5** (Allergen Aggregation): Auto-aggregates allergens from items, displays declaration
- **08.8** (Compliance Documents): May include allergen declaration as uploaded document
- **08.12** (BOM Handoff): "Inherit allergens" when transferring to BOM

**Finding**: Unclear if allergen declaration is:
- Auto-generated summary (08.5 output)?
- Uploaded document (08.8 input)?
- Both?

**Recommendation**: CLARIFY:
- **Auto-generated allergen summary** (08.5 output): Shown in formulation detail for reference
- **Allergen Declaration document** (08.8 upload): Formal regulatory document uploaded by Regulatory role
- **Transfer to BOM** (08.12): Copy auto-generated allergens + reference to uploaded document

---

## 4. KEY REQUIREMENTS: Complete FR Extraction

### Phase 1 - MVP Core (Stories 08.1-08.8)

#### Group 1: Settings & Configuration (FR-NPD-01) - Story 08.1
- **FR-NPD-01**: System shall create NPD projects with auto-generated number
  - `enable_npd_module` toggle (feature flag)
  - `npd_only_mode` toggle (R&D consultancy mode)
  - `cost_variance_warning_pct` = 20%
  - `cost_variance_blocker_pct` = 50%
  - `require_compliance_docs` = true
  - `enable_pilot_wo` = true
  - `max_formulation_versions` = 10
  - `event_retention_days` = 90

#### Group 2: Projects & Workflow (FR-NPD-02 to FR-NPD-05) - Story 08.2
- **FR-NPD-02**: System shall advance projects through Stage-Gate workflow (G0→G1→G2→G3→G4→Launched)
- **FR-NPD-04**: System shall display Kanban pipeline view (6 gate columns, drag-drop)
- **FR-NPD-05**: System shall filter dashboard by category, priority, owner, status

#### Group 3: Gate Management (FR-NPD-03, FR-NPD-17 to FR-NPD-22) - Stories 08.3, 08.6
- **FR-NPD-03**: System shall enforce gate entry criteria (checklist completion, sequential advancement)
- **FR-NPD-17**: System shall display gate checklists per gate (G0-G4)
- **FR-NPD-18**: System shall mark checklist items complete with notes and attachments
- **FR-NPD-19**: System shall support gate approvals (approve/reject with notes)
- **FR-NPD-20**: System shall block advancement for incomplete required items
- **FR-NPD-21**: System shall log approvals (who, when, decision)
- **FR-NPD-22**: System shall show approval history (timeline view)

#### Group 4: Formulation Management (FR-NPD-08 to FR-NPD-14) - Story 08.4
- **FR-NPD-08**: System shall create formulations with versioning (v1.0, v1.1, v2.0)
- **FR-NPD-09**: System shall add formulation items with product search
- **FR-NPD-11**: System shall support effective dates (effective_from, effective_to)
- **FR-NPD-12**: System shall prevent overlapping versions (DB trigger)
- **FR-NPD-13**: System shall lock formulation on approval (immutable)
- **FR-NPD-14**: System shall track formulation lineage (parent_formulation_id)

#### Group 5: Allergen Management (FR-NPD-10, FR-NPD-30, FR-NPD-61) - Story 08.5
- **FR-NPD-10**: System shall auto-aggregate allergens from formulation items
- **FR-NPD-30**: System shall display allergen declaration (14 EU + 9 US allergens)
- **FR-NPD-61**: System shall reuse allergens table from Quality module

#### Group 6: Costing (FR-NPD-23 to FR-NPD-29) - Story 08.7
- **FR-NPD-23**: System shall enter target cost
- **FR-NPD-24**: System shall calculate estimated cost (sum of item costs)
- **FR-NPD-25**: System shall record actual cost from pilot WO
- **FR-NPD-26**: System shall calculate cost variance percentage
- **FR-NPD-27**: System shall display variance alerts (warning >20%, blocker >50%)
- **FR-NPD-28**: System shall show cost history across versions
- **FR-NPD-29**: Finance role shall approve costing (submit/approve workflow)

#### Group 7: Compliance (FR-NPD-31 to FR-NPD-35) - Story 08.8
- **FR-NPD-31**: System shall upload compliance documents (drag-drop)
- **FR-NPD-32**: System shall categorize documents (HACCP, label, allergen, certificate, other)
- **FR-NPD-33**: System shall track document metadata (version, mime_type, file_size)
- **FR-NPD-34**: System shall show document history (version timeline)
- **FR-NPD-35**: System shall validate doc completeness for handoff (required docs check)

---

### Phase 2 - Advanced Features (Stories 08.9-08.15)

#### Group 8: Formulation Comparison & Cloning (FR-NPD-15, FR-NPD-16) - Story 08.9
- **FR-NPD-15**: System shall compare formulation versions (side-by-side diff)
- **FR-NPD-16**: System shall clone formulations (new version from existing)

#### Group 9: Risk Management (FR-NPD-48 to FR-NPD-52) - Story 08.10
- **FR-NPD-48**: System shall add risks with likelihood/impact
- **FR-NPD-49**: System shall calculate risk score (likelihood × impact, 1-9)
- **FR-NPD-50**: System shall enter mitigation plan
- **FR-NPD-51**: System shall update risk status (open, mitigated, accepted)
- **FR-NPD-52**: System shall sort risks by score

#### Group 10: Handoff Workflow (FR-NPD-37 to FR-NPD-47) - Stories 08.11-08.13
- **FR-NPD-37**: System shall initiate handoff wizard (8-step UI)
- **FR-NPD-38**: System shall validate handoff eligibility (G4 approved, docs complete)
- **FR-NPD-39**: System shall display validation checklist
- **FR-NPD-40**: User can choose create new or update existing product
- **FR-NPD-41**: System shall transfer formulation to BOM (formulation_items → bom_items)
- **FR-NPD-42**: System shall create pilot WO optionally (type='pilot')
- **FR-NPD-43**: System shall display handoff summary (review all actions)
- **FR-NPD-44**: System shall execute handoff transactionally (ACID compliance)
- **FR-NPD-45**: System shall log handoff event (NPD.HandoffCompleted)
- **FR-NPD-46**: System shall update status to launched (project.status='launched')
- **FR-NPD-47**: NPD-only mode shall export to PDF/Excel (recipe cards)

#### Group 11: Event Sourcing & Notifications (FR-NPD-53 to FR-NPD-56, FR-NPD-70 to FR-NPD-74) - Story 08.15
- **FR-NPD-53**: System shall log critical events (event sourcing table)
- **FR-NPD-54**: System shall retry failed events (3 retries, exponential backoff)
- **FR-NPD-55**: Admin shall view event log (read-only dashboard)
- **FR-NPD-56**: Admin shall replay failed events (force retry)
- **FR-NPD-70**: System shall notify on gate approval required
- **FR-NPD-71**: System shall notify Finance for costing approval
- **FR-NPD-72**: System shall alert on cost variance
- **FR-NPD-73**: System shall alert on missing compliance docs
- **FR-NPD-74**: System shall notify Production on handoff

---

### Phase 3 - Enterprise Features (Stories 08.16-08.18)

#### Group 12: Reporting & Export (FR-NPD-06, FR-NPD-07) - Story 08.16
- **FR-NPD-06**: System shall display timeline view (Gantt-style bars, overdue highlighting)
- **FR-NPD-07**: System shall export project list to CSV (reporting)

#### Group 13: Integration & Traceability (FR-NPD-57 to FR-NPD-62) - Stories 08.13, 08.12
- **FR-NPD-57**: System shall support pilot WO type (work_orders.type='pilot')
- **FR-NPD-58**: System shall track NPD origin on products (products.source='npd')
- **FR-NPD-59**: System shall track formulation origin on BOM (boms.npd_formulation_id)
- **FR-NPD-60**: System shall support trial outputs (linked to pilot WO)
- **FR-NPD-62**: System shall reuse approvals table (from existing module)

#### Group 14: Access Control & Audit (FR-NPD-63 to FR-NPD-69) - Story 08.18
- **FR-NPD-63**: NPD Lead shall create/edit/delete projects (full CRUD)
- **FR-NPD-64**: R&D shall view/edit assigned formulations
- **FR-NPD-65**: Regulatory shall upload compliance docs
- **FR-NPD-66**: Finance shall approve costing
- **FR-NPD-67**: Production shall view handoff projects (read-only)
- **FR-NPD-68**: System shall enforce RLS on NPD tables (org_id isolation)
- **FR-NPD-69**: System shall audit formulation access (IP protection)

---

## 5. SUMMARY OF RECOMMENDED ACTIONS

### Immediate Actions (High Priority)

1. **DELETE Story 08.17** (Finance Approval Workflow)
   - Redundant with 08.7 (Formulation Costing)
   - Both cover FR-NPD-29
   - Consolidate into single story
   - Update Phase 3 timeline: 8-12 days → 4-6 days

2. **CLARIFY Story 08.11 NPD-Only Mode Scope**
   - Remove NPD-only mode from 08.11 (Handoff Wizard)
   - NPD-only mode is 08.14's responsibility
   - Clarify: 08.11 handles INTEGRATED mode (with Production)
   - Add explicit note: "NPD-only export handled separately in 08.14"

3. **ADD DEPENDENCY: 08.3 (Stage-Gate) ← 08.4 (Formulation Approval)**
   - 08.3 validates formulation lock status
   - 08.4 implements formulation approval/lock API
   - 08.3 must depend on 08.4 for gate validation

4. **CLARIFY COSTING FEEDBACK LOOP (08.7 ↔ 08.13)**
   - Explicitly define who feeds pilot WO actual cost back to costing
   - Option A: 08.13 includes cost feedback when WO completed
   - Option B: Separate Phase 3 story for cost integration
   - Add test case for cost feedback flow

### Medium Priority Actions

5. **CLARIFY Export Scope (08.14 vs 08.16)**
   - 08.14: Formulation recipe card export (PDF/Excel) for NPD-only consultancies
   - 08.16: Project list CSV export for reporting
   - Create separate FR for 08.16 CSV export (FR-NPD-07b)

6. **UPDATE PROJECT NUMBER DOCUMENTATION**
   - Add format specification to PRD: "NPD-YYYY-NNNNN"
   - Document yearly reset behavior
   - Add examples

7. **CLARIFY ALLERGEN DECLARATION (08.5 vs 08.8)**
   - Auto-generated summary (08.5) vs uploaded document (08.8)
   - Both exist, different purposes
   - Document in 08.5 and 08.8 acceptance criteria

8. **UPDATE FORMULATION APPROVAL ROLE SPECIFICATION**
   - 08.4 should specify which roles can approve formulations
   - Update both 08.4 and 08.3 stories

### Low Priority Documentation Improvements

9. **Standardize API Endpoint Naming**
   - Some endpoints use `/handoff`, others use `/handoff/validate`
   - Ensure RESTful consistency across all 18 stories

10. **Cross-Reference UX Wireframes in Context Files**
    - Context files reference NPD-001 to NPD-015
    - Verify all stories reference appropriate wireframes
    - Missing reference: 08.1 (Settings) - no UX wireframe

---

## 6. FILE HEALTH METRICS

| Metric | Value | Status |
|--------|-------|--------|
| Total files analyzed | 114 | ✓ Complete |
| Story completion | 18/18 | ✓ 100% |
| Context files completeness | 88/90 | ⚠ 97% (08.1 uses validation.yaml instead of frontend/tests) |
| UX wireframes | 15/15 | ✓ 100% |
| PRD completeness | 1/1 | ✓ Comprehensive |
| Architecture docs | 1/1 | ✓ Complete |
| Critical inconsistencies found | 3 | ⚠ Requires action |
| Duplicate stories identified | 1 | ⚠ 08.17 (delete) |
| Dependency errors | 2 | ⚠ Requires fix |

---

## 7. CONCLUSION

The NPD module documentation is **well-organized and comprehensive** with 114 files covering all aspects of a premium feature module. Key findings:

**Strengths:**
- Complete PRD (1,005 lines) with 74 functional requirements
- All 18 stories have dedicated context YAML files
- 15 UX wireframes provide visual specifications
- Clear 3-phase implementation roadmap (50-66 days)
- Proper separation of concerns (UI, API, Database per story)

**Weaknesses:**
- Story 08.17 is redundant (DELETE)
- Story 08.11 NPD-only scope unclear (CLARIFY)
- Missing dependency: 08.3 ← 08.4 (ADD)
- Costing feedback loop responsibility unclear (CLARIFY)
- Phase 3 timeline error (recalculate after 08.17 deletion)

**Recommendation:** Address the 4 critical action items above, then documentation is ready for implementation sprint planning.

---

**Analysis Completed**: 2026-02-16
**Analyzer**: Claude Code Documentation Analysis
**Next Step**: Implementation team to address recommendations in priority order
