# Phase 2 Roadmap - Zamkniecie Luk Konkurencyjnych

**Version:** 2.0
**Date:** 2025-12-09
**Author:** PM-Agent (John)
**Status:** PLANNED

---

## Executive Summary

Phase 2 ma na celu zamkniecie krytycznych luk konkurencyjnych zidentyfikowanych w Feature Gap Analysis. Po zakonczeniu Phase 2 MonoPilot osiagnie **parytet funkcjonalny** z konkurentami (AVEVA, Plex, Aptean, CSB) w obszarach kluczowych dla przemyslu spozywczego.

**Kluczowe metryki Phase 2:**
- **Nowych epicow:** 6 (Quality, Catch Weight, GS1 FULL, Shipping, Finance, Supplier QM)
- **Total stories:** ~161
- **Estimated effort:** 44-50 tygodni (10-12 miesiecy)
- **Target completion:** Q3-Q4 2025

**Kluczowe decyzje:**
- **Quality Module:** Pozostaje w Phase 2 (nie Phase 1)
- **GS1 Barcode:** FULL scope (GTIN + GS1-128 + SSCC + DataMatrix + GS1 Digital Link) - 10 tygodni
- **Catch Weight:** Wczesnie w Phase 2 (po Quality) - dla klientow meat/fish
- **Finance Basics & Supplier Quality:** Dodane do Phase 2

---

## 1. Phase 2 Epics Overview

| Order | Epic | Nazwa | Stories | Priority | Effort | ROI Score |
|-------|------|-------|---------|----------|--------|-----------|
| 1 | 6 | Quality Enhanced | 33 | P1 | 10-12 tyg | 9.25 |
| 2 | 11 | Catch Weight | 22 | P1 | 6 tyg | 7.75 |
| 3 | 10 | GS1 & Barcodes (FULL) | 34 | P1 | 10 tyg | 8.50 |
| 4 | 7 | Shipping Enhanced | 39 | P1 | 10-12 tyg | 8.75 |
| 5 | 12 | Finance Basics | ~18 | P1 | 4-6 tyg | 7.00 |
| 6 | 14 | Supplier Quality | ~15 | P1 | 4 tyg | 6.50 |

**Total Phase 2 Stories:** ~161
**Total Phase 2 Effort:** 44-50 tygodni

---

## 2. Execution Order & Rationale

### 2.1 Priority Order (Updated)

| Order | Epic | Rationale | Dependencies |
|-------|------|-----------|--------------|
| 1 | Epic 6: Quality | Highest ROI (9.25), regulatory requirement, blocks shipping | Epic 5 (92% done) |
| 2 | Epic 11: Catch Weight | Meat/fish customers need it EARLY, builds on Epic 5/6 | Epic 2, 5 |
| 3 | Epic 10: GS1 (FULL) | FULL scope - 10 tyg, enables retail compliance, needed for labels | Epic 2, 5 |
| 4 | Epic 7: Shipping | High ROI (8.75), needs Epic 6 + Epic 10 for labels | Epic 5, 6, 10 |
| 5 | Epic 12: Finance | Cost tracking, margin - can parallel with late Shipping | Epic 3, 4 |
| 6 | Epic 14: Supplier QM | Basics for SQM - can parallel with Finance | Epic 3 |

### 2.2 Timeline (10-12 month plan)

```
Week   1-4    5-8    9-12   13-16   17-20   21-24   25-28   29-32   33-36   37-40   41-44   45-48
       |------|------|------|-------|-------|-------|-------|-------|-------|-------|-------|------|
       [================ Epic 6: Quality (10-12 weeks) ================]
              [======== Epic 11: Catch Weight (6 weeks) ========]
                            [=============== Epic 10: GS1 FULL (10 weeks) ===============]
                                          [================ Epic 7: Shipping (10-12 weeks) ================]
                                                                  [==== Epic 12: Finance (4-6 weeks) ====]
                                                                        [== Epic 14: SQM (4 weeks) ==]
```

### 2.3 Parallel Execution Strategy

| Team | Epics | Focus | Weeks |
|------|-------|-------|-------|
| **Team A** (Backend Core) | Epic 6, Epic 7 | Quality + Shipping backend | 1-36 |
| **Team B** (Domain Specialist) | Epic 10, Epic 11 | GS1 Full, Catch Weight logic | 5-28 |
| **Team C** (Finance/Supplier) | Epic 12, Epic 14 | Finance Basics, SQM | 29-48 |
| **Team D** (Frontend) | All | UI/UX dla wszystkich | 1-48 |

---

## 3. Luki Konkurencyjne Zamykane

### 3.1 Wszystkie Zamykane Luki (4/4 Konkurentow)

| Luka | Epic | Status Before | Status After |
|------|------|---------------|--------------|
| **HACCP/CCP Support** | Epic 6 | Partial | Full |
| **Quality Specifications** | Epic 6 | Partial | Full |
| **NCR Workflow (CAPA)** | Epic 6 | Planned | Full |
| **CoA Management** | Epic 6 | Planned | Full |
| **Catch Weight** | Epic 11 | Not planned | Full |
| **GS1 Barcode Standards (FULL)** | Epic 10 | Partial | Full |
| **GS1 DataMatrix** | Epic 10 | None | Full |
| **GS1 Digital Link** | Epic 10 | None | Full |
| **Shelf Life + FEFO** | Epic 7 | Partial | Full |
| **Shipping Labels & Tracking** | Epic 7 | Blocked | Full |
| **Cost Tracking** | Epic 12 | None | Basic |
| **Supplier Rating** | Epic 14 | None | Basic |

### 3.2 Feature Coverage After Phase 2

```
Before Phase 2:
Food-Specific  |||||||--- 75%
GS1 Compliance |--------- 10%
Catch Weight   ---------- 0%

After Phase 2:
Food-Specific  ||||||||| 95%
GS1 Compliance ||||||||| 100%
Catch Weight   ||||||||| 100%
```

---

## 4. Epic Details

### 4.1 Epic 6: Quality Enhanced (10-12 tygodni) - ORDER 1

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

### 4.2 Epic 11: Catch Weight (6 tygodni) - ORDER 2 (EARLY)

**Goal:** Obsluga produktow o zmiennej wadze dla klientow meat/fish

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
- Epic 6 (Quality) - QA with weight

**Rationale for EARLY placement:**
- Meat/fish customers are key target segment
- Builds naturally on Warehouse (LP)
- Can run parallel with late Quality work
- Enables better Shipping stories later

**Risks:**
- User compliance (weight entry) (mitigate: required fields)
- Complex pricing logic (mitigate: clear documentation)

---

### 4.3 Epic 10: GS1 & Barcodes - FULL SCOPE (10 tygodni) - ORDER 3

**Goal:** FULL implementacja standardow GS1 dla sieci handlowych

**FULL Scope Includes:**
1. **GTIN-13/14** - Product identification
2. **GS1-128** - Shipping labels with AI support
3. **SSCC** - Serial Shipping Container Code
4. **GS1 DataMatrix** - 2D barcodes with lot/expiry
5. **GS1 Digital Link** - URL-based product info

**Key Features:**
- GTIN-13/14 support na produktach
- GTIN validation i check digit calculation
- SSCC generation dla wysylek
- GS1-128 barcode generation (all AIs)
- GS1 DataMatrix generation
- GS1 Digital Link URLs
- GS1 barcode parser dla skanowania
- Label templates z GS1
- GS1 settings (company prefix)
- Batch/Lot + Expiry in barcodes

**Stories Breakdown (Extended for FULL scope):**
| Category | Stories | Must Have |
|----------|---------|-----------|
| GTIN | 4 | 4 |
| GS1-128/SSCC | 5 | 4 |
| DataMatrix | 4 | 3 |
| GS1 Digital Link | 4 | 2 |
| Scanning/Parsing | 4 | 3 |
| Configuration | 3 | 3 |
| Templates | 5 | 2 |
| Integration | 3 | 2 |
| Reports | 2 | 0 |
| **Total** | **34** | **23** |

**Dependencies:**
- Epic 2 (Technical) - Products table
- Epic 5 (Warehouse) - LP labels
- BUG-001/002 fix - Print integration

**Technical Notes:**
- Library: bwip-js for barcode generation
- GS1 AI (Application Identifier) full support
- Resolver for GS1 Digital Link

**Risks:**
- Printer compatibility (mitigate: test early with Zebra)
- Customer-specific GS1 requirements (mitigate: templates)
- Digital Link infrastructure (mitigate: use cloud resolver)

---

### 4.4 Epic 7: Shipping Enhanced (10-12 tygodni) - ORDER 4

**Goal:** Pelny modul logistyki wychodzacej z FEFO picking

**Key Features:**
- Sales Order management
- FEFO/FIFO picking strategies
- Pick list optimization i grouping
- Pick assignment i short handling
- Pack station workflow
- Package tracking
- Carrier configuration
- Shipping documents (pick list, packing slip, GS1 labels)
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
| **Total** | **39** | **21** |

**Dependencies:**
- Epic 5 (Warehouse) - LP, stock
- Epic 6 (Quality) - QA status validation
- Epic 10 (GS1) - GS1-128/SSCC labels

**Risks:**
- Print integration (BUG-001/002 must be fixed)
- FEFO complexity (mitigate: start with basic, iterate)

---

### 4.5 Epic 12: Finance Basics (4-6 tygodni) - ORDER 5

**Goal:** Podstawowe sledzenie kosztow i marzy

**Key Features:**
- Product costing (material, labor, overhead)
- WO actual vs standard cost
- Margin analysis per product
- Cost variance reports
- Simple P&L by product line
- PO cost tracking

**Stories Breakdown:**
| Category | Stories | Must Have |
|----------|---------|-----------|
| Product Costing | 4 | 3 |
| WO Costing | 4 | 3 |
| Margin Analysis | 3 | 2 |
| Reports | 4 | 1 |
| Settings | 3 | 1 |
| **Total** | **~18** | **~10** |

**Dependencies:**
- Epic 3 (Planning) - PO costs
- Epic 4 (Production) - WO consumption

**Notes:**
- NOT full accounting - just MES cost tracking
- Prepare for integration with external accounting

---

### 4.6 Epic 14: Supplier Quality Basics (4 tygodni) - ORDER 6

**Goal:** Podstawowe zarzadzanie jakoscia dostawcow

**Key Features:**
- Supplier quality rating (A/B/C/D)
- Incoming quality inspection checklist
- Supplier NCR tracking
- Supplier document management
- Approved supplier list (ASL)

**Stories Breakdown:**
| Category | Stories | Must Have |
|----------|---------|-----------|
| Rating System | 3 | 2 |
| Incoming QC | 4 | 2 |
| Supplier NCR | 3 | 2 |
| Documents | 3 | 1 |
| ASL | 2 | 1 |
| **Total** | **~15** | **~8** |

**Dependencies:**
- Epic 3 (Planning) - Suppliers table
- Epic 6 (Quality) - NCR workflow

---

## 5. Success Criteria for Phase 2

### 5.1 Functional Criteria

| Epic | Success Criteria |
|------|-----------------|
| Epic 6 | QA workflow complete, CCP monitoring working, NCR CAPA implemented |
| Epic 11 | Catch weight products configurable, weight recorded throughout |
| Epic 10 | GTIN/SSCC/DataMatrix/Digital Link working, GS1-128 labels printing, scanner parsing |
| Epic 7 | SO-to-ship workflow complete, FEFO picking working, documents printing |
| Epic 12 | Product costing setup, WO cost tracking, margin reports |
| Epic 14 | Supplier rating working, incoming QC, supplier NCR |

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
| GS1 Compliance | 100% (GTIN, GS1-128, SSCC, DataMatrix, Digital Link) |
| Customer Enablement | Support meat/fish customers with Catch Weight |
| Retail Readiness | GS1 compliance for Tesco/Biedronka suppliers |
| Regulatory | HACCP audit-ready |

---

## 6. Milestones

| Milestone | Week | Deliverables |
|-----------|------|--------------|
| **M1: Quality MVP** | 6 | QA status, CCP basic, NCR workflow |
| **M2: Quality Complete** | 12 | Full Epic 6 done |
| **M3: Catch Weight** | 18 | Epic 11 complete, meat/fish ready |
| **M4: GS1 Basic** | 22 | GTIN, GS1-128, SSCC |
| **M5: GS1 Full** | 28 | DataMatrix, Digital Link complete |
| **M6: Shipping MVP** | 34 | SO, FEFO pick, documents |
| **M7: Shipping Complete** | 40 | Full Epic 7 done |
| **M8: Finance & SQM** | 48 | Epics 12, 14 complete |
| **M9: Phase 2 Complete** | 50 | All epics done, tested, documented |

---

## 7. Resource Requirements

### 7.1 Team Composition

| Role | FTE | Responsibility |
|------|-----|----------------|
| **Backend Dev (Core)** | 2 | Quality, Shipping APIs |
| **Backend Dev (Domain)** | 1 | GS1, Catch Weight logic |
| **Frontend Dev** | 1.5 | UI components, scanner |
| **QA Engineer** | 0.5 | Testing, automation |
| **PM** | 0.5 | Coordination, stories |

### 7.2 Infrastructure

| Item | Notes |
|------|-------|
| Print Integration | BUG-001/002 must be fixed FIRST |
| Supabase | Storage for CoA documents |
| Barcode Library | bwip-js (GS1 support) |
| GS1 Digital Link | Cloud resolver or self-hosted |
| Scale Integration | API ready for Phase 2/3 |

---

## 8. Dependencies on Phase 1

### 8.1 Must Complete Before Phase 2

| Item | Status | Blocking |
|------|--------|----------|
| BUG-001: Print Integration | OPEN | Epic 7, Epic 10 |
| BUG-002: Print API | OPEN | Epic 7, Epic 10 |
| BUG-003: GRN LP Navigation | FIXED | Epic 6 |
| BUG-004: Scanner PO Barcode | FIXED | Epic 7 |
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
| GS1 FULL scope complexity | Medium | Medium | 10-week timeline, incremental delivery |
| Catch weight user adoption | Medium | Medium | Required fields, validation |
| Scope creep (customer requests) | Medium | Medium | Stick to MoSCoW prioritization |
| Team capacity | Medium | High | Parallel execution, clear priorities |
| GS1 customer-specific needs | Medium | Medium | Template-based approach |
| HACCP regulatory complexity | Medium | Medium | Start simple, iterate |

---

## 10. Phase 2 to Phase 3 Handoff

### 10.1 What Moves to Phase 3

| Feature | Reason | Phase 3 Epic |
|---------|--------|--------------|
| NPD Module | New Product Development workflow | Epic 8 |
| Real-time OEE | Complex, needs Phase 2 foundation | Epic 9 |
| Advanced MRP | Full MRP, capacity planning | Epic 13 |
| AI/ML Features | End of Phase 3 (per decision) | Epic 15 |
| Digital Twin | End of Phase 3 (per decision) | Epic 16 |
| Multi-Site Support | Enterprise feature | Phase 4 (Epic 19) |
| EDI Integration | Retail chains, Phase 2 prepares | Phase 4 |

### 10.2 Phase 3 Preview

| Order | Epic | Name | Estimated Effort |
|-------|------|------|------------------|
| 1 | 8 | NPD (New Product Development) | 8 tyg |
| 2 | 9 | OEE & Performance | 8 tyg |
| 3 | 13 | Advanced Planning/MRP | 10 tyg |
| 4 | 15 | AI & ML (END) | 12 tyg |
| 5 | 16 | Digital Twin (END) | 10 tyg |

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
| Epic 11 | 0 | 6 | 12 | 2 | 2 | ~55 |
| Epic 10 | 0 | 8 | 14 | 8 | 4 | ~90 |
| Epic 7 | 0 | 8 | 18 | 10 | 3 | ~110 |
| Epic 12 | 0 | 5 | 8 | 4 | 1 | ~45 |
| Epic 14 | 0 | 4 | 8 | 2 | 1 | ~35 |
| **Total** | **0** | **41** | **75** | **32** | **13** | **~420** |

### 11.3 Velocity Assumption

- Team velocity: ~30-40 points/sprint (2 weeks)
- Phase 2 sprints: 22-25 sprints (44-50 weeks)
- Buffer: 20% for bugs, reviews, unexpected

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Phase 2 Roadmap |
| 2.0 | 2025-12-09 | PM-Agent | GS1 FULL scope (10 tyg), Catch Weight early, Finance + Supplier QM added |

---

**Document End**

**Next Steps:**
1. Fix Phase 1 blockers (BUG-001/002/003/004/005)
2. Finalize team allocation
3. Start Epic 6 sprint planning
4. Setup GS1 library integration (bwip-js)
5. Plan Catch Weight pilot with meat/fish customer
6. Schedule stakeholder review of roadmap
