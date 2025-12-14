# TEC-001: Products List

**Module**: Technical
**Feature**: Product Management
**Status**: Auto-Approved
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products                                    [+ Create Product]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search products...               ] [Type: All ▼] [Status: All ▼] [Sort ▼] │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Code      Name              Type    Version  Status    UoM    Actions   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ SKU-001   Wheat Flour       RM      v2       Active    kg     [⋮]       │ │
│  │           GTIN: 12345678901234 • Supplier: ABC Mills • Stock: 500 kg    │ │
│  │           🔴 Contains: Gluten                                            │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ SKU-002   White Bread       FG      v5       Active    pcs    [⋮]       │ │
│  │           GTIN: 98765432109876 • BOM: 3 versions • Shelf: 7 days        │ │
│  │           🔴 Contains: Gluten, Milk                                      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ SKU-003   Packaging Box     PKG     v1       Active    pcs    [⋮]       │ │
│  │           No GTIN • Supplier: BoxCo • MOQ: 1000 pcs                      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ SKU-004   Dough Mix WIP     WIP     v3       Inactive  kg     [⋮]       │ │
│  │           No GTIN • Used in: 5 BOMs                                      │ │
│  │           🟡 May contain: Nuts                                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 4 of 247 products                                 [1] [2] ... [25]  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details
  - Edit Product
  - Manage Allergens
  - View BOMs
  - View Version History
  - Clone Product
  - Change Status (Inactive/Discontinued)
  - Delete Product (if unused)
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products                                    [+ Create Product]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Skeleton: Search...              ] [Type ▼] [Status ▼] [Sort ▼]           │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Loading products...                                                          │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products                                    [+ Create Product]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [📦 Icon]                                            │
│                                                                               │
│                      No Products Found                                        │
│                                                                               │
│       You haven't created any products yet. Products are the foundation       │
│       of your manufacturing process - raw materials, finished goods, WIP,     │
│       and packaging items.                                                    │
│                                                                               │
│                     [+ Create Your First Product]                             │
│                                                                               │
│       Or import from CSV: [Import Products]                                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products                                    [+ Create Product]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [⚠ Icon]                                             │
│                                                                               │
│                  Failed to Load Products                                      │
│                                                                               │
│       Unable to retrieve product list. Please check your connection.          │
│                   Error: PRODUCT_FETCH_FAILED                                 │
│                                                                               │
│                        [Retry]  [Contact Support]                             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Code (SKU), Name, Type (badge), Version, Status (badge), UoM, Actions menu
2. **Row Details** - GTIN-14, Supplier, Stock levels, BOM count, Shelf life, Allergen badges
3. **Search/Filter Bar** - Text search (code/name), product type filter, status filter, sort dropdown
4. **Create Product Button** - Primary CTA (top-right), opens create modal (TEC-002)
5. **Actions Menu ([⋮])** - View, Edit, Allergens, BOMs, History, Clone, Status, Delete
6. **Status Badges** - Active (green), Inactive (gray), Discontinued (red)
7. **Type Badges** - RM (blue), WIP (yellow), FG (green), PKG (purple), BP (orange)
8. **Allergen Indicators** - Red dot + text for "contains", Yellow dot for "may contain"
9. **Pagination** - Bottom-right, 20 products per page

---

## Main Actions

### Primary
- **[+ Create Product]** - Opens create modal (TEC-002) → creates new product with version 1
- **Row Click** - Opens view details modal with full product info

### Secondary (Row Actions)
- **View Details** - Opens read-only modal with all fields, allergens, BOMs, version history
- **Edit Product** - Opens edit modal (TEC-002) → auto-increments version on save
- **Manage Allergens** - Opens allergen assignment modal (contains/may_contain checkboxes)
- **View BOMs** - Navigates to BOM list filtered for this product
- **View Version History** - Opens side panel with version timeline and change log
- **Clone Product** - Opens create modal pre-filled with current product data (new SKU required)
- **Change Status** - Dropdown: Set to Inactive / Set to Discontinued
- **Delete Product** - Confirmation modal → soft delete (only if no BOMs, WOs, or inventory)

### Filters/Search
- **Search** - Real-time filter by SKU (code) or product name
- **Filter by Type** - Dropdown: All, Raw Material (RM), WIP, Finished Goods (FG), Packaging (PKG), Byproduct (BP)
- **Filter by Status** - Dropdown: All, Active, Inactive, Discontinued
- **Sort** - Code, Name, Type, Version, Created Date (asc/desc)

---

## States

- **Loading**: Skeleton rows (4), "Loading products..." text
- **Empty**: "No products found" illustration, "Create Your First Product" CTA, Import option
- **Error**: "Failed to load products" warning icon, Retry + Contact Support buttons
- **Success**: Table with product rows, search/filter controls, pagination if >20 products

---

## Data Fields (Displayed)

| Field | Type | Display Location | Notes |
|-------|------|------------------|-------|
| code | string | Main row (SKU) | Immutable after creation |
| name | string | Main row | Max 255 chars |
| product_type | enum | Badge (RM/WIP/FG/PKG/BP) | Color-coded |
| version | integer | Main row (v1, v2, etc.) | Auto-increment on edit |
| status | enum | Badge (Active/Inactive/Discontinued) | Color-coded |
| base_uom | string | Main row | kg, L, pcs, etc. |
| gtin | string | Row details | GTIN-14 (GS1 compliance) |
| supplier_id | UUID | Row details (Supplier name) | Foreign key |
| min_stock | decimal | Row details (Stock: X kg) | Inventory level |
| max_stock | decimal | Row details | Inventory level |
| shelf_life_days | integer | Row details (Shelf: X days) | For finished goods |
| allergen_count | computed | Row details (allergen badges) | From product_allergens |
| bom_count | computed | Row details (BOM: X versions) | From boms table |

---

## Permissions

| Role | Can View | Can Create | Can Edit | Can Delete | Can Clone |
|------|----------|------------|----------|------------|-----------|
| Admin | All | Yes | All | Yes | Yes |
| Production Manager | All | Yes | All | No | Yes |
| Operator | All | No | No | No | No |
| Viewer | All | No | No | No | No |

---

## Validation

- **Search**: Min 2 characters for search query
- **Delete**: Cannot delete if product has active BOMs, work orders, or inventory
- **Status Change**: Warn if setting to Inactive/Discontinued and active BOMs exist
- **Clone**: New SKU (code) must be unique within organization

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status and type badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Product: {code}, {name}, Type: {type}, Version: {version}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open view modal, Arrow keys for actions menu
- **ARIA**: Table has proper headers, role="grid" for sortable columns

---

## Related Screens

- **TEC-002 Product Create/Edit Modal**: Opens from [+ Create Product] or Edit action
- **Product View Modal**: Opens on row click (shows all fields, allergens, BOMs)
- **Allergen Management Modal**: Opens from Manage Allergens action
- **Version History Panel**: Opens from View Version History action
- **BOM List**: Navigates from View BOMs action

---

## Technical Notes

- **RLS**: Products filtered by `org_id` (multi-tenancy)
- **API**: `GET /api/technical/products?search={query}&type={type}&status={status}&sort={field}&order={asc|desc}&page={N}`
- **Real-time**: Subscribe to product updates via Supabase Realtime (version changes, status updates)
- **Pagination**: 20 products per page, server-side pagination
- **Cache**: Product list cached for 1 minute (Redis key: `org:{orgId}:products:list`)
- **Export**: CSV export available (all fields, respects filters)
- **Import**: Bulk product import from CSV template

---

## GS1 Compliance

- **GTIN-14**: Displayed in row details for products with barcode
- **Validation**: GTIN-14 format validated on create/edit (14 digits, check digit verification)
- **Optional**: GTIN not required for WIP or internal products

---

## Performance Notes

- **Query Optimization**: Composite index on (org_id, product_type_id, status)
- **Full-text Search**: Index on code, name fields for fast search
- **Joined Data**: Supplier name, allergen count, BOM count pre-computed or joined efficiently
- **Load Time Target**: <1s for 10,000 products

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
