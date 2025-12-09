# Story 2.5: Product Types Configuration

**Epic:** 2 - Technical Core
**Batch:** 2A - Products + Settings
**Status:** Pending
**Priority:** P0 (Blocker)
**Story Points:** 2
**Created:** 2025-11-23

---

## Goal

Allow administrators to configure product types beyond the default system types (RM, WIP, FG, PKG, BP), enabling organizations to categorize products according to their specific industry needs.

## User Story

**As an** Admin
**I want** to configure product types
**So that** we can categorize products properly for our specific manufacturing processes

---

## Problem Statement

Different manufacturing industries use different product categorization schemes:

**Food Manufacturing:**
- RM (Raw Material), WIP (Work in Progress), FG (Finished Good), PKG (Packaging), BP (By-Product)

**Pharma Manufacturing:**
- API (Active Pharmaceutical Ingredient), Excipient, IPC (In-Process Control), FP (Finished Product)

**Electronics Manufacturing:**
- Component, Sub-Assembly, PCB, Finished Device

**General Manufacturing:**
- May need custom categories like Semi-Finished Good (SFG), Consumable, Tool, etc.

Without configurable product types:
- Organizations are forced into generic categories
- Cannot model industry-specific terminology
- Reporting and filtering is less meaningful
- User adoption is lower (unfamiliar terms)

---

## Acceptance Criteria

### AC-2.5.1: Product Types Management Page

**Given** I am an Admin user
**When** I navigate to `/settings/technical`
**Then** I see a "Product Types" section/card

**When** I click on the Product Types section
**Then** I navigate to `/settings/technical/product-types`

**And** I see a page with:
- Title: "Product Types"
- Subtitle: "Configure product categories for your organization"
- Data table showing all product types (default + custom)
- "Add Product Type" button (top right)

**Success Criteria:**
- Page accessible from Settings menu
- Breadcrumb: Settings > Technical > Product Types
- Non-admin users cannot access (permission check)

---

### AC-2.5.2: Product Types Table Display

**Given** I am on the Product Types page
**Then** I see a table with columns:
- **Code** - Short code (e.g., "RM", "SFG")
- **Name** - Display name (e.g., "Raw Material", "Semi-Finished Good")
- **Type** - Badge showing "Default" or "Custom"
- **Status** - "Active" or "Inactive"
- **Products Count** - Number of products using this type
- **Actions** - Edit, Deactivate/Activate buttons

**And** default types are displayed:
- RM - Raw Material (Default, Active)
- WIP - Work in Progress (Default, Active)
- FG - Finished Good (Default, Active)
- PKG - Packaging (Default, Active)
- BP - By-Product (Default, Active)

**And** custom types (if any) are displayed below defaults

**Success Criteria:**
- Default types clearly marked
- Active/Inactive status visible
- Products count helps understand usage
- Table sortable by name or code

---

### AC-2.5.3: Add Custom Product Type

**Given** I am on the Product Types page
**When** I click "Add Product Type" button
**Then** a modal dialog opens with title "Add Product Type"

**And** the form contains:
- **Code** (text input, required)
  - Placeholder: "e.g., SFG, API, COMP"
  - Validation: 2-10 chars, uppercase letters only
  - Helper text: "Short code for the product type (cannot be changed later)"
- **Name** (text input, required)
  - Placeholder: "e.g., Semi-Finished Good, Active Ingredient"
  - Validation: 1-100 chars

**And** buttons:
- "Cancel" (closes modal)
- "Create Product Type" (saves and closes)

**When** I fill the form and click "Create Product Type"
**Then** the custom type is created with:
  - is_default = false
  - is_active = true
**And** it appears in the table
**And** a success toast appears: "Product type created successfully"

**Success Criteria:**
- Code validation prevents conflicts with defaults (RM, WIP, FG, PKG, BP)
- Code is case-insensitive unique
- Modal closes on success
- Table updates immediately

---

### AC-2.5.4: Code Validation Rules

**Given** I am creating a custom product type
**When** I enter a code
**Then** the following validations apply:

1. **Format:**
   - Only uppercase letters (A-Z)
   - 2-10 characters
   - Error: "Code must be 2-10 uppercase letters"

2. **Uniqueness:**
   - Cannot conflict with existing codes (case-insensitive)
   - Error: "Code 'X' already exists"

3. **Reserved Codes:**
   - Cannot use default codes: RM, WIP, FG, PKG, BP
   - Error: "Code 'RM' is a reserved system type"

**Success Criteria:**
- Real-time validation on blur
- Clear error messages
- Submit button disabled if validation fails

---

### AC-2.5.5: Edit Custom Product Type

**Given** a custom product type exists
**When** I click the "Edit" button
**Then** an Edit Modal opens with:
- Title: "Edit Product Type"
- Form with current values pre-filled:
  - Code (disabled, shown for reference)
  - Name (editable)

**When** I change the name and click "Save Changes"
**Then** the product type is updated
**And** the table refreshes with new name
**And** a success toast appears: "Product type updated successfully"

**Success Criteria:**
- Code cannot be changed (immutable)
- Name can be updated
- Changes reflected immediately

---

### AC-2.5.6: Deactivate Custom Product Type

**Given** a custom product type exists
**When** I click the "Deactivate" button
**Then** a confirmation dialog appears:
- Title: "Deactivate Product Type?"
- Message: "This type will be hidden from new product creation. Existing products using this type will not be affected."
- Buttons: "Cancel", "Deactivate"

**When** I click "Deactivate"
**Then** the product type's is_active flag is set to false
**And** the type is marked as "Inactive" in the table
**And** a success toast appears: "Product type deactivated"

**When** I am creating a new product
**Then** deactivated types do NOT appear in the Type dropdown

**When** I am viewing a product with a deactivated type
**Then** the type is still displayed (historical data preserved)

**Success Criteria:**
- Deactivation is soft (not delete)
- Existing products not affected
- Deactivated types hidden from dropdowns
- Can be reactivated later

---

### AC-2.5.7: Reactivate Custom Product Type

**Given** a custom product type is deactivated (is_active = false)
**When** I click the "Activate" button
**Then** the type is immediately reactivated (is_active = true)
**And** the status changes to "Active" in the table
**And** the type becomes available in product creation dropdowns again

**Success Criteria:**
- Reactivation is instant (no confirmation needed)
- Type immediately usable

---

### AC-2.5.8: Cannot Edit or Delete Default Types

**Given** a default product type (RM, WIP, FG, PKG, BP)
**When** I view the type in the table
**Then** the "Edit" button is disabled or hidden
**And** the "Deactivate" button is disabled or hidden
**And** a tooltip explains: "Default types cannot be edited or deactivated"

**Success Criteria:**
- Default types are protected from modification
- Clear indication why actions are disabled

---

### AC-2.5.9: Cannot Delete Type with Associated Products

**Given** a custom product type has 5 products using it
**When** I attempt to deactivate the type
**Then** the deactivation succeeds (types can be deactivated even if in use)
**And** existing products retain the type
**And** new products cannot select this type

**Note:** In the future, we may add a "Delete" action that checks for zero usage.

**Success Criteria:**
- Deactivation allowed regardless of usage
- Products count shown in table for reference
- Data integrity maintained

---

## Technical Implementation

### Database Schema

**product_type_config table** (already defined in migration 014):

```sql
CREATE TABLE product_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (org_id, code)
);

CREATE INDEX idx_product_type_config_org ON product_type_config(org_id) WHERE is_active = true;
```

**Seed default types:**

```sql
INSERT INTO product_type_config (code, name, is_default, org_id, created_by) VALUES
  ('RM', 'Raw Material', true, :org_id, :user_id),
  ('WIP', 'Work in Progress', true, :org_id, :user_id),
  ('FG', 'Finished Good', true, :org_id, :user_id),
  ('PKG', 'Packaging', true, :org_id, :user_id),
  ('BP', 'By-Product', true, :org_id, :user_id)
ON CONFLICT (org_id, code) DO NOTHING;
```

### API Endpoints

#### GET /api/technical/product-types

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "RM",
      "name": "Raw Material",
      "is_default": true,
      "is_active": true,
      "products_count": 25
    },
    {
      "id": "uuid",
      "code": "SFG",
      "name": "Semi-Finished Good",
      "is_default": false,
      "is_active": true,
      "products_count": 8
    }
  ]
}
```

**Implementation:**
```typescript
export async function GET() {
  const types = await db.query(`
    SELECT
      pt.id,
      pt.code,
      pt.name,
      pt.is_default,
      pt.is_active,
      COUNT(p.id) as products_count
    FROM product_type_config pt
    LEFT JOIN products p ON p.type = pt.code AND p.deleted_at IS NULL
    WHERE pt.org_id = $1
    GROUP BY pt.id
    ORDER BY pt.is_default DESC, pt.name ASC
  `, [orgId])

  return NextResponse.json({ data: types.rows })
}
```

#### POST /api/technical/product-types

**Request:**
```json
{
  "code": "SFG",
  "name": "Semi-Finished Good"
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "SFG",
  "name": "Semi-Finished Good",
  "is_default": false,
  "is_active": true,
  "created_at": "2025-11-23T10:00:00Z"
}
```

**Validation:**
```typescript
const productTypeCreateSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be less than 10 characters')
    .regex(/^[A-Z]+$/, 'Code must be uppercase letters only')
    .refine(code => !['RM', 'WIP', 'FG', 'PKG', 'BP'].includes(code), {
      message: 'This code is reserved for default types'
    }),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
})
```

#### PUT /api/technical/product-types/:id

**Request:**
```json
{
  "name": "Updated Name",
  "is_active": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "SFG",
  "name": "Updated Name",
  "is_active": false,
  "updated_at": "2025-11-23T10:30:00Z"
}
```

**Business Rules:**
- Cannot update if is_default = true
- Code is NOT updatable (omit from schema)
- Only name and is_active can be changed

---

### Frontend Components

```
apps/frontend/app/settings/technical/product-types/
├── page.tsx                        # Product types management page
└── components/
    ├── ProductTypeTable.tsx        # Data table
    ├── ProductTypeCreateModal.tsx  # Create dialog
    └── ProductTypeEditModal.tsx    # Edit dialog
```

**ProductTypeTable.tsx:**
```tsx
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'

const columns: ColumnDef<ProductType>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.is_default ? 'default' : 'secondary'}>
        {row.original.is_default ? 'Default' : 'Custom'}
      </Badge>
    )
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? 'success' : 'secondary'}>
        {row.original.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  { accessorKey: 'products_count', header: 'Products' },
  {
    id: 'actions',
    cell: ({ row }) => (
      <ProductTypeActions
        productType={row.original}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />
    )
  }
]
```

**ProductTypeCreateModal.tsx:**
```tsx
export function ProductTypeCreateModal({ open, onClose, onSuccess }: Props) {
  const form = useForm({
    resolver: zodResolver(productTypeCreateSchema),
    defaultValues: { code: '', name: '' }
  })

  async function onSubmit(data: ProductTypeCreateInput) {
    const type = await createProductType(data)
    onSuccess(type)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product Type</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., SFG, API, COMP"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Short code for the product type (2-10 uppercase letters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Semi-Finished Good" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Create Product Type</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## UI/UX Specifications

### Visual Design

**Product Type Badges:**
- Default type: Blue badge (primary)
- Custom type: Gray badge (secondary)

**Status Badges:**
- Active: Green badge
- Inactive: Gray badge

**Table:**
- Default types always listed first
- Custom types listed alphabetically

**Buttons:**
- Edit: Only enabled for custom types
- Deactivate/Activate: Only enabled for custom types
- Tooltips on disabled buttons

---

## Testing Checklist

### Unit Tests

```typescript
test('validates product type code format', () => {
  expect(() => productTypeCreateSchema.parse({ code: 'abc' })).toThrow() // lowercase
  expect(() => productTypeCreateSchema.parse({ code: 'A' })).toThrow() // too short
  expect(() => productTypeCreateSchema.parse({ code: 'TOOLONGCODE' })).toThrow() // too long
  expect(() => productTypeCreateSchema.parse({ code: 'RM' })).toThrow() // reserved

  const valid = productTypeCreateSchema.parse({ code: 'SFG', name: 'Semi-Finished Good' })
  expect(valid.code).toBe('SFG')
})
```

### Integration Tests

```typescript
test('POST /api/technical/product-types creates custom type', async () => {
  const response = await fetch('/api/technical/product-types', {
    method: 'POST',
    body: JSON.stringify({ code: 'SFG', name: 'Semi-Finished Good' })
  })
  expect(response.status).toBe(201)
  const type = await response.json()
  expect(type.is_default).toBe(false)
  expect(type.is_active).toBe(true)
})

test('Cannot create duplicate code', async () => {
  await createProductType({ code: 'SFG', name: 'First' })
  const response = await fetch('/api/technical/product-types', {
    method: 'POST',
    body: JSON.stringify({ code: 'SFG', name: 'Second' })
  })
  expect(response.status).toBe(400)
})

test('Cannot update default types', async () => {
  const types = await getProductTypes()
  const rm = types.find(t => t.code === 'RM')

  const response = await fetch(`/api/technical/product-types/${rm.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated' })
  })
  expect(response.status).toBe(403) // Forbidden
})
```

### E2E Tests

```typescript
test('Admin creates custom product type', async ({ page }) => {
  await page.goto('/settings/technical/product-types')
  await page.click('button:has-text("Add Product Type")')

  await page.fill('input[name="code"]', 'sfg') // Will be uppercased
  await page.fill('input[name="name"]', 'Semi-Finished Good')
  await page.click('button:has-text("Create Product Type")')

  await expect(page.locator('table')).toContainText('SFG')
  await expect(page.locator('table')).toContainText('Semi-Finished Good')
  await expect(page.locator('table')).toContainText('Custom')
})

test('Deactivate and reactivate custom type', async ({ page }) => {
  await createTestProductType({ code: 'SFG', name: 'Semi-Finished Good' })

  await page.goto('/settings/technical/product-types')
  await page.click('tr:has-text("SFG") button:has-text("Deactivate")')
  await page.click('button:has-text("Deactivate"):last') // Confirm

  await expect(page.locator('tr:has-text("SFG") >> text=Inactive')).toBeVisible()

  await page.click('tr:has-text("SFG") button:has-text("Activate")')
  await expect(page.locator('tr:has-text("SFG") >> text=Active')).toBeVisible()
})
```

---

## Dependencies

**Required Before This Story:**
- ✅ Epic 1 (Settings foundation)
- ✅ product_type_config table created
- ✅ Admin role permissions

**Enables:**
- Story 2.1 (Product CRUD) - Type dropdown populated from this table
- Custom product categorization for all industries

---

## Definition of Done

- [ ] product_type_config table seeded with defaults
- [ ] GET /api/technical/product-types endpoint
- [ ] POST /api/technical/product-types endpoint
- [ ] PUT /api/technical/product-types/:id endpoint
- [ ] Product Types management page created
- [ ] ProductTypeTable component with products count
- [ ] ProductTypeCreateModal with code validation
- [ ] ProductTypeEditModal (name only, code disabled)
- [ ] Deactivate/Activate functionality
- [ ] Default types protected from editing
- [ ] Unit tests for validation (100% coverage)
- [ ] Integration tests for API
- [ ] E2E tests for CRUD operations
- [ ] Code review approved
- [ ] Documentation committed

---

## Estimation Breakdown

**2 Story Points = ~3-4 hours**
- API endpoints (GET, POST, PUT): 1.5 hours
- Product Types page + table: 1 hour
- Create/Edit modals: 1 hour
- Testing (unit, integration, E2E): 1 hour
- Bug fixes: 30 min
