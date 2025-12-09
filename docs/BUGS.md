# MonoPilot - Bug & Issues Tracker

**Last Updated:** 2025-12-09
**Source:** Deep dive code analysis by architect-agent

---

## Critical / High Priority

### BUG-001: Print Integration Incomplete
- **Status:** OPEN
- **Priority:** HIGH
- **File:** `apps/frontend/app/api/warehouse/grns/[id]/receive/route.ts:224`
- **Issue:** `// TODO: Queue print job or call print endpoint`
- **Impact:** Auto-print on receive doesn't work - labels must be printed manually
- **Epic:** 5 (Warehouse)
- **Story:** 5.12 Auto-Print Labels

### BUG-002: Print API is Stub Only
- **Status:** OPEN
- **Priority:** HIGH
- **File:** `apps/frontend/app/api/warehouse/license-plates/[id]/print/route.ts:94`
- **Issue:** `// TODO: In production, send to actual printer`
- **Impact:** Label printing is simulation only - no actual ZPL/IPP printer support
- **Epic:** 5 (Warehouse)
- **Story:** 5.12 Auto-Print Labels

### BUG-005: No Warehouse Settings UI Page
- **Status:** OPEN
- **Priority:** HIGH
- **File:** Missing `/settings/warehouse` page
- **Issue:** API exists (`/api/warehouse/settings/`) but no UI to configure
- **Impact:** Admins cannot configure LP numbering format, over-receipt tolerance, print settings via UI
- **Epic:** 5 (Warehouse)
- **Story:** 5.31 Warehouse Settings

---

## Medium Priority

### BUG-003: GRN Items - LP Navigation Missing
- **Status:** OPEN
- **Priority:** MEDIUM
- **File:** `apps/frontend/components/warehouse/GRNItemsTable.tsx:193`
- **Issue:** `// TODO: Navigate to LP detail page when available`
- **Impact:** Cannot click LP number in GRN items table to navigate to LP detail
- **Epic:** 5 (Warehouse)
- **Story:** 5.11 GRN + LP Creation

### BUG-004: Scanner Receive Not PO-Barcode Driven
- **Status:** OPEN
- **Priority:** MEDIUM
- **File:** `apps/frontend/app/(authenticated)/scanner/warehouse/receive/page.tsx`
- **Issue:** Flow selects documents from dropdown list rather than scanning PO barcode first
- **Impact:** Doesn't match expected workflow (scan PO barcode -> show items -> receive)
- **Epic:** 5 (Warehouse)
- **Story:** 5.34 Scanner Receive Workflow

---

## Low Priority / Future

### BUG-006: Scanner Session Timeout Missing
- **Status:** OPEN
- **Priority:** LOW
- **File:** `apps/frontend/app/(authenticated)/scanner/layout.tsx`
- **Issue:** No session timeout implementation for scanner mode
- **Impact:** Scanner sessions don't auto-logout after inactivity
- **Epic:** 5 (Warehouse)
- **Story:** 5.27 Scanner Session Management

### BUG-007: Offline Queue Not Implemented
- **Status:** OPEN
- **Priority:** LOW (Phase 3)
- **File:** Scanner module
- **Issue:** No offline/PWA capabilities for scanner
- **Impact:** Scanner requires constant network connection
- **Epic:** 5 (Warehouse)
- **Story:** 5.36 Offline Queue Management

---

## Technical Debt (from discovery)

### DEBT-001: Performance Issues
- **Status:** TO INVESTIGATE
- **Priority:** MEDIUM
- **Area:** Database queries, frontend rendering
- **Impact:** Potential N+1 queries, missing indexes
- **Action:** Need performance audit

### DEBT-002: RLS Policy Gaps
- **Status:** TO INVESTIGATE
- **Priority:** HIGH
- **Area:** Supabase RLS policies
- **Impact:** Potential security issues with multi-tenant isolation
- **Action:** Need security audit

### DEBT-003: Test Coverage Gaps
- **Status:** TO INVESTIGATE
- **Priority:** MEDIUM
- **Area:** Unit tests, E2E tests
- **Impact:** Regression risk
- **Action:** Need test coverage report

### DEBT-004: Documentation Gaps
- **Status:** IN PROGRESS
- **Priority:** MEDIUM
- **Area:** API docs, architecture docs
- **Impact:** Onboarding difficulty
- **Action:** Currently rebuilding docs structure

---

## Summary by Epic

| Epic | Open Bugs | Critical | Medium | Low |
|------|-----------|----------|--------|-----|
| Epic 5 (Warehouse) | 7 | 3 | 2 | 2 |
| Epic 1-4 | TBD | - | - | - |
| Epic 6-9 | TBD | - | - | - |

---

## Resolution Log

| Bug ID | Resolved Date | Resolution | PR/Commit |
|--------|---------------|------------|-----------|
| - | - | - | - |

