# SET-011a: Role Assignment Workflow

**Module**: Settings
**Feature**: Role-Based Permissions (Story 01.6)
**Type**: User Modal Enhancement
**Status**: Auto-Approved
**Last Updated**: 2026-01-04
**Related**: SET-009 (User Create/Edit Modal), SET-011 (Roles & Permissions View)

---

## Overview

This wireframe extends SET-009 (User Create/Edit Modal) to detail the role assignment workflow with permission validation, role restrictions, and visual feedback for permission changes.

---

## ASCII Wireframe

### Success State - Role Selection (Owner User)

```
┌──────────────────────────────────────────────────────────┐
│  Create New User                                  [X]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  First Name *                                            │
│  [Anna Maria__________]                                  │
│                                                          │
│  Last Name *                                             │
│  [Kowalska____________]                                  │
│                                                          │
│  Email *                                                 │
│  [anna.kowalska@acme.com]                                │
│                                                          │
│  Role * (hover)                                          │
│  [Select role ▼]                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Owner                                     [i]    │   │
│  │ Administrator                             [i]    │   │
│  │ Production Manager                        [i]    │   │
│  │ Quality Manager                           [i]    │   │
│  │ Warehouse Manager                         [i]    │   │
│  │ Production Operator                       [i]    │   │
│  │ Quality Inspector                         [i]    │   │
│  │ Warehouse Operator                        [i]    │   │
│  │ Planner                                   [i]    │   │
│  │ Viewer                                    [i]    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [View Full Permission Matrix →]                         │
│                                                          │
│  ☐ Active (user can log in)                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Cancel]                              [Create User]     │
└──────────────────────────────────────────────────────────┘
```

### Role Info Tooltip (Hover on [i] icon)

```
┌──────────────────────────────────────────────────────┐
│ Production Manager                                   │
├──────────────────────────────────────────────────────┤
│ Full access to Production, Planning, and Quality     │
│                                                      │
│ Primary Permissions:                                 │
│ • Production: Full CRUD                              │
│ • Planning: Full CRUD                                │
│ • Quality: Full CRUD                                 │
│ • Technical: Read + Update                           │
│ • OEE: Full CRUD                                     │
│                                                      │
│ Restricted:                                          │
│ • Settings: Read-only                                │
│ • User Management: Read-only                         │
│                                                      │
│ [View Full Permissions →]                            │
└──────────────────────────────────────────────────────┘
```

### Success State - Role Selected with Permission Preview

```
┌──────────────────────────────────────────────────────────┐
│  Create New User                                  [X]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  First Name *                                            │
│  [Anna Maria__________]                                  │
│                                                          │
│  Last Name *                                             │
│  [Kowalska____________]                                  │
│                                                          │
│  Email *                                                 │
│  [anna.kowalska@acme.com]                                │
│                                                          │
│  Role *                                                  │
│  [Production Manager ▼]                          [i]     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📋 Assigned Permissions:                           │ │
│  │                                                    │ │
│  │ Full Access (CRUD):                                │ │
│  │ ✓ Production  ✓ Planning  ✓ Quality  ✓ OEE        │ │
│  │                                                    │ │
│  │ Modify Access (RU):                                │ │
│  │ ✓ Technical  ✓ Warehouse                           │ │
│  │                                                    │ │
│  │ Read-Only:                                         │ │
│  │ ✓ Settings  ✓ Users  ✓ Shipping  ✓ Finance        │ │
│  │                                                    │ │
│  │ No Access:                                         │ │
│  │ NPD  Integrations                                  │ │
│  │                                                    │ │
│  │ [View Permission Matrix →]                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ☑ Active (user can log in)                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Cancel]                              [Create User]     │
└──────────────────────────────────────────────────────────┘
```

### Error State - Non-Owner Attempting Owner Assignment

```
┌──────────────────────────────────────────────────────────┐
│  Edit User: Jan Nowak                             [X]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ⚠ Permission Error                                     │
│  Only users with Owner role can assign Owner role to    │
│  other users. Your current role: Administrator          │
│                                                          │
│  First Name *                                            │
│  [Jan_________________]                                  │
│                                                          │
│  Last Name *                                             │
│  [Nowak_______________]                                  │
│                                                          │
│  Email *                                                 │
│  [jan.nowak@acme.com__]                                  │
│                                                          │
│  Role *                                                  │
│  [Owner ▼]  ⚠ Cannot assign this role                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Owner (disabled)                          [🔒]   │   │
│  │ Administrator                             [i]    │   │
│  │ Production Manager                        [i]    │   │
│  │ Quality Manager                           [i]    │   │
│  │ ...                                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ☑ Active (user can log in)                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Cancel]                              [Save Changes]    │
└──────────────────────────────────────────────────────────┘
```

### Success State - Role Change Confirmation

```
┌──────────────────────────────────────────────────────────┐
│  Confirm Role Change                              [X]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  You are changing the role for Jan Nowak from:          │
│                                                          │
│  Current:  Viewer (Read-only all modules)               │
│  New:      Administrator (Full CRUD access)             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ⚠ Permission Changes:                              │ │
│  │                                                    │ │
│  │ Gaining Access:                                    │ │
│  │ ✓ Create, Update, Delete in all modules           │ │
│  │ ✓ User management (except Owner assignment)       │ │
│  │ ✓ Organization settings modification              │ │
│  │ ✓ Integration and API configuration               │ │
│  │                                                    │ │
│  │ Effective Immediately:                             │ │
│  │ Changes take effect on user's next request        │ │
│  │ (within 1 minute due to cache)                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ☐ Send notification email to user                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Cancel]                              [Confirm Change]  │
└──────────────────────────────────────────────────────────┘
```

### Mobile View (< 768px) - Role Selection

```
┌──────────────────────────────┐
│  < Create User               │
├──────────────────────────────┤
│                              │
│  First Name *                │
│  [Anna Maria__________]      │
│                              │
│  Last Name *                 │
│  [Kowalska____________]      │
│                              │
│  Email *                     │
│  [anna.k@acme.com____]       │
│                              │
│  Role *                      │
│  [Production Manager ▼]      │
│                              │
│  Permissions Summary:        │
│  ┌──────────────────────┐   │
│  │ Full Access:         │   │
│  │ • Production         │   │
│  │ • Planning           │   │
│  │ • Quality            │   │
│  │                      │   │
│  │ Modify:              │   │
│  │ • Technical          │   │
│  │                      │   │
│  │ Read-Only:           │   │
│  │ • Settings           │   │
│  │ • 3 more...          │   │
│  │                      │   │
│  │ [View All →]         │   │
│  └──────────────────────┘   │
│                              │
│  ☑ Active                    │
│                              │
├──────────────────────────────┤
│  [Cancel]      [Create]      │
└──────────────────────────────┘
```

---

## Key Components

1. **Role Dropdown** - 10 predefined roles with display names
2. **Role Info Icon [i]** - Tooltip on hover showing quick permission summary
3. **Permission Preview Panel** - Collapsible section showing assigned permissions by access level
4. **View Permission Matrix Link** - Opens full matrix modal (SET-011b)
5. **Role Restriction Indicator** - Shows disabled/locked roles user cannot assign
6. **Change Confirmation Modal** - Appears when changing existing user's role
7. **Permission Change Summary** - Shows gained/lost permissions on role change
8. **Notification Checkbox** - Option to email user about role change

---

## User Flows

### Flow 1: Creating New User with Role Assignment

```
1. Admin clicks "Create User" from user list
2. Modal opens (SET-009)
3. Admin fills name, email
4. Admin clicks "Role *" dropdown
5. Dropdown shows 10 roles with info icons
6. Admin hovers over role → Tooltip shows permission summary
7. Admin selects "Production Manager"
8. Permission preview panel expands automatically
9. Admin reviews permissions
10. Admin clicks "Create User"
11. User created with assigned role
```

### Flow 2: Changing User Role (Permission Elevation)

```
1. Admin clicks "Edit" on existing user (Viewer role)
2. Edit modal opens with current data
3. Admin changes role from "Viewer" to "Administrator"
4. Confirmation modal appears showing permission changes
5. Admin reviews gained permissions
6. Admin optionally checks "Send notification email"
7. Admin clicks "Confirm Change"
8. Role updated, permissions active within 1 minute
9. Success toast: "Role updated to Administrator"
10. User list refreshes showing new role
```

### Flow 3: Non-Owner Attempting Owner Assignment (Error)

```
1. Admin (non-owner) clicks "Edit" on user
2. Edit modal opens
3. Admin selects "Owner" from dropdown
4. Error message appears immediately
5. "Owner" option becomes disabled/grayed
6. Dropdown reverts to previous selection
7. Error persists until valid role selected
8. Admin selects valid role (e.g., "Administrator")
9. Error clears, form becomes valid
10. Admin can proceed with save
```

### Flow 4: Viewing Full Permission Matrix from Modal

```
1. User in Create/Edit modal
2. User clicks "View Permission Matrix →" link
3. Full matrix modal opens (SET-011b) as overlay
4. User reviews complete role-permission table
5. User closes matrix modal
6. Returns to Create/Edit modal (state preserved)
7. User completes role assignment
```

---

## States

### Loading State

```
┌──────────────────────────────────────────────────┐
│  Create New User                          [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Skeleton: Name field]                          │
│  [Skeleton: Email field]                         │
│  [Skeleton: Role dropdown]                       │
│                                                  │
│  Loading role definitions...                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Empty State (No Roles - Critical Error)

```
┌──────────────────────────────────────────────────┐
│  Create New User                          [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│              [⚠ Icon]                            │
│                                                  │
│         No Roles Available                       │
│                                                  │
│  System roles are not configured. Please         │
│  contact technical support.                      │
│                                                  │
│         [Contact Support]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Error State - Role Assignment Failed

```
┌──────────────────────────────────────────────────┐
│  Create New User                          [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠ Error: Failed to assign role                 │
│  Unable to create user with Administrator role.  │
│  Error: ROLE_ASSIGNMENT_FAILED                   │
│                                                  │
│  First Name *                                    │
│  [Anna Maria__________]                          │
│                                                  │
│  Last Name *                                     │
│  [Kowalska____________]                          │
│                                                  │
│  Email *                                         │
│  [anna.kowalska@acme.com]                        │
│                                                  │
│  Role *                                          │
│  [Administrator ▼]                               │
│                                                  │
│  ☑ Active                                        │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]  [Retry]              [Create User]    │
└──────────────────────────────────────────────────┘
```

### Success State - Role Assignment Complete

```
Toast notification (top-right):
┌────────────────────────────────────────┐
│ ✓ User created successfully            │
│ Anna Kowalska assigned Production      │
│ Manager role. Invitation email sent.   │
└────────────────────────────────────────┘
```

---

## Interactions

### Role Dropdown Behavior

- **Default**: Shows "Select role ▼" placeholder
- **On Click**: Expands to show all 10 roles
- **Disabled Roles**: Grayed out with lock icon if user lacks permission to assign
- **Role Display**: Show full name (not code): "Production Manager" not "production_manager"
- **Search**: Type-ahead filter (optional, Phase 1B)

### Info Icon [i] Behavior

- **Default**: Light gray icon next to role name
- **On Hover**: Tooltip appears showing permission summary
- **On Click**: Opens full permission matrix modal (SET-011b)
- **Position**: Right-aligned in dropdown, left-aligned in tooltip

### Permission Preview Panel

- **Trigger**: Automatically expands when role selected
- **Collapsible**: User can collapse/expand via toggle
- **Grouped**: Permissions grouped by access level (CRUD, RU, R, None)
- **Visual**: Color-coded badges (green=full, blue=modify, gray=read, red=none)

### View Permission Matrix Link

- **Trigger**: Click opens modal overlay
- **Modal**: SET-011b (Permission Matrix Modal) - see separate wireframe
- **Context**: Highlights selected role in matrix
- **Return**: Closes modal, preserves form state

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Role | Required | "Role is required" |
| Role | Must be one of 10 predefined | "Invalid role selected" |
| Role (Owner) | Only Owner can assign | "Only users with Owner role can assign Owner role" |
| Role (Last Owner) | Cannot remove last owner | "Cannot change role: You are the only Owner" |
| Role Change | Confirmation required | (Shows confirmation modal) |

---

## Accessibility

- **ARIA Labels**: Role dropdown has `aria-label="Select user role"`, `aria-required="true"`
- **Keyboard Navigation**:
  - Tab to role dropdown
  - Space/Enter to open
  - Arrow keys to navigate roles
  - Enter to select
  - Escape to close
- **Screen Reader**:
  - Announces role name and description on focus
  - Announces "disabled" for locked roles
  - Reads permission summary when role selected
- **Touch Targets**: Dropdown ≥ 48x48dp, info icons ≥ 32x32dp
- **Contrast**:
  - Text: 4.5:1 minimum (WCAG AA)
  - Icons: 3:1 minimum
  - Disabled text: 3:1 minimum

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full modal width (600px), permission preview side-by-side |
| Tablet (768-1024px) | Modal width (480px), permission preview stacked |
| Mobile (<768px) | Full-screen modal, compact permission summary, expandable |

---

## Business Rules

1. **Owner Assignment**: Only users with `owner` role can assign `owner` role to others
2. **Last Owner Protection**: Cannot change role of last remaining owner
3. **Immediate Effect**: Role changes take effect within 1 minute (cache TTL)
4. **Permission Inheritance**: Roles are immutable, permissions defined in `roles` table
5. **Audit Trail**: All role assignments/changes logged in `audit_logs` table
6. **Notification**: Optional email notification on role change
7. **Multi-device**: Role change terminates all active sessions (security)

---

## Technical Notes

### Role Data Structure

```typescript
interface Role {
  id: string; // UUID
  code: 'owner' | 'admin' | 'production_manager' | ... ; // 10 roles
  name: string; // Display name
  description: string;
  permissions: {
    [module: string]: 'CRUD' | 'CRU' | 'RU' | 'R' | '-';
  };
  is_system: boolean; // true for all 10 predefined roles
  display_order: number;
}
```

### API Endpoints

- **GET** `/api/settings/roles` - Fetch all 10 roles
- **POST** `/api/settings/users` - Create user with role (body includes `role_id`)
- **PUT** `/api/settings/users/:id/role` - Update user role
- **GET** `/api/settings/users/:id/permissions` - Get user's effective permissions

### Frontend Hook

```typescript
const { roles, loading, error } = useRoles();
const { canAssignRole } = usePermissions();

// Usage
{roles.map(role => (
  <option
    value={role.id}
    disabled={!canAssignRole(role.code)}
  >
    {role.name}
  </option>
))}
```

### Permission Check

```typescript
// Backend middleware
async function requireRoleAssignment(req: Request, targetRoleCode: string) {
  const user = await getAuthUser(req);

  if (targetRoleCode === 'owner' && user.role_code !== 'owner') {
    throw new ForbiddenError('Only owner can assign owner role');
  }

  // Allow if user has users:U permission
  if (!hasPermission(user, 'users', 'U')) {
    throw new ForbiddenError('Insufficient permissions');
  }
}
```

---

## Related Wireframes

- **SET-009**: User Create/Edit Modal (base modal)
- **SET-011**: Roles & Permissions View (permission matrix reference)
- **SET-011b**: Permission Matrix Modal (full matrix overlay)
- **SET-008**: User List (shows assigned roles in table)

---

## Acceptance Checklist

- [ ] Role dropdown displays exactly 10 predefined roles
- [ ] Role names display as full names (not codes)
- [ ] Info icon [i] shows permission summary on hover
- [ ] Permission preview panel expands when role selected
- [ ] "View Permission Matrix →" opens SET-011b modal
- [ ] Owner role disabled for non-owner users
- [ ] Cannot remove role from last owner (validation error)
- [ ] Role change shows confirmation modal with permission diff
- [ ] Optional email notification checkbox functional
- [ ] Role changes effective within 1 minute
- [ ] All role assignments logged in audit_logs
- [ ] Keyboard navigation fully functional
- [ ] Screen reader announces role names and permissions
- [ ] Touch targets meet 48x48dp minimum
- [ ] Responsive design works on mobile/tablet/desktop

---

**Approval Status**: Auto-Approved
**Phase**: P1 (UX Design Complete)
**Next Phase**: P2 (Test Writing - RED)
