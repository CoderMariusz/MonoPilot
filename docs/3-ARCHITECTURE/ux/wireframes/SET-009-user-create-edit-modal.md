# SET-009: User Create/Edit Modal

**Module**: Settings
**Feature**: User Management (Story 1.9)
**Type**: Modal Dialog
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State (Create Mode)

```
┌──────────────────────────────────────────────────┐
│  Create New User                          [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  First Name *                                    │
│  [_____________________]                         │
│                                                  │
│  Last Name *                                     │
│  [_____________________]                         │
│                                                  │
│  Email *                                         │
│  [_____________________]                         │
│                                                  │
│  Preferred Language *                            │
│  [Select language ▼]                             │
│    - Polish (PL)                                 │
│    - English (EN)                                │
│    - German (DE)                                 │
│    - French (FR)                                 │
│                                                  │
│  Role *                                          │
│  [Select role ▼]                                 │
│    - Super Admin                                 │
│    - Admin                                       │
│    - Production Manager                          │
│    - Quality Manager                             │
│    - Warehouse Manager                           │
│    - Production Operator                         │
│    - Quality Inspector                           │
│    - Warehouse Operator                          │
│    - Planner                                     │
│    - Viewer                                      │
│                                                  │
│  Warehouse Access *                              │
│  [Select warehouses ▼]        [0 selected]       │
│    ☐ MAIN - Main Warehouse                       │
│    ☐ WH02 - Secondary Warehouse                  │
│    ☐ WH03 - Staging Warehouse                    │
│                                                  │
│  ☐ Active (user can log in)                      │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Cancel]                        [Create User]   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Success State (Edit Mode)

```
┌──────────────────────────────────────────────────┐
│  Edit User: John Doe                      [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  First Name *                                    │
│  [John________________]                          │
│                                                  │
│  Last Name *                                     │
│  [Doe_________________]                          │
│                                                  │
│  Email *                                         │
│  [john.doe@acme.com___]                          │
│                                                  │
│  Preferred Language *                            │
│  [English (EN) ▼]                                │
│    - Polish (PL)                                 │
│    - English (EN)                                │
│    - German (DE)                                 │
│    - French (FR)                                 │
│                                                  │
│  Role *                                          │
│  [Production Manager ▼]                          │
│    - Super Admin                                 │
│    - Admin                                       │
│    - Production Manager                          │
│    - Quality Manager                             │
│    - Warehouse Manager                           │
│    - Production Operator                         │
│    - Quality Inspector                           │
│    - Warehouse Operator                          │
│    - Planner                                     │
│    - Viewer                                      │
│                                                  │
│  Warehouse Access *                              │
│  [Select warehouses ▼]        [2 selected]       │
│    ☑ MAIN - Main Warehouse                       │
│    ☑ WH02 - Secondary Warehouse                  │
│    ☐ WH03 - Staging Warehouse                    │
│                                                  │
│  ☑ Active (user can log in)                      │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Cancel]                      [Save Changes]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────┐
│  Create New User                          [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│                  [Spinner]                       │
│                                                  │
│              Creating user account...            │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────┐
│  Create New User                          [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠ Error: Email already exists in this org      │
│                                                  │
│  First Name *                                    │
│  [John________________]                          │
│                                                  │
│  Last Name *                                     │
│  [Doe_________________]                          │
│                                                  │
│  Email *                                         │
│  [john.doe@acme.com___] ❌ Email already exists  │
│                                                  │
│  Preferred Language *                            │
│  [English (EN) ▼]                                │
│                                                  │
│  Role *                                          │
│  [Production Manager ▼]                          │
│                                                  │
│  Warehouse Access *                              │
│  [Select warehouses ▼]        [0 selected]       │
│    ⚠ Please select at least one warehouse        │
│                                                  │
│  ☑ Active (user can log in)                      │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Cancel]                        [Create User]   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Empty State

```
(Not applicable - modal is triggered by action, not standalone)
```

---

## Key Components

### 1. Form Fields
- **First Name**: Text input, required, 2-50 chars
- **Last Name**: Text input, required, 2-50 chars
- **Email**: Email input, required, format validation
- **Preferred Language**: Dropdown, required, 4 options (Polish, English, German, French), defaults to organization default language (FR-SET-112)
- **Role**: Dropdown, required, 10 options (Super Admin, Admin, Production Manager, Quality Manager, Warehouse Manager, Production Operator, Quality Inspector, Warehouse Operator, Planner, Viewer)
- **Warehouse Access**: Multi-select dropdown, required, min 1 selection
- **Active Toggle**: Checkbox, default OFF for create, preserves state for edit

### 2. Preferred Language Dropdown (NEW - FR-SET-112)
- **Type**: Single-select dropdown
- **Options**: 4 languages
  - Polish (PL)
  - English (EN)
  - German (DE)
  - French (FR)
- **Default**: Organization's default language (FR-SET-105)
- **Help Text**: "User interface language for this user"
- **Behavior**: Sets the UI language for user's interface locale
- **Position**: After Email field, before Role field
- **Touch Target**: 48x48dp
- **Requirement**: FR-SET-112 - User-level language preference

### 3. Role Dropdown
- **Type**: Single-select dropdown
- **Options**: 10 roles aligned with PRD FR-SET-020 to FR-SET-029
  - Super Admin (FR-SET-020)
  - Admin (FR-SET-021)
  - Production Manager (FR-SET-022)
  - Quality Manager (FR-SET-023)
  - Warehouse Manager (FR-SET-024)
  - Production Operator (FR-SET-025)
  - Quality Inspector (FR-SET-026)
  - Warehouse Operator (FR-SET-027)
  - Planner (FR-SET-028)
  - Viewer (FR-SET-029)
- **Behavior**: Role determines default permissions (details in PRD FR-SET-011)
- **Touch Target**: 48x48dp

### 4. Warehouse Access Multi-Select
- **Type**: Checkbox dropdown (remains open while selecting)
- **Counter**: Shows "X selected" badge
- **Validation**: Min 1 warehouse required
- **Behavior**: User can only access selected warehouses
- **Touch Target**: 48x48dp per checkbox

### 5. Active Toggle
- **Type**: Checkbox
- **Default**: OFF (new users inactive until invited)
- **Label**: "Active (user can log in)"
- **Purpose**: Admin can deactivate user without deletion

---

## Main Actions

### Primary Actions
- **Create Mode**: "Create User" button
  - Validates all fields (required, format, uniqueness)
  - Creates user record with `status: 'INVITED'`
  - Sets language_preference from selected dropdown
  - Sends invitation email via Supabase Auth
  - Closes modal, shows toast: "User created. Invitation sent to {email}"
  - Refreshes user list table

- **Edit Mode**: "Save Changes" button
  - Validates all fields
  - Updates user record (preserves created_at, created_by)
  - Updates language_preference if changed
  - If email changed: sends new invitation
  - If role changed: updates permissions immediately
  - Closes modal, shows toast: "User updated successfully"
  - Refreshes user list table

### Secondary Actions
- **Cancel**: Closes modal without saving, no confirmation needed
- **[X]**: Top-right close button, same as Cancel

---

## 4 States (One-Line)

- **Loading**: Spinner + "Creating user account..." while POST /api/settings/users runs
- **Empty**: N/A (modal triggered by user action, not standalone screen)
- **Error**: Red banner at top + inline field errors (email exists, missing warehouse, invalid format)
- **Success**: Form fields populated (edit mode) or blank (create mode), ready for input

---

## Validation Rules

| Field | Rules |
|-------|-------|
| First Name | Required, 2-50 chars, letters/spaces only |
| Last Name | Required, 2-50 chars, letters/spaces only |
| Email | Required, valid email format, unique per org |
| Preferred Language | Required, must be one of 4 valid languages (PL, EN, DE, FR) |
| Role | Required, must be one of 10 valid roles |
| Warehouse Access | Required, min 1 warehouse selected |
| Active | Optional, boolean |

**Validation Timing**:
- On blur: Email uniqueness check (async)
- On submit: All fields validated before API call

---

## Accessibility

- **Touch Targets**: All inputs, dropdowns, buttons >= 48x48dp
- **Contrast**: Error text red (#DC2626) passes WCAG AA (4.5:1)
- **Screen Reader**: Announces "Create User Modal" on open, field labels, errors, language options
- **Keyboard**: Tab navigation, Escape closes modal, Enter submits form
- **Focus**: First Name field auto-focused on modal open
- **Language Label**: Associates preference dropdown with clear label "Preferred Language"

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/users`
- **Update**: `PATCH /api/settings/users/:id`
- **Validation**: `GET /api/settings/users/validate-email?email={email}`
- **Role List**: `GET /api/settings/roles` returns all 10 valid roles
- **Language List**: `GET /api/settings/languages` returns [PL, EN, DE, FR]

### Data Structure
```typescript
{
  first_name: string;
  last_name: string;
  email: string;
  language_preference: 'PL' | 'EN' | 'DE' | 'FR'; // NEW - FR-SET-112
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PRODUCTION_MANAGER' | 'QUALITY_MANAGER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_OPERATOR' | 'QUALITY_INSPECTOR' | 'WAREHOUSE_OPERATOR' | 'PLANNER' | 'VIEWER';
  warehouse_access: string[]; // array of warehouse IDs
  active: boolean;
  org_id: string; // auto-populated from session
}
```

### API Request Schema (Create)
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@acme.com",
  "language_preference": "EN",
  "role": "PRODUCTION_MANAGER",
  "warehouse_access": ["wh-001", "wh-002"],
  "active": false
}
```

### API Response Schema
```json
{
  "id": "user-12345",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@acme.com",
  "language_preference": "EN",
  "role": "PRODUCTION_MANAGER",
  "warehouse_access": ["wh-001", "wh-002"],
  "active": false,
  "status": "INVITED",
  "created_at": "2025-12-15T10:30:00Z",
  "created_by": "admin-001",
  "org_id": "org-456"
}
```

### Language Options (FR-SET-112)
| Code | Language | Notes |
|------|----------|-------|
| PL | Polish | Default for organizations in Poland |
| EN | English | Default for English-speaking regions |
| DE | German | Default for organizations in Germany |
| FR | French | Default for organizations in France |

### Role Permissions Reference (from PRD FR-SET-020 to FR-SET-029)
- **Super Admin**: Full access, manage billing, manage organization
- **Admin**: Full access except billing, manage all users/settings
- **Production Manager**: View all, edit production/planning, manage production operators
- **Quality Manager**: View all quality data, manage QA/CoA/CAPA, assign quality inspectors
- **Warehouse Manager**: View all warehouse data, manage warehouse operators, configure locations
- **Production Operator**: Execute production tasks, scan materials, report consumption
- **Quality Inspector**: Record test results, manage holds, create NCRs
- **Warehouse Operator**: Pick/pack/move materials, scan license plates
- **Planner**: Create sales orders, planning tasks, MRP/MPS access
- **Viewer**: Read-only access to all modules

---

## Related Screens

- **User List Table**: [SET-008-user-list.md] (parent screen)
- **User Invitation Email**: Sent via Supabase Auth after creation

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use ShadCN Dialog component for modal
2. Role options must match PRD FR-SET-011, FR-SET-020 to FR-SET-029
3. Language preference options must match PRD FR-SET-112 (PL, EN, DE, FR)
4. Zod schema: `lib/validation/user-schema.ts` (add language_preference field)
5. Service: `lib/services/user-service.ts` (add language_preference handling)
6. Email uniqueness check: debounce 500ms on blur
7. Multi-select: use Popover + Checkbox from ShadCN
8. Toast notifications: use `toast()` from ShadCN
9. Language dropdown: position after Email field, before Role field
10. Default language: fetch from organization settings (org.default_language)
11. Ensure role enum values: SUPER_ADMIN, ADMIN, PRODUCTION_MANAGER, QUALITY_MANAGER, WAREHOUSE_MANAGER, PRODUCTION_OPERATOR, QUALITY_INSPECTOR, WAREHOUSE_OPERATOR, PLANNER, VIEWER
12. Ensure language enum values: PL, EN, DE, FR
13. Add help text below Preferred Language: "User interface language for this user"
14. Language preference is required field (marked with *)

---

**Status**: Ready for user approval
**Approval Required**: Yes
**Iterations**: 1 of 3
**Last Updated**: 2025-12-15
**Compliance**: FR-SET-112 (User-level language preference)
