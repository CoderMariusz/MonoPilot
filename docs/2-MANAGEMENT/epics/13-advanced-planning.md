# Epic 13: Advanced Planning (MRP & Demand) - Phase 3

**Status:** PLANNED
**Priority:** P2 - Wazna funkcjonalnosc dla wiekszych klientow
**Stories:** 20
**Estimated Effort:** 8-10 tygodni
**Dependencies:** Epic 3 (Planning), Epic 5 (Warehouse), Epic 12 (Finance)

---

## 1. Overview

### 1.1 Cel Epica

Modul Advanced Planning rozszerza podstawowe planowanie o zaawansowane funkcje:
- **Demand Forecasting** - prognozowanie zapotrzebowania
- **Auto-Replenishment** - automatyczne generowanie PO/WO
- **Safety Stock Management** - zarzadzanie zapasem bezpieczenstwa
- **MRP Enhancements** - rozszerzone Material Requirements Planning

### 1.2 Luki Konkurencyjne Zamykane

| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| Demand Forecasting | 4/4 maja | Implementowane w tym epicu |
| Auto-Replenishment | 3/4 maja | Implementowane w tym epicu |
| Safety Stock | 4/4 maja | Implementowane w tym epicu |
| MRP | 4/4 maja (advanced) | Rozszerzane w tym epicu |

### 1.3 Business Value

- **Redukcja braków:** Automatyczne uzupełnianie zapobiega stock-outom
- **Optymalizacja zapasów:** Wlasciwy poziom safety stock
- **Planowanie produkcji:** Lepsze prognozy = lepszy plan
- **Efektywnosc:** Mniej recznej pracy w planowaniu

---

## 2. User Stories

### 2.1 Demand Forecasting

#### Story 13.1: Historical Demand Analysis

**Jako** Planner
**Chce** analizowac historyczne zuzycie/sprzedaz
**Aby** zrozumiec wzorce popytu

**Acceptance Criteria:**
- [ ] Wykres historycznego zużycia per produkt
- [ ] Agregacja: dzien, tydzien, miesiac
- [ ] Identyfikacja trendów (rosnacy, malejacy, stabilny)
- [ ] Identyfikacja sezonowosci (opcjonalnie)
- [ ] Data range selection

**Technical Notes:**
- Analiza danych z: WO consumption, SO shipments
- Agregacja w materialized view lub on-demand

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.2: Demand Forecast Generation

**Jako** Planner
**Chce** generowac prognozy popytu
**Aby** planowac zakupy i produkcje

**Acceptance Criteria:**
- [ ] Prognoza na podstawie historii (moving average, exponential smoothing)
- [ ] Horyzont: 4-12 tygodni
- [ ] Confidence intervals (low, mid, high)
- [ ] Manual override możliwy
- [ ] Zapisanie forecast do systemu

**Technical Notes:**
```sql
CREATE TABLE demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    forecast_date DATE NOT NULL,
    forecast_period VARCHAR(10), -- weekly, monthly
    quantity_forecast NUMERIC(15,4),
    quantity_low NUMERIC(15,4),
    quantity_high NUMERIC(15,4),
    forecast_method VARCHAR(30), -- moving_avg, exp_smooth, manual
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    is_manual_override BOOLEAN DEFAULT false,
    UNIQUE(org_id, product_id, forecast_date, forecast_period)
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 13.3: Forecast vs Actual Comparison

**Jako** Planner
**Chce** porownywac prognozy z rzeczywistością
**Aby** poprawiac jakość prognoz

**Acceptance Criteria:**
- [ ] Porównanie forecast vs actual per okres
- [ ] Forecast accuracy % (MAPE - Mean Absolute Percentage Error)
- [ ] Bias detection (systematyczne przeszacowanie/niedoszacowanie)
- [ ] Trend accuracy over time

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.4: Forecast-Driven MRP

**Jako** Planner
**Chce** aby MRP uwzględniał prognozy
**Aby** planować z wyprzedzeniem

**Acceptance Criteria:**
- [ ] MRP run uwzględnia demand forecast
- [ ] Obok firm orders (SO) - planned demand
- [ ] Time-phased requirements
- [ ] Planned WO/PO suggestions

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

### 2.2 Safety Stock Management

#### Story 13.5: Safety Stock Configuration

**Jako** Planner
**Chce** definiowac safety stock per produkt
**Aby** miec bufor bezpieczenstwa

**Acceptance Criteria:**
- [ ] Pole safety_stock_qty na produkcie
- [ ] Lub safety_stock_days (dni pokrycia)
- [ ] Kalkulacja automatyczna (opcjonalne)
- [ ] Rozne poziomy per lokalizacja (opcjonalne)

**Technical Notes:**
```sql
ALTER TABLE products ADD COLUMN safety_stock_qty NUMERIC(15,4) DEFAULT 0;
ALTER TABLE products ADD COLUMN safety_stock_days INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN reorder_point NUMERIC(15,4);
ALTER TABLE products ADD COLUMN reorder_qty NUMERIC(15,4);
```

**Priority:** Must Have
**Estimate:** S
**Phase:** 3

---

#### Story 13.6: Safety Stock Calculation

**Jako** System
**Chce** kalkulowac rekomendowany safety stock
**Aby** wspierac planistow

**Acceptance Criteria:**
- [ ] Formula: safety_stock = Z * sigma * sqrt(lead_time)
- [ ] Z = service level factor (np. 1.65 dla 95%)
- [ ] sigma = standard deviation of demand
- [ ] lead_time = supplier/production lead time
- [ ] Recommendation wyświetlana, manual approval

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.7: Below Safety Stock Alert

**Jako** Planner
**Chce** widzieć alerty gdy stock < safety stock
**Aby** reagować na niskie stany

**Acceptance Criteria:**
- [ ] Dashboard widget: produkty poniżej safety stock
- [ ] Lista z: produkt, current stock, safety stock, shortage
- [ ] Severity: yellow (approaching), red (below)
- [ ] Link do quick action (create PO/WO)

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.3 Auto-Replenishment

#### Story 13.8: Reorder Point Configuration

**Jako** Planner
**Chce** definiowac reorder point per produkt
**Aby** wiedzieć kiedy zamawiac

**Acceptance Criteria:**
- [ ] reorder_point = safety_stock + (avg_demand * lead_time)
- [ ] Manual override możliwy
- [ ] Per supplier (różni dostawcy różny lead time)
- [ ] Wyświetlanie na product detail

**Priority:** Must Have
**Estimate:** S
**Phase:** 3

---

#### Story 13.9: Auto-Replenishment Rules

**Jako** Procurement Manager
**Chce** definiowac reguły auto-uzupełniania
**Aby** automatyzować PO

**Acceptance Criteria:**
- [ ] Enable/disable per produkt
- [ ] Trigger: stock <= reorder_point
- [ ] Quantity: reorder_qty lub EOQ calculation
- [ ] Preferred supplier selection
- [ ] Action: create draft PO lub auto-send
- [ ] Batch frequency (daily check)

**Technical Notes:**
```sql
CREATE TABLE replenishment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    is_enabled BOOLEAN DEFAULT true,
    reorder_point NUMERIC(15,4),
    reorder_qty NUMERIC(15,4),
    preferred_supplier_id UUID REFERENCES suppliers(id),
    action_type VARCHAR(30) DEFAULT 'create_draft', -- create_draft, auto_send
    min_order_qty NUMERIC(15,4),
    max_order_qty NUMERIC(15,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.10: Auto-Replenishment Execution

**Jako** System
**Chce** automatycznie generować PO
**Aby** uzupełniać stany

**Acceptance Criteria:**
- [ ] Scheduled job (np. daily 6:00 AM)
- [ ] Check all enabled products
- [ ] If stock <= reorder_point: create PO
- [ ] Group by supplier (consolidate)
- [ ] Notification do procurement
- [ ] Log wszystkich auto-generated PO

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 13.11: Auto-Replenishment Log

**Jako** Procurement Manager
**Chce** widzieć log auto-uzupełniania
**Aby** monitorować i kontrolować

**Acceptance Criteria:**
- [ ] Lista wszystkich auto-generated PO/WO
- [ ] Status: created, approved, rejected
- [ ] Trigger reason (stock level, forecast)
- [ ] User overrides logged

**Priority:** Should Have
**Estimate:** S
**Phase:** 3

---

### 2.4 MRP Enhancements

#### Story 13.12: MRP Run Dashboard

**Jako** Planner
**Chce** uruchamiać i monitorować MRP
**Aby** planować materiały

**Acceptance Criteria:**
- [ ] MRP run button z parametrami
- [ ] Horyzont planowania (1-12 tygodni)
- [ ] Include: firm orders, forecast, safety stock
- [ ] Progress indicator
- [ ] Results summary

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 13.13: MRP Planned Orders

**Jako** Planner
**Chce** widzieć planned orders z MRP
**Aby** decydować o realizacji

**Acceptance Criteria:**
- [ ] Lista planned PO (surowce)
- [ ] Lista planned WO (półprodukty, wyroby)
- [ ] Due date, quantity, source requirement
- [ ] Actions: convert to firm, modify, delete
- [ ] Bulk convert

**Technical Notes:**
```sql
CREATE TABLE mrp_planned_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    mrp_run_id UUID NOT NULL,
    order_type VARCHAR(10) NOT NULL, -- PO, WO
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(15,4) NOT NULL,
    due_date DATE NOT NULL,
    source_type VARCHAR(30), -- SO, forecast, safety_stock
    source_id UUID,
    supplier_id UUID REFERENCES suppliers(id),
    status VARCHAR(20) DEFAULT 'planned', -- planned, firmed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 13.14: MRP Exception Messages

**Jako** Planner
**Chce** widzieć exception messages z MRP
**Aby** rozwiązywać problemy

**Acceptance Criteria:**
- [ ] Lista wyjątków:
  - Reschedule in (przesunąć wcześniej)
  - Reschedule out (przesunąć później)
  - Cancel (nadmiar)
  - Expedite (pilne)
- [ ] Severity i suggested action
- [ ] Link do affected order

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.15: Multi-Level BOM Explosion

**Jako** Planner
**Chce** aby MRP rozwijał wielopoziomowe BOM
**Aby** planować wszystkie składniki

**Acceptance Criteria:**
- [ ] Explosion przez wszystkie poziomy BOM
- [ ] Netting: gross requirement - available - on order
- [ ] Lead time offsetting per level
- [ ] Phantom items handling (pass-through)

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

### 2.5 Inventory Optimization

#### Story 13.16: EOQ (Economic Order Quantity) Calculator

**Jako** Procurement Manager
**Chce** obliczać EOQ
**Aby** optymalizować wielkość zamówień

**Acceptance Criteria:**
- [ ] EOQ = sqrt(2DS/H)
  - D = annual demand
  - S = order cost
  - H = holding cost per unit
- [ ] Calculator per produkt
- [ ] Recommendation vs current reorder_qty

**Priority:** Could Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.17: ABC Classification

**Jako** Inventory Manager
**Chce** klasyfikować produkty ABC
**Aby** priorytetyzować zarządzanie

**Acceptance Criteria:**
- [ ] Automatic classification based on:
  - Value (A = top 80% value)
  - Volume (B = next 15%)
  - Tail (C = last 5%)
- [ ] abc_class field na produkcie
- [ ] Re-classification periodic (monthly)
- [ ] Dashboard: stock value by ABC

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.6 Reports & Dashboards

#### Story 13.18: Planning Dashboard

**Jako** Planning Manager
**Chce** widzieć dashboard planowania
**Aby** monitorować status

**Acceptance Criteria:**
- [ ] Open requirements (MRP output)
- [ ] Below reorder point items
- [ ] Planned vs actual consumption
- [ ] Forecast accuracy trend
- [ ] Quick actions

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 13.19: Stock Projection Report

**Jako** Planner
**Chce** widzieć projekcję zapasów
**Aby** identyfikować przyszłe braki

**Acceptance Criteria:**
- [ ] Time-phased stock projection per produkt
- [ ] Opening + receipts - requirements = closing
- [ ] Week by week view
- [ ] Highlight negative (shortage) periods
- [ ] What-if: add planned order

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 13.20: Planning Audit Trail

**Jako** Auditor
**Chce** widzieć historię zmian planowania
**Aby** weryfikować decyzje

**Acceptance Criteria:**
- [ ] MRP run history
- [ ] Planned order conversions
- [ ] Forecast changes
- [ ] Safety stock changes
- [ ] Export

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 13.1 | Historical Demand Analysis | Must | M | PLANNED |
| 13.2 | Demand Forecast Generation | Must | L | PLANNED |
| 13.3 | Forecast vs Actual Comparison | Should | M | PLANNED |
| 13.4 | Forecast-Driven MRP | Must | L | PLANNED |
| 13.5 | Safety Stock Configuration | Must | S | PLANNED |
| 13.6 | Safety Stock Calculation | Should | M | PLANNED |
| 13.7 | Below Safety Stock Alert | Must | M | PLANNED |
| 13.8 | Reorder Point Configuration | Must | S | PLANNED |
| 13.9 | Auto-Replenishment Rules | Must | M | PLANNED |
| 13.10 | Auto-Replenishment Execution | Must | L | PLANNED |
| 13.11 | Auto-Replenishment Log | Should | S | PLANNED |
| 13.12 | MRP Run Dashboard | Must | L | PLANNED |
| 13.13 | MRP Planned Orders | Must | L | PLANNED |
| 13.14 | MRP Exception Messages | Should | M | PLANNED |
| 13.15 | Multi-Level BOM Explosion | Must | L | PLANNED |
| 13.16 | EOQ Calculator | Could | M | PLANNED |
| 13.17 | ABC Classification | Should | M | PLANNED |
| 13.18 | Planning Dashboard | Must | L | PLANNED |
| 13.19 | Stock Projection Report | Should | M | PLANNED |
| 13.20 | Planning Audit Trail | Must | M | PLANNED |

**Totals:**
- Must Have: 13 stories
- Should Have: 6 stories
- Could Have: 1 story
- **Total:** 20 stories

---

## 4. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| MRP-FR-01: Demand forecasting | 13.1, 13.2, 13.3 | Prognozowanie |
| MRP-FR-02: Safety stock | 13.5, 13.6, 13.7 | Bufory |
| MRP-FR-03: Auto-replenishment | 13.8, 13.9, 13.10, 13.11 | Automatyzacja |
| MRP-FR-04: MRP engine | 13.4, 13.12, 13.13, 13.14, 13.15 | Planowanie |
| MRP-FR-05: Optimization | 13.16, 13.17 | Optymalizacja |
| MRP-FR-06: Visibility | 13.18, 13.19 | Dashboards |
| MRP-FR-07: Audit | 13.20 | Compliance |

---

## 5. Dependencies

### 5.1 From Other Modules
- **Epic 3 (Planning):** PO, WO base functionality
- **Epic 5 (Warehouse):** Stock levels, LP data
- **Epic 7 (Shipping):** SO data for demand
- **Epic 2 (Technical):** BOMs for explosion

### 5.2 To Other Modules
- **Epic 3:** Creates PO/WO from MRP output
- **Epic 12 (Finance):** Cost data for EOQ

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Forecast accuracy | High | Medium | Start simple, iterate |
| MRP complexity | Medium | High | Phase implementation |
| Auto-order mistakes | Medium | High | Draft mode, approval required |
| Performance at scale | Medium | Medium | Batch processing, indexing |

---

## 7. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Advanced Planning Epic |
