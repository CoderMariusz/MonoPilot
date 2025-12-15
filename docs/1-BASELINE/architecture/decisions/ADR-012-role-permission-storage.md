# ADR-012: Role Permission Storage

## Status
ACCEPTED

## Date
2025-12-15

## Context
Epic 01a-Settings

We need to store 10 predefined roles with their permission matrix. Two approaches:
1. Enum string in `users.role` column + hardcoded permissions in code
2. Separate `roles` table with FK + JSONB permissions

**Problem:**
The current approach stores role as a string enum in the users table with permissions hardcoded throughout the codebase. This scatters permission logic, makes testing difficult, and prevents future custom role support.

**Real-World Use Cases:**
1. **Permission checks**: Need fast, consistent permission lookups
2. **Role management UI**: Admin needs to view all roles and their permissions
3. **Future custom roles**: Phase 3 will allow org-specific custom roles
4. **Audit requirements**: Need to track role changes and permission enforcement

---

## Decision

**Use roles table with FK and JSONB permissions:**

```sql
-- Roles table (seeded, system-defined)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT true,
  org_id UUID REFERENCES organizations(id), -- NULL for system roles
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update users table
ALTER TABLE users
  ADD COLUMN role_id UUID REFERENCES roles(id),
  DROP COLUMN role; -- Remove after migration
```

### Permissions JSONB Structure

```json
{
  "settings": "CRUD",
  "users": "CRUD",
  "technical": "CRUD",
  "planning": "R",
  "production": "CRU",
  "quality": "-",
  "warehouse": "R",
  "shipping": "R"
}
```

**Permission Values:**
- `C` = Create
- `R` = Read
- `U` = Update
- `D` = Delete
- `-` = No access
- Combined: `CRUD`, `CRU`, `RU`, `R`, `-`

### Seed Data for 10 System Roles

```sql
INSERT INTO roles (code, name, description, permissions, is_system, display_order) VALUES
  ('owner', 'Owner', 'Full system access, billing, org settings',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","warehouse":"CRUD","quality":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}',
   true, 1),

  ('admin', 'Administrator', 'Full access except billing',
   '{"settings":"CRU","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","warehouse":"CRUD","quality":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}',
   true, 2),

  ('production_manager', 'Production Manager', 'Manage production, view planning',
   '{"settings":"R","users":"R","technical":"RU","planning":"CRUD","production":"CRUD","warehouse":"RU","quality":"CRUD","shipping":"R","npd":"R","finance":"R","oee":"CRUD","integrations":"R"}',
   true, 3),

  ('quality_manager', 'Quality Manager', 'Full QC access, view production',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"RU","warehouse":"R","quality":"CRUD","shipping":"R","npd":"RU","finance":"-","oee":"R","integrations":"-"}',
   true, 4),

  ('warehouse_manager', 'Warehouse Manager', 'Manage inventory and shipping',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","warehouse":"CRUD","quality":"R","shipping":"CRUD","npd":"-","finance":"-","oee":"-","integrations":"-"}',
   true, 5),

  ('production_operator', 'Production Operator', 'Execute work orders',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"RU","warehouse":"R","quality":"CR","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}',
   true, 6),

  ('warehouse_operator', 'Warehouse Operator', 'Execute inventory tasks',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"-","warehouse":"CRU","quality":"R","shipping":"RU","npd":"-","finance":"-","oee":"-","integrations":"-"}',
   true, 7),

  ('quality_inspector', 'Quality Inspector', 'Perform QC inspections',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","warehouse":"R","quality":"CRU","shipping":"R","npd":"-","finance":"-","oee":"-","integrations":"-"}',
   true, 8),

  ('planner', 'Planner', 'Manage schedules and work orders',
   '{"settings":"R","users":"R","technical":"R","planning":"CRUD","production":"R","warehouse":"R","quality":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"-"}',
   true, 9),

  ('viewer', 'Viewer', 'Read-only access to all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","warehouse":"R","quality":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}',
   true, 10);
```

### RLS Policies

```sql
-- System roles: Read-only for all authenticated users
CREATE POLICY "roles_select_system" ON roles FOR SELECT TO authenticated
  USING (is_system = true);

-- Custom roles: Org-scoped (future Phase 3)
CREATE POLICY "roles_select_custom" ON roles FOR SELECT TO authenticated
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "roles_insert_custom" ON roles FOR INSERT TO authenticated
  WITH CHECK (org_id = auth.jwt() ->> 'org_id' AND is_system = false);

CREATE POLICY "roles_update_custom" ON roles FOR UPDATE TO authenticated
  USING (org_id = auth.jwt() ->> 'org_id' AND is_system = false);
```

### Permission Check Function

```sql
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_module TEXT,
  p_action CHAR(1)
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
  v_module_perms TEXT;
BEGIN
  SELECT r.permissions INTO v_permissions
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = p_user_id;

  v_module_perms := v_permissions ->> p_module;

  IF v_module_perms IS NULL OR v_module_perms = '-' THEN
    RETURN false;
  END IF;

  RETURN v_module_perms LIKE '%' || p_action || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Rationale

1. **Single source of truth**: Permissions in database, not scattered in code
2. **Queryable**: Can query permissions via SQL/Supabase
3. **Cacheable**: Load permissions once, cache in Redis
4. **Future-proof**: Easy to add custom roles later (Phase 3)
5. **Testable**: Permission logic centralized, easy to unit test

---

## Consequences

### Positive

1. **Centralized permissions**: All permission logic in one place
2. **Database-level enforcement**: Can use in RLS policies
3. **Easy role management**: Query roles table for admin UI
4. **Custom roles ready**: Architecture supports org-specific roles
5. **Fast permission checks**: JSONB lookup is efficient

### Negative

1. **Migration complexity**: Need to migrate users.role string to role_id FK
2. **JOIN required**: User queries need JOIN to roles table
3. **Cache invalidation**: Role changes require cache update

### Neutral

1. **10 system roles seeded**: Predefined roles for all organizations
2. **is_system flag**: Distinguishes system vs custom roles
3. **org_id nullable**: System roles have NULL org_id

---

## Alternatives Considered

### Option 1: Enum String in users.role (Status Quo)

```sql
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'production_manager', ...);
ALTER TABLE users ADD COLUMN role user_role;
```

**Rejected:**
- Permissions scattered across codebase
- Harder to modify/test permission matrix
- No single source of truth
- Cannot support custom roles

### Option 2: Separate Permissions Table (Many-to-Many)

```sql
CREATE TABLE role_permissions (
  role_id UUID,
  module VARCHAR(50),
  action CHAR(1),
  PRIMARY KEY (role_id, module, action)
);
```

**Rejected:**
- Too granular for current needs
- Many rows per role (10 roles x 11 modules x 4 actions = 440 rows)
- Slower queries with multiple JOINs

### Option 3: Permissions in User Record

```sql
ALTER TABLE users ADD COLUMN permissions JSONB;
```

**Rejected:**
- Duplicates permission data across users
- Hard to update permissions for a role
- No role concept for management UI

---

## Implementation Plan

### Phase 1: Database Migration (Priority: P1)
```
Migration: 054_create_roles_table.sql
- CREATE TABLE roles
- SEED 10 system roles
- ADD users.role_id FK
- CREATE check_permission function
- ADD RLS policies
```

### Phase 2: Data Migration (Priority: P1)
```
Migration: 055_migrate_user_roles.sql
- UPDATE users SET role_id = (SELECT id FROM roles WHERE code = users.role)
- DROP users.role column (after verification)
```

### Phase 3: API Updates (Priority: P1)
- [ ] Create GET /api/settings/roles endpoint
- [ ] Update GET /api/settings/users to include role details
- [ ] Create permission check middleware
- [ ] Update all protected routes with permission checks

### Phase 4: UI Updates (Priority: P2)
- [ ] Update Role Management page (SET-004)
- [ ] Update User form role dropdown
- [ ] Add permission matrix view

### Phase 5: Caching (Priority: P2)
- [ ] Cache role permissions in Redis
- [ ] Add cache invalidation on role update

---

## Validation

- [x] Supports FR-SET-004: Role Management
- [x] Supports FR-SET-005: User Role Assignment
- [x] Supports NFR-SEC-002: Role-based Access Control
- [x] Maintains multi-tenancy (custom roles scoped by org_id)
- [x] Compatible with existing RLS patterns (ADR-003)
- [x] Supports future custom roles (Phase 3)

---

## Related

### Affected Modules
- **Settings Module**: Role Management UI, User Management
- **All Modules**: Permission checks on every route

### ADRs
- ADR-003: Multi-tenancy RLS (extends with role-based policies)
- ADR-008: Audit Trail Strategy (role change logging)
- ADR-011: Module Toggle Storage (permissions reference module codes)

### PRDs
- `docs/1-BASELINE/product/modules/settings.md` (FR-SET-004, FR-SET-005)

### UX Wireframes
- SET-004: Role Management
- SET-005: Role Detail/Permissions
- SET-006: User Create/Edit (role selection)

### Stories
- Story 01a.3: Role Seeding API
- Story 01a.4: Permission Check Middleware
- Story 01a.5: User Role Assignment
