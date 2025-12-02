# MonoPilot - Code Patterns Reference

> **UWAGA**: Ten plik jest REFERENCJĄ. AI powinno go czytać TYLKO gdy:
> - Tworzy nowy API endpoint
> - Tworzy nową migrację/RLS
> - Tworzy nowy komponent z Supabase
> - Pisze nowe testy E2E

---

## RLS Policy Pattern
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON table_name FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON table_name FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON table_name FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON table_name FOR DELETE TO authenticated USING (true);
```

---

## API Route Pattern
```typescript
// apps/frontend/src/app/api/[resource]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('table_name').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { data, error } = await supabase.from('table_name').insert(body).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

---

## Component Pattern
```typescript
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Component() {
  const [data, setData] = useState([])
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('table').select('*')
    setData(data || [])
  }

  return <div>{/* UI */}</div>
}
```

---

## E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test'
import { createTestOrganization, createTestUser } from './fixtures/test-setup'

test.describe('Feature X', () => {
  test('should do something', async ({ page, context, baseURL }) => {
    const { orgId } = await createTestOrganization()
    const { userId, token } = await createTestUser(orgId)

    await context.addCookies([{
      name: 'sb-auth',
      value: token,
      domain: new URL(baseURL!).hostname,
      path: '/',
    }])

    await page.goto('/page-url')
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

### Test Fixtures (test-setup.ts)
- `createTestOrganization()` - zwraca orgId
- `createTestUser(orgId)` - tworzy user + JWT
- `createTestWarehouses(orgId)` - 2 magazyny
- `createTestProducts(orgId, count)` - produkty
- `cleanupTestData(orgId)` - cleanup

---

## Server Actions Pattern (alternatywa dla API)
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('items').insert({
    name: formData.get('name')
  })
  if (error) throw new Error(error.message)
  revalidatePath('/items')
}
```
