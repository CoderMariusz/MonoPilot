# SET-021: Tax Code List

**Module**: Settings
**Feature**: Tax Code Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Tax Codes                           [+ Add Tax Code]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search codes...           ] [Filter: All ▼] [Sort: Code ▼]         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Code    Name                Rate (%)  Type        Status  [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-23  VAT Standard        23.00     Standard    Active   ⋮   │   │
│  │         Standard Polish VAT rate                                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-08  VAT Reduced 8%      8.00      Reduced     Active   ⋮   │   │
│  │         Reduced rate for selected food products                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-05  VAT Reduced 5%      5.00      Reduced     Active   ⋮   │   │
│  │         Reduced rate for basic food products                   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-00  VAT Zero Rate       0.00      Zero        Active   ⋮   │   │
│  │         Zero-rated supplies and exports                        │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-EX  VAT Exempt          0.00      Exempt      Active   ⋮   │   │
│  │         Exempt supplies (no VAT charged)                       │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-NP  Not Applicable      0.00      N/A         Active   ⋮   │   │
│  │         Non-taxable items                                      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ VAT-IC  Intra-Community     0.00      Zero        Active   ⋮   │   │
│  │         EU intra-community supplies                            │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 7 of 7 tax codes                                             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Tax Code
  - Set as Default
  - View Products Using This Code
  - View Activity Log
  - Disable Tax Code (validation: not in use)
```

---

## Key Components

1. **Data Table** - Code, Name, Rate (%), Type (badge: Standard/Reduced/Zero/Exempt/N/A), Status (badge), Actions menu
2. **Search/Filter Bar** - Text search (code/name), type filter, status filter, sort dropdown
3. **Add Tax Code Button** - Primary CTA (top-right), opens create modal
4. **Actions Menu ([⋮])** - Edit, Set as Default, View Products, Activity Log, Disable
5. **Type Badges** - Standard (blue), Reduced (green), Zero (gray), Exempt (purple), N/A (neutral)
6. **Status Badges** - Active (green), Disabled (gray)
7. **Tax Code Details** - Second row shows description/notes
8. **Rate Display** - Formatted as decimal with 2 places (23.00%)

---

## Main Actions

### Primary
- **[+ Add Tax Code]** - Opens create modal (code, name, rate, type, description) → creates tax code

### Secondary (Row Actions)
- **Edit Tax Code** - Opens edit modal (all fields editable, code locked after creation)
- **Set as Default** - Sets this tax code as default for new products (confirmation dialog)
- **View Products Using This Code** - Navigates to product list filtered by this tax code
- **View Activity Log** - Opens activity panel (rate changes, status changes, who/when)
- **Disable Tax Code** - Validation check (not used in active products/transactions) → confirmation → sets status to 'disabled'

### Filters/Search
- **Search** - Real-time filter by code or name
- **Filter by Type** - All, Standard, Reduced, Zero, Exempt, N/A
- **Filter by Status** - All, Active, Disabled
- **Sort** - Code, Name, Rate (asc/desc), Type

---

## States

- **Loading**: Skeleton rows (3), "Loading tax codes..." text
- **Empty**: "No tax codes configured" message, "Add your first tax code" CTA, pre-populate suggestion for Polish VAT rates
- **Error**: "Failed to load tax codes" warning, error code, Retry + Contact Support buttons
- **Success**: Table with tax code rows (pre-populated Polish VAT rates on org creation), search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| code | string | Unique per org (VAT-XX format suggested), max 20 chars |
| name | string | Display name (e.g., "VAT Standard", "VAT Reduced 8%") |
| rate | decimal(5,2) | Tax rate percentage (0.00-100.00) |
| type | enum | standard, reduced, zero, exempt, n/a |
| description | text | Optional notes/explanation |
| status | enum | active, disabled |
| is_default | boolean | One default per org |
| effective_from | date | Optional start date for rate validity |
| effective_to | date | Optional end date for rate validity |
| jurisdiction | string | Country/region (default: PL for Polish market) |

---

## Polish VAT Rates (Pre-populated)

| Code | Name | Rate (%) | Type | Description |
|------|------|----------|------|-------------|
| VAT-23 | VAT Standard | 23.00 | Standard | Standard Polish VAT rate |
| VAT-08 | VAT Reduced 8% | 8.00 | Reduced | Reduced rate for selected food products |
| VAT-05 | VAT Reduced 5% | 5.00 | Reduced | Reduced rate for basic food products |
| VAT-00 | VAT Zero Rate | 0.00 | Zero | Zero-rated supplies and exports |
| VAT-EX | VAT Exempt | 0.00 | Exempt | Exempt supplies (no VAT charged) |
| VAT-NP | Not Applicable | 0.00 | N/A | Non-taxable items |
| VAT-IC | Intra-Community | 0.00 | Zero | EU intra-community supplies |

---

## Permissions

| Role | Can View | Can Add | Can Edit | Can Set Default | Can Disable |
|------|----------|---------|----------|-----------------|-------------|
| Super Admin | All | Yes | Yes | Yes | Yes |
| Admin | All | Yes | Yes | Yes | Yes |
| Manager | All | Request only | No | No | No |
| Operator | All | No | No | No | No |
| Viewer | All | No | No | No | No |

---

## Validation

- **Create**: Code must be unique in org, name required (max 100 chars), rate required (0.00-100.00), type required
- **Edit**: Cannot edit code (locked after creation), can edit name/rate/description/type
- **Set Default**: Only one default tax code allowed per org, confirmation required if changing default
- **Disable**: Cannot disable if used in any product (validation check), cannot disable default tax code (must set new default first)
- **Code Format**: Suggested format: VAT-XX, TAX-XX (auto-suggest on create)
- **Rate**: Must be numeric, 0.00-100.00, max 2 decimal places
- **Effective Dates**: effective_to must be after effective_from, no overlapping date ranges for same type

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Tax code: {code}, {name}, Rate: {rate} percent, Type: {type}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation
- **Focus**: Clear focus indicators on all interactive elements

---

## Related Screens

- **Add Tax Code Modal**: Opens from [+ Add Tax Code] button
- **Edit Tax Code Modal**: Opens from Actions menu → Edit Tax Code
- **Set Default Confirmation**: Opens from Actions menu → Set as Default
- **Disable Tax Code Confirmation**: Opens from Actions menu → Disable Tax Code
- **Products with Tax Code View**: Navigates from "View Products Using This Code"
- **Activity Log Panel**: Opens from Actions menu → View Activity Log

---

## Technical Notes

- **RLS**: Tax codes filtered by `org_id` automatically
- **API**: `GET /api/settings/tax-codes?search={query}&type={type}&status={status}&page={N}`
- **Seeding**: Polish VAT rates created automatically on org creation (migration seed for PL market)
- **Real-time**: Subscribe to tax code updates via Supabase Realtime (rate changes, new codes)
- **Pagination**: 20 tax codes per page, server-side pagination
- **Validation**: Before disable, check for products using this tax code (`products.tax_code_id` FK)
- **Default Logic**: When setting new default, previous default is unset (atomic transaction)
- **Rate History**: Track rate changes in audit log (effective dates for historical accuracy)
- **Jurisdiction**: Default to org's country (Poland for MonoPilot), expandable for multi-country support

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-021-tax-code-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
