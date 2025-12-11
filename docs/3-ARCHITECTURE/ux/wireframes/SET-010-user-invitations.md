# SET-010: User Invitations

**Module**: Settings
**Feature**: User Management
**Status**: Auto-Approved
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management > Pending Invitations  [+ Invite User]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search email...           ] [Filter: All ▼] [Sort: Sent Date ▼]    │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Email              Role      Invited By    Sent      Expires   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ bob@acme.com       Operator  John Smith    3d ago    4d left   │   │
│  │ [PENDING]                               [Resend] [Revoke]      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ mary@acme.com      Manager   Jane Doe      1w ago    Expired   │   │
│  │ [EXPIRED]                                          [Revoke]    │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ frank@acme.com     Viewer    John Smith    2d ago    5d left   │   │
│  │ [PENDING]                               [Resend] [Revoke]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 3 of 3 pending invitations                  [1] [2] [>]     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management > Pending Invitations  [+ Invite User]   │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░░░] [Filter ▼] [Sort ▼]                        │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading invitations...                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management > Pending Invitations  [+ Invite User]   │
├─────────────────────────────────────────────────────────────────────┤
│                         [📧 Icon]                                     │
│                   No Pending Invitations                              │
│          All invitations have been accepted or expired.               │
│                   [+ Invite New User]                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > User Management > Pending Invitations  [+ Invite User]   │
├─────────────────────────────────────────────────────────────────────┤
│                         [⚠ Icon]                                      │
│                Failed to Load Invitations                             │
│      Unable to retrieve invitations. Check your connection.          │
│                Error: INVITATION_FETCH_FAILED                         │
│                   [Retry]  [Contact Support]                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Email, Role (badge), Invited By, Sent Date, Expires, Status (badge), Actions
2. **Search Bar** - Text search by email
3. **Filter Dropdown** - All, Pending, Expired
4. **Sort Dropdown** - Sent Date, Expiration Date, Role
5. **Status Badges** - Pending (yellow), Expired (red)
6. **Action Buttons** - Resend (inline), Revoke (inline)
7. **Pagination** - 20 invitations per page

---

## Main Actions

### Primary
- **[+ Invite User]** - Opens invite modal (from SET-009)
- **[Resend]** - Re-sends invitation email → toast confirmation
- **[Revoke]** - Cancels invitation → confirmation modal → removes from list

### Filters/Search
- **Search** - Real-time filter by email
- **Filter by Status** - All, Pending, Expired
- **Sort** - Sent Date (default), Expiration Date, Role

---

## States

- **Loading**: Skeleton rows, "Loading invitations..." text
- **Empty**: "No pending invitations" icon, "Invite New User" CTA
- **Error**: "Failed to load invitations" warning, Retry + Contact Support
- **Success**: Table with invitation rows, inline actions, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| email | string | Invited user email |
| role | enum | Admin, Manager, Operator, Viewer |
| invited_by | user_id | Name of inviter |
| sent_at | timestamp | "3 days ago", "1 week ago" |
| expires_at | timestamp | "4 days left", "Expired" |
| status | enum | pending, expired |

**Expiration**: 7 days from sent_at

---

## Validation

- **Resend**: Only allowed if status = pending (not expired)
- **Revoke**: Confirmation modal "Revoke invitation for {email}?"
- **Permissions**: Admin+ can view/manage invitations

---

## Accessibility

- **Touch targets**: Buttons >= 48x48dp (mobile), 36x36px (desktop)
- **Contrast**: Status badges WCAG AA (Pending: Yellow-50/900, Expired: Red-50/800)
- **Screen reader**: Row announces "Invitation: {email}, {role}, {status}, sent {date}, expires {date}"
- **Keyboard**: Tab navigation, Enter to trigger actions

---

## Technical Notes

- **RLS**: Users see only invitations in their organization (`org_id`)
- **API**: `GET /api/settings/invitations?status={status}&page={N}`
- **Real-time**: Subscribe to invitation updates (acceptance removes from list)
- **Pagination**: 20 per page, server-side

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true
**Iterations**: 0 of 3
