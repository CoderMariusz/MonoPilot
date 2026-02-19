# Routings Management Components

**Story**: 02.7 - Routings CRUD + Header Management
**Module**: Technical
**Status**: Production Ready
**Last Updated**: 2025-12-28

---

## Overview

React components for managing routings (production templates). Four main components handle all user interactions: listing, creating, cloning, and deleting routings.

**Components**:
1. **RoutingsDataTable** - List view with search, filter, pagination
2. **CreateRoutingModal** - Create/edit modal form
3. **CloneRoutingModal** - Clone dialog with source info
4. **DeleteRoutingDialog** - Delete confirmation with BOM usage

---

## RoutingsDataTable Component

**Location**: `apps/frontend/components/technical/routings/RoutingsDataTable.tsx`

**Purpose**: Display paginated list of routings with filtering, searching, and inline actions.

### Props

```typescript
interface RoutingsDataTableProps {
  routings: Routing[]
  total: number
  page: number
  limit: number
  loading?: boolean
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onFilterChange: (filters: RoutingFilters) => void
  onCreateClick: () => void
  onEditClick: (routing: Routing) => void
  onCloneClick: (routing: Routing) => void
  onDeleteClick: (routing: Routing) => void
  onViewDetailsClick?: (routing: Routing) => void
}
```

### Usage Example

```typescript
import { RoutingsDataTable } from '@/components/technical/routings'
import { useState, useEffect } from 'react'

export function RoutingsPage() {
  const [routings, setRoutings] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [total, setTotal] = useState(0)

  useEffect(() => {
    // Fetch routings
    const params = new URLSearchParams({
      page: String(page),
      search,
      ...(filters.is_active !== undefined && { is_active: String(filters.is_active) })
    })

    fetch(`/api/v1/technical/routings?${params}`)
      .then(res => res.json())
      .then(data => {
        setRoutings(data.routings)
        setTotal(data.total)
      })
  }, [page, search, filters])

  return (
    <RoutingsDataTable
      routings={routings}
      total={total}
      page={page}
      limit={25}
      loading={false}
      onPageChange={setPage}
      onSearch={setSearch}
      onFilterChange={setFilters}
      onCreateClick={() => /* open create modal */}
      onEditClick={(routing) => /* open edit modal */}
      onCloneClick={(routing) => /* open clone dialog */}
      onDeleteClick={(routing) => /* open delete dialog */}
    />
  )
}
```

### Features

**Columns**:
| Column | Content | Width |
|--------|---------|-------|
| Code | Routing code (RTG-BREAD-01) | 15% |
| Name | Routing name | 25% |
| Description | First 80 chars of description | 25% |
| Status | Active/Inactive badge | 10% |
| Operations | Count of operations | 8% |
| Actions | Edit, Clone, Delete icons | 17% |

**Search**:
- Searches across code and name fields
- Case-insensitive
- Debounced (300ms)
- Real-time as user types

**Filters**:
- Status: All / Active / Inactive
- Applied immediately
- Persisted in URL state

**Sorting**:
- Click column header to sort
- Supports name, code, created_at
- ASC/DESC toggle

**Pagination**:
- Page size: 25 items (configurable)
- Shows "1-25 of 120 routings"
- Next/Prev buttons
- Jump to page input

**Empty State**:
- Shows when 0 routings exist
- CTA: "Create your first routing"
- Links to help documentation

**Loading State**:
- Skeleton rows while fetching
- Loading spinner in header

---

## CreateRoutingModal Component

**Location**: `apps/frontend/components/technical/routings/CreateRoutingModal.tsx`

**Purpose**: Modal form for creating new routings or editing existing ones.

### Props

```typescript
interface CreateRoutingModalProps {
  isOpen: boolean
  isLoading?: boolean
  initialData?: Routing  // If provided, enters edit mode
  onClose: () => void
  onSubmit: (data: CreateRoutingInput) => Promise<Routing>
  onSuccess?: (routing: Routing) => void
  onError?: (error: string) => void
}
```

### Usage Example

```typescript
import { CreateRoutingModal } from '@/components/technical/routings'
import { useState } from 'react'

export function RoutingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRouting, setEditingRouting] = useState(null)

  const handleCreate = async (data) => {
    const response = await fetch('/api/v1/technical/routings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  const handleEdit = async (data) => {
    const response = await fetch(`/api/v1/technical/routings/${editingRouting.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  return (
    <>
      <CreateRoutingModal
        isOpen={isModalOpen}
        initialData={editingRouting}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRouting(null)
        }}
        onSubmit={editingRouting ? handleEdit : handleCreate}
        onSuccess={(routing) => {
          toast.success(`Routing "${routing.name}" saved`)
          setIsModalOpen(false)
          setEditingRouting(null)
          // Refresh list
          loadRoutings()
        }}
        onError={(error) => {
          toast.error(error)
        }}
      />
    </>
  )
}
```

### Form Fields

**Section 1: Basic Info**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Code | text | Yes | 2-50 chars, uppercase A-Z0-9-, unique per org |
| Name | text | Yes | 1-100 chars |
| Description | textarea | No | Max 500 chars |

**Section 2: Configuration**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Status | select | Active | Active/Inactive |
| Reusable | checkbox | true | Can be used in multiple BOMs |

**Section 3: Cost Configuration (ADR-009)**

| Field | Type | Default | Validation |
|-------|------|---------|-----------|
| Setup Cost | number | 0 | >= 0, 2 decimals |
| Working Cost/Unit | number | 0 | >= 0, 4 decimals |
| Overhead % | number | 0 | 0-100, 2 decimals |
| Currency | select | PLN | PLN, EUR, USD, GBP |

### Validation

**Client-side** (Zod schema):
```typescript
const createRoutingSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, numbers, and hyphens'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  is_reusable: z.boolean().default(true),
  setup_cost: z.number().min(0).default(0),
  working_cost_per_unit: z.number().min(0).default(0),
  overhead_percent: z.number().min(0).max(100).default(0),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).default('PLN')
})
```

**Server-side** (API validation):
- Code uniqueness (org_id + code)
- Cost field ranges
- Currency enum validation

### Error Handling

```typescript
const errors = {
  CODE_REQUIRED: 'Code is required',
  CODE_TOO_SHORT: 'Code must be at least 2 characters',
  CODE_INVALID_FORMAT: 'Code can only contain uppercase letters, numbers, and hyphens',
  CODE_DUPLICATE: 'Code already exists in your organization',
  NAME_REQUIRED: 'Name is required',
  OVERHEAD_MAX: 'Overhead cannot exceed 100%',
  SETUP_COST_NEGATIVE: 'Setup cost cannot be negative',
  NETWORK_ERROR: 'Failed to save. Please try again.',
  INVALID_VERSION: 'Routing was modified by another user. Please refresh and try again.'
}
```

### Edit Mode Specifics

When `initialData` is provided, component switches to edit mode:

```typescript
// Read-only in edit mode
<Input name="code" value={routing.code} disabled />

// Editable fields
<Input name="name" defaultValue={routing.name} />
<Input name="setup_cost" defaultValue={routing.setup_cost} />

// Shows version
<p>Version: v{routing.version}</p>

// Warning if routing has BOMs
{routing.boms_count > 0 && (
  <Alert>
    This routing is used by {routing.boms_count} BOMs.
    Changes will affect their costing.
  </Alert>
)}
```

### Unsaved Changes

Dialog warns on close if form is dirty:

```
"You have unsaved changes. Do you want to discard them?"
```

---

## CloneRoutingModal Component

**Location**: `apps/frontend/components/technical/routings/CloneRoutingModal.tsx`

**Purpose**: Clone dialog showing source routing info and requesting new code/name.

### Props

```typescript
interface CloneRoutingModalProps {
  isOpen: boolean
  isLoading?: boolean
  sourceRouting: Routing
  onClose: () => void
  onSubmit: (data: CloneRoutingInput) => Promise<Routing>
  onSuccess?: (routing: Routing) => void
  onError?: (error: string) => void
}

interface CloneRoutingInput {
  code: string
  name: string
  description?: string
  is_active?: boolean
}
```

### Usage Example

```typescript
import { CloneRoutingModal } from '@/components/technical/routings'
import { useState } from 'react'

export function RoutingsPage() {
  const [isCloneOpen, setIsCloneOpen] = useState(false)
  const [sourceRouting, setSourceRouting] = useState(null)

  const handleClone = async (data) => {
    const response = await fetch('/api/v1/technical/routings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        cloneFrom: sourceRouting.id
      })
    })
    return response.json()
  }

  return (
    <>
      <CloneRoutingModal
        isOpen={isCloneOpen}
        sourceRouting={sourceRouting}
        onClose={() => {
          setIsCloneOpen(false)
          setSourceRouting(null)
        }}
        onSubmit={handleClone}
        onSuccess={(routing) => {
          toast.success(`Routing cloned. ${routing.operations_count} operations copied.`)
          setIsCloneOpen(false)
          loadRoutings()
        }}
      />
    </>
  )
}
```

### Layout

**Read-only Source Section**:
```
Clone Routing
─────────────────────────────
Source: Standard Bread Line (RTG-BREAD-01)
Operations: 5
Cost Configuration:
  Setup: 90.00 PLN
  Working: 2.50 PLN/unit
  Overhead: 15%
─────────────────────────────
```

**Input Section**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| New Code | text | Yes | Must be unique, 2-50 chars |
| New Name | text | Yes | 1-100 chars |
| Description | textarea | No | Defaults to source description |
| Active | checkbox | No | Defaults to true |

**Auto-Copy**:
- All cost fields from source are preserved
- All operations from source are cloned
- Description pre-filled (can be edited)
- Code/name are empty (required user input)

### Operations Cloning

Clone request includes `cloneFrom` parameter:

```typescript
{
  code: "RTG-BREAD-01-COPY",
  name: "Premium Bread Line Copy",
  cloneFrom: "550e8400-e29b-41d4-a716-446655440000"
  // API will copy operations from source
}
```

Response includes operations count:
```json
{
  "routing": { ...routing data },
  "operationsCount": 5  // Number of operations cloned
}
```

---

## DeleteRoutingDialog Component

**Location**: `apps/frontend/components/technical/routings/DeleteRoutingDialog.tsx`

**Purpose**: Delete confirmation dialog showing BOM usage and consequences.

### Props

```typescript
interface DeleteRoutingDialogProps {
  isOpen: boolean
  isLoading?: boolean
  routing: Routing
  bomsUsing?: BOMWithProduct[]
  onClose: () => void
  onConfirm: () => Promise<DeleteResponse>
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface BOMWithProduct {
  id: string
  code: string
  product_name: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

interface DeleteResponse {
  success: boolean
  affected_boms: number
  message: string
}
```

### Usage Example

```typescript
import { DeleteRoutingDialog } from '@/components/technical/routings'
import { useState, useEffect } from 'react'

export function RoutingsPage() {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [routingToDelete, setRoutingToDelete] = useState(null)
  const [bomsUsing, setBomsUsing] = useState([])

  const handleDeleteClick = async (routing) => {
    // Fetch BOMs using this routing
    const response = await fetch(`/api/v1/technical/routings/${routing.id}/boms`)
    const data = await response.json()
    setBomsUsing(data.boms)
    setRoutingToDelete(routing)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    const response = await fetch(`/api/v1/technical/routings/${routingToDelete.id}`, {
      method: 'DELETE'
    })
    return response.json()
  }

  return (
    <>
      <DeleteRoutingDialog
        isOpen={isDeleteOpen}
        routing={routingToDelete}
        bomsUsing={bomsUsing}
        onClose={() => {
          setIsDeleteOpen(false)
          setRoutingToDelete(null)
          setBomsUsing([])
        }}
        onConfirm={handleConfirmDelete}
        onSuccess={() => {
          toast.success('Routing deleted')
          setIsDeleteOpen(false)
          loadRoutings()
        }}
        onError={(error) => {
          toast.error(error)
        }}
      />
    </>
  )
}
```

### Dialog Layout

**No Usage**:
```
Delete Routing: RTG-BREAD-01
────────────────────────────
This routing is not currently assigned to any BOMs.

[Cancel] [Delete]
```

**With Usage**:
```
Delete Routing: RTG-BREAD-01
────────────────────────────
⚠️ This routing is assigned to 3 BOMs:

  • BOM-BREAD-001 (White Bread) - ACTIVE
  • BOM-BREAD-002 (Whole Wheat) - ACTIVE
  • BOM-BREAD-003 (Premium White) - DRAFT

These BOMs will be unassigned from the routing.
Their formulation data will remain, but the
production workflow will need to be reassigned.

[Cancel] [Delete Anyway]
```

### Consequences

When user confirms deletion:
1. Routing is permanently deleted
2. All BOMs are unassigned (routing_id = NULL)
3. All operations for routing are deleted
4. BOM cost calculations will show "No routing assigned"

---

## Common Patterns

### Managing Modal State

```typescript
const [isCreateOpen, setIsCreateOpen] = useState(false)
const [isEditOpen, setIsEditOpen] = useState(false)
const [editingRouting, setEditingRouting] = useState(null)

const openCreate = () => setIsCreateOpen(true)

const openEdit = (routing: Routing) => {
  setEditingRouting(routing)
  setIsEditOpen(true)
}

const closeCreate = () => setIsCreateOpen(false)

const closeEdit = () => {
  setIsEditOpen(false)
  setEditingRouting(null)
}
```

### Loading and Error Handling

```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const handleSubmit = async (data) => {
  try {
    setLoading(true)
    setError(null)
    const result = await onSubmit(data)
    onSuccess?.(result)
  } catch (err) {
    setError(err.message)
    onError?.(err.message)
  } finally {
    setLoading(false)
  }
}
```

### Toast Notifications

```typescript
import { useToast } from '@/components/ui/use-toast'

export function RoutingsPage() {
  const { toast } = useToast()

  const handleSuccess = (routing) => {
    toast({
      title: 'Success',
      description: `Routing "${routing.name}" saved`,
      variant: 'default'
    })
  }

  const handleError = (error) => {
    toast({
      title: 'Error',
      description: error,
      variant: 'destructive'
    })
  }
}
```

---

## Accessibility

All components follow ShadCN UI accessibility standards:

- Keyboard navigation (Tab, Enter, Escape)
- Screen reader labels (aria-label, aria-describedby)
- Focus management (focus trap in modals)
- Error announcements (live regions)
- Color contrast (WCAG AA)

---

## Testing

### Unit Tests

```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { CreateRoutingModal } from './CreateRoutingModal'

describe('CreateRoutingModal', () => {
  it('should submit valid form data', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ id: '123' })

    render(
      <CreateRoutingModal
        isOpen={true}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    )

    await userEvent.type(screen.getByLabelText('Code'), 'RTG-TEST-01')
    await userEvent.type(screen.getByLabelText('Name'), 'Test Routing')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'RTG-TEST-01',
        name: 'Test Routing'
      })
    )
  })

  it('should show validation errors', async () => {
    const { rerender } = render(
      <CreateRoutingModal isOpen={true} onSubmit={() => {}} onClose={() => {}} />
    )

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText('Code is required')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })
})
```

---

## Related Documentation

- **[Routings CRUD API](../api/technical/routings-crud.md)**
- **[ADR-009: Routing Costs](../../../5-DEVELOPER-GUIDES/routing-costs-adr009.md)**
- **[Story 02.7: Routings CRUD](../../../2-MANAGEMENT/epics/current/02-technical/context/02.7/)**
- **[User Guide: Routings Management](../../../4-USER-GUIDES/routings-management.md)**

---

**Last Updated**: 2025-12-28
**Component Status**: Production Ready
