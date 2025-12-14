# Technical Module Architecture

## Overview

The Technical Module manages the product lifecycle from formulation to production routing. It handles product definitions, Bills of Materials (BOMs), routing operations, allergen tracking, lot traceability, and recipe costing.

**Module Purpose:**
- Product master data management with versioning
- Bill of Materials (BOM) with date validity and conditional items
- Routing operations and work center assignments
- Allergen declaration and inheritance
- Forward/backward traceability and recall simulation
- Recipe costing and nutrition calculation (Phase 2)

**Key Entities:**
- Products (SKU, type, status, version)
- BOMs (version, effective dates, items)
- Routings (operations, machines, times, costs)
- Traceability Links (lot genealogy)

---

## Database Schema

### Core Tables

#### products
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
code                TEXT NOT NULL           -- SKU, immutable after creation
name                TEXT NOT NULL
description         TEXT
product_type_id     UUID REFERENCES product_types(id)
uom                 TEXT NOT NULL           -- kg, L, pcs, etc.
status              TEXT DEFAULT 'active'   -- active, inactive, discontinued
version             INTEGER DEFAULT 1
barcode             TEXT
gtin                TEXT                    -- GS1 GTIN-14
category_id         UUID
supplier_id         UUID REFERENCES suppliers(id)
supplier_lead_time_days INTEGER
moq                 DECIMAL(15,4)           -- Minimum Order Quantity
expiry_policy       TEXT DEFAULT 'none'     -- fixed, rolling, none (migration 046)
shelf_life_days     INTEGER
std_price           DECIMAL(15,4)           -- Standard selling price (migration 046)
cost_per_unit       DECIMAL(15,4)           -- Production cost
min_stock           DECIMAL(15,4)
max_stock           DECIMAL(15,4)
storage_conditions  TEXT
is_perishable       BOOLEAN DEFAULT false
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
updated_by          UUID REFERENCES users(id)

UNIQUE(org_id, code)

-- Constraints (migration 046, 048)
CHECK (expiry_policy IN ('fixed', 'rolling', 'none'))
CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0) -- migration 048
-- Trigger: validates RM/PKG products have cost_per_unit (migration 048)
```

#### product_types
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL           -- raw, wip, finished, packaging
name            TEXT NOT NULL
is_default      BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

#### product_allergens
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
allergen_id     UUID NOT NULL REFERENCES allergens(id)
relation_type   TEXT NOT NULL           -- contains, may_contain
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(product_id, allergen_id)
```

#### product_version_history
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
product_id      UUID NOT NULL REFERENCES products(id)
version         INTEGER NOT NULL
changed_fields  JSONB NOT NULL          -- {field: {old, new}}
changed_by      UUID REFERENCES users(id)
changed_at      TIMESTAMPTZ DEFAULT now()
```

#### product_shelf_life (NEW - migration 047)
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
product_id              UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
calculated_days         INTEGER                 -- From min(ingredient shelf lives)
override_days           INTEGER                 -- User manual override
final_days              INTEGER NOT NULL        -- Used value (override ?? calculated)
calculation_method      TEXT                    -- manual, auto_min_ingredients
shortest_ingredient_id  UUID REFERENCES products(id)
storage_conditions      TEXT                    -- e.g., "Refrigerated 2-8C"
calculated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
created_by              UUID REFERENCES auth.users(id)

UNIQUE(org_id, product_id)
CHECK (calculated_days IS NULL OR calculated_days > 0)
CHECK (override_days IS NULL OR override_days > 0)
CHECK (final_days > 0)
```

#### boms
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
product_id      UUID NOT NULL REFERENCES products(id)
version         INTEGER DEFAULT 1
bom_type        TEXT DEFAULT 'standard' -- standard, engineering, costing
routing_id      UUID REFERENCES routings(id) ON DELETE SET NULL  -- migration 045
effective_from  DATE NOT NULL
effective_to    DATE                    -- NULL = no end date
status          TEXT DEFAULT 'draft'    -- draft, active, inactive
output_qty      DECIMAL(15,4) DEFAULT 1
output_uom      TEXT NOT NULL
units_per_box   INTEGER                 -- Packaging: units per box
boxes_per_pallet INTEGER                -- Packaging: boxes per pallet
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
created_by      UUID REFERENCES users(id)
updated_by      UUID REFERENCES users(id)

-- Trigger prevents overlapping date ranges for same product
-- Index: idx_boms_routing_id (migration 045)
```

#### bom_production_lines
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
bom_id          UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE
line_id         UUID NOT NULL REFERENCES production_lines(id)
labor_cost_per_hour DECIMAL(15,4)

UNIQUE(bom_id, line_id)
```

#### bom_items
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
bom_id          UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE
product_id      UUID NOT NULL REFERENCES products(id) -- component/ingredient
operation_seq   INTEGER                 -- Which operation this item belongs to
is_output       BOOLEAN DEFAULT false   -- true for by-products
quantity        DECIMAL(15,6) NOT NULL
uom             TEXT NOT NULL
sequence        INTEGER DEFAULT 0       -- For ordering/alternatives
line_ids        UUID[]                  -- Specific lines, NULL = all lines
scrap_percent   DECIMAL(5,2) DEFAULT 0
consume_whole_lp BOOLEAN DEFAULT false  -- 1:1 LP consumption flag
is_by_product   BOOLEAN DEFAULT false
yield_percent   DECIMAL(5,2)            -- By-product yield
condition_flags JSONB                   -- Conditional item flags
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()

-- Constraints (migration 049)
CHECK (quantity > 0)  -- migration 049
-- Trigger: validates UoM matches component base UoM (migration 049)
```

#### bom_alternatives
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
bom_item_id             UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE
org_id                  UUID NOT NULL REFERENCES organizations(id)
alternative_product_id  UUID NOT NULL REFERENCES products(id)
quantity                DECIMAL(15,6) NOT NULL
uom                     TEXT NOT NULL
preference_order        INTEGER DEFAULT 0
notes                   TEXT
created_at              TIMESTAMPTZ DEFAULT now()
```

#### routings
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id                  UUID NOT NULL REFERENCES organizations(id)
code                    VARCHAR(50) NOT NULL        -- Unique routing identifier (e.g., RTG-BREAD-01)
name                    TEXT NOT NULL
description             TEXT
version                 INTEGER DEFAULT 1
is_active               BOOLEAN DEFAULT true
is_reusable             BOOLEAN DEFAULT true        -- Can be shared across multiple products
-- Routing-level cost fields (ADR-009)
setup_cost              DECIMAL(10,2) DEFAULT 0     -- Fixed cost per routing run
working_cost_per_unit   DECIMAL(10,4) DEFAULT 0     -- Variable cost per output unit
overhead_percent        DECIMAL(5,2) DEFAULT 0      -- Overhead % on subtotal
currency                TEXT DEFAULT 'PLN'          -- Cost currency
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
created_by              UUID REFERENCES users(id)

UNIQUE(org_id, code)                                -- Unique code per organization
UNIQUE(org_id, name, version)
```

**Routing Fields Explained:**
- `code`: Unique short identifier for quick lookup (e.g., RTG-BREAD-01, RTG-COOKIES-05)
- `is_reusable`: If true, routing can be shared across multiple products/BOMs; if false, product-specific (1:1)
- `setup_cost`: Fixed cost incurred per routing run (tooling, changeover, calibration, equipment prep)
- `working_cost_per_unit`: Variable cost per output unit (utilities, consumables, depreciation per unit)
- `overhead_percent`: Factory overhead percentage applied to total routing cost subtotal
- `currency`: Currency code for cost fields (default PLN for Polish market)

#### routing_operations
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
routing_id          UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE
sequence            INTEGER NOT NULL
name                TEXT NOT NULL
description         TEXT
machine_id          UUID REFERENCES machines(id)
duration            INTEGER                 -- Estimated minutes (run time)
setup_time          INTEGER DEFAULT 0       -- Setup time minutes
cleanup_time        INTEGER DEFAULT 0       -- Cleanup time minutes after operation
labor_cost_per_hour DECIMAL(15,4)
instructions        TEXT                    -- Step-by-step operator instructions (max 2000 chars)
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(routing_id, sequence)
```

**Routing Operations Fields Explained:**
- `duration`: Estimated run time in minutes (actual processing)
- `setup_time`: Time to prepare for the operation (machine warmup, tool changes)
- `cleanup_time`: Time to clean up after operation (sanitation, tool removal)
- `instructions`: Detailed step-by-step instructions for operators (optional, max 2000 chars)

#### conditional_flags
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL           -- organic, vegan, kosher, etc.
name            TEXT NOT NULL
is_default      BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

### Traceability Tables

#### traceability_links
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
parent_lot_id   UUID NOT NULL           -- Consumed LP/lot
child_lot_id    UUID                    -- Produced LP/lot (NULL until output)
work_order_id   UUID REFERENCES work_orders(id)
quantity_consumed DECIMAL(15,4)
unit            TEXT
operation_id    UUID
consumed_at     TIMESTAMPTZ DEFAULT now()
created_at      TIMESTAMPTZ DEFAULT now()
```

#### lot_genealogy
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
lot_id          UUID NOT NULL
ancestor_lot_id UUID NOT NULL
descendant_lot_id UUID NOT NULL
generation_level INTEGER NOT NULL       -- Depth in tree
path            TEXT                    -- Materialized path
created_at      TIMESTAMPTZ DEFAULT now()
```

### Costing Tables (Phase 2)

#### product_costs
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
product_id      UUID NOT NULL REFERENCES products(id)
cost_type       TEXT NOT NULL           -- standard, actual, planned
material_cost   DECIMAL(15,4)
labor_cost      DECIMAL(15,4)
overhead_cost   DECIMAL(15,4)
total_cost      DECIMAL(15,4)
effective_from  DATE NOT NULL
effective_to    DATE
calculation_method TEXT
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
```

### ERD Diagram

```
+------------------+     +------------------+     +------------------+
|   organizations  |     |     products     |     |  product_types   |
+------------------+     +------------------+     +------------------+
| id (PK)          |<-+  | id (PK)          |---->| id (PK)          |
| name             |  |  | org_id (FK)      |     | org_id (FK)      |
+------------------+  |  | code             |     | code             |
                      |  | name             |     | name             |
                      |  | product_type_id  |     +------------------+
                      |  | std_price        |<-- migration 046
                      |  | expiry_policy    |<-- migration 046
                      |  | version          |
                      |  +------------------+
                      |         |
                      |         | 1:1 (optional)
                      |         v
                      |  +--------------------+
                      |  | product_shelf_life |<-- migration 047
                      |  +--------------------+
                      |  | id (PK)            |
                      |  | org_id (FK)        |
                      |  | product_id (FK)    |
                      |  | calculated_days    |
                      |  | override_days      |
                      |  | final_days         |
                      |  +--------------------+
                      |         |
                      |         | 1:N
                      |         v
                      |  +------------------+     +------------------+
                      |  |      boms        |---->|    routings      |
                      |  +------------------+     +------------------+
                      |  | id (PK)          |     | id (PK)          |
                      +--| org_id (FK)      |     | org_id (FK)      |
                         | product_id (FK)  |     | code             |<-- UX: TEC-008
                         | routing_id (FK)  |<--- | name             |
                         | version          |     | version          |
                         | effective_from   |     | is_reusable      |<-- UX: TEC-008
                         | effective_to     |     | setup_cost       |<-- ADR-009
                         +------------------+     | working_cost_per_unit |<-- ADR-009
                                |                 | overhead_percent |<-- ADR-009
                                | 1:N             | currency         |<-- ADR-009
                                v                 +------------------+
                         +------------------+            |
                         |   bom_items      |            | 1:N
                         +------------------+            v
                         | id (PK)          |     +----------------------+
                         | bom_id (FK)      |     | routing_operations   |
                         | product_id (FK)  |     +----------------------+
                         | operation_seq    |     | id (PK)              |
                         | quantity         |     | routing_id (FK)      |
                         | uom              |     | sequence             |
                         +------------------+     | name                 |
                                                  | duration             |
                                                  | setup_time           |
                                                  | cleanup_time         |<-- UX: TEC-010
                                                  | labor_cost_per_hour  |
                                                  | instructions         |<-- UX: TEC-010
                                                  +----------------------+
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_org_code ON products(org_id, code);
CREATE INDEX idx_products_org_type ON products(org_id, product_type_id);
CREATE INDEX idx_products_org_status ON products(org_id, status);
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_effective ON boms(product_id, effective_from, effective_to);
CREATE INDEX idx_boms_status ON boms(org_id, status);
CREATE INDEX idx_boms_routing_id ON boms(routing_id);  -- migration 045
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_product ON bom_items(product_id);
CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);
CREATE INDEX idx_routings_org_code ON routings(org_id, code);
CREATE INDEX idx_traceability_parent ON traceability_links(parent_lot_id);
CREATE INDEX idx_traceability_child ON traceability_links(child_lot_id);
CREATE INDEX idx_traceability_wo ON traceability_links(work_order_id);
CREATE INDEX idx_product_shelf_life_org_id ON product_shelf_life(org_id);  -- migration 047
CREATE INDEX idx_product_shelf_life_product_id ON product_shelf_life(product_id);  -- migration 047
```

---

## API Design

### Products Endpoints
```
GET    /api/technical/products                -- List with filters
GET    /api/technical/products/:id            -- Get product detail
POST   /api/technical/products                -- Create product
PUT    /api/technical/products/:id            -- Update product (auto-version)
DELETE /api/technical/products/:id            -- Soft delete
GET    /api/technical/products/:id/versions   -- Version history
GET    /api/technical/products/:id/history    -- Audit log
POST   /api/technical/products/:id/clone      -- Clone product
GET    /api/technical/products/:id/allergens  -- Get allergen declarations
POST   /api/technical/products/:id/allergens  -- Set allergen declaration
DELETE /api/technical/products/:id/allergens/:allergenId
```

### Product Types Endpoints
```
GET    /api/technical/product-types
POST   /api/technical/product-types
PUT    /api/technical/product-types/:id
DELETE /api/technical/product-types/:id
```

### BOMs Endpoints
```
GET    /api/technical/boms                    -- List BOMs
GET    /api/technical/boms/:id                -- BOM detail with items
POST   /api/technical/boms                    -- Create BOM
PUT    /api/technical/boms/:id                -- Update BOM
DELETE /api/technical/boms/:id                -- Delete (if not used)
GET    /api/technical/boms/:id/items          -- Get BOM items
POST   /api/technical/boms/:id/items          -- Add item
PUT    /api/technical/boms/:id/items/:itemId  -- Update item
DELETE /api/technical/boms/:id/items/:itemId  -- Remove item
POST   /api/technical/boms/:id/clone          -- Clone BOM (FR-2.24 DONE)
GET    /api/technical/boms/:id/compare/:compareId -- Compare versions
POST   /api/technical/boms/:id/explode        -- Multi-level explosion
POST   /api/technical/boms/:id/scale          -- Scale to batch size
GET    /api/technical/boms/:id/cost           -- Calculate cost (IMPLEMENTED)
POST   /api/technical/boms/:id/recalculate-cost -- Force recalculation
GET    /api/technical/boms/:id/allergens      -- Inherited allergens
POST   /api/technical/boms/:id/items/:itemId/alternatives -- Add alternative
GET    /api/technical/boms/:id/items/:itemId/alternatives
DELETE /api/technical/boms/:id/items/:itemId/alternatives/:altId
```

### Routings Endpoints
```
GET    /api/technical/routings
GET    /api/technical/routings/:id
POST   /api/technical/routings
PUT    /api/technical/routings/:id
DELETE /api/technical/routings/:id
GET    /api/technical/routings/:id/operations
POST   /api/technical/routings/:id/operations
PUT    /api/technical/routings/:id/operations/:opId
DELETE /api/technical/routings/:id/operations/:opId
POST   /api/technical/routings/:id/clone
GET    /api/technical/routings/:id/products   -- BOMs using this routing
GET    /api/technical/routings/:id/cost       -- Calculate routing cost (ADR-009)
```

### Shelf Life Endpoints
```
GET    /api/technical/shelf-life/products/:id           -- Get shelf life data
POST   /api/technical/shelf-life/products/:id/calculate -- Calculate from ingredients
PUT    /api/technical/shelf-life/products/:id/override  -- Set manual override
```

### Traceability Endpoints
```
POST   /api/technical/tracing/forward         -- Where-used query
POST   /api/technical/tracing/backward        -- What-consumed query
POST   /api/technical/tracing/recall          -- Recall simulation
GET    /api/technical/tracing/recall/:id/export
GET    /api/technical/tracing/genealogy/:lotId -- Tree view data
```

### Dashboard Endpoints
```
GET    /api/technical/dashboard/stats         -- Product/BOM counts
GET    /api/technical/dashboard/allergen-matrix -- Products x Allergens
GET    /api/technical/dashboard/version-timeline
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/technical/
├── page.tsx                    -- Technical dashboard
├── products/
│   ├── page.tsx               -- Product list
│   ├── new/page.tsx           -- Create product
│   ├── [id]/page.tsx          -- Product detail
│   ├── [id]/edit/page.tsx     -- Edit product
│   └── components/
│       ├── ProductTable.tsx
│       ├── ProductForm.tsx
│       ├── ProductVersionHistory.tsx
│       ├── AllergenSelector.tsx
│       └── ProductTypeFilter.tsx
├── boms/
│   ├── page.tsx               -- BOM list
│   ├── new/page.tsx           -- Create BOM
│   ├── [id]/page.tsx          -- BOM detail with items
│   ├── [id]/compare/[compareId]/page.tsx
│   └── components/
│       ├── BOMTable.tsx
│       ├── BOMForm.tsx
│       ├── BOMItemsTable.tsx
│       ├── BOMItemModal.tsx
│       ├── BOMTimeline.tsx
│       ├── BOMExplosionTree.tsx
│       ├── BOMCostSummary.tsx       -- NEW: Cost summary panel (FR-2.36)
│       └── AllergenInheritance.tsx
├── routings/
│   ├── page.tsx               -- Routing list
│   ├── [id]/page.tsx          -- Routing detail
│   └── components/
│       ├── RoutingTable.tsx
│       ├── RoutingForm.tsx         -- Includes code, is_reusable, cost fields
│       ├── RoutingCostPanel.tsx    -- Cost display component (ADR-009)
│       ├── OperationsTimeline.tsx
│       └── OperationModal.tsx      -- Includes cleanup_time, instructions
└── traceability/
    ├── page.tsx               -- Traceability search
    ├── forward/[lotId]/page.tsx
    ├── backward/[lotId]/page.tsx
    ├── genealogy/[lotId]/page.tsx
    └── components/
        ├── TraceabilitySearch.tsx
        ├── GenealogyTree.tsx
        └── RecallSimulation.tsx
```

### Service Dependencies

```
lib/services/
├── product-service.ts         -- Product CRUD, versioning
├── product-type-service.ts    -- Product types CRUD
├── bom-service.ts             -- BOM CRUD, items, allergen inheritance
├── routing-service.ts         -- Routing + operations
├── routing-cost-service.ts    -- Routing cost calculation (ADR-009)
├── traceability-service.ts    -- Forward/backward trace, genealogy
├── costing-service.ts         -- BOM cost calculation (IMPLEMENTED)
│   └── calculateTotalBOMCost()  -- Material + labor + setup + working + overhead
│   └── calculateUnitCost()      -- Cost per output unit
│   └── compareBOMCosts()        -- Compare two BOM versions
└── shelf-life-service.ts      -- Shelf life calculation (Phase 2C-2)
```

---

## Cost Calculation Logic (ADR-009 - IMPLEMENTED)

### Routing Cost Calculation

```typescript
interface RoutingCostResult {
  operationLaborCost: number;      // SUM(operation.labor_cost_per_hour * duration_hours)
  operationSetupCost: number;      // SUM(operation.setup_time * labor_rate)
  operationCleanupCost: number;    // SUM(operation.cleanup_time * labor_rate)
  routingSetupCost: number;        // routing.setup_cost (fixed per run)
  routingWorkingCost: number;      // routing.working_cost_per_unit * quantity
  subtotal: number;                // Sum of above
  overheadCost: number;            // subtotal * (routing.overhead_percent / 100)
  totalRoutingCost: number;        // subtotal + overheadCost
}

function calculateRoutingCost(
  routing: Routing,
  operations: RoutingOperation[],
  outputQuantity: number,
  defaultLaborRate: number = 50
): RoutingCostResult {

  // 1. Operation labor costs (run time)
  const operationLaborCost = operations.reduce((sum, op) => {
    const rate = op.labor_cost_per_hour ?? defaultLaborRate;
    const hours = (op.duration ?? 0) / 60;
    return sum + (rate * hours);
  }, 0);

  // 2. Operation setup costs
  const operationSetupCost = operations.reduce((sum, op) => {
    const rate = op.labor_cost_per_hour ?? defaultLaborRate;
    const setupHours = (op.setup_time ?? 0) / 60;
    return sum + (rate * setupHours);
  }, 0);

  // 3. Operation cleanup costs
  const operationCleanupCost = operations.reduce((sum, op) => {
    const rate = op.labor_cost_per_hour ?? defaultLaborRate;
    const cleanupHours = (op.cleanup_time ?? 0) / 60;
    return sum + (rate * cleanupHours);
  }, 0);

  // 4. Routing-level costs (ADR-009)
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

### Total Product Cost Formula

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
  const materialCost = bom.items
    .filter(item => !item.is_output)
    .reduce((sum, item) => {
      const unitCost = ingredientCosts.get(item.product_id) ?? 0;
      const totalQty = item.quantity * (1 + (item.scrap_percent ?? 0) / 100);
      return sum + (unitCost * totalQty);
    }, 0);

  // 2. Routing cost (includes cleanup_time now)
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

### BOM Snapshot with Routing Costs

When Work Order is created, BOM snapshot captures routing costs:

```typescript
interface BOMSnapshot {
  id: string;
  product_id: string;
  version: number;
  items: BOMItemSnapshot[];
  routing_snapshot: {
    id: string;
    code: string;                  // Captured routing code
    name: string;
    version: number;
    is_reusable: boolean;          // Captured reusability flag
    setup_cost: number;            // Captured at WO creation
    working_cost_per_unit: number; // Captured at WO creation
    overhead_percent: number;      // Captured at WO creation
    currency: string;              // Captured currency
    operations: RoutingOperationSnapshot[];
  };
  captured_at: string;
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

## Data Flow

### BOM Auto-Selection for Work Order
```
+-------------+     +----------------+     +----------------+
|   Planning  | --> |  BOM Service   | --> |   boms table   |
|   (WO Create)|    |  getActiveBOM  |     |                |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Query: product_id = X
      |                    AND status = 'active'
      |                    AND effective_from <= scheduled_date
      |                    AND (effective_to IS NULL OR >= scheduled_date)
      |                    ORDER BY effective_from DESC LIMIT 1
      |                    |
      v                    v
+-------------+     +----------------+
|   WO with   |     |   Selected     |
|   bom_id    |     |   BOM + Routing|
+-------------+     +----------------+
```

### Allergen Inheritance Flow
```
+-------------+     +----------------+     +----------------+
|   BOM Item  | --> | BOM Service    | --> | product_       |
|   Added     |     | recalcAllergens|     | allergens      |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             For each BOM item:            |
      |             - Get product allergens       |
      |             - Merge with existing         |
      |             - Update parent product       |
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|   Trigger   |     |   Aggregate    |     |   Parent       |
|   Event     |     |   Allergens    |     |   Product      |
+-------------+     +----------------+     +----------------+
```

### Cost Calculation Flow (ADR-009 - IMPLEMENTED)
```
+-------------+     +----------------+     +----------------+
|   BOM       | --> | Costing Service| --> |   Routing +    |
|   Request   |     | calculateCost  |     |   Operations   |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             1. Get BOM items              |
      |             2. Get ingredient costs       |
      |             3. Get routing + operations   |
      |             4. Calculate:                 |
      |                - Material cost            |
      |                - Operation labor          |
      |                - Operation setup          |
      |                - Operation cleanup (NEW)  |
      |                - Routing setup (ADR-009)  |
      |                - Routing working (ADR-009)|
      |                - Overhead (ADR-009)       |
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|   Cost      |     |   Breakdown    |     |   Total Cost   |
|   Response  |     |   Details      |     |   Per Unit     |
+-------------+     +----------------+     +----------------+
```

---

## Security

### RLS Policies

```sql
-- Products: org_id filter
CREATE POLICY "Products org isolation"
ON products FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- BOMs: org_id filter
CREATE POLICY "BOMs org isolation"
ON boms FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Routings: org_id filter
CREATE POLICY "Routings org isolation"
ON routings FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Traceability: org_id filter
CREATE POLICY "Traceability org isolation"
ON traceability_links FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Product Shelf Life: org_id filter (migration 047)
CREATE POLICY "select_product_shelf_life"
ON product_shelf_life FOR SELECT
USING (org_id = auth_org_id());
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /products | Any authenticated |
| POST /products | Admin, Production Manager |
| PUT /products | Admin, Production Manager |
| DELETE /products | Admin only |
| * /boms | Admin, Production Manager |
| * /routings | Admin, Production Manager |
| PUT /routings (costs) | Admin, Finance Manager |
| /tracing/* | Any authenticated |
| * /shelf-life | Admin, Production Manager |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Products per org | 500-2,000 | 50,000 |
| BOMs per product | 3-10 | 100 |
| BOM items per BOM | 5-30 | 200 |
| Routings per org | 20-100 | 1,000 |
| Operations per routing | 3-10 | 50 |
| Traceability links | 10,000-100,000 | 10M |

### Query Optimization

1. **Product Search:**
   - Full-text index on name, code, description
   - Composite index on (org_id, product_type_id, status)
   - Paginate with limit 50

2. **BOM Effective Date Query:**
   - Index on (product_id, effective_from, effective_to)
   - Use date range overlap prevention trigger
   - Cache active BOM per product (1 min TTL)

3. **BOM Explosion (Multi-level):**
   - Recursive CTE with depth limit (10 levels)
   - Cache explosion results (5 min TTL)
   - Limit to 1000 nodes per query

4. **Cost Calculation:**
   - No extra queries for routing costs (same table)
   - Cache calculated costs (5 min TTL)
   - Batch ingredient cost lookups

5. **Traceability Queries:**
   - Indexes on parent_lot_id, child_lot_id
   - Recursive CTE with depth limit
   - Materialized genealogy path for fast tree retrieval

6. **Routing Lookup by Code:**
   - Index on (org_id, code) for fast routing code lookups
   - Used in quick search/autocomplete

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:product:{productId}'        // 5 min TTL
'org:{orgId}:product:{productId}:bom'    // 1 min TTL (active BOM)
'org:{orgId}:bom:{bomId}:explosion'      // 5 min TTL
'org:{orgId}:bom:{bomId}:cost'           // 5 min TTL
'org:{orgId}:routing:{routingId}:cost'   // 5 min TTL
'org:{orgId}:routing:code:{code}'        // 5 min TTL (routing by code lookup)
'org:{orgId}:allergen-matrix'            // 10 min TTL
```

---

## Integration Points

### Module Dependencies

```
Technical Module
    |
    +---> Settings (allergens, machines, production lines)
    +---> Planning (WO uses BOMs, routings, captures cost snapshot)
    +---> Production (consumption creates traceability links, actual costs)
    +---> Warehouse (lot tracking feeds genealogy)
    +---> Quality (specifications per product)
    +---> Finance (cost variance analysis)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `product.created` | Product created | Audit log |
| `product.updated` | Product updated | Version history |
| `bom.activated` | BOM status -> active | Planning (MRP) |
| `allergen.inherited` | BOM item changed | Product allergens |
| `traceability.linked` | Consumption recorded | Genealogy tree |
| `routing.cost_updated` | Routing costs changed | Cost recalculation |
| `routing.created` | Routing created | Audit log |

---

## Business Rules

### Products
- SKU (code) immutable after creation
- Version auto-increments on any edit
- Product type cannot change after creation
- Allergens auto-calculated from active BOM ingredients
- **Perishable products must have shelf_life_days and expiry_policy != 'none'** (migration 046)
- **RM/PKG products should have cost_per_unit set (warning if missing)** (migration 048)

### BOMs
- Effective dates cannot overlap for same product (DB trigger enforced)
- Only ONE active BOM per product at any point in time
- BOM snapshot captured at WO creation (immutable)
- Conditional items evaluated at WO material calculation
- Alternative ingredients must have same UoM class
- **Clone action copies all items, routing, and notes to new product** (FR-2.24 DONE)
- **BOM items must have quantity > 0** (migration 049)
- **BOM item UoM should match component base UoM (warning if mismatch)** (migration 049)

### Routings
- Operations must have unique sequence numbers
- Routing can be shared across multiple BOMs (if is_reusable = true)
- Labor cost hierarchy: BOM line override > routing operation default
- **Routing code must be unique per organization (UNIQUE(org_id, code))**
- **Routing code format: uppercase alphanumeric + hyphens (e.g., RTG-BREAD-01)**
- **Reusable routings (is_reusable = true) can be shared across multiple products**
- **Non-reusable routings (is_reusable = false) are product-specific (1:1)**
- **Routing costs are versioned with routing version**
- **Cost fields default to 0 (optional, backwards compatible)**
- **When routing is cloned, costs and code are copied (code gets "-COPY" suffix)**

### Routing Operations
- Operations must have unique sequence numbers within a routing
- **Total operation time = setup_time + duration + cleanup_time**
- **cleanup_time is optional, defaults to 0**
- **instructions field is optional, max 2000 characters**

### Traceability
- Links created on material consumption (Production module)
- Forward trace: lot -> all products that consumed it
- Backward trace: lot <- all ingredients that made it
- Genealogy tree depth limited to 10 levels
- Recall simulation returns all affected downstream lots

---

## Testing Requirements

### Unit Tests (80%+ coverage)
- Product service: CRUD, versioning, allergen management
- BOM service: CRUD, date validation, explosion, scaling
- Routing service: CRUD, operation sequencing, code uniqueness
- **Routing cost service: Cost calculation, overhead, snapshot, cleanup_time**
- **Costing service: calculateTotalBOMCost(), compareBOMCosts()**
- Traceability service: Forward/backward queries, genealogy

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- BOM date overlap prevention trigger
- **Routing code uniqueness constraint**
- **Routing cost calculation with operations (including cleanup)**
- **BOM item UoM validation trigger** (migration 049)
- **Product cost validation trigger** (migration 048)

### E2E Tests
- Product creation with allergens
- BOM creation with items and alternatives
- BOM version comparison
- **BOM clone action (FR-2.24)**
- **Routing creation with code and is_reusable flag**
- **Routing cost configuration and calculation**
- Traceability query (forward/backward)
- Recall simulation workflow

---

## Migration History

| Migration | Description | Date |
|-----------|-------------|------|
| 043 | Add routing cost fields (setup_cost, working_cost_per_unit, overhead_percent, currency) | 2025-12-14 |
| 044 | Add routing.code, routing.is_reusable, routing_operations.cleanup_time, routing_operations.instructions | 2025-12-14 |
| 045 | Add boms.routing_id FK to routings | 2025-12-14 |
| 046 | Add products.std_price, products.expiry_policy, perishable constraint | 2025-12-14 |
| 047 | Create product_shelf_life table | 2025-12-14 |
| 048 | Add cost_per_unit validation trigger, positive constraint | 2025-12-14 |
| 049 | Add BOM item UoM validation trigger, quantity check | 2025-12-14 |

---

## Related Documents

- PRD: `docs/1-BASELINE/product/modules/technical.md`
- ADR-009: `docs/1-BASELINE/architecture/decisions/ADR-009-routing-level-costs.md`
- ADR-002: `docs/1-BASELINE/architecture/decisions/ADR-002-bom-snapshot-pattern.md`
- UX Wireframe TEC-005: `docs/3-ARCHITECTURE/ux/wireframes/TEC-005-boms-list.md`
- UX Wireframe TEC-006: `docs/3-ARCHITECTURE/ux/wireframes/TEC-006-bom-modal.md`
- UX Wireframe TEC-008: `docs/3-ARCHITECTURE/ux/wireframes/TEC-008-routing-modal.md`
- Costing Service: `apps/frontend/lib/services/costing-service.ts`
- Migrations: `supabase/migrations/043_add_routing_costs.sql` through `049_add_uom_validation.sql`
