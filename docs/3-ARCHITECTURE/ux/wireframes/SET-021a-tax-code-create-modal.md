# SET-021a: Add Tax Code Modal

**Module**: Settings
**Feature**: Tax Code Management
**Related Screen**: SET-021-tax-code-list
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State (Form)

```
┌────────────────────────────────────────────────────────────┐
│  Add Tax Code                                         [✕]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Tax Code Details                                           │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  Code *                                                     │
│  [VAT-_______________]  (Format: VAT-XX, TAX-XX, etc.)    │
│  Unique per organization. Cannot be changed after creation. │
│                                                             │
│  Name *                                                     │
│  [e.g., VAT Standard____________________________]           │
│                                                             │
│  Tax Rate (%) *                                             │
│  [23.00________]                                            │
│  Value 0.00 - 100.00, max 2 decimal places                 │
│                                                             │
│  Tax Type *                                                 │
│  [ Standard ▼ ]  (Standard / Reduced / Zero / Exempt / N/A) │
│                                                             │
│  Description (Optional)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Add notes, explanations, or legal references...     │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Effective Date Range (Optional)                            │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  ○ Ongoing (no expiration)                                  │
│  ○ Set date range                                           │
│                                                             │
│  Effective From:                                            │
│  [___/___/____] (DD/MM/YYYY)  [📅 Calendar]               │
│  Default: Today's date (cannot set past date)              │
│                                                             │
│  Effective To:                                              │
│  [___/___/____] (DD/MM/YYYY)  [📅 Calendar]  [Clear]      │
│  Must be after "Effective From" date                        │
│  ⚠️ Warning appears if set within 30 days from today       │
│                                                             │
│  ☐ Set as default tax code for new products               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Cancel]  [Save Tax Code]                                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

### Validation State (Date Warning)

```
┌────────────────────────────────────────────────────────────┐
│  Add Tax Code                                         [✕]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Effective To: [31/12/2025]                                 │
│                                                             │
│  ⚠️ ⏰ This rate will expire in 16 days.                   │
│     Consider setting a longer validity period.             │
│                                                             │
│  [Dismiss warning]                                          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Validation State (Overlapping Date Error)

```
┌────────────────────────────────────────────────────────────┐
│  Add Tax Code                                         [✕]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Code: [VAT-23]                                             │
│                                                             │
│  ❌ ERROR: This tax code already has an active rate        │
│     from 01/01/2025 to 12/31/2025.                         │
│                                                             │
│     To create a new rate with different dates:             │
│     1. Set the end date of the existing rate, OR          │
│     2. Use a different tax code                            │
│                                                             │
│  [Got it]                                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Code Field** - Text input, auto-suggests format (VAT-, TAX-), unique validation per org
2. **Name Field** - Text input, max 100 chars, display name for UI
3. **Rate Field** - Numeric input, 0.00-100.00, exactly 2 decimal places
4. **Type Dropdown** - Enum select (Standard/Reduced/Zero/Exempt/N/A), affects rate validation
5. **Description Textarea** - Optional rich text or notes, max 500 chars
6. **Date Range Radio** - Toggle between "Ongoing" and "Set date range"
7. **Effective From Date Picker** - Calendar picker, defaults to today, no past dates allowed
8. **Effective To Date Picker** - Optional calendar picker, must be after "From" date
9. **Expiration Warning** - ⏰ icon + text if end date within 30 days from today
10. **Overlap Error** - ❌ error message if same code has overlapping active rate
11. **Set as Default Checkbox** - Optional checkbox to make this the default tax code
12. **Action Buttons** - Cancel (closes) and Save Tax Code (submits)

---

## Main Actions

### Primary
- **[Save Tax Code]** - Validates all fields, checks for overlaps, creates tax code, closes modal, shows success toast "Tax code created", returns to list view

### Secondary
- **[Cancel]** - Closes modal without saving (no confirmation needed if no changes)
- **[📅 Calendar]** - Opens calendar picker for date selection
- **[Clear]** - Clears the "Effective To" date field
- **[Dismiss warning]** - Closes expiration warning but allows form submission

### Validation Actions
- **Date validation** - Real-time: effective_to > effective_from if both set
- **Overlap check** - Real-time or on blur: detects overlapping date ranges for same code
- **Past date prevention** - Effective From defaults to today, cannot select past dates

---

## States

- **Loading**: Skeleton form (show spinners in input fields, disabled Save button)
- **Empty**: All fields blank except Effective From defaults to today
- **Error**:
  - Missing required fields (red outline on fields)
  - Invalid rate (not numeric or outside 0.00-100.00 range)
  - Overlapping date ranges for same code
  - Effective To before Effective From
  - Effective From is a past date
- **Success**: Toast notification "Tax code '{name}' created" + closes modal
- **Warning**: ⏰ expiration warning if effective_to is within 30 days

---

## Data Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| code | string | Yes | Unique per org, VAT-XX format suggested, max 20 chars | Cannot be changed after creation |
| name | string | Yes | Max 100 chars | Display name in UI |
| rate | decimal(5,2) | Yes | Numeric, 0.00-100.00, exactly 2 decimals | Tax rate percentage |
| type | enum | Yes | standard, reduced, zero, exempt, n/a | Affects rate classification |
| description | text | No | Max 500 chars | Optional notes/explanations |
| effective_from | date | No | ISO 8601 YYYY-MM-DD, cannot be past, must be <= effective_to | Start date for rate validity |
| effective_to | date | No | ISO 8601 YYYY-MM-DD, must be >= effective_from | End date for rate validity |
| is_default | boolean | No | One default per org | Checkbox option |
| jurisdiction | string | No | Default: PL (org's country) | For future multi-country support |

---

## Validation Rules

| Rule | Condition | Action |
|------|-----------|--------|
| **Required Fields** | code, name, rate, type must be provided | Show red outline, focus on first error, prevent save |
| **Code Format** | Must be unique per org | Real-time check, show error if exists |
| **Code Length** | Max 20 characters | Show char counter, prevent input beyond limit |
| **Rate Range** | Must be 0.00-100.00 | Highlight field in red if outside range |
| **Rate Decimals** | Exactly 2 decimal places | Auto-format on blur (e.g., 23 → 23.00) |
| **Name Length** | Max 100 characters | Show char counter |
| **Description Length** | Max 500 characters | Show char counter |
| **Date Ordering** | effective_to > effective_from | Show error on effective_to field if violated |
| **Past Date** | effective_from cannot be in past | Disable/gray out past dates in calendar |
| **Overlap Check** | No two active rates for same code at same time | Show error: "Code {code} already has active rate from {from} to {to}" |
| **Expiration Soon** | effective_to within 30 days from today | Show ⏰ warning, allow submission |

---

## API Request/Response

### Request (POST /api/settings/tax-codes)

```json
{
  "code": "VAT-23",
  "name": "VAT Standard",
  "rate": 23.00,
  "type": "standard",
  "description": "Standard Polish VAT rate",
  "effective_from": "2025-01-01",
  "effective_to": "2025-12-31",
  "is_default": false,
  "jurisdiction": "PL"
}
```

### Response (201 Created)

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
  "is_default": false,
  "effective_from": "2025-01-01",
  "effective_to": "2025-12-31",
  "expires_soon": false,
  "days_until_expiry": 351,
  "is_currently_active": true,
  "jurisdiction": "PL",
  "created_at": "2025-12-15T10:00:00Z",
  "updated_at": "2025-12-15T10:00:00Z",
  "created_by": "user_id"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "validation_error",
  "message": "Tax code validation failed",
  "details": {
    "code": "Unique constraint violation",
    "effective_to": "Must be after effective_from"
  }
}
```

### Error Response (409 Conflict - Overlapping Dates)

```json
{
  "error": "date_overlap",
  "message": "Tax code VAT-23 already has an active rate from 2025-01-01 to 2025-12-31",
  "existing_rate": {
    "id": "uuid",
    "effective_from": "2025-01-01",
    "effective_to": "2025-12-31"
  }
}
```

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp, buttons >= 48x48dp
- **Contrast**: Labels and inputs pass WCAG AA (4.5:1)
- **Screen reader**:
  - Form title: "Add Tax Code dialog"
  - Each field: "Code, text input, unique per organization. Cannot be changed after creation"
  - Effective From: "Effective From, date input, format DD/MM/YYYY, no past dates allowed"
  - Effective To: "Effective To, date input, format DD/MM/YYYY, must be after Effective From date"
  - Warning: "⏰ This rate will expire in 16 days" (announced as alert)
  - Error: "Validation error: {field} - {message}" (announced as alert)
- **Keyboard**:
  - Tab moves through fields in order
  - Enter on last field submits (or Tab to Save button)
  - Escape closes modal (if no unsaved changes)
  - Date picker: Arrow keys navigate calendar, Enter selects date
- **Focus**: Clear focus indicators on all inputs
- **Label Association**: All inputs have visible labels with `for` attribute linking to input ID
- **Required Fields**: Asterisk (*) with aria-label: "required"
- **Error Messages**: Associated with inputs via aria-describedby

---

## Related Screens

- **SET-021-tax-code-list**: List view that opens this modal via [+ Add Tax Code] button
- **SET-021b-tax-code-edit-modal**: Similar modal for editing existing tax codes
- **Toast Notification**: Success message after save ("Tax code created")

---

## Technical Notes

- **RLS**: Insert into tax_codes with org_id automatically from auth context
- **API Endpoint**: `POST /api/settings/tax-codes`
- **Validation Service**: Check code uniqueness, date overlaps, date ordering
- **Date Format**:
  - API: ISO 8601 (YYYY-MM-DD)
  - UI: DD/MM/YYYY (localized based on user/org settings)
- **Default Effective From**: Today's date (cannot select past dates)
- **Calendar Library**: Use ShadCN Popover + Calendar components
- **Overlap Detection**: Query tax_codes table for same code with overlapping date ranges
  - `WHERE code = ? AND org_id = ? AND (effective_from IS NULL OR effective_from <= ?) AND (effective_to IS NULL OR effective_to >= ?)`
- **Expiration Alert**: Show if `(effective_to - TODAY) <= 30 days AND effective_to IS NOT NULL`
- **Set as Default**: If checked, unset previous default (atomic update)
- **Success Redirect**: Close modal and return to list view with new code visible (or scroll to it)

---

## Frontend Implementation Checklist

- [ ] Create form component with all fields
- [ ] Add date picker integration (calendar UI)
- [ ] Implement real-time code uniqueness validation
- [ ] Implement date ordering validation (from <= to)
- [ ] Implement overlap detection on blur of date fields
- [ ] Add past date prevention in calendar (disable past dates)
- [ ] Add expiration warning display (⏰ icon)
- [ ] Add char counter for name and description
- [ ] Format rate to 2 decimals on blur
- [ ] Add "Set as Default" checkbox
- [ ] Add Cancel and Save buttons with proper states
- [ ] Add loading state (spinner, disabled inputs)
- [ ] Add error state with field highlighting
- [ ] Add success toast notification
- [ ] Test form submission with various date scenarios
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test accessibility (screen reader, focus)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (part of SET-021 enhancement)
**Screens Approved**: [SET-021a-tax-code-create-modal]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
