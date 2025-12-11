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
- Routings (operations, machines, times)
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
expiry_policy       TEXT                    -- fixed, rolling
shelf_life_days     INTEGER
std_price           DECIMAL(15,4)
min_stock           DECIMAL(15,4)
max_stock           DECIMAL(15,4)
storage_conditions  TEXT
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
updated_by          UUID REFERENCES users(id)

UNIQUE(org_id, code)
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

#### boms
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
product_id      UUID NOT NULL REFERENCES products(id)
version         INTEGER DEFAULT 1
bom_type        TEXT DEFAULT 'standard' -- standard, engineering, costing
routing_id      UUID REFERENCES routings(id)
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
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
name            TEXT NOT NULL
description     TEXT
version         INTEGER DEFAULT 1
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
created_by      UUID REFERENCES users(id)

UNIQUE(org_id, name, version)
```

#### routing_operations
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
routing_id      UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE
sequence        INTEGER NOT NULL
name            TEXT NOT NULL
description     TEXT
machine_id      UUID REFERENCES machines(id)
duration        INTEGER                 -- Estimated minutes
setup_time      INTEGER                 -- Setup time minutes
cleanup_time    INTEGER                 -- Cleanup time minutes
labor_cost_per_hour DECIMAL(15,4)
instructions    TEXT
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(routing_id, sequence)
```

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

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_org_code ON products(org_id, code);
CREATE INDEX idx_products_org_type ON products(org_id, product_type_id);
CREATE INDEX idx_products_org_status ON products(org_id, status);
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_effective ON boms(product_id, effective_from, effective_to);
CREATE INDEX idx_boms_status ON boms(org_id, status);
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_product ON bom_items(product_id);
CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);
CREATE INDEX idx_traceability_parent ON traceability_links(parent_lot_id);
CREATE INDEX idx_traceability_child ON traceability_links(child_lot_id);
CREATE INDEX idx_traceability_wo ON traceability_links(work_order_id);
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
POST   /api/technical/boms/:id/clone          -- Clone BOM
GET    /api/technical/boms/:id/compare/:compareId -- Compare versions
POST   /api/technical/boms/:id/explode        -- Multi-level explosion
POST   /api/technical/boms/:id/scale          -- Scale to batch size
GET    /api/technical/boms/:id/cost           -- Calculate cost
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
│       └── AllergenInheritance.tsx
├── routings/
│   ├── page.tsx               -- Routing list
│   ├── [id]/page.tsx          -- Routing detail
│   └── components/
│       ├── RoutingTable.tsx
│       ├── OperationsTimeline.tsx
│       └── OperationModal.tsx
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
├── traceability-service.ts    -- Forward/backward trace, genealogy
└── costing-service.ts         -- Recipe costing (Phase 2)
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
|   bom_id    |     |   BOM          |
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

### Traceability Query Flow
```
+-------------+     +----------------+     +----------------+
|   User      | --> | Trace API      | --> | traceability_  |
|   Search    |     |                |     | links          |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             Forward: WHERE parent_lot_id = X
      |             Backward: WHERE child_lot_id = X
      |             Recursive CTE for multi-level
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|   Tree      |     |   lot_         |     |   Affected     |
|   View      |     |   genealogy    |     |   Products     |
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
| /tracing/* | Any authenticated |

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

4. **Traceability Queries:**
   - Indexes on parent_lot_id, child_lot_id
   - Recursive CTE with depth limit
   - Materialized genealogy path for fast tree retrieval

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:product:{productId}'        // 5 min TTL
'org:{orgId}:product:{productId}:bom'    // 1 min TTL (active BOM)
'org:{orgId}:bom:{bomId}:explosion'      // 5 min TTL
'org:{orgId}:allergen-matrix'            // 10 min TTL
```

---

## Integration Points

### Module Dependencies

```
Technical Module
    |
    +---> Settings (allergens, machines, production lines)
    +---> Planning (WO uses BOMs, routings)
    +---> Production (consumption creates traceability links)
    +---> Warehouse (lot tracking feeds genealogy)
    +---> Quality (specifications per product)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `product.created` | Product created | Audit log |
| `product.updated` | Product updated | Version history |
| `bom.activated` | BOM status -> active | Planning (MRP) |
| `allergen.inherited` | BOM item changed | Product allergens |
| `traceability.linked` | Consumption recorded | Genealogy tree |

---

## Business Rules

### Products
- SKU (code) immutable after creation
- Version auto-increments on any edit
- Product type cannot change after creation
- Allergens auto-calculated from active BOM ingredients

### BOMs
- Effective dates cannot overlap for same product (DB trigger enforced)
- Only ONE active BOM per product at any point in time
- BOM snapshot captured at WO creation (immutable)
- Conditional items evaluated at WO material calculation
- Alternative ingredients must have same UoM class

### Routings
- Operations must have unique sequence numbers
- Routing can be shared across multiple BOMs
- Labor cost hierarchy: BOM line override > routing operation default

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
- Routing service: CRUD, operation sequencing
- Traceability service: Forward/backward queries, genealogy

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- BOM date overlap prevention trigger

### E2E Tests
- Product creation with allergens
- BOM creation with items and alternatives
- BOM version comparison
- Traceability query (forward/backward)
- Recall simulation workflow
