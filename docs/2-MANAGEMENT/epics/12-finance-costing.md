# Epic 12: Finance & Costing Integration - Phase 2/3

**Status:** PLANNED
**Priority:** P2 - Wazna funkcjonalnosc, nie krytyczna
**Stories:** 22
**Estimated Effort:** 6-8 tygodni
**Dependencies:** Epic 2 (Technical), Epic 4 (Production), Epic 5 (Warehouse)

---

## 1. Overview

### 1.1 Cel Epica

Modul Finance & Costing zarzadza sledzeniem kosztow produkcji i integracja z systemami ksiegowymi. **Wazne:** MonoPilot NIE jest pelnym ERP - ten modul dostarcza:
- **Production Cost Tracking** - sledzenie kosztow materialow i pracy
- **Margin Analysis** - analiza marz na produktach
- **Cost Variance Reports** - porownanie actual vs standard
- **Accounting Integration** - integracja z Comarch, Sage, inne

### 1.2 Zakres vs Out of Scope

| In Scope | Out of Scope |
|----------|--------------|
| Material cost tracking | General ledger |
| Labor cost allocation | Accounts payable/receivable |
| Overhead allocation | Invoicing |
| Margin analysis | Payroll |
| Cost variance | Tax calculation |
| Export do ERP | Financial statements |

### 1.3 Business Value

- **Widocznosc kosztow:** Rzeczywisty koszt produkcji per produkt/WO
- **Marza:** Analiza rentownosci produktow
- **Decyzje:** Dane do pricing decisions
- **Integracja:** Automatyczny eksport do ksiegowosci

---

## 2. User Stories

### 2.1 Cost Configuration

#### Story 12.1: Material Cost Setup

**Jako** Finance Manager
**Chce** definiowac koszty materialow
**Aby** kalkulowac koszt produkcji

**Acceptance Criteria:**
- [ ] Pole standard_cost na produkcie
- [ ] Pole last_purchase_cost (z ostatniego PO)
- [ ] Pole average_cost (srednia wazona)
- [ ] Wybor metody kalkulacji (standard/average/FIFO)
- [ ] Historia zmian kosztow
- [ ] Currency support

**Technical Notes:**
```sql
ALTER TABLE products ADD COLUMN standard_cost NUMERIC(15,4);
ALTER TABLE products ADD COLUMN last_purchase_cost NUMERIC(15,4);
ALTER TABLE products ADD COLUMN average_cost NUMERIC(15,4);
ALTER TABLE products ADD COLUMN cost_method VARCHAR(20) DEFAULT 'standard';

CREATE TABLE product_cost_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    cost_type VARCHAR(20) NOT NULL, -- standard, purchase, average
    old_cost NUMERIC(15,4),
    new_cost NUMERIC(15,4),
    change_reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.2: Labor Rate Configuration

**Jako** Finance Manager
**Chce** definiowac stawki pracy
**Aby** kalkulowac labor cost

**Acceptance Criteria:**
- [ ] Default labor rate per hour (organizacja)
- [ ] Labor rate per work center (opcjonalnie)
- [ ] Labor rate per skill level (opcjonalnie)
- [ ] Overtime multiplier
- [ ] Effective dates dla zmian stawek

**Technical Notes:**
```sql
CREATE TABLE labor_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    rate_per_hour NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    work_center_id UUID REFERENCES work_centers(id),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.3: Overhead Rate Configuration

**Jako** Finance Manager
**Chce** definiowac stawki overhead
**Aby** alokować koszty posrednie

**Acceptance Criteria:**
- [ ] Overhead % jako procent material cost
- [ ] Lub overhead rate per hour
- [ ] Per work center lub global
- [ ] Multiple overhead categories (optional)

**Priority:** Should Have
**Estimate:** S
**Phase:** 2

---

### 2.2 Production Cost Tracking

#### Story 12.4: WO Material Cost Calculation

**Jako** System
**Chce** obliczac koszt materialow per WO
**Aby** sledzic rzeczywisty koszt

**Acceptance Criteria:**
- [ ] Suma: (consumed qty * unit cost) dla wszystkich skladnikow
- [ ] Koszt z momentu consumption (not current)
- [ ] Zapisanie na WO: material_cost
- [ ] Porownanie z BOM standard cost

**Technical Notes:**
```sql
ALTER TABLE work_orders ADD COLUMN actual_material_cost NUMERIC(15,4);
ALTER TABLE work_orders ADD COLUMN standard_material_cost NUMERIC(15,4);
ALTER TABLE work_orders ADD COLUMN actual_labor_cost NUMERIC(15,4);
ALTER TABLE work_orders ADD COLUMN standard_labor_cost NUMERIC(15,4);
ALTER TABLE work_orders ADD COLUMN overhead_cost NUMERIC(15,4);
ALTER TABLE work_orders ADD COLUMN total_cost NUMERIC(15,4);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.5: WO Labor Cost Calculation

**Jako** System
**Chce** obliczac koszt pracy per WO
**Aby** sledzic calkowity koszt

**Acceptance Criteria:**
- [ ] Czas pracy * labor rate
- [ ] Czas z routing lub reczny input
- [ ] Setup time + run time
- [ ] Zapisanie na WO: labor_cost

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.6: Total WO Cost Summary

**Jako** Production Manager
**Chce** widziec calkowity koszt WO
**Aby** analizowac rentownosc

**Acceptance Criteria:**
- [ ] Widget na WO detail: Total Cost breakdown
- [ ] Material + Labor + Overhead
- [ ] Cost per unit produced
- [ ] Variance vs standard
- [ ] Margin % jesli target price znany

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.7: Cost per LP (Inventory Valuation)

**Jako** Finance Manager
**Chce** widziec koszt per LP
**Aby** wyceniac zapasy

**Acceptance Criteria:**
- [ ] LP otrzymane z PO: purchase cost
- [ ] LP z produkcji: allocated production cost
- [ ] Pole unit_cost na LP
- [ ] Total inventory value report

**Technical Notes:**
- Rozszerzyc license_plates o unit_cost

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

### 2.3 Margin Analysis

#### Story 12.8: Product Margin Report

**Jako** Commercial Manager
**Chce** widziec marze per produkt
**Aby** optymalizowac pricing

**Acceptance Criteria:**
- [ ] Revenue (z SO) vs Cost (z produkcji)
- [ ] Gross margin % per produkt
- [ ] Contribution margin
- [ ] Trend over time
- [ ] Filter: product, period, customer

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 12.9: Customer Margin Report

**Jako** Sales Manager
**Chce** widziec marze per klient
**Aby** identyfikować najlepszych/najgorszych klientow

**Acceptance Criteria:**
- [ ] Revenue per customer
- [ ] Cost of goods sold per customer
- [ ] Margin % per customer
- [ ] Ranking customers by margin
- [ ] Drill-down do produktow

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 12.10: Margin Dashboard

**Jako** CFO
**Chce** widziec dashboard marz
**Aby** monitorowac rentownosc

**Acceptance Criteria:**
- [ ] Overall gross margin trend
- [ ] Margin by product category
- [ ] Margin by customer segment
- [ ] Top 5 / Bottom 5 products by margin
- [ ] Comparison to target

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

### 2.4 Cost Variance Analysis

#### Story 12.11: Material Variance Report

**Jako** Production Manager
**Chce** analizowac odchylenia materialowe
**Aby** identyfikować straty

**Acceptance Criteria:**
- [ ] Standard cost vs Actual cost per WO
- [ ] Price variance (roznica w cenach)
- [ ] Usage variance (roznica w zuzyciu)
- [ ] Agregacja per produkt, okres
- [ ] Top variances highlight

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.12: Labor Variance Report

**Jako** Production Manager
**Chce** analizowac odchylenia pracy
**Aby** poprawiac efektywnosc

**Acceptance Criteria:**
- [ ] Standard hours vs Actual hours
- [ ] Rate variance
- [ ] Efficiency variance
- [ ] Per work center, operator

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 12.13: Cost Variance Dashboard

**Jako** Operations Director
**Chce** dashboard odchylen kosztowych
**Aby** monitorowac performance

**Acceptance Criteria:**
- [ ] Total variance trend
- [ ] Breakdown: material, labor, overhead
- [ ] Pareto of variance sources
- [ ] Drill-down capability
- [ ] Action items linking

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

### 2.5 Accounting Integration

#### Story 12.14: Export to Comarch ERP

**Jako** Finance Manager
**Chce** eksportowac dane do Comarch
**Aby** automatycznie ksiegowac

**Acceptance Criteria:**
- [ ] Mapowanie kont ksiegowych (chart of accounts)
- [ ] Export: material receipts -> konto zapasow
- [ ] Export: consumption -> koszt produkcji
- [ ] Export: finished goods -> zapas wyrobow
- [ ] Format: XML lub API Comarch
- [ ] Scheduled export (daily, manual)

**Technical Notes:**
- Comarch ERP XL, Optima API support
- Mapowanie kont konfigurowalne per org

**Priority:** Should Have
**Estimate:** XL
**Phase:** 3

---

#### Story 12.15: Export to Sage

**Jako** Finance Manager
**Chce** eksportowac dane do Sage
**Aby** automatycznie ksiegowac

**Acceptance Criteria:**
- [ ] Podobnie jak Comarch
- [ ] Sage Symfonia format
- [ ] Sage 50 format (opcjonalnie)

**Priority:** Could Have
**Estimate:** L
**Phase:** 3

---

#### Story 12.16: Generic CSV Export

**Jako** Finance Manager
**Chce** eksportowac dane do CSV
**Aby** importowac do dowolnego systemu

**Acceptance Criteria:**
- [ ] Configurable columns
- [ ] Date range selection
- [ ] Transaction types: receipts, consumption, production, shipments
- [ ] Konto ksiegowe mapping
- [ ] Scheduled or manual

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

### 2.6 Settings & Configuration

#### Story 12.17: Finance Settings Page

**Jako** Admin
**Chce** konfigurowac modul Finance
**Aby** dostosowac do firmy

**Acceptance Criteria:**
- [ ] Default cost method (standard/average/FIFO)
- [ ] Default currency
- [ ] Overhead rates
- [ ] Labor rates
- [ ] Chart of accounts mapping
- [ ] Export schedule

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.18: Chart of Accounts Mapping

**Jako** Finance Manager
**Chce** mapowac transakcje do kont
**Aby** prawidłowo eksportowac

**Acceptance Criteria:**
- [ ] Lista typow transakcji
- [ ] Przypisanie konta GL per typ
- [ ] Debit/Credit rules
- [ ] Validation

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.7 Reports

#### Story 12.19: Production Cost Report

**Jako** CFO
**Chce** raport kosztow produkcji
**Aby** analizowac wydatki

**Acceptance Criteria:**
- [ ] Total production cost per period
- [ ] Breakdown: material, labor, overhead
- [ ] Per product category
- [ ] Per work center
- [ ] Export PDF/Excel

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.20: Inventory Valuation Report

**Jako** CFO
**Chce** raport wyceny zapasow
**Aby** znal wartosc magazynu

**Acceptance Criteria:**
- [ ] Total inventory value
- [ ] By product category
- [ ] By warehouse/location
- [ ] By age (aging analysis)
- [ ] Comparison to prior period

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 12.21: COGS Report (Cost of Goods Sold)

**Jako** CFO
**Chce** raport COGS
**Aby** przygotowac sprawozdania

**Acceptance Criteria:**
- [ ] Opening inventory
- [ ] + Purchases (GRN)
- [ ] + Production costs
- [ ] - Closing inventory
- [ ] = COGS
- [ ] Period comparison

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 12.22: Finance Audit Trail

**Jako** Auditor
**Chce** pelny trail transakcji kosztowych
**Aby** weryfikowac dokladnosc

**Acceptance Criteria:**
- [ ] All cost changes logged
- [ ] All exports logged
- [ ] Who, when, what
- [ ] Export for audit

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Phase | Status |
|----|-------|----------|----------|-------|--------|
| 12.1 | Material Cost Setup | Must | M | 2 | PLANNED |
| 12.2 | Labor Rate Configuration | Must | M | 2 | PLANNED |
| 12.3 | Overhead Rate Configuration | Should | S | 2 | PLANNED |
| 12.4 | WO Material Cost Calculation | Must | M | 2 | PLANNED |
| 12.5 | WO Labor Cost Calculation | Must | M | 2 | PLANNED |
| 12.6 | Total WO Cost Summary | Must | M | 2 | PLANNED |
| 12.7 | Cost per LP | Should | M | 2 | PLANNED |
| 12.8 | Product Margin Report | Must | L | 2 | PLANNED |
| 12.9 | Customer Margin Report | Should | M | 3 | PLANNED |
| 12.10 | Margin Dashboard | Should | L | 3 | PLANNED |
| 12.11 | Material Variance Report | Must | M | 2 | PLANNED |
| 12.12 | Labor Variance Report | Should | M | 3 | PLANNED |
| 12.13 | Cost Variance Dashboard | Should | L | 3 | PLANNED |
| 12.14 | Export to Comarch | Should | XL | 3 | PLANNED |
| 12.15 | Export to Sage | Could | L | 3 | PLANNED |
| 12.16 | Generic CSV Export | Must | M | 2 | PLANNED |
| 12.17 | Finance Settings Page | Must | M | 2 | PLANNED |
| 12.18 | Chart of Accounts Mapping | Should | M | 3 | PLANNED |
| 12.19 | Production Cost Report | Must | M | 2 | PLANNED |
| 12.20 | Inventory Valuation Report | Must | M | 2 | PLANNED |
| 12.21 | COGS Report | Should | M | 3 | PLANNED |
| 12.22 | Finance Audit Trail | Must | M | 2 | PLANNED |

**Totals:**
- Must Have: 12 stories
- Should Have: 8 stories
- Could Have: 2 stories
- **Total:** 22 stories

**Phase Split:**
- Phase 2: 12 stories (basics)
- Phase 3: 10 stories (advanced, integrations)

---

## 4. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| FIN-FR-01: Cost configuration | 12.1, 12.2, 12.3 | Parametry kosztow |
| FIN-FR-02: Production costing | 12.4, 12.5, 12.6, 12.7 | Sledzenie kosztow |
| FIN-FR-03: Margin analysis | 12.8, 12.9, 12.10 | Rentownosc |
| FIN-FR-04: Variance analysis | 12.11, 12.12, 12.13 | Kontrola kosztow |
| FIN-FR-05: ERP integration | 12.14, 12.15, 12.16 | Automatyzacja |
| FIN-FR-06: Reports | 12.19, 12.20, 12.21 | Analiza |
| FIN-FR-07: Audit | 12.22 | Compliance |

---

## 5. Dependencies

### 5.1 From Other Modules
- **Epic 2 (Technical):** Products, BOMs for standard costs
- **Epic 3 (Planning):** PO for purchase costs
- **Epic 4 (Production):** WO for production costs
- **Epic 5 (Warehouse):** GRN, LP for inventory valuation
- **Epic 7 (Shipping):** SO for revenue data

### 5.2 To Other Modules
- **Epic 8 (NPD):** Costing for new products
- External ERP systems (Comarch, Sage)

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cost data accuracy | High | High | Validation, reconciliation |
| ERP integration complexity | Medium | High | Start with CSV, iterate |
| User accounting knowledge | Medium | Medium | Training, documentation |
| Performance with large data | Low | Medium | Indexing, aggregation |

---

## 7. Notes

### 7.1 NOT Full ERP
MonoPilot Finance module is intentionally limited:
- NO general ledger management
- NO accounts payable/receivable
- NO invoicing
- NO payroll
- NO tax calculation engine

These functions remain in dedicated accounting systems (Comarch, Sage, etc.)

### 7.2 Integration Strategy
1. **Phase 2:** Manual CSV export, basic cost tracking
2. **Phase 3:** API integration with Comarch/Sage
3. **Phase 4+:** Real-time sync, bi-directional (optional)

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Finance & Costing Epic |
