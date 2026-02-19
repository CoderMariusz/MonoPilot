# BUG-202: Users Table Column Order Does Not Match Wireframe

**Bug ID**: BUG-202
**Story**: TD-202
**Component**: Users Management Page
**Severity**: MEDIUM
**Status**: OPEN
**Date Reported**: 2025-12-24

---

## Summary

The Users table displays columns in wrong order. Wireframe specifies **Name, Email, Role, Status, Last Login** but implementation shows **Email, Name, Role, Status, Last Login**.

---

## Expected Behavior

Per wireframe SET-008 (line 22), table columns should appear in this order:
```
| Name | Email | Role | Status | Last Login | Actions |
```

This makes Name the primary identifying column, followed by Email.

---

## Actual Behavior

Current implementation (users/page.tsx:233-239) displays:
```
| Email | Name | Role | Status | Last Login | Actions |
```

Email appears first, Name second - reversed from specification.

---

## Steps to Reproduce

1. Navigate to Settings > Users page
2. Observe table column headers
3. Compare with SET-008 wireframe

**Expected**: Name first, Email second
**Actual**: Email first, Name second

---

## Root Cause

Users table header elements defined in wrong order:

**File**: `apps/frontend/app/(authenticated)/settings/users/page.tsx`

**Lines 233-239**:
```typescript
<TableHeader>
  <TableRow>
    <TableHead>Email</TableHead>       // ← WRONG
    <TableHead>Name</TableHead>        // ← WRONG
    <TableHead>Role</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Last Login</TableHead>
    <TableHead className="text-right">Actions</TableHead>
  </TableRow>
</TableHeader>
```

**Lines 256-289** (Table Body):
```typescript
users.map((user) => (
  <TableRow key={user.id}>
    <TableCell className="font-medium">{user.email}</TableCell>     // ← WRONG
    <TableCell>
      {user.first_name} {user.last_name}
    </TableCell>                                                    // ← WRONG
    // ... rest of row
```

---

## Impact

- **UX Inconsistency**: Doesn't match approved wireframe design
- **User Confusion**: Name is expected first as primary identifier
- **Data Hierarchy**: Email should be secondary identifier
- **Accessibility**: Screen readers will announce in wrong order

---

## Severity Assessment

**Severity**: MEDIUM (Non-blocking, UX inconsistency)

- Does NOT block functionality
- Core table operations still work (search, filter, edit, delete)
- Minor design/UX inconsistency
- Workaround: Users can read both columns (just in different order)

---

## Fix Required

### Solution

Swap header and body cell positions for Name and Email columns.

**File to Fix**: `apps/frontend/app/(authenticated)/settings/users/page.tsx`

**Change 1 - TableHeader (lines 233-239)**:
```typescript
<TableHeader>
  <TableRow>
    <TableHead>Name</TableHead>                      // ← Move Name first
    <TableHead>Email</TableHead>                     // ← Move Email second
    <TableHead>Role</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Last Login</TableHead>
    <TableHead className="text-right">Actions</TableHead>
  </TableRow>
</TableHeader>
```

**Change 2 - TableBody (lines 256-289)**:
```typescript
users.map((user) => (
  <TableRow key={user.id}>
    <TableCell className="font-medium">
      {user.first_name} {user.last_name}            // ← Move Name first
    </TableCell>
    <TableCell>{user.email}</TableCell>             // ← Move Email second
    <TableCell>{getRoleLabel(user.role)}</TableCell>
    <TableCell>{getStatusBadge(user.status)}</TableCell>
    <TableCell>
      {user.last_login_at
        ? new Date(user.last_login_at).toLocaleDateString()
        : 'Never'}
    </TableCell>
    <TableCell className="text-right">
      {/* Actions */}
    </TableCell>
  </TableRow>
))
```

---

## Effort Estimate

- **Analysis**: 5 minutes
- **Coding**: 5 minutes
- **Testing**: 10 minutes
- **Review**: 5 minutes
- **Total**: 25 minutes

---

## Testing Criteria

After fix:

1. **Visual**: Column order matches wireframe (Name, Email, Role, Status, Last Login)
2. **Functionality**: All table operations still work (sort, filter, search, edit, delete)
3. **Responsive**: Columns stack correctly on mobile
4. **Accessibility**: Screen reader announces columns in correct order

---

## Acceptance

**Fixed When**:
- Columns display in order: Name, Email, Role, Status, Last Login
- All user operations still work
- No regressions in other features
- QA re-test passes

---

## Related Issues

- BUG-203: Missing inline "Resend Invite" link (related story)

---

## Notes

- This is purely a column ordering issue
- No data transformation required
- No API changes needed
- No database changes needed

---

**Reported by**: QA-AGENT (Claude Code)
**Date**: 2025-12-24
**Priority**: 3 (Nice to have, doesn't block functionality)
