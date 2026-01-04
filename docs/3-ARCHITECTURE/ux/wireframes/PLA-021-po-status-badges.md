# PLA-021: PO Status Badges

**Module**: Planning
**Story**: 03.5b - PO Approval Workflow
**Feature**: FR-PLAN-009 (PO Approval Workflow) + FR-PLAN-007 (PO Status Lifecycle)
**Status**: Implemented & Documented
**Component**: `POStatusBadge.tsx`
**Last Updated**: 2026-01-02

---

## Overview

Status badge component for displaying purchase order statuses with color coding, icons, and visual states. Supports both fixed POStatus types and configurable status objects. Includes special styling for approval workflow states (pending_approval, approved, rejected).

**Implementation Status**: ✅ Already implemented in `apps/frontend/components/planning/purchase-orders/POStatusBadge.tsx`

---

## Component States

### 1. Loading State
- Skeleton placeholder badge
- Sizes: sm (16px height), md (24px height), lg (28px height)
- Aria-label: "Loading status"

### 2. Error State
- Red destructive badge
- AlertCircle icon
- Text: "Error"
- Aria-label: "Error: {error message}"

### 3. Success State (Normal Status Display)
- Badge with dynamic color based on status
- Optional icon for approval states
- Status name displayed
- Optional tooltip with description

### 4. Empty State (No Status)
- Gray secondary badge
- Text: "Unknown"
- Border style
- Aria-label: "Unknown status"

---

## ASCII Wireframe

### Status Badge Examples

```
Desktop View (Badge Sizes)
+----------------------------------------------------------+
|                                                          |
|  Small (sm):   [Draft]    [Submitted]   [Approved]      |
|                                                          |
|  Medium (md):  [Draft]     [Submitted]    [Approved]    |
|                                                          |
|  Large (lg):   [Draft]      [Submitted]     [Approved]  |
|                                                          |
+----------------------------------------------------------+

Approval Workflow States
+----------------------------------------------------------+
|                                                          |
|  [Draft]          Gray badge, no icon                    |
|                                                          |
|  [⏰ Pending Approval]   Yellow badge, pulsing animation |
|                                                          |
|  [✓ Approved]     Green badge, checkmark icon            |
|                                                          |
|  [✗ Rejected]     Red badge, X icon                      |
|                                                          |
|  [Submitted]      Blue badge, no icon                    |
|                                                          |
|  [Confirmed]      Dark blue badge, no icon               |
|                                                          |
|  [Cancelled]      Gray badge, line-through text          |
|                                                          |
+----------------------------------------------------------+

Badge Variants
+----------------------------------------------------------+
|                                                          |
|  Default:   [Approved]    Solid background, colored text |
|                                                          |
|  Outline:   [Approved]    Transparent bg, colored border |
|                                                          |
|  Subtle:    [Approved]    Light bg, colored text         |
|                                                          |
+----------------------------------------------------------+

With Tooltip (hover)
+----------------------------------------------------------+
|                                                          |
|  [⏰ Pending Approval]                                   |
|       ↓                                                  |
|  +------------------------------------------+            |
|  | PO is waiting for manager approval       |            |
|  +------------------------------------------+            |
|                                                          |
+----------------------------------------------------------+

Loading State
+----------------------------------------------------------+
|                                                          |
|  [==========]  (Skeleton placeholder)                    |
|                                                          |
+----------------------------------------------------------+

Error State
+----------------------------------------------------------+
|                                                          |
|  [⚠ Error]    (Red badge with alert icon)               |
|                                                          |
+----------------------------------------------------------+
```

---

## Status Configuration

### Color Mapping (11 Standard Colors)

| Color | Background | Text | Border | Use Cases |
|-------|------------|------|--------|-----------|
| Gray | `bg-gray-100` | `text-gray-800` | `border-gray-300` | Draft, Cancelled |
| Blue | `bg-blue-100` | `text-blue-800` | `border-blue-300` | Submitted |
| Yellow | `bg-yellow-100` | `text-yellow-800` | `border-yellow-300` | Pending Approval |
| Green | `bg-green-100` | `text-green-800` | `border-green-300` | Approved |
| Red | `bg-red-100` | `text-red-800` | `border-red-300` | Rejected |
| Purple | `bg-purple-100` | `text-purple-800` | `border-purple-300` | Custom states |
| Emerald | `bg-emerald-100` | `text-emerald-800` | `border-emerald-300` | Confirmed |
| Orange | `bg-orange-100` | `text-orange-800` | `border-orange-300` | Warnings |
| Amber | `bg-amber-100` | `text-amber-800` | `border-amber-300` | Alerts |
| Teal | `bg-teal-100` | `text-teal-800` | `border-teal-300` | Info states |
| Indigo | `bg-indigo-100` | `text-indigo-800` | `border-indigo-300` | Custom states |

### Status Icons (Approval States Only)

| Status Code | Icon | Icon Class | When Shown |
|-------------|------|------------|------------|
| `pending_approval` | Clock | `h-3.5 w-3.5 mr-1` | Always |
| `approved` | CheckCircle2 | `h-3.5 w-3.5 mr-1` | Always |
| `rejected` | XCircle | `h-3.5 w-3.5 mr-1` | Always |
| `cancelled` | XCircle | `h-3.5 w-3.5 mr-1` | Always |
| All others | None | - | No icon |

### Default PO Statuses (Story 03.3)

| Status | Label | Color | Icon | Special Effects |
|--------|-------|-------|------|-----------------|
| `draft` | Draft | Gray | - | - |
| `submitted` | Submitted | Blue | - | - |
| `pending_approval` | Pending Approval | Yellow | Clock | Pulsing animation |
| `approved` | Approved | Green | CheckCircle2 | - |
| `rejected` | Rejected | Red | XCircle | - |
| `confirmed` | Confirmed | Emerald | - | - |
| `receiving` | Receiving | Teal | - | - |
| `closed` | Closed | Gray | - | - |
| `cancelled` | Cancelled | Gray | XCircle | Line-through text |

---

## Component Props

### Interface: POStatusBadgeProps

```typescript
interface POStatusBadgeProps {
  /** Status object with code, name, and color */
  status: ConfigurableStatus | undefined | null;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'

  /** Visual variant */
  variant?: 'default' | 'outline' | 'subtle';  // Default: 'default'

  /** Loading state */
  loading?: boolean;  // Default: false

  /** Error message */
  error?: string | null;  // Default: null

  /** Show tooltip with status details */
  showTooltip?: boolean;  // Default: false

  /** Additional CSS classes */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

interface ConfigurableStatus {
  code: string;      // e.g., "pending_approval"
  name: string;      // e.g., "Pending Approval"
  color: string;     // e.g., "yellow" (one of 11 colors)
}
```

---

## Size Specifications

### Badge Sizes

| Size | Text Size | Padding | Height | Icon Size | Use Case |
|------|-----------|---------|--------|-----------|----------|
| `sm` | `text-xs` | `px-1.5 py-0.5` | ~20px | `h-3 w-3` | Dense tables, compact lists |
| `md` | `text-xs` | `px-2 py-1` | ~24px | `h-3.5 w-3.5` | Default, most common |
| `lg` | `text-sm` | `px-3 py-1.5` | ~28px | `h-4 w-4` | Headers, detail pages |

### Touch Targets
- Minimum touch target: 48x48dp
- Badge itself may be smaller than 48dp
- Ensure parent container provides adequate spacing
- Clickable badges wrapped in button with min 48x48dp

---

## Visual Effects

### Animations

**Pending Approval Pulsing**
```css
/* Applied when status.code === 'pending_approval' */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Cancelled Line-Through**
```css
/* Applied when status.code === 'cancelled' */
.line-through {
  text-decoration: line-through;
}
```

### Variant Styles

**Default Variant**
- Solid background color
- Colored text
- Colored border
- Most common variant

**Outline Variant**
- Transparent background
- Colored text
- Colored border
- Minimal style

**Subtle Variant**
- Light background (50 shade instead of 100)
- Colored text
- Colored border
- Softer appearance

---

## Tooltip Content

### Tooltip Text by Status

| Status Code | Tooltip Text |
|-------------|--------------|
| `draft` | "PO is in draft mode and can be edited" |
| `submitted` | "PO has been submitted and is awaiting processing" |
| `pending_approval` | "PO is waiting for manager approval" |
| `approved` | "PO has been approved and is ready for confirmation" |
| `rejected` | "PO was rejected and can be edited and resubmitted" |
| `confirmed` | "PO has been confirmed with the supplier" |
| `receiving` | "PO is currently being received at the warehouse" |
| `closed` | "PO has been fully received and closed" |
| `cancelled` | "PO has been cancelled" |
| Custom | "Status: {status.name}" |

---

## Usage Examples

### Basic Usage

```tsx
// Simple badge with default size and variant
<POStatusBadge
  status={{ code: 'draft', name: 'Draft', color: 'gray' }}
/>

// Large badge with tooltip
<POStatusBadge
  status={{ code: 'approved', name: 'Approved', color: 'green' }}
  size="lg"
  showTooltip={true}
/>

// Outline variant
<POStatusBadge
  status={{ code: 'pending_approval', name: 'Pending Approval', color: 'yellow' }}
  variant="outline"
/>
```

### Loading State

```tsx
<POStatusBadge
  status={null}
  loading={true}
  size="md"
/>
```

### Error State

```tsx
<POStatusBadge
  status={null}
  error="Failed to load status"
/>
```

### In PO List Table

```tsx
<DataTable
  columns={[
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <POStatusBadge
          status={row.original.status}
          size="sm"
          showTooltip={true}
        />
      )
    }
  ]}
/>
```

### In PO Detail Header

```tsx
<div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold">{po.po_number}</h1>
  <POStatusBadge
    status={po.status}
    size="lg"
    showTooltip={true}
  />
</div>
```

---

## Accessibility

### ARIA Attributes
- `role="status"` - Identifies badge as status indicator
- `aria-label="Status: {status.name}"` - Screen reader label
- Tooltip: ShadCN Tooltip component (built-in accessibility)

### Color Contrast
- All color combinations meet WCAG AA (4.5:1 minimum)
- Text colors: 800 shade for high contrast on 100 shade backgrounds
- Border: 300 shade for clear visual separation

### Screen Reader
- Badge announces: "Status: Pending Approval"
- Tooltip provides additional context when focused
- Icons marked as `aria-hidden="true"` (decorative)

### Keyboard Navigation
- Badge itself not focusable (status indicator only)
- Tooltip shows on keyboard focus when `showTooltip={true}`
- Parent interactive elements (buttons) provide keyboard access

---

## Responsive Design

### All Breakpoints
- Badge scales with font size
- Icon scales proportionally
- Text truncates with ellipsis if constrained
- Whitespace: `whitespace-nowrap` prevents wrapping

### Mobile Considerations
- Small size (`sm`) recommended for dense mobile tables
- Medium size (`md`) for standard mobile lists
- Large size (`lg`) for mobile headers/detail views

---

## Testing Requirements

### Unit Tests
- Renders correct color for each status code
- Shows correct icon for approval states (pending_approval, approved, rejected)
- Applies pulsing animation to pending_approval
- Applies line-through to cancelled
- Shows loading skeleton when loading={true}
- Shows error badge when error provided
- Shows "Unknown" when status is null/undefined
- Respects size prop (sm, md, lg)
- Respects variant prop (default, outline, subtle)
- Shows tooltip when showTooltip={true}

### Integration Tests
- Integrates with DataTable columns
- Integrates with detail page headers
- Tooltip appears on hover/focus
- Color contrast meets WCAG AA

### Visual Regression Tests
- Screenshot test for each status color
- Screenshot test for each size
- Screenshot test for each variant
- Screenshot test with/without icons
- Screenshot test of pulsing animation
- Screenshot test of tooltip

---

## Implementation Notes

### Existing Component Path
```
apps/frontend/components/planning/purchase-orders/POStatusBadge.tsx
```

### Dependencies
- `@/components/ui/badge` - ShadCN Badge component
- `@/components/ui/tooltip` - ShadCN Tooltip component
- `@/components/ui/skeleton` - ShadCN Skeleton component
- `lucide-react` - Icons (Clock, CheckCircle2, XCircle, AlertCircle)
- `@/lib/utils` - cn() utility for class merging

### Key Features Implemented
- ✅ 11 standard colors with configurable mapping
- ✅ 3 size variants (sm, md, lg)
- ✅ 3 visual variants (default, outline, subtle)
- ✅ Icons for approval states
- ✅ Pulsing animation for pending_approval
- ✅ Line-through for cancelled
- ✅ Loading skeleton state
- ✅ Error state with alert icon
- ✅ Empty/unknown state
- ✅ Tooltips with status descriptions
- ✅ Full accessibility (ARIA, contrast, screen reader)
- ✅ Memoized for performance
- ✅ Legacy component for backwards compatibility

### Backwards Compatibility
- `LegacyPOStatusBadge` component available for old POStatus type
- Automatically converts to new ConfigurableStatus format
- Deprecated but maintained for existing code

---

## Quality Gates

- [x] All 4 states defined (Loading, Success, Error, Empty)
- [x] All 11 colors implemented
- [x] All 3 sizes implemented
- [x] All 3 variants implemented
- [x] Icons shown for approval states
- [x] Animations implemented (pulse, line-through)
- [x] Tooltips functional
- [x] Accessibility requirements met (WCAG AA)
- [x] Touch targets adequate (via parent containers)
- [x] Keyboard navigation support
- [x] Screen reader support
- [x] Color contrast verified
- [x] Component memoized for performance
- [x] Component already implemented and tested

---

**Status**: ✅ Implemented & Documented
**Component**: `POStatusBadge.tsx`
**Story**: 03.5b (also used in 03.3, 03.7)
**Approved**: Auto-approved (existing implementation)
