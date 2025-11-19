# Planning Module - PRD Specification

**Status:** To Be Implemented (Clean Slate)
**Priority:** P0 - Core Module
**Effort Estimate:** 3-4 weeks

---

## Overview

Planning module obsługuje "jak zamawiamy i planujemy" - zamówienia zakupu (PO), transfery między magazynami (TO), zlecenia produkcyjne (WO) i zarządzanie dostawcami z MRP.

## Dependencies

- **Requires:** Settings (warehouses, tax codes), Technical (products, BOMs, routings)
- **Required by:** Production (WO execution), Warehouse (receiving, shipping)
- **Shared services:** RLS (org_id)

---

## UI Structure

```
/planning
├── /purchase-orders       → PO list, create, bulk import
├── /transfer-orders       → TO list, create
├── /work-orders           → WO list, create, schedule
└── /mrp                   → Suppliers, MRP features (Phase 2)
```

---

## Planning Settings (in /settings/planning)

### PO Settings

| Setting | Type | Description |
|---------|------|-------------|
| PO Statuses | list | Configurable status list (org can have 3 or 5 statuses) |
| Default PO Status | enum | First status when created (e.g., Draft) |
| Require Approval | toggle | PO requires approval before send |
| Show Payment Terms | toggle | Field visibility |
| Show Shipping Method | toggle | Field visibility |
| Show Notes | toggle | Field visibility |

**Default PO Statuses:**
- Draft
- Submitted
- Confirmed
- Receiving
- Closed

**Optional Statuses:**
- Approved
- Partially Received
- Cancelled

### TO Settings

| Setting | Type | Description |
|---------|------|-------------|
| TO Statuses | list | Configurable status list |
| Allow Partial Shipments | toggle | Can ship partial TO |
| Require LP Selection | toggle | Must select specific LPs |

**Default TO Statuses:**
- Draft
- Planned
- Shipped
- Received

### WO Settings

| Setting | Type | Description |
|---------|------|-------------|
| WO Statuses | list | Configurable status list |
| Status Expiry (days) | number | Auto-expire WO after X days in status |
| Source of Demand | toggle | Show source field (PO, customer order, manual) |
| Material Check on Create | toggle | Check availability when creating WO |
| Copy Routing | toggle | Copy routing operations to WO |

**Default WO Statuses:**
- Draft
- Planned
- Released
- In Progress
- Completed
- Closed

---

## Sekcja 1: Purchase Orders

**Route:** `/planning/purchase-orders`

### 1.1 PO Header Fields

| Field | Type | Required | Inherited From | Description |
|-------|------|----------|----------------|-------------|
| `po_number` | string | Yes | Auto-generated | Numer PO (unique) |
| `supplier_id` | FK | Yes | - | Dostawca |
| `currency` | enum | Yes | Supplier | Waluta (inherited) |
| `tax_code_id` | FK | Yes | Supplier | Kod VAT (inherited) |
| `expected_delivery_date` | date | Yes | - | Oczekiwana data dostawy |
| `status` | enum | Yes | Settings | Status z konfigurowalnej listy |
| `warehouse_id` | FK | Yes | - | Magazyn docelowy |

**Configurable Fields (toggle in Settings):**

| Field | Type | Description |
|-------|------|-------------|
| `payment_terms` | string | Warunki płatności (inherited from Supplier) |
| `shipping_method` | string | Metoda wysyłki |
| `notes` | text | Notatki |
| `approval_status` | enum | Pending, Approved, Rejected |
| `approved_by` | FK | Kto zatwierdził |
| `approved_at` | datetime | Kiedy zatwierdzone |

### 1.2 PO Line Fields

| Field | Type | Required | Inherited From | Description |
|-------|------|----------|----------------|-------------|
| `product_id` | FK | Yes | - | Produkt |
| `quantity` | decimal | Yes | - | Ilość |
| `uom` | enum | Yes | Product | Jednostka (inherited) |
| `unit_price` | decimal | Yes | Product (std_price) | Cena jednostkowa |
| `line_total` | decimal | Calculated | - | quantity × unit_price |
| `expected_delivery_date` | date | No | Header | Data dostawy linii |
| `confirmed_delivery_date` | date | No | - | Potwierdzona data |
| `discount_percent` | decimal | No | - | Rabat % |

### 1.3 Bulk PO Creation

**Feature:** Import z Excel lub bulk add - auto-split by supplier

**Workflow:**

1. User uploads Excel or uses bulk add form
2. Input: Product Code, Quantity (minimum)
3. System looks up:
   - Product → Default Supplier
   - Supplier → Currency, Tax Code, Payment Terms
   - Product → UoM, Std Price
4. System groups by Supplier
5. Creates multiple POs automatically

**Example:**
```
Input:
| Product | Qty |
|---------|-----|
| A-01    | 100 |  → Supplier 1
| A-02    | 50  |  → Supplier 2
| A-03    | 200 |  → Supplier 1
| A-04    | 75  |  → Supplier 3

Output:
- PO-001 (Supplier 1): A-01 (100), A-03 (200)
- PO-002 (Supplier 2): A-02 (50)
- PO-003 (Supplier 3): A-04 (75)
```

**Bulk Add Form:**
- Simple table: Product (autocomplete), Quantity
- Add row button
- "Create POs" button → generates drafts
- User can edit drafts before submitting

### 1.4 PO Totals

| Field | Calculation |
|-------|-------------|
| `subtotal` | Sum of line_total |
| `tax_amount` | subtotal × tax_rate |
| `total` | subtotal + tax_amount |

### 1.5 UI Components

- PO list table with filters (status, supplier, date range)
- Create PO modal (supplier first, then lines)
- Bulk import modal (Excel upload or form)
- PO detail page with lines table
- Add PO Line modal
- Approval workflow (if enabled)

---

## Sekcja 2: Transfer Orders

**Route:** `/planning/transfer-orders`

### 2.1 TO Header Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to_number` | string | Yes | Numer TO (auto-generated) |
| `from_warehouse_id` | FK | Yes | Magazyn źródłowy |
| `to_warehouse_id` | FK | Yes | Magazyn docelowy |
| `planned_ship_date` | date | Yes | Planowana data wysyłki |
| `planned_receive_date` | date | Yes | Planowana data odbioru |
| `actual_ship_date` | date | No | Rzeczywista data wysyłki |
| `actual_receive_date` | date | No | Rzeczywista data odbioru |
| `status` | enum | Yes | Status z konfigurowalnej listy |
| `notes` | text | No | Notatki |

### 2.2 TO Line Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | FK | Yes | Produkt |
| `quantity` | decimal | Yes | Ilość |
| `uom` | enum | Yes | Jednostka (from Product) |
| `shipped_qty` | decimal | No | Ilość wysłana (for partial) |
| `received_qty` | decimal | No | Ilość odebrana |

### 2.3 TO LP Selection (Optional)

**When enabled in Settings:**

| Field | Type | Description |
|-------|------|-------------|
| `lp_id` | FK | Konkretna LP do transferu |

- User can select specific LPs for each line
- Not mandatory - can transfer without LP selection
- At shipping, scanner confirms which LPs are shipped

### 2.4 Partial Shipments

**When enabled in Settings:**

- TO can be shipped in parts
- Each shipment creates shipment record
- Status: Planned → Partially Shipped → Shipped → Received
- Track shipped_qty vs quantity per line

### 2.5 UI Components

- TO list table with filters
- Create TO modal
- TO detail page with lines
- LP selection modal (if enabled)
- Ship TO button → scanner workflow
- Receive TO button → scanner workflow

---

## Sekcja 3: Work Orders

**Route:** `/planning/work-orders`

### 3.1 WO Header Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wo_number` | string | Yes | Numer WO (auto-generated) |
| `product_id` | FK | Yes | Produkt do wyprodukowania |
| `bom_id` | FK | Yes | BOM (auto-select active, can override) |
| `quantity` | decimal | Yes | Ilość do wyprodukowania |
| `uom` | enum | Yes | Jednostka (from Product) |
| `scheduled_date` | date | Yes | Planowana data produkcji |
| `line_id` | FK | No | Linia produkcyjna |
| `machine_id` | FK | No | Maszyna |
| `status` | enum | Yes | Status z konfigurowalnej listy |
| `priority` | enum | No | Low, Medium, High, Critical |
| `notes` | text | No | Notatki |

**Configurable Fields (toggle in Settings):**

| Field | Type | Description |
|-------|------|-------------|
| `source_of_demand` | enum | PO Number, Customer Order, Manual, Forecast |
| `source_reference` | string | Reference number (PO-001, ORD-123) |
| `expiry_date` | date | WO expires after this date |

### 3.2 BOM Auto-Selection

**Logic:**
1. User selects Product
2. System finds active BOM where: `effective_from <= scheduled_date <= effective_to`
3. If multiple active BOMs, select most recent
4. User can override selection

### 3.3 WO Materials (BOM Snapshot)

**At WO creation, BOM is copied to `wo_materials`:**

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | FK | Material product |
| `quantity` | decimal | Required qty (BOM qty × WO qty / BOM output) |
| `uom` | enum | Unit of measure |
| `scrap_percent` | decimal | Scrap % |
| `consume_whole_lp` | boolean | 1:1 consumption flag |
| `is_by_product` | boolean | Is by-product |
| `yield_percent` | decimal | By-product yield |
| `condition_flags` | jsonb | Conditional flags |
| `consumed_qty` | decimal | Actually consumed (updated during production) |

**Immutability:** Once WO is released, wo_materials cannot change (even if BOM is updated)

### 3.4 WO Operations (Routing Copy)

**When enabled, routing copied to `wo_operations`:**

| Field | Type | Description |
|-------|------|-------------|
| `sequence` | number | Operation sequence |
| `operation_name` | string | Name |
| `machine_id` | FK | Machine |
| `line_id` | FK | Line |
| `expected_duration_minutes` | number | Expected time |
| `expected_yield_percent` | decimal | Expected yield |
| `actual_duration_minutes` | number | Actual time (filled during production) |
| `actual_yield_percent` | decimal | Actual yield |
| `status` | enum | Not Started, In Progress, Completed |
| `started_at` | datetime | When started |
| `completed_at` | datetime | When completed |

### 3.5 Material Availability Check

**When creating WO (if enabled in Settings):**

1. Calculate required materials from BOM
2. Check available stock (LP qty where status=available)
3. Show warnings:
   - ⚠️ Yellow: Low stock (available < required × 1.2)
   - 🔴 Red: No stock (available < required)
4. User can proceed despite warnings

### 3.6 WO Status Lifecycle

**Default flow:**
```
Draft → Planned → Released → In Progress → Completed → Closed
```

**Optional statuses:**
- On Hold
- Cancelled
- Quality Hold

**Status expiry:** If configured, WO auto-closes after X days in final status

### 3.7 UI Components

- WO list table with filters (status, product, date, line)
- Create WO modal with BOM preview
- Material availability indicator
- WO detail page with materials and operations
- Gantt chart view (scheduled WOs on timeline)
- Start WO button → Production module

---

## Sekcja 4: MRP (Suppliers + Forecasting)

**Route:** `/planning/mrp`

### 4.1 Suppliers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod dostawcy |
| `name` | string | Yes | Nazwa |
| `address` | text | No | Adres |
| `city` | string | No | Miasto |
| `postal_code` | string | No | Kod pocztowy |
| `country` | string | No | Kraj |
| `contact_name` | string | No | Osoba kontaktowa |
| `contact_email` | string | No | Email |
| `contact_phone` | string | No | Telefon |
| `currency` | enum | Yes | Domyślna waluta |
| `tax_code_id` | FK | Yes | Domyślny kod VAT |
| `payment_terms` | string | No | Warunki płatności |
| `lead_time_days` | number | Yes | Domyślny czas dostawy |
| `moq` | decimal | No | Minimum Order Quantity |
| `is_active` | boolean | Yes | Czy aktywny |

### 4.2 Supplier-Product Assignments

| Field | Type | Description |
|-------|------|-------------|
| `supplier_id` | FK | Dostawca |
| `product_id` | FK | Produkt |
| `is_default` | boolean | Czy domyślny dostawca dla tego produktu |
| `supplier_product_code` | string | Kod produktu u dostawcy |
| `lead_time_days` | number | Override lead time dla tego produktu |
| `unit_price` | decimal | Cena od tego dostawcy |
| `moq` | decimal | MOQ dla tego produktu |

### 4.3 MRP Features (Phase 2 - Growth)

**Demand Forecasting:**
- Historical sales analysis
- Seasonal patterns
- Predict demand 7/14/30 days ahead

**Auto-Generate PO:**
- Calculate material needs from WO schedule
- Generate POs based on reorder points
- Consider lead times

**Auto-Schedule WO:**
- Optimize production schedule
- Consider: material availability, line capacity, priorities
- Minimize changeovers

**What-If Scenarios:**
- Simulate schedule changes
- Impact analysis

### 4.4 UI Components

- Suppliers list table
- Supplier detail with products
- Supplier-Product assignment modal
- MRP Dashboard (Phase 2):
  - Demand forecast chart
  - Suggested POs
  - Suggested WO schedule
  - Material shortages alerts

---

## Functional Requirements

### Purchase Orders

**FR-PLAN-001: PO CRUD**
- **Priority:** MVP
- **Description:** Create, edit, view purchase orders with configurable fields
- **Acceptance Criteria:**
  - User can create PO with supplier and lines
  - Currency/Tax inherited from supplier
  - Price/UoM inherited from product
  - Status from configurable list

**FR-PLAN-002: Bulk PO Creation**
- **Priority:** MVP
- **Description:** Import products from Excel or bulk form, auto-split by supplier
- **Acceptance Criteria:**
  - User can upload Excel or use bulk form
  - System groups products by default supplier
  - Creates multiple POs in draft status
  - User can edit before submitting

**FR-PLAN-003: PO Approval Workflow**
- **Priority:** MVP (if toggle enabled)
- **Description:** PO requires approval before sending to supplier
- **Acceptance Criteria:**
  - Approval status: Pending, Approved, Rejected
  - Only Manager/Admin can approve
  - Approval logged with user and timestamp

**FR-PLAN-004: Configurable PO Statuses**
- **Priority:** MVP
- **Description:** Organization can configure which statuses to use
- **Acceptance Criteria:**
  - Settings has status list management
  - Can add/remove/rename statuses
  - Default statuses provided

### Transfer Orders

**FR-PLAN-005: TO CRUD**
- **Priority:** MVP
- **Description:** Create and manage transfer orders between warehouses
- **Acceptance Criteria:**
  - User can create TO with from/to warehouse and lines
  - Planned and actual dates tracked
  - Status lifecycle enforced

**FR-PLAN-006: Partial Shipments**
- **Priority:** MVP
- **Description:** Ship TO in multiple shipments
- **Acceptance Criteria:**
  - Toggle in Settings
  - Track shipped_qty vs quantity
  - Status: Partially Shipped

**FR-PLAN-007: LP Selection for TO**
- **Priority:** MVP
- **Description:** Optionally select specific LPs for transfer
- **Acceptance Criteria:**
  - Toggle in Settings
  - User can assign LPs to TO lines
  - Not mandatory - can ship without pre-selection

### Work Orders

**FR-PLAN-008: WO CRUD**
- **Priority:** MVP
- **Description:** Create and manage work orders with BOM snapshot
- **Acceptance Criteria:**
  - User can create WO with product, qty, date
  - BOM auto-selected based on date
  - BOM copied to wo_materials (immutable)

**FR-PLAN-009: BOM Auto-Selection**
- **Priority:** MVP
- **Description:** Automatically select active BOM based on scheduled date
- **Acceptance Criteria:**
  - Find BOM where effective_from <= date <= effective_to
  - Select most recent if multiple
  - User can override

**FR-PLAN-010: Material Availability Check**
- **Priority:** MVP
- **Description:** Check stock availability when creating WO
- **Acceptance Criteria:**
  - Calculate required materials
  - Check available LP qty
  - Show warnings (yellow/red)
  - Allow proceed despite warnings

**FR-PLAN-011: Routing Copy to WO**
- **Priority:** MVP
- **Description:** Copy routing operations to WO for tracking
- **Acceptance Criteria:**
  - Routing operations copied to wo_operations
  - Track actual vs expected time/yield
  - Operation status tracking

**FR-PLAN-012: Configurable WO Statuses**
- **Priority:** MVP
- **Description:** Organization can configure WO status lifecycle
- **Acceptance Criteria:**
  - Settings has status list management
  - Status expiry (auto-close after X days)
  - Source of demand field (toggle)

### MRP

**FR-PLAN-013: Supplier Management**
- **Priority:** MVP
- **Description:** Manage suppliers with defaults and product assignments
- **Acceptance Criteria:**
  - Supplier has currency, tax, lead time defaults
  - Product-supplier assignments with overrides
  - Multiple suppliers per product

**FR-PLAN-014: Demand Forecasting**
- **Priority:** Growth (Phase 2)
- **Description:** Predict material demand based on historical data
- **Acceptance Criteria:**
  - Analyze historical consumption
  - Predict 7/14/30 days ahead
  - Seasonal pattern recognition

**FR-PLAN-015: Auto-Generate PO**
- **Priority:** Growth (Phase 2)
- **Description:** Automatically create POs based on forecasted demand
- **Acceptance Criteria:**
  - Calculate needs from WO schedule + forecast
  - Generate PO suggestions
  - Consider lead times and MOQ

**FR-PLAN-016: Auto-Schedule WO**
- **Priority:** Growth (Phase 2)
- **Description:** Optimize WO schedule based on constraints
- **Acceptance Criteria:**
  - Consider material availability
  - Consider line capacity
  - Minimize changeovers
  - Priority-based scheduling

---

## Database Tables

### purchase_orders
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- po_number TEXT NOT NULL UNIQUE
- supplier_id UUID FK NOT NULL
- currency TEXT NOT NULL
- tax_code_id UUID FK NOT NULL
- expected_delivery_date DATE NOT NULL
- warehouse_id UUID FK NOT NULL
- status TEXT NOT NULL
- payment_terms TEXT
- shipping_method TEXT
- notes TEXT
- approval_status TEXT
- approved_by UUID FK
- approved_at TIMESTAMPTZ
- subtotal NUMERIC
- tax_amount NUMERIC
- total NUMERIC
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- created_by UUID FK
- updated_by UUID FK
```

### po_lines
```sql
- id UUID PK
- po_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- unit_price NUMERIC NOT NULL
- discount_percent NUMERIC DEFAULT 0
- line_total NUMERIC NOT NULL
- expected_delivery_date DATE
- confirmed_delivery_date DATE
- received_qty NUMERIC DEFAULT 0
- created_at TIMESTAMPTZ
```

### transfer_orders
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- to_number TEXT NOT NULL UNIQUE
- from_warehouse_id UUID FK NOT NULL
- to_warehouse_id UUID FK NOT NULL
- planned_ship_date DATE NOT NULL
- planned_receive_date DATE NOT NULL
- actual_ship_date DATE
- actual_receive_date DATE
- status TEXT NOT NULL
- notes TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- created_by UUID FK
```

### to_lines
```sql
- id UUID PK
- to_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- shipped_qty NUMERIC DEFAULT 0
- received_qty NUMERIC DEFAULT 0
- created_at TIMESTAMPTZ
```

### to_line_lps
```sql
- id UUID PK
- to_line_id UUID FK NOT NULL
- lp_id UUID FK NOT NULL
- created_at TIMESTAMPTZ
```

### work_orders
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- wo_number TEXT NOT NULL UNIQUE
- product_id UUID FK NOT NULL
- bom_id UUID FK NOT NULL
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- scheduled_date DATE NOT NULL
- line_id UUID FK
- machine_id UUID FK
- status TEXT NOT NULL
- priority TEXT DEFAULT 'medium'
- source_of_demand TEXT
- source_reference TEXT
- expiry_date DATE
- notes TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- created_by UUID FK
- started_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
```

### wo_materials
```sql
- id UUID PK
- wo_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- scrap_percent NUMERIC DEFAULT 0
- consume_whole_lp BOOLEAN DEFAULT false
- is_by_product BOOLEAN DEFAULT false
- yield_percent NUMERIC
- condition_flags JSONB
- consumed_qty NUMERIC DEFAULT 0
- created_at TIMESTAMPTZ
```

### wo_operations
```sql
- id UUID PK
- wo_id UUID FK NOT NULL
- sequence INTEGER NOT NULL
- operation_name TEXT NOT NULL
- machine_id UUID FK
- line_id UUID FK
- expected_duration_minutes INTEGER
- expected_yield_percent NUMERIC
- actual_duration_minutes INTEGER
- actual_yield_percent NUMERIC
- status TEXT DEFAULT 'not_started'
- started_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
- created_at TIMESTAMPTZ
```

### suppliers
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- address TEXT
- city TEXT
- postal_code TEXT
- country TEXT
- contact_name TEXT
- contact_email TEXT
- contact_phone TEXT
- currency TEXT NOT NULL
- tax_code_id UUID FK NOT NULL
- payment_terms TEXT
- lead_time_days INTEGER NOT NULL
- moq NUMERIC
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### supplier_products
```sql
- id UUID PK
- supplier_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- is_default BOOLEAN DEFAULT false
- supplier_product_code TEXT
- lead_time_days INTEGER
- unit_price NUMERIC
- moq NUMERIC
- created_at TIMESTAMPTZ
- UNIQUE (supplier_id, product_id)
```

### planning_settings
```sql
- id UUID PK
- org_id UUID FK NOT NULL UNIQUE
- po_statuses JSONB NOT NULL
- po_require_approval BOOLEAN DEFAULT false
- po_field_config JSONB
- to_statuses JSONB NOT NULL
- to_allow_partial BOOLEAN DEFAULT true
- to_require_lp_selection BOOLEAN DEFAULT false
- wo_statuses JSONB NOT NULL
- wo_status_expiry_days INTEGER
- wo_source_of_demand BOOLEAN DEFAULT false
- wo_material_check BOOLEAN DEFAULT true
- wo_copy_routing BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

---

## API Endpoints

### Purchase Orders
- `GET /api/planning/purchase-orders` - List POs
- `GET /api/planning/purchase-orders/:id` - Get PO with lines
- `POST /api/planning/purchase-orders` - Create PO
- `PUT /api/planning/purchase-orders/:id` - Update PO
- `DELETE /api/planning/purchase-orders/:id` - Delete PO (draft only)
- `POST /api/planning/purchase-orders/bulk` - Bulk create POs
- `PUT /api/planning/purchase-orders/:id/status` - Change status
- `PUT /api/planning/purchase-orders/:id/approve` - Approve PO

### PO Lines
- `POST /api/planning/purchase-orders/:id/lines` - Add line
- `PUT /api/planning/purchase-orders/:id/lines/:lineId` - Update line
- `DELETE /api/planning/purchase-orders/:id/lines/:lineId` - Remove line

### Transfer Orders
- `GET /api/planning/transfer-orders` - List TOs
- `GET /api/planning/transfer-orders/:id` - Get TO with lines
- `POST /api/planning/transfer-orders` - Create TO
- `PUT /api/planning/transfer-orders/:id` - Update TO
- `DELETE /api/planning/transfer-orders/:id` - Delete TO
- `PUT /api/planning/transfer-orders/:id/status` - Change status
- `PUT /api/planning/transfer-orders/:id/lines/:lineId/lps` - Assign LPs

### Work Orders
- `GET /api/planning/work-orders` - List WOs
- `GET /api/planning/work-orders/:id` - Get WO with materials and operations
- `POST /api/planning/work-orders` - Create WO (with BOM snapshot)
- `PUT /api/planning/work-orders/:id` - Update WO
- `DELETE /api/planning/work-orders/:id` - Delete WO (draft only)
- `PUT /api/planning/work-orders/:id/status` - Change status
- `GET /api/planning/work-orders/:id/availability` - Check material availability
- `GET /api/planning/work-orders/schedule` - Get WO schedule (for Gantt)

### Suppliers
- `GET /api/planning/suppliers` - List suppliers
- `GET /api/planning/suppliers/:id` - Get supplier with products
- `POST /api/planning/suppliers` - Create supplier
- `PUT /api/planning/suppliers/:id` - Update supplier
- `DELETE /api/planning/suppliers/:id` - Deactivate supplier
- `PUT /api/planning/suppliers/:id/products` - Assign products

### MRP (Phase 2)
- `GET /api/planning/mrp/forecast` - Get demand forecast
- `GET /api/planning/mrp/suggested-pos` - Get PO suggestions
- `GET /api/planning/mrp/suggested-schedule` - Get WO schedule suggestions
- `POST /api/planning/mrp/generate-pos` - Generate POs from suggestions

### Planning Settings
- `GET /api/planning/settings` - Get planning settings
- `PUT /api/planning/settings` - Update planning settings

---

## Notes

- **Inheritance:** Currency/Tax from Supplier, Price/UoM from Product - reduces data entry
- **Bulk PO:** Critical for efficiency - one of most frequent operations
- **BOM Immutability:** WO materials snapshot cannot change after creation
- **Configurable Statuses:** Different orgs have different workflows - flexibility is key
- **MRP Phase 2:** Demand forecasting and auto-generation are advanced features
- **Material Check:** Warning only - don't block WO creation (user may know materials are coming)
