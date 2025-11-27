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

### AC-4.16.6: Sequential LP Allocation with Shared Consumption
**When** multiple outputs from same WO
**Then** Reserved LPs consumed sequentially across outputs (LPs can span multiple outputs):

**Example:**
```
WO: 200kg meat, Reserved:
  - LP-1: 40kg
  - LP-2: 30kg
  - LP-3: 40kg
  - LP-4: 60kg

Output-1 (60kg): consumes LP-1 (40kg) + LP-2 (20kg of 30kg)
Output-2 (30kg): consumes LP-2 (10kg remaining) + LP-3 (20kg of 40kg)
Output-3 (40kg): consumes LP-3 (20kg remaining) + LP-4 (20kg of 60kg)
Output-4 (30kg): over-production, operator selects source LP

Genealogy per output:
- Output-1: LP-1 → Output-1, LP-2 (partial) → Output-1
- Output-2: LP-2 (partial) → Output-2, LP-3 (partial) → Output-2
- Output-3: LP-3 (partial) → Output-3, LP-4 (partial) → Output-3
- Output-4: [operator choice] → Output-4
```

**Key**: LPs consumed sequentially, can be split across multiple outputs

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
