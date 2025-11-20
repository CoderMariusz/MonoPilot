# Story 1.2: User Management - CRUD

Status: ready-for-dev

## Story

As an **Admin**,
I want to create, view, edit, and deactivate users,
so that I can control who has access to the system.

## Acceptance Criteria

### FR-SET-002: User Management (Stories 1.2, 1.3)

**AC-002.1**: Admin może stworzyć usera z wymaganymi polami:
- email (required, valid email format, unique per org)
- first_name (required, max 50 chars)
- last_name (required, max 50 chars)
- role (dropdown z 10 opcji: admin, manager, operator, viewer, planner, technical, purchasing, warehouse, qc, finance)
- User created with status = 'invited'

**AC-002.2**: User table wyświetla listę użytkowników z kolumnami:
- Email, Name (first_name + last_name), Role, Status, Last Login, Actions
- Table sortowalna po wszystkich kolumnach
- Search bar: wyszukiwanie po name lub email (case-insensitive)
- Filters: role (multi-select dropdown), status (Invited, Active, Inactive)

**AC-002.3**: Edit user functionality:
- Click Edit action → drawer/modal opens
- Editable fields: first_name, last_name, role, status
- Email NIE jest edytowalny (read-only)
- Submit → user updated, table refreshes, success toast

**AC-002.4**: Deactivate user:
- Click Deactivate action → confirmation modal
- On confirm: user.status → 'inactive'
- All active sessions terminated (JWT blacklist)
- User logged out immediately on all devices
- Success toast: "User deactivated and logged out"

**AC-002.5**: Validation - Cannot deactivate last admin:
- If attempting to deactivate last admin in org → show error
- Error message: "Cannot deactivate the last admin user"
- Validate on server before status change

**AC-002.6**: Supabase Auth Integration:
- User creation in public.users table synced with auth.users
- User ID matches between tables (same UUID)

**AC-002.7**: RLS Policy Enforcement:
- Users can only see users from their own org (org_id isolation)
- Admin/Manager roles only can access user management page

**AC-002.8**: Audit Trail:
- created_by, updated_by, created_at, updated_at tracked
- Display "Created by X on YYYY-MM-DD" in user details

## Tasks / Subtasks

### Task 1: Database Schema & Migrations (AC: 002.1, 002.6, 002.7, 002.8)
- [ ] Create `users` table migration with fields:
  - [ ] id UUID PK (synced with auth.users.id)
  - [ ] org_id UUID FK → organizations (RLS key)
  - [ ] email VARCHAR(255) NOT NULL
  - [ ] first_name VARCHAR(50) NOT NULL
  - [ ] last_name VARCHAR(50) NOT NULL
  - [ ] role VARCHAR(20) NOT NULL (enum check constraint)
  - [ ] status VARCHAR(20) NOT NULL DEFAULT 'invited' (enum check)
  - [ ] last_login_at TIMESTAMP
  - [ ] created_by UUID FK → users
  - [ ] updated_by UUID FK → users
  - [ ] created_at TIMESTAMP DEFAULT NOW()
  - [ ] updated_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, email)
- [ ] Add indexes: org_id, email, status, role
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Add check constraint for role enum (10 values)
- [ ] Add check constraint for status enum (invited, active, inactive)
- [ ] Run migration and verify schema

### Task 2: API Endpoints (AC: 002.1, 002.2, 002.3, 002.4, 002.5)
- [ ] Implement GET /api/settings/users
  - [ ] Query params: role?, status?, search?
  - [ ] Filter by org_id (from JWT)
  - [ ] Apply search filter (name/email ILIKE)
  - [ ] Apply role/status filters
  - [ ] Return User[] array
  - [ ] Require Admin or Manager role
- [ ] Implement POST /api/settings/users
  - [ ] Validate with CreateUserSchema (Zod)
  - [ ] Create user in auth.users (Supabase Auth)
  - [ ] Insert into public.users (status = 'invited')
  - [ ] Set created_by = current user
  - [ ] Return created user object
  - [ ] Require Admin role only
- [ ] Implement PUT /api/settings/users/:id
  - [ ] Validate with UpdateUserSchema (Zod)
  - [ ] Check: cannot change email
  - [ ] Validate: cannot deactivate last admin (AC-002.5)
  - [ ] Update public.users record
  - [ ] Set updated_by = current user
  - [ ] Return updated user
  - [ ] Require Admin role only
- [ ] Implement DELETE /api/settings/users/:id (Deactivate)
  - [ ] Set status = 'inactive'
  - [ ] Validate: cannot deactivate last admin
  - [ ] Terminate all sessions (call SessionService)
  - [ ] Set updated_by = current user
  - [ ] Return success: true
  - [ ] Require Admin role only

### Task 3: Zod Validation Schemas (AC: 002.1, 002.3)
- [ ] Create CreateUserSchema
  - [ ] email: z.string().email()
  - [ ] first_name: z.string().min(1).max(50)
  - [ ] last_name: z.string().min(1).max(50)
  - [ ] role: z.enum(['admin', 'manager', 'operator', 'viewer', 'planner', 'technical', 'purchasing', 'warehouse', 'qc', 'finance'])
- [ ] Create UpdateUserSchema
  - [ ] first_name: z.string().min(1).max(50).optional()
  - [ ] last_name: z.string().min(1).max(50).optional()
  - [ ] role: z.enum([...]).optional()
  - [ ] status: z.enum(['invited', 'active', 'inactive']).optional()
  - [ ] Email explicitly excluded (not updatable)
- [ ] Use schemas in both client and server validation

### Task 4: Frontend User Management Page (AC: 002.2, 002.3, 002.4)
- [ ] Create /app/settings/users/page.tsx
- [ ] Implement UserTable component
  - [ ] Columns: Email, Name, Role, Status, Last Login, Actions
  - [ ] Sortable columns (shadcn/ui Table or TanStack Table)
  - [ ] Search input (debounced, 300ms)
  - [ ] Role filter (multi-select dropdown)
  - [ ] Status filter (single-select dropdown)
  - [ ] "Add User" button (opens modal/drawer)
  - [ ] Actions column: Edit, Deactivate buttons
- [ ] Implement UserForm component (modal/drawer)
  - [ ] Fields: email, first_name, last_name, role
  - [ ] Role dropdown (10 options)
  - [ ] Validation with react-hook-form + Zod
  - [ ] Submit → POST /api/settings/users
  - [ ] Success → close modal, refresh table, show toast
  - [ ] Error → show inline error messages
- [ ] Implement EditUserDrawer component
  - [ ] Fields: first_name, last_name, role, status
  - [ ] Email displayed but read-only
  - [ ] Submit → PUT /api/settings/users/:id
  - [ ] Success → close drawer, refresh table, toast
- [ ] Implement Deactivate confirmation modal
  - [ ] Warning message: "This will deactivate [Name] and log them out"
  - [ ] Confirm → DELETE /api/settings/users/:id
  - [ ] Handle error: "Cannot deactivate last admin"

### Task 5: Session Termination Service (AC: 002.4)
- [ ] Create SessionService (or extend existing)
  - [ ] terminateAllSessions(userId: string) method
  - [ ] Add JWT tokens to Redis blacklist (TTL = token expiry)
  - [ ] Update user_sessions.is_active = false (if table exists)
  - [ ] Emit realtime event: 'session.terminated'
- [ ] Call from DELETE /api/settings/users/:id
- [ ] Test: deactivated user logged out within 1s

### Task 6: Last Admin Validation (AC: 002.5)
- [ ] Create validation function: canDeactivateUser(userId, orgId)
  - [ ] Query: count active admin users in org
  - [ ] If count === 1 AND user.role === 'admin' → return false
  - [ ] Else → return true
- [ ] Use in PUT and DELETE endpoints
- [ ] Return 400 error if validation fails
- [ ] Error message: "Cannot deactivate the last admin user"

### Task 7: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Zod schemas (valid/invalid inputs)
  - [ ] Last admin validation logic
- [ ] Integration tests:
  - [ ] POST user → user created in DB + auth.users
  - [ ] GET users → filtered by org, search, role, status
  - [ ] PUT user → updated fields returned
  - [ ] DELETE user → status = inactive, sessions terminated
  - [ ] Last admin protection (attempt deactivate → 400 error)
- [ ] E2E tests (Playwright):
  - [ ] Navigate to /settings/users
  - [ ] Create new user (all roles tested)
  - [ ] Search for user by name/email
  - [ ] Filter by role, status
  - [ ] Edit user (change role)
  - [ ] Deactivate user (confirm → success)
  - [ ] Try deactivate last admin (blocked)

### Task 8: RLS Policy Testing (AC: 002.7)
- [ ] Automated RLS test:
  - [ ] User A creates user in Org 1
  - [ ] User B (Org 2) cannot see Org 1 users
  - [ ] Verify org_id isolation
- [ ] Add to RLS test suite (Gap 4 from Sprint 0)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Form, Dialog, Drawer)
- **Forms**: React Hook Form + Zod validation (client + server)
- **Database**: PostgreSQL 15 via Supabase
- **Auth**: Supabase Auth (JWT sessions)
- **State**: SWR for data fetching/caching
- **Session Management**: Redis for JWT blacklist, Supabase Realtime for session invalidation

### Architecture Patterns
- **Multi-tenancy**: RLS policy on users table enforces org_id isolation
- **Auth Sync**: public.users.id synced with auth.users.id (same UUID)
- **Validation**: Zod schemas shared between client and server
- **Error Handling**: RFC 7807 error responses from API
- **Audit Trail**: created_by, updated_by, timestamps on all changes
- **Session Security**: JWT blacklist in Redis for instant logout

### Key Technical Decisions

1. **10 Role System**:
   - admin: Full access (Settings, all modules)
   - manager: All modules, no Settings access
   - operator: Production execution only
   - viewer: Read-only access to all modules
   - planner: PO, TO, WO creation/management
   - technical: Products, BOMs, Routings
   - purchasing: PO, Suppliers, Receiving
   - warehouse: LP, Stock moves, Inventory
   - qc: Quality module only
   - finance: Costing, Margin analysis

2. **Status Lifecycle**:
   - invited: User created, invitation sent, not signed up yet
   - active: User signed up, can login
   - inactive: Deactivated, cannot login, sessions terminated

3. **Last Admin Protection**:
   - Server-side validation prevents deactivating last admin
   - Client shows error: "Cannot deactivate the last admin user"
   - Maintains at least 1 active admin per org

4. **Session Termination**:
   - Deactivate user → all JWT tokens added to Redis blacklist
   - TTL = token expiry (7 days)
   - Realtime event triggers immediate logout on all devices

### Security Considerations
- **RLS Policy**: Users see only their org's users (org_id = JWT org_id)
- **Role-Based Access**: Admin only for POST/PUT/DELETE, Manager can view (GET)
- **Email Immutability**: Email cannot be changed after creation (security identifier)
- **Last Admin Guard**: Prevents org lockout by blocking last admin deactivation
- **Session Security**: Deactivated users logged out within 1s via JWT blacklist + realtime
- **Input Validation**: Zod schemas prevent SQL injection, XSS

### Project Structure Notes

Expected file locations (Next.js App Router):
```
app/
  settings/
    users/
      page.tsx              # User management table/list page
  api/
    settings/
      users/
        route.ts            # GET /api/settings/users, POST
        [id]/
          route.ts          # PUT /api/settings/users/:id, DELETE

lib/
  validation/
    schemas.ts              # CreateUserSchema, UpdateUserSchema
  api/
    SettingsAPI.ts          # API client methods (getUsers, createUser, updateUser, deactivateUser)
  services/
    SessionService.ts       # terminateAllSessions method

components/
  settings/
    UserTable.tsx           # Table with search/filter/sort
    UserForm.tsx            # Create user modal/drawer
    EditUserDrawer.tsx      # Edit user drawer
    DeactivateConfirmModal.tsx  # Deactivate confirmation

supabase/
  migrations/
    XXXX_create_users.sql   # Users table migration with RLS
```

### Data Model (from Tech Spec)

```typescript
interface User {
  id: string                    // UUID PK (synced with auth.users)
  org_id: string                // FK → organizations, RLS key
  email: string                 // Unique per org, valid email format
  first_name: string            // Required, max 50 chars
  last_name: string             // Required, max 50 chars
  role: UserRole                // Enum: 10 roles
  status: UserStatus            // Enum: invited, active, inactive
  last_login_at?: Date
  created_by: string            // FK → users
  updated_by: string            // FK → users
  created_at: Date
  updated_at: Date
}

enum UserRole {
  admin = 'admin',
  manager = 'manager',
  operator = 'operator',
  viewer = 'viewer',
  planner = 'planner',
  technical = 'technical',
  purchasing = 'purchasing',
  warehouse = 'warehouse',
  qc = 'qc',
  finance = 'finance'
}

enum UserStatus {
  Invited = 'invited',
  Active = 'active',
  Inactive = 'inactive'
}

// Unique constraint: (org_id, email)
// Indexes: org_id, email, status, role
// RLS: org_id = auth.jwt()->>'org_id'
```

### API Endpoints (from Tech Spec)

```typescript
GET    /api/settings/users
  Query: { role?, status?, search? }
  Response: User[]
  Auth: Admin or Manager
  Cache: 5 min TTL

POST   /api/settings/users
  Body: CreateUserInput { email, first_name, last_name, role }
  Response: User + InvitationToken
  Auth: Admin only
  Side effects: Create Supabase Auth user, send invitation email (Story 1.3)

PUT    /api/settings/users/:id
  Body: UpdateUserInput
  Response: User
  Auth: Admin only
  Validation: Cannot change email, cannot deactivate last admin

DELETE /api/settings/users/:id
  Response: { success: boolean }
  Auth: Admin only
  Side effects: Set status = Inactive, terminate all sessions
```

### Testing Strategy

**Unit Tests** (Vitest):
- Zod schema validation (CreateUserSchema, UpdateUserSchema)
- Last admin validation logic
- Role enum validation
- Email format validation

**Integration Tests** (Vitest + Supabase Test Client):
- User creation (public.users + auth.users sync)
- GET users with filters (search, role, status)
- Update user (first_name, last_name, role, status)
- Deactivate user (status change + session termination)
- Last admin protection (validation blocks deactivate)
- RLS policy (cross-org isolation test)

**E2E Tests** (Playwright):
- Complete user management flow (create, search, filter, edit, deactivate)
- Last admin protection (UI shows error when attempting)
- Session termination (deactivated user logged out)
- Role-based access (non-admin cannot access page)

### Performance Targets (from Tech Spec)
- User list (1000 users): <400ms p95 with pagination
- User creation: <500ms
- User search: <200ms (indexed on email, name)
- Deactivate + session termination: <1s

### Learnings from Previous Story

**From Story 1.1 (Organization Configuration)**

Story 1.1 is in status "ready-for-dev" (not yet implemented), so no implementation learnings available yet.

**Key Patterns to Establish:**
- First story to implement Supabase Auth integration
- First story to implement RLS policies with automated testing
- Establishes user management patterns for other epics
- Session management foundation (used in Story 1.4)

**Note for Developer:**
- Story 1.1 should be implemented first (organization table required for org_id FK)
- Follow RLS policy patterns strictly (will be tested in Gap 4 RLS test suite)
- Session termination logic will be reused in Story 1.4 (Session Management)

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.2]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-002]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Users-Table]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#User-Management-API]
- [Source: docs/architecture/patterns/security.md] (RLS policies)
- [Source: docs/architecture/patterns/api.md] (API patterns)

### Prerequisites

**Story 1.1**: Organization Configuration (requires organizations table for org_id FK)

### Dependencies

**External Services:**
- Supabase (Database, Auth, Realtime)
- Redis (Upstash) for JWT blacklist

**Libraries:**
- react-hook-form (form state management)
- zod (validation)
- @supabase/supabase-js (Supabase client)
- @tanstack/react-table or shadcn/ui Table (data table)
- shadcn/ui (UI components: Form, Input, Select, Dialog, Drawer, Toast)

**Internal Dependencies:**
- SessionService (for terminateAllSessions - may need to create)
- organizations table (from Story 1.1)

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-2-user-management-crud.context.xml) - Generated 2025-11-20

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story drafted by Mariusz (from Epic 1 + Tech Spec Epic 1)
