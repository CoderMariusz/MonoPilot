# SET-021b: Edit Tax Code Modal

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
│  Edit Tax Code: VAT-23                                [✕]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Tax Code Details                                           │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  Code (locked after creation)                               │
│  [VAT-23______________] (Read-only)                        │
│  Cannot be changed. Delete and recreate if needed.          │
│                                                             │
│  Name *                                                     │
│  [VAT Standard_____________________________]                │
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
│  │ Standard Polish VAT rate                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Effective Date Range                                       │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  Current dates: 01/01/2025 - 31/12/2025 (Active)           │
│                                                             │
│  ○ Ongoing (no expiration)                                  │
│  ○ Set date range  [✓]                                      │
│                                                             │
│  Effective From:                                            │
│  [01/01/2025] (DD/MM/YYYY)  [📅 Calendar]                 │
│                                                             │
│  Effective To:                                              │
│  [31/12/2025] (DD/MM/YYYY)  [📅 Calendar]  [Clear]        │
│  Must be after "Effective From" date                        │
│                                                             │
│  ☑ Currently set as default tax code                       │
│  ☐ Set as default tax code for new products               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Cancel]  [Save Changes]  [Delete Tax Code]               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Date Change State (Audit Trail)

```
┌────────────────────────────────────────────────────────────┐
│  Edit Tax Code: VAT-23                                [✕]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Effective To:                                              │
│  [31/12/2026] (changed from 31/12/2025)                    │
│                                                             │
│  ℹ️ This change will be recorded in the activity log.      │
│     Previous: 31/12/2025 → New: 31/12/2026                │
│                                                             │
│  [Save Changes]                                             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Delete Confirmation State

```
┌────────────────────────────────────────────────────────────┐
│  Delete Tax Code                                      [✕]   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Are you sure you want to delete "VAT-23"?                 │
│                                                             │
│  ⚠️ WARNING:                                               │
│  - Cannot be undone                                         │
│  - Will be removed from all related products               │
│  - Audit trail will be preserved                           │
│                                                             │
│  Current usage:                                             │
│  - 156 products use this tax code                          │
│  - Last used 2 days ago                                     │
│                                                             │
│  To proceed, type the code "VAT-23" to confirm:             │
│  [____________________]                                     │
│                                                             │
│  [Cancel]  [Delete Tax Code]  (disabled until code typed)  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Code Field** - Text input, READ-ONLY (locked after creation)
2. **Name Field** - Text input, editable, max 100 chars
3. **Rate Field** - Numeric input, editable, 0.00-100.00, exactly 2 decimals
4. **Type Dropdown** - Enum select, editable
5. **Description Textarea** - Optional, editable, max 500 chars
6. **Date Range Radio** - Toggle between "Ongoing" and "Set date range"
7. **Effective From Date Picker** - Calendar picker, editable
8. **Effective To Date Picker** - Optional calendar picker, editable
9. **Change Indicator** - "Changed from X to Y" info message when field modified
10. **Current Default Badge** - Shows if this is the current default tax code
11. **Default Checkbox** - Option to make this the default tax code
12. **Delete Button** - Opens confirmation dialog (red destructive button)
13. **Action Buttons** - Cancel, Save Changes, Delete Tax Code
14. **Delete Confirmation** - Requires typing code to confirm deletion

---

## Main Actions

### Primary
- **[Save Changes]** - Validates all fields, checks for overlaps, updates tax code, closes modal, shows success toast "Tax code updated", returns to list view

### Secondary
- **[Cancel]** - Closes modal without saving (shows confirmation if changes made)
- **[Delete Tax Code]** - Opens delete confirmation dialog
- **[📅 Calendar]** - Opens calendar picker for date selection
- **[Clear]** - Clears the "Effective To" date field

### Delete Confirmation
- **[Delete Tax Code]** (in dialog) - Permanently deletes code (disabled until confirmation code typed)
- **[Cancel]** - Closes confirmation dialog without deleting

---

## States

- **Loading**: Skeleton form with spinner, disabled Save button
- **Empty**: All fields populated with current values from database
- **Dirty** (modified): "Save Changes" button enabled, "Changed from X to Y" message shows for modified fields
- **Pristine** (unchanged): "Save Changes" button disabled or "No changes" state
- **Error**:
  - Missing required fields (red outline)
  - Invalid rate (not numeric or outside range)
  - Overlapping date ranges with other codes
  - Effective To before Effective From
  - Effective From is a past date
  - Code not unique (shouldn't happen in edit, but safeguard)
- **Success**: Toast notification "Tax code updated" + closes modal
- **Delete Confirmation**: Modal overlay with code confirmation input
- **Delete Success**: Toast "Tax code deleted" + return to list

---

## Data Fields

| Field | Type | Editable | Validation | Notes |
|-------|------|----------|------------|-------|
| code | string | No | N/A (locked) | Cannot be changed after creation |
| name | string | Yes | Max 100 chars | Display name in UI |
| rate | decimal(5,2) | Yes | Numeric, 0.00-100.00, exactly 2 decimals | Tax rate percentage |
| type | enum | Yes | standard, reduced, zero, exempt, n/a | Affects rate classification |
| description | text | Yes | Max 500 chars | Optional notes/explanations |
| effective_from | date | Yes | ISO 8601 YYYY-MM-DD, must be <= effective_to | Start date for rate validity |
| effective_to | date | Yes | ISO 8601 YYYY-MM-DD, must be >= effective_from | End date for rate validity |
| is_default | boolean | Yes | One default per org | Checkbox option |
| status | enum | No | active, disabled | Read-only display |
| created_at | timestamp | No | N/A (read-only) | Display only |
| updated_at | timestamp | No | N/A (read-only) | Display only |
| created_by | uuid | No | N/A (read-only) | Display in activity log |
| last_modified_by | uuid | No | N/A (read-only) | Display in activity log |

---

## Validation Rules

| Rule | Condition | Action |
|------|-----------|--------|
| **Code Locked** | Cannot edit after creation | Show read-only input, grayed out |
| **Required Fields** | name, rate, type must be provided | Show red outline, focus on first error |
| **Rate Range** | Must be 0.00-100.00 | Highlight field in red if outside range |
| **Rate Decimals** | Exactly 2 decimal places | Auto-format on blur |
| **Name Length** | Max 100 characters | Show char counter |
| **Description Length** | Max 500 characters | Show char counter |
| **Date Ordering** | effective_to > effective_from | Show error on effective_to field |
| **Overlap Check** | No two active rates for same code (excluding current) | Show error if overlapping with other code versions |
| **Change Detection** | Track which fields have changed | Enable "Save Changes" only if changes made |
| **Default Toggle** | Only one default per org | If setting new default, update previous |
| **Deletion Check** | Cannot delete if used in active transactions | Show error: "Cannot delete: {N} products use this code" |

---

## API Request/Response

### Request (PATCH /api/settings/tax-codes/{id})

```json
{
  "name": "VAT Standard",
  "rate": 23.00,
  "type": "standard",
  "description": "Standard Polish VAT rate",
  "effective_from": "2025-01-01",
  "effective_to": "2025-12-31",
  "is_default": true
}
```

### Response (200 OK)

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
  "updated_at": "2025-12-15T10:30:00Z",
  "created_by": "user_id_1",
  "last_modified_by": "user_id_2"
}
```

### Delete Request (DELETE /api/settings/tax-codes/{id})

```
DELETE /api/settings/tax-codes/uuid
Authorization: Bearer {token}
```

### Delete Response (200 OK)

```json
{
  "message": "Tax code VAT-23 deleted successfully",
  "id": "uuid",
  "code": "VAT-23"
}
```

### Delete Error (409 Conflict - Still in Use)

```json
{
  "error": "in_use",
  "message": "Cannot delete tax code: 156 products currently use this code",
  "usage_count": 156,
  "last_used_at": "2025-12-13T14:22:00Z"
}
```

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp, buttons >= 48x48dp
- **Contrast**: Labels and inputs pass WCAG AA (4.5:1)
- **Screen reader**:
  - Form title: "Edit Tax Code dialog, VAT-23"
  - Code field: "Code, text input, read-only, cannot be changed after creation"
  - Name field: "Name, text input, required"
  - Rate field: "Tax rate percentage, numeric input, required, 0.00 to 100.00"
  - Effective From: "Effective From, date input, format DD/MM/YYYY"
  - Effective To: "Effective To, date input, format DD/MM/YYYY, must be after Effective From"
  - Change indicator: "Name changed from old value to new value"
  - Default badge: "Currently set as default tax code"
  - Delete button: "Delete Tax Code, destructive action, requires confirmation"
- **Keyboard**:
  - Tab moves through editable fields only (skip locked code field)
  - Enter on last field moves to buttons or can submit
  - Escape closes modal (with unsaved changes confirmation)
  - Delete confirmation: Tab to Delete button, Enter to confirm (after code typed)
- **Focus**: Clear focus indicators on all inputs and buttons
- **Error Messages**: Associated with inputs via aria-describedby
- **Change Tracking**: Announce which fields have unsaved changes

---

## Related Screens

- **SET-021-tax-code-list**: List view that opens this modal via row action menu
- **SET-021a-tax-code-create-modal**: Similar modal for creating new tax codes
- **Activity Log Panel**: Shows edit history via "View Activity Log" button in list
- **Toast Notification**: Success message after save ("Tax code updated")

---

## Technical Notes

- **RLS**: Update only where org_id matches auth context
- **API Endpoint**: `PATCH /api/settings/tax-codes/{id}` or `PUT /api/settings/tax-codes/{id}`
- **Validation Service**: Check date overlaps (excluding current code), date ordering
- **Change Detection**: Compare current values with database values to determine dirty state
- **Audit Trail**: Log all changes (name, rate, type, effective dates) with before/after values
- **Date Format**:
  - API: ISO 8601 (YYYY-MM-DD)
  - UI: DD/MM/YYYY (localized)
- **Calendar Library**: Use ShadCN Popover + Calendar components
- **Overlap Detection**: Query for other active rates of same code with overlapping dates
  - `WHERE code = ? AND org_id = ? AND id != ? AND overlap condition`
- **Default Logic**: If setting new default, atomic update to unset previous default
- **Delete Validation**: Check products table for FK references before allowing delete
  - Query: `SELECT COUNT(*) FROM products WHERE tax_code_id = ? AND org_id = ?`
  - If count > 0, show error with count
- **Delete Confirmation**: Require user to type the code to prevent accidental deletion
- **Success Redirect**: Close modal and return to list view with updated row (scroll to/highlight)

---

## Frontend Implementation Checklist

- [ ] Load tax code data from API on component mount
- [ ] Display all fields with current values
- [ ] Lock/gray out code field
- [ ] Implement change detection (compare current vs original values)
- [ ] Enable "Save Changes" button only if changes made
- [ ] Add "Changed from X to Y" indicator for modified fields
- [ ] Implement real-time date ordering validation
- [ ] Implement overlap detection on blur of date fields
- [ ] Add date picker integration
- [ ] Add char counter for name and description
- [ ] Format rate to 2 decimals on blur
- [ ] Display "Currently set as default" badge if applicable
- [ ] Add "Set as Default" checkbox with disabled state if current default
- [ ] Add Cancel button with unsaved changes confirmation
- [ ] Add Delete button with confirmation dialog
- [ ] Implement delete confirmation (require code typing)
- [ ] Add loading state during save
- [ ] Add error state with field highlighting
- [ ] Add success toast notification
- [ ] Test with various edit scenarios (change name, change dates, delete)
- [ ] Test keyboard navigation and accessibility
- [ ] Test unsaved changes detection and confirmation

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (part of SET-021 enhancement)
**Screens Approved**: [SET-021b-tax-code-edit-modal]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
