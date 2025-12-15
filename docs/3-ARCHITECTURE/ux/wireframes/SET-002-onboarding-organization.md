# SET-002: Onboarding Wizard - Organization Profile

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 1 of 6
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

First step of onboarding wizard. Collects organization profile details (name, address, timezone, language, contact info). Organization name pre-filled from registration. User can update or accept defaults and proceed.

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
│  │  City                  Postal Code      Country *       │ │
│  │  [Springfield___]      [62701____]      [USA ▼]         │ │
│  │                                                         │ │
│  │  Contact Email                Contact Phone            │ │
│  │  [admin@acme.com______]     [+1 555-0123___]           │ │
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
│  │  • Country is required                                  │ │
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
│  │  Country * ⚠ Required                                   │ │
│  │  [Select Country ▼]                                     │ │
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
  - City, Postal Code
  - Country * (required, dropdown)
  - Contact Email (optional)
  - Contact Phone (optional)
- **Required**: Organization Name, Country

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
- **Country**: Required, ISO 3166-1 alpha-2 code
- **Contact Email**: Optional, valid email format
- **Contact Phone**: Optional, max 20 chars
- **Timezone**: Select from IANA timezone list
- **Language**: PL, EN, DE, FR only (no ES)

---

## Main Actions

### Primary Action
- **Button**: "Next: Warehouse →"
- **Behavior**:
  - Validate required fields (organization_name, country, timezone, language)
  - Save data to `wizard_progress.step1`
  - Navigate to Step 2 (Warehouse)
- **Size**: Large (48dp height)
- **Disabled**: If validation fails

### Secondary Action
- **Button**: "Skip Step"
- **Behavior**:
  - Save minimal data (org name, country, timezone, language)
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
- Country (must be ISO 3166-1 alpha-2 code)
- Timezone (must be IANA timezone)
- Language (must be PL, EN, DE, or FR)

### Validation Rules
```typescript
{
  organization_name: z.string().min(2).max(100),
  address_line1: z.string().max(200).optional(),
  address_line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().length(2), // ISO 3166-1 alpha-2 (REQUIRED)
  contact_email: z.string().email().optional(), // NEW FIELD
  contact_phone: z.string().max(20).optional(), // NEW FIELD
  timezone: z.string(), // IANA timezone
  language: z.enum(['pl', 'en', 'de', 'fr']), // UPDATED: es removed
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
    "contact_email": "admin@acme.com",
    "contact_phone": "+1 555-0123",
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
- Contact fields optional (leave empty if not provided)

### Country Dropdown
- Use standard ISO 3166-1 alpha-2 codes
- Show country name + flag emoji
- No default selection (required field)
- Searchable dropdown for UX

### Language Enum
- **Supported**: PL (Polish), EN (English), DE (German), FR (French)
- **Removed**: ES (Spanish) - Not in PRD
- Default: EN (English)

---

## Accessibility

- **Touch targets**: All inputs >= 48x48dp
- **Labels**: Associated with inputs via `for`/`id`
- **Required fields**: Marked with * and `aria-required="true"`
- **Error messages**: Announced to screen readers
- **Keyboard**: Tab order: Name → Address1 → Address2 → City → Postal → Country → Email → Phone → Timezone → Language → Currency → Date

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
4. Make Country field required (add * and validation)
5. Add Contact Email field (optional, email validation)
6. Add Contact Phone field (optional, max 20 chars)
7. Update Language enum to PL/EN/DE/FR only (remove ES)
8. Validate on submit via Zod schema
9. Save to `wizard_progress.step1` via `PATCH /api/settings/wizard/progress`

### API Endpoints:
```
GET /api/settings/organization
Response: { id, company_name, wizard_progress, country, contact_email, contact_phone }

PATCH /api/settings/wizard/progress
Body: {
  step: 1,
  step1: {
    organization_name, address_line1, address_line2, city, postal_code,
    country, contact_email, contact_phone, timezone, language, currency, date_format
  }
}
Response: { success: true }
```

### API Schema Updates:
```typescript
// Update organizations table schema
organization_profile: {
  country: string (required, ISO 3166-1 alpha-2)
  contact_email?: string (optional, email format)
  contact_phone?: string (optional, max 20 chars)
}

// Update wizard step1 schema
wizard_step1: {
  organization_name: string (required, 2-100 chars)
  address_line1?: string (optional, max 200 chars)
  address_line2?: string (optional, max 200 chars)
  city?: string (optional, max 100 chars)
  postal_code?: string (optional, max 20 chars)
  country: string (required, ISO 3166-1 alpha-2)
  contact_email?: string (optional, valid email)
  contact_phone?: string (optional, max 20 chars)
  timezone: string (required, IANA timezone)
  language: 'pl' | 'en' | 'de' | 'fr' (required)
  currency: string (ISO 4217)
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
}
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Concise Format)
**Iterations**: 0 of 3
**PRD Compliance**: FR-SET-001, FR-SET-181 ✓
**Changes Made**:
- Removed 'es' from language enum (PRD only supports PL/EN/DE/FR)
- Added Contact Email field (optional) per FR-SET-001
- Added Contact Phone field (optional) per FR-SET-001
- Marked Country as required per FR-SET-181
- Updated validation rules and API schemas
- Updated data saved structure to include new fields
