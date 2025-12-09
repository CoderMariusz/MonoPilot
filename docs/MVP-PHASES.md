# MonoPilot - MVP Phases

**Last Updated:** 2025-12-09
**Product Type:** Manufacturing ERP (MES/MOM) for Food Industry
**Business Model:** SaaS

---

## Phase Overview

| Phase | Epics | Status | Goal |
|-------|-------|--------|------|
| **MVP (Phase 1)** | 1-5 | ~95% Done | Core manufacturing operations |
| **Phase 2** | 6-7 | Not Started | Quality & Shipping |
| **Phase 3** | 8-9 | Not Started | NPD & Performance |

---

## MVP (Phase 1) - Core Manufacturing

**Goal:** Complete manufacturing workflow from planning to warehouse

### Epics Included

| Epic | Name | Stories | Status | Notes |
|------|------|---------|--------|-------|
| 1 | Settings | ~20 | DONE | Org, users, roles, warehouses, locations |
| 2 | Technical | ~25 | DONE | Products, BOMs, Routings, UoM |
| 3 | Planning | ~30 | DONE | PO, TO, Suppliers, MRP basics |
| 4 | Production | ~21 | DONE | WO lifecycle, consumption, output |
| 5 | Warehouse | 36 | 92% | LP, receiving, movements, scanner |

### Epic 5 Remaining Work

| Area | Status | Stories Needed |
|------|--------|----------------|
| Print Integration | NOT DONE | Real ZPL/IPP printer support |
| Warehouse Settings UI | NOT DONE | /settings/warehouse page |
| Scanner PO Barcode | PARTIAL | Scan PO to start receive |
| Scanner Session Timeout | NOT DONE | Auto-logout after inactivity |
| Offline Queue/PWA | NOT DONE | Phase 3 candidate |

### MVP Exit Criteria

- [ ] All Epic 1-5 stories DONE
- [ ] Print integration working (labels)
- [ ] Warehouse settings UI complete
- [ ] Bug fixes: BUG-001 through BUG-005
- [ ] RLS audit passed
- [ ] Performance baseline established
- [ ] Test coverage >70%

---

## Phase 2 - Quality & Shipping

**Goal:** Complete outbound logistics and quality compliance

### Epics Included

| Epic | Name | Stories | Priority | Dependency |
|------|------|---------|----------|------------|
| 6 | Quality | 28 | HIGH | Epic 5 (LP) |
| 7 | Shipping | 28 | HIGH | Epic 5, Epic 6 |

### Epic 6: Quality Control (28 stories)

**Key Features:**
- LP QA Status (pending/passed/failed/quarantine)
- Quality Holds with investigation
- Product Specifications & Test Results
- NCR (Non-Conformance Reports)
- Certificate of Analysis (CoA)
- Quality Dashboard & Reports

**Critical Stories:**
- 6.1-6.5: QA Status Management
- 6.6-6.9: Quality Holds
- 6.10-6.14: Specifications & Testing
- 6.15-6.18: NCR Workflow
- 6.19-6.21: CoA Management
- 6.22-6.24: Reporting

### Epic 7: Shipping & Fulfillment (28 stories)

**Key Features:**
- Sales Orders (SO) CRUD & lifecycle
- Pick Lists with FIFO/FEFO
- Packing & Package tracking
- Shipment tracking (carrier, tracking#)
- Scanner picking/packing workflows
- Shipping documents (packing slip, labels)

**Critical Stories:**
- 7.1-7.4: Sales Orders
- 7.5-7.8: Shipments
- 7.9-7.14: Picking
- 7.15-7.17: Packing
- 7.18-7.21: Documents
- 7.22-7.24: Scanner Workflows

### Phase 2 Exit Criteria

- [ ] All Epic 6 stories DONE
- [ ] All Epic 7 stories DONE
- [ ] QA blocking shipping works
- [ ] Full order-to-ship workflow tested
- [ ] Customer can receive CoA with shipment

---

## Phase 3 - NPD & Performance

**Goal:** New Product Development and system optimization

### Epics Included

| Epic | Name | Stories | Priority | Dependency |
|------|------|---------|----------|------------|
| 8 | NPD | TBD | MEDIUM | Epic 2 |
| 9 | Performance | TBD | MEDIUM | All |

### Epic 8: New Product Development

**Key Features:**
- Product development workflow
- Trial BOMs & Routings
- Costing analysis
- Approval workflow
- Launch to production

### Epic 9: Performance & Optimization

**Key Features:**
- Query optimization
- Caching strategy
- Offline support (PWA)
- Analytics & BI
- Advanced reporting

### Phase 3 Exit Criteria

- [ ] NPD workflow complete
- [ ] Page load <2s (P95)
- [ ] Offline scanner working
- [ ] Dashboard analytics live

---

## Story Count Summary

| Phase | Epics | Est. Stories | Status |
|-------|-------|--------------|--------|
| MVP | 1-5 | ~132 | 95% |
| Phase 2 | 6-7 | ~56 | 0% |
| Phase 3 | 8-9 | ~40 | 0% |
| **Total** | **1-9** | **~228** | **~55%** |

---

## Current Priority Queue

### Immediate (MVP Completion)

1. **BUG-001/002**: Print integration (ZPL/IPP)
2. **BUG-005**: Warehouse Settings UI page
3. **BUG-003**: GRN Items LP navigation
4. **BUG-004**: Scanner PO barcode receive

### Next Sprint (MVP Polish)

5. Scanner session timeout
6. RLS security audit
7. Performance baseline
8. Test coverage improvement

### After MVP

9. Start Epic 6 (Quality)
10. Parallel: Epic 7 planning

---

## Dependencies Graph

```
Epic 1 (Settings)
    ↓
Epic 2 (Technical) ←──────────────────┐
    ↓                                  │
Epic 3 (Planning) ───→ Epic 8 (NPD) ──┘
    ↓
Epic 4 (Production)
    ↓
Epic 5 (Warehouse) ←── CURRENT
    ↓
Epic 6 (Quality) ───→ Phase 2
    ↓
Epic 7 (Shipping) ──→ Phase 2
    ↓
Epic 9 (Performance) → Phase 3
```

---

## Notes

### What moved from MVP to Phase 2/3

| Feature | Originally | Now | Reason |
|---------|-----------|-----|--------|
| Quality Module | MVP | Phase 2 | Core manufacturing works without QA |
| Shipping Module | MVP | Phase 2 | Can ship via manual process |
| Offline Scanner | MVP | Phase 3 | Network is available in staging |
| NPD | Phase 2 | Phase 3 | Not critical for initial customers |

### Risk Items

1. **RLS Policies** - Need security audit before production
2. **Print Integration** - Blocking warehouse workflow
3. **Test Coverage** - Currently unknown, need measurement
4. **Performance** - No baseline metrics yet

