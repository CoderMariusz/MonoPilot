# Epic 3.5: Planning Enhancements - Phase 2

**Status:** PLANNED
**Priority:** P1 - Kluczowe ulepszenia dla dojrzalosci produktu
**Stories:** 25 nowych (+ 30 DONE z MVP)
**Estimated Effort:** 6-8 tygodni
**Dependencies:** Epic 3 (Planning MVP - DONE)

---

## 1. Overview

### 1.1 Cel Epica

Ten epic zawiera ulepszenia modulu Planning wykraczajace poza MVP:
- **Supplier Enhancements** - rating, price lists, documents
- **PO Workflow** - templates, blanket PO, multi-level approval
- **TO Improvements** - priority, scheduling
- **WO Basics** - templates, availability check

### 1.2 Current State (MVP DONE - 30 stories)

Epic 3 MVP zostal w pelni zaimplementowany:
- Suppliers: CRUD, products assignment, default supplier
- Purchase Orders: full workflow (draft -> approved -> receiving -> closed)
- Transfer Orders: partial shipment, LP selection
- Work Orders: creation stub with BOM selection

### 1.3 Luki Konkurencyjne Zamykane

| Luka | Aptean | Plex | CSB | MonoPilot | Phase |
|------|--------|------|-----|-----------|-------|
| Supplier Rating | YES | YES | YES | - | 3.5 |
| Lead Time Tracking | YES | YES | YES | Partial | 3.5 |
| Supplier Price Lists | YES | YES | YES | - | 3.5 |
| Multi-Level Approval | YES | YES | - | - | 3.5 |
| Blanket PO | YES | YES | YES | - | 3.5 |
| PO Templates | YES | YES | - | - | 3.5 |
| WO Material Check | YES | YES | YES | - | 3.5 |

### 1.4 Business Value

- **Supplier Management:** Lepsza ocena i wybor dostawcow
- **Procurement Efficiency:** Szablony i blanket PO oszczedzaja czas
- **Control:** Multi-level approval dla wiekszych zamowien
- **Planning Accuracy:** Material check przed release WO

---

## 2. MVP Stories (DONE - 30 stories)

### 2.1 Completed Stories Reference

| ID | Story | Status |
|----|-------|--------|
| 3.1 | PO list view | DONE |
| 3.2 | PO CRUD | DONE |
| 3.3 | PO lines management | DONE |
| 3.4 | PO approval workflow | DONE |
| 3.5 | PO status tracking | DONE |
| 3.6 | TO CRUD | DONE |
| 3.7 | TO lines management | DONE |
| 3.8 | TO partial shipment | DONE |
| 3.9 | TO LP selection | DONE |
| 3.10 | WO creation (stub) | DONE |
| 3.11 | WO BOM selection | DONE |
| 3.12 | WO status workflow | DONE |
| 3.13 | PO number generation | DONE |
| 3.14 | TO number generation | DONE |
| 3.15 | WO number generation | DONE |
| 3.16 | PO/TO totals calculation | DONE |
| 3.17 | Supplier CRUD | DONE |
| 3.18 | Supplier products | DONE |
| 3.19 | Default supplier per product | DONE |
| 3.20 | PO currency inheritance | DONE |
| 3.21 | TO warehouse validation | DONE |
| 3.22 | PO line price inheritance | DONE |
| 3.23 | TO status auto-update | DONE |
| 3.24 | PO approval threshold | DONE |
| 3.25 | Planning settings | DONE |
| 3.26 | PO search/filter | DONE |
| 3.27 | TO search/filter | DONE |
| 3.28 | WO search/filter | DONE |
| 3.29 | PO rejection handling | DONE |
| 3.30 | TO date validation | DONE |

---

## 3. Enhancement Stories (Phase 2)

### 3.1 Supplier Enhancements

#### Story 3.31: Supplier Contacts Management

**Jako** Purchasing Manager
**Chce** zarzadzac wieloma kontaktami per dostawca
**Aby** miec dane kontaktowe roznych osob

**Acceptance Criteria:**
- [ ] Tabela supplier_contacts (supplier_id, name, role, email, phone, is_primary)
- [ ] CRUD dla kontaktow
- [ ] Jeden kontakt primary per supplier
- [ ] Contact picker przy PO creation

**Technical Notes:**
```sql
CREATE TABLE supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Should Have
**Estimate:** S
**Phase:** 2

---

#### Story 3.32: Supplier Documents

**Jako** Quality Manager
**Chce** przechowywac dokumenty dostawcy
**Aby** miec certyfikaty i umowy w jednym miejscu

**Acceptance Criteria:**
- [ ] Upload dokumentow do supplier
- [ ] Typy: Certificate, Contract, Insurance, Other
- [ ] Expiry date per document
- [ ] Alert przed wygasnieciem (30 dni)
- [ ] Download/preview dokumentu

**Technical Notes:**
```sql
CREATE TABLE supplier_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.33: Supplier Price Lists

**Jako** Purchasing Manager
**Chce** miec cenniki dostawcow z data waznosci
**Aby** automatycznie pobierac aktualne ceny

**Acceptance Criteria:**
- [ ] Price list per supplier-product z valid_from/valid_to
- [ ] Tier pricing (qty brackets)
- [ ] System pobiera cene aktywna na date PO
- [ ] History cen
- [ ] Import cennika z CSV

**Technical Notes:**
```sql
CREATE TABLE supplier_price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    product_id UUID NOT NULL REFERENCES products(id),
    unit_price NUMERIC(15,4) NOT NULL,
    min_qty NUMERIC(15,4) DEFAULT 1,
    max_qty NUMERIC(15,4),
    currency VARCHAR(3) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX supplier_price_lists_lookup
ON supplier_price_lists(supplier_id, product_id, valid_from, valid_to);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.34: Lead Time Tracking

**Jako** Procurement Manager
**Chce** sledzic rzeczywisty lead time vs promised
**Aby** oceniac dostawcow i planowac

**Acceptance Criteria:**
- [ ] Pole promised_lead_time na supplier_products
- [ ] Automatyczne wyliczenie actual_lead_time z PO
- [ ] actual = PO.actual_delivery_date - PO.created_at
- [ ] Sredni lead time per supplier
- [ ] Variance tracking (promised vs actual)

**Technical Notes:**
```sql
ALTER TABLE supplier_products ADD COLUMN promised_lead_time_days INTEGER;

-- View dla analizy
CREATE VIEW supplier_lead_time_analysis AS
SELECT
    s.id as supplier_id,
    s.name as supplier_name,
    AVG(po.actual_delivery_date - po.created_at::date) as avg_actual_lead_time,
    AVG(s.lead_time_days) as avg_promised_lead_time,
    COUNT(po.id) as po_count
FROM suppliers s
JOIN purchase_orders po ON po.supplier_id = s.id
WHERE po.actual_delivery_date IS NOT NULL
GROUP BY s.id, s.name;
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.35: Basic Supplier Rating

**Jako** Procurement Manager
**Chce** widziec prosty rating dostawcow
**Aby** wybierac najlepszych

**Acceptance Criteria:**
- [ ] Automatyczny rating na podstawie:
  - On-time delivery %
  - Quality acceptance %
  - Lead time variance
- [ ] Overall score 1-100
- [ ] Rating grade: A/B/C/D
- [ ] Trend indicator (up/down/stable)
- [ ] Manual adjustment mozliwy

**Technical Notes:**
```sql
CREATE TABLE supplier_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    on_time_delivery_pct NUMERIC(5,2),
    quality_acceptance_pct NUMERIC(5,2),
    lead_time_variance_days NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    rating_grade VARCHAR(1), -- A, B, C, D
    po_count INTEGER,
    grn_count INTEGER,
    is_manual_override BOOLEAN DEFAULT false,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, supplier_id, period_start, period_end)
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.36: Preferred Supplier Ranking

**Jako** Purchasing User
**Chce** widziec ranking dostawcow per produkt
**Aby** wybierac optymalnie

**Acceptance Criteria:**
- [ ] supplier_products.preference_rank (1, 2, 3...)
- [ ] Rank uwzglednia: price, lead time, rating
- [ ] Auto-suggest preferred supplier przy PO creation
- [ ] Manual rank override

**Priority:** Should Have
**Estimate:** S
**Phase:** 2

---

### 3.2 Purchase Order Enhancements

#### Story 3.37: PO Templates

**Jako** Purchasing User
**Chce** tworzyc PO z szablonu
**Aby** szybko zamawiać recurring items

**Acceptance Criteria:**
- [ ] Save PO as template
- [ ] Template ma: supplier, warehouse, lines (products, qty)
- [ ] Create PO from template (adjust quantities)
- [ ] Template list z search
- [ ] Clone/edit/delete template

**Technical Notes:**
```sql
CREATE TABLE po_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE po_template_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES po_templates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    default_quantity NUMERIC(15,4) DEFAULT 1,
    sequence INTEGER,
    notes TEXT
);
```

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.38: Blanket Purchase Orders

**Jako** Procurement Manager
**Chce** tworzyc blanket PO (umowy ramowe)
**Aby** zarzadzać dlugookresowymi umowami

**Acceptance Criteria:**
- [ ] Blanket PO type (is_blanket flag)
- [ ] Total quantity/value cap
- [ ] Valid from/to dates
- [ ] Release orders against blanket PO
- [ ] Tracking: ordered vs remaining
- [ ] Alert gdy blisko limitu

**Technical Notes:**
```sql
ALTER TABLE purchase_orders ADD COLUMN is_blanket BOOLEAN DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN blanket_po_id UUID REFERENCES purchase_orders(id);
ALTER TABLE purchase_orders ADD COLUMN blanket_valid_from DATE;
ALTER TABLE purchase_orders ADD COLUMN blanket_valid_to DATE;
ALTER TABLE purchase_orders ADD COLUMN blanket_total_limit NUMERIC(15,4);
ALTER TABLE purchase_orders ADD COLUMN blanket_used_amount NUMERIC(15,4) DEFAULT 0;
```

**Priority:** Should Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.39: Multi-Level PO Approval

**Jako** Admin
**Chce** konfigurowac multi-level approval matrix
**Aby** kontrolowac wieksze zamowienia

**Acceptance Criteria:**
- [ ] Approval matrix: amount range -> required approvers
- [ ] Sequential lub parallel approval
- [ ] Multiple approvers per level
- [ ] Escalation if pending > X days
- [ ] Approval delegation (out of office)

**Technical Notes:**
```sql
CREATE TABLE po_approval_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    min_amount NUMERIC(15,2) NOT NULL,
    max_amount NUMERIC(15,2),
    approval_level INTEGER NOT NULL,
    approver_role VARCHAR(50),
    approver_user_id UUID REFERENCES auth.users(id),
    is_sequential BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE po_approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id),
    level INTEGER NOT NULL,
    required_approver_id UUID REFERENCES auth.users(id),
    actual_approver_id UUID REFERENCES auth.users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.40: PO Change Request Workflow

**Jako** Purchasing User
**Chce** wnioskować o zmiane approved PO
**Aby** modyfikowac zamowienie bez anulowania

**Acceptance Criteria:**
- [ ] Change request for approved PO
- [ ] Change types: quantity, date, add line, remove line
- [ ] CR wymaga approval
- [ ] Original PO locked during CR
- [ ] CR accept -> update PO
- [ ] CR reject -> restore PO

**Priority:** Should Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.41: Supplier PO Confirmation

**Jako** System
**Chce** obsługiwac potwierdzenie PO przez dostawce
**Aby** wiedziec ze zamowienie przyjete

**Acceptance Criteria:**
- [ ] confirmation_status: pending, confirmed, rejected
- [ ] confirmed_delivery_date (dostawca może zmienić)
- [ ] Confirmation notes
- [ ] Email notification do buyer przy zmianie
- [ ] Manual mark as confirmed

**Technical Notes:**
```sql
ALTER TABLE purchase_orders ADD COLUMN confirmation_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE purchase_orders ADD COLUMN confirmed_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN confirmed_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN confirmation_notes TEXT;
```

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.42: PO Print/Export

**Jako** Purchasing User
**Chce** drukowac/eksportować PO
**Aby** wysłać do dostawcy

**Acceptance Criteria:**
- [ ] PDF generation z logo firmy
- [ ] Customizable template (basic)
- [ ] Export to CSV
- [ ] Email PO directly (z attachment)

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

### 3.3 Transfer Order Enhancements

#### Story 3.43: TO Priority

**Jako** Warehouse Manager
**Chce** ustawiac priorytet TO
**Aby** realizowac pilne transfery najpierw

**Acceptance Criteria:**
- [ ] priority field: normal, high, urgent
- [ ] Visual indicator (color badge)
- [ ] Sort/filter by priority
- [ ] Alert dla urgent TO

**Technical Notes:**
```sql
ALTER TABLE transfer_orders ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
```

**Priority:** Should Have
**Estimate:** S
**Phase:** 2

---

#### Story 3.44: TO Templates

**Jako** Warehouse User
**Chce** tworzyc TO z szablonu
**Aby** szybko robić powtarzalne transfery

**Acceptance Criteria:**
- [ ] Template: from_wh, to_wh, products, qty
- [ ] Create TO from template
- [ ] Template list

**Technical Notes:**
```sql
CREATE TABLE to_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE to_template_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES to_templates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    default_quantity NUMERIC(15,4) DEFAULT 1,
    sequence INTEGER
);
```

**Priority:** Could Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.45: TO Scheduling View

**Jako** Warehouse Manager
**Chce** widziec TO na kalendarzu/timeline
**Aby** planowac zasoby

**Acceptance Criteria:**
- [ ] Calendar view: planned_ship_date, planned_receive_date
- [ ] Filter by warehouse
- [ ] Color by status
- [ ] Drag to reschedule (optional)

**Priority:** Could Have
**Estimate:** M
**Phase:** 2

---

### 3.4 Work Order Enhancements

#### Story 3.46: WO Templates

**Jako** Planner
**Chce** tworzyc WO z szablonu
**Aby** szybko planowac powtarzalne produkcje

**Acceptance Criteria:**
- [ ] Template: product, line, default qty
- [ ] Create WO from template
- [ ] Template list

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.47: WO Copy

**Jako** Planner
**Chce** skopiowac istniejace WO
**Aby** szybko stworzyc podobne

**Acceptance Criteria:**
- [ ] Copy WO (new number, draft status)
- [ ] Copy with materials
- [ ] Adjust quantity after copy

**Priority:** Should Have
**Estimate:** S
**Phase:** 2

---

#### Story 3.48: Material Availability Check

**Jako** Planner
**Chce** sprawdzic dostepnosc materialow przed release WO
**Aby** nie startować produkcji bez surowcow

**Acceptance Criteria:**
- [ ] Check button na WO detail
- [ ] Lista: material, required, available, shortage
- [ ] Available = stock - reserved
- [ ] Block release if critical shortage (configurable)
- [ ] Warning for partial availability

**Technical Notes:**
- Use wo_materials table
- Query inventory dla available_qty
- Consider reservations from other WO

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.49: WO Grouping (Campaigns)

**Jako** Production Manager
**Chce** grupowac WO w kampanie
**Aby** planowac serie produkcyjne

**Acceptance Criteria:**
- [ ] Campaign entity (name, start_date, end_date)
- [ ] Assign WO to campaign
- [ ] Campaign view: all WO in campaign
- [ ] Campaign status (planned, in_progress, completed)

**Technical Notes:**
```sql
CREATE TABLE wo_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    planned_start_date DATE,
    planned_end_date DATE,
    status VARCHAR(30) DEFAULT 'planned',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE work_orders ADD COLUMN campaign_id UUID REFERENCES wo_campaigns(id);
```

**Priority:** Could Have
**Estimate:** M
**Phase:** 2

---

### 3.5 Planning Dashboard & Reports

#### Story 3.50: Planning Dashboard

**Jako** Planning Manager
**Chce** widziec dashboard planowania
**Aby** monitorować status

**Acceptance Criteria:**
- [ ] KPIs: Open PO count/value, Open TO count, WO in progress
- [ ] PO by status chart
- [ ] Upcoming deliveries (next 7 days)
- [ ] Supplier rating summary
- [ ] Quick actions

**Priority:** Must Have
**Estimate:** L
**Phase:** 2

---

#### Story 3.51: PO Spending Report

**Jako** Finance Manager
**Chce** raport wydatkow PO
**Aby** analizować zakupy

**Acceptance Criteria:**
- [ ] Spending by supplier
- [ ] Spending by product category
- [ ] Spending by period
- [ ] Trend chart
- [ ] Export CSV/PDF

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.52: Supplier Performance Report

**Jako** Procurement Manager
**Chce** raport performance dostawcow
**Aby** oceniac i wybierac

**Acceptance Criteria:**
- [ ] On-time delivery % per supplier
- [ ] Quality rate per supplier
- [ ] Lead time accuracy
- [ ] Comparison table
- [ ] Export

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

### 3.6 Settings Enhancements

#### Story 3.53: Planning Settings V2

**Jako** Admin
**Chce** rozszerzone ustawienia planowania
**Aby** dostosowac do procesow

**Acceptance Criteria:**
- [ ] Multi-level approval toggle
- [ ] Blanket PO enable/disable
- [ ] Default template selection
- [ ] Lead time variance threshold for alerts
- [ ] Material check enforcement level

**Priority:** Must Have
**Estimate:** M
**Phase:** 2

---

#### Story 3.54: Supplier Rating Configuration

**Jako** Admin
**Chce** konfigurowac wagi ratingu dostawcow
**Aby** dostosowac do priorytetow

**Acceptance Criteria:**
- [ ] Weight: on-time delivery (default 40%)
- [ ] Weight: quality acceptance (default 40%)
- [ ] Weight: lead time variance (default 20%)
- [ ] Grade thresholds: A >= 90, B >= 70, C >= 50, D < 50

**Priority:** Should Have
**Estimate:** S
**Phase:** 2

---

#### Story 3.55: Notification Settings

**Jako** User
**Chce** konfigurowac powiadomienia planowania
**Aby** otrzymywac tylko wazne alerty

**Acceptance Criteria:**
- [ ] PO pending approval notification
- [ ] PO approved/rejected notification
- [ ] Supplier document expiry alert
- [ ] Low supplier rating alert
- [ ] Email/in-app toggle per notification type

**Priority:** Should Have
**Estimate:** M
**Phase:** 2

---

## 4. Story Summary

### 4.1 MVP Stories (DONE)

| Status | Count |
|--------|-------|
| DONE | 30 |

### 4.2 Enhancement Stories (Phase 2)

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 3.31 | Supplier Contacts | Should | S | PLANNED |
| 3.32 | Supplier Documents | Should | M | PLANNED |
| 3.33 | Supplier Price Lists | Must | L | PLANNED |
| 3.34 | Lead Time Tracking | Must | M | PLANNED |
| 3.35 | Basic Supplier Rating | Must | L | PLANNED |
| 3.36 | Preferred Supplier Ranking | Should | S | PLANNED |
| 3.37 | PO Templates | Should | M | PLANNED |
| 3.38 | Blanket Purchase Orders | Should | L | PLANNED |
| 3.39 | Multi-Level PO Approval | Must | L | PLANNED |
| 3.40 | PO Change Request | Should | L | PLANNED |
| 3.41 | Supplier PO Confirmation | Should | M | PLANNED |
| 3.42 | PO Print/Export | Should | M | PLANNED |
| 3.43 | TO Priority | Should | S | PLANNED |
| 3.44 | TO Templates | Could | M | PLANNED |
| 3.45 | TO Scheduling View | Could | M | PLANNED |
| 3.46 | WO Templates | Should | M | PLANNED |
| 3.47 | WO Copy | Should | S | PLANNED |
| 3.48 | Material Availability Check | Must | L | PLANNED |
| 3.49 | WO Campaigns | Could | M | PLANNED |
| 3.50 | Planning Dashboard | Must | L | PLANNED |
| 3.51 | PO Spending Report | Should | M | PLANNED |
| 3.52 | Supplier Performance Report | Should | M | PLANNED |
| 3.53 | Planning Settings V2 | Must | M | PLANNED |
| 3.54 | Supplier Rating Config | Should | S | PLANNED |
| 3.55 | Notification Settings | Should | M | PLANNED |

**Totals:**
- Must Have: 7 stories
- Should Have: 14 stories
- Could Have: 4 stories
- **Total New:** 25 stories

---

## 5. Implementation Phases

### Phase 2A: Supplier Enhancements (2-3 tygodnie)

1. 3.33 Supplier Price Lists (Must)
2. 3.34 Lead Time Tracking (Must)
3. 3.35 Basic Supplier Rating (Must)
4. 3.31 Supplier Contacts (Should)
5. 3.32 Supplier Documents (Should)
6. 3.36 Preferred Supplier Ranking (Should)

### Phase 2B: PO Workflow (2-3 tygodnie)

1. 3.39 Multi-Level PO Approval (Must)
2. 3.37 PO Templates (Should)
3. 3.38 Blanket Purchase Orders (Should)
4. 3.41 Supplier PO Confirmation (Should)
5. 3.40 PO Change Request (Should)
6. 3.42 PO Print/Export (Should)

### Phase 2C: WO & Dashboard (2 tygodnie)

1. 3.48 Material Availability Check (Must)
2. 3.50 Planning Dashboard (Must)
3. 3.53 Planning Settings V2 (Must)
4. 3.46 WO Templates (Should)
5. 3.47 WO Copy (Should)
6. 3.43 TO Priority (Should)

### Phase 2D: Reports & Polish (1 tydzien)

1. 3.51 PO Spending Report (Should)
2. 3.52 Supplier Performance Report (Should)
3. 3.54 Supplier Rating Config (Should)
4. 3.55 Notification Settings (Should)
5. 3.44 TO Templates (Could)
6. 3.45 TO Scheduling View (Could)
7. 3.49 WO Campaigns (Could)

---

## 6. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| PLAN-FR-21: Supplier rating | 3.35, 3.54 | Ocena dostawcow |
| PLAN-FR-22: Price management | 3.33 | Cenniki |
| PLAN-FR-23: Lead time tracking | 3.34 | Analiza lead time |
| PLAN-FR-24: Multi-level approval | 3.39 | Kontrola zakupow |
| PLAN-FR-25: PO templates | 3.37, 3.38 | Efektywnosc |
| PLAN-FR-26: Material check | 3.48 | Planning accuracy |
| PLAN-FR-27: Dashboards | 3.50, 3.51, 3.52 | Visibility |

---

## 7. Dependencies

### 7.1 From Other Modules
- **Epic 1 (Settings):** Organizations, users, roles
- **Epic 2 (Technical):** Products, BOMs
- **Epic 5 (Warehouse):** Inventory levels for material check

### 7.2 To Other Modules
- **Epic 13 (Advanced Planning):** Rating data for MRP decisions
- **Epic 14 (Supplier Quality):** Rating baseline

---

## 8. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Approval matrix complexity | Medium | Medium | Start simple, extend |
| Rating calculation accuracy | Medium | Medium | Clear formula, validation |
| Template adoption | Low | Low | Good UX, examples |
| Price list data entry effort | Medium | Low | CSV import |

---

## 9. Technical Considerations

### 9.1 New Tables Summary

```
supplier_contacts       - Multiple contacts per supplier
supplier_documents      - Document storage
supplier_price_lists    - Time-based pricing
supplier_ratings        - Performance scores
po_templates           - PO templates
po_template_lines      - Template line items
po_approval_matrix     - Multi-level rules
po_approval_steps      - Approval workflow
to_templates           - TO templates
to_template_lines      - Template line items
wo_campaigns           - WO grouping
```

### 9.2 Modified Tables

```
purchase_orders        - blanket fields, confirmation fields
transfer_orders        - priority field
work_orders           - campaign_id
supplier_products     - promised_lead_time_days, preference_rank
```

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Enhanced Planning Epic |
