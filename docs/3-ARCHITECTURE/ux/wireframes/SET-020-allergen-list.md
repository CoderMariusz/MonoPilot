# SET-020: Allergen List

**Module**: Settings
**Feature**: Allergen Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Allergens                       [+ Add Custom Allergen]  │
├─────────────────────────────────────────────────────────────────────┤
│  Language: [English ▼]                                               │
│  [Search allergens...           ] [Filter: All ▼] [Sort: Code ▼]     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Code  Icon  Name          Products      Type        Status   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A01   🌾    Gluten        12 products   EU14        Active   │   │
│  │             Cereals with gluten                     [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A02   🦐    Crustaceans   3 products    EU14        Active   │   │
│  │             Shrimp, crab, lobster                   [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A03   🥚    Eggs          8 products    EU14        Active   │   │
│  │             Eggs and egg products                   [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A04   🐟    Fish          2 products    EU14        Active   │   │
│  │             Fish and fish products                  [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A05   🥜    Peanuts       5 products    EU14        Active   │   │
│  │             Peanuts and peanut products             [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A06   🫘    Soybeans      7 products    EU14        Active   │   │
│  │             Soya and soya products                  [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A07   🥛    Milk          15 products   EU14        Active   │   │
│  │             Milk and dairy products                 [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A08   🌰    Nuts          6 products    EU14        Active   │   │
│  │             Tree nuts: almond, hazelnut, walnut...  [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A09   🌿    Celery        1 product     EU14        Active   │   │
│  │             Celery and celeriac                     [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A10   🟡    Mustard       2 products    EU14        Active   │   │
│  │             Mustard and mustard products            [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A11   🌱    Sesame        4 products    EU14        Active   │   │
│  │             Sesame seeds and products               [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A12   🍇    Sulphites     9 products    EU14        Active   │   │
│  │             SO2 >10mg/kg or 10mg/L                 [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A13   🫛    Lupin         0 products    EU14        Active   │   │
│  │             Lupin and lupin products                [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ A14   🐚    Molluscs      1 product     EU14        Active   │   │
│  │             Snails, mussels, squid...               [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ C01   🍯    Honey         3 products    Custom      Active   │   │
│  │             Honey and bee products                  [⋮]     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ C02   🌶️    Chili         0 products    Custom      Disabled │   │
│  │             Disabled 2025-11-20 by John Smith      [⋮]     │   │
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

**Language Selector Details:**
- Dropdown shows: "English", "Polski", "Deutsch", "Français"
- When changed, allergen names/descriptions display in selected language
- Language preference persists (stored in user settings)
- Falls back to English if translation unavailable

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Allergens                       [+ Add Custom Allergen]  │
├─────────────────────────────────────────────────────────────────────┤
│  Language: [English ▼]                                               │
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
│  Language: [English ▼]                                               │
│                          [⚠️ Icon]                                     │
│                    No Custom Allergens Added                          │
│         You're using the standard EU 14 allergen list (A01-A14).      │
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
│  Language: [English ▼]                                               │
│                          [⚠ Icon]                                     │
│                 Failed to Load Allergens                              │
│      Unable to retrieve allergen list. Check your connection.         │
│                  Error: ALLERGEN_FETCH_FAILED                         │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Language Selector** - Dropdown to view allergen names in PL/EN/DE/FR (NEW: FR-SET-072)
2. **Data Table** - Code (A01-A14 or C01+), Icon (emoji), Name (localized), Products Count (link), Type (badge: EU14/Custom), Status (badge), Actions menu
3. **Search/Filter Bar** - Text search (code/name), type filter (All/EU14/Custom), status filter, sort dropdown
4. **Add Custom Allergen Button** - Primary CTA (top-right), opens create modal
5. **Actions Menu ([⋮])** - Edit (limited for EU14), View Products, Disable/Enable (Custom only), Activity Log
6. **Type Badges** - EU14 (blue, locked icon), Custom (green, editable)
7. **Status Badges** - Active (green), Disabled (gray)
8. **Allergen Details** - Second row shows description/notes or disabled info
9. **Products Count Link** - Clickable, navigates to filtered product list (products containing this allergen)
10. **Icon Column** - Emoji icon (visual identification, WCAG text alternative)

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
- **Search** - Real-time filter by code or name (searches both current language and English fallback)
- **Filter by Type** - All, EU14, Custom
- **Filter by Status** - All, Active, Disabled
- **Sort** - Code, Name (localized), Products Count, Type (asc/desc)
- **Language Selector** - Changes display language for allergen names/descriptions (PL/EN/DE/FR)

---

## States

- **Loading**: Skeleton rows (3), "Loading allergens..." text
- **Empty**: "No custom allergens" message, "EU 14 pre-populated (A01-A14)" note, "Add Custom Allergen" CTA
- **Error**: "Failed to load allergens" warning, Retry + Contact Support buttons
- **Success**: Table with allergen rows (EU 14 pre-populated A01-A14 + custom), search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per org (A01-A14 for EU14 per FR-SET-071, C01+ for custom) |
| name_en | string | English name (e.g., "Gluten", "Honey") |
| name_pl | string | Polish name |
| name_de | string | German name |
| name_fr | string | French name |
| icon | string | Emoji icon (e.g., 🌾, 🥛, 🍯) |
| description_en | text | English description (e.g., "Cereals with gluten") |
| description_pl | text | Polish description |
| description_de | text | German description |
| description_fr | text | French description |
| type | enum | eu14, custom |
| status | enum | active, disabled |
| products_count | int | Calculated count of products containing this allergen |
| is_locked | boolean | true for EU14 (cannot delete), false for custom |
| disabled_at | timestamp | For status: disabled |
| disabled_by | user_id | Who disabled |

---

## EU 14 Allergens (Pre-populated) - FR-SET-071 Compliance

| Code | Icon | Name (English) | Description |
|------|------|--------|-------------|
| A01 | 🌾 | Gluten | Cereals containing gluten (wheat, rye, barley, oats, spelt, kamut) |
| A02 | 🦐 | Crustaceans | Shrimp, crab, lobster, and crustacean products |
| A03 | 🥚 | Eggs | Eggs and egg products |
| A04 | 🐟 | Fish | Fish and fish products |
| A05 | 🥜 | Peanuts | Peanuts and peanut products |
| A06 | 🫘 | Soybeans | Soya and soya products |
| A07 | 🥛 | Milk | Milk and dairy products (including lactose) |
| A08 | 🌰 | Nuts | Tree nuts (almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio, macadamia) |
| A09 | 🌿 | Celery | Celery and celeriac |
| A10 | 🟡 | Mustard | Mustard and mustard products |
| A11 | 🌱 | Sesame | Sesame seeds and sesame products |
| A12 | 🍇 | Sulphites | Sulphur dioxide and sulphites (>10mg/kg or 10mg/L) |
| A13 | 🫛 | Lupin | Lupin and lupin products |
| A14 | 🐚 | Molluscs | Snails, mussels, squid, and mollusc products |

**Multi-Language Support**: All EU14 allergens have translations (name_en, name_pl, name_de, name_fr) seeded at org creation.

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

- **Create Custom**: Code must be unique in org (format: C01, C02, C03... auto-increment starting from C01), name required in current language (max 100 chars), icon required (single emoji)
- **Edit EU14**: Cannot edit code/name/type (locked), can only edit icon/description
- **Edit Custom**: Cannot edit code (locked after creation), can edit name/icon/description (in all languages if applicable)
- **Disable**: Cannot disable if used in any product formula (validation check), EU14 allergens cannot be deleted (only disabled if products_count = 0)
- **Code Format**: EU14: A01-A14 (per FR-SET-071, system-controlled), Custom: C01, C02, C03, etc. (auto-increment starting C01)
- **Icon**: Must be single emoji character (validation: Unicode emoji range)
- **Language Fields**: name_en/name_pl/name_de/name_fr required for EU14; custom allergens default to user's language, translations optional
- **Code Immutability**: All allergen codes (A01-A14, C01+) are immutable after creation

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Allergen: {code}, {name}, Icon: {icon_description}, {products_count} products, Type: {type}, Status: {status}, Language: {current_language}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation, Language selector keyboard accessible
- **Icon Alt Text**: Each emoji icon has text alternative (e.g., 🌾 = "Wheat icon representing gluten")
- **Language Announcements**: When language selector changes, screen reader announces current language (e.g., "Now showing allergens in English")

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
- **API**: `GET /api/settings/allergens?search={query}&type={type}&status={status}&lang={language}&page={N}`
- **Seeding**: EU 14 allergens (A01-A14 with all translations) created automatically on org creation (migration seed, per FR-SET-071 + FR-SET-072)
- **Real-time**: Subscribe to allergen updates via Supabase Realtime (new custom allergens, status changes)
- **Pagination**: 20 allergens per page, server-side pagination
- **Validation**: Before disable, check for products using this allergen (`product_allergens` junction table)
- **Products Count**: Calculated from `product_allergens` table (JOIN query or materialized view)
- **Icon Storage**: Store emoji as UTF-8 string (1-4 bytes), validate Unicode emoji range on input
- **Language Storage**: Store allergen names/descriptions in 4 language columns (name_en, name_pl, name_de, name_fr, description_en, description_pl, description_de, description_fr)
- **Language Display**: Use user's `preferred_language` setting to determine which column to display
- **Translation Fallback**: If user's preferred language not available, default to English (name_en, description_en)

---

## API Schemas

### GET /api/settings/allergens Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "code": "A01",
      "name_en": "Gluten",
      "name_pl": "Gluten",
      "name_de": "Gluten",
      "name_fr": "Gluten",
      "icon": "🌾",
      "description_en": "Cereals containing gluten",
      "description_pl": "Zboża zawierające gluten",
      "description_de": "Getreide mit Gluten",
      "description_fr": "Céréales contenant du gluten",
      "type": "eu14",
      "status": "active",
      "is_locked": true,
      "products_count": 12,
      "disabled_at": null,
      "disabled_by": null,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "org_id": "uuid",
      "code": "C01",
      "name_en": "Honey",
      "name_pl": "Miód",
      "name_de": "Honig",
      "name_fr": "Miel",
      "icon": "🍯",
      "description_en": "Honey and bee products",
      "description_pl": "Miód i produkty pszczelne",
      "description_de": "Honig und Bienenprodukte",
      "description_fr": "Miel et produits apicoles",
      "type": "custom",
      "status": "active",
      "is_locked": false,
      "products_count": 3,
      "disabled_at": null,
      "disabled_by": null,
      "created_at": "2025-12-01T10:30:00Z",
      "updated_at": "2025-12-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 16,
    "total_pages": 1
  }
}
```

### POST /api/settings/allergens/custom (Create Custom Allergen)

```json
{
  "code": "C01",
  "name_en": "Honey",
  "name_pl": "Miód",
  "name_de": "Honig",
  "name_fr": "Miel",
  "icon": "🍯",
  "description_en": "Honey and bee products",
  "description_pl": "Miód i produkty pszczelne",
  "description_de": "Honig und Bienenprodukte",
  "description_fr": "Miel et produits apicoles"
}
```

### PATCH /api/settings/allergens/{id} (Update Allergen)

```json
{
  "name_en": "Honey (Updated)",
  "name_pl": "Miód (Zaktualizowany)",
  "name_de": "Honig (Aktualisiert)",
  "name_fr": "Miel (Mis à jour)",
  "icon": "🍯",
  "description_en": "Honey and related bee products",
  "description_pl": "Miód i powiązane produkty pszczelne",
  "description_de": "Honig und verwandte Bienenprodukte",
  "description_fr": "Miel et produits apicoles connexes"
}
```

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-020-allergen-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes
**Compliance**: FR-SET-071 (A01-A14 codes), FR-SET-072 (multi-language support)

---

**Status**: Approved for FRONTEND-DEV handoff
**Last Fixed**: 2025-12-15 (Allergen code format A01-A14, multi-language FR-SET-072 support added)
