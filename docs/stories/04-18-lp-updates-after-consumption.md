# Story 4.18: LP Updates After Consumption

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As a** System
**I want** to update LP qty when materials are auto-consumed
**So that** inventory is accurate

## Acceptance Criteria

### AC-4.18.1: LP Qty Decrease at Output Registration
**Given** output registered (Story 4.12)
**When** sequential LP allocation triggered (auto-consume)
**Then** license_plates.current_qty decreased by consumed amount:
- Example: LP-2 (30kg) consumed 20kg by Output-1 → LP-2 qty = 10kg
- When Output-2 consumes remaining 10kg → LP-2 qty = 0kg

### AC-4.18.2: LP Status Transition
**When** current_qty = 0
**Then** license_plates.status → 'consumed'

### AC-4.18.3: LP Audit Trail
**Then** license_plates.consumed_by_wo_id = current WO, updated_at timestamp set

### AC-4.18.4: Atomic Update
**Then** Consumption record + LP update atomic (same transaction)

### AC-4.18.5: Concurrency Safety
**Then** Row-level lock on license_plates during update, prevent negative qty

### AC-4.18.6: LP Movement Record
**When** consumption recorded
**Then** lp_movements record created: type='consumption', wo_id, lp_id, qty

### AC-4.18.7: Validation
**When** attempting to consume more than available
**Then** 400 error: "LP has 10kg available, requested 15kg"

### AC-4.18.8: Prerequisites
**Then** Requires Story 4.7 (Material Consumption)

## Tasks / Subtasks

- [ ] Task 1: Verify license_plates schema (current_qty, status, consumed_by_wo_id)
- [ ] Task 2: LP update logic in ConsumptionService
- [ ] Task 3: Movement record creation
- [ ] Task 4: Atomic transaction handling
- [ ] Task 5: Concurrency tests
- [ ] Task 6: Qty validation

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
