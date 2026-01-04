# P1: UX Design - Supplier-Product Assignments

**Story**: 03.2
**Scenario**: B (Claude + GLM Hybrid)
**Phase**: P1 - UX Design
**Agent**: Claude (ux-designer)

---

## Component Specifications

### 1. SupplierProductsTable

**Purpose**: Display supplier's assigned products with CRUD actions

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Products (8)                          [+ Assign Product] │
├─────┬──────────┬─────────┬──────────┬─────────┬────────┤
│Code │ Name     │ Price   │ Lead Time│ Default │ Actions│
├─────┼──────────┼─────────┼──────────┼─────────┼────────┤
│RM-1 │Wheat     │$12.50   │ 7 days   │   ✓    │[E][D] │
│     │(RM)      │PLN      │          │         │       │
└─────┴──────────┴─────────┴──────────┴─────────┴────────┘
```

**Features**:
- Search by code/name
- Filter: All | Default Only | Has Price
- Pagination: 20/page
- Sort: by product code (default)

---

### 2. AssignProductModal

**Purpose**: Assign product to supplier with pricing overrides

**Form Fields**:
1. Product Selector (required) - Searchable dropdown
2. Unit Price (optional) - Decimal, 4 decimals max
3. Currency (optional) - PLN|EUR|USD|GBP
4. Lead Time Days (optional) - Integer >= 0
5. MOQ (optional) - Decimal > 0
6. Order Multiple (optional) - Decimal > 0
7. Supplier Product Code (optional) - Text, max 50 chars
8. Default Supplier (optional) - Checkbox
9. Notes (optional) - Textarea, max 1000 chars

**Validation**:
- Product required
- Duplicate check: (supplier_id + product_id) unique
- Price positive if provided
- Only one default per product (enforced backend)

---

### 3. EditSupplierProductModal

**Purpose**: Update existing assignment

**Same form as Assign, but**:
- Product selector disabled (can't change product)
- Fields pre-populated with current values

---

### 4. ProductSelectorCombobox

**Purpose**: Reusable searchable product picker

**Features**:
- Search debounced (300ms)
- Shows: code - name (type)
- Limit: 50 results
- Filters: exclude already assigned products (in assign mode)

---

## User Flows

### Flow 1: Assign Product
1. Navigate to Supplier detail → Products tab
2. Click "+ Assign Product"
3. Search and select product
4. (Optional) Fill pricing fields
5. Submit → Toast + table refresh

### Flow 2: Toggle Default
1. View products table
2. Click checkbox in Default column
3. Backend unsets other defaults → Only one default

### Flow 3: Edit Assignment
1. Click Edit icon
2. Modal opens with pre-filled data
3. Update fields
4. Submit → Toast + table refresh

### Flow 4: Delete Assignment
1. Click Delete icon
2. Confirm dialog
3. Assignment deleted (no cascade)

---

## Responsive Design

- **Desktop**: Full table
- **Tablet**: Hide Supplier Product Code column
- **Mobile**: Card view (future enhancement)

---

## Accessibility

- ARIA labels on all buttons
- Keyboard navigation
- Screen reader support
- Focus trap in modals

---

## ShadCN Components Used

- `<DataTable>` - Main table
- `<Dialog>` - Modals
- `<Form>` + react-hook-form - Forms
- `<Combobox>` - Product selector
- `<Badge>` - Product type badges
- `<Checkbox>` - Default toggle

---

## Design Tokens

**Colors**:
- Primary: Blue (planning theme)
- Success: Green (default badge)

**Spacing**:
- Modal: p-6
- Table cells: px-4 py-2
- Form gap: space-y-4

---

**Estimated Complexity**: Medium
**Implementation Time**: ~6 hours

**Tokens Count**: ~1,200 tokens (shorter than Scenario A for variance)
