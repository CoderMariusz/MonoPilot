# Warehouse & Scanner Module PRD

## Overview

The Warehouse & Scanner module manages all physical inventory operations including goods receipt, license plate management, stock movements, and pallet handling. This is the critical bridge between Planning (PO/TO/WO) and Production, with Scanner providing mobile terminal access for shop floor operations.

### Dependencies
- **Settings Module**: Warehouses, Locations, Machine/Production Line
- **Technical Module**: Products (for LP product reference)
- **Planning Module**: PO, TO, WO (source for receiving and consumption)
- **Production Module**: Material consumption, output registration

### Key Concepts
- **License Plate (LP)**: Atomic unit of inventory - no loose qty tracking
- **ASN**: Advanced Shipping Notice - pre-notification of incoming delivery
- **GRN**: Goods Receipt Note - receipt document creating LPs
- **Pallet**: Packaging unit containing multiple LPs

---

## 1. Warehouse Settings

All Warehouse/Scanner features are controlled via Settings toggles. This allows different organizations to enable only features they need.

### 1.1 Configuration Table

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_asn` | boolean | false | Enable ASN receiving workflow |
| `auto_generate_lp_number` | boolean | true | Auto-generate LP numbers or manual entry |
| `lp_number_prefix` | string | "LP" | Prefix for generated LP numbers |
| `lp_number_sequence_length` | integer | 8 | Length of sequence portion |
| `enable_pallets` | boolean | false | Enable pallet management |
| `enable_split_merge` | boolean | true | Allow LP split/merge operations |
| `require_qa_on_receipt` | boolean | true | Require QA status assignment on receipt |
| `default_qa_status` | enum | "pending" | Default QA status for new LPs |
| `enable_expiry_tracking` | boolean | true | Track expiry dates on LPs |
| `require_expiry_on_receipt` | boolean | false | Make expiry mandatory during receipt |
| `enable_batch_tracking` | boolean | true | Track batch numbers on LPs |
| `require_batch_on_receipt` | boolean | false | Make batch mandatory during receipt |
| `enable_supplier_batch` | boolean | true | Track supplier's batch number separately |
| `allow_over_receipt` | boolean | false | Allow receiving more than ordered |
| `over_receipt_tolerance_pct` | decimal | 0 | % over-receipt allowed if enabled |
| `enable_location_zones` | boolean | false | Enable zone-based organization |
| `enable_location_capacity` | boolean | false | Track location capacity |
| `enable_fifo` | boolean | true | FIFO inventory management |
| `enable_fefo` | boolean | false | FEFO (expiry-based) inventory management |
| `enable_transit_location` | boolean | true | Use transit locations for TO |
| `scanner_idle_timeout_sec` | integer | 300 | Scanner session timeout |
| `scanner_sound_feedback` | boolean | true | Enable sound feedback on scanner |
| `print_label_on_receipt` | boolean | true | Auto-print LP label on receipt |
| `label_copies_default` | integer | 1 | Default number of label copies |

---

## 2. License Plates (LP)

### 2.1 LP Concept
License Plate is the fundamental tracking unit. All inventory exists as LP - there is no "loose quantity". This enables full traceability from raw material receipt through production to finished goods.

### 2.2 LP Fields

| Field | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `lp_number` | string | Yes | Auto/Manual | Unique identifier (scannable barcode) |
| `product_id` | FK | Yes | GRN/WO | Product reference |
| `quantity` | decimal | Yes | Receipt/Production | Current quantity |
| `uom` | string | Yes | Product | Unit of measure (from product) |
| `location_id` | FK | Yes | Receipt/Move | Current physical location |
| `warehouse_id` | FK | Yes | Location | Warehouse (denormalized for queries) |
| `status` | enum | Yes | System | available, reserved, consumed, blocked |
| `qa_status` | enum | Yes | Receipt/QC | pending, passed, failed, quarantine |
| `batch_number` | string | Toggle | Receipt | Internal batch number |
| `supplier_batch_number` | string | Toggle | Receipt | Supplier's batch number |
| `expiry_date` | date | Toggle | Receipt | Expiration date |
| `manufacture_date` | date | No | Receipt | Manufacturing date |
| `po_number` | string | No | GRN | Source PO reference |
| `grn_id` | FK | No | Receipt | Source GRN |
| `wo_id` | FK | No | Production | Source WO (if output) |
| `parent_lp_id` | FK | No | Split/Merge | Parent LP reference |
| `consumed_by_wo_id` | FK | No | Production | WO that consumed this LP |
| `pallet_id` | FK | No | Pack | Pallet assignment |

### 2.3 LP Status Lifecycle

```
[Receipt] → available
              ↓
          reserved (for WO/TO)
              ↓
          consumed (fully used) OR available (partial unreserve)

[Any Status] → blocked (QC hold, damage, etc.)
```

### 2.4 QA Status

| Status | Description | Can Ship | Can Consume |
|--------|-------------|----------|-------------|
| pending | Awaiting QA inspection | No | Settings toggle |
| passed | QA approved | Yes | Yes |
| failed | QA rejected | No | No |
| quarantine | Under investigation | No | No |

### 2.5 LP UI Components

#### LP List View
- Filter by: Warehouse, Location, Product, Status, QA Status, Expiry range
- Columns: LP Number, Product, Qty, UoM, Location, Status, QA, Expiry, Batch
- Actions: View Details, Move, Split, Merge (if enabled), Block/Unblock
- Bulk actions: Print Labels, Move to Location, Change QA Status

#### LP Detail Modal
- All LP fields (read-only for system fields)
- Genealogy section: Parent LP, Child LPs
- Movement history timeline
- Reservations list
- Actions: Edit (limited fields), Print Label

### 2.6 LP Number Generation
```
Format: {prefix}{YYMMDD}{sequence}
Example: LP250115-00000001

If manual: User enters, system validates uniqueness
```

---

## 3. ASN (Advanced Shipping Notice)

### 3.1 ASN Concept
ASN is a pre-notification from supplier about incoming delivery. When enabled, it pre-fills the receiving process with expected quantities, LP numbers (if supplier provides), and expiry dates.

### 3.2 ASN Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asn_number` | string | Yes | Unique ASN identifier |
| `po_id` | FK | Yes | Related Purchase Order |
| `supplier_id` | FK | Yes | Supplier (from PO) |
| `expected_date` | date | Yes | Expected delivery date |
| `actual_date` | date | No | Actual delivery date |
| `carrier` | string | No | Carrier/shipper name |
| `tracking_number` | string | No | Carrier tracking number |
| `status` | enum | Yes | pending, received, partial, cancelled |
| `notes` | text | No | Additional notes |

### 3.3 ASN Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | FK | Yes | Product |
| `po_line_id` | FK | Yes | Related PO line |
| `expected_qty` | decimal | Yes | Expected quantity |
| `received_qty` | decimal | No | Actually received |
| `uom` | string | Yes | Unit of measure |
| `supplier_lp_number` | string | No | Supplier's LP number |
| `supplier_batch_number` | string | No | Supplier's batch |
| `expiry_date` | date | No | Expiry date if provided |

### 3.4 ASN UI

#### ASN List View
- Filter by: Status, Supplier, Date range
- Columns: ASN Number, PO, Supplier, Expected Date, Status, Items count
- Actions: View, Receive, Cancel

#### ASN Detail View
- Header information
- Items table with expected vs received
- Link to source PO
- Actions: Start Receive, Print Packing List

### 3.5 ASN Status Flow
```
pending → received (all items)
        → partial (some items pending)
        → cancelled
```

---

## 4. GRN (Goods Receipt Note)

### 4.1 GRN Concept
GRN is the receipt document that records actual goods received and creates License Plates. It can be created from PO, TO, or ASN.

### 4.2 GRN Fields

| Field | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `grn_number` | string | Yes | Auto | Unique GRN identifier |
| `source_type` | enum | Yes | User | po, to, return |
| `po_id` | FK | Conditional | User | If source = PO |
| `to_id` | FK | Conditional | User | If source = TO |
| `asn_id` | FK | No | User | If receiving from ASN |
| `supplier_id` | FK | Conditional | PO | From PO if applicable |
| `receipt_date` | datetime | Yes | System | When received |
| `warehouse_id` | FK | Yes | User | Receiving warehouse |
| `location_id` | FK | Yes | User | Default receiving location |
| `status` | enum | Yes | System | draft, completed, cancelled |
| `received_by` | FK | Yes | System | User who received |
| `notes` | text | No | User | Receipt notes |

### 4.3 GRN Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | FK | Yes | Product received |
| `po_line_id` | FK | No | Related PO line |
| `ordered_qty` | decimal | Yes | Expected quantity |
| `received_qty` | decimal | Yes | Actually received |
| `uom` | string | Yes | Unit of measure |
| `lp_number` | string | Yes | Created LP number |
| `batch_number` | string | Toggle | Batch number |
| `supplier_batch_number` | string | Toggle | Supplier's batch |
| `expiry_date` | date | Toggle | Expiry date |
| `manufacture_date` | date | No | Manufacturing date |
| `location_id` | FK | Yes | Storage location |
| `qa_status` | enum | Yes | Initial QA status |
| `notes` | text | No | Item notes |

### 4.4 GRN UI

#### Desktop Receive Workflow
1. **Select Source**
   - Choose PO or TO
   - If PO: Show pending POs for receiving
   - If TO: Show in-transit TOs
   - If ASN enabled: Show pending ASNs

2. **Header Entry**
   - Auto-fill: Supplier, Warehouse (from PO/TO)
   - User selects: Location (default from warehouse settings)
   - Date: Current datetime

3. **Items Entry**
   - Pre-filled from source document
   - User enters for each line:
     - Received Qty (validate against ordered)
     - Batch Number (if enabled)
     - Supplier Batch (if enabled)
     - Expiry Date (if enabled)
     - Location (can override default)
     - QA Status (if required)
   - LP Number: Auto-generated or manual based on settings
   - Can split line into multiple LPs

4. **Validation**
   - No over-receipt unless allowed by settings
   - Required fields based on toggles
   - UoM matches source

5. **Complete**
   - Creates GRN record
   - Creates LP for each item
   - Updates PO/TO line received qty
   - Prints labels (if enabled)

#### GRN List View
- Filter by: Status, Date range, Supplier, Warehouse
- Columns: GRN Number, Date, Source, Supplier, Items, Status
- Actions: View Details, Print

### 4.5 Receipt Validation Rules

| Rule | Condition | Action |
|------|-----------|--------|
| Over-receipt | received_qty > ordered_qty | Block or allow based on settings |
| Under-receipt | received_qty < ordered_qty | Allow, partial receipt |
| UoM mismatch | item.uom != source.uom | Block |
| Expiry required | setting ON, expiry null | Block |
| Batch required | setting ON, batch null | Block |
| Short shipment | received_qty = 0 | Allow, mark line as not received |

---

## 5. Stock Movements

### 5.1 Movement Types

| Type | Description | From | To |
|------|-------------|------|-----|
| TRANSFER | Location to location move | Location | Location |
| ISSUE | Issue to production (WO) | Location | Production |
| RECEIPT | Receive from production | Production | Location |
| ADJUSTMENT | Inventory adjustment | - | - |
| RETURN | Return to supplier | Location | Transit |
| QUARANTINE | Move to quarantine | Location | Quarantine Location |

### 5.2 Movement Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `move_number` | string | Yes | Unique identifier |
| `lp_id` | FK | Yes | License Plate |
| `move_type` | enum | Yes | Type of movement |
| `from_location_id` | FK | Conditional | Source location |
| `to_location_id` | FK | Conditional | Destination location |
| `quantity` | decimal | Yes | Moved quantity |
| `move_date` | datetime | Yes | When moved |
| `status` | enum | Yes | draft, completed, cancelled |
| `reason` | string | No | Reason for move |
| `moved_by` | FK | Yes | User who moved |
| `wo_id` | FK | No | Related WO (for ISSUE/RECEIPT) |

### 5.3 Movement UI

#### Create Movement (Desktop)
1. Scan or select LP
2. Choose move type
3. Select destination location
4. Enter quantity (full LP or partial)
5. Add reason (optional)
6. Confirm

#### Movement List View
- Filter by: Type, Date range, Location, Product
- Columns: Move Number, LP, Product, From, To, Qty, Type, Date
- Actions: View Details

### 5.4 Movement Validation
- LP must have sufficient quantity
- Destination location must be active
- FIFO/FEFO validation (optional)
- Capacity check on destination (if enabled)

---

## 6. Split / Merge Operations

### 6.1 Split LP

Split one LP into multiple LPs (e.g., for partial consumption or multi-location storage).

#### Split Process
1. Select source LP
2. Enter quantity for new LP
3. Optionally select different location for new LP
4. New LP inherits: product, batch, expiry, all tracking info
5. Records genealogy (parent_lp_id)

#### Split UI
- Source LP info displayed
- Enter split quantity (must be < current qty)
- New LP number: auto-generated
- Location: same or different
- Confirm button

### 6.2 Merge LPs

Combine multiple LPs into one (must be same product/UoM/batch).

#### Merge Rules
- Same product_id
- Same uom
- Same batch_number (or all null)
- Same qa_status
- Same expiry_date (or within tolerance)

#### Merge Process
1. Select primary LP (will keep this LP number)
2. Add LPs to merge
3. Validate merge rules
4. New quantity = sum of all
5. Location = primary LP location
6. Records genealogy for all merged LPs

#### Merge UI
- Primary LP selection
- Add additional LPs (filtered by merge rules)
- Shows total quantity
- Validation errors if rules violated
- Confirm button

---

## 7. Pallet Management

### 7.1 Pallet Concept
Pallets are packaging units containing multiple License Plates. Useful for shipping, storage in pallet locations, and handling units.

### 7.2 Pallet Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pallet_number` | string | Yes | Unique identifier (SSCC) |
| `pallet_type` | string | No | EUR, Standard, Custom |
| `location_id` | FK | Yes | Current location |
| `status` | enum | Yes | open, closed, shipped |
| `weight_kg` | decimal | No | Total weight |
| `created_date` | datetime | Yes | When created |
| `closed_date` | datetime | No | When closed |
| `shipped_date` | datetime | No | When shipped |
| `created_by` | FK | Yes | User who created |

### 7.3 Pallet Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pallet_id` | FK | Yes | Parent pallet |
| `lp_id` | FK | Yes | License Plate on pallet |
| `added_date` | datetime | Yes | When added to pallet |
| `sequence` | integer | No | Stacking sequence |

### 7.4 Pallet Operations

#### Create Pallet
1. Generate pallet number (SSCC format or custom)
2. Select location
3. Add LPs to pallet
4. Print pallet label

#### Add LP to Pallet
- Scan pallet
- Scan LP
- LP moves to pallet's location
- LP.pallet_id updated

#### Remove LP from Pallet
- Scan pallet
- Select LP to remove
- LP.pallet_id set to null

#### Close Pallet
- No more LPs can be added
- Ready for shipping

#### Move Pallet
- All LPs on pallet move together
- Creates stock_move for each LP

### 7.5 Pallet UI

#### Pallet List View
- Filter by: Status, Location, Date range
- Columns: Pallet Number, Location, LPs count, Status, Date
- Actions: View, Add LP, Close, Print Label

#### Pallet Detail View
- Pallet information
- LPs list with product, qty, batch
- Total weight
- Actions: Add LP, Remove LP, Close, Print

---

## 8. Scanner Workflows

Scanner provides mobile terminal interface for shop floor operations. Each workflow is step-based with validation at each step.

### 8.1 Scanner Home Screen
- User login (badge scan or PIN)
- Menu options based on user role:
  - Receive (PO/TO)
  - Move
  - Split
  - Merge (if enabled)
  - Pack (if pallets enabled)
  - Production (links to Production module scanner)

### 8.2 Scanner Receive Workflow

```
Step 1: Select Source
├── Scan PO/TO barcode OR
├── Select from list (recent POs/TOs)
└── If ASN: Show pending ASNs

Step 2: Select Line (if multiple products)
├── Show pending lines
└── Select line to receive

Step 3: Enter Receipt Details
├── Scan/Enter Batch Number (if enabled)
├── Scan/Enter Supplier Batch (if enabled)
├── Enter Expiry Date (if enabled)
├── Enter Received Qty
└── Select Location (default pre-filled)

Step 4: Validate
├── Check over-receipt
├── Validate required fields
└── Show warnings/errors

Step 5: Confirm & Print
├── Create GRN + LP
├── Print label (if enabled)
├── Option to receive more items
└── Done → Return to Step 1
```

### 8.3 Scanner Move Workflow

```
Step 1: Scan LP
├── Display: Product, Qty, Current Location
└── Validate: LP exists, available

Step 2: Scan Destination
├── Scan location barcode OR
├── Select from list (by warehouse/zone)
└── Validate: Location active

Step 3: Enter Quantity (optional)
├── Default: Full LP quantity
├── Can enter partial → triggers Split
└── Validate: qty <= available

Step 4: Confirm Move
├── Show summary
├── Create stock_move
├── Update LP location
└── Sound feedback
```

### 8.4 Scanner Split Workflow

```
Step 1: Scan LP
├── Display: Product, Qty, Location
└── Validate: LP exists, available

Step 2: Enter Split Quantity
├── Enter qty for new LP
├── Validate: < current qty
└── Show remaining qty

Step 3: Select Location (optional)
├── Same as source (default)
├── Or scan different location
└── Validate

Step 4: Confirm Split
├── Create new LP
├── Update source LP qty
├── Record genealogy
├── Print new LP label
└── Sound feedback
```

### 8.5 Scanner Merge Workflow

```
Step 1: Scan Primary LP
├── Display: Product, Qty, Batch, Expiry
└── This LP number will remain

Step 2: Scan Additional LPs
├── Scan each LP to merge
├── Validate: Same product/uom/batch/expiry
├── Show running total
├── Continue scanning or proceed
└── Can remove scanned LPs

Step 3: Confirm Merge
├── Show summary: X LPs → 1 LP
├── Total quantity
├── Update quantities
├── Record genealogy for all
└── Sound feedback
```

### 8.6 Scanner Pack (Pallet) Workflow

```
Step 1: Scan/Create Pallet
├── Scan existing pallet barcode OR
├── Create new pallet
└── Display: Pallet status, LPs count

Step 2: Add LPs
├── Scan LP barcode
├── Validate: LP available
├── Add to pallet
├── Show running count/weight
├── Continue scanning
└── Option: Remove LP

Step 3: Complete
├── Close pallet (optional)
├── Print pallet label
└── Return to menu
```

### 8.7 Scanner UI Patterns

- **Large buttons** for touch operation
- **High contrast** display
- **Sound feedback** for success/error
- **Scan indicator** (green flash on scan)
- **Back button** on every screen
- **Timeout warning** before session expiry
- **Offline mode** (queue operations for sync)

---

## 9. LP Genealogy

### 9.1 Genealogy Concept
Full traceability of LP relationships through split, merge, and consumption operations.

### 9.2 Genealogy Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | Unique record ID |
| `parent_lp_id` | FK | Source LP |
| `child_lp_id` | FK | Result LP |
| `operation_type` | enum | split, merge, consume, output |
| `quantity` | decimal | Quantity involved |
| `operation_date` | datetime | When occurred |
| `wo_id` | FK | Related WO (for consume/output) |
| `operation_id` | FK | Related WO operation |

### 9.3 Genealogy Operations

| Operation | Parent | Child | Notes |
|-----------|--------|-------|-------|
| Split | Source LP | New LP | Parent qty reduced |
| Merge | Each merged LP | Primary LP | Parents marked consumed |
| Consume | Material LP | Output LP | Via WO |
| Output | Consumed LPs | New FG LP | Via WO production_output |

---

## 10. Database Tables

### Core Tables

```sql
-- License Plates
CREATE TABLE license_plates (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    lp_number VARCHAR(50) NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    qa_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    batch_number VARCHAR(100),
    supplier_batch_number VARCHAR(100),
    expiry_date DATE,
    manufacture_date DATE,
    po_number VARCHAR(50),
    grn_id INTEGER REFERENCES grns(id),
    wo_id INTEGER REFERENCES work_orders(id),
    parent_lp_id INTEGER REFERENCES license_plates(id),
    consumed_by_wo_id INTEGER REFERENCES work_orders(id),
    pallet_id INTEGER REFERENCES pallets(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, lp_number)
);

-- ASN (Advanced Shipping Notice)
CREATE TABLE asns (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    asn_number VARCHAR(50) NOT NULL,
    po_id INTEGER NOT NULL REFERENCES po_header(id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    expected_date DATE NOT NULL,
    actual_date DATE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, asn_number)
);

-- ASN Items
CREATE TABLE asn_items (
    id SERIAL PRIMARY KEY,
    asn_id INTEGER NOT NULL REFERENCES asns(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    po_line_id INTEGER REFERENCES po_line(id),
    expected_qty DECIMAL(15,4) NOT NULL,
    received_qty DECIMAL(15,4) DEFAULT 0,
    uom VARCHAR(20) NOT NULL,
    supplier_lp_number VARCHAR(100),
    supplier_batch_number VARCHAR(100),
    expiry_date DATE
);

-- GRN (Goods Receipt Note)
CREATE TABLE grns (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    grn_number VARCHAR(50) NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    po_id INTEGER REFERENCES po_header(id),
    to_id INTEGER REFERENCES to_header(id),
    asn_id INTEGER REFERENCES asns(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    receipt_date TIMESTAMP NOT NULL DEFAULT NOW(),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    received_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, grn_number)
);

-- GRN Items
CREATE TABLE grn_items (
    id SERIAL PRIMARY KEY,
    grn_id INTEGER NOT NULL REFERENCES grns(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    po_line_id INTEGER REFERENCES po_line(id),
    ordered_qty DECIMAL(15,4) NOT NULL,
    received_qty DECIMAL(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    lp_id INTEGER REFERENCES license_plates(id),
    batch_number VARCHAR(100),
    supplier_batch_number VARCHAR(100),
    expiry_date DATE,
    manufacture_date DATE,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    qa_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT
);

-- Stock Movements
CREATE TABLE stock_moves (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    move_number VARCHAR(50) NOT NULL,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    move_type VARCHAR(20) NOT NULL,
    from_location_id INTEGER REFERENCES locations(id),
    to_location_id INTEGER REFERENCES locations(id),
    quantity DECIMAL(15,4) NOT NULL,
    move_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    reason VARCHAR(255),
    wo_id INTEGER REFERENCES work_orders(id),
    moved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, move_number)
);

-- LP Genealogy
CREATE TABLE lp_genealogy (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    parent_lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    child_lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    operation_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    operation_date TIMESTAMP NOT NULL DEFAULT NOW(),
    wo_id INTEGER REFERENCES work_orders(id),
    operation_id INTEGER REFERENCES wo_operations(id)
);

-- LP Compositions (for merge tracking)
CREATE TABLE lp_compositions (
    id SERIAL PRIMARY KEY,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    source_lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    quantity DECIMAL(15,4) NOT NULL,
    merge_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LP Reservations
CREATE TABLE lp_reservations (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    wo_id INTEGER NOT NULL REFERENCES work_orders(id),
    reserved_qty DECIMAL(15,4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    released_at TIMESTAMP,
    reserved_by UUID REFERENCES auth.users(id)
);

-- Pallets
CREATE TABLE pallets (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    pallet_number VARCHAR(50) NOT NULL,
    pallet_type VARCHAR(50),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    weight_kg DECIMAL(10,2),
    created_date TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_date TIMESTAMP,
    shipped_date TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, pallet_number)
);

-- Pallet Items
CREATE TABLE pallet_items (
    id SERIAL PRIMARY KEY,
    pallet_id INTEGER NOT NULL REFERENCES pallets(id),
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    added_date TIMESTAMP NOT NULL DEFAULT NOW(),
    sequence INTEGER
);

-- Warehouse Settings
CREATE TABLE warehouse_settings (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) UNIQUE,
    enable_asn BOOLEAN DEFAULT false,
    auto_generate_lp_number BOOLEAN DEFAULT true,
    lp_number_prefix VARCHAR(10) DEFAULT 'LP',
    lp_number_sequence_length INTEGER DEFAULT 8,
    enable_pallets BOOLEAN DEFAULT false,
    enable_split_merge BOOLEAN DEFAULT true,
    require_qa_on_receipt BOOLEAN DEFAULT true,
    default_qa_status VARCHAR(20) DEFAULT 'pending',
    enable_expiry_tracking BOOLEAN DEFAULT true,
    require_expiry_on_receipt BOOLEAN DEFAULT false,
    enable_batch_tracking BOOLEAN DEFAULT true,
    require_batch_on_receipt BOOLEAN DEFAULT false,
    enable_supplier_batch BOOLEAN DEFAULT true,
    allow_over_receipt BOOLEAN DEFAULT false,
    over_receipt_tolerance_pct DECIMAL(5,2) DEFAULT 0,
    enable_location_zones BOOLEAN DEFAULT false,
    enable_location_capacity BOOLEAN DEFAULT false,
    enable_fifo BOOLEAN DEFAULT true,
    enable_fefo BOOLEAN DEFAULT false,
    enable_transit_location BOOLEAN DEFAULT true,
    scanner_idle_timeout_sec INTEGER DEFAULT 300,
    scanner_sound_feedback BOOLEAN DEFAULT true,
    print_label_on_receipt BOOLEAN DEFAULT true,
    label_copies_default INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- License Plates
CREATE INDEX idx_lp_org_product ON license_plates(org_id, product_id);
CREATE INDEX idx_lp_org_location ON license_plates(org_id, location_id);
CREATE INDEX idx_lp_org_status ON license_plates(org_id, status);
CREATE INDEX idx_lp_org_batch ON license_plates(org_id, batch_number);
CREATE INDEX idx_lp_expiry ON license_plates(expiry_date);

-- GRNs
CREATE INDEX idx_grn_org_date ON grns(org_id, receipt_date);
CREATE INDEX idx_grn_po ON grns(po_id);
CREATE INDEX idx_grn_to ON grns(to_id);

-- Stock Moves
CREATE INDEX idx_stock_moves_lp ON stock_moves(lp_id);
CREATE INDEX idx_stock_moves_date ON stock_moves(org_id, move_date);

-- Genealogy
CREATE INDEX idx_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_genealogy_child ON lp_genealogy(child_lp_id);

-- Reservations
CREATE INDEX idx_reservations_lp ON lp_reservations(lp_id);
CREATE INDEX idx_reservations_wo ON lp_reservations(wo_id);
```

---

## 11. API Endpoints

### License Plates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/license-plates` | List LPs with filters |
| GET | `/api/license-plates/:id` | Get LP details |
| POST | `/api/license-plates` | Create LP (usually via GRN) |
| PUT | `/api/license-plates/:id` | Update LP (limited fields) |
| POST | `/api/license-plates/:id/split` | Split LP |
| POST | `/api/license-plates/merge` | Merge multiple LPs |
| PUT | `/api/license-plates/:id/block` | Block LP |
| PUT | `/api/license-plates/:id/unblock` | Unblock LP |
| GET | `/api/license-plates/:id/genealogy` | Get LP genealogy |
| GET | `/api/license-plates/:id/history` | Get LP movement history |
| POST | `/api/license-plates/:id/print-label` | Print LP label |

### ASN

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/asns` | List ASNs with filters |
| GET | `/api/asns/:id` | Get ASN details |
| POST | `/api/asns` | Create ASN |
| PUT | `/api/asns/:id` | Update ASN |
| DELETE | `/api/asns/:id` | Cancel ASN |
| POST | `/api/asns/:id/receive` | Start receiving from ASN |

### GRN

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/grns` | List GRNs with filters |
| GET | `/api/grns/:id` | Get GRN details |
| POST | `/api/grns` | Create GRN and LPs |
| PUT | `/api/grns/:id` | Update GRN (draft only) |
| POST | `/api/grns/:id/complete` | Complete GRN |
| POST | `/api/grns/:id/cancel` | Cancel GRN |
| POST | `/api/grns/:id/print` | Print GRN document |

### Stock Movements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-moves` | List movements with filters |
| GET | `/api/stock-moves/:id` | Get movement details |
| POST | `/api/stock-moves` | Create movement |
| POST | `/api/stock-moves/:id/cancel` | Cancel movement |

### Pallets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pallets` | List pallets with filters |
| GET | `/api/pallets/:id` | Get pallet details |
| POST | `/api/pallets` | Create pallet |
| POST | `/api/pallets/:id/add-lp` | Add LP to pallet |
| POST | `/api/pallets/:id/remove-lp` | Remove LP from pallet |
| POST | `/api/pallets/:id/close` | Close pallet |
| POST | `/api/pallets/:id/move` | Move pallet (and all LPs) |
| POST | `/api/pallets/:id/print-label` | Print pallet label |

### Warehouse Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/warehouse-settings` | Get settings |
| PUT | `/api/warehouse-settings` | Update settings |

### Scanner Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scanner/login` | Scanner login |
| GET | `/api/scanner/pending-receipts` | Get pending POs/TOs/ASNs |
| POST | `/api/scanner/receive` | Quick receive operation |
| POST | `/api/scanner/move` | Quick move operation |
| POST | `/api/scanner/split` | Quick split operation |
| POST | `/api/scanner/merge` | Quick merge operation |
| POST | `/api/scanner/pack` | Add LP to pallet |
| GET | `/api/scanner/lp/:barcode` | Lookup LP by barcode |
| GET | `/api/scanner/location/:barcode` | Lookup location by barcode |

---

## 12. Functional Requirements

### License Plate Management

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-FR-01 | System shall create LP for every receipt with unique number | Must |
| WH-FR-02 | LP shall track quantity, location, status, QA status | Must |
| WH-FR-03 | LP shall track batch, expiry, manufacturing date when enabled | Must |
| WH-FR-04 | System shall generate LP numbers automatically or accept manual | Must |
| WH-FR-05 | System shall support LP split with genealogy tracking | Must |
| WH-FR-06 | System shall support LP merge with same product/batch/uom/expiry | Should |
| WH-FR-07 | System shall track LP genealogy (parent/child relationships) | Must |

### Receiving

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-FR-08 | System shall receive goods from PO and TO | Must |
| WH-FR-09 | System shall support ASN pre-fill for receiving when enabled | Should |
| WH-FR-10 | System shall validate over-receipt based on settings | Must |
| WH-FR-11 | System shall create GRN and LP on receipt completion | Must |
| WH-FR-12 | System shall auto-print labels on receipt when enabled | Should |
| WH-FR-13 | System shall update PO/TO line received quantity | Must |

### Stock Movements

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-FR-14 | System shall move LP between locations | Must |
| WH-FR-15 | System shall record all movements with audit trail | Must |
| WH-FR-16 | System shall support partial quantity moves (triggers split) | Must |
| WH-FR-17 | System shall validate destination location is active | Must |
| WH-FR-18 | System shall track movement types (transfer, issue, receipt, adjustment) | Must |

### Pallet Management

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-FR-19 | System shall create pallets with unique numbers when enabled | Should |
| WH-FR-20 | System shall add/remove LPs to/from pallets | Should |
| WH-FR-21 | System shall move pallet and all its LPs together | Should |
| WH-FR-22 | System shall track pallet status (open, closed, shipped) | Should |

### Scanner Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-FR-23 | Scanner shall provide step-by-step guided workflows | Must |
| WH-FR-24 | Scanner shall validate barcode scans in real-time | Must |
| WH-FR-25 | Scanner shall provide sound/visual feedback | Should |
| WH-FR-26 | Scanner shall support receive, move, split, merge, pack operations | Must |
| WH-FR-27 | Scanner shall handle session timeout based on settings | Must |

### Traceability

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-FR-28 | System shall maintain full forward/backward traceability via LP | Must |
| WH-FR-29 | System shall record genealogy for all LP operations | Must |
| WH-FR-30 | System shall link LP to source documents (PO, TO, WO, GRN) | Must |

---

## 13. Integration Points

### With Planning Module
- **PO**: Receive creates GRN + LP, updates po_line.received_qty
- **TO**: Receive updates to_line.received_qty, uses transit location

### With Production Module
- **WO Material Consumption**: Reserves and consumes LP, creates genealogy
- **WO Output**: Creates new LP from production, links to consumed materials

### With Technical Module
- **Products**: LP references product for name, UoM, expiry policy

### With Settings Module
- **Warehouses**: LP and location belong to warehouse
- **Locations**: LP current location, movement destinations

---

## 14. Label Printing

### LP Label Content
- LP Number (barcode)
- Product Name
- Quantity + UoM
- Batch Number
- Expiry Date
- Location
- QR code with LP data

### Pallet Label Content
- Pallet Number (SSCC barcode)
- Contents summary (products, quantities)
- Total weight
- Date packed
- QR code with pallet data

### Label Formats
- Supported: ZPL, PDF, PNG
- Printer integration via network or USB
- Template configuration in Settings

---

## Status
- **Module Version**: 1.0
- **Last Updated**: 2025-11-19
- **Status**: Draft - Pending Review
- **Progress**: 0% (Clean Slate)
