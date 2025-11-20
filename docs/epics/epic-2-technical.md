## Epic 2: Technical Core

**Goal:** Define products, BOMs, routings, and traceability - the "what we produce" foundation.

**Dependencies:** Epic 1 (Settings)
**Required by:** Epic 3 (Planning), Epic 4 (Production)

**UX Design Reference:** [ux-design-technical-module.md](./ux-design-technical-module.md)

---

### Story 2.1: Product CRUD

As a **Technical user**,
I want to create and manage products,
So that we have a master data catalog.

**Acceptance Criteria:**

**Given** the user has Technical role or higher
**When** they navigate to /technical/products
**Then** they see a table with columns: Code, Name, Type, UoM, Status, Version

**And** can search by code/name
**And** can filter by type, status, category

**When** clicking "Add Product"
**Then** Create Modal opens with all fields per Settings configuration
**And** Code is editable (only during creation)
**And** Version starts at 1.0

**When** saving product
**Then** product is created
**And** audit trail entry created

**Prerequisites:** Epic 1

**Technical Notes:**
- Code is immutable after creation
- Fields visibility based on technical_settings.product_field_config
- API: GET/POST /api/technical/products

---

### Story 2.2: Product Edit with Versioning

As a **Technical user**,
I want to edit products with automatic version tracking,
So that we have history of all changes.

**Acceptance Criteria:**

**Given** a product exists
**When** clicking Edit
**Then** Edit Drawer opens with all fields except Code

**When** saving changes
**Then** version increments by 0.1 (e.g., 1.0 → 1.1)
**And** changed fields are recorded in product_version_history
**And** timestamp and user recorded

**When** version reaches X.9
**Then** next version is X+1.0 (e.g., 1.9 → 2.0)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Record: product_id, version, changed_fields (JSONB), changed_by, changed_at
- API: PUT /api/technical/products/:id

---

### Story 2.3: Product Version History

As a **Technical user**,
I want to view product version history,
So that I can see what changed and when.

**Acceptance Criteria:**

**Given** a product has been edited multiple times
**When** clicking "History" button
**Then** History Modal opens showing timeline of versions

**And** each entry shows:
- Version number
- Date and time
- User who made the change
- Fields changed with old → new values

**When** clicking "Compare"
**Then** can select two versions to see diff

**Prerequisites:** Story 2.2

**Technical Notes:**
- Efficient query with pagination
- API: GET /api/technical/products/:id/history

---

### Story 2.4: Product Allergen Assignment

As a **Technical user**,
I want to assign allergens to products,
So that allergen information is tracked.

**Acceptance Criteria:**

**Given** a product is being created or edited
**When** user reaches Allergens section
**Then** they see two multi-select fields:
- Contains (allergens the product contains)
- May Contain (potential cross-contamination)

**And** allergens come from Settings (14 EU + custom)
**And** selections are saved with product

**When** viewing product
**Then** allergens displayed as tags/badges

**Prerequisites:** Story 2.1, Story 1.9

**Technical Notes:**
- product_allergens table with relation_type ('contains' or 'may_contain')
- API: GET/PUT /api/technical/products/:id/allergens

---

### Story 2.5: Product Types Configuration

As an **Admin**,
I want to configure product types,
So that we can categorize products properly.

**Acceptance Criteria:**

**Given** the user is Admin
**When** they navigate to /settings/technical
**Then** they see Product Types management

**And** default types: RM, WIP, FG, PKG, BP
**And** can add custom types with code and name
**And** can deactivate types (not delete)

**Prerequisites:** Epic 1

**Technical Notes:**
- product_types table with is_default flag
- Custom types have is_default = false
- API: GET/POST/PUT /api/technical/product-types

---

### Story 2.6: BOM CRUD

As a **Technical user**,
I want to create and manage Bills of Materials,
So that we define product recipes.

**Acceptance Criteria:**

**Given** the user has Technical role
**When** they navigate to /technical/boms
**Then** they see a table/list of BOMs grouped by product

**When** clicking "Add BOM"
**Then** a form opens with:
- product_id (required, dropdown)
- version (auto-generated)
- effective_from (required date)
- effective_to (optional date)
- status (Draft, Active, Phased Out, Inactive)
- output_qty and output_uom

**And** items section to add BOM items

**Prerequisites:** Story 2.1

**Technical Notes:**
- Version format: 1.0, 1.1, 2.0
- API: GET/POST /api/technical/boms

---

### Story 2.7: BOM Items Management

As a **Technical user**,
I want to add materials to a BOM,
So that I define what goes into the product.

**Acceptance Criteria:**

**Given** a BOM is being created/edited
**When** clicking "Add Item"
**Then** a modal opens with:
- product_id (component, dropdown)
- quantity (required)
- uom (from component)
- scrap_percent (default 0)
- sequence (drag-drop reorder)
- consume_whole_lp (toggle)

**When** saving items
**Then** items are displayed in table with calculated effective qty
**And** can reorder with drag-drop
**And** can edit/delete items

**Prerequisites:** Story 2.6

**Technical Notes:**
- Sequence determines consumption order
- Effective qty = quantity * (1 + scrap_percent/100)
- API: POST/PUT/DELETE /api/technical/boms/:id/items

---

### Story 2.8: BOM Date Overlap Validation

As a **Technical user**,
I want the system to prevent overlapping BOM dates,
So that there's always one valid BOM per product.

**Acceptance Criteria:**

**Given** a product has BOM with effective_from=2025-01-01, effective_to=2025-12-31
**When** creating new BOM for same product with effective_from=2025-06-01
**Then** system shows error: "Date range overlaps with BOM v1.0"

**Given** existing BOM has no effective_to (infinite)
**When** creating new BOM
**Then** must either:
- Set effective_to on existing BOM, OR
- Set effective_from after current date and existing will be auto-closed

**Prerequisites:** Story 2.6

**Technical Notes:**
- Database trigger to validate on INSERT/UPDATE
- Error message includes conflicting BOM version
- API returns 400 with clear message

---

### Story 2.9: BOM Timeline Visualization

As a **Technical user**,
I want to see a visual timeline of BOM versions,
So that I can understand version history at a glance.

**Acceptance Criteria:**

**Given** a product has multiple BOM versions
**When** viewing product's BOMs
**Then** a Gantt-style timeline is displayed:
- X-axis: dates
- Each bar = one BOM version
- Color by status (green=Active, gray=Draft, orange=Phased Out)

**When** clicking a bar
**Then** BOM detail is shown
**And** can edit from there

**Prerequisites:** Story 2.6

**Technical Notes:**
- Reference: ux-design-technical-module.md (BOM Timeline)
- Use recharts or similar for visualization

---

### Story 2.10: BOM Clone

As a **Technical user**,
I want to clone an existing BOM,
So that I can create new versions quickly.

**Acceptance Criteria:**

**Given** a BOM exists
**When** clicking "Clone" button
**Then** a dialog asks for new effective dates
**And** new BOM is created with:
- Same product
- New version number (auto-increment)
- All items copied
- Status = Draft

**Prerequisites:** Story 2.6

**Technical Notes:**
- Clone all bom_items
- API: POST /api/technical/boms/:id/clone

---

### Story 2.11: BOM Compare

As a **Technical user**,
I want to compare two BOM versions,
So that I can see differences.

**Acceptance Criteria:**

**Given** a product has multiple BOM versions
**When** clicking "Compare" and selecting two versions
**Then** a diff view is shown:
- Items added (green)
- Items removed (red)
- Items changed (yellow) with old → new values

**Prerequisites:** Story 2.6

**Technical Notes:**
- Compare by product_id (material)
- Show qty/uom/scrap changes
- API: GET /api/technical/boms/compare?v1=X&v2=Y

---

### Story 2.12: Conditional BOM Items

As a **Technical user**,
I want to add conditions to BOM items,
So that certain materials are only used for specific variants.

**Acceptance Criteria:**

**Given** conditional flags are enabled in Settings
**When** adding/editing a BOM item
**Then** can select condition_flags (multi-select)
**And** can set condition_logic (AND/OR)

**Example:** Item "Organic Flour" has flags ["organic", "vegan"] with AND logic
→ Only used when WO has BOTH flags

**When** viewing BOM
**Then** conditional items shown with flag badges

**Prerequisites:** Story 2.7, configured conditional flags

**Technical Notes:**
- Default flags: organic, gluten_free, vegan, kosher, halal, dairy_free, nut_free, soy_free
- Custom flags from Settings
- API includes condition in BOM snapshot

---

### Story 2.13: By-Products in BOM

As a **Technical user**,
I want to define by-products in BOM,
So that production outputs all expected products.

**Acceptance Criteria:**

**Given** a BOM is being edited
**When** adding an item
**Then** can toggle is_by_product = true
**And** must enter yield_percent (e.g., 15 = 15%)

**When** viewing BOM
**Then** by-products shown in separate section
**And** total yield displayed

**Prerequisites:** Story 2.7

**Technical Notes:**
- By-product creates separate LP during production
- yield_percent of main output qty
- Unlimited by-products per BOM

---

### Story 2.14: Allergen Inheritance

As a **Technical user**,
I want BOM to automatically inherit allergens from components,
So that allergen information is always accurate.

**Acceptance Criteria:**

**Given** a BOM has multiple items
**When** viewing BOM allergens
**Then** system shows rolled-up allergens:
- Contains: union of all item Contains allergens
- May Contain: union of all item May Contain allergens

**And** if BOM allergens differ from Product allergens, show warning
**And** can update Product allergens from BOM

**Prerequisites:** Story 2.7, Story 2.4

**Technical Notes:**
- Calculated on-the-fly or cached
- Warning on BOM save if mismatch
- API: GET /api/technical/boms/:id/allergens

---

### Story 2.15: Routing CRUD

As a **Technical user**,
I want to create and manage routings,
So that we define production operations.

**Acceptance Criteria:**

**Given** the user has Technical role
**When** they navigate to /technical/routings
**Then** they see a table of routings with: code, name, status, products count

**When** clicking "Add Routing"
**Then** a form opens with:
- code (required, unique)
- name (required)
- description (optional)
- status (Active, Inactive)
- is_reusable (toggle, default true)

**Prerequisites:** Epic 1

**Technical Notes:**
- Reusable routings can be assigned to multiple products
- API: GET/POST/PUT/DELETE /api/technical/routings

---

### Story 2.16: Routing Operations

As a **Technical user**,
I want to define operations in a routing,
So that we have step-by-step production instructions.

**Acceptance Criteria:**

**Given** a routing is being edited
**When** adding operations
**Then** can add multiple operations with:
- sequence (drag-drop reorder)
- operation_name (required)
- machine_id (optional dropdown)
- line_id (optional dropdown)
- expected_duration_minutes (required)
- expected_yield_percent (default 100)
- setup_time_minutes (optional)
- labor_cost (optional)

**Prerequisites:** Story 2.15, Story 1.7, Story 1.8

**Technical Notes:**
- Sequence determines execution order
- API: POST/PUT/DELETE /api/technical/routings/:id/operations

---

### Story 2.17: Routing-Product Assignment

As a **Technical user**,
I want to assign routings to products,
So that products have defined production processes.

**Acceptance Criteria:**

**Given** a routing is reusable
**When** viewing routing detail
**Then** see list of assigned products

**When** clicking "Assign Products"
**Then** multi-select shows available products
**And** can set one as default routing for product

**Given** a product is being edited
**Then** can assign routings from product side too

**Prerequisites:** Story 2.15, Story 2.1

**Technical Notes:**
- Many-to-many: product_routings table
- is_default flag per product
- API: PUT /api/technical/routings/:id/products

---

### Story 2.18: Forward Traceability

As a **QC Manager**,
I want to trace a material forward,
So that I can see where it was used.

**Acceptance Criteria:**

**Given** the user navigates to /technical/tracing
**When** entering LP ID or Batch Number
**And** selecting "Forward Trace"
**Then** system shows tree of:
- All child LPs (from splits)
- All WOs that consumed it
- All output products

**And** tree is expandable/collapsible
**And** can click nodes to view details

**Prerequisites:** Epic 5 (LP Genealogy)

**Technical Notes:**
- Recursive query on lp_genealogy
- Performance target: < 1 minute for 1000+ LPs
- API: POST /api/technical/tracing/forward

---

### Story 2.19: Backward Traceability

As a **QC Manager**,
I want to trace a product backward,
So that I can see what went into it.

**Acceptance Criteria:**

**Given** the user navigates to /technical/tracing
**When** entering LP ID or Batch Number
**And** selecting "Backward Trace"
**Then** system shows tree of:
- All parent LPs
- All source materials
- Supplier and batch info

**And** tree is expandable/collapsible
**And** can click nodes to view details

**Prerequisites:** Epic 5 (LP Genealogy)

**Technical Notes:**
- Recursive query on lp_genealogy (reverse)
- API: POST /api/technical/tracing/backward

---

### Story 2.20: Recall Simulation

As a **QC Manager**,
I want to simulate a recall,
So that I can quickly identify affected inventory.

**Acceptance Criteria:**

**Given** the user navigates to /technical/tracing
**When** entering Batch Number or LP ID
**And** selecting "Recall Simulation"
**Then** system performs both forward and backward trace
**And** shows summary:
- Total affected LPs
- Estimated quantity
- Locations
- Shipped to customers (if applicable)
- Cost estimation

**And** can export to PDF, FDA JSON/XML

**Prerequisites:** Stories 2.18, 2.19

**Technical Notes:**
- Performance target: < 30 seconds
- Export formats for regulatory compliance
- API: POST /api/technical/tracing/recall

---

### Story 2.21: Genealogy Tree View

As a **QC Manager**,
I want an interactive visual tree of LP relationships,
So that I can explore genealogy easily.

**Acceptance Criteria:**

**Given** trace results are displayed
**Then** show interactive tree diagram:
- Nodes show: LP ID, Product, Qty, Batch, Expiry, Location
- Color by status (green=available, blue=consumed, gray=shipped)
- Expand/collapse nodes
- Zoom in/out
- Click node for LP details

**Prerequisites:** Stories 2.18-2.20

**Technical Notes:**
- Use D3.js or react-flow for visualization
- Lazy load deep nodes for performance

---

### Story 2.22: Technical Settings Configuration

As an **Admin**,
I want to configure Technical module settings,
So that product and BOM behavior matches our needs.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/technical
**Then** can configure:
- Product field toggles (which fields visible/mandatory)
- Max BOM versions (default: unlimited)
- Use conditional flags (toggle)
- Conditional flags list (add custom)

**Prerequisites:** Epic 1

**Technical Notes:**
- technical_settings table
- API: GET/PUT /api/technical/settings

---

### Story 2.23: Grouped Product Dashboard

As a **Technical user**,
I want to see products organized by categories,
So that I can quickly find what I need.

**Acceptance Criteria:**

**Given** the user navigates to /technical/products
**When** selecting "Dashboard View"
**Then** products are grouped into 3 categories:
- Raw Materials (RM)
- Work in Progress (WIP, FG in process)
- Finished Goods (FG)

**And** each group shows:
- Count of products
- Quick filters
- Recent changes

**Prerequisites:** Story 2.1

**Technical Notes:**
- Reference: ux-design-technical-module.md (Grouped Dashboard)
- Configurable groupings

---

### Story 2.24: Allergen Matrix Visualization

As a **Technical user**,
I want to see an allergen matrix for all products,
So that I can quickly identify cross-contamination risks.

**Acceptance Criteria:**

**Given** the user navigates to /technical/products (Allergen Matrix view)
**Then** a matrix is displayed:
- Rows: Products
- Columns: Allergens (14 EU + custom)
- Cells: Contains (red), May Contain (yellow), None (green)

**And** can filter by product type, category
**And** can sort by allergen count
**And** can export to Excel

**Prerequisites:** Story 2.4

**Technical Notes:**
- Reference: ux-design-technical-module.md (Allergen Matrix)
- Performance: paginate for large catalogs

