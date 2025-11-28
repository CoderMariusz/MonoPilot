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

### AC-4.12.3: Automatic Material Consumption (Output-Driven, Sequential LP Allocation)
**Then** system automatically consumes reserved LPs based on output registration sequence:

**Consumption Logic:**
1. **Track cumulative output qty** across all outputs registered for this WO
2. **Consume reserved LPs in order** (A → B → C) as cumulative output increases:
   - Output-1 (70kg): cumulative=70kg → Consume LP-A (80kg) fully
   - Output-2 (20kg): cumulative=90kg → Consume LP-B (40kg) fully
   - Output-3 (80kg): cumulative=170kg → Consume LP-C (80kg) fully
   - Output-4 (30kg): cumulative=200kg → **Over-production** (all LPs consumed)

3. **Create genealogy for each output:**
   - Output-1 genealogy: LP-A → Output-1 (70kg consumed from 80kg LP)
   - Output-2 genealogy: LP-B → Output-2 (20kg consumed from 40kg LP)
   - Output-3 genealogy: LP-C → Output-3 (80kg consumed from 80kg LP)
   - Output-4 genealogy: [operator selects] → Output-4 (AC-4.12.9)

4. **Handle consume_whole_lp enforcement** (Story 4.9):
   - If consume_whole_lp=true: entire LP consumed when reached in sequence
   - No partial consumption during normal flow

5. **Create consumption audit record**: wo_consumption entries for each LP consumed

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

### AC-4.12.9: Over-Production Handling (Material Source Selection)
**When** output qty would exceed all reserved LPs (AC-4.12.8 case)
**Example scenario:**
- WO: 200kg total, reserved: LP-A(80kg) + LP-B(40kg) + LP-C(80kg)
- Output-1: 70kg → auto-consumed LP-A (80kg)
- Output-2: 20kg → auto-consumed LP-B (40kg)
- Output-3: 80kg → auto-consumed LP-C (80kg)
- Output-4: 30kg → **Over-production!** (240kg consumed vs 200kg reserved)

**When** registering over-production output:
1. Show warning: "All reserved LPs consumed. This output (30kg) is over-production."
2. Show dropdown: "Which reserved LP is source for this 30kg?"
   - Options with remaining qty:
     - LP-A: 80kg total
     - LP-B: 40kg total
     - LP-C: 80kg total
3. Operator selects source LP (e.g., "LP-A")
4. System creates lp_genealogy_allocation record:
   - parent_lp_id = selected LP (LP-A)
   - child_lp_id = over-production output LP (Output-4)
   - allocated_qty = 30kg
   - is_over_production = true
   - allocation_type = 'operator_selected'
5. Create lp_genealogy record linking LP-A → Output-4 (30kg)

**Result**: Over-production genealogy traced back through allocation record

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
