# Story 07.5 - SO Clone/Import Context Summary

**Generated:** 2025-12-18
**Location:** `/docs/2-MANAGEMENT/epics/current/07-shipping/context/07.5/`

## Overview

Comprehensive YAML context for Story 07.5 (SO Clone/Import) in the MonoPilot Shipping Epic (Epic 07). This story enables shipping clerks to clone existing sales orders and bulk-import orders from CSV, reducing manual entry time from 5 minutes per order to under 30 seconds.

## Files Created

### 1. **_index.yaml** (4.6 KB)
**Entry point for story consumption**

Contains:
- Story metadata (ID, phase, complexity, estimate)
- Dependencies (07.2 required, optional 07.4, blocks 07.7)
- Reference documents (PRD, architecture, wireframes)
- High-level deliverables (2 APIs, 2 services, 4 components, tests)
- Technical notes for developers

**Use case:** Read first to understand story scope and dependencies

### 2. **database.yaml** (14 KB)
**Schema reference and data transformation rules**

Contains:
- Table usage for `sales_orders` and `sales_order_lines` (no new tables)
- Column-by-column transformation logic for clone operation
- CSV row transformation for import grouping
- Query patterns (SELECT/INSERT) for clone and import
- Sequence management for SO number generation
- RLS policies and cascading constraints
- Data renumbering logic for sequential line numbers

**Use case:** Backend developers reference for database operations

### 3. **api.yaml** (18 KB)
**Complete API specification with contracts**

Contains:
- POST `/api/shipping/sales-orders/:id/clone` endpoint
  - Request/response schemas with examples
  - Error scenarios (400, 401, 403, 404, 500)
  - Business logic step-by-step
- POST `/api/shipping/sales-orders/import` endpoint
  - File upload (multipart form-data)
  - CSV format specs (minimal + extended columns)
  - Response with created orders + error list
  - Comprehensive error handling
- Service methods with signatures and dependencies
- Validation schemas (Zod)
- Type definitions (TypeScript interfaces)

**Use case:** Backend developers, API contract reference

### 4. **frontend.yaml** (24 KB)
**PRIMARY specification for user-facing components**

Contains:
- 4 React components with full patterns:
  - `CloneOrderDialog.tsx` - Confirmation dialog
  - `ImportOrdersDialog.tsx` - File upload + workflow
  - `ImportPreviewTable.tsx` - Validation preview
  - `ImportResultSummary.tsx` - Results display
- 2 React hooks (useCloneSalesOrder, useImportSalesOrders)
- UI integration points (SO detail + SO list pages)
- Complete UX workflows (clone + import step-by-step)
- State definitions (idle, loading, error, success)
- Accessibility specs (ARIA, keyboard nav, focus management)
- Responsive design (mobile, tablet, desktop)
- TailwindCSS classes

**Use case:** Frontend developers (PRIMARY spec for UX implementation)

### 5. **tests.yaml** (21 KB)
**Test specifications and acceptance criteria**

Contains:
- Test file list (9 test suites across unit/integration/e2e)
- 19 acceptance criteria (AC-CLONE-01 through AC-IMPORT-19)
- 30+ unit test cases (service, validation, components)
- 7 integration test cases (endpoints, database)
- 5 E2E test cases (complete workflows)
- Definition of Done (38 items)
- Coverage requirements (unit: 80%, integration: 75%)
- Output artifacts

**Use case:** QA/test writers, coverage validation

## Key Specifications

### Clone Endpoint: POST `/api/shipping/sales-orders/:id/clone`

**What it does:**
- Reads original SO + all lines (RLS-protected)
- Generates new SO number (SO-YYYY-NNNNN)
- Creates new SO with:
  - New id and order_number
  - Same customer, address, products, pricing
  - Status = draft
  - order_date = today
  - Cleared: customer_po, promised_ship_date, required_delivery_date, confirmed_at, shipped_at
  - Quantities reset (allocated, picked, packed, shipped = 0)
  - allergen_validated = false (must re-validate)
- Renumbers lines sequentially (1, 2, 3) regardless of original gaps
- Returns full cloned SO with lines

**Response:** 200 with cloned SO details or error (400/401/403/404/500)

### Import Endpoint: POST `/api/shipping/sales-orders/import`

**What it does:**
- Accepts CSV file (multipart form-data)
- Parses and validates each row:
  - customer_code exists (org-scoped)
  - product_code exists and is_finished_good (org-scoped)
  - quantity > 0
  - unit_price >= 0 (optional, defaults to product.standard_price)
  - Dates in YYYY-MM-DD format
- Groups valid rows by customer_code
- Creates one SO per unique customer
- Row-level error reporting (with line numbers)
- Continues processing valid rows even if some fail
- Returns summary: orders_created, lines_imported, errors_count, error_list

**Response:** 200 with created orders + error details or error (400/401/403/500)

## Frontend Components

### CloneOrderDialog
- Simple confirmation dialog
- Shows SO number being cloned
- Cancel/Confirm buttons
- Loading state + error handling
- Auto-close on success

### ImportOrdersDialog
- Multi-step: upload → preview → result
- File dropzone with drag-and-drop
- Format instructions + sample download
- Transitions to preview after parse

### ImportPreviewTable
- Scrollable table showing validation results
- Columns: Status (icon), Customer, Product, Qty, Unit Price, Error
- Green checkmark for valid rows
- Red X with error tooltip for invalid rows
- Import button disabled if errors exist

### ImportResultSummary
- Success/error banner
- Created order numbers list
- Error details (if any)
- View Orders button (filters by today)
- Download errors button

## Dependencies

### Required
- **Story 07.2** - Sales Orders Core CRUD (tables, services, endpoints)

### Optional
- **Story 07.4** - Line Pricing (pricing gets cloned with lines)

### Blocks
- **Story 07.7** - Inventory Allocation (cloned/imported orders can be allocated)

## Phase & Complexity

- **Phase:** 1B (Enhanced Phase 1A)
- **Complexity:** M (Medium)
- **Estimate:** 2-3 days
- **Type:** Fullstack (backend + frontend)

## Future Enhancements (Not This Story)

### Phase 2 - SO Templates
- Save SO as reusable template with name
- Store in `so_templates` table
- "Create from Template" option in wizard

### Phase 2 - Recurring Orders
- Create recurring order schedule (daily/weekly/monthly)
- Auto-generate SO on schedule
- Email notification to customer

### Epic 11 - Integrations
- EDI 850 (Purchase Order) inbound parsing
- API-based order import with OAuth
- Real-time order creation from external systems

### Phase 2 - Advanced Import
- Custom CSV field mapping
- Pre-import validation (allergen, credit limits, inventory)
- Import validation rules

## Quality Metrics

- **Unit Test Coverage:** 80%+ (clone logic, CSV validation)
- **Integration Test Coverage:** 75%+ (API endpoints, database)
- **E2E Test Coverage:** 70%+ (complete workflows)
- **Acceptance Criteria:** 19 items (all must pass)
- **Definition of Done:** 38 items (all must complete)

## File Structure

```
docs/2-MANAGEMENT/epics/current/07-shipping/context/07.5/
├── _index.yaml              # Entry point (story metadata)
├── database.yaml            # Schema + transformations
├── api.yaml                 # Endpoint specs + types
├── frontend.yaml            # Components + UX (PRIMARY)
├── tests.yaml               # Test specs + acceptance criteria
└── CONTEXT-SUMMARY.md       # This file
```

## For Developers

### Backend Developers
1. Read `_index.yaml` for overview
2. Review `database.yaml` for schema operations
3. Implement endpoints from `api.yaml` specs
4. Follow `tests.yaml` for acceptance criteria

### Frontend Developers
1. Read `_index.yaml` for overview
2. Use `frontend.yaml` (PRIMARY spec) as development guide
3. Implement components with provided patterns
4. Reference `api.yaml` for endpoint contracts
5. Follow `tests.yaml` for test requirements

### QA/Test Writers
1. Read all context files for complete understanding
2. Use `tests.yaml` for test plan
3. Implement unit/integration/E2E tests
4. Verify all 19 acceptance criteria pass

## Links to Related Documents

- **PRD:** `docs/1-BASELINE/product/modules/shipping.md` (FR-7.14, FR-7.20)
- **Architecture:** `docs/1-BASELINE/architecture/modules/shipping.md` (lines 382-405)
- **Story MD:** `docs/2-MANAGEMENT/epics/current/07-shipping/07.5.so-clone-import.md`
- **Wireframe SHIP-006:** `docs/3-ARCHITECTURE/ux/wireframes/SHIP-006-sales-order-create.md`
- **Wireframe SHIP-007:** `docs/3-ARCHITECTURE/ux/wireframes/SHIP-007-sales-order-detail.md`

## Notes

- **Multi-tenancy:** All operations respect org_id via RLS (org isolation guaranteed)
- **Permissions:** SALES, MANAGER, ADMIN, SUPER_ADMIN roles required
- **Error Handling:** Row-level validation for import (continue on partial failures)
- **Allergen Reset:** Cloned/imported SOs must have allergen_validated = false (re-validated in 07.6)
- **Line Renumbering:** Clone always renumbers lines sequentially regardless of gaps
- **CSV Format:** Supports both minimal (4 cols) and extended (8 cols) formats

---

**Status:** Ready for Implementation
**Approval:** Pending
**Generated:** 2025-12-18
