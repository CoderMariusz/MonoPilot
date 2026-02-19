---
name: monopilot-patterns
description: >-
  MonoPilot project-specific patterns: API routes, service layer, error
  hierarchy, auth context, permissions, Supabase client setup, and component
  conventions. Use for ANY implementation task in MonoPilot.
---

## Pattern 1: API Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow, requireRole, RoleSets } from '@/lib/api/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { userId, orgId, userRole } = await getAuthContextOrThrow(supabase)

    const { data, count, error } = await supabase
      .from('table_name')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data, total: count })
  } catch (error) {
    return handleApiError(error, 'GET /api/module/resource')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const ctx = await getAuthContextOrThrow(supabase)
    requireRole(ctx.userRole, RoleSets.ADMIN_ONLY)

    const body = await request.json()
    // Zod validate: const parsed = Schema.parse(body)

    const { data, error } = await supabase
      .from('table_name')
      .insert([{ ...body }])  // org_id set via RLS default
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/module/resource')
  }
}
```

**Key**: Always `try/catch` + `handleApiError()`. Use `getAuthContextOrThrow()` for auth. RLS filters org_id automatically.

## Pattern 2: Auth Context

```typescript
// Located at: lib/api/auth-helpers.ts
interface AuthContext { userId: string; orgId: string; userRole: string }

// Main auth function - throws AuthError on failure
await getAuthContextOrThrow(supabase): AuthContext

// Role checking
requireRole(userRole, ['owner', 'admin'])  // throws AuthError(403)

// Pre-defined role sets
RoleSets.ADMIN_ONLY       // ['owner', 'admin']
RoleSets.WORK_ORDER_WRITE // ['owner', 'admin', 'planner', 'production_manager']
RoleSets.WORK_ORDER_READ  // ['owner', 'admin', 'planner', 'production_manager', 'operator', 'viewer']
```

## Pattern 3: Error Hierarchy

```typescript
// Located at: lib/errors/
import { UnauthorizedError } from '@/lib/errors/unauthorized-error'
import { ForbiddenError } from '@/lib/errors/forbidden-error'
import { NotFoundError } from '@/lib/errors/not-found-error'

// AppError (abstract base, statusCode)
//   ├── UnauthorizedError (401, default: 'Unauthorized')
//   ├── ForbiddenError    (403, default: 'Forbidden')
//   └── NotFoundError     (404, default: 'Not found')

// AuthError (separate, from lib/api/auth-helpers.ts)
// Has: message, code ('UNAUTHORIZED'|'USER_NOT_FOUND'|'FORBIDDEN'), status

// handleApiError() maps these to NextResponse automatically
// Response format: { success: false, error: { code, message, details? } }
```

## Pattern 4: Service Layer

```typescript
// Located at: lib/services/{module}-service.ts
import { createServerSupabase } from '@/lib/supabase/server'

export class SupplierService {
  // ALL methods static (no instances)
  static async getSuppliers(query: ListQuery = {}): Promise<{
    suppliers: Supplier[]; meta: PaginationMeta
  }> {
    const supabase = await createServerSupabase()  // RLS applies org_id
    const { page = 1, limit = 25, search = '' } = query

    let dbQuery = supabase.from('suppliers').select('*', { count: 'exact' })

    if (search) dbQuery = dbQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

    const offset = (page - 1) * limit
    const { data, count, error } = await dbQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return { suppliers: data || [], meta: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) } }
  }

  static async createSupplier(input: CreateInput): Promise<Supplier> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...input }])
      .select().single()

    if (error?.code === '23505') throw new Error('Code already exists')
    if (error) throw new Error(error.message)
    return data
  }
}
```

**Key**: Static methods. Create supabase inside each method. RLS handles org_id. Use hand-coded SELECT fields (not `*`) for joins. Postgres error codes: `23505` = unique violation.

## Pattern 5: Permission System

```typescript
// Located at: lib/services/permission-service.ts
import { hasPermission, requirePermission, getModulePermissions } from '@/lib/services/permission-service'

// Check permission (returns boolean)
hasPermission('admin', 'planning', 'C')  // true
hasPermission(user, 'settings', 'D')     // false for non-owner

// Throw if denied (403 PermissionError)
requirePermission(userRole, 'warehouse', 'U')

// Get all permissions for a module
const perms = getModulePermissions(user, 'production')
// { create: true, read: true, update: true, delete: false }

// 10 roles: owner, admin, production_manager, quality_manager,
// warehouse_manager, production_operator, quality_inspector,
// warehouse_operator, planner, viewer
```

## Pattern 6: Supabase Client Setup

```typescript
// SERVER (API routes, server components):
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
const supabase = await createServerSupabase()  // Uses @supabase/ssr + cookies()
const admin = createServerSupabaseAdmin()       // Bypasses RLS (service role key)

// BROWSER (client components):
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()  // Uses @supabase/ssr + document.cookie

// NEVER use @supabase/auth-helpers-nextjs (deprecated)
// ALWAYS use @supabase/ssr
```

## Pattern 7: Component Conventions

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// Form setup
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... }
})

// Mutation hooks (TanStack Query)
const createMutation = useCreateSupplier()
const onSubmit = async (data: FormData) => {
  try {
    await createMutation.mutateAsync(data)
    toast({ title: 'Success', description: 'Created.' })
    onClose()
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}

// ShadCN Form pattern
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="code" render={({ field }) => (
      <FormItem>
        <FormLabel>Code</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

**Key**: Server layout (auth + redirect) → client page (hooks + UI). URL params for filters. `useToast()` for notifications.

## File Locations

| Type | Path Pattern |
|------|-------------|
| API routes | `app/api/{module}/{resource}/route.ts` |
| Services | `lib/services/{module}-service.ts` |
| Validation | `lib/validation/{module}-schemas.ts` |
| Errors | `lib/errors/{error-type}-error.ts` |
| Auth helpers | `lib/api/auth-helpers.ts` |
| Error handler | `lib/api/error-handler.ts` |
| Permissions | `lib/services/permission-service.ts` |
| Components | `components/{module}/{Feature}.tsx` |
| Pages | `app/(authenticated)/{module}/page.tsx` |
| Hooks | `hooks/use-{feature}.ts` or `lib/hooks/use-{feature}.ts` |