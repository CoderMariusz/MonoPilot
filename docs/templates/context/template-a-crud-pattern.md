# Template A: CRUD Pattern

**Version:** 1.0
**Created:** 2025-01-23
**Applicable Stories:** Any story with "CRUD" in the title (e.g., Product CRUD, BOM CRUD, PO CRUD)

---

## Overview

This template provides the standard CRUD (Create, Read, Update, Delete) implementation pattern used across all MonoPilot modules. It follows the layered architecture:

```
Component (Modal/Form) → API Route → Service Layer → Database (Supabase)
```

**Key Features:**
- ✅ Multi-tenancy (org_id isolation)
- ✅ Service Role pattern (admin client)
- ✅ Dual validation (client + server)
- ✅ Audit trail (created_by, updated_by)
- ✅ Cache invalidation
- ✅ Error handling

---

## 1. API Route Pattern

**Location:** `apps/frontend/app/api/{module}/{resource}/route.ts`

### GET (List)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { list{Resource} } from '@/lib/services/{resource}-service'

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params (filters)
    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      // Add more filters as needed
    }

    // 3. Delegate to service layer
    const result = await list{Resource}(filters)

    // 4. Return response
    if (result.success) {
      return NextResponse.json({
        data: result.data,
        total: result.total
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('{Resource} list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### POST (Create)
```typescript
import { create{Resource}Schema } from '@/lib/validation/{resource}-schemas'
import { create{Resource} } from '@/lib/services/{resource}-service'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const input = create{Resource}Schema.parse(body)

    // 3. Delegate to service layer
    const result = await create{Resource}(input)

    // 4. Return response
    if (result.success) {
      return NextResponse.json({ data: result.data }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('{Resource} creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### PUT (Update) - Single Resource
**Location:** `apps/frontend/app/api/{module}/{resource}/[id]/route.ts`

```typescript
import { update{Resource}Schema } from '@/lib/validation/{resource}-schemas'
import { update{Resource} } from '@/lib/services/{resource}-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = update{Resource}Schema.parse(body)

    const result = await update{Resource}(params.id, input)

    if (result.success) {
      return NextResponse.json({ data: result.data })
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === 'NOT_FOUND' ? 404 : 400 }
      )
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('{Resource} update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### DELETE (Soft Delete)
```typescript
import { remove{Resource} } from '@/lib/services/{resource}-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await remove{Resource}(params.id)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === 'NOT_FOUND' ? 404 : 400 }
      )
    }
  } catch (error) {
    console.error('{Resource} deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 2. Service Layer Pattern

**Location:** `apps/frontend/lib/services/{resource}-service.ts`

### Imports & Types
```typescript
import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { getCached{Resource}s, invalidate{Resource}Cache } from '@/lib/cache/{resource}-cache'
import type { Database } from '@/lib/supabase/generated.types'

// Type aliases from database
type {Resource} = Database['public']['Tables']['{resource}s']['Row']
type {Resource}Insert = Database['public']['Tables']['{resource}s']['Insert']
type {Resource}Update = Database['public']['Tables']['{resource}s']['Update']

// Service result type
export interface {Resource}ServiceResult<T = {Resource}> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'DATABASE_ERROR' | 'INVALID_INPUT'
}

export interface {Resource}ListResult {
  success: boolean
  data?: {Resource}[]
  total?: number
  error?: string
}

// Filter type (customize per resource)
export interface {Resource}Filters {
  search?: string
  status?: 'active' | 'inactive'
  // Add more filters as needed
}
```

### Helper: Get Current Org ID
```typescript
/**
 * Get current user's org_id from JWT
 * Required for all multi-tenant queries
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id || null
}
```

### Create Operation
```typescript
/**
 * Create {resource} with org isolation
 *
 * @param input - Validated create input (from Zod schema)
 * @returns ServiceResult with created {resource} or error
 */
export async function create{Resource}(
  input: Create{Resource}Input
): Promise<{Resource}ServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Get user for audit trail
    const { data: { user } } = await supabase.auth.getUser()

    // Check unique constraint (if applicable)
    const { data: existing } = await supabaseAdmin
      .from('{resource}s')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code) // Adjust field as needed
      .single()

    if (existing) {
      return {
        success: false,
        error: '{Resource} code already exists',
        code: 'DUPLICATE_CODE',
      }
    }

    // Insert using ADMIN CLIENT
    const { data, error } = await supabaseAdmin
      .from('{resource}s')
      .insert({
        ...input,
        org_id: orgId,           // Manual org_id
        created_by: user.id,     // Audit trail
        // created_at, updated_at auto-filled by DB
      } as {Resource}Insert)
      .select()
      .single()

    if (error) {
      console.error('create{Resource} DB error:', error)
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Invalidate cache
    await invalidate{Resource}Cache(orgId)

    return { success: true, data: data as {Resource} }
  } catch (error) {
    console.error('create{Resource} error:', error)
    return {
      success: false,
      error: 'Internal error',
      code: 'DATABASE_ERROR',
    }
  }
}
```

### List Operation (with Caching)
```typescript
/**
 * List {resource}s with caching and filters
 *
 * @param filters - Optional filters (search, status, etc.)
 * @returns ListResult with {resource}s array or error
 */
export async function list{Resource}(
  filters?: {Resource}Filters
): Promise<{Resource}ListResult> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    return { success: false, error: 'Organization not found' }
  }

  // Try cache first (if no search/filters or simple filters)
  const cached = await getCached{Resource}s(orgId, filters)
  if (cached) {
    return { success: true, data: cached }
  }

  // Fetch from DB using ADMIN CLIENT
  const supabaseAdmin = createServerSupabaseAdmin()
  let query = supabaseAdmin
    .from('{resource}s')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .is('deleted_at', null) // Soft delete filter

  // Apply filters
  if (filters?.search) {
    query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  // Order by (customize as needed)
  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    console.error('list{Resource} error:', error)
    return { success: false, error: error.message }
  }

  // Cache result
  await setCached{Resource}s(orgId, filters, data as {Resource}[])

  return {
    success: true,
    data: data as {Resource}[],
    total: count ?? 0
  }
}
```

### Get By ID Operation
```typescript
/**
 * Get single {resource} by ID
 *
 * @param id - {Resource} UUID
 * @returns ServiceResult with {resource} or error
 */
export async function get{Resource}ById(
  id: string
): Promise<{Resource}ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()
    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('{resource}s')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId) // Org isolation
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: '{Resource} not found',
        code: 'NOT_FOUND',
      }
    }

    return { success: true, data: data as {Resource} }
  } catch (error) {
    console.error('get{Resource}ById error:', error)
    return {
      success: false,
      error: 'Internal error',
      code: 'DATABASE_ERROR',
    }
  }
}
```

### Update Operation
```typescript
/**
 * Update {resource} with org validation
 *
 * @param id - {Resource} UUID
 * @param input - Partial update input (from Zod schema)
 * @returns ServiceResult with updated {resource} or error
 */
export async function update{Resource}(
  id: string,
  input: Update{Resource}Input
): Promise<{Resource}ServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    // Check existence + org ownership
    const { data: existing } = await supabaseAdmin
      .from('{resource}s')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return {
        success: false,
        error: '{Resource} not found or access denied',
        code: 'NOT_FOUND',
      }
    }

    // Check unique constraint if code is being updated
    if (input.code) {
      const { data: duplicate } = await supabaseAdmin
        .from('{resource}s')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', input.code)
        .neq('id', id) // Exclude current record
        .single()

      if (duplicate) {
        return {
          success: false,
          error: 'Code already exists',
          code: 'DUPLICATE_CODE',
        }
      }
    }

    // Get user for audit trail
    const { data: { user } } = await supabase.auth.getUser()

    // Update using ADMIN CLIENT
    const { data, error } = await supabaseAdmin
      .from('{resource}s')
      .update({
        ...input,
        updated_by: user.id, // Audit trail
        // updated_at auto-filled by DB trigger
      } as {Resource}Update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('update{Resource} DB error:', error)
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Invalidate cache
    await invalidate{Resource}Cache(orgId)

    return { success: true, data: data as {Resource} }
  } catch (error) {
    console.error('update{Resource} error:', error)
    return {
      success: false,
      error: 'Internal error',
      code: 'DATABASE_ERROR',
    }
  }
}
```

### Delete Operation (Soft Delete)
```typescript
/**
 * Soft delete {resource}
 *
 * @param id - {Resource} UUID
 * @returns ServiceResult with success flag or error
 */
export async function remove{Resource}(
  id: string
): Promise<{Resource}ServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    // Check existence + org ownership
    const { data: existing } = await supabaseAdmin
      .from('{resource}s')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return {
        success: false,
        error: '{Resource} not found or already deleted',
        code: 'NOT_FOUND',
      }
    }

    // Get user for audit trail
    const { data: { user } } = await supabase.auth.getUser()

    // Soft delete (set deleted_at)
    const { error } = await supabaseAdmin
      .from('{resource}s')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      } as {Resource}Update)
      .eq('id', id)

    if (error) {
      console.error('remove{Resource} DB error:', error)
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Invalidate cache
    await invalidate{Resource}Cache(orgId)

    return { success: true }
  } catch (error) {
    console.error('remove{Resource} error:', error)
    return {
      success: false,
      error: 'Internal error',
      code: 'DATABASE_ERROR',
    }
  }
}
```

---

## 3. Component Pattern (Form Modal)

**Location:** `apps/frontend/components/{module}/{Resource}FormModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { create{Resource}Schema, type Create{Resource}Input } from '@/lib/validation/{resource}-schemas'
import { toast } from 'sonner'

interface {Resource}FormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editMode?: boolean
  initialData?: Create{Resource}Input
}

export function {Resource}FormModal({
  open,
  onClose,
  onSuccess,
  editMode = false,
  initialData
}: {Resource}FormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<Create{Resource}Input>({
    resolver: zodResolver(create{Resource}Schema),
    defaultValues: initialData || {
      code: '',
      name: '',
      status: 'active',
      // Add more default fields
    },
  })

  const onSubmit = async (data: Create{Resource}Input) => {
    setIsSubmitting(true)

    try {
      const url = editMode && initialData?.id
        ? `/api/{module}/{resource}/${initialData.id}`
        : `/api/{module}/{resource}`

      const method = editMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const action = editMode ? 'updated' : 'created'
        toast.success(`{Resource} ${action} successfully`)
        form.reset()
        onClose()
        onSuccess?.()
      } else {
        const error = await res.json()
        toast.error(error.error || `Failed to ${editMode ? 'update' : 'create'} {resource}`)
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit {Resource}' : 'Create {Resource}'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Code Field */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., ITEM-001"
                      {...field}
                      disabled={editMode} // Code immutable after creation
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add more fields as needed */}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 4. Validation Schema

**Location:** `apps/frontend/lib/validation/{resource}-schemas.ts`

```typescript
import { z } from 'zod'

// Create Schema
export const create{Resource}Schema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must not exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  // Add more fields as needed
})

export type Create{Resource}Input = z.infer<typeof create{Resource}Schema>

// Update Schema (all fields optional except those that shouldn't change)
export const update{Resource}Schema = create{Resource}Schema.partial().omit({ code: true })

export type Update{Resource}Input = z.infer<typeof update{Resource}Schema>

// Filters Schema
export const {resource}FiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  // Add more filters as needed
})

export type {Resource}Filters = z.infer<typeof {resource}FiltersSchema>
```

---

## 5. Cache Layer (Optional)

**Location:** `apps/frontend/lib/cache/{resource}-cache.ts`

```typescript
import { redis } from './redis-client'

const CACHE_TTL = 300 // 5 minutes

/**
 * Get cached {resource}s
 */
export async function getCached{Resource}s(
  orgId: string,
  filters?: {Resource}Filters
): Promise<{Resource}[] | null> {
  const key = `{resource}s:${orgId}:${JSON.stringify(filters || {})}`
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

/**
 * Set cached {resource}s
 */
export async function setCached{Resource}s(
  orgId: string,
  filters: {Resource}Filters | undefined,
  data: {Resource}[]
): Promise<void> {
  const key = `{resource}s:${orgId}:${JSON.stringify(filters || {})}`
  await redis.setex(key, CACHE_TTL, JSON.stringify(data))
}

/**
 * Invalidate all {resource} caches for org
 */
export async function invalidate{Resource}Cache(orgId: string): Promise<void> {
  const pattern = `{resource}s:${orgId}:*`
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

---

## 6. Usage Examples

### Story 2.6: BOM CRUD
Replace placeholders:
- `{Resource}` → `BOM`
- `{resource}` → `bom`
- `{module}` → `technical`
- Add BOM-specific fields: `product_id`, `version`, `effective_from`, `effective_to`, `output_qty`, `output_uom`

### Story 3.1: PO CRUD
Replace placeholders:
- `{Resource}` → `PurchaseOrder`
- `{resource}` → `purchase-order`
- `{module}` → `planning`
- Add PO-specific fields: `supplier_id`, `warehouse_id`, `expected_delivery_date`, `currency`, `tax_code_id`

---

## 7. Customization Checklist

When using this template for a new story:

- [ ] Replace all `{Resource}` placeholders with actual resource name (PascalCase)
- [ ] Replace all `{resource}` placeholders with kebab-case name
- [ ] Replace `{module}` with module name (settings/technical/planning/etc.)
- [ ] Update validation schema with resource-specific fields
- [ ] Add resource-specific filters to list function
- [ ] Customize unique constraints (e.g., code, email, etc.)
- [ ] Add foreign key validations if needed
- [ ] Update cache key patterns
- [ ] Add component-specific form fields
- [ ] Test all CRUD operations with actual data

---

**END OF TEMPLATE A: CRUD PATTERN**

**Next Template:** Template B - Line Items Pattern
