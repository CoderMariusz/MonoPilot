# SET-007: Organization Profile

**Module**: Settings
**Feature**: Organization Settings (FR-SET-001)
**Status**: Auto-Approved
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Organization Profile                    [Save]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Basic Information                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Organization Name *                                        │ │
│  │  [Acme Food Manufacturing                                 ] │ │
│  │                                                             │ │
│  │  Logo                                                       │ │
│  │  ┌────────┐                                                 │ │
│  │  │ [LOGO] │  [Upload New Logo]  [Remove]                   │ │
│  │  └────────┘  PNG/JPG, max 2MB                              │ │
│  │                                                             │ │
│  │  Contact Email *          Phone                            │ │
│  │  [admin@acme.com       ]  [+48 123 456 789              ]  │ │
│  │                                                             │ │
│  │  Website                                                    │ │
│  │  [https://bakeryfresh.pl                                 ] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Address                                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Street Address                                             │ │
│  │  [123 Main Street                                         ] │ │
│  │                                                             │ │
│  │  City                    Postal Code      Country          │ │
│  │  [Warsaw              ]  [00-001      ]   [Poland       ▼] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Regional Settings                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Timezone *              Language *       Currency *        │ │
│  │  [Europe/Warsaw       ▼] [Polski (PL)  ▼] [PLN (zł)     ▼] │ │
│  │                                                             │ │
│  │  Date Format             Number Format                      │ │
│  │  [DD/MM/YYYY          ▼] [1.234,56      ▼]                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Business Hours  (Phase 1B)                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Working Days                                               │ │
│  │  ☑ Mon  ☑ Tue  ☑ Wed  ☑ Thu  ☑ Fri  ☐ Sat  ☐ Sun         │ │
│  │                                                             │ │
│  │  Start Time              End Time                          │ │
│  │  [08:00               ▼] [17:00                         ▼] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Tax Information                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Tax ID (VAT/NIP)        Default Tax Rate                  │ │
│  │  [PL1234567890        ]  [23%           ▼]                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                           [Save]       │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌───────────────────────────┐
│  < Organization Profile   │
├───────────────────────────┤
│                           │
│  Organization Name *      │
│  [Acme Food Mfg        ]  │
│                           │
│  Logo                     │
│  ┌────────┐               │
│  │ [LOGO] │               │
│  └────────┘               │
│  [Upload] [Remove]        │
│  PNG/JPG, max 2MB         │
│                           │
│  Contact Email *          │
│  [admin@acme.com       ]  │
│                           │
│  Phone                    │
│  [+48 123 456 789      ]  │
│                           │
│  Website                  │
│  [https://bakery.pl    ]  │
│                           │
│  Street Address           │
│  [123 Main Street      ]  │
│                           │
│  City                     │
│  [Warsaw               ]  │
│                           │
│  Postal Code              │
│  [00-001               ]  │
│                           │
│  Country                  │
│  [Poland               ▼] │
│                           │
│  Timezone *               │
│  [Europe/Warsaw        ▼] │
│                           │
│  Language *               │
│  [Polski (PL)          ▼] │
│                           │
│  Currency *               │
│  [PLN (zł)             ▼] │
│                           │
│  Date Format              │
│  [DD/MM/YYYY           ▼] │
│                           │
│  Number Format            │
│  [1.234,56             ▼] │
│                           │
│  Working Days             │
│  ☑ Mon ☑ Tue ☑ Wed       │
│  ☑ Thu ☑ Fri ☐ Sat ☐ Sun │
│                           │
│  Start Time               │
│  [08:00                ▼] │
│                           │
│  End Time                 │
│  [17:00                ▼] │
│                           │
│  Tax ID (VAT/NIP)         │
│  [PL1234567890         ]  │
│                           │
│  Default Tax Rate         │
│  [23%                  ▼] │
│                           │
├───────────────────────────┤
│  [Cancel]      [Save]     │
└───────────────────────────┘
```

---

## Key Components

### 1. Logo Upload
- **Type**: Image upload with preview
- **Accept**: PNG, JPG, GIF
- **Max Size**: 2MB
- **Preview**: 80x80px thumbnail
- **Actions**: Upload (file picker), Remove (delete current)

### 2. Form Sections
- **Basic Information**: Name, logo, contact (email/phone), website
- **Address**: Street, city, postal, country dropdown
- **Regional Settings**: Timezone, language, currency, formats
- **Business Hours**: Working days (checkboxes), start/end time (dropdowns)
- **Tax Information**: Tax ID, default tax rate

### 3. Dropdowns
- **Country**: ISO country list (sortable, searchable)
- **Timezone**: IANA timezone database (grouped by region)
- **Language**: PL, EN, DE, FR (supported languages only)
- **Currency**: ISO 4217 codes (PLN, EUR, USD, GBP)
- **Date Format**: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- **Number Format**: 1.234,56 (EU) vs 1,234.56 (US)
- **Tax Rate**: Predefined rates from tax_codes table
- **Start/End Time**: 30-minute intervals (00:00 - 23:30)

### 4. Business Hours (Phase 1B - FR-SET-005)

**Phase**: This section represents Phase 1B features (FR-SET-005: Business Hours Configuration). While included in this wireframe for organizational completeness, the configuration UI can be implemented in a later phase if needed for Phase 1A launch. The API endpoint and schema are ready but front-end configuration is optional for Phase 1A MVP.

- **Working Days**: 7 checkboxes (Mon-Sun), multi-select
- **Default**: Mon-Fri selected, Sat-Sun unselected
- **Start Time**: Dropdown with 30-min intervals (e.g., 06:00, 06:30, ..., 23:30)
- **End Time**: Dropdown with 30-min intervals (e.g., 06:00, 06:30, ..., 23:30)
- **Validation**: End time must be after start time
- **Use Case**: OEE shift calculations, production planning, user notifications
- **Planned Implementation**: Phase 1B (can defer to later phase if needed)

### 5. Validation
- **Required**: Organization name, contact email, timezone, language, currency
- **Email**: RFC 5322 format
- **Phone**: E.164 format (optional)
- **Website**: Valid URL format (optional, must start with http:// or https://)
- **Tax ID**: Country-specific format validation
- **Logo**: File type, size checks
- **Business Hours**: At least 1 working day selected, end time > start time

---

## Main Actions

### Primary Action
- **Button**: "Save" (top-right + bottom-right)
- **Behavior**:
  - Validate all fields
  - Update `organizations` table
  - Upload logo to storage bucket (if changed)
  - Show toast: "Organization profile updated"
  - Remain on page (no redirect)
- **Shortcut**: Ctrl+S / Cmd+S
- **Size**: 48dp mobile, 36px desktop

### Secondary Action
- **Button**: "Cancel"
- **Behavior**: Discard changes, reload original data
- **Confirm**: If dirty form, show "Discard changes?" dialog

### Logo Actions
- **Upload**: Opens file picker, validates on select, shows preview
- **Remove**: Deletes current logo, shows placeholder icon

---

## States

- **Loading**: Skeleton loaders for all form sections, disabled Save button, "Loading organization profile..." text at top
- **Empty**: Not applicable (organization always exists post-onboarding), logo shows placeholder icon if no logo uploaded
- **Error**: Red border on invalid fields, inline error text below field, error summary banner at top, "Fix X errors before saving" message
- **Success**: Green toast notification "Organization profile updated successfully", brief checkmark flash on Save button, updated timestamp shown

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Organization Name | Required, 2-100 chars | "Organization name is required" |
| Contact Email | Required, valid email | "Invalid email format" |
| Website | Optional, valid URL (http/https) | "Invalid URL format (must start with http:// or https://)" |
| Logo | PNG/JPG/GIF, max 2MB | "Logo must be under 2MB" / "Only PNG, JPG, or GIF allowed" |
| Timezone | Required, valid IANA | "Timezone is required" |
| Language | Required, one of PL/EN/DE/FR | "Language is required" |
| Currency | Required, valid ISO 4217 | "Currency is required" |
| Working Days | At least 1 day selected | "Select at least one working day" |
| Start Time | Valid time (00:00-23:30) | "Invalid start time" |
| End Time | Valid time, > start time | "End time must be after start time" |
| Tax ID | Country-specific format | "Invalid VAT/NIP format for Poland" |
| Phone | E.164 format (optional) | "Invalid phone number format" |

---

## Accessibility

- **Touch Targets**: All buttons >= 48dp mobile, inputs 48dp height mobile
- **Contrast**: All text >= 4.5:1, form labels Slate-700 on white
- **Keyboard**: Tab order: name → logo → email → phone → website → address → settings → business hours → tax → Save
- **Screen Reader**: Labels for all inputs, aria-required on required fields, aria-invalid on errors
- **Focus**: Visible focus ring (2px blue outline), auto-focus on first error field after validation
- **Checkboxes**: 48dp touch targets on mobile, keyboard accessible (Space to toggle)

---

## Permissions

| Role | Read | Edit |
|------|------|------|
| Super Admin | Yes | Yes |
| Admin | Yes | Yes |
| All Others | Yes | No (read-only) |

**Read-only mode**: Form inputs disabled, Save/Cancel buttons hidden, "Contact admin to edit" notice shown

---

## API Endpoint

```
PATCH /api/settings/organization
Body: OrganizationUpdateSchema
Response: { success: true, organization: {...} }
```

**Payload Schema**:
```typescript
{
  name: string;              // Required, 2-100 chars
  email: string;             // Required, valid email
  phone?: string;            // Optional, E.164 format
  website?: string;          // Optional, valid URL
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;        // ISO country code
  };
  timezone: string;          // Required, IANA timezone
  language: string;          // Required, PL/EN/DE/FR
  currency: string;          // Required, ISO 4217
  date_format: string;       // DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  number_format: string;     // 1.234,56 or 1,234.56
  business_hours: {
    working_days: string[];  // ["mon", "tue", "wed", "thu", "fri"]
    start_time: string;      // HH:MM format (e.g., "08:00")
    end_time: string;        // HH:MM format (e.g., "17:00")
  };
  tax_id?: string;           // Country-specific format
  default_tax_rate?: number; // From tax_codes table
}
```

**Related**: Logo upload via `POST /api/settings/organization/logo` (multipart/form-data)

---

## Related Screens

- **Onboarding Step 1**: `/onboarding/step-1` (initial setup, similar fields)
- **Settings Home**: `/settings` (navigation entry point)
- **Audit Trail**: `/settings/audit` (tracks profile changes)

---

**Status**: Auto-Approved
**Handoff**: Ready for FRONTEND-DEV
**Approval Mode**: auto_approve
