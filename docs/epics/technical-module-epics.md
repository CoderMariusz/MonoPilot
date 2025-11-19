# Technical Module - Epic Breakdown

**Moduł:** Technical (Products, BOMs, Routings, Tracing)
**Priorytet:** P0 - Foundation (after Settings)
**FRs:** 18 (wszystkie MVP)
**Szacowany czas:** 3-4 tygodnie

---

## Podsumowanie Epików

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| TECH-1 | Products & Versioning | 5 | 8 | P0 | 5d |
| TECH-2 | BOMs & Multi-Version | 6 | 10 | P0 | 6d |
| TECH-3 | Routings & Operations | 3 | 5 | P0 | 3d |
| TECH-4 | Traceability & Recall | 4 | 6 | P0 | 4d |
| **Total** | | **18** | **29** | | **18d** |

---

## Epic TECH-1: Products & Versioning

**Cel:** CRUD produktów z automatycznym wersjonowaniem i alergenami
**FRs:** FR-TECH-001, FR-TECH-002, FR-TECH-003, FR-TECH-004, FR-TECH-005
**Priorytet:** P0 MVP
**Effort:** 5 dni

### Stories

#### TECH-1-1: Product Type Management
**Jako** Admin **chcę** zarządzać typami produktów **aby** kategoryzować inventory

**Acceptance Criteria:**
- [ ] Default types: RM, WIP, FG, PKG, BP preloaded
- [ ] User can add custom product types
- [ ] Types can be activated/deactivated
- [ ] Type code unique per org

**Technical Tasks:**
- API: CRUD `/api/technical/product-types`
- product_types table with seed data
- UI: ProductTypesTable in Settings

---

#### TECH-1-2: Product Field Configuration
**Jako** Admin **chcę** konfigurować widoczność pól produktu **aby** upraszczać formularze

**Acceptance Criteria:**
- [ ] Each optional field has show/hide toggle
- [ ] Each optional field has required/optional toggle
- [ ] Fields: barcode, category, supplier_lead_time, moq, expiry_policy, shelf_life, std_price, min_stock, max_stock, storage_conditions
- [ ] Config applied to Create/Edit forms dynamically

**Technical Tasks:**
- technical_settings.product_field_config JSONB
- API: GET/PUT `/api/technical/settings`
- UI: Dynamic form renderer based on config

---

#### TECH-1-3: Product CRUD Core
**Jako** User **chcę** tworzyć i edytować produkty **aby** definiować inventory

**Acceptance Criteria:**
- [ ] Products table with search, filters (type, status, category)
- [ ] Create modal with all configured fields
- [ ] Code is immutable after creation
- [ ] Edit drawer (no code edit)
- [ ] Deactivate product (soft delete)

**Technical Tasks:**
- API: CRUD `/api/technical/products`
- Zod schema for validation
- UI: ProductsTable, CreateProductModal, EditProductDrawer

---

#### TECH-1-4: Product Auto-Versioning
**Jako** System **chcę** automatycznie wersjonować produkty **aby** śledzić historię zmian

**Acceptance Criteria:**
- [ ] New product = version 1.0
- [ ] Any edit = version += 0.1
- [ ] Version history saved in product_version_history
- [ ] Changed fields tracked with old/new values

**Technical Tasks:**
- Trigger/hook on product update
- product_version_history table
- Diff calculation for changed fields

---

#### TECH-1-5: Product Version History View
**Jako** User **chcę** widzieć historię wersji produktu **aby** śledzić zmiany

**Acceptance Criteria:**
- [ ] History modal/drawer shows all versions
- [ ] Each entry: version, date, user, changed fields (old→new)
- [ ] Compare any two versions side-by-side
- [ ] Scroll/paginate for many versions

**Technical Tasks:**
- API: GET `/api/technical/products/:id/history`
- UI: ProductHistoryModal, VersionCompare component

---

#### TECH-1-6: Product Allergen Assignment
**Jako** User **chcę** przypisać alergeny do produktu **aby** śledzić zawartość

**Acceptance Criteria:**
- [ ] Multi-select for "Contains" allergens
- [ ] Multi-select for "May Contain" allergens
- [ ] Allergens displayed on product card
- [ ] product_allergens table with relation_type

**Technical Tasks:**
- API: GET/PUT `/api/technical/products/:id/allergens`
- product_allergens table
- UI: AllergenPicker component

---

#### TECH-1-7: Product Categories (Optional)
**Jako** User **chcę** kategoryzować produkty **aby** łatwiej je znajdować

**Acceptance Criteria:**
- [ ] Category list CRUD
- [ ] Category selector in product form (if enabled)
- [ ] Filter products by category

**Technical Tasks:**
- categories table
- API: CRUD `/api/technical/categories`
- UI: CategorySelector

---

#### TECH-1-8: Product Images Placeholder
**Jako** User **chcę** widzieć placeholder dla zdjęć produktu **aby** wiedzieć że feature będzie dostępny

**Acceptance Criteria:**
- [ ] "Coming Soon" badge on product detail
- [ ] Disabled upload button
- [ ] Placeholder image icon

**Technical Tasks:**
- UI placeholder component only
- No backend implementation

---

## Epic TECH-2: BOMs & Multi-Version

**Cel:** Bill of Materials z wersjonowaniem date-based i conditional flags
**FRs:** FR-TECH-006, FR-TECH-007, FR-TECH-008, FR-TECH-009, FR-TECH-010, FR-TECH-011
**Priorytet:** P0 MVP
**Effort:** 6 dni

### Stories

#### TECH-2-1: BOM CRUD Core
**Jako** User **chcę** tworzyć BOMs **aby** definiować receptury

**Acceptance Criteria:**
- [ ] BOMs table with filters (product, status)
- [ ] Create BOM form with header fields
- [ ] Header: product, version, type, effective dates, status, output qty/uom
- [ ] Edit BOM (only draft status)
- [ ] Delete BOM (only draft status)

**Technical Tasks:**
- API: CRUD `/api/technical/boms`
- boms table
- UI: BOMsTable, CreateBOMForm

---

#### TECH-2-2: BOM Items Management
**Jako** User **chcę** dodawać items do BOM **aby** definiować składniki

**Acceptance Criteria:**
- [ ] BOM Items table per BOM
- [ ] Add item modal: product, qty, uom, scrap%, sequence
- [ ] Edit item inline or modal
- [ ] Delete item
- [ ] Drag-drop reorder items

**Technical Tasks:**
- API: CRUD `/api/technical/boms/:id/items`
- bom_items table
- UI: BOMItemsTable, AddItemModal

---

#### TECH-2-3: BOM Date Overlap Validation
**Jako** System **chcę** zapobiegać nakładaniu się dat BOM **aby** zapewnić spójność

**Acceptance Criteria:**
- [ ] Database trigger prevents overlapping effective_from/to
- [ ] Error message when overlap detected
- [ ] Only one active BOM per product per date

**Technical Tasks:**
- PostgreSQL trigger function
- Migration: add trigger
- Frontend error handling

---

#### TECH-2-4: BOM Timeline Visualization
**Jako** User **chcę** widzieć timeline wersji BOM **aby** zarządzać wersjami wizualnie

**Acceptance Criteria:**
- [ ] Horizontal Gantt-style timeline per product
- [ ] Each bar = one BOM version
- [ ] Color by status (green=Active, gray=Draft, orange=Phased Out)
- [ ] Click bar to view/edit
- [ ] Today marker

**Technical Tasks:**
- UI: BOMTimeline component
- Date calculations for positioning

---

#### TECH-2-5: BOM Clone Version
**Jako** User **chcę** klonować wersję BOM **aby** szybko tworzyć nowe wersje

**Acceptance Criteria:**
- [ ] Clone button on BOM detail
- [ ] Copies all items to new BOM
- [ ] New version = old version + 0.1
- [ ] New effective_from prompted

**Technical Tasks:**
- API: POST `/api/technical/boms/:id/clone`
- Deep copy logic with transaction

---

#### TECH-2-6: BOM Version Compare
**Jako** User **chcę** porównać dwie wersje BOM **aby** widzieć różnice

**Acceptance Criteria:**
- [ ] Select two versions to compare
- [ ] Diff view: added items (green), removed (red), changed (yellow)
- [ ] Show qty/uom changes

**Technical Tasks:**
- API: GET `/api/technical/boms/compare?v1=X&v2=Y`
- UI: BOMCompareModal

---

#### TECH-2-7: Conditional BOM Items
**Jako** User **chcę** dodać warunki do items **aby** mieć dynamiczne receptury

**Acceptance Criteria:**
- [ ] Item can have condition_flags array
- [ ] Condition logic: AND/OR selector
- [ ] Flags from Settings (organic, vegan, gluten_free, etc.)
- [ ] Item included only when flags match

**Technical Tasks:**
- condition_flags JSONB in bom_items
- conditional_flags table for flag definitions
- UI: ConditionalFlagsSelector

---

#### TECH-2-8: By-Products in BOM
**Jako** User **chcę** definiować by-products **aby** śledzić produkty uboczne

**Acceptance Criteria:**
- [ ] Item can be marked is_by_product
- [ ] By-product has yield_percent
- [ ] Unlimited by-products per BOM
- [ ] By-product displayed separately in UI

**Technical Tasks:**
- is_by_product, yield_percent in bom_items
- Separate by-products section in BOM detail

---

#### TECH-2-9: Allergen Inheritance
**Jako** System **chcę** automatycznie dziedziczić alergeny z items **aby** zapewnić compliance

**Acceptance Criteria:**
- [ ] BOM allergens = rollup from all items
- [ ] Contains = any item Contains
- [ ] May Contain = any item May Contain
- [ ] Warning if differs from Product allergens

**Technical Tasks:**
- API: GET `/api/technical/boms/:id/allergens`
- Calculation logic (union of all item allergens)
- UI: AllergenRollupDisplay with warning

---

#### TECH-2-10: Conditional Flags Management
**Jako** Admin **chcę** zarządzać flagami warunkowymi **aby** customizować BOM conditions

**Acceptance Criteria:**
- [ ] Default flags preloaded (organic, vegan, kosher, etc.)
- [ ] User can add custom flags
- [ ] Flags can be activated/deactivated

**Technical Tasks:**
- conditional_flags table with seed
- API: CRUD `/api/technical/conditional-flags`
- UI: FlagsTable in Settings

---

## Epic TECH-3: Routings & Operations

**Cel:** Reusable routings z operacjami i przypisaniem do produktów
**FRs:** FR-TECH-012, FR-TECH-013, FR-TECH-014
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### TECH-3-1: Routing CRUD
**Jako** User **chcę** tworzyć routingi **aby** definiować procesy produkcyjne

**Acceptance Criteria:**
- [ ] Routings table with search
- [ ] Create routing: code, name, description, is_reusable
- [ ] Edit routing
- [ ] Deactivate routing

**Technical Tasks:**
- API: CRUD `/api/technical/routings`
- routings table
- UI: RoutingsTable, RoutingForm

---

#### TECH-3-2: Routing Operations Management
**Jako** User **chcę** definiować operacje w routingu **aby** opisać kroki produkcji

**Acceptance Criteria:**
- [ ] Operations list per routing
- [ ] Add operation: sequence, name, duration, yield%, setup time
- [ ] Optional machine/line assignment
- [ ] Drag-drop reorder
- [ ] Delete operation

**Technical Tasks:**
- API: CRUD `/api/technical/routings/:id/operations`
- routing_operations table
- UI: OperationsTable with drag-drop

---

#### TECH-3-3: Machine/Line Assignment to Operation
**Jako** User **chcę** przypisać maszynę do operacji **aby** planować zasoby

**Acceptance Criteria:**
- [ ] Machine selector (optional)
- [ ] Line selector (optional)
- [ ] Shows capacity if assigned

**Technical Tasks:**
- Foreign keys in routing_operations
- Machine/Line selectors from Settings

---

#### TECH-3-4: Product-Routing Assignment
**Jako** User **chcę** przypisać routingi do produktów **aby** używać ich w WO

**Acceptance Criteria:**
- [ ] Product can have multiple routings
- [ ] Routing can be used by multiple products (reusable)
- [ ] One routing marked as default per product
- [ ] Assignment UI: multi-select products for routing

**Technical Tasks:**
- product_routings table (many-to-many)
- API: GET/PUT `/api/technical/routings/:id/products`
- UI: ProductAssignmentModal

---

#### TECH-3-5: Routing Usage Display
**Jako** User **chcę** widzieć które produkty używają routingu **aby** zarządzać wpływem zmian

**Acceptance Criteria:**
- [ ] "Used by X products" badge on routing list
- [ ] Product list on routing detail
- [ ] Warning when editing routing used by many products

**Technical Tasks:**
- API: GET `/api/technical/routings/:id/products`
- Count display in list
- Product list in detail view

---

## Epic TECH-4: Traceability & Recall

**Cel:** Forward/Backward trace z recall simulation i tree view
**FRs:** FR-TECH-015, FR-TECH-016, FR-TECH-017, FR-TECH-018
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### TECH-4-1: Forward Traceability
**Jako** QC Manager **chcę** śledzić LP do przodu **aby** wiedzieć gdzie trafiło

**Acceptance Criteria:**
- [ ] Input: LP ID or Batch Number
- [ ] Output: Tree of all child LPs, WOs, final products
- [ ] Performance: < 1 minute for 1000+ LPs
- [ ] Expand/collapse tree nodes

**Technical Tasks:**
- API: POST `/api/technical/tracing/forward`
- Recursive CTE query on lp_genealogy
- Optimize with proper indexes

---

#### TECH-4-2: Backward Traceability
**Jako** QC Manager **chcę** śledzić LP wstecz **aby** wiedzieć skąd pochodzi

**Acceptance Criteria:**
- [ ] Input: LP ID or Batch Number
- [ ] Output: Tree of all parent LPs, suppliers, batches
- [ ] Performance: < 1 minute for 1000+ LPs
- [ ] Shows supplier and batch info

**Technical Tasks:**
- API: POST `/api/technical/tracing/backward`
- Recursive CTE query ascending
- Include supplier data from PO

---

#### TECH-4-3: Recall Simulation
**Jako** QC Manager **chcę** symulować recall **aby** ocenić wpływ

**Acceptance Criteria:**
- [ ] Input: Batch or LP ID
- [ ] Output: All affected LPs (forward + backward)
- [ ] Summary: qty affected, locations, customers
- [ ] Cost estimation
- [ ] Performance: < 30 seconds

**Technical Tasks:**
- API: POST `/api/technical/tracing/recall`
- Combined forward + backward trace
- Aggregate calculations

---

#### TECH-4-4: Recall Report Export
**Jako** QC Manager **chcę** eksportować raport recall **aby** przesłać do FDA

**Acceptance Criteria:**
- [ ] PDF export (formatted report)
- [ ] FDA JSON export
- [ ] FDA XML export
- [ ] Report includes all affected items with details

**Technical Tasks:**
- API: GET `/api/technical/tracing/recall/:id/export`
- PDF generation (puppeteer or similar)
- JSON/XML serialization

---

#### TECH-4-5: Genealogy Tree View
**Jako** User **chcę** widzieć interaktywne drzewo genealogii **aby** wizualizować relacje LP

**Acceptance Criteria:**
- [ ] Interactive tree diagram
- [ ] Expand/collapse nodes
- [ ] Node shows: LP ID, Product, Qty, Batch, Expiry, Location
- [ ] Color coding by status (available, consumed, shipped)
- [ ] Click node to view LP details
- [ ] Zoom in/out controls

**Technical Tasks:**
- UI: GenealogyTree component (react-d3-tree or similar)
- Node detail tooltip/popover
- Zoom/pan controls

---

#### TECH-4-6: Trace Search Form
**Jako** User **chcę** wyszukać trace przez LP lub Batch **aby** szybko znaleźć informacje

**Acceptance Criteria:**
- [ ] Input field for LP ID or Batch Number
- [ ] Radio buttons: Forward / Backward / Recall
- [ ] Search button
- [ ] Recent searches history (last 5)

**Technical Tasks:**
- UI: TraceSearchForm component
- Local storage for recent searches
- Route to appropriate trace endpoint

---

## Zależności

```
TECH-1 (Products) → TECH-2 (BOMs) → TECH-3 (Routings)
                              ↘ TECH-4 (Tracing)
```

- TECH-1 musi być pierwszy (produkty używane w BOMs, Routings)
- TECH-4 wymaga LP danych z Warehouse (może działać z mock data najpierw)

---

## Definition of Done

- [ ] Wszystkie AC spełnione
- [ ] Unit tests (95% coverage)
- [ ] E2E tests dla critical paths
- [ ] BOM date overlap trigger działa
- [ ] Trace performance < targets
- [ ] API documentation updated
- [ ] Code review approved

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Dependencies:** Settings Module complete

---

_Epic breakdown dla Technical Module - 18 FRs → 4 epiki, 29 stories_
