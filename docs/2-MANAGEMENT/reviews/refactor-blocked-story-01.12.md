# REFACTOR Phase Blocked - Story 01.12: Allergens Management

**Date:** 2025-12-22
**Role:** SENIOR-DEV (Refactor)
**Status:** BLOCKED - Tests are RED

---

## Summary

The REFACTOR phase for Story 01.12 cannot proceed because the tests are in RED state.

According to REFACTOR rules:
> 1. VERIFY -> Run tests, confirm GREEN
>    - If RED: STOP, don't proceed

---

## Test Status Analysis

### Failing Test Files (92 tests total):
1. `apps/frontend/__tests__/01-settings/01.12.allergens-api.test.ts` - 29 failing tests
2. `apps/frontend/lib/services/__tests__/allergen-service.test.ts` - 35 failing tests
3. `apps/frontend/__tests__/services/allergen-service-v2.test.ts` - 15+ failing tests
4. `apps/frontend/components/settings/allergens/__tests__/AllergensDataTable.test.tsx` - 13 failing tests

### Root Cause
The tests contain placeholder assertions that intentionally fail:
```typescript
// Expected: 14 allergens returned
expect(true).toBe(false) // Will fail until implementation exists
```

Test file headers confirm RED phase:
```typescript
/**
 * Story: 01.12 - Allergens Management
 * Phase: RED - Tests will fail until routes implemented
 */
```

---

## Architecture Mismatch

### Story 1.9 (Existing - CRUD Allergens)
- API Path: `/api/settings/allergens`
- Service: `allergen-service.ts` (CRUD operations)
- Features: Create/Update/Delete custom allergens per organization

### Story 01.12 (New - Read-Only EU Allergens)
- API Path: `/api/v1/settings/allergens` (NOT YET CREATED)
- Service: `allergen-service-v2.ts` (NOT YET CREATED)
- Features: Read-only 14 EU allergens, multi-language, global data

The Story 01.12 tests import from non-existent modules:
```typescript
import { AllergenService } from '@/lib/services/allergen-service-v2'
```

---

## Files Reviewed

### Implementation Files (Story 1.9 - Exists)
| File | Status | Notes |
|------|--------|-------|
| `lib/services/allergen-service.ts` | EXISTS | Story 1.9 CRUD service |
| `lib/validation/allergen-schemas.ts` | EXISTS | Story 1.9 schemas |
| `app/api/settings/allergens/route.ts` | EXISTS | Story 1.9 API |
| `app/api/settings/allergens/[id]/route.ts` | EXISTS | Story 1.9 API |

### Implementation Files (Story 01.12 - Missing)
| File | Status | Notes |
|------|--------|-------|
| `lib/services/allergen-service-v2.ts` | MISSING | Read-only service |
| `app/api/v1/settings/allergens/route.ts` | MISSING | New API path |
| `app/api/v1/settings/allergens/[id]/route.ts` | MISSING | New API path |
| `lib/hooks/use-allergens.ts` | UNKNOWN | May need creation |

### Component Files (Story 01.12 - Exist but need GREEN tests)
| File | Status |
|------|--------|
| `components/settings/allergens/AllergenIcon.tsx` | EXISTS |
| `components/settings/allergens/AllergenBadge.tsx` | EXISTS |
| `components/settings/allergens/AllergenReadOnlyBanner.tsx` | EXISTS |
| `components/settings/allergens/AllergensDataTable.tsx` | EXISTS |
| `components/settings/allergens/index.ts` | EXISTS |

---

## Required Actions Before REFACTOR

Story 01.12 needs to complete the GREEN phase first:

1. **Create missing service**: `lib/services/allergen-service-v2.ts`
   - Read-only methods: getAllergens, getAllergenById, getAllergenByCode, searchAllergens
   - Multi-language getName() helper
   - getAllergensForSelect() for form dropdowns

2. **Create missing API routes**: `/api/v1/settings/allergens`
   - GET / - List all 14 EU allergens
   - GET /:id - Get single allergen
   - Return 405 for POST/PUT/DELETE (read-only)

3. **Fix test imports** to point to actual implementation files

4. **Replace placeholder assertions** with real test logic

5. **Run tests until GREEN**

---

## Handoff

```yaml
story: "01.12"
type: "REFACTOR"
status: "BLOCKED"
reason: "Tests are RED (92 failing)"
next_action: "Complete GREEN phase first"
assigned_to: "FRONTEND-DEV or BACKEND-DEV"
```

---

## Recommendations

1. **Option A:** Complete Story 01.12 GREEN phase, then return to REFACTOR
2. **Option B:** If Story 01.12 should be read-only wrapper of Story 1.9, update tests to use existing service
3. **Option C:** Mark Story 01.12 tests as `.skip` if implementation is deferred

---

## Session Summary

### Done:
- Verified test state (92 tests failing)
- Identified root cause (placeholder assertions + missing modules)
- Documented architecture mismatch between Story 1.9 and 01.12
- Created blocking report

### To Fix/Continue:
- Story 01.12 needs GREEN phase completion before REFACTOR
- Missing files: allergen-service-v2.ts, /api/v1/settings/allergens/*
- 92 tests need real assertions

### Commits:
- None (REFACTOR blocked - no changes made)
