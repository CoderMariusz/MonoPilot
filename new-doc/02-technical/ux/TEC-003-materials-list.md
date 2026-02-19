# TEC-003: Materials List

**Module**: Technical
**Feature**: Material Management (Raw Materials & Ingredients)
**Status**: Auto-Approved
**Completion**: 95%+
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Materials                                   [+ Create Material]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ℹ️ Materials are Raw Materials (RM) used in production. Manage all product  │
│     types in Products section.                         [View All Products →] │
│                                                                               │
│  [Search materials...              ] [Category: All ▼] [Status: All ▼] [⋮]   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Code      Name                Version  Supplier      Stock    Actions   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ RM-001    Wheat Flour          v2       ABC Mills    500 kg   [⋮]       │ │
│  │           GTIN: 12345678901234 • Lead: 7 days • MOQ: 500 kg • Active    │ │
│  │           🔴 Contains: Gluten • Shelf: 180 days                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ RM-002    Whole Milk           v1       Dairy Co     250 L    [⋮]       │ │
│  │           GTIN: 98765432109876 • Lead: 2 days • MOQ: 100 L • Active     │ │
│  │           🔴 Contains: Milk • Shelf: 14 days • Storage: 2-8°C            │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ RM-003    Sea Salt             v1       SaltWorks    100 kg   [⋮]       │ │
│  │           No GTIN • Lead: 14 days • MOQ: 50 kg • Active                  │ │
│  │           No allergens • Shelf: No expiry • Storage: Dry place           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ RM-004    Butter (Unsalted)    v3       Dairy Co     75 kg    [⋮]       │ │
│  │           GTIN: 11223344556677 • Lead: 3 days • MOQ: 25 kg • Active     │ │
│  │           🔴 Contains: Milk • 🟡 May contain: Nuts • Shelf: 90 days      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ RM-005    Yeast (Dried)        v1       BakeCo       50 kg    [⋮]       │ │
│  │           No GTIN • Lead: 10 days • MOQ: 10 kg • Inactive                │ │
│  │           No allergens • Shelf: 365 days • Storage: Cool, dry            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 127 materials                                [1] [2] ... [13]  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details
  - Edit Material
  - Manage Allergens
  - View Usage (BOMs using this material)
  - View Version History
  - Clone Material
  - Adjust Stock Level (quick action)
  - Change Status (Inactive/Discontinued)
  - Delete Material (if unused)

[⋮] Table Actions (top-right):
  - Export to CSV
  - Import from CSV
  - Bulk Edit
  - Print List
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Materials                                   [+ Create Material]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Skeleton: Search...              ] [Category ▼] [Status ▼] [⋮]             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Loading materials...                                                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Materials                                   [+ Create Material]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [🧪 Icon]                                            │
│                                                                               │
│                      No Materials Found                                       │
│                                                                               │
│       You haven't created any raw materials yet. Materials are ingredients    │
│       and components purchased from suppliers and used in production.         │
│                                                                               │
│                     [+ Create Your First Material]                            │
│                                                                               │
│       Or import from CSV: [Import Materials]                                  │
│                                                                               │
│       Learn more: [Material Management Guide]                                 │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Materials                                   [+ Create Material]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [⚠ Icon]                                             │
│                                                                               │
│                  Failed to Load Materials                                     │
│                                                                               │
│       Unable to retrieve material list. Please check your connection.         │
│                   Error: MATERIAL_FETCH_FAILED                                │
│                                                                               │
│                        [Retry]  [Contact Support]                             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Material Usage Panel (Side Panel)

```
┌─────────────────────────────────────────────────────────────┐
│  Material Usage: RM-001 Wheat Flour              [X]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ℹ️ This material is used in 12 BOMs and 3 active work     │
│     orders. Changes may impact production.                  │
│                                                             │
│  ═══════════════════════════════════════════════════════════│
│  BILLS OF MATERIALS (12)                                    │
│  ═══════════════════════════════════════════════════════════│
│                                                             │
│  [Active BOMs] [All BOMs]                                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ FG-BREAD-WHITE v5                                     │ │
│  │ White Bread Loaf 800g                                 │ │
│  │ Quantity: 500g per unit • Status: Active              │ │
│  │ [View BOM →]                                          │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ FG-BREAD-WHEAT v3                                     │ │
│  │ Whole Wheat Bread 1kg                                 │ │
│  │ Quantity: 750g per unit • Status: Active              │ │
│  │ [View BOM →]                                          │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ FG-CAKE-VANILLA v2                                    │ │
│  │ Vanilla Sponge Cake 500g                              │ │
│  │ Quantity: 200g per unit • Status: Active              │ │
│  │ [View BOM →]                                          │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ ... 9 more BOMs                                       │ │
│  │ [Show All BOMs]                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ═══════════════════════════════════════════════════════════│
│  ACTIVE WORK ORDERS (3)                                     │
│  ═══════════════════════════════════════════════════════════│
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WO-2025-0047                                          │ │
│  │ White Bread Loaf • Qty: 200 units                     │ │
│  │ Status: In Progress • Due: 2025-12-15                 │ │
│  │ Material Required: 100kg                              │ │
│  │ [View Work Order →]                                   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ WO-2025-0051                                          │ │
│  │ Whole Wheat Bread • Qty: 150 units                    │ │
│  │ Status: Planned • Due: 2025-12-16                     │ │
│  │ Material Required: 112.5kg                            │ │
│  │ [View Work Order →]                                   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ WO-2025-0053                                          │ │
│  │ Vanilla Cake • Qty: 500 units                         │ │
│  │ Status: Planned • Due: 2025-12-18                     │ │
│  │ Material Required: 100kg                              │ │
│  │ [View Work Order →]                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ═══════════════════════════════════════════════════════════│
│  CONSUMPTION SUMMARY (Last 30 Days)                         │
│  ═══════════════════════════════════════════════════════════│
│                                                             │
│  Total Consumed: 2,450 kg                                   │
│  Average Daily Consumption: 81.67 kg                        │
│  Peak Consumption: 245 kg (2025-12-01)                      │
│                                                             │
│  [View Detailed Report →]                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                          [Close]            │
└─────────────────────────────────────────────────────────────┘
```

### Stock Adjustment Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Adjust Stock: RM-001 Wheat Flour                  [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Stock: 500 kg                                      │
│  Location: Main Warehouse - Zone A3                         │
│  Last Updated: 2025-12-13 14:30                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Adjustment Type *                                          │
│  ( ) Add Stock (Receiving)                                  │
│  (•) Remove Stock (Consumption/Loss)                        │
│  ( ) Set Absolute Value (Physical Count)                    │
│                                                             │
│  Quantity *                                                 │
│  [50___________________]  [kg ▼]                            │
│                                                             │
│  Reason *                                                   │
│  [Quality issue - batch contaminated______________]         │
│  [_____________________________________________]            │
│                                                             │
│  Lot Number (Optional)                                      │
│  [LOT-2025-12-001______]                                    │
│                                                             │
│  Reference Document (Optional)                              │
│  [NCR-2025-045_________]                                    │
│  ℹ️ Non-conformance report, QA document, etc.               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Preview After Adjustment:                                  │
│                                                             │
│  Current:  500 kg                                           │
│  Change:   -50 kg                                           │
│  New:      450 kg                                           │
│                                                             │
│  ⚠️ Stock will fall below minimum level (200 kg)           │
│     Recommend creating purchase order.                      │
│                                                             │
│  ☐ Create PO automatically                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Adjustment will be logged in:                              │
│  • Stock transaction history                                │
│  • Audit trail (user, timestamp, reason)                    │
│  • Material cost history (if cost impact)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                [Cancel]  [Adjust Stock]     │
└─────────────────────────────────────────────────────────────┘
```

### Bulk Edit Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Technical > Materials                        [Exit Bulk Edit]  [Apply (0)]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ℹ️ Bulk Edit Mode: Select materials to edit multiple records at once        │
│                                                                               │
│  [Search materials...              ] [Category: All ▼] [Status: All ▼] [⋮]   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [☐] Code   Name                Version  Supplier      Stock    Actions  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ [☐] RM-001 Wheat Flour          v2       ABC Mills    500 kg   [⋮]      │ │
│  │            GTIN: 12345678901234 • Lead: 7 days • MOQ: 500 kg • Active   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ [☑] RM-002 Whole Milk           v1       Dairy Co     250 L    [⋮]      │ │
│  │            GTIN: 98765432109876 • Lead: 2 days • MOQ: 100 L • Active    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ [☐] RM-003 Sea Salt             v1       SaltWorks    100 kg   [⋮]      │ │
│  │            No GTIN • Lead: 14 days • MOQ: 50 kg • Active                 │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ [☑] RM-004 Butter (Unsalted)    v3       Dairy Co     75 kg    [⋮]      │ │
│  │            GTIN: 11223344556677 • Lead: 3 days • MOQ: 25 kg • Active    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ [☑] RM-005 Yeast (Dried)        v1       BakeCo       50 kg    [⋮]      │ │
│  │            No GTIN • Lead: 10 days • MOQ: 10 kg • Inactive               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  [Select All]  [Deselect All]  3 materials selected                          │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ BULK EDIT ACTIONS (3 materials selected)                                │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │ Change Supplier                                                         │ │
│  │ [Keep current ▼]                                                        │ │
│  │                                                                         │ │
│  │ Change Status                                                           │ │
│  │ [Keep current ▼]                                                        │ │
│  │                                                                         │ │
│  │ Change Category                                                         │ │
│  │ [Keep current ▼]                                                        │ │
│  │                                                                         │ │
│  │ Adjust Minimum Stock Level                                              │ │
│  │ ( ) Keep current  ( ) Set to: [____] kg  ( ) Increase by: [__]%        │ │
│  │                                                                         │ │
│  │ Adjust Lead Time                                                        │ │
│  │ ( ) Keep current  ( ) Set to: [____] days  ( ) Increase by: [__] days  │ │
│  │                                                                         │ │
│  │ Reason for Bulk Change *                                                │ │
│  │ [Supplier change - all Dairy Co products_________________]             │ │
│  │                                                                         │ │
│  │                                  [Cancel]  [Preview Changes]            │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Info Banner** - Blue info bar explaining materials are RM products, link to all products
2. **Data Table** - Code, Name, Version, Supplier, Stock Level, Actions menu
3. **Row Details** - GTIN-14, Lead time, MOQ, Status badge, Allergens, Shelf life, Storage
4. **Search/Filter Bar** - Text search (code/name), category filter, status filter, table actions menu
5. **Create Material Button** - Primary CTA (top-right), opens create modal (TEC-004)
6. **Actions Menu ([⋮])** - View, Edit, Allergens, Usage, History, Clone, Adjust Stock, Status, Delete
7. **Table Actions Menu ([⋮])** - Export, Import, Bulk Edit, Print
8. **Status Indicators** - Active (green dot), Inactive (gray dot)
9. **Allergen Badges** - Red dot + text for "contains", Yellow dot for "may contain"
10. **Stock Display** - Current stock with UoM (from inventory system)
11. **Pagination** - Bottom-right, 20 materials per page
12. **Material Usage Panel** - Side panel showing BOMs, WOs, consumption using this material
13. **Stock Adjustment Modal** - Quick stock adjustment with reason, preview, auto-PO option
14. **Bulk Edit Panel** - Checkbox selection mode + bulk actions form

---

## Main Actions

### Primary
- **[+ Create Material]** - Opens create modal (TEC-004) with product_type pre-set to "Raw Material (RM)"
- **Row Click** - Opens view details modal with full material info, supplier details, allergens, usage in BOMs

### Secondary (Row Actions)
- **View Details** - Opens read-only modal with all fields, supplier info, allergens, BOMs using this material
- **Edit Material** - Opens edit modal (TEC-004) → auto-increments version on save
- **Manage Allergens** - Opens allergen assignment modal (contains/may_contain checkboxes for 14 EU allergens)
- **View Usage** - Opens Material Usage Panel (side panel) showing all BOMs, WOs, consumption stats
- **View Version History** - Opens side panel with version timeline and change log
- **Clone Material** - Opens create modal pre-filled with current material data (new code required)
- **Adjust Stock Level** - Opens Stock Adjustment Modal with Add/Remove/Set options, reason tracking, auto-PO suggestion
- **Change Status** - Dropdown: Set to Inactive / Set to Discontinued
- **Delete Material** - Confirmation modal → soft delete (only if no BOMs, WOs, or inventory)

### Table Actions (Top-Right Menu)
- **Export to CSV** - Downloads current view (respects filters) as CSV with all fields
- **Import from CSV** - Opens import wizard to bulk-create materials from CSV template
- **Bulk Edit** - Enables checkbox selection mode + bulk edit panel → edit supplier, status, category, min stock, lead time for multiple materials with reason tracking
- **Print List** - Print-optimized view of current material list

### Filters/Search
- **Search** - Real-time filter by material code or name
- **Filter by Category** - Dropdown: All, Flour & Grains, Dairy, Seasonings, Packaging, Custom categories
- **Filter by Status** - Dropdown: All, Active, Inactive, Discontinued
- **Filter by Supplier** - Dropdown: All, [Supplier names]
- **Sort** - Code, Name, Supplier, Stock Level, Created Date (asc/desc)

---

## States

- **Loading**: Skeleton rows (4), "Loading materials..." text
- **Empty**: "No materials found" illustration, "Create Your First Material" CTA, Import option, Guide link
- **Error**: "Failed to load materials" warning icon, Retry + Contact Support buttons
- **Success**: Table with material rows, info banner, search/filter controls, pagination if >20 materials

---

## Data Fields (Displayed)

| Field | Type | Display Location | Notes |
|-------|------|------------------|-------|
| code | string | Main row | Material code (SKU) |
| name | string | Main row | Material name |
| version | integer | Main row (v1, v2, etc.) | Auto-increment on edit |
| supplier_name | string | Main row | From supplier_id FK |
| current_stock | decimal | Main row (computed) | From inventory/warehouse module |
| base_uom | string | Main row (with stock) | kg, L, pcs, etc. |
| status | enum | Row details badge | Active/Inactive/Discontinued |
| gtin | string | Row details | GTIN-14 (optional) |
| supplier_lead_time_days | integer | Row details (Lead: X days) | Procurement lead time |
| moq | decimal | Row details (MOQ: X uom) | Minimum order quantity |
| allergen_count | computed | Row details (allergen badges) | From product_allergens |
| shelf_life_days | integer | Row details (Shelf: X days) | Expiry period |
| storage_conditions | string | Row details (Storage: ...) | Storage requirements |

---

## Business Logic

### Material vs Product
- **Materials are a subset of Products**: Materials list shows only products where `product_type = 'RM' (Raw Material)`
- **All materials are products**: Creating a material creates a product with type=RM
- **View All Products link**: Navigates to TEC-001 (full product list) for managing all product types

### Stock Display
- **Current Stock**: Pulled from warehouse/inventory module in real-time
- **Stock Level Colors**: Red if below min_stock, yellow if approaching min_stock, green if adequate
- **Quick Adjust**: Inline action to adjust stock without leaving page

### Supplier Integration
- **Supplier Required**: For materials, supplier_id is typically required (procurement focus)
- **Lead Time**: Critical for MRP/planning, shown prominently
- **MOQ**: Minimum order quantity shown for procurement planning

### Material Usage Tracking
- **BOM References**: Shows all BOMs using this material
- **Work Order References**: Shows active WOs consuming this material
- **Consumption Stats**: 30-day consumption summary for demand planning
- **Impact Warnings**: Alerts when editing material used in active production

### Stock Adjustments
- **Adjustment Types**: Add (receiving), Remove (consumption/loss), Set (physical count)
- **Reason Tracking**: Mandatory reason for audit trail
- **Auto-PO Trigger**: Suggests PO creation if stock falls below minimum
- **Preview**: Shows before/after stock levels and warnings

### Bulk Edit
- **Multi-Select**: Checkbox selection for batch operations
- **Bulk Actions**: Change supplier, status, category, min stock, lead time
- **Version Control**: Bulk edits increment version for all affected materials
- **Reason Required**: Mandatory reason for audit trail
- **Preview**: Shows impact before applying changes

---

## Permissions

| Role | Can View | Can Create | Can Edit | Can Delete | Can Adjust Stock | Can Bulk Edit |
|------|----------|------------|----------|------------|------------------|---------------|
| Admin | All | Yes | All | Yes | Yes | Yes |
| Production Manager | All | Yes | All | No | Yes | Yes |
| Operator | All | No | No | No | No | No |
| Viewer | All | No | No | No | No | No |

---

## Validation

- **Search**: Min 2 characters for search query
- **Delete**: Cannot delete if material used in any BOM, work order, or has inventory
- **Status Change**: Warn if setting to Inactive/Discontinued and material is in active BOMs
- **Clone**: New material code must be unique within organization
- **Stock Adjust**: Requires warehouse permissions (optional integration)
- **Bulk Edit**: Requires reason (min 10 chars), validates all selected materials can be edited
- **Stock Adjustment**: Quantity must be positive, reason required, validates stock level constraints

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status indicators and allergen badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Material: {code}, {name}, Supplier: {supplier}, Stock: {stock} {uom}, Version: {version}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open view modal, Arrow keys for actions menu, Space to toggle checkboxes (bulk edit)
- **ARIA**: Table has proper headers, role="grid" for sortable columns, info banner has role="alert", checkboxes properly labeled
- **Focus**: Focus management in modals and side panels

---

## Related Screens

- **TEC-001 Products List**: Link from info banner "View All Products" navigates here
- **TEC-002 Product Create/Edit Modal**: Same modal used for materials (with type=RM pre-set)
- **TEC-004 Material Create/Edit Modal**: Opens from [+ Create Material] or Edit action
- **Material View Modal**: Opens on row click (shows all fields, supplier details, allergens, usage)
- **Allergen Management Modal**: Opens from Manage Allergens action
- **Version History Panel**: Opens from View Version History action
- **Material Usage Panel**: Opens from View Usage action (shows BOMs, WOs, consumption)
- **Stock Adjustment Modal**: Opens from Adjust Stock Level action
- **Bulk Edit Panel**: Inline panel displayed when Bulk Edit mode activated

---

## Technical Notes

- **RLS**: Materials filtered by `org_id AND product_type = 'RM'` (multi-tenancy + type filter)
- **API**: `GET /api/technical/products?type=RM&search={query}&category={cat}&status={status}&sort={field}&order={asc|desc}&page={N}`
- **API (Usage)**: `GET /api/technical/products/:id/usage` → returns BOMs, WOs, consumption stats
- **API (Stock Adjust)**: `POST /api/warehouse/stock/adjust` → creates stock transaction, updates inventory
- **API (Bulk Edit)**: `PATCH /api/technical/products/bulk` → batch update with reason tracking
- **Real-time**: Subscribe to product updates via Supabase Realtime (stock changes, version updates)
- **Pagination**: 20 materials per page, server-side pagination
- **Cache**: Material list cached for 1 minute (Redis key: `org:{orgId}:materials:list`)
- **Stock Data**: Joined from warehouse/inventory module (license_plates aggregation)
- **Export**: CSV export includes all fields, GTIN, supplier details, allergen list
- **Import**: CSV template with required columns: code, name, supplier_code, moq, lead_time
- **Bulk Operations**: Transaction-based, rollback on any error, version history for all changes
- **Stock Transactions**: Audit trail with user, timestamp, reason, before/after values

---

## Differences from Products List (TEC-001)

| Aspect | Products List (TEC-001) | Materials List (TEC-003) |
|--------|-------------------------|--------------------------|
| **Scope** | All product types (RM, WIP, FG, PKG, BP) | Only Raw Materials (RM) |
| **Filter** | Type filter dropdown | No type filter (always RM) |
| **Info Banner** | None | Link to all products |
| **Supplier** | Optional | Prominent (typically required) |
| **Stock Display** | Yes | Yes (more prominent) |
| **MOQ/Lead Time** | Row details | Prominent in row details |
| **Use Case** | General product catalog | Procurement & ingredient management |
| **Create Button** | "Create Product" | "Create Material" (type=RM pre-set) |
| **Usage Panel** | Not available | Available (BOMs + WOs + consumption) |
| **Stock Adjust** | Not available | Quick action available |
| **Bulk Edit** | Basic | Advanced (supplier, lead time, min stock) |

---

## Performance Notes

- **Query Optimization**: Composite index on (org_id, product_type_id) for fast RM filtering
- **Stock Calculation**: Aggregated on-demand or cached per material (depends on warehouse module design)
- **Load Time Target**: <1s for 10,000 materials
- **Export Performance**: Async job for >1000 materials, email when ready
- **Bulk Edit Performance**: Batch updates, max 100 materials per operation, async job for larger batches
- **Usage Calculation**: Cached for 5 minutes (Redis key: `org:{orgId}:material:{id}:usage`)

---

## GS1 Compliance

- **GTIN-14**: Optional for raw materials (more common for finished goods)
- **Validation**: Same as products (14 digits, check digit verification)
- **Display**: Shown in row details if present

---

## Import/Export

### CSV Export Columns
- code, name, description, supplier_code, supplier_name, lead_time_days, moq, moq_uom, std_price, currency, min_stock, max_stock, current_stock, base_uom, gtin, barcode, shelf_life_days, storage_conditions, allergens (comma-separated), status, version, created_at, updated_at

### CSV Import Template
- Required: code, name, supplier_code, base_uom
- Optional: All other fields
- Allergens: Comma-separated allergen codes (e.g., "GLUTEN,MILK")
- Validation: Same as create modal, batch validation with error report

---

## NEW: Material Usage Panel Details

### Components
1. **Header**: Material code/name, close button
2. **Summary Alert**: Count of BOMs and WOs using this material
3. **Tabbed Sections**: Active BOMs, All BOMs, Active WOs, Consumption Summary
4. **BOM List**: Card list with product name, quantity, status, view link
5. **WO List**: Card list with WO number, product, qty, status, due date, material required
6. **Consumption Summary**: Stats for last 30 days (total, average, peak)
7. **Action Links**: View BOM, View WO, View Detailed Report

### API
- **Endpoint**: `GET /api/technical/products/:id/usage`
- **Response**: BOMs array, WOs array, consumption stats object
- **Cache**: 5 min TTL

---

## NEW: Stock Adjustment Modal Details

### Components
1. **Header**: Material code/name, current stock, location
2. **Adjustment Type**: Radio buttons (Add/Remove/Set)
3. **Quantity Input**: Numeric with UoM dropdown
4. **Reason**: Required text area
5. **Lot Number**: Optional reference
6. **Reference Document**: Optional (NCR, QA doc)
7. **Preview Panel**: Before/after stock levels
8. **Warning Alert**: If below min stock
9. **Auto-PO Checkbox**: Create PO if below minimum
10. **Audit Trail Info**: Lists what will be logged

### Validation
- Quantity: Required, positive number
- Reason: Required, min 10 chars, max 500 chars
- Set Type: Must be absolute value >= 0
- Warning: If stock goes below min_stock

### API
- **Endpoint**: `POST /api/warehouse/stock/adjust`
- **Payload**: product_id, type (add/remove/set), quantity, reason, lot_number, reference_doc, create_po
- **Response**: New stock level, transaction ID

---

## NEW: Bulk Edit Mode Details

### Components
1. **Header**: Exit button, Apply button with count
2. **Table**: Checkboxes in first column
3. **Selection Controls**: Select All, Deselect All, count display
4. **Bulk Edit Panel**: Collapsible form with bulk actions
5. **Actions**: Change Supplier, Status, Category, Min Stock, Lead Time
6. **Reason Field**: Required for audit
7. **Preview Button**: Shows impact before applying

### Bulk Actions
1. **Change Supplier**: Dropdown (keep current or select new)
2. **Change Status**: Dropdown (keep current or select new)
3. **Change Category**: Dropdown (keep current or select new)
4. **Adjust Min Stock**: Radio (keep/set/increase by %)
5. **Adjust Lead Time**: Radio (keep/set/increase by days)
6. **Reason**: Required text area

### Validation
- At least 1 material selected
- At least 1 action selected (not all "keep current")
- Reason required (min 10 chars)
- Max 100 materials per bulk operation
- All selected materials must be editable by user

### API
- **Endpoint**: `PATCH /api/technical/products/bulk`
- **Payload**: product_ids[], actions object, reason
- **Response**: Success count, error count, version increments
- **Transaction**: Rollback all on any error

### Preview
- Shows table of changes before applying
- Columns: Material Code, Field, Old Value, New Value
- Allows final review and cancel

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Completion**: 95%+ (Added Material Usage Panel, Stock Adjustment Modal, Bulk Edit Mode with full wireframes and specs)
**Iterations**: 0 of 3
