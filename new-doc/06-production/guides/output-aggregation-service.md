# Output Aggregation Service Guide

**Story:** 04.7d - Multiple Outputs per WO
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

The Output Aggregation Service handles cumulative output tracking for work orders. It provides progress calculation, output retrieval with filtering, and summary statistics.

## Service Location

```
apps/frontend/lib/services/output-aggregation-service.ts
```

## TypeScript Types

### OutputQueryOptions

```typescript
interface OutputQueryOptions {
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 20, max: 100)
  qa_status?: QAStatus; // Filter by QA status
  location_id?: string; // Filter by location UUID
  sort?: 'created_at' | 'qty' | 'lp_number'; // Sort column
  order?: 'asc' | 'desc'; // Sort direction
}
```

### OutputItem

```typescript
interface OutputItem {
  id: string;
  lp_id: string;
  lp_number: string;
  quantity: number;
  uom: string;
  batch_number: string;
  qa_status: QAStatus | null;
  location_id: string | null;
  location_name: string | null;
  expiry_date: string | null;
  created_at: string;
  created_by_name: string | null;
  notes: string | null;
  is_by_product: boolean;
}

type QAStatus = 'approved' | 'pending' | 'rejected';
```

### OutputsSummary

```typescript
interface OutputsSummary {
  total_outputs: number;    // Count of all outputs
  total_qty: number;        // Sum of all quantities
  approved_count: number;   // Count with QA approved
  approved_qty: number;     // Sum of approved quantities
  pending_count: number;    // Count with QA pending
  pending_qty: number;      // Sum of pending quantities
  rejected_count: number;   // Count with QA rejected
  rejected_qty: number;     // Sum of rejected quantities
}
```

### Pagination

```typescript
interface Pagination {
  page: number;        // Current page
  limit: number;       // Items per page
  total: number;       // Total items
  total_pages: number; // Total pages
}
```

### OutputsListResponse

```typescript
interface OutputsListResponse {
  outputs: OutputItem[];
  summary: OutputsSummary;
  pagination: Pagination;
}
```

### WOProgressResponse

```typescript
interface WOProgressResponse {
  wo_id: string;
  wo_number: string;
  planned_qty: number;
  output_qty: number;
  progress_percent: number;
  remaining_qty: number;
  outputs_count: number;
  is_complete: boolean;
  auto_complete_enabled: boolean;
  status: string;
}
```

## Functions

### calculateProgress

Calculates progress percentage from output and planned quantities.

```typescript
function calculateProgress(outputQty: number, plannedQty: number): number
```

**Parameters:**
- `outputQty` - Current total output quantity
- `plannedQty` - Work order planned quantity

**Returns:** Progress percentage (0-100+, allows over-production)

**Examples:**

```typescript
import { calculateProgress } from '@/lib/services/output-aggregation-service';

// Partial completion
calculateProgress(400, 1000);  // Returns: 40

// Complete
calculateProgress(1000, 1000); // Returns: 100

// Over-production
calculateProgress(1200, 1000); // Returns: 120

// Edge cases
calculateProgress(0, 1000);    // Returns: 0
calculateProgress(100, 0);     // Returns: 0
```

**Implementation:**

```typescript
export function calculateProgress(outputQty: number, plannedQty: number): number {
  if (plannedQty <= 0) return 0;
  if (outputQty <= 0) return 0;

  const progress = (outputQty / plannedQty) * 100;
  // Round to 2 decimal places
  return Math.round(progress * 100) / 100;
}
```

### getOutputsForWO

Retrieves paginated outputs for a work order with filtering.

```typescript
async function getOutputsForWO(
  woId: string,
  options?: OutputQueryOptions
): Promise<OutputsListResponse>
```

**Parameters:**
- `woId` - Work order UUID
- `options` - Query options (page, limit, filters, sort)

**Returns:** Paginated outputs with summary and pagination info

**Example:**

```typescript
import { getOutputsForWO } from '@/lib/services/output-aggregation-service';

// Default options
const result = await getOutputsForWO('wo-uuid');
console.log(result.outputs);     // OutputItem[]
console.log(result.summary);     // OutputsSummary
console.log(result.pagination);  // Pagination

// With filters
const filtered = await getOutputsForWO('wo-uuid', {
  page: 1,
  limit: 10,
  qa_status: 'approved',
  sort: 'quantity',
  order: 'desc',
});

// Filter by location
const byLocation = await getOutputsForWO('wo-uuid', {
  location_id: 'loc-uuid',
});
```

**Key Behaviors:**

1. **By-Product Exclusion**: Always excludes outputs where `is_by_product = true`
2. **Default Sort**: `created_at DESC` (most recent first)
3. **Joins**: Includes license_plates, locations, and users data
4. **Summary**: Always includes aggregate statistics

### getOutputsSummary

Calculates aggregate statistics for WO outputs.

```typescript
async function getOutputsSummary(woId: string): Promise<OutputsSummary>
```

**Parameters:**
- `woId` - Work order UUID

**Returns:** Summary with counts and quantities by QA status

**Example:**

```typescript
import { getOutputsSummary } from '@/lib/services/output-aggregation-service';

const summary = await getOutputsSummary('wo-uuid');

// Total outputs
console.log(`Total: ${summary.total_outputs} outputs, ${summary.total_qty} kg`);

// By QA status
console.log(`Approved: ${summary.approved_count} (${summary.approved_qty} kg)`);
console.log(`Pending: ${summary.pending_count} (${summary.pending_qty} kg)`);
console.log(`Rejected: ${summary.rejected_count} (${summary.rejected_qty} kg)`);
```

**Key Behaviors:**

1. **Excludes By-Products**: Only counts main product outputs
2. **QA Grouping**: Aggregates by qa_status field
3. **Total Validation**: total_qty = approved_qty + pending_qty + rejected_qty

### getWOProgress

Fetches complete progress data for a work order.

```typescript
async function getWOProgress(woId: string): Promise<WOProgressResponse>
```

**Parameters:**
- `woId` - Work order UUID

**Returns:** Full progress response with calculated fields

**Example:**

```typescript
import { getWOProgress } from '@/lib/services/output-aggregation-service';

const progress = await getWOProgress('wo-uuid');

// Display progress
console.log(`${progress.wo_number}: ${progress.progress_percent}% complete`);
console.log(`Output: ${progress.output_qty}/${progress.planned_qty}`);
console.log(`Remaining: ${progress.remaining_qty}`);

// Check completion
if (progress.is_complete) {
  console.log('Work order is complete');
}

// Check auto-complete setting
if (progress.auto_complete_enabled) {
  console.log('Auto-complete is enabled');
}
```

**Key Behaviors:**

1. **Remaining Calculation**: `Math.max(0, planned_qty - output_qty)`
2. **Outputs Count**: Counts non-by-product outputs
3. **Auto-Complete Flag**: Fetched from organization's production_settings
4. **Is Complete**: True when WO status is 'completed'

## Service Object

For compatibility, the service is also exported as an object:

```typescript
export const OutputAggregationService = {
  calculateProgress,
  getOutputsForWO,
  getOutputsSummary,
  getWOProgress,
};

// Usage
import { OutputAggregationService } from '@/lib/services/output-aggregation-service';

const progress = OutputAggregationService.calculateProgress(500, 1000);
```

## Error Handling

The service throws errors for:

1. **Database errors**: Failed queries throw with message
2. **Not found**: WO not found throws "Work order not found"

Handle errors in calling code:

```typescript
try {
  const progress = await getWOProgress(woId);
} catch (error) {
  if (error.message === 'Work order not found') {
    // Handle 404
  } else {
    // Handle other errors
  }
}
```

## Performance Considerations

### Query Optimization

1. **Pagination**: Default limit of 20 prevents large result sets
2. **Maximum limit**: 100 items per page maximum
3. **Index**: Uses `idx_production_outputs_wo_active` for filtered queries

### Caching

The React Query hooks use:
- `staleTime: 10000` (10 seconds)
- `refetchOnWindowFocus: true`

This balances real-time updates with server load.

### Summary Calculation

Summary is calculated separately from paginated list to ensure accurate totals regardless of pagination.

## Database Dependencies

### Tables Used

- `work_orders` - WO data with output_qty, planned_quantity
- `production_outputs` - Individual output records
- `license_plates` - LP details (number, batch, expiry)
- `locations` - Location names
- `users` - User names
- `production_settings` - Auto-complete setting

### Required Columns

**work_orders:**
- `id`, `wo_number`, `planned_quantity`, `output_qty`, `status`, `org_id`

**production_outputs:**
- `id`, `wo_id`, `quantity`, `uom`, `qa_status`, `location_id`, `is_by_product`, `produced_at`, `notes`, `lp_id`, `produced_by_user_id`

### Database Triggers

The service assumes these triggers maintain `work_orders.output_qty`:

1. `trg_update_wo_output_qty_insert` - Updates on INSERT
2. `trg_update_wo_output_qty_update` - Updates on UPDATE of quantity/is_by_product
3. `trg_update_wo_output_qty_delete` - Updates on DELETE

## Testing

### Unit Tests

Location: `lib/services/__tests__/output-aggregation-service.test.ts`

**Test Coverage:**

| Category | Tests | Description |
|----------|-------|-------------|
| calculateProgress | 7 | Zero, partial, complete, over-production, edge cases |
| getOutputsForWO | 8 | Pagination, filters, sorting, by-product exclusion |
| getOutputsSummary | 3 | Structure, by-product exclusion, aggregation |
| getWOProgress | 5 | Response structure, calculations, flags |
| Cumulative Tracking | 4 | First output, subsequent, 100%, over-production |

**Total:** 27 unit tests

### Running Tests

```bash
cd apps/frontend
pnpm test output-aggregation-service
```

## Integration with Hooks

### useWOProgress

```typescript
// lib/hooks/use-wo-progress.ts
import { useWOProgress } from '@/lib/hooks/use-wo-progress';

const { progress, isLoading, error, refetch } = useWOProgress(woId);
```

### useWOOutputs

```typescript
// lib/hooks/use-wo-outputs.ts
import { useWOOutputs } from '@/lib/hooks/use-wo-outputs';

const {
  outputs,
  summary,
  pagination,
  isLoading,
  error,
  refetch,
  setFilters,
  setPage,
  currentFilters,
} = useWOOutputs(woId, { limit: 10 });
```

## Related Files

| File | Purpose |
|------|---------|
| `lib/services/output-aggregation-service.ts` | Service implementation |
| `lib/hooks/use-wo-progress.ts` | Progress hook |
| `lib/hooks/use-wo-outputs.ts` | Outputs list hook |
| `lib/validation/production-schemas.ts` | Query validation |
| `app/api/production/work-orders/[id]/progress/route.ts` | Progress API |
| `app/api/production/work-orders/[id]/outputs/route.ts` | Outputs API |
| `components/production/outputs/OutputProgressCard.tsx` | Progress UI |
| `components/production/outputs/OutputHistoryTable.tsx` | Outputs table |
| `components/production/outputs/OutputsSummary.tsx` | Summary card |

---

**Last Updated:** 2026-01-21
**Story Status:** DEPLOYED
**Tests:** 27 unit tests passing
