---
name: nextjs-server-components
description: When building Next.js App Router pages and deciding between Server and Client Components.
---

## When to Use
When building Next.js App Router pages and deciding between Server and Client Components.

## Patterns

### Default: Server Components
```tsx
// app/page.tsx - Server Component by default
async function Page() {
  const data = await db.query('SELECT * FROM posts');
  return <PostList posts={data} />;
}

// ✅ Direct DB/API access
// ✅ Secrets safe (never sent to client)
// ✅ Zero client JS for this component
```

### Client Component ("use client")
```tsx
'use client'
// Only add when you NEED:
// - useState, useEffect, useContext
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Composition Pattern
```tsx
// Server Component (parent)
async function Dashboard() {
  const user = await getUser();
  return (
    <div>
      <UserInfo user={user} />       {/* Server */}
      <InteractiveChart />           {/* Client */}
    </div>
  );
}

// Pass server data to client as props
<ClientComponent initialData={serverData} />
```

### Data Fetching in Server Components
```tsx
// ✅ Parallel fetching
async function Page() {
  const [posts, user] = await Promise.all([
    getPosts(),
    getUser()
  ]);
  return <Feed posts={posts} user={user} />;
}
```

## Anti-Patterns
- Adding "use client" to every component (defeats RSC benefits)
- Importing server-only code in client components
- Passing functions as props from Server to Client
- Using useEffect for data that could be fetched on server

## Verification Checklist
- [ ] "use client" only where actually needed
- [ ] No secrets in client components
- [ ] Server data passed as serializable props
- [ ] Parallel data fetching where possible
