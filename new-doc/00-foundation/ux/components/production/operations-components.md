# Operations Components Specification

**Story**: 04.3 - Operation Start/Complete
**Status**: UX Design Complete
**Last Updated**: 2026-01-08

---

## Overview

Component specifications for Operation Start/Complete feature. These components work together to provide a complete operation tracking experience within the Work Order Execution Detail page (PROD-002).

---

## 1. OperationsTimeline

**Path**: `apps/frontend/components/production/operations/OperationsTimeline.tsx`

**Existing**: Yes (needs enhancement for yield display)

### Purpose
Visual horizontal timeline showing all operations in sequence with status indicators, duration, and yield information.

### Props
```typescript
interface OperationsTimelineProps {
  operations: WOOperation[];
  onOperationSelect?: (op: WOOperation) => void;
  isLoading?: boolean;
  sequenceRequired?: boolean;
}
```

### Layout (Desktop)
```
+------------------------------------------------------------------+
| Operation Timeline                                                |
| +--------------------------------------------------------------+ |
| | Legend: [O] Not Started  [>] In Progress  [v] Completed      | |
| +--------------------------------------------------------------+ |
|                                                                   |
| [Op1 Mixing  ][  Op2 Baking   ][Op3 Cooling][  Op4 Packaging   ] |
| [  v 45m 95% ][   > 2h 15m    ][    O      ][       O          ] |
|                                                                   |
| Start ------ Progress Bar (65% complete) --------------- End     |
+------------------------------------------------------------------+
```

### States

#### Loading
```
+------------------------------------------------------------------+
| Operation Timeline                                                |
| [Skeleton] [Skeleton] [Skeleton] [Skeleton]                      |
+------------------------------------------------------------------+
```

#### Empty
```
+------------------------------------------------------------------+
| Operation Timeline                                                |
|                                                                   |
|    [Clipboard Icon]                                              |
|    No operations defined                                          |
|    This work order routing has no operations.                    |
|                                                                   |
+------------------------------------------------------------------+
```

#### Error
```
+------------------------------------------------------------------+
| Operation Timeline                                [Retry]         |
|                                                                   |
|    [AlertCircle Icon]                                            |
|    Failed to load operations                                      |
|    Please try again or contact support.                          |
|                                                                   |
+------------------------------------------------------------------+
```

#### Success
See Layout above.

### Accessibility
- [x] Keyboard navigation between operation blocks
- [x] ARIA labels: "Operation {name}, status {status}, duration {duration}"
- [x] Focus visible on each block (2px blue ring)
- [x] Color + icon for status (not color alone)

### Responsive
- **Desktop (>1024px)**: Horizontal timeline
- **Tablet (768-1024px)**: Horizontal with scroll
- **Mobile (<768px)**: Vertical card stack

---

## 2. OperationCard

**Path**: `apps/frontend/components/production/operations/OperationCard.tsx`

**Existing**: Embedded in WOOperationsPanel, needs extraction

### Purpose
Single operation card displaying status, machine, durations, and action buttons.

### Props
```typescript
interface OperationCardProps {
  operation: WOOperation;
  canStart: boolean;
  canComplete: boolean;
  onStart: () => void;
  onComplete: () => void;
  onClick?: () => void;
  sequenceBlocked?: boolean;
  sequenceBlockReason?: string;
}
```

### Layout
```
+------------------------------------------------------------------+
| [1] Mixing                                         [In Progress] |
|     Machine: Mixer A1                                            |
|     Expected: 30 min | Actual: 45 min (+15m over)               |
|     Yield: 95%                                                   |
|                                                                   |
|                              [Start]  [Complete]                 |
+------------------------------------------------------------------+
```

### Button States

| Operation Status | [Start] | [Complete] | Notes |
|-----------------|---------|------------|-------|
| pending (seq OK) | Enabled | Disabled | Can start |
| pending (seq blocked) | Disabled + Tooltip | Disabled | "Previous op incomplete" |
| in_progress | Disabled | Enabled | Can complete |
| completed | Disabled | Disabled | Greyed out |
| skipped | Disabled | Disabled | Greyed out |

### Accessibility
- [x] Touch target: 48x48dp minimum for buttons
- [x] aria-describedby for disabled button reason
- [x] Card is clickable for detail view (Enter key)
- [x] Focus trap when buttons visible

---

## 3. OperationStatusBadge

**Path**: `apps/frontend/components/production/operations/OperationStatusBadge.tsx`

**Existing**: Inline, needs extraction to standalone

### Purpose
Color-coded status badge with icon for operation status.

### Props
```typescript
interface OperationStatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  size?: 'sm' | 'md' | 'lg';
}
```

### Status Colors
```
| Status      | Background    | Text         | Icon          |
|-------------|---------------|--------------|---------------|
| pending     | bg-gray-100   | text-gray-700| Circle (empty)|
| in_progress | bg-blue-100   | text-blue-800| PlayCircle    |
| completed   | bg-green-100  | text-green-800| CheckCircle  |
| skipped     | bg-orange-100 | text-orange-800| SkipForward  |
```

### Accessibility
- [x] Icon + text label (not color alone)
- [x] Contrast ratio >= 4.5:1
- [x] aria-label: "Status: {status}"

---

## 4. CompleteOperationModal

**Path**: `apps/frontend/components/production/operations/CompleteOperationModal.tsx`

**Existing**: Yes, needs YieldInput enhancement

### Purpose
Modal to capture yield percentage and notes when completing an operation.

### Props
```typescript
interface CompleteOperationModalProps {
  operation: WOOperation;
  open: boolean;
  onClose: () => void;
  onComplete: (input: CompleteOperationInput) => Promise<void>;
}

interface CompleteOperationInput {
  actual_yield_percent: number;  // 0-100
  notes?: string;
}
```

### Layout
```
+------------------------------------------------------------------+
| Complete Operation: Op2 Baking                              [X]  |
+------------------------------------------------------------------+
|                                                                   |
| Started: 2025-12-14 09:30 AM                                     |
| Duration: 2h 15m (auto-calculated)                               |
| Expected: 2h 00m                                                 |
|                                                                   |
| Actual Yield (%) *                                               |
| +--------------------------------------------------+             |
| | [< ]  [================|========] 95%      [> ] |             |
| +--------------------------------------------------+             |
| Range: 0-100%, step 0.5%                                         |
|                                                                   |
| Notes (optional)                                                 |
| +--------------------------------------------------+             |
| | Add completion notes...                          |             |
| +--------------------------------------------------+             |
|                                                                   |
| Operator: Sarah L. (current user, read-only)                     |
|                                                                   |
|                              [Cancel]    [Complete]              |
+------------------------------------------------------------------+
```

### Validation
- yield: required, number, min 0, max 100, step 0.5
- notes: optional, max 2000 chars

### States

#### Loading (submitting)
- Complete button: spinner + "Completing..."
- Cancel button: disabled

#### Error (validation)
- Inline error below yield input
- "Yield must be between 0 and 100%"

#### Error (API)
- Toast notification: destructive variant
- Modal stays open for retry

#### Success
- Modal closes
- Toast: "Operation completed with 95% yield"
- Timeline refreshes

### Accessibility
- [x] Focus trapped in modal
- [x] Escape key closes modal
- [x] Enter submits form
- [x] aria-live="polite" for duration update
- [x] Error messages linked via aria-describedby

---

## 5. YieldInput

**Path**: `apps/frontend/components/production/operations/YieldInput.tsx`

**Existing**: No (new component)

### Purpose
Specialized input for yield percentage with slider and number input.

### Props
```typescript
interface YieldInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;        // default 0
  max?: number;        // default 100
  step?: number;       // default 0.5
  error?: string;
  disabled?: boolean;
}
```

### Layout
```
+------------------------------------------------------------------+
| Actual Yield (%)                                                  |
| +------------------------+---------+                              |
| | [Slider: =========|==] | [ 95.0 ]|                              |
| +------------------------+---------+                              |
| | 0%                     |    100% |                              |
| +------------------------+---------+                              |
+------------------------------------------------------------------+
```

### Color Coding (visual feedback)
```
| Yield Range | Slider Color | Indicator |
|-------------|--------------|-----------|
| >= 95%      | Green        | Excellent |
| 85-94.9%    | Blue         | Good      |
| 70-84.9%    | Yellow       | Warning   |
| < 70%       | Red          | Poor      |
```

### Accessibility
- [x] Linked label via htmlFor
- [x] aria-valuemin, aria-valuemax, aria-valuenow
- [x] Keyboard: Arrow keys adjust by step
- [x] Touch target >= 48dp

---

## 6. DurationDisplay

**Path**: `apps/frontend/components/production/operations/DurationDisplay.tsx`

**Existing**: Inline, needs extraction

### Purpose
Display expected vs actual duration with variance indicator.

### Props
```typescript
interface DurationDisplayProps {
  expected: number | null;    // minutes
  actual: number | null;      // minutes
  showVariance?: boolean;     // default true
  size?: 'sm' | 'md' | 'lg';
}
```

### Layout
```
Expected: 30m | Actual: 45m (+50% over)
                            ^^^^^^^^^^^
                            Red text if >25% over
```

### Variance Color Rules
```
| Condition        | Color        | Icon      |
|------------------|--------------|-----------|
| <= expected      | text-green-600 | CheckCircle |
| 1-10% over       | text-gray-600  | Clock     |
| 11-25% over      | text-yellow-600| AlertTriangle |
| > 25% over       | text-red-600   | AlertCircle |
```

### Accessibility
- [x] aria-label includes variance in plain text
- [x] Color + icon (not color alone)

---

## 7. OperationLogTable

**Path**: `apps/frontend/components/production/operations/OperationLogTable.tsx`

**Existing**: Referenced in frontend.yaml, not implemented

### Purpose
Audit trail table showing all status changes for an operation.

### Props
```typescript
interface OperationLogTableProps {
  logs: OperationLog[];
  isLoading?: boolean;
}

interface OperationLog {
  id: string;
  event_type: 'started' | 'completed' | 'skipped' | 'reset';
  old_status: string | null;
  new_status: string;
  changed_by_user: {
    first_name: string;
    last_name: string;
  };
  metadata: {
    yield_percent?: number;
    duration_minutes?: number;
    notes?: string;
  };
  created_at: string;
}
```

### Layout (Desktop)
```
+------------------------------------------------------------------+
| Operation Logs                                                    |
+------------------------------------------------------------------+
| Event      | From -> To        | By        | Details   | Time    |
+------------+-------------------+-----------+-----------+---------+
| Started    | pending->progress | Sarah L.  | -         | 09:30   |
| Completed  | progress->done    | Sarah L.  | 95% yield | 10:15   |
+------------------------------------------------------------------+
```

### States

#### Loading
```
+------------------------------------------------------------------+
| [Skeleton row]                                                    |
| [Skeleton row]                                                    |
| [Skeleton row]                                                    |
+------------------------------------------------------------------+
```

#### Empty
```
+------------------------------------------------------------------+
| No activity recorded                                              |
| Operation logs will appear here when status changes occur.       |
+------------------------------------------------------------------+
```

### Responsive
- **Desktop**: Table with columns
- **Mobile**: Vertical card stack

### Accessibility
- [x] Proper table semantics (thead, tbody, th)
- [x] aria-label on table
- [x] Sortable columns with aria-sort

---

## 8. SequenceWarning

**Path**: `apps/frontend/components/production/operations/SequenceWarning.tsx`

**Existing**: No (logic exists, no visual component)

### Purpose
Warning message shown when trying to start an operation out of sequence.

### Props
```typescript
interface SequenceWarningProps {
  blockedOperation: WOOperation;
  blockingOperations: WOOperation[];
  onDismiss?: () => void;
}
```

### Layout
```
+------------------------------------------------------------------+
| [Warning Icon] Sequence Required                                  |
|                                                                   |
| Cannot start "Baking" yet.                                       |
| Complete these operations first:                                  |
|   - Mixing (In Progress)                                         |
|                                                                   |
|                                              [OK, Got It]         |
+------------------------------------------------------------------+
```

### Accessibility
- [x] role="alert"
- [x] aria-live="assertive"
- [x] Focus on dismiss button
- [x] Escape key dismisses

---

## 9. SkipOperationButton (Phase 1 - Story 04.3b)

**Note**: Out of scope for 04.3. Documented here for completeness.

### Purpose
Button to skip an operation (marks as skipped without completing).

### Deferred to Story 04.3b Phase 1.

---

## Component Relationships

```
WOExecutionDetailPage
  |
  +-- OperationsTimeline (visual overview)
  |
  +-- WOOperationsPanel (list with actions)
  |     |
  |     +-- OperationCard (for each operation)
  |     |     |
  |     |     +-- OperationStatusBadge
  |     |     +-- DurationDisplay
  |     |     +-- StartOperationButton
  |     |     +-- CompleteOperationButton
  |     |
  |     +-- SequenceWarning (conditional)
  |
  +-- OperationStartModal
  |
  +-- CompleteOperationModal
  |     |
  |     +-- YieldInput
  |     +-- DurationDisplay
  |
  +-- OperationDetailPanel (slide-over)
        |
        +-- OperationLogTable
```

---

## Accessibility Checklist

### Touch Targets
- [x] All buttons >= 48x48dp
- [x] List items >= 64dp height
- [x] Spacing between targets >= 8dp

### Color Contrast
- [x] Normal text >= 4.5:1
- [x] Status badges use icon + text + color
- [x] Yield colors are supplementary (not sole indicator)

### Keyboard Navigation
- [x] Tab order: Timeline -> Cards -> Buttons
- [x] Enter activates focused button
- [x] Escape closes modals
- [x] Arrow keys navigate slider

### Screen Reader
- [x] All icons have aria-label
- [x] Status changes announced
- [x] Loading states announced
- [x] Error messages linked

---

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| Desktop (>1024px) | Horizontal timeline, side-by-side cards |
| Tablet (768-1024px) | Horizontal timeline with scroll, stacked cards |
| Mobile (<768px) | Vertical card stack, full-width buttons |

---

## Implementation Notes

1. **Yield Input Enhancement**: Add to existing CompleteOperationModal
2. **Extract Components**: OperationStatusBadge, DurationDisplay from inline
3. **New Components**: YieldInput, OperationLogTable, SequenceWarning
4. **Skip Button**: Deferred to 04.3b

---

**Status**: READY FOR FRONTEND IMPLEMENTATION
**Estimated Effort**: 16-20 hours
**Dependencies**: Existing components in /components/production/
