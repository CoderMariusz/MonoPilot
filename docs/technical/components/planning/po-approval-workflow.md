# Purchase Order Approval Workflow - Component Documentation

**Story**: 03.5b - PO Approval Workflow
**Version**: 1.0
**Last Updated**: 2026-01-02

## Overview

This document describes the React components implementing the PO approval workflow UI. The components follow ShadCN UI patterns and provide a complete approval experience including modals, history timelines, and status badges.

## Component Architecture

```
POApprovalModal           - Main approval/rejection modal
  ├─ POSummarySection    - PO header information
  ├─ POLinesSection      - Line items table (read-only)
  ├─ POTotalsSummary     - Totals breakdown
  ├─ ThresholdIndicator  - Approval threshold indicator
  └─ Form                - Approve/Reject form

POApprovalHistory         - Approval history timeline
  ├─ LoadingSkeleton     - Loading state
  ├─ ErrorState          - Error handling
  ├─ EmptyState          - No history message
  └─ TimelineEntry       - Individual history item

ApprovalStatusBadge       - Reusable status badge
```

---

## Components

### 1. POApprovalModal

Modal component for approving or rejecting purchase orders.

**File**: `apps/frontend/components/planning/purchase-orders/POApprovalModal.tsx`

#### Props

```typescript
interface POApprovalModalProps {
  po: PurchaseOrderWithLines;  // PO data with lines
  mode: 'approve' | 'reject';  // Modal mode
  open: boolean;               // Modal open state
  onOpenChange: (open: boolean) => void;  // Close handler
  onSuccess: () => void;       // Success callback
}
```

#### Usage

```tsx
import { POApprovalModal } from '@/components/planning/purchase-orders/POApprovalModal';

function PurchaseOrderDetail() {
  const [approvalMode, setApprovalMode] = useState<'approve' | 'reject'>('approve');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: po } = usePurchaseOrder(poId);

  const handleSuccess = () => {
    // Refetch PO data
    refetch();
    // Show success message
    toast({ title: 'Success', description: 'PO approved' });
  };

  return (
    <>
      <Button onClick={() => {
        setApprovalMode('approve');
        setIsModalOpen(true);
      }}>
        Approve
      </Button>

      <POApprovalModal
        po={po}
        mode={approvalMode}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

#### States

| State | Description | UI Behavior |
|-------|-------------|-------------|
| Loading | Fetching settings | Skeleton placeholders shown |
| Ready | Form ready for input | Normal form display |
| Submitting | API call in progress | Loading spinner, buttons disabled |
| Success | Action completed | Modal closes, success toast shown |
| Error | Action failed | Error message displayed, retry allowed |

#### Features

- **Dual Mode**: Single component handles both approve and reject actions
- **Form Validation**: Zod schemas enforce validation rules
- **Threshold Display**: Shows approval threshold context
- **Responsive**: Adapts to mobile and desktop viewports
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Error Handling**: Inline error messages, retry logic

#### Form Behavior

**Approve Mode**:
- Notes field is optional
- "Approve PO" button (green)
- Success message: "Purchase order approved successfully"

**Reject Mode**:
- Rejection reason is required (min 10 chars)
- "Reject PO" button (red/destructive)
- Success message: "Purchase order rejected. Creator has been notified."
- Form validation enforces minimum length

#### Example States

```tsx
// Approve mode with notes
<POApprovalModal
  po={po}
  mode="approve"
  open={true}
  onOpenChange={setOpen}
  onSuccess={handleSuccess}
/>

// Reject mode
<POApprovalModal
  po={po}
  mode="reject"
  open={true}
  onOpenChange={setOpen}
  onSuccess={handleSuccess}
/>
```

#### API Integration

```typescript
// Uses custom hooks from use-po-approval.ts
const { approvePO, rejectPO, isApproving, isRejecting } = usePOApproval();

// Approve action
await approvePO.mutateAsync({
  poId: po.id,
  notes: 'Budget approved',
});

// Reject action
await rejectPO.mutateAsync({
  poId: po.id,
  rejectionReason: 'Exceeds budget',
});
```

#### Validation Rules

**Approve Schema**:
```typescript
const approveSchema = z.object({
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});
```

**Reject Schema**:
```typescript
const rejectSchema = z.object({
  rejection_reason: z
    .string({ required_error: 'Rejection reason is required' })
    .min(1, 'Rejection reason is required')
    .refine((val) => val.length >= 10, {
      message: 'Reason must be at least 10 characters',
    })
    .refine((val) => val.length <= 1000, {
      message: 'Reason cannot exceed 1000 characters',
    }),
});
```

---

### 2. POApprovalHistory

Timeline component displaying approval history for a purchase order.

**File**: `apps/frontend/components/planning/purchase-orders/POApprovalHistory.tsx`

#### Props

```typescript
interface POApprovalHistoryProps {
  poId: string;        // Purchase Order ID
  maxItems?: number;   // Max items to display (default: 10)
  className?: string;  // Additional CSS classes
}
```

#### Usage

```tsx
import { POApprovalHistory } from '@/components/planning/purchase-orders/POApprovalHistory';

function PurchaseOrderDetail({ poId }: { poId: string }) {
  return (
    <div className="space-y-6">
      <POApprovalHistory poId={poId} maxItems={10} />
    </div>
  );
}
```

#### States

| State | Description | UI Behavior |
|-------|-------------|-------------|
| Loading | Fetching history | Skeleton timeline (3 placeholders) |
| Error | Fetch failed | Error icon, message, retry button |
| Empty | No history | Clock icon, "No approval history yet" |
| Success | History loaded | Timeline with entries |

#### Features

- **Timeline Display**: Vertical timeline with icons and connectors
- **Action Icons**: Visual indicators (clock, checkmark, X)
- **Color Coding**: Status-specific colors (yellow=pending, green=approved, red=rejected)
- **Timestamp Formatting**: Localized date/time display
- **Notes Display**: Shows approval/rejection notes
- **Pagination**: Shows "+N more entries" if exceeding maxItems
- **Auto-Refresh**: Refetches on PO status change

#### Timeline Entry Format

```tsx
<TimelineEntry>
  <Icon /> {/* Clock, CheckCircle2, or XCircle */}
  <Content>
    <Action>Approved</Action>
    <User>by John Smith (Manager)</User>
    <Timestamp>Jan 15, 2024, 2:32 PM</Timestamp>
    <Notes>Budget approved by finance committee.</Notes>
  </Content>
</TimelineEntry>
```

#### Action Configurations

```typescript
const actionConfig = {
  submitted: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Submitted for Approval',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Rejected',
  },
};
```

#### API Integration

```typescript
// Uses custom hook from use-po-approval-history.ts
const { data, isLoading, error, refetch } = usePOApprovalHistory(poId);

// Data structure
interface POApprovalHistoryEntry {
  id: string;
  po_id: string;
  action: 'submitted' | 'approved' | 'rejected';
  user_id: string;
  user_name: string;
  user_role: string;
  notes: string | null;
  created_at: string;
}
```

#### Example

```tsx
// Basic usage
<POApprovalHistory poId="550e8400-e29b-41d4-a716-446655440000" />

// With custom max items
<POApprovalHistory
  poId="550e8400-e29b-41d4-a716-446655440000"
  maxItems={5}
/>

// With custom styling
<POApprovalHistory
  poId="550e8400-e29b-41d4-a716-446655440000"
  className="bg-gray-50 shadow-sm"
/>
```

---

### 3. ApprovalStatusBadge

Reusable badge component for displaying approval status.

**File**: `apps/frontend/components/planning/ApprovalStatusBadge.tsx`

#### Props

```typescript
interface ApprovalStatusBadgeProps {
  status: POApprovalStatus;  // 'pending' | 'approved' | 'rejected'
  size?: 'sm' | 'md' | 'lg'; // Badge size (default: 'md')
  showIcon?: boolean;        // Show icon (default: true)
  className?: string;        // Additional CSS classes
}
```

#### Usage

```tsx
import { ApprovalStatusBadge } from '@/components/planning/ApprovalStatusBadge';

function PurchaseOrderRow({ po }: { po: PurchaseOrder }) {
  return (
    <tr>
      <td>{po.po_number}</td>
      <td>
        <ApprovalStatusBadge status={po.approval_status} size="sm" />
      </td>
    </tr>
  );
}
```

#### Status Configurations

```typescript
const statusConfig = {
  pending: {
    label: 'Pending Approval',
    icon: Clock,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    animate: true,  // Pulsing animation
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-300',
    animate: false,
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
    animate: false,
  },
};
```

#### Size Variants

| Size | Text Size | Padding | Icon Size |
|------|-----------|---------|-----------|
| `sm` | `text-xs` | `px-2 py-0.5` | `h-3 w-3` |
| `md` | `text-xs` | `px-2.5 py-0.5` | `h-3.5 w-3.5` |
| `lg` | `text-sm` | `px-3 py-1` | `h-4 w-4` |

#### Features

- **Dark Mode Support**: Automatic color adaptation
- **Animations**: Pending status has pulsing animation
- **Icons**: Status-specific icons (optional)
- **Accessibility**: ARIA labels and role attributes
- **Responsive**: Size variants for different contexts

#### Examples

```tsx
// Default (medium size, with icon)
<ApprovalStatusBadge status="pending" />

// Small size, no icon
<ApprovalStatusBadge status="approved" size="sm" showIcon={false} />

// Large size with custom class
<ApprovalStatusBadge
  status="rejected"
  size="lg"
  className="ml-2"
/>

// All status variants
<div className="flex gap-2">
  <ApprovalStatusBadge status="pending" />
  <ApprovalStatusBadge status="approved" />
  <ApprovalStatusBadge status="rejected" />
</div>
```

---

## Custom Hooks

### usePOApproval

Hook for managing PO approval/rejection actions.

**File**: `apps/frontend/lib/hooks/use-po-approval.ts`

```typescript
interface UsePOApprovalReturn {
  approvePO: UseMutationResult<void, Error, ApproveParams>;
  rejectPO: UseMutationResult<void, Error, RejectParams>;
  isApproving: boolean;
  isRejecting: boolean;
}

interface ApproveParams {
  poId: string;
  notes?: string;
}

interface RejectParams {
  poId: string;
  rejectionReason: string;
}

// Usage
const { approvePO, rejectPO, isApproving, isRejecting } = usePOApproval();

await approvePO.mutateAsync({ poId: '123', notes: 'Approved' });
await rejectPO.mutateAsync({ poId: '123', rejectionReason: 'Exceeds budget' });
```

### usePOApprovalHistory

Hook for fetching PO approval history.

**File**: `apps/frontend/lib/hooks/use-po-approval-history.ts`

```typescript
interface UsePOApprovalHistoryReturn {
  data: POApprovalHistoryEntry[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Usage
const { data, isLoading, error, refetch } = usePOApprovalHistory(poId);
```

### usePlanningSettings

Hook for fetching planning settings (approval configuration).

**File**: `apps/frontend/lib/hooks/use-planning-settings.ts`

```typescript
interface UsePlanningSettingsReturn {
  data: PlanningSettings | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface PlanningSettings {
  po_require_approval: boolean;
  po_approval_threshold: number | null;
  po_approval_roles: string[];
}

// Usage
const { data: settings, isLoading } = usePlanningSettings();
```

---

## Styling Guidelines

### Color Scheme

| Status | Background (Light) | Background (Dark) | Text (Light) | Text (Dark) |
|--------|-------------------|-------------------|--------------|-------------|
| Pending | `bg-yellow-100` | `bg-yellow-900/30` | `text-yellow-800` | `text-yellow-300` |
| Approved | `bg-green-100` | `bg-green-900/30` | `text-green-800` | `text-green-300` |
| Rejected | `bg-red-100` | `bg-red-900/30` | `text-red-800` | `text-red-300` |
| Submitted | `bg-blue-100` | `bg-blue-900/30` | `text-blue-800` | `text-blue-300` |

### Animations

**Pending Status**: Pulsing animation to draw attention
```css
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Spacing

- Modal max width: `max-w-2xl`
- Modal max height: `max-h-[90vh]` (90% viewport height)
- Timeline entry gap: `gap-3` (12px)
- Badge padding: `px-2.5 py-0.5` (medium)

---

## Accessibility

### ARIA Attributes

```tsx
// Modal
<Dialog aria-describedby={undefined}>
  <DialogTitle asChild>
    <h1>Approve Purchase Order</h1>
  </DialogTitle>
</Dialog>

// Badge
<Badge role="status" aria-label="Approval status: Pending">
  Pending Approval
</Badge>

// Timeline
<div role="region" aria-label="Approval history timeline">
  {entries.map(entry => <TimelineEntry />)}
</div>

// Error state
<div role="alert" aria-live="polite">
  Error message here
</div>
```

### Keyboard Navigation

- **Modal**: Escape key closes modal
- **Form**: Tab navigation between fields
- **Buttons**: Enter/Space activates
- **Retry Button**: Focus trap on error state

### Screen Reader Support

- Status badges announce approval state
- Timeline entries read in chronological order
- Form errors announced via `aria-live="polite"`
- Loading states announced with descriptive labels

---

## Performance Optimization

### Rendering

- **Memoization**: Sub-components use `React.memo` for expensive renders
- **Lazy Loading**: Timeline entries rendered on-demand
- **Debouncing**: Form validation debounced (300ms)

### Data Fetching

- **React Query**: Automatic caching, background refetching
- **Pagination**: History limited to 10 items by default
- **Optimistic Updates**: UI updates before API confirmation

### Bundle Size

- **Tree Shaking**: Components import icons individually
- **Code Splitting**: Modal loaded on-demand
- **Minimal Dependencies**: Uses built-in browser APIs where possible

---

## Testing

### Component Tests

```typescript
// POApprovalModal.test.tsx
describe('POApprovalModal', () => {
  it('renders approve mode correctly', () => {
    render(<POApprovalModal po={mockPO} mode="approve" open={true} />);
    expect(screen.getByText('Approve Purchase Order')).toBeInTheDocument();
  });

  it('validates rejection reason', async () => {
    render(<POApprovalModal po={mockPO} mode="reject" open={true} />);
    await userEvent.click(screen.getByText('Reject PO'));
    expect(screen.getByText('Rejection reason is required')).toBeInTheDocument();
  });

  it('submits approval successfully', async () => {
    const onSuccess = vi.fn();
    render(<POApprovalModal po={mockPO} mode="approve" open={true} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Approval Notes'), 'Approved');
    await userEvent.click(screen.getByText('Approve PO'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

// POApprovalHistory.test.tsx
describe('POApprovalHistory', () => {
  it('shows loading skeleton', () => {
    render(<POApprovalHistory poId="123" />);
    expect(screen.getByLabelText('Loading approval history')).toBeInTheDocument();
  });

  it('renders timeline entries', async () => {
    mockApiResponse(mockHistory);
    render(<POApprovalHistory poId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('by John Smith (Manager)')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// po-approval-workflow.e2e.ts
test('Approve PO from modal', async ({ page }) => {
  await page.goto('/planning/purchase-orders/123');
  await page.click('[data-testid="approve-button"]');

  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.fill('[id="notes"]', 'Budget approved');
  await page.click('text=Approve PO');

  await expect(page.locator('.status-badge')).toHaveText('Approved');
});

test('Reject PO requires reason', async ({ page }) => {
  await page.goto('/planning/purchase-orders/123');
  await page.click('[data-testid="reject-button"]');
  await page.click('text=Reject PO');

  await expect(page.locator('text=Rejection reason is required')).toBeVisible();
});
```

---

## Troubleshooting

### Common Issues

**Issue 1**: Modal doesn't close after approval
```typescript
// Solution: Ensure onSuccess callback includes state reset
const handleSuccess = () => {
  refetch();
  setIsModalOpen(false);  // Add this
};
```

**Issue 2**: Approval history not refreshing
```typescript
// Solution: Trigger refetch on PO status change
useEffect(() => {
  if (po?.status === 'approved') {
    refetch();
  }
}, [po?.status, refetch]);
```

**Issue 3**: Badge not showing correct color
```typescript
// Solution: Ensure approval_status is set correctly
// Check that API returns approval_status='pending' when in pending_approval status
```

**Issue 4**: Form validation not triggering
```typescript
// Solution: Ensure Zod schema matches field names exactly
const rejectSchema = z.object({
  rejection_reason: z.string().min(10),  // Must match form field name
});
```

---

## Related Documentation

- [API Documentation](../../api/planning/po-approval-workflow.md) - Backend endpoints
- [Service Layer](../../services/planning/purchase-order-service.md) - Business logic
- [User Guide](../../guides/planning/po-approval-workflow.md) - End-user instructions
- [PRD Reference](../../../1-BASELINE/product/modules/planning.md) - Requirements

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial component documentation for Story 03.5b |
