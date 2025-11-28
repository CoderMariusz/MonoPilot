# Story 4.8: Material Reservation (Scanner)

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 2 | **Effort:** 1 day

## User Story

**As an** Operator
**I want** to reserve materials via scanner
**So that** I can allocate them efficiently on the floor (actual consumption happens when output is registered)

## Acceptance Criteria

### AC-4.8.1: Scanner Workflow
**Given** user navigates to /scanner/reserve
**When** scanning WO barcode
**Then** system shows materials that need to be reserved for production

### AC-4.8.2: LP Barcode Scanning
**When** scanning LP barcode
**Then** system validates: LP exists, product matches, UoM matches, qty available for reservation

### AC-4.8.3: Quantity Entry (Story 4.9 Integration)
**When** entering qty (or "Full LP" button if consume_whole_lp=true):
- **If consume_whole_lp=false**: qty input enabled, operator enters qty
- **If consume_whole_lp=true**: qty field disabled, shows full LP qty, only "Reserve Full LP" button
**Then** reservation confirmed, moves to next material

### AC-4.8.4: Touch Optimization
**Then** Large buttons (>44px), no keyboard if possible, voice feedback optional

### AC-4.8.5: Offline Support
**Then** Queue operations in offline queue if network unavailable (Story 5.36)

### AC-4.8.6: Same API as Desktop
**Then** Uses same POST /api/production/work-orders/:id/materials/reserve endpoint (Story 4.7)

### AC-4.8.7: Material Complete Indicator
**When** all materials reserved
**Then** Green checkmark, option to proceed to production floor

### AC-4.8.8: Error Handling
**Then** Invalid LP, insufficient qty, wrong product show large red error messages

## Tasks / Subtasks

- [ ] Task 1: Scanner UI layout (touch-optimized)
- [ ] Task 2: Barcode scanning integration
- [ ] Task 3: Quantity input (manual or full LP)
- [ ] Task 4: Material progress tracking
- [ ] Task 5: Offline queue integration
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
