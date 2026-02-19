# PRD 14-Maintenance/CMMS — MonoPilot MES
**Wersja**: 1.0 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul Maintenance/CMMS (M14) dostarcza kompleksowe zarzadzanie utrzymaniem ruchu dla malych i srednich producentow zywnosci. Zamyka luke miedzy reaktywnym sledzeniem przestojow (M06 Production, M12 OEE) a proaktywnym planowaniem konserwacji, zarzadzaniem czesciami zamiennymi i zgodnoscia kalibracyjna.

**Problem**: Producenci SMB zarzadzaja konserwacja w Excelu lub papierowo. Przestoje sa rejestrowane reaktywnie (M06/M12), ale brak narzedzi do planowania prewencyjnego, sledzenia czesci zamiennych i historii serwisowej maszyn. Skutek: nieplanowane przestoje, brak zgodnosci kalibracyjnej, niekontrolowane koszty utrzymania.

**Rozwiazanie**: Zintegrowany modul CMMS w ramach MonoPilot — jedyny system na rynku SMB food manufacturing laczacy MES + CMMS + OEE w jednej platformie. Harmonogramy PM (czasowe/uzytkowe), zlecenia serwisowe (MWO) z maszyna stanow, magazyn czesci zamiennych, kalibracja, sanitacja CIP — wszystko polaczone z produkcja i OEE.

**Kluczowy differentiator**: Automatyczne tworzenie MWO z przestojow (link M06), kalibracja zgodna z wymogami food industry (wagi, termometry, pH), sanitacja PM (CIP) jako first-class citizen.

**Phase**: Phase 2 (po M12 OEE). Zaleznosci: M01 Settings (maszyny), M06 Production (downtime), M12 OEE (MTBF/MTTR).

---

## 2. Objectives

### Cel glowny
Zredukowac nieplanowane przestoje o 20-30% poprzez wdrozenie prewencyjnego utrzymania ruchu, sledzenie czesci zamiennych i kalibracji — bez zlozonosci enterprise CMMS (Maximo, Infor).

### Cele szczegolowe
1. **Prewencja** — harmonogramy PM (czasowe + uzytkowe) z automatycznymi alertami i eskalacja
2. **Zlecenia serwisowe** — MWO z maszyna stanow, przypisanie technikow, sledzenie kosztow
3. **Czesci zamienne** — katalog, stany magazynowe, reorder points, zuzycie per MWO
4. **Kalibracja** — sledzenie certyfikatow, terminow, wynikow — zgodnosc food industry
5. **Integracja** — auto-generacja MWO z downtime (M06), MTBF/MTTR z OEE (M12), TPM

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| MTBF (Mean Time Between Failures) | wzrost o 10% vs baseline | oee_shift_metrics |
| MTTR (Mean Time To Repair) | < 60 min srednia | maintenance_work_orders |
| PM Schedule Adherence | > 85% | completed_on_time / scheduled |
| Planned vs Unplanned Maintenance | > 70% planned | maintenance_work_orders.source |
| Spare Parts Stockout Rate | < 5% | spare_parts_stock vs consumption |
| Maintenance Cost per Unit | tracking (baseline) | costs / units_produced |
| Czas MWO (time-to-complete) | < 4h srednia | started_at -> completed_at |

---

## 3. Personas

| Persona | Interakcja z M14 | Kluczowe akcje |
|---------|------------------|----------------|
| **Technik utrzymania ruchu** | Glowny uzytkownik | Realizacja MWO, zuzycie czesci, raporty serwisowe, kalibracja |
| **Kierownik utrzymania ruchu** | Planowanie i nadzor | Harmonogramy PM, przypisanie technikow, dashboardy, koszty |
| **Kierownik produkcji** | Read + trigger | Zglaszanie awarii, podglad statusu maszyn, „Next PM Due" |
| **Kierownik jakosci** | Kalibracja | Podglad certyfikatow kalibracji, zgodnosc, audit trail |
| **Operator produkcji** | Trigger only | Zgloszenie awarii z hali (checkbox „Create maintenance task") |
| **Administrator** | Konfiguracja | Ustawienia maintenance, role technikow, progi alertow |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP Maintenance)

| Obszar | Priorytet |
|--------|-----------|
| Maintenance Settings & Asset Registry (rozszerzenie maszyn z M01) | Must Have |
| Harmonogramy PM (time-based + usage-based) | Must Have |
| MWO CRUD + state machine (OPEN -> IN_PROGRESS -> COMPLETED + CANCELLED) | Must Have |
| Spare Parts Inventory (katalog, stany, zuzycie) | Must Have |
| Maintenance History & Audit Trail (timeline per maszyna) | Must Have |
| Kalibracja basic (certyfikaty, terminy, wyniki) | Should Have |

### 4.2 In Scope — Phase 2 (Integration)

| Obszar | Priorytet |
|--------|-----------|
| Auto-Generate MWO from Downtime (link do M06) | Must Have |
| Technician Scheduling (skills, dostepnosc, przypisanie) | Should Have |
| Maintenance Dashboards (KPI, koszty, trendy) | Should Have |
| Sanitation PM — CIP schedules (food industry) | Should Have |
| Allergen Equipment Maintenance (weryfikacja po czyszczeniu) | Should Have |
| TPM Integration (link do M12 OEE) | Could Have |

### 4.3 Out of Scope (Phase 3 / Future)

| Obszar | Uzasadnienie |
|--------|--------------|
| Condition-Based PM (sensory, IoT) | Wymaga integracji PLC/IoT |
| Predictive Maintenance (ML) | Wymaga 6+ mies. danych historycznych |
| Spare Parts Forecasting (auto-replenishment) | Wymaga ML + supplier integration |
| Mobile offline mode dla technikow | Rozszerzenie Scanner M05 |

### 4.4 Exclusions (Nigdy)

- **Pelny asset management** (amortyzacja, cykl zycia finansowy) — domena Finance/ERP
- **Facility management** (budynki, HVAC) — poza scope MES
- **Fleet management** — poza scope

---

## 5. Constraints

### Techniczne
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach M14 (ADR-013)
- **site_id**: `site_id UUID NULL` na wszystkich tabelach (gotowe na M11 Multi-Site)
- **Service Layer**: Logika w `lib/services/maintenance-*-service.ts`, walidacja Zod (ADR-015, ADR-016)
- **Numeracja MWO**: `MWO-{YYYY}-{NNNNN}` per org (auto-increment)
- **State machine MWO**: Prosty 4-stanowy (nie workflow engine) — rozszerzenie iteracyjne

### Biznesowe
- Backend-first: DB + API + Zod przed frontendem
- Maszyny juz istnieja w M01 Settings — M14 rozszerza, nie duplikuje
- Spare parts = osobny katalog (NIE produkty z M02 Technical)
- Kalibracja opcjonalna per org (nie mandatory)

### Regulacyjne
- Kalibracja: BRC/IFS wymaga dowodow kalibracji wag, termometrow
- Sanitacja CIP: HACCP wymaga dowodow czyszczenia przed zmiana produktu
- Audit trail: FDA 21 CFR Part 11 na wszystkich zmianach MWO (ADR-008)

---

## 6. Decisions

### D-MNT-1. MWO State Machine
Prosty 4-stanowy model (NIE workflow engine):
```
OPEN --> IN_PROGRESS --> COMPLETED
  |          |
  +----------+--> CANCELLED
```
- **OPEN**: Utworzone (recznie lub auto z downtime/harmonogramu). Mozna edytowac.
- **IN_PROGRESS**: Technik rozpoczal prace. Rejestracja czasu, czesci.
- **COMPLETED**: Praca zakonczona. Wymagane: actual_duration, notes. Opcjonalne: verified_by.
- **CANCELLED**: Anulowane z powodem (action_reason w audit trail).

Guards: `OPEN->IN_PROGRESS` wymaga assigned_to. `IN_PROGRESS->COMPLETED` wymaga actual_duration > 0.
Override: supervisor z logowaniem w audit trail.

### D-MNT-2. Preventive vs Reactive Strategy
System wspiera obie strategie, ale **promuje prewencyjna**:
- **Preventive (PM)**: Harmonogramy time/usage-based, auto-generacja MWO
- **Reactive (CM)**: Reczne tworzenie MWO lub auto z downtime M06
- KPI: % planned vs unplanned — cel > 70% planned
- UI prominentnie wyswietla „overdue PM" i „upcoming PM"

### D-MNT-3. Integracja z OEE (MTBF/MTTR)
- M14 CZYTA metryki MTBF/MTTR z M12 OEE (read-only)
- M14 NIE duplikuje obliczen — referencja do `oee_shift_metrics`
- Dashboard M14 wyswietla MTBF/MTTR per maszyna z linkiem do OEE
- TPM score = f(PM_adherence, MTBF_trend, unplanned_downtime_reduction)

**REC-M2 -- Wlasnosc tabeli i nazewnictwo:**
- Tabela `oee_shift_metrics` zdefiniowana w M12 OEE. M14 Maintenance czyta ja dla kalkulacji MTBF/MTTR per maszyna.
- `oee_shift_metrics` (M12): agregacja OEE per zmiana per maszyna/linia — dane per shift (AM/PM/NIGHT). Owner: M12. Czyta: M14.
- `oee_daily_summary` (M12): agregacja OEE per dzien per maszyna/linia — dane zagregowane per dzien. Owner: M12. Czyta: M15 Reporting.
- M14 korzysta z `oee_shift_metrics` (nie `oee_daily_summary`) bo MTBF/MTTR sa liczone per zmiane (shift-level granularity).
- Oba widoki/tabele sa w M12 — M14 nie posiada wlasnych kopii tych danych.

### D-MNT-4. Downtime -> Auto Task Creation
Kiedy operator loguje breakdown downtime w M06:
1. Checkbox „Create maintenance task" (juz w wireframe OEE-002)
2. Auto-populacja: machine_id, reason, priority (z kategorii downtime)
3. MWO tworzony ze statusem OPEN, source = 'downtime', downtime_log_id = FK
4. Notyfikacja do maintenance managera (Phase 2 notifications)

### D-MNT-5. Kalibracja — Food Industry Compliance
- Typy sprzetu: wagi (scales), termometry (temperature), pH-metry, cisnieniomierze
- Standardy: ISO 9001, NIST, wewnetrzne (org-specific)
- Wyniki: pass / fail / out_of_spec
- Alerting: 30 dni przed terminem (warning), 7 dni (urgent), po terminie (overdue + block)
- Certyfikat: URL do pliku w Supabase Storage
- Opcjonalne per org: `organization_settings.calibration_tracking_enabled`

### D-MNT-6. Spare Parts — Osobny Katalog
Czesci zamienne to OSOBNY katalog (tabela `spare_parts`), NIE produkty z M02:
- Rozne atrybuty (manufacturer, part_number vs GTIN, shelf_life)
- Rozne RLS (maintenance team vs production team)
- Stany w lokalizacjach warehouse M03 (opcjonalne linkowanie)
- Zuzycie per MWO (nie per WO produkcyjny)

### D-MNT-7. Sanitacja PM (CIP) — Food Industry
- CIP (Clean-In-Place) jako typ harmonogramu PM: `schedule_type = 'sanitation'`
- Dodatkowe pola: `allergen_change` (bool), `product_change` (bool)
- Link do alergenow (M01): po zmianie produktu z alergenem X na produkt bez X
- Weryfikacja: checklist CIP (temperature, concentration, time, flow rate)
- Audit trail: kto czyścił, kiedy, wynik (pass/fail)

### D-MNT-8. RLS i Bezpieczenstwo
- `org_id UUID NOT NULL` na WSZYSTKICH tabelach M14 (ADR-013)
- `site_id UUID NULL` na wszystkich tabelach (przygotowanie M11)
- Role z dostepem: maintenance_manager (full CRUD), technician (read + update assigned), production_manager (read + create MWO), operator (create MWO only)
- Audit trail na: maintenance_work_orders, calibration_records, spare_parts_stock

---

## 7. Module Map

```
Maintenance/CMMS (M14)
├── E14.1 — Maintenance Settings & Asset Registry [Phase 1]
│   ├── Konfiguracja maintenance (progi, alerty, domyslne interwaly)
│   ├── Rozszerzenie maszyn o maintenance_plan tab
│   └── Typy technikow (basic, advanced, specialist)
├── E14.2 — Preventive Maintenance Scheduling [Phase 1]
│   ├── Harmonogramy time-based (dni, tygodnie, miesiace)
│   ├── Harmonogramy usage-based (godziny pracy, cykle, units produced)
│   ├── PM Templates (reusable per machine type)
│   └── Eskalacja: warning (80%) -> urgent (95%) -> overdue (100%)
├── E14.3 — Maintenance Work Orders [Phase 1]
│   ├── MWO CRUD (MWO-YYYY-NNNNN)
│   ├── State machine: OPEN -> IN_PROGRESS -> COMPLETED + CANCELLED
│   ├── Przypisanie technika + priority (low/medium/high/urgent)
│   └── Rejestracja: czas pracy, notatki, zuzycie czesci
├── E14.4 — Spare Parts Inventory [Phase 1]
│   ├── Katalog czesci zamiennych (code, name, manufacturer, cost)
│   ├── Stany magazynowe per lokalizacja
│   ├── Reorder points + lead times
│   └── Zuzycie per MWO (auto-dekrementacja stanow)
├── E14.5 — Maintenance History & Audit Trail [Phase 1]
│   ├── Timeline per maszyna (PM, naprawy, kalibracja, wymiany)
│   ├── Koszty skumulowane per maszyna
│   └── Audit trail (ADR-008)
├── E14.6 — Calibration Tracking [Phase 1 Should Have]
│   ├── Rekordy kalibracji (data, wynik, certyfikat)
│   ├── Harmonogram kalibracji (interwaly per sprzet)
│   ├── Alerty: 30d warning, 7d urgent, overdue
│   └── Typy: wagi, termometry, pH-metry, cisnieniomierze
├── E14.7 — Auto-Generate MWO from Downtime [Phase 2]
│   ├── Link M06 downtime -> MWO (checkbox w Production)
│   ├── Auto-populacja machine, reason, priority
│   └── Notyfikacja maintenance manager
├── E14.8 — Technician Scheduling [Phase 2]
│   ├── Skill levels per technik
│   ├── Kalendarz dostepnosci
│   └── Auto-suggest przypisanie wg skills + dostepnosci
├── E14.9 — Maintenance Dashboards [Phase 2]
│   ├── KPI: MTBF, MTTR, PM adherence, planned vs unplanned
│   ├── Koszty utrzymania per maszyna/linia
│   ├── Overdue PM list
│   └── Spare parts stock alerts
├── E14.10 — Sanitation PM / CIP [Phase 2]
│   ├── Harmonogramy CIP per maszyna/linia
│   ├── Checklist: temperatura, stezenie, czas, przeplyw
│   ├── Link do alergenow (zmiana produktu)
│   └── Audit trail sanitacji
└── E14.11 — Allergen Equipment Maintenance [Phase 2]
    ├── Weryfikacja czyszczenia po zmianie alergenu
    ├── Checklist per maszyna/linia
    └── Link do M01 allergens + M02 product allergens
```

---

## 8. Requirements

### E14.1 — Maintenance Settings & Asset Registry (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `maintenance_settings` | org_id (unique), default_pm_interval_days, alert_warning_days, alert_urgent_days, calibration_enabled, sanitation_enabled | Org-scoped | 1 rekord per org |
| `technician_profiles` | org_id, user_id (FK users), skill_level (enum: basic/advanced/specialist), specializations (JSONB), is_active | Org-scoped | Rozszerzenie users |

Rozszerzenie istniejacych tabel:
- `machines` + `last_pm_date TIMESTAMPTZ`, `next_pm_due DATE`, `total_maintenance_cost DECIMAL(12,2)`

**API Endpoints:**
- `GET/PUT /api/maintenance/settings` — konfiguracja maintenance per org
- `GET/POST/PUT /api/maintenance/technicians` — profile technikow
- `GET /api/maintenance/machines/:id/overview` — maintenance summary per maszyna

**Validation (Zod):**
- `maintenanceSettingsSchema`: alert_warning_days 1-365, alert_urgent_days 1-30, calibration_enabled boolean
- `technicianProfileSchema`: user_id UUID, skill_level enum, specializations array of strings

---

### E14.2 — Preventive Maintenance Scheduling (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `maintenance_schedules` | org_id, site_id (NULL), machine_id (FK), name, description, schedule_type (enum: time/usage/sanitation), interval_value INT, interval_unit (enum: hours/days/weeks/months/cycles/units_produced), warning_threshold_pct (default 80), urgent_threshold_pct (default 95), estimated_duration_minutes, required_skill_level, spare_parts_kit_id (FK NULL), is_active, last_executed_at, next_due_date | Org-scoped | Auto-calculate next_due |

**API Endpoints:**
- `GET /api/maintenance/schedules` — lista harmonogramow (filter: machine_id, schedule_type, is_active)
- `POST /api/maintenance/schedules` — tworzenie harmonogramu
- `PUT /api/maintenance/schedules/:id` — aktualizacja
- `DELETE /api/maintenance/schedules/:id` — soft delete (is_active=false)
- `GET /api/maintenance/schedules/upcoming` — nadchodzace PM (sort by next_due_date)
- `GET /api/maintenance/schedules/overdue` — przekroczone PM

**Validation (Zod):**
- `maintenanceScheduleSchema`: name 2-200 chars, schedule_type enum, interval_value > 0, interval_unit enum, machine_id UUID required, warning_threshold_pct 50-99, urgent_threshold_pct 80-100

**Logika:**
- Auto-calculate `next_due_date` = `last_executed_at` + interval
- Usage-based: porownanie z `machines.operating_hours` lub counters
- Eskalacja: cron job (Edge Function) sprawdza progi i tworzy MWO gdy threshold osiagniety

---

### E14.3 — Maintenance Work Orders (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `maintenance_work_orders` | org_id, site_id (NULL), wo_number (unique/org: MWO-YYYY-NNNNN), machine_id (FK), schedule_id (FK NULL), title, description, priority (enum: low/medium/high/urgent), status (enum: open/in_progress/completed/cancelled), source (enum: manual/schedule/downtime), assigned_to_id (FK users NULL), scheduled_date DATE, estimated_duration_minutes, started_at, completed_at, actual_duration_minutes, result (enum: success/partial/failed/deferred NULL), notes TEXT, verified_by_id (FK NULL), verified_at, downtime_log_id (FK NULL), cancelled_reason TEXT NULL | Org-scoped | State machine ADR-MNT-1 |
| `mwo_spare_parts` | org_id, mwo_id (FK), spare_part_id (FK), quantity_planned INT, quantity_used INT, cost_actual DECIMAL(10,2) | Org-scoped | Junction: MWO <-> spare parts |
| `mwo_checklists` | org_id, mwo_id (FK), item_order INT, description TEXT, is_completed BOOLEAN, completed_by_id (FK NULL), completed_at | Org-scoped | Opcjonalna checklist per MWO |

**API Endpoints:**
- `GET /api/maintenance/work-orders` — lista MWO (filter: status, machine_id, assigned_to, priority, date range)
- `POST /api/maintenance/work-orders` — tworzenie MWO
- `GET /api/maintenance/work-orders/:id` — szczegoly MWO
- `PUT /api/maintenance/work-orders/:id` — aktualizacja MWO
- `PATCH /api/maintenance/work-orders/:id/status` — zmiana statusu (state machine)
- `POST /api/maintenance/work-orders/:id/parts` — dodanie czesci do MWO
- `PUT /api/maintenance/work-orders/:id/parts/:partId` — aktualizacja zuzycia czesci
- `GET /api/maintenance/work-orders/:id/checklist` — checklist MWO
- `PUT /api/maintenance/work-orders/:id/checklist` — aktualizacja checklist

**Validation (Zod):**
- `mwoCreateSchema`: machine_id UUID required, title 2-200 chars, priority enum, scheduled_date ISO date
- `mwoStatusSchema`: status enum, guards validated server-side
- `mwoCompleteSchema`: actual_duration_minutes > 0 required, notes optional, result enum

**State Machine Guards:**
- `open -> in_progress`: assigned_to_id NOT NULL
- `in_progress -> completed`: actual_duration_minutes > 0
- `* -> cancelled`: cancelled_reason NOT NULL
- Override: rola maintenance_manager moze pominac guards z logowaniem

---

### E14.4 — Spare Parts Inventory (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `spare_parts` | org_id, site_id (NULL), code (unique/org: SP-XXX-NNN), name, description, manufacturer, part_number, supplier_id (FK NULL), cost DECIMAL(10,2), reorder_point INT, reorder_qty INT, lead_time_days INT, is_active | Org-scoped | Katalog czesci |
| `spare_parts_stock` | org_id, spare_part_id (FK), location_id (FK NULL), quantity INT, last_counted_at | Org-scoped; UNIQUE(org_id, spare_part_id, location_id) | Stany |
| `spare_parts_transactions` | org_id, spare_part_id (FK), mwo_id (FK NULL), transaction_type (enum: receipt/consumption/adjustment/transfer), quantity INT (+ or -), cost DECIMAL(10,2), reference_note, performed_by_id (FK), performed_at | Org-scoped | Historia ruchow |

**API Endpoints:**
- `GET/POST/PUT /api/maintenance/spare-parts` — CRUD katalog
- `GET /api/maintenance/spare-parts/:id/stock` — stany per lokalizacja
- `POST /api/maintenance/spare-parts/:id/transactions` — receipt/adjustment
- `GET /api/maintenance/spare-parts/low-stock` — czesci ponizej reorder_point
- `GET /api/maintenance/spare-parts/:id/history` — historia transakcji

**Validation (Zod):**
- `sparePartSchema`: code 2-30 chars (alphanum+dash), name 2-200 chars, cost >= 0, reorder_point >= 0
- `sparePartTransactionSchema`: transaction_type enum, quantity != 0, reference_note optional

---

### E14.5 — Maintenance History & Audit Trail (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `maintenance_history` | org_id, machine_id (FK), event_type (enum: pm_completed/pm_skipped/breakdown/repair/inspection/replacement/calibration/sanitation), title, description, event_date, duration_minutes, parts_cost DECIMAL(10,2), labor_cost DECIMAL(10,2), mwo_id (FK NULL), downtime_log_id (FK NULL), technician_id (FK NULL), attachments TEXT[] | Org-scoped | Timeline per maszyna |

**API Endpoints:**
- `GET /api/maintenance/history` — historia (filter: machine_id, event_type, date range)
- `GET /api/maintenance/machines/:id/timeline` — timeline per maszyna
- `GET /api/maintenance/machines/:id/costs` — koszty skumulowane per maszyna

Auto-insert: po zakonczeniu MWO (status -> completed) system tworzy rekord w maintenance_history.

Audit trail (ADR-008): PG triggers na maintenance_work_orders, calibration_records, spare_parts_stock.

---

### E14.6 — Calibration Tracking (Phase 1 Should Have)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `calibration_instruments` | org_id, machine_id (FK NULL), name, instrument_type (enum: scale/thermometer/ph_meter/pressure_gauge/other), serial_number, standard_applied (ISO 9001/NIST/internal), calibration_interval_days INT, last_calibrated_at, next_due_date, is_active | Org-scoped | Rejestr instrumentow |
| `calibration_records` | org_id, instrument_id (FK), calibration_date DATE, next_due_date DATE, result (enum: pass/fail/out_of_spec), performed_by TEXT, certificate_url TEXT, notes, deviation_value DECIMAL NULL, deviation_unit TEXT NULL | Org-scoped | Historia kalibracji |

**API Endpoints:**
- `GET/POST/PUT /api/maintenance/calibration/instruments` — CRUD instrumentow
- `GET /api/maintenance/calibration/instruments/due` — instrumenty do kalibracji (30d/7d/overdue)
- `POST /api/maintenance/calibration/records` — rejestracja kalibracji
- `GET /api/maintenance/calibration/instruments/:id/history` — historia kalibracji
- `POST /api/maintenance/calibration/records/:id/certificate` — upload certyfikatu (Supabase Storage)

**Validation (Zod):**
- `calibrationInstrumentSchema`: name 2-200 chars, instrument_type enum, calibration_interval_days 1-3650
- `calibrationRecordSchema`: calibration_date ISO date, result enum, performed_by 2-100 chars

---

### E14.7 — Auto-Generate MWO from Downtime (Phase 2)

**Integracja z M06 Production:**
- Endpoint: `POST /api/production/downtime` rozszerzony o `create_maintenance_task: boolean`
- Kiedy `create_maintenance_task = true`:
  1. Serwis wywoluje `MaintenanceWorkOrderService.createFromDowntime(downtimeLog)`
  2. Auto-populacja: machine_id, title = `"CM: {reason_label}"`, priority z kategorii, source = 'downtime'
  3. MWO tworzony w statusie OPEN
  4. `downtime_log_id` = FK do zrodlowego rekordu

**Integracja z M12 OEE:**
- Kiedy MTBF per maszyna spada ponizej progu (configurable w maintenance_settings):
  1. Alert do maintenance managera
  2. Opcjonalne auto-tworzenie MWO z source = 'mtbf_alert'

---

### E14.8 — Technician Scheduling (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | RLS |
|--------|-----------------|-----|
| `technician_availability` | org_id, user_id (FK), date DATE, shift (enum: am/pm/full), is_available BOOLEAN, note | Org-scoped |

**API Endpoints:**
- `GET /api/maintenance/technicians/schedule` — kalendarz dostepnosci
- `PUT /api/maintenance/technicians/:id/availability` — aktualizacja dostepnosci
- `GET /api/maintenance/technicians/suggest?skill_level=X&date=Y` — sugestia przypisania

**Logika:** Suggest technika wg: (1) wymagany skill_level, (2) dostepnosc w danym dniu, (3) aktualne obciazenie (ilosc otwartych MWO).

---

### E14.9 — Maintenance Dashboards (Phase 2)

**Widoki:**

| Dashboard | Metryki | Zrodlo danych |
|-----------|---------|---------------|
| Overview | MTBF, MTTR, PM adherence %, planned vs unplanned % | maintenance_work_orders + oee_shift_metrics |
| Cost Analysis | Koszt per maszyna, koszt per linia, parts vs labor split | maintenance_history + spare_parts_transactions |
| PM Calendar | Nadchodzace PM, overdue PM, ukonczone PM | maintenance_schedules |
| Spare Parts | Low stock alerts, consumption trend, top consumed parts | spare_parts_stock + spare_parts_transactions |
| Technician Workload | MWO per technik, avg completion time, backlog | maintenance_work_orders |

**API Endpoints:**
- `GET /api/maintenance/dashboard/overview` — KPI summary
- `GET /api/maintenance/dashboard/costs?period=month` — analiza kosztow
- `GET /api/maintenance/dashboard/calendar?from=&to=` — kalendarz PM
- `GET /api/maintenance/dashboard/spare-parts` — alerty stockowe

---

### E14.10 — Sanitation PM / CIP (Phase 2)

Rozszerzenie `maintenance_schedules` o `schedule_type = 'sanitation'`:

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `sanitation_checklists` | org_id, mwo_id (FK), temperature_ok BOOLEAN, concentration_ok BOOLEAN, time_minutes INT, flow_rate_ok BOOLEAN, allergen_verified BOOLEAN, product_before TEXT, product_after TEXT, verified_by_id (FK), verified_at | CIP-specific checklist |

**API Endpoints:**
- `POST /api/maintenance/work-orders/:id/sanitation-checklist` — wypelnienie CIP checklist
- `GET /api/maintenance/sanitation/schedule` — harmonogram CIP

---

### E14.11 — Allergen Equipment Maintenance (Phase 2)

Rozszerzenie sanitacji o weryfikacje alergenow:
- Kiedy produkt A (z alergenem X) -> produkt B (bez X): wymagana sanitacja + weryfikacja
- Link do `allergens` (M01) i `product_allergens` (M02)
- Checklist: „Czy maszyna zostala oczyszczona z alergenu X?" (per alergen)
- Blokada: nie mozna rozpoczac produkcji B dopoki sanitacja nie verified

---

## 9. KPIs

### Operacyjne Maintenance

| KPI | Cel | Pomiar |
|-----|-----|--------|
| MTBF (h) | wzrost 10% YoY | oee_shift_metrics (M12) |
| MTTR (min) | < 60 min srednia | maintenance_work_orders |
| PM Schedule Adherence % | > 85% | completed_on_time / total_scheduled |
| Planned vs Unplanned % | > 70% planned | source = schedule / total |
| Spare Parts Stockout Rate % | < 5% | stockout_events / total_demand |
| Maintenance Cost per Unit | tracking | total_cost / units_produced |
| MWO Completion Time (h) | < 4h | avg(completed_at - started_at) |
| Calibration Compliance % | 100% (zero overdue) | overdue_instruments = 0 |
| CIP Adherence % | 100% | cip_completed / cip_scheduled |

### Performance Maintenance

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Maintenance API P95 | < 500 ms | APM |
| Dashboard load P95 | < 2 s | Lighthouse |
| MWO list load (1000 records) | < 1 s | APM |
| Spare parts search | < 500 ms | APM |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| Domain expertise gap (CMMS) | Srednie | Sredni | Konsultacja z klientami pilotazowymi, MVP minimum |
| MWO state machine complexity | Srednie | Sredni | Prosty 4-stanowy model, rozszerzenie iteracyjne |
| Integracja z OEE (MTBF/MTTR) | Srednie | Wysoki | Czytelny kontrakt API, M14 read-only z OEE |
| Calibration compliance tracking | Niskie | Wysoki | Opcjonalne per org, proste alerting |
| Spare parts data accuracy | Srednie | Sredni | Mandatory receipt/consumption per MWO, reconciliation |
| CIP/sanitacja — zlozonosc food industry | Srednie | Sredni | Generyczne checklists, customizable per org |
| Luka RLS — cross-tenant maintenance data | Niskie | Krytyczny | Testy automatyczne org_id isolation, audit |
| Powiazanie downtime -> MWO (cross-module) | Srednie | Sredni | Service-to-service call, not DB trigger; fallback manual |

### Tech Debt
- **P1**: Brak cron job infrastructure dla PM eskalacji — rozwiazac przed M14 launch (Edge Function + pg_cron)
- **P1**: Brak notification system — Phase 2 M14 wymaga powiadomien (email/in-app)
- **P2**: Spare parts nie zintegrowane z Warehouse LP — osobny katalog na poczatek

---

## 11. Success Criteria

### Phase 1 (MVP Maintenance)
- [ ] Maintenance Settings konfigurowane per org
- [ ] PM scheduling dziala (time-based + usage-based)
- [ ] MWO CRUD + state machine (OPEN -> IN_PROGRESS -> COMPLETED + CANCELLED)
- [ ] Spare parts: katalog + stany + zuzycie per MWO
- [ ] Maintenance history: timeline per maszyna z kosztami
- [ ] Calibration records: rejestracja + alerty terminow
- [ ] Audit trail na wszystkich krytycznych tabelach M14
- [ ] RLS: 0 cross-tenant leaks w automated tests
- [ ] Maintenance API P95 < 500 ms

### Phase 2 (Integration)
- [ ] Auto-generacja MWO z downtime M06 (checkbox w Production)
- [ ] Technician scheduling z auto-suggest
- [ ] Maintenance dashboards z KPI (MTBF, MTTR, PM adherence, costs)
- [ ] Sanitation PM / CIP checklists
- [ ] Allergen equipment verification
- [ ] Link do M12 OEE (MTBF/MTTR read, TPM score)

### Biznesowe
- [ ] 3+ klientow pilotazowych uzywa M14
- [ ] Redukcja nieplanowanych przestojow o 20% (mierzone vs baseline)
- [ ] PM adherence > 85% u klientow pilotazowych
- [ ] 0 bugow Critical/High w M14

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD -> `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md` (sekcja M14)
- Maintenance Analysis -> `new-doc/14-maintenance/ANALYSIS.md`
- Settings PRD -> `new-doc/01-settings/prd/01-SETTINGS-PRD.md` (machines, FR-SET-050-056)
- Production PRD -> `new-doc/06-production/prd/` (downtime tracking, FR-PROD-019-020)
- OEE PRD -> `new-doc/12-oee/` (MTBF/MTTR story 10.16, TPM story 10.19)
- Design Guidelines -> `new-doc/_meta/DESIGN-GUIDELINES.md`
- PRD Update List -> `new-doc/_meta/PRD-UPDATE-LIST.md`

### ADR (M14-relevant)
- ADR-008: Audit Trail Strategy (maintenance_work_orders, calibration_records)
- ADR-013: RLS Org Isolation Pattern (org_id na wszystkich tabelach M14)
- ADR-015: Service Layer Constants
- ADR-016: CSV Parser (przyszly import spare parts)
- D-MNT-1 through D-MNT-8: Decyzje M14-specific (sekcja 6)

### Istniejace artefakty (referencje do M14 w kodzie)
- Machine status MAINTENANCE: `machines.status` enum w M01
- Downtime category 'maintenance': `downtime_logs.category` w M06
- MTBF/MTTR calculation: `oee_shift_metrics` w M12 (story 10.16)
- TPM integration scope: story 10.19 (M12)
- OEE-002 wireframe: checkbox „Create maintenance task" (nie zaimplementowany)

### Database schema (nowe tabele M14)
- Core: `maintenance_settings`, `technician_profiles`, `maintenance_schedules`, `maintenance_work_orders`
- Parts: `spare_parts`, `spare_parts_stock`, `spare_parts_transactions`, `mwo_spare_parts`
- History: `maintenance_history`, `mwo_checklists`
- Calibration: `calibration_instruments`, `calibration_records`
- Sanitation: `sanitation_checklists`
- Scheduling: `technician_availability`
- Total: 14 nowych tabel

### Competitive context
- Enterprise CMMS: Maximo ($500K+), Infor ($200-500K), Aptean ($100-300K)
- SMB CMMS: Fiix ($50-150/user), Maintenance Pro ($100-300/mo), Hippo ($100-500/mo)
- MonoPilot advantage: MES + CMMS + OEE w jednej platformie za $50/user/mo

---

_PRD 14-Maintenance v1.0 — 11 epikow (6 Phase 1 + 5 Phase 2), 14 nowych tabel, 8 decyzji M14-specific, 40+ API endpoints._
_Zaleznosci: M01 (maszyny), M06 (downtime), M12 (MTBF/MTTR). Backend-first: DB + API + Zod -> Frontend -> Integracje._
_Data: 2026-02-18_
