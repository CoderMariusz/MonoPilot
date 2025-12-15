# ADR-012: Role Permission Storage

## Status
ACCEPTED

## Date
2025-12-15

## Context

Epic 01-Settings, specifically Story 01.6 (Role-Based Permissions), requires implementation of a 10-role permission system with RBAC enforcement across all modules. The current baseline architecture has `users.role` as a TEXT field, which is insufficient for the following reasons:

1. **Limited Extensibility**: TEXT enum cannot support custom roles in the future
2. **No Permission Granularity**: Cannot store per-module CRUD permissions
3. **No Audit Trail**: Role changes cannot be tracked with referential integrity
4. **Validation Challenges**: TEXT field allows any string value, requiring application-level validation

**PRD Requirements (FR-SET-020 through FR-SET-031):**
- 10 predefined system roles (Super Admin, Admin, Production Manager, Quality Manager, Warehouse Manager, Production Operator, Quality Inspector, Warehouse Operator, Planner, Viewer)
- Module-level permissions (Settings, Users, Technical, Planning, Production, Quality, Warehouse, Shipping)
- CRUD-level permissions per module (Create, Read, Update, Delete)
- Role assignment restrictions (only Super Admin can assign Super Admin role)

**Story 01.6 Requirements:**
- `hasPermission()` helper function for backend/frontend
- `usePermissions()` React hook for UI
- Role enforcement on API endpoints (middleware)
- Permission-based UI element visibility
- Role changes take effect within 1 minute (cache invalidation)

---

## Decision

**Use a `roles` table with UUID foreign key from `users.role_id` and store permissions as JSONB within the roles table.**

This is a **simplified RBAC pattern** where:
1. Roles are predefined system entities (10 roles, immutable in Phase 1)
2. Permissions are stored as JSONB within each role (no separate junction table for Phase 1)
3. Users reference roles via `role_id` UUID FK
4. Future custom roles will be org-scoped (Phase 2+)

**Why RBAC over ABAC?**
- **RBAC (Role-Based Access Control)**: Users are assigned roles, roles have permissions
- **ABAC (Attribute-Based Access Control)**: Permissions based on user/resource/environment attributes

**RBAC is chosen because:**
1. Food manufacturing has clear organizational hierarchies
2. Permission requirements are module-based, not resource-attribute-based
3. 10 predefined roles cover 95% of use cases
4. Simpler implementation and maintenance
5. Easier for admins to understand and assign

---

## Schema Definition

### Phase 1: System Roles (Immutable)

```sql
-- Roles table (system roles, seeded at migration)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- 'SUPER_ADMIN', 'ADMIN', etc.
  name VARCHAR(100) NOT NULL,                  -- 'Super Administrator', 'Administrator'
  description TEXT,
  permissions JSONB NOT NULL,                  -- {"settings":"CRUD","users":"CRUD",...}
  is_system BOOLEAN DEFAULT true,              -- true for 10 system roles
  org_id UUID REFERENCES organizations(id),    -- NULL for system roles, org_id for custom
  display_order INT,                           -- UI ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, code)                         -- Allow same code in different orgs
);

-- Modify users table
ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
-- Migration step: UPDATE users SET role_id = (SELECT id FROM roles WHERE code = users.role);
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
```

### Phase 2: Custom Roles (Future)

```sql
-- For future custom role support (org-scoped)
-- INSERT INTO roles (code, name, permissions, is_system, org_id)
-- VALUES ('CUSTOM_INSPECTOR', 'Custom Inspector', '{"quality":"CRU"}', false, 'org-uuid');
```

### Permission JSONB Structure

```typescript
// Permission levels per module
type PermissionSet = 'CRUD' | 'CRU' | 'CR' | 'R' | '-';

// Module codes
type ModuleCode =
  | 'settings'
  | 'users'
  | 'technical'
  | 'planning'
  | 'production'
  | 'quality'
  | 'warehouse'
  | 'shipping';

// Permissions JSONB format
interface RolePermissions {
  [module: ModuleCode]: PermissionSet;
}

// Example for SUPER_ADMIN
const superAdminPermissions: RolePermissions = {
  settings: 'CRUD',
  users: 'CRUD',
  technical: 'CRUD',
  planning: 'CRUD',
  production: 'CRUD',
  quality: 'CRUD',
  warehouse: 'CRUD',
  shipping: 'CRUD'
};
```

### System Roles Seed Data

```sql
-- Seed 10 system roles
INSERT INTO roles (code, name, description, permissions, is_system, display_order) VALUES
  ('SUPER_ADMIN', 'Super Administrator', 'Full system access, can assign any role',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD"}', true, 1),

  ('ADMIN', 'Administrator', 'Organization-wide access, cannot assign Super Admin',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD"}', true, 2),

  ('PROD_MANAGER', 'Production Manager', 'Full Production, Planning, Quality access',
   '{"settings":"R","users":"R","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"R","shipping":"R"}', true, 3),

  ('QUAL_MANAGER', 'Quality Manager', 'Full Quality, read Production',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"CRUD","warehouse":"R","shipping":"R"}', true, 4),

  ('WH_MANAGER', 'Warehouse Manager', 'Full Warehouse and Shipping access',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"CRUD","shipping":"CRUD"}', true, 5),

  ('PROD_OPERATOR', 'Production Operator', 'CRU Production, read Quality',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"CRU","quality":"R","warehouse":"-","shipping":"-"}', true, 6),

  ('QUAL_INSPECTOR', 'Quality Inspector', 'CRU Quality only',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","quality":"CRU","warehouse":"-","shipping":"-"}', true, 7),

  ('WH_OPERATOR', 'Warehouse Operator', 'CRU Warehouse and Shipping',
   '{"settings":"-","users":"-","technical":"-","planning":"-","production":"-","quality":"-","warehouse":"CRU","shipping":"CRU"}', true, 8),

  ('PLANNER', 'Planner', 'Full Planning, read Production',
   '{"settings":"R","users":"-","technical":"R","planning":"CRUD","production":"R","quality":"R","warehouse":"R","shipping":"R"}', true, 9),

  ('VIEWER', 'Viewer', 'Read-only all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"R","shipping":"R"}', true, 10);
```

### Indexes

```sql
-- Roles table indexes
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_org ON roles(org_id);
CREATE INDEX idx_roles_system ON roles(is_system);

-- Users table index (already in baseline)
CREATE INDEX idx_users_role ON users(role_id);
```

### RLS Policies

```sql
-- System roles visible to all authenticated users
CREATE POLICY "roles_select_system" ON roles FOR SELECT
USING (is_system = true);

-- Custom roles visible only to same org (future)
CREATE POLICY "roles_select_custom" ON roles FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admins can create custom roles (future)
CREATE POLICY "roles_insert_custom" ON roles FOR INSERT
WITH CHECK (
  is_system = false
  AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('SUPER_ADMIN', 'ADMIN')
  )
);
```

---

## Rationale

### Why JSONB Permissions Over Junction Table?

**Option A: JSONB in roles table (CHOSEN)**
```sql
permissions JSONB NOT NULL  -- {"settings":"CRUD","users":"R",...}
```

**Pros:**
- Single query to get all permissions
- Simple schema (2 tables: roles, users)
- Permissions always complete (all modules defined)
- Fast lookups (no JOINs)
- Easy to cache entire permission set

**Cons:**
- No referential integrity for permission codes
- Module additions require migration to update all roles
- Cannot query "all users with quality:CRUD" efficiently

**Option B: Junction table (NOT CHOSEN for Phase 1)**
```sql
CREATE TABLE permissions (code TEXT, module TEXT, ...);
CREATE TABLE role_permissions (role_id, permission_id, ...);
```

**Pros:**
- Referential integrity on permission codes
- Can query by permission
- More normalized

**Cons:**
- 3 tables instead of 2
- Multiple JOINs to get user permissions
- More complex caching
- Overkill for 10 fixed roles with 8 modules

**Decision:**
JSONB is sufficient for Phase 1 with 10 fixed roles. Junction table pattern can be added in Phase 2 if custom roles with granular permissions become necessary.

### Why role_id FK Over TEXT enum?

| Aspect | TEXT enum | UUID FK to roles |
|--------|-----------|------------------|
| Referential integrity | No | Yes |
| Custom roles support | No | Yes |
| Role metadata (name, description) | No | Yes |
| Audit trail | Limited | Full |
| Performance | Slightly faster | Negligible difference |
| Migration complexity | None | One-time migration |

**Decision:**
UUID FK provides referential integrity and extensibility with negligible performance impact.

---

## Alternatives Considered

### Alternative 1: Keep TEXT enum (Rejected)

```sql
users.role TEXT CHECK (role IN ('SUPER_ADMIN', 'ADMIN', ...))
```

**Rejected because:**
- Cannot store role metadata (name, description, permissions)
- Cannot support custom roles
- Permission matrix must be hardcoded in application
- No referential integrity

### Alternative 2: JSONB permissions field on users (Rejected)

```sql
users.permissions JSONB  -- Store permissions directly on user
```

**Rejected because:**
- Duplicates permission data across users
- No concept of "roles" for assignment
- Inconsistent permissions if admin updates one user but not others
- No audit trail of role changes

### Alternative 3: Full ABAC (Attribute-Based Access Control) (Rejected)

```sql
CREATE TABLE policies (
  resource TEXT,
  action TEXT,
  conditions JSONB
);
```

**Rejected because:**
- Over-engineered for food manufacturing use case
- Harder to understand for administrators
- Performance impact on every permission check
- RBAC covers 95%+ of requirements

### Alternative 4: Separate permissions table with junction (Deferred to Phase 2)

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,      -- 'read_products', 'write_boms'
  module_code TEXT,      -- 'technical', 'planning'
  name TEXT,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);
```

**Deferred because:**
- Overkill for 10 fixed roles
- JSONB in roles table is sufficient for Phase 1
- Can migrate to this pattern in Phase 2 if needed

---

## Consequences

### Positive

1. **Referential Integrity**: User role assignments validated by FK constraint
2. **Extensibility**: Custom org-scoped roles possible in Phase 2
3. **Single Source of Truth**: Roles table is authoritative for permission definitions
4. **Audit Support**: Role changes can be tracked (user.role_id changed from X to Y)
5. **UI Friendly**: Role names and descriptions available for dropdowns
6. **Cache Friendly**: Entire role permissions fit in single cache entry

### Negative

1. **Breaking Change**: Migration required from `users.role` TEXT to `users.role_id` UUID
2. **Permission Check Changes**: All `user.role === 'ADMIN'` checks must change to `hasPermission()` calls
3. **Module Changes**: Adding new module requires updating all 10 role JSONB entries

### Migration Required

```sql
-- Migration: 045_role_permission_storage.sql
BEGIN;

-- 1. Create roles table
CREATE TABLE roles ( ... );

-- 2. Seed 10 system roles
INSERT INTO roles (...) VALUES (...);

-- 3. Add role_id to users
ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);

-- 4. Migrate existing data
UPDATE users u
SET role_id = (SELECT id FROM roles WHERE code = UPPER(u.role));

-- 5. Make role_id required
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- 6. Drop old column
ALTER TABLE users DROP COLUMN role;

-- 7. Enable RLS on roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;

COMMIT;
```

### Code Changes Required

**Backend:**
- Replace `user.role` string comparisons with `hasPermission(user, module, action)`
- Add `permission-service.ts` with helper functions
- Add middleware for API route permission enforcement

**Frontend:**
- Replace `user.role === 'ADMIN'` with `can('users', 'U')` via `usePermissions()` hook
- Update role dropdown to fetch from `/api/settings/roles`

---

## Implementation Notes

### Permission Helper Functions

```typescript
// lib/services/permission-service.ts

type Action = 'C' | 'R' | 'U' | 'D';
type Module = 'settings' | 'users' | 'technical' | 'planning' | 'production' | 'quality' | 'warehouse' | 'shipping';

interface UserWithRole {
  id: string;
  role: {
    code: string;
    permissions: Record<Module, string>;
  };
}

export function hasPermission(user: UserWithRole, module: Module, action: Action): boolean {
  const modulePermissions = user.role.permissions[module];
  if (!modulePermissions || modulePermissions === '-') return false;
  return modulePermissions.includes(action);
}

export function requirePermission(module: Module, action: Action) {
  return async (req: Request) => {
    const user = await getAuthUser(req);
    if (!hasPermission(user, module, action)) {
      return Response.json(
        { error: "You don't have permission to perform this action" },
        { status: 403 }
      );
    }
    return null; // Continue to handler
  };
}
```

### React Hook

```typescript
// lib/hooks/usePermissions.ts

export function usePermissions() {
  const { user } = useAuth();

  const can = useCallback((module: Module, action: Action): boolean => {
    if (!user?.role?.permissions) return false;
    const perms = user.role.permissions[module];
    return perms && perms !== '-' && perms.includes(action);
  }, [user]);

  const canAny = useCallback((module: Module): boolean => {
    if (!user?.role?.permissions) return false;
    const perms = user.role.permissions[module];
    return perms && perms !== '-';
  }, [user]);

  return { can, canAny, role: user?.role?.code };
}
```

### Caching Strategy

```typescript
// Redis cache keys
'user:{userId}:permissions'    // 1 min TTL
'user:{userId}:role'           // 1 min TTL
'roles:system'                 // 1 hour TTL (system roles rarely change)
'org:{orgId}:roles:custom'     // 5 min TTL (custom roles)
```

---

## References

### Stories
- **Story 01.6**: Role-Based Permissions (10 Roles) - Primary implementation story
- **Story 01.1**: Org Context Base + RLS - Depends on org_id isolation
- **Story 01.5**: Users CRUD - Uses role_id FK

### Architecture
- `docs/1-BASELINE/architecture/modules/settings.md` (lines 76-109, 486-490, 598-605)
- ADR-011: Module Toggle Storage (similar pattern for org-scoped configuration)
- ADR-013: RLS Org Isolation Pattern (role-based policy enforcement)

### PRD
- `docs/1-BASELINE/product/modules/settings.md`
  - FR-SET-020 to FR-SET-029: 10 role definitions
  - FR-SET-030: Module-level permissions
  - FR-SET-031: CRUD-level permissions
  - FR-SET-011: 10-role permission system

### UX Wireframes
- SET-011: Role selector in user modal

---

## Decision Review

**Review Date**: 2025-12-15
**Reviewed By**: ARCHITECT-AGENT
**Status**: ACCEPTED

**Key Decision Points:**
1. JSONB permissions in roles table is sufficient for 10 fixed roles
2. UUID FK provides referential integrity over TEXT enum
3. RBAC pattern is simpler and sufficient vs ABAC
4. Phase 2 can add junction table if granular custom permissions needed

**Validation Checklist:**
- [x] Supports FR-SET-020 to FR-SET-029: 10 predefined roles
- [x] Supports FR-SET-030: Module-level permissions
- [x] Supports FR-SET-031: CRUD-level permissions
- [x] Supports Story 01.6 requirements
- [x] Migration path from TEXT to UUID documented
- [x] RLS policies defined
- [x] Caching strategy defined
- [x] Code helper functions specified
