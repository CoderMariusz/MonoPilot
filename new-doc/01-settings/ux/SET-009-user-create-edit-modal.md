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
│  ─────────────────────────────────────────────   │
│  PRD Reference: FR-SET-018                       │
│  (User Warehouse Access Restrictions)            │
│  Phase: 1B - Infrastructure                      │
│  ─────────────────────────────────────────────   │
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
│  ─────────────────────────────────────────────   │
│  PRD Reference: FR-SET-018                       │
│  (User Warehouse Access Restrictions)            │
│  Phase: 1B - Infrastructure                      │
│  ─────────────────────────────────────────────   │
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
- **Warehouse Access**: Multi-select dropdown, required, min 1 selection (FR-SET-018)
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

### 4. Warehouse Access Multi-Select (FR-SET-018)
- **PRD Reference**: FR-SET-018 (User Warehouse Access Restrictions)
- **Phase**: 1B (Infrastructure - after warehouses exist)
- **Type**: Checkbox dropdown (remains open while selecting)
- **Counter**: Shows "X selected" badge
- **Validation**: Min 1 warehouse required (unless role = super_admin/admin)
- **Behavior**: User can only access selected warehouses
- **Touch Target**: 48x48dp per checkbox
- **Default Behavior (Phase 1A)**: All users have access to all warehouses
- **Future Behavior (Phase 1B)**: User-specific warehouse restrictions enforced via RLS

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
  - Creates user_warehouse_access records (FR-SET-018)
  - Sends invitation email via Supabase Auth
  - Closes modal, shows toast: "User created. Invitation sent to {email}"
  - Refreshes user list table

- **Edit Mode**: "Save Changes" button
  - Validates all fields
  - Updates user record (preserves created_at, created_by)
  - Updates language_preference if changed
  - Updates user_warehouse_access records (FR-SET-018)
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
| Warehouse Access | Required, min 1 warehouse (unless role = super_admin/admin) - FR-SET-018 |
| Active | Optional, boolean |

**Validation Timing**:
- On blur: Email uniqueness check (async)
- On submit: All fields validated before API call

### Warehouse Access Validation (FR-SET-018)
- **PRD**: FR-SET-018 (User Warehouse Access Restrictions)
- **Required**: At least 1 warehouse if role != super_admin/admin
- **Default**: super_admin/admin bypass (access all warehouses)
- **Error**: "Please select at least one warehouse" if none selected and role requires it
- **Phase 1A Behavior**: Field visible but not enforced (all users access all warehouses)
- **Phase 1B Behavior**: Field enforced, RLS policies restrict access based on user_warehouse_access table

---

## Accessibility

- **Touch Targets**: All inputs, dropdowns, buttons >= 48x48dp
- **Contrast**: Error text red (#DC2626) passes WCAG AA (4.5:1)
- **Screen Reader**: Announces "Create User Modal" on open, field labels, errors, language options, warehouse access count
- **Keyboard**: Tab navigation, Escape closes modal, Enter submits form
- **Focus**: First Name field auto-focused on modal open
- **Language Label**: Associates preference dropdown with clear label "Preferred Language"
- **Warehouse Access Label**: Associates warehouse multi-select with clear label "Warehouse Access" + count badge

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/users`
- **Update**: `PATCH /api/settings/users/:id`
- **Validation**: `GET /api/settings/users/validate-email?email={email}`
- **Role List**: `GET /api/settings/roles` returns all 10 valid roles
- **Language List**: `GET /api/settings/languages` returns [PL, EN, DE, FR]
- **Warehouse List**: `GET /api/settings/warehouses` returns available warehouses for multi-select (FR-SET-018)

### Data Structure
```typescript
{
  first_name: string;
  last_name: string;
  email: string;
  language_preference: 'PL' | 'EN' | 'DE' | 'FR'; // NEW - FR-SET-112
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PRODUCTION_MANAGER' | 'QUALITY_MANAGER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_OPERATOR' | 'QUALITY_INSPECTOR' | 'WAREHOUSE_OPERATOR' | 'PLANNER' | 'VIEWER';
  warehouse_access?: string[]; // FR-SET-018: Array of warehouse IDs
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

## Implementation Notes

### Warehouse Access (FR-SET-018)
- **Phase**: 1B (deferred from 01a demo MVP)
- **Dependency**: Requires warehouses module (FR-SET-040 to FR-SET-046)
- **Default Behavior (Phase 1A)**: All users have access to all warehouses
- **Future Behavior (Phase 1B)**: User-specific warehouse restrictions enforced via RLS
- **Table**: user_warehouse_access (user_id, warehouse_id, access_level)
- **RLS Policy**: Users can only query data from warehouses in their user_warehouse_access records
- **Super Admin/Admin Bypass**: These roles bypass warehouse restrictions (access all)
- **UI Behavior**:
  - Phase 1A: Field visible, data saved, but not enforced
  - Phase 1B: Field visible, data saved AND enforced via RLS
- **Migration Path**: Existing users (created in Phase 1A) will need warehouse_access backfilled when Phase 1B is deployed

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
4. Warehouse access field must reference FR-SET-018 (User Warehouse Access Restrictions)
5. Zod schema: `lib/validation/user-schema.ts` (add language_preference field, warehouse_access array)
6. Service: `lib/services/user-service.ts` (add language_preference handling, user_warehouse_access CRUD)
7. Email uniqueness check: debounce 500ms on blur
8. Multi-select: use Popover + Checkbox from ShadCN
9. Toast notifications: use `toast()` from ShadCN
10. Language dropdown: position after Email field, before Role field
11. Default language: fetch from organization settings (org.default_language)
12. Ensure role enum values: SUPER_ADMIN, ADMIN, PRODUCTION_MANAGER, QUALITY_MANAGER, WAREHOUSE_MANAGER, PRODUCTION_OPERATOR, QUALITY_INSPECTOR, WAREHOUSE_OPERATOR, PLANNER, VIEWER
13. Ensure language enum values: PL, EN, DE, FR
14. Add help text below Preferred Language: "User interface language for this user"
15. Language preference is required field (marked with *)
16. Warehouse access validation: conditional based on role (super_admin/admin can skip)
17. Phase 1A implementation: Save warehouse_access data but do NOT enforce RLS yet
18. Phase 1B implementation: Enable RLS policies on warehouse-related tables based on user_warehouse_access

---

**Status**: Ready for user approval
**Approval Required**: Yes
**Iterations**: 2 of 3
**Last Updated**: 2025-12-15
**Compliance**: FR-SET-112 (User-level language preference), FR-SET-018 (User Warehouse Access Restrictions)
