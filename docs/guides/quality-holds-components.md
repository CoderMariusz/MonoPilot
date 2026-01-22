# Quality Holds Component Guide

UI components for managing quality holds in MonoPilot. Includes list displays, forms, modals, and status indicators with aging alerts.

## Component Overview

| Component | Purpose | Location | States |
|-----------|---------|----------|--------|
| HoldStatusBadge | Display hold status with color coding | `components/quality/holds/` | active, released, disposed |
| HoldPriorityBadge | Display priority level with urgency color | `components/quality/holds/` | low, medium, high, critical |
| HoldTypeBadge | Display hold type category | `components/quality/holds/` | qa_pending, investigation, recall, quarantine |
| AgingIndicatorCompact | Show aging status inline in table rows | `components/quality/holds/` | normal, warning, critical |
| AgingIndicatorFull | Large aging display for detail page | `components/quality/holds/` | normal, warning, critical + tooltip |
| HoldForm | Create/edit quality hold form with item selection | `components/quality/holds/` | creation, edit |
| ReleaseModal | Modal for releasing hold with disposition | `components/quality/holds/` | disposition selection |
| HoldItemsTable | Display items on hold with reference links | `components/quality/holds/` | loading, empty, data |
| HoldTable | Paginated holds list with filters | `components/quality/holds/` | loading, empty, error, data |
| HoldStats | Dashboard stats cards | `components/quality/holds/` | loading, data |

---

## Status Badge Component

Display hold status with semantic color coding.

**Location:** `apps/frontend/components/quality/holds/HoldStatusBadge.tsx`

**Usage:**

```tsx
import { HoldStatusBadge } from '@/components/quality/holds'

export function HoldRow({ hold }) {
  return (
    <div>
      <HoldStatusBadge status={hold.status} />
    </div>
  )
}
```

**Props:**

```typescript
interface HoldStatusBadgeProps {
  status: 'active' | 'released' | 'disposed'
  className?: string // Additional CSS classes
}
```

**Rendering:**

| Status | Badge Color | Icon |
|--------|------------|------|
| active | Blue | Clock |
| released | Green | CheckCircle |
| disposed | Gray | Trash2 |

**Examples:**

```tsx
// Active hold
<HoldStatusBadge status="active" />
// Renders: Blue badge with "Active" text

// Released hold
<HoldStatusBadge status="released" />
// Renders: Green badge with "Released" text

// With custom styling
<HoldStatusBadge status="active" className="text-sm" />
```

---

## Priority Badge Component

Display hold priority with color-coded urgency.

**Location:** `apps/frontend/components/quality/holds/HoldPriorityBadge.tsx`

**Usage:**

```tsx
import { HoldPriorityBadge } from '@/components/quality/holds'

export function HoldRow({ hold }) {
  return (
    <div>
      <HoldPriorityBadge priority={hold.priority} />
    </div>
  )
}
```

**Props:**

```typescript
interface HoldPriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical'
  showLabel?: boolean // Show text label (default: true)
  className?: string
}
```

**Rendering:**

| Priority | Badge Color | Background |
|----------|-------------|-----------|
| low | Gray | Light gray |
| medium | Blue | Light blue |
| high | Orange | Light orange |
| critical | Red | Light red |

**Examples:**

```tsx
// High priority
<HoldPriorityBadge priority="high" />
// Renders: Orange badge with "High" text

// Critical without label
<HoldPriorityBadge priority="critical" showLabel={false} />
// Renders: Red dot icon only

// With custom class
<HoldPriorityBadge priority="critical" className="text-lg font-bold" />
```

---

## Hold Type Badge Component

Display hold type category with icon.

**Location:** `apps/frontend/components/quality/holds/HoldTypeBadge.tsx`

**Usage:**

```tsx
import { HoldTypeBadge } from '@/components/quality/holds'

export function HoldDetail({ hold }) {
  return <HoldTypeBadge holdType={hold.hold_type} />
}
```

**Props:**

```typescript
interface HoldTypeBadgeProps {
  holdType: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  showLabel?: boolean // Default: true
  className?: string
}
```

**Rendering:**

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| qa_pending | Clock | Blue | Awaiting QA results |
| investigation | Microscope | Purple | Under investigation |
| recall | AlertTriangle | Red | Safety recall |
| quarantine | Lock | Orange | Isolated/contaminated |

**Examples:**

```tsx
<HoldTypeBadge holdType="investigation" />
// Renders: Purple badge with microscope icon and "Investigation" text

<HoldTypeBadge holdType="recall" showLabel={false} />
// Renders: Red alert triangle icon only
```

---

## Aging Indicator Compact Component

Inline aging status indicator for table rows.

**Location:** `apps/frontend/components/quality/holds/AgingIndicatorCompact.tsx`

**Usage:**

```tsx
import { AgingIndicatorCompact } from '@/components/quality/holds'

export function HoldTableRow({ hold }) {
  return (
    <TableRow>
      <TableCell>{hold.hold_number}</TableCell>
      <TableCell>
        <AgingIndicatorCompact
          agingHours={hold.aging_hours}
          agingStatus={hold.aging_status}
          priority={hold.priority}
        />
      </TableCell>
    </TableRow>
  )
}
```

**Props:**

```typescript
interface AgingIndicatorCompactProps {
  agingHours: number // Hours since hold creation
  agingStatus: 'normal' | 'warning' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'critical'
  className?: string
}
```

**Rendering:**

| Status | Icon | Color | Tooltip |
|--------|------|-------|---------|
| normal | - | Green | "Hold aging: 12 hours" |
| warning | AlertCircle | Yellow | "Hold aging: 52 hours (WARNING)" |
| critical | AlertCircle | Red | "Hold aging: 72 hours (CRITICAL)" |

**Examples:**

```tsx
// Normal hold (4 hours old)
<AgingIndicatorCompact
  agingHours={4}
  agingStatus="normal"
  priority="high"
/>
// Renders: Green checkmark, no alert

// Warning status (26 hours old, high priority)
<AgingIndicatorCompact
  agingHours={26}
  agingStatus="warning"
  priority="high"
/>
// Renders: Yellow alert icon with tooltip

// Critical status (50 hours old, critical priority)
<AgingIndicatorCompact
  agingHours={50}
  agingStatus="critical"
  priority="critical"
/>
// Renders: Red alert icon with tooltip
```

---

## Aging Indicator Full Component

Large aging display for hold detail page with detailed information.

**Location:** `apps/frontend/components/quality/holds/AgingIndicatorFull.tsx`

**Usage:**

```tsx
import { AgingIndicatorFull } from '@/components/quality/holds'

export function HoldDetailPage({ hold }) {
  return (
    <div>
      <AgingIndicatorFull
        agingHours={hold.aging_hours}
        agingStatus={hold.aging_status}
        priority={hold.priority}
        heldAt={hold.held_at}
      />
    </div>
  )
}
```

**Props:**

```typescript
interface AgingIndicatorFullProps {
  agingHours: number
  agingStatus: 'normal' | 'warning' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'critical'
  heldAt: ISO8601 string // Timestamp when hold created
  showThresholds?: boolean // Show aging thresholds (default: true)
  className?: string
}
```

**Rendering:**

Shows:
- Large icon (checkmark, warning, or alert)
- Aging status label
- Exact hours and days elapsed
- Time held (formatted date/time)
- Aging threshold for this priority
- Banner message if critical

**Examples:**

```tsx
// Warning status
<AgingIndicatorFull
  agingHours={52.5}
  agingStatus="warning"
  priority="high"
  heldAt="2025-12-16T14:30:00Z"
/>
// Renders:
// Yellow warning icon
// "Hold aging: 52 hours 30 minutes (WARNING)"
// "Threshold for High priority: 48 hours"
// "Held since: Dec 16, 2:30 PM"

// Critical status with threshold display
<AgingIndicatorFull
  agingHours={28.75}
  agingStatus="critical"
  priority="critical"
  heldAt="2025-12-16T10:00:00Z"
  showThresholds={true}
/>
// Renders:
// Red alert icon
// "Hold aging: 28 hours 45 minutes (CRITICAL)"
// "Threshold for Critical priority: 24 hours"
// Banner: "This hold has been active for 28 hours. Please review and release or escalate."
```

---

## Hold Form Component

Form for creating or editing quality holds with item selection.

**Location:** `apps/frontend/components/quality/holds/HoldForm.tsx`

**Usage:**

```tsx
import { HoldForm } from '@/components/quality/holds'

export function CreateHoldPage() {
  return (
    <HoldForm
      onSubmit={async (data) => {
        const response = await fetch('/api/quality/holds', {
          method: 'POST',
          body: JSON.stringify(data)
        })
        return response.json()
      }}
      onSuccess={() => {
        navigate('/quality/holds')
      }}
    />
  )
}
```

**Props:**

```typescript
interface HoldFormProps {
  onSubmit: (data: CreateHoldInput) => Promise<any>
  onSuccess?: (hold: QualityHold) => void
  onError?: (error: Error) => void
  isLoading?: boolean
  defaultValues?: Partial<CreateHoldInput>
  submitButtonText?: string // Default: "Create Hold"
}

interface CreateHoldInput {
  reason: string
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  items: Array<{
    reference_type: 'lp' | 'wo' | 'batch'
    reference_id: string
    quantity_held?: number
    uom?: string
    notes?: string
  }>
}
```

**Fields:**

1. **Reason** (textarea)
   - Required
   - 10-500 characters
   - Placeholder: "Why is this hold being placed? (e.g., Failed metal detection test)"
   - Shows character count

2. **Hold Type** (select dropdown)
   - Required
   - Options: qa_pending, investigation, recall, quarantine
   - Default: investigation

3. **Priority** (select dropdown)
   - Optional
   - Options: low, medium, high, critical
   - Default: medium
   - Shows color-coded badges

4. **Items** (table with add/remove)
   - Required (minimum 1 item)
   - Table columns: Type, Reference, Quantity, UOM, Location, Actions
   - [+ Add Item] button opens item selection modal
   - Each row has [Delete] button

**Item Selection Modal:**

When [+ Add Item] clicked:
1. Modal opens showing available items (LPs, WOs, batches)
2. Items filtered by organization
3. User selects items to add
4. Selected items appear in form table

**Validation:**

- Reason: Required, 10-500 chars
- Hold Type: Required, valid enum value
- Priority: Valid enum or optional
- Items: Required, minimum 1 item, no duplicates

**Error Handling:**

- Shows validation errors inline under fields
- API errors displayed in toast notification
- Form disabled during submission

**Examples:**

```tsx
// Create hold form
<HoldForm
  onSubmit={createHold}
  onSuccess={() => router.push('/quality/holds')}
  submitButtonText="Create Hold"
/>

// Edit form (if needed in future)
<HoldForm
  onSubmit={updateHold}
  defaultValues={{
    reason: "Current reason",
    hold_type: "investigation",
    priority: "high"
  }}
  submitButtonText="Update Hold"
/>
```

---

## Release Modal Component

Modal for releasing hold with disposition decision.

**Location:** `apps/frontend/components/quality/holds/ReleaseModal.tsx`

**Usage:**

```tsx
import { ReleaseModal } from '@/components/quality/holds'

export function HoldDetailPage({ hold }) {
  const [releaseOpen, setReleaseOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setReleaseOpen(true)}>Release Hold</Button>

      <ReleaseModal
        hold={hold}
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onRelease={async (disposition, notes) => {
          await fetch(`/api/quality/holds/${hold.id}/release`, {
            method: 'PATCH',
            body: JSON.stringify({ disposition, release_notes: notes })
          })
        }}
        onSuccess={() => {
          setReleaseOpen(false)
          refreshHold()
        }}
      />
    </>
  )
}
```

**Props:**

```typescript
interface ReleaseModalProps {
  hold: QualityHold
  open: boolean
  onOpenChange: (open: boolean) => void
  onRelease: (disposition: string, notes: string) => Promise<any>
  onSuccess?: () => void
  onError?: (error: Error) => void
  isLoading?: boolean
}
```

**Modal Content:**

1. **Header**: "Release Hold {hold_number}"
2. **Hold Summary**: Number, reason, status, priority, items count
3. **Disposition Selection** (radio buttons):
   - **Release** - Item approved, safe to consume (→ LP qa_status = "passed")
   - **Rework** - Item needs reprocessing (→ LP qa_status = "pending")
   - **Scrap** - Item destroyed, no longer available (→ LP qa_status = "failed", qty = 0)
   - **Return** - Item returned to supplier (→ LP qa_status = "failed")

4. **Release Notes** (textarea)
   - Required
   - 10-1000 characters
   - Placeholder: "Why is the hold being released? (e.g., All items passed re-inspection)"
   - Shows character count

5. **Items Summary**:
   - List of affected items and their reference types
   - Shows how many LPs will have qa_status updated

6. **Actions**:
   - [Cancel] - Close modal without releasing
   - [Confirm Release] - Submit release request (disabled until disposition selected and notes entered)

**Validation:**

- Disposition: Required, valid enum value
- Release Notes: Required, 10-1000 chars

**Error Handling:**

- Validation errors shown inline
- API errors displayed in toast
- Modal stays open on error for retry
- Loading state on [Confirm Release] button

**Examples:**

```tsx
// Standard release workflow
<ReleaseModal
  hold={selectedHold}
  open={true}
  onOpenChange={setOpen}
  onRelease={async (disposition, notes) => {
    const res = await releaseHoldAPI(selectedHold.id, disposition, notes)
    return res
  }}
  onSuccess={() => {
    setOpen(false)
    toast.success(`Hold released with disposition: ${disposition}`)
    reloadHold()
  }}
/>
```

---

## Hold Items Table Component

Display items on hold with reference links.

**Location:** `apps/frontend/components/quality/holds/HoldItemsTable.tsx`

**Usage:**

```tsx
import { HoldItemsTable } from '@/components/quality/holds'

export function HoldDetailPage({ hold, items }) {
  return (
    <div>
      <h3>Items on Hold</h3>
      <HoldItemsTable
        items={items}
        holdStatus={hold.status}
        isLoading={false}
      />
    </div>
  )
}
```

**Props:**

```typescript
interface HoldItemsTableProps {
  items: QualityHoldItem[]
  holdStatus: 'active' | 'released' | 'disposed'
  isLoading?: boolean
  className?: string
}

interface QualityHoldItem {
  id: string
  reference_type: 'lp' | 'wo' | 'batch'
  reference_display: string // LP-001, WO-001, etc.
  reference_id: string
  quantity_held?: number | null
  uom?: string | null
  location_name?: string | null
  notes?: string | null
  created_at: string
}
```

**Columns:**

| Column | Content | Link |
|--------|---------|------|
| Type | Icon + Type label (LP, WO, Batch) | - |
| Reference | Reference display (LP-001, WO-005, etc.) | Clickable to detail page |
| Quantity | quantity_held + uom (e.g., "150 KG") | - |
| Location | location_name if LP (e.g., "Warehouse A - Shelf 3") | - |
| Notes | Item notes if present | - |
| Created | Formatted timestamp when added to hold | - |

**States:**

- **Loading**: Skeleton rows while fetching
- **Empty**: "No items on hold" message
- **Data**: Table with item rows

**Examples:**

```tsx
// With items
<HoldItemsTable
  items={[
    {
      id: "item-1",
      reference_type: "lp",
      reference_display: "LP-20251216-001",
      reference_id: "lp-001",
      quantity_held: 150,
      uom: "KG",
      location_name: "Warehouse A - Shelf 3",
      notes: "Metal contamination detected",
      created_at: "2025-12-16T14:30:00Z"
    }
  ]}
  holdStatus="active"
/>

// Empty state
<HoldItemsTable items={[]} holdStatus="active" />
// Renders: "No items on hold" message
```

---

## Hold Table Component

Paginated holds list with filters and aging indicators.

**Location:** `apps/frontend/app/(authenticated)/quality/holds/components/HoldTable.tsx`

**Usage:**

```tsx
import { HoldTable } from '@/components/quality/holds'

export function QualityHoldsPage() {
  return (
    <HoldTable
      onSelectHold={(hold) => navigate(`/quality/holds/${hold.id}`)}
    />
  )
}
```

**Props:**

```typescript
interface HoldTableProps {
  onSelectHold?: (hold: QualityHoldSummary) => void
  className?: string
}

interface QualityHoldSummary {
  id: string
  hold_number: string
  status: 'active' | 'released' | 'disposed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  reason: string
  items_count: number
  held_by: { id: string; name: string }
  held_at: string
  aging_hours: number
  aging_status: 'normal' | 'warning' | 'critical'
}
```

**Features:**

1. **Filters** (top):
   - Status filter (active, released, disposed)
   - Priority filter (low, medium, high, critical)
   - Search by hold_number or reason (debounced)

2. **Table Columns**:
   - Hold Number (clickable)
   - Status (badge)
   - Priority (color-coded badge)
   - Reason (truncated)
   - Items Count
   - Held By (user name)
   - Held At (formatted date)
   - Aging (indicator with tooltip)

3. **Pagination**:
   - Page size selector (10, 20, 50)
   - Previous/Next buttons
   - Page indicator (e.g., "Page 1 of 5")
   - Limit 100 holds per page max

4. **States**:
   - Loading: Skeleton rows
   - Empty: "No holds found" with create button
   - Error: Error message with retry button
   - Data: Table with holds

**Examples:**

```tsx
// Simple usage
<HoldTable />

// With callback
<HoldTable
  onSelectHold={(hold) => {
    console.log('Selected hold:', hold)
    navigate(`/quality/holds/${hold.id}`)
  }}
/>
```

---

## Hold Stats Component

Dashboard stats cards for hold overview.

**Location:** `apps/frontend/components/quality/holds/HoldStats.tsx`

**Usage:**

```tsx
import { HoldStats } from '@/components/quality/holds'

export function QualityDashboard() {
  return <HoldStats />
}
```

**Props:**

```typescript
interface HoldStatsProps {
  className?: string
  isLoading?: boolean
}
```

**Stats Cards:**

1. **Active Holds**
   - Value: active_count
   - Icon: Clock
   - Action: Click to filter list

2. **Released Today**
   - Value: released_today
   - Icon: CheckCircle
   - Shows daily progress

3. **Aging Critical**
   - Value: aging_critical
   - Icon: AlertTriangle
   - Color: Red alert

4. **By Priority** (breakdown)
   - Shows counts: low, medium, high, critical
   - Small bar chart or list

5. **By Type** (breakdown)
   - Shows counts: qa_pending, investigation, recall, quarantine
   - Small bar chart or list

6. **Avg Resolution Time**
   - Value: avg_resolution_time_hours (with "h" suffix)
   - Shows trend

**Example:**

```tsx
<HoldStats />
// Renders:
// ┌─────────────────┬──────────────────┬──────────────────┐
// │ Active Holds: 19│ Released Today: 3 │ Aging Critical: 2│
// └─────────────────┴──────────────────┴──────────────────┘
//
// By Priority:          By Type:
// ◼ Critical: 3         ◼ Investigation: 8
// ◼ High: 6             ◼ Quarantine: 2
// ◼ Medium: 8           ◼ Recall: 4
// ◼ Low: 2              ◼ QA Pending: 5
//
// Avg Resolution: 18.5h
```

---

## Complete Hold Detail Page Example

Putting components together for hold detail page:

```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  HoldStatusBadge,
  HoldPriorityBadge,
  HoldTypeBadge,
  AgingIndicatorFull,
  HoldItemsTable,
  ReleaseModal
} from '@/components/quality/holds'

export function HoldDetailPage() {
  const { id } = useParams()
  const [hold, setHold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [releaseOpen, setReleaseOpen] = useState(false)

  useEffect(() => {
    loadHold()
  }, [id])

  const loadHold = async () => {
    try {
      const res = await fetch(`/api/quality/holds/${id}`)
      const data = await res.json()
      setHold(data.hold)
      setItems(data.items)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Skeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{hold.hold_number}</h1>
          <div className="flex gap-2 mt-2">
            <HoldStatusBadge status={hold.status} />
            <HoldPriorityBadge priority={hold.priority} />
            <HoldTypeBadge holdType={hold.hold_type} />
          </div>
        </div>
        {hold.status === 'active' && (
          <Button onClick={() => setReleaseOpen(true)}>Release Hold</Button>
        )}
      </div>

      {/* Aging Indicator */}
      {hold.status === 'active' && (
        <AgingIndicatorFull
          agingHours={hold.aging_hours}
          agingStatus={hold.aging_status}
          priority={hold.priority}
          heldAt={hold.held_at}
        />
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-500">Reason</label>
          <p>{hold.reason}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Held By</label>
          <p>{hold.held_by.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Created</label>
          <p>{new Date(hold.held_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Items on Hold */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Items on Hold</h2>
        <HoldItemsTable items={items} holdStatus={hold.status} />
      </div>

      {/* Release Information (if released) */}
      {hold.status === 'released' && (
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <h3 className="font-semibold text-green-900">Release Information</h3>
          <p className="text-green-800">
            Released by {hold.released_by.name} on{' '}
            {new Date(hold.released_at).toLocaleString()}
          </p>
          <p className="text-green-800 mt-2">
            Disposition: <strong>{hold.disposition}</strong>
          </p>
          <p className="text-green-800 mt-2">{hold.release_notes}</p>
        </div>
      )}

      {/* Release Modal */}
      <ReleaseModal
        hold={hold}
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onRelease={async (disposition, notes) => {
          await fetch(`/api/quality/holds/${hold.id}/release`, {
            method: 'PATCH',
            body: JSON.stringify({
              disposition,
              release_notes: notes
            })
          })
        }}
        onSuccess={() => {
          setReleaseOpen(false)
          loadHold()
        }}
      />
    </div>
  )
}
```

---

## Component Styling

All components use ShadCN UI components with TailwindCSS:

- Badges: `Badge` component with `variant` prop
- Tables: ShadCN `Table` component
- Buttons: ShadCN `Button` with variants
- Modals: ShadCN `Dialog` component
- Form fields: ShadCN form inputs with validation

---

## Accessibility

All components include:

- Semantic HTML elements
- ARIA labels for icons
- Keyboard navigation support
- Focus management in modals
- Screen reader friendly status indicators
- Color + icon combinations (not color alone)

---

## Performance

- Components use `React.memo` to prevent unnecessary re-renders
- Tables use virtual scrolling for >100 items
- Modals are lazy-loaded
- API calls use React Query for caching
- Infinite scroll pagination support

---

## See Also

- [Quality Holds API Reference](../api/quality-holds-api.md)
- [Hold Workflow Guide](quality-holds-workflow.md)
- [Aging Alert Guide](quality-holds-aging-alerts.md)
