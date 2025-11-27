# Story 4.13: Output Registration (Scanner)

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As an** Operator
**I want** to register output via scanner
**So that** I can work efficiently

## Acceptance Criteria

### AC-4.13.1: Scanner Output Workflow
**Given** user navigates to /scanner/output
**When** scanning WO barcode
**Then** WO summary shown

### AC-4.13.2: Quantity & QA Status
**When** entering qty and selecting QA status (large buttons)
**Then** output registered, LP label printed (ZPL to printer)

### AC-4.13.3: By-Product Prompts
**When** WO has by-products
**Then** system prompts to register each (Story 4.14)

### AC-4.13.4: Label Printing
**Then** ZPL label format sent to network printer (configured in Settings)

### AC-4.13.5: Touch Optimization
**Then** Large buttons (>44px), voice feedback optional

### AC-4.13.6: Same API as Desktop
**Then** Uses same POST /api/production/work-orders/:id/outputs endpoint

### AC-4.13.7: Offline Support
**Then** Queue output operations if offline (Story 5.36)

### AC-4.13.8: Verification
**When** output registered
**Then** Green checkmark, option to continue or complete WO

## Tasks / Subtasks

- [ ] Task 1: Scanner UI layout (touch-optimized)
- [ ] Task 2: Quantity + QA status input
- [ ] Task 3: ZPL label printer integration
- [ ] Task 4: By-product prompting (Story 4.14 integration)
- [ ] Task 5: Offline queue integration
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
