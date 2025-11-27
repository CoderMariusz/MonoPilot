# Story 4.12: Output Registration (Desktop)

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Operator
**I want** to register production output
**So that** finished goods are tracked

## Acceptance Criteria

### AC-4.12.1: Output Registration Modal
**Given** WO is In Progress
**When** clicking "Register Output"
**Then** modal opens with fields: quantity (required), qa_status (if required), location_id (default from line), notes

### AC-4.12.2: Output LP Creation
**When** confirming
**Then** output LP created:
- product from WO
- batch_number from WO.wo_number
- expiry_date calculated from product.shelf_life
- status = 'available'
- quantity = entered value

### AC-4.12.3: WO Output Tracking
**Then** work_orders.output_qty updated, genealogy completed (consumed LPs → output LP)

### AC-4.12.4: Progress Tracking
**Then** Cumulative output tracked, progress = output_qty / planned_qty × 100%

### AC-4.12.5: QA Status Recording
**Given** qa_status required in Settings
**When** confirming output
**Then** license_plates.qa_status set to entered value

### AC-4.12.6: API Endpoint
**Then** POST /api/production/work-orders/:id/outputs with {qty, qa_status, location_id, notes}

### AC-4.12.7: Error Handling
**When** qty <= 0
**Then** 400 error: "Output quantity must be > 0"

**When** WO not in progress
**Then** 400 error: "WO not in progress"

### AC-4.12.8: Prerequisites
**Then** Requires Story 4.7 (Material Consumption) and Story 4.19 (Genealogy)

## Tasks / Subtasks

- [ ] Task 1: Create production_outputs table
- [ ] Task 2: OutputService implementation
- [ ] Task 3: Output registration modal
- [ ] Task 4: LP auto-generation logic
- [ ] Task 5: Genealogy integration
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
