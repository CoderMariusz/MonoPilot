# ADR-011: Module Toggle Storage

## Status
ACCEPTED

## Date
2025-12-15

## Context
Epic 01a-Settings

We need to store which modules are enabled for each organization. Two approaches exist:
1. Flat columns in `module_settings` table (current architecture doc)
2. Junction table `organization_modules` (proposed in story 01a.7)

**Problem:**
The flat column approach requires schema migration every time a new module is added. With Epics 10 (OEE) and 11 (Integrations) being new additions, this inflexibility becomes a significant maintenance burden.

**Real-World Use Cases:**
1. **Module activation tracking**: Need to know who enabled a module and when
2. **Module dependencies**: Some modules require others (e.g., OEE requires Production)
3. **License enforcement**: Premium modules need activation tracking for billing
4. **Future extensibility**: New modules should not require ALTER TABLE

---

## Decision

**Use junction table approach:**

```sql
-- Master modules table (seeded, immutable)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dependencies TEXT[],
  can_disable BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization-specific module state
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  module_id UUID NOT NULL REFERENCES modules(id),
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, module_id)
);
```

### Seed Data for Modules Table

```sql
INSERT INTO modules (code, name, description, dependencies, can_disable, display_order) VALUES
  ('settings', 'Settings', 'Organization and user management', '{}', false, 1),
  ('technical', 'Technical', 'Products, BOMs, and routings', '{}', false, 2),
  ('planning', 'Planning', 'Work orders and scheduling', '{technical}', true, 3),
  ('production', 'Production', 'Work order execution', '{planning}', true, 4),
  ('warehouse', 'Warehouse', 'Inventory and license plates', '{technical}', true, 5),
  ('quality', 'Quality', 'QC holds and inspections', '{production}', true, 6),
  ('shipping', 'Shipping', 'Order fulfillment and dispatch', '{warehouse}', true, 7),
  ('npd', 'NPD', 'New product development', '{technical}', true, 8),
  ('finance', 'Finance', 'Costing and pricing', '{planning}', true, 9),
  ('oee', 'OEE', 'Overall equipment effectiveness', '{production}', true, 10),
  ('integrations', 'Integrations', 'External system connections', '{}', true, 11);
```

### RLS Policies

```sql
-- modules table: Read-only for all authenticated users
CREATE POLICY "modules_select" ON modules FOR SELECT TO authenticated USING (true);

-- organization_modules: Org-scoped access
CREATE POLICY "org_modules_select" ON organization_modules FOR SELECT TO authenticated
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "org_modules_insert" ON organization_modules FOR INSERT TO authenticated
  WITH CHECK (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "org_modules_update" ON organization_modules FOR UPDATE TO authenticated
  USING (org_id = auth.jwt() ->> 'org_id');
```

---

## Rationale

1. **Extensibility**: Adding new modules doesn't require schema migration
2. **Audit trail**: Can track who/when enabled each module
3. **Flexibility**: Dependencies stored in modules table, easy to query
4. **Cleaner queries**: JOIN vs multiple boolean columns
5. **License management**: Easy to query enabled premium modules for billing

---

## Consequences

### Positive

1. **No schema changes for new modules**: Just INSERT into modules table
2. **Full audit trail**: enabled_at, enabled_by tracked automatically
3. **Dependency validation**: Can enforce module dependencies in application layer
4. **Clean API responses**: Query enabled modules with single JOIN
5. **Billing integration ready**: Premium module tracking built-in

### Negative

1. **Deprecate `module_settings` table**: Migration required if exists
2. **Slightly more complex queries**: JOIN required vs direct column access
3. **Additional table maintenance**: Two tables vs one

### Neutral

1. **Seed data management**: Modules table seeded during deployment
2. **can_disable flag**: Settings and Technical modules always enabled

---

## Alternatives Considered

### Option 1: Flat Columns in module_settings (Status Quo)

```sql
CREATE TABLE module_settings (
  org_id UUID PRIMARY KEY,
  planning_enabled BOOLEAN,
  production_enabled BOOLEAN,
  warehouse_enabled BOOLEAN,
  -- ... add column for each module
);
```

**Rejected:**
- Adding Epic 10, 11 modules would require ALTER TABLE
- No audit trail for enable/disable actions
- Harder to manage dependencies
- No flexibility for premium module tracking

### Option 2: JSONB Column

```sql
CREATE TABLE organization_settings (
  org_id UUID PRIMARY KEY,
  enabled_modules JSONB DEFAULT '{}'
);
```

**Rejected:**
- Cannot enforce FK constraints
- Harder to query specific module status
- No audit trail without additional complexity
- Dependencies harder to validate

---

## Implementation Plan

### Phase 1: Database Migration (Priority: P1)
```
Migration: 053_create_modules_tables.sql
- CREATE TABLE modules (seed with 11 modules)
- CREATE TABLE organization_modules
- ADD RLS policies
- Migrate existing module_settings data (if exists)
- DROP TABLE module_settings (if exists)
```

### Phase 2: API Updates (Priority: P1)
- [ ] Create GET /api/settings/modules endpoint
- [ ] Create PUT /api/settings/modules/:moduleId endpoint
- [ ] Update organization setup flow

### Phase 3: UI Updates (Priority: P2)
- [ ] Update Module Management page (SET-012)
- [ ] Add enable/disable toggles with dependency warnings
- [ ] Add audit log display (who enabled when)

---

## Validation

- [x] Supports FR-SET-012: Module Management
- [x] Supports FR-SET-013: Module Dependencies
- [x] Supports NFR-SEC-001: Audit Trail
- [x] Maintains multi-tenancy (org_id on organization_modules)
- [x] Compatible with existing RLS patterns (ADR-003)
- [x] Extensible for future modules (Epic 10, 11+)

---

## Related

### Affected Modules
- **Settings Module**: Module Management UI
- **All Modules**: Feature flag checks based on enabled status

### ADRs
- ADR-003: Multi-tenancy RLS (applies to organization_modules)
- ADR-008: Audit Trail Strategy (enabled_at, enabled_by pattern)

### PRDs
- `docs/1-BASELINE/product/modules/settings.md` (FR-SET-012, FR-SET-013)

### UX Wireframes
- SET-012: Module Management
- SET-013: Module Toggle Confirmation

### Stories
- Story 01a.7: Module Enable/Disable API
