# Story 4.5: Operation Complete

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 0.5 day

## User Story

**As an** Operator
**I want** to complete a WO operation
**So that** I can move to the next step

## Acceptance Criteria

### AC-4.5.1: Complete Modal
**Given** operation is In Progress
**When** clicking "Complete"
**Then** modal shows: actual_duration_minutes (default from started_at), actual_yield_percent (default 100), notes field

### AC-4.5.2: Operation Complete Transition
**When** confirmed
**Then** operation status → 'completed', completed_at set, yield% recorded

### AC-4.5.3: Yield Calculation
**Then** actual_yield_percent = (actual_output / expected_output) × 100, defaults to 100%

### AC-4.5.4: API Endpoint
**Then** POST /api/production/work-orders/:id/operations/:opId/complete available with request body: {duration_minutes, yield_percent, notes}

### AC-4.5.5: Duration Auto-Calculation
**When** no duration entered
**Then** system calculates from started_at to NOW()

### AC-4.5.6: Error Handling
**When** operation not in progress
**Then** 400 error: "Operation must be in progress to complete"

### AC-4.5.7: Audit Trail
**Then** completed_at, operator_id, yield_percent recorded

### AC-4.5.8: Next Operation Ready
**When** operation completed
**Then** next operation in sequence becomes available to start (if configured)

## Tasks / Subtasks

- [ ] Task 1: Update wo_operations schema (completed_at, actual_yield_percent)
- [ ] Task 2: Create OperationCompleteService
- [ ] Task 3: Create API endpoint
- [ ] Task 4: Frontend modal + form validation
- [ ] Task 5: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
