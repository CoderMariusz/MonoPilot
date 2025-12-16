# Epic 02 Technical - MVP Dependency Analysis

**Date:** 2025-12-16
**Status:** READY FOR IMPLEMENTATION
**Conclusion:** Epic 02 is production-ready with comprehensive MVP scope. Can proceed immediately after Epic 01.1 completion.

---

## Executive Summary

Analysis of Epic 02 (Technical Module) reveals a **well-scoped, self-sufficient MVP** that creates the product and recipe foundation for all operational modules (Planning, Production, Warehouse, Quality, Shipping).

**Key Finding:** Epic 02 requires ONLY Story 01.1 (Org Context + Base RLS) from Epic 01. No full Settings infrastructure (warehouses, locations, machines) is required - these dependencies are OPTIONAL (nullable FKs).

**Recommendation:** Proceed with Epic 02 immediately after 01.1 completion. The current MVP scope (15 stories ready, 1 deferred) provides complete technical foundation without blocker dependencies.

---

## Module Dependency Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TECHNICAL MODULE PROVIDES TO DOWNSTREAM EPICS                  │
├─────────────┬───────────┬──────────┬────────────┬───────────┬──────────────┤
│ Technical   │ Planning  │ Planning │ Production │ Warehouse │ Quality/Ship │
│ Provides    │ Epic 03   │ Epic 03  │ Epic 04    │ Epic 05   │ Epic 06/07   │
│             │ (Demand)  │ (PO/WO)  │            │           │              │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Products    │ -         │ HARD     │ HARD       │ HARD      │ SOFT/SOFT    │
│ BOMs        │ SOFT      │ HARD     │ HARD       │ SOFT      │ -/-          │
│ Routings    │ SOFT      │ HARD     │ HARD       │ -         │ -/-          │
│ Costs       │ -         │ SOFT     │ SOFT       │ -         │ -/-          │
│ Allergens   │ -         │ -        │ -          │ -         │ HARD/FOOD    │
│ Trace Conf  │ -         │ -        │ HARD       │ HARD      │ SOFT/-       │
│ Shelf Life  │ -         │ -        │ -          │ SOFT      │ -/SOFT       │
└─────────────┴───────────┴──────────┴────────────┴───────────┴──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              TECHNICAL MODULE REQUIRES FROM OTHER EPICS                     │
├─────────────┬───────────┬──────────┬────────────┬───────────┬──────────────┤
│ Technical   │ Settings  │ Settings │ Settings   │ Warehouse │ Notes        │
│ Needs       │ Epic 01.1 │ Phase 1B │ Phase 1B   │ Epic 05   │              │
│             │ (Org+RLS) │ (Infra)  │ (Infra)    │ (LP)      │              │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Org + RLS   │ HARD      │ -        │ -          │ -         │ 01.1 only    │
│ Users       │ HARD      │ -        │ -          │ -         │ Audit trail  │
│ Roles (10)  │ HARD      │ -        │ -          │ -         │ RBAC         │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Warehouses  │ -         │ OPTIONAL │ -          │ -         │ Not used     │
│ Locations   │ -         │ OPTIONAL │ -          │ -         │ Not used     │
│ Machines    │ -         │ -        │ OPTIONAL   │ -         │ Nullable FK  │
│ Prod Lines  │ -         │ -        │ OPTIONAL   │ -         │ Nullable FK  │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Allergens   │ CREATES   │ -        │ -          │ -         │ Story 02.3   │
│ License Pls │ -         │ -        │ -          │ DEFERRED  │ Story 02.10b │
└─────────────┴───────────┴──────────┴────────────┴───────────┴──────────────┘

Legend:
- HARD = System breaks without it
- SOFT = Works but limited functionality
- OPTIONAL = Feature works if present, gracefully handles absence
- CREATES = Module creates its own (allergens in 02.3)
- DEFERRED = Required for future story (02.10b deferred to Epic 05)
- FOOD = Food safety compliance requirement
```

---

## Dependency Graph (Visual)

```
                           ┌──────────────────┐
                           │ SETTINGS MODULE  │
                           │   (Epic 01.1)    │
                           └────────┬─────────┘
                                    │
                                    │ HARD (Org+Users+RLS)
                                    │
                           ┌────────▼─────────┐
                           │ TECHNICAL MODULE │
                           │   (Epic 02)      │
                           └────────┬─────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  FOUNDATION     │      │ MASTER DATA     │      │  TRACEABILITY   │
│  (Phase 2A-2C)  │      │ (Phase 2D-2E)   │      │  (Phase 2D)     │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ • Products      │      │ • Allergens     │      │ • GS1 Config    │
│ • Product Types │      │   (EU 14 seed)  │      │ • Lot Tracking  │
│ • Versioning    │      │ • Shelf Life    │      │ • Config Only   │
│ • BOMs          │      │ • Nutrition     │      │ • Queries: 05+  │
│ • BOM Items     │      │ • Costs History │      │                 │
│ • Routings      │      │ • Dashboard     │      │                 │
│ • Operations    │      │                 │      │                 │
│ • Costing       │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DOWNSTREAM MODULES (Epics 03-07)               │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│   PLANNING      │   PRODUCTION    │   WAREHOUSE     │   Q/A + SHIP  │
│   (Epic 03)     │   (Epic 04)     │   (Epic 05)     │   (Epic 06/07)│
├─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ Needs:          │ Needs:          │ Needs:          │ Needs:        │
│ • Products (PO) │ • Products (WO) │ • Products (LP) │ • Products    │
│ • BOMs (WO)     │ • BOMs (snap)   │ • Lot Config    │ • Allergens   │
│ • Routings (WO) │ • Routings (op) │ • Shelf Life    │ • Shelf Life  │
│ • Costs (PO)    │ • Trace Config  │                 │               │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OPTIONAL DEPENDENCIES (Nullable)                 │
├─────────────────────────────────────────────────────────────────────┤
│ • Machines (02.8 routing operations) - NOT REQUIRED                 │
│ • Production Lines (02.5 BOM items) - NOT REQUIRED                  │
│ • Locations (not used in Epic 02) - NOT REQUIRED                    │
├─────────────────────────────────────────────────────────────────────┤
│                    DEFERRED DEPENDENCIES (Future)                   │
├─────────────────────────────────────────────────────────────────────┤
│ • License Plates (02.10b traceability queries) - AFTER EPIC 05      │
│ • LP Genealogy (02.10b recall simulation) - AFTER EPIC 05           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Current vs Required MVP Scope

### Current Epic 02 Scope (15 Ready Stories)

| Story | Feature | Priority | Provides To |
|-------|---------|----------|-------------|
| 02.1 | Products CRUD + Types | P0 | Planning, Production, Warehouse, Quality, Shipping |
| 02.2 | Product Versioning + History | P0 | Audit trail for all modules |
| 02.3 | Product Allergens + EU 14 Seed | P0 | Quality, Shipping (food safety) |
| 02.4 | BOMs CRUD + Date Validity | P0 | Planning (WO), Production (consumption) |
| 02.5a | BOM Items Core | P0 | Recipe definition for Production |
| 02.5b | BOM Items Advanced | P1 | Conditional items, by-products |
| 02.6 | BOM Alternatives + Clone | P1 | Substitutions, rapid product setup |
| 02.7 | Routings CRUD | P0 | Production (work order operations) |
| 02.8 | Routing Operations | P0 | Production planning, scheduling |
| 02.9 | BOM-Routing Costs | P0 | Planning (procurement decisions) |
| 02.10a | Traceability Configuration | P0 | Production (lot tracking setup) |
| 02.11 | Shelf Life Calculation | P1 | Warehouse (FEFO picking) |
| 02.12 | Technical Dashboard | P1 | Management visibility |
| 02.13 | Nutrition Calculation | P1 | Food safety labels |
| 02.14 | BOM Advanced Features | P1 | Multi-level explosion, yield |
| 02.15 | Cost History + Variance | P1 | Finance reporting |

**Deferred:**
| Story | Feature | Priority | Deferred Until |
|-------|---------|----------|----------------|
| 02.10b | Traceability Queries | P1 | Epic 05 (License Plates) |

**Result:** Epic 02 creates a COMPLETE technical foundation. All P0 stories (02.1, 02.2, 02.3, 02.4, 02.5a, 02.7, 02.8, 02.9, 02.10a) enable Epic 03-07 to proceed without blockers.

### Story Complexity Breakdown

| Phase | Stories | Complexity | Days |
|-------|---------|------------|------|
| Phase 2A-1 (Products) | 02.1, 02.2, 02.3 | M+S+M | 4-5 |
| Phase 2B (BOMs) | 02.4, 02.5a, 02.5b, 02.6 | M+L+M+M | 5-6 |
| Phase 2C (Routings) | 02.7, 02.8, 02.9 | M+L+M | 5-6 |
| Phase 2D (Trace + Life) | 02.10a, 02.11 | M+M | 3-4 |
| Phase 2E (Dashboard + Adv) | 02.12, 02.13, 02.14, 02.15 | M+L+M+S | 5-6 |
| **Total Ready** | **15 stories** | **M-L mix** | **22-27 days** |

---

## Recommended MVP Scope (Ready for Implementation)

Epic 02 MVP scope is ALREADY OPTIMAL for enabling downstream modules:

| What Epic 02 Creates | Why Essential for MVP |
|----------------------|------------------------|
| Products CRUD + Types | Foundation for all inventory operations |
| Product Versioning | Regulatory compliance, audit trail |
| Allergens (EU 14) | Food safety compliance (Quality, Shipping) |
| BOMs CRUD + Items | Recipe definition for Production |
| Routings + Operations | Production planning and execution |
| BOM-Routing Costs | Procurement and margin analysis |
| Traceability Config | Lot tracking setup (actual queries in Epic 05) |

| What Epic 02 Defers | Why Safe to Defer |
|---------------------|-------------------|
| Traceability Queries (02.10b) | Requires License Plates from Epic 05 |
| Product Images (FR-2.9) | Phase 2 enhancement |
| Barcode Generation (FR-2.11) | Phase 2 enhancement |
| Cost Scenario Modeling (FR-2.76) | Advanced analytics, future |

**No scope expansion needed** - Epic 02 is production-ready as-is.

---

## Dependency Analysis by Story

### Phase 2A: Products Foundation

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 02.1 | 01.1 (Org+RLS) | products, product_types | All downstream modules |
| 02.2 | 02.1 | product_version_history | Audit compliance |
| 02.3 | 02.1, 01.1 | allergens (EU 14), product_allergens | Quality, Shipping |

### Phase 2B: BOMs

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 02.4 | 02.1, 01.1 | boms table | Planning (WO), Production |
| 02.5a | 02.4, 02.7 | bom_items (core) | Recipe definition |
| 02.5b | 02.5a | conditional_flags, byproducts | Advanced BOM features |
| 02.6 | 02.4, 02.5 | bom_alternatives | Substitutions, clone |

### Phase 2C: Routings + Costing

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 02.7 | 01.1 | routings | Production operations |
| 02.8 | 02.7, machines (OPTIONAL) | routing_operations | Production planning |
| 02.9 | 02.5, 02.8 | product_costs | Procurement, margin analysis |

### Phase 2D: Traceability + Shelf Life

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 02.10a | 02.1, 01.1 | product_traceability_config | Lot tracking setup |
| 02.10b | 02.10a, Epic 05 (LP) | Trace queries | **DEFERRED** |
| 02.11 | 02.1, 02.4, 02.10a | product_shelf_life | FEFO picking |

### Phase 2E: Dashboard + Advanced

| Story | Requires | Creates | Enables |
|-------|----------|---------|---------|
| 02.12 | 02.1, 02.4 | Dashboard UI | Management visibility |
| 02.13 | 02.5 | product_nutrition, ingredient_nutrition | FDA labels |
| 02.14 | 02.6 | Multi-level explosion logic | Complex BOMs |
| 02.15 | 02.9 | Cost history tracking | Finance reporting |

---

## Story Index with Priorities

| Story | Name | PRD FRs | Complexity | Priority | Status |
|------:|------|---------|------------|----------|--------|
| 02.1 | Products CRUD + Types | FR-2.1, 2.5-2.8, 2.13-2.15 | M | P0 | Ready |
| 02.2 | Product Versioning + History | FR-2.2, 2.3 | S | P0 | Ready |
| 02.3 | Product Allergens | FR-2.4, 2.28 | M | P0 | Ready |
| 02.4 | BOMs CRUD + Date Validity | FR-2.20, 2.22-2.23, 2.32 | M | P0 | Ready |
| 02.5a | BOM Items Core | FR-2.21, 2.31, 2.38-2.39 | M | P0 | Ready |
| 02.5b | BOM Items Advanced | FR-2.26, 2.27 | M | P1 | Ready |
| 02.6 | BOM Alternatives + Clone | FR-2.24, 2.30 | M | P1 | Ready |
| 02.7 | Routings CRUD | FR-2.40, 2.46, 2.54-2.55 | M | P0 | Ready |
| 02.8 | Routing Operations | FR-2.41, 2.43-2.45, 2.48 | L | P0 | Ready |
| 02.9 | BOM-Routing Costs | FR-2.36-2.37, 2.50-2.53, 2.70, 2.72-2.74, 2.77 | M | P0 | Ready |
| 02.10a | Traceability Configuration | FR-2.60, 2.64 | M | P0 | Ready |
| 02.10b | Traceability Queries | FR-2.60-2.63, 2.65 | L | P1 | **DEFERRED** |
| 02.11 | Shelf Life Calculation | FR-2.90-2.92 | M | P1 | Ready |
| 02.12 | Technical Dashboard | FR-2.100-2.102 | M | P1 | Ready |
| 02.13 | Nutrition Calculation | FR-2.80-2.82, 2.84 | L | P1 | Ready |
| 02.14 | BOM Advanced Features | FR-2.25, 2.29, 2.34-2.35 | M | P1 | Ready |
| 02.15 | Cost History + Variance | FR-2.71, 2.75 | S | P1 | Ready |

**Total Stories:** 16 (15 ready + 1 deferred)
**P0 Stories:** 10 (02.1-02.5a, 02.7-02.10a)
**P1 Stories:** 6 (02.5b, 02.6, 02.11-02.15, 02.10b deferred)

---

## Effort Estimation

### By Phase (1 developer)

| Phase | Stories | Story Points | Days | Cumulative |
|-------|---------|--------------|------|------------|
| Phase 2A-1: Products Core | 02.1 | 5 | 2-3 | 2-3 |
| Phase 2A-2: Versioning + Allergens | 02.2, 02.3 | 7 | 3-4 | 5-7 |
| Phase 2B-1: BOM Core | 02.4, 02.5a | 10 | 4-5 | 9-12 |
| Phase 2B-2: BOM Advanced | 02.5b, 02.6 | 8 | 3-4 | 12-16 |
| Phase 2C-1: Routings Core | 02.7, 02.8 | 10 | 4-5 | 16-21 |
| Phase 2C-2: Costing | 02.9 | 5 | 2-3 | 18-24 |
| Phase 2D-1: Traceability + Life | 02.10a, 02.11 | 8 | 3-4 | 21-28 |
| Phase 2E-1: Dashboard + Advanced | 02.12-02.15 | 15 | 6-8 | 27-36 |
| **Total Ready Stories** | **15** | **68** | **27-36 days** | - |

### By Priority

| Priority | Stories | Days |
|----------|---------|------|
| P0 (MVP Core) | 10 | 18-24 |
| P1 (Enhanced) | 5 | 9-12 |
| **Total** | **15** | **27-36 days** |

### Deferred (After Epic 05)

| Story | Dependencies | Days |
|-------|--------------|------|
| 02.10b | Epic 05 License Plates + Genealogy | 4-6 |

**Recommendation:** Implement P0 stories first (18-24 days) to unblock Epic 03-07. P1 stories can run in parallel with downstream epics.

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| BOM date overlap bugs | High | Medium | Database triggers enforce validity (migration 049) + integration tests |
| Cost calculation errors | High | Medium | Comprehensive unit tests for costing-service.ts + regression suite |
| Allergen inheritance bugs | Medium | Medium | Test allergen rollup on BOM changes + multi-level BOM tests |
| Machine dependency breaks | Low | Low | Nullable FK, graceful empty state in dropdown |
| Production Line dependency | Low | Low | Nullable array, NULL = all lines |
| RLS policy gaps | High | Low | Multi-tenant integration tests per ADR-001 |
| Multi-level BOM explosion | Medium | Medium | Depth limit (10 levels), cycle detection, caching |
| Routing cost versioning | Medium | Low | Snapshot at WO creation per ADR-002 |
| Traceability queries blocked | Low | N/A | 02.10b properly deferred to Epic 05 |
| Performance on large BOMs | Medium | Medium | Indexed queries, virtual scrolling, 100-item limit in UI |

### Dependency Risks (Mitigated)

| Dependency | Risk | Mitigation Status |
|------------|------|-------------------|
| Epic 01 full infrastructure | ELIMINATED | Only 01.1 required (Org+RLS) |
| Machines table | MITIGATED | Nullable FK, dropdown shows empty state |
| Production Lines table | MITIGATED | Nullable array, NULL = all lines |
| License Plates table | MITIGATED | Story 02.10b deferred to Epic 05 |
| Warehouses/Locations | ELIMINATED | Not used in Epic 02 |

---

## Conclusion

**Epic 02 Technical Module is READY FOR IMPLEMENTATION with optimal MVP scope.**

### Key Strengths:

1. **Minimal Dependencies**: Requires ONLY Story 01.1 (Org Context + Base RLS) from Epic 01
2. **Self-Sufficient**: Creates its own master data (allergens in 02.3)
3. **Optional FK Pattern**: Machines and Production Lines are NULLABLE - no hard blockers
4. **Smart Deferral**: Story 02.10b (Traceability Queries) properly deferred to Epic 05
5. **Complete Foundation**: 15 ready stories provide full technical infrastructure for Epic 03-07

### What Makes This MVP Strong:

- **Products CRUD** enables all inventory operations
- **BOMs + Routings** enable work order creation and production
- **Traceability Config** sets up lot tracking (actual queries deferred to Epic 05)
- **Allergens** enable food safety compliance
- **Costing** enables procurement decisions

### Implementation Path:

```
Epic 01.1 (Org Context + RLS) → 2-3 days
    ↓
Epic 02 P0 Stories (02.1-02.5a, 02.7-02.10a) → 18-24 days
    ↓
Epic 03 Planning CAN START (has Products, BOMs, Routings)
Epic 04 Production CAN START (has Products, BOMs, Routings, Trace Config)
Epic 05 Warehouse CAN START (has Products, Trace Config)
    ↓
Epic 05 Complete (License Plates created)
    ↓
Epic 02.10b Traceability Queries → 4-6 days
```

### No Scope Changes Needed:

- Current 15 ready stories are sufficient for MVP
- Deferred story (02.10b) has clear prerequisite (Epic 05)
- Optional dependencies (machines, lines) handled gracefully
- All P0 requirements covered

**Status: GREEN - Proceed with implementation**

---

## Next Steps

1. Complete Epic 01.1 (Org Context + Base RLS) - prerequisite
2. Implement Epic 02 Phase 2A (Products) - stories 02.1, 02.2, 02.3
3. Implement Epic 02 Phase 2B (BOMs) - stories 02.4, 02.5a, 02.5b, 02.6
4. Implement Epic 02 Phase 2C (Routings) - stories 02.7, 02.8, 02.9
5. Implement Epic 02 Phase 2D (Traceability + Life) - stories 02.10a, 02.11
6. Epic 03-07 can start after Phase 2C complete (Products, BOMs, Routings available)
7. Return to Epic 02.10b after Epic 05 complete (License Plates available)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial analysis - Epic 02 MVP dependency assessment | TECH-WRITER |
