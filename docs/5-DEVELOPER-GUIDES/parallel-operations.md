# Parallel Operations Developer Guide - FR-2.48

**Feature**: Parallel Operations in Routing Workflows
**Story**: 02.8 - Routing Operations Management
**Scope**: Simple/MVP version (Phase 1)
**Last Updated**: 2025-12-28

---

## Overview

Parallel operations allow multiple production steps to execute simultaneously within a routing workflow. This feature is critical for manufacturing optimization where multiple processes can happen concurrently on the same or different production lines.

**Key Insight**: Parallel operations save time but not cost. Both parallel operations must be staffed/equipped, so labor costs are summed, not reduced.

---

## Business Motivation

### Real-World Example: Bread Production

Without parallel operations:
```
Step 1: Mixing      15 minutes
Step 2: Proofing    45 minutes
Step 3: Baking      30 minutes
Step 4: Cooling     20 minutes
Total:              110 minutes
```

With parallel operations (proofing and heating simultaneous):
```
Step 1: Mixing      15 minutes
Step 2: Proofing    45 minutes  }
        Heating     40 minutes  } Run in parallel = MAX(45, 40) = 45 min
Step 3: Baking      30 minutes
Step 4: Cooling     20 minutes
Total:              110 minutes (saved: 0 min if both fit)
```

Better example - true parallelization:
```
Step 1: Prep A      10 minutes  }
        Prep B      8 minutes   } Run in parallel = MAX(10, 8) = 10 min
Step 2: Cook A      20 minutes  }
        Cook B      15 minutes  } Run in parallel = MAX(20, 15) = 20 min
Step 3: Assembly    10 minutes
Total:              40 minutes (vs 63 sequential)
```

---

## Technical Implementation

### 1. Database Schema

Parallel operations are enabled by **removing the UNIQUE constraint** on `(routing_id, sequence)`:

```sql
-- BEFORE (Sequential only):
CREATE TABLE routing_operations (
  ...
  UNIQUE(routing_id, sequence)  -- Only one op per sequence
);

-- AFTER (Parallel allowed):
CREATE TABLE routing_operations (
  ...
  -- NO UNIQUE constraint - multiple ops can share sequence
);
```

**Migration**: `047_create_routing_operations.sql`
- Table created without unique constraint on sequence
- Allows unlimited parallel operations at same sequence
- Sequence is still indexed for query performance

### 2. Detection Algorithm

Detect which operations are in parallel groups:

```typescript
/**
 * Find all operations that share a sequence number
 * Returns map: sequence -> array of operation IDs
 */
export function detectParallelOperations(
  operations: RoutingOperation[]
): Map<number, string[]> {
  const sequenceMap = new Map<number, string[]>()

  // First pass: group all operations by sequence
  for (const op of operations) {
    const existing = sequenceMap.get(op.sequence) || []
    existing.push(op.id)
    sequenceMap.set(op.sequence, existing)
  }

  // Second pass: filter to only parallel groups (>1 operation)
  const parallelMap = new Map<number, string[]>()
  for (const [seq, ids] of sequenceMap) {
    if (ids.length > 1) {
      parallelMap.set(seq, ids)
    }
  }

  return parallelMap
}

/**
 * Check if single operation is in a parallel group
 */
export function isParallelOperation(
  operation: RoutingOperation,
  operations: RoutingOperation[]
): boolean {
  // Count how many operations share this sequence
  const sameSequence = operations.filter(
    op => op.sequence === operation.sequence
  )
  return sameSequence.length > 1
}
```

### 3. Duration Calculation

**Critical**: Use MAX per sequence group, not SUM.

```typescript
export function calculateSummary(
  operations: RoutingOperation[]
): OperationsSummary {
  if (!operations?.length) {
    return {
      total_operations: 0,
      total_duration: 0,
      total_setup_time: 0,
      total_cleanup_time: 0,
      total_labor_cost: 0,
      average_yield: 0,
    }
  }

  // Group operations by sequence
  const grouped = operations.reduce((acc, op) => {
    if (!acc[op.sequence]) acc[op.sequence] = []
    acc[op.sequence].push(op)
    return acc
  }, {} as Record<number, RoutingOperation[]>)

  let totalDuration = 0
  let totalSetupTime = 0
  let totalCleanupTime = 0
  let totalLaborCost = 0

  // For each sequence group
  for (const group of Object.values(grouped)) {
    // Calculate max time for parallel ops (setup + duration + cleanup)
    const maxTime = Math.max(
      ...group.map(op =>
        (op.setup_time || 0) + op.duration + (op.cleanup_time || 0)
      )
    )
    totalDuration += maxTime

    // Sum setup/cleanup (for display breakdown)
    // Sum labor costs (both workers paid despite parallelization)
    for (const op of group) {
      totalSetupTime += op.setup_time || 0
      totalCleanupTime += op.cleanup_time || 0

      // CRITICAL: Sum costs for all operations
      if (op.labor_cost_per_hour && op.duration) {
        const hours = op.duration / 60
        totalLaborCost += op.labor_cost_per_hour * hours
      }
    }
  }

  return {
    total_operations: operations.length,
    total_duration: totalDuration,
    total_setup_time: totalSetupTime,
    total_cleanup_time: totalCleanupTime,
    total_labor_cost: Math.round(totalLaborCost * 100) / 100,
    average_yield: 100, // Placeholder
  }
}
```

### 4. Cost Calculation Details

**Why parallel ops increase cost**:
- Two workers operating two machines simultaneously
- Both must be paid, even though they share time
- Cost is NOT reduced by parallelization

```typescript
// Example: Proofing + Heating in parallel
const operations = [
  {
    name: "Proofing",
    duration: 45,
    labor_cost_per_hour: 8.00,
    sequence: 2
  },
  {
    name: "Heating",
    duration: 40,
    labor_cost_per_hour: 10.00,
    sequence: 2  // SAME SEQUENCE = parallel
  }
]

// Cost calculation:
// Proofing: 45/60 * 8.00 = 6.00
// Heating: 40/60 * 10.00 = 6.67
// Total: 12.67 (NOT 6.00, because both workers are paid)

// Duration calculation:
// MAX(45, 40) = 45 minutes (not 85!)
```

### 5. Reorder Logic

When moving an operation in a parallel group, **only that operation moves**:

```typescript
/**
 * Move operation up/down in sequence
 * For parallel operations: only the specified operation moves,
 * other parallel ops stay in their group
 */
export async function reorderOperation(
  operations: RoutingOperation[],
  operationToMove: RoutingOperation,
  direction: 'up' | 'down'
): Promise<ServiceResult> {
  const currentSeq = operationToMove.sequence

  // Get unique sequences (handles parallel ops correctly)
  const uniqueSequences = [...new Set(operations.map(op => op.sequence))]
    .sort((a, b) => a - b)

  const currentIndex = uniqueSequences.indexOf(currentSeq)

  if (direction === 'up' && currentIndex === 0) {
    return { success: false, error: 'Already at top' }
  }

  if (direction === 'down' && currentIndex === uniqueSequences.length - 1) {
    return { success: false, error: 'Already at bottom' }
  }

  // Calculate new sequence
  const newSeq = direction === 'up'
    ? uniqueSequences[currentIndex - 1]
    : uniqueSequences[currentIndex + 1]

  // Update ONLY this operation's sequence
  // Other parallel operations in the same group are unaffected
  const result = await updateOperation(operationToMove.id, {
    sequence: newSeq
  })

  return result
}
```

**Example**:
```
Before:
Seq 1: Op1
Seq 2: Op2, Op3  <- Op2 and Op3 are parallel
Seq 3: Op4

Move Op2 down:
Seq 1: Op1
Seq 2: Op3  <- Op3 stays, Op2 moved
Seq 3: Op2, Op4  <- Op2 now parallel with Op4
```

### 6. Validation Rules

Parallel operations have **minimal validation**:

```typescript
/**
 * Validation for operation creation/update
 * Note: Duplicate sequences are ALLOWED (that's the feature!)
 */
const operationSchema = z.object({
  sequence: z.number()
    .int('Sequence must be integer')
    .min(1, 'Sequence must be >= 1')
    .max(999, 'Sequence must be <= 999'),
    // NO uniqueness check - allows parallel ops

  name: z.string()
    .min(3, 'Name must be 3+ chars')
    .max(100, 'Name must be 100 chars max'),

  duration: z.number()
    .int('Duration must be integer')
    .min(1, 'Duration must be >= 1 minute'),

  setup_time: z.number()
    .int()
    .min(0, 'Setup time cannot be negative')
    .default(0),

  cleanup_time: z.number()
    .int()
    .min(0, 'Cleanup time cannot be negative')
    .default(0),

  labor_cost_per_hour: z.number()
    .min(0)
    .default(0),

  expected_yield_percent: z.number()
    .min(0, 'Yield cannot be negative')
    .max(100, 'Yield cannot exceed 100')
    .default(100),

  instructions: z.string()
    .max(2000, 'Instructions limited to 2000 chars')
    .optional()
})

/**
 * Pre-submission validation (client-side info message)
 * When sequence already exists, show info (not error):
 */
const duplicateSequence = operations.find(
  op => op.sequence === formData.sequence && op.id !== currentOpId
)

if (duplicateSequence) {
  showInfoMessage(
    `[i] Sequence ${formData.sequence} already used by ` +
    `"${duplicateSequence.name}". This operation will run in parallel.`
  )
  // NOTE: Continue to submit - do NOT block!
}
```

---

## UI Implementation

### Display Parallel Indicator

Show "(Parallel)" suffix in operations table:

```typescript
// Import detection function
import { isParallelOperation } from '@/lib/services/routing-operations-service'

export function OperationsTable({ operations }) {
  return operations.map(op => (
    <tr key={op.id}>
      <td>{op.sequence}</td>
      <td>
        {op.name}
        {isParallelOperation(op, operations) && (
          <span className="text-muted-foreground"> (Parallel)</span>
        )}
      </td>
      {/* ... other columns ... */}
    </tr>
  ))
}
```

### Summary Panel Display

Show calculated totals with emphasis on duration vs cost difference:

```typescript
export function SummaryPanel({ summary }) {
  return (
    <div className="bg-gray-50 p-4 rounded border">
      <h3>Cost & Duration Summary</h3>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-sm text-gray-600">Total Operations</p>
          <p className="text-2xl font-bold">{summary.total_operations}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Total Duration</p>
          <p className="text-2xl font-bold">{formatDuration(summary.total_duration)}</p>
          <p className="text-xs text-gray-500">
            (MAX per parallel group, SUM across sequences)
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Total Labor Cost</p>
          <p className="text-2xl font-bold">${summary.total_labor_cost.toFixed(2)}</p>
          <p className="text-xs text-gray-500">
            (SUM of all operations, including parallel)
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Average Yield</p>
          <p className="text-2xl font-bold">{summary.average_yield?.toFixed(1)}%</p>
        </div>
      </div>

      {/* Expandable breakdown */}
      {summary.breakdown && (
        <details className="mt-4 pt-4 border-t">
          <summary>View Breakdown</summary>
          <div className="mt-2 text-sm space-y-2">
            {summary.breakdown.map(item => (
              <div key={item.sequence} className="text-gray-600">
                <strong>Seq {item.sequence}:</strong> {item.name} - {item.duration} min
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
```

---

## Common Patterns

### Pattern 1: Create Parallel Operation

```typescript
// User creates second operation at sequence 2
const newOp = await createOperation({
  routing_id: 'routing-uuid',
  sequence: 2,           // SAME as existing operation
  name: 'Heating',
  duration: 40,
  machine_id: 'oven-uuid',
  labor_cost_per_hour: 10.00
})

// Result: Operations now run in parallel
// Duration: MAX(45, 40) = 45 minutes
// Cost: 8.00 + 10.00 = 18.00 (both paid)
```

### Pattern 2: Check for Parallelization Impact

```typescript
// Before saving operation, check if sequence duplicates
const wouldBeParallel = operations.some(
  op => op.sequence === newData.sequence && op.id !== editingOpId
)

if (wouldBeParallel) {
  console.log('This operation will run in parallel')
  // Show info message to user
} else {
  console.log('This operation is sequential')
}
```

### Pattern 3: Calculate Time Saved by Parallelization

```typescript
function calculateTimeSavings(operations: RoutingOperation[]): number {
  // Sequential total: sum ALL durations
  const sequentialTotal = operations.reduce(
    (sum, op) => sum + op.duration, 0
  )

  // Actual total with parallel ops
  const actualTotal = calculateSummary(operations).total_duration

  // Savings
  return sequentialTotal - actualTotal
}

// Example:
// Sequential: 15 + 45 + 40 + 30 = 130 min
// Parallel (seq2 has 45+40): 15 + 45 + 30 = 90 min
// Saved: 40 minutes!
```

### Pattern 4: Validate No Resource Conflicts

```typescript
/**
 * Phase 2 feature: Check if same machine/line used in parallel
 * Currently not implemented, but useful for resource planning
 */
function checkResourceConflicts(
  operations: RoutingOperation[]
): string[] {
  const conflicts: string[] = []

  // Group by sequence to find parallel ops
  const bySequence = operations.reduce((acc, op) => {
    if (!acc[op.sequence]) acc[op.sequence] = []
    acc[op.sequence].push(op)
    return acc
  }, {} as Record<number, RoutingOperation[]>)

  // Check each parallel group
  for (const group of Object.values(bySequence)) {
    if (group.length > 1) {
      // Multiple ops at same sequence
      const machines = group.map(op => op.machine_id).filter(Boolean)
      const lines = group.map(op => op.line_id).filter(Boolean)

      // Check for duplicates
      if (new Set(machines).size < machines.length) {
        conflicts.push(`Sequence has duplicate machines (not supported in Phase 1)`)
      }
      if (new Set(lines).size < lines.length) {
        conflicts.push(`Sequence has duplicate lines (not supported in Phase 1)`)
      }
    }
  }

  return conflicts
}
```

---

## Testing Parallel Operations

### Unit Test Example

```typescript
import { calculateSummary, isParallelOperation } from '@/lib/services/routing-operations-service'

describe('Parallel Operations', () => {
  it('calculates duration with MAX for parallel ops', () => {
    const operations = [
      { sequence: 1, duration: 15, setup_time: 5, cleanup_time: 2 },
      { sequence: 2, duration: 45, setup_time: 0, cleanup_time: 0 },
      { sequence: 2, duration: 40, setup_time: 2, cleanup_time: 0 },  // Parallel!
      { sequence: 3, duration: 30, setup_time: 10, cleanup_time: 3 }
    ]

    const summary = calculateSummary(operations)

    // Seq 1: 15 + 5 + 2 = 22
    // Seq 2: MAX(45, 42) = 45 (parallel)
    // Seq 3: 30 + 10 + 3 = 43
    // Total: 22 + 45 + 43 = 110
    expect(summary.total_duration).toBe(110)
  })

  it('sums costs for parallel operations', () => {
    const operations = [
      { sequence: 2, duration: 45, labor_cost_per_hour: 8.00 },
      { sequence: 2, duration: 40, labor_cost_per_hour: 10.00 }  // Parallel
    ]

    const summary = calculateSummary(operations)

    // Proofing: 45/60 * 8 = 6
    // Heating: 40/60 * 10 = 6.67
    // Total: 12.67
    expect(summary.total_labor_cost).toBeCloseTo(12.67, 2)
  })

  it('detects parallel operations correctly', () => {
    const operations = [
      { id: '1', sequence: 1, name: 'Mix' },
      { id: '2', sequence: 2, name: 'Proof' },
      { id: '3', sequence: 2, name: 'Heat' }  // Parallel with Proof
    ]

    expect(isParallelOperation(operations[1], operations)).toBe(true)  // Proof is parallel
    expect(isParallelOperation(operations[2], operations)).toBe(true)  // Heat is parallel
    expect(isParallelOperation(operations[0], operations)).toBe(false) // Mix is not parallel
  })
})
```

### Integration Test Example

```typescript
describe('Parallel Operations API', () => {
  it('creates operation with duplicate sequence', async () => {
    // Create first operation
    const op1 = await POST('/api/v1/technical/routings/{id}/operations', {
      sequence: 2,
      name: 'Proofing',
      duration: 45,
      labor_cost_per_hour: 8.00
    })
    expect(op1.success).toBe(true)

    // Create second operation at same sequence
    const op2 = await POST('/api/v1/technical/routings/{id}/operations', {
      sequence: 2,  // SAME sequence
      name: 'Heating',
      duration: 40,
      labor_cost_per_hour: 10.00
    })

    // Should succeed (not error)
    expect(op2.success).toBe(true)
    expect(op2.data.sequence).toBe(2)

    // Fetch operations and verify summary
    const list = await GET('/api/v1/technical/routings/{id}/operations')
    expect(list.data.summary.total_duration).toBe(45)  // MAX, not SUM
    expect(list.data.summary.total_labor_cost).toBeCloseTo(12.67, 2)  // SUM
  })
})
```

---

## Phase 2 Features (Future)

The following features are **not in scope for Phase 1** but are planned for Phase 2:

1. **Dependency Graph**
   - Operation A must complete before B starts
   - Visual Gantt chart
   - Critical path analysis

2. **Resource Conflict Detection**
   - Prevent same machine/line used in parallel operations
   - Suggest alternative machines

3. **Advanced Reordering**
   - Drag-and-drop Gantt chart
   - Bulk reorder by dragging sequence block

4. **Capacity Planning**
   - Staffing requirements per operation
   - Resource utilization report

5. **Simulation Mode**
   - What-if analysis
   - "What if we add another machine?" calculations

---

## Troubleshooting

### Issue: Duration not calculated correctly

**Symptom**: Parallel operations duration is SUM not MAX

**Debug**:
```typescript
const grouped = operations.reduce((acc, op) => {
  if (!acc[op.sequence]) acc[op.sequence] = []
  acc[op.sequence].push(op)
  return acc
}, {})

// Check grouping
console.log('Grouped operations:', grouped)
// Should show: { 1: [...], 2: [...parallel ops...], 3: [...] }

// Check MAX calculation
for (const [seq, group] of Object.entries(grouped)) {
  const maxTime = Math.max(...group.map(op => op.duration + op.setup_time))
  console.log(`Seq ${seq}: max = ${maxTime}`)
}
```

### Issue: Parallel operations show as sequential in UI

**Symptom**: "(Parallel)" indicator not showing

**Debug**:
```typescript
// Check isParallelOperation detection
const op = operations[1]
const parallelOps = operations.filter(o => o.sequence === op.sequence)
console.log(`Operations at sequence ${op.sequence}:`, parallelOps.length)
// Should be > 1 for parallel

// Check UI rendering
const isParallel = parallelOps.length > 1
console.log(`Should show (Parallel): ${isParallel}`)
```

### Issue: Cost calculation seems wrong

**Symptom**: Parallel operation cost is not matching expected

**Debug**:
```typescript
// Check labor cost calculation
const operations = [
  { duration: 45, labor_cost_per_hour: 8.00, sequence: 2 },
  { duration: 40, labor_cost_per_hour: 10.00, sequence: 2 }
]

// Manual calculation
const cost1 = (45 / 60) * 8.00  // = 6.00
const cost2 = (40 / 60) * 10.00 // = 6.67
const total = cost1 + cost2     // = 12.67

console.log('Expected:', total)

// Compare with service output
const summary = calculateSummary(operations)
console.log('Actual:', summary.total_labor_cost)
```

---

## References

- **PRD Section**: FR-2.48 (Parallel Operations - Simple)
- **Story**: 02.8 Routing Operations Management
- **Database Migration**: 047_create_routing_operations.sql
- **API Docs**: [Routing Operations API](../api/technical/routing-operations.md)
- **User Guide**: [Routing Operations User Guide](../4-USER-GUIDES/routing-operations.md)

---

**Last Updated**: 2025-12-28
**Author**: TECH-WRITER
**Reviewed By**: CODE-REVIEWER, QA-AGENT
**Status**: Complete & Production-Ready
