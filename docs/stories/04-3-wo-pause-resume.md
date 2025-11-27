# Story 4.3: WO Pause/Resume

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 0.5 day

## User Story

**As an** Operator
**I want** to pause a WO when there's an issue
**So that** we can track downtime and resume later

## Acceptance Criteria

### AC-4.3.1: Pause Modal & Validation
**Given** WO is In Progress and pause enabled in production_settings
**When** clicking "Pause" button
**Then** modal shows: pause reason (Breakdown, Break, Material Wait, Other), notes field, Cancel/Confirm buttons

### AC-4.3.2: Pause Status Transition
**Given** modal is confirmed
**When** clicking "Confirm Pause"
**Then** system updates: status → 'paused', pause_reason recorded, wo_pauses record created with timestamps

### AC-4.3.3: Resume Operation
**Given** WO is paused
**When** clicking "Resume"
**Then** system updates: status → 'in_progress', pause duration calculated, resume_at timestamp set

### AC-4.3.4: Pause Duration Tracking
**Given** WO paused and resumed
**When** viewing WO details
**Then** total downtime shown with breakdown by reason (Breakdown: 45min, Break: 30min, etc.)

### AC-4.3.5: API Endpoints
**Given** frontend makes requests
**When** calling pause/resume endpoints
**Then** endpoints available:
- POST /api/production/work-orders/:id/pause (with pause_reason, notes)
- POST /api/production/work-orders/:id/resume

### AC-4.3.6: Role-Based Access
**Given** I am Production Manager or Operator
**When** accessing pause/resume
**Then** I have permission; only managers can pause/resume

### AC-4.3.7: Configuration Toggle
**Given** admin disables pause in production_settings.allow_pause_wo
**When** viewing WO
**Then** "Pause" button hidden

### AC-4.3.8: Dashboard Integration
**Given** WO is paused
**When** viewing production dashboard
**Then** WO appears in Active list with "Paused" status and resume button

## Tasks / Subtasks

- [ ] Task 1: Database (wo_pauses table, work_orders pause fields)
- [ ] Task 2: Service layer (pauseWorkOrder, resumeWorkOrder)
- [ ] Task 3: API routes (POST pause/resume endpoints)
- [ ] Task 4: Frontend (Pause/Resume modal + buttons)
- [ ] Task 5: Dashboard integration
- [ ] Task 6: Unit tests
- [ ] Task 7: Integration tests
- [ ] Task 8: E2E tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
