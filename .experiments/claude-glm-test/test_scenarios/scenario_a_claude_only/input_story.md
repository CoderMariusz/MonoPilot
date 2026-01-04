# Story 05.5 - LP Search + Advanced Filters (VALIDATION SCHEMA)

**Epic**: 05-Warehouse
**Complexity**: M
**Task**: Rozszerz validation schema `lpQuerySchema` o zaawansowane filtry

## 📝 Description

Extend existing `lpQuerySchema` (Zod) with advanced search and filter parameters for License Plate list endpoint.

**Current schema** (from Story 05.1):
- Basic filters: search, product_id, warehouse_id, location_id, status, qa_status
- Pagination: page, limit, sort, order

**Required additions**:
- Array filters: product_ids[], location_ids[], statuses[], qa_statuses[]
- Batch search: batch_number
- Date ranges: expiry_before, expiry_after, created_before, created_after
- Validation: expiry_before >= expiry_after

## ✅ Acceptance Criteria

### AC-1: Array Filters
- [ ] `product_ids` accepts array of UUIDs (comma-separated)
- [ ] `location_ids` accepts array of UUIDs
- [ ] `statuses` accepts array of LP status enums
- [ ] `qa_statuses` accepts array of QA status enums
- [ ] If both single (e.g. product_id) and array (e.g. product_ids) provided, validation passes (array takes precedence in implementation)

### AC-2: Date Range Filters
- [ ] `expiry_before` validates YYYY-MM-DD format
- [ ] `expiry_after` validates YYYY-MM-DD format
- [ ] `created_before` validates datetime ISO format
- [ ] `created_after` validates datetime ISO format
- [ ] Custom refinement: expiry_before must be >= expiry_after

### AC-3: Batch Search
- [ ] `batch_number` accepts string, max 100 chars

### AC-4: Enhanced Sort Options
- [ ] `sort` enum extended with: 'batch_number'
- [ ] Keep existing: 'lp_number', 'created_at', 'expiry_date', 'quantity'

### AC-5: Pagination Limit
- [ ] `limit` max value is 200 (enforced by Zod)

## 📋 Technical Requirements

### Schema Structure

```typescript
export const lpQuerySchema = z.object({
  // Search
  search: z.string().min(2, "Search term must be at least 2 characters").optional(),
  batch_number: z.string().max(100).optional(),

  // Single filters (existing)
  product_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  status: lpStatusEnum.optional(),
  qa_status: qaStatusEnum.optional(),

  // NEW: Array filters
  product_ids: z.array(z.string().uuid()).optional(),
  location_ids: z.array(z.string().uuid()).optional(),
  statuses: z.array(lpStatusEnum).optional(),
  qa_statuses: z.array(qaStatusEnum).optional(),

  // NEW: Date range filters
  expiry_before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  expiry_after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  created_before: z.string().datetime().optional(),
  created_after: z.string().datetime().optional(),

  // Sort & pagination (enhanced)
  sort: z.enum(['lp_number', 'created_at', 'expiry_date', 'quantity', 'batch_number']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
}).refine(
  (data) => {
    if (data.expiry_before && data.expiry_after) {
      return new Date(data.expiry_before) >= new Date(data.expiry_after);
    }
    return true;
  },
  {
    message: "expiry_before must be greater than or equal to expiry_after",
    path: ["expiry_before"],
  }
);
```

### Enum Definitions (assume already exist):

```typescript
// From existing code
const lpStatusEnum = z.enum(['available', 'reserved', 'consumed', 'blocked']);
const qaStatusEnum = z.enum(['pending', 'passed', 'failed', 'quarantine']);
```

## 🎯 Task

**Write the complete extended `lpQuerySchema` following:**
1. MonoPilot Zod validation patterns
2. All field requirements from spec
3. Custom refinement for date range
4. Clear error messages
5. TypeScript type inference support

## 📚 Context Files

See `context_files/`:
- `existing-validation-pattern.ts` - Przykład istniejącego schematu Zod z MonoPilot
- `api-spec.yaml` - Pełna specyfikacja wszystkich parametrów
- `patterns.md` - Wzorce walidacji Zod w projekcie
