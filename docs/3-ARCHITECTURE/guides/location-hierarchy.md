# Location Hierarchy Developer Guide

**Story:** 01.9 - Warehouse Locations Management
**Version:** 1.0
**Last Updated:** 2025-12-21

## Overview

This guide explains how to work with the hierarchical location system in MonoPilot. Locations are organized in a strict 4-level tree structure for precise inventory tracking within warehouses.

**Target Audience:** Frontend and backend developers implementing location-dependent features (inventory, receiving, shipping, etc.)

---

## Table of Contents

1. [Hierarchical Structure](#hierarchical-structure)
2. [Setup Instructions](#setup-instructions)
3. [Common Workflows](#common-workflows)
4. [Database Triggers](#database-triggers)
5. [API Integration](#api-integration)
6. [Frontend Integration](#frontend-integration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Hierarchical Structure

### 4-Level Hierarchy

```
Warehouse (WH-001)
 │
 └─ Zone (ZONE-A)           [level=zone, depth=1]
     │
     └─ Aisle (A01)         [level=aisle, depth=2]
         │
         └─ Rack (R01)      [level=rack, depth=3]
             │
             └─ Bin (B001)  [level=bin, depth=4]
```

### Level Rules

| Level | Parent Level | Can Have Children | Typical Use |
|-------|--------------|-------------------|-------------|
| **Zone** | None (root) | Yes (aisles) | Large storage area (e.g., "Raw Materials Zone") |
| **Aisle** | Zone | Yes (racks) | Physical aisle in warehouse |
| **Rack** | Aisle | Yes (bins) | Pallet rack or shelving unit |
| **Bin** | Rack | **No** (leaf) | Individual bin/position on rack |

### Auto-Computed Fields

#### 1. full_path

**Format:** `warehouse_code/zone_code/aisle_code/rack_code/bin_code`

**Example:** `WH-001/ZONE-A/A01/R01/B001`

**Computed by:** `compute_location_full_path()` database trigger (BEFORE INSERT/UPDATE)

**Use Cases:**
- Breadcrumb navigation
- Location search
- Inventory reports
- Label printing

#### 2. depth

**Values:** 1-4 (zone=1, aisle=2, rack=3, bin=4)

**Computed by:** Same trigger as full_path

**Use Cases:**
- Tree rendering indentation
- Level filtering
- Validation

---

## Setup Instructions

### 1. Database Migration

**Run migration:** Already applied in production (2025-12-20)

```bash
# Check if migrations are applied
psql -d monopilot -c "SELECT * FROM _migrations WHERE name LIKE '%locations%';"

# Expected output:
# 061_create_locations_table.sql
# 062_locations_rls_policies.sql
```

**Migration files:**
- `supabase/migrations/061_create_locations_table.sql` - Table, enums, triggers
- `supabase/migrations/062_locations_rls_policies.sql` - RLS policies

### 2. Verify Triggers

```sql
-- Check that triggers exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'locations';

-- Expected triggers:
-- trg_compute_location_path (BEFORE INSERT OR UPDATE)
-- trg_validate_location_hierarchy (BEFORE INSERT OR UPDATE)
-- update_locations_updated_at_trigger (BEFORE UPDATE)
```

### 3. Seed Test Data (Optional)

```sql
-- Create test location hierarchy
INSERT INTO locations (org_id, warehouse_id, code, name, level, location_type)
VALUES
  -- Zone
  ('your_org_id', 'your_warehouse_id', 'TEST-ZONE', 'Test Zone', 'zone', 'bulk'),
  -- Aisle (use zone id as parent_id)
  ('your_org_id', 'your_warehouse_id', 'TEST-A01', 'Test Aisle 01', 'aisle', 'pallet')
  -- ... continue for rack and bin
```

**Note:** `full_path` and `depth` will be auto-computed by triggers.

---

## Common Workflows

### Workflow 1: Create Zone

**Requirement:** Create a root-level storage zone.

**Steps:**

1. **Validate warehouse exists:**
   ```typescript
   const { data: warehouse } = await supabase
     .from('warehouses')
     .select('id, code')
     .eq('id', warehouseId)
     .single()

   if (!warehouse) throw new Error('Warehouse not found')
   ```

2. **Create zone:**
   ```typescript
   const { data: zone, error } = await supabase
     .from('locations')
     .insert({
       warehouse_id: warehouseId,
       parent_id: null,           // Root zone
       code: 'ZONE-A',
       name: 'Raw Materials Zone',
       level: 'zone',             // Must be 'zone' for root
       location_type: 'bulk',
       max_pallets: 200,
     })
     .select()
     .single()

   if (error) throw error
   ```

3. **Verify auto-computed fields:**
   ```typescript
   console.log(zone.full_path) // "WH-001/ZONE-A"
   console.log(zone.depth)     // 1
   ```

**cURL Example:**

```bash
curl -X POST "https://api.monopilot.com/api/settings/warehouses/wh_001/locations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ZONE-A",
    "name": "Raw Materials Zone",
    "level": "zone",
    "location_type": "bulk",
    "max_pallets": 200
  }'
```

---

### Workflow 2: Add Aisle Under Zone

**Requirement:** Create an aisle as a child of an existing zone.

**Steps:**

1. **Get parent zone ID:**
   ```typescript
   const { data: zone } = await supabase
     .from('locations')
     .select('id, level')
     .eq('code', 'ZONE-A')
     .eq('warehouse_id', warehouseId)
     .single()

   if (zone.level !== 'zone') {
     throw new Error('Parent must be a zone')
   }
   ```

2. **Create aisle:**
   ```typescript
   const { data: aisle, error } = await supabase
     .from('locations')
     .insert({
       warehouse_id: warehouseId,
       parent_id: zone.id,        // Zone ID
       code: 'A01',
       name: 'Aisle 01',
       level: 'aisle',            // Must be 'aisle' under zone
       location_type: 'pallet',
       max_pallets: 20,
     })
     .select()
     .single()

   if (error) throw error
   ```

3. **Verify auto-computed path:**
   ```typescript
   console.log(aisle.full_path) // "WH-001/ZONE-A/A01"
   console.log(aisle.depth)     // 2
   ```

**cURL Example:**

```bash
ZONE_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST "https://api.monopilot.com/api/settings/warehouses/wh_001/locations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"A01\",
    \"name\": \"Aisle 01\",
    \"parent_id\": \"$ZONE_ID\",
    \"level\": \"aisle\",
    \"location_type\": \"pallet\"
  }"
```

---

### Workflow 3: Create Full 4-Level Hierarchy

**Requirement:** Create zone → aisle → rack → bin in sequence.

**Steps:**

```typescript
// Step 1: Create zone
const { data: zone } = await supabase
  .from('locations')
  .insert({
    warehouse_id: warehouseId,
    code: 'ZONE-B',
    name: 'Finished Goods Zone',
    level: 'zone',
    location_type: 'pallet',
  })
  .select('id')
  .single()

// Step 2: Create aisle under zone
const { data: aisle } = await supabase
  .from('locations')
  .insert({
    warehouse_id: warehouseId,
    parent_id: zone.id,
    code: 'A01',
    name: 'Aisle 01',
    level: 'aisle',
    location_type: 'pallet',
  })
  .select('id')
  .single()

// Step 3: Create rack under aisle
const { data: rack } = await supabase
  .from('locations')
  .insert({
    warehouse_id: warehouseId,
    parent_id: aisle.id,
    code: 'R01',
    name: 'Rack 01',
    level: 'rack',
    location_type: 'shelf',
    max_pallets: 4,
  })
  .select('id')
  .single()

// Step 4: Create bin under rack
const { data: bin } = await supabase
  .from('locations')
  .insert({
    warehouse_id: warehouseId,
    parent_id: rack.id,
    code: 'B001',
    name: 'Bin 001',
    level: 'bin',
    location_type: 'shelf',
    max_pallets: 1,
  })
  .select()
  .single()

console.log(bin.full_path) // "WH-001/ZONE-B/A01/R01/B001"
console.log(bin.depth)      // 4
```

**Bash Script Example:**

```bash
#!/bin/bash
API="https://api.monopilot.com/api/settings/warehouses/wh_001/locations"
TOKEN="YOUR_TOKEN"

# Create zone
ZONE_ID=$(curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"ZONE-C","name":"Zone C","level":"zone"}' \
  | jq -r '.location.id')

# Create aisle
AISLE_ID=$(curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"A01\",\"name\":\"Aisle 01\",\"level\":\"aisle\",\"parent_id\":\"$ZONE_ID\"}" \
  | jq -r '.location.id')

# Create rack
RACK_ID=$(curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"R01\",\"name\":\"Rack 01\",\"level\":\"rack\",\"parent_id\":\"$AISLE_ID\"}" \
  | jq -r '.location.id')

# Create bin
curl -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"B001\",\"name\":\"Bin 001\",\"level\":\"bin\",\"parent_id\":\"$RACK_ID\"}"
```

---

### Workflow 4: Delete Locations (Bottom-Up)

**Requirement:** Delete a location hierarchy safely.

**Rules:**
- Must delete **bottom-up** (bins → racks → aisles → zones)
- Cannot delete parent with children
- Cannot delete location with inventory (enforced by warehouse module)

**Steps:**

```typescript
// Step 1: Get all descendants
const { data: descendants } = await supabase
  .from('locations')
  .select('id, level, code')
  .eq('warehouse_id', warehouseId)
  .like('full_path', `${zoneFullPath}%`)
  .order('depth', { ascending: false }) // Delete deepest first

// Step 2: Delete in reverse depth order (bins → racks → aisles → zone)
for (const location of descendants) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', location.id)

  if (error) {
    console.error(`Failed to delete ${location.code}:`, error.message)
    break
  }
}
```

**API Example:**

```bash
# Delete bin first
curl -X DELETE "https://api.monopilot.com/api/settings/warehouses/wh_001/locations/bin_id" \
  -H "Authorization: Bearer TOKEN"

# Then rack
curl -X DELETE ".../locations/rack_id" -H "Authorization: Bearer TOKEN"

# Then aisle
curl -X DELETE ".../locations/aisle_id" -H "Authorization: Bearer TOKEN"

# Finally zone
curl -X DELETE ".../locations/zone_id" -H "Authorization: Bearer TOKEN"
```

**Error Handling:**

```typescript
try {
  await deleteLocation(zoneId)
} catch (error) {
  if (error.message.includes('has children')) {
    toast.error('Delete child locations first (bottom-up)')
  } else if (error.message.includes('has inventory')) {
    toast.error('Relocate inventory before deleting')
  } else {
    toast.error('Failed to delete location')
  }
}
```

---

## Database Triggers

### 1. compute_location_full_path()

**Purpose:** Auto-computes `full_path` and `depth` on insert/update.

**Trigger Timing:** BEFORE INSERT OR UPDATE OF (parent_id, code)

**Logic:**

```sql
IF NEW.parent_id IS NULL THEN
  -- Root zone: full_path = warehouse_code/location_code
  SELECT code INTO v_warehouse_code FROM warehouses WHERE id = NEW.warehouse_id;
  NEW.full_path := v_warehouse_code || '/' || NEW.code;
  NEW.depth := 1;
ELSE
  -- Child location: full_path = parent_path/location_code
  SELECT full_path, depth INTO v_parent_path, v_parent_depth
  FROM locations WHERE id = NEW.parent_id;
  NEW.full_path := v_parent_path || '/' || NEW.code;
  NEW.depth := v_parent_depth + 1;
END IF;
```

**Test:**

```sql
-- Insert zone
INSERT INTO locations (warehouse_id, code, name, level)
VALUES ('wh_001', 'TEST-ZONE', 'Test Zone', 'zone');

-- Check auto-computed fields
SELECT code, full_path, depth FROM locations WHERE code = 'TEST-ZONE';
-- Expected: full_path = 'WH-001/TEST-ZONE', depth = 1
```

### 2. validate_location_hierarchy()

**Purpose:** Enforces level hierarchy rules (zone > aisle > rack > bin).

**Trigger Timing:** BEFORE INSERT OR UPDATE OF (parent_id, level)

**Logic:**

```sql
-- Root must be zone
IF NEW.parent_id IS NULL AND NEW.level != 'zone' THEN
  RAISE EXCEPTION 'Root locations must be zones';
END IF;

-- Parent-child level validation
SELECT level INTO v_parent_level FROM locations WHERE id = NEW.parent_id;

IF v_parent_level = 'zone' AND NEW.level != 'aisle' THEN
  RAISE EXCEPTION 'Locations under zones must be aisles';
ELSIF v_parent_level = 'aisle' AND NEW.level != 'rack' THEN
  RAISE EXCEPTION 'Locations under aisles must be racks';
ELSIF v_parent_level = 'rack' AND NEW.level != 'bin' THEN
  RAISE EXCEPTION 'Locations under racks must be bins';
ELSIF v_parent_level = 'bin' THEN
  RAISE EXCEPTION 'Bins cannot have child locations';
END IF;
```

**Test:**

```sql
-- Try to create bin under zone (should fail)
INSERT INTO locations (warehouse_id, parent_id, code, name, level)
VALUES ('wh_001', 'zone_id', 'BAD-BIN', 'Bad Bin', 'bin');
-- ERROR: Locations under zones must be aisles

-- Try to create aisle under zone (should succeed)
INSERT INTO locations (warehouse_id, parent_id, code, name, level)
VALUES ('wh_001', 'zone_id', 'A01', 'Aisle 01', 'aisle');
-- SUCCESS
```

---

## API Integration

### Using the Locations API

**Base URL:** `/api/settings/warehouses/:warehouseId/locations`

#### 1. List Locations (Tree View)

```typescript
import { LocationNode } from '@/lib/types/location'

async function fetchLocationTree(warehouseId: string): Promise<LocationNode[]> {
  const response = await fetch(
    `/api/settings/warehouses/${warehouseId}/locations?view=tree&include_capacity=true`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch locations')
  }

  const { locations } = await response.json()
  return locations
}
```

#### 2. Create Location

```typescript
import { CreateLocationInput } from '@/lib/validation/location-schemas'

async function createLocation(
  warehouseId: string,
  data: CreateLocationInput
): Promise<Location> {
  const response = await fetch(
    `/api/settings/warehouses/${warehouseId}/locations`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }

  const { location } = await response.json()
  return location
}
```

#### 3. Update Location

```typescript
async function updateLocation(
  warehouseId: string,
  locationId: string,
  data: UpdateLocationInput
): Promise<Location> {
  const response = await fetch(
    `/api/settings/warehouses/${warehouseId}/locations/${locationId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }

  const { location } = await response.json()
  return location
}
```

#### 4. Delete Location

```typescript
async function deleteLocation(
  warehouseId: string,
  locationId: string
): Promise<void> {
  const response = await fetch(
    `/api/settings/warehouses/${warehouseId}/locations/${locationId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }
}
```

---

## Frontend Integration

### Using Hooks

#### 1. Fetch and Display Tree

```tsx
import { useLocationTree } from '@/lib/hooks/use-location-tree'
import { LocationTree } from '@/components/settings/locations/LocationTree'

function LocationsPage({ warehouseId }: { warehouseId: string }) {
  const { locations, loading, error, expandedIds, toggleExpand } =
    useLocationTree(warehouseId)

  if (loading) return <Skeleton />
  if (error) return <ErrorAlert error={error} />

  return (
    <LocationTree
      warehouseId={warehouseId}
      locations={locations}
      expandedIds={expandedIds}
      onExpand={toggleExpand}
    />
  )
}
```

#### 2. Create Location with Modal

```tsx
import { LocationModal } from '@/components/settings/locations/LocationModal'
import { useCreateLocation } from '@/lib/hooks/use-create-location'

function CreateLocationButton({ warehouseId }: { warehouseId: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { createLocation } = useCreateLocation(warehouseId)

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Create Zone</Button>

      <LocationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        warehouseId={warehouseId}
        onSuccess={() => {
          setModalOpen(false)
          toast.success('Location created successfully')
        }}
      />
    </>
  )
}
```

#### 3. Delete Location with Confirmation

```tsx
import { useDeleteLocation } from '@/lib/hooks/use-delete-location'

function DeleteLocationButton({
  warehouseId,
  locationId
}: {
  warehouseId: string
  locationId: string
}) {
  const { deleteLocation, canDelete } = useDeleteLocation(warehouseId)

  const handleDelete = async () => {
    // Check if deletion is allowed
    const { can, reason, count } = await canDelete(locationId)

    if (!can) {
      if (reason === 'HAS_CHILDREN') {
        toast.error(`Cannot delete - location has ${count} children`)
        return
      }
      if (reason === 'HAS_INVENTORY') {
        toast.error(`Cannot delete - location has ${count} inventory items`)
        return
      }
    }

    // Confirm deletion
    const confirmed = window.confirm('Delete this location?')
    if (!confirmed) return

    // Delete
    try {
      await deleteLocation(locationId)
      toast.success('Location deleted')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return <Button variant="destructive" onClick={handleDelete}>Delete</Button>
}
```

---

## Troubleshooting

### Issue 1: "Root locations must be zones" Error

**Symptom:**
```
ERROR: Root locations must be zones (level=zone)
```

**Cause:** Attempting to create aisle/rack/bin without parent_id.

**Solution:** Set `level: 'zone'` when `parent_id` is null.

```typescript
// Wrong
{ parent_id: null, level: 'aisle' }  // ❌ Error

// Correct
{ parent_id: null, level: 'zone' }   // ✅ OK
```

---

### Issue 2: "Locations under zones must be aisles" Error

**Symptom:**
```
ERROR: Locations under zones must be aisles (level=aisle)
```

**Cause:** Attempting to create wrong level under parent (e.g., bin under zone).

**Solution:** Follow hierarchy: zone → aisle → rack → bin.

```typescript
// Wrong
{ parent_id: zone_id, level: 'bin' }   // ❌ Error (skip aisle/rack)

// Correct
{ parent_id: zone_id, level: 'aisle' } // ✅ OK
```

---

### Issue 3: "Bins cannot have child locations" Error

**Symptom:**
```
ERROR: Bins cannot have child locations
```

**Cause:** Attempting to create location under a bin.

**Solution:** Bins are leaf nodes. Cannot have children.

```typescript
// Wrong
{ parent_id: bin_id, level: 'anything' } // ❌ Error

// Correct: Create sibling bin instead
{ parent_id: rack_id, level: 'bin' }     // ✅ OK
```

---

### Issue 4: Cannot Delete Location with Children

**Symptom:**
```
400 Bad Request: Cannot delete - location has 5 children
```

**Cause:** Attempting to delete parent before children.

**Solution:** Delete **bottom-up** (bins → racks → aisles → zones).

```typescript
// Wrong order
await deleteLocation(zoneId)   // ❌ Error if has aisles

// Correct order
await deleteLocation(binId)    // 1. Delete bins first
await deleteLocation(rackId)   // 2. Then racks
await deleteLocation(aisleId)  // 3. Then aisles
await deleteLocation(zoneId)   // 4. Finally zone
```

---

### Issue 5: full_path Not Updating After Code Change

**Symptom:** Changed location code but full_path still shows old code.

**Cause:** Trigger only updates on `parent_id` or `code` change. Update may not cascade to children.

**Solution:** Manually trigger path recalculation by updating parent_id:

```sql
-- Force path recalculation for all children
UPDATE locations
SET parent_id = parent_id
WHERE parent_id IN (SELECT id FROM locations WHERE code = 'ZONE-A');
```

**Better:** Application should prevent code changes after creation (immutable field).

---

## Best Practices

### 1. Immutable Fields

**Do not allow changing:** `code`, `level`, `parent_id` after creation.

```typescript
// Update schema omits immutable fields
export const updateLocationSchema = createLocationSchema
  .omit({ code: true, level: true, parent_id: true })
  .partial()
```

**Reason:** Changing these breaks tree integrity and references.

### 2. Code Naming Conventions

**Zones:** `ZONE-A`, `ZONE-B`, `RM-ZONE` (descriptive prefix)
**Aisles:** `A01`, `A02`, `A-NORTH` (short codes)
**Racks:** `R01`, `R02`, `RACK-01` (sequential)
**Bins:** `B001`, `B002`, `BIN-A1` (detailed)

**Why:** Consistent naming improves readability and sorting.

### 3. Capacity Planning

**Set capacity limits at lowest level (bins):**
```typescript
// Bin level
{ max_pallets: 1, max_weight_kg: 500 }

// Rack level (sum of bins)
{ max_pallets: 4, max_weight_kg: 2000 }

// Zone level (informational)
{ max_pallets: null } // No limit at zone
```

**Why:** Capacity enforcement happens at bin level. Higher levels are informational.

### 4. Type Selection

| Location Type | Best For | Example |
|---------------|----------|---------|
| `bulk` | Large open areas | Floor storage zones |
| `pallet` | Standard pallet racks | Most aisles and racks |
| `shelf` | Small item storage | Picking bins |
| `floor` | Floor markings | Staging areas |
| `staging` | Temporary storage | Receiving/shipping docks |

### 5. Validation Before Delete

**Always check:**
1. Location has no children
2. Location has no inventory (when warehouse module implemented)
3. User has Admin/Warehouse Manager role

```typescript
const canDelete = await checkCanDelete(locationId)
if (!canDelete.can) {
  showError(canDelete.reason)
  return
}
```

### 6. Search Optimization

**Use full_path for hierarchical search:**
```sql
-- Find all locations under ZONE-A
SELECT * FROM locations
WHERE full_path LIKE 'WH-001/ZONE-A/%'
```

**Index:** `full_path` column is indexed for fast searches.

### 7. Tree Rendering Performance

**For large trees (>500 locations):**
- Use lazy loading (load children on expand)
- Virtualize tree rows (react-window)
- Limit initial expansion depth to 2 levels

```typescript
// Load children only when expanded
const loadChildren = async (parentId: string) => {
  const response = await fetch(
    `/api/.../locations?parent_id=${parentId}&view=flat`
  )
  return response.json()
}
```

---

## Related Documentation

- **API Reference:** `docs/3-ARCHITECTURE/api/settings/locations.md`
- **Component Docs:** `docs/3-ARCHITECTURE/frontend/components/locations.md`
- **Database Schema:** `docs/3-ARCHITECTURE/database/migrations/locations-hierarchy.md`
- **Story Specification:** `docs/2-MANAGEMENT/epics/current/01-settings/01.9.locations-crud.md`

---

## Support

**Questions?** Contact:
- **Backend:** BACKEND-DEV agent
- **Frontend:** FRONTEND-DEV agent
- **Database:** ARCHITECT-AGENT

**Issue Tracker:** `docs/2-MANAGEMENT/epics/current/01-settings/issues/`

---

**Document Version:** 1.0
**Story:** 01.9
**Status:** Backend Complete, Frontend Pending
**Last Updated:** 2025-12-21
