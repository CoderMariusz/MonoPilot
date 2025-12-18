# Settings Hooks

**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Version:** 1.0.0
**Since:** v0.2.0

---

## Overview

The Settings module provides three specialized React hooks for managing organization context, role-based access control, and permission checks. These hooks work together to create a secure, consistent user experience across all Settings pages.

**Hooks:**
1. **useOrgContext** - Fetches organization context for authenticated user
2. **useSettingsGuard** - Role-based access control for routes
3. **useSettingsPermissions** - CRUD permission checks for Settings module

**Common Pattern:**
```typescript
function SettingsPage() {
  // 1. Get org context (base data)
  const { data: context, isLoading, error } = useOrgContext()

  // 2. Check route access (guard)
  const { allowed, loading: guardLoading } = useSettingsGuard(['owner', 'admin'])

  // 3. Check CRUD permissions (conditional UI)
  const { canRead, canWrite, canDelete } = useSettingsPermissions()

  if (isLoading || guardLoading) return <Skeleton />
  if (!allowed) return <AccessDenied />
  if (!canRead) return <Forbidden />

  return (
    <div>
      {canWrite && <Button>Edit</Button>}
      {canDelete && <Button>Delete</Button>}
    </div>
  )
}
```

---

## useOrgContext

**Path:** `apps/frontend/lib/hooks/useOrgContext.ts`

Client-side hook to fetch organization context for the authenticated user.

### Purpose

Provides organization context data needed for role-based access control, permission checks, and navigation filtering. Wraps the server-side `/api/v1/settings/context` endpoint (Story 01.1).

### Signature

```typescript
function useOrgContext(): {
  data: OrgContext | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
```

### Return Type

```typescript
interface OrgContextReturn {
  data: OrgContext | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface OrgContext {
  org_id: string
  user_id: string
  role_code: string
  role_name: string
  permissions: Record<string, string>  // module -> CRUD string
  organization: {
    id: string
    name: string
    // ... other org fields
  }
}
```

### Usage

**Basic Usage:**
```typescript
function MyComponent() {
  const { data: context, isLoading, error, refetch } = useOrgContext()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage onRetry={refetch} />
  if (!context) return null

  return <div>Welcome, {context.role_name}</div>
}
```

**With Error Handling:**
```typescript
function SettingsPage() {
  const { data: context, isLoading, error, refetch } = useOrgContext()

  if (isLoading) {
    return <SettingsNavSkeleton />
  }

  if (error) {
    return (
      <SettingsErrorState
        error={error}
        onRetry={refetch}
      />
    )
  }

  if (!context) {
    return null
  }

  return <SettingsContent context={context} />
}
```

**Accessing Organization Data:**
```typescript
const { data: context } = useOrgContext()

if (context) {
  console.log('Organization:', context.organization.name)
  console.log('Role:', context.role_name)
  console.log('Permissions:', context.permissions)
  // Example permissions:
  // {
  //   settings: 'CRUD',
  //   technical: 'CRUD',
  //   production: 'CRU',
  //   warehouse: 'R'
  // }
}
```

### Implementation Details

**State Management:**
```typescript
const [data, setData] = useState<OrgContext | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)
```

**Fetch Function:**
```typescript
const fetchContext = useCallback(async () => {
  try {
    setIsLoading(true)
    setError(null)
    const response = await fetch('/api/v1/settings/context')

    if (!response.ok) {
      throw new Error('Failed to fetch organization context')
    }

    const context = await response.json()
    setData(context)
  } catch (err) {
    setError(
      err instanceof Error ? err : new Error('Unknown error occurred')
    )
    setData(null)
  } finally {
    setIsLoading(false)
  }
}, [])
```

**Effect Hook:**
```typescript
useEffect(() => {
  fetchContext()
}, [fetchContext])
// Empty dependency array in fetchContext means fetch once on mount
```

### Features

- **Single fetch on mount:** No refetch on re-render
- **Error recovery:** Provides `refetch` function for manual retry
- **Type-safe:** Full TypeScript support with OrgContext type
- **Loading state:** Prevents flicker with isLoading flag
- **Generic errors:** No sensitive data leakage in error messages

### Performance

- **API call:** Single request to `/api/v1/settings/context`
- **Response time:** <100ms (expected)
- **Caching:** No automatic caching (fetch once per mount)
- **Re-renders:** Only when data/error/loading state changes

### Security

- **Authentication:** Endpoint requires valid session
- **Session validation:** Server checks session expiry (Story 01.1)
- **Multi-tenancy:** org_id derived from authenticated user
- **No sensitive exposure:** Generic error messages only

### Testing

**Test File:** `apps/frontend/lib/hooks/__tests__/useOrgContext.test.ts`

**Test Coverage:**
- Fetches context on mount
- Handles loading state
- Handles successful response
- Handles error response
- Refetch function works correctly

---

## useSettingsGuard

**Path:** `apps/frontend/lib/hooks/useSettingsGuard.ts`

Hook for role-based access control in settings pages. Checks if the current user has one of the required roles.

### Purpose

Protects settings routes by checking user's role against allowed roles. Used to block unauthorized users from accessing admin-only pages (client-side guard backed by server-side RLS).

### Signature

```typescript
function useSettingsGuard(
  requiredRole?: RoleCode | RoleCode[]
): {
  allowed: boolean
  loading: boolean
  role: RoleCode | null
}
```

### RoleCode Type

```typescript
type RoleCode =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'production_supervisor'
  | 'production_operator'
  | 'warehouse_manager'
  | 'warehouse_worker'
  | 'quality_manager'
  | 'quality_inspector'
  | 'shipping_clerk'
  | 'viewer'
  | 'custom'
```

### Return Type

```typescript
interface SettingsGuardReturn {
  allowed: boolean       // Whether user has required role
  loading: boolean       // Whether context is loading
  role: RoleCode | null  // User's current role code
}
```

### Usage

**Single Role Requirement:**
```typescript
export default function AdminOnlyPage() {
  const { allowed, loading } = useSettingsGuard('admin')

  if (loading) return <LoadingSkeleton />
  if (!allowed) return <AccessDenied />

  return <AdminContent />
}
```

**Multiple Roles (OR logic):**
```typescript
// User needs owner OR admin role
export default function UsersPage() {
  const { allowed, loading } = useSettingsGuard(['owner', 'admin'])

  if (loading) {
    return (
      <SettingsLayout title="Users">
        <LoadingSkeleton />
      </SettingsLayout>
    )
  }

  if (!allowed) {
    return (
      <SettingsLayout title="Users">
        <AccessDenied />
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout title="Users" description="Manage user accounts">
      <UsersTable />
    </SettingsLayout>
  )
}
```

**No Role Requirement (all authenticated users):**
```typescript
// Any authenticated user can access
export default function PublicSettingsPage() {
  const { allowed, loading } = useSettingsGuard()

  if (loading) return <LoadingSkeleton />

  return <PublicSettingsContent />
}
```

**Using Role Information:**
```typescript
const { allowed, loading, role } = useSettingsGuard(['owner', 'admin'])

if (!loading && role) {
  console.log('Current role:', role)
  // 'owner' | 'admin' | etc.
}
```

**Conditional Rendering Based on Role:**
```typescript
export default function SettingsPage() {
  const { allowed, loading, role } = useSettingsGuard(['owner', 'admin', 'manager'])

  if (loading) return <Skeleton />
  if (!allowed) return <AccessDenied />

  return (
    <div>
      {role === 'owner' && <OwnerControls />}
      {(role === 'owner' || role === 'admin') && <AdminControls />}
      <StandardContent />
    </div>
  )
}
```

### Implementation Details

**Uses useOrgContext:**
```typescript
const { data: context, isLoading } = useOrgContext()
```

**Allowed Logic (Memoized):**
```typescript
const allowed = useMemo(() => {
  if (!context) return false  // Fail-safe: no context = not allowed
  if (!requiredRole) return true  // No role requirement = allow all

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(context.role_code as RoleCode)
}, [context, requiredRole])
```

**Return Values:**
```typescript
return {
  allowed,
  loading: isLoading,
  role: (context?.role_code as RoleCode) || null,
}
```

### Features

- **Flexible role checking:** Single role or array of roles
- **Fail-safe behavior:** Returns false during loading and when context is null
- **Performance optimized:** useMemo prevents unnecessary recalculations
- **Type-safe:** RoleCode type ensures valid role codes
- **OR logic for arrays:** User needs only ONE of the specified roles

### Security

**Multi-Layered Defense:**
1. **Client Guard (this hook):** Prevents navigation and renders access denied
2. **API Authentication:** Server validates session on API calls
3. **RLS Policies:** Database enforces role restrictions (Story 01.1)

**Fail-Safe Design:**
- Returns `false` when context is null
- Returns `false` during loading (prevents flash of unauthorized content)
- Generic access denied messages (no info leakage)

### Common Patterns

**Redirect to Dashboard:**
```typescript
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
  const router = useRouter()
  const { allowed, loading } = useSettingsGuard(['owner', 'admin'])

  useEffect(() => {
    if (!loading && !allowed) {
      router.push('/dashboard')
      toast.error('Access denied')
    }
  }, [allowed, loading, router])

  if (loading) return <Skeleton />
  if (!allowed) return null  // Redirect handles this

  return <Content />
}
```

**Show Different Content by Role:**
```typescript
const { allowed, role } = useSettingsGuard(['owner', 'admin', 'manager'])

return (
  <div>
    {role === 'owner' && <OwnerDashboard />}
    {role === 'admin' && <AdminDashboard />}
    {role === 'manager' && <ManagerDashboard />}
  </div>
)
```

### Testing

**Test File:** `apps/frontend/lib/hooks/__tests__/useSettingsGuard.test.ts`

**Test Coverage:**
- Single role requirement works
- Multiple roles (OR logic) works
- No role requirement allows all
- Returns false during loading
- Returns false when context is null

---

## useSettingsPermissions

**Path:** `apps/frontend/lib/hooks/useSettingsPermissions.ts`

Hook to check user's CRUD permissions for the Settings module.

### Purpose

Provides granular permission checks for Create, Read, Update, Delete operations. Used for conditional UI rendering (show/hide buttons based on permissions).

### Signature

```typescript
function useSettingsPermissions(): {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  loading: boolean
}
```

### Return Type

```typescript
interface SettingsPermissionsReturn {
  canRead: boolean    // Has 'R' permission for settings
  canWrite: boolean   // Has 'U' OR 'C' permission for settings
  canDelete: boolean  // Has 'D' permission for settings
  loading: boolean    // Whether context is loading
}
```

### Usage

**Basic Permission Checks:**
```typescript
function SettingsPage() {
  const { canRead, canWrite, canDelete, loading } = useSettingsPermissions()

  if (loading) return <Skeleton />
  if (!canRead) return <Forbidden />

  return (
    <div>
      <DataDisplay />
      {canWrite && <Button>Edit</Button>}
      {canDelete && <Button variant="destructive">Delete</Button>}
    </div>
  )
}
```

**Conditional Form Rendering:**
```typescript
function OrganizationPage() {
  const { canRead, canWrite, loading } = useSettingsPermissions()

  if (loading) return <LoadingSkeleton />
  if (!canRead) return <Forbidden />

  return (
    <SettingsLayout
      title="Organization Profile"
      description="View and manage organization settings"
    >
      {canWrite ? (
        <OrganizationForm />  // Editable form
      ) : (
        <OrganizationDisplay />  // Read-only display
      )}
    </SettingsLayout>
  )
}
```

**Button Visibility:**
```typescript
function UsersTable() {
  const { canWrite, canDelete } = useSettingsPermissions()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          {(canWrite || canDelete) && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            {(canWrite || canDelete) && (
              <TableCell>
                {canWrite && <Button size="sm">Edit</Button>}
                {canDelete && <Button size="sm" variant="destructive">Delete</Button>}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Combining with Role Guard:**
```typescript
export default function UsersPage() {
  // 1. Check if user can access this page at all
  const { allowed: canAccessPage, loading: guardLoading } = useSettingsGuard(['owner', 'admin'])

  // 2. Check specific CRUD permissions
  const { canRead, canWrite, canDelete, loading: permLoading } = useSettingsPermissions()

  const loading = guardLoading || permLoading

  if (loading) return <LoadingSkeleton />
  if (!canAccessPage) return <AccessDenied />
  if (!canRead) return <Forbidden />

  return (
    <SettingsLayout title="Users" description="Manage user accounts">
      <UsersTable />
      {canWrite && <Button>Add User</Button>}
    </SettingsLayout>
  )
}
```

### Implementation Details

**Uses useOrgContext:**
```typescript
const { data: context, isLoading } = useOrgContext()
```

**Permission Derivation (Memoized):**
```typescript
return useMemo(() => {
  if (!context) {
    return {
      canRead: false,
      canWrite: false,
      canDelete: false,
      loading: isLoading,
    }
  }

  return {
    canRead: hasPermission('settings', 'R', context.permissions),
    canWrite:
      hasPermission('settings', 'U', context.permissions) ||
      hasPermission('settings', 'C', context.permissions),
    canDelete: hasPermission('settings', 'D', context.permissions),
    loading: isLoading,
  }
}, [context, isLoading])
```

**Uses hasPermission Service (Story 01.1):**
```typescript
import { hasPermission } from '@/lib/services/permission-service'

// hasPermission(module, operation, permissions)
// Returns true if user has specified permission for module
```

### Permission Logic

**canRead:**
- Checks for 'R' permission in settings module
- Example: `permissions.settings` contains 'R'

**canWrite:**
- Checks for 'U' OR 'C' permission in settings module
- Rationale: Write operations require either Update or Create capability
- Example: `permissions.settings` contains 'U' or 'C'

**canDelete:**
- Checks for 'D' permission in settings module
- Example: `permissions.settings` contains 'D'

**Permission String Format:**
```typescript
// Example context.permissions object:
{
  settings: 'CRUD',    // Full access
  technical: 'CRU',    // No delete
  production: 'RU',    // Read + Update only
  warehouse: 'R'       // Read-only
}
```

### Features

- **Granular permissions:** Separate checks for Read, Write, Delete
- **Write combines Create + Update:** Logical OR for write operations
- **Fail-safe behavior:** Returns false when context is null
- **Performance optimized:** useMemo prevents unnecessary recalculations
- **Type-safe:** Uses hasPermission service from Story 01.1

### Security

**Multi-Layered Defense:**
1. **Client Check (this hook):** Hides UI elements
2. **API Validation:** Server validates permissions on API calls
3. **RLS Policies:** Database enforces permissions (Story 01.1)

**Fail-Safe Design:**
- Returns all false when context is null
- UI elements hidden before permissions loaded
- Server-side validation backs up client checks

### Common Patterns

**Read-Only Mode:**
```typescript
const { canWrite } = useSettingsPermissions()

return (
  <Form>
    <Input disabled={!canWrite} />
    <Textarea disabled={!canWrite} />
    {canWrite && <Button type="submit">Save</Button>}
  </Form>
)
```

**Action Menu:**
```typescript
const { canWrite, canDelete } = useSettingsPermissions()

return (
  <DropdownMenu>
    <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>View</DropdownMenuItem>
      {canWrite && <DropdownMenuItem>Edit</DropdownMenuItem>}
      {canDelete && (
        <DropdownMenuItem className="text-destructive">
          Delete
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
)
```

**Conditional Page Access:**
```typescript
export default function SettingsPage() {
  const { canRead, loading } = useSettingsPermissions()

  if (loading) return <Skeleton />
  if (!canRead) {
    return (
      <div className="p-6 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to view this page.
        </p>
      </div>
    )
  }

  return <SettingsContent />
}
```

### Testing

**Test File:** `apps/frontend/lib/hooks/__tests__/useSettingsPermissions.test.ts`

**Test Coverage:**
- canRead checks 'R' permission
- canWrite checks 'U' OR 'C' permission
- canDelete checks 'D' permission
- Returns false when context is null
- Loading state handled correctly

---

## Hook Composition

### Typical Settings Page Pattern

```typescript
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { useSettingsGuard } from '@/lib/hooks/useSettingsGuard'
import { useSettingsPermissions } from '@/lib/hooks/useSettingsPermissions'

export default function SettingsPage() {
  // 1. Get organization context (used by other hooks)
  const { data: context, isLoading, error, refetch } = useOrgContext()

  // 2. Check route access (role-based)
  const { allowed, loading: guardLoading } = useSettingsGuard(['owner', 'admin'])

  // 3. Check CRUD permissions (feature-based)
  const { canRead, canWrite, canDelete, loading: permLoading } = useSettingsPermissions()

  // Combine loading states
  const loading = isLoading || guardLoading || permLoading

  // Handle states in order
  if (loading) {
    return <SettingsNavSkeleton />
  }

  if (error) {
    return <SettingsErrorState error={error} onRetry={refetch} />
  }

  if (!allowed) {
    return <AccessDeniedPage />
  }

  if (!canRead) {
    return <ForbiddenPage />
  }

  // Render page with conditional features
  return (
    <SettingsLayout
      title="Page Title"
      description="Page description"
    >
      <Content />
      {canWrite && <EditButton />}
      {canDelete && <DeleteButton />}
    </SettingsLayout>
  )
}
```

### Hook Dependency Chain

```
useOrgContext
    ↓ (provides context)
    ├─→ useSettingsGuard (checks role)
    └─→ useSettingsPermissions (checks CRUD)
```

All three hooks can be used independently, but they share the same org context data source.

---

## Performance Considerations

### Rendering Optimization

**useMemo in Guards:**
```typescript
// Both useSettingsGuard and useSettingsPermissions use useMemo
const allowed = useMemo(() => {
  // ... permission logic
}, [context, requiredRole])
```

**Benefits:**
- Prevents unnecessary recalculations
- Only re-runs when dependencies change
- Reduces component re-renders

### API Calls

**Single Fetch:**
- useOrgContext fetches once on mount
- All hooks share same context data
- No duplicate API calls

**Expected Performance:**
- Context fetch: ~100ms
- Permission checks: <1ms (client-side)
- Total overhead: ~100ms per page

---

## Error Handling

### Common Error Patterns

**Network Errors:**
```typescript
const { error, refetch } = useOrgContext()

if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
      <Button onClick={refetch} variant="outline" size="sm">
        Retry
      </Button>
    </Alert>
  )
}
```

**Session Expiry:**
```typescript
// Server returns 401 when session expired
// useOrgContext catches this as error
// Redirect to login handled by middleware
```

**Permission Denied:**
```typescript
const { canRead } = useSettingsPermissions()

if (!canRead) {
  return (
    <div className="p-6 text-center">
      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-xl font-semibold mb-2">Insufficient Permissions</h2>
      <p className="text-muted-foreground">
        Contact your administrator to request access.
      </p>
    </div>
  )
}
```

---

## Related Documentation

- [Settings Navigation Components](../components/settings/settings-navigation.md)
- [Settings Navigation Guide](../guides/settings-navigation-guide.md)
- [Permission Service](../../services/permission-service.md) - hasPermission function
- [Org Context Service](../../services/org-context-service.md) - Server-side context resolution
- [Story 01.2 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.2.settings-shell-navigation.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-17 | Initial release (Story 01.2) |

---

**Last Updated:** 2025-12-17
**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Status:** Production Ready
