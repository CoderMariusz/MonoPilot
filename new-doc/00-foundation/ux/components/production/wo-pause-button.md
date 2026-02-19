# Component Spec: WOPauseButton

**Story**: 04.2b - WO Pause/Resume
**Component Path**: `apps/frontend/app/(authenticated)/production/work-orders/[id]/components/WOPauseButton.tsx`
**ShadCN Base**: Button + Dialog

---

## Overview

A conditional action button that allows operators to pause an active work order. Only visible when the `allow_pause_wo` setting is enabled AND the work order status is `in_progress`.

---

## Props Interface

```typescript
interface WOPauseButtonProps {
  workOrderId: string;
  workOrderStatus: 'draft' | 'released' | 'in_progress' | 'paused' | 'completed';
  isPauseEnabled: boolean; // from production_settings.allow_pause_wo
  onPauseSuccess?: (pauseRecord: WOPauseRecord) => void;
  onPauseError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}
```

---

## Render Conditions

| Condition | Render | Notes |
|-----------|--------|-------|
| `isPauseEnabled=false` | **Do not render** | Button completely hidden |
| `isPauseEnabled=true` AND `status=in_progress` | **Render enabled** | Primary action |
| `isPauseEnabled=true` AND `status!=in_progress` | **Render disabled** | Greyed out with tooltip |

---

## States

### 1. Default (Enabled)

```
┌──────────────────────┐
│  [Pause Icon] Pause  │
└──────────────────────┘
```

- **Style**: `variant="outline"` with yellow/warning accent
- **Icon**: Pause icon (Lucide: `Pause`)
- **Size**: 48x48dp minimum (touch target)
- **Color**: Yellow-600 border, Yellow-100 hover background

### 2. Hover

```
┌──────────────────────┐
│  [Pause Icon] Pause  │  <- Yellow-100 bg
└──────────────────────┘
```

### 3. Disabled

```
┌──────────────────────┐
│  [Pause Icon] Pause  │  <- Greyed out
└──────────────────────┘
Tooltip: "WO must be In Progress to pause"
```

- **Style**: `disabled` prop, opacity 50%
- **Cursor**: `not-allowed`
- **Tooltip**: Explains why disabled

### 4. Loading (After Click)

```
┌──────────────────────┐
│  [Spinner] Pausing...│
└──────────────────────┘
```

- **Spinner**: ShadCN Loader2 icon, animated
- **Text**: "Pausing..."
- **Button**: Disabled during loading

### 5. Hidden

Button not rendered at all when `isPauseEnabled=false`.

---

## Click Behavior

1. User clicks Pause button
2. Opens `WOPauseModal` (see wo-pause-modal.md)
3. Button shows loading state while modal is processing
4. On success: Close modal, call `onPauseSuccess`
5. On error: Keep modal open, show error, call `onPauseError`

---

## Accessibility

- **aria-label**: "Pause work order"
- **aria-disabled**: Set when disabled
- **Keyboard**: Enter/Space triggers click
- **Focus**: Visible outline (2px blue border)
- **Tooltip**: Via ShadCN Tooltip component

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Icon only, full text in tooltip |
| Tablet (768-1024px) | Icon + Text |
| Desktop (>1024px) | Icon + Text |

---

## Integration

```tsx
// Usage in WO Detail Page
<WOPauseButton
  workOrderId={workOrder.id}
  workOrderStatus={workOrder.status}
  isPauseEnabled={settings.allow_pause_wo}
  onPauseSuccess={(pauseRecord) => {
    toast.success('Work order paused');
    refetchWorkOrder();
  }}
  onPauseError={(error) => {
    toast.error(error.message);
  }}
/>
```

---

## Dependencies

- `@/components/ui/button` - ShadCN Button
- `@/components/ui/tooltip` - ShadCN Tooltip
- `lucide-react` - Pause icon
- `WOPauseModal` - Modal component (separate file)

---

## Test Scenarios

1. **Visibility**: Hidden when `isPauseEnabled=false`
2. **Enabled**: Clickable when status=`in_progress` AND `isPauseEnabled=true`
3. **Disabled**: Greyed out with tooltip when status!=`in_progress`
4. **Loading**: Shows spinner during API call
5. **A11y**: Keyboard navigation works, aria-labels present

---

**Last Updated**: 2026-01-08
**Status**: Ready for Implementation
