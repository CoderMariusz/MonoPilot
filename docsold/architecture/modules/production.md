# Production Module Architecture

## Overview

Work Order execution, material consumption, production output, yield tracking, and OEE calculation.

## Dependencies

- **Settings**: Machines, production lines
- **Technical**: Products, BOMs, Routings
- **Planning**: Work Orders

## Consumed By

- **Warehouse**: Production outputs create LPs
- **Quality**: Output QA checks

## Database Schema

### Core Tables

```sql
-- Production Outputs
CREATE TABLE production_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),

  -- Output
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  output_type TEXT NOT NULL DEFAULT 'good', -- 'good', 'scrap', 'rework'

  -- License Plate
  lp_id UUID REFERENCES license_plates(id),
  location_id UUID REFERENCES locations(id),

  -- Batch info
  batch_number TEXT,
  manufacture_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  -- Index for quick lookup
  CONSTRAINT fk_output_lp FOREIGN KEY (lp_id) REFERENCES license_plates(id)
);

-- Material Consumption
CREATE TABLE material_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  wo_material_id UUID NOT NULL REFERENCES wo_materials(id),

  -- What was consumed
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,

  -- Audit
  consumed_at TIMESTAMPTZ DEFAULT now(),
  consumed_by UUID
);

-- Yield Records
CREATE TABLE yield_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),

  -- Quantities
  good_qty DECIMAL(15,4) NOT NULL,
  scrap_qty DECIMAL(15,4) DEFAULT 0,
  rework_qty DECIMAL(15,4) DEFAULT 0,

  -- Calculated
  yield_percent DECIMAL(5,2),

  -- Period
  shift_date DATE NOT NULL,
  shift TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- OEE Records
CREATE TABLE oee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  machine_id UUID NOT NULL REFERENCES machines(id),
  production_line_id UUID REFERENCES production_lines(id),

  -- Metrics
  availability DECIMAL(5,2), -- %
  performance DECIMAL(5,2),  -- %
  quality DECIMAL(5,2),      -- %
  oee DECIMAL(5,2),          -- %

  -- Underlying data
  planned_production_time INTEGER, -- minutes
  actual_production_time INTEGER,
  ideal_cycle_time INTEGER,
  total_count INTEGER,
  good_count INTEGER,

  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Downtime Events
CREATE TABLE downtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  machine_id UUID NOT NULL REFERENCES machines(id),
  wo_id UUID REFERENCES work_orders(id),

  -- Times
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Classification
  reason_code TEXT,
  reason_category TEXT, -- 'planned', 'unplanned', 'changeover'
  notes TEXT,

  created_by UUID
);

-- By-Product Outputs
CREATE TABLE by_product_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  wo_by_product_id UUID REFERENCES wo_by_products(id),

  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,

  -- License Plate
  lp_id UUID REFERENCES license_plates(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);
```

### Indexes

```sql
CREATE INDEX idx_outputs_wo ON production_outputs(wo_id);
CREATE INDEX idx_outputs_lp ON production_outputs(lp_id);
CREATE INDEX idx_outputs_date ON production_outputs(org_id, created_at);

CREATE INDEX idx_consumption_wo ON material_consumption(wo_id);
CREATE INDEX idx_consumption_lp ON material_consumption(lp_id);
CREATE INDEX idx_consumption_material ON material_consumption(wo_material_id);

CREATE INDEX idx_yield_wo ON yield_records(wo_id);
CREATE INDEX idx_yield_date ON yield_records(org_id, shift_date);

CREATE INDEX idx_oee_machine ON oee_records(machine_id, period_start);
CREATE INDEX idx_oee_line ON oee_records(production_line_id, period_start);

CREATE INDEX idx_downtime_machine ON downtime_events(machine_id, start_time);
```

## API Layer

### Production Outputs API
```typescript
export class ProductionOutputsAPI {
  // CRUD
  static async getAll(filters?: OutputFilters): Promise<ProductionOutput[]>
  static async getById(id: string): Promise<ProductionOutput>
  static async getByWO(woId: string): Promise<ProductionOutput[]>

  // Recording
  static async recordOutput(data: RecordOutputInput): Promise<ProductionOutput>
  static async recordScrap(data: RecordScrapInput): Promise<ProductionOutput>
  static async recordRework(data: RecordReworkInput): Promise<ProductionOutput>

  // LP Creation
  static async createLPFromOutput(outputId: string): Promise<LicensePlate>

  // By-products
  static async recordByProduct(data: RecordByProductInput): Promise<ByProductOutput>
}
```

### Consume API
```typescript
export class ConsumeAPI {
  // Get consumable
  static async getMaterialsForWO(woId: string): Promise<ConsumableMaterial[]>
  static async getAvailableLPs(productId: string, locationId?: string): Promise<LicensePlate[]>

  // Consume
  static async consume(data: ConsumeInput): Promise<MaterialConsumption>
  static async consumeMultiple(data: ConsumeMultipleInput): Promise<MaterialConsumption[]>

  // Undo
  static async reverseConsumption(consumptionId: string, reason: string): Promise<void>

  // Validation
  static async validateConsumption(woId: string, lpId: string, qty: number): Promise<ValidationResult>
}
```

### Yield API
```typescript
export class YieldAPI {
  // Recording
  static async recordYield(woId: string, data: YieldInput): Promise<YieldRecord>

  // Reports
  static async getWOYield(woId: string): Promise<YieldSummary>
  static async getProductYield(productId: string, dateRange: DateRange): Promise<YieldTrend>
  static async getLineYield(lineId: string, dateRange: DateRange): Promise<YieldTrend>

  // Analysis
  static async getScrapReasons(dateRange: DateRange): Promise<ScrapAnalysis>
}
```

### OEE API
```typescript
export class OEEAPI {
  // Calculate
  static async calculateOEE(machineId: string, period: DateRange): Promise<OEERecord>
  static async calculateLineOEE(lineId: string, period: DateRange): Promise<OEERecord>

  // Real-time (post-MVP with machine integration)
  static async getCurrentOEE(machineId: string): Promise<OEESnapshot>

  // Reports
  static async getOEETrend(machineId: string, dateRange: DateRange): Promise<OEETrend>
  static async getOEEDashboard(dateRange: DateRange): Promise<OEEDashboard>

  // Downtime
  static async recordDowntime(data: DowntimeInput): Promise<DowntimeEvent>
  static async getDowntimeAnalysis(machineId: string, dateRange: DateRange): Promise<DowntimeAnalysis>
}
```

### API Routes

```
# Production Outputs
GET    /api/production-outputs
GET    /api/production-outputs/:id
GET    /api/work-orders/:woId/outputs
POST   /api/work-orders/:woId/output
POST   /api/work-orders/:woId/scrap
POST   /api/work-orders/:woId/rework
POST   /api/production-outputs/:id/create-lp
POST   /api/work-orders/:woId/by-product

# Consumption
GET    /api/work-orders/:woId/materials
GET    /api/consume/available-lps/:productId
POST   /api/consume
POST   /api/consume/multiple
POST   /api/consume/:id/reverse

# Yield
POST   /api/work-orders/:woId/yield
GET    /api/work-orders/:woId/yield-summary
GET    /api/yield/product/:productId
GET    /api/yield/line/:lineId
GET    /api/yield/scrap-analysis

# OEE
GET    /api/oee/machine/:machineId
GET    /api/oee/line/:lineId
GET    /api/oee/dashboard
POST   /api/downtime
GET    /api/downtime/machine/:machineId
```

## Frontend Components

### Pages

```
app/(dashboard)/production/
├── page.tsx                    # Production dashboard
├── work-orders/
│   └── [id]/
│       ├── page.tsx           # WO execution view
│       ├── consume/page.tsx   # Consumption interface
│       └── output/page.tsx    # Output recording
├── oee/
│   ├── page.tsx               # OEE dashboard
│   └── [machineId]/page.tsx   # Machine OEE detail
├── yield/
│   └── page.tsx               # Yield reports
└── downtime/
    └── page.tsx               # Downtime tracking
```

### Key Components

```typescript
components/production/
├── WOExecutionBoard.tsx        # Main execution view
├── MaterialConsumption.tsx     # Consume materials
├── LPSelector.tsx              # Select LP for consumption
├── OutputRecorder.tsx          # Record output
├── ScrapRecorder.tsx           # Record scrap with reason
├── ByProductRecorder.tsx       # Record by-products
├── YieldGauge.tsx              # Current yield display
├── OEEDashboard.tsx            # OEE overview
├── OEEGauges.tsx               # A/P/Q gauges
├── OEETrendChart.tsx           # OEE over time
├── DowntimeTimeline.tsx        # Downtime events
├── DowntimeReasonSelector.tsx  # Reason codes
└── ProductionKanban.tsx        # WO status board
```

## Business Rules

### Material Consumption

```typescript
// Consume material for WO
async function consumeMaterial(input: ConsumeInput) {
  const { wo_id, lp_id, quantity, wo_material_id } = input

  // Get LP and material
  const lp = await LicensePlatesAPI.getById(lp_id)
  const material = await WOMaterialsAPI.getById(wo_material_id)

  // Validate product match
  if (lp.product_id !== material.product_id) {
    throw new APIError(400, 'product_mismatch', 'LP product does not match material')
  }

  // Validate UoM match
  if (lp.uom !== material.uom) {
    throw new APIError(400, 'uom_mismatch', 'UoM mismatch - no automatic conversion')
  }

  // Check consume_whole_lp flag
  if (material.consume_whole_lp && quantity !== lp.quantity) {
    throw new APIError(400, 'whole_lp_required', 'Material requires whole LP consumption')
  }

  // Check available quantity
  if (quantity > lp.available_qty) {
    throw new APIError(400, 'insufficient_qty', 'Insufficient quantity on LP')
  }

  // Record consumption
  const consumption = await db.from('material_consumption').insert({
    org_id: lp.org_id,
    wo_id,
    wo_material_id,
    lp_id,
    product_id: lp.product_id,
    quantity,
    uom: lp.uom,
    consumed_by: getCurrentUserId(),
  })

  // Update LP
  await LicensePlatesAPI.consume(lp_id, quantity, wo_id)

  // Update material consumed qty
  await WOMaterialsAPI.updateConsumed(wo_material_id, quantity)

  // Record genealogy
  await recordConsumptionGeneaology(lp_id, wo_id)

  return consumption
}
```

### 1:1 Consumption Pattern

```typescript
// When consume_whole_lp is true
async function consumeWholeLPs(woId: string, materialId: string) {
  const material = await WOMaterialsAPI.getById(materialId)

  if (!material.consume_whole_lp) {
    throw new APIError(400, 'not_whole_lp', 'Material does not require whole LP')
  }

  // Get available LPs
  const lps = await ConsumeAPI.getAvailableLPs(material.product_id)

  // Select LPs using FIFO/FEFO
  const selectedLPs = selectLPsForConsumption(lps, material.required_qty - material.consumed_qty)

  // Consume each whole LP
  const results = []
  for (const lp of selectedLPs) {
    const result = await ConsumeAPI.consume({
      wo_id: woId,
      wo_material_id: materialId,
      lp_id: lp.id,
      quantity: lp.quantity, // Whole LP
    })
    results.push(result)
  }

  return results
}
```

### Output Recording

```typescript
interface RecordOutputInput {
  wo_id: string
  quantity: number
  output_type: 'good' | 'scrap' | 'rework'
  location_id: string
  batch_number?: string
  expiry_date?: Date
  scrap_reason?: string
}

async function recordOutput(input: RecordOutputInput) {
  const wo = await WorkOrdersAPI.getById(input.wo_id)

  // Create output record
  const output = await db.from('production_outputs').insert({
    org_id: wo.org_id,
    wo_id: input.wo_id,
    product_id: wo.product_id,
    quantity: input.quantity,
    uom: wo.uom,
    output_type: input.output_type,
    location_id: input.location_id,
    batch_number: input.batch_number || generateBatchNumber(wo),
    manufacture_date: new Date(),
    expiry_date: input.expiry_date || calculateExpiry(wo.product_id),
    created_by: getCurrentUserId(),
  })

  // Create LP for good output
  if (input.output_type === 'good') {
    const lp = await LicensePlatesAPI.create({
      product_id: wo.product_id,
      quantity: input.quantity,
      uom: wo.uom,
      location_id: input.location_id,
      batch_number: output.batch_number,
      manufacture_date: output.manufacture_date,
      expiry_date: output.expiry_date,
      wo_id: input.wo_id,
      status: 'available',
    })

    // Update output with LP reference
    await db.from('production_outputs')
      .update({ lp_id: lp.id })
      .eq('id', output.id)

    // Record genealogy (output from consumed materials)
    await recordOutputGeneaology(lp.id, input.wo_id)

    output.lp_id = lp.id
  }

  // Update WO quantities
  if (input.output_type === 'good') {
    await WorkOrdersAPI.incrementCompleted(input.wo_id, input.quantity)
  } else if (input.output_type === 'scrap') {
    await WorkOrdersAPI.incrementScrapped(input.wo_id, input.quantity)
  }

  // Update yield record
  await updateYieldRecord(input.wo_id, input.output_type, input.quantity)

  return output
}
```

## OEE Calculation

```typescript
interface OEEInput {
  planned_production_time: number // minutes
  actual_run_time: number
  ideal_cycle_time: number // minutes per unit
  total_produced: number
  good_produced: number
}

function calculateOEE(input: OEEInput): OEERecord {
  // Availability = Actual Run Time / Planned Production Time
  const availability = (input.actual_run_time / input.planned_production_time) * 100

  // Performance = (Ideal Cycle Time × Total Produced) / Actual Run Time
  const performance = ((input.ideal_cycle_time * input.total_produced) / input.actual_run_time) * 100

  // Quality = Good Produced / Total Produced
  const quality = (input.good_produced / input.total_produced) * 100

  // OEE = Availability × Performance × Quality
  const oee = (availability * performance * quality) / 10000

  return {
    availability: Math.min(availability, 100),
    performance: Math.min(performance, 100),
    quality: Math.min(quality, 100),
    oee: Math.min(oee, 100),
    ...input,
  }
}

// Real-time OEE (with machine integration)
async function calculateRealtimeOEE(machineId: string, shiftStart: Date) {
  // Get machine data
  const downtime = await getDowntimeMinutes(machineId, shiftStart)
  const production = await getProductionData(machineId, shiftStart)

  const now = new Date()
  const plannedTime = differenceInMinutes(now, shiftStart)
  const actualRunTime = plannedTime - downtime

  return calculateOEE({
    planned_production_time: plannedTime,
    actual_run_time: actualRunTime,
    ideal_cycle_time: production.ideal_cycle_time,
    total_produced: production.total,
    good_produced: production.good,
  })
}
```

## Yield Tracking

```typescript
async function updateYieldRecord(woId: string, outputType: string, quantity: number) {
  const wo = await WorkOrdersAPI.getById(woId)
  const today = startOfDay(new Date())

  // Get or create yield record for today
  let record = await db
    .from('yield_records')
    .select('*')
    .eq('wo_id', woId)
    .eq('shift_date', today)
    .single()

  if (!record) {
    record = await db.from('yield_records').insert({
      org_id: wo.org_id,
      wo_id: woId,
      shift_date: today,
      good_qty: 0,
      scrap_qty: 0,
      rework_qty: 0,
    }).select().single()
  }

  // Update quantities
  const updates: Record<string, number> = {}
  if (outputType === 'good') updates.good_qty = record.good_qty + quantity
  if (outputType === 'scrap') updates.scrap_qty = record.scrap_qty + quantity
  if (outputType === 'rework') updates.rework_qty = record.rework_qty + quantity

  // Calculate yield percentage
  const totalProduced = (updates.good_qty || record.good_qty) +
                        (updates.scrap_qty || record.scrap_qty) +
                        (updates.rework_qty || record.rework_qty)
  updates.yield_percent = ((updates.good_qty || record.good_qty) / totalProduced) * 100

  return db.from('yield_records').update(updates).eq('id', record.id)
}
```

## Scanner Workflows

### Consume Workflow
```typescript
const consumeWorkflowSteps = [
  {
    id: 'select_wo',
    title: 'Select Work Order',
    instruction: 'Scan WO barcode or select from list',
    inputType: 'scan',
  },
  {
    id: 'select_material',
    title: 'Select Material',
    instruction: 'Choose material to consume',
    inputType: 'select',
  },
  {
    id: 'scan_lp',
    title: 'Scan License Plate',
    instruction: 'Scan the LP barcode',
    inputType: 'scan',
  },
  {
    id: 'enter_qty',
    title: 'Enter Quantity',
    instruction: 'Enter quantity to consume (or full LP)',
    inputType: 'number',
  },
  {
    id: 'confirm',
    title: 'Confirm',
    instruction: 'Review and confirm consumption',
    inputType: 'confirm',
  },
]
```

### Output Workflow
```typescript
const outputWorkflowSteps = [
  {
    id: 'select_wo',
    title: 'Select Work Order',
    instruction: 'Scan WO barcode',
    inputType: 'scan',
  },
  {
    id: 'enter_qty',
    title: 'Enter Quantity',
    instruction: 'Enter output quantity',
    inputType: 'number',
  },
  {
    id: 'select_location',
    title: 'Select Location',
    instruction: 'Scan destination location',
    inputType: 'scan',
  },
  {
    id: 'confirm',
    title: 'Confirm Output',
    instruction: 'Review and confirm',
    inputType: 'confirm',
  },
]
```

## Integration Points

### Events Emitted
```typescript
type ProductionEvent =
  | 'production.output_recorded'
  | 'production.material_consumed'
  | 'production.wo_completed'
  | 'production.downtime_started'
  | 'production.downtime_ended'
```

### Consumed Events
- `work_order.started` → Enable consumption
- `work_order.completed` → Finalize yield

## Testing

### Key Test Cases
```typescript
describe('ConsumeAPI', () => {
  describe('consume', () => {
    it('validates product match')
    it('validates UoM match')
    it('enforces whole LP for 1:1')
    it('updates LP status')
    it('records genealogy')
  })
})

describe('ProductionOutputsAPI', () => {
  describe('recordOutput', () => {
    it('creates LP for good output')
    it('calculates expiry from shelf life')
    it('updates WO quantities')
    it('updates yield record')
  })
})

describe('OEEAPI', () => {
  describe('calculateOEE', () => {
    it('calculates availability correctly')
    it('calculates performance correctly')
    it('calculates quality correctly')
    it('caps values at 100%')
  })
})
```

## Future Considerations

### Phase 2-3
- Machine integration (OPC-UA, MQTT)
- Real-time OEE dashboards
- Predictive maintenance
- Digital work instructions
