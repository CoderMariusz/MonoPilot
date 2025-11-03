# MonoPilot - Scalone TODO & Roadmap

> 📅 **Ostatnia aktualizacja**: 2025-01-XX  
> 🔄 **Status**: W trakcie aktualizacji dokumentacji  
> 📋 **Źródła**: 
> - TODO z Downloads (MVP do Świąt + Roadmap)
> - TODO z docs (Historia implementacji Phases 0-21)

---

## 📌 Legenda priorytetów i statusów

- 🟢 **P0** – krytyczne na demo do Świąt (MVP)
- 🟡 **P1** – po MVP / do wersji PRO
- ⚪ **P2** – dalsze rozszerzenia / nice-to-have

Checkboxy: `[ ] do zrobienia`, `[~] w toku`, `[x] zrobione`.

---

## 📚 Spis treści

1. [Historia Implementacji (Phases 0-18)](#historia-implementacji-phases-0-18)
2. [Plan MVP do Świąt (Tydz. 1-8)](#plan-mvp-do-świąt-tydz-1-8)
3. [Roadmap po MVP](#roadmap-po-mvp)
4. [Future Enhancements (Phases 19-21)](#future-enhancements-phases-19-21)
5. [Architecture Decisions](#architecture-decisions)
6. [Mapowanie: Co zrobione vs Co do zrobienia](#mapowanie-co-zrobione-vs-co-do-zrobienia)

---

## 📖 Historia Implementacji (Phases 0-18)

> ✅ **Status**: Wszystkie fazy 0-18 zostały zaimplementowane i przetestowane.  
> 📝 **Uwaga**: Szczegóły techniczne zostały zachowane dla referencji historycznej.

### Phase 0-2: Planning UI Enhancements ✅ COMPLETED

**Mapowanie do MVP**: Częściowo pokrywa "Planning — UI & Data Spec (WO/PO/TO)"

- [x] Work Orders Table: WO #, Product, Qty + UoM, Status, Line/Machine, Dates, Priority, Progress %, Shortages, Actions
- [x] Work Order Details Modal: KPI tiles (Shortages, Plan vs Real, Progress/Yield)
- [x] Cancel actions z walidacją statusu
- [x] Client State updates (cancelWorkOrder, cancelPurchaseOrder, cancelTransferOrder)

### Phase 3-10: Purchase Orders, Transfer Orders, ASN ✅ COMPLETED

**Mapowanie do MVP**: Częściowo pokrywa "Planning — UI & Data Spec (WO/PO/TO)"

- [x] Purchase Orders: Cancel PO, Upload ASN, GRN validation
- [x] Transfer Orders: Cancel TO z walidacją statusu
- [x] ASN Upload Modal: Formularz upload ASN
- [x] API Layer: PurchaseOrdersAPI, TransferOrdersAPI, ASNsAPI
- [x] Supabase Schema: 001_planning_tables.sql, 002_rls_policies.sql
- [x] RLS Policies: Basic security implementation

### Phase 13: UI-Only Changes ✅ COMPLETED

- [x] Status values alignment (WorkOrderStatus, PurchaseOrderStatus, TransferOrderStatus)
- [x] WO List: Made & Progress Bar columns
- [x] PO: Supplier Select + Buyer from Session
- [x] PO Pricing: Default from BOM
- [x] TO: Uses Warehouses (not Locations)

### Phase 14: Backend Implementation ✅ COMPLETED

- [x] Supabase Schema: warehouses, suppliers, production_outputs tables
- [x] API Extensions: SuppliersAPI, WarehousesAPI, getProductionStats()
- [x] RPC Functions: get_material_std_cost(), cancel_work_order(), cancel_purchase_order(), cancel_transfer_order()
- [x] Settings CRUD UIs: SuppliersTable, WarehousesTable

### Phase 15: BOM System Enhancement ✅ COMPLETED

- [x] Database Schema: Product taxonomy enums, tax codes, allergens, supplier products, BOM routing
- [x] TypeScript Types & API: TaxCodesAPI, SupplierProductsAPI, RoutingsAPI
- [x] UI Components: Enhanced AddItemModal, BOM editor z versioning, Settings management
- [x] Business Logic: Routing requirements, supplier-specific pricing

**Kluczowe funkcje**:
- Multi-phase routing z yield per phase
- Full traceability via License Plates
- Shelf-life policy foundation
- Explicit Drygoods types
- Supplier links z per-supplier pricing
- Allergen tagging

### Phase 11-16: Production Module Enhancement ✅ COMPLETED

**Mapowanie do MVP**: Częściowo pokrywa "Scanner UX (core)", "Warehouse Mobile (Pick/Putaway)"

#### Database Schema ✅
- [x] New Tables: wo_materials (BOM snapshot), lp_reservations, lp_compositions, pallets, pallet_items
- [x] Enhanced Tables: license_plates, work_orders, wo_operations
- [x] BOM Snapshot Trigger: Automatyczny snapshot na WO creation
- [x] Trace Functions: Enhanced forward/backward trace

#### API Layer ✅
- [x] Work Orders API: Enhanced with filters, stage status
- [x] Yield API: PR/FG yield APIs z time bucket filtering
- [x] Consume API: Consumption tracking z variance calculations
- [x] Traceability API: Forward/backward trace z composition support
- [x] License Plates API: LP management z composition tracking
- [x] Scanner Integration APIs: Stage Board, Process Terminal, Pack Terminal, QA Override

#### Excel Exports ✅
- [x] Export Infrastructure: SheetJS integration
- [x] Export Endpoints: Yield reports, Consumption reports, Traceability reports, Work orders, License plates, Stock moves

#### UI Components ✅
- [x] Production UI: Work Orders Tab, Yield Tab, Consume Tab, Operations Tab, Trace Tab
- [x] Scanner UI: Stage Board, Staged LPs List, Scanner Panel, Record Weights Modal, QA Override Modal

#### Business Logic ✅
- [x] Sequential Routing: Operation sequence validation
- [x] Hard 1:1 Rule: One-to-one component relationships
- [x] Cross-WO PR Validation: Exact product matching
- [x] Reservation-Safe Operations: Prevent exceeding available quantities
- [x] QA Gate Enforcement: Block operations with failed QA status

#### Testing ✅
- [x] API Integration Tests: Work Orders, Operations, Reservations, Traceability, Exports
- [x] UI Component Tests: WorkOrdersTable, YieldReportTab, StageBoard, RecordWeightsModal
- [x] Jest Configuration: Test setup, mocks, coverage thresholds

### Phase 18: BOM Lifecycle & Versioning ✅ COMPLETED

- [x] BOM Lifecycle Management: Status ENUM (draft/active/archived), single active BOM per product
- [x] BOM Versioning: Automatic version bumping (minor vs major changes)
- [x] Clone-on-Edit Pattern: Editing active BOM creates new draft version
- [x] PO Prefill from BOM: tax_code_id, lead_time_days, moq w wo_materials
- [x] Archive Tab: Added to BomCatalogClient
- [x] UI Enhancements: BOM status buttons, allergen inheritance

### Phase 17: Documentation & Deployment 🔄 IN PROGRESS

**Mapowanie do MVP**: To jest właśnie to, co robimy teraz (audit dokumentacji)

- [ ] **API Reference**: Update API_REFERENCE.md with new endpoints and examples
- [ ] **Database Schema**: Update DATABASE_SCHEMA.md with new tables and relationships
- [ ] **Production Delta Guide**: Create production module implementation guide
- [ ] **Scanner Integration Guide**: Create scanner integration documentation
- [ ] **Seed Data Enhancement**: Add 1:1 flags, reservations, compositions, pallets to seed data
- [ ] **Supabase MCP Integration**: Apply migrations, verify schema, test RPC functions
- [ ] **Performance Testing**: Large dataset testing, query performance, API response times

---

## 🎯 Plan MVP do Świąt (Tydz. 1-8)

> 🗓️ **Cel**: Demo E2E gotowe do 28 XII 2025  
> 📅 **Oś czasu**: 8 tygodni (03 XI - 28 XII 2025)

### Tydz. 1–2 (03–16 XI) — Fundamenty 🟢 P0

#### RLS + multi-tenant fundamenty
- [ ] 🟢 **Polityki RLS**: Smoke-test przecieków danych między tenantami
  - Status: ⚠️ Częściowo (Phase 9 ma podstawowe RLS, ale brak smoke-test)
  - Zrobione: Basic RLS policies (Phase 9)
  - Do zrobienia: Multi-tenant smoke-test, przecieki danych

#### ASN → GRN → LP (MVP)
- [ ] 🟢 **Walidacja vs PO**: Sprawdzenie zgodności ASN z PO
- [ ] 🟢 **Różnice ilości**: Obsługa różnic między ASN a PO
- [ ] 🟢 **Autogeneracja LP**: Automatyczne generowanie License Plates
- [ ] 🟢 **Lokacje wejściowe**: Przypisanie lokacji przy GRN
- [ ] 🟢 **Numeracja dokumentów**: Spójna numeracja GRN i LP
  - Status: ⚠️ Częściowo (Phase 10 ma ASN upload, ale brak pełnego flow ASN→GRN→LP)
  - Zrobione: ASN upload modal (Phase 10), License Plates API (Phase 12)
  - Do zrobienia: Pełny flow ASN→GRN→LP, walidacja, autogeneracja

#### Scanner UX (core)
- [ ] 🟢 **Ścieżki błędów**: Obsługa błędów w scannerze
- [ ] 🟢 **Retry**: Możliwość ponowienia operacji
- [ ] 🟢 **Skan kodów**: Obsługa skanowania kodów kreskowych
- [ ] 🟢 **Komunikaty**: User-friendly komunikaty błędów
- [ ] 🟢 **Ergonomia**: Optymalizacja dla telefonu/skanera
  - Status: ⚠️ Częściowo (Phase 14-16 ma scanner, ale może brakować UX improvements)
  - Zrobione: Stage Board, Process Terminal, Pack Terminal, QA Override (Phase 14)
  - Do zrobienia: UX improvements, error handling, retry logic

#### Warehouse Mobile (Pick/Putaway — baza)
- [ ] 🟢 **Reguły lokacji**: Automatyczne przypisanie lokacji
- [ ] 🟢 **Rezerwacje LP**: System rezerwacji License Plates
- [ ] 🟢 **Tryb „gruba rękawica”**: UI dla pracy w rękawicach
- [ ] 🟢 **Responsywność**: Mobile-first design
  - Status: ⚠️ Częściowo (Phase 14 ma LP operations, ale może brakować mobile optimization)
  - Zrobione: LP reservations (Phase 11), LP operations (Phase 14)
  - Do zrobienia: Mobile optimization, "gruba rękawica" mode

### Tydz. 3–4 (17–30 XI) — QA & Etykiety & NCR 🟢 P0

#### QA Lite + COA (light)
- [ ] 🟢 **Statusy LP**: Pending/Passed/Failed/Quarantine
- [ ] 🟢 **COA PDF: tabela wyników per LP**: Generowanie PDF z tabelą wyników
- [ ] 🟢 **Zapis wyników/załączników**: Przechowywanie wyników QA
  - Status: ⚠️ Częściowo (Phase 14-16 ma QA gates, ale brak COA PDF generation)
  - Zrobione: QA gates, QA override (Phase 14-15)
  - Do zrobienia: COA PDF generation, tabela wyników per LP

#### Drukowanie etykiet — ścieżka #1 (MVP)
- [ ] 🟢 **LP**: start z **ZPL** (1 model drukarki, kolejka i retry, spójność numerów z LP)
- [ ] 🟢 **PO/NCR**: start z **PDF** (druk systemowy; szablony w repo)
  - Status: ❌ Brak (nie ma w docs TODO)
  - Zrobione: Brak
  - Do zrobienia: ZPL printing dla LP, PDF printing dla PO/NCR, kolejka i retry

#### NCR → RTS (lite), Stage 1–3
- [ ] 🟢 **Zgłoszenie z produkcji**: Interface do zgłaszania NCR
- [ ] 🟢 **Auto-trace do PO/TO/GRN**: Automatyczne śledzenie źródła
- [ ] 🟢 **LP → Quarantine**: Automatyczne przeniesienie LP do Quarantine
- [ ] 🟢 **MRB (waste/RTS)**: Material Review Board workflow
- [ ] 🟢 **Auto‑mail do dostawcy**: Szablon + załączniki
  - Status: ❌ Brak (nie ma w docs TODO)
  - Zrobione: Brak
  - Do zrobienia: Cały flow NCR→RTS, auto-trace, auto-mail

### Tydz. 5–6 (01–14 XII) — Dostawcy & Koszty & Settings 🟢 P0

#### Supplier Portal (MVP)
- [ ] 🟢 **Link/token publiczny**: Publiczny dostęp bez logowania
- [ ] 🟢 **Accept/Reject + komentarz**: Interface dla dostawcy
- [ ] 🟢 **Timeline**: Historia decyzji
- [ ] 🟢 **Podstawowe bezpieczeństwo**: Token-based security
  - Status: ❌ Brak (nie ma w docs TODO)
  - Zrobione: Brak
  - Do zrobienia: Cały Supplier Portal

#### Costing Basic (WO P&L)
- [ ] 🟢 **unit_cost_std vs zużycia/wyjścia**: Porównanie standardu z rzeczywistością
- [ ] 🟢 **Raport per WO**: Profit & Loss report per Work Order
  - Status: ⚠️ Częściowo (Phase 12 ma consume tracking, ale brak raportu P&L)
  - Zrobione: Consume API z variance calculations (Phase 12)
  - Do zrobienia: P&L report per WO

#### Settings — progi odchyleń (modal + DB)
- [ ] 🟢 **Modal w /settings/costing**: Interface do ustawiania progów
- [ ] 🟢 **Progi % i kwotowe**: Alerty przy przekroczeniu progów
- [ ] 🟢 **Tabela/klucze konfiguracyjne w DB**: Przechowywanie progów
- [ ] 🟢 **Odczyt w raporcie P&L**: Używanie progów w raportach
- [ ] 🟢 **Walidacje**: Walidacja progów
  - Status: ❌ Brak (nie ma w docs TODO)
  - Zrobione: Brak
  - Do zrobienia: Settings modal, DB table, integracja z P&L

### Tydz. 7–8 (15–28 XII) — Raporty & Hardening & Testy 🟢 P0

#### QA Reporting (lite)
- [ ] 🟢 **FPY**: First Pass Yield
- [ ] 🟢 **Scrap**: Raport scrap
- [ ] 🟢 **MV/rollupy**: Materialized Views i rollupy
- [ ] 🟢 **Filtry org/plant**: Filtrowanie po organizacji/plant
- [ ] 🟢 **Eksport CSV/PDF**: Eksport raportów
  - Status: ⚠️ Częściowo (Phase 13 ma Excel exports, ale brak QA reporting specyficznego)
  - Zrobione: Excel exports infrastructure (Phase 13)
  - Do zrobienia: QA-specific reporting, FPY, Scrap

#### Hardening
- [ ] 🟢 **Indeksy/perf**: Optymalizacja indeksów i wydajności
- [ ] 🟢 **Logi błędów**: Centralne logowanie błędów
- [ ] 🟢 **Retry/idempotencja**: Mechanizmy retry i idempotencji
- [ ] 🟢 **DPIA/DPA/NDA (pilot)**: Dokumentacja compliance
  - Status: ⚠️ Częściowo (Phase 17 ma performance testing, ale brak hardening checklist)
  - Zrobione: Performance testing (Phase 17)
  - Do zrobienia: Hardening checklist, logi, retry/idempotencja, compliance docs

#### Testy E2E (Playwright + Supabase)
- [ ] 🟢 **Pokrycie P0**: Pełny przebieg P0
  - PO/ASN → GRN → LP
  - QA Lite/COA
  - NCR → RTS (auto‑mail)
  - Druk etykiet
  - Pick/Putaway
  - WO P&L (z progami z Settings)
  - QA Reporting
  - Status: ⚠️ Częściowo (Phase 16 ma testy, ale może brakować E2E coverage)
  - Zrobione: Jest/Unit tests (Phase 16)
  - Do zrobienia: E2E tests z Playwright, full P0 coverage

---

## 🧩 Planning — UI & Data Spec (WO/PO/TO) – Parity checklist

> 📋 **Status**: Większość zrobiona w Phases 0-14, ale niektóre elementy wymagają dokończenia

### Tabele — kolumny i akcje

#### WO — lista
- [x] ✅ WO #, Product, Qty + UoM, Status, Line/Machine, Dates, Priority (Phase 0-2)
- [x] ✅ Made, Progress (Phase 13)
- [x] ✅ Shortages (Phase 0-2)
- [x] ✅ Actions (Cancel/Edit/Delete) (Phase 0-5)
- [ ] 🟢 Filtry: line, date, status (może wymagać ulepszeń)

#### PO — lista
- [x] ✅ PO #, Supplier, Status (Phase 3, 14)
- [x] ✅ Request/Expected/Due dates (Phase 3)
- [x] ✅ Warehouse, Buyer (Phase 14)
- [x] ✅ Items, Total (Phase 3)
- [x] ✅ Upload ASN (Phase 10)
- [ ] 🟢 Attachments (może wymagać implementacji)
- [x] ✅ Actions (Cancel) (Phase 3)

#### TO — lista
- [x] ✅ TO #, From, To, Status (Phase 4)
- [x] ✅ Planned/Actual (Phase 4)
- [x] ✅ Items (Phase 4)
- [x] ✅ Actions (Cancel) (Phase 4)

### Pop‑upy (modale)

#### WO — Create/Edit
- [x] ✅ Snapshot BOM → wo_materials (Phase 11)
- [ ] 🟢 Dla statusu ≥ in_progress edytowalne tylko quantity (może wymagać implementacji)

#### WO — Details (View)
- [x] ✅ KPI: Shortages, Plan vs Real, Progress/Yield (Phase 0-2, 13)

---

## 🧪 Testy — zakres (MVP)

### Unit
- [x] ✅ Walidacje statusów (Phase 16)
- [ ] 🟢 QA Lite (do zrobienia)
- [ ] 🟢 Kalkulacje yield/odchyleń (częściowo w Phase 16)
- [ ] 🟢 Druk (kolejka/retry) (do zrobienia)

### Integracyjne
- [ ] 🟢 PO→ASN→GRN→LP (częściowo w Phase 10, 11)
- [x] ✅ Trace do GRN/PO (Phase 12)
- [ ] 🟢 Supplier decision (do zrobienia)
- [ ] 🟢 Costing (częściowo w Phase 12)

### E2E
- [ ] 🟢 Pełny przebieg P0 (do zrobienia w Tydz. 7-8)

---

## 🧠 NPD / Idea Management — Etapy i priorytety (po MVP)

> 🟡 **P1** - Po MVP (Tydz. 9-16; styczeń-luty 2026)

### ETAP 1 — BASIC (Gotowy do wdrożenia) 🟡 P1 (Tydz. 9–11; styczeń 2026)
- [ ] `/npd`, `/npd/ideas` + modal „nowa idea”
- [ ] Powiązanie idei z BOM (draft); statusy: **Pomysł → W opracowaniu → Do akceptacji → Zatwierdzony**
- [ ] Role: NPD/Technical/Finance; widoczność
- [ ] Integracja z Technical — aktywacja BOM po akceptacji
- [ ] Testy E2E (Idea→BOM→Akceptacja→Aktywny produkt)

### ETAP 2 — COST & EVALUATION 🟡 P1 (Tydz. 12–13)
- [ ] Koszt standardowy BOM + ręczna korekta
- [ ] Podgląd kosztorysu, filtry, eksport
- [ ] Walidacja: „brak kosztu = brak akceptacji”

### ETAP 3 — COLLAB & VERSIONS ⚪ P2 (Tydz. 14–16)
- [ ] Wersjonowanie/klonowanie, etapy Kanban
- [ ] Komentarze, @wzmianki, załączniki
- [ ] Powiadomienia; Dashboard NPD

---

## 🛠️ Engineering / **CMMS‑lite (T12–16)** — zakres i backlog (po MVP)

> 🟡 **P1** - Horyzont: luty–marzec 2026 (Tydz. 12–16)

### Decyzje i model (dual‑mode tracking)
- [ ] `products.tracking_policy ∈ {'NONE','LP'}` (Simple vs LP)
- [ ] QA dla Simple: `qty_quarantine` w `inventory_balances`

### Nowe tabele (prefiks `eng_`) i Simple‑magazyn
- [ ] `eng_machines_meta`, `eng_faults`, `eng_pm_plans`, `eng_maintenance_orders`, `eng_parts_used`, `eng_parts_requests`
- [ ] `inventory_balances`, `stock_moves` (audit dla Simple), widok `vw_parts_availability` (UNION Simple+LP)

### API & UI
- [ ] API: Machines/Faults/PMPlans/MO/Parts/WarehouseSimple
- [ ] UI: `/engineering/machines|faults|maintenance/plans|orders|parts`

### Testy i RLS
- [ ] Unit/Integracyjne/E2E wg flow: Fault→MO(CM)→downtime→parts_used→close (dekrement)
- [ ] RLS i role: engineering_user/manager/read_only

### Migracje/seed/monitoring
- [ ] Migracje kolumn, indeksy, seedy (kategorie, checklisty PM), alerty: „PM overdue", „Low stock Simple"

---

## 📅 Roadmap po MVP — kolejność i terminy

### Tydz. 9–12 (styczeń 2026) — 🟡 P1
- [ ] Feature‑flags & Module Registry
- [ ] Read‑replica + pierwsze Materialized Views (operacyjne)
- [ ] Supplier Scorecard (lite)
- [ ] Stage/Workflow Engine (MVP)
- [ ] Integracja finansowa: QuickBooks Online (v1)

### Tydz. 12–16 (luty–marzec 2026) — 🟡 P1
- [ ] Maintenance / CMMS (core) — jak wyżej
- [ ] OEE (lite)
- [ ] APS / Scheduling (core, read‑only)
- [ ] Drukarki sieciowe v2 (TCP 9100 + agent)

### Tydz. 16–20 (kwiecień 2026) — 🟡/⚪ P1/P2
- [ ] CAPA (lite) + powiązanie z NCR
- [ ] Customer RMA (mirror RTS)
- [ ] Integracje ERP #2 (Xero / NAV / NetSuite)
- [ ] Warehouse Mobile — Cycle Count

### Tydz. 20–24 (maj 2026) — ⚪ P2
- [ ] Eksport do S3 (most do lakehouse)
- [ ] Lakehouse (Iceberg/Trino/dbt) — prototyp analityczny
- [ ] IoT / Devices Gateway (wagi/drukarki/PLC)

---

## 🔮 Future Enhancements (Phases 19-21)

> ⚪ **P2** - Długoterminowe rozszerzenia / nice-to-have

### Phase 19: Data Validation & Audit Trail ⚪ P2

#### BOM Data Validation
- [ ] **Circular BOM Reference Detection**: Prevent infinite loops in BOM structure
- [ ] **Version Format Validation**: Ensure version follows X.Y format
- [ ] **Product Type Material Validation**: Enforce allowed materials per product type
- [ ] **Max BOM Depth Limit**: Prevent excessively nested BOMs

#### Audit Trail System
- [ ] **Create audit_log Table**: Track all changes to critical data
- [ ] **Add Triggers for Audit Logging**: Auto-populate audit_log
- [ ] **Implement Change Reason Field**: Require user to explain changes
- [ ] **Create Audit Trail Viewer UI**: Admin panel to view change history

#### BOM Approval Workflow
- [ ] **Create bom_approvals Table**: Track approval requests
- [ ] **Implement Approval Workflow**: Require manager approval for BOM activation

#### BOM Comparison & History
- [ ] **BOM Comparison Tool**: Visual diff between BOM versions
- [ ] **BOM History Viewer**: Display all BOM versions

### Phase 20: Work Order Snapshot Management ⚪ P2

#### WO Snapshot Update
- [ ] **Implement Snapshot Update API**: `POST /api/production/work-orders/:id/snapshot-update`
- [ ] **Snapshot Preview with Diff**: Show changes before applying
- [ ] **Conflict Detection**: Identify issues before update
- [ ] **Snapshot Update Approval**: Require approval for critical updates

#### Scanner Validation
- [ ] **Enforce 1:1 Validation**: For `consume_whole_lp` materials (Note: częściowo w Phase 15)
- [ ] **Scanner Validation Rules Table**: Configurable validation rules
- [ ] **Real-time Validation Feedback**: Instant validation in scanner UI
- [ ] **Scanner Error Logging**: Track all scanner errors

#### PO Prefill Enhancement
- [ ] **Modify PO Creation Endpoint**: Use BOM prefill data (Note: częściowo w Phase 18)
- [ ] **Override Capability**: Allow manual override of prefilled values
- [ ] **Prefill Accuracy Reporting**: Track prefill vs actual values

### Phase 21: Advanced Enhancements ⚪ P2

#### Advanced Production Features
- [ ] **Multi-Phase Routing**: Enhanced routing with per-phase yield tracking (Note: podstawy w Phase 15)
- [ ] **Shelf-Life Policy**: Multi-tier shelf-life policies with per-phase adjustments (Note: podstawy w Phase 15)
- [ ] **Advanced Traceability**: LP tree visualization and complex composition tracking (Note: podstawy w Phase 12)
- [ ] **Real-Time Monitoring**: Live production monitoring with WebSocket updates

#### Advanced Scanner Features
- [ ] **Offline Queue**: Handle scanner operations when offline
- [ ] **Batch Operations**: Process multiple LPs in batch operations
- [ ] **Advanced QA**: Multi-level QA approval workflows
- [ ] **Mobile Optimization**: Enhanced mobile scanner interface

#### Reporting & Analytics
- [ ] **Advanced KPIs**: Machine learning-based yield predictions
- [ ] **Trend Analysis**: Historical trend analysis and forecasting
- [ ] **Cost Analysis**: Detailed cost tracking per operation
- [ ] **Quality Metrics**: Advanced quality tracking and reporting

#### Role-Based Access Control (RBAC)
- [ ] Document RBAC approach for future implementation
- [ ] Add role column to users table
- [ ] Update RLS policies to check user roles
- [ ] Hide/disable UI elements based on role
- [ ] Add role checks in API methods

#### Advanced Features
- [ ] Add BOM snapshot on WO creation (Note: już w Phase 11)
- [ ] Implement GRN expiry calculation logic
- [ ] Add reporting hooks (prep, no UI change yet)
- [ ] Create CreateSupplierModal and EditSupplierModal components (Note: częściowo w Phase 14)
- [ ] Create CreateWarehouseModal and EditWarehouseModal components (Note: częściowo w Phase 14)

---

## 🧾 Kryteria „Done" — Demo do Świąt

- [ ] E2E: **PO/ASN → GRN → LP → QA Lite/COA → NCR → RTS (auto‑mail) → Supplier decision → Pick/Putaway → Costing (WO P&L + progi Settings) → QA Reporting**
- [ ] Druk etykiet: **LP (ZPL)** + **PO/NCR (PDF)** działają (1 model drukarki)
- [ ] RLS aktywne i zweryfikowane (multi-tenant)
- [ ] Testy E2E P0 przechodzą na CI

---

## 🔗 Zależności między modułami (skrót)

- Technical → Planning: produkty/BOM → WO (snapshot BOM) ✅
- Planning → Warehouse: PO/TO → GRN/LP ⚠️ (częściowo)
- Production ↔ Scanner: operacje, staging, yield (MVP: tylko P0) ✅
- Warehouse → QA/NCR/Reporting: statusy, COA, raporty ⚠️ (częściowo)

---

## ⚙️ Ustalenia drukarek (dla dokumentacji wdrożeniowej)

- **MVP:**  
  - **LP** → **ZPL** (Zebra Browser Print/QZ lub agent)  
  - **PO/NCR** → **PDF** (druk systemowy)  
- **Po MVP:** **Drukarki sieciowe v2** (TCP 9100 + lekki agent; kolejki, retry, centralne logi)

---

## 🏗️ Architecture Decisions

### Backend Integration Approach
- **Decision**: Use Supabase Client directly (not Prisma) for consistency with existing pattern
- **Rationale**: Avoid over-engineering, maintain existing dual-mode pattern
- **Implementation**: Extended existing `lib/api` layer with new API classes
- **Benefit**: Seamless switching between mock and real data via feature flag

### API Layer Pattern
- **Pattern**: Dual-mode classes with static methods (like existing UsersAPI)
- **Feature Flag**: `shouldUseMockData()` function controls mock vs Supabase
- **Consistency**: All new API classes follow same pattern as existing code

### Security Approach
- **RLS**: Basic Row Level Security with read/write permissions
- **Future**: Role-based policies can be added in Phase 15
- **Audit**: All cancel actions create audit events for tracking

### Business Rules Implementation
- **Frontend Guards**: UI-level validation for immediate user feedback
- **Backend Validation**: RPC functions enforce business rules server-side
- **Audit Trail**: All business rule violations and changes are logged
- **Status Management**: Comprehensive status-based access control

---

## 📊 Mapowanie: Co zrobione vs Co do zrobienia

### ✅ Zrobione (Phases 0-18)

#### Planning Module ✅
- Work Orders: lista, detale, cancel, BOM snapshot
- Purchase Orders: lista, detale, cancel, ASN upload
- Transfer Orders: lista, detale, cancel
- Suppliers & Warehouses CRUD
- RLS policies
- API layer (dual-mode)

#### Production Module ✅
- Database schema (wo_materials, lp_reservations, lp_compositions, pallets)
- API layer (yield, consume, traceability, license plates)
- Excel exports
- UI components (Work Orders, Yield, Consume, Operations, Trace)
- Scanner integration (Stage Board, Process/Pack terminals)
- Business logic (sequential routing, 1:1 validation, QA gates)

#### Technical Module ✅
- BOM system: versioning, routing, taxonomy
- Supplier products, tax codes
- Allergens
- BOM lifecycle (draft/active/archived)

### ⚠️ Częściowo zrobione (wymaga dokończenia)

#### MVP - Tydz. 1-2
- ASN → GRN → LP: Częściowo (ASN upload jest, ale brak pełnego flow)
- Scanner UX: Częściowo (podstawy są, ale brakuje UX improvements)
- Warehouse Mobile: Częściowo (LP operations są, ale brakuje mobile optimization)

#### MVP - Tydz. 3-4
- QA Lite + COA: Częściowo (QA gates są, ale brak COA PDF generation)
- NCR → RTS: Brak (cały flow do zrobienia)

#### MVP - Tydz. 5-6
- Costing Basic: Częściowo (consume tracking jest, ale brak P&L report)

#### MVP - Tydz. 7-8
- QA Reporting: Częściowo (Excel exports są, ale brak QA-specific reporting)

### ❌ Do zrobienia (brak w kodzie)

#### MVP - Tydz. 1-2
- RLS + multi-tenant smoke-test
- Pełny flow ASN → GRN → LP z walidacją
- UX improvements dla scanner
- Mobile optimization dla warehouse

#### MVP - Tydz. 3-4
- Drukowanie etykiet (ZPL dla LP, PDF dla PO/NCR)
- NCR → RTS flow (cały)
- COA PDF generation z tabelą wyników

#### MVP - Tydz. 5-6
- Supplier Portal (cały)
- Settings — progi odchyleń (modal + DB)
- Costing P&L report per WO

#### MVP - Tydz. 7-8
- QA Reporting (FPY, Scrap, MV/rollupy)
- Hardening checklist
- E2E tests z Playwright

#### Po MVP
- NPD / Idea Management (wszystkie etapy)
- Engineering / CMMS-lite (wszystkie zadania)
- Roadmap po MVP (Tydz. 9-24)

---

## 📝 Uwagi końcowe

### Status ogólny
- ✅ **Phases 0-18**: Zaimplementowane i przetestowane
- 🔄 **Phase 17**: W toku (dokumentacja, seed data, testy)
- ⏳ **MVP (Tydz. 1-8)**: Częściowo zrobione, wymaga dokończenia
- 📋 **Po MVP**: Zaplanowane, nie rozpoczęte

### Następne kroki
1. ✅ Dokończyć Phase 17 (dokumentacja, seed data)
2. 🎯 Skupić się na MVP (Tydz. 1-8) - priorytet P0
3. 📋 Przygotować NPD/Idea Management (po MVP)
4. 🛠️ Rozpocząć Engineering/CMMS-lite (po MVP)

### Mapowanie faz do MVP
- Phases 0-14: Pokrywają ~40% wymagań MVP
- Phases 11-16: Pokrywają ~30% wymagań MVP (Production/Scanner)
- Pozostałe ~30% MVP: Do zrobienia (drukowanie, NCR, Supplier Portal, Costing, Settings, QA Reporting)

---

**Ostatnia aktualizacja**: 2025-01-XX  
**Wersja**: 2.0 (Scalony TODO)

