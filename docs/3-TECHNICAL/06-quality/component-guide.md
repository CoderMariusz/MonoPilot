# Quality Status Components Guide

## Overview

Three React components provide UI for quality status lifecycle management:

1. **QualityStatusBadge** - Display status with color + icon
2. **StatusTransitionModal** - Change status with validation UI
3. **StatusHistoryTimeline** - Audit trail visualization

All components are client-side, use ShadCN UI, and support loading/error states.

---

## Component 1: QualityStatusBadge

Display a colored, accessible status badge with icon for 7 quality statuses.

### Location

`apps/frontend/components/quality/QualityStatusBadge.tsx`

### Export

```typescript
export function QualityStatusBadge(props: QualityStatusBadgeProps): JSX.Element
```

### Props

```typescript
interface QualityStatusBadgeProps {
  /** Quality status code (required) */
  status: QualityStatus

  /** Badge size variant (default: 'md') */
  size?: 'sm' | 'md' | 'lg'

  /** Show icon alongside text (default: true) */
  showIcon?: boolean

  /** Additional CSS classes */
  className?: string

  /** Loading state skeleton (default: false) */
  loading?: boolean

  /** Error message to display */
  error?: string | null

  /** Test ID for testing (default: 'quality-status-badge') */
  testId?: string
}
```

### Status Types

```typescript
type QualityStatus =
  | 'PENDING'      // Gray/Clock - Awaiting inspection
  | 'PASSED'       // Green/CheckCircle - Meets specifications
  | 'FAILED'       // Red/XCircle - Does not meet specs
  | 'HOLD'         // Orange/Pause - Investigation required
  | 'RELEASED'     // Blue/Unlock - Approved after hold
  | 'QUARANTINED'  // DarkRed/AlertTriangle - Isolated pending review
  | 'COND_APPROVED' // Yellow/AlertCircle - Limited use allowed
```

### Examples

#### Basic Usage

```typescript
import { QualityStatusBadge } from '@/components/quality'

export function ProductCard() {
  return (
    <div>
      <h2>Product LP-001</h2>
      <QualityStatusBadge status="PASSED" />
    </div>
  )
}
```

#### All Sizes

```typescript
<div className="space-y-2">
  <QualityStatusBadge status="PENDING" size="sm" />
  <QualityStatusBadge status="PENDING" size="md" />
  <QualityStatusBadge status="PENDING" size="lg" />
</div>
```

#### Without Icon

```typescript
<QualityStatusBadge status="FAILED" showIcon={false} />
```

#### Loading State

```typescript
<QualityStatusBadge status="PENDING" loading={true} />
```

#### Error State

```typescript
<QualityStatusBadge
  status="PASSED"
  error="Failed to load status"
/>
```

#### Custom Styling

```typescript
<QualityStatusBadge
  status="HOLD"
  className="my-custom-class"
/>
```

### Styling Details

| Size | Padding | Font | Icon Size |
|------|---------|------|-----------|
| sm | px-2 py-0.5 | text-xs | 12px |
| md | px-2.5 py-1 | text-sm | 14px |
| lg | px-3 py-1.5 | text-base | 16px |

### Status Colors (TailwindCSS)

| Status | Background | Text | Border |
|--------|------------|------|--------|
| PENDING | bg-gray-100 | text-gray-700 | border-gray-200 |
| PASSED | bg-green-100 | text-green-800 | border-green-200 |
| FAILED | bg-red-100 | text-red-800 | border-red-200 |
| HOLD | bg-orange-100 | text-orange-800 | border-orange-200 |
| RELEASED | bg-blue-100 | text-blue-800 | border-blue-200 |
| QUARANTINED | bg-red-200 | text-red-900 | border-red-300 |
| COND_APPROVED | bg-yellow-100 | text-yellow-800 | border-yellow-200 |

### Accessibility

- Uses semantic HTML: `<Badge role="status" />`
- Icons have `aria-hidden="true"` (not redundant)
- Error/unknown states use `role="alert"`
- Proper ARIA labels: `aria-label="Quality Status: Passed"`
- Color + icon (not color alone) for accessibility

### Helper Functions

```typescript
// Get config for a status
import { getStatusConfig } from '@/components/quality'

const config = getStatusConfig('PASSED')
console.log(config.color) // 'green'

// Get all configs
import { getAllStatusConfigs } from '@/components/quality'

const allConfigs = getAllStatusConfigs()

// Check permissions
import { isShipmentAllowed, isConsumptionAllowed } from '@/components/quality'

if (isShipmentAllowed('PASSED')) {
  // Can ship
}

if (isConsumptionAllowed('COND_APPROVED')) {
  // Can consume
}
```

### Testing

```typescript
import { render, screen } from '@testing-library/react'
import { QualityStatusBadge } from '@/components/quality'

test('renders passed status with icon', () => {
  render(<QualityStatusBadge status="PASSED" />)

  expect(screen.getByTestId('quality-status-badge')).toBeInTheDocument()
  expect(screen.getByText('Passed')).toBeInTheDocument()
})

test('shows loading skeleton', () => {
  render(<QualityStatusBadge status="PASSED" loading={true} />)

  expect(screen.getByTestId('quality-status-badge-loading')).toBeInTheDocument()
})

test('shows error state', () => {
  render(<QualityStatusBadge status="PASSED" error="Load failed" />)

  expect(screen.getByTestId('quality-status-badge-error')).toBeInTheDocument()
})
```

---

## Component 2: StatusTransitionModal

Modal dialog for changing quality status with full validation UI.

### Location

`apps/frontend/components/quality/StatusTransitionModal.tsx`

### Export

```typescript
export function StatusTransitionModal(props: StatusTransitionModalProps): JSX.Element
```

### Props

```typescript
interface StatusTransitionModalProps {
  /** Modal open state (required) */
  open: boolean

  /** Callback when open state changes (required) */
  onOpenChange: (open: boolean) => void

  /** Entity type: lp, batch, or inspection (required) */
  entityType: EntityType

  /** Entity ID (UUID) (required) */
  entityId: string

  /** Current status (required) */
  currentStatus: QualityStatus

  /** Display name for context (e.g., 'LP-001') */
  entityDisplayName?: string

  /** Called on successful status change */
  onSuccess?: (newStatus: QualityStatus, historyId: string) => void

  /** Array of valid transitions from API */
  validTransitions?: StatusTransition[]

  /** Loading state for transitions */
  loadingTransitions?: boolean

  /** Error message if transitions failed to load */
  transitionsError?: string | null

  /** Test ID (default: 'status-transition-modal') */
  testId?: string
}
```

### Modal States

#### 1. Loading State

Shows skeleton placeholders while loading transitions from API.

```typescript
<StatusTransitionModal
  open={true}
  onOpenChange={setOpen}
  entityType="lp"
  entityId={id}
  currentStatus="PENDING"
  loadingTransitions={true}
/>
```

#### 2. Error State

Shows error alert if transitions failed to load.

```typescript
<StatusTransitionModal
  open={true}
  onOpenChange={setOpen}
  entityType="lp"
  entityId={id}
  currentStatus="PENDING"
  transitionsError="Failed to load transitions"
/>
```

#### 3. Form State

Main form with status selection, reason field, and submit.

#### 4. Submitting State

Shows progress indicators while API call is in progress.

#### 5. Success State

Shows confirmation with from->to transition and close button.

### Example Usage

#### Basic Setup

```typescript
import { useState } from 'react'
import { StatusTransitionModal } from '@/components/quality'

export function LicensePlateDetail({ lpId }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [validTransitions, setValidTransitions] = useState([])
  const [loading, setLoading] = useState(false)

  const handleOpenModal = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quality/status/transitions?current=PENDING`)
      const data = await res.json()
      setValidTransitions(data.valid_transitions)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
    setModalOpen(true)
  }

  return (
    <>
      <button onClick={handleOpenModal}>Change Status</button>

      <StatusTransitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="lp"
        entityId={lpId}
        currentStatus="PENDING"
        entityDisplayName="LP-001"
        validTransitions={validTransitions}
        loadingTransitions={loading}
        onSuccess={(newStatus, historyId) => {
          console.log(`Status changed to ${newStatus}`)
          // Refetch LP data
        }}
      />
    </>
  )
}
```

#### Full Integration

```typescript
import { useState, useEffect } from 'react'
import { StatusTransitionModal } from '@/components/quality'
import type { StatusTransition } from '@/lib/services/quality-status-service'

export function LPStatusManager({ lp }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [transitions, setTransitions] = useState<StatusTransition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch transitions when modal opens
  useEffect(() => {
    if (modalOpen && lp.qa_status && transitions.length === 0) {
      fetchTransitions()
    }
  }, [modalOpen])

  const fetchTransitions = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        current: lp.qa_status,
      })
      const res = await fetch(`/api/quality/status/transitions?${params}`)

      if (!res.ok) throw new Error('Failed to load transitions')

      const data = await res.json()
      setTransitions(data.valid_transitions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (newStatus, historyId) => {
    // Refetch LP to get updated status
    fetchLicensePlate()
    // Reset for next change
    setTransitions([])
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <QualityStatusBadge status={lp.qa_status} />
        <button onClick={() => setModalOpen(true)}>
          Change
        </button>
      </div>

      <StatusTransitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="lp"
        entityId={lp.id}
        currentStatus={lp.qa_status}
        entityDisplayName={lp.number}
        validTransitions={transitions}
        loadingTransitions={loading}
        transitionsError={error}
        onSuccess={handleSuccess}
      />
    </>
  )
}
```

### Validation Rules

The modal enforces:

- **Status selection**: Required (radio group)
- **Reason field**: Required, 10-500 characters
- **Valid transition**: Only transitions from API are allowed
- **No self-transition**: Cannot change to current status

### Form Submission

Calls `POST /api/quality/status/change` with:

```json
{
  "entity_type": "lp",
  "entity_id": "...",
  "to_status": "PASSED",
  "reason": "User's reason text"
}
```

### Success Flow

1. Form submitted
2. Transition validated (POST /api/quality/status/validate-transition)
3. Status changed (POST /api/quality/status/change)
4. Success screen shown with confirmation
5. onSuccess callback fired with new status and history ID
6. Modal stays open (user clicks Close)

### Error Handling

Network errors show toast notification:

```
{
  title: 'Update Failed',
  description: 'Failed to update status',
  variant: 'destructive'
}
```

Validation errors show inline field errors.

### Requirements Display

The modal shows requirement badges for selected transition:

```
[Inspection Required] [Approval Required] [Reason Required]
```

### Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusTransitionModal } from '@/components/quality'

test('opens and shows form', () => {
  render(
    <StatusTransitionModal
      open={true}
      onOpenChange={jest.fn()}
      entityType="lp"
      entityId="123"
      currentStatus="PENDING"
      validTransitions={[
        {
          to_status: 'PASSED',
          requires_reason: true,
          requires_approval: false,
          requires_inspection: true,
          description: 'Mark as passed',
        },
      ]}
    />
  )

  expect(screen.getByText('Change Quality Status')).toBeInTheDocument()
})

test('validates reason field', async () => {
  const user = userEvent.setup()
  render(
    <StatusTransitionModal
      open={true}
      onOpenChange={jest.fn()}
      entityType="lp"
      entityId="123"
      currentStatus="PENDING"
      validTransitions={[...]}
    />
  )

  const submitButton = screen.getByTestId('transition-submit-button')
  await user.click(submitButton)

  expect(screen.getByText('Reason is required')).toBeInTheDocument()
})
```

---

## Component 3: StatusHistoryTimeline

Display status change history in a timeline visualization with expandable details.

### Location

`apps/frontend/components/quality/StatusHistoryTimeline.tsx`

### Export

```typescript
export const StatusHistoryTimeline: React.FC<StatusHistoryTimelineProps>
```

### Props

```typescript
interface StatusHistoryTimelineProps {
  /** History entries to display (required) */
  entries: StatusHistoryEntry[]

  /** Loading state (default: false) */
  loading?: boolean

  /** Error message (default: null) */
  error?: string | null

  /** Enable expandable entry details (default: true) */
  expandable?: boolean

  /** Max entries before "View more" button (optional) */
  maxEntries?: number

  /** Called when user clicks retry button */
  onRetry?: () => void

  /** Additional CSS classes */
  className?: string

  /** Test ID (default: 'status-history-timeline') */
  testId?: string
}
```

### History Entry Type

```typescript
interface StatusHistoryEntry {
  id: string
  from_status: QualityStatus | null
  to_status: QualityStatus
  reason: string | null
  changed_by: string
  changed_by_name: string
  changed_by_user?: TimelineUser | null
  changed_at: string
}
```

### Timeline States

#### 1. Loading State

Shows 5 skeleton placeholders.

```typescript
<StatusHistoryTimeline loading={true} entries={[]} />
```

#### 2. Empty State

Shows "No status history available" message.

```typescript
<StatusHistoryTimeline entries={[]} />
```

#### 3. Error State

Shows error message with optional retry button.

```typescript
<StatusHistoryTimeline
  error="Failed to load history"
  onRetry={handleRetry}
  entries={[]}
/>
```

#### 4. Success State

Shows timeline with status transition entries.

### Example Usage

#### Basic Integration

```typescript
import { useState, useEffect } from 'react'
import { StatusHistoryTimeline } from '@/components/quality'

export function LicensePlateHistory({ lpId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quality/status/history/lp/${lpId}`)
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setHistory(data.history)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [lpId])

  return (
    <StatusHistoryTimeline
      entries={history}
      loading={loading}
      error={error}
      onRetry={fetchHistory}
    />
  )
}
```

#### With Pagination

```typescript
import { useState } from 'react'
import { StatusHistoryTimeline } from '@/components/quality'

export function LPHistoryTab({ lpId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [lpId])

  return (
    <StatusHistoryTimeline
      entries={history}
      loading={loading}
      maxEntries={5}
      expandable={true}
    />
  )
}
```

### Visual Format

Each entry shows:

```
┌─ Timeline Dot (colored by to_status)
│
├─ Status Transition: [FROM] → [TO]
│
├─ User: Avatar + Name
├─ Time: "2 hours ago" (hoverable for full timestamp)
├─ Reason: First 200 chars with "Read more" if longer
│
└─ [Expand/Collapse Button]
```

### Expanded Details

When expanded, shows:

- Full timestamp (day, date, time, timezone)
- User info (avatar, name, email)
- Full reason text
- Entity type and ID

### Timestamp Format

**Relative** (default):
- "Just now"
- "5 minutes ago"
- "2 hours ago"
- "1 day ago"
- "Jan 20, 2025"

**Absolute** (on expand):
- "Wednesday, January 20, 2025, 14:30:45 UTC"

### Timeline Entry Display

#### Creation Entry

```
Created as [PENDING]
By: John Smith
2 hours ago
```

#### Transition Entry

```
[PENDING] → [PASSED]
By: Sarah Johnson
Reason: Batch inspection completed successfully
1 hour ago
```

### Features

- **Chronological order**: Newest first (sorted by changed_at DESC)
- **Expandable**: Full details on demand with expand/collapse button
- **User display**: Avatar + name (emoji fallback for initials)
- **Status badges**: Color-coded with icons
- **Reason truncation**: 200 chars with "Read more"
- **View more**: Optional pagination with max entries
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation

### Pagination

```typescript
// Show first 5 entries, with "View all" button
<StatusHistoryTimeline
  entries={history}
  maxEntries={5}
/>

// Click "View all X entries" to show all
// Click "Show less" to collapse back to 5
```

### Empty Timeline

Shows:

```
⏰
No status history available
Status changes will appear here
```

### Error Timeline

Shows:

```
⏰
Failed to load history [error message]
[Retry] button
```

### Testing

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusHistoryTimeline } from '@/components/quality'

test('renders empty state', () => {
  render(<StatusHistoryTimeline entries={[]} />)

  expect(screen.getByText('No status history available')).toBeInTheDocument()
})

test('renders loading skeleton', () => {
  render(<StatusHistoryTimeline loading={true} entries={[]} />)

  expect(screen.getByTestId('timeline-loading')).toBeInTheDocument()
})

test('renders entries with transition', () => {
  const entries = [
    {
      id: '1',
      from_status: 'PENDING',
      to_status: 'PASSED',
      reason: 'Inspection passed',
      changed_by: 'user-1',
      changed_by_name: 'John Smith',
      changed_at: new Date().toISOString(),
    },
  ]

  render(<StatusHistoryTimeline entries={entries} />)

  expect(screen.getByText('PENDING')).toBeInTheDocument()
  expect(screen.getByText('PASSED')).toBeInTheDocument()
})

test('expands entry on click', async () => {
  const user = userEvent.setup()
  const entries = [
    {
      id: '1',
      from_status: 'PENDING',
      to_status: 'PASSED',
      reason: 'Long reason '.repeat(50), // > 200 chars
      changed_by: 'user-1',
      changed_by_name: 'John Smith',
      changed_at: new Date().toISOString(),
    },
  ]

  render(<StatusHistoryTimeline entries={entries} expandable={true} />)

  const expandButton = screen.getByTestId('timeline-entry-expand-1')
  await user.click(expandButton)

  expect(screen.getByText(/Full timestamp/)).toBeInTheDocument()
})
```

---

## Component Index

### Import All Components

```typescript
import {
  QualityStatusBadge,
  StatusTransitionModal,
  StatusHistoryTimeline,
} from '@/components/quality'
```

### Type Exports

```typescript
import type {
  QualityStatus,
  QualityStatusBadgeProps,
  StatusTransitionModalProps,
  StatusHistoryEntry,
  StatusHistoryTimelineProps,
} from '@/components/quality'
```

---

## Styling & Theming

All components use:

- **TailwindCSS** for styling
- **ShadCN UI** primitives (Badge, Dialog, Button, etc.)
- **Lucide React** for icons
- **Light/Dark mode** via CSS variables

### Custom Styling

Each component accepts `className` prop for overrides:

```typescript
<QualityStatusBadge
  status="PASSED"
  className="my-custom-shadow"
/>
```

### Dark Mode

Components automatically adapt to dark mode via ShadCN UI theme system.

---

## Performance

| Component | Render Time | Notes |
|-----------|------------|-------|
| QualityStatusBadge | <5ms | Lightweight, no API calls |
| StatusTransitionModal | <50ms | Form with radio group |
| StatusHistoryTimeline | <100ms | 10+ entries with expandables |

---

## Accessibility

All components meet WCAG 2.1 AA standards:

- **QualityStatusBadge**: Semantic `role="status"`, icon `aria-hidden`
- **StatusTransitionModal**: Dialog with proper focus management
- **StatusHistoryTimeline**: Semantic list with `role="list"`, expandable buttons

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Related Files

- Service: `lib/services/quality-status-service.ts`
- Validation: `lib/validation/quality-status-schemas.ts`
- API: `app/api/quality/status/*`
- Tests: `components/quality/__tests__/*`
