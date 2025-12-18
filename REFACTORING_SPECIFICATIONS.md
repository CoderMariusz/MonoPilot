# Story 01.6 Refactoring - Detailed Specifications

**Story:** 01.6 - Role-Based Permissions
**Phase:** REFACTOR
**Status:** Ready for Execution
**File Target:** `apps/frontend/lib/services/permission-service.ts`
**Test File:** `apps/frontend/lib/services/__tests__/permission-service.test.ts`

---

## Refactoring Execution Guide

Follow these specifications EXACTLY. Apply ONE refactoring at a time. Test after EACH change. Undo immediately if tests FAIL.

---

## Refactoring 1: Add isOwner() Function

### Specification

**Location:** After line 34 (after hasAdminAccess function)

**Current Code (Lines 31-34):**
```typescript
export function hasAdminAccess(roleCode: string): boolean {
  if (!roleCode) return false
  return ADMIN_ROLES.includes(roleCode as any)
}
```

**Code to Add:**
```typescript

/**
 * Checks if user is ONLY the owner role.
 *
 * SECURITY: Owner role is distinct from admin. Use this for owner-only operations:
 * - Assigning owner role to other users
 * - Organization deletion
 * - Billing and subscription changes
 *
 * Owner cannot be assigned by admins (prevents privilege escalation).
 *
 * @param roleCode - User's role code (from org context)
 * @returns {boolean} true only if user is owner, false for admin and all other roles
 *
 * @example
 * ```typescript
 * const context = await getOrgContext(userId);
 * if (isOwner(context.role_code)) {
 *   // Allow owner-only operation
 *   await transferOwnershipTo(newOwnerUserId);
 * }
 * ```
 *
 * @see {@link docs/1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md}
 */
export function isOwner(roleCode: string): boolean {
  if (!roleCode) return false
  return roleCode === 'owner'
}
```

### Test Cases to Add

**File:** `lib/services/__tests__/permission-service.test.ts`

**Add at end of file:**
```typescript
describe('isOwner - Owner-Only Role Check', () => {
  it('should return true for owner role', () => {
    // GIVEN user with owner role
    const roleCode = 'owner'

    // WHEN checking if owner
    const result = isOwner(roleCode)

    // THEN returns true
    expect(result).toBe(true)
  })

  it('should return false for admin role', () => {
    // GIVEN user with admin role
    const roleCode = 'admin'

    // WHEN checking if owner
    const result = isOwner(roleCode)

    // THEN returns false (admin is not owner)
    expect(result).toBe(false)
  })

  it('should return false for any non-owner role', () => {
    // GIVEN various non-owner roles
    const nonOwnerRoles = [
      'production_manager',
      'quality_manager',
      'warehouse_manager',
      'production_operator',
      'warehouse_operator',
      'quality_inspector',
      'planner',
      'viewer',
    ]

    // WHEN checking if owner for each role
    // THEN all return false
    nonOwnerRoles.forEach((roleCode) => {
      expect(isOwner(roleCode)).toBe(false)
    })
  })

  it('should return false for null/undefined', () => {
    // GIVEN invalid role values
    expect(isOwner(null as any)).toBe(false)
    expect(isOwner(undefined as any)).toBe(false)
    expect(isOwner('')).toBe(false)
  })

  it('should be case-sensitive for owner role', () => {
    // GIVEN uppercase OWNER (should be lowercase)
    const roleCode = 'OWNER'

    // WHEN checking if owner
    const result = isOwner(roleCode)

    // THEN returns false (case-sensitive)
    expect(result).toBe(false)
  })
})
```

### Verification Steps

1. Run tests:
   ```bash
   cd apps/frontend
   pnpm test -- permission-service.test.ts
   ```

2. Expected result:
   - All 30 tests PASSING (25 original + 5 new)
   - No errors or warnings
   - Duration: ~10ms

3. If FAIL:
   - UNDO this refactoring immediately
   - Check for typos in function signature
   - Verify test import statement

4. If PASS:
   - Commit with message:
     ```
     refactor(01.6): Add isOwner() for explicit owner-only checks
     ```

---

## Refactoring 2: Add canAssignRole() Function

### Specification

**Location:** After line ~56 (after canModifyUsers function)

**Current Code (Lines 54-56):**
```typescript
export function canModifyUsers(roleCode: string): boolean {
  return hasAdminAccess(roleCode)
}
```

**Code to Add After canModifyUsers:**
```typescript

/**
 * Checks if user can assign a specific role to another user.
 *
 * SECURITY: Only owner can assign owner role.
 * This prevents privilege escalation where admins could become owners.
 *
 * Rules:
 * - Only owner can assign owner role to others
 * - Admins can assign any role except owner
 * - Regular users cannot assign any role
 *
 * @param assignerRoleCode - The role of the user doing the assignment
 * @param targetRoleCode - The role being assigned
 * @returns {boolean} true if assigner can assign target role
 *
 * @example
 * ```typescript
 * if (canAssignRole(context.role_code, 'owner')) {
 *   // Allow assigning owner role
 *   await assignRole(userId, 'owner');
 * } else {
 *   throw new ForbiddenError('Only owner can assign owner role');
 * }
 * ```
 *
 * @see {@link docs/1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md}
 */
export function canAssignRole(
  assignerRoleCode: string,
  targetRoleCode: string
): boolean {
  // Only owner can assign owner role (prevent privilege escalation)
  if (targetRoleCode === 'owner' && !isOwner(assignerRoleCode)) {
    return false
  }

  // Only admins (owner/admin) can assign any role
  return hasAdminAccess(assignerRoleCode)
}
```

### Test Cases to Add

**File:** `lib/services/__tests__/permission-service.test.ts`

**Add after isOwner tests:**
```typescript
describe('canAssignRole - Privilege Escalation Prevention', () => {
  it('should allow owner to assign owner role', () => {
    // GIVEN owner role trying to assign owner
    const assignerRole = 'owner'
    const targetRole = 'owner'

    // WHEN checking if can assign
    const result = canAssignRole(assignerRole, targetRole)

    // THEN returns true
    expect(result).toBe(true)
  })

  it('should deny admin from assigning owner role', () => {
    // GIVEN admin role trying to assign owner
    const assignerRole = 'admin'
    const targetRole = 'owner'

    // WHEN checking if can assign
    const result = canAssignRole(assignerRole, targetRole)

    // THEN returns false (SECURITY: prevent privilege escalation)
    expect(result).toBe(false)
  })

  it('should allow admin to assign non-owner roles', () => {
    // GIVEN admin role trying to assign viewer
    const assignerRole = 'admin'
    const targetRoles = ['viewer', 'production_manager', 'admin', 'planner']

    // WHEN checking if can assign
    // THEN all return true
    targetRoles.forEach((targetRole) => {
      expect(canAssignRole(assignerRole, targetRole)).toBe(true)
    })
  })

  it('should deny non-admin from assigning any role', () => {
    // GIVEN production_operator trying to assign viewer
    const assignerRole = 'production_operator'
    const targetRole = 'viewer'

    // WHEN checking if can assign
    const result = canAssignRole(assignerRole, targetRole)

    // THEN returns false
    expect(result).toBe(false)
  })

  it('should deny viewer from assigning owner', () => {
    // GIVEN viewer trying to assign owner
    const assignerRole = 'viewer'
    const targetRole = 'owner'

    // WHEN checking if can assign
    const result = canAssignRole(assignerRole, targetRole)

    // THEN returns false
    expect(result).toBe(false)
  })
})
```

### Verification Steps

1. Run tests:
   ```bash
   cd apps/frontend
   pnpm test -- permission-service.test.ts
   ```

2. Expected result:
   - All 35 tests PASSING (30 previous + 5 new)
   - No errors or warnings
   - Duration: ~15ms

3. If FAIL:
   - UNDO this refactoring immediately
   - Verify isOwner() function exists (Refactoring 1 must be done first)
   - Check for typos in function signature

4. If PASS:
   - Commit with message:
     ```
     refactor(01.6): Add canAssignRole() to prevent privilege escalation
     ```

---

## Refactoring 3: Improve Type Safety

### Specification

**Location 1:** Line 33 in hasAdminAccess function

**Current:**
```typescript
return ADMIN_ROLES.includes(roleCode as any)
```

**Change To:**
```typescript
return (ADMIN_ROLES as readonly string[]).includes(roleCode)
```

**Location 2:** Line 97 in isSystemRole function

**Current:**
```typescript
return SYSTEM_ROLES.includes(roleCode as any)
```

**Change To:**
```typescript
return (SYSTEM_ROLES as readonly string[]).includes(roleCode)
```

### Why This Change

- ADMIN_ROLES and SYSTEM_ROLES are defined with `as const`
- Casting to `any` on the parameter bypasses type checking
- Better practice: cast the constant to `readonly string[]` instead
- Result: Better type safety, same runtime behavior

### Verification Steps

1. Verify TypeScript compiles:
   ```bash
   cd apps/frontend
   pnpm tsc --noEmit
   ```

2. Run tests:
   ```bash
   cd apps/frontend
   pnpm test -- permission-service.test.ts
   ```

3. Expected result:
   - TypeScript compilation succeeds with NO errors
   - All 35 tests PASSING
   - Duration: ~15ms

4. If FAIL:
   - UNDO this refactoring immediately
   - Check TypeScript error messages
   - Verify no syntax errors in changes

5. If PASS:
   - Commit with message:
     ```
     refactor(01.6): Improve type safety - remove 'as any' casts
     ```

---

## Refactoring 4: Enhance Comments

### Specification

**Location:** Lines 141-144 in hasPermission function

**Current Code:**
```typescript
export function hasPermission(
  module: string,
  operation: 'C' | 'R' | 'U' | 'D',
  permissions: Record<string, string>
): boolean {
  const modulePermissions = permissions[module]
  if (!modulePermissions) return false
  if (modulePermissions === '-') return false
  return modulePermissions.includes(operation)
}
```

**Enhanced Code:**
```typescript
export function hasPermission(
  module: string,
  operation: 'C' | 'R' | 'U' | 'D',
  permissions: Record<string, string>
): boolean {
  const modulePermissions = permissions[module]
  // Missing module or falsy value = no access (deny by default principle)
  if (!modulePermissions) return false
  // Dash ('-') explicitly means "no access to this module"
  if (modulePermissions === '-') return false
  return modulePermissions.includes(operation)
}
```

### Why This Change

- Clarifies why two checks are needed
- Explains security principle (deny by default)
- Makes the code more maintainable
- Helps future developers understand the design

### Verification Steps

1. Run tests:
   ```bash
   cd apps/frontend
   pnpm test -- permission-service.test.ts
   ```

2. Expected result:
   - All 35 tests PASSING (no change, documentation only)
   - No errors or warnings
   - Duration: ~15ms

3. If FAIL (unexpected):
   - UNDO immediately
   - Verify no accidental code changes

4. If PASS:
   - Commit with message:
     ```
     docs(01.6): Clarify permission logic with better comments
     ```

---

## Complete Refactoring Checklist

### Before Starting
- [ ] Branch is clean (no uncommitted changes)
- [ ] All tests currently passing (25/25)
- [ ] You have permission-service.ts and test file open

### Refactoring 1: Add isOwner()
- [ ] Add function after hasAdminAccess (line 34)
- [ ] Add 5 test cases
- [ ] Run tests → all 30 PASS
- [ ] Commit: "refactor(01.6): Add isOwner() for explicit owner-only checks"

### Refactoring 2: Add canAssignRole()
- [ ] Add function after canModifyUsers (line ~56)
- [ ] Add 5 test cases
- [ ] Run tests → all 35 PASS
- [ ] Commit: "refactor(01.6): Add canAssignRole() to prevent privilege escalation"

### Refactoring 3: Improve Type Safety
- [ ] Change line 33: Remove 'as any', use 'as readonly string[]'
- [ ] Change line 97: Remove 'as any', use 'as readonly string[]'
- [ ] Verify TypeScript compiles
- [ ] Run tests → all 35 PASS
- [ ] Commit: "refactor(01.6): Improve type safety - remove 'as any' casts"

### Refactoring 4: Enhance Comments
- [ ] Add comments to lines 141-144
- [ ] Run tests → all 35 PASS
- [ ] Commit: "docs(01.6): Clarify permission logic with better comments"

### After Completion
- [ ] All 35 tests PASSING (GREEN)
- [ ] All 4 commits created
- [ ] No behavior changes to existing functions
- [ ] Code ready for review

---

## Quick Reference

### Test Command
```bash
cd apps/frontend && pnpm test -- permission-service.test.ts
```

### Expected Test Results After Each Refactoring
1. After Refactoring 1: 30 tests PASS
2. After Refactoring 2: 35 tests PASS
3. After Refactoring 3: 35 tests PASS
4. After Refactoring 4: 35 tests PASS

### Rollback Command (if needed)
```bash
git checkout -- apps/frontend/lib/services/permission-service.ts
git checkout -- apps/frontend/lib/services/__tests__/permission-service.test.ts
```

### Commit Template
```
refactor(01.6): [description]

- Added [feature description]
- All tests passing (X/X)
- No behavior changes

Story: 01.6 - Role-Based Permissions
Phase: REFACTOR
```

---

## Success Criteria

All refactorings complete successfully when:
- [x] Refactoring 1: isOwner() function added and tested
- [x] Refactoring 2: canAssignRole() function added and tested
- [x] Refactoring 3: Type safety improved (no 'as any')
- [x] Refactoring 4: Comments enhanced
- [x] All 35 tests PASSING
- [x] All 4 commits created
- [x] No behavior changes to existing functions
- [x] Code ready for CODE-REVIEWER

---

**Next Step:** Execute refactorings in order, testing after each change.

