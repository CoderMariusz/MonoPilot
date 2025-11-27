# Story 4.4: Operation Start

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As an** Operator
**I want** to start a WO operation
**So that** I can track step progress

## Acceptance Criteria

### AC-4.4.1: Operation Start Modal
**Given** WO has operations from routing (Story 3.14)
**When** clicking "Start" on operation
**Then** modal shows operation details and "Confirm Start" button

### AC-4.4.2: Operation Status Transition
**When** confirmed
**Then** operation status → 'in_progress', started_at set, operator_id recorded

### AC-4.4.3: Sequence Enforcement
**Given** require_operation_sequence enabled
**When** trying to start operation N
**Then** system validates N-1 is completed; blocks if not

### AC-4.4.4: API Endpoint
**Then** POST /api/production/work-orders/:id/operations/:opId/start available

### AC-4.4.5: Dashboard Integration
**When** operation started
**Then** operation appears in active operations list on dashboard

### AC-4.4.6: Error Handling
**When** operation already in progress
**Then** 400 error: "Operation is already in progress"

### AC-4.4.7: Role-Based Access
**Then** Operators and Production Managers can start operations

### AC-4.4.8: Audit Trail
**Then** started_at and operator_id recorded

## Tasks / Subtasks

- [ ] Task 1: Verify wo_operations table schema (started_at, operator_id)
- [ ] Task 2: Create OperationStartService
- [ ] Task 3: Create API endpoint
- [ ] Task 4: Frontend modal component
- [ ] Task 5: Tests (unit, integration, E2E)

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
