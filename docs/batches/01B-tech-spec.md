# Epic Technical Specification: Foundation & Settings

Date: 2025-11-20
Author: Mariusz
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 (Foundation & Settings) stanowi fundamentalny moduł MonoPilot MES, który musi być zaimplementowany jako pierwszy przed wszystkimi innymi epicami. Moduł zapewnia kompletną konfigurację organizacji, zarządzanie użytkownikami z 10 rolami, setup magazynów i lokacji, konfigurację linii produkcyjnych i maszyn, oraz management alergenów i kodów podatkowych. Ten epic realizuje 10 z 11 Functional Requirements modułu Settings (FR-SET-001 do FR-SET-010), z wyłączeniem FR-SET-011 (Subscription Management) odłożonego do Phase 2.

Epic składa się z 12 stories obejmujących: konfigurację organizacji (1.1), zarządzanie użytkownikami z zaproszeniami email/QR (1.2-1.3), session management (1.4), setup magazynów i hierarchicznej struktury lokacji (1.5-1.6), konfigurację maszyn i linii produkcyjnych (1.7-1.8), management 14 EU alergenów (1.9), kody podatkowe z country-based preloads (1.10), aktywację modułów (1.11), oraz UX wizard do guided onboardingu (1.12).

## Objectives and Scope

### In Scope
- ✅ **Organization Configuration**: Company settings, logo upload (Supabase Storage), regional settings (timezone, currency, language, date/number formats), fiscal year, unit system (Metric/Imperial)
- ✅ **User Management**: CRUD operations dla 10 ról (admin, manager, operator, viewer, planner, technical, purchasing, warehouse, qc, finance), status lifecycle (Invited → Active → Inactive), email/QR invitations z 7-day expiry, session tracking i multi-device logout
- ✅ **Warehouse & Locations**: Multi-warehouse support, hierarchical locations z typami (Receiving, Production, Storage, Shipping, Transit, Quarantine), optional zone/capacity z toggle flags, auto-generated barcodes, default location assignments
- ✅ **Production Setup**: Machine CRUD z status (Active/Down/Maintenance), production lines z warehouse assignment, machine-line many-to-many relationships
- ✅ **Master Data**: 14 EU major allergens (preloaded, non-deletable), custom allergens support, tax codes z country-based defaults (Poland: VAT 23/8/5/0, UK: Standard 20/Reduced 5/Zero 0)
- ✅ **Module Activation**: Toggle 8 modules (Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance) z UI hiding i API 403 enforcement
- ✅ **Onboarding Wizard**: 6-step guided setup (Organization → Regional → Warehouse → Production → Modules → Users)

### Out of Scope (Phase 2+)
- ❌ FR-SET-011: Subscription Management (Stripe billing, tier comparison, invoice history)
- ❌ Custom fields per entity (Phase 4)
- ❌ SSO/SAML integration (Phase 3)
- ❌ Workflow automation rules (Phase 4)
- ❌ Advanced audit settings (Phase 3)

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components
- **Database**: PostgreSQL 15 via Supabase (RLS enabled dla org_id isolation)
- **Auth**: Supabase Auth z JWT sessions
- **Forms**: React Hook Form + Zod validation (client + server)
- **State Management**: SWR dla data fetching/caching
- **Storage**: Supabase Storage dla logo uploads (max 2MB, jpg/png/webp)
- **Email**: SendGrid dla invitation emails

### Architecture Constraints
1. **Multi-tenancy**: Wszystkie tabele z `org_id UUID FK` + RLS policies dla tenant isolation
2. **Audit Trail**: `created_by`, `updated_by`, `created_at`, `updated_at` na wszystkich business tables
3. **Soft Delete**: Brak soft delete dla Settings tables (hard delete dozwolony bo konfiguracja, nie transakcje)
4. **Unique Constraints**: Composite unique indexes `(org_id, code)` dla warehouses, locations, machines, lines, allergens, tax_codes
5. **Circular Dependencies**: Warehouse → Locations → Warehouse defaults (solved: create warehouse, then locations, then update defaults)

### Referenced Components
- **Auth Module**: Supabase Auth dla user creation/invitations, sync auth.users ↔ public.users
- **Storage Module**: Supabase Storage dla logo uploads z signed URLs (authenticated access, 1h TTL)
- **RLS Enforcement**: `org_id = (auth.jwt() ->> 'org_id')::uuid` policy na wszystkich tabelach (automated test suite per Gap 4)
- **Caching Strategy**: Settings cached 10 min, warehouses/locations 5 min (Upstash Redis)

### Cache Dependencies & Events
```typescript
// Epic 1 owns cache, other epics consume
const CACHE_KEYS = {
  warehouses: 'warehouses:{org_id}',      // TTL 5 min, consumed by Epic 3,5,7
  locations: 'locations:{warehouse_id}',  // TTL 5 min, consumed by Epic 4,5,6,7
  allergens: 'allergens:{org_id}',        // TTL 10 min, consumed by Epic 2,8
  taxCodes: 'tax-codes:{org_id}',         // TTL 10 min, consumed by Epic 3
}

// Cache invalidation events (Epic 1 emits → Others listen)
'warehouse.updated' → Epic 3,5,7 invalidate cache
'location.created' → Epic 4,5,6,7 refetch list
'allergen.created' → Epic 2,8 refetch list
```

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **SettingsAPI** | CRUD operations dla wszystkich Settings entities | User input forms, validation schemas | Organization, Warehouses, Locations, Users, Master data | Frontend/API |
| **OrganizationService** | Manage org config, logo upload, regional settings | Org data form, logo file (max 2MB) | Updated org object, signed logo URL | API |
| **UserManagementService** | User CRUD, invitations, session management | User form, role selection, email list | User objects, invitation tokens, QR codes | API + Supabase Auth |
| **WarehouseService** | Warehouse/Location CRUD, default assignments | Warehouse/location forms | Warehouse + nested locations hierarchy | API |
| **MasterDataService** | Allergens, tax codes, machines, lines | Entity forms | Master data lists | API |
| **InvitationService** | Send email/QR invitations, handle expiry, resend | Email, role, org_id | Invitation record, SendGrid email trigger | API + SendGrid |
| **SessionService** | Track active sessions, multi-device logout | User login/logout events | Session records, JWT blacklist updates | API + Redis |
| **OnboardingWizard** | 6-step guided setup dla new orgs | Step-by-step form data | Complete org configuration | Frontend |
| **RLSPolicyValidator** | Automated RLS testing (Gap 4) | Table list, test scenarios | Pass/fail per table, coverage report | CI/CD |

### Data Models and Contracts

#### Organizations Table
```typescript
interface Organization {
  id: string                    // UUID PK
  company_name: string          // Required, max 100 chars
  logo_url?: string             // Supabase Storage signed URL
  street_address: string
  city: string
  postal_code: string
  country: string               // Enum: PL, UK, US, etc.
  nip_vat_number?: string
  timezone: string              // Default 'UTC', IANA format
  default_currency: string      // Enum: PLN, EUR, USD, GBP
  default_language: string      // Enum: PL, EN
  fiscal_year_start: string     // Enum: January, April, July, October
  date_format: string           // Enum: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  number_format: string         // Enum: '1 000,00', '1,000.00'
  unit_system: string           // Enum: 'metric', 'imperial'
  modules_enabled: string[]     // Array of enabled modules
  created_at: Date
  updated_at: Date
}

// Unique constraint: None (single org per id)
// Indexes: None needed (single row queries by id)
```

#### Users Table
```typescript
interface User {
  id: string                    // UUID PK (synced with auth.users)
  org_id: string                // FK → organizations, RLS key
  email: string                 // Unique, valid email format
  first_name: string            // Required
  last_name: string             // Required
  role: UserRole                // Enum: 10 roles (see below)
  status: UserStatus            // Enum: Invited, Active, Inactive
  last_login_at?: Date
  created_at: Date
  updated_at: Date
}

enum UserRole {
  admin = 'admin',              // Full access
  manager = 'manager',          // All modules, no settings
  operator = 'operator',        // Production execution
  viewer = 'viewer',            // Read-only all modules
  planner = 'planner',          // PO, TO, WO
  technical = 'technical',      // Products, BOMs, routings
  purchasing = 'purchasing',    // PO, suppliers, receiving
  warehouse = 'warehouse',      // LP, moves, pallets
  qc = 'qc',                    // Quality module only
  finance = 'finance'           // Costing, margin analysis
}

enum UserStatus {
  Invited = 'invited',          // Invitation sent, not signed up
  Active = 'active',            // Signed up, can login
  Inactive = 'inactive'         // Deactivated, cannot login
}

// Unique constraint: (org_id, email)
// Indexes: org_id, email, status
// RLS: org_id = auth.jwt()->>'org_id'
```

#### Warehouses Table
```typescript
interface Warehouse {
  id: string                              // UUID PK
  org_id: string                          // FK → organizations, RLS key
  code: string                            // Unique per org (e.g., WH-01)
  name: string                            // Required
  address?: string
  default_receiving_location_id?: string  // FK → locations (nullable initially)
  default_shipping_location_id?: string   // FK → locations (nullable initially)
  transit_location_id?: string            // FK → locations (nullable initially)
  is_active: boolean                      // Default true
  created_at: Date
  updated_at: Date
}

// Unique constraint: (org_id, code)
// Indexes: org_id, code
// RLS: org_id = auth.jwt()->>'org_id'
// Circular dependency resolution: Create warehouse → Create locations → Update defaults
```

#### Locations Table
```typescript
interface Location {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  warehouse_id: string          // FK → warehouses
  code: string                  // Unique within warehouse (e.g., LOC-A01)
  name: string                  // Required
  type: LocationType            // Enum: Receiving, Production, Storage, Shipping, Transit, Quarantine
  zone?: string                 // Optional, enabled by zone_enabled flag
  zone_enabled: boolean         // Default false
  capacity?: number             // Optional, enabled by capacity_enabled flag
  capacity_enabled: boolean     // Default false
  barcode: string               // Auto-generated, format: LOC-{warehouse_code}-{sequence}
  is_active: boolean            // Default true
  created_at: Date
  updated_at: Date
}

enum LocationType {
  Receiving = 'receiving',
  Production = 'production',
  Storage = 'storage',
  Shipping = 'shipping',
  Transit = 'transit',
  Quarantine = 'quarantine'
}

// Unique constraint: (org_id, warehouse_id, code)
// Indexes: org_id, warehouse_id, type
// RLS: org_id = auth.jwt()->>'org_id'
// CRITICAL INDEX: idx_locations_warehouse ON (warehouse_id) - prevents 30s query on 500+ locations
```

#### Machines & Production Lines
```typescript
interface Machine {
  id: string
  org_id: string                // RLS key
  code: string                  // Unique per org (e.g., MIX-01)
  name: string
  status: MachineStatus         // Enum: Active, Down, Maintenance
  capacity_per_hour?: number    // Optional
  created_at: Date
  updated_at: Date
}

enum MachineStatus {
  Active = 'active',
  Down = 'down',
  Maintenance = 'maintenance'
}

interface ProductionLine {
  id: string
  org_id: string                // RLS key
  warehouse_id: string          // FK → warehouses
  code: string                  // Unique per org (e.g., LINE-01)
  name: string
  default_output_location_id?: string  // FK → locations
  created_at: Date
  updated_at: Date
}

interface MachineLineAssignment {
  id: string
  machine_id: string            // FK → machines
  line_id: string               // FK → production_lines
  created_at: Date
}

// Unique constraint: (org_id, code) for machines and lines
// Unique constraint: (machine_id, line_id) for assignments - prevents race condition
// Indexes: org_id, line_id (for machines), machine_id (for assignments)
```

#### Allergens & Tax Codes
```typescript
interface Allergen {
  id: string
  org_id: string                // RLS key (shared allergens: org_id = NULL)
  code: string                  // E.g., MILK, EGGS
  name: string                  // E.g., "Mleko", "Jaja"
  is_major: boolean             // True for 14 EU allergens
  is_custom: boolean            // True for user-added
  created_at: Date
}

// Preloaded 14 EU allergens: Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts,
// Wheat, Soybeans, Sesame, Mustard, Celery, Lupin, Sulphites, Molluscs
// Non-deletable: is_custom = false

interface TaxCode {
  id: string
  org_id: string                // RLS key
  code: string                  // E.g., VAT23
  description: string           // E.g., "VAT 23%"
  rate: number                  // Decimal, e.g., 23.00
  created_at: Date
}

// Preloaded by country:
// Poland: VAT 23%, VAT 8%, VAT 5%, VAT 0%
// UK: Standard 20%, Reduced 5%, Zero 0%
```

### APIs and Interfaces

#### REST Endpoints

**Organization Settings**
```typescript
GET    /api/settings/organization
  Response: Organization
  Auth: Authenticated user

PUT    /api/settings/organization
  Body: UpdateOrganizationInput
  Response: Organization
  Auth: Admin only
  Validation: Zod schema (client + server)

POST   /api/settings/organization/logo
  Body: FormData (file)
  Response: { logo_url: string }
  Auth: Admin only
  Validation: Max 2MB, jpg/png/webp only
  Storage: Supabase Storage (authenticated bucket, signed URLs)
```

**User Management**
```typescript
GET    /api/settings/users
  Query: { role?, status?, search? }
  Response: User[]
  Auth: Admin or Manager

POST   /api/settings/users
  Body: CreateUserInput { email, first_name, last_name, role }
  Response: User + InvitationToken
  Auth: Admin only
  Side effects: Create Supabase Auth user, send invitation email

PUT    /api/settings/users/:id
  Body: UpdateUserInput
  Response: User
  Auth: Admin only
  Validation: Cannot change email, cannot deactivate last admin

DELETE /api/settings/users/:id
  Response: { success: boolean }
  Auth: Admin only
  Side effects: Set status = Inactive, terminate all sessions

GET    /api/settings/users/:id/sessions
  Response: UserSession[]
  Auth: Admin or self

DELETE /api/settings/users/:id/sessions
  Response: { terminated_count: number }
  Auth: Admin or self
  Side effects: JWT blacklist in Redis, realtime session invalidation
```

**Warehouses & Locations**
```typescript
GET    /api/settings/warehouses
  Response: Warehouse[]
  Auth: Authenticated
  Cache: 5 min TTL

POST   /api/settings/warehouses
  Body: CreateWarehouseInput
  Response: Warehouse
  Auth: Admin only
  Validation: Unique code per org
  Note: default_*_location_id nullable initially

GET    /api/settings/locations
  Query: { warehouse_id }
  Response: Location[]
  Auth: Authenticated
  Cache: 5 min TTL
  Index: Uses idx_locations_warehouse for performance

POST   /api/settings/locations
  Body: CreateLocationInput
  Response: Location
  Auth: Admin only
  Validation: Unique code per warehouse
  Barcode: Auto-generated LOC-{warehouse_code}-{sequence}
```

**Master Data (Machines, Lines, Allergens, Tax Codes)**
```typescript
GET    /api/settings/machines
GET    /api/settings/lines
GET    /api/settings/allergens
GET    /api/settings/tax-codes
  Response: Entity[]
  Auth: Authenticated
  Cache: 5-10 min TTL

POST   /api/settings/{entity}
  Body: CreateInput
  Response: Entity
  Auth: Admin only
  Validation: Unique codes, prevent deletion of preloaded allergens
```

#### Zod Validation Schemas

```typescript
// Organization
const UpdateOrganizationSchema = z.object({
  company_name: z.string().min(1).max(100),
  logo: z.instanceof(File).refine(file => file.size <= 2 * 1024 * 1024, 'Max 2MB')
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)),
  country: z.enum(['PL', 'UK', 'US', 'DE', 'FR']),
  timezone: z.string(), // IANA timezone
  default_currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']),
  default_language: z.enum(['PL', 'EN']),
  // ... other fields
})

// User
const CreateUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'operator', 'viewer', 'planner',
                'technical', 'purchasing', 'warehouse', 'qc', 'finance'])
})

// Warehouse
const CreateWarehouseSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/, 'Uppercase, numbers, hyphens only'),
  name: z.string().min(1),
  // default locations nullable initially
})

// Location
const CreateLocationSchema = z.object({
  warehouse_id: z.string().uuid(),
  code: z.string().regex(/^[A-Z0-9-]+$/),
  name: z.string().min(1),
  type: z.enum(['receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine']),
  zone: z.string().optional(),
  zone_enabled: z.boolean().default(false),
  capacity: z.number().positive().optional(),
  capacity_enabled: z.boolean().default(false)
})
```

### Workflows and Sequencing

#### Workflow 1: Organization Onboarding (6-Step Wizard)
```
User Signs Up (Supabase Auth)
  ↓
Step 1: Organization Basics
  - Input: company_name, logo, address
  - API: POST /api/settings/organization
  - Storage: Upload logo to Supabase Storage
  ↓
Step 2: Regional Settings
  - Input: timezone, currency, language, date/number formats
  - API: PUT /api/settings/organization
  ↓
Step 3: First Warehouse
  - Input: code, name, address
  - API: POST /api/settings/warehouses
  - Note: default locations NULL initially
  ↓
Step 4: Key Locations
  - Input: Receiving, Shipping, Transit, Production locations
  - API: POST /api/settings/locations (4 calls)
  - Auto-generate barcodes
  ↓
Step 5: Update Warehouse Defaults
  - API: PUT /api/settings/warehouses/:id
  - Set default_receiving_location_id, default_shipping_location_id, transit_location_id
  - Resolves circular dependency
  ↓
Step 6: Module Selection & User Invitations
  - Input: enabled modules, user emails + roles
  - API: PUT /api/settings/organization (modules)
  - API: POST /api/settings/users (bulk)
  - Side effect: SendGrid invitation emails sent
  ↓
Wizard Complete → Redirect to Dashboard
```

#### Workflow 2: User Invitation Flow
```
Admin: Create User (POST /api/settings/users)
  ↓
Backend:
  1. Create Supabase Auth user (status = invited)
  2. Insert into public.users (status = 'invited')
  3. Generate invitation token (JWT, 7-day expiry)
  4. Generate QR code (URL with token)
  5. Send SendGrid email with link + QR
  ↓
User: Click link OR scan QR
  ↓
Signup Page:
  - Email pre-filled
  - User sets password
  - API: Supabase Auth signup complete
  ↓
Backend:
  - Update users.status = 'active'
  - Log first login timestamp
  ↓
User: Logged in → Dashboard
```

#### Workflow 3: Multi-Device Logout
```
User: Click "Logout All Devices"
  ↓
API: DELETE /api/settings/users/:id/sessions
  ↓
Backend:
  1. Update user_sessions.is_active = false (all sessions)
  2. Add JWT tokens to Redis blacklist (TTL = token expiry)
  3. Emit realtime event: 'session.terminated'
  ↓
All Devices:
  - Supabase realtime listener detects event
  - Force logout (clear localStorage, redirect to login)
  - Show toast: "Logged out from all devices"
```

#### Workflow 4: Warehouse + Locations Circular Dependency Resolution
```
Admin: Create Warehouse
  ↓
POST /api/settings/warehouses
  Body: { code, name, default_receiving_location_id: null }
  Response: Warehouse (id = wh_123, defaults = null)
  ↓
Admin: Create Locations
  ↓
POST /api/settings/locations (4 calls)
  Body: { warehouse_id: wh_123, code: 'RCV-01', type: 'receiving' }
  Response: Location (id = loc_rcv)
  ... repeat for shipping, transit, production
  ↓
Admin: Update Warehouse Defaults
  ↓
PUT /api/settings/warehouses/wh_123
  Body: {
    default_receiving_location_id: loc_rcv,
    default_shipping_location_id: loc_shp,
    transit_location_id: loc_trn
  }
  Response: Warehouse (defaults now set)
  ↓
Validation: Warehouse ready for use in PO/WO
```

## Non-Functional Requirements

### Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Dashboard load (Settings page) | <500ms p95 | Initial page load with org settings |
| Warehouse list (100 warehouses) | <200ms p95 | GET /api/settings/warehouses |
| Location list (500 locations) | <300ms p95 | GET /api/settings/locations?warehouse_id=X (with idx_locations_warehouse) |
| User list (1000 users) | <400ms p95 | GET /api/settings/users with pagination |
| Logo upload (2MB file) | <3s p95 | POST /api/settings/organization/logo to Supabase Storage |
| Invitation email delivery | <5s | SendGrid API call + email delivery |
| Multi-device logout | <1s | JWT blacklist + realtime event propagation |
| Cache hit rate | >80% | Warehouses, locations, allergens, tax codes |

**Performance Optimizations:**
- **Critical Index**: `idx_locations_warehouse` prevents 30s query on 500+ locations
- **Caching**: Redis 5-10 min TTL dla master data (warehouses, locations, allergens, tax codes)
- **Pagination**: User list paginated (50 per page) jeśli >100 users
- **Lazy Loading**: Locations loaded per warehouse (not all at once)
- **Optimistic Updates**: UI immediately reflects changes, background sync
- **Image Optimization**: Logo resized to max 1024x1024 on upload (sharp library)

### Security

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Multi-Tenancy Isolation** | RLS policy `org_id = auth.jwt()->>'org_id'` na wszystkich tabelach | Automated RLS test suite (Gap 4) runs on every table |
| **Authentication** | Supabase Auth JWT sessions (HTTP-only cookies) | Token expiry 7 days, refresh token rotation |
| **Authorization** | Role-based access control (10 roles), Admin-only dla Settings | Middleware checks role per endpoint |
| **Logo Upload Security** | Supabase Storage authenticated bucket, signed URLs (1h TTL) | Client validates format/size, server double-checks |
| **Invitation Token Security** | JWT z 7-day expiry, one-time use | Token invalidated after signup |
| **Session Security** | JWT blacklist w Redis, multi-device logout | Session invalidation <1s via realtime |
| **Input Validation** | Zod schemas (client + server), SQL injection prevention via Supabase | All user input validated before DB |
| **Rate Limiting** | 100 requests/min per org (Vercel Edge) | Per-org rate limiting, 429 response |
| **Audit Trail** | `created_by`, `updated_by`, `created_at`, `updated_at` | Logged for all Settings changes |
| **Password Policy** | Min 8 chars, 1 uppercase, 1 number (Supabase Auth) | Enforced at signup |

**Security Tests Required:**
- ✅ RLS bypass test: User A cannot read User B's org data
- ✅ Admin-only enforcement: Non-admin cannot PUT /api/settings/organization
- ✅ Logo bucket access: Unsigned URL returns 403
- ✅ Expired invitation: 7-day old token rejected
- ✅ Session hijacking: Stolen JWT in blacklist cannot authenticate

### Reliability/Availability

| Requirement | Implementation | SLA |
|-------------|----------------|-----|
| **Uptime** | 99.9% availability (Vercel + Supabase) | 43.2 min downtime/month max |
| **Graceful Degradation** | Cache serves stale data if DB slow | Max 1 min stale data acceptable |
| **Transaction Atomicity** | Onboarding wizard: rollback on failure | All 6 steps atomic or none |
| **Idempotent Operations** | Allergen/tax code seed: `ON CONFLICT DO NOTHING` | Safe to re-run migrations |
| **Retry Logic** | SendGrid email: 3 retries with exponential backoff | Eventual delivery within 5 min |
| **Backup & Recovery** | Supabase daily backups, 7-day retention | RTO 1 hour, RPO 24 hours |
| **Cascade Delete Protection** | FK `ON DELETE RESTRICT` dla default locations | Cannot delete if referenced |
| **Circular Dependency Handling** | 3-step create pattern documented | UI guides user through correct sequence |

**Failure Scenarios Covered:**
- Logo upload fails → Fallback to initials placeholder
- Invitation email fails → Retry queue, manual resend option
- Warehouse deletion with active POs → Block delete, show error count
- Module toggle off with active data → Soft disable (hide UI, keep API read-only)
- Session logout fails → Force client-side logout, log error

### Observability

| Signal | Implementation | Retention |
|--------|----------------|-----------|
| **Application Logs** | Vercel logs (JSON structured) | 7 days free tier, 30 days Pro |
| **Error Tracking** | Console errors logged, API errors returned as RFC 7807 | Real-time monitoring |
| **Performance Metrics** | Vercel Analytics (Core Web Vitals) | 30 days |
| **API Metrics** | Response times, status codes, per endpoint | 7 days |
| **Cache Hit Rate** | Redis metrics (Upstash dashboard) | 30 days |
| **User Activity** | Last login timestamp, session duration | Indefinite |
| **Audit Trail** | `created_by`, `updated_by` fields | Indefinite |

**Key Metrics to Monitor:**
- Settings page load time (target <500ms p95)
- Location query time (target <300ms p95 with 500+ locations)
- Logo upload success rate (target >95%)
- Invitation email delivery rate (target >99%)
- Cache hit rate (target >80%)
- RLS policy failures (alert if >0)

**Alerting Thresholds:**
- 🔴 Critical: RLS test failure (immediate Slack alert)
- 🔴 Critical: Settings API 5xx error rate >1% (immediate)
- 🟡 Warning: Location query >1s (p95) (daily digest)
- 🟡 Warning: Cache hit rate <60% (daily digest)
- 🟢 Info: New org created (daily digest)

## Dependencies and Integrations

### Epic 1 Provides (Foundation Data)

Epic 1 jest foundation module - wszystkie inne epiki zależą od danych z Epic 1:

```
Epic 1: Foundation & Settings
│
├── Organizations Table
│   └→ Epic 2-8: org_id FK (multi-tenancy isolation)
│
├── Users & Roles
│   ├→ Epic 2-8: created_by, updated_by (audit trail)
│   └→ Epic 6,8: Role-specific permissions (QC, NPD Lead, etc.)
│
├── Warehouses
│   ├→ Epic 2: Product routing (warehouse assignment)
│   ├→ Epic 3: PO receiving (default_receiving_location_id)
│   ├→ Epic 4: WO execution (production output location)
│   ├→ Epic 5: LP creation (warehouse_id FK)
│   └→ Epic 7: Shipping (default_shipping_location_id)
│
├── Locations
│   ├→ Epic 4: Operation tracking (machine location)
│   ├→ Epic 5: LP moves (from_location_id → to_location_id)
│   ├→ Epic 6: QA holds (quarantine location)
│   └→ Epic 7: Picking (picking location, staging location)
│
├── Machines & Production Lines
│   ├→ Epic 3: WO creation (production_line_id selection)
│   ├→ Epic 4: Operation tracking (machine_id, line_id)
│   └→ Epic 4: Output location (line.default_output_location_id)
│
├── Allergens
│   ├→ Epic 2: Product allergen assignment (product_allergens table)
│   ├→ Epic 2: BOM allergen inheritance (aggregate from ingredients)
│   └→ Epic 8: Formulation allergen aggregation (NPD auto-calculate)
│
├── Tax Codes
│   └→ Epic 3: PO line tax calculation (po_lines.tax_code_id FK)
│
└── Module Activation Flags
    └→ All Epics: Feature toggle checks (API middleware)
```

### Critical Dependencies Table

| Epic | Wymaga z Epic 1 | Blokujące Story | Bez tego nie działa |
|------|-----------------|-----------------|---------------------|
| **Epic 2** (Technical) | Organizations, Users, Allergens | 2.4 Product Allergen Assignment | Cannot assign allergens bez master list |
| **Epic 3** (Planning) | Warehouses, Locations, Tax Codes | 3.1 PO Creation, 3.10 WO Creation | PO needs receiving location, WO needs line |
| **Epic 4** (Production) | Machines, Lines, Locations | 4.2 WO Start, 4.7 Material Consumption | WO needs line + output location |
| **Epic 5** (Warehouse) | Warehouses, Locations | 5.1 LP Creation, 5.14 LP Move | LP must belong to warehouse + location |
| **Epic 6** (Quality) | Locations (quarantine), Users (QC role) | 6.6 Quality Hold | Hold LP needs quarantine location |
| **Epic 7** (Shipping) | Warehouses, Locations | 7.9 Pick Lists | Picking needs staging location |
| **Epic 8** (NPD) | Allergens, Users (NPD Lead role) | 8.10 Auto-aggregate allergens | Formulation allergen calc needs master list |

### Epic 1 Provides APIs (Consumed by Others)

| API Endpoint | Consumer Epics | Purpose | Cache TTL |
|--------------|----------------|---------|-----------|
| `GET /api/settings/warehouses` | Epic 3, 5, 7 | PO/LP/SO warehouse selection | 5 min |
| `GET /api/settings/locations` | Epic 4, 5, 6, 7 | LP moves, production, QA holds, picking | 5 min |
| `GET /api/settings/machines` | Epic 4 | WO operation assignment | 5 min |
| `GET /api/settings/lines` | Epic 3, 4 | WO creation, production execution | 5 min |
| `GET /api/settings/allergens` | Epic 2, 8 | Product allergen assignment, formulation calc | 10 min |
| `GET /api/settings/tax-codes` | Epic 3 | PO line tax calculation | 10 min |
| `GET /api/settings/users` | Epic 2-8 | created_by, updated_by resolution (display names) | 5 min |

### Epic 1 Consumes APIs

**None** - Epic 1 jest foundation module, nie ma dependencies na inne epiki.

### Shared Tables (Epic 1 owns, others read)

| Table | Owner | Readers | Write Access | Cache Strategy |
|-------|-------|---------|--------------|----------------|
| `organizations` | Epic 1 | All | Epic 1 only | 10 min TTL |
| `users` | Epic 1 | All | Epic 1 only | 5 min TTL |
| `warehouses` | Epic 1 | Epic 3,5,7 | Epic 1 only | 5 min TTL, invalidate on update |
| `locations` | Epic 1 | Epic 4,5,6,7 | Epic 1 only | 5 min TTL, invalidate on create |
| `machines` | Epic 1 | Epic 4 | Epic 1 only | 5 min TTL |
| `production_lines` | Epic 1 | Epic 3,4 | Epic 1 only | 5 min TTL |
| `allergens` | Epic 1 | Epic 2,8 | Epic 1 (admin), Epic 2 (custom) | 10 min TTL |
| `tax_codes` | Epic 1 | Epic 3 | Epic 1 only | 10 min TTL |

### Cache Invalidation Events

```typescript
// Epic 1 emits events → Other epics listen and invalidate their caches

interface CacheEvent {
  event: string
  org_id: string
  entity_id: string
  timestamp: Date
}

// Events emitted by Epic 1:
'warehouse.created' → Epic 3,5,7 invalidate warehouse cache
'warehouse.updated' → Epic 3,5,7 invalidate warehouse cache
'location.created' → Epic 4,5,6,7 refetch location list for that warehouse
'location.updated' → Epic 4,5,6,7 refetch location list
'allergen.created' → Epic 2,8 refetch allergen list
'tax_code.created' → Epic 3 refetch tax code list
'user.created' → Epic 2-8 refetch user list (for audit trail display)
'user.role_changed' → Epic 2-8 refetch user list (permissions may change)
```

### External Service Dependencies

| Service | Purpose | Criticality | Failure Handling |
|---------|---------|-------------|------------------|
| **Supabase Auth** | User authentication, invitations | 🔴 CRITICAL | Cannot login bez auth, show maintenance page |
| **Supabase Database** | All data storage | 🔴 CRITICAL | Cannot operate, show cached data read-only |
| **Supabase Storage** | Logo uploads | 🟢 LOW | Fallback to initials placeholder |
| **SendGrid** | Invitation emails | 🟡 MEDIUM | Retry queue, manual resend option, QR code backup |
| **Upstash Redis** | Caching master data | 🟡 MEDIUM | Fallback to direct DB queries (slower) |
| **Vercel Edge** | Hosting, rate limiting | 🔴 CRITICAL | Entire app down, 99.9% SLA |

**Dependency Health Checks:**
- Supabase: Ping `/rest/v1/` endpoint every 5 min
- SendGrid: Check API status page before bulk sends
- Redis: Cache miss → DB fallback (graceful degradation)

### Integration Testing Requirements

| Integration Point | Test Scenario | Expected Result |
|-------------------|---------------|-----------------|
| Supabase Auth ↔ Users table | Create user via API | auth.users and public.users synced |
| Warehouse → Locations | Create warehouse, add locations, update defaults | Circular dependency resolved |
| User invitation → SendGrid | Invite user | Email sent within 5s, token valid 7 days |
| Location deletion → FK check | Delete location used as default | 403 error: "Cannot delete - used by Warehouse X" |
| Module toggle → Epic 3 API | Disable Planning module | GET /api/planning/* returns 403 |
| Allergen seed → Epic 2 | Run migration | 14 EU allergens preloaded, is_major = true |
| Tax code seed → Epic 3 | Org country = Poland | VAT 23%, 8%, 5%, 0% preloaded |
| Cache invalidation → Epic 5 | Update warehouse name | Epic 5 cache refreshed within 1s via event |

## Acceptance Criteria (Authoritative)

Epic 1 realizuje 10 Functional Requirements (FR-SET-001 do FR-SET-010) poprzez 12 stories. Poniżej znajdują się atomiczne, testable acceptance criteria zgrupowane per FR:

### FR-SET-001: Organization Configuration (Story 1.1)

**AC-001.1**: User może wypełnić i zapisać organization form z wymaganymi polami: company_name, address, city, postal_code, country

**AC-001.2**: Logo upload akceptuje tylko jpg/png/webp, max 2MB, upload do Supabase Storage, zwraca signed URL

**AC-001.3**: Regional settings (timezone, currency, language, date/number formats, unit system) zapisywane i applied globally

**AC-001.4**: Validation errors pokazywane inline on blur, success toast po zapisie

### FR-SET-002: User Management (Stories 1.2, 1.3)

**AC-002.1**: Admin może stworzyć usera z email, first_name, last_name, role (10 options), status = 'invited'

**AC-002.2**: User table sortowalna, filtrowalna (role, status), searchable (name/email)

**AC-002.3**: Edit user drawer pozwala zmienić role i status (nie email)

**AC-002.4**: Deactivate user → status = 'inactive', terminate all sessions

**AC-002.5**: Nie można deactivate last admin (validation error)

**AC-002.6**: Invitation email wysłany within 5s, zawiera signup link + QR code

**AC-002.7**: Invitation expires after 7 days, można resend (extends expiry)

**AC-002.8**: Signup z invitation link pre-fills email, user sets password, status → 'active'

### FR-SET-003: Session Management (Story 1.4)

**AC-003.1**: User widzi listę active sessions z device_info, IP, login_time, last_activity

**AC-003.2**: "Logout All Devices" terminates all sessions except current, JWT blacklist w Redis

**AC-003.3**: Admin może view i terminate any user's sessions

**AC-003.4**: Session invalidation propagated via realtime within 1s

### FR-SET-004: Warehouse Configuration (Story 1.5)

**AC-004.1**: Admin może stworzyć warehouse z code (unique per org), name, address

**AC-004.2**: default_receiving_location_id, default_shipping_location_id, transit_location_id nullable initially

**AC-004.3**: Warehouses list sortowalna, filtrowalna (is_active)

**AC-004.4**: Cannot delete warehouse jeśli ma active POs/LPs (FK constraint)

### FR-SET-005: Location Management (Story 1.6)

**AC-005.1**: Admin może stworzyć location z code (unique within warehouse), name, type (6 options)

**AC-005.2**: zone i capacity optional, controlled by zone_enabled, capacity_enabled toggles

**AC-005.3**: Barcode auto-generated: LOC-{warehouse_code}-{sequence}

**AC-005.4**: Locations table nested under warehouse, filtrowalna by type

**AC-005.5**: Cannot delete location jeśli used as warehouse default (FK ON DELETE RESTRICT)

### FR-SET-006: Machine Configuration (Story 1.7)

**AC-006.1**: Admin może stworzyć machine z code (unique per org), name, status (Active/Down/Maintenance)

**AC-006.2**: Machine może być assigned to multiple lines (many-to-many via machine_line_assignments)

**AC-006.3**: capacity_per_hour optional field

**AC-006.4**: Cannot delete machine jeśli assigned to active WO

### FR-SET-007: Production Line Configuration (Story 1.8)

**AC-007.1**: Admin może stworzyć production line z code (unique per org), name, warehouse_id

**AC-007.2**: default_output_location_id optional, filtered by selected warehouse

**AC-007.3**: Line może mieć multiple machines assigned

**AC-007.4**: Cannot delete line jeśli has active WOs

### FR-SET-008: Allergen Management (Story 1.9)

**AC-008.1**: 14 EU major allergens preloaded on org creation (Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame, Mustard, Celery, Lupin, Sulphites, Molluscs)

**AC-008.2**: Preloaded allergens mają is_major = true, is_custom = false, cannot be deleted

**AC-008.3**: Admin może dodać custom allergens z code, name, is_major flag

**AC-008.4**: Custom allergens (is_custom = true) mogą być edited i deleted

### FR-SET-009: Tax Code Configuration (Story 1.10)

**AC-009.1**: Tax codes preloaded based on org country: Poland (VAT 23/8/5/0), UK (Standard 20/Reduced 5/Zero 0)

**AC-009.2**: Admin może dodać custom tax codes z code, description, rate (decimal %)

**AC-009.3**: Tax codes list sortowalna, filtrowalna

**AC-009.4**: Cannot delete tax code jeśli used in POs

### FR-SET-010: Module Activation (Story 1.11)

**AC-010.1**: Admin może toggle 8 modules: Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance

**AC-010.2**: Default enabled: Technical, Planning, Production, Warehouse

**AC-010.3**: Disabled module hidden from navigation

**AC-010.4**: API endpoints dla disabled module return 403 Forbidden

**AC-010.5**: Confirmation modal przy toggle off: "Disabling X will hide Y active entities. Continue?"

### Story 1.12: Settings Wizard (UX Enhancement)

**AC-012.1**: 6-step wizard triggered on first login: Organization → Regional → Warehouse → Locations → Modules → Users

**AC-012.2**: Each step validates before proceeding, can skip non-essential steps

**AC-012.3**: Wizard completion tracked w org settings, can be re-accessed from Settings

**AC-012.4**: Wizard completion status: Show progress bar, allow "Skip wizard" (go to dashboard)

## Traceability Mapping

Pełna mapa FR → Stories → Components → Tests:

| FR ID | FR Title | Stories | Components/APIs | Test Files |
|-------|----------|---------|-----------------|------------|
| FR-SET-001 | Organization Configuration | 1.1 | OrganizationService, SettingsAPI, Supabase Storage | settings-org.spec.ts, logo-upload.e2e.ts |
| FR-SET-002 | User Management | 1.2, 1.3 | UserManagementService, InvitationService, Supabase Auth, SendGrid | user-crud.spec.ts, invitations.e2e.ts |
| FR-SET-003 | Session Management | 1.4 | SessionService, Redis JWT blacklist, Supabase realtime | session-management.spec.ts, multi-device-logout.e2e.ts |
| FR-SET-004 | Warehouse Configuration | 1.5 | WarehouseService, SettingsAPI | warehouse-crud.spec.ts, warehouse-defaults.e2e.ts |
| FR-SET-005 | Location Management | 1.6 | WarehouseService, Barcode generator | location-crud.spec.ts, location-hierarchy.e2e.ts |
| FR-SET-006 | Machine Configuration | 1.7 | MasterDataService, MachineLineAssignment | machine-crud.spec.ts, machine-line-assignment.e2e.ts |
| FR-SET-007 | Production Line Configuration | 1.8 | MasterDataService, MachineLineAssignment | line-crud.spec.ts, line-warehouse-link.e2e.ts |
| FR-SET-008 | Allergen Management | 1.9 | MasterDataService, Allergen seed script | allergen-crud.spec.ts, allergen-preload.e2e.ts |
| FR-SET-009 | Tax Code Configuration | 1.10 | MasterDataService, Tax code seed script | tax-code-crud.spec.ts, tax-code-preload.e2e.ts |
| FR-SET-010 | Module Activation | 1.11 | ModuleMiddleware, SettingsAPI | module-toggle.spec.ts, module-403.e2e.ts |
| UX-001 | Onboarding Wizard | 1.12 | OnboardingWizard component | onboarding-wizard.e2e.ts, wizard-completion.spec.ts |

### Reverse Traceability (Component → Stories)

| Component | Used By Stories | Purpose |
|-----------|-----------------|---------|
| OrganizationService | 1.1, 1.12 | Org config, logo upload |
| UserManagementService | 1.2, 1.3, 1.4, 1.12 | User CRUD, invitations, sessions |
| WarehouseService | 1.5, 1.6, 1.12 | Warehouse/location CRUD, defaults |
| MasterDataService | 1.7, 1.8, 1.9, 1.10 | Machines, lines, allergens, tax codes |
| InvitationService | 1.3 | Email/QR invitations |
| SessionService | 1.4 | Multi-device logout, JWT blacklist |
| OnboardingWizard | 1.12 | 6-step guided setup |
| RLSPolicyValidator | All stories | Automated RLS testing (Gap 4) |

### Test Coverage Matrix

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|-----------|-------------------|-----------|
| 1.1 | Organization validation, logo upload | Supabase Storage integration | Org form submission, logo display |
| 1.2 | User validation, role enum | Supabase Auth sync | User CRUD, search, filter |
| 1.3 | Invitation token generation | SendGrid API, QR code gen | Invitation flow, signup |
| 1.4 | Session tracking logic | Redis blacklist, realtime | Multi-device logout |
| 1.5 | Warehouse validation | FK constraints | Warehouse CRUD, defaults |
| 1.6 | Location validation, barcode gen | Warehouse hierarchy | Location CRUD, nested table |
| 1.7 | Machine validation | Machine-line assignment | Machine CRUD, status changes |
| 1.8 | Line validation | Line-warehouse link | Line CRUD, machine assignment |
| 1.9 | Allergen seed logic | EU allergen preload | Allergen CRUD, custom addition |
| 1.10 | Tax code validation | Country-based seed | Tax code CRUD, rate calculation |
| 1.11 | Module toggle logic | Middleware 403 check | Module toggle, API 403 |
| 1.12 | Wizard step validation | 6-step flow | Complete wizard, skip steps |

## Risks, Assumptions, Open Questions

### 🔴 Critical Risks (z Failure Mode Analysis)

#### Risk 1: RLS Policy Bypass → Data Leakage
- **Likelihood**: Low (automated tests)
- **Impact**: 🔴 CRITICAL - GDPR violation, customer trust loss, legal liability
- **Root Cause**: Missing `org_id` check, incorrect JWT parsing, admin bypass bug
- **Mitigation**:
  - ✅ Automated RLS test suite (Gap 4) runs on CI/CD dla wszystkich tabel
  - ✅ CI/CD fails jeśli new table created bez RLS policy
  - ✅ Linter rule: fail build if table has `org_id` but no RLS policy
  - ✅ Security audit przed każdym release
  - ✅ Mandatory PR checklist: "RLS policy added? ☐ Yes ☐ N/A"
- **Detection**: RLS test failures alert immediately via Slack
- **Response**: Emergency rollback, patch within 4h, customer notification

#### Risk 2: Warehouse Default Location Cascade Delete
- **Likelihood**: Medium (user error)
- **Impact**: 🔴 HIGH - PO receiving crashes, business disruption
- **Root Cause**: Admin deletes location used as warehouse default, FK ON DELETE SET NULL
- **Mitigation**:
  - ✅ DB constraint: `FOREIGN KEY ... ON DELETE RESTRICT`
  - ✅ UI validation: "Cannot delete - this is default receiving location for Warehouse X"
  - ✅ Archive instead of delete (soft delete pattern for locations)
- **Detection**: FK constraint error, caught by API validation
- **Response**: Show error message, offer to change default first

#### Risk 3: Module Toggle Accident → Data Inaccessible
- **Likelihood**: Low (confirmation modal)
- **Impact**: 🔴 HIGH - Users locked out of active data, business disruption
- **Root Cause**: Admin accidentally toggles off active module
- **Mitigation**:
  - ✅ Confirmation modal: "Disabling Warehouse will hide X active LPs. Continue?"
  - ✅ Soft disable: hide UI, but API remains accessible (read-only)
  - ✅ Re-enable without data loss (data persists)
  - ✅ Audit log: track who disabled module, when, restore capability
- **Detection**: User complaints, audit log review
- **Response**: Re-enable module immediately, no data loss

### 🟡 Medium Risks

#### Risk 4: Supabase Auth Rate Limit During Bulk Invitations
- **Likelihood**: Medium (large orgs)
- **Impact**: 🟡 MEDIUM - Invitations nie wysłane, support tickets
- **Root Cause**: 100 users invited simultaneously, Supabase rate limit hit
- **Mitigation**:
  - ✅ Batch invitations: max 10 at a time, queue remaining
  - ✅ Retry logic z exponential backoff (3 attempts)
  - ✅ UI feedback: "Sending 1/50... 2/50..." progress bar
  - ✅ QR code backup (doesn't rely on email)
- **Detection**: SendGrid API error 429, log warning
- **Response**: Queue retries, show "Some invitations failed, retry?" prompt

#### Risk 5: Missing Index on locations.warehouse_id → Slow Queries
- **Likelihood**: High (large warehouses)
- **Impact**: 🟡 MEDIUM - 30s query time → timeout errors, poor UX
- **Root Cause**: 500+ locations query without index
- **Mitigation**:
  - ✅ Add index: `CREATE INDEX idx_locations_warehouse ON locations(warehouse_id)`
  - ✅ Performance test: seed 1000 locations, measure query time (<200ms required)
  - ✅ Architecture doc specifies indexes, enforce in PR review
  - ✅ Query monitoring: alert if p95 >500ms
- **Detection**: Slow query logs, user complaints
- **Response**: Add index in emergency migration

#### Risk 6: Logo Upload Storage Bucket Misconfigured
- **Likelihood**: Low (deployment error)
- **Impact**: 🟡 MEDIUM - Security breach, logos publicly accessible
- **Root Cause**: Supabase bucket policy set to `public` instead of `authenticated`
- **Mitigation**:
  - ✅ Bucket policy: `authenticated` access only
  - ✅ Generate signed URLs (TTL 1 hour)
  - ✅ Security audit checklist before deploy
  - ✅ Smoke test: verify unsigned URL returns 403
- **Detection**: Security scan, smoke test failure
- **Response**: Update bucket policy immediately, rotate URLs

### 🟢 Low Risks

#### Risk 7: Invitation Email Delivery Failure
- **Likelihood**: Low (SendGrid 99.9% SLA)
- **Impact**: 🟢 LOW - User frustration, manual resend needed
- **Mitigation**: Retry queue (3 attempts), QR code backup, manual resend button

#### Risk 8: Logo Upload Fails
- **Likelihood**: Low (Supabase 99.9% SLA)
- **Impact**: 🟢 LOW - Kosmetyczny problem
- **Mitigation**: Fallback to initials placeholder, retry button

### 📋 Pre-mortem: "The Great Settings Disaster of Q2 2025"

**Scenario**: Production down 4 godziny, 200+ orgs affected, CEO escalation, emergency rollback

**What went wrong:**

1. **RLS Policy Missing na user_sessions table**
   - Users saw other orgs' sessions → security breach
   - Prevention: Automated RLS check already implemented (Gap 4)

2. **Warehouse Default Location Deleted → PO Receiving Crashed**
   - 50+ POs stuck, receiving blocked
   - Prevention: FK ON DELETE RESTRICT, UI validation added

3. **Supabase Auth Rate Limit Hit → 100 Invitations Failed**
   - Support flooded, bulk invite unusable
   - Prevention: Batch invitations (max 10), queue, progress bar

4. **Missing Index on locations.warehouse_id → 30s Timeouts**
   - Large customers couldn't use system
   - Prevention: Index specified in architecture, performance testing required

5. **Logo Storage Bucket Public → Brand Assets Leaked**
   - Security breach, customer logos exposed
   - Prevention: Bucket policy `authenticated`, signed URLs, security audit

6. **Machine-Line Assignment Race Condition**
   - 2 users assign same machine → constraint violation, UI crash
   - Prevention: Unique constraint `(machine_id, line_id)`, optimistic locking

### Assumptions

| ID | Assumption | Impact if False | Validation |
|----|------------|-----------------|------------|
| A-001 | Supabase supports 1000+ concurrent users per tenant | Performance degradation | Load testing in staging |
| A-002 | SendGrid delivers emails within 5s (p95) | Delayed onboarding | Monitor SendGrid metrics |
| A-003 | Upstash Redis cache hit rate >80% | Increased DB load | Monitor cache metrics |
| A-004 | Organizations have max 100 warehouses | Pagination needed | Query analytics |
| A-005 | Warehouses have max 500 locations | Index performance | Performance testing |
| A-006 | Logo uploads <2MB sufficient for most orgs | User complaints | User feedback |
| A-007 | 7-day invitation expiry sufficient | More resends needed | Track expiry rate |
| A-008 | 10 roles sufficient for all orgs | Custom role requests | User research |

### Open Questions

| ID | Question | Decision Needed By | Owner | Impact |
|----|----------|-------------------|-------|--------|
| Q-001 | Should warehouses support hierarchical structure (parent/child)? | Sprint 0 | PM | Story scope change |
| Q-002 | Do we need soft delete for locations (deleted_at)? | Sprint 0 | Architect | Data retention policy |
| Q-003 | Should invitation QR codes expire same as email links (7 days)? | Sprint 0 | PM | UX consistency |
| Q-004 | Do we support custom roles (beyond 10 predefined) in MVP? | Sprint 0 | PM | Out of scope (FR-SET-011 Phase 2) |
| Q-005 | Should module toggle require re-authentication (security measure)? | Sprint 0 | Security | UX friction vs security |
| Q-006 | Do we need location capacity alerts (80% full warning)? | Sprint 0 | PM | Out of scope (Epic 5) |
| Q-007 | Should allergen preload support multiple languages (EN/PL)? | Sprint 0 | PM | i18n requirement |
| Q-008 | Do we allow duplicate warehouse codes across orgs (multi-tenancy)? | Sprint 0 | Architect | Unique constraint scope |

## Test Strategy Summary

### Test Pyramid

```
           /\
          /E2E\ (20% - 15 tests)
         /------\
        /Integration\ (30% - 45 tests)
       /--------------\
      /    Unit Tests    \ (50% - 150 tests)
     /--------------------\
```

**Coverage Targets:**
- Unit Tests: 95% coverage (classes, utilities, hooks)
- Integration Tests: 70% coverage (API endpoints, DB operations)
- E2E Tests: 100% user flows (onboarding, CRUD, workflows)

### Unit Tests (150 tests, Vitest)

**Testing:**
- Zod validation schemas (Organization, User, Warehouse, Location, etc.)
- Business logic (barcode generation, invitation token creation, session tracking)
- React hooks (useSettings, useWarehouses, useLocations)
- Utility functions (formatters, validators, cache key generators)

**Files:**
```
lib/api/__tests__/SettingsAPI.spec.ts
lib/validation/__tests__/schemas.spec.ts
lib/utils/__tests__/barcode-generator.spec.ts
lib/hooks/__tests__/useSettings.spec.ts
components/settings/__tests__/WarehouseForm.spec.tsx
```

### Integration Tests (45 tests, Vitest + Supabase Test Client)

**Testing:**
- API endpoints (GET/POST/PUT/DELETE dla wszystkich entities)
- Database constraints (unique codes, FK restrictions, RLS policies)
- External service integrations (Supabase Auth, Storage, SendGrid)
- Cache invalidation (Redis events)

**Files:**
```
app/api/settings/__tests__/organization.test.ts (5 tests)
app/api/settings/__tests__/users.test.ts (8 tests)
app/api/settings/__tests__/warehouses.test.ts (6 tests)
app/api/settings/__tests__/locations.test.ts (6 tests)
app/api/settings/__tests__/machines.test.ts (5 tests)
app/api/settings/__tests__/lines.test.ts (5 tests)
app/api/settings/__tests__/allergens.test.ts (4 tests)
app/api/settings/__tests__/tax-codes.test.ts (3 tests)
app/api/settings/__tests__/modules.test.ts (3 tests)
```

**Key Integration Test Scenarios:**
- User creation → Supabase Auth sync → Email sent
- Warehouse creation → Locations → Update defaults (circular dependency)
- Location deletion → FK constraint blocks delete
- Module toggle off → API returns 403
- RLS policy test (Gap 4): User A cannot read User B's data

### E2E Tests (15 tests, Playwright)

**User Flows Tested:**

1. **Onboarding Wizard** (onboarding-wizard.e2e.ts)
   - Complete 6-step wizard
   - Skip wizard, access later from Settings
   - Validate each step before proceeding

2. **Organization Settings** (org-settings.e2e.ts)
   - Update company name, address, regional settings
   - Upload logo (2MB jpg), verify display
   - Invalid logo (3MB) rejected

3. **User Management** (user-management.e2e.ts)
   - Create user, send invitation
   - User signs up via invitation link
   - Edit user role, deactivate user
   - Multi-device logout

4. **Warehouse & Locations** (warehouse-locations.e2e.ts)
   - Create warehouse (defaults NULL)
   - Add 4 locations (Receiving, Shipping, Transit, Production)
   - Update warehouse defaults
   - Delete location (blocked if default)

5. **Master Data** (master-data.e2e.ts)
   - Create machine, assign to line
   - Add custom allergen
   - Add custom tax code
   - Verify preloaded allergens (14 EU)

6. **Module Activation** (module-toggle.e2e.ts)
   - Toggle module off → Navigation hidden
   - API returns 403 for disabled module
   - Toggle back on → Navigation restored

### Performance Tests

**Load Testing (k6):**
- 100 concurrent users accessing Settings page
- 1000 warehouses list query (<200ms target)
- 500 locations query per warehouse (<300ms target)
- 100 logo uploads in 1 minute

**Stress Testing:**
- 10,000 locations in single warehouse (index performance)
- 1000 users in org (pagination)
- 100 simultaneous invitations (SendGrid rate limit)

### Security Tests

**Automated (CI/CD):**
- RLS policy test suite (Gap 4) - 40+ tables
- SQL injection attempts (Supabase client prevents)
- XSS attempts (React auto-escapes)
- CSRF token validation

**Manual (Pre-release):**
- Penetration testing (external security firm)
- Logo bucket access test (unsigned URL → 403)
- JWT expiry test (7-day token rejected)
- Session hijacking test (stolen JWT blacklisted)

### Regression Tests

**Critical Paths (Run on every deploy):**
- User signup → invitation → login flow
- Warehouse creation → location addition → defaults update
- Module toggle → API 403 → toggle back
- Logo upload → display → delete

**Smoke Tests (Post-deploy):**
- Settings page loads <500ms
- User list loads (1000 users) <400ms
- Location query (500 locations) <300ms
- RLS policies active (test query fails for wrong org)
