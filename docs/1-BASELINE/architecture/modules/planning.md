# Planning Module Architecture

## Overview

The Planning Module is the operational backbone of MonoPilot MES, responsible for procurement, production scheduling, inventory transfers, and demand planning. It bridges the gap between what needs to be produced (demand) and what resources are available (supply).

**Module Purpose:**
- Supplier master data management
- Purchase Order (PO) lifecycle with approval workflow
- Transfer Order (TO) management for inter-warehouse movements
- Work Order (WO) creation with BOM snapshots
- Material availability checking and reservations
- Demand forecasting and MRP (Phase 2)

**Key Entities:**
- Suppliers and Supplier-Product assignments
- Purchase Orders (PO) and PO Lines
- Transfer Orders (TO) and TO Lines
- Work Orders (WO) with Materials and Operations

---

## Database Schema

### Core Tables

#### suppliers
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
code                TEXT NOT NULL
name                TEXT NOT NULL
address             TEXT
city                TEXT
postal_code         TEXT
country             TEXT                    -- ISO 3166-1 alpha-2
contact_name        TEXT
contact_email       TEXT
contact_phone       TEXT
currency            TEXT DEFAULT 'PLN'      -- PLN, EUR, USD, GBP
tax_code_id         UUID REFERENCES tax_codes(id)
payment_terms       TEXT                    -- Net 30, 2/10 Net 30
lead_time_days      INTEGER DEFAULT 7
moq                 DECIMAL(15,4)           -- Minimum Order Quantity
notes               TEXT
is_active           BOOLEAN DEFAULT true
approved_supplier   BOOLEAN DEFAULT false   -- Phase 3: ASL
supplier_rating     DECIMAL(3,2)            -- Phase 3: 1-5 score
last_audit_date     DATE                    -- Phase 3
next_audit_due      DATE                    -- Phase 3
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
updated_by          UUID REFERENCES users(id)

UNIQUE(org_id, code)
```

#### supplier_products
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
product_id          UUID NOT NULL REFERENCES products(id)
is_default          BOOLEAN DEFAULT false
supplier_product_code TEXT                  -- Supplier's SKU
lead_time_days      INTEGER                 -- Override supplier default
unit_price          DECIMAL(15,4)
currency            TEXT
moq                 DECIMAL(15,4)           -- Override supplier default
order_multiple      DECIMAL(15,4)           -- Must order in multiples
last_purchase_date  DATE
last_purchase_price DECIMAL(15,4)
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(supplier_id, product_id)
```

#### purchase_orders
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
po_number           TEXT NOT NULL           -- Auto: PO-YYYY-NNNNN
supplier_id         UUID NOT NULL REFERENCES suppliers(id)
currency            TEXT NOT NULL
tax_code_id         UUID REFERENCES tax_codes(id)
expected_delivery_date DATE NOT NULL
warehouse_id        UUID NOT NULL REFERENCES warehouses(id)
status              TEXT DEFAULT 'draft'    -- Configurable lifecycle
payment_terms       TEXT
shipping_method     TEXT
notes               TEXT
internal_notes      TEXT
approval_status     TEXT                    -- pending, approved, rejected
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMPTZ
approval_notes      TEXT
subtotal            DECIMAL(15,4)           -- Calculated
tax_amount          DECIMAL(15,4)           -- Calculated
total               DECIMAL(15,4)           -- Calculated
discount_total      DECIMAL(15,4)           -- Calculated
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
updated_by          UUID REFERENCES users(id)

UNIQUE(org_id, po_number)
```

#### purchase_order_lines
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
po_id               UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE
line_number         INTEGER NOT NULL
product_id          UUID NOT NULL REFERENCES products(id)
quantity            DECIMAL(15,4) NOT NULL
uom                 TEXT NOT NULL
unit_price          DECIMAL(15,4) NOT NULL
discount_percent    DECIMAL(5,2) DEFAULT 0
discount_amount     DECIMAL(15,4)           -- Calculated
line_total          DECIMAL(15,4)           -- Calculated
expected_delivery_date DATE
confirmed_delivery_date DATE
received_qty        DECIMAL(15,4) DEFAULT 0
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(po_id, line_number)
```

#### transfer_orders
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
to_number           TEXT NOT NULL           -- Auto: TO-YYYY-NNNNN
from_warehouse_id   UUID NOT NULL REFERENCES warehouses(id)
to_warehouse_id     UUID NOT NULL REFERENCES warehouses(id)
planned_ship_date   DATE NOT NULL
planned_receive_date DATE NOT NULL
actual_ship_date    DATE
actual_receive_date DATE
status              TEXT DEFAULT 'draft'
priority            TEXT DEFAULT 'normal'   -- low, normal, high, urgent
notes               TEXT
shipped_by          UUID REFERENCES users(id)
received_by         UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, to_number)
```

#### transfer_order_lines
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
to_id               UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE
line_number         INTEGER NOT NULL
product_id          UUID NOT NULL REFERENCES products(id)
quantity            DECIMAL(15,4) NOT NULL
uom                 TEXT NOT NULL
shipped_qty         DECIMAL(15,4) DEFAULT 0
received_qty        DECIMAL(15,4) DEFAULT 0
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(to_id, line_number)
```

#### to_line_lps
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
to_line_id          UUID NOT NULL REFERENCES transfer_order_lines(id) ON DELETE CASCADE
lp_id               UUID NOT NULL REFERENCES license_plates(id)
quantity            DECIMAL(15,4) NOT NULL
created_at          TIMESTAMPTZ DEFAULT now()
```

#### work_orders
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
wo_number           TEXT NOT NULL           -- Auto: WO-YYYYMMDD-NNNN
product_id          UUID NOT NULL REFERENCES products(id)
bom_id              UUID REFERENCES boms(id)
routing_id          UUID REFERENCES routings(id)
planned_quantity    DECIMAL(15,4) NOT NULL
produced_quantity   DECIMAL(15,4) DEFAULT 0
uom                 TEXT NOT NULL
status              TEXT DEFAULT 'draft'
planned_start_date  DATE
planned_end_date    DATE
scheduled_start_time TIME
scheduled_end_time  TIME
production_line_id  UUID REFERENCES production_lines(id)
machine_id          UUID REFERENCES machines(id)
priority            TEXT DEFAULT 'normal'   -- low, normal, high, critical
source_of_demand    TEXT                    -- manual, po, customer_order, forecast
source_reference    TEXT                    -- PO-001, ORD-123
expiry_date         DATE                    -- WO expiry (auto-close)
notes               TEXT
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
paused_at           TIMESTAMPTZ
pause_reason        TEXT
actual_qty          DECIMAL(15,4)
yield_percent       DECIMAL(5,2)            -- Calculated
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, wo_number)
```

#### wo_materials
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
wo_id               UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE
organization_id     UUID NOT NULL REFERENCES organizations(id)
product_id          UUID NOT NULL REFERENCES products(id)
material_name       TEXT NOT NULL
required_qty        DECIMAL(15,6) NOT NULL  -- Scaled from BOM
consumed_qty        DECIMAL(15,6) DEFAULT 0
reserved_qty        DECIMAL(15,6) DEFAULT 0
uom                 TEXT NOT NULL
sequence            INTEGER DEFAULT 0
consume_whole_lp    BOOLEAN DEFAULT false
is_by_product       BOOLEAN DEFAULT false
yield_percent       DECIMAL(5,2)
scrap_percent       DECIMAL(5,2) DEFAULT 0
condition_flags     JSONB
bom_item_id         UUID                    -- Reference to source
bom_version         INTEGER                 -- Snapshot version
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

#### wo_operations
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
wo_id               UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE
organization_id     UUID NOT NULL REFERENCES organizations(id)
sequence            INTEGER NOT NULL
operation_name      TEXT NOT NULL
machine_id          UUID REFERENCES machines(id)
line_id             UUID REFERENCES production_lines(id)
expected_duration_minutes INTEGER
expected_yield_percent DECIMAL(5,2)
actual_duration_minutes INTEGER
actual_yield_percent DECIMAL(5,2)
status              TEXT DEFAULT 'pending'  -- pending, in_progress, completed
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
started_by          UUID REFERENCES users(id)
completed_by        UUID REFERENCES users(id)
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(wo_id, sequence)
```

#### wo_pauses
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
wo_id               UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE
reason              TEXT NOT NULL           -- machine_breakdown, material_shortage, etc.
notes               TEXT
paused_at           TIMESTAMPTZ NOT NULL
resumed_at          TIMESTAMPTZ
duration_minutes    INTEGER                 -- Calculated on resume
paused_by           UUID REFERENCES users(id)
resumed_by          UUID REFERENCES users(id)
```

### Settings Tables

#### planning_settings
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id) UNIQUE

-- PO Settings
po_require_approval         BOOLEAN DEFAULT false
po_approval_threshold       DECIMAL(15,4)
po_approval_roles           TEXT[]
po_auto_number_prefix       TEXT DEFAULT 'PO-'
po_auto_number_format       TEXT DEFAULT 'YYYY-NNNNN'

-- TO Settings
to_allow_partial_shipments  BOOLEAN DEFAULT true
to_require_lp_selection     BOOLEAN DEFAULT false
to_auto_number_prefix       TEXT DEFAULT 'TO-'

-- WO Settings
wo_auto_select_bom          BOOLEAN DEFAULT true
wo_copy_routing             BOOLEAN DEFAULT true
wo_material_check           BOOLEAN DEFAULT true
wo_require_bom              BOOLEAN DEFAULT true
wo_allow_overproduction     BOOLEAN DEFAULT false
wo_overproduction_limit     DECIMAL(5,2) DEFAULT 10
wo_auto_number_prefix       TEXT DEFAULT 'WO-'

created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_suppliers_org_active ON suppliers(org_id, is_active);
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_po_org_status ON purchase_orders(org_id, status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_po_lines_po ON purchase_order_lines(po_id);
CREATE INDEX idx_to_org_status ON transfer_orders(org_id, status);
CREATE INDEX idx_to_ship_date ON transfer_orders(planned_ship_date);
CREATE INDEX idx_wo_org_status ON work_orders(org_id, status);
CREATE INDEX idx_wo_product ON work_orders(product_id);
CREATE INDEX idx_wo_scheduled ON work_orders(planned_start_date);
CREATE INDEX idx_wo_line ON work_orders(production_line_id);
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
```

---

## API Design

### Suppliers Endpoints
```
GET    /api/planning/suppliers                -- List suppliers
GET    /api/planning/suppliers/:id            -- Get supplier detail
POST   /api/planning/suppliers                -- Create supplier
PUT    /api/planning/suppliers/:id            -- Update supplier
DELETE /api/planning/suppliers/:id            -- Deactivate supplier

GET    /api/planning/suppliers/:id/products   -- Supplier's products
POST   /api/planning/suppliers/:id/products   -- Assign product to supplier
PUT    /api/planning/suppliers/:id/products/:productId
DELETE /api/planning/suppliers/:id/products/:productId
```

### Purchase Orders Endpoints
```
GET    /api/planning/purchase-orders          -- List POs with filters
GET    /api/planning/purchase-orders/:id      -- Get PO detail with lines
POST   /api/planning/purchase-orders          -- Create PO
PUT    /api/planning/purchase-orders/:id      -- Update PO
DELETE /api/planning/purchase-orders/:id      -- Cancel PO

POST   /api/planning/purchase-orders/:id/lines        -- Add line
PUT    /api/planning/purchase-orders/:id/lines/:lineId
DELETE /api/planning/purchase-orders/:id/lines/:lineId

POST   /api/planning/purchase-orders/:id/submit       -- Submit for approval
POST   /api/planning/purchase-orders/:id/approve      -- Approve
POST   /api/planning/purchase-orders/:id/reject       -- Reject
POST   /api/planning/purchase-orders/:id/confirm      -- Confirm (send to supplier)
POST   /api/planning/purchase-orders/:id/cancel       -- Cancel

POST   /api/planning/purchase-orders/bulk             -- Bulk create (auto-group by supplier)
POST   /api/planning/purchase-orders/import           -- Import from Excel
```

### Transfer Orders Endpoints
```
GET    /api/planning/transfer-orders          -- List TOs
GET    /api/planning/transfer-orders/:id      -- Get TO detail with lines
POST   /api/planning/transfer-orders          -- Create TO
PUT    /api/planning/transfer-orders/:id      -- Update TO
DELETE /api/planning/transfer-orders/:id      -- Cancel TO

POST   /api/planning/transfer-orders/:id/lines        -- Add line
PUT    /api/planning/transfer-orders/:id/lines/:lineId
DELETE /api/planning/transfer-orders/:id/lines/:lineId

POST   /api/planning/transfer-orders/:id/release      -- Release for shipping
POST   /api/planning/transfer-orders/:id/ship         -- Mark shipped
POST   /api/planning/transfer-orders/:id/receive      -- Mark received
POST   /api/planning/transfer-orders/:id/cancel       -- Cancel

POST   /api/planning/transfer-orders/:id/lines/:lineId/lps  -- Assign LPs
```

### Work Orders Endpoints
```
GET    /api/planning/work-orders              -- List WOs with filters
GET    /api/planning/work-orders/:id          -- Get WO detail
POST   /api/planning/work-orders              -- Create WO (+ BOM snapshot)
PUT    /api/planning/work-orders/:id          -- Update WO
DELETE /api/planning/work-orders/:id          -- Cancel WO

GET    /api/planning/work-orders/:id/materials       -- Get materials list
GET    /api/planning/work-orders/:id/operations      -- Get operations list
GET    /api/planning/work-orders/:id/availability    -- Check material availability

POST   /api/planning/work-orders/:id/release         -- Release for production
POST   /api/planning/work-orders/:id/cancel          -- Cancel WO

GET    /api/planning/work-orders/gantt               -- Gantt chart data
GET    /api/planning/work-orders/schedule            -- Schedule by line/date
```

### Dashboard Endpoints
```
GET    /api/planning/dashboard                -- KPIs and alerts
GET    /api/planning/dashboard/po-pending     -- POs pending approval
GET    /api/planning/dashboard/wo-scheduled   -- WOs scheduled today
GET    /api/planning/dashboard/alerts         -- All alerts
```

### Settings Endpoints
```
GET    /api/planning/settings
PUT    /api/planning/settings
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/planning/
├── page.tsx                    -- Planning dashboard
├── suppliers/
│   ├── page.tsx               -- Supplier list
│   ├── [id]/page.tsx          -- Supplier detail with products
│   └── components/
│       ├── SupplierTable.tsx
│       ├── SupplierForm.tsx
│       └── SupplierProductsTable.tsx
├── purchase-orders/
│   ├── page.tsx               -- PO list with fast flow
│   ├── [id]/page.tsx          -- PO detail with lines
│   └── components/
│       ├── POTable.tsx
│       ├── POFastFlow.tsx
│       ├── POForm.tsx
│       ├── POLinesTable.tsx
│       ├── POApprovalModal.tsx
│       └── POBulkImport.tsx
├── transfer-orders/
│   ├── page.tsx               -- TO list
│   ├── [id]/page.tsx          -- TO detail with lines
│   └── components/
│       ├── TOTable.tsx
│       ├── TOForm.tsx
│       ├── TOLinesTable.tsx
│       └── TOLPSelector.tsx
├── work-orders/
│   ├── page.tsx               -- WO list + spreadsheet view
│   ├── [id]/page.tsx          -- WO detail with materials/ops
│   ├── gantt/page.tsx         -- Gantt chart view
│   └── components/
│       ├── WOTable.tsx
│       ├── WOSpreadsheet.tsx
│       ├── WOForm.tsx
│       ├── WOMaterialsTable.tsx
│       ├── WOOperationsTimeline.tsx
│       ├── WOAvailabilityPanel.tsx
│       └── WOGanttChart.tsx
└── components/
    ├── PlanningStatsCards.tsx
    ├── PlanningAlerts.tsx
    └── QuickActions.tsx
```

### Service Dependencies

```
lib/services/
├── supplier-service.ts        -- Supplier CRUD + products
├── purchase-order-service.ts  -- PO CRUD + lines + approval
├── transfer-order-service.ts  -- TO CRUD + lines + LP selection
├── work-order-service.ts      -- WO CRUD + BOM snapshot + operations
├── planning-settings-service.ts
└── planning-dashboard-service.ts
```

---

## Data Flow

### PO Approval Workflow
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   PO API       | --> | purchase_orders|
|   Submit    |     |   /submit      |     | status='submitted'
+-------------+     +----------------+     +----------------+
      |                    |
      |     If po_require_approval=true
      |     AND total > po_approval_threshold
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|             |     |   Notify       | --> |   SendGrid     |
|             |     |   Approvers    |     |   (Email)      |
+-------------+     +----------------+     +----------------+
                           |
                           v
                    +----------------+
                    | status=        |
                    | 'pending_      |
                    |  approval'     |
                    +----------------+
```

### WO Creation with BOM Snapshot
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   WO API       | --> |   BOM Service  |
|   Create WO |     |   /work-orders |     |  getActiveBOM  |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |                    v                      v
      |             +----------------+     +----------------+
      |             |   work_orders  |     |   boms table   |
      |             |   record       |     |   (selected)   |
      |             +----------------+     +----------------+
      |                    |
      |                    v
      |             +----------------+     +----------------+
      |             |   Copy BOM     | --> |   wo_materials |
      |             |   Items        |     |   (scaled qty) |
      |             +----------------+     +----------------+
      |                    |
      |                    v
      |             +----------------+     +----------------+
      |             |   Copy Routing | --> |   wo_operations|
      |             |   Operations   |     |   (sequence)   |
      |             +----------------+     +----------------+
```

### Material Availability Check
```
+-------------+     +----------------+     +----------------+
|   WO Form   | --> |   Availability | --> | license_plates |
|   (Product  |     |   Check        |     |   (inventory)  |
|    + Qty)   |     +----------------+     +----------------+
+-------------+           |
      |                   v
      |            For each material in BOM:
      |            - Sum available LP qty
      |            - Compare to required qty
      |            - Calculate coverage %
      |                   |
      v                   v
+-------------+     +----------------+
|   Color     |     |   Availability |
|   Indicator |     |   Panel        |
|   (G/Y/R)   |     |   (Details)    |
+-------------+     +----------------+
```

---

## Security

### RLS Policies

```sql
-- Suppliers: org_id filter
CREATE POLICY "Suppliers org isolation"
ON suppliers FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Purchase Orders: org_id filter
CREATE POLICY "POs org isolation"
ON purchase_orders FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Transfer Orders: org_id filter
CREATE POLICY "TOs org isolation"
ON transfer_orders FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Work Orders: org_id filter
CREATE POLICY "WOs org isolation"
ON work_orders FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /suppliers | Any authenticated |
| POST /suppliers | Admin, Planner |
| GET /purchase-orders | Any authenticated |
| POST /purchase-orders | Admin, Planner |
| POST /purchase-orders/:id/approve | Admin, Manager (based on setting) |
| * /transfer-orders | Admin, Planner, Warehouse Manager |
| GET /work-orders | Any authenticated |
| POST /work-orders | Admin, Planner, Production Manager |
| POST /work-orders/:id/release | Admin, Planner, Production Manager |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Suppliers per org | 50-200 | 2,000 |
| Supplier-products | 500-2,000 | 50,000 |
| POs per month | 50-200 | 5,000 |
| PO lines per PO | 5-20 | 200 |
| TOs per month | 20-100 | 2,000 |
| WOs per month | 100-500 | 10,000 |
| WO materials per WO | 5-30 | 200 |

### Query Optimization

1. **PO List:**
   - Index on (org_id, status, expected_delivery_date)
   - Paginate with limit 50
   - Filter by status, supplier, date range

2. **WO Schedule Query:**
   - Index on (org_id, planned_start_date, production_line_id)
   - Cache Gantt data (1 min TTL)
   - Date range limited to 30 days

3. **Material Availability:**
   - Join wo_materials with license_plates
   - Group by product_id
   - Cache result (30 sec TTL)

4. **Bulk PO Creation:**
   - Transaction for all POs
   - Batch insert lines
   - Return all created POs in single response

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:po:pending-approval'      // 1 min TTL
'org:{orgId}:wo:scheduled:{date}'      // 1 min TTL
'org:{orgId}:wo:{woId}:availability'   // 30 sec TTL
'org:{orgId}:gantt:{lineId}:{range}'   // 1 min TTL
```

---

## Integration Points

### Module Dependencies

```
Planning Module
    |
    +---> Settings (warehouses, lines, machines, tax codes)
    +---> Technical (products, BOMs, routings)
    |
    +---> Production (WO execution)
    +---> Warehouse (PO receiving, TO shipping/receiving, LP inventory)
    +---> Quality (supplier quality - Phase 3)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `po.submitted` | PO submitted | Notification service |
| `po.approved` | PO approved | Notification service |
| `po.confirmed` | PO confirmed | Supplier notification (future) |
| `to.released` | TO released | Warehouse module |
| `wo.created` | WO created | Production module |
| `wo.released` | WO released | Production, Warehouse (reservations) |

### Data Dependencies

| Downstream | Data Provided |
|------------|---------------|
| Production | Work Orders for execution |
| Warehouse | PO for receiving, TO for ship/receive |
| Quality | Supplier data for inspections |
| Finance | PO data for invoice matching |

---

## Business Rules

### Purchase Orders
- PO number auto-generated: PO-YYYY-NNNNN
- Supplier defaults (currency, tax, payment terms) cascade to PO
- Line prices default from supplier-product assignment
- Status lifecycle: draft -> submitted -> [pending_approval] -> confirmed -> receiving -> closed
- Over-receipt controlled by warehouse settings

### Transfer Orders
- TO number auto-generated: TO-YYYY-NNNNN
- From/To warehouse must be different
- LP pre-selection optional (controlled by setting)
- Partial shipments allowed (controlled by setting)
- Status: draft -> planned -> [partially_]shipped -> [partially_]received -> closed

### Work Orders
- WO number auto-generated: WO-YYYYMMDD-NNNN (daily reset)
- BOM auto-selected based on scheduled date and effective dates
- Materials scaled: wo_qty / bom_output_qty * item_qty
- Routing operations copied as wo_operations
- Material availability check is warning only (doesn't block creation)
- Status: draft -> planned -> released -> [Production module handles execution]

---

## Testing Requirements

### Unit Tests (80%+ coverage)
- Supplier service: CRUD, product assignments
- PO service: CRUD, line management, totals calculation, approval flow
- TO service: CRUD, LP selection, status transitions
- WO service: CRUD, BOM snapshot, material scaling, availability check

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- PO approval workflow
- WO BOM/routing snapshot

### E2E Tests
- PO creation -> approval -> confirmation
- Bulk PO import
- TO creation -> ship -> receive
- WO creation with BOM selection
- Material availability display
