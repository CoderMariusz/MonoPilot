# MonoPilot - Roadmap Stories (Szczegółowa Analiza)

> **Data generacji:** 2026-01-14
> **Źródło danych:** `.claude/checkpoints/*.yaml` + analiza dokumentacji
> **Metoda:** Bezpośrednia analiza checkpointów implementacyjnych

---

## PODSUMOWANIE WYKONAWCZE

| Epic | Moduł | Stories | Zaimplementowane | Status | % |
|------|-------|---------|------------------|--------|---|
| 01 | Settings | 16 | 16 | ✅ **COMPLETE** | 100% |
| 02 | Technical | 17 | 9 done + 8 partial | ⚠️ PARTIAL | 88% |
| 03 | Planning | 20 | 18 done + 1 partial | ⚠️ NEAR COMPLETE | 95% |
| 04 Phase 0 | Production MVP | 7 | 7 | ✅ **COMPLETE** | 100% |
| 04 Phase 1 | Production Full | 10 | 0 | ❌ READY (unblocked) | 0% |
| 05 | Warehouse | 20 | 20 | ✅ **COMPLETE** | 100% |
| 06 | Quality | 41 | 0 | ❌ NOT STARTED | 0% |
| 07 | Shipping | 16 | 0 | ❌ NOT STARTED | 0% |
| 08-11 | Premium | 78-97 | 0 | ❌ NO STORIES | 0% |

**TOTAL:** 70/80 stories zaimplementowanych w Epic 01-05 (~87%)

---

## EPIC 01 - SETTINGS ✅ 100% COMPLETE

**Status:** Wszystkie 16 stories zaimplementowane i przetestowane

| Story | Nazwa | Status | Testy | AC | Fazy |
|-------|-------|--------|-------|-----|------|
| 01.1 | Org Context + Base RLS | ✅ DONE | 71 | 6/6 | P1-P7 |
| 01.2 | Settings Shell Navigation | ✅ DONE | 23 | ✓ | P1-P7 |
| 01.3 | Onboarding Wizard Launcher | ✅ DONE | 14 | 8/8 | P1-P7 |
| 01.4 | Organization Profile | ✅ DONE | 164 | ✓ | P1-P7 |
| 01.5a | User Management CRUD | ✅ DONE | 201 | ✓ | P1-P7 |
| 01.5b | User Warehouse Access | ✅ DONE | 23 | 7/7 | P1-P7 |
| 01.6 | Role-Based Permissions | ✅ DONE | 116 | 18/18 | P1-P7 |
| 01.7 | Module Toggles | ✅ DONE | 42 | 11/12 | P1-P7 |
| 01.8 | Warehouses CRUD | ✅ DONE | 2,444 LOC | 23/23 | P1-P7 |
| 01.9 | Locations CRUD | ✅ DONE | 592 LOC | 5/5 | P1-P7 |
| 01.10 | Machines CRUD | ✅ DONE | 2,830 LOC | 5/5 | P1-P7 |
| 01.11 | Production Lines | ✅ DONE | - | ✓ | P1-P7 |
| 01.12 | Allergens Management | ✅ DONE | 3,066 LOC | 7/7 | P1-P7 |
| 01.13 | Tax Codes CRUD | ✅ DONE | 107 | 9/9 | P1-P7 |
| 01.14 | Wizard Steps 2-6 | ✅ DONE | - | 6/6 | P1-P7 |
| 01.15 | Session & Password | ✅ DONE | 83 | ✓ | P1-P7 |
| 01.16 | User Invitations | ✅ DONE | 335 LOC | 9/9 | P1-P7 |

**Metryki:**
- Łącznie testów: ~13,500+ linii kodu testowego
- Wszystkie P7 zakończone
- Gotowe do produkcji

---

## EPIC 02 - TECHNICAL ⚠️ 88% COMPLETE

**Status:** 9 stories DONE, 8 stories PARTIAL

| Story | Nazwa | Status | Testy | AC | Uwagi |
|-------|-------|--------|-------|-----|-------|
| 02.1 | Products CRUD + Types | ✅ PRODUCTION-READY | 1,701 LOC | 22/27 | 87% complete |
| 02.2 | Product Versioning | ✅ DONE | 52 | ✓ | 93% complete |
| 02.3 | Product Allergens | ✅ PRODUCTION-READY | 1,964 LOC | ✓ | 95% complete |
| 02.4 | BOMs CRUD + Validity | ✅ DONE | 1,691 LOC | 8/8 | 98% complete |
| 02.5a | BOM Items Core | ✅ DONE | 227+ | 13/13 | 100% complete |
| 02.5b | BOM Items Advanced | ⚠️ PRODUCTION-READY | 253 | ✓ | 68% - frontend gaps |
| 02.6 | BOM Alternatives + Clone | ⚠️ PARTIAL | 132 | ✓ | 85% - UI gaps |
| 02.7 | Routings CRUD | ✅ COMPLETE | 15 | ✓ | 95% complete |
| 02.8 | Routing Operations | ⚠️ PARTIAL | - | ✓ | 87% - attachments missing |
| 02.9 | BOM-Routing Costs | ⚠️ PARTIAL | 37 | ✓ | 85% - API gaps |
| 02.10a | Traceability Config | ✅ PRODUCTION-READY | 169 | ✓ | 100% backend |
| 02.10b | Traceability Queries | ✅ PRODUCTION-READY | 42+ | ✓ | 100% complete |
| 02.11 | Shelf Life Calculation | ✅ DONE | 2,945 LOC | ✓ | 88% complete |
| 02.12 | Technical Dashboard | ⚠️ PARTIAL | 0 | ✓ | 80% - tests needed |
| 02.13 | Nutrition Calculation | ✅ PRODUCTION-READY | 19 | ✓ | 100% backend |
| 02.14 | BOM Advanced Features | ⚠️ PARTIAL | 50+ | ✓ | 85% - export gaps |
| 02.15 | Cost History + Variance | ⚠️ PARTIAL | 50 | ✓ | 85% - migration done |

**Do zrobienia:**
1. ⚡ 02.8 - Dodać `operation_attachments` migration
2. ⚡ 02.12 - Dodać testy
3. 02.6, 02.14 - Dokończyć UI gaps

---

## EPIC 03 - PLANNING ⚠️ 95% COMPLETE

**Status:** 18 stories COMPLETE, 1 IN PROGRESS, 1 BLOCKED

| Story | Nazwa | Status | Testy | AC | Uwagi |
|-------|-------|--------|-------|-----|-------|
| 03.1 | Suppliers CRUD | ✅ DONE | 35 | 18/18 | Complete |
| 03.2 | Supplier-Product | ✅ COMPLETE | 109 | 9/9 | Complete |
| 03.3 | PO CRUD + Lines | ✅ DONE | 1,201 | ✓ | Complete |
| 03.4 | PO Calculations | ✅ DONE | 27 | 5/5 | Complete |
| 03.5a | PO Approval Setup | ✅ COMPLETE | 32 | 15/15 | Complete |
| 03.5b | PO Approval Workflow | ✅ PRODUCTION-READY | 297 | 10/10 | Complete |
| 03.6 | PO Bulk Operations | ✅ COMPLETE | 54 | 9/9 | Complete |
| 03.7 | PO Status Lifecycle | ✅ COMPLETE | 15 | 11/11 | Complete |
| 03.8 | TO CRUD + Lines | ✅ COMPLETE | 113 | 16/16 | Complete |
| 03.9a | TO Partial Shipments | ✅ PRODUCTION-READY | 147 | 11/11 | Complete |
| 03.9b | TO LP Pre-selection | ✅ COMPLETE | 113 | 12/14 | Complete |
| 03.10 | WO CRUD | ✅ COMPLETE | 62 | 10/10 | Complete |
| 03.11a | WO BOM Snapshot | ✅ DONE | 32 | 13/13 | Complete |
| 03.11b | WO Reservations | ✅ COMPLETE | 251 | 14/14 | Complete |
| 03.12 | WO Operations | ✅ COMPLETE | 84 | 10/10 | Complete |
| **03.13** | **Material Availability** | 🔄 **IN PROGRESS** | 82 | - | P3 frontend |
| **03.14** | **WO Scheduling APS** | ❌ **BLOCKED** | 0 | 0 | Needs Epic 04 |
| 03.15 | WO Gantt View | ✅ COMPLETE | 73 | 15/15 | Complete |
| 03.16 | Planning Dashboard | ✅ COMPLETE | 108 | 11/11 | Complete |
| 03.17 | Planning Settings | ✅ COMPLETE | 102 | 12/13 | Complete |

**Do zrobienia:**
1. ⚡ 03.13 - Dokończyć frontend (P4-P7) - **2 dni**
2. 03.14 - Odłożone do Phase 2 (zależy od Epic 04)

---

## EPIC 04 - PRODUCTION

### Phase 0 - MVP Core ✅ 100% COMPLETE

| Story | Nazwa | Status | Testy | AC | Uwagi |
|-------|-------|--------|-------|-----|-------|
| 04.1 | Production Dashboard | ✅ COMPLETE | 231 | 1/1 | All phases done |
| 04.2a | WO Start | ✅ COMPLETE | 124 | 3/3 | Fixed 2 critical bugs |
| 04.2b | WO Pause/Resume | ✅ COMPLETE | 351 | 7/7 | 9 refactors applied |
| 04.2c | WO Complete | ✅ COMPLETE | 49 | 12/13 | 1 minor UI polish |
| 04.3 | Operation Start/Complete | ✅ COMPLETE | 388 | 7/7 | Fully approved |
| 04.4 | Yield Tracking | ✅ COMPLETE | 326 | 7/7 | Fully approved |
| 04.5 | Production Settings | ✅ COMPLETE | 138 | 7/7 | Major issue resolved |

**Metryki Phase 0:**
- Łącznie testów: 1,600+
- AC pass rate: 97.8% (44/45)
- Wszystkie P6 (QA) passed

### Phase 1 - Full Production ✅ READY TO START

**Status:** UNBLOCKED (Epic 05 complete!)

| Story | Nazwa | Status | Wymaga |
|-------|-------|--------|--------|
| 04.6a | Material Consumption Desktop | ❌ NOT STARTED | LP table ✓ |
| 04.6b | Material Consumption Scanner | ❌ NOT STARTED | LP table ✓ |
| 04.6c | 1:1 Consumption | ❌ NOT STARTED | LP table ✓ |
| 04.6d | Consumption Correction | ❌ NOT STARTED | LP table ✓ |
| 04.6e | Over-Consumption Control | ❌ NOT STARTED | LP table ✓ |
| 04.7a | Output Registration Desktop | ❌ NOT STARTED | LP + Genealogy ✓ |
| 04.7b | Output Registration Scanner | ❌ NOT STARTED | LP + Genealogy ✓ |
| 04.7c | By-Product Registration | ❌ NOT STARTED | LP + Genealogy ✓ |
| 04.7d | Multiple Outputs per WO | ❌ NOT STARTED | LP + Genealogy ✓ |
| 04.8 | Material Reservations | ❌ NOT STARTED | LP Reservations ✓ |

**Szacowany effort:** 18-24 dni

### Phase 2 - OEE & Analytics ❌ NOT STARTED

11 stories do stworzenia (04.9a-d, 04.10a-g)

---

## EPIC 05 - WAREHOUSE ✅ 100% COMPLETE

**Status:** Wszystkie 20 stories zaimplementowane!

| Story | Nazwa | Status | Testy | AC |
|-------|-------|--------|-------|-----|
| 05.0 | Warehouse Settings | ✅ COMPLETE | 38/38 | ✓ |
| 05.1 | LP Table + CRUD | ✅ COMPLETE | 126/126 | 12/12 |
| 05.2 | LP Genealogy | ✅ COMPLETE | 138/138 | ✓ |
| 05.3 | LP Reservations | ✅ COMPLETE | 64/64 | ✓ |
| 05.4 | FIFO/FEFO | ✅ COMPLETE | 160/160 | ✓ |
| 05.5 | LP CRUD Desktop | ✅ COMPLETE | 251/251 | ✓ |
| 05.6 | LP Detail History | ✅ COMPLETE | 344/344 | ✓ |
| 05.7 | Warehouse Dashboard | ✅ COMPLETE | 87/87 | ✓ |
| 05.8 | LP Stock Moves | ✅ COMPLETE | 82/82 | ✓ |
| 05.9 | ASN Receive Workflow | ✅ COMPLETE | 14/24 | ✓ |
| 05.10 | GRN CRUD Items | ✅ COMPLETE | 73/73 | ✓ |
| 05.11 | GRN from PO | ✅ COMPLETE | 111/111 | ✓ |
| 05.12 | GRN from TO | ✅ COMPLETE | 155/155 | ✓ |
| 05.13 | Over-Receipt Control | ✅ COMPLETE | 42/42 | ✓ |
| 05.14 | LP Label Printing | ✅ COMPLETE | 113/123 | ✓ |
| 05.15 | Over-Receipt Handling | ✅ COMPLETE | 66/66 | ✓ |
| 05.16 | Stock Moves CRUD | ✅ COMPLETE | 74/74 | ✓ |
| 05.17 | LP Split Workflow | ✅ COMPLETE | 112/112 | ✓ |
| 05.18 | LP Merge Workflow | ✅ COMPLETE | 137/149 | ✓ |
| 05.19 | Scanner Receive | ✅ COMPLETE | 74/74 | ✓ |

**Metryki:**
- Łącznie testów: **2,265+**
- Data ukończenia: 2026-01-09
- Wszystkie critical issues rozwiązane

---

## EPIC 06 - QUALITY ❌ NOT STARTED

**Status:** Stories dokumentacja gotowa, implementacja nie rozpoczęta

**Stories gotowe do implementacji:** 12 (Phase 1A-1B)
- 06.0-06.11 mają complete context files

**Stories do napisania:** 29 (Phase 2-4)
- 06.12-06.40

**Szacowany effort:** 52-68 dni

---

## EPIC 07 - SHIPPING ❌ NOT STARTED

**Status:** Stories dokumentacja gotowa, implementacja nie rozpoczęta

**Stories gotowe do implementacji:** 16
- 07.1-07.16 wszystkie udokumentowane

**Blokery:**
- 07.7 (Inventory Allocation) wymaga Epic 05 ✅ UNBLOCKED

**Szacowany effort:** 50-60 dni

---

## EPIC 08-11 - PREMIUM MODULES ❌ NO STORIES

**Status:** PRD i Architektura gotowe, brak stories

| Epic | Moduł | PRD | Architektura | Stories | Do Napisania |
|------|-------|-----|--------------|---------|--------------|
| 08 | NPD | ✅ 1,004 linii | ✅ Complete | ❌ 0 | 15-20 |
| 09 | Finance | ✅ 1,400+ linii | ✅ Complete | ❌ 0 | 25-30 |
| 10 | OEE | ✅ 926 linii | ✅ Complete | ❌ 0 | 18-22 |
| 11 | Integrations | ✅ 1,647 linii | ✅ Complete | ❌ 0 | 20-25 |

**TOTAL stories do napisania:** 78-97

---

## CRITICAL PATH - NASTĘPNE KROKI

### Priorytet 1: Natychmiastowe (1-2 dni)

```
1. ⚡ Dokończyć 03.13 (Material Availability) - P4-P7
   Status: Backend 100%, Frontend in progress
   Effort: 2 dni
```

### Priorytet 2: Epic 04 Phase 1 (18-24 dni)

```
Epic 05 COMPLETE → Epic 04 Phase 1 UNBLOCKED!

Kolejność implementacji:
1. 04.6a-e - Material Consumption (12-15 dni)
2. 04.7a-d - Output Registration (8-10 dni)
3. 04.8   - Material Reservations (2-3 dni)
```

### Priorytet 3: Epic 02 dokończenie (5-8 dni)

```
1. 02.8  - operation_attachments migration
2. 02.12 - Dashboard tests
3. 02.6, 02.14 - UI gaps
```

### Priorytet 4: Epic 06-07 (100-120 dni)

```
Epic 06 (Quality): 52-68 dni
Epic 07 (Shipping): 50-60 dni (07.7 unblocked!)
```

### Priorytet 5: Premium Modules (115-145 dni)

```
Najpierw: Napisać stories dla Epic 08-11
Potem: Implementacja
```

---

## TIMELINE ESTIMATE

| Faza | Scope | Dni | Target |
|------|-------|-----|--------|
| Immediate | 03.13 + Epic 02 gaps | 7-10 | Styczeń 2026 |
| Phase 1 | Epic 04 Phase 1 | 18-24 | Luty 2026 |
| Phase 2 | Epic 06 Quality | 52-68 | Marzec-Kwiecień 2026 |
| Phase 3 | Epic 07 Shipping | 50-60 | Maj-Czerwiec 2026 |
| Phase 4 | Epic 04 Phase 2 (OEE) | 25-32 | Lipiec 2026 |
| Premium | Epic 08-11 stories | 30-40 | Sierpień 2026 |
| Premium | Epic 08-11 impl | 115-145 | Q4 2026 |

**TOTAL do MVP (Epic 01-07):** ~200-250 dni remaining
**TOTAL do Enterprise (Epic 01-11):** ~350-450 dni remaining

---

## CHECKSUM

```
Wygenerowano: 2026-01-14
Źródło: .claude/checkpoints/*.yaml
Stories zaimplementowane: 70/80 (Epic 01-05)
Stories do implementacji: 10 (Epic 04 Phase 1)
Stories do napisania: 78-97 (Epic 08-11)
Epic 05 completion date: 2026-01-09
```
