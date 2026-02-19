# SET-011c: Permission Enforcement UI

**Module**: Global (all modules)
**Feature**: Role-Based Permissions (Story 01.6)
**Type**: UI Patterns & Components
**Status**: Auto-Approved
**Last Updated**: 2026-01-04
**Related**: SET-011a (Role Assignment), SET-011b (Permission Matrix)

---

## Overview

This wireframe defines UI patterns for permission enforcement across all modules. Shows how Create/Read/Update/Delete permissions control button visibility, action availability, and user feedback.

**Key Principle**: Hide or disable actions user cannot perform. Never show unusable UI.

---

## Pattern 1: Action Buttons Based on Permissions

### Pattern 1a: Full CRUD Access (Owner, Admin, Production Manager in Production)

```
┌─────────────────────────────────────────────────────────────────┐
│  Production > Work Orders                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [+ Create Work Order]  [Import]  [Export]  [⚙ Settings]       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ WO-001 | Bread Mix | Planned      [Edit] [Delete] [...]  │ │
│  │ WO-002 | Cake Mix  | In Progress  [Edit] [Delete] [...]  │ │
│  │ WO-003 | Cookie    | Completed    [Edit] [Delete] [...]  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

All buttons visible and enabled:
✓ Create button shown
✓ Edit button shown
✓ Delete button shown
✓ Import/Export available
```

### Pattern 1b: Read-Only Access (Viewer in Production)

```
┌─────────────────────────────────────────────────────────────────┐
│  Production > Work Orders                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Export]  [🔒 View-Only Mode]                                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ WO-001 | Bread Mix | Planned      [View]                  │ │
│  │ WO-002 | Cake Mix  | In Progress  [View]                  │ │
│  │ WO-003 | Cookie    | Completed    [View]                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Read-only mode:
✗ Create button hidden
✗ Edit button hidden → replaced with "View"
✗ Delete button hidden
✓ Export available (read operation)
✓ View-Only badge shown
```

### Pattern 1c: Create/Read/Update Access - No Delete (Production Operator)

```
┌─────────────────────────────────────────────────────────────────┐
│  Production > Work Orders                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [+ Create Work Order]  [Export]                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ WO-001 | Bread Mix | Planned      [Edit] [...]            │ │
│  │ WO-002 | Cake Mix  | In Progress  [Edit] [...]            │ │
│  │ WO-003 | Cookie    | Completed    [Edit] [...]            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

CRU mode:
✓ Create button shown
✓ Edit button shown
✗ Delete button hidden (no Delete permission)
✓ Export available
```

### Pattern 1d: No Access (Production Operator in Settings)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Users                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠ Access Denied                                                │
│                                                                 │
│  You do not have permission to access this module.              │
│  Your current role: Production Operator                         │
│                                                                 │
│  Required permission: Settings (at least Read)                  │
│  Your permission: None                                          │
│                                                                 │
│  Contact your administrator if you need access.                 │
│                                                                 │
│  [← Back to Dashboard]  [Contact Admin]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

No access:
✗ Entire module inaccessible
✗ Redirect to access denied page
✓ Clear explanation of required permission
✓ Current role displayed
✓ Action to contact admin
```

---

## Pattern 2: Form Actions Based on Permissions

### Pattern 2a: Create Form - Has Create Permission

```
┌──────────────────────────────────────────────────┐
│  Create Work Order                        [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Product *                                       │
│  [Select product ▼]                              │
│                                                  │
│  Quantity *                                      │
│  [_______] kg                                    │
│                                                  │
│  Planned Start Date *                            │
│  [2026-01-05 ▼]                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                        [Create]        │
└──────────────────────────────────────────────────┘

Create permission exists:
✓ Form accessible
✓ All fields editable
✓ Create button enabled
```

### Pattern 2b: Create Form - No Create Permission (Direct URL Access)

```
┌──────────────────────────────────────────────────┐
│  Create Work Order                        [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠ Permission Denied                             │
│                                                  │
│  You do not have permission to create work       │
│  orders.                                         │
│                                                  │
│  Your current role: Viewer                       │
│  Required permission: Production (Create)        │
│                                                  │
│  [← Back to Work Orders]                         │
│                                                  │
└──────────────────────────────────────────────────┘

No create permission:
✗ Form not rendered
✗ Shows permission error instead
✓ Redirect option provided
```

### Pattern 2c: Edit Form - Read-Only Access

```
┌──────────────────────────────────────────────────┐
│  View Work Order: WO-001              [X]        │
├──────────────────────────────────────────────────┤
│                                                  │
│  🔒 Read-Only: You can view but not edit         │
│                                                  │
│  Product                                         │
│  Bread Mix (read-only)                           │
│                                                  │
│  Quantity                                        │
│  500 kg (read-only)                              │
│                                                  │
│  Planned Start Date                              │
│  2026-01-05 (read-only)                          │
│                                                  │
├──────────────────────────────────────────────────┤
│                                [Close]           │
└──────────────────────────────────────────────────┘

Read-only access:
✗ Edit button not shown (replaced with "View")
✗ Form fields disabled/read-only
✗ Save/Update button hidden
✓ Close button shown
✓ Read-only badge at top
```

### Pattern 2d: Edit Form - Has Update Permission

```
┌──────────────────────────────────────────────────┐
│  Edit Work Order: WO-001              [X]        │
├──────────────────────────────────────────────────┤
│                                                  │
│  Product *                                       │
│  [Bread Mix ▼]                                   │
│                                                  │
│  Quantity *                                      │
│  [500_____] kg                                   │
│                                                  │
│  Planned Start Date *                            │
│  [2026-01-05 ▼]                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancel]                        [Save Changes]  │
└──────────────────────────────────────────────────┘

Update permission exists:
✓ Form accessible
✓ All fields editable
✓ Save Changes button enabled
```

---

## Pattern 3: Inline Actions in Tables

### Pattern 3a: Full CRUD - All Actions Visible

```
┌─────────────────────────────────────────────────────────────────┐
│  ID     │ Product   │ Status      │ Actions                     │
├─────────────────────────────────────────────────────────────────┤
│ WO-001  │ Bread Mix │ Planned     │ [View] [Edit] [Delete] [...] │
│ WO-002  │ Cake Mix  │ In Progress │ [View] [Edit] [Delete] [...] │
│ WO-003  │ Cookie    │ Completed   │ [View] [Edit] [Delete] [...] │
└─────────────────────────────────────────────────────────────────┘

Full CRUD:
✓ View action
✓ Edit action
✓ Delete action
✓ More actions menu (...)
```

### Pattern 3b: Read-Only - Only View Action

```
┌─────────────────────────────────────────────────────────────────┐
│  ID     │ Product   │ Status      │ Actions                     │
├─────────────────────────────────────────────────────────────────┤
│ WO-001  │ Bread Mix │ Planned     │ [View]                      │
│ WO-002  │ Cake Mix  │ In Progress │ [View]                      │
│ WO-003  │ Cookie    │ Completed   │ [View]                      │
└─────────────────────────────────────────────────────────────────┘

Read-only:
✓ View action
✗ Edit action hidden
✗ Delete action hidden
✗ More actions menu hidden (no actions available)
```

### Pattern 3c: CRU - No Delete

```
┌─────────────────────────────────────────────────────────────────┐
│  ID     │ Product   │ Status      │ Actions                     │
├─────────────────────────────────────────────────────────────────┤
│ WO-001  │ Bread Mix │ Planned     │ [View] [Edit] [...]         │
│ WO-002  │ Cake Mix  │ In Progress │ [View] [Edit] [...]         │
│ WO-003  │ Cookie    │ Completed   │ [View] [Edit] [...]         │
└─────────────────────────────────────────────────────────────────┘

CRU (no delete):
✓ View action
✓ Edit action
✗ Delete action hidden
✓ More actions menu (may have other actions)
```

---

## Pattern 4: Permission Indicators

### Pattern 4a: Role Badge in User Profile

```
┌──────────────────────────────────────────────────┐
│  Profile > John Doe                              │
├──────────────────────────────────────────────────┤
│                                                  │
│  Name: John Doe                                  │
│  Email: john.doe@acme.com                        │
│                                                  │
│  Role: [Production Operator]                     │
│        └─ Badge with teal background             │
│                                                  │
│  Permissions:                                    │
│  ✓ Production: Create, Read, Update              │
│  ✓ Quality: Create, Read                         │
│  ✓ Technical: Read                               │
│  ✗ Settings: No access                           │
│                                                  │
│  [View Full Permissions →]                       │
│                                                  │
└──────────────────────────────────────────────────┘

Role badge:
- Color-coded by role type
- Shows role display name
- Clickable to view full permissions
```

### Pattern 4b: Module Access Indicator in Navigation

```
┌─────────────────────────────────┐
│  MonoPilot                      │
├─────────────────────────────────┤
│  Dashboard                      │
│  ✓ Production                   │  ← Full access (green check)
│  ✓ Planning                     │  ← Full access
│  ⚙ Quality                      │  ← Partial access (gear icon)
│  👁 Technical                    │  ← Read-only (eye icon)
│  🔒 Settings                     │  ← No access (locked, grayed)
│  🔒 Warehouse                    │  ← No access
│                                 │
└─────────────────────────────────┘

Navigation icons:
✓ Green check = Full CRUD
⚙ Gear = Partial (CRU, RU, CR)
👁 Eye = Read-only
🔒 Lock = No access (grayed out)
```

### Pattern 4c: Permission Warning Banner

```
┌─────────────────────────────────────────────────────────────────┐
│  Production > Work Orders                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠ Limited Access: You can view and update work orders, but    │
│     cannot create new ones or delete existing ones.            │
│     Current role: Quality Manager                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ WO-001 | Bread Mix | Planned      [View] [Edit]          │ │
│  │ WO-002 | Cake Mix  | In Progress  [View] [Edit]          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Warning banner:
- Shows when user has partial access (not full CRUD, not read-only)
- Explains exactly what user can/cannot do
- Displays current role
- Dismissible (optional)
```

---

## Pattern 5: Permission-Based API Errors

### Pattern 5a: 403 Forbidden - Clear Error Message

```
┌──────────────────────────────────────────────────┐
│  Delete Work Order                        [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠ Permission Denied                             │
│                                                  │
│  You do not have permission to delete work       │
│  orders.                                         │
│                                                  │
│  Your current role: Production Operator          │
│  Required permission: Production (Delete)        │
│                                                  │
│  If you believe this is an error, please         │
│  contact your administrator.                     │
│                                                  │
│  [Close]  [Contact Admin]                        │
│                                                  │
└──────────────────────────────────────────────────┘

Error details:
- Clear explanation of what was attempted
- Shows user's current role
- Shows required permission
- Provides action (contact admin)
```

### Pattern 5b: Toast Notification - Permission Error

```
Toast notification (top-right):
┌────────────────────────────────────────┐
│ ✗ Action Failed                        │
│ You do not have permission to delete   │
│ this item. Contact your administrator. │
│                                        │
│ [Dismiss]                              │
└────────────────────────────────────────┘

Toast for quick feedback:
- Shows when API returns 403
- Brief explanation
- Auto-dismisses after 5 seconds
- User can manually dismiss
```

---

## Pattern 6: Bulk Actions Based on Permissions

### Pattern 6a: Bulk Actions - Full CRUD

```
┌─────────────────────────────────────────────────────────────────┐
│  Production > Work Orders                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [☐ Select All]  Bulk Actions: [Edit Status ▼] [Delete ▼]      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑ WO-001 | Bread Mix | Planned                            │ │
│  │ ☑ WO-002 | Cake Mix  | In Progress                        │ │
│  │ ☐ WO-003 | Cookie    | Completed                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  2 items selected: [Edit Status] [Delete Selected] [Export]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Full CRUD bulk actions:
✓ Edit Status (Update permission)
✓ Delete Selected (Delete permission)
✓ Export (Read permission)
```

### Pattern 6b: Bulk Actions - Read-Only

```
┌─────────────────────────────────────────────────────────────────┐
│  Production > Work Orders                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [☐ Select All]  Bulk Actions: [Export ▼]                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑ WO-001 | Bread Mix | Planned                            │ │
│  │ ☑ WO-002 | Cake Mix  | In Progress                        │ │
│  │ ☐ WO-003 | Cookie    | Completed                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  2 items selected: [Export]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Read-only bulk actions:
✗ Edit Status hidden
✗ Delete Selected hidden
✓ Export only available action
```

---

## Pattern 7: Permission Changes - Real-Time Updates

### Pattern 7a: Permission Upgraded - New Actions Appear

```
Before role change (Viewer → Admin):
┌─────────────────────────────────────────────────┐
│  Work Orders                                    │
│  [Export]  [🔒 View-Only Mode]                  │
└─────────────────────────────────────────────────┘

After role change (within 1 minute):
┌─────────────────────────────────────────────────┐
│  Work Orders                                    │
│  [+ Create Work Order]  [Import]  [Export]      │
│                                                 │
│  Toast: ✓ Permissions updated                  │
│         You now have full access to Production  │
└─────────────────────────────────────────────────┘

Real-time update:
- New buttons appear
- View-Only badge removed
- Toast notification confirms change
```

### Pattern 7b: Permission Downgraded - Actions Disabled

```
Before role change (Admin → Viewer):
┌─────────────────────────────────────────────────┐
│  Work Orders                                    │
│  [+ Create] [Import] [Export]  [Edit] [Delete]  │
└─────────────────────────────────────────────────┘

After role change (within 1 minute):
┌─────────────────────────────────────────────────┐
│  Work Orders                                    │
│  [Export]  [🔒 View-Only Mode]                  │
│                                                 │
│  Toast: ⚠ Permissions reduced                  │
│         Your role changed to Viewer (read-only) │
└─────────────────────────────────────────────────┘

Real-time downgrade:
- Create/Edit/Delete buttons disappear
- View-Only badge appears
- Toast notification warns of change
- Open modals close (if editing)
```

---

## Component Specifications

### Component 1: PermissionButton

```tsx
interface PermissionButtonProps {
  module: string; // 'production', 'quality', etc.
  action: 'C' | 'R' | 'U' | 'D';
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

<PermissionButton module="production" action="C" onClick={handleCreate}>
  Create Work Order
</PermissionButton>

// Automatically hides if user lacks permission
// Uses usePermissions hook internally
```

### Component 2: PermissionGuard

```tsx
interface PermissionGuardProps {
  module: string;
  action: 'C' | 'R' | 'U' | 'D';
  children: React.ReactNode;
  fallback?: React.ReactNode; // Optional fallback UI
}

<PermissionGuard module="production" action="U">
  <EditButton />
</PermissionGuard>

// Renders children only if user has permission
// Renders fallback (or null) if no permission
```

### Component 3: RoleBadge

```tsx
interface RoleBadgeProps {
  roleCode: string; // 'owner', 'admin', 'production_manager', etc.
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean; // If true, clickable to view permissions
}

<RoleBadge roleCode="production_manager" size="md" interactive />

// Color-coded badge showing role display name
// If interactive, opens permission matrix on click
```

### Component 4: AccessDeniedPage

```tsx
interface AccessDeniedPageProps {
  module: string;
  currentRole: string;
  requiredPermission: string;
}

<AccessDeniedPage
  module="Settings"
  currentRole="Production Operator"
  requiredPermission="Settings (Read)"
/>

// Full-page access denied message
// Shows module, current role, required permission
// Provides contact admin and back buttons
```

### Component 5: PermissionBanner

```tsx
interface PermissionBannerProps {
  module: string;
  currentPermissions: string; // e.g., "RU", "R", "CRU"
  dismissible?: boolean;
}

<PermissionBanner
  module="Production"
  currentPermissions="RU"
  dismissible
/>

// Warning banner for partial access
// Explains what user can/cannot do
// Dismissible option
```

---

## Accessibility

- **Button States**: Disabled buttons have `aria-disabled="true"`, reduced opacity (0.5)
- **Hidden Actions**: Use `display: none` for hidden buttons (not just `visibility: hidden`)
- **Focus Management**: When permission changes, refocus on safe element (not deleted button)
- **Screen Reader**: Announce permission changes via `aria-live` region
  - "Permissions updated. You now have full access to Production module."
  - "Permissions reduced. You now have read-only access to Production module."
- **Keyboard**: All visible actions keyboard-accessible (Tab, Enter/Space)
- **Error Messages**: Use `role="alert"` for permission errors

---

## Business Rules

1. **Hide vs Disable**: Hide unavailable actions (don't disable). Exception: Forms in progress may show disabled fields.
2. **Real-Time Updates**: Permission changes take effect within 1 minute (cache TTL)
3. **API Enforcement**: All API endpoints enforce permissions server-side (never trust client)
4. **Graceful Degradation**: If permission check fails, default to read-only mode
5. **Audit**: All permission denials logged in audit_logs table
6. **Multi-Device**: Permission changes apply across all user sessions/devices
7. **No Partial Save**: If user loses Update permission mid-edit, form becomes read-only (save disabled)

---

## Technical Notes

### usePermissions Hook

```typescript
function usePermissions() {
  const { user } = useAuth();
  const { data: permissions } = useQuery(['permissions', user.id], fetchPermissions);

  const can = (module: string, action: 'C' | 'R' | 'U' | 'D') => {
    const modulePerms = permissions?.[module];
    if (!modulePerms || modulePerms === '-') return false;
    return modulePerms.includes(action);
  };

  const canAny = (module: string) => {
    const modulePerms = permissions?.[module];
    return modulePerms && modulePerms !== '-';
  };

  const isReadOnly = (module: string) => {
    return permissions?.[module] === 'R';
  };

  return { can, canAny, isReadOnly, role: user.role };
}

// Usage
const { can, isReadOnly } = usePermissions();

{can('production', 'C') && <CreateButton />}
{can('production', 'U') && <EditButton />}
{can('production', 'D') && <DeleteButton />}
{isReadOnly('production') && <ViewOnlyBadge />}
```

### Backend Permission Middleware

```typescript
// API route example
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req);

  // Check permission
  if (!hasPermission(user, 'production', 'D')) {
    return Response.json(
      {
        error: 'Permission denied',
        message: 'You do not have permission to delete work orders',
        currentRole: user.role,
        requiredPermission: 'Production (Delete)',
      },
      { status: 403 }
    );
  }

  // Proceed with deletion
  await deleteWorkOrder(params.id);
  return Response.json({ success: true });
}
```

### Permission Cache Invalidation

```typescript
// When user role changes
async function updateUserRole(userId: string, newRoleId: string) {
  // Update database
  await db.users.update({ id: userId, role_id: newRoleId });

  // Invalidate permission cache
  await redis.del(`permissions:${userId}`);

  // Broadcast to all user sessions
  await pusher.trigger(`user-${userId}`, 'permissions-updated', {
    newRole: newRoleId,
    timestamp: new Date().toISOString(),
  });

  // Terminate all sessions (security - optional)
  await terminateUserSessions(userId);

  return { success: true };
}
```

---

## Related Wireframes

- **SET-011a**: Role Assignment Workflow
- **SET-011b**: Permission Matrix Modal
- **SET-008**: User List (shows role badges)
- All module wireframes (apply these patterns)

---

## Acceptance Checklist

- [ ] Create button shown only if user has Create permission
- [ ] Edit button shown only if user has Update permission
- [ ] Delete button shown only if user has Delete permission
- [ ] Read-only mode activates if user has only Read permission
- [ ] Access denied page shows if user has no module access
- [ ] Role badge displays in user profile with correct color
- [ ] Navigation shows access indicators (check/eye/lock icons)
- [ ] Permission warning banner shows for partial access
- [ ] 403 errors show clear permission denied message
- [ ] Toast notifications appear for permission errors
- [ ] Bulk actions filter by available permissions
- [ ] Permission changes update UI within 1 minute
- [ ] Permission upgrade shows toast and new actions
- [ ] Permission downgrade shows warning and hides actions
- [ ] All permission checks enforced server-side (API)
- [ ] Hidden actions use display:none (not visibility:hidden)
- [ ] Screen reader announces permission changes
- [ ] Keyboard navigation works for all visible actions
- [ ] PermissionButton component hides if no permission
- [ ] PermissionGuard component renders children conditionally
- [ ] RoleBadge component shows correct role name and color
- [ ] AccessDeniedPage shows module and required permission
- [ ] PermissionBanner explains partial access clearly

---

**Approval Status**: Auto-Approved
**Phase**: P1 (UX Design Complete)
**Next Phase**: P2 (Test Writing - RED)
