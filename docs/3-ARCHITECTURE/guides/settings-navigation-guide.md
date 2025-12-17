# Settings Navigation Guide

**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Audience:** Frontend Developers
**Version:** 1.0.0

---

## Introduction

This guide teaches you how to work with the Settings navigation system. You'll learn how to add new settings pages, protect them with role guards, and integrate them into the navigation sidebar.

**What You'll Learn:**
1. How Settings navigation works
2. Adding new navigation items
3. Protecting pages with role guards
4. Using permissions for conditional UI
5. Testing role-based access
6. Troubleshooting common issues

---

## How Settings Navigation Works

### Architecture Overview

```
Settings Module Layout (app/(authenticated)/settings/layout.tsx)
  ├─ SettingsNav (sidebar)
  │   ├─ useOrgContext (fetch user context)
  │   ├─ buildSettingsNavigation (filter by role + modules)
  │   └─ SettingsNavItem (render links)
  │
  └─ Main Content Area
      └─ Settings Pages
          ├─ useSettingsGuard (role check)
          ├─ useSettingsPermissions (CRUD check)
          └─ SettingsLayout (page wrapper)
```

### Navigation Filtering

**Two-Layer Filtering:**

1. **Role Filtering:** User sees only items their role can access
2. **Module Filtering:** User sees only items for enabled modules

**Example:**

```typescript
// Warehouse Manager with warehouse module enabled
Context: { role_code: 'warehouse_manager', permissions: { settings: 'R', warehouse: 'CRUD' } }
Navigation: Shows "Warehouses" item only

// Admin with all modules enabled
Context: { role_code: 'admin', permissions: { settings: 'CRUD', ... } }
Navigation: Shows all 14 items across 6 sections
```

---

## Adding a New Navigation Item

### Step 1: Add Item to Navigation Schema

**File:** `apps/frontend/lib/services/settings-navigation-service.ts`

**Location:** Find the appropriate section in `NAVIGATION_SCHEMA` array.

**Example: Adding "Departments" to "Organization" section**

```typescript
const NAVIGATION_SCHEMA: NavigationSection[] = [
  {
    section: 'Organization',
    items: [
      {
        name: 'Organization Profile',
        path: '/settings/organization',
        icon: Building2,
        implemented: true,
        roles: ['owner', 'admin'],
      },
      // ADD NEW ITEM HERE
      {
        name: 'Departments',
        path: '/settings/departments',
        icon: Building,  // Import from lucide-react
        implemented: true,  // Set to false if not ready yet
        roles: ['owner', 'admin'],  // Who can access this page
      },
    ],
  },
  // ... other sections
]
```

**NavigationItem Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| name | string | Yes | Display label for the item |
| path | string | Yes | Route path (must start with /settings/) |
| icon | LucideIcon | Yes | Lucide React icon component |
| implemented | boolean | Yes | true = clickable link, false = "Soon" badge |
| roles | string[] | No | Array of roles that can see this item. Omit for all roles. |
| module | string | No | Module key (e.g., 'warehouse'). Item hidden if module disabled. |

**Common Role Combinations:**

```typescript
// Admin-only pages
roles: ['owner', 'admin']

// Manager-level access
roles: ['owner', 'admin', 'manager', 'production_supervisor']

// Warehouse team
roles: ['owner', 'admin', 'warehouse_manager', 'warehouse_worker']

// All authenticated users (omit roles property)
// roles: undefined
```

### Step 2: Import the Icon

**Add icon import at top of file:**

```typescript
import {
  Building2,
  Users,
  Shield,
  Building,  // ADD THIS
  // ... other icons
  type LucideIcon,
} from 'lucide-react'
```

**Find Icons:** Browse [Lucide Icons](https://lucide.dev/icons/) for available icons.

### Step 3: Create the Page

**File:** `apps/frontend/app/(authenticated)/settings/departments/page.tsx`

**Example Implementation:**

```typescript
'use client'

import { useSettingsGuard } from '@/lib/hooks/useSettingsGuard'
import { useSettingsPermissions } from '@/lib/hooks/useSettingsPermissions'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { AccessDenied } from '@/components/ui/access-denied'
import { Forbidden } from '@/components/ui/forbidden'

export default function DepartmentsPage() {
  // 1. Check if user's role can access this page
  const { allowed, loading: guardLoading } = useSettingsGuard(['owner', 'admin'])

  // 2. Check CRUD permissions for conditional UI
  const { canRead, canWrite, canDelete, loading: permLoading } = useSettingsPermissions()

  const loading = guardLoading || permLoading

  // 3. Handle loading state
  if (loading) {
    return (
      <SettingsLayout title="Departments">
        <LoadingSkeleton />
      </SettingsLayout>
    )
  }

  // 4. Handle access denied (wrong role)
  if (!allowed) {
    return (
      <SettingsLayout title="Departments">
        <AccessDenied />
      </SettingsLayout>
    )
  }

  // 5. Handle forbidden (no read permission)
  if (!canRead) {
    return (
      <SettingsLayout title="Departments">
        <Forbidden />
      </SettingsLayout>
    )
  }

  // 6. Render page content
  return (
    <SettingsLayout
      title="Departments"
      description="Manage organizational departments and teams"
    >
      <DepartmentsContent canWrite={canWrite} canDelete={canDelete} />
    </SettingsLayout>
  )
}
```

### Step 4: Test the Navigation Item

**Manual Testing:**

1. **As Admin:**
   - Navigate to `/settings`
   - Verify "Departments" appears in navigation
   - Click link and verify page loads

2. **As Viewer:**
   - Navigate to `/settings`
   - Verify "Departments" does NOT appear (if roles: ['owner', 'admin'])
   - Try direct URL `/settings/departments`
   - Verify access denied page shows

3. **With Module Disabled:**
   - If item has `module` property, disable that module
   - Verify item disappears from navigation

**Browser DevTools Check:**

```javascript
// In browser console, check navigation structure
const nav = document.querySelector('nav')
console.log(nav.textContent)  // Should include "Departments" for admin
```

---

## Protecting a Page with Role Guards

### Basic Role Guard

**Single Role Requirement:**

```typescript
export default function AdminOnlyPage() {
  const { allowed, loading } = useSettingsGuard('admin')

  if (loading) return <LoadingSkeleton />
  if (!allowed) return <AccessDenied />

  return <AdminContent />
}
```

### Multiple Roles (OR Logic)

**User needs ONE of the specified roles:**

```typescript
export default function ManagerPage() {
  // User needs owner OR admin OR manager role
  const { allowed, loading } = useSettingsGuard(['owner', 'admin', 'manager'])

  if (loading) return <LoadingSkeleton />
  if (!allowed) return <AccessDenied />

  return <ManagerContent />
}
```

### No Role Requirement

**Allow all authenticated users:**

```typescript
export default function PublicSettingsPage() {
  // No role check - all authenticated users allowed
  const { allowed, loading } = useSettingsGuard()

  if (loading) return <LoadingSkeleton />

  return <PublicContent />
}
```

### Redirect on Access Denied

**Redirect to dashboard instead of showing access denied:**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function ProtectedPage() {
  const router = useRouter()
  const { allowed, loading } = useSettingsGuard(['owner', 'admin'])

  useEffect(() => {
    if (!loading && !allowed) {
      toast.error('You do not have permission to access this page')
      router.push('/dashboard')
    }
  }, [allowed, loading, router])

  if (loading) return <LoadingSkeleton />
  if (!allowed) return null  // Will redirect

  return <Content />
}
```

---

## Using Permissions for Conditional UI

### Basic CRUD Checks

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

### Read-Only vs Editable Forms

```typescript
function OrganizationForm() {
  const { canWrite } = useSettingsPermissions()

  return (
    <Form>
      <Input
        name="organization_name"
        disabled={!canWrite}
      />
      <Textarea
        name="description"
        disabled={!canWrite}
      />
      {canWrite && (
        <Button type="submit">Save Changes</Button>
      )}
    </Form>
  )
}
```

### Conditional Table Actions

```typescript
function UsersTable() {
  const { canWrite, canDelete } = useSettingsPermissions()

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Email</TableCell>
          {(canWrite || canDelete) && <TableCell>Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            {(canWrite || canDelete) && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
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
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Combine Role and Permission Checks

```typescript
export default function AdvancedPage() {
  // Check role access first
  const { allowed, role } = useSettingsGuard(['owner', 'admin', 'manager'])

  // Then check CRUD permissions
  const { canWrite, canDelete } = useSettingsPermissions()

  if (!allowed) return <AccessDenied />

  return (
    <div>
      {/* Owner-specific controls */}
      {role === 'owner' && <OwnerControls />}

      {/* Admin or Owner controls */}
      {(role === 'owner' || role === 'admin') && <AdminControls />}

      {/* Permission-based controls */}
      {canWrite && <EditControls />}
      {canDelete && <DeleteControls />}

      {/* Always visible content */}
      <StandardContent />
    </div>
  )
}
```

---

## Adding Module-Based Filtering

### Example: Warehouse-Specific Item

**Navigation Schema:**

```typescript
{
  section: 'Infrastructure',
  items: [
    {
      name: 'Warehouses',
      path: '/settings/warehouses',
      icon: Warehouse,
      implemented: true,
      roles: ['owner', 'admin', 'warehouse_manager'],
      module: 'warehouse',  // Item only visible if warehouse module enabled
    },
  ]
}
```

**Behavior:**

- If `context.permissions.warehouse` exists → Item visible
- If `context.permissions.warehouse` is undefined → Item hidden

**Example Context:**

```typescript
// Warehouse module enabled
{
  permissions: {
    settings: 'CRUD',
    warehouse: 'CRUD',  // Module is enabled
    production: 'R'
  }
}
// Result: "Warehouses" item visible

// Warehouse module disabled
{
  permissions: {
    settings: 'CRUD',
    production: 'R'
    // warehouse missing
  }
}
// Result: "Warehouses" item hidden
```

---

## Testing Role-Based Access

### Manual Testing Checklist

**Test Matrix:**

| Page | Owner | Admin | Manager | Viewer | Expected Behavior |
|------|-------|-------|---------|--------|-------------------|
| Organization | ✅ | ✅ | ❌ | ❌ | Admin+ only |
| Users | ✅ | ✅ | ❌ | ❌ | Admin+ only |
| Warehouses | ✅ | ✅ | ✅ (warehouse_manager) | ❌ | Manager+ with module |

**Testing Steps:**

1. **Login as each role**
2. **Navigate to `/settings`**
3. **Verify navigation items:**
   - Items appear/disappear based on role
   - Active state highlights correctly
   - Unimplemented items show "Soon" badge
4. **Click each visible item:**
   - Page loads correctly
   - No console errors
5. **Try direct URL access:**
   - Navigate to protected route URL directly
   - Verify access denied for unauthorized roles

### Automated Testing

**Unit Test Example:**

```typescript
// __tests__/pages/settings/departments.test.tsx
import { render, screen } from '@testing-library/react'
import { useSettingsGuard } from '@/lib/hooks/useSettingsGuard'
import DepartmentsPage from '@/app/(authenticated)/settings/departments/page'

jest.mock('@/lib/hooks/useSettingsGuard')

describe('DepartmentsPage', () => {
  it('shows access denied for non-admin users', () => {
    // Mock viewer role
    (useSettingsGuard as jest.Mock).mockReturnValue({
      allowed: false,
      loading: false,
      role: 'viewer'
    })

    render(<DepartmentsPage />)

    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('shows content for admin users', () => {
    // Mock admin role
    (useSettingsGuard as jest.Mock).mockReturnValue({
      allowed: true,
      loading: false,
      role: 'admin'
    })

    render(<DepartmentsPage />)

    expect(screen.getByText(/departments/i)).toBeInTheDocument()
  })
})
```

**Integration Test Example:**

```typescript
// __tests__/integration/settings-navigation.test.ts
import { expect, test } from '@playwright/test'

test.describe('Settings Navigation', () => {
  test('admin sees all navigation items', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navigate to settings
    await page.goto('/settings')

    // Verify all sections visible
    await expect(page.locator('text=Organization')).toBeVisible()
    await expect(page.locator('text=Users & Roles')).toBeVisible()
    await expect(page.locator('text=Infrastructure')).toBeVisible()

    // Verify specific items
    await expect(page.locator('text=Organization Profile')).toBeVisible()
    await expect(page.locator('text=Users')).toBeVisible()
  })

  test('viewer sees limited navigation', async ({ page }) => {
    // Login as viewer
    await page.goto('/login')
    await page.fill('[name="email"]', 'viewer@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navigate to settings
    await page.goto('/settings')

    // Verify admin items not visible
    await expect(page.locator('text=Users')).not.toBeVisible()
    await expect(page.locator('text=Roles & Permissions')).not.toBeVisible()
  })

  test('direct URL access blocked for unauthorized users', async ({ page }) => {
    // Login as viewer
    await page.goto('/login')
    await page.fill('[name="email"]', 'viewer@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Try to access admin-only page directly
    await page.goto('/settings/users')

    // Verify access denied
    await expect(page.locator('text=/access denied/i')).toBeVisible()
  })
})
```

---

## Troubleshooting

### Issue: Navigation Item Not Appearing

**Possible Causes:**

1. **Role mismatch:** User's role not in `roles` array
2. **Module disabled:** Module specified but not enabled
3. **Section empty:** All items in section filtered out
4. **Typo in role code:** Check role code matches exactly

**Debug Steps:**

```typescript
// Add debug logging in SettingsNav component
const navigation = buildSettingsNavigation(context)
console.log('User role:', context.role_code)
console.log('User permissions:', context.permissions)
console.log('Navigation sections:', navigation)
```

**Check in Browser Console:**

```javascript
// Inspect org context
fetch('/api/v1/settings/context')
  .then(res => res.json())
  .then(context => {
    console.log('Role:', context.role_code)
    console.log('Permissions:', context.permissions)
  })
```

### Issue: Page Shows Access Denied Incorrectly

**Possible Causes:**

1. **Role guard mismatch:** `roles` in navigation doesn't match `useSettingsGuard` call
2. **Missing role in array:** Role exists but not in allowed array
3. **Context loading:** Page renders before context loads

**Fix:**

```typescript
// Ensure roles match
// In navigation schema:
roles: ['owner', 'admin', 'manager']

// In page component:
const { allowed } = useSettingsGuard(['owner', 'admin', 'manager'])
// Make sure both arrays are identical
```

### Issue: "Soon" Badge Not Showing

**Cause:** `implemented: true` should be `implemented: false`

**Fix:**

```typescript
{
  name: 'Invitations',
  path: '/settings/invitations',
  icon: Mail,
  implemented: false,  // Set to false for unimplemented routes
  roles: ['owner', 'admin'],
}
```

### Issue: Module Filtering Not Working

**Possible Causes:**

1. **Module key typo:** `module: 'warehouses'` should be `module: 'warehouse'`
2. **Module not in permissions:** Check `context.permissions` object
3. **Module disabled for org:** Check `organization_modules` table

**Debug Steps:**

```typescript
// Check module permissions
console.log('Permissions:', context.permissions)
// Should see: { warehouse: 'CRUD', ... }

// If missing, check database
SELECT * FROM organization_modules WHERE org_id = '...' AND module_id = (
  SELECT id FROM modules WHERE module_key = 'warehouse'
);
```

### Issue: Navigation Not Updating After Role Change

**Cause:** Org context cached in component state

**Fix:**

```typescript
// Force refetch after role change
const { refetch } = useOrgContext()

// After role update API call:
await updateUserRole(userId, newRole)
await refetch()  // Re-fetch org context
```

### Issue: TypeScript Error on Icon Import

**Error:**
```
Type 'LucideIcon' is not assignable to type 'ComponentType<any>'
```

**Fix:**

```typescript
// Import type from lucide-react
import {
  Building2,
  Users,
  type LucideIcon,  // Import as type
} from 'lucide-react'

// Use in interface
interface NavigationItem {
  icon: LucideIcon
  // ...
}
```

---

## Best Practices

### 1. Always Match Navigation and Page Guards

```typescript
// ❌ BAD - Roles don't match
// In navigation:
roles: ['owner', 'admin']

// In page:
const { allowed } = useSettingsGuard(['owner'])  // Missing admin!

// ✅ GOOD - Roles match
// In navigation:
roles: ['owner', 'admin']

// In page:
const { allowed } = useSettingsGuard(['owner', 'admin'])
```

### 2. Use Consistent Role Order

```typescript
// ✅ GOOD - Consistent order across codebase
roles: ['owner', 'admin', 'manager']
// Not: ['admin', 'owner', 'manager']
```

### 3. Handle All Loading States

```typescript
// ✅ GOOD - Handle loading, error, and success states
if (loading) return <Skeleton />
if (error) return <ErrorState error={error} onRetry={refetch} />
if (!allowed) return <AccessDenied />
return <Content />
```

### 4. Use Descriptive Navigation Labels

```typescript
// ❌ BAD
name: 'Config'

// ✅ GOOD
name: 'Organization Profile'
```

### 5. Group Related Items in Sections

```typescript
// ✅ GOOD - Logical grouping
{
  section: 'Users & Roles',
  items: [
    { name: 'Users', ... },
    { name: 'Roles & Permissions', ... },
    { name: 'Invitations', ... },
  ]
}
```

### 6. Use Module Filtering for Optional Features

```typescript
// ✅ GOOD - Hide warehouse items when module disabled
{
  name: 'Warehouses',
  module: 'warehouse',
  roles: ['owner', 'admin', 'warehouse_manager']
}
```

### 7. Test with Multiple Roles

Always test new pages with:
- Owner (full access)
- Admin (full access)
- Manager (partial access)
- Viewer (read-only)

---

## Quick Reference

### Role Codes

```typescript
'owner'                   // Full system access
'admin'                   // Administrative access
'manager'                 // Department management
'production_supervisor'   // Production oversight
'production_operator'     // Execute production
'warehouse_manager'       // Warehouse management
'warehouse_worker'        // Warehouse operations
'quality_manager'         // Quality management
'quality_inspector'       // Quality control
'shipping_clerk'          // Shipping operations
'viewer'                  // Read-only access
'custom'                  // Custom role placeholder
```

### Module Keys

```typescript
'settings'        // Cannot disable
'technical'       // Cannot disable
'planning'        // Can disable
'production'      // Can disable
'warehouse'       // Can disable
'quality'         // Can disable
'shipping'        // Can disable
'npd'             // Can disable
'finance'         // Can disable
'oee'             // Can disable
'integrations'    // Can disable
```

### Common Role Combinations

```typescript
// Admin-only
['owner', 'admin']

// Managers and above
['owner', 'admin', 'manager', 'production_supervisor']

// Warehouse team
['owner', 'admin', 'warehouse_manager', 'warehouse_worker']

// Production team
['owner', 'admin', 'production_supervisor', 'production_operator']

// Quality team
['owner', 'admin', 'quality_manager', 'quality_inspector']
```

---

## Related Documentation

- [Settings Navigation Components](../components/settings/settings-navigation.md)
- [Settings Hooks](../hooks/settings-hooks.md)
- [Permission Service](../../services/permission-service.md)
- [Story 01.2 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.2.settings-shell-navigation.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-17 | Initial guide created |

---

**Last Updated:** 2025-12-17
**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Status:** Production Ready
