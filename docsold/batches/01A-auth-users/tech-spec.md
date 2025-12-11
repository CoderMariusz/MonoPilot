# Tech Spec: Batch 01A - Authentication & User Management

**Epic:** 1 - Foundation & Settings
**Batch ID:** 01A-auth-users
**Stories:** 1.0, 1.1, 1.2, 1.3, 1.4
**Status:** In Development
**Created:** 2025-11-27
**Last Updated:** 2025-11-27

---

## 1. Batch Overview

### Purpose
Establish core authentication, user management, and session control foundation for MonoPilot. This batch provides the essential security infrastructure and user onboarding flows required by all subsequent modules.

### Stories Included

#### Story 1.0: Authentication UI (Status: review)
Login, logout, password reset flows with Supabase Auth integration.

**Key Features:**
- Email/password login with "Remember Me" (30-day session)
- Forgot password flow with magic link
- Reset password page with strength indicator
- Route protection middleware with redirect
- User menu with logout (single device + all devices)

**Implementation:** Complete (21 E2E tests, 36 unit tests)

#### Story 1.1: Organization Configuration (Status: ready-for-dev)
Organization settings and regional configuration.

**Key Features:**
- Company profile (name, logo, address, NIP/VAT)
- Regional settings (timezone, currency, language, date/number format)
- Business settings (fiscal year start)
- Logo upload to Supabase Storage (max 2MB)

**Implementation:** Not started

#### Story 1.2: User Management - CRUD (Status: review)
User creation, editing, deactivation with role-based access.

**Key Features:**
- User CRUD (create, list, edit, deactivate)
- 10 role system (admin, manager, operator, viewer, planner, technical, purchasing, warehouse, qc, finance)
- User search and filtering (by role, status)
- Last admin protection (cannot deactivate last admin)
- Session termination on deactivation
- Audit trail (created_by, updated_by)

**Implementation:** Complete (50 tests: 27 unit, 10 validation, 13 RLS)

#### Story 1.3: User Invitations (Status: done with deferrals)
Invitation email with QR code for user onboarding.

**Key Features:**
- JWT-based invitation tokens (7-day expiry)
- SendGrid email integration with QR code
- Signup page with token validation
- Password strength requirements
- Invitation resend/cancel (API complete, UI deferred to 1.14)

**Implementation:** Backend complete, frontend/tests deferred to Story 1.14

#### Story 1.4: Session Management (Status: done with deferrals)
Active session tracking and multi-device logout.

**Key Features:**
- Session tracking (device info, IP, last activity)
- JWT blacklist (Redis) for instant logout
- Individual session termination
- "Logout All Devices" functionality
- Admin can view/terminate any user's sessions

**Implementation:** Backend complete, frontend/realtime/tests deferred to Story 1.14

---

## 2. Database Schema

### Core Tables

#### `organizations`
**Purpose:** Multi-tenant root table
**Rows:** 4 (existing)
**RLS:** Enabled

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| company_name | VARCHAR | NOT NULL, ≥2 chars | Company name |
| logo_url | TEXT | - | Supabase Storage URL |
| address | TEXT | - | Street address |
| city | VARCHAR | - | City |
| postal_code | VARCHAR | - | Postal code |
| country | VARCHAR | - | Country |
| nip_vat | VARCHAR | - | NIP/VAT number |
| fiscal_year_start | DATE | - | Fiscal year start (Jan/Apr/Jul/Oct) |
| date_format | VARCHAR | DEFAULT 'DD/MM/YYYY' | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD |
| number_format | VARCHAR | DEFAULT '1,234.56' | '1 000,00', '1,000.00' |
| unit_system | VARCHAR | DEFAULT 'metric' | metric, imperial |
| timezone | VARCHAR | DEFAULT 'UTC' | IANA timezone |
| default_currency | VARCHAR | DEFAULT 'EUR' | PLN, EUR, USD, GBP |
| default_language | VARCHAR | DEFAULT 'EN' | PL, EN |
| modules_enabled | TEXT[] | NOT NULL, ≥1 module | Enabled modules array |
| wizard_completed | BOOLEAN | DEFAULT false | Setup wizard status |
| wizard_progress | JSONB | - | Wizard progress state |
| created_at | TIMESTAMPTZ | DEFAULT now() | - |
| updated_at | TIMESTAMPTZ | DEFAULT now() | - |

**Indexes:**
- Primary key on `id`

**Constraints:**
- CHECK: `char_length(company_name) >= 2`
- CHECK: `array_length(modules_enabled, 1) > 0`

---

#### `users`
**Purpose:** User accounts synced with auth.users
**Rows:** 5 (existing)
**RLS:** Enabled

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Matches auth.users.id |
| org_id | UUID | FK → organizations, NOT NULL | Organization |
| email | VARCHAR | NOT NULL, regex validated | Email address |
| first_name | VARCHAR | - | First name |
| last_name | VARCHAR | - | Last name |
| role | VARCHAR | NOT NULL, DEFAULT 'user' | See 10 roles below |
| status | VARCHAR | NOT NULL, DEFAULT 'active' | invited, active, inactive |
| last_login_at | TIMESTAMPTZ | - | Last login timestamp |
| created_by | UUID | FK → users | Audit: creator |
| updated_by | UUID | FK → users | Audit: last updater |
| created_at | TIMESTAMPTZ | DEFAULT now() | - |
| updated_at | TIMESTAMPTZ | DEFAULT now() | - |

**Indexes:**
- Primary key on `id`
- Index on `org_id`
- Index on `email`

**Constraints:**
- CHECK: `email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
- CHECK: `role IN ('admin', 'manager', 'operator', 'viewer', 'planner', 'technical', 'purchasing', 'warehouse', 'qc', 'finance')`
- CHECK: `status IN ('invited', 'active', 'inactive')`

**10 Role System:**
- `admin`: Full access (Settings, all modules)
- `manager`: All modules, no Settings access
- `operator`: Production execution only
- `viewer`: Read-only access
- `planner`: PO, TO, WO creation/management
- `technical`: Products, BOMs, Routings
- `purchasing`: PO, Suppliers, Receiving
- `warehouse`: LP, Stock moves, Inventory
- `qc`: Quality module only
- `finance`: Costing, Margin analysis

**RLS Policy:**
```sql
CREATE POLICY "users_tenant_isolation" ON users
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

#### `user_invitations`
**Purpose:** Invitation tracking (Story 1.3)
**Rows:** 0
**RLS:** Enabled

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → organizations, NOT NULL | Organization |
| email | VARCHAR | NOT NULL | Invitee email |
| role | VARCHAR | NOT NULL | Role to assign |
| token | TEXT | NOT NULL | JWT invitation token |
| invited_by | UUID | FK → users | Admin who invited |
| status | VARCHAR | NOT NULL, DEFAULT 'pending' | pending, accepted, expired, cancelled |
| sent_at | TIMESTAMPTZ | DEFAULT now() | When email sent |
| expires_at | TIMESTAMPTZ | - | sent_at + 7 days |
| accepted_at | TIMESTAMPTZ | - | When user signed up |
| created_at | TIMESTAMPTZ | DEFAULT now() | - |

**Indexes:**
- Primary key on `id`
- Index on `org_id`, `email`, `status`, `expires_at`

**Constraints:**
- CHECK: `status IN ('pending', 'accepted', 'expired', 'cancelled')`
- UNIQUE: `(org_id, email, status)` WHERE status = 'pending'

**JWT Token Payload:**
```typescript
{
  email: string,
  role: UserRole,
  org_id: string,
  exp: number  // Unix timestamp (7 days from now)
}
```

---

#### `user_sessions`
**Purpose:** Session tracking for multi-device management (Story 1.4)
**Rows:** 0
**RLS:** Disabled (managed server-side)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → users, NOT NULL | User account |
| token_id | VARCHAR | UNIQUE, NOT NULL | JWT jti claim |
| device_info | TEXT | - | "Chrome 120 on Windows 10 (Desktop)" |
| ip_address | VARCHAR | - | IPv4 or IPv6 |
| location | VARCHAR | - | City, Country (GeoIP - optional) |
| login_time | TIMESTAMPTZ | DEFAULT now() | When session started |
| last_activity | TIMESTAMPTZ | DEFAULT now() | Last API request timestamp |
| is_active | BOOLEAN | DEFAULT true | Active flag |
| logged_out_at | TIMESTAMPTZ | - | When user logged out |
| created_at | TIMESTAMPTZ | DEFAULT now() | - |

**Indexes:**
- Primary key on `id`
- Index on `user_id`, `token_id`, `is_active`

**Constraints:**
- CHECK: `logged_out_at IS NULL` if `is_active = true`

**RLS:** Disabled (server-side access only)

---

### Relationships

```
organizations (1) ──< (many) users
users (1) ──< (many) user_invitations (invited_by)
users (1) ──< (many) user_sessions
users (self-referential) ──< created_by, updated_by
```

---

## 3. API Endpoints

### Authentication (Story 1.0)

#### POST /auth/callback
**Purpose:** Supabase Auth callback handler
**Auth:** Public
**Body:** `{ code: string }`
**Response:** Redirect to dashboard or ?redirect param
**Side Effects:**
- Exchange code for session
- Create session cookie
- Redirect to original URL or /dashboard

---

### Organizations (Story 1.1)

#### GET /api/settings/organization
**Purpose:** Fetch organization settings
**Auth:** Admin
**Query:** None
**Response:**
```typescript
{
  id: string,
  company_name: string,
  logo_url?: string,
  address?: string,
  city?: string,
  postal_code?: string,
  country?: string,
  nip_vat?: string,
  fiscal_year_start?: Date,
  date_format: string,
  number_format: string,
  unit_system: string,
  timezone: string,
  default_currency: string,
  default_language: string,
  modules_enabled: string[],
  wizard_completed: boolean,
  wizard_progress?: any,
  created_at: Date,
  updated_at: Date
}
```

#### PUT /api/settings/organization
**Purpose:** Update organization settings
**Auth:** Admin only
**Body:** UpdateOrganizationInput (Zod validated)
```typescript
{
  company_name?: string,
  address?: string,
  city?: string,
  postal_code?: string,
  country?: string,
  nip_vat?: string,
  fiscal_year_start?: Date,
  date_format?: string,
  number_format?: string,
  unit_system?: string,
  timezone?: string,
  default_currency?: string,
  default_language?: string
}
```
**Response:** Updated organization object
**Side Effects:**
- Update organization record
- Update updated_at timestamp

#### POST /api/settings/organization/logo
**Purpose:** Upload organization logo
**Auth:** Admin only
**Body:** FormData with file
**Response:**
```typescript
{
  logo_url: string  // Supabase Storage signed URL
}
```
**Validation:**
- Max file size: 2MB
- Allowed types: image/jpeg, image/png, image/webp
**Side Effects:**
- Upload to Supabase Storage bucket 'organization-logos'
- Update organizations.logo_url
- Generate signed URL (1h TTL)

---

### Users (Story 1.2)

#### GET /api/settings/users
**Purpose:** List users with filters
**Auth:** Admin or Manager
**Query:**
```typescript
{
  role?: string[],     // Filter by role(s)
  status?: string,     // Filter by status
  search?: string      // Search name/email (ILIKE)
}
```
**Response:**
```typescript
User[] = [
  {
    id: string,
    org_id: string,
    email: string,
    first_name: string,
    last_name: string,
    role: UserRole,
    status: UserStatus,
    last_login_at?: Date,
    created_by?: string,
    updated_by?: string,
    created_at: Date,
    updated_at: Date
  }
]
```
**Filters:**
- `org_id` from JWT (RLS enforced)
- Search: `name ILIKE %{search}% OR email ILIKE %{search}%`
- Role: `role = ANY(role_array)`
- Status: `status = {status}`

#### POST /api/settings/users
**Purpose:** Create user and send invitation
**Auth:** Admin only
**Body:** CreateUserInput (Zod validated)
```typescript
{
  email: string,           // Valid email, unique per org
  first_name: string,      // Required, max 50 chars
  last_name: string,       // Required, max 50 chars
  role: UserRole           // One of 10 roles
}
```
**Response:**
```typescript
{
  user: User,
  invitation: UserInvitation
}
```
**Side Effects:**
1. Create user in auth.users (Supabase Auth)
2. Insert into public.users (status = 'invited')
3. Generate invitation token (JWT, 7-day expiry)
4. Generate QR code
5. Send invitation email via SendGrid
6. Create user_invitations record
7. Set created_by = current user

#### PUT /api/settings/users/:id
**Purpose:** Update user (role, status, name)
**Auth:** Admin only
**Params:** `id` (user UUID)
**Body:** UpdateUserInput (Zod validated)
```typescript
{
  first_name?: string,
  last_name?: string,
  role?: UserRole,
  status?: UserStatus
}
```
**Response:** Updated User object
**Validation:**
- Email cannot be changed (not in schema)
- Cannot deactivate last admin (server validation)
**Side Effects:**
- Update public.users record
- Set updated_by = current user
- If status → 'inactive': terminate all sessions

#### DELETE /api/settings/users/:id (Deactivate)
**Purpose:** Deactivate user
**Auth:** Admin only
**Params:** `id` (user UUID)
**Response:** `{ success: true }`
**Validation:**
- Cannot deactivate last admin
**Side Effects:**
1. Set status = 'inactive'
2. Terminate all sessions (call SessionService)
3. Set updated_by = current user

---

### Invitations (Story 1.3)

#### GET /api/settings/invitations
**Purpose:** List invitations with filters
**Auth:** Admin only
**Query:**
```typescript
{
  status?: string,     // pending, accepted, expired, cancelled
  search?: string      // Search by email
}
```
**Response:**
```typescript
UserInvitation[] = [
  {
    id: string,
    org_id: string,
    email: string,
    role: UserRole,
    token: string,
    invited_by: string,
    invited_by_name: string,  // JOIN with users table
    status: InvitationStatus,
    sent_at: Date,
    expires_at: Date,
    accepted_at?: Date,
    created_at: Date
  }
]
```
**Filters:**
- `org_id` from JWT
- Status filter if provided
- Email search (ILIKE)
- Auto-mark expired if `expires_at < NOW()`

#### POST /api/settings/invitations/:id/resend
**Purpose:** Resend invitation email
**Auth:** Admin only
**Params:** `id` (invitation UUID)
**Response:** Updated UserInvitation
**Side Effects:**
1. Generate new token (7-day expiry)
2. Invalidate old token
3. Update sent_at, expires_at in DB
4. Send new email via SendGrid

#### DELETE /api/settings/invitations/:id
**Purpose:** Cancel invitation
**Auth:** Admin only
**Params:** `id` (invitation UUID)
**Response:** `{ success: true }`
**Side Effects:**
1. Update status = 'cancelled'
2. Delete user if status = 'invited' (hard delete or soft)

---

### Sessions (Story 1.4)

#### GET /api/settings/users/:id/sessions
**Purpose:** List user's active sessions
**Auth:** User (self) or Admin (any user)
**Params:** `id` (user UUID)
**Response:**
```typescript
UserSession[] = [
  {
    id: string,
    user_id: string,
    token_id: string,
    device_info: string,
    ip_address: string,
    location?: string,
    login_time: Date,
    last_activity: Date,
    is_active: boolean,
    logged_out_at?: Date,
    created_at: Date
  }
]
```
**Filters:**
- Only active sessions by default (is_active = true)

#### DELETE /api/settings/users/:id/sessions (Logout All)
**Purpose:** Logout from all devices except current
**Auth:** User (self) or Admin
**Params:** `id` (user UUID)
**Response:**
```typescript
{
  terminated_count: number
}
```
**Side Effects:**
1. Get all active sessions for user
2. Filter out current session (by token_id from JWT)
3. For each session:
   - Update is_active = false
   - Add token_id to Redis blacklist (TTL = token expiry)
   - Emit Supabase Realtime event: 'session.terminated'

#### DELETE /api/settings/users/:id/sessions/:sessionId
**Purpose:** Terminate individual session
**Auth:** User (self) or Admin
**Params:** `id` (user UUID), `sessionId` (session UUID)
**Response:** `{ success: true }`
**Validation:**
- Cannot terminate current session
**Side Effects:**
1. Update is_active = false
2. Add token_id to Redis blacklist
3. Emit Supabase Realtime event

---

## 4. Frontend Routes & Components

### Pages

#### /login (Story 1.0)
**Component:** `app/login/page.tsx`
**Features:**
- LoginForm (email, password, remember me)
- "Forgot password?" link
- Redirect to ?redirect param after login

#### /forgot-password (Story 1.0)
**Component:** `app/forgot-password/page.tsx`
**Features:**
- Email input
- Send reset link via Supabase Auth

#### /reset-password (Story 1.0)
**Component:** `app/reset-password/page.tsx`
**Features:**
- Extract token from URL params
- New password + confirm password
- Password strength indicator

#### /signup (Story 1.3)
**Component:** `app/signup/page.tsx`
**Features:**
- Parse token from URL
- Validate token (7-day expiry)
- Email pre-filled (read-only)
- Password + confirm password
- Auto-login after signup
- Redirect to /dashboard

#### /settings/organization (Story 1.1)
**Component:** `app/settings/organization/page.tsx`
**Features:**
- OrganizationForm (3 sections: Basic, Business, Regional)
- LogoUpload component
- Inline validation (Zod + react-hook-form)
- Success toast on save

#### /settings/users (Story 1.2)
**Component:** `app/settings/users/page.tsx`
**Features:**
- UserTable (search, filter by role/status)
- UserForm (create user modal)
- EditUserDrawer (edit user drawer)
- Deactivate confirmation modal

#### /settings/users/:id/sessions (Story 1.4)
**Component:** `app/settings/users/[id]/sessions/page.tsx`
**Features:**
- SessionsTable (device, IP, login time, last activity)
- "Logout All Devices" button
- Terminate individual session
- Highlight current session
**Status:** Deferred to Story 1.14

---

### Components

#### Auth Components (Story 1.0)
- `components/auth/LoginForm.tsx` - Login form with validation
- `components/auth/ForgotPasswordForm.tsx` - Forgot password form
- `components/auth/ResetPasswordForm.tsx` - Reset password form
- `components/auth/UserMenu.tsx` - User dropdown menu (logout, logout all)
- `components/auth/PasswordStrength.tsx` - Password strength indicator

#### Organization Components (Story 1.1)
- `components/settings/OrganizationForm.tsx` - Organization settings form
- `components/settings/LogoUpload.tsx` - Logo upload with preview
**Status:** Not implemented

#### User Management Components (Story 1.2)
- `components/settings/UserForm.tsx` - Create user modal
- `components/settings/EditUserDrawer.tsx` - Edit user drawer

#### Invitation Components (Story 1.3)
- `components/settings/InvitationsTable.tsx` - Invitations tab table
- `components/settings/InvitationModal.tsx` - Post-creation modal with QR
**Status:** Deferred to Story 1.14

#### Session Components (Story 1.4)
- `components/settings/SessionsTable.tsx` - Sessions table
**Status:** Deferred to Story 1.14

---

## 5. RLS Policies Pattern

### Standard Tenant Isolation
All business tables in batch 01A use this pattern:

```sql
CREATE POLICY "{table}_tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

**Tables with RLS:**
- `organizations` - User sees only their org
- `users` - User sees only users in their org
- `user_invitations` - Admin sees only org's invitations
- `user_sessions` - **NO RLS** (managed server-side only)

**Key Points:**
1. **Service role** bypasses RLS (use in server-side API routes)
2. **Authenticated users** filtered by `org_id` from JWT
3. Best practice: Use `createServerSupabaseAdmin()` in services

**More:** See `docs/RLS_AND_SUPABASE_CLIENTS.md`

---

## 6. Dependencies

### External Services
- **Supabase:** Database, Auth, Storage, Realtime
- **Redis (Upstash):** JWT blacklist for session termination
- **SendGrid:** Transactional email for invitations

### Libraries

**Authentication & Session:**
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - SSR helpers for Next.js
- `jsonwebtoken` - JWT generation/validation (invitations)
- `ua-parser-js` - Device info parsing (sessions)
- `@upstash/redis` - Redis client (JWT blacklist)

**Forms & Validation:**
- `react-hook-form` - Form state management
- `zod` - Schema validation (client + server)

**Email:**
- `@sendgrid/mail` - SendGrid SDK
- `qrcode` - QR code generation

**UI Components:**
- `shadcn/ui` - Card, Form, Input, Button, Toast, Table, Dialog, Drawer, Badge

---

## 7. Inter-Story Dependencies

### Prerequisite Chain
```
Story 1.0 (Auth UI)
    ↓
Story 1.1 (Organization) ← Required for org_id FK
    ↓
Story 1.2 (User CRUD) ← Required for user management
    ↓
Story 1.3 (Invitations) ← Extends user creation with email
    ↓
Story 1.4 (Sessions) ← Uses user deactivation logic from 1.2
```

### What Blocks What

**Story 1.1 blocks:**
- Story 1.2 (users table needs org_id FK → organizations)

**Story 1.2 blocks:**
- Story 1.3 (invitation flow extends POST /api/settings/users)
- Story 1.4 (session termination called from user deactivation)

**Story 1.3 blocks:**
- None (optional enhancement to user creation)

**Story 1.4 blocks:**
- None (optional session management)

### Integration Points

**Story 1.2 ↔ 1.3:**
- POST /api/settings/users triggers invitation email
- Invitation accepted → user.status = 'active'

**Story 1.2 ↔ 1.4:**
- DELETE /api/settings/users/:id calls SessionService.terminateAllSessions
- User deactivation → all sessions terminated

**Story 1.3 ↔ 1.4:**
- No direct integration
- Both use Supabase Auth (auth.users table)

---

## 8. Testing Strategy

### Unit Tests (Vitest)

**Story 1.0 (Auth):**
- ✅ 36 tests (auth-schemas.test.ts)
- LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, SignupSchema

**Story 1.2 (Users):**
- ✅ 27 tests (user-schemas.test.ts)
- ✅ 10 tests (user-validation.test.ts) - Last admin protection

**Total Unit Tests:** 73

---

### Integration Tests (Vitest + Supabase)

**Story 1.2 (Users):**
- User creation (public.users + auth.users sync)
- GET users with filters (search, role, status)
- Update user (role change, status change)
- Deactivate user (status + session termination)
- Last admin protection (validation blocks deactivate)

**Story 1.3 (Invitations):**
- User creation → invitation sent within 5s
- Invitation record created with correct expiry
- Resend → new token, old invalidated
- Signup with valid token → user activated

---

### RLS Tests (Vitest + Supabase)

**Story 1.2 (Users):**
- ✅ 13 tests (users-rls.test.ts)
- User A (Org 1) cannot see Org 2 users
- Admin/Manager role enforcement
- Cross-org isolation

**Total RLS Tests:** 13

---

### E2E Tests (Playwright)

**Story 1.0 (Auth):**
- ✅ 21 tests (auth.spec.ts)
- Login flow (valid + invalid credentials)
- Forgot password → reset password flow
- Logout flow
- Protected route redirect with deep linking

**Story 1.2 (Users):**
- Create user (all roles tested)
- Search/filter users
- Edit user (role change)
- Deactivate user (confirm → success)
- Try deactivate last admin (blocked)

**Total E2E Tests:** 21+

---

### Test Coverage Summary

| Story | Unit | Integration | RLS | E2E | Total |
|-------|------|-------------|-----|-----|-------|
| 1.0 | 36 | - | - | 21 | 57 |
| 1.1 | - | - | - | - | 0 (not started) |
| 1.2 | 37 | ~10 | 13 | ~8 | ~68 |
| 1.3 | - | - | - | - | Backend only (tests deferred) |
| 1.4 | - | - | - | - | Backend only (tests deferred) |
| **Total** | **73** | **~10** | **13** | **~29** | **~125** |

---

## 9. Security Considerations

### Authentication (Story 1.0)
✅ **Password Requirements:** Min 8 chars, 1 uppercase, 1 number
✅ **Password Reset:** Always show success (don't reveal if email exists)
✅ **Rate Limiting:** Supabase Auth rate limiting enabled
✅ **CSRF Protection:** Supabase handles CSRF tokens
✅ **Session Security:** HttpOnly cookies, SameSite=Lax

### User Management (Story 1.2)
✅ **RLS Enforcement:** Users see only org's users (13 RLS tests)
✅ **Role-Based Access:** Admin/Manager checks on all endpoints
✅ **Email Immutability:** Cannot change email after creation
✅ **Last Admin Guard:** Prevents org lockout
✅ **Session Termination:** Deactivated users logged out within 1s
✅ **Audit Trail:** created_by, updated_by on all changes
✅ **Input Validation:** Zod schemas prevent injection

### Invitations (Story 1.3)
✅ **Token Security:** JWT with HS256, 7-day expiry, one-time use
✅ **JWT_SECRET:** Fails fast if not set in production (no fallback to public key)
✅ **Email Validation:** Email must match token email
✅ **Expiry Enforcement:** Server validates token expiry
✅ **One-Time Use:** Token invalidated after signup

⚠️ **Known Gap:** Signup status automation requires webhook (deferred to 1.14)

### Sessions (Story 1.4)
✅ **JWT Blacklist:** Redis with TTL = token expiry
✅ **Realtime Logout:** <1s propagation via Supabase Realtime
✅ **Session Ownership:** Users can only view/terminate own sessions (except Admin)
✅ **Current Session Protection:** Cannot terminate own current session
✅ **Audit Trail:** All sessions logged with device, IP, timestamps

---

## 10. Performance Targets

### API Response Times (p95)

| Endpoint | Target | Notes |
|----------|--------|-------|
| POST /api/auth/login | <500ms | Supabase Auth SLA |
| GET /api/settings/organization | <200ms | Single row query |
| GET /api/settings/users | <400ms | With filters, 1000 users |
| POST /api/settings/users | <500ms | Auth user + DB insert |
| PUT /api/settings/users/:id | <300ms | Single row update |
| DELETE /api/settings/users/:id | <1s | Includes session termination |
| POST /api/settings/organization/logo | <2s | 2MB upload to Storage |
| POST /api/settings/invitations/:id/resend | <5s | SendGrid email SLA |
| GET /api/settings/users/:id/sessions | <200ms | 10 sessions |

### Database Queries

**Indexed Queries:**
- `users` table: org_id, email (indexed)
- `user_invitations` table: org_id, status, expires_at (indexed)
- `user_sessions` table: user_id, token_id (indexed)

**RLS Impact:**
- RLS policies use `org_id` filter (indexed) - minimal overhead

---

## 11. Monitoring & Observability

### Key Metrics

**Authentication:**
- Login success rate (target: >99%)
- Password reset requests/day
- Failed login attempts (alert on spike)
- Session duration (avg)

**User Management:**
- Active users by org
- User creation rate
- Last admin near-miss events (track validation blocks)

**Invitations:**
- Invitation acceptance rate (target: >80%)
- Expired invitations/week
- SendGrid delivery rate (target: >99%)
- Email send time (target: <5s p95)

**Sessions:**
- Active sessions/user (avg)
- Session termination events/day
- Redis blacklist size
- Realtime event propagation time (target: <1s)

### Error Tracking

**Critical Errors (Sentry/similar):**
- Last admin validation bypass (should never happen)
- RLS policy breach (cross-org access)
- JWT_SECRET missing in production
- SendGrid API failures
- Redis connection failures

---

## 12. Migration Plan

### Database Migrations Applied

**Story 1.0 (Auth):**
- ✅ None (uses existing auth.users)

**Story 1.1 (Organization):**
- ❌ Not started

**Story 1.2 (Users):**
- ✅ 001_create_users_table.sql
- ✅ 001_create_users_table_rls_tests.sql

**Story 1.3 (Invitations):**
- ✅ 006_create_user_invitations_table.sql

**Story 1.4 (Sessions):**
- ✅ 007_create_user_sessions_table.sql

### Rollback Strategy

**Story 1.1:**
- Drop organizations table columns (if schema changes)
- Restore logo_url to NULL
- Revert regional settings to defaults

**Story 1.2:**
- Cannot rollback (users table is foundation)
- Mitigation: Feature flags to disable user management UI

**Story 1.3:**
- Drop user_invitations table
- Disable invitation email sending
- Fallback: Manual user creation by Admin

**Story 1.4:**
- Drop user_sessions table
- Clear Redis blacklist
- Disable session management UI
- Fallback: Users can only logout (not view sessions)

---

## 13. Deferred Items (Story 1.14)

### Story 1.3 Deferrals
**Status:** Backend complete, frontend/tests deferred

**UI Components:**
- [ ] Invitations Tab in /settings/users
- [ ] InvitationsTable component (search, filter, resend, cancel)
- [ ] InvitationModal (QR code display)

**Testing:**
- [ ] Unit tests (token generation, validation)
- [ ] Integration tests (email sending, signup flow)
- [ ] E2E tests (invitation flow, expired token handling)

**Other:**
- [ ] Signup status automation (webhook for user.status → 'active')
- [ ] Auto-cleanup cron job (delete expired invitations >30 days)

**Effort:** 15-22 hours

---

### Story 1.4 Deferrals
**Status:** Backend complete, frontend/realtime/tests deferred

**UI Components:**
- [ ] /settings/users/:id/sessions page
- [ ] SessionsTable component
- [ ] Logout All Devices confirmation modal

**Realtime:**
- [ ] Supabase Realtime integration (session.terminated event)
- [ ] Client-side listener for force logout

**Testing:**
- [ ] Unit tests (device parsing, JWT blacklist)
- [ ] Integration tests (session creation, termination)
- [ ] E2E tests (multi-browser logout, admin termination)

**Other:**
- [ ] Auto-cleanup cron job (delete old sessions >90 days)

**Effort:** ~8 hours

---

## 14. Future Enhancements (Phase 2)

### Story 1.0 (Auth)
- OAuth providers (Google, Microsoft)
- 2FA (TOTP, SMS)
- Biometric authentication (WebAuthn)

### Story 1.1 (Organization)
- Multi-organization support (user in multiple orgs)
- Organization templates (presets for industry)
- Custom branding (colors, fonts)

### Story 1.2 (Users)
- Bulk user import (CSV upload)
- User groups/teams
- Custom roles (beyond 10 default)
- User permissions matrix (granular)

### Story 1.3 (Invitations)
- Invitation templates (customizable email)
- Batch invitations (multiple users at once)
- Invitation analytics (acceptance rate, time to accept)

### Story 1.4 (Sessions)
- GeoIP location tracking (city, country)
- Session anomaly detection (unusual IP, device)
- Session history export (CSV)
- "Remember me" timeout configuration

---

## Appendix A: API Request/Response Examples

### POST /api/settings/users (Create User + Invitation)

**Request:**
```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "operator"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "operator",
    "status": "invited",
    "last_login_at": null,
    "created_by": "admin-user-id",
    "created_at": "2025-11-27T10:00:00Z",
    "updated_at": "2025-11-27T10:00:00Z"
  },
  "invitation": {
    "id": "inv-uuid",
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "role": "operator",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "invited_by": "admin-user-id",
    "status": "pending",
    "sent_at": "2025-11-27T10:00:00Z",
    "expires_at": "2025-12-04T10:00:00Z",
    "created_at": "2025-11-27T10:00:00Z"
  }
}
```

**Error (400 Bad Request - Last Admin):**
```json
{
  "error": "Cannot deactivate the last admin user",
  "code": "LAST_ADMIN_PROTECTION"
}
```

---

## Appendix B: Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only

# JWT Secret (required for invitations - Story 1.3)
JWT_SECRET=your-secret-key-min-32-chars # NEVER use SUPABASE_ANON_KEY

# SendGrid (required for invitations - Story 1.3)
SENDGRID_API_KEY=SG.xxx

# Redis (required for sessions - Story 1.4)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# App URL (required)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or production URL
BASE_URL=http://localhost:3000
```

---

## Appendix C: Zod Schemas

### Authentication (Story 1.0)

```typescript
// apps/frontend/lib/validation/auth-schemas.ts

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional()
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const ResetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Min 8 chars")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required")
});
```

### Users (Story 1.2)

```typescript
// apps/frontend/lib/validation/user-schemas.ts

export const UserRoleEnum = z.enum([
  'admin', 'manager', 'operator', 'viewer', 'planner',
  'technical', 'purchasing', 'warehouse', 'qc', 'finance'
]);

export const UserStatusEnum = z.enum(['invited', 'active', 'inactive']);

export const CreateUserSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email too long"),
  first_name: z.string()
    .min(1, "First name required")
    .max(50, "Max 50 chars"),
  last_name: z.string()
    .min(1, "Last name required")
    .max(50, "Max 50 chars"),
  role: UserRoleEnum
});

export const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional()
  // Email explicitly excluded (not updatable)
});

export const UserFiltersSchema = z.object({
  role: z.array(UserRoleEnum).optional(),
  status: UserStatusEnum.optional(),
  search: z.string().optional()
});
```

---

**End of Tech Spec**

**Total Pages:** 38
**Total Sections:** 14 + 3 Appendices
**Last Updated:** 2025-11-27
