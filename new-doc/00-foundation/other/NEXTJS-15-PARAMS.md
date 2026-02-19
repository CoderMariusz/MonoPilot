# Next.js 15+/16: Async Params Migration Guide

## Overview

In Next.js 15, the `params` prop in both **page components** and **API route handlers** is now **asynchronous** and must be awaited. This change applies to all dynamic route segments (e.g., `[id]`, `[slug]`).

## Breaking Change

### Before (Next.js 14 and earlier):
```typescript
// ❌ OLD - No longer works in Next.js 15
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id
  // ...
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  // ...
}
```

### After (Next.js 15):
```typescript
// ✅ NEW - Required in Next.js 15
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])
  // ...
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```

## Migration Patterns

### 1. Page Components (Client Components)

For client components, unwrap params in a useEffect:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

export default function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string>('')

  // Unwrap params
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  // Use id in your fetch function
  const fetchData = useCallback(async () => {
    if (!id) return
    const response = await fetch(`/api/items/${id}`)
    // ...
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return <div>{/* ... */}</div>
}
```

### 2. API Route Handlers

For API routes, await params at the start of the function:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params immediately
  const { id } = await params

  try {
    // Now use id directly
    const data = await db.query('SELECT * FROM items WHERE id = ?', [id])
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 3. Multiple Dynamic Segments

For routes with multiple dynamic segments (e.g., `/items/[id]/comments/[commentId]`):

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id, commentId } = await params

  // Use both id and commentId
  const comment = await db.comments.findUnique({
    where: { id: commentId, itemId: id }
  })

  return NextResponse.json({ comment })
}
```

## Automated Migration

We've created a script to automatically fix all API routes:

```bash
node scripts/fix-async-params.mjs
```

This script will:
1. Find all `route.ts` files with dynamic params
2. Convert `{ params: { id: string } }` to `{ params: Promise<{ id: string }> }`
3. Add `const { id } = await params` at the start of each function
4. Replace all `params.id` references with `id`

## Common Pitfalls

### ❌ Forgetting to await params
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ❌ WRONG - params is a Promise, not an object
  const data = await db.find(params.id)
}
```

### ✅ Correct approach
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ CORRECT - await params first
  const { id } = await params
  const data = await db.find(id)
}
```

### ❌ Accessing params synchronously in client components
```typescript
'use client'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // ❌ WRONG - Cannot await in component body
  const { id } = await params
}
```

### ✅ Correct approach for client components
```typescript
'use client'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')

  // ✅ CORRECT - Unwrap in useEffect
  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])
}
```

## Type Safety

Ensure your TypeScript types are updated:

```typescript
// Define a type for your params
type PageParams = Promise<{ id: string }>

// Use it consistently
export default function Page({ params }: { params: PageParams }) {
  // ...
}

// For API routes
export async function GET(
  request: NextRequest,
  { params }: { params: PageParams }
) {
  // ...
}
```

## Testing

After migration, verify:

1. ✅ TypeScript compilation passes: `pnpm type-check`
2. ✅ Build succeeds: `pnpm build`
3. ✅ All dynamic routes work correctly
4. ✅ API endpoints return expected data

## Resources

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Next.js Docs: Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Vercel Next.js 15 Upgrade Guide](https://vercel.com/blog/next-js-15)
