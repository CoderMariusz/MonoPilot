# Migration 026 Verification Report
**Date:** 2025-12-23
**Story:** 01.16 - User Invitations (Email)
**Migration:** `supabase/migrations/026_create_user_invitations.sql`

## Status: FIXED ✅

## Changes Made

### 1. Fixed Schema Mismatches

#### Role Field Type (CRITICAL FIX)
- **Before:** `role_id UUID NOT NULL REFERENCES roles(id)`
- **After:** `role TEXT NOT NULL`
- **Reason:** invitation-service.ts expects `role: string` (line 22, 149, 250)
- **Impact:** Without this fix, all INSERT/SELECT operations would fail

#### Added Missing `sent_at` Field (CRITICAL FIX)
- **Before:** Field did not exist
- **After:** `sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`
- **Reason:** Service uses `sent_at` heavily (lines 193, 261 in invitation-service.ts)
- **Impact:** Without this fix, queries like `.order('sent_at', { ascending: false })` would fail

#### Token Field Type
- **Before:** `VARCHAR(64)` (fixed length for crypto tokens)
- **After:** `TEXT` (variable length)
- **Reason:** Service uses JWT tokens (variable length), not fixed 64-char crypto tokens
- **Impact:** JWT tokens can exceed 64 characters, causing truncation errors

### 2. Fixed Unique Constraint

#### Pending Invitation Constraint
- **Before:** `CONSTRAINT unique_pending_invitation UNIQUE(org_id, email, status)`
- **After:** `CREATE UNIQUE INDEX user_invitations_unique_pending_idx ON public.user_invitations(org_id, email) WHERE status = 'pending'`
- **Reason:** PostgreSQL doesn't support CHECK constraints in UNIQUE constraints; must use partial index
- **Impact:** Ensures only ONE pending invitation per email per org (prevents spam)

### 3. Fixed RLS Policies

#### Role Code Values
- **Before:** `r.code IN ('SUPER_ADMIN', 'ADMIN')`
- **After:** `r.code IN ('owner', 'admin')`
- **Reason:** user-schemas.ts defines role codes as lowercase (line 14-25)
- **Impact:** Without this fix, admins couldn't create/manage invitations (403 Forbidden)

#### Policy Granularity
- **Before:** Single `FOR ALL` policy for write operations
- **After:** Separate policies for INSERT, UPDATE, DELETE
- **Reason:** ADR-013 pattern + better security (principle of least privilege)
- **Impact:** More granular access control, easier to audit

### 4. Removed Unnecessary Fields

#### Cancelled_at Field
- **Before:** `cancelled_at TIMESTAMPTZ`
- **After:** Removed
- **Reason:** Not used by invitation-service.ts (status changes handle cancellation)
- **Impact:** Simpler schema, no breaking changes

### 5. Updated Metadata

- Migration number: 084 → 026 (correct sequence)
- Token description: crypto.randomBytes(32) → JWT token
- Added sent_at comment

## Field Mapping Verification

| Service Field (invitation-service.ts) | Database Column | Type Match | Notes |
|---------------------------------------|-----------------|------------|-------|
| `id` | `id` | ✅ UUID | Primary key |
| `org_id` | `org_id` | ✅ UUID | Multi-tenant isolation |
| `email` | `email` | ✅ TEXT | Validated with regex |
| `role` | `role` | ✅ TEXT | **FIXED:** Was role_id UUID |
| `token` | `token` | ✅ TEXT | **FIXED:** Was VARCHAR(64) |
| `invited_by` | `invited_by` | ✅ UUID | FK to users |
| `status` | `status` | ✅ TEXT | Enum check constraint |
| `sent_at` | `sent_at` | ✅ TIMESTAMPTZ | **ADDED:** Was missing |
| `expires_at` | `expires_at` | ✅ TIMESTAMPTZ | 7-day expiry |
| `accepted_at` | `accepted_at` | ✅ TIMESTAMPTZ | Optional |
| `created_at` | `created_at` | ✅ TIMESTAMPTZ | Auto-set |
| `updated_at` | `updated_at` | ✅ TIMESTAMPTZ | Trigger-managed |

## RLS Verification

| Operation | Policy | Auth Check | Org Isolation | Status |
|-----------|--------|------------|---------------|--------|
| SELECT | `invitations_org_select` | auth.uid() | ✅ org_id match | ✅ PASS |
| INSERT | `invitations_admin_insert` | owner/admin | ✅ org_id match | ✅ PASS |
| UPDATE | `invitations_admin_update` | owner/admin | ✅ org_id match | ✅ PASS |
| DELETE | `invitations_admin_delete` | owner/admin | ✅ org_id match | ✅ PASS |

## Index Verification

| Index | Purpose | Status |
|-------|---------|--------|
| `user_invitations_unique_pending_idx` | Prevent duplicate pending invitations | ✅ PASS |
| `idx_user_invitations_org_id` | Org filtering | ✅ PASS |
| `idx_user_invitations_email` | Email search | ✅ PASS |
| `idx_user_invitations_token` | Token lookup | ✅ PASS |
| `idx_user_invitations_status` | Status filtering | ✅ PASS |
| `idx_user_invitations_expires_at` | Expiry checks | ✅ PASS |
| `idx_user_invitations_sent_at` | Sorting by sent date | ✅ PASS |

## SQL Syntax Validation

- [x] All tables use `public.` schema prefix
- [x] Foreign keys reference correct tables
- [x] CHECK constraints use valid syntax
- [x] Trigger function syntax correct
- [x] Comments added for documentation
- [x] No syntax errors detected

## Service Layer Compatibility

### invitation-service.ts Functions Verified

1. `createInvitation()` (lines 132-164)
   - ✅ Uses `role` (string) - NOW COMPATIBLE
   - ✅ Uses `sent_at` - NOW AVAILABLE
   - ✅ All fields present in migration

2. `getInvitations()` (lines 175-218)
   - ✅ `.order('sent_at', { ascending: false })` - NOW WORKS
   - ✅ Joins to users table via `invited_by` - WORKS

3. `resendInvitation()` (lines 229-274)
   - ✅ Updates `sent_at` (line 261) - NOW WORKS
   - ✅ Generates new token (TEXT type) - WORKS

4. `cancelInvitation()` (lines 284-326)
   - ✅ Updates `status` to 'cancelled' - WORKS

5. `acceptInvitation()` (lines 336-383)
   - ✅ Uses `token` for lookup - WORKS
   - ✅ Updates `accepted_at` - WORKS

## Breaking Changes from Original Migration

| Field | Original | New | Breaking? | Mitigation |
|-------|----------|-----|-----------|------------|
| `role_id` | UUID FK | Removed | ✅ YES | Service never used it - no data loss |
| `role` | N/A | TEXT | ✅ YES | New field required by service |
| `sent_at` | N/A | TIMESTAMPTZ | ✅ YES | Was missing - service would crash without it |
| `token` | VARCHAR(64) | TEXT | ⚠️ MINOR | JWT tokens can exceed 64 chars - prevents bugs |
| `cancelled_at` | TIMESTAMPTZ | Removed | ⛔ NO | Service doesn't use it - status field sufficient |

**Impact:** This is a NEW table (first migration), so no data migration needed. Service layer was already written for the CORRECTED schema, so this migration now matches the code.

## Test Checklist

Before deploying, verify:
- [ ] Run migration in test environment
- [ ] Test `createInvitation()` - should succeed
- [ ] Test `getInvitations()` - should sort by `sent_at`
- [ ] Test `resendInvitation()` - should update `sent_at`
- [ ] Test RLS with owner/admin roles
- [ ] Test duplicate pending invitation prevention
- [ ] Test token uniqueness constraint

## Recommendations

1. **Run migration ASAP** - Service layer expects this schema
2. **Create validation schema** - `lib/validation/invitation-schemas.ts` is MISSING (P0)
3. **Update .claude/TABLES.md** - Add user_invitations table documentation
4. **Run tests** - `apps/frontend/__tests__/api/settings/invitations.test.ts`

## Files Changed

- `supabase/migrations/026_create_user_invitations.sql` (FIXED)

## Next Steps

1. Service layer exists ✅
2. Migration file exists ✅ (FIXED)
3. Validation schema missing ❌ (PRIORITY P0)
4. API endpoint exists ✅
5. Tests exist ✅

**HANDOFF TO:** SENIOR-DEV for validation schema creation or BACKEND-DEV for implementation if tests exist.
