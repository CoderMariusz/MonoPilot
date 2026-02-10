---
name: testing-monopilot
description: >-
  MonoPilot-specific test patterns for Vitest, Supabase mocking,
  Next.js API routes, and ShadCN components. Use when writing any
  tests for MonoPilot - unit, integration, API, or component tests.
---

## CRITICAL: Vitest, NOT Jest

This project uses **Vitest**. Never use Jest APIs.

```typescript
// CORRECT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
vi.fn()        // NOT jest.fn()
vi.mock()      // NOT jest.mock()
vi.clearAllMocks()  // NOT jest.clearAllMocks()

// WRONG - will break all tests
jest.fn()      // DOES NOT EXIST
jest.mock()    // DOES NOT EXIST
```

## Pattern 1: Supabase Chainable Mock

Supabase uses fluent API: `.from().select().eq().single()`. Mock must return chain.

```typescript
function createChainableMock(): any {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    from: vi.fn(() => createChainableMock()),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  })),
}))
```

To customize responses per table, track the table name in `.from()`:

```typescript
from: vi.fn((table: string) => {
  const chain = createChainableMock()
  if (table === 'users') {
    chain.single.mockResolvedValue({
      data: { org_id: 'test-org', role: [{ code: 'admin' }] },
      error: null,
    })
  }
  return chain
})
```

## Pattern 2: API Route Test (NextRequest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock Supabase (see Pattern 1)
vi.mock('@/lib/supabase/server', () => ({ /* ... */ }))

describe('GET /api/v1/{module}/{resource}', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should return 401 when unauthenticated', async () => {
    // Override auth mock for this test
    const request = new NextRequest('http://localhost/api/v1/module/resource')
    const response = await GET(request, { params: Promise.resolve({ id: 'x' }) })
    expect(response.status).toBe(401)
  })

  it('should return data for authenticated user', async () => {
    const request = new NextRequest('http://localhost/api/v1/module/resource')
    const response = await GET(request, { params: Promise.resolve({ id: 'x' }) })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toBeDefined()
  })
})
```

**NOTE**: Route params use `Promise.resolve()` (Next.js 15+ async params).

## Pattern 3: Component Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'  // Custom render with providers
import userEvent from '@testing-library/user-event'

describe('MyComponent', () => {
  it('should render and handle interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent onSave={vi.fn()} />)

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /save/i }))
  })
})
```

**Import from `@/test/test-utils`** (NOT from `@testing-library/react` directly) - this wraps components in QueryClientProvider.

## Pattern 4: JSDOM Setup (Already Configured)

`vitest.setup.ts` already provides these polyfills. Do NOT add them to test files:
- `Element.prototype.hasPointerCapture` (Radix UI)
- `Element.prototype.setPointerCapture`
- `global.ResizeObserver` (Radix Popover/Select)
- Custom fetch mock (preserves Supabase, mocks API endpoints)

If ShadCN component tests fail with "X is not a function", the polyfill is already in setup.

## Pattern 5: RLS Isolation Test

```typescript
describe('RLS & Multi-Tenancy', () => {
  it('should enforce org_id isolation (RLS)', async () => {
    // GIVEN: user from Org A requests resource from Org B
    // Supabase RLS returns PGRST116 (row not found due to policy)
    mockSupabase.from.mockReturnValue({
      ...createChainableMock(),
      single: vi.fn(() => Promise.resolve({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' },
      })),
    })

    // WHEN
    const request = new NextRequest('http://localhost/api/v1/module/resource')
    const response = await GET(request, { params: Promise.resolve({ id: 'other-org-id' }) })

    // THEN: 404 (not 403 - don't leak resource existence)
    expect(response.status).toBe(404)
  })
})
```

## Pattern 6: Integration Test (Real DB)

Only use for complex scenarios. Requires env vars.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

describe.skip('Integration: {Feature}', () => {
  const testOrgId = process.env.TEST_ORG_ID!
  let createdIds: string[] = []

  afterAll(async () => {
    // ALWAYS cleanup test data
    if (createdIds.length > 0) {
      await supabase.from('table').delete().in('id', createdIds)
    }
  })

  it('should create and retrieve', async () => {
    const { data } = await supabase.from('table')
      .insert({ org_id: testOrgId, name: 'test' })
      .select().single()
    createdIds.push(data.id)
    expect(data.name).toBe('test')
  })
})
```

**Use `describe.skip`** for integration tests (they need live DB, don't run in CI).

## Pattern 7: TDD RED Phase Template

When writing RED phase tests (tests that MUST fail):

```typescript
describe('Story XX.Y: {Feature Name}', () => {
  // ACCEPTANCE CRITERIA from story context:
  // AC-1: {description}
  // AC-2: {description}

  describe('AC-1: {description}', () => {
    it('should {expected behavior}', async () => {
      // TODO: Implement component/route
      // This test intentionally fails (RED phase)
      expect(true).toBe(false) // PLACEHOLDER - remove when implementing
    })
  })

  describe('AC-2: {description}', () => {
    it('should {expected behavior}', async () => {
      expect(true).toBe(false) // PLACEHOLDER
    })
  })
})

/*
 * TDD RED Phase Summary:
 * Total tests: N
 * Expected status: ALL FAIL
 * Next: Developer implements code to make these pass (GREEN phase)
 *
 * Test files created:
 * - {list paths}
 *
 * data-testid attributes used:
 * - {list all testids for frontend handoff}
 */
```

## File Locations

| Type | Path Pattern |
|------|-------------|
| Unit tests | `apps/frontend/__tests__/{module}/{feature}.test.ts` |
| API tests | `apps/frontend/__tests__/api/{module}/{feature}.test.ts` |
| Component tests | `apps/frontend/__tests__/components/{module}/{Feature}.test.tsx` |
| E2E tests | `apps/frontend/e2e/{module}/{feature}.spec.ts` |
| Test utils | `apps/frontend/test/test-utils.tsx` |
| Vitest config | `apps/frontend/vitest.config.ts` |
| Vitest setup | `apps/frontend/vitest.setup.ts` |