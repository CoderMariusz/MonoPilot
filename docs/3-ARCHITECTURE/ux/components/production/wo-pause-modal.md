# Component Spec: WOPauseModal

**Story**: 04.2b - WO Pause/Resume
**Component Path**: `apps/frontend/app/(authenticated)/production/work-orders/[id]/components/WOPauseModal.tsx`
**ShadCN Base**: Dialog + Form + Select

---

## Overview

A modal dialog for pausing a work order. Requires a mandatory pause reason selection and allows optional notes. Triggered by WOPauseButton.

---

## Props Interface

```typescript
interface WOPauseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  workOrderNumber: string; // e.g., "WO-2025-0156"
  onSuccess: (pauseRecord: WOPauseRecord) => void;
  onError: (error: Error) => void;
}
```

---

## Layout

### Desktop (>768px)

```
┌─────────────────────────────────────────────────────────┐
│ Pause Work Order                                    [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Work Order: WO-2025-0156 (read-only)                  │
│                                                         │
│  Pause Reason *                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Select a reason...                           [v] │   │
│  └─────────────────────────────────────────────────┘   │
│  Options:                                              │
│    - Machine Breakdown                                 │
│    - Material Shortage                                 │
│    - Break/Lunch                                       │
│    - Quality Issue                                     │
│    - Other                                             │
│                                                         │
│  Notes (Optional)                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│  Character count: 0/500                                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                        [Cancel]  [Pause Work Order]    │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

Full-screen modal with bottom-fixed action bar:

```
┌─────────────────────────────────────────────────────────┐
│ [X]  Pause Work Order                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Work Order                                            │
│  WO-2025-0156                                          │
│                                                         │
│  Pause Reason *                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Select a reason...                           [v] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Notes (Optional)                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [spacer]                                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Cancel]                    [Pause Work Order]        │
└─────────────────────────────────────────────────────────┘
```

---

## Form Fields

### 1. Pause Reason (Required)

| Property | Value |
|----------|-------|
| Type | Select dropdown |
| Component | `PauseReasonSelect` (see separate spec) |
| Placeholder | "Select a reason..." |
| Validation | Required - must select before submit |
| Options | See Pause Reasons table below |

### Pause Reasons

| Code | Label | Icon (optional) |
|------|-------|-----------------|
| `machine_breakdown` | Machine Breakdown | Wrench |
| `material_shortage` | Material Shortage | Package |
| `break` | Break/Lunch | Coffee |
| `quality_issue` | Quality Issue | AlertTriangle |
| `other` | Other | MoreHorizontal |

### 2. Notes (Optional)

| Property | Value |
|----------|-------|
| Type | Textarea |
| Component | ShadCN Textarea |
| Placeholder | "Add notes about the pause (optional)..." |
| Validation | Optional, max 500 characters |
| Rows | 3 (default), expands to 5 |

---

## States

### 1. Initial (Empty Form)

- Reason dropdown: Empty, placeholder shown
- Notes: Empty
- Submit button: Disabled (reason required)

### 2. Partial (Reason Selected)

- Reason dropdown: Selection shown with icon
- Notes: Empty or filled
- Submit button: Enabled

### 3. Submitting

```
┌─────────────────────────────────────────────────────────┐
│                        [Cancel]  [Spinner] Pausing...  │
└─────────────────────────────────────────────────────────┘
```

- Form fields: Disabled
- Submit button: Loading spinner, "Pausing..."
- Cancel: Disabled

### 4. Validation Error

```
Pause Reason *
┌─────────────────────────────────────────────────────────┐
│ Select a reason...                                  [v] │
└─────────────────────────────────────────────────────────┘
[!] Please select a pause reason    <- Red error text
```

### 5. API Error

```
┌─────────────────────────────────────────────────────────┐
│ [X] Error: Failed to pause work order. Please retry.   │
└─────────────────────────────────────────────────────────┘
```

- Red error banner at top of modal
- Form remains editable
- Retry possible

### 6. Success

- Modal closes automatically
- Toast notification: "Work order paused"
- Parent component handles state refresh

---

## Validation Rules

```typescript
const pauseWorkOrderSchema = z.object({
  reason: z.enum([
    'machine_breakdown',
    'material_shortage',
    'break',
    'quality_issue',
    'other'
  ], {
    required_error: 'Please select a pause reason'
  }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});
```

---

## API Call

```typescript
// On form submit
const response = await fetch(`/api/production/work-orders/${workOrderId}/pause`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: formData.reason,
    notes: formData.notes || null
  })
});
```

---

## Accessibility

- **Focus trap**: Within modal when open
- **Escape key**: Closes modal
- **aria-labelledby**: Links to modal title
- **aria-describedby**: Links to modal description (optional)
- **Form labels**: All fields have associated labels
- **Error announcement**: `aria-live="assertive"` for errors
- **Keyboard navigation**: Tab through fields, Enter to submit

---

## Touch Targets (Mobile)

- Select dropdown: 48dp height
- Textarea: Full width, 40dp+ height per row
- Buttons: 48x48dp minimum
- Close button (X): 48x48dp touch target

---

## Dependencies

- `@/components/ui/dialog` - ShadCN Dialog
- `@/components/ui/form` - ShadCN Form (react-hook-form)
- `@/components/ui/select` - ShadCN Select
- `@/components/ui/textarea` - ShadCN Textarea
- `@/components/ui/button` - ShadCN Button
- `@/lib/validation/production-schemas` - Zod schema
- `PauseReasonSelect` - Custom select component

---

## Test Scenarios

1. **Open/Close**: Modal opens on button click, closes on X, Cancel, or Escape
2. **Validation**: Cannot submit without reason selected
3. **Notes limit**: Enforces 500 character max
4. **Submit**: API called with correct payload
5. **Loading**: Shows spinner, disables form during submit
6. **Error**: Displays API error, allows retry
7. **Success**: Closes modal, calls onSuccess
8. **A11y**: Focus trap, keyboard navigation, aria labels

---

**Last Updated**: 2026-01-08
**Status**: Ready for Implementation
