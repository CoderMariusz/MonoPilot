# Technical Module - PRD Specification

**Status:** ✅ IMPLEMENTED (Epic 2 Complete - 28 stories DONE)
**Priority:** P0 - Foundation Module
**Implementation:** Batch 02A-02E (2025-11-23 to 2025-11-27)

---

## Overview

Technical module definiuje "co produkujemy" - produkty, receptury (BOMs), operacje (routings) i śledzenie (tracing). **Epic 2 zakończony** - zaimplementowano 28 stories w 5 batchach (02A-02E):

- **02A-1:** Products Core (6 stories - CRUD, versioning, history, allergens, types, settings)
- **02B-1:** BOM Core (4 stories - CRUD, items, date validation, timeline viz)
- **02B-2:** BOM Advanced (5 stories - clone, compare, conditionals, by-products, allergen inheritance)
- **02C-1:** Routing (3 stories - CRUD, operations, product assignment)
- **02D-1:** Traceability (4 stories - forward, backward, recall, genealogy tree)
- **02E-1:** Dashboard & Allergen Matrix (2 stories)
- **02E-2:** Technical UI Redesign (4 stories)

**Test Coverage:** 150+ unit tests, 80+ integration tests, 100+ E2E tests

## Dependencies

- **Requires:** Settings (allergens, warehouses, tax codes)
- **Required by:** Planning (PO/TO/WO), Production (consumption), Warehouse (LP)
- **Shared services:** RLS (org_id), Versioning (products, BOMs)

---

## UI Structure

```
/technical
├── /products              → Lista produktów, CRUD, wersjonowanie
├── /boms                   → Bill of Materials, wersjonowanie, conditionals
├── /routings               → Operacje produkcyjne (reusable)
└── /tracing                → Forward/Backward trace, Recall, Genealogy tree
```

---

## Technical Settings (in /settings/technical)

Przed użyciem Technical module, user konfiguruje:

### Product Types (customizable list)

| Type | Code | Default | Description |
|------|------|---------|-------------|
| Raw Material | `RM` | Yes | Surowce |
| Work in Progress | `WIP` | Yes | Półprodukty |
| Finished Goods | `FG` | Yes | Produkty gotowe |
| Packaging | `PKG` | Yes | Opakowania |
| By-Product | `BP` | Yes | Produkty uboczne |
| *Custom* | *user-defined* | No | User może dodać własne typy |

### Product Field Configuration

| Field | Toggle | Mandatory Toggle | Description |
|-------|--------|------------------|-------------|
| Barcode | Yes/No | Yes/No | EAN/UPC code |
| Category | Yes/No | Yes/No | Kategoria produktu |
| Supplier Lead Time | Yes/No | Yes/No | Czas dostawy (days) |
| MOQ | Yes/No | Yes/No | Minimum Order Quantity |
| Expiry Policy | Yes/No | Yes/No | Polityka ważności |
| Shelf Life | Yes/No | Yes/No | Termin przydatności (days) |
| Std Price | Yes/No | Yes/No | Cena standardowa |
| Min Stock | Yes/No | Yes/No | Minimalny stan |
| Max Stock | Yes/No | Yes/No | Maksymalny stan |
| Storage Conditions | Yes/No | Yes/No | Warunki przechowywania |

### BOM Settings

| Setting | Type | Description |
|---------|------|-------------|
| Max BOM Versions | number | Maksymalna liczba wersji per produkt (np. 10, 50, unlimited) |
| Use Conditional Flags | toggle | Czy używamy flag warunkowych |
| Conditional Flags List | list | Lista flag (default + custom) |

### Default Conditional Flags

| Flag | Code | Default |
|------|------|---------|
| Organic | `organic` | Yes |
| Gluten Free | `gluten_free` | Yes |
| Vegan | `vegan` | Yes |
| Kosher | `kosher` | Yes |
| Halal | `halal` | Yes |
| Dairy Free | `dairy_free` | Yes |
| Nut Free | `nut_free` | Yes |
| Soy Free | `soy_free` | Yes |
| *Custom* | *user-defined* | No |

---

## Sekcja 1: Products

**Route:** `/technical/products`

### 1.1 Product Fields (Core)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | SKU / kod produktu (unique, immutable after create) |
| `name` | string | Yes | Nazwa produktu |
| `description` | text | No | Opis |
| `product_type_id` | FK | Yes | Typ produktu (z listy w Settings) |
| `base_uom` | enum | Yes | Bazowa jednostka miary (kg, L, szt, m) |
| `status` | enum | Yes | Active, Inactive, Discontinued |
| `version` | string | Yes | Wersja produktu (np. 1.0, 1.1, 2.0) |

### 1.2 Product Fields (Configurable - based on Settings)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `barcode` | string | Configurable | EAN/UPC barcode |
| `category_id` | FK | Configurable | Kategoria produktu |
| `supplier_id` | FK | Configurable | Domyślny dostawca |
| `supplier_lead_time_days` | number | Configurable | Czas dostawy (default from supplier) |
| `moq` | number | Configurable | Minimum Order Quantity |
| `expiry_policy` | enum | Configurable | FIFO, FEFO, None |
| `shelf_life_days` | number | Configurable | Termin przydatności |
| `std_price` | decimal | Configurable | Cena standardowa |
| `min_stock` | number | Configurable | Minimalny stan magazynowy |
| `max_stock` | number | Configurable | Maksymalny stan magazynowy |
| `storage_conditions` | text | Configurable | Warunki przechowywania (np. "2-8°C") |

### 1.3 Product Allergens (Many-to-Many)

| Relation | Description |
|----------|-------------|
| `product_allergens_contains` | Alergeny które produkt ZAWIERA |
| `product_allergens_may_contain` | Alergeny które produkt MOŻE ZAWIERAĆ (cross-contamination) |

### 1.4 Product Versioning

**Wersjonowanie automatyczne przy zmianach:**

- **Minor change (0.1):** Zmiana dowolnego pola (oprócz code)
- **Format:** v1.0 → v1.1 → v1.2 → v2.0

**3 Modals:**

1. **Create Modal:**
   - Wszystkie pola dostępne
   - Code jest edytowalny (tylko przy tworzeniu)
   - Version = 1.0

2. **Edit Modal:**
   - Wszystkie pola oprócz Code
   - Przy save: version += 0.1
   - Automatyczny zapis do historii

3. **History Modal:**
   - Lista zmian: version, date, user, changed fields
   - Przykład: "v1.0 → v1.1: price changed from 3.00 → 4.00 by Jan Kowalski on 2025-01-15"
   - Możliwość porównania wersji

### 1.5 Product Images (Phase 2 - Coming Soon)

| Feature | Status | Description |
|---------|--------|-------------|
| Main image | Coming Soon | Główne zdjęcie produktu |
| Gallery | Coming Soon | Galeria zdjęć |
| Upload | Coming Soon | Max 5MB per image |

**UI:** Placeholder z "Coming Soon" badge

### 1.6 UI Components

- Products table with search, filters (type, status, category)
- Create Product modal (all fields)
- Edit Product drawer (no code edit)
- History modal (version timeline)
- Allergen picker (multi-select for Contains, May Contain)

---

## Sekcja 2: Bill of Materials (BOMs)

**Route:** `/technical/boms`

### 2.1 BOM Header

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | FK | Yes | Produkt parent (co produkujemy) |
| `version` | string | Yes | Wersja BOM (np. 1.0, 1.1) |
| `bom_type` | enum | Yes | Standard, Engineering, Configurable |
| `routing_id` | FK | No | Routing przypisany do BOM (definiuje operacje) |
| `effective_from` | date | Yes | Data od kiedy obowiązuje |
| `effective_to` | date | No | Data do kiedy obowiązuje (null = infinity) |
| `status` | enum | Yes | Draft, Active, Phased Out, Inactive |
| `output_qty` | decimal | Yes | Ilość wyjściowa z tego BOM |
| `output_uom` | enum | Yes | Jednostka wyjściowa |
| `units_per_box` | integer | No | Ile jednostek w karton/opakowanie zbiorcze |
| `boxes_per_pallet` | integer | No | Ile kartonów na paletę |
| `notes` | text | No | Notatki |

### 2.2 BOM Production Lines (Many-to-Many)

**Koncepcja:** Jeden BOM może być produkowany na wielu liniach produkcyjnych.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bom_id` | FK | Yes | BOM |
| `line_id` | FK | Yes | Linia produkcyjna |
| `labor_cost_per_hour` | decimal | No | Override kosztu pracy dla tej linii (opcjonalnie) |

**Przykład:**
- BOM FG-001 v1.0 może być produkowany na Line 4, Line 7, Line 10
- Każda linia może mieć inny koszt pracy

### 2.3 BOM Item

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `component_id` | FK | Yes | Komponent (produkt wchodzący lub wychodzący) |
| `operation_seq` | number | Yes | Do której operacji routingu należy (1, 2, 3...) |
| `is_output` | boolean | No | Czy to OUTPUT z operacji (default: false = input) |
| `quantity` | decimal | Yes | Ilość per batch |
| `uom` | enum | Yes | Jednostka |
| `sequence` | number | No | Priorytet alternatyw (1 = primary, 2+ = alternative) |
| `line_ids` | UUID[] | No | Linie na których używany (NULL = ALL) |
| `scrap_percent` | decimal | No | % strat (default 0) |
| `consume_whole_lp` | boolean | No | Flag: konsumuj całą LP (1:1) |
| `notes` | text | No | Notatki |

**Operation Assignment (`operation_seq`):**
- Każdy BOM Item jest przypisany do konkretnej operacji z routingu
- Input: komponent konsumowany w tej operacji
- Output (`is_output=true`): produkt wytwarzany przez tę operację

**Przykład (Routing: Dice→Smoke→Pack):**
```
BOM FG-001:
├── Operation 1 (Dice):
│   ├── Input: MEAT-001 (10kg)
│   └── Output: WIP-DICED (is_output=true, 9.5kg)
├── Operation 2 (Smoke):
│   ├── Input: WIP-DICED (auto z op.1)
│   └── Output: WIP-SMOKED (is_output=true, 9kg)
└── Operation 3 (Pack):
    ├── Input: WIP-SMOKED (auto z op.2)
    ├── Input: BOX-001 (sequence=1, line_ids=[Line4])
    ├── Input: BOX-002 (sequence=1, line_ids=[Line7])
    └── Output: FG-001 (is_output=true, final product)
```

**Alternatives (`sequence`):**
- Items z tym samym `operation_seq` i `sequence` są alternatywami
- System wybiera wg kolejności rezerwacji w WO (`reserved_at`)
- Przykład: BOX-001 i BOX-002 oba mają sequence=1, różnią się line_ids

**Line-specific Components (`line_ids`):**
- `NULL` → używany na WSZYSTKICH liniach
- `[line_4_id]` → używany TYLKO na Line 4
- Pozwala na różne opakowania per linia

**Snapshot Logic (WO creation):**
```typescript
// Planner wybiera Line 7
const woItems = bomItems
  .filter(item => item.line_ids === null || item.line_ids.includes(lineId))
  .map(item => ({
    ...item,
    for_operation_seq: item.operation_seq,
    source: item.is_output ? null : 'inventory' // outputs nie są źródłem
  }));
```

### 2.4 Conditional Flags (per BOM Item)

| Field | Type | Description |
|-------|------|-------------|
| `condition_flags` | jsonb | Lista flag warunkowych |
| `condition_logic` | enum | AND / OR |

**Przykład:**
```json
{
  "condition_flags": ["organic", "gluten_free"],
  "condition_logic": "AND"
}
```

Komponent jest włączony tylko gdy zamówienie ma OBE flagi: organic AND gluten_free.

### 2.5 By-Products

- **Unlimited count** per BOM
- Each by-product has `yield_percent` (np. 15% = 15kg by-product z 100kg main output)
- By-product inherits batch from main output
- Automatic LP creation for by-products

### 2.6 BOM Versioning

| Feature | Description |
|---------|-------------|
| Auto date validation | Database trigger prevents overlapping effective dates |
| Clone version | Copy all items to new version with new dates |
| Compare versions | Diff view: added/removed/changed items |
| Max versions | Configured in Settings (default: unlimited) |

### 2.7 Allergen Inheritance

**Automatic rollup:**
- BOM inherits allergens from ALL BOM items
- If any item "Contains" milk → BOM product "Contains" milk
- If any item "May Contain" nuts → BOM product "May Contain" nuts
- Displayed on BOM detail page
- Warning if BOM allergens differ from Product allergens

### 2.8 BOM Timeline Visualization

- Horizontal Gantt-style timeline
- Each bar = one BOM version
- Color by status (green=Active, gray=Draft, orange=Phased Out)
- Click bar to view/edit

### 2.9 UI Components

- BOMs table with search, filter by product/status
- BOM timeline per product
- Create/Edit BOM form with items table
- **Production Lines selector** (multi-select linii na których BOM może być produkowany)
- **Routing selector** (wybór routingu dla BOM)
- **Packaging fields** (units_per_box, boxes_per_pallet)
- Add BOM Item modal with **line assignment** (wybór linii dla komponentu)
- Conditional flags selector
- Allergen rollup display
- Version comparison modal
- Clone version button

---

## Sekcja 3: Routings

**Route:** `/technical/routings`

**Koncepcja:** Routing definiuje sekwencję operacji produkcyjnych. Routing jest przypisywany do BOM (nie do produktu bezpośrednio). Jeden routing może być używany przez wiele BOM-ów.

### 3.1 Routing Header

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Nazwa routingu (np. "Dice and Smoke") |
| `description` | text | No | Opis procesu |
| `is_active` | boolean | Yes | Status aktywności |

**Uwaga:** Routing NIE ma przypisania do produktu. Przypisanie następuje przez BOM (`bom.routing_id`).

### 3.2 Routing Operation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sequence` | number | Yes | Kolejność operacji (1, 2, 3...) |
| `name` | string | Yes | Nazwa operacji (np. "Dice", "Smoke", "Pack") |
| `description` | text | No | Opis operacji |
| `machine_id` | FK | No | Maszyna przypisana do operacji |
| `estimated_duration_minutes` | number | No | Szacowany czas trwania |
| `labor_cost_per_hour` | decimal | No | Domyślny koszt pracy/h (może być override w BOM) |

### 3.3 Routing ↔ BOM Relationship

```
Routing "DICE-SMOKE" (id: R1)
├── Operation 1: Dice (30 min)
├── Operation 2: Smoke (120 min)
└── Operation 3: Pack (15 min)

BOM "FG-001 v1.0" → routing_id: R1
BOM "FG-002 v1.0" → routing_id: R1  (ten sam routing, różne produkty)
BOM "FG-003 v1.0" → routing_id: R2  (inny routing)
```

### 3.4 Cost Calculation

Koszt pracy WO = Σ (operation.estimated_duration × labor_cost_per_hour)

- `labor_cost_per_hour` pobierany z:
  1. `bom_production_lines.labor_cost_per_hour` (jeśli override dla linii)
  2. `routing_operations.labor_cost_per_hour` (domyślny)

### 3.5 UI Components

- Routings table with search, filter by status
- Create/Edit Routing form (name, description)
- Operations table (drag-drop reorder sequence)
- Add/Edit Operation modal (name, machine, duration, labor_cost)

---

## Sekcja 4: Tracing

**Route:** `/technical/tracing`

### 4.1 Forward Trace

**Question:** "Gdzie poszedł ten materiał?"

**Input:** LP ID or Batch Number
**Output:** Tree of all child LPs, WOs that consumed it, final products

**Example:**
```
LP-001 (Milk Batch A)
├── WO-101 (Cheese Production)
│   ├── LP-050 (Cheddar 1kg)
│   └── LP-051 (Cheddar 1kg)
└── WO-102 (Yogurt Production)
    └── LP-060 (Yogurt 500g)
```

### 4.2 Backward Trace

**Question:** "Z czego powstał ten produkt?"

**Input:** LP ID or Batch Number
**Output:** Tree of all parent LPs, suppliers, batches

**Example:**
```
LP-050 (Cheddar 1kg)
├── LP-001 (Milk - Supplier: FarmCo, Batch: MILK-2025-001)
├── LP-010 (Salt - Supplier: SaltCo, Batch: SALT-2025-042)
└── LP-020 (Rennet - Supplier: EnzymeCo, Batch: REN-2025-015)
```

### 4.3 Recall Simulation

**Question:** "Co musimy wycofać jeśli ten batch jest skażony?"

**Input:** Batch Number or LP ID
**Output:**
- All affected LPs (forward + backward trace)
- Estimated qty affected
- Locations (where are they now)
- Customers (if shipped)
- Cost estimation

**Report Format:**
- On-screen summary
- PDF export
- FDA-compliant JSON/XML export

**Performance Target:** < 30 seconds for 1000+ LP genealogy

### 4.4 Genealogy Tree View

**Visual tree diagram:**
- Interactive tree (expand/collapse nodes)
- Node info: LP ID, Product, Qty, Batch, Expiry, Location
- Color coding by status (available, consumed, shipped)
- Click node to view LP details
- Zoom in/out

### 4.5 Trace Query Performance

| Trace Type | Max Depth | Target Time | Max LPs |
|------------|-----------|-------------|---------|
| Forward | Unlimited | < 1 minute | 1000+ |
| Backward | Unlimited | < 1 minute | 1000+ |
| Recall | Both | < 30 seconds | 5000+ |

### 4.6 UI Components

- Trace input form (LP ID / Batch Number)
- Radio buttons: Forward / Backward / Recall
- Results tree view (interactive)
- Export buttons (PDF, JSON, XML)
- Recall summary card (qty, locations, customers)

---

## Functional Requirements

### Products

**FR-TECH-001: Product CRUD with Versioning**
- **Priority:** MVP
- **Description:** Create, edit, view products with automatic version tracking
- **Acceptance Criteria:**
  - User can create product with all configured fields
  - Code is immutable after creation
  - Any edit increments version by 0.1
  - Version history shows all changes with user and timestamp

**FR-TECH-002: Product Types Configuration**
- **Priority:** MVP
- **Description:** Configurable product type list in Settings
- **Acceptance Criteria:**
  - Default types: RM, WIP, FG, PKG, BY-Product
  - User can add custom types
  - Types can be deactivated

**FR-TECH-003: Product Field Configuration**
- **Priority:** MVP
- **Description:** Toggle which fields are visible and mandatory
- **Acceptance Criteria:**
  - Each field has show/hide toggle
  - Each field has mandatory toggle
  - Configuration applied to Create/Edit forms

**FR-TECH-004: Product Allergen Management**
- **Priority:** MVP
- **Description:** Assign allergens to products with Contains/May Contain distinction
- **Acceptance Criteria:**
  - Multi-select for Contains allergens
  - Multi-select for May Contain allergens
  - Allergens displayed on product card

**FR-TECH-005: Product Version History**
- **Priority:** MVP
- **Description:** View complete version history with field changes
- **Acceptance Criteria:**
  - History modal shows all versions
  - Each version shows: date, user, changed fields with old→new values
  - Can compare any two versions

### BOMs

**FR-TECH-006: BOM CRUD with Items**
- **Priority:** MVP
- **Description:** Create and manage BOMs with material items
- **Acceptance Criteria:**
  - User can create BOM with header and items
  - Items have qty, UoM, scrap %, sequence
  - Items support consume_whole_lp flag

**FR-TECH-007: BOM Versioning with Date Overlap Validation**
- **Priority:** MVP
- **Description:** Multiple BOM versions per product with automatic overlap prevention
- **Acceptance Criteria:**
  - BOM has effective_from/to dates
  - Database trigger prevents overlapping dates
  - Timeline visualization shows all versions

**FR-TECH-008: BOM Clone and Compare**
- **Priority:** MVP
- **Description:** Clone existing BOM version and compare versions
- **Acceptance Criteria:**
  - Clone button copies all items to new version
  - Compare shows diff: added/removed/changed items
  - Version limit enforced from Settings

**FR-TECH-009: Conditional BOM Items**
- **Priority:** MVP
- **Description:** BOM items with conditional flags (organic, vegan, etc.)
- **Acceptance Criteria:**
  - Item can have condition_flags array
  - Condition logic: AND/OR
  - Flags configured in Settings

**FR-TECH-010: By-Products in BOM**
- **Priority:** MVP
- **Description:** Define by-products with yield percentage
- **Acceptance Criteria:**
  - Item can be marked as is_by_product
  - By-product has yield_percent
  - Unlimited by-products per BOM

**FR-TECH-011: Allergen Inheritance**
- **Priority:** MVP
- **Description:** BOM automatically inherits allergens from all items
- **Acceptance Criteria:**
  - Allergen rollup calculated from all BOM items
  - Contains and May Contain separate
  - Warning if BOM allergens differ from Product allergens

### Routings

**FR-TECH-012: Routing CRUD**
- **Priority:** MVP
- **Description:** Create and manage reusable routings
- **Acceptance Criteria:**
  - Routing has code, name, status
  - Routing can be reusable (many products)

**FR-TECH-013: Routing Operations**
- **Priority:** MVP
- **Description:** Define operation steps with time and yield
- **Acceptance Criteria:**
  - Operations with sequence, name, duration, yield
  - Optional machine/line assignment
  - Drag-drop reorder

**FR-TECH-014: Routing-Product Assignment**
- **Priority:** MVP
- **Description:** Assign routings to products (many-to-many)
- **Acceptance Criteria:**
  - Product can have multiple routings
  - Routing can be used by multiple products
  - Default routing per product

### Tracing

**FR-TECH-015: Forward Traceability**
- **Priority:** MVP
- **Description:** Trace LP forward to all children and products
- **Acceptance Criteria:**
  - Input: LP ID or Batch
  - Output: Tree of all descendants
  - Performance: < 1 minute for 1000+ LPs

**FR-TECH-016: Backward Traceability**
- **Priority:** MVP
- **Description:** Trace LP backward to all parents and suppliers
- **Acceptance Criteria:**
  - Input: LP ID or Batch
  - Output: Tree of all ancestors
  - Performance: < 1 minute for 1000+ LPs

**FR-TECH-017: Recall Simulation**
- **Priority:** MVP
- **Description:** Simulate recall with impact analysis
- **Acceptance Criteria:**
  - Input: Batch or LP
  - Output: All affected LPs, qty, locations, customers
  - Export: PDF, FDA JSON/XML
  - Performance: < 30 seconds

**FR-TECH-018: Genealogy Tree View**
- **Priority:** MVP
- **Description:** Interactive visual tree of LP relationships
- **Acceptance Criteria:**
  - Expand/collapse nodes
  - Node shows LP details
  - Color coding by status
  - Zoom controls

---

## Database Tables

### products
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL UNIQUE
- name TEXT NOT NULL
- description TEXT
- product_type_id UUID FK NOT NULL
- base_uom TEXT NOT NULL
- status TEXT NOT NULL DEFAULT 'active'
- version TEXT NOT NULL DEFAULT '1.0'
- barcode TEXT
- category_id UUID FK
- supplier_id UUID FK
- supplier_lead_time_days INTEGER
- moq NUMERIC
- expiry_policy TEXT
- shelf_life_days INTEGER
- std_price NUMERIC
- min_stock NUMERIC
- max_stock NUMERIC
- storage_conditions TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- created_by UUID FK
- updated_by UUID FK
```

### product_types
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- is_default BOOLEAN DEFAULT false
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
```

### product_allergens
```sql
- id UUID PK
- product_id UUID FK NOT NULL
- allergen_id UUID FK NOT NULL
- relation_type TEXT NOT NULL -- 'contains' or 'may_contain'
- created_at TIMESTAMPTZ
```

### product_version_history
```sql
- id UUID PK
- product_id UUID FK NOT NULL
- version TEXT NOT NULL
- changed_fields JSONB NOT NULL -- {"field": {"old": x, "new": y}}
- changed_by UUID FK NOT NULL
- changed_at TIMESTAMPTZ NOT NULL
```

### boms
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- version TEXT NOT NULL
- bom_type TEXT NOT NULL DEFAULT 'standard'
- effective_from DATE NOT NULL
- effective_to DATE
- status TEXT NOT NULL DEFAULT 'draft'
- output_qty NUMERIC NOT NULL
- output_uom TEXT NOT NULL
- notes TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- created_by UUID FK
- updated_by UUID FK
```

### bom_items
```sql
- id UUID PK
- bom_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- scrap_percent NUMERIC DEFAULT 0
- sequence INTEGER NOT NULL
- consume_whole_lp BOOLEAN DEFAULT false
- is_by_product BOOLEAN DEFAULT false
- yield_percent NUMERIC
- condition_flags JSONB
- condition_logic TEXT DEFAULT 'AND'
- created_at TIMESTAMPTZ
```

### routings
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- description TEXT
- status TEXT NOT NULL DEFAULT 'active'
- is_reusable BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### routing_operations
```sql
- id UUID PK
- routing_id UUID FK NOT NULL
- sequence INTEGER NOT NULL
- operation_name TEXT NOT NULL
- machine_id UUID FK
- line_id UUID FK
- expected_duration_minutes INTEGER NOT NULL
- expected_yield_percent NUMERIC NOT NULL DEFAULT 100
- setup_time_minutes INTEGER
- labor_cost NUMERIC
- created_at TIMESTAMPTZ
```

### product_routings
```sql
- id UUID PK
- product_id UUID FK NOT NULL
- routing_id UUID FK NOT NULL
- is_default BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ
```

### conditional_flags
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- is_default BOOLEAN DEFAULT false
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
```

### technical_settings
```sql
- id UUID PK
- org_id UUID FK NOT NULL UNIQUE
- product_field_config JSONB NOT NULL -- {"barcode": {"visible": true, "required": false}}
- max_bom_versions INTEGER DEFAULT 0 -- 0 = unlimited
- use_conditional_flags BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

---

## API Endpoints

### Products
- `GET /api/technical/products` - List products (filter, search, paginate)
- `GET /api/technical/products/:id` - Get product detail
- `POST /api/technical/products` - Create product
- `PUT /api/technical/products/:id` - Update product (increments version)
- `DELETE /api/technical/products/:id` - Deactivate product
- `GET /api/technical/products/:id/history` - Get version history
- `GET /api/technical/products/:id/allergens` - Get product allergens
- `PUT /api/technical/products/:id/allergens` - Update product allergens

### Product Types
- `GET /api/technical/product-types` - List types
- `POST /api/technical/product-types` - Create custom type
- `PUT /api/technical/product-types/:id` - Update type
- `DELETE /api/technical/product-types/:id` - Deactivate type

### BOMs
- `GET /api/technical/boms` - List BOMs (filter by product)
- `GET /api/technical/boms/:id` - Get BOM with items
- `POST /api/technical/boms` - Create BOM
- `PUT /api/technical/boms/:id` - Update BOM
- `DELETE /api/technical/boms/:id` - Delete BOM (only draft)
- `POST /api/technical/boms/:id/clone` - Clone BOM version
- `GET /api/technical/boms/:id/allergens` - Get BOM allergen rollup
- `GET /api/technical/boms/compare` - Compare two BOM versions

### BOM Items
- `POST /api/technical/boms/:id/items` - Add item
- `PUT /api/technical/boms/:id/items/:itemId` - Update item
- `DELETE /api/technical/boms/:id/items/:itemId` - Remove item
- `PUT /api/technical/boms/:id/items/reorder` - Reorder items

### Routings
- `GET /api/technical/routings` - List routings
- `GET /api/technical/routings/:id` - Get routing with operations
- `POST /api/technical/routings` - Create routing
- `PUT /api/technical/routings/:id` - Update routing
- `DELETE /api/technical/routings/:id` - Deactivate routing
- `GET /api/technical/routings/:id/products` - Get products using this routing
- `PUT /api/technical/routings/:id/products` - Assign products

### Routing Operations
- `POST /api/technical/routings/:id/operations` - Add operation
- `PUT /api/technical/routings/:id/operations/:opId` - Update operation
- `DELETE /api/technical/routings/:id/operations/:opId` - Remove operation
- `PUT /api/technical/routings/:id/operations/reorder` - Reorder operations

### Tracing
- `POST /api/technical/tracing/forward` - Forward trace
- `POST /api/technical/tracing/backward` - Backward trace
- `POST /api/technical/tracing/recall` - Recall simulation
- `GET /api/technical/tracing/recall/:id/export` - Export recall report (PDF/JSON/XML)

### Technical Settings
- `GET /api/technical/settings` - Get technical settings
- `PUT /api/technical/settings` - Update technical settings
- `GET /api/technical/conditional-flags` - List conditional flags
- `POST /api/technical/conditional-flags` - Create custom flag
- `PUT /api/technical/conditional-flags/:id` - Update flag
- `DELETE /api/technical/conditional-flags/:id` - Deactivate flag

---

## Notes

- **Product Images:** Phase 2 feature - show "Coming Soon" placeholder
- **Cost Calculation:** Std Price in Product, but full costing in Finance module (Phase 4)
- **Allergen Inheritance:** Critical for compliance - must be automatic and accurate
- **Tracing Performance:** Optimize with recursive CTEs and proper indexing on lp_genealogy
- **BOM Date Overlap:** Database trigger is critical - prevents invalid data
