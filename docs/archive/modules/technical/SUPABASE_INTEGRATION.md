# Supabase Integration Best Practices

## Overview
This document outlines the best practices for integrating Supabase with Next.js 15, covering client/server usage, Row Level Security, real-time subscriptions, and TypeScript integration.

## Client vs Server Usage

### Server-Side Supabase Client

#### 1. Server Components
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component - can be ignored
            // if middleware is refreshing user sessions
          }
        }
      }
    }
  )
}
```

#### 2. Usage in Server Components
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Not authenticated</div>
  }

  // Fetch user-specific data
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching posts:', error)
    return <div>Error loading posts</div>
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <PostsList posts={posts} />
    </div>
  )
}
```

### Client-Side Supabase Client

#### 1. Browser Client
```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 2. Usage in Client Components
```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [supabase])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
```

## Row Level Security (RLS) Patterns

### 1. Enable RLS on Tables
```sql
-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own posts
CREATE POLICY "Users can view own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own posts
CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. RLS with Server Components
```typescript
// Server component automatically respects RLS
export default async function PostsPage() {
  const supabase = await createClient()
  
  // This query will only return posts for the authenticated user
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  return <PostsList posts={posts} />
}
```

### 3. RLS Testing
```typescript
// Test RLS policies
test('users cannot see each other\'s posts', async () => {
  const u1 = await supabase.auth.signUp({
    email: 'u1@test.com',
    password: 'pass'
  })
  const u2 = await supabase.auth.signUp({
    email: 'u2@test.com',
    password: 'pass'
  })

  // User 1 creates a post
  await supabase.auth.signInWithPassword({
    email: 'u1@test.com',
    password: 'pass'
  })
  const { data: post } = await supabase
    .from('posts')
    .insert({ title: 'secret', user_id: u1.data.user.id })
    .select()
    .single()

  // User 2 tries to access User 1's post
  await supabase.auth.signInWithPassword({
    email: 'u2@test.com',
    password: 'pass'
  })
  const { data: rows } = await supabase
    .from('posts')
    .select()
    .eq('id', post.id)

  // Should return empty array due to RLS
  expect(rows?.length ?? 0).toBe(0)
})
```

## Real-Time Subscriptions

### 1. Client-Side Real-Time
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function RealtimePosts({ serverPosts }) {
  const [posts, setPosts] = useState(serverPosts)
  const supabase = createClient()

  useEffect(() => {
    setPosts(serverPosts)
  }, [serverPosts])

  useEffect(() => {
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' }, 
        (payload) => {
          setPosts((posts) => [...posts, payload.new])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((posts) => 
            posts.map((post) => 
              post.id === payload.new.id ? payload.new : post
            )
          )
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((posts) => 
            posts.filter((post) => post.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
```

### 2. Server-Side Real-Time Setup
```typescript
// Server component provides initial data
export default async function PostsPage() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  return <RealtimePosts serverPosts={posts} />
}
```

## TypeScript Integration

### 1. Generate Types from Database
```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

### 2. Typed Supabase Client
```typescript
// types/supabase.ts
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type TypedSupabaseClient = SupabaseClient<Database>
```

### 3. Usage with Types
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle error
          }
        }
      }
    }
  )
}
```

### 4. Typed Queries
```typescript
// Type-safe database queries
export default async function PostsPage() {
  const supabase = await createClient()
  
  // TypeScript will infer the return type
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      created_at,
      user_id,
      users!inner(
        id,
        email,
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return <div>Error loading posts</div>
  }

  return <PostsList posts={posts} />
}
```

## Migration Best Practices

### 1. Database Migrations
```sql
-- Create migration file: 001_initial_schema.sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. Apply Migrations
```bash
# Apply migrations to Supabase
npx supabase db push

# Or apply specific migration
npx supabase migration up --target 001
```

### 3. Environment Setup
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Authentication Patterns

### 1. Server Actions for Auth
```typescript
// app/auth/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

### 2. Auth Form Component
```typescript
// app/auth/login/page.tsx
import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
```

## Performance Optimization

### 1. Caching Strategies
```typescript
// Server component with caching
export default async function PostsPage() {
  const supabase = await createClient()
  
  // Cache for 1 hour
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  return <PostsList posts={posts} />
}

// Add caching headers
export const revalidate = 3600 // 1 hour
```

### 2. Optimistic Updates
```typescript
'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CreatePost() {
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const { error } = await supabase
        .from('posts')
        .insert({ title, user_id: (await supabase.auth.getUser()).data.user?.id })
      
      if (error) {
        console.error('Error creating post:', error)
      } else {
        setTitle('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

## Error Handling

### 1. Server-Side Error Handling
```typescript
export default async function PostsPage() {
  try {
    const supabase = await createClient()
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')

    if (error) {
      console.error('Database error:', error)
      return <div>Error loading posts</div>
    }

    return <PostsList posts={posts} />
  } catch (error) {
    console.error('Unexpected error:', error)
    return <div>Something went wrong</div>
  }
}
```

### 2. Client-Side Error Handling
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CreatePost() {
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (formData: FormData) => {
    try {
      setError(null)
      
      const { error: dbError } = await supabase
        .from('posts')
        .insert({ title: formData.get('title') as string })
      
      if (dbError) {
        setError('Failed to create post')
      }
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="title" placeholder="Post title" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

## Security Best Practices

### 1. Environment Variables
```bash
# Server-only (secure)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Client-accessible (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. RLS Policies
```sql
-- Always enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "Users can only see own data" ON users
  FOR ALL USING (auth.uid() = id);
```

### 3. Input Validation
```typescript
// Validate input on server
export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  
  // Validate input
  if (!title || title.length < 3) {
    throw new Error('Title must be at least 3 characters')
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('posts')
    .insert({ title: title.trim() })
  
  if (error) throw error
}
```

## Conclusion

Supabase integration with Next.js 15 provides a powerful foundation for building modern web applications. Key practices include:

1. **Use appropriate client types** (server vs browser)
2. **Implement RLS policies** for data security
3. **Leverage real-time subscriptions** for dynamic UIs
4. **Generate and use TypeScript types** for type safety
5. **Follow migration best practices** for schema changes
6. **Implement proper error handling** at all levels
7. **Optimize performance** with caching and optimistic updates

This approach ensures secure, performant, and maintainable Supabase integrations in Next.js 15 applications.
