# NPD-011: Approval History Timeline

**Module**: NPD (New Product Development)
**Story**: NPD Project Approval Tracking
**Feature**: NPD-FR-21, NPD-FR-22, NPD-FR-62
**Status**: Wireframe Defined
**Component**: `ApprovalHistoryTimeline.tsx`
**Last Updated**: 2026-01-15

---

## Overview

Vertical timeline component displaying all gate approvals and rejections for an NPD project. Shows chronological approval entries with gate name, result (Approved/Rejected), approver details, notes, and e-signature indicators. Supports expanded entry view for signature verification details. Used in NPD Project Detail page to track approval audit trail.

**Key Features:**
- Vertical timeline with approval entries
- Approved (green) and Rejected (red) visual indicators
- E-signature indicator with lock icon for signed approvals
- Expandable entry details with signature verification link
- Full audit trail for regulatory compliance (21 CFR Part 11 ready)

**Related PRD**: NPD-FR-21 (Log approvals), NPD-FR-22 (Show approval history), NPD-FR-62 (Reuse approvals table)

---

## Component States

### 1. Loading State
- Skeleton timeline with 3 placeholder entries
- Vertical connector line skeleton
- Circular skeleton icons (32x32)
- Rectangular skeleton text lines for date, gate, approver
- Aria-label: "Loading approval history"

### 2. Empty State (No Approvals)
- Clock icon centered (gray, 48x48)
- Message: "No approvals recorded yet"
- Subtext: "Gate approvals will appear here as the project advances."
- Centered layout within container
- Aria-label: "No approval history"

### 3. Populated State (Timeline Display)
- Chronological list of approval entries (newest first)
- Each entry: icon + connector line + content
- Approved entries: Green background highlight
- Rejected entries: Red background highlight
- E-signature lock icon when e-signed
- "View signature details" link for signed entries
- Max entries configurable (default: 20)
- "+X more entries" indicator if truncated

### 4. Expanded Entry Details State
- Inline expansion below selected entry
- Full approval notes displayed
- E-signature verification details:
  - Signer name and role
  - Signature timestamp
  - Certificate ID / verification hash
  - Verification status indicator
- Collapse button to return to summary view

---

## ASCII Wireframe

### Populated State - Desktop

```
+------------------------------------------------------------------+
|  Approval History                                    [Expand All] |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |  [check]---+  G4 Testing - APPROVED          Jan 14, 2026   | |
|  |  (green)   |  +---------------------------------------------+ |
|  |            |  | John Smith (Director)                 [lock]| |
|  |            |  | E-signed at 10:30 AM                        | |
|  |            |  |                                             | |
|  |            |  | Notes: All compliance docs verified.        | |
|  |            |  | Ready for launch.                          | |
|  |            |  |                                             | |
|  |            |  | [View signature details]                    | |
|  |            |  +---------------------------------------------+ |
|  |            |                                                 | |
|  |  [check]---+  G3 Development - APPROVED      Jan 07, 2026   | |
|  |  (green)   |  +---------------------------------------------+ |
|  |            |  | Mary Johnson (Manager)                [lock]| |
|  |            |  | E-signed at 2:15 PM                         | |
|  |            |  |                                             | |
|  |            |  | Notes: Formulation v2.1 approved. Trials    | |
|  |            |  | completed successfully.                    | |
|  |            |  |                                             | |
|  |            |  | [View signature details]                    | |
|  |            |  +---------------------------------------------+ |
|  |            |                                                 | |
|  |  [x]-------+  G3 Development - REJECTED      Jan 03, 2026   | |
|  |  (red)     |  +---------------------------------------------+ |
|  |            |  | Mary Johnson (Manager)                      | |
|  |            |  |                                             | |
|  |            |  | Notes: Allergen declaration incomplete.     | |
|  |            |  | Missing peanut cross-contamination warning. | |
|  |            |  | Please update formulation before resubmit. | |
|  |            |  +---------------------------------------------+ |
|  |            |                                                 | |
|  |  [check]---+  G2 Business Case - APPROVED    Dec 28, 2025   | |
|  |  (green)   |  +---------------------------------------------+ |
|  |            |  | Admin User (Admin)                         | |
|  |            |  |                                             | |
|  |            |  | Notes: Business case approved. Target cost  | |
|  |            |  | $2.50/unit confirmed.                      | |
|  |            |  +---------------------------------------------+ |
|  |            |                                                 | |
|  |  [check]----  G1 Feasibility - APPROVED      Dec 20, 2025   | |
|  |  (green)      +---------------------------------------------+ |
|  |               | Jane Doe (NPD Lead)                         | |
|  |               |                                             | |
|  |               | Notes: Technical feasibility confirmed.     | |
|  |               | Proceed to business case development.      | |
|  |               +---------------------------------------------+ |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
```

### Expanded Entry Details

```
+------------------------------------------------------------------+
|  Approval History                                                 |
+------------------------------------------------------------------+
|                                                                   |
|  [check]---+  G4 Testing - APPROVED              Jan 14, 2026    |
|  (green)   |  +--------------------------------------------------+|
|            |  | John Smith (Director)                      [lock]||
|            |  | E-signed at 10:30 AM                             ||
|            |  |                                                  ||
|            |  | Notes: All compliance docs verified.             ||
|            |  | Ready for launch.                                ||
|            |  +--------------------------------------------------+|
|            |                                                      |
|            |  +--------------------------------------------------+|
|            |  | E-SIGNATURE DETAILS                   [Collapse] ||
|            |  +--------------------------------------------------+|
|            |  |                                                  ||
|            |  |  Signer: John Smith                              ||
|            |  |  Role: Director                                  ||
|            |  |  Organization: Acme Foods Inc.                   ||
|            |  |                                                  ||
|            |  |  Signature Timestamp:                            ||
|            |  |  2026-01-14T10:30:45.123Z                        ||
|            |  |                                                  ||
|            |  |  Certificate ID:                                 ||
|            |  |  SHA256:a8f3b2c1d4e5f6...9012                    ||
|            |  |                                                  ||
|            |  |  Verification Status:                            ||
|            |  |  [check] Valid - Signature verified              ||
|            |  |                                                  ||
|            |  |  IP Address: 192.168.1.100                       ||
|            |  |  User Agent: Chrome 120.0 (Windows)              ||
|            |  |                                                  ||
|            |  +--------------------------------------------------+|
|            |                                                      |
|  [check]---+  G3 Development - APPROVED          Jan 07, 2026    |
|  (green)   |  ...                                                 |
|                                                                   |
+------------------------------------------------------------------+
```

### Rejected Entry Highlight

```
+------------------------------------------------------------------+
|                                                                   |
|  [x]-------+  G3 Development - REJECTED          Jan 03, 2026    |
|  (red)     |  +--------------------------------------------------+|
|            |  |                    REJECTED                      ||
|            |  |  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~||
|            |  |  Mary Johnson (Manager)                          ||
|            |  |                                                  ||
|            |  |  Rejection Reason:                               ||
|            |  |  Allergen declaration incomplete. Missing peanut ||
|            |  |  cross-contamination warning. Please update      ||
|            |  |  formulation before resubmitting for approval.   ||
|            |  |                                                  ||
|            |  |  Required Actions:                               ||
|            |  |  - Update allergen declaration                   ||
|            |  |  - Add cross-contamination warnings              ||
|            |  |  - Resubmit for G3 approval                      ||
|            |  +--------------------------------------------------+|
|            |                                                      |
+------------------------------------------------------------------+
```

### Loading State

```
+------------------------------------------------------------------+
|  Approval History                                                 |
+------------------------------------------------------------------+
|                                                                   |
|  [====]---+  [========================]      [==========]        |
|           |  [==========================================]        |
|           |  [================================]                   |
|           |                                                       |
|  [====]---+  [========================]      [==========]        |
|           |  [==========================================]        |
|           |  [================================]                   |
|           |                                                       |
|  [====]----  [========================]      [==========]        |
|              [==========================================]        |
|              [================================]                   |
|                                                                   |
|  Loading approval history...                                      |
|                                                                   |
+------------------------------------------------------------------+
```

### Empty State (No Approvals)

```
+------------------------------------------------------------------+
|  Approval History                                                 |
+------------------------------------------------------------------+
|                                                                   |
|                                                                   |
|                          [clock icon]                             |
|                              (48px)                               |
|                                                                   |
|                  No approvals recorded yet                        |
|                                                                   |
|        Gate approvals will appear here as the project             |
|        advances through the Stage-Gate workflow.                  |
|                                                                   |
|        First approval expected at G1 (Feasibility).               |
|                                                                   |
|                                                                   |
+------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  Approval History          [+/-] |
+----------------------------------+
|                                  |
|  [check] G4 Testing              |
|  APPROVED  Jan 14, 2026          |
|  +----------------------------+  |
|  | John Smith (Director)[lock]|  |
|  | E-signed 10:30 AM          |  |
|  |                            |  |
|  | All compliance docs        |  |
|  | verified. Ready for        |  |
|  | launch.                    |  |
|  |                            |  |
|  | [View signature]           |  |
|  +----------------------------+  |
|          |                       |
|  [x] G3 Development              |
|  REJECTED  Jan 03, 2026          |
|  +----------------------------+  |
|  | Mary Johnson (Manager)     |  |
|  |                            |  |
|  | Allergen declaration       |  |
|  | incomplete. Missing        |  |
|  | peanut warning.            |  |
|  +----------------------------+  |
|          |                       |
|  [check] G2 Business Case        |
|  APPROVED  Dec 28, 2025          |
|  +----------------------------+  |
|  | Admin User (Admin)         |  |
|  |                            |  |
|  | Business case approved.    |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

---

## Timeline Entry Structure

### Entry Components

Each timeline entry consists of:

1. **Icon Section** (Left Column)
   - Circular icon container (32x32px)
   - Result-specific icon:
     - Approved: CheckCircle (green)
     - Rejected: XCircle (red)
   - Background color:
     - Approved: `bg-green-100` (light) / `bg-green-900` (dark)
     - Rejected: `bg-red-100` (light) / `bg-red-900` (dark)
   - Vertical connector line (2px, gray-300)
   - No connector on last entry

2. **Content Section** (Right Column)
   - **Header Row**:
     - Gate name and result badge
     - Date/time (right-aligned)
   - **Approver Row**:
     - User name and role in parentheses
     - E-signature lock icon (if signed)
     - "E-signed at [time]" indicator
   - **Notes Section**:
     - Approval notes or rejection reason
     - Truncated to 3 lines with "Show more" (if longer)
   - **Action Row**:
     - "View signature details" link (if e-signed)

3. **Entry Container**:
   - Approved: Light green background border-left highlight
   - Rejected: Light red background border-left highlight
   - Rounded corners
   - Subtle shadow

### Result Badges and Colors

| Result | Icon | Icon Color | Background | Border | Label |
|--------|------|------------|------------|--------|-------|
| `approved` | CheckCircle2 | `text-green-600` | `bg-green-50` | `border-green-200` | "APPROVED" |
| `rejected` | XCircle | `text-red-600` | `bg-red-50` | `border-red-200` | "REJECTED" |

### E-Signature Indicator

| Element | Description |
|---------|-------------|
| Lock Icon | `Lock` from lucide-react, 16x16, positioned after approver name |
| E-signed Text | "E-signed at [time]" in smaller gray text |
| Link | "View signature details" - opens expanded view |
| Color | Lock icon: `text-blue-600` (indicates verified) |

### Entry Data Model

```typescript
interface ApprovalHistoryEntry {
  id: string;                    // UUID
  npd_project_id: string;        // UUID - FK to npd_projects
  gate: string;                  // 'G0' | 'G1' | 'G2' | 'G3' | 'G4'
  gate_name: string;             // 'Idea' | 'Feasibility' | etc.
  result: 'approved' | 'rejected';
  approver_id: string;           // UUID - FK to auth.users
  approver_name: string;         // Denormalized, e.g., "John Smith"
  approver_role: string;         // Denormalized, e.g., "Director"
  notes: string | null;          // Approval notes or rejection reason
  is_esigned: boolean;           // Whether e-signature captured
  esign_timestamp: string | null; // ISO timestamp of signature
  esign_certificate_id: string | null; // Certificate/hash for verification
  esign_ip_address: string | null; // IP address at signature time
  esign_user_agent: string | null; // Browser info at signature time
  created_at: string;            // ISO timestamp
}
```

---

## Component Props

### Interface: ApprovalHistoryTimelineProps

```typescript
interface ApprovalHistoryTimelineProps {
  /** NPD Project ID to fetch approval history for */
  projectId: string;

  /** Maximum number of entries to display (default: 20) */
  maxItems?: number;

  /** Whether to show e-signature details link (default: true) */
  showSignatureDetails?: boolean;

  /** Callback when signature details link clicked */
  onViewSignature?: (entryId: string) => void;

  /** Additional CSS classes */
  className?: string;
}
```

---

## Data Display

### Timestamp Formatting

```typescript
// Format: "Jan 14, 2026" for date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format: "10:30 AM" for time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
```

### Gate Name Mapping

```typescript
const GATE_NAMES: Record<string, string> = {
  G0: 'Idea',
  G1: 'Feasibility',
  G2: 'Business Case',
  G3: 'Development',
  G4: 'Testing',
};
```

### Approver Display

Format: `{approver_name} ({approver_role})`
- Example: "John Smith (Director)"
- Role shown in parentheses, lighter color
- Denormalized at write time for historical accuracy

### Notes Display

- Displayed in content card below approver
- Label: "Notes:" for approved, "Rejection Reason:" for rejected
- Max 3 lines visible by default
- "Show more" link if truncated
- Background: `bg-gray-50` (light), `bg-gray-800` (dark)

### Entry Truncation

- If history has > maxItems entries, show only first maxItems
- Display "+X more entries" at bottom
- "Show all" button to load remaining entries

---

## Layout Specifications

### Container
- Border: 1px solid border-color
- Rounded corners: `rounded-lg`
- Padding: 16px (p-4)
- Background: Default card background
- Max-height: 600px with overflow-y scroll

### Header
- Text: "Approval History"
- Font: Small, medium weight (`text-sm font-medium`)
- Expand All button: Right-aligned (optional)
- Margin bottom: 16px (mb-4)

### Timeline Layout
- Flex container with gap
- Icon column: Fixed width (32px + 16px gap = 48px)
- Content column: Flex-1 (remaining space)
- Entry spacing: 24px vertical gap

### Entry Card
- Approved: `border-l-4 border-green-500 bg-green-50/50`
- Rejected: `border-l-4 border-red-500 bg-red-50/50`
- Padding: 12px (p-3)
- Rounded: `rounded-r-lg`

### Connector Line
- Width: 2px
- Color: `bg-gray-300` (light), `bg-gray-600` (dark)
- Extends from icon center to next icon
- Hidden on last entry

---

## API Integration

### Endpoint

```typescript
// Hook: useApprovalHistory(projectId)
GET /api/npd/projects/:projectId/approvals

Response: {
  success: true,
  data: [
    {
      id: "uuid-1",
      npd_project_id: "uuid-project",
      gate: "G4",
      gate_name: "Testing",
      result: "approved",
      approver_id: "uuid-user-1",
      approver_name: "John Smith",
      approver_role: "Director",
      notes: "All compliance docs verified. Ready for launch.",
      is_esigned: true,
      esign_timestamp: "2026-01-14T10:30:45.123Z",
      esign_certificate_id: "SHA256:a8f3b2c1d4e5f6...",
      esign_ip_address: "192.168.1.100",
      esign_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      created_at: "2026-01-14T10:30:00Z"
    },
    {
      id: "uuid-2",
      npd_project_id: "uuid-project",
      gate: "G3",
      gate_name: "Development",
      result: "rejected",
      approver_id: "uuid-user-2",
      approver_name: "Mary Johnson",
      approver_role: "Manager",
      notes: "Allergen declaration incomplete. Missing peanut cross-contamination warning.",
      is_esigned: false,
      esign_timestamp: null,
      esign_certificate_id: null,
      esign_ip_address: null,
      esign_user_agent: null,
      created_at: "2026-01-03T15:15:00Z"
    }
  ],
  total_count: 5
}
```

### Signature Details Endpoint

```typescript
GET /api/npd/approvals/:approvalId/signature

Response: {
  success: true,
  data: {
    signer_name: "John Smith",
    signer_role: "Director",
    organization: "Acme Foods Inc.",
    signature_timestamp: "2026-01-14T10:30:45.123Z",
    certificate_id: "SHA256:a8f3b2c1d4e5f6789012...",
    verification_status: "valid",
    ip_address: "192.168.1.100",
    user_agent: "Chrome 120.0 (Windows)",
    meaning: "I approve this gate advancement",
    legal_text: "By signing, I confirm..."
  }
}
```

### Data Fetching

- Hook: `useApprovalHistory(projectId)`
- Auto-fetches on mount
- Refetch on `refetch()` call
- Returns: `{ data, isLoading, error, refetch, totalCount }`

---

## Business Rules

### Entry Ordering
- Entries sorted by `created_at` **descending** (newest first)
- Most recent approval/rejection at top
- Historical entries below

### Historical Accuracy
- `approver_name` and `approver_role` denormalized at write time
- If approver name/role changes later, history shows values at time of action
- Preserves audit trail integrity

### E-Signature Requirements
- G3+ gates require e-signature for approvals
- E-signature captures: timestamp, certificate ID, IP, user agent
- Signature details viewable but not editable
- 21 CFR Part 11 compliance ready

### Rejection Handling
- Rejections do not have e-signature requirement
- Rejection reason is required (stored in notes)
- Rejected entries highlighted in red
- Multiple rejections can occur for same gate

### Entry Persistence
- Entries append-only (never updated or deleted)
- Full audit trail maintained
- Survives project archival (soft delete)

---

## Accessibility

### ARIA Attributes
- Timeline container: `role="feed"` `aria-label="Approval history timeline"`
- Each entry: `role="article"` `aria-labelledby="entry-{id}-title"`
- Loading state: `aria-label="Loading approval history"`
- Error state: `role="alert"` `aria-label="Error loading approval history"`
- Empty state: `aria-label="No approval history"`
- Expand/collapse: `aria-expanded="true|false"`

### Color Contrast
- Green approved: Background + text meet WCAG AA (4.5:1)
- Red rejected: Background + text meet WCAG AA (4.5:1)
- Lock icon: High contrast on background
- All text meets minimum contrast requirements

### Screen Reader
- Timeline announces: "Approval history timeline, 5 entries"
- Each entry announces: "{Gate name} {result} by {approver} on {date}"
- E-signature: "E-signed" announced after approver
- Expanded details: "Signature details expanded"
- Connector lines: `aria-hidden="true"` (decorative)

### Keyboard Navigation
- Tab: Navigate between entries and interactive elements
- Enter/Space: Expand signature details
- Escape: Collapse expanded details
- Arrow Up/Down: Navigate between entries (optional)

### Touch Targets
- View signature link: 48x48dp minimum
- Expand/collapse buttons: 48x48dp minimum
- All interactive elements: 48x48dp minimum

---

## Responsive Design

### Desktop (>1024px)
- Full width within parent container
- Icon + content side-by-side
- Entry card full width
- Expanded signature details inline

### Tablet (768-1024px)
- Same layout as desktop
- Slightly reduced spacing
- Entry card padding reduced

### Mobile (<768px)
- Compact vertical layout
- Icon above entry card (not side-by-side)
- Gate name and result on separate lines
- Date below gate name
- Signature details in modal (not inline)
- Connector line hidden

---

## Performance

### Load Time
- Initial fetch: <300ms target
- Render: Synchronous (no additional processing)
- Pagination: Client-side (maxItems truncation)

### Data Optimization
- Single API call for all history entries
- Signature details lazy-loaded on expand
- Denormalized data avoids joins
- Caching: 5 minutes (approval history rarely changes)

### Rendering
- Entries mapped with unique `key={entry.id}`
- Virtualization not needed (<100 entries typical)
- Memoization for expensive date formatting

---

## Testing Requirements

### Unit Tests
- Renders loading skeleton correctly
- Renders error state with message
- Renders empty state when no approvals
- Renders timeline entries in correct order (newest first)
- Displays approved entries with green styling
- Displays rejected entries with red styling
- Shows e-signature lock icon when is_esigned=true
- Hides lock icon when is_esigned=false
- Formats timestamps correctly
- Displays approver name and role correctly
- Shows notes/rejection reason correctly
- Truncates entries to maxItems
- Shows "+X more entries" indicator
- Expands signature details on click
- Collapses signature details on second click

### Integration Tests
- Fetches data from correct API endpoint
- Handles API errors gracefully
- Loads signature details on expand
- Refetch updates timeline
- Empty state when project has no approvals

### E2E Tests
- Timeline displays in project detail page
- New entry appears after gate approval
- Rejected entry shows red highlight
- E-signature lock visible for signed entries
- Signature details expand and collapse
- Mobile responsive layout works
- Screen reader announces entries correctly

---

## Implementation Notes

### Target Component Path
```
apps/frontend/components/npd/projects/ApprovalHistoryTimeline.tsx
```

### Dependencies
- `@/hooks/use-approval-history` - Custom hook for data fetching
- `@/components/ui/button` - ShadCN Button component
- `@/components/ui/skeleton` - ShadCN Skeleton component
- `@/components/ui/card` - ShadCN Card component
- `@/components/ui/badge` - ShadCN Badge component
- `@/components/ui/collapsible` - ShadCN Collapsible component
- `lucide-react` - Icons (CheckCircle2, XCircle, Lock, Clock, ChevronDown, ChevronUp)
- `@/lib/utils` - cn() utility

### Key Features to Implement
- [ ] Vertical timeline layout with connector lines
- [ ] Result-specific icons and colors (green/red)
- [ ] E-signature lock icon indicator
- [ ] Expandable signature details section
- [ ] Loading skeleton (3 entries)
- [ ] Error state with retry
- [ ] Empty state with helpful message
- [ ] Entry truncation with "Show all"
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Full accessibility (ARIA, keyboard, screen reader)

### Database Table (Reference)

Uses existing `approvals` table with NPD-specific columns:

```sql
-- NPD approval entries stored in approvals table
SELECT * FROM approvals
WHERE entity_type = 'npd_project'
  AND entity_id = :projectId
ORDER BY created_at DESC;

-- Columns used:
-- id, org_id, entity_type, entity_id (npd_project_id)
-- action ('gate_approved' | 'gate_rejected')
-- gate (G0-G4)
-- user_id, user_name, user_role (denormalized)
-- notes
-- is_esigned, esign_timestamp, esign_certificate_id
-- esign_ip_address, esign_user_agent
-- created_at
```

---

## Quality Gates

- [x] All 4 states defined (Loading, Empty, Populated, Expanded)
- [x] Vertical timeline layout with connector lines
- [x] Approved entries: Green background highlight
- [x] Rejected entries: Red background highlight
- [x] Result badges (Approved/Rejected) with icons
- [x] E-signature lock icon indicator
- [x] "View signature details" link for signed entries
- [x] Expanded entry details with signature verification
- [x] Approver name + role display
- [x] Date/time formatting specified
- [x] Notes/rejection reason display
- [x] API endpoints documented
- [x] Accessibility requirements met (WCAG AA)
- [x] Touch targets 48x48dp minimum
- [x] Responsive breakpoints defined
- [x] Screen reader support
- [x] Keyboard navigation support
- [x] Data model documented

---

**Status**: Wireframe Defined
**Component**: `ApprovalHistoryTimeline.tsx`
**Story**: NPD Project Approval Tracking
**Approved**: Pending review
