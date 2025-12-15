# ADR-011: Module Toggle Storage

## Status
ACCEPTED

## Date
2025-12-15

## Context

Epic 01-Settings (Story 01.7: Module Toggles)

MonoPilot is a multi-tenant Food Manufacturing MES with modular architecture. Organizations can enable/disable modules (Planning, Production, Warehouse, Quality, Shipping, NPD, Finance, OEE) based on their subscription and needs.

**Current State:**
The original architecture baseline documented a flat model approach using a `module_settings` table with boolean columns:
```sql
-- DEPRECATED approach (not implemented)
CREATE TABLE module_settings (
  org_id UUID PRIMARY KEY,
  planning_enabled BOOLEAN DEFAULT false,
  production_enabled BOOLEAN DEFAULT false,
  warehouse_enabled BOOLEAN DEFAULT false,
  -- etc...
);
```

**Problem:**
1. **New Modules**: Epic 10 (OEE) and Epic 11 (Integrations) require new modules without `ALTER TABLE`
2. **Audit Trail**: No tracking of when/who enabled or disabled modules
3. **Dependencies**: Module dependency graph cannot be enforced with flat columns
4. **Scalability**: Each new module requires schema migration
5. **Query Complexity**: Checking "all enabled modules" requires listing all columns

**Requirements from Story 01.7:**
- FR-SET-090: List all available modules with enabled status
- FR-SET-091: Toggle module enable/disable
- FR-SET-092: Enforce module dependencies (e.g., Planning requires Technical)
- FR-SET-093: Track enable/disable history with audit trail
- FR-SET-094: Prevent disabling modules with active dependents
- FR-SET-095: Hide disabled modules from navigation and API

---

## Decision

**Use Junction Table Pattern (`organization_modules`) instead of flat boolean columns.**

### Schema Definition

```sql
-- modules table: Master list of all available modules (system-seeded)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,       -- 'planning', 'production', etc.
  name VARCHAR(100) NOT NULL,             -- 'Planning Module'
  description TEXT,                        -- Module description for UI
  icon VARCHAR(50),                        -- Icon name for navigation
  dependencies TEXT[] DEFAULT '{}',        -- Array of module codes this depends on
  is_premium BOOLEAN DEFAULT false,        -- Requires paid subscription
  can_disable BOOLEAN DEFAULT true,        -- false for 'settings' module
  display_order INT DEFAULT 0,             -- Sort order in UI
  created_at TIMESTAMPTZ DEFAULT now()
);

-- organization_modules table: Per-org module state
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,                  -- When module was enabled
  enabled_by UUID REFERENCES users(id),   -- Who enabled it
  disabled_at TIMESTAMPTZ,                 -- When module was disabled
  disabled_by UUID REFERENCES users(id),  -- Who disabled it
  settings JSONB DEFAULT '{}',             -- Module-specific config
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, module_id)
);

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;
```

### Seed Data

```sql
-- Seed modules (system data)
INSERT INTO modules (code, name, description, dependencies, is_premium, can_disable, display_order) VALUES
  ('settings', 'Settings', 'Organization configuration and user management', '{}', false, false, 0),
  ('technical', 'Technical', 'Products, BOMs, and routings', '{}', false, true, 1),
  ('planning', 'Planning', 'Purchase orders, work orders, transfer orders', '{"technical"}', false, true, 2),
  ('production', 'Production', 'Work order execution and material consumption', '{"technical","planning"}', false, true, 3),
  ('quality', 'Quality', 'QA holds, inspections, and specifications', '{"production"}', false, true, 4),
  ('warehouse', 'Warehouse', 'Inventory management and license plates', '{"technical"}', false, true, 5),
  ('shipping', 'Shipping', 'Sales orders and shipment management', '{"warehouse"}', false, true, 6),
  ('npd', 'NPD', 'New Product Development and trials', '{"technical"}', true, true, 7),
  ('finance', 'Finance', 'Costing and financial reporting', '{"production"}', true, true, 8),
  ('oee', 'OEE', 'Overall Equipment Effectiveness tracking', '{"production"}', true, true, 9),
  ('integrations', 'Integrations', 'External system integrations', '{}', true, true, 10);

-- Initialize organization_modules for existing orgs (all modules disabled except settings)
INSERT INTO organization_modules (org_id, module_id, enabled, enabled_at)
SELECT o.id, m.id, m.can_disable = false, now()
FROM organizations o
CROSS JOIN modules m;
```

### RLS Policies

```sql
-- modules table: Read-only for all authenticated users (system data)
CREATE POLICY "modules_select_all" ON modules
FOR SELECT
USING (true);

-- organization_modules: Org-scoped read (ADR-013 pattern)
CREATE POLICY "org_modules_select" ON organization_modules
FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- organization_modules: Admin/Owner can update (toggle)
CREATE POLICY "org_modules_update" ON organization_modules
FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- organization_modules: System can insert (on org creation)
CREATE POLICY "org_modules_insert" ON organization_modules
FOR INSERT
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Indexes

```sql
-- Fast module code lookup
CREATE INDEX idx_modules_code ON modules(code);
CREATE INDEX idx_modules_display_order ON modules(display_order);

-- Fast org-module status queries
CREATE INDEX idx_organization_modules_org ON organization_modules(org_id);
CREATE INDEX idx_organization_modules_module ON organization_modules(module_id);
CREATE INDEX idx_organization_modules_enabled ON organization_modules(org_id, enabled);
CREATE UNIQUE INDEX idx_organization_modules_org_module ON organization_modules(org_id, module_id);
```

---

## Rationale

### Why Junction Table Over Flat Columns?

| Factor | Junction Table | Flat Columns |
|--------|----------------|--------------|
| **Add New Module** | INSERT row (no DDL) | ALTER TABLE (migration) |
| **Audit Trail** | enabled_at, enabled_by columns | Not possible |
| **Dependencies** | Query dependencies array | Hardcoded logic |
| **Query Enabled** | `WHERE enabled = true` | List all columns |
| **Module Config** | settings JSONB per module | Separate columns each |
| **Scalability** | O(1) per module | O(n) schema changes |

### Key Benefits

1. **Extensibility**: Add Epic 10 (OEE) and Epic 11 (Integrations) modules without `ALTER TABLE`
2. **Audit Trail**: Track `enabled_at`, `enabled_by`, `disabled_at`, `disabled_by`
3. **Dependency Graph**: Query `dependencies` array for cascade enable/disable
4. **Module Config**: Store module-specific settings in JSONB
5. **Premium Gating**: `is_premium` flag for subscription enforcement
6. **Clean Queries**: Simple JOINs instead of listing column names

---

## Alternatives Considered

### Option A: Flat Boolean Columns in module_settings (Rejected)

```sql
CREATE TABLE module_settings (
  org_id UUID PRIMARY KEY,
  planning_enabled BOOLEAN DEFAULT false,
  production_enabled BOOLEAN DEFAULT false,
  warehouse_enabled BOOLEAN DEFAULT false,
  quality_enabled BOOLEAN DEFAULT false,
  shipping_enabled BOOLEAN DEFAULT false,
  npd_enabled BOOLEAN DEFAULT false,
  finance_enabled BOOLEAN DEFAULT false,
  oee_enabled BOOLEAN DEFAULT false
);
```

**Pros:**
- Simple schema
- Single row per org
- Fast reads (no JOIN)

**Cons:**
- Requires `ALTER TABLE` for each new module
- No audit trail (enabled_at, enabled_by)
- No dependency graph
- No module-specific settings
- Hard to query "all enabled modules"

**Rejected Because:**
- Epic 10/11 add new modules frequently
- Audit trail is required for compliance
- Dependency validation is core feature

### Option B: JSONB Field (Rejected)

```sql
CREATE TABLE module_settings (
  org_id UUID PRIMARY KEY,
  modules JSONB DEFAULT '{}'
  -- {"planning": {"enabled": true, "enabled_at": "..."}, ...}
);
```

**Pros:**
- Flexible schema
- No ALTER TABLE needed
- Can store any metadata

**Cons:**
- No FK constraints (module codes can typo)
- Complex queries (JSONB operators)
- Hard to index enabled status
- No referential integrity with modules table

**Rejected Because:**
- FK constraints ensure valid module codes
- Simple SQL queries preferred over JSONB operators
- Index on `enabled` column more efficient

### Option C: Hybrid (Flat + JSONB) (Rejected)

```sql
CREATE TABLE module_settings (
  org_id UUID PRIMARY KEY,
  planning_enabled BOOLEAN DEFAULT false,
  planning_settings JSONB,
  production_enabled BOOLEAN DEFAULT false,
  production_settings JSONB,
  -- etc...
);
```

**Rejected Because:**
- Still requires ALTER TABLE for new modules
- Combines worst of both approaches
- No clear benefit over junction table

---

## Consequences

### Positive

1. **Zero DDL for New Modules**: Add modules via INSERT, not schema migration
2. **Full Audit Trail**: enabled_at, enabled_by, disabled_at, disabled_by
3. **Dependency Enforcement**: Query dependencies array for cascade logic
4. **Module-Specific Config**: settings JSONB per organization-module
5. **Premium Gating**: is_premium flag for subscription checks
6. **Clean API**: Simple queries with JOINs

### Negative

1. **Migration Required**: Migrate existing `module_settings` flat columns to junction table
2. **JOIN Overhead**: Queries require JOIN between modules and organization_modules
3. **Initialization Required**: New orgs need organization_modules rows seeded

### Neutral

1. **Module Checks Change**: All code checking `module_settings.planning_enabled` must use junction table
2. **Cache Strategy**: Cache enabled modules per org (5 min TTL)
3. **Trigger for New Orgs**: Auto-create organization_modules rows on org creation

---

## Implementation Notes

### Service Layer

```typescript
// lib/services/module-service.ts
export class ModuleService {
  async getEnabledModules(orgId: string): Promise<string[]> {
    const { data } = await supabase
      .from('organization_modules')
      .select('modules(code)')
      .eq('org_id', orgId)
      .eq('enabled', true);

    return data?.map(om => om.modules.code) ?? [];
  }

  async isModuleEnabled(orgId: string, moduleCode: string): Promise<boolean> {
    const { data } = await supabase
      .from('organization_modules')
      .select('enabled, modules!inner(code)')
      .eq('org_id', orgId)
      .eq('modules.code', moduleCode)
      .single();

    return data?.enabled ?? false;
  }

  async toggleModule(
    orgId: string,
    moduleCode: string,
    enabled: boolean,
    userId: string,
    cascade: boolean = false
  ): Promise<{ success: boolean; affected: string[] }> {
    // Validate dependencies
    // Update organization_modules
    // Return affected modules
  }
}
```

### Middleware Integration

```typescript
// middleware/module-guard.ts
export function requireModule(moduleCode: string) {
  return async (req: NextRequest) => {
    const orgId = getOrgId(req);
    const enabled = await isModuleEnabled(orgId, moduleCode);

    if (!enabled) {
      return Response.json(
        { error: 'Module not enabled for this organization' },
        { status: 403 }
      );
    }
  };
}
```

### Navigation Integration

```tsx
// Use enabled modules to filter navigation items
function useNavigation() {
  const { data: enabledModules } = useQuery({
    queryKey: ['modules', 'enabled'],
    queryFn: () => moduleService.getEnabledModules(orgId),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  return NAV_ITEMS.filter(item =>
    item.module === 'settings' || enabledModules?.includes(item.module)
  );
}
```

### Org Creation Trigger

```sql
-- Auto-initialize organization_modules when org is created
CREATE OR REPLACE FUNCTION initialize_org_modules()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_modules (org_id, module_id, enabled, enabled_at)
  SELECT NEW.id, m.id, m.can_disable = false, now()
  FROM modules m;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_init_org_modules
AFTER INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION initialize_org_modules();
```

---

## Migration Path

### Phase 1: Create New Tables

```sql
-- Migration: XXX_create_module_tables.sql
CREATE TABLE modules (...);
CREATE TABLE organization_modules (...);
-- Seed modules
-- Create trigger
```

### Phase 2: Migrate Existing Data (if applicable)

```sql
-- If module_settings table exists with flat columns
INSERT INTO organization_modules (org_id, module_id, enabled, enabled_at)
SELECT
  ms.org_id,
  m.id,
  CASE m.code
    WHEN 'planning' THEN ms.planning_enabled
    WHEN 'production' THEN ms.production_enabled
    WHEN 'warehouse' THEN ms.warehouse_enabled
    WHEN 'quality' THEN ms.quality_enabled
    WHEN 'shipping' THEN ms.shipping_enabled
    ELSE false
  END,
  now()
FROM module_settings ms
CROSS JOIN modules m;
```

### Phase 3: Deprecate Old Table

```sql
-- Drop old table after migration verified
DROP TABLE IF EXISTS module_settings;
```

---

## References

### Stories
- **Story 01.7**: Organization Module Configuration (primary implementer)
- **Story 01.1**: Org Context Base + RLS (org_id isolation)
- **Story 01.6**: Role Permissions (admin+ required for toggle)

### Architecture
- **ADR-012**: Role Permission Storage (similar junction table pattern)
- **ADR-013**: RLS Org Isolation Pattern (organization_modules uses this)
- `docs/1-BASELINE/architecture/modules/settings.md` (lines 224-255, 481-486)

### PRD Requirements
- FR-SET-090 through FR-SET-097 in `docs/1-BASELINE/product/modules/settings.md`

### UX Wireframes
- **SET-022**: Module Toggles Page

---

## Validation Checklist

- [x] Supports FR-SET-090: List all modules with enabled status
- [x] Supports FR-SET-091: Toggle module enable/disable
- [x] Supports FR-SET-092: Enforce module dependencies
- [x] Supports FR-SET-093: Audit trail (enabled_at, enabled_by)
- [x] Supports FR-SET-094: Prevent disabling with active dependents
- [x] Supports FR-SET-095: Hide disabled modules from navigation/API
- [x] Extensible for Epic 10 (OEE) and Epic 11 (Integrations)
- [x] RLS policies follow ADR-013 pattern
- [x] Migration path documented
- [x] Alternatives documented with pros/cons

---

## Decision Review

**Review Date**: 2025-12-15
**Reviewed By**: ARCHITECT-AGENT
**Status**: ACCEPTED

**Key Decision Points:**
1. Junction table enables zero-DDL module additions
2. Audit trail required for compliance tracking
3. Dependency graph enables cascade enable/disable
4. Premium flag supports subscription gating
5. Pattern consistent with ADR-012 (Role Permission Storage)

**Future Considerations:**
- Module versioning: Add `version` column to modules table
- Feature flags: Extend organization_modules.settings JSONB
- Cross-org module templates: Copy module settings between orgs
