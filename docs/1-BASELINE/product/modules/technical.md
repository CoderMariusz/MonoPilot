# Technical Module - Product Requirements Document

**Version**: 2.3
**Last Updated**: 2025-12-14
**Status**: Production (Epic 2 Complete + Wave 1-3 Fixes)
**Owner**: Product Team

## 1. Overview

Food Manufacturing ERP Technical Module manages product lifecycle from formulation to production routing. Handles product definitions, BOMs, routings, traceability, costing, and nutrition.

**Scope**: Product CRUD, BOM management, routing operations, allergen tracking, lot traceability, recipe costing, nutrition calculation.

## 2. Functional Requirements

### 2.1 Products

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.1 | Product CRUD (SKU, name, type, version) | P0 | 2A-1 | Done |
| FR-2.2 | Product versioning (auto-increment on edit) | P0 | 2A-1 | Done |
| FR-2.3 | Product history audit log | P1 | 2A-1 | Done |
| FR-2.4 | Allergen declaration (contains/may contain) | P0 | 2A-1 | Done |
| FR-2.5 | Product types (raw, WIP, finished, packaging) | P0 | 2A-1 | Done |
| FR-2.6 | Product status (active/inactive/discontinued) | P0 | 2A-1 | Done |
| FR-2.7 | Product search and filters | P1 | 2A-1 | Done |
| FR-2.8 | Technical settings (yield, shelf life, storage) | P1 | 2A-1 | Done |
| FR-2.9 | Product image upload | P2 | 2E-1 | Planned |
| FR-2.10 | Product clone/duplicate | P1 | 2E-1 | Planned |
| FR-2.11 | Product barcode generation | P2 | Future | Planned |
| FR-2.12 | Product categories and tags | P2 | Future | Planned |
| FR-2.13 | Product standard price (std_price) | P1 | 2C-2 | **Done** (migration 046) |
| FR-2.14 | Product expiry policy (fixed/rolling/none) | P1 | 2C-2 | **Done** (migration 046) |
| FR-2.15 | Product cost validation (RM/PKG warning) | P1 | 2C-2 | **Done** (migration 048) |

### 2.2 Bill of Materials (BOM)

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.20 | BOM CRUD (version, effective dates) | P0 | 2B-1 | Done |
| FR-2.21 | BOM items (ingredient, qty, unit, sequence) | P0 | 2B-1 | Done |
| FR-2.22 | BOM date validity (from/to, overlap prevention) | P0 | 2B-1 | Done |
| FR-2.23 | BOM version timeline visualization | P1 | 2B-1 | Done |
| FR-2.24 | BOM clone/copy version | P1 | 2B-2 | **Done** (TEC-005 Clone action) |
| FR-2.25 | BOM version comparison (diff view) | P1 | 2B-2 | Done |
| FR-2.26 | Conditional BOM items (if/then rules) | P1 | 2B-2 | Done |
| FR-2.27 | BOM byproducts (yield %) | P1 | 2B-2 | Done |
| FR-2.28 | Allergen inheritance from ingredients | P0 | 2B-2 | Done |
| FR-2.29 | BOM multi-level explosion | P1 | 2C-1 | Done |
| FR-2.30 | Alternative ingredients (substitution) | P1 | 2A-2 | Done |
| FR-2.31 | BOM item operation assignment | P0 | 2A-2 | Done |
| FR-2.32 | BOM packaging fields | P1 | 2A-2 | Done |
| FR-2.33 | BOM production line assignment | P0 | 2A-2 | Done |
| FR-2.34 | BOM yield calculation | P0 | 2C-2 | Planned |
| FR-2.35 | BOM scaling (batch size adjust) | P1 | 2C-2 | Planned |
| FR-2.36 | BOM cost rollup (material + labor + routing) | P0 | 2C-2 | **Done** (costing-service.ts) |
| FR-2.37 | BOM routing reference (routing_id) | P0 | 2C-2 | **Done** (migration 045) |
| FR-2.38 | BOM item UoM validation | P1 | 2C-2 | **Done** (migration 049) |
| FR-2.39 | BOM item quantity validation | P0 | 2C-2 | **Done** (migration 049) |

### 2.3 Routing

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.40 | Routing CRUD (name, version, reusable) | P0 | 2C-1 | Done |
| FR-2.41 | Routing operations (sequence, work center, time) | P0 | 2C-1 | Done |
| FR-2.42 | BOM-routing assignment | P0 | 2A-2 | Done |
| FR-2.43 | Operation time tracking (setup, run, cleanup) | P0 | 2C-1 | Done |
| FR-2.44 | Machine/work center assignment | P0 | 2C-1 | Done |
| FR-2.45 | Operation instructions and attachments | P1 | 2C-1 | Done |
| FR-2.46 | Routing versioning | P1 | 2C-1 | Done |
| FR-2.47 | Routing templates | P2 | Future | Planned |
| FR-2.48 | Parallel operations | P2 | Future | Planned |
| FR-2.49 | Operation quality checkpoints | P1 | Epic 6 | Planned |
| FR-2.50 | Operation labor cost calculation | P1 | 2C-2 | **Done** |
| FR-2.51 | Routing setup cost configuration | P1 | 2C-2 | **Done** (ADR-009) |
| FR-2.52 | Routing working cost per unit/batch | P1 | 2C-2 | **Done** (ADR-009) |
| FR-2.53 | Routing overhead percentage | P2 | 2C-2 | **Done** (ADR-009) |
| FR-2.54 | Routing unique code identifier | P0 | 2C-1 | Done |
| FR-2.55 | Routing reusability flag | P0 | 2C-1 | Done |

### 2.4 Traceability

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.60 | Forward traceability (where used) | P0 | 2D-1 | Done |
| FR-2.61 | Backward traceability (what consumed) | P0 | 2D-1 | Done |
| FR-2.62 | Recall simulation | P0 | 2D-1 | Done |
| FR-2.63 | Genealogy tree visualization | P1 | 2D-1 | Done |
| FR-2.64 | Lot/batch tracking | P0 | 2D-1 | Done |
| FR-2.65 | Traceability matrix report | P1 | 2D-1 | Done |
| FR-2.66 | Ingredient origin tracking | P2 | Future | Planned |
| FR-2.67 | Cross-contamination tracking | P2 | Future | Planned |

### 2.5 Costing

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.70 | Recipe costing (ingredient costs) | P0 | 2C-2 | **Done** (costing-service.ts) |
| FR-2.71 | Cost variance analysis (std vs actual) | P1 | 2C-2 | Planned |
| FR-2.72 | Cost rollup (multi-level BOM) | P0 | 2C-2 | **Done** |
| FR-2.73 | Labor cost per operation | P1 | 2C-2 | **Done** |
| FR-2.74 | Overhead allocation | P1 | 2C-2 | **Done** (ADR-009) |
| FR-2.75 | Historical cost tracking | P1 | 2C-2 | Planned |
| FR-2.76 | Cost scenario modeling | P2 | Future | Planned |
| FR-2.77 | Routing-level cost calculation | P1 | 2C-2 | **Done** (ADR-009) |

### 2.6 Nutrition

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.80 | Nutrition calculation from ingredients | P1 | 2C-2 | Planned |
| FR-2.81 | Nutrition label generation (FDA format) | P1 | 2C-2 | Planned |
| FR-2.82 | Nutrition per serving size | P1 | 2C-2 | Planned |
| FR-2.83 | Nutrition claims validation | P2 | Future | Planned |
| FR-2.84 | Allergen label generation | P1 | 2C-2 | Planned |

### 2.7 Shelf Life

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.90 | Shelf life calculation from ingredients | P1 | 2C-2 | **Done** (migration 047, schema ready) |
| FR-2.91 | Minimum shelf life rule (shortest ingredient) | P0 | 2C-2 | **Done** (product_shelf_life table) |
| FR-2.92 | Shelf life override (manual) | P1 | 2C-2 | **Done** (override_days field) |
| FR-2.93 | Storage conditions impact | P2 | Future | Planned |

### 2.8 Dashboard

| FR-ID | Requirement | Priority | Phase | Status |
|-------|-------------|----------|-------|--------|
| FR-2.100 | Product dashboard (counts, stats) | P1 | 2E-1 | Done |
| FR-2.101 | Allergen matrix (products x allergens) | P1 | 2E-1 | Done |
| FR-2.102 | BOM version timeline | P1 | 2E-1 | Planned |
| FR-2.103 | Cost trend analysis | P2 | Future | Planned |

## 3. Database Schema

### 3.1 Core Tables

#### products
```
id, org_id, code (SKU), name, description, product_type_id,
base_uom, status, version, barcode, category_id, supplier_id,
supplier_lead_time_days, moq, expiry_policy (migration 046), shelf_life_days,
std_price (migration 046), cost_per_unit, min_stock, max_stock, storage_conditions,
is_perishable, created_at, updated_at, created_by, updated_by

Constraints:
- CHECK (expiry_policy IN ('fixed', 'rolling', 'none'))
- CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0) (migration 048)
- Trigger: validates RM/PKG have cost_per_unit (migration 048)
```

#### product_types
```
id, org_id, code, name, is_default, is_active, created_at
```

#### product_allergens
```
id, product_id, allergen_id, relation_type (contains/may_contain), created_at
```

#### product_version_history
```
id, product_id, version, changed_fields (jsonb), changed_by, changed_at
```

#### product_shelf_life (NEW - migration 047)
```
id, org_id, product_id, calculated_days, override_days, final_days,
calculation_method (manual/auto_min_ingredients), shortest_ingredient_id,
storage_conditions, calculated_at, created_at, updated_at, created_by

Constraints:
- UNIQUE(org_id, product_id)
- CHECK (calculated_days IS NULL OR calculated_days > 0)
- CHECK (override_days IS NULL OR override_days > 0)
- CHECK (final_days > 0)
```

#### boms
```
id, org_id, product_id, version, bom_type, routing_id (migration 045),
effective_from, effective_to, status, output_qty, output_uom,
units_per_box, boxes_per_pallet, notes,
created_at, updated_at, created_by, updated_by
```

#### bom_production_lines
```
id, bom_id, line_id, labor_cost_per_hour
```

#### bom_items
```
id, bom_id, component_id, operation_seq, is_output,
quantity, uom, sequence (for alternatives), line_ids,
scrap_percent, consume_whole_lp, notes, created_at

Constraints (migration 049):
- CHECK (quantity > 0)
- Trigger: validates UoM matches component base UoM
```

#### bom_alternatives
```
id, bom_item_id, org_id, alternative_ingredient_id,
quantity, uom, preference_order, notes, created_at
```

#### routings
```
id, org_id, code, name, description, version, is_active, is_reusable,
setup_cost, working_cost_per_unit, overhead_percent, currency,
created_at, updated_at, created_by
```

**Routings Schema Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| code | VARCHAR(50) | Required | Unique routing identifier (e.g., RTG-BREAD-01) |
| name | TEXT | Required | Descriptive routing name |
| description | TEXT | NULL | Optional description |
| version | INTEGER | 1 | Auto-increment on edit |
| is_active | BOOLEAN | true | Can be assigned to BOMs |
| is_reusable | BOOLEAN | true | Can be shared across multiple products |
| setup_cost | DECIMAL(10,2) | 0 | Fixed cost per routing run (ADR-009) |
| working_cost_per_unit | DECIMAL(10,4) | 0 | Variable cost per output unit (ADR-009) |
| overhead_percent | DECIMAL(5,2) | 0 | Factory overhead % (ADR-009) |
| currency | TEXT | 'PLN' | Currency for cost fields (ADR-009) |

**Constraints:**
- UNIQUE(org_id, code) - Code must be unique per organization
- UNIQUE(org_id, name, version) - Name+version must be unique

#### routing_operations
```
id, routing_id, sequence, name, description, machine_id,
setup_time, duration, cleanup_time, labor_cost_per_hour,
instructions, created_at
```

**Routing Operations Schema Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| sequence | INTEGER | Required | Operation order (1, 2, 3...) |
| name | TEXT | Required | Operation name |
| description | TEXT | NULL | Optional description |
| machine_id | UUID | NULL | Assigned machine/work center |
| setup_time | INTEGER | 0 | Setup time in minutes |
| duration | INTEGER | NULL | Run time in minutes |
| cleanup_time | INTEGER | 0 | Cleanup time in minutes |
| labor_cost_per_hour | DECIMAL(15,4) | NULL | Labor rate override |
| instructions | TEXT | NULL | Operator instructions (max 2000 chars) |

**Constraints:**
- UNIQUE(routing_id, sequence) - Sequence must be unique within routing

#### conditional_flags
```
id, org_id, code, name, is_default, is_active, created_at
```

### 3.2 Traceability Tables

#### traceability_links
```
id, org_id, parent_lot_id, child_lot_id, work_order_id,
quantity_consumed, unit, operation_id, consumed_at, created_at
```

#### lot_genealogy
```
id, org_id, lot_id, ancestor_lot_id, descendant_lot_id,
generation_level, path, created_at
```

### 3.3 Costing Tables

#### product_costs
```
id, org_id, product_id, cost_type, material_cost, labor_cost,
overhead_cost, total_cost, effective_from, effective_to,
calculation_method, created_by, created_at
```

#### cost_variances
```
id, org_id, work_order_id, product_id, standard_cost, actual_cost,
variance_amount, variance_percentage, variance_type,
analyzed_at, notes, created_at
```

#### ingredient_costs
```
id, org_id, ingredient_id, cost_per_unit, unit, currency,
effective_from, effective_to, supplier_id, created_at
```

### 3.4 Nutrition Tables

#### product_nutrition
```
id, org_id, product_id, serving_size, serving_unit,
calories, protein, carbs, fat, fiber, sugar, sodium,
calculated_at, is_manual_override, created_at, updated_at
```

#### ingredient_nutrition
```
id, org_id, ingredient_id, per_unit, unit,
calories, protein, carbs, fat, fiber, sugar, sodium,
vitamins_json, minerals_json, source, created_at, updated_at
```

## 4. API Endpoints

### 4.1 Products
```
GET    /api/technical/products
POST   /api/technical/products
GET    /api/technical/products/:id
PUT    /api/technical/products/:id
DELETE /api/technical/products/:id
GET    /api/technical/products/:id/versions
POST   /api/technical/products/:id/versions
GET    /api/technical/products/:id/history
POST   /api/technical/products/:id/clone
GET    /api/technical/products/:id/allergens
POST   /api/technical/products/:id/allergens
DELETE /api/technical/products/:id/allergens/:allergenId
```

### 4.2 Product Types
```
GET    /api/technical/product-types
POST   /api/technical/product-types
PUT    /api/technical/product-types/:id
DELETE /api/technical/product-types/:id
```

### 4.3 BOMs
```
GET    /api/technical/boms
POST   /api/technical/boms
GET    /api/technical/boms/:id
PUT    /api/technical/boms/:id
DELETE /api/technical/boms/:id
GET    /api/technical/boms/:id/items
POST   /api/technical/boms/:id/items
PUT    /api/technical/boms/:id/items/:itemId
DELETE /api/technical/boms/:id/items/:itemId
POST   /api/technical/boms/:id/clone
GET    /api/technical/boms/:id/compare/:compareId
POST   /api/technical/boms/:id/explode
POST   /api/technical/boms/:id/scale
GET    /api/technical/boms/:id/cost              -- IMPLEMENTED
POST   /api/technical/boms/:id/recalculate-cost  -- IMPLEMENTED
POST   /api/technical/boms/:id/items/:itemId/alternatives
GET    /api/technical/boms/:id/items/:itemId/alternatives
DELETE /api/technical/boms/:id/items/:itemId/alternatives/:altId
GET    /api/technical/boms/:id/allergens
```

### 4.4 Routings
```
GET    /api/technical/routings
POST   /api/technical/routings
GET    /api/technical/routings/:id
PUT    /api/technical/routings/:id
DELETE /api/technical/routings/:id
GET    /api/technical/routings/:id/operations
POST   /api/technical/routings/:id/operations
PUT    /api/technical/routings/:id/operations/:opId
DELETE /api/technical/routings/:id/operations/:opId
POST   /api/technical/routings/:id/clone
GET    /api/technical/routings/:id/products
PUT    /api/technical/routings/:id/products
GET    /api/technical/routings/:id/cost         -- Calculate routing cost (ADR-009)
```

### 4.5 Traceability
```
POST   /api/technical/tracing/forward
POST   /api/technical/tracing/backward
POST   /api/technical/tracing/recall
GET    /api/technical/tracing/recall/:id/export
GET    /api/technical/tracing/genealogy/:lotId
```

### 4.6 Costing
```
GET    /api/technical/costing/products/:id
POST   /api/technical/costing/products/:id/calculate
GET    /api/technical/costing/products/:id/history
GET    /api/technical/costing/variance/:workOrderId
GET    /api/technical/costing/variance/report
POST   /api/technical/costing/ingredients/:id
GET    /api/technical/costing/ingredients/:id/history
```

### 4.7 Nutrition
```
GET    /api/technical/nutrition/products/:id
POST   /api/technical/nutrition/products/:id/calculate
PUT    /api/technical/nutrition/products/:id/override
GET    /api/technical/nutrition/products/:id/label
POST   /api/technical/nutrition/ingredients/:id
GET    /api/technical/nutrition/ingredients/:id
```

### 4.8 Shelf Life
```
GET    /api/technical/shelf-life/products/:id
POST   /api/technical/shelf-life/products/:id/calculate
PUT    /api/technical/shelf-life/products/:id/override
```

### 4.9 Dashboard
```
GET    /api/technical/dashboard/stats
GET    /api/technical/dashboard/allergen-matrix
GET    /api/technical/dashboard/version-timeline
GET    /api/technical/dashboard/cost-trends
```

### 4.10 Settings
```
GET    /api/technical/settings
PUT    /api/technical/settings
GET    /api/technical/conditional-flags
POST   /api/technical/conditional-flags
PUT    /api/technical/conditional-flags/:id
DELETE /api/technical/conditional-flags/:id
```

## 5. Business Rules

### 5.1 Products
- SKU (code) must be unique per organization
- SKU is immutable after creation
- Version auto-increments on edit (1.0 -> 1.1 -> 1.2)
- Product type cannot change after creation
- Allergen inheritance auto-calculated from active BOM
- **Perishable products must have shelf_life_days and expiry_policy != 'none'** (migration 046)
- **RM/PKG products should have cost_per_unit set (warning if missing)** (migration 048)

### 5.2 BOMs
- BOM version effective dates cannot overlap for same product
- Database trigger enforces date overlap prevention
- BOM items must reference valid products as ingredients
- Conditional items require valid flag expressions
- Byproducts have yield_percent (e.g., 15% = 15kg from 100kg input)
- Alternative ingredients must be same unit class
- Operation assignment (operation_seq) required for production
- Line-specific items: NULL line_ids = all lines, specific IDs = those lines only
- **Clone action copies all items, routing, notes to new product** (FR-2.24 DONE)
- **BOM items must have quantity > 0** (migration 049)
- **BOM item UoM should match component base UoM (warning if mismatch)** (migration 049)

### 5.3 Routings
- Operations must have unique sequence numbers per routing
- Routing can be reused across multiple BOMs (if is_reusable = true)
- BOM references routing via routing_id
- Labor cost hierarchy: BOM line override > routing operation default
- **Routing code must be unique per organization** (UX: TEC-008)
- **Routing code format: uppercase alphanumeric + hyphens (e.g., RTG-BREAD-01)** (UX: TEC-008)
- **Reusable routings (is_reusable = true) can be shared across multiple products** (UX: TEC-008)
- **Non-reusable routings (is_reusable = false) are product-specific (1:1)** (UX: TEC-008)
- **Routing costs are versioned with routing** (when routing version increments, costs are captured)
- **Cost fields default to 0** (optional, backwards compatible)
- **When routing is cloned, code gets "-COPY" suffix**

### 5.4 Routing Operations
- Operations must have unique sequence numbers within routing
- **Total operation time = setup_time + duration + cleanup_time**
- **cleanup_time is optional, defaults to 0**
- **instructions field is optional, max 2000 characters**

### 5.5 Traceability
- Lot tracking mandatory for all transactions
- Forward trace: lot -> consumed in which lots
- Backward trace: lot <- made from which lots
- Recall simulation requires lot or batch ID
- Genealogy tree shows multi-level relationships
- Link created on consumption registration (work order)

### 5.6 Costing (IMPLEMENTED)
- **Material cost** = SUM(ingredient cost x quantity)
- **Operation labor cost** = SUM(operation.labor_cost_per_hour x duration_hours)
- **Operation setup cost** = SUM(operation.setup_time x labor_rate)
- **Operation cleanup cost** = SUM(operation.cleanup_time x labor_rate)
- **Routing setup cost** = routing.setup_cost (fixed per run)
- **Routing working cost** = routing.working_cost_per_unit x output_quantity
- **Overhead** = subtotal x (routing.overhead_percent / 100)
- **Total routing cost** = operation costs + routing costs + overhead
- **Total product cost** = material cost + total routing cost
- Standard cost calculated from BOM + routing
- Actual cost from production transactions
- Variance = actual - standard
- Cost history retained for audit

### 5.7 Nutrition
- Auto-calculated from ingredient nutrition data
- Sum weighted by ingredient quantity
- Adjusted for yield loss
- Manual override allowed (with audit flag)
- Label format per FDA requirements
- Allergen warnings auto-generated

### 5.8 Shelf Life (IMPLEMENTED)
- Default = min(ingredient shelf lives)
- Processing impact adjustment
- Manual override allowed (override_days field)
- Storage conditions affect calculation
- Expiry date = production date + shelf life
- **product_shelf_life table tracks calculated vs override** (migration 047)

## 6. Phase Roadmap

### Phase 2A-1: Products Core (DONE)
**Duration**: 2025-11-23 to 2025-11-24
**Stories**: 6
- Product CRUD with versioning
- Product history audit log
- Allergen declaration (contains/may contain)
- Product types and status
- Technical settings (yield, shelf life, storage)
- Product search and filters

### Phase 2A-2: BOM Restructure (DONE)
**Duration**: 2025-11-25
**Stories**: 6
- BOM production line assignment (many-to-many)
- BOM item operation assignment
- Alternative ingredients
- Packaging fields (units_per_box, boxes_per_pallet)
- Routing restructure (routing_id in BOM)
- Line-specific components (line_ids array)

### Phase 2B-1: BOM Core (DONE)
**Duration**: 2025-11-25
**Stories**: 4
- BOM CRUD with date validity
- BOM items (ingredients, qty, sequence)
- Version timeline visualization
- Date overlap prevention trigger

### Phase 2B-2: BOM Advanced (DONE)
**Duration**: 2025-11-26
**Stories**: 5
- BOM clone and compare
- Conditional items (flags + logic)
- Byproducts (yield %)
- Allergen inheritance automation
- Multi-level BOM explosion

### Phase 2C-1: Routing (DONE)
**Duration**: 2025-11-26
**Stories**: 3
- Routing CRUD (reusable)
- Routing operations (sequence, time, machine)
- BOM-routing assignments
- **Routing code and is_reusable fields** (UX: TEC-008)
- **Operation cleanup_time and instructions fields** (UX: TEC-010)

### Phase 2D-1: Traceability (DONE)
**Duration**: 2025-11-27
**Stories**: 4
- Forward/backward traceability
- Recall simulation
- Genealogy tree visualization
- Traceability matrix report

### Phase 2E-1: Dashboard (DONE)
**Duration**: 2025-11-27
**Stories**: 2
- Product dashboard (stats)
- Allergen matrix visualization

### Phase 2C-2: Costing & Nutrition (PARTIALLY DONE)
**Target**: Q1 2026
**Stories**: 8 (updated from 7)
- Recipe costing calculation - **DONE**
- Cost variance analysis - Planned
- Nutrition calculation engine - Planned
- Shelf life from ingredients - **DONE** (schema ready)
- Cost rollup (multi-level BOM) - **DONE**
- Nutrition label generation (FDA) - Planned
- Allergen label generation - Planned
- **Routing-level costs (ADR-009)** - **DONE**

**Key Features**:
- Material cost: SUM(ingredient cost x quantity) - **DONE**
- Operation labor cost: SUM(operation time x labor rate) - **DONE**
- **Operation cleanup cost**: SUM(cleanup time x labor rate) - **DONE**
- **Routing setup cost**: Fixed cost per run (tooling, changeover) - **DONE**
- **Routing working cost**: Variable cost per unit - **DONE**
- **Overhead allocation**: % of subtotal - **DONE**
- Nutrition from ingredient data - Planned
- Shelf life = min(ingredient shelf lives) - **Schema ready**
- Manual overrides with audit - **DONE**

**Cost Calculation Formula**:
```
Total Cost = Material Cost (BOM items)
           + Operation Labor Cost (duration x rate)
           + Operation Setup Cost (setup_time x rate)
           + Operation Cleanup Cost (cleanup_time x rate)
           + Routing Setup Cost (fixed per run)
           + Routing Working Cost (per unit x quantity)
           + Overhead (subtotal x overhead_percent)
```

### Phase 2E-2: Technical UI Redesign (PLANNED)
**Target**: Q2 2026
**Stories**: 4
- Consistent header layouts
- Stats cards standardization
- Table consistency across module
- Mobile responsive improvements

## 7. Integration Points

### 7.1 Settings Module
- Organizations (org_id for multi-tenancy)
- Users (created_by, updated_by)
- Allergens master data
- Work centers and machines
- Production lines
- Locations

### 7.2 Planning Module
- Products used in purchase orders
- BOMs drive material requirements (MRP)
- Routings used in demand planning
- Costing data for procurement decisions

### 7.3 Production Module
- Work orders consume products per BOM
- Operations follow routing sequence
- Actual consumption creates traceability links
- Cost variance from production actuals
- Lot tracking for genealogy
- **BOM snapshot captures routing costs at WO creation**

### 7.4 Warehouse Module
- Inventory levels per product/lot
- Lot tracking for traceability
- Shelf life for expiry management (FEFO)
- Storage conditions validation
- License plate (LP) tracking

### 7.5 Quality Module
- Operation quality checkpoints in routing
- Allergen validation against declarations
- Nutrition claims verification
- Specification compliance

### 7.6 Shipping Module
- Product info for sales orders
- Allergen labels for shipments
- Shelf life for FEFO picking
- Nutrition labels for compliance
- Traceability for customer lots

## 8. Non-Functional Requirements

### 8.1 Performance
- Product list load < 1s for 10k products
- BOM explosion < 2s for 5-level BOM
- Traceability query < 3s for 100k lots
- Nutrition calculation < 1s
- Cost rollup < 2s for multi-level BOM
- **Routing cost calculation < 500ms**

### 8.2 Security
- RLS enforcement on all tables (org_id)
- Role-based access (admin/user)
- Audit log for all changes
- Product version history immutable

### 8.3 Scalability
- Support 50k+ products per org
- Handle 10-level deep BOMs
- Manage 1M+ traceability links
- Store 5 years of cost history
- 100 concurrent users

### 8.4 Reliability
- 99.5% uptime SLA
- Automatic cost recalculation on ingredient changes
- Allergen inheritance updates real-time
- Shelf life recalc on BOM changes
- Data backup every 6 hours

### 8.5 Usability
- Intuitive BOM item management
- Visual timeline for versions
- Clear allergen warnings
- One-click cost analysis
- Drag-drop operation reorder

## 9. Success Metrics

### 9.1 Adoption
- 80% of products have active BOMs
- 70% of products have routings
- 90% traceability link coverage
- 60% costing data completeness
- 50% nutrition data completeness
- **50% of routings have cost configuration**
- **70% of routings have unique codes assigned**

### 9.2 Efficiency
- BOM creation time < 5 min
- Routing setup time < 10 min
- Traceability query time < 3s
- Cost variance analysis < 2 min
- Product search < 1s

### 9.3 Quality
- 100% allergen accuracy
- <5% cost variance on average
- 95% nutrition data completeness
- Zero traceability gaps
- <1% BOM data errors

### 9.4 Compliance
- FDA nutrition label compliance
- Allergen labeling compliance
- Lot tracking 100% coverage
- Audit trail completeness
- Recall simulation capability

## 10. UI Pages

### 10.1 Products
- `/technical/products` - Product list with filters
- `/technical/products/new` - Create product form
- `/technical/products/:id` - Product detail view
- `/technical/products/:id/edit` - Edit product form
- `/technical/products/:id/versions` - Version history
- `/technical/products/:id/allergens` - Allergen management

### 10.2 BOMs
- `/technical/boms` - BOM list (with Clone action - FR-2.24)
- `/technical/boms/new` - Create BOM form
- `/technical/boms/:id` - BOM detail with items + Cost Summary
- `/technical/boms/:id/edit` - Edit BOM
- `/technical/boms/:id/compare/:compareId` - BOM comparison
- `/technical/boms/:id/explode` - Multi-level view

### 10.3 Routings
- `/technical/routings` - Routing list
- `/technical/routings/new` - Create routing form
- `/technical/routings/:id` - Routing detail with operations
- `/technical/routings/:id/edit` - Edit routing (includes code, is_reusable, cost fields)

### 10.4 Traceability
- `/technical/traceability` - Search interface
- `/technical/traceability/forward/:lotId` - Forward trace
- `/technical/traceability/backward/:lotId` - Backward trace
- `/technical/traceability/genealogy/:lotId` - Tree view
- `/technical/traceability/recall` - Recall simulation

### 10.5 Costing (Planned)
- `/technical/costing/products/:id` - Product cost detail
- `/technical/costing/variance` - Variance analysis dashboard
- `/technical/costing/ingredients` - Ingredient cost management

### 10.6 Nutrition (Planned)
- `/technical/nutrition/products/:id` - Product nutrition detail
- `/technical/nutrition/label/:id` - Label preview/print

### 10.7 Dashboard
- `/technical` - Main dashboard (stats, allergen matrix)

## 11. Testing Coverage

### 11.1 Unit Tests
- Product service functions (CRUD, versioning)
- BOM calculation logic (explosion, costing)
- Costing algorithms (material, labor, routing, variance)
- Nutrition calculations (ingredient rollup)
- Allergen inheritance rules
- **Routing cost calculation (includes cleanup_time)**
- **Routing code uniqueness validation**
- **costing-service.ts: calculateTotalBOMCost(), compareBOMCosts()**

### 11.2 Integration Tests
- API endpoint coverage (80%+)
- Database constraints (triggers, FKs)
- RLS policy enforcement
- Service layer integration
- **Routing code unique constraint**
- **BOM item UoM validation trigger** (migration 049)
- **Product cost validation trigger** (migration 048)

### 11.3 E2E Tests
- Product creation flow
- BOM management workflow
- Routing assignment
- **BOM clone action (FR-2.24)**
- **Routing creation with code and is_reusable**
- Traceability queries
- Cost variance analysis
- **Routing cost configuration**
- **BOM cost calculation via /api/technical/boms/:id/cost**

### 11.4 Performance Tests
- BOM explosion benchmarks (5-level)
- Traceability query performance (100k lots)
- Cost calculation speed
- Concurrent user load (100 users)

## 12. Technical Debt

### Known Issues
- BOM explosion performance degrades >5 levels (needs optimization)
- Nutrition calculation doesn't handle unit conversions
- Shelf life calculation is basic (no processing impact model)
- Cost variance needs granular breakdown (material/labor/overhead split)
- Traceability tree UI needs zoom/pan controls

### Future Improvements
- GraphQL API for complex traceability queries
- Real-time cost updates via websockets
- AI-powered BOM optimization suggestions
- Blockchain integration for supply chain traceability
- Mobile app for routing instructions
- Advanced allergen cross-contamination modeling
- Multi-currency support for costing
- Recipe versioning with approval workflow
- **Cost scenario modeling (multiple cost sets per routing)**

## 13. Dependencies

### External Services
- Supabase (database, auth, storage)
- Redis (caching for cost calculations)
- OpenAI (future: AI-powered suggestions)

### Internal Modules
- Settings (master data: allergens, work centers, lines)
- Production (actual costs, consumption)
- Warehouse (lot tracking, inventory)
- Planning (PO/TO/WO creation)

## 14. Glossary

| Term | Definition |
|------|------------|
| BOM | Bill of Materials - ingredient list with quantities |
| Routing | Sequence of production operations |
| Routing Code | Unique identifier for routing (e.g., RTG-BREAD-01) |
| Traceability | Track product/ingredient movement (lot level) |
| Genealogy | Parent-child relationship of lots |
| Yield | Output % vs input (accounts for waste) |
| Byproduct | Secondary output (not main product) |
| Allergen | Substance causing allergic reactions |
| Work Center | Physical location for operations |
| Operation | Single production step |
| Lot | Batch of product with same production date |
| SKU | Stock Keeping Unit - unique product ID |
| FEFO | First Expired, First Out - picking strategy |
| RLS | Row Level Security - database access control |
| LP | License Plate - warehouse tracking unit |
| WIP | Work In Progress - semi-finished product |
| WO | Work Order - production order |
| Setup Cost | Fixed cost per routing run (tooling, changeover) |
| Working Cost | Variable cost per output unit |
| Overhead | Factory overhead % applied to routing cost |
| Cleanup Time | Time to clean up after operation (sanitation) |
| Instructions | Operator instructions for an operation |

## Appendix

### Related Documents
- `.claude/TABLES.md` - Complete database schema
- `.claude/PATTERNS.md` - Code patterns and conventions
- `docs/1-BASELINE/architecture/modules/technical.md` - Technical architecture
- `docs/1-BASELINE/architecture/decisions/ADR-009-routing-level-costs.md` - Routing costs decision
- `docs/3-ARCHITECTURE/ux/wireframes/TEC-005-boms-list.md` - BOM list wireframe (with Clone)
- `docs/3-ARCHITECTURE/ux/wireframes/TEC-006-bom-modal.md` - BOM modal wireframe (with Cost Summary)
- `docs/3-ARCHITECTURE/ux/wireframes/TEC-008-routing-modal.md` - Routing modal wireframe
- `apps/frontend/lib/services/costing-service.ts` - Cost calculation implementation

### Migration History

| Migration | Description | Date |
|-----------|-------------|------|
| 043 | Add routing cost fields (setup_cost, working_cost_per_unit, overhead_percent, currency) | 2025-12-14 |
| 044 | Add routing.code, routing.is_reusable, routing_operations.cleanup_time, routing_operations.instructions | 2025-12-14 |
| 045 | Add boms.routing_id FK to routings | 2025-12-14 |
| 046 | Add products.std_price, products.expiry_policy, perishable constraint | 2025-12-14 |
| 047 | Create product_shelf_life table | 2025-12-14 |
| 048 | Add cost_per_unit validation trigger, positive constraint | 2025-12-14 |
| 049 | Add BOM item UoM validation trigger, quantity check | 2025-12-14 |

### Change Log
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-14 | 2.3 | Wave 1-3 fixes: migrations 045-049, costing-service.ts, FR-2.24 DONE, FR-2.36 DONE, FR-2.90-92 schema ready | Architect |
| 2025-12-14 | 2.2 | Added routings.code, is_reusable (UX TEC-008); routing_operations.cleanup_time, instructions (UX TEC-010); FR-2.54, FR-2.55 | Architect |
| 2025-12-14 | 2.1 | Added routing-level costs (FR-2.51, FR-2.52, FR-2.53, FR-2.77, ADR-009) | Architect |
| 2025-12-10 | 2.0 | Condensed PRD, added costing/nutrition/shelf life | Tech Writer |
| 2025-11-27 | 1.5 | Added traceability features | Product Team |
| 2025-11-26 | 1.4 | Added BOM restructure (line assignment) | Product Team |
| 2025-11-25 | 1.3 | Added BOM advanced features | Product Team |
| 2025-11-24 | 1.2 | Added routing features | Product Team |
| 2025-11-23 | 1.0 | Initial PRD | Product Team |

---

**Document Status**: ACTIVE
**Total Lines**: ~1200
**Format**: Concise PRD (tables, bullets, key info only)
