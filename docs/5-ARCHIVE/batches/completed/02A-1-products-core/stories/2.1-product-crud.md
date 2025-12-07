# Story 2.1: Product CRUD

**Epic:** 2 - Technical Core
**Batch:** 2A - Products + Settings
**Status:** Pending
**Priority:** P0 (Blocker)
**Story Points:** 5
**Created:** 2025-11-23

---

## Goal

Create the Products master data management functionality with create, read, update, and delete operations, allowing Technical users to build and maintain a comprehensive product catalog.

## User Story

**As a** Technical user
**I want** to create and manage products
**So that** we have a master data catalog of all materials, packaging, and finished goods

---

## Problem Statement

The Technical module requires a product master database as the foundation for:
- Bill of Materials (BOMs) - which products are made from which components
- Routings - which products follow which production processes
- Work Orders - what products are being manufactured
- Purchase/Transfer Orders - what products are being ordered/moved
- Inventory - what products are in stock

Without a product catalog, no other Technical or Planning modules can function.

---

## Acceptance Criteria

### AC-2.1.1: Product List View

**Given** the user has Technical role or higher
**When** they navigate to `/technical/products`
**Then** they see a product list page with:
- Page title: "Products"
- Search bar (search by code or name)
- Filter controls (type, status, category)
- "Add Product" button (top right)
- Data table with columns:
  - Code
  - Name
  - Type (RM, WIP, FG, PKG, BP)
  - UoM (Unit of Measure)
  - Status (Active, Inactive, Obsolete)
  - Version (e.g., 1.0, 1.5, 2.0)
  - Actions (View, Edit, Delete icons)

**And** the table supports:
- Sorting by any column
- Pagination (50 items per page)
- Responsive layout (mobile, tablet, desktop)

**Success Criteria:**
- Table loads products from GET /api/technical/products
- Empty state message if no products exist
- Loading skeleton during fetch
- Error message if API fails

---

### AC-2.1.2: Product Search and Filtering

**Given** I am on the Products list page
**When** I type in the search box
**Then** the product list filters in real-time matching code or name (case-insensitive)

**When** I select a Type filter (e.g., "RM")
**Then** only products of that type are displayed

**When** I select a Status filter (e.g., "Active")
**Then** only products with that status are displayed

**When** I select a Category filter
**Then** only products in that category are displayed

**When** I apply multiple filters
**Then** results match ALL filter criteria (AND logic)

**When** I clear filters
**Then** all products are displayed again

**Success Criteria:**
- Filters work independently and in combination
- URL params updated with active filters (shareable links)
- Filter state persists on page refresh

---

### AC-2.1.3: Create Product Modal

**Given** I am on the Products list page
**When** I click "Add Product" button
**Then** a modal dialog opens with the title "Create Product"

**And** the form contains fields:
- **Code** (text input, required, placeholder: "e.g., FLOUR-001")
  - Validation: 2-50 chars, alphanumeric + hyphens/underscores
  - Helper text: "Product code is immutable after creation"
- **Name** (text input, required, placeholder: "e.g., Wheat Flour")
  - Validation: 1-200 chars
- **Type** (dropdown, required)
  - Options: RM, WIP, FG, PKG, BP, + custom types from product_type_config
- **Description** (textarea, optional)
- **Category** (text input, optional, placeholder: "e.g., Bakery, Dairy")
- **Unit of Measure (UoM)** (text input, required, placeholder: "e.g., kg, L, unit")
- **Shelf Life (days)** (number input, optional, if visible per settings)
- **Min Stock Qty** (number input, optional, if visible per settings)
- **Max Stock Qty** (number input, optional, if visible per settings)
- **Reorder Point** (number input, optional, if visible per settings)
- **Cost per Unit** (number input, optional, if visible per settings)
- **Status** (dropdown, default: "Active")
  - Options: Active, Inactive, Obsolete

**And** field visibility is controlled by technical_settings.product_field_config

**And** form has buttons:
- "Cancel" (closes modal, no save)
- "Create Product" (saves and closes)

**Success Criteria:**
- Form validation shows inline errors
- Code uniqueness validated on blur (API call)
- Version automatically set to 1.0 (not shown in form)
- Created product appears in table immediately after save

---

### AC-2.1.4: Product Creation Validation

**Given** I am filling out the Create Product form
**When** I enter a code that already exists in the organization
**Then** an error message appears: "Product code 'X' already exists"
**And** the "Create Product" button is disabled

**When** I enter an invalid code format (e.g., "FL@UR!")
**Then** an error message appears: "Code must be alphanumeric with hyphens or underscores only"

**When** I leave required fields empty
**Then** field-level error messages appear: "This field is required"

**When** all validations pass
**Then** the "Create Product" button is enabled

**Success Criteria:**
- Client-side validation for format
- Server-side validation for uniqueness and business rules
- Clear, actionable error messages

---

### AC-2.1.5: Product Detail View

**Given** a product exists
**When** I click on a product row or the "View" icon
**Then** I navigate to `/technical/products/[id]`

**And** I see a product detail page with sections:
1. **Header:**
   - Product code (large, prominent)
   - Product name
   - Type badge (color-coded)
   - Status badge
   - Version number (e.g., "v1.0")
   - Action buttons: Edit, Delete, History

2. **Basic Information:**
   - Description
   - Category
   - Unit of Measure

3. **Inventory Settings** (if visible per settings):
   - Shelf Life
   - Min Stock Qty
   - Max Stock Qty
   - Reorder Point
   - Cost per Unit

4. **Allergens:** (Story 2.4)
   - Contains: [allergen badges]
   - May Contain: [allergen badges]
   - (Empty state if none assigned)

5. **Metadata:**
   - Created by: User Name, Date/Time
   - Last updated by: User Name, Date/Time

**Success Criteria:**
- Page loads from GET /api/technical/products/:id
- All data displayed accurately
- Breadcrumb navigation: Products > [Product Code]

---

### AC-2.1.6: Edit Product (Basic)

**Given** I am viewing a product detail page
**When** I click the "Edit" button
**Then** an Edit Drawer opens on the right side (shadcn Sheet component)

**And** the drawer contains:
- Title: "Edit Product"
- Same fields as Create form EXCEPT:
  - Code field is disabled (immutable, shown for reference)
  - Current values pre-filled
- Buttons: "Cancel", "Save Changes"

**When** I modify any field and click "Save Changes"
**Then** the product is updated via PUT /api/technical/products/:id
**And** the drawer closes
**And** the detail view refreshes with new data
**And** a success toast appears: "Product updated successfully"

**Note:** Version increment logic is handled in Story 2.2

**Success Criteria:**
- Form pre-fills with current values
- Code field is visibly disabled
- Save triggers API update
- UI updates optimistically

---

### AC-2.1.7: Delete Product (Soft Delete)

**Given** I am viewing a product detail page
**When** I click the "Delete" button
**Then** a confirmation dialog appears:
- Title: "Delete Product?"
- Message: "Are you sure you want to delete [Product Code]? This action can be undone by an admin."
- Buttons: "Cancel", "Delete"

**When** I click "Delete"
**Then** the product is soft deleted (deleted_at timestamp set)
**And** I am redirected to the product list
**And** the deleted product is no longer visible in the list
**And** a success toast appears: "Product deleted successfully"

**When** the product is referenced in BOMs or Work Orders
**Then** the delete fails with error: "Cannot delete product. It is referenced in X BOMs and Y Work Orders."

**Success Criteria:**
- Soft delete sets deleted_at, not hard delete
- Referential integrity enforced
- Clear error messages for constraint violations

---

## Technical Implementation

### File Structure

```
apps/frontend/app/technical/products/
├── page.tsx                         # Product list view
├── [id]/
│   └── page.tsx                     # Product detail view
└── components/
    ├── ProductTable.tsx             # Data table component
    ├── ProductCreateModal.tsx       # Create dialog
    ├── ProductEditDrawer.tsx        # Edit drawer
    └── ProductDeleteDialog.tsx      # Delete confirmation

lib/api/technical/
└── products.ts                      # API client functions

app/api/technical/products/
├── route.ts                         # GET (list), POST (create)
└── [id]/
    └── route.ts                     # GET (detail), PUT (update), DELETE (soft delete)
```

### API Endpoints

**GET /api/technical/products**
- Query params: search, type, status, category, page, limit, sort, order
- Returns: { data: Product[], pagination: {...} }

**POST /api/technical/products**
- Body: Product creation data
- Returns: Created product with id, version: 1.0

**GET /api/technical/products/:id**
- Returns: Full product details with allergens, audit info

**PUT /api/technical/products/:id**
- Body: Product update data (excluding code)
- Returns: Updated product with incremented version (Story 2.2)

**DELETE /api/technical/products/:id**
- Sets deleted_at timestamp
- Returns: { success: true }

### Database Schema

**Refer to:** tech-spec-epic-2-batch-2a.md, Section "Database Schema"

**Key Tables:**
- `products` - Main product table
- `product_version_history` - Version change log (Story 2.2)
- `product_allergens` - Allergen assignments (Story 2.4)
- `product_type_config` - Product type definitions (Story 2.5)
- `technical_settings` - Field visibility config (Story 2.22)

### Component Implementation

**ProductTable.tsx:**
```tsx
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <TypeBadge type={row.original.type} /> },
  { accessorKey: 'uom', header: 'UoM' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'version', header: 'Version' },
  { id: 'actions', cell: ({ row }) => <ProductActions product={row.original} /> }
]

export function ProductTable({ products, onEdit, onDelete }: Props) {
  return <DataTable columns={columns} data={products} />
}
```

**ProductCreateModal.tsx:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productCreateSchema } from '@/lib/validations/product'

export function ProductCreateModal({ open, onClose, onSuccess }: Props) {
  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'RM',
      uom: '',
      status: 'active'
    }
  })

  async function onSubmit(data: ProductCreateInput) {
    const product = await createProduct(data)
    onSuccess(product)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### Validation Schema (Zod)

```typescript
import { z } from 'zod'

export const productCreateSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric with hyphens or underscores only'),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  type: z.enum(['RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM']),
  description: z.string().optional(),
  category: z.string().optional(),
  uom: z.string().min(1, 'Unit of Measure is required'),
  shelf_life_days: z.number().int().positive().optional(),
  min_stock_qty: z.number().positive().optional(),
  max_stock_qty: z.number().positive().optional(),
  reorder_point: z.number().positive().optional(),
  cost_per_unit: z.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'obsolete']).default('active')
})

export const productUpdateSchema = productCreateSchema.omit({ code: true })
```

---

## UI/UX Specifications

### Visual Design

**Product Table:**
- Use shadcn/ui DataTable component
- Type badges: Color-coded (RM: blue, WIP: orange, FG: green, PKG: purple, BP: gray)
- Status badges: Active (green), Inactive (gray), Obsolete (red)
- Hover state on rows for better UX
- Action buttons: View (Eye icon), Edit (Pencil icon), Delete (Trash icon)

**Create Modal:**
- Max width: 2xl (640px)
- Form layout: 2 columns on desktop, 1 column on mobile
- Required fields marked with red asterisk
- Helper text below inputs for clarity

**Edit Drawer:**
- Right-side drawer (Sheet component)
- Width: 480px (lg breakpoint)
- Overlay dims background
- Scrollable content if form is long

**Color Palette:**
- Primary: Blue (for buttons, links)
- Success: Green (for Active status, success toasts)
- Warning: Orange (for WIP, warnings)
- Danger: Red (for delete actions, errors)
- Muted: Gray (for Inactive, metadata)

---

## Testing Checklist

### Unit Tests

```typescript
// Test: Product code validation
test('should reject invalid product code', () => {
  const result = productCreateSchema.safeParse({ code: 'FL@UR!' })
  expect(result.success).toBe(false)
})

// Test: Required fields
test('should require code, name, type, uom', () => {
  const result = productCreateSchema.safeParse({})
  expect(result.success).toBe(false)
  expect(result.error.issues).toHaveLength(4)
})
```

### Integration Tests

```typescript
// Test: Create product API
test('POST /api/technical/products creates product', async () => {
  const response = await fetch('/api/technical/products', {
    method: 'POST',
    body: JSON.stringify({
      code: 'TEST-001',
      name: 'Test Product',
      type: 'RM',
      uom: 'kg'
    })
  })
  expect(response.status).toBe(201)
  const product = await response.json()
  expect(product.version).toBe(1.0)
})

// Test: Duplicate code rejection
test('POST /api/technical/products rejects duplicate code', async () => {
  await createProduct({ code: 'DUP-001', name: 'First' })
  const response = await fetch('/api/technical/products', {
    method: 'POST',
    body: JSON.stringify({ code: 'DUP-001', name: 'Second', type: 'RM', uom: 'kg' })
  })
  expect(response.status).toBe(400)
})
```

### E2E Tests (Playwright)

```typescript
test('User creates a new product', async ({ page }) => {
  await page.goto('/technical/products')
  await page.click('button:has-text("Add Product")')

  // Fill form
  await page.fill('input[name="code"]', 'FLOUR-001')
  await page.fill('input[name="name"]', 'Wheat Flour')
  await page.selectOption('select[name="type"]', 'RM')
  await page.fill('input[name="uom"]', 'kg')

  // Submit
  await page.click('button:has-text("Create Product")')

  // Verify
  await expect(page.locator('table')).toContainText('FLOUR-001')
  await expect(page.locator('table')).toContainText('1.0') // Version
})

test('User edits a product', async ({ page }) => {
  await page.goto('/technical/products/[product-id]')
  await page.click('button:has-text("Edit")')

  // Change name
  await page.fill('input[name="name"]', 'Organic Wheat Flour')
  await page.click('button:has-text("Save Changes")')

  // Verify
  await expect(page.locator('h1')).toContainText('Organic Wheat Flour')
})

test('User deletes a product', async ({ page }) => {
  await page.goto('/technical/products/[product-id]')
  await page.click('button:has-text("Delete")')

  // Confirm
  await page.click('button:has-text("Delete"):last')

  // Verify redirect to list
  await expect(page).toHaveURL('/technical/products')
  await expect(page.locator('table')).not.toContainText('DELETED-PRODUCT')
})
```

---

## Dependencies

**Required Before This Story:**
- ✅ Epic 1 complete (organizations, users, RLS)
- ✅ Database migration 014 (products tables)
- ✅ API route structure setup
- ✅ shadcn/ui components installed (Dialog, Sheet, Form, DataTable)

**Blocks:**
- Story 2.2 (Product Versioning) - builds on edit functionality
- Story 2.3 (Product History) - requires product CRUD
- Story 2.4 (Product Allergens) - requires products to exist
- Story 2.6 (BOM CRUD) - BOMs reference products
- All Epic 3 stories - Planning requires products

---

## Notes

### Design Decisions

1. **Immutable Code:** Product codes cannot be changed after creation to ensure referential integrity in BOMs, WOs, etc.

2. **Soft Delete:** Products are soft deleted (deleted_at) rather than hard deleted to preserve audit trails and prevent orphaned references.

3. **Version Starts at 1.0:** All new products begin at version 1.0, auto-incremented on edits (Story 2.2).

4. **Configurable Fields:** Field visibility controlled by technical_settings to support different industry needs.

### Future Enhancements (Not in MVP)

- Bulk import from CSV/Excel
- Product images and attachments
- Product templates
- Multi-UoM support (kg ↔ lb conversions)
- Product variants (size, color, packaging)
- Advanced filtering (custom fields, date ranges)
- Product approval workflow
- Product lifecycle management

---

## Definition of Done

- [ ] Products table created with RLS policies
- [ ] Product CRUD API endpoints implemented and tested
- [ ] Product list view with search, filters, pagination
- [ ] Product create modal with validation
- [ ] Product detail view with all sections
- [ ] Product edit drawer
- [ ] Product soft delete with confirmation
- [ ] Code uniqueness validation
- [ ] Unit tests for validation schemas (95% coverage)
- [ ] Integration tests for API endpoints (70% coverage)
- [ ] E2E tests for user flows (create, edit, delete)
- [ ] Code review approved
- [ ] Story documentation committed
- [ ] Seed data script updated

---

## Estimation Breakdown

**5 Story Points = ~8-12 hours**
- Database migration: 1 hour
- API endpoints (CRUD): 3 hours
- Product list view + table: 2 hours
- Create modal + validation: 2 hours
- Detail view: 1 hour
- Edit drawer: 1 hour
- Delete functionality: 1 hour
- Testing (unit, integration, E2E): 3 hours
- Bug fixes and polish: 2 hours
