# PRD 10-Finance — MonoPilot MES
**Wersja**: 1.0 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul Finance (M10) dostarcza mozliwosc kosztowania produkcji, analizy odchylen (variance), wyceny zapasow i raportowania marzy dla operacji produkcji zywnosci. MonoPilot NIE jest pelnym systemem ksiegowym — Finance zapewnia widocznosc kosztow produkcyjnych i integruje sie z zewnetrznymi systemami ERP (Comarch Optima, Sage, wFirma).

**Zakres**: Kosztowanie standardowe i rzeczywiste, analiza odchylen (variance GBP per linia/SKU), wycena zapasow FIFO/WAC, analiza marzy, eksport danych do ERP.

**Poza zakresem**: General Ledger, Accounts Receivable/Payable, fakturowanie, pelna ksiegowosc.

**Kluczowy differentiator**: Real-time variance tracking z alertami progowymi — konkurencja (3/4 graczy) oferuje variance analysis; MonoPilot musi to dorownac z dodatkowym savings calculator.

**Zaleznosci**: M06 Production (WO, zuzycie materialow, czas pracy), M03 Warehouse (stany magazynowe, LP, warstwy kosztowe), M02 Technical (BOM, routing, produkty), M01 Settings (org, role, waluty).

**Status implementacji**: Phase 2 — zaplanowane (0/26 stories zrealizowanych). 101 wymagan funkcjonalnych, 19 tabel bazodanowych.

---

## 2. Objectives

### Cel glowny
Dostarczyc pelen obraz kosztow produkcji dla SMB food manufacturing — od kosztu materialu przez prace i overhead do odchylen i marzy — umozliwiajac podejmowanie decyzji opartych na danych bez potrzeby pelnego ERP.

### Cele szczegolowe
1. **Variance visibility** — real-time tracking odchylen GBP per WO, linia, SKU, zmiana
2. **Cost per KG** — analiza kosztu na kg per produkt (wymaganie [8.3] HIGH)
3. **Savings identification** — kalkulator potencjalnych oszczednosci (best vs actual yield x cost) ([8.2] MEDIUM)
4. **Inventory valuation** — wycena FIFO i WAC z dokladnoscia >98%
5. **ERP integration** — bezproblemowy eksport do Comarch Optima (batch dzienny)
6. **Budget adherence** — monitorowanie budzetu per centrum kosztowe

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Variance GBP per WO | Obliczony w <30 s od transakcji | APM |
| Cost per KG accuracy | >98% vs fizyczna inwentaryzacja | Audit kwartalny |
| Inventory valuation accuracy | >98% | FIFO/WAC vs fizyczny stan |
| Margin calculation lag | <24 h od zakonczenia WO | work_order_costs.status |
| Export success rate | >99% | finance_exports.status |
| Alert acknowledgement | 70% w <2 h | variance_alerts.acknowledged_at |
| Budget adherence | Odchylenie <10% | cost_center_budgets vs actuals |

---

## 3. Personas

| Persona | Interakcja z Finance | Kluczowe akcje |
|---------|---------------------|----------------|
| **Finance Manager** | Glowny uzytkownik | Standard costs, variance review, margin analysis, budget, Comarch export, alerty |
| **Kierownik produkcji** | WO costs read-only | Podglad kosztow WO, variance per linia, savings calculator |
| **Dyrektor zakladu** | Dashboardy KPI | Finance dashboard, cost trends, margin trends, budget vs actual |
| **Administrator** | Konfiguracja | Waluty, kody VAT, centra kosztowe, progi alertow, mapowania GL |
| **Owner** | Pelne uprawnienia | Zatwierdzanie kosztow standardowych, eksport, budzety |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP Finance)

| Obszar | Wymagania | Priorytet |
|--------|-----------|-----------|
| Koszty standardowe (material, labor, overhead) | FR-9.1.1–4 | Must Have |
| Kosztowanie materialowe per transakcja zuzycia | FR-9.1.1, FR-9.3.1 | Must Have |
| Kosztowanie pracy per operacja WO | FR-9.1.2, FR-9.3.2 | Must Have |
| WO Cost Summary (actual vs standard) | FR-9.3.4, FR-9.3.6 | Must Have |
| BOM/Recipe Costing (ingredient + packaging) | FR-9.2.1–2 | Must Have |
| Wycena zapasow FIFO i WAC | FR-9.5.1–2, FR-9.5.4 | Must Have |
| Cost per KG per produkt [8.3] | FR-FIN-CPK | Must Have |
| Centrum kosztowe CRUD + przypisanie | FR-9.10.1, FR-9.10.3 | Must Have |
| Waluty CRUD (GBP base, PLN+EUR Phase 2) | FR-9.8.1–5 | Must Have |
| Kody VAT (PL: 23/8/5/0%) | FR-9.9.1–3 | Must Have |
| Dashboard KPI Finance | FR-9.6.7 | Must Have |
| Raporty: koszt per produkt, per okres | FR-9.6.1–2 | Must Have |
| Eksport CSV/XML | FR-9.12.1–2 | Must Have |

### 4.2 Out of Scope — Phase 2 (Advanced)

| Obszar | Wymagania | Uzasadnienie |
|--------|-----------|--------------|
| [8.1] Variance GBP tracking (real-time) | FR-FIN-050–056 | Wymaga stabilnego Phase 1 |
| [8.2] Savings calculator | FR-FIN-SAVE | Wymaga variance danych |
| Overhead allocation | FR-9.1.3 | Konfiguracja driverow |
| Cost rollup multi-level BOM | FR-9.1.5, FR-9.1.7 | Zlozonosc kalkulacji |
| Variance breakdown (MPV/MQV/LRV/LEV) | FR-9.4.1–4, FR-FIN-052–054 | Advanced analytics |
| Variance threshold alerts | FR-FIN-051 | Zalezy od variance calc |
| Variance trend dashboard | FR-FIN-055 | Zalezy od historii variance |
| Variance drill-down per product/line/shift | FR-FIN-056 | Zalezy od danych Phase 1 |
| Margin analysis per product family | FR-FIN-057 | Wymaga selling price |
| BOM cost simulation + comparison | FR-9.2.3–4 | Post-MVP |
| Budget definition + tracking | FR-9.11.1–2 | Post-MVP |
| Comarch Optima format export | FR-9.12.3, FR-FIN-058 | Post-MVP integracja |
| GL account mapping | FR-9.12.7 | Post-MVP |
| Multi-currency PLN+EUR simultaneous | FR-9.8.6 | Post-MVP |
| Koszt per linia/centrum kosztowe | FR-9.6.3–4 | Post-MVP |

### 4.3 Out of Scope — Phase 3 (Enterprise)

| Obszar | Uzasadnienie |
|--------|--------------|
| Cost approval workflow | Enterprise |
| Variance root cause + approval | Enterprise |
| Margin by customer, contribution margin | Enterprise |
| Budget forecasting + approval + alerts | Enterprise |
| Inventory revaluation | Enterprise |
| Scheduled exports | Enterprise |
| Custom cost reports | Enterprise |
| Exchange rate API (auto-import) | Enterprise |
| Byproduct cost credit | Enterprise |

### 4.4 Exclusions (Nigdy)

- **General Ledger (GL)** — integracja z Comarch/Sage, nie budujemy
- **Accounts Receivable/Payable** — domena ERP
- **Fakturowanie** — poza zakresem MES
- **Payroll** — poza domena
- **Activity-based costing (ABC)** — zbyt zlozony dla SMB

---

## 5. Constraints

### Techniczne
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach finance (ADR-013)
- **Service Role**: API routes uzywaja service role z filtrami org_id
- **site_id UUID NULL**: Na wszystkich tabelach (przygotowanie do M11 Multi-Site)
- **Waluta bazowa**: GBP domyslnie (rynek UK); PLN+EUR jednoczesnie w Phase 2
- **Precision**: DECIMAL(15,4) dla kwot; DECIMAL(15,6) dla kursow walut
- **Real-time variance**: Obliczenia via DB trigger + cache (latencja <30 s)

### Biznesowe
- NIE pelny ERP — wylacznie koszt produkcji, variance, marza
- Comarch Optima jako jedyny ERP target w Phase 2; Sage/wFirma w Phase 3
- Modul premium (wymagana licencja)

### Regulacyjne
- Audit trail na zmianach kosztow standardowych (ADR-008)
- VAT compliance: polskie stawki (23%, 8%, 5%, 0%) + reverse charge
- Retencja danych finansowych: minimum 5 lat

---

## 6. Decisions

### D-FIN-1. Kosztowanie: Standard vs Actual (dual)
System utrzymuje **koszty standardowe** (planowane) i **koszty rzeczywiste** (z transakcji). Variance = Actual - Standard. Koszty standardowe definiowane per produkt/material z effective_from/to. Koszty rzeczywiste obliczane automatycznie z transakcji zuzycia materialow i czasu pracy.

### D-FIN-2. Real-Time Variance Calculation
Variance obliczany **przy kazdej transakcji** (material consumption, labor booking), nie tylko przy zakonczeniu WO. Tabela `work_order_costs` aktualizowana inkrementalnie. Progi ostrzezenia (warning/critical) w `variance_thresholds`. Alerty w `variance_alerts`. Odswiezone co 5 min lub przy transakcji.

### D-FIN-3. Waluta bazowa: GBP
GBP jako base currency (rynek docelowy UK). Wszystkie koszty przechowywane w walucie bazowej. Multi-currency (PLN+EUR jednoczesne) w Phase 2. Kursy walut z effective_date. Przeliczanie automatyczne przy transakcjach.

### D-FIN-4. Wycena zapasow: FIFO + WAC
Dwie metody obsługiwane rownolegle — organizacja wybiera domyslna. **FIFO**: warstwy kosztowe per lot (`inventory_cost_layers`), zuzycie najstarszych najpierw. **WAC (Weighted Average Cost)**: sredni wazony koszt aktualizowany przy kazdym przyjeciu. Wartosc zapasow = suma warstw (FIFO) lub qty x avg_cost (WAC).

### D-FIN-5. Cost Rollup Multi-Level BOM
Kalkulacja kosztow od najnizszego poziomu BOM w gore. Dla kazdego poziomu: suma (qty x unit_cost) materialow + labor + overhead z routing. Wynik w `cost_rollups` z effective_date. Phase 1: single-level. Phase 2: multi-level (rekurencyjny).

### D-FIN-6. Integracja Comarch Optima
Eksport batch dzienny (nie real-time). Format: XML/CSV z mapowaniem pol MonoPilot -> Comarch (NumerDokumentu, DataWystawienia, Kontrahent.NIP, Pozycje). GL account mapping per kategoria kosztu. Variance export na osobne konta GL (MPV, MQV, LRV, LEV, OHV). Adapter pattern — przygotowany na Sage/wFirma.

### D-FIN-7. RLS i bezpieczenstwo
`org_id UUID NOT NULL` na WSZYSTKICH tabelach finance. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Rola `finance_manager` ma pelne CRUD. Rola `finance_viewer` ma read-only + export. `production_manager` widzi tylko WO costs. Zatwierdzanie kosztow standardowych wymaga roli finance_manager+.

### D-FIN-8. VAT Integration
Kody VAT w tabeli `tax_codes` (M01 Settings, reuse). Finance wykorzystuje je do kalkulacji podatkowych na transakcjach. Multi-country VAT (POL-23%, POL-8%, RC+/-) w Phase 2 ([1.1] HIGH).

### D-FIN-9. Cost per KG ([8.3]) — Finance Ownership
Pole `cost_per_kg` na tabeli `products` (M02 Technical) jest **definiowane i struktur­alizowane przez M02 Technical**, ale **zarządzane i aktualizowane przez M10 Finance**.

**Rola Finance (M10)**:
- Oblicza `cost_per_kg` na podstawie: `(material_cost + labor_cost + overhead) / weight_produced_kg`
- Uaktualnia wartość `products.cost_per_kg` po każdym zatwierdzeniu kosztów standardowych lub zamknięciu WO
- Utrzymuje historię zmian (audit trail) w `standard_costs` z effective_from/to
- Wykorzystuje to pole do analiz variance, raportowania kosztów, oraz kalkulacji savings calculator [8.2]

**Rola Technical (M02)**:
- Wyświetla pole `cost_per_kg` jako read-only na Product form i w BOM explosion
- Nie edytuje bezpośrednio — wszelkie aktualizacje pochodzą od Finance
- Używa wartości do szacowania kosztów materialnych w BOM breakdown

**Raportowanie** (Finance): variance GBP per kg, trend per produkt, comparison per linia.

### D-FIN-10. Savings Calculator ([8.2])
Formuła: `potential_savings = (actual_yield - best_yield) x cost_per_kg x volume`. Best yield = najlepsza zmiana/linia w wybranym okresie. Dashboard widget z kwota potencjalnych oszczednosci per produkt/linia. Phase 2.

---

## 7. Module Map

```
Finance (M10)
|-- E10.1 -- Finance Setup & Configuration [Phase 1]
|   |-- Finance settings (valuation method, currency)
|   |-- Centra kosztowe CRUD + hierarchia
|   |-- Waluty CRUD + kursy walut
|   +-- Kody VAT (reuse M01)
|
|-- E10.2 -- Standard Costs & Material Costing [Phase 1]
|   |-- Standard cost definition (material, labor, overhead)
|   |-- Material cost tracking per consumption
|   +-- Cost per KG per product [8.3]
|
|-- E10.3 -- Labor Costing [Phase 1]
|   |-- Labor cost per WO operation
|   +-- Hourly rate per cost center
|
|-- E10.4 -- WO Cost Summary & BOM Costing [Phase 1]
|   |-- WO actual vs standard cost summary
|   |-- WO unit cost (per unit produced)
|   |-- BOM/Recipe cost calculation
|   +-- Ingredient + packaging costing
|
|-- E10.5 -- Inventory Valuation [Phase 1]
|   |-- FIFO valuation (cost layers)
|   |-- WAC valuation
|   +-- Inventory value report
|
|-- E10.6 -- Cost Reporting & Dashboard [Phase 1]
|   |-- Finance KPI dashboard
|   |-- Cost by product report
|   |-- Cost by period report
|   +-- CSV/XML export
|
|-- E10.7 -- Variance Analysis [Phase 2]
|   |-- [8.1] Variance GBP tracking (real-time)
|   |-- Material variance breakdown (MPV + MQV)
|   |-- Labor variance breakdown (LRV + LEV)
|   |-- Overhead variance allocation
|   |-- Yield/scrap variance
|   |-- Variance threshold alerts
|   |-- Variance trend dashboard
|   +-- Variance drill-down per product/line/shift
|
|-- E10.8 -- Advanced Costing [Phase 2]
|   |-- Multi-level BOM cost rollup
|   |-- Overhead allocation (configurable drivers)
|   |-- BOM cost simulation + comparison
|   |-- WO cost by operation (routing breakdown)
|   +-- [8.2] Savings calculator
|
|-- E10.9 -- Margin Analysis [Phase 2]
|   |-- Product margin calculation
|   |-- Margin by product family
|   +-- Target margin comparison
|
|-- E10.10 -- Budget & Integration [Phase 2]
|   |-- Budget definition per cost center
|   |-- Budget vs actual report
|   |-- GL account mapping
|   |-- Comarch Optima export (XML)
|   +-- Variance export to Comarch
|
+-- E10.11 -- Enterprise [Phase 3]
    |-- Cost approval workflow
    |-- Variance root cause + approval
    |-- Budget forecasting + approval + alerts
    |-- Margin by customer, contribution margin
    |-- Scheduled exports
    |-- Inventory revaluation
    +-- Custom cost reports
```

---

## 8. Requirements

### E10.1 -- Finance Setup & Configuration (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `finance_settings` | org_id, default_valuation_method, default_currency_id, variance_calculation_enabled | Org-scoped | 1 rekord per org |
| `cost_centers` | org_id, code, name, parent_id, type (production/overhead/admin), production_line_id, is_active | Org-scoped | Hierarchia self-ref |
| `currencies` | org_id, code (PLN/EUR/USD/GBP), name, symbol, is_base, is_active, exchange_rate | Org-scoped | GBP base domyslnie |
| `exchange_rates` | org_id, currency_id, effective_date, rate, source | Org-scoped | Historia kursow |

**API Endpoints:**
- `GET/PUT /api/finance/settings` -- konfiguracja modulu
- `GET/POST/PUT/DELETE /api/finance/cost-centers` -- centra kosztowe CRUD
- `GET /api/finance/cost-centers/tree` -- hierarchia tree
- `GET/POST/PATCH/DELETE /api/finance/currencies` -- waluty CRUD
- `POST /api/finance/currencies/:id/exchange-rates` -- dodaj kurs
- `GET /api/finance/currencies/:id/exchange-rates` -- historia kursow

**Validation (Zod):**
- `financeSettingsSchema`: valuation_method enum (fifo/wac), currency_id UUID
- `costCenterSchema`: code 2-50 chars unique/org, name 2-100 chars, type enum
- `currencySchema`: code 3 chars ISO 4217, name 2-50 chars, is_base boolean
- `exchangeRateSchema`: rate > 0, effective_date DATE, source enum (manual/api)

**Frontend/UX:**
- FIN-SETUP: Finance Settings page (valuation method, currency selection)
- FIN-CC: Cost Center list + tree view + create/edit modal

---

### E10.2 -- Standard Costs & Material Costing (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `standard_costs` | org_id, item_id (FK products), item_type, effective_from/to, material_cost, labor_cost, overhead_cost, total_cost, currency_id, uom, cost_basis, status, approved_by/at | Wersjonowane z datami |
| `material_consumption_costs` | org_id, consumption_id, work_order_id, product_id, quantity, uom, unit_cost, total_cost, currency_id, cost_method, cost_center_id, transaction_date | Per transakcja zuzycia |

**API Endpoints:**
- `GET/POST/PATCH /api/finance/standard-costs` -- CRUD kosztow standardowych
- `POST /api/finance/standard-costs/:id/approve` -- zatwierdzenie
- `GET /api/finance/standard-costs/by-product/:productId` -- per produkt

**Logika biznesowa:**
1. Material cost tracking: przy kazdym zuzyciu materialow w WO, pobierz unit_cost z warstwy FIFO lub WAC
2. Przelicz na walute bazowa jesli potrzeba
3. Zapisz w `material_consumption_costs`
4. Zaktualizuj `work_order_costs.material_cost_actual`

---

### E10.3 -- Labor Costing (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `labor_costs` | org_id, work_order_id, operation_id, user_id, hours_actual, hours_standard, hourly_rate, total_cost, currency_id, cost_center_id, transaction_date | Per operacja WO |

**API Endpoints:**
- `GET /api/finance/work-order-costs/:workOrderId/labor` -- koszty pracy per WO

**Logika biznesowa:**
1. Przy rejestracji czasu pracy na operacji WO, oblicz: total_cost = hours_actual x hourly_rate
2. Hourly rate z cost center lub konfiguracji globalnej
3. Zaktualizuj `work_order_costs.labor_cost_actual`

---

### E10.4 -- WO Cost Summary & BOM Costing (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `work_order_costs` | org_id, work_order_id, material_cost_actual/standard, material_variance, labor_cost_actual/standard, labor_variance, overhead_cost_actual/standard, overhead_variance, total_cost_actual/standard, total_variance, quantity_produced, unit_cost_actual/standard, currency_id, cost_center_id, costing_date, status | 1 rekord per WO |
| `cost_rollups` | org_id, product_id, bom_id, effective_date, level, material_cost, labor_cost, overhead_cost, total_cost, currency_id, calculation_method | Kalkulacja BOM |

**API Endpoints:**
- `GET /api/finance/work-order-costs/:workOrderId` -- WO cost summary
- `POST /api/finance/work-order-costs/:workOrderId/calculate` -- oblicz koszty WO
- `GET /api/finance/bom-costs/:bomId` -- BOM cost breakdown
- `POST /api/finance/bom-costs/:bomId/calculate` -- kalkulacja kosztow BOM

**Frontend/UX:**
- FIN-003: WO Cost Summary Card (actual vs standard, variance color-coded)
- FIN-004: BOM Costing Page (ingredient + packaging breakdown)

---

### E10.5 -- Inventory Valuation (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `inventory_cost_layers` | org_id, product_id, location_id, lot_number, quantity_received, quantity_remaining, unit_cost, total_cost, currency_id, receipt_date, valuation_method | Warstwy FIFO |

**API Endpoints:**
- `GET /api/finance/inventory-valuation` -- podsumowanie wyceny
- `GET /api/finance/inventory-valuation/:productId` -- per produkt
- `POST /api/finance/inventory-valuation/calculate` -- oblicz wartosc
- `GET /api/finance/inventory-valuation/cost-layers` -- warstwy FIFO

**Logika FIFO:**
1. Nowe przyjecie -> nowa warstwa (qty_received, unit_cost, receipt_date)
2. Zuzycie -> konsumuj najstarsza warstwe (zmniejsz qty_remaining)
3. Wartosc zapasow = SUM(qty_remaining x unit_cost) per produkt

**Logika WAC:**
1. Nowe przyjecie -> aktualizuj avg_cost = (stary_total + nowy_total) / (stara_qty + nowa_qty)
2. Zuzycie -> wycen po avg_cost
3. Wartosc zapasow = qty x avg_cost

**Frontend/UX:**
- FIN-005: Inventory Valuation Report (metoda, location filter, aging, cost layers)

---

### E10.6 -- Cost Reporting & Dashboard (Phase 1)

**API Endpoints:**
- `GET /api/finance/dashboard/kpis` -- KPI Finance (total costs, variance, inventory value)
- `GET /api/finance/dashboard/cost-trends` -- trendy kosztow (6 mies.)
- `GET /api/finance/reports/cost-by-product` -- koszt per produkt
- `GET /api/finance/reports/cost-by-period` -- koszt per okres
- `POST /api/finance/exports/csv` -- eksport CSV
- `POST /api/finance/exports/xml` -- eksport XML
- `GET /api/finance/exports` -- historia eksportow

**Frontend/UX:**
- FIN-001: Finance Dashboard (KPI cards: total cost, variance, inventory value, margin, budget; trend chart 6 mies.; top variances; alert panel)
- FIN-011: Cost Reporting Suite (by product, by period, drill-down)

---

### E10.7 -- Variance Analysis (Phase 2) [8.1]

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `cost_variances` | org_id, work_order_id, variance_type (material_price/material_usage/labor_rate/labor_efficiency/overhead/yield), variance_amount, currency_id, standard_amount, actual_amount, variance_percent, root_cause_category, notes, status, reviewed_by/at | Szczegolowy breakdown |
| `variance_thresholds` | org_id, cost_category, warning_threshold_pct, critical_threshold_pct, is_active, notify_roles (JSONB), notify_email | Progi alertow |
| `variance_alerts` | org_id, work_order_id, variance_type, severity (warning/critical), variance_amount, variance_percent, threshold_id, status (active/acknowledged/resolved), acknowledged_by/at/notes | Aktywne alerty |

**API Endpoints (Variance):**
- `GET /api/finance/variances` -- lista odchylen
- `PATCH /api/finance/variances/:id` -- aktualizacja (notes, root cause)
- `GET /api/finance/work-order-costs/:workOrderId/realtime` -- real-time variance
- `GET /api/finance/work-order-costs/:workOrderId/material-breakdown` -- MPV + MQV
- `GET /api/finance/work-order-costs/:workOrderId/labor-breakdown` -- LRV + LEV

**API Endpoints (Alerts):**
- `GET/POST/PATCH/DELETE /api/finance/variance-thresholds` -- progi CRUD
- `GET /api/finance/variance-alerts` -- aktywne alerty
- `POST /api/finance/variance-alerts/:id/acknowledge` -- potwierdzenie
- `POST /api/finance/variance-alerts/:id/resolve` -- rozwiazanie

**API Endpoints (Trends):**
- `GET /api/finance/reports/variance-trends` -- trendy odchylen
- `GET /api/finance/reports/variance-by-product` -- per produkt
- `GET /api/finance/reports/variance-by-line` -- per linia
- `GET /api/finance/reports/variance-by-shift` -- per zmiana

**Formuly variance:**
```
Material Price Variance (MPV) = (Actual Price - Standard Price) x Actual Qty
Material Quantity Variance (MQV) = (Actual Qty - Standard Qty) x Standard Price
Labor Rate Variance (LRV) = (Actual Rate - Standard Rate) x Actual Hours
Labor Efficiency Variance (LEV) = (Actual Hours - Standard Hours) x Standard Rate
Yield Variance = (Actual Yield - Standard Yield) x Standard Cost
Overhead Spending = Actual Overhead - Budgeted Overhead
Overhead Volume = Budgeted Overhead - Applied Overhead
```

**Frontend/UX:**
- FIN-009: Real-Time Variance Dashboard (alerty, progi, trend)
- FIN-007: Material Variance Report (MPV vs MQV, drill-down per material)
- FIN-008: Labor Variance Report (LRV vs LEV, drill-down per operacja)
- FIN-010: Variance Drill-Down (per product/line/shift, export CSV)

---

### E10.8 -- Advanced Costing (Phase 2) [8.2]

**API Endpoints:**
- `POST /api/finance/bom-costs/:bomId/simulate` -- symulacja zmiany BOM
- `GET /api/finance/bom-costs/compare` -- porownanie wersji BOM
- `GET /api/finance/work-order-costs/:workOrderId/overhead` -- overhead per WO
- `GET /api/finance/work-order-costs/:workOrderId/by-operation` -- per routing step
- `GET /api/finance/reports/savings-calculator` -- [8.2] savings calculator

**Savings Calculator [8.2] Formula:**
```
Potential Savings = (Actual Yield - Best Yield) x Cost per KG x Volume
Best Yield = max(yield) across shifts/lines in selected period
```

**Backend dodatkowy:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `overhead_allocations` | org_id, work_order_id, cost_center_id, allocation_basis (labor_hours/machine_hours/units), basis_quantity, rate, total_cost, currency_id, allocation_date | Overhead applied |

---

### E10.9 -- Margin Analysis (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `product_margins` | org_id, product_id, effective_date, selling_price, total_cost, margin_amount, margin_percent, target_margin_percent, currency_id | Per produkt |

**API Endpoints:**
- `GET /api/finance/margins` -- lista marzy produktowych
- `POST /api/finance/margins/:productId/calculate` -- oblicz marze
- `GET /api/finance/reports/margin-by-product` -- marza per produkt
- `GET /api/finance/reports/margin-by-family` -- marza per rodzina produktow
- `GET /api/finance/reports/margin-trends` -- trendy marzy

**Frontend/UX:**
- FIN-013: Margin Analysis Dashboard (per product family, target vs actual, trend)

---

### E10.10 -- Budget & Integration (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `cost_center_budgets` | org_id, cost_center_id, period_start/end, budget_amount, currency_id, category (material/labor/overhead), status (draft/approved/active), approved_by/at | Budget per CC |
| `gl_account_mappings` | org_id, cost_category, cost_subcategory, gl_account_code, gl_account_name, is_active | Mapowanie GL |
| `finance_exports` | org_id, export_type (csv/xml/comarch_optima), period_start/end, file_name, file_path, record_count, status, exported_by/at | Audit eksportow |
| `variance_exports` | org_id, export_id, variance_id, gl_account_code, amount, exported_at | Variance -> Comarch |

**API Endpoints:**
- `GET/POST /api/finance/cost-centers/:id/budgets` -- budzety per CC
- `GET /api/finance/reports/budget-vs-actual` -- budget vs actual
- `GET/POST/PATCH /api/finance/gl-mappings` -- mapowania GL CRUD
- `POST /api/finance/exports/comarch` -- eksport Comarch Optima
- `POST /api/finance/exports/comarch/variances` -- eksport variance -> Comarch
- `GET /api/finance/exports` -- historia eksportow
- `GET /api/finance/exports/:id/download` -- pobranie pliku

**Frontend/UX:**
- FIN-014: Cost Center Budget Page
- FIN-016: Comarch Optima Integration (konfiguracja, eksport, historia)

---

## 9. KPIs

### Operacyjne Finance
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Variance GBP per WO | Obliczony automatycznie | work_order_costs |
| Variance GBP per line/SKU | Zagregowany z WO costs | Materialized view |
| Cost per KG (GBP) | Per produkt, trending | products.cost_per_kg + kalkulacja |
| Potential Savings GBP | Per linia/produkt | Savings calculator |
| Inventory valuation accuracy | >98% | Audit kwartalny FIFO/WAC |
| Margin % | Per produkt/rodzina | product_margins |
| Budget adherence | <10% odchylenie | cost_center_budgets vs actuals |

### Performance Finance
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Finance API P95 | <500 ms | APM |
| Finance dashboard load | <2 s | Lighthouse |
| Cost calculation per WO | <3 s | APM |
| Real-time variance refresh | <30 s | APM |
| Export generation (10K rows) | <30 s | finance_exports |
| Alert notification delivery | <1 min | variance_alerts.created_at |

### Biznesowe Finance
| KPI | Cel | Pomiar |
|-----|-----|--------|
| WO costed within 24h | 100% | work_order_costs.status |
| Variance alerts acknowledged | 70% w <2h | variance_alerts |
| Cost overruns same-day | 100% identified | Alerty |
| Variance investigation time | -60% vs manual | User survey |
| Month-end close time | -40% vs manual | Customer feedback |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| Zlozonosc cost rollup multi-level BOM | Wysokie | Wysoki | Phase 1 = single-level; multi-level Phase 2; testy na glebokim BOM (5+ levels) |
| Rozbieznosci walutowe (kursy, zaokraglenia) | Srednie | Wysoki | DECIMAL(15,4) precision; walidacja kursow > 0; audit trail kursow; reczna korekta |
| Integracja Comarch Optima (format XML) | Srednie | Sredni | Adapter pattern; walidacja schema; retry logic; manual download fallback |
| Variance calculation lag (>30 s) | Srednie | Sredni | DB trigger + cache; async processing; materialized views dla agregatow |
| Bledne koszty standardowe -> false variance | Niskie | Wysoki | Approval workflow; effective dates; audit trail; porownanie z historyczna |
| Alert fatigue (zbyt wiele alertow) | Srednie | Sredni | Konfigurowalne progi per kategoria; severity levels; batching alertow |
| Luka RLS -> wyciek danych finansowych | Niskie | Krytyczny | Testy automatyczne org_id isolation; security audit; middleware check |
| Adopcja przez uzytkownikow (zlozonosc UI) | Srednie | Sredni | Wizard interface; stopniowy rollout; training; intuitive dashboard |

### Tech Debt (Finance-specific)
- **P0**: Brak transakcji DB w multi-step cost calculations (material + labor + overhead)
- **P1**: Brak partycjonowania `cost_variances` (problem przy >100K records)
- **P1**: Brak cache na standard costs lookup (latency)
- **P2**: Brak paginacji w variance list (ok do ~500, problem przy wiecej)

---

## 11. Success Criteria

### Funkcjonalne
- [ ] Standard cost definition CRUD dziala (material, labor, overhead per produkt)
- [ ] Material cost tracking per consumption transaction
- [ ] Labor cost tracking per WO operation
- [ ] WO Cost Summary: actual vs standard z variance
- [ ] WO Unit Cost obliczony automatycznie
- [ ] BOM/Recipe cost calculation (ingredient + packaging)
- [ ] Inventory valuation FIFO i WAC
- [ ] Cost per KG analysis per produkt [8.3]
- [ ] Finance Dashboard z KPI cards i trend charts
- [ ] Cost by product i cost by period reports
- [ ] CSV/XML export dziala
- [ ] [Phase 2] Variance GBP tracking real-time [8.1]
- [ ] [Phase 2] Variance breakdown: MPV, MQV, LRV, LEV
- [ ] [Phase 2] Savings calculator [8.2]
- [ ] [Phase 2] Margin analysis per product family
- [ ] [Phase 2] Comarch Optima export

### Niefunkcjonalne
- [ ] RLS: 0 cross-tenant leaks w automated tests
- [ ] Finance API P95 <500 ms
- [ ] Finance pages P95 <2 s
- [ ] Cost calculation per WO <3 s
- [ ] Real-time variance refresh <30 s
- [ ] Export success rate >99%
- [ ] Inventory valuation accuracy >98%

### Biznesowe
- [ ] 100% WO costed within 24h of completion
- [ ] 70% variance alerts acknowledged within 2h
- [ ] Cost overruns identified same-day
- [ ] Variance investigation time reduced 60%
- [ ] 90% users access finance dashboard weekly

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD -> `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Poprzedni Finance PRD (v1.1) -> `new-doc/10-finance/prd/finance.md`
- Finance Analysis -> `new-doc/10-finance/ANALYSIS.md`
- Finance Architecture -> `new-doc/10-finance/decisions/finance-arch.md`
- PRD Update List (77 items) -> `new-doc/_meta/PRD-UPDATE-LIST.md`
- Design Guidelines -> `new-doc/_meta/DESIGN-GUIDELINES.md`

### ADR (Finance-relevant)
- ADR-003: Multi-Tenancy RLS
- ADR-008: Audit Trail Strategy
- ADR-009: Routing Costs (setup_cost, working_cost_per_unit, overhead_percent)
- ADR-013: RLS Org Isolation Pattern

### Database schema (19 tabel)
- Setup: `finance_settings`, `cost_centers`, `currencies`, `exchange_rates`
- Costs: `standard_costs`, `cost_rollups`, `work_order_costs`, `material_consumption_costs`, `labor_costs`, `overhead_allocations`
- Variance: `cost_variances`, `variance_thresholds`, `variance_alerts`, `variance_exports`
- Valuation: `inventory_cost_layers`
- Margin: `product_margins`
- Budget: `cost_center_budgets`
- Integration: `gl_account_mappings`, `finance_exports`

### Implementation artifacts
- Stories 09.1-09.26 -> `new-doc/10-finance/stories/`
- UX Wireframes FIN-001-FIN-016 -> `new-doc/10-finance/ux/`
- Story contexts (135 YAML) -> `new-doc/10-finance/stories/context/`
- Implementation roadmap -> `new-doc/10-finance/stories/IMPLEMENTATION-ROADMAP.yaml`

### FR Coverage Summary
- **Phase 1**: 27 P0 requirements (stories 09.1-09.10) -- foundation costing
- **Phase 2**: ~45 requirements (stories 09.11-09.20) -- variance + advanced + margin
- **Phase 3**: ~29 requirements (stories 09.21-09.26) -- enterprise analytics
- **Total**: 101 wymagan + 3 z PRD-UPDATE-LIST [8.1, 8.2, 8.3]

---

_PRD 10-Finance v1.0 — 11 epikow (6 Phase 1 + 4 Phase 2 + 1 Phase 3), 101+3 wymagan, 19 tabel, 10 decyzji Finance-specific._
_Kluczowe: GBP base currency, dual costing (standard+actual), real-time variance, FIFO/WAC, cost_per_kg per produkt, savings calculator, Comarch Optima adapter._
_Data: 2026-02-18_
