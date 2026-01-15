# NPD-005: Advance Gate Modal

**Module**: NPD (New Product Development)
**Story**: NPD Gate Advancement
**Feature**: NPD-FR-02, NPD-FR-03, NPD-FR-19, NPD-FR-20
**Status**: Wireframe Defined
**Component**: `AdvanceGateModal.tsx`
**Last Updated**: 2026-01-15

---

## Overview

Modal component for advancing an NPD project through Stage-Gate workflow. Displays current gate status, checklist completion summary, blockers, and handles approval requirements for gates G3+. Implements gate transition validation with clear visual feedback.

**Stage-Gate Flow**: G0 (Idea) -> G1 (Feasibility) -> G2 (Business Case) -> G3 (Development) -> G4 (Testing) -> Launched

---

## Component States

### 1. Loading State
- Skeleton placeholders for gate transition header, checklist summary, and action buttons
- Loading message: "Loading gate information..."
- No interactive elements visible

### 2. Ready to Advance State
- Gate transition visual (Current -> Target)
- Checklist summary showing 100% complete
- No blockers displayed
- Notes textarea (required)
- Action buttons: Cancel, Advance to GX

### 3. Has Blockers State
- Gate transition visual (Current -> Target) with warning indicator
- Checklist summary showing incomplete percentage
- Blockers list with red icons
- Notes textarea disabled
- Advance button disabled with tooltip: "Complete all required items"
- Action button: Cancel only active

### 4. Approval Required State (G3+)
- Gate transition visual with approval badge
- Checklist summary (must be 100%)
- Approval section visible with approver dropdown
- Required approval justification textarea
- Action buttons: Cancel, Request Approval / Advance to GX

### 5. Success State
- Handled via toast notification
- Modal closes automatically
- Parent component refreshes project data
- Event logged (NPD.GateAdvanced)

### 6. Error State
- Error alert banner with icon
- Error message displayed inline
- Form remains editable for retry
- Toast notification with error details

---

## ASCII Wireframe

### Ready to Advance - Desktop

```
+------------------------------------------------------------------+
|                    Advance Gate                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |    +-------+                        +-------+           |     |
|  |    |  G1   |    =============>      |  G2   |           |     |
|  |    | Feasi |      Advancing to      | Busi  |           |     |
|  |    | bility|                        | ness  |           |     |
|  |    +-------+                        +-------+           |     |
|  |     Current                          Target             |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST SUMMARY                                                |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  [========================================] 100%        |     |
|  |                                                         |     |
|  |  [check] Technical feasibility confirmed    Completed   |     |
|  |  [check] Key ingredients identified         Completed   |     |
|  |  [check] Initial allergen assessment        Completed   |     |
|  |  [check] Rough cost estimate                Completed   |     |
|  |                                                         |     |
|  |  4 of 4 required items complete                        |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  BLOCKERS                                                         |
|  +---------------------------------------------------------+     |
|  |  [check-circle] No blockers - Ready to advance         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Gate Advancement Notes *                                         |
|  +---------------------------------------------------------+     |
|  | Feasibility phase completed ahead of schedule.         |     |
|  | All technical assessments passed. Moving to business   |     |
|  | case development...                                    |     |
|  +---------------------------------------------------------+     |
|  Required for audit trail                                         |
|                                                                   |
|  [Cancel]                               [Advance to G2]          |
|                                                                   |
+------------------------------------------------------------------+
```

### Has Blockers - Desktop

```
+------------------------------------------------------------------+
|                    Advance Gate                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |    +-------+                        +-------+           |     |
|  |    |  G2   |    - - - - - - - >     |  G3   |           |     |
|  |    | Busi  |     [!] Blocked        | Devel |           |     |
|  |    | ness  |                        | opmt  |           |     |
|  |    +-------+                        +-------+           |     |
|  |     Current                          Target             |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST SUMMARY                                                |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  [========================          ] 75%               |     |
|  |                                                         |     |
|  |  [check] Business case documented           Completed   |     |
|  |  [check] Target cost approved               Completed   |     |
|  |  [check] Target margin confirmed            Completed   |     |
|  |  [x]     Resource plan approved             Incomplete  |     |
|  |                                                         |     |
|  |  3 of 4 required items complete                        |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  BLOCKERS (1)                                            [!]     |
|  +---------------------------------------------------------+     |
|  |  [x] Resource plan approved                            |     |
|  |      Required - Complete this item before advancing    |     |
|  |      [Go to Checklist]                                 |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Gate Advancement Notes                                           |
|  +---------------------------------------------------------+     |
|  |                                                   |     |     |
|  |  (Disabled - complete blockers first)            |     |     |
|  |                                                   |     |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  [Cancel]                    [Advance to G3] (disabled)          |
|                                                                   |
+------------------------------------------------------------------+
```

### Approval Required (G3+ Gates) - Desktop

```
+------------------------------------------------------------------+
|                    Advance Gate                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |    +-------+                        +-------+           |     |
|  |    |  G3   |    =============>      |  G4   |           |     |
|  |    | Devel |      Advancing to      | Test  |           |     |
|  |    | opmt  |                        | ing   |           |     |
|  |    +-------+                        +-------+           |     |
|  |     Current                          Target             |     |
|  |                                                         |     |
|  |  [shield] Approval Required - Manager/Director         |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST SUMMARY                                                |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  [========================================] 100%        |     |
|  |                                                         |     |
|  |  [check] Formulation created and locked     Completed   |     |
|  |  [check] Trial batches executed             Completed   |     |
|  |  [check] Allergen declaration validated     Completed   |     |
|  |  [check] Sensory evaluation passed          Completed   |     |
|  |                                                         |     |
|  |  4 of 4 required items complete                        |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  BLOCKERS                                                         |
|  +---------------------------------------------------------+     |
|  |  [check-circle] No blockers - Ready for approval       |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  APPROVAL SECTION                                        [lock]  |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  Approver *                                             |     |
|  |  [ Select approver...                          v ]      |     |
|  |                                                         |     |
|  |  Role Required: Manager, Director, or Admin            |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Gate Advancement Notes *                                         |
|  +---------------------------------------------------------+     |
|  | Development phase complete. Formulation v2.1 locked    |     |
|  | with final allergen declaration. Ready for testing     |     |
|  | phase pending management approval.                     |     |
|  +---------------------------------------------------------+     |
|  Required for audit trail                                         |
|                                                                   |
|  [Cancel]                               [Request Approval]       |
|                                                                   |
+------------------------------------------------------------------+
```

### Loading State

```
+------------------------------------------------------------------+
|                    Advance Gate                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |  [============================]                         |     |
|  |  [====================]                                 |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST SUMMARY                                                |
|  +---------------------------------------------------------+     |
|  |  [============================================]         |     |
|  |  [=============================]                        |     |
|  |  [================================]                     |     |
|  |  [===========================]                          |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Loading gate information...                                      |
|                                                                   |
+------------------------------------------------------------------+
```

### Error State

```
+------------------------------------------------------------------+
|                    Advance Gate                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  [!] Error: Unable to advance gate                               |
|      Gate entry criteria validation failed. Please try again.    |
|                                                                   |
|  [Gate transition and form continue to display]                   |
|                                                                   |
|  [Cancel]                                    [Retry]             |
|                                                                   |
+------------------------------------------------------------------+
```

### Success State (Toast)

```
+------------------------------------------------------------------+
|  [check] Gate Advanced Successfully                          [X] |
|  Project NPD-2024-015 advanced from G2 to G3                     |
+------------------------------------------------------------------+
```

---

## Key Elements

### Header Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Title | Text | "Advance Gate" | Fixed title |
| Close Button | IconButton | - | 48x48dp touch target |

### Gate Transition Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Current Gate Box | Badge/Box | `project.current_gate` | Blue/primary color |
| Arrow | Icon | - | Solid for ready, dashed for blocked |
| Target Gate Box | Badge/Box | Calculated next gate | Green for ready, gray for blocked |
| Blocked Indicator | Badge | Conditional | Yellow warning if blockers exist |
| Approval Badge | Badge | Conditional | Shield icon for G3+ gates |

### Gate Labels
| Gate | Full Name | Short Name |
|------|-----------|------------|
| G0 | Idea | Idea |
| G1 | Feasibility | Feasi |
| G2 | Business Case | Busi |
| G3 | Development | Devel |
| G4 | Testing | Test |
| Launched | Launched | Launch |

### Checklist Summary Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Progress Bar | Progress | Calculated | Green if 100%, yellow otherwise |
| Percentage | Text | Calculated | "X%" |
| Checklist Items | List | `gate_checklists` | Max 5 visible, scrollable |
| Item Status Icon | Icon | `is_completed` | Check for complete, X for incomplete |
| Item Text | Text | `item_description` | Truncated with tooltip |
| Summary Text | Text | Calculated | "X of Y required items complete" |

### Blockers Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Blockers Count | Badge | Calculated | Red badge if > 0 |
| Blocker List | List | Incomplete required items | Red X icons |
| Blocker Description | Text | `item_description` | With "Required" label |
| Go to Checklist Link | Button | - | Opens checklist in project detail |
| No Blockers Message | Text | Conditional | Green check + "No blockers" |

### Approval Section (G3+ only)
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Section Header | Text | "Approval Section" | With lock icon |
| Approver Dropdown | Select | Users with Manager/Director/Admin role | Required |
| Role Info | Text | - | "Role Required: Manager, Director, or Admin" |

### Notes Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Label | Text | "Gate Advancement Notes *" | Required indicator |
| Textarea | Textarea | User input | min-height 100px, required |
| Helper Text | Text | - | "Required for audit trail" |
| Disabled State | Boolean | Has blockers | Grayed out if blockers exist |

### Action Buttons
| Button | State | Variant | Icon | Behavior |
|--------|-------|---------|------|----------|
| Cancel | All | Outline | - | Close modal, no changes |
| Advance to GX | Ready | Default (primary) | ArrowRight | Submit gate advancement |
| Advance to GX | Blocked | Disabled | ArrowRight | Tooltip: "Complete blockers first" |
| Request Approval | Approval Required | Default (primary) | Send | Submit approval request |
| Retry | Error | Default (primary) | RefreshCw | Retry failed operation |

---

## Business Logic

### Gate Entry Criteria Validation
```typescript
// Check if all required checklist items are complete
const checklistItems = await getChecklistItems(projectId, currentGate);
const requiredItems = checklistItems.filter(item => item.is_required);
const completedRequired = requiredItems.filter(item => item.is_completed);
const isReady = completedRequired.length === requiredItems.length;
const completionPercentage = (completedRequired.length / requiredItems.length) * 100;
```

### Gate Advancement Rules
| Current Gate | Target Gate | Approval Required | Additional Criteria |
|--------------|-------------|-------------------|---------------------|
| G0 | G1 | No | G0 checklist 100% |
| G1 | G2 | No | G1 approval, feasibility confirmed |
| G2 | G3 | No | G2 approval, business case approved, target cost set |
| G3 | G4 | Yes (Manager+) | G3 approval, formulation locked, trials complete |
| G4 | Launched | Yes (Director+) | G4 approval, compliance docs complete, costing approved |

### Approval Required Check
```typescript
const APPROVAL_REQUIRED_GATES = ['G3', 'G4'];
const requiresApproval = APPROVAL_REQUIRED_GATES.includes(currentGate);

// Get eligible approvers
const getEligibleApprovers = async (orgId: string, targetGate: string) => {
  const requiredRoles = targetGate === 'G4'
    ? ['director', 'admin']
    : ['manager', 'director', 'admin'];

  return await getOrgUsers(orgId, requiredRoles);
};
```

### Advancement Flow
1. User opens modal from project detail "Advance Gate" button
2. System loads current gate checklist items
3. System calculates completion percentage and blockers
4. If blockers exist:
   - Display blockers list
   - Disable notes and advance button
5. If no blockers and G0-G2:
   - User enters notes (required)
   - User clicks "Advance to GX"
   - API call: `POST /api/npd/projects/:id/advance-gate`
6. If no blockers and G3+:
   - User selects approver
   - User enters notes (required)
   - User clicks "Request Approval" (creates pending approval)
   - Approver notified
   - On approval: Gate advances automatically

### API Integration

```typescript
// Advance gate (G0-G2)
POST /api/npd/projects/:id/advance-gate
Body: { notes: string }
Response: {
  success: true,
  project: { current_gate: 'G2', status: 'business_case' },
  event_id: number
}

// Request approval (G3+)
POST /api/npd/projects/:id/advance-gate
Body: {
  notes: string,
  approver_id: string,
  approval_required: true
}
Response: {
  success: true,
  approval_request_id: number,
  status: 'pending_approval'
}

// Get checklist items
GET /api/npd/projects/:id/checklists?gate=G1
Response: {
  items: ChecklistItem[],
  completion_percentage: number,
  blockers: ChecklistItem[]
}
```

---

## Validation Rules

### Notes Field
| Rule | Error Message |
|------|---------------|
| Required | "Gate advancement notes are required" |
| Min 10 characters | "Notes must be at least 10 characters" |
| Max 1000 characters | "Notes cannot exceed 1000 characters" |

### Approver Field (G3+ only)
| Rule | Error Message |
|------|---------------|
| Required | "Please select an approver" |
| Valid role | "Selected user does not have approval permissions" |

### Pre-submission Validation
| Rule | Error |
|------|-------|
| All required checklist items complete | "Cannot advance: Complete all required checklist items" |
| Project not cancelled | "Cannot advance: Project has been cancelled" |
| Valid gate sequence | "Cannot advance: Invalid gate transition" |
| User has permission | "Access denied: You do not have permission to advance gates" |

---

## Accessibility

### ARIA Attributes
- `role="dialog"` on modal
- `aria-modal="true"`
- `aria-labelledby="advance-gate-title"`
- `aria-label` on action buttons
- `aria-required="true"` on notes textarea
- `aria-disabled="true"` on disabled advance button
- `role="alert"` on error messages and blockers
- `aria-live="polite"` on validation errors
- `role="progressbar"` on completion progress with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### Touch Targets
- All buttons: 48x48dp minimum
- Close button (X): 48x48dp
- Textarea: min-height 100px
- Dropdown: 48dp height
- Checklist items: 48dp row height

### Contrast
- Text on background: 4.5:1 minimum
- Gate badges: High contrast colors
- Progress bar: Green/yellow with sufficient contrast
- Error/blocker text: High contrast red
- Success indicators: High contrast green

### Keyboard Navigation
- Tab order: Close -> Gate summary -> Checklist items -> Blockers -> Approver (if shown) -> Notes -> Cancel -> Advance
- Enter: Submit form (when focus on button)
- Escape: Close modal (with confirmation if text entered)
- Arrow keys: Navigate checklist items

### Screen Reader
- Modal title announces: "Advance Gate"
- Gate transition: "Advancing from G1 Feasibility to G2 Business Case"
- Progress: "Checklist 75% complete, 3 of 4 required items"
- Blockers: "1 blocker preventing advancement"
- Required field announces: "Gate Advancement Notes, required"
- Button states: "Advance to G2, disabled, complete blockers first"

---

## Responsive Design

### Desktop (>1024px)
- Modal max-width: 600px (xl)
- Centered on screen
- Gate transition: Horizontal layout
- Checklist: Full list view
- Action buttons: Right-aligned, inline

### Tablet (768-1024px)
- Modal width: 90%
- Same layout as desktop
- Slightly reduced padding

### Mobile (<768px)
- Modal: Full-screen or max-height 90vh
- Gate transition: Vertical layout (stacked)
- Checklist: Collapsible accordion
- Action buttons: Full-width, stacked (Cancel above Advance)
- Approver dropdown: Full-width

---

## Performance

### Load Time
- Modal open animation: <200ms
- Checklist data: <300ms (pre-fetched from project detail)
- Approvers list: <200ms (cached)

### Action Time
- Advance gate API call: <500ms target (P95)
- Approval request: <500ms target (P95)
- Optimistic UI: Disable buttons immediately
- Event logging: Async (doesn't block UI)

---

## Testing Requirements

### Unit Tests
- Renders correctly in ready-to-advance state
- Renders correctly in has-blockers state
- Renders correctly in approval-required state
- Displays gate transition visualization
- Calculates completion percentage correctly
- Identifies blockers correctly
- Shows approval section for G3+ gates
- Validates notes (required, min/max length)
- Validates approver selection (G3+)
- Disables form when blockers exist
- Shows error messages correctly

### Integration Tests
- Calls advance-gate API with correct data
- Calls approval request API for G3+ gates
- Closes modal on success
- Calls onSuccess callback
- Shows toast on success/error
- Handles permission denied error
- Logs NPD.GateAdvanced event

### E2E Tests
- NPD Lead can advance G1 to G2 with notes
- Cannot advance with incomplete checklist (blockers shown)
- G3+ gates show approval section
- Manager can be selected as approver
- Approval request creates pending approval
- Approver receives notification
- Toast notifications appear on success
- Project status updates after advancement

---

## Implementation Notes

### Target Component Path
```
apps/frontend/components/npd/projects/AdvanceGateModal.tsx
```

### Dependencies
- `@/hooks/use-toast` - Toast notifications
- `@/components/ui/*` - ShadCN components (Dialog, Button, Textarea, Select, Progress, Badge, Skeleton)
- `lucide-react` - Icons (ArrowRight, Check, X, Shield, AlertCircle, CheckCircle2)
- `react-hook-form` + `zod` - Form validation

### Gate Status Mapping
```typescript
const GATE_STATUS_MAP = {
  G0: 'idea',
  G1: 'feasibility',
  G2: 'business_case',
  G3: 'development',
  G4: 'testing',
  Launched: 'launched'
};

const GATE_NAMES = {
  G0: 'Idea',
  G1: 'Feasibility',
  G2: 'Business Case',
  G3: 'Development',
  G4: 'Testing',
  Launched: 'Launched'
};
```

### Key Features to Implement
- [ ] Gate transition visualization
- [ ] Dynamic checklist loading per gate
- [ ] Blockers detection and display
- [ ] Approval section for G3+ gates
- [ ] Notes validation (required, min 10 chars)
- [ ] Form disabling when blockers exist
- [ ] Loading, error, success states
- [ ] Accessibility (ARIA, keyboard, screen reader)
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Toast notifications
- [ ] Event logging (NPD.GateAdvanced)

---

## Quality Gates

- [x] All 6 states defined (Loading, Ready, Blockers, Approval Required, Success, Error)
- [x] Gate transition visualization documented
- [x] Checklist completion logic specified
- [x] Blockers detection and display defined
- [x] Approval flow for G3+ gates documented
- [x] Validation rules specified
- [x] API endpoints documented
- [x] Accessibility requirements met (WCAG AA)
- [x] Responsive breakpoints defined
- [x] Touch targets 48x48dp minimum
- [x] Keyboard navigation support
- [x] Screen reader support
- [x] Business logic documented

---

**Status**: Wireframe Defined
**Component**: `AdvanceGateModal.tsx`
**Story**: NPD Gate Advancement
**Approved**: Pending review
