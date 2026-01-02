# Story 03.5b - Quick Handoff to DEV (GREEN Phase)

**Status**: RED Phase Complete - Ready for Implementation

---

## What You Need to Do

Implement code to make these 225 FAILING tests pass:

### Test Command
```bash
# Run all 225 tests
npm test -- --testPathPattern="purchase-order-service.approval|notification-service|purchase-order-approval-schemas|approval.test.ts|POApprovalModal"
npx playwright test e2e/planning/po-approval-workflow.spec.ts
```

### Implementation Checklist (Priority Order)

1. **Database Migration** (blocking)
   - Create `po_approval_history` table
   - Add RLS policies (append-only)
   - Create indexes: po_id, created_at, org_id
   - See: docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/database.yaml

2. **API Routes** (4 endpoints)
   - POST `/api/planning/purchase-orders/:id/submit`
   - POST `/api/planning/purchase-orders/:id/approve`
   - POST `/api/planning/purchase-orders/:id/reject`
   - GET `/api/planning/purchase-orders/:id/approval-history`
   - See: docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/api.yaml

3. **Service Methods** (extend purchase-order-service.ts)
   - submitPO()
   - approvePO()
   - rejectPO()
   - getPOApprovalHistory()
   - canUserApprove()
   - validateStatusTransition()

4. **Validation Schemas** (3 schemas in purchase-order-validation.ts)
   - submitPoSchema
   - approvePoSchema
   - rejectPoSchema

5. **Components** (update UI)
   - POApprovalModal.tsx
   - POApprovalHistory.tsx (optional for GREEN)
   - Update POStatusBadge.tsx

6. **Notifications** (async integration)
   - notifyApprovers()
   - notifyPOCreator()

---

## Test Breakdown

| Category | Count | Status |
|----------|-------|--------|
| Unit (Service) | 41 | FAILING |
| Unit (Notification) | 31 | FAILING |
| Unit (Validation) | 54 | FAILING |
| Integration (API) | 62 | FAILING |
| Component | 42 | FAILING |
| E2E | 8 | FAILING |
| Database/RLS | 14 | FAILING |
| **Total** | **225** | **ALL FAILING** |

---

## Key Files

**Test Files** (READ THESE - they define requirements):
- `/apps/frontend/lib/services/__tests__/purchase-order-service.approval.test.ts` (41 tests)
- `/apps/frontend/lib/services/__tests__/notification-service.test.ts` (31 tests)
- `/apps/frontend/lib/validation/__tests__/purchase-order-approval-schemas.test.ts` (54 tests)
- `/apps/frontend/__tests__/api/planning/purchase-orders/approval.test.ts` (62 tests)
- `/apps/frontend/components/planning/purchase-orders/__tests__/POApprovalModal.test.tsx` (42 tests)
- `/e2e/planning/po-approval-workflow.spec.ts` (8 scenarios)
- `/supabase/tests/po-approval-history-rls.test.sql` (14 suites)

**Context Files** (READ THESE - they explain the feature):
- `docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/_index.yaml` (metadata)
- `docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/database.yaml` (table schema)
- `docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/api.yaml` (endpoint specs)
- `docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/frontend.yaml` (component specs)
- `docs/2-MANAGEMENT/epics/current/03-planning/03.5b.po-approval-workflow.md` (full story)

---

## Critical Path (E2E-01)

These must work:
1. Create PO with total > $10,000 (approval threshold)
2. Submit for approval → status: `pending_approval`
3. Manager approves with notes → status: `approved`
4. Planner confirms → status: `confirmed`

---

## Estimated Effort

- Database + API: 2 days
- Services + Validation: 1 day
- Components + Tests: 1-2 days
- **Total**: 4 days (matches story estimate)

---

## When Done

All 225 tests will be GREEN. Then ask SENIOR-DEV for REFACTOR phase.

Good luck! 🚀
