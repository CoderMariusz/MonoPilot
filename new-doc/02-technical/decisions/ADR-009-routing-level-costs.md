# ADR-009: Routing-Level Cost Configuration

## Status: ACCEPTED - IMPLEMENTATION COMPLETE

**Date**: 2025-12-14
**Decision Makers**: Architecture Team
**Related PRDs**: Technical Module (Epic 2), Phase 2C-2 (Costing)
**Related ADRs**: ADR-002-bom-snapshot-pattern
**Related UX**: TEC-008-routing-modal, TEC-010-allergen-management

---

## Implementation Status

| Component | Status | File/Migration |
|-----------|--------|----------------|
| Routing cost fields | COMPLETE | migration 043 |
| Routing code, is_reusable | COMPLETE | migration 044 |
| BOM routing_id FK | COMPLETE | migration 045 |
| Costing service | COMPLETE | `apps/frontend/lib/services/costing-service.ts` |
| BOM cost API | COMPLETE | `/api/technical/boms/[id]/cost/route.ts` |
| Cost Summary UI | COMPLETE | TEC-006 wireframe |
| Clone action | COMPLETE | TEC-005 wireframe |

---

## Context

MonoPilot's Technical Module manages product costing through:
1. **Material costs**: From BOM items (ingredient cost x quantity)
2. **Labor costs**: From routing operations (labor_cost_per_hour x duration)
3. **Overhead**: Currently not implemented

Current limitations:
- **No routing-level fixed costs**: Setup costs that apply to entire routing run (tooling, changeover, calibration) cannot be captured
- **No per-unit working costs**: Costs that scale with batch size but aren't tied to specific operations
- **No overhead allocation**: Factory overhead percentage cannot be applied at routing level

This gap makes total production cost calculations incomplete, especially for:
- Job costing accuracy
- Make vs. buy decisions
- Product pricing optimization
- Cost variance analysis (FR-2.71)

The costing hierarchy should be:
```
Total Cost = Material Cost (BOM)
           + Labor Cost (Operations)
           + Routing Fixed Costs (NEW)
           + Routing Variable Costs (NEW)
           + Overhead (NEW)
```

---

## Decision

**Add cost fields directly to the `routings` table (Option 1).**

```sql
ALTER TABLE routings ADD COLUMN
  setup_cost DECIMAL(10,2) DEFAULT 0,        -- Fixed cost per routing run
  working_cost_per_unit DECIMAL(10,4) DEFAULT 0,  -- Variable cost per output unit
  overhead_percent DECIMAL(5,2) DEFAULT 0,   -- Overhead % applied to total
  currency TEXT DEFAULT 'PLN';               -- Currency for costs
```

### Rationale for Option 1 (Add to routings)

| Criterion | Option 1: Add to routings | Option 2: New routing_costs table |
|-----------|---------------------------|-----------------------------------|
| **Simplicity** | Single table, one query | JOIN required, more complexity |
| **Versioning** | Routing already has versioning | Would need separate versioning logic |
| **Performance** | No JOIN overhead | Extra table lookup |
| **Data Model** | Costs are intrinsic to routing | Costs treated as separate concern |
| **History** | Copy on routing version | Could maintain independent history |
| **Future flexibility** | Moderate | High (multiple cost scenarios) |

**Chosen: Option 1** because:
1. Routing versioning already captures cost changes (when routing is versioned, costs are versioned too)
2. BOM Snapshot pattern (ADR-002) preserves costs at Work Order creation
3. Simpler implementation aligns with "between Excel and ERP" positioning
4. Cost scenarios (multiple cost sets) are P2/Future scope

---

## Alternatives

### Option 2: Separate routing_costs Table

```sql
CREATE TABLE routing_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  cost_type TEXT DEFAULT 'standard',  -- standard, actual, planned
  setup_cost DECIMAL(10,2) DEFAULT 0,
  working_cost_per_unit DECIMAL(10,4) DEFAULT 0,
  overhead_percent DECIMAL(5,2) DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  currency TEXT DEFAULT 'PLN',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(routing_id, cost_type, effective_from)
);
```

**Why Not Chosen:**
- Over-engineered for current needs
- Cost scenario modeling is P2/Future
- Adds JOIN complexity to all cost calculations
- Routing versioning already handles cost history

### Option 3: Cost Fields on BOM Only

Keep costs on BOM via `bom_production_lines.labor_cost_per_hour` and add setup/working costs there.

**Why Not Chosen:**
- Routing is the operational definition; costs belong there
- BOM-level costs work for line-specific overrides but not routing defaults
- Violates single responsibility (routing defines how, costs are part of how)

---

## Implementation

### 1. Database Migration (COMPLETE)

```sql
-- Migration: 043_add_routing_costs.sql

ALTER TABLE routings
ADD COLUMN setup_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN working_cost_per_unit DECIMAL(10,4) DEFAULT 0,
ADD COLUMN overhead_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN currency TEXT DEFAULT 'PLN';

COMMENT ON COLUMN routings.setup_cost IS 'Fixed cost per routing run (tooling, changeover)';
COMMENT ON COLUMN routings.working_cost_per_unit IS 'Variable cost per output unit';
COMMENT ON COLUMN routings.overhead_percent IS 'Factory overhead % applied to total routing cost';
COMMENT ON COLUMN routings.currency IS 'Currency for cost fields';
```

### 2. Additional Fields (UX Requirement) (COMPLETE)

During UX wireframe design (TEC-008), two additional fields were identified as necessary for the routings table:

```sql
-- Migration: 044_add_routing_fields.sql

-- Add code field: Unique routing identifier (e.g., RTG-BREAD-01)
ALTER TABLE routings ADD COLUMN code VARCHAR(50);

-- Add is_reusable field: Indicates if routing can be shared across products
ALTER TABLE routings ADD COLUMN is_reusable BOOLEAN DEFAULT true;

-- Populate code from name for existing rows
UPDATE routings
SET code = UPPER(REGEXP_REPLACE(name, '[^A-Za-z0-9]+', '-', 'g'))
WHERE code IS NULL;

-- Make code NOT NULL and add unique constraint
ALTER TABLE routings
  ALTER COLUMN code SET NOT NULL,
  ADD CONSTRAINT routings_org_code_unique UNIQUE (org_id, code);
```

**Rationale for code field:**
- Users need short, memorable codes for quick routing lookup
- Pattern matches product SKU codes and other identifiers in the system
- Format: uppercase alphanumeric + hyphens (e.g., RTG-BREAD-01, RTG-COOKIES-05)
- Constraint: UNIQUE(org_id, code)

**Rationale for is_reusable field:**
- Distinguish between product-specific and reusable routings
- Use case: Product-specific routing for custom orders vs standard routing
- Default: true (most routings are reusable)

These fields are orthogonal to cost fields and do not affect the ADR-009 cost decision.

### 3. Operation-Level Fields (UX Requirement) (COMPLETE)

During UX wireframe design (TEC-010), two additional fields were identified for routing_operations:

```sql
-- Add cleanup_time: Time to clean up after operation
ALTER TABLE routing_operations ADD COLUMN cleanup_time INTEGER DEFAULT 0;

-- Add instructions: Step-by-step operator instructions
ALTER TABLE routing_operations ADD COLUMN instructions TEXT;

-- Add constraint
ALTER TABLE routing_operations
  ADD CONSTRAINT routing_operations_cleanup_positive CHECK (cleanup_time >= 0);
```

**Rationale:**
- `cleanup_time`: Enables accurate total operation time calculation (setup + run + cleanup)
- `instructions`: Operators need clear instructions for each operation step

### 4. BOM Routing Reference (COMPLETE)

```sql
-- Migration: 045_add_routing_id_to_boms.sql

ALTER TABLE boms
ADD COLUMN routing_id UUID REFERENCES routings(id) ON DELETE SET NULL;

CREATE INDEX idx_boms_routing_id ON boms(routing_id);
```

### 5. Cost Calculation Service (COMPLETE)

**File**: `apps/frontend/lib/services/costing-service.ts`

```typescript
interface RoutingCostResult {
  operationLaborCost: number;      // SUM(operation.labor_cost_per_hour * duration_hours)
  operationSetupCost: number;      // SUM(operation.setup_time * labor_rate)
  operationCleanupCost: number;    // SUM(operation.cleanup_time * labor_rate)
  routingSetupCost: number;        // routing.setup_cost (fixed)
  routingWorkingCost: number;      // routing.working_cost_per_unit * quantity
  subtotal: number;                // Sum of above
  overheadCost: number;            // subtotal * (routing.overhead_percent / 100)
  totalRoutingCost: number;        // subtotal + overheadCost
}

function calculateRoutingCost(
  routing: Routing,
  operations: RoutingOperation[],
  outputQuantity: number,
  laborRatePerHour: number = 50 // Default if not on operation
): RoutingCostResult {

  // 1. Operation labor costs (run time)
  const operationLaborCost = operations.reduce((sum, op) => {
    const rate = op.labor_cost_per_hour ?? laborRatePerHour;
    const hours = (op.duration ?? 0) / 60;
    return sum + (rate * hours);
  }, 0);

  // 2. Operation setup costs
  const operationSetupCost = operations.reduce((sum, op) => {
    const rate = op.labor_cost_per_hour ?? laborRatePerHour;
    const setupHours = (op.setup_time ?? 0) / 60;
    return sum + (rate * setupHours);
  }, 0);

  // 3. Operation cleanup costs (NEW)
  const operationCleanupCost = operations.reduce((sum, op) => {
    const rate = op.labor_cost_per_hour ?? laborRatePerHour;
    const cleanupHours = (op.cleanup_time ?? 0) / 60;
    return sum + (rate * cleanupHours);
  }, 0);

  // 4. Routing-level costs
  const routingSetupCost = routing.setup_cost ?? 0;
  const routingWorkingCost = (routing.working_cost_per_unit ?? 0) * outputQuantity;

  // 5. Subtotal
  const subtotal = operationLaborCost + operationSetupCost + operationCleanupCost
                 + routingSetupCost + routingWorkingCost;

  // 6. Overhead
  const overheadCost = subtotal * ((routing.overhead_percent ?? 0) / 100);

  // 7. Total
  const totalRoutingCost = subtotal + overheadCost;

  return {
    operationLaborCost,
    operationSetupCost,
    operationCleanupCost,
    routingSetupCost,
    routingWorkingCost,
    subtotal,
    overheadCost,
    totalRoutingCost
  };
}
```

### 6. BOM Cost API Endpoint (COMPLETE)

**File**: `apps/frontend/app/api/technical/boms/[id]/cost/route.ts`

```
GET  /api/technical/boms/:id/cost              # Get current cost calculation
POST /api/technical/boms/:id/recalculate-cost  # Force recalculation
```

**Response Format:**
```typescript
{
  material_costs: Array<{
    item_id: string
    product_code: string
    product_name: string
    quantity: number
    uom: string
    unit_cost: number
    total_cost: number
    has_cost: boolean
  }>
  routing_costs: {
    labor_cost: number
    setup_cost: number
    working_cost: number
    overhead: number
    operation_count: number
    total_minutes: number
  } | null
  totals: {
    material_cost: number
    routing_cost: number
    total_bom_cost: number
    cost_per_unit: number
  }
  metadata: {
    calculated_at: string
    has_routing: boolean
    missing_prices_count: number
    missing_price_items: string[]
  }
}
```

### 7. Total Product Cost Formula

```typescript
interface ProductCostResult {
  materialCost: number;            // From BOM: SUM(ingredient.cost * quantity)
  routingCost: RoutingCostResult;  // From routing calculation
  totalCost: number;               // materialCost + routingCost.totalRoutingCost
  costPerUnit: number;             // totalCost / outputQuantity
}

function calculateProductCost(
  bom: BOM,
  routing: Routing,
  operations: RoutingOperation[],
  ingredientCosts: Map<string, number>,
  outputQuantity: number
): ProductCostResult {

  // 1. Material cost from BOM
  const materialCost = bom.items.reduce((sum, item) => {
    const unitCost = ingredientCosts.get(item.product_id) ?? 0;
    return sum + (unitCost * item.quantity);
  }, 0);

  // 2. Routing cost
  const routingCost = calculateRoutingCost(routing, operations, outputQuantity);

  // 3. Total
  const totalCost = materialCost + routingCost.totalRoutingCost;
  const costPerUnit = totalCost / outputQuantity;

  return {
    materialCost,
    routingCost,
    totalCost,
    costPerUnit
  };
}
```

### 8. BOM Snapshot Update

When Work Order is created, BOM snapshot must include routing costs:

```typescript
interface BOMSnapshot {
  // ... existing fields
  routing_snapshot: {
    id: string;
    code: string;                  // Captured routing code
    name: string;
    is_reusable: boolean;          // Captured reusability flag
    setup_cost: number;            // Captured at WO creation
    working_cost_per_unit: number; // Captured at WO creation
    overhead_percent: number;      // Captured at WO creation
    currency: string;              // Captured currency
    operations: RoutingOperationSnapshot[];
  };
}

interface RoutingOperationSnapshot {
  sequence: number;
  name: string;
  duration: number;
  setup_time: number;
  cleanup_time: number;            // Captured cleanup time
  labor_cost_per_hour: number;
  instructions: string | null;     // Captured instructions
}
```

---

## Consequences

### Positive

1. **Complete Cost Picture**: Total production cost now includes all cost types
2. **Job Costing Accuracy**: Fixed setup costs captured per routing run
3. **Overhead Allocation**: Factory overhead can be applied systematically
4. **Variance Analysis**: Standard vs actual comparison for all cost components
5. **Pricing Support**: Better data for product pricing decisions
6. **Simple Model**: No JOIN complexity, routing versioning handles history
7. **Cleanup Time**: More accurate operation time tracking
8. **Routing Codes**: Quick lookup and identification

### Negative

1. **Schema Change**: Existing routings need default values
2. **BOM Snapshot Update**: WO bom_snapshot structure needs migration
3. **UI Updates**: Routing form needs cost input fields, code field, is_reusable checkbox
4. **Single Currency**: Currency per routing (future: org-level default)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Existing routings missing costs | DEFAULT 0 - costs are optional |
| Existing routings missing code | Migration generates code from name |
| BOM snapshot backward compatibility | Version bom_snapshot structure |
| Cost calculation performance | Costs are on routing, no extra queries |
| Multi-currency complexity | Single currency field; conversion is Future scope |

---

## Schema Summary

### routings table (final)
```sql
id                      UUID PRIMARY KEY
org_id                  UUID NOT NULL REFERENCES organizations(id)
code                    VARCHAR(50) NOT NULL        -- UX: TEC-008
name                    TEXT NOT NULL
description             TEXT
version                 INTEGER DEFAULT 1
is_active               BOOLEAN DEFAULT true
is_reusable             BOOLEAN DEFAULT true        -- UX: TEC-008
setup_cost              DECIMAL(10,2) DEFAULT 0     -- ADR-009
working_cost_per_unit   DECIMAL(10,4) DEFAULT 0     -- ADR-009
overhead_percent        DECIMAL(5,2) DEFAULT 0      -- ADR-009
currency                TEXT DEFAULT 'PLN'          -- ADR-009
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
created_by              UUID

UNIQUE(org_id, code)
UNIQUE(org_id, name, version)
```

### routing_operations table (final)
```sql
id                  UUID PRIMARY KEY
routing_id          UUID NOT NULL REFERENCES routings(id)
sequence            INTEGER NOT NULL
name                TEXT NOT NULL
description         TEXT
machine_id          UUID REFERENCES machines(id)
duration            INTEGER
setup_time          INTEGER DEFAULT 0
cleanup_time        INTEGER DEFAULT 0              -- UX: TEC-010
labor_cost_per_hour DECIMAL(15,4)
instructions        TEXT                           -- UX: TEC-010
created_at          TIMESTAMPTZ

UNIQUE(routing_id, sequence)
```

---

## Validation

- [x] Supports FR-2.70 (Recipe costing) - **IMPLEMENTED**
- [x] Supports FR-2.71 (Cost variance analysis)
- [x] Supports FR-2.73 (Labor cost per operation) - **IMPLEMENTED**
- [x] Supports FR-2.74 (Overhead allocation) - **IMPLEMENTED**
- [x] Supports FR-2.54 (Routing unique code identifier) - **IMPLEMENTED**
- [x] Supports FR-2.55 (Routing reusability flag) - **IMPLEMENTED**
- [x] Supports FR-2.43 (Operation time tracking - setup, run, cleanup) - **IMPLEMENTED**
- [x] Supports FR-2.45 (Operation instructions) - **IMPLEMENTED**
- [x] Supports FR-2.24 (BOM clone/copy) - **IMPLEMENTED** (TEC-005)
- [x] Supports FR-2.36 (BOM cost rollup) - **IMPLEMENTED** (TEC-006 Cost Summary)
- [x] Compatible with BOM Snapshot pattern (ADR-002)
- [x] Maintains routing versioning semantics
- [x] Aligned with UX wireframes TEC-005, TEC-006, TEC-008 and TEC-010

---

## References

- PRD Technical Module: `docs/1-BASELINE/product/modules/technical.md`
- Architecture Technical: `docs/1-BASELINE/architecture/modules/technical.md`
- ADR-002 BOM Snapshot: `docs/1-BASELINE/architecture/decisions/ADR-002-bom-snapshot-pattern.md`
- Phase 2C-2: Costing & Nutrition (Partially Complete)
- UX Wireframe TEC-005: `docs/3-ARCHITECTURE/ux/wireframes/TEC-005-boms-list.md`
- UX Wireframe TEC-006: `docs/3-ARCHITECTURE/ux/wireframes/TEC-006-bom-modal.md`
- UX Wireframe TEC-008: `docs/3-ARCHITECTURE/ux/wireframes/TEC-008-routing-modal.md`
- Costing Service: `apps/frontend/lib/services/costing-service.ts`
- BOM Cost API: `apps/frontend/app/api/technical/boms/[id]/cost/route.ts`
- Migration 043: `supabase/migrations/043_add_routing_costs.sql`
- Migration 044: `supabase/migrations/044_add_routing_fields.sql`
- Migration 045: `supabase/migrations/045_add_routing_id_to_boms.sql`
