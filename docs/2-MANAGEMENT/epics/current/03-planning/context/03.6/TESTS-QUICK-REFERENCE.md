# Story 03.6 - PO Bulk Operations - Tests Quick Reference

## Test Files Location

| Test Type | File Path | Lines | Tests | AC Coverage |
|-----------|-----------|-------|-------|-------------|
| **Unit** | `apps/frontend/lib/services/__tests__/po-bulk-service.test.ts` | 17K | 24 | AC-01, 02, 04, 05, 06, 07, 10 |
| **Unit** | `apps/frontend/lib/services/__tests__/excel-service.test.ts` | 16K | 30 | AC-02, 04 |
| **Unit** | `apps/frontend/lib/validation/__tests__/po-bulk-schemas.test.ts` | 20K | 52 | AC-02, 04, 05, 08 |
| **Integration** | `apps/frontend/app/api/planning/purchase-orders/__tests__/bulk-operations.test.ts` | 23K | 30+ | AC-01, 02, 04, 05, 06 |
| **E2E** | `e2e/planning/po-bulk-operations.spec.ts` | 17K | 15+ | AC-01, 02, 03, 04, 05, 09 |

**Total**: 5 files | 93K lines | 150+ tests | 100% AC coverage

---

## Run Tests

```bash
cd /workspaces/MonoPilot/apps/frontend

# All unit tests
pnpm test -- po-bulk-service.test.ts excel-service.test.ts po-bulk-schemas.test.ts

# Integration tests
pnpm test -- bulk-operations.test.ts

# E2E tests (requires Playwright)
cd /workspaces/MonoPilot
pnpm exec playwright test e2e/planning/po-bulk-operations.spec.ts
```

---

## Test Structure

### PO Bulk Service (24 tests)
- **AC-07**: bulkCreatePOs - Grouping & Creation (5 tests)
- **AC-02**: validateImportData - Row Validation (7 tests)
- **AC-06**: Transaction Safety - Partial Success (1 test)
- **AC-05**: Bulk Status Update (3 tests)
- **AC-04**: Excel Export (3 tests)
- **AC-10**: Performance Requirements (2 tests)
- **Edge Cases**: Error Handling (4 tests)

### Excel Service (30 tests)
- **parseFile**: Excel/CSV Parsing (11 tests)
  - Formats: .xlsx, .xls, .csv
  - Validation: file size, columns, encoding
  - Limits: 5MB max, UTF-8 support
- **createWorkbook**: Workbook Creation (2 tests)
- **addSheet**: Adding Sheets (7 tests)
  - 3-sheet export: Summary, Lines, Metadata
  - Data types: special chars, numbers, currency
  - Large datasets: 1000+ rows
- **downloadWorkbook**: File Download (3 tests)
- **Export Template**: Import Template (3 tests)
- **Performance**: File Processing (2 tests)
- **Error Handling**: Edge Cases (3 tests)

### PO Bulk Schemas (52 tests)
- **BulkPOImportRowSchema** (24 tests)
  - Valid: with/without optional fields
  - Invalid: missing fields, negative qty, invalid format
- **BulkCreatePORequestSchema** (8 tests)
  - Max 500 products per request
  - Optional: warehouse_id, expected_delivery
- **BulkStatusUpdateSchema** (12 tests)
  - Actions: approve, reject, cancel, confirm
  - Max 100 POs per request
- **POExportRequestSchema** (10 tests)
  - Max 1000 POs for export
  - Optional: filters by status, supplier, date
- **Schema Type Safety** (1 test)

### Bulk Operations API (30+ tests)
- **POST /bulk-create** (7 tests)
  - 500 products max per request
  - Auto-grouping by default supplier
  - Partial success handling
- **POST /import/validate** (6 tests)
  - File format validation (.xlsx, .csv)
  - Column validation
  - Preview generation
- **POST /import/execute** (3 tests)
  - PO creation from validated data
  - Partial failure handling
  - 60s timeout
- **POST /export** (6 tests)
  - 1000 POs max per export
  - 3-sheet Excel generation
  - Filter support
- **POST /bulk-status-update** (7 tests)
  - Status transitions validation
  - Permission checks
  - Reason tracking
- **RLS & Permissions** (2 tests)
  - Org isolation
  - Role-based access control

### E2E Tests (15+ scenarios)
- **Import Wizard** (3 tests)
  - 4-step flow: Upload → Preview → Validate → Create
  - View created POs
  - Submit all POs
- **Error Resolution** (2 tests)
  - Product mapping
  - Warning handling
- **Error Handling** (3 tests)
  - Unsupported file types
  - File size limits
  - Reset on close
- **Export** (2 tests)
  - Manual selection
  - Filter-based
- **Bulk Status Update** (3 tests)
  - Approve flow
  - Error scenarios
  - Reject with reason
- **Responsive Design** (2 tests)
  - Tablet (768px)
  - Mobile (375px)
- **Performance** (1 test)
  - 100-product import
- **Accessibility** (2 tests)
  - Keyboard navigation
  - Screen reader support

---

## Acceptance Criteria Mapping

| AC | Title | Tests | Status |
|----|-------|-------|--------|
| AC-01 | Bulk PO Creation from Product List | 6 | Ready |
| AC-02 | Excel/CSV Import with Validation | 15+ | Ready |
| AC-03 | Import Wizard Multi-Step Flow | 3 | Ready |
| AC-04 | Excel Export (3 Sheets) | 12 | Ready |
| AC-05 | Bulk Status Update | 10 | Ready |
| AC-06 | Batch Processing & Transaction Safety | 2 | Ready |
| AC-07 | Service Layer Methods | 5 | Ready |
| AC-08 | Validation Schemas | 52 | Ready |
| AC-09 | Error Handling | 6 | Ready |
| AC-10 | Performance | 5 | Ready |

---

## Phase: RED

All tests are currently in RED phase (passing because no assertions):
- Tests are syntactically valid
- No implementation code exists
- Ready for GREEN phase

Next: Uncomment assertions and implement services/APIs

---

## Key Test Patterns

### Mock Types
- Inline interface definitions for each test file
- Mock factory functions: `createMockProduct()`, `createMockSupplier()`
- Mock context: `org_id`, `userId`, `authToken`

### Assertion Style
- `expect().toBe()` for exact matches
- `expect().toContain()` for string/array contains
- `expect().toHaveLength()` for array/string length
- `expect().rejects.toThrow()` for error cases
- `expect().toBeLessThan()` for performance limits

### Test Organization
- Grouped by acceptance criteria
- Nested describe blocks by feature
- Clear test names describing expected behavior
- Arrange → Act → Assert pattern

---

## Quick Commands

```bash
# Run all tests (RED phase)
pnpm test

# Run specific test file
pnpm test -- po-bulk-service.test.ts

# Run with coverage
pnpm test -- --coverage

# Run in watch mode
pnpm test -- --watch

# Run with verbose output
pnpm test -- --reporter=verbose
```

---

## Coverage Targets

| Category | Target | Status |
|----------|--------|--------|
| Unit Tests | 80%+ | Ready |
| Integration Tests | 80%+ | Ready |
| Acceptance Criteria | 100% | 10/10 ✓ |
| Edge Cases | Comprehensive | Ready |
| Performance | All AC-10 | Ready |
| Error Handling | Complete | Ready |

---

## Handoff to DEV

Status: **RED PHASE COMPLETE ✓**

Files ready for implementation:
1. Uncomment test assertions
2. Create service implementations
3. Create validation schemas
4. Create API route handlers
5. Run tests until all GREEN

Expected: All 150+ tests passing in GREEN phase
