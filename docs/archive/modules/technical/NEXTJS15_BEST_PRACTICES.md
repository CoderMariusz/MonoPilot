# Next.js 15 Best Practices

## Overview
This document outlines the best practices for Next.js 15 App Router, data fetching patterns, and deployment strategies based on the latest documentation and Context7 findings.

## App Router Data Fetching Patterns

### Server Components vs Client Components

#### Server Components (Default)
- **Use for**: Data fetching, server-side logic, database queries
- **Benefits**: Better performance, SEO, security
- **Pattern**: Async functions that fetch data directly

```tsx
// ✅ Good: Server Component with direct data fetching
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  const posts = await data.json()
  
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

#### Client Components
- **Use for**: Interactive UI, state management, browser APIs
- **Pattern**: Mark with `'use client'` directive

```tsx
// ✅ Good: Client Component for interactivity
'use client'

import { useState } from 'react'

export default function InteractiveComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Data Fetching Strategies

#### 1. Server-Side Data Fetching (Recommended)
```tsx
// ✅ Best Practice: Server Component with caching
export default async function Page() {
  // Static data - cached until manually invalidated
  const staticData = await fetch('https://api.example.com/static', {
    cache: 'force-cache'
  })
  
  // Dynamic data - refetched on every request
  const dynamicData = await fetch('https://api.example.com/dynamic', {
    cache: 'no-store'
  })
  
  // ISR - cached with revalidation
  const revalidatedData = await fetch('https://api.example.com/isr', {
    next: { revalidate: 60 }
  })
  
  return <div>...</div>
}
```

#### 2. Client-Side Data Fetching
```tsx
// ✅ Good: Client Component with SWR
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ClientDataFetching() {
  const { data, error, isLoading } = useSWR('/api/data', fetcher)
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading data</div>
  
  return <div>{JSON.stringify(data)}</div>
}
```

#### 3. Hybrid Approach (Server + Client)
```tsx
// ✅ Best Practice: Server fetches initial data, Client handles updates
export default async function Page() {
  // Server-side initial data
  const initialData = await fetch('https://api.example.com/data')
  const posts = await initialData.json()
  
  return (
    <div>
      <h1>Posts</h1>
      <ClientPostsList initialPosts={posts} />
    </div>
  )
}

// Client component for interactivity
'use client'
export function ClientPostsList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts)
  
  // Handle real-time updates, mutations, etc.
  return <div>...</div>
}
```

### API Routes in App Router

#### Route Handler Structure
```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const users = await fetchUsers()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await createUser(body)
  return NextResponse.json(user, { status: 201 })
}
```

#### Dynamic Routes
```tsx
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await fetchUser(id)
  return NextResponse.json(user)
}
```

## Environment Variables

### Configuration
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Usage Patterns
```tsx
// ✅ Good: Server-side only
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ✅ Good: Client-accessible
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
```

## Deployment on Vercel

### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "pnpm install && pnpm frontend:build",
  "outputDirectory": "apps/frontend/.next",
  "installCommand": "pnpm install"
}
```

### Environment Variables in Vercel
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_USE_MOCK_DATA=false`

### Build Optimization
```tsx
// ✅ Good: Dynamic imports for code splitting
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
})

// ✅ Good: Image optimization
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={false}
/>
```

## Error Handling

### Server Components
```tsx
// ✅ Good: Error boundaries
export default async function Page() {
  try {
    const data = await fetchData()
    return <div>{data}</div>
  } catch (error) {
    return <div>Error loading data</div>
  }
}
```

### Client Components
```tsx
'use client'

import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

## Performance Best Practices

### 1. Caching Strategies
```tsx
// Static data
const staticData = await fetch(url, { cache: 'force-cache' })

// Dynamic data
const dynamicData = await fetch(url, { cache: 'no-store' })

// ISR with revalidation
const isrData = await fetch(url, { next: { revalidate: 3600 } })
```

### 2. Streaming and Suspense
```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostsList />
      </Suspense>
      <Suspense fallback={<div>Loading comments...</div>}>
        <CommentsList />
      </Suspense>
    </div>
  )
}
```

### 3. Code Splitting
```tsx
// ✅ Good: Dynamic imports
const Modal = dynamic(() => import('./Modal'), {
  ssr: false,
  loading: () => <div>Loading modal...</div>
})
```

## Security Best Practices

### 1. Server-Side Data Fetching
```tsx
// ✅ Good: Keep sensitive data on server
export default async function Page() {
  const apiKey = process.env.API_KEY // Server-only
  const data = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  
  return <div>{data}</div>
}
```

### 2. Environment Variables
```tsx
// ✅ Good: Server-only variables
const secret = process.env.SECRET_KEY

// ✅ Good: Client-accessible variables
const publicUrl = process.env.NEXT_PUBLIC_API_URL
```

## Migration from Pages Router

### Key Changes
1. **File Structure**: Move from `pages/` to `app/`
2. **Data Fetching**: Replace `getServerSideProps` with Server Components
3. **API Routes**: Update to new route handler format
4. **Client Components**: Add `'use client'` directive

### Migration Checklist
- [ ] Move pages to `app/` directory
- [ ] Convert `getServerSideProps` to Server Components
- [ ] Update API routes to new format
- [ ] Add `'use client'` to interactive components
- [ ] Update imports and routing
- [ ] Test all functionality

## Common Pitfalls

### 1. Mixing Server and Client Code
```tsx
// ❌ Bad: Server Component with client-side code
export default function Page() {
  const [state, setState] = useState(0) // Error: useState in Server Component
  
  return <div>{state}</div>
}

// ✅ Good: Separate concerns
export default function Page() {
  return <ClientComponent />
}

'use client'
function ClientComponent() {
  const [state, setState] = useState(0)
  return <div>{state}</div>
}
```

### 2. Incorrect Data Fetching
```tsx
// ❌ Bad: Client-side fetch in Server Component
export default function Page() {
  useEffect(() => {
    fetch('/api/data').then(res => res.json())
  }, [])
  
  return <div>...</div>
}

// ✅ Good: Direct server-side fetch
export default async function Page() {
  const data = await fetch('/api/data')
  const result = await data.json()
  
  return <div>{result}</div>
}
```

## Testing Strategies

### 1. Server Component Testing
```tsx
// Test server components with mocked data
import { render } from '@testing-library/react'
import Page from './page'

jest.mock('@/lib/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' })
}))

test('renders server component', async () => {
  const result = await render(<Page />)
  expect(result.getByText('test')).toBeInTheDocument()
})
```

### 2. Client Component Testing
```tsx
// Test client components with user interactions
import { render, screen, fireEvent } from '@testing-library/react'
import ClientComponent from './ClientComponent'

test('handles user interaction', () => {
  render(<ClientComponent />)
  
  const button = screen.getByRole('button')
  fireEvent.click(button)
  
  expect(screen.getByText('Clicked!')).toBeInTheDocument()
})
```

## Conclusion

Next.js 15 App Router provides powerful patterns for building modern web applications. The key is to:

1. **Use Server Components by default** for data fetching and static content
2. **Use Client Components sparingly** for interactivity and browser APIs
3. **Leverage caching strategies** for optimal performance
4. **Follow security best practices** for environment variables
5. **Test both server and client components** appropriately

This approach ensures optimal performance, security, and maintainability in Next.js 15 applications.
