# Planning Module Architecture

## Overview

Order management for Purchase Orders, Transfer Orders, and Work Orders with scheduling capabilities.

## Dependencies

- **Settings**: Suppliers, tax codes, warehouses
- **Technical**: Products, BOMs

## Consumed By

- **Production**: Work Order execution
- **Warehouse**: PO receiving, TO execution

## Database Schema

### Core Tables

```sql
-- Purchase Order Header
CREATE TABLE po_header (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),

  -- Dates
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE NOT NULL,
  actual_received_date DATE,

  -- Financial
  currency TEXT NOT NULL DEFAULT 'PLN',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,

  -- Destination
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Status
  status po_status NOT NULL DEFAULT 'draft',
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,

  UNIQUE (org_id, po_number)
);

CREATE TYPE po_status AS ENUM ('draft', 'submitted', 'approved', 'receiving', 'closed', 'cancelled');

-- Purchase Order Lines
CREATE TABLE po_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES po_header(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  ordered_qty DECIMAL(15,4) NOT NULL,
  received_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  -- Pricing
  unit_price DECIMAL(15,4) NOT NULL,
  tax_code_id UUID REFERENCES tax_codes(id),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2),

  notes TEXT,

  UNIQUE (po_id, line_number)
);

-- Transfer Order Header
CREATE TABLE to_header (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  to_number TEXT NOT NULL,

  -- Warehouses (not locations)
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Dates
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  actual_date DATE,

  -- Status
  status to_status NOT NULL DEFAULT 'draft',
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  deleted_at TIMESTAMPTZ,

  UNIQUE (org_id, to_number)
);

CREATE TYPE to_status AS ENUM ('draft', 'approved', 'in_transit', 'received', 'cancelled');

-- Transfer Order Lines
CREATE TABLE to_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_id UUID NOT NULL REFERENCES to_header(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  requested_qty DECIMAL(15,4) NOT NULL,
  shipped_qty DECIMAL(15,4) DEFAULT 0,
  received_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  notes TEXT,

  UNIQUE (to_id, line_number)
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  planned_qty DECIMAL(15,4) NOT NULL,
  completed_qty DECIMAL(15,4) DEFAULT 0,
  scrapped_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Assignment
  production_line_id UUID REFERENCES production_lines(id),
  priority INTEGER DEFAULT 5, -- 1-10

  -- BOM Reference
  bom_id UUID REFERENCES boms(id),
  routing_id UUID REFERENCES routings(id),

  -- Status
  status wo_status NOT NULL DEFAULT 'draft',
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,

  UNIQUE (org_id, wo_number)
);

CREATE TYPE wo_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');

-- WO Materials (BOM Snapshot)
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  bom_item_id UUID REFERENCES bom_items(id),

  -- Quantities
  required_qty DECIMAL(15,4) NOT NULL,
  consumed_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,

  -- Snapshot data
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  allergens JSONB,
  product_version INTEGER,
  bom_version INTEGER,

  -- Status
  status TEXT DEFAULT 'pending' -- 'pending', 'partial', 'complete'
);

-- WO Operations (Routing Snapshot)
CREATE TABLE wo_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  routing_operation_id UUID REFERENCES routing_operations(id),
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,

  -- Machine
  work_center_id UUID REFERENCES machines(id),

  -- Times
  planned_setup_time INTEGER, -- minutes
  planned_run_time INTEGER,
  actual_setup_time INTEGER,
  actual_run_time INTEGER,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID
);

-- WO By-Products
CREATE TABLE wo_by_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  expected_qty DECIMAL(15,4) NOT NULL,
  actual_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  is_co_product BOOLEAN DEFAULT false
);
```

### Indexes

```sql
-- PO
CREATE INDEX idx_po_org_status ON po_header(org_id, status);
CREATE INDEX idx_po_supplier ON po_header(supplier_id);
CREATE INDEX idx_po_expected ON po_header(org_id, expected_date);
CREATE INDEX idx_po_line_po ON po_line(po_id);
CREATE INDEX idx_po_line_product ON po_line(product_id);

-- TO
CREATE INDEX idx_to_org_status ON to_header(org_id, status);
CREATE INDEX idx_to_from_wh ON to_header(from_warehouse_id);
CREATE INDEX idx_to_to_wh ON to_header(to_warehouse_id);
CREATE INDEX idx_to_line_to ON to_line(to_id);

-- WO
CREATE INDEX idx_wo_org_status ON work_orders(org_id, status);
CREATE INDEX idx_wo_product ON work_orders(product_id);
CREATE INDEX idx_wo_scheduled ON work_orders(org_id, scheduled_date);
CREATE INDEX idx_wo_line ON work_orders(production_line_id);
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);
CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
```

## API Layer

### Purchase Orders API
```typescript
export class PurchaseOrdersAPI {
  // CRUD
  static async getAll(filters?: POFilters): Promise<PurchaseOrder[]>
  static async getById(id: string): Promise<PurchaseOrder>
  static async create(data: CreatePOInput): Promise<PurchaseOrder>
  static async update(id: string, data: UpdatePOInput): Promise<PurchaseOrder>
  static async delete(id: string): Promise<void>

  // Lines
  static async getLines(poId: string): Promise<POLine[]>
  static async addLine(poId: string, data: CreatePOLineInput): Promise<POLine>
  static async updateLine(lineId: string, data: UpdatePOLineInput): Promise<POLine>
  static async removeLine(lineId: string): Promise<void>

  // Status transitions
  static async submit(id: string): Promise<PurchaseOrder>
  static async approve(id: string): Promise<PurchaseOrder>
  static async startReceiving(id: string): Promise<PurchaseOrder>
  static async close(id: string): Promise<PurchaseOrder>
  static async cancel(id: string, reason: string): Promise<PurchaseOrder>

  // Quick entry
  static async createQuickPO(supplierId: string, items: QuickPOItem[]): Promise<PurchaseOrder>

  // Receiving
  static async getReceivableLines(poId: string): Promise<POLine[]>

  // Reports
  static async getSupplierHistory(supplierId: string): Promise<POSummary[]>
}
```

### Transfer Orders API
```typescript
export class TransferOrdersAPI {
  // CRUD
  static async getAll(filters?: TOFilters): Promise<TransferOrder[]>
  static async getById(id: string): Promise<TransferOrder>
  static async create(data: CreateTOInput): Promise<TransferOrder>
  static async update(id: string, data: UpdateTOInput): Promise<TransferOrder>
  static async delete(id: string): Promise<void>

  // Lines
  static async getLines(toId: string): Promise<TOLine[]>
  static async addLine(toId: string, data: CreateTOLineInput): Promise<TOLine>
  static async updateLine(lineId: string, data: UpdateTOLineInput): Promise<TOLine>
  static async removeLine(lineId: string): Promise<void>

  // Status transitions
  static async approve(id: string): Promise<TransferOrder>
  static async ship(id: string): Promise<TransferOrder>
  static async receive(id: string): Promise<TransferOrder>
  static async cancel(id: string): Promise<TransferOrder>

  // Execution
  static async getShippableLines(toId: string): Promise<TOLine[]>
  static async getReceivableLines(toId: string): Promise<TOLine[]>
}
```

### Work Orders API
```typescript
export class WorkOrdersAPI {
  // CRUD
  static async getAll(filters?: WOFilters): Promise<WorkOrder[]>
  static async getById(id: string): Promise<WorkOrder>
  static async create(data: CreateWOInput): Promise<WorkOrder>
  static async update(id: string, data: UpdateWOInput): Promise<WorkOrder>
  static async delete(id: string): Promise<void>

  // Materials
  static async getMaterials(woId: string): Promise<WOMaterial[]>
  static async updateMaterial(materialId: string, data: UpdateMaterialInput): Promise<WOMaterial>

  // Operations
  static async getOperations(woId: string): Promise<WOOperation[]>
  static async startOperation(opId: string): Promise<WOOperation>
  static async completeOperation(opId: string, data: CompleteOpInput): Promise<WOOperation>

  // By-products
  static async getByProducts(woId: string): Promise<WOByProduct[]>

  // Status transitions
  static async schedule(id: string, scheduleData: ScheduleInput): Promise<WorkOrder>
  static async start(id: string): Promise<WorkOrder>
  static async complete(id: string): Promise<WorkOrder>
  static async cancel(id: string, reason: string): Promise<WorkOrder>

  // Production
  static async recordOutput(woId: string, data: OutputInput): Promise<ProductionOutput>

  // Scheduling
  static async getSchedule(lineId: string, dateRange: DateRange): Promise<WOScheduleItem[]>
  static async reschedule(id: string, newDate: Date): Promise<WorkOrder>

  // MRP
  static async calculateRequirements(productId: string, qty: number, date: Date): Promise<MRPResult>

  // Reports
  static async getProductionSummary(dateRange: DateRange): Promise<ProductionSummary>
}
```

### API Routes

```
# Purchase Orders
GET    /api/purchase-orders
POST   /api/purchase-orders
GET    /api/purchase-orders/:id
PATCH  /api/purchase-orders/:id
DELETE /api/purchase-orders/:id
GET    /api/purchase-orders/:id/lines
POST   /api/purchase-orders/:id/lines
PATCH  /api/purchase-orders/:id/lines/:lineId
DELETE /api/purchase-orders/:id/lines/:lineId
POST   /api/purchase-orders/:id/submit
POST   /api/purchase-orders/:id/approve
POST   /api/purchase-orders/:id/close
POST   /api/purchase-orders/:id/cancel
POST   /api/purchase-orders/quick

# Transfer Orders
GET    /api/transfer-orders
POST   /api/transfer-orders
GET    /api/transfer-orders/:id
PATCH  /api/transfer-orders/:id
DELETE /api/transfer-orders/:id
GET    /api/transfer-orders/:id/lines
POST   /api/transfer-orders/:id/lines
PATCH  /api/transfer-orders/:id/lines/:lineId
DELETE /api/transfer-orders/:id/lines/:lineId
POST   /api/transfer-orders/:id/approve
POST   /api/transfer-orders/:id/ship
POST   /api/transfer-orders/:id/receive

# Work Orders
GET    /api/work-orders
POST   /api/work-orders
GET    /api/work-orders/:id
PATCH  /api/work-orders/:id
DELETE /api/work-orders/:id
GET    /api/work-orders/:id/materials
GET    /api/work-orders/:id/operations
POST   /api/work-orders/:id/operations/:opId/start
POST   /api/work-orders/:id/operations/:opId/complete
GET    /api/work-orders/:id/by-products
POST   /api/work-orders/:id/schedule
POST   /api/work-orders/:id/start
POST   /api/work-orders/:id/complete
POST   /api/work-orders/:id/output
GET    /api/work-orders/schedule/:lineId
```

## Frontend Components

### Pages

```
app/(dashboard)/planning/
├── page.tsx                    # Planning dashboard
├── purchase-orders/
│   ├── page.tsx               # PO list
│   ├── new/page.tsx           # Create PO
│   ├── quick/page.tsx         # Quick PO entry
│   └── [id]/page.tsx          # PO detail
├── transfer-orders/
│   ├── page.tsx               # TO list
│   ├── new/page.tsx           # Create TO
│   └── [id]/page.tsx          # TO detail
└── work-orders/
    ├── page.tsx               # WO list
    ├── new/page.tsx           # Create WO
    ├── [id]/page.tsx          # WO detail
    ├── schedule/page.tsx      # Gantt schedule
    └── mrp/page.tsx           # MRP planning
```

### Key Components

```typescript
components/planning/
├── POForm.tsx                  # PO CRUD
├── POLineEditor.tsx            # PO lines table
├── QuickPOEntry.tsx            # Rapid entry form
├── TOForm.tsx                  # TO CRUD
├── TOLineEditor.tsx            # TO lines table
├── WOForm.tsx                  # WO CRUD
├── WOMaterialsList.tsx         # Materials view
├── WOOperationsList.tsx        # Operations progress
├── WOScheduleGantt.tsx         # Gantt chart
├── WOStatusTimeline.tsx        # Status history
├── MRPCalculator.tsx           # MRP interface
└── ProductionCalendar.tsx      # Calendar view
```

## Business Rules

### Supplier Defaults Inheritance
```typescript
// When creating PO, inherit from supplier
async function createPO(data: CreatePOInput) {
  const supplier = await SuppliersAPI.getById(data.supplier_id)

  return PurchaseOrdersAPI.create({
    ...data,
    currency: data.currency || supplier.default_currency,
    expected_date: data.expected_date || addDays(new Date(), supplier.lead_time_days),
  })
}

// Line pricing from product
async function addPOLine(poId: string, data: CreatePOLineInput) {
  const product = await ProductsAPI.getById(data.product_id)
  const supplier = await getSupplierForPO(poId)

  return POLinesAPI.create({
    po_id: poId,
    product_id: data.product_id,
    ordered_qty: data.ordered_qty,
    uom: product.uom,
    unit_price: data.unit_price || product.standard_cost,
    tax_code_id: data.tax_code_id || supplier.default_tax_code_id,
  })
}
```

### WO BOM Selection
```typescript
// Auto-select active BOM for scheduled date
async function createWO(data: CreateWOInput) {
  const bom = await BomsAPI.getActiveForProduct(
    data.product_id,
    data.scheduled_date
  )

  if (!bom) {
    throw new APIError(400, 'no_active_bom', 'No active BOM for scheduled date')
  }

  const wo = await WorkOrdersAPI.create({
    ...data,
    bom_id: bom.id,
  })

  // Snapshot BOM to materials
  await snapshotBOMForWO(wo.id, bom.id, data.planned_qty)

  // Snapshot routing if exists
  const routing = await RoutingsAPI.getDefaultForProduct(data.product_id)
  if (routing) {
    await snapshotRoutingForWO(wo.id, routing.id)
  }

  return wo
}
```

### Status Transitions
```typescript
// Valid status transitions
const poTransitions = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'draft', 'cancelled'],
  approved: ['receiving', 'cancelled'],
  receiving: ['closed'],
  closed: [],
  cancelled: [],
}

const woTransitions = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'draft', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function validateTransition(current: string, next: string, transitions: Record<string, string[]>) {
  if (!transitions[current]?.includes(next)) {
    throw new APIError(400, 'invalid_transition', `Cannot transition from ${current} to ${next}`)
  }
}
```

## Scheduling

### Simple FIFO/FEFO (MVP)
```typescript
interface ScheduleInput {
  scheduled_date: Date
  production_line_id: string
  priority?: number
}

async function scheduleWO(woId: string, input: ScheduleInput) {
  // Check line capacity
  const existingWOs = await WorkOrdersAPI.getSchedule(
    input.production_line_id,
    { start: input.scheduled_date, end: input.scheduled_date }
  )

  // Simple slot check
  if (existingWOs.length >= MAX_WOS_PER_DAY) {
    throw new APIError(400, 'capacity_exceeded', 'Line capacity exceeded for date')
  }

  return WorkOrdersAPI.update(woId, {
    status: 'scheduled',
    scheduled_date: input.scheduled_date,
    production_line_id: input.production_line_id,
    priority: input.priority || 5,
  })
}
```

### Gantt View Data
```typescript
interface GanttItem {
  id: string
  wo_number: string
  product_name: string
  start: Date
  end: Date
  progress: number
  status: string
  dependencies?: string[]
}

async function getGanttData(lineId: string, dateRange: DateRange): Promise<GanttItem[]> {
  const workOrders = await WorkOrdersAPI.getSchedule(lineId, dateRange)

  return workOrders.map(wo => ({
    id: wo.id,
    wo_number: wo.wo_number,
    product_name: wo.product.name,
    start: wo.scheduled_start || wo.scheduled_date,
    end: wo.scheduled_end || addHours(wo.scheduled_date, 8),
    progress: wo.completed_qty / wo.planned_qty * 100,
    status: wo.status,
  }))
}
```

### APS (Future)
```typescript
// Advanced Planning and Scheduling (later phases)
interface APSInput {
  work_orders: WorkOrder[]
  constraints: {
    line_capacity: Record<string, number>
    material_availability: Record<string, Date>
    labor_shifts: Shift[]
  }
}

interface APSOutput {
  schedule: ScheduledWO[]
  conflicts: Conflict[]
  utilization: Record<string, number>
}
```

## MRP Calculation

```typescript
interface MRPResult {
  product_id: string
  gross_requirement: number
  on_hand: number
  on_order: number // From open POs
  in_production: number // From open WOs
  net_requirement: number
  recommended_action: 'none' | 'purchase' | 'produce'
  suggested_qty: number
  suggested_date: Date
  children?: MRPResult[] // BOM explosion
}

async function calculateMRP(
  productId: string,
  requiredQty: number,
  requiredDate: Date
): Promise<MRPResult> {
  const product = await ProductsAPI.getById(productId)

  // Get inventory position
  const onHand = await InventoryAPI.getAvailableQty(productId)
  const onOrder = await PurchaseOrdersAPI.getOnOrderQty(productId, requiredDate)
  const inProduction = await WorkOrdersAPI.getInProductionQty(productId, requiredDate)

  const available = onHand + onOrder + inProduction
  const netRequirement = Math.max(0, requiredQty - available)

  let result: MRPResult = {
    product_id: productId,
    gross_requirement: requiredQty,
    on_hand: onHand,
    on_order: onOrder,
    in_production: inProduction,
    net_requirement: netRequirement,
    recommended_action: 'none',
    suggested_qty: 0,
    suggested_date: requiredDate,
  }

  if (netRequirement > 0) {
    if (product.product_type === 'raw_material') {
      result.recommended_action = 'purchase'
      result.suggested_date = subDays(requiredDate, product.lead_time || 7)
    } else {
      result.recommended_action = 'produce'
      result.suggested_date = subDays(requiredDate, 1)

      // Explode BOM
      const bom = await BomsAPI.getActiveForProduct(productId, requiredDate)
      if (bom) {
        const items = await BomsAPI.getItems(bom.id)
        result.children = await Promise.all(
          items.map(item =>
            calculateMRP(
              item.product_id,
              (netRequirement / bom.batch_size) * item.quantity,
              result.suggested_date
            )
          )
        )
      }
    }
    result.suggested_qty = netRequirement
  }

  return result
}
```

## Integration Points

### Webhooks Emitted
```typescript
type PlanningEvent =
  | 'purchase_order.created'
  | 'purchase_order.approved'
  | 'purchase_order.received'
  | 'transfer_order.shipped'
  | 'transfer_order.received'
  | 'work_order.created'
  | 'work_order.started'
  | 'work_order.completed'
```

## Testing

### Key Test Cases
```typescript
describe('WorkOrdersAPI', () => {
  describe('create', () => {
    it('selects active BOM for scheduled date')
    it('snapshots BOM to materials')
    it('fails if no active BOM')
    it('calculates material requirements')
  })

  describe('status', () => {
    it('validates status transitions')
    it('prevents invalid transitions')
    it('records timestamps')
  })

  describe('MRP', () => {
    it('calculates net requirements')
    it('considers on-hand inventory')
    it('considers open POs')
    it('explodes BOM for produced items')
  })
})
```
