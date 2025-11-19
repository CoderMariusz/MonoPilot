# Shipping Module PRD

## Overview

The Shipping module manages outbound logistics including shipment planning, picking, packing, and delivery. It handles customer orders, carrier management, and shipping documentation.

### Dependencies
- **Settings Module**: Warehouses, Locations
- **Technical Module**: Products
- **Warehouse Module**: License Plates, Pallets
- **Quality Module**: QA status validation before shipping

### Key Concepts
- **Sales Order (SO)**: Customer order to fulfill
- **Shipment**: Group of items to ship together
- **Pick List**: Items to pick from warehouse
- **Pack**: Items packed for shipping
- **Delivery**: Actual dispatch with carrier

---

## 1. Shipping Settings

All Shipping features are controlled via Settings toggles.

### 1.1 Configuration Table

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_shipping_module` | boolean | true | Enable shipping management |
| `require_sales_order` | boolean | true | Require SO for shipments |
| `enable_wave_picking` | boolean | false | Group picks into waves |
| `enable_zone_picking` | boolean | false | Pick by zone |
| `enable_batch_picking` | boolean | false | Batch similar items |
| `picking_strategy` | enum | 'fifo' | fifo, fefo, manual |
| `enable_pack_station` | boolean | true | Enable packing workflow |
| `enable_carrier_integration` | boolean | false | Integrate with carriers |
| `default_carrier` | string | null | Default carrier |
| `auto_generate_tracking` | boolean | false | Auto-generate tracking numbers |
| `require_qa_passed` | boolean | true | Only ship QA passed LPs |
| `enable_proof_of_delivery` | boolean | false | Capture POD |
| `enable_partial_shipment` | boolean | true | Allow partial shipments |
| `enable_backorder` | boolean | true | Create backorders |
| `enable_shipping_labels` | boolean | true | Print shipping labels |
| `enable_packing_slip` | boolean | true | Print packing slips |
| `enable_bill_of_lading` | boolean | false | Generate BOL |

---

## 2. Sales Orders

### 2.1 SO Concept
Sales Order is the customer's purchase request. It defines what to ship, to whom, and when.

### 2.2 SO Header Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `so_number` | string | Yes | Unique SO identifier |
| `customer_id` | FK | Yes | Customer reference |
| `order_date` | date | Yes | Order placed date |
| `requested_date` | date | Yes | Customer requested date |
| `promised_date` | date | No | Promised delivery date |
| `ship_to_address` | text | Yes | Delivery address |
| `warehouse_id` | FK | Yes | Ship from warehouse |
| `status` | enum | Yes | draft, confirmed, picking, shipped, delivered, cancelled |
| `priority` | enum | No | low, normal, high, urgent |
| `shipping_method` | string | No | Shipping method |
| `carrier` | string | No | Carrier name |
| `notes` | text | No | Order notes |
| `total_value` | decimal | No | Order value |

### 2.3 SO Line Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | FK | Yes | Product |
| `quantity` | decimal | Yes | Ordered quantity |
| `uom` | string | Yes | Unit of measure |
| `picked_qty` | decimal | Yes | Quantity picked |
| `shipped_qty` | decimal | Yes | Quantity shipped |
| `unit_price` | decimal | No | Price per unit |
| `line_status` | enum | Yes | pending, picking, packed, shipped |
| `notes` | text | No | Line notes |

### 2.4 SO Status Flow

```
draft → confirmed (customer confirmation)
      → picking (pick started)
      → packed (ready to ship)
      → shipped (dispatched)
      → delivered (POD received)
      → cancelled

Partial: If partial shipment, creates backorder SO
```

### 2.5 SO UI

#### SO List View
- Filter by: Status, Customer, Date range, Warehouse, Priority
- Columns: SO #, Customer, Date, Items, Status, Ship Date
- Actions: View, Edit (draft), Confirm, Pick, Ship

#### Create SO Modal
- Customer selection (search)
- Ship-to address (from customer or override)
- Requested date
- Warehouse
- Add lines: Product, Qty, UoM, Price
- Priority
- Notes

#### SO Detail View
- Header information
- Lines with picked/shipped status
- Shipment history
- Actions: Edit, Confirm, Generate Pick List, Ship

---

## 3. Shipments

### 3.1 Shipment Concept
Shipment groups items from one or more SOs that ship together. Useful for consolidation and carrier booking.

### 3.2 Shipment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipment_number` | string | Yes | Unique identifier |
| `warehouse_id` | FK | Yes | Ship from warehouse |
| `ship_date` | datetime | Yes | Scheduled ship date |
| `status` | enum | Yes | draft, picking, packed, shipped, delivered |
| `carrier` | string | No | Carrier name |
| `tracking_number` | string | No | Tracking number |
| `weight_kg` | decimal | No | Total weight |
| `package_count` | integer | No | Number of packages |
| `shipping_cost` | decimal | No | Shipping cost |
| `pod_date` | datetime | No | Proof of delivery date |
| `pod_signature` | string | No | POD signature |

### 3.3 Shipment Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipment_id` | FK | Yes | Parent shipment |
| `so_line_id` | FK | Yes | SO line reference |
| `product_id` | FK | Yes | Product |
| `quantity` | decimal | Yes | Ship quantity |
| `lp_id` | FK | No | Shipped LP |
| `pallet_id` | FK | No | Shipped pallet |

### 3.4 Shipment UI

#### Shipment List View
- Filter by: Status, Date range, Carrier, Customer
- Columns: Shipment #, Date, Customer, Items, Carrier, Tracking, Status
- Actions: View, Track, Print Documents

#### Create Shipment Modal
- Select SOs to include
- Ship date
- Carrier selection
- Create shipment

---

## 4. Picking

### 4.1 Picking Concept
Picking is the process of selecting items from warehouse locations to fulfill orders.

### 4.2 Pick List Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pick_number` | string | Yes | Unique identifier |
| `shipment_id` | FK | No | Related shipment |
| `so_id` | FK | No | Related SO |
| `warehouse_id` | FK | Yes | Warehouse |
| `status` | enum | Yes | pending, in_progress, completed, cancelled |
| `assigned_to` | FK | No | Assigned picker |
| `priority` | enum | No | Priority |
| `created_at` | datetime | Yes | When created |
| `started_at` | datetime | No | When started |
| `completed_at` | datetime | No | When completed |

### 4.3 Pick Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pick_id` | FK | Yes | Parent pick |
| `so_line_id` | FK | Yes | SO line |
| `product_id` | FK | Yes | Product |
| `required_qty` | decimal | Yes | Qty to pick |
| `picked_qty` | decimal | Yes | Qty picked |
| `from_location_id` | FK | Yes | Pick location |
| `lp_id` | FK | No | Suggested LP |
| `status` | enum | Yes | pending, picked, short |

### 4.4 Picking Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| FIFO | First In First Out | Standard inventory |
| FEFO | First Expiry First Out | Perishables |
| Manual | User selects LP | Special requirements |
| Zone | By warehouse zone | Large warehouse |
| Batch | Group similar items | High volume |

### 4.5 Picking UI (Desktop)

#### Pick List View
- Filter by: Status, Date, Warehouse, Assigned
- Columns: Pick #, SO/Shipment, Items, Status, Assigned, Priority
- Actions: View, Assign, Print

#### Pick Detail View
- Pick information
- Items to pick with locations
- Progress (picked/total)
- Actions: Start, Complete, Print

#### Suggested LPs
- System suggests LPs based on strategy
- User can override
- Shows: LP, Location, Qty, Expiry, QA Status

### 4.6 Picking Workflow

1. **Generate Pick List**
   - From SO or Shipment
   - System calculates suggested LPs
   - Groups by location for efficiency

2. **Assign Picker**
   - Optional assignment
   - Or self-assign on start

3. **Pick Items**
   - Follow pick path
   - Scan LP for each item
   - Confirm quantity
   - Handle shorts

4. **Complete Pick**
   - All items picked or shorted
   - Updates SO/Shipment status
   - Ready for packing

---

## 5. Packing

### 5.1 Packing Concept
Packing is the process of preparing picked items for shipping - placing in boxes, adding documents, applying labels.

### 5.2 Pack Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pack_number` | string | Yes | Unique identifier |
| `shipment_id` | FK | Yes | Related shipment |
| `package_type` | string | No | Box type |
| `weight_kg` | decimal | No | Package weight |
| `dimensions` | string | No | L x W x H |
| `tracking_number` | string | No | Package tracking |
| `status` | enum | Yes | packing, packed, shipped |
| `packed_by` | FK | Yes | Packer |
| `packed_at` | datetime | No | When packed |

### 5.3 Pack Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pack_id` | FK | Yes | Parent pack |
| `lp_id` | FK | Yes | LP in package |
| `quantity` | decimal | Yes | Qty in package |

### 5.4 Packing UI

#### Pack Station
- Select shipment
- Show picked items
- Scan items into packages
- Weigh package
- Print label
- Complete pack

---

## 6. Scanner Shipping Workflows

### 6.1 Scanner Pick Workflow

```
Step 1: Select Pick List
├── Scan pick number OR
├── Select from assigned list
└── Show pick summary

Step 2: Pick Items (repeat for each)
├── Show: Product, Qty, Location
├── Navigate to location
├── Scan LP
├── Validate: Product, QA Status, Qty
├── Enter picked qty (default: required)
├── Confirm

Step 3: Handle Shorts
├── If LP not available
├── Mark as short OR
├── Select alternative LP
└── Continue

Step 4: Complete Pick
├── Review picked items
├── Confirm completion
├── Print summary
└── Ready for packing
```

### 6.2 Scanner Pack Workflow

```
Step 1: Select Shipment
├── Scan shipment number
└── Show items to pack

Step 2: Create Package
├── Select package type
├── Start scanning items

Step 3: Scan Items
├── Scan LP
├── Validate against shipment
├── Add to package
├── Continue until complete

Step 4: Complete Package
├── Enter weight
├── Print shipping label
├── Attach to package
└── Close package

Step 5: Complete Shipment
├── All packages done
├── Print packing slip
├── Mark as shipped
└── Enter tracking number
```

### 6.3 Scanner Ship Verification

```
Step 1: Scan Shipment/Package
├── Display: Carrier, Tracking, Contents

Step 2: Verify Packages
├── Scan each package
├── Confirm count
└── Mark verified

Step 3: Dispatch
├── Hand to carrier
├── Capture signature (optional)
├── Mark as shipped
└── Send notification
```

---

## 7. Shipping Documents

### 7.1 Document Types

| Document | Description | When Generated |
|----------|-------------|----------------|
| Pick List | Items to pick with locations | On pick creation |
| Packing Slip | Contents of shipment | On pack complete |
| Shipping Label | Package label with barcode | On pack |
| Bill of Lading | Carrier document | On ship |
| Commercial Invoice | For international | On request |
| Certificate of Origin | For international | On request |

### 7.2 Document Content

#### Packing Slip
- Shipment number
- Customer info
- Ship-to address
- Line items: Product, Qty, Lot/Batch
- Total packages and weight
- Shipping method

#### Shipping Label
- Carrier logo
- Tracking barcode
- Ship-to address
- Ship-from address
- Weight
- Service type

---

## 8. Carrier Integration

### 8.1 Supported Carriers (Phase 2)
- FedEx
- UPS
- DHL
- Local carriers

### 8.2 Integration Features
- Rate shopping
- Label generation
- Tracking updates
- Pickup scheduling
- Returns management

### 8.3 Current (Phase 1)
- Manual carrier entry
- Manual tracking entry
- Label template printing
- External carrier tracking

---

## 9. Reports

### 9.1 Available Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Open Orders | Unshipped SOs | Date, Customer, Priority |
| Pick Performance | Picker productivity | Date, User, Warehouse |
| On-Time Shipping | % shipped on time | Date, Customer |
| Backorder Report | Items on backorder | Product, Customer |
| Shipping Summary | Daily/weekly shipments | Date, Carrier |
| Carrier Analysis | Performance by carrier | Date, Carrier |

### 9.2 Export
- PDF: Formatted reports
- Excel: Data analysis
- Email: Scheduled reports

---

## 10. Database Tables

```sql
-- Sales Orders
CREATE TABLE so_header (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    so_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    requested_date DATE NOT NULL,
    promised_date DATE,
    ship_to_address TEXT NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'normal',
    shipping_method VARCHAR(50),
    carrier VARCHAR(100),
    notes TEXT,
    total_value DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, so_number)
);

-- SO Lines
CREATE TABLE so_line (
    id SERIAL PRIMARY KEY,
    so_id INTEGER NOT NULL REFERENCES so_header(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    picked_qty DECIMAL(15,4) DEFAULT 0,
    shipped_qty DECIMAL(15,4) DEFAULT 0,
    unit_price DECIMAL(15,4),
    line_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT
);

-- Shipments
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    shipment_number VARCHAR(50) NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    ship_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    weight_kg DECIMAL(10,2),
    package_count INTEGER,
    shipping_cost DECIMAL(15,2),
    pod_date TIMESTAMP,
    pod_signature VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, shipment_number)
);

-- Shipment Items
CREATE TABLE shipment_items (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id),
    so_line_id INTEGER NOT NULL REFERENCES so_line(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(15,4) NOT NULL,
    lp_id INTEGER REFERENCES license_plates(id),
    pallet_id INTEGER REFERENCES pallets(id)
);

-- Pick Lists
CREATE TABLE pick_lists (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    pick_number VARCHAR(50) NOT NULL,
    shipment_id INTEGER REFERENCES shipments(id),
    so_id INTEGER REFERENCES so_header(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES auth.users(id),
    priority VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(org_id, pick_number)
);

-- Pick Items
CREATE TABLE pick_items (
    id SERIAL PRIMARY KEY,
    pick_id INTEGER NOT NULL REFERENCES pick_lists(id),
    so_line_id INTEGER NOT NULL REFERENCES so_line(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    required_qty DECIMAL(15,4) NOT NULL,
    picked_qty DECIMAL(15,4) DEFAULT 0,
    from_location_id INTEGER NOT NULL REFERENCES locations(id),
    lp_id INTEGER REFERENCES license_plates(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
);

-- Packages
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    pack_number VARCHAR(50) NOT NULL,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id),
    package_type VARCHAR(50),
    weight_kg DECIMAL(10,2),
    dimensions VARCHAR(50),
    tracking_number VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'packing',
    packed_by UUID REFERENCES auth.users(id),
    packed_at TIMESTAMP,
    UNIQUE(org_id, pack_number)
);

-- Package Items
CREATE TABLE package_items (
    id SERIAL PRIMARY KEY,
    pack_id INTEGER NOT NULL REFERENCES packages(id),
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    quantity DECIMAL(15,4) NOT NULL
);

-- Shipping Settings
CREATE TABLE shipping_settings (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) UNIQUE,
    enable_shipping_module BOOLEAN DEFAULT true,
    require_sales_order BOOLEAN DEFAULT true,
    enable_wave_picking BOOLEAN DEFAULT false,
    enable_zone_picking BOOLEAN DEFAULT false,
    enable_batch_picking BOOLEAN DEFAULT false,
    picking_strategy VARCHAR(20) DEFAULT 'fifo',
    enable_pack_station BOOLEAN DEFAULT true,
    enable_carrier_integration BOOLEAN DEFAULT false,
    default_carrier VARCHAR(100),
    auto_generate_tracking BOOLEAN DEFAULT false,
    require_qa_passed BOOLEAN DEFAULT true,
    enable_proof_of_delivery BOOLEAN DEFAULT false,
    enable_partial_shipment BOOLEAN DEFAULT true,
    enable_backorder BOOLEAN DEFAULT true,
    enable_shipping_labels BOOLEAN DEFAULT true,
    enable_packing_slip BOOLEAN DEFAULT true,
    enable_bill_of_lading BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Sales Orders
CREATE INDEX idx_so_org_status ON so_header(org_id, status);
CREATE INDEX idx_so_customer ON so_header(customer_id);
CREATE INDEX idx_so_date ON so_header(requested_date);

-- Shipments
CREATE INDEX idx_shipment_org_status ON shipments(org_id, status);
CREATE INDEX idx_shipment_date ON shipments(ship_date);

-- Pick Lists
CREATE INDEX idx_pick_org_status ON pick_lists(org_id, status);
CREATE INDEX idx_pick_assigned ON pick_lists(assigned_to);

-- Packages
CREATE INDEX idx_package_shipment ON packages(shipment_id);
```

---

## 11. API Endpoints

### Sales Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales-orders` | List SOs with filters |
| GET | `/api/sales-orders/:id` | Get SO details |
| POST | `/api/sales-orders` | Create SO |
| PUT | `/api/sales-orders/:id` | Update SO |
| POST | `/api/sales-orders/:id/confirm` | Confirm SO |
| POST | `/api/sales-orders/:id/cancel` | Cancel SO |

### Shipments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments` | List shipments |
| GET | `/api/shipments/:id` | Get shipment details |
| POST | `/api/shipments` | Create shipment |
| PUT | `/api/shipments/:id` | Update shipment |
| POST | `/api/shipments/:id/ship` | Mark as shipped |
| POST | `/api/shipments/:id/deliver` | Mark as delivered |

### Picking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pick-lists` | List pick lists |
| GET | `/api/pick-lists/:id` | Get pick details |
| POST | `/api/pick-lists` | Generate pick list |
| PUT | `/api/pick-lists/:id/assign` | Assign picker |
| PUT | `/api/pick-lists/:id/start` | Start picking |
| PUT | `/api/pick-items/:id` | Update picked qty |
| POST | `/api/pick-lists/:id/complete` | Complete pick |

### Packing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List packages |
| POST | `/api/packages` | Create package |
| POST | `/api/packages/:id/items` | Add item to package |
| POST | `/api/packages/:id/complete` | Complete package |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments/:id/packing-slip` | Generate packing slip |
| GET | `/api/packages/:id/label` | Generate shipping label |
| GET | `/api/shipments/:id/bol` | Generate bill of lading |

### Shipping Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipping-settings` | Get settings |
| PUT | `/api/shipping-settings` | Update settings |

---

## 12. Functional Requirements

### Sales Orders

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-01 | System shall create sales orders with customer and items | Must |
| SH-FR-02 | System shall track SO status through fulfillment | Must |
| SH-FR-03 | System shall support SO line-level status | Must |
| SH-FR-04 | System shall calculate available inventory for SO | Should |

### Shipments

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-05 | System shall create shipments from SOs | Must |
| SH-FR-06 | System shall consolidate multiple SOs into one shipment | Should |
| SH-FR-07 | System shall track shipment status | Must |
| SH-FR-08 | System shall record carrier and tracking | Must |

### Picking

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-09 | System shall generate pick lists from SOs/shipments | Must |
| SH-FR-10 | System shall suggest LPs based on picking strategy | Must |
| SH-FR-11 | System shall support picker assignment | Should |
| SH-FR-12 | System shall handle pick shorts | Must |
| SH-FR-13 | System shall update SO qty picked | Must |
| SH-FR-14 | System shall only allow picking QA passed LPs | Must |

### Packing

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-15 | System shall create packages for shipments | Should |
| SH-FR-16 | System shall track items in each package | Should |
| SH-FR-17 | System shall record package weight | Should |

### Documents

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-18 | System shall generate pick lists | Must |
| SH-FR-19 | System shall generate packing slips | Must |
| SH-FR-20 | System shall generate shipping labels | Must |
| SH-FR-21 | System shall support label printing | Must |

### Scanner

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-22 | Scanner shall support picking workflow | Must |
| SH-FR-23 | Scanner shall support packing workflow | Should |
| SH-FR-24 | Scanner shall validate scanned items | Must |

### Reports

| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-25 | System shall report on open orders | Must |
| SH-FR-26 | System shall report on shipping performance | Should |

---

## 13. Integration Points

### With Warehouse Module
- Pick from LP inventory
- Update LP status on pick
- Move LP to shipping location

### With Quality Module
- Only pick/ship QA passed LPs
- Validate QA status during pick

### With Technical Module
- Product info for pick/pack

### With Planning Module
- PO creates expected inventory
- WO produces shippable goods

---

## Status
- **Module Version**: 1.0
- **Last Updated**: 2025-11-19
- **Status**: Draft - Pending Review
- **Progress**: 0% (Clean Slate)
