# PO Status Lifecycle - Database Schema Documentation

**Story:** 03.7 - PO Status Lifecycle (Configurable Statuses)
**Migration:** `086_create_po_statuses.sql`
**Version:** 1.0
**Last Updated:** 2026-01-02

## Overview

The PO Status Lifecycle feature adds two new tables to support configurable status workflows:
- `po_statuses`: Status definitions per organization
- `po_status_transitions`: Allowed status transition rules

## Database Schema

### Table: `po_statuses`

Stores organization-specific PO status definitions.

```sql
CREATE TABLE po_statuses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code              VARCHAR(50) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  color             VARCHAR(20) NOT NULL DEFAULT 'gray',
  display_order     INTEGER NOT NULL DEFAULT 1,
  is_system         BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT po_statuses_org_code_unique UNIQUE(org_id, code),
  CONSTRAINT po_statuses_color_check CHECK (
    color IN ('gray', 'blue', 'yellow', 'green', 'purple', 'emerald',
              'red', 'orange', 'amber', 'teal', 'indigo')
  ),
  CONSTRAINT po_statuses_code_format CHECK (
    code ~ '^[a-z][a-z0-9_]*$'
  )
);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `org_id` | UUID | No | Organization FK, cascade delete |
| `code` | VARCHAR(50) | No | Unique status code within org (lowercase, underscores) |
| `name` | VARCHAR(100) | No | Display name for UI |
| `color` | VARCHAR(20) | No | Badge color (default: 'gray') |
| `display_order` | INTEGER | No | Order in dropdowns/lists (1-based) |
| `is_system` | BOOLEAN | No | True = cannot delete or rename (default: false) |
| `is_active` | BOOLEAN | No | False = hidden from new POs (default: true) |
| `description` | TEXT | Yes | Optional description |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp (auto-updated) |

#### Constraints

1. **Unique Code per Org:** `UNIQUE(org_id, code)`
   - Same code can exist in different organizations
   - Example: Org A and Org B can both have `awaiting_vendor`

2. **Color Validation:** `CHECK (color IN (...))`
   - Only 11 predefined colors allowed
   - Ensures consistent UI rendering

3. **Code Format:** `CHECK (code ~ '^[a-z][a-z0-9_]*$')`
   - Must start with lowercase letter
   - Contains only lowercase letters, numbers, and underscores
   - Example valid: `draft`, `pending_approval`, `awaiting_vendor_2`
   - Example invalid: `Draft`, `pending-approval`, `_draft`, `1draft`

#### Indexes

```sql
CREATE INDEX idx_po_statuses_org ON po_statuses(org_id, display_order);
CREATE INDEX idx_po_statuses_org_code ON po_statuses(org_id, code);
CREATE INDEX idx_po_statuses_is_system ON po_statuses(org_id, is_system);
```

**Performance Rationale:**
- `(org_id, display_order)`: Fast retrieval for ordered status lists
- `(org_id, code)`: Fast lookups by status code
- `(org_id, is_system)`: Quick filtering of system vs custom statuses

---

### Table: `po_status_transitions`

Defines valid status transition rules.

```sql
CREATE TABLE po_status_transitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_status_id      UUID NOT NULL REFERENCES po_statuses(id) ON DELETE CASCADE,
  to_status_id        UUID NOT NULL REFERENCES po_statuses(id) ON DELETE CASCADE,
  is_system           BOOLEAN NOT NULL DEFAULT false,
  requires_approval   BOOLEAN NOT NULL DEFAULT false,
  requires_reason     BOOLEAN NOT NULL DEFAULT false,
  condition_function  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT po_transitions_unique UNIQUE(org_id, from_status_id, to_status_id),
  CONSTRAINT po_transitions_no_self_loop CHECK (from_status_id != to_status_id)
);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `org_id` | UUID | No | Organization FK, cascade delete |
| `from_status_id` | UUID | No | Source status FK, cascade delete |
| `to_status_id` | UUID | No | Target status FK, cascade delete |
| `is_system` | BOOLEAN | No | True = system-required, cannot remove (default: false) |
| `requires_approval` | BOOLEAN | No | True = transition needs approval (default: false) |
| `requires_reason` | BOOLEAN | No | True = user must provide notes (default: false) |
| `condition_function` | TEXT | Yes | Optional SQL function name for conditional validation |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

#### Constraints

1. **Unique Transition:** `UNIQUE(org_id, from_status_id, to_status_id)`
   - Only one transition rule per from→to pair
   - Different orgs can have same transition

2. **No Self-Loop:** `CHECK (from_status_id != to_status_id)`
   - Cannot transition from a status to itself
   - Example invalid: `draft → draft`

#### Indexes

```sql
CREATE INDEX idx_po_transitions_from ON po_status_transitions(from_status_id);
CREATE INDEX idx_po_transitions_to ON po_status_transitions(to_status_id);
CREATE INDEX idx_po_transitions_org ON po_status_transitions(org_id);
```

**Performance Rationale:**
- `from_status_id`: Fast lookup of available next statuses
- `to_status_id`: Fast reverse lookup (what statuses can reach this one)
- `org_id`: Multi-tenancy filtering

---

### Table: `po_status_history`

Audit trail for all status changes. **Note:** This table was created in Story 03.3, documented here for completeness.

```sql
CREATE TABLE po_status_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id                 UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  from_status           VARCHAR(50),
  to_status             VARCHAR(50) NOT NULL,
  changed_by            UUID REFERENCES users(id),
  changed_at            TIMESTAMPTZ DEFAULT NOW(),
  notes                 TEXT,
  transition_metadata   JSONB
);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `po_id` | UUID | No | Purchase order FK, cascade delete |
| `from_status` | VARCHAR(50) | Yes | Previous status code (null for creation) |
| `to_status` | VARCHAR(50) | No | New status code |
| `changed_by` | UUID | Yes | User who made change (null for system) |
| `changed_at` | TIMESTAMPTZ | No | When change occurred |
| `notes` | TEXT | Yes | Optional reason/notes |
| `transition_metadata` | JSONB | Yes | Additional context (e.g., approval_id) |

#### Indexes

```sql
CREATE INDEX idx_po_history_po ON po_status_history(po_id, changed_at DESC);
```

**Performance Rationale:**
- `(po_id, changed_at DESC)`: Fast chronological history retrieval

---

## Row Level Security (RLS)

All tables enforce strict organization isolation and role-based access.

### `po_statuses` Policies

```sql
-- SELECT: All authenticated users in org can read
CREATE POLICY po_statuses_select ON po_statuses
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Admin only
CREATE POLICY po_statuses_insert ON po_statuses
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- UPDATE: Admin only
CREATE POLICY po_statuses_update ON po_statuses
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );

-- DELETE: Admin only, non-system only
CREATE POLICY po_statuses_delete ON po_statuses
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_system = false
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'super_admin')
    )
  );
```

**Key Points:**
- All users can **read** statuses (needed for dropdowns)
- Only **admins** can create, update, delete
- RLS prevents deleting system statuses (double protection with CHECK constraint)

### `po_status_transitions` Policies

```sql
-- SELECT: All authenticated users in org can read
CREATE POLICY po_transitions_select ON po_status_transitions
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Admin only
CREATE POLICY po_transitions_insert ON po_status_transitions
  FOR INSERT
  WITH CHECK (...admin check...);

-- UPDATE: Admin only, non-system only
CREATE POLICY po_transitions_update ON po_status_transitions
  FOR UPDATE
  USING (... AND is_system = false ...);

-- DELETE: Admin only, non-system only
CREATE POLICY po_transitions_delete ON po_status_transitions
  FOR DELETE
  USING (... AND is_system = false ...);
```

**Key Points:**
- All users can **read** transitions (for validation)
- Only **admins** can modify
- RLS prevents modifying system transitions

---

## Functions

### `create_default_po_statuses(p_org_id UUID)`

Creates default statuses and transitions for a new organization.

```sql
CREATE OR REPLACE FUNCTION create_default_po_statuses(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft_id UUID;
  v_submitted_id UUID;
  v_pending_approval_id UUID;
  v_confirmed_id UUID;
  v_receiving_id UUID;
  v_closed_id UUID;
  v_cancelled_id UUID;
BEGIN
  -- Check if statuses already exist
  IF EXISTS (SELECT 1 FROM po_statuses WHERE org_id = p_org_id LIMIT 1) THEN
    RAISE NOTICE 'PO statuses already exist for org %', p_org_id;
    RETURN;
  END IF;

  -- Insert 7 default statuses
  INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system, description)
  VALUES (p_org_id, 'draft', 'Draft', 'gray', 1, true, 'PO is being prepared, not yet submitted')
  RETURNING id INTO v_draft_id;

  -- ... (6 more statuses) ...

  -- Insert default transitions
  INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
  VALUES (p_org_id, v_draft_id, v_submitted_id, false);

  -- ... (10 more transitions) ...

  RAISE NOTICE 'Default PO statuses created for org %', p_org_id;
END;
$$;
```

**Usage:**

```sql
-- Call during organization creation
SELECT create_default_po_statuses('org-uuid');
```

**What It Creates:**

**Statuses:**
1. `draft` (gray, system)
2. `submitted` (blue, system)
3. `pending_approval` (yellow, non-system)
4. `confirmed` (green, system)
5. `receiving` (purple, system)
6. `closed` (emerald, system)
7. `cancelled` (red, system)

**Transitions:**
- `draft → submitted, cancelled`
- `submitted → pending_approval, confirmed, cancelled`
- `pending_approval → confirmed, cancelled`
- `confirmed → receiving (system), cancelled`
- `receiving → closed (system), cancelled`

**Idempotent:** Safe to call multiple times (checks if statuses exist).

---

## Triggers

### Auto-Update Timestamp

```sql
CREATE TRIGGER tr_po_statuses_updated_at
  BEFORE UPDATE ON po_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Function:** `update_updated_at_column()` (shared utility)

**Behavior:** Sets `updated_at = NOW()` on every row update.

---

## Grants

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON po_statuses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON po_status_transitions TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_po_statuses(UUID) TO authenticated;
```

**Note:** RLS policies enforce actual access control, grants enable baseline access.

---

## Data Examples

### Example Statuses

```sql
-- System status
INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system)
VALUES ('org-uuid', 'confirmed', 'Confirmed', 'green', 4, true);

-- Custom status
INSERT INTO po_statuses (org_id, code, name, color, display_order, is_system)
VALUES ('org-uuid', 'awaiting_vendor', 'Awaiting Vendor', 'orange', 3, false);
```

### Example Transitions

```sql
-- Regular transition
INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
VALUES ('org-uuid', 'draft-id', 'submitted-id', false);

-- System-required transition
INSERT INTO po_status_transitions (org_id, from_status_id, to_status_id, is_system)
VALUES ('org-uuid', 'confirmed-id', 'receiving-id', true);
```

### Example History

```sql
-- User-triggered transition
INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, notes)
VALUES ('po-uuid', 'draft', 'submitted', 'user-uuid', 'Ready for processing');

-- System-triggered transition
INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, notes)
VALUES ('po-uuid', 'confirmed', 'receiving', NULL, 'Auto-transitioned: first receipt recorded');

-- PO creation
INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, notes)
VALUES ('po-uuid', NULL, 'draft', 'user-uuid', 'PO created');
```

---

## Query Examples

### Get All Statuses for Organization

```sql
SELECT *
FROM po_statuses
WHERE org_id = 'org-uuid'
ORDER BY display_order ASC;
```

### Get Available Next Statuses

```sql
SELECT s.*
FROM po_status_transitions t
JOIN po_statuses s ON t.to_status_id = s.id
WHERE t.from_status_id = 'current-status-id'
  AND t.org_id = 'org-uuid'
ORDER BY s.display_order;
```

### Check If Transition Is Allowed

```sql
SELECT EXISTS (
  SELECT 1
  FROM po_status_transitions
  WHERE org_id = 'org-uuid'
    AND from_status_id = 'from-id'
    AND to_status_id = 'to-id'
) AS is_allowed;
```

### Get PO Status History

```sql
SELECT
  h.*,
  u.first_name,
  u.last_name,
  u.email
FROM po_status_history h
LEFT JOIN users u ON h.changed_by = u.id
WHERE h.po_id = 'po-uuid'
ORDER BY h.changed_at DESC;
```

### Count POs Using Each Status

```sql
SELECT
  s.code,
  s.name,
  COUNT(po.id) AS po_count
FROM po_statuses s
LEFT JOIN purchase_orders po ON po.status = s.code AND po.org_id = s.org_id
WHERE s.org_id = 'org-uuid'
GROUP BY s.id, s.code, s.name
ORDER BY s.display_order;
```

---

## Migration Path

### From 03.3 to 03.7

1. **Story 03.3** created `po_status_history` table
2. **Story 03.7** adds `po_statuses` and `po_status_transitions` tables
3. Existing POs continue using hardcoded status codes (`draft`, `submitted`, etc.)
4. After 03.7 deployment:
   - New orgs: Get default statuses via `create_default_po_statuses()`
   - Existing orgs: Run migration to backfill statuses

### Backfill Script (for existing orgs)

```sql
-- Run for each existing organization
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    PERFORM create_default_po_statuses(org.id);
  END LOOP;
END;
$$;
```

---

## Performance Considerations

### Index Coverage

All queries are covered by indexes:

1. **List statuses:** Uses `idx_po_statuses_org`
2. **Lookup by code:** Uses `idx_po_statuses_org_code`
3. **Get transitions:** Uses `idx_po_transitions_from`
4. **Status history:** Uses `idx_po_history_po`

### Query Optimization

- **RLS policies:** Use indexed columns (`org_id`, `id`)
- **Foreign keys:** All have cascade delete for cleanup
- **Denormalization:** None required (tables are small, ~10-20 rows per org)

### Estimated Table Sizes

| Table | Rows per Org | Storage per Org |
|-------|--------------|-----------------|
| `po_statuses` | 7-15 | ~2 KB |
| `po_status_transitions` | 10-30 | ~3 KB |
| `po_status_history` | 5-10 per PO | ~1 KB per PO |

**Total:** Negligible overhead, high query performance.

---

## Backup and Restore

### Backup Status Configuration

```sql
COPY (
  SELECT * FROM po_statuses WHERE org_id = 'org-uuid'
) TO '/backup/po_statuses.csv' CSV HEADER;

COPY (
  SELECT * FROM po_status_transitions WHERE org_id = 'org-uuid'
) TO '/backup/po_transitions.csv' CSV HEADER;
```

### Restore Status Configuration

```sql
COPY po_statuses FROM '/backup/po_statuses.csv' CSV HEADER;
COPY po_status_transitions FROM '/backup/po_transitions.csv' CSV HEADER;
```

---

## Testing Queries

### Verify Default Statuses

```sql
SELECT
  code,
  name,
  color,
  display_order,
  is_system
FROM po_statuses
WHERE org_id = 'test-org-uuid'
ORDER BY display_order;

-- Expected: 7 rows (draft, submitted, pending_approval, confirmed, receiving, closed, cancelled)
```

### Verify Transition Rules

```sql
SELECT
  fs.code AS from_status,
  ts.code AS to_status,
  t.is_system
FROM po_status_transitions t
JOIN po_statuses fs ON t.from_status_id = fs.id
JOIN po_statuses ts ON t.to_status_id = ts.id
WHERE t.org_id = 'test-org-uuid'
ORDER BY fs.display_order, ts.display_order;

-- Expected: 11 transitions as per default config
```

### Test RLS Isolation

```sql
-- As User A (Org A)
SET SESSION AUTHORIZATION 'user-a-uuid';
SELECT * FROM po_statuses; -- Should see only Org A statuses

-- As User B (Org B)
SET SESSION AUTHORIZATION 'user-b-uuid';
SELECT * FROM po_statuses; -- Should see only Org B statuses
```

---

## Related Documentation

- [API Documentation](../api/po-status-lifecycle.md)
- [Service Layer](./po-status-service.md)
- [Admin Configuration Guide](./po-status-admin-guide.md)
- [Migration File](../../supabase/migrations/086_create_po_statuses.sql)
