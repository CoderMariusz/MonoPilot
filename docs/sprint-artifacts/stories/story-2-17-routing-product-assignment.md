# Story 2.17: Routing-Product Assignment

**Epic:** 2 - Technical Core
**Batch:** 2C - Routing System
**Status:** Completed (Backend)
**Priority:** P1 (High)
**Story Points:** 5
**Created:** 2025-11-23

---

## Goal

Enable bi-directional assignment between products and routings, with support for reusable routings and default routing selection.

## User Story

**As a** Technical user
**I want** to assign routings to products (and vice versa)
**So that** work orders know which production process to follow when manufacturing a product

---

## Problem Statement

Products and routings need to be linked:
- A product may have multiple valid routings (e.g., standard vs. express production)
- A reusable routing can be used for multiple products (e.g., "Standard Mixing" used for Bread, Cake, Dough)
- Each product should have one default routing for automatic work order creation
- Non-reusable routings (product-specific) can only be assigned to one product

Without this many-to-many relationship:
- Work orders can't determine which operations to execute
- Products can't specify their production method
- Capacity planning can't estimate throughput

---

## Acceptance Criteria

### AC-2.17.1: Assign Products to Routing (from Routing Side)

**Given** I am viewing a routing detail page
**And** I have Admin or Technical role
**When** I click "Assign Products" button in the Assigned Products section
**Then** a modal dialog opens with the title "Assign Products to Routing"

**And** the modal shows:
- **Routing Info Card:**
  - Routing code and name
  - Reusable status badge
  - Warning if non-reusable and already assigned

- **Product Selection:**
  - Multi-select dropdown showing all products from organization
  - Each option: "[Product Code] - [Product Name]"
  - Search/filter by code or name
  - Currently assigned products pre-selected

- **Default Product Selection:**
  - Checkbox for each selected product: "Set as default for this product"
  - Only one can be checked
  - Helper text: "The default routing will be auto-selected when creating work orders"

**And** if routing is non-reusable (is_reusable = false):
- Limit selection to maximum 1 product
- Show warning: "This routing is not reusable and can only be assigned to one product"

**API Endpoint:**
```
PUT /api/technical/routings/:id/products
Body: {
  product_ids: string[],
  default_product_id?: string
}
Response: {
  success: true,
  message: string
}
```

**Success Criteria:**
- Assigned products appear in table immediately after save
- Default badge shown for default product
- Success toast: "Products assigned successfully"
- Error if non-reusable routing assigned to >1 product

---

### AC-2.17.2: Reusable vs Non-Reusable Routing Validation

**Given** a routing has is_reusable = false
**When** I try to assign it to multiple products
**Then** the API returns error 400: "This routing is not reusable and can only be assigned to one product"
**And** the frontend shows error message
**And** the assignment is not saved

**Given** a routing has is_reusable = true
**When** I assign it to multiple products
**Then** the assignment succeeds
**And** all products are linked to the routing

**Success Criteria:**
- Validation enforced in service layer (routing-service.ts)
- Clear error message displayed
- Multi-select disabled when routing is non-reusable

---

### AC-2.17.3: Set Default Routing for Product

**Given** a product has multiple routings assigned
**When** I set one routing as default
**Then** only that routing has is_default = true
**And** all other routings for this product have is_default = false

**When** work orders are created for this product (Epic 3)
**Then** the default routing is auto-selected

**Database Trigger:**
```sql
CREATE TRIGGER product_routings_validate_default
  BEFORE INSERT OR UPDATE ON product_routings
  FOR EACH ROW
  EXECUTE FUNCTION validate_default_routing();
```

**Success Criteria:**
- Only one default routing per product (enforced by trigger)
- Default badge visible in product detail page
- Changing default un-defaults previous default

---

### AC-2.17.4: Assigned Products Table (Routing Side)

**Given** I am viewing a routing detail page
**When** the Assigned Products section loads
**Then** I see a table showing assigned products

**And** the table has columns:
- **Product Code**
- **Product Name**
- **Product Type** (RM, WIP, FG, etc.)
- **Default** (badge: "Default" if is_default = true, otherwise "—")
- **Actions** (Unassign icon, Admin/Technical only)

**And** the header shows:
- "Assigned Products (X)" where X is count
- "Assign Products" button (Admin/Technical only)

**Success Criteria:**
- Products loaded from product_routings join
- Empty state: "No products assigned. Assign products to use this routing in work orders."
- Default badge highlighted (green)
- Click product code navigates to product detail

---

### AC-2.17.5: Assigned Routings Table (Product Side)

**Given** I am viewing a product detail page (from Batch 2A)
**When** the Assigned Routings section loads
**Then** I see a table showing assigned routings

**And** the table has columns:
- **Routing Code**
- **Routing Name**
- **Status** (Active/Inactive badge)
- **Operations Count**
- **Default** (badge: "Default" if is_default = true, otherwise "—")
- **Actions** (View, Unassign icons)

**And** the header shows:
- "Assigned Routings (X)" where X is count
- "Assign Routings" button (Admin/Technical only)

**Success Criteria:**
- Routings loaded from product_routings join
- Empty state: "No routings assigned. Assign a routing to define the production process."
- Default badge highlighted (green)
- Click routing code navigates to routing detail

---

### AC-2.17.6: Bi-Directional Assignment

**Scenario 1: From Routing Side**
**Given** I am viewing routing "RTG-001"
**When** I assign products "PROD-A", "PROD-B", "PROD-C"
**Then** all three products show routing "RTG-001" in their assigned routings

**Scenario 2: From Product Side**
**Given** I am viewing product "PROD-A"
**When** I assign routings "RTG-001", "RTG-002"
**Then** both routings show product "PROD-A" in their assigned products

**Success Criteria:**
- Assignment works from either side
- Same product_routings table updated
- Changes reflect on both routing and product detail pages

---

### AC-2.17.7: Unassign Product from Routing

**Given** I am viewing a routing's assigned products table
**And** I have Admin or Technical role
**When** I click the "Unassign" icon for a product
**Then** a confirmation dialog appears

**And** the dialog shows:
- Title: "Unassign Product?"
- Message: "Are you sure you want to remove product '[Code]' from routing '[Routing Code]'?"
- Buttons: "Cancel", "Unassign"

**When** I click "Unassign"
**Then** the product_routing record is deleted
**And** the table refreshes without that product
**And** success toast: "Product unassigned successfully"

**API Endpoint:**
```
DELETE /api/technical/routings/:id/products/:productId
Response: {
  success: true,
  message: string
}
```

**Success Criteria:**
- Confirmation prevents accidental unassignment
- Table updates immediately
- Product detail page also reflects change

---

### AC-2.17.8: Assign Routings to Product (from Product Side)

**Given** I am viewing a product detail page
**And** I have Admin or Technical role
**When** I click "Assign Routings" button
**Then** a modal dialog opens with the title "Assign Routings to Product"

**And** the modal shows:
- **Product Info Card:**
  - Product code and name
  - Product type

- **Routing Selection:**
  - Multi-select dropdown showing all routings from organization
  - Each option: "[Routing Code] - [Routing Name]"
  - Search/filter by code or name
  - Currently assigned routings pre-selected
  - Only active routings shown

- **Default Routing Selection:**
  - Radio buttons for each selected routing: "Set as default"
  - Only one can be selected
  - Helper text: "The default routing will be auto-selected when creating work orders"

**And** validation:
- Cannot assign non-reusable routing if already assigned to another product
- Error message: "Routing [Code] is not reusable and is already assigned to another product"

**API Endpoint:**
```
PUT /api/technical/products/:id/routings
Body: {
  routing_ids: string[],
  default_routing_id?: string
}
Response: {
  success: true,
  message: string
}
```

**Success Criteria:**
- Assigned routings appear in table immediately
- Default badge shown for default routing
- Success toast: "Routings assigned successfully"
- Non-reusable validation enforced

---

### AC-2.17.9: Default Routing Badge Display

**Given** a product has 3 assigned routings
**And** one is marked as default
**When** viewing the product's routings table
**Then** the default routing shows a green "Default" badge

**When** viewing the routing's products table
**Then** products where this routing is default show "Default" badge

**Success Criteria:**
- Badge color: green (success variant)
- Badge position: in "Default" column
- Badge text: "Default"
- No badge if not default (show "—")

---

### AC-2.17.10: Routing Assignment Impact on Work Orders

**Given** a product has a default routing assigned
**When** a user creates a work order for this product (Epic 3)
**Then** the default routing is auto-selected in the routing dropdown

**When** a product has multiple routings but no default
**Then** the work order form shows all routings in dropdown
**And** user must manually select one

**When** a product has no routings assigned
**Then** work order creation is blocked
**And** error message: "Cannot create work order: Product has no routings assigned"

**Success Criteria:**
- Default routing selection improves UX
- Multiple routing options allow flexibility
- Validation prevents work orders without routing

---

## Technical Requirements

### Database Schema

**Table: product_routings**
```sql
CREATE TABLE product_routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,  -- FK to products (added when products table created)
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT product_routings_unique UNIQUE (product_id, routing_id)
);
```

**Default Routing Trigger:**
```sql
CREATE FUNCTION validate_default_routing() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE product_routings
    SET is_default = false
    WHERE product_id = NEW.product_id
      AND routing_id != NEW.routing_id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_routings_validate_default
  BEFORE INSERT OR UPDATE ON product_routings
  FOR EACH ROW
  EXECUTE FUNCTION validate_default_routing();
```

### API Endpoints

1. **PUT /api/technical/routings/:id/products**
   - Body: { product_ids: string[], default_product_id?: string }
   - Returns: { success: true, message: string }
   - Auth: Admin, Technical

2. **PUT /api/technical/products/:id/routings**
   - Body: { routing_ids: string[], default_routing_id?: string }
   - Returns: { success: true, message: string }
   - Auth: Admin, Technical

3. **DELETE /api/technical/routings/:id/products/:productId**
   - Returns: { success: true, message: string }
   - Auth: Admin, Technical

4. **DELETE /api/technical/products/:id/routings/:routingId**
   - Returns: { success: true, message: string }
   - Auth: Admin, Technical

---

## Implementation Status

### ✅ Completed (Backend)
- [x] Database migration (022_create_product_routings_table.sql)
- [x] Default routing trigger
- [x] Service layer (assignProductsToRouting function)
- [x] Validation schemas (assignProductsSchema, assignRoutingsSchema)
- [x] API routes (PUT /api/technical/routings/:id/products)
- [x] RLS policies
- [x] Reusability validation

### ⏳ Pending (Frontend)
- [ ] Assign products modal (routing side)
- [ ] Assign routings modal (product side)
- [ ] Assigned products table (routing detail)
- [ ] Assigned routings table (product detail)
- [ ] Default routing badge
- [ ] Unassign confirmation dialogs

### ⏳ Pending (Products Integration)
- [ ] Products table migration (Batch 2A)
- [ ] Add FK constraint: product_routings.product_id → products.id
- [ ] Product detail page routings section

---

## Testing Checklist

### Unit Tests
- [ ] Default routing trigger (only one default per product)
- [ ] Reusable routing validation
- [ ] Unique product-routing combination

### Integration Tests
- [ ] Assign products to routing API
- [ ] Assign routings to product API
- [ ] Unassign product/routing API
- [ ] Bi-directional assignment consistency
- [ ] Non-reusable routing enforcement

### E2E Tests
- [ ] Assign products to reusable routing
- [ ] Assign products to non-reusable routing (should fail if >1)
- [ ] Set default routing for product
- [ ] Change default routing
- [ ] Unassign product from routing
- [ ] View assignments from both sides

---

## Dependencies

### Requires
- ✅ Story 2.15: Routing CRUD
- 🔄 Batch 2A Story 2.1: Product CRUD (for full functionality)

### Enables
- 🔄 Epic 3: Work Orders (routing selection based on product)
- 🔄 Epic 4: Production (operation execution based on routing)

---

## UI/UX Notes

### Multi-Select Dropdowns
- Use shadcn/ui Multi-Select component
- Show selected items as badges below dropdown
- Allow search/filter by code or name
- "Select all" and "Clear all" buttons

### Default Selection
- Radio buttons for single selection
- Only enabled for items in multi-select
- Visual indicator when default changes

### Bi-Directional UX
- Consistent UI on both product and routing sides
- Same modal design, different context
- Clear indication of direction (assigning X to Y)

---

## Business Rules Summary

1. **Many-to-Many:** Products ↔ Routings
2. **Reusable Routings:** Can be assigned to multiple products
3. **Non-Reusable Routings:** Max 1 product assignment
4. **Default Routing:** Only 1 default per product (enforced by trigger)
5. **Cascade Delete:** Delete routing → remove all product assignments
6. **Bi-Directional:** Assignment works from product or routing side

---

## Notes

- Product-routing assignments are the link between master data (products, routings) and operational data (work orders)
- Default routing improves UX but is not mandatory
- Non-reusable routings allow product-specific processes
- Assignment from either side updates the same product_routings table
- FK to products table will be added when products migration is run (Batch 2A)

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2c-routing.md`
- Migration: `apps/frontend/lib/supabase/migrations/022_create_product_routings_table.sql`
- Service: `apps/frontend/lib/services/routing-service.ts` (assignProductsToRouting)
