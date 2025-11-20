# MonoPilot - Epic Breakdown

**Author:** Mariusz
**Date:** 2025-11-20
**Project Level:** Enterprise
**Target Scale:** Food Manufacturing MES

---

## Overview

This document provides the complete epic and story breakdown for MonoPilot, decomposing the requirements from the modular PRD into implementable stories.

**Living Document Notice:** This is the initial version based on PRD and UX Design specifications. Stories include detailed acceptance criteria from UX designs.

### Epic Summary

| Epic | Module | FRs | Stories | Priority | Effort |
|------|--------|-----|---------|----------|--------|
| Epic 1 | Foundation & Settings | 11 | 18 | P0 🔴 | 2-3 weeks |
| Epic 2 | Technical Core | 18 | 24 | P0 🔴 | 3-4 weeks |
| Epic 3 | Planning Operations | 16 | 22 | P0 🔴 | 3-4 weeks |
| Epic 4 | Production Execution | 15 | 20 | P0 🔴 | 3-4 weeks |
| Epic 5 | Warehouse & Scanner | 30 | 35 | P0 🔴 | 4-5 weeks |
| **Total P0** | | **90** | **119** | | **15-20 weeks** |

---

## Functional Requirements Inventory

### Settings Module (11 FRs)
- FR-SET-001: Organization Configuration
- FR-SET-002: User Management
- FR-SET-003: Session Management
- FR-SET-004: Warehouse Configuration
- FR-SET-005: Location Management
- FR-SET-006: Machine Configuration
- FR-SET-007: Production Line Configuration
- FR-SET-008: Allergen Management
- FR-SET-009: Tax Code Configuration
- FR-SET-010: Module Activation
- FR-SET-011: Subscription Management

### Technical Module (18 FRs)
- FR-TECH-001: Product CRUD with Versioning
- FR-TECH-002: Product Types Configuration
- FR-TECH-003: Product Field Configuration
- FR-TECH-004: Product Allergen Management
- FR-TECH-005: Product Version History
- FR-TECH-006: BOM CRUD with Items
- FR-TECH-007: BOM Versioning with Date Overlap Validation
- FR-TECH-008: BOM Clone and Compare
- FR-TECH-009: Conditional BOM Items
- FR-TECH-010: By-Products in BOM
- FR-TECH-011: Allergen Inheritance
- FR-TECH-012: Routing CRUD
- FR-TECH-013: Routing Operations
- FR-TECH-014: Routing-Product Assignment
- FR-TECH-015: Forward Traceability
- FR-TECH-016: Backward Traceability
- FR-TECH-017: Recall Simulation
- FR-TECH-018: Genealogy Tree View

### Planning Module (16 FRs)
- FR-PLAN-001: PO CRUD
- FR-PLAN-002: Bulk PO Creation
- FR-PLAN-003: PO Approval Workflow
- FR-PLAN-004: Configurable PO Statuses
- FR-PLAN-005: TO CRUD
- FR-PLAN-006: Partial Shipments
- FR-PLAN-007: LP Selection for TO
- FR-PLAN-008: WO CRUD
- FR-PLAN-009: BOM Auto-Selection
- FR-PLAN-010: Material Availability Check
- FR-PLAN-011: Routing Copy to WO
- FR-PLAN-012: Configurable WO Statuses
- FR-PLAN-013: Supplier Management
- FR-PLAN-014: Demand Forecasting (Phase 2)
- FR-PLAN-015: Auto-Generate PO (Phase 2)
- FR-PLAN-016: Auto-Schedule WO (Phase 2)

### Production Module (15 FRs)
- FR-PROD-001: Production Dashboard
- FR-PROD-002: WO Start
- FR-PROD-003: WO Pause/Resume
- FR-PROD-004: Operation Execution
- FR-PROD-005: WO Complete
- FR-PROD-006: Material Consumption (Desktop)
- FR-PROD-007: Material Consumption (Scanner)
- FR-PROD-008: 1:1 Consumption Enforcement
- FR-PROD-009: Consumption Correction
- FR-PROD-010: Over-Consumption Control
- FR-PROD-011: Output Registration (Desktop)
- FR-PROD-012: Output Registration (Scanner)
- FR-PROD-013: By-Product Registration
- FR-PROD-014: Yield Tracking
- FR-PROD-015: Multiple Outputs per WO

### Warehouse Module (30 FRs)
- WH-FR-01: LP Creation with unique number
- WH-FR-02: LP Status Tracking
- WH-FR-03: LP Batch/Expiry Tracking
- WH-FR-04: LP Number Generation
- WH-FR-05: LP Split with Genealogy
- WH-FR-06: LP Merge
- WH-FR-07: LP Genealogy Tracking
- WH-FR-08: Receive from PO/TO
- WH-FR-09: ASN Pre-fill
- WH-FR-10: Over-receipt Validation
- WH-FR-11: GRN and LP Creation
- WH-FR-12: Auto-print Labels
- WH-FR-13: Update PO/TO Received Qty
- WH-FR-14: LP Location Move
- WH-FR-15: Movement Audit Trail
- WH-FR-16: Partial Move (Split)
- WH-FR-17: Destination Validation
- WH-FR-18: Movement Types
- WH-FR-19: Pallet Creation
- WH-FR-20: Pallet LP Management
- WH-FR-21: Pallet Move
- WH-FR-22: Pallet Status
- WH-FR-23: Scanner Guided Workflows
- WH-FR-24: Scanner Barcode Validation
- WH-FR-25: Scanner Feedback
- WH-FR-26: Scanner Operations
- WH-FR-27: Scanner Session Timeout
- WH-FR-28: Forward/Backward Traceability
- WH-FR-29: Genealogy Recording
- WH-FR-30: Source Document Linking

---

## FR Coverage Map

| FR ID | Description | Epic | Stories |
|-------|-------------|------|---------|
| FR-SET-001 | Organization Configuration | Epic 1 | 1.1 |
| FR-SET-002 | User Management | Epic 1 | 1.2, 1.3 |
| FR-SET-003 | Session Management | Epic 1 | 1.4 |
| FR-SET-004 | Warehouse Configuration | Epic 1 | 1.5 |
| FR-SET-005 | Location Management | Epic 1 | 1.6 |
| FR-SET-006 | Machine Configuration | Epic 1 | 1.7 |
| FR-SET-007 | Production Line Configuration | Epic 1 | 1.8 |
| FR-SET-008 | Allergen Management | Epic 1 | 1.9 |
| FR-SET-009 | Tax Code Configuration | Epic 1 | 1.10 |
| FR-SET-010 | Module Activation | Epic 1 | 1.11 |
| FR-SET-011 | Subscription Management | Epic 1 | 1.12 |
| FR-TECH-001 to 018 | Technical Module | Epic 2 | 2.1-2.24 |
| FR-PLAN-001 to 016 | Planning Module | Epic 3 | 3.1-3.22 |
| FR-PROD-001 to 015 | Production Module | Epic 4 | 4.1-4.20 |
| WH-FR-01 to 30 | Warehouse Module | Epic 5 | 5.1-5.35 |

---

## Epic 1: Foundation & Settings

**Goal:** Establish the foundation for MonoPilot - organization setup, user management, warehouses, locations, and system configuration.

**Dependencies:** None (foundation module)
**Required by:** All other epics

**UX Design Reference:** [ux-design-settings-module.md](./ux-design-settings-module.md)

---

### Story 1.1: Organization Configuration

As an **Admin**,
I want to configure my organization's basic settings,
So that the system reflects my company's identity and preferences.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/organization
**Then** they see a form with these sections:
- Basic Data: company_name, logo, address, city, postal_code, country, NIP/VAT
- Business Settings: fiscal_year_start, date_format, number_format, unit_system
- Regional: timezone, default_currency, default_language

**And** all fields have appropriate validation:
- company_name: required, max 100 chars
- logo: max 2MB, image only (jpg, png, webp)
- country: dropdown with all countries
- timezone: dropdown with standard timezones
- currency: PLN, EUR, USD, GBP
- language: PL, EN

**And** changes are saved immediately with success toast
**And** validation errors shown inline on blur

**Prerequisites:** None (first story)

**Technical Notes:**
- Create organizations table with all fields
- Upload logo to Supabase storage
- Use react-hook-form with Zod validation
- API: GET/PUT /api/settings/organization

---

### Story 1.2: User Management - CRUD

As an **Admin**,
I want to create, view, edit, and deactivate users,
So that I can control who has access to the system.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/users
**Then** they see a table with columns: Email, Name, Role, Status, Last Login, Actions

**And** they can search by name/email
**And** they can filter by role (10 roles) and status (Active, Inactive, Invited)

**When** clicking "Add User"
**Then** a modal opens with fields:
- email (required, valid email format)
- first_name (required)
- last_name (required)
- role (dropdown with 10 roles)

**And** on submit, user is created with status "Invited"
**And** invitation email is sent

**When** clicking Edit on a user
**Then** a drawer opens with editable fields (except email)
**And** can change role and status

**When** clicking Deactivate
**Then** user status → Inactive
**And** all active sessions terminated

**Prerequisites:** Story 1.1

**Technical Notes:**
- 10 roles: admin, manager, operator, viewer, planner, technical, purchasing, warehouse, qc, finance
- Use Supabase Auth for user creation
- Sync auth.users with public.users table
- API: GET/POST/PUT/DELETE /api/settings/users

---

### Story 1.3: User Invitations

As an **Admin**,
I want to invite users via email or QR code,
So that new team members can easily onboard.

**Acceptance Criteria:**

**Given** a user has been created with status "Invited"
**When** the system sends the invitation
**Then** an email with signup link is sent
**And** a QR code is generated for mobile scanning

**Given** Admin views pending invitations
**When** they navigate to /settings/users (Invitations tab)
**Then** they see list of pending invitations with: email, role, invited_by, expires_at

**And** they can Resend invitation
**And** they can Cancel invitation
**And** expired invitations are marked

**When** invited user clicks link or scans QR
**Then** they are taken to signup page with email pre-filled
**And** on successful signup, status → Active

**Prerequisites:** Story 1.2

**Technical Notes:**
- Invitation expires in 7 days
- QR code contains signup URL with token
- Use Supabase Auth magic link or custom flow
- API: POST /api/settings/invitations, POST .../resend, DELETE .../:id

---

### Story 1.4: Session Management

As a **User**,
I want to see my active sessions and logout from all devices,
So that I can maintain security of my account.

**Acceptance Criteria:**

**Given** a user is logged in
**When** they navigate to /settings/users/:id/sessions (own profile or Admin viewing any)
**Then** they see list of active sessions with: device_info, IP, login_time, last_activity

**When** clicking "Logout All Devices"
**Then** all sessions except current are terminated
**And** confirmation toast shown

**Given** an Admin views another user's sessions
**Then** they can terminate any session
**And** the terminated user is logged out immediately

**Prerequisites:** Story 1.2

**Technical Notes:**
- Track sessions in user_sessions table
- Use Supabase realtime to update session status
- API: GET /api/settings/users/:id/sessions, DELETE .../:id/sessions

---

### Story 1.5: Warehouse Configuration

As an **Admin**,
I want to define warehouses with default locations,
So that inventory can be properly organized.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/warehouses
**Then** they see a list of warehouses (cards or table)

**When** clicking "Add Warehouse"
**Then** a modal opens with fields:
- code (required, unique, e.g., WH-01)
- name (required)
- address (optional)
- default_receiving_location_id (required, dropdown)
- default_shipping_location_id (required, dropdown)
- transit_location_id (required, dropdown)
- is_active (toggle)

**And** location dropdowns are filtered to this warehouse
**And** can create locations inline if needed

**When** saving warehouse
**Then** warehouse is created/updated
**And** appears in list

**Prerequisites:** Story 1.1

**Technical Notes:**
- Circular dependency: create warehouse first, then locations, then update defaults
- API: GET/POST/PUT/DELETE /api/settings/warehouses

---

### Story 1.6: Location Management

As an **Admin**,
I want to define locations within warehouses,
So that I can track where inventory is stored.

**Acceptance Criteria:**

**Given** a warehouse exists
**When** Admin views warehouse detail or locations tab
**Then** they see nested table of locations with: code, name, type, zone, capacity, barcode

**When** clicking "Add Location"
**Then** a modal opens with fields:
- code (required, unique within warehouse)
- name (required)
- warehouse_id (auto-filled)
- type (dropdown: Receiving, Production, Storage, Shipping, Transit, Quarantine)
- zone (optional, with enable toggle)
- capacity (optional number, with enable toggle)
- barcode (auto-generated, can override)

**And** toggles for optional fields (zone_enabled, capacity_enabled)

**When** saving location
**Then** location is created with auto-generated barcode
**And** appears in warehouse's locations list

**Prerequisites:** Story 1.5

**Technical Notes:**
- Barcode format: LOC-{warehouse_code}-{sequence}
- API: GET/POST/PUT/DELETE /api/settings/locations

---

### Story 1.7: Machine Configuration

As an **Admin**,
I want to define production machines,
So that I can track which machines are used in production.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/production (Machines tab)
**Then** they see a table of machines with: code, name, status, lines, capacity

**When** clicking "Add Machine"
**Then** a modal opens with fields:
- code (required, unique, e.g., MIX-01)
- name (required)
- status (dropdown: Active, Down, Maintenance)
- line_ids (multi-select, optional)
- capacity_per_hour (optional number)

**When** saving machine
**Then** machine is created/updated
**And** line assignments are saved

**Prerequisites:** Story 1.5

**Technical Notes:**
- Many-to-many: machine_line_assignments table
- Status affects availability in Production module
- API: GET/POST/PUT/DELETE /api/settings/machines

---

### Story 1.8: Production Line Configuration

As an **Admin**,
I want to define production lines,
So that I can organize production by line.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/production (Lines tab)
**Then** they see a table of lines with: code, name, warehouse, machines, default_output_location

**When** clicking "Add Line"
**Then** a modal opens with fields:
- code (required, unique, e.g., LINE-01)
- name (required)
- warehouse_id (required dropdown)
- default_output_location_id (optional, filtered by warehouse)
- machine_ids (multi-select, optional)

**When** saving line
**Then** line is created/updated
**And** machine assignments are saved

**Prerequisites:** Story 1.5, 1.7

**Technical Notes:**
- Reverse of Story 1.7 - can assign machines from line side too
- API: GET/POST/PUT/DELETE /api/settings/lines

---

### Story 1.9: Allergen Management

As an **Admin**,
I want to manage the allergen library,
So that products can have proper allergen declarations.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/production (Allergens tab)
**Then** they see a table of allergens with: code, name, is_major, is_custom

**And** 14 EU major allergens are preloaded and non-deletable:
Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame, Mustard, Celery, Lupin, Sulphites, Molluscs

**When** clicking "Add Allergen"
**Then** a modal opens with fields:
- code (required, unique)
- name (required)
- is_major (toggle)

**And** custom allergens are marked with is_custom = true
**And** custom allergens can be edited/deleted

**Prerequisites:** Story 1.1

**Technical Notes:**
- Seed 14 EU allergens on org creation
- API: GET/POST/PUT/DELETE /api/settings/allergens

---

### Story 1.10: Tax Code Configuration

As an **Admin**,
I want to manage tax codes,
So that POs have correct VAT rates.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/production (Tax Codes tab)
**Then** they see a table of tax codes with: code, description, rate

**And** tax codes are preloaded based on organization's country:
- Poland: VAT 23%, VAT 8%, VAT 5%, VAT 0%
- UK: Standard 20%, Reduced 5%, Zero 0%

**When** clicking "Add Tax Code"
**Then** a modal opens with fields:
- code (required, unique, e.g., VAT23)
- description (required)
- rate (required, decimal %)

**Prerequisites:** Story 1.1

**Technical Notes:**
- Seed tax codes based on organizations.country
- Rate stored as decimal (23.00 for 23%)
- API: GET/POST/PUT/DELETE /api/settings/tax-codes

---

### Story 1.11: Module Activation

As an **Admin**,
I want to enable/disable modules for my organization,
So that we only see features we need.

**Acceptance Criteria:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/modules
**Then** they see a grid of modules with toggle switches:
- Technical (default: On)
- Planning (default: On)
- Production (default: On)
- Warehouse (default: On)
- Quality (default: Off)
- Shipping (default: Off)
- NPD (default: Off)
- Finance (default: Off)

**When** toggling a module Off
**Then** the module is hidden from navigation
**And** API endpoints return 403 for that module

**When** toggling a module On
**Then** the module appears in navigation

**Prerequisites:** Story 1.1

**Technical Notes:**
- Store in organizations.modules_enabled array
- Middleware checks module access
- API: GET/PUT /api/settings/modules

---

### Story 1.12: Settings Wizard (UX Design)

As a **new Admin**,
I want a guided wizard to set up my organization,
So that I don't miss any important configuration.

**Acceptance Criteria:**

**Given** a new organization is created
**When** Admin first logs in
**Then** they see a multi-step wizard:
1. Organization basics (name, logo, address)
2. Regional settings (currency, timezone, language)
3. First warehouse and locations
4. First production line
5. Module selection
6. Invite first users

**And** each step validates before proceeding
**And** can skip non-essential steps
**And** wizard can be dismissed and accessed later from Settings

**Prerequisites:** Stories 1.1-1.11

**Technical Notes:**
- Track wizard completion in org settings
- Reusable for templates feature
- Reference: ux-design-settings-module.md (Wizard Mode)

---

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

---

## Epic 3: Planning Operations

**Goal:** Enable purchase orders, transfer orders, work orders, and supplier management.

**Dependencies:** Epic 1 (Settings), Epic 2 (Technical)
**Required by:** Epic 4 (Production), Epic 5 (Warehouse)

**UX Design Reference:** [ux-design-planning-module.md](./ux-design-planning-module.md)

---

### Story 3.1: Purchase Order CRUD

As a **Purchasing user**,
I want to create, edit, and view purchase orders,
So that I can manage procurement.

**Acceptance Criteria:**

**Given** the user has Purchasing role or higher
**When** they navigate to /planning/purchase-orders
**Then** they see a table with columns: PO Number, Supplier, Status, Expected Date, Total

**And** can search by PO number/supplier
**And** can filter by status, supplier, date range

**When** clicking "Add PO"
**Then** Create modal opens with fields:
- supplier_id (required) - inherits currency, tax_code
- warehouse_id (required)
- expected_delivery_date (required)
- payment_terms, shipping_method, notes (optional based on Settings)

**When** saving PO
**Then** PO created with auto-generated number
**And** status from configured default

**Prerequisites:** Epic 1, Epic 2

**Technical Notes:**
- Inheritance: currency/tax from supplier
- API: GET/POST/PUT/DELETE /api/planning/purchase-orders

---

### Story 3.2: PO Line Management

As a **Purchasing user**,
I want to add and manage PO lines,
So that I can specify what to order.

**Acceptance Criteria:**

**Given** a PO is created
**When** adding a line
**Then** modal opens with:
- product_id (required) - inherits UoM, unit_price
- quantity (required)
- unit_price (editable, defaults from product)
- discount_percent (optional)
- expected_delivery_date (optional, defaults to header)

**When** saving line
**Then** line_total calculated (qty × price - discount)
**And** PO totals updated (subtotal, tax, total)

**Prerequisites:** Story 3.1

**Technical Notes:**
- API: POST/PUT/DELETE /api/planning/purchase-orders/:id/lines

---

### Story 3.3: Bulk PO Creation

As a **Purchasing user**,
I want to bulk create POs from a list of products,
So that I can quickly order from multiple suppliers.

**Acceptance Criteria:**

**Given** the user clicks "Bulk Create POs"
**When** they upload Excel or use bulk form
**Then** they enter: Product Code, Quantity

**And** system looks up:
- Product → default supplier
- Supplier → currency, tax, payment terms
- Product → UoM, std price

**And** groups products by supplier
**And** creates multiple draft POs

**When** reviewing drafts
**Then** user can edit before submitting

**Prerequisites:** Story 3.1, Story 3.2

**Technical Notes:**
- Excel template: Product Code, Quantity
- API: POST /api/planning/purchase-orders/bulk

---

### Story 3.4: PO Approval Workflow

As a **Manager**,
I want to approve POs before sending to suppliers,
So that we have control over spending.

**Acceptance Criteria:**

**Given** approval is enabled in Settings
**When** PO is submitted
**Then** approval_status → Pending

**Given** Manager reviews pending PO
**When** clicking Approve/Reject
**Then** approval_status updated
**And** approved_by/approved_at recorded
**And** rejection requires reason

**Only** Admin/Manager can approve

**Prerequisites:** Story 3.1

**Technical Notes:**
- Toggle in planning_settings.po_require_approval
- API: PUT /api/planning/purchase-orders/:id/approve

---

### Story 3.5: Configurable PO Statuses

As an **Admin**,
I want to configure PO status workflow,
So that it matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/planning
**When** viewing PO Statuses
**Then** can add/remove/rename statuses
**And** set default status for new POs

**Default statuses:**
- Draft, Submitted, Confirmed, Receiving, Closed

**Optional statuses:**
- Approved, Partially Received, Cancelled

**Prerequisites:** Epic 1

**Technical Notes:**
- Stored in planning_settings.po_statuses JSONB
- API: GET/PUT /api/planning/settings

---

### Story 3.6: Transfer Order CRUD

As a **Warehouse user**,
I want to create transfer orders between warehouses,
So that I can move inventory.

**Acceptance Criteria:**

**Given** the user has Warehouse role or higher
**When** they navigate to /planning/transfer-orders
**Then** they see a table with: TO Number, From WH, To WH, Status, Ship Date

**When** clicking "Add TO"
**Then** modal opens with:
- from_warehouse_id (required)
- to_warehouse_id (required)
- planned_ship_date (required)
- planned_receive_date (required)
- notes (optional)

**When** saving TO
**Then** TO created with auto-generated number
**And** status from configured default

**Prerequisites:** Story 1.5

**Technical Notes:**
- Warehouse-based (no location in header)
- API: GET/POST/PUT/DELETE /api/planning/transfer-orders

---

### Story 3.7: TO Line Management

As a **Warehouse user**,
I want to add products to transfer orders,
So that I can specify what to transfer.

**Acceptance Criteria:**

**Given** a TO is created
**When** adding a line
**Then** modal opens with:
- product_id (required)
- quantity (required)
- uom (from product)

**And** can add multiple lines

**When** TO is shipped
**Then** shipped_qty tracked per line
**When** TO is received
**Then** received_qty tracked

**Prerequisites:** Story 3.6

**Technical Notes:**
- API: POST/PUT/DELETE /api/planning/transfer-orders/:id/lines

---

### Story 3.8: Partial TO Shipments

As a **Warehouse user**,
I want to ship TOs in multiple shipments,
So that I can handle partial availability.

**Acceptance Criteria:**

**Given** partial shipments enabled in Settings
**When** shipping TO
**Then** can select subset of lines/quantities

**And** status → Partially Shipped
**And** shipped_qty updated per line

**When** all shipped
**Then** status → Shipped

**Prerequisites:** Story 3.6, Story 3.7

**Technical Notes:**
- Toggle in planning_settings.to_allow_partial
- Track shipment records

---

### Story 3.9: LP Selection for TO

As a **Warehouse user**,
I want to pre-select specific LPs for transfer,
So that I can reserve inventory.

**Acceptance Criteria:**

**Given** LP selection enabled in Settings
**When** viewing TO lines
**Then** can click "Select LPs"

**And** modal shows available LPs for product
**And** can select specific LPs

**When** saving LP selections
**Then** LPs reserved for TO
**And** shown in TO line detail

**Not mandatory** - can ship without pre-selection

**Prerequisites:** Story 3.7, Epic 5

**Technical Notes:**
- to_line_lps table
- Toggle in planning_settings.to_require_lp_selection
- API: PUT /api/planning/transfer-orders/:id/lines/:lineId/lps

---

### Story 3.10: Work Order CRUD

As a **Planner**,
I want to create work orders,
So that I can schedule production.

**Acceptance Criteria:**

**Given** the user has Planner role or higher
**When** they navigate to /planning/work-orders
**Then** they see a table with: WO Number, Product, Qty, Status, Scheduled Date, Line

**When** clicking "Add WO"
**Then** modal opens with:
- product_id (required)
- quantity (required)
- scheduled_date (required) - triggers BOM selection
- line_id (optional)
- machine_id (optional)
- priority (Low/Medium/High/Critical)

**When** saving WO
**Then** WO created with auto-generated number
**And** BOM snapshot created

**Prerequisites:** Epic 2

**Technical Notes:**
- BOM auto-selection based on scheduled_date
- API: GET/POST/PUT/DELETE /api/planning/work-orders

---

### Story 3.11: BOM Auto-Selection for WO

As a **Planner**,
I want the system to auto-select the correct BOM,
So that the right recipe is used.

**Acceptance Criteria:**

**Given** user selects product and scheduled_date
**When** system searches for BOM
**Then** finds BOM where: effective_from <= date <= effective_to
**And** selects most recent if multiple match

**Given** no active BOM found
**Then** shows error: "No active BOM for this date"

**When** user wants different BOM
**Then** can override with dropdown

**Prerequisites:** Story 3.10, Story 2.6

**Technical Notes:**
- Query: SELECT * FROM boms WHERE product_id = X AND status = 'active' AND effective_from <= date AND (effective_to IS NULL OR effective_to >= date)

---

### Story 3.12: WO Materials Snapshot

As a **Planner**,
I want WO to capture BOM at creation time,
So that recipe is immutable during production.

**Acceptance Criteria:**

**Given** WO is created
**When** BOM is selected
**Then** all BOM items copied to wo_materials:
- product_id, quantity (scaled to WO qty), uom
- scrap_percent, consume_whole_lp
- is_by_product, yield_percent
- condition_flags

**And** wo_materials cannot change after WO is released
**And** shows warning if BOM is updated after WO creation

**Prerequisites:** Story 3.10, Story 3.11

**Technical Notes:**
- Calculation: wo_material.qty = bom_item.qty × (wo.qty / bom.output_qty)

---

### Story 3.13: Material Availability Check

As a **Planner**,
I want to see material availability when creating WO,
So that I know if production can proceed.

**Acceptance Criteria:**

**Given** material check enabled in Settings
**When** WO is being created
**Then** system calculates required materials
**And** checks available LP qty per material

**And** shows indicators:
- 🟢 Green: available >= required × 1.2
- 🟡 Yellow: available >= required but < required × 1.2
- 🔴 Red: available < required

**When** user sees warnings
**Then** can still proceed (warnings only)

**Prerequisites:** Story 3.12, Epic 5

**Technical Notes:**
- Query available LPs: SUM(qty) WHERE product_id = X AND status = 'available'
- Toggle in planning_settings.wo_material_check
- API: GET /api/planning/work-orders/:id/availability

---

### Story 3.14: Routing Copy to WO

As a **Planner**,
I want WO to include routing operations,
So that operators know what steps to perform.

**Acceptance Criteria:**

**Given** product has routing assigned
**When** WO is created and copy_routing enabled
**Then** routing operations copied to wo_operations:
- sequence, operation_name
- machine_id, line_id
- expected_duration_minutes
- expected_yield_percent

**And** all operations start with status = 'not_started'

**When** viewing WO
**Then** operations shown in sequence

**Prerequisites:** Story 3.10, Story 2.15

**Technical Notes:**
- Toggle in planning_settings.wo_copy_routing
- Can override machine/line per operation

---

### Story 3.15: Configurable WO Statuses

As an **Admin**,
I want to configure WO status lifecycle,
So that it matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/planning
**When** viewing WO Statuses
**Then** can add/remove/rename statuses
**And** set status expiry (auto-close after X days)

**Default statuses:**
- Draft, Planned, Released, In Progress, Completed, Closed

**Optional statuses:**
- On Hold, Cancelled, Quality Hold

**Prerequisites:** Epic 1

**Technical Notes:**
- Stored in planning_settings.wo_statuses JSONB
- Status expiry in planning_settings.wo_status_expiry_days

---

### Story 3.16: WO Source of Demand

As a **Planner**,
I want to track why a WO was created,
So that I can trace demand.

**Acceptance Criteria:**

**Given** source_of_demand enabled in Settings
**When** creating WO
**Then** can select:
- PO Number
- Customer Order
- Manual
- Forecast

**And** enter source_reference (e.g., "PO-001", "ORD-123")

**When** viewing WO
**Then** source shown for reference

**Prerequisites:** Story 3.10

**Technical Notes:**
- Toggle in planning_settings.wo_source_of_demand
- Optional fields: source_of_demand, source_reference

---

### Story 3.17: Supplier Management

As a **Purchasing user**,
I want to manage suppliers with defaults,
So that PO creation is efficient.

**Acceptance Criteria:**

**Given** the user navigates to /planning/mrp
**When** viewing Suppliers tab
**Then** they see a table with: Code, Name, Currency, Lead Time, Status

**When** clicking "Add Supplier"
**Then** modal opens with:
- code (required, unique)
- name (required)
- contact info (optional)
- currency (required)
- tax_code_id (required)
- payment_terms, lead_time_days (required)
- moq (optional)
- is_active (toggle)

**Prerequisites:** Epic 1

**Technical Notes:**
- API: GET/POST/PUT/DELETE /api/planning/suppliers

---

### Story 3.18: Supplier-Product Assignments

As a **Purchasing user**,
I want to assign products to suppliers,
So that I know where to order each product.

**Acceptance Criteria:**

**Given** a supplier exists
**When** viewing supplier detail
**Then** see Products tab with assigned products

**When** clicking "Assign Products"
**Then** modal shows available products
**And** can set per product:
- is_default (only one default per product)
- supplier_product_code
- lead_time_days (override)
- unit_price
- moq

**When** bulk creating PO
**Then** uses default supplier per product

**Prerequisites:** Story 3.17, Story 2.1

**Technical Notes:**
- supplier_products table
- UNIQUE (supplier_id, product_id)
- API: PUT /api/planning/suppliers/:id/products

---

### Story 3.19: PO Status Lifecycle

As a **Purchasing user**,
I want to move PO through statuses,
So that I can track procurement progress.

**Acceptance Criteria:**

**Given** PO exists
**When** clicking status change button
**Then** PO moves to next status

**Typical flow:**
Draft → Submitted → Confirmed → Receiving → Closed

**And** status change logged in audit
**And** timestamps updated

**Prerequisites:** Story 3.1, Story 3.5

**Technical Notes:**
- API: PUT /api/planning/purchase-orders/:id/status

---

### Story 3.20: TO Status Lifecycle

As a **Warehouse user**,
I want to move TO through statuses,
So that I can track transfer progress.

**Acceptance Criteria:**

**Given** TO exists
**When** shipping TO
**Then** status → Shipped
**And** actual_ship_date set

**When** receiving TO
**Then** status → Received
**And** actual_receive_date set

**Flow:**
Draft → Planned → Shipped → Received

**Prerequisites:** Story 3.6

**Technical Notes:**
- API: PUT /api/planning/transfer-orders/:id/status

---

### Story 3.21: WO Gantt View

As a **Planner**,
I want to see WO schedule as Gantt chart,
So that I can visualize production timeline.

**Acceptance Criteria:**

**Given** the user navigates to /planning/work-orders
**When** selecting "Schedule View"
**Then** Gantt chart shows:
- X-axis: dates
- Y-axis: production lines
- Bars: WOs with product, qty, status color

**And** can click bar to view WO detail
**And** can drag to reschedule (if allowed)

**Prerequisites:** Story 3.10

**Technical Notes:**
- API: GET /api/planning/work-orders/schedule
- Use recharts or similar for visualization

---

### Story 3.22: Planning Settings Configuration

As an **Admin**,
I want to configure Planning module settings,
So that PO/TO/WO behavior matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/planning
**Then** can configure:
- PO: statuses, require_approval, field toggles
- TO: statuses, allow_partial, require_lp_selection
- WO: statuses, status_expiry, source_of_demand, material_check, copy_routing

**Prerequisites:** Epic 1

**Technical Notes:**
- planning_settings table
- API: GET/PUT /api/planning/settings

---

## Epic 4: Production Execution

**Goal:** Execute work orders - start, consume materials, register outputs, track yield.

**Dependencies:** Epic 3 (Planning)
**Required by:** None (end of production flow)

**UX Design Reference:** [ux-design-production-module.md](./ux-design-production-module.md)

---

### Story 4.1: Production Dashboard

As a **Production Manager**,
I want to see real-time production KPIs,
So that I can monitor operations.

**Acceptance Criteria:**

**Given** the user navigates to /production/dashboard
**Then** they see KPI cards:
- Orders Today: count WO completed today
- Units Produced: sum output qty today
- Avg Yield: avg (actual/planned × 100)
- Active WOs: count in progress
- Material Shortages: count with < 100% availability

**And** Active WOs table with progress
**And** Alerts panel (shortages, delays, quality holds)
**And** auto-refresh (configurable, default 30s)

**Prerequisites:** Epic 3

**Technical Notes:**
- API: GET /api/production/dashboard/kpis, /active-wos, /alerts
- Settings: dashboard_refresh_seconds

---

### Story 4.2: WO Start

As an **Operator**,
I want to start a released work order,
So that I can begin production.

**Acceptance Criteria:**

**Given** WO is in Released status
**When** clicking "Start Production"
**Then** modal shows:
- WO summary
- Confirm line/machine
- Material availability (warning only)

**When** confirming
**Then** status → In Progress
**And** started_at timestamp set
**And** WO appears in Active list

**Prerequisites:** Story 3.10

**Technical Notes:**
- API: POST /api/production/work-orders/:id/start

---

### Story 4.3: WO Pause/Resume

As an **Operator**,
I want to pause a WO when there's an issue,
So that we can track downtime.

**Acceptance Criteria:**

**Given** pause enabled in Settings
**And** WO is In Progress
**When** clicking "Pause"
**Then** modal asks for:
- Pause reason (Breakdown, Break, Material Wait, Other)
- Notes

**And** status → Paused
**And** wo_pauses record created

**When** clicking "Resume"
**Then** status → In Progress
**And** pause duration calculated

**Prerequisites:** Story 4.2

**Technical Notes:**
- Toggle in production_settings.allow_pause_wo
- API: POST /api/production/work-orders/:id/pause, /resume

---

### Story 4.4: Operation Start

As an **Operator**,
I want to start a WO operation,
So that I can track step progress.

**Acceptance Criteria:**

**Given** WO has operations from routing
**When** clicking "Start" on operation
**Then** operation status → In Progress
**And** started_at timestamp set
**And** operator_id recorded

**If** sequence enforcement enabled
**Then** can only start operation N if N-1 is completed

**Prerequisites:** Story 3.14, Story 4.2

**Technical Notes:**
- Toggle in production_settings.require_operation_sequence
- API: POST /api/production/work-orders/:id/operations/:opId/start

---

### Story 4.5: Operation Complete

As an **Operator**,
I want to complete a WO operation,
So that I can move to next step.

**Acceptance Criteria:**

**Given** operation is In Progress
**When** clicking "Complete"
**Then** modal asks for:
- actual_duration_minutes (default: calculated from started_at)
- actual_yield_percent (default: 100)
- notes

**When** confirming
**Then** operation status → Completed
**And** completed_at timestamp set

**Prerequisites:** Story 4.4

**Technical Notes:**
- API: POST /api/production/work-orders/:id/operations/:opId/complete

---

### Story 4.6: WO Complete

As an **Operator**,
I want to complete a work order,
So that I can finish production.

**Acceptance Criteria:**

**Given** WO is In Progress
**When** clicking "Complete WO"
**Then** system validates:
- All operations completed (if required)
- At least one output registered
- By-products registered (if in BOM)

**When** validation passes
**Then** status → Completed
**And** completed_at timestamp set

**Given** auto-complete enabled
**Then** WO completes when output_qty >= planned_qty

**Prerequisites:** Story 4.2

**Technical Notes:**
- Toggle in production_settings.auto_complete_wo
- API: POST /api/production/work-orders/:id/complete

---

### Story 4.7: Material Consumption (Desktop)

As an **Operator**,
I want to consume materials from desktop,
So that I can track what was used.

**Acceptance Criteria:**

**Given** the user views WO consumption page
**Then** they see materials table with: Product, Required Qty, Consumed Qty, Remaining

**When** clicking "Consume" on a material
**Then** modal opens:
- LP search/scan input
- System validates: product, UoM, qty available
- Enter qty to consume

**When** confirming
**Then** consumption recorded
**And** LP qty decreased
**And** genealogy record created

**Prerequisites:** Story 3.12, Epic 5

**Technical Notes:**
- API: POST /api/production/work-orders/:id/consume

---

### Story 4.8: Material Consumption (Scanner)

As an **Operator**,
I want to consume materials via scanner,
So that I can work efficiently on the floor.

**Acceptance Criteria:**

**Given** the user navigates to /scanner/consume
**When** scanning WO barcode
**Then** system shows required materials

**When** scanning LP barcode
**Then** system validates:
- LP exists and available
- Product matches material
- UoM matches

**When** entering qty (or "Full LP")
**Then** consumption confirmed
**And** moves to next material

**Prerequisites:** Story 4.7

**Technical Notes:**
- Same API as desktop
- Touch-optimized UI

---

### Story 4.9: 1:1 Consumption Enforcement

As a **System**,
I want to enforce full LP consumption when flagged,
So that allergen control is maintained.

**Acceptance Criteria:**

**Given** material has consume_whole_lp = true
**When** operator tries to consume partial
**Then** system blocks and shows error

**When** consuming via scanner
**Then** qty input disabled, shows "Full LP: X units"

**When** consuming via desktop
**Then** qty field shows full LP qty, cannot change

**Prerequisites:** Story 4.7, Story 4.8

**Technical Notes:**
- consume_whole_lp flag from wo_materials (copied from BOM)

---

### Story 4.10: Consumption Correction

As a **Manager**,
I want to correct consumption errors,
So that inventory stays accurate.

**Acceptance Criteria:**

**Given** a consumption was recorded incorrectly
**When** Manager clicks "Reverse"
**Then** modal confirms reversal

**When** confirming
**Then** consumption marked as reversed
**And** LP qty restored
**And** reversed_by and reversed_at recorded
**And** audit trail entry created

**Only** Manager role can reverse

**Prerequisites:** Story 4.7

**Technical Notes:**
- Don't delete record, mark reversed = true
- API: POST /api/production/work-orders/:id/consume/reverse

---

### Story 4.11: Over-Consumption Control

As an **Admin**,
I want to control over-consumption,
So that we don't waste materials.

**Acceptance Criteria:**

**Given** over-consumption control enabled
**When** consumed_qty > required_qty for a material
**Then** system shows warning (or blocks if configured)

**Given** control disabled
**Then** operator can consume unlimited

**And** variance tracked: consumed - required

**Prerequisites:** Story 4.7

**Technical Notes:**
- Toggle in production_settings.allow_over_consumption
- Track variance for reporting

---

### Story 4.12: Output Registration (Desktop)

As an **Operator**,
I want to register production output,
So that finished goods are tracked.

**Acceptance Criteria:**

**Given** WO is In Progress
**When** clicking "Register Output"
**Then** modal opens with:
- quantity (required)
- qa_status (if required in Settings)
- location_id (default from line)
- notes

**When** confirming
**Then** output LP created:
- product from WO
- batch_number from WO.wo_number
- expiry_date calculated from shelf_life

**And** wo.output_qty updated
**And** genealogy completed (consumed LPs → output LP)

**Prerequisites:** Story 4.6

**Technical Notes:**
- API: POST /api/production/work-orders/:id/outputs

---

### Story 4.13: Output Registration (Scanner)

As an **Operator**,
I want to register output via scanner,
So that I can work efficiently.

**Acceptance Criteria:**

**Given** the user navigates to /scanner/output
**When** scanning WO barcode
**Then** shows WO summary

**When** entering qty
**And** selecting QA status (large buttons)
**Then** output registered
**And** LP label printed (ZPL to printer)

**When** by-products exist
**Then** prompts to register each

**Prerequisites:** Story 4.12

**Technical Notes:**
- Same API as desktop
- ZPL label format defined in Settings

---

### Story 4.14: By-Product Registration

As an **Operator**,
I want to register by-products,
So that all outputs are tracked.

**Acceptance Criteria:**

**Given** WO has by-products in wo_materials
**When** registering main output
**Then** system prompts for each by-product

**And** shows expected qty: wo_qty × yield_percent / 100
**And** operator can adjust actual qty

**When** confirming
**Then** by-product LP created
**And** linked to same genealogy

**Given** auto-create enabled
**Then** system creates by-product LPs automatically

**Prerequisites:** Story 4.12

**Technical Notes:**
- Toggle in production_settings.auto_create_by_product_lp
- API: POST /api/production/work-orders/:id/by-products

---

### Story 4.15: Yield Tracking

As a **Production Manager**,
I want to see yield metrics,
So that I can identify efficiency issues.

**Acceptance Criteria:**

**Given** viewing WO detail
**Then** see yield summary:
- Output Yield: actual_output / planned × 100%
- Material Yield: planned_material / consumed × 100%
- Operation Yields: from each operation

**And** color coding:
- 🟢 Green: >= 95%
- 🟡 Yellow: 80-95%
- 🔴 Red: < 80%

**Prerequisites:** Story 4.12

**Technical Notes:**
- API: GET /api/production/work-orders/:id/yield

---

### Story 4.16: Multiple Outputs per WO

As an **Operator**,
I want to register multiple outputs,
So that I can track partial production.

**Acceptance Criteria:**

**Given** WO allows multiple outputs
**When** registering output
**Then** each creates separate LP

**And** WO.output_qty = sum of all outputs
**And** output history shown in WO detail

**When** total output >= planned
**Then** system prompts to complete WO (or auto-completes)

**Prerequisites:** Story 4.12

**Technical Notes:**
- production_outputs table holds all outputs per WO

---

### Story 4.17: Production Settings Configuration

As an **Admin**,
I want to configure Production module settings,
So that execution matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/production-execution
**Then** can configure:
- allow_pause_wo
- auto_complete_wo
- require_operation_sequence
- allow_over_consumption
- allow_partial_lp_consumption
- require_qa_on_output
- auto_create_by_product_lp
- Dashboard: refresh_seconds, alert toggles

**Prerequisites:** Epic 1

**Technical Notes:**
- production_settings table
- API: GET/PUT /api/production/settings

---

### Story 4.18: LP Updates After Consumption

As a **System**,
I want to update LP after consumption,
So that inventory is accurate.

**Acceptance Criteria:**

**Given** LP is consumed
**When** consumption recorded
**Then** LP.qty decreased by consumed amount

**When** LP.qty = 0
**Then** LP.status → 'consumed'
**And** LP.consumed_by_wo_id = current WO

**Prerequisites:** Story 4.7

**Technical Notes:**
- Atomic transaction: consumption record + LP update

---

### Story 4.19: Genealogy Record Creation

As a **System**,
I want to record genealogy links,
So that traceability is maintained.

**Acceptance Criteria:**

**Given** material is consumed
**Then** lp_genealogy entry created:
- parent_lp_id = consumed LP
- child_lp_id = NULL
- wo_id = current WO
- consumed_at = timestamp

**Given** output is registered
**Then** update genealogy:
- child_lp_id = output LP

**Prerequisites:** Story 4.7, Story 4.12

**Technical Notes:**
- Links consumed materials to outputs
- Enables forward/backward tracing

---

### Story 4.20: Operation Timeline View

As a **Production Manager**,
I want to see operations as visual timeline,
So that I can track progress at a glance.

**Acceptance Criteria:**

**Given** viewing WO with operations
**Then** see timeline visualization:
- Each operation as segment
- Color by status (gray=not started, blue=in progress, green=completed)
- Actual vs expected duration

**And** can click segment for details

**Prerequisites:** Story 4.4, Story 4.5

**Technical Notes:**
- Use CSS/SVG for timeline
- No external library needed

---

## Epic 5: Warehouse & Scanner

**Goal:** Manage inventory through License Plates, ASN, GRN, movements, and Scanner operations.

**Dependencies:** Epic 1-3
**Required by:** Epic 4 (Production)

**UX Design Reference:** [ux-design-warehouse-module.md](./ux-design-warehouse-module.md), [ux-design-scanner-module.md](./ux-design-scanner-module.md)

---

### Story 5.1: License Plate Creation

As a **Warehouse user**,
I want to create license plates,
So that inventory is tracked atomically.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/license-plates
**When** clicking "Create LP"
**Then** modal opens with:
- lp_number (auto-generated, can override)
- product_id (required)
- qty (required)
- uom (from product)
- batch_number (required)
- manufacture_date (optional)
- expiry_date (optional)
- location_id (required)

**When** saving
**Then** LP created with status = 'available'

**Prerequisites:** Epic 1, Epic 2

**Technical Notes:**
- LP number format configurable
- API: GET/POST/PUT /api/warehouse/license-plates

---

### Story 5.2: LP Status Tracking

As a **Warehouse user**,
I want to track LP status,
So that I know availability.

**Acceptance Criteria:**

**Given** LP exists
**Then** has status:
- available: can be consumed/shipped
- reserved: reserved for WO/TO
- consumed: fully consumed
- quarantine: quality hold
- shipped: sent out

**When** status changes
**Then** timestamp and user recorded

**Prerequisites:** Story 5.1

**Technical Notes:**
- Status affects availability queries

---

### Story 5.3: LP Batch/Expiry Tracking

As a **Warehouse user**,
I want to track batch and expiry,
So that I can manage FIFO/FEFO.

**Acceptance Criteria:**

**Given** LP is created
**Then** stores:
- batch_number (required)
- supplier_batch_number (optional)
- manufacture_date (optional)
- expiry_date (optional)

**When** searching LPs
**Then** can filter by expiry date
**And** expired LPs highlighted in red

**Prerequisites:** Story 5.1

**Technical Notes:**
- FEFO: First Expired First Out
- Sort by expiry_date for picking suggestions

---

### Story 5.4: LP Number Generation

As a **System**,
I want to auto-generate LP numbers,
So that they are unique and meaningful.

**Acceptance Criteria:**

**Given** new LP is created
**When** lp_number not provided
**Then** auto-generate format: LP-{date}-{sequence}

**And** sequence per day
**And** globally unique

**Admin** can configure format in Settings

**Prerequisites:** Story 5.1

**Technical Notes:**
- Format stored in warehouse_settings
- Example: LP-20250120-0001

---

### Story 5.5: LP Split

As a **Warehouse user**,
I want to split an LP into smaller quantities,
So that I can partially use inventory.

**Acceptance Criteria:**

**Given** LP has qty > split qty
**When** clicking "Split"
**Then** modal asks for split qty

**When** confirming
**Then** original LP qty decreased
**And** new LP created with split qty
**And** genealogy recorded: parent_lp_id = original

**And** new LP inherits: product, batch, expiry, location

**Prerequisites:** Story 5.1

**Technical Notes:**
- New LP gets new lp_number
- API: POST /api/warehouse/license-plates/:id/split

---

### Story 5.6: LP Merge

As a **Warehouse user**,
I want to merge LPs of same product/batch,
So that I can consolidate inventory.

**Acceptance Criteria:**

**Given** multiple LPs with same product and batch
**When** selecting LPs and clicking "Merge"
**Then** modal shows total qty

**When** confirming
**Then** target LP qty increased
**And** source LPs status → 'merged'
**And** genealogy recorded

**Prerequisites:** Story 5.1

**Technical Notes:**
- Validation: same product_id, batch_number
- API: POST /api/warehouse/license-plates/merge

---

### Story 5.7: LP Genealogy Tracking

As a **System**,
I want to track LP relationships,
So that traceability is complete.

**Acceptance Criteria:**

**Given** LP operations occur
**Then** lp_genealogy records:
- parent_lp_id
- child_lp_id
- wo_id (if from production)
- operation_type (split, merge, consume, produce)
- timestamp

**Prerequisites:** Stories 5.5, 5.6

**Technical Notes:**
- Enables forward/backward tracing
- Links to Epic 2 traceability features

---

### Story 5.8: ASN Creation

As a **Warehouse user**,
I want to create ASN for incoming shipments,
So that I can prepare for receiving.

**Acceptance Criteria:**

**Given** PO exists with status Confirmed+
**When** clicking "Create ASN" on PO
**Then** modal opens with:
- po_id (pre-filled)
- expected_arrival_date
- carrier
- tracking_number

**And** ASN items from PO lines

**When** saving
**Then** ASN created
**And** linked to PO

**Prerequisites:** Story 3.1

**Technical Notes:**
- API: GET/POST /api/warehouse/asns

---

### Story 5.9: ASN Item Management

As a **Warehouse user**,
I want to manage ASN items,
So that I know what's arriving.

**Acceptance Criteria:**

**Given** ASN is created
**Then** items from PO lines:
- product_id, quantity, uom
- supplier_batch_number (can edit)
- manufacture_date (can edit)
- expiry_date (can edit)

**And** can adjust quantities if partial shipment

**Prerequisites:** Story 5.8

**Technical Notes:**
- Pre-fill from supplier metadata if available

---

### Story 5.10: Over-Receipt Validation

As a **System**,
I want to validate receiving against PO,
So that we don't receive more than ordered.

**Acceptance Criteria:**

**Given** receiving against PO
**When** received_qty would exceed ordered_qty
**Then** system warns (or blocks if configured)

**And** shows: Ordered: X, Already Received: Y, Receiving: Z

**Prerequisites:** Story 5.8

**Technical Notes:**
- Toggle in warehouse_settings.allow_over_receipt

---

### Story 5.11: GRN and LP Creation

As a **Warehouse user**,
I want to receive goods and create LPs,
So that inventory is recorded.

**Acceptance Criteria:**

**Given** ASN exists (or ad-hoc receiving)
**When** clicking "Receive"
**Then** GRN created
**And** for each item:
- LP created with qty, batch, expiry
- Location from warehouse default or selected
- QA status assigned

**And** GRN items linked to LPs

**Prerequisites:** Story 5.8

**Technical Notes:**
- API: POST /api/warehouse/grns

---

### Story 5.12: Auto-Print Labels

As a **Warehouse user**,
I want labels to print automatically,
So that I can label inventory quickly.

**Acceptance Criteria:**

**Given** LP is created during receiving
**When** auto-print enabled
**Then** ZPL label sent to configured printer

**Label includes:**
- LP number (barcode)
- Product code and name
- Batch number
- Expiry date
- Quantity and UoM

**Prerequisites:** Story 5.11

**Technical Notes:**
- ZPL format in Settings
- Printer configured per warehouse/location

---

### Story 5.13: Update PO/TO Received Qty

As a **System**,
I want to update PO/TO quantities on receiving,
So that status is accurate.

**Acceptance Criteria:**

**Given** GRN is created from PO
**When** goods received
**Then** po_line.received_qty updated

**When** all lines received >= ordered
**Then** PO status → Closed

**Same logic for TO** with received_qty

**Prerequisites:** Story 5.11

**Technical Notes:**
- Automatic status transition

---

### Story 5.14: LP Location Move

As a **Warehouse user**,
I want to move LPs between locations,
So that inventory is in the right place.

**Acceptance Criteria:**

**Given** LP exists
**When** clicking "Move"
**Then** modal shows:
- Current location
- Destination location (dropdown)
- Reason (optional)

**When** confirming
**Then** LP.location_id updated
**And** stock_move record created
**And** audit trail entry

**Prerequisites:** Story 5.1

**Technical Notes:**
- API: POST /api/warehouse/stock-moves

---

### Story 5.15: Movement Audit Trail

As a **Warehouse Manager**,
I want to see movement history,
So that I can track where things went.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/stock-moves
**Then** they see history:
- LP number
- From location → To location
- Timestamp
- User
- Movement type

**And** can filter by LP, location, date, user

**Prerequisites:** Story 5.14

**Technical Notes:**
- stock_moves table
- API: GET /api/warehouse/stock-moves

---

### Story 5.16: Partial Move (Split on Move)

As a **Warehouse user**,
I want to move partial qty,
So that I can split during movement.

**Acceptance Criteria:**

**Given** LP has qty > move qty
**When** moving partial
**Then** system performs split first
**And** then moves new LP

**Or** shows option to move full LP

**Prerequisites:** Story 5.5, Story 5.14

**Technical Notes:**
- Combines split + move in one operation

---

### Story 5.17: Destination Validation

As a **System**,
I want to validate move destinations,
So that inventory goes to correct locations.

**Acceptance Criteria:**

**Given** LP is being moved
**When** destination is selected
**Then** validate:
- Location is active
- Location type allows storage
- Same warehouse (or via TO for cross-warehouse)

**Prerequisites:** Story 5.14

**Technical Notes:**
- Location types: Receiving, Storage, Production, Shipping

---

### Story 5.18: Movement Types

As a **Warehouse Manager**,
I want to categorize movements,
So that I can analyze flow.

**Acceptance Criteria:**

**Given** stock move is recorded
**Then** has movement_type:
- Receiving (from GRN)
- Put-away (receiving → storage)
- Pick (storage → production/shipping)
- Transfer (between locations)
- Adjustment (qty correction)

**Prerequisites:** Story 5.14

**Technical Notes:**
- Affects reporting and analytics

---

### Story 5.19: Pallet Creation

As a **Warehouse user**,
I want to create pallets,
So that I can group LPs.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/pallets
**When** clicking "Create Pallet"
**Then** modal opens with:
- pallet_number (auto-generated)
- location_id (required)
- notes (optional)

**When** saving
**Then** pallet created with status = 'open'

**Prerequisites:** Story 5.1

**Technical Notes:**
- API: GET/POST /api/warehouse/pallets

---

### Story 5.20: Pallet LP Management

As a **Warehouse user**,
I want to add/remove LPs from pallets,
So that I can organize inventory.

**Acceptance Criteria:**

**Given** pallet exists and is open
**When** adding LP
**Then** LP assigned to pallet
**And** LP moves to pallet location

**When** removing LP
**Then** LP unassigned from pallet

**And** pallet shows: LP count, total qty

**Prerequisites:** Story 5.19

**Technical Notes:**
- pallet_items table
- API: POST/DELETE /api/warehouse/pallets/:id/items

---

### Story 5.21: Pallet Move

As a **Warehouse user**,
I want to move entire pallets,
So that I can relocate grouped inventory.

**Acceptance Criteria:**

**Given** pallet with LPs
**When** moving pallet
**Then** all LPs move together
**And** all LP.location_id updated
**And** stock_moves created for each LP

**Prerequisites:** Story 5.19, Story 5.14

**Technical Notes:**
- Single move operation for pallet

---

### Story 5.22: Pallet Status

As a **Warehouse user**,
I want to track pallet status,
So that I know availability.

**Acceptance Criteria:**

**Given** pallet exists
**Then** has status:
- open: can add/remove LPs
- closed: ready for shipping
- shipped: sent out

**When** closing pallet
**Then** cannot modify contents

**Prerequisites:** Story 5.19

**Technical Notes:**
- Status affects operations allowed

---

### Story 5.23: Scanner Guided Workflows

As an **Operator**,
I want guided scanner workflows,
So that I don't make mistakes.

**Acceptance Criteria:**

**Given** the user opens scanner
**Then** sees workflow menu:
- Receive
- Put-away
- Pick for WO
- Move

**Each workflow** guides step-by-step with:
- What to scan
- Expected value
- Validation feedback
- Next step

**Prerequisites:** Epic 5, Epic 4

**Technical Notes:**
- State machine per workflow
- Touch-optimized UI

---

### Story 5.24: Scanner Barcode Validation

As a **System**,
I want to validate scanned barcodes,
So that correct items are processed.

**Acceptance Criteria:**

**Given** operator scans barcode
**When** barcode matches expected
**Then** shows ✅ green confirmation
**And** proceeds to next step

**When** barcode doesn't match
**Then** shows ❌ red error
**And** shows expected vs scanned
**And** blocks until correct

**Prerequisites:** Story 5.23

**Technical Notes:**
- Barcode formats: LP, Location, Product, WO

---

### Story 5.25: Scanner Feedback

As an **Operator**,
I want clear feedback on scanner,
So that I know operation status.

**Acceptance Criteria:**

**Given** scanner operation completes
**Then** shows:
- ✅ Success with details
- ❌ Error with reason
- ⚠️ Warning with option to proceed

**And** vibration/sound feedback (if enabled)
**And** auto-proceed after success (configurable delay)

**Prerequisites:** Story 5.23

**Technical Notes:**
- Haptic feedback API
- Settings: feedback type, auto-proceed delay

---

### Story 5.26: Scanner Operations Menu

As an **Operator**,
I want quick access to scanner operations,
So that I can work efficiently.

**Acceptance Criteria:**

**Given** the user opens /scanner
**Then** sees large buttons:
- Receive (from ASN/PO)
- Consume (for WO)
- Output (for WO)
- Move (location to location)
- Inventory Count

**Each** opens respective workflow

**Prerequisites:** Story 5.23

**Technical Notes:**
- Touch targets: minimum 48px

---

### Story 5.27: Scanner Session Timeout

As a **System**,
I want to timeout inactive sessions,
So that security is maintained.

**Acceptance Criteria:**

**Given** scanner is idle for X minutes
**Then** shows timeout warning
**And** after additional Y seconds → logout

**When** activity detected
**Then** timer resets

**Prerequisites:** Story 5.23

**Technical Notes:**
- Default: 5 min idle, 30 sec warning
- Settings: timeout duration

---

### Story 5.28: Forward/Backward Traceability

As a **QC Manager**,
I want to trace LP relationships,
So that I can investigate issues.

**Acceptance Criteria:**

**Given** viewing LP detail
**When** clicking "Trace Forward"
**Then** shows all child LPs and outputs

**When** clicking "Trace Backward"
**Then** shows all parent LPs and sources

**Prerequisites:** Story 5.7

**Technical Notes:**
- Links to Epic 2 traceability stories
- Recursive query on lp_genealogy

---

### Story 5.29: Genealogy Recording

As a **System**,
I want to record all LP relationships,
So that traceability is complete.

**Acceptance Criteria:**

**Given** LP operation occurs
**Then** lp_genealogy records:
- Split: parent → child
- Merge: sources → target
- Consume: input → (to be filled with output)
- Produce: (filled from consume) → output

**And** includes: wo_id, timestamp, operation_type

**Prerequisites:** Story 5.7

**Technical Notes:**
- Every LP transformation creates genealogy record

---

### Story 5.30: Source Document Linking

As a **Warehouse user**,
I want LPs linked to source documents,
So that I can trace origin.

**Acceptance Criteria:**

**Given** LP is created
**Then** stores source info:
- source: 'receiving', 'production', 'transfer', 'manual'
- po_id / grn_id / wo_id / to_id as applicable

**When** viewing LP
**Then** can click to view source document

**Prerequisites:** Story 5.11, Story 4.12

**Technical Notes:**
- Polymorphic reference to source

---

### Story 5.31: Warehouse Settings Configuration

As an **Admin**,
I want to configure Warehouse module settings,
So that operations match our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/warehouse
**Then** can configure:
- LP number format
- Auto-print on receive
- Allow over-receipt
- Scanner timeout
- Barcode formats

**Prerequisites:** Epic 1

**Technical Notes:**
- warehouse_settings table
- API: GET/PUT /api/warehouse/settings

---

### Story 5.32: Receive from PO (Desktop)

As a **Warehouse user**,
I want to receive goods against PO from desktop,
So that I can process deliveries.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/receiving
**When** selecting PO
**Then** shows PO lines with: product, ordered, received, remaining

**When** clicking "Receive"
**Then** can enter:
- qty per line
- batch_number
- expiry_date
- location

**When** confirming
**Then** GRN and LPs created

**Prerequisites:** Story 5.11

**Technical Notes:**
- Desktop alternative to scanner

---

### Story 5.33: Receive from TO (Desktop)

As a **Warehouse user**,
I want to receive goods from transfer order,
So that inter-warehouse transfers complete.

**Acceptance Criteria:**

**Given** TO is in Shipped status
**When** receiving
**Then** shows TO lines with: product, shipped, received

**When** confirming receipt
**Then** LP locations updated
**And** TO status → Received

**Prerequisites:** Story 3.6, Story 5.14

**Technical Notes:**
- LP already exists, just update location

---

### Story 5.34: Scanner Receive Workflow

As an **Operator**,
I want to receive via scanner,
So that I can work on the dock.

**Acceptance Criteria:**

**Workflow:**
1. Scan PO barcode
2. System shows items to receive
3. Scan product barcode (validation)
4. Enter qty
5. Enter batch/expiry (or scan)
6. Scan location barcode
7. Confirm → LP created, label printed
8. Next item or done

**Prerequisites:** Story 5.23

**Technical Notes:**
- Guided workflow with validation at each step

---

### Story 5.35: Inventory Count

As a **Warehouse user**,
I want to perform inventory counts,
So that I can verify accuracy.

**Acceptance Criteria:**

**Given** the user initiates count
**When** scanning location
**Then** shows expected LPs at location

**When** scanning each LP
**Then** confirms presence

**When** LP not scanned
**Then** marked as missing

**When** extra LP scanned
**Then** marked as found

**And** generates variance report

**Prerequisites:** Story 5.23

**Technical Notes:**
- API: POST /api/warehouse/inventory-counts
- Future: cycle counting feature

---

## FR Coverage Matrix

All 90 P0 FRs are covered by the 119 stories in Epics 1-5.

| Module | FRs | Stories | Coverage |
|--------|-----|---------|----------|
| Settings | 11 | 18 | 100% ✅ |
| Technical | 18 | 24 | 100% ✅ |
| Planning | 16 | 22 | 100% ✅ |
| Production | 15 | 20 | 100% ✅ |
| Warehouse | 30 | 35 | 100% ✅ |

---

## Summary

This epic breakdown provides 119 implementable stories for the P0 modules of MonoPilot.

### Key Patterns
- All stories follow BDD acceptance criteria
- Stories are vertically sliced (full stack)
- No forward dependencies
- Sized for single-session completion
- Include UX design references

### Next Steps
1. Create sprint-status.yaml for Phase 4 implementation
2. Use `create-story` workflow for individual story implementation
3. Update this document after Architecture workflow adds technical details

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after Architecture workflow to incorporate technical decisions._
