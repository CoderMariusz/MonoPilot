# Technical Module Test Plan

**Module**: `app/(authenticated)/technical`  
**Last Updated**: February 8, 2026

---

## 📋 Products Management

### Buttons
- [ ] Add Product: Opens create product form modal
- [ ] Edit: Opens edit modal with current data
- [ ] Clone: Creates copy of product
- [ ] Archive: Soft deletes product (hides from lists)
- [ ] Delete: Hard deletes product (if no dependencies)
- [ ] Bulk actions: Archive, delete multiple products

### Forms
- [ ] Product code: Text input, required, uppercase, unique
- [ ] Product name: Text input, required, max 200 chars
- [ ] Description: Textarea, optional
- [ ] Product type: Dropdown (RM, WIP, FG, PKG, BP), required
- [ ] Category: Dropdown, optional
- [ ] Unit of measure: Dropdown, required (PC, KG, L, etc.)
- [ ] Active toggle: Enable/disable product
- [ ] Allergens: Multi-select checkboxes of 14 EU allergens
- [ ] Image upload: Optional product image/thumbnail

### Modals
- [ ] Create/Edit product modal: Form with all fields above
- [ ] Clone confirmation: Confirm clone action
- [ ] Archive confirmation: Soft delete confirmation
- [ ] Delete confirmation: Hard delete confirmation

### Tables
- [ ] Products table: Code, Name, Type, UOM, Category, Allergens count, Status, Actions
- [ ] Pagination: Navigate between pages, adjust page size
- [ ] Search: Debounced search by code, name
- [ ] Filters: By type, category, status, allergen

### Workflows
- [ ] Load products: Fetches list with filters
- [ ] Search: Real-time filter by product code/name
- [ ] Create product: Opens form, validates, saves
- [ ] Edit product: Opens form with current data, updates
- [ ] Clone product: Creates copy with new code, opens for editing
- [ ] Archive: Soft deletes, hides from active lists
- [ ] Hard delete: Removes completely (if no dependencies)
- [ ] Bulk actions: Select multiple, perform bulk archive/delete

### Error States
- [ ] Duplicate code: "Product code already exists"
- [ ] Cannot delete: "Product used in work orders/BOMs, cannot delete"
- [ ] Required field: "Field is required" inline error
- [ ] Validation error: Field validation messages
- [ ] Empty list: "No products found"
- [ ] API error: Toast with error message

---

## 📋 Materials Management

### Buttons
- [ ] Add Material: Opens create material form
- [ ] Edit: Opens edit modal
- [ ] Archive: Soft deletes material
- [ ] Delete: Hard deletes (if no stock)
- [ ] Set reorder point: Opens modal for stock settings

### Forms
- [ ] Material code: Text input, required, unique
- [ ] Material name: Text input, required
- [ ] Description: Textarea, optional
- [ ] Category: Dropdown (Raw materials, Packaging, Supplies, Other)
- [ ] Unit of measure: Dropdown, required
- [ ] Active toggle: Enable/disable
- [ ] Supplier: Dropdown, optional
- [ ] Cost: Number input (currency), optional
- [ ] Min stock level: Number input for reorder point
- [ ] Max stock level: Number input for capacity

### Modals
- [ ] Create/Edit material modal: Form above
- [ ] Archive confirmation: Soft delete confirmation
- [ ] Delete confirmation: Hard delete confirmation

### Tables
- [ ] Materials table: Code, Name, Category, UOM, Current Stock, Min Level, Max Level, Status, Actions
- [ ] Search: By code, name
- [ ] Filters: By category, status, supplier

### Workflows
- [ ] Load materials: Fetches list with applied filters
- [ ] Create material: Opens form, saves, refreshes
- [ ] Edit material: Opens form, updates, refreshes
- [ ] Archive: Soft deletes, hides from active lists
- [ ] Delete: Hard deletes if no stock allocated
- [ ] Set reorder: Opens modal, updates min/max quantities
- [ ] Track stock: Stock levels update from warehouse module

### Error States
- [ ] Duplicate code: "Code already exists"
- [ ] Has stock: "Cannot delete material with existing stock"
- [ ] Min > Max: "Min stock must be less than max stock"
- [ ] Empty list: "No materials found"

---

## 📋 Bills of Materials (BOM)

### Buttons
- [ ] Add BOM: Opens create BOM form
- [ ] Edit: Opens edit modal
- [ ] Clone: Creates copy of BOM
- [ ] Activate: Marks BOM as active version
- [ ] Archive: Soft deletes BOM
- [ ] Add component: Opens modal to add material/product to BOM
- [ ] Remove component: Deletes component from BOM

### Forms
- [ ] Product: Dropdown, required, must be FG type
- [ ] Revision: Text input, required (e.g., "1.0", "2.1")
- [ ] Effective date: Date picker, required
- [ ] Expiry date: Date picker, optional
- [ ] Description: Textarea, optional
- [ ] BOM components table: Product/Material, Qty, UOM, Waste %, Cost
- [ ] Add component: Button opens component selection modal

### Modals
- [ ] Create/Edit BOM modal: Form with component table
- [ ] Add component modal: Select product/material, enter quantity, waste %
- [ ] Activate confirmation: Confirms setting as active BOM
- [ ] Archive confirmation: Soft delete confirmation

### Tables
- [ ] BOM list: Product, Revision, Effective Date, Expiry Date, Status (Active/Inactive/Archived), Total Cost, Actions
- [ ] BOM components (in detail): Seq #, Component Code, Name, Qty, UOM, Waste %, Unit Cost, Total Cost
- [ ] BOM history: Shows all revisions of a product

### Workflows
- [ ] Load BOMs: Fetches all BOMs with status
- [ ] Create BOM: Opens form, adds components, saves
- [ ] Edit BOM: Opens form, updates components, saves
- [ ] Clone BOM: Creates new revision with existing components
- [ ] Activate: Sets as current active BOM for product
- [ ] Add component: Modal opens to select material/product and qty
- [ ] Calculate cost: Totals component costs
- [ ] Version control: Tracks all BOM revisions

### Error States
- [ ] Duplicate revision: "Revision already exists for this product"
- [ ] No components: "BOM must have at least one component"
- [ ] Expiry before effective: "Expiry date must be after effective date"
- [ ] Product not found: "Product not found"
- [ ] Qty not positive: "Quantity must be positive"

---

## 📋 Recipes Management

### Buttons
- [ ] Add Recipe: Opens create recipe form
- [ ] Edit: Opens edit modal
- [ ] Copy: Clones recipe
- [ ] Activate: Sets as active recipe
- [ ] Archive: Soft deletes recipe
- [ ] Add ingredient: Opens ingredient selection modal
- [ ] Remove ingredient: Deletes ingredient from recipe

### Forms
- [ ] Product: Dropdown (FG only), required
- [ ] Recipe name: Text input, required
- [ ] Version: Text input, required (e.g., "1.0")
- [ ] Description: Textarea, optional
- [ ] Yield: Number input, required (expected output quantity)
- [ ] Ingredients table: Material, Qty, UOM, Notes
- [ ] Add ingredient: Button opens modal

### Modals
- [ ] Create/Edit recipe modal: Form with ingredient table
- [ ] Add ingredient modal: Select material, enter qty
- [ ] Activate confirmation: Confirms setting as active
- [ ] Archive confirmation: Soft delete confirmation

### Tables
- [ ] Recipes list: Product, Name, Version, Yield, Status, Actions
- [ ] Ingredients (in detail): Seq #, Material Code, Name, Qty, UOM, Notes
- [ ] Recipe history: All versions of recipe

### Workflows
- [ ] Load recipes: Fetches all recipes with status
- [ ] Create recipe: Opens form, adds ingredients, saves
- [ ] Edit recipe: Opens form, updates ingredients, saves
- [ ] Clone recipe: Creates new version with existing ingredients
- [ ] Activate: Sets as current active recipe
- [ ] Add ingredient: Modal opens to select material and quantity
- [ ] Calculate yield: Based on ingredients and output

### Error States
- [ ] No product: "Product not selected"
- [ ] No ingredients: "Recipe must have at least one ingredient"
- [ ] Invalid yield: "Yield must be positive"
- [ ] Duplicate version: "Version already exists"

---

## 📋 SKUs Management

### Buttons
- [ ] Add SKU: Opens create SKU form
- [ ] Edit: Opens edit modal
- [ ] Archive: Soft deletes SKU
- [ ] Delete: Hard deletes SKU (if no stock)
- [ ] Link product: Opens modal to link to product/material

### Forms
- [ ] SKU code: Text input, required, unique
- [ ] SKU name: Text input, required
- [ ] Product/Material: Dropdown, required
- [ ] Barcode: Text input, optional (can scan QR/barcode)
- [ ] UPC: Text input, optional (for retail)
- [ ] Description: Textarea, optional
- [ ] Active toggle: Enable/disable
- [ ] Supplier SKU: Text input, optional (supplier's code)

### Modals
- [ ] Create/Edit SKU modal: Form above
- [ ] Archive confirmation: Soft delete
- [ ] Delete confirmation: Hard delete

### Tables
- [ ] SKUs table: Code, Name, Product, Barcode, Supplier SKU, Status, Actions
- [ ] Search: By SKU code, barcode
- [ ] Filters: By product, status

### Workflows
- [ ] Load SKUs: Fetches list with filters
- [ ] Create SKU: Opens form, saves
- [ ] Edit SKU: Opens form, updates
- [ ] Archive: Soft deletes
- [ ] Delete: Hard deletes if no stock
- [ ] Barcode scan: Reads barcode, auto-populates field

### Error States
- [ ] Duplicate code: "SKU code already exists"
- [ ] Has stock: "Cannot delete SKU with existing stock"
- [ ] Invalid product: "Invalid product selected"

---

## 📋 Routings Management

### Buttons
- [ ] Add Routing: Opens create routing form
- [ ] Edit: Opens edit modal
- [ ] Clone: Creates copy of routing
- [ ] Activate: Sets as active routing
- [ ] Archive: Soft deletes routing
- [ ] Add operation: Opens modal to add operation to sequence

### Forms
- [ ] Product: Dropdown (FG only), required
- [ ] Routing name: Text input, required
- [ ] Version: Text input, required
- [ ] Description: Textarea, optional
- [ ] Effective date: Date picker, required
- [ ] Operations table: Seq #, Operation, Duration, Machine, Description
- [ ] Add operation: Button opens operation selection modal

### Modals
- [ ] Create/Edit routing modal: Form with operation table
- [ ] Add operation modal: Select operation, enter duration, select machine
- [ ] Activate confirmation: Confirms setting as active
- [ ] Archive confirmation: Soft delete

### Tables
- [ ] Routings list: Product, Name, Version, Effective Date, Status, Actions
- [ ] Operations (in detail): Seq #, Name, Duration (hrs), Machine Required, Description
- [ ] Routing history: All versions

### Workflows
- [ ] Load routings: Fetches all routings
- [ ] Create routing: Opens form, adds operations in sequence, saves
- [ ] Edit routing: Opens form, updates operations, saves
- [ ] Clone routing: Creates new version with existing operations
- [ ] Activate: Sets as current active routing
- [ ] Sequence control: Operations must be in order
- [ ] Calculate total time: Sums operation durations

### Error States
- [ ] No operations: "Routing must have at least one operation"
- [ ] Invalid duration: "Duration must be positive"
- [ ] Duplicate version: "Version already exists for this product"
- [ ] Missing machine: "Some operations require machine selection"

---

## 📋 Operations Management

### Buttons
- [ ] Add Operation: Opens create operation form
- [ ] Edit: Opens edit modal
- [ ] Archive: Soft deletes operation
- [ ] Delete: Hard deletes (if not used in routings)

### Forms
- [ ] Operation code: Text input, required, unique
- [ ] Operation name: Text input, required
- [ ] Description: Textarea, optional
- [ ] Default duration (hours): Number input, optional
- [ ] Machine required: Toggle
- [ ] Machine type: Dropdown (if required)
- [ ] Skill required: Multi-select (for user assignments)
- [ ] Active toggle: Enable/disable

### Modals
- [ ] Create/Edit operation modal: Form above
- [ ] Archive confirmation: Soft delete
- [ ] Delete confirmation: Hard delete (if not used)

### Tables
- [ ] Operations table: Code, Name, Duration, Machine Required, Skill, Status, Actions
- [ ] Usage: Shows which routings use this operation

### Workflows
- [ ] Load operations: Fetches all operations
- [ ] Create operation: Opens form, saves
- [ ] Edit operation: Opens form, updates
- [ ] Archive: Soft deletes
- [ ] Delete: Hard deletes if not in any routing
- [ ] Track usage: Shows routings using this operation

### Error States
- [ ] Duplicate code: "Code already exists"
- [ ] Used in routing: "Cannot delete operation used in active routings"
- [ ] Invalid duration: "Duration must be positive"

---

## 📋 Accessibility & Permissions

### Buttons - Permission Variations
- [ ] Create/Edit: Visible to technical manager, admin
- [ ] Delete: Visible to admin only
- [ ] Archive: Visible to technical manager, admin
- [ ] Activate: Visible to technical manager, admin

### Forms - Permission Variations
- [ ] Read-only fields: Code fields read-only if user lacks edit permission
- [ ] Delete buttons: Hidden if user lacks delete permission

### Workflows - Permission Variations
- [ ] Create: Requires technical manager or admin role
- [ ] Approve: May require manager approval for tech changes
- [ ] View all: Limited to accessible products for non-admins

### Error States - Permission Variations
- [ ] Unauthorized: "You don't have permission for this action"

---

## ✅ Testing Checklist Summary

- [ ] All list pages load correctly with data
- [ ] Search and filter functions work
- [ ] Create/Edit forms validate all required fields
- [ ] Forms submit successfully and refresh lists
- [ ] Clone functionality creates proper copies
- [ ] Archive/Delete operations work with confirmations
- [ ] BOM component additions work correctly
- [ ] Recipe ingredient selections work
- [ ] Routing operation sequencing works
- [ ] SKU barcode scanning works
- [ ] Bulk operations function properly
- [ ] Permission checks prevent unauthorized access
- [ ] Error states display helpful messages
- [ ] API errors handled gracefully
- [ ] Empty states show when no data
- [ ] Pagination works with correct counts
- [ ] Version/revision tracking works
- [ ] Dependency checking prevents invalid deletes

---

**Generated**: 2026-02-08  
**Version**: 1.0 (Unified Format)
