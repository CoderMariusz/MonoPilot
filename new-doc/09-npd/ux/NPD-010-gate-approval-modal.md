# NPD-010: Gate Approval Modal

**Module**: NPD (New Product Development)
**Story**: NPD Gate Approval Workflow
**Feature**: NPD-FR-02, NPD-FR-03, NPD-FR-19, NPD-FR-20
**Status**: Wireframe Defined
**Component**: `GateApprovalModal.tsx`
**Last Updated**: 2026-01-15

---

## Overview

Modal component for approving or rejecting gate advancement requests in the NPD Stage-Gate workflow. Used by managers and directors to review gate transition requests (primarily G3+ gates that require formal approval). Displays project context, gate transition visualization, checklist completion status, and provides approve/reject decision workflow with e-signature verification.

**Business Context:**
- Gates G3+ require formal approval from Manager/Director roles
- Approvers must review checklist completion and project status
- E-signature (password confirmation) required for audit compliance
- Rejection must include reason for audit trail

**Related Wireframes:**
- NPD-005: Advance Gate Modal (requests approval)
- NPD-003: Stage-Gate Timeline (shows approval status)
- PLA-020: PO Approval Modal (pattern reference)

---

## Component States

### 1. Loading State
- Skeleton placeholders for project header, gate transition, checklist summary
- Loading message: "Loading approval request..."
- No interactive elements visible

### 2. Approve Mode State
- Project header with number and name
- Gate transition visual (current -> target with arrow)
- Checklist completion status (must be 100%)
- Approval notes textarea (required)
- Submit Approval button enabled
- E-signature prompt triggered on submit

### 3. Reject Mode State
- Same project header and gate transition
- Checklist status (may show incomplete items as reason for rejection)
- Rejection reason textarea (required, min 10 characters)
- Reject button in destructive style
- No e-signature required for rejection

### 4. E-Signature Prompt State
- Overlay dialog within modal
- Password confirmation field
- "I confirm this gate approval" checkbox
- Cancel and Confirm buttons
- Error state for invalid password

### 5. Submitting State
- Form disabled
- Spinner on action button
- "Processing approval..." message
- All inputs read-only

### 6. Success State
- Success icon and message
- "Gate advancement approved" or "Gate advancement rejected"
- Notification sent confirmation
- Auto-close after 2 seconds or manual close

---

## ASCII Wireframe

### Approve Mode - Desktop

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  PROJECT HEADER                                                   |
|  +---------------------------------------------------------+     |
|  |  NPD-2026-015                                           |     |
|  |  Veggie Burger 200g Premium                             |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |    +-------+                        +-------+           |     |
|  |    |  G3   |    =============>      |  G4   |           |     |
|  |    | Devel |     Approval for       | Test  |           |     |
|  |    | opmt  |                        | ing   |           |     |
|  |    +-------+                        +-------+           |     |
|  |     Current                          Target             |     |
|  |                                                         |     |
|  |  [shield] Manager/Director Approval Required            |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST COMPLETION STATUS                                      |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  [========================================] 100%        |     |
|  |                                                         |     |
|  |  All Required Items Complete                            |     |
|  |                                                         |     |
|  |  [check] Formulation created and locked     Completed   |     |
|  |  [check] Trial batches executed             Completed   |     |
|  |  [check] Allergen declaration validated     Completed   |     |
|  |  [check] Sensory evaluation passed          Completed   |     |
|  |                                                         |     |
|  |  4 of 4 required items complete                        |     |
|  |                                                         |     |
|  |  [View Full Checklist]                                 |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Incomplete Items (0)                                             |
|  +---------------------------------------------------------+     |
|  |  [check-circle] No incomplete items - Ready to approve  |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  DECISION                                                         |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  ( ) Approve Gate Advancement                           |     |
|  |  ( ) Reject Gate Advancement                            |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Approval Notes *                                                 |
|  +---------------------------------------------------------+     |
|  | Development phase completed satisfactorily.             |     |
|  | Formulation v2.1 meets all quality standards.           |     |
|  | Approved to proceed to Testing phase.                   |     |
|  +---------------------------------------------------------+     |
|  Required for audit trail                                         |
|                                                                   |
|  [Cancel]                               [Submit Approval]        |
|                                                                   |
+------------------------------------------------------------------+
```

### Reject Mode - Desktop

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  PROJECT HEADER                                                   |
|  +---------------------------------------------------------+     |
|  |  NPD-2026-018                                           |     |
|  |  Organic Protein Bar 50g                                |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |    +-------+         X X X X         +-------+           |     |
|  |    |  G3   |     - - - - - - - >     |  G4   |           |     |
|  |    | Devel |       Rejecting         | Test  |           |     |
|  |    | opmt  |                         | ing   |           |     |
|  |    +-------+                         +-------+           |     |
|  |     Current                           Target             |     |
|  |                                                         |     |
|  |  [!] Rejection - Project stays at G3                    |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST COMPLETION STATUS                                      |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  [================================--------] 80%          |     |
|  |                                                         |     |
|  |  4 of 5 Required Items Complete                         |     |
|  |                                                         |     |
|  |  [check] Formulation created                 Completed   |     |
|  |  [check] Trial batches executed              Completed   |     |
|  |  [check] Allergen declaration validated      Completed   |     |
|  |  [check] Sensory evaluation passed           Completed   |     |
|  |  [x]     Cost estimate within target         Incomplete  |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Incomplete Items (1)                                    [!]     |
|  +---------------------------------------------------------+     |
|  |  [x] Cost estimate within target                        |     |
|  |      Current estimate 15% over target cost              |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  DECISION                                                         |
|  +---------------------------------------------------------+     |
|  |                                                         |     |
|  |  ( ) Approve Gate Advancement                           |     |
|  |  (o) Reject Gate Advancement                            |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Rejection Reason *                                               |
|  +---------------------------------------------------------+     |
|  | Cannot approve advancement to Testing phase.            |     |
|  | Cost estimate exceeds target by 15%. Please revise      |     |
|  | formulation to reduce ingredient costs or negotiate     |     |
|  | supplier pricing before resubmitting.                   |     |
|  +---------------------------------------------------------+     |
|  Minimum 10 characters required                                   |
|                                                                   |
|  [Cancel]                                 [Reject Advancement]   |
|                                                                   |
+------------------------------------------------------------------+
```

### E-Signature Prompt State

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  [Previous form content grayed out / dimmed]                      |
|                                                                   |
|  +-------------------------------------------------------+       |
|  |                                                       |       |
|  |              E-SIGNATURE CONFIRMATION                 |       |
|  |                                                       |       |
|  |  +-------------------------------------------------+  |       |
|  |  |                                                 |  |       |
|  |  |  [shield-check] Signature Required             |  |       |
|  |  |                                                 |  |       |
|  |  |  You are about to approve gate advancement     |  |       |
|  |  |  from G3 (Development) to G4 (Testing) for:    |  |       |
|  |  |                                                 |  |       |
|  |  |  Project: NPD-2026-015                         |  |       |
|  |  |  Veggie Burger 200g Premium                    |  |       |
|  |  |                                                 |  |       |
|  |  |  This action will be recorded in the audit     |  |       |
|  |  |  trail with your electronic signature.         |  |       |
|  |  |                                                 |  |       |
|  |  +-------------------------------------------------+  |       |
|  |                                                       |       |
|  |  Password *                                           |       |
|  |  +-------------------------------------------------+  |       |
|  |  | ************                                    |  |       |
|  |  +-------------------------------------------------+  |       |
|  |  Enter your account password to confirm             |       |
|  |                                                       |       |
|  |  [x] I confirm this gate advancement approval and    |       |
|  |      understand this action is recorded for audit    |       |
|  |      compliance.                                      |       |
|  |                                                       |       |
|  |  [Cancel]                    [Confirm & Approve]     |       |
|  |                                                       |       |
|  +-------------------------------------------------------+       |
|                                                                   |
+------------------------------------------------------------------+
```

### E-Signature Error State

```
+-------------------------------------------------------+
|              E-SIGNATURE CONFIRMATION                 |
|                                                       |
|  [Previous content...]                                |
|                                                       |
|  Password *                                           |
|  +-------------------------------------------------+  |
|  | ************                              [eye] |  |
|  +-------------------------------------------------+  |
|  [!] Invalid password. Please try again.            |
|                                                       |
|  [x] I confirm this gate advancement approval...     |
|                                                       |
|  Attempts: 2 of 3                                     |
|                                                       |
|  [Cancel]                    [Confirm & Approve]     |
|                                                       |
+-------------------------------------------------------+
```

### Submitting State

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  [All form content visible but dimmed/disabled]                   |
|                                                                   |
|                      +------------------------+                   |
|                      |     [Spinner]          |                   |
|                      |                        |                   |
|                      |  Processing approval...|                   |
|                      |                        |                   |
|                      +------------------------+                   |
|                                                                   |
|  [Cancel] (disabled)                   [Submit Approval] (loading)|
|                                                                   |
+------------------------------------------------------------------+
```

### Success State

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|                      +------------------------+                   |
|                      |                        |                   |
|                      |     [check-circle]     |                   |
|                      |                        |                   |
|                      +------------------------+                   |
|                                                                   |
|              Gate Advancement Approved Successfully               |
|                                                                   |
|  NPD-2026-015 has been approved to advance from G3 to G4.        |
|                                                                   |
|  The project owner (Sarah Wilson) has been notified.             |
|                                                                   |
|  +-------------------------------------------------------+       |
|  |  Approval Details                                      |       |
|  |  Approved by: John Smith (Director)                   |       |
|  |  Approved at: 2026-01-15 14:32:05                     |       |
|  |  Signature ID: SIG-2026-00845                         |       |
|  +-------------------------------------------------------+       |
|                                                                   |
|                                                                   |
|                    [View Project]    [Close]                      |
|                                                                   |
+------------------------------------------------------------------+
```

### Success State - Rejection

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|                      +------------------------+                   |
|                      |                        |                   |
|                      |     [x-circle]         |                   |
|                      |                        |                   |
|                      +------------------------+                   |
|                                                                   |
|               Gate Advancement Rejected                           |
|                                                                   |
|  NPD-2026-018 advancement from G3 to G4 has been rejected.       |
|                                                                   |
|  The project owner (Mike Brown) has been notified with the       |
|  rejection reason and required actions.                          |
|                                                                   |
|  +-------------------------------------------------------+       |
|  |  Rejection Details                                     |       |
|  |  Rejected by: John Smith (Director)                   |       |
|  |  Rejected at: 2026-01-15 14:45:22                     |       |
|  |  Reason: Cost estimate exceeds target by 15%...       |       |
|  +-------------------------------------------------------+       |
|                                                                   |
|                                                                   |
|                    [View Project]    [Close]                      |
|                                                                   |
+------------------------------------------------------------------+
```

### Loading State

```
+------------------------------------------------------------------+
|                    Gate Approval                              [X] |
+------------------------------------------------------------------+
|                                                                   |
|  PROJECT HEADER                                                   |
|  +---------------------------------------------------------+     |
|  |  [=======================================]               |     |
|  |  [==================================]                    |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  GATE TRANSITION                                                  |
|  +---------------------------------------------------------+     |
|  |  [==============================================]        |     |
|  |  [==========================]                            |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  CHECKLIST STATUS                                                 |
|  +---------------------------------------------------------+     |
|  |  [==========================================]            |     |
|  |  [========================]                              |     |
|  |  [==================================]                    |     |
|  |  [============================]                          |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  Loading approval request...                                      |
|                                                                   |
+------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|     Gate Approval           [X]  |
+----------------------------------+
|                                  |
|  NPD-2026-015                    |
|  Veggie Burger 200g Premium      |
|                                  |
|  +----------------------------+  |
|  |  [G3] =====> [G4]         |  |
|  |  Devel       Testing       |  |
|  +----------------------------+  |
|  [shield] Approval Required      |
|                                  |
|  Checklist: 100% Complete        |
|  [==========================]    |
|                                  |
|  [check] 4/4 items complete      |
|  [View Checklist v]              |
|                                  |
|  +----------------------------+  |
|  | Decision:                  |  |
|  | ( ) Approve                |  |
|  | ( ) Reject                 |  |
|  +----------------------------+  |
|                                  |
|  Approval Notes *                |
|  +----------------------------+  |
|  |                            |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [Cancel]                   |  |
|  +----------------------------+  |
|  | [Submit Approval]          |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

---

## Key Elements

### Header Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Title | Text | "Gate Approval" | Fixed title |
| Close Button | IconButton | - | 48x48dp touch target |

### Project Header
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Project Number | Text | `project.project_number` | Font-mono, e.g., "NPD-2026-015" |
| Project Name | Text | `project.project_name` | Semibold, e.g., "Veggie Burger 200g Premium" |

### Gate Transition Display
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Current Gate Box | Badge/Box | `approval_request.current_gate` | Blue primary color |
| Arrow | Icon/Visual | - | Solid green for approve, dashed red for reject |
| Target Gate Box | Badge/Box | `approval_request.target_gate` | Green for approve, gray for reject |
| Approval Badge | Badge | Conditional | Shield icon indicating approval requirement |
| Rejection Indicator | Badge | Conditional | Warning icon if rejecting |

### Gate Labels
| Gate | Full Name | Short Name |
|------|-----------|------------|
| G0 | Idea | Idea |
| G1 | Feasibility | Feasi |
| G2 | Business Case | Busi |
| G3 | Development | Devel |
| G4 | Testing | Test |
| Launched | Launched | Launch |

### Checklist Completion Status
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Progress Bar | Progress | Calculated | Green if 100%, yellow/orange otherwise |
| Percentage | Text | Calculated | "X%" |
| Status Text | Text | Calculated | "All Required Items Complete" or "X of Y Complete" |
| Checklist Items | List | `gate_checklists` | Max 5 visible, scrollable |
| Item Status Icon | Icon | `is_completed` | Check for complete, X for incomplete |
| View Full Checklist | Link | - | Opens detailed checklist view |

### Incomplete Items List
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Section Header | Text | "Incomplete Items (N)" | With warning badge if N > 0 |
| No Items Message | Text | Conditional | Green check + "No incomplete items" |
| Item List | List | Filtered incomplete items | Red X icons, with reason/details |

### Decision Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Radio Group | RadioGroup | User selection | Approve / Reject options |
| Approve Option | Radio | - | Default not selected |
| Reject Option | Radio | - | Triggers reject mode |

### Approval Notes (Approve Mode)
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Label | Text | "Approval Notes *" | Required indicator |
| Textarea | Textarea | User input | min-height 100px, required |
| Helper Text | Text | - | "Required for audit trail" |

### Rejection Reason (Reject Mode)
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Label | Text | "Rejection Reason *" | Required indicator, red asterisk |
| Textarea | Textarea | User input | min-height 100px, required |
| Helper Text | Text | - | "Minimum 10 characters required" |
| Validation Error | Text | - | Red text below if validation fails |

### E-Signature Dialog
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| Dialog Header | Text | "E-Signature Confirmation" | With shield icon |
| Context Summary | Text | - | Project number, name, gate transition |
| Password Field | Input | User input | type="password", required |
| Confirmation Checkbox | Checkbox | User selection | Required to enable confirm button |
| Attempt Counter | Text | - | "Attempts: X of 3" |
| Error Message | Text | Conditional | Invalid password error |
| Cancel Button | Button | - | Closes e-signature dialog only |
| Confirm Button | Button | - | Disabled until checkbox checked |

### Action Buttons
| Button | Mode | Variant | Icon | Behavior |
|--------|------|---------|------|----------|
| Cancel | Both | Outline | - | Close modal, no changes |
| Submit Approval | Approve | Default (primary) | CheckCircle | Opens e-signature prompt |
| Reject Advancement | Reject | Destructive (red) | XCircle | Submit rejection (no e-sig needed) |
| Confirm & Approve | E-Signature | Default (primary) | Shield | Complete approval with signature |

---

## Business Logic

### Permission Check
```typescript
// Only users with Manager/Director/Admin roles can approve gates
const APPROVAL_ROLES = ['manager', 'director', 'admin'];

const canApproveGate = (user: User, targetGate: string): boolean => {
  // G4 -> Launched requires Director+
  if (targetGate === 'Launched') {
    return ['director', 'admin'].includes(user.role);
  }
  // G3 -> G4 requires Manager+
  return APPROVAL_ROLES.includes(user.role);
};
```

### Gate Approval Rules
| Current Gate | Target Gate | Approval Roles | E-Signature Required |
|--------------|-------------|----------------|---------------------|
| G3 | G4 | Manager, Director, Admin | Yes |
| G4 | Launched | Director, Admin | Yes |

### Approval Flow
1. Approval request created from NPD-005 (Advance Gate Modal)
2. Approver opens NPD-010 (this modal) from notification or approval queue
3. System displays project context, gate transition, checklist status
4. Approver selects decision (Approve or Reject)
5. If Approve:
   - Approver enters approval notes (required)
   - Approver clicks "Submit Approval"
   - E-signature dialog appears
   - Approver enters password and confirms checkbox
   - System validates password
   - If valid: API call to approve gate
   - Gate advances, notifications sent
6. If Reject:
   - Approver enters rejection reason (required, min 10 chars)
   - Approver clicks "Reject Advancement"
   - No e-signature needed for rejection
   - API call to reject gate request
   - Project stays at current gate
   - Owner notified with rejection reason

### E-Signature Validation
```typescript
const validateESignature = async (userId: string, password: string): Promise<boolean> => {
  // Verify password against user's stored credentials
  const isValid = await verifyPassword(userId, password);

  // Track attempts (max 3)
  if (!isValid) {
    incrementFailedAttempts(userId);
    const attempts = getFailedAttempts(userId);
    if (attempts >= 3) {
      lockApprovalTemporarily(userId);
      throw new Error('Too many failed attempts. Please try again in 15 minutes.');
    }
  }

  return isValid;
};

const createSignatureRecord = async (
  userId: string,
  action: 'gate_approval',
  entityId: string,
  notes: string
): Promise<SignatureRecord> => {
  return {
    id: generateSignatureId(),  // SIG-2026-XXXXX
    user_id: userId,
    action,
    entity_type: 'npd_project',
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    notes
  };
};
```

---

## API Integration

### Endpoints Used

```typescript
// Get approval request details
GET /api/npd/approval-requests/:id
Response: {
  id: string,
  project: {
    id: string,
    project_number: string,
    project_name: string,
    current_gate: string
  },
  target_gate: string,
  requested_by: { id: string, name: string },
  requested_at: string,
  notes: string,
  checklist_summary: {
    total: number,
    completed: number,
    percentage: number,
    items: ChecklistItem[],
    incomplete_items: ChecklistItem[]
  }
}

// Approve gate advancement
POST /api/npd/approval-requests/:id/approve
Body: {
  approval_notes: string,
  signature: {
    password: string,
    confirmed: boolean
  }
}
Response: {
  success: true,
  project: {
    id: string,
    current_gate: string,  // Now the target gate
    previous_gate: string
  },
  signature_id: string,
  approved_by: { id: string, name: string },
  approved_at: string,
  notification_sent: true
}

// Reject gate advancement
POST /api/npd/approval-requests/:id/reject
Body: {
  rejection_reason: string
}
Response: {
  success: true,
  project: {
    id: string,
    current_gate: string  // Unchanged
  },
  rejected_by: { id: string, name: string },
  rejected_at: string,
  notification_sent: true
}
```

### Error Responses
```typescript
// 400 Bad Request
{ error: 'INVALID_PASSWORD', message: 'Invalid password provided' }
{ error: 'CONFIRMATION_REQUIRED', message: 'Confirmation checkbox not checked' }
{ error: 'NOTES_REQUIRED', message: 'Approval notes are required' }
{ error: 'REASON_TOO_SHORT', message: 'Rejection reason must be at least 10 characters' }

// 403 Forbidden
{ error: 'PERMISSION_DENIED', message: 'You do not have permission to approve this gate' }
{ error: 'ACCOUNT_LOCKED', message: 'Too many failed attempts. Please try again later.' }

// 409 Conflict
{ error: 'ALREADY_PROCESSED', message: 'This approval request has already been processed' }
{ error: 'GATE_CHANGED', message: 'Project gate has changed since request was made' }
```

---

## Validation Rules

### Approval Mode
| Field | Rule | Error Message |
|-------|------|---------------|
| Decision | Required (Approve selected) | "Please select a decision" |
| approval_notes | Required | "Approval notes are required" |
| approval_notes | Min 10 chars | "Notes must be at least 10 characters" |
| approval_notes | Max 1000 chars | "Notes cannot exceed 1000 characters" |

### Reject Mode
| Field | Rule | Error Message |
|-------|------|---------------|
| Decision | Required (Reject selected) | "Please select a decision" |
| rejection_reason | Required | "Rejection reason is required" |
| rejection_reason | Min 10 chars | "Please provide a more detailed reason (minimum 10 characters)" |
| rejection_reason | Max 1000 chars | "Reason cannot exceed 1000 characters" |

### E-Signature Validation
| Field | Rule | Error Message |
|-------|------|---------------|
| password | Required | "Password is required" |
| password | Valid | "Invalid password. Please try again." |
| password | Max 3 attempts | "Too many failed attempts. Please try again in 15 minutes." |
| confirmation | Required (checked) | "Please confirm by checking the box" |

### Pre-submission Validation
| Rule | Error |
|------|-------|
| Request not already processed | "This approval request has already been processed" |
| User has approval permission | "You do not have permission to approve this gate" |
| Gate hasn't changed | "Project gate has changed since request was made" |
| User not locked | "Your account is temporarily locked due to failed attempts" |

---

## Accessibility

### ARIA Attributes
- `role="dialog"` on modal
- `aria-modal="true"`
- `aria-labelledby="gate-approval-title"`
- `aria-describedby="gate-approval-description"`
- `aria-label` on action buttons
- `aria-required="true"` on required fields
- `aria-invalid="true"` on fields with validation errors
- `role="radiogroup"` on decision section
- `aria-checked` on radio buttons
- `role="alert"` on error messages
- `aria-live="polite"` on validation errors and status changes
- `role="progressbar"` on checklist completion with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### Touch Targets
- All buttons: 48x48dp minimum
- Close button (X): 48x48dp
- Radio buttons: 48x48dp clickable area
- Textarea: min-height 100px
- Checkbox: 48x48dp clickable area
- Password input: 48dp height

### Contrast
- Text on background: 4.5:1 minimum
- Gate badges: High contrast colors
- Progress bar: Green/yellow with sufficient contrast
- Error messages: High contrast red (#DC2626)
- Success messages: High contrast green (#16A34A)
- Disabled elements: 3:1 minimum

### Keyboard Navigation
- Tab order: Close -> Project info -> Gate transition -> Checklist -> Decision radios -> Notes/Reason -> Cancel -> Submit
- Enter: Submit form when focus on button
- Escape: Close modal (with confirmation if form has changes)
- Space: Toggle checkbox, select radio
- Arrow keys: Navigate between radio options

### Screen Reader
- Modal title announces: "Gate Approval"
- Project context: "Project NPD-2026-015, Veggie Burger 200g Premium"
- Gate transition: "Approving gate advancement from G3 Development to G4 Testing"
- Checklist status: "Checklist 100% complete, 4 of 4 required items"
- Decision: "Approve Gate Advancement, radio button, not selected"
- Required field announces: "Approval Notes, required"
- Button states: "Submit Approval button"
- E-signature: "E-Signature Confirmation dialog, enter password to confirm"
- Validation errors announced via aria-live

---

## Responsive Design

### Desktop (>1024px)
- Modal max-width: 640px (2xl)
- Centered on screen
- Gate transition: Horizontal layout with boxes and arrow
- Checklist: Full list view (max 5 visible, scrollable)
- Decision: Horizontal radio group
- Action buttons: Right-aligned, inline

### Tablet (768-1024px)
- Modal width: 90%
- Same layout as desktop
- Slightly reduced padding
- Checklist items: May truncate with tooltip

### Mobile (<768px)
- Modal: Full-screen or max-height 90vh
- Gate transition: Compact horizontal (abbreviations)
- Checklist: Collapsed by default, expandable
- Decision: Vertical stacked radio buttons
- Action buttons: Full-width, stacked (Cancel above Submit)
- E-signature dialog: Full-width within modal

---

## Performance

### Load Time
- Modal open animation: <200ms
- Approval request data: <300ms (single API call)
- Checklist data: Included in approval request response

### Action Time
- Approve/Reject API call: <500ms target (P95)
- E-signature validation: <300ms
- Optimistic UI: Disable buttons immediately
- Toast notification: Show on success/error
- Email notification: Queued async (doesn't block UI)

### Caching
- Approval request data: No cache (always fresh)
- User role/permission: Cached from session

---

## Testing Requirements

### Unit Tests
- Renders correctly in approve mode
- Renders correctly in reject mode
- Displays project header correctly
- Displays gate transition visualization
- Calculates and displays checklist completion
- Shows incomplete items when present
- Validates approval notes (required, min/max length)
- Validates rejection reason (required, min/max length)
- E-signature dialog opens on submit approval
- E-signature validates password
- E-signature tracks attempts
- Disables form during submission
- Shows error messages correctly
- Shows success state correctly

### Integration Tests
- Calls approve API with correct data including signature
- Calls reject API with correct data
- Closes modal on success
- Calls onSuccess callback
- Shows toast on success/error
- Handles permission denied error
- Handles already processed error
- Handles invalid password error
- Locks after 3 failed attempts

### E2E Tests
- Director can approve G3->G4 gate with e-signature
- Manager can approve G3->G4 gate with e-signature
- Director can reject gate with reason
- Invalid password shows error, tracks attempts
- Account locks after 3 failed attempts
- Cannot submit approval without notes
- Cannot submit rejection without reason (min 10 chars)
- Non-approver sees permission error
- Modal closes on cancel
- Toast notifications appear on success
- Project owner receives notification email
- Signature record created in audit trail

---

## Implementation Notes

### Target Component Path
```
apps/frontend/components/npd/projects/GateApprovalModal.tsx
```

### Dependencies
- `@/hooks/use-toast` - Toast notifications
- `@/components/ui/*` - ShadCN components (Dialog, Button, Textarea, RadioGroup, Checkbox, Progress, Badge, Skeleton, Input)
- `lucide-react` - Icons (ArrowRight, Check, X, Shield, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Eye, EyeOff)
- `react-hook-form` + `zod` - Form validation
- `@/lib/services/signature-service` - E-signature creation and validation

### Gate Status Mapping
```typescript
const GATE_NAMES = {
  G0: 'Idea',
  G1: 'Feasibility',
  G2: 'Business Case',
  G3: 'Development',
  G4: 'Testing',
  Launched: 'Launched'
};

const GATE_SHORT_NAMES = {
  G0: 'Idea',
  G1: 'Feasi',
  G2: 'Busi',
  G3: 'Devel',
  G4: 'Test',
  Launched: 'Launch'
};
```

### Key Features to Implement
- [ ] Project header display
- [ ] Gate transition visualization (current -> target)
- [ ] Checklist completion status with progress bar
- [ ] Incomplete items list with details
- [ ] Approve/Reject decision radio group
- [ ] Approval notes textarea (approve mode)
- [ ] Rejection reason textarea (reject mode)
- [ ] E-signature dialog with password confirmation
- [ ] Attempt tracking and account locking
- [ ] Loading, submitting, success, error states
- [ ] Accessibility (ARIA, keyboard, screen reader)
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Toast notifications
- [ ] Signature record creation

---

## Quality Gates

- [x] All 6 states defined (Loading, Approve Mode, Reject Mode, E-Signature, Submitting, Success)
- [x] Project header documented
- [x] Gate transition visualization documented
- [x] Checklist completion status documented
- [x] Decision section (Approve/Reject) documented
- [x] E-signature prompt documented
- [x] Validation rules specified
- [x] API endpoints documented
- [x] Accessibility requirements met (WCAG AA)
- [x] Responsive breakpoints defined
- [x] Touch targets 48x48dp minimum
- [x] Keyboard navigation support
- [x] Screen reader support
- [x] E-signature security documented
- [x] Audit trail compliance documented

---

**Status**: Wireframe Defined
**Component**: `GateApprovalModal.tsx`
**Story**: NPD Gate Approval Workflow
**Approved**: Pending review
**PRD Coverage**: NPD-FR-02, NPD-FR-03, NPD-FR-19, NPD-FR-20
**Estimated Effort**: 8-10 hours implementation
