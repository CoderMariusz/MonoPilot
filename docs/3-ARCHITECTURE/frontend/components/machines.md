# Machine Components Documentation

**Story**: 01.10 - Machines CRUD
**Module**: Settings
**Location**: `apps/frontend/components/settings/machines/`
**Version**: 1.0.0
**Last Updated**: 2025-12-22

---

## Overview

The Machines component suite provides a complete UI for managing production machines in MonoPilot. Built with React 19, TypeScript, and ShadCN UI, it includes data tables, modals, badges, filters, and location selectors for comprehensive machine management.

**Key Features**:
- Responsive data table with search, filtering, sorting, and pagination
- Create/edit modal with real-time validation and code availability check
- Type and status badges with 9 machine types and 4 statuses
- Capacity display for production metrics
- Location assignment with hierarchical dropdown
- Permission-based UI (read-only mode for viewers)
- Debounced search (300ms) for performance
- Comprehensive loading and error states

---

## Components

### 1. MachinesDataTable

**File**: `MachinesDataTable.tsx`

Main data table component for displaying machines with search, filters, sorting, and pagination.

#### Props

```typescript
interface MachinesDataTableProps {
  machines: Machine[]          // Array of machine objects
  total: number               // Total count (for pagination)
  page: number                // Current page (1-based)
  limit: number               // Items per page
  onPageChange: (page: number) => void  // Page change handler
  onSearch: (search: string) => void    // Search handler (debounced 300ms)
  onFilter: (filters: Partial<MachineListParams>) => void // Filter handler
  onEdit: (machine: Machine) => void    // Edit action handler
  onDelete: (machine: Machine) => void  // Delete action handler
  isLoading?: boolean         // Loading state
  error?: string              // Error message
  readOnly?: boolean          // Hide actions (for viewers)
}
```

#### Features

- **Search**: Debounced 300ms, searches code and name
- **Filters**: Type (9 types), Status (4 statuses)
- **Sorting**: Code, name, type, status, created date
- **Pagination**: 25 items per page default
- **Actions Dropdown**: Edit, Delete (permission-based)
- **Loading State**: Skeleton loaders for initial load
- **Empty State**: User-friendly message with suggestions
- **Error State**: Retry button

#### Columns

| Column | Description | Sortable |
|--------|-------------|----------|
| Code | Machine code with description (if available) | Yes |
| Name | Machine display name | Yes |
| Type | Type badge (color-coded) | Yes |
| Status | Status badge (color-coded) | Yes |
| Capacity | Production metrics (units/hr, setup time, max batch) | No |
| Location | Hierarchical path or code | No |
| Actions | Edit/Delete dropdown (if not readOnly) | No |

#### Usage Example

```tsx
import { MachinesDataTable } from '@/components/settings/machines/MachinesDataTable'
import { useState } from 'react'

export function MachinesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})

  const { data, isLoading, error } = useMachines({ page, search, ...filters })

  return (
    <MachinesDataTable
      machines={data?.machines || []}
      total={data?.total || 0}
      page={page}
      limit={25}
      onPageChange={setPage}
      onSearch={setSearch}
      onFilter={setFilters}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isLoading={isLoading}
      error={error}
      readOnly={!canManageMachines}
    />
  )
}
```

#### States

**Loading**:
```tsx
<MachinesDataTable isLoading={true} machines={[]} total={0} page={1} limit={25} ... />
```
Displays 5 skeleton rows with shimmer animation.

**Empty**:
```tsx
<MachinesDataTable machines={[]} total={0} ... />
```
Shows "No machines found" with contextual message based on filters.

**Error**:
```tsx
<MachinesDataTable error="Failed to load machines" ... />
```
Displays error message with Retry button.

---

### 2. MachineModal

**File**: `MachineModal.tsx`

Create/edit modal with form validation and real-time code availability checking.

#### Props

```typescript
interface MachineModalProps {
  mode: 'create' | 'edit'     // Modal mode
  machine: Machine | null     // Existing machine (for edit mode)
  open: boolean               // Modal visibility
  onClose: () => void         // Close handler
  onSuccess: (machine: Machine) => void  // Success callback
}
```

#### Features

- **Real-time Code Validation**: Debounced 300ms code uniqueness check
- **Auto-uppercase**: Code field auto-uppercases on blur
- **Zod Validation**: Client-side schema validation before submit
- **Character Counters**: Description field shows 450/500 warning threshold
- **Location Dropdown**: Hierarchical location picker
- **Status Selection**: 4 operational statuses
- **Type Selection**: 9 machine types
- **Capacity Fields**: Optional units/hour, setup time, batch size
- **Error Handling**: Field-level and form-level error display

#### Form Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Code | Text | Yes | 1-50 chars, `^[A-Z0-9-]+$` | Auto-uppercase, uniqueness check |
| Name | Text | Yes | 1-100 chars | - |
| Type | Select | Yes | 9 machine types | See MachineType enum |
| Status | Select | No | 4 statuses | Default: ACTIVE |
| Units/Hour | Number | No | > 0 | Production rate |
| Setup Time | Number | No | >= 0 | Minutes |
| Max Batch Size | Number | No | > 0 | Integer |
| Location | Select | No | Valid location UUID | Dropdown from all locations |
| Description | Textarea | No | Max 500 chars | Character counter |

#### Usage Example

```tsx
import { MachineModal } from '@/components/settings/machines/MachineModal'
import { useState } from 'react'

export function MachinesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)

  const handleEdit = (machine: Machine) => {
    setSelectedMachine(machine)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedMachine(null)
    setModalOpen(true)
  }

  const handleSuccess = (machine: Machine) => {
    // Refresh machine list
    refetch()
    setModalOpen(false)
  }

  return (
    <>
      <Button onClick={handleCreate}>Create Machine</Button>

      <MachineModal
        mode={selectedMachine ? 'edit' : 'create'}
        machine={selectedMachine}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
```

#### Validation States

**Code Availability Check**:
```tsx
// Checking...
<p className="text-sm text-muted-foreground">Checking availability...</p>

// Available
<p className="text-sm text-green-600">Code available</p>

// Already exists
<p className="text-sm text-destructive">Code already exists</p>
```

**Field Errors**:
```tsx
// Display Zod validation errors inline
{errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
```

**Submit Errors**:
```tsx
// Display API errors at form bottom
{errors.submit && (
  <div className="rounded-md bg-destructive/10 p-3">
    <p className="text-sm text-destructive">{errors.submit}</p>
  </div>
)}
```

---

### 3. MachineTypeBadge

**File**: `MachineTypeBadge.tsx`

Displays machine type badge with color coding and icon.

#### Props

```typescript
interface MachineTypeBadgeProps {
  type: MachineType      // Machine type (9 types)
  showIcon?: boolean     // Show icon (default: true)
}
```

#### Machine Types (9 Total)

| Type | Color | Icon | Display Label |
|------|-------|------|---------------|
| MIXER | Blue | Waves | Mixer |
| OVEN | Orange | Flame | Oven |
| FILLER | Purple | Wind | Filler |
| PACKAGING | Green | Package | Packaging |
| CONVEYOR | Gray | Box | Conveyor |
| BLENDER | Cyan | Blend | Blender |
| CUTTER | Red | Scissors | Cutter |
| LABELER | Yellow | Tag | Labeler |
| OTHER | Slate | Settings | Other |

#### Color Scheme

- **Blue** (MIXER): `bg-blue-100 text-blue-800`
- **Orange** (OVEN): `bg-orange-100 text-orange-800`
- **Purple** (FILLER): `bg-purple-100 text-purple-800`
- **Green** (PACKAGING): `bg-green-100 text-green-800`
- **Gray** (CONVEYOR): `bg-gray-100 text-gray-800`
- **Cyan** (BLENDER): `bg-cyan-100 text-cyan-800`
- **Red** (CUTTER): `bg-red-100 text-red-800`
- **Yellow** (LABELER): `bg-yellow-100 text-yellow-800`
- **Slate** (OTHER): `bg-slate-100 text-slate-800`

#### Usage Example

```tsx
import { MachineTypeBadge } from '@/components/settings/machines/MachineTypeBadge'

// With icon (default)
<MachineTypeBadge type="MIXER" />

// Without icon
<MachineTypeBadge type="OVEN" showIcon={false} />
```

#### Rendering

```tsx
// Renders as:
<Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none font-medium">
  <Waves className="h-3 w-3 mr-1" />
  Mixer
</Badge>
```

---

### 4. MachineStatusBadge

**File**: `MachineStatusBadge.tsx`

Displays machine operational status badge with color coding.

#### Props

```typescript
interface MachineStatusBadgeProps {
  status: MachineStatus  // Machine status (4 statuses)
}
```

#### Machine Statuses (4 Total)

| Status | Color | Display Label | Meaning |
|--------|-------|---------------|---------|
| ACTIVE | Green | Active | Operational and available |
| MAINTENANCE | Yellow | Maintenance | Under maintenance |
| OFFLINE | Red | Offline | Temporarily offline |
| DECOMMISSIONED | Gray | Decommissioned | Permanently decommissioned |

#### Color Scheme

- **Green** (ACTIVE): `bg-green-100 text-green-800`
- **Yellow** (MAINTENANCE): `bg-yellow-100 text-yellow-800`
- **Red** (OFFLINE): `bg-red-100 text-red-800`
- **Gray** (DECOMMISSIONED): `bg-gray-100 text-gray-800`

#### Usage Example

```tsx
import { MachineStatusBadge } from '@/components/settings/machines/MachineStatusBadge'

<MachineStatusBadge status="ACTIVE" />
<MachineStatusBadge status="MAINTENANCE" />
```

#### Rendering

```tsx
// ACTIVE renders as:
<Badge variant="secondary" className="bg-green-100 text-green-800 border-none font-medium">
  Active
</Badge>

// MAINTENANCE renders as:
<Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none font-medium">
  Maintenance
</Badge>
```

---

### 5. MachineCapacityDisplay

**File**: `MachineCapacityDisplay.tsx`

Displays machine capacity information (units/hour, setup time, max batch size).

#### Props

```typescript
interface MachineCapacityDisplayProps {
  units_per_hour: number | null      // Production rate
  setup_time_minutes: number | null  // Setup time
  max_batch_size: number | null      // Max batch size
}
```

#### Display Format

- **All fields present**: `500 u/hr • 30 min setup • Max: 1000`
- **Partial fields**: `500 u/hr • 30 min setup`
- **No fields**: `-`

#### Usage Example

```tsx
import { MachineCapacityDisplay } from '@/components/settings/machines/MachineCapacityDisplay'

<MachineCapacityDisplay
  units_per_hour={500}
  setup_time_minutes={30}
  max_batch_size={1000}
/>
// Renders: "500 u/hr • 30 min setup • Max: 1000"

<MachineCapacityDisplay
  units_per_hour={null}
  setup_time_minutes={null}
  max_batch_size={null}
/>
// Renders: "-"
```

#### Rendering

```tsx
// With data:
<div className="text-sm text-muted-foreground">
  500 u/hr • 30 min setup • Max: 1000
</div>

// No data:
<span className="text-sm text-muted-foreground">-</span>
```

---

### 6. MachineLocationSelect

**File**: `MachineLocationSelect.tsx`

Hierarchical location dropdown with full_path display from all warehouses in the organization.

#### Props

```typescript
interface MachineLocationSelectProps {
  value: string | null       // Location UUID (null = unassigned)
  onChange: (value: string | null) => void  // Change handler
  disabled?: boolean         // Disable dropdown
  className?: string         // Additional CSS classes
}
```

#### Features

- **Auto-fetch Locations**: Fetches all locations on mount (`/api/v1/settings/locations?view=flat`)
- **Hierarchical Display**: Shows full_path (e.g., "WH-001/ZONE-A/A01/R01/B001")
- **Unassigned Option**: Allows null selection
- **Loading State**: Shows "Loading..." during fetch
- **Error Handling**: Logs errors, gracefully handles fetch failures

#### Usage Example

```tsx
import { MachineLocationSelect } from '@/components/settings/machines/MachineLocationSelect'
import { useState } from 'react'

export function MachineForm() {
  const [locationId, setLocationId] = useState<string | null>(null)

  return (
    <div>
      <Label>Location</Label>
      <MachineLocationSelect
        value={locationId}
        onChange={setLocationId}
      />
    </div>
  )
}
```

#### Dropdown Options

```tsx
// Option format:
<SelectItem value="unassigned">Unassigned</SelectItem>
<SelectItem value="loc-uuid-1">WH-001/ZONE-A/A01/R01/B001</SelectItem>
<SelectItem value="loc-uuid-2">WH-002/ZONE-B/B02/R03/B015</SelectItem>
```

#### Loading Behavior

1. On mount: Fetch all locations via API
2. While loading: Dropdown disabled, placeholder "Loading..."
3. On success: Populate dropdown with locations
4. On error: Log error, show empty dropdown

---

### 7. MachineFilters

**File**: `MachineFilters.tsx`

Filter controls for machines list (search, type, status).

#### Props

```typescript
interface MachineFiltersProps {
  searchValue: string                 // Current search value
  onSearchChange: (value: string) => void  // Search change handler
  typeFilter: string                  // Current type filter
  onTypeChange: (value: string) => void    // Type filter change
  statusFilter: string                // Current status filter
  onStatusChange: (value: string) => void  // Status filter change
}
```

#### Filter Controls

| Control | Type | Options | Default |
|---------|------|---------|---------|
| Search | Text Input | Free text | "" (all) |
| Type | Select | All types, 9 machine types | "All types" |
| Status | Select | All statuses, 4 statuses | "All statuses" |

#### Usage Example

```tsx
import { MachineFilters } from '@/components/settings/machines/MachineFilters'
import { useState } from 'react'

export function MachinesPage() {
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  return (
    <MachineFilters
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      typeFilter={typeFilter}
      onTypeChange={setTypeFilter}
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
    />
  )
}
```

#### Rendering

```tsx
<div className="flex gap-4">
  <Input
    placeholder="Search machines..."
    value={searchValue}
    onChange={(e) => onSearchChange(e.target.value)}
    className="flex-1"
  />

  <select value={typeFilter} onChange={...} className="w-[180px] ...">
    <option value="">All types</option>
    <option value="MIXER">Mixer</option>
    <option value="OVEN">Oven</option>
    <!-- ... -->
  </select>

  <select value={statusFilter} onChange={...} className="w-[180px] ...">
    <option value="">All statuses</option>
    <option value="ACTIVE">Active</option>
    <option value="MAINTENANCE">Maintenance</option>
    <!-- ... -->
  </select>
</div>
```

---

## Type Definitions

### Machine Interface

```typescript
interface Machine {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  type: MachineType
  status: MachineStatus
  units_per_hour: number | null
  setup_time_minutes: number | null
  max_batch_size: number | null
  location_id: string | null
  location?: MachineLocation | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}
```

### Machine Type Enum

```typescript
type MachineType =
  | 'MIXER'
  | 'OVEN'
  | 'FILLER'
  | 'PACKAGING'
  | 'CONVEYOR'
  | 'BLENDER'
  | 'CUTTER'
  | 'LABELER'
  | 'OTHER'
```

### Machine Status Enum

```typescript
type MachineStatus =
  | 'ACTIVE'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'DECOMMISSIONED'
```

### Location Reference

```typescript
interface MachineLocation {
  id: string
  code: string
  name: string
  full_path: string
  warehouse_id: string
}
```

---

## Styling Guidelines

### Badge Styling

All badges use `variant="secondary"` with color-specific background and text:

```tsx
<Badge variant="secondary" className="bg-{color}-100 text-{color}-800 border-none font-medium">
  Content
</Badge>
```

### Color Palette

- **Blue**: Mixing equipment
- **Orange**: Heating/baking equipment
- **Purple**: Filling equipment
- **Green**: Packaging, active status
- **Gray**: Conveyors, decommissioned
- **Cyan**: Blending equipment
- **Red**: Cutting equipment, offline status
- **Yellow**: Labeling equipment, maintenance status
- **Slate**: Other equipment

### Responsive Design

All components use responsive Tailwind classes:
- Mobile: Full-width inputs, stacked layout
- Tablet: 2-column grid
- Desktop: Multi-column layout with fixed widths

---

## Accessibility

### ARIA Labels

```tsx
// Buttons
<Button aria-label="Actions">...</Button>
<Button aria-label="Previous">...</Button>
<Button aria-label="Next">...</Button>

// Selects
<select aria-label="Filter by type">...</select>
<select aria-label="Filter by status">...</select>
<select aria-label="Type" id="type">...</select>
```

### Keyboard Navigation

- **Tab**: Navigate through inputs and buttons
- **Enter**: Submit form, trigger button actions
- **Escape**: Close modal
- **Arrow Keys**: Navigate dropdown options

### Screen Reader Support

- All form inputs have associated labels
- Error messages announced via `aria-live` regions
- Modals have `aria-modal="true"`
- Tables use semantic HTML (`<table>`, `<thead>`, `<tbody>`)

---

## Performance Optimizations

### Debouncing

Search input debounced 300ms:
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    onSearch(searchValue)
  }, 300)
  return () => clearTimeout(timer)
}, [searchValue, onSearch])
```

### Code Availability Check

Code uniqueness check debounced 300ms:
```tsx
const timer = setTimeout(async () => {
  setCodeValidating(true)
  const response = await fetch(`/api/v1/settings/machines/validate-code?code=${code}`)
  const data = await response.json()
  setCodeAvailable(data.available)
  setCodeValidating(false)
}, 300)
```

### Pagination

Default 25 items per page, max 100 to prevent performance issues.

---

## Error Handling

### API Errors

```tsx
try {
  const response = await fetch('/api/v1/settings/machines', { ... })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create machine')
  }
} catch (error) {
  if (error.message?.includes('already exists')) {
    setErrors({ code: 'Code already exists' })
  } else {
    setErrors({ submit: error.message })
  }
}
```

### Validation Errors

```tsx
try {
  machineCreateSchema.parse(formData)
} catch (error) {
  if (error instanceof ZodError) {
    const fieldErrors = {}
    error.errors.forEach((err) => {
      fieldErrors[err.path[0]] = err.message
    })
    setErrors(fieldErrors)
  }
}
```

---

## Testing

### Component Tests

```tsx
// MachineModal validation
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MachineModal } from './MachineModal'

test('validates required fields', async () => {
  render(<MachineModal mode="create" machine={null} open={true} ... />)

  fireEvent.click(screen.getByText('Create Machine'))

  await waitFor(() => {
    expect(screen.getByText(/code is required/i)).toBeInTheDocument()
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })
})
```

### Integration Tests

See `apps/frontend/__tests__/01-settings/01.10.machines-crud.test.tsx`

---

## Common Use Cases

### 1. Display Machine List

```tsx
import { MachinesDataTable } from '@/components/settings/machines/MachinesDataTable'

<MachinesDataTable
  machines={machines}
  total={total}
  page={page}
  limit={25}
  onPageChange={setPage}
  onSearch={setSearch}
  onFilter={setFilters}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 2. Create New Machine

```tsx
import { MachineModal } from '@/components/settings/machines/MachineModal'

<MachineModal
  mode="create"
  machine={null}
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onSuccess={(machine) => {
    console.log('Created:', machine)
    refetch()
  }}
/>
```

### 3. Display Machine Type Badge

```tsx
import { MachineTypeBadge } from '@/components/settings/machines/MachineTypeBadge'

<MachineTypeBadge type="MIXER" showIcon={true} />
```

### 4. Display Capacity Metrics

```tsx
import { MachineCapacityDisplay } from '@/components/settings/machines/MachineCapacityDisplay'

<MachineCapacityDisplay
  units_per_hour={500}
  setup_time_minutes={30}
  max_batch_size={1000}
/>
```

---

## Related Documentation

- [Machines API Documentation](../../api/settings/machines.md)
- [Machine Developer Guide](../../guides/machine-management.md)
- [Database Schema - Machines Table](../../database/migrations/machines.md)
- [Story 01.10 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.10.machines-crud.md)

---

**Document Version**: 1.0.0
**Story**: 01.10
**Status**: Implementation Complete
**Last Tested**: 2025-12-22
