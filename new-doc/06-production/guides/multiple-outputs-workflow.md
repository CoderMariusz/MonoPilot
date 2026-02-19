# Multiple Outputs per Work Order Guide

**Story:** 04.7d - Multiple Outputs per WO
**Status:** DEPLOYED
**Module:** Production
**PRD Reference:** FR-PROD-015
**Last Updated:** 2026-01-21

## Overview

This guide covers the multiple outputs feature for work orders in MonoPilot. This feature allows production operators to register multiple output batches for a single work order, with cumulative tracking and automatic progress calculation.

## Key Concepts

### Multiple Outputs per WO

A single work order can produce multiple license plates (LPs), each representing a batch of finished product. The system:

- Creates a unique LP for each output registration
- Aggregates output quantities to calculate overall progress
- Excludes by-products from the main output total
- Supports over-production (>100% of planned quantity)

### Progress Tracking

Progress is calculated as:

```
progress_percent = (output_qty / planned_qty) * 100
```

Where:
- `output_qty` is the sum of all non-by-product outputs
- `planned_qty` is the work order's target quantity

### Auto-Complete Behavior

When the organization's production setting `auto_complete_wo` is enabled:
- Work order status automatically changes to `completed` when `output_qty >= planned_qty`
- The `completed_at` timestamp is set automatically
- A notification toast displays "Work order completed"

When disabled, manual completion is required even after reaching 100%.

## User Workflows

### Registering Multiple Outputs

1. Navigate to Production > Work Orders
2. Select an in-progress work order
3. Click "Register Output"
4. Enter output details:
   - Quantity (must be > 0)
   - QA Status (Approved/Pending/Rejected)
   - Location
   - Notes (optional)
5. Submit to create a new LP

Each registration:
- Creates a unique license plate
- Updates the WO's cumulative `output_qty`
- Refreshes the progress display

### Viewing Output History

The Output History table displays all registered outputs with:
- LP Number (links to LP detail)
- Quantity with UoM
- Batch Number
- QA Status (color-coded badge)
- Location
- Expiry Date
- Created timestamp (relative + absolute)
- Created by user
- Actions (View LP, Print Label)

#### Filtering

Filter outputs by:
- **QA Status**: All, Approved, Pending, Rejected
- **Location**: All locations or specific warehouse zone

#### Sorting

Click column headers to sort by:
- LP Number
- Quantity
- Batch Number
- QA Status
- Location
- Expiry Date
- Created At (default: descending)

### Understanding Progress Display

The progress card shows:

```
+---------------------------------------------+
| Output Progress                      64.0%  |
+---------------------------------------------+
| Planned: 5,000 kg                           |
| Output:  3,200 kg                           |
| Remaining: 1,800 kg                         |
+---------------------------------------------+
| [=============================-----]        |
| 3 outputs registered          [in_progress] |
+---------------------------------------------+
```

#### Progress Bar Colors

| Progress | Color |
|----------|-------|
| 0-49% | Light blue |
| 50-79% | Medium blue |
| 80-99% | Blue |
| 100%+ | Green |

#### Over-Production Indicator

When output exceeds planned quantity:

```
+---------------------------------------------+
| Output Progress                     120.0%  |
+---------------------------------------------+
| Planned: 1,000 kg                           |
| Output:  1,200 kg                           |
| Remaining: 0 kg                             |
+---------------------------------------------+
| [=====================================]      |
| Over-production: 20.0% above planned        |
+---------------------------------------------+
```

## API Reference

### Get Outputs List

```http
GET /api/production/work-orders/:id/outputs
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (min: 1) |
| limit | number | 20 | Items per page (max: 100) |
| qa_status | string | - | Filter: approved, pending, rejected |
| location_id | uuid | - | Filter by location ID |
| sort | string | created_at | Sort: created_at, qty, lp_number |
| order | string | desc | Order: asc, desc |

**Response:**

```json
{
  "data": {
    "outputs": [
      {
        "id": "uuid",
        "lp_id": "uuid",
        "lp_number": "LP-05482",
        "quantity": 500,
        "uom": "kg",
        "batch_number": "B-0156",
        "qa_status": "approved",
        "location_id": "uuid",
        "location_name": "WH-A/Z1",
        "expiry_date": "2026-01-13",
        "created_at": "2026-01-21T14:30:00Z",
        "created_by_name": "John Smith",
        "notes": null,
        "is_by_product": false
      }
    ],
    "summary": {
      "total_outputs": 3,
      "total_qty": 1000,
      "approved_count": 2,
      "approved_qty": 700,
      "pending_count": 1,
      "pending_qty": 300,
      "rejected_count": 0,
      "rejected_qty": 0
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "total_pages": 1
    }
  }
}
```

### Get WO Progress

```http
GET /api/production/work-orders/:id/progress
```

**Response:**

```json
{
  "data": {
    "wo_id": "uuid",
    "wo_number": "WO-2026-0001",
    "planned_qty": 1000,
    "output_qty": 700,
    "progress_percent": 70,
    "remaining_qty": 300,
    "outputs_count": 2,
    "is_complete": false,
    "auto_complete_enabled": true,
    "status": "in_progress"
  }
}
```

## React Hooks

### useWOProgress

Fetches WO progress data with automatic refresh.

```tsx
import { useWOProgress } from '@/lib/hooks/use-wo-progress';

function ProgressDisplay({ woId }) {
  const { progress, isLoading, error, refetch } = useWOProgress(woId);

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error} />;

  return (
    <OutputProgressCard
      progress={progress}
      uom="kg"
    />
  );
}
```

**Options:**
- `staleTime`: 10 seconds (for real-time updates)
- `refetchOnWindowFocus`: true

### useWOOutputs

Fetches paginated outputs with filtering and sorting.

```tsx
import { useWOOutputs } from '@/lib/hooks/use-wo-outputs';

function OutputsList({ woId }) {
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

  // Apply QA filter
  const handleFilterChange = (qaStatus: string) => {
    setFilters({ qa_status: qaStatus === 'all' ? undefined : qaStatus });
  };

  // Change page
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return (
    <OutputHistoryTable
      outputs={outputs}
      summary={summary}
      onRegisterOutput={() => openModal()}
      onExportCSV={() => exportOutputs()}
      onViewLP={(lpId) => navigate(`/warehouse/lps/${lpId}`)}
      onPrintLabel={(lpId) => printLabel(lpId)}
    />
  );
}
```

## Components

### OutputProgressCard

Displays WO progress with visual indicators.

```tsx
import { OutputProgressCard } from '@/components/production/outputs';

<OutputProgressCard
  progress={progressData}
  isLoading={false}
  uom="kg"
  className="mb-4"
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| progress | WOProgressResponse | Yes | Progress data from API |
| isLoading | boolean | No | Shows skeleton when true |
| uom | string | No | Unit of measure (default: "kg") |
| className | string | No | Additional CSS classes |

**Data Attributes:**

| Attribute | Element |
|-----------|---------|
| `data-testid="output-progress-card"` | Card container |
| `data-testid="planned-qty"` | Planned quantity display |
| `data-testid="output-qty"` | Output quantity display |
| `data-testid="remaining-qty"` | Remaining quantity display |
| `data-testid="progress-percent"` | Percentage display |
| `data-testid="progress-bar"` | Progress bar element |
| `data-testid="over-production-message"` | Over-production indicator |
| `data-testid="complete-badge"` | Complete status badge |
| `data-testid="auto-complete-badge"` | Auto-complete indicator |
| `data-testid="wo-status"` | WO status badge |

### OutputHistoryTable

Table displaying output history with filtering and actions.

```tsx
import { OutputHistoryTable } from '@/components/production/outputs';

<OutputHistoryTable
  outputs={outputs}
  summary={summary}
  onRegisterOutput={() => setModalOpen(true)}
  onExportCSV={() => downloadCSV()}
  onViewLP={(lpId) => router.push(`/warehouse/lps/${lpId}`)}
  onPrintLabel={(lpId) => printService.print(lpId)}
  uom="kg"
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| outputs | OutputLP[] | Yes | List of output records |
| summary | OutputSummary | Yes | Summary statistics |
| onRegisterOutput | () => void | Yes | Open registration modal |
| onExportCSV | () => void | Yes | Export outputs to CSV |
| onViewLP | (lpId: string) => void | Yes | Navigate to LP detail |
| onPrintLabel | (lpId: string) => void | Yes | Print LP label |
| uom | string | No | Unit of measure (default: "kg") |

### OutputsSummary

Summary card with aggregate statistics.

```tsx
import { OutputsSummary } from '@/components/production/outputs';

<OutputsSummary
  summary={summaryData}
  uom="kg"
  isLoading={false}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| summary | OutputsSummary | Yes | Summary statistics |
| uom | string | No | Unit of measure (default: "kg") |
| isLoading | boolean | No | Shows skeleton when true |
| className | string | No | Additional CSS classes |

**Data Attributes:**

| Attribute | Element |
|-----------|---------|
| `data-testid="outputs-summary"` | Card container |
| `data-testid="stat-total"` | Total outputs stat |
| `data-testid="stat-approved"` | Approved outputs stat |
| `data-testid="stat-pending"` | Pending outputs stat |
| `data-testid="stat-rejected"` | Rejected outputs stat |

## Service Layer

### OutputAggregationService

Location: `lib/services/output-aggregation-service.ts`

```typescript
import {
  calculateProgress,
  getOutputsForWO,
  getOutputsSummary,
  getWOProgress,
  OutputAggregationService,
} from '@/lib/services/output-aggregation-service';

// Calculate progress percentage
const percent = calculateProgress(outputQty, plannedQty);

// Get paginated outputs
const result = await getOutputsForWO(woId, {
  page: 1,
  limit: 20,
  qa_status: 'approved',
});

// Get summary only
const summary = await getOutputsSummary(woId);

// Get full progress data
const progress = await getWOProgress(woId);
```

### Key Functions

**calculateProgress(outputQty, plannedQty)**
- Returns 0 if plannedQty <= 0
- Returns 0 if outputQty <= 0
- Returns percentage rounded to 2 decimal places
- Allows values > 100 for over-production

**getOutputsForWO(woId, options)**
- Fetches outputs with joins to license_plates, locations, users
- Excludes by-products (is_by_product = false)
- Returns paginated list with summary

**getOutputsSummary(woId)**
- Calculates aggregate statistics by QA status
- Excludes by-products from totals

**getWOProgress(woId)**
- Fetches WO data with settings
- Calculates progress and remaining quantity
- Includes auto_complete_enabled flag

## Validation

### Output Query Schema

Location: `lib/validation/production-schemas.ts`

```typescript
import { outputQuerySchema } from '@/lib/validation/production-schemas';

// Validate query parameters
const result = outputQuerySchema.safeParse({
  page: '1',
  limit: '20',
  qa_status: 'approved',
  sort: 'created_at',
  order: 'desc',
});

if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors);
}
```

**Schema Rules:**

| Field | Type | Validation |
|-------|------|------------|
| page | number | min: 1, default: 1 |
| limit | number | min: 1, max: 100, default: 20 |
| qa_status | enum | approved, pending, rejected |
| location_id | uuid | Valid UUID format |
| sort | enum | created_at, qty, lp_number |
| order | enum | asc, desc |

## Database Considerations

### Output Aggregation

The `work_orders.output_qty` column stores the cumulative sum of non-by-product outputs. This value is updated by database triggers when:

- A new output is registered (INSERT)
- An output quantity is modified (UPDATE)
- An output is deleted (DELETE)

The trigger function `update_wo_output_qty()` calculates:

```sql
SELECT COALESCE(SUM(quantity), 0)
FROM production_outputs
WHERE wo_id = :woId
AND is_by_product = false;
```

### Auto-Complete Trigger

When `output_qty` is updated, the `check_wo_auto_complete()` function:

1. Checks if `auto_complete_wo` setting is enabled
2. Verifies output_qty >= planned_qty
3. Updates status to 'completed' if conditions met
4. Sets `completed_at` timestamp

### Index for Performance

```sql
CREATE INDEX idx_production_outputs_wo_active
ON production_outputs(wo_id, is_by_product)
WHERE is_by_product = false;
```

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| Unauthorized | 401 | Authentication required |
| Not Found | 404 | Work order not found or not in user's org |
| Bad Request | 400 | Invalid query parameters |
| Internal Server Error | 500 | Unexpected server error |

## Best Practices

1. **Refresh after registration**: Call `refetch()` after registering new output to update progress
2. **Handle over-production**: Allow users to continue producing even at >100%
3. **Check auto-complete**: Verify auto_complete_enabled before expecting automatic status change
4. **Filter by QA status**: Use filters to focus on pending items for review
5. **Export for reporting**: Use CSV export for external analysis

## Related Documentation

- [Output Registration Desktop](./output-registration-desktop.md) (04.7a)
- [By-Product Registration](./by-product-registration.md) (04.7c)
- [Material Consumption Components](./consumption-components.md)
- [Production PRD](../../1-BASELINE/product/modules/production.md)

---

**Last Updated:** 2026-01-21
**Story Status:** DEPLOYED
**Tests:** 112/114 passing
**AC Coverage:** 5/5 (100%)
