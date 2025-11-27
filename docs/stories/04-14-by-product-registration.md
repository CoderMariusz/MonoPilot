# Story 4.14: By-Product Registration

**Epic:** 4 - Production Execution | **Status:** drafted | **Priority:** P0 | **Story Points:** 1 | **Effort:** 0.5 day

## User Story

**As an** Operator
**I want** to register by-products
**So that** all outputs are tracked

## Acceptance Criteria

### AC-4.14.1: By-Product Detection
**Given** WO has by-products in wo_materials (from BOM)
**When** registering main output
**Then** system prompts for each by-product

### AC-4.14.2: Expected Qty Calculation
**Then** Shows expected qty: wo_qty × yield_percent / 100

### AC-4.14.3: Qty Adjustment
**When** operator adjusts actual qty
**Then** by-product LP created with adjusted qty

### AC-4.14.4: By-Product LP Creation
**Then** By-product LP created same as main output (product, batch_number, expiry)

### AC-4.14.5: Genealogy Linking
**Then** By-product LP linked to same genealogy as main output

### AC-4.14.6: Auto-Create Option
**Given** auto_create_by_product_lp enabled
**When** main output registered
**Then** by-product LPs auto-created (no prompt)

### AC-4.14.7: API Endpoint
**Then** POST /api/production/work-orders/:id/by-products with {product_id, qty, qa_status}

### AC-4.14.8: Prerequisites
**Then** Requires Story 4.12 (Output Registration) and Story 3.10 (WO BOM snapshot with by-products)

## Tasks / Subtasks

- [ ] Task 1: By-product detection logic
- [ ] Task 2: By-product modal/form
- [ ] Task 3: LP auto-creation for by-products
- [ ] Task 4: Genealogy linking
- [ ] Task 5: Auto-create toggle (Story 4.17)
- [ ] Task 6: Tests

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
