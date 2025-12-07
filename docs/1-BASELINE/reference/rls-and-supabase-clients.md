# RLS (Row Level Security) and Supabase Clients

## Problem Overview

**Issue:** RLS policies in Supabase check `auth.jwt() ->> 'org_id'` to enforce multi-tenancy, but when using the **authenticated Supabase client** (`createServerSupabase()`), the JWT token must contain org_id in claims. This causes INSERT/UPDATE/SELECT operations to fail with "row violates row-level security policy" errors.

**Solution:** Use **admin Supabase client** (`createServerSupabaseAdmin()`) in service layer to bypass RLS policies.

---

## Two Supabase Clients

### 1. Authenticated Client - `createServerSupabase()`
```typescript
import { createServerSupabase } from '../supabase/server'

const supabase = await createServerSupabase()
```

- **Uses:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Authentication:** Reads JWT from cookies
- **RLS:** **ENFORCED** - all policies are checked
- **Use cases:**
  - Auth operations (`supabase.auth.getUser()`)
  - Client-side operations where RLS is desired

### 2. Admin Client - `createServerSupabaseAdmin()`
```typescript
import { createServerSupabaseAdmin } from '../supabase/server'

const supabaseAdmin = createServerSupabaseAdmin()
```

- **Uses:** `SUPABASE_SERVICE_ROLE_KEY` (server-side only!)
- **Authentication:** Service role (bypasses auth)
- **RLS:** **BYPASSED** - policies check for service_role and allow
- **Use cases:**
  - **All database operations in service layer**
  - CREATE, READ, UPDATE, DELETE on tables with RLS
  - Admin operations

---

## How to Write Services Correctly

### ✅ CORRECT Pattern

```typescript
import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

export async function createWarehouse(input: CreateWarehouseInput) {
  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()

  // Use authenticated client for auth operations
  const { data: { user } } = await supabase.auth.getUser()

  // Get org_id from public.users (not from JWT!)
  const orgId = await getCurrentOrgId()

  // Use ADMIN CLIENT for database operations
  const { data, error } = await supabaseAdmin
    .from('warehouses')
    .insert({
      org_id: orgId,  // We add org_id to payload manually
      code: input.code,
      name: input.name,
      created_by: user.id,
    })
    .select()
    .single()

  return { success: !error, data, error }
}

export async function listWarehouses(filters?: WarehouseFilters) {
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  // Use ADMIN CLIENT for SELECT queries
  const { data, error } = await supabaseAdmin
    .from('warehouses')
    .select('*')
    .eq('org_id', orgId)  // Filter by org_id manually

  return { success: !error, data, error }
}
```

### ❌ INCORRECT Pattern (Will Fail)

```typescript
// ❌ DON'T DO THIS
export async function createWarehouse(input: CreateWarehouseInput) {
  const supabase = await createServerSupabase()
  const orgId = await getCurrentOrgId()

  // ❌ Using authenticated client for DB operations
  const { data, error } = await supabase  // <-- WRONG!
    .from('warehouses')
    .insert({
      org_id: orgId,
      code: input.code,
    })

  // This will fail with: "new row violates row-level security policy"
  // Because RLS checks auth.jwt() ->> 'org_id', but we use payload org_id
}
```

---

## Why This Happens

### RLS Policy Example
```sql
-- warehouses INSERT policy
CREATE POLICY warehouses_insert_policy ON public.warehouses
  FOR INSERT
  WITH CHECK (
    -- Option 1: Service role (bypasses RLS)
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
    OR
    -- Option 2: Authenticated user with org_id in JWT
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid  -- ← Checks JWT claim!
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );
```

**What RLS checks:**
1. Is the current role `service_role`? → If YES, allow (bypass RLS)
2. Does `auth.jwt() ->> 'org_id'` match the `org_id` in INSERT payload? → If YES and user is admin, allow

**Problem with authenticated client:**
- JWT may not have `org_id` claim (even after migration 019)
- Even if it does, relying on JWT claims requires users to re-login
- Server-side operations should not depend on user JWT state

**Solution with admin client:**
- Admin client uses `service_role` key
- RLS checks `service_role` and bypasses all policies
- We enforce org_id filtering **manually** in service layer

---

## Migration 019 - org_id in JWT

Migration 019 adds org_id to JWT claims in `auth.users.raw_app_meta_data`:

```sql
-- Migration 019: Sync org_id from public.users to auth.users app_metadata
CREATE OR REPLACE FUNCTION sync_user_org_id_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('org_id', NEW.org_id)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_org_id_to_jwt
  AFTER INSERT OR UPDATE OF org_id ON public.users
  FOR EACH ROW
  WHEN (NEW.org_id IS NOT NULL)
  EXECUTE FUNCTION sync_user_org_id_to_jwt();
```

**However:** Even with this migration, **we still use admin client in services** because:
1. Server-side code should not depend on user session state
2. Admin client is more reliable and performant
3. No need for users to re-login to get new JWT
4. Centralized org_id enforcement in service layer

---

## getCurrentOrgId() Helper

All services use this helper to get org_id from `public.users`:

```typescript
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get org_id from public.users (NOT from JWT!)
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id || null
}
```

**Why query `public.users` instead of using JWT?**
- JWT might not have org_id claim (depends on when user logged in)
- Querying DB is source of truth
- More reliable than JWT state

---

## Checklist for New Services

When creating a new service that accesses database tables with RLS:

- [ ] Import both clients: `import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'`
- [ ] Use `createServerSupabase()` only for auth operations (`auth.getUser()`)
- [ ] Use `createServerSupabaseAdmin()` for ALL database queries
- [ ] Add `org_id` to INSERT/UPDATE payloads manually
- [ ] Filter by `org_id` in SELECT queries manually (`.eq('org_id', orgId)`)
- [ ] Use `getCurrentOrgId()` helper to get org_id from `public.users`

---

## Environment Variables Required

### For authenticated client:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### For admin client:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**⚠️ IMPORTANT:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client! Only use in server-side code.

---

## Summary

| Client Type | Key | RLS | Use In Services? |
|------------|-----|-----|-----------------|
| `createServerSupabase()` | ANON_KEY | ✅ Enforced | ❌ No (only for auth) |
| `createServerSupabaseAdmin()` | SERVICE_ROLE_KEY | ⏭️ Bypassed | ✅ Yes (all DB ops) |

**Golden Rule:** Use admin client for database, authenticated client for auth.

---

## Files Fixed

The following services have been updated to use admin client:

- ✅ `warehouse-service.ts`
- ✅ `allergen-service.ts`
- ✅ `location-service.ts`
- ✅ `machine-service.ts`
- ✅ `production-line-service.ts`
- ✅ `tax-code-service.ts`
- ✅ `invitation-service.ts`
- ✅ `module-service.ts`
- ✅ `wizard-service.ts`

All CRUD operations (CREATE, READ, UPDATE, DELETE) now use `supabaseAdmin` to bypass RLS.
