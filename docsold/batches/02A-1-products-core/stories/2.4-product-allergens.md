# Story 2.4: Product Allergen Assignment

**Epic:** 2 - Technical Core
**Batch:** 2A - Products + Settings
**Status:** Pending
**Priority:** P0 (Blocker)
**Story Points:** 2
**Created:** 2025-11-23

---

## Goal

Enable Technical users to assign allergens to products with two relationship types ("Contains" and "May Contain"), ensuring accurate allergen labeling for compliance and consumer safety.

## User Story

**As a** Technical user
**I want** to assign allergens to products
**So that** allergen information is tracked for compliance, labeling, and consumer safety

---

## Problem Statement

In food manufacturing (and increasingly other industries), allergen management is critical for:

1. **Regulatory Compliance:**
   - EU Regulation 1169/2011 requires declaration of 14 major allergens
   - FDA FALCPA requires labeling of 9 major allergens
   - Failure to label can result in fines, recalls, and legal liability

2. **Consumer Safety:**
   - Allergic reactions can be life-threatening
   - Clear labeling protects consumers
   - "May Contain" warnings for cross-contamination risk

3. **Traceability:**
   - Allergen info flows to BOMs, WOs, labels, shipping docs
   - Critical for recall management
   - Required for CoA (Certificate of Analysis)

Without allergen assignment:
- Products lack critical safety information
- Labels cannot be generated correctly
- Compliance is impossible

---

## Acceptance Criteria

### AC-2.4.1: Allergen Section in Product Detail View

**Given** I am viewing a product detail page
**Then** I see an "Allergens" section with two subsections:

**Contains:**
- Label: "Contains Allergens"
- Display: List of allergen badges (if any assigned)
- Empty state: "No allergens declared"

**May Contain:**
- Label: "May Contain (Cross-Contamination)"
- Display: List of allergen badges (if any assigned)
- Empty state: "No cross-contamination allergens declared"

**And** allergen badges show:
- Allergen icon (if available)
- Allergen name
- Color-coded (e.g., red for severity, orange for caution)

**Success Criteria:**
- Section is prominently placed (after Basic Information)
- Clear visual distinction between "Contains" and "May Contain"
- Empty state is clear and not alarming

---

### AC-2.4.2: Allergen Assignment in Create Product Modal

**Given** I am creating a new product
**When** I scroll to the "Allergens" section in the Create Modal
**Then** I see two multi-select dropdowns:

**Contains Allergens:**
- Label: "Contains Allergens"
- Multi-select dropdown
- Options: All active allergens from GET /api/settings/allergens
- Placeholder: "Select allergens this product contains"

**May Contain Allergens:**
- Label: "May Contain (Cross-Contamination)"
- Multi-select dropdown
- Options: All active allergens (same as Contains)
- Placeholder: "Select potential cross-contamination allergens"

**And** I can select multiple allergens from each dropdown
**And** the same allergen can be in both lists (e.g., "Contains Milk" + "May Contain Nuts")

**When** I save the product
**Then** selected allergens are saved with the product

**Success Criteria:**
- Multi-select UI is intuitive (checkboxes or tags)
- Search/filter within dropdown for long lists
- Allergens sorted alphabetically
- Visual feedback when allergens are selected

---

### AC-2.4.3: Allergen Assignment in Edit Product Drawer

**Given** I am editing an existing product with allergens
**When** the Edit Drawer opens
**Then** I see the Allergens section with current selections pre-filled

**And** I can:
- Add new allergens to "Contains" or "May Contain"
- Remove existing allergens
- Move allergens between "Contains" and "May Contain" (remove + re-add)

**When** I save changes
**Then** allergen assignments are updated via PUT /api/technical/products/:id/allergens
**And** the product version does NOT increment (allergens are separate from product spec)
**And** the detail view refreshes with new allergen badges

**Success Criteria:**
- Pre-filled selections match current data
- Changes save correctly
- No version increment for allergen changes
- UI updates optimistically

---

### AC-2.4.4: Allergen Data Source

**Given** allergens are being assigned
**Then** the allergen list comes from the Allergens master data (Story 1.9)

**And** the list includes:
- **14 EU Major Allergens:**
  - Cereals containing gluten
  - Crustaceans
  - Eggs
  - Fish
  - Peanuts
  - Soybeans
  - Milk
  - Nuts (tree nuts)
  - Celery
  - Mustard
  - Sesame seeds
  - Sulphur dioxide and sulphites
  - Lupin
  - Molluscs
- **Custom Allergens:** Any additional allergens added by the organization

**And** only active allergens (is_active = true) are shown in dropdowns

**Success Criteria:**
- Allergen data fetched from GET /api/settings/allergens
- Custom allergens supported
- Inactive allergens excluded from selection

---

### AC-2.4.5: Allergen Badges Display

**Given** a product has allergens assigned
**When** I view the product detail page
**Then** allergens are displayed as badges/tags with:
- Icon (e.g., ⚠️ for major allergens)
- Allergen name
- Color: Red for "Contains", Orange for "May Contain"
- Tooltip on hover with full allergen name (if truncated)

**Example:**
```
Contains Allergens:
[🥛 Milk] [🥜 Peanuts] [🌾 Gluten]

May Contain:
[🌰 Nuts] [🦐 Crustaceans]
```

**Success Criteria:**
- Badges are visually distinct from other UI elements
- Color coding is consistent
- Icons enhance scanability
- Responsive layout (wraps on small screens)

---

### AC-2.4.6: Allergen Assignment API Integration

**Given** I am assigning allergens to a product
**When** I save the product (create or update)
**Then** the allergens are saved via PUT /api/technical/products/:id/allergens

**Request Body:**
```json
{
  "contains": ["uuid1", "uuid2", "uuid3"],
  "may_contain": ["uuid4", "uuid5"]
}
```

**Response:**
```json
{
  "success": true,
  "allergens": {
    "contains": [
      { "id": "uuid1", "code": "milk", "name": "Milk" },
      { "id": "uuid2", "code": "peanuts", "name": "Peanuts" }
    ],
    "may_contain": [
      { "id": "uuid4", "code": "nuts", "name": "Tree Nuts" }
    ]
  }
}
```

**And** allergen assignments are stored in `product_allergens` table with:
- product_id
- allergen_id
- relation_type ('contains' or 'may_contain')

**Success Criteria:**
- API replaces all allergen assignments (not merges)
- Sending empty arrays removes all allergens
- No duplicate assignments (unique constraint)
- Audit trail created (created_by, created_at)

---

### AC-2.4.7: Allergen Retrieval

**Given** a product has allergens assigned
**When** I fetch the product detail via GET /api/technical/products/:id
**Then** the response includes allergens:

```json
{
  "id": "uuid",
  "code": "BREAD-001",
  "name": "White Bread",
  "allergens": {
    "contains": [
      { "id": "uuid1", "code": "gluten", "name": "Cereals containing gluten", "icon": "🌾" },
      { "id": "uuid2", "code": "milk", "name": "Milk", "icon": "🥛" }
    ],
    "may_contain": [
      { "id": "uuid3", "code": "nuts", "name": "Tree Nuts", "icon": "🌰" }
    ]
  }
}
```

**Success Criteria:**
- Allergens fetched in a single query (JOIN)
- Grouped by relation_type (contains vs may_contain)
- Includes allergen details (code, name, icon)

---

### AC-2.4.8: Validation Rules

**Given** I am assigning allergens
**Then** the following validations apply:

1. **Allergen Existence:**
   - All allergen IDs must exist in allergens table
   - Invalid IDs return 400 error: "Allergen ID 'X' not found"

2. **Active Allergens Only:**
   - Cannot assign inactive allergens
   - Error: "Allergen 'X' is inactive and cannot be assigned"

3. **No Duplicates Across Types:**
   - Same allergen can be in both "Contains" and "May Contain"
   - BUT within same type, no duplicates (handled by DB unique constraint)

4. **Organization Boundary:**
   - Can only assign allergens from same organization
   - RLS policy enforces this

**Success Criteria:**
- Clear error messages for validation failures
- Client-side validation prevents most errors
- Server-side validation is final authority

---

## Technical Implementation

### Database Schema

**product_allergens table** (already defined in migration 014):

```sql
CREATE TABLE product_allergens (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('contains', 'may_contain')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  PRIMARY KEY (product_id, allergen_id, relation_type)
);

CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);
```

### API Endpoint

**PUT /api/technical/products/:id/allergens**

```typescript
// app/api/technical/products/[id]/allergens/route.ts
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { contains, may_contain } = allergenAssignmentSchema.parse(body)

  // Validate allergen IDs exist and are active
  await validateAllergenIds([...contains, ...may_contain])

  // Replace all allergen assignments (delete + insert)
  await db.transaction(async (tx) => {
    // Delete existing
    await tx.execute(`
      DELETE FROM product_allergens
      WHERE product_id = $1 AND org_id = $2
    `, [params.id, orgId])

    // Insert "contains" allergens
    for (const allergenId of contains) {
      await tx.execute(`
        INSERT INTO product_allergens (product_id, allergen_id, relation_type, created_by, org_id)
        VALUES ($1, $2, 'contains', $3, $4)
      `, [params.id, allergenId, userId, orgId])
    }

    // Insert "may_contain" allergens
    for (const allergenId of may_contain) {
      await tx.execute(`
        INSERT INTO product_allergens (product_id, allergen_id, relation_type, created_by, org_id)
        VALUES ($1, $2, 'may_contain', $3, $4)
      `, [params.id, allergenId, userId, orgId])
    }
  })

  // Fetch and return updated allergens
  const allergens = await fetchProductAllergens(params.id)

  return NextResponse.json({
    success: true,
    allergens
  })
}

async function fetchProductAllergens(productId: string) {
  const result = await db.query(`
    SELECT
      a.id,
      a.code,
      a.name,
      a.icon,
      pa.relation_type
    FROM product_allergens pa
    JOIN allergens a ON pa.allergen_id = a.id
    WHERE pa.product_id = $1 AND pa.org_id = $2
    ORDER BY a.name
  `, [productId, orgId])

  const contains = result.rows.filter(r => r.relation_type === 'contains')
  const may_contain = result.rows.filter(r => r.relation_type === 'may_contain')

  return { contains, may_contain }
}
```

**GET /api/technical/products/:id**

```typescript
// Include allergens in product detail response
const allergens = await fetchProductAllergens(productId)

return NextResponse.json({
  ...product,
  allergens
})
```

### Validation Schema

```typescript
import { z } from 'zod'

export const allergenAssignmentSchema = z.object({
  contains: z.array(z.string().uuid()).default([]),
  may_contain: z.array(z.string().uuid()).default([])
})
```

### Frontend Components

**ProductAllergenSection.tsx:**

```tsx
import { Badge } from '@/components/ui/badge'
import { MultiSelect } from '@/components/ui/multi-select'

export function ProductAllergenSection({ productId, allergens, mode }: Props) {
  const { data: availableAllergens } = useQuery({
    queryKey: ['allergens'],
    queryFn: getAllergens
  })

  const [contains, setContains] = useState<string[]>(allergens.contains.map(a => a.id))
  const [mayContain, setMayContain] = useState<string[]>(allergens.may_contain.map(a => a.id))

  async function handleSave() {
    await updateProductAllergens(productId, { contains, may_contain: mayContain })
  }

  if (mode === 'view') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Contains Allergens</h3>
          {allergens.contains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergens.contains.map(a => (
                <Badge key={a.id} variant="destructive">
                  {a.icon} {a.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No allergens declared</p>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">May Contain (Cross-Contamination)</h3>
          {allergens.may_contain.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergens.may_contain.map(a => (
                <Badge key={a.id} variant="warning">
                  {a.icon} {a.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No cross-contamination allergens declared</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="font-medium">Contains Allergens</label>
        <MultiSelect
          options={availableAllergens?.map(a => ({ value: a.id, label: `${a.icon} ${a.name}` }))}
          value={contains}
          onChange={setContains}
          placeholder="Select allergens this product contains"
        />
      </div>

      <div>
        <label className="font-medium">May Contain (Cross-Contamination)</label>
        <MultiSelect
          options={availableAllergens?.map(a => ({ value: a.id, label: `${a.icon} ${a.name}` }))}
          value={mayContain}
          onChange={setMayContain}
          placeholder="Select potential cross-contamination allergens"
        />
      </div>

      <Button onClick={handleSave}>Save Allergens</Button>
    </div>
  )
}
```

---

## UI/UX Specifications

### Visual Design

**Allergen Badges:**
- **Contains:** Red badge (variant="destructive")
  - Background: red-100
  - Border: red-300
  - Text: red-800
- **May Contain:** Orange badge (variant="warning")
  - Background: orange-100
  - Border: orange-300
  - Text: orange-800
- Icon + Name format: "🥛 Milk"
- Padding: py-1 px-2
- Rounded: rounded-md

**Multi-Select Dropdown:**
- Use shadcn/ui Combobox or custom MultiSelect
- Checkboxes for selection
- Search/filter functionality
- Selected items shown as tags above input
- Alphabetical sort

---

## Testing Checklist

### Unit Tests

```typescript
test('validates allergen IDs are valid UUIDs', () => {
  const valid = allergenAssignmentSchema.parse({
    contains: ['uuid1'],
    may_contain: ['uuid2']
  })
  expect(valid).toBeDefined()

  expect(() => allergenAssignmentSchema.parse({
    contains: ['invalid-id']
  })).toThrow()
})
```

### Integration Tests

```typescript
test('PUT /api/technical/products/:id/allergens assigns allergens', async () => {
  const product = await createProduct({ code: 'TEST', name: 'Test' })
  const allergens = await getAllergens()
  const milk = allergens.find(a => a.code === 'milk')
  const peanuts = allergens.find(a => a.code === 'peanuts')

  const response = await fetch(`/api/technical/products/${product.id}/allergens`, {
    method: 'PUT',
    body: JSON.stringify({
      contains: [milk.id],
      may_contain: [peanuts.id]
    })
  })

  expect(response.status).toBe(200)
  const data = await response.json()
  expect(data.allergens.contains).toHaveLength(1)
  expect(data.allergens.may_contain).toHaveLength(1)
})

test('Allergen assignment replaces existing', async () => {
  const product = await createProduct({ code: 'TEST', name: 'Test' })
  const allergens = await getAllergens()

  // Assign first set
  await updateProductAllergens(product.id, { contains: [allergens[0].id] })

  // Replace with second set
  await updateProductAllergens(product.id, { contains: [allergens[1].id] })

  const updated = await getProduct(product.id)
  expect(updated.allergens.contains).toHaveLength(1)
  expect(updated.allergens.contains[0].id).toBe(allergens[1].id)
})
```

### E2E Tests

```typescript
test('Assign allergens to product', async ({ page }) => {
  await page.goto('/technical/products/[id]')
  await page.click('button:has-text("Edit")')

  // Open allergen dropdown
  await page.click('label:has-text("Contains Allergens") + div >> button')

  // Select allergens
  await page.click('text=Milk >> input[type="checkbox"]')
  await page.click('text=Peanuts >> input[type="checkbox"]')

  // Save
  await page.click('button:has-text("Save Changes")')

  // Verify badges appear
  await expect(page.locator('text=🥛 Milk')).toBeVisible()
  await expect(page.locator('text=🥜 Peanuts')).toBeVisible()
})
```

---

## Dependencies

**Required Before This Story:**
- ✅ Story 1.9 (Allergen Management) - Allergens master data exists
- ✅ Story 2.1 (Product CRUD) - Products can be created
- ✅ product_allergens table created

**Enables:**
- Story 2.14 (BOM Allergen Inheritance) - BOMs inherit allergens from products
- Label generation (Epic 5)
- CoA generation (Epic 6)

---

## Definition of Done

- [ ] product_allergens table created with RLS
- [ ] PUT /api/technical/products/:id/allergens endpoint implemented
- [ ] GET /api/technical/products/:id includes allergens
- [ ] Allergen section in product detail view
- [ ] Allergen assignment in create/edit forms
- [ ] Multi-select UI for allergen selection
- [ ] Allergen badges with icons and colors
- [ ] Validation for allergen IDs
- [ ] Unit tests (100% coverage)
- [ ] Integration tests for API
- [ ] E2E tests for allergen assignment flow
- [ ] Code review approved
- [ ] Documentation committed

---

## Estimation Breakdown

**2 Story Points = ~3-4 hours**
- API endpoint (PUT allergens): 1 hour
- ProductAllergenSection component (view + edit): 1.5 hours
- Allergen badges styling: 30 min
- Testing (unit, integration, E2E): 1 hour
- Bug fixes: 30 min
