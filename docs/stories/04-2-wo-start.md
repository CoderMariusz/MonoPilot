# Story 4.2: WO Start

**Epic:** 4 - Production Execution
**Status:** drafted
**Priority:** P0 (MVP)
**Story Points:** 2
**Created:** 2025-11-27
**Effort Estimate:** 0.5 day

---

## Goal

Enable operators to start released work orders and transition them to "in_progress" status with proper validation and audit logging.

## User Story

**As an** Operator
**I want** to start a released work order
**So that** I can begin production and track when work actually starts

---

## Problem Statement

Currently, operators cannot transition a WO from "Released" to "In Progress". This story implements:
1. Start modal with WO summary and confirmations
2. Status transition with proper validation
3. Timestamp recording (started_at)
4. Audit trail (operator who started, timestamp)
5. Real-time updates on dashboard (Story 4.1)

---

## Acceptance Criteria

### AC-4.2.1: WO Start Modal
**Given** I navigate to a released work order detail page
**When** clicking "Start Production" button
**Then** a modal appears with:

| Section | Content |
|---------|---------|
| Header | "Start Work Order: WO-20251127-0001" |
| WO Summary | WO number, Product, Quantity, Scheduled date |
| Line/Machine | Confirm assigned production line and machine |
| Material Availability | Warning if any material < 100% available (info only, not blocking) |
| Buttons | Cancel, Confirm Start |

**Success Criteria:**
- ✅ Modal shows all required information
- ✅ Material shortage shows as yellow warning (⚠️) with details
- ✅ "Confirm Start" button only appears if WO status = 'released'
- ✅ Modal closes on Cancel without changes
- ✅ Modal has proper styling (consistent with other modals in app)

---

### AC-4.2.2: WO Status Transition
**Given** the modal is open and user confirms
**When** clicking "Confirm Start"
**Then** system performs atomic operation:

```
1. VALIDATE:
   - WO exists and org_id matches
   - WO status = 'released' (not draft, not already in progress)
   - User has Production/Manager/Admin role

2. UPDATE work_orders:
   - status → 'in_progress'
   - started_at → current_timestamp
   - started_by_user_id → current_user.id

3. RETURN:
   - Updated WO object with new status
   - Emit event: "wo.started" (for realtime/dashboard update)
```

**Success Criteria:**
- ✅ Status transitions from 'released' → 'in_progress'
- ✅ started_at timestamp recorded (server time, not client)
- ✅ started_by_user_id recorded for audit trail
- ✅ No partial updates (atomic transaction)
- ✅ WO updated_at timestamp auto-updated (via trigger)

---

### AC-4.2.3: WO Appears in Active List
**Given** WO is successfully started
**When** user returns to production dashboard
**Then** WO appears in "Active Work Orders" table (Story 4.1)

**Success Criteria:**
- ✅ WO removed from "Not Started" view (if exists)
- ✅ WO appears in "Active WOs" table on dashboard
- ✅ Status shows "In Progress"
- ✅ Progress bar appears (0% initially)
- ✅ "Pause" and "Resume" buttons available (if pauses enabled)

---

### AC-4.2.4: Error Handling
**Given** there are conditions preventing WO start
**When** clicking "Confirm Start"
**Then** system shows appropriate error:

| Condition | Error Message | HTTP Status |
|-----------|---------------|-------------|
| WO already in progress | "Cannot start WO: Work Order is already in progress." | 400 |
| WO not released | "Cannot start WO: Work Order is in Draft status. Release first." | 400 |
| WO doesn't exist | "Work Order not found." | 404 |
| Wrong org_id | (403 error, no details for security) | 403 |
| Insufficient permissions | "You don't have permission to start work orders." | 403 |
| Database error | "Failed to start WO. Please try again." | 500 |

**Success Criteria:**
- ✅ All errors show user-friendly messages
- ✅ No partial updates on error
- ✅ Error toast displayed (not modal)
- ✅ User can retry after fixing condition

---

### AC-4.2.5: API Endpoint
**Given** the frontend makes API request
**When** calling start WO endpoint
**Then** the endpoint is available:

```typescript
// POST /api/production/work-orders/:id/start

Request: {}  // No body needed

Response (200): {
  data: {
    id: uuid,
    wo_number: string,          // "WO-20251127-0001"
    status: string,             // "in_progress"
    started_at: timestamp,      // "2025-11-27T10:30:00Z"
    started_by_user_id: uuid,
    started_by_user: {
      id: uuid,
      name: string              // "John Operator"
    }
  },
  message: "Work order started successfully"
}

// Error Response (400/403/404):
{
  error: string,                // "INVALID_STATUS" | "NOT_FOUND" | "ORG_ISOLATION"
  message: string               // User-friendly message
}
```

**Success Criteria:**
- ✅ POST endpoint at `/api/production/work-orders/:id/start`
- ✅ No request body required (just :id in URL)
- ✅ Returns 200 with updated WO object
- ✅ Returns 400/403/404 with error details
- ✅ Proper error codes: INVALID_STATUS, NOT_FOUND, ORG_ISOLATION, FORBIDDEN
- ✅ Auth check enforced (401 if not logged in)
- ✅ Org isolation enforced (403 if wrong org)

---

### AC-4.2.6: Audit Trail & Logging
**Given** WO is started
**When** operation completes
**Then** audit information is recorded:

| Field | Value | Purpose |
|-------|-------|---------|
| operation | "wo.start" | What happened |
| wo_id | UUID | Which WO |
| user_id | UUID | Who did it |
| timestamp | NOW() | When it happened |
| status_before | "released" | Previous state |
| status_after | "in_progress" | New state |

**Success Criteria:**
- ✅ Audit record created (if audit_logs table exists)
- ✅ started_by_user_id stored on work_orders
- ✅ started_at timestamp stored on work_orders
- ✅ updated_at auto-updated via trigger
- ✅ Audit info accessible via admin audit endpoint (future)

---

### AC-4.2.7: Role-Based Authorization
**Given** I have a specific role
**When** attempting to start WO
**Then** I have appropriate permissions:

| Role | Can Start | Notes |
|------|-----------|-------|
| Production Manager | ✅ Yes | Primary user |
| Operator | ✅ Yes | Can start their own WOs |
| Planner | ❌ No | Planning only |
| Quality Manager | ❌ No | Quality only |
| Admin | ✅ Yes | Full access |
| Other | ❌ No | No access |

**Success Criteria:**
- ✅ Role check on API endpoint (role extraction from auth token)
- ✅ 403 error for unauthorized roles
- ✅ Error message: "Insufficient permissions to start work orders"
- ✅ Consistent with existing role system in Epic 1

---

### AC-4.2.8: Modal Validation States
**Given** the modal is open
**When** waiting for confirmation
**Then** proper states displayed:

| State | Trigger | UI | Button |
|-------|---------|----|----|
| Loading | API request in progress | Spinner, disabled button | "Starting..." |
| Success | WO started | Green checkmark, auto-close | N/A |
| Error | API error | Red error message | "Try Again" |
| Validating | Form validation | Light gray | Disabled (if needed) |

**Success Criteria:**
- ✅ Loading spinner during API call
- ✅ Button text: "Start Production" → "Starting..." (loading) → "Confirm Start" (error retry)
- ✅ Success toast: "Work order started successfully"
- ✅ Error toast with retry option
- ✅ Modal auto-closes on success (1 second delay for feedback)

---

## Tasks / Subtasks

### Phase 1: Database & Service Layer

- [ ] Task 1: Verify work_orders table has required fields (AC: 4.2.2)
  - [ ] Subtask 1.1: Confirm status column exists with enum
  - [ ] Subtask 1.2: Confirm started_at column exists (TIMESTAMPTZ, NULL)
  - [ ] Subtask 1.3: Confirm started_by_user_id column exists (UUID FK, NULL)
  - [ ] Subtask 1.4: Verify RLS policy allows updates for authenticated users

- [ ] Task 2: Create WorkOrderStartService (AC: 4.2.2, 4.2.6)
  - [ ] Subtask 2.1: Implement startWorkOrder(woId, userId, orgId) method
  - [ ] Subtask 2.2: Add validation: status must be 'released'
  - [ ] Subtask 2.3: Add org_id isolation check
  - [ ] Subtask 2.4: Implement atomic update: status + timestamp
  - [ ] Subtask 2.5: Create audit log record (if audit table exists)
  - [ ] Subtask 2.6: Return updated WO object with started_by_user join
  - [ ] Subtask 2.7: Add proper error handling (INVALID_STATUS, NOT_FOUND, etc.)

### Phase 2: API Route

- [ ] Task 3: Create start WO API endpoint (AC: 4.2.5)
  - [ ] Subtask 3.1: Create `/api/production/work-orders/[id]/start/route.ts`
  - [ ] Subtask 3.2: Implement POST handler with auth check
  - [ ] Subtask 3.3: Extract user_id and org_id from session
  - [ ] Subtask 3.4: Call startWorkOrder() service
  - [ ] Subtask 3.5: Return 200 with updated WO on success
  - [ ] Subtask 3.6: Return 400/403/404 with error details on failure
  - [ ] Subtask 3.7: Add role-based authorization (AC: 4.2.7)
  - [ ] Subtask 3.8: Test with curl/postman before moving to UI

### Phase 3: Frontend UI

- [ ] Task 4: Create WO Start Modal component (AC: 4.2.1, 4.2.8)
  - [ ] Subtask 4.1: Create `WOStartModal.tsx` component
  - [ ] Subtask 4.2: Display WO number, product, quantity, scheduled date
  - [ ] Subtask 4.3: Display assigned line and machine (read-only)
  - [ ] Subtask 4.4: Implement material availability check
  - [ ] Subtask 4.5: Show material shortage warnings (yellow)
  - [ ] Subtask 4.6: Implement Cancel button
  - [ ] Subtask 4.7: Implement Confirm Start button
  - [ ] Subtask 4.8: Add loading state with spinner
  - [ ] Subtask 4.9: Add success/error toast notifications
  - [ ] Subtask 4.10: Auto-close on success (1s delay)

- [ ] Task 5: Integrate modal with WO detail page (AC: 4.2.1, 4.2.2)
  - [ ] Subtask 5.1: Add "Start Production" button to WO detail page
  - [ ] Subtask 5.2: Button only visible if status = 'released'
  - [ ] Subtask 5.3: onClick → open WOStartModal
  - [ ] Subtask 5.4: On success → refresh WO details
  - [ ] Subtask 5.5: Verify status change reflected immediately

- [ ] Task 6: Update dashboard to show started WOs (AC: 4.2.3)
  - [ ] Subtask 6.1: Verify story 4.1 dashboard includes 'started' WOs
  - [ ] Subtask 6.2: Confirm WO appears in "Active WOs" table after start
  - [ ] Subtask 6.3: Verify status shows "In Progress"
  - [ ] Subtask 6.4: Verify Pause button available (if pauses enabled)

### Phase 4: Testing

- [ ] Task 7: Unit tests - Service layer (AC: 4.2.2, 4.2.5, 4.2.6)
  - [ ] Subtask 7.1: Test startWorkOrder() with valid WO
  - [ ] Subtask 7.2: Test status transition: released → in_progress
  - [ ] Subtask 7.3: Test started_at timestamp set
  - [ ] Subtask 7.4: Test started_by_user_id recorded
  - [ ] Subtask 7.5: Test error: WO already in progress
  - [ ] Subtask 7.6: Test error: WO in draft status
  - [ ] Subtask 7.7: Test error: NOT_FOUND
  - [ ] Subtask 7.8: Test org_id isolation
  - [ ] Subtask 7.9: Target: 95% coverage

- [ ] Task 8: Integration tests - API endpoint (AC: 4.2.5, 4.2.7)
  - [ ] Subtask 8.1: Test POST /api/production/work-orders/:id/start (200)
  - [ ] Subtask 8.2: Test 400 if WO already in progress
  - [ ] Subtask 8.3: Test 400 if WO in draft
  - [ ] Subtask 8.4: Test 404 if WO doesn't exist
  - [ ] Subtask 8.5: Test 403 if wrong org_id
  - [ ] Subtask 8.6: Test 401 if not authenticated
  - [ ] Subtask 8.7: Test 403 if insufficient role permissions
  - [ ] Subtask 8.8: Test response includes started_at and started_by_user
  - [ ] Subtask 8.9: Target: 70% coverage

- [ ] Task 9: E2E tests - Full user workflow (AC: All)
  - [ ] Subtask 9.1: Create test WO in 'released' status
  - [ ] Subtask 9.2: Navigate to WO detail page
  - [ ] Subtask 9.3: Click "Start Production" button
  - [ ] Subtask 9.4: Verify modal opens with correct content
  - [ ] Subtask 9.5: Verify material shortage warning shows (if applicable)
  - [ ] Subtask 9.6: Click Confirm Start
  - [ ] Subtask 9.7: Verify loading spinner shows
  - [ ] Subtask 9.8: Verify success toast shows
  - [ ] Subtask 9.9: Verify status changes to "In Progress"
  - [ ] Subtask 9.10: Verify WO appears in dashboard "Active WOs" table
  - [ ] Subtask 9.11: Test error scenario: click again (should fail with already in progress)
  - [ ] Subtask 9.12: Target: 100% critical path coverage

---

## Dev Notes

### Architecture Patterns

- **Action Pattern**: One-way operation endpoint (not CRUD)
  - Reference: Similar to cancel, pause, resume operations
  - Location: `/api/production/work-orders/:id/start/route.ts`

- **Service Layer**: WorkOrderStartService separates from CRUD
  - Location: `/lib/services/production-wo-start-service.ts` (new)
  - Method: startWorkOrder(woId, userId, orgId)

- **Modal Pattern**: Consistent with existing modals
  - Reference: WOStartModal follows PO/TO modal patterns from Stories 3.1-3.8
  - Props: woId, onSuccess, onClose

### Learnings from Previous Stories

**From Story 4.1 (Production Dashboard) & Story 3.10 (Work Order CRUD):**
- WO schema established with status field (draft, released, in_progress, completed, cancelled)
- WO queries and updates use org_id isolation pattern
- Modal patterns from Story 3.10 create/edit flows
- Dashboard will consume "started" WOs from GET /api/production/dashboard/active-wos

### Constraints & Decisions

- **Status validation**: Only 'released' WOs can be started (not draft, completed, etc.)
- **Timestamps**: Server-side (not client) to ensure consistency
- **Material check**: Warning only (not blocking) - allows operators to start even with shortages
- **Audit trail**: started_by_user_id + started_at stored on WO (not separate audit table yet)

### Testing Strategy

- **Unit Tests** (target 95%):
  - Status transition logic
  - Validation checks
  - Timestamp recording
  - Error scenarios

- **Integration Tests** (target 70%):
  - API endpoint contracts
  - Org isolation enforcement
  - Role-based authorization
  - Database state changes

- **E2E Tests** (target 100% critical paths):
  - Full workflow: navigate → open modal → confirm → verify status change
  - Error handling: retry after error
  - Dashboard integration: WO appears in active list

---

## Dev Agent Record

### Context Reference

Context file: [04-2-wo-start.context.xml](04-2-wo-start.context.xml)

### Agent Model Used

Claude Haiku 4.5 (2025-11-27)

### Debug Log References

*Will be populated during implementation*

### Completion Notes List

*Will be populated after tasks are completed*

### File List

*Will be populated as files are created/modified*

---

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
- **Target Status:** done (after all ACs met + tests pass)

---

## Change Log

- 2025-11-27: Story created by Claude Code (create-story workflow)
  - All acceptance criteria derived from Epic 4 Story 4.2 requirements
  - Tasks mapped to ACs with clear subtasks
  - Integration with Story 4.1 (dashboard) and Story 3.10 (WO CRUD) documented
