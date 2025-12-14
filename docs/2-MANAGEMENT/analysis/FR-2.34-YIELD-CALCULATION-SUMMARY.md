# FR-2.34: BOM Yield Calculation - Implementation Summary

## Overview
Implemented simple BOM yield calculation feature to calculate actual output accounting for waste/yield percentage.

**Status**: COMPLETE (Simple MVP)
**Effort**: 1 day
**Commit**: bf4dd59

## Implementation

### Database Changes
**Migration**: `051_add_yield_percent_to_boms.sql`

Added field to `boms` table:
```sql
yield_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00
CHECK (yield_percent > 0 AND yield_percent <= 100)
```

### Service Layer
**File**: `apps/frontend/lib/services/bom-service.ts`

Added function:
```typescript
export async function calculateBOMYield(
  bomId: string,
  plannedQuantity: number
): Promise<YieldCalculation> {
  // Formula: actualOutput = plannedOutput × (yield_percent / 100)
}

export interface YieldCalculation {
  plannedQuantity: number
  yieldPercent: number
  actualQuantity: number
  wasteQuantity: number
}
```

### API Route
**File**: `apps/frontend/app/api/technical/boms/[id]/yield/route.ts`

**Endpoint**: `GET /api/technical/boms/:id/yield?quantity=100`

**Response**:
```json
{
  "plannedQuantity": 100,
  "yieldPercent": 95,
  "actualQuantity": 95,
  "wasteQuantity": 5
}
```

### Schema Updates
**File**: `apps/frontend/lib/validation/bom-schemas.ts`

- Added `yield_percent` to `CreateBOMSchema` (default: 100)
- Added `yield_percent` to `UpdateBOMSchema`
- Added `yield_percent: number` to `BOM` interface

## Usage Examples

### Example 1: Perfect Yield (100%)
```
Planned Output:    100 kg
Yield Rate:        100%
Actual Output:     100 kg
Expected Waste:    0 kg (0%)
```

### Example 2: Typical Manufacturing (95%)
```
Planned Output:    100 kg
Yield Rate:        95%
Actual Output:     95 kg
Expected Waste:    5 kg (5%)
```

### Example 3: High Waste Process (80%)
```
Planned Output:    1000 units
Yield Rate:        80%
Actual Output:     800 units
Expected Waste:    200 units (20%)
```

## API Usage

### Calculate yield for BOM
```bash
GET /api/technical/boms/{bomId}/yield?quantity=1000
```

Response:
```json
{
  "plannedQuantity": 1000,
  "yieldPercent": 95,
  "actualQuantity": 950,
  "wasteQuantity": 50
}
```

## Integration Points

### Current Usage
- **BOM Creation**: Defaults to 100% yield
- **BOM Update**: Can be modified
- **API Query**: Calculate yield for any planned quantity

### Future Phase 2 (Complex Scope)
When implementing complex yield tracking:
- Multi-stage yield (operation-level tracking)
- Historical yield analysis
- Yield optimization recommendations
- Integration with work order planning
- Real-time yield variance tracking

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/051_add_yield_percent_to_boms.sql` | NEW | Database migration |
| `apps/frontend/lib/services/bom-service.ts` | MODIFIED | Added calculateBOMYield() |
| `apps/frontend/lib/validation/bom-schemas.ts` | MODIFIED | Added yield_percent field |
| `apps/frontend/app/api/technical/boms/[id]/yield/route.ts` | NEW | API endpoint |

## Testing Recommendations

### Unit Tests
```typescript
describe('calculateBOMYield', () => {
  it('should calculate yield at 100%', async () => {
    const result = await calculateBOMYield(bomId, 100)
    expect(result.actualQuantity).toBe(100)
    expect(result.wasteQuantity).toBe(0)
  })

  it('should calculate yield at 95%', async () => {
    const result = await calculateBOMYield(bomId, 100)
    expect(result.actualQuantity).toBe(95)
    expect(result.wasteQuantity).toBe(5)
  })

  it('should handle decimal quantities', async () => {
    const result = await calculateBOMYield(bomId, 123.45)
    expect(result.actualQuantity).toBe(117.2775) // 95% of 123.45
  })
})
```

### Integration Tests
- Create BOM with yield_percent
- Update yield_percent
- Query yield calculation endpoint
- Verify default 100% yield

## Notes

### Why BOM-level yield?
The codebase already has:
- `bom_items.yield_percent` - for by-products only
- `routing_operations.expected_yield_percent` - for routing operations
- `wo_operations.actual_yield_percent` - for work order tracking

This new `boms.yield_percent` provides **BOM-level** yield calculation for overall production planning, distinct from:
- Item-level byproduct yields
- Operation-level process yields
- Work order execution yields

### Formula
```
actualOutput = plannedOutput × (yield_percent / 100)
wasteQuantity = plannedOutput - actualOutput
```

### Validation
- `yield_percent` must be > 0.01 and <= 100
- Defaults to 100 (no waste)
- Database constraint enforces range

---

**Generated**: 2025-12-14
**Implementation Time**: ~1 hour
**Complexity**: Simple (S)
