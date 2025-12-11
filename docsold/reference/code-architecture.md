# Code Architecture Documentation - MonoPilot

**Generated:** 2025-01-23
**Scan Level:** Deep
**Framework:** Next.js 15 App Router + React 19 + TypeScript 5

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Architectural Layers](#architectural-layers)
4. [Service Layer Pattern](#service-layer-pattern)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Validation Strategy](#validation-strategy)
8. [Authentication & Authorization](#authentication--authorization)
9. [Caching Strategy](#caching-strategy)
10. [Migration Management](#migration-management)
11. [Testing Architecture](#testing-architecture)
12. [Key Patterns & Conventions](#key-patterns--conventions)

---

## Overview

MonoPilot follows a **layered architecture** based on Next.js 15 App Router conventions with clear separation of concerns:

```
Presentation Layer (React Components)
    ↓
API Layer (Route Handlers)
    ↓
Service Layer (Business Logic)
    ↓
Data Access Layer (Supabase Client)
    ↓
Database (PostgreSQL with RLS)
```

### Key Architectural Principles

1. **Multi-Tenancy First:** Every query filtered by org_id
2. **Service Role Pattern:** Admin client for all DB operations
3. **Dual Validation:** Client + Server validation with Zod
4. **Audit Trail:** created_at, updated_at, created_by, updated_by on all tables
5. **Soft Delete:** deleted_at pattern for selected tables
6. **Type Safety:** End-to-end TypeScript with generated Supabase types

---

## Project Structure

```
apps/frontend/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # Protected routes (require login)
│   │   ├── dashboard/
│   │   ├── settings/
│   │   └── technical/
│   ├── api/                      # API Route Handlers
│   │   ├── settings/
│   │   ├── technical/
│   │   ├── planning/
│   │   ├── dashboard/
│   │   ├── auth/
│   │   ├── webhooks/
│   │   └── cron/
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css
│
├── components/                   # React Components
│   ├── ui/                      # shadcn/ui primitives
│   ├── auth/                    # Authentication forms
│   ├── dashboard/               # Dashboard widgets
│   ├── settings/                # Settings module components
│   ├── technical/               # Technical module components
│   ├── navigation/              # Navigation (Sidebar, etc.)
│   └── common/                  # Shared components
│
├── lib/                         # Business Logic & Utilities
│   ├── services/                # Service Layer (20+ services)
│   ├── validation/              # Zod schemas
│   ├── supabase/                # Supabase clients & migrations
│   ├── utils/                   # Utility functions
│   ├── cache/                   # Redis caching layer
│   ├── auth/                    # Auth client
│   ├── activity/                # Activity logging
│   ├── config/                  # Configuration
│   └── types/                   # TypeScript type definitions
│
├── __tests__/                   # Test files
│   ├── api/                     # API route tests
│   ├── lib/                     # Library tests
│   └── integration/             # Integration tests
│
├── middleware.ts                # Next.js middleware (auth)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vitest.config.ts             # Vitest configuration
└── package.json
```

### Route Groups (Next.js App Router)

```
app/
├── (authenticated)/             # Requires authentication middleware
│   ├── layout.tsx              # Authenticated layout with Sidebar
│   ├── dashboard/              # Module: Dashboard
│   ├── settings/               # Module: Settings (Epic 1)
│   └── technical/              # Module: Technical (Epic 2)
│
├── api/                        # API routes (no layout)
│   └── [module]/[resource]/
│
├── login/                      # Public routes
├── signup/
└── forgot-password/
```

---

## Architectural Layers

### 1. Presentation Layer (Components)

**Location:** `components/`

**Responsibilities:**
- Render UI based on props
- Handle user interactions
- Form validation (client-side with react-hook-form + Zod)
- Display feedback (toasts, errors)

**Pattern:**
```tsx
// components/settings/WarehouseFormModal.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'

export function WarehouseFormModal({ open, onClose }) {
  const form = useForm({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: { /* ... */ }
  })

  const onSubmit = async (data) => {
    const res = await fetch('/api/settings/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (res.ok) {
      toast.success('Warehouse created')
      onClose()
    } else {
      const error = await res.json()
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Form JSX */}
    </Dialog>
  )
}
```

### 2. API Layer (Route Handlers)

**Location:** `app/api/`

**Responsibilities:**
- Validate authentication
- Parse and validate request
- Delegate to service layer
- Return formatted response

**Pattern:**
```typescript
// app/api/settings/warehouses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { createWarehouse } from '@/lib/services/warehouse-service'

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
    const input = createWarehouseSchema.parse(body)

    // 3. Delegate to service layer
    const result = await createWarehouse(input)

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

    console.error('Warehouse creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. Service Layer (Business Logic)

**Location:** `lib/services/`

**Responsibilities:**
- Business logic and validation
- Database operations via Admin client
- Multi-tenancy enforcement (manual org_id filtering)
- Cache invalidation
- Audit trail population

**Services Inventory:**

| Service | Tables | Stories | Purpose |
|---------|--------|---------|---------|
| warehouse-service.ts | warehouses | 1.5 | CRUD + caching |
| location-service.ts | locations | 1.6 | CRUD with warehouse FK |
| machine-service.ts | machines | 1.7 | CRUD with capacity |
| production-line-service.ts | production_lines | 1.8 | CRUD |
| allergen-service.ts | allergens | 1.9 | CRUD with EU14 seed |
| tax-code-service.ts | tax_codes | 1.10 | CRUD with default |
| invitation-service.ts | user_invitations | 1.12 | Invite + email |
| session-service.ts | user_sessions | 1.11 | Session management |
| module-service.ts | organizations | 1.14 | Module toggle |
| wizard-service.ts | organizations | 1.15 | Wizard progress |
| bom-service.ts | boms, bom_items | 2.6-2.11 | BOM CRUD + cloning |
| routing-service.ts | routings, routing_operations | 2.15-2.16 | Routing CRUD |
| genealogy-service.ts | traceability_links | 2.17-2.21 | Tracing |
| transfer-order-service.ts | transfer_orders | 3.6-3.10 | TO CRUD |
| recall-service.ts | recall_simulations | 2.20 | Recall simulation |
| dashboard-service.ts | - | - | Aggregations |
| email-service.ts | - | - | SendGrid integration |
| jwt-blacklist-service.ts | - | - | Token revocation |
| barcode-generator-service.ts | - | - | QR code generation |

**Standard Service Pattern:**

```typescript
// lib/services/warehouse-service.ts
import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { getCachedWarehouses, invalidateWarehouseCache } from '@/lib/cache/warehouse-cache'

export interface WarehouseServiceResult<T = Warehouse> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'DATABASE_ERROR'
}

/**
 * Get current user's org_id from JWT
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

/**
 * Create warehouse with org isolation
 */
export async function createWarehouse(
  input: CreateWarehouseInput
): Promise<WarehouseServiceResult> {
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

    // Check unique constraint
    const { data: existing } = await supabaseAdmin
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'Warehouse code already exists',
        code: 'DUPLICATE_CODE',
      }
    }

    // Insert using ADMIN CLIENT
    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .insert({
        ...input,
        org_id: orgId,           // Manual org_id
        created_by: user.id,     // Audit trail
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Invalidate cache
    await invalidateWarehouseCache(orgId)

    return { success: true, data }
  } catch (error) {
    console.error('createWarehouse error:', error)
    return {
      success: false,
      error: 'Internal error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List warehouses with caching
 */
export async function listWarehouses(
  filters?: WarehouseFilters
): Promise<WarehouseListResult> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    return { success: false, error: 'Org not found' }
  }

  // Try cache first
  const cached = await getCachedWarehouses(orgId, filters)
  if (cached) {
    return { success: true, data: cached }
  }

  // Fetch from DB
  const supabaseAdmin = createServerSupabaseAdmin()
  let query = supabaseAdmin
    .from('warehouses')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .is('deleted_at', null)

  // Apply filters
  if (filters?.search) {
    query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error, count } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  // Cache result
  await setCachedWarehouses(orgId, filters, data)

  return { success: true, data, total: count }
}
```

### 4. Data Access Layer (Supabase Clients)

**Location:** `lib/supabase/server.ts`, `lib/supabase/client.ts`

**Two Client Pattern:**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Authenticated client - RLS enforced
 * USE: Auth operations only (getUser, getSession)
 * DO NOT USE: Database operations (RLS will block)
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

/**
 * Admin client - RLS bypassed
 * USE: ALL database operations in services
 * Requires: Manual org_id filtering
 */
export function createServerSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

**Why Service Role?**

RLS policies check `auth.jwt() ->> 'org_id'`, which doesn't work server-side because:
1. Server components don't have JWT context
2. Route handlers execute outside user session
3. Service role bypasses RLS → manual org_id filtering required

---

## Service Layer Pattern

### Service Template

All services follow this structure:

```typescript
// 1. Imports
import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { type Schema } from '@/lib/validation/schemas'

// 2. Result types
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCode
}

// 3. Helper: Get org_id
async function getCurrentOrgId(): Promise<string | null> {
  // Standard implementation
}

// 4. CRUD Operations
export async function create(input: CreateInput): Promise<ServiceResult> {
  // Pattern: auth check → validation → admin insert → cache invalidation
}

export async function list(filters?: Filters): Promise<ListResult> {
  // Pattern: cache check → admin query → cache set
}

export async function getById(id: string): Promise<ServiceResult> {
  // Pattern: admin select → org validation
}

export async function update(id: string, input: UpdateInput): Promise<ServiceResult> {
  // Pattern: existence check → admin update → cache invalidation
}

export async function remove(id: string): Promise<ServiceResult> {
  // Pattern: soft delete or hard delete → cache invalidation
}
```

### Common Service Patterns

**1. Unique Code Validation:**
```typescript
const { data: existing } = await supabaseAdmin
  .from('table')
  .select('id')
  .eq('org_id', orgId)
  .eq('code', input.code)
  .single()

if (existing) {
  return { success: false, error: 'Code already exists', code: 'DUPLICATE_CODE' }
}
```

**2. Audit Trail Population:**
```typescript
const { data: { user } } = await supabase.auth.getUser()

await supabaseAdmin
  .from('table')
  .insert({
    ...input,
    org_id: orgId,
    created_by: user.id,
    // created_at, updated_at auto-filled by DB
  })
```

**3. Cache Invalidation:**
```typescript
await invalidateCache(orgId, resourceType)
```

**4. Foreign Key Validation:**
```typescript
// Validate warehouse exists in same org
const { data: warehouse } = await supabaseAdmin
  .from('warehouses')
  .select('id')
  .eq('id', input.warehouse_id)
  .eq('org_id', orgId)
  .single()

if (!warehouse) {
  return { success: false, error: 'Warehouse not found', code: 'NOT_FOUND' }
}
```

---

## Component Architecture

### Component Categories

#### 1. UI Primitives (`components/ui/`)

**Source:** shadcn/ui
**Purpose:** Reusable, accessible UI components based on Radix UI

Components:
- `button.tsx` - Button with variants (default, destructive, outline, ghost, link)
- `card.tsx` - Card container (header, content, footer)
- `dialog.tsx` - Modal dialog
- `form.tsx` - Form wrapper with react-hook-form integration
- `input.tsx` - Text input
- `select.tsx` - Dropdown select
- `table.tsx` - Data table
- `toast.tsx` - Toast notifications
- `tabs.tsx` - Tabbed interface
- `checkbox.tsx` - Checkbox
- `switch.tsx` - Toggle switch
- `badge.tsx` - Status badges
- `alert-dialog.tsx` - Confirmation dialogs
- `dropdown-menu.tsx` - Context menus
- `progress.tsx` - Progress bars
- `separator.tsx` - Dividers
- `sheet.tsx` - Side drawers
- `label.tsx` - Form labels

**Usage:**
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default">Save</Button>
  </CardContent>
</Card>
```

#### 2. Feature Components

**Settings Module (`components/settings/`):**
- `WarehouseFormModal.tsx` - Create/edit warehouse
- `LocationFormModal.tsx` - Create/edit location
- `MachineFormModal.tsx` - Create/edit machine
- `ProductionLineFormModal.tsx` - Create/edit production line
- `AllergenFormModal.tsx` - Create/edit allergen
- `TaxCodeFormModal.tsx` - Create/edit tax code
- `InvitationModal.tsx` - Invite user
- `InvitationSuccessModal.tsx` - Invitation sent confirmation
- `InvitationsTable.tsx` - Invitations list
- `EditUserDrawer.tsx` - Edit user role/status
- `OrganizationForm.tsx` - Organization settings
- `WarehouseCard.tsx` - Warehouse summary card
- `LocationDetailModal.tsx` - Location details view

**Technical Module (`components/technical/`):**
- `BOMFormModal.tsx` - Create/edit BOM
- `routings/create-routing-modal.tsx` - Create routing
- `routings/edit-routing-drawer.tsx` - Edit routing
- `routings/operations-table.tsx` - Routing operations list
- `routings/create-operation-modal.tsx` - Add operation
- `routings/edit-operation-drawer.tsx` - Edit operation
- `routings/assigned-products-table.tsx` - Products using routing
- `GenealogyTree.tsx` - Traceability tree visualization
- `LPNode.tsx` - License Plate node for React Flow

**Dashboard (`components/dashboard/`):**
- `WelcomeBanner.tsx` - Greeting banner
- `QuickActions.tsx` - Action shortcuts
- `ActivityFeed.tsx` - Recent activity stream
- `ModuleCard.tsx` - Module enablement cards

**Authentication (`components/auth/`):**
- `LoginForm.tsx` - Login form
- `SignupForm.tsx` - Signup form (not used - invitations only)
- `ForgotPasswordForm.tsx` - Password reset request
- `ResetPasswordForm.tsx` - Password reset confirmation
- `PasswordStrength.tsx` - Password strength meter
- `UserMenu.tsx` - User dropdown menu

**Navigation (`components/navigation/`):**
- `Sidebar.tsx` - Main navigation sidebar with module links

**Common (`components/common/`):**
- `coming-soon-modal.tsx` - Placeholder for future features

### Component Patterns

**1. Form Modal Pattern:**

```tsx
// components/settings/WarehouseFormModal.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createWarehouseSchema, type CreateWarehouseInput } from '@/lib/validation/warehouse-schemas'
import { toast } from 'sonner'

interface WarehouseFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function WarehouseFormModal({ open, onClose, onSuccess }: WarehouseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      code: '',
      name: '',
      status: 'active',
    },
  })

  const onSubmit = async (data: CreateWarehouseInput) => {
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/settings/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success('Warehouse created successfully')
        form.reset()
        onClose()
        onSuccess?.()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create warehouse')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Warehouse</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="WH01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Warehouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

**2. Data Table Pattern:**

```tsx
// Pattern used in InvitationsTable, operations-table, etc.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function DataTable({ data }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.email}</TableCell>
            <TableCell>{item.role}</TableCell>
            <TableCell>
              <Badge variant={item.status === 'pending' ? 'secondary' : 'default'}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button size="sm">Resend</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## State Management

**Strategy:** Server-driven state with minimal client state

### Client State (React Hooks)

```tsx
// Local UI state only
const [open, setOpen] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)
```

### Server State (SWR Pattern - Future)

Currently using fetch with manual revalidation:

```tsx
const onSuccess = () => {
  router.refresh()  // Revalidate server components
}
```

**Planned:** SWR or React Query for automatic revalidation

```tsx
import useSWR from 'swr'

const { data, error, mutate } = useSWR('/api/settings/warehouses', fetcher)

// After mutation
await mutate()  // Revalidate cache
```

### Form State (react-hook-form)

```tsx
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ }
})

const { formState: { errors, isSubmitting } } = form
```

---

## Validation Strategy

### Dual Validation (Client + Server)

**1. Client-Side (react-hook-form + Zod):**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'

const form = useForm({
  resolver: zodResolver(createWarehouseSchema)
})
```

**2. Server-Side (Zod in API routes):**

```typescript
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'

const body = await request.json()
const input = createWarehouseSchema.parse(body)  // Throws ZodError if invalid
```

### Validation Schemas (`lib/validation/`)

Schema files:
- `auth-schemas.ts` - Login, signup, password reset
- `warehouse-schemas.ts` - Warehouse CRUD
- `location-schemas.ts` - Location CRUD
- `machine-schemas.ts` - Machine CRUD
- `production-line-schemas.ts` - Production line CRUD
- `allergen-schemas.ts` - Allergen CRUD
- `tax-code-schemas.ts` - Tax code CRUD
- `user-schemas.ts` - User management
- `organization-schemas.ts` - Organization settings
- `product-schemas.ts` - Product CRUD
- `bom-schemas.ts` - BOM CRUD
- `routing-schemas.ts` - Routing CRUD
- `planning-schemas.ts` - PO, TO, Suppliers
- `tracing-schemas.ts` - Traceability queries
- `dashboard-schemas.ts` - Dashboard filters

**Example Schema:**

```typescript
// lib/validation/warehouse-schemas.ts
import { z } from 'zod'

export const createWarehouseSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must not exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
})

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>

export const updateWarehouseSchema = createWarehouseSchema.partial()

export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>

export const warehouseFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export type WarehouseFilters = z.infer<typeof warehouseFiltersSchema>
```

---

## Authentication & Authorization

### Authentication Flow

**1. Login:**
```typescript
// app/login/page.tsx (uses LoginForm component)
// ↓
// LoginForm.tsx submits to Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
// ↓
// On success → redirect to /dashboard
```

**2. Session Management:**
```typescript
// middleware.ts - protects (authenticated) routes
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/(authenticated)/:path*',
  ],
}
```

**3. Multi-Session Support:**
```typescript
// lib/services/session-service.ts
// Tracks all user sessions in user_sessions table
// Allows viewing active devices and revoking sessions
```

**4. JWT Blacklist:**
```typescript
// lib/services/jwt-blacklist-service.ts
// Redis-based token revocation for logout
await addToBlacklist(token)
```

### Authorization (RBAC)

**Roles:** `owner`, `admin`, `user`

**Role Checks:**

```typescript
// In API routes
const { data: currentUser } = await supabase
  .from('users')
  .select('role')
  .eq('id', session.user.id)
  .single()

if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**RLS Policies:**

```sql
-- All tables have org isolation
CREATE POLICY "tenant_isolation" ON warehouses
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

---

## Caching Strategy

### Redis Cache (`lib/cache/`)

**warehouse-cache.ts:**
```typescript
import { redis } from './redis-client'

const CACHE_TTL = 300  // 5 minutes

export async function getCachedWarehouses(
  orgId: string,
  filters?: WarehouseFilters
): Promise<Warehouse[] | null> {
  const key = `warehouses:${orgId}:${JSON.stringify(filters || {})}`
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedWarehouses(
  orgId: string,
  filters: WarehouseFilters | undefined,
  data: Warehouse[]
): Promise<void> {
  const key = `warehouses:${orgId}:${JSON.stringify(filters || {})}`
  await redis.setex(key, CACHE_TTL, JSON.stringify(data))
}

export async function invalidateWarehouseCache(orgId: string): Promise<void> {
  const pattern = `warehouses:${orgId}:*`
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

**Redis Client:**
```typescript
// lib/cache/redis-client.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

### Cache Usage Pattern

```typescript
// In services
export async function listWarehouses(filters?: WarehouseFilters) {
  const orgId = await getCurrentOrgId()

  // Try cache
  const cached = await getCachedWarehouses(orgId, filters)
  if (cached) return { success: true, data: cached }

  // Fetch from DB
  const { data } = await supabaseAdmin.from('warehouses').select('*')

  // Set cache
  await setCachedWarehouses(orgId, filters, data)

  return { success: true, data }
}

// After mutation
await invalidateWarehouseCache(orgId)
```

---

## Migration Management

**Location:** `lib/supabase/migrations/`

**Naming:** `XXX_description.sql` (e.g., `024_create_products_tables.sql`)

### Migration Pattern

```sql
-- Migration 024: Create Products Tables
-- Epic 2 - Batch 2A: Products + Settings
-- Stories: 2.1, 2.2, 2.3, 2.4, 2.5, 2.22
-- Date: 2025-01-23

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: products
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type product_type NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_org_code ON products(org_id, code);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_org_isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Comments
COMMENT ON TABLE products IS 'Products master data (Story 2.1)';
```

### Applying Migrations

**Script:** `scripts/apply-migration.mjs`

```javascript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const migrationFile = process.argv[2]
const sql = fs.readFileSync(migrationFile, 'utf-8')

const { error } = await supabase.rpc('exec_sql', { query: sql })

if (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}

console.log('Migration applied successfully')
```

**Usage:**
```bash
node scripts/apply-migration.mjs lib/supabase/migrations/024_create_products_tables.sql
```

### Migration History

51 migrations applied (as of 2025-01-23):
- 000-002: Organizations + Users foundation
- 003-009: Settings module (Epic 1)
- 010-019: RLS fixes, permissions, JWT claims
- 020-026: Technical module (Epic 2)
- 027-033: Traceability + Planning (Epic 2-3)

---

## Testing Architecture

**Framework:** Vitest 4.0 + Testing Library

**Location:** `__tests__/`

### Test Structure

```
__tests__/
├── api/                      # API route tests
│   ├── settings/
│   │   ├── warehouses.test.ts
│   │   ├── locations.test.ts
│   │   ├── machines.test.ts
│   │   └── tax-codes.test.ts
│   ├── technical/
│   └── auth/
├── lib/                      # Library tests
│   ├── services/
│   │   └── user-validation.test.ts
│   ├── validation/
│   │   ├── auth-schemas.test.ts
│   │   ├── location-schemas.test.ts
│   │   └── user-schemas.test.ts
│   └── activity/
│       └── log-activity.test.ts
└── integration/              # Integration tests
```

### Test Patterns

**1. API Route Test:**

```typescript
// __tests__/api/settings/warehouses.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createServerSupabaseAdmin } from '@/lib/supabase/server'

describe('POST /api/settings/warehouses', () => {
  beforeEach(async () => {
    // Clean up test data
    const supabase = createServerSupabaseAdmin()
    await supabase.from('warehouses').delete().eq('code', 'TEST-WH')
  })

  it('creates warehouse with valid input', async () => {
    const response = await fetch('http://localhost:3000/api/settings/warehouses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=...'  // Test session
      },
      body: JSON.stringify({
        code: 'TEST-WH',
        name: 'Test Warehouse',
        status: 'active'
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.code).toBe('TEST-WH')
  })

  it('returns 400 for duplicate code', async () => {
    // Create first warehouse
    await createWarehouse({ code: 'TEST-WH', name: 'First' })

    // Try to create duplicate
    const response = await fetch('http://localhost:3000/api/settings/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'TEST-WH',
        name: 'Second'
      })
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.code).toBe('DUPLICATE_CODE')
  })
})
```

**2. Validation Schema Test:**

```typescript
// __tests__/lib/validation/warehouse-schemas.test.ts
import { describe, it, expect } from 'vitest'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'

describe('createWarehouseSchema', () => {
  it('validates correct input', () => {
    const input = {
      code: 'WH01',
      name: 'Main Warehouse',
      status: 'active'
    }

    const result = createWarehouseSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects invalid code format', () => {
    const input = {
      code: 'wh01',  // Lowercase not allowed
      name: 'Main Warehouse'
    }

    const result = createWarehouseSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error.errors[0].message).toContain('uppercase')
  })

  it('requires name', () => {
    const input = {
      code: 'WH01'
    }

    const result = createWarehouseSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
```

### Test Commands

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Key Patterns & Conventions

### 1. File Naming

- **Components:** PascalCase (`WarehouseFormModal.tsx`)
- **Services:** kebab-case (`warehouse-service.ts`)
- **Utils:** kebab-case (`qr-code-generator.ts`)
- **Types:** PascalCase interfaces, kebab-case files (`dashboard.ts`)
- **Tests:** `*.test.ts` suffix
- **Migrations:** `XXX_description.sql`

### 2. Import Order

```typescript
// 1. React/Next imports
import { useState } from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. Third-party libraries
import { z } from 'zod'
import { useForm } from 'react-hook-form'

// 3. Internal imports (absolute paths)
import { createServerSupabase } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'

// 4. Types
import type { Warehouse } from '@/lib/validation/warehouse-schemas'
```

### 3. Error Handling

**API Routes:**
```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    )
  }

  console.error('Operation error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Services:**
```typescript
export async function operation(): Promise<ServiceResult> {
  try {
    // Operation
    return { success: true, data }
  } catch (error) {
    console.error('Service error:', error)
    return {
      success: false,
      error: 'Operation failed',
      code: 'DATABASE_ERROR'
    }
  }
}
```

### 4. TypeScript Patterns

**Inferred Types from Zod:**
```typescript
const schema = z.object({ /* ... */ })
type Input = z.infer<typeof schema>
```

**Generated Supabase Types:**
```typescript
// lib/supabase/generated.types.ts
export type Database = {
  public: {
    Tables: {
      warehouses: {
        Row: { /* ... */ }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
    }
  }
}
```

**Service Result Pattern:**
```typescript
interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCode
}
```

### 5. Async/Await Patterns

**Always use try/catch:**
```typescript
async function operation() {
  try {
    const result = await supabase.from('table').select()
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}
```

**Parallel operations:**
```typescript
const [users, warehouses, locations] = await Promise.all([
  supabase.from('users').select(),
  supabase.from('warehouses').select(),
  supabase.from('locations').select()
])
```

### 6. Component Composition

**Favor composition over props drilling:**

```tsx
// Good
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// Avoid
<Card title="Title" content={<>Content</>} />
```

### 7. Code Comments

**Service functions:**
```typescript
/**
 * Create warehouse with org isolation
 * AC-004.1: Admin może stworzyć warehouse
 *
 * @param input - CreateWarehouseInput (validated by Zod)
 * @returns WarehouseServiceResult with created warehouse or error
 */
export async function createWarehouse(input: CreateWarehouseInput) {
  // Implementation
}
```

**Complex logic:**
```typescript
// Check if code already exists for this org (AC-004.1)
const { data: existing } = await supabaseAdmin
  .from('warehouses')
  .select('id')
  .eq('org_id', orgId)
  .eq('code', input.code)
  .single()
```

---

**End of Code Architecture Documentation**

**Kontekst pozostały: ~129000 tokenów**
