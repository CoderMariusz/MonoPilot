# Technical Module PRD

**Epic:** 2 - Technical
**Status:** DONE (28 stories)
**Ostatnia aktualizacja:** 2025-12-09

---

## 1. Overview

### Cel modulu
Technical Module odpowiada za zarzadzanie danymi technicznymi produktow:
- Katalog produktow (6 typow)
- Bill of Materials (BOM) z wersjonowaniem
- Routingi (procesy produkcyjne)
- Zarzadzanie alergenami
- Sledzenie genealogii LP
- Symulacja recall

### Zaleznosci
- **Wymaga:** Settings (Epic 1)
- **Zalezne od Technical:**
  - Planning (Epic 3) - products for PO/TO/WO
  - Production (Epic 4) - BOM for WO execution
  - Warehouse (Epic 5) - LP traceability

### Kluczowe koncepty
- **Product Types:** RM, WIP, FG, PKG, BP, CUSTOM
- **BOM Versioning:** Date-based z overlap validation
- **BOM Snapshot:** WO copies BOM at creation
- **LP Genealogy:** Parent-child relationships dla traceability
- **Conditional BOM Items:** Flagi (organic, vegan, kosher...)

---

## 2. User Roles & Permissions

### Macierz uprawnien Technical

| Funkcja | admin | technical | manager | operator | viewer |
|---------|-------|-----------|---------|----------|--------|
| Product CRUD | RWD | RWD | RW | R | R |
| BOM CRUD | RWD | RWD | RW | R | R |
| Routing CRUD | RWD | RWD | RW | R | R |
| Allergen Assignment | RWD | RWD | RW | - | R |
| Traceability View | R | R | R | R | R |
| Recall Simulation | R | R | R | - | - |
| Technical Settings | RWD | RW | R | - | - |

*R = Read, W = Write, D = Delete*

---

## 3. Settings Configuration

### Technical Settings (`technical_settings`)

```json
{
  "product_field_config": {
    "category": {"visible": true, "mandatory": false},
    "cost_per_unit": {"visible": true, "mandatory": false},
    "max_stock_qty": {"visible": true, "mandatory": false},
    "min_stock_qty": {"visible": true, "mandatory": false},
    "reorder_point": {"visible": true, "mandatory": false},
    "shelf_life_days": {"visible": true, "mandatory": false}
  },
  "max_bom_versions": null,
  "use_conditional_flags": false,
  "conditional_flags": [
    "organic",
    "gluten_free",
    "vegan",
    "kosher",
    "halal",
    "dairy_free",
    "nut_free",
    "soy_free"
  ]
}
```

### Feature Toggles

| Toggle | Default | Opis |
|--------|---------|------|
| `use_conditional_flags` | OFF | Wlacza conditional BOM items |
| Field visibility | ON | Per-field visibility |
| Field mandatory | OFF | Per-field mandatory |

---

## 4. Core Entities

### 4.1 Product

**Tabela:** `products`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | TEXT | YES | Unique per org, IMMUTABLE |
| name | TEXT | YES | Product name |
| type | product_type | YES | RM/WIP/FG/PKG/BP/CUSTOM |
| description | TEXT | NO | Opis |
| category | TEXT | NO | Optional category |
| version | NUMERIC | YES | Default: 1.0, auto-increment |
| uom | TEXT | YES | Unit of measure |
| shelf_life_days | INTEGER | NO | Shelf life |
| min_stock_qty | NUMERIC | NO | Min stock level |
| max_stock_qty | NUMERIC | NO | Max stock level |
| reorder_point | NUMERIC | NO | Reorder threshold |
| cost_per_unit | NUMERIC | NO | Unit cost |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

**Product Types (`product_type` enum):**

| Type | Pelna nazwa | Opis |
|------|-------------|------|
| RM | Raw Material | Surowiec |
| WIP | Work in Progress | Polprodukt |
| FG | Finished Good | Produkt gotowy |
| PKG | Packaging | Opakowanie |
| BP | By-Product | Produkt uboczny |
| CUSTOM | Custom | Typ niestandardowy |

### 4.2 Product Version History

**Tabela:** `product_version_history`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| product_id | UUID | FK | products.id |
| version | NUMERIC | YES | Version snapshot |
| changed_fields | JSONB | YES | {"field": {"old": X, "new": Y}} |
| changed_by | UUID | FK | users.id |
| changed_at | TIMESTAMPTZ | YES | Auto |

### 4.3 Product Allergens

**Tabela:** `product_allergens`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| product_id | UUID | FK | products.id |
| allergen_id | UUID | FK | allergens.id |
| relation_type | VARCHAR | YES | contains / may_contain |
| created_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |

### 4.4 BOM (Bill of Materials)

**Tabela:** `boms`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| product_id | UUID | FK | products.id |
| version | VARCHAR | YES | X.Y format (1.0, 1.1, 2.0) |
| effective_from | DATE | YES | Start date |
| effective_to | DATE | NO | End date (NULL = no end) |
| status | bom_status | YES | Draft/Active/Phased Out/Inactive |
| output_qty | NUMERIC | YES | Default: 1.0, > 0 |
| output_uom | VARCHAR | YES | UoM for output |
| notes | TEXT | NO | Notes |
| routing_id | UUID | FK | routings.id |
| units_per_box | INTEGER | NO | Packaging info |
| boxes_per_pallet | INTEGER | NO | Packaging info |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMP | YES | Auto |
| updated_at | TIMESTAMP | YES | Auto |

**BOM Status (`bom_status` enum):**

| Status | Opis | Transitions |
|--------|------|-------------|
| Draft | W przygotowaniu | → Active |
| Active | Aktywny do produkcji | → Phased Out, Inactive |
| Phased Out | Wygasajacy | → Inactive |
| Inactive | Nieaktywny | - |

**Status Flow:**

```
Draft → Active → Phased Out → Inactive
           ↓
       Inactive
```

**Version Auto-Increment:**
```
1.0 → 1.1 → 1.2 → ... → 1.9 → 2.0 → 2.1 ...
```

### 4.5 BOM Items

**Tabela:** `bom_items`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| bom_id | UUID | FK | boms.id (CASCADE) |
| product_id | UUID | FK | products.id (component) |
| quantity | NUMERIC | YES | > 0 |
| uom | TEXT | YES | Unit of measure |
| scrap_percent | NUMERIC | YES | Default: 0, 0-100 |
| sequence | INTEGER | YES | Display order |
| consume_whole_lp | BOOLEAN | YES | Default: false |
| is_by_product | BOOLEAN | YES | Default: false |
| yield_percent | NUMERIC | NO | By-product yield % |
| condition_flags | TEXT[] | NO | ['organic', 'vegan'] |
| condition_logic | TEXT | NO | AND / OR |
| notes | TEXT | NO | Notes |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

### 4.6 Routing

**Tabela:** `routings`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| name | VARCHAR | YES | Unique per org |
| description | TEXT | NO | Opis |
| is_active | BOOLEAN | YES | Default: true |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

### 4.7 Routing Operations

**Tabela:** `routing_operations`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| routing_id | UUID | FK | routings.id (CASCADE) |
| sequence | INTEGER | YES | Execution order |
| name | VARCHAR | YES | 1-100 chars |
| description | TEXT | NO | Opis |
| machine_id | UUID | FK | machines.id |
| estimated_duration_minutes | INTEGER | NO | Duration |
| labor_cost_per_hour | NUMERIC | NO | Labor cost |
| created_at | TIMESTAMPTZ | YES | Auto |

### 4.8 License Plate (stub for traceability)

**Tabela:** `license_plates`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| lp_number | VARCHAR | YES | Unique globally |
| batch_number | VARCHAR | NO | Batch for traceability |
| product_id | UUID | FK | products.id |
| quantity | NUMERIC | YES | > 0 |
| uom | VARCHAR | YES | Unit of measure |
| status | VARCHAR | YES | available/consumed/shipped/quarantine/recalled |
| location_id | UUID | FK | locations.id |
| manufacturing_date | DATE | NO | Production date |
| expiry_date | DATE | NO | Expiry date |
| received_date | DATE | NO | Received date |
| created_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

### 4.9 LP Genealogy

**Tabela:** `lp_genealogy`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| parent_lp_id | UUID | FK | license_plates.id |
| child_lp_id | UUID | FK | license_plates.id |
| work_order_id | UUID | FK | work_orders.id |
| transfer_order_id | UUID | FK | transfer_orders.id |
| relationship_type | VARCHAR | YES | consumption/production/split/merge |
| quantity_consumed | NUMERIC | NO | Qty consumed |
| created_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |

### 4.10 Recall Simulations

**Tabela:** `recall_simulations`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| lp_id | UUID | FK | license_plates.id |
| batch_number | VARCHAR | NO | Batch to simulate |
| include_shipped | BOOLEAN | YES | Default: true |
| include_notifications | BOOLEAN | YES | Default: true |
| summary | JSONB | YES | Stats summary |
| forward_trace | JSONB | YES | Forward trace tree |
| backward_trace | JSONB | YES | Backward trace tree |
| regulatory_info | JSONB | NO | FDA/EU compliance |
| execution_time_ms | INTEGER | YES | Performance |
| created_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |

---

## 5. Workflows

### 5.1 Desktop Workflows

#### Product Creation

```
Select product type
    ↓
Enter code (IMMUTABLE) + name
    ↓
Set UoM + optional fields
    ↓
Assign allergens (contains/may_contain)
    ↓
Save → version = 1.0
```

#### BOM Creation

```
Select parent product (FG/WIP)
    ↓
System auto-assigns version (1.0 or next)
    ↓
Set effective_from date
    ↓
Add BOM items (components)
    ↓
Optional: assign routing
    ↓
Optional: set conditional flags
    ↓
Save as Draft
    ↓
Activate when ready
```

#### BOM Cloning

```
Select source BOM
    ↓
Click "Clone"
    ↓
System creates new version
    ↓
Copies all items
    ↓
Sets effective_from = today
    ↓
Status = Draft
```

#### Recall Simulation

```
Select LP or Batch Number
    ↓
Choose options:
  - Include shipped LPs
  - Include notifications
    ↓
Run simulation
    ↓
View results:
  - Affected LPs count
  - Total quantity
  - Locations
  - Forward trace (where did it go)
  - Backward trace (where did it come from)
    ↓
Save simulation record (immutable)
```

### 5.2 Scanner Workflows

**Brak dedicated scanner workflows w Technical Module**

(Traceability is viewed via desktop, recall simulation is management function)

---

## 6. Database Tables

### Schema Summary

| Tabela | Rows | RLS | Opis |
|--------|------|-----|------|
| products | 0 | YES | Product catalog |
| product_version_history | 0 | YES | Version tracking |
| product_allergens | 0 | YES | Allergen assignments |
| product_type_config | 10 | YES | Type configuration |
| boms | 0 | YES | Bill of Materials |
| bom_items | 0 | YES | BOM components |
| bom_production_lines | 0 | YES | BOM-Line assignments |
| routings | 0 | YES | Process templates |
| routing_operations | 0 | YES | Routing steps |
| product_routings | 0 | YES | Product-Routing M2M |
| license_plates | 0 | YES | LP stub for Epic 5 |
| lp_genealogy | 0 | YES | Traceability links |
| traceability_links | 0 | YES | Audit trail |
| recall_simulations | 0 | YES | Recall records |
| technical_settings | 2 | YES | Module settings |

### Key Indexes

```sql
-- Products
CREATE UNIQUE INDEX products_org_code_unique ON products(org_id, code);

-- BOMs
CREATE UNIQUE INDEX boms_org_product_version_unique ON boms(org_id, product_id, version);
CREATE INDEX boms_product_id_idx ON boms(product_id);
CREATE INDEX boms_status_idx ON boms(status) WHERE status = 'Active';

-- LP Genealogy
CREATE INDEX lp_genealogy_parent_idx ON lp_genealogy(parent_lp_id);
CREATE INDEX lp_genealogy_child_idx ON lp_genealogy(child_lp_id);

-- Routings
CREATE UNIQUE INDEX routings_org_name_unique ON routings(org_id, name);
```

### Triggers

```sql
-- BOM date overlap validation
CREATE TRIGGER check_bom_date_overlap
BEFORE INSERT OR UPDATE ON boms
FOR EACH ROW EXECUTE FUNCTION validate_bom_dates();

-- Product version increment
CREATE TRIGGER product_version_increment
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION increment_product_version();
```

---

## 7. API Endpoints

### Products

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/technical/products | List products |
| GET | /api/technical/products/:id | Get product |
| POST | /api/technical/products | Create product |
| PUT | /api/technical/products/:id | Update product |
| DELETE | /api/technical/products/:id | Archive product |
| GET | /api/technical/products/:id/allergens | Get allergens |
| PUT | /api/technical/products/:id/allergens | Set allergens |
| GET | /api/technical/products/:id/history | Get version history |

### BOMs

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/technical/boms | List BOMs |
| GET | /api/technical/boms/:id | Get BOM with items |
| POST | /api/technical/boms | Create BOM |
| PUT | /api/technical/boms/:id | Update BOM |
| DELETE | /api/technical/boms/:id | Delete BOM |
| POST | /api/technical/boms/:id/clone | Clone BOM |
| PUT | /api/technical/boms/:id/status | Change status |
| GET | /api/technical/boms/:id/lines | Get production lines |
| PUT | /api/technical/boms/:id/lines | Set production lines |

### BOM Items

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/technical/boms/:id/items | List items |
| POST | /api/technical/boms/:id/items | Add item |
| PUT | /api/technical/bom-items/:id | Update item |
| DELETE | /api/technical/bom-items/:id | Delete item |

### Routings

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/technical/routings | List routings |
| GET | /api/technical/routings/:id | Get routing |
| POST | /api/technical/routings | Create routing |
| PUT | /api/technical/routings/:id | Update routing |
| DELETE | /api/technical/routings/:id | Delete routing |
| GET | /api/technical/routings/:id/operations | List operations |
| POST | /api/technical/routings/:id/operations | Add operation |
| PUT | /api/technical/routings/:id/operations/:opId | Update operation |
| DELETE | /api/technical/routings/:id/operations/:opId | Delete operation |

### Traceability

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/technical/traceability/lp/:id | Get LP trace |
| GET | /api/technical/traceability/batch/:number | Get batch trace |
| POST | /api/technical/recall-simulations | Run simulation |
| GET | /api/technical/recall-simulations | List simulations |
| GET | /api/technical/recall-simulations/:id | Get simulation |

### Settings

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/technical/settings | Get settings |
| PUT | /api/technical/settings | Update settings |

---

## 8. Functional Requirements

| ID | Opis | Priority | Status |
|----|------|----------|--------|
| FR-TECH-01 | System wspiera 6 typow produktow (RM, WIP, FG, PKG, BP, CUSTOM) | Must Have | DONE |
| FR-TECH-02 | Product code jest IMMUTABLE po utworzeniu | Must Have | DONE |
| FR-TECH-03 | System auto-inkrementuje version przy edycji produktu | Must Have | DONE |
| FR-TECH-04 | User moze przypisac allergens do produktu (contains/may_contain) | Must Have | DONE |
| FR-TECH-05 | BOM wspiera date-based versioning z overlap validation | Must Have | DONE |
| FR-TECH-06 | System auto-generuje BOM version (X.Y format) | Must Have | DONE |
| FR-TECH-07 | BOM items wspieraja conditional flags (organic, vegan...) | Should Have | DONE |
| FR-TECH-08 | BOM items wspieraja by-products z yield_percent | Must Have | DONE |
| FR-TECH-09 | User moze klonowac BOM do nowej wersji | Must Have | DONE |
| FR-TECH-10 | Routings sa reusable templates (nie per-product) | Must Have | DONE |
| FR-TECH-11 | Routing operations maja machine_id i labor_cost | Should Have | DONE |
| FR-TECH-12 | BOM moze miec przypisany routing | Should Have | DONE |
| FR-TECH-13 | System sluzy LP genealogy (parent-child) | Must Have | DONE |
| FR-TECH-14 | User moze wykonac forward/backward trace dla LP | Must Have | DONE |
| FR-TECH-15 | User moze wykonac recall simulation | Must Have | DONE |
| FR-TECH-16 | Recall simulation jest immutable audit record | Must Have | DONE |
| FR-TECH-17 | Technical settings kontroluja field visibility | Should Have | DONE |
| FR-TECH-18 | BOM status flow: Draft → Active → Phased Out → Inactive | Must Have | DONE |
| FR-TECH-19 | Product allergens dziedzicza z BOM items | Should Have | DONE |

---

## 9. Integration Points

### Internal Integrations

| Modul | Integracja | Opis |
|-------|------------|------|
| Settings | allergens | 14 EU + custom |
| Settings | machines | Machine assignment in routings |
| Settings | production_lines | BOM-line assignment |
| Planning | products | PO/TO lines reference products |
| Planning | boms | WO creation uses active BOM |
| Production | bom_items | Material consumption |
| Production | routings | Operation execution |
| Warehouse | license_plates | LP creation references product |
| Warehouse | lp_genealogy | Traceability recording |

### Data Inheritance

| Source | Target | Fields |
|--------|--------|--------|
| Product | PO Line | uom, description |
| Product | TO Line | uom |
| Product | WO | uom |
| BOM | WO | Snapshot of items |
| Allergen (BOM items) | Product | Auto-calculated allergens |

---

## 10. Story Map

### Epic 2 Stories (28 total - ALL DONE)

| Story | Tytul | Status |
|-------|-------|--------|
| 2.1 | Product list view | DONE |
| 2.2 | Product CRUD | DONE |
| 2.3 | Product versioning | DONE |
| 2.4 | Product allergens | DONE |
| 2.5 | Product type config | DONE |
| 2.6 | BOM CRUD | DONE |
| 2.7 | BOM items management | DONE |
| 2.8 | BOM date-based versioning | DONE |
| 2.9 | BOM status workflow | DONE |
| 2.10 | BOM cloning | DONE |
| 2.11 | BOM overlap validation | DONE |
| 2.12 | Conditional BOM items | DONE |
| 2.13 | By-products in BOM | DONE |
| 2.14 | BOM costing calculation | DONE |
| 2.15 | Routing CRUD | DONE |
| 2.16 | Routing operations | DONE |
| 2.17 | Product-routing assignment | DONE |
| 2.18 | LP genealogy structure | DONE |
| 2.19 | Forward trace | DONE |
| 2.20 | Backward trace | DONE |
| 2.21 | Recall simulation | DONE |
| 2.22 | Technical settings | DONE |
| 2.23 | Field visibility config | DONE |
| 2.24 | Routing restructure | DONE |
| 2.25 | BOM-production line assignment | DONE |
| 2.26 | Allergen inheritance | DONE |
| 2.27 | Product search/filter | DONE |
| 2.28 | BOM search/filter | DONE |

---

## 11. Version History

| Wersja | Data | Opis |
|--------|------|------|
| 1.0 | 2025-12-09 | Initial PRD based on discovery |

---

## 12. Services Reference

**Key service files:**
- `apps/frontend/lib/services/bom-service.ts`
- `apps/frontend/lib/services/bom-item-service.ts`
- `apps/frontend/lib/services/bom-item-alternative-service.ts`
- `apps/frontend/lib/services/routing-service.ts`
- `apps/frontend/lib/services/operation-service.ts`
- `apps/frontend/lib/services/byproduct-service.ts`
- `apps/frontend/lib/services/traceability-service.ts`
- `apps/frontend/lib/services/genealogy-service.ts`
- `apps/frontend/lib/services/recall-service.ts`

---

## 13. Key Business Rules

### BOM Date Overlap Prevention

```
Rule: For same product_id, effective dates cannot overlap
Example:
  BOM v1.0: effective_from=2024-01-01, effective_to=2024-06-30 ✓
  BOM v1.1: effective_from=2024-07-01, effective_to=NULL ✓
  BOM v1.2: effective_from=2024-05-01 ✗ OVERLAP ERROR
```

### Active BOM Selection

```sql
-- Select BOM for WO based on scheduled_date
SELECT * FROM boms
WHERE product_id = :product_id
  AND status = 'Active'
  AND effective_from <= :scheduled_date
  AND (effective_to IS NULL OR effective_to >= :scheduled_date)
ORDER BY version DESC
LIMIT 1;
```

### Version Increment Logic

```typescript
function incrementVersion(version: string): string {
  const [major, minor] = version.split('.').map(Number)
  if (minor >= 9) {
    return `${major + 1}.0` // 1.9 → 2.0
  }
  return `${major}.${minor + 1}` // 1.0 → 1.1
}
```
