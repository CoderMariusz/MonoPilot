# Epic 9: OEE & Performance Tracking - Phase 3

**Status:** PLANNED
**Priority:** P1 - Krytyczna luka konkurencyjna (4/4 konkurentow ma)
**Stories:** 25
**Estimated Effort:** 8-10 tygodni
**Dependencies:** Epic 4 (Production), Epic 10 (IIoT - optional)

---

## 1. Overview

### 1.1 Cel Epica

Modul OEE (Overall Equipment Effectiveness) & Performance zarzadza sledzeniem wydajnosci produkcji, wlaczajac:
- **Real-time OEE Tracking** - automatyczne obliczanie OEE
- **Downtime Tracking** - rejestracja i kategoryzacja przestojow
- **Performance Dashboards** - wizualizacja wydajnosci
- **Machine Utilization** - analiza wykorzystania maszyn

### 1.2 Luki Konkurencyjne Zamykane

| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| Real-time OEE Tracking | 4/4 maja | Implementowane w tym epicu |
| Downtime Tracking | 4/4 maja | Implementowane w tym epicu |
| Performance Dashboards | 4/4 maja | Implementowane w tym epicu |
| Machine Utilization | 3/4 maja | Implementowane w tym epicu |

### 1.3 Business Value

- **Widocznosc:** Real-time insight w wydajnosc produkcji
- **Redukcja strat:** Identyfikacja glownych przyczyn przestojow
- **Benchmarking:** Porownanie maszyn, linii, zmian
- **Ciagle doskonalenie:** Dane do inicjatyw lean/TPM

### 1.4 OEE Formula

```
OEE = Availability x Performance x Quality

Availability = (Actual Run Time / Planned Production Time) x 100%
Performance = (Ideal Cycle Time x Total Count / Actual Run Time) x 100%
Quality = (Good Count / Total Count) x 100%
```

---

## 2. User Stories

### 2.1 Machine Setup

#### Story 9.1: Machine Performance Configuration

**Jako** Production Manager
**Chce** skonfigurowac parametry wydajnosci maszyny
**Aby** moc obliczac OEE

**Acceptance Criteria:**
- [ ] Rozszerzenie tabeli machines o:
  - ideal_cycle_time_seconds - teoretyczny czas cyklu
  - standard_capacity_per_hour - standardowa wydajnosc
  - planned_downtime_per_shift - planowany przestoj (przerwy, czyszczenie)
- [ ] UI do konfiguracji per maszyna
- [ ] Mozliwosc roznych parametrow per produkt na maszynie
- [ ] Default values dla nowych maszyn

**Technical Notes:**
```sql
ALTER TABLE machines ADD COLUMN ideal_cycle_time_seconds NUMERIC(10,2);
ALTER TABLE machines ADD COLUMN standard_capacity_per_hour NUMERIC(10,2);
ALTER TABLE machines ADD COLUMN planned_downtime_minutes INTEGER DEFAULT 0;

CREATE TABLE machine_product_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id),
    product_id UUID NOT NULL REFERENCES products(id),
    ideal_cycle_time_seconds NUMERIC(10,2),
    standard_capacity_per_hour NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, product_id)
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.2: Shift Configuration

**Jako** Admin
**Chce** definiowac zmiany produkcyjne
**Aby** obliczac planned production time

**Acceptance Criteria:**
- [ ] CRUD dla shift definitions
- [ ] Kazda zmiana: nazwa, start_time, end_time
- [ ] Dni tygodnia per zmiana
- [ ] Przerwy wliczone w planned downtime
- [ ] Kalendarz wyjatkow (swieta, nieplanowane dni)

**Technical Notes:**
```sql
CREATE TABLE production_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[], -- 0=Sun, 1=Mon, etc.
    break_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.2 Downtime Tracking

#### Story 9.3: Downtime Event Recording

**Jako** Operator
**Chce** rejestrowac przestoje maszyny
**Aby** dokumentowac przyczyny zatrzyman

**Acceptance Criteria:**
- [ ] Przycisk "Record Downtime" na maszynie lub WO
- [ ] Start time, end time (lub "still down")
- [ ] Kategoria przestoju (z listy)
- [ ] Przyczyna (tekst lub z listy)
- [ ] Mozliwosc dodania notatek
- [ ] Powiazanie z WO (jesli dotyczy)

**Technical Notes:**
```sql
CREATE TABLE downtime_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    machine_id UUID NOT NULL REFERENCES machines(id),
    wo_id UUID REFERENCES work_orders(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    category_id UUID REFERENCES downtime_categories(id),
    reason TEXT,
    notes TEXT,
    is_planned BOOLEAN DEFAULT false,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.4: Downtime Categories

**Jako** Production Manager
**Chce** definiowac kategorie przestojow
**Aby** klasyfikowac przyczyny

**Acceptance Criteria:**
- [ ] CRUD dla kategorii przestojow
- [ ] Hierarchia: kategoria -> podkategoria
- [ ] Przyklad: Mechanical -> Breakdown, Maintenance
- [ ] is_planned flag (np. Changeover = planned)
- [ ] Kolor dla wizualizacji
- [ ] Default categories przy setup

**Technical Notes:**
```sql
CREATE TABLE downtime_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES downtime_categories(id),
    is_planned BOOLEAN DEFAULT false,
    color VARCHAR(7), -- hex color
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.5: Quick Downtime from Scanner

**Jako** Operator
**Chce** szybko zarejestrowac przestoj na scannerze
**Aby** nie przerywac pracy

**Acceptance Criteria:**
- [ ] Skanuj maszyne -> "Downtime Start"
- [ ] Wybor kategorii (duze przyciski)
- [ ] Opcjonalne notatki
- [ ] "Downtime End" zamyka ostatni otwarty
- [ ] Czas trwania obliczany automatycznie

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.6: Downtime Timeline View

**Jako** Production Manager
**Chce** widziec timeline przestojow
**Aby** analizowac wzorce

**Acceptance Criteria:**
- [ ] Gantt-like view per maszyna/dzien
- [ ] Kolorowanie wg kategorii
- [ ] Hover: szczegoly przestoju
- [ ] Click: edycja/szczegoly
- [ ] Filtry: maszyna, data, kategoria

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

### 2.3 Production Counting

#### Story 9.7: Production Count Recording

**Jako** Operator
**Chce** rejestrowac ilosc wyprodukowana
**Aby** obliczac performance i quality

**Acceptance Criteria:**
- [ ] Per WO: total_count, good_count, reject_count
- [ ] Mozliwosc wpisywania w trakcie produkcji
- [ ] Auto-update przy tworzeniu LP output
- [ ] reject_count = total_count - good_count
- [ ] Reject reasons (opcjonalnie)

**Technical Notes:**
- Rozszerzyc work_orders o: total_count, good_count, reject_count
- Lub osobna tabela production_counts per period

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.8: Scrap/Reject Categorization

**Jako** Quality Manager
**Chce** kategoryzowac odrzuty
**Aby** analizowac przyczyny jakosci

**Acceptance Criteria:**
- [ ] Kategorie reject reasons (analogicznie do downtime)
- [ ] Przy rejestracji reject: wybor przyczyny
- [ ] Pareto chart reject reasons
- [ ] Trend reject rate over time

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.4 OEE Calculation

#### Story 9.9: OEE Calculation Engine

**Jako** System
**Chce** obliczac OEE automatycznie
**Aby** dostarczac metryki w real-time

**Acceptance Criteria:**
- [ ] Kalkulacja OEE per maszyna per zmiana
- [ ] Kalkulacja OEE per WO
- [ ] Skladowe: Availability, Performance, Quality
- [ ] Zapisywanie wynikow do tabeli
- [ ] Recalculation przy zmianie danych

**Technical Notes:**
```sql
CREATE TABLE oee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    machine_id UUID NOT NULL REFERENCES machines(id),
    shift_id UUID REFERENCES production_shifts(id),
    wo_id UUID REFERENCES work_orders(id),
    record_date DATE NOT NULL,

    -- Time metrics (minutes)
    planned_time INTEGER NOT NULL,
    actual_run_time INTEGER NOT NULL,
    downtime_total INTEGER NOT NULL,
    downtime_planned INTEGER NOT NULL,
    downtime_unplanned INTEGER NOT NULL,

    -- Count metrics
    total_count INTEGER,
    good_count INTEGER,
    reject_count INTEGER,

    -- OEE components (%)
    availability_pct NUMERIC(5,2),
    performance_pct NUMERIC(5,2),
    quality_pct NUMERIC(5,2),
    oee_pct NUMERIC(5,2),

    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 9.10: OEE Real-Time Display

**Jako** Production Manager
**Chce** widziec OEE w czasie rzeczywistym
**Aby** reagowac na problemy

**Acceptance Criteria:**
- [ ] Widget z aktualnym OEE (today, current shift)
- [ ] Gauge visualization (0-100%)
- [ ] Breakdown: A, P, Q
- [ ] Color coding: red < 60%, yellow 60-85%, green > 85%
- [ ] Auto-refresh co minute

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.5 Performance Dashboards

#### Story 9.11: OEE Dashboard

**Jako** Production Manager
**Chce** widziec dashboard OEE
**Aby** monitorowac wydajnosc

**Acceptance Criteria:**
- [ ] Summary widgets: OEE dzis, tydzien, miesiac
- [ ] Trend chart OEE over time
- [ ] Breakdown by machine (bar chart)
- [ ] Top 5 downtime reasons (pareto)
- [ ] Shift comparison

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 9.12: Machine Performance Dashboard

**Jako** Production Manager
**Chce** widziec wydajnosc per maszyna
**Aby** identyfikowac bottlenecks

**Acceptance Criteria:**
- [ ] Grid wszystkich maszyn z OEE
- [ ] Status: running / idle / down
- [ ] Current WO (jesli aktywne)
- [ ] Sparkline OEE last 7 days
- [ ] Click: drill-down do szczegulow

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 9.13: Production Line View

**Jako** Production Manager
**Chce** widziec wydajnosc calej linii
**Aby** optymalizowac przepustowość

**Acceptance Criteria:**
- [ ] Grupowanie maszyn w linie
- [ ] Aggregate OEE per linia
- [ ] Bottleneck identification
- [ ] Sankey diagram flow (opcjonalnie)

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.6 Reports & Analytics

#### Story 9.14: OEE Report

**Jako** Operations Director
**Chce** generowac raport OEE
**Aby** prezentowac wyniki zarzadowi

**Acceptance Criteria:**
- [ ] Zakres dat, maszyny, zmiany
- [ ] Summary: average OEE, A, P, Q
- [ ] Trend charts
- [ ] Top issues (downtime, reject)
- [ ] Export: PDF, Excel

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.15: Downtime Analysis Report

**Jako** Maintenance Manager
**Chce** analizowac przestoje
**Aby** planowac dzialania naprawcze

**Acceptance Criteria:**
- [ ] Total downtime by category (pareto)
- [ ] Downtime by machine
- [ ] Mean Time Between Failures (MTBF)
- [ ] Mean Time To Repair (MTTR)
- [ ] Trend over time

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.16: Shift Performance Comparison

**Jako** Production Manager
**Chce** porownywac wydajnosc zmian
**Aby** identyfikowac best practices

**Acceptance Criteria:**
- [ ] OEE per zmiana (bar chart)
- [ ] Performance drivers comparison
- [ ] Downtime comparison
- [ ] Reject rate comparison

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.17: Loss Analysis (Six Big Losses)

**Jako** Continuous Improvement Manager
**Chce** widziec 6 wielkich strat
**Aby** priorytetyzowac dzialania

**Acceptance Criteria:**
- [ ] Breakdown wg TPM 6 Losses:
  1. Breakdowns (Availability)
  2. Setup/Changeover (Availability)
  3. Small Stops (Performance)
  4. Slow Running (Performance)
  5. Startup Rejects (Quality)
  6. Production Rejects (Quality)
- [ ] Waterfall chart impact
- [ ] Pareto analysis

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

### 2.7 Alerts & Notifications

#### Story 9.18: OEE Threshold Alerts

**Jako** Production Manager
**Chce** otrzymywac alerty gdy OEE spada
**Aby** szybko reagowac

**Acceptance Criteria:**
- [ ] Konfigurowalne progi per maszyna
- [ ] Alert gdy OEE < threshold
- [ ] Alert na dashboardzie
- [ ] Email notification (opcjonalne)
- [ ] Eskalacja przy dlugotrwalym problemie

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.19: Downtime Duration Alerts

**Jako** Production Manager
**Chce** byc powiadamiany o dlugich przestojach
**Aby** eskalowac problem

**Acceptance Criteria:**
- [ ] Alert gdy downtime > X minut
- [ ] Rozne progi dla roznych kategorii
- [ ] Push notification
- [ ] Dashboard highlight

**Priority:** Should Have
**Estimate:** S
**Phase:** 3

---

### 2.8 Integration Points

#### Story 9.20: WO Integration

**Jako** System
**Chce** integrowac OEE z Work Orders
**Aby** automatycznie zbierac dane

**Acceptance Criteria:**
- [ ] WO start/complete = run time
- [ ] WO output = good count
- [ ] WO scrap = reject count
- [ ] Automatyczne powiazanie z maszyna

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.21: IIoT Integration (Optional)

**Jako** System
**Chce** pobierac dane z sensorow
**Aby** miec automatyczne pomiary

**Acceptance Criteria:**
- [ ] Machine status z PLC (running/stopped)
- [ ] Automatic cycle counting
- [ ] Automatic downtime detection
- [ ] Dependency na Epic 10 (IIoT)

**Priority:** Could Have
**Estimate:** L
**Phase:** 3

---

### 2.9 Settings

#### Story 9.22: OEE Settings Page

**Jako** Admin
**Chce** konfigurowac modul OEE
**Aby** dostosowac do procesow

**Acceptance Criteria:**
- [ ] Default OEE targets
- [ ] Default downtime categories
- [ ] Alert thresholds
- [ ] Calculation method options
- [ ] Shift configuration link

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.10 Historical Analysis

#### Story 9.23: OEE Trend Analysis

**Jako** Operations Director
**Chce** analizowac trendy OEE
**Aby** mierzyc postep

**Acceptance Criteria:**
- [ ] OEE trend: daily, weekly, monthly
- [ ] Rolling average
- [ ] YoY comparison
- [ ] Benchmark lines
- [ ] Annotation dla wydarzen (np. nowa maszyna)

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.24: Best/Worst Day Analysis

**Jako** Production Manager
**Chce** analizowac najlepsze/najgorsze dni
**Aby** zrozumiec przyczyny

**Acceptance Criteria:**
- [ ] Top 5 / Bottom 5 days by OEE
- [ ] Drill-down do przyczyn
- [ ] What was different (WO, product, operator)
- [ ] Lessons learned documentation

**Priority:** Could Have
**Estimate:** M
**Phase:** 3

---

#### Story 9.25: OEE Audit Trail

**Jako** Auditor
**Chce** widziec historie zmian danych OEE
**Aby** weryfikowac dokladnosc

**Acceptance Criteria:**
- [ ] Log edycji downtime events
- [ ] Log edycji count data
- [ ] Who changed, when, old/new values
- [ ] Export dla auditu

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 9.1 | Machine Performance Configuration | Must | M | PLANNED |
| 9.2 | Shift Configuration | Must | M | PLANNED |
| 9.3 | Downtime Event Recording | Must | M | PLANNED |
| 9.4 | Downtime Categories | Must | M | PLANNED |
| 9.5 | Quick Downtime from Scanner | Should | M | PLANNED |
| 9.6 | Downtime Timeline View | Should | L | PLANNED |
| 9.7 | Production Count Recording | Must | M | PLANNED |
| 9.8 | Scrap/Reject Categorization | Should | M | PLANNED |
| 9.9 | OEE Calculation Engine | Must | L | PLANNED |
| 9.10 | OEE Real-Time Display | Must | M | PLANNED |
| 9.11 | OEE Dashboard | Must | L | PLANNED |
| 9.12 | Machine Performance Dashboard | Must | L | PLANNED |
| 9.13 | Production Line View | Should | M | PLANNED |
| 9.14 | OEE Report | Must | M | PLANNED |
| 9.15 | Downtime Analysis Report | Must | M | PLANNED |
| 9.16 | Shift Performance Comparison | Should | M | PLANNED |
| 9.17 | Loss Analysis (Six Big Losses) | Should | L | PLANNED |
| 9.18 | OEE Threshold Alerts | Should | M | PLANNED |
| 9.19 | Downtime Duration Alerts | Should | S | PLANNED |
| 9.20 | WO Integration | Must | M | PLANNED |
| 9.21 | IIoT Integration (Optional) | Could | L | PLANNED |
| 9.22 | OEE Settings Page | Must | M | PLANNED |
| 9.23 | OEE Trend Analysis | Should | M | PLANNED |
| 9.24 | Best/Worst Day Analysis | Could | M | PLANNED |
| 9.25 | OEE Audit Trail | Must | M | PLANNED |

**Totals:**
- Must Have: 14 stories
- Should Have: 9 stories
- Could Have: 2 stories
- **Total:** 25 stories

---

## 4. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| OEE-FR-01: Machine configuration | 9.1 | Parametry OEE |
| OEE-FR-02: Shift management | 9.2 | Planned time |
| OEE-FR-03: Downtime tracking | 9.3, 9.4, 9.5, 9.6 | Availability |
| OEE-FR-04: Production counting | 9.7, 9.8 | Performance & Quality |
| OEE-FR-05: OEE calculation | 9.9, 9.10 | Core metric |
| OEE-FR-06: Dashboards | 9.11, 9.12, 9.13 | Visibility |
| OEE-FR-07: Reports | 9.14, 9.15, 9.16, 9.17 | Analysis |
| OEE-FR-08: Alerts | 9.18, 9.19 | Proactive response |
| OEE-FR-09: Integration | 9.20, 9.21 | Data automation |
| OEE-FR-10: Audit | 9.25 | Compliance |

---

## 5. Dependencies

### 5.1 From Other Modules
- **Epic 1 (Settings):** Users, machines, organizations
- **Epic 4 (Production):** Work Orders for run time and counts
- **Epic 10 (IIoT):** Optional - automatic data collection

### 5.2 To Other Modules
- **Epic 8 (AI):** OEE data feeds anomaly detection
- **Epic 11 (Sustainability):** Machine utilization data

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Manual data entry errors | High | Medium | Validation, IIoT integration |
| Definition inconsistency | Medium | High | Clear documentation, training |
| Real-time performance | Medium | Medium | Caching, incremental updates |
| User adoption | Medium | Medium | Simple UI, scanner workflow |

---

## 7. World-Class OEE Benchmarks

| Industry | Average OEE | World-Class |
|----------|-------------|-------------|
| Food Manufacturing | 55-65% | 85%+ |
| Discrete Manufacturing | 60-70% | 85%+ |
| Process Industry | 65-75% | 90%+ |

MonoPilot target: Enable customers to achieve 85%+ OEE through visibility and continuous improvement.

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial OEE & Performance Epic |
