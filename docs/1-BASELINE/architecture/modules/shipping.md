# Shipping Module Architecture

## Overview

Outbound logistics with picking, packing, carrier integration, and proof of delivery.

## Dependencies

- **Settings**: Warehouses, carriers
- **Warehouse**: License Plates for picking
- **Quality**: QA release required
- **Planning**: Sales Orders (if enabled)

## Database Schema

### Core Tables

```sql
-- Shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  shipment_number TEXT NOT NULL,

  -- Source
  source_type TEXT NOT NULL, -- 'sales_order', 'direct'
  sales_order_id UUID REFERENCES sales_orders(id),
  wo_id UUID REFERENCES work_orders(id),

  -- Destination
  customer_id UUID REFERENCES customers(id),
  ship_to_name TEXT,
  ship_to_address TEXT,
  ship_to_city TEXT,
  ship_to_state TEXT,
  ship_to_postal TEXT,
  ship_to_country TEXT,

  -- Warehouse
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Carrier
  carrier_id UUID REFERENCES carriers(id),
  carrier_name TEXT,
  service_level TEXT,
  tracking_number TEXT,

  -- Dates
  ship_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,

  -- Status
  status shipment_status NOT NULL DEFAULT 'draft',

  -- Proof of Delivery
  pod_signature TEXT, -- Base64 or URL
  pod_received_by TEXT,
  pod_timestamp TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  shipped_by UUID,
  shipped_at TIMESTAMPTZ,

  UNIQUE (org_id, shipment_number)
);

CREATE TYPE shipment_status AS ENUM ('draft', 'picking', 'packed', 'shipped', 'delivered', 'cancelled');

-- Shipment Lines
CREATE TABLE shipment_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,

  product_id UUID NOT NULL REFERENCES products(id),
  ordered_qty DECIMAL(15,4) NOT NULL,
  picked_qty DECIMAL(15,4) DEFAULT 0,
  shipped_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  -- Source line
  so_line_id UUID,

  UNIQUE (shipment_id, line_number)
);

-- Pick Lists
CREATE TABLE pick_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  pick_list_number TEXT NOT NULL,

  -- Reference
  shipment_id UUID REFERENCES shipments(id),

  -- Assignment
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  zone TEXT,
  assigned_to UUID REFERENCES users(id),

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE (org_id, pick_list_number)
);

-- Pick List Items
CREATE TABLE pick_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_list_id UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE,

  -- What to pick
  product_id UUID NOT NULL REFERENCES products(id),
  required_qty DECIMAL(15,4) NOT NULL,
  picked_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  -- Where to pick from (suggested)
  suggested_location_id UUID REFERENCES locations(id),
  suggested_lp_id UUID REFERENCES license_plates(id),

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'picked', 'short'

  picked_at TIMESTAMPTZ,
  picked_by UUID
);

-- Pick Transactions
CREATE TABLE pick_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  pick_list_item_id UUID NOT NULL REFERENCES pick_list_items(id),

  -- What was picked
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  quantity DECIMAL(15,4) NOT NULL,

  picked_at TIMESTAMPTZ DEFAULT now(),
  picked_by UUID
);

-- Packing Slips
CREATE TABLE packing_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  packing_slip_number TEXT NOT NULL,

  shipment_id UUID NOT NULL REFERENCES shipments(id),

  -- Packing info
  packed_at TIMESTAMPTZ,
  packed_by UUID,
  pack_station TEXT,

  -- Dimensions
  total_packages INTEGER DEFAULT 1,
  total_weight DECIMAL(10,2),
  weight_uom TEXT DEFAULT 'kg',

  UNIQUE (org_id, packing_slip_number)
);

-- Packages
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_slip_id UUID NOT NULL REFERENCES packing_slips(id) ON DELETE CASCADE,
  package_number INTEGER NOT NULL,

  -- Contents
  pallet_id UUID REFERENCES pallets(id),

  -- Dimensions
  length DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  dimension_uom TEXT DEFAULT 'cm',
  weight DECIMAL(10,2),
  weight_uom TEXT DEFAULT 'kg',

  UNIQUE (packing_slip_id, package_number)
);

-- Package Items
CREATE TABLE package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,

  lp_id UUID NOT NULL REFERENCES license_plates(id),
  quantity DECIMAL(15,4) NOT NULL
);

-- Carriers
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  carrier_type TEXT, -- 'parcel', 'freight', 'ltl'

  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- API (Phase 4)
  api_enabled BOOLEAN DEFAULT false,
  api_key TEXT,
  api_endpoint TEXT,

  is_active BOOLEAN DEFAULT true,

  UNIQUE (org_id, code)
);

-- Sales Orders (optional)
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  so_number TEXT NOT NULL,

  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Dates
  order_date DATE DEFAULT CURRENT_DATE,
  requested_date DATE,

  -- Status
  status TEXT DEFAULT 'draft',

  -- Totals
  subtotal DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (org_id, so_number)
);

-- Sales Order Lines
CREATE TABLE so_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,

  product_id UUID NOT NULL REFERENCES products(id),
  ordered_qty DECIMAL(15,4) NOT NULL,
  shipped_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  unit_price DECIMAL(15,4),

  UNIQUE (so_id, line_number)
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Addresses
  billing_address TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,

  is_active BOOLEAN DEFAULT true,

  UNIQUE (org_id, code)
);
```

### Indexes

```sql
-- Shipments
CREATE INDEX idx_shipments_org_status ON shipments(org_id, status);
CREATE INDEX idx_shipments_customer ON shipments(customer_id);
CREATE INDEX idx_shipments_date ON shipments(org_id, ship_date);

-- Pick lists
CREATE INDEX idx_picks_org_status ON pick_lists(org_id, status);
CREATE INDEX idx_picks_shipment ON pick_lists(shipment_id);
CREATE INDEX idx_pick_items_list ON pick_list_items(pick_list_id);
CREATE INDEX idx_pick_trans_item ON pick_transactions(pick_list_item_id);

-- Packing
CREATE INDEX idx_packing_shipment ON packing_slips(shipment_id);
CREATE INDEX idx_packages_slip ON packages(packing_slip_id);
CREATE INDEX idx_package_items ON package_items(package_id);

-- Sales orders
CREATE INDEX idx_so_org_status ON sales_orders(org_id, status);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_lines_so ON so_lines(so_id);
```

## API Layer

### Shipments API
```typescript
export class ShipmentsAPI {
  // CRUD
  static async getAll(filters?: ShipmentFilters): Promise<Shipment[]>
  static async getById(id: string): Promise<Shipment>
  static async create(data: CreateShipmentInput): Promise<Shipment>
  static async createFromSO(soId: string): Promise<Shipment>
  static async createDirect(data: DirectShipmentInput): Promise<Shipment>
  static async update(id: string, data: UpdateShipmentInput): Promise<Shipment>

  // Lines
  static async getLines(shipmentId: string): Promise<ShipmentLine[]>
  static async addLine(shipmentId: string, data: LineInput): Promise<ShipmentLine>

  // Workflow
  static async startPicking(id: string): Promise<PickList>
  static async confirmPacked(id: string): Promise<Shipment>
  static async ship(id: string, data: ShipInput): Promise<Shipment>
  static async recordDelivery(id: string, data: DeliveryInput): Promise<Shipment>
  static async cancel(id: string): Promise<Shipment>

  // POD
  static async uploadPOD(id: string, data: PODInput): Promise<Shipment>

  // Tracking
  static async getTracking(id: string): Promise<TrackingInfo>
}
```

### Pick Lists API
```typescript
export class PickListsAPI {
  // CRUD
  static async getAll(filters?: PickFilters): Promise<PickList[]>
  static async getById(id: string): Promise<PickList>
  static async create(shipmentId: string): Promise<PickList>

  // Items
  static async getItems(pickListId: string): Promise<PickListItem[]>

  // Execution
  static async start(id: string): Promise<PickList>
  static async pickItem(itemId: string, data: PickItemInput): Promise<PickTransaction>
  static async complete(id: string): Promise<PickList>

  // Assignment
  static async assign(id: string, userId: string): Promise<PickList>

  // Suggestions
  static async getSuggestions(pickListId: string): Promise<PickSuggestion[]>
}
```

### Packing API
```typescript
export class PackingAPI {
  // Packing slips
  static async create(shipmentId: string): Promise<PackingSlip>
  static async getById(id: string): Promise<PackingSlip>

  // Packages
  static async addPackage(slipId: string, data: PackageInput): Promise<Package>
  static async addItemToPackage(packageId: string, lpId: string, qty: number): Promise<PackageItem>

  // Complete
  static async complete(slipId: string): Promise<PackingSlip>
}
```

### Carriers API
```typescript
export class CarriersAPI {
  // CRUD
  static async getAll(): Promise<Carrier[]>
  static async getById(id: string): Promise<Carrier>
  static async create(data: CreateCarrierInput): Promise<Carrier>
  static async update(id: string, data: UpdateCarrierInput): Promise<Carrier>

  // Rate shopping (Phase 4)
  static async getRates(shipmentId: string): Promise<CarrierRate[]>
  static async bookShipment(shipmentId: string, carrierId: string, serviceLevel: string): Promise<BookingResult>
  static async getLabel(shipmentId: string): Promise<LabelData>
}
```

### API Routes

```
# Shipments
GET    /api/shipments
POST   /api/shipments
GET    /api/shipments/:id
PATCH  /api/shipments/:id
POST   /api/shipments/from-so/:soId
POST   /api/shipments/direct
GET    /api/shipments/:id/lines
POST   /api/shipments/:id/lines
POST   /api/shipments/:id/start-picking
POST   /api/shipments/:id/packed
POST   /api/shipments/:id/ship
POST   /api/shipments/:id/delivered
POST   /api/shipments/:id/pod
GET    /api/shipments/:id/tracking

# Pick Lists
GET    /api/pick-lists
GET    /api/pick-lists/:id
POST   /api/pick-lists
POST   /api/pick-lists/:id/start
POST   /api/pick-lists/:id/assign
GET    /api/pick-lists/:id/items
POST   /api/pick-lists/:id/items/:itemId/pick
POST   /api/pick-lists/:id/complete

# Packing
POST   /api/packing-slips
GET    /api/packing-slips/:id
POST   /api/packing-slips/:id/packages
POST   /api/packages/:id/items
POST   /api/packing-slips/:id/complete

# Carriers
GET    /api/carriers
POST   /api/carriers
PATCH  /api/carriers/:id
POST   /api/carriers/rates/:shipmentId
POST   /api/carriers/book/:shipmentId

# Sales Orders
GET    /api/sales-orders
POST   /api/sales-orders
GET    /api/sales-orders/:id
PATCH  /api/sales-orders/:id

# Customers
GET    /api/customers
POST   /api/customers
PATCH  /api/customers/:id
```

## Frontend Components

### Pages

```
app/(dashboard)/shipping/
├── page.tsx                    # Shipping dashboard
├── shipments/
│   ├── page.tsx               # Shipment list
│   ├── new/page.tsx           # Create shipment
│   └── [id]/
│       ├── page.tsx           # Shipment detail
│       └── pack/page.tsx      # Packing interface
├── pick-lists/
│   ├── page.tsx               # Pick list queue
│   └── [id]/page.tsx          # Pick execution
├── carriers/
│   └── page.tsx               # Carrier management
├── customers/
│   └── page.tsx               # Customer management
└── sales-orders/
    └── page.tsx               # Sales order list
```

### Key Components

```typescript
components/shipping/
├── ShipmentForm.tsx            # Create shipment
├── ShipmentTimeline.tsx        # Status progress
├── PickListExecutor.tsx        # Mobile picking UI
├── PickItemCard.tsx            # Individual pick item
├── LPSuggestions.tsx           # FIFO/FEFO suggestions
├── PackingStation.tsx          # Packing interface
├── PackageBuilder.tsx          # Add LPs to package
├── CarrierSelector.tsx         # Select carrier
├── RateComparison.tsx          # Compare rates
├── PODCapture.tsx              # Signature capture
├── TrackingDisplay.tsx         # Show tracking info
└── ShippingDashboard.tsx       # Overview metrics
```

## Business Rules

### Shipping Mode
```typescript
// Organization setting determines flow
async function createShipment(input: CreateShipmentInput) {
  const settings = await getOrgSettings()

  if (settings.shipping_mode === 'sales_order') {
    // Require SO reference
    if (!input.sales_order_id) {
      throw new APIError(400, 'so_required', 'Sales Order required in sales_order mode')
    }
    return ShipmentsAPI.createFromSO(input.sales_order_id)
  } else {
    // Direct ship from WO or manual
    return ShipmentsAPI.createDirect(input)
  }
}
```

### Picking Strategies
```typescript
// All strategies enabled - org can configure
interface PickingConfig {
  enable_fifo: boolean    // First In First Out
  enable_fefo: boolean    // First Expiry First Out
  enable_zone: boolean    // Pick by zone
  enable_wave: boolean    // Group into waves
  enable_batch: boolean   // Batch similar items
}

async function generatePickSuggestions(pickListId: string): Promise<PickSuggestion[]> {
  const settings = await getOrgSettings()
  const items = await PickListsAPI.getItems(pickListId)

  const suggestions: PickSuggestion[] = []

  for (const item of items) {
    // Get available LPs
    const lps = await LicensePlatesAPI.getAvailable(item.product_id)

    // Apply strategy
    let selected: LicensePlate

    if (settings.enable_fefo && lps.some(lp => lp.expiry_date)) {
      // FEFO: earliest expiry first
      selected = lps
        .filter(lp => lp.expiry_date)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))[0]
    } else if (settings.enable_fifo) {
      // FIFO: oldest first
      selected = lps
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
    } else {
      selected = lps[0]
    }

    suggestions.push({
      pick_list_item_id: item.id,
      lp_id: selected.id,
      location_id: selected.location_id,
      quantity: Math.min(item.required_qty, selected.quantity),
    })
  }

  return suggestions
}
```

### Pick Execution
```typescript
async function pickItem(itemId: string, input: PickItemInput) {
  const item = await PickListItemsAPI.getById(itemId)
  const lp = await LicensePlatesAPI.getById(input.lp_id)

  // Validate product match
  if (lp.product_id !== item.product_id) {
    throw new APIError(400, 'product_mismatch', 'Wrong product')
  }

  // Validate quantity
  if (input.quantity > lp.quantity) {
    throw new APIError(400, 'insufficient_qty', 'Not enough quantity on LP')
  }

  // Record pick transaction
  const transaction = await db.from('pick_transactions').insert({
    org_id: lp.org_id,
    pick_list_item_id: itemId,
    lp_id: lp.id,
    location_id: lp.location_id,
    quantity: input.quantity,
    picked_by: getCurrentUserId(),
  })

  // Update item picked qty
  await db.from('pick_list_items')
    .update({
      picked_qty: item.picked_qty + input.quantity,
      status: item.picked_qty + input.quantity >= item.required_qty ? 'picked' : 'pending',
      picked_at: new Date().toISOString(),
      picked_by: getCurrentUserId(),
    })
    .eq('id', itemId)

  // Reserve or consume LP
  if (input.quantity === lp.quantity) {
    await LicensePlatesAPI.update(lp.id, { status: 'reserved' })
  } else {
    // Partial pick - create stock move
    await StockMovesAPI.create({
      lp_id: lp.id,
      product_id: lp.product_id,
      quantity: input.quantity,
      from_location_id: lp.location_id,
      to_location_id: null, // In transit
      move_type: 'pick',
      reference_type: 'shipment',
      reference_id: getShipmentId(itemId),
    })
  }

  return transaction
}
```

### Proof of Delivery
```typescript
// Enabled via settings
interface PODInput {
  signature: string      // Base64 image or signature pad data
  received_by: string    // Name of person
  delivery_notes?: string
}

async function recordPOD(shipmentId: string, input: PODInput) {
  const settings = await getOrgSettings()

  if (!settings.enable_proof_of_delivery) {
    throw new APIError(400, 'pod_disabled', 'POD not enabled for this organization')
  }

  return db.from('shipments').update({
    pod_signature: input.signature,
    pod_received_by: input.received_by,
    pod_timestamp: new Date().toISOString(),
    status: 'delivered',
    actual_delivery: new Date().toISOString(),
  }).eq('id', shipmentId)
}
```

### Packing Optimization (Future)
```typescript
// Algorithm for package optimization
interface PackOptimization {
  packages: {
    items: { lp_id: string; quantity: number }[]
    dimensions: Dimensions
    weight: number
  }[]
  total_packages: number
  total_weight: number
}

async function optimizePacking(shipmentId: string): Promise<PackOptimization> {
  // Phase 4: Implement bin packing algorithm
  // Consider: weight limits, dimension constraints, carrier rules
}
```

## Scanner Workflows

### Pick Workflow
```typescript
const pickWorkflowSteps = [
  { id: 'select_list', title: 'Select Pick List', inputType: 'scan' },
  { id: 'scan_location', title: 'Go to Location', inputType: 'scan' },
  { id: 'scan_lp', title: 'Scan LP', inputType: 'scan' },
  { id: 'enter_qty', title: 'Enter Quantity', inputType: 'number' },
  { id: 'confirm', title: 'Confirm Pick', inputType: 'confirm' },
  { id: 'next_item', title: 'Next Item', inputType: 'navigate' },
]
```

### Pack Workflow
```typescript
const packWorkflowSteps = [
  { id: 'select_shipment', title: 'Select Shipment', inputType: 'scan' },
  { id: 'scan_lp', title: 'Scan LP to Pack', inputType: 'scan' },
  { id: 'select_package', title: 'Select Package', inputType: 'select' },
  { id: 'enter_weight', title: 'Enter Weight', inputType: 'number' },
  { id: 'confirm', title: 'Confirm', inputType: 'confirm' },
]
```

### Ship Workflow
```typescript
const shipWorkflowSteps = [
  { id: 'select_shipment', title: 'Select Shipment', inputType: 'scan' },
  { id: 'verify_packages', title: 'Verify Packages', inputType: 'list' },
  { id: 'enter_tracking', title: 'Enter Tracking', inputType: 'text' },
  { id: 'confirm_ship', title: 'Confirm Ship', inputType: 'confirm' },
]
```

## Integration Points

### Events Emitted
```typescript
type ShippingEvent =
  | 'shipment.created'
  | 'shipment.picking_started'
  | 'shipment.packed'
  | 'shipment.shipped'
  | 'shipment.delivered'
  | 'pick_list.completed'
```

### Carrier Integration (Phase 4)
```typescript
// Manual entry for now
interface CarrierBooking {
  carrier_id: string
  service_level: string
  tracking_number: string
  label_url?: string
}

// Phase 4: API integration
interface CarrierAPI {
  getRates(shipment: Shipment): Promise<Rate[]>
  book(shipment: Shipment, rate: Rate): Promise<Booking>
  getLabel(booking: Booking): Promise<Label>
  track(trackingNumber: string): Promise<TrackingEvent[]>
}
```

## Testing

### Key Test Cases
```typescript
describe('PickListsAPI', () => {
  describe('generateSuggestions', () => {
    it('uses FEFO when enabled and expiry exists')
    it('uses FIFO as default')
    it('respects zone picking')
  })
})

describe('ShipmentsAPI', () => {
  describe('ship', () => {
    it('requires all items picked')
    it('updates LP status to shipped')
    it('records tracking number')
  })
})

describe('PackingAPI', () => {
  describe('optimize', () => {
    it('respects weight limits')
    it('minimizes package count')
  })
})
```
