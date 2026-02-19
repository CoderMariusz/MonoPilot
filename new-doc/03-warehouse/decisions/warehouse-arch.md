# Warehouse Module Architecture

## Overview

The Warehouse Module manages physical inventory through License Plates (LP) - the atomic tracking unit for full traceability. It supports goods receipt (ASN/GRN), stock movements, FIFO/FEFO picking, catch weight handling, GS1 barcode compliance, and mobile scanner workflows.

**Module Purpose:**
- License Plate (LP) lifecycle management
- Goods Receipt Notes (GRN) from PO/TO/Production
- Advanced Shipping Notices (ASN) for pre-notification
- Stock movements (transfers, adjustments, putaway)
- Pallet management with SSCC-18 codes
- FIFO/FEFO enforcement for picking
- Mobile scanner workflows for all warehouse operations
- Inventory reporting and cycle counts

**Key Entities:**
- License Plates (LP) - atomic inventory unit
- ASN/GRN for receiving
- Stock Moves for transfers
- Pallets for grouping LPs
- LP Genealogy for traceability

---

## Database Schema

### Core Tables

#### license_plates
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
lp_number           TEXT NOT NULL           -- Auto or manual, unique
product_id          UUID NOT NULL REFERENCES products(id)
quantity            DECIMAL(15,4) NOT NULL
uom                 TEXT NOT NULL
location_id         UUID NOT NULL REFERENCES locations(id)
warehouse_id        UUID NOT NULL REFERENCES warehouses(id)
status              TEXT NOT NULL DEFAULT 'available'  -- available, reserved, consumed, blocked
qa_status           TEXT NOT NULL DEFAULT 'pending'    -- pending, passed, failed, quarantine
batch_number        TEXT
supplier_batch_number TEXT
expiry_date         DATE
manufacture_date    DATE
gtin                TEXT                    -- GS1 GTIN-14
catch_weight_kg     DECIMAL(10,3)           -- Variable weight
po_number           TEXT
grn_id              UUID REFERENCES grns(id)
wo_id               UUID REFERENCES work_orders(id)
parent_lp_id        UUID REFERENCES license_plates(id)  -- For split/merge
consumed_by_wo_id   UUID REFERENCES work_orders(id)
pallet_id           UUID REFERENCES pallets(id)
source              TEXT NOT NULL           -- receipt, production, return, adjustment
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
updated_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, lp_number)
```

#### asns
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
asn_number          TEXT NOT NULL
po_id               UUID NOT NULL REFERENCES purchase_orders(id)
supplier_id         UUID NOT NULL REFERENCES suppliers(id)
expected_date       DATE NOT NULL
actual_date         DATE
carrier             TEXT
tracking_number     TEXT
status              TEXT NOT NULL DEFAULT 'pending'  -- pending, received, partial, cancelled
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, asn_number)
```

#### asn_items
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
asn_id              UUID NOT NULL REFERENCES asns(id) ON DELETE CASCADE
product_id          UUID NOT NULL REFERENCES products(id)
po_line_id          UUID REFERENCES purchase_order_lines(id)
expected_qty        DECIMAL(15,4) NOT NULL
received_qty        DECIMAL(15,4) DEFAULT 0
uom                 TEXT NOT NULL
supplier_lp_number  TEXT
supplier_batch_number TEXT
gtin                TEXT
expiry_date         DATE
```

#### grns
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
grn_number          TEXT NOT NULL           -- Auto: GRN-YYYY-NNNNN
source_type         TEXT NOT NULL           -- po, to, return, adjustment
po_id               UUID REFERENCES purchase_orders(id)
to_id               UUID REFERENCES transfer_orders(id)
asn_id              UUID REFERENCES asns(id)
supplier_id         UUID REFERENCES suppliers(id)
receipt_date        TIMESTAMPTZ NOT NULL DEFAULT now()
warehouse_id        UUID NOT NULL REFERENCES warehouses(id)
location_id         UUID NOT NULL REFERENCES locations(id)
status              TEXT NOT NULL DEFAULT 'draft'  -- draft, completed, cancelled
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
received_by         UUID REFERENCES users(id)

UNIQUE(org_id, grn_number)
```

#### grn_items
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
grn_id              UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE
product_id          UUID NOT NULL REFERENCES products(id)
po_line_id          UUID REFERENCES purchase_order_lines(id)
to_line_id          UUID REFERENCES transfer_order_lines(id)
ordered_qty         DECIMAL(15,4) NOT NULL
received_qty        DECIMAL(15,4) NOT NULL
uom                 TEXT NOT NULL
lp_id               UUID REFERENCES license_plates(id)  -- Created LP
batch_number        TEXT
supplier_batch_number TEXT
gtin                TEXT
catch_weight_kg     DECIMAL(10,3)
expiry_date         DATE
manufacture_date    DATE
location_id         UUID NOT NULL REFERENCES locations(id)
qa_status           TEXT NOT NULL DEFAULT 'pending'
notes               TEXT
```

#### stock_moves
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
move_number         TEXT NOT NULL           -- Auto: SM-YYYY-NNNNN
lp_id               UUID NOT NULL REFERENCES license_plates(id)
move_type           TEXT NOT NULL           -- transfer, issue, receipt, adjustment, return, quarantine, putaway
from_location_id    UUID REFERENCES locations(id)
to_location_id      UUID REFERENCES locations(id)
quantity            DECIMAL(15,4) NOT NULL
move_date           TIMESTAMPTZ NOT NULL DEFAULT now()
status              TEXT NOT NULL DEFAULT 'completed'  -- completed, cancelled
reason              TEXT
reason_code         TEXT                    -- For adjustments
wo_id               UUID REFERENCES work_orders(id)
reference_type      TEXT                    -- grn, to, wo, adjustment
reference_id        UUID
moved_by            UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, move_number)
```

#### lp_genealogy
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
parent_lp_id        UUID NOT NULL REFERENCES license_plates(id)
child_lp_id         UUID NOT NULL REFERENCES license_plates(id)
operation_type      TEXT NOT NULL           -- split, merge, consume, output
quantity            DECIMAL(15,4) NOT NULL
operation_date      TIMESTAMPTZ NOT NULL DEFAULT now()
wo_id               UUID REFERENCES work_orders(id)
operation_id        UUID                    -- Reference to wo_operations
is_reversed         BOOLEAN DEFAULT false
```

#### lp_reservations
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
lp_id               UUID NOT NULL REFERENCES license_plates(id)
wo_id               UUID REFERENCES work_orders(id)
to_id               UUID REFERENCES transfer_orders(id)
reserved_qty        DECIMAL(15,4) NOT NULL
status              TEXT NOT NULL DEFAULT 'active'  -- active, released, consumed
reserved_at         TIMESTAMPTZ NOT NULL DEFAULT now()
released_at         TIMESTAMPTZ
reserved_by         UUID REFERENCES users(id)
```

### Pallet Tables

#### pallets
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
pallet_number       TEXT NOT NULL           -- SSCC-18 or internal
pallet_type         TEXT DEFAULT 'standard' -- EUR, standard, custom
location_id         UUID NOT NULL REFERENCES locations(id)
status              TEXT NOT NULL DEFAULT 'open'  -- open, closed, shipped
sscc                TEXT                    -- GS1 SSCC-18
weight_kg           DECIMAL(10,2)           -- Total weight
lp_count            INTEGER DEFAULT 0
created_date        TIMESTAMPTZ NOT NULL DEFAULT now()
closed_date         TIMESTAMPTZ
shipped_date        TIMESTAMPTZ
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, pallet_number)
```

#### pallet_items
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
pallet_id           UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE
lp_id               UUID NOT NULL REFERENCES license_plates(id)
added_date          TIMESTAMPTZ NOT NULL DEFAULT now()
sequence            INTEGER
```

### Cycle Count Tables

#### cycle_counts
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
count_number        TEXT NOT NULL
warehouse_id        UUID NOT NULL REFERENCES warehouses(id)
zone_id             UUID REFERENCES locations(id)  -- Optional zone filter
count_type          TEXT NOT NULL           -- full, partial, cycle
status              TEXT NOT NULL DEFAULT 'planned'  -- planned, in_progress, completed, cancelled
scheduled_date      DATE
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
counted_by          UUID REFERENCES users(id)
approved_by         UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, count_number)
```

#### cycle_count_items
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
count_id            UUID NOT NULL REFERENCES cycle_counts(id) ON DELETE CASCADE
lp_id               UUID REFERENCES license_plates(id)
product_id          UUID NOT NULL REFERENCES products(id)
location_id         UUID NOT NULL REFERENCES locations(id)
expected_qty        DECIMAL(15,4) NOT NULL
counted_qty         DECIMAL(15,4)
variance            DECIMAL(15,4)           -- counted - expected
variance_percent    DECIMAL(5,2)
status              TEXT DEFAULT 'pending'  -- pending, counted, discrepancy, approved
notes               TEXT
counted_at          TIMESTAMPTZ
counted_by          UUID REFERENCES users(id)
```

### Settings Table

#### warehouse_settings
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id) UNIQUE

-- LP Settings
auto_generate_lp_number     BOOLEAN DEFAULT true
lp_number_prefix            TEXT DEFAULT 'LP'
lp_number_sequence_length   INTEGER DEFAULT 8

-- ASN/GRN Settings
enable_asn                  BOOLEAN DEFAULT false
require_qa_on_receipt       BOOLEAN DEFAULT true
default_qa_status           TEXT DEFAULT 'pending'
allow_over_receipt          BOOLEAN DEFAULT false
over_receipt_tolerance_pct  DECIMAL(5,2) DEFAULT 0

-- Tracking Settings
enable_batch_tracking       BOOLEAN DEFAULT true
require_batch_on_receipt    BOOLEAN DEFAULT false
enable_supplier_batch       BOOLEAN DEFAULT true
enable_expiry_tracking      BOOLEAN DEFAULT true
require_expiry_on_receipt   BOOLEAN DEFAULT false
expiry_warning_days         INTEGER DEFAULT 30

-- Location Settings
enable_location_zones       BOOLEAN DEFAULT false
enable_location_capacity    BOOLEAN DEFAULT false
enable_transit_location     BOOLEAN DEFAULT true

-- FIFO/FEFO Settings
enable_fifo                 BOOLEAN DEFAULT true
enable_fefo                 BOOLEAN DEFAULT false

-- Features
enable_pallets              BOOLEAN DEFAULT false
enable_split_merge          BOOLEAN DEFAULT true
enable_gs1_barcodes         BOOLEAN DEFAULT false
enable_catch_weight         BOOLEAN DEFAULT false

-- Scanner Settings
scanner_idle_timeout_sec    INTEGER DEFAULT 300
scanner_sound_feedback      BOOLEAN DEFAULT true
print_label_on_receipt      BOOLEAN DEFAULT true
label_copies_default        INTEGER DEFAULT 1

created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_lp_org_number ON license_plates(org_id, lp_number);
CREATE INDEX idx_lp_org_status ON license_plates(org_id, status);
CREATE INDEX idx_lp_product ON license_plates(product_id);
CREATE INDEX idx_lp_location ON license_plates(location_id);
CREATE INDEX idx_lp_warehouse ON license_plates(warehouse_id);
CREATE INDEX idx_lp_expiry ON license_plates(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_lp_batch ON license_plates(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_lp_pallet ON license_plates(pallet_id) WHERE pallet_id IS NOT NULL;

CREATE INDEX idx_grn_org_status ON grns(org_id, status);
CREATE INDEX idx_grn_po ON grns(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX idx_grn_to ON grns(to_id) WHERE to_id IS NOT NULL;

CREATE INDEX idx_stock_moves_lp ON stock_moves(lp_id);
CREATE INDEX idx_stock_moves_date ON stock_moves(move_date);
CREATE INDEX idx_stock_moves_type ON stock_moves(org_id, move_type);

CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(wo_id) WHERE wo_id IS NOT NULL;

CREATE INDEX idx_pallets_org_status ON pallets(org_id, status);
CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);
```

---

## API Design

### License Plates Endpoints
```
GET    /api/warehouse/license-plates                    -- List with filters
GET    /api/warehouse/license-plates/:id                -- LP detail
POST   /api/warehouse/license-plates                    -- Create LP (usually via GRN)
PUT    /api/warehouse/license-plates/:id                -- Update LP (limited fields)
POST   /api/warehouse/license-plates/:id/split          -- Split LP
POST   /api/warehouse/license-plates/merge              -- Merge LPs
PUT    /api/warehouse/license-plates/:id/block          -- Block LP
PUT    /api/warehouse/license-plates/:id/unblock        -- Unblock LP
PUT    /api/warehouse/license-plates/:id/qa-status      -- Update QA status
GET    /api/warehouse/license-plates/:id/genealogy      -- Genealogy tree
GET    /api/warehouse/license-plates/:id/history        -- Movement history
POST   /api/warehouse/license-plates/:id/print-label    -- Print ZPL label
```

### ASN Endpoints
```
GET    /api/warehouse/asns                              -- List ASNs
GET    /api/warehouse/asns/:id                          -- ASN detail
POST   /api/warehouse/asns                              -- Create ASN
PUT    /api/warehouse/asns/:id                          -- Update ASN
DELETE /api/warehouse/asns/:id                          -- Cancel ASN
POST   /api/warehouse/asns/:id/receive                  -- Start receiving
```

### GRN Endpoints
```
GET    /api/warehouse/grns                              -- List GRNs
GET    /api/warehouse/grns/:id                          -- GRN detail
POST   /api/warehouse/grns                              -- Create GRN + LPs
PUT    /api/warehouse/grns/:id                          -- Update GRN (draft)
POST   /api/warehouse/grns/:id/complete                 -- Complete GRN
POST   /api/warehouse/grns/:id/cancel                   -- Cancel GRN
POST   /api/warehouse/grns/:id/print                    -- Print GRN
```

### Stock Moves Endpoints
```
GET    /api/warehouse/stock-moves                       -- List movements
GET    /api/warehouse/stock-moves/:id                   -- Move detail
POST   /api/warehouse/stock-moves                       -- Create movement
POST   /api/warehouse/stock-moves/:id/cancel            -- Cancel movement
```

### Pallet Endpoints
```
GET    /api/warehouse/pallets                           -- List pallets
GET    /api/warehouse/pallets/:id                       -- Pallet detail with LPs
POST   /api/warehouse/pallets                           -- Create pallet
POST   /api/warehouse/pallets/:id/add-lp                -- Add LP to pallet
POST   /api/warehouse/pallets/:id/remove-lp             -- Remove LP from pallet
POST   /api/warehouse/pallets/:id/close                 -- Close pallet
POST   /api/warehouse/pallets/:id/move                  -- Move pallet + all LPs
POST   /api/warehouse/pallets/:id/print-label           -- Print SSCC label
```

### Inventory Endpoints
```
GET    /api/warehouse/inventory                         -- Summary (by product/location)
GET    /api/warehouse/inventory/by-product              -- Group by product
GET    /api/warehouse/inventory/by-location             -- Group by location
GET    /api/warehouse/inventory/by-warehouse            -- Group by warehouse
GET    /api/warehouse/inventory/aging                   -- Aging analysis
GET    /api/warehouse/inventory/expiring                -- Expiring soon
```

### Cycle Count Endpoints
```
GET    /api/warehouse/cycle-counts                      -- List counts
GET    /api/warehouse/cycle-counts/:id                  -- Count detail
POST   /api/warehouse/cycle-counts                      -- Create count
PUT    /api/warehouse/cycle-counts/:id                  -- Update count
POST   /api/warehouse/cycle-counts/:id/start            -- Start counting
POST   /api/warehouse/cycle-counts/:id/items/:itemId/count  -- Record count
POST   /api/warehouse/cycle-counts/:id/complete         -- Complete count
POST   /api/warehouse/cycle-counts/:id/approve          -- Approve variances
```

### Scanner Endpoints
```
POST   /api/warehouse/scanner/receive                   -- Scanner receive
POST   /api/warehouse/scanner/move                      -- Scanner move
POST   /api/warehouse/scanner/putaway                   -- Scanner putaway
POST   /api/warehouse/scanner/count                     -- Scanner count
POST   /api/warehouse/scanner/validate-barcode          -- Validate any barcode
GET    /api/warehouse/scanner/lookup/lp/:barcode        -- LP lookup
GET    /api/warehouse/scanner/lookup/location/:barcode  -- Location lookup
GET    /api/warehouse/scanner/suggest-putaway/:lpId     -- Putaway suggestion
```

### Dashboard Endpoints
```
GET    /api/warehouse/dashboard                         -- KPIs
GET    /api/warehouse/dashboard/alerts                  -- Alerts (expiry, low stock)
GET    /api/warehouse/dashboard/recent-activity         -- Recent movements
```

### Settings Endpoints
```
GET    /api/warehouse/settings
PUT    /api/warehouse/settings
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/warehouse/
├── page.tsx                    -- Warehouse redirect
├── dashboard/
│   └── page.tsx               -- Warehouse dashboard
│       └── components/
│           ├── InventoryKPIs.tsx
│           ├── ExpiringAlerts.tsx
│           ├── RecentActivity.tsx
│           └── WarehouseCapacity.tsx
├── license-plates/
│   ├── page.tsx               -- LP list
│   ├── [id]/page.tsx          -- LP detail
│   └── components/
│       ├── LPTable.tsx
│       ├── LPFilters.tsx
│       ├── LPDetail.tsx
│       ├── LPSplitModal.tsx
│       ├── LPMergeModal.tsx
│       ├── LPGenealogyTree.tsx
│       └── LPMovementHistory.tsx
├── receiving/
│   ├── page.tsx               -- Receiving list (ASN/GRN)
│   ├── po/[poId]/page.tsx     -- Receive from PO
│   ├── to/[toId]/page.tsx     -- Receive from TO
│   └── components/
│       ├── ASNTable.tsx
│       ├── GRNTable.tsx
│       ├── ReceiveForm.tsx
│       ├── ReceiveLineForm.tsx
│       └── PrintLabels.tsx
├── movements/
│   ├── page.tsx               -- Stock moves list
│   └── components/
│       ├── MovementTable.tsx
│       ├── MoveForm.tsx
│       └── AdjustmentForm.tsx
├── pallets/
│   ├── page.tsx               -- Pallet list
│   ├── [id]/page.tsx          -- Pallet detail
│   └── components/
│       ├── PalletTable.tsx
│       ├── PalletDetail.tsx
│       ├── AddLPModal.tsx
│       └── PalletLabel.tsx
├── inventory/
│   ├── page.tsx               -- Inventory browser
│   ├── aging/page.tsx         -- Aging report
│   ├── expiring/page.tsx      -- Expiring report
│   └── components/
│       ├── InventoryTable.tsx
│       ├── GroupBySelector.tsx
│       ├── AgingChart.tsx
│       └── ExpiringList.tsx
├── cycle-counts/
│   ├── page.tsx               -- Cycle count list
│   ├── [id]/page.tsx          -- Count detail
│   └── components/
│       ├── CycleCountTable.tsx
│       ├── CountForm.tsx
│       ├── CountItemsTable.tsx
│       └── VarianceApproval.tsx
└── settings/
    └── page.tsx               -- Warehouse settings

apps/frontend/app/(authenticated)/scanner/
├── receive/page.tsx           -- Scanner receive
├── move/page.tsx              -- Scanner move
├── putaway/page.tsx           -- Scanner putaway
├── count/page.tsx             -- Scanner count
└── components/
    ├── BarcodeScanner.tsx
    ├── NumberPad.tsx
    ├── ScanFeedback.tsx
    ├── LocationConfirm.tsx
    └── PrintButton.tsx
```

### Service Dependencies

```
lib/services/
├── license-plate-service.ts   -- LP CRUD, split, merge, block
├── asn-service.ts             -- ASN CRUD
├── grn-service.ts             -- GRN CRUD, LP creation
├── stock-move-service.ts      -- Movement CRUD
├── pallet-service.ts          -- Pallet CRUD, LP assignment
├── inventory-service.ts       -- Inventory queries, aging, expiry
├── cycle-count-service.ts     -- Cycle count CRUD, variance
├── warehouse-dashboard-service.ts
└── warehouse-settings-service.ts
```

---

## Data Flow

### GRN from PO Flow
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   GRN API      | --> | purchase_orders|
|   Receive   |     |   /grns        |     | (validate PO)  |
|   PO        |     |                |     |                |
+-------------+     +----------------+     +----------------+
      |                    |
      |             For each receive line:
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Enter     | --> |   GRN Service  | --> |   grns +       |
|   Qty/Batch |     |   createGRN    |     |   grn_items    |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   LP Service   | --> | license_plates |
                   |   createLP     |     |   (new LP)     |
                   +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Update PO    | --> | po_lines.      |
                   |   received_qty |     | received_qty   |
                   +----------------+     +----------------+
```

### LP Split Flow
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   LP API       | --> |   Validate     |
|   Split LP  |     |   /split       |     |   split_qty <  |
|             |     |                |     |   LP.qty       |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Create new LP with split_qty
      |             Reduce source LP qty
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Two LPs   |     |   LP Service   | --> |   lp_genealogy |
|   Result    |     |   splitLP      |     |   (split link) |
+-------------+     +----------------+     +----------------+
```

### FIFO/FEFO Pick Suggestion Flow
```
+-------------+     +----------------+     +----------------+
|   WO Start  | --> |   Reservation  | --> | license_plates |
|   or        |     |   Service      |     |   (query)      |
|   Pick Task |     |                |     |                |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Query: product_id = X
      |                    AND status = 'available'
      |                    AND qa_status = 'passed'
      |                    ORDER BY:
      |                      FEFO: expiry_date ASC, created_at ASC
      |                      FIFO: created_at ASC
      |                    |
      v                    v
+-------------+     +----------------+
|   Suggested |     |   Reservation  |
|   LP List   |     |   Created      |
+-------------+     +----------------+
```

### Scanner Putaway Flow
```
+-------------+     +----------------+     +----------------+
|   Scanner   | --> |   Putaway API  | --> |   Validate LP  |
|   Scan LP   |     |   /suggest-    |     |   exists       |
|             |     |   putaway      |     |                |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Calculate optimal location:
      |             - Product zone preference
      |             - FIFO/FEFO grouping
      |             - Available capacity
      |                    |
      v                    v
+-------------+     +----------------+
|   Suggested |     |   User scans   |
|   Location  |     |   location     |
+-------------+     +----------------+
      |                    |
      |             If match: Complete putaway
      |             If different: Warning + allow override
      |                    |
      v                    v
+-------------+     +----------------+
|   Putaway   |     |   stock_moves  |
|   Complete  |     |   (putaway)    |
+-------------+     +----------------+
```

---

## Security

### RLS Policies

```sql
-- License Plates: org_id filter
CREATE POLICY "LP org isolation"
ON license_plates FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- GRNs: org_id filter
CREATE POLICY "GRN org isolation"
ON grns FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Stock Moves: org_id filter
CREATE POLICY "Stock moves org isolation"
ON stock_moves FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Pallets: org_id filter
CREATE POLICY "Pallets org isolation"
ON pallets FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /license-plates | Any authenticated |
| POST /license-plates | Warehouse Operator, Manager |
| PUT /license-plates/:id | Warehouse Operator, Manager |
| /license-plates/:id/block | Manager, Admin |
| /grns | Warehouse Operator, Manager |
| /stock-moves | Warehouse Operator, Manager |
| /cycle-counts | Warehouse Manager, Admin |
| /cycle-counts/:id/approve | Manager, Admin |
| /settings | Admin |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| LPs per warehouse | 5,000-20,000 | 100,000 |
| GRNs per month | 100-500 | 5,000 |
| Stock moves per day | 200-1,000 | 10,000 |
| Pallets (active) | 100-500 | 5,000 |
| Genealogy links | 10,000-100,000 | 10M |

### Query Optimization

1. **LP List:**
   - Composite index on (org_id, status, qa_status)
   - Filter by warehouse, location, product
   - Paginate with limit 50

2. **Inventory Summary:**
   - Group by product_id with SUM(quantity)
   - Index on (org_id, product_id, status)
   - Cache result (1 min TTL)

3. **FIFO/FEFO Query:**
   - Index on (product_id, status, qa_status, created_at)
   - Index on (product_id, status, qa_status, expiry_date)
   - Limit to top 10 suggestions

4. **Genealogy Tree:**
   - Recursive CTE with depth limit (10 levels)
   - Index on parent_lp_id, child_lp_id
   - Cache tree result (5 min TTL)

5. **Expiring Soon:**
   - Index on expiry_date WHERE status = 'available'
   - Daily batch job to flag expiring LPs

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:warehouse:dashboard'            // 1 min TTL
'org:{orgId}:inventory:summary:{warehouseId}'// 1 min TTL
'org:{orgId}:lp:{lpId}:genealogy'            // 5 min TTL
'org:{orgId}:expiring:{warehouseId}'         // 1 hour TTL
'gs1:gtin:{gtin}'                            // 24 hour TTL (product lookup)
```

---

## Integration Points

### Module Dependencies

```
Warehouse Module
    |
    +---> Settings (warehouses, locations)
    +---> Technical (products)
    +---> Planning (PO for receipt, TO for ship/receive)
    +---> Production (LP consumption, LP creation from output)
    +---> Quality (QA status management)
    +---> Shipping (picking, shipping)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `lp.created` | LP created | Audit log |
| `lp.moved` | LP moved | Stock move history |
| `lp.consumed` | LP consumed | Production genealogy |
| `lp.split` | LP split | Genealogy |
| `lp.merged` | LP merged | Genealogy |
| `lp.blocked` | LP blocked | Quality module |
| `lp.qa_changed` | QA status changed | Quality, Alerts |
| `grn.completed` | GRN completed | PO/TO update |
| `inventory.low` | Below min stock | Alerts, Planning |
| `inventory.expiring` | Expiry warning | Alerts |

### Data Dependencies

| Upstream | Data Required |
|----------|---------------|
| Planning | PO for receipt, TO for ship/receive |
| Production | WO for output LP creation |
| Technical | Products for LP creation |

| Downstream | Data Provided |
|------------|---------------|
| Production | Available LPs for consumption |
| Shipping | Available LPs for picking |
| Quality | LP QA status tracking |

---

## Business Rules

### License Plates
- LP number unique per organization
- Auto-generated: {prefix}{sequence} (e.g., LP00000001)
- Status: available -> reserved/consumed/blocked
- QA Status: pending -> passed/failed/quarantine
- Consumed LP cannot be modified (immutable)

### Receiving
- GRN creates one LP per line
- Batch required if setting enabled
- Expiry required if setting enabled
- Over-receipt blocked or allowed with tolerance
- QA status set to default (usually 'pending')

### Split/Merge
- Split: qty must be less than source LP qty
- Split creates genealogy link (split type)
- Merge: same product, batch, expiry required
- Merge: same QA status required
- Merge: merged LPs marked as consumed

### FIFO/FEFO
- FIFO: oldest created_at first
- FEFO: soonest expiry_date first (overrides FIFO)
- Warning on violation, but allow override
- Log all violations for reporting

### Pallets
- SSCC-18 generated if GS1 enabled
- Open pallet accepts LP additions
- Closed pallet is sealed
- Pallet move moves all contained LPs

### Cycle Counts
- Full: all LPs in warehouse
- Partial: specific zone or location
- Variance = counted - expected
- Variances require approval
- Approved variances create adjustment moves

---

## Scanner UI Requirements

### Touch Targets
- Minimum 48x48 pixels for all buttons
- Large barcode scan area (full width)
- Number pad for quantity input

### Audio/Visual Feedback
- Success tone + green indicator on valid scan
- Error beep + red indicator on invalid scan
- Vibration on mobile devices

### Offline Support (Phase 2)
- Queue operations locally (max 100)
- Sync when connection restored
- Show pending count indicator

### Label Printing
- ZPL format for Zebra printers
- LP label: barcode, product, qty, batch, expiry, location
- Pallet label: SSCC-18 barcode, LP count, weight

---

## Testing Requirements

### Unit Tests (80%+ coverage)
- LP service: CRUD, split, merge, block
- GRN service: creation, LP generation
- Stock move service: validation, execution
- Inventory service: queries, aggregation
- FIFO/FEFO service: suggestion algorithm

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- GRN -> LP creation flow
- Split/merge genealogy tracking

### E2E Tests
- Receive PO -> create LPs -> print labels
- Split LP workflow
- Merge LP workflow
- Scanner receive workflow
- Scanner move workflow
- Cycle count -> approve variances -> adjustments
