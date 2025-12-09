
## Epic 1: Foundation & Settings

**Goal:** Establish the foundation for MonoPilot - organization setup, user management, warehouses, locations, and system configuration.

**Dependencies:** None (foundation module)
**Required by:** All other epics

**UX Design Reference:** [ux-design-settings-module.md](./ux-design-settings-module.md)

---

### Story 1.0: Authentication UI

As a **User**,
I want to log in, log out, and reset my password,
so that I can securely access the MonoPilot system.

**Acceptance Criteria:**

**Given** the user is not authenticated
**When** they navigate to any protected route
**Then** they are redirected to `/login?redirect={original_url}`
**And** after successful login, redirected back to original URL

**When** user accesses `/login`
**Then** they see a login form with:
- Email + password inputs
- "Remember me" checkbox (30-day session)
- "Forgot password?" link
- Submit button with loading state

**When** user enters invalid credentials
**Then** error toast is shown: "Invalid email or password"

**When** user clicks "Forgot password?"
**Then** they navigate to `/forgot-password`
**And** can enter email to receive reset link
**And** reset link leads to `/reset-password?token={token}`

**When** user is logged in
**Then** they can logout via user menu (top-right)
**And** optional "Logout All Devices" terminates all sessions

**Prerequisites:** None (first user interaction)

**Technical Notes:**
- Supabase Auth (email/password)
- Session: 1h default, 30 days with "remember me"
- Middleware: route protection, redirect to `/login?redirect=`
- Pages: `/login`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Components: LoginForm, ForgotPasswordForm, ResetPasswordForm, UserMenu
- Zod schemas: LoginSchema, ResetPasswordSchema
- **Decision**: Invitation-only (no public `/signup` - use Story 1.3 instead)

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

### Story 1.13: Main Dashboard

As a **User**,
I want to see a main dashboard after login,
so that I can quickly access key information and navigate to different modules.

**Acceptance Criteria:**

**Given** user successfully logs in
**When** they land on the dashboard at `/dashboard`
**Then** they see:
- Top navigation bar (logo, module links, search, user menu)
- Sidebar navigation (collapsible, module icons)
- Main content: grid of module overview cards (2-4 columns)
- Right sidebar: recent activity feed (last 10 activities)

**When** viewing module cards
**Then** each enabled module shows:
- Module icon and name (color-coded)
- Quick stats (e.g., "5 Active WOs", "12 Pending POs")
- Primary action button (e.g., "Create WO")
- "View Details" link → module dashboard

**When** viewing activity feed
**Then** they see recent activities:
- "WO-2024-001 started by John Doe" (2 minutes ago)
- Click activity → navigate to entity detail page
- Activities from all enabled modules

**When** using quick actions
**Then** they can:
- Click "Create" dropdown → create PO, WO, NCR, TO (based on enabled modules)
- Use global search bar → search WO/PO/LP/Product by code/name
- View notifications (future: bell icon with badge)

**Given** new user (setup_completed = false)
**Then** they see welcome banner: "Welcome to MonoPilot! Let's set up your organization."
**And** "Start Setup Wizard" button → launches Story 1.12

**Given** no modules are enabled
**Then** empty state: "Enable modules in Settings" with CTA

**Prerequisites:** Story 1.0 (Auth UI), Story 1.11 (Module Activation)

**Technical Notes:**
- API: GET /api/dashboard/overview, /api/dashboard/activity, /api/dashboard/search
- Tables: activity_logs (org_id, user_id, type, entity_type, entity_id, description, created_at)
- Activity logging: centralized utility `logActivity()` called from all modules
- Caching: module stats cached in Redis (5 min TTL)
- Responsive: desktop (sidebar + cards + feed), mobile (bottom nav + cards)
- Optional: user preferences (card order, pinned modules, drag-and-drop)

---

## FR Coverage Matrix

This section maps all Functional Requirements from the Settings Module (PRD) to their implementing stories, ensuring 100% traceability.

| FR ID | FR Title | Story IDs | Status | Notes |
|-------|----------|-----------|--------|-------|
| FR-SET-000 | Authentication UI | 1.0 | ✅ Covered | Login, logout, forgot password, session management |
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
| FR-SET-012 | Main Dashboard | 1.13 | ✅ Covered | Landing page, module overview, activity feed, quick actions |

**Coverage Summary:**
- **Total FRs:** 13 (12 P0 + 1 Phase 2)
- **P0 FRs Covered:** 12/12 (100%)
- **Phase 2 FRs:** 1 (FR-SET-011 deferred to Growth phase)
- **Total Stories:** 14 (includes Story 1.0 Auth UI, Story 1.12 Wizard, Story 1.13 Dashboard)

**Validation:**
- ✅ All P0 functional requirements have at least one implementing story
- ✅ No orphaned stories (all stories trace back to FRs or UX requirements)
- ✅ FR-SET-002 appropriately split into 2 stories (CRUD vs Invitations)

**Reverse Traceability (Story → FR):**
- Story 1.0 → FR-SET-000 (Authentication UI)
- Story 1.1 → FR-SET-001 (Organization Configuration)
- Story 1.2 → FR-SET-002 (User Management CRUD)
- Story 1.3 → FR-SET-002 (User Invitations)
- Story 1.4 → FR-SET-003 (Session Management)
- Story 1.5 → FR-SET-004 (Warehouse Configuration)
- Story 1.6 → FR-SET-005 (Location Management)
- Story 1.7 → FR-SET-006 (Machine Configuration)
- Story 1.8 → FR-SET-007 (Production Line Configuration)
- Story 1.9 → FR-SET-008 (Allergen Management)
- Story 1.10 → FR-SET-009 (Tax Code Configuration)
- Story 1.11 → FR-SET-010 (Module Activation)
- Story 1.12 → UX Design (Wizard Mode enhancement, no direct FR)
- Story 1.13 → FR-SET-012 (Main Dashboard)

---

## Post-Review Follow-ups

This section tracks technical debt and action items identified during code reviews of Epic 1 stories.

### Story 1.6: Location Management (Review: 2025-11-22)

**Technical Debt Items:**

#### TD-1.6-1: Cache Invalidation Events (AC-005.8)
- **Priority:** P3 (Low)
- **Effort:** 2-4 hours
- **Impact:** Performance optimization for multi-user scenarios
- **Description:** Implement Redis cache invalidation for location mutations
- **Files to Modify:**
  - Create: `lib/services/cache-event-service.ts`
  - Update: `lib/services/location-service.ts` (3 TODO comments at lines 185, 310, 545)
- **Acceptance Criteria:**
  - Cache invalidated on location.created/updated/deleted events
  - Consumer modules (Epic 4, 5, 6, 7) refetch location list on event
  - Redis cache TTL: 5 min
  - Cache key pattern: `locations:{warehouse_id}`
- **Current Status:** System works without cache, this is optimization
- **Defer Until:** Epic 1 completion or when multi-user performance issues observed

#### TD-1.6-2: RLS Integration Tests
- **Priority:** P2 (Medium)
- **Effort:** 2-3 hours
- **Impact:** Automated security regression testing
- **Description:** Add location RLS tests to Sprint 0 Gap 4 test suite
- **Files to Create:**
  - `tests/integration/rls/locations-rls.test.ts`
- **Test Cases:**
  1. User A (Org 1) cannot see locations from Org 2
  2. Non-admin cannot create/update/delete locations
  3. Admin can only modify locations in their org
  4. Location queries filtered by org_id via RLS
- **Current Status:** RLS policies exist and work, but lack automated tests
- **Defer Until:** Before Epic 1 completion (add to Sprint 0 Gap 4 backlog)

#### TD-1.6-3: Performance Monitoring
- **Priority:** P3 (Low)
- **Effort:** 1 hour
- **Impact:** Verify idx_locations_warehouse index usage in production
- **Description:** Add EXPLAIN query logging to getLocations() in dev/staging
- **Action Items:**
  1. Add conditional EXPLAIN logging for location queries in dev/staging
  2. Monitor query plans with 500+ locations
  3. Verify idx_locations_warehouse is used (expected: Index Scan on idx_locations_warehouse)
  4. Alert if query time exceeds 100ms p95
- **Acceptance:** Confirmed index usage in production with 500+ locations
- **Defer Until:** After 500+ locations created in production

**Review Summary:**
- **Outcome:** ✅ APPROVED FOR PRODUCTION
- **AC Coverage:** 7/8 (87.5%) - AC-005.7 optional (deferred), AC-005.8 partial (low priority)
- **Test Coverage:** 62 test cases (30 unit + 14 service + 18 E2E)
- **Security:** Strong (RLS, admin-only, org isolation, input validation)
- **Performance:** Excellent (critical index prevents 30s → <100ms query)

---

