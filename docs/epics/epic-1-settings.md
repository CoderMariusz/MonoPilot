
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

## FR Coverage Matrix

This section maps all Functional Requirements from the Settings Module (PRD) to their implementing stories, ensuring 100% traceability.

| FR ID | FR Title | Story IDs | Status | Notes |
|-------|----------|-----------|--------|-------|
| FR-SET-001 | Organization Configuration | 1.1 | ✅ Covered | Company settings, logo, regional config |
| FR-SET-002 | User Management | 1.2, 1.3 | ✅ Covered | CRUD + Invitations (email/QR) |
| FR-SET-003 | Session Management | 1.4 | ✅ Covered | Active sessions, device tracking, logout |
| FR-SET-004 | Warehouse Configuration | 1.5 | ✅ Covered | Multi-warehouse support |
| FR-SET-005 | Location Management | 1.6 | ✅ Covered | Hierarchical locations, QR codes |
| FR-SET-006 | Machine Configuration | 1.7 | ✅ Covered | Machine CRUD, production line assignment |
| FR-SET-007 | Production Line Configuration | 1.8 | ✅ Covered | Production lines, machine groups |
| FR-SET-008 | Allergen Management | 1.9 | ✅ Covered | 14 EU allergens, custom allergens |
| FR-SET-009 | Tax Code Configuration | 1.10 | ✅ Covered | VAT rates, tax categories |
| FR-SET-010 | Module Activation | 1.11 | ✅ Covered | Enable/disable modules (Planning, Production, Warehouse, etc.) |
| FR-SET-011 | Subscription Management | _(Phase 2)_ | ⏸️ Deferred | Stripe integration, billing (not P0) |

**Coverage Summary:**
- **Total FRs:** 11 (10 P0 + 1 Phase 2)
- **P0 FRs Covered:** 10/10 (100%)
- **Phase 2 FRs:** 1 (FR-SET-011 deferred to Growth phase)
- **Total Stories:** 12 (includes UX enhancement Story 1.12)

**Validation:**
- ✅ All P0 functional requirements have at least one implementing story
- ✅ No orphaned stories (all stories trace back to FRs or UX requirements)
- ✅ FR-SET-002 appropriately split into 2 stories (CRUD vs Invitations)

**Reverse Traceability (Story → FR):**
- Story 1.1 → FR-SET-001
- Story 1.2 → FR-SET-002
- Story 1.3 → FR-SET-002
- Story 1.4 → FR-SET-003
- Story 1.5 → FR-SET-004
- Story 1.6 → FR-SET-005
- Story 1.7 → FR-SET-006
- Story 1.8 → FR-SET-007
- Story 1.9 → FR-SET-008
- Story 1.10 → FR-SET-009
- Story 1.11 → FR-SET-010
- Story 1.12 → UX Design (Wizard Mode enhancement, no direct FR)

---

