# BOMVersionTimeline Component

**Story**: 02.4 - BOMs CRUD + Date Validity
**Module**: `apps/frontend/components/technical/bom/BOMVersionTimeline.tsx`
**Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Production Ready

## Overview

The `BOMVersionTimeline` component visualizes all BOM versions for a product in a horizontal timeline layout. It shows version numbers, status badges, date ranges, and highlights the currently active BOM.

**Features**:
- Color-coded status visualization
- Currently active version highlighting
- Overlap warning indicators
- Hover tooltips with details
- Date gap visualization
- Keyboard navigation support
- Accessibility (ARIA labels, keyboard support)
- Responsive design (horizontal scroll for mobile)

---

## Props

```typescript
interface BOMVersionTimelineProps {
  versions: BOMTimelineVersion[]
  currentDate: string
  onVersionClick: (bomId: string) => void
}
```

### Props Definition

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `versions` | BOMTimelineVersion[] | Yes | - | All BOM versions to display |
| `currentDate` | string (ISO) | Yes | - | Reference date (usually today) |
| `onVersionClick` | function | Yes | - | Callback when user clicks version |

### BOMTimelineVersion Interface

```typescript
interface BOMTimelineVersion {
  id: string
  version: number
  status: 'draft' | 'active' | 'phased_out' | 'inactive'
  effective_from: string // ISO date
  effective_to: string | null // ISO date or null
  output_qty: number
  output_uom: string
  notes: string | null
  is_currently_active: boolean
  has_overlap: boolean
}
```

---

## Usage Examples

### Basic Usage

```typescript
import { BOMVersionTimeline } from '@/components/technical/bom/BOMVersionTimeline'

export function MyComponent() {
  const versions = [
    {
      id: 'bom-1',
      version: 1,
      status: 'active',
      effective_from: '2025-01-01',
      effective_to: '2025-06-30',
      output_qty: 100,
      output_uom: 'kg',
      notes: 'Initial version',
      is_currently_active: false,
      has_overlap: false
    },
    {
      id: 'bom-2',
      version: 2,
      status: 'active',
      effective_from: '2025-07-01',
      effective_to: null,
      output_qty: 120,
      output_uom: 'kg',
      notes: 'Increased output',
      is_currently_active: true,
      has_overlap: false
    }
  ]

  const handleVersionClick = (bomId: string) => {
    console.log(`Clicked BOM: ${bomId}`)
    // Navigate to BOM detail page
  }

  return (
    <BOMVersionTimeline
      versions={versions}
      currentDate={new Date().toISOString().split('T')[0]}
      onVersionClick={handleVersionClick}
    />
  )
}
```

### With API Integration

```typescript
import { BOMVersionTimeline } from '@/components/technical/bom/BOMVersionTimeline'
import { useEffect, useState } from 'react'

export function BOMTimelinePage({ productId }: { productId: string }) {
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      const response = await fetch(
        `/api/v1/technical/boms/timeline/${productId}`
      )
      const data = await response.json()
      setTimeline(data)
      setLoading(false)
    }

    fetchTimeline()
  }, [productId])

  if (loading) return <div>Loading...</div>
  if (!timeline) return <div>No data</div>

  return (
    <div>
      <h2>{timeline.product.name}</h2>
      <BOMVersionTimeline
        versions={timeline.versions}
        currentDate={timeline.current_date}
        onVersionClick={(bomId) => {
          window.location.href = `/boms/${bomId}`
        }}
      />
    </div>
  )
}
```

---

## Visual States

### Status Styling

Each status has distinct visual treatment:

| Status | Background | Border | Text | Use Case |
|--------|-----------|--------|------|----------|
| `draft` | Gray (100) | Gray (300) | Gray (700) | Work in progress |
| `active` | Green (100) | Green (400) | Green (800) | Currently used |
| `phased_out` | Yellow (100) | Yellow (400) | Yellow (800) | Transitioning |
| `inactive` | Gray (50) | Gray (200) | Gray (500) | Disabled |

**Status Configuration Object**:
```typescript
const statusConfig: Record<BOMStatus, {
  bg: string        // Tailwind bg class
  border: string    // Tailwind border class
  text: string      // Tailwind text class
  label: string     // Display label
}> = {
  draft: { bg: 'bg-gray-100', ... },
  active: { bg: 'bg-green-100', ... },
  // ...
}
```

### Timeline Bar Structure

```
┌─────────────────────────────────────────────────────────┐
│ [v1] [draft]              │ Jan 1, 2025 - Jun 30, 2025 │
│      [Current] [⚠]        │                           │
└─────────────────────────────────────────────────────────┘
  ├─ Left Section: Version, Status Badges
  ├─ Right Section: Date Range
  └─ Overlap Warning (if has_overlap=true)
```

### State Indicators

- **Currently Active**: Blue ring with "Current" badge
- **Overlap Warning**: Orange triangle icon (⚠)
- **Hover State**: Shadow elevation and highlight
- **Focus State**: Blue ring (keyboard navigation)
- **Date Gap**: Dashed vertical line between versions

---

## Components Used

The component uses ShadCN UI primitives:

```typescript
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertTriangle } from 'lucide-react'
```

### Badge Component

Used to display status tags:
```jsx
<Badge variant="outline" className={cn('text-xs', config.text)}>
  {version.status}
</Badge>
```

### Tooltip Component

Provides hover information:
```jsx
<Tooltip>
  <TooltipTrigger asChild>
    <div>Timeline bar</div>
  </TooltipTrigger>
  <TooltipContent side="top">
    <div>Detailed info</div>
  </TooltipContent>
</Tooltip>
```

### AlertTriangle Icon

Indicates overlapping BOMs:
```jsx
{version.has_overlap && (
  <AlertTriangle className="w-4 h-4" />
)}
```

---

## Accessibility Features

### ARIA Labels

```typescript
<div
  role="button"
  aria-label={`Version ${version.version}, ${config.label}, ${formatDateRange(...)}`}
  tabIndex={0}
>
```

### Keyboard Navigation

```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent, bomId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onVersionClick(bomId)
    }
  },
  [onVersionClick]
)
```

Supported keys:
- **Enter**: Activate version
- **Space**: Activate version
- **Tab**: Navigate between versions
- **Shift+Tab**: Navigate backwards

### Semantic HTML

- Uses `role="region"` for timeline container
- Uses `role="button"` for version bars
- Uses `role="tooltip"` for hover content
- Uses `aria-label` for descriptions

### Screen Reader Support

All interactive elements have descriptive ARIA labels that include:
- Version number
- Status
- Date range
- Current/Active state
- Overlap warnings

---

## Internal Logic

### Date Formatting

```typescript
function formatDate(dateStr: string): string {
  // "2025-01-01" → "Jan 1, 2025"
  return `${month} ${day}, ${year}`
}

function formatDateRange(from: string, to: string | null): string {
  // "2025-01-01" → "Jan 1, 2025 - ongoing"
  // "2025-01-01", "2025-06-30" → "Jan 1, 2025 - Jun 30, 2025"
}
```

### Sorting

Versions are automatically sorted by `effective_from` date:
```typescript
const sortedVersions = useMemo(() => {
  return [...versions].sort(
    (a, b) =>
      new Date(a.effective_from).getTime() -
      new Date(b.effective_from).getTime()
  )
}, [versions])
```

### Active Version Detection

Determines which version is currently active:

1. First checks `is_currently_active` flag
2. Falls back to date comparison with `currentDate`
3. Returns the matching version ID or null

```typescript
const activeVersionId = useMemo(() => {
  // Check flag first (preferred, set by API)
  const flaggedActive = versions.find((v) => v.is_currently_active)
  if (flaggedActive) return flaggedActive.id

  // Fallback: calculate from dates
  for (const version of versions) {
    if (isVersionActiveForDate(version, currentDate)) {
      return version.id
    }
  }
  return null
}, [versions, currentDate])
```

**Active Logic**:
```
Version is active if:
- effective_from <= currentDate AND
- (effective_to IS NULL OR effective_to >= currentDate)
```

### Gap Detection

Identifies gaps between consecutive versions:

```typescript
const gaps = useMemo(() => {
  const gapsList = []
  for (let i = 0; i < sortedVersions.length - 1; i++) {
    const current = sortedVersions[i]
    const next = sortedVersions[i + 1]

    if (current.effective_to && !areDatesAdjacent(...)) {
      gapsList.push({ afterVersion, startDate, endDate })
    }
  }
  return gapsList
}, [sortedVersions])
```

**Gap Display**: Dashed vertical line between versions

---

## Events

### onVersionClick

Fired when user clicks a timeline bar or presses Enter/Space.

```typescript
onVersionClick: (bomId: string) => void
```

**Example Implementation**:

```typescript
const handleVersionClick = (bomId: string) => {
  // Navigate to BOM detail
  router.push(`/technical/boms/${bomId}`)
}
```

---

## Styling

### Tailwind Classes

```typescript
// Timeline container
className="w-full overflow-x-auto p-4"

// Version bar
className={cn(
  'relative flex items-center justify-between px-4 py-3 rounded-lg border-2 cursor-pointer',
  'transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
  config.bg,
  config.border,
  isActive && 'ring-2 ring-blue-500 ring-offset-2',
  version.has_overlap && 'warning-border border-orange-500'
)}
```

### Customization

To customize styling, modify the status colors:

```typescript
const customStatusConfig: Record<BOMStatus, any> = {
  draft: {
    bg: 'bg-slate-100',    // Changed
    border: 'border-slate-300',
    text: 'text-slate-700',
    label: 'draft'
  },
  // ...
}
```

---

## Empty State

When no versions exist:

```typescript
if (versions.length === 0) {
  return (
    <div className="w-full overflow-x-auto p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Timeline</h3>
      <div className="text-center py-8 text-gray-500">
        <p>No BOMs found for this product.</p>
      </div>
    </div>
  )
}
```

---

## Performance Optimization

### Memoization

Uses React.useMemo for expensive calculations:

```typescript
// Sorting (O(n log n))
const sortedVersions = useMemo(() => [...].sort(...), [versions])

// Active version detection (O(n))
const activeVersionId = useMemo(() => {...}, [versions, currentDate])

// Gap detection (O(n²))
const gaps = useMemo(() => {...}, [sortedVersions])
```

### Rendering

- `TooltipProvider` wraps entire timeline (single tooltip context)
- Version bars are individual components with stable IDs
- Callback memoization prevents unnecessary re-renders

---

## Testing

### Test Example: Rendering

```typescript
import { render, screen } from '@testing-library/react'
import { BOMVersionTimeline } from './BOMVersionTimeline'

it('should render all versions', () => {
  const versions = [
    { id: '1', version: 1, ... },
    { id: '2', version: 2, ... }
  ]
  render(
    <BOMVersionTimeline
      versions={versions}
      currentDate="2025-12-26"
      onVersionClick={jest.fn()}
    />
  )
  expect(screen.getByText('v1')).toBeInTheDocument()
  expect(screen.getByText('v2')).toBeInTheDocument()
})
```

### Test Example: Keyboard Navigation

```typescript
it('should activate version on Enter key', () => {
  const onVersionClick = jest.fn()
  const { container } = render(
    <BOMVersionTimeline
      versions={[{ id: 'bom-1', version: 1, ... }]}
      currentDate="2025-12-26"
      onVersionClick={onVersionClick}
    />
  )
  const bar = container.querySelector('[role="button"]')
  fireEvent.keyDown(bar, { key: 'Enter' })
  expect(onVersionClick).toHaveBeenCalledWith('bom-1')
})
```

### Test Example: Active State

```typescript
it('should highlight currently active version', () => {
  const versions = [
    { id: '1', version: 1, is_currently_active: true, ... },
    { id: '2', version: 2, is_currently_active: false, ... }
  ]
  const { container } = render(
    <BOMVersionTimeline
      versions={versions}
      currentDate="2025-12-26"
      onVersionClick={jest.fn()}
    />
  )
  const bars = container.querySelectorAll('[data-active]')
  expect(bars[0]).toHaveAttribute('data-active', 'true')
  expect(bars[1]).toHaveAttribute('data-active', 'false')
})
```

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Horizontal scroll for overflow

---

## Related Documentation

- API Documentation: `docs/3-ARCHITECTURE/api/technical/boms.md`
- Service Documentation: `docs/3-ARCHITECTURE/services/bom-service.md`
- Database Schema: `docs/3-ARCHITECTURE/database/boms-schema.md`
- User Guide: `docs/4-USER-GUIDES/technical/bom-management.md`

---

## Troubleshooting

### Gap not displaying between versions

**Issue**: Gap indicator not showing between adjacent versions

**Solution**: Ensure `areDatesAdjacent()` correctly identifies non-adjacent dates. Check that:
1. `current.effective_to` is not null
2. Gap exists between dates (> 1 day)

### Overlap warning not showing

**Issue**: `has_overlap` flag not displayed

**Solution**: Verify API returns `has_overlap: true` in timeline response. The API calculates overlaps server-side.

### Active version not highlighted

**Issue**: No version showing as "Current"

**Solution**:
1. Check `currentDate` is correctly formatted (ISO date)
2. Verify `is_currently_active` flag is set by API
3. Ensure `effective_from` <= `currentDate` and `effective_to >= currentDate`

### Tooltip not showing

**Issue**: Hover tooltips not appearing

**Solution**:
1. Verify ShadCN `<Tooltip>` components are installed
2. Check `TooltipProvider delayDuration={0}` wraps timeline
3. Ensure CSS for tooltips is imported
