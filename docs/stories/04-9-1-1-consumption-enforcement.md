# Story 4.9: 1:1 Consumption Enforcement

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As a** System
**I want** to enforce full LP consumption when flagged
**So that** allergen control is maintained

## Acceptance Criteria

### AC-4.9.1: Whole LP Flag
**Given** material has consume_whole_lp = true (from BOM)
**When** operator tries to consume partial
**Then** system blocks: "Must consume entire LP"

### AC-4.9.2: Scanner UI
**When** consuming via scanner
**Then** qty input disabled, shows "Full LP: 50 kg" (read-only)

### AC-4.9.3: Desktop UI
**When** consuming via desktop (Story 4.7)
**Then** qty field shows full LP qty, cannot change, only "Consume All" button

### AC-4.9.4: Validation Check Locations
**Then** consume_whole_lp flag from wo_materials (copied from BOM in Story 3.10)
- **Desktop UI** (Story 4.7): qty field disabled, "Consume All" button only
- **Scanner UI** (Story 4.8): qty input disabled, shows full LP qty (read-only)
- **API Layer**: POST /api/production/work-orders/:id/consume validates consume_whole_lp

### AC-4.9.5: API Validation
**Then** POST /api/production/work-orders/:id/consume:
- Checks consume_whole_lp flag
- If true: validates qty == LP.qty (entire LP)
- If qty != LP.qty when flag=true: rejects with 400 error

### AC-4.9.6: Error Message
**When** attempting partial consumption
**Then** 400 error: "Material 'Flour' must be consumed entirely (50 kg). Cannot consume partial amounts."

### AC-4.9.7: Prerequisites
**Then** Requires Story 3.10 (BOM snapshot with consume_whole_lp flag)

### AC-4.9.8: Testing
**Then** Test with both whole and partial consumption BOM items

## Tasks / Subtasks

- [ ] Task 1: Verify wo_materials has consume_whole_lp column
- [ ] Task 2: API validation logic
- [ ] Task 3: Scanner UI (disable qty input)
- [ ] Task 4: Desktop UI (read-only qty)
- [ ] Task 5: Error messages
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
