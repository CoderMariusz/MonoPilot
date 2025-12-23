# Warehouse Components Documentation

**Story**: 01.8 - Warehouses CRUD
**Module**: Settings
**Component Path**: `components/settings/warehouses/`
**Version**: 1.0.0
**Last Updated**: 2025-12-20

---

## Overview

The Warehouse components provide a complete UI for managing warehouses in MonoPilot. The component library includes:

- Data table with search, filter, sort, pagination
- Type badges with color coding
- Action menus with permission enforcement
- Confirmation dialogs for destructive operations
- Loading, empty, and error states
- Responsive design with accessibility features

---

## Component Architecture

```
components/settings/warehouses/
├── WarehousesDataTable.tsx          # Main table component
├── WarehouseModal.tsx               # Create/Edit modal form
├── WarehouseTypeBadge.tsx           # Type badge with colors
├── DisableConfirmDialog.tsx         # Disable confirmation dialog
└── __tests__/
    └── WarehouseModal.test.tsx      # Component tests
```

**Related Files**:
```
lib/
├── services/warehouse-service.ts    # Business logic layer
├── hooks/use-warehouses.ts          # Data fetching hook
├── types/warehouse.ts               # TypeScript types
└── validation/warehouse-schemas.ts  # Zod validation schemas
```

---

## Components

### 1. WarehousesDataTable

Main data table component with built-in search, filtering, sorting, and pagination.

**Location**: `components/settings/warehouses/WarehousesDataTable.tsx`

#### Props

```typescript
interface WarehousesDataTableProps {
  warehouses: Warehouse[]                           // Array of warehouse objects
  total: number                                     // Total count for pagination
  page: number                                      // Current page (1-based)
  limit: number                                     // Items per page
  onPageChange: (page: number) => void             // Page change callback
  onSearch: (search: string) => void               // Search callback (debounced)
  onFilter: (filters: Partial<WarehouseListParams>) => void  // Filter callback
  onEdit: (warehouse: Warehouse) => void           // Edit action callback
  onSetDefault: (warehouse: Warehouse) => void     // Set default callback
  onDisable: (warehouse: Warehouse) => void        // Disable action callback
  onEnable: (warehouse: Warehouse) => void         // Enable action callback
  isLoading?: boolean                               // Loading state
  error?: string                                    // Error message
  readOnly?: boolean                                // Permission-based UI
}
```

#### Features

- **Search**: Debounced search (300ms) by warehouse code or name
- **Filters**: Type dropdown, status dropdown (active/disabled)
- **Sorting**: Column headers (code, name, type, location_count)
- **Pagination**: Previous/Next buttons with page indicator
- **Actions Menu**: Edit, Set as Default, Disable/Enable
- **States**: Loading skeletons, empty state, error state

#### Usage Example

```typescript
import { WarehousesDataTable } from '@/components/settings/warehouses/WarehousesDataTable'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { useState } from 'react'

export default function WarehousesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})

  const { data, isLoading, error } = useWarehouses({
    page,
    limit: 20,
    search,
    ...filters,
  })

  const handleEdit = (warehouse) => {
    // Open edit modal
  }

  const handleSetDefault = async (warehouse) => {
    try {
      await WarehouseService.setDefault(warehouse.id)
      // Refresh data
    } catch (error) {
      // Show error toast
    }
  }

  return (
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
      readOnly={!hasPermission}
    />
  )
}
```

#### Loading State

The table automatically renders skeleton loaders when `isLoading={true}`:

```tsx
<div className="space-y-4">
  <div className="flex gap-4">
    <Skeleton className="h-10 flex-1" />
    <Skeleton className="h-10 w-[180px]" />
    <Skeleton className="h-10 w-[180px]" />
  </div>
  <div className="border rounded-md">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border-b">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
        {/* ... more skeleton items */}
      </div>
    ))}
  </div>
</div>
```

#### Empty State

Displayed when no warehouses match the current filters:

```tsx
<div className="text-center py-12">
  <p className="text-muted-foreground">No warehouses found</p>
  {!readOnly && (
    <Button onClick={onAddWarehouse} className="mt-4">
      Add Warehouse
    </Button>
  )}
</div>
```

#### Error State

Displayed when data fetch fails:

```tsx
<div className="flex flex-col items-center justify-center py-12 space-y-4">
  <div className="text-center">
    <p className="text-lg font-semibold text-destructive">{error}</p>
  </div>
  <Button onClick={retry}>Retry</Button>
</div>
```

#### Accessibility

- ARIA labels on filter dropdowns: `aria-label="Filter by type"`
- ARIA labels on action buttons: `aria-label="Actions"`
- Keyboard navigation support
- Focus management for dropdowns and buttons

---

### 2. WarehouseTypeBadge

Displays warehouse type with color-coded badge.

**Location**: `components/settings/warehouses/WarehouseTypeBadge.tsx`

#### Props

```typescript
interface WarehouseTypeBadgeProps {
  type: WarehouseType  // Warehouse type enum
}
```

#### Usage Example

```typescript
import { WarehouseTypeBadge } from '@/components/settings/warehouses/WarehouseTypeBadge'

<WarehouseTypeBadge type="RAW_MATERIALS" />
// Renders: <Badge className="bg-green-100 text-green-800">Raw Materials</Badge>
```

#### Type Color Mapping

| Type | Background | Text Color | Label |
|------|-----------|------------|-------|
| GENERAL | bg-blue-100 | text-blue-800 | General |
| RAW_MATERIALS | bg-green-100 | text-green-800 | Raw Materials |
| WIP | bg-yellow-100 | text-yellow-800 | WIP (Work in Progress) |
| FINISHED_GOODS | bg-purple-100 | text-purple-800 | Finished Goods |
| QUARANTINE | bg-red-100 | text-red-800 | Quarantine |

#### Implementation

```typescript
import { Badge } from '@/components/ui/badge'
import { WAREHOUSE_TYPE_LABELS, WAREHOUSE_TYPE_COLORS, type WarehouseType } from '@/lib/types/warehouse'

interface WarehouseTypeBadgeProps {
  type: WarehouseType
}

export function WarehouseTypeBadge({ type }: WarehouseTypeBadgeProps) {
  const label = WAREHOUSE_TYPE_LABELS[type]
  const colors = WAREHOUSE_TYPE_COLORS[type]

  return (
    <Badge className={`${colors.bg} ${colors.text}`}>
      {label}
    </Badge>
  )
}
```

---

### 3. DisableConfirmDialog

Confirmation dialog for disabling a warehouse with business rule checks.

**Location**: `components/settings/warehouses/DisableConfirmDialog.tsx`

#### Props

```typescript
interface DisableConfirmDialogProps {
  open: boolean
  warehouse: Warehouse | null
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}
```

#### Features

- Displays warehouse code and name
- Shows warning if warehouse has active inventory
- Shows warning if warehouse is default
- Blocks confirmation if business rules violated

#### Usage Example

```typescript
import { DisableConfirmDialog } from '@/components/settings/warehouses/DisableConfirmDialog'
import { useState } from 'react'

function WarehousePage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)

  const handleDisableClick = async (warehouse) => {
    // Check if can disable
    const result = await WarehouseService.canDisable(warehouse.id)

    if (!result.allowed) {
      toast({
        title: 'Cannot Disable',
        description: result.reason,
        variant: 'destructive',
      })
      return
    }

    setSelectedWarehouse(warehouse)
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    try {
      await WarehouseService.disable(selectedWarehouse.id)
      toast({ title: 'Warehouse disabled' })
      setDialogOpen(false)
      // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {/* Table component */}
      <DisableConfirmDialog
        open={dialogOpen}
        warehouse={selectedWarehouse}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  )
}
```

---

### 4. WarehouseModal

Create/Edit modal form with validation.

**Location**: `components/settings/warehouses/WarehouseModal.tsx`

#### Props

```typescript
interface WarehouseModalProps {
  open: boolean
  mode: 'create' | 'edit'
  warehouse?: Warehouse | null    // For edit mode
  onClose: () => void
  onSuccess: () => void
}
```

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Code | Text Input | Yes | 2-20 chars, uppercase alphanumeric + hyphens |
| Name | Text Input | Yes | 2-100 chars |
| Type | Select | Yes | One of 5 warehouse types |
| Address | Textarea | No | Max 500 chars (3 lines) |
| Contact Email | Email Input | No | Valid email format |
| Contact Phone | Text Input | No | Max 20 chars |
| Active | Checkbox | No | Default: true |

#### Usage Example

```typescript
import { WarehouseModal } from '@/components/settings/warehouses/WarehouseModal'
import { useState } from 'react'

function WarehousePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)

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

  const handleSuccess = () => {
    setModalOpen(false)
    // Refresh warehouse list
    refetch()
  }

  return (
    <>
      <Button onClick={handleCreate}>Add Warehouse</Button>

      <WarehouseModal
        open={modalOpen}
        mode={modalMode}
        warehouse={selectedWarehouse}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
```

#### Real-time Validation

The modal performs real-time code validation using the `/validate-code` endpoint:

```typescript
const [codeError, setCodeError] = useState('')

const validateCode = useCallback(
  debounce(async (code: string) => {
    try {
      const result = await WarehouseService.validateCode(
        code,
        mode === 'edit' ? warehouse?.id : undefined
      )

      if (!result.available) {
        setCodeError('Code already exists')
      } else {
        setCodeError('')
      }
    } catch (error) {
      console.error('Code validation failed:', error)
    }
  }, 500),
  [mode, warehouse?.id]
)
```

---

## React Hooks

### useWarehouses

Custom hook for fetching warehouses list with filters.

**Location**: `lib/hooks/use-warehouses.ts`

#### Signature

```typescript
function useWarehouses(params?: WarehouseListParams): {
  data: PaginatedResult<Warehouse> | undefined
  isLoading: boolean
  error: Error | null
}
```

#### Parameters

```typescript
interface WarehouseListParams {
  search?: string
  type?: WarehouseType
  status?: 'active' | 'disabled'
  sort?: 'code' | 'name' | 'type' | 'location_count' | 'created_at'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}
```

#### Usage Example

```typescript
import { useWarehouses } from '@/lib/hooks/use-warehouses'

function WarehousePage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useWarehouses({
    page,
    limit: 20,
    search,
    type: 'RAW_MATERIALS',
    status: 'active',
    sort: 'name',
    order: 'asc',
  })

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorDisplay message={error.message} />

  return (
    <div>
      <p>Total: {data?.pagination.total}</p>
      {data?.data.map(warehouse => (
        <div key={warehouse.id}>{warehouse.name}</div>
      ))}
    </div>
  )
}
```

---

## Service Layer

### WarehouseService

Static service class for warehouse operations.

**Location**: `lib/services/warehouse-service.ts`

#### Methods

```typescript
class WarehouseService {
  // List warehouses
  static async list(params?: WarehouseListParams): Promise<PaginatedResult<Warehouse>>

  // Get by ID
  static async getById(id: string): Promise<Warehouse | null>

  // Create warehouse
  static async create(data: CreateWarehouseInput): Promise<Warehouse>

  // Update warehouse
  static async update(id: string, data: UpdateWarehouseInput): Promise<Warehouse>

  // Set as default
  static async setDefault(id: string): Promise<Warehouse>

  // Disable warehouse
  static async disable(id: string): Promise<Warehouse>

  // Enable warehouse
  static async enable(id: string): Promise<Warehouse>

  // Validate code
  static async validateCode(code: string, excludeId?: string): Promise<ValidationResult>

  // Check active inventory
  static async hasActiveInventory(id: string): Promise<boolean>

  // Check if can disable
  static async canDisable(id: string): Promise<CanDisableResult>
}
```

#### Usage Examples

```typescript
import { WarehouseService } from '@/lib/services/warehouse-service'

// Create warehouse
const newWarehouse = await WarehouseService.create({
  code: 'WH-NEW',
  name: 'New Warehouse',
  type: 'GENERAL',
  address: '123 Main St',
  contact_email: 'contact@example.com',
})

// Update warehouse
const updated = await WarehouseService.update('warehouse-id', {
  name: 'Updated Name',
  address: 'New Address',
})

// Set as default
const defaultWarehouse = await WarehouseService.setDefault('warehouse-id')

// Check before disabling
const canDisable = await WarehouseService.canDisable('warehouse-id')
if (canDisable.allowed) {
  await WarehouseService.disable('warehouse-id')
} else {
  console.error(canDisable.reason)
}

// Validate code in real-time
const validation = await WarehouseService.validateCode('WH-001')
if (!validation.available) {
  console.log('Code already exists')
}
```

---

## Type Definitions

### Core Types

**Location**: `lib/types/warehouse.ts`

```typescript
// Warehouse Type Enum
export type WarehouseType =
  | 'GENERAL'
  | 'RAW_MATERIALS'
  | 'WIP'
  | 'FINISHED_GOODS'
  | 'QUARANTINE'

// Warehouse Interface
export interface Warehouse {
  id: string
  org_id: string
  code: string
  name: string
  type: WarehouseType
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  is_default: boolean
  is_active: boolean
  location_count: number
  disabled_at: string | null
  disabled_by: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

// Input Types
export interface CreateWarehouseInput {
  code: string
  name: string
  type: WarehouseType
  address?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  is_active?: boolean
}

export interface UpdateWarehouseInput {
  code?: string
  name?: string
  type?: WarehouseType
  address?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  is_active?: boolean
}

// List Parameters
export interface WarehouseListParams {
  search?: string
  type?: WarehouseType
  status?: 'active' | 'disabled'
  sort?: 'code' | 'name' | 'type' | 'location_count' | 'created_at'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Result Types
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface ValidationResult {
  available: boolean
  message?: string
}

export interface CanDisableResult {
  allowed: boolean
  reason?: string
}
```

### Constants

```typescript
// Type Labels (for UI display)
export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  GENERAL: 'General',
  RAW_MATERIALS: 'Raw Materials',
  WIP: 'WIP (Work in Progress)',
  FINISHED_GOODS: 'Finished Goods',
  QUARANTINE: 'Quarantine',
}

// Type Descriptions (for tooltips)
export const WAREHOUSE_TYPE_DESCRIPTIONS: Record<WarehouseType, string> = {
  GENERAL: 'Multi-purpose storage for all product types',
  RAW_MATERIALS: 'Storage for incoming raw materials and ingredients',
  WIP: 'Work-in-progress inventory during production',
  FINISHED_GOODS: 'Completed products ready for shipping',
  QUARANTINE: 'Isolated storage for quality hold or rejected items',
}

// Type Colors (for badges)
export const WAREHOUSE_TYPE_COLORS: Record<WarehouseType, { bg: string; text: string }> = {
  GENERAL: { bg: 'bg-blue-100', text: 'text-blue-800' },
  RAW_MATERIALS: { bg: 'bg-green-100', text: 'text-green-800' },
  WIP: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  FINISHED_GOODS: { bg: 'bg-purple-100', text: 'text-purple-800' },
  QUARANTINE: { bg: 'bg-red-100', text: 'text-red-800' },
}
```

---

## Validation Schemas

**Location**: `lib/validation/warehouse-schemas.ts`

```typescript
import { z } from 'zod'

// Warehouse Type Enum Schema
export const warehouseTypeEnum = z.enum([
  'GENERAL',
  'RAW_MATERIALS',
  'WIP',
  'FINISHED_GOODS',
  'QUARANTINE',
])

// Create Warehouse Schema
export const createWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, 'Warehouse code must be at least 2 characters')
    .max(20, 'Code must be 20 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(2, 'Warehouse name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less'),
  type: warehouseTypeEnum.default('GENERAL'),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  contact_email: z
    .preprocess(
      (val) => (val === null || val === undefined || val === '' ? null : val),
      z.union([
        z.null(),
        z.string().email('Invalid email format').max(255)
      ])
    ),
  contact_phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  is_active: z.boolean().default(true).optional(),
})

// Update Warehouse Schema
export const updateWarehouseSchema = createWarehouseSchema.partial()
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully with user-friendly messages:

```typescript
try {
  await WarehouseService.create(data)
  toast({ title: 'Warehouse created successfully' })
} catch (error) {
  toast({
    title: 'Error',
    description: error instanceof Error ? error.message : 'Failed to create warehouse',
    variant: 'destructive',
  })
}
```

### 2. Loading States

Show loading indicators during async operations:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async () => {
  setIsSubmitting(true)
  try {
    await WarehouseService.create(data)
  } finally {
    setIsSubmitting(false)
  }
}

<Button disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create Warehouse'}
</Button>
```

### 3. Optimistic Updates

For better UX, update UI immediately then revert on error:

```typescript
const handleSetDefault = async (warehouse: Warehouse) => {
  // Optimistic update
  const updatedWarehouses = warehouses.map(w =>
    w.id === warehouse.id ? { ...w, is_default: true } :
    w.is_default ? { ...w, is_default: false } : w
  )
  setWarehouses(updatedWarehouses)

  try {
    await WarehouseService.setDefault(warehouse.id)
  } catch (error) {
    // Revert on error
    setWarehouses(previousWarehouses)
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}
```

### 4. Permission Checks

Hide/disable UI elements based on user permissions:

```typescript
const hasPermission = user.role in ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']

<WarehousesDataTable
  readOnly={!hasPermission}
  // ... other props
/>

{hasPermission && (
  <Button onClick={handleCreate}>Add Warehouse</Button>
)}
```

---

## Testing

### Component Tests

**Location**: `components/settings/warehouses/__tests__/WarehouseModal.test.tsx`

Example test structure:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WarehouseModal } from '../WarehouseModal'

describe('WarehouseModal', () => {
  it('validates required fields', async () => {
    render(<WarehouseModal open mode="create" onClose={jest.fn()} onSuccess={jest.fn()} />)

    const submitButton = screen.getByText('Create')
    await userEvent.click(submitButton)

    expect(await screen.findByText('Code is required')).toBeInTheDocument()
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })

  it('validates code format', async () => {
    render(<WarehouseModal open mode="create" onClose={jest.fn()} onSuccess={jest.fn()} />)

    const codeInput = screen.getByLabelText('Code')
    await userEvent.type(codeInput, 'invalid code!')

    expect(await screen.findByText(/uppercase alphanumeric/i)).toBeInTheDocument()
  })
})
```

---

## Troubleshooting

### Common Issues

**Issue**: Table shows "No warehouses found" but data exists

**Solution**: Check RLS policies - user may not have access to org data

---

**Issue**: Cannot disable warehouse despite no active inventory

**Solution**: Warehouse may be set as default. Set another warehouse as default first.

---

**Issue**: Code validation shows "already exists" for new code

**Solution**: Code validation is case-insensitive. Codes are auto-uppercased.

---

## Related Documentation

- [Warehouses API Documentation](../../api/settings/warehouses.md)
- [Warehouse Developer Guide](../../guides/warehouse-management.md)
- [Story 01.8 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.8.warehouses-crud.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-20 | Initial release (Story 01.8) |
