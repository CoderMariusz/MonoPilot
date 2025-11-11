# Multi-Tenant RLS Status Report

**Date:** 2025-11-04  
**Purpose:** Phase 1.3.6 - Document multi-tenant RLS implementation status

## Executive Summary

**Status:** ⚠️ **NOT IMPLEMENTED** (Documented for Phase 2)

Multi-tenant data isolation is **not currently implemented** in the MonoPilot MES system. This is documented as a **Phase 2 / Post-MVP** enhancement.

---

## Current State

### What Exists

✅ Basic RLS policies on all tables  
✅ Authentication via Supabase Auth  
✅ Basic `authenticated` role checks  

### What Does NOT Exist

❌ `organization_id` / `tenant_id` columns  
❌ `organizations` table  
❌ Multi-tenant RLS policies  
❌ Organization-based data isolation  
❌ Multi-tenant smoke tests  

---

## Why Multi-Tenant is Not in Phase 1

### Phase 1 Scope

Phase 1 focuses on **single-tenant MVP** deployment:
- Single organization
- Single production facility
- Basic authentication (user-based, not org-based)
- Foundation for future multi-tenant support

### Decision Rationale

1. **MVP Priority:** Get core MES functionality working first
2. **Complexity:** Multi-tenant adds significant complexity to:
   - Schema design (organization_id everywhere)
   - RLS policies (every query filtered by org)
   - Auth flow (organization selection, user→org mapping)
   - Testing (cross-tenant isolation validation)
3. **Deployment Target:** Initial deployment is single-tenant (one customer)
4. **Foundation Ready:** Schema can be extended with organization_id in Phase 2

---

## Phase 2 Multi-Tenant Implementation Plan

### 1. Database Schema Changes

#### Add Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscription_plan VARCHAR(50), -- e.g., 'free', 'pro', 'enterprise'
  max_users INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Add organization_id to All Main Tables

```sql
-- Core tables
ALTER TABLE products ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE boms ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE work_orders ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE po_header ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE to_header ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

-- Master data
ALTER TABLE suppliers ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE warehouses ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE machines ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE locations ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE routings ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

-- Warehouse & Production
ALTER TABLE license_plates ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE grns ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE stock_moves ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE production_outputs ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

-- Settings (if shared, skip organization_id)
-- allergens, tax_codes might be shared across orgs or per-org (TBD)
```

#### User→Organization Mapping

**Option A:** Supabase auth.users metadata
```sql
-- Store in auth.users.raw_app_meta_data
{
  "organization_id": "uuid-here",
  "role": "admin"
}
```

**Option B:** Dedicated table
```sql
CREATE TABLE user_organizations (
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50), -- 'admin', 'member', 'viewer'
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, organization_id)
);
```

---

### 2. RLS Policy Updates

#### Pattern for All Tables

```sql
-- Example for products table
DROP POLICY IF EXISTS "Users can read products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

-- New multi-tenant policies
CREATE POLICY "Users can read own org products" ON products
  FOR SELECT
  USING (
    organization_id = (
      SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "Users can insert own org products" ON products
  FOR INSERT
  WITH CHECK (
    organization_id = (
      SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "Users can update own org products" ON products
  FOR UPDATE
  USING (
    organization_id = (
      SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "Users can delete own org products" ON products
  FOR DELETE
  USING (
    organization_id = (
      SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
    )
  );
```

**Apply this pattern to ~25-30 tables**

---

### 3. API Layer Changes

#### Automatic organization_id Injection

```typescript
// In API layer, inject organization_id for all writes
export class ProductsAPI {
  static async create(data: CreateProductData): Promise<Product> {
    // Get organization_id from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    const organizationId = user?.app_metadata?.organization_id;
    
    if (!organizationId) {
      throw new Error('User not associated with an organization');
    }
    
    const { data: product, error } = await supabase
      .from('products')
      .insert({ ...data, organization_id: organizationId })
      .select()
      .single();
    
    // ...
  }
}
```

#### RLS Handles Reads Automatically

- RLS policies filter reads by organization_id
- No explicit WHERE clause needed in API
- Prevents accidental cross-tenant data leaks

---

### 4. Multi-Tenant Smoke Test Implementation

**Test File:** `052_multi_tenant_rls_test.sql` (already created as stub)

#### Test Scenarios

1. **Cross-Tenant Read Isolation**
   - User from Org A cannot see Org B's products
   - Verified for all main tables

2. **Cross-Tenant Write Isolation**
   - User from Org A cannot update/delete Org B's data
   - Verified for all main tables

3. **Own-Org Access**
   - User from Org A can see/edit their own data
   - Verified for all main tables

4. **Junction Tables**
   - BOM items inherit organization_id from parent BOM
   - PO lines inherit from PO header
   - etc.

5. **RPC Functions**
   - cancel_work_order only affects own-org WOs
   - cancel_purchase_order only affects own-org POs
   - get_material_std_cost only returns own-org product costs

#### CI Integration

```yaml
# .github/workflows/test.yml
- name: Multi-Tenant RLS Smoke Test
  run: |
    psql $DATABASE_URL -c "SELECT * FROM test_multi_tenant_rls();"
    # Check for "PASSED" status on all tests
```

---

### 5. Frontend Changes

#### Organization Selection UI

**For multi-org users:**
- Organization switcher in header
- Store selected org in session/localStorage
- Pass organization_id in API calls (though RLS handles filtering)

**For single-org users:**
- No UI change needed
- Organization is fixed in auth metadata

#### Onboarding Flow

1. User signs up
2. Creates or joins organization
3. Organization_id stored in auth metadata
4. User gains access to organization's data

---

## Migration Path (Phase 1 → Phase 2)

### Step 1: Create Organizations Table

Run migration to add organizations table.

### Step 2: Backfill Existing Data

```sql
-- Create default organization for existing data
INSERT INTO organizations (id, name, code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'DEFAULT');

-- Backfill all tables with default organization_id
UPDATE products SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE work_orders SET organization_id = '00000000-0000-0000-0000-000000000001';
-- etc. for all tables
```

### Step 3: Add NOT NULL Constraints

```sql
-- After backfill, make organization_id NOT NULL
ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
-- etc.
```

### Step 4: Update RLS Policies

Run migration to drop old policies and add new multi-tenant policies.

### Step 5: Update API Layer

Deploy updated API code with organization_id injection.

### Step 6: Test

Run multi-tenant smoke tests, verify isolation.

---

## Testing Strategy

### Unit Tests

- Test RLS policies in isolation
- Mock different organization_ids
- Verify filtering works correctly

### Integration Tests

- Create 2+ test organizations
- Create test users in each org
- Verify data isolation
- Test organization switcher (if multi-org users supported)

### Smoke Tests

- Run `test_multi_tenant_rls()` in CI
- Expect all tests to PASS

### Manual Testing

- Sign in as User A (Org 1)
- Create products, WOs, POs
- Sign in as User B (Org 2)
- Verify User B cannot see User A's data
- Verify User B can create their own data

---

## Security Considerations

### 1. RLS is Mandatory

- **Never disable RLS** on multi-tenant tables
- Even for admin users, use service role only for migrations/backups

### 2. No Trust in Client Code

- Never rely on client-side filtering
- organization_id must be enforced at database level (RLS)

### 3. Index Performance

- organization_id should be first column in composite indexes
- Example: `CREATE INDEX idx_products_org_active ON products(organization_id, is_active);`

### 4. Service Role Usage

- Service role bypasses RLS
- Use ONLY for:
  - System migrations
  - Background jobs that operate across orgs (e.g., billing)
  - Admin tools (with extreme caution)

### 5. Audit Trail

- Log organization_id in all audit_log entries
- Verify audit logs cannot leak cross-tenant data

---

## Performance Considerations

### 1. Indexes

Add organization_id to all indexes:

```sql
-- Before (single-tenant)
CREATE INDEX idx_products_active ON products(is_active);

-- After (multi-tenant)
CREATE INDEX idx_products_org_active ON products(organization_id, is_active);
```

### 2. Query Patterns

RLS adds WHERE organization_id = X to every query:

```sql
-- User query:
SELECT * FROM products WHERE is_active = true;

-- With RLS (automatic):
SELECT * FROM products 
WHERE is_active = true 
  AND organization_id = 'user-org-id';
```

Ensure indexes support this pattern.

### 3. Connection Pooling

- Each user session needs organization_id set
- Use Supabase auth for automatic RLS context
- No manual SET LOCAL needed with Supabase

---

## Timeline Estimate

**Phase 2 Multi-Tenant Implementation:**

- Schema changes: 1-2 days
- RLS policy updates: 2-3 days
- API layer updates: 2-3 days
- Frontend updates (org switcher): 1-2 days
- Testing (unit + integration + smoke): 2-3 days
- Documentation: 1 day

**Total: 9-14 days** (1.5-2 weeks)

---

## Conclusion

**Phase 1 Status:** ✅ Single-tenant foundation complete  
**Multi-Tenant Status:** ⚠️ Not implemented (Phase 2)  
**Blocker for Phase 1:** ❌ No - single-tenant deployment is sufficient for MVP  
**Ready for Phase 2:** ✅ Yes - schema can be extended, plan is documented

---

**Recommendation:** 

✅ **Approve Phase 1 completion** without multi-tenant support.  
📋 **Schedule multi-tenant for Phase 2** (post-MVP, ~2 weeks of work).  
🔒 **Current RLS provides basic auth security** - sufficient for single-tenant deployment.

---

**Last Updated:** 2025-11-04  
**Status:** Phase 1 Complete (Single-Tenant) | Phase 2 Planned (Multi-Tenant)  
**Next Steps:** Deploy Phase 1, gather feedback, schedule Phase 2 multi-tenant implementation

