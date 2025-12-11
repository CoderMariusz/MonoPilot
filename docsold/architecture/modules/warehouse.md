# Warehouse Module Architecture

## Overview

Inventory management through License Plates, ASN/GRN receiving, stock movements, and pallet operations.

## Dependencies

- **Settings**: Warehouses, locations
- **Technical**: Products
- **Planning**: PO for receiving, TO for transfers
- **Production**: Output creates LPs

## Consumed By

- **Quality**: LP QA status
- **Shipping**: LP picking

## Database Schema

### Core Tables

```sql
-- License Plates (Atomic Inventory Unit)
CREATE TABLE license_plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_number TEXT NOT NULL,

  -- Product
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,

  -- Location
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  location_id UUID REFERENCES locations(id),

  -- Batch/Lot
  batch_number TEXT,
  supplier_batch_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,

  -- Source tracking
  po_id UUID REFERENCES po_header(id),
  po_line_id UUID REFERENCES po_line(id),
  wo_id UUID REFERENCES work_orders(id),
  asn_id UUID REFERENCES asns(id),

  -- Genealogy
  parent_lp_id UUID REFERENCES license_plates(id),
  consumed_by_wo_id UUID REFERENCES work_orders(id),

  -- Status
  status lp_status NOT NULL DEFAULT 'available',
  qa_status TEXT DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'hold'

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  deleted_at TIMESTAMPTZ,

  UNIQUE (org_id, lp_number)
);

CREATE TYPE lp_status AS ENUM ('available', 'reserved', 'consumed', 'quarantine', 'shipped');

-- LP Genealogy (Traceability)
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Parent-child relationship
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID NOT NULL REFERENCES license_plates(id),

  -- Context
  relationship_type TEXT NOT NULL, -- 'consumed', 'split', 'merged', 'produced'
  wo_id UUID REFERENCES work_orders(id),
  quantity DECIMAL(15,4),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (parent_lp_id, child_lp_id)
);

-- LP Reservations
CREATE TABLE lp_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),

  -- What it's reserved for
  reserved_for_type TEXT NOT NULL, -- 'work_order', 'sales_order', 'transfer_order'
  reserved_for_id UUID NOT NULL,

  -- Quantity (partial reservation)
  reserved_qty DECIMAL(15,4) NOT NULL,

  -- Time
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,

  reserved_by UUID
);

-- ASN (Advance Ship Notice)
CREATE TABLE asns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  asn_number TEXT NOT NULL,

  -- Source
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  po_id UUID REFERENCES po_header(id),

  -- Dates
  ship_date DATE,
  expected_date DATE NOT NULL,
  received_date DATE,

  -- Status
  status asn_status NOT NULL DEFAULT 'pending',
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  UNIQUE (org_id, asn_number)
);

CREATE TYPE asn_status AS ENUM ('pending', 'in_transit', 'received', 'cancelled');

-- ASN Items
CREATE TABLE asn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asn_id UUID NOT NULL REFERENCES asns(id) ON DELETE CASCADE,
  po_line_id UUID REFERENCES po_line(id),

  product_id UUID NOT NULL REFERENCES products(id),
  expected_qty DECIMAL(15,4) NOT NULL,
  received_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  -- Supplier lot info
  supplier_batch_number TEXT,
  manufacture_date DATE,
  expiry_date DATE
);

-- GRN (Goods Receipt Note)
CREATE TABLE grns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  grn_number TEXT NOT NULL,

  -- Source
  asn_id UUID REFERENCES asns(id),
  po_id UUID REFERENCES po_header(id),
  to_id UUID REFERENCES to_header(id),

  -- Destination
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  location_id UUID REFERENCES locations(id),

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'completed'
  received_date DATE DEFAULT CURRENT_DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  UNIQUE (org_id, grn_number)
);

-- GRN Items
CREATE TABLE grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
  asn_item_id UUID REFERENCES asn_items(id),

  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,

  -- Created LP
  lp_id UUID REFERENCES license_plates(id),

  -- Quality
  qa_status TEXT DEFAULT 'pending',
  coa_received BOOLEAN DEFAULT false
);

-- Stock Moves
CREATE TABLE stock_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- What moved
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,

  -- From/To
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),

  -- Context
  move_type TEXT NOT NULL, -- 'transfer', 'pick', 'putaway', 'adjustment'
  reference_type TEXT, -- 'to', 'wo', 'so', 'adjustment'
  reference_id UUID,

  -- Audit
  moved_at TIMESTAMPTZ DEFAULT now(),
  moved_by UUID
);

-- Pallets
CREATE TABLE pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  pallet_number TEXT NOT NULL,

  -- Location
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  location_id UUID REFERENCES locations(id),

  -- Status
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'shipped'

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  UNIQUE (org_id, pallet_number)
);

-- Pallet Items
CREATE TABLE pallet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id),

  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID
);
```

### Indexes

```sql
-- License Plates
CREATE INDEX idx_lp_org_status ON license_plates(org_id, status);
CREATE INDEX idx_lp_product ON license_plates(product_id);
CREATE INDEX idx_lp_location ON license_plates(location_id);
CREATE INDEX idx_lp_batch ON license_plates(org_id, batch_number);
CREATE INDEX idx_lp_expiry ON license_plates(org_id, expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_lp_available ON license_plates(org_id, product_id, status) WHERE status = 'available';

-- Genealogy
CREATE INDEX idx_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_genealogy_child ON lp_genealogy(child_lp_id);

-- Reservations
CREATE INDEX idx_reservations_lp ON lp_reservations(lp_id) WHERE released_at IS NULL;

-- ASN/GRN
CREATE INDEX idx_asn_org_status ON asns(org_id, status);
CREATE INDEX idx_asn_po ON asns(po_id);
CREATE INDEX idx_grn_org ON grns(org_id);
CREATE INDEX idx_grn_asn ON grns(asn_id);

-- Stock Moves
CREATE INDEX idx_moves_org_date ON stock_moves(org_id, moved_at DESC);
CREATE INDEX idx_moves_lp ON stock_moves(lp_id);
CREATE INDEX idx_moves_from ON stock_moves(from_location_id);
CREATE INDEX idx_moves_to ON stock_moves(to_location_id);

-- Pallets
CREATE INDEX idx_pallets_org ON pallets(org_id);
CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);
CREATE INDEX idx_pallet_items_lp ON pallet_items(lp_id);
```

## API Layer

### License Plates API
```typescript
export class LicensePlatesAPI {
  // CRUD
  static async getAll(filters?: LPFilters): Promise<LicensePlate[]>
  static async getById(id: string): Promise<LicensePlate>
  static async getByNumber(lpNumber: string): Promise<LicensePlate>
  static async create(data: CreateLPInput): Promise<LicensePlate>
  static async update(id: string, data: UpdateLPInput): Promise<LicensePlate>

  // Inventory queries
  static async getAvailable(productId: string, locationId?: string): Promise<LicensePlate[]>
  static async getByLocation(locationId: string): Promise<LicensePlate[]>
  static async getByBatch(batchNumber: string): Promise<LicensePlate[]>
  static async getExpiring(days: number): Promise<LicensePlate[]>

  // Operations
  static async move(id: string, toLocationId: string): Promise<LicensePlate>
  static async split(id: string, quantities: number[]): Promise<LicensePlate[]>
  static async merge(lpIds: string[]): Promise<LicensePlate>
  static async consume(id: string, quantity: number, woId: string): Promise<void>
  static async ship(id: string): Promise<void>

  // Reservations
  static async reserve(id: string, data: ReserveInput): Promise<LPReservation>
  static async release(reservationId: string): Promise<void>

  // QA
  static async updateQAStatus(id: string, status: string): Promise<LicensePlate>
  static async quarantine(id: string, reason: string): Promise<LicensePlate>
  static async releaseFromQuarantine(id: string): Promise<LicensePlate>

  // Genealogy
  static async getGeneaology(id: string): Promise<GenealogyTree>
  static async traceForward(id: string): Promise<LicensePlate[]>
  static async traceBackward(id: string): Promise<LicensePlate[]>
}
```

### ASN/GRN API
```typescript
export class ASNsAPI {
  // CRUD
  static async getAll(filters?: ASNFilters): Promise<ASN[]>
  static async getById(id: string): Promise<ASN>
  static async create(data: CreateASNInput): Promise<ASN>
  static async createFromPO(poId: string): Promise<ASN>
  static async update(id: string, data: UpdateASNInput): Promise<ASN>

  // Items
  static async getItems(asnId: string): Promise<ASNItem[]>
  static async addItem(asnId: string, data: ASNItemInput): Promise<ASNItem>

  // Status
  static async markInTransit(id: string): Promise<ASN>
  static async receive(id: string): Promise<GRN>
  static async cancel(id: string): Promise<ASN>
}

export class GRNsAPI {
  static async getAll(filters?: GRNFilters): Promise<GRN[]>
  static async getById(id: string): Promise<GRN>
  static async create(data: CreateGRNInput): Promise<GRN>

  // Items
  static async getItems(grnId: string): Promise<GRNItem[]>
  static async receiveItem(grnItemId: string, data: ReceiveItemInput): Promise<LicensePlate>

  // Complete
  static async complete(id: string): Promise<GRN>
}
```

### Stock Moves API
```typescript
export class StockMovesAPI {
  static async getAll(filters?: MoveFilters): Promise<StockMove[]>
  static async getByLP(lpId: string): Promise<StockMove[]>
  static async getByLocation(locationId: string): Promise<StockMove[]>

  static async create(data: CreateMoveInput): Promise<StockMove>

  // Reports
  static async getMovementHistory(dateRange: DateRange): Promise<MovementReport>
}
```

### Pallets API
```typescript
export class PalletsAPI {
  static async getAll(filters?: PalletFilters): Promise<Pallet[]>
  static async getById(id: string): Promise<Pallet>
  static async create(data: CreatePalletInput): Promise<Pallet>

  // Items
  static async getItems(palletId: string): Promise<PalletItem[]>
  static async addLP(palletId: string, lpId: string): Promise<PalletItem>
  static async removeLP(palletId: string, lpId: string): Promise<void>

  // Operations
  static async close(id: string): Promise<Pallet>
  static async move(id: string, toLocationId: string): Promise<Pallet>
}
```

### Traceability API
```typescript
export class TraceabilityAPI {
  // Forward trace (where did this go?)
  static async traceForward(lpId: string): Promise<TraceResult>

  // Backward trace (where did this come from?)
  static async traceBackward(lpId: string): Promise<TraceResult>

  // Batch trace
  static async traceBatch(batchNumber: string): Promise<BatchTraceResult>

  // Full genealogy tree
  static async getGenealogyTree(lpId: string): Promise<GenealogyTree>

  // Affected products (for recalls)
  static async getAffectedProducts(lpId: string): Promise<AffectedProduct[]>
}
```

### API Routes

```
# License Plates
GET    /api/license-plates
GET    /api/license-plates/:id
POST   /api/license-plates
PATCH  /api/license-plates/:id
POST   /api/license-plates/:id/move
POST   /api/license-plates/:id/split
POST   /api/license-plates/merge
POST   /api/license-plates/:id/reserve
POST   /api/license-plates/:id/release
POST   /api/license-plates/:id/quarantine
GET    /api/license-plates/:id/genealogy

# ASN
GET    /api/asns
POST   /api/asns
GET    /api/asns/:id
PATCH  /api/asns/:id
POST   /api/asns/from-po/:poId
GET    /api/asns/:id/items
POST   /api/asns/:id/items
POST   /api/asns/:id/receive

# GRN
GET    /api/grns
POST   /api/grns
GET    /api/grns/:id
GET    /api/grns/:id/items
POST   /api/grns/:id/items/:itemId/receive
POST   /api/grns/:id/complete

# Stock Moves
GET    /api/stock-moves
POST   /api/stock-moves
GET    /api/stock-moves/lp/:lpId
GET    /api/stock-moves/location/:locationId

# Pallets
GET    /api/pallets
POST   /api/pallets
GET    /api/pallets/:id
POST   /api/pallets/:id/add-lp
DELETE /api/pallets/:id/items/:lpId
POST   /api/pallets/:id/close
POST   /api/pallets/:id/move

# Traceability
GET    /api/traceability/forward/:lpId
GET    /api/traceability/backward/:lpId
GET    /api/traceability/batch/:batchNumber
GET    /api/traceability/tree/:lpId
```

## Frontend Components

### Pages

```
app/(dashboard)/warehouse/
├── page.tsx                    # Warehouse dashboard
├── license-plates/
│   ├── page.tsx               # LP list
│   └── [id]/page.tsx          # LP detail with history
├── receiving/
│   ├── page.tsx               # ASN list
│   ├── new/page.tsx           # Create ASN
│   └── [asnId]/page.tsx       # ASN receiving
├── movements/
│   └── page.tsx               # Stock movement log
├── pallets/
│   └── page.tsx               # Pallet management
└── traceability/
    └── page.tsx               # Trace interface
```

### Key Components

```typescript
components/warehouse/
├── LPTable.tsx                 # LP list with filters
├── LPDetail.tsx                # LP info and history
├── LPActions.tsx               # Move/split/merge buttons
├── LPSplitForm.tsx             # Split quantity inputs
├── LPMergeSelector.tsx         # Select LPs to merge
├── ASNReceivingForm.tsx        # Receive ASN items
├── GRNItemReceiver.tsx         # Receive individual item
├── StockMovesList.tsx          # Movement history
├── LocationInventory.tsx       # LPs in location
├── PalletBuilder.tsx           # Add LPs to pallet
├── GenealogyTree.tsx           # Visual tree
├── TraceabilityGraph.tsx       # Trace visualization
└── ExpiryDashboard.tsx         # Expiring inventory
```

## Business Rules

### LP Creation from Receiving
```typescript
async function receiveGRNItem(grnItemId: string, input: ReceiveItemInput) {
  const grnItem = await GRNItemsAPI.getById(grnItemId)
  const grn = await GRNsAPI.getById(grnItem.grn_id)

  // Create LP
  const lp = await LicensePlatesAPI.create({
    product_id: grnItem.product_id,
    quantity: input.quantity,
    uom: grnItem.uom,
    warehouse_id: grn.warehouse_id,
    location_id: grn.location_id || input.location_id,
    batch_number: input.batch_number,
    supplier_batch_number: grnItem.supplier_batch_number,
    manufacture_date: grnItem.manufacture_date,
    expiry_date: grnItem.expiry_date || input.expiry_date,
    po_id: grn.po_id,
    asn_id: grn.asn_id,
    status: 'available',
    qa_status: input.coa_received ? 'pending' : 'hold',
  })

  // Update GRN item
  await db.from('grn_items').update({
    lp_id: lp.id,
    qa_status: lp.qa_status,
    coa_received: input.coa_received,
  }).eq('id', grnItemId)

  // Update ASN received qty
  if (grnItem.asn_item_id) {
    await incrementASNItemReceived(grnItem.asn_item_id, input.quantity)
  }

  // Update PO received qty
  if (grn.po_id) {
    await incrementPOLineReceived(grn.po_id, grnItem.product_id, input.quantity)
  }

  return lp
}
```

### LP Split
```typescript
async function splitLP(lpId: string, quantities: number[]): Promise<LicensePlate[]> {
  const lp = await LicensePlatesAPI.getById(lpId)

  // Validate total
  const total = quantities.reduce((sum, q) => sum + q, 0)
  if (total !== lp.quantity) {
    throw new APIError(400, 'qty_mismatch', 'Split quantities must equal original')
  }

  const newLPs: LicensePlate[] = []

  for (const qty of quantities) {
    const newLP = await LicensePlatesAPI.create({
      ...lp,
      id: undefined,
      lp_number: generateLPNumber(),
      quantity: qty,
      parent_lp_id: lp.id,
    })

    // Record genealogy
    await db.from('lp_genealogy').insert({
      org_id: lp.org_id,
      parent_lp_id: lp.id,
      child_lp_id: newLP.id,
      relationship_type: 'split',
      quantity: qty,
    })

    newLPs.push(newLP)
  }

  // Mark original as consumed
  await db.from('license_plates')
    .update({ status: 'consumed' })
    .eq('id', lpId)

  return newLPs
}
```

### LP Merge
```typescript
async function mergeLPs(lpIds: string[]): Promise<LicensePlate> {
  const lps = await Promise.all(lpIds.map(id => LicensePlatesAPI.getById(id)))

  // Validate same product
  const productIds = new Set(lps.map(lp => lp.product_id))
  if (productIds.size > 1) {
    throw new APIError(400, 'product_mismatch', 'Cannot merge different products')
  }

  // Validate same location
  const locationIds = new Set(lps.map(lp => lp.location_id))
  if (locationIds.size > 1) {
    throw new APIError(400, 'location_mismatch', 'LPs must be in same location')
  }

  // Validate same batch (optional)
  const batches = new Set(lps.map(lp => lp.batch_number).filter(Boolean))
  if (batches.size > 1) {
    // Warning only - allow merge with earliest expiry
  }

  // Calculate merged values
  const totalQty = lps.reduce((sum, lp) => sum + lp.quantity, 0)
  const earliestExpiry = lps
    .filter(lp => lp.expiry_date)
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))[0]?.expiry_date

  // Create merged LP
  const mergedLP = await LicensePlatesAPI.create({
    product_id: lps[0].product_id,
    quantity: totalQty,
    uom: lps[0].uom,
    warehouse_id: lps[0].warehouse_id,
    location_id: lps[0].location_id,
    batch_number: lps[0].batch_number, // or combine
    expiry_date: earliestExpiry,
    status: 'available',
  })

  // Record genealogy
  for (const lp of lps) {
    await db.from('lp_genealogy').insert({
      org_id: lp.org_id,
      parent_lp_id: lp.id,
      child_lp_id: mergedLP.id,
      relationship_type: 'merged',
      quantity: lp.quantity,
    })

    // Mark as consumed
    await db.from('license_plates')
      .update({ status: 'consumed' })
      .eq('id', lp.id)
  }

  return mergedLP
}
```

### Dynamic Slotting
```typescript
async function suggestPutawayLocation(lp: LicensePlate): Promise<Location> {
  // Get available locations
  const locations = await LocationsAPI.getAvailable(lp.warehouse_id)

  // Strategy: Find location with same product (consolidation)
  const sameProductLoc = locations.find(loc =>
    loc.current_products?.includes(lp.product_id)
  )
  if (sameProductLoc) return sameProductLoc

  // Strategy: Find empty location in same zone
  const productZone = await getProductZone(lp.product_id)
  const emptyInZone = locations.find(loc =>
    loc.zone === productZone && loc.is_empty
  )
  if (emptyInZone) return emptyInZone

  // Fallback: Any empty location
  return locations.find(loc => loc.is_empty)
}
```

## Scanner Workflows

### Receive Workflow
```typescript
const receiveWorkflowSteps = [
  { id: 'select_asn', title: 'Select ASN', inputType: 'scan' },
  { id: 'scan_item', title: 'Scan Item', inputType: 'scan' },
  { id: 'enter_qty', title: 'Enter Quantity', inputType: 'number' },
  { id: 'enter_batch', title: 'Batch Number', inputType: 'text' },
  { id: 'scan_location', title: 'Putaway Location', inputType: 'scan' },
  { id: 'coa_check', title: 'CoA Received?', inputType: 'confirm' },
  { id: 'confirm', title: 'Confirm Receipt', inputType: 'confirm' },
]
```

### Move Workflow
```typescript
const moveWorkflowSteps = [
  { id: 'scan_lp', title: 'Scan LP', inputType: 'scan' },
  { id: 'scan_dest', title: 'Scan Destination', inputType: 'scan' },
  { id: 'confirm', title: 'Confirm Move', inputType: 'confirm' },
]
```

## Integration Points

### Events Emitted
```typescript
type WarehouseEvent =
  | 'license_plate.created'
  | 'license_plate.moved'
  | 'license_plate.split'
  | 'license_plate.merged'
  | 'license_plate.consumed'
  | 'license_plate.shipped'
  | 'asn.received'
  | 'grn.completed'
```

## Testing

### Key Test Cases
```typescript
describe('LicensePlatesAPI', () => {
  describe('split', () => {
    it('creates child LPs with parent reference')
    it('validates quantity totals')
    it('records genealogy')
  })

  describe('merge', () => {
    it('validates same product')
    it('uses earliest expiry date')
    it('records genealogy for all parents')
  })
})

describe('TraceabilityAPI', () => {
  describe('traceForward', () => {
    it('follows consumption to output')
    it('includes all child LPs')
  })

  describe('traceBackward', () => {
    it('follows to source PO/WO')
    it('includes supplier batch')
  })
})
```
