# Story 4.11: Over-Consumption Control

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Admin
**I want** to control over-consumption
**So that** we don't waste materials

## Acceptance Criteria

### AC-4.11.1: Over-Consumption Warning (not blocking)
**Given** output qty would trigger over-consumption (consumed_qty > required_qty)
**When** output is registered (Story 4.12 auto-consume triggered)
**Then** system shows warning dialog:
- "⚠️ Over-Consumption Detected!"
- "Material 'Flour': Required 100kg, Reserved 80+40=120kg, Output triggers consumption of all"
- Buttons: "Cancel" or "Accept Over-Consumption"
**Note**: System WARNS but doesn't block - operator must confirm to proceed

### AC-4.11.2: Over-Consumption Warning (When Allowed)
**Given** allow_over_consumption = true
**When** consumed_qty > required_qty
**Then** warning shown: "⚠️ Over-consumption: +X kg above required"

### AC-4.11.3: Variance Tracking
**Then** wo_materials.consumed_qty tracked, variance = consumed - required recorded

### AC-4.11.4: Transaction Atomicity (Sprint 0 Gap 6) - Output Registration Endpoint
**Then** POST /api/production/work-orders/:id/outputs with over-consumption check is atomic:
1. VALIDATE: WO in_progress, reserved materials exist
2. CALCULATE: total_consumed (cumulative across all outputs)
3. **CHECK over-consumption per material**:
   - If total_consumed > required_qty for ANY material:
     - Return 400 error: "Over-consumption detected for Material X. Confirm to proceed?"
     - Frontend shows dialog with operator choice
   - If operator confirms: proceed with auto-consume (Story 4.12 AC-4.12.3)
   - If operator cancels: cancel output registration
4. AUTO-CONSUME: Execute sequential LP allocation (Story 4.12 AC-4.12.3)
5. CREATE genealogy links (Story 4.19)
6. UPDATE work_orders.output_qty
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
