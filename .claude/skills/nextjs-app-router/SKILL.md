---
name: nextjs-app-router
description: Apply when building Next.js 13-16 applications with App Router for routing, layouts, data fetching, and server components.
---

## When to Use

Apply when building Next.js 13-16 applications with App Router for routing, layouts, data fetching, and server components.

## Patterns

### Pattern 1: Route Structure
```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI
├── error.tsx           # Error boundary
├── dashboard/
│   ├── layout.tsx      # Nested layout
│   ├── page.tsx        # /dashboard
│   └── [id]/
│       └── page.tsx    # /dashboard/:id
└── api/
    └── users/
        └── route.ts    # API route /api/users
```
Source: https://nextjs.org/docs/app/building-your-application/routing

### Pattern 2: Server Component (Default)
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/data-fetching
// app/posts/page.tsx - Server Component (no 'use client')
async function PostsPage() {
  const posts = await db.posts.findMany(); // Direct DB access

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
export default PostsPage;
```

### Pattern 3: Client Component
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/rendering/client-components
'use client'; // Mark as client component

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Pattern 4: Dynamic Routes with Params
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
// app/posts/[id]/page.tsx
// Note: In Next.js 15+, params is a Promise and must be awaited.
// Earlier versions used synchronous access (deprecated pattern).
interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  return <article>{post.content}</article>;
}
```

### Pattern 5: Search Params (Query Strings)
```typescript
// Source: https://nextjs.org/docs/messages/sync-dynamic-apis
// app/shop/page.tsx
// Note: In Next.js 15+, searchParams is a Promise and must be awaited.
interface Props {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const { sort, page } = await searchParams;
  const products = await getProducts({ sort, page: Number(page) || 1 });
  return <ProductList products={products} />;
}
```

### Pattern 6: API Route Handler
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const users = await db.users.findMany();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.users.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

### Pattern 7: Metadata for SEO
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
// app/posts/[id]/page.tsx
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post.title, description: post.excerpt };
}
```

## Anti-Patterns

- **'use client' everywhere** - Default to server, add client only when needed
- **Fetching in client components** - Fetch in server components, pass as props
- **Direct DB in client** - Use API routes or server actions
- **Missing loading.tsx** - Always add for async pages
- **Accessing params/searchParams without await** - Next.js 15+ requires async access

## Verification Checklist

- [ ] Server components for data fetching (no 'use client')
- [ ] Client components only for interactivity
- [ ] Dynamic routes use params correctly (awaited in Next.js 15+)
- [ ] searchParams awaited for query string access
- [ ] loading.tsx exists for async pages
- [ ] Metadata defined for SEO
