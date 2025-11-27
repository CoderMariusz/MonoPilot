# Story 4.20: Operation Timeline View

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As a** Production Manager
**I want** to see operations as visual timeline
**So that** I can track progress at a glance

## Acceptance Criteria

### AC-4.20.1: Timeline Visualization
**Given** viewing WO with operations
**When** scrolling to timeline section
**Then** see visual timeline:
- Each operation as horizontal segment
- Color by status: gray=not started, blue=in progress, green=completed
- Actual vs expected duration shown

### AC-4.20.2: Operation Segment Details
**When** clicking operation segment
**Then** popover shows:
- Operation name
- Status
- Started/completed timestamps
- Duration (actual vs expected)
- Operator name
- Yield %

### AC-4.20.3: Timeline Positioning
**Then** Segment width proportional to duration, positioned in timeline order

### AC-4.20.4: Duration Display
**Then** Actual duration = completed_at - started_at, expected from routing_operations.estimated_duration_minutes

### AC-4.20.5: Color Legend
**Then** Legend shows: Not Started (gray), In Progress (blue), Completed (green)

### AC-4.20.6: Responsive Design
**Then** Timeline scrollable on mobile, full-width on desktop

### AC-4.20.7: CSS/SVG Implementation
**Then** Use CSS/SVG only, no external charting library

### AC-4.20.8: Prerequisites
**Then** Requires Stories 4.4-4.5 (Operation Start/Complete)

## Tasks / Subtasks

- [ ] Task 1: Timeline data aggregation (from wo_operations)
- [ ] Task 2: SVG/CSS timeline component
- [ ] Task 3: Color mapping logic
- [ ] Task 4: Duration calculations
- [ ] Task 5: Popover details component
- [ ] Task 6: Responsive styling
- [ ] Task 7: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
