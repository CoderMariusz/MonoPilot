# Component Spec: WOResumeButton

**Story**: 04.2b - WO Pause/Resume
**Component Path**: `apps/frontend/app/(authenticated)/production/work-orders/[id]/components/WOResumeButton.tsx`
**ShadCN Base**: Button + Dialog

---

## Overview

An action button that allows operators to resume a paused work order. Only visible when the work order status is `paused`.

---

## Props Interface

```typescript
interface WOResumeButtonProps {
  workOrderId: string;
  workOrderStatus: 'draft' | 'released' | 'in_progress' | 'paused' | 'completed';
  currentPause?: WOPauseRecord; // Most recent active pause (for display in modal)
  onResumeSuccess?: () => void;
  onResumeError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

interface WOPauseRecord {
  id: string;
  paused_at: string;
  pause_reason: PauseReason;
  notes?: string;
  paused_by_user: {
    id: string;
    full_name: string;
  };
}

type PauseReason =
  | 'machine_breakdown'
  | 'material_shortage'
  | 'break'
  | 'quality_issue'
  | 'other';
```

---

## Render Conditions

| Condition | Render | Notes |
|-----------|--------|-------|
| `status=paused` | **Render enabled** | Primary action - prominent |
| `status!=paused` | **Do not render** | Button completely hidden |

---

## States

### 1. Default (Enabled)

```
┌─────────────────────────┐
│  [Play Icon] Resume     │
└─────────────────────────┘
```

- **Style**: `variant="default"` with green/success accent
- **Icon**: Play icon (Lucide: `Play`)
- **Size**: 48x48dp minimum (touch target)
- **Color**: Green-600 background, white text

### 2. Hover

```
┌─────────────────────────┐
│  [Play Icon] Resume     │  <- Green-700 bg
└─────────────────────────┘
```

### 3. Loading (After Click)

```
┌─────────────────────────┐
│  [Spinner] Resuming...  │
└─────────────────────────┘
```

- **Spinner**: ShadCN Loader2 icon, animated
- **Text**: "Resuming..."
- **Button**: Disabled during loading

### 4. Hidden

Button not rendered at all when `status!=paused`.

---

## Click Behavior

1. User clicks Resume button
2. Opens `WOResumeModal` (see wo-resume-modal.md)
3. Modal shows pause context (reason, duration, notes)
4. User confirms resume
5. On success: Close modal, call `onResumeSuccess`
6. On error: Keep modal open, show error, call `onResumeError`

---

## Visual Prominence

When WO is paused, the Resume button should be **highly visible**:

- Larger size than other action buttons
- Green background (success color)
- Positioned first in action bar
- Optional: Pulse animation to draw attention

```
Action Bar (Paused State):
┌─────────────────────────────────────────────────────────┐
│  [RESUME]  (green, prominent)   [Complete WO] (grey)   │
└─────────────────────────────────────────────────────────┘
```

---

## Accessibility

- **aria-label**: "Resume work order"
- **Keyboard**: Enter/Space triggers click
- **Focus**: Visible outline (2px green border)
- **Contrast**: White text on Green-600 = 4.5:1+ (WCAG AA)

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Full width button, icon + text |
| Tablet (768-1024px) | Icon + Text, normal size |
| Desktop (>1024px) | Icon + Text, normal size |

---

## Integration

```tsx
// Usage in WO Detail Page
{workOrder.status === 'paused' && (
  <WOResumeButton
    workOrderId={workOrder.id}
    workOrderStatus={workOrder.status}
    currentPause={workOrder.current_pause}
    onResumeSuccess={() => {
      toast.success('Work order resumed');
      refetchWorkOrder();
    }}
    onResumeError={(error) => {
      toast.error(error.message);
    }}
  />
)}
```

---

## Dependencies

- `@/components/ui/button` - ShadCN Button
- `lucide-react` - Play icon
- `WOResumeModal` - Modal component (separate file)

---

## Test Scenarios

1. **Visibility**: Hidden when `status!=paused`
2. **Enabled**: Clickable when status=`paused`
3. **Loading**: Shows spinner during API call
4. **Success**: Closes modal, triggers callback
5. **A11y**: Keyboard navigation works, aria-labels present

---

**Last Updated**: 2026-01-08
**Status**: Ready for Implementation
