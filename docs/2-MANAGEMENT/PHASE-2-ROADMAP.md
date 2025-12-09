# Phase 2 Roadmap - Zamkniecie Luk Konkurencyjnych

**Version:** 1.0
**Date:** 2025-12-09
**Author:** PM-Agent (John)
**Status:** PLANNED

---

## Executive Summary

Phase 2 ma na celu zamkniecie krytycznych luk konkurencyjnych zidentyfikowanych w Feature Gap Analysis. Po zakonczeniu Phase 2 MonoPilot osiagnie **parytet funkcjonalny** z konkurentami (AVEVA, Plex, Aptean, CSB) w obszarach kluczowych dla przemyslu spozywczego.

**Kluczowe metryki Phase 2:**
- **Nowych epicow:** 4 (Quality Enhanced, Shipping Enhanced, GS1, Catch Weight)
- **Total stories:** ~118
- **Estimated effort:** 6-8 miesiecy
- **Target completion:** Q2-Q3 2025

---

## 1. Phase 2 Epics Overview

| Epic | Nazwa | Stories | Priority | Effort | ROI Score |
|------|-------|---------|----------|--------|-----------|
| 6 | Quality Enhanced | 33 | P1 | 10-12 tyg | 9.25 |
| 7 | Shipping Enhanced | 39 | P1 | 10-12 tyg | 8.75 |
| 10 | GS1 & Barcodes | 24 | P1 | 6-8 tyg | 8.50 |
| 11 | Catch Weight | 22 | P1 | 6 tyg | 7.75 |

**Total Phase 2 Stories:** 118

---

## 2. Luki Konkurencyjne Zamykane

### 2.1 Wszystkie Zamykane Luki (4/4 Konkurentow)

| Luka | Epic | Status Before | Status After |
|------|------|---------------|--------------|
| **HACCP/CCP Support** | Epic 6 | Partial | Full |
| **Quality Specifications** | Epic 6 | Partial | Full |
| **NCR Workflow (CAPA)** | Epic 6 | Planned | Full |
| **CoA Management** | Epic 6 | Planned | Full |
| **Shelf Life + FEFO** | Epic 7 | Partial | Full |
| **Shipping Labels & Tracking** | Epic 7 | Blocked | Full |
| **GS1 Barcode Standards** | Epic 10 | Partial | Full |
| **Catch Weight Support** | Epic 11 | Not planned | Full |

### 2.2 Feature Coverage After Phase 2

```
Before Phase 2:
Food-Specific  ███████░░░ 75%

After Phase 2:
Food-Specific  █████████░ 95%
```

---

## 3. Recommended Execution Order

### 3.1 Priority Order (ROI-based)

| Order | Epic | Rationale | Dependencies |
|-------|------|-----------|--------------|
| 1 | Epic 6: Quality | Highest ROI (9.25), regulatory requirement | Epic 5 (92% done) |
| 2 | Epic 10: GS1 | High ROI (8.50), enables Epic 7 labels | Epic 2 |
| 3 | Epic 7: Shipping | High ROI (8.75), needs Epic 6 + Epic 10 | Epic 5, 6, 10 |
| 4 | Epic 11: Catch Weight | Important (7.75), can parallel with Epic 7 | Epic 2, 5 |

### 3.2 Timeline (6-month plan)

```
Month 1    Month 2    Month 3    Month 4    Month 5    Month 6
|----------|----------|----------|----------|----------|----------|
[========= Epic 6: Quality (10-12 weeks) =========]
      [=== Epic 10: GS1 (6-8 weeks) ===]
                  [========= Epic 7: Shipping (10-12 weeks) =========]
                        [==== Epic 11: Catch Weight (6 weeks) ====]
```

### 3.3 Team Allocation (Parallel Execution)

| Team | Epics | Focus |
|------|-------|-------|
| **Team A** (Backend) | Epic 6, Epic 7 | Quality + Shipping backend |
| **Team B** (Domain) | Epic 10, Epic 11 | GS1, Catch Weight logic |
| **Team C** (Frontend) | All | UI/UX dla wszystkich |

---

## 4. Epic Details

### 4.1 Epic 6: Quality Enhanced (10-12 tygodni)

**Goal:** Pelny modul kontroli jakosci z HACCP/CCP support

**Key Features:**
- QA status management (pending, passed, failed, quarantine)
- HACCP/CCP definition per routing
- CCP monitoring during production
- CCP deviation alerts
- Product specifications z tolerancjami
- Test results recording
- NCR workflow z CAPA
- CoA management
- Quality dashboard i KPIs

**Stories Breakdown:**
| Category | Stories | Must Have |
|----------|---------|-----------|
| QA Status | 4 | 4 |
| HACCP/CCP | 4 | 3 |
| Specifications | 3 | 1 |
| Test Results | 3 | 1 |
| NCR | 6 | 5 |
| CoA | 4 | 0 |
| Dashboard | 4 | 1 |
| Settings | 1 | 1 |
| Scanner | 3 | 0 |
| Audit | 1 | 1 |
| **Total** | **33** | **17** |

**Dependencies:**
- Epic 5 (Warehouse) - LP table, qa_status field
- Epic 2 (Technical) - Products, routings

**Risks:**
- HACCP complexity (mitigate: start simple)
- User adoption for CCP monitoring (mitigate: training, scanner workflow)

---

### 4.2 Epic 7: Shipping Enhanced (10-12 tygodni)

**Goal:** Pelny modul logistyki wychodzacej z FEFO picking

**Key Features:**
- Sales Order management
- FEFO/FIFO picking strategies
- Pick list optimization i grouping
- Pick assignment i short handling
- Pack station workflow
- Package tracking
- Carrier configuration
- Shipping documents (pick list, packing slip, labels)
- Scanner picking/packing workflows
- Shipping reports

**Stories Breakdown:**
| Category | Stories | Must Have |
|----------|---------|-----------|
| Sales Order | 5 | 4 |
| FEFO Picking | 4 | 3 |
| Pick Optimization | 5 | 2 |
| Packing | 5 | 0 |
| Carrier | 4 | 2 |
| Documents | 5 | 4 |
| Scanner Picking | 5 | 4 |
| Scanner Packing | 2 | 0 |
| Reports | 3 | 1 |
| Settings | 1 | 1 |
| **Total** | **39** | **19** |

**Dependencies:**
- Epic 5 (Warehouse) - LP, stock
- Epic 6 (Quality) - QA status validation
- Epic 10 (GS1) - GS1-128 labels

**Risks:**
- Print integration (BUG-001/002 must be fixed)
- FEFO complexity (mitigate: start with basic, iterate)

---

### 4.3 Epic 10: GS1 & Barcodes (6-8 tygodni)

**Goal:** Implementacja standardow GS1 dla sieci handlowych

**Key Features:**
- GTIN-13/14 support na produktach
- GTIN validation i check digit calculation
- SSCC generation dla wysylek
- GS1-128 barcode generation
- GS1 DataMatrix (optional)
- GS1 barcode parser dla skanowania
- Label templates z GS1
- GS1 settings (company prefix)

**Stories Breakdown:**
| Category | Stories | Must Have |
|----------|---------|-----------|
| GTIN | 4 | 4 |
| GS1-128/SSCC | 3 | 2 |
| DataMatrix | 2 | 0 |
| Scanning/Parsing | 2 | 2 |
| Configuration | 2 | 2 |
| Templates | 4 | 0 |
| Integration | 2 | 1 |
| Reports | 2 | 0 |
| Advanced | 3 | 0 |
| **Total** | **24** | **10** |

**Dependencies:**
- Epic 2 (Technical) - Products table
- Epic 5 (Warehouse) - LP labels
- BUG-001/002 fix - Print integration

**Risks:**
- Printer compatibility (mitigate: test early)
- Customer-specific GS1 requirements (mitigate: templates)

---

### 4.4 Epic 11: Catch Weight (6 tygodni)

**Goal:** Obsluga produktow o zmiennej wadze

**Key Features:**
- Catch weight product configuration
- Weight recording at receive
- Weight recording in production
- Weight in shipping (SO, pick, pack)
- Catch weight pricing (per kg vs per unit)
- Weight tolerance validation
- Inventory by weight reports
- Weight variance analysis
- Scale integration ready (API)

**Stories Breakdown:**
| Category | Stories | Must Have |
|----------|---------|-----------|
| Product Config | 3 | 2 |
| Receive | 3 | 2 |
| Production | 4 | 2 |
| Shipping | 4 | 2 |
| Reports | 2 | 0 |
| Validation | 2 | 1 |
| Settings | 2 | 2 |
| Labels | 2 | 0 |
| **Total** | **22** | **11** |

**Dependencies:**
- Epic 2 (Technical) - Products
- Epic 4 (Production) - WO, materials
- Epic 5 (Warehouse) - LP, GRN
- Epic 7 (Shipping) - SO, pick

**Risks:**
- User compliance (weight entry) (mitigate: required fields)
- Complex pricing logic (mitigate: clear documentation)

---

## 5. Success Criteria for Phase 2

### 5.1 Functional Criteria

| Epic | Success Criteria |
|------|-----------------|
| Epic 6 | QA workflow complete, CCP monitoring working, NCR CAPA implemented |
| Epic 7 | SO-to-ship workflow complete, FEFO picking working, documents printing |
| Epic 10 | GTIN/SSCC working, GS1-128 labels printing, scanner parsing |
| Epic 11 | Catch weight products configurable, weight recorded throughout |

### 5.2 Quality Criteria

| Metric | Target |
|--------|--------|
| Test Coverage | >70% |
| Bug Severity | No P0/P1 bugs at release |
| Performance | Page load <2s (P95) |
| Usability | Scanner workflows <30s per action |

### 5.3 Business Criteria

| Metric | Target |
|--------|--------|
| Feature Parity | 95% vs competitors (food-specific) |
| Customer Enablement | Support 100+ employee companies |
| Retail Readiness | GS1 compliance for Tesco/Biedronka suppliers |
| Regulatory | HACCP audit-ready |

---

## 6. Milestones

| Milestone | Date | Deliverables |
|-----------|------|--------------|
| **M1: Quality MVP** | Week 6 | QA status, CCP basic, NCR workflow |
| **M2: GS1 Basic** | Week 8 | GTIN, SSCC, GS1-128 labels |
| **M3: Shipping MVP** | Week 12 | SO, FEFO pick, documents |
| **M4: Catch Weight** | Week 16 | CW config, receive, ship |
| **M5: Phase 2 Complete** | Week 24 | All epics done, tested, documented |

---

## 7. Resource Requirements

### 7.1 Team Composition

| Role | FTE | Responsibility |
|------|-----|----------------|
| **Backend Dev** | 2 | API, services, database |
| **Frontend Dev** | 1-2 | UI components, scanner |
| **QA Engineer** | 0.5 | Testing, automation |
| **PM** | 0.5 | Coordination, stories |

### 7.2 Infrastructure

| Item | Notes |
|------|-------|
| Print Integration | BUG-001/002 must be fixed first |
| Supabase | Storage for CoA documents |
| Barcode Library | bwip-js or jsbarcode |

---

## 8. Dependencies on Phase 1

### 8.1 Must Complete Before Phase 2

| Item | Status | Blocking |
|------|--------|----------|
| BUG-001: Print Integration | OPEN | Epic 7, Epic 10 |
| BUG-002: Print API | OPEN | Epic 7, Epic 10 |
| BUG-003: GRN LP Navigation | OPEN | Epic 6 |
| BUG-004: Scanner PO Barcode | OPEN | Epic 7 |
| BUG-005: Warehouse Settings UI | OPEN | Epic 6 |

### 8.2 Recommended Before Phase 2

| Item | Status | Nice to Have |
|------|--------|--------------|
| DEBT-002: RLS Audit | PENDING | Security |
| DEBT-001: Performance | PENDING | Scalability |
| Test Coverage >70% | PARTIAL | Stability |

---

## 9. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Print integration delays | High | High | Fix BUG-001/002 first, before Phase 2 |
| Scope creep (customer requests) | Medium | Medium | Stick to MoSCoW prioritization |
| Team capacity | Medium | High | Parallel execution, clear priorities |
| GS1 customer-specific needs | Medium | Medium | Template-based approach |
| HACCP regulatory complexity | Medium | Medium | Start simple, iterate |

---

## 10. Phase 2 to Phase 3 Handoff

### 10.1 What Moves to Phase 3

| Feature | Reason | Phase 3 Epic |
|---------|--------|--------------|
| Real-time OEE | Complex, needs Phase 2 foundation | Epic 9 |
| Multi-Site Support | Enterprise feature | New Epic |
| Advanced Scheduling | Complex, needs demand data | New Epic |
| EDI Integration | Retail chains, Phase 2 prepares | New Epic |
| NPD Module | Lower priority | Epic 8 |
| AI/ML Features | Differentiation, not parity | Phase 4+ |

### 10.2 Phase 3 Preview

| Epic | Name | Estimated Effort |
|------|------|------------------|
| 8 | NPD (New Product Development) | 8 tyg |
| 9 | Performance & OEE | 10 tyg |
| 12 | Multi-Site | 12 tyg |
| 13 | Advanced Scheduling | 10 tyg |
| 14 | EDI Integration | 6 tyg |

---

## 11. Appendix: Story Points Summary

### 11.1 Estimate Legend

| Size | Points | Hours | Examples |
|------|--------|-------|----------|
| XS | 1 | 2-4h | Config field, simple UI change |
| S | 2 | 4-8h | Simple CRUD, one component |
| M | 3 | 8-16h | Feature with UI + API |
| L | 5 | 16-32h | Complex feature, multi-component |
| XL | 8 | 32-48h | Major feature, integration |

### 11.2 Phase 2 Story Points

| Epic | XS | S | M | L | XL | Total Points |
|------|----|----|----|----|-----|--------------|
| Epic 6 | 0 | 10 | 15 | 6 | 2 | ~85 |
| Epic 7 | 0 | 8 | 18 | 10 | 3 | ~110 |
| Epic 10 | 0 | 8 | 10 | 4 | 2 | ~60 |
| Epic 11 | 0 | 6 | 12 | 2 | 2 | ~55 |
| **Total** | **0** | **32** | **55** | **22** | **9** | **~310** |

### 11.3 Velocity Assumption

- Team velocity: ~30-40 points/sprint (2 weeks)
- Phase 2 sprints: 12-16 sprints
- Buffer: 20% for bugs, reviews, unexpected

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Phase 2 Roadmap |

---

**Document End**

**Next Steps:**
1. Fix Phase 1 blockers (BUG-001/002/003/004/005)
2. Finalize team allocation
3. Start Epic 6 sprint planning
4. Setup GS1 library integration (bwip-js)
5. Schedule stakeholder review of roadmap
