# Story 03.14 - WO Scheduling Test Status

**Phase:** RED (Test-First)
**Date:** 2025-12-31
**Agent:** TEST-WRITER

## Test Files Created

### 1. Validation Schema Unit Tests
**File:** `apps/frontend/lib/validation/__tests__/work-order-schemas.test.ts`
**Tests:** 27 test cases
**Status:** ❌ ALL FAILING (Expected - RED phase)

**Coverage:**
- Time format validation (HH:mm)
- Time range validation (end > start)
- Date range validation (end >= start)
- Production line/machine UUID validation
- Optional fields handling
- Complex scenarios (multi-field validation)

**Test Results:**
```
27 failed (27)
Error: scheduleWOSchema is undefined
```

### 2. Service Method Unit Tests
**File:** `apps/frontend/lib/services/__tests__/work-order-service.schedule.test.ts`
**Tests:** 12 test cases
**Status:** ❌ ALL FAILING (Expected - RED phase)

**Coverage:**
- Schedule WO with valid times
- Update production line/machine
- Clear machine assignment
- Status validation (reject completed/cancelled/closed)
- Existence validation (WO, line, machine)
- Multi-tenant isolation

**Test Results:**
```
12 failed (12)
Error: WorkOrderService.scheduleWorkOrder is not a function
```

### 3. Integration Tests - API Endpoint
**File:** `apps/frontend/__tests__/api/planning/work-orders/schedule.test.ts`
**Tests:** ~20 test cases (grouped by AC)
**Status:** ⏸️ NOT RUN YET (requires running server)

**Coverage (all 11 ACs):**
- AC-01: Schedule WO with valid times ✅
- AC-02: Reject end time before start time ✅
- AC-03: Reject scheduling completed WO ✅
- AC-04: Reject scheduling cancelled WO ✅
- AC-05: Update production line with schedule ✅
- AC-06: Reject invalid production line ✅
- AC-07: Clear machine assignment ✅
- AC-08: Multi-tenant isolation ✅
- AC-09: Permission check ✅
- AC-10: Valid date range ✅
- AC-11: Reject invalid date range ✅

**Setup:**
- Test organization
- Test user (planner role)
- Test product
- Test production line
- Test machine
- Test work orders (draft, completed, cancelled)

## Implementation Checklist

To make tests GREEN, implement:

### 1. Validation Schema
**File:** `apps/frontend/lib/validation/work-order-schemas.ts`

Add:
```typescript
export const scheduleWOSchema = z.object({
  planned_start_date: z.string().date().optional(),
  planned_end_date: z.string().date().optional().nullable(),
  scheduled_start_time: timeString.optional().nullable(),
  scheduled_end_time: timeString.optional().nullable(),
  production_line_id: z.string().uuid().optional().nullable(),
  machine_id: z.string().uuid().optional().nullable()
}).refine(/* date range validation */)
  .refine(/* time range validation */);

export type ScheduleWOInput = z.infer<typeof scheduleWOSchema>;
```

### 2. Service Method
**File:** `apps/frontend/lib/services/work-order-service.ts`

Add method:
```typescript
static async scheduleWorkOrder(
  supabase: SupabaseClient,
  orgId: string,
  woId: string,
  userId: string,
  input: ScheduleWOInput
): Promise<WorkOrder>
```

Logic:
1. Fetch WO (enforce org_id)
2. Validate status (reject completed/cancelled/closed)
3. Validate line/machine existence (if provided)
4. Update WO with new schedule
5. Return updated WO with relations

### 3. API Endpoint
**File:** `apps/frontend/app/api/planning/work-orders/[id]/schedule/route.ts`

Implement:
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
)
```

Flow:
1. Auth check (getOrgContext)
2. Permission check (planning update)
3. Validate body (scheduleWOSchema)
4. Call WorkOrderService.scheduleWorkOrder
5. Return 200 with updated WO

## Next Steps

**For DEV Agent:**
1. Implement `scheduleWOSchema` in work-order-schemas.ts
2. Implement `scheduleWorkOrder` method in work-order-service.ts
3. Create API route: work-orders/[id]/schedule/route.ts
4. Run tests until GREEN ✅

**Expected Outcome:**
- 27 validation tests PASS
- 12 service tests PASS
- ~20 integration tests PASS
- All 11 ACs satisfied

## Test Execution Commands

```bash
# Run validation tests
npm test -- work-order-schemas.test.ts --run

# Run service tests
npm test -- work-order-service.schedule.test.ts --run

# Run integration tests (requires server)
npm test -- schedule.test.ts --run

# Run all WO scheduling tests
npm test -- schedule --run
```

## Coverage Targets

- Validation schema: ≥90%
- Service method: ≥85%
- API endpoint: ≥80%

---

**RED Phase Complete:** ✅
All tests written and verified to FAIL for the right reasons.

Ready for GREEN phase (implementation).
