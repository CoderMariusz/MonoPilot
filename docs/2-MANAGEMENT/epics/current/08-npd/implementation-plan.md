# Epic 08 - NPD (New Product Development) Implementation Plan

**Epic:** 08-npd
**Module:** NPD (New Product Development)
**Type:** Premium Add-on Module
**Status:** STORIES TO CREATE
**Last Updated:** 2026-01-15
**Owner:** Product & Engineering Team

---

## Executive Summary

NPD Module enables structured product innovation with **Stage-Gate methodology** for food manufacturers. Supports complete R&D workflow from ideation (G0) through development (G3-G4) to commercial launch with full handoff to Production (Product + BOM + Pilot WO).

**Module Type:** Premium add-on (Growth/Enterprise tiers)
**Pricing:** +$30/user/month
**Standalone Mode:** NPD-only (R&D consultancies without production)

**Total Scope:** 18 stories across 3 phases
**Current Status:** 0/18 stories created
**Estimated Effort:** 45-60 days

---

## Module Value Proposition

### For Food Manufacturers
- **Structured Innovation**: Stage-Gate process with clear gates and checklists
- **Cost Control**: Target costing with variance alerts before production
- **Compliance First**: HACCP, allergens, label proofs before handoff
- **Seamless Handoff**: Formulation → Product + BOM + Pilot WO in one click

### For R&D Consultancies
- **NPD-Only Mode**: Standalone formulation development
- **Export**: PDF/Excel recipe cards for client delivery
- **No Production Dependency**: Pure innovation workflow

---

## Phase Breakdown

### Phase 1 - MVP Core (Weeks 1-6)

**Timeline:** 6 weeks | **Stories:** 8 | **Est Days:** 22-28

| Story | Name | FR Coverage | Complexity | Days |
|-------|------|-------------|------------|------|
| 08.1 | NPD Settings & Module Config | 1 FR | S | 1-2 |
| 08.2 | NPD Projects CRUD & Kanban | 4 FR | L | 4-5 |
| 08.3 | Stage-Gate Workflow | 6 FR | L | 5-6 |
| 08.4 | Formulations CRUD & Versioning | 6 FR | L | 5-6 |
| 08.5 | Allergen Aggregation & Display | 3 FR | M | 3-4 |
| 08.6 | Gate Approvals & History | 2 FR | M | 2-3 |
| 08.7 | Formulation Costing | 5 FR | M | 3-4 |
| 08.8 | Compliance Documents Upload | 5 FR | M | 3-4 |

**Deliverables:**
- `npd_projects` table with Stage-Gate workflow
- `npd_formulations` table with versioning
- Kanban dashboard (drag-and-drop gates)
- Gate checklists with approval workflow
- Auto-allergen aggregation from ingredients
- Target/estimated costing with variance
- Compliance doc upload with categorization

---

### Phase 2 - Advanced Features (Weeks 7-12)

**Timeline:** 6 weeks | **Stories:** 7 | **Est Days:** 20-26

| Story | Name | FR Coverage | Complexity | Days |
|-------|------|-------------|------------|------|
| 08.9 | Formulation Compare & Clone | 2 FR | M | 2-3 |
| 08.10 | Risk Management | 5 FR | M | 3-4 |
| 08.11 | Handoff Wizard | 8 FR | L | 5-6 |
| 08.12 | Handoff: Formulation → BOM | 3 FR | M | 3-4 |
| 08.13 | Handoff: Pilot WO Creation | 3 FR | M | 3-4 |
| 08.14 | NPD-Only Mode & Export | 1 FR | M | 2-3 |
| 08.15 | Event Sourcing & Notifications | 9 FR | M | 3-4 |

**Deliverables:**
- Formulation version comparison (side-by-side diff)
- Risk register with likelihood × impact scoring
- Handoff wizard (8-step validation)
- Formulation → BOM conversion (transactional)
- Pilot WO auto-creation
- Standalone export (PDF/Excel recipe cards)
- Event log with retry mechanism
- Notifications (gate approvals, cost variance, handoff)

---

### Phase 3 - Enterprise (Weeks 13-15)

**Timeline:** 3 weeks | **Stories:** 3 | **Est Days:** 8-12

| Story | Name | FR Coverage | Complexity | Days |
|-------|------|-------------|------------|------|
| 08.16 | Timeline View & Reporting | 4 FR | M | 3-4 |
| 08.17 | Finance Approval Workflow | 4 FR | M | 3-4 |
| 08.18 | Access Control & Audit Trail | 7 FR | M | 3-5 |

**Deliverables:**
- Timeline view (Gantt-style with overdue highlighting)
- CSV export (projects, formulations, costing)
- Finance approval workflow for costing
- RLS policies per NPD role
- Audit trail for formulation changes

---

## Story Breakdown

### Phase 1 Stories (08.1-08.8)

#### 08.1 - NPD Settings & Module Config
- **Type:** backend
- **FR:** NPD-FR-01 (settings table)
- **Scope:** NPD module toggle, NPD-only mode, pilot WO defaults, variance thresholds
- **Dependencies:** Epic 01 Settings
- **Deliverables:** `npd_settings` table, UI toggle in Settings page

#### 08.2 - NPD Projects CRUD & Kanban
- **Type:** fullstack
- **FR:** NPD-FR-01, 02, 04, 05
- **Scope:** NPD project creation, Kanban dashboard, drag-drop gates, filters
- **Dependencies:** 08.1
- **Deliverables:** `npd_projects` table, Kanban UI, project detail page

#### 08.3 - Stage-Gate Workflow
- **Type:** fullstack
- **FR:** NPD-FR-03, 17-21
- **Scope:** Gate checklists, gate advancement, entry criteria validation, approval
- **Dependencies:** 08.2
- **Deliverables:** `npd_gate_checklists` table, gate validation logic, approval modal

#### 08.4 - Formulations CRUD & Versioning
- **Type:** fullstack
- **FR:** NPD-FR-08, 09, 11-14
- **Scope:** Formulation creation, item management, version control, lineage tracking
- **Dependencies:** 08.2, Epic 02 Products
- **Deliverables:** `npd_formulations` + `npd_formulation_items` tables, version lock on approval

#### 08.5 - Allergen Aggregation & Display
- **Type:** backend + frontend
- **FR:** NPD-FR-10, 30, 61
- **Scope:** Auto-aggregate allergens from formulation items, allergen declaration UI
- **Dependencies:** 08.4, Epic 01 Allergens
- **Deliverables:** Allergen aggregation function, allergen display panel

#### 08.6 - Gate Approvals & History
- **Type:** fullstack
- **FR:** NPD-FR-21, 22
- **Scope:** Approval workflow (QA Manager, Finance), approval history log
- **Dependencies:** 08.3
- **Deliverables:** `npd_approvals` table (reuse from Quality), approval timeline

#### 08.7 - Formulation Costing
- **Type:** fullstack
- **FR:** NPD-FR-23-27
- **Scope:** Target cost entry, estimated cost calc, actual cost from pilot WO, variance
- **Dependencies:** 08.4
- **Deliverables:** `npd_formulation_costing` table, variance alerts

#### 08.8 - Compliance Documents Upload
- **Type:** fullstack
- **FR:** NPD-FR-31-35
- **Scope:** Document upload (HACCP, label proof, CoA), categorization, metadata
- **Dependencies:** 08.2
- **Deliverables:** `npd_compliance_docs` table, S3 storage, doc viewer

---

### Phase 2 Stories (08.9-08.15)

#### 08.9 - Formulation Compare & Clone
- **Type:** frontend
- **FR:** NPD-FR-15, 16
- **Scope:** Side-by-side version comparison, clone formulation
- **Dependencies:** 08.4
- **Deliverables:** Diff view component, clone API endpoint

#### 08.10 - Risk Management
- **Type:** fullstack
- **FR:** NPD-FR-48-52
- **Scope:** Risk register, likelihood × impact scoring, mitigation plans
- **Dependencies:** 08.2
- **Deliverables:** `npd_risks` table, risk matrix visualization

#### 08.11 - Handoff Wizard
- **Type:** fullstack
- **FR:** NPD-FR-37-40, 43-46
- **Scope:** 8-step handoff wizard, validation checklist, transactional execution
- **Dependencies:** 08.2, 08.4, 08.7, 08.8
- **Deliverables:** Handoff wizard UI, validation logic, status update to "launched"

#### 08.12 - Handoff: Formulation → BOM
- **Type:** backend
- **FR:** NPD-FR-41, 58, 59
- **Scope:** Convert formulation to BOM, create Product (new or update existing)
- **Dependencies:** 08.11, Epic 02 BOMs
- **Deliverables:** Handoff service method, BOM creation from formulation items

#### 08.13 - Handoff: Pilot WO Creation
- **Type:** backend
- **FR:** NPD-FR-42, 57, 60
- **Scope:** Auto-create pilot WO with type "pilot", link to NPD project
- **Dependencies:** 08.12, Epic 03 Work Orders
- **Deliverables:** Pilot WO creation, WO type enum extension

#### 08.14 - NPD-Only Mode & Export
- **Type:** fullstack
- **FR:** NPD-FR-47
- **Scope:** Standalone mode toggle, PDF/Excel export of formulations
- **Dependencies:** 08.4
- **Deliverables:** Export service (PDF via Puppeteer, Excel via ExcelJS)

#### 08.15 - Event Sourcing & Notifications
- **Type:** backend
- **FR:** NPD-FR-53-56, 70-74
- **Scope:** Event log, retry mechanism, notifications (approvals, cost variance, handoff)
- **Dependencies:** 08.2, 08.3, 08.7
- **Deliverables:** `npd_event_log` table, event processor, notification triggers

---

### Phase 3 Stories (08.16-08.18)

#### 08.16 - Timeline View & Reporting
- **Type:** fullstack
- **FR:** NPD-FR-06, 07, 28, 36
- **Scope:** Timeline view (Gantt), CSV export, cost history, compliance checklist report
- **Dependencies:** 08.2, 08.7
- **Deliverables:** Timeline UI component, export endpoints

#### 08.17 - Finance Approval Workflow
- **Type:** fullstack
- **FR:** NPD-FR-29, 66, 71, 72
- **Scope:** Finance role approval for costing, variance alert notifications
- **Dependencies:** 08.7, 08.6
- **Deliverables:** Finance approval modal, cost variance notification

#### 08.18 - Access Control & Audit Trail
- **Type:** backend
- **FR:** NPD-FR-63-69
- **Scope:** RLS policies (NPD Lead, R&D, Regulatory, Finance), audit trail
- **Dependencies:** Epic 01 Roles, 08.2, 08.4
- **Deliverables:** RLS policies, `npd_audit_log` table

---

## Dependencies

### Cross-Epic Dependencies

| Epic | Stories | Provides | Status |
|------|---------|----------|--------|
| 01 (Settings) | 01.1 | organizations, users, roles, RLS | ✅ READY |
| 01 (Settings) | 01.12 | allergens table | ✅ READY |
| 02 (Technical) | 02.1 | products table | ✅ READY |
| 02 (Technical) | 02.4 | boms table | ✅ READY |
| 03 (Planning) | 03.10 | work_orders table | ✅ READY |

**All dependencies satisfied! ✅** Epic 08 unblocked for implementation.

---

## Database Tables (New)

| Table | Phase | Story | Purpose |
|-------|-------|-------|---------|
| `npd_settings` | 1 | 08.1 | Module configuration |
| `npd_projects` | 1 | 08.2 | Project headers |
| `npd_gate_checklists` | 1 | 08.3 | Gate checklists |
| `npd_formulations` | 1 | 08.4 | Formulation headers |
| `npd_formulation_items` | 1 | 08.4 | Formulation ingredients |
| `npd_formulation_costing` | 1 | 08.7 | Costing data |
| `npd_compliance_docs` | 1 | 08.8 | Documents |
| `npd_approvals` | 1 | 08.6 | Approval history |
| `npd_risks` | 2 | 08.10 | Risk register |
| `npd_event_log` | 2 | 08.15 | Event sourcing |
| `npd_audit_log` | 3 | 08.18 | Audit trail |

---

## Success Metrics

### Phase 1 (MVP)
- NPD project creation < 300ms
- Kanban dashboard load < 500ms for 50 projects
- Formulation allergen aggregation < 200ms
- Gate advancement validation < 1s

### Phase 2 (Handoff)
- Handoff validation < 2s
- Handoff execution (Product + BOM + WO) < 5s
- Formulation comparison rendering < 500ms

### Phase 3 (Enterprise)
- Timeline view < 500ms for 100 projects
- CSV export < 3s for 200 projects
- Finance approval workflow < 1s

---

## Implementation Timeline

| Phase | Weeks | Stories | Days | Target |
|-------|-------|---------|------|--------|
| Phase 1 (MVP) | 1-6 | 8 | 22-28 | March 2026 |
| Phase 2 (Advanced) | 7-12 | 7 | 20-26 | May 2026 |
| Phase 3 (Enterprise) | 13-15 | 3 | 8-12 | June 2026 |

**Total Epic 08 Timeline:** 15 weeks (~4 months)
**Total Effort:** 50-66 days

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Handoff complexity | HIGH | MEDIUM | Transactional handoff, rollback on failure |
| Allergen aggregation accuracy | HIGH | LOW | Comprehensive tests, Epic 01 allergen reuse |
| NPD-only mode adoption | MEDIUM | MEDIUM | Clear export templates, customer feedback |
| Finance approval bottleneck | MEDIUM | MEDIUM | Variance thresholds, auto-approve if < threshold |
| Event sourcing performance | MEDIUM | LOW | Async processing, batching |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-15 | Initial implementation plan for Epic 08 NPD | ORCHESTRATOR |

---

**Document Status:** ACTIVE
**Next Review:** 2026-01-22
**Owner:** Product & Engineering Team
