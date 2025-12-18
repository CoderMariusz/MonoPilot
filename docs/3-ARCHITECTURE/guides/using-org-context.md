# Developer Guide: Using Org Context

**Story:** 01.1 - Org Context + Base RLS
**Last Updated:** 2025-12-16
**Audience:** Backend and Frontend developers

## Overview

The org context service provides the security foundation for MonoPilot's multi-tenant architecture. This guide explains how to use org context correctly in new stories to ensure proper tenant isolation and permission checking.

**Critical:** All org-scoped operations MUST use org context for tenant isolation. Failure to do so creates security vulnerabilities.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [API Route Usage](#api-route-usage)
4. [Frontend Usage](#frontend-usage)
5. [Permission Checking](#permission-checking)
6. [Common Patterns](#common-patterns)
7. [Security Best Practices](#security-best-practices)
8. [Common Pitfalls](#common-pitfalls)
9. [ADR-013 Compliance Checklist](#adr-013-compliance-checklist)
10. [Examples](#examples)

---

## Quick Start

### API Route Template

```typescript
// apps/frontend/app/api/v1/{module}/{resource}/route.ts

import { NextResponse } from 'next/server'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET(request: Request) {
  try {
    // 1. Get authenticated user ID
    const userId = await deriveUserIdFromSession()

    // 2. Get org context (includes org_id, role, permissions)
    const context = await getOrgContext(userId)

    // 3. Use context.org_id for all queries
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .eq('org_id', context.org_id)  // ← CRITICAL: Filter by org_id

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Frontend Component Template

```typescript
// apps/frontend/app/(authenticated)/[module]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import type { OrgContext } from '@/lib/types/organization'

export default function ModulePage() {
  const [context, setContext] = useState<OrgContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContext() {
      const response = await fetch('/api/v1/settings/context')
      const data = await response.json()
      setContext(data)
      setLoading(false)
    }

    fetchContext()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Welcome, {context?.organization.name}</h1>
      <p>Role: {context?.role_name}</p>
    </div>
  )
}
```

---

## Core Concepts

### What is Org Context?

Org context is the complete session information for an authenticated user:

```typescript
interface OrgContext {
  org_id: string                        // Primary tenant identifier
  user_id: string                       // User UUID
  role_code: string                     // Role code (owner, admin, etc.)
  role_name: string                     // Human-readable role name
  permissions: Record<string, string>   // Module permissions (CRUD)
  organization: {
    id: string                          // Organization UUID
    name: string                        // Organization name
    slug: string                        // URL-safe identifier
    timezone: string                    // IANA timezone
    locale: string                      // ISO 639-1 locale
    currency: string                    // ISO 4217 currency
    onboarding_step: number             // Current step (0-6)
    onboarding_completed_at: string     // Completion timestamp
    is_active: boolean                  // Active status
  }
}
```

### Why Use Org Context?

**Without org context:**
```typescript
// ❌ INSECURE: No tenant isolation
const { data } = await supabase.from('work_orders').select('*')
// Returns work orders from ALL organizations!
```

**With org context:**
```typescript
// ✅ SECURE: Tenant isolated
const context = await getOrgContext(userId)
const { data } = await supabase
  .from('work_orders')
  .select('*')
  .eq('org_id', context.org_id)
// Returns only current org's work orders
```

### RLS + Application Filter = Defense in Depth

MonoPilot uses **two layers of security**:

1. **RLS (Row Level Security)**: Database-level filtering (ADR-013)
2. **Application Filter**: Explicit org_id filtering in queries

```typescript
// Layer 1: RLS Policy (automatic, database-level)
CREATE POLICY work_orders_select_same_org
ON work_orders FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

// Layer 2: Application Filter (explicit, query-level)
const { data } = await supabase
  .from('work_orders')
  .select('*')
  .eq('org_id', context.org_id)  // ← Explicit filter
```

**Why both?**
- RLS prevents accidental cross-tenant queries
- Application filter makes intent explicit
- Defense in depth: if one fails, the other catches it

---

## API Route Usage

### Step-by-Step Guide

#### Step 1: Import Required Functions

```typescript
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { hasAdminAccess, hasPermission } from '@/lib/services/permission-service'
```

#### Step 2: Derive User ID from Session

```typescript
export async function GET(request: Request) {
  try {
    // Gets user ID from Supabase auth session
    // Throws UnauthorizedError if no session or session expired
    const userId = await deriveUserIdFromSession()

    // ... rest of handler
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Error Handling:**
- Returns 401 if no session
- Returns 401 if session expired
- Never exposes stack traces

#### Step 3: Get Org Context

```typescript
const context = await getOrgContext(userId)
// context.org_id     → Organization UUID
// context.user_id    → User UUID
// context.role_code  → 'owner', 'admin', 'viewer', etc.
// context.permissions → {'settings': 'CRUD', 'production': 'CR', ...}
```

**Error Handling:**
- Returns 404 if user not found (prevents enumeration)
- Returns 403 if user inactive
- Returns 403 if organization inactive

#### Step 4: Use org_id in Queries

```typescript
// READ operations
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('org_id', context.org_id)  // ← ALWAYS filter by org_id

// CREATE operations
const { data, error } = await supabase
  .from('products')
  .insert({
    org_id: context.org_id,  // ← ALWAYS include org_id
    name: 'New Product',
    // ... other fields
  })

// UPDATE operations
const { data, error } = await supabase
  .from('products')
  .update({ name: 'Updated Name' })
  .eq('id', productId)
  .eq('org_id', context.org_id)  // ← ALWAYS include in WHERE clause

// DELETE operations
const { data, error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
  .eq('org_id', context.org_id)  // ← ALWAYS include in WHERE clause
```

**Critical:** Never trust client-provided org_id. Always use `context.org_id`.

#### Step 5: Check Permissions (If Required)

```typescript
// Admin-only operations
if (!hasAdminAccess(context.role_code)) {
  throw new ForbiddenError('Admin access required')
}

// Module-specific operations
if (!hasPermission('production', 'C', context.permissions)) {
  throw new ForbiddenError('Cannot create production orders')
}
```

---

## Frontend Usage

### React Hook Pattern

```typescript
// hooks/useOrgContext.ts

import { useState, useEffect } from 'react'
import type { OrgContext } from '@/lib/types/organization'

export function useOrgContext() {
  const [context, setContext] = useState<OrgContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchContext() {
      try {
        const response = await fetch('/api/v1/settings/context')

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login
            window.location.href = '/auth/login'
            return
          }
          throw new Error('Failed to fetch org context')
        }

        const data = await response.json()
        setContext(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchContext()
  }, [])

  return { context, loading, error }
}
```

### Using in Components

```typescript
export default function ProductsPage() {
  const { context, loading, error } = useOrgContext()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <h1>{context?.organization.name} - Products</h1>

      {hasPermission('technical', 'C', context?.permissions) && (
        <Button>Create Product</Button>
      )}

      <ProductList orgId={context?.org_id} />
    </div>
  )
}
```

### Permission-Based UI Rendering

```typescript
import { hasPermission, hasAdminAccess } from '@/lib/services/permission-service'

export default function SettingsPage() {
  const { context } = useOrgContext()

  return (
    <div>
      {/* Show to all users */}
      <ProfileSection />

      {/* Show only if user has update permission */}
      {hasPermission('settings', 'U', context?.permissions) && (
        <OrganizationSettings />
      )}

      {/* Show only to admins */}
      {hasAdminAccess(context?.role_code) && (
        <UserManagement />
      )}
    </div>
  )
}
```

---

## Permission Checking

### CRUD Permission Matrix

```typescript
// Permission string examples
permissions: {
  'settings': 'CRUD',    // Full access
  'technical': 'CRUD',   // Full access
  'planning': 'CR',      // Create and Read only
  'production': 'R',     // Read-only
  'warehouse': '-',      // No access
}
```

### Permission Check Functions

```typescript
import { hasPermission, hasAdminAccess } from '@/lib/services/permission-service'

// Check specific operation
if (hasPermission('production', 'C', context.permissions)) {
  // User can CREATE production orders
}

if (hasPermission('quality', 'U', context.permissions)) {
  // User can UPDATE quality records
}

if (hasPermission('shipping', 'D', context.permissions)) {
  // User can DELETE shipments
}

// Check admin access (owner or admin role)
if (hasAdminAccess(context.role_code)) {
  // User can modify organization settings
  // User can manage users
}
```

### Backend Permission Enforcement

```typescript
export async function POST(request: Request) {
  const userId = await deriveUserIdFromSession()
  const context = await getOrgContext(userId)

  // Check permission before proceeding
  if (!hasPermission('production', 'C', context.permissions)) {
    throw new ForbiddenError('Insufficient permissions to create work orders')
  }

  // Proceed with operation
  const body = await request.json()
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      org_id: context.org_id,
      created_by: context.user_id,
      ...body
    })

  return NextResponse.json(data)
}
```

---

## Common Patterns

### Pattern 1: List Resources

```typescript
export async function GET(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', context.org_id)
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 2: Get Single Resource

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', context.org_id)  // ← Prevent cross-tenant access
      .single()

    if (error) {
      // Return 404 instead of exposing error details
      throw new NotFoundError('Product not found')
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 3: Create Resource

```typescript
export async function POST(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Check permission
    if (!hasPermission('technical', 'C', context.permissions)) {
      throw new ForbiddenError('Cannot create products')
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('products')
      .insert({
        org_id: context.org_id,       // ← Always include
        created_by: context.user_id,  // ← Audit trail
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

### Pattern 4: Update Resource (Admin Only)

```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
        ...body,
        updated_by: context.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('id', context.org_id)  // ← User can only update own org
      .select()
      .single()

    if (error) {
      throw new NotFoundError('Organization not found')
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Pattern 5: Delete Resource

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    if (!hasPermission('technical', 'D', context.permissions)) {
      throw new ForbiddenError('Cannot delete products')
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)
      .eq('org_id', context.org_id)  // ← Prevent cross-tenant deletion

    if (error) {
      throw new NotFoundError('Product not found')
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## Security Best Practices

### 1. Always Use Org Context

```typescript
// ❌ WRONG: Trust client-provided org_id
const body = await request.json()
const { data } = await supabase
  .from('products')
  .insert({ org_id: body.org_id, ...body })  // ← INSECURE!

// ✅ CORRECT: Use context.org_id
const context = await getOrgContext(userId)
const { data } = await supabase
  .from('products')
  .insert({ org_id: context.org_id, ...body })  // ← SECURE
```

### 2. Filter ALL Queries by org_id

```typescript
// ❌ WRONG: No org_id filter
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)

// ✅ CORRECT: Always filter by org_id
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .eq('org_id', context.org_id)  // ← CRITICAL
```

### 3. Return 404 for Cross-Tenant Access

```typescript
// ❌ WRONG: Expose existence with 403
if (product.org_id !== context.org_id) {
  throw new ForbiddenError('Access denied')  // ← Reveals product exists
}

// ✅ CORRECT: Return 404 to prevent enumeration
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .eq('org_id', context.org_id)  // ← RLS + filter = 404 if not found
  .single()

if (!data) {
  throw new NotFoundError('Product not found')  // ← Safe
}
```

### 4. Validate Input Before Database Queries

```typescript
// ✅ GOOD: Validate UUIDs
import { isValidUUID } from '@/lib/utils/validation'

if (!isValidUUID(params.id)) {
  throw new BadRequestError('Invalid product ID format')
}

// ✅ GOOD: Validate required fields
if (!body.name || !body.code) {
  throw new BadRequestError('Name and code are required')
}
```

### 5. Use Permission Checks Before Operations

```typescript
// ✅ GOOD: Check before expensive operations
if (!hasPermission('production', 'C', context.permissions)) {
  throw new ForbiddenError('Cannot create work orders')
}

// Now perform expensive operation
const workOrder = await createWorkOrder(body, context)
```

### 6. Never Expose Internal Errors

```typescript
// ❌ WRONG: Expose database errors
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// ✅ CORRECT: Use error handler
catch (error) {
  return handleApiError(error)  // Sanitizes error messages
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting org_id Filter

```typescript
// ❌ WRONG: No org_id filter
const { data } = await supabase
  .from('work_orders')
  .select('*')
  .eq('status', 'active')
// Returns active work orders from ALL organizations!

// ✅ CORRECT
const { data } = await supabase
  .from('work_orders')
  .select('*')
  .eq('org_id', context.org_id)
  .eq('status', 'active')
```

### Pitfall 2: Trusting Client Data

```typescript
// ❌ WRONG: Accept org_id from request
const body = await request.json()
await supabase.from('products').insert({
  org_id: body.org_id,  // ← Attacker can set any org_id!
  ...body
})

// ✅ CORRECT: Always use context.org_id
await supabase.from('products').insert({
  org_id: context.org_id,  // ← Secure
  ...body
})
```

### Pitfall 3: Missing Permission Checks

```typescript
// ❌ WRONG: No permission check
export async function DELETE(request: Request) {
  const userId = await deriveUserIdFromSession()
  const context = await getOrgContext(userId)

  // Any user can delete!
  await supabase.from('products').delete().eq('id', productId)
}

// ✅ CORRECT: Check permission first
export async function DELETE(request: Request) {
  const userId = await deriveUserIdFromSession()
  const context = await getOrgContext(userId)

  if (!hasPermission('technical', 'D', context.permissions)) {
    throw new ForbiddenError('Cannot delete products')
  }

  await supabase.from('products').delete().eq('id', productId)
}
```

### Pitfall 4: Not Handling Context Errors

```typescript
// ❌ WRONG: No error handling
export async function GET(request: Request) {
  const userId = await deriveUserIdFromSession()  // Can throw!
  const context = await getOrgContext(userId)     // Can throw!
  // If above throws, returns 500 with stack trace
}

// ✅ CORRECT: Wrap in try/catch
export async function GET(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)
    // ... rest of handler
  } catch (error) {
    return handleApiError(error)  // Returns proper status code
  }
}
```

### Pitfall 5: Using org_id from URL/Query Params

```typescript
// ❌ WRONG: Accept org_id from URL
const { searchParams } = new URL(request.url)
const orgId = searchParams.get('org_id')  // ← INSECURE!

const { data } = await supabase
  .from('products')
  .select('*')
  .eq('org_id', orgId)

// ✅ CORRECT: Use context.org_id
const context = await getOrgContext(userId)
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('org_id', context.org_id)
```

---

## ADR-013 Compliance Checklist

Use this checklist for code reviews:

### API Routes

- [ ] Imports `deriveUserIdFromSession` from org-context-service
- [ ] Imports `getOrgContext` from org-context-service
- [ ] Imports `handleApiError` from api-error-handler
- [ ] Calls `deriveUserIdFromSession()` at start of handler
- [ ] Calls `getOrgContext(userId)` to get context
- [ ] Wraps all logic in try/catch block
- [ ] Returns `handleApiError(error)` in catch block
- [ ] Uses `context.org_id` for ALL queries (SELECT, INSERT, UPDATE, DELETE)
- [ ] Never trusts client-provided org_id
- [ ] Checks permissions before write operations
- [ ] Returns 404 (not 403) for cross-tenant access attempts

### Database Queries

- [ ] SELECT queries include `.eq('org_id', context.org_id)`
- [ ] INSERT queries include `org_id: context.org_id`
- [ ] UPDATE queries include `.eq('org_id', context.org_id)` in WHERE clause
- [ ] DELETE queries include `.eq('org_id', context.org_id)` in WHERE clause
- [ ] JOIN queries filter related tables by org_id
- [ ] Subqueries filter by org_id

### Frontend Components

- [ ] Calls `/api/v1/settings/context` to get org context
- [ ] Handles 401 response (redirects to login)
- [ ] Handles loading and error states
- [ ] Uses permission checks for conditional rendering
- [ ] Never exposes org_id to URL/query params

---

## Examples

### Example 1: Product List API

```typescript
// apps/frontend/app/api/v1/technical/products/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        code,
        name,
        category,
        status,
        created_at
      `)
      .eq('org_id', context.org_id)
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Example 2: Work Order Creation API (with Permissions)

```typescript
// apps/frontend/app/api/v1/planning/work-orders/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { hasPermission } from '@/lib/services/permission-service'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { ForbiddenError } from '@/lib/errors/forbidden-error'

export async function POST(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Check permission
    if (!hasPermission('planning', 'C', context.permissions)) {
      throw new ForbiddenError('Cannot create work orders')
    }

    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        org_id: context.org_id,
        created_by: context.user_id,
        product_id: body.product_id,
        quantity: body.quantity,
        scheduled_date: body.scheduled_date,
        status: 'planned'
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

### Example 3: Organization Update API (Admin Only)

```typescript
// apps/frontend/app/api/v1/settings/organization/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { ForbiddenError } from '@/lib/errors/forbidden-error'

export async function PUT(request: Request) {
  try {
    const userId = await deriveUserIdFromSession()
    const context = await getOrgContext(userId)

    // Admin-only operation
    if (!hasAdminAccess(context.role_code)) {
      throw new ForbiddenError('Admin access required')
    }

    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: body.name,
        timezone: body.timezone,
        locale: body.locale,
        currency: body.currency,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.org_id)  // User can only update own org
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## References

- [ADR-013: RLS Org Isolation Pattern](../../1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md)
- [API Documentation: GET /api/v1/settings/context](../api/settings/context.md)
- [Migration Documentation: Story 01.1](../database/migrations/01.1-org-context-rls.md)
- [Code Review: Story 01.1](../../../2-MANAGEMENT/reviews/code-review-story-01.1.md)

---

**Last Updated:** 2025-12-16
**Maintained By:** Backend Team
**Questions?** Contact backend team or review ADR-013
