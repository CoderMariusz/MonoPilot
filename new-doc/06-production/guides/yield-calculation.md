# Yield Calculation Guide

**Story:** 04.7a - Output Registration Desktop
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

Yield tracking measures production efficiency by comparing actual output to planned quantities. MonoPilot calculates multiple yield metrics to provide comprehensive production insights.

## Yield Types

### 1. Output Yield

Measures how much product was actually produced compared to plan.

**Formula:**
```
Output Yield (%) = (Output Quantity / Planned Quantity) * 100
```

**Example:**
- Planned: 1000 kg
- Actual Output: 950 kg
- Output Yield: 95.0%

### 2. Material Yield

Measures how efficiently materials were consumed.

**Formula:**
```
Material Yield (%) = (Planned Material / Actual Consumed) * 100
```

**Example:**
- Planned Material: 100 kg
- Actual Consumed: 110 kg
- Material Yield: 90.9% (used more than planned)

### 3. Overall Yield

Average of available yield metrics.

**Formula:**
```
Overall Yield = Average(Output Yield, Material Yield, Operation Yield)
```

## Color Thresholds (Story 04.7a)

| Yield Range | Color | Label | Interpretation |
|-------------|-------|-------|----------------|
| >= 95% | Green | Excellent | On target |
| 80-94% | Yellow | Below Target | Needs attention |
| < 80% | Red | Low Yield | Action required |

## Service Functions

**Location:** `lib/services/yield-service.ts`

### calculateOutputYield

```typescript
export function calculateOutputYield(
  outputQty: number,
  plannedQty: number
): number | null {
  // Handle zero planned qty - return null (not infinity)
  if (plannedQty === 0) {
    return null;
  }

  const yieldPercent = (outputQty / plannedQty) * 100;
  // Round to 1 decimal place
  return Math.round(yieldPercent * 10) / 10;
}

// Examples:
calculateOutputYield(950, 1000)  // Returns 95.0
calculateOutputYield(1050, 1000) // Returns 105.0 (over-production)
calculateOutputYield(0, 1000)    // Returns 0.0
calculateOutputYield(100, 0)     // Returns null
```

### calculateMaterialYield

```typescript
export function calculateMaterialYield(
  plannedMaterial: number,
  actualConsumed: number
): number | null {
  // Handle zero actual consumed - return null
  if (actualConsumed === 0) {
    return null;
  }

  // Handle zero planned - return null
  if (plannedMaterial === 0) {
    return null;
  }

  const yieldPercent = (plannedMaterial / actualConsumed) * 100;
  // Round to 1 decimal place
  return Math.round(yieldPercent * 10) / 10;
}

// Examples:
calculateMaterialYield(100, 100) // Returns 100.0 (perfect)
calculateMaterialYield(100, 110) // Returns 90.9 (over-consumption)
calculateMaterialYield(100, 90)  // Returns 111.1 (efficient)
```

### getYieldColor

```typescript
export const YIELD_THRESHOLDS = {
  green: 95,  // >= 95% green
  yellow: 80, // >= 80% yellow
  red: 0,     // < 80% red
};

export function getYieldColor(yieldPercent: number): 'green' | 'yellow' | 'red' {
  if (yieldPercent >= YIELD_THRESHOLDS.green) {
    return 'green';
  }
  if (yieldPercent >= YIELD_THRESHOLDS.yellow) {
    return 'yellow';
  }
  return 'red';
}
```

### getYieldLabel

```typescript
export function getYieldLabel(yieldPercent: number | null): string {
  if (yieldPercent === null) {
    return 'N/A';
  }
  return `${yieldPercent}%`;
}
```

## Yield Data Structure

```typescript
interface YieldData {
  overall_yield: number | null;   // Average of all yields
  output_yield: number | null;    // Output / Planned * 100
  material_yield: number | null;  // Planned Material / Consumed * 100
  operation_yield: number | null; // Future: Operation efficiency
  output_trend: number | null;    // Difference from previous batch
  target_yield: number;           // Default: 95%
}
```

## API Response

### GET /api/production/work-orders/{woId}/outputs

Returns yield data in response:

```json
{
  "wo": {
    "planned_qty": 1000,
    "output_qty": 950,
    "progress_percent": 95.0
  },
  "yields": {
    "overall_yield": 92.5,
    "output_yield": 95.0,
    "material_yield": 90.0,
    "operation_yield": null,
    "output_trend": 2.5,
    "target_yield": 95
  }
}
```

## Component Usage

### YieldIndicator

```tsx
import { YieldIndicator } from '@/components/production/outputs/YieldIndicator';

// Basic
<YieldIndicator value={95.5} />

// With size and label
<YieldIndicator value={85.2} size="lg" showLabel />

// With trend indicator
<YieldIndicator value={92.0} trend={+2.5} />

// Null value shows "N/A"
<YieldIndicator value={null} />
```

### YieldSummaryCard

```tsx
import { YieldSummaryCard } from '@/components/production/outputs/YieldSummaryCard';

<YieldSummaryCard
  yields={{
    overall_yield: 92.5,
    output_yield: 95.0,
    material_yield: 90.0,
    operation_yield: null,
    target_yield: 95,
    output_trend: +2.5,
  }}
  onViewHistory={() => setShowHistory(true)}
/>
```

## Yield Calculation Flow

### 1. On Output Registration

```typescript
// After registering output
const newOutputQty = wo.output_qty + registeredQty;
const outputYield = calculateOutputYield(newOutputQty, wo.planned_qty);

// Update WO
await supabase
  .from('work_orders')
  .update({ output_qty: newOutputQty })
  .eq('id', woId);
```

### 2. Fetching Yield Data

```typescript
export async function getOutputPageData(woId: string): Promise<OutputPageData> {
  // Get WO data
  const { data: wo } = await supabase
    .from('work_orders')
    .select('planned_qty, output_qty')
    .eq('id', woId)
    .single();

  // Calculate output yield
  const outputYield = calculateOutputYield(
    Number(wo.output_qty),
    Number(wo.planned_qty)
  );

  // Get consumption data for material yield
  const { data: consumptions } = await supabase
    .from('wo_consumption')
    .select('consumed_qty, wo_materials!inner(required_qty)')
    .eq('wo_id', woId);

  // Calculate material yield
  let materialYield = null;
  if (consumptions?.length > 0) {
    const totalPlanned = consumptions.reduce(
      (sum, c) => sum + c.wo_materials.required_qty,
      0
    );
    const totalConsumed = consumptions.reduce(
      (sum, c) => sum + Number(c.consumed_qty),
      0
    );
    materialYield = calculateMaterialYield(totalPlanned, totalConsumed);
  }

  // Calculate overall yield
  const validYields = [outputYield, materialYield].filter((y) => y !== null);
  const overallYield = validYields.length > 0
    ? validYields.reduce((sum, y) => sum + y, 0) / validYields.length
    : null;

  return {
    yields: {
      overall_yield: overallYield,
      output_yield: outputYield,
      material_yield: materialYield,
      operation_yield: null, // Future feature
      output_trend: null,    // Future feature
      target_yield: settings.default_yield_target || 95,
    },
  };
}
```

## Target Yield Setting

Production settings include a configurable target yield:

```typescript
// In production_settings table
{
  "organization_id": "uuid",
  "default_yield_target": 95, // Percentage
}
```

Used for comparison and highlighting underperformers.

## Yield History (Future)

Yield history will track yield over time:

```typescript
interface YieldLog {
  id: string;
  wo_id: string;
  old_quantity: number;
  new_quantity: number;
  old_yield_percent: number;
  new_yield_percent: number;
  notes: string | null;
  created_at: string;
  created_by: string;
}
```

## Best Practices

### 1. Handle Null Values

```typescript
// Always check for null before displaying
const yieldDisplay = outputYield !== null
  ? `${outputYield}%`
  : 'N/A';
```

### 2. Round Consistently

```typescript
// Always round to 1 decimal place
const rounded = Math.round(value * 10) / 10;
```

### 3. Update Incrementally

```typescript
// Update yield after each output, not just at WO completion
const newTotal = currentOutput + newOutput;
const newYield = calculateOutputYield(newTotal, planned);
```

### 4. Show Context

```typescript
// Display yield with context
<span>
  {outputYield}% ({outputQty} / {plannedQty} {uom})
</span>
```

## Performance Considerations

### Caching

```typescript
// Cache yield calculations if frequently accessed
const yieldCacheKey = `yield:${woId}`;
const cachedYield = await redis.get(yieldCacheKey);

if (!cachedYield) {
  const yield = await calculateYield(woId);
  await redis.set(yieldCacheKey, yield, 'EX', 300); // 5 min TTL
}
```

### Batch Calculations

```typescript
// Calculate yields for multiple WOs in batch
const woIds = ['id1', 'id2', 'id3'];
const yields = await Promise.all(
  woIds.map((id) => calculateYield(id))
);
```

---

## Related Documentation

- [Output Registration API](../../api/production/output-registration.md)
- [Component Guide: YieldIndicator](./output-components.md#yieldindicator)
- [Production Dashboard](../../../apps/frontend/app/(authenticated)/production/dashboard/page.tsx)
