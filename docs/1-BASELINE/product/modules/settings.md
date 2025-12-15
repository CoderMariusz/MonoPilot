# Settings Module - Product Requirements Document

**Module:** Settings
**Version:** 2.3
**Last Updated:** 2025-12-15
**Status:** Baseline

## Phase Mapping

| Phase | Timeline | Focus |
|-------|----------|-------|
| 1A | MVP Core (Weeks 1-2) | Organization setup, user management with 10 roles, module toggles, 15-minute onboarding wizard |
| 1B | MVP Complete (Weeks 3-4) | Warehouse/location/machine infrastructure, production lines, audit trail, security policies, multi-language support |
| 2 | Growth (Weeks 5-6) | Master data (allergens, tax codes), API keys, webhooks, notification settings |
| 3 | Enterprise (Weeks 7-8) | Subscription/billing, import/export utilities, IP whitelist, GDPR compliance, usage analytics |

---

## 1. Overview

The Settings Module provides centralized configuration and administration for MonoPilot Food MES. Manages organization setup, user access, infrastructure, master data, integrations, and system preferences.

**Key Capabilities:**
- Organization and multi-tenant configuration
- User management with 10 role-based access levels
- Warehouse, location, and production infrastructure setup
- Master data (allergens, tax codes, modules)
- Multi-language support (PL/EN/DE/FR)
- API keys, webhooks, and audit trail
- Subscription and billing management
- Import/Export utilities
- **15-minute onboarding wizard** (competitive differentiator)

---

## 2. Functional Requirements

### 2.1 Requirements Table

| ID | Requirement Name | Priority | Phase | Module Area |
|---|---|---|---|---|
| **ORGANIZATION & TENANT** |
| FR-SET-001 | Organization profile (name, logo, contact) | P0 | 1A | Organization |
| FR-SET-002 | Multi-tenant isolation | P0 | 1A | Organization |
| FR-SET-003 | Timezone and locale settings | P0 | 1A | Organization |
| FR-SET-004 | Currency configuration | P1 | 1A | Organization |
| FR-SET-005 | Business hours configuration | P2 | 1B | Organization |
| **USER MANAGEMENT** |
| FR-SET-010 | User CRUD operations | P0 | 1A | Users |
| FR-SET-011 | 10-role permission system | P0 | 1A | Users |
| FR-SET-012 | User invitations (email) | P0 | 1A | Users |
| FR-SET-013 | Session management | P0 | 1A | Users |
| FR-SET-014 | Password policies | P1 | 1A | Users |
| FR-SET-015 | MFA/2FA support | P1 | 1B | Users |
| FR-SET-016 | User activity tracking | P2 | 2 | Users |
| FR-SET-017 | User deactivation/archiving | P1 | 1A | Users |
| FR-SET-018 | User warehouse access restrictions | P1 | 1B | Users |
| **ROLES & PERMISSIONS** |
| FR-SET-020 | Super Admin role | P0 | 1A | Roles |
| FR-SET-021 | Admin role | P0 | 1A | Roles |
| FR-SET-022 | Production Manager role | P0 | 1A | Roles |
| FR-SET-023 | Quality Manager role | P0 | 1A | Roles |
| FR-SET-024 | Warehouse Manager role | P0 | 1A | Roles |
| FR-SET-025 | Production Operator role | P0 | 1A | Roles |
| FR-SET-026 | Quality Inspector role | P0 | 1A | Roles |
| FR-SET-027 | Warehouse Operator role | P0 | 1A | Roles |
| FR-SET-028 | Planner role | P0 | 1A | Roles |
| FR-SET-029 | Viewer role | P0 | 1A | Roles |
| FR-SET-030 | Module-level permissions | P0 | 1A | Roles |
| FR-SET-031 | CRUD-level permissions | P0 | 1A | Roles |
| **WAREHOUSES & LOCATIONS** |
| FR-SET-040 | Warehouse CRUD | P0 | 1B | Infrastructure |
| FR-SET-041 | Warehouse type (raw/wip/finished/quarantine) | P0 | 1B | Infrastructure |
| FR-SET-042 | Location hierarchy (zone/aisle/rack/bin) | P0 | 1B | Infrastructure |
| FR-SET-043 | Location capacity tracking | P1 | 1B | Infrastructure |
| FR-SET-044 | Location type (bulk/pallet/shelf) | P1 | 1B | Infrastructure |
| FR-SET-045 | Warehouse address and contact | P2 | 1B | Infrastructure |
| FR-SET-046 | Default warehouse assignment | P1 | 1B | Infrastructure |
| **MACHINES** |
| FR-SET-050 | Machine CRUD | P0 | 1B | Infrastructure |
| FR-SET-051 | Machine type (mixer/oven/filler/packaging) | P0 | 1B | Infrastructure |
| FR-SET-052 | Machine status (active/maintenance/offline) | P0 | 1B | Infrastructure |
| FR-SET-053 | Machine capacity (units/hour) | P1 | 1B | Infrastructure |
| FR-SET-054 | Maintenance schedule configuration | P2 | 2 | Infrastructure |
| FR-SET-055 | Machine location assignment | P1 | 1B | Infrastructure |
| FR-SET-056 | Machine-specific parameters | P2 | 2 | Infrastructure |
| **PRODUCTION LINES** |
| FR-SET-060 | Production line CRUD | P0 | 1B | Infrastructure |
| FR-SET-061 | Machine assignment to lines | P0 | 1B | Infrastructure |
| FR-SET-062 | Line sequence/order definition | P0 | 1B | Infrastructure |
| FR-SET-063 | Line capacity calculation | P1 | 1B | Infrastructure |
| FR-SET-064 | Line status tracking | P1 | 1B | Infrastructure |
| FR-SET-065 | Line-product compatibility | P1 | 1B | Infrastructure |
| **ALLERGENS** |
| FR-SET-070 | 14 EU allergen management | P0 | 2 | Master Data |
| FR-SET-071 | Allergen codes (A01-A14) | P0 | 2 | Master Data |
| FR-SET-072 | Allergen labels (multi-language) | P1 | 2 | Master Data |
| FR-SET-073 | Allergen icons/symbols | P2 | 2 | Master Data |
| FR-SET-074 | Custom allergen addition | P2 | 3 | Master Data |
| **TAX CODES** |
| FR-SET-080 | Tax code CRUD | P1 | 2 | Master Data |
| FR-SET-081 | Tax rate configuration | P1 | 2 | Master Data |
| FR-SET-082 | Tax jurisdiction (country/region) | P1 | 2 | Master Data |
| FR-SET-083 | Effective date ranges | P1 | 2 | Master Data |
| FR-SET-084 | Default tax code assignment | P1 | 2 | Master Data |
| **MODULE TOGGLES** |
| FR-SET-090 | Module activation/deactivation | P0 | 1A | Modules |
| FR-SET-091 | Planning module toggle | P0 | 1A | Modules |
| FR-SET-092 | Production module toggle | P0 | 1A | Modules |
| FR-SET-093 | Quality module toggle | P0 | 1A | Modules |
| FR-SET-094 | Warehouse module toggle | P0 | 1A | Modules |
| FR-SET-095 | Shipping module toggle | P0 | 1A | Modules |
| FR-SET-096 | Technical module toggle | P0 | 1A | Modules |
| FR-SET-097 | Module dependency validation | P1 | 1A | Modules |
| **SUBSCRIPTION & BILLING** |
| FR-SET-100 | Subscription plan selection | P1 | 3 | Billing |
| FR-SET-101 | User seat management | P1 | 3 | Billing |
| FR-SET-102 | Billing cycle configuration | P1 | 3 | Billing |
| FR-SET-103 | Payment method management | P1 | 3 | Billing |
| FR-SET-104 | Invoice history | P1 | 3 | Billing |
| FR-SET-105 | Usage metrics tracking | P2 | 3 | Billing |
| FR-SET-106 | Subscription upgrade/downgrade | P1 | 3 | Billing |
| **MULTI-LANGUAGE** |
| FR-SET-110 | Language selection (PL/EN/DE/FR) | P1 | 1B | Localization |
| FR-SET-111 | UI translation management | P1 | 1B | Localization |
| FR-SET-112 | User-level language preference | P1 | 1B | Localization |
| FR-SET-113 | Organization default language | P1 | 1B | Localization |
| FR-SET-114 | Date/time format localization | P1 | 1B | Localization |
| FR-SET-115 | Number format localization | P1 | 1B | Localization |
| FR-SET-116 | Translation fallback (EN default) | P1 | 1B | Localization |
| **API KEYS** |
| FR-SET-120 | API key generation | P1 | 2 | Integrations |
| FR-SET-121 | API key revocation | P1 | 2 | Integrations |
| FR-SET-122 | API key expiration dates | P1 | 2 | Integrations |
| FR-SET-123 | API key permissions/scopes | P1 | 2 | Integrations |
| FR-SET-124 | API key usage tracking | P2 | 2 | Integrations |
| FR-SET-125 | API key rate limiting | P2 | 2 | Integrations |
| **WEBHOOKS** |
| FR-SET-130 | Webhook endpoint registration | P1 | 2 | Integrations |
| FR-SET-131 | Webhook event subscriptions | P1 | 2 | Integrations |
| FR-SET-132 | Webhook delivery retry logic | P1 | 2 | Integrations |
| FR-SET-133 | Webhook signature verification | P1 | 2 | Integrations |
| FR-SET-134 | Webhook delivery logs | P2 | 2 | Integrations |
| FR-SET-135 | Webhook test/ping functionality | P2 | 2 | Integrations |
| **AUDIT TRAIL** |
| FR-SET-140 | User action logging | P1 | 1B | Audit |
| FR-SET-141 | Data change tracking | P1 | 1B | Audit |
| FR-SET-142 | Login/logout tracking | P1 | 1B | Audit |
| FR-SET-143 | Audit log search/filter | P1 | 1B | Audit |
| FR-SET-144 | Audit log export | P2 | 1B | Audit |
| FR-SET-145 | Audit retention policies | P2 | 2 | Audit |
| FR-SET-146 | Critical event alerting | P2 | 2 | Audit |
| **IMPORT/EXPORT** |
| FR-SET-150 | Master data CSV import | P2 | 3 | Data Management |
| FR-SET-151 | Master data CSV export | P2 | 3 | Data Management |
| FR-SET-152 | Excel template download | P2 | 3 | Data Management |
| FR-SET-153 | Import validation errors | P2 | 3 | Data Management |
| FR-SET-154 | Bulk user import | P2 | 3 | Data Management |
| FR-SET-155 | Configuration backup/restore | P2 | 3 | Data Management |
| **NOTIFICATIONS** |
| FR-SET-160 | Email notification settings | P1 | 2 | Notifications |
| FR-SET-161 | In-app notification preferences | P1 | 2 | Notifications |
| FR-SET-162 | Notification templates | P2 | 2 | Notifications |
| FR-SET-163 | User notification subscriptions | P1 | 2 | Notifications |
| **SECURITY** |
| FR-SET-170 | IP whitelist configuration | P2 | 3 | Security |
| FR-SET-171 | Session timeout configuration | P1 | 1B | Security |
| FR-SET-172 | Password complexity rules | P1 | 1B | Security |
| FR-SET-173 | Failed login attempt limits | P1 | 1B | Security |
| FR-SET-174 | GDPR compliance tools | P2 | 3 | Security |
| **ONBOARDING WIZARD** |
| FR-SET-180 | Setup wizard launcher | P0 | 1A | Onboarding |
| FR-SET-181 | Organization profile step | P0 | 1A | Onboarding |
| FR-SET-182 | First warehouse creation step | P0 | 1A | Onboarding |
| FR-SET-183 | First location setup step | P0 | 1A | Onboarding |
| FR-SET-184 | First product creation step | P0 | 1A | Onboarding |
| FR-SET-185 | First work order creation step | P0 | 1A | Onboarding |
| FR-SET-186 | Wizard progress tracking | P0 | 1A | Onboarding |
| FR-SET-187 | Skip wizard option | P0 | 1A | Onboarding |
| FR-SET-188 | Wizard completion celebration | P0 | 1A | Onboarding |

---

### 2.2 Phase 1A - Organization & Tenant Requirements

#### FR-SET-001: Organization Profile

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Organization

**Description:**
Manage organization master data including name, logo, and contact information. This is the foundational configuration that identifies the tenant within the system.

**Acceptance Criteria:**
- GIVEN user navigates to `/settings/organization`, WHEN page loads, THEN organization profile form displays within 300ms
- GIVEN user enters organization name "Fresh Bakery Co", WHEN user clicks "Save", THEN organization name updates in database within 500ms
- GIVEN user uploads a logo image (PNG/JPG, max 2MB), WHEN upload completes, THEN logo displays in header within 1 second
- GIVEN user uploads an image larger than 2MB, WHEN upload attempted, THEN error message "Logo must be under 2MB" displays
- GIVEN user uploads a non-image file, WHEN upload attempted, THEN error message "Only PNG, JPG, or GIF formats allowed" displays
- GIVEN user clears organization name field, WHEN user clicks "Save", THEN validation error "Organization name is required" displays
- GIVEN user enters contact email "admin@bakery.com", WHEN user clicks "Save", THEN contact email is stored and displayed on profile
- GIVEN user enters invalid email format "admin@", WHEN user clicks "Save", THEN validation error "Invalid email format" displays
- GIVEN user with Viewer role accesses organization settings, WHEN page loads, THEN form displays as read-only (no Save button)

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Organization Name | Text | Yes | 2-100 characters |
| Logo | File | No | PNG/JPG/GIF, max 2MB |
| Contact Email | Email | No | Valid email format |
| Contact Phone | Text | No | Max 20 characters |
| Website | URL | No | Valid URL format |

---

#### FR-SET-002: Multi-Tenant Isolation

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Organization

**Description:**
Ensure complete data isolation between organizations. All data queries must be scoped to the current user's organization via RLS policies.

**Acceptance Criteria:**
- GIVEN Organization A has 50 products, WHEN user from Organization B queries products, THEN 0 products return (not 50)
- GIVEN user from Organization A creates a warehouse, WHEN user from Organization B queries warehouses, THEN the new warehouse does not appear
- GIVEN user attempts to access `/api/v1/settings/users/123` where user 123 belongs to different org, WHEN request executes, THEN 404 Not Found returns (not 403)
- GIVEN database query executes without org_id filter, WHEN RLS policy evaluated, THEN query automatically filters by authenticated user's org_id
- GIVEN user's session contains org_id = "org-abc", WHEN any API request made, THEN all database operations scope to org-abc only
- GIVEN admin creates new user, WHEN user record saved, THEN org_id is automatically set to admin's organization (not null, not different org)
- GIVEN direct database access attempted (bypassing API), WHEN RLS policies active, THEN cross-tenant data access blocked

**Technical Requirements:**
- All tables include `org_id` column with NOT NULL constraint
- RLS policies on all tables filter by `auth.jwt() -> org_id`
- API layer validates org_id matches session before any operation
- No cross-organization data joins permitted

---

#### FR-SET-003: Timezone and Locale Settings

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Organization

**Description:**
Configure organization-wide timezone and locale settings affecting date/time display, number formatting, and first day of week.

**Acceptance Criteria:**
- GIVEN user selects timezone "Europe/Warsaw", WHEN user clicks "Save", THEN all datetime displays convert to Warsaw time
- GIVEN organization timezone is "America/New_York", WHEN work order shows due_date, THEN date displays in EST/EDT
- GIVEN user selects locale "pl-PL", WHEN viewing numbers, THEN decimal separator is comma (1.234,56)
- GIVEN user selects locale "en-US", WHEN viewing numbers, THEN decimal separator is period (1,234.56)
- GIVEN organization timezone changed from UTC to CET, WHEN dashboard loads, THEN "Orders Today" KPI uses CET date boundaries
- GIVEN timezone dropdown opened, WHEN user searches "war", THEN "Europe/Warsaw" appears in filtered results within 200ms
- GIVEN user is in Europe/London and org is Europe/Warsaw, WHEN audit log shows timestamp, THEN timestamp displays in Europe/Warsaw (org timezone)

**Supported Timezones:**
- All IANA timezone identifiers (300+ zones)
- Auto-detect browser timezone for initial default

---

#### FR-SET-004: Currency Configuration

**Priority:** P1 (MVP)
**Phase:** 1A
**Module Area:** Organization

**Description:**
Configure primary currency for the organization, affecting all monetary displays and calculations.

**Acceptance Criteria:**
- GIVEN user selects currency "PLN", WHEN user clicks "Save", THEN currency code stored as organization default
- GIVEN organization currency is "EUR", WHEN product cost displays, THEN format shows "EUR 123.45" or "123,45 EUR" based on locale
- GIVEN organization currency is "USD", WHEN financial reports generate, THEN currency symbol "$" displays
- GIVEN currency dropdown opened, WHEN user types "eu", THEN "EUR - Euro" appears in filtered results
- GIVEN organization has existing financial data in PLN, WHEN currency changed to EUR, THEN warning displays "Existing data will not be converted"
- GIVEN currency is required, WHEN user attempts to save with no currency selected, THEN validation error displays

**Supported Currencies:**
| Code | Name | Symbol |
|------|------|--------|
| PLN | Polish Zloty | zl |
| EUR | Euro | E |
| USD | US Dollar | $ |
| GBP | British Pound | L |
| CHF | Swiss Franc | CHF |

---

### 2.3 Phase 1A - User Management Requirements

#### FR-SET-010: User CRUD Operations

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Users

**Description:**
Create, read, update, and delete user accounts within the organization. Supports full user lifecycle management.

**Acceptance Criteria:**
- GIVEN admin navigates to `/settings/users`, WHEN page loads, THEN user list displays within 500ms for up to 1000 users
- GIVEN admin clicks "Add User", WHEN modal opens, THEN form displays with email, name, role fields
- GIVEN admin enters valid user data and clicks "Create", WHEN save completes, THEN new user appears in list within 1 second
- GIVEN admin enters duplicate email "john@company.com", WHEN save attempted, THEN error "Email already exists" displays
- GIVEN admin clicks edit on existing user, WHEN modal opens, THEN current user data pre-populates form
- GIVEN admin updates user name from "John" to "Jonathan", WHEN save completes, THEN updated name displays in list
- GIVEN admin clicks delete on user, WHEN confirmation accepted, THEN user removed from list (soft delete)
- GIVEN user list has 500 users, WHEN admin applies search "john", THEN filtered results display within 300ms
- GIVEN admin has no permission to manage users, WHEN `/settings/users` accessed, THEN redirect to dashboard with "Access Denied"
- GIVEN admin deletes own account, WHEN delete attempted, THEN error "Cannot delete your own account" displays

**Table Columns:**
| Column | Sortable | Filterable |
|--------|----------|------------|
| Name | Yes | Yes (search) |
| Email | Yes | Yes (search) |
| Role | Yes | Yes (dropdown) |
| Status | Yes | Yes (dropdown) |
| Last Login | Yes | No |
| Created | Yes | No |

---

#### FR-SET-011: 10-Role Permission System

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Users

**Description:**
Implement 10 predefined roles with specific permission sets. Roles cannot be modified (system-defined).

**Acceptance Criteria:**
- GIVEN admin opens user creation modal, WHEN role dropdown opens, THEN exactly 10 roles display
- GIVEN user has role "Production Operator", WHEN accessing Quality module, THEN read-only access granted
- GIVEN user has role "Viewer", WHEN attempting to create product, THEN "Create" button hidden/disabled
- GIVEN user has role "Admin", WHEN accessing Settings, THEN full CRUD permissions available
- GIVEN user has role "Quality Inspector", WHEN accessing Warehouse module, THEN access denied (no permissions)
- GIVEN Super Admin assigns role to user, WHEN any of 10 roles selected, THEN role assignment succeeds
- GIVEN non-Super Admin attempts to assign Super Admin role, WHEN save attempted, THEN error "Only Super Admin can assign Super Admin role"
- GIVEN user role changed from "Planner" to "Production Manager", WHEN next page load, THEN new permissions active immediately

**Role Definitions:**
See Section 5 for complete permission matrix.

---

#### FR-SET-012: User Invitations

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Users

**Description:**
Send email invitations to new users. Invited users receive a link to set their password and activate their account.

**Acceptance Criteria:**
- GIVEN admin enters email "new@company.com" and selects role, WHEN "Send Invitation" clicked, THEN invitation email sent within 5 seconds
- GIVEN invitation sent, WHEN recipient clicks link, THEN password setup page displays
- GIVEN invitation link older than 7 days, WHEN recipient clicks link, THEN error "Invitation expired" displays with "Request New Invitation" option
- GIVEN invitation sent to "test@company.com", WHEN admin views pending invitations, THEN "test@company.com" appears with "Pending" status
- GIVEN pending invitation exists, WHEN admin clicks "Resend", THEN new invitation email sent and expiry reset to 7 days
- GIVEN pending invitation exists, WHEN admin clicks "Cancel", THEN invitation invalidated and removed from list
- GIVEN user completes password setup, WHEN form submitted, THEN account activated and user can login immediately
- GIVEN invitation to email that already has active account, WHEN invitation attempted, THEN error "User already exists" displays
- GIVEN 5 pending invitations exist, WHEN admin views invitations tab, THEN all 5 display with sent date and status

**Email Content:**
- Subject: "You're invited to join [Organization Name] on MonoPilot"
- Body: Organization name, inviter name, role assigned, activation link, expiry notice
- Link format: `https://app.monopilot.io/invite/{token}`

---

#### FR-SET-013: Session Management

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Users

**Description:**
Manage user authentication sessions including timeout, multiple devices, and session termination.

**Acceptance Criteria:**
- GIVEN user logs in successfully, WHEN session created, THEN session token valid for 24 hours (default)
- GIVEN user inactive for session timeout period, WHEN next request made, THEN redirect to login with "Session expired" message
- GIVEN user logged in on 3 devices, WHEN admin views user's sessions, THEN all 3 sessions display with device info
- GIVEN admin clicks "Terminate All Sessions" for a user, WHEN confirmed, THEN all user sessions invalidated within 1 second
- GIVEN user clicks "Logout", WHEN logout completes, THEN current session token invalidated
- GIVEN user with terminated session makes API request, WHEN request processed, THEN 401 Unauthorized returns
- GIVEN session timeout set to 8 hours, WHEN user inactive for 8 hours, THEN automatic logout on next interaction
- GIVEN user logs in from new device, WHEN session created, THEN previous sessions remain valid (multi-device support)
- GIVEN user changes password, WHEN password update completes, THEN all other sessions terminated (security)

**Session Data Tracked:**
| Field | Description |
|-------|-------------|
| Device Type | Browser, Mobile App, API Client |
| IP Address | Source IP of session |
| User Agent | Browser/client identifier |
| Created At | Session start timestamp |
| Last Activity | Last request timestamp |
| Expires At | Session expiration time |

---

#### FR-SET-014: Password Policies

**Priority:** P1 (MVP)
**Phase:** 1A
**Module Area:** Users

**Description:**
Enforce password complexity requirements and history to ensure account security.

**Acceptance Criteria:**
- GIVEN user sets password "abc", WHEN form submitted, THEN error "Password must be at least 8 characters" displays
- GIVEN user sets password "abcdefgh", WHEN form submitted, THEN error "Password must contain at least one uppercase letter" displays
- GIVEN user sets password "Abcdefgh", WHEN form submitted, THEN error "Password must contain at least one number" displays
- GIVEN user sets password "Abcdefg1", WHEN form submitted, THEN error "Password must contain at least one special character" displays
- GIVEN user sets password "Abcdefg1!", WHEN form submitted, THEN password accepted and saved
- GIVEN user attempts to reuse one of last 5 passwords, WHEN form submitted, THEN error "Cannot reuse recent passwords" displays
- GIVEN password expires in 90 days (if enabled), WHEN user logs in after 90 days, THEN forced password change screen displays
- GIVEN real-time validation enabled, WHEN user types password, THEN checklist updates showing met/unmet requirements

**Password Requirements:**
| Rule | Requirement |
|------|-------------|
| Minimum Length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Numbers | At least 1 |
| Special Characters | At least 1 (!@#$%^&*) |
| History | Cannot reuse last 5 passwords |

---

#### FR-SET-017: User Deactivation/Archiving

**Priority:** P1 (MVP)
**Phase:** 1A
**Module Area:** Users

**Description:**
Deactivate user accounts without deleting them, preserving audit history and allowing reactivation.

**Acceptance Criteria:**
- GIVEN admin clicks "Deactivate" on active user, WHEN confirmed, THEN user status changes to "Inactive" within 500ms
- GIVEN user is deactivated, WHEN user attempts login, THEN error "Account is deactivated. Contact administrator." displays
- GIVEN user is deactivated, WHEN user list filtered by "Active", THEN deactivated user does not appear
- GIVEN admin views deactivated user, WHEN "Reactivate" clicked, THEN user status changes to "Active" and can login
- GIVEN user is deactivated, WHEN audit logs queried, THEN all historical actions by that user still visible
- GIVEN deactivated user has active sessions, WHEN deactivation completes, THEN all sessions terminated immediately
- GIVEN Super Admin deactivates an Admin, WHEN deactivation completes, THEN Admin can no longer access system
- GIVEN only 1 Super Admin exists, WHEN deactivation attempted, THEN error "Cannot deactivate the only Super Admin" displays

---

#### FR-SET-018: User Warehouse Access Restrictions

**Priority:** P1 (Phase 1B - Infrastructure)
**Phase:** 1B
**Module Area:** Users
**Dependencies:** FR-SET-040 (Warehouses CRUD)

**Description:**
Restrict user access to specific warehouses. Users can only view and modify inventory in warehouses they have been granted access to. Super admins and admins have access to all warehouses by default.

**User Story:**
As an admin, I want to restrict which warehouses a user can access, so that multi-warehouse operations maintain proper data isolation and users only see relevant inventory.

**Acceptance Criteria:**
- GIVEN user has access to WH-001 only, WHEN viewing inventory module, THEN only WH-001 inventory displays
- GIVEN admin assigns warehouse access in user profile, WHEN user logs in, THEN only assigned warehouses appear in warehouse dropdown filters
- GIVEN user has no warehouse access assigned, WHEN accessing warehouse-dependent modules, THEN error message "No warehouse access configured" displays
- GIVEN super_admin or admin role, WHEN accessing any module, THEN all warehouses are accessible (bypass restriction)
- GIVEN user warehouse access is changed, WHEN user refreshes page, THEN new access permissions apply immediately

**Business Rules:**
- Default: New users have NO warehouse access (must be explicitly granted)
- Exception: super_admin and admin roles bypass restrictions (access all)
- Access levels: read, write (future: admin per warehouse)
- Cascading delete: If warehouse is deleted, remove all user_warehouse_access records
- Audit: Track who granted/revoked access and when

**UI/UX:**
- User profile modal: Multi-select dropdown for warehouse access assignment
- Warehouse filter: Only show warehouses user has access to
- Error handling: Clear message if user tries to access restricted warehouse

**API:**
- GET /api/settings/users/:id/warehouse-access
- PUT /api/settings/users/:id/warehouse-access

**Database:**
- Table: user_warehouse_access (user_id, warehouse_id, access_level, created_at, created_by)

**Related:**
- Wireframe: SET-009 (User Create/Edit Modal, lines 49-105)
- Architecture: user_warehouse_access table (lines 338-348)

---

### 2.4 Phase 1A - Roles & Permissions Requirements

#### FR-SET-020 to FR-SET-029: Role Definitions

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Roles

**Description:**
Ten predefined roles with specific access levels and permissions. Roles are system-defined and not editable.

**Acceptance Criteria:**
- GIVEN role "Super Admin" assigned, WHEN user accesses any module, THEN full CRUD access granted
- GIVEN role "Admin" assigned, WHEN user accesses Settings, THEN full CRUD access except Super Admin assignment
- GIVEN role "Production Manager" assigned, WHEN user accesses Production, THEN full CRUD access granted
- GIVEN role "Production Manager" assigned, WHEN user accesses Settings, THEN read-only access granted
- GIVEN role "Quality Manager" assigned, WHEN user accesses Quality, THEN full CRUD access granted
- GIVEN role "Quality Manager" assigned, WHEN user accesses Production, THEN read-only access granted
- GIVEN role "Warehouse Manager" assigned, WHEN user accesses Warehouse, THEN full CRUD access granted
- GIVEN role "Production Operator" assigned, WHEN user accesses Production, THEN create/read/update access (no delete)
- GIVEN role "Quality Inspector" assigned, WHEN user accesses Quality, THEN create/read/update access (no delete)
- GIVEN role "Warehouse Operator" assigned, WHEN user accesses Warehouse, THEN create/read/update access (no delete)
- GIVEN role "Planner" assigned, WHEN user accesses Planning, THEN full CRUD access granted
- GIVEN role "Viewer" assigned, WHEN user accesses any module, THEN read-only access (no create/update/delete)

---

#### FR-SET-030: Module-Level Permissions

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Roles

**Description:**
Permissions are scoped at the module level, controlling access to entire functional areas.

**Acceptance Criteria:**
- GIVEN user has no Production module permission, WHEN navigating to `/production/*`, THEN redirect to dashboard with "Access Denied"
- GIVEN user has read-only Production permission, WHEN on production page, THEN "Create" and "Edit" buttons hidden
- GIVEN user has full Production permission, WHEN on production page, THEN all action buttons visible
- GIVEN module is disabled for organization, WHEN user with permission accesses it, THEN "Module not enabled" message displays
- GIVEN user role changes from Viewer to Admin, WHEN page refreshes, THEN full permissions active immediately
- GIVEN API request to `/api/v1/production/work-orders` by user without Production access, WHEN request processed, THEN 403 Forbidden returns

---

#### FR-SET-031: CRUD-Level Permissions

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Roles

**Description:**
Fine-grained permissions at Create/Read/Update/Delete level within each module.

**Acceptance Criteria:**
- GIVEN user has "CRU" permission (no Delete), WHEN delete button shown, THEN button disabled or hidden
- GIVEN user has "R" permission only, WHEN create form accessed via URL, THEN redirect with "Permission denied"
- GIVEN user has "CRUD" permission, WHEN any operation attempted, THEN operation succeeds
- GIVEN user has "CR" permission, WHEN update attempted, THEN 403 Forbidden returns from API
- GIVEN permission check fails, WHEN API returns 403, THEN UI displays "You don't have permission to perform this action"
- GIVEN user permissions cached, WHEN role updated by admin, THEN user's next request uses updated permissions (no stale cache)

---

### 2.5 Phase 1A - Module Toggles Requirements

#### FR-SET-090: Module Activation/Deactivation

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Modules

**Description:**
Enable or disable modules for the organization. Disabled modules are hidden from navigation and inaccessible.

**Acceptance Criteria:**
- GIVEN admin navigates to `/settings/modules`, WHEN page loads, THEN all 7 modules display with toggle switches
- GIVEN Production module is disabled, WHEN user views navigation, THEN "Production" menu item hidden
- GIVEN Production module is disabled, WHEN user navigates to `/production/dashboard` directly, THEN redirect with "Module not enabled"
- GIVEN admin enables Warehouse module, WHEN toggle switched ON, THEN "Warehouse" appears in navigation within 1 second
- GIVEN admin disables Planning module with active work orders, WHEN toggle switched OFF, THEN warning "Module has active data. Disable anyway?" displays
- GIVEN module disabled, WHEN API endpoint for that module called, THEN 403 "Module not enabled for this organization" returns
- GIVEN all modules disabled except Settings, WHEN user logs in, THEN only Settings accessible in navigation

---

#### FR-SET-091 to FR-SET-096: Individual Module Toggles

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Modules

**Description:**
Toggle switches for each core module: Planning, Production, Quality, Warehouse, Shipping, Technical.

**Acceptance Criteria:**
- GIVEN Technical module toggle ON, WHEN user accesses Products page, THEN page loads successfully
- GIVEN Planning module toggle OFF, WHEN user attempts to create work order, THEN action blocked
- GIVEN Production module toggle ON, WHEN user accesses execution page, THEN page loads successfully
- GIVEN Quality module toggle OFF, WHEN quality menu item checked, THEN menu item hidden
- GIVEN Warehouse module toggle ON, WHEN inventory checked, THEN inventory features accessible
- GIVEN Shipping module toggle OFF, WHEN shipping navigation checked, THEN shipping hidden from menu
- GIVEN module status changes, WHEN navigation re-renders, THEN change reflected within 500ms (no page reload required)

---

#### FR-SET-097: Module Dependency Validation

**Priority:** P1 (MVP)
**Phase:** 1A
**Module Area:** Modules

**Description:**
Validate module dependencies when enabling/disabling modules. Some modules require others to function.

**Acceptance Criteria:**
- GIVEN Production module requires Technical module, WHEN admin enables Production while Technical is OFF, THEN warning "Production requires Technical module. Enable Technical first?" displays
- GIVEN Quality module requires Production module, WHEN admin disables Production while Quality is ON, THEN warning "Quality depends on Production. Disable Quality also?" displays
- GIVEN dependency warning shown, WHEN admin confirms, THEN dependent module enabled/disabled automatically
- GIVEN dependency warning shown, WHEN admin cancels, THEN no changes made
- GIVEN Shipping requires Warehouse, WHEN Shipping enabled without Warehouse, THEN auto-enable Warehouse with notification

**Module Dependencies:**
| Module | Requires |
|--------|----------|
| Technical | None (standalone) |
| Planning | Technical |
| Production | Technical, Planning |
| Quality | Production |
| Warehouse | Technical |
| Shipping | Warehouse |

---

### 2.6 Phase 1B - Multi-Language Requirements

> **Note:** Multi-language support (FR-SET-110 to FR-SET-116) was deferred from Phase 1A to Phase 1B.
> See "Multi-Language Deferral Justification" section below for details.

#### FR-SET-110: Language Selection

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Support for 4 languages: Polish, English, German, and French. Users can select their preferred language.

**Acceptance Criteria:**
- GIVEN user profile page open, WHEN language dropdown clicked, THEN PL, EN, DE, FR options display
- GIVEN user selects "Polski", WHEN selection saved, THEN entire UI displays in Polish within 500ms
- GIVEN user selects "English", WHEN selection saved, THEN entire UI displays in English
- GIVEN user selects "Deutsch", WHEN selection saved, THEN entire UI displays in German
- GIVEN user selects "Francais", WHEN selection saved, THEN entire UI displays in French
- GIVEN language changed, WHEN page does not reload, THEN all visible text updates dynamically (SPA behavior)
- GIVEN unsupported language requested via API, WHEN request processed, THEN fallback to English

---

#### FR-SET-111: UI Translation Management

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Manage UI translations for all supported languages. Translations are stored in the database and can be updated without code deployment.

**Acceptance Criteria:**
- GIVEN admin navigates to translation management, WHEN page loads, THEN all translation keys display with values for each language
- GIVEN translation key "settings.title" exists, WHEN admin updates Polish value, THEN change reflects immediately for Polish users
- GIVEN new feature added with missing translation, WHEN UI renders, THEN English fallback displays
- GIVEN translation export requested, WHEN export completes, THEN JSON/CSV file downloads with all translations

---

#### FR-SET-112: User-Level Language Preference

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Each user can set their own language preference, overriding the organization default.

**Acceptance Criteria:**
- GIVEN organization default is Polish, WHEN new user created, THEN user language defaults to Polish
- GIVEN organization default is Polish, WHEN user sets preference to English, THEN UI displays in English for that user only
- GIVEN user A has English, user B has Polish, WHEN both logged in, THEN each sees their preferred language
- GIVEN user preference is null, WHEN user logs in, THEN organization default language used
- GIVEN user changes language, WHEN change saved, THEN preference persists across sessions

---

#### FR-SET-113: Organization Default Language

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Set organization-wide default language for new users and system communications.

**Acceptance Criteria:**
- GIVEN admin sets org default to German, WHEN new user invited, THEN invitation email sent in German
- GIVEN admin sets org default to French, WHEN new user completes registration, THEN user.language defaults to French
- GIVEN org default changed from EN to PL, WHEN existing users without preference login, THEN they see Polish
- GIVEN org default changed, WHEN users with explicit preference login, THEN their preference unchanged

---

#### FR-SET-114: Date/Time Format Localization

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Display dates and times according to locale conventions.

**Acceptance Criteria:**
- GIVEN locale is "en-US", WHEN date displayed, THEN format is "MM/DD/YYYY" (12/25/2025)
- GIVEN locale is "pl-PL", WHEN date displayed, THEN format is "DD.MM.YYYY" (25.12.2025)
- GIVEN locale is "de-DE", WHEN date displayed, THEN format is "DD.MM.YYYY" (25.12.2025)
- GIVEN locale is "en-US", WHEN time displayed, THEN 12-hour format with AM/PM (2:30 PM)
- GIVEN locale is "pl-PL", WHEN time displayed, THEN 24-hour format (14:30)
- GIVEN datetime picker opened, WHEN locale is pl-PL, THEN first day of week is Monday
- GIVEN datetime picker opened, WHEN locale is en-US, THEN first day of week is Sunday

---

#### FR-SET-115: Number Format Localization

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Display numbers according to locale conventions (decimal separator, thousands separator).

**Acceptance Criteria:**
- GIVEN locale is "en-US", WHEN number 1234.56 displayed, THEN format is "1,234.56"
- GIVEN locale is "pl-PL", WHEN number 1234.56 displayed, THEN format is "1 234,56"
- GIVEN locale is "de-DE", WHEN number 1234.56 displayed, THEN format is "1.234,56"
- GIVEN currency display, WHEN locale changes, THEN currency position and format update accordingly

---

#### FR-SET-116: Translation Fallback

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Localization

**Description:**
Fallback to English when translation is missing for selected language.

**Acceptance Criteria:**
- GIVEN translation for "New Feature" missing in Polish, WHEN UI renders in Polish, THEN "New Feature" displays in English
- GIVEN all translations present for German, WHEN UI renders in German, THEN no English fallbacks visible
- GIVEN translation key missing entirely, WHEN UI renders, THEN key displays as-is (e.g., "settings.new_label")
- GIVEN fallback used, WHEN console checked (dev mode), THEN warning "Missing translation: settings.new_label for pl" logged

---

#### Multi-Language Deferral Justification

**Date:** 2025-12-15
**Decision:** Defer multi-language support (FR-SET-110 to FR-SET-116) from Phase 1A to Phase 1B
**Affected Requirements:** FR-SET-110, FR-SET-111, FR-SET-112, FR-SET-113, FR-SET-114, FR-SET-115, FR-SET-116

**Rationale:**
1. **Phase 1A Focus:** Core functionality (authentication, users, organizations, roles, module toggles, onboarding wizard) takes priority
2. **MVP Viability:** English-only MVP is sufficient for initial customers and market validation
3. **Complexity Reduction:** Multi-language adds i18n infrastructure complexity without blocking core workflows
4. **UI Stabilization:** Phase 1B timing allows UI patterns to stabilize before adding translation layer
5. **Epic 01 Scope:** Epic 01 already contains 7 stories (maximum recommended); adding multi-language would exceed optimal batch size

**Impact:**
- MVP launches English-only
- Multi-language added in Phase 1B alongside infrastructure configuration
- No technical debt created: i18n library already chosen (next-intl), translation keys reserved in codebase

**Technical Preparation (Phase 1A):**
- Install next-intl package
- Configure i18n routing structure
- Use translation keys in new components (hardcoded English values for MVP)
- Translation files created with English values only

**Related Epic:**
- Epic 01: Core Settings (7 stories) - Phase 1A
- Epic 01b: Infrastructure Config (includes multi-language story) - Phase 1B

---

### 2.7 Phase 1B - Infrastructure Requirements

#### FR-SET-040: Warehouse CRUD

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Create, read, update, and delete warehouse records. Warehouses are the top-level physical storage locations.

**Acceptance Criteria:**
- GIVEN admin navigates to `/settings/warehouses`, WHEN page loads, THEN warehouse list displays within 300ms
- GIVEN admin clicks "Add Warehouse", WHEN modal opens, THEN form displays code, name, type, address fields
- GIVEN admin enters warehouse code "WH-001", WHEN save clicked, THEN warehouse created and appears in list
- GIVEN warehouse code "WH-001" exists, WHEN admin creates another with same code, THEN error "Warehouse code must be unique" displays
- GIVEN warehouse has active inventory (LPs), WHEN delete attempted, THEN error "Cannot delete warehouse with inventory" displays
- GIVEN warehouse has no inventory, WHEN delete confirmed, THEN warehouse removed (soft delete) within 500ms
- GIVEN admin updates warehouse name, WHEN save clicked, THEN updated name displays immediately
- GIVEN warehouse list has 20 items, WHEN admin searches "main", THEN matching warehouses filter within 200ms

---

#### FR-SET-041: Warehouse Type

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Categorize warehouses by type to control inventory flow and business rules.

**Acceptance Criteria:**
- GIVEN warehouse type dropdown, WHEN opened, THEN options display: Raw Materials, WIP, Finished Goods, Quarantine, General
- GIVEN warehouse type is "Quarantine", WHEN inventory moved here, THEN LP status changes to "QA Hold"
- GIVEN warehouse type is "Finished Goods", WHEN raw material LP moved here, THEN warning "Product type mismatch" displays
- GIVEN warehouse type is "Raw Materials", WHEN receiving PO, THEN this warehouse suggested as default destination
- GIVEN warehouse type changed from "General" to "Quarantine", WHEN existing LPs checked, THEN existing LP statuses unchanged (manual review required)

---

#### FR-SET-042: Location Hierarchy

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Create hierarchical storage locations within warehouses: Zone > Aisle > Rack > Bin.

**Acceptance Criteria:**
- GIVEN warehouse exists, WHEN admin creates zone "ZONE-A", THEN zone appears under warehouse in tree view
- GIVEN zone exists, WHEN admin creates aisle "AISLE-01" under zone, THEN aisle appears as child of zone
- GIVEN aisle exists, WHEN admin creates rack "RACK-A1" under aisle, THEN rack appears as child of aisle
- GIVEN rack exists, WHEN admin creates bin "BIN-001" under rack, THEN bin appears as child of rack
- GIVEN location tree displayed, WHEN admin clicks expand on zone, THEN child locations display within 200ms
- GIVEN location has child locations, WHEN delete attempted, THEN error "Delete child locations first" displays
- GIVEN location has inventory, WHEN delete attempted, THEN error "Location has inventory" displays
- GIVEN location path is "WH-001/ZONE-A/AISLE-01/RACK-A1/BIN-001", WHEN location searched, THEN full path displays

---

#### FR-SET-050: Machine CRUD

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Register and manage production machines/equipment within the organization.

**Acceptance Criteria:**
- GIVEN admin navigates to `/settings/machines`, WHEN page loads, THEN machine list displays within 300ms
- GIVEN admin clicks "Add Machine", WHEN modal opens, THEN form displays code, name, type, capacity fields
- GIVEN admin enters machine code "MIX-001", WHEN save clicked, THEN machine created with status "Active"
- GIVEN machine code "MIX-001" exists, WHEN duplicate code entered, THEN error "Machine code must be unique" displays
- GIVEN machine is assigned to production line, WHEN delete attempted, THEN error "Machine is assigned to line [LINE-001]" displays
- GIVEN machine has no assignments, WHEN delete confirmed, THEN machine removed within 500ms
- GIVEN machine list has 50 items, WHEN admin filters by type "Mixer", THEN only mixers display within 200ms

---

#### FR-SET-052: Machine Status

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Track machine operational status: Active, Maintenance, Offline.

**Acceptance Criteria:**
- GIVEN machine created, WHEN no status specified, THEN default status is "Active"
- GIVEN machine status is "Active", WHEN admin changes to "Maintenance", THEN status updates immediately
- GIVEN machine status is "Maintenance", WHEN work order assigned to this machine, THEN warning "Machine is in maintenance" displays
- GIVEN machine status is "Offline", WHEN scheduling attempted, THEN error "Machine is offline" blocks assignment
- GIVEN machine status changed, WHEN production dashboard viewed, THEN status reflected in machine availability
- GIVEN machine status is "Active", WHEN OEE calculated, THEN machine included in availability calculation
- GIVEN machine status is "Offline", WHEN OEE calculated, THEN machine excluded from availability calculation

---

#### FR-SET-060: Production Line CRUD

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Create and manage production lines, which are ordered sequences of machines.

**Acceptance Criteria:**
- GIVEN admin navigates to `/settings/production-lines`, WHEN page loads, THEN line list displays within 300ms
- GIVEN admin clicks "Add Line", WHEN modal opens, THEN form displays code, name, description fields
- GIVEN admin enters line code "LINE-A", WHEN save clicked, THEN line created with status "Active"
- GIVEN line code "LINE-A" exists, WHEN duplicate code entered, THEN error "Line code must be unique" displays
- GIVEN line has active work orders, WHEN delete attempted, THEN error "Line has active work orders" displays
- GIVEN line has no work orders, WHEN delete confirmed, THEN line removed within 500ms
- GIVEN line deleted, WHEN machines checked, THEN machines remain (only assignment removed)

---

#### FR-SET-061: Machine Assignment to Lines

**Priority:** P0 (MVP)
**Phase:** 1B
**Module Area:** Infrastructure

**Description:**
Assign machines to production lines with defined sequence/order.

**Acceptance Criteria:**
- GIVEN production line exists, WHEN admin clicks "Add Machine", THEN available machines dropdown displays
- GIVEN machine "MIX-001" selected, WHEN "Add" clicked, THEN machine appears in line with sequence 1
- GIVEN line has 3 machines, WHEN admin drags MIX-001 from position 1 to 3, THEN sequence updates to reflect new order
- GIVEN machine assigned to LINE-A, WHEN same machine assigned to LINE-B, THEN assignment succeeds (machine can be on multiple lines)
- GIVEN machine removed from line, WHEN line configuration saved, THEN machine no longer appears in line sequence
- GIVEN machine with "Offline" status, WHEN assigned to line, THEN warning "Machine is offline" displays but assignment allowed

---

### 2.8 Phase 1B - Audit Trail Requirements

#### FR-SET-140: User Action Logging

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Audit

**Description:**
Log all significant user actions for audit and compliance purposes.

**Acceptance Criteria:**
- GIVEN user creates a product, WHEN action completes, THEN audit log entry created with action "CREATE", entity "products", user_id, timestamp
- GIVEN user updates warehouse name, WHEN save completes, THEN audit log entry created with before/after values
- GIVEN user deletes a machine, WHEN delete completes, THEN audit log entry created with deleted entity data
- GIVEN audit log entry created, WHEN timestamp checked, THEN timestamp accurate to millisecond
- GIVEN 1000 actions performed, WHEN audit log queried, THEN all 1000 entries retrievable
- GIVEN audit log entry exists, WHEN modification attempted, THEN modification rejected (immutable)

**Logged Actions:**
| Action | Logged Data |
|--------|-------------|
| CREATE | Entity type, entity ID, created values, user ID, timestamp |
| UPDATE | Entity type, entity ID, before values, after values, user ID, timestamp |
| DELETE | Entity type, entity ID, deleted values, user ID, timestamp |
| LOGIN | User ID, IP address, user agent, timestamp |
| LOGOUT | User ID, session duration, timestamp |

---

#### FR-SET-141: Data Change Tracking

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Audit

**Description:**
Track field-level changes with before and after values for compliance auditing.

**Acceptance Criteria:**
- GIVEN product price changed from 10.00 to 12.50, WHEN audit log viewed, THEN shows `{price: {old: 10.00, new: 12.50}}`
- GIVEN user email changed, WHEN audit log viewed, THEN old and new email values displayed
- GIVEN multiple fields changed in single save, WHEN audit log viewed, THEN all changed fields in single entry
- GIVEN sensitive field (password hash) changed, WHEN audit log viewed, THEN value shows "[REDACTED]" not actual hash
- GIVEN no fields changed (save clicked without edits), WHEN audit checked, THEN no audit entry created

---

#### FR-SET-142: Login/Logout Tracking

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Audit

**Description:**
Track authentication events including successful logins, failed attempts, and logouts.

**Acceptance Criteria:**
- GIVEN user logs in successfully, WHEN audit queried, THEN entry shows LOGIN, user_id, IP, user_agent, timestamp
- GIVEN user logout clicked, WHEN audit queried, THEN entry shows LOGOUT, user_id, session_duration, timestamp
- GIVEN login fails (wrong password), WHEN audit queried, THEN entry shows LOGIN_FAILED, email, IP, timestamp
- GIVEN 5 consecutive failed logins, WHEN audit queried, THEN all 5 failed attempts visible with timestamps
- GIVEN session expires (timeout), WHEN audit queried, THEN entry shows SESSION_EXPIRED, user_id, timestamp

---

#### FR-SET-143: Audit Log Search/Filter

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Audit

**Description:**
Search and filter audit logs by user, action, entity, and date range.

**Acceptance Criteria:**
- GIVEN admin navigates to `/settings/audit-logs`, WHEN page loads, THEN most recent 100 entries display within 1 second
- GIVEN filter by user "john@company.com", WHEN applied, THEN only John's actions display
- GIVEN filter by action "DELETE", WHEN applied, THEN only delete actions display
- GIVEN filter by entity "products", WHEN applied, THEN only product-related actions display
- GIVEN filter by date range "2025-12-01 to 2025-12-10", WHEN applied, THEN only actions in that range display
- GIVEN multiple filters applied, WHEN search executed, THEN filters AND together (all conditions must match)
- GIVEN search text "WH-001", WHEN entered, THEN entries containing "WH-001" in any field display
- GIVEN 100,000 audit entries exist, WHEN filtered query runs, THEN results return within 2 seconds

---

### 2.9 Phase 1B - Security Requirements

#### FR-SET-171: Session Timeout Configuration

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Security

**Description:**
Configure session timeout duration for the organization.

**Acceptance Criteria:**
- GIVEN admin navigates to security settings, WHEN timeout options viewed, THEN options display: 1h, 4h, 8h, 24h, Never
- GIVEN timeout set to 8 hours, WHEN user inactive for 8 hours, THEN session expires on next request
- GIVEN timeout set to 24 hours (default), WHEN user active within 24 hours, THEN session remains valid
- GIVEN timeout changed from 24h to 1h, WHEN existing sessions checked, THEN existing sessions use old timeout until refresh
- GIVEN "Never" selected, WHEN configuration saved, THEN warning "Sessions will never expire. This is not recommended." displays
- GIVEN session expired, WHEN user makes request, THEN redirect to login with "Session expired" message

---

#### FR-SET-172: Password Complexity Rules

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Security

**Description:**
Configure organization-wide password complexity requirements beyond defaults.

**Acceptance Criteria:**
- GIVEN admin navigates to security settings, WHEN password rules viewed, THEN current requirements display
- GIVEN minimum length set to 12, WHEN user creates 8-character password, THEN error "Password must be at least 12 characters"
- GIVEN "require special character" enabled, WHEN password without special char submitted, THEN error displays
- GIVEN password complexity increased, WHEN existing users login, THEN no immediate impact (enforced on password change only)
- GIVEN password rules changed, WHEN next password reset, THEN new rules enforced
- GIVEN rules allow minimum 8 chars, WHEN admin sets minimum to 6, THEN warning "Minimum 8 characters recommended for security"

---

#### FR-SET-173: Failed Login Attempt Limits

**Priority:** P1 (MVP)
**Phase:** 1B
**Module Area:** Security

**Description:**
Limit failed login attempts to prevent brute force attacks.

**Acceptance Criteria:**
- GIVEN failed attempt limit set to 5, WHEN 5 incorrect passwords entered, THEN account locked for 15 minutes
- GIVEN account locked, WHEN correct password entered, THEN error "Account temporarily locked. Try again in X minutes"
- GIVEN account locked, WHEN 15 minutes pass, THEN account unlocks automatically
- GIVEN account locked, WHEN admin manually unlocks, THEN user can login immediately
- GIVEN failed attempt occurred, WHEN correct password entered before limit, THEN login succeeds and counter resets
- GIVEN lockout notification enabled, WHEN account locked, THEN email sent to user "Your account has been temporarily locked"
- GIVEN admin views user, WHEN user is locked, THEN "Locked" status and "Unlock" button display

---

### 2.10 Onboarding Wizard Requirements

**Competitive Differentiator:** MonoPilot's #1 competitive advantage. Competitors require weeks/months for setup - MonoPilot targets **15-minute onboarding** from signup to first work order.

**Scanner Support:** No (desktop only)

---

#### FR-SET-180: Setup Wizard Launcher

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Automatically detect first-time login for new organizations and launch the guided setup wizard. The wizard should appear immediately after successful authentication for users who have not completed or skipped onboarding.

**Acceptance Criteria:**

```gherkin
Feature: Setup Wizard Launcher
  As a new organization admin
  I want to be guided through initial setup
  So that I can start using MonoPilot within 15 minutes

  Scenario: First login triggers wizard
    Given a user logs in for the first time after organization creation
    And the organization has not completed onboarding
    When the authentication is successful
    Then the setup wizard modal should appear automatically
    And the wizard should display step 1 (Organization Profile)
    And a progress indicator should show "Step 1 of 6"

  Scenario: Returning user with incomplete wizard
    Given a user previously started but did not complete the wizard
    And the user logs in again
    When the authentication is successful
    Then the wizard should resume from the last incomplete step
    And the progress indicator should reflect completed steps

  Scenario: Completed wizard does not reappear
    Given an organization has completed the onboarding wizard
    When any user from that organization logs in
    Then the wizard should not appear
    And the user should land on the main dashboard
```

**Business Rules:**
- Wizard trigger is per-organization, not per-user
- Only Admin or Super Admin roles can complete the wizard
- Other users see a "Setup in progress" message if wizard is incomplete

---

#### FR-SET-181: Organization Profile Step

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
First wizard step collects essential organization information: name, address, timezone, and preferred language. This step pre-populates fields from registration data where available.

**Acceptance Criteria:**

```gherkin
Feature: Organization Profile Step
  As a new admin
  I want to configure my organization profile
  So that MonoPilot is personalized for my business

  Scenario: Complete organization profile
    Given the wizard is on step 1 (Organization Profile)
    When I enter the organization name "Bakery Fresh Ltd"
    And I enter the address "123 Main St, Warsaw, Poland"
    And I select timezone "Europe/Warsaw"
    And I select language "Polish"
    And I click "Next"
    Then the data should be saved to the organizations table
    And the wizard should advance to step 2 (Warehouse)
    And the progress indicator should update to "Step 2 of 6"

  Scenario: Pre-populated fields from registration
    Given the user registered with organization name "My Food Co"
    When the wizard loads step 1
    Then the organization name field should be pre-filled with "My Food Co"
    And the timezone should default to browser-detected timezone
    And the language should default to browser language (if supported)

  Scenario: Validation on required fields
    Given the wizard is on step 1
    When I leave the organization name empty
    And I click "Next"
    Then an error message "Organization name is required" should appear
    And the wizard should not advance

  Scenario: Navigate back (disabled on first step)
    Given the wizard is on step 1
    Then the "Back" button should be disabled or hidden
```

**Fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| Organization Name | Text | Yes | 2-100 characters |
| Address Line 1 | Text | No | Max 200 characters |
| Address Line 2 | Text | No | Max 200 characters |
| City | Text | No | Max 100 characters |
| Country | Dropdown | Yes | ISO 3166-1 country list |
| Postal Code | Text | No | Max 20 characters |
| Timezone | Dropdown | Yes | IANA timezone list |
| Language | Dropdown | Yes | PL, EN, DE, FR |

---

#### FR-SET-182: First Warehouse Creation Step

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Second wizard step guides the user to create their first warehouse. Provides simplified form with sensible defaults for small manufacturers. Explains warehouse types with tooltips.

**Acceptance Criteria:**

```gherkin
Feature: First Warehouse Creation Step
  As a new admin
  I want to create my first warehouse
  So that I have a location to store inventory

  Scenario: Create first warehouse with defaults
    Given the wizard is on step 2 (Warehouse)
    When I enter warehouse code "WH-MAIN"
    And I enter warehouse name "Main Warehouse"
    And I select warehouse type "General"
    And I click "Next"
    Then a warehouse record should be created with status "active"
    And it should be set as the default warehouse
    And the wizard should advance to step 3 (Location)

  Scenario: Warehouse type explanation tooltips
    Given the wizard is on step 2
    When I hover over the warehouse type dropdown
    Then tooltips should explain each type:
      | Type | Tooltip |
      | Raw Materials | Store incoming ingredients and packaging |
      | Work in Progress | For items currently in production |
      | Finished Goods | Completed products ready for shipping |
      | Quarantine | Items on hold for quality inspection |
      | General | Multi-purpose warehouse (recommended for small operations) |

  Scenario: Skip warehouse step (use demo data)
    Given the wizard is on step 2
    When I click "Skip - Use Demo Warehouse"
    Then a demo warehouse "DEMO-WH" should be created
    And the wizard should advance to step 3
    And a note should indicate demo data can be edited later

  Scenario: Navigate back to organization profile
    Given the wizard is on step 2
    When I click "Back"
    Then the wizard should return to step 1
    And previously entered warehouse data should be preserved
```

**Fields:**
| Field | Type | Required | Default |
|---|---|---|---|
| Warehouse Code | Text | Yes | Auto-generated "WH-001" |
| Warehouse Name | Text | Yes | - |
| Warehouse Type | Dropdown | Yes | "General" |
| Address | Text | No | Copies from org address |

---

#### FR-SET-183: First Location Setup Step

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Third wizard step creates the first storage location within the warehouse. Offers quick templates for common setups (single location, basic zones, or full hierarchy).

**Acceptance Criteria:**

```gherkin
Feature: First Location Setup Step
  As a new admin
  I want to create storage locations
  So that I can organize inventory in my warehouse

  Scenario: Create single default location
    Given the wizard is on step 3 (Location)
    And I select template "Simple - Single Location"
    When I click "Next"
    Then a location "LOC-DEFAULT" should be created in the warehouse
    And the wizard should advance to step 4 (Product)

  Scenario: Create basic zone structure
    Given the wizard is on step 3
    And I select template "Basic - 3 Zones"
    When I click "Next"
    Then the following locations should be created:
      | Code | Name | Type |
      | RAW-ZONE | Raw Materials Zone | Zone |
      | PROD-ZONE | Production Zone | Zone |
      | FG-ZONE | Finished Goods Zone | Zone |
    And the wizard should advance to step 4

  Scenario: Create custom location manually
    Given the wizard is on step 3
    And I select template "Custom"
    When I enter location code "SHELF-A1"
    And I enter location name "Shelf A Row 1"
    And I select location type "Shelf"
    And I click "Add Location"
    Then the location should appear in the preview list
    And I can add more locations or click "Next" to continue

  Scenario: Skip location step
    Given the wizard is on step 3
    When I click "Skip - Create Locations Later"
    Then a default location "DEFAULT" should be created
    And the wizard should advance to step 4
```

**Location Templates:**
| Template | Locations Created | Best For |
|---|---|---|
| Simple - Single Location | 1 (DEFAULT) | Very small operations |
| Basic - 3 Zones | 3 (RAW, PROD, FG) | Small manufacturers |
| Full Hierarchy | 9 (3 zones x 3 shelves) | Growing operations |
| Custom | User-defined | Specific requirements |

---

#### FR-SET-184: First Product Creation Step (Guided)

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Fourth wizard step guides creation of the first product with a simplified form. Includes industry-specific templates (bakery, dairy, beverages, etc.) to pre-fill common configurations.

**Acceptance Criteria:**

```gherkin
Feature: First Product Creation Step
  As a new admin
  I want to create my first product
  So that I can start planning production

  Scenario: Create product from industry template
    Given the wizard is on step 4 (Product)
    And I select industry "Bakery"
    When I select template "Bread Loaf"
    Then the form should pre-fill:
      | Field | Value |
      | Product Type | Finished Good |
      | Unit of Measure | EA (Each) |
      | Shelf Life Days | 7 |
      | Storage Temp | Ambient |
    And I can modify any pre-filled values
    When I enter product name "Whole Wheat Bread"
    And I enter SKU "WWB-001"
    And I click "Create Product"
    Then the product should be saved to the products table
    And the wizard should advance to step 5

  Scenario: Create product without template
    Given the wizard is on step 4
    When I click "Start from Scratch"
    Then an empty product form should appear
    And all fields should be editable
    And helper tooltips should explain each field

  Scenario: Product validation
    Given the wizard is on step 4
    When I enter a SKU that already exists
    And I click "Create Product"
    Then an error "SKU already exists" should appear
    And the product should not be created

  Scenario: Skip product step
    Given the wizard is on step 4
    When I click "Skip - Create Products Later"
    Then the wizard should advance to step 5
    And a note should indicate products must be created before work orders
```

**Industry Templates:**
| Industry | Templates Available |
|---|---|
| Bakery | Bread Loaf, Pastry, Cookie, Cake |
| Dairy | Milk, Cheese, Yogurt, Butter |
| Beverages | Juice, Soft Drink, Water, Energy Drink |
| Meat Processing | Sausage, Ham, Bacon, Deli Meat |
| Snacks | Chips, Crackers, Nuts, Candy |
| Prepared Foods | Ready Meal, Salad, Soup, Sauce |

---

#### FR-SET-185: First Work Order Creation Step (Optional Demo)

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Fifth wizard step demonstrates work order creation with the product created in step 4. This step is optional and creates a demo work order to show the production workflow.

**Acceptance Criteria:**

```gherkin
Feature: First Work Order Creation Step
  As a new admin
  I want to see how work orders work
  So that I understand the production process

  Scenario: Create demo work order
    Given the wizard is on step 5 (Work Order)
    And a product "Whole Wheat Bread" was created in step 4
    When I enter quantity "100"
    And I select due date "tomorrow"
    And I click "Create Demo Work Order"
    Then a work order should be created with status "Draft"
    And the wizard should advance to step 6 (Completion)
    And a success message should explain next steps

  Scenario: Skip work order step (no product created)
    Given the wizard is on step 5
    And no product was created in step 4
    Then a message should display "Create a product first to demo work orders"
    And the "Create Demo Work Order" button should be disabled
    And a "Skip to Finish" button should be available

  Scenario: Skip work order step (product exists)
    Given the wizard is on step 5
    And a product was created
    When I click "Skip - I'll Create Work Orders Later"
    Then the wizard should advance to step 6
    And no work order should be created

  Scenario: Work order explanation tooltips
    Given the wizard is on step 5
    Then tooltips should explain:
      | Element | Explanation |
      | Quantity | How many units to produce |
      | Due Date | When production should complete |
      | Status | Work orders start as Draft until scheduled |
```

**Demo Work Order Defaults:**
| Field | Default Value |
|---|---|
| Quantity | 100 |
| Due Date | Tomorrow |
| Status | Draft |
| Priority | Normal |

---

#### FR-SET-186: Wizard Progress Tracking and Resume

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Track wizard progress in the database to enable resume functionality. Users can close the wizard and continue later without losing progress. Admins can view onboarding status in settings.

**Acceptance Criteria:**

```gherkin
Feature: Wizard Progress Tracking and Resume
  As an admin
  I want my wizard progress saved
  So that I can complete setup across multiple sessions

  Scenario: Progress saved after each step
    Given the wizard is on step 2
    When I complete step 2 and advance to step 3
    Then the progress should be saved to the database
    And the organizations table should update onboarding_step to 3

  Scenario: Resume wizard from last step
    Given I completed steps 1-3 in a previous session
    And I log in again
    When the wizard launches
    Then it should open at step 4 (Product)
    And steps 1-3 should show checkmarks
    And I can navigate back to review previous steps

  Scenario: View onboarding status in settings
    Given I am an admin
    When I navigate to Settings > Organization
    Then I should see "Onboarding Status: Step 4 of 6"
    And a "Resume Setup Wizard" button should be available

  Scenario: Progress persists through page refresh
    Given the wizard is on step 3
    When I refresh the browser page
    Then the wizard should reopen at step 3
    And all previously entered data should be preserved
```

**Database Schema Addition:**
| Column | Type | Description |
|---|---|---|
| onboarding_step | INTEGER | Current step (0=not started, 7=completed) |
| onboarding_started_at | TIMESTAMP | When wizard was first shown |
| onboarding_completed_at | TIMESTAMP | When wizard was completed/skipped |
| onboarding_skipped | BOOLEAN | Whether wizard was skipped |

---

#### FR-SET-187: Skip Wizard Option

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Allow experienced users to skip the onboarding wizard entirely. Requires confirmation and creates minimal required data (demo warehouse, default location) to ensure system functionality.

**Acceptance Criteria:**

```gherkin
Feature: Skip Wizard Option
  As an experienced admin
  I want to skip the setup wizard
  So that I can configure MonoPilot my own way

  Scenario: Skip wizard with confirmation
    Given the wizard is displayed on any step
    When I click "Skip Setup Wizard"
    Then a confirmation dialog should appear:
      """
      Skip Onboarding Wizard?

      We'll create a demo warehouse and default location so you can
      start exploring MonoPilot immediately.

      You can configure everything manually in Settings.

      [Skip Wizard] [Continue Setup]
      """
    When I click "Skip Wizard"
    Then the wizard should close
    And demo data should be created:
      | Entity | Name | Code |
      | Warehouse | Demo Warehouse | DEMO-WH |
      | Location | Default Location | DEFAULT |
    And the user should land on the main dashboard
    And onboarding_skipped should be set to true

  Scenario: Cancel skip wizard
    Given the skip confirmation dialog is displayed
    When I click "Continue Setup"
    Then the dialog should close
    And the wizard should remain on the current step

  Scenario: Skipped wizard indicator in settings
    Given the wizard was skipped
    When I navigate to Settings > Organization
    Then I should see "Setup: Skipped (Demo data created)"
    And a "Run Setup Wizard" button should allow restarting

  Scenario: Skip button visible on all steps
    Given the wizard is on any step (1-6)
    Then a "Skip Setup Wizard" link should be visible
    And it should be styled as secondary action (not prominent)
```

---

#### FR-SET-188: Wizard Completion Celebration

**Priority:** P0 (MVP)
**Phase:** 1A
**Module Area:** Onboarding
**Scanner Support:** No

**Description:**
Final wizard step celebrates completion and guides users to next actions. Displays a summary of created items and suggests logical next steps based on what was configured.

**Acceptance Criteria:**

```gherkin
Feature: Wizard Completion Celebration
  As a new admin who completed setup
  I want to see what I accomplished
  So that I feel confident using MonoPilot

  Scenario: Display completion summary
    Given I completed all wizard steps
    When the wizard reaches step 6 (Completion)
    Then a celebration animation should play (confetti or similar)
    And a summary should display:
      """
      Congratulations! MonoPilot is ready.

      You created:
      - Organization: Bakery Fresh Ltd
      - Warehouse: Main Warehouse (WH-MAIN)
      - Locations: 3 zones
      - Product: Whole Wheat Bread (WWB-001)
      - Work Order: WO-0001 (Demo)

      Setup completed in: 12 minutes 34 seconds
      """

  Scenario: Suggested next steps
    Given the completion screen is displayed
    Then suggested next steps should appear:
      | Action | Description | Button |
      | Add Team Members | Invite your team to MonoPilot | Invite Users |
      | Create More Products | Build your product catalog | Go to Products |
      | Schedule Production | Plan your first production run | Open Planning |
      | Explore Settings | Fine-tune your configuration | Open Settings |

  Scenario: Close wizard and go to dashboard
    Given the completion screen is displayed
    When I click "Go to Dashboard"
    Then the wizard should close permanently
    And I should land on the main dashboard
    And the dashboard should show a welcome banner (dismissible)

  Scenario: Completion time tracking
    Given I started the wizard at 10:00:00
    And I completed the wizard at 10:14:22
    Then the completion summary should show "Setup completed in: 14 minutes 22 seconds"
    And this duration should be logged for analytics

  Scenario: Completion under 15 minutes shows badge
    Given setup was completed in under 15 minutes
    Then a badge should display: "Speed Setup Champion - Under 15 minutes!"
    And this achievement should be stored for the organization
```

**Next Steps Logic:**
| Condition | Suggested Next Steps |
|---|---|
| No work order created | "Create Your First Work Order" (prominent) |
| Single user | "Invite Team Members" (prominent) |
| Demo data used | "Replace Demo Data" (prominent) |
| All complete | Standard suggestions list |

---

## 3. Database Schema

### 3.1 Core Tables

| Table Name | Key Columns | Purpose |
|---|---|---|
| `organizations` | id, name, slug, timezone, locale, currency, onboarding_step, onboarding_completed_at, onboarding_skipped | Organization master data |
| `users` | id, org_id, email, role_id, language, active | User accounts |
| `roles` | id, name, code, permissions_json | Role definitions |
| `user_sessions` | id, user_id, token, expires_at | Active sessions |
| `user_invitations` | id, org_id, email, role_id, token, status | Pending invites |
| `warehouses` | id, org_id, code, name, type, address | Warehouse configuration |
| `locations` | id, warehouse_id, code, type, parent_id, capacity | Storage locations |
| `machines` | id, org_id, code, name, type, status, capacity | Machine registry |
| `production_lines` | id, org_id, code, name, capacity, status | Production lines |
| `line_machines` | id, line_id, machine_id, sequence | Line-machine mapping |
| `allergens` | id, code, name_pl, name_en, name_de, name_fr, icon | EU allergens (14) |
| `tax_codes` | id, org_id, code, rate, jurisdiction, valid_from, valid_to | Tax configuration |
| `modules` | id, code, name, active, dependencies | Module toggles |
| `organization_modules` | id, org_id, module_id, active | Org-module status |
| `subscriptions` | id, org_id, plan, seats, billing_cycle, status | Billing |
| `invoices` | id, org_id, amount, due_date, status | Invoice history |
| `api_keys` | id, org_id, key_hash, scopes, expires_at, last_used | API authentication |
| `webhooks` | id, org_id, url, events, secret, active | Webhook endpoints |
| `webhook_logs` | id, webhook_id, event, payload, response, status | Delivery logs |
| `audit_logs` | id, user_id, action, entity_type, entity_id, changes, ip | Audit trail |
| `translations` | id, key, pl, en, de, fr | UI translations |
| `notification_settings` | id, user_id, channel, event_type, enabled | User preferences |

### 3.2 Relationships Summary

- `organizations` -> 1:N -> `users`, `warehouses`, `machines`, `production_lines`
- `users` -> N:1 -> `roles`
- `warehouses` -> 1:N -> `locations` (hierarchical)
- `production_lines` -> N:N -> `machines` (via `line_machines`)
- `organizations` -> N:N -> `modules` (via `organization_modules`)

---

## 4. API Endpoints

### 4.1 Organization Endpoints

```
GET    /api/v1/settings/organization
PUT    /api/v1/settings/organization
PATCH  /api/v1/settings/organization/logo
```

### 4.2 User Management Endpoints

```
GET    /api/v1/settings/users
POST   /api/v1/settings/users
GET    /api/v1/settings/users/:id
PUT    /api/v1/settings/users/:id
DELETE /api/v1/settings/users/:id
PATCH  /api/v1/settings/users/:id/deactivate
PATCH  /api/v1/settings/users/:id/activate
GET    /api/v1/settings/users/:id/warehouse-access
PUT    /api/v1/settings/users/:id/warehouse-access
```

### 4.3 User Invitation Endpoints

```
POST   /api/v1/settings/invitations
GET    /api/v1/settings/invitations
DELETE /api/v1/settings/invitations/:id
POST   /api/v1/settings/invitations/:token/accept
```

### 4.4 Role Endpoints

```
GET    /api/v1/settings/roles
GET    /api/v1/settings/roles/:id
```

### 4.5 Warehouse Endpoints

```
GET    /api/v1/settings/warehouses
POST   /api/v1/settings/warehouses
GET    /api/v1/settings/warehouses/:id
PUT    /api/v1/settings/warehouses/:id
DELETE /api/v1/settings/warehouses/:id
```

### 4.6 Location Endpoints

```
GET    /api/v1/settings/warehouses/:warehouseId/locations
POST   /api/v1/settings/warehouses/:warehouseId/locations
GET    /api/v1/settings/locations/:id
PUT    /api/v1/settings/locations/:id
DELETE /api/v1/settings/locations/:id
GET    /api/v1/settings/locations/:id/tree
```

### 4.7 Machine Endpoints

```
GET    /api/v1/settings/machines
POST   /api/v1/settings/machines
GET    /api/v1/settings/machines/:id
PUT    /api/v1/settings/machines/:id
DELETE /api/v1/settings/machines/:id
PATCH  /api/v1/settings/machines/:id/status
```

### 4.8 Production Line Endpoints

```
GET    /api/v1/settings/production-lines
POST   /api/v1/settings/production-lines
GET    /api/v1/settings/production-lines/:id
PUT    /api/v1/settings/production-lines/:id
DELETE /api/v1/settings/production-lines/:id
POST   /api/v1/settings/production-lines/:id/machines
DELETE /api/v1/settings/production-lines/:id/machines/:machineId
PATCH  /api/v1/settings/production-lines/:id/machines/reorder
```

### 4.9 Allergen Endpoints

```
GET    /api/v1/settings/allergens
GET    /api/v1/settings/allergens/:id
POST   /api/v1/settings/allergens (custom allergens)
PUT    /api/v1/settings/allergens/:id
```

### 4.10 Tax Code Endpoints

```
GET    /api/v1/settings/tax-codes
POST   /api/v1/settings/tax-codes
GET    /api/v1/settings/tax-codes/:id
PUT    /api/v1/settings/tax-codes/:id
DELETE /api/v1/settings/tax-codes/:id
```

### 4.11 Module Endpoints

```
GET    /api/v1/settings/modules
PATCH  /api/v1/settings/modules/:id/toggle
GET    /api/v1/settings/modules/active
```

### 4.12 Subscription Endpoints

```
GET    /api/v1/settings/subscription
PUT    /api/v1/settings/subscription
GET    /api/v1/settings/subscription/plans
POST   /api/v1/settings/subscription/upgrade
POST   /api/v1/settings/subscription/downgrade
GET    /api/v1/settings/invoices
GET    /api/v1/settings/invoices/:id
```

### 4.13 Localization Endpoints

```
GET    /api/v1/settings/languages
PATCH  /api/v1/settings/language (user preference)
GET    /api/v1/settings/translations/:lang
```

### 4.14 API Key Endpoints

```
GET    /api/v1/settings/api-keys
POST   /api/v1/settings/api-keys
DELETE /api/v1/settings/api-keys/:id
GET    /api/v1/settings/api-keys/:id/usage
```

### 4.15 Webhook Endpoints

```
GET    /api/v1/settings/webhooks
POST   /api/v1/settings/webhooks
GET    /api/v1/settings/webhooks/:id
PUT    /api/v1/settings/webhooks/:id
DELETE /api/v1/settings/webhooks/:id
POST   /api/v1/settings/webhooks/:id/test
GET    /api/v1/settings/webhooks/:id/logs
```

### 4.16 Audit Trail Endpoints

```
GET    /api/v1/settings/audit-logs
GET    /api/v1/settings/audit-logs/:id
POST   /api/v1/settings/audit-logs/export
GET    /api/v1/settings/audit-logs/stats
```

### 4.17 Import/Export Endpoints

```
POST   /api/v1/settings/import/users
POST   /api/v1/settings/import/warehouses
POST   /api/v1/settings/import/machines
POST   /api/v1/settings/import/locations
GET    /api/v1/settings/export/users
GET    /api/v1/settings/export/warehouses
GET    /api/v1/settings/export/machines
GET    /api/v1/settings/export/template/:type
POST   /api/v1/settings/backup/create
POST   /api/v1/settings/backup/restore
```

### 4.18 Notification Endpoints

```
GET    /api/v1/settings/notifications
PUT    /api/v1/settings/notifications
GET    /api/v1/settings/notification-templates
```

### 4.19 Security Endpoints

```
GET    /api/v1/settings/security/ip-whitelist
POST   /api/v1/settings/security/ip-whitelist
DELETE /api/v1/settings/security/ip-whitelist/:id
GET    /api/v1/settings/security/policies
PUT    /api/v1/settings/security/policies
```

### 4.20 Onboarding Wizard Endpoints

```
GET    /api/v1/settings/onboarding/status
POST   /api/v1/settings/onboarding/step/:stepNumber
POST   /api/v1/settings/onboarding/skip
POST   /api/v1/settings/onboarding/complete
GET    /api/v1/settings/onboarding/templates/industries
GET    /api/v1/settings/onboarding/templates/products/:industry
GET    /api/v1/settings/onboarding/templates/locations
```

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy

| Role Code | Role Name | Access Level | Key Permissions |
|---|---|---|---|
| SUPER_ADMIN | Super Administrator | Full System | All modules, all CRUD, system config |
| ADMIN | Administrator | Organization-wide | All modules, all CRUD, org settings |
| PROD_MANAGER | Production Manager | Production + Planning | Production, Quality, Planning (full) |
| QUAL_MANAGER | Quality Manager | Quality + Production | Quality (full), Production (read) |
| WH_MANAGER | Warehouse Manager | Warehouse + Shipping | Warehouse, Shipping (full) |
| PROD_OPERATOR | Production Operator | Production Only | Production (create/update), Quality (read) |
| QUAL_INSPECTOR | Quality Inspector | Quality Only | Quality (create/update/read) |
| WH_OPERATOR | Warehouse Operator | Warehouse Only | Warehouse (create/update/read) |
| PLANNER | Planner | Planning Only | Planning (full), Production (read) |
| VIEWER | Viewer | Read-only | All modules (read-only) |

### 5.2 Permission Matrix (Module Level)

| Module | Super Admin | Admin | Prod Mgr | Qual Mgr | WH Mgr | Prod Op | Qual Insp | WH Op | Planner | Viewer |
|---|---|---|---|---|---|---|---|---|---|---|
| Settings | CRUD | CRUD | R | R | R | - | - | - | R | R |
| Users | CRUD | CRUD | R | R | R | - | - | - | - | R |
| Technical | CRUD | CRUD | CRUD | R | R | R | R | - | R | R |
| Planning | CRUD | CRUD | CRUD | R | R | R | - | - | CRUD | R |
| Production | CRUD | CRUD | CRUD | R | R | CRU | R | - | R | R |
| Quality | CRUD | CRUD | CRUD | CRUD | R | R | CRU | - | R | R |
| Warehouse | CRUD | CRUD | R | R | CRUD | - | - | CRU | R | R |
| Shipping | CRUD | CRUD | R | R | CRUD | - | - | CRU | R | R |

**Legend:** C=Create, R=Read, U=Update, D=Delete, -=No Access

### 5.3 Onboarding Wizard Permissions

| Role | Can Start Wizard | Can Complete Wizard | Can Skip Wizard |
|---|---|---|---|
| SUPER_ADMIN | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes |
| All Others | No | No | No |

---

## 6. Localization

### 6.1 Supported Languages

| Code | Language | Status | Priority |
|---|---|---|---|
| PL | Polish | Active | P0 |
| EN | English | Active | P0 |
| DE | German | Active | P1 |
| FR | French | Active | P1 |

### 6.2 Translation Scope

- UI labels and buttons
- Validation messages
- System notifications
- Email templates
- Allergen names (14 EU allergens)
- Module names
- Role names
- Error messages
- **Onboarding wizard content**
- **Industry templates**
- **Wizard tooltips and explanations**

### 6.3 Localization Rules

- Default language: English (EN)
- User preference overrides org default
- Fallback chain: User -> Organization -> EN
- Date format: ISO 8601 with locale-specific display
- Number format: Locale-aware (comma vs period)
- Currency: Per organization setting

---

## 7. EU Allergen Reference

### 7.1 14 EU Allergens

| Code | Name (EN) | Name (PL) | Name (DE) | Name (FR) |
|---|---|---|---|---|
| A01 | Cereals containing gluten | Zboża zawierające gluten | Glutenhaltiges Getreide | Cereales contenant du gluten |
| A02 | Crustaceans | Skorupiaki | Krebstiere | Crustaces |
| A03 | Eggs | Jaja | Eier | Oeufs |
| A04 | Fish | Ryby | Fisch | Poisson |
| A05 | Peanuts | Orzeszki ziemne | Erdnusse | Arachides |
| A06 | Soybeans | Soja | Sojabohnen | Soja |
| A07 | Milk | Mleko | Milch | Lait |
| A08 | Nuts | Orzechy | Schalenfruchte | Fruits a coque |
| A09 | Celery | Seler | Sellerie | Celeri |
| A10 | Mustard | Gorczyca | Senf | Moutarde |
| A11 | Sesame seeds | Sezam | Sesamsamen | Graines de sesame |
| A12 | Sulphur dioxide and sulphites | Dwutlenek siarki i siarczyny | Schwefeldioxid und Sulfite | Anhydride sulfureux et sulfites |
| A13 | Lupin | Lubin | Lupinen | Lupin |
| A14 | Molluscs | Mieczaki | Weichtiere | Mollusques |

---

## 8. Phase Roadmap

### Phase 1A: Foundation (Weeks 1-2)
**Goal:** Core organization and user management + Onboarding Wizard

**Deliverables:**
- Organization profile CRUD
- User CRUD with 10 roles
- User invitations (email)
- Session management
- Module toggles
- Basic authentication
- **15-minute Onboarding Wizard (FR-SET-180 to FR-SET-188)**

**User Stories:**
- Story 1.0: Authentication UI
- Story 1.1: Organization configuration
- Story 1.2: User management CRUD
- Story 1.3: User invitations
- Story 1.4: Session management
- Story 1.11: Module activation
- **Story 1.16: Onboarding Wizard**

**Note:** Multi-language support (FR-SET-110-116) deferred to Phase 1B.

---

### Phase 1B: Infrastructure Setup (Weeks 3-4)
**Goal:** Physical infrastructure configuration + Multi-language support

**Deliverables:**
- Warehouse CRUD
- Location hierarchy management
- Machine registry
- Production line configuration
- Audit trail (basic)
- Security policies
- **Multi-language support (PL/EN/DE/FR)**

**User Stories:**
- Story 1.5: Warehouse configuration
- Story 1.6: Location management
- Story 1.7: Machine configuration
- Story 1.8: Production line configuration
- **Story 1.x: Multi-language support**

---

### Phase 2: Master Data & Integrations (Weeks 5-6)
**Goal:** Master data setup and external integrations

**Deliverables:**
- 14 EU allergens (pre-configured)
- Tax code management
- API key generation/management
- Webhook configuration
- Notification settings

**User Stories:**
- Story 1.9: Allergen management
- Story 1.10: Tax code configuration

---

### Phase 3: Advanced Features (Weeks 7-8)
**Goal:** Subscription, data management, advanced security

**Deliverables:**
- Subscription and billing
- Import/Export utilities
- Configuration backup/restore
- IP whitelist
- GDPR compliance tools
- Usage analytics

**User Stories:**
- Story 1.15: Settings dashboard
- Story 1.14: Epic polish and cleanup

---

## 9. Integration Points

### 9.1 Internal Modules

| Module | Integration Type | Data Flow |
|---|---|---|
| Technical | Read | Products, BOMs, Routings |
| Planning | Read | Work orders, production plans |
| Production | Read/Write | Work order execution, machine status |
| Quality | Read | Quality checks, inspections |
| Warehouse | Read/Write | Stock levels, locations |
| Shipping | Read | Shipping orders |

### 9.2 External Systems

| System | Integration Method | Purpose |
|---|---|---|
| Email Provider | SMTP/API | User invitations, notifications |
| Payment Gateway | Webhook | Subscription billing |
| Identity Provider | SAML/OAuth | SSO authentication (future) |
| Analytics Platform | Webhook | Usage tracking |
| ERP Systems | REST API | Master data sync |

---

## 10. Non-Functional Requirements

### 10.1 Performance

- User list load: <500ms for 1000 users
- Settings page load: <300ms
- API key generation: <200ms
- Audit log query: <1s for 100k records
- Webhook delivery: <2s timeout
- **Onboarding wizard step transition: <200ms**
- **Industry template load: <300ms**

### 10.2 Security

- Password: min 8 chars, 1 uppercase, 1 number, 1 special
- Session timeout: 24 hours (configurable)
- API key: 256-bit random, hashed storage
- Webhook signature: HMAC-SHA256
- Audit log: immutable, encrypted at rest

### 10.3 Availability

- Settings API: 99.9% uptime
- Graceful degradation if audit logging fails
- Webhook retry: 3 attempts with exponential backoff

### 10.4 Scalability

- Support 10,000 users per organization
- 1M audit log entries per year
- 100 API keys per organization
- 50 webhooks per organization

---

## 11. Data Migration

### 11.1 Initial Setup Data

**Pre-populated:**
- 14 EU allergens (all languages)
- 10 system roles (default permissions)
- Default modules (all inactive)
- **Industry templates for onboarding (6 industries, 24+ product templates)**
- **Location templates (4 options)**

**User-provided:**
- Organization details
- First admin user
- Warehouses and locations
- Machines and production lines
- Tax codes

### 11.2 Import Templates

**CSV Templates:**
- Users: email, role, language, active
- Warehouses: code, name, type, address
- Locations: code, warehouse_code, type, parent_code
- Machines: code, name, type, capacity, status
- Tax codes: code, rate, jurisdiction, valid_from, valid_to

---

## 12. Success Metrics

### 12.1 Phase 1A Success Criteria

- [ ] 100 organizations onboarded
- [ ] **Average setup time <15 minutes** (key differentiator)
- [ ] User invitation acceptance rate >80%
- [ ] Zero critical security issues
- [ ] Settings API response time <500ms
- [ ] **Onboarding wizard completion rate >70%**
- [ ] **Wizard skip rate <30%**

### 12.2 Phase 3 Success Criteria

- [ ] Subscription conversion rate >30%
- [ ] Webhook delivery success rate >98%
- [ ] Import/Export usage by >50% of orgs
- [ ] Audit log retention compliance 100%
- [ ] Multi-language usage: PL=40%, EN=35%, DE=15%, FR=10%

---

## 13. Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Role permission misconfiguration | High | Automated tests, permission audit tool |
| API key leakage | High | Hashing, expiration, rate limiting, monitoring |
| Webhook delivery failures | Medium | Retry logic, delivery logs, alerts |
| Import data corruption | Medium | Validation, preview mode, rollback capability |
| Audit log storage growth | Medium | Retention policies, archiving, compression |
| Multi-language translation gaps | Low | Fallback to EN, community contributions |
| Session fixation attacks | High | Secure session handling, token rotation |
| **Onboarding wizard abandonment** | Medium | Progress saving, email reminders, simplified steps |
| **Industry templates not matching user needs** | Low | "Start from scratch" option, custom fields |

---

## 14. Open Questions

1. **SSO Integration:** Which identity providers to support? (Azure AD, Google, Okta)
2. **Audit Retention:** Default retention period? (1 year, 3 years, 7 years)
3. **API Rate Limits:** Tier-based limits? (100/min basic, 1000/min premium)
4. **Custom Fields:** Allow org-specific custom fields in settings?
5. **Multi-currency:** Support multiple currencies per organization?
6. **Backup Frequency:** Automated backup schedule? (daily, weekly)
7. **GDPR Tools:** Right to erasure automation scope?
8. **Onboarding Analytics:** What metrics to track for wizard optimization?
9. **Industry Templates:** Which additional industries to support beyond initial 6?

---

## Appendix A: Change Log

| Date | Version | Changes | Author |
|---|---|---|---|
| 2025-12-15 | 2.3 | Deferred multi-language (FR-SET-110-116) from Phase 1A to Phase 1B; added deferral justification; added FR-SET-111, FR-SET-115 detailed specs | PM-Agent |
| 2025-12-15 | 2.3 | Added FR-SET-018 (User Warehouse Access Restrictions) | PM-Agent |
| 2025-12-10 | 2.2 | Added Gherkin AC to Phase 1A/1B FRs (FR-SET-001 to FR-SET-173) | PM-Agent |
| 2025-12-10 | 2.1 | Standardized phase naming (1A/1B/2/3) | Tech Writer |
| 2025-12-10 | 2.1 | Added Onboarding Wizard requirements (FR-SET-180 to FR-SET-188) | PM-Agent |
| 2025-12-10 | 2.0 | Concise baseline PRD with multi-language, API keys, webhooks, audit trail | Tech Writer |
| 2025-11-20 | 1.0 | Initial PRD (Epic 1 implementation) | Original Author |

---

**Document Status:** Approved for Development
**Next Review Date:** 2025-12-31
**Total Requirements:** 184 FRs (174 + 9 Onboarding Wizard + FR-SET-018)
**Lines:** ~2200
