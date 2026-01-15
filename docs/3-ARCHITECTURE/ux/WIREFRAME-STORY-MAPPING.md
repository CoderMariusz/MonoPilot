# Wireframe to Story Mapping - MonoPilot

**Last Updated:** 2026-01-15
**Purpose:** Central reference for UX wireframe assignments to implementation stories
**Usage:** Dev agents read this before implementing stories to identify relevant UX designs

---

## Epic 08 - NPD (New Product Development)

**Total Wireframes:** 15 (NPD-001 to NPD-015)

| Story | Wireframes | Description |
|-------|------------|-------------|
| 08.1 | SET-022 | Module toggle (reuse Settings pattern) |
| 08.2 | NPD-001, NPD-002, NPD-003 | Kanban dashboard, project detail, stage-gate timeline |
| 08.3 | NPD-003, NPD-004, NPD-005 | Gate workflow, checklist panel, advance modal |
| 08.4 | NPD-006, NPD-007, NPD-009 | Formulation list, editor, version timeline |
| 08.5 | NPD-007 | Allergen aggregation (part of formulation editor) |
| 08.6 | NPD-005, NPD-010, NPD-011 | Gate approval modal, approval history |
| 08.7 | NPD-012 | Formulation costing card |
| 08.8 | NPD-013 | Compliance documents section |
| 08.9 | NPD-014 | Formulation version compare view |
| 08.10 | NPD-015 | Risk register with 5×5 matrix |
| 08.11 | NPD-008 | Handoff wizard (8 steps) |
| 08.12 | NPD-007, NPD-008 | Formulation → BOM (reuse editor + wizard) |
| 08.13 | NPD-008, PLAN-014 | Pilot WO creation (reuse WO create modal) |
| 08.14 | NPD-007 | Export buttons in formulation editor |
| 08.15 | NPD-001, INT-001 | Event log (reuse dashboard patterns) |
| 08.16 | PLAN-016, NPD-003 | Timeline Gantt view |
| 08.17 | NPD-010, NPD-012 | Finance approval (reuse approval modal + costing) |
| 08.18 | SET-008, NPD-001 | Access control (reuse user list patterns) |

---

## Epic 09 - Finance (Production Costing & Analysis)

**Total Wireframes:** 16 (FIN-001 to FIN-016)

### Phase 1 - MVP Core

| Story | Wireframes | Description |
|-------|------------|-------------|
| 09.1 | SET-022 | Finance module toggle (reuse Settings) |
| 09.2 | FIN-002 | Standard cost definition page (DataTable + modal) |
| 09.3 | FIN-003 | Material cost tracking (embedded in WO cost summary) |
| 09.4 | FIN-003 | Labor cost tracking (embedded in WO cost summary) |
| 09.5 | FIN-004 | BOM costing page (ingredient/packaging costs) |
| 09.6 | FIN-003 | WO cost summary card (main card component) |
| 09.7 | FIN-005 | Inventory valuation report (FIFO/WAC/Standard) |
| 09.8 | FIN-006 | Currency management & exchange rates |
| 09.9 | SET-021 | Tax code integration (reuse Epic 01 tax codes) |
| 09.10 | FIN-014 | Cost center CRUD (part of budget page) |

### Phase 2 - Variance Analysis

| Story | Wireframes | Description |
|-------|------------|-------------|
| 09.11 | FIN-004 | Multi-level cost rollup (BOM costing extension) |
| 09.12 | FIN-003 | Overhead allocation (WO cost summary extension) |
| 09.13 | FIN-007 | Material variance report (price vs quantity) |
| 09.14 | FIN-008 | Labor variance report (rate vs efficiency) |
| 09.15 | FIN-003, FIN-007 | Yield & scrap variance (extend variance reports) |
| 09.16 | FIN-009 | Real-time variance dashboard with alerts |
| 09.17 | FIN-010 | Variance drill-down (multi-dimensional) |
| 09.18 | FIN-012 | BOM cost simulation modal (what-if analysis) |
| 09.19 | FIN-011 | Cost reporting suite (4 report types) |
| 09.20 | FIN-003 | WO cost by operation (operation-level breakdown) |

### Phase 3 - Advanced Analytics

| Story | Wireframes | Description |
|-------|------------|-------------|
| 09.21 | FIN-013 | Margin analysis dashboard |
| 09.22 | FIN-014 | Cost center budget & variance page |
| 09.23 | FIN-015 | Budget management & approval workflow |
| 09.24 | FIN-001 | Cost dashboard & trends (main finance dashboard) |
| 09.25 | FIN-007, FIN-008 | Variance root cause & approval (extend variance reports) |
| 09.26 | FIN-016 | Comarch Optima integration config page |

---

## Epic 10 - OEE & Performance Analytics

**Total Wireframes:** 10 (OEE-001 to OEE-010)

### Phase 1A - MVP Core

| Story | Wireframes | Description |
|-------|------------|-------------|
| 10.1 | OEE-003 | OEE settings & targets configuration |
| 10.2 | OEE-002 | Downtime reason codes (part of tracking UI) |
| 10.3 | OEE-002 | Downtime event tracking (manual logging + timeline) |
| 10.4 | OEE-001 | OEE calculation engine (backend - no dedicated UI) |
| 10.5 | OEE-001 | Real-time machine dashboard (main OEE dashboard) |

### Phase 1B - MVP Complete

| Story | Wireframes | Description |
|-------|------------|-------------|
| 10.6 | OEE-001 | Threshold alerts (alerts panel in dashboard) |
| 10.7 | OEE-004 | Shift report generation & approval |
| 10.8 | OEE-005 | Energy consumption tracking dashboard |
| 10.9 | OEE-006 | Historical trend analysis (7/30/90 days) |

### Phase 2 - Growth

| Story | Wireframes | Description |
|-------|------------|-------------|
| 10.10 | OEE-007 | Machine utilization heatmap |
| 10.11 | OEE-008 | Downtime Pareto analysis |
| 10.12 | OEE-009 | Performance dashboard (comprehensive KPIs) |
| 10.13 | FIN-011, OEE-009 | Custom report builder (reuse finance pattern) |
| 10.14 | OEE-001, OEE-004 | Email alerts & shift handover notes |
| 10.15 | OEE-001, OEE-006 | Production rate tracking (charts in dashboard) |

### Phase 3 - Enterprise

| Story | Wireframes | Description |
|-------|------------|-------------|
| 10.16 | OEE-002, OEE-009 | MTBF/MTTR calculation (metrics in dashboard) |
| 10.17 | OEE-009 | Bottleneck analysis (performance dashboard extension) |
| 10.18 | OEE-010 | Mobile downtime logging (scanner interface) |
| 10.19 | OEE-003, OEE-009 | TPM & benchmarking (settings + dashboard) |
| 10.20 | INT-005, OEE-009 | Export to BI tools (reuse export pattern) |

---

## Epic 11 - Integrations & External Connectivity

**Total Wireframes:** 12 (INT-001 to INT-012)

### Phase 1 - MVP Core

| Story | Wireframes | Description |
|-------|------------|-------------|
| 11.1 | INT-001 | Integrations dashboard (health, activity, errors) |
| 11.2 | INT-002 | API keys management (CRUD, scopes, rate limiting) |
| 11.3 | INT-003 | Integration logs viewer (audit trail, filters) |
| 11.4 | INT-004 | Webhook configuration (events, delivery, test) |
| 11.5 | INT-005 | Data export page (templates, async jobs) |
| 11.6 | INT-006, INT-011 | Supplier portal + Comarch Optima basic config |

### Phase 2 - Advanced Integrations

| Story | Wireframes | Description |
|-------|------------|-------------|
| 11.7 | INT-007 | Customer portal (order tracking, shipments) |
| 11.8 | INT-008 | EDI ORDERS inbound (message list, parser) |
| 11.9 | INT-008 | EDI INVOIC outbound (message generator) |
| 11.10 | INT-008 | EDI DESADV outbound (ASN message) |
| 11.11 | INT-009 | Import templates (products, BOMs) |
| 11.12 | INT-010 | Retry logic & dead letter queue UI |
| 11.13 | INT-011 | Comarch advanced (CoA sync, VAT reports) |
| 11.14 | INT-005 | XML export (reuse export page) |

### Phase 3 - Enterprise Features

| Story | Wireframes | Description |
|-------|------------|-------------|
| 11.15 | INT-008 | EDI advanced (ORDRSP, RECADV messages) |
| 11.16 | INT-011 | Comarch payment reconciliation (extend config page) |
| 11.17 | INT-012 | Custom integration builder (low-code workflow) |
| 11.18 | INT-001, INT-004 | API marketplace + bi-directional webhooks |

---

## Wireframe Coverage Summary

| Epic | Module | Stories | Wireframes | Coverage |
|------|--------|---------|------------|----------|
| 08 | NPD | 18 | 15 | 100% ✅ |
| 09 | Finance | 26 | 16 | 100% ✅ |
| 10 | OEE | 20 | 10 | 95% ✅ |
| 11 | Integrations | 18 | 12 | 100% ✅ |
| **TOTAL** | **4 Modules** | **82** | **53** | **99%** |

---

## Reusable Wireframe Patterns

**Cross-Epic Reuse:**
- **SET-021, SET-022**: Settings patterns (module toggles, tax codes)
- **PLAN-014, PLAN-016**: Planning patterns (WO create modal, Gantt timeline)
- **FIN-011**: Cost reporting suite (reusable in OEE custom reports)
- **INT-005**: Data export (reusable in all modules for CSV/XML export)

---

## Notes for Dev Agents

When implementing a story:
1. Check this mapping document for relevant wireframes
2. Read wireframe markdown files for detailed ASCII layouts
3. Follow component specifications from wireframes
4. Implement all 4 states (Loading, Empty, Error, Success)
5. Ensure responsive breakpoints match wireframe specs
6. Validate accessibility requirements (WCAG 2.1 AA)

---

**Document Status:** ACTIVE
**Owner:** UX-DESIGNER + ORCHESTRATOR
**Next Review:** When implementing stories
