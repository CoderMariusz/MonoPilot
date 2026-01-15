# NPD-003: Stage-Gate Timeline Stepper

**Module**: NPD (New Product Development)
**Feature**: Stage-Gate Workflow Visualization (Story 8.2 - Project Workflow)
**Type**: Component (Embedded in Project Detail View)
**Path**: `/npd/projects/{id}` (Timeline section)
**ID**: NPD-003
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## Overview

Horizontal stepper component displaying NPD project progress through the Stage-Gate workflow. Shows all 6 gates (G0-G4 + Launched) with visual indicators for completion status, approval dates, and blocking conditions.

**Business Context:**
- Stage-Gate is the core NPD workflow methodology
- Each gate represents a decision point requiring checklist completion and approval
- Projects cannot advance to next gate until current gate criteria are met
- Visual timeline helps stakeholders understand project status at a glance

**Critical Gap Filled:**
- NPD-FR-02: System shall advance projects through Stage-Gate workflow
- NPD-FR-03: System shall enforce gate entry criteria
- NPD-FR-17: System shall display gate checklists
- NPD-FR-20: System shall block advancement for incomplete items

**Component Purpose:**
- Display all 6 stages in horizontal timeline
- Show current gate with progress indicator
- Indicate completed gates with approver and date
- Show future gates with estimated dates
- Alert on blocking conditions (incomplete required items)
- Allow click to view gate details/history

---

## ASCII Wireframes

### G0-Active State (New Project)

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|   [G0]-------[G1]-------[G2]-------[G3]-------[G4]------[Launched]          |
|    ||         O          O          O          O           O                |
|  ACTIVE                                                                      |
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |        G0: Idea                                            [CURRENT]  |  |
|  |  +-------------------------------------------------------------------+|  |
|  |  |                                                                   ||  |
|  |  |  Checklist Progress: 2/4 items (50%)                              ||  |
|  |  |  [============================------------]                       ||  |
|  |  |                                                                   ||  |
|  |  |  Required Items:                                                  ||  |
|  |  |  [x] Initial concept documented                                   ||  |
|  |  |  [x] Target market identified                                     ||  |
|  |  |  [ ] Preliminary resource estimate                                ||  |
|  |  |  [ ] Owner assigned                                               ||  |
|  |  |                                                                   ||  |
|  |  |  [!] Complete all required items to advance                       ||  |
|  |  |                                                                   ||  |
|  |  +-------------------------------------------------------------------+|  |
|  |                                                                       |  |
|  |  Started: 2026-01-10 | Target: 2026-01-20 | 10 days remaining        |  |
|  |                                                                       |  |
|  |  [Complete & Advance to G1]  (disabled - checklist incomplete)       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
|  Upcoming Gates:                                                             |
|  G1: Feasibility (Est. 2026-01-20) | G2: Business Case (Est. 2026-02-15)   |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### G2-Active State (Mid-Development)

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|   [G0]-------[G1]-------[G2]-------[G3]-------[G4]------[Launched]          |
|    *          *         ||          O          O           O                |
|  DONE       DONE      ACTIVE                                                 |
|                                                                              |
|  Completed Gates:                                                            |
|  +----------------------------------+ +----------------------------------+   |
|  | G0: Idea              [check]   | | G1: Feasibility       [check]   |   |
|  | Approved: 2026-01-15            | | Approved: 2026-02-01            |   |
|  | By: John Smith                  | | By: Jane Doe                    |   |
|  | [View Details]                  | | [View Details]                  |   |
|  +----------------------------------+ +----------------------------------+   |
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |        G2: Business Case                                   [CURRENT]  |  |
|  |  +-------------------------------------------------------------------+|  |
|  |  |                                                                   ||  |
|  |  |  Checklist Progress: 3/4 items (75%)                              ||  |
|  |  |  [=======================================-------]                 ||  |
|  |  |                                                                   ||  |
|  |  |  Required Items:                                                  ||  |
|  |  |  [x] Business case documented                                     ||  |
|  |  |  [x] Target cost approved                                         ||  |
|  |  |  [x] Target margin confirmed                                      ||  |
|  |  |  [ ] Resource plan approved                                       ||  |
|  |  |                                                                   ||  |
|  |  |  [!] 1 item remaining                                             ||  |
|  |  |                                                                   ||  |
|  |  +-------------------------------------------------------------------+|  |
|  |                                                                       |  |
|  |  Started: 2026-02-01 | Target: 2026-02-20 | 5 days remaining         |  |
|  |                                                                       |  |
|  |  [Complete & Advance to G3]  (disabled - checklist incomplete)       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
|  Upcoming Gates:                                                             |
|  G3: Development (Est. 2026-02-20) | G4: Testing (Est. 2026-03-15)         |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### G4-Active with Blocking Indicator

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|   [G0]-------[G1]-------[G2]-------[G3]-------[G4]------[Launched]          |
|    *          *          *          *         ||           O                |
|  DONE       DONE       DONE       DONE      ACTIVE                          |
|                                                                              |
|  Completed Gates: G0, G1, G2, G3                           [Show All Gates] |
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |  [!] BLOCKED     G4: Testing                               [CURRENT]  |  |
|  |  +-------------------------------------------------------------------+|  |
|  |  |                                                                   ||  |
|  |  |  Checklist Progress: 3/5 items (60%)                              ||  |
|  |  |  [============================----------------------]             ||  |
|  |  |                                                                   ||  |
|  |  |  Required Items:                                                  ||  |
|  |  |  [x] Shelf-life testing complete                                  ||  |
|  |  |  [x] HACCP plan approved                                          ||  |
|  |  |  [ ] Label proof approved                            <-- BLOCKING ||  |
|  |  |  [ ] Compliance documents uploaded                   <-- BLOCKING ||  |
|  |  |  [x] Sensory evaluation passed                                    ||  |
|  |  |                                                                   ||  |
|  |  |  +---------------------------------------------------------------+||  |
|  |  |  | [!!] BLOCKING ISSUES (2)                                      |||  |
|  |  |  |                                                               |||  |
|  |  |  | - Label proof: Not uploaded. Upload in Documents section.     |||  |
|  |  |  | - Compliance docs: HACCP PDF missing. Contact Regulatory.     |||  |
|  |  |  |                                                               |||  |
|  |  |  | These items MUST be completed before advancing to Launch.     |||  |
|  |  |  +---------------------------------------------------------------+||  |
|  |  |                                                                   ||  |
|  |  +-------------------------------------------------------------------+|  |
|  |                                                                       |  |
|  |  Started: 2026-03-15 | Target: 2026-04-01 | OVERDUE by 14 days       |  |
|  |                                                                       |  |
|  |  [Complete & Launch]  (disabled - 2 blocking items)                  |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### Launched State (Complete)

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|   [G0]-------[G1]-------[G2]-------[G3]-------[G4]------[Launched]          |
|    *          *          *          *          *          [check]           |
|  DONE       DONE       DONE       DONE       DONE       COMPLETE            |
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |  [check] PROJECT LAUNCHED                                              |  |
|  |                                                                       |  |
|  |  Launch Date: 2026-04-20                                              |  |
|  |  Total Duration: 100 days (Target: 90 days)                           |  |
|  |                                                                       |  |
|  |  Gate Summary:                                                        |  |
|  |  +------------------------------------------------------------------+ |  |
|  |  | Gate | Completed    | Approver     | Duration | Target | Delta  | |  |
|  |  +------+--------------+--------------+----------+--------+--------+ |  |
|  |  | G0   | 2026-01-15   | John Smith   | 5 days   | 10 days| -5 days| |  |
|  |  | G1   | 2026-02-01   | Jane Doe     | 17 days  | 14 days| +3 days| |  |
|  |  | G2   | 2026-02-20   | Mike Brown   | 19 days  | 14 days| +5 days| |  |
|  |  | G3   | 2026-03-15   | Sarah Wilson | 23 days  | 21 days| +2 days| |  |
|  |  | G4   | 2026-04-20   | John Smith   | 36 days  | 31 days| +5 days| |  |
|  |  +------------------------------------------------------------------+ |  |
|  |                                                                       |  |
|  |  Handoff Status: Completed                                            |  |
|  |  Product Created: PRD-BURGER-VEG-001 (Veggie Burger 200g)            |  |
|  |  BOM Created: BOM-2026-0042 (v1.0)                                    |  |
|  |  Pilot WO: WO-2026-0156 (Complete)                                    |  |
|  |                                                                       |  |
|  |  [View Product] [View BOM] [View Pilot WO] [Export Report]           |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### Loading State

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|   [---]------[---]------[---]------[---]------[---]------[-------]          |
|                                                                              |
|                           [Spinner]                                          |
|                                                                              |
|                     Loading stage-gate progress...                           |
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |  [Skeleton: Progress bar]                                              |  |
|  |                                                                       |  |
|  |  [Skeleton: Checklist items]                                          |  |
|  |  [Skeleton: Checklist items]                                          |  |
|  |  [Skeleton: Checklist items]                                          |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### Empty State (No Project Data)

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|   [G0]-------[G1]-------[G2]-------[G3]-------[G4]------[Launched]          |
|    O          O          O          O          O           O                |
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |                                                                       |  |
|  |                         [timeline icon]                               |  |
|  |                                                                       |  |
|  |                   No stage-gate data available                        |  |
|  |                                                                       |  |
|  |    This project hasn't been configured with stage-gate workflow.     |  |
|  |    Initialize the workflow to track progress through gates.          |  |
|  |                                                                       |  |
|  |                    [Initialize Stage-Gate]                            |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### Error State

```
+-----------------------------------------------------------------------------+
|  Stage-Gate Progress                                          [View History] |
+-----------------------------------------------------------------------------+
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |  [X] Failed to Load Stage-Gate Progress                               |  |
|  |                                                                       |  |
|  |  Error: Unable to retrieve gate checklist data.                       |  |
|  |  This may be due to a network issue or permission restriction.        |  |
|  |                                                                       |  |
|  |  [<- Back to Dashboard]                                [Retry]        |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### Gate Detail Modal (Click on Completed Gate)

```
+-------------------------------------------------------------------+
|  Gate G1: Feasibility                                          [X]|
+-------------------------------------------------------------------+
|                                                                    |
|  Status: [check] COMPLETED                                         |
|                                                                    |
|  +----------------------------------------------------------------+|
|  | Approval Details                                               ||
|  |----------------------------------------------------------------||
|  | Approved By: Jane Doe (R&D Lead)                               ||
|  | Approved At: 2026-02-01 14:32:05                               ||
|  | Duration: 17 days (Target: 14 days, +3 days)                   ||
|  +----------------------------------------------------------------+|
|                                                                    |
|  +----------------------------------------------------------------+|
|  | Checklist Items (4/4 Complete)                                 ||
|  |----------------------------------------------------------------||
|  | [x] Technical feasibility confirmed                            ||
|  |     Completed: 2026-01-20 by John Smith                        ||
|  |     Notes: Lab tests confirmed recipe stability                ||
|  |                                                                ||
|  | [x] Key ingredients identified                                 ||
|  |     Completed: 2026-01-22 by Jane Doe                          ||
|  |     Attachment: ingredient-sourcing-plan.pdf                   ||
|  |                                                                ||
|  | [x] Initial allergen assessment                                ||
|  |     Completed: 2026-01-25 by Mike Brown                        ||
|  |     Notes: Contains soy, gluten. No cross-contamination risk.  ||
|  |                                                                ||
|  | [x] Rough cost estimate                                        ||
|  |     Completed: 2026-02-01 by Jane Doe                          ||
|  |     Notes: Estimated 4.50 PLN/unit (target: 5.00 PLN)          ||
|  +----------------------------------------------------------------+|
|                                                                    |
|  +----------------------------------------------------------------+|
|  | Gate Approval History                                          ||
|  |----------------------------------------------------------------||
|  | 2026-02-01 14:32 - Gate approved by Jane Doe                   ||
|  | 2026-02-01 14:30 - All checklist items completed               ||
|  | 2026-01-28 09:15 - Item "Rough cost estimate" uncompleted      ||
|  |                    (revision required)                         ||
|  | 2026-01-25 16:00 - Item "Initial allergen assessment" completed||
|  +----------------------------------------------------------------+|
|                                                                    |
+-------------------------------------------------------------------+
|                                                                    |
|  [Export Gate Report]                                    [Close]   |
|                                                                    |
+-------------------------------------------------------------------+
```

### Mobile/Responsive View (< 768px)

```
+---------------------------------------+
|  Stage-Gate Progress       [History]  |
+---------------------------------------+
|                                       |
|  +-----------------------------------+|
|  |  [G0] [G1] [G2] [G3] [G4] [L]    ||
|  |   *    *   ||    O    O    O     ||
|  +-----------------------------------+|
|                                       |
|  +-----------------------------------+|
|  |  G2: Business Case     [CURRENT]  ||
|  |                                   ||
|  |  Progress: 75%                    ||
|  |  [====================------]     ||
|  |                                   ||
|  |  [x] Business case documented     ||
|  |  [x] Target cost approved         ||
|  |  [x] Target margin confirmed      ||
|  |  [ ] Resource plan approved       ||
|  |                                   ||
|  |  Target: Feb 20 | 5 days left     ||
|  |                                   ||
|  |  [Advance to G3] (disabled)       ||
|  +-----------------------------------+|
|                                       |
|  Completed: G0, G1                    |
|  [View Completed Gates v]             |
|                                       |
+---------------------------------------+
```

---

## Key Components

### 1. Timeline Stepper (Horizontal)

#### Gate Node Visual States
| State | Icon | Color | Description |
|-------|------|-------|-------------|
| Completed | Check icon | Green (#22C55E) | Gate approved and closed |
| Current/Active | Double bar (||) | Blue (#3B82F6) | Currently active gate |
| Future | Empty circle (O) | Gray (#9CA3AF) | Not yet reached |
| Blocked | Warning icon | Red (#EF4444) | Current gate has blocking issues |
| Overdue | Clock icon | Orange (#F97316) | Past target date |

#### Connector Line States
| State | Style | Color |
|-------|-------|-------|
| Completed | Solid line | Green (#22C55E) |
| In Progress | Dashed line | Blue (#3B82F6) |
| Future | Dotted line | Gray (#D1D5DB) |

### 2. Current Gate Panel

#### Panel Elements
- **Gate Title**: "G{N}: {Gate Name}" with status badge
- **Progress Bar**: Visual percentage of checklist completion
- **Progress Text**: "X/Y items (Z%)"
- **Checklist Items**: Checkbox list with completion status
- **Timeline Info**: Started date, target date, days remaining/overdue
- **Action Button**: "Complete & Advance to G{N+1}"

#### Checklist Item Display
```
[x] Item description (completed)
    Completed: 2026-01-20 by John Smith
    Notes: Additional context...
    [Attachment: filename.pdf]

[ ] Item description (incomplete)
    <-- BLOCKING (if required and incomplete)
```

### 3. Blocking Indicator

#### Alert Box (When Blocking Issues Exist)
```
+---------------------------------------------------------------+
| [!!] BLOCKING ISSUES (N)                                      |
|                                                               |
| - Issue 1: Description. Action to resolve.                    |
| - Issue 2: Description. Action to resolve.                    |
|                                                               |
| These items MUST be completed before advancing to {next_gate}.|
+---------------------------------------------------------------+
```

#### Blocking Conditions
- Required checklist item not completed
- Costing approval required but not received (G4)
- Compliance documents missing (G4)
- Formulation not locked (G3-G4)

### 4. Completed Gate Cards

#### Collapsed View
```
+----------------------------------+
| G{N}: {Name}          [check]    |
| Approved: {date}                 |
| By: {approver_name}              |
| [View Details]                   |
+----------------------------------+
```

#### Click Action
- Opens Gate Detail Modal
- Shows full checklist history
- Shows approval audit trail

### 5. Launched State Panel

#### Success Completion Display
- Launch date with celebration icon
- Total project duration vs target
- Gate-by-gate summary table
- Handoff artifacts links (Product, BOM, Pilot WO)
- Export report action

---

## Main Actions

### Advance Gate
- **Button**: "[Complete & Advance to G{N+1}]"
- **Enabled When**: All required checklist items completed
- **Disabled When**: Any blocking issue exists
- **Action**: POST `/api/npd/projects/{id}/advance-gate`
- **On Success**: Refresh timeline, show toast, update current gate
- **On Error**: Show error message, keep current state

### View Gate Details
- **Trigger**: Click on completed gate node or "View Details" link
- **Action**: Open Gate Detail Modal
- **Content**: Full checklist, approval history, attachments

### View History
- **Button**: "[View History]" (top-right)
- **Action**: Open full project history modal
- **Content**: All gate transitions, checklist changes, approvals

### Complete Checklist Item
- **Trigger**: Click checkbox in current gate panel
- **Action**: PUT `/api/npd/checklists/{id}`
- **Payload**: { is_completed: true/false, notes: string }
- **On Success**: Refresh progress bar, check if blocking resolved

### Initialize Stage-Gate (Empty State)
- **Button**: "[Initialize Stage-Gate]"
- **Action**: POST `/api/npd/projects/{id}/initialize-gates`
- **Result**: Creates default checklist items for all gates

---

## State Transitions

```
Page Loads
  |
  v
LOADING (Show skeleton timeline + spinner)
  | Fetch project + gate checklists
  v
SUCCESS (Render timeline based on current_gate)
  OR
EMPTY (No gate data - show initialize option)
  OR
ERROR (Show error banner, offer retry)

----------------------------------------------

From SUCCESS:

User Clicks Checkbox (Checklist Item)
  |
  v
SAVING (Checkbox disabled, spinner)
  | PUT /api/npd/checklists/{id}
  v
UPDATED (Refresh progress, check blocking status)
  OR
ERROR (Revert checkbox, show error toast)

----------------------------------------------

User Clicks [Complete & Advance]
  |
  v
CONFIRMING (Show confirmation dialog)
  | "Advance to G{N+1}? This action cannot be undone."
  v
[Confirm]
  |
  v
ADVANCING (Button shows spinner, disable all inputs)
  | POST /api/npd/projects/{id}/advance-gate
  v
SUCCESS (Animate transition, update timeline, toast)
  | Current gate becomes "Completed"
  | Next gate becomes "Current"
  OR
ERROR (Show error message, keep current state)

----------------------------------------------

User Clicks Completed Gate
  |
  v
MODAL OPENING (Load gate details)
  |
  v
MODAL OPEN (Show Gate Detail Modal)
  | [Close] or [X] to dismiss
  v
MODAL CLOSED

----------------------------------------------

Project Reaches G4 Complete
  |
  v
[Complete & Launch]
  |
  v
HANDOFF VALIDATION (Check all launch criteria)
  | All G4 items complete?
  | Costing approved?
  | Compliance docs complete?
  | Formulation locked?
  v
VALIDATION PASSED -> Proceed to Handoff Wizard (NPD-004)
  OR
VALIDATION FAILED -> Show blocking issues, cannot proceed
```

---

## Validation

### Advance Gate Validation
```typescript
{
  // All required checklist items must be complete
  checklistComplete: {
    validate: (items) => {
      const required = items.filter(i => i.is_required)
      const incomplete = required.filter(i => !i.is_completed)
      if (incomplete.length > 0) {
        return `${incomplete.length} required item(s) incomplete`
      }
      return true
    }
  },

  // Gate-specific validations
  gateSpecific: {
    G2: {
      // Must have target cost set
      targetCostSet: (project) => {
        if (!project.costing?.target_cost) {
          return "Target cost must be set before advancing from G2"
        }
        return true
      }
    },
    G3: {
      // Must have approved formulation
      formulationLocked: (project) => {
        const formulations = project.formulations || []
        const locked = formulations.find(f => f.status === 'locked')
        if (!locked) {
          return "At least one formulation must be locked before advancing from G3"
        }
        return true
      }
    },
    G4: {
      // Must have costing approval
      costingApproved: (project) => {
        if (project.require_costing_approval &&
            project.costing?.status !== 'approved') {
          return "Costing must be approved by Finance before launch"
        }
        return true
      },
      // Must have compliance docs
      complianceDocs: (project) => {
        if (project.require_compliance_docs) {
          const docs = project.documents || []
          const hasHACCP = docs.some(d => d.file_type === 'compliance' && d.file_name.toLowerCase().includes('haccp'))
          const hasLabel = docs.some(d => d.file_type === 'label')
          if (!hasHACCP) return "HACCP plan document required"
          if (!hasLabel) return "Label proof document required"
        }
        return true
      }
    }
  }
}
```

### Error Messages
```typescript
{
  "CHECKLIST_INCOMPLETE": "Cannot advance: {N} required item(s) not completed.",
  "TARGET_COST_REQUIRED": "Target cost must be set before advancing to Development.",
  "FORMULATION_NOT_LOCKED": "At least one formulation must be approved and locked.",
  "COSTING_NOT_APPROVED": "Costing must be approved by Finance before launch.",
  "COMPLIANCE_DOCS_MISSING": "Required compliance documents are missing: {list}.",
  "GATE_ALREADY_COMPLETED": "This gate has already been completed.",
  "INVALID_GATE_TRANSITION": "Cannot skip gates. Current gate must be completed first.",
  "PERMISSION_DENIED": "You do not have permission to advance this gate.",
  "PROJECT_CANCELLED": "Cannot advance gates on a cancelled project."
}
```

---

## Data Required

### API Endpoints

#### Get Project with Gates
```
GET /api/npd/projects/{id}?include=gates,checklists
```

**Response:**
```typescript
{
  project: {
    id: number
    project_number: string
    project_name: string
    current_gate: "G0" | "G1" | "G2" | "G3" | "G4" | "Launched"
    status: string
    target_launch_date: string | null
    actual_launch_date: string | null
    created_at: string
  },
  gates: [
    {
      gate: "G0" | "G1" | "G2" | "G3" | "G4"
      status: "pending" | "in_progress" | "completed"
      started_at: string | null
      completed_at: string | null
      approved_by: string | null  // user name
      approved_by_id: string | null
      target_date: string | null
      checklist_total: number
      checklist_completed: number
      is_blocked: boolean
      blocking_items: string[]
    }
  ],
  checklists: [
    {
      id: number
      gate: string
      item_description: string
      is_required: boolean
      is_completed: boolean
      completed_by: string | null
      completed_by_id: string | null
      completed_at: string | null
      notes: string | null
      attachment_url: string | null
    }
  ]
}
```

#### Advance Gate
```
POST /api/npd/projects/{id}/advance-gate
```

**Request Body:**
```typescript
{
  current_gate: string  // For validation
  notes?: string        // Optional approval notes
}
```

**Response:**
```typescript
{
  success: true
  project: {
    id: number
    current_gate: string  // New gate
    previous_gate: string
    advanced_at: string
    advanced_by: string
  }
}
```

#### Update Checklist Item
```
PUT /api/npd/checklists/{id}
```

**Request Body:**
```typescript
{
  is_completed: boolean
  notes?: string
  attachment_url?: string
}
```

**Response:**
```typescript
{
  checklist: {
    id: number
    gate: string
    item_description: string
    is_required: boolean
    is_completed: boolean
    completed_by: string | null
    completed_at: string | null
    notes: string | null
    attachment_url: string | null
  },
  gate_progress: {
    total: number
    completed: number
    percent: number
    is_blocked: boolean
  }
}
```

#### Get Gate History
```
GET /api/npd/projects/{id}/gate-history?gate={gate}
```

**Response:**
```typescript
{
  gate: string
  history: [
    {
      event_type: "item_completed" | "item_uncompleted" | "gate_approved" | "gate_started"
      event_at: string
      user_name: string
      details: string
    }
  ]
}
```

---

## Technical Notes

### Progress Calculation
```typescript
const calculateGateProgress = (checklists: Checklist[], gate: string) => {
  const gateItems = checklists.filter(c => c.gate === gate)
  const total = gateItems.length
  const completed = gateItems.filter(c => c.is_completed).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    percent,
    remaining: total - completed
  }
}
```

### Blocking Detection
```typescript
const detectBlockingIssues = (
  project: Project,
  checklists: Checklist[],
  currentGate: string
): BlockingIssue[] => {
  const issues: BlockingIssue[] = []

  // Required checklist items
  const gateItems = checklists.filter(c => c.gate === currentGate)
  const incompleteRequired = gateItems.filter(c => c.is_required && !c.is_completed)

  incompleteRequired.forEach(item => {
    issues.push({
      type: 'checklist',
      item: item.item_description,
      action: 'Complete this required item to proceed.'
    })
  })

  // Gate-specific blocking conditions
  if (currentGate === 'G4') {
    if (project.require_costing_approval && project.costing?.status !== 'approved') {
      issues.push({
        type: 'costing',
        item: 'Costing approval required',
        action: 'Submit costing for Finance approval.'
      })
    }

    if (project.require_compliance_docs) {
      // Check for required docs
      const docs = project.documents || []
      if (!docs.some(d => d.file_type === 'compliance')) {
        issues.push({
          type: 'document',
          item: 'HACCP plan missing',
          action: 'Upload HACCP plan in Documents section.'
        })
      }
      if (!docs.some(d => d.file_type === 'label')) {
        issues.push({
          type: 'document',
          item: 'Label proof missing',
          action: 'Upload label proof in Documents section.'
        })
      }
    }
  }

  return issues
}
```

### Gate Node Component
```typescript
interface GateNodeProps {
  gate: string
  status: 'completed' | 'current' | 'future' | 'blocked'
  date?: string
  approver?: string
  onClick?: () => void
  isOverdue?: boolean
}

// Icon mapping
const gateIcons = {
  completed: <CheckCircle className="text-green-500" />,
  current: <CircleDot className="text-blue-500" />,
  future: <Circle className="text-gray-400" />,
  blocked: <AlertTriangle className="text-red-500" />
}
```

### Days Calculation
```typescript
const calculateDaysStatus = (
  startDate: string | null,
  targetDate: string | null
): { text: string; status: 'ok' | 'warning' | 'overdue' } => {
  if (!startDate || !targetDate) {
    return { text: 'No target date', status: 'ok' }
  }

  const today = new Date()
  const target = new Date(targetDate)
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      text: `OVERDUE by ${Math.abs(diffDays)} days`,
      status: 'overdue'
    }
  } else if (diffDays <= 3) {
    return {
      text: `${diffDays} days remaining`,
      status: 'warning'
    }
  } else {
    return {
      text: `${diffDays} days remaining`,
      status: 'ok'
    }
  }
}
```

### Accessibility (WCAG 2.1 AA)

- **Timeline Navigation**: Arrow keys to navigate between gates
- **Gate Nodes**: role="listitem" within role="list"
- **Current Gate**: aria-current="step"
- **Progress Bar**: role="progressbar" aria-valuenow aria-valuemin aria-valuemax
- **Checkboxes**: Proper labels, focus indicators
- **Status Announcements**: aria-live="polite" for progress updates
- **Color Contrast**: >= 4.5:1 for all text
- **Touch Targets**: Gate nodes >= 48x48dp
- **Screen Reader**:
  - "Gate G0 Idea, completed on January 15, 2026, approved by John Smith"
  - "Gate G2 Business Case, current gate, 75% complete, 3 of 4 items done"
  - "Warning: 2 blocking issues prevent advancement"

---

## Related Screens

- **Parent**: NPD-001 Project Dashboard (Kanban view)
- **Container**: NPD-002 Project Detail Page
- **Next**: NPD-004 Handoff Wizard (from G4 complete)
- **Related**: NPD-005 Gate Checklist Management
- **Related**: NPD-006 Costing Panel (G2-G4 dependency)
- **Related**: NPD-007 Document Upload (G4 dependency)

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `apps/frontend/components/npd/StageGateTimeline.tsx`
2. **Existing Code**: New component, no existing implementation
3. **Key Features**:
   - Horizontal stepper with 6 nodes
   - Animated transitions between gates
   - Collapsible completed gates section
   - Real-time progress updates
   - Blocking indicator alerts
   - Click-to-expand gate details modal

4. **Libraries**:
   - ShadCN `Progress` for progress bars
   - ShadCN `Badge` for status indicators
   - ShadCN `Dialog` for gate detail modal
   - ShadCN `Checkbox` for checklist items
   - ShadCN `Alert` for blocking warnings
   - ShadCN `Collapsible` for completed gates section
   - `framer-motion` for gate transition animations (optional)

5. **State Management**:
   - Component receives project data as prop
   - Local state for expanded/collapsed sections
   - Local state for modal open/close
   - Optimistic updates for checkbox changes
   - Loading state for gate advancement

6. **Responsive Breakpoints**:
   - Desktop (>= 1024px): Full horizontal timeline
   - Tablet (768-1023px): Compact timeline with scrollable nodes
   - Mobile (< 768px): Vertical compact view with abbreviations

7. **Animation Suggestions**:
   - Gate completion: Pulse effect, check icon fade-in
   - Progress bar: Smooth width transition
   - Blocking indicator: Subtle shake on appearance
   - Gate advance: Slide transition to next gate

---

## Field Verification (PRD Cross-Check)

**Gate Fields (from PRD Section 2.3 - Stage-Gate Workflow):**
- Gate names: G0 (Idea), G1 (Feasibility), G2 (Business Case), G3 (Development), G4 (Testing), Launched
- Gate entry criteria enforced per PRD Section 2.4
- Default checklists per PRD Section 4.3

**Checklist Fields (from PRD Section 4.2 - npd_gate_checklists):**
- gate (enum: G0-G4)
- item_description (text, displayed)
- is_required (boolean, blocking logic)
- is_completed (boolean, checkbox state)
- completed_by (FK, displayed)
- completed_at (datetime, displayed)
- notes (text, optional display)
- attachment_url (string, download link)

**Business Rules:**
- Cannot skip gates (sequential advancement only)
- All required items must complete before advance
- G2 requires target_cost set
- G3 requires formulation locked
- G4 requires costing approval (if enabled)
- G4 requires compliance docs (if enabled)

**ALL PRD FIELDS VERIFIED**

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve
**Iterations**: 0 of 3
**PRD Compliance**: 100% (all fields verified)
**PRD Coverage**: NPD-FR-02, NPD-FR-03, NPD-FR-17, NPD-FR-18, NPD-FR-19, NPD-FR-20, NPD-FR-21, NPD-FR-22
**Estimated Effort**: 6-8 hours implementation
**Quality Score**: 98/100 (target)
