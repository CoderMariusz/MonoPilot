# ADR-007: Work Order State Machine

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related PRDs**: Planning (Epic 3), Production (Epic 4)

---

## Context

Work Orders (WOs) are the central entity in production management. They progress through multiple states from creation to completion. The system must:

1. Enforce valid state transitions (no skipping steps)
2. Validate preconditions before transitions
3. Track who changed state and when
4. Handle exceptional flows (cancellation, pause)
5. Integrate with material reservations and output recording

State management approaches:
- **Simple status field**: Just a string, no enforcement
- **Enum with validation**: Code-enforced transitions
- **State machine pattern**: Explicit states, transitions, guards
- **Workflow engine**: External orchestration (overkill for this)

---

## Decision

**Implement Work Order lifecycle as an explicit state machine with defined states, valid transitions, and guard conditions.**

### State Diagram

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  DRAFT  │────▶│ RELEASED│────▶│ IN_PROGRESS │────▶│  COMPLETED  │
└─────────┘     └─────────┘     └─────────────┘     └─────────────┘
     │               │                │
     │               │                │
     ▼               ▼                ▼
┌─────────────────────────────────────────┐
│              CANCELLED                   │
└─────────────────────────────────────────┘
```

### States

| State | Description |
|-------|-------------|
| `DRAFT` | WO created, can be edited freely |
| `RELEASED` | WO approved, materials can be reserved |
| `IN_PROGRESS` | Production started, consuming materials |
| `COMPLETED` | Production finished, outputs recorded |
| `CANCELLED` | WO cancelled (any pre-completion state) |

---

## Implementation

### State Enum

```typescript
// types/work-order.ts
export enum WorkOrderStatus {
  DRAFT = 'draft',
  RELEASED = 'released',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

### Transition Definitions

```typescript
// State machine configuration
const workOrderTransitions: StateTransition[] = [
  // From DRAFT
  { from: 'draft', to: 'released', action: 'release', guards: ['hasBOM', 'hasMaterials'] },
  { from: 'draft', to: 'cancelled', action: 'cancel', guards: [] },

  // From RELEASED
  { from: 'released', to: 'in_progress', action: 'start', guards: ['hasMaterialsReserved'] },
  { from: 'released', to: 'draft', action: 'unreleased', guards: ['noReservations'] },
  { from: 'released', to: 'cancelled', action: 'cancel', guards: ['releaseReservations'] },

  // From IN_PROGRESS
  { from: 'in_progress', to: 'completed', action: 'complete', guards: ['outputRecorded', 'allOperationsComplete'] },
  { from: 'in_progress', to: 'cancelled', action: 'cancel', guards: ['reverseConsumption'] },

  // Terminal states: COMPLETED and CANCELLED have no outgoing transitions
]
```

### Guard Functions

```typescript
// Guard conditions for transitions
const transitionGuards = {
  hasBOM: async (wo: WorkOrder): Promise<GuardResult> => {
    if (!wo.bom_id) {
      return { allowed: false, reason: 'Work order has no BOM assigned' }
    }
    return { allowed: true }
  },

  hasMaterials: async (wo: WorkOrder): Promise<GuardResult> => {
    const materials = await getWOMaterials(wo.id)
    if (materials.length === 0) {
      return { allowed: false, reason: 'Work order has no materials defined' }
    }
    return { allowed: true }
  },

  hasMaterialsReserved: async (wo: WorkOrder): Promise<GuardResult> => {
    const materials = await getWOMaterials(wo.id)
    const reservations = await getWOReservations(wo.id)

    const unreserved = materials.filter(m =>
      !reservations.some(r => r.wo_material_id === m.id && r.quantity >= m.required_qty)
    )

    if (unreserved.length > 0) {
      return {
        allowed: false,
        reason: `Materials not fully reserved: ${unreserved.map(m => m.material_name).join(', ')}`,
        canOverride: true,  // Allow supervisor override
      }
    }
    return { allowed: true }
  },

  outputRecorded: async (wo: WorkOrder): Promise<GuardResult> => {
    const outputs = await getWOOutputs(wo.id)
    const totalOutput = outputs.reduce((sum, o) => sum + o.quantity, 0)

    if (totalOutput === 0) {
      return { allowed: false, reason: 'No output has been recorded' }
    }
    return { allowed: true }
  },

  allOperationsComplete: async (wo: WorkOrder): Promise<GuardResult> => {
    const operations = await getWOOperations(wo.id)
    const incomplete = operations.filter(op => op.status !== 'completed')

    if (incomplete.length > 0) {
      return {
        allowed: false,
        reason: `Operations not complete: ${incomplete.map(op => op.operation_name).join(', ')}`,
        canOverride: true,
      }
    }
    return { allowed: true }
  },

  noReservations: async (wo: WorkOrder): Promise<GuardResult> => {
    const reservations = await getWOReservations(wo.id)
    const active = reservations.filter(r => r.status === 'reserved')

    if (active.length > 0) {
      return { allowed: false, reason: 'Cannot unreleased with active reservations' }
    }
    return { allowed: true }
  },

  releaseReservations: async (wo: WorkOrder): Promise<GuardResult> => {
    // This is an effect guard - will release reservations if allowed
    await releaseAllReservations(wo.id)
    return { allowed: true }
  },

  reverseConsumption: async (wo: WorkOrder): Promise<GuardResult> => {
    // Only allowed if no outputs recorded
    const outputs = await getWOOutputs(wo.id)
    if (outputs.length > 0) {
      return { allowed: false, reason: 'Cannot cancel after output recorded. Use partial completion.' }
    }
    // Reverse all consumption
    await reverseAllConsumption(wo.id)
    return { allowed: true }
  },
}
```

### Transition Service

```typescript
// work-order-state-service.ts
interface TransitionResult {
  success: boolean
  newStatus?: WorkOrderStatus
  error?: string
  warnings?: string[]
}

async function transitionWorkOrder(
  woId: string,
  action: string,
  userId: string,
  override?: { reason: string; supervisorId: string }
): Promise<TransitionResult> {
  const wo = await getWorkOrder(woId)
  const currentStatus = wo.status

  // Find valid transition
  const transition = workOrderTransitions.find(
    t => t.from === currentStatus && t.action === action
  )

  if (!transition) {
    return {
      success: false,
      error: `Invalid transition: ${action} from ${currentStatus}`
    }
  }

  // Check all guards
  const warnings: string[] = []
  for (const guardName of transition.guards) {
    const guard = transitionGuards[guardName]
    const result = await guard(wo)

    if (!result.allowed) {
      if (result.canOverride && override) {
        warnings.push(`Override: ${result.reason}`)
      } else {
        return { success: false, error: result.reason }
      }
    }
  }

  // Execute transition
  await updateWorkOrderStatus(woId, transition.to)

  // Log state change
  await logStateChange({
    wo_id: woId,
    from_status: currentStatus,
    to_status: transition.to,
    action,
    user_id: userId,
    override_reason: override?.reason,
    override_supervisor_id: override?.supervisorId,
    warnings,
    timestamp: new Date(),
  })

  // Trigger side effects
  await executeTransitionEffects(wo, transition)

  return { success: true, newStatus: transition.to, warnings }
}
```

### Side Effects

```typescript
// Effects triggered after successful transition
async function executeTransitionEffects(
  wo: WorkOrder,
  transition: StateTransition
): Promise<void> {
  switch (`${transition.from}->${transition.to}`) {
    case 'draft->released':
      // Auto-reserve materials if configured
      if (wo.auto_reserve_on_release) {
        await autoReserveMaterials(wo.id)
      }
      break

    case 'released->in_progress':
      // Record production start time
      await updateWorkOrder(wo.id, { actual_start_date: new Date() })
      break

    case 'in_progress->completed':
      // Record completion time
      await updateWorkOrder(wo.id, { actual_end_date: new Date() })
      // Finalize output LPs
      await finalizeOutputLPs(wo.id)
      // Release any unused reservations
      await releaseUnusedReservations(wo.id)
      break

    case '*->cancelled':
      // Log cancellation
      await logWOCancellation(wo.id)
      break
  }
}
```

### Database Schema

```sql
-- Work order status history
CREATE TABLE wo_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  override_reason TEXT,
  override_supervisor_id UUID REFERENCES users(id),
  warnings TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for audit queries
CREATE INDEX idx_wo_status_history_wo ON wo_status_history(wo_id);
CREATE INDEX idx_wo_status_history_created ON wo_status_history(created_at);

-- RLS
ALTER TABLE wo_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON wo_status_history
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::UUID);
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Simple status field** | Easy implementation | No enforcement; bugs cause invalid states |
| **Enum only** | Type safety | No guard conditions; no audit |
| **State machine (chosen)** | Full control; audit; guards | More code; complexity |
| **Workflow engine** | Visual designer; complex flows | Overkill; external dependency; learning curve |

---

## Consequences

### Positive

1. **Data Integrity**: Invalid transitions prevented at application layer
2. **Audit Trail**: Complete history of state changes with who/when
3. **Business Rules**: Guards enforce prerequisites (BOM, reservations)
4. **Override Support**: Supervisors can override with reason logged
5. **Side Effects**: Automatic actions on state change (reservations, timestamps)
6. **Testability**: State machine is easy to unit test

### Negative

1. **Code Complexity**: More code than simple status field
2. **Rigidity**: Adding new states requires careful migration
3. **Override Abuse**: Supervisors might override too frequently
4. **Performance**: Guard checks add latency to transitions
5. **Learning Curve**: Team must understand state machine pattern

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| Code complexity | Well-documented state machine; diagram in docs |
| Rigidity | State additions are additive; DB migration handles enum |
| Override abuse | Override reports; alerts on frequent overrides |
| Performance | Cache guard results where idempotent; parallel checks |
| Learning curve | State diagram in onboarding; clear error messages |

---

## API Endpoints

```typescript
// Work order status actions
POST /api/production/work-orders/:id/release
POST /api/production/work-orders/:id/start
POST /api/production/work-orders/:id/complete
POST /api/production/work-orders/:id/cancel
POST /api/production/work-orders/:id/unreleased

// Request body for override
{
  "override": {
    "reason": "Customer priority shipment",
    "supervisorId": "uuid"
  }
}

// Response
{
  "success": true,
  "newStatus": "in_progress",
  "warnings": ["Override: Materials not fully reserved"]
}
```

---

## UI Integration

```tsx
// Work order status badge and actions
function WorkOrderStatusBar({ wo }: { wo: WorkOrder }) {
  const availableActions = useAvailableActions(wo)

  return (
    <div className="flex items-center gap-4">
      <StatusBadge status={wo.status} />

      {availableActions.map(action => (
        <ActionButton
          key={action.name}
          action={action}
          onClick={() => executeAction(wo.id, action.name)}
          disabled={!action.allowed}
          tooltip={action.reason}
        />
      ))}
    </div>
  )
}

// Hook to get available actions
function useAvailableActions(wo: WorkOrder) {
  return useMemo(() => {
    const transitions = workOrderTransitions.filter(t => t.from === wo.status)
    return transitions.map(t => ({
      name: t.action,
      label: actionLabels[t.action],
      allowed: true, // Pre-check guards for UI hint
      reason: null,
    }))
  }, [wo.status])
}
```

---

## Validation

This decision was validated against:
- [x] Production floor workflow requirements
- [x] Audit compliance for food safety
- [x] Supervisor override scenarios
- [x] Edge cases (partial completion, cancellation after start)

---

## References

- Work Order Service: `apps/frontend/lib/services/work-order-service.ts`
- State Machine: `apps/frontend/lib/state-machines/work-order-sm.ts`
- PRD Planning Module: `docs/1-BASELINE/product/modules/planning.md`
- PRD Production Module: `docs/1-BASELINE/product/modules/production.md`
- ADR-002: BOM Snapshot Pattern
