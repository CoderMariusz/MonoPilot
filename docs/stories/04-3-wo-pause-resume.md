# Story 4.3: WO Pause/Resume

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

---

## Goal

Enable operators to pause work orders during unexpected issues and resume them later, with detailed downtime tracking for reporting and analysis.

## User Story

**As an** Operator
**I want** to pause a WO when there's an issue
**So that** we can track downtime

---

## Problem Statement

Operators need ability to temporarily halt production without canceling WO:
1. Pause with documented reason (breakdown, break, material wait, etc.)
2. Track pause duration and reasons
3. Resume seamlessly to continue production
4. Report on downtime causes

---

## Acceptance Criteria

### AC-4.3.1: Pause Modal & Validation
**Given** WO is In Progress and pause enabled in production_settings
**When** clicking "Pause" button
**Then** modal shows: pause reason (Breakdown, Break, Material Wait, Other), notes field, Cancel/Confirm buttons

### AC-4.3.2: Pause Status Transition
**When** confirmed
**Then** system updates: status → 'paused', pause_reason recorded, wo_pauses record created with timestamps

### AC-4.3.3: Resume Operation
**When** clicking "Resume"
**Then** system updates: status → 'in_progress', pause duration calculated, resume_at timestamp set

### AC-4.3.4: Pause Duration Tracking
**When** viewing WO details
**Then** total downtime shown with breakdown by reason (Breakdown: 45min, Break: 30min, etc.)

### AC-4.3.5: API Endpoints
- POST /api/production/work-orders/:id/pause (with pause_reason, notes)
- POST /api/production/work-orders/:id/resume

### AC-4.3.6: Role-Based Access
**Then** Operators and Production Managers can pause/resume

### AC-4.3.7: Configuration Toggle
**When** admin disables pause in production_settings.allow_pause_wo
**Then** "Pause" button hidden

### AC-4.3.8: Dashboard Integration
**When** viewing production dashboard
**Then** WO appears in Active list with "Paused" status and resume button

## Tasks / Subtasks

- [ ] Task 1: Create wo_pauses table (wo_id, pause_reason, notes, paused_at, resumed_at)
- [ ] Task 2: PauseResumeService implementation
- [ ] Task 3: API endpoints (pause/resume)
- [ ] Task 4: Frontend pause/resume modals + buttons
- [ ] Task 5: Dashboard integration
- [ ] Task 6: Tests (unit, integration, E2E)

## Dev Notes

### Architecture Patterns
- **Status-based workflow**: Use WO status transitions (in_progress → paused → in_progress)
- **Downtime tracking**: wo_pauses table stores pause history for audit and reporting
- **Pattern reuse**: Similar to Story 4.2 (WO Start) - simple status transition with audit

### Key Decisions
- **Status field**: WO status becomes 'paused' (not separate field)
- **Multiple pauses**: Support multiple pause/resume cycles in one WO
- **Downtime calc**: resume_at - paused_at per wo_pauses record

### Constraints
- Pause only available if WO in_progress
- Resume requires WO in paused status
- Configuration toggle (Story 4.17) controls visibility
- Toggle default: allow_pause_wo = true

### Testing Strategy
- Unit: Pause/resume service logic, duration calculations
- Integration: API endpoints, status transitions, org isolation
- E2E: Full workflow - start → pause → resume → complete

---

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
