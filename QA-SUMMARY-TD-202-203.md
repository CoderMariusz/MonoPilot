# QA Summary: Stories TD-202 & TD-203

**Component**: Users Management Page (`/settings/users`)
**Date**: 2025-12-24
**Decision**: **FAIL** - 2 Medium bugs, 0/8 AC passing

---

## Test Results

| Criterion | Expected | Found | Status |
|-----------|----------|-------|--------|
| Column Order | Name, Email, Role, Status, Last Login | Email, Name, Role, Status, Last Login | FAIL |
| Inline Resend | Link visible in Status cell for invited | Link hidden in separate InvitationsTable | FAIL |

---

## Bugs Found

### BUG-202: Column Order Wrong
- **Severity**: MEDIUM
- **Location**: `apps/frontend/app/(authenticated)/settings/users/page.tsx:233-289`
- **Fix**: Swap Name/Email column positions (5 min)
- **File**: `docs/2-MANAGEMENT/qa/bugs/BUG-202-TABLE-COLUMN-ORDER.md`

### BUG-203: Missing Inline Resend Link
- **Severity**: MEDIUM
- **Location**: `apps/frontend/app/(authenticated)/settings/users/page.tsx:263-264`
- **Fix**: Add resend handler + inline link (15 min)
- **File**: `docs/2-MANAGEMENT/qa/bugs/BUG-203-MISSING-INLINE-RESEND-LINK.md`

---

## Evidence

### Current Implementation
```typescript
// WRONG ORDER
<TableHead>Email</TableHead>
<TableHead>Name</TableHead>
```

### Wireframe Requirement (SET-008)
```
| Name | Email | Role | Status | Last Login |
```

### Missing Feature
Wireframe shows (line 31):
```
│ Bob Wilson     bob@acme.com         Warehouse Op.    Invited  │
│                Invited: 3 days ago • [Resend Invite]           │
```

But implementation only shows:
- Users table: No resend link
- InvitationsTable: Has resend (separate tab)

---

## Full Report

See: `docs/2-MANAGEMENT/qa/qa-report-story-TD-202-203.md`

---

## Next Steps for Dev Team

1. Read: `docs/2-MANAGEMENT/qa/bugs/BUG-202-TABLE-COLUMN-ORDER.md` (Fix: 5 min)
2. Read: `docs/2-MANAGEMENT/qa/bugs/BUG-203-MISSING-INLINE-RESEND-LINK.md` (Fix: 15 min)
3. Implement both fixes (20 min total)
4. Unit test changes
5. Request QA re-validation

---

## Quality Gate Status

| Gate | Status |
|------|--------|
| All AC Pass | FAIL |
| No CRITICAL bugs | PASS |
| No HIGH bugs | PASS |
| No regressions | PASS |

**Overall**: FAIL - Return to development for bug fixes
