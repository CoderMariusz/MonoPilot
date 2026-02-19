# Developer Guide: Permission Checks

**Story:** 01.1 - Org Context + Base RLS
**Last Updated:** 2025-12-17
**Audience:** Backend and Frontend developers

## Overview

This guide explains how to implement permission checks in MonoPilot using the permission service. Proper permission checking ensures users can only perform operations they're authorized for, implementing least-privilege access control.

**Critical:** All write operations (CREATE, UPDATE, DELETE) MUST check permissions before execution. Read operations should check permissions when displaying sensitive data.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Permission System Overview](#permission-system-overview)
3. [Permission Service Functions](#permission-service-functions)
4. [API Route Patterns](#api-route-patterns)
5. [Frontend Patterns](#frontend-patterns)
6. [Role Hierarchy](#role-hierarchy)
7. [Module Permissions](#module-permissions)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Testing Permission Checks](#testing-permission-checks)

---

## Quick Start

### Basic Permission Check Pattern

```typescript
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { hasPermission, hasAdminAccess } from '@/lib/services/permission-service'
import { ForbiddenError } from '@/lib/errors/forbidden-error'

export async function POST(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Check permission before proceeding
    if (!hasPermission('production', 'C', context.permissions)) {
      throw new ForbiddenError('Insufficient permissions to create work orders')
    }

    // Proceed with operation
    const body = await request.json()
    // ... create work order
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## Permission System Overview

### Permission Format

Permissions are stored as JSONB in the roles table and included in org context:

```typescript
interface OrgContext {
  permissions: Record<string, string>
  // Example:
  // {
  //   "settings": "CRUD",
  //   "technical": "CRUD",
  //   "planning": "CRU",
  //   "production": "R",
  //   "warehouse": "-"
  // }
}
```

### Permission Characters

| Character | Operation | Description |
|-----------|-----------|-------------|
| `C` | Create | User can create new records |
| `R` | Read | User can view records |
| `U` | Update | User can modify existing records |
| `D` | Delete | User can delete records |
| `-` | None | User has no access to module |

### Permission String Examples

```typescript
"CRUD"  // Full access (all operations)
"CR"    // Create and Read only (no update or delete)
"R"     // Read-only access
"CRU"   // Create, Read, Update (no delete)
"-"     // No access (module disabled for role)
""      // No access (empty string)
```

---

## Permission Service Functions

### hasPermission()

Checks if user has permission for a specific module and operation.

```typescript
hasPermission(
  module: string,
  operation: 'C' | 'R' | 'U' | 'D',
  permissions: Record<string, string>
): boolean
```

**Parameters:**
- `module` - Module code (e.g., "settings", "production", "warehouse")
- `operation` - CRUD operation to check
- `permissions` - User's permissions object from context

**Returns:** `true` if user has permission, `false` otherwise

**Example:**
```typescript
const context = await getOrgContext(userId)

// Check if user can create products
if (hasPermission('technical', 'C', context.permissions)) {
  // User can create products
}

// Check if user can update work orders
if (hasPermission('planning', 'U', context.permissions)) {
  // User can update work orders
}

// Check if user can delete shipments
if (hasPermission('shipping', 'D', context.permissions)) {
  // User can delete shipments
}

// Check if user can read quality records
if (hasPermission('quality', 'R', context.permissions)) {
  // User can view quality records
}
```

### hasAdminAccess()

Checks if user has admin-level access (owner or admin role).

```typescript
hasAdminAccess(roleCode: string): boolean
```

**Parameters:**
- `roleCode` - User's role code from context

**Returns:** `true` if user is owner or admin, `false` otherwise

**Example:**
```typescript
const context = await getOrgContext(userId)

if (hasAdminAccess(context.role_code)) {
  // User can modify organization settings
  // User can manage users
  // User can modify roles
}
```

**Admin Roles:**
- `owner` - Organization owner (full access)
- `admin` - Administrator (full access)

### canModifyOrganization()

Checks if user can modify organization settings.

```typescript
canModifyOrganization(roleCode: string): boolean
```

**Parameters:**
- `roleCode` - User's role code from context

**Returns:** `true` if user can modify organization, `false` otherwise

**Example:**
```typescript
const context = await getOrgContext(userId)

if (canModifyOrganization(context.role_code)) {
  // Allow organization update
  await updateOrganization(body)
} else {
  throw new ForbiddenError('Only admins can modify organization settings')
}
```

**Note:** This is an alias for `hasAdminAccess()` - only owner and admin roles can modify organization.

### canModifyUsers()

Checks if user can manage users (create, update, delete).

```typescript
canModifyUsers(roleCode: string): boolean
```

**Parameters:**
- `roleCode` - User's role code from context

**Returns:** `true` if user can manage users, `false` otherwise

**Example:**
```typescript
const context = await getOrgContext(userId)

if (canModifyUsers(context.role_code)) {
  // Allow user creation/update/deletion
  await createUser(body)
} else {
  throw new ForbiddenError('Only admins can manage users')
}
```

**Note:** This is an alias for `hasAdminAccess()` - only owner and admin roles can manage users.

### isSystemRole()

Checks if a role is a system role (immutable, cannot be modified or deleted).

```typescript
isSystemRole(roleCode: string): boolean
```

**Parameters:**
- `roleCode` - Role code to check

**Returns:** `true` if role is a system role, `false` otherwise

**Example:**
```typescript
if (isSystemRole(role.code)) {
  throw new ForbiddenError('Cannot modify system roles')
}

// Proceed with custom role modification
await updateRole(roleId, body)
```

**System Roles (10 total):**
- `owner`
- `admin`
- `production_manager`
- `quality_manager`
- `warehouse_manager`
- `production_operator`
- `warehouse_operator`
- `quality_inspector`
- `planner`
- `viewer`

---

## API Route Patterns

### Pattern 1: Check Permission Before Create

```typescript
export async function POST(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Check create permission
    if (!hasPermission('production', 'C', context.permissions)) {
      throw new ForbiddenError('Cannot create work orders')
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        org_id: context.org_id,
        created_by: context.user_id,
        ...body
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 2: Check Permission Before Update

```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Check update permission
    if (!hasPermission('technical', 'U', context.permissions)) {
      throw new ForbiddenError('Cannot update products')
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('products')
      .update({
        ...body,
        updated_by: context.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('org_id', context.org_id)
      .select()
      .single()

    if (error) {
      throw new NotFoundError('Product not found')
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 3: Check Permission Before Delete

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Check delete permission
    if (!hasPermission('warehouse', 'D', context.permissions)) {
      throw new ForbiddenError('Cannot delete license plates')
    }

    const { error } = await supabase
      .from('license_plates')
      .delete()
      .eq('id', params.id)
      .eq('org_id', context.org_id)

    if (error) {
      throw new NotFoundError('License plate not found')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 4: Admin-Only Operations

```typescript
export async function PUT(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Admin-only operation
    if (!hasAdminAccess(context.role_code)) {
      throw new ForbiddenError('Admin access required')
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: body.name,
        timezone: body.timezone,
        locale: body.locale,
        currency: body.currency
      })
      .eq('id', context.org_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 5: Read Permission Check (Optional)

```typescript
export async function GET(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Optional: Check read permission for sensitive data
    if (!hasPermission('finance', 'R', context.permissions)) {
      throw new ForbiddenError('Cannot view financial data')
    }

    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('org_id', context.org_id)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## Frontend Patterns

### Pattern 1: Conditional Button Rendering

```typescript
import { hasPermission } from '@/lib/services/permission-service'
import { useOrgContext } from '@/hooks/useOrgContext'

export default function ProductsPage() {
  const { context } = useOrgContext()

  return (
    <div>
      <h1>Products</h1>

      {/* Show Create button only if user has create permission */}
      {hasPermission('technical', 'C', context?.permissions) && (
        <Button onClick={handleCreate}>Create Product</Button>
      )}

      <ProductList />
    </div>
  )
}
```

### Pattern 2: Conditional Actions in Table

```typescript
export function ProductTable({ products }: { products: Product[] }) {
  const { context } = useOrgContext()

  const canUpdate = hasPermission('technical', 'U', context?.permissions)
  const canDelete = hasPermission('technical', 'D', context?.permissions)

  return (
    <Table>
      {products.map(product => (
        <TableRow key={product.id}>
          <TableCell>{product.name}</TableCell>
          <TableCell>
            {/* Show Edit button only if user can update */}
            {canUpdate && (
              <Button onClick={() => handleEdit(product.id)}>Edit</Button>
            )}

            {/* Show Delete button only if user can delete */}
            {canDelete && (
              <Button onClick={() => handleDelete(product.id)}>Delete</Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </Table>
  )
}
```

### Pattern 3: Conditional Section Rendering

```typescript
import { hasAdminAccess } from '@/lib/services/permission-service'

export default function SettingsPage() {
  const { context } = useOrgContext()

  return (
    <div>
      {/* Show to all users */}
      <ProfileSection />

      {/* Show only to admins */}
      {hasAdminAccess(context?.role_code) && (
        <>
          <OrganizationSettings />
          <UserManagement />
          <RoleManagement />
        </>
      )}
    </div>
  )
}
```

### Pattern 4: Permission-Based Navigation

```typescript
export function Navigation() {
  const { context } = useOrgContext()

  return (
    <nav>
      {/* Always show Settings */}
      <NavLink href="/settings">Settings</NavLink>

      {/* Show only if user has read permission */}
      {hasPermission('technical', 'R', context?.permissions) && (
        <NavLink href="/technical">Technical Data</NavLink>
      )}

      {hasPermission('production', 'R', context?.permissions) && (
        <NavLink href="/production">Production</NavLink>
      )}

      {hasPermission('warehouse', 'R', context?.permissions) && (
        <NavLink href="/warehouse">Warehouse</NavLink>
      )}

      {/* Show only to admins */}
      {hasAdminAccess(context?.role_code) && (
        <NavLink href="/admin">Admin</NavLink>
      )}
    </nav>
  )
}
```

### Pattern 5: Disabled Form Fields

```typescript
export function ProductForm({ product }: { product: Product }) {
  const { context } = useOrgContext()
  const canUpdate = hasPermission('technical', 'U', context?.permissions)

  return (
    <form>
      <Input
        name="name"
        value={product.name}
        disabled={!canUpdate}  // Disable if no update permission
      />

      <Input
        name="code"
        value={product.code}
        disabled={!canUpdate}
      />

      {canUpdate && (
        <Button type="submit">Save Changes</Button>
      )}
    </form>
  )
}
```

---

## Role Hierarchy

### System Roles (10 Roles)

MonoPilot includes 10 predefined system roles. These roles are seeded at installation and cannot be modified or deleted.

| Role Code | Role Name | Typical Permissions | Use Case |
|-----------|-----------|---------------------|----------|
| `owner` | Owner | Full CRUD on all modules | Organization owner |
| `admin` | Administrator | Full CRUD on all modules | System administrator |
| `production_manager` | Production Manager | CRUD on production, planning, warehouse | Oversees production |
| `quality_manager` | Quality Manager | CRUD on quality, production (read) | Quality control lead |
| `warehouse_manager` | Warehouse Manager | CRUD on warehouse, shipping | Warehouse supervisor |
| `production_operator` | Production Operator | CRU on production, R on planning | Executes production |
| `warehouse_operator` | Warehouse Operator | CRU on warehouse, R on shipping | Handles inventory |
| `quality_inspector` | Quality Inspector | CR on quality, R on production | Performs inspections |
| `planner` | Planner | CRUD on planning, R on production | Creates work orders |
| `viewer` | Viewer | R on all modules | Read-only access |

### Permission Matrix

**Default permissions for system roles (Story 01.1 - Basic Setup):**

| Module | Owner | Admin | Manager | Operator | Viewer |
|--------|-------|-------|---------|----------|--------|
| Settings | CRUD | CRUD | R | R | R |
| Technical | CRUD | CRUD | CRUD | R | R |
| Planning | CRUD | CRUD | CRUD | CRU | R |
| Production | CRUD | CRUD | CRUD | CRU | R |
| Warehouse | CRUD | CRUD | CRUD | CRU | R |
| Quality | CRUD | CRUD | CRUD | CR | R |
| Shipping | CRUD | CRUD | CRUD | CR | R |

**Note:** Full permission matrix (including custom roles) will be implemented in Story 01.6.

---

## Module Permissions

### 11 Modules

| Module | Code | Description | Typical Operations |
|--------|------|-------------|-------------------|
| Settings | `settings` | Organization settings, users, roles | Admin only |
| Technical Data | `technical` | Products, BOMs, routings | Create, update products |
| Planning | `planning` | Work orders, purchase orders | Create WOs, schedule |
| Production | `production` | Execute WOs, record outputs | Execute, pause, complete |
| Warehouse | `warehouse` | Inventory, license plates | Receive, move, adjust |
| Quality | `quality` | Inspections, holds, NCRs | Inspect, hold, release |
| Shipping | `shipping` | Sales orders, shipments | Pick, pack, ship |
| NPD | `npd` | New product development | Formulate, test |
| Finance | `finance` | Costing, invoicing | Calculate costs |
| OEE | `oee` | Overall Equipment Effectiveness | Track downtime |
| Integrations | `integrations` | API connections | Configure APIs |

### Permission Guidelines by Module

**Settings Module:**
- Admin access required for all write operations
- Regular users can view their own profile
- Only owner/admin can modify organization

**Technical Module:**
- Create/update products (technical team)
- View BOMs (production team)
- Manage routings (engineering team)

**Production Module:**
- Create work orders (planners)
- Execute work orders (operators)
- Pause/resume (operators)
- Complete work orders (supervisors)

**Warehouse Module:**
- Receive inventory (warehouse operators)
- Move inventory (warehouse operators)
- Adjust inventory (warehouse managers)

**Quality Module:**
- Perform inspections (quality inspectors)
- Create holds (quality inspectors)
- Release holds (quality managers)

---

## Best Practices

### 1. Always Check Permissions Before Write Operations

```typescript
// ✅ GOOD: Check permission first
if (!hasPermission('production', 'C', context.permissions)) {
  throw new ForbiddenError('Cannot create work orders')
}

await createWorkOrder(body)

// ❌ BAD: No permission check
await createWorkOrder(body)  // Any user can create!
```

### 2. Check Permissions Early (Fail Fast)

```typescript
// ✅ GOOD: Check permission before expensive operations
export async function POST(request: Request) {
  const userId = await deriveUserIdFromSession()
  const context = await getOrgContext(userId)

  // Check permission FIRST
  if (!hasPermission('production', 'C', context.permissions)) {
    throw new ForbiddenError('Cannot create work orders')
  }

  // Then parse request body
  const body = await request.json()

  // Then perform expensive operation
  await createWorkOrder(body)
}

// ❌ BAD: Check permission after expensive operations
export async function POST(request: Request) {
  const body = await request.json()
  await validateWorkOrder(body)  // Expensive
  await checkBOMAvailability(body.product_id)  // Expensive

  const userId = await deriveUserIdFromSession()
  const context = await getOrgContext(userId)

  // Check permission LAST (wasted resources if denied)
  if (!hasPermission('production', 'C', context.permissions)) {
    throw new ForbiddenError('Cannot create work orders')
  }
}
```

### 3. Use Specific Permission Checks

```typescript
// ✅ GOOD: Check specific operation
if (!hasPermission('production', 'D', context.permissions)) {
  throw new ForbiddenError('Cannot delete work orders')
}

// ❌ BAD: Generic admin check for non-admin operation
if (!hasAdminAccess(context.role_code)) {
  throw new ForbiddenError('Admin access required')
}
// This prevents production managers from deleting WOs!
```

### 4. Combine Permission Checks for Complex Operations

```typescript
// Operation requires both create permission on production
// AND read permission on planning
if (
  !hasPermission('production', 'C', context.permissions) ||
  !hasPermission('planning', 'R', context.permissions)
) {
  throw new ForbiddenError(
    'Requires create permission on production and read permission on planning'
  )
}
```

### 5. Use Descriptive Error Messages

```typescript
// ✅ GOOD: Specific error message
if (!hasPermission('warehouse', 'D', context.permissions)) {
  throw new ForbiddenError('Insufficient permissions to delete license plates')
}

// ❌ BAD: Generic error message
if (!hasPermission('warehouse', 'D', context.permissions)) {
  throw new ForbiddenError('Access denied')
}
```

### 6. Layer Security (Defense in Depth)

```typescript
// Layer 1: Permission check (application layer)
if (!hasPermission('products', 'D', context.permissions)) {
  throw new ForbiddenError('Cannot delete products')
}

// Layer 2: RLS policy (database layer)
// CREATE POLICY products_delete_admin
// FOR DELETE ON products
// USING (
//   org_id = (SELECT org_id FROM users WHERE id = auth.uid())
//   AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('owner', 'admin')
// )

// Layer 3: Org isolation (tenant layer)
await supabase
  .from('products')
  .delete()
  .eq('id', productId)
  .eq('org_id', context.org_id)  // Explicit org filter
```

### 7. Don't Rely on Frontend Checks Alone

```typescript
// Frontend check (UX only)
{hasPermission('production', 'C', context?.permissions) && (
  <Button onClick={handleCreate}>Create Work Order</Button>
)}

// Backend check (REQUIRED)
export async function POST(request: Request) {
  const userId = await deriveUserIdFromSession()
  const context = await getOrgContext(userId)

  // ALWAYS check permission on backend
  if (!hasPermission('production', 'C', context.permissions)) {
    throw new ForbiddenError('Cannot create work orders')
  }

  // ... create work order
}
```

**Why?**
- Frontend can be bypassed (user modifies JavaScript)
- API can be called directly (bypass UI)
- Backend is the security boundary

---

## Common Patterns

### Pattern 1: Check Permission + Org Isolation

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // 1. Check permission
    if (!hasPermission('technical', 'D', context.permissions)) {
      throw new ForbiddenError('Cannot delete products')
    }

    // 2. Delete with org isolation
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)
      .eq('org_id', context.org_id)  // Prevent cross-tenant deletion

    if (error) {
      throw new NotFoundError('Product not found')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 2: Admin Check + Specific Permission

```typescript
export async function PUT(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Admin OR user with specific permission
    if (
      !hasAdminAccess(context.role_code) &&
      !hasPermission('settings', 'U', context.permissions)
    ) {
      throw new ForbiddenError('Insufficient permissions')
    }

    // ... update settings
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 3: Multiple Permission Check (AND)

```typescript
// Operation requires BOTH permissions
if (
  !hasPermission('production', 'C', context.permissions) ||
  !hasPermission('warehouse', 'R', context.permissions)
) {
  throw new ForbiddenError(
    'Requires create permission on production and read permission on warehouse'
  )
}
```

### Pattern 4: Multiple Permission Check (OR)

```typescript
// Operation requires EITHER permission
if (
  !hasPermission('quality', 'U', context.permissions) &&
  !hasPermission('production', 'U', context.permissions)
) {
  throw new ForbiddenError(
    'Requires update permission on quality or production'
  )
}
```

---

## Testing Permission Checks

### Unit Test Example

```typescript
import { hasPermission, hasAdminAccess } from '@/lib/services/permission-service'

describe('Permission Checks', () => {
  it('should allow create when user has C permission', () => {
    const permissions = { production: 'CRUD' }
    expect(hasPermission('production', 'C', permissions)).toBe(true)
  })

  it('should deny create when user lacks C permission', () => {
    const permissions = { production: 'R' }
    expect(hasPermission('production', 'C', permissions)).toBe(false)
  })

  it('should allow admin access for owner', () => {
    expect(hasAdminAccess('owner')).toBe(true)
  })

  it('should deny admin access for viewer', () => {
    expect(hasAdminAccess('viewer')).toBe(false)
  })
})
```

### Integration Test Example

```typescript
describe('POST /api/v1/production/work-orders', () => {
  it('should create work order when user has create permission', async () => {
    const response = await fetch('/api/v1/production/work-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ product_id: '...', quantity: 100 })
    })

    expect(response.status).toBe(201)
  })

  it('should return 403 when user lacks create permission', async () => {
    const response = await fetch('/api/v1/production/work-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: JSON.stringify({ product_id: '...', quantity: 100 })
    })

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toContain('Cannot create work orders')
  })
})
```

---

## References

- [ADR-012: Role Permission Storage](../../1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md)
- [Developer Guide: Using Org Context](./using-org-context.md)
- [API Documentation: GET /api/v1/settings/context](../api/settings/context.md)
- [Service Documentation: permission-service.ts](../../../apps/frontend/lib/services/permission-service.ts)

---

**Last Updated:** 2025-12-17
**Maintained By:** Backend Team
**Questions?** Contact backend team or review ADR-012
