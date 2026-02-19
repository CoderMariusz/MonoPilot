# PRD 15-Reporting -- MonoPilot MES
**Wersja**: 1.0 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul Reporting (M15) dostarcza warstwe analityczno-raportowa dla MonoPilot MES. Budowany inkrementalnie po kolejnych modulach produkcyjnych, agreguje dane z Production (M06), Quality (M08), Warehouse (M03) i Settings (M01) w interaktywne dashboardy, tabele porownawcze i raporty okresowe.

**Kluczowy differentiator**: Materialized views z odswiezaniem < 3 min zapewniaja bliski real-time bez obciazania transakcyjnej bazy. Kalendarz fiskalny 4-4-5 (konfigurowalny) umozliwia porownania Period-over-Period i Year-over-Year zgodne z raportowaniem finansowym klienta.

**Zakres dokumentu**: 10 wymagan z PRD-UPDATE-LIST [10.1--10.10], rozlozonych na 4 epiki inkrementalne + 2 epiki infrastrukturalne (Data Pipeline, Report Export). Lacznie ~45 wymagan funkcjonalnych.

---

## 2. Objectives

### Cel glowny
Dostarczyc menedzerom i liderom produkcji natychmiastowy wglad w KPI fabryki -- yield, giveaway, efektywnosc, downtime, jakosc -- bez recznego otwierania arkuszy Excel.

### Cele szczegolowe
1. **Factory Overview w < 2 s** -- 5 kart KPI + trend 13-tygodniowy + Top 3 Gains/Losses
2. **Drill-down do linii i SKU** -- identyfikacja zrodel strat i zyskow
3. **Porownania czasowe** -- W/W, P/P (4-4-5), Y/Y, AM vs PM
4. **Ocena liderow** -- Scorecard A/B/C/D, porownanie zespolow, savings calculator
5. **Raporty okresowe** -- P1-P13 z eksportem PDF/CSV do zarzadu

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Dashboard load P95 | < 2 s | APM / Lighthouse |
| Data freshness (MV refresh) | < 3 min | pg_stat_user_tables |
| Report accuracy vs Excel | 100% (brak rozbieznosci) | Manual audit kwartalny |
| Adoption rate | > 60% users weekly | Analytics (page views) |
| Time-to-insight (vs Excel) | -80% | User survey |

---

## 3. Personas

| Persona | Interakcja z Reporting | Kluczowe dashboardy |
|---------|----------------------|---------------------|
| **Kierownik produkcji** | Glowny uzytkownik; codzienny review | Factory Overview, Yield by Line, Shift Performance |
| **Lider zmiany** | Przeglad wynikow swojej zmiany | Shift Performance, Daily Issues, Yield by SKU |
| **Supervisor** | Porownanie zespolow, ocena liderow | Leader Scorecard, Supervisor Comparison, Giveaway |
| **Dyrektor zakladu** | Przeglad tygodniowy/okresowy (read-only) | Factory Overview, Period Reports, Year-over-Year |
| **Kierownik jakosci** | QC Holds, Yield Issues | QC Holds Dashboard, Yield Issues |

---

## 4. Scope

### 4.1 In Scope -- Phase 1 (MVP)

| Epik | Dashboardy | Priorytet |
|------|-----------|-----------|
| M15-E1 (po M06) | Factory Overview, Yield by Line, Yield by SKU | Must Have |
| M15-E2 (po M08) | QC Holds Dashboard, Yield Issues | Should Have |
| Data Pipeline | Materialized views, refresh logic, calendar engine | Must Have |

### 4.2 Out of Scope -- Phase 2

| Epik | Dashboardy | Uzasadnienie |
|------|-----------|-------------|
| M15-E3 | Giveaway Analysis, Leader Scorecard, Daily Issues, Shift Performance | Wymaga danych z shift reports |
| M15-E4 | Supervisor Comparison, Period Reports 4-4-5, Multi-granularity time | Wymaga fiscal calendar w Settings |
| Report Export | PDF/CSV export, print-optimized views | Post-MVP |

### 4.3 Exclusions (Nigdy)
- **Real-time streaming** (WebSocket push) -- materialized views wystarczaja
- **BI tool embedding** (Metabase/Looker) -- wlasne dashboardy
- **Predictive analytics / ML** -- nie w MVP ani Phase 2
- **Ad-hoc SQL queries** -- bezpieczenstwo multi-tenant wyklucza

---

## 5. Constraints

### Techniczne
- **Materialized views**: Refresh co 1-3 min (pg_cron); nie real-time; uzytkownik widzi dane z opoznieniem
- **RLS na MV**: Materialized views NIE obsluguja RLS natywnie -- filtrowanie org_id w warstwie serwisowej (service role + filtr)
- **Supabase pg_cron**: Dostepny w Pro plan; fallback: Edge Function cron
- **D3.js client-side**: Wykresy renderowane w przegladarce; duze datasety (>10k punktow) wymagaja agregacji server-side
- **REC-L1 -- site_id na wszystkich tabelach i MV**: `site_id UUID NULL` na WSZYSTKICH tabelach i materialized views M15. Filtrowanie per site w WHERE clause. Przygotowanie na M11 Multi-Site. Dotyczy: `fiscal_periods`, `report_exports`, `mv_yield_by_line_week`, `mv_yield_by_sku_week`, `mv_factory_kpi_week`, `mv_downtime_by_line`, `mv_qc_holds_summary`. NULL = brak filtrowania per site (domyslne dla single-site orgs).

### Biznesowe
- Dane zrodlowe z M06 Production musza istniec przed M15-E1
- Dane QC z M08 Quality musza istniec przed M15-E2
- Fiscal calendar config (M01 Settings [1.4]) wymagany przed M15-E4
- Target KPI config (M01 Settings [1.5]) wymagany przed M15-E1 (fallback: hardcoded defaults)
- Grade thresholds config (M01 Settings [1.3]) wymagany przed M15-E3

### Regulacyjne
- Audit trail na eksportowanych raportach (kto, kiedy, jaki zakres dat)
- Dane nie opuszczaja tenant boundary (org_id isolation)

---

## 6. Decisions

### D-RPT-1. Materialized Views vs Real-Time Queries
**Decyzja**: Materialized views dla wszystkich agregatow. Real-time queries tylko dla statusow biezacych (np. aktywne WO).
**Uzasadnienie**: Zapytania agregujace na duzych tabelach (wo_outputs, wo_consumptions) sa zbyt wolne dla interaktywnych dashboardow. MV z refreshem < 3 min to akceptowalny kompromis.
**Implementacja**: `REFRESH MATERIALIZED VIEW CONCURRENTLY` (bez blokowania odczytow) przez pg_cron co 2 min.

### D-RPT-2. Kalendarz fiskalny 4-4-5
**Decyzja**: Tabela `fiscal_periods` generowana na podstawie `organization_settings.fiscal_calendar_type` (4-4-5 / 4-5-4 / 5-4-4 / calendar months).
**Implementacja**: Funkcja PG `generate_fiscal_periods(org_id, year)` generuje P1-P13 z datami start/end. Wywoływana przy zmianie konfiguracji lub przy pierwszym uzyciu roku.
**Fallback**: Jesli org nie skonfigurowal -- domyslnie `calendar_months` (P1=Jan, P2=Feb, ...).

### D-RPT-3. Zrodla KPI
**Decyzja**: Yield %, Giveaway %, Efficiency % -- z `wo_outputs` + `wo_consumptions` (M06). QC Holds -- z `quality_holds` (M08). Variance GBP -- `(actual_yield - target_yield) * kg_usage * cost_per_kg`.
**Wagi**: Yield % i GA % liczone jako weighted average po KG Usage (nie prosta srednia).

### D-RPT-4. Multi-Granularity Time Selection
**Decyzja**: Globalny selektor w headerze: Day | Week | Period | Year. Stan persystowany w URL query params.
**Zachowanie**: Zmiana granularnosci przelicza smart default (np. Week 7 -> Period 2, Year 2026). Wszystkie dashboardy reaguja na zmiane granularnosci.

### D-RPT-5. Grading System A/B/C/D
**Decyzja**: Ocena wieloskaldnikowa: Yield % + GA % + Efficiency %. Progi konfigurowane w Settings ([1.3] grade_thresholds). Domyslne: A (>=95%, <=1.5%, >=80%), B (>=92%, <=2.0%, >=75%), C (>=90%, <=2.5%, >=70%), D (ponizej).
**Wymaganie**: Najgorsza skladowa determinuje ocene (np. Yield A + GA D = D).

### D-RPT-6. Refresh Strategy
**Decyzja**: pg_cron co 2 minuty dla MV produkcyjnych. Edge Function fallback jesli pg_cron niedostepny. Timestamp ostatniego refresha widoczny w UI ("Dane z: 14:32").
**Monitoring**: Alert jesli refresh > 5 min opozniony.

### D-RPT-7. Downtime Categories
**Decyzja**: 3 kategorie: People / Process / Plant. Kazdy rekord downtime przypisany do jednej kategorii. Minuty sumowane per kategoria per linia per zmiana.

### D-RPT-8. Chart Library
**Decyzja**: D3.js dla wszystkich wykresow (trend lines, bar charts, heatmapy, combo charts). Recharts jako fallback dla prostych wykresow. Brak ciezkich BI frameworkow.

---

## 7. Module Map

```
Reporting (M15) -- INKREMENTALNY
|
+-- M15-DP -- Data Aggregation Pipeline (infrastruktura)
|   +-- Materialized views (yield, giveaway, efficiency, downtime)
|   +-- Fiscal calendar engine (4-4-5 / 4-5-4 / 5-4-4 / months)
|   +-- Refresh logic (pg_cron / Edge Function)
|   +-- KPI aggregation engine (weighted avg, sum, comparison)
|
+-- M15-E1 (Phase 1, po M06) -- Core Production Dashboards
|   +-- [10.1] Factory Overview Dashboard
|   +-- [10.2] Yield by Line Analysis
|   +-- [10.3] Yield by SKU Drill-Down
|
+-- M15-E2 (Phase 1, po M08) -- Quality Dashboards
|   +-- QC Holds Dashboard
|   +-- Yield Issues Tracking
|
+-- M15-E3 (Phase 2) -- Advanced Analytics
|   +-- [10.4] Giveaway Analysis Dashboard
|   +-- [10.5] Leader Scorecard (A/B/C/D)
|   +-- [10.8] Daily Issues Analysis (Top 3 downtime)
|   +-- [10.9] Shift Performance Overview
|
+-- M15-E4 (Phase 2) -- Period & Comparison
|   +-- [10.6] Supervisor Team Comparison
|   +-- [10.7] Period Reports 4-4-5
|   +-- [10.10] Multi-Granularity Time Selection
|
+-- M15-EX -- Report Export (Phase 2)
    +-- PDF export (print-optimized)
    +-- CSV export (Excel-compatible)
    +-- Copy to Clipboard (tab-separated)
```

---

## 8. Requirements

### M15-DP -- Data Aggregation Pipeline (Phase 1)

**Backend -- Materialized Views:**

| View | Zrodlo | Kolumny kluczowe | Refresh |
|------|--------|-----------------|---------|
| `mv_yield_by_line_week` | wo_outputs + wo_consumptions | org_id, line_id, week_ending, kg_output, kg_usage, yield_pct, target_yield_pct, variance_pct, variance_gbp | 2 min |
| `mv_yield_by_sku_week` | wo_outputs + products | org_id, line_id, product_id, fg_code, week_ending, kg_output, yield_pct, target_yield_pct, variance_gbp | 2 min |
| `mv_factory_kpi_week` | mv_yield_by_line_week (agregat) | org_id, week_ending, weighted_yield_pct, weighted_ga_pct, avg_efficiency_pct, total_cases, total_variance_gbp | 2 min |
| `mv_downtime_by_line` | wo_downtime | org_id, line_id, date, shift, people_mins, process_mins, plant_mins, total_mins | 2 min |
| `mv_qc_holds_summary` | quality_holds | org_id, date, line_id, boxes_held, boxes_rejected, labour_hours | 5 min |

**Backend -- Tabele:**

| Tabela | Kolumny kluczowe | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `fiscal_periods` | org_id, site_id UUID NULL, fiscal_year, period_number, start_date, end_date, weeks_count, calendar_type | Org-scoped | Generowana automatycznie; site_id NULL przygotowanie na M11 Multi-Site |
| `mv_refresh_log` | view_name, started_at, completed_at, rows_affected, duration_ms | System | Monitoring |
| `report_exports` | org_id, site_id UUID NULL, user_id, report_type, date_range, format, exported_at | Org-scoped | Audit trail; site_id NULL przygotowanie na M11 Multi-Site |

**API Endpoints:**
- `GET /api/reporting/factory-overview?week=YYYY-MM-DD` -- 5 KPI + trend + top gains/losses
- `GET /api/reporting/yield-by-line?week=YYYY-MM-DD&shift=AM|PM|both` -- tabela linii z W/W
- `GET /api/reporting/yield-by-sku?week=YYYY-MM-DD&line_id=UUID` -- drill-down SKU
- `GET /api/reporting/refresh-status` -- timestamp ostatniego refresha per MV
- `GET /api/reporting/fiscal-periods?year=YYYY` -- periody fiskalne dla org

**Validation (Zod):**
- `reportingQuerySchema`: week (ISO date, Saturday), shift enum, line_id UUID optional, page/limit
- `fiscalPeriodSchema`: year 2020-2099, period 1-13

**Implementacja refresh:**
```sql
-- pg_cron job (co 2 minuty)
SELECT cron.schedule('mv-refresh-yield', '*/2 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_yield_by_line_week;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_yield_by_sku_week;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_factory_kpi_week;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_downtime_by_line$$
);
```

---

### M15-E1 -- Core Production Dashboards (Phase 1, po M06)

**[10.1] Factory Overview Dashboard -- HIGH**

**Backend**: Endpoint `GET /api/reporting/factory-overview` zwraca:
- 5 KPI: Yield % (weighted avg), GA % (weighted avg), Efficiency % (avg), Cases (sum), Variance GBP (sum)
- W/W change badges (current vs previous week)
- Top 3 Gains (linie z najwyzsza pozytywna variance GBP)
- Top 3 Losses (linie z najwyzsza negatywna variance GBP)
- 13-week trend data (yield % per week + target)
- Variance by line (bar chart data)

**Frontend/UX:**
- RPT-001: 5 KPI cards w rzedzie z W/W pill badges (green/red/gray)
- RPT-002: 13-week yield trend chart (D3.js line + area gradient + target dashed line)
- RPT-003: Top 3 Gains/Losses tabbed panels
- RPT-004: Yield Variance by Line horizontal bar chart (D3.js, green/red)
- RPT-005: Week selector dropdown (W/E DD/MM/YYYY)
- Responsive: Desktop 5 cards/row, Tablet 3+2, Mobile 2/row

**[10.2] Yield by Line Analysis -- HIGH**

**Backend**: Endpoint `GET /api/reporting/yield-by-line` zwraca:
- Tabela: Line, KG Output, Yield %, Target %, Variance %, Variance GBP, Previous Week Yield %, W/W Change
- Factory average footer (weighted)
- Inline 13-week sparkline data per linia

**Frontend/UX:**
- RPT-010: Sortowalna tabela z W/W comparison columns
- RPT-011: Inline sparkline D3.js trend charts (expandable rows)
- RPT-012: Top 3 Gains/Losses panels nad tabela
- RPT-013: Global filter bar (Week, Team, Shift, Line Manager, Product Category)
- RPT-014: Factory average footer row (bold, light background)
- RPT-015: Copy to Clipboard (tab-separated, Excel-compatible)
- RPT-016: Drill-down do Yield by SKU (klik na linie)

**[10.3] Yield by SKU Drill-Down -- HIGH**

**Backend**: Endpoint `GET /api/reporting/yield-by-sku` zwraca:
- Tabela: FG Code, Description, KG Output, Yield %, Target %, Variance %, Variance GBP, Contribution %
- Line summary header (total KG, yield %, variance, SKU count)
- 13-week trend data per SKU

**Frontend/UX:**
- RPT-020: SKU tabela z contribution % bars (mini wizualizacja)
- RPT-021: Breadcrumb: Overview > Yield by Line > Line XX > SKU Detail
- RPT-022: Line summary header card
- RPT-023: Inline SKU trend charts (lazy loaded)

---

### M15-E2 -- Quality Dashboards (Phase 1, po M08)

**QC Holds Dashboard**

**Backend**: Endpoint `GET /api/reporting/qc-holds?date=YYYY-MM-DD` zwraca:
- Tabela: Line, Product Code, Boxes Held, Boxes Rejected, Staff, Time Taken, Labour Hours, Reason/Action
- Summary: total boxes held, total labour hours
- AM vs PM split

**Frontend/UX:**
- RPT-030: QC Holds table z highlighted rejections (red rows)
- RPT-031: Summary card (total boxes, labour hours)
- RPT-032: AM/PM toggle
- RPT-033: "No QC holds today" success message (jesli puste)

**Yield Issues Tracking**

**Backend**: Endpoint `GET /api/reporting/yield-issues?date=YYYY-MM-DD` zwraca:
- Tabela: Code, Description, Target Yield %, Actual Yield %, Target GA %, Actual GA %, Claim %, Value GBP, Reason
- Summary: total value impact

**Frontend/UX:**
- RPT-035: Yield Issues table z highlighted below-target rows
- RPT-036: Total value impact summary
- RPT-037: "No yield issues today" success message (jesli puste)

---

### M15-E3 -- Advanced Analytics (Phase 2)

**[10.4] Giveaway Analysis Dashboard -- HIGH**

**Backend**: Endpoint `GET /api/reporting/giveaway` zwraca:
- GA by Line tabela (GA %, Target, Variance %, Variance GBP)
- SKU-level GA drill-down z contribution analysis
- Factory GA 13-week trend (D3.js, inverted logic: below target = green)
- GA by Line Manager (grouped bar chart)
- GA by Supervisor comparison

**Frontend/UX:**
- RPT-040: GA by Line tabela (red highlight > target)
- RPT-041: SKU drill-down z contribution
- RPT-042: Factory GA trend chart (D3.js, area above target shaded red)
- RPT-043: GA by Manager grouped bar chart (D3.js)
- RPT-044: Supervisor GA comparison table z ranking

**[10.5] Leader Scorecard (A/B/C/D) -- HIGH**

**Backend**: Endpoint `GET /api/reporting/leader-scorecard` zwraca:
- Tabela: Name, Team, KG Output, Yield %, GA %, Efficiency %, Grade
- 13-week heatmap data (leaders x weeks x metric)
- Grade criteria z Settings ([1.3])
- Individual detail data (lines worked, period summary)

**Frontend/UX:**
- RPT-050: Scorecard tabela z grade badges (A=green, B=blue, C=amber, D=red)
- RPT-051: Detail drawer (slide-in, 400px, trend charts per leader)
- RPT-052: D3.js heatmap (leaders x weeks, color scale red-yellow-green)
- RPT-053: Grade criteria reference panel
- RPT-054: Period filtering (P1-P13 selector)

**[10.8] Daily Issues Analysis -- HIGH**

**Backend**: Endpoint `GET /api/reporting/daily-issues?date=YYYY-MM-DD` zwraca:
- Top 3 issues (linie z najwyzszym downtime, category breakdown People/Process/Plant)
- All lines downtime (stacked bar chart data)
- Total downtime summary (donut chart data)
- AM vs PM split

**Frontend/UX:**
- RPT-060: Top 3 Issue cards (rank badge, line, minutes, category bar, expand details)
- RPT-061: D3.js horizontal stacked bar chart (People blue, Process amber, Plant red)
- RPT-062: D3.js donut chart (total downtime split)
- RPT-063: Date selector (available dates)
- RPT-064: AM/PM/Daily/Compare toggle
- RPT-065: Expandable issue details (parsed comma-separated items z duration)

**[10.9] Shift Performance Overview -- HIGH**

**Backend**: Endpoint `GET /api/reporting/shift-performance?date=YYYY-MM-DD` zwraca:
- Primary KPI: Efficiency %, Hrs vs Plan, Changeovers, Planned Lines, Actual Lines, Cases, Packets
- Secondary metrics: Eng Downtime %, GA %, Yield Variance GBP, Slow Running %, Stops %, itd.
- QC Hold summary, Yield Issues summary, Safety summary
- AM vs PM comparison
- Hourly efficiency data, Line-by-line heatmap data

**Frontend/UX:**
- RPT-070: 7 primary KPI cards z variance badges
- RPT-071: Secondary metrics grid (3-4 kolumny, color-coded)
- RPT-072: AM vs PM comparison table (better shift highlighted green)
- RPT-073: D3.js hourly efficiency trend chart (target line, red shading below)
- RPT-074: D3.js line performance heatmap (lines x hours, color scale)
- RPT-075: QC Hold panel, Yield Issues panel, Safety summary
- RPT-076: Export (Copy to Clipboard + Print PDF)

---

### M15-E4 -- Period & Comparison (Phase 2)

**[10.6] Supervisor Team Comparison -- MEDIUM**

**Backend**: Endpoint `GET /api/reporting/supervisor-comparison` zwraca:
- Team summary: Supervisor, Team Size, KG Output, Yield %, GA %, Efficiency %, Variance GBP, Ranking
- Multi-line trend data (all teams on one chart)
- Team x Line matrix (heatmap)
- Potential savings calculation: `(bestTeamYield - teamYield) * teamKgUsage * costPerKg`

**Frontend/UX:**
- RPT-080: Team summary tabela z ranking badges (gold for #1)
- RPT-081: D3.js multi-line trend charts (toggle teams on/off)
- RPT-082: Team x Line heatmap matrix
- RPT-083: Potential Savings section (prominent GBP value + breakdown)
- RPT-084: Drill-down do Leader Scorecard (klik na team)

**[10.7] Period Reports 4-4-5 -- MEDIUM**

**Backend**: Endpoint `GET /api/reporting/period-reports?year=YYYY` zwraca:
- P1-P13 tabela: Period, Weeks, KG Output, Yield %, GA %, Efficiency %, Variance GBP
- P/P comparison (consecutive periods)
- Y/Y comparison (same period previous year)
- Year-end summary (best/worst periods, highlights)

**Frontend/UX:**
- RPT-090: P1-P13 summary table (current period highlighted)
- RPT-091: P/P comparison columns z color-coded change badges
- RPT-092: Y/Y comparison table z year selector
- RPT-093: D3.js combo chart (bars=KG Output, lines=Yield%+GA%, dual Y-axis)
- RPT-094: Year-end summary card
- RPT-095: Print-optimized view (@media print CSS)
- RPT-096: Fiscal year selector (tabs/dropdown)

**[10.10] Multi-Granularity Time Selection -- MEDIUM**

**Backend**: Wszystkie reporting endpoints obsluguja parametr `granularity=day|week|period|year`:
- Day: filtruje po dacie, trend 14 dni
- Week: filtruje po week ending, trend 13 tygodni
- Period: filtruje po fiscal period, trend 13 periodow
- Year: agregat calego roku, breakdown P1-P13

**Frontend/UX:**
- RPT-100: Globalny GranularitySelector w headerze (Day | Week | Period | Year pill toggle)
- RPT-101: Polymorphic TimeValueSelector (date picker / week dropdown / period selector / year tabs)
- RPT-102: Smart default conversion (Week 7 -> Period 2, itd.)
- RPT-103: Stan granularnosci persystowany w URL query params
- RPT-104: Wszystkie dashboardy reaguja na zmiane granularnosci

---

### M15-EX -- Report Export (Phase 2)

**Backend:**
- `POST /api/reporting/export` -- generuje PDF/CSV z parametrami: report_type, date_range, format
- Zapis do `report_exports` (audit trail)
- PDF via edge function (Puppeteer/html-pdf)
- CSV via streaming response

**Frontend/UX:**
- RPT-110: Export button na kazdym dashboardzie
- RPT-111: Copy to Clipboard (tab-separated, Excel-compatible)
- RPT-112: Print PDF (@media print + SVG-to-canvas conversion)
- RPT-113: CSV download z progress indicator

---

## 9. KPIs

### Performance
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Dashboard load P95 | < 2 s | APM (Lighthouse) |
| MV refresh time | < 30 s per view | mv_refresh_log |
| Data freshness | < 3 min | last_refresh_at timestamp |
| API response P95 | < 500 ms | APM |
| Chart render time | < 500 ms | Client-side perf.mark |

### Business
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Weekly active users (Reporting) | > 60% org users | Analytics page views |
| Reports exported per week | > 5 per org | report_exports count |
| Time-to-insight vs Excel | -80% | User survey |
| Dashboard adoption (7 days) | > 3 dashboardy per user | Analytics |

### Data Quality
| KPI | Cel | Pomiar |
|-----|-----|--------|
| MV refresh success rate | 99.9% | mv_refresh_log errors |
| Fiscal period accuracy | 100% vs Excel Cal | Manual quarterly audit |
| KPI calculation accuracy | 100% vs manual calc | Automated test suite |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| MV refresh performance degradation przy duzych datasetach | Srednie | Wysoki | CONCURRENTLY refresh, partycjonowanie MV, monitoring czasu refresha |
| Data freshness expectations vs reality (uzytkownicy oczekuja real-time) | Wysokie | Sredni | Widoczny timestamp "Dane z: HH:MM", edukacja w onboardingu |
| Zlozonosc agregatow (weighted avg, cross-module joins) | Srednie | Sredni | Prekomputowane MV, unit testy agregatow, porownanie z Excel |
| Fiscal calendar complexity (4-4-5 edge cases: tydzien 53, rok przestepny) | Srednie | Sredni | Comprehensive unit tests, walidacja vs istniejace Excel Cal |
| Cross-module data dependencies (M06, M08 musza istniec) | Niskie | Wysoki | Graceful degradation: "Brak danych produkcyjnych" zamiast bledu |
| RLS na materialized views | Srednie | Krytyczny | Filtr org_id w service layer (nie w MV), testy izolacji |
| D3.js performance przy duzych heatmapach (26 linii x 16h) | Niskie | Sredni | Virtual rendering, agregacja server-side, lazy loading |
| pg_cron niedostepny (free tier Supabase) | Srednie | Sredni | Fallback: Edge Function cron (Supabase scheduled functions) |

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] Factory Overview Dashboard laduje sie w < 2 s z 5 KPI cards
- [ ] Yield by Line tabela z sortowaniem, W/W comparison, inline sparklines
- [ ] Yield by SKU drill-down z contribution %, breadcrumb navigation
- [ ] Data aggregation pipeline: MV odswieza sie co 2 min bez blokowania
- [ ] Fiscal periods generowane poprawnie (4-4-5 / calendar months)
- [ ] Week selector aktualizuje wszystkie komponenty dashboardu
- [ ] Top 3 Gains/Losses poprawnie identyfikowane
- [ ] Variance GBP obliczone: `(actual_yield - target) * kg_usage * cost_per_kg`
- [ ] QC Holds Dashboard (Phase 1 jesli M08 gotowe)

### Niefunkcjonalne
- [ ] Dashboard load P95 < 2 s
- [ ] MV refresh < 30 s per view
- [ ] Data freshness < 3 min
- [ ] RLS isolation: 0 cross-tenant data leaks
- [ ] Responsive layout: desktop + tablet

### Biznesowe
- [ ] > 60% uzytkownikow uzywa Reporting tygodniowo (po 30 dniach)
- [ ] 100% zgodnosc KPI z recznym obliczeniem Excel
- [ ] 0 bugow Critical/High w Reporting

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD -> `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md` (sekcja M15)
- PRD Update List (items 10.1-10.10) -> `new-doc/_meta/PRD-UPDATE-LIST.md`
- Raporting stories (15 plikow) -> `new-doc/Raporting/stories/`
- Multi-granularity time plan -> `new-doc/Raporting/plans/multi-granularity-time-selection.md`
- Design Guidelines -> `new-doc/_meta/DESIGN-GUIDELINES.md`

### Upstream PRD References (REC-L6)
- M06 Production PRD: `new-doc/06-production/prd/06-PRODUCTION-PRD.md`
- M03 Warehouse PRD: `new-doc/03-warehouse/prd/03-WAREHOUSE-PRD.md`
- M08 Quality PRD: `new-doc/08-quality/prd/08-QUALITY-PRD.md`
- M01 Settings PRD: `new-doc/01-settings/prd/01-SETTINGS-PRD.md` (waste_categories, grade_thresholds, fiscal_calendar, target_kpis)

### Zaleznosci (PRD moduly)
- M01 Settings ([1.3] Grade thresholds, [1.4] Fiscal calendar, [1.5] Target KPIs)
- M06 Production (wo_outputs, wo_consumptions, wo_downtime, shifts) -> `06-production/prd/06-PRODUCTION-PRD.md`
- M08 Quality (quality_holds, yield_issues) -> `08-quality/prd/08-QUALITY-PRD.md`
- M03 Warehouse (license_plates, locations, inventory_moves) -> `03-warehouse/prd/03-WAREHOUSE-PRD.md`
- M02 Technical (products.cost_per_kg, products.yield_percent)

### ADR (Reporting-relevant)
- ADR-003: Multi-Tenancy RLS (org_id filtrowanie w service layer dla MV)
- ADR-008: Audit Trail (report_exports logging)
- ADR-013: RLS Org Isolation Pattern

### Raporting stories mapping
| PRD Item | Story zrodlowe | Epik |
|----------|---------------|------|
| [10.1] Factory Overview | story-2.1 | M15-E1 |
| [10.2] Yield by Line | story-2.2 | M15-E1 |
| [10.3] Yield by SKU | story-2.3 | M15-E1 |
| [10.4] Giveaway | story-3.1 | M15-E3 |
| [10.5] Leader Scorecard | story-3.2 | M15-E3 |
| [10.6] Supervisor Comparison | story-3.3 | M15-E4 |
| [10.7] Period Reports | story-3.5 | M15-E4 |
| [10.8] Daily Issues | story-4.2 | M15-E3 |
| [10.9] Shift Performance | story-4.4 | M15-E3 |
| [10.10] Multi-granularity time | plan: multi-granularity | M15-E4 |
| Calendar engine | story-1.2 | M15-DP |
| QC Holds | story-4.4 (AC 4.4.4) | M15-E2 |
| Yield Issues | story-4.4 (AC 4.4.5) | M15-E2 |

---

_PRD 15-Reporting v1.0 -- 6 epikow (2 Phase 1 + 3 Phase 2 + 1 infrastruktura), ~45 wymagan, 8 decyzji Reporting-specific._
_Inkrementalny modul: M15-E1 po M06, M15-E2 po M08, M15-E3/E4 Phase 2. Materialized views z refreshem < 3 min. Kalendarz fiskalny 4-4-5 konfigurowalny._
_Data: 2026-02-18_
