# Epic 03 Planning - Implementation Roadmap

**Quick reference for starting Epic 03 Planning Module implementation.**

Date: 2025-12-16
Status: READY FOR IMPLEMENTATION

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Stories** | 19 (Phase 1 MVP) |
| **Days (1 dev)** | 42-58 days |
| **Days (2 devs)** | 21-29 days |
| **Quality Score** | 97/100 |
| **Total ACs** | 240+ acceptance criteria |
| **INVEST Compliance** | 100% |

---

## Dependencies Check

### Must Have (Hard Dependencies)

These must be COMPLETE before starting Epic 03:

| Epic | Story | Feature | Status | Days to Complete |
|------|-------|---------|--------|------------------|
| 01 | 01.1 | Organization Context + RLS | ~80% | Verify complete |
| 01 | 01.8 | Warehouses CRUD | ~80% | Verify complete |
| 01 | 01.10 | Roles CRUD | ~80% | Verify for approvals |
| 02 | 02.1 | Products CRUD | ~80% | Verify complete |
| 02 | 02.4, 02.5a | BOMs + BOM Items | ~80% | Verify complete |

**Blocker Check:** If any of these are < 100%, Epic 03 stories may stall.

### Soft Dependencies (Nice to Have)

| Epic | Story | Feature | Why | Impact |
|------|-------|---------|-----|--------|
| 01 | 01.9 | Locations CRUD | Location selection in TO/WO | Minor - defaults work |
| 01 | 01.11 | Production Lines | Line selection in WO | Minor - can leave empty |

---

## Story Sequence (Recommended Order)

### Week 1: Foundation Stories (4 days)

```
Sprint 1 (Days 1-4):
├─ 03.1: Suppliers CRUD (3-4 days)
│  Database: suppliers table + RLS
│  UI: Supplier list/detail, master data form
│
└─ 03.2: Supplier-Products (1-2 days)
   Database: product_suppliers join
   UI: Supplier product assignment list
```

**Key Decisions:**
- Supplier master data structure (tax ID, contact, terms)
- Multi-supplier per product support
- RLS scope: org_id + supplier_id visibility

---

### Week 2: Purchase Order CRUD (5 days)

```
Sprint 2 (Days 5-9):
├─ 03.3: PO CRUD + Lines (5-7 days)
│  Database: purchase_orders + po_lines tables
│  UI: PO list, detail, line editor with row-by-row controls
│
├─ 03.4: PO Calculations (1-2 days)
│  Line subtotals, tax, discounts
│  UI: Auto-calculated display in line editor
│
└─ 03.7: PO Status Lifecycle (1-2 days)
   Draft → Approved → Received → Closed
   UI: Status badge + state transitions
```

**Key Decisions:**
- Quantity unit per line or global?
- Currency handling (multi-currency?)
- Tax calculation rules (included or separate line?)

---

### Week 3: PO Approval Workflow (4-5 days)

```
Sprint 3 (Days 10-14):
├─ 03.5a: PO Approval Setup (1-2 days)
│  Database: planning_settings approval_required, approval_threshold
│  UI: Planning settings section
│
└─ 03.5b: PO Approval Workflow (3-4 days)
   Database: po_approval_history table
   API: /api/planning/po/[id]/submit, /approve, /reject
   UI: Approval queue modal, notifications
   Service: State machine (draft→submitted→approved)
```

**Key Decisions:**
- Approval threshold (amount-based)
- Who can approve (role-based)
- Multi-level approval needed?

---

### Week 4: PO Bulk Operations (3-4 days)

```
Sprint 4 (Days 15-18):
├─ 03.6: PO Bulk Operations (3-4 days)
│  Bulk create from template
│  Bulk status change
│  Bulk download/export
│  UI: Toolbar with bulk action buttons
│
└─ [Start Transfer Orders in parallel if 2 devs]
```

**Key Decisions:**
- Bulk import format (CSV, Excel?)
- Duplicate checking logic
- Transaction handling for bulk ops

---

### Week 5: Transfer Orders (3-4 days)

```
Sprint 5 (Days 19-22):
├─ 03.8: TO CRUD + Lines (3-4 days)
│  Database: transfer_orders + to_lines tables
│  Source warehouse, destination warehouse
│  UI: TO list, detail, line editor
│
└─ 03.9a: TO Partial Shipments (1-2 days)
   Allow partial receipt of TO lines
   Track received qty vs ordered qty
   UI: Display remaining qty to receive
```

**Key Decisions:**
- Allow TO creation without from/to warehouse?
- Automatic WO creation from TO?
- Sequence numbering for TO?

---

### Week 6: Work Orders CRUD (5-7 days)

```
Sprint 6 (Days 23-29):
├─ 03.10: WO CRUD (5-7 days)
│  Database: work_orders + wo_lines tables
│  WO status: draft, released, in_progress, completed, cancelled
│  UI: WO list with search, detail form
│
└─ 03.12: WO Operations Copy (3-4 days)
   Copy routing operations to WO
   Edit operation sequence
   UI: Operations tab in WO detail
```

**Key Decisions:**
- WO numbering scheme (sequential, date-based?)
- Required fields for WO (customer, production line?)
- Allow changing BOM after creation?

---

### Week 7: WO Advanced Features (7-8 days)

```
Sprint 7 (Days 30-37):
├─ 03.11a: WO BOM Snapshot (5-7 days)
│  Capture BOM at WO creation (immutable copy)
│  Database: wo_lines with bom_version, recipe_json
│  UI: Display original BOM + compare with current
│
└─ 03.13: Material Availability Check (3-4 days)
   Query inventory for WO materials
   Display available qty vs required
   UI: Warning badge, drill-down list
```

**Key Decisions:**
- Include expected GRN in availability calculation?
- How far into future to consider?
- Format for ingredient substitutions?

---

### Week 8: Planning Dashboards & Settings (4-5 days)

```
Sprint 8 (Days 38-42):
├─ 03.15: WO Gantt View (3-4 days)
│  Gantt chart of WO timeline
│  Drag-to-reschedule capability
│  Color-coded by status
│
├─ 03.16: Planning Dashboard (3-4 days)
│  KPIs: active WO count, pending approvals, inventory alerts
│  Quick filters: by status, warehouse, date range
│
└─ 03.17: Planning Settings (1-2 days)
   Approval threshold, default values
   UI: Single page in settings
```

**Key Decisions:**
- Gantt zoom levels (day, week, month?)
- Dashboard refresh frequency
- Settings: per-org or global?

---

### Deferred Stories (4 stories - Move to Epic 05 after LP ready)

| Story | Reason | Dependency |
|-------|--------|------------|
| 03.9b | TO LP Selection | Epic 05.1 (LP Table) |
| 03.11b | WO Reservations | Epic 05.3 (Reservations + FIFO/FEFO) |
| 03.13 | Material Availability | Epic 05.3 (LP Reservations) |
| 03.14 | WO Scheduling | Epic 04/05 (Capacity, LP availability) |

**When to Implement:** After Epic 05 Phase 0 is complete (Week 2-3)

---

## Day-by-Day Execution Plan (Weeks 1-8)

```
WEEK 1: SUPPLIERS FOUNDATION
└─ Day 1-2:   03.1 Suppliers schema + CRUD endpoints + basic UI
└─ Day 3-4:   03.1 continued + 03.2 Supplier-Products
└─ Day 5:     Buffer day for reviews/testing

WEEK 2: PO FOUNDATION
└─ Day 6-8:   03.3 PO CRUD with lines editor
└─ Day 9-10:  03.4 Calculations + 03.7 Status lifecycle
└─ Day 11:    Buffer day for reviews/testing

WEEK 3: PO APPROVAL
└─ Day 12:    03.5a PO Approval Setup (quick story)
└─ Day 13-15: 03.5b PO Approval workflow
└─ Day 16:    Buffer day for reviews/testing

WEEK 4: PO BULK + START TO
└─ Day 17-19: 03.6 PO Bulk Operations
└─ Day 20:    Buffer + start 03.8 if 2 devs available

WEEK 5: TRANSFER ORDERS
└─ Day 21-23: 03.8 TO CRUD + 03.9a Partial shipments
└─ Day 24:    Buffer day for reviews/testing

WEEK 6: WORK ORDERS PART 1
└─ Day 25-29: 03.10 WO CRUD (large story)
└─ Day 30:    Continue 03.10 + start 03.12

WEEK 7: WORK ORDERS PART 2
└─ Day 31-36: 03.11a WO BOM Snapshot + 03.13 Material Availability
└─ Day 37:    Continue if needed

WEEK 8: DASHBOARDS & SETTINGS
└─ Day 38-40: 03.15 Gantt View + 03.16 Dashboard
└─ Day 41-42: 03.17 Planning Settings + polish
```

---

## Database Schema Overview

### Core Tables

```sql
-- Suppliers
suppliers (id, org_id, name, tax_id, contact_email, payment_terms_days)

-- Product-Supplier assignments
product_suppliers (id, org_id, product_id, supplier_id, supplier_sku)

-- Purchase Orders
purchase_orders (id, org_id, supplier_id, po_number, status, total_amount, approval_required)

-- PO Lines
po_lines (id, po_id, product_id, qty, unit_price, line_total, received_qty)

-- PO Approval History
po_approval_history (id, po_id, action, actor_id, timestamp, comments)

-- Transfer Orders
transfer_orders (id, org_id, from_warehouse_id, to_warehouse_id, status, reference)

-- TO Lines
to_lines (id, to_id, product_id, qty, received_qty, status)

-- Work Orders
work_orders (id, org_id, wo_number, product_id, qty, target_date, status, bom_id, bom_snapshot_json)

-- WO Lines (materials needed)
wo_lines (id, wo_id, product_id, qty_required, qty_consumed, status)

-- WO Operations
wo_operations (id, wo_id, operation_id, sequence, status)

-- Planning Settings
planning_settings (org_id, approval_required, approval_threshold_amount, default_warehouse_id)
```

---

## API Endpoints Summary

### Suppliers
- `GET /api/planning/suppliers` - List with filters
- `POST /api/planning/suppliers` - Create
- `GET /api/planning/suppliers/[id]` - Detail
- `PUT /api/planning/suppliers/[id]` - Update
- `DELETE /api/planning/suppliers/[id]` - Delete

### Purchase Orders
- `GET /api/planning/po` - List with filters
- `POST /api/planning/po` - Create
- `GET /api/planning/po/[id]` - Detail with lines
- `PUT /api/planning/po/[id]` - Update
- `POST /api/planning/po/[id]/submit` - Submit for approval
- `POST /api/planning/po/[id]/approve` - Approve
- `POST /api/planning/po/[id]/reject` - Reject
- `POST /api/planning/po/bulk-create` - Bulk import

### Transfer Orders
- `GET /api/planning/to` - List
- `POST /api/planning/to` - Create
- `GET /api/planning/to/[id]` - Detail
- `PUT /api/planning/to/[id]` - Update

### Work Orders
- `GET /api/planning/wo` - List with search
- `POST /api/planning/wo` - Create
- `GET /api/planning/wo/[id]` - Detail
- `PUT /api/planning/wo/[id]` - Update
- `GET /api/planning/wo/[id]/materials` - Material availability

### Planning
- `GET /api/planning/dashboard` - Dashboard KPIs
- `GET /api/planning/gantt` - Gantt chart data
- `PUT /api/planning/settings` - Update settings

---

## Testing Strategy

### Unit Tests per Story

| Story | Key Tests | Coverage Target |
|-------|-----------|-----------------|
| 03.1-03.2 | CRUD ops, RLS, filters | >= 80% |
| 03.3-03.4 | Line calculations, state transitions | >= 80% |
| 03.5a-03.5b | Approval state machine, role validation | >= 85% |
| 03.6 | Bulk create atomicity, duplicate check | >= 80% |
| 03.8-03.9a | Partial receipt logic, qty tracking | >= 80% |
| 03.10-03.12 | BOM snapshot, operation copy, validation | >= 85% |
| 03.15-03.16 | Gantt rendering, dashboard aggregation | >= 75% (UI) |
| 03.17 | Settings CRUD, defaults | >= 80% |

### Integration Tests

- Supplier → PO (verify product exists)
- PO → WO (verify PO materials available)
- WO → Gantt (verify rendering)
- Approval workflow (submit → approve → status change)

### E2E Test Scenarios

1. **Happy Path:** Create supplier → Create PO → Approve → Receive → Create WO → View Gantt
2. **Error Path:** PO with invalid product → approval rejection → status revert
3. **Edge Cases:** Partial receipt, bulk create with duplicates, WO with zero qty

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| BOM snapshot too large (JSON) | Medium | Compress or store separately in Phase 2 |
| Approval workflow complexity | Low | Simple state machine (3 states only) |
| Large PO list performance | Low | Add pagination + indexes on org_id, status |
| Gantt rendering slow | Medium | Lazy load + virtualization if >500 WO |

---

## Success Criteria

- [ ] All 19 stories completed with >= 80% test coverage
- [ ] All ACs passing in testing environment
- [ ] Performance: PO list load < 500ms, WO list load < 500ms
- [ ] RLS verified: users see only org data
- [ ] Approval workflow tested with multiple roles
- [ ] Documentation updated with actual implementation notes

---

## Next Steps

1. **Week 1 Kickoff:** Confirm dependencies complete (Epic 01, 02)
2. **Parallel Start:** Start 03.1 + 03.2 (Week 1)
3. **Day 4-12 Coordination:** Track Epic 05 Phase 0 progress for 03.9b/11b deferral decision
4. **Week 6:** Decide if 03.14 (WO Scheduling) should stay deferred or be attempted
5. **Week 9:** Epic 03 complete → Ready for Epic 05 LP integration

---

**Document Version:** 1.0
**Last Updated:** 2025-12-16
**Created By:** TECH-WRITER
**Status:** APPROVED FOR IMPLEMENTATION
