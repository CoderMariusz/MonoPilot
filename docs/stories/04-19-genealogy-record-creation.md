# Story 4.19: Genealogy Record Creation

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As a** System
**I want** to record genealogy links
**So that** traceability is maintained

## Acceptance Criteria

### AC-4.19.1: Output Genealogy Entry Creation (at Output Registration)
**Given** output registered
**When** output LP created (Story 4.12)
**Then** lp_genealogy entries created for each consumed LP:
- parent_lp_id = consumed LP (from sequential allocation)
- child_lp_id = output LP (now known)
- wo_id = current WO
- consumed_qty = qty consumed from this LP for this output
- produced_at = timestamp
- created_at = timestamp
**Note**: Genealogy created at output registration, not at reservation

### AC-4.19.2: Partial LP Consumption Tracking
**When** LP is consumed partially across multiple outputs (Story 4.16)
**Then** genealogy tracks partial consumption:
- LP-2 (30kg) → Output-1 (20kg) + Output-2 (10kg)
- Two lp_genealogy records created with consumed_qty = 20kg and 10kg respectively

### AC-4.19.3: Multiple Outputs & Parent-Child Relationships
**When** multiple outputs from same WO
**Then** Genealogy structure:
- **Per WO output**: Each output LP has many parent LPs (materials consumed in that WO) → many-to-one per output
- **Per parent LP**: Each parent LP can have many children (from different WOs using that material) → one-to-many from parent perspective
- **Result**: From genealogy table view: many consumed parent LPs → one output LP per record, but one parent LP can appear in multiple genealogy records (to different children)

### AC-4.19.4: Genealogy Tree View
**Then** Forward tracing: input LP → WO → output LP, Backward tracing: output LP → WO → input LPs

### AC-4.19.5: Data Integrity
**Then** FK constraints: parent_lp_id, child_lp_id, wo_id are valid

### AC-4.19.6: Audit Trail
**Then** created_at, created_by_user_id recorded for compliance

### AC-4.19.7: FDA Compliance
**Then** Genealogy supports FDA 21 CFR Part 117 traceability requirements

### AC-4.19.8: Prerequisites
**Then** Requires Stories 4.7 (Consumption) and 4.12 (Output)

## Tasks / Subtasks

- [ ] Task 1: Verify lp_genealogy table schema
- [ ] Task 2: Genealogy entry creation on consumption
- [ ] Task 3: Genealogy update on output
- [ ] Task 4: Many-to-many genealogy support
- [ ] Task 5: Genealogy query logic (forward/backward)
- [ ] Task 6: FK constraint validation
- [ ] Task 7: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
