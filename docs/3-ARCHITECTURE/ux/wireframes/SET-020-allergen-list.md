# SET-020: Allergen List

**Module**: Settings
**Feature**: Allergen Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Allergens                       [+ Add Custom Allergen]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search allergens...           ] [Filter: All ▼] [Sort: Code ▼]     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Code    Icon  Name          Products      Type        Status   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-01  🌾    Gluten        12 products   EU14        Active   │   │
│  │              (Cereals with gluten)                      [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-02  🦐    Crustaceans   3 products    EU14        Active   │   │
│  │              (Shrimp, crab, lobster)                    [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-03  🥚    Eggs          8 products    EU14        Active   │   │
│  │              (Eggs and egg products)                    [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-04  🐟    Fish          2 products    EU14        Active   │   │
│  │              (Fish and fish products)                   [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-05  🥜    Peanuts       5 products    EU14        Active   │   │
│  │              (Peanuts and peanut products)              [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-06  🫘    Soybeans      7 products    EU14        Active   │   │
│  │              (Soya and soya products)                   [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-07  🥛    Milk          15 products   EU14        Active   │   │
│  │              (Milk and dairy products)                  [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-08  🌰    Nuts          6 products    EU14        Active   │   │
│  │              (Tree nuts: almond, hazelnut, walnut...)   [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-09  🌿    Celery        1 product     EU14        Active   │   │
│  │              (Celery and celeriac)                      [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-10  🟡    Mustard       2 products    EU14        Active   │   │
│  │              (Mustard and mustard products)             [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-11  🌱    Sesame        4 products    EU14        Active   │   │
│  │              (Sesame seeds and products)                [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-12  🍇    Sulphites     9 products    EU14        Active   │   │
│  │              (SO2 >10mg/kg or 10mg/L)                   [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-13  🫛    Lupin         0 products    EU14        Active   │   │
│  │              (Lupin and lupin products)                 [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ALL-14  🐚    Molluscs      1 product     EU14        Active   │   │
│  │              (Snails, mussels, squid...)                [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ CUST-01 🍯    Honey         3 products    Custom      Active   │   │
│  │              (Honey and bee products)                   [⋮]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ CUST-02 🌶️    Chili         0 products    Custom      Disabled │   │
│  │              Disabled 2025-11-20 by John Smith         [⋮]    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 16 of 16 allergens                             [1] [2] [>]  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Allergen (EU14: icon/description only | Custom: all fields)
  - View Products with This Allergen
  - Disable Allergen / Enable Allergen (Custom only)
  - View Activity Log
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Allergens                       [+ Add Custom Allergen]  │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading allergens...                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Allergens                       [+ Add Custom Allergen]  │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠️ Icon]                                     │
│                    No Custom Allergens Added                          │
│         You're using the standard EU 14 allergen list.                │
│    Add custom allergens if you track additional allergen types.       │
│                    [+ Add Custom Allergen]                            │
│                                                                       │
│         Note: EU 14 allergens are pre-populated and cannot            │
│         be deleted, only disabled if not used.                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Allergens                       [+ Add Custom Allergen]  │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                 Failed to Load Allergens                              │
│      Unable to retrieve allergen list. Check your connection.         │
│                  Error: ALLERGEN_FETCH_FAILED                         │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Code, Icon (emoji), Name, Products Count (link), Type (badge: EU14/Custom), Status (badge), Actions menu
2. **Search/Filter Bar** - Text search (code/name), type filter (All/EU14/Custom), status filter, sort dropdown
3. **Add Custom Allergen Button** - Primary CTA (top-right), opens create modal
4. **Actions Menu ([⋮])** - Edit (limited for EU14), View Products, Disable/Enable (Custom only), Activity Log
5. **Type Badges** - EU14 (blue, locked icon), Custom (green, editable)
6. **Status Badges** - Active (green), Disabled (gray)
7. **Allergen Details** - Second row shows description/notes or disabled info
8. **Products Count Link** - Clickable, navigates to filtered product list (products containing this allergen)
9. **Icon Column** - Emoji icon (visual identification, WCAG text alternative)

---

## Main Actions

### Primary
- **[+ Add Custom Allergen]** - Opens create modal (code, name, icon emoji, description) → creates custom allergen

### Secondary (Row Actions)
- **Edit Allergen** - EU14: edit icon/description only | Custom: edit all fields (code locked after creation)
- **View Products with This Allergen** - Navigates to product list filtered by this allergen
- **Disable Allergen** - Validation check (not used in active products) → confirmation → sets status to 'disabled' (Custom only)
- **Enable Allergen** - Re-activates disabled allergen (Custom only)
- **View Activity Log** - Opens activity panel (changes, who/when)

### Filters/Search
- **Search** - Real-time filter by code or name
- **Filter by Type** - All, EU14, Custom
- **Filter by Status** - All, Active, Disabled
- **Sort** - Code, Name, Products Count, Type (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading allergens..." text
- **Empty**: "No custom allergens" message, "EU 14 pre-populated" note, "Add Custom Allergen" CTA
- **Error**: "Failed to load allergens" warning, Retry + Contact Support buttons
- **Success**: Table with allergen rows (EU 14 pre-populated + custom), search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per org (ALL-01 to ALL-14 for EU14, CUST-XX for custom) |
| name | string | Display name (e.g., "Gluten", "Honey") |
| icon | string | Emoji icon (e.g., 🌾, 🥛, 🍯) |
| description | text | Detailed description (e.g., "Cereals with gluten") |
| type | enum | eu14, custom |
| status | enum | active, disabled |
| products_count | int | Calculated count of products containing this allergen |
| is_locked | boolean | true for EU14 (cannot delete), false for custom |
| disabled_at | timestamp | For status: disabled |
| disabled_by | user_id | Who disabled |

---

## EU 14 Allergens (Pre-populated)

| Code | Icon | Name | Description |
|------|------|------|-------------|
| ALL-01 | 🌾 | Gluten | Cereals containing gluten (wheat, rye, barley, oats, spelt, kamut) |
| ALL-02 | 🦐 | Crustaceans | Shrimp, crab, lobster, and crustacean products |
| ALL-03 | 🥚 | Eggs | Eggs and egg products |
| ALL-04 | 🐟 | Fish | Fish and fish products |
| ALL-05 | 🥜 | Peanuts | Peanuts and peanut products |
| ALL-06 | 🫘 | Soybeans | Soya and soya products |
| ALL-07 | 🥛 | Milk | Milk and dairy products (including lactose) |
| ALL-08 | 🌰 | Nuts | Tree nuts (almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio, macadamia) |
| ALL-09 | 🌿 | Celery | Celery and celeriac |
| ALL-10 | 🟡 | Mustard | Mustard and mustard products |
| ALL-11 | 🌱 | Sesame | Sesame seeds and sesame products |
| ALL-12 | 🍇 | Sulphites | Sulphur dioxide and sulphites (>10mg/kg or 10mg/L) |
| ALL-13 | 🫛 | Lupin | Lupin and lupin products |
| ALL-14 | 🐚 | Molluscs | Snails, mussels, squid, and mollusc products |

---

## Permissions

| Role | Can View | Can Add Custom | Can Edit EU14 | Can Edit Custom | Can Disable Custom |
|------|----------|----------------|---------------|-----------------|---------------------|
| Super Admin | All | Yes | Icon/Desc only | Yes | Yes |
| Admin | All | Yes | Icon/Desc only | Yes | Yes |
| Manager | All | Yes | Icon/Desc only | Yes | No |
| Operator | All | No | No | No | No |
| Viewer | All | No | No | No | No |

---

## Validation

- **Create Custom**: Code must be unique in org (format: CUST-XX), name required (max 100 chars), icon required (single emoji)
- **Edit EU14**: Cannot edit code/name/type (locked), can only edit icon/description
- **Edit Custom**: Cannot edit code (locked after creation), can edit name/icon/description
- **Disable**: Cannot disable if used in any product formula (validation check), EU14 allergens cannot be deleted (only disabled if products_count = 0)
- **Code Format**: EU14: ALL-01 to ALL-14 (system), Custom: CUST-01, CUST-02, etc. (auto-increment)
- **Icon**: Must be single emoji character (validation: Unicode emoji range)

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Allergen: {code}, {name}, Icon: {icon_description}, {products_count} products, Type: {type}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation
- **Icon Alt Text**: Each emoji icon has text alternative (e.g., 🌾 = "Wheat icon representing gluten")

---

## Related Screens

- **Add Custom Allergen Modal**: Opens from [+ Add Custom Allergen] button
- **Edit Allergen Modal**: Opens from Actions menu → Edit Allergen
- **Disable Allergen Confirmation**: Opens from Actions menu → Disable Allergen
- **Products with Allergen View**: Navigates from products_count link (filtered product list)
- **Activity Log Panel**: Opens from Actions menu → View Activity Log

---

## Technical Notes

- **RLS**: Allergens filtered by `org_id` automatically
- **API**: `GET /api/settings/allergens?search={query}&type={type}&status={status}&page={N}`
- **Seeding**: EU 14 allergens created automatically on org creation (migration seed)
- **Real-time**: Subscribe to allergen updates via Supabase Realtime (new custom allergens, status changes)
- **Pagination**: 20 allergens per page, server-side pagination
- **Validation**: Before disable, check for products using this allergen (`product_allergens` junction table)
- **Products Count**: Calculated from `product_allergens` table (JOIN query or materialized view)
- **Icon Storage**: Store emoji as UTF-8 string (1-4 bytes), validate Unicode emoji range on input

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-020-allergen-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
