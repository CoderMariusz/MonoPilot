# Warehouse Management Developer Guide

**Story**: 01.8 - Warehouses CRUD
**Module**: Settings
**Version**: 1.0.0
**Last Updated**: 2025-12-20

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Setup Instructions](#setup-instructions)
3. [Common Workflows](#common-workflows)
4. [Code Examples](#code-examples)
5. [Business Rules](#business-rules)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Topics](#advanced-topics)

---

## Quick Start

### 5-Minute Integration

Add warehouse management to your page in 5 minutes:

```typescript
// app/(authenticated)/settings/warehouses/page.tsx
'use client'

import { WarehousesDataTable } from '@/components/settings/warehouses/WarehousesDataTable'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { WarehouseService } from '@/lib/services/warehouse-service'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export default function WarehousesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const { toast } = useToast()

  const { data, isLoading, error } = useWarehouses({
    page,
    limit: 20,
    search,
    ...filters,
  })

  const handleSetDefault = async (warehouse) => {
    try {
      await WarehouseService.setDefault(warehouse.id)
      toast({ title: 'Default warehouse updated' })
      // Trigger refetch
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Warehouses</h1>

      <WarehousesDataTable
        warehouses={data?.data || []}
        total={data?.pagination.total || 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={setSearch}
        onFilter={setFilters}
        onEdit={() => {}}
        onSetDefault={handleSetDefault}
        onDisable={() => {}}
        onEnable={() => {}}
        isLoading={isLoading}
        error={error?.message}
      />
    </div>
  )
}
```

---

## Setup Instructions

### Step 1: Database Migration

Ensure warehouse migrations are applied:

```bash
# Check migration status
supabase migration list

# Apply migrations (if not already applied)
supabase migration up
```

**Required Migrations**:
- `065_create_warehouses_table.sql` - Creates warehouses table
- `066_warehouses_rls_policies.sql` - Creates RLS policies

### Step 2: Verify RLS Policies

Test that RLS policies are working:

```sql
-- In Supabase SQL Editor (as authenticated user)
SELECT * FROM warehouses;  -- Should only return your org's warehouses

-- As different org user
SELECT * FROM warehouses WHERE org_id = '<other-org-id>';  -- Should return empty
```

### Step 3: Seed Test Data (Optional)

Create sample warehouses for testing:

```sql
-- Insert test warehouses (replace <your-org-id> and <your-user-id>)
INSERT INTO warehouses (org_id, code, name, type, is_default, is_active, created_by, updated_by)
VALUES
  ('<your-org-id>', 'WH-001', 'Main Warehouse', 'GENERAL', true, true, '<your-user-id>', '<your-user-id>'),
  ('<your-org-id>', 'WH-RAW', 'Raw Materials', 'RAW_MATERIALS', false, true, '<your-user-id>', '<your-user-id>'),
  ('<your-org-id>', 'WH-FG', 'Finished Goods', 'FINISHED_GOODS', false, true, '<your-user-id>', '<your-user-id>');
```

### Step 4: Install Dependencies

All dependencies should already be installed, but verify:

```bash
# Check package.json includes:
# - @radix-ui/react-dropdown-menu
# - @radix-ui/react-dialog
# - lucide-react
# - zod

pnpm install
```

### Step 5: Test API Endpoints

Test endpoints work correctly:

```bash
# List warehouses
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/settings/warehouses

# Create warehouse
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "WH-TEST", "name": "Test Warehouse", "type": "GENERAL"}' \
  http://localhost:3000/api/v1/settings/warehouses
```

---

## Common Workflows

### Workflow 1: Display Warehouse List

```typescript
import { useWarehouses } from '@/lib/hooks/use-warehouses'

function WarehouseList() {
  const { data, isLoading, error } = useWarehouses({
    page: 1,
    limit: 20,
    status: 'active',
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {data?.data.map(warehouse => (
        <li key={warehouse.id}>
          {warehouse.code} - {warehouse.name}
          {warehouse.is_default && <span> (Default)</span>}
        </li>
      ))}
    </ul>
  )
}
```

### Workflow 2: Create New Warehouse

```typescript
import { WarehouseService } from '@/lib/services/warehouse-service'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function CreateWarehouseForm() {
  const form = useForm({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'GENERAL',
      address: null,
      contact_email: null,
      contact_phone: null,
      is_active: true,
    },
  })

  const onSubmit = async (data) => {
    try {
      const warehouse = await WarehouseService.create(data)
      console.log('Created:', warehouse)
      // Show success toast, redirect, etc.
    } catch (error) {
      console.error('Create failed:', error)
      // Show error toast
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('code')} placeholder="Code" />
      {form.formState.errors.code && <p>{form.formState.errors.code.message}</p>}

      <input {...form.register('name')} placeholder="Name" />
      {form.formState.errors.name && <p>{form.formState.errors.name.message}</p>}

      <select {...form.register('type')}>
        <option value="GENERAL">General</option>
        <option value="RAW_MATERIALS">Raw Materials</option>
        <option value="WIP">WIP</option>
        <option value="FINISHED_GOODS">Finished Goods</option>
        <option value="QUARANTINE">Quarantine</option>
      </select>

      <button type="submit">Create Warehouse</button>
    </form>
  )
}
```

### Workflow 3: Update Warehouse

```typescript
import { WarehouseService } from '@/lib/services/warehouse-service'

async function updateWarehouse(id: string) {
  try {
    // Check if code can be changed
    const warehouse = await WarehouseService.getById(id)
    const hasInventory = await WarehouseService.hasActiveInventory(id)

    if (hasInventory) {
      console.log('Cannot change code - warehouse has active inventory')
      // Disable code field in form
    }

    // Update warehouse
    const updated = await WarehouseService.update(id, {
      name: 'Updated Name',
      address: 'New Address',
      contact_email: 'new-email@example.com',
    })

    console.log('Updated:', updated)
  } catch (error) {
    console.error('Update failed:', error)
  }
}
```

### Workflow 4: Set Default Warehouse

```typescript
import { WarehouseService } from '@/lib/services/warehouse-service'
import { useToast } from '@/components/ui/use-toast'

function SetDefaultButton({ warehouse }) {
  const { toast } = useToast()

  const handleSetDefault = async () => {
    if (warehouse.is_default) {
      toast({ title: 'Already default warehouse' })
      return
    }

    try {
      await WarehouseService.setDefault(warehouse.id)
      toast({ title: `${warehouse.code} is now the default warehouse` })
      // Trigger refetch to update UI
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <button onClick={handleSetDefault} disabled={warehouse.is_default}>
      {warehouse.is_default ? 'Default' : 'Set as Default'}
    </button>
  )
}
```

### Workflow 5: Disable Warehouse with Business Rules

```typescript
import { WarehouseService } from '@/lib/services/warehouse-service'
import { useToast } from '@/components/ui/use-toast'

function DisableWarehouseButton({ warehouse }) {
  const { toast } = useToast()

  const handleDisable = async () => {
    // Step 1: Check if can disable
    const canDisable = await WarehouseService.canDisable(warehouse.id)

    if (!canDisable.allowed) {
      toast({
        title: 'Cannot Disable Warehouse',
        description: canDisable.reason,
        variant: 'destructive',
      })
      return
    }

    // Step 2: Show confirmation dialog
    const confirmed = window.confirm(`Disable warehouse ${warehouse.code}?`)
    if (!confirmed) return

    // Step 3: Disable warehouse
    try {
      await WarehouseService.disable(warehouse.id)
      toast({ title: 'Warehouse disabled' })
      // Trigger refetch
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <button onClick={handleDisable} disabled={!warehouse.is_active}>
      Disable
    </button>
  )
}
```

### Workflow 6: Real-time Code Validation

```typescript
import { WarehouseService } from '@/lib/services/warehouse-service'
import { useState, useEffect } from 'react'
import { debounce } from 'lodash'

function WarehouseCodeInput({ mode, warehouseId, value, onChange }) {
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const validateCode = debounce(async (code: string) => {
    if (code.length < 2) return

    setIsValidating(true)
    try {
      const result = await WarehouseService.validateCode(
        code,
        mode === 'edit' ? warehouseId : undefined
      )

      if (!result.available) {
        setError('Code already exists')
      } else {
        setError('')
      }
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setIsValidating(false)
    }
  }, 500)

  useEffect(() => {
    if (value) {
      validateCode(value)
    }
  }, [value])

  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="WH-001"
      />
      {isValidating && <p>Validating...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
```

---

## Code Examples

### Example 1: Full CRUD Component

```typescript
'use client'

import { useState } from 'react'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { WarehouseService } from '@/lib/services/warehouse-service'
import { WarehousesDataTable } from '@/components/settings/warehouses/WarehousesDataTable'
import { WarehouseModal } from '@/components/settings/warehouses/WarehouseModal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function WarehousesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const { toast } = useToast()

  const { data, isLoading, error, refetch } = useWarehouses({
    page,
    limit: 20,
    search,
    ...filters,
  })

  const handleCreate = () => {
    setModalMode('create')
    setSelectedWarehouse(null)
    setModalOpen(true)
  }

  const handleEdit = (warehouse) => {
    setModalMode('edit')
    setSelectedWarehouse(warehouse)
    setModalOpen(true)
  }

  const handleSetDefault = async (warehouse) => {
    try {
      await WarehouseService.setDefault(warehouse.id)
      toast({ title: 'Default warehouse updated' })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleDisable = async (warehouse) => {
    const canDisable = await WarehouseService.canDisable(warehouse.id)

    if (!canDisable.allowed) {
      toast({
        title: 'Cannot Disable',
        description: canDisable.reason,
        variant: 'destructive',
      })
      return
    }

    const confirmed = window.confirm(`Disable warehouse ${warehouse.code}?`)
    if (!confirmed) return

    try {
      await WarehouseService.disable(warehouse.id)
      toast({ title: 'Warehouse disabled' })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleEnable = async (warehouse) => {
    try {
      await WarehouseService.enable(warehouse.id)
      toast({ title: 'Warehouse enabled' })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Warehouses</h1>
        <Button onClick={handleCreate}>Add Warehouse</Button>
      </div>

      <WarehousesDataTable
        warehouses={data?.data || []}
        total={data?.pagination.total || 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={setSearch}
        onFilter={setFilters}
        onEdit={handleEdit}
        onSetDefault={handleSetDefault}
        onDisable={handleDisable}
        onEnable={handleEnable}
        isLoading={isLoading}
        error={error?.message}
      />

      <WarehouseModal
        open={modalOpen}
        mode={modalMode}
        warehouse={selectedWarehouse}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
```

### Example 2: Filter by Type

```typescript
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { WAREHOUSE_TYPE_LABELS } from '@/lib/types/warehouse'

function FilteredWarehouseList() {
  const [selectedType, setSelectedType] = useState<WarehouseType | undefined>()

  const { data, isLoading } = useWarehouses({
    type: selectedType,
    status: 'active',
  })

  return (
    <div>
      <select
        value={selectedType || ''}
        onChange={(e) => setSelectedType(e.target.value as WarehouseType || undefined)}
      >
        <option value="">All Types</option>
        {Object.entries(WAREHOUSE_TYPE_LABELS).map(([type, label]) => (
          <option key={type} value={type}>{label}</option>
        ))}
      </select>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {data?.data.map(warehouse => (
            <li key={warehouse.id}>{warehouse.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Example 3: Search with Debounce

```typescript
import { useState, useEffect } from 'react'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { debounce } from 'lodash'

function SearchableWarehouseList() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useWarehouses({
    search: searchQuery,
  })

  // Debounce search to avoid excessive API calls
  const debouncedSearch = debounce((value: string) => {
    setSearchQuery(value)
  }, 300)

  useEffect(() => {
    debouncedSearch(searchInput)
  }, [searchInput])

  return (
    <div>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search by code or name..."
      />

      {isLoading ? (
        <p>Searching...</p>
      ) : (
        <ul>
          {data?.data.map(warehouse => (
            <li key={warehouse.id}>
              {warehouse.code} - {warehouse.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

## Business Rules

### Rule 1: Default Warehouse Atomicity

Only one warehouse can be default per organization. When setting a new default, the previous default is automatically unset.

**Implementation**: Database trigger `ensure_single_default_warehouse()`

```sql
-- Trigger ensures atomicity
CREATE TRIGGER tr_warehouses_single_default
BEFORE INSERT OR UPDATE OF is_default ON warehouses
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_warehouse();
```

**Code Usage**:
```typescript
// No need to manually unset previous default
await WarehouseService.setDefault(newWarehouseId)
// Previous default automatically set to false
```

### Rule 2: Code Immutability with Active Inventory

Cannot change warehouse code if it has active inventory (license plates with quantity > 0).

**Reason**: Changing code would break traceability and genealogy for existing inventory.

**Implementation**:
```typescript
// In update endpoint
if (validatedData.code && validatedData.code !== existingWarehouse.code) {
  const { count } = await supabase
    .from('license_plates')
    .select('*', { count: 'exact', head: true })
    .eq('warehouse_id', params.id)
    .gt('quantity', 0)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot change code for warehouse with active inventory' },
      { status: 400 }
    )
  }
}
```

**Code Usage**:
```typescript
const hasInventory = await WarehouseService.hasActiveInventory(warehouseId)
if (hasInventory) {
  // Disable code field in edit form
  codeInput.disabled = true
  codeInput.title = 'Cannot change code for warehouse with inventory'
}
```

### Rule 3: Cannot Disable Default Warehouse

Must set another warehouse as default before disabling the current default.

**Reason**: System requires at least one default warehouse for operations.

**Implementation**:
```typescript
// In disable endpoint
if (warehouse.is_default) {
  return NextResponse.json(
    { error: 'Cannot disable default warehouse. Set another warehouse as default first.' },
    { status: 400 }
  )
}
```

**Code Usage**:
```typescript
const canDisable = await WarehouseService.canDisable(warehouseId)
if (!canDisable.allowed) {
  console.log(canDisable.reason)
  // "Cannot disable default warehouse"
}
```

### Rule 4: Cannot Disable Warehouse with Active Inventory

Warehouses with active inventory (license plates with quantity > 0) cannot be disabled.

**Reason**: Prevents data integrity issues with active inventory movements.

**Implementation**:
```typescript
// In canDisable method
const { count } = await supabase
  .from('license_plates')
  .select('*', { count: 'exact', head: true })
  .eq('warehouse_id', id)
  .gt('quantity', 0)

if ((count ?? 0) > 0) {
  return {
    allowed: false,
    reason: 'Cannot disable warehouse with active inventory',
  }
}
```

**Code Usage**:
```typescript
const canDisable = await WarehouseService.canDisable(warehouseId)
if (!canDisable.allowed) {
  alert(canDisable.reason)
  // "Cannot disable warehouse with active inventory"
}
```

---

## Troubleshooting

### Issue 1: "Warehouse not found" when accessing by ID

**Symptoms**: GET request to `/api/v1/settings/warehouses/:id` returns 404, but warehouse exists.

**Cause**: User's organization doesn't match warehouse's `org_id` (RLS policy blocking).

**Solution**:
```sql
-- Verify warehouse org_id
SELECT id, code, org_id FROM warehouses WHERE id = '<warehouse-id>';

-- Verify user org_id
SELECT id, email, org_id FROM users WHERE id = '<user-id>';

-- If org_id mismatch, user cannot access that warehouse (expected behavior)
```

---

### Issue 2: Cannot create warehouse - "Warehouse code already exists"

**Symptoms**: POST request fails with 409 Conflict error.

**Cause**: Code must be unique per organization. Another warehouse already uses that code.

**Solution**:
```typescript
// Check for existing codes
const { data } = await supabase
  .from('warehouses')
  .select('code')
  .eq('org_id', orgId)
  .eq('code', desiredCode)

// Use real-time validation
const validation = await WarehouseService.validateCode('WH-NEW')
if (!validation.available) {
  console.log('Code already exists')
}
```

---

### Issue 3: Default warehouse not updating correctly

**Symptoms**: After setting new default, multiple warehouses show `is_default = true`.

**Cause**: Trigger not firing or not applied.

**Solution**:
```sql
-- Verify trigger exists
SELECT tgname FROM pg_trigger WHERE tgrelid = 'warehouses'::regclass;

-- Should show: tr_warehouses_single_default

-- If missing, reapply migration
psql -f supabase/migrations/065_create_warehouses_table.sql
```

---

### Issue 4: RLS policy blocks legitimate access

**Symptoms**: User with ADMIN role cannot create/update warehouses.

**Cause**: User's role not properly joined or role code mismatch.

**Solution**:
```sql
-- Verify user role
SELECT u.id, u.email, r.code AS role
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE u.id = '<user-id>';

-- Should return: SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER

-- If null or wrong role, update user
UPDATE users
SET role_id = (SELECT id FROM roles WHERE code = 'ADMIN')
WHERE id = '<user-id>';
```

---

### Issue 5: Search not working

**Symptoms**: Search input doesn't filter results.

**Cause**: Search query parameter not passed correctly or debounce not working.

**Solution**:
```typescript
// Verify search parameter is passed
const { data } = useWarehouses({ search: 'WH-001' })

// Check network tab: Should see ?search=WH-001 in URL

// Verify debounce is working
const [searchInput, setSearchInput] = useState('')
const debouncedSearch = useCallback(
  debounce((value: string) => {
    setSearchQuery(value)
  }, 300),
  []
)

useEffect(() => {
  debouncedSearch(searchInput)
}, [searchInput, debouncedSearch])
```

---

## Advanced Topics

### Topic 1: Custom Hook with Automatic Refetch

Create a hook that automatically refetches when needed:

```typescript
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { useEffect } from 'react'

export function useWarehousesWithRefetch(params, dependencies = []) {
  const { data, isLoading, error, refetch } = useWarehouses(params)

  useEffect(() => {
    refetch()
  }, dependencies)

  return { data, isLoading, error, refetch }
}

// Usage
const { data, refetch } = useWarehousesWithRefetch(
  { page: 1 },
  [warehouseCreated, warehouseUpdated]  // Refetch on these changes
)
```

### Topic 2: Optimistic UI Updates

Update UI immediately, revert on error:

```typescript
function OptimisticWarehouseList() {
  const [warehouses, setWarehouses] = useState([])
  const { data } = useWarehouses()

  useEffect(() => {
    if (data?.data) setWarehouses(data.data)
  }, [data])

  const handleSetDefault = async (warehouse) => {
    // Save previous state
    const previousWarehouses = [...warehouses]

    // Optimistic update
    setWarehouses(
      warehouses.map(w =>
        w.id === warehouse.id ? { ...w, is_default: true } :
        w.is_default ? { ...w, is_default: false } : w
      )
    )

    try {
      await WarehouseService.setDefault(warehouse.id)
    } catch (error) {
      // Revert on error
      setWarehouses(previousWarehouses)
      toast({ title: 'Error', description: error.message })
    }
  }

  return <WarehouseList warehouses={warehouses} onSetDefault={handleSetDefault} />
}
```

### Topic 3: Custom Permission Hook

Create a reusable permissions hook:

```typescript
import { useUser } from '@/lib/hooks/use-user'

export function useWarehousePermissions() {
  const { user } = useUser()

  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(user?.role?.code)
  const canUpdate = ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(user?.role?.code)
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role?.code)
  const canView = !!user  // All authenticated users

  return {
    canCreate,
    canUpdate,
    canDelete,
    canView,
    isReadOnly: !canUpdate,
  }
}

// Usage
function WarehousePage() {
  const { canCreate, isReadOnly } = useWarehousePermissions()

  return (
    <>
      {canCreate && <Button>Add Warehouse</Button>}
      <WarehousesDataTable readOnly={isReadOnly} />
    </>
  )
}
```

### Topic 4: Batch Operations

Implement batch disable/enable:

```typescript
async function batchDisableWarehouses(warehouseIds: string[]) {
  const results = []

  for (const id of warehouseIds) {
    try {
      const canDisable = await WarehouseService.canDisable(id)
      if (canDisable.allowed) {
        await WarehouseService.disable(id)
        results.push({ id, success: true })
      } else {
        results.push({ id, success: false, reason: canDisable.reason })
      }
    } catch (error) {
      results.push({ id, success: false, error: error.message })
    }
  }

  return results
}

// Usage
const results = await batchDisableWarehouses(['id1', 'id2', 'id3'])
const successful = results.filter(r => r.success).length
console.log(`Disabled ${successful} out of ${results.length} warehouses`)
```

---

## Related Documentation

- [Warehouses API Documentation](../../api/settings/warehouses.md)
- [Warehouse Component Documentation](../../frontend/components/warehouses.md)
- [Story 01.8 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.8.warehouses-crud.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-20 | Initial release (Story 01.8) |
