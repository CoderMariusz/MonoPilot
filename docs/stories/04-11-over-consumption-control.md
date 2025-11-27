# Story 4.11: Over-Consumption Control

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Admin
**I want** to control over-consumption
**So that** we don't waste materials

## Acceptance Criteria

### AC-4.11.1: Over-Consumption Validation
**Given** over-consumption control enabled in production_settings.allow_over_consumption = false
**When** consumed_qty > required_qty for material
**Then** system blocks: "Cannot exceed required qty by X kg"

### AC-4.11.2: Over-Consumption Warning (When Allowed)
**Given** allow_over_consumption = true
**When** consumed_qty > required_qty
**Then** warning shown: "⚠️ Over-consumption: +X kg above required"

### AC-4.11.3: Variance Tracking
**Then** wo_materials.consumed_qty tracked, variance = consumed - required recorded

### AC-4.11.4: Transaction Atomicity (Sprint 0 Gap 6) - Consumption Endpoint
**Then** POST /api/production/work-orders/:id/consume with over-consumption check is atomic:
1. VALIDATE: WO in_progress, material exists, LP sufficient
2. CALCULATE: total_consumed = wo_materials.consumed_qty + requested_qty
3. **CHECK over-consumption limit**:
   - If allow_over_consumption = false AND total_consumed > required_qty: REJECT (400 error)
   - If allow_over_consumption = true AND total_consumed > required_qty: WARN but allow
4. INSERT consumption record (wo_consumption table)
5. UPDATE LP qty (license_plates.qty -= requested_qty)
6. UPDATE wo_materials consumed_qty (wo_materials.consumed_qty += requested_qty)
7. COMMIT or ROLLBACK (no partial updates)

### AC-4.11.5: Rollback on Over-Consumption Blocked
**When** over-consumption blocked
**Then** NO consumption record created, LP qty unchanged, error returned

### AC-4.11.6: API Endpoint
**Then** POST /api/production/work-orders/:id/consume validates allow_over_consumption

### AC-4.11.7: Settings Configuration
**Then** production_settings.allow_over_consumption toggle (Story 4.17)

### AC-4.11.8: Error Messages
| Scenario | Message |
|----------|---------|
| Over-consumption blocked | "Cannot consume: Over-consumption not allowed. Required: 100kg, Consumed: 95kg, Requested: 10kg. Max allowed: 5kg more." |
| QA Hold LP | "Cannot consume: LP on QA Hold" |

## Tasks / Subtasks

- [ ] Task 1: Implement over-consumption check in ConsumptionService
- [ ] Task 2: Atomic transaction with proper rollback
- [ ] Task 3: API validation and error responses
- [ ] Task 4: Frontend warning/error display
- [ ] Task 5: Variance tracking and reporting
- [ ] Task 6: Tests (unit, integration, atomic transaction tests)

## Dev Notes

- **Transaction atomicity required** - Follow AC-4.11.4 exactly
- **Integration with 4.7-4.10** - Use same consumption endpoint
- **Reference:** Sprint 0 Gap 6, AC Template Checklist

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
