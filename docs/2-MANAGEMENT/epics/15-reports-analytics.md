# Epic 15: Reports & Analytics - Phase 2/3

**Status:** PLANNED
**Priority:** P2 - Wazna dla wszystkich uzytkownikow
**Stories:** 18
**Estimated Effort:** 6-8 tygodni
**Dependencies:** All core modules (data sources)

---

## 1. Overview

### 1.1 Cel Epica

Modul Reports & Analytics dostarcza zaawansowane narzedzia raportowania:
- **Self-Service Dashboards** - konfigurowalne dashboardy
- **KPI Builder** - tworzenie wlasnych KPI
- **Export to BI Tools** - integracja z Power BI, Tableau
- **Scheduled Reports** - automatyczne wysylanie raportow

### 1.2 Luki Konkurencyjne Zamykane

| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| Advanced Reporting/BI | 3/4 maja (AVEVA PI, Plex, Aptean) | Implementowane w tym epicu |
| Self-Service Dashboards | 2/4 maja | Implementowane w tym epicu |
| Report Scheduling | 3/4 maja | Implementowane w tym epicu |

### 1.3 Business Value

- **Widocznosc:** Pelny obraz operacji produkcyjnych
- **Decyzje:** Dane w czasie rzeczywistym dla decyzji
- **Efektywnosc:** Automatyzacja raportowania
- **Elastycznosc:** Konfigurowalne przez uzytkownika

---

## 2. User Stories

### 2.1 Dashboard Builder

#### Story 15.1: Dashboard CRUD

**Jako** Manager
**Chce** tworzyc i zarzadzac dashboardami
**Aby** miec wlasny widok danych

**Acceptance Criteria:**
- [ ] Create new dashboard (nazwa, opis)
- [ ] Edit dashboard layout
- [ ] Delete dashboard (z potwierdzeniem)
- [ ] Clone dashboard
- [ ] Dashboard per user lub shared (organizacja)

**Technical Notes:**
```sql
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    owner_id UUID REFERENCES auth.users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    layout JSONB, -- grid layout definition
    is_shared BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 15.2: Widget Library

**Jako** Manager
**Chce** wybierac z biblioteki widgetow
**Aby** budowac dashboard

**Acceptance Criteria:**
- [ ] Pre-built widgets per module:
  - Production: WO status, OEE gauge, throughput
  - Warehouse: Stock levels, GRN pending, movements
  - Quality: NCR open, QA pending, CCP deviations
  - Shipping: Orders pending, shipments today
  - Finance: Cost variance, margin trend
- [ ] Widget categories
- [ ] Search/filter widgets
- [ ] Drag-and-drop to dashboard

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 15.3: Widget Configuration

**Jako** Manager
**Chce** konfigurowac widgety
**Aby** dostosowac do potrzeb

**Acceptance Criteria:**
- [ ] Each widget has config panel
- [ ] Time range selection
- [ ] Filters (product, warehouse, etc.)
- [ ] Display options (chart type, colors)
- [ ] Refresh interval

**Technical Notes:**
```sql
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id),
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(100),
    config JSONB, -- widget-specific configuration
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 15.4: Dashboard Sharing

**Jako** Manager
**Chce** udostepniac dashboard innym
**Aby** zespol widzial te same dane

**Acceptance Criteria:**
- [ ] Share with specific users
- [ ] Share with roles
- [ ] Share with organization (all)
- [ ] View-only vs edit permissions
- [ ] Shared dashboard list

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

### 2.2 KPI Builder

#### Story 15.5: Custom KPI Definition

**Jako** Operations Manager
**Chce** definiowac wlasne KPI
**Aby** mierzyc to co wazne

**Acceptance Criteria:**
- [ ] KPI name, description
- [ ] Formula builder (wizard)
- [ ] Data sources: tables, fields
- [ ] Aggregations: sum, avg, count, min, max
- [ ] Filters applicable
- [ ] Unit i format

**Technical Notes:**
```sql
CREATE TABLE custom_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    formula JSONB, -- structured formula definition
    source_tables TEXT[],
    aggregation_method VARCHAR(30),
    unit VARCHAR(30),
    format_pattern VARCHAR(50),
    target_value NUMERIC(15,4),
    warning_threshold NUMERIC(15,4),
    critical_threshold NUMERIC(15,4),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

#### Story 15.6: KPI Calculation Engine

**Jako** System
**Chce** obliczac KPI automatycznie
**Aby** dostarczac aktualne dane

**Acceptance Criteria:**
- [ ] Scheduled calculation (configurable frequency)
- [ ] On-demand calculation
- [ ] Cache results dla performance
- [ ] Handle errors gracefully
- [ ] Log calculation history

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

#### Story 15.7: KPI Trending

**Jako** Manager
**Chce** widziec trend KPI
**Aby** oceniac postep

**Acceptance Criteria:**
- [ ] Historical values storage
- [ ] Trend chart (line)
- [ ] Comparison to target
- [ ] Rolling average option
- [ ] YoY / MoM comparison

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.3 Standard Reports

#### Story 15.8: Report Library

**Jako** User
**Chce** miec dostep do gotowych raportow
**Aby** szybko uzyskac informacje

**Acceptance Criteria:**
- [ ] Pre-built reports per module:
  - Production: WO Summary, Output by Product, Efficiency
  - Warehouse: Stock Report, Movement History, Aging
  - Quality: NCR Summary, CCP Compliance, Supplier Quality
  - Shipping: Shipment Log, Delivery Performance
  - Finance: Cost Analysis, Margin Report
- [ ] Report catalog with descriptions
- [ ] Quick access favorites

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 15.9: Report Parameters

**Jako** User
**Chce** filtrowac raporty
**Aby** uzyskac potrzebne dane

**Acceptance Criteria:**
- [ ] Date range picker
- [ ] Multi-select filters (product, warehouse, supplier)
- [ ] Saved parameter sets
- [ ] Default parameters per user

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 15.10: Report Export

**Jako** User
**Chce** eksportowac raporty
**Aby** uzywac poza systemem

**Acceptance Criteria:**
- [ ] Export to Excel (.xlsx)
- [ ] Export to PDF
- [ ] Export to CSV
- [ ] Configurable columns for export
- [ ] Large data handling (streaming)

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

### 2.4 Scheduled Reports

#### Story 15.11: Report Schedule Configuration

**Jako** Manager
**Chce** zaplanowac automatyczne raporty
**Aby** otrzymywac je regularnie

**Acceptance Criteria:**
- [ ] Select report + parameters
- [ ] Frequency: daily, weekly, monthly
- [ ] Day/time of generation
- [ ] Recipients (email list)
- [ ] Format (PDF, Excel)

**Technical Notes:**
```sql
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    report_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    run_day INTEGER, -- day of week (1-7) or month (1-31)
    run_time TIME,
    recipients TEXT[],
    export_format VARCHAR(10) DEFAULT 'pdf',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 15.12: Report Delivery

**Jako** System
**Chce** wysylac zaplanowane raporty
**Aby** uzytkownik otrzymal email

**Acceptance Criteria:**
- [ ] Generate report at scheduled time
- [ ] Attach to email
- [ ] Email template (profesjonalny)
- [ ] Delivery confirmation log
- [ ] Retry on failure

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 15.13: Report History

**Jako** Manager
**Chce** widziec historie wyslanych raportow
**Aby** miec dostep do archiwalnych

**Acceptance Criteria:**
- [ ] List of generated reports
- [ ] Download past reports
- [ ] Delivery status
- [ ] 90-day retention

**Priority:** Should Have
**Estimate:** S
**Phase:** 3

---

### 2.5 BI Integration

#### Story 15.14: Power BI Connector

**Jako** Analyst
**Chce** laczyc Power BI z MonoPilot
**Aby** tworzyc zaawansowane analizy

**Acceptance Criteria:**
- [ ] REST API for BI tools
- [ ] Authentication (API key lub OAuth)
- [ ] Available data sources/tables
- [ ] Documentation dla setup
- [ ] Rate limiting

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

#### Story 15.15: Data Export API

**Jako** Developer
**Chce** pobierac dane przez API
**Aby** integrować z zewnetrznymi narzędziami

**Acceptance Criteria:**
- [ ] Bulk export endpoints
- [ ] Incremental export (since timestamp)
- [ ] Pagination dla duzych datasetow
- [ ] JSON i CSV output
- [ ] Schema documentation

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 15.16: Data Dictionary

**Jako** Analyst
**Chce** rozumiec strukture danych
**Aby** prawidlowo interpretowac

**Acceptance Criteria:**
- [ ] List of tables/entities
- [ ] Field descriptions
- [ ] Data types
- [ ] Relationships
- [ ] Searchable documentation

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.6 Settings

#### Story 15.17: Analytics Settings Page

**Jako** Admin
**Chce** konfigurowac modul Analytics
**Aby** dostosowac do potrzeb

**Acceptance Criteria:**
- [ ] Default dashboard per role
- [ ] Report retention period
- [ ] API access management
- [ ] Scheduled reports limit
- [ ] Export limits

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 15.18: Report Audit Trail

**Jako** Admin
**Chce** widziec kto generowal raporty
**Aby** monitorowac uzycie

**Acceptance Criteria:**
- [ ] Log: who, when, which report
- [ ] Parameters used
- [ ] Export downloads
- [ ] API access logs

**Priority:** Must Have
**Estimate:** S
**Phase:** 2

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Phase | Status |
|----|-------|----------|----------|-------|--------|
| 15.1 | Dashboard CRUD | Must | M | 2 | PLANNED |
| 15.2 | Widget Library | Must | L | 2 | PLANNED |
| 15.3 | Widget Configuration | Must | M | 2 | PLANNED |
| 15.4 | Dashboard Sharing | Should | M | 2 | PLANNED |
| 15.5 | Custom KPI Definition | Should | L | 3 | PLANNED |
| 15.6 | KPI Calculation Engine | Should | L | 3 | PLANNED |
| 15.7 | KPI Trending | Should | M | 3 | PLANNED |
| 15.8 | Report Library | Must | L | 2 | PLANNED |
| 15.9 | Report Parameters | Must | M | 2 | PLANNED |
| 15.10 | Report Export | Must | M | 2 | PLANNED |
| 15.11 | Report Schedule Config | Should | M | 3 | PLANNED |
| 15.12 | Report Delivery | Should | M | 3 | PLANNED |
| 15.13 | Report History | Should | S | 3 | PLANNED |
| 15.14 | Power BI Connector | Should | L | 3 | PLANNED |
| 15.15 | Data Export API | Must | M | 2 | PLANNED |
| 15.16 | Data Dictionary | Should | M | 3 | PLANNED |
| 15.17 | Analytics Settings | Must | M | 2 | PLANNED |
| 15.18 | Report Audit Trail | Must | S | 2 | PLANNED |

**Totals:**
- Must Have: 9 stories
- Should Have: 9 stories
- **Total:** 18 stories

**Phase Split:**
- Phase 2: 10 stories (core dashboards, reports)
- Phase 3: 8 stories (KPI builder, scheduling, BI)

---

## 4. Pre-Built Widgets

### 4.1 Production Widgets
| Widget | Type | Data Source |
|--------|------|-------------|
| WO Status Overview | Pie/Donut | work_orders |
| Today's Output | Number | wo_outputs |
| OEE Gauge | Gauge | oee_records |
| Production Trend | Line | wo_outputs |
| Top Products (Output) | Bar | wo_outputs |

### 4.2 Warehouse Widgets
| Widget | Type | Data Source |
|--------|------|-------------|
| Stock Value | Number | license_plates |
| Low Stock Alert | List | products |
| GRN Pending | Number | grns |
| Stock by Category | Pie | license_plates |
| Recent Movements | List | stock_movements |

### 4.3 Quality Widgets
| Widget | Type | Data Source |
|--------|------|-------------|
| Open NCR | Number | ncrs |
| NCR by Severity | Bar | ncrs |
| QA Pending | Number | license_plates |
| CCP Deviations | List | ccp_readings |
| Quality Pass Rate | Gauge | quality_tests |

### 4.4 Shipping Widgets
| Widget | Type | Data Source |
|--------|------|-------------|
| Orders to Ship | Number | sales_orders |
| Shipments Today | Number | shipments |
| On-Time Delivery % | Gauge | shipments |
| Top Customers | Bar | sales_orders |

---

## 5. Pre-Built Reports

### 5.1 Production Reports
- Work Order Summary
- Output by Product
- Yield Analysis
- Production Efficiency
- Downtime Report

### 5.2 Warehouse Reports
- Stock Report (current)
- Stock Valuation
- Movement History
- Aging Analysis
- Stock Accuracy

### 5.3 Quality Reports
- NCR Summary
- HACCP Compliance
- Supplier Quality
- Test Results Summary
- Audit Report

### 5.4 Finance Reports
- Production Cost Analysis
- Margin Report
- Cost Variance
- Inventory Valuation

---

## 6. Dependencies

### 6.1 From Other Modules
All modules provide data sources for reports

### 6.2 To Other Modules
- Dashboard widgets embedded in module pages
- Report links from entity detail pages

---

## 7. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance with large data | High | High | Caching, materialized views |
| User overwhelm | Medium | Medium | Pre-built templates, wizard |
| BI integration complexity | Medium | Medium | Start with API, iterate |

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Reports & Analytics Epic |
