# Epic 6: Quality Module (Enhanced) - Phase 2

**Status:** PLANNED
**Priority:** P1 - Critical dla zamkniecia luk konkurencyjnych
**Stories:** 42 (rozbudowane z 28)
**Estimated Effort:** 10-12 tygodni
**Dependencies:** Epic 1 (Settings), Epic 5 (Warehouse)

---

## 1. Overview

### 1.1 Cel Epica
Rozbudowany modul Quality zarzadza kontrola jakosci w produkcji spozywczej, wlaczajac:
- QA status na LP z pelnym workflow
- Quality holds i dochodzenia
- **HACCP/CCP monitoring** (Critical Control Points)
- **Specyfikacje produktow z tolerancjami**
- Testy laboratoryjne i rejestracja wynikow
- NCR workflow (Non-Conformance Reports) z root cause analysis
- CoA management (Certificate of Analysis)
- Quality dashboard i KPIs

### 1.2 Luki Konkurencyjne Zamykane
| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| HACCP/CCP Support | 4/4 maja | Implementowane w tym epicu |
| Quality Specifications | 4/4 maja | Implementowane w tym epicu |
| NCR Workflow | 4/4 maja | Implementowane w tym epicu |
| CoA Management | 3/4 maja | Implementowane w tym epicu |

### 1.3 Business Value
- **Zgodnosc regulacyjna:** HACCP, FSSC 22000, BRC, IFS
- **Redukcja reklamacji:** O 40% dzieki wczesnemu wykrywaniu
- **Audit-ready:** Pelna dokumentacja CCP i NCR
- **Traceability:** Polaczenie QA z LP genealogy

---

## 2. User Stories

### 2.1 QA Status Management

#### Story 6.1: QA Status na LP
**Jako** QC Inspector
**Chce** widziec i zmieniac status QA na kazdym LP
**Aby** kontrolowac, ktore partie moga byc konsumowane/wysylane

**Acceptance Criteria:**
- [ ] LP ma pole qa_status (pending, passed, failed, quarantine, disposed)
- [ ] Status widoczny w LP detail i listach
- [ ] Ikona statusu w kolorze (zolty/zielony/czerwony/pomaranczowy)
- [ ] Zmiana statusu wymaga uprawnienia qc_inspector+

**Technical Notes:**
- Rozszerzyc tabele license_plates o qa_status
- Dodac constraint na valid status values
- RLS: QC+ moze zmieniac, inni read-only

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.2: QA Status Transitions
**Jako** QC Inspector
**Chce** aby przejscia statusow byly kontrolowane
**Aby** zapobiec nieprawidlowym zmianom

**Acceptance Criteria:**
- [ ] pending -> passed, failed, quarantine
- [ ] passed -> quarantine (problem discovered)
- [ ] failed -> quarantine, disposed
- [ ] quarantine -> passed (cleared), failed, disposed
- [ ] disposed = terminal (nie mozna zmieniac)
- [ ] Kazda zmiana zapisana w quality_audit

**Technical Notes:**
- State machine pattern w service layer
- Trigger sprawdzajacy valid transitions
- Audit log z old_value, new_value, user, timestamp

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.3: Prevent Shipping Non-Passed LPs
**Jako** Shipping Manager
**Chce** aby system blokoval wysylke LP bez QA passed
**Aby** zapobiec wysylaniu niezgodnych partii

**Acceptance Criteria:**
- [ ] Pick list nie zawiera LP z qa_status != passed
- [ ] Scanner pick: blad jezeli scan LP z qa_status != passed
- [ ] Warning/error konfigurowalny w settings
- [ ] Override dla managera z logowaniem

**Technical Notes:**
- Walidacja w pick list generation
- Check w scanner pick workflow
- Setting: require_qa_passed (default: true)

**Priority:** Must Have
**Estimate:** S

---

#### Story 6.4: Control Pending Consumption
**Jako** Admin
**Chce** kontrolowac czy LP pending moga byc konsumowane w produkcji
**Aby** dostosowac workflow do polityki firmy

**Acceptance Criteria:**
- [ ] Setting: allow_pending_consumption (default: false)
- [ ] Jezeli false - blokuj konsumpcje pending LP do WO
- [ ] Jezeli true - pozwol, ale loguj warning
- [ ] UI pokazuje status przy konsumpcji

**Technical Notes:**
- Check w wo_consume service
- Setting w quality_settings

**Priority:** Must Have
**Estimate:** S

---

### 2.2 HACCP/CCP Support

#### Story 6.5: CCP Definition per Routing
**Jako** Technical Officer
**Chce** definiowac Critical Control Points na routingu
**Aby** monitorowac krytyczne punkty procesu

**Acceptance Criteria:**
- [ ] Tabela routing_ccps z CCP per operacja routingu
- [ ] CCP ma: nazwa, typ (temperature, time, pH, etc.)
- [ ] CCP ma: min_value, max_value, target_value, unit
- [ ] CCP ma: monitoring_frequency (co X minut/sztuk)
- [ ] CCP ma: corrective_action_required (text)
- [ ] UI do zarzadzania CCP na stronie routingu

**Technical Notes:**
```sql
CREATE TABLE routing_ccps (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    routing_id UUID NOT NULL REFERENCES routings(id),
    operation_id UUID REFERENCES routing_operations(id),
    ccp_name VARCHAR(100) NOT NULL,
    ccp_type VARCHAR(50) NOT NULL,
    min_value NUMERIC(15,4),
    max_value NUMERIC(15,4),
    target_value NUMERIC(15,4),
    unit VARCHAR(20),
    monitoring_frequency VARCHAR(50),
    corrective_action TEXT,
    is_critical BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L

---

#### Story 6.6: CCP Monitoring per WO
**Jako** Operator
**Chce** rejestrowac pomiary CCP podczas produkcji
**Aby** dokumentowac zgodnosc procesu

**Acceptance Criteria:**
- [ ] Przy WO in_progress: widoczna lista CCP do monitorowania
- [ ] Formularz rejestracji pomiaru: wartosc, timestamp, operator
- [ ] Auto-check: wartosc w zakresie min-max
- [ ] Jezeli poza zakresem: automatyczne oznaczenie jako DEVIATION
- [ ] Historia pomiarow per WO

**Technical Notes:**
```sql
CREATE TABLE ccp_readings (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    wo_id UUID NOT NULL REFERENCES work_orders(id),
    ccp_id UUID NOT NULL REFERENCES routing_ccps(id),
    reading_value NUMERIC(15,4) NOT NULL,
    reading_unit VARCHAR(20),
    reading_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id),
    is_in_range BOOLEAN NOT NULL,
    is_deviation BOOLEAN DEFAULT false,
    deviation_notes TEXT,
    corrective_action_taken TEXT
);
```

**Priority:** Must Have
**Estimate:** L

---

#### Story 6.7: CCP Deviation Alerts
**Jako** QC Supervisor
**Chce** otrzymywac alerty o odchyleniach CCP
**Aby** szybko reagowac na problemy

**Acceptance Criteria:**
- [ ] Automatyczny alert gdy ccp_reading poza zakresem
- [ ] Alert widoczny na dashboard QC
- [ ] Email notification (opcjonalne - setting)
- [ ] Lista otwartych deviations do rozwiazania
- [ ] Deviation wymaga zamkniecia z corrective action

**Technical Notes:**
- Trigger po INSERT ccp_readings gdzie is_in_range = false
- Tabela ccp_deviations lub rozszerzenie ccp_readings
- Notification service (WebSocket lub email)

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.8: HACCP Report
**Jako** QC Manager
**Chce** generowac raport HACCP dla audytu
**Aby** udokumentowac zgodnosc procesu

**Acceptance Criteria:**
- [ ] Raport per WO lub zakres dat
- [ ] Zawiera: wszystkie CCP, wszystkie odczyty
- [ ] Zawiera: deviacje i corrective actions
- [ ] Format: PDF gotowy do audytu
- [ ] Podpis elektroniczny (opcjonalnie)

**Technical Notes:**
- PDF generation (react-pdf lub server-side)
- Template zgodny z wymaganiami HACCP

**Priority:** Should Have
**Estimate:** M

---

### 2.3 Specification Management

#### Story 6.9: Product Specifications
**Jako** Technical Officer
**Chce** definiowac specyfikacje jakosciowe dla produktow
**Aby** testowac partie wobec ustalonych limitow

**Acceptance Criteria:**
- [ ] Specyfikacja per produkt (1:N)
- [ ] Atrybut: nazwa, typ (numeric, text, boolean)
- [ ] Numeric: min, max, target, unit
- [ ] Text: dozwolone wartosci (lista)
- [ ] is_critical: czy blokuje QA pass
- [ ] test_method: opisowa metoda testowania
- [ ] UI na stronie produktu

**Technical Notes:**
- Tabela specifications (juz w 06-quality.md)
- Rozszerzyc o allowed_values dla text type

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.10: Custom Specification Attributes
**Jako** Technical Officer
**Chce** tworzyc wlasne atrybuty specyfikacji
**Aby** dostosowac do specyfiki produktow

**Acceptance Criteria:**
- [ ] Dowolna nazwa atrybutu (user-defined)
- [ ] Przyklady: Brix, Viscosity, Moisture, Color Score
- [ ] Sugestie z poprzednich uzyc (autocomplete)
- [ ] Jednostki konfigurowalne

**Technical Notes:**
- Pole attribute_name jako VARCHAR bez enum
- Osobna tabela spec_attribute_templates dla sugestii

**Priority:** Should Have
**Estimate:** S

---

#### Story 6.11: Specification Version History
**Jako** Technical Officer
**Chce** sledzic zmiany specyfikacji w czasie
**Aby** wiedziec jakie limity obowiazywaly w przeszlosci

**Acceptance Criteria:**
- [ ] effective_from, effective_to na specyfikacji
- [ ] Tylko jedna aktywna wersja per atrybut/produkt
- [ ] Historia wersji widoczna w UI
- [ ] Test results linkowane do aktywnej wersji

**Technical Notes:**
- Dodac effective_from, effective_to do specifications
- Podobny pattern jak BOM versioning

**Priority:** Should Have
**Estimate:** M

---

### 2.4 Test Results Recording

#### Story 6.12: Record Test Result
**Jako** QC Inspector
**Chce** rejestrowac wyniki testow dla LP
**Aby** dokumentowac jakosc partii

**Acceptance Criteria:**
- [ ] Formularz: wybor LP, wybor specyfikacji
- [ ] Wpisanie wartosci wyniku
- [ ] Auto-calculate: pass/fail wobec limitow
- [ ] Notatki dodatkowe
- [ ] equipment_id (opcjonalnie)
- [ ] Zapis z timestamp i user

**Technical Notes:**
- Tabela quality_tests (juz w 06-quality.md)
- Walidacja: wynik numeric dla numeric spec, etc.

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.13: Test History per LP
**Jako** QC Inspector
**Chce** widziec historie testow dla LP
**Aby** analizowac trend jakosci

**Acceptance Criteria:**
- [ ] Lista testow na LP detail page
- [ ] Sortowanie po dacie
- [ ] Kolorowe oznaczenie pass/fail
- [ ] Link do szczegolu testu

**Technical Notes:**
- Query quality_tests WHERE lp_id = X
- Komponent TestHistoryList

**Priority:** Should Have
**Estimate:** S

---

#### Story 6.14: Batch Testing
**Jako** QC Inspector
**Chce** rejestrowac testy dla wielu LP naraz
**Aby** przyspieszyc testowanie calych partii

**Acceptance Criteria:**
- [ ] Wybor wielu LP (checkboxy lub scan)
- [ ] Jeden wynik stosowany do wszystkich
- [ ] Indywidualne pass/fail per LP
- [ ] Bulk zapis

**Technical Notes:**
- Bulk insert do quality_tests
- Transakcja atomowa

**Priority:** Could Have
**Estimate:** M

---

### 2.5 NCR Workflow

#### Story 6.15: Create NCR
**Jako** QC Inspector
**Chce** utworzyc NCR dla problemu jakosciowego
**Aby** uchwycic i sledzic niezgodnosc

**Acceptance Criteria:**
- [ ] Formularz: opis problemu, severity (minor/major/critical)
- [ ] Linkowanie do: LP, WO, PO, Product (opcjonalne)
- [ ] Typ: material, process, product, supplier
- [ ] Automatyczny numer NCR-YYYY-NNNN
- [ ] Status: open

**Technical Notes:**
- Tabela ncrs (juz w 06-quality.md)
- Service ncr-service.ts

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.16: NCR Investigation
**Jako** QC Supervisor
**Chce** prowadzic dochodzenie NCR
**Aby** zidentyfikowac przyczyne

**Acceptance Criteria:**
- [ ] Przypisanie osoby odpowiedzialnej
- [ ] Status: open -> investigating
- [ ] Pole root_cause (text)
- [ ] Mozliwosc dodawania notatek
- [ ] Zalaczniki (zdjecia, dokumenty)

**Technical Notes:**
- Rozszerzyc ncrs o assigned_to
- Tabela ncr_attachments lub Supabase Storage

**Priority:** Must Have
**Estimate:** M

---

#### Story 6.17: NCR Corrective Action
**Jako** QC Supervisor
**Chce** definiowac dzialania naprawcze
**Aby** zapobiec powtorzeniu problemu

**Acceptance Criteria:**
- [ ] Status: investigating -> corrective_action
- [ ] Pole corrective_action (text)
- [ ] Pole preventive_action (text)
- [ ] Due date dla akcji
- [ ] Tracking completion

**Technical Notes:**
- Pola juz w ncrs table
- UI: timeline view akcji

**Priority:** Must Have
**Estimate:** S

---

#### Story 6.18: NCR Close with CAPA
**Jako** Technical Officer
**Chce** zamknac NCR po zakonczeniu akcji
**Aby** udokumentowac rozwiazanie

**Acceptance Criteria:**
- [ ] Tylko Technical Officer lub QC Supervisor moze zamknac
- [ ] Wymagane: resolution_notes
- [ ] Wymagane: potwierdzenie CAPA (checkbox)
- [ ] Status: corrective_action -> closed
- [ ] closed_by, closed_at zapisane

**Technical Notes:**
- Permission check w service
- Walidacja required fields

**Priority:** Must Have
**Estimate:** S

---

#### Story 6.19: NCR Linking
**Jako** QC Inspector
**Chce** widziec NCR powiazane z LP/WO/PO
**Aby** miec pelny obraz problemu

**Acceptance Criteria:**
- [ ] Na LP detail: lista powiazanych NCR
- [ ] Na WO detail: lista powiazanych NCR
- [ ] Na PO detail: lista powiazanych NCR
- [ ] Link do NCR detail

**Technical Notes:**
- Query ncrs WHERE lp_id/wo_id/po_id = X
- Komponenty NCRBadge, NCRList

**Priority:** Should Have
**Estimate:** S

---

#### Story 6.20: NCR Dashboard Widget
**Jako** QC Manager
**Chce** widziec podsumowanie NCR na dashboardzie
**Aby** monitorowac stan jakosci

**Acceptance Criteria:**
- [ ] Liczba otwartych NCR (open + investigating + corrective_action)
- [ ] NCR by severity (pie chart)
- [ ] NCR by type (bar chart)
- [ ] Overdue NCR (due_date < today)
- [ ] Link do listy NCR

**Technical Notes:**
- Agregacje w API /api/quality/dashboard
- Charts: recharts lub chart.js

**Priority:** Should Have
**Estimate:** M

---

### 2.6 CoA Management

#### Story 6.21: CoA Upload on Receipt
**Jako** Warehouse Operator
**Chce** zaladowac CoA podczas przyjecia towaru
**Aby** udokumentowac jakosc od dostawcy

**Acceptance Criteria:**
- [ ] Podczas GRN: przycisk "Add CoA"
- [ ] Upload PDF/image
- [ ] Pola: certificate_number, issue_date
- [ ] Linkowanie do GRN i supplier
- [ ] Status: pending verification

**Technical Notes:**
- Supabase Storage dla plikow
- Tabela coas (juz w 06-quality.md)

**Priority:** Should Have
**Estimate:** M

---

#### Story 6.22: CoA Verification
**Jako** QC Supervisor
**Chce** weryfikowac otrzymane CoA
**Aby** potwierdzic zgodnosc materialu

**Acceptance Criteria:**
- [ ] Lista CoA do weryfikacji (status: pending)
- [ ] Przegladanie dokumentu (PDF viewer)
- [ ] Oznacz jako: verified lub rejected
- [ ] Notatki z weryfikacji
- [ ] verified_by, verified_at

**Technical Notes:**
- Status enum: pending, verified, rejected
- PDF viewer komponent

**Priority:** Should Have
**Estimate:** S

---

#### Story 6.23: CoA Requirement per Product
**Jako** Technical Officer
**Chce** wymagac CoA dla wybranych produktow
**Aby** zapewnic dokumentacje jakosci

**Acceptance Criteria:**
- [ ] Pole require_coa na produkcie (boolean)
- [ ] Jezeli true: GRN incomplete bez CoA
- [ ] Warning lub block (konfigurowalne)
- [ ] Lista produktow wymagajacych CoA

**Technical Notes:**
- Dodac require_coa do products
- Check w grn-receive service

**Priority:** Should Have
**Estimate:** S

---

#### Story 6.24: CoA with Shipment
**Jako** Shipping Manager
**Chce** dolaczac CoA do wysylki
**Aby** klient otrzymal dokumentacje jakosci

**Acceptance Criteria:**
- [ ] Podczas Ship: opcja "Include CoA"
- [ ] Wybor CoA dla LP w shipment
- [ ] Generowanie zbiorczego PDF
- [ ] Email lub print z shipment

**Technical Notes:**
- Linkowanie shipment -> coas
- PDF merge lub generation

**Priority:** Could Have
**Estimate:** M

---

### 2.7 Quality Dashboard & Reports

#### Story 6.25: Quality Dashboard
**Jako** QC Manager
**Chce** widziec dashboard jakosci
**Aby** monitorowac KPIs

**Acceptance Criteria:**
- [ ] Widgets: Pending QA (count), Open Holds (count), Open NCR (count)
- [ ] QA Pass Rate (% last 30 days)
- [ ] NCR by Type (chart)
- [ ] CCP Deviations (chart)
- [ ] Recent QA Activity (feed)

**Technical Notes:**
- Route /quality/dashboard
- API /api/quality/dashboard

**Priority:** Must Have
**Estimate:** L

---

#### Story 6.26: Quality Inspection Widget (Pending)
**Jako** QC Inspector
**Chce** widziec liste LP oczekujacych inspekcji
**Aby** szybko przejsc do pracy

**Acceptance Criteria:**
- [ ] Lista LP z qa_status = pending
- [ ] Sortowanie: oldest first (FIFO)
- [ ] Quick action: Pass / Fail / Hold
- [ ] Link do LP detail

**Technical Notes:**
- Widget komponent
- API: GET /api/quality/pending-inspections

**Priority:** Should Have
**Estimate:** S

---

#### Story 6.27: Quality Reports
**Jako** QC Manager
**Chce** generowac raporty jakosciowe
**Aby** analizowac trendy i audyty

**Acceptance Criteria:**
- [ ] Raport: NCR Summary (by period)
- [ ] Raport: CoA Compliance
- [ ] Raport: Supplier Quality Score
- [ ] Raport: HACCP/CCP Summary
- [ ] Export: PDF, Excel

**Technical Notes:**
- Report generation service
- Template per report type

**Priority:** Should Have
**Estimate:** L

---

#### Story 6.28: Supplier Quality Metrics
**Jako** QC Manager
**Chce** sledzic jakosc dostaw od dostawcow
**Aby** oceniac i wybierac dostawcow

**Acceptance Criteria:**
- [ ] Per supplier: % partii passed
- [ ] Per supplier: liczba NCR
- [ ] Per supplier: average lead time
- [ ] Ranking dostawcow
- [ ] Historical trend

**Technical Notes:**
- Agregacja z quality_tests, ncrs, grns
- Dashboard widget lub osobny report

**Priority:** Should Have
**Estimate:** M

---

### 2.8 Quality Settings

#### Story 6.29: Quality Settings Page
**Jako** Admin
**Chce** konfigurowac ustawienia modulu Quality
**Aby** dostosowac do procesow firmy

**Acceptance Criteria:**
- [ ] Strona /settings/quality
- [ ] Wszystkie settings z tabeli quality_settings
- [ ] Save z walidacja
- [ ] Reset to defaults

**Technical Notes:**
- Route i komponent SettingsQuality
- API GET/PUT /api/quality/settings

**Priority:** Must Have
**Estimate:** M

---

### 2.9 Scanner QA Workflows

#### Story 6.30: Scanner QA Pass/Fail
**Jako** QC Inspector
**Chce** zmieniac status QA na scannerze
**Aby** pracowac w terenie

**Acceptance Criteria:**
- [ ] Skanuj LP -> pokaz status QA
- [ ] Przyciski: Pass, Fail, Hold
- [ ] Fail/Hold: wymagane notatki
- [ ] Potwierdzenie zmiany
- [ ] Print label (opcjonalnie)

**Technical Notes:**
- Route /scanner/quality/inspect
- Mobile-optimized UI

**Priority:** Should Have
**Estimate:** M

---

#### Story 6.31: Scanner Quick Test
**Jako** QC Inspector
**Chce** rejestrowac szybki test na scannerze
**Aby** dokumentowac wyniki in-line

**Acceptance Criteria:**
- [ ] Skanuj LP -> wybierz atrybut
- [ ] Wpisz wartosc
- [ ] Auto pass/fail wobec spec
- [ ] Zapisz i kontynuuj

**Technical Notes:**
- Route /scanner/quality/test
- Numeric keyboard dla wartosci

**Priority:** Could Have
**Estimate:** M

---

#### Story 6.32: Scanner CCP Reading
**Jako** Operator
**Chce** rejestrowac odczyty CCP na scannerze
**Aby** dokumentowac monitoring procesu

**Acceptance Criteria:**
- [ ] Skanuj WO -> lista CCP do monitorowania
- [ ] Wybierz CCP, wpisz wartosc
- [ ] Auto-check zakres, pokaz pass/fail
- [ ] Jezeli fail: wymagane notatki
- [ ] Historia odczytow WO

**Technical Notes:**
- Route /scanner/production/ccp
- Link do ccp_readings table

**Priority:** Should Have
**Estimate:** M

---

### 2.10 Quality Audit Trail

#### Story 6.33: Quality Audit Log
**Jako** QC Manager
**Chce** widziec pelna historie zmian jakosciowych
**Aby** spelniac wymagania audytowe

**Acceptance Criteria:**
- [ ] Log: kazda zmiana qa_status
- [ ] Log: kazdy test result
- [ ] Log: kazda zmiana NCR
- [ ] Log: kazde release/dispose hold
- [ ] Filtry: entity, user, date range
- [ ] Export dla audytu

**Technical Notes:**
- Tabela quality_audit (juz zdefiniowana)
- Triggers lub service layer logging

**Priority:** Must Have
**Estimate:** M

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 6.1 | QA Status on LP | Must | M | PLANNED |
| 6.2 | QA Status Transitions | Must | M | PLANNED |
| 6.3 | Prevent Shipping Non-Passed | Must | S | PLANNED |
| 6.4 | Control Pending Consumption | Must | S | PLANNED |
| 6.5 | CCP Definition | Must | L | PLANNED |
| 6.6 | CCP Monitoring per WO | Must | L | PLANNED |
| 6.7 | CCP Deviation Alerts | Must | M | PLANNED |
| 6.8 | HACCP Report | Should | M | PLANNED |
| 6.9 | Product Specifications | Must | M | PLANNED |
| 6.10 | Custom Spec Attributes | Should | S | PLANNED |
| 6.11 | Spec Version History | Should | M | PLANNED |
| 6.12 | Record Test Result | Must | M | PLANNED |
| 6.13 | Test History per LP | Should | S | PLANNED |
| 6.14 | Batch Testing | Could | M | PLANNED |
| 6.15 | Create NCR | Must | M | PLANNED |
| 6.16 | NCR Investigation | Must | M | PLANNED |
| 6.17 | NCR Corrective Action | Must | S | PLANNED |
| 6.18 | NCR Close with CAPA | Must | S | PLANNED |
| 6.19 | NCR Linking | Should | S | PLANNED |
| 6.20 | NCR Dashboard Widget | Should | M | PLANNED |
| 6.21 | CoA Upload on Receipt | Should | M | PLANNED |
| 6.22 | CoA Verification | Should | S | PLANNED |
| 6.23 | CoA Requirement per Product | Should | S | PLANNED |
| 6.24 | CoA with Shipment | Could | M | PLANNED |
| 6.25 | Quality Dashboard | Must | L | PLANNED |
| 6.26 | Pending Inspection Widget | Should | S | PLANNED |
| 6.27 | Quality Reports | Should | L | PLANNED |
| 6.28 | Supplier Quality Metrics | Should | M | PLANNED |
| 6.29 | Quality Settings Page | Must | M | PLANNED |
| 6.30 | Scanner QA Pass/Fail | Should | M | PLANNED |
| 6.31 | Scanner Quick Test | Could | M | PLANNED |
| 6.32 | Scanner CCP Reading | Should | M | PLANNED |
| 6.33 | Quality Audit Log | Must | M | PLANNED |

**Totals:**
- Must Have: 17 stories
- Should Have: 12 stories
- Could Have: 4 stories
- **Total:** 33 stories

---

## 4. Database Schema (Additional)

### 4.1 routing_ccps
```sql
CREATE TABLE routing_ccps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    routing_id UUID NOT NULL REFERENCES routings(id),
    operation_id UUID REFERENCES routing_operations(id),
    ccp_name VARCHAR(100) NOT NULL,
    ccp_type VARCHAR(50) NOT NULL, -- temperature, time, pH, humidity, etc.
    min_value NUMERIC(15,4),
    max_value NUMERIC(15,4),
    target_value NUMERIC(15,4),
    unit VARCHAR(20),
    monitoring_frequency VARCHAR(50), -- e.g., "every 30 min", "per batch"
    corrective_action TEXT,
    is_critical BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 ccp_readings
```sql
CREATE TABLE ccp_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    wo_id UUID NOT NULL REFERENCES work_orders(id),
    ccp_id UUID NOT NULL REFERENCES routing_ccps(id),
    reading_value NUMERIC(15,4) NOT NULL,
    reading_unit VARCHAR(20),
    reading_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id),
    is_in_range BOOLEAN NOT NULL,
    is_deviation BOOLEAN DEFAULT false,
    deviation_notes TEXT,
    corrective_action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 ccp_deviations (optional, can use is_deviation in readings)
```sql
CREATE TABLE ccp_deviations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    reading_id UUID NOT NULL REFERENCES ccp_readings(id),
    wo_id UUID NOT NULL REFERENCES work_orders(id),
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- open, investigating, resolved
    assigned_to UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| QC-FR-01: Track QA status on every LP | 6.1, 6.2 | Pelna kontrola jakosci |
| QC-FR-02: Enforce status transitions | 6.2 | Zgodnosc z procesem |
| QC-FR-03: Prevent shipping non-passed LPs | 6.3 | Ochrona klienta |
| QC-FR-04: Control consumption of pending LPs | 6.4 | Elastycznosc procesu |
| HACCP-01: Define CCP per routing | 6.5 | Zgodnosc HACCP |
| HACCP-02: Monitor CCP during production | 6.6, 6.32 | Zgodnosc HACCP |
| HACCP-03: Alert on CCP deviation | 6.7 | Szybka reakcja |
| HACCP-04: HACCP documentation | 6.8 | Audit-ready |
| SPEC-01: Product specifications | 6.9, 6.10, 6.11 | Kontrola jakosci |
| TEST-01: Record test results | 6.12, 6.13, 6.14 | Dokumentacja |
| NCR-01: Create and track NCR | 6.15-6.20 | CAPA process |
| COA-01: Manage supplier certificates | 6.21-6.24 | Dokumentacja dostawcy |
| DASH-01: Quality monitoring | 6.25-6.28 | Widocznosc KPI |
| SCAN-01: Mobile QA workflows | 6.30-6.32 | Efektywnosc pracy |
| AUDIT-01: Quality audit trail | 6.33 | Compliance |

---

## 6. Dependencies

### 6.1 From Other Modules
- **Epic 1 (Settings):** Users, roles, org configuration
- **Epic 5 (Warehouse):** LP table, qa_status field
- **Epic 2 (Technical):** Products, routings
- **Epic 4 (Production):** Work orders for CCP monitoring

### 6.2 To Other Modules
- **Epic 7 (Shipping):** QA status validation for picking
- **Epic 4 (Production):** Consumption blocking for failed LP

---

## 7. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| HACCP complexity | Medium | High | Start with basic CCP, expand |
| User adoption for CCP monitoring | Medium | Medium | Training, scanner workflow |
| Audit trail performance | Low | Medium | Indexes, archival strategy |
| CoA storage cost | Low | Low | Document retention policy |

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Quality PRD |
| 2.0 | 2025-12-09 | PM-Agent | Enhanced with HACCP/CCP, extended NCR |
