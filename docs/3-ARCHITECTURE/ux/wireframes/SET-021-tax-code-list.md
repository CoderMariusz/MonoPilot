# SET-021: Tax Code List

**Module**: Settings
**Feature**: Tax Code Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Settings > Tax Codes                                [+ Add Tax Code]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search codes...           ] [Filter: All ▼] [Sort: Code ▼] [⏳ Exp: All ▼] │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ Code  Name               Rate(%)  Type       Effective        Stat [⋮]│   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-23 VAT Standard      23.00    Standard   01/01/25-12/31/25 ✓ ⋮   │   │
│  │        Standard Polish VAT rate                 ACTIVE              │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-08 VAT Reduced 8%     8.00    Reduced    01/01/25-12/31/25 ✓ ⋮   │   │
│  │        Reduced rate for selected food        ACTIVE              │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-05 VAT Reduced 5%     5.00    Reduced    01/01/25-12/31/25 ✓ ⋮   │   │
│  │        Reduced rate for basic food           ACTIVE              │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-00 VAT Zero Rate      0.00    Zero       01/01/25-12/31/25 ✓ ⋮   │   │
│  │        Zero-rated supplies and exports       ACTIVE              │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-EX VAT Exempt         0.00    Exempt     01/01/25-12/31/25 ✓ ⋮   │   │
│  │        Exempt supplies (no VAT charged)      ACTIVE              │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-NP Not Applicable     0.00    N/A        Ongoing         ✓ ⋮   │   │
│  │        Non-taxable items                     ACTIVE              │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ VAT-IC Intra-Community    0.00    Zero       01/01/26-12/31/26 ⏰ ⋮   │   │
│  │        EU intra-community supplies           ACTIVE (expires soon)   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Showing 7 of 7 tax codes                                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

Legend:
  ✓ = Rate valid and applicable now
  ⏰ = Rate expires within 30 days (warning indicator)
  Ongoing = No end date (indefinite)
  DD/MM/YY-DD/MM/YY = Effective date range
```

### Effective Date Filter Example

```
┌──────────────────────────────────────────────────────────┐
│  Filter: Effective Dates                                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Show rates that are:                                     │
│  ○ All                                                    │
│  ○ Currently active                                       │
│  ○ Expires within 30 days  (⏰ icon shows count)          │
│  ○ Expired                                                │
│  ○ Future (not yet effective)                             │
│                                                            │
│  [Apply Filter] [Clear]                                   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

[⋮] Menu:
  - Edit Tax Code
  - Set as Default
  - View Products Using This Code
  - View Activity Log
  - Disable Tax Code (validation: not in use)
```

---

## Key Components

1. **Data Table** - Code, Name, Rate (%), Type (badge), **Effective Date Range** (new), Status badge, Actions menu
2. **Effective Date Column** - Shows date range (DD/MM/YY-DD/MM/YY) or "Ongoing" if no end date
3. **Expiration Indicator** - ✓ (valid), ⏰ (expires <30 days), ⌛ (expired) - dynamically updated
4. **Effective Date Filter** - New filter dropdown: All / Currently Active / Expires Soon / Expired / Future
5. **Search/Filter Bar** - Text search (code/name), type filter, status filter, **effective date filter**, sort dropdown
6. **Add Tax Code Button** - Primary CTA (top-right), opens create modal with date fields
7. **Actions Menu ([⋮])** - Edit, Set as Default, View Products, Activity Log, Disable
8. **Type Badges** - Standard (blue), Reduced (green), Zero (gray), Exempt (purple), N/A (neutral)
9. **Status Badges** - Active (green), Disabled (gray), Expiring Soon (orange) - conditional based on effective_to date
10. **Rate Display** - Formatted as decimal with 2 places (23.00%)
11. **Tax Code Details** - Second row shows description + effective date status

---

## Main Actions

### Primary
- **[+ Add Tax Code]** - Opens create modal (code, name, rate, type, description, **effective_from, effective_to**) → creates tax code

### Secondary (Row Actions)
- **Edit Tax Code** - Opens edit modal (all fields editable except code, **includes date fields**)
- **Set as Default** - Sets this tax code as default for new products (confirmation dialog)
- **View Products Using This Code** - Navigates to product list filtered by this tax code
- **View Activity Log** - Opens activity panel (rate changes, date changes, status changes, who/when)
- **Disable Tax Code** - Validation check (not used in active products/transactions) → confirmation → sets status to 'disabled'

### Filters/Search
- **Search** - Real-time filter by code or name
- **Filter by Type** - All, Standard, Reduced, Zero, Exempt, N/A
- **Filter by Status** - All, Active, Disabled
- **Filter by Effective Dates** - All, Currently Active, Expires Soon (<30 days), Expired, Future (not yet effective)
- **Sort** - Code, Name, Rate (asc/desc), Type, Effective Date (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading tax codes..." text
- **Empty**: "No tax codes configured" message, "Add your first tax code" CTA, pre-populate suggestion for Polish VAT rates with date ranges
- **Error**: "Failed to load tax codes" warning, error code, Retry + Contact Support buttons
- **Success**: Table with tax code rows (pre-populated Polish VAT rates on org creation with effective dates), search/filter controls, expiration indicators, pagination if >20

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
| **effective_from** | **date** | **Optional start date for rate validity (FR-SET-083)** |
| **effective_to** | **date** | **Optional end date for rate validity (FR-SET-083)** |
| **expires_soon_indicator** | **computed** | **true if effective_to is within 30 days** |
| jurisdiction | string | Country/region (default: PL for Polish market) |

---

## Polish VAT Rates (Pre-populated with Effective Dates)

| Code | Name | Rate (%) | Type | Effective From | Effective To | Description |
|------|------|----------|------|---|---|---|
| VAT-23 | VAT Standard | 23.00 | Standard | 2025-01-01 | 2025-12-31 | Standard Polish VAT rate |
| VAT-08 | VAT Reduced 8% | 8.00 | Reduced | 2025-01-01 | 2025-12-31 | Reduced rate for selected food products |
| VAT-05 | VAT Reduced 5% | 5.00 | Reduced | 2025-01-01 | 2025-12-31 | Reduced rate for basic food products |
| VAT-00 | VAT Zero Rate | 0.00 | Zero | 2025-01-01 | 2025-12-31 | Zero-rated supplies and exports |
| VAT-EX | VAT Exempt | 0.00 | Exempt | 2025-01-01 | 2025-12-31 | Exempt supplies (no VAT charged) |
| VAT-NP | Not Applicable | 0.00 | N/A | NULL | NULL | Non-taxable items (no expiry) |
| VAT-IC | Intra-Community | 0.00 | Zero | 2026-01-01 | 2026-12-31 | EU intra-community supplies |

---

## Permissions

| Role | Can View | Can Add | Can Edit | Can Set Default | Can Disable | Can Edit Dates |
|------|----------|---------|----------|-----------------|-------------|---|
| Super Admin | All | Yes | Yes | Yes | Yes | Yes |
| Admin | All | Yes | Yes | Yes | Yes | Yes |
| Manager | All | Request only | No | No | No | No |
| Operator | All | No | No | No | No | No |
| Viewer | All | No | No | No | No | No |

---

## Validation

- **Create**: Code must be unique in org, name required (max 100 chars), rate required (0.00-100.00), type required
- **Edit**: Cannot edit code (locked after creation), can edit name/rate/description/type/**effective dates**
- **Set Default**: Only one default tax code allowed per org, confirmation required if changing default
- **Disable**: Cannot disable if used in any product (validation check), cannot disable default tax code (must set new default first)
- **Code Format**: Suggested format: VAT-XX, TAX-XX (auto-suggest on create)
- **Rate**: Must be numeric, 0.00-100.00, max 2 decimal places
- **Effective Dates** (FR-SET-083):
  - `effective_to` must be after `effective_from` (if both provided)
  - `effective_from` cannot be in the past (when creating new rate)
  - No overlapping date ranges for the same tax code (business rule: only 1 active rate per code at a time)
  - If `effective_from` is NULL and `effective_to` is NULL: rate is indefinite (ongoing)
  - If `effective_from` is set but `effective_to` is NULL: rate is ongoing from start date
  - Cannot set past date as `effective_from` when creating (defaults to today or future)
  - Warn user if setting `effective_to` within 30 days: "This rate will expire soon"
- **Date Format**: ISO 8601 (YYYY-MM-DD) in API, displayed as DD/MM/YY in UI based on locale

---

## API Response Format

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "code": "VAT-23",
  "name": "VAT Standard",
  "rate": 23.00,
  "type": "standard",
  "description": "Standard Polish VAT rate",
  "status": "active",
  "is_default": true,
  "effective_from": "2025-01-01",
  "effective_to": "2025-12-31",
  "expires_soon": false,
  "days_until_expiry": 351,
  "is_currently_active": true,
  "jurisdiction": "PL",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "created_by": "user_id",
  "last_modified_by": "user_id"
}
```

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type/status badges pass WCAG AA (4.5:1), expiration indicators (⏰ orange) pass contrast check
- **Screen reader**: Row announces "Tax code: {code}, {name}, Rate: {rate} percent, Type: {type}, Status: {status}, Effective from {effective_from} to {effective_to}" OR "Effective from {effective_from} onwards" OR "Ongoing"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation
- **Focus**: Clear focus indicators on all interactive elements
- **Date Format**: Dates announced in full text format: "First of January, twenty twenty-five" (not abbreviated)
- **Expiration Indicator**: Screen reader announces "⏰ expires soon" for rates expiring within 30 days

---

## Related Screens

- **Add Tax Code Modal**: Opens from [+ Add Tax Code] button - includes date range picker
- **Edit Tax Code Modal**: Opens from Actions menu → Edit Tax Code - includes date range picker
- **Set Default Confirmation**: Opens from Actions menu → Set as Default
- **Disable Tax Code Confirmation**: Opens from Actions menu → Disable Tax Code
- **Products with Tax Code View**: Navigates from "View Products Using This Code"
- **Activity Log Panel**: Opens from Actions menu → View Activity Log (shows date changes)

---

## Technical Notes

- **RLS**: Tax codes filtered by `org_id` automatically
- **API**: `GET /api/settings/tax-codes?search={query}&type={type}&status={status}&effective={all|active|expires_soon|expired|future}&page={N}`
- **Computed Fields**:
  - `expires_soon`: `(effective_to - TODAY) <= 30 days AND effective_to >= TODAY`
  - `is_currently_active`: `(effective_from IS NULL OR effective_from <= TODAY) AND (effective_to IS NULL OR effective_to >= TODAY)`
  - `days_until_expiry`: `EXTRACT(DAY FROM (effective_to - TODAY))` (only if expires_soon = true)
- **Seeding**: Polish VAT rates created automatically on org creation with effective date range for current calendar year
- **Real-time**: Subscribe to tax code updates via Supabase Realtime (rate changes, date changes, new codes)
- **Pagination**: 20 tax codes per page, server-side pagination
- **Validation**: Before disable, check for products using this tax code (`products.tax_code_id` FK) **during effective date range**
- **Default Logic**: When setting new default, previous default is unset (atomic transaction)
- **Rate History**: Track rate changes AND date changes in audit log (effective dates for historical accuracy)
- **Jurisdiction**: Default to org's country (Poland for MonoPilot), expandable for multi-country support
- **Date Overlap Check**: Database constraint or service-level validation to prevent overlapping effective date ranges for same code
- **Sorting**: Sort by effective_from (oldest first) or effective_to (expiring soonest first) as options
- **Caching**: Cache expiration status (expires_soon) with TTL of 1 hour since it's time-based computed field

---

## Frontend Implementation Checklist

- [ ] Add `effective_from` and `effective_to` fields to tax code form (date inputs)
- [ ] Add date range picker or dual-date input for effective dates
- [ ] Display effective dates in list view with format "DD/MM/YY-DD/MM/YY" or "Ongoing"
- [ ] Add expiration indicator icons (✓, ⏰, ⌛) with appropriate colors
- [ ] Add effective date filter dropdown to filter bar
- [ ] Implement date validation (no overlaps, proper ordering)
- [ ] Add "expires soon" warning toast when creating/editing rates expiring <30 days
- [ ] Update API response to include `effective_from`, `effective_to`, `expires_soon`, `is_currently_active`, `days_until_expiry`
- [ ] Update activity log to show date changes with before/after values
- [ ] Add keyboard support for date picker
- [ ] Test accessibility for date inputs and expiration indicators

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-021-tax-code-list]
**Iterations Used**: 1 (effective dates visibility enhancement)
**Ready for Handoff**: Yes

**Changes in This Update**:
- Added "Effective" column to list view showing date range
- Added expiration indicator icons (✓, ⏰, ⌛)
- Added effective date filter dropdown
- Added computed fields (expires_soon, is_currently_active, days_until_expiry)
- Added date validation for overlapping ranges (FR-SET-083 compliance)
- Updated API response format to include date fields
- Enhanced accessibility for date announcements
- Updated pre-populated Polish VAT rates with effective date ranges

---

**Status**: Approved for FRONTEND-DEV handoff with effective dates support
