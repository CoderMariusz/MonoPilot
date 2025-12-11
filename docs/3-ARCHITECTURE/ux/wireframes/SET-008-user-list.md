# SET-008: User List

**Module**: Settings
**Feature**: User Management
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management                      [+ Invite User]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search users...               ] [Filter: All ▼] [Sort: Name ▼]     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Name           Email                Role      Status   Actions │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ John Smith     john@acme.com        Admin     Active   [⋮]    │   │
│  │                Last login: 2 hours ago                         │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Jane Doe       jane@acme.com        Manager   Active   [⋮]    │   │
│  │                Last login: Yesterday                           │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Bob Wilson     bob@acme.com         Operator  Invited  [⋮]    │   │
│  │                Invited: 3 days ago • [Resend Invite]           │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Alice Chen     alice@acme.com       Viewer    Disabled [⋮]    │   │
│  │                Disabled: 2025-12-08 by John Smith              │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 4 of 4 users                              [1] [2] [3] [>]   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit User
  - Change Role
  - Disable User / Enable User
  - Resend Invite (if status: Invited)
  - View Activity Log
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management                      [+ Invite User]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Skeleton: Search bar...              ] [Filter ▼] [Sort ▼]         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]    │   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]    │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Loading users...                                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management                      [+ Invite User]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                          [👥 Icon]                                    │
│                                                                       │
│                      No Users Found                                   │
│                                                                       │
│       You haven't invited any users to your organization yet.         │
│       Start by inviting team members to collaborate.                  │
│                                                                       │
│                     [+ Invite Your First User]                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management                      [+ Invite User]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                          [⚠ Icon]                                     │
│                                                                       │
│                  Failed to Load Users                                 │
│                                                                       │
│       Unable to retrieve user list. Please check your connection.     │
│                   Error: USER_FETCH_FAILED                            │
│                                                                       │
│                        [Retry]  [Contact Support]                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Name, Email, Role (badge), Status (badge), Last Login, Actions menu
2. **Search/Filter Bar** - Text search (name/email), role filter, status filter, sort dropdown
3. **Invite User Button** - Primary CTA (top-right), opens invite modal
4. **Actions Menu ([⋮])** - Edit, Change Role, Disable/Enable, Resend Invite, Activity Log
5. **Status Badges** - Active (green), Invited (yellow), Disabled (gray)
6. **Role Badges** - Super Admin, Admin, Manager, Operator, Viewer (color-coded)
7. **Pagination** - Bottom-right, 20 users per page

---

## Main Actions

### Primary
- **[+ Invite User]** - Opens invite modal (email, role selection) → sends invitation
- **[Resend Invite]** - Inline link for invited users → re-sends invite email

### Secondary (Row Actions)
- **Edit User** - Opens edit modal (name, email)
- **Change Role** - Role dropdown → updates user role (Super Admin only)
- **Disable User** - Confirmation modal → sets status to 'disabled', user loses access
- **Enable User** - Re-activates disabled user → sets status to 'active'
- **View Activity Log** - Opens activity panel (logins, actions, changes)

### Filters/Search
- **Search** - Real-time filter by name or email
- **Filter by Role** - Dropdown (All, Admin, Manager, Operator, Viewer)
- **Filter by Status** - Dropdown (All, Active, Invited, Disabled)
- **Sort** - Name, Email, Role, Last Login (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading users..." text
- **Empty**: "No users found" illustration, "Invite Your First User" CTA
- **Error**: "Failed to load users" warning icon, Retry + Contact Support buttons
- **Success**: Table with user rows, search/filter controls, pagination if >20 users

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| name | string | Full name |
| email | string | Unique per org |
| role | enum | Super Admin, Admin, Manager, Operator, Viewer |
| status | enum | active, invited, disabled |
| last_login | timestamp | "2 hours ago", "Yesterday", "Never" |
| invited_at | timestamp | For status: invited |
| disabled_at | timestamp | For status: disabled |
| disabled_by | user_id | Who disabled the user |

---

## Permissions

| Role | Can View | Can Invite | Can Edit | Can Change Role | Can Disable |
|------|----------|------------|----------|-----------------|-------------|
| Super Admin | All | Yes | All | All | All |
| Admin | All | Yes | All | Admin & below | Admin & below |
| Manager | All | No | Self only | No | No |
| Operator | All | No | Self only | No | No |
| Viewer | All | No | Self only | No | No |

---

## Validation

- **Invite**: Email must be unique in organization, valid format, role required
- **Role Change**: Cannot demote self, cannot change Super Admin (unless you're Super Admin)
- **Disable**: Cannot disable self, cannot disable last Super Admin

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "User: {name}, {role}, {status}, Last login: {time}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu

---

## Related Screens

- **Invite User Modal**: Opens from [+ Invite User] button
- **Edit User Modal**: Opens from Actions menu → Edit User
- **Activity Log Panel**: Opens from Actions menu → View Activity Log

---

## Technical Notes

- **RLS**: Users see only users in their organization (`org_id` filter)
- **API**: `GET /api/settings/users?search={query}&role={role}&status={status}&page={N}`
- **Real-time**: Subscribe to user updates via Supabase Realtime (status changes, new invites)
- **Pagination**: 20 users per page, server-side pagination

---

**Status**: Ready for user approval
**Approval Required**: Yes
**Iterations**: 0 of 3
