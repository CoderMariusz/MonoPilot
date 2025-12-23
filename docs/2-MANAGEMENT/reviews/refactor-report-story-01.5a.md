# Refactoring Report - Story 01.5a User Management CRUD

**Date**: 2025-12-19
**Status**: PARTIALLY COMPLETE
**Test Status**: 73 passing, 14 skipped (GREEN state confirmed)

## Executive Summary

Story 01.5a code has been analyzed and partially refactored. Some refactorings were successfully applied despite file system synchronization issues.

### Completed Refactorings:
1. **USER_SELECT_FIELDS constant** - Created and applied in `lib/services/user-service.ts` (3 usages)
2. **date-utils.ts utility** - Created `lib/utils/date-utils.ts` with `formatLastLogin` function

### Pending Refactorings (blocked by file sync issues):
1. Update `UserRow.tsx` to import `formatLastLogin`
2. Update `UsersDataTable.tsx` to import `formatLastLogin`
3. Auth/permission helper extraction
4. Type safety improvements

---

## Identified Code Smells

### 1. DUPLICATED CODE - User Select Fields (HIGH PRIORITY)

**Issue**: The same 13-line select query string appears 5+ times across files.

**Locations**:
- `lib/services/user-service.ts` lines 46-58, 133-145, 179-191
- `app/api/v1/settings/users/route.ts` lines 66-79, 201-213
- `app/api/v1/settings/users/[id]/route.ts` lines 100-112

**Recommended Fix**: Extract to shared constant

```typescript
// In lib/services/user-service.ts (or shared constants file)
export const USER_SELECT_FIELDS = `
  id,
  org_id,
  email,
  first_name,
  last_name,
  role_id,
  role:roles(id, code, name),
  language,
  is_active,
  last_login_at,
  created_at,
  updated_at
` as const

// Usage:
.select(USER_SELECT_FIELDS, { count: 'exact' })
```

**Impact**: Reduces 75+ lines of duplication, single source of truth.

---

### 2. DUPLICATED CODE - formatLastLogin Function (MEDIUM PRIORITY)

**Issue**: Identical function in two components.

**Locations**:
- `components/settings/users/UserRow.tsx` lines 36-49
- `components/settings/users/UsersDataTable.tsx` lines 124-137

**Recommended Fix**: Extract to shared utility

```typescript
// In lib/utils/date-utils.ts
/**
 * Formats last login date as relative time string.
 * Returns "Never", "Just now", "X hours ago", "Yesterday", "X days ago", or date.
 */
export function formatLastLogin(lastLogin: string | null | undefined): string {
  if (!lastLogin) return 'Never'
  const date = new Date(lastLogin)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}
```

---

### 3. DUPLICATED CODE - Auth/Permission Check Pattern (HIGH PRIORITY)

**Issue**: Nearly identical 20-line auth+permission block in 4 API routes.

**Locations**:
- `app/api/v1/settings/users/route.ts` GET (lines 31-52)
- `app/api/v1/settings/users/route.ts` POST (lines 142-162)
- `app/api/v1/settings/users/[id]/route.ts` PUT (lines 39-59)
- `app/api/v1/settings/users/[id]/activate/route.ts` (lines 32-52)
- `app/api/v1/settings/users/[id]/deactivate/route.ts` (lines 36-56)

**Recommended Fix**: Extract to middleware or helper

```typescript
// In lib/api/auth-helpers.ts
interface AuthResult {
  authUser: { id: string }
  userData: { org_id: string; role: { code: string }[] }
}

export async function requireAuth(
  supabase: SupabaseClient,
  allowedRoles: string[] = ['owner', 'admin']
): Promise<AuthResult | NextResponse> {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role:roles(code)')
    .eq('id', authUser.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleCode = (userData.role as any)?.[0]?.code || ''
  if (!allowedRoles.includes(roleCode)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return { authUser, userData }
}

// Usage in routes:
const auth = await requireAuth(supabase, ['owner', 'admin'])
if (auth instanceof NextResponse) return auth
const { authUser, userData } = auth
```

**Impact**: Reduces 100+ lines of duplication across API routes.

---

### 4. TYPE SAFETY - Usage of `any` Type (MEDIUM PRIORITY)

**Locations**:
- `lib/services/user-service.ts` line 166: `const updateData: any = {}`
- `app/api/v1/settings/users/route.ts` line 165: `let body: any`
- `app/api/v1/settings/users/[id]/route.ts` lines 62, 87
- Multiple instances of `(userData.role as any)?.[0]?.code`

**Recommended Fix**: Create proper types

```typescript
// In lib/types/user.ts
export interface UserUpdatePayload {
  first_name?: string
  last_name?: string
  role_id?: string
  language?: string
  updated_at?: string
}

// Fix role access with proper typing
interface UserWithRole {
  org_id: string
  role: Array<{ code: string }> | null
}

// Usage:
const roleCode = userData.role?.[0]?.code ?? ''
```

---

### 5. MAGIC STRINGS - Error Codes (LOW PRIORITY)

**Issue**: Hardcoded PostgreSQL error codes.

**Locations**:
- `'23505'` for duplicate email (appears 2x)
- `'PGRST116'` for not found (appears 3x)

**Recommended Fix**: Extract to constants

```typescript
// In lib/constants/error-codes.ts
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  NOT_FOUND: 'PGRST116',
} as const
```

---

### 6. MAGIC STRINGS - Role Codes (LOW PRIORITY)

**Issue**: Hardcoded role codes scattered across files.

**Locations**:
- `'owner'`, `'admin'`, `'viewer'` in multiple route files
- `'SUPER_ADMIN'` in user-service.ts

**Recommended Fix**: Extract to constants

```typescript
// In lib/constants/roles.ts
export const ROLE_CODES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export const ADMIN_ROLES = [ROLE_CODES.OWNER, ROLE_CODES.ADMIN] as const
export const VIEW_ROLES = [...ADMIN_ROLES, ROLE_CODES.VIEWER] as const
```

---

## Refactoring Priority Matrix

| Priority | Issue | Impact | Effort | Recommended |
|----------|-------|--------|--------|-------------|
| HIGH | User Select Fields duplication | High | Low | Yes |
| HIGH | Auth/Permission pattern duplication | High | Medium | Yes |
| MEDIUM | formatLastLogin duplication | Medium | Low | Yes |
| MEDIUM | `any` type usage | Medium | Low | Yes |
| LOW | Magic error codes | Low | Low | Optional |
| LOW | Magic role codes | Low | Low | Optional |

---

## Files Requiring Changes

### Service Layer
- `lib/services/user-service.ts` - Add USER_SELECT_FIELDS constant, fix types

### API Routes
- `app/api/v1/settings/users/route.ts` - Use shared constant, extract auth helper
- `app/api/v1/settings/users/[id]/route.ts` - Use shared constant, extract auth helper
- `app/api/v1/settings/users/[id]/activate/route.ts` - Extract auth helper
- `app/api/v1/settings/users/[id]/deactivate/route.ts` - Extract auth helper

### Components
- `components/settings/users/UserRow.tsx` - Import formatLastLogin from utils
- `components/settings/users/UsersDataTable.tsx` - Import formatLastLogin from utils

### New Files to Create
- `lib/utils/date-utils.ts` - formatLastLogin utility
- `lib/api/auth-helpers.ts` - requireAuth helper
- `lib/constants/error-codes.ts` - PostgreSQL error codes
- `lib/constants/roles.ts` - Role code constants

---

## Test Status

After refactoring:
- **73 tests passing** (unchanged)
- **14 tests skipped** (unchanged)
- **GREEN state maintained**

---

## Changes Applied

### 1. USER_SELECT_FIELDS constant (COMPLETE)

**File**: `apps/frontend/lib/services/user-service.ts`

```typescript
const USER_SELECT_FIELDS = `
  id,
  org_id,
  email,
  first_name,
  last_name,
  role_id,
  role:roles(id, code, name),
  language,
  is_active,
  last_login_at,
  created_at,
  updated_at
` as const
```

Applied in 3 locations:
- Line 65: `getUsers()` method
- Line 139: `createUser()` method
- Line 173: `updateUser()` method

**Lines saved**: ~36 lines of duplication removed

### 2. date-utils.ts utility (COMPLETE)

**File**: `apps/frontend/lib/utils/date-utils.ts` (NEW)

Created shared utility with JSDoc documentation for `formatLastLogin()` function.

---

## Pending Changes (Manual Application Required)

### Component updates for formatLastLogin

In `UserRow.tsx`:
```typescript
// Add import:
import { formatLastLogin } from '@/lib/utils/date-utils'

// Remove local function definition (lines 36-49)
```

In `UsersDataTable.tsx`:
```typescript
// Add import:
import { formatLastLogin } from '@/lib/utils/date-utils'

// Remove local function definition (lines 124-137)
```

---

## Next Steps

1. Apply pending component updates
2. Consider auth helper extraction in future iteration
3. Consider type safety improvements

---

## Handoff to CODE-REVIEWER

```yaml
story: "01.5a"
type: "REFACTOR"
status: "PARTIALLY_COMPLETE"
tests_status: GREEN (73 passing, 14 skipped)
changes_made:
  - "Created USER_SELECT_FIELDS constant in user-service.ts"
  - "Applied constant in 3 locations (getUsers, createUser, updateUser)"
  - "Created lib/utils/date-utils.ts with formatLastLogin utility"
  - "Created refactoring report"
pending:
  - "Update UserRow.tsx to use shared formatLastLogin"
  - "Update UsersDataTable.tsx to use shared formatLastLogin"
adr_created: null
complexity_reduced: "~36 lines of duplication removed from service layer"
```
