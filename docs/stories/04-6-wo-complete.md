# Story 4.6: WO Complete

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 3 | **Effort:** 1 day

## User Story

**As an** Operator
**I want** to complete a work order
**So that** I can finish production

## Acceptance Criteria

### AC-4.6.1: Complete Modal & Validation
**Given** WO is In Progress
**When** clicking "Complete WO"
**Then** modal shows WO summary and validates:
- All operations completed (if required)
- At least one output registered
- By-products registered (if in BOM)

### AC-4.6.2: Status Transition
**When** validation passes
**Then** status → 'completed', completed_at set, completed_by_user_id recorded

### AC-4.6.3: Auto-Complete
**Given** auto_complete_wo enabled
**When** output_qty >= planned_qty
**Then** WO auto-completes without user action

### AC-4.6.4: Transaction Atomicity (Sprint 0 Gap 6)
**Then** WO completion is atomic:
1. VALIDATE: status='in_progress', operations complete, output exists
2. UPDATE work_orders: status, completed_at, completed_by
3. UPDATE wo_operations: status → 'completed'
4. UPDATE output LPs: status → 'available' (from 'in_production')
5. INSERT genealogy records (consumed → outputs)
6. COMMIT or ROLLBACK all (no partial updates)

### AC-4.6.5: Error Handling & Rollback
**When** any validation fails
**Then** 400 error with specific reason, NO partial updates

| Error | Message |
|-------|---------|
| Already complete | "WO #X is already completed" |
| Operations pending | "2 operations not completed" |
| No output | "Register at least one output LP" |
| Missing by-products | "By-product 'Y' not registered" |

### AC-4.6.6: API Endpoint
**Then** POST /api/production/work-orders/:id/complete available

### AC-4.6.7: Concurrency Handling
**Then** Row-level lock on work_orders (SELECT...FOR UPDATE), prevent duplicate completion

### AC-4.6.8: Dashboard Integration
**When** WO completed
**Then** removed from "Active WOs" list, appears in "Completed Today"

## Tasks / Subtasks

- [ ] Task 1: Design atomic transaction flow
- [ ] Task 2: Create WOCompleteService with transaction logic
- [ ] Task 3: Implement validation checks
- [ ] Task 4: Implement genealogy record creation (Story 4.19 dependency)
- [ ] Task 5: Create API endpoint with proper error responses
- [ ] Task 6: Frontend modal with validation feedback
- [ ] Task 7: Tests (unit, integration, E2E, concurrency tests)

## Dev Notes

- **Transaction atomicity required** - Follow AC-4.6.4 exactly
- **Genealogy integration** - Must create genealogy records on completion (Story 4.19)
- **Concurrency risk** - Multiple operators clicking Complete simultaneously
- **Reference:** AC Template Checklist, Sprint 0 Gap 6

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
