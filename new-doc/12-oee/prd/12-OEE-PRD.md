# PRD 12-OEE — MonoPilot MES
**Wersja**: 1.0 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul OEE (M12) dostarcza kompleksowy system monitorowania efektywnosci produkcji oparty na wskazniku OEE (Overall Equipment Effectiveness = Availability x Performance x Quality). Umozliwia sledzenie przestojow, wydajnosci maszynowej, zuzycia energii i jakosci w czasie rzeczywistym dla linii produkcyjnych zakladu.

**Kluczowy differentiator**: Manualne wprowadzanie danych w Phase 1 (bez integracji PLC), z automatycznym obliczaniem OEE na podstawie danych z M06 Production. Konkurencja (Corso, Explitia) wymaga kosztownych sensorow od startu.

**Status implementacji**: Phase 2 — calosc zaplanowana. Zaleznosc od M06 Production (downtime, WO execution, shift).

**Zakres dokumentu**: 28 wymagan funkcjonalnych (FR-OEE-001 do FR-OEE-028) + 4 wymagania z PRD-UPDATE-LIST [9.1-9.4]. Lacznie 32 wymagania, pogrupowane w 14 epikow.

---

## 2. Objectives

### Cel glowny
Dostarczyc narzedzie do monitorowania i optymalizacji efektywnosci produkcji dla SMB food manufacturing, umozliwiajace identyfikacje strat i ciagle doskonalenie (continuous improvement) bez kosztownej integracji z maszynami.

### Cele szczegolowe
1. **Real-time OEE** — obliczanie OEE per maszyna/linia/zmiana w czasie rzeczywistym
2. **Downtime tracking** — kategoryzacja przestojow People/Process/Plant z analiza Pareto
3. **Efficiency per hour** — sledzenie wydajnosci % per linia per godzina [9.2]
4. **Threshold alerts** — konfigurowalne progi alertow per linia z eskalacja
5. **Historical trends** — analiza trendow i porownania okresow (W/W, P/P, Y/Y)
6. **Energy monitoring** — sledzenie zuzycia energii per maszyna/batch

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| OEE obliczane real-time | 100% aktywnych maszyn | oee_snapshots |
| Downtime logged < 2 min | 80% zdarzen | oee_downtime_events |
| Dashboard load P95 | < 2 s | APM |
| Shift reports auto-generated | 90% zmian | shift_reports |
| Alerts acknowledged < 30 min | 85% alertow | performance_alerts |
| Energy data captured | 95% batchy | energy_readings |

---

## 3. Personas

| Persona | Interakcja z OEE | Kluczowe akcje |
|---------|------------------|----------------|
| **Kierownik produkcji** | Glowny uzytkownik | Dashboard OEE, shift reports, trend analysis, alert management |
| **Lider zmiany** | Codzienny uzytkownik | Logowanie downtime, shift handover notes, przeglad wydajnosci |
| **Operator produkcji** | Logowanie zdarzen | Rejestracja przestojow (mobile/scanner), uzupelnianie reason codes |
| **Dyrektor zakladu** | Read-only dashboardy | Przeglad trendow OEE, porownania linii, KPI overview |
| **Technik utrzymania ruchu** | MTBF/MTTR | Analiza awarii, planowanie konserwacji (integracja z M14) |
| **Administrator** | Konfiguracja | OEE targets, reason codes, alert thresholds, energy baselines |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP OEE)

| Obszar | Wymagania | Priorytet |
|--------|-----------|-----------|
| OEE Calculation Engine (A x P x Q) | FR-OEE-001, 006-008 | Must Have |
| Real-time Machine Dashboard | FR-OEE-002 | Must Have |
| Downtime Event Tracking | FR-OEE-003 | Must Have |
| Downtime Reason Codes (People/Process/Plant) | FR-OEE-004, 005 | Must Have |
| [9.1] Downtime categories z M06 Production | HIGH | Must Have |
| OEE Target Configuration | FR-OEE-009 | Must Have |
| [9.2] Efficiency % per linia/godzina | HIGH | Must Have |
| Threshold Alerts | FR-OEE-010 | Should Have |
| Shift Report Generation | FR-OEE-011 | Should Have |
| Energy Consumption Tracking | FR-OEE-012, 013 | Should Have |
| Historical Trend Analysis | FR-OEE-014, 015 | Should Have |

### 4.2 Out of Scope — Phase 2

| Obszar | Wymagania | Uzasadnienie |
|--------|-----------|--------------|
| Machine Utilization Heatmap | FR-OEE-016 | Zaawansowana wizualizacja |
| Downtime Pareto Analysis | FR-OEE-017 | Zaawansowana analityka |
| Performance Dashboard | FR-OEE-018 | Zagregowany widok |
| Custom Report Builder | FR-OEE-019 | Nisko-priorytetowe |
| Email Alert Notifications | FR-OEE-020 | Post-MVP |
| Shift Handover Notes | FR-OEE-021 | Post-MVP |
| [9.3] slow_running_pct, stops_pct | MEDIUM | Rozszerzenie Performance |
| [9.4] engineering downtime % | MEDIUM | Rozszerzenie Downtime |
| Production Rate Tracking | FR-OEE-023 | Zaawansowane |

### 4.3 Out of Scope — Phase 3 (Enterprise)

| Obszar | Uzasadnienie |
|--------|--------------|
| MTBF/MTTR Calculation (FR-OEE-022) | Integracja z M14 Maintenance |
| Mobile Downtime Logging (FR-OEE-025) | Scanner module extension |
| TPM Schedule Integration (FR-OEE-026) | Wymaga M14 Maintenance |
| OEE Benchmark Reports (FR-OEE-027) | Enterprise analytics |
| Bottleneck Analysis (FR-OEE-024) | Zaawansowane AI/ML |
| Export to BI Tools (FR-OEE-028) | Power BI, Tableau connectors |
| PLC/IoT Integration | Automatyczny odczyt z maszyn |

### 4.4 Exclusions (Nigdy)

- **PLC direct integration w Phase 1** — manual input fallback; API do PLC w Phase 3+
- **AI/ML predictive maintenance** — poza zakresem MES
- **Custom hardware** — wykorzystujemy istniejace skanery Zebra/Honeywell
- **Real-time sensor streaming** — polling co 5 min, NIE streaming

---

## 5. Constraints

### Techniczne
- **Manual input fallback**: Phase 1 opiera sie na manualnym wprowadzaniu danych (downtime, energy); brak integracji PLC
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach OEE (ADR-013)
- **Polling, nie streaming**: Dashboard odswiezany co 30 s (konfigurowalny), snapshoty co 5 min
- **Agregacja**: Materialized views dla daily/hourly summary; latencja 1-3 min
- **Zaleznosc M06**: Dane zrodlowe (WO, output, downtime) pochodza z M06 Production

### Biznesowe
- Phase 2 modul (premium) — wymaga aktywnego M06 Production
- Koszt energii: manual entry; auto-import z meterów w Phase 3
- Shift reports: auto-generacja 15 min po koncu zmiany

### Regulacyjne
- Shift reports: retencja 7 lat (compliance)
- Audit trail na konfiguracji (targets, reason codes, alert thresholds)
- Dane OEE nie podlegaja GDPR (dane maszynowe, nie osobowe)

---

## 6. Decisions

### D-OEE-1. Formula OEE (A x P x Q)
OEE = Availability x Performance x Quality. Availability = (Production Time / Planned Production Time). Performance = (Actual Output / Target Output). Quality = (Good Output / Actual Output). Wartosci przechowywane jako DECIMAL(5,2) w zakresie 0-100. OEE_pct = (avail * perf * quality) / 10000 (bo mnozenie trzech procentow).

### D-OEE-2. Source-of-truth dla downtime
Downtime events tworzone w M12 OEE (tabela `oee_downtime_events`). M06 Production zapisuje `wo_downtime` (People/Process/Plant + minuty) — M12 importuje te dane jako zrodlo. Synchronizacja jednokierunkowa: M06 -> M12. Operator moze tez logowac downtime bezposrednio w M12.

### D-OEE-3. Downtime categories: People/Process/Plant [9.1]
Trzy glowne kategorie downtime z M06 Production:
- **People**: nieobecnosc operatora, szkolenie, brak personelu
- **Process**: przezbrojenie, czyszczenie, brak materialu, problem jakosciowy
- **Plant**: awaria maszyny, awaria mediow, minor stops/jams

Reason codes mapowane do kategorii. Kazdy reason code ma `is_planned` flag (planned vs unplanned).

### D-OEE-4. Alert thresholds — configurable per line
Progi alertow konfigurowalne per maszyna, linia lub organizacja. Domyslne: OEE < 85%, Availability < 80%, Quality < 95%, Extended downtime > 15 min. Severity: `warning` / `critical`. Kanaly: dashboard (zawsze), email (opcjonalnie). Eskalacja: jezeli brak acknowledge w 30 min -> escalate.

### D-OEE-5. Manual input fallback (no PLC Phase 1)
Phase 1: BRAK integracji z PLC/IoT. Wszystkie dane wprowadzane manualnie lub importowane z M06. Phase 3: API do PLC (OPC-UA / MQTT adapter). Uzasadnienie: SMB food manufacturers rzadko maja PLC z interfejsem danych; manual input pokrywa 80% potrzeb.

### D-OEE-6. RLS / org_id
Standardowy wzorzec ADR-013: `org_id UUID NOT NULL` na kazdej tabeli. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Cross-tenant -> 404.

### D-OEE-7. Efficiency % per linia per godzina [9.2]
Tabela `oee_hourly_summary` przechowuje efficiency % per linia per godzina. Obliczane: (actual_output / target_output) x 100 per hour. Dashboard wyswietla hourly breakdown z color-coding (zielony >= target, zolty 85-100% target, czerwony < 85% target).

### D-OEE-8. slow_running_pct i stops_pct [9.3]
Dodatkowe metryki Performance: `slow_running_pct` = (slow cycles / total cycles) x 100. `stops_pct` = (minor stops time / production time) x 100. Przechowywane w `oee_performance_logs`. Phase 2.

### D-OEE-9. Engineering downtime % [9.4]
Podkategoria Plant downtime: `engineering_downtime_pct` = (engineering downtime / total downtime) x 100. Oddzielny reason code category `engineering` w `oee_downtime_reasons`. Phase 2.

### D-OEE-10. site_id na tabelach OEE
`site_id UUID NULL` na WSZYSTKICH tabelach OEE (zgodnie z decyzja globalna). NULL do aktywacji M11 Multi-Site.

---

## 7. Module Map

```
OEE (M12)
├── E12.1 — OEE Settings & Targets [Phase 1]
│   ├── Performance targets per machine/line/product
│   ├── Alert threshold configuration
│   └── OEE formula parameters
├── E12.2 — Downtime Reason Codes [Phase 1]
│   ├── People/Process/Plant categories
│   ├── Planned vs Unplanned classification
│   └── Reason code CRUD + color coding
├── E12.3 — OEE Calculation Engine [Phase 1]
│   ├── A x P x Q formula
│   ├── Snapshot creation (5-min interval)
│   ├── Daily/hourly aggregation
│   └── [9.2] Efficiency % per line/hour
├── E12.4 — Real-time Machine Dashboard [Phase 1]
│   ├── KPI cards (OEE, A, P, Q)
│   ├── Machine status grid
│   ├── Active alerts panel
│   └── OEE trend chart (7-day)
├── E12.5 — Downtime Event Tracking [Phase 1]
│   ├── Event logging (start/end/reason)
│   ├── [9.1] People/Process/Plant from M06
│   ├── Duration calculation
│   └── Impact on OEE recalculation
├── E12.6 — Threshold Alerts [Phase 1]
│   ├── Alert creation on threshold breach
│   ├── Acknowledge/resolve workflow
│   └── Dashboard notification
├── E12.7 — Shift Report Generation [Phase 1]
│   ├── Auto-generation (15 min after shift end)
│   ├── Supervisor review + approval
│   └── PDF export
├── E12.8 — Energy Consumption [Phase 1]
│   ├── Manual meter readings
│   ├── kWh per batch/unit calculation
│   ├── Baseline comparison
│   └── Cost tracking
├── E12.9 — Historical Trend Analysis [Phase 1]
│   ├── OEE trends (day/week/month/year)
│   ├── Period comparisons (W/W, P/P, Y/Y)
│   └── CSV export
├── E12.10 — Machine Utilization Heatmap [Phase 2]
│   └── Visual heatmap (machine x time)
├── E12.11 — Downtime Pareto Analysis [Phase 2]
│   ├── Pareto chart (reason x duration)
│   ├── [9.3] slow_running_pct, stops_pct
│   └── [9.4] engineering downtime %
├── E12.12 — Performance Dashboard [Phase 2]
│   ├── Comprehensive KPI view
│   ├── Shift handover notes
│   └── Email alert notifications
├── E12.13 — MTBF/MTTR [Phase 3]
│   ├── Mean Time Between Failures
│   ├── Mean Time To Repair
│   └── Integration z M14 Maintenance
└── E12.14 — Mobile Downtime Logging & TPM [Phase 3]
    ├── Scanner app: quick downtime log
    ├── TPM schedule integration
    └── OEE benchmark reports
```

---

## 8. Requirements

### E12.1 — OEE Settings & Targets (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `performance_targets` | org_id, target_type (machine/line/product), reference_id, oee_target DECIMAL(5,2), availability_target, performance_target, quality_target, effective_date, expiry_date | Org-scoped | Defaults: OEE 85%, A 90%, P 95%, Q 99% |
| `oee_downtime_reasons` | org_id, code, category (people/process/plant), description, is_planned, is_active, color_code, sort_order | Org-scoped | Seeded z domyslnymi |

**API Endpoints:**
- `GET/POST/PATCH/DELETE /api/oee/targets` — CRUD performance targets
- `GET/POST/PATCH /api/oee/downtime/reasons` — CRUD reason codes

**Validation (Zod):**
- `performanceTargetSchema`: target_type enum, oee_target 0-100, effective_date required
- `downtimeReasonSchema`: code 2-50 chars, category enum (people/process/plant), color_code hex

**Frontend/UX:**
- OEE-003: Settings page z tabs (Targets, Reason Codes, Alerts)
- DataTable z edycja inline dla targets
- Color picker dla reason codes

---

### E12.2 — Downtime Reason Codes (Phase 1)

**Backend:**
Tabela `oee_downtime_reasons` (patrz E12.1). Seeded defaults:

| Kategoria | Planned | Kody domyslne |
|-----------|---------|---------------|
| People | TAK | break, lunch, training, absence |
| People | NIE | operator_error, short_staffed |
| Process | TAK | scheduled_changeover, planned_cleaning |
| Process | NIE | material_shortage, quality_hold, unplanned_changeover |
| Plant | TAK | scheduled_maintenance |
| Plant | NIE | breakdown, utility_failure, jam, minor_stop |

**API:** Wspoldzielone z E12.1.

**Frontend/UX:**
- OEE-003: Reason codes tab z drag-and-drop ordering
- Kolor badge per kategoria (People=blue, Process=orange, Plant=red)

---

### E12.3 — OEE Calculation Engine (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `oee_snapshots` | org_id, machine_id, line_id, shift_id, work_order_id, snapshot_time, availability_pct, performance_pct, quality_pct, oee_pct, planned_production_time, actual_production_time, ideal_cycle_time, total_pieces, good_pieces, rejected_pieces | Org-scoped | Tworzony co 5 min lub on-demand |
| `oee_hourly_summary` | org_id, hour_start, machine_id, line_id, oee_avg, units_produced, good_units, downtime_minutes, efficiency_pct | Org-scoped | [9.2] Efficiency per hour |
| `oee_daily_summary` | org_id, summary_date, machine_id, line_id, shift_id, oee_avg, availability_avg, performance_avg, quality_avg, total_output, good_output, scrap_output, total_planned_time, total_downtime | Org-scoped | Materialized view, refresh co 3 min |
| `oee_performance_logs` | org_id, machine_id, work_order_id, operation_id, timestamp, actual_cycle_time, target_cycle_time, units_produced, efficiency_pct, speed_loss_pct | Org-scoped | Cycle time tracking |
| `oee_quality_events` | org_id, work_order_id, operation_id, event_type (scrap/rework/reject), quantity, reason_code_id, defect_type, logged_by | Org-scoped | Quality loss tracking |

**Formula:**
```
OEE = Availability x Performance x Quality

Availability = (Production Time / Planned Production Time) x 100
  Production Time = Planned Production Time - Downtime

Performance = (Actual Output / Target Output) x 100
  Target Output = Production Time / Ideal Cycle Time

Quality = (Good Output / Actual Output) x 100
```

**Calculation Triggers:**
- Periodyczny: co 5 min dla aktywnych maszyn
- Event-driven: WO completion, downtime event, output registration
- Scheduled: koniec zmiany, koniec dnia
- On-demand: user request

**API Endpoints:**
- `GET /api/oee/calculate` — oblicz OEE dla zakresu czasu
- `GET /api/oee/snapshots` — lista snapshotow (filters: machine, line, shift, date range)
- `POST /api/oee/snapshots` — manual snapshot creation
- `GET /api/oee/realtime/:machineId` — real-time OEE data
- `GET /api/oee/performance` — performance logs
- `POST /api/oee/performance/log` — log performance data
- `GET /api/oee/quality/yield` — yield analysis
- `POST /api/oee/quality/event` — log quality event

**Validation (Zod):**
- `oeeSnapshotSchema`: machine_id required, snapshot_time ISO, pct fields 0-100
- `qualityEventSchema`: event_type enum, quantity > 0

---

### E12.4 — Real-time Machine Dashboard (Phase 1)

**Frontend/UX:**
- OEE-001: Main OEE Dashboard (`/oee/dashboard`)

**Layout:**
1. **Header KPI Cards (4)**: OEE Today, Availability, Performance, Quality — kazdy z % change badge
2. **Machine Status Grid**: per linia, karty maszyn ze statusem (Running/Paused/Down), aktualnym OEE, WO number, progress
3. **Active Alerts Panel**: prawy sidebar z alertami do acknowledge
4. **OEE Trend Chart**: 7-day trend z legendą (OEE, A, P, Q)

**Machine Detail View** (`/oee/machines/:id`):
1. Machine header (status, WO, runtime)
2. OEE metrics (3 karty z target comparison)
3. Timeline 24h (running/paused/down color blocks)
4. Downtime log (table z reason codes)

**API:** Wykorzystuje endpoints z E12.3.

---

### E12.5 — Downtime Event Tracking (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `oee_downtime_events` | org_id, machine_id, line_id, work_order_id, downtime_type (planned/unplanned), reason_code_id, start_time, end_time, duration_minutes, logged_by, notes, is_planned, impact_severity, category (people/process/plant) | Org-scoped | [9.1] Category z M06 |

**Event Lifecycle:**
1. Downtime Start -> Log event (manual lub auto z WO pause)
2. Select Reason Code -> Kategoryzacja (People/Process/Plant + planned/unplanned)
3. Add Notes -> Dokumentacja
4. Downtime End -> Oblicz duration
5. Impact Calculation -> Update OEE snapshot

**API Endpoints:**
- `GET /api/oee/downtime` — lista downtime events (filters: machine, category, date range)
- `POST /api/oee/downtime` — log downtime event
- `PATCH /api/oee/downtime/:id` — update (end_time, reason, notes)
- `DELETE /api/oee/downtime/:id` — soft delete
- `GET /api/oee/downtime/analysis` — Pareto data

**Frontend/UX:**
- OEE-002: Downtime tracking page (`/oee/downtime`)
- Quick log form: Machine (dropdown) + Reason Code (grouped by category) + Notes
- Active downtime: timer incrementing, highlight w dashboard

---

### E12.6 — Threshold Alerts (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `performance_alerts` | org_id, alert_type, severity (warning/critical), metric_name, threshold_value, actual_value, reference_type (machine/line), reference_id, triggered_at, acknowledged_by, acknowledged_at, resolved_at, notification_sent | Org-scoped | Auto-created |
| `alert_configurations` | org_id, alert_type, threshold_value, reference_type, reference_id, severity, is_active, notification_channels (JSONB) | Org-scoped | Admin-managed |

**Alert Types:**

| Alert | Warunek | Severity | Default threshold |
|-------|---------|----------|-------------------|
| oee_below_target | OEE < target | warning | 85% |
| availability_low | Availability < threshold | critical | 80% |
| performance_drop | Performance < threshold 30 min | warning | 85% |
| quality_issue | Quality < threshold | critical | 95% |
| extended_downtime | Downtime > threshold continuous | critical | 15 min |
| energy_spike | kWh > baseline x multiplier | warning | 120% |

**API Endpoints:**
- `GET /api/oee/alerts` — lista alertow (filters: status, severity, date)
- `GET /api/oee/alerts/active` — tylko aktywne
- `PATCH /api/oee/alerts/:id/acknowledge` — acknowledge
- `PATCH /api/oee/alerts/:id/resolve` — resolve
- `GET/POST/PATCH /api/oee/alerts/config` — konfiguracja progow

**Frontend/UX:**
- Alert panel w dashboard (sidebar)
- `/oee/alerts` — pelna lista z filtrowaniem
- `/oee/settings` tab Alerts — konfiguracja progow

---

### E12.7 — Shift Report Generation (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `shift_reports` | org_id, shift_id, line_id, report_date, start_time, end_time, supervisor_id, oee_avg, availability_avg, performance_avg, quality_avg, total_downtime, total_output, good_output, scrap_count, status (draft/approved), notes, approved_by, approved_at | Org-scoped | Retencja 7 lat |
| `oee_shift_metrics` | org_id, site_id, machine_id, line_id, shift_date, shift_type, availability_pct, performance_pct, quality_pct, oee_pct, planned_runtime_min, actual_runtime_min, downtime_min, total_units_produced, good_units_produced, mtbf_hours, mttr_minutes, created_at | Org-scoped | Agregacja OEE per zmiana per maszyna/linia; referencowana przez M14 Maintenance |

**Szczegoly tabeli `oee_shift_metrics` (REC-M2 -- pelna definicja, owner M12 OEE):**

```
oee_shift_metrics — agregacja OEE per zmiana per maszyna/linia
- id UUID PK
- org_id UUID NOT NULL (FK organizations)
- site_id UUID NULL
- machine_id UUID NOT NULL (FK machines)
- shift_id UUID NOT NULL (FK production_shifts) — klucz obcy do konkretnej zmiany
- line_id UUID NULL (FK production_lines)
- date DATE NOT NULL — data zmiany (alias shift_date)
- shift_date DATE NOT NULL — data zmiany (dla kompatybilnosci z M14)
- shift_type VARCHAR(10) NOT NULL (AM/PM/NIGHT)
- availability_pct DECIMAL(5,2)
- performance_pct DECIMAL(5,2)
- quality_pct DECIMAL(5,2)
- oee_pct DECIMAL(5,2) — computed: availability_pct * performance_pct * quality_pct / 10000
- planned_production_time_min INTEGER — (alias planned_runtime_min)
- planned_runtime_min INTEGER
- actual_production_time_min INTEGER — (alias actual_runtime_min)
- actual_runtime_min INTEGER
- ideal_cycle_time_sec DECIMAL(10,2) NULL — teoretyczny min czas per jednostka
- total_count INTEGER — (alias total_units_produced cast to INT)
- total_units_produced DECIMAL(15,3)
- good_count INTEGER — (alias good_units_produced cast to INT)
- good_units_produced DECIMAL(15,3)
- downtime_min INTEGER
- mtbf_hours DECIMAL(10,2) NULL
- mttr_minutes DECIMAL(10,2) NULL
- created_at TIMESTAMPTZ DEFAULT now()
- INDEX: (org_id, machine_id, shift_date, shift_type)
- INDEX: (org_id, shift_id, date)
- RLS: org_id = auth.org_id()
```

**Uzasadnienie**: M14 Maintenance referencuje `oee_shift_metrics` do obliczen MTBF/MTTR per zmiana. Tabela wypelniana automatycznie 15 min po koncu zmiany (razem z `shift_reports`). M12 OEE jest **owner** tej tabeli -- M14 czyta wylacznie (read-only).

**Auto-Generation:** Trigger 15 min po koncu zmiany. Zbiera: OEE metrics, WO completed, downtime events, output quantities, quality events, energy consumption.

**Approval Workflow:**
1. Generated -> Status: draft
2. Supervisor review -> dodaje notes
3. Approve -> Status: approved, locked
4. Distribution -> email (opcjonalnie)

**API Endpoints:**
- `GET /api/oee/shift-reports` — lista (filters: line, date, status)
- `GET /api/oee/shift-reports/:id` — szczegoly
- `POST /api/oee/shift-reports/generate` — manual generation
- `PATCH /api/oee/shift-reports/:id/approve` — approve
- `GET /api/oee/shift-reports/:id/export` — PDF export

**Frontend/UX:**
- OEE-004: Shift report page (`/oee/shifts`)
- Report card: header, performance metrics, downtime breakdown, WO list, notes

---

### E12.8 — Energy Consumption (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `energy_readings` | org_id, machine_id, line_id, reading_time, kwh_consumed, meter_reading, work_order_id, reading_type (manual/automatic), source | Org-scoped | |
| `energy_baselines` | org_id, machine_id, product_id, baseline_kwh_per_unit, baseline_kwh_per_hour, effective_date | Org-scoped | Expected consumption |
| `energy_costs` | org_id, rate_per_kwh, effective_date, time_of_day_rate (JSONB), rate_type (flat/time_of_use) | Org-scoped | |

**API Endpoints:**
- `GET/POST /api/oee/energy/readings` — CRUD odczytow
- `GET /api/oee/energy/consumption/:machineId` — consumption per machine
- `GET /api/oee/energy/cost` — cost analysis
- `GET/POST /api/oee/energy/baselines` — CRUD baselines

**Frontend/UX:**
- OEE-005: Energy dashboard (`/oee/energy`)
- KPI cards: Today's Use, Cost Today, kWh/Unit, vs Target
- Consumption by machine (bar chart)
- kWh per unit trend (line chart, 30 dni)

---

### E12.9 — Historical Trend Analysis (Phase 1)

**API Endpoints:**
- `GET /api/oee/analytics/trends` — trend data (granularity: hour/day/week/month)
- `GET /api/oee/analytics/comparisons` — period comparisons (W/W, P/P, Y/Y)
- `GET /api/oee/reports/export` — CSV/Excel export

**Frontend/UX:**
- OEE-006: Historical analysis page (`/oee/analytics`)
- Multi-series line chart (OEE, A, P, Q)
- Period comparison: side-by-side view
- Date range selector + granularity toggle

---

### E12.10 — Machine Utilization Heatmap (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `machine_utilization` | org_id, machine_id, period_start, period_end, scheduled_hours, running_hours, idle_hours, down_hours, utilization_pct | Org-scoped | |

**Frontend/UX:**
- OEE-007: Heatmap page — machine x time grid z color intensity

---

### E12.11 — Downtime Pareto Analysis (Phase 2)

Rozszerzenie E12.5 o:
- **Pareto chart**: reason codes x total duration, cumulative %
- **[9.3] slow_running_pct**: (slow cycles / total cycles) x 100 w `oee_performance_logs`
- **[9.3] stops_pct**: (minor stops time / production time) x 100
- **[9.4] engineering_downtime_pct**: nowa kategoria `engineering` w reason codes

**Frontend/UX:**
- OEE-008: Pareto chart page (`/oee/downtime` tab Pareto)
- Top Issues cards (#1, #2, #3 z occurrence count i avg duration)

---

### E12.12 — Performance Dashboard (Phase 2)

Zagregowany widok lacze dane z E12.3-E12.11:
- Shift handover notes (tabela `shift_handover_notes`)
- Email alert notifications (rozszerzenie `performance_alerts`)
- Custom report builder (tabela `saved_reports`)

---

### E12.13 — MTBF/MTTR (Phase 3)

**Obliczenia:**
- MTBF = Total Operating Time / Number of Failures (hours)
- MTTR = Total Repair Time / Number of Repairs (minutes)

**Integracja**: M14 Maintenance (maintenance WO, spare parts). Dane zrodlowe: `oee_downtime_events` WHERE category = 'plant' AND is_planned = false.

---

### E12.14 — Mobile Downtime Logging & TPM (Phase 3)

- `/scanner/downtime` — quick log: Machine + Reason (2 taps)
- TPM schedule integration z M14 Maintenance
- OEE benchmark reports (inter-line comparison, industry benchmarks)

---

## 9. KPIs

### Operacyjne OEE
| KPI | Cel | Pomiar |
|-----|-----|--------|
| OEE % | >= 85% (world-class food) | oee_snapshots.oee_pct avg |
| Availability % | >= 90% | oee_snapshots.availability_pct avg |
| Performance % | >= 95% | oee_snapshots.performance_pct avg |
| Quality % | >= 99% | oee_snapshots.quality_pct avg |
| Downtime minutes | Redukcja 20% vs baseline | oee_downtime_events.duration_minutes sum |
| Efficiency % per line/hour [9.2] | >= target | oee_hourly_summary.efficiency_pct |
| Energy per unit (kWh) | Redukcja 10% vs baseline | energy_readings / output |
| MTBF (hours) | Wzrost 15% vs baseline | obliczany z downtime_events |
| MTTR (minutes) | Redukcja 20% vs baseline | obliczany z downtime_events |

### Performance System
| KPI | Cel | Pomiar |
|-----|-----|--------|
| OEE calculation P95 | < 2 s | APM |
| Dashboard refresh | <= 30 s | Config |
| Historical query (90 days) | < 5 s | APM |
| Shift report generation | < 10 s | APM |
| Pareto analysis | < 3 s | APM |

### Data Retention
| Dane | Retencja |
|------|----------|
| Raw snapshots | 90 dni |
| Hourly summaries | 1 rok |
| Daily summaries | 3 lata |
| Shift reports | 7 lat (compliance) |
| Energy readings | 2 lata |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| Manual data entry accuracy | Wysokie | Wysoki | Walidacja Zod, porownanie z WO data, anomaly detection |
| Real-time calculation performance | Srednie | Sredni | Materialized views, hourly/daily pre-aggregation, indeksy |
| Machine integration complexity (Phase 3) | Srednie | Wysoki | Manual input fallback w Phase 1; API adapter pattern dla PLC |
| Alert fatigue | Srednie | Sredni | Konfigurowalne progi per linia, smart grouping, severity levels |
| Downtime not logged | Wysokie | Sredni | Mobile app (Phase 3), auto-detect z WO pause, szkolenie |
| User resistance to logging | Srednie | Sredni | Uproszczone UI (2 taps), scanner quick log, gamification (future) |
| Data volume performance (1M+ snapshots/mth) | Srednie | Wysoki | Partycjonowanie monthly, archiwizacja, materialized views |
| Dependency na M06 data quality | Srednie | Wysoki | Walidacja na imporcie, dashboard data quality indicators |

### Tech Debt (OEE-specific)
- **P1**: Brak WebSocket/SSE dla true real-time (polling co 30s zamiast push)
- **P1**: Brak partycjonowania oee_snapshots (ok do ~500K records)
- **P2**: Brak cache Redis dla dashboard aggregations
- **P2**: Shift report PDF generation synchroniczne (moze byc slow)

---

## 11. Success Criteria

### Funkcjonalne
- [ ] OEE calculation per machine/line/shift dziala w real-time (co 5 min)
- [ ] Downtime tracking z kategoriami People/Process/Plant [9.1]
- [ ] Efficiency % per linia per godzina [9.2]
- [ ] Threshold alerts z acknowledge/resolve workflow
- [ ] Shift reports auto-generated i z approval workflow
- [ ] Energy consumption tracking per batch/machine
- [ ] Historical trend analysis z period comparisons
- [ ] Performance targets konfigurowalne per machine/line

### Niefunkcjonalne
- [ ] Dashboard load P95 < 2 s
- [ ] OEE calculation P95 < 2 s
- [ ] Historical query (90 days) < 5 s
- [ ] RLS: 0 cross-tenant leaks w automated tests
- [ ] Shift reports retencja 7 lat

### Biznesowe
- [ ] 100% maszyn z wlaczonym OEE tracking
- [ ] 80% downtime events zalogowanych w < 2 min
- [ ] 90% shift reports approved on time
- [ ] 85% alertow acknowledged w < 30 min

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD -> `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Bazowy OEE PRD (v1.0) -> `new-doc/12-oee/prd/oee.md`
- OEE Analysis -> `new-doc/12-oee/ANALYSIS.md`
- OEE Architecture -> `new-doc/12-oee/decisions/oee-arch.md`
- PRD Update List (items 9.1-9.4) -> `new-doc/_meta/PRD-UPDATE-LIST.md`
- Design Guidelines -> `new-doc/_meta/DESIGN-GUIDELINES.md`

### ADR (OEE-relevant)
- ADR-003: Multi-Tenancy RLS
- ADR-008: Audit Trail Strategy
- ADR-013: RLS Org Isolation Pattern

### Implementation artifacts
- Stories 12.1-12.20 -> `new-doc/12-oee/stories/`
- UX Wireframes OEE-001 do OEE-010 -> `new-doc/12-oee/ux/`
- Story Context YAML -> `new-doc/12-oee/stories/context/`
- Implementation Roadmap -> `new-doc/12-oee/stories/IMPLEMENTATION-ROADMAP.yaml`

### Database schema (16 tabel)
- OEE Tracking: `oee_snapshots`, `oee_downtime_events`, `oee_downtime_reasons`, `oee_performance_logs`, `oee_quality_events`
- Energy: `energy_readings`, `energy_baselines`, `energy_costs`
- Shift & Performance: `shift_reports`, `oee_shift_metrics`, `shift_handover_notes`, `performance_targets`, `performance_alerts`, `alert_configurations`
- Analytics: `oee_daily_summary`, `oee_hourly_summary`, `machine_utilization`

### Integracje z modulami
- **M01 Settings**: maszyny, linie, shifts, users (supervisor)
- **M02 Technical**: produkty (ideal cycle time, energy baselines)
- **M06 Production**: WO execution, output, downtime (People/Process/Plant), shifts AM/PM
- **M08 Quality**: QA holds, NCR (quality-related downtime)
- **M14 Maintenance**: MTBF/MTTR, TPM (Phase 3)
- **M15 Reporting**: Factory Overview (konsumuje OEE data)

### OEE Industry Benchmarks

| Branza | World-Class OEE | Typowy OEE |
|--------|-----------------|------------|
| Food & Beverage | 85%+ | 60-75% |
| Discrete Manufacturing | 90%+ | 65-80% |
| Process Manufacturing | 85%+ | 60-70% |

### Six Big Losses
1. Breakdowns (awarie — Availability)
2. Setup/Changeovers (przezbrojenia — Availability)
3. Small Stops (< 5 min, jams — Performance)
4. Reduced Speed (ponizej target — Performance)
5. Startup Rejects (scrap na rozruchu — Quality)
6. Production Rejects (scrap w produkcji — Quality)

### Slownik
- **OEE**: Overall Equipment Effectiveness
- **MTBF**: Mean Time Between Failures
- **MTTR**: Mean Time To Repair
- **TPM**: Total Productive Maintenance
- **Ideal Cycle Time**: teoretyczny minimalny czas per jednostka
- **Planned Production Time**: zaplanowany czas pracy minus przerwy
- **Good Output**: output ktory przeszedl kontrole jakosci

---

_PRD 12-OEE v1.0 — 14 epikow (9 Phase 1 + 3 Phase 2 + 2 Phase 3), 32 wymagania (28 FR + 4 z PRD-UPDATE-LIST), 10 decyzji OEE-specific._
_Integracje: M01, M02, M06 (zrodlo danych), M08, M14, M15. Manual input fallback Phase 1, PLC Phase 3._
_Data: 2026-02-18_
