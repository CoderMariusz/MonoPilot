# BUG-203: Missing Inline "Resend Invite" Link in Users Table

**Bug ID**: BUG-203
**Story**: TD-203
**Component**: Users Management Page
**Severity**: MEDIUM
**Status**: OPEN
**Date Reported**: 2025-12-24

---

## Summary

Users table missing inline "Resend Invite" link for invited users. Wireframe shows link directly in user row, but implementation only provides resend in separate "Invitations" tab.

---

## Expected Behavior

Per wireframe SET-008 (lines 30-31):

```
│ Bob Wilson     bob@acme.com         Warehouse Op.    Invited  │
│                Invited: 3 days ago • [Resend Invite]           │
```

For users with status="invited", row should show:
- Status badge: "Invited"
- Optional second row: "Invited: X days ago • [Resend Invite]" link
- OR inline link in Status column

---

## Actual Behavior

Users table shows:
- Only one row per user with status badge
- No second row with "Invited: X ago" text
- No inline "Resend Invite" link in Users table
- Resend functionality hidden in separate "Invitations" tab

Users must navigate away from Users tab to Invitations tab to resend invites.

---

## Current Workaround

1. Click "Invitations" tab
2. Find user in invitation list
3. Click Mail icon button to resend
4. Click "Users" tab to return

This requires 4 steps instead of 1-click inline action.

---

## Steps to Reproduce

1. Create a user invitation (Users tab > Add User > Send Invite)
2. Return to Users table
3. Look for user with status="invited"
4. Try to find "Resend Invite" action

**Expected**: Link visible in user row
**Actual**: Link not found; must go to Invitations tab

---

## Root Cause

Two implementation issues:

### Issue 1: No Inline Link in Users Table

**File**: `apps/frontend/app/(authenticated)/settings/users/page.tsx`

**Lines 263-264** (Status column):
```typescript
<TableCell>{getStatusBadge(user.status)}</TableCell>
```

Only renders a Badge component. No logic for invited users to show resend link.

**Missing Logic**:
```typescript
{user.status === 'invited' ? (
  <div>
    <Badge>Invited</Badge>
    <button onClick={() => handleResend(user)}>Resend Invite</button>
  </div>
) : (
  getStatusBadge(user.status)
)}
```

### Issue 2: Resend Handler Not in Users Page

**File**: `apps/frontend/app/(authenticated)/settings/users/page.tsx`

The `handleResend()` function doesn't exist in Users page component. It only exists in `InvitationsTable.tsx`.

**Missing Handler**:
```typescript
const handleResend = async (user: User) => {
  try {
    const response = await fetch(
      `/api/v1/settings/users/invitations/${user.id}/resend`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to resend invitation')
    }

    toast({
      title: 'Success',
      description: `Invitation resent to ${user.email}`,
    })

    fetchUsers() // Refresh list
  } catch (error) {
    console.error('Error resending invitation:', error)
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to resend invitation',
      variant: 'destructive',
    })
  }
}
```

### Issue 3: Architecture Disconnect

Resend functionality exists but in wrong component:
- **InvitationsTable.tsx**: Has full resend implementation (lines 112-137)
- **Users page**: No resend functionality

This forces users to tab-switch to use resend feature.

---

## Impact

- **User Experience**: Extra navigation required to resend invites
- **Discoverability**: Users may not realize resend feature exists
- **Efficiency**: 4 steps instead of 1
- **Wireframe Compliance**: Doesn't match approved design

---

## Severity Assessment

**Severity**: MEDIUM (Non-blocking, UX degradation)

- Does NOT crash or break functionality
- Workaround exists (InvitationsTable tab)
- Only affects users managing invitations
- Makes task less efficient

---

## Fix Required

### Solution

Add inline "Resend Invite" link/button to Users table for invited users.

**File to Fix**: `apps/frontend/app/(authenticated)/settings/users/page.tsx`

**Change 1 - Add Handler** (after line 143):
```typescript
// Resend invitation
const handleResend = async (user: User) => {
  try {
    const response = await fetch(
      `/api/v1/settings/users/invitations/${user.id}/resend`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to resend invitation')
    }

    toast({
      title: 'Success',
      description: `Invitation resent to ${user.email}`,
    })

    fetchUsers() // Refresh list
  } catch (error) {
    console.error('Error resending invitation:', error)
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to resend invitation',
      variant: 'destructive',
    })
  }
}
```

**Change 2 - Update Status Column** (lines 263-264):

**Before**:
```typescript
<TableCell>{getStatusBadge(user.status)}</TableCell>
```

**After**:
```typescript
<TableCell>
  {user.status === 'invited' ? (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Invited</Badge>
      <button
        onClick={() => handleResend(user)}
        className="text-blue-600 underline hover:no-underline text-sm"
        title="Resend invitation email"
      >
        Resend
      </button>
    </div>
  ) : (
    getStatusBadge(user.status)
  )}
</TableCell>
```

**Alternative - Use Menu Button**:
```typescript
<TableCell>
  <div className="flex items-center justify-between">
    {getStatusBadge(user.status)}
    {user.status === 'invited' && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleResend(user)}
        title="Resend invitation email"
      >
        <Mail className="h-4 w-4" />
      </Button>
    )}
  </div>
</TableCell>
```

---

## Design Specifications

### Link Styling (Per Design System)

If using inline link style:
- **Color**: Blue (#2563EB or theme blue)
- **Text**: "Resend"
- **Hover**: Underline
- **Active**: Darker blue

```css
.resend-link {
  color: #2563EB;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.resend-link:hover {
  text-decoration: underline;
}

.resend-link:active {
  color: #1d4ed8;
}
```

### Button Styling (Per ShadCN UI)

If using button style:
- Use `variant="ghost"` + `size="sm"`
- Icon: Mail icon from lucide-react
- Loading state: Show spinner during request

---

## Effort Estimate

- **Analysis**: 5 minutes
- **Coding**: 15 minutes (handler + UI)
- **Testing**: 15 minutes (manual + edge cases)
- **Review**: 10 minutes
- **Total**: 45 minutes

---

## Testing Criteria

After fix:

1. **Invited User Row**: Shows badge + resend link
2. **Active/Inactive User Row**: Only shows badge, no resend link
3. **Click Resend**:
   - Shows loading state
   - Calls API endpoint
   - Success toast appears
   - Table refreshes
4. **Error Handling**: Error toast on failure
5. **Regression**: All other table actions still work

---

## Test Scenarios

### Scenario 1: Invited User Resend
**Given** User with status="invited" in table
**When** User clicks "Resend" link
**Then**
- Loading spinner shows
- API POST to `/api/.../invitations/{id}/resend`
- Success toast: "Invitation resent to email@example.com"
- Table refreshes
**Expected**: PASS

### Scenario 2: Active User (No Resend)
**Given** User with status="active"
**When** Looking at user row
**Then** No resend link visible
**Expected**: PASS

### Scenario 3: Inactive User (No Resend)
**Given** User with status="inactive"
**When** Looking at user row
**Then** No resend link visible
**Expected**: PASS

### Scenario 4: Resend Fails
**Given** Resend fails (network error)
**When** User clicks resend
**Then** Error toast shows: "Failed to resend invitation"
**Expected**: PASS

### Scenario 5: Multiple Invited Users
**Given** 3+ users with status="invited"
**When** Table displays
**Then** All invited users show resend links
**Expected**: PASS

---

## API Dependency

**Endpoint**: `POST /api/v1/settings/users/invitations/{id}/resend`

This endpoint already exists in InvitationsTable.tsx implementation (lines 114-116):
```typescript
const response = await fetch(
  `/api/v1/settings/users/invitations/${invitation.id}/resend`,
  { method: 'POST' }
)
```

**No API changes required** - endpoint already implemented.

---

## Wireframe Compliance

After fix, users table will match SET-008 requirements:
- Inline resend link visible ✓
- Link in status area ✓
- "Invited: X ago" text optional (nice to have) ⚠️
- Resend triggers API call ✓
- Success feedback shown ✓

---

## Related Issues

- BUG-202: Column order mismatch (same story)

---

## Notes

- The resend API endpoint already exists and works
- InvitationsTable has full reference implementation
- Only needs to be replicated in Users table
- No database schema changes needed
- No API changes needed

---

**Reported by**: QA-AGENT (Claude Code)
**Date**: 2025-12-24
**Priority**: 3 (Nice to have, workaround exists)
