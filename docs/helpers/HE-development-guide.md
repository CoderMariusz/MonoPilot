# MonoPilot Development Helper Guide

**Ostatnia aktualizacja:** 2025-01-23
**Cel:** Skondensowany przewodnik dla szybkiego developmentu z mniejszą ilością błędów

---

## 📋 Spis Treści

1. [Quick Start](#quick-start)
2. [Architektura: Zasady Złote](#architektura-zasady-złote)
3. [Baza Danych: Wzorce i Pułapki](#baza-danych-wzorce-i-pułapki)
4. [API: Service Layer Pattern](#api-service-layer-pattern)
5. [Frontend: Next.js App Router](#frontend-nextjs-app-router)
6. [Migracje: Procedury](#migracje-procedury)
7. [Testing: Minimum Required](#testing-minimum-required)
8. [Code Review Checklist](#code-review-checklist)
9. [Antywzorce i Błędy](#antywzorce-i-błędy)

---

## Quick Start

### Technologie
- **Frontend**: Next.js 15.1.4 + React 19 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + Radix UI
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Package Manager**: pnpm (monorepo)

### Struktura Projektu
```
MonoPilot/
├── apps/frontend/          # Next.js app
│   ├── app/                # App Router pages
│   │   ├── (authenticated)/ # Protected routes
│   │   ├── api/            # API routes (modularized)
│   │   └── auth/           # Public auth pages
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   │   ├── api/            # API client classes
│   │   ├── services/       # Business logic
│   │   ├── supabase/       # Supabase clients
│   │   ├── validation/     # Zod schemas
│   │   └── types.ts        # TypeScript types
│   └── middleware.ts       # Route protection
├── packages/shared/        # Shared utilities
├── docs/                   # Documentation (BMad method)
│   ├── architecture/       # Architecture docs
│   ├── epics/              # 8 epics (1-8)
│   ├── prd/                # Product requirements
│   └── sprint-artifacts/   # Stories + tech specs
└── scripts/                # Migration scripts
```

### Komendy
```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Build for production
pnpm type-check             # TypeScript validation
pnpm lint                   # ESLint check

# Testing
pnpm test                   # Run all tests
pnpm test:unit              # Vitest unit tests
pnpm test:e2e               # Playwright e2e tests
pnpm test:e2e:ui            # Playwright UI mode

# Database
node scripts/apply-migration-XXX.mjs  # Apply single migration
SUPABASE_ACCESS_TOKEN=xxx node ...    # Use production DB
```

---

## Architektura: Zasady Złote

### 1. Separacja Warstw (Layer Separation)

```
Request → API Route → Service → Supabase → Database
          ↓           ↓         ↓
          Validation  Business  RLS Bypass
                      Logic
```

**Zasady:**
- **API Routes**: Tylko routing i request/response handling
- **Services**: Business logic + data access (ZAWSZE używaj `supabaseAdmin`)
- **Components**: Tylko UI rendering + client-side state

### 2. Multi-Tenancy (org_id)

**🔴 KRYTYCZNE:** Każda tabela biznesowa ma `org_id`

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  -- ... fields
);

-- RLS policy
CREATE POLICY "Tenant isolation" ON warehouses
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

**Zawsze:**
- ✅ Dodawaj `org_id` w INSERT
- ✅ Filtruj po `org_id` w SELECT
- ✅ Waliduj `org_id` w UPDATE/DELETE

### 3. Audit Trail (4 kolumny)

```sql
-- Standard audit columns (ZAWSZE dodawaj)
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id)
```

**Auto-update trigger:**
```sql
CREATE TRIGGER update_timestamp
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## Baza Danych: Wzorce i Pułapki

### Supabase Clients: ZŁOTA ZASADA

**❌ NIGDY nie używaj `createServerSupabase()` do operacji DB**
**✅ ZAWSZE używaj `createServerSupabaseAdmin()` w services**

```typescript
// ❌ BŁĄD - RLS policy violation
import { createServerSupabase } from '@/lib/supabase/server'

export async function createWarehouse(input) {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('warehouses').insert(input) // ❌ FAIL
}

// ✅ POPRAWNE - używaj admin client
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

export async function createWarehouse(input) {
  const supabase = await createServerSupabase()  // Auth only
  const supabaseAdmin = createServerSupabaseAdmin()  // DB operations

  const { data: { user } } = await supabase.auth.getUser()
  const orgId = await getCurrentOrgId()

  const { data } = await supabaseAdmin  // ✅ ADMIN CLIENT
    .from('warehouses')
    .insert({
      ...input,
      org_id: orgId,        // Manual org_id
      created_by: user.id,
    })
}
```

**Dlaczego?**
- RLS policies sprawdzają `auth.jwt() ->> 'org_id'`
- JWT może nie mieć org_id w claims
- Service role bypasuje RLS
- Więcej w: `docs/RLS_AND_SUPABASE_CLIENTS.md`

### Migration Pattern

**Konwencja nazewnictwa:**
```
XXX_opis_zmiany.sql
001_create_organizations_table.sql
002_create_users_table.sql
024_create_products_tables.sql
```

**Szablon migracji:**
```sql
-- Migration XXX: [Opis]
-- Epic X - Batch XY
-- Stories: X.Y, X.Z
-- Date: YYYY-MM-DD

-- ============================================================================
-- ENUMS (if needed)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('RM', 'WIP', 'FG');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: {table_name}
-- ============================================================================
CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Business fields
  code TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  UNIQUE(org_id, code)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_{table}_org_id ON {table_name}(org_id);
CREATE INDEX IF NOT EXISTS idx_{table}_code ON {table_name}(org_id, code);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table}_tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_timestamp
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Soft Delete Pattern

**Kiedy używać:**
- ✅ Historical reference (work_orders, license_plates)
- ✅ Traceability requirements (products, boms)
- ✅ Audit compliance (po_header)
- ❌ Notifications, cache tables

```sql
-- Add column
deleted_at TIMESTAMPTZ,

-- Index for active records
CREATE INDEX idx_{table}_active ON {table}(org_id)
  WHERE deleted_at IS NULL;

-- Service method
async function softDelete(id: string) {
  return await supabaseAdmin
    .from('table')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
}
```

### Date-Based Versioning (BOMs)

```sql
CREATE TABLE boms (
  product_id UUID NOT NULL,
  version INTEGER NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,  -- NULL = no end date
  UNIQUE (product_id, version)
);

-- Validation trigger (prevent overlaps)
CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND (
        (NEW.effective_from <= effective_to OR effective_to IS NULL)
        AND (NEW.effective_to >= effective_from OR NEW.effective_to IS NULL)
      )
  ) THEN
    RAISE EXCEPTION 'BOM date ranges cannot overlap for product %', NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## API: Service Layer Pattern

### Service Template

```typescript
// apps/frontend/lib/services/warehouse-service.ts
import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { createWarehouseSchema } from '../validation/schemas'
import type { Warehouse, CreateWarehouseInput } from '../types'

export async function createWarehouse(input: CreateWarehouseInput) {
  // 1. Get auth
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized', data: null }
  }

  // 2. Get org_id
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    return { success: false, error: 'No organization found', data: null }
  }

  // 3. Validate input (Zod)
  const validated = createWarehouseSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.flatten(), data: null }
  }

  // 4. Use ADMIN CLIENT for DB operations
  const supabaseAdmin = createServerSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('warehouses')
    .insert({
      ...validated.data,
      org_id: orgId,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Create warehouse error:', error)
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}

export async function listWarehouses(filters?: { status?: string }) {
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  let query = supabaseAdmin
    .from('warehouses')
    .select('*')
    .eq('org_id', orgId)  // Manual filter
    .is('deleted_at', null)  // Exclude soft-deleted
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  return { success: !error, data: data || [], error }
}

// Helper: Get current org_id from public.users
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return data?.org_id || null
}
```

### API Route Template

```typescript
// apps/frontend/app/api/settings/warehouses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createWarehouse, listWarehouses } from '@/lib/services/warehouse-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filters = {
    status: searchParams.get('status') || undefined,
  }

  const result = await listWarehouses(filters)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result.data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createWarehouse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('POST /api/settings/warehouses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Frontend: Next.js App Router

### Route Groups (Authenticated)

```
app/
├── (authenticated)/       # Protected routes (middleware enforced)
│   ├── layout.tsx         # Common layout with nav
│   ├── dashboard/
│   ├── settings/
│   └── technical/
├── api/                   # API routes
├── login/                 # Public auth pages
└── middleware.ts          # Auth protection
```

**middleware.ts pattern:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Form Pattern (React Hook Form + Zod)

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWarehouseSchema } from '@/lib/validation/schemas'
import type { CreateWarehouseInput } from '@/lib/types'

export function CreateWarehouseForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
  })

  const onSubmit = async (data: CreateWarehouseInput) => {
    const res = await fetch('/api/settings/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      alert(error.error)
      return
    }

    const warehouse = await res.json()
    alert('Warehouse created!')
    // Redirect or close modal
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Code</label>
        <input {...register('code')} />
        {errors.code && <span>{errors.code.message}</span>}
      </div>

      <div>
        <label>Name</label>
        <input {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Warehouse'}
      </button>
    </form>
  )
}
```

---

## Migracje: Procedury

### Applying Migrations

**1. Local Development:**
```bash
# Create migration script
cp scripts/apply-migration-023.mjs scripts/apply-migration-024.mjs

# Edit script - update migration file path
# Run migration
SUPABASE_ACCESS_TOKEN=xxx node scripts/apply-migration-024.mjs
```

**2. Production:**
```bash
# ZAWSZE testuj na staging/development NAJPIERW!
# Backup database przed migracją!

SUPABASE_ACCESS_TOKEN=prod_token node scripts/apply-migration-024.mjs
```

**3. Migration Script Template:**
```javascript
// scripts/apply-migration-024.mjs
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MIGRATION_FILE = '024_create_products_tables.sql'
const SUPABASE_PROJECT_ID = 'pgroxddbtaevdegnidaz'
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

async function applyMigration() {
  const migrationPath = join(
    __dirname,
    '../apps/frontend/lib/supabase/migrations',
    MIGRATION_FILE
  )
  const sql = readFileSync(migrationPath, 'utf-8')

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  if (!response.ok) {
    console.error('❌ Migration failed:', await response.text())
    process.exit(1)
  }

  console.log('✅ Migration applied successfully!')
}

applyMigration()
```

### Migration Checklist

**Przed aplikowaniem:**
- [ ] Review SQL w edytorze
- [ ] Sprawdź czy tabela już istnieje (`CREATE TABLE IF NOT EXISTS`)
- [ ] Sprawdź czy enum już istnieje (`DO $$ BEGIN ... EXCEPTION`)
- [ ] Dodano RLS policies
- [ ] Dodano indexy dla `org_id`
- [ ] Dodano trigger `update_timestamp`
- [ ] Testowano lokalnie

**Po aplikowaniu:**
- [ ] Zweryfikuj schemat w Supabase Dashboard
- [ ] Sprawdź czy RLS działa (test INSERT z authenticated user)
- [ ] Sprawdź czy indexy zostały utworzone
- [ ] Commit migration file do git
- [ ] Update `docs/DEVELOPMENT_HELPER_GUIDE.md` jeśli nowy wzorzec

---

## Testing: Minimum Required

### Story Testing Requirements (Task 10)

**1. Unit Tests (Vitest) - Validation Schemas:**
```typescript
// lib/validation/__tests__/warehouse-schemas.test.ts
import { describe, it, expect } from 'vitest'
import { createWarehouseSchema } from '../warehouse-schemas'

describe('createWarehouseSchema', () => {
  it('accepts valid warehouse data', () => {
    const result = createWarehouseSchema.safeParse({
      code: 'WH-001',
      name: 'Main Warehouse',
      address: '123 Street',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty code', () => {
    const result = createWarehouseSchema.safeParse({
      code: '',
      name: 'Main Warehouse',
    })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toContain('required')
  })
})
```

**2. Integration Tests (Vitest) - Services:**
```typescript
// lib/services/__tests__/warehouse-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createWarehouse } from '../warehouse-service'
import { createServerSupabaseAdmin } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')

describe('createWarehouse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates warehouse with admin client', async () => {
    const mockAdmin = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '123', code: 'WH-001' },
        error: null,
      }),
    }

    vi.mocked(createServerSupabaseAdmin).mockReturnValue(mockAdmin as any)

    const result = await createWarehouse({
      code: 'WH-001',
      name: 'Test Warehouse',
    })

    expect(result.success).toBe(true)
    expect(mockAdmin.from).toHaveBeenCalledWith('warehouses')
  })
})
```

**3. E2E Tests (Playwright) - User Flows:**
```typescript
// __tests__/e2e/settings/warehouses.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Warehouse Management', () => {
  test('create warehouse flow', async ({ page }) => {
    await page.goto('/settings/warehouses')

    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-TEST')
    await page.fill('input[name="name"]', 'Test Warehouse')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Warehouse created')).toBeVisible()
    await expect(page.locator('text=WH-TEST')).toBeVisible()
  })
})
```

### Test Coverage Minimum
- **Validation Schemas**: 100% (all rules tested)
- **Services**: 80% (happy path + main error cases)
- **E2E**: Critical user flows (create, update, delete)

---

## Code Review Checklist

**Przed oznaczeniem story jako "review":**

### A. Story File
- [ ] Status = "review" w story file
- [ ] Status = "review" w `sprint-status.yaml`
- [ ] Wszystkie ukończone taski `[x]`
- [ ] File List wypełniony (NEW/MODIFIED/DELETED)
- [ ] Completion Notes wypełnione
- [ ] Change Log zaktualizowany z commit hash

### B. Implementation
- [ ] Wszystkie AC zaimplementowane
- [ ] Brak TODO/FIXME w AC-critical code
- [ ] TypeScript errors = 0 (`pnpm type-check`)
- [ ] Linter errors = 0 (`pnpm lint`)
- [ ] Kod działa lokalnie

### C. Database
- [ ] Migration applied i zweryfikowana
- [ ] RLS policies dodane i przetestowane
- [ ] Indexes utworzone dla `org_id`
- [ ] Audit columns (created_at, updated_at, created_by, updated_by)

### D. Services
- [ ] Używa `createServerSupabaseAdmin()` dla DB ops
- [ ] Używa `getCurrentOrgId()` dla multi-tenancy
- [ ] Filtruje po `org_id` w SELECT
- [ ] Dodaje `org_id` w INSERT
- [ ] Validation z Zod

### E. Testing
- [ ] Unit tests dla schemas
- [ ] Integration tests dla services
- [ ] E2E tests dla user flows
- [ ] Wszystkie testy przechodzą (`pnpm test`)

### F. Documentation
- [ ] Completion Notes wyjaśniają key decisions
- [ ] Nowe wzorce dodane do DEVELOPMENT_HELPER_GUIDE.md
- [ ] API docs zaktualizowane (jeśli nowe endpointy)

---

## Antywzorce i Błędy

### ❌ NIGDY nie rób tego:

**1. Używanie authenticated client w services**
```typescript
// ❌ BŁĄD
const supabase = await createServerSupabase()
await supabase.from('warehouses').insert(data)  // RLS violation!
```

**2. Pomijanie org_id**
```typescript
// ❌ BŁĄD
await supabaseAdmin.from('warehouses').select('*')  // All orgs!

// ✅ POPRAWNE
await supabaseAdmin.from('warehouses').select('*').eq('org_id', orgId)
```

**3. Hardcoded org_id w kodzie**
```typescript
// ❌ BŁĄD
const orgId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'  // NIE!

// ✅ POPRAWNE
const orgId = await getCurrentOrgId()
```

**4. SELECT * w produkcji**
```typescript
// ❌ BŁĄD
.select('*')  // Fetches all columns, even unused ones

// ✅ POPRAWNE
.select('id, code, name, status')
```

**5. Brak validation**
```typescript
// ❌ BŁĄD
const body = await request.json()
await createWarehouse(body)  // No validation!

// ✅ POPRAWNE
const validated = createWarehouseSchema.parse(body)
await createWarehouse(validated)
```

**6. Pomijanie testów (Task 10)**
```typescript
// ❌ BŁĄD
// No tests written, marking story as "review"

// ✅ POPRAWNE
// Unit + Integration + E2E tests written and passing
```

**7. Status inconsistency**
```markdown
❌ BŁĄD:
Story file: Status: ready-for-dev
sprint-status.yaml: 1-0-authentication: review

✅ POPRAWNE:
Story file: Status: review
sprint-status.yaml: 1-0-authentication: review
```

**8. Migration bez IF NOT EXISTS**
```sql
-- ❌ BŁĄD
CREATE TABLE warehouses (...);  -- Fails if exists!

-- ✅ POPRAWNE
CREATE TABLE IF NOT EXISTS warehouses (...);
```

**9. Brak audit columns**
```sql
-- ❌ BŁĄD
CREATE TABLE products (
  id UUID PRIMARY KEY,
  code TEXT,
  name TEXT
);

-- ✅ POPRAWNE (dodaj audit trail)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  code TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**10. Brak Completion Notes**
```markdown
❌ BŁĄD:
### Completion Notes
(empty)

✅ POPRAWNE:
### Completion Notes
**Implementation Summary:**
- Implemented warehouse CRUD with RLS policies
- Used admin client pattern for DB operations
- Added validation schemas for create/update

**Key Technical Decisions:**
- DECISION: Used soft delete for warehouses (traceability)
- DECISION: Unique constraint on (org_id, code)
```

---

## 📚 Dodatkowe Zasoby

- **RLS i Supabase Clients:** `docs/RLS_AND_SUPABASE_CLIENTS.md`
- **Code Review Guide:** `docs/code-review-common-errors-guide.md`
- **Database Architecture:** `docs/architecture/patterns/database.md`
- **API Patterns:** `docs/architecture/patterns/api.md`
- **Epic 2 Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md`

---

## 🎯 Kluczowe Zasady (TL;DR)

1. **ZAWSZE używaj `createServerSupabaseAdmin()` w services**
2. **NIGDY nie pomijaj `org_id` filtering**
3. **ZAWSZE dodawaj audit columns (created_at, updated_at, created_by, updated_by)**
4. **ZAWSZE waliduj z Zod (client + server)**
5. **NIGDY nie pomijaj Task 10 (Testing)**
6. **ZAWSZE aktualizuj story file przed review**
7. **ZAWSZE sprawdź status consistency**
8. **ZAWSZE używaj `IF NOT EXISTS` w migracjach**
9. **ZAWSZE dodawaj RLS policies**
10. **ZAWSZE testuj migracje lokalnie przed production**

---

_Ten dokument jest living document. Dodawaj nowe wzorce i błędy po każdym code review._

**Ostatnia aktualizacja:** 2025-01-23 (Deep Scan workflow - initial version)
