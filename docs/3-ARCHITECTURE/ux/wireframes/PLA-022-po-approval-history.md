# PLA-022: PO Approval History Timeline

**Module**: Planning
**Story**: 03.5b - PO Approval Workflow
**Feature**: FR-PLAN-009 (PO Approval Workflow)
**Status**: Implemented & Documented
**Component**: `POApprovalHistory.tsx`
**Last Updated**: 2026-01-02

---

## Overview

Timeline component displaying approval history for purchase orders. Shows chronological list of approval actions (submitted, approved, rejected) with user details, timestamps, and notes. Includes loading, error, empty, and success states.

**Implementation Status**: ✅ Already implemented in `apps/frontend/components/planning/purchase-orders/POApprovalHistory.tsx`

---

## Component States

### 1. Loading State
- Skeleton timeline with 3 placeholder entries
- Circular skeleton icons (8x8)
- Rectangular skeleton text lines
- Aria-label: "Loading approval history"

### 2. Error State
- AlertCircle icon (red)
- Error message text
- Retry button (if onRetry provided)
- Aria-label: "Error loading approval history"

### 3. Empty State
- Clock icon (gray)
- Message: "No approval history yet"
- Centered layout
- Aria-label: "No approval history"

### 4. Success State (Timeline Display)
- Chronological list of entries (newest first)
- Icon + connector line for each entry
- User name, role, timestamp, action
- Optional notes displayed below
- Max 10 entries displayed (configurable)
- "+X more entries" indicator if truncated

---

## ASCII Wireframe

### Success State - Timeline View

```
+----------------------------------------------------------------+
|  Approval History                                              |
+----------------------------------------------------------------+
|                                                                |
|  ●─┐  ✓ Approved                                              |
|    │  by John Smith (Admin)                                    |
|    │  Dec 14, 2024 at 10:30 AM                                |
|    │  +--------------------------------------------------------+|
|    │  | Budget confirmed by finance team. Good pricing.     ||
|    │  +--------------------------------------------------------+|
|    │                                                            |
|  ●─┤  ✗ Rejected                                              |
|    │  by Mary Johnson (Manager)                                |
|    │  Dec 12, 2024 at 3:15 PM                                 |
|    │  +--------------------------------------------------------+|
|    │  | Exceeds budget. Reduce quantity or defer to Q2.    ||
|    │  +--------------------------------------------------------+|
|    │                                                            |
|  ●─┤  ⏰ Submitted for Approval                                |
|    │  by Jane Doe (Planner)                                    |
|    │  Dec 12, 2024 at 2:30 PM                                 |
|    │                                                            |
|  ●──  ⏰ Submitted for Approval                                |
|       by Jane Doe (Planner)                                    |
|       Dec 10, 2024 at 9:00 AM                                 |
|                                                                |
+----------------------------------------------------------------+
|  +2 more entries                                               |
+----------------------------------------------------------------+
```

### Loading State

```
+----------------------------------------------------------------+
|  Approval History                                              |
+----------------------------------------------------------------+
|                                                                |
|  ●─┐  [=============]                                          |
|    │  [======================]                                 |
|    │                                                            |
|  ●─┤  [=============]                                          |
|    │  [======================]                                 |
|    │                                                            |
|  ●──  [=============]                                          |
|       [======================]                                 |
|                                                                |
+----------------------------------------------------------------+
```

### Error State

```
+----------------------------------------------------------------+
|  Approval History                                              |
+----------------------------------------------------------------+
|                                                                |
|                         ⚠                                      |
|                                                                |
|           Failed to load approval history                      |
|                                                                |
|                    [Retry]                                     |
|                                                                |
+----------------------------------------------------------------+
```

### Empty State

```
+----------------------------------------------------------------+
|  Approval History                                              |
+----------------------------------------------------------------+
|                                                                |
|                         ⏰                                     |
|                                                                |
|              No approval history yet                           |
|                                                                |
+----------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  Approval History                |
+----------------------------------+
|                                  |
|  ●─┐  ✓ Approved                |
|    │  John Smith (Admin)         |
|    │  Dec 14 at 10:30 AM         |
|    │  +------------------------+ |
|    │  | Budget confirmed by   | |
|    │  | finance team.         | |
|    │  +------------------------+ |
|    │                             |
|  ●─┤  ✗ Rejected                |
|    │  Mary Johnson (Manager)     |
|    │  Dec 12 at 3:15 PM          |
|    │  +------------------------+ |
|    │  | Exceeds budget.       | |
|    │  +------------------------+ |
|    │                             |
|  ●──  ⏰ Submitted               |
|       Jane Doe (Planner)         |
|       Dec 12 at 2:30 PM          |
|                                  |
+----------------------------------+
```

---

## Timeline Entry Structure

### Entry Components

Each timeline entry consists of:

1. **Icon Section** (Left Column)
   - Circular icon background (32x32px)
   - Action-specific icon (16x16px)
   - Vertical connector line (1px, gray)
   - No connector on last entry

2. **Content Section** (Right Column)
   - Action label (bold, colored)
   - User line: "by {user_name} ({user_role})"
   - Timestamp line: formatted date/time
   - Notes box (if notes exist)

### Action Icons and Colors

| Action | Icon | Icon Color | Background | Label |
|--------|------|------------|------------|-------|
| `submitted` | Clock | `text-blue-600` | `bg-blue-100` | "Submitted for Approval" |
| `approved` | CheckCircle2 | `text-green-600` | `bg-green-100` | "Approved" |
| `rejected` | XCircle | `text-red-600` | `bg-red-100` | "Rejected" |
| Unknown | FileText | `text-gray-600` | `bg-gray-100` | Action value |

### Entry Data Model

```typescript
interface POApprovalHistoryEntry {
  id: string;                    // UUID
  po_id: string;                 // UUID
  action: 'submitted' | 'approved' | 'rejected';
  user_id: string;               // UUID
  user_name: string;             // Denormalized, e.g., "John Smith"
  user_role: string;             // Denormalized, e.g., "Admin"
  notes: string | null;          // Optional notes/reason
  created_at: string;            // ISO timestamp
}
```

---

## Component Props

### Interface: POApprovalHistoryProps

```typescript
interface POApprovalHistoryProps {
  /** PO ID to fetch history for */
  poId: string;

  /** Maximum number of entries to display (default: 10) */
  maxItems?: number;

  /** Additional CSS classes */
  className?: string;
}
```

---

## Data Display

### Timestamp Formatting

```typescript
// Format: "Dec 14, 2024 at 10:30 AM"
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
```

### User Display

Format: `by {user_name} ({user_role})`
- Example: "by John Smith (Admin)"
- User role shown in parentheses, lighter color
- User name from denormalized `user_name` field (for historical accuracy)

### Notes Display

- Displayed in gray box below user/timestamp
- Rounded corners, padding
- Background: `bg-gray-50` (light), `bg-gray-800` (dark)
- Text color: `text-gray-600` (light), `text-gray-300` (dark)
- Only shown if notes exist (not null/empty)

### Entry Truncation

- If history has > maxItems entries, show only first maxItems
- Display "+X more entries" at bottom (center-aligned, small gray text)
- Example: "+2 more entries"
- Future enhancement: "Show all" button

---

## Layout Specifications

### Container
- Border: 1px solid border-color
- Rounded corners: `rounded-lg`
- Padding: 16px (p-4)
- Background: Default card background

### Header
- Text: "Approval History"
- Font: Small, medium weight (`text-sm font-medium`)
- Margin bottom: 16px (mb-4)

### Timeline Layout
- Flex container with gap
- Icon column: Fixed width (32px + 12px gap = 44px)
- Content column: Flex-1 (remaining space)

### Spacing
- Between entries: 16px vertical (controlled by connector line)
- Icon to content: 12px horizontal gap
- Content internal: 4-8px vertical spacing

---

## API Integration

### Endpoint

```typescript
// Hook: usePOApprovalHistory(poId)
GET /api/planning/purchase-orders/:poId/approval-history

Response: {
  success: true,
  data: [
    {
      id: "uuid-1",
      po_id: "uuid-po",
      action: "approved",
      user_id: "uuid-user-1",
      user_name: "John Smith",
      user_role: "Admin",
      notes: "Budget confirmed by finance team.",
      created_at: "2024-12-14T10:30:00Z"
    },
    {
      id: "uuid-2",
      po_id: "uuid-po",
      action: "rejected",
      user_id: "uuid-user-2",
      user_name: "Mary Johnson",
      user_role: "Manager",
      notes: "Exceeds budget. Reduce quantity.",
      created_at: "2024-12-12T15:15:00Z"
    },
    {
      id: "uuid-3",
      po_id: "uuid-po",
      action: "submitted",
      user_id: "uuid-user-3",
      user_name: "Jane Doe",
      user_role: "Planner",
      notes: null,
      created_at: "2024-12-12T14:30:00Z"
    }
  ]
}
```

### Data Fetching

- Hook: `usePOApprovalHistory(poId)`
- Auto-fetches on mount
- Refetch on `refetch()` call
- Returns: `{ data, isLoading, error, refetch }`

---

## Business Rules

### Entry Ordering
- Entries sorted by `created_at` **descending** (newest first)
- Most recent approval action at top
- Historical actions below

### Historical Accuracy
- `user_name` and `user_role` denormalized at write time
- If user name/role changes later, history shows name/role at time of action
- Preserves audit trail integrity

### Notes/Reason Storage
- Approval notes: Optional, stored in `notes` field
- Rejection reason: Required, stored in `notes` field
- System distinguishes by `action` type

### Entry Persistence
- Entries append-only (never updated or deleted)
- Even if PO deleted, history persists (via ON DELETE CASCADE configuration)
- Full audit trail maintained

---

## Accessibility

### ARIA Attributes
- Timeline container: `role="region"` `aria-label="Approval history timeline"`
- Loading state: `aria-label="Loading approval history"`
- Error state: `role="alert"` `aria-label="Error loading approval history"`
- Empty state: `aria-label="No approval history"`

### Color Contrast
- Icon colors: High contrast on background (6:1+)
- Text colors: Meet WCAG AA (4.5:1 minimum)
- Notes background: Sufficient contrast for readability

### Screen Reader
- Timeline announces: "Approval history timeline"
- Each entry announces: "{Action} by {user} on {date}"
- Notes announced after user/timestamp
- Connector lines marked as decorative (aria-hidden)

### Keyboard Navigation
- Timeline scrollable via keyboard (arrow keys, Page Up/Down)
- Retry button focusable (if error state)
- No interactive elements within entries (read-only display)

---

## Responsive Design

### Desktop (>1024px)
- Full width within parent container
- Icon + content side-by-side
- Notes box full width below user/timestamp

### Tablet (768-1024px)
- Same layout as desktop
- Slightly reduced spacing

### Mobile (<768px)
- Same vertical timeline layout
- Smaller icon size (24x24px)
- Compressed spacing
- Shorter timestamp format ("Dec 14 at 10:30 AM")
- Notes box with smaller padding

---

## Performance

### Load Time
- Initial fetch: <200ms target
- Render: Synchronous (no additional processing)
- Pagination: Client-side (maxItems truncation)

### Data Optimization
- Single API call for all history
- No additional queries per entry
- Denormalized data avoids joins

### Rendering
- Entries mapped with unique `key={entry.id}`
- No complex calculations per entry
- Memoization not needed (simple data display)

---

## Testing Requirements

### Unit Tests
- Renders loading skeleton correctly
- Renders error state with message and retry button
- Renders empty state when no entries
- Renders timeline entries in correct order (newest first)
- Formats timestamps correctly
- Displays user name and role correctly
- Shows notes when present, hides when null
- Truncates entries to maxItems
- Shows "+X more entries" indicator correctly
- Calls refetch on retry button click

### Integration Tests
- Fetches data from correct API endpoint
- Handles API errors gracefully
- Displays all entry types (submitted, approved, rejected)
- Refetch updates timeline

### E2E Tests
- Timeline displays after PO approval workflow
- New entry appears after approval action
- Timeline scrollable if many entries
- Retry button works on error
- Mobile responsive layout

---

## Usage Examples

### Basic Usage (PO Detail Page)

```tsx
import { POApprovalHistory } from '@/components/planning/purchase-orders/POApprovalHistory';

export default function PODetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      {/* PO Header, Summary, Lines */}

      <POApprovalHistory poId={params.id} />
    </div>
  );
}
```

### Custom Max Items

```tsx
<POApprovalHistory
  poId={poId}
  maxItems={5}  // Show only 5 most recent
/>
```

### Custom Styling

```tsx
<POApprovalHistory
  poId={poId}
  className="bg-blue-50 border-blue-200"
/>
```

---

## Implementation Notes

### Existing Component Path
```
apps/frontend/components/planning/purchase-orders/POApprovalHistory.tsx
```

### Dependencies
- `@/hooks/use-po-approval-history` - Custom hook for data fetching
- `@/components/ui/button` - ShadCN Button component
- `@/components/ui/skeleton` - ShadCN Skeleton component
- `lucide-react` - Icons (CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, FileText)
- `@/lib/utils` - cn() utility

### Key Features Implemented
- ✅ Timeline layout with connector lines
- ✅ Action-specific icons and colors
- ✅ User name and role display
- ✅ Timestamp formatting
- ✅ Notes/reason display
- ✅ Loading skeleton (3 entries)
- ✅ Error state with retry
- ✅ Empty state
- ✅ Entry truncation with indicator
- ✅ Responsive design
- ✅ Full accessibility (ARIA, screen reader)

### Future Enhancements (Deferred)
- Pagination controls ("Show more" button)
- Filtering by action type
- Search within notes
- Export history to PDF/CSV
- Inline expansion of truncated notes

---

## Quality Gates

- [x] All 4 states defined (Loading, Error, Empty, Success)
- [x] Timeline layout with connector lines
- [x] Action icons and colors configured
- [x] User and timestamp display formatted
- [x] Notes display conditional
- [x] Entry truncation with indicator
- [x] API integration documented
- [x] Accessibility requirements met (WCAG AA)
- [x] Responsive design for all breakpoints
- [x] Screen reader support
- [x] Error handling with retry
- [x] Component already implemented and tested

---

**Status**: ✅ Implemented & Documented
**Component**: `POApprovalHistory.tsx`
**Story**: 03.5b
**Approved**: Auto-approved (existing implementation)
