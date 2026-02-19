---
name: supabase-queries
description: Apply when writing Supabase client queries for CRUD operations, filtering, joins, and real-time subscriptions.
---

## When to Use

Apply when writing Supabase client queries for CRUD operations, filtering, joins, and real-time subscriptions.

## Patterns

### Pattern 1: Select with Filters
```typescript
// Source: https://supabase.com/docs/reference/javascript/select
const { data, error } = await supabase
  .from('todos')
  .select('id, title, completed')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Pattern 2: Insert with Return
```typescript
// Source: https://supabase.com/docs/reference/javascript/insert
const { data, error } = await supabase
  .from('todos')
  .insert({ title: 'New todo', user_id: userId })
  .select()
  .single();
```

### Pattern 3: Update with Match
```typescript
// Source: https://supabase.com/docs/reference/javascript/update
const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId)
  .select()
  .single();
```

### Pattern 4: Select with Relations (JOIN)
```typescript
// Source: https://supabase.com/docs/reference/javascript/select
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:profiles(name, avatar_url),
    comments(id, content)
  `)
  .eq('published', true);
```

### Pattern 5: Upsert (Insert or Update)
```typescript
// Source: https://supabase.com/docs/reference/javascript/upsert
const { data, error } = await supabase
  .from('profiles')
  .upsert({ id: userId, name: 'New Name' })
  .select()
  .single();
```

### Pattern 6: Count Query
```typescript
// Source: https://supabase.com/docs/reference/javascript/select
const { count, error } = await supabase
  .from('todos')
  .select('*', { count: 'exact', head: true })
  .eq('completed', false);
```

## Anti-Patterns

- **Not handling errors** - Always check `error` before using `data`
- **Select * in production** - Specify columns explicitly for performance
- **Missing .single()** - Use when expecting one row, prevents array return
- **Chaining after await** - Build query first, then await

## Verification Checklist

- [ ] Error handling: `if (error) throw error`
- [ ] Specific columns selected (not `*`)
- [ ] `.single()` used for single-row queries
- [ ] RLS policies allow the operation
- [ ] Types match database schema

## MonoPilot: org_id Filtering

Every query in MonoPilot is org-scoped via RLS. The pattern:

```typescript
// In services: RLS automatically filters by org_id (via auth session)
const supabase = await createServerSupabase()
const { data, count, error } = await supabase
  .from('suppliers')
  .select('id, code, name, is_active', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false })

// In API routes: get org_id explicitly for logic
const { orgId } = await getAuthContextOrThrow(supabase)

// Pagination pattern
const offset = (page - 1) * limit
const { data, count } = await query.range(offset, offset + limit - 1)
return { data, meta: { total: count, page, limit, pages: Math.ceil(count / limit) } }
```

**Key**: Use `createServerSupabase()` (not admin client) so RLS filters by org_id automatically. Use admin client only for cross-org operations.
