# Story 4.17: Production Settings Configuration

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As an** Admin
**I want** to configure Production module settings
**So that** execution matches our process

## Acceptance Criteria

### AC-4.17.1: Settings Page
**Given** Admin navigates to /settings/production-execution
**When** page loads
**Then** can configure toggles and values:

| Setting | Type | Options |
|---------|------|---------|
| allow_pause_wo | Toggle | true/false |
| auto_complete_wo | Toggle | true/false |
| require_operation_sequence | Toggle | true/false |
| allow_over_consumption | Toggle | true/false |
| allow_partial_lp_consumption | Toggle | true/false |
| require_qa_on_output | Toggle | true/false |
| auto_create_by_product_lp | Toggle | true/false |
| dashboard_refresh_seconds | Number | 10-300 (default 30) |

### AC-4.17.2: Settings Persistence
**Then** production_settings table stores settings (org-level isolation)

### AC-4.17.3: Default Values
**Then** All toggles default to true (permissive), refresh_seconds defaults to 30

### AC-4.17.4: API Routes
**Then** GET/PUT /api/production/settings endpoints available

### AC-4.17.5: Real-Time Application
**When** settings changed
**Then** New settings applied immediately (no restart needed)

### AC-4.17.6: Validation
**Then** dashboard_refresh_seconds validated: 10 <= value <= 300

### AC-4.17.7: Audit Logging
**When** settings changed
**Then** Audit record created: what changed, by whom, when

### AC-4.17.8: Role-Based Access
**Then** Only Admins can view/modify production settings

## Tasks / Subtasks

- [ ] Task 1: Create/verify production_settings table
- [ ] Task 2: Settings UI page
- [ ] Task 3: GET/PUT API endpoints
- [ ] Task 4: Settings persistence and defaults
- [ ] Task 5: Real-time setting application
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
