# Epic 01 Refactoring Plan

**Document:** REFACTORING-PLAN.md
**Created:** 2025-12-16
**Author:** ARCHITECT-AGENT
**Status:** APPROVED

---

## Executive Summary

This document provides a detailed refactoring plan to align the existing MonoPilot codebase with Epic 01 Story specifications. The decision is to **refactor existing code to match story specs** (Option A), not vice versa.

### Key Decisions
1. **ADR-013** - RLS pattern using `(SELECT org_id FROM users WHERE id = auth.uid())` is MANDATORY
2. **API versioning** - Use `/api/v1/settings/*` as specified in stories
3. **Database schema** - Refactor to match story context files (01.1, 01.5, 01.6, 01.7)

---

## Current State Summary

### Database Issues (GAP Analysis)

| Table | Current State | Target State | Issue |
|-------|--------------|--------------|-------|
| `organizations` | `company_name` | `name` | Column rename |
| `organizations` | `default_language` | `locale` | Column rename |
| `organizations` | `default_currency` | `currency` | Column rename |
| `organizations` | Missing | `slug` | Add column (UNIQUE NOT NULL) |
| `organizations` | `wizard_completed` + `wizard_progress` | `onboarding_step`, `onboarding_started_at`, `onboarding_completed_at`, `onboarding_skipped` | Schema redesign |
| `roles` | Hardcoded enum in `users.role` VARCHAR | Proper `roles` table with JSONB permissions | New table + FK |
| `modules` | Hardcoded in TypeScript config | Database table with seed data | New table |
| `organization_modules` | `modules_enabled` TEXT[] array | Junction table with audit fields | New table |
| RLS policies | Uses `auth.jwt() ->> 'org_id'` | Uses `(SELECT org_id FROM users WHERE id = auth.uid())` | Pattern update |

### API Issues

| Current | Target | Issue |
|---------|--------|-------|
| `/api/settings/*` | `/api/v1/settings/*` | Version prefix |
| Missing | `/api/v1/settings/context` | New endpoint |
| `/api/settings/wizard` | `/api/v1/settings/onboarding/*` | Restructure |
| Missing | `/api/v1/settings/roles` | New endpoint |

### Service Issues

| Current | Target | Issue |
|---------|--------|-------|
| `wizard-service.ts` | `onboarding-service.ts` | Rename + refactor |
| `module-service.ts` | `module-settings-service.ts` | Refactor for junction table |
| Missing | `org-context-service.ts` | New service |
| Missing | `permission-service.ts` | New service |
| Missing | `role-service.ts` | New service |

### Type Issues

| Current | Target | Issue |
|---------|--------|-------|
| Missing | `lib/types/organization.ts` | New types |
| Missing | `lib/types/user.ts` | New types |
| Missing | `lib/types/role.ts` | New types |
| Missing | `lib/types/module.ts` | New types |
| Missing | `lib/types/permission.ts` | New types |

---

## Phase 0: Preparation (Risk Mitigation)

### 0.1 Backup Strategy

```bash
# Before starting, create database backup
pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).dump

# Git branch for rollback
git checkout -b refactor/epic-01-alignment
git push origin refactor/epic-01-alignment
```

### 0.2 Feature Flags

Create feature flag service for gradual rollout:

```typescript
// lib/config/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_NEW_RLS_PATTERN: process.env.FF_NEW_RLS ?? false,
  USE_API_V1: process.env.FF_API_V1 ?? false,
  USE_ROLES_TABLE: process.env.FF_ROLES_TABLE ?? false,
  USE_MODULES_TABLE: process.env.FF_MODULES_TABLE ?? false,
};
```

### 0.3 Rollback Plan

| Phase | Rollback Trigger | Rollback Action |
|-------|------------------|-----------------|
| Phase 1 (DB) | Migration failure | `supabase db reset` or restore from backup |
| Phase 2 (Services) | Tests fail | Revert service files from git |
| Phase 3 (API) | 500 errors in production | Toggle feature flag, use old endpoints |
| Phase 4 (Frontend) | UI broken | Deploy previous commit |

### 0.4 Validation Checkpoints

After each phase:
1. Run all existing tests
2. Manual smoke test of Settings module
3. Verify RLS isolation with 2-org test
4. Check API response times (<500ms)

---

## Phase 1: Database Migration

### Migration Order

**CRITICAL:** Execute migrations in this exact order due to foreign key dependencies.

```
054_rename_organization_columns.sql
055_create_roles_table.sql
056_create_modules_tables.sql
057_migrate_users_role_to_role_id.sql
058_update_rls_policies_adr013.sql
059_migrate_wizard_to_onboarding.sql
060_seed_system_data.sql
```

---

### Migration 054: Rename Organization Columns

**File:** `supabase/migrations/054_rename_organization_columns.sql`

```sql
-- Migration 054: Rename organization columns to match story spec
-- Story: 01.1 Org Context + Base RLS
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT
-- Reversible: YES

BEGIN;

-- ============================================================================
-- RENAME COLUMNS
-- ============================================================================

-- company_name -> name
ALTER TABLE public.organizations
  RENAME COLUMN company_name TO name;

-- default_language -> locale
ALTER TABLE public.organizations
  RENAME COLUMN default_language TO locale;

-- default_currency -> currency
ALTER TABLE public.organizations
  RENAME COLUMN default_currency TO currency;

-- ============================================================================
-- ADD NEW COLUMNS
-- ============================================================================

-- Add slug column (required for URL-friendly org identifiers)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing rows (convert name to lowercase, replace spaces with hyphens)
UPDATE public.organizations
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug unique and not null
ALTER TABLE public.organizations
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON public.organizations(slug);

-- Add is_active column (soft delete support)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- UPDATE CONSTRAINTS
-- ============================================================================

-- Update name check (was company_name)
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_company_name_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_name_check
  CHECK (char_length(name) >= 2);

-- ============================================================================
-- UPDATE INDEXES
-- ============================================================================

-- Rename company_name index to name
DROP INDEX IF EXISTS idx_organizations_company_name;
CREATE INDEX IF NOT EXISTS idx_organizations_name
  ON public.organizations(name);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.name IS 'Organization display name (min 2 chars)';
COMMENT ON COLUMN public.organizations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.organizations.locale IS 'ISO 639-1 language code (e.g., en, pl)';
COMMENT ON COLUMN public.organizations.currency IS 'ISO 4217 currency code (e.g., PLN, EUR, USD)';
COMMENT ON COLUMN public.organizations.is_active IS 'Soft delete flag';

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (save separately)
-- ============================================================================
-- BEGIN;
-- ALTER TABLE public.organizations RENAME COLUMN name TO company_name;
-- ALTER TABLE public.organizations RENAME COLUMN locale TO default_language;
-- ALTER TABLE public.organizations RENAME COLUMN currency TO default_currency;
-- ALTER TABLE public.organizations DROP COLUMN slug;
-- ALTER TABLE public.organizations DROP COLUMN is_active;
-- COMMIT;
```

---

### Migration 055: Create Roles Table

**File:** `supabase/migrations/055_create_roles_table.sql`

```sql
-- Migration 055: Create roles table with JSONB permissions
-- Story: 01.6 Role-Based Permissions
-- ADR: ADR-012 Role Permission Storage
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT

BEGIN;

-- ============================================================================
-- CREATE ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT true,
  org_id UUID REFERENCES public.organizations(id), -- NULL for system roles
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_roles_code ON public.roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_system ON public.roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_display_order ON public.roles(display_order);
CREATE INDEX IF NOT EXISTS idx_roles_org ON public.roles(org_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- System roles (is_system = true) are readable by all authenticated users
-- Custom org roles are only readable by org members
CREATE POLICY "roles_select_system" ON public.roles
  FOR SELECT
  USING (
    is_system = true
    OR org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Only super admin can create custom roles (future feature)
CREATE POLICY "roles_insert" ON public.roles
  FOR INSERT
  WITH CHECK (false); -- Disabled for now

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER roles_updated_at_trigger
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.roles IS '10 system roles with JSONB permissions (ADR-012)';
COMMENT ON COLUMN public.roles.code IS 'Unique role code (e.g., SUPER_ADMIN, ADMIN)';
COMMENT ON COLUMN public.roles.permissions IS 'JSONB: {"module": "CRUD|CRU|RU|R|-"}';
COMMENT ON COLUMN public.roles.is_system IS 'True for 10 predefined roles, false for custom';
COMMENT ON COLUMN public.roles.org_id IS 'NULL for system roles, org_id for custom roles';

COMMIT;
```

---

### Migration 056: Create Modules Tables

**File:** `supabase/migrations/056_create_modules_tables.sql`

```sql
-- Migration 056: Create modules and organization_modules tables
-- Story: 01.7 Module Toggles
-- ADR: ADR-011 Module Toggle Storage
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT

BEGIN;

-- ============================================================================
-- CREATE MODULES TABLE (System-defined, read-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dependencies TEXT[] DEFAULT '{}',
  can_disable BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE ORGANIZATION_MODULES TABLE (Junction table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT organization_modules_unique UNIQUE(org_id, module_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_modules_code ON public.modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.modules(display_order);

CREATE INDEX IF NOT EXISTS idx_organization_modules_org ON public.organization_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_module ON public.organization_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_enabled ON public.organization_modules(org_id, enabled);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_modules ENABLE ROW LEVEL SECURITY;

-- Modules table: Read-only for all authenticated users (system data)
CREATE POLICY "modules_select_all" ON public.modules
  FOR SELECT
  USING (true);

-- Organization modules: ADR-013 pattern
CREATE POLICY "org_modules_select" ON public.organization_modules
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_modules_insert" ON public.organization_modules
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_modules_update" ON public.organization_modules
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER organization_modules_updated_at_trigger
  BEFORE UPDATE ON public.organization_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_modules TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.modules IS '11 module definitions (seeded, read-only) per ADR-011';
COMMENT ON TABLE public.organization_modules IS 'Org-specific module enabled state (ADR-011)';

COMMIT;
```

---

### Migration 057: Migrate Users Role to role_id

**File:** `supabase/migrations/057_migrate_users_role_to_role_id.sql`

```sql
-- Migration 057: Migrate users.role VARCHAR to users.role_id UUID FK
-- Story: 01.5 Users CRUD, 01.6 Role Permissions
-- ADR: ADR-012 Role Permission Storage
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT
-- IMPORTANT: Run AFTER 055 (roles table) and 060 (seed data)

BEGIN;

-- ============================================================================
-- ADD role_id COLUMN
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role_id UUID;

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Map old VARCHAR role to new UUID role_id
-- This assumes roles are already seeded in migration 060

UPDATE public.users u
SET role_id = r.id
FROM public.roles r
WHERE UPPER(u.role) = r.code
  AND u.role_id IS NULL;

-- For any unmapped roles, default to VIEWER
UPDATE public.users u
SET role_id = (SELECT id FROM public.roles WHERE code = 'VIEWER')
WHERE u.role_id IS NULL;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT
-- ============================================================================

ALTER TABLE public.users
  ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_id_fk
  FOREIGN KEY (role_id) REFERENCES public.roles(id);

-- ============================================================================
-- DROP OLD COLUMN AND CONSTRAINTS
-- ============================================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- Keep old column for now, mark as deprecated
-- Will be dropped in future cleanup migration
COMMENT ON COLUMN public.users.role IS 'DEPRECATED: Use role_id instead. To be removed in migration 070.';

-- ============================================================================
-- ADD INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.users.role_id IS 'FK to roles.id (ADR-012)';

COMMIT;

-- ============================================================================
-- FUTURE CLEANUP (Migration 070)
-- ============================================================================
-- ALTER TABLE public.users DROP COLUMN role;
```

---

### Migration 058: Update RLS Policies to ADR-013 Pattern

**File:** `supabase/migrations/058_update_rls_policies_adr013.sql`

```sql
-- Migration 058: Update all RLS policies to ADR-013 pattern
-- ADR: ADR-013 RLS Org Isolation Pattern
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT

BEGIN;

-- ============================================================================
-- STANDARD PATTERN (ADR-013)
-- ============================================================================
-- USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Drop old JWT-based policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Create new ADR-013 policies
CREATE POLICY "users_org_isolation" ON public.users
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "users_admin_insert" ON public.users
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "users_admin_delete" ON public.users
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Only admins can update organization" ON public.organizations;

-- Create new ADR-013 policies
CREATE POLICY "org_select_own" ON public.organizations
  FOR SELECT
  USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_admin_update" ON public.organizations
  FOR UPDATE
  USING (
    id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- ============================================================================
-- UPDATE ALL OTHER TABLES WITH org_id
-- ============================================================================

-- Function to update RLS for any table with org_id column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'org_id'
    AND table_name NOT IN ('users', 'organizations', 'organization_modules', 'roles')
  LOOP
    -- Drop existing org_isolation policy if exists
    EXECUTE format('DROP POLICY IF EXISTS "org_isolation" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "users_select_policy" ON %I', tbl);

    -- Create new ADR-013 policy
    EXECUTE format(
      'CREATE POLICY "org_isolation" ON %I FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log updated policies for audit
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated to ADR-013 pattern';
END $$;

COMMIT;
```

---

### Migration 059: Migrate Wizard to Onboarding

**File:** `supabase/migrations/059_migrate_wizard_to_onboarding.sql`

```sql
-- Migration 059: Migrate wizard_progress/wizard_completed to onboarding columns
-- Story: 01.3 Onboarding Wizard Framework
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT

BEGIN;

-- ============================================================================
-- ADD NEW ONBOARDING COLUMNS
-- ============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Extract step from wizard_progress JSONB
UPDATE public.organizations
SET onboarding_step = COALESCE((wizard_progress->>'step')::INTEGER, 0)
WHERE wizard_progress IS NOT NULL;

-- Set completed_at if wizard_completed is true
UPDATE public.organizations
SET onboarding_completed_at = updated_at
WHERE wizard_completed = true
  AND onboarding_completed_at IS NULL;

-- Estimate started_at from created_at if wizard was started
UPDATE public.organizations
SET onboarding_started_at = created_at
WHERE (wizard_progress IS NOT NULL OR wizard_completed = true)
  AND onboarding_started_at IS NULL;

-- ============================================================================
-- ADD INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_step
  ON public.organizations(onboarding_step);

-- ============================================================================
-- DEPRECATE OLD COLUMNS
-- ============================================================================

COMMENT ON COLUMN public.organizations.wizard_completed IS 'DEPRECATED: Use onboarding_completed_at IS NOT NULL instead. To be removed in migration 070.';
COMMENT ON COLUMN public.organizations.wizard_progress IS 'DEPRECATED: Use onboarding_step instead. To be removed in migration 070.';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.onboarding_step IS 'Current wizard step (0 = not started, 1-6 = in progress, 7 = complete)';
COMMENT ON COLUMN public.organizations.onboarding_started_at IS 'When onboarding was first started';
COMMENT ON COLUMN public.organizations.onboarding_completed_at IS 'When onboarding was completed';
COMMENT ON COLUMN public.organizations.onboarding_skipped IS 'True if user skipped onboarding (demo data created)';

COMMIT;

-- ============================================================================
-- FUTURE CLEANUP (Migration 070)
-- ============================================================================
-- ALTER TABLE public.organizations DROP COLUMN wizard_completed;
-- ALTER TABLE public.organizations DROP COLUMN wizard_progress;
```

---

### Migration 060: Seed System Data

**File:** `supabase/migrations/060_seed_system_data.sql`

```sql
-- Migration 060: Seed system roles and modules
-- Stories: 01.1, 01.6, 01.7
-- ADRs: ADR-011, ADR-012
-- Date: 2025-12-16
-- Author: ARCHITECT-AGENT

BEGIN;

-- ============================================================================
-- SEED 10 SYSTEM ROLES (ADR-012)
-- ============================================================================

INSERT INTO public.roles (code, name, description, permissions, is_system, display_order)
VALUES
  ('SUPER_ADMIN', 'Super Administrator', 'Full system access, can assign any role',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::JSONB,
   true, 1),

  ('ADMIN', 'Administrator', 'Organization-wide access, cannot assign Super Admin',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::JSONB,
   true, 2),

  ('PROD_MANAGER', 'Production Manager', 'Full Production, Planning, Quality access',
   '{"settings":"R","users":"R","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"CRUD","integrations":"R"}'::JSONB,
   true, 3),

  ('QUAL_MANAGER', 'Quality Manager', 'Full Quality, read Production',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"CRUD","warehouse":"R","shipping":"R","npd":"RU","finance":"-","oee":"R","integrations":"-"}'::JSONB,
   true, 4),

  ('WH_MANAGER', 'Warehouse Manager', 'Full Warehouse and Shipping access',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"CRUD","shipping":"CRUD","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 5),

  ('PROD_OPERATOR', 'Production Operator', 'CRU Production, read Quality',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"CRU","quality":"R","warehouse":"-","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}'::JSONB,
   true, 6),

  ('QUAL_INSPECTOR', 'Quality Inspector', 'CRU Quality only',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","quality":"CRU","warehouse":"-","shipping":"-","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 7),

  ('WH_OPERATOR', 'Warehouse Operator', 'CRU Warehouse and Shipping',
   '{"settings":"-","users":"-","technical":"-","planning":"-","production":"-","quality":"-","warehouse":"CRU","shipping":"CRU","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 8),

  ('PLANNER', 'Planner', 'Full Planning, read Production',
   '{"settings":"R","users":"-","technical":"R","planning":"CRUD","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"-"}'::JSONB,
   true, 9),

  ('VIEWER', 'Viewer', 'Read-only all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}'::JSONB,
   true, 10)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- SEED 11 MODULES (ADR-011)
-- ============================================================================

INSERT INTO public.modules (code, name, description, dependencies, can_disable, display_order)
VALUES
  ('settings', 'Settings', 'Organization and user management', '{}', false, 1),
  ('technical', 'Technical', 'Products, BOMs, Routings', '{}', false, 2),
  ('planning', 'Planning', 'Work orders and scheduling', '{technical}', true, 3),
  ('production', 'Production', 'Work order execution', '{planning}', true, 4),
  ('warehouse', 'Warehouse', 'Inventory and license plates', '{technical}', true, 5),
  ('quality', 'Quality', 'QC holds and inspections', '{production}', true, 6),
  ('shipping', 'Shipping', 'Order fulfillment and dispatch', '{warehouse}', true, 7),
  ('npd', 'NPD', 'Stage-Gate Workflow, Trial BOMs', '{technical}', true, 8),
  ('finance', 'Finance', 'Production Costing, Variance', '{production,warehouse}', true, 9),
  ('oee', 'OEE', 'Real-time OEE, Machine Dashboard', '{production}', true, 10),
  ('integrations', 'Integrations', 'Comarch Optima, EDI, API Access', '{}', true, 11)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  dependencies = EXCLUDED.dependencies,
  can_disable = EXCLUDED.can_disable,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- INITIALIZE organization_modules FOR EXISTING ORGS
-- ============================================================================

-- Insert module records for all existing organizations
INSERT INTO public.organization_modules (org_id, module_id, enabled, enabled_at)
SELECT
  o.id AS org_id,
  m.id AS module_id,
  CASE
    -- Enable based on old modules_enabled array or defaults
    WHEN o.modules_enabled IS NOT NULL AND m.code = ANY(o.modules_enabled) THEN true
    WHEN o.modules_enabled IS NULL AND m.code IN ('settings', 'technical', 'planning', 'production', 'warehouse') THEN true
    ELSE false
  END AS enabled,
  CASE
    WHEN o.modules_enabled IS NOT NULL AND m.code = ANY(o.modules_enabled) THEN NOW()
    WHEN o.modules_enabled IS NULL AND m.code IN ('settings', 'technical', 'planning', 'production', 'warehouse') THEN NOW()
    ELSE NULL
  END AS enabled_at
FROM public.organizations o
CROSS JOIN public.modules m
ON CONFLICT (org_id, module_id) DO NOTHING;

-- ============================================================================
-- DEPRECATE OLD COLUMN
-- ============================================================================

COMMENT ON COLUMN public.organizations.modules_enabled IS 'DEPRECATED: Use organization_modules table instead. To be removed in migration 070.';

COMMIT;
```

---

## Phase 2: Backend Services

### 2.1 Create org-context-service.ts

**File:** `apps/frontend/lib/services/org-context-service.ts`

```typescript
/**
 * Org Context Service
 * Story: 01.1 Org Context + Base RLS
 *
 * Provides getOrgContext() helper for session resolution.
 * Used by all Settings endpoints and throughout the application.
 */

import { createServerSupabase } from '../supabase/server';

export interface OrgContext {
  org_id: string;
  user_id: string;
  role_code: string;
  role_name: string;
  permissions: Record<string, string>;
  organization: {
    name: string;
    slug: string;
    timezone: string;
    locale: string;
    currency: string;
    onboarding_step: number;
    onboarding_completed_at: string | null;
  };
}

export interface OrgContextResult {
  success: boolean;
  data?: OrgContext;
  error?: string;
}

/**
 * Get organization context for the current authenticated user.
 * This is the primary method for resolving session context.
 *
 * @returns OrgContext with org_id, user_id, role, permissions, organization
 */
export async function getOrgContext(): Promise<OrgContextResult> {
  try {
    const supabase = await createServerSupabase();

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user with role and organization in single query
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        org_id,
        organizations!inner (
          id,
          name,
          slug,
          timezone,
          locale,
          currency,
          onboarding_step,
          onboarding_completed_at
        ),
        roles!inner (
          code,
          name,
          permissions
        )
      `)
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return { success: false, error: 'User not found' };
    }

    const context: OrgContext = {
      org_id: data.org_id,
      user_id: data.id,
      role_code: data.roles.code,
      role_name: data.roles.name,
      permissions: data.roles.permissions as Record<string, string>,
      organization: {
        name: data.organizations.name,
        slug: data.organizations.slug,
        timezone: data.organizations.timezone,
        locale: data.organizations.locale,
        currency: data.organizations.currency,
        onboarding_step: data.organizations.onboarding_step,
        onboarding_completed_at: data.organizations.onboarding_completed_at,
      },
    };

    return { success: true, data: context };
  } catch (error) {
    return { success: false, error: 'Unknown error' };
  }
}

/**
 * Get org_id for the current user (lightweight version).
 * Use when only org_id is needed.
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const result = await getOrgContext();
  return result.success ? result.data!.org_id : null;
}

/**
 * Get user_id for the current user.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const result = await getOrgContext();
  return result.success ? result.data!.user_id : null;
}
```

### 2.2 Create permission-service.ts

**File:** `apps/frontend/lib/services/permission-service.ts`

```typescript
/**
 * Permission Service
 * Story: 01.6 Role-Based Permissions
 * ADR: ADR-012 Role Permission Storage
 *
 * Provides permission checking for API routes and UI components.
 */

import { getOrgContext, OrgContext } from './org-context-service';

export type PermissionAction = 'C' | 'R' | 'U' | 'D';
export type ModuleCode =
  | 'settings'
  | 'users'
  | 'technical'
  | 'planning'
  | 'production'
  | 'quality'
  | 'warehouse'
  | 'shipping'
  | 'npd'
  | 'finance'
  | 'oee'
  | 'integrations';

/**
 * Check if user has permission for module + action.
 * Permission string format: "CRUD", "CRU", "RU", "R", "-"
 *
 * @param permissions - User's permission object from role
 * @param module - Module code (e.g., 'production', 'warehouse')
 * @param action - CRUD action ('C', 'R', 'U', 'D')
 * @returns true if user has permission
 */
export function hasPermission(
  permissions: Record<string, string>,
  module: ModuleCode,
  action: PermissionAction
): boolean {
  const modulePerms = permissions[module];

  // No permission entry or explicit deny
  if (!modulePerms || modulePerms === '-') {
    return false;
  }

  // Check if action is in permission string
  return modulePerms.includes(action);
}

/**
 * Check if user has any access to module.
 *
 * @param permissions - User's permission object from role
 * @param module - Module code
 * @returns true if user has any permission (not "-")
 */
export function hasModuleAccess(
  permissions: Record<string, string>,
  module: ModuleCode
): boolean {
  const modulePerms = permissions[module];
  return !!modulePerms && modulePerms !== '-';
}

/**
 * Check if current user has permission (async version).
 * Resolves context and checks permission.
 *
 * @param module - Module code
 * @param action - CRUD action
 * @returns true if user has permission
 */
export async function checkPermission(
  module: ModuleCode,
  action: PermissionAction
): Promise<boolean> {
  const result = await getOrgContext();

  if (!result.success || !result.data) {
    return false;
  }

  return hasPermission(result.data.permissions, module, action);
}

/**
 * Require permission or throw error.
 * Use in API routes for permission enforcement.
 *
 * @param context - OrgContext from getOrgContext()
 * @param module - Module code
 * @param action - CRUD action
 * @throws Error if permission denied
 */
export function requirePermission(
  context: OrgContext,
  module: ModuleCode,
  action: PermissionAction
): void {
  if (!hasPermission(context.permissions, module, action)) {
    throw new Error("You don't have permission to perform this action");
  }
}

/**
 * Check if user is admin (SUPER_ADMIN or ADMIN role).
 *
 * @param context - OrgContext
 * @returns true if admin
 */
export function isAdmin(context: OrgContext): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(context.role_code);
}

/**
 * Check if user is super admin only.
 *
 * @param context - OrgContext
 * @returns true if super admin
 */
export function isSuperAdmin(context: OrgContext): boolean {
  return context.role_code === 'SUPER_ADMIN';
}
```

### 2.3 Refactor wizard-service.ts to onboarding-service.ts

**File:** `apps/frontend/lib/services/onboarding-service.ts`

```typescript
/**
 * Onboarding Service
 * Story: 01.3 Onboarding Wizard Framework
 *
 * Replaces wizard-service.ts with new onboarding column schema.
 */

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server';
import { getCurrentOrgId } from './org-context-service';

export interface OnboardingStatus {
  step: number;
  started_at: string | null;
  completed_at: string | null;
  skipped: boolean;
  is_complete: boolean;
}

export interface OnboardingServiceResult {
  success: boolean;
  data?: OnboardingStatus;
  error?: string;
}

/**
 * Get current onboarding status for organization.
 */
export async function getOnboardingStatus(): Promise<OnboardingServiceResult> {
  try {
    const supabase = await createServerSupabase();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' };
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('onboarding_step, onboarding_started_at, onboarding_completed_at, onboarding_skipped')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to fetch onboarding status' };
    }

    const status: OnboardingStatus = {
      step: data.onboarding_step ?? 0,
      started_at: data.onboarding_started_at,
      completed_at: data.onboarding_completed_at,
      skipped: data.onboarding_skipped ?? false,
      is_complete: data.onboarding_completed_at !== null || data.onboarding_skipped === true,
    };

    return { success: true, data: status };
  } catch (error) {
    return { success: false, error: 'Unknown error' };
  }
}

/**
 * Update onboarding step.
 *
 * @param step - Step number (1-6)
 */
export async function updateOnboardingStep(step: number): Promise<OnboardingServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' };
    }

    const updateData: Record<string, any> = {
      onboarding_step: step,
    };

    // Start tracking if this is first step
    if (step === 1) {
      updateData.onboarding_started_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    return await getOnboardingStatus();
  } catch (error) {
    return { success: false, error: 'Unknown error' };
  }
}

/**
 * Mark onboarding as complete.
 */
export async function completeOnboarding(): Promise<OnboardingServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' };
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        onboarding_step: 7, // Complete marker
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    return await getOnboardingStatus();
  } catch (error) {
    return { success: false, error: 'Unknown error' };
  }
}

/**
 * Skip onboarding and create demo data.
 */
export async function skipOnboarding(): Promise<OnboardingServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' };
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        onboarding_skipped: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    // TODO: Create demo data
    // await createDemoData(orgId);

    return await getOnboardingStatus();
  } catch (error) {
    return { success: false, error: 'Unknown error' };
  }
}
```

---

## Phase 3: API Layer

### 3.1 Create /api/v1/ Structure

```
apps/frontend/app/api/v1/
  settings/
    context/route.ts         -- GET org context
    onboarding/
      status/route.ts        -- GET status
      step/[step]/route.ts   -- PATCH update step
      skip/route.ts          -- POST skip
      complete/route.ts      -- POST complete
    roles/
      route.ts               -- GET all roles
      [id]/route.ts          -- GET single role
    modules/
      route.ts               -- GET all modules
      [id]/toggle/route.ts   -- PATCH toggle
    users/
      route.ts               -- GET, POST users
      [id]/route.ts          -- GET, PUT, DELETE user
      [id]/activate/route.ts -- PATCH activate
      [id]/deactivate/route.ts -- PATCH deactivate
```

### 3.2 Implement GET /api/v1/settings/context

**File:** `apps/frontend/app/api/v1/settings/context/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/services/org-context-service';

/**
 * GET /api/v1/settings/context
 * Returns org_id, user_id, role, permissions for authenticated user.
 * Story: 01.1 Org Context + Base RLS
 */
export async function GET() {
  try {
    const result = await getOrgContext();

    if (!result.success) {
      const status = result.error === 'Unauthorized' ? 401 :
                     result.error === 'User not found' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3.3 Deprecation Strategy for Old API

**Option 1: Redirect with warning header (Recommended)**

```typescript
// apps/frontend/app/api/settings/wizard/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Add deprecation warning header
  const response = NextResponse.redirect(
    new URL('/api/v1/settings/onboarding/status', request.url),
    308 // Permanent redirect
  );

  response.headers.set('X-Deprecation-Warning',
    'This endpoint is deprecated. Use /api/v1/settings/onboarding/status instead.');

  return response;
}
```

**Option 2: Soft deprecation with logging**

Keep old endpoints working but log usage for monitoring:

```typescript
// middleware/deprecation-logger.ts
export function logDeprecatedEndpoint(endpoint: string) {
  console.warn(`[DEPRECATION] Endpoint ${endpoint} is deprecated. Migrate to /api/v1/*`);
  // TODO: Send to analytics
}
```

### 3.4 API Migration Schedule

| Old Endpoint | New Endpoint | Deprecation Date | Removal Date |
|--------------|--------------|------------------|--------------|
| `/api/settings/wizard` | `/api/v1/settings/onboarding/status` | 2025-01-01 | 2025-02-01 |
| `/api/settings/modules` | `/api/v1/settings/modules` | 2025-01-01 | 2025-02-01 |
| `/api/settings/users` | `/api/v1/settings/users` | 2025-01-01 | 2025-02-01 |
| `/api/settings/organization` | `/api/v1/settings/organization` | 2025-01-01 | 2025-02-01 |

---

## Phase 4: Frontend Types and Hooks

### 4.1 Create TypeScript Types

**File:** `apps/frontend/lib/types/organization.ts`

```typescript
/**
 * Organization types
 * Story: 01.1, 01.4
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  currency: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  nip_vat: string | null;
  fiscal_year_start: string | null;
  date_format: string;
  number_format: string;
  unit_system: 'metric' | 'imperial';
  onboarding_step: number;
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
  onboarding_skipped: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUpdateInput {
  name?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  nip_vat?: string;
  fiscal_year_start?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  date_format?: string;
  number_format?: string;
  unit_system?: 'metric' | 'imperial';
}
```

**File:** `apps/frontend/lib/types/user.ts`

```typescript
/**
 * User types
 * Story: 01.5
 */

import { Role } from './role';

export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  role?: Role;
  language: string;
  is_active: boolean;
  last_login_at: string | null;
  warehouse_access_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  role_id?: string;
  language?: string;
  is_active?: boolean;
  warehouse_access_ids?: string[];
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
```

**File:** `apps/frontend/lib/types/role.ts`

```typescript
/**
 * Role types
 * Story: 01.6
 * ADR: ADR-012
 */

export type PermissionLevel = 'CRUD' | 'CRU' | 'RU' | 'R' | '-';

export type ModulePermissions = Record<string, PermissionLevel>;

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: ModulePermissions;
  is_system: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export const ROLE_CODES = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROD_MANAGER',
  'QUAL_MANAGER',
  'WH_MANAGER',
  'PROD_OPERATOR',
  'QUAL_INSPECTOR',
  'WH_OPERATOR',
  'PLANNER',
  'VIEWER',
] as const;

export type RoleCode = typeof ROLE_CODES[number];
```

**File:** `apps/frontend/lib/types/module.ts`

```typescript
/**
 * Module types
 * Story: 01.7
 * ADR: ADR-011
 */

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string | null;
  dependencies: string[];
  can_disable: boolean;
  display_order: number;
}

export interface OrganizationModule {
  id: string;
  org_id: string;
  module_id: string;
  module?: Module;
  enabled: boolean;
  enabled_at: string | null;
  enabled_by: string | null;
}

export interface ModuleWithStatus extends Module {
  enabled: boolean;
  enabled_at: string | null;
  dependents: string[]; // Modules that depend on this one
}

export const MODULE_CODES = [
  'settings',
  'technical',
  'planning',
  'production',
  'warehouse',
  'quality',
  'shipping',
  'npd',
  'finance',
  'oee',
  'integrations',
] as const;

export type ModuleCode = typeof MODULE_CODES[number];
```

**File:** `apps/frontend/lib/types/index.ts`

```typescript
/**
 * Type exports
 */

export * from './organization';
export * from './user';
export * from './role';
export * from './module';
export * from './dashboard';
export * from './traceability';
```

### 4.2 Create React Hooks

**File:** `apps/frontend/lib/hooks/use-org-context.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { OrgContext } from '@/lib/services/org-context-service';

export function useOrgContext() {
  const [context, setContext] = useState<OrgContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await fetch('/api/v1/settings/context');
        if (!res.ok) {
          throw new Error('Failed to fetch context');
        }
        const data = await res.json();
        setContext(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, []);

  return { context, loading, error };
}
```

**File:** `apps/frontend/lib/hooks/use-permissions.ts`

```typescript
'use client';

import { useOrgContext } from './use-org-context';
import { hasPermission, hasModuleAccess, ModuleCode, PermissionAction } from '@/lib/services/permission-service';

export function usePermissions() {
  const { context, loading, error } = useOrgContext();

  const permissions = context?.permissions ?? {};

  return {
    loading,
    error,
    role: context?.role_code ?? '',
    roleName: context?.role_name ?? '',

    can: (module: ModuleCode, action: PermissionAction): boolean => {
      return hasPermission(permissions, module, action);
    },

    canAny: (module: ModuleCode): boolean => {
      return hasModuleAccess(permissions, module);
    },

    isAdmin: (): boolean => {
      return ['SUPER_ADMIN', 'ADMIN'].includes(context?.role_code ?? '');
    },

    isSuperAdmin: (): boolean => {
      return context?.role_code === 'SUPER_ADMIN';
    },
  };
}
```

---

## Dependency Order (Critical Path)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MIGRATION DEPENDENCY GRAPH                          │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 0: Preparation
  └── Backup + Feature flags

Phase 1: Database Migrations
  054 (org columns)
    │
    └──► 055 (roles table)
           │
           └──► 060 (seed roles) ◄─────────┐
                  │                         │
                  └──► 057 (users.role_id)  │
                         │                   │
                         └──► 056 (modules)  │
                                │            │
                                └──► 060 (seed modules)
                                       │
                                       └──► 058 (RLS policies)
                                              │
                                              └──► 059 (onboarding)

Phase 2: Backend Services
  org-context-service.ts (depends on 057)
    │
    └──► permission-service.ts (depends on 055, 060)
           │
           └──► onboarding-service.ts (depends on 059)

Phase 3: API Layer
  /api/v1/settings/context (depends on org-context-service)
    │
    └──► /api/v1/settings/roles (depends on permission-service)
           │
           └──► /api/v1/settings/modules (depends on module-service)
                  │
                  └──► /api/v1/settings/users (depends on permission-service)
                         │
                         └──► /api/v1/settings/onboarding (depends on onboarding-service)

Phase 4: Frontend
  lib/types/* (no dependencies)
    │
    └──► lib/hooks/use-org-context.ts (depends on API)
           │
           └──► lib/hooks/use-permissions.ts (depends on use-org-context)
                  │
                  └──► components/* (depends on hooks + types)
```

---

## Risk Assessment

### High Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RLS policy misconfiguration leaks data | Critical | Low | Comprehensive 2-org integration tests before deploy |
| Migration breaks existing data | High | Medium | Backup before migration, test on staging first |
| JWT → users lookup causes performance degradation | Medium | Low | Benchmark shows <1ms overhead, acceptable |

### Medium Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Old API consumers break | Medium | Medium | 308 redirect with deprecation headers, 30-day grace period |
| Frontend type mismatches | Medium | Medium | Use Zod schemas for runtime validation |
| Rollback needed mid-migration | High | Low | Feature flags allow partial rollback |

### Low Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Module config differences | Low | Medium | Seed data is idempotent (ON CONFLICT DO UPDATE) |
| Timezone handling changes | Low | Low | Use same format, just different column name |

---

## Rollback Scenarios

### Scenario 1: Database Migration Fails

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_YYYYMMDD_HHMMSS.dump

# Or revert specific migration
supabase migration repair --status reverted <migration_id>
```

### Scenario 2: RLS Breaks After Deploy

```sql
-- Emergency: Disable RLS temporarily (USE WITH CAUTION)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Restore old JWT pattern
DROP POLICY IF EXISTS "users_org_isolation" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### Scenario 3: API Errors Spike

```typescript
// Toggle feature flag to use old endpoints
// .env.local
FF_API_V1=false

// Frontend fetches check flag and use old API
const apiBase = process.env.FF_API_V1 === 'true' ? '/api/v1' : '/api';
```

---

## Validation Checklist

### Pre-Migration

- [ ] Database backup created and tested
- [ ] Feature flags configured
- [ ] Staging environment ready
- [ ] Integration tests updated for new schema

### Post-Migration

- [ ] All 054-060 migrations applied successfully
- [ ] Existing organizations have correct slug values
- [ ] users.role_id points to valid roles
- [ ] organization_modules populated for all orgs
- [ ] RLS blocks cross-tenant access (2-org test)
- [ ] API v1 endpoints return correct data
- [ ] Old API endpoints redirect with deprecation headers
- [ ] Frontend types match API responses
- [ ] No console errors in browser
- [ ] Performance: <500ms for all Settings APIs

### Definition of Done

- [ ] All migrations run without errors
- [ ] Zero data loss during migration
- [ ] RLS isolation verified with automated tests
- [ ] API v1 endpoints functional
- [ ] Frontend builds without type errors
- [ ] E2E smoke tests pass
- [ ] Rollback plan tested on staging

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Preparation | 0.5 day | None |
| Phase 1: Database Migrations | 1 day | Phase 0 |
| Phase 2: Backend Services | 1 day | Phase 1 |
| Phase 3: API Layer | 1 day | Phase 2 |
| Phase 4: Frontend | 1 day | Phase 3 |
| Testing & Validation | 1 day | Phase 4 |
| **Total** | **5.5 days** | |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-16 | ARCHITECT-AGENT | Initial refactoring plan |
