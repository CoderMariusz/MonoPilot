# Story 4.19: Genealogy Record Creation

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As a** System
**I want** to record genealogy links
**So that** traceability is maintained

## Acceptance Criteria

### AC-4.19.1: Consumption Genealogy Entry
**Given** material consumed
**When** consumption recorded
**Then** lp_genealogy entry created:
- parent_lp_id = consumed LP
- child_lp_id = NULL (filled on output)
- wo_id = current WO
- consumed_at = timestamp
- created_at = timestamp

### AC-4.19.2: Output Genealogy Link
**Given** output registered
**When** output LP created
**Then** genealogy updated:
- child_lp_id = output LP
- produced_at = timestamp

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
