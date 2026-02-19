# BOM Items Components

**Module**: Technical
**Story**: 02.5a - BOM Items Core (MVP)
**Components**: BOMItemsTable, BOMItemModal
**Status**: Production ✅

## Overview

Two React components manage the display and editing of BOM items:

1. **BOMItemsTable** - Read-only list view with all 4 UI states
2. **BOMItemModal** - Form for creating and editing items

Both handle permissions, validation, and user feedback.

---

## BOMItemsTable Component

**File**: `components/technical/bom/BOMItemsTable.tsx`

Displays a table of BOM items with product details, quantities, operations, and actions.

### Props

```typescript
interface BOMItemsTableProps {
  /** BOM ID for context */
  bomId: string

  /** List of BOM items to display */
  items: BOMItem[]

  /** Whether data is loading */
  isLoading?: boolean

  /** Error message if fetch failed */
  error?: string | null

  /** Whether user can edit (has technical.U/D permissions) */
  canEdit?: boolean

  /** BOM expected output quantity (for footer) */
  bomOutputQty?: number

  /** BOM expected output UoM (for footer) */
  bomOutputUom?: string

  /** Callback when Add button is clicked */
  onAdd?: () => void

  /** Callback when Edit is clicked on an item */
  onEdit?: (item: BOMItem) => void

  /** Callback when Delete is clicked on an item */
  onDelete?: (item: BOMItem) => void

  /** Callback to retry loading on error */
  onRetry?: () => void
}
```

### Usage

```typescript
import { BOMItemsTable } from '@/components/technical/bom/BOMItemsTable'
import { useBOMItems } from '@/lib/hooks/use-bom-items'

function BOMDetail({ bomId }) {
  const { data, isLoading, error } = useBOMItems(bomId)
  const [selectedItem, setSelectedItem] = useState<BOMItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEdit = (item: BOMItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = (item: BOMItem) => {
    // Show confirmation dialog...
  }

  const handleAdd = () => {
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleRetry = () => {
    // Refetch data
  }

  return (
    <>
      <BOMItemsTable
        bomId={bomId}
        items={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        canEdit={user.hasPermission('technical.U')}
        bomOutputQty={data?.bom_output_qty}
        bomOutputUom={data?.bom_output_uom}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRetry={handleRetry}
      />

      {isModalOpen && (
        <BOMItemModal
          bomId={bomId}
          item={selectedItem}
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  )
}
```

### UI States

The table renders one of 4 states:

#### 1. Loading State

Shows skeleton rows while data loads:

```
BOM Items
-----------
[skeleton] [skeleton] [skeleton]
[skeleton] [skeleton] [skeleton]
[skeleton] [skeleton] [skeleton]
```

**Code**:
```typescript
if (isLoading) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
```

#### 2. Error State

Shows error alert with retry button:

```
! Failed to Load BOM Items

Error: BOM not found or you don't have permission.

[← Back]  [Retry]
```

**Code**:
```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to Load BOM Items</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      <Button onClick={onRetry} variant="outline" size="sm">
        Retry
      </Button>
    </Alert>
  )
}
```

#### 3. Empty State

Shows when no items exist:

```
BOM Items

        [box icon]

    No components added yet

A BOM needs at least one component to define the recipe.

    [+ Add First Component]

Tip: Start by adding raw materials, then ingredients and packaging.
```

**Code**:
```typescript
if (items.length === 0) {
  return (
    <div className="text-center py-12">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="font-semibold mb-2">No components added yet</h3>
      <p className="text-sm text-gray-600 mb-6">
        A BOM needs at least one component to define the recipe.
      </p>
      <Button onClick={onAdd} size="lg">
        + Add First Component
      </Button>
    </div>
  )
}
```

#### 4. Success State

Shows table with items:

```
BOM Items                                    [+ Add Item]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seq | Component        | Type | Qty    | UoM | Operation | Actions
10  | RM-001           | RM   | 50.000 | kg  | Op 1: Mix | [v]
    | Wheat Flour      |      |        |     |           |
    | Scrap: 2.0%
20  | ING-002          | ING  |  5.000 | kg  | Op 1: Mix | [v]
    | Honey Organic    |      |        |     |           |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Items: 2
Total Input: 55 kg
Expected Output: 100 kg
```

### Columns

| Column | Width | Content | Notes |
|--------|-------|---------|-------|
| Seq | 60px | Sequence number | Right-aligned, monospace |
| Component | 250px | Product code + name | Two lines, bold code + muted name |
| Type | 80px | RM/ING/PKG/WIP badge | Color-coded: blue/amber/purple/green |
| Qty | 100px | Quantity | Right-aligned, 3 decimals |
| UoM | 80px | Unit of measure | Left-aligned |
| Operation | 150px | "Op N: Name" or "-" | Comes from routing |
| Actions | 80px | [v] dropdown | Edit/Delete options |

### Type Badges

```typescript
const TYPE_BADGE_CONFIG = {
  RM: {
    label: 'Raw Material',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ING: {
    label: 'Ingredient',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  PKG: {
    label: 'Packaging',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  WIP: {
    label: 'Work in Progress',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
}
```

### Scrap Display

If `scrap_percent > 0`, a sub-row displays under the main row:

```
10 | RM-001             | RM   | 50.000 | kg  | Op 1: Mix | [v]
   | Wheat Flour Premium|      |        |     |           |
   | Scrap: 2.0%
```

**Code**:
```typescript
{scrap_percent > 0 && (
  <TableRow className="hover:bg-transparent border-0">
    <TableCell colSpan={7} className="text-sm text-muted-foreground">
      Scrap: {scrap_percent.toFixed(1)}%
    </TableCell>
  </TableRow>
)}
```

### Footer Summary

Displays aggregated totals at bottom:

```
Total Items: 2
Total Input: 55 kg
Expected Output: 100 kg
```

**Calculations**:
```typescript
const totalItems = items.length
const inputByUoM = items.reduce((acc, item) => {
  acc[item.uom] = (acc[item.uom] || 0) + item.quantity
  return acc
}, {} as Record<string, number>)
const totalInput = Object.entries(inputByUoM)
  .map(([uom, qty]) => `${qty.toFixed(3)} ${uom}`)
  .join(' + ')
```

### Permission Handling

When `canEdit={false}`:
- "Add Item" button is hidden
- Actions dropdown (Edit/Delete) is hidden
- Table is read-only

```typescript
{canEdit && (
  <Button onClick={onAdd} size="sm">
    + Add Item
  </Button>
)}

// In actions column:
{canEdit && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => onEdit(item)}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDelete(item)}>
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

### Accessibility

- Table has `aria-label="BOM items table"`
- All headers have descriptive `aria-label`
- Loading state has `aria-busy="true"`
- Actions dropdown has `aria-label="Actions for {product_code}"`
- Error alert has `role="alert"` (announces to screen readers)

---

## BOMItemModal Component

**File**: `components/technical/bom/BOMItemModal.tsx`

Modal form for creating and editing BOM items.

### Props

```typescript
interface BOMItemModalProps {
  /** BOM ID */
  bomId: string

  /** Item to edit (null for create mode) */
  item?: BOMItem | null

  /** Whether modal is open */
  isOpen: boolean

  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void

  /** Callback when item is successfully saved */
  onSuccess?: (response: BOMItemResponse) => void

  /** Callback when save fails */
  onError?: (error: Error) => void
}
```

### Usage

```typescript
import { BOMItemModal } from '@/components/technical/bom/BOMItemModal'
import { useState } from 'react'

function BOMDetail({ bomId }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BOMItem | null>(null)

  const handleAddItem = () => {
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleEditItem = (item: BOMItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  return (
    <>
      <BOMItemModal
        bomId={bomId}
        item={selectedItem}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          setIsModalOpen(false)
          // Refetch items...
        }}
        onError={(error) => {
          console.error('Failed to save:', error.message)
        }}
      />
    </>
  )
}
```

### Form Fields

#### Product Selector (Required)

Searchable dropdown filtered to RM/ING/PKG/WIP types:

```
Component *
┌─────────────────────────────────────────────┐
│ Search materials, ingredients...          v │
└─────────────────────────────────────────────┘

Selected: RM-001 - Wheat Flour Premium
Type: Raw Material | Base UoM: kg
```

**Features**:
- Debounced search (300ms)
- Search by product code or name
- Displays product type and base UoM
- Read-only in edit mode (cannot change component)

**Code**:
```typescript
<Combobox
  items={products}
  displayValue={selectedProduct?.name}
  onValueChange={(product) => {
    setValue('product_id', product.id)
    setValue('uom', product.base_uom) // Auto-fill UoM
  }}
  placeholder="Search materials, ingredients, packaging..."
/>
```

#### Quantity (Required)

Number input with 6 decimal places:

```
Quantity *
┌──────────────┐
│ 50.000000    │
└──────────────┘
Amount needed per batch (100 kg output)
```

**Validation**:
- Must be > 0
- Max 6 decimal places
- Shows inline error if invalid

#### Unit of Measure (Auto-filled, Read-only)

Auto-populated from product's `base_uom`, grey background:

```
Unit of Measure
┌──────────────┐
│ kg (from...)  │  [disabled/grey]
└──────────────┘
```

#### Sequence (Optional)

Order in production, auto-calculated:

```
Sequence
┌──────────────┐
│ 10           │
└──────────────┘
Order in production (auto: max+10)
```

#### Scrap Allowance (Optional)

Expected material loss, 0-100:

```
Scrap Allowance %
┌──────────────┐
│ 2.0          │
└──────────────┘
Expected material loss
```

#### Operation Assignment (Optional)

Dropdown populated from BOM's routing operations:

```
Operation Assignment (Optional)
┌──────────────────────────────┐
│ Op 10: Mixing              v │
└──────────────────────────────┘
Links this item to specific production step
```

**If no routing assigned**:

```
Operation Assignment (Optional)
┌──────────────────────────────┐
│ [i] Assign a routing to BOM first to enable operation assignment
│ [Change Routing]             │
└──────────────────────────────┘
```

**Code**:
```typescript
if (!bom?.routing_id) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Assign a routing to BOM first to enable operation assignment
      </AlertDescription>
    </Alert>
  )
}

return (
  <Select value={watch('operation_seq')} onValueChange={(value) => {
    setValue('operation_seq', value === 'none' ? null : parseInt(value))
  }}>
    <SelectTrigger>
      <SelectValue placeholder="Select operation..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">None</SelectItem>
      {operations.map((op) => (
        <SelectItem key={op.sequence} value={op.sequence.toString()}>
          Op {op.sequence}: {op.operation_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
```

#### Notes (Optional)

Textarea with character counter:

```
Notes (Optional)
┌──────────────────────────────┐
│ Store in dry area below 20C. │
│ Mix for 5 minutes minimum.   │
└──────────────────────────────┘
(50/500 characters)
```

### Modal States

#### Create Mode

```
Add Component to BOM                            [X]

Component * (Required)
[Search...]

Quantity * | Unit of Measure
[50]       | [kg]

Sequence | Scrap %
[10]     | [2.0]

Operation Assignment
[Select operation...]

Notes
[...]

[Cancel]                            [Save]
```

#### Edit Mode

```
Edit Component: RM-001 Wheat Flour Premium     [X]

Component (Cannot change)
RM-001 - Wheat Flour Premium
Type: Raw Material | Base UoM: kg
[i] To change component, delete and add new one

Quantity * | Unit of Measure
[75]       | [kg]

[... rest same as create ...]

[Cancel]                            [Save Changes]
```

### Validation

Uses Zod schemas with React Hook Form:

```typescript
const form = useForm({
  resolver: zodResolver(createBOMItemSchema),
  defaultValues: {
    product_id: item?.product_id || '',
    quantity: item?.quantity || 0,
    uom: item?.uom || '',
    sequence: item?.sequence || 0,
    operation_seq: item?.operation_seq || null,
    scrap_percent: item?.scrap_percent || 0,
    notes: item?.notes || '',
  },
})

const { handleSubmit, formState: { errors } } = form
```

### Error Handling

**Client-side validation errors** appear inline:

```
Quantity *
┌──────────────┐
│ 0        [!] │
└──────────────┘
[!] Quantity must be greater than 0
```

**Server-side validation errors** appear in alert:

```
┌──────────────────────────────┐
│ [!] Validation Errors
│
│ - Operation does not exist in routing
│ - Scrap percentage must be between 0 and 100
└──────────────────────────────┘
```

### UoM Mismatch Warning

Non-blocking amber alert:

```
┌──────────────────────────────┐
│ [!] Warning
│
│ UoM mismatch: component base UoM is 'kg',
│ you entered 'L'. Unit conversion may be required.
│
│ You can still save this item, but verify correct.
└──────────────────────────────┘

[Save button ENABLED]
```

**Code**:
```typescript
if (selectedProduct && watch('uom') !== selectedProduct.base_uom) {
  return (
    <Alert variant="destructive" className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        UoM mismatch: component base UoM is '{selectedProduct.base_uom}',
        you entered '{watch('uom')}'. Unit conversion may be required.
      </AlertDescription>
    </Alert>
  )
}
```

### Auto-Sequence Logic

When opening add modal, pre-fills next sequence:

```typescript
const handleOpen = async () => {
  const nextSeq = await getNextSequence(bomId)
  form.setValue('sequence', nextSeq)
}
```

For BOM with items 10, 20, 30: next sequence is 40

### Submission

On save, calls service function and handles response:

```typescript
const onSubmit = async (data) => {
  try {
    if (item) {
      // Update existing
      const response = await updateBOMItem(bomId, item.id, data)
    } else {
      // Create new
      const response = await createBOMItem(bomId, data)
    }

    // Check for warnings
    if (response.warnings.length > 0) {
      console.warn('Warnings:', response.warnings)
    }

    onSuccess?.(response)
    onOpenChange(false)
  } catch (error) {
    setServerError(error.message)
  }
}
```

### Accessibility

- Dialog role with aria-labelledby
- All inputs have labels
- Error messages announced as alerts
- Keyboard navigation: Tab/Shift+Tab, Escape to close
- Focus management: Focus moves to first field on open

---

## Integration with Data Fetching

### React Query Hooks

```typescript
import { useBOMItems, useCreateBOMItem, useUpdateBOMItem, useDeleteBOMItem } from '@/lib/hooks/use-bom-items'

function BOMDetail({ bomId }) {
  // Get items
  const { data, isLoading, error } = useBOMItems(bomId)

  // Create item mutation
  const { mutate: createItem, isPending: isCreating } = useCreateBOMItem()

  // Update item mutation
  const { mutate: updateItem, isPending: isUpdating } = useUpdateBOMItem()

  // Delete item mutation
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteBOMItem()

  return (
    <>
      <BOMItemsTable
        items={data?.items ?? []}
        isLoading={isLoading}
        onAdd={() => {
          createItem(
            { bomId, data: formData },
            {
              onSuccess: () => {
                // Table auto-refetches via query invalidation
              },
            }
          )
        }}
      />
    </>
  )
}
```

---

## Testing

### Unit Test Example

```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { BOMItemsTable } from '@/components/technical/bom/BOMItemsTable'

describe('BOMItemsTable', () => {
  it('renders loading skeleton', () => {
    render(
      <BOMItemsTable
        bomId="bom-uuid"
        items={[]}
        isLoading={true}
        canEdit={true}
      />
    )

    expect(screen.getByRole('status')).toBeInTheDocument() // Skeleton
  })

  it('renders empty state', () => {
    render(
      <BOMItemsTable
        bomId="bom-uuid"
        items={[]}
        isLoading={false}
        canEdit={true}
      />
    )

    expect(screen.getByText('No components added yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add First Component/i })).toBeInTheDocument()
  })

  it('renders error state', () => {
    render(
      <BOMItemsTable
        bomId="bom-uuid"
        items={[]}
        isLoading={false}
        error="Failed to load items"
        canEdit={true}
      />
    )

    expect(screen.getByText(/Failed to load items/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })

  it('renders items with scrap display', () => {
    const items = [
      {
        id: '1',
        sequence: 10,
        product_code: 'RM-001',
        product_name: 'Flour',
        product_type: 'RM',
        quantity: 50,
        uom: 'kg',
        scrap_percent: 2.0,
      },
    ]

    render(
      <BOMItemsTable
        bomId="bom-uuid"
        items={items}
        isLoading={false}
        canEdit={true}
      />
    )

    expect(screen.getByText('50.000')).toBeInTheDocument()
    expect(screen.getByText('Scrap: 2.0%')).toBeInTheDocument()
  })

  it('hides edit/delete actions when canEdit=false', () => {
    const items = [{ id: '1', sequence: 10, /* ... */ }]

    const { rerender } = render(
      <BOMItemsTable
        bomId="bom-uuid"
        items={items}
        isLoading={false}
        canEdit={true}
      />
    )

    expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument()

    rerender(
      <BOMItemsTable
        bomId="bom-uuid"
        items={items}
        isLoading={false}
        canEdit={false}
      />
    )

    expect(screen.queryByRole('button', { name: /Add Item/i })).not.toBeInTheDocument()
  })
})
```

---

## Related Files

- `/lib/hooks/use-bom-items.ts` - React Query hooks
- `/lib/validation/bom-items.ts` - Zod schemas
- `/lib/types/bom-items.ts` - TypeScript types
- `/lib/services/bom-items-service.ts` - Service layer
- `/__tests__/BOMItemsTable.test.tsx` - Component tests

