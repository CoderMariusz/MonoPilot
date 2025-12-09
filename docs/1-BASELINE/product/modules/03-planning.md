# Planning Module PRD

**Epic:** 3 - Planning
**Status:** DONE (30 stories)
**Ostatnia aktualizacja:** 2025-12-09

---

## 1. Overview

### Cel modulu
Planning Module odpowiada za planowanie i zarzadzanie zamowieniami:
- Suppliers (dostawcy)
- Purchase Orders (PO) - zamowienia zakupu
- Transfer Orders (TO) - transfery wewnetrzne
- Work Orders (WO) - zlecenia produkcyjne (stub - pelna implementacja w Epic 4)
- Approval workflow dla PO

### Zaleznosci
- **Wymaga:** Settings (Epic 1), Technical (Epic 2)
- **Zalezne od Planning:**
  - Production (Epic 4) - WO execution
  - Warehouse (Epic 5) - GRN from PO, TO receiving

### Kluczowe koncepty
- **Document Numbering:** Auto-generated (PO-YYYY-NNNN, TO-YYYY-NNN)
- **Inheritance:** Currency/Tax from Supplier, Price/UoM from Product
- **Approval Workflow:** Configurable approval for PO
- **Partial Shipment:** TO supports partial ship/receive

---

## 2. User Roles & Permissions

### Macierz uprawnien Planning

| Funkcja | admin | purchasing | planner | manager | warehouse | viewer |
|---------|-------|------------|---------|---------|-----------|--------|
| Supplier CRUD | RWD | RWD | R | R | R | R |
| PO CRUD | RWD | RWD | RW | R | R | R |
| PO Approve | YES | NO | NO | YES | NO | NO |
| TO CRUD | RWD | RW | RWD | RW | RW | R |
| TO Ship/Receive | YES | YES | YES | YES | YES | NO |
| WO Create | RWD | NO | RWD | RW | NO | R |
| Planning Settings | RWD | RW | RW | R | - | - |

*R = Read, W = Write, D = Delete*

---

## 3. Settings Configuration

### Planning Settings (`planning_settings`)

```json
{
  "po_default_status": "draft",
  "po_require_approval": true,
  "po_approval_threshold": 10000.00,
  "po_number_prefix": "PO",
  "po_number_format": "{PREFIX}-{YYYY}-{NNNN}",
  "to_default_status": "draft",
  "to_number_prefix": "TO",
  "to_number_format": "{PREFIX}-{YYYY}-{NNN}",
  "wo_default_status": "draft",
  "wo_number_prefix": "WO",
  "wo_number_format": "{PREFIX}-{YYYY}-{NNNN}",
  "default_payment_terms": "Net 30",
  "auto_create_grn": false
}
```

### Feature Toggles

| Toggle | Default | Opis |
|--------|---------|------|
| `po_require_approval` | ON | PO requires manager approval |
| `po_approval_threshold` | 10000 | Threshold for mandatory approval |
| `auto_create_grn` | OFF | Auto-create GRN from PO |

---

## 4. Core Entities

### 4.1 Supplier

**Tabela:** `suppliers`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | VARCHAR | YES | Unique per org, A-Z0-9- |
| name | VARCHAR | YES | Supplier name |
| contact_person | VARCHAR | NO | Contact person |
| email | VARCHAR | NO | Email (validated) |
| phone | VARCHAR | NO | Phone |
| address | TEXT | NO | Address |
| city | VARCHAR | NO | City |
| postal_code | VARCHAR | NO | Postal code |
| country | VARCHAR | NO | Country |
| currency | VARCHAR | YES | PLN/EUR/USD/GBP |
| tax_code_id | UUID | FK | tax_codes.id |
| payment_terms | VARCHAR | YES | e.g., Net 30 |
| lead_time_days | INTEGER | YES | Default: 7, >= 0 |
| moq | NUMERIC | NO | Min Order Qty, > 0 |
| is_active | BOOLEAN | YES | Default: true |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | NO | Auto |
| updated_at | TIMESTAMPTZ | NO | Auto |

### 4.2 Supplier Products

**Tabela:** `supplier_products`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| supplier_id | UUID | FK | suppliers.id |
| product_id | UUID | FK | products.id |
| is_default | BOOLEAN | YES | Default supplier for product |
| supplier_product_code | VARCHAR | NO | Supplier's code |
| unit_price | NUMERIC | NO | Price per unit, >= 0 |
| lead_time_days | INTEGER | NO | Override lead time |
| moq | NUMERIC | NO | Override MOQ |
| created_at | TIMESTAMPTZ | NO | Auto |
| updated_at | TIMESTAMPTZ | NO | Auto |

### 4.3 Purchase Order

**Tabela:** `purchase_orders`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| po_number | VARCHAR | YES | Unique per org, PO-YYYY-NNNN |
| supplier_id | UUID | FK | suppliers.id |
| warehouse_id | UUID | FK | warehouses.id |
| status | VARCHAR | YES | draft/submitted/approved/receiving/closed/cancelled |
| expected_delivery_date | DATE | YES | Expected delivery |
| actual_delivery_date | DATE | NO | Actual delivery |
| payment_terms | VARCHAR | NO | From supplier or override |
| shipping_method | VARCHAR | NO | Shipping method |
| notes | TEXT | NO | Notes |
| currency | VARCHAR | YES | From supplier |
| subtotal | NUMERIC | YES | Sum of line totals, >= 0 |
| tax_amount | NUMERIC | YES | Total tax, >= 0 |
| total | NUMERIC | YES | Grand total, >= 0 |
| approval_status | VARCHAR | NO | pending/approved/rejected |
| approved_by | UUID | FK | users.id |
| approved_at | TIMESTAMPTZ | NO | Approval timestamp |
| rejection_reason | TEXT | NO | If rejected |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | NO | Auto |
| updated_at | TIMESTAMPTZ | NO | Auto |

**PO Status Flow:**

```
draft → submitted → approved → receiving → closed
   ↓         ↓           ↓
cancelled  rejected   cancelled
```

### 4.4 PO Lines

**Tabela:** `po_lines`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| po_id | UUID | FK | purchase_orders.id |
| product_id | UUID | FK | products.id |
| sequence | INTEGER | YES | Line order |
| quantity | NUMERIC | YES | > 0 |
| uom | VARCHAR | YES | From product |
| unit_price | NUMERIC | YES | >= 0 |
| discount_percent | NUMERIC | NO | Default: 0, 0-100 |
| line_subtotal | NUMERIC | YES | Qty x Price |
| discount_amount | NUMERIC | YES | Default: 0 |
| line_total | NUMERIC | YES | Subtotal - discount |
| tax_amount | NUMERIC | YES | Default: 0 |
| line_total_with_tax | NUMERIC | YES | Total + tax |
| expected_delivery_date | DATE | NO | Line-specific date |
| received_qty | NUMERIC | NO | Default: 0, >= 0 |
| created_at | TIMESTAMPTZ | NO | Auto |
| updated_at | TIMESTAMPTZ | NO | Auto |

### 4.5 PO Approvals

**Tabela:** `po_approvals`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| po_id | UUID | FK | purchase_orders.id |
| status | VARCHAR | YES | pending/approved/rejected |
| approved_by | UUID | FK | users.id |
| approved_at | TIMESTAMPTZ | NO | Timestamp |
| rejection_reason | TEXT | NO | If rejected |
| comments | TEXT | NO | Comments |
| created_at | TIMESTAMPTZ | NO | Auto |

### 4.6 Transfer Order

**Tabela:** `transfer_orders`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| to_number | VARCHAR | YES | Unique globally, TO-YYYY-NNN |
| from_warehouse_id | UUID | FK | warehouses.id |
| to_warehouse_id | UUID | FK | warehouses.id |
| status | VARCHAR | YES | draft/planned/partially_shipped/shipped/partially_received/received/cancelled |
| planned_ship_date | DATE | NO | Planned ship |
| planned_receive_date | DATE | NO | Planned receive |
| actual_ship_date | DATE | NO | Actual ship |
| actual_receive_date | DATE | NO | Actual receive |
| notes | TEXT | NO | Notes |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

**TO Status Flow:**

```
draft → planned → partially_shipped → shipped → partially_received → received
   ↓        ↓                             ↓
cancelled cancelled                  cancelled
```

### 4.7 TO Lines

**Tabela:** `to_lines`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| transfer_order_id | UUID | FK | transfer_orders.id |
| product_id | UUID | FK | products.id |
| quantity | NUMERIC | YES | > 0 |
| uom | VARCHAR | YES | From product |
| shipped_qty | NUMERIC | YES | Default: 0 |
| received_qty | NUMERIC | YES | Default: 0 |
| notes | TEXT | NO | Notes |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | NO | Auto |
| updated_at | TIMESTAMPTZ | NO | Auto |

### 4.8 TO Line LPs

**Tabela:** `to_line_lps`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| to_line_id | UUID | FK | to_lines.id |
| lp_id | UUID | FK | license_plates.id |
| reserved_qty | NUMERIC | YES | Reserved quantity |
| created_at | TIMESTAMPTZ | NO | Auto |

### 4.9 Work Order (stub)

**Tabela:** `work_orders`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| wo_number | VARCHAR | YES | Unique per org, WO-YYYY-NNNN |
| product_id | UUID | FK | products.id |
| planned_quantity | NUMERIC | YES | > 0 |
| produced_quantity | NUMERIC | NO | Default: 0 |
| uom | VARCHAR | YES | From product |
| status | VARCHAR | YES | draft/released/in_progress/completed/closed/cancelled |
| planned_start_date | DATE | NO | Planned start |
| planned_end_date | DATE | NO | Planned end |
| actual_start_date | DATE | NO | Actual start |
| actual_end_date | DATE | NO | Actual end |
| production_line_id | UUID | FK | production_lines.id |
| routing_id | UUID | FK | routings.id |
| bom_id | UUID | FK | boms.id |
| bom_snapshot | JSONB | NO | Snapshot at creation |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

**WO Status Flow (full impl in Epic 4):**

```
draft → released → in_progress → completed → closed
   ↓        ↓            ↓
cancelled cancelled   cancelled
```

---

## 5. Workflows

### 5.1 Desktop Workflows

#### Supplier Creation

```
Enter code + name
    ↓
Set currency + tax_code
    ↓
Set payment_terms + lead_time_days
    ↓
Optional: Set MOQ
    ↓
Save supplier
```

#### PO Creation

```
Select supplier
    ↓
System inherits: currency, payment_terms
    ↓
Select warehouse
    ↓
Set expected_delivery_date
    ↓
Add lines:
  - Select product
  - System inherits: uom, default price
  - Enter quantity
    ↓
System calculates: subtotal, tax, total
    ↓
Save as Draft
    ↓
Submit for approval (if required)
```

#### PO Approval

```
PO status = submitted
    ↓
Manager reviews
    ↓
Approve:
  → status = approved
  → approved_by, approved_at filled
    OR
Reject:
  → status = draft (returned)
  → rejection_reason filled
```

#### TO Creation

```
Select from_warehouse
    ↓
Select to_warehouse (must be different)
    ↓
Set planned dates
    ↓
Add lines:
  - Select product
  - Enter quantity
    ↓
Optional: Select specific LPs
    ↓
Save as Draft
    ↓
Set status = planned
```

#### TO Ship

```
TO status = planned
    ↓
Enter ship quantities per line
    ↓
System validates: shipped_qty <= quantity
    ↓
First shipment:
  → actual_ship_date = today (immutable)
    ↓
System updates status:
  - All shipped → shipped
  - Partial → partially_shipped
```

#### WO Creation (stub)

```
Select product (FG/WIP only)
    ↓
System finds active BOM for date
    ↓
Enter planned_quantity
    ↓
Select production_line
    ↓
Set planned_start/end dates
    ↓
Save as Draft
    ↓
Release when ready
```

### 5.2 Scanner Workflows

**Scanner workflows w Planning sa ograniczone do:**

#### Scanner: Lookup PO for Receiving

```
Scan PO barcode (or select from dropdown)
    ↓
Display: PO lines with open qty
    ↓
→ Continue in Warehouse module (GRN creation)
```

---

## 6. Database Tables

### Schema Summary

| Tabela | Rows | RLS | Opis |
|--------|------|-----|------|
| suppliers | 4 | YES | Vendor catalog |
| supplier_products | 0 | YES | Product-supplier links |
| purchase_orders | 0 | YES | Purchase orders |
| po_lines | 0 | YES | PO line items |
| po_approvals | 0 | YES | Approval records |
| transfer_orders | 0 | YES | Transfer orders |
| to_lines | 0 | YES | TO line items |
| to_line_lps | 0 | YES | LP selections |
| work_orders | 0 | YES | Work orders (stub) |
| planning_settings | 0 | YES | Module settings |

### Key Indexes

```sql
-- Purchase Orders
CREATE UNIQUE INDEX purchase_orders_org_po_number_unique ON purchase_orders(org_id, po_number);
CREATE INDEX purchase_orders_supplier_idx ON purchase_orders(supplier_id);
CREATE INDEX purchase_orders_status_idx ON purchase_orders(status);

-- Transfer Orders
CREATE UNIQUE INDEX transfer_orders_to_number_unique ON transfer_orders(to_number);

-- Work Orders
CREATE UNIQUE INDEX work_orders_org_wo_number_unique ON work_orders(org_id, wo_number);
```

---

## 7. API Endpoints

### Suppliers

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/suppliers | List suppliers |
| GET | /api/planning/suppliers/:id | Get supplier |
| POST | /api/planning/suppliers | Create supplier |
| PUT | /api/planning/suppliers/:id | Update supplier |
| DELETE | /api/planning/suppliers/:id | Archive supplier |
| GET | /api/planning/suppliers/:id/products | Get supplier products |
| PUT | /api/planning/suppliers/:id/products | Set supplier products |

### Purchase Orders

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/purchase-orders | List POs |
| GET | /api/planning/purchase-orders/:id | Get PO |
| POST | /api/planning/purchase-orders | Create PO |
| PUT | /api/planning/purchase-orders/:id | Update PO |
| DELETE | /api/planning/purchase-orders/:id | Delete PO |
| POST | /api/planning/purchase-orders/:id/submit | Submit for approval |
| POST | /api/planning/purchase-orders/:id/approve | Approve PO |
| POST | /api/planning/purchase-orders/:id/reject | Reject PO |
| POST | /api/planning/purchase-orders/:id/cancel | Cancel PO |

### PO Lines

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/purchase-orders/:id/lines | List lines |
| POST | /api/planning/purchase-orders/:id/lines | Add line |
| PUT | /api/planning/purchase-orders/:id/lines/:lineId | Update line |
| DELETE | /api/planning/purchase-orders/:id/lines/:lineId | Delete line |

### Transfer Orders

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/transfer-orders | List TOs |
| GET | /api/planning/transfer-orders/:id | Get TO |
| POST | /api/planning/transfer-orders | Create TO |
| PUT | /api/planning/transfer-orders/:id | Update TO |
| DELETE | /api/planning/transfer-orders/:id | Delete TO |
| POST | /api/planning/transfer-orders/:id/status | Change status |
| POST | /api/planning/transfer-orders/:id/ship | Ship TO |

### TO Lines

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/transfer-orders/:id/lines | List lines |
| POST | /api/planning/transfer-orders/:id/lines | Add line |
| PUT | /api/planning/transfer-orders/:id/lines/:lineId | Update line |
| DELETE | /api/planning/transfer-orders/:id/lines/:lineId | Delete line |
| GET | /api/planning/transfer-orders/:id/lines/:lineId/lps | Get LP selections |
| PUT | /api/planning/transfer-orders/:id/lines/:lineId/lps | Set LP selections |

### Work Orders (stub)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/work-orders | List WOs |
| GET | /api/planning/work-orders/:id | Get WO |
| POST | /api/planning/work-orders | Create WO |
| PUT | /api/planning/work-orders/:id | Update WO |
| POST | /api/planning/work-orders/:id/release | Release WO |

### Settings

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/planning/settings | Get settings |
| PUT | /api/planning/settings | Update settings |

---

## 8. Functional Requirements

| ID | Opis | Priority | Status |
|----|------|----------|--------|
| FR-PLAN-01 | User moze CRUD suppliers | Must Have | DONE |
| FR-PLAN-02 | Supplier ma currency + tax_code (inherited to PO) | Must Have | DONE |
| FR-PLAN-03 | User moze przypisac products do supplier | Should Have | DONE |
| FR-PLAN-04 | Product moze miec default supplier | Should Have | DONE |
| FR-PLAN-05 | PO number jest auto-generated (PO-YYYY-NNNN) | Must Have | DONE |
| FR-PLAN-06 | PO inherits currency + payment_terms from supplier | Must Have | DONE |
| FR-PLAN-07 | PO lines inherit uom + price from product | Must Have | DONE |
| FR-PLAN-08 | System auto-calculates PO totals | Must Have | DONE |
| FR-PLAN-09 | PO wymaga approval (configurable) | Should Have | DONE |
| FR-PLAN-10 | Manager moze approve/reject PO | Must Have | DONE |
| FR-PLAN-11 | PO status flow: draft → submitted → approved → receiving → closed | Must Have | DONE |
| FR-PLAN-12 | TO number jest auto-generated (TO-YYYY-NNN) | Must Have | DONE |
| FR-PLAN-13 | TO from_warehouse != to_warehouse validation | Must Have | DONE |
| FR-PLAN-14 | TO wspiera partial shipment | Must Have | DONE |
| FR-PLAN-15 | TO actual_ship_date set on first shipment (immutable) | Should Have | DONE |
| FR-PLAN-16 | User moze select specific LPs for TO line | Should Have | DONE |
| FR-PLAN-17 | TO status auto-updates based on shipped/received qty | Must Have | DONE |
| FR-PLAN-18 | WO creation selects active BOM for date | Must Have | DONE |
| FR-PLAN-19 | WO captures BOM snapshot at creation | Must Have | DONE |
| FR-PLAN-20 | WO number jest auto-generated (WO-YYYY-NNNN) | Must Have | DONE |

---

## 9. Integration Points

### Internal Integrations

| Modul | Integracja | Opis |
|-------|------------|------|
| Settings | warehouses | PO warehouse selection |
| Settings | tax_codes | Supplier tax code |
| Technical | products | PO/TO/WO line products |
| Technical | boms | WO BOM selection |
| Warehouse | license_plates | TO LP selection |
| Warehouse | grns | PO receiving creates GRN |

### Data Flow

```
Supplier → PO Header (currency, payment_terms)
Product → PO Line (uom, description)
Product → TO Line (uom)
BOM → WO (snapshot)
PO → GRN (receiving in Warehouse)
TO → Stock Movement (shipping/receiving)
```

---

## 10. Story Map

### Epic 3 Stories (30 total - ALL DONE)

| Story | Tytul | Status |
|-------|-------|--------|
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

## 11. Version History

| Wersja | Data | Opis |
|--------|------|------|
| 1.0 | 2025-12-09 | Initial PRD based on discovery |

---

## 12. Services Reference

**Key service files:**
- `apps/frontend/lib/services/purchase-order-service.ts`
- `apps/frontend/lib/services/po-line-service.ts`
- `apps/frontend/lib/services/transfer-order-service.ts`
- `apps/frontend/lib/services/work-order-service.ts`

**API routes:**
- `apps/frontend/app/api/planning/suppliers/route.ts`
- `apps/frontend/app/api/planning/purchase-orders/route.ts`
- `apps/frontend/app/api/planning/transfer-orders/route.ts`

---

## 13. Key Business Rules

### PO Number Generation

```typescript
async function generatePONumber(orgId: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const prefix = `PO-${currentYear}-`

  // Find highest number for current year
  const { data } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('org_id', orgId)
    .like('po_number', `${prefix}%`)
    .order('po_number', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].po_number.split('-')[2], 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
  // Result: PO-2024-0001
}
```

### TO Status Calculation

```typescript
function calculateToStatus(lines: ToLine[]): string {
  if (!lines || lines.length === 0) return 'draft'

  const allFullyShipped = lines.every(l => l.shipped_qty >= l.quantity)
  const someShipped = lines.some(l => l.shipped_qty > 0)
  const allFullyReceived = lines.every(l => l.received_qty >= l.shipped_qty)
  const someReceived = lines.some(l => l.received_qty > 0)

  if (allFullyReceived) return 'received'
  if (someReceived) return 'partially_received'
  if (allFullyShipped) return 'shipped'
  if (someShipped) return 'partially_shipped'

  return 'planned'
}
```

### PO Approval Logic

```
IF po_require_approval = false:
  → PO can be submitted directly to approved

IF po_require_approval = true:
  IF po.total >= po_approval_threshold:
    → Manager approval required
  ELSE:
    → Auto-approve or submit
```

### Data Inheritance Chain

```
Supplier
  → PO Header: currency, payment_terms
    → PO Line: tax_code (for calculation)

Product
  → PO Line: uom, description, default_price
  → TO Line: uom
  → WO: uom
```
