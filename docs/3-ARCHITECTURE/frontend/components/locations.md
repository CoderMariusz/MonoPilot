# Location Components Documentation

**Story:** 01.9 - Warehouse Locations Management
**Module:** Settings > Warehouses > Locations
**Version:** 1.0
**Last Updated:** 2025-12-21

## Overview

This document covers the frontend components and hooks for managing hierarchical warehouse locations. The location system uses a 4-level tree structure (zone > aisle > rack > bin) with expand/collapse functionality, capacity indicators, and breadcrumb navigation.

**Note:** As of 2025-12-21, backend is complete but frontend components are **pending implementation** per code review.

---

## Component Architecture

```
LocationsPage
├── LocationTree (left panel, 40% width)
│   ├── LocationRow (per node)
│   │   ├── ExpandIcon
│   │   │   ├── LevelBadge
│   │   │   ├── CapacityIndicator
│   │   │   └── ActionMenu
│   │   └── LocationRow (recursive children)
│   └── LocationBreadcrumb (selected path)
└── LocationDetailsPanel (right panel, 60% width)
    ├── LocationModal (create/edit)
    └── LocationForm
```

---

## 1. LocationTree Component

**File:** `components/settings/locations/LocationTree.tsx`

### Purpose

Displays hierarchical locations as an expandable tree with 4 levels: zone > aisle > rack > bin.

### Props

```typescript
interface LocationTreeProps {
  warehouseId: string
  locations: LocationNode[]
  selectedId?: string
  onSelect: (location: LocationNode) => void
  onExpand: (locationId: string) => void
  onCollapse: (locationId: string) => void
  expandedIds: Set<string>
  onCreateChild?: (parentLocation: LocationNode) => void
  onEdit?: (location: LocationNode) => void
  onDelete?: (location: LocationNode) => void
}
```

### Usage Example

```tsx
import { LocationTree } from '@/components/settings/locations/LocationTree'
import { useLocationTree } from '@/lib/hooks/use-location-tree'

function LocationsPage({ warehouseId }: { warehouseId: string }) {
  const { locations, loading, expandedIds, toggleExpand } = useLocationTree(warehouseId)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  return (
    <LocationTree
      warehouseId={warehouseId}
      locations={locations}
      selectedId={selectedId}
      onSelect={(loc) => setSelectedId(loc.id)}
      onExpand={toggleExpand}
      onCollapse={toggleExpand}
      expandedIds={expandedIds}
    />
  )
}
```

### Features

1. **Recursive Tree Rendering**
   - 4-level nesting (zone → aisle → rack → bin)
   - Indentation: 16px per level
   - Expand/collapse icons (chevron right/down)

2. **Visual Hierarchy**
   - Level badges with color coding (blue/green/yellow/purple)
   - Type icons (bulk/pallet/shelf/floor/staging)
   - Depth-based indentation

3. **Interactions**
   - Click to select location
   - Click chevron to expand/collapse
   - Double-click to edit (optional)
   - Right-click for context menu (optional)

4. **State Management**
   - Tracks expanded nodes in Set
   - Persists expansion state during session
   - Highlights selected location

### Component States

| State | Description | UI Behavior |
|-------|-------------|-------------|
| **Loading** | Fetching locations | Skeleton tree with 3-5 placeholder rows |
| **Empty** | No locations | "No locations. Create your first zone." |
| **Expanded** | Node open | Chevron down, children visible |
| **Collapsed** | Node closed | Chevron right, children hidden |
| **Selected** | Node clicked | Blue background, bold text |
| **Error** | Fetch failed | Error message with retry button |

### Accessibility

- Keyboard navigation (arrow keys to expand/collapse, Enter to select)
- ARIA tree role with treeitem children
- aria-expanded on expandable nodes
- Focus management for keyboard users

---

## 2. LocationModal Component

**File:** `components/settings/locations/LocationModal.tsx`

### Purpose

Modal dialog for creating or editing locations with validation and hierarchy enforcement.

### Props

```typescript
interface LocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string
  parentLocation?: Location  // Pre-select parent if creating child
  location?: Location        // Edit mode if provided
  onSuccess: () => void
}
```

### Usage Example

```tsx
import { LocationModal } from '@/components/settings/locations/LocationModal'

function LocationManagement({ warehouseId }: { warehouseId: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | undefined>()

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Create Location</Button>

      <LocationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        warehouseId={warehouseId}
        location={editingLocation}
        onSuccess={() => {
          setModalOpen(false)
          refetchLocations()
        }}
      />
    </>
  )
}
```

### Form Sections

#### 1. Identity Section

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| **Code** | Text input | Yes | 1-50 chars, uppercase alphanumeric + hyphens, auto-uppercase |
| **Name** | Text input | Yes | 2-255 chars |
| **Description** | Textarea | No | Max 1000 chars |

#### 2. Hierarchy Section

| Field | Type | Notes |
|-------|------|-------|
| **Parent** | Select dropdown | Filtered by valid parents, null for zones |
| **Level** | Badge (read-only) | Auto-set based on parent (zone if no parent, aisle if parent=zone, etc.) |

**Parent Dropdown Filtering:**
- Creating **zone**: Parent = null (disabled)
- Creating **aisle**: Parent = zones only
- Creating **rack**: Parent = aisles only
- Creating **bin**: Parent = racks only

#### 3. Type Section

| Field | Type | Options |
|-------|------|---------|
| **Location Type** | Select | Bulk, Pallet, Shelf, Floor, Staging (with descriptions) |

Dropdown shows:
```
Bulk Storage - Large capacity storage for bulk items
Pallet - Standard pallet rack storage
Shelf - Shelving unit for smaller items
Floor - Floor-level storage area
Staging - Temporary staging area for in/out processing
```

#### 4. Capacity Section

| Field | Type | Validation |
|-------|------|------------|
| **Max Pallets** | Number input | Optional, integer > 0 |
| **Max Weight (kg)** | Number input | Optional, decimal > 0, 2 decimal places |

Helper text: "Leave empty for unlimited capacity"

#### 5. Status Section

| Field | Type | Default |
|-------|------|---------|
| **Active** | Toggle switch | true |

### Validation Rules

```typescript
// Code validation
code: z.string()
  .min(1, 'Code is required')
  .max(50, 'Code must be less than 50 characters')
  .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
  .transform(val => val.toUpperCase())

// Name validation
name: z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(255, 'Name must be less than 255 characters')

// Hierarchy validation (runtime)
if (parent_id === null && level !== 'zone') {
  throw new Error('Root locations must be zones')
}
```

### Error Handling

| Error | Display |
|-------|---------|
| **Duplicate code** | Toast: "Location code 'ZONE-A' already exists in this warehouse" |
| **Invalid hierarchy** | Toast: "Locations under zones must be aisles" |
| **Warehouse not found** | Toast: "Warehouse not found" |
| **Network error** | Toast: "Failed to save location. Please try again." |

### Form Modes

#### Create Mode

- Title: "Create Location"
- All fields enabled
- Submit button: "Create Location"
- Level auto-set based on parent

#### Edit Mode

- Title: "Edit Location - {code}"
- **Immutable fields disabled:** code, level, parent_id
- Submit button: "Save Changes"
- Shows current values

---

## 3. CapacityIndicator Component

**File:** `components/settings/locations/CapacityIndicator.tsx`

### Purpose

Displays current capacity as a visual progress bar with color-coded thresholds.

### Props

```typescript
interface CapacityIndicatorProps {
  current: number
  max: number | null
  unit: 'pallets' | 'kg'
  size?: 'sm' | 'md'
  showLabel?: boolean
}
```

### Usage Example

```tsx
import { CapacityIndicator } from '@/components/settings/locations/CapacityIndicator'

// Pallet capacity
<CapacityIndicator
  current={15}
  max={20}
  unit="pallets"
  size="sm"
/>

// Weight capacity
<CapacityIndicator
  current={3750.5}
  max={5000}
  unit="kg"
  size="md"
  showLabel
/>

// Unlimited capacity
<CapacityIndicator
  current={100}
  max={null}
  unit="pallets"
/>
```

### Visual Design

```
┌─────────────────────────────────┐
│ 15/20 pallets (75%)             │
│ ████████████████░░░░░░░░  75%   │ ← Yellow (warning)
└─────────────────────────────────┘
```

### Color Thresholds

| Percent | Color | CSS Class | Description |
|---------|-------|-----------|-------------|
| 0-69% | Green | `bg-green-500` | Normal capacity |
| 70-89% | Yellow | `bg-yellow-500` | Warning threshold |
| 90-100% | Red | `bg-red-500` | Near/at full capacity |
| null (unlimited) | Gray | `bg-gray-300` | No limit set |

### Size Variants

| Size | Height | Font Size | Use Case |
|------|--------|-----------|----------|
| `sm` | 8px | 12px | Tree view compact |
| `md` | 12px | 14px | Detail panel |

### Display Logic

```typescript
function CapacityIndicator({ current, max, unit }: Props) {
  if (max === null) {
    return <span className="text-gray-500">Unlimited</span>
  }

  const percent = (current / max) * 100
  const color = percent >= 90 ? 'red' : percent >= 70 ? 'yellow' : 'green'

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{current}/{max} {unit} ({percent.toFixed(0)}%)</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-full rounded-full bg-${color}-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
```

---

## 4. LocationBreadcrumb Component

**File:** `components/settings/locations/LocationBreadcrumb.tsx`

### Purpose

Displays full hierarchical path with clickable navigation segments.

### Props

```typescript
interface LocationBreadcrumbProps {
  fullPath: string  // "WH-001/ZONE-A/A01/R01/B001"
  onClick?: (segment: string, index: number) => void
  separator?: React.ReactNode
}
```

### Usage Example

```tsx
import { LocationBreadcrumb } from '@/components/settings/locations/LocationBreadcrumb'

<LocationBreadcrumb
  fullPath="WH-001/ZONE-A/A01/R01/B001"
  onClick={(segment, index) => {
    console.log(`Navigate to: ${segment} at level ${index}`)
  }}
  separator={<ChevronRight className="h-4 w-4" />}
/>
```

### Visual Design

```
WH-001 > ZONE-A > A01 > R01 > B001
  └─warehouse └─zone  └─aisle └─rack └─bin (current, bold)
```

### Implementation

```typescript
function LocationBreadcrumb({ fullPath, onClick }: Props) {
  const segments = fullPath.split('/')

  return (
    <nav className="flex items-center gap-2 text-sm">
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          <button
            onClick={() => onClick?.(segment, index)}
            className={cn(
              "hover:underline",
              index === segments.length - 1 && "font-bold text-gray-900"
            )}
          >
            {segment}
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}
```

### Behavior

- **Click warehouse:** Navigate to warehouse detail page
- **Click zone/aisle/rack:** Expand that node in tree and scroll to it
- **Current segment:** Bold, not clickable
- **Hover:** Underline on clickable segments

---

## 5. LocationRow Component

**File:** `components/settings/locations/LocationRow.tsx`

### Purpose

Single row in the location tree with expand/collapse, badges, and actions.

### Props

```typescript
interface LocationRowProps {
  location: LocationNode
  depth: number
  isExpanded: boolean
  isSelected: boolean
  onExpand: () => void
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onCreateChild: () => void
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ ▼ ZONE-A  [Zone] [Bulk]  ████████ 75%  (10 children) ⋮ │
│   ▶ A01   [Aisle] [Pallet]  ░░░░░░ 20%  (5 children) ⋮ │
│     ▶ R01 [Rack] [Shelf]  ██████ 60%  (4 children)   ⋮ │
└─────────────────────────────────────────────────────────┘
 │   │  │      │      │         │          │            │
 └───┴──┴──────┴──────┴─────────┴──────────┴────────────┘
expand depth  badges  capacity   children  actions
icon   indent        type        count     menu
```

### Layout

| Element | Width | Description |
|---------|-------|-------------|
| Expand icon | 24px | Chevron right/down (hidden if no children) |
| Indentation | depth * 16px | Depth-based left padding |
| Code | auto | Location code (bold) |
| Level badge | 60px | Zone/Aisle/Rack/Bin |
| Type badge | 80px | Bulk/Pallet/Shelf/Floor/Staging |
| Capacity | 120px | Progress bar |
| Children count | 80px | "(N children)" text |
| Actions menu | 32px | 3-dot menu |

### Actions Menu

```
⋮ (menu button)
  ├─ Edit
  ├─ Create Child (disabled for bins)
  ├─ Delete
  └─ View Details
```

---

## Hooks

### 1. useLocationTree Hook

**File:** `lib/hooks/use-location-tree.ts`

#### Purpose

Manages location tree state with expand/collapse and data fetching.

#### API

```typescript
function useLocationTree(warehouseId: string) {
  return {
    locations: LocationNode[]
    loading: boolean
    error: Error | null
    expandedIds: Set<string>
    toggleExpand: (id: string) => void
    expandAll: () => void
    collapseAll: () => void
    refetch: () => Promise<void>
  }
}
```

#### Usage

```tsx
const {
  locations,
  loading,
  expandedIds,
  toggleExpand,
  expandAll
} = useLocationTree('wh_001')

if (loading) return <Skeleton />

return (
  <>
    <Button onClick={expandAll}>Expand All</Button>
    <LocationTree
      locations={locations}
      expandedIds={expandedIds}
      onExpand={toggleExpand}
    />
  </>
)
```

---

### 2. useCreateLocation Hook

**File:** `lib/hooks/use-create-location.ts`

#### Purpose

Mutation hook for creating locations.

#### API

```typescript
function useCreateLocation(warehouseId: string) {
  return {
    createLocation: (data: CreateLocationInput) => Promise<Location>
    loading: boolean
    error: Error | null
  }
}
```

#### Usage

```tsx
const { createLocation, loading } = useCreateLocation('wh_001')

const handleSubmit = async (data: CreateLocationInput) => {
  try {
    const location = await createLocation(data)
    toast.success(`Location ${location.code} created successfully`)
  } catch (error) {
    toast.error(error.message)
  }
}
```

---

### 3. useUpdateLocation Hook

**File:** `lib/hooks/use-update-location.ts`

#### API

```typescript
function useUpdateLocation(warehouseId: string) {
  return {
    updateLocation: (id: string, data: UpdateLocationInput) => Promise<Location>
    loading: boolean
    error: Error | null
  }
}
```

---

### 4. useDeleteLocation Hook

**File:** `lib/hooks/use-delete-location.ts`

#### API

```typescript
function useDeleteLocation(warehouseId: string) {
  return {
    deleteLocation: (id: string) => Promise<void>
    canDelete: (id: string) => Promise<CanDeleteResult>
    loading: boolean
    error: Error | null
  }
}
```

#### Usage

```tsx
const { deleteLocation, canDelete, loading } = useDeleteLocation('wh_001')

const handleDelete = async (locationId: string) => {
  const { can, reason, count } = await canDelete(locationId)

  if (!can) {
    if (reason === 'HAS_CHILDREN') {
      toast.error(`Cannot delete - location has ${count} children. Delete them first.`)
    } else if (reason === 'HAS_INVENTORY') {
      toast.error(`Cannot delete - location has ${count} inventory items. Relocate first.`)
    }
    return
  }

  const confirmed = await confirmDialog('Delete location?')
  if (confirmed) {
    await deleteLocation(locationId)
    toast.success('Location deleted')
  }
}
```

---

## Page Layout

**File:** `app/(authenticated)/settings/warehouses/[id]/locations/page.tsx`

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Settings > Warehouses > WH-001 > Locations     │
├─────────────────────────────────────────────────────────────┤
│ Toolbar: [Create Zone] [Type Filter ▼] [Search...]         │
├─────────────┬───────────────────────────────────────────────┤
│ Tree (40%)  │ Details Panel (60%)                           │
│             │                                               │
│ ▼ ZONE-A    │ Selected: ZONE-A / A01 / R01 / B001         │
│   ▼ A01     │                                               │
│     ▼ R01   │ Code: B001                                    │
│       • B001│ Name: Bin 001                                 │
│       • B002│ Level: Bin                                    │
│     • R02   │ Type: Pallet                                  │
│   • A02     │ Capacity: 3/4 pallets (75%)                   │
│ • ZONE-B    │                                               │
│             │ Actions: [Edit] [Delete] [Create Child]      │
└─────────────┴───────────────────────────────────────────────┘
```

### Toolbar Actions

| Action | Icon | Behavior |
|--------|------|----------|
| **Create Zone** | Plus icon | Opens LocationModal with parent=null, level=zone |
| **Type Filter** | Filter icon | Dropdown: All, Bulk, Pallet, Shelf, Floor, Staging |
| **Search** | Magnifying glass | Debounced search by code or name (300ms) |
| **Expand All** | Chevrons down | Expands all tree nodes |
| **Collapse All** | Chevrons up | Collapses all tree nodes |

---

## Component States

### Loading State

```tsx
<div className="space-y-2">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full ml-4" />
  <Skeleton className="h-10 w-full ml-8" />
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <PackageIcon className="h-12 w-12 text-gray-400 mb-4" />
  <h3 className="text-lg font-semibold">No locations yet</h3>
  <p className="text-gray-500 mb-4">
    Create your first zone to organize warehouse storage
  </p>
  <Button onClick={() => setModalOpen(true)}>
    Create Zone
  </Button>
</div>
```

### Error State

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to load locations. {error.message}
    <Button variant="link" onClick={refetch}>Try again</Button>
  </AlertDescription>
</Alert>
```

---

## Styling & Theming

### Level Badge Colors

```typescript
const LEVEL_COLORS = {
  zone: 'bg-blue-100 text-blue-800 border-blue-200',
  aisle: 'bg-green-100 text-green-800 border-green-200',
  rack: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  bin: 'bg-purple-100 text-purple-800 border-purple-200',
}
```

### Type Icons

| Type | Icon | Tailwind Class |
|------|------|----------------|
| Bulk | Package | `text-blue-600` |
| Pallet | Layers | `text-green-600` |
| Shelf | BookOpen | `text-yellow-600` |
| Floor | Grid | `text-gray-600` |
| Staging | ArrowRightLeft | `text-purple-600` |

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| **Arrow Up/Down** | Navigate between tree nodes |
| **Arrow Right** | Expand node |
| **Arrow Left** | Collapse node |
| **Enter** | Select node |
| **Space** | Toggle expand/collapse |
| **Tab** | Move focus to next element |

### ARIA Attributes

```tsx
<div role="tree" aria-label="Location hierarchy">
  <div role="treeitem" aria-expanded={isExpanded} aria-level={depth}>
    <button aria-label={`Expand ${location.name}`}>...</button>
  </div>
</div>
```

### Screen Reader Support

- Announces level and depth ("Zone at depth 1")
- Announces expanded state ("Collapsed, press Enter to expand")
- Announces capacity ("75% capacity, 15 of 20 pallets")

---

## Testing Checklist

### Unit Tests

- [ ] LocationTree renders tree structure correctly
- [ ] CapacityIndicator shows correct colors
- [ ] LocationBreadcrumb splits path correctly
- [ ] LocationModal validates form fields
- [ ] Hooks handle loading/error states

### Integration Tests

- [ ] Create location via modal
- [ ] Expand/collapse tree nodes
- [ ] Edit location updates UI
- [ ] Delete location removes from tree
- [ ] Search filters locations

### E2E Tests

- [ ] Create full 4-level hierarchy
- [ ] Navigate via breadcrumb
- [ ] Capacity indicator updates
- [ ] Delete blocked with children
- [ ] Delete blocked with inventory

---

## Related Documentation

- **API Documentation:** `docs/3-ARCHITECTURE/api/settings/locations.md`
- **Database Schema:** `docs/3-ARCHITECTURE/database/migrations/locations-hierarchy.md`
- **Developer Guide:** `docs/3-ARCHITECTURE/guides/location-hierarchy.md`
- **Story Specification:** `docs/2-MANAGEMENT/epics/current/01-settings/01.9.locations-crud.md`

---

**Document Version:** 1.0
**Story:** 01.9
**Status:** Specification Complete, Implementation Pending
**Last Updated:** 2025-12-21
