# Batch 04B-2: Output Registration - Tech Spec

**Stories:** 4.12-4.16
**Effort:** 10-12 hours
**Dependencies:** Batch 04A-1, 04A-2

---

## Database Tables

### New Tables

```sql
-- Production Outputs (multiple outputs per WO)
CREATE TABLE production_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  qty DECIMAL(15,4) NOT NULL,
  uom_id UUID NOT NULL REFERENCES units_of_measure(id),
  qa_status TEXT DEFAULT 'pending' CHECK (qa_status IN ('pending', 'pass', 'hold', 'fail')),
  is_by_product BOOLEAN DEFAULT false,
  by_product_id UUID REFERENCES products(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registered_by_user_id UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Columns to Add

```sql
-- work_orders additions
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS output_qty DECIMAL(15,4) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS yield_percent DECIMAL(5,2);
```

---

## API Endpoints

| Method | Endpoint | Story | Description |
|--------|----------|-------|-------------|
| POST | `/api/production/work-orders/:id/outputs` | 4.12, 4.13 | Register output |
| GET | `/api/production/work-orders/:id/outputs` | 4.16 | List all outputs |
| POST | `/api/production/work-orders/:id/by-products` | 4.14 | Register by-product |
| GET | `/api/production/work-orders/:id/yield` | 4.15 | Get yield metrics |

---

## Frontend Routes

| Route | Component | Story |
|-------|-----------|-------|
| `/production/work-orders/:id/output` | OutputRegistrationDesktop | 4.12 |
| `/scanner/output` | ScannerOutput | 4.13 |

---

## Services

### output-service.ts
- `registerOutput(woId, qty, qaStatus, locationId, userId)` - Create output LP
- `registerByProduct(woId, productId, qty, userId)` - Create by-product LP
- `getOutputs(woId)` - All outputs for WO
- `calculateYield(woId)` - Output/planned yield metrics

### Output LP Creation

```typescript
async function registerOutput(woId, qty, qaStatus, locationId, userId) {
  const wo = await getWO(woId);

  // Create output LP
  const lp = await createLP({
    product_id: wo.product_id,
    batch_number: wo.wo_number,
    expiry_date: calculateExpiry(wo.product_id),
    qty: qty,
    location_id: locationId,
    status: 'in_production', // Updated to 'available' on WO complete
    qa_status: qaStatus
  });

  // Record output
  await createOutput(woId, lp.id, qty, qaStatus, userId);

  // Update WO total
  await updateWO(woId, { output_qty: wo.output_qty + qty });

  // Complete genealogy (link consumed LPs to output)
  await completeGenealogy(woId, lp.id);

  return lp;
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

```typescript
async function registerByProducts(woId) {
  const wo = await getWO(woId);
  const byProducts = wo.materials.filter(m => m.is_by_product);

  for (const bp of byProducts) {
    const expectedQty = (wo.planned_qty * bp.yield_percent) / 100;

    // If auto-create enabled
    if (settings.auto_create_by_product_lp) {
      await registerByProduct(woId, bp.product_id, expectedQty);
    } else {
      // Prompt user for each by-product
    }
  }
}
```

---

## Scanner Output Flow (Story 4.13)

1. Scan WO barcode → Show WO summary
2. Enter qty (numeric keypad)
3. Select QA status (large touch buttons: Pass/Hold/Pending)
4. Confirm → Output registered
5. ZPL label sent to printer
6. If by-products exist → Prompt for each

---

## Settings (production_settings)

| Setting | Type | Default | Story |
|---------|------|---------|-------|
| `require_qa_on_output` | boolean | true | 4.12 |
| `auto_create_by_product_lp` | boolean | false | 4.14 |

---

## Genealogy Completion

On output registration:
```sql
UPDATE lp_genealogy
SET child_lp_id = $output_lp_id
WHERE wo_id = $wo_id AND child_lp_id IS NULL;
```

---

## RLS Policies

```sql
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON production_outputs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON production_outputs FOR INSERT TO authenticated WITH CHECK (true);
```
