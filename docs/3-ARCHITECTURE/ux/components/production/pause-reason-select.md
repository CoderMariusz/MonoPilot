# Component Spec: PauseReasonSelect

**Story**: 04.2b - WO Pause/Resume
**Component Path**: `apps/frontend/app/(authenticated)/production/work-orders/[id]/components/PauseReasonSelect.tsx`
**ShadCN Base**: Select

---

## Overview

A reusable select dropdown component for choosing work order pause reasons. Used within WOPauseModal. Displays reason options with icons for quick visual identification.

---

## Props Interface

```typescript
interface PauseReasonSelectProps {
  value?: PauseReason;
  onValueChange: (value: PauseReason) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

type PauseReason =
  | 'machine_breakdown'
  | 'material_shortage'
  | 'break'
  | 'quality_issue'
  | 'other';
```

---

## Pause Reasons Data

```typescript
const PAUSE_REASONS: Array<{
  value: PauseReason;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  description: string;
}> = [
  {
    value: 'machine_breakdown',
    label: 'Machine Breakdown',
    icon: Wrench,
    iconColor: 'text-red-500',
    description: 'Equipment failure or maintenance required'
  },
  {
    value: 'material_shortage',
    label: 'Material Shortage',
    icon: Package,
    iconColor: 'text-orange-500',
    description: 'Waiting for materials or supplies'
  },
  {
    value: 'break',
    label: 'Break/Lunch',
    icon: Coffee,
    iconColor: 'text-blue-500',
    description: 'Scheduled break or lunch period'
  },
  {
    value: 'quality_issue',
    label: 'Quality Issue',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    description: 'Quality hold or investigation'
  },
  {
    value: 'other',
    label: 'Other',
    icon: MoreHorizontal,
    iconColor: 'text-gray-500',
    description: 'Other reason (specify in notes)'
  }
];
```

---

## Layout

### Closed State (No Selection)

```
┌─────────────────────────────────────────────────────────┐
│  Select a reason...                                 [v] │
└─────────────────────────────────────────────────────────┘
```

### Closed State (With Selection)

```
┌─────────────────────────────────────────────────────────┐
│  [Wrench] Machine Breakdown                         [v] │
└─────────────────────────────────────────────────────────┘
```

### Open State (Dropdown Expanded)

```
┌─────────────────────────────────────────────────────────┐
│  Select a reason...                                 [^] │
├─────────────────────────────────────────────────────────┤
│  [Wrench] Machine Breakdown                             │
│           Equipment failure or maintenance required     │
├─────────────────────────────────────────────────────────┤
│  [Package] Material Shortage                            │
│           Waiting for materials or supplies             │
├─────────────────────────────────────────────────────────┤
│  [Coffee] Break/Lunch                                   │
│           Scheduled break or lunch period               │
├─────────────────────────────────────────────────────────┤
│  [Alert] Quality Issue                                  │
│           Quality hold or investigation                 │
├─────────────────────────────────────────────────────────┤
│  [...] Other                                            │
│           Other reason (specify in notes)               │
└─────────────────────────────────────────────────────────┘
```

---

## States

### 1. Empty (No Selection)

- Placeholder text shown
- No icon
- Border: Default (Slate-200)

### 2. Selected

- Selected option shown with icon
- Icon color matches reason
- Border: Default (Slate-200)

### 3. Focused

- Focus ring: 2px Blue-500 outline
- Keyboard accessible

### 4. Error

```
┌─────────────────────────────────────────────────────────┐
│  Select a reason...                                 [v] │  <- Red border
└─────────────────────────────────────────────────────────┘
[!] Please select a pause reason    <- Red error text
```

- Border: Red-500
- Error message below

### 5. Disabled

- Opacity: 50%
- Cursor: not-allowed
- Not clickable

---

## Touch Targets

| Element | Size |
|---------|------|
| Select trigger | 48dp height (full width) |
| Dropdown options | 64dp height each (icon + text + description) |
| Dropdown options (mobile) | 72dp height |

---

## Visual Design

### Option Item Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Icon]  Label                                           │
│         Description text (secondary color)              │
└─────────────────────────────────────────────────────────┘
```

### Colors

| Element | Color |
|---------|-------|
| Label | Slate-900 (dark) |
| Description | Slate-500 (muted) |
| Icon | Per reason (see table above) |
| Hover background | Slate-100 |
| Selected background | Blue-50 |
| Selected check | Blue-600 checkmark |

---

## Keyboard Navigation

- **Tab**: Focus select trigger
- **Enter/Space**: Open dropdown
- **Arrow Up/Down**: Navigate options
- **Enter/Space**: Select highlighted option
- **Escape**: Close dropdown without selecting
- **Type-ahead**: Typing "m" focuses "Machine Breakdown"

---

## Accessibility

- **role**: `listbox` for dropdown
- **aria-label**: "Pause reason"
- **aria-required**: true
- **aria-invalid**: Set when error present
- **aria-describedby**: Links to error message (if present)
- **Option description**: `aria-describedby` on each option

---

## Usage Example

```tsx
// In WOPauseModal
<FormField
  control={form.control}
  name="reason"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Pause Reason *</FormLabel>
      <FormControl>
        <PauseReasonSelect
          value={field.value}
          onValueChange={field.onChange}
          error={form.formState.errors.reason?.message}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Dependencies

- `@/components/ui/select` - ShadCN Select
- `lucide-react` - Icons (Wrench, Package, Coffee, AlertTriangle, MoreHorizontal)
- `@radix-ui/react-select` - Underlying primitive

---

## Test Scenarios

1. **Render**: Shows placeholder when no value
2. **Selection**: Shows selected value with icon
3. **Keyboard**: Navigate with arrows, select with Enter
4. **Error state**: Shows red border and error message
5. **Disabled**: Cannot interact when disabled
6. **A11y**: Screen reader announces options correctly

---

**Last Updated**: 2026-01-08
**Status**: Ready for Implementation
