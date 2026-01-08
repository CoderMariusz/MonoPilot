# Component Spec: WOResumeModal

**Story**: 04.2b - WO Pause/Resume
**Component Path**: `apps/frontend/app/(authenticated)/production/work-orders/[id]/components/WOResumeModal.tsx`
**ShadCN Base**: Dialog

---

## Overview

A confirmation modal for resuming a paused work order. Displays pause context (reason, duration, notes) and requires user confirmation before resuming.

---

## Props Interface

```typescript
interface WOResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  workOrderNumber: string; // e.g., "WO-2025-0156"
  pauseInfo: {
    paused_at: string; // ISO timestamp
    pause_reason: PauseReason;
    pause_reason_label: string; // e.g., "Machine Breakdown"
    notes?: string;
    paused_by_user: {
      id: string;
      full_name: string;
    };
    duration_so_far: number; // minutes, calculated client-side
  };
  onSuccess: () => void;
  onError: (error: Error) => void;
}
```

---

## Layout

### Desktop (>768px)

```
┌─────────────────────────────────────────────────────────┐
│ Resume Work Order                                   [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Ready to resume production?                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Pause Summary                                     │ │
│  │                                                    │ │
│  │  Work Order:    WO-2025-0156                      │ │
│  │  Paused At:     Dec 14, 2025, 11:30 AM           │ │
│  │  Duration:      45 minutes                        │ │
│  │  Reason:        [Wrench] Machine Breakdown        │ │
│  │  Notes:         Awaiting spare parts             │ │
│  │  Paused By:     Sarah L.                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Resuming will set the status back to "In Progress"    │
│  and the pause duration will be recorded.              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                          [Cancel]  [Resume Production]  │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

Full-screen modal with bottom-fixed action bar:

```
┌─────────────────────────────────────────────────────────┐
│ [X]  Resume Work Order                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Ready to resume production?                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Pause Summary                                     │ │
│  │                                                    │ │
│  │  Work Order                                       │ │
│  │  WO-2025-0156                                     │ │
│  │                                                    │ │
│  │  Paused At                                        │ │
│  │  Dec 14, 2025, 11:30 AM                          │ │
│  │                                                    │ │
│  │  Duration                                         │ │
│  │  45 minutes                                       │ │
│  │                                                    │ │
│  │  Reason                                           │ │
│  │  [Wrench] Machine Breakdown                       │ │
│  │                                                    │ │
│  │  Notes                                            │ │
│  │  Awaiting spare parts                            │ │
│  │                                                    │ │
│  │  Paused By                                        │ │
│  │  Sarah L.                                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Cancel]                     [Resume Production]       │
└─────────────────────────────────────────────────────────┘
```

---

## Pause Summary Card

The summary card displays:

| Field | Value | Format |
|-------|-------|--------|
| Work Order | `workOrderNumber` | Plain text |
| Paused At | `paused_at` | Formatted date/time (locale) |
| Duration | `duration_so_far` | "X minutes" or "X hours Y minutes" |
| Reason | `pause_reason_label` | With icon |
| Notes | `notes` | Plain text (or "No notes" if empty) |
| Paused By | `paused_by_user.full_name` | Plain text |

### Duration Calculation (Live)

```typescript
// Update duration every minute while modal is open
const durationMinutes = Math.floor(
  (Date.now() - new Date(pauseInfo.paused_at).getTime()) / 60000
);

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
};
```

---

## States

### 1. Initial (Confirmation View)

- Summary card displayed
- Resume button enabled
- Cancel button enabled

### 2. Submitting

```
┌─────────────────────────────────────────────────────────┐
│                          [Cancel]  [Spinner] Resuming...│
└─────────────────────────────────────────────────────────┘
```

- Resume button: Loading spinner, "Resuming..."
- Cancel: Disabled

### 3. API Error

```
┌─────────────────────────────────────────────────────────┐
│ [X] Error: Failed to resume work order. Please retry.  │
└─────────────────────────────────────────────────────────┘
```

- Red error banner at top of modal
- Retry possible

### 4. Success

- Modal closes automatically
- Toast notification: "Work order resumed - Production continues"
- Parent component handles state refresh

---

## API Call

```typescript
// On confirm resume
const response = await fetch(`/api/production/work-orders/${workOrderId}/resume`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

// Response includes:
// - Updated WO status (in_progress)
// - Pause record with duration_minutes filled
```

---

## Visual Design

### Summary Card Styling

- Background: Slate-50 (light gray)
- Border: 1px Slate-200
- Border-radius: 8px
- Padding: 16px
- Icons: Colored per reason (see PauseReasonSelect spec)

### Reason Icons

| Reason | Icon | Color |
|--------|------|-------|
| machine_breakdown | Wrench | Red-500 |
| material_shortage | Package | Orange-500 |
| break | Coffee | Blue-500 |
| quality_issue | AlertTriangle | Yellow-500 |
| other | MoreHorizontal | Gray-500 |

### Resume Button

- **Style**: `variant="default"` with green accent
- **Text**: "Resume Production"
- **Icon**: Play icon (optional)
- **Color**: Green-600 background

---

## Accessibility

- **Focus trap**: Within modal when open
- **Escape key**: Closes modal (only before confirming)
- **aria-labelledby**: Links to modal title
- **aria-describedby**: Links to summary description
- **Keyboard navigation**: Tab between Cancel and Resume buttons
- **Live duration**: Announced every 5 minutes via `aria-live="polite"`

---

## Touch Targets (Mobile)

- Buttons: 48x48dp minimum
- Close button (X): 48x48dp touch target
- Full-width buttons on mobile

---

## Dependencies

- `@/components/ui/dialog` - ShadCN Dialog
- `@/components/ui/button` - ShadCN Button
- `@/components/ui/card` - ShadCN Card (for summary)
- `lucide-react` - Icons for reasons
- `date-fns` or `dayjs` - Date formatting

---

## Test Scenarios

1. **Open/Close**: Modal opens on button click, closes on X, Cancel, or Escape
2. **Display**: Shows correct pause information
3. **Duration**: Duration updates in real-time
4. **Submit**: API called correctly
5. **Loading**: Shows spinner, disables buttons during submit
6. **Error**: Displays API error, allows retry
7. **Success**: Closes modal, calls onSuccess
8. **A11y**: Focus trap, keyboard navigation, aria labels

---

**Last Updated**: 2026-01-08
**Status**: Ready for Implementation
