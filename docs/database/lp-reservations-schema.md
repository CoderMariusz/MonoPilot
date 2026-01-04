# LP Reservations Database Schema

**Story:** 05.3 - LP Reservations + FIFO/FEFO Picking
**Migration:** `090_create_lp_reservations.sql`
**Version:** 1.0
**Last Updated:** 2026-01-03

## Overview

The `lp_reservations` table tracks License Plate allocations to Work Orders and Transfer Orders. It enables material reservation before consumption, preventing allocation conflicts and supporting FIFO/FEFO picking strategies.

**Critical for:** Epic 04 Production (material reservations for WO materials)

---

## Table Structure

### lp_reservations

```sql
CREATE TABLE lp_reservations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- LP Reference
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Source Reference (one of: wo_id or to_id)
  wo_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  to_id UUID,  -- Future: Transfer Orders (Phase 1)
  wo_material_id UUID,  -- Future: Link to wo_materials for Epic 04.8

  -- Quantities
  reserved_qty DECIMAL(15,4) NOT NULL CHECK (reserved_qty > 0),
  consumed_qty DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (consumed_qty >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'released', 'consumed')),

  -- Timestamps
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  reserved_by UUID REFERENCES users(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT consumed_lte_reserved CHECK (consumed_qty <= reserved_qty),
  CONSTRAINT require_wo_or_to CHECK (wo_id IS NOT NULL OR to_id IS NOT NULL)
);
```

---

## Columns

### Identity

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `org_id` | UUID | NO | - | Organization ID (multi-tenancy) |

### References

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `lp_id` | UUID | NO | - | License Plate being reserved |
| `wo_id` | UUID | YES | NULL | Work Order ID (if WO reservation) |
| `to_id` | UUID | YES | NULL | Transfer Order ID (if TO reservation) |
| `wo_material_id` | UUID | YES | NULL | WO Material ID (for Epic 04.8 linking) |

**Important:** Either `wo_id` OR `to_id` must be provided (enforced by constraint).

### Quantities

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `reserved_qty` | DECIMAL(15,4) | NO | - | Quantity reserved from LP |
| `consumed_qty` | DECIMAL(15,4) | NO | 0 | Quantity consumed so far |

**Calculation:**
```
remaining_qty = reserved_qty - consumed_qty
```

**Constraint:** `consumed_qty <= reserved_qty` (enforced by CHECK)

### Status

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `status` | TEXT | NO | 'active' | Reservation status |

**Valid Values:**
- `active` - Reservation is active, material allocated
- `released` - Reservation cancelled/released, LP available again
- `consumed` - Material fully consumed from this reservation

### Timestamps

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `reserved_at` | TIMESTAMPTZ | NO | NOW() | When reservation was created |
| `released_at` | TIMESTAMPTZ | YES | NULL | When reservation was released (if status='released') |
| `reserved_by` | UUID | YES | NULL | User who created reservation |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Row creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Row last update timestamp (auto-updated) |

---

## Indexes

### Primary Query Patterns

```sql
-- Org + LP lookup (RLS queries)
CREATE INDEX idx_reservation_org_lp ON lp_reservations(org_id, lp_id);

-- LP reservations lookup (available qty calculation)
CREATE INDEX idx_reservation_lp ON lp_reservations(lp_id);

-- WO reservations lookup
CREATE INDEX idx_reservation_wo ON lp_reservations(wo_id) WHERE wo_id IS NOT NULL;

-- TO reservations lookup (Phase 1)
CREATE INDEX idx_reservation_to ON lp_reservations(to_id) WHERE to_id IS NOT NULL;

-- Status filtering
CREATE INDEX idx_reservation_status ON lp_reservations(org_id, status);
CREATE INDEX idx_reservation_lp_status ON lp_reservations(lp_id, status);

-- Available qty calculation (active reservations only)
CREATE INDEX idx_reservation_active_lp ON lp_reservations(lp_id)
  WHERE status = 'active';
```

### Performance Impact

| Query Pattern | Index Used | Estimated Rows | Execution Time |
|--------------|------------|----------------|----------------|
| Get WO reservations | `idx_reservation_wo` | 1-50 | < 10ms |
| Get LP active reservations | `idx_reservation_active_lp` | 1-10 | < 5ms |
| Calculate available qty | `idx_reservation_active_lp` | 1-10 | < 5ms |
| List all reservations (org) | `idx_reservation_status` | 100-10,000 | < 50ms |

**Note:** Partial indexes (`WHERE status = 'active'`) significantly reduce index size and improve query performance for available quantity calculations.

---

## Constraints

### Check Constraints

```sql
-- Reserved quantity must be positive
CHECK (reserved_qty > 0)

-- Consumed quantity must be non-negative
CHECK (consumed_qty >= 0)

-- Consumed cannot exceed reserved
CONSTRAINT consumed_lte_reserved CHECK (consumed_qty <= reserved_qty)

-- Status must be valid
CHECK (status IN ('active', 'released', 'consumed'))

-- Either wo_id or to_id must be provided
CONSTRAINT require_wo_or_to CHECK (wo_id IS NOT NULL OR to_id IS NOT NULL)
```

### Foreign Key Constraints

```sql
-- Cascade delete when organization deleted
FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE

-- Cascade delete when LP deleted
FOREIGN KEY (lp_id) REFERENCES license_plates(id) ON DELETE CASCADE

-- Cascade delete when WO deleted
FOREIGN KEY (wo_id) REFERENCES work_orders(id) ON DELETE CASCADE

-- User reference (nullable, no cascade)
FOREIGN KEY (reserved_by) REFERENCES users(id)
```

**Delete Behavior:**
- When LP is deleted → All its reservations are deleted
- When WO is deleted → All its reservations are deleted
- When org is deleted → All its data is deleted (cascade)

---

## Triggers

### 1. Update Timestamp Trigger

Automatically updates `updated_at` on every row update.

```sql
CREATE OR REPLACE FUNCTION update_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reservation_updated_at
BEFORE UPDATE ON lp_reservations
FOR EACH ROW EXECUTE FUNCTION update_reservation_updated_at();
```

**Example:**
```sql
UPDATE lp_reservations SET consumed_qty = 50 WHERE id = 'res-123';
-- updated_at automatically set to NOW()
```

### 2. LP Status Update Trigger

Automatically updates `license_plates.status` when reservations change.

```sql
CREATE OR REPLACE FUNCTION update_lp_reservation_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_qty DECIMAL(15,4);
  v_reserved_qty DECIMAL(15,4);
  v_lp_id UUID;
BEGIN
  -- Get the LP ID depending on operation
  IF TG_OP = 'DELETE' THEN
    v_lp_id := OLD.lp_id;
  ELSE
    v_lp_id := NEW.lp_id;
  END IF;

  -- Get LP total quantity
  SELECT quantity INTO v_total_qty
  FROM license_plates
  WHERE id = v_lp_id;

  -- Calculate active reserved quantity
  SELECT COALESCE(SUM(reserved_qty - consumed_qty), 0)
  INTO v_reserved_qty
  FROM lp_reservations
  WHERE lp_id = v_lp_id
    AND status = 'active';

  -- Update LP status based on reserved qty
  IF v_reserved_qty >= v_total_qty THEN
    -- Fully reserved
    UPDATE license_plates
    SET status = 'reserved'
    WHERE id = v_lp_id AND status = 'available';
  ELSE
    -- Not fully reserved - check if was reserved and has no other active reservations
    IF v_reserved_qty = 0 THEN
      UPDATE license_plates
      SET status = 'available'
      WHERE id = v_lp_id AND status = 'reserved';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_lp_reservation_status
AFTER INSERT OR UPDATE OR DELETE ON lp_reservations
FOR EACH ROW EXECUTE FUNCTION update_lp_reservation_status();
```

**Behavior:**

| Scenario | LP Status Update |
|----------|------------------|
| Full LP reservation (reserved_qty = lp.quantity) | `available` → `reserved` |
| Partial LP reservation (reserved_qty < lp.quantity) | Remains `available` |
| All reservations released (active_reserved = 0) | `reserved` → `available` |
| Partial consumption (consumed_qty > 0) | No change |

**Example:**
```sql
-- LP-001: quantity = 100, status = 'available'

-- Reserve 50 kg
INSERT INTO lp_reservations (lp_id, wo_id, reserved_qty)
VALUES ('lp-001', 'wo-123', 50);
-- LP status: still 'available' (partial reservation)

-- Reserve remaining 50 kg
INSERT INTO lp_reservations (lp_id, wo_id, reserved_qty)
VALUES ('lp-001', 'wo-456', 50);
-- TRIGGER: LP status updated to 'reserved' (fully reserved)

-- Release first reservation
UPDATE lp_reservations SET status = 'released' WHERE id = 'res-1';
-- TRIGGER: LP status updated back to 'available' (not fully reserved anymore)
```

---

## Helper Functions

### get_lp_reserved_qty()

Get the active reserved quantity for an LP.

```sql
CREATE OR REPLACE FUNCTION get_lp_reserved_qty(p_lp_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_reserved DECIMAL(15,4);
BEGIN
  SELECT COALESCE(SUM(reserved_qty - consumed_qty), 0)
  INTO v_reserved
  FROM lp_reservations
  WHERE lp_id = p_lp_id
    AND status = 'active';

  RETURN v_reserved;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Usage:**
```sql
SELECT get_lp_reserved_qty('lp-001');
-- Returns: 50.00 (kg)
```

### get_lp_available_qty()

Get the available quantity for an LP.

```sql
CREATE OR REPLACE FUNCTION get_lp_available_qty(p_lp_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_quantity DECIMAL(15,4);
  v_reserved DECIMAL(15,4);
BEGIN
  -- Get LP quantity
  SELECT quantity INTO v_quantity
  FROM license_plates
  WHERE id = p_lp_id;

  IF v_quantity IS NULL THEN
    RETURN 0;
  END IF;

  -- Get reserved qty
  v_reserved := get_lp_reserved_qty(p_lp_id);

  RETURN v_quantity - v_reserved;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Usage:**
```sql
SELECT get_lp_available_qty('lp-001');
-- Returns: 50.00 (100 total - 50 reserved)
```

**Performance:** `STABLE` function can be cached within a query.

---

## Row Level Security (RLS)

### Policies

```sql
ALTER TABLE lp_reservations ENABLE ROW LEVEL SECURITY;

-- SELECT: Org isolation
CREATE POLICY "reservation_select_org" ON lp_reservations
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Org isolation + valid LP reference
CREATE POLICY "reservation_insert_org" ON lp_reservations
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND lp_id IN (
    SELECT id FROM license_plates
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

-- UPDATE: Org isolation
CREATE POLICY "reservation_update_org" ON lp_reservations
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE: Org isolation
CREATE POLICY "reservation_delete_org" ON lp_reservations
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Security Guarantees

1. **Multi-tenancy:** Users can only access reservations in their org
2. **LP Ownership:** Users can only create reservations for LPs they own
3. **No Cross-Org Leaks:** RLS prevents all cross-org data access

**Important:** You do NOT need to filter by `org_id` in application code. RLS handles this automatically.

---

## Common Queries

### Get Available Quantity for LP

```sql
SELECT
  lp.id,
  lp.lp_number,
  lp.quantity,
  lp.quantity - COALESCE(SUM(r.reserved_qty - r.consumed_qty), 0) AS available_qty
FROM license_plates lp
LEFT JOIN lp_reservations r ON lp.id = r.lp_id AND r.status = 'active'
WHERE lp.id = $lp_id
GROUP BY lp.id;
```

### Get All WO Reservations with LP Details

```sql
SELECT
  r.*,
  lp.lp_number,
  lp.batch_number,
  lp.expiry_date,
  p.name AS product_name,
  l.full_path AS location_path,
  w.name AS warehouse_name
FROM lp_reservations r
INNER JOIN license_plates lp ON r.lp_id = lp.id
INNER JOIN products p ON lp.product_id = p.id
INNER JOIN locations l ON lp.location_id = l.id
INNER JOIN warehouses w ON lp.warehouse_id = w.id
WHERE r.wo_id = $wo_id
ORDER BY r.created_at ASC;
```

### Find Available LPs (FIFO)

```sql
SELECT
  lp.*,
  lp.quantity - COALESCE(SUM(r.reserved_qty - r.consumed_qty), 0) AS available_qty
FROM license_plates lp
LEFT JOIN lp_reservations r ON lp.id = r.lp_id AND r.status = 'active'
WHERE lp.product_id = $product_id
  AND lp.status = 'available'
  AND lp.qa_status = 'passed'
  AND (lp.expiry_date IS NULL OR lp.expiry_date >= CURRENT_DATE)
GROUP BY lp.id
HAVING lp.quantity - COALESCE(SUM(r.reserved_qty - r.consumed_qty), 0) > 0
ORDER BY lp.created_at ASC;
```

### Find Available LPs (FEFO)

```sql
-- Same as FIFO but with different ORDER BY
ORDER BY
  CASE WHEN lp.expiry_date IS NULL THEN 1 ELSE 0 END,  -- NULLs last
  lp.expiry_date ASC,
  lp.created_at ASC;
```

### Calculate Total Reserved for WO

```sql
SELECT
  wo_id,
  COUNT(*) AS reservation_count,
  SUM(reserved_qty) AS total_reserved,
  SUM(consumed_qty) AS total_consumed,
  SUM(reserved_qty - consumed_qty) AS total_remaining
FROM lp_reservations
WHERE wo_id = $wo_id
  AND status = 'active'
GROUP BY wo_id;
```

---

## Data Lifecycle

### 1. Reservation Creation

```sql
INSERT INTO lp_reservations (org_id, lp_id, wo_id, reserved_qty, reserved_by)
VALUES ($org_id, $lp_id, $wo_id, $reserved_qty, $user_id);
```

**Trigger Actions:**
- `updated_at` set to NOW()
- If LP fully reserved → `license_plates.status` updated to 'reserved'

### 2. Partial Consumption

```sql
UPDATE lp_reservations
SET consumed_qty = consumed_qty + $consumed_qty
WHERE id = $reservation_id;
```

**Trigger Actions:**
- `updated_at` set to NOW()
- Status remains 'active' (if consumed_qty < reserved_qty)

### 3. Full Consumption

```sql
UPDATE lp_reservations
SET consumed_qty = reserved_qty,
    status = 'consumed'
WHERE id = $reservation_id;
```

**Trigger Actions:**
- `updated_at` set to NOW()
- If LP now has no active reservations → `license_plates.status` updated to 'available'

### 4. Reservation Release

```sql
UPDATE lp_reservations
SET status = 'released',
    released_at = NOW()
WHERE id = $reservation_id;
```

**Trigger Actions:**
- `updated_at` set to NOW()
- If LP now has no active reservations → `license_plates.status` updated to 'available'

### 5. Cascade Delete (WO Deleted)

```sql
DELETE FROM work_orders WHERE id = $wo_id;
```

**Cascade:**
- All `lp_reservations` with `wo_id = $wo_id` are deleted
- **Trigger Actions:** LP status updated to 'available' for each released LP

---

## Migration

### Apply Migration

```bash
# Via Supabase CLI
npx supabase db push

# Or apply manually
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/090_create_lp_reservations.sql
```

### Rollback (if needed)

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS tr_reservation_updated_at ON lp_reservations;
DROP TRIGGER IF EXISTS tr_lp_reservation_status ON lp_reservations;

-- Drop functions
DROP FUNCTION IF EXISTS update_reservation_updated_at();
DROP FUNCTION IF EXISTS update_lp_reservation_status();
DROP FUNCTION IF EXISTS get_lp_reserved_qty(UUID);
DROP FUNCTION IF EXISTS get_lp_available_qty(UUID);

-- Drop table (CASCADE will drop indexes and constraints)
DROP TABLE IF EXISTS lp_reservations CASCADE;
```

---

## Testing

### Verify Schema

```sql
-- Check table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'lp_reservations'
);

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'lp_reservations';

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'lp_reservations'::regclass;

-- Check RLS enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'lp_reservations';
```

### Sample Data

```sql
-- Insert test reservation
INSERT INTO lp_reservations (org_id, lp_id, wo_id, reserved_qty, reserved_by)
VALUES (
  (SELECT org_id FROM users WHERE id = auth.uid()),
  'lp-001',
  'wo-001',
  50.00,
  auth.uid()
);

-- Verify trigger updated LP status
SELECT status FROM license_plates WHERE id = 'lp-001';
-- Expected: 'reserved' (if fully reserved) or 'available' (if partial)
```

---

## Related Documentation

- [LP Reservations API Reference](../api/warehouse/lp-reservations-api.md)
- [FIFO/FEFO Picking Guide](../guides/warehouse/fifo-fefo-picking.md)
- [Integration Guide for Epic 04.8](../guides/warehouse/epic-04-integration.md)
- [License Plates Schema](./license-plates-schema.md)

---

## Support

**Migration:** `090_create_lp_reservations.sql`
**Story:** 05.3
**Owner:** OPUS (Story Writer)
**Last Updated:** 2026-01-03
