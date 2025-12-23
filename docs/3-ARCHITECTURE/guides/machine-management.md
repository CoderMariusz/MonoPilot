# Machine Management Developer Guide

**Story**: 01.10 - Machines CRUD
**Module**: Settings
**Version**: 1.0.0
**Last Updated**: 2025-12-22

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Setup Instructions](#setup-instructions)
3. [Common Workflows](#common-workflows)
4. [Service Layer Methods](#service-layer-methods)
5. [API Integration](#api-integration)
6. [Frontend Integration](#frontend-integration)
7. [Error Handling](#error-handling)
8. [Business Rules](#business-rules)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

**5-Minute Integration** - Add machine management to your MonoPilot instance:

```bash
# 1. Verify migrations applied
psql -d monopilot -c "SELECT COUNT(*) FROM machines;"

# 2. Create a test machine via API
curl -X POST http://localhost:3000/api/v1/settings/machines \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST-001",
    "name": "Test Mixer",
    "type": "MIXER",
    "units_per_hour": 500
  }'

# 3. Visit machines page
open http://localhost:3000/settings/machines
```

---

## Setup Instructions

### 1. Database Setup

Verify migrations are applied:

```bash
# Check if machines table exists
psql -d monopilot -c "\d machines"

# Verify enums created
psql -d monopilot -c "\dT machine_type"
psql -d monopilot -c "\dT machine_status"

# Check RLS policies
psql -d monopilot -c "\dp machines"
```

Expected output:
```
Table "public.machines"
 Column             | Type              | Nullable
--------------------+-------------------+----------
 id                 | uuid              | not null
 org_id             | uuid              | not null
 code               | varchar(50)       | not null
 name               | varchar(100)      | not null
 type               | machine_type      | not null
 status             | machine_status    | not null
 ...
```

### 2. Seed Test Data (Optional)

```sql
-- Create sample machines for testing
INSERT INTO machines (org_id, code, name, type, status, units_per_hour, created_by, updated_by)
VALUES
  ((SELECT id FROM organizations LIMIT 1), 'MIX-001', 'Industrial Mixer A1', 'MIXER', 'ACTIVE', 500, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)),
  ((SELECT id FROM organizations LIMIT 1), 'OVN-001', 'Convection Oven #1', 'OVEN', 'ACTIVE', 200, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)),
  ((SELECT id FROM organizations LIMIT 1), 'PKG-001', 'Packaging Line 1', 'PACKAGING', 'MAINTENANCE', 1200, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)),
  ((SELECT id FROM organizations LIMIT 1), 'FIL-001', 'Bottle Filler', 'FILLER', 'ACTIVE', 800, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)),
  ((SELECT id FROM organizations LIMIT 1), 'CUT-001', 'Slicer Machine', 'CUTTER', 'OFFLINE', 300, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1));
```

### 3. Verify API Access

```bash
# List machines (should return empty array or seeded data)
curl http://localhost:3000/api/v1/settings/machines \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# {
#   "data": [...],
#   "pagination": { "page": 1, "limit": 25, "total": 5, "total_pages": 1 }
# }
```

---

## Common Workflows

### Workflow 1: Create a New Machine

**Backend (TypeScript)**:

```typescript
import { MachineService } from '@/lib/services/machine-service'

async function createMachine() {
  try {
    const machine = await MachineService.create({
      code: 'MIX-002',
      name: 'Planetary Mixer',
      description: 'High-capacity planetary mixer for dough',
      type: 'MIXER',
      status: 'ACTIVE',
      units_per_hour: 600,
      setup_time_minutes: 20,
      max_batch_size: 1500,
      location_id: 'loc-uuid-or-null',
    })

    console.log('Created machine:', machine.id)
    return machine
  } catch (error) {
    if (error.message.includes('unique')) {
      console.error('Machine code already exists')
    } else {
      console.error('Failed to create machine:', error)
    }
    throw error
  }
}
```

**Frontend (React)**:

```tsx
import { useState } from 'react'
import { MachineModal } from '@/components/settings/machines/MachineModal'
import { Button } from '@/components/ui/button'

export function MachinesPage() {
  const [modalOpen, setModalOpen] = useState(false)

  const handleSuccess = (machine) => {
    console.log('Machine created:', machine)
    // Refetch machine list
    refetch()
    setModalOpen(false)
  }

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Create Machine</Button>

      <MachineModal
        mode="create"
        machine={null}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
```

---

### Workflow 2: Search and Filter Machines

**API Call**:

```bash
# Search by code or name
curl "http://localhost:3000/api/v1/settings/machines?search=mixer" \
  -H "Authorization: Bearer TOKEN"

# Filter by type
curl "http://localhost:3000/api/v1/settings/machines?type=OVEN&status=ACTIVE" \
  -H "Authorization: Bearer TOKEN"

# Sort by name descending
curl "http://localhost:3000/api/v1/settings/machines?sortBy=name&sortOrder=desc" \
  -H "Authorization: Bearer TOKEN"
```

**Service Layer**:

```typescript
import { MachineService } from '@/lib/services/machine-service'

async function searchMachines() {
  const result = await MachineService.list({
    search: 'mixer',
    type: 'MIXER',
    status: 'ACTIVE',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 25,
  })

  console.log(`Found ${result.total} machines`)
  return result.machines
}
```

---

### Workflow 3: Update Machine Status

**Quick Status Update (PATCH endpoint)**:

```typescript
import { MachineService } from '@/lib/services/machine-service'

async function markForMaintenance(machineId: string) {
  const machine = await MachineService.updateStatus(machineId, 'MAINTENANCE')
  console.log(`Machine ${machine.code} marked for maintenance`)
  return machine
}

async function reactivateMachine(machineId: string) {
  const machine = await MachineService.updateStatus(machineId, 'ACTIVE')
  console.log(`Machine ${machine.code} reactivated`)
  return machine
}
```

**Full Update (PUT endpoint)**:

```typescript
async function updateMachine(machineId: string) {
  const machine = await MachineService.update(machineId, {
    name: 'Updated Mixer Name',
    units_per_hour: 650,
    setup_time_minutes: 18,
    status: 'ACTIVE',
  })
  return machine
}
```

---

### Workflow 4: Delete Machine with Validation

**Service Layer**:

```typescript
import { MachineService } from '@/lib/services/machine-service'

async function deleteMachine(machineId: string) {
  try {
    // Check if machine can be deleted
    const canDelete = await MachineService.canDelete(machineId)

    if (!canDelete.canDelete) {
      console.error('Cannot delete:', canDelete.reason)
      console.error('Assigned to lines:', canDelete.lineCodes)
      return false
    }

    // Perform delete (soft delete)
    await MachineService.delete(machineId)
    console.log('Machine deleted successfully')
    return true
  } catch (error) {
    console.error('Delete failed:', error.message)
    return false
  }
}
```

**Frontend (React)**:

```tsx
import { useState } from 'react'
import { AlertDialog } from '@/components/ui/alert-dialog'

export function DeleteMachineDialog({ machine, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/settings/machines/${machine.id}`, {
        method: 'DELETE',
      })

      if (response.status === 409) {
        const data = await response.json()
        setError(data.error) // "Machine is assigned to line [LINE-001]..."
        return
      }

      if (!response.ok) {
        throw new Error('Failed to delete machine')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {machine.code}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The machine will be soft-deleted and removed from the
            active list.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <div className="text-destructive">{error}</div>}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

### Workflow 5: Assign Machine to Location

**Service Layer**:

```typescript
async function assignMachineToLocation(machineId: string, locationId: string) {
  const machine = await MachineService.update(machineId, {
    location_id: locationId,
  })

  console.log(`Machine ${machine.code} assigned to location ${machine.location?.full_path}`)
  return machine
}

async function unassignMachine(machineId: string) {
  const machine = await MachineService.update(machineId, {
    location_id: null,
  })

  console.log(`Machine ${machine.code} unassigned from location`)
  return machine
}
```

---

### Workflow 6: Get Machine with Location Details

**Service Layer**:

```typescript
import { MachineService } from '@/lib/services/machine-service'

async function getMachineDetails(machineId: string) {
  const machine = await MachineService.getById(machineId)

  if (!machine) {
    console.error('Machine not found')
    return null
  }

  console.log('Machine:', machine.code, machine.name)
  console.log('Type:', machine.type)
  console.log('Status:', machine.status)

  if (machine.location) {
    console.log('Location:', machine.location.full_path)
    console.log('Warehouse:', machine.location.warehouse_id)
  } else {
    console.log('Location: Unassigned')
  }

  return machine
}
```

**API Call**:

```bash
curl "http://localhost:3000/api/v1/settings/machines/machine-uuid" \
  -H "Authorization: Bearer TOKEN"
```

Response includes joined location data:
```json
{
  "id": "...",
  "code": "MIX-001",
  "name": "Industrial Mixer A1",
  "location": {
    "id": "loc-uuid",
    "code": "B001",
    "name": "Bin 001",
    "full_path": "WH-001/ZONE-A/A01/R01/B001",
    "warehouse_id": "wh-uuid"
  }
}
```

---

## Service Layer Methods

### MachineService Class

Location: `apps/frontend/lib/services/machine-service.ts`

#### `list(params?: MachineListParams): Promise<PaginatedMachineResult>`

Fetch machines with pagination, filters, and search.

**Parameters**:
```typescript
{
  search?: string               // Search code/name
  type?: MachineType           // Filter by type
  status?: MachineStatus       // Filter by status
  location_id?: string         // Filter by location
  sortBy?: string              // Sort field
  sortOrder?: 'asc' | 'desc'   // Sort direction
  page?: number                // Page number (1-based)
  limit?: number               // Items per page
}
```

**Returns**:
```typescript
{
  machines: Machine[]
  total: number
  page: number
  limit: number
}
```

**Example**:
```typescript
const result = await MachineService.list({
  type: 'MIXER',
  status: 'ACTIVE',
  page: 1,
  limit: 25,
})
```

---

#### `getById(id: string): Promise<Machine | null>`

Get machine by ID with location details.

**Returns**: Machine object or null if not found

**Example**:
```typescript
const machine = await MachineService.getById('machine-uuid')
if (!machine) {
  console.error('Machine not found')
}
```

---

#### `create(data: CreateMachineInput): Promise<Machine>`

Create new machine.

**Parameters**:
```typescript
{
  code: string                    // Required, uppercase alphanumeric + hyphens
  name: string                    // Required
  description?: string            // Optional
  type: MachineType               // Required
  status?: MachineStatus          // Optional, default: ACTIVE
  units_per_hour?: number         // Optional
  setup_time_minutes?: number     // Optional
  max_batch_size?: number         // Optional
  location_id?: string            // Optional
}
```

**Throws**:
- `Error('Unauthorized')` - No authenticated user
- `Error('Machine code must be unique')` - Duplicate code
- `Error('Failed to create machine')` - Database error

**Example**:
```typescript
const machine = await MachineService.create({
  code: 'MIX-003',
  name: 'New Mixer',
  type: 'MIXER',
  units_per_hour: 500,
})
```

---

#### `update(id: string, data: UpdateMachineInput): Promise<Machine>`

Update existing machine.

**Parameters**:
```typescript
{
  code?: string                   // Optional, must be unique
  name?: string                   // Optional
  description?: string            // Optional
  type?: MachineType              // Optional
  status?: MachineStatus          // Optional
  units_per_hour?: number         // Optional
  setup_time_minutes?: number     // Optional
  max_batch_size?: number         // Optional
  location_id?: string            // Optional
}
```

**Throws**:
- `Error('Machine not found')` - Machine doesn't exist
- `Error('Machine code must be unique')` - Duplicate code
- `Error('Failed to update machine')` - Database error

**Example**:
```typescript
const machine = await MachineService.update('machine-uuid', {
  name: 'Updated Name',
  units_per_hour: 600,
})
```

---

#### `updateStatus(id: string, status: MachineStatus): Promise<Machine>`

Quick status update (without full update).

**Parameters**:
- `id`: Machine UUID
- `status`: One of `ACTIVE`, `MAINTENANCE`, `OFFLINE`, `DECOMMISSIONED`

**Example**:
```typescript
const machine = await MachineService.updateStatus('machine-uuid', 'MAINTENANCE')
```

---

#### `delete(id: string): Promise<void>`

Delete machine (soft delete).

**Business Rules**:
- Cannot delete if assigned to production line
- Always performs soft delete (sets `is_deleted = true`)

**Throws**:
- `Error('Machine not found')` - Machine doesn't exist
- `Error('Machine is assigned to line [LINE-001]...')` - Line assignment exists
- `Error('Failed to delete machine')` - Database error

**Example**:
```typescript
try {
  await MachineService.delete('machine-uuid')
  console.log('Deleted successfully')
} catch (error) {
  if (error.message.includes('assigned to line')) {
    console.error('Cannot delete: machine in use')
  }
}
```

---

#### `isCodeUnique(code: string, excludeId?: string): Promise<boolean>`

Check if machine code is available.

**Parameters**:
- `code`: Code to check (case-insensitive)
- `excludeId`: Machine ID to exclude (for edit mode)

**Returns**: `true` if available, `false` if taken

**Example**:
```typescript
const isAvailable = await MachineService.isCodeUnique('MIX-004')
if (!isAvailable) {
  console.error('Code already exists')
}

// Edit mode: exclude current machine
const canUpdate = await MachineService.isCodeUnique('MIX-004', 'current-machine-uuid')
```

---

#### `canDelete(id: string): Promise<CanDeleteMachineResult>`

Check if machine can be deleted.

**Returns**:
```typescript
{
  canDelete: boolean
  reason?: string              // Error message if canDelete = false
  lineCodes?: string[]         // Assigned line codes
}
```

**Example**:
```typescript
const result = await MachineService.canDelete('machine-uuid')
if (!result.canDelete) {
  console.error('Cannot delete:', result.reason)
  console.error('Assigned to lines:', result.lineCodes)
}
```

---

#### `getLocationPath(machine: Machine): string`

Build hierarchical location path from machine location.

**Returns**: Full path string or empty string if no location

**Example**:
```typescript
const path = MachineService.getLocationPath(machine)
// Returns: "WH-001/ZONE-A/A01/R01/B001" or ""
```

---

## API Integration

### TypeScript/JavaScript

```typescript
// Fetch machines
const response = await fetch('/api/v1/settings/machines?type=MIXER&status=ACTIVE', {
  headers: { Authorization: `Bearer ${token}` },
})
const { data, pagination } = await response.json()

// Create machine
const createResponse = await fetch('/api/v1/settings/machines', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: 'MIX-002',
    name: 'Planetary Mixer',
    type: 'MIXER',
    units_per_hour: 600,
  }),
})
const machine = await createResponse.json()

// Update machine
await fetch(`/api/v1/settings/machines/${machineId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Updated Name' }),
})

// Delete machine
const deleteResponse = await fetch(`/api/v1/settings/machines/${machineId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` },
})

if (deleteResponse.status === 409) {
  const error = await deleteResponse.json()
  console.error('Cannot delete:', error.error)
}
```

---

## Frontend Integration

### Using MachineService

```tsx
import { MachineService } from '@/lib/services/machine-service'
import { useState, useEffect } from 'react'

export function MachinesPage() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const result = await MachineService.list({ page: 1, limit: 25 })
        setMachines(result.machines)
      } catch (error) {
        console.error('Failed to load machines:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMachines()
  }, [])

  if (loading) return <div>Loading...</div>

  return <div>{/* Render machines */}</div>
}
```

### Using Components

```tsx
import { MachinesDataTable } from '@/components/settings/machines/MachinesDataTable'
import { MachineModal } from '@/components/settings/machines/MachineModal'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function MachinesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [machines, setMachines] = useState([])

  const handleEdit = (machine) => {
    setSelectedMachine(machine)
    setModalOpen(true)
  }

  const handleDelete = async (machine) => {
    if (confirm(`Delete ${machine.code}?`)) {
      try {
        await MachineService.delete(machine.id)
        // Refresh list
        loadMachines()
      } catch (error) {
        alert(error.message)
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>Machines</h1>
        <Button onClick={() => setModalOpen(true)}>Create Machine</Button>
      </div>

      <MachinesDataTable
        machines={machines}
        total={machines.length}
        page={1}
        limit={25}
        onPageChange={() => {}}
        onSearch={() => {}}
        onFilter={() => {}}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MachineModal
        mode={selectedMachine ? 'edit' : 'create'}
        machine={selectedMachine}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedMachine(null)
        }}
        onSuccess={() => {
          loadMachines()
          setModalOpen(false)
        }}
      />
    </div>
  )
}
```

---

## Error Handling

### Common Errors and Solutions

#### 1. "Machine code must be unique"

**Cause**: Attempting to create/update with duplicate code

**Solution**:
```typescript
try {
  await MachineService.create({ code: 'MIX-001', ... })
} catch (error) {
  if (error.message.includes('unique')) {
    // Show user-friendly error
    alert('Machine code already exists. Please use a different code.')
  }
}
```

#### 2. "Machine is assigned to line [LINE-001]"

**Cause**: Attempting to delete machine assigned to production line

**Solution**:
```typescript
const canDelete = await MachineService.canDelete(machineId)
if (!canDelete.canDelete) {
  alert(`Cannot delete: ${canDelete.reason}`)
  console.log('Assigned to lines:', canDelete.lineCodes)
}
```

#### 3. "Machine not found" (404)

**Cause**: Machine doesn't exist or belongs to different organization

**Solution**:
```typescript
const machine = await MachineService.getById(machineId)
if (!machine) {
  console.error('Machine not found or access denied')
  // Redirect to machines list
  router.push('/settings/machines')
}
```

#### 4. "Insufficient permissions" (403)

**Cause**: User role doesn't have write access (VIEWER, WAREHOUSE_MANAGER)

**Solution**:
```typescript
// Check permissions before showing create/edit buttons
const canManage = ['SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER'].includes(userRole)

<MachinesDataTable
  machines={machines}
  readOnly={!canManage}  // Hides action buttons
  onEdit={canManage ? handleEdit : undefined}
  onDelete={canManage ? handleDelete : undefined}
/>
```

---

## Business Rules

### 1. Code Uniqueness

- Machine codes must be unique per organization
- Codes are case-insensitive (auto-uppercase on blur)
- Format: Uppercase alphanumeric + hyphens only (`^[A-Z0-9-]+$`)
- Max length: 50 characters

### 2. Soft Delete

- All deletes are soft deletes (sets `is_deleted = true`, `deleted_at = timestamp`)
- Preserves audit trail for historical work order references
- Soft-deleted machines excluded from list queries

### 3. Line Assignment Validation

- Cannot delete machine if assigned to production line (Story 01.11)
- Must remove from all lines before deletion
- Error message lists all assigned line codes

### 4. Status Workflow

Recommended status transitions:
- `ACTIVE` → `MAINTENANCE` (scheduled maintenance)
- `MAINTENANCE` → `ACTIVE` (maintenance complete)
- `ACTIVE` → `OFFLINE` (unexpected downtime)
- `OFFLINE` → `ACTIVE` (repaired)
- `ACTIVE`/`MAINTENANCE`/`OFFLINE` → `DECOMMISSIONED` (permanent removal)

### 5. Capacity Fields

All capacity fields are optional:
- `units_per_hour`: Production rate (integer > 0)
- `setup_time_minutes`: Setup time (integer >= 0)
- `max_batch_size`: Max batch (integer > 0)

---

## Best Practices

### 1. Code Naming Convention

Use consistent prefixes for machine types:
- `MIX-###` - Mixers
- `OVN-###` - Ovens
- `FIL-###` - Fillers
- `PKG-###` - Packaging
- `CNV-###` - Conveyors
- `BLD-###` - Blenders
- `CUT-###` - Cutters
- `LBL-###` - Labelers

Example: `MIX-001`, `OVN-A12`, `PKG-LINE1`

### 2. Status Management

- Always use `PATCH /status` endpoint for status-only updates (faster)
- Use `PUT` for full machine updates (name, capacity, location)
- Document reason for OFFLINE/DECOMMISSIONED status in description field

### 3. Location Assignment

- Assign machines to deepest level (bins) for precise tracking
- Update location when physically moving equipment
- Unassign before decommissioning

### 4. Error Handling

- Always check `canDelete()` before deletion
- Handle unique constraint violations gracefully
- Provide user-friendly error messages

### 5. Performance

- Use pagination for large machine lists (>100 machines)
- Debounce search input (300ms)
- Cache machine list on frontend with auto-refetch

---

## Troubleshooting

### Issue 1: Code validation not working

**Symptom**: "Code already exists" error after validation showed available

**Cause**: Race condition between validation and submit

**Solution**:
```typescript
// Wait for validation to complete before submit
if (codeValidating) {
  alert('Please wait for code validation to complete')
  return
}

if (codeAvailable === false) {
  setErrors({ code: 'Code already exists' })
  return
}
```

---

### Issue 2: Machine not appearing in list after creation

**Symptom**: Created machine doesn't show in list

**Cause**: Machine created in different organization (RLS filtering)

**Solution**:
```sql
-- Verify machine org_id matches user org_id
SELECT m.id, m.code, m.org_id, u.org_id AS user_org_id
FROM machines m
CROSS JOIN users u
WHERE u.id = auth.uid()
  AND m.code = 'YOUR-CODE';
```

---

### Issue 3: Cannot delete machine without line assignment

**Symptom**: Delete fails even though machine not assigned to lines

**Cause**: `production_line_machines` table doesn't exist yet (Story 01.11)

**Solution**: This is expected behavior. Table will be created in Story 01.11. For now, all machines can be deleted.

---

### Issue 4: Location dropdown empty

**Symptom**: Location select shows no options

**Cause**: No locations created yet, or API fetch failed

**Solution**:
```bash
# Verify locations exist
curl http://localhost:3000/api/v1/settings/locations?view=flat \
  -H "Authorization: Bearer TOKEN"

# Create test location if needed
curl -X POST http://localhost:3000/api/settings/warehouses/WAREHOUSE_ID/locations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"ZONE-A","name":"Zone A","level":"zone","location_type":"bulk"}'
```

---

### Issue 5: Status update not reflecting in UI

**Symptom**: Status badge doesn't update after status change

**Cause**: Frontend cache not invalidated

**Solution**:
```typescript
// Refetch machine list after status update
const handleStatusChange = async (machineId, newStatus) => {
  await MachineService.updateStatus(machineId, newStatus)
  // Invalidate cache and refetch
  queryClient.invalidateQueries(['machines'])
  // OR manually refresh
  loadMachines()
}
```

---

## Related Documentation

- [Machines API Documentation](../../api/settings/machines.md)
- [Machine Component Documentation](../../frontend/components/machines.md)
- [Database Schema - Machines Table](../../database/migrations/machines.md)
- [Story 01.10 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.10.machines-crud.md)

---

**Document Version**: 1.0.0
**Story**: 01.10
**Status**: Complete
**Last Updated**: 2025-12-22
