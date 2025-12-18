# COMP-002: Settings Empty State

**Component Type:** Empty State Component
**Module:** Settings
**Status:** Approved (Auto-Approve Mode)
**Last Updated:** 2025-12-17

---

## Component Purpose

Reusable "Coming Soon" empty state component for unimplemented Settings pages. Provides a consistent user experience when navigating to routes that are planned but not yet developed.

**Usage:** Displayed on any Settings page that returns empty or is marked as `implemented: false` in navigation schema.

---

## ASCII Wireframe

### Default State

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                  🏗️                          │
│                                             │
│          This Feature is Coming Soon        │
│                                             │
│   This feature is under development.        │
│   Check back later for updates!             │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### With Custom Title and Description

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                  🏗️                          │
│                                             │
│          Analytics Dashboard                │
│                                             │
│   We're building advanced analytics         │
│   features. Stay tuned for insights!        │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Layout Specifications

### Container
- **Display**: Flex column, centered (items-center justify-center)
- **Height**: 400px (h-[400px])
- **Width**: Full width (w-full)
- **Alignment**: Text center (text-center)
- **Padding**: 24px horizontal (px-6)

### Icon
- **Component**: Lucide `Construction` icon
- **Size**: 48px (h-12 w-12)
- **Color**: `text-muted-foreground`
- **Margin**: Bottom 16px (mb-4)

### Title
- **Typography**: 20px (text-xl), font-semibold
- **Color**: `text-foreground`
- **Margin**: Bottom 8px (mb-2)

### Description
- **Typography**: 14px (text-sm), normal weight
- **Color**: `text-muted-foreground`
- **Max Width**: 448px (max-w-md)
- **Line Height**: 1.5

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | Main heading text |
| `description` | string | No | "This feature is coming soon. Check back later!" | Explanation text |

---

## Component Variants

### Variant 1: Default (Generic Coming Soon)

**Props**:
```typescript
{
  title: "This Feature is Coming Soon"
}
```

**Use Case**: Unimplemented routes with no specific context

---

### Variant 2: Named Feature

**Props**:
```typescript
{
  title: "Analytics Dashboard",
  description: "We're building advanced analytics features. Stay tuned for insights!"
}
```

**Use Case**: Known upcoming feature with specific description

---

### Variant 3: Module-Specific

**Props**:
```typescript
{
  title: "NPD Module",
  description: "New Product Development workflows are coming soon. This feature requires a Premium subscription."
}
```

**Use Case**: Premium/locked features

---

## States

### Default
- **Display**: Icon + title + description (centered)
- **Accessibility**: Screen reader announces "This feature is coming soon, This feature is under development. Check back later for updates!"

### No Props
- **Fallback**: If title is not provided, component renders with default title
- **Description**: Uses default description if not provided

---

## Interaction Patterns

### No Interactions
- **Passive Component**: No buttons or links
- **Static Display**: Pure informational state
- **Navigation**: User must navigate away via sidebar or browser back

---

## Accessibility

### Semantic HTML
- **Container**: `<div role="status" aria-live="polite">`
- **Icon**: `<Construction aria-hidden="true" />`
- **Title**: `<h2>{title}</h2>`
- **Description**: `<p>{description}</p>`

### Screen Reader
- **Announcement**: "Status: {title}. {description}"
- **Icon**: Hidden from screen readers (decorative)

### Keyboard Navigation
- **No Focusable Elements**: Component is purely informational
- **Skip to Content**: Standard skip links work around this component

### Contrast
- **Title**: `text-foreground` (7:1 on background)
- **Description**: `text-muted-foreground` (4.5:1 on background)
- **Icon**: `text-muted-foreground` (4.5:1 on background)

---

## Technical Implementation

### Component File
`apps/frontend/components/settings/SettingsEmptyState.tsx`

### Dependencies
- Lucide Icons (`Construction`)
- TailwindCSS utilities

### Example Code

```typescript
import { Construction } from 'lucide-react';

interface SettingsEmptyStateProps {
  title: string;
  description?: string;
}

export function SettingsEmptyState({
  title,
  description = "This feature is coming soon. Check back later!"
}: SettingsEmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center h-[400px] text-center px-6"
    >
      <Construction
        className="h-12 w-12 text-muted-foreground mb-4"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  );
}
```

---

## Usage Examples

### Example 1: Generic Unimplemented Route

```tsx
// In an unimplemented Settings page
export default function AnalyticsPage() {
  return (
    <SettingsEmptyState
      title="This Feature is Coming Soon"
    />
  );
}
```

### Example 2: Named Feature with Context

```tsx
export default function AdvancedReportsPage() {
  return (
    <SettingsEmptyState
      title="Advanced Reports"
      description="Custom report builder is under development. You'll be able to create custom dashboards and export data in various formats."
    />
  );
}
```

### Example 3: Premium Feature

```tsx
export default function NPDModulePage() {
  return (
    <SettingsEmptyState
      title="NPD Module"
      description="New Product Development workflows are coming soon. This feature requires a Premium subscription. Contact sales@monopilot.com to learn more."
    />
  );
}
```

---

## Related Components

- **SettingsLayout**: Parent wrapper for Settings pages
- **SettingsNav**: Navigation sidebar that links to routes
- **Error Boundaries**: Fallback if this component fails to render

---

## Design Tokens

### Spacing
- **Container Height**: 400px
- **Icon Size**: 48px
- **Icon Margin Bottom**: 16px
- **Title Margin Bottom**: 8px
- **Container Padding Horizontal**: 24px
- **Description Max Width**: 448px

### Typography
- **Title Font Size**: 20px
- **Title Font Weight**: 600 (semibold)
- **Description Font Size**: 14px
- **Description Font Weight**: 400 (normal)
- **Description Line Height**: 1.5

### Colors
- **Icon Color**: `text-muted-foreground` (hsl(var(--muted-foreground)))
- **Title Color**: `text-foreground` (hsl(var(--foreground)))
- **Description Color**: `text-muted-foreground` (hsl(var(--muted-foreground)))

---

## Responsive Behavior

### Desktop (>= 768px)
- **Container Height**: 400px
- **Description Max Width**: 448px
- **Icon Size**: 48px

### Tablet (768-1024px)
- **Container Height**: 400px
- **Description Max Width**: 400px
- **Icon Size**: 48px

### Mobile (< 768px)
- **Container Height**: 300px
- **Description Max Width**: 100% (with px-6 padding)
- **Icon Size**: 40px (h-10 w-10)
- **Title Font Size**: 18px (text-lg)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [COMP-002-settings-empty-state]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
