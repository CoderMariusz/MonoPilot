# Story 4.10: Consumption Correction

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As a** Manager
**I want** to correct consumption errors
**So that** inventory stays accurate

## Acceptance Criteria

### AC-4.10.1: Reverse Consumption Modal
**Given** consumption was recorded incorrectly
**When** Manager clicks "Reverse"
**Then** modal confirms: "Reverse consumption of X kg of Y?"

### AC-4.10.2: Reverse Reservation & Genealogy Marking
**When** confirming
**Then**:
- **Reservation marked as reversed**: wo_material_reservations.status = 'reversed'
  - reversed_by, reversed_at, reverse_reason recorded
- **LP status restored**: license_plates.status = previous (e.g., 'available', not 'reserved')
- **LP qty restored**: license_plates.qty += reversed_qty
- **Genealogy record MARKED AS REVERSED** (not deleted):
  - lp_genealogy.status = 'reversed' (or add reversed flag)
  - lp_genealogy.reversed_at = timestamp
  - lp_genealogy.reversed_by = user_id
  - Reason: Full audit trail of genealogy links (even reversed ones) for compliance
- **Audit trail preserved**: wo_material_reservations record remains with status='reversed' for compliance

### AC-4.10.3: Audit Trail
**Then** Audit entry created: operation="consume_reverse", wo_id, material_id, lp_id, qty_reversed, reversed_by, reversed_at

### AC-4.10.4: Role-Based Access
**Then** Only Manager and Admin roles can reverse (not Operator)

### AC-4.10.5: LP Qty Restoration
**Then** license_plates.current_qty += reversed_qty, status updated if needed

### AC-4.10.6: API Endpoint
**Then** POST /api/production/work-orders/:id/consume/reverse with {consumption_record_id}

### AC-4.10.7: Error Handling
**When** consumption record not found
**Then** 404 error

**When** insufficient permissions
**Then** 403 error

### AC-4.10.8: Consumption History
**Then** Reversed record still visible in consumption history (marked as "Reversed on X by Y")

## Tasks / Subtasks

- [ ] Task 1: Add reversed flag to wo_consumption table
- [ ] Task 2: Create ReverseConsumptionService
- [ ] Task 3: API endpoint for reverse operation
- [ ] Task 4: Frontend reverse button + modal
- [ ] Task 5: Audit trail logging
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
