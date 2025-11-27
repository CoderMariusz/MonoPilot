# Story 4.7: Material Consumption (Desktop)

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Operator
**I want** to consume materials from desktop
**So that** I can track what was used

## Acceptance Criteria

### AC-4.7.1: Materials Table
**Given** viewing WO consumption page
**When** page loads
**Then** table shows: Product, Required Qty, Consumed Qty, Remaining, Actions

### AC-4.7.2: Consume Modal
**When** clicking "Consume" on material
**Then** modal opens: LP search/scan input, qty input, validates product/UoM/qty available

### AC-4.7.3: Consumption Recording
**When** confirming
**Then** consumption recorded, LP qty decreased, genealogy record created

### AC-4.7.4: Progress Tracking
**Then** Consumed Qty updated, Remaining = Required - Consumed, visual progress bar

### AC-4.7.5: API Endpoint
**Then** POST /api/production/work-orders/:id/consume with {lp_id, qty, notes}

### AC-4.7.6: Error Handling
**When** LP insufficient qty
**Then** 400 error: "LP has 10kg, requested 15kg"

**When** WO not in progress
**Then** 400 error: "WO not in progress"

### AC-4.7.7: Role-Based Access
**Then** Operators and Production Managers can consume

### AC-4.7.8: Prerequisites
**Then** Requires Story 3.10 (Work Order CRUD with BOM Snapshot) and Epic 5 (License Plates)

## Tasks / Subtasks

- [ ] Task 1: Create wo_consumption table/API
- [ ] Task 2: ConsumptionService implementation
- [ ] Task 3: Consumption modal component
- [ ] Task 4: Materials table component
- [ ] Task 5: LP validation and quantity checks
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
