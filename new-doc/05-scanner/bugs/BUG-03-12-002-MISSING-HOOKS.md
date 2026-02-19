# BUG-03-12-002: Missing React Query hook files for WO operations

**Bug ID**: BUG-03-12-002
**Story**: 03.12 - WO Operations (Routing Copy)
**Severity**: MEDIUM
**Status**: OPEN
**Date Found**: 2025-12-31
**Assignee**: FRONTEND-DEV

---

## Summary

Two required React Query hook files are missing but are imported by frontend components. Without these hooks, the operations components cannot fetch data and will fail to render.

---

## Impact

- **Blocks**: Frontend components cannot function
- **Affected Components**:
  - `WOOperationsTimeline.tsx` (line 18 import)
  - `WOOperationDetailPanel.tsx` (line 346 import)
- **User Impact**: Operations timeline tab shows nothing/error
- **QA Impact**: Cannot test frontend features
- **Severity**: MEDIUM (Medium complexity fix, blocks UI)

---

## Root Cause

The hooks were specified in the frontend specification (`context/03.12/frontend.yaml`) but were not created during implementation. The components import them, but files don't exist:

```
Missing:
- apps/frontend/lib/hooks/use-wo-operations.ts
- apps/frontend/lib/hooks/use-wo-operation-detail.ts
```

---

## Missing Files

### File 1: `use-wo-operations.ts`

**Location**: `apps/frontend/lib/hooks/use-wo-operations.ts`
**Status**: MISSING
**Imported by**: `WOOperationsTimeline.tsx` line 18

```typescript
import { useWOOperations } from '@/lib/hooks/use-wo-operations';
```

**Expected Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { getOperationsForWO } from '@/lib/services/wo-operations-service';
import type { WOOperationsListResponse } from '@/lib/types/wo-operation';

export function useWOOperations(woId: string) {
  return useQuery<WOOperationsListResponse>({
    queryKey: ['wo-operations', woId],
    queryFn: () => getOperationsForWO(woId),
    enabled: !!woId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

### File 2: `use-wo-operation-detail.ts`

**Location**: `apps/frontend/lib/hooks/use-wo-operation-detail.ts`
**Status**: MISSING
**Imported by**: `WOOperationDetailPanel.tsx` line 346

```typescript
import { useWOOperationDetail } from '@/lib/hooks/use-wo-operation-detail';
```

**Expected Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { getOperationById } from '@/lib/services/wo-operations-service';
import type { WOOperationDetail } from '@/lib/types/wo-operation';

export function useWOOperationDetail(woId: string, opId: string) {
  return useQuery<WOOperationDetail | null>({
    queryKey: ['wo-operation-detail', woId, opId],
    queryFn: () => getOperationById(woId, opId),
    enabled: !!woId && !!opId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

---

## Components Affected

### 1. WOOperationsTimeline.tsx
- **Line**: 18
- **Import**: `import { useWOOperations } from '@/lib/hooks/use-wo-operations';`
- **Usage**: Line 30 - `const { data: operations, isLoading, error, refetch } = useWOOperations(woId);`
- **Impact**: Timeline cannot fetch operations, will crash at runtime

### 2. WOOperationDetailPanel.tsx
- **Line**: 346 (estimated)
- **Import**: `import { useWOOperationDetail } from '@/lib/hooks/use-wo-operation-detail';`
- **Usage**: Opens operation detail and fetches full data
- **Impact**: Detail panel cannot fetch operation, will show "Operation not found"

---

## Required Fix

### Step 1: Create `use-wo-operations.ts`

Create file at: `apps/frontend/lib/hooks/use-wo-operations.ts`

```typescript
/**
 * React Query hook for fetching WO operations
 * Story: 03.12 - WO Operations (Routing Copy)
 */

import { useQuery } from '@tanstack/react-query';
import { getOperationsForWO } from '@/lib/services/wo-operations-service';
import type { WOOperation } from '@/lib/types/wo-operation';

interface UseWOOperationsResult {
  data: WOOperation[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch all operations for a work order
 * @param woId - Work Order ID
 * @returns UseQueryResult with operations array
 */
export function useWOOperations(woId: string): UseWOOperationsResult {
  const query = useQuery({
    queryKey: ['wo-operations', woId],
    queryFn: () => getOperationsForWO(woId).then(res => res.operations),
    enabled: !!woId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
```

### Step 2: Create `use-wo-operation-detail.ts`

Create file at: `apps/frontend/lib/hooks/use-wo-operation-detail.ts`

```typescript
/**
 * React Query hook for fetching single WO operation detail
 * Story: 03.12 - WO Operations (Routing Copy)
 */

import { useQuery } from '@tanstack/react-query';
import { getOperationById } from '@/lib/services/wo-operations-service';
import type { WOOperationDetail } from '@/lib/types/wo-operation';

interface UseWOOperationDetailResult {
  data: WOOperationDetail | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch single operation detail with variances
 * @param woId - Work Order ID
 * @param opId - Operation ID
 * @returns UseQueryResult with operation detail
 */
export function useWOOperationDetail(
  woId: string,
  opId: string
): UseWOOperationDetailResult {
  const query = useQuery({
    queryKey: ['wo-operation-detail', woId, opId],
    queryFn: () => getOperationById(woId, opId),
    enabled: !!woId && !!opId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
```

---

## Verification Steps

### After Creating Hooks

1. Check files exist:
```bash
ls -la apps/frontend/lib/hooks/use-wo-*.ts
# Should show both files
```

2. Check imports work:
```bash
cd apps/frontend
npm run type-check
# Should have no errors
```

3. Check component compilation:
```bash
npm run build
# Should compile without errors
```

4. Test in development:
```bash
npm run dev
# Navigate to WO detail
# Should load operations timeline
```

---

## Testing Instructions

After creating hooks:

1. **Build Test**: Ensure TypeScript compilation succeeds
```bash
npm run type-check
```

2. **Component Test**: Open WO detail page
   - Should show operations timeline
   - Should load data via hooks
   - Should display cards with operations

3. **Detail Panel Test**: Click operation card
   - Should open detail panel
   - Should load operation data
   - Should display variances

---

## Risk Assessment

- **Risk of Creating Files**: Very Low
- **Risk of Not Creating**: High (components crash)
- **Complexity**: Low (copy from spec)
- **Testing Effort**: 10 minutes

---

## Dependency Check

These hooks depend on:
- ✓ `useQuery` from `@tanstack/react-query` (already installed)
- ✓ `getOperationsForWO` from service (IMPLEMENTED)
- ✓ `getOperationById` from service (IMPLEMENTED)
- ✓ Types from `wo-operation.ts` (IMPLEMENTED)
- ✓ `lib/hooks/` directory (EXISTS)

All dependencies available.

---

## Acceptance Criteria

Fix is complete when:
- [ ] File created: `apps/frontend/lib/hooks/use-wo-operations.ts`
- [ ] File created: `apps/frontend/lib/hooks/use-wo-operation-detail.ts`
- [ ] TypeScript compilation succeeds (no type errors)
- [ ] Components can import hooks without errors
- [ ] Components render without crashing
- [ ] Hooks successfully fetch data
- [ ] QA confirms component tests pass

---

## Sign-Off

**Found by**: QA-AGENT
**Date**: 2025-12-31
**Priority**: MEDIUM - Blocks frontend functionality
**Fix Priority**: BEFORE DEPLOYMENT

---

## References

- QA Report: `docs/2-MANAGEMENT/epics/current/03-planning/context/03.12/QA-REPORT.md`
- Frontend Spec: `docs/2-MANAGEMENT/epics/current/03-planning/context/03.12/frontend.yaml`
- Service: `apps/frontend/lib/services/wo-operations-service.ts`
- Types: `apps/frontend/lib/types/wo-operation.ts`

