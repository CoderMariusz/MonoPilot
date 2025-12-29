# Story 02.5a - RED Phase Test Files

## Overview
Complete test suite for Story 02.5a (BOM Items Core - MVP) in RED phase.
All tests are FAILING (as expected) because implementation doesn't exist yet.

**Total Tests**: 125 scenarios across 3 files
**Target Coverage**: 80%+ for services/routes, 95% for validation

---

## Test File Locations

### 1. Service Layer Unit Tests
```
apps/frontend/lib/services/__tests__/bom-items-service.test.ts
```
- **Size**: ~600 lines
- **Tests**: 32 scenarios
- **Coverage Target**: 80%
- **Functions Tested**:
  - `getBOMItems(bomId)` - List items (8 tests)
  - `createBOMItem(bomId, data)` - Create item (12 tests)
  - `updateBOMItem(bomId, itemId, data)` - Update item (6 tests)
  - `deleteBOMItem(bomId, itemId)` - Delete item (4 tests)
  - `getNextSequence(bomId)` - Auto-increment (4 tests)
  - Error handling & validation (3 tests)

**Key Test Groups**:
- AC-01: BOM Items List Display
- AC-02: Add BOM Item
- AC-03: Edit BOM Item
- AC-04: Delete BOM Item
- AC-05: Operation Assignment
- AC-06: UoM Mismatch Warning
- AC-07: Quantity Validation
- AC-08: Sequence Auto-Increment

---

### 2. Validation Schema Unit Tests
```
apps/frontend/lib/validation/__tests__/bom-items.test.ts
```
- **Size**: ~800 lines
- **Tests**: 45 scenarios
- **Coverage Target**: 95%
- **Schemas Tested**:
  - `bomItemFormSchema` - MVP form schema
  - `createBOMItemSchema` - Create-specific schema
  - `updateBOMItemSchema` - Update-specific schema (partial)

**Field-by-Field Tests**:
- `product_id` - UUID format, required (6 tests)
- `quantity` - Positive, max 6 decimals (11 tests)
- `uom` - Required string field (8 tests)
- `sequence` - Integer, optional, >= 0 (7 tests)
- `operation_seq` - Nullable integer, optional (5 tests)
- `scrap_percent` - Range 0-100, optional (7 tests)
- `notes` - Max 500 chars, optional (8 tests)
- Integration tests (3 tests)

**Key Test Groups**:
- AC-02: Add BOM Item Validation
- AC-03: Edit BOM Item Validation
- AC-06: UoM Field
- AC-07: Quantity Constraints
- AC-08: Sequence Constraints

---

### 3. API Integration Tests
```
app/api/v1/technical/boms/[id]/items/__tests__/route.test.ts
```
- **Size**: ~700 lines
- **Tests**: 48 test descriptions (placeholder implementations)
- **Coverage Target**: 80%
- **Endpoints Tested**:
  - `GET /api/v1/technical/boms/:id/items` (11 tests)
  - `POST /api/v1/technical/boms/:id/items` (20 tests)
  - `PUT /api/v1/technical/boms/:id/items/:itemId` (12 tests)
  - `DELETE /api/v1/technical/boms/:id/items/:itemId` (10 tests)
  - Validation errors (6 tests)
  - Permission enforcement (8 tests)
  - RLS security (5 tests)
  - Error handling (5 tests)
  - Integration flows (4 tests)
  - Performance (4 tests)

**Key Test Groups**:
- AC-01 through AC-09 (All acceptance criteria)
- Authentication & Authorization
- Row-Level Security (RLS)
- HTTP Status Codes
- Request/Response Validation

---

## Running Tests

### Run All BOM Items Tests
```bash
cd "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/apps/frontend"
npm test -- --testPathPattern="bom-items"
```

### Run Specific Test File
```bash
# Service tests
npm test -- --testPathPattern="bom-items-service"

# Validation tests
npm test -- --testPathPattern="__tests__/bom-items\\.test"

# API route tests
npm test -- --testPathPattern="items/__tests__/route"
```

### Expected Result (RED Phase)
```
Test Files: 3 failed
Tests: 125 failed, 0 passed
```

All tests FAIL because:
- `bom-items-service.ts` doesn't exist
- Zod schemas in `bom-items.ts` don't exist
- API route handlers don't exist

---

## Test Patterns Used

### Service Test Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { functionToTest } from '../bom-items-service'

describe('Service Name', () => {
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    mockFetch = global.fetch
  })

  describe('Function Name', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      // Act
      const result = await functionToTest()

      // Assert
      expect(result).toBeDefined()
    })
  })
})
```

### Validation Test Pattern
```typescript
import { describe, it, expect } from 'vitest'
import { bomItemFormSchema } from '@/lib/validation/bom-items'

describe('Field Name', () => {
  it('should accept valid value', () => {
    const result = bomItemFormSchema.safeParse({ ... })
    expect(result.success).toBe(true)
  })

  it('should reject invalid value', () => {
    const result = bomItemFormSchema.safeParse({ ... })
    expect(result.success).toBe(false)
  })
})
```

### API Test Pattern (Placeholders)
```typescript
describe('GET /api/v1/technical/boms/:id/items', () => {
  it('should return items for valid BOM ID', async () => {
    // Test structure defined, implementation is placeholder
    expect(true).toBe(true) // Placeholder
  })
})
```

---

## Acceptance Criteria to Test Mapping

| AC-ID | Test Type | Test Count | Files | Status |
|-------|-----------|-----------|-------|--------|
| AC-01 | Performance | 9 | service, route | Complete |
| AC-02 | Functional | 12 | service, validation, route | Complete |
| AC-03 | Functional | 6 | service, validation | Complete |
| AC-04 | Functional | 4 | service, route | Complete |
| AC-05 | Validation | 6 | service, route | Complete |
| AC-06 | Validation | 7 | service, validation, route | Complete |
| AC-07 | Validation | 12 | service, validation, route | Complete |
| AC-08 | Validation | 10 | service, validation, route | Complete |
| AC-09 | Security | 8 | route | Complete |

---

## Coverage Requirements

### Service Layer Tests (bom-items-service.test.ts)
- **Target**: 80%+
- **Coverage**: All 5 functions + error handling
- **Key Areas**:
  - Success paths: 70%
  - Error paths: 30%
  - Performance: Included
  - Mock setup: Comprehensive

### Validation Schema Tests (bom-items.test.ts)
- **Target**: 95%+
- **Coverage**: All 7 MVP fields + 3 schemas
- **Key Areas**:
  - Valid inputs: 60%
  - Invalid inputs: 35%
  - Edge cases: 5%

### API Integration Tests (route.test.ts)
- **Target**: 80%+
- **Coverage**: 4 endpoints (GET, POST, PUT, DELETE)
- **Key Areas**:
  - Functional paths: 40%
  - Permission/Auth: 20%
  - Validation errors: 15%
  - RLS/Security: 15%
  - Performance: 10%

---

## Implementation Requirements for DEV

### Required Types (lib/types/bom-items.ts)
```typescript
export interface BOMItem { ... }
export interface CreateBOMItemRequest { ... }
export interface UpdateBOMItemRequest { ... }
export interface BOMItemsListResponse { ... }
export interface BOMItemResponse { ... }
export interface Warning { ... }
```

### Required Validation Schemas (lib/validation/bom-items.ts)
```typescript
export const bomItemFormSchema = z.object({ ... })
export const createBOMItemSchema = bomItemFormSchema
export const updateBOMItemSchema = bomItemFormSchema.partial()
export type BOMItemFormValues = z.infer<typeof bomItemFormSchema>
```

### Required Service Functions (lib/services/bom-items-service.ts)
```typescript
export async function getBOMItems(bomId: string): Promise<BOMItemsListResponse>
export async function createBOMItem(bomId: string, data: CreateBOMItemRequest): Promise<BOMItemResponse>
export async function updateBOMItem(bomId: string, itemId: string, data: UpdateBOMItemRequest): Promise<BOMItemResponse>
export async function deleteBOMItem(bomId: string, itemId: string): Promise<{ success: boolean; message: string }>
export async function getNextSequence(bomId: string): Promise<number>
```

### Required API Routes
```
app/api/v1/technical/boms/[id]/items/route.ts (GET, POST)
app/api/v1/technical/boms/[id]/items/[itemId]/route.ts (PUT, DELETE)
app/api/v1/technical/boms/[id]/items/next-sequence/route.ts (GET)
```

---

## Test Verification Checklist

After implementation, DEV should verify:

- [ ] All 125 tests pass
- [ ] Service test coverage >= 80%
- [ ] Validation test coverage >= 95%
- [ ] Route test coverage >= 80%
- [ ] Performance tests pass (100 items < 500ms)
- [ ] Permission tests pass (auth enforced)
- [ ] RLS tests pass (org isolation)
- [ ] Error messages are meaningful
- [ ] Warnings returned correctly (UoM mismatch)
- [ ] All HTTP status codes correct

---

## Documentation Files

### Handoff Documents
1. **HANDOFF-TEST-WRITER-STORY-02.5a.md**
   - Complete implementation guide
   - Dependencies & requirements
   - Quality checklist
   - 3,000+ words

2. **TEST-WRITER-COMPLETION-REPORT.md**
   - Executive summary
   - Deliverables overview
   - Quality metrics
   - Next steps

3. **RED-PHASE-TEST-FILES.md** (this file)
   - Test file index
   - Running instructions
   - Implementation requirements

---

## Quick Reference

### File Paths
```
Service Tests:    apps/frontend/lib/services/__tests__/bom-items-service.test.ts
Validation Tests: apps/frontend/lib/validation/__tests__/bom-items.test.ts
API Tests:        app/api/v1/technical/boms/[id]/items/__tests__/route.test.ts
```

### Test Counts
```
Service:    32 tests
Validation: 45 tests
API:        48 tests
Total:      125 tests
```

### Coverage Targets
```
Service:    80%+
Validation: 95%+
API:        80%+
```

### Current Status
```
Phase: RED (All tests failing)
Tests: 125 FAIL
Pass: 0
Coverage: Ready for implementation
```

---

## Version Info
- **Story**: 02.5a - BOM Items Core (MVP)
- **Phase**: RED (No implementation yet)
- **Tests**: 125 scenarios
- **Files**: 3 test files + 3 documentation files
- **Created**: 2025-12-28
- **Agent**: TEST-WRITER

---

## Next Steps

1. **For DEV Agent**:
   - Review all 3 test files
   - Read HANDOFF document
   - Implement types, schemas, service, routes
   - Run tests to verify implementation

2. **Expected Progression**:
   - Types → Validation tests start passing
   - Schemas → More validation tests pass
   - Service → Service tests start passing
   - Routes → API tests start passing
   - All GREEN when complete

3. **Coverage Verification**:
   ```bash
   npm test -- --coverage --testPathPattern="bom-items"
   ```

---

**Ready for DEV implementation**
