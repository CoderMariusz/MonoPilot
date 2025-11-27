# Story 4.12: Output Registration (Desktop)

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Operator
**I want** to register production output
**So that** finished goods are tracked

## Acceptance Criteria

### AC-4.12.1: Main Output Registration Modal
**Given** WO is In Progress
**When** clicking "Register Output"
**Then** modal opens with fields for **main output only**: quantity (required), qa_status (if required), location_id (default from line), notes
- **Note**: By-product registration is separate (Story 4.14), comes AFTER main output

### AC-4.12.2: Output LP Creation
**When** confirming
**Then** output LP created:
- product from WO
- batch_number from WO.wo_number
- expiry_date calculated from product.shelf_life
- status = 'available'
- quantity = entered value

### AC-4.12.3: Automatic Material Consumption (Output-Driven)
**Then** system automatically consumes reserved LPs based on output qty:
1. **Calculate consumption ratio**: output_qty / total_planned_qty
2. **Consume reserved LPs in sequence** (from Story 4.7 reservations):
   - Example: WO 200kg, reserved 80+40+80, output 70kg
   - Consume: entire LP-A (80kg) → genealogy links to output
   - Result: wo_material_reservations.status = 'consumed', genealogy updated
3. **Handle consume_whole_lp enforcement** (Story 4.9):
   - If consume_whole_lp=true, entire LP must be consumed (no partial)
   - System consumes LP when its LP is reached in sequence
4. **Create consumption audit record**: wo_consumption entries for each LP consumed

### AC-4.12.4: WO Output Tracking & Genealogy Update
**Then**:
- **Output tracking**: work_orders.output_qty += registered_qty
- **Genealogy linking** (Story 4.19 integration):
  - Update consumed lp_genealogy records (from AC-4.12.3) by setting:
    - child_lp_id = output LP (now that output LP exists)
    - produced_at = current timestamp
    - consumed_qty = actual qty consumed per LP
  - Result: Each consumed input LP (parent) now links to this output LP (child)

### AC-4.12.5: Progress Tracking
**Then** Cumulative output tracked, progress = output_qty / planned_qty × 100%

### AC-4.12.6: QA Status Recording
**Given** qa_status required in Settings
**When** confirming output
**Then** license_plates.qa_status set to entered value

### AC-4.12.7: API Endpoint
**Then** POST /api/production/work-orders/:id/outputs with {qty, qa_status, location_id, notes}

### AC-4.12.8: Error Handling
**When** qty <= 0
**Then** 400 error: "Output quantity must be > 0"

**When** WO not in progress
**Then** 400 error: "WO not in progress"

**When** over-production (output_qty > total_reserved_qty) AND allow_over_consumption=false
**Then** warn: "Output would consume all reserved materials. Continue?" (proceed if confirm)

### AC-4.12.9: Over-Production Handling (consume_whole_lp scenarios)
**When** output qty would exceed all reserved LPs (AC-4.12.8 case)
**Then**:
1. Show warning: "All reserved LPs would be consumed. Use LPs from previous WO?"
2. If yes: Show list of similar products from previous WOs (by BOM)
3. Operator selects LP from previous WO
4. System consumes previous LP(s) + links to current output genealogy
5. If no: Mark as "over-produced", proceed if allowed

### AC-4.12.10: Prerequisites
**Then** Requires Story 4.7 (Material Reservation) and Story 4.19 (Genealogy)

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
