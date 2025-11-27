# Story 4.16: Multiple Outputs per WO

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As an** Operator
**I want** to register multiple outputs
**So that** I can track partial production

## Acceptance Criteria

### AC-4.16.1: Multiple Output Support
**Given** WO allows multiple outputs
**When** registering output
**Then** each creates separate LP (not cumulative)

### AC-4.16.2: Output History
**Then** work_orders.output_qty = sum of all outputs, output history shown in WO detail

### AC-4.16.3: Output List View
**Then** Table showing all outputs: qty, date, operator, qa_status

### AC-4.16.4: Auto-Complete Trigger
**When** total output >= planned
**Then** system prompts to complete WO (or auto-completes if enabled)

### AC-4.16.5: Genealogy Per Output
**Then** Each output LP has separate genealogy linking to consumed materials

### AC-4.16.6: Genealogy Support for Multiple Outputs
**When** multiple outputs from same WO
**Then** Each output LP links to ALL consumed inputs for the WO (genealogy is not split by output, but shared - each output can trace back to all consumed materials)

### AC-4.16.7: API Tracking
**Then** production_outputs table tracks all outputs with: wo_id, product_id, qty, created_at, operator_id

### AC-4.16.8: Prerequisites
**Then** Requires Story 4.12 (Output Registration) and Story 4.19 (Genealogy)

## Tasks / Subtasks

- [ ] Task 1: Create production_outputs table (if not exists)
- [ ] Task 2: Multiple output logic in OutputService
- [ ] Task 3: Output list/history UI
- [ ] Task 4: Auto-complete trigger (Story 4.6 integration)
- [ ] Task 5: Genealogy per-output linking
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
