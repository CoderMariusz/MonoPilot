# Analiza Porównawcza TODO - MonoPilot

**Data analizy**: 2025-11-04  
**Źródła**: 
- TODO z Downloads (182 linie) - MVP do Świąt + Roadmap
- TODO z docs (755+ linii) - Historia implementacji + Type Safety (updated 2025-11-04)
- DEPLOYMENT_ERRORS_ANALYSIS.md - 20 consecutive deployment failures analysis

## Podsumowanie

### TODO z Downloads (nowy plan MVP)
- **Fokus**: MVP do Świąt (28 XII 2025)
- **Struktura**: 8 tygodni sprintów + Roadmap po MVP
- **Priorytety**: P0 (MVP), P1 (po MVP), P2 (nice-to-have)
- **Zakres**: 
  - MVP: ASN→GRN→LP, QA Lite, NCR, Supplier Portal, Costing, Settings
  - NPD/Idea Management (po MVP)
  - Engineering/CMMS-lite (po MVP)
  - Roadmap długoterminowa

### TODO z docs (historia implementacji)
- **Fokus**: Historia faz implementacji
- **Struktura**: Phases 0-21 (chronologiczne)
- **Status**: 
  - ✅ Phases 0-18: Zrobione
  - 🔄 Phase 17: W toku (dokumentacja, seed data, testy)
  - ⏳ Phases 19-21: Do zrobienia

## Mapowanie: Co zostało zrobione vs Co jest w planie

### ✅ Zrobione (z docs/TODO.md) - pokrywa część MVP

#### Phase 0-14: Planning UI & Backend ✅
- Work Orders (lista, detale, cancel, BOM snapshot)
- Purchase Orders (lista, detale, cancel, ASN upload)
- Transfer Orders (lista, detale, cancel)
- Suppliers & Warehouses CRUD
- RLS policies
- API layer (dual-mode)

**Mapowanie do nowego TODO**: 
- Częściowo pokrywa "Planning — UI & Data Spec (WO/PO/TO)"
- ✅ WO lista z kolumnami (Phase 0-2)
- ✅ PO lista z ASN upload (Phase 10)
- ✅ TO lista (Phase 4)
- ⚠️ Brakuje: niektóre kolumny w nowym TODO (np. "Made", "Progress" są, ale inne mogą być)

#### Phase 15: BOM System Enhancement ✅
- BOM versioning, routing, taxonomy
- Supplier products, tax codes
- Allergens
- BOM lifecycle (draft/active/archived)

**Mapowanie**: 
- ✅ Podstawy BOM są gotowe
- ⚠️ Nowy TODO wymaga: NPD/Idea Management (nie ma jeszcze)

#### Phase 11-16: Production Module ✅
- Database schema (wo_materials, lp_reservations, lp_compositions, pallets)
- API layer (yield, consume, traceability, license plates)
- Excel exports
- UI components (Work Orders, Yield, Consume, Operations, Trace)
- Scanner integration (Stage Board, Process/Pack terminals)
- Business logic (sequential routing, 1:1 validation, QA gates)

**Mapowanie do nowego TODO**:
- ✅ Scanner UX (core) - częściowo (Phase 14-16)
- ✅ Warehouse Mobile (Pick/Putaway) - częściowo (Phase 14)
- ⚠️ Brakuje: pełna integracja z ASN→GRN→LP (w nowym TODO)

#### Phase 18: BOM Lifecycle & Versioning ✅
- BOM status management
- Clone-on-edit pattern
- Archive tab
- PO prefill from BOM

**Mapowanie**: ✅ Gotowe

### 🔄 W toku / Częściowo zrobione

#### Phase 17: Documentation & Deployment 🔄
- [ ] API Reference update
- [ ] Database Schema update
- [ ] Production Delta Guide
- [ ] Scanner Integration Guide
- [ ] Seed data enhancement
- [ ] Supabase MCP integration
- [ ] Performance testing

**Mapowanie**: 
- ⚠️ To jest właśnie to, co robimy teraz (audit dokumentacji)

### ⏳ Do zrobienia (z docs/TODO.md)

#### Phase 19: Data Validation & Audit Trail ⏳
- Circular BOM reference detection
- Audit log table
- Change reason field
- BOM approval workflow
- BOM comparison tool

**Mapowanie do nowego TODO**:
- ❌ Nie ma w nowym TODO (może być P1/P2)

#### Phase 20: Work Order Snapshot Management ⏳
- Snapshot update API
- Conflict detection
- Scanner validation rules

**Mapowanie**:
- ❌ Nie ma w nowym TODO (może być P1)

#### Phase 21: Future Enhancements ⏳
- Multi-phase routing (enhanced)
- Advanced traceability
- Real-time monitoring
- Offline queue
- Advanced KPIs

**Mapowanie**:
- ❌ Nie ma w nowym TODO (może być P2)

### 🆕 Nowe zadania (z Downloads TODO) - nie ma w docs/TODO

#### MVP - Tydz. 1-2: Fundamenty
- [ ] 🟢 **RLS + multi-tenant fundamenty** (polityki, smoke-test przecieków)
  - Status: ⚠️ Częściowo (Phase 9 ma podstawowe RLS, ale brak smoke-test)
- [ ] 🟢 **ASN → GRN → LP (MVP)**: walidacja vs PO, różnice ilości, autogeneracja LP, lokacje wejściowe, numeracja dokumentów
  - Status: ⚠️ Częściowo (Phase 10 ma ASN upload, ale brak pełnego flow ASN→GRN→LP)
- [ ] 🟢 **Scanner UX (core)**: ścieżki błędów, retry, skan kodów, komunikaty, ergonomia
  - Status: ⚠️ Częściowo (Phase 14-16 ma scanner, ale może brakować UX improvements)
- [ ] 🟢 **Warehouse Mobile (Pick/Putaway — baza)**: reguły lokacji, rezerwacje LP, tryb „gruba rękawica”, responsywność
  - Status: ⚠️ Częściowo (Phase 14 ma LP operations, ale może brakować mobile optimization)

#### MVP - Tydz. 3-4: QA & Etykiety & NCR
- [ ] 🟢 **QA Lite + COA (light)**: statusy LP (Pending/Passed/Failed/Quarantine), **COA PDF: tabela wyników per LP**
  - Status: ⚠️ Częściowo (Phase 14-16 ma QA gates, ale brak COA PDF generation)
- [ ] 🟢 **Drukowanie etykiet — ścieżka #1 (MVP)**: LP (ZPL), PO/NCR (PDF)
  - Status: ❌ Brak (nie ma w docs TODO)
- [ ] 🟢 **NCR → RTS (lite), Stage 1–3**: zgłoszenie z produkcji, auto-trace, LP → Quarantine, MRB, **auto‑mail do dostawcy**
  - Status: ❌ Brak (nie ma w docs TODO)

#### MVP - Tydz. 5-6: Dostawcy & Koszty & Settings
- [ ] 🟢 **Supplier Portal (MVP)**: link/token publiczny, **Accept/Reject + komentarz**, timeline
  - Status: ❌ Brak (nie ma w docs TODO)
- [ ] 🟢 **Costing Basic (WO P&L)**: `unit_cost_std` vs zużycia/wyjścia; raport per WO
  - Status: ⚠️ Częściowo (Phase 14 ma consume tracking, ale brak raportu P&L)
- [ ] 🟢 **Settings — progi odchyleń (modal + DB)**: Modal w /settings/costing, progi % i kwotowe
  - Status: ❌ Brak (nie ma w docs TODO)

#### MVP - Tydz. 7-8: Raporty & Hardening & Testy
- [ ] 🟢 **QA Reporting (lite)**: FPY, Scrap, MV/rollupy, filtry org/plant, eksport CSV/PDF
  - Status: ⚠️ Częściowo (Phase 13 ma Excel exports, ale brak QA reporting specyficznego)
- [ ] 🟢 **Hardening**: indeksy/perf, logi błędów, retry/idempotencja, DPIA/DPA/NDA
  - Status: ⚠️ Częściowo (Phase 17 ma performance testing, ale brak hardening checklist)
- [ ] 🟢 **Testy E2E (Playwright + Supabase)**: pokrycie P0
  - Status: ⚠️ Częściowo (Phase 16 ma testy, ale może brakować E2E coverage)

#### NPD / Idea Management 🆕
- Wszystkie zadania z ETAP 1-3: ❌ Brak (nie ma w docs TODO)

#### Engineering / CMMS-lite 🆕
- Wszystkie zadania: ❌ Brak (nie ma w docs TODO)

#### Roadmap po MVP 🆕
- Wszystkie zadania z Tydz. 9-24: ❌ Brak (nie ma w docs TODO)

## 🔴 What Caused 100% Deployment Failures

> **CRITICAL FINDING**: Analysis of 20 consecutive failed deployments revealed **100% were TypeScript errors**

### Kategorie Błędów (z DEPLOYMENT_ERRORS_ANALYSIS.md)

| Kategoria | % Przypadków | Type Safety Risk | MVP Impact |
|-----------|--------------|------------------|------------|
| **Niekompletne Typy** | 60% | 🔴 HIGH | BLOCKS: Planning module UI updates |
| **Niekompatybilne Typy** | 25% | 🟡 MEDIUM | BLOCKS: Status enums, form validation |
| **Stare/Błędne Importy** | 15% | 🟢 LOW | BLOCKS: Component refactoring |

### MVP Tasks Blocked by Type Errors

#### 🔴 HIGH RISK - Currently Blocking MVP
1. **Planning Module (~77% complete)**
   - **Blokowane**: WO/PO/TO schema→UI updates
   - **Przyczyna**: Niekompletne typy w form submissions
   - **Przykład**: `RoutingBuilder.tsx:113` - Missing id, routing_id, timestamps
   - **Fix**: Use `Omit<T, 'id' | 'created_at' | 'updated_at'>`
   
2. **Production Module (~50% complete)**
   - **Blokowane**: Dashboard components implementation
   - **Przyczyna**: Type mismatches between API response and UI components
   - **Fix**: Define proper TypeScript interfaces for all dashboard props

#### 🟡 MEDIUM RISK - May Block MVP Features
3. **QA Module**
   - **Blokowane**: COA PDF generation
   - **Przyczyna**: Status enum mismatches (Pending/Passed/Failed/Quarantine)
   - **Fix**: Verify enum values match database schema

4. **Label Printing** 
   - **Blokowane**: ZPL template generation
   - **Przyczyna**: Missing type definitions for printer API
   - **Fix**: Create TypeScript interfaces for ZPL commands

#### 🟢 LOW RISK - Won't Block MVP
5. **Advanced Features (P1/P2)**
   - NPD/Idea Management
   - Engineering/CMMS-lite
   - **Status**: Future enhancements, not affected by current type errors

### Type Safety Risk Assessment per Module

| Module | Completion | Type Safety Risk | Deployment Risk | Action Required |
|--------|------------|------------------|-----------------|-----------------|
| Planning | ~77% | 🔴 HIGH | BLOCKS deploy | Audit forms & API calls |
| Production | ~50% | 🔴 HIGH | BLOCKS deploy | Define dashboard types |
| Warehouse | ~70% | 🟡 MEDIUM | May block | Fix GRN/LP types |
| Quality | ~45% | 🟡 MEDIUM | May block | Fix QA status enums |
| Scanner | ~60% | 🟢 LOW | OK | Minor fixes only |
| Technical | ~95% | 🟢 LOW | OK | Stable |

### Deployment Prevention Strategy

**✅ IMPLEMENTED (as of 2025-11-04)**:
- Pre-commit hooks with type-check (see SETUP_TYPE_CHECKING.md)
- Automated ESLint + Prettier
- Import validation

**⏳ PENDING**:
- Audit all MVP components for type completeness
- Fix status enum usages across codebase
- Update Planning module form types

## Różnice strukturalne

### Priorytety
- **Downloads TODO**: P0/P1/P2 z emoji (🟢/🟡/⚪)
- **docs TODO**: P0/P1/P2 z emoji + Type Safety focus (updated 2025-11-04)

### Struktura czasowa
- **Downloads TODO**: Konkretne daty (tygodnie XI-XII 2025)
- **docs TODO**: Fazowe (Phase 0-21), bez dat

### Zakres
- **Downloads TODO**: Biznesowy, user-focused, MVP-driven
- **docs TODO**: Techniczny, implementacyjny, historyczny

## Rekomendacje dla scalonego TODO (✅ IMPLEMENTED 2025-11-04)

1. ✅ **Zachować historię**: Phases 0-18 z docs/TODO.md jako "Historia Implementacji"
2. ✅ **Integrować nowy plan**: MVP z Downloads TODO jako "Plan MVP do Świąt"
3. ✅ **Dodać brakujące**: Zadania z Phase 19-21 jako "Future Enhancements"
4. ✅ **Ujednolicić statusy**: 
   - ✅ Zrobione (Phases 0-18)
   - 🔄 W toku (Phase 17 + część MVP + Type Safety)
   - ⏳ Do zrobienia (MVP + Future)
5. ✅ **Dodać priorytety**: P0/P1/P2 z emoji w całym dokumencie
6. ✅ **Mapowanie**: Pokazane które zadania MVP są już zrobione (Phases 0-18)
7. ✅ **NEW: Type Safety & Deployment Prevention** (Section 9.5)
   - Pre-commit hooks operational
   - Common deployment errors documented
   - Deployment checklist created
   - Reference to DEPLOYMENT_ERRORS_ANALYSIS.md

## Key Learnings

### What We Learned from 20 Failed Deployments
1. **100% TypeScript errors** - Every single deployment failure was preventable
2. **60% incomplete types** - Missing required properties in object mappings
3. **25% enum mismatches** - Wrong status literals used
4. **15% stale imports** - Importing non-existent components

### Prevention Measures Now in Place
1. ✅ **Automated type-check** before every commit (Husky pre-commit hooks)
2. ✅ **Deployment error patterns documented** (DEPLOYMENT_ERRORS_ANALYSIS.md)
3. ✅ **Pre-deployment checklist** added to TODO.md (Section 9.5.5)
4. ⏳ **Audit pending** - Need to fix existing type issues in codebase

### Impact on MVP Timeline
- **Planning Module**: May require 1-2 days for type fixes before UI updates
- **Production Module**: Needs type definitions before dashboard implementation
- **Overall**: Type safety should prevent future deployment failures (0% vs 100%)

