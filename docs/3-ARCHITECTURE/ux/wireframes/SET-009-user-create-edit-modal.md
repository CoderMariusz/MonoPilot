# SET-009: User Create/Edit Modal

**Module**: Settings
**Feature**: User Management (Story 1.9)
**Type**: Modal Dialog
**Status**: Ready for Review
**Last Updated**: 2025-12-11

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
│  Role *                                          │
│  [Select role ▼]                                 │
│    - Super Admin                                 │
│    - Admin                                       │
│    - Manager                                     │
│    - Operator                                    │
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
│  Role *                                          │
│  [Manager ▼]                                     │
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
│  Role *                                          │
│  [Manager ▼]                                     │
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
- **Role**: Dropdown, required, 5 options (Super Admin, Admin, Manager, Operator, Viewer)
- **Warehouse Access**: Multi-select dropdown, required, min 1 selection
- **Active Toggle**: Checkbox, default OFF for create, preserves state for edit

### 2. Role Dropdown
- **Type**: Single-select dropdown
- **Options**: Super Admin, Admin, Manager, Operator, Viewer
- **Behavior**: Role determines default permissions (details in PRD 1.9)
- **Touch Target**: 48x48dp

### 3. Warehouse Access Multi-Select
- **Type**: Checkbox dropdown (remains open while selecting)
- **Counter**: Shows "X selected" badge
- **Validation**: Min 1 warehouse required
- **Behavior**: User can only access selected warehouses
- **Touch Target**: 48x48dp per checkbox

### 4. Active Toggle
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
  - Sends invitation email via Supabase Auth
  - Closes modal, shows toast: "User created. Invitation sent to {email}"
  - Refreshes user list table

- **Edit Mode**: "Save Changes" button
  - Validates all fields
  - Updates user record (preserves created_at, created_by)
  - If email changed: sends new invitation
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
| Role | Required, must be one of 5 valid roles |
| Warehouse Access | Required, min 1 warehouse selected |
| Active | Optional, boolean |

**Validation Timing**:
- On blur: Email uniqueness check (async)
- On submit: All fields validated before API call

---

## Accessibility

- **Touch Targets**: All inputs, dropdowns, buttons >= 48x48dp
- **Contrast**: Error text red (#DC2626) passes WCAG AA (4.5:1)
- **Screen Reader**: Announces "Create User Modal" on open, field labels, errors
- **Keyboard**: Tab navigation, Escape closes modal, Enter submits form
- **Focus**: First Name field auto-focused on modal open

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/users`
- **Update**: `PATCH /api/settings/users/:id`
- **Validation**: `GET /api/settings/users/validate-email?email={email}`

### Data Structure
```typescript
{
  first_name: string;
  last_name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
  warehouse_access: string[]; // array of warehouse IDs
  active: boolean;
  org_id: string; // auto-populated from session
}
```

### Role Permissions (Reference)
- **Super Admin**: Full access, manage billing
- **Admin**: Full access except billing
- **Manager**: View all, edit production/planning
- **Operator**: Execute production tasks, scan materials
- **Viewer**: Read-only access

---

## Related Screens

- **User List Table**: [SET-008-user-list.md] (parent screen)
- **User Invitation Email**: Sent via Supabase Auth after creation

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use ShadCN Dialog component for modal
2. Zod schema: `lib/validation/user-schema.ts`
3. Service: `lib/services/user-service.ts`
4. Email uniqueness check: debounce 500ms on blur
5. Multi-select: use Popover + Checkbox from ShadCN
6. Toast notifications: use `toast()` from ShadCN

---

**Status**: Ready for user approval
**Approval Required**: Yes
**Iterations**: 0 of 3
