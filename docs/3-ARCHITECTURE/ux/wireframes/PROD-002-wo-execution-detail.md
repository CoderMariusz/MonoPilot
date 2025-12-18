# PROD-002: Work Order Execution Detail

**Route**: `/production/execution/:woId`

**Scope**: WO Execution (Start, Pause/Resume, Operations, Complete)

**Features**: FR-PROD-002, FR-PROD-003, FR-PROD-004, FR-PROD-005

**Total AC**: 35 (9+8+9+9)

---

## 1. Layout Overview

### Desktop - Success State (In Progress)

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back | WO-2025-0156: Wheat Bread | Draft       │ [Timestamp] │
├─────────────────────────────────────────────────────────────────┤
│ Header Bar:                                                     │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ WO #: 2025-0156  │ Product: Wheat Bread 500g             │  │
│ │ Qty: 3200 kg / 5000 kg (64%)  │ Status: In Progress      │  │
│ │ Start: 2025-12-14 09:30  │ Duration: 2h 15m             │  │
│ └───────────────────────────────────────────────────────────┘  │
│ Action Bar: [Start] [Pause] [Resume] [Complete WO]            │
├─────────────────────────────────────────────────────────────────┤
│ TABS: Overview | Materials | Outputs | By-Products | Genealogy │
├─────────────────────────────────────────────────────────────────┤
│ OPERATIONS TIMELINE (Tab: Overview)                             │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ✓ Op1 Mixing (Completed, 95% yield, 45min, Sarah L.)    │   │
│ │ ► Op2 Baking (In Progress, started 2h ago, John S.)     │   │
│ │ ○ Op3 Cooling (Not Started)                             │   │
│ │ ○ Op4 Packaging (Not Started)                           │   │
│ └──────────────────────────────────────────────────────────┘   │
│ *Shows sequence status (if required_operation_sequence = true) │
│ *Actions per operation: [Start] [Complete] (disabled if done)  │
└─────────────────────────────────────────────────────────────────┘
```

**Breakpoints**:
- **Desktop** (>1024px): Full layout, tabs, operations timeline
- **Tablet** (768-1024px): Condensed tabs, collapsible operations
- **Mobile** (<768px): Stacked cards, accordion operations

---

## 2. All 4 States

### State 1: Loading

**Trigger**: Page mount, WO ID loading

```
├─────────────────────────────────────────────────────────────────┤
│ Header: [Skeleton] WO-XXXX                                      │
│ Action Bar: [skeleton button] [skeleton button]...              │
├─────────────────────────────────────────────────────────────────┤
│ TABS: [skeleton] [skeleton] [skeleton]                          │
│ Content:                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Skeleton row] [Skeleton row] [Skeleton row]              │ │
│ │ [Skeleton row] [Skeleton row] [Skeleton row]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
```

**Component**: Skeleton cards for header, tabs, operations list (standard MUI Skeleton)

---

### State 2: Empty (No Operations)

**Trigger**: WO loaded but no operations defined in routing

```
├─────────────────────────────────────────────────────────────────┤
│ Header: WO-2025-0156: Wheat Bread (normal)                      │
├─────────────────────────────────────────────────────────────────┤
│ TABS: Overview | Materials | Outputs | By-Products | Genealogy  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │                    📋 No Operations Found                  │  │
│ │                                                             │  │
│ │  This work order routing has no operations defined.        │  │
│ │  Create operations in the Routing before starting WO.      │  │
│ │                   [Go to Routing] [Close]                 │  │
│ └────────────────────────────────────────────────────────────┘  │
```

**Component**: Illustration + message + action button

---

### State 3: Error (Fetch Failed)

**Trigger**: WO not found, network error, permission denied

```
├─────────────────────────────────────────────────────────────────┤
│ Header: ← Back                                                   │
├─────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐  │
│ │                ⚠️ Error Loading WO                         │  │
│ │                                                             │  │
│ │  Failed to load WO-2025-0156. WO not found or access      │  │
│ │  denied. Try refreshing or contact support.                │  │
│ │                                                             │  │
│ │          [Refresh] [Go to Planning] [Contact Support]    │  │
│ └────────────────────────────────────────────────────────────┘  │
```

**Component**: Error icon + message + recovery actions

---

### State 4: Success (Normal Operation)

See Section 1 layout above.

---

## 3. Primary Actions

### Action Bar (Top of Page)

**Visible buttons**:

| Button | Condition | AC# |
|--------|-----------|-----|
| [Start] | Status = Released | 1,2 |
| [Pause] | Status = In Progress AND allow_pause_wo=true | 3 |
| [Resume] | Status = Paused | 5,8 |
| [Complete WO] | Status = In Progress (with validation) | 1,2,6,7,8,9 |

**Disabled states**:

| Button | Disabled When | AC# |
|--------|---------------|-----|
| [Start] | Status ≠ Released | 4 |
| [Pause] | allow_pause_wo=false OR Status=Completed | 2,7 |
| [Complete WO] | Status=Completed | 9,5 |

---

## 4. Modals (Details)

### 4.1 Start WO Modal

**Trigger**: Click [Start] button (Status=Released)

**Fields**:

```
┌─────────────────────────────────────────────────────────┐
│ Start Work Order                                    [✕] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Production Line *        [Dropdown ▼]                   │
│ ├─ Line A1              ← (checked if available)        │
│ ├─ Line A2              (grey if already in use)        │
│ └─ Line B1                                              │
│                                                          │
│ Machine (Optional)       [Dropdown ▼]                   │
│                                                          │
│ Material Availability:                                   │
│ ├─ Material 1: 85% [==========>] (yellow warning)       │
│ ├─ Material 2: 100% [==========] (green)                │
│ └─ Material 3: 100% [==========]                        │
│ ⚠️ Some materials <100% - Proceed? (if mat <100%)       │
│                                                          │
│                  [Cancel] [Start Production]            │
└─────────────────────────────────────────────────────────┘
```

**Validation & AC**:

| AC# | Condition | Behavior |
|-----|-----------|----------|
| 1 | Status = Released | Enable Start button |
| 2 | Click Start | Set started_at = now, Status→In Progress (1sec) |
| 3 | Status = Draft | Show error "WO must be Released to start" |
| 4 | Status = In Progress | Disable Start button |
| 5 | Mat Availability 80% | Show yellow warning, allow proceed |
| 6 | Mat Availability 100% | No warning shown |
| 7 | Line busy | Show error "Line already in use by WO-XXX" |
| 8 | enable_material_reservations=true | Create reservations on start |
| 9 | enable_material_reservations=false | Skip reservations |

**API**: `POST /api/production/work-orders/:id/start`

---

### 4.2 Pause WO Modal

**Trigger**: Click [Pause] button (Status=In Progress, allow_pause_wo=true)

**Fields**:

```
┌─────────────────────────────────────────────────────────┐
│ Pause Work Order                                    [✕] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Pause Reason *           [Dropdown ▼]                   │
│ ├─ Machine Breakdown                                    │
│ ├─ Material Shortage                                    │
│ ├─ Break/Lunch                                          │
│ ├─ Quality Issue                                        │
│ └─ Other (specify)                                      │
│                                                          │
│ Notes (Optional)         [Textarea ───────────]         │
│                                                          │
│                  [Cancel] [Pause]                       │
└─────────────────────────────────────────────────────────┘
```

**Validation & AC**:

| AC# | Condition | Behavior |
|-----|-----------|----------|
| 1 | allow_pause_wo=true | Show Pause button |
| 2 | allow_pause_wo=false | Hide Pause button |
| 3 | Click Pause with reason | Status→Paused, paused_at=now |
| 4 | No reason selected | Error "Pause reason is required" |
| 5 | Reason: "Machine Breakdown" | Accept and set reason |
| 6 | Status=Completed | Disable Pause button |

**API**: `POST /api/production/work-orders/:id/pause`

---

### 4.3 Resume WO Modal

**Trigger**: Click [Resume] button (Status=Paused)

**Display**:

```
┌─────────────────────────────────────────────────────────┐
│ Resume Work Order                                   [✕] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Paused Since: 2025-12-14 11:30 AM (Pause Duration: 45m)│
│ Pause Reason: Machine Breakdown                        │
│ Notes: Awaiting spare parts                            │
│                                                          │
│ [Confirm Resume]         [Cancel]                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Validation & AC**:

| AC# | Condition | Behavior |
|-----|-----------|----------|
| 1 | Click Resume | Status→In Progress, resumed_at=now |
| 2 | Paused 15min | wo_pauses.duration_minutes = 15±1 |
| 3 | Status=Completed | Disable Resume button |
| 4 | Click Resume | Show confirmation modal |

**API**: `POST /api/production/work-orders/:id/resume`

---

### 4.4 Complete Operation Modal

**Trigger**: Click [Complete] on operation card (Status=In Progress)

**Fields**:

```
┌─────────────────────────────────────────────────────────┐
│ Complete Operation: Op2 Baking                      [✕] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Started: 2025-12-14 09:30 AM                           │
│ Duration: 2h 15m (calculated on save)                  │
│                                                          │
│ Actual Yield %  *        [Input: ▼ 100 ▲]            │
│ Range: 0-100% (step 0.5%)                              │
│                                                          │
│ Notes (Optional)         [Textarea ───────────]        │
│                                                          │
│ Operator: Sarah L. (auto-filled, read-only)            │
│                                                          │
│                  [Cancel] [Complete]                   │
└─────────────────────────────────────────────────────────┘
```

**Validation & AC**:

| AC# | Condition | Behavior |
|-----|-----------|----------|
| 1 | Click Complete | Status→Completed, actual_duration_minutes calculated (±1min) |
| 2 | Yield=95% | Set actual_yield_percent=95 |
| 3 | Sequence enforced, Op1 not done | Error "Previous operation must be completed first" |
| 4 | Sequence not enforced | Allow any operation to complete independently |
| 5 | Auto-set operator_id | Set to current user |
| 6 | Yield=150% | Validation error "Yield cannot exceed 100%" |
| 7 | Yield=-5% | Validation error "Yield must be positive" |
| 8 | Status=Completed | Disable Start/Complete buttons |

**API**: `POST /api/production/work-orders/:id/operations/:opId/complete`

---

### 4.5 Complete WO Modal

**Trigger**: Click [Complete WO] button (Status=In Progress)

**Validation Summary**:

```
┌─────────────────────────────────────────────────────────┐
│ Complete Work Order                                [✕] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Validation Checklist:                                   │
│ ✓ Outputs registered: 3200 kg / 5000 kg (64%)          │
│ ✓ Operations completed: 4/4                            │
│   (if require_operation_sequence=true)                  │
│ ⚠️ By-Products: 2 defined, 1 registered (INCOMPLETE)   │
│   (if by-products defined in BOM)                       │
│                                                          │
│ Auto-Complete: Enabled (will complete when qty >= plan)│
│ Current Progress: 64% of 5000 kg target                │
│                                                          │
│ [Proceed with By-Products Missing] [Cancel]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Validation & AC**:

| AC# | Condition | Behavior |
|-----|-----------|----------|
| 1 | Outputs ≥ 1 AND Ops done | Status→Completed, completed_at=now (1sec) |
| 2 | Outputs = 0 | Error "At least one output must be registered" |
| 3 | Sequence enforced, Op2 not done | Error "All operations must be completed" |
| 4 | By-products defined, not registered | Warning "By-product not registered. Continue?" |
| 5 | auto_complete_wo=true, qty ≥ plan | Auto-complete (no user action) |
| 6 | auto_complete_wo=false, qty ≥ plan | Remain In Progress (user can click Complete) |
| 7 | WO completes | Release unused material reservations |
| 8 | WO completes | Set completed_at=now |
| 9 | Status=Completed | Disable Complete WO button |

**API**: `POST /api/production/work-orders/:id/complete`

---

## 5. Operations Timeline (Tab: Overview)

**Display Format**:

```
┌────────────────────────────────────────────────────────────┐
│ OPERATIONS (Sequence Required: YES)                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ✓ Op1 Mixing                          [Details ▼]   │  │
│ │   Line: A1 | Duration: 45m | Yield: 95%            │  │
│ │   Operator: Sarah L. | Completed: 2025-12-14 10:15 │  │
│ │   [Start] [Complete] ← (greyed out - already done)  │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ► Op2 Baking                          [Details ▼]   │  │
│ │   Line: A1 | Duration: 2h 15m (running)            │  │
│ │   Operator: John S. | Started: 2025-12-14 10:15    │  │
│ │   [Start] [Complete] ← (Complete enabled)           │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ○ Op3 Cooling                         [Details ▼]   │  │
│ │   (Not Started)                                      │  │
│ │   [Start] ← (greyed, awaiting Op2 completion)        │  │
│ │   Reason: Sequence required (Op2 not completed)      │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ○ Op4 Packaging                       [Details ▼]   │  │
│ │   (Not Started)                                      │  │
│ │   [Start] [Complete] ← (both greyed)                │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Button States**:

| Operation Status | [Start] | [Complete] | Notes |
|------------------|---------|-----------|-------|
| Not Started (seq OK) | Enabled | Disabled | Can start |
| Not Started (seq blocked) | Disabled | Disabled | Tooltip: "Previous op incomplete" |
| In Progress | Disabled | Enabled | Can complete |
| Completed | Disabled | Disabled | Greyed out |

---

## 6. Tab: Materials

**Display**:

```
┌────────────────────────────────────────────────────────────┐
│ MATERIALS (Required vs Consumed)                           │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Material 1: Wheat Flour (RM-001)                    │  │
│ │ Required: 2000 kg | Consumed: 1800 kg [==========>] │  │
│ │ Progress: 90% | [Consume] [View Lots]              │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Material 2: Water (RM-002)                          │  │
│ │ Required: 800 L | Consumed: 800 L [============] │  │
│ │ Progress: 100% | [Consume] [View Lots]            │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Material 3: Salt (RM-003)                           │  │
│ │ Required: 20 kg | Consumed: 0 kg [ ]               │  │
│ │ Progress: 0% | [Consume] [View Lots]               │  │
│ │ ⚠️ Material Shortage (only 15 kg available)          │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Linked FR**: PROD-006 (Material Consumption) - implemented in separate wireframe

---

## 7. Tab: Outputs

**Display**:

```
┌────────────────────────────────────────────────────────────┐
│ OUTPUTS (Required: 5000 kg, Current: 3200 kg)             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Output 1: Wheat Bread 500g boxes                    │  │
│ │ Qty: 3200 kg | LP: LP-0045 | Status: Active        │  │
│ │ Created: 2025-12-14 11:30 | Created by: John S.    │  │
│ │ [View Details] [Edit] [Remove]                      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ [+ Register Output]                                       │
└────────────────────────────────────────────────────────────┘
```

**Linked FR**: PROD-007 (WO Outputs) - separate wireframe

---

## 8. Tab: By-Products

**Display**:

```
┌────────────────────────────────────────────────────────────┐
│ BY-PRODUCTS (Auto-calculated from BOM)                    │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ By-Product 1: Wheat Bran (BPD-001)                  │  │
│ │ Planned: 200 kg | Registered: 180 kg | 90% Complete │  │
│ │ [Register Additional] [View Lots]                    │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ By-Product 2: Flour Dust (BPD-002)                  │  │
│ │ Planned: 50 kg | Registered: 0 kg | 0% Complete    │  │
│ │ ⚠️ Not registered yet                                │  │
│ │ [Register] [View Lots]                              │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Note**: By-products auto-calculated from BOM, warnings if incomplete

---

## 9. Tab: Genealogy

**Display**:

```
┌────────────────────────────────────────────────────────────┐
│ GENEALOGY (Traceability Links)                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Material Consumption Links                          │  │
│ │ ├─ LP-0020 (RM-001, 1800 kg) → Output LP-0045      │  │
│ │ ├─ LP-0021 (RM-002, 800 L) → Output LP-0045       │  │
│ │ └─ LP-0022 (RM-003, 20 kg) → Output LP-0045       │  │
│ │                                                      │  │
│ │ [View Tree] [View Matrix] [Export]                 │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Linked FR**: FR-PROD-010 (Genealogy Tracking) - separate wireframe

---

## 10. API Endpoints

| Method | Endpoint | Purpose | AC# |
|--------|----------|---------|-----|
| GET | `/api/production/work-orders/:id` | Load WO detail | - |
| POST | `/api/production/work-orders/:id/start` | Start WO | 1,2,3,4,5,6,7,8,9 |
| POST | `/api/production/work-orders/:id/pause` | Pause WO | 1,2,3,4 |
| POST | `/api/production/work-orders/:id/resume` | Resume WO | 1,2,3,4,5,6 |
| POST | `/api/production/work-orders/:id/operations/:opId/start` | Start operation | 1,2,3,4 |
| POST | `/api/production/work-orders/:id/operations/:opId/complete` | Complete operation | 1,2,3,4,5,6,7,8 |
| POST | `/api/production/work-orders/:id/complete` | Complete WO | 1,2,3,4,5,6,7,8,9 |
| GET | `/api/production/work-orders/:id/materials` | List materials | - |
| GET | `/api/production/work-orders/:id/operations` | List operations | - |

---

## 11. Responsive Design

### Tablet (768-1024px)

- Condense header (single line with ellipsis)
- Tab labels→icons (Overview→📊, Materials→📦)
- Operations: collapse/expand accordion
- Action buttons: reduce font size, add to menu if space tight

### Mobile (<768px)

- Full-width cards, stacked vertically
- Tabs: horizontal scroll or dropdown menu
- Header: back button + title (WO #) + status badge
- Operations: full-width accordion cards
- Action buttons: bottom fixed button bar (2 buttons max, overflow to menu)

---

## 12. Validation & Business Rules

### Start WO (FR-PROD-002)

```
Preconditions:
- Status must be "Released"
- Production line must be available
- Material availability checked

Actions:
- Set status → "In Progress"
- Set started_at → now
- Create material reservations (if enabled)

Post-conditions:
- WO can now accept operations
- Materials are reserved (if enabled)
```

### Pause/Resume WO (FR-PROD-003)

```
Pause:
- Status = "In Progress"
- Require pause reason
- Set paused_at = now

Resume:
- Status = "Paused"
- Set resumed_at = now
- Calculate wo_pauses.duration_minutes
```

### Operation Start/Complete (FR-PROD-004)

```
Start Operation:
- Check sequence enforcement (if enabled, previous must be completed)
- Set status → "In Progress"
- Set started_at = now
- Assign operator_id = current user

Complete Operation:
- Accept yield % (0-100%)
- Set status → "Completed"
- Set completed_at = now
- Calculate actual_duration_minutes
```

### Complete WO (FR-PROD-005)

```
Preconditions:
- At least 1 output registered
- All operations completed (if sequence enforced)
- By-products registered (warning if missing)

Auto-Complete:
- If auto_complete_wo = true AND output_qty ≥ planned_qty
- System auto-completes without user action

Manual Complete:
- Click [Complete WO]
- System validates preconditions
- Release unused material reservations
- Set completed_at = now
```

---

## 13. Touch Targets (Mobile)

All buttons 48x48dp minimum:

- Action buttons (Start, Pause, Resume, Complete): 56x56dp
- Tab labels: 44x56dp (min), 64x56dp (preferred)
- Operation cards: full-width swipe area, buttons 48x48dp
- Modals: buttons 48x56dp, inputs 44px min height

---

## 14. Accessibility

- **WCAG 2.1 AA** compliant
- **ARIA labels** on all buttons (e.g., "Start Work Order")
- **Keyboard navigation**: Tab through actions, Enter to confirm, Escape to close modals
- **Color**: Status indicators use icon + color (not color alone)
  - In Progress: 🔵 Blue + text "In Progress"
  - Paused: 🟡 Yellow + text "Paused"
  - Completed: ✅ Green + text "Completed"
- **Focus**: Clear focus outline (2px blue border, 4px on hover)
- **Loading states**: Spinner with "Loading work order..." text

---

## 15. AC Coverage Map

### FR-PROD-002: WO Start (9 AC)

| AC# | Requirement | Wireframe Section | Implementation |
|-----|-------------|------------------|-----------------|
| 1 | Released→In Progress (1sec) | 4.1 Modal | `POST /start` updates status |
| 2 | Set started_at = now | 4.1 Modal | Backend timestamp |
| 3 | Draft→error | 4.1 Modal | Validation before modal |
| 4 | In Progress→disable Start | Section 3 | Button disabled state |
| 5 | Mat 80%→warning | 4.1 Modal | Yellow warning in materials list |
| 6 | Mat 100%→no warning | 4.1 Modal | No warning shown |
| 7 | Line busy→error | 4.1 Modal | Error message in dropdown |
| 8 | Reservations ON→create | 4.1 Modal, API | `POST /start` with reservations flag |
| 9 | Reservations OFF→skip | 4.1 Modal, API | `POST /start` without reservations |

### FR-PROD-003: WO Pause/Resume (8 AC)

| AC# | Requirement | Wireframe Section | Implementation |
|-----|-------------|------------------|-----------------|
| 1 | allow_pause=true→visible | Section 3, 4.2 | Button visible if allow_pause_wo=true |
| 2 | allow_pause=false→hidden | Section 3, 4.2 | Button not rendered |
| 3 | In Progress→Paused | 4.2 Modal | Status changed on pause |
| 4 | No reason→error | 4.2 Modal | Validation error |
| 5 | Paused→Resume→In Progress | 4.3 Modal | Status changed on resume |
| 6 | Duration calculated | 4.3 Modal | Calculated resumed_at - paused_at |
| 7 | Completed→Pause disabled | Section 3 | Button disabled for Completed |
| 8 | Resume→confirmation | 4.3 Modal | Confirmation modal shown |

### FR-PROD-004: Operation Start/Complete (9 AC)

| AC# | Requirement | Wireframe Section | Implementation |
|-----|-------------|------------------|-----------------|
| 1 | Not Started→In Progress | 5 Timeline | Button enabled, operation starts |
| 2 | In Progress→Completed (yield) | 4.4 Modal | Modal accepts yield %, sets status |
| 3 | Duration calculated (±1min) | 4.4 Modal | Calculated on complete |
| 4 | Sequence enforced | 5 Timeline | Block if previous not done |
| 5 | Sequence disabled (parallel) | 5 Timeline | Allow any operation independently |
| 6 | Operator set | 4.4 Modal | Auto-set to current user |
| 7 | Yield > 100%→error | 4.4 Modal | Validation error |
| 8 | Yield < 0→error | 4.4 Modal | Validation error |
| 9 | Completed→buttons disabled | 5 Timeline | Greyed out buttons |

### FR-PROD-005: WO Complete (9 AC)

| AC# | Requirement | Wireframe Section | Implementation |
|-----|-------------|------------------|-----------------|
| 1 | Outputs+ops done→Complete | 4.5 Modal | Validation passed, WO completes |
| 2 | No outputs→error | 4.5 Modal | Validation error shown |
| 3 | Ops missing (seq)→error | 4.5 Modal | Validation error shown |
| 4 | By-products missing→warning | 4.5 Modal | Warning with "Continue?" option |
| 5 | auto_complete=true→auto | 4.5 Modal | Auto-complete when qty ≥ plan |
| 6 | auto_complete=false→manual | 4.5 Modal | User clicks [Complete WO] |
| 7 | Reservations released | 4.5 Modal, API | Released on completion |
| 8 | Set completed_at = now | 4.5 Modal, API | Backend timestamp |
| 9 | Status=Completed→button disabled | Section 3 | Button greyed out |

**Total Coverage**: 35/35 AC ✅

---

## 16. Implementation Notes

**Front-end**:
- Use TailwindCSS for styling (consistent with codebase)
- ShadCN UI components: Dialog, Button, Dropdown, Tooltip
- Zod validation for all form inputs
- React hooks for state management (loading, errors, success)

**Back-end**:
- Multi-tenancy: All queries filtered by org_id via RLS
- Optimistic updates for smooth UX (start/pause/resume)
- Transaction for multi-step operations (e.g., complete WO + release reservations)
- Audit logging for all state changes

**Testing**:
- Unit: Validation logic (yield %, reason, etc.)
- E2E: Full WO lifecycle (Start→Pause→Resume→Complete)
- Edge cases: Sequence enforcement, parallel operations, auto-complete

---

## 17. Quality Gates

- [x] All 35 AC mapped and covered
- [x] All 4 states (Loading, Empty, Error, Success) defined
- [x] 5 modals with full validation
- [x] Touch targets ≥48x48dp (mobile)
- [x] WCAG 2.1 AA accessibility
- [x] 3 responsive breakpoints defined
- [x] 7 API endpoints specified
- [x] Sequencing logic visualized (operations timeline)
- [x] Material reservations flow documented

---

## 18. Deliverable Checklist

- [x] Wireframe layout (all 4 states)
- [x] 5 modal specifications
- [x] Operations timeline with sequence logic
- [x] 5 tabs (Overview, Materials, Outputs, By-Products, Genealogy)
- [x] 7 API endpoints
- [x] 35 AC fully mapped
- [x] Responsive design (3 breakpoints)
- [x] Accessibility checklist
- [x] Touch target specifications
- [x] Validation rules and business logic

---

**Status**: READY FOR FRONTEND IMPLEMENTATION

**Estimated Effort**: 40-50 hours (modals, operations timeline, tabs, state management, testing)

**Dependencies**: PROD-006 (Material Consumption), PROD-007 (WO Outputs), PROD-010 (Genealogy)

**Next Screens**: PROD-003 (WO Planning), PROD-004 (Material Consumption Detail), PROD-006 (Mobile Material Consumption)
