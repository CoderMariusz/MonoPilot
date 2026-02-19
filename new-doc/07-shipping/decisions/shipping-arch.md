# Shipping Module Architecture

## Overview

The Shipping Module manages the complete order-to-delivery cycle for finished goods, including customer management, sales order processing, picking operations, packing, carrier integration, and returns processing. Ensures food safety compliance through allergen separation and FIFO/FEFO enforcement.

**Module Purpose:**
- Customer and contact management with multiple shipping addresses
- Sales order creation, allocation, and fulfillment tracking
- Wave picking with scanner support and pick optimization
- GS1-compliant shipping labels (SSCC) and BOL generation
- Multi-carrier integration (DHL, UPS, DPD)
- Returns and RMA processing
- Dock scheduling and load optimization

**Key Entities:**
- Customers (with contacts and addresses)
- Sales Orders (SO) and SO Lines
- Inventory Allocations
- Pick Lists and Pick Lines
- Shipments and Shipment Boxes
- Dock Doors and Appointments
- RMA Requests and Lines
- Carrier Configurations

---

## Database Schema

### Core Tables

#### customers
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
customer_code         TEXT NOT NULL           -- Unique per org
name                  TEXT NOT NULL
email                 TEXT
phone                 TEXT
tax_id                TEXT                    -- VAT/EIN, encrypted
credit_limit          DECIMAL(15,2)
payment_terms_days    INTEGER DEFAULT 30
category              TEXT                    -- retail, wholesale, distributor
allergen_restrictions JSONB                   -- Array of allergen IDs
is_active             BOOLEAN DEFAULT true
notes                 TEXT
created_at            TIMESTAMPTZ DEFAULT now()
created_by            UUID REFERENCES users(id)
updated_at            TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, customer_code)
```

#### customer_contacts
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE
name                  TEXT NOT NULL
title                 TEXT
email                 TEXT
phone                 TEXT
is_primary            BOOLEAN DEFAULT false
created_at            TIMESTAMPTZ DEFAULT now()
```

#### customer_addresses
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE
address_type          TEXT NOT NULL           -- billing, shipping
is_default            BOOLEAN DEFAULT false
address_line1         TEXT NOT NULL
address_line2         TEXT
city                  TEXT NOT NULL
state                 TEXT
postal_code           TEXT NOT NULL
country               TEXT NOT NULL
dock_hours            JSONB                   -- {mon: "8-17", ...}
notes                 TEXT                    -- Delivery instructions
created_at            TIMESTAMPTZ DEFAULT now()
```

#### sales_orders
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
order_number          TEXT NOT NULL           -- Auto: SO-YYYY-NNNNN
customer_id           UUID NOT NULL REFERENCES customers(id)
customer_po           TEXT                    -- Customer's PO number
shipping_address_id   UUID NOT NULL REFERENCES customer_addresses(id)
order_date            DATE NOT NULL
promised_ship_date    DATE
required_delivery_date DATE
status                TEXT NOT NULL DEFAULT 'draft'  -- draft, confirmed, allocated, picking, packing, shipped, delivered, cancelled
total_amount          DECIMAL(15,2)           -- Calculated
notes                 TEXT
allergen_validated    BOOLEAN DEFAULT false
created_at            TIMESTAMPTZ DEFAULT now()
created_by            UUID REFERENCES users(id)
updated_at            TIMESTAMPTZ DEFAULT now()
confirmed_at          TIMESTAMPTZ
shipped_at            TIMESTAMPTZ

UNIQUE(org_id, order_number)
```

#### sales_order_lines
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
sales_order_id        UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE
line_number           INTEGER NOT NULL        -- Auto-increment per order
product_id            UUID NOT NULL REFERENCES products(id)
quantity_ordered      DECIMAL(15,4) NOT NULL
quantity_allocated    DECIMAL(15,4) DEFAULT 0
quantity_picked       DECIMAL(15,4) DEFAULT 0
quantity_packed       DECIMAL(15,4) DEFAULT 0
quantity_shipped      DECIMAL(15,4) DEFAULT 0
unit_price            DECIMAL(15,4) NOT NULL
line_total            DECIMAL(15,2)           -- Calculated
requested_lot         TEXT                    -- Specific lot request
notes                 TEXT
created_at            TIMESTAMPTZ DEFAULT now()
```

#### inventory_allocations
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
sales_order_line_id   UUID NOT NULL REFERENCES sales_order_lines(id) ON DELETE CASCADE
license_plate_id      UUID NOT NULL REFERENCES license_plates(id)
quantity_allocated    DECIMAL(15,4) NOT NULL
quantity_picked       DECIMAL(15,4) DEFAULT 0
allocated_at          TIMESTAMPTZ DEFAULT now()
allocated_by          UUID REFERENCES users(id)
released_at           TIMESTAMPTZ             -- Null if active
```

#### pick_lists
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
pick_list_number      TEXT NOT NULL           -- Auto: PL-YYYY-NNNNN
pick_type             TEXT NOT NULL           -- single_order, wave
status                TEXT NOT NULL DEFAULT 'pending'  -- pending, assigned, in_progress, completed, cancelled
priority              TEXT DEFAULT 'normal'   -- low, normal, high, urgent
assigned_to           UUID REFERENCES users(id)
wave_id               UUID                    -- Optional grouping
created_at            TIMESTAMPTZ DEFAULT now()
created_by            UUID REFERENCES users(id)
started_at            TIMESTAMPTZ
completed_at          TIMESTAMPTZ

UNIQUE(org_id, pick_list_number)
```

#### pick_list_lines
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
pick_list_id          UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE
sales_order_line_id   UUID NOT NULL REFERENCES sales_order_lines(id)
license_plate_id      UUID REFERENCES license_plates(id)  -- Suggested LP
location_id           UUID NOT NULL REFERENCES locations(id)
product_id            UUID NOT NULL REFERENCES products(id)
lot_number            TEXT                    -- From license plate
quantity_to_pick      DECIMAL(15,4) NOT NULL
quantity_picked       DECIMAL(15,4) DEFAULT 0
pick_sequence         INTEGER                 -- Route optimization
status                TEXT DEFAULT 'pending'  -- pending, picked, short
picked_license_plate_id UUID REFERENCES license_plates(id)  -- Actual LP
picked_at             TIMESTAMPTZ
picked_by             UUID REFERENCES users(id)
```

#### shipments
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
shipment_number       TEXT NOT NULL           -- Auto: SH-YYYY-NNNNN
sales_order_id        UUID NOT NULL REFERENCES sales_orders(id)
customer_id           UUID NOT NULL REFERENCES customers(id)
shipping_address_id   UUID NOT NULL REFERENCES customer_addresses(id)
status                TEXT NOT NULL DEFAULT 'pending'  -- pending, packing, packed, manifested, shipped, delivered, exception
carrier               TEXT                    -- dhl, ups, dpd, fedex, other
service_level         TEXT                    -- Ground, Express, etc.
tracking_number       TEXT
sscc                  TEXT                    -- GS1 SSCC barcode
total_weight          DECIMAL(10,2)           -- kg
total_boxes           INTEGER DEFAULT 0
dock_door_id          UUID REFERENCES dock_doors(id)
staged_location_id    UUID REFERENCES locations(id)
packed_at             TIMESTAMPTZ
packed_by             UUID REFERENCES users(id)
shipped_at            TIMESTAMPTZ
delivered_at          TIMESTAMPTZ
created_at            TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, shipment_number)
```

#### shipment_boxes
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
shipment_id           UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE
box_number            INTEGER NOT NULL        -- Sequential per shipment
sscc                  TEXT NOT NULL           -- Unique SSCC per box
weight                DECIMAL(10,3)           -- kg
length                DECIMAL(10,2)           -- cm
width                 DECIMAL(10,2)           -- cm
height                DECIMAL(10,2)           -- cm
tracking_number       TEXT
created_at            TIMESTAMPTZ DEFAULT now()

UNIQUE(sscc)
```

#### shipment_box_contents
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
shipment_box_id       UUID NOT NULL REFERENCES shipment_boxes(id) ON DELETE CASCADE
sales_order_line_id   UUID NOT NULL REFERENCES sales_order_lines(id)
product_id            UUID NOT NULL REFERENCES products(id)
license_plate_id      UUID NOT NULL REFERENCES license_plates(id)
lot_number            TEXT                    -- Traceability
quantity              DECIMAL(15,4) NOT NULL
created_at            TIMESTAMPTZ DEFAULT now()
```

#### dock_doors
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
door_code             TEXT NOT NULL           -- Unique per org
door_name             TEXT NOT NULL
door_type             TEXT NOT NULL           -- shipping, receiving, both
temperature_zone      TEXT                    -- ambient, chilled, frozen
is_active             BOOLEAN DEFAULT true
created_at            TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, door_code)
```

#### dock_appointments
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
dock_door_id          UUID NOT NULL REFERENCES dock_doors(id)
appointment_type      TEXT NOT NULL           -- shipping, receiving
shipment_id           UUID REFERENCES shipments(id)
scheduled_start       TIMESTAMPTZ NOT NULL
scheduled_end         TIMESTAMPTZ NOT NULL
actual_start          TIMESTAMPTZ
actual_end            TIMESTAMPTZ
carrier               TEXT
truck_number          TEXT
driver_name           TEXT
status                TEXT NOT NULL DEFAULT 'scheduled'  -- scheduled, in_progress, completed, cancelled
notes                 TEXT
created_at            TIMESTAMPTZ DEFAULT now()
```

#### rma_requests
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
rma_number            TEXT NOT NULL           -- Auto: RMA-YYYY-NNNNN
customer_id           UUID NOT NULL REFERENCES customers(id)
sales_order_id        UUID REFERENCES sales_orders(id)
reason_code           TEXT NOT NULL           -- damaged, expired, wrong_product, quality_issue, other
status                TEXT NOT NULL DEFAULT 'pending'  -- pending, approved, receiving, received, processed, closed
total_value           DECIMAL(15,2)           -- Calculated
disposition           TEXT                    -- restock, scrap, quality_hold
notes                 TEXT
created_at            TIMESTAMPTZ DEFAULT now()
created_by            UUID REFERENCES users(id)
approved_at           TIMESTAMPTZ
approved_by           UUID REFERENCES users(id)

UNIQUE(org_id, rma_number)
```

#### rma_lines
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
rma_request_id        UUID NOT NULL REFERENCES rma_requests(id) ON DELETE CASCADE
product_id            UUID NOT NULL REFERENCES products(id)
quantity_expected     DECIMAL(15,4) NOT NULL
quantity_received     DECIMAL(15,4) DEFAULT 0
lot_number            TEXT
reason_notes          TEXT
disposition           TEXT                    -- Override RMA-level
created_at            TIMESTAMPTZ DEFAULT now()
```

#### carrier_configs
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                UUID NOT NULL REFERENCES organizations(id)
carrier               TEXT NOT NULL           -- dhl, ups, dpd, fedex
is_active             BOOLEAN DEFAULT true
api_endpoint          TEXT NOT NULL
api_key               TEXT NOT NULL           -- Encrypted (Supabase Vault)
account_number        TEXT NOT NULL
config_json           JSONB                   -- Carrier-specific settings
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, carrier)
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_customers_org_code ON customers(org_id, customer_code);
CREATE INDEX idx_customers_org_active ON customers(org_id, is_active);

CREATE INDEX idx_sales_orders_org_status ON sales_orders(org_id, status);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_promised_date ON sales_orders(promised_ship_date);
CREATE INDEX idx_sales_orders_order_date ON sales_orders(order_date);

CREATE INDEX idx_so_lines_order ON sales_order_lines(sales_order_id);
CREATE INDEX idx_so_lines_product ON sales_order_lines(product_id);

CREATE INDEX idx_inventory_allocations_so_line ON inventory_allocations(sales_order_line_id);
CREATE INDEX idx_inventory_allocations_lp ON inventory_allocations(license_plate_id);

CREATE INDEX idx_pick_lists_org_status ON pick_lists(org_id, status);
CREATE INDEX idx_pick_lists_assigned ON pick_lists(assigned_to);
CREATE INDEX idx_pick_list_lines_list ON pick_list_lines(pick_list_id);
CREATE INDEX idx_pick_list_lines_status ON pick_list_lines(status);

CREATE INDEX idx_shipments_org_status ON shipments(org_id, status);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_shipments_sscc ON shipments(sscc) WHERE sscc IS NOT NULL;
CREATE INDEX idx_shipments_sales_order ON shipments(sales_order_id);

CREATE INDEX idx_shipment_boxes_shipment ON shipment_boxes(shipment_id);
CREATE INDEX idx_shipment_box_contents_box ON shipment_box_contents(shipment_box_id);

CREATE INDEX idx_dock_appointments_door ON dock_appointments(dock_door_id);
CREATE INDEX idx_dock_appointments_schedule ON dock_appointments(scheduled_start, scheduled_end);

CREATE INDEX idx_rma_org_status ON rma_requests(org_id, status);
CREATE INDEX idx_rma_lines_rma ON rma_lines(rma_request_id);
```

---

## API Design

### Customer Endpoints
```
GET    /api/shipping/customers                    -- List with filters
GET    /api/shipping/customers/:id                -- Customer detail
POST   /api/shipping/customers                    -- Create customer
PUT    /api/shipping/customers/:id                -- Update customer
DELETE /api/shipping/customers/:id                -- Archive customer

GET    /api/shipping/customers/:id/contacts       -- List contacts
POST   /api/shipping/customers/:id/contacts       -- Add contact
PUT    /api/shipping/customers/:id/contacts/:contactId
DELETE /api/shipping/customers/:id/contacts/:contactId

GET    /api/shipping/customers/:id/addresses      -- List addresses
POST   /api/shipping/customers/:id/addresses      -- Add address
PUT    /api/shipping/customers/:id/addresses/:addressId
DELETE /api/shipping/customers/:id/addresses/:addressId
PUT    /api/shipping/customers/:id/addresses/:addressId/set-default

GET    /api/shipping/customers/:id/orders         -- Customer order history
GET    /api/shipping/customers/:id/allergen-validation  -- Validate against products
```

### Sales Order Endpoints
```
GET    /api/shipping/sales-orders                 -- List with filters
GET    /api/shipping/sales-orders/:id             -- SO detail with lines
POST   /api/shipping/sales-orders                 -- Create SO
PUT    /api/shipping/sales-orders/:id             -- Update SO (draft only)
DELETE /api/shipping/sales-orders/:id             -- Delete SO (draft only)

POST   /api/shipping/sales-orders/:id/lines       -- Add line
PUT    /api/shipping/sales-orders/:id/lines/:lineId
DELETE /api/shipping/sales-orders/:id/lines/:lineId

POST   /api/shipping/sales-orders/:id/confirm     -- Confirm -> trigger allocation
POST   /api/shipping/sales-orders/:id/hold        -- Put on hold
POST   /api/shipping/sales-orders/:id/cancel      -- Cancel SO
POST   /api/shipping/sales-orders/:id/clone       -- Clone SO

POST   /api/shipping/sales-orders/:id/allocate    -- Manual allocation
POST   /api/shipping/sales-orders/:id/release-allocation
GET    /api/shipping/sales-orders/:id/allocations -- View allocations

POST   /api/shipping/sales-orders/import          -- CSV/API import
POST   /api/shipping/sales-orders/:id/validate-allergens
```

### Pick List Endpoints
```
GET    /api/shipping/pick-lists                   -- List pick lists
GET    /api/shipping/pick-lists/:id               -- Pick list detail
POST   /api/shipping/pick-lists                   -- Create pick list from SO
DELETE /api/shipping/pick-lists/:id               -- Cancel pick list

POST   /api/shipping/pick-lists/:id/assign        -- Assign to picker
POST   /api/shipping/pick-lists/:id/start         -- Start picking
POST   /api/shipping/pick-lists/:id/complete      -- Complete all lines
POST   /api/shipping/pick-lists/:id/cancel        -- Cancel in progress

GET    /api/shipping/pick-lists/:id/lines         -- Get pick lines
PUT    /api/shipping/pick-lists/:id/lines/:lineId/pick  -- Record pick
POST   /api/shipping/pick-lists/:id/lines/:lineId/short-pick

POST   /api/shipping/pick-lists/wave              -- Create wave pick list
POST   /api/shipping/pick-lists/:id/optimize-route

GET    /api/shipping/pick-lists/my-picks          -- Picker's assigned lists
```

### Shipment Endpoints
```
GET    /api/shipping/shipments                    -- List shipments
GET    /api/shipping/shipments/:id                -- Shipment detail
POST   /api/shipping/shipments                    -- Create shipment
PUT    /api/shipping/shipments/:id                -- Update shipment
DELETE /api/shipping/shipments/:id                -- Cancel shipment

POST   /api/shipping/shipments/:id/boxes          -- Add box
PUT    /api/shipping/shipments/:id/boxes/:boxId   -- Update box
DELETE /api/shipping/shipments/:id/boxes/:boxId   -- Remove box

POST   /api/shipping/shipments/:id/boxes/:boxId/contents  -- Add content
DELETE /api/shipping/shipments/:id/boxes/:boxId/contents/:contentId

POST   /api/shipping/shipments/:id/generate-sscc  -- Generate SSCC codes
POST   /api/shipping/shipments/:id/generate-bol   -- Generate BOL PDF
POST   /api/shipping/shipments/:id/print-labels   -- Print shipping labels
POST   /api/shipping/shipments/:id/print-packing-slip

POST   /api/shipping/shipments/:id/manifest       -- Manifest with carrier
POST   /api/shipping/shipments/:id/ship           -- Mark as shipped
POST   /api/shipping/shipments/:id/mark-delivered

GET    /api/shipping/shipments/:id/tracking       -- Get tracking info
```

### Dock Management Endpoints
```
GET    /api/shipping/dock-doors                   -- List dock doors
POST   /api/shipping/dock-doors                   -- Create dock door
PUT    /api/shipping/dock-doors/:id               -- Update dock door
DELETE /api/shipping/dock-doors/:id               -- Deactivate dock door

GET    /api/shipping/dock-appointments            -- List appointments
POST   /api/shipping/dock-appointments            -- Create appointment
PUT    /api/shipping/dock-appointments/:id        -- Update appointment
DELETE /api/shipping/dock-appointments/:id        -- Cancel appointment

POST   /api/shipping/dock-appointments/:id/start  -- Start appointment
POST   /api/shipping/dock-appointments/:id/complete

GET    /api/shipping/dock-appointments/schedule   -- Calendar view
```

### Returns (RMA) Endpoints
```
GET    /api/shipping/rma                          -- List RMAs
GET    /api/shipping/rma/:id                      -- RMA detail
POST   /api/shipping/rma                          -- Create RMA
PUT    /api/shipping/rma/:id                      -- Update RMA
DELETE /api/shipping/rma/:id                      -- Delete RMA (pending only)

POST   /api/shipping/rma/:id/lines                -- Add line
PUT    /api/shipping/rma/:id/lines/:lineId
DELETE /api/shipping/rma/:id/lines/:lineId

POST   /api/shipping/rma/:id/approve              -- Approve RMA
POST   /api/shipping/rma/:id/receive-line         -- Receive line item
POST   /api/shipping/rma/:id/process              -- Process dispositions
POST   /api/shipping/rma/:id/close                -- Close RMA
```

### Carrier Integration Endpoints
```
GET    /api/shipping/carriers                     -- List carrier configs
POST   /api/shipping/carriers                     -- Add carrier config
PUT    /api/shipping/carriers/:id                 -- Update carrier config
DELETE /api/shipping/carriers/:id                 -- Remove carrier

POST   /api/shipping/carriers/:carrier/rate-quote -- Get rate quote
POST   /api/shipping/carriers/:carrier/book-shipment
POST   /api/shipping/carriers/:carrier/get-label  -- Get shipping label
GET    /api/shipping/carriers/:carrier/track/:trackingNumber

POST   /api/shipping/carriers/webhook/:carrier    -- Webhook endpoint
```

### Scanner Endpoints
```
POST   /api/shipping/scanner/pick                 -- Scanner pick confirmation
POST   /api/shipping/scanner/pack                 -- Scanner pack confirmation
POST   /api/shipping/scanner/receive-return       -- Scanner RMA receive
POST   /api/shipping/scanner/dock-load            -- Scanner dock loading

GET    /api/shipping/scanner/lookup/so/:barcode   -- SO lookup
GET    /api/shipping/scanner/lookup/lp/:barcode   -- LP lookup for picking
GET    /api/shipping/scanner/suggest-pick/:lineId -- Pick suggestion
```

### Dashboard & Reports Endpoints
```
GET    /api/shipping/dashboard                    -- KPIs
GET    /api/shipping/dashboard/alerts             -- Alerts (backorders, delays)
GET    /api/shipping/dashboard/recent-activity

GET    /api/shipping/reports/orders-by-status
GET    /api/shipping/reports/pick-performance
GET    /api/shipping/reports/on-time-delivery
GET    /api/shipping/reports/backorders
GET    /api/shipping/reports/carrier-performance
GET    /api/shipping/reports/returns-analysis
```

### Settings Endpoints
```
GET    /api/shipping/settings
PUT    /api/shipping/settings
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/shipping/
├── page.tsx                    -- Shipping dashboard redirect
├── dashboard/
│   └── page.tsx               -- Shipping dashboard
│       └── components/
│           ├── ShippingKPIs.tsx
│           ├── OrdersChart.tsx
│           ├── PendingPicksCard.tsx
│           ├── BackordersAlert.tsx
│           └── RecentShipments.tsx
├── customers/
│   ├── page.tsx               -- Customer list
│   ├── [id]/page.tsx          -- Customer detail
│   ├── new/page.tsx           -- Create customer
│   └── components/
│       ├── CustomerTable.tsx
│       ├── CustomerForm.tsx
│       ├── ContactsTab.tsx
│       ├── AddressesTab.tsx
│       └── CustomerOrderHistory.tsx
├── sales-orders/
│   ├── page.tsx               -- SO list
│   ├── [id]/page.tsx          -- SO detail
│   ├── new/page.tsx           -- Create SO wizard
│   └── components/
│       ├── SOTable.tsx
│       ├── SOFilters.tsx
│       ├── SOForm.tsx
│       ├── SOLinesTable.tsx
│       ├── AllocationView.tsx
│       ├── AllergenAlert.tsx
│       └── SOStatusTimeline.tsx
├── pick-lists/
│   ├── page.tsx               -- Pick list list
│   ├── [id]/page.tsx          -- Pick list detail
│   ├── wave/page.tsx          -- Wave picking setup
│   └── components/
│       ├── PickListTable.tsx
│       ├── PickLinesTable.tsx
│       ├── PickAssignment.tsx
│       ├── WavePickBuilder.tsx
│       └── RouteOptimizer.tsx
├── shipments/
│   ├── page.tsx               -- Shipment list
│   ├── [id]/page.tsx          -- Shipment detail
│   └── components/
│       ├── ShipmentTable.tsx
│       ├── ShipmentForm.tsx
│       ├── BoxBuilder.tsx
│       ├── BoxContentsTable.tsx
│       ├── LabelPrint.tsx
│       ├── BOLGenerator.tsx
│       └── TrackingInfo.tsx
├── packing/
│   └── [shipmentId]/page.tsx  -- Packing station UI
│       └── components/
│           ├── PackingWorkbench.tsx
│           ├── ScanInput.tsx
│           ├── BoxSelector.tsx
│           └── PackingSummary.tsx
├── dock/
│   ├── page.tsx               -- Dock schedule
│   └── components/
│       ├── DockCalendar.tsx
│       ├── DoorList.tsx
│       ├── AppointmentForm.tsx
│       └── LoadingConfirm.tsx
├── rma/
│   ├── page.tsx               -- RMA list
│   ├── [id]/page.tsx          -- RMA detail
│   └── components/
│       ├── RMATable.tsx
│       ├── RMAForm.tsx
│       ├── RMALinesTable.tsx
│       ├── DispositionModal.tsx
│       └── RMAStatusBadge.tsx
├── carriers/
│   ├── page.tsx               -- Carrier config list
│   └── components/
│       ├── CarrierConfigForm.tsx
│       └── CarrierTestConnection.tsx
└── settings/
    └── page.tsx               -- Shipping settings

apps/frontend/app/(authenticated)/scanner/shipping/
├── pick/page.tsx              -- Scanner pick workflow
├── pack/page.tsx              -- Scanner pack workflow
├── return/page.tsx            -- Scanner RMA receive
├── dock-load/page.tsx         -- Scanner dock loading
└── components/
    ├── PickScanner.tsx
    ├── PackScanner.tsx
    ├── ScanFeedback.tsx
    ├── QuantityPad.tsx
    └── ShortPickModal.tsx
```

### Service Dependencies

```
lib/services/
├── customer-service.ts        -- Customer CRUD, allergen validation
├── sales-order-service.ts     -- SO CRUD, allocation, status workflow
├── allocation-service.ts      -- Inventory allocation logic (FIFO/FEFO)
├── pick-list-service.ts       -- Pick list CRUD, wave picking, route optimization
├── shipment-service.ts        -- Shipment CRUD, SSCC generation, BOL
├── packing-service.ts         -- Packing workflow, box management
├── dock-service.ts            -- Dock doors, appointments
├── rma-service.ts             -- RMA CRUD, receiving, disposition
├── carrier-service.ts         -- Carrier adapter interface
├── shipping-dashboard-service.ts
└── shipping-settings-service.ts
```

---

## Data Flow

### Sales Order Allocation Flow
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   SO API       | --> |  Validate      |
|   Confirm   |     |   /confirm     |     |  customer,     |
|   SO        |     |                |     |  allergens     |
+-------------+     +----------------+     +----------------+
      |                    |
      |             For each SO line:
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Update    | --> | Allocation     | --> | license_plates |
|   SO Status |     | Service        |     | (query FIFO/   |
|   confirmed |     | allocate()     |     |  FEFO)         |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Create       | --> | inventory_     |
                   |   Allocation   |     | allocations    |
                   |   Records      |     | (reserved)     |
                   +----------------+     +----------------+
                          |
                          v
                   +----------------+
                   |   Update LP    |
                   |   status ->    |
                   |   'reserved'   |
                   +----------------+
```

### Pick Confirmation Flow
```
+-------------+     +----------------+     +----------------+
|   Scanner   | --> |   Pick API     | --> |   Validate     |
|   Scan LP   |     |   /pick        |     |   LP matches   |
|   + Qty     |     |                |     |   pick line    |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Update pick_list_lines:
      |             - quantity_picked
      |             - picked_license_plate_id
      |             - picked_at, picked_by
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Update    | --> |   Update SO    | --> | sales_order_   |
|   Allocation|     |   Line Qty     |     | lines.qty_     |
|   qty_picked|     |   Picked       |     | picked         |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+
                   |   If all lines |
                   |   picked:      |
                   |   SO -> packing|
                   +----------------+
```

### Packing Flow
```
+-------------+     +----------------+     +----------------+
|   Scanner   | --> |   Pack API     | --> |   Validate LP  |
|   Create    |     |   /pack        |     |   allocated to |
|   Box + Scan|     |                |     |   this SO      |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Create shipment_box:
      |             - Generate SSCC
      |             - Link to shipment
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Add LP    | --> |   Create       | --> | shipment_box_  |
|   to Box    |     |   Box Content  |     | contents       |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Update SO    | --> | sales_order_   |
                   |   Line Qty     |     | lines.qty_     |
                   |   Packed       |     | packed         |
                   +----------------+     +----------------+
                          |
                          v
                   +----------------+
                   |   Close Box:   |
                   |   Print SSCC   |
                   |   Label        |
                   +----------------+
```

### Ship Confirmation Flow
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   Ship API     | --> |   Validate     |
|   Manifest  |     |   /manifest    |     |   all picked   |
|   Shipment  |     |   /ship        |     |   & packed     |
+-------------+     +----------------+     +----------------+
      |                    |
      |             If carrier integration:
      |             - Call carrier API
      |             - Get tracking number
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Generate  | --> |   Update       | --> | shipments      |
|   BOL +     |     |   Shipment     |     | .status =      |
|   Print     |     |   tracking_num |     | 'shipped'      |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Consume LPs  | --> | license_plates |
                   |   (update      |     | .status =      |
                   |   status)      |     | 'shipped'      |
                   +----------------+     +----------------+
                          |
                          v
                   +----------------+
                   |   SO.status -> |
                   |   'shipped'    |
                   +----------------+
```

### FIFO/FEFO Allocation Algorithm
```
+-------------+     +----------------+
|   SO Line   | --> |   Query LPs    |
|   Request   |     |   WHERE:       |
+-------------+     |   - product_id |
      |             |   - status =   |
      |             |     'available'|
      |             |   - qa_status =|
      |             |     'passed'   |
      |             +----------------+
      |                    |
      |             ORDER BY:
      |             FIFO: created_at ASC
      |             FEFO: expiry_date ASC, created_at ASC
      |                    |
      v                    v
+-------------+     +----------------+
|   Allocate  | --> |   Loop until   |
|   qty_needed|     |   qty fulfilled|
+-------------+     |   or no more   |
                    |   LPs          |
                    +----------------+
                          |
                          v
                   +----------------+
                   |   If remaining |
                   |   -> backorder |
                   +----------------+
```

---

## Security

### RLS Policies

```sql
-- Customers: org_id filter
CREATE POLICY "Customers org isolation"
ON customers FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Sales Orders: org_id filter
CREATE POLICY "Sales orders org isolation"
ON sales_orders FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Pick Lists: org_id filter + assignment check for pickers
CREATE POLICY "Pick lists org isolation"
ON pick_lists FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Pick lists update own assignment"
ON pick_lists FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    assigned_to = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager', 'warehouse_mgr')
  )
);

-- Shipments: org_id filter
CREATE POLICY "Shipments org isolation"
ON shipments FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Carrier Configs: admin only for sensitive fields
CREATE POLICY "Carrier configs admin only"
ON carrier_configs FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin')
);
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /customers | Any authenticated |
| POST /customers | Sales, Manager, Admin |
| PUT /customers/:id | Sales, Manager, Admin |
| DELETE /customers/:id | Manager, Admin |
| GET /sales-orders | Any authenticated |
| POST /sales-orders | Sales, Manager, Admin |
| /sales-orders/:id/confirm | Sales, Manager, Admin |
| /sales-orders/:id/cancel | Manager, Admin |
| GET /pick-lists | Warehouse, Manager, Admin |
| /pick-lists/:id/assign | Warehouse Mgr, Admin |
| /pick-lists/:id/lines/:lineId/pick | Picker, Warehouse, Admin |
| GET /shipments | Any authenticated |
| /shipments/:id/ship | Warehouse Mgr, Admin |
| /rma/:id/approve | Manager, Admin |
| /carriers | Admin only |
| /settings | Admin only |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Customers per org | 100-500 | 10,000 |
| Sales orders per month | 200-1,000 | 50,000 |
| SO lines per order | 5-20 | 500 |
| Pick lists per day | 20-100 | 1,000 |
| Shipments per day | 10-50 | 500 |
| Allocations (active) | 500-5,000 | 100,000 |

### Query Optimization

1. **SO List:**
   - Composite index on (org_id, status, order_date)
   - Filter by status, date range
   - Paginate with limit 50

2. **Allocation Query:**
   - Index on (product_id, status, qa_status, expiry_date)
   - FIFO: ORDER BY created_at
   - FEFO: ORDER BY expiry_date, created_at
   - Limit to available qty needed

3. **Pick List Generation:**
   - Batch insert pick lines
   - Pre-calculate route sequence
   - Cache zone/aisle sort order

4. **Dashboard Queries:**
   - Aggregate by status: COUNT(*) GROUP BY status
   - Cache KPIs (1 min TTL)
   - Materialized views for reports

5. **Backorder Query:**
   - Index on (quantity_ordered - quantity_shipped > 0)
   - Partial index for active backorders

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:shipping:dashboard'              // 1 min TTL
'org:{orgId}:shipping:backorders'             // 5 min TTL
'org:{orgId}:customer:{customerId}:summary'   // 5 min TTL
'org:{orgId}:so:{soId}:allocations'           // 30 sec TTL
'carrier:{carrier}:rates:{hash}'              // 15 min TTL
```

---

## Integration Points

### Module Dependencies

```
Shipping Module
    |
    +---> Settings (organizations, users, roles)
    +---> Technical (products, allergens)
    +---> Warehouse (license_plates, locations, inventory moves)
    +---> Production (finished goods availability)
    +---> Quality (QA status for LP release)
    +---> Planning (PO backorder creation)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `customer.created` | Customer created | Audit log |
| `so.confirmed` | SO confirmed | Allocation service |
| `so.allocated` | Allocation complete | Pick list suggestion |
| `so.shipped` | Shipment completed | Finance (invoice), Audit |
| `so.cancelled` | SO cancelled | Release allocations |
| `pick.completed` | Pick list completed | Packing notification |
| `shipment.shipped` | Shipment left dock | Customer notification |
| `shipment.delivered` | POD received | SO status update |
| `rma.approved` | RMA approved | Receiving workflow |
| `rma.restocked` | Return restocked | Inventory update |
| `backorder.created` | Insufficient inventory | Planning/MRP |

### Data Dependencies

| Upstream | Data Required |
|----------|---------------|
| Warehouse | license_plates for allocation/picking |
| Production | Finished goods for sale |
| Technical | Products, allergens |
| Quality | LP QA status (only pick 'passed') |

| Downstream | Data Provided |
|------------|---------------|
| Finance | Shipped SO for invoicing |
| Planning | Backorder signals for MRP |
| Integrations | EDI ASN (856), tracking webhooks |

---

## Business Rules

### Allocation Rules
- Auto-allocation on SO confirmation (configurable)
- FIFO: oldest manufactured first
- FEFO: soonest expiry first (overrides FIFO for perishables)
- Only allocate LP with qa_status = 'passed'
- Lot-specific: honor requested_lot if specified
- Partial allocation creates backorder record

### Status Workflows

**Sales Order Status:**
```
draft -> confirmed -> allocated -> picking -> packing -> shipped -> delivered
           |
        cancelled
```

**Pick List Status:**
```
pending -> assigned -> in_progress -> completed
              |
           cancelled
```

**Shipment Status:**
```
pending -> packing -> packed -> manifested -> shipped -> delivered
                                                |
                                            exception
```

**RMA Status:**
```
pending -> approved -> receiving -> received -> processed -> closed
```

### Allergen Validation
- Check customer.allergen_restrictions vs product.allergens
- Block SO confirmation if conflict (unless override)
- Display allergen alerts in pick/pack workflows
- Separate allergen products in different boxes (warning)

### GS1 SSCC Generation
- Format: (00) + 18-digit SSCC
- Structure: Extension(1) + GS1 Prefix(7-10) + Serial(6-8) + Check(1)
- Unique per shipment box
- Stored in shipment_boxes.sscc

### BOL Requirements
- BOL number unique per shipment
- Include: Ship From, Ship To, Carrier, Pro Number
- Line items: Box count, weight, freight class
- All SSCC codes listed for traceability
- Shipper/carrier signature fields

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
- SSCC label: barcode, Ship To, Order #, Box X of Y, Weight
- Shipping label: Carrier format (via API or ZPL)
- Packing slip: Product list, quantities, lot numbers

---

## Testing Requirements

### Unit Tests (80%+ coverage)
- customer-service: CRUD, allergen validation
- sales-order-service: allocation, status transitions, backorder
- allocation-service: FIFO/FEFO sorting, partial allocation
- pick-list-service: wave consolidation, route optimization
- shipment-service: SSCC generation, BOL generation
- carrier-service: rate quote, booking (mock external API)

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- SO confirm -> allocation -> pick -> pack -> ship flow
- Allergen validation blocking
- Backorder creation on insufficient inventory

### E2E Tests
- Happy path: Create customer -> Create SO -> Allocate -> Pick (scanner) -> Pack (scanner) -> Ship
- Wave picking: 3 SOs -> wave pick list -> complete -> distribute
- Short pick handling: partial pick -> backorder
- RMA processing: create -> approve -> receive (scanner) -> restock
- Allergen validation: customer restriction -> SO alert -> override
- Carrier integration: configure DHL -> book shipment -> get label

---

**Last Updated:** 2025-12-10
**PRD Reference:** docs/1-BASELINE/product/modules/shipping.md
**Status:** Architecture documented, implementation planned
