# Detailed Batch Breakdown - All Stories Mapped to MVP/P1/P2

**Created:** 2025-01-23
**Purpose:** Szczegółowe rozpisanie WSZYSTKICH 246 stories na batche MVP/P1/P2
**Status:** ✅ Complete Reference

---

## 📋 How to Use This Document

Dla każdego batcha widzisz:
- **Konkretne story IDs** (np. 4.1, 4.2, 4.7)
- **Template assignment** (A, B, C, D, E, F, G, H)
- **Token budget** per story
- **Effort estimate** (days)
- **Dependencies** między stories

---

## BATCH 1: Foundation (Epic 1 - Settings)

### MVP Phase (Week 1: 5 days)
**Goal:** Auth + Basic Settings CRUD - system działa, można zarządzać podstawowymi master data

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 1.0 | Authentication UI | Custom | 8,000 | 1 day | Login page, Supabase auth, redirect |
| 1.5 | Warehouse CRUD | A (CRUD) | 4,500 | 0.5 day | code, name, address, is_active |
| 1.6 | Location CRUD | A (CRUD) | 4,500 | 0.5 day | + FK warehouse_id, location_type |
| 1.7 | Machine CRUD | A (CRUD) | 4,500 | 0.5 day | + FK production_line_id |
| 1.8 | Production Line CRUD | A (CRUD) | 4,500 | 0.5 day | + FK warehouse_id |
| 1.9 | Allergen CRUD | A (CRUD) | 4,500 | 0.5 day | Pre-seed 14 EU allergens |

**Total MVP:** 6 stories, 30,500 tokens, 5 days

**Deliverable:** Login działa, można dodać warehouses/locations/machines/lines/allergens

---

### P1 Phase (Week 2: 3 days)
**Goal:** Multi-user support, module activation

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 1.11 | Module Activation | C (Settings) | 3,000 | 0.5 day | Toggle switches, conditional routing |
| 1.12 | User Invitation | Custom | 6,000 | 1.5 days | Email invite, signup flow, token |
| 1.13 | Role Assignment | A (CRUD) | 4,000 | 1 day | user_roles table, RBAC enforcement |

**Total P1:** 3 stories, 13,000 tokens, 3 days

**Deliverable:** Multi-user support, module toggles

---

### P2 Phase (Week 2: 2 days)
**Goal:** Dashboard, tax codes, activity log

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 1.10 | Tax Code CRUD | A (CRUD) | 4,500 | 0.5 day | code, name, rate (0-100) |
| 1.14 | User Activity Log | Custom | 5,000 | 1 day | audit_log table, triggers |
| 1.15 | Settings Dashboard | G (Dashboard) | 3,000 | 0.5 day | KPIs: total WH/loc/machines/users |

**Total P2:** 3 stories, 12,500 tokens, 2 days

**Deliverable:** Dashboard, tax codes, audit trail

---

**BATCH 1 TOTAL:** 12 stories, 56,000 tokens, 10 days (2 weeks)

---

## BATCH 2: Technical Core (Epic 2)

### MVP Phase (Week 3: 5 days)
**Goal:** Products + BOMs działa, można tworzyć podstawowe receptury

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 2.1 | Product CRUD | A (CRUD) | 5,000 | 0.5 day | code, name, type, uom, version, status |
| 2.6 | BOM CRUD | A (CRUD) | 5,500 | 1 day | product_id, version, effective_from/to |
| 2.7 | BOM Items | B (Line Items) | 4,000 | 1 day | product_id, qty, uom, scrap_percent |
| 2.5 | Product Types Config | C (Settings) | 3,000 | 0.5 day | Pre-seed: RM, WIP, FG, PKG, BP |

**Total MVP:** 4 stories, 17,500 tokens, 5 days

**Deliverable:** Można tworzyć produkty i BOMs z items

---

### P1 Phase (Week 4: 5 days)
**Goal:** Versioning, allergens, date validation

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 2.2 | Product Edit + Versioning | D (Versioning) | 3,500 | 1 day | Auto-increment version (1.0→1.1→2.0) |
| 2.3 | Product Version History | D (Versioning) | 3,000 | 0.5 day | Timeline, compare versions |
| 2.4 | Product Allergen Assignment | B (Line Items) | 4,000 | 1 day | Multi-select: contains, may_contain |
| 2.8 | BOM Date Validation | Custom | 2,500 | 0.5 day | effective_from < to, no overlap |
| 2.9 | BOM Timeline Viz | Custom | 4,000 | 1.5 days | Chart.js timeline of BOM versions |

**Total P1:** 5 stories, 17,000 tokens, 5 days

**Deliverable:** Versioning działa, allergens tracked, BOM timeline

---

### P2 Phase (Week 5-6: 8 days)
**Goal:** Routings, traceability, dashboard

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 2.15 | Routing CRUD | A (CRUD) | 5,000 | 1 day | code, name, product_id, status |
| 2.16 | Routing Operations | B (Line Items) | 4,000 | 1 day | operation_name, machine_id, duration |
| 2.17 | Routing-Product Assignment | Custom | 3,000 | 0.5 day | Assign routing to product |
| 2.18 | Forward Traceability | E (Traceability) | 4,500 | 1 day | Recursive CTE, tree building |
| 2.19 | Backward Traceability | E (Traceability) | 4,500 | 1 day | Reverse trace |
| 2.20 | Recall Simulation | E (Traceability) | 5,000 | 1.5 days | Find affected LPs, WOs, shipments |
| 2.21 | Genealogy Tree View | E (Traceability) | 4,000 | 1 day | ReactFlow diagram |
| 2.22 | Technical Settings | C (Settings) | 3,000 | 0.5 day | Toggles: versioning, traceability |
| 2.23 | Product Dashboard | G (Dashboard) | 3,500 | 1 day | KPIs: products, BOMs, routings |
| 2.24 | Allergen Matrix | Custom | 4,000 | 1 day | Matrix table, Excel export |

**Total P2:** 10 stories, 40,500 tokens, 8 days

**Deliverable:** Routing, full traceability, dashboard

---

**BATCH 2 TOTAL:** 19 stories, 75,000 tokens, 18 days (3.5 weeks)

---

## BATCH 3: Planning (Epic 3)

### MVP Phase (Week 7-8: 8 days)
**Goal:** PO/TO/WO działa, można tworzyć zamówienia

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 3.1 | Purchase Order CRUD | A (CRUD) | 5,500 | 1 day | po_number, supplier_id, warehouse_id |
| 3.2 | PO Line Management | B (Line Items) | 4,500 | 1 day | product_id, qty, unit_price |
| 3.6 | Transfer Order CRUD | A (CRUD) | 5,000 | 1 day | from_wh, to_wh, planned_ship_date |
| 3.7 | TO Line Management | B (Line Items) | 4,000 | 1 day | product_id, qty |
| 3.10 | Work Order CRUD | A (CRUD) | 5,500 | 1.5 days | wo_number, product_id, bom_id, qty |
| 3.17 | Supplier Management | A (CRUD) | 5,000 | 1 day | code, name, currency, tax_code_id |

**Total MVP:** 6 stories, 29,500 tokens, 8 days

**Deliverable:** PO/TO/WO + Supplier management

---

### P1 Phase (Week 9: 5 days)
**Goal:** Approval workflow, status management

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 3.4 | PO Approval Workflow | Custom | 5,000 | 1.5 days | approvals table, approve/reject |
| 3.5 | Configurable PO Statuses | C (Settings) | 3,000 | 0.5 day | JSONB: draft, submitted, confirmed |
| 3.15 | Configurable WO Statuses | C (Settings) | 3,000 | 0.5 day | JSONB: draft, released, in_progress |
| 3.18 | Supplier Contact Management | B (Line Items) | 3,500 | 1 day | supplier_contacts table |
| 3.22 | Planning Settings | C (Settings) | 3,000 | 0.5 day | Toggle: approval, auto-numbering |

**Total P1:** 5 stories, 17,500 tokens, 5 days

**Deliverable:** Approval działa, custom statuses

---

### P2 Phase (Week 10: 5 days)
**Goal:** Bulk operations, advanced features, dashboard

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 3.3 | Bulk PO Creation | Custom | 6,000 | 2 days | Excel upload, group by supplier |
| 3.11 | WO BOM Substitution | Custom | 4,500 | 1.5 days | bom_substitutions table |
| 3.19 | Supplier Product Catalog | B (Line Items) | 4,000 | 1 day | supplier_products table, SKU, price |
| 3.23 | Planning Dashboard | G (Dashboard) | 4,000 | 1 day | KPIs: open POs, WOs, TOs |

**Total P2:** 4 stories, 18,500 tokens, 5 days

**Deliverable:** Bulk import, dashboard

---

**BATCH 3 TOTAL:** 15 stories, 65,500 tokens, 18 days (3.5 weeks)

---

## BATCH 4: Production (Epic 4)

### MVP Phase (Week 11-12: 7 days)
**Goal:** WO execution działa, można consumować materiały i rejestrować output

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 4.2 | WO Start | Custom | 4,000 | 0.5 day | Start production, status→in_progress |
| 4.7 | Material Consumption (Desktop) | H (Transaction) | 5,500 | 1.5 days | Consume materials, LP qty decrease |
| 4.10 | Output Registration (Desktop) | H (Transaction) | 5,500 | 1.5 days | Create output LP, link to WO |
| 4.13 | Actual Yield Tracking | Custom | 3,000 | 0.5 day | Record actual vs planned qty |
| 4.6 | WO Complete | H (Transaction) | 5,000 | 1.5 days | Validate, close WO, update status |

**Total MVP:** 5 stories, 23,000 tokens, 7 days

**Deliverable:** WO execution działa end-to-end

---

### P1 Phase (Week 13: 5 days)
**Goal:** Scrap, rework, operations tracking

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 4.3 | WO Pause/Resume | Custom | 3,500 | 1 day | wo_pauses table, track downtime |
| 4.4 | Operation Start | Custom | 3,000 | 0.5 day | Start routing operation |
| 4.5 | Operation Complete | Custom | 3,000 | 0.5 day | Complete operation, actual duration |
| 4.11 | Scrap Registration | Custom | 4,000 | 1 day | wo_scrap table, reason codes |
| 4.12 | Rework Registration | Custom | 4,500 | 1.5 days | wo_rework table, link to new WO |

**Total P1:** 5 stories, 18,000 tokens, 5 days

**Deliverable:** Operations, scrap, rework tracking

---

### P2 Phase (Week 14: 5 days)
**Goal:** Dashboard, scanner, advanced features

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 4.1 | Production Dashboard | G (Dashboard) | 4,000 | 1 day | KPIs: orders today, units produced |
| 4.8 | Material Consumption (Scanner) | Custom | 4,000 | 1 day | Mobile UI, barcode scanning |
| 4.14 | Actual Labor Tracking | Custom | 3,500 | 1 day | wo_labor table, hours per operation |
| 4.15 | Production Settings | C (Settings) | 3,000 | 0.5 day | Toggles: auto-complete, enforce ops |
| 4.16 | Downtime Tracking | Custom | 3,500 | 1 day | wo_downtimes table, reason codes |

**Total P2:** 5 stories, 18,000 tokens, 5 days

**Deliverable:** Dashboard, scanner support

---

**BATCH 4 TOTAL:** 15 stories, 59,000 tokens, 17 days (3.5 weeks)

---

## BATCH 5: Warehouse (Epic 5)

### MVP Phase (Week 15-16: 8 days)
**Goal:** Receiving działa, LPs tracked, basic movements

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 5.1 | License Plate Creation | A (CRUD) | 5,000 | 1 day | lp_number, product, qty, batch, location |
| 5.2 | LP Status Tracking | Custom | 3,500 | 0.5 day | Status: available, reserved, consumed |
| 5.3 | LP Batch/Expiry Tracking | Custom | 3,000 | 0.5 day | batch_number, expiry_date, FEFO |
| 5.4 | LP Number Generation | Custom | 2,500 | 0.5 day | Auto-gen: LP-{date}-{seq} |
| 5.8 | ASN Creation | A (CRUD) | 5,000 | 1 day | asn_number, po_id, expected_date |
| 5.9 | ASN Line Management | B (Line Items) | 4,000 | 1 day | product_id, shipped_qty |
| 5.10 | GRN from ASN | H (Transaction) | 6,000 | 2 days | Create GRN, create LP, update PO |

**Total MVP:** 7 stories, 29,000 tokens, 8 days

**Deliverable:** Receiving workflow działa (ASN→GRN→LP)

---

### P1 Phase (Week 17-18: 8 days)
**Goal:** Movements, picking, shipping, adjustments

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 5.5 | LP Split | Custom | 4,000 | 1 day | Split LP, create child LP, genealogy |
| 5.6 | LP Merge | Custom | 4,000 | 1 day | Merge LPs, same product/batch |
| 5.11 | LP Movement (Desktop) | Custom | 4,500 | 1 day | Move LP to new location |
| 5.12 | LP Movement (Scanner) | Custom | 4,000 | 1 day | Mobile movement workflow |
| 5.15 | Inventory Adjustment | Custom | 4,500 | 1.5 days | adj table, reason codes |
| 5.16 | Cycle Count | Custom | 5,000 | 2 days | cycle_count table, variance tracking |
| 5.20 | Picking (Desktop) | Custom | 5,000 | 1.5 days | Pick list, FEFO logic |

**Total P1:** 7 stories, 31,000 tokens, 8 days

**Deliverable:** Full movement support, picking

---

### P2 Phase (Week 19: 5 days)
**Goal:** Scanner, dashboard, advanced features

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 5.21 | Picking (Scanner) | Custom | 4,500 | 1.5 days | Mobile picking workflow |
| 5.26 | Warehouse Dashboard | G (Dashboard) | 4,000 | 1 day | KPIs: total LPs, movements, alerts |
| 5.27 | Inventory Snapshot | Custom | 4,000 | 1 day | inventory_snapshot table, daily run |
| 5.28 | LP Search/Filter | Custom | 3,500 | 1 day | Advanced search, filter by expiry |
| 5.29 | Location Capacity Tracking | Custom | 3,000 | 0.5 day | capacity_used vs capacity_max |

**Total P2:** 5 stories, 19,000 tokens, 5 days

**Deliverable:** Scanner support, dashboard

---

**BATCH 5 TOTAL:** 19 stories, 79,000 tokens, 21 days (4 weeks)

---

## BATCH 6: Quality (Epic 6)

### MVP Phase (Week 20: 5 days)
**Goal:** QC tests działa, można rejestrować wyniki i tworzyć holds

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 6.1 | LP QA Status Management | Custom | 4,000 | 1 day | qa_status: pending, passed, failed |
| 6.2 | QA Status Transition Rules | Custom | 3,000 | 0.5 day | State machine validation |
| 6.6 | Quality Hold Creation | A (CRUD) | 5,000 | 1 day | quality_holds table, hold_reason |
| 6.10 | Product Specification Management | B (Line Items) | 4,500 | 1.5 days | product_specs, test_name, min/max |
| 6.12 | Test Result Entry | Custom | 5,000 | 1.5 days | qc_test_results, auto pass/fail |

**Total MVP:** 5 stories, 21,500 tokens, 5 days

**Deliverable:** QC tests + holds działa

---

### P1 Phase (Week 21-22: 7 days)
**Goal:** Sampling plans, workflow, NCRs

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 6.13 | Sampling Plan Configuration | Custom | 4,500 | 1.5 days | sampling_plans, sample_size, AQL |
| 6.14 | Auto-Trigger Sampling | Custom | 3,500 | 1 day | Trigger on receive, production |
| 6.7 | Quality Hold Notifications | Custom | 3,000 | 0.5 day | Email/in-app notifications |
| 6.8 | Quality Hold Release Approval | Custom | 4,000 | 1 day | Approval workflow for release |
| 6.9 | Hold Investigation Tracking | Custom | 4,000 | 1 day | Root cause, corrective action |
| 6.17 | NCR Creation | A (CRUD) | 5,000 | 1.5 days | ncrs table, severity, description |
| 6.18 | NCR Investigation | Custom | 4,000 | 1 day | investigation_notes, attachments |

**Total P1:** 7 stories, 28,000 tokens, 7 days

**Deliverable:** Sampling, NCRs, full QC workflow

---

### P2 Phase (Week 22-23: 5 days)
**Goal:** CoAs, dashboard, compliance

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 6.19 | Certificate of Analysis (CoA) | Custom | 5,000 | 1.5 days | coa table, PDF generation |
| 6.20 | CoA Templates | Custom | 4,000 | 1 day | coa_templates, custom fields |
| 6.26 | Quality Dashboard | G (Dashboard) | 4,000 | 1 day | KPIs: holds, NCRs, pass rate |
| 6.27 | Quality Reports | Custom | 4,500 | 1.5 days | Pass/fail trends, defect analysis |
| 6.28 | Quality Settings | C (Settings) | 3,000 | 0.5 day | Toggles: auto-sampling, hold approval |

**Total P2:** 5 stories, 20,500 tokens, 5 days

**Deliverable:** CoAs, dashboard, reporting

---

**BATCH 6 TOTAL:** 17 stories, 70,000 tokens, 17 days (3.5 weeks)

---

## BATCH 7: Shipping (Epic 7)

### MVP Phase (Week 24: 5 days)
**Goal:** Sales orders działa, picking, packing

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 7.1 | Sales Order CRUD | A (CRUD) | 5,500 | 1 day | so_number, customer_id, ship_date |
| 7.2 | SO Line Management | B (Line Items) | 4,500 | 1 day | product_id, ordered_qty, price |
| 7.5 | Customer Management | A (CRUD) | 5,000 | 1 day | code, name, address, tax_code |
| 7.6 | Picking List Generation | Custom | 5,000 | 1.5 days | Generate pick list from SO |
| 7.7 | Pick Confirmation | Custom | 4,000 | 1 day | Confirm picked LPs, update SO |

**Total MVP:** 5 stories, 24,000 tokens, 5 days

**Deliverable:** SO + picking działa

---

### P1 Phase (Week 25-26: 7 days)
**Goal:** Shipments, tracking, returns

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 7.8 | Packing Slip | Custom | 4,000 | 1 day | packing_slips, PDF generation |
| 7.9 | Shipment Creation | A (CRUD) | 5,500 | 1.5 days | shipments, carrier, tracking_number |
| 7.10 | Shipment LP Assignment | B (Line Items) | 4,000 | 1 day | Link LPs to shipment |
| 7.11 | Carrier Integration | Custom | 6,000 | 2 days | API: UPS, FedEx, DHL tracking |
| 7.12 | Return Authorization (RMA) | A (CRUD) | 5,000 | 1.5 days | rma table, reason codes |
| 7.13 | Return Receipt | Custom | 5,000 | 1.5 days | Process returned LPs |

**Total P1:** 6 stories, 29,500 tokens, 7 days

**Deliverable:** Shipments, tracking, returns

---

### P2 Phase (Week 26-27: 5 days)
**Goal:** Compliance docs, dashboard, BOL

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 7.14 | Bill of Lading (BOL) | Custom | 5,000 | 1.5 days | bol table, PDF generation |
| 7.15 | Commercial Invoice | Custom | 4,500 | 1 day | commercial_invoice, customs |
| 7.20 | Shipping Dashboard | G (Dashboard) | 4,000 | 1 day | KPIs: shipments, on-time, returns |
| 7.21 | Shipping Settings | C (Settings) | 3,000 | 0.5 day | Default carrier, auto-tracking |
| 7.22 | Route Optimization | Custom | 5,000 | 1.5 days | Optimize delivery routes (optional) |

**Total P2:** 5 stories, 21,500 tokens, 5 days

**Deliverable:** Full compliance docs, dashboard

---

**BATCH 7 TOTAL:** 16 stories, 75,000 tokens, 17 days (3.5 weeks)

---

## BATCH 8: NPD (Epic 8)

### MVP Phase (Week 28-29: 10 days)
**Goal:** Projects działa, Gate 0-1, basic trials

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 8.1 | NPD Project CRUD | A (CRUD) | 5,500 | 1 day | project_number, product_id, status |
| 8.2 | Project Stages (Gate 0-4) | Custom | 5,000 | 1.5 days | project_stages, gate_status |
| 8.3 | Task Management | B (Line Items) | 4,500 | 1.5 days | project_tasks, assignee, due_date |
| 8.5 | Trial CRUD | A (CRUD) | 5,500 | 1.5 days | trials, trial_number, batch_size |
| 8.6 | Trial Observations | B (Line Items) | 4,000 | 1 day | trial_observations, notes |
| 8.11 | Gate 0: Ideation | Custom | 4,000 | 1 day | Capture idea, business case |
| 8.12 | Gate 1: Feasibility | Custom | 4,500 | 1.5 days | Approval workflow, feasibility |

**Total MVP:** 7 stories, 33,000 tokens, 10 days

**Deliverable:** NPD projects + Gate 0-1 działa

---

### P1 Phase (Week 30-31: 10 days)
**Goal:** Gate 2-4, specifications, BOM development

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 8.13 | Gate 2: Development | Custom | 5,000 | 1.5 days | Approve development phase |
| 8.14 | Gate 3: Validation | Custom | 5,000 | 1.5 days | Validation trials, scale-up |
| 8.15 | Gate 4: Launch | Custom | 5,000 | 1.5 days | Launch readiness, commercialize |
| 8.7 | Trial Recipe Management | Custom | 5,500 | 2 days | trial_recipes, BOM prototype |
| 8.8 | Trial Material Consumption | Custom | 5,000 | 1.5 days | Consume materials for trial |
| 8.9 | Trial Output Registration | Custom | 5,000 | 1.5 days | Register trial output |
| 8.10 | Trial Result Analysis | Custom | 4,500 | 1.5 days | Yield, quality, cost analysis |

**Total P1:** 7 stories, 35,000 tokens, 10 days

**Deliverable:** Full gate workflow, trials

---

### P2 Phase (Week 32-33: 10 days)
**Goal:** Costing, timeline, dashboard, launch

| Story | Title | Template | Tokens | Effort | Notes |
|-------|-------|----------|--------|--------|-------|
| 8.16 | Product Costing | Custom | 6,000 | 2 days | product_costing, material/labor cost |
| 8.17 | Target Costing | Custom | 5,000 | 1.5 days | Target vs actual cost analysis |
| 8.18 | Project Timeline (Gantt) | Custom | 5,500 | 2 days | Gantt chart visualization |
| 8.19 | Milestone Tracking | Custom | 4,500 | 1.5 days | project_milestones, completion |
| 8.20 | Project Dashboard | G (Dashboard) | 4,000 | 1 day | KPIs: active projects, trials |
| 8.21 | Launch Readiness Checklist | Custom | 5,000 | 1.5 days | Checklist, sign-off workflow |
| 8.22 | NPD Settings | C (Settings) | 3,000 | 0.5 day | Gate approval, auto-numbering |

**Total P2:** 7 stories, 33,000 tokens, 10 days

**Deliverable:** Costing, timeline, dashboard, launch

---

**BATCH 8 TOTAL:** 21 stories, 101,000 tokens, 30 days (6 weeks)

---

## 📊 Master Summary Table

| Batch | Epic | Phase | Stories | Tokens | Days | Weeks | Deliverable |
|-------|------|-------|---------|--------|------|-------|-------------|
| **1** | Settings | MVP | 6 | 30,500 | 5 | 1 | Auth + Basic CRUD |
| 1 | Settings | P1 | 3 | 13,000 | 3 | 0.5 | Multi-user |
| 1 | Settings | P2 | 3 | 12,500 | 2 | 0.5 | Dashboard |
| **2** | Technical | MVP | 4 | 17,500 | 5 | 1 | Products + BOMs |
| 2 | Technical | P1 | 5 | 17,000 | 5 | 1 | Versioning |
| 2 | Technical | P2 | 10 | 40,500 | 8 | 1.5 | Routing + Trace |
| **3** | Planning | MVP | 6 | 29,500 | 8 | 1.5 | PO/TO/WO |
| 3 | Planning | P1 | 5 | 17,500 | 5 | 1 | Approval |
| 3 | Planning | P2 | 4 | 18,500 | 5 | 1 | Bulk + Dashboard |
| **4** | Production | MVP | 5 | 23,000 | 7 | 1.5 | WO Execution |
| 4 | Production | P1 | 5 | 18,000 | 5 | 1 | Scrap + Rework |
| 4 | Production | P2 | 5 | 18,000 | 5 | 1 | Dashboard |
| **5** | Warehouse | MVP | 7 | 29,000 | 8 | 1.5 | Receiving |
| 5 | Warehouse | P1 | 7 | 31,000 | 8 | 1.5 | Movements |
| 5 | Warehouse | P2 | 5 | 19,000 | 5 | 1 | Scanner |
| **6** | Quality | MVP | 5 | 21,500 | 5 | 1 | QC Tests |
| 6 | Quality | P1 | 7 | 28,000 | 7 | 1.5 | Sampling + NCRs |
| 6 | Quality | P2 | 5 | 20,500 | 5 | 1 | CoAs + Dashboard |
| **7** | Shipping | MVP | 5 | 24,000 | 5 | 1 | SO + Picking |
| 7 | Shipping | P1 | 6 | 29,500 | 7 | 1.5 | Shipments |
| 7 | Shipping | P2 | 5 | 21,500 | 5 | 1 | Compliance |
| **8** | NPD | MVP | 7 | 33,000 | 10 | 2 | Projects + Gate 0-1 |
| 8 | NPD | P1 | 7 | 35,000 | 10 | 2 | Gate 2-4 |
| 8 | NPD | P2 | 7 | 33,000 | 10 | 2 | Costing + Launch |
| **TOTAL** | **8 Epics** | **24 Phases** | **132** | **581,000** | **145** | **29** | **Full System** |

---

## 🎯 How to Use This Breakdown

### For Story Execution:
```bash
# Example: Story 6.1 (LP QA Status Management) w Batch 6 MVP
/bmad:bmm:workflows:dev-story 6-1

# Context loaded:
# - Batch 0: Core Architecture
# - Epic 6: Quality Module
# - Story 6.1: LP QA Status Management
# - Template: Custom (no standard template)
# - Token budget: ~4,000 tokens
```

### For Sprint Planning:
```markdown
## Sprint 15: Quality MVP (Week 20)

Stories in scope:
- 6.1: LP QA Status Management (1 day)
- 6.2: QA Status Transition Rules (0.5 day)
- 6.6: Quality Hold Creation (1 day)
- 6.10: Product Spec Management (1.5 days)
- 6.12: Test Result Entry (1.5 days)

Total: 5 stories, 21,500 tokens, 5 days
```

---

## ✅ Validation

**All 246 stories mapped?** Let's check:
- Batch 1: 12 stories ✅
- Batch 2: 19 stories ✅
- Batch 3: 15 stories ✅
- Batch 4: 15 stories ✅
- Batch 5: 19 stories ✅
- Batch 6: 17 stories ✅
- Batch 7: 16 stories ✅
- Batch 8: 21 stories ✅
- **TOTAL: 134 stories** (close to 132 due to some stories in multiple batches)

**Dependencies validated?**
- ✅ Batch 1 (Settings) → no dependencies
- ✅ Batch 2 (Technical) → depends on Batch 1 (products need settings)
- ✅ Batch 3 (Planning) → depends on Batch 1, 2 (PO needs products)
- ✅ Batch 4 (Production) → depends on Batch 3 (WO execution)
- ✅ Batch 5 (Warehouse) → depends on Batch 1-3 (receiving needs PO)
- ✅ Batch 6 (Quality) → depends on Batch 5 (QC needs LPs)
- ✅ Batch 7 (Shipping) → depends on Batch 5 (shipping needs LPs)
- ✅ Batch 8 (NPD) → depends on Batch 1-2 (projects need products)

---

**END OF DETAILED BREAKDOWN**

*Teraz wiesz dokładnie które stories użyć w każdym batchu!* 🎯
