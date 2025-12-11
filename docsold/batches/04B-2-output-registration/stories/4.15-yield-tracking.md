# Story 4.15: Yield Tracking

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As a** Production Manager
**I want** to see yield metrics
**So that** I can identify efficiency issues

## Acceptance Criteria

### AC-4.15.1: Yield Summary Display
**Given** viewing WO detail
**When** in_progress or completed
**Then** see yield summary:
- Output Yield: actual_output / planned × 100%
- Material Yield: planned_material / consumed × 100%
- Operation Yields: from each operation

### AC-4.15.2: Color Coding
**Then** Color coded:
- 🟢 Green: >= 95%
- 🟡 Yellow: 80-95%
- 🔴 Red: < 80%

### AC-4.15.3: Calculation Logic
- Output Yield = (actual_output_qty / wo.quantity) × 100% (if wo.quantity = 0, yield = N/A)
- Material Yield = (wo_materials.required_qty / wo_materials.consumed_qty) × 100% (if consumed_qty = 0, yield = 0%)
- Operation Yield = (operation.actual_yield_percent) (default 0% if not recorded)

### AC-4.15.4: API Endpoint
**Then** GET /api/production/work-orders/:id/yield returns:
```json
{
  "output_yield": 87.5,
  "material_yield": 92.3,
  "operation_yields": [
    {"operation_id": "uuid", "name": "Cut", "yield": 98},
    {"operation_id": "uuid", "name": "Mix", "yield": 85}
  ]
}
```

### AC-4.15.5: Efficiency Dashboard
**Then** Yield metrics appear on production dashboard (Story 4.1) KPIs

### AC-4.15.6: Warnings
**When** yield < 80%
**Then** warning indicator on dashboard

### AC-4.15.7: Variance Analysis
**Then** Track variance: target (95%) vs actual

### AC-4.15.8: Prerequisites
**Then** Requires Stories 4.5, 4.12 (operation and output completion)

## Tasks / Subtasks

- [ ] Task 1: Yield calculation logic
- [ ] Task 2: API endpoint
- [ ] Task 3: Frontend yield summary component
- [ ] Task 4: Color coding based on thresholds
- [ ] Task 5: Dashboard KPI integration
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
