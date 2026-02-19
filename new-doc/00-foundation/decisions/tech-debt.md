# Technical Debt Inventory

## Version
- **Date**: 2025-12-10
- **Last Review**: Architecture Phase 3 Assessment

---

## Summary

| Priority | Count | Estimated Effort |
|----------|-------|------------------|
| P0 (Critical) | 2 | 2-3 days |
| P1 (High) | 5 | 5-8 days |
| P2 (Medium) | 6 | 8-12 days |
| P3 (Low) | 4 | 4-6 days |
| **Total** | **17** | **19-29 days** |

---

## P0 - Critical (Fix Immediately)

### TD-001: Missing Database Transaction Support

**Module**: Production
**Location**: `apps/frontend/lib/services/material-reservation-service.ts`

**Problem**: Material reservation creates multiple records (reservation, LP update, genealogy) without atomic transaction. Manual rollback on error is fragile.

```typescript
// Current: Manual rollback (lines 450-500)
const { data: reservation } = await supabase.from('wo_material_reservations').insert(...)
const { error: lpUpdateError } = await supabase.from('license_plates').update(...)
if (lpUpdateError) {
  // Manual rollback - can fail
  await supabase.from('wo_material_reservations').delete().eq('id', reservation.id)
}
```

**Impact**: Data inconsistency on partial failures; orphaned records.

**Solution**: Use Supabase Edge Function with `pg-transaction` or stored procedure for atomic operations.

**Effort**: M (2-3 days)

---

### TD-002: Console Logging in Production

**Module**: Settings
**Location**: `apps/frontend/lib/supabase/server.ts` (lines 41-43)

**Problem**: Debug logging exposes partial API keys in production.

```typescript
console.log('   Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 30)}...` : 'MISSING')
```

**Impact**: Security risk; log pollution.

**Solution**: Remove or gate behind `NODE_ENV === 'development'`.

**Effort**: S (1 hour)

---

## P1 - High Priority (This Sprint)

### TD-003: Inconsistent Supabase Client Usage

**Module**: Cross-module (Settings, Production, Warehouse)
**Location**: Multiple services

**Problem**: Mix of `createServerSupabase()`, `createServerSupabaseAdmin()`, and `createAdminClient()` with unclear usage patterns.

**Files**:
- `lp-service.ts` uses `createAdminClient()` (Warehouse)
- `work-order-service.ts` uses `createServerSupabase()` + `createServerSupabaseAdmin()` (Planning)
- `material-reservation-service.ts` accepts `SupabaseClient` as constructor param (Production)

**Impact**: Inconsistent auth context; potential RLS bypass.

**Solution**: Standardize on service pattern:
- `createServerSupabase()` for user-context operations
- `createServerSupabaseAdmin()` for elevated operations only
- Document when each is appropriate

**Effort**: M (2 days)

---

### TD-004: Missing Index Optimization

**Module**: Warehouse, Production, Planning
**Location**: Database schema

**Problem**: High-cardinality queries lack proper indexes.

**Examples**:
- `license_plates.product_id + status + org_id` (FIFO/FEFO queries) - Warehouse
- `work_orders.status + org_id + planned_start_date` (dashboard queries) - Planning
- `lp_genealogy.parent_lp_id / child_lp_id` (traceability queries) - Production

**Impact**: Slow queries as data grows; timeout risks.

**Solution**: Add composite indexes for common query patterns.

**Effort**: S (4 hours)

---

### TD-005: No Rate Limiting on API Routes

**Module**: Cross-module (All modules)
**Location**: `apps/frontend/app/api/**`

**Problem**: No rate limiting implementation; vulnerable to abuse.

**Impact**: DoS risk; potential cost explosion.

**Solution**: Add Vercel Rate Limiting or custom middleware with Redis.

**Effort**: M (2 days)

---

### TD-006: Hardcoded Role Lists

**Module**: Production, Planning
**Location**: Multiple API routes

**Problem**: Role checks use hardcoded arrays that must be synced manually.

```typescript
// work-orders/[id]/start/route.ts
const allowedRoles = ['admin', 'manager', 'production_manager', 'operator']

// Different file, different list
const allowedRoles = ['admin', 'manager', 'operator']
```

**Impact**: Inconsistent authorization; maintenance burden.

**Solution**: Centralize role permissions in config or database.

**Effort**: M (1-2 days)

---

### TD-007: Missing Error Boundaries

**Module**: Cross-module (All frontend modules)
**Location**: Frontend components

**Problem**: No React error boundaries; single component error crashes page.

**Impact**: Poor UX; lost user work.

**Solution**: Add error boundaries at module level + logging to error service.

**Effort**: S (4 hours)

---

## P2 - Medium Priority (Next Sprint)

### TD-008: Type Duplication

**Module**: Technical, Planning, Production
**Location**: `lib/services/` and `lib/validation/`

**Problem**: Type definitions duplicated between services and validation schemas.

```typescript
// work-order-service.ts
export interface WorkOrder { ... }

// work-order-schemas.ts
export interface WorkOrder { ... }  // Nearly identical
```

**Impact**: Type drift; maintenance overhead.

**Solution**: Single source of truth from Zod schemas using `z.infer<>`.

**Effort**: M (3 days)

---

### TD-009: Missing Pagination

**Module**: Technical, Planning, Warehouse
**Location**: List endpoints

**Problem**: Most list queries return all records; no cursor/offset pagination.

```typescript
// No limit clause
const { data } = await supabase.from('products').select('*').eq('org_id', orgId)
```

**Impact**: Memory issues; slow responses with large datasets.

**Solution**: Implement cursor-based pagination with `limit` + `range`.

**Effort**: L (3-4 days)

---

### TD-010: Inconsistent Error Response Format

**Module**: Cross-module (All API routes)
**Location**: API routes

**Problem**: Error responses use different structures.

```typescript
// Some use:
{ error: 'message' }

// Others use:
{ error: 'CODE', message: 'description' }

// Others use:
{ success: false, error: 'message', code: 'CODE' }
```

**Impact**: Frontend error handling complexity.

**Solution**: Standardize on `{ error: { code: string, message: string, details?: object } }`.

**Effort**: M (2 days)

---

### TD-011: No Request Validation Middleware

**Module**: Cross-module (All API routes)
**Location**: API routes

**Problem**: Each route manually validates with Zod; boilerplate duplication.

**Impact**: Inconsistent validation; code bloat.

**Solution**: Create validation middleware wrapper for API routes.

**Effort**: M (1-2 days)

---

### TD-012: Missing Audit Logging

**Module**: Technical, Production, Quality
**Location**: All modules

**Problem**: No structured audit trail for compliance-sensitive operations.

**Required for**:
- BOM changes (food safety) - Technical
- Work order status changes - Production
- Quality holds/releases - Quality
- User permission changes - Settings

**Impact**: Compliance gap for food manufacturing regulations.

**Solution**: Implement audit log table + triggers or service-level logging.

**Effort**: L (4-5 days)

---

### TD-013: Test Coverage Gaps

**Module**: Cross-module (Validation schemas)
**Location**: `apps/frontend/lib/validation/__tests__/`

**Problem**: Only 3 test files for 18 validation schemas.

**Coverage**:
- auth-schemas.test.ts (exists) - Settings
- location-schemas.test.ts (exists) - Settings
- user-schemas.test.ts (exists) - Settings
- work-order-schemas.test.ts (missing) - Planning
- bom-schemas.test.ts (missing) - Technical
- 13 more missing

**Impact**: Regression risk; confidence issues.

**Solution**: Add tests for remaining schemas; aim for 80%+ coverage.

**Effort**: L (4-5 days)

---

## P3 - Low Priority (Backlog)

### TD-014: Deprecated Patterns in Supabase Joins

**Module**: Technical, Planning
**Location**: Services with nested selects

**Problem**: Some queries use deprecated join syntax.

```typescript
// Should migrate from:
.select('*, product:products(*)')
// To:
.select('*, products!product_id(*)')
```

**Impact**: May break in future Supabase versions.

**Solution**: Audit and update join syntax.

**Effort**: S (2-3 hours)

---

### TD-015: Missing API Documentation

**Module**: Cross-module (All API routes)
**Location**: All API routes

**Problem**: No OpenAPI/Swagger documentation for 99 endpoints.

**Impact**: Integration difficulty; onboarding friction.

**Solution**: Add OpenAPI spec generation from routes.

**Effort**: L (3-4 days)

---

### TD-016: Frontend Bundle Size

**Module**: Cross-module (Frontend)
**Location**: `apps/frontend/`

**Problem**: No bundle analysis; potential bloat from unused components.

**Impact**: Slower initial load; poor mobile performance.

**Solution**: Add `@next/bundle-analyzer`; tree-shake unused code.

**Effort**: S (4 hours)

---

### TD-017: Environment Variable Validation

**Module**: Settings
**Location**: `lib/supabase/server.ts`

**Problem**: Environment variables checked at runtime, not startup.

**Impact**: Cryptic errors on misconfiguration.

**Solution**: Add Zod validation for env vars in `env.mjs`.

**Effort**: S (2 hours)

---

## Technical Debt Trends

| Month | P0 | P1 | P2 | P3 | Total |
|-------|----|----|----|----|-------|
| Nov 2025 | 3 | 4 | 4 | 2 | 13 |
| Dec 2025 | 2 | 5 | 6 | 4 | 17 |

**Trend**: Increasing due to rapid feature development; P0 reduced.

---

## Module Distribution

| Module | P0 | P1 | P2 | P3 | Total |
|--------|----|----|----|----|-------|
| Production | 1 | 2 | 2 | 0 | 5 |
| Settings | 1 | 1 | 0 | 2 | 4 |
| Planning | 0 | 2 | 2 | 1 | 5 |
| Technical | 0 | 0 | 2 | 1 | 3 |
| Warehouse | 0 | 1 | 1 | 0 | 2 |
| Quality | 0 | 0 | 1 | 0 | 1 |
| Cross-module | 0 | 1 | 2 | 2 | 5 |

---

## Remediation Plan

### Week 1
- [ ] TD-001: Transaction support for reservations (Production)
- [ ] TD-002: Remove console logging (Settings)

### Week 2
- [ ] TD-003: Standardize Supabase client usage (Cross-module)
- [ ] TD-004: Add missing indexes (Warehouse, Production, Planning)

### Week 3
- [ ] TD-005: Rate limiting (Cross-module)
- [ ] TD-006: Centralize role permissions (Production, Planning)

### Week 4
- [ ] TD-007: Error boundaries (Cross-module)
- [ ] TD-010: Standardize error responses (Cross-module)

---

## Review Schedule

- Weekly: P0 items
- Bi-weekly: P1 items
- Monthly: Full inventory review
