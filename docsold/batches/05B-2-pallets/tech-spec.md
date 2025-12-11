# Batch 5B-2: Pallet Management - Technical Specification

**Batch:** 5B-2 (Pallet Management)
**Stories:** 5.19-5.22
**Focus:** Pallet creation, LP management, pallet moves, status tracking
**Total Effort:** ~20-25 hours
**Duration:** 2-3 days

---

## Database Schema

### Table: pallets

```sql
CREATE TABLE pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  pallet_number VARCHAR(50) NOT NULL UNIQUE(org_id, pallet_number),
  location_id UUID NOT NULL REFERENCES locations(id),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'shipped')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by_user_id UUID REFERENCES users(id),
  shipped_at TIMESTAMP
);
```

**Constraints:**
- `UNIQUE(org_id, pallet_number)`: Pallet numbers unique per organization
- `status IN ('open', 'closed', 'shipped')`: Enumerated status

**Indexes:**
- `idx_pallets_org_id`: Quick org filtering
- `idx_pallets_location_id`: Find pallets by location
- `idx_pallets_status`: Filter by status (open, closed, shipped)
- `idx_pallets_created_at`: Timeline queries

---

### Table: pallet_items

```sql
CREATE TABLE pallet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  pallet_id UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  position_order INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  added_by_user_id UUID NOT NULL REFERENCES users(id),
  UNIQUE(pallet_id, lp_id) -- Prevent duplicate LPs in pallet
);
```

**Constraints:**
- `UNIQUE(pallet_id, lp_id)`: Each LP can only be on one pallet once
- `ON DELETE CASCADE`: Remove item when pallet deleted
- `position_order`: Track physical position on pallet (for loading order)

**Indexes:**
- `idx_pallet_items_org_id`: Org filtering
- `idx_pallet_items_pallet_id`: Items per pallet (critical)
- `idx_pallet_items_lp_id`: Find pallet for given LP

---

## API Endpoints

### GET /api/warehouse/pallets

**Description:** List pallets with filtering and pagination

**Query Parameters:**
- `status`: Filter by status (open, closed, shipped)
- `location_id`: Filter by location
- `warehouse_id`: Filter by warehouse
- `limit`: Pagination (default 50, max 200)
- `offset`: Pagination offset

**Response:** `200 OK`
```json
{
  "pallets": [
    {
      "id": "uuid",
      "pallet_number": "P-20250127-0001",
      "location_id": "uuid",
      "location_code": "WH-A-05",
      "location_name": "Storage Bin 5",
      "status": "open",
      "lp_count": 15,
      "total_quantity": 450.50,
      "total_uom": "kg",
      "notes": "Mixed goods shipment",
      "created_at": "2025-01-27T10:30:00Z",
      "created_by": "John Doe",
      "updated_at": "2025-01-27T14:15:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### POST /api/warehouse/pallets

**Description:** Create new pallet

**Request:**
```json
{
  "location_id": "uuid",
  "notes": "Customer order shipment"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "pallet_number": "P-20250127-0001",
  "location_id": "uuid",
  "status": "open",
  "lp_count": 0,
  "total_quantity": 0,
  "created_at": "2025-01-27T10:30:00Z",
  "created_by_user_id": "uuid"
}
```

---

### GET /api/warehouse/pallets/:id

**Description:** Get pallet details with items list

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "pallet_number": "P-20250127-0001",
  "location": {
    "id": "uuid",
    "code": "WH-A-05",
    "name": "Storage Bin 5"
  },
  "status": "open",
  "notes": "Mixed goods",
  "items": [
    {
      "id": "uuid",
      "lp_id": "uuid",
      "lp_number": "LP-20250125-0001",
      "product_id": "uuid",
      "product_name": "Steel Rods",
      "quantity": 50,
      "uom": "kg",
      "position_order": 1,
      "added_at": "2025-01-27T10:35:00Z",
      "added_by": "Jane Smith"
    }
  ],
  "summary": {
    "lp_count": 3,
    "total_quantity": 450.50,
    "total_uom": "kg",
    "estimated_weight": 500
  },
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": "2025-01-27T14:15:00Z"
}
```

---

### POST /api/warehouse/pallets/:id/items

**Description:** Add LP to pallet (Story 5.20)

**Request:**
```json
{
  "lp_id": "uuid",
  "position_order": 5
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "pallet_id": "uuid",
  "lp_id": "uuid",
  "position_order": 5,
  "added_at": "2025-01-27T10:40:00Z",
  "pallet_updated": {
    "lp_count": 4,
    "total_quantity": 500.50
  }
}
```

**Validation:**
- Pallet must exist and be `status='open'`
- LP must exist and belong to same org
- LP cannot already be on another pallet (check FK)
- LP location updated to pallet location (Story 5.20)

---

### DELETE /api/warehouse/pallets/:id/items/:item_id

**Description:** Remove LP from pallet (Story 5.20)

**Response:** `200 OK`
```json
{
  "removed": true,
  "lp_id": "uuid",
  "pallet_updated": {
    "lp_count": 3,
    "total_quantity": 450.50
  }
}
```

**Notes:**
- Only allowed if pallet `status='open'`
- LP location NOT changed (remains at pallet location)

---

### POST /api/warehouse/pallets/:id/move

**Description:** Move pallet to new location (Story 5.21)

**Request:**
```json
{
  "to_location_id": "uuid",
  "movement_type": "transfer"
}
```

**Response:** `200 OK`
```json
{
  "pallet_id": "uuid",
  "from_location": { "id": "uuid", "code": "WH-A-05" },
  "to_location": { "id": "uuid", "code": "WH-A-10" },
  "movement_type": "transfer",
  "stock_moves_created": 3,
  "moved_at": "2025-01-27T10:50:00Z"
}
```

**Logic:**
1. Validate pallet exists
2. Validate destination location
3. For each LP in pallet:
   - Update LP.location_id
   - Create stock_move record
4. Update pallet.location_id
5. Return all created stock_moves

---

### PUT /api/warehouse/pallets/:id/status

**Description:** Change pallet status (Story 5.22)

**Request:**
```json
{
  "status": "closed"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "pallet_number": "P-20250127-0001",
  "status": "closed",
  "updated_at": "2025-01-27T15:00:00Z"
}
```

**Validation:**
- `status` must be one of: 'open', 'closed', 'shipped'
- Transitions: open → closed/shipped, closed → shipped, shipped → (no change)
- If closing: cannot add/remove items afterward
- If marking shipped: set `shipped_at` timestamp

---

### PUT /api/warehouse/pallets/:id/update

**Description:** Update pallet notes (Story 5.22)

**Request:**
```json
{
  "notes": "Updated notes for customer order"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "notes": "Updated notes for customer order",
  "updated_at": "2025-01-27T15:00:00Z"
}
```

---

## SQL Queries

### Get Pallet with Items Summary

```sql
SELECT
  p.id, p.pallet_number, p.location_id, l.code as location_code,
  p.status, p.notes,
  COUNT(pi.id) as lp_count,
  SUM(lp.quantity) as total_quantity, lp.uom
FROM pallets p
LEFT JOIN pallet_items pi ON p.id = pi.pallet_id
LEFT JOIN license_plates lp ON pi.lp_id = lp.id
LEFT JOIN locations l ON p.location_id = l.id
WHERE p.id = $1 AND p.org_id = $2
GROUP BY p.id, l.code, lp.uom
```

### Get All Pallet Items Ordered

```sql
SELECT
  pi.id, pi.position_order,
  lp.id as lp_id, lp.lp_number, lp.quantity, lp.uom,
  lp.product_id,
  pi.added_at, pi.added_by_user_id
FROM pallet_items pi
JOIN license_plates lp ON pi.lp_id = lp.id
WHERE pi.pallet_id = $1
ORDER BY pi.position_order ASC
```

### Check LP Already on Pallet

```sql
SELECT pi.pallet_id
FROM pallet_items pi
WHERE pi.lp_id = $1 AND pi.org_id = $2
LIMIT 1
```

### Get Pallets by Location with Item Count

```sql
SELECT
  p.id, p.pallet_number, p.status,
  COUNT(pi.id) as lp_count,
  MAX(pi.added_at) as last_updated
FROM pallets p
LEFT JOIN pallet_items pi ON p.id = pi.pallet_id
WHERE p.location_id = $1 AND p.org_id = $2
GROUP BY p.id
ORDER BY p.created_at DESC
```

---

## RLS Policies

### Pallets Table

```sql
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON pallets FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Enable insert for authenticated users"
  ON pallets FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Enable update for authenticated users"
  ON pallets FOR UPDATE
  TO authenticated
  USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));
```

### Pallet Items Table

```sql
ALTER TABLE pallet_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON pallet_items FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Enable insert for authenticated users"
  ON pallet_items FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Enable delete for authenticated users"
  ON pallet_items FOR DELETE
  TO authenticated
  USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));
```

---

## Components

### Pages
- `/warehouse/pallets`: List page with filter, create button, detail panel
- `/warehouse/pallets/:id`: Detail page showing items, move, status change, notes edit

### Modals
- **CreatePalletModal**: Select location, enter notes
- **PalletMoveModal**: Select destination location, verify items
- **AddLPToPalletModal**: Search/select LP, position order
- **PalletStatusChangeModal**: Confirm status transition

### Cards
- **PalletCard**: Summary (number, status, LP count, location)
- **PalletItemCard**: LP details within pallet

### Hooks
- `usePallets()`: List pallets with filters
- `usePalletDetail(id)`: Get pallet and items
- `useCreatePallet()`: Create new pallet
- `useAddLPToPallet()`: Add LP to pallet
- `useRemoveLPFromPallet()`: Remove LP
- `useMovePallet()`: Move pallet + all LPs
- `usePalletStatusChange()`: Change status

---

## Pallet Numbering

**Format:** `P-YYYYMMDD-NNNN`
- `P`: Fixed prefix
- `YYYYMMDD`: Date of creation
- `NNNN`: Sequential daily counter (0001-9999)
- **Daily reset**: Sequence resets at midnight per timezone

**Example:** `P-20250127-0001`, `P-20250127-0002`

**Table:** `pallet_number_sequence`
```sql
CREATE TABLE pallet_number_sequence (
  org_id UUID NOT NULL REFERENCES organizations(id),
  sequence_date DATE NOT NULL,
  next_sequence INTEGER DEFAULT 1,
  PRIMARY KEY (org_id, sequence_date)
);
```

---

## Key Behaviors

### Pallet Creation (Story 5.19)
- Auto-generates `pallet_number` (P-YYYYMMDD-NNNN)
- Requires `location_id` (validates location exists)
- Default `status='open'`
- Can add notes
- Records `created_by_user_id`

### Add/Remove LP (Story 5.20)
- **Add**: LP assigned to pallet, LP.location_id updated to pallet location, position tracked
- **Remove**: LP unassigned, LP.location_id NOT changed
- Only allowed if pallet `status='open'`
- Prevents duplicate LPs on same pallet (UNIQUE constraint)
- Shows: LP count, total quantity, total UoM

### Pallet Move (Story 5.21)
- Moves entire pallet and all LPs together
- Creates stock_move for each LP (movement_type='transfer' or specified)
- Updates all LP.location_id
- Updates pallet.location_id
- Atomic operation (all succeed or all fail)

### Pallet Status (Story 5.22)
- **open**: Can add/remove LPs, default status on creation
- **closed**: Cannot modify contents, ready for shipping
- **shipped**: Final state, records `shipped_at` timestamp
- Transitions: open → closed/shipped, closed → shipped, shipped → (locked)

---

## Dependencies

**Story Dependencies:**
- 5.19 → 5.20 (need pallet to add items)
- 5.19 → 5.21 (need pallet to move)
- 5.19 → 5.22 (need pallet to change status)
- 5.21 → 5.14 (uses stock_moves from Story 5.14)

**Epic Dependencies:**
- Epic 1: Organizations, Users, Locations, Warehouses
- Epic 5: Story 5.1 (License Plates), Story 5.14 (Stock Moves)

---

## Performance Considerations

- **Index on location_id**: Filter pallets by location
- **Index on status**: Filter by open/closed/shipped
- **Composite index (pallet_id, position_order)**: Efficient item ordering
- **LEFT JOIN pallet_items for aggregates**: Summary queries
- **Pagination**: Always use limit/offset for list queries

---

## Notes

- Pallets are **not immutable** - they can be modified while `status='open'`
- Stock moves created during pallet move are **immutable** (audit trail)
- Each LP can only be on ONE pallet at a time (enforced by unique constraint on pallet_items)
- Pallet move is a **batch operation** - all LPs move together atomically
