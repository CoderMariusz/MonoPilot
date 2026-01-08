# Component Spec: WOPauseHistory

**Story**: 04.2b - WO Pause/Resume
**Component Path**: `apps/frontend/app/(authenticated)/production/work-orders/[id]/components/WOPauseHistory.tsx`
**ShadCN Base**: Table + Card

---

## Overview

A table/list component displaying the complete pause history for a work order. Shows all pause events with reason, duration, and user information. Can be embedded in the WO Detail page or shown in a modal.

---

## Props Interface

```typescript
interface WOPauseHistoryProps {
  workOrderId: string;
  pauses?: WOPauseRecord[]; // If provided, use this data; else fetch
  maxItems?: number; // Limit displayed items (default: all)
  showSummary?: boolean; // Show total downtime summary (default: true)
  variant?: 'table' | 'list'; // Display style (default: responsive)
  className?: string;
}

interface WOPauseRecord {
  id: string;
  work_order_id: string;
  paused_at: string;
  resumed_at: string | null; // null if currently paused
  duration_minutes: number | null; // null if currently paused
  pause_reason: PauseReason;
  pause_reason_label: string;
  notes: string | null;
  paused_by_user: {
    id: string;
    full_name: string;
  };
  resumed_by_user: {
    id: string;
    full_name: string;
  } | null;
}
```

---

## Layout

### Desktop - Table View (>768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Pause History                                              Total: 1h 35m    │
├─────────────────────────────────────────────────────────────────────────────┤
│ # │ Paused At          │ Duration │ Reason              │ Paused By │ Notes │
├───┼────────────────────┼──────────┼─────────────────────┼───────────┼───────┤
│ 1 │ Dec 14, 11:30 AM   │ 45 min   │ [Wrench] Machine    │ Sarah L.  │ ...   │
│   │ Resumed: 12:15 PM  │          │ Breakdown           │           │       │
├───┼────────────────────┼──────────┼─────────────────────┼───────────┼───────┤
│ 2 │ Dec 14, 2:00 PM    │ 30 min   │ [Coffee] Break/     │ John S.   │ -     │
│   │ Resumed: 2:30 PM   │          │ Lunch               │           │       │
├───┼────────────────────┼──────────┼─────────────────────┼───────────┼───────┤
│ 3 │ Dec 14, 4:15 PM    │ [Active] │ [Package] Material  │ Sarah L.  │ Await │
│   │ Still paused       │ 20m+     │ Shortage            │           │ parts │
└───┴────────────────────┴──────────┴─────────────────────┴───────────┴───────┘
```

### Mobile - Card List View (<768px)

```
┌─────────────────────────────────────────────────────────┐
│ Pause History                              Total: 1h 35m│
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Wrench] Machine Breakdown                  45 min  │ │
│ │ Paused: Dec 14, 11:30 AM                           │ │
│ │ Resumed: Dec 14, 12:15 PM                          │ │
│ │ By: Sarah L.                                       │ │
│ │ Notes: Awaiting spare parts delivery              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Coffee] Break/Lunch                        30 min  │ │
│ │ Paused: Dec 14, 2:00 PM                            │ │
│ │ Resumed: Dec 14, 2:30 PM                           │ │
│ │ By: John S.                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Package] Material Shortage             [ACTIVE]    │ │
│ │ Paused: Dec 14, 4:15 PM (20+ min ago)              │ │
│ │ By: Sarah L.                                       │ │
│ │ Notes: Awaiting parts                              │ │
│ │                              [Badge: Currently Paused]│
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## States

### 1. Loading

```
┌─────────────────────────────────────────────────────────┐
│ Pause History                                           │
├─────────────────────────────────────────────────────────┤
│ [Skeleton row]                                          │
│ [Skeleton row]                                          │
│ [Skeleton row]                                          │
└─────────────────────────────────────────────────────────┘
```

- Skeleton rows with proper heights
- 3 skeleton rows default

### 2. Empty

```
┌─────────────────────────────────────────────────────────┐
│ Pause History                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│            [Clock icon - gray]                          │
│                                                         │
│          No pauses recorded                             │
│   This work order has not been paused.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Error

```
┌─────────────────────────────────────────────────────────┐
│ Pause History                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [X] Failed to load pause history                       │
│                                                         │
│          [Retry]                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Success (With Data)

See layouts above.

### 5. Active Pause Highlight

When there's an active pause (no `resumed_at`):

- Row/card highlighted with yellow background
- Badge: "Currently Paused" (yellow)
- Duration shows live counter: "20m+" updating

---

## Summary Section

When `showSummary=true` (default):

```
┌─────────────────────────────────────────────────────────┐
│ Downtime Summary                                        │
├─────────────────────────────────────────────────────────┤
│ Total Pause Count:     3                                │
│ Total Downtime:        1h 35m                           │
│ Average Pause:         31 min                           │
│ Top Reason:            Machine Breakdown (45 min)       │
└─────────────────────────────────────────────────────────┘
```

Summary calculation:

```typescript
interface PauseSummary {
  total_count: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
  top_reason: {
    reason: PauseReason;
    label: string;
    total_minutes: number;
  };
}
```

---

## Visual Design

### Active Pause Badge

- Background: Yellow-100
- Text: Yellow-800
- Text: "Currently Paused"
- Pulse animation (subtle)

### Reason Icons

| Reason | Icon | Color |
|--------|------|-------|
| machine_breakdown | Wrench | Red-500 |
| material_shortage | Package | Orange-500 |
| break | Coffee | Blue-500 |
| quality_issue | AlertTriangle | Yellow-500 |
| other | MoreHorizontal | Gray-500 |

### Duration Formatting

```typescript
const formatDuration = (minutes: number | null) => {
  if (minutes === null) return '[Active]';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
```

---

## API Integration

```typescript
// Fetch pause history
const { data: pauses, isLoading, error, refetch } = useQuery({
  queryKey: ['wo-pause-history', workOrderId],
  queryFn: () => fetch(`/api/production/work-orders/${workOrderId}/pause-history`)
    .then(res => res.json())
});

// Response shape:
interface PauseHistoryResponse {
  pauses: WOPauseRecord[];
  summary: PauseSummary;
}
```

---

## Sorting

Default sort: `paused_at DESC` (most recent first)

Optional column sorting (desktop table):
- Paused At (date)
- Duration (numeric)
- Reason (alphabetic)

---

## Accessibility

- **Table**: Proper `<thead>`, `<tbody>`, `<th scope="col">` structure
- **List (mobile)**: Semantic `<ul>`, `<li>` structure
- **Active pause**: `aria-live="polite"` for live duration updates
- **Row expansion**: If notes are truncated, expandable with keyboard
- **Sort buttons**: `aria-sort` attributes on sortable columns

---

## Touch Targets

- Table rows: Not directly tappable (data display only)
- Expandable notes: 48dp touch target for "Show more" link
- Mobile cards: Full-width, adequate spacing

---

## Responsive Behavior

| Breakpoint | Display |
|------------|---------|
| Mobile (<768px) | Card list |
| Tablet (768-1024px) | Compact table (fewer columns) |
| Desktop (>1024px) | Full table with all columns |

### Tablet Column Reduction

- Hide: Notes column (move to tooltip)
- Combine: Paused At + Resumed At in one column

---

## Dependencies

- `@/components/ui/table` - ShadCN Table
- `@/components/ui/card` - ShadCN Card
- `@/components/ui/skeleton` - ShadCN Skeleton
- `@/components/ui/badge` - ShadCN Badge
- `lucide-react` - Icons
- `@tanstack/react-query` - Data fetching (if internal fetch)

---

## Usage Examples

### Embedded in WO Detail Page

```tsx
// Show in Overview tab
<WOPauseHistory
  workOrderId={workOrder.id}
  maxItems={5}
  showSummary={true}
/>
```

### In Modal (Full History)

```tsx
// Show all history in modal
<Dialog>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Pause History - {workOrder.number}</DialogTitle>
    </DialogHeader>
    <WOPauseHistory
      workOrderId={workOrder.id}
      showSummary={true}
      variant="table"
    />
  </DialogContent>
</Dialog>
```

---

## Test Scenarios

1. **Loading**: Shows skeleton while fetching
2. **Empty**: Shows empty state when no pauses
3. **Error**: Shows error with retry button
4. **Data display**: Shows correct pause information
5. **Active pause**: Highlights current pause, shows live duration
6. **Summary**: Calculates and displays totals correctly
7. **Responsive**: Switches between table and list views
8. **A11y**: Table/list semantic structure correct

---

**Last Updated**: 2026-01-08
**Status**: Ready for Implementation
