# Planning Dashboard Components Documentation

**Story**: 03.16 - Planning Dashboard
**Version**: 1.0
**Last Updated**: 2026-01-02

## Overview

The Planning Dashboard consists of three main React components that provide a comprehensive view of planning operations. All components follow ShadCN UI patterns, support accessibility (ARIA), keyboard navigation, and responsive design.

## Component Architecture

```
DashboardPage (Client Component)
├── PlanningHeader
├── KPICardsGrid
│   └── KPICard × 6
├── AlertPanel
│   └── AlertItem × N
└── ActivityFeed
    └── ActivityItem × N
```

---

## 1. KPICard Component

Displays a single key performance indicator with visual styling, click navigation, and state management.

### Location

```
apps/frontend/components/planning/dashboard/KPICard.tsx
```

### Usage

```tsx
import { KPICard, KPICardsGrid } from '@/components/planning/dashboard/KPICard'
import type { KPIData } from '@/lib/types/planning-dashboard'

// Single card
<KPICard
  type="po_pending_approval"
  title="PO Pending Approval"
  value={12}
  icon="po_pending_approval"
  onClick={() => router.push('/planning/purchase-orders?approval_status=pending')}
/>

// Grid of all 6 KPIs
<KPICardsGrid
  data={kpiData}
  loading={false}
  error={undefined}
  onRetry={() => fetchKPIs()}
  onCardClick={(type) => handleKPIClick(type)}
/>
```

### Props

#### KPICard

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | `KPIType` | Yes | - | KPI identifier (see KPI Types) |
| `title` | `string` | Yes | - | Display title |
| `value` | `number` | Yes | - | Numeric value |
| `icon` | `KPIType` | Yes | - | Icon type (matches type) |
| `onClick` | `() => void` | No | Default route | Click handler |
| `loading` | `boolean` | No | false | Loading state |
| `error` | `string` | No | undefined | Error message |
| `trend` | `TrendData` | No | undefined | Trend indicator (Phase 2) |
| `comparisonText` | `string` | No | undefined | Comparison text (Phase 2) |
| `onRetry` | `() => void` | No | undefined | Retry handler |
| `className` | `string` | No | undefined | Additional CSS classes |

#### KPICardsGrid

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `KPIData \| null` | Yes | - | KPI data object |
| `loading` | `boolean` | No | false | Loading state |
| `error` | `string` | No | undefined | Error message |
| `onRetry` | `() => void` | No | undefined | Retry handler |
| `onCardClick` | `(type: KPIType) => void` | No | undefined | Card click handler |
| `className` | `string` | No | undefined | Additional CSS classes |

### KPI Types

```typescript
type KPIType =
  | 'po_pending_approval'   // POs awaiting approval
  | 'po_this_month'         // POs created this month
  | 'to_in_transit'         // Transfer orders in transit
  | 'wo_scheduled_today'    // Work orders scheduled today
  | 'wo_overdue'            // Overdue work orders
  | 'open_orders'           // Total open purchase orders
```

### Configuration

Each KPI type has predefined styling:

```typescript
const KPI_CONFIG = {
  po_pending_approval: {
    icon: Clock,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    hoverBorder: 'hover:border-yellow-300',
    route: '/planning/purchase-orders?approval_status=pending',
  },
  // ... other configs
}
```

### States

1. **Loading**: Displays skeleton placeholder
2. **Error**: Shows error message with retry button
3. **Success**: Displays KPI value with icon and title
4. **Empty**: Value displays as "0"

### Features

- **Click Navigation**: Navigates to filtered list page
- **Keyboard Support**: Tab navigation, Enter/Space to activate
- **Number Formatting**: 1000 → 1.0K, 1000000 → 1.0M
- **Responsive Grid**: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- **ARIA Labels**: Full screen reader support

### Example

```tsx
function DashboardKPIs() {
  const [kpis, setKPIs] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleCardClick = (type: KPIType) => {
    const routes = {
      po_pending_approval: '/planning/purchase-orders?approval_status=pending',
      wo_overdue: '/planning/work-orders?overdue=true',
      // ... other routes
    }
    router.push(routes[type])
  }

  return (
    <KPICardsGrid
      data={kpis}
      loading={loading}
      onCardClick={handleCardClick}
    />
  )
}
```

### Styling

- Card border color changes on hover based on KPI type
- Shadow increases on hover for visual feedback
- Focus ring for keyboard navigation
- Color-coded icons (yellow for pending, red for overdue, etc.)

---

## 2. AlertPanel Component

Displays critical and warning alerts with severity indicators and click-to-navigate functionality.

### Location

```
apps/frontend/components/planning/dashboard/AlertPanel.tsx
```

### Usage

```tsx
import { AlertPanel } from '@/components/planning/dashboard/AlertPanel'
import type { Alert } from '@/lib/types/planning-dashboard'

<AlertPanel
  alerts={alerts}
  loading={false}
  error={undefined}
  onAlertClick={(alert) => router.push(`/planning/purchase-orders/${alert.entity_id}`)}
  onRetry={() => fetchAlerts()}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `alerts` | `Alert[]` | Yes | - | Array of alert objects |
| `loading` | `boolean` | No | false | Loading state |
| `error` | `string` | No | undefined | Error message |
| `onAlertClick` | `(alert: Alert) => void` | No | Default route | Alert click handler |
| `onRetry` | `() => void` | No | undefined | Retry handler |
| `className` | `string` | No | undefined | Additional CSS classes |

### Alert Type

```typescript
interface Alert {
  id: string                    // Unique identifier
  type: AlertType               // Alert category
  severity: 'warning' | 'critical'
  entity_type: 'purchase_order' | 'transfer_order' | 'work_order'
  entity_id: string             // Entity UUID
  entity_number: string         // Display number (e.g., PO-2024-00123)
  description: string           // User-friendly description
  days_overdue?: number         // Optional days overdue
  created_at: string            // ISO timestamp
}

type AlertType = 'overdue_po' | 'pending_approval' | 'low_inventory' | 'material_shortage'
```

### Alert Configuration

```typescript
const ALERT_TYPE_CONFIG = {
  overdue_po: {
    icon: Clock,
    label: 'Overdue PO',
    color: 'text-red-600',
  },
  pending_approval: {
    icon: AlertCircle,
    label: 'Pending Approval',
    color: 'text-yellow-600',
  },
  // ... other types
}
```

### Severity Styling

| Severity | Badge Variant | Border | Background |
|----------|---------------|--------|------------|
| `warning` | `secondary` | Yellow left border | `bg-yellow-50/30` |
| `critical` | `destructive` | Red left border | `bg-red-50/30` |

### States

1. **Loading**: 5 skeleton alert items
2. **Error**: Error message with retry button
3. **Empty**: "No alerts - all clear!" with checkmark icon
4. **Success**: Scrollable list of alerts

### Features

- **Auto-Sorting**: Critical alerts first, then by entity_number
- **Click Navigation**: Navigates to entity detail page
- **Keyboard Support**: Tab navigation, Enter/Space to activate
- **Badge Count**: Shows total alert count in header
- **Responsive**: Stacks vertically on mobile

### Example

```tsx
function DashboardAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const router = useRouter()

  const handleAlertClick = (alert: Alert) => {
    const routes = {
      purchase_order: `/planning/purchase-orders/${alert.entity_id}`,
      transfer_order: `/planning/transfer-orders/${alert.entity_id}`,
      work_order: `/planning/work-orders/${alert.entity_id}`,
    }
    router.push(routes[alert.entity_type])
  }

  return (
    <AlertPanel
      alerts={alerts}
      onAlertClick={handleAlertClick}
    />
  )
}
```

---

## 3. ActivityFeed Component

Displays recent planning activity with entity icons, action types, and relative timestamps.

### Location

```
apps/frontend/components/planning/dashboard/ActivityFeed.tsx
```

### Usage

```tsx
import { ActivityFeed } from '@/components/planning/dashboard/ActivityFeed'
import type { Activity } from '@/lib/types/planning-dashboard'

<ActivityFeed
  activities={activities}
  loading={false}
  error={undefined}
  onActivityClick={(activity) => router.push(`/planning/purchase-orders/${activity.entity_id}`)}
  onRetry={() => fetchActivity()}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `activities` | `Activity[]` | Yes | - | Array of activity objects |
| `loading` | `boolean` | No | false | Loading state |
| `error` | `string` | No | undefined | Error message |
| `onActivityClick` | `(activity: Activity) => void` | No | Default route | Activity click handler |
| `onRetry` | `() => void` | No | undefined | Retry handler |
| `className` | `string` | No | undefined | Additional CSS classes |

### Activity Type

```typescript
interface Activity {
  id: string                    // Unique identifier
  entity_type: 'purchase_order' | 'transfer_order' | 'work_order'
  entity_id: string             // Entity UUID
  entity_number: string         // Display number
  action: ActivityAction        // What happened
  user_id: string               // User UUID
  user_name: string             // Display name
  timestamp: string             // ISO timestamp
}

type ActivityAction = 'created' | 'updated' | 'approved' | 'cancelled' | 'completed'
```

### Entity Configuration

```typescript
const ENTITY_TYPE_CONFIG = {
  purchase_order: {
    icon: ShoppingCart,
    label: 'PO',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  transfer_order: {
    icon: Truck,
    label: 'TO',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  work_order: {
    icon: Factory,
    label: 'WO',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
}
```

### Action Configuration

```typescript
const ACTION_CONFIG = {
  created: {
    icon: Plus,
    label: 'created',
    color: 'text-green-600',
  },
  approved: {
    icon: CheckCircle,
    label: 'approved',
    color: 'text-green-600',
  },
  // ... other actions
}
```

### Relative Timestamps

| Time Difference | Display |
|----------------|---------|
| < 60 seconds | "just now" |
| < 60 minutes | "5 minutes ago" |
| < 24 hours | "3 hours ago" |
| 1 day | "Yesterday" |
| < 7 days | "3 days ago" |
| ≥ 7 days | Date (e.g., "12/25/2024") |

### States

1. **Loading**: 8 skeleton activity items
2. **Error**: Error message with retry button
3. **Empty**: "No recent activity" with activity icon
4. **Success**: Scrollable list (max height 480px)

### Features

- **Auto-Sorting**: Newest first by timestamp
- **Max Display**: 20 activities (even if more fetched)
- **Scrollable**: Vertical scroll with max-height
- **Separators**: Divider lines between items
- **Hover Tooltip**: Full timestamp on hover
- **Keyboard Support**: Full tab navigation

### Example

```tsx
function DashboardActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const router = useRouter()

  const handleActivityClick = (activity: Activity) => {
    const routes = {
      purchase_order: `/planning/purchase-orders/${activity.entity_id}`,
      transfer_order: `/planning/transfer-orders/${activity.entity_id}`,
      work_order: `/planning/work-orders/${activity.entity_id}`,
    }
    router.push(routes[activity.entity_type])
  }

  return (
    <ActivityFeed
      activities={activities}
      onActivityClick={handleActivityClick}
    />
  )
}
```

---

## Common Patterns

### Loading States

All components use ShadCN `Skeleton` for loading:

```tsx
<Skeleton className="h-4 w-24" />  // Text skeleton
<Skeleton className="h-10 w-10 rounded-lg" />  // Icon skeleton
```

### Error States

Consistent error UI across components:

```tsx
<div className="text-center">
  <AlertTriangle className="h-12 w-12 text-red-500" />
  <p className="text-red-600">{error}</p>
  <Button onClick={onRetry}>Retry</Button>
</div>
```

### Empty States

Friendly empty state messages:

```tsx
<div className="text-center">
  <CheckCircle className="h-12 w-12 text-green-500" />
  <p>No alerts - all clear!</p>
</div>
```

### Click Handlers

All items support click and keyboard navigation:

```tsx
<div
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  tabIndex={0}
  role="button"
>
  {content}
</div>
```

---

## Accessibility (ARIA)

### Screen Reader Support

All components include:
- `aria-label` for interactive elements
- `aria-hidden="true"` for decorative icons
- `role="button"` for clickable cards
- `role="list"` / `role="separator"` for lists

### Keyboard Navigation

- **Tab**: Navigate between cards/items
- **Enter/Space**: Activate card/item
- **Escape**: Close modals (future)

### Example ARIA

```tsx
<Card
  role="button"
  aria-label="PO Pending Approval: 12"
  tabIndex={0}
>
  <Icon aria-hidden="true" />
</Card>
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile: 1 column */
grid-cols-1

/* Tablet (768px+): 2 columns */
md:grid-cols-2

/* Desktop (1024px+): 3 columns */
lg:grid-cols-3
```

### Mobile Optimizations

- Stack KPI cards vertically
- Full-width alert panel and activity feed
- Reduced padding on small screens
- Touch-friendly tap targets (min 44x44px)

---

## Testing

All components have comprehensive unit tests:

```
components/planning/dashboard/__tests__/
├── KPICard.test.tsx
├── AlertPanel.test.tsx
└── ActivityFeed.test.tsx
```

### Test Coverage

- Rendering with props
- Loading states
- Error states
- Empty states
- Click handlers
- Keyboard navigation
- ARIA attributes

### Example Test

```tsx
describe('KPICard', () => {
  it('renders value and title', () => {
    render(<KPICard type="po_pending_approval" title="Test" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles click', () => {
    const onClick = vi.fn()
    render(<KPICard type="po_pending_approval" title="Test" value={42} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

---

## Performance

### Optimization Techniques

1. **Memoization**: `useMemo` for sorted/grouped data
2. **Conditional Rendering**: Only render visible items
3. **Lazy Loading**: Future: virtual scrolling for 100+ items
4. **React.Fragment**: Avoid unnecessary DOM nesting

### Metrics

- **Initial Render**: < 50ms
- **Re-render**: < 10ms (when data changes)
- **Lighthouse Score**: 95+ Performance

---

## Future Enhancements

### Phase 2

- Trend indicators on KPI cards ("↑ 15% vs last month")
- Comparison text ("vs last month: +5")
- Date range filter for activity feed
- Export functionality

### Phase 3

- Drag-and-drop dashboard layout
- Customizable widget visibility
- Real-time updates via WebSocket
- Drill-down analytics on KPI click

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial release for Story 03.16 |

---

## Support

For component issues:
- Component Code: `apps/frontend/components/planning/dashboard/`
- Type Definitions: `apps/frontend/lib/types/planning-dashboard.ts`
- Tests: `apps/frontend/components/planning/dashboard/__tests__/`
- Story: `docs/2-MANAGEMENT/epics/current/03-planning/03.16.planning-dashboard.md`
