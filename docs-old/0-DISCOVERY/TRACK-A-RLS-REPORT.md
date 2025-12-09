# Track A: DB/RLS Investigation Report

**Agent:** ARCHITECT-AGENT
**Date:** 2025-12-06
**Status:** Complete

---

## Executive Summary

Zbadano strukturę Supabase clientów, serwisów, RLS policies i migracji. Projekt ma przemyślaną architekturę z service role bypass, ale zidentyfikowano **5 poważnych problemów**.

---

## Issues Found

### Issue #1: Missing RLS on production_outputs table
**Severity:** HIGH
**File:** `apps/frontend/lib/supabase/migrations/041_create_production_outputs.sql`
**Impact:** Users can read/write production_outputs from ANY org - breaks multi-tenancy

**Fix:**
```sql
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY production_outputs_select ON production_outputs
  FOR SELECT TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    organization_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

### Issue #2: Duplicate auth logic in API routes
**Severity:** MEDIUM
**Files:** Multiple API routes
**Pattern:** Every route manually checks session → queries users table → checks role
**Impact:** Code duplication, inconsistent auth, extra DB queries

**Fix:** Create centralized auth middleware

### Issue #3: Redundant org_id lookups in services
**Severity:** MEDIUM
**Files:** warehouse-service.ts, purchase-order-service.ts
**Pattern:** Services call `getCurrentOrgId()` which queries users table
**Impact:** Extra DB query per service call - org_id is already in JWT

**Fix:** Use JWT claims instead of DB lookup

### Issue #4: Inconsistent service parameter patterns
**Severity:** LOW
**Pattern:** No consistency in how services access DB:
- warehouse-service: Uses `createServerSupabase()` internally
- material-reservation-service: Takes `supabase` param in constructor ✓
- output-registration-service: Uses `createAdminClient()`

**Fix:** Standardize on constructor injection

### Issue #5: Missing RLS on related tables
**Severity:** MEDIUM
**Affected:**
- `wo_materials`: Extended but NO RLS
- `lp_genealogy`: Original RLS unclear

---

## Recommendations

### Priority 1 (Immediate):
1. Add RLS to `production_outputs`
2. Verify JWT org_id in auth.users.raw_app_meta_data
3. Test RLS bypass with service_role

### Priority 2 (Next sprint):
1. Create auth middleware
2. Refactor services to accept context in constructor
3. Add RLS to all new tables

### Priority 3 (Optimization):
1. Use JWT org_id instead of DB lookup
2. Add comprehensive RLS tests

---

## Verification Checklist

- [ ] Migration 019 applied? (Check: `SELECT raw_app_meta_data FROM auth.users`)
- [ ] RLS policies exist on all tables?
- [ ] production_outputs has RLS?
- [ ] E2E tests pass with RLS enabled?
- [ ] Cross-org isolation tests added?
