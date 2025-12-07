# Batch 5B-1: Stock Moves - Technical Specification

**Batch:** 5B-1 (Stock Moves)
**Stories:** 5.14-5.18
**Status:** Solutioning

---

## Overview

This batch covers inventory movement operations:
- **LP Location Move**: Move LP between locations with audit trail
- **Movement Audit Trail**: Track all LP movements with user and reason
- **Partial Move**: Split LP during movement to new location
- **Destination Validation**: Ensure target location is valid and active
- **Movement Types**: Categorize movements (Receiving, Put-away, Pick, Transfer, Adjustment)

**Key Concept:** All movements are tracked for **complete inventory traceability** and reporting.

---

## Database Schema

### stock_moves Table

```sql
CREATE TABLE stock_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  movement_type VARCHAR(20) NOT NULL,
    -- Enum: 'receiving', 'put_away', 'pick', 'transfer', 'adjustment'
  quantity DECIMAL(15,4) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  reason TEXT,
  moved_at TIMESTAMP DEFAULT now(),
  moved_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),

  INDEX(org_id),
  INDEX(lp_id),
  INDEX(from_location_id),
  INDEX(to_location_id),
  INDEX(movement_type),
  INDEX(moved_at),
  INDEX(moved_by_user_id)
);

-- RLS: Standard org_id isolation
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users"
  ON stock_moves FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
-- ... (standard INSERT, UPDATE policies with org_id isolation)
```

### locations Table (Extended)

```sql
-- Existing table, verify these columns:
ALTER TABLE locations ADD COLUMN IF NOT EXISTS
  location_type VARCHAR(20),
    -- Enum: 'receiving', 'storage', 'production', 'shipping', 'quarantine'
  is_active BOOLEAN DEFAULT true,
  allows_storage BOOLEAN DEFAULT true;

CREATE INDEX idx_locations_org_id ON locations(org_id);
CREATE INDEX idx_locations_is_active ON locations(is_active);
```

---

## API Endpoints

### POST /api/warehouse/stock-moves

**Purpose:** Record LP movement between locations

**Request:**
```json
{
  "lp_id": "UUID",
  "to_location_id": "UUID",
  "movement_type": "put_away|pick|transfer|adjustment",
  "reason": "Organizing stock for picking",
  "quantity": 50,
  "create_split": false
}
```

**Response (201):**
```json
{
  "stock_move_id": "UUID",
  "lp_id": "UUID",
  "from_location": {
    "id": "UUID",
    "code": "WH-A-01",
    "name": "Receiving Area"
  },
  "to_location": {
    "id": "UUID",
    "code": "WH-B-05",
    "name": "Storage Bin 5"
  },
  "movement_type": "put_away",
  "quantity": 50,
  "lp_after_move": {
    "lp_id": "UUID",
    "lp_number": "LP-20250120-0001",
    "location_id": "UUID",
    "quantity": 50
  },
  "moved_at": "2025-01-20T10:30:00Z",
  "moved_by_user_id": "UUID"
}
```

**Validation:**
- `to_location_id` must exist and be active
- `to_location_id` must allow storage (location_type != 'receiving')
- `lp_id` must exist and belong to org_id
- `quantity` must be <= current LP quantity
- If `quantity < lp.quantity` and `create_split = true`: split first, then move

---

### GET /api/warehouse/stock-moves

**Purpose:** Fetch movement history with filtering

**Query Parameters:**
```
?lp_id=UUID              -- Filter by specific LP
?location_id=UUID        -- Filter by from or to location
?movement_type=put_away  -- Filter by movement type
?user_id=UUID            -- Filter by user who moved
?date_from=YYYY-MM-DD    -- Filter by date range
?date_to=YYYY-MM-DD
?limit=50                -- Pagination
?offset=0
```

**Response (200):**
```json
{
  "stock_moves": [
    {
      "id": "UUID",
      "lp_number": "LP-20250120-0001",
      "from_location_code": "WH-A-01",
      "to_location_code": "WH-B-05",
      "movement_type": "put_away",
      "quantity": 50,
      "reason": "Organizing for picking",
      "moved_at": "2025-01-20T10:30:00Z",
      "moved_by_user_id": "UUID",
      "user_name": "John Doe"
    }
  ],
  "total_count": 127,
  "filtered_count": 50
}
```

---

### POST /api/warehouse/license-plates/:id/move

**Alternative endpoint for LP-specific move**

**Request:**
```json
{
  "to_location_id": "UUID",
  "movement_type": "put_away",
  "reason": "Organizing for picking",
  "split_quantity": 25
}
```

**Response (201):**
```json
{
  "stock_move_id": "UUID",
  "lp_moved": "UUID",
  "lp_split": "UUID" (if split),
  "success": true
}
```

---

## Movement Type Semantics

| Type | Source Location | Destination | Use Case | Validation |
|------|---|---|---|---|
| **receiving** | Dock/Receiving | Storage | GRN just created, LP moving from receiving dock | From = receiving, To = storage |
| **put_away** | Receiving | Storage | LP stored after receiving | Auto-generated on GRN completion |
| **pick** | Storage | Production/Shipping | LP allocated to WO/TO | To location must be production/shipping |
| **transfer** | Storage | Another Storage | Reorganize inventory | From != To, both storage |
| **adjustment** | Any | Same/Different | Qty correction, damage, sample | Reason required |

---

## Location Types & Constraints

```sql
-- Location validation rules:
CASE location_type
  WHEN 'receiving' THEN
    - Can only be SOURCE (from_location)
    - Cannot be destination (to_location)
    - Only for initial LP placement
  WHEN 'storage' THEN
    - Can be source or destination
    - Allows put_away, pick, transfer
  WHEN 'production' THEN
    - Can be source or destination
    - For WO consumption operations
  WHEN 'shipping' THEN
    - Can be source or destination
    - Final location before shipment
  WHEN 'quarantine' THEN
    - Restricted: only for hold/review
    - Cannot pick from quarantine
END;
```

---

## SQL Queries

### Get Movement Audit Trail for LP

```sql
SELECT
  id,
  lp_id,
  from_location_id,
  to_location_id,
  movement_type,
  quantity,
  reason,
  moved_at,
  moved_by_user_id
FROM stock_moves
WHERE lp_id = $1 AND org_id = $2
ORDER BY moved_at DESC;
```

### Get Recent Movements for Location

```sql
SELECT
  id,
  lp_id,
  from_location_id,
  to_location_id,
  movement_type,
  quantity,
  moved_at,
  moved_by_user_id
FROM stock_moves
WHERE (from_location_id = $1 OR to_location_id = $1)
  AND org_id = $2
  AND moved_at >= NOW() - INTERVAL '24 hours'
ORDER BY moved_at DESC;
```

### Get Inventory by Location (Current State)

```sql
SELECT
  lp_id,
  lp.lp_number,
  lp.product_id,
  lp.quantity,
  COALESCE(
    (SELECT to_location_id FROM stock_moves
     WHERE lp_id = lp.id AND org_id = $1
     ORDER BY moved_at DESC LIMIT 1),
    lp.location_id
  ) AS current_location_id,
  loc.code AS location_code
FROM license_plates lp
LEFT JOIN locations loc ON lp.location_id = loc.id
WHERE lp.org_id = $1
ORDER BY current_location_id, lp.lp_number;
```

---

## RLS Policies (All Tables)

```sql
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON stock_moves FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable insert for authenticated users"
  ON stock_moves FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable update for authenticated users"
  ON stock_moves FOR UPDATE
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Dependencies

**Requires:**
- Story 5.1 (License Plate Creation)
- Story 5.11 (GRN and LP Creation) - initial LP placement

**Blocks:**
- Story 5.21 (Pallet Move) - uses stock_moves for pallet movements
- Story 5.35 (Inventory Count) - verifies against stock_moves

---

## Implementation Notes

- **Audit Trail:** All movements immutable (insert-only, no updates/deletes)
- **Current Location:** LP current location determined by last stock_move (not lp.location_id)
- **Partial Moves:** If quantity < current LP qty, use split operation first
- **Validation:** Location type validation prevents invalid moves (e.g., receiving → receiving)
- **Performance:** Indexes on lp_id, location_id, moved_at for fast queries
