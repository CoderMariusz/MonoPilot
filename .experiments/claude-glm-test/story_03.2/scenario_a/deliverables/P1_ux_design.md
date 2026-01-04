# P1: UX Design - Supplier-Product Assignments

**Story**: 03.2 - Supplier-Product Assignments
**Phase**: P1 - UX Design
**Scenario**: A (Claude Full Flow)

---

## Component Wireframes

### 1. SupplierProductsTable Component

**Location**: `components/planning/SupplierProductsTable.tsx`

**Purpose**: Display all products assigned to a supplier with CRUD actions

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Products (12)                                    [+ Assign Product]│
├─────────────────────────────────────────────────────────────────┤
│ Search: [                    ] Filter: [All] [Default Only]     │
├──────┬────────────┬─────────┬────────┬──────────┬────────┬──────┤
│ Code │ Name       │ Price   │ Lead   │ MOQ      │Default │Actions│
│      │            │         │ Time   │          │        │      │
├──────┼────────────┼─────────┼────────┼──────────┼────────┼──────┤
│RM-001│Wheat Flour │$12.50   │ 7 days │ 100 kg   │  ✓    │[Edit]│
│      │ (Type: RM) │ (PLN)   │        │          │        │[Del] │
├──────┼────────────┼─────────┼────────┼──────────┼────────┼──────┤
│RM-002│Sugar       │$8.00    │ 14 days│ 50 kg    │  -    │[Edit]│
│      │ (Type: RM) │ (USD)   │        │          │        │[Del] │
└──────┴────────────┴─────────┴────────┴──────────┴────────┴──────┘
Showing 1-10 of 12 products                     [< 1 2 >]
```

**Columns**:
1. **Product Code** - Searchable, sortable
2. **Product Name** - With product type badge (RM, ING, WIP, FG)
3. **Price** - `unit_price` with `currency` symbol, nullable
4. **Lead Time** - `lead_time_days` override or product default
5. **MOQ** - Minimum order quantity
6. **Default** - Toggle checkbox (only one per product)
7. **Actions** - Edit (modal), Delete (confirm)

**Search**: Real-time filter by product code or name

**Filter Options**:
- All Products
- Default Only (`is_default = true`)
- Has Price
- No Price

**Pagination**: 20 per page

**Empty State**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    📦 No Products Assigned                       │
│                                                                  │
│   Assign products to this supplier to enable quick PO creation  │
│                                                                  │
│                     [+ Assign Product]                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. AssignProductModal Component

**Location**: `components/planning/AssignProductModal.tsx`

**Trigger**: Click "+ Assign Product" button in SupplierProductsTable

**Purpose**: Assign a new product to supplier with pricing/lead time overrides

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Assign Product to Supplier                              [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Supplier: ACME Ingredients (SUP-001)                            │
│                                                                  │
│ Select Product *                                                │
│ [🔍 Search products...                          ▼]              │
│ └─ RM-003 - Whole Wheat Flour (Raw Material)                    │
│    RM-004 - Rye Flour (Raw Material)                            │
│    ...                                                           │
│                                                                  │
│ ┌─ Supplier-Specific Overrides ────────────────────────────┐    │
│ │                                                           │    │
│ │ Supplier Product Code (Optional)                         │    │
│ │ [ACME-WW-001                                       ]     │    │
│ │                                                           │    │
│ │ Unit Price (Optional)         Currency                   │    │
│ │ [12.50                ] [PLN        ▼]                   │    │
│ │                                                           │    │
│ │ Lead Time (Optional)                                     │    │
│ │ [7                    ] days                             │    │
│ │ ℹ️ Default from product: 10 days                          │    │
│ │                                                           │    │
│ │ MOQ (Optional)                Order Multiple (Optional)  │    │
│ │ [100                 ] kg     [25              ] kg      │    │
│ │ ℹ️ Default from product: 50 kg                            │    │
│ │                                                           │    │
│ │ [✓] Set as default supplier for this product             │    │
│ │                                                           │    │
│ │ Notes (Optional)                                         │    │
│ │ [                                                  ]     │    │
│ │                                                           │    │
│ └───────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                    [Cancel]  [Assign Product]   │
└─────────────────────────────────────────────────────────────────┘
```

**Fields**:
1. **Product Selector** (Required)
   - Searchable combobox
   - Filters: Not already assigned to this supplier
   - Shows: Code - Name (Type)

2. **Supplier Product Code** (Optional)
   - Max 50 chars
   - Supplier's internal SKU

3. **Unit Price** (Optional)
   - Decimal, 4 decimals max
   - Currency dropdown: PLN, EUR, USD, GBP
   - Default currency: Supplier's default currency

4. **Lead Time** (Optional)
   - Integer, days
   - Show product default as hint

5. **MOQ** (Optional)
   - Decimal, 4 decimals max
   - Show product default as hint

6. **Order Multiple** (Optional)
   - Decimal, 4 decimals max
   - For PO line quantity validation

7. **Default Supplier** (Optional)
   - Checkbox
   - If checked, unset previous default for this product

8. **Notes** (Optional)
   - Max 1000 chars
   - Negotiation details, contracts, etc.

**Validation**:
- Product required
- Price must be positive if provided
- Lead time must be >= 0 if provided
- MOQ must be positive if provided
- Prevent duplicate (supplier_id + product_id)

**Success Flow**:
1. Form submits via POST /api/planning/suppliers/:supplierId/products
2. Modal closes
3. Toast: "Product assigned successfully"
4. Table refreshes to show new product

**Error Handling**:
- Duplicate: "This product is already assigned to this supplier"
- Validation errors inline (red border + message)
- Server error: Toast with error message

---

### 3. SupplierProductForm Component

**Location**: `components/planning/SupplierProductForm.tsx`

**Purpose**: Reusable form for Edit mode (within modal or inline)

**Used By**:
- AssignProductModal (create mode)
- EditSupplierProductModal (edit mode)

**Props**:
```typescript
interface SupplierProductFormProps {
  mode: 'create' | 'edit';
  supplierId: string;
  initialData?: Partial<SupplierProduct>;
  productDefaults?: {
    lead_time_days?: number;
    moq?: number;
    currency?: string;
  };
  onSubmit: (data: SupplierProductInput) => Promise<void>;
  onCancel: () => void;
}
```

**Layout** (same as form section in AssignProductModal)

**Behavior**:
- Pre-populate fields in edit mode
- Show product defaults as hints
- Validate on blur
- Disable product selector in edit mode
- Handle loading state during submit

---

### 4. ProductSelectorCombobox Component

**Location**: `components/planning/ProductSelectorCombobox.tsx`

**Purpose**: Searchable product dropdown (reusable across planning module)

**Props**:
```typescript
interface ProductSelectorComboboxProps {
  value?: string; // product_id
  onChange: (productId: string | null) => void;
  filter?: (product: Product) => boolean; // Client-side filter
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}
```

**Layout**:
```
┌────────────────────────────────────────────────────┐
│ [🔍 Search products...                       ▼]   │
│                                                    │
│ Dropdown:                                          │
│ ┌────────────────────────────────────────────────┐ │
│ │ RM-001 - Wheat Flour                           │ │
│ │ Type: Raw Material | Stock: 500 kg             │ │
│ ├────────────────────────────────────────────────┤ │
│ │ RM-002 - Sugar                                 │ │
│ │ Type: Raw Material | Stock: 200 kg             │ │
│ ├────────────────────────────────────────────────┤ │
│ │ ING-001 - Vanilla Extract                      │ │
│ │ Type: Ingredient | Stock: 50 L                 │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Features**:
- Real-time search (debounced 300ms)
- Filters by: code, name
- Displays: code, name, type, current stock
- Keyboard navigation (arrow keys, enter)
- Clear button (X)

**API Integration**:
- GET /api/technical/products?search=:query&limit=50
- Client-side filter via props.filter

---

## Page Integration

### Supplier Detail Page

**Location**: `app/(authenticated)/planning/suppliers/[id]/page.tsx`

**Tabs**:
1. Overview (supplier info)
2. **Products** ← New tab for supplier-product assignments
3. Purchase Orders
4. History

**Products Tab Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Supplier: ACME Ingredients (SUP-001)                     [Edit] │
├───────┬─────────┬──────────┬──────────────────────────────────┬─┤
│ Info  │Products │POs       │ History                          │ │
├───────┴─────────┴──────────┴──────────────────────────────────┴─┤
│                                                                  │
│ <SupplierProductsTable supplierId={params.id} />                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: Assign Product to Supplier

1. User navigates to Supplier Detail page
2. Clicks "Products" tab
3. Clicks "+ Assign Product"
4. Modal opens
5. User searches and selects product (e.g., RM-003)
6. (Optional) Enters price: 12.50 PLN
7. (Optional) Overrides lead time: 7 days
8. Checks "Set as default supplier"
9. Clicks "Assign Product"
10. API call: POST /api/planning/suppliers/:id/products
11. Success toast appears
12. Modal closes
13. Table refreshes, new product visible

### Flow 2: Set Default Supplier

1. User views supplier-product table
2. Clicks "Default" checkbox for RM-005
3. Checkbox toggles on
4. API call: PUT /api/planning/suppliers/:id/products/:productId
5. Previous default for RM-005 automatically unchecked
6. Success toast: "Default supplier updated"

### Flow 3: Edit Supplier-Product Assignment

1. User clicks "Edit" on RM-002 row
2. Modal opens with pre-filled data
3. User updates price from 8.00 to 8.50
4. Clicks "Save Changes"
5. API call: PUT /api/planning/suppliers/:id/products/:productId
6. Success toast appears
7. Modal closes
8. Table shows updated price

### Flow 4: Remove Product from Supplier

1. User clicks "Delete" on RM-004 row
2. Confirmation dialog: "Remove RM-004 from this supplier? This will not delete the product."
3. User confirms
4. API call: DELETE /api/planning/suppliers/:id/products/:productId
5. Success toast: "Product removed"
6. Row disappears from table

---

## Responsive Design

### Desktop (>1024px)
- Full table with all columns
- Modal width: 600px
- Sidebar navigation visible

### Tablet (768-1024px)
- Hide "Supplier Product Code" column
- Modal width: 90vw
- Sidebar collapsible

### Mobile (<768px)
- Card view instead of table
- Stack fields vertically in modal
- Full-width modal
- Floating "+ Assign" button

---

## Accessibility

- All form inputs have labels
- ARIA labels for icon buttons
- Keyboard navigation for table and modal
- Focus trap in modal
- Screen reader announcements for toasts
- Color contrast ratio >= 4.5:1

---

## Design Tokens (ShadCN/Tailwind)

**Colors**:
- Primary: Blue (supplier/planning theme)
- Success: Green (default badge)
- Muted: Gray (empty state)

**Components**:
- Table: `<DataTable>` from ShadCN
- Modal: `<Dialog>` from ShadCN
- Form: `<Form>` with react-hook-form + Zod
- Combobox: `<Combobox>` from ShadCN
- Badge: `<Badge>` for product type
- Checkbox: `<Checkbox>` for default toggle

**Spacing**:
- Modal padding: p-6
- Table cell padding: px-4 py-2
- Form field gap: space-y-4

---

## Performance Considerations

1. **Table Virtualization**: For suppliers with >100 products, use react-virtual
2. **Search Debouncing**: 300ms delay on product search
3. **Pagination**: Server-side, 20 per page
4. **Lazy Load Tab**: Only fetch products when "Products" tab selected
5. **Optimistic Updates**: Update UI immediately, rollback on error

---

## Future Enhancements (Not MVP)

- Bulk assign products (CSV import)
- Inline editing (no modal)
- Price history chart
- Multi-supplier comparison view
- Contract expiry alerts

---

## Deliverables Summary

**Components to Create**:
1. `components/planning/SupplierProductsTable.tsx`
2. `components/planning/AssignProductModal.tsx`
3. `components/planning/SupplierProductForm.tsx`
4. `components/planning/ProductSelectorCombobox.tsx`

**Page Modifications**:
1. `app/(authenticated)/planning/suppliers/[id]/page.tsx` - Add "Products" tab

**Total Components**: 4 new + 1 modified

**Estimated Complexity**: Medium (M)
**Estimated Time**: 6-8 hours (design + implementation)
