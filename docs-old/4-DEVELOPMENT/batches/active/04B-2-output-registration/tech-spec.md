# Batch 04B-2: Output Registration - Tech Spec

**Stories:** 4.12-4.16, 4.12a, 4.12b, 4.19
**Effort:** 10-12 hours
**Dependencies:** Batch 04A-1, 04A-2, Batch 04B-1 (wo_consumption table)

---

## Database Tables

### New Tables

```sql
-- Production Outputs (Story 4.12, 4.16 - multiple outputs per WO)
CREATE TABLE production_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  output_lp_id UUID NOT NULL REFERENCES license_plates(id),
  qty DECIMAL(15,4) NOT NULL,
  qa_status TEXT DEFAULT 'pending' CHECK (qa_status IN ('pending', 'pass', 'fail')),
  location_id UUID REFERENCES locations(id),

  -- Over-Production Tracking (Story 4.12b)
  is_over_production BOOLEAN DEFAULT false,
  over_production_parent_lp_id UUID REFERENCES license_plates(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  notes TEXT,

  -- Indexes
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE INDEX idx_production_outputs_wo_id ON production_outputs(wo_id);
CREATE INDEX idx_production_outputs_product_id ON production_outputs(product_id);
CREATE INDEX idx_production_outputs_output_lp_id ON production_outputs(output_lp_id);
CREATE INDEX idx_production_outputs_is_over_production ON production_outputs(is_over_production);

-- Genealogy Recording (Story 4.19 - Technical Foundation)
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Parent-Child Relationship
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID REFERENCES license_plates(id),  -- NULL initially, filled when output created

  -- Operation Type
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
    'consume',        -- Material consumed in WO
    'split',          -- LP split into multiple LPs
    'merge',          -- Multiple LPs merged
    'produce',        -- Output LP produced from WO
    'adjustment'      -- Inventory adjustment
  )),

  -- Consumption Tracking
  consumed_qty DECIMAL(15,4),               -- Qty consumed from parent
  produced_at TIMESTAMPTZ,                  -- When child LP created

  -- Work Order & Material Reference
  wo_id UUID REFERENCES work_orders(id),    -- Which WO this genealogy belongs to
  material_id UUID REFERENCES wo_materials(id), -- Which material in WO

  -- Over-Production Tracking (Story 4.12b)
  is_over_production BOOLEAN DEFAULT false,
  over_production_source VARCHAR(50),       -- 'operator_selected', 'scrap_loss', etc.

  -- Reversal Tracking (Compliance - Story 4.19.5)
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'active',         -- Normal genealogy link
    'reversed',       -- Consumption was reversed
    'void'            -- Deleted (rare, compliance tracking)
  )),
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES users(id),
  reverse_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_lp_genealogy_parent_lp_id ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child_lp_id ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo_id ON lp_genealogy(wo_id);
CREATE INDEX idx_lp_genealogy_status ON lp_genealogy(status);
```

### Columns to Add to Existing Tables

```sql
-- work_orders additions (Story 4.12, 4.16)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS output_qty DECIMAL(15,4) DEFAULT 0;

-- work_orders additions (Story 4.12b - Over-Production)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS is_over_produced BOOLEAN DEFAULT false;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS over_production_qty DECIMAL(15,4) DEFAULT 0;

-- wo_consumption additions (Story 4.12a - Sequential Allocation)
-- NOTE: This table is created in Batch 04B-1
-- Adding columns for multi-output tracking:
ALTER TABLE wo_consumption ADD COLUMN IF NOT EXISTS output_id UUID REFERENCES production_outputs(id);
ALTER TABLE wo_consumption ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ DEFAULT now();

-- license_plates additions (no changes, use existing current_qty and status fields)
-- current_qty tracks remaining qty after consumption
-- status: 'available', 'reserved', 'consumed', etc.
```

### Table: wo_materials (from Batch 03C, used by 4.14)

```sql
-- By-products identified by:
-- product_type = 'by-product' (distinguishes main product from by-products)
-- yield_percent = expected % of main output for this by-product
-- Example:
--   Main product: product_type='main', qty=100kg
--   By-product: product_type='by-product', yield_percent=10 → expected 10kg
```

---

## API Endpoints

| Method | Endpoint | Story | Description |
|--------|----------|-------|-------------|
| POST | `/api/production/work-orders/:id/outputs` | 4.12, 4.13 | Register output (uses 4.12a sequential consumption) |
| GET | `/api/production/work-orders/:id/outputs` | 4.16 | List all outputs with history |
| POST | `/api/production/work-orders/:id/by-products` | 4.14 | Register by-product (manual operator entry) |
| GET | `/api/production/work-orders/:id/genealogy` | 4.19 | Get genealogy traces (forward/backward) |
| GET | `/api/production/work-orders/:id/yield` | 4.15 | Get yield metrics |

### Output Registration API (Story 4.12, 4.13)

**POST** `/api/production/work-orders/:id/outputs`

Request:
```json
{
  "qty": 70,                              // Required: > 0
  "qa_status": "pass",                    // Optional: pass/fail/pending
  "location_id": "LOC-123",              // Optional: default from WO line
  "is_over_production": false,            // Optional: only if over-production
  "over_production_parent_lp_id": null,  // Optional: required if is_over_production=true
  "notes": "Operator notes"               // Optional
}
```

Response:
```json
{
  "success": true,
  "output": {
    "id": "OUT-001",
    "wo_id": "WO-001",
    "product_id": "PROD-1",
    "output_lp_id": "LP-OUT-001",
    "qty": 70,
    "qa_status": "pass",
    "location_id": "LOC-123",
    "is_over_production": false,
    "created_at": "2025-11-28T14:30:00Z",
    "created_by_user_id": "USER-1"
  },
  "output_lp": {
    "id": "LP-OUT-001",
    "product_id": "PROD-1",
    "batch_number": "WO-001",
    "quantity": 70,
    "status": "available",
    "location_id": "LOC-123"
  },
  "wo_output_summary": {
    "total_output_qty": 70,
    "planned_qty": 200,
    "remaining_to_produce": 130
  }
}
```

Backend Operations (all atomic transaction):
1. Validate WO in_progress status
2. Calculate sequential LP consumption (Story 4.12a)
3. Check for over-consumption (show warning if needed)
4. Create output LP
5. Record production_outputs entry
6. Execute consumption: create wo_consumption records, update license_plates.current_qty
7. Create genealogy records (Story 4.19)
8. Update work_orders.output_qty
9. Return success

### By-Product Registration API (Story 4.14)

**POST** `/api/production/work-orders/:id/by-products`

Request:
```json
{
  "by_product_id": "PROD-2",        // Required: from wo_materials
  "qty": 25,                        // Required: > 0, operator-entered
  "qa_status": "pass",             // Optional: pass/fail/pending
  "location_id": "LOC-123",        // Optional: default from WO line
  "notes": "Operator notes"        // Optional
}
```

Response:
```json
{
  "success": true,
  "by_product_lp": {
    "id": "LP-BP-001",
    "product_id": "PROD-2",
    "batch_number": "WO-001",
    "quantity": 25,
    "status": "available",
    "location_id": "LOC-123"
  }
}
```

**Key**: By-products do NOT consume from reserved LPs - operator enters qty directly

### Genealogy Tracing APIs (Story 4.19)

**GET** `/api/production/work-orders/:id/genealogy/forward?lp_id=LP-A`

Forward trace (LP-A → which children outputs did it create?)

Response:
```json
{
  "lp_id": "LP-A",
  "forward_traces": [
    {
      "id": "GEN-1",
      "parent_lp_id": "LP-A",
      "child_lp_id": "LP-OUT-1",
      "consumed_qty": 50,
      "operation_type": "consume",
      "status": "active",
      "wo_id": "WO-001"
    }
  ]
}
```

**GET** `/api/production/work-orders/:id/genealogy/backward?lp_id=LP-OUT-1`

Backward trace (LP-OUT-1 → which parents contributed?)

Response:
```json
{
  "lp_id": "LP-OUT-1",
  "backward_traces": [
    {
      "id": "GEN-1",
      "parent_lp_id": "LP-A",
      "child_lp_id": "LP-OUT-1",
      "consumed_qty": 50,
      "operation_type": "consume",
      "status": "active",
      "wo_id": "WO-001"
    },
    {
      "id": "GEN-2",
      "parent_lp_id": "LP-B",
      "child_lp_id": "LP-OUT-1",
      "consumed_qty": 20,
      "operation_type": "consume",
      "status": "active",
      "wo_id": "WO-001"
    }
  ]
}
```

---

## Frontend Routes

| Route | Component | Story |
|-------|-----------|-------|
| `/production/work-orders/:id/register-output` | OutputRegistrationDesktop | 4.12 |
| `/scanner/output` | ScannerOutput | 4.13 |

---

## Services

### sequential-consumption-service.ts (Story 4.12a - Technical Foundation)

This is the core algorithm for sequential LP allocation across multiple outputs:

```typescript
interface SequentialConsumptionService {
  /**
   * Calculate which LPs will be consumed for this output
   * Takes into account previously consumed quantities
   */
  calculateConsumptionAllocation(
    wo_id: UUID,
    output_qty: number,
    reserved_lps: LicensePlate[]
  ): Promise<{
    allocations: { lp_id: UUID, qty_to_consume: number }[],
    is_over_consumption: boolean,
    cumulative_after: number,
    remaining_unallocated: number
  }>;

  /**
   * Execute consumption - atomic transaction
   * Creates wo_consumption records, updates LP quantities
   */
  executeConsumption(
    wo_id: UUID,
    output_id: UUID,
    allocations: AllocationPlan[],
    consumed_by_user_id: UUID
  ): Promise<void>;
}
```

Key: System remembers cumulative consumption via wo_consumption table with output_id FK

### genealogy-service.ts (Story 4.19 - Technical Foundation)

```typescript
interface GenealogyService {
  /**
   * Get all genealogy records for an LP (both parent and child)
   */
  getForwardTrace(lp_id: UUID): Promise<GenealogyRecord[]>;

  /**
   * Get all genealogy records that led to an LP
   */
  getBackwardTrace(lp_id: UUID): Promise<GenealogyRecord[]>;

  /**
   * Create genealogy record for consumption
   */
  recordConsumption(
    parent_lp_id: UUID,
    wo_id: UUID,
    material_id: UUID,
    consumed_qty: number,
    user_id: UUID
  ): Promise<GenealogyRecord>;

  /**
   * Update genealogy with child LP (after output created)
   */
  updateWithOutput(
    genealogy_id: UUID,
    child_lp_id: UUID,
    produced_at: Date
  ): Promise<void>;

  /**
   * Mark genealogy as reversed (consumption reversal - Story 4.10)
   */
  markAsReversed(
    genealogy_id: UUID,
    reversed_by: UUID,
    reverse_reason: string
  ): Promise<void>;

  /**
   * Create genealogy for over-production
   */
  recordOverProduction(
    parent_lp_id: UUID,
    child_lp_id: UUID,
    qty: number,
    user_id: UUID,
    over_production_source: string
  ): Promise<GenealogyRecord>;
}
```

### output-service.ts (Story 4.12, 4.14)

```typescript
interface OutputService {
  /**
   * Register main output (Story 4.12)
   * Uses sequential consumption from story 4.12a
   */
  registerOutput(
    wo_id: UUID,
    qty: number,
    qa_status: string,
    location_id: UUID,
    is_over_production: boolean,
    over_production_parent_lp_id: UUID | null,
    user_id: UUID
  ): Promise<{
    output: ProductionOutput,
    output_lp: LicensePlate,
    wo_output_summary: { total_output_qty, planned_qty, remaining }
  }>;

  /**
   * Register by-product (Story 4.14)
   * Manual operator entry - no sequential consumption
   */
  registerByProduct(
    wo_id: UUID,
    by_product_id: UUID,
    qty: number,
    qa_status: string,
    location_id: UUID,
    user_id: UUID
  ): Promise<{
    by_product_lp: LicensePlate
  }>;

  /**
   * Get all outputs for WO with history
   */
  getOutputs(wo_id: UUID): Promise<ProductionOutput[]>;

  /**
   * Get by-products for WO
   */
  getByProducts(wo_id: UUID): Promise<ProductionOutput[]>;
}
```

### registerOutput Implementation Pattern

```typescript
async registerOutput(wo_id, qty, qa_status, location_id, is_over_production,
                     over_production_parent_lp_id, user_id) {
  return await db.transaction(async (tx) => {
    const wo = await tx.query('SELECT * FROM work_orders WHERE id = ?', [wo_id]);
    if (wo.status !== 'in_progress') throw new Error('WO not in progress');

    // 1. Calculate sequential consumption (4.12a)
    const allocation = await sequential_consumption_service
      .calculateConsumptionAllocation(wo_id, qty, wo.reserved_lps);

    // 2. Check for over-consumption warning (4.12a)
    if (allocation.is_over_consumption && !allow_over_consumption) {
      throw new Error('Over-consumption not allowed');
    }

    // 3. Create output LP
    const output_lp = await createOutputLP(wo.product_id, qty, qa_status, location_id);

    // 4. Create production_outputs record
    const output = await tx.insert('production_outputs', {
      wo_id,
      product_id: wo.product_id,
      output_lp_id: output_lp.id,
      qty,
      qa_status,
      location_id,
      is_over_production,
      over_production_parent_lp_id: is_over_production ? over_production_parent_lp_id : null,
      created_by_user_id: user_id
    });

    // 5. Execute consumption (4.12a) - atomic
    await sequential_consumption_service.executeConsumption(
      wo_id, output.id, allocation.allocations, user_id
    );

    // 6. Create genealogy records (4.19)
    for (const alloc of allocation.allocations) {
      await genealogy_service.recordConsumption(
        alloc.lp_id, wo_id, null, alloc.qty_to_consume, user_id
      );
      await genealogy_service.updateWithOutput(
        // ... link to output_lp
      );
    }

    // 7. Update WO cumulative qty
    const total = await tx.query(
      'SELECT SUM(qty) FROM production_outputs WHERE wo_id = ?',
      [wo_id]
    );
    await tx.update('work_orders', wo_id, {
      output_qty: total[0].sum,
      is_over_produced: is_over_production ? true : wo.is_over_produced
    });

    return { output, output_lp, ... };
  });
}
```

---

## Yield Calculation (Story 4.15)

```typescript
interface YieldMetrics {
  outputYield: number;    // actual_output / planned * 100
  materialYield: number;  // planned_material / consumed * 100
  operationYields: { opId: string; yield: number }[];
}

function calculateYield(wo: WorkOrder): YieldMetrics {
  const outputYield = (wo.output_qty / wo.planned_qty) * 100;

  const totalRequired = wo.materials.reduce((sum, m) => sum + m.required_qty, 0);
  const totalConsumed = wo.materials.reduce((sum, m) => sum + m.consumed_qty, 0);
  const materialYield = (totalRequired / totalConsumed) * 100;

  return {
    outputYield,
    materialYield,
    operationYields: wo.operations.map(op => ({
      opId: op.id,
      yield: op.actual_yield_percent
    }))
  };
}
```

### Yield Color Coding
- 🟢 Green: >= 95%
- 🟡 Yellow: 80-95%
- 🔴 Red: < 80%

---

## By-Product Logic (Story 4.14)

**Important**: By-products use manual operator entry, NOT sequential consumption

```typescript
async registerByProduct(
  wo_id: UUID,
  by_product_id: UUID,
  qty: number,  // Operator-entered qty (not calculated)
  qa_status: string,
  location_id: UUID,
  user_id: UUID
) {
  return await db.transaction(async (tx) => {
    // 1. Create by-product LP with operator-entered qty
    const by_product_lp = await createOutputLP(
      by_product_id, qty, qa_status, location_id
    );

    // 2. Create production_outputs record (with is_by_product flag if needed)
    const output = await tx.insert('production_outputs', {
      wo_id,
      product_id: by_product_id,
      output_lp_id: by_product_lp.id,
      qty,
      qa_status,
      location_id,
      created_by_user_id: user_id
    });

    // 3. Create genealogy: link by-product to same parents as main output
    const mainOutputGenealogy = await genealogy_service
      .getBackwardTrace(main_output_lp_id);

    for (const parentRecord of mainOutputGenealogy) {
      await genealogy_service.recordConsumption(
        parentRecord.parent_lp_id,
        wo_id,
        null,
        qty,  // By-product qty
        user_id
      );
    }

    return { by_product_lp, output };
  });
}
```

**Key**: By-products are operator-entered qty → by-product LP created → genealogy linked to same parents as main output

---

## Scanner Output Flow (Story 4.13)

1. Scan WO barcode → Show WO summary (reserved LPs, progress)
2. Enter qty (large numeric keypad - touch optimized)
3. [Continue] → Select QA status (if required)
4. Select QA status (large colored buttons: PASS/FAIL/PENDING - touch optimized)
5. [Confirm] → Backend executes:
   - Sequential consumption (4.12a)
   - Over-consumption warning (if applicable)
   - Over-production dialog (if all reserved exhausted)
   - Output LP creation + genealogy
6. ZPL label printed to configured network printer
7. Success feedback + [Scan Next] or [Go to WO]
8. If by-products exist → Prompt for each (Story 4.14)

---

## Settings (production_settings)

| Setting | Type | Default | Story | Purpose |
|---------|------|---------|-------|---------|
| `require_qa_on_output` | boolean | true | 4.12 | QA status required on output registration |
| `allow_over_consumption` | boolean | false | 4.12a | Allow output registration that exceeds reserved qty (with warning) |
| `printer_network_address` | string | null | 4.13, 4.17 | Network printer IP for label printing |
| `printer_port` | integer | 9100 | 4.13, 4.17 | Printer socket port for ZPL |

---

## Genealogy & Reversal (Story 4.19, 4.10 Integration)

On output registration:
```sql
-- Create genealogy records with NULL child_lp_id (pending output)
INSERT INTO lp_genealogy (parent_lp_id, wo_id, material_id, consumed_qty, operation_type, status, created_by_user_id)
VALUES ($lp_id, $wo_id, $material_id, $qty, 'consume', 'active', $user_id);

-- After output LP created, update genealogy with child_lp_id
UPDATE lp_genealogy
SET child_lp_id = $output_lp_id, produced_at = now()
WHERE wo_id = $wo_id AND parent_lp_id = $lp_id AND child_lp_id IS NULL;
```

On consumption reversal (Story 4.10):
```sql
-- Mark genealogy as reversed (never delete)
UPDATE lp_genealogy
SET status = 'reversed', reversed_at = now(), reversed_by = $user_id, reverse_reason = $reason
WHERE id = $genealogy_id;

-- Genealogy record preserved for FDA compliance
-- Full history: created → reversed → potentially reactivated
```

---

## RLS Policies

```sql
-- Production Outputs RLS
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON production_outputs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON production_outputs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON production_outputs FOR UPDATE TO authenticated USING (true);

-- Genealogy RLS
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON lp_genealogy FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON lp_genealogy FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users (reversal only)"
  ON lp_genealogy FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    -- Only allow updates to status (for reversal)
    -- Prevent modification of parent/child relationship
    (SELECT true) = (SELECT true)
  );
```
