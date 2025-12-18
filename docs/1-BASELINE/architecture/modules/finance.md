# Finance Module Architecture

## Version
- **Date**: 2025-12-10
- **Status**: Planned (Premium Module)
- **Epic**: 9

---

## Overview

The Finance Module provides production costing, cost variance analysis, and financial reporting capabilities for food manufacturing operations. This is NOT a full accounting system - MonoPilot is MES-focused. The Finance module enables cost visibility and integrates with external ERP systems (Comarch Optima).

### Core Capabilities
- Material, labor, and overhead cost tracking
- Standard cost definition and management
- BOM cost rollup calculation
- Work order actual costing
- Real-time cost variance analysis
- Inventory valuation (FIFO, weighted average)
- Margin analysis by product family
- Multi-currency support (PLN default)
- Polish VAT tax code management
- Comarch Optima integration

### Module Dependencies
```
Technical Module  ----+
(Products, BOMs)      |
                      v
Planning Module ------+----> Finance Module ----> Comarch Optima
(Work Orders)         |           |               (External ERP)
                      |           |
Warehouse Module -----+           v
(Inventory, LPs)           Cost Reports
                           Variance Analysis
                           Margin Reports
```

---

## Database Schema

### Core Tables

```sql
-- Currencies: Multi-currency support
currencies
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  code                  VARCHAR(3) NOT NULL  -- PLN, EUR, USD
  name                  VARCHAR(50) NOT NULL
  symbol                VARCHAR(5)
  is_base               BOOLEAN DEFAULT false
  is_active             BOOLEAN DEFAULT true
  exchange_rate         DECIMAL(15,6)  -- Rate to base currency
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Exchange Rates: Historical rate tracking
exchange_rates
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  currency_id           INTEGER NOT NULL REFERENCES currencies(id)
  effective_date        DATE NOT NULL
  rate                  DECIMAL(15,6) NOT NULL
  source                VARCHAR(50)  -- manual, API
  created_at            TIMESTAMP DEFAULT NOW()

-- Tax Codes: Polish VAT rates
tax_codes
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  code                  VARCHAR(20) NOT NULL
  name                  VARCHAR(100) NOT NULL
  rate_percent          DECIMAL(5,2) NOT NULL  -- 23, 8, 5, 0
  country_code          VARCHAR(2) DEFAULT 'PL'
  category              VARCHAR(30)  -- VAT, exempt
  effective_from        DATE
  effective_to          DATE
  is_active             BOOLEAN DEFAULT true
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Cost Centers: Organizational cost units
cost_centers
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  code                  VARCHAR(50) NOT NULL
  name                  VARCHAR(100) NOT NULL
  description           TEXT
  parent_id             INTEGER REFERENCES cost_centers(id)
  type                  VARCHAR(30)  -- production, overhead, admin
  production_line_id    INTEGER REFERENCES production_lines(id)
  department            VARCHAR(100)
  is_active             BOOLEAN DEFAULT true
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Cost Center Budgets: Budget definition
cost_center_budgets
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  cost_center_id        INTEGER NOT NULL REFERENCES cost_centers(id)
  period_start          DATE NOT NULL
  period_end            DATE NOT NULL
  budget_amount         DECIMAL(15,4) NOT NULL
  currency_id           INTEGER REFERENCES currencies(id)
  category              VARCHAR(30)  -- material, labor, overhead
  status                VARCHAR(20) DEFAULT 'draft'  -- draft, approved, active
  approved_by           UUID REFERENCES users(id)
  approved_at           TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Standard Costs: Pre-determined expected costs
standard_costs
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  item_id               INTEGER NOT NULL REFERENCES products(id)
  item_type             VARCHAR(20)  -- product, material
  effective_from        DATE NOT NULL
  effective_to          DATE
  material_cost         DECIMAL(15,4)
  labor_cost            DECIMAL(15,4)
  overhead_cost         DECIMAL(15,4)
  total_cost            DECIMAL(15,4)
  currency_id           INTEGER REFERENCES currencies(id)
  uom                   VARCHAR(20)
  cost_basis            VARCHAR(20)  -- per_unit, per_batch
  status                VARCHAR(20) DEFAULT 'draft'
  approved_by           UUID REFERENCES users(id)
  approved_at           TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Cost Rollups: BOM-level cost calculations
cost_rollups
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  product_id            INTEGER NOT NULL REFERENCES products(id)
  bom_id                INTEGER NOT NULL REFERENCES boms(id)
  effective_date        DATE NOT NULL
  level                 INTEGER DEFAULT 0  -- 0 = finished good
  material_cost         DECIMAL(15,4)
  labor_cost            DECIMAL(15,4)
  overhead_cost         DECIMAL(15,4)
  total_cost            DECIMAL(15,4)
  currency_id           INTEGER REFERENCES currencies(id)
  calculation_method    VARCHAR(20)  -- standard, average, FIFO
  created_at            TIMESTAMP DEFAULT NOW()

-- Work Order Costs: Actual vs standard tracking
work_order_costs
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  material_cost_actual  DECIMAL(15,4)
  material_cost_standard DECIMAL(15,4)
  material_variance     DECIMAL(15,4)
  labor_cost_actual     DECIMAL(15,4)
  labor_cost_standard   DECIMAL(15,4)
  labor_variance        DECIMAL(15,4)
  overhead_cost_actual  DECIMAL(15,4)
  overhead_cost_standard DECIMAL(15,4)
  overhead_variance     DECIMAL(15,4)
  total_cost_actual     DECIMAL(15,4)
  total_cost_standard   DECIMAL(15,4)
  total_variance        DECIMAL(15,4)
  quantity_produced     DECIMAL(15,4)
  unit_cost_actual      DECIMAL(15,4)
  unit_cost_standard    DECIMAL(15,4)
  currency_id           INTEGER REFERENCES currencies(id)
  cost_center_id        INTEGER REFERENCES cost_centers(id)
  costing_date          DATE
  status                VARCHAR(20) DEFAULT 'pending'  -- pending, calculated, approved
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Material Consumption Costs: Transaction-level tracking
material_consumption_costs
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  consumption_id        INTEGER REFERENCES material_consumption(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  product_id            INTEGER NOT NULL REFERENCES products(id)
  quantity              DECIMAL(15,4) NOT NULL
  uom                   VARCHAR(20)
  unit_cost             DECIMAL(15,4) NOT NULL
  total_cost            DECIMAL(15,4) NOT NULL
  currency_id           INTEGER REFERENCES currencies(id)
  cost_method           VARCHAR(20)  -- FIFO, average
  cost_center_id        INTEGER REFERENCES cost_centers(id)
  transaction_date      DATE
  created_at            TIMESTAMP DEFAULT NOW()

-- Labor Costs: Operation-level tracking
labor_costs
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  operation_id          INTEGER REFERENCES wo_operations(id)
  user_id               UUID REFERENCES users(id)
  hours_actual          DECIMAL(10,2) NOT NULL
  hours_standard        DECIMAL(10,2)
  hourly_rate           DECIMAL(15,4)
  total_cost            DECIMAL(15,4)
  currency_id           INTEGER REFERENCES currencies(id)
  cost_center_id        INTEGER REFERENCES cost_centers(id)
  transaction_date      DATE
  created_at            TIMESTAMP DEFAULT NOW()

-- Overhead Allocations: Applied overhead tracking
overhead_allocations
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  cost_center_id        INTEGER REFERENCES cost_centers(id)
  allocation_basis      VARCHAR(30)  -- labor_hours, machine_hours, units
  basis_quantity        DECIMAL(15,4)
  rate                  DECIMAL(15,4)
  total_cost            DECIMAL(15,4)
  currency_id           INTEGER REFERENCES currencies(id)
  allocation_date       DATE
  created_at            TIMESTAMP DEFAULT NOW()

-- Cost Variances: Variance tracking
cost_variances
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  variance_type         VARCHAR(30) NOT NULL
    -- material_price, material_usage, labor_rate, labor_efficiency, overhead, yield
  variance_amount       DECIMAL(15,4) NOT NULL  -- Positive = unfavorable
  currency_id           INTEGER REFERENCES currencies(id)
  standard_amount       DECIMAL(15,4)
  actual_amount         DECIMAL(15,4)
  variance_percent      DECIMAL(5,2)
  root_cause_category   VARCHAR(100)
  notes                 TEXT
  status                VARCHAR(20) DEFAULT 'identified'
    -- identified, under_review, approved, rejected
  reviewed_by           UUID REFERENCES users(id)
  reviewed_at           TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Variance Thresholds: Alert configuration
variance_thresholds
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  cost_category         VARCHAR(30) NOT NULL  -- material, labor, overhead, total
  warning_threshold_pct DECIMAL(5,2) DEFAULT 5
  critical_threshold_pct DECIMAL(5,2) DEFAULT 10
  is_active             BOOLEAN DEFAULT true
  notify_roles          JSONB  -- ['admin', 'finance_manager']
  notify_email          BOOLEAN DEFAULT false
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Variance Alerts: Active alert tracking
variance_alerts
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  variance_type         VARCHAR(30) NOT NULL
  severity              VARCHAR(20) NOT NULL  -- warning, critical
  variance_amount       DECIMAL(15,4)
  variance_percent      DECIMAL(5,2)
  threshold_id          INTEGER REFERENCES variance_thresholds(id)
  status                VARCHAR(20) DEFAULT 'active'  -- active, acknowledged, resolved
  acknowledged_by       UUID REFERENCES users(id)
  acknowledged_at       TIMESTAMP
  acknowledged_notes    TEXT
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Inventory Cost Layers: FIFO tracking
inventory_cost_layers
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  product_id            INTEGER NOT NULL REFERENCES products(id)
  location_id           INTEGER REFERENCES locations(id)
  lot_number            VARCHAR(100)
  quantity_received     DECIMAL(15,4) NOT NULL
  quantity_remaining    DECIMAL(15,4) NOT NULL
  unit_cost             DECIMAL(15,4) NOT NULL
  total_cost            DECIMAL(15,4)
  currency_id           INTEGER REFERENCES currencies(id)
  receipt_date          DATE NOT NULL
  valuation_method      VARCHAR(20)  -- FIFO, average
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Product Margins: Profitability tracking
product_margins
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  product_id            INTEGER NOT NULL REFERENCES products(id)
  effective_date        DATE NOT NULL
  selling_price         DECIMAL(15,4)
  total_cost            DECIMAL(15,4)
  margin_amount         DECIMAL(15,4)
  margin_percent        DECIMAL(5,2)
  target_margin_percent DECIMAL(5,2)
  currency_id           INTEGER REFERENCES currencies(id)
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- GL Account Mappings: ERP integration
gl_account_mappings
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  cost_category         VARCHAR(50) NOT NULL  -- material, labor, overhead
  cost_subcategory      VARCHAR(50)
  gl_account_code       VARCHAR(50) NOT NULL
  gl_account_name       VARCHAR(200)
  is_active             BOOLEAN DEFAULT true
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Finance Exports: Export audit trail
finance_exports
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  export_type           VARCHAR(30) NOT NULL  -- csv, xml, comarch_optima
  period_start          DATE
  period_end            DATE
  file_name             VARCHAR(255)
  file_path             VARCHAR(500)
  record_count          INTEGER
  status                VARCHAR(20)  -- pending, completed, failed
  exported_by           UUID REFERENCES users(id)
  exported_at           TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
```

### Indexes

```sql
-- Standard costs lookup
CREATE INDEX idx_standard_costs_product ON standard_costs(item_id, effective_from);
CREATE INDEX idx_standard_costs_org ON standard_costs(org_id, status);

-- Work order costs
CREATE INDEX idx_wo_costs_wo ON work_order_costs(work_order_id);
CREATE INDEX idx_wo_costs_date ON work_order_costs(org_id, costing_date);

-- Variances
CREATE INDEX idx_cost_variances_wo ON cost_variances(work_order_id);
CREATE INDEX idx_cost_variances_type ON cost_variances(org_id, variance_type, status);

-- Inventory layers
CREATE INDEX idx_inv_layers_product ON inventory_cost_layers(product_id, receipt_date);

-- Alerts
CREATE INDEX idx_variance_alerts_status ON variance_alerts(org_id, status);
```

---

## API Design

### Standard Costs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/standard-costs` | List standard costs |
| GET | `/api/finance/standard-costs/:id` | Get standard cost details |
| POST | `/api/finance/standard-costs` | Create standard cost |
| PATCH | `/api/finance/standard-costs/:id` | Update standard cost |
| POST | `/api/finance/standard-costs/:id/approve` | Approve standard cost |

### Work Order Costing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/work-order-costs/:workOrderId` | Get WO cost summary |
| POST | `/api/finance/work-order-costs/:workOrderId/calculate` | Calculate WO costs |
| GET | `/api/finance/work-order-costs/:workOrderId/realtime` | Get real-time variance |
| GET | `/api/finance/work-order-costs/:workOrderId/material-breakdown` | Material variance detail |
| GET | `/api/finance/work-order-costs/:workOrderId/labor-breakdown` | Labor variance detail |

### Variance Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/variances` | List cost variances |
| POST | `/api/finance/variances/:id/approve` | Approve variance |
| GET | `/api/finance/variance-alerts` | List active alerts |
| POST | `/api/finance/variance-alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/finance/reports/variance-trends` | Variance trend data |

### Comarch Optima Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/finance/exports/comarch` | Export to Comarch format |
| POST | `/api/finance/exports/comarch/variances` | Export variances to Comarch |

---

## Data Flow

### Cost Calculation Flow

```
Material Consumption             Labor Time Recording
      |                                |
      v                                v
+------------------+           +------------------+
| Get unit cost    |           | Get hourly rate  |
| (FIFO or avg)    |           | from cost center |
+------------------+           +------------------+
      |                                |
      v                                v
+------------------+           +------------------+
| material_        |           | labor_costs      |
| consumption_     |           | record           |
| costs record     |           |                  |
+------------------+           +------------------+
      |                                |
      +----------------+---------------+
                       |
                       v
             +------------------+
             | Calculate        |
             | overhead_        |
             | allocations      |
             +------------------+
                       |
                       v
             +------------------+
             | work_order_costs |
             | summary record   |
             | (actual vs std)  |
             +------------------+
                       |
                       v
             +------------------+
             | cost_variances   |
             | breakdown        |
             +------------------+
```

### Real-Time Variance Calculation

```
Production Event (consumption, output)
      |
      v
+------------------+
| Trigger: Update  |
| work_order_costs |
+------------------+
      |
      v
+------------------+
| Calculate:       |
| - Material var   |
| - Labor var      |
| - Overhead var   |
+------------------+
      |
      v
+------------------+
| Check thresholds |
| from variance_   |
| thresholds table |
+------------------+
      |
      +--- Below threshold --> Continue
      |
      +--- Above warning ------> Create variance_alert (warning)
      |
      +--- Above critical -----> Create variance_alert (critical)
                                 Send notification
```

### Variance Breakdown Formulas

```
Material Variance:
  MPV = (Actual Price - Standard Price) x Actual Quantity
  MQV = (Actual Quantity - Standard Quantity) x Standard Price
  Total Material Variance = MPV + MQV

Labor Variance:
  LRV = (Actual Rate - Standard Rate) x Actual Hours
  LEV = (Actual Hours - Standard Hours) x Standard Rate
  Total Labor Variance = LRV + LEV

Overhead Variance:
  Spending Variance = Actual Overhead - Budgeted Overhead
  Volume Variance = Budgeted Overhead - Applied Overhead
  Total Overhead Variance = Spending + Volume
```

### Comarch Optima Export Flow

```
1. User initiates export
   |
   v
2. Select period / WOs / data type
   |
   v
3. Map MonoPilot fields to Comarch fields
   |
   +-- invoice_number --> NumerDokumentu
   +-- issue_date --> DataWystawienia
   +-- customer.tax_id --> Kontrahent.NIP
   +-- line_items --> Pozycje
   |
   v
4. Generate export file (XML/JSON)
   |
   v
5. Validate against Comarch schema
   |
   v
6. Store in finance_exports
   |
   v
7. User downloads / sends to Comarch
```

---

## Security

### Row-Level Security

```sql
CREATE POLICY "Tenant isolation" ON currencies
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Tenant isolation" ON standard_costs
  USING (org_id = auth.jwt() ->> 'org_id');

-- Apply to all finance tables
```

### Role Permissions

| Role | View Costs | Edit Costs | Approve | Export |
|------|------------|------------|---------|--------|
| Admin | Yes | Yes | Yes | Yes |
| Finance Manager | Yes | Yes | Yes | Yes |
| Finance Viewer | Yes | No | No | Yes |
| Production Mgr | WO costs only | No | No | No |
| Operator | No | No | No | No |

### Sensitive Data Handling

- Comarch API secrets encrypted at rest (AES-256)
- Standard cost approval requires Finance role
- Cost changes logged to audit trail
- Export files expire after 24 hours

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Cost calculation | <3s per work order |
| Real-time variance update | <30s refresh |
| Dashboard load | <2s |
| Export generation (10k rows) | <30s |
| Comarch sync per invoice | <5s |

---

## Comarch Optima Integration Points

### Invoice Push (FR-INT-011)

| MonoPilot Field | Comarch Optima Field |
|-----------------|----------------------|
| invoice_number | NumerDokumentu |
| issue_date | DataWystawienia |
| customer.name | Kontrahent.Nazwa |
| customer.tax_id | Kontrahent.NIP |
| line_items[].product_code | Pozycja.KodTowaru |
| line_items[].qty | Pozycja.Ilosc |
| line_items[].unit_price | Pozycja.CenaJedn |
| line_items[].vat_rate | Pozycja.StawkaVAT |
| total_net | WartoscNetto |
| total_gross | WartoscBrutto |

### Variance Export (FR-FIN-058)

| Variance Data | Comarch Format |
|---------------|----------------|
| Document type | "Variance Adjustment" |
| Document number | VAR-YYYYMM-XXXX |
| Variance type | GL account code (from mappings) |
| Debit amount | Unfavorable variance |
| Credit amount | Favorable variance |
| Cost center | Cost center code |
| Description | "Variance - [Type] - WO [Number]" |

---

## Polish VAT Rates (2024)

| Rate | Percentage | Application |
|------|------------|-------------|
| Standard | 23% | Most goods/services |
| Reduced 1 | 8% | Most food products |
| Reduced 2 | 5% | Specific food items |
| Zero | 0% | Exports, intra-EU |

---

## References

- PRD: `docs/1-BASELINE/product/modules/finance.md`
- Integrations Module: `docs/1-BASELINE/architecture/modules/integrations.md`
- Production Module: `docs/1-BASELINE/architecture/modules/production.md`
