# Story 4.7: Material Reservation (Desktop)

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Operator
**I want** to reserve/allocate materials from desktop
**So that** I can track which LPs will be used for production (actual consumption happens when output is registered - Story 4.12/4.13)

---

## Problem Statement

Materials need to be pre-allocated to WO in the order they will be consumed. This reservation:
1. Locks LP sequence (A → B → C order cannot change)
2. Enables consume_whole_lp enforcement (entire LP consumed when output triggers it)
3. Creates audit trail for material traceability
4. Actual consumption happens automatically when output is registered (4.12/4.13) based on output qty
5. Genealogy records created with parent_lp_id, waiting for child_lp_id (output LP)

## Acceptance Criteria

### AC-4.7.1: Materials Table
**Given** viewing WO material reservation page
**When** page loads
**Then** table shows: Product, Required Qty, Reserved Qty, Remaining, Reserved LPs (sequence), Actions

### AC-4.7.2: Material Reservation Modal (Story 4.9 Integration)
**When** clicking "Reserve" on material
**Then** modal opens to allocate LP for this material:
- LP search/scan input (find LP by barcode or product)
- **Conditional qty input**:
  - **If consume_whole_lp = false**: qty input field enabled, validates product/UoM/qty available
  - **If consume_whole_lp = true** (Story 4.9): qty field **disabled/read-only**, shows "Entire LP: [LP_qty] [UOM]", only "Reserve Full LP" button
- Shows sequence number (e.g., "LP #1 for Flour", "LP #2 for Flour", etc.)

### AC-4.7.3: Material Reservation Recording & Genealogy Initialization
**When** confirming reservation
**Then**:
- **Reservation recorded**: wo_material_reservations entry created:
  - wo_id, material_id, lp_id, reserved_qty, sequence_number (1, 2, 3...)
  - status = 'reserved'
- **LP status changed**: license_plates.status = 'reserved' (locked for this WO)
- **Genealogy record created** (Story 4.19 integration):
  - lp_genealogy entry created with: parent_lp_id (reserved LP), child_lp_id = NULL, wo_id, reserved_at
  - child_lp_id will be filled later during output registration (Story 4.12)
  - actual_consumed_qty calculated later based on output (Story 4.12/4.13)

### AC-4.7.4: Progress Tracking
**Then** Reserved Qty updated, Remaining = Required - Reserved, visual progress bar showing:
- Reserved LPs in sequence order with their qty
- Example: "Reserved: 80kg (LP-A) + 40kg (LP-B) = 120kg / Required 200kg"

### AC-4.7.5: API Endpoint
**Then** POST /api/production/work-orders/:id/materials/reserve with {lp_id, material_id, reserved_qty, notes}

### AC-4.7.6: Error Handling
**When** LP insufficient qty for reservation
**Then** 400 error: "LP has 10kg, requested 15kg for reservation"

**When** LP already reserved for this WO
**Then** 400 error: "LP already reserved for this WO"

**When** WO not in progress
**Then** 400 error: "WO not in progress"

**When** consume_whole_lp=true AND requested qty != LP.qty
**Then** 400 error: "Material must use entire LP (50kg). Cannot reserve partial."

### AC-4.7.7: Role-Based Access
**Then** Operators and Production Managers can reserve materials

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
