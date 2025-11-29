# Technical Module Architecture

## Overview

Product master data management including Products, BOMs (with versioning), Routings, and Specifications.

## Dependencies

- **Settings**: Warehouses, UoM settings, allergen toggles

## Consumed By

- **Planning**: Products for PO/TO/WO
- **Production**: BOMs, Routings
- **Warehouse**: Products for LP
- **Quality**: Specifications
- **NPD**: Product creation handoff

## Database Schema

### Core Tables

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL, -- 'raw_material', 'semi_finished', 'finished_good', 'packaging'
  uom TEXT NOT NULL,
  category TEXT,

  -- Costing
  standard_cost DECIMAL(15,4),
  currency TEXT DEFAULT 'PLN',

  -- Quality
  shelf_life_days INTEGER,
  require_coa BOOLEAN DEFAULT false,
  require_lot_tracking BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,

  UNIQUE (org_id, sku)
);

-- Product Translations (i18n)
CREATE TABLE product_translations (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (product_id, locale)
);

-- Product Allergens (if enabled)
CREATE TABLE product_allergens (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id),
  source TEXT, -- 'contains', 'may_contain', 'free_from'
  PRIMARY KEY (product_id, allergen_id)
);

-- Allergens Master
CREATE TABLE allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  regulatory_body TEXT, -- 'EU', 'FDA', 'custom'
  UNIQUE (org_id, code)
);

-- BOMs (Versioned)
CREATE TABLE boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  version INTEGER NOT NULL,
  status bom_status NOT NULL DEFAULT 'draft',

  -- Date-based versioning
  effective_from DATE NOT NULL,
  effective_to DATE,

  -- Metadata
  batch_size DECIMAL(15,4) NOT NULL,
  batch_uom TEXT NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,

  UNIQUE (org_id, product_id, version)
);

CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');

-- BOM Items
CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  scrap_percent DECIMAL(5,2) DEFAULT 0,

  -- Consumption rules
  consume_whole_lp BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false, -- Explode to child BOM

  -- Sequencing
  sequence INTEGER NOT NULL DEFAULT 0,

  notes TEXT
);

-- BOM By-Products
CREATE TABLE bom_by_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  is_co_product BOOLEAN DEFAULT false -- vs waste
);

-- BOM History (audit)
CREATE TABLE bom_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  changed_by UUID,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed'
  old_values JSONB,
  new_values JSONB
);

-- Product Specifications (Versioned)
CREATE TABLE product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  version INTEGER NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  status TEXT DEFAULT 'draft',

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id, product_id, version)
);

-- Spec Attributes (Custom)
CREATE TABLE spec_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES product_specs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  expected_value TEXT NOT NULL,
  tolerance_min TEXT,
  tolerance_max TEXT,
  uom TEXT,
  sequence INTEGER DEFAULT 0
);

-- Routings (Future versioning)
CREATE TABLE routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Routing Operations
CREATE TABLE routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  work_center_id UUID REFERENCES machines(id),
  setup_time_minutes INTEGER DEFAULT 0,
  run_time_minutes INTEGER DEFAULT 0,
  description TEXT
);
```

### Indexes

```sql
-- Products
CREATE INDEX idx_products_org ON products(org_id);
CREATE INDEX idx_products_sku ON products(org_id, sku);
CREATE INDEX idx_products_type ON products(org_id, product_type);
CREATE INDEX idx_products_active ON products(org_id, is_active) WHERE is_active = true;

-- BOMs
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_active ON boms(product_id, status, effective_from, effective_to);
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_product ON bom_items(product_id);

-- Specs
CREATE INDEX idx_specs_product ON product_specs(product_id);
```

### Triggers

```sql
-- Prevent overlapping BOM dates
CREATE TRIGGER check_bom_overlap
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_date_overlap();

-- BOM history tracking
CREATE TRIGGER track_bom_changes
  AFTER INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION log_bom_history();
```

## API Layer

### Products API
```typescript
export class ProductsAPI {
  static async getAll(filters?: ProductFilters): Promise<Product[]>
  static async getById(id: string): Promise<Product>
  static async create(data: CreateProductInput): Promise<Product>
  static async update(id: string, data: UpdateProductInput): Promise<Product>
  static async delete(id: string): Promise<void> // Soft delete
  static async search(query: string): Promise<Product[]>

  // Allergens
  static async getAllergens(productId: string): Promise<ProductAllergen[]>
  static async setAllergens(productId: string, allergens: AllergenInput[]): Promise<void>

  // Import/Export
  static async importProducts(file: File): Promise<ImportResult>
  static async exportProducts(filters?: ProductFilters): Promise<Blob>
}
```

### BOMs API
```typescript
export class BomsAPI {
  static async getAll(productId?: string): Promise<BOM[]>
  static async getById(id: string): Promise<BOM>
  static async getActiveForProduct(productId: string, date?: Date): Promise<BOM | null>
  static async create(data: CreateBOMInput): Promise<BOM>
  static async update(id: string, data: UpdateBOMInput): Promise<BOM>
  static async createVersion(bomId: string): Promise<BOM> // Copy as new version

  // Status management
  static async activate(id: string, effectiveFrom: Date): Promise<BOM>
  static async phaseOut(id: string, effectiveTo: Date): Promise<BOM>
  static async deactivate(id: string): Promise<BOM>

  // Items
  static async getItems(bomId: string): Promise<BOMItem[]>
  static async addItem(bomId: string, data: CreateBOMItemInput): Promise<BOMItem>
  static async updateItem(itemId: string, data: UpdateBOMItemInput): Promise<BOMItem>
  static async removeItem(itemId: string): Promise<void>

  // By-products
  static async getByProducts(bomId: string): Promise<BOMByProduct[]>
  static async setByProducts(bomId: string, byProducts: ByProductInput[]): Promise<void>

  // Comparison
  static async compare(bomId1: string, bomId2: string): Promise<BOMDiff>

  // History
  static async getHistory(bomId: string): Promise<BOMHistory[]>

  // Costing
  static async calculateCost(bomId: string): Promise<BOMCost>
}
```

### Specs API
```typescript
export class SpecsAPI {
  static async getAll(productId: string): Promise<ProductSpec[]>
  static async getById(id: string): Promise<ProductSpec>
  static async getActiveForProduct(productId: string): Promise<ProductSpec | null>
  static async create(data: CreateSpecInput): Promise<ProductSpec>
  static async update(id: string, data: UpdateSpecInput): Promise<ProductSpec>

  // Attributes
  static async getAttributes(specId: string): Promise<SpecAttribute[]>
  static async setAttributes(specId: string, attrs: AttributeInput[]): Promise<void>
}
```

### Routings API
```typescript
export class RoutingsAPI {
  static async getAll(productId?: string): Promise<Routing[]>
  static async getById(id: string): Promise<Routing>
  static async getDefaultForProduct(productId: string): Promise<Routing | null>
  static async create(data: CreateRoutingInput): Promise<Routing>
  static async update(id: string, data: UpdateRoutingInput): Promise<Routing>

  // Operations
  static async getOperations(routingId: string): Promise<RoutingOperation[]>
  static async setOperations(routingId: string, ops: OperationInput[]): Promise<void>
}
```

### API Routes

```
# Products
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
GET    /api/products/:id/allergens
PUT    /api/products/:id/allergens
POST   /api/products/import
GET    /api/products/export

# BOMs
GET    /api/boms
POST   /api/boms
GET    /api/boms/:id
PATCH  /api/boms/:id
POST   /api/boms/:id/version
POST   /api/boms/:id/activate
POST   /api/boms/:id/phase-out
GET    /api/boms/:id/items
POST   /api/boms/:id/items
PATCH  /api/boms/:id/items/:itemId
DELETE /api/boms/:id/items/:itemId
GET    /api/boms/:id/by-products
PUT    /api/boms/:id/by-products
GET    /api/boms/:id/history
GET    /api/boms/compare?id1=&id2=
GET    /api/boms/active/:productId

# Specs
GET    /api/specs
POST   /api/specs
GET    /api/specs/:id
PATCH  /api/specs/:id
GET    /api/specs/:id/attributes
PUT    /api/specs/:id/attributes

# Routings
GET    /api/routings
POST   /api/routings
GET    /api/routings/:id
PATCH  /api/routings/:id
GET    /api/routings/:id/operations
PUT    /api/routings/:id/operations

# Allergens
GET    /api/allergens
POST   /api/allergens
PATCH  /api/allergens/:id
```

## Frontend Components

### Pages

```
app/(dashboard)/technical/
├── page.tsx                    # Module dashboard
├── products/
│   ├── page.tsx               # Products list
│   ├── new/page.tsx           # Create product
│   └── [id]/
│       ├── page.tsx           # Product detail
│       ├── boms/page.tsx      # Product BOMs
│       └── specs/page.tsx     # Product specs
├── boms/
│   ├── page.tsx               # All BOMs list
│   ├── new/page.tsx           # Create BOM
│   └── [id]/
│       ├── page.tsx           # BOM detail/editor
│       └── compare/page.tsx   # Version comparison
├── routings/
│   ├── page.tsx               # Routings list
│   └── [id]/page.tsx          # Routing editor
└── allergens/
    └── page.tsx               # Allergens master
```

### Key Components

```typescript
components/technical/
├── ProductForm.tsx             # Product CRUD
├── ProductSearch.tsx           # Quick search
├── AllergenSelector.tsx        # Multi-select allergens
├── BOMEditor.tsx               # BOM items editor
├── BOMTimeline.tsx             # Version timeline view
├── BOMDiffView.tsx             # Compare versions
├── BOMCostBreakdown.tsx        # Cost calculation
├── BOMTree.tsx                 # Exploded BOM view
├── ByProductEditor.tsx         # By-products form
├── SpecAttributesForm.tsx      # Spec attributes
├── RoutingStepsEditor.tsx      # Routing operations
└── ProductImportWizard.tsx     # Import from Excel
```

## Business Rules

### BOM Versioning
```typescript
// Only one active BOM per product per date
async function activateBOM(bomId: string, effectiveFrom: Date) {
  // Check for overlap
  const overlapping = await checkBOMOverlap(bomId, effectiveFrom)
  if (overlapping) {
    // Phase out existing BOM
    await phaseOutBOM(overlapping.id, addDays(effectiveFrom, -1))
  }

  return updateBOMStatus(bomId, 'active', effectiveFrom)
}

// Get active BOM for date
async function getActiveBOM(productId: string, date: Date = new Date()) {
  return db
    .from('boms')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'active')
    .lte('effective_from', date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()
}
```

### BOM Snapshot for WO
```typescript
// When WO is created, snapshot BOM into wo_materials
async function snapshotBOMForWO(woId: string, bomId: string, quantity: number) {
  const bom = await BomsAPI.getById(bomId)
  const items = await BomsAPI.getItems(bomId)

  const materials = items.map(item => ({
    wo_id: woId,
    product_id: item.product_id,
    bom_item_id: item.id,
    required_qty: calculateRequired(item.quantity, quantity, bom.batch_size),
    uom: item.uom,
    scrap_percent: item.scrap_percent,
    consume_whole_lp: item.consume_whole_lp,
    // Snapshot allergens at this moment
    allergens: item.product.allergens,
    // Snapshot version info
    product_version: item.product.version,
    bom_version: bom.version,
  }))

  return db.from('wo_materials').insert(materials)
}
```

### Allergen Aggregation
```typescript
// Aggregate allergens from BOM items
async function aggregateBOMAllergens(bomId: string): Promise<Allergen[]> {
  const items = await BomsAPI.getItems(bomId)
  const allergenMap = new Map<string, Allergen>()

  for (const item of items) {
    const productAllergens = await ProductsAPI.getAllergens(item.product_id)
    for (const pa of productAllergens) {
      allergenMap.set(pa.allergen_id, pa.allergen)
    }
  }

  return Array.from(allergenMap.values())
}
```

## BOM Cost Calculation

```typescript
interface BOMCost {
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number
  breakdown: CostItem[]
}

async function calculateBOMCost(bomId: string): Promise<BOMCost> {
  const bom = await BomsAPI.getById(bomId)
  const items = await BomsAPI.getItems(bomId)

  let materialCost = 0
  const breakdown: CostItem[] = []

  for (const item of items) {
    const product = await ProductsAPI.getById(item.product_id)
    const itemCost = product.standard_cost * item.quantity * (1 + item.scrap_percent / 100)

    materialCost += itemCost
    breakdown.push({
      product_id: item.product_id,
      product_name: product.name,
      quantity: item.quantity,
      unit_cost: product.standard_cost,
      total_cost: itemCost,
    })
  }

  // TODO: Add labor and overhead from routing

  return {
    material_cost: materialCost,
    labor_cost: 0,
    overhead_cost: 0,
    total_cost: materialCost,
    cost_per_unit: materialCost / bom.batch_size,
    breakdown,
  }
}
```

## Import/Export

### Excel Import Format
```typescript
interface ProductImportRow {
  sku: string
  name: string
  product_type: string
  uom: string
  category?: string
  standard_cost?: number
  shelf_life_days?: number
  allergens?: string // Comma-separated codes
}

async function importProducts(file: File): Promise<ImportResult> {
  const workbook = XLSX.read(await file.arrayBuffer())
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[0])

  const results = { created: 0, updated: 0, errors: [] }

  for (const row of rows) {
    try {
      const existing = await ProductsAPI.getBySKU(row.sku)
      if (existing) {
        await ProductsAPI.update(existing.id, row)
        results.updated++
      } else {
        await ProductsAPI.create(row)
        results.created++
      }
    } catch (error) {
      results.errors.push({ row, error: error.message })
    }
  }

  return results
}
```

## Caching Strategy

```typescript
// Products cached (frequently accessed)
const PRODUCT_CACHE_TTL = 5 * 60 * 1000

// BOMs cached (used in WO creation)
const BOM_CACHE_TTL = 5 * 60 * 1000

// Invalidate on updates
async function onProductUpdate(productId: string) {
  await invalidateCache(`product:${productId}`)
  await invalidateCache(`products:*`) // List cache
}

async function onBOMUpdate(bomId: string, productId: string) {
  await invalidateCache(`bom:${bomId}`)
  await invalidateCache(`bom:active:${productId}`)
}
```

## Testing

### Key Test Cases
```typescript
describe('BomsAPI', () => {
  describe('versioning', () => {
    it('creates new version with incremented number')
    it('prevents overlapping active dates')
    it('phases out previous version on activation')
    it('returns correct active BOM for date')
  })

  describe('snapshot', () => {
    it('copies BOM items to WO materials')
    it('calculates required qty from batch size')
    it('includes allergen snapshot')
  })

  describe('costing', () => {
    it('calculates material cost from items')
    it('includes scrap percentage')
    it('returns cost per unit')
  })
})
```

## Future Considerations

### Phase 3-4
- Product configurator (parametric BOMs)
- Routing versioning
- Multi-level BOM explosion
- Cost rollup from sub-assemblies
- PLM integration
