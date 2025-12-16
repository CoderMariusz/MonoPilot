# Epic 03 Planning - Phase Breakdown

**Story organization by release phase with status and dependencies.**

Date: 2025-12-16
Status: Phase 1 COMPLETE, Phase 2-3 PLANNED

---

## Phase 1 (MVP) - 19 Stories ✅ READY

**Scope:** Core planning workflows for purchasing, transfer, and production planning
**Timeline:** 42-58 days (1 dev), 21-29 days (2 devs)
**Quality Score:** 97/100
**Status:** ALL STORIES SPECIFIED - READY FOR IMPLEMENTATION

### Phase 1A: Supplier Foundation (2 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.1** | Suppliers CRUD + Master Data | 3-4 | M | Epic 01.1 |
| **03.2** | Supplier-Product Assignments | 1-2 | S | 03.1 |

**Deliverables:**
- Supplier table with contact, tax ID, payment terms
- Product-supplier join table
- RLS: org_id scoped visibility
- UI: Supplier list with filters, detail form, product assignment grid

**Key Decision:** Support multiple suppliers per product?
- YES → Enables supplier comparison, backup suppliers

---

### Phase 1B: Purchase Order CRUD (5 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.3** | PO CRUD + Lines | 5-7 | L | Epic 01.1, 01.8, 02.1 |
| **03.4** | PO Totals + Tax Calculations | 1-2 | S | 03.3 |
| **03.5a** | PO Approval Setup | 1-2 | S | 03.3 |
| **03.5b** | PO Approval Workflow | 3-4 | M | 03.5a, Epic 01.10 |
| **03.6** | PO Bulk Operations | 3-4 | M | 03.3 |
| **03.7** | PO Status Lifecycle | 1-2 | S | 03.3 |

**Deliverables:**
- PO master + lines with qty, unit price, line totals
- Approval state machine (draft → submitted → approved → received → closed)
- Bulk import from CSV/Excel with duplicate detection
- Status transitions with business rule validation
- UI: PO list with filters, detail with inline line editing, approval queue

**PO Flow:**
```
Draft (user can edit)
  → Submit (approval_threshold check)
    → Approved or Rejected (state branches)
      → Received (qty tracking)
        → Closed
```

**Key Metrics:**
- Total line count per PO
- Ordered amount vs approved amount
- Approval queue size (KPI)

---

### Phase 1C: Transfer Orders (3 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.8** | TO CRUD + Lines | 3-4 | M | Epic 01.8, 01.9 |
| **03.9a** | TO Partial Shipments | 1-2 | S | 03.8 |
| **03.9b** | TO LP Selection | 3-4 | M | Epic 05.1 (DEFERRED) |

**Deliverables:**
- Transfer order master (from warehouse → to warehouse)
- TO lines with qty ordered, received tracking
- Partial receipt handling (received qty < ordered qty)
- LP pre-selection for outbound transfer (DEFERRED to Phase 2 after LP ready)
- UI: TO list, detail with receiving side-panel

**TO Flow:**
```
Draft (warehouse planning)
  → Released (can receive)
    → Partially Received (some lines in)
      → Fully Received (all lines in)
        → Closed
```

**Key Decision:** Link TO to WO or independent?
- INDEPENDENT → More flexible, can do transfers for non-manufactured items

---

### Phase 1D: Work Orders (6 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.10** | WO CRUD | 5-7 | L | Epic 01.1, 01.11, 02.1, 02.4 |
| **03.11a** | WO BOM Snapshot | 5-7 | L | 03.10, Epic 02.5a |
| **03.11b** | WO Reservations | 3-4 | M | Epic 05.3 (DEFERRED) |
| **03.12** | WO Operations Copy | 3-4 | M | 03.10, Epic 02.7 |
| **03.13** | Material Availability Check | 3-4 | M | Epic 05.3 (DEFERRED) |
| **03.14** | WO Scheduling | 7-10 | XL | 03.10, Epic 04, 05 (DEFERRED) |

**Deliverables:**
- WO table with product, qty, target date, status
- BOM snapshot at creation (immutable copy of BOM at time of WO creation)
- Routing operations copy + sequencing
- Material availability check (inventory lookup vs required)
- Scheduling with Gantt visualization
- RLS: org_id scoped
- UI: WO list with search, detail with tabs (Info, BOM, Operations, Materials, Gantt)

**WO Flow:**
```
Draft (planning)
  → Released (ready for production)
    → In Progress (production started)
      → Completed (yield calculated)
        → Closed (archived)
```

**BOM Snapshot Strategy:**
- Store entire BOM as JSON at creation
- Compare current product BOM vs WO BOM for visibility
- Reason: Changes to product should not affect already-released WO

**Key Metrics:**
- WO count by status
- Material availability alerts
- Overdue WO count

---

### Phase 1E: Planning Dashboards & Settings (3 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.15** | WO Gantt View | 3-4 | M | 03.10 |
| **03.16** | Planning Dashboard | 3-4 | M | 03.10, 03.3, 03.8 |
| **03.17** | Planning Settings | 1-2 | S | 03.1, 03.5a |

**Deliverables:**
- Gantt chart: timeline view of WO with drag-to-reschedule
- Dashboard: KPIs (active WO, pending approvals, material alerts)
- Settings page: approval threshold, default warehouse, business rules
- UI: Responsive charts, export capability

**Dashboard KPIs:**
- Active WO count (in_progress status)
- Pending PO approvals (queue size)
- Material shortage alerts (availability < 100%)
- Overdue WO (target date < today)
- Compliance: % WO with BOM snapshot

---

## Phase 1 Summary

### Stories by Wave

**Wave 1 (Foundation):** 03.1-03.2 (4-6 days)
- Suppliers setup

**Wave 2 (PO Workflows):** 03.3-03.7 (10-15 days)
- Purchase order CRUD + approval + bulk

**Wave 3 (Transfers):** 03.8-03.9a (4-6 days)
- Transfer orders with partial receipt

**Wave 4 (Work Orders):** 03.10-03.12 (13-18 days)
- WO CRUD + BOM snapshot + operations

**Wave 5 (Planning):** 03.15-03.17 (7-10 days)
- Dashboards + settings

**Wave 6 (Advanced):** 03.13-03.14 (10-14 days, mostly deferred)
- Material availability + scheduling

### Deferred Stories (Wait for Epic 05)

| Story | Title | Reason | When Available |
|-------|-------|--------|-----------------|
| **03.9b** | TO LP Selection | Requires LP table (Epic 05.1) | Week 2 (Day 4) |
| **03.11b** | WO Reservations | Requires FIFO/FEFO (Epic 05.3) | Week 2 (Day 12) |
| **03.13** | Material Availability | Requires LP reservations | Week 2 (Day 12) |
| **03.14** | WO Scheduling | Requires capacity planning (Epic 04/05) | Week 4+ |

**Impact:** Phase 1 MVP is still complete and functional without these 4 stories. They enhance with LP features.

---

## Phase 2 (MRP) - 12 Stories 📋 NOT CREATED

**Scope:** Demand forecasting, MRP engine, auto-replenishment
**Timeline:** 18-24 days (1 dev), 9-12 days (2 devs)
**Status:** PLANNED - specifications not yet created
**When to Start:** After 6+ months operational data available

### Phase 2A: Demand Forecasting (4 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.20** | Historical Demand Tracking | 2-3 | M | Phase 1 + 6 months data |
| **03.21** | Basic Forecasting Engine | 4-5 | L | 03.20, Epic 05 history |
| **03.22** | Safety Stock Management | 3-4 | M | 03.21 |
| **03.23** | Reorder Point Alerts | 1-2 | S | 03.22 |

**High-Level Approach:**
- Track historical sales/usage from WO + Shipping
- Use moving average + seasonal decomposition
- Calculate safety stock based on demand variance
- Alert when inventory < reorder point

---

### Phase 2B: MRP Engine (4 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.24** | Master Production Schedule (MPS) | 4-5 | L | 03.21 |
| **03.25** | MRP Calculation Engine | 6-8 | XL | 03.24, Epic 05 |
| **03.26** | Suggested Purchase Orders | 3-4 | M | 03.25 |
| **03.27** | MRP Dashboard | 3-4 | M | 03.26 |

**High-Level Approach:**
- MPS: aggregate demand by product + time bucket
- MRP: explosion of BOM to calculate component needs
- Suggest PO creation for shortages
- Dashboard: MRP run status, shortages, suggested actions

**Algorithm:** Level-by-level BOM explosion, net requirement calc

---

### Phase 2C: Auto-Replenishment (4 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.28** | Replenishment Rules CRUD | 2-3 | M | Phase 1 |
| **03.29** | Auto PO Generation | 3-4 | M | 03.28 |
| **03.30** | Replenishment Dashboard | 2-3 | S | 03.29 |
| **03.31** | Blanket Purchase Orders | 3-4 | M | 03.28 |

**High-Level Approach:**
- Define rules per product (reorder point, order qty, supplier)
- Automatically create PO when inventory < reorder point
- Support blanket PO (standing order with call-offs)

---

## Phase 3 (Enterprise) - 20 Stories 📋 NOT CREATED

**Scope:** Supplier quality, capacity planning, EDI integration
**Timeline:** 30-40 days (1 dev), 15-20 days (2 devs)
**Status:** PLANNED - specifications not yet created
**When to Start:** After Phase 2 + months of operational data

### Phase 3A: Supplier Quality (5 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.40** | Approved Supplier List (ASL) | 3-4 | M | Epic 06 Phase 4 (supplier ratings) |
| **03.41** | Supplier Scorecards | 3-4 | M | 03.40 |
| **03.42** | Supplier Audits + Findings | 4-5 | L | 03.41 |
| **03.43** | Supplier Performance Analytics | 2-3 | M | 03.42 |
| **03.44** | Supplier Quality Dashboard | 2-3 | M | 03.43 |

**High-Level Approach:**
- Track supplier KPIs: on-time delivery, quality score, price trend
- Score suppliers for preferred list
- Record audits + findings
- Analytics: supplier performance trends

---

### Phase 3B: Capacity Planning (5 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.45** | Resource Capacity Definition | 3-4 | M | Phase 1 |
| **03.46** | Finite Capacity Scheduling | 7-10 | XL | 03.45, Epic 04 |
| **03.47** | Capacity Utilization Analytics | 3-4 | M | 03.46 |
| **03.48** | Capacity Alerts + Optimization | 3-4 | M | 03.47 |
| **03.49** | Multi-Line Scheduling | 5-7 | L | 03.46 |

**High-Level Approach:**
- Define capacity per line/machine (hours per day)
- Schedule WO considering available capacity
- Alert on over-capacity situations
- Optimize WO sequence to maximize utilization

---

### Phase 3C: EDI Integration (10 stories)

| Story | Title | Days | Complexity | Dependencies |
|-------|-------|------|-----------|--------------|
| **03.50** | EDI Settings + Partner Mappings | 3-4 | M | Phase 1, Epic 11 |
| **03.51** | EDIFACT ORDERS Import | 5-7 | L | 03.50 |
| **03.52** | EDIFACT DESADV Export | 5-7 | L | 03.50 |
| **03.53** | X12 850 Order Import | 4-5 | L | 03.50 |
| **03.54** | X12 856 ASN Export | 4-5 | L | 03.50 |
| **03.55** | GS1 XML Integration | 3-4 | M | 03.50 |
| **03.56** | VMI Supplier Portal | 6-8 | L | 03.50 |
| **03.57** | EDI Error Handling + Retry | 2-3 | M | 03.50 |
| **03.58** | EDI Audit Trail | 1-2 | S | 03.50 |
| **03.59** | EDI Dashboard | 2-3 | M | 03.50 |

**High-Level Approach:**
- Support EDIFACT, X12, GS1 XML standards
- Auto-create PO from customer orders
- Send ASN to customers
- Vendor Managed Inventory (VMI) portal for supplier visibility

---

## Complete Epic 03 Story Count

```
Phase 1 (MVP):      19 stories ✅ COMPLETE
Phase 2 (MRP):      12 stories 📋 PLANNED
Phase 3 (Enterprise): 20 stories 📋 PLANNED
────────────────────────────────
TOTAL Epic 03:       51 stories
```

---

## Release Strategy

### Release 1 (MVP): Phase 1 Only
- **When:** Week 9-10 (after 42-58 days)
- **What:** All 19 Phase 1 stories
- **Scope:** Suppliers, PO, TO, WO, Planning dashboards
- **Functionality:** Manual planning workflows, no MRP or EDI
- **Target Users:** Production planners, procurement team

### Release 2 (Forecasting): Phase 1 + Phase 2
- **When:** Month 6-7 (after operational data available)
- **What:** Add Phase 2 stories
- **Scope:** MRP engine, demand forecasting, auto-replenishment
- **New Functionality:** Automatic PO generation, forecasting
- **Target Users:** Plus sales forecasters, supply chain analysts

### Release 3 (Enterprise): Phase 1 + Phase 2 + Phase 3
- **When:** Month 12+ (enterprise features)
- **What:** Add Phase 3 stories
- **Scope:** Supplier quality, capacity planning, EDI
- **New Functionality:** Supplier scorecards, finite capacity scheduling, EDI integration
- **Target Users:** Plus supply chain managers, EDI coordinators

---

## Dependency Map

```
Phase 1 (19 stories) - SELF-CONTAINED MVP
├─ Suppliers (03.1-03.2)
│  └─ provides: supplier master data
│
├─ PO (03.3-03.7)
│  ├─ depends on: suppliers
│  └─ provides: purchase order workflow
│
├─ TO (03.8-03.9a)
│  ├─ independent of PO (parallel start)
│  └─ provides: transfer order workflow
│
├─ WO (03.10-03.12)
│  ├─ depends on: PO (material sourcing), TO (transfers)
│  └─ provides: production work order
│
└─ Planning (03.15-03.17)
   ├─ depends on: WO + PO + TO (for dashboard data)
   └─ provides: visibility dashboards

Phase 2 (12 stories) - DEFERRED FEATURES
├─ Demand (03.20-03.23)
│  ├─ depends on: 6+ months Phase 1 data
│  └─ provides: forecast inputs
│
├─ MRP (03.24-03.27)
│  ├─ depends on: demand + BOM explosion
│  └─ provides: suggested purchases
│
└─ Auto-Replenishment (03.28-03.31)
   ├─ depends on: MRP + rules engine
   └─ provides: automated PO creation

Phase 3 (20 stories) - ENTERPRISE
├─ Supplier Quality (03.40-03.44)
│  ├─ depends on: Epic 06 Phase 4 (supplier ratings)
│  └─ provides: ASL + scorecards
│
├─ Capacity (03.45-03.49)
│  ├─ depends on: phase 1 data + WO history
│  └─ provides: capacity-aware scheduling
│
└─ EDI (03.50-03.59)
   ├─ depends on: Epic 11 (integrations)
   └─ provides: B2B exchange
```

---

## Key Decisions by Phase

### Phase 1 Decisions Required

- [ ] Approval threshold amount (defaults to $10,000?)
- [ ] Multi-level approval needed? (No, single level for MVP)
- [ ] Multiple suppliers per product? (Yes)
- [ ] PO line: qty per unit or total? (Total qty + unit)
- [ ] Tax calculation: included or separate? (Separate line)
- [ ] WO scheduling in MVP or defer? (DEFER to Phase 2)

### Phase 2 Decisions (Later)

- Forecasting algorithm (moving average, exponential smoothing?)
- MRP bucket size (weekly, daily?)
- Safety stock calculation method?

### Phase 3 Decisions (Later)

- EDI partner management (manual or auto-discovery?)
- Supplier score formula (weighted factors?)
- Capacity constraints: time buckets or continuous?

---

## Success Metrics

### Phase 1 Success

- [ ] All 19 stories implemented + tested
- [ ] Zero critical bugs in production
- [ ] PO approval workflow tested end-to-end
- [ ] WO BOM snapshot immutability verified
- [ ] Dashboard load time < 1 second
- [ ] 95%+ test coverage

### Phase 2 Success (if implemented)

- [ ] MRP calculations accurate vs manual verification
- [ ] Auto-generated PO matches forecasted demand
- [ ] Safety stock prevents stockouts in 99% of cases

### Phase 3 Success (if implemented)

- [ ] EDI message error rate < 1%
- [ ] Capacity scheduling optimization saves 10%+ labor
- [ ] Supplier scorecard correlates with actual quality

---

**Document Version:** 1.0
**Last Updated:** 2025-12-16
**Created By:** TECH-WRITER
**Status:** PHASE 1 APPROVED - PHASE 2-3 PLANNING
