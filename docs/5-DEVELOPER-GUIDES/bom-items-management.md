# BOM Items Management - Developer Guide

**Module**: Technical
**Story**: 02.5a - BOM Items Core (MVP)
**Audience**: Backend and Frontend Developers
**Status**: Production ✅

## Quick Start

This guide explains BOM Items - the components that make up a Bill of Materials. Think of a BOM as a recipe: you list all ingredients, their quantities, and which production steps use them.

### Basic Concepts

**BOM (Bill of Materials)**:
- A recipe or formula for a finished product
- Contains multiple items (ingredients, raw materials, packaging)
- Each item has a quantity, unit of measure, and optional operation assignment

**BOM Item**:
- One component in a BOM
- Can be raw material (RM), ingredient (ING), packaging (PKG), or work-in-progress (WIP)
- Always has a sequence number for ordering
- Quantity must be > 0

**Sequence**:
- Numbers that define the order of items in production
- Auto-incremented by 10 (10, 20, 30, etc.) by default
- Can be manually overridden
- No uniqueness constraint (items can have same sequence)

**UoM (Unit of Measure)**:
- How quantity is measured (kg, L, pcs, etc.)
- Auto-filled from product's base UoM
- Warning if doesn't match (non-blocking)
- Allows different units for same BOM (e.g., 50 kg + 100 pcs)

---

## Architecture Overview

### Service Layer

**File**: `lib/services/bom-items-service.ts`

```typescript
// Main service functions
export async function getBOMItems(bomId: string): Promise<BOMItemsListResponse>
export async function createBOMItem(bomId: string, data: CreateBOMItemRequest): Promise<BOMItemResponse>
export async function updateBOMItem(bomId: string, itemId: string, data: UpdateBOMItemRequest): Promise<BOMItemResponse>
export async function deleteBOMItem(bomId: string, itemId: string): Promise<DeleteBOMItemResponse>
export async function getNextSequence(bomId: string): Promise<number>
```

### API Routes

**Endpoints**:
- `GET /api/v1/technical/boms/{id}/items` - List items
- `POST /api/v1/technical/boms/{id}/items` - Create item
- `PUT /api/v1/technical/boms/{id}/items/{itemId}` - Update item
- `DELETE /api/v1/technical/boms/{id}/items/{itemId}` - Delete item
- `GET /api/v1/technical/boms/{id}/items/next-sequence` - Get next sequence

### Database

**Table**: `bom_items`

```sql
CREATE TABLE bom_items (
  id UUID PRIMARY KEY,
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
  uom TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  operation_seq INTEGER,
  scrap_percent DECIMAL(5,2) DEFAULT 0 CHECK (scrap_percent >= 0 AND scrap_percent <= 100),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  org_id UUID (via bom)
)
```

**Indexes**:
- `idx_bom_items_bom_id` - Fast BOM lookups
- `idx_bom_items_product_id` - Reverse lookup (which BOMs use this product)
- `idx_bom_items_bom_seq` - Composite for sorting

---

## Usage Examples

### List Items for a BOM

```typescript
import { getBOMItems } from '@/lib/services/bom-items-service'

async function loadBOMItems(bomId: string) {
  try {
    const response = await getBOMItems(bomId)
    console.log(`BOM has ${response.items.length} items:`)

    response.items.forEach((item) => {
      console.log(`${item.sequence}: ${item.product_code} - ${item.quantity} ${item.uom}`)
    })

    console.log(`Output: ${response.bom_output_qty} ${response.bom_output_uom}`)
  } catch (error) {
    console.error('Failed to load items:', error.message)
  }
}
```

### Create a New Item

```typescript
import { createBOMItem } from '@/lib/services/bom-items-service'

async function addComponentToBOM(bomId: string) {
  try {
    const response = await createBOMItem(bomId, {
      product_id: 'RM-001-uuid',
      quantity: 50.5,
      uom: 'kg',
      scrap_percent: 2.0,
      notes: 'Mix for 5 minutes at high speed',
    })

    console.log(`Created item: ${response.item.product_code}`)
    console.log(`Sequence: ${response.item.sequence}`) // Auto-generated

    // Check for warnings
    if (response.warnings.length > 0) {
      response.warnings.forEach((warning) => {
        console.warn(`${warning.code}: ${warning.details}`)
      })
    }
  } catch (error) {
    console.error('Failed to create item:', error.message)
  }
}
```

### Update Quantity and Scrap

```typescript
import { updateBOMItem } from '@/lib/services/bom-items-service'

async function updateItemQuantity(
  bomId: string,
  itemId: string,
  newQuantity: number,
  newScrap: number
) {
  try {
    const response = await updateBOMItem(bomId, itemId, {
      quantity: newQuantity,
      scrap_percent: newScrap,
    })

    console.log(`Updated: ${newQuantity} ${response.item.uom}, scrap ${newScrap}%`)
  } catch (error) {
    if (error.message.includes('Quantity must be greater than 0')) {
      console.error('Quantity must be positive')
    } else {
      console.error('Update failed:', error.message)
    }
  }
}
```

### Delete an Item

```typescript
import { deleteBOMItem } from '@/lib/services/bom-items-service'

async function removeComponentFromBOM(bomId: string, itemId: string) {
  try {
    const response = await deleteBOMItem(bomId, itemId)
    console.log(response.message) // "BOM item deleted successfully"
  } catch (error) {
    if (error.message.includes('not found')) {
      console.error('Item not found or already deleted')
    } else {
      console.error('Delete failed:', error.message)
    }
  }
}
```

### Get Next Sequence for New Item

```typescript
import { getNextSequence } from '@/lib/services/bom-items-service'

async function getDefaultSequence(bomId: string) {
  try {
    const nextSeq = await getNextSequence(bomId)
    console.log(`New item will get sequence: ${nextSeq}`)

    // For empty BOM, returns 10
    // For BOM with items 10,20,30: returns 40
  } catch (error) {
    // Gracefully defaults to 10 if request fails
    console.log('Using default sequence: 10')
  }
}
```

---

## React Hook Examples

### Use BOM Items Hook

```typescript
import { useBOMItems } from '@/lib/hooks/use-bom-items'

function BOMItemsView({ bomId }) {
  const { data, isLoading, error } = useBOMItems(bomId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Items: {data?.items.length || 0}</h2>
      <p>Output: {data?.bom_output_qty} {data?.bom_output_uom}</p>
    </div>
  )
}
```

### Create Item Mutation

```typescript
import { useCreateBOMItem } from '@/lib/hooks/use-bom-items'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBOMItemSchema } from '@/lib/validation/bom-items'

function AddItemForm({ bomId, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(createBOMItemSchema),
    defaultValues: {
      product_id: '',
      quantity: 0,
      uom: '',
      scrap_percent: 0,
      notes: '',
    },
  })

  const { mutate: createItem, isPending } = useCreateBOMItem()

  const onSubmit = (data) => {
    createItem(
      { bomId, data },
      {
        onSuccess: (response) => {
          console.log('Created:', response.item)
          onSuccess()
        },
        onError: (error) => {
          form.setError('root', { message: error.message })
        },
      }
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields here */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Add Item'}
      </button>
    </form>
  )
}
```

### Update Item Mutation

```typescript
import { useUpdateBOMItem } from '@/lib/hooks/use-bom-items'

function EditItemForm({ bomId, item, onSuccess }) {
  const { mutate: updateItem, isPending } = useUpdateBOMItem()

  const handleSave = (newQuantity, newScrap) => {
    updateItem(
      {
        bomId,
        itemId: item.id,
        data: {
          quantity: newQuantity,
          scrap_percent: newScrap,
        },
      },
      {
        onSuccess: (response) => {
          console.log('Updated:', response.item)
          onSuccess()
        },
        onError: (error) => {
          console.error('Update failed:', error.message)
        },
      }
    )
  }

  return (
    <div>
      <input
        type="number"
        defaultValue={item.quantity}
        onChange={(e) => handleSave(parseFloat(e.target.value), item.scrap_percent)}
        disabled={isPending}
      />
    </div>
  )
}
```

---

## Key Features Explained

### Auto-Sequence

By default, sequences auto-increment by 10:

```
First item: sequence = 10
Second item: sequence = 20 (max 10 + 10)
Third item: sequence = 30 (max 20 + 10)
```

**Why by 10?** Leaves room to insert items between existing ones without reassigning all sequences:
- You can manually set item 3 to sequence 25 (between 20 and 30)
- Items still sort correctly by sequence

**Implementation**:
```typescript
// Get max sequence
const { data: maxSeqItem } = await supabase
  .from('bom_items')
  .select('sequence')
  .eq('bom_id', bomId)
  .order('sequence', { ascending: false })
  .limit(1)
  .single()

// Add 10
const nextSequence = (maxSeqItem?.sequence || 0) + 10
```

### UoM Validation & Warnings

UoM mismatches are **warnings, not errors**:

```typescript
// Component base_uom = 'kg'
// User enters uom = 'L'
// WARNING: "UoM does not match component base UoM"
// SAVE: SUCCEEDS ✅
```

**Why non-blocking?** Manufacturing may intentionally use different units:
- Bill specifies 100 kg of flour
- May be easier to measure 100L for density reasons
- User gets warning to review, but can proceed

**Client-side warning**:
```typescript
const selectedProduct = products.find(p => p.id === watch('product_id'))
if (selectedProduct && watch('uom') !== selectedProduct.base_uom) {
  setWarnings([
    {
      code: 'UOM_MISMATCH',
      message: `UoM mismatch: component base UoM is '${selectedProduct.base_uom}', you entered '${watch('uom')}'`,
    }
  ])
}
```

**Server-side warning trigger**:
```sql
CREATE TRIGGER trigger_bom_item_uom_validation
AFTER INSERT OR UPDATE ON bom_items
FOR EACH ROW
EXECUTE FUNCTION validate_bom_item_uom();

CREATE FUNCTION validate_bom_item_uom() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT base_uom FROM products WHERE id = NEW.product_id) != NEW.uom THEN
    RAISE WARNING 'UoM mismatch: component base UoM is %',
      (SELECT base_uom FROM products WHERE id = NEW.product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Operation Assignment

Assigns BOM items to specific production steps:

```
BOM Items:
1. RM-001 (Flour) → Op 10: Mixing
2. ING-002 (Honey) → Op 10: Mixing
3. PKG-001 (Bag) → Op 40: Packaging

Routing:
Op 10: Mixing (5 minutes)
Op 20: Proofing (2 hours)
Op 30: Baking (1 hour)
Op 40: Packaging (30 minutes)
```

**Validation**: Operation must exist in BOM's routing:
```typescript
// When creating/updating item with operation_seq
if (data.operation_seq !== undefined && data.operation_seq !== null) {
  // Check routing assigned
  if (!bom.routing_id) {
    throw new Error('Cannot assign operation: BOM has no routing assigned')
  }

  // Check operation exists
  const { data: op, error: opError } = await supabase
    .from('routing_operations')
    .select('sequence')
    .eq('routing_id', bom.routing_id)
    .eq('sequence', data.operation_seq)
    .single()

  if (opError || !op) {
    throw new Error('Operation does not exist in assigned routing')
  }
}
```

### Scrap Percentage

Expected material loss during production:

```
Example: Make 100 kg of flour
- Add 102 kg raw flour (2% scrap expected during milling)
- Result: 100 kg usable flour

scrap_percent = 2.0
```

**Validation**:
- Range: 0-100
- Default: 0
- 2 decimal places supported
- Used to calculate expected material consumption

---

## Permission Model

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Production Manager | ✅ | ✅ | ✅ | ❌ |
| Quality Manager | ✅ | ❌ | ✅ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ |

**Key Notes**:
- Quality Manager can review and suggest changes (update)
- Production Manager can add items but can't delete (prevents accidental loss)
- Owner/Admin have full access

---

## Error Handling

### Common Errors & Solutions

**Error**: "Quantity must be greater than 0"
```typescript
// Fix: Ensure quantity > 0
if (formData.quantity <= 0) {
  console.error('Quantity must be positive')
  return
}
```

**Error**: "Cannot assign operation: BOM has no routing assigned"
```typescript
// Fix: Assign routing to BOM first
if (!bom.routing_id && formData.operation_seq) {
  console.error('Please assign a routing to this BOM first')
  return
}
```

**Error**: "Operation does not exist in assigned routing"
```typescript
// Fix: Verify operation_seq matches routing's operations
const operations = await getRoutingOperations(bom.routing_id)
if (!operations.find(op => op.sequence === formData.operation_seq)) {
  console.error('Invalid operation for this routing')
  return
}
```

**Error**: "Maximum 6 decimal places allowed"
```typescript
// Fix: Limit decimal places in input
const quantity = parseFloat(formData.quantity).toFixed(6)
```

**Error**: "UoM does not match component base UoM" (warning)
```typescript
// This is a warning, not an error
// User can proceed, but should verify
console.warn('Warning: UoM mismatch detected')
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { createBOMItem, updateBOMItem } from '@/lib/services/bom-items-service'

describe('BOM Items Service', () => {
  it('creates item with auto-sequence', async () => {
    const response = await createBOMItem('bom-uuid', {
      product_id: 'product-uuid',
      quantity: 50,
      uom: 'kg',
    })

    expect(response.item.sequence).toBe(10) // First item
    expect(response.item.quantity).toBe(50)
  })

  it('returns UoM warning on mismatch', async () => {
    const response = await createBOMItem('bom-uuid', {
      product_id: 'product-uuid', // base_uom = 'kg'
      quantity: 50,
      uom: 'L', // Different UoM
    })

    expect(response.warnings).toHaveLength(1)
    expect(response.warnings[0].code).toBe('UOM_MISMATCH')
  })

  it('rejects negative quantity', async () => {
    expect(async () => {
      await createBOMItem('bom-uuid', {
        product_id: 'product-uuid',
        quantity: -10,
        uom: 'kg',
      })
    }).rejects.toThrow('Quantity must be greater than 0')
  })
})
```

### Integration Test Example

```typescript
import { test, expect } from '@playwright/test'

test('Create and edit BOM item', async ({ page }) => {
  // Navigate to BOM detail
  await page.goto('/technical/boms/550e8400-e29b-41d4-a716-446655440000')

  // Click add item
  await page.click('button:has-text("Add Item")')

  // Fill form
  await page.fill('input[name="quantity"]', '50')
  await page.click('button:has-text("Save")')

  // Verify item appears
  await expect(page.locator('text=50.000')).toBeVisible()

  // Edit item
  await page.click('button[aria-label*="Actions"]')
  await page.click('text=Edit')
  await page.fill('input[name="quantity"]', '75')
  await page.click('button:has-text("Save Changes")')

  // Verify update
  await expect(page.locator('text=75.000')).toBeVisible()
})
```

---

## Performance Considerations

### Query Optimization

**Problem**: Fetching 100 items is slow
**Solution**: Database indexes on `bom_id` and `sequence`

```sql
CREATE INDEX idx_bom_items_bom_id ON bom_items(bom_id);
CREATE INDEX idx_bom_items_bom_seq ON bom_items(bom_id, sequence);
```

**Result**: <500ms for 100 items ✅

### Component Optimization

**Problem**: Table re-renders on every prop change
**Solution**: Memoize sorted items

```typescript
const sortedItems = useMemo(() => {
  return items?.sort((a, b) => a.sequence - b.sequence) ?? []
}, [items])
```

### Network Optimization

**Problem**: Multiple requests to get items and operations
**Solution**: Single GET request returns both (via product join)

```typescript
// One request returns:
// - BOM items
// - Product details
// - Operation names
const response = await getBOMItems(bomId)
```

---

## Frequently Asked Questions

**Q: Can I add the same product twice to a BOM?**
A: Yes, there's no uniqueness constraint. You might need different quantities or scrap percentages.

**Q: What happens if I delete a routing while items reference operations?**
A: Items keep their `operation_seq` values, but `operation_name` becomes null until you reassign the routing or clear the operation.

**Q: Can I reorder items by dragging?**
A: Not in MVP (02.5a). Drag-drop reordering is planned for Phase 1+. For now, manually update sequence numbers.

**Q: Why is UoM mismatch a warning, not an error?**
A: Flexibility for manufacturing. Sometimes different units are intentional (e.g., flour in kg, water in L).

**Q: How are byproducts handled?**
A: Not in MVP (02.5a). Story 02.5b adds byproduct support with `is_by_product` flag.

**Q: Can Quality Manager delete items?**
A: No, only Owner and Admin can delete. Quality Manager can suggest updates but can't remove items.

---

## Related Documentation

- [BOM Items API Reference](../architecture/api/technical/bom-items-crud.md)
- [BOM Items User Guide](../user-guides/bom-items-management.md)
- [Component Documentation](../architecture/components/bom-items.md)
- [Database Schema](../architecture/database/boms-schema.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-28 | Initial MVP release (Story 02.5a) |

