# SET-002: Onboarding Wizard - Organization Profile

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 1 of 6
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## Overview

First step of onboarding wizard. Collects organization profile details (name, address, timezone, language). Organization name pre-filled from registration. User can update or accept defaults and proceed.

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [1/6]  16%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Organization Profile                                │
│                                                               │
│  Tell us about your food manufacturing organization          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Basic Information                                      │ │
│  │                                                         │ │
│  │  Organization Name *                                    │ │
│  │  [Acme Food Manufacturing_____________]                 │ │
│  │                                                         │ │
│  │  Address Line 1                                         │ │
│  │  [123 Main Street_____________________]                 │ │
│  │                                                         │ │
│  │  Address Line 2                                         │ │
│  │  [Suite 100________________________]                    │ │
│  │                                                         │ │
│  │  City                  Postal Code      Country         │ │
│  │  [Springfield___]      [62701____]      [USA ▼]         │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Regional Settings                                      │ │
│  │                                                         │ │
│  │  Timezone *              Language *                     │ │
│  │  [America/Chicago ▼]     [English ▼]                    │ │
│  │                                                         │ │
│  │  Currency                Date Format                    │ │
│  │  [USD ▼]                 [MM/DD/YYYY ▼]                 │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  * Required fields                                            │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Skip Step]                                    [Next: Warehouse →]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [1/6]  16%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                      [Spinner]                                │
│                                                               │
│                Loading organization data...                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Skeleton: Form fields]                                │ │
│  │  [Skeleton: Input boxes]                                │ │
│  │  [Skeleton: Dropdowns]                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [1/6]  16%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Organization Profile                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ⚠ Please fix the following errors:                     │ │
│  │                                                         │ │
│  │  • Organization name is required                        │ │
│  │  • Timezone is required                                 │ │
│  │  • Language is required                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Basic Information                                      │ │
│  │                                                         │ │
│  │  Organization Name * ⚠ Required                         │ │
│  │  [________________________________] ← Empty              │ │
│  │                                                         │ │
│  │  Address Line 1                                         │ │
│  │  [123 Main Street_____________________]                 │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Skip Step]                                    [Next: Warehouse →]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
(Not applicable - form always pre-filled with org name from registration)
```

---

## Key Components

### 1. Progress Tracker
- **Display**: "1/6" + 16% progress bar
- **Purpose**: Show wizard progress
- **Color**: Blue (in progress)

### 2. Basic Information Card
- **Fields**:
  - Organization Name * (pre-filled from registration)
  - Address Line 1, 2
  - City, Postal Code, Country dropdown
- **Required**: Organization Name only

### 3. Regional Settings Card
- **Fields**:
  - Timezone * (dropdown, auto-detect from browser)
  - Language * (dropdown, default: English)
  - Currency (dropdown, default from country)
  - Date Format (dropdown, default from locale)
- **Required**: Timezone, Language

### 4. Field Validation
- **Organization Name**: 2-100 chars, alphanumeric + spaces
- **Address**: Optional, max 200 chars each
- **Timezone**: Select from IANA timezone list
- **Currency**: ISO 4217 codes (USD, EUR, GBP, etc.)

---

## Main Actions

### Primary Action
- **Button**: "Next: Warehouse →"
- **Behavior**:
  - Validate required fields
  - Save data to `wizard_progress.step1`
  - Navigate to Step 2 (Warehouse)
- **Size**: Large (48dp height)
- **Disabled**: If validation fails

### Secondary Action
- **Button**: "Skip Step"
- **Behavior**:
  - Save minimal data (org name only)
  - Navigate to Step 2
- **Purpose**: Allow quick progression

---

## State Transitions

```
Launcher
  ↓ [Start Onboarding Wizard]
LOADING (Load org data)
  ↓ Success
SUCCESS (Show form with pre-filled org name)
  ↓ [Next]
  ↓ Validation fails
ERROR (Show validation errors)
  ↓ Fix errors, [Next]
  ↓ Validation passes
Step 2 (Warehouse)

OR

SUCCESS
  ↓ [Skip Step]
Step 2 (Warehouse)
```

---

## Validation

### Required Fields
- Organization Name (min 2 chars)
- Timezone (must be IANA timezone)
- Language (must be supported locale)

### Validation Rules
```typescript
{
  organization_name: z.string().min(2).max(100),
  address_line1: z.string().max(200).optional(),
  address_line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  timezone: z.string(), // IANA timezone
  language: z.enum(['en', 'es', 'fr', 'de', 'pl']),
  currency: z.string().length(3), // ISO 4217
  date_format: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
}
```

---

## Data Saved

Step 1 saves to `organizations.wizard_progress`:
```json
{
  "step": 1,
  "step1": {
    "organization_name": "Acme Food Manufacturing",
    "address_line1": "123 Main Street",
    "address_line2": "Suite 100",
    "city": "Springfield",
    "postal_code": "62701",
    "country": "US",
    "timezone": "America/Chicago",
    "language": "en",
    "currency": "USD",
    "date_format": "MM/DD/YYYY"
  }
}
```

---

## Technical Notes

### Pre-fill Logic
- Organization name from registration
- Timezone auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Currency inferred from country selection
- Date format from browser locale

### Country Dropdown
- Use standard ISO 3166-1 alpha-2 codes
- Show country name + flag emoji
- Default to US

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp
- **Labels**: Associated with inputs via `for`/`id`
- **Required fields**: Marked with * and `aria-required="true"`
- **Error messages**: Announced to screen readers
- **Keyboard**: Tab order: Name → Address → City → Postal → Country → Timezone → Language → Currency → Date

---

## Related Screens

- **Previous**: [SET-001-onboarding-launcher.md] (Launcher)
- **Next**: [SET-003-onboarding-warehouse.md] (Step 2)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `OrganizationProfileStep` component
2. Pre-fill organization name from `organizations.company_name`
3. Auto-detect timezone from browser
4. Validate on submit via Zod schema
5. Save to `wizard_progress.step1` via `PATCH /api/settings/wizard/progress`

### API Endpoints:
```
GET /api/settings/organization
Response: { id, company_name, wizard_progress }

PATCH /api/settings/wizard/progress
Body: { step: 1, step1: {...} }
Response: { success: true }
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Concise Format)
**Iterations**: 0 of 3
