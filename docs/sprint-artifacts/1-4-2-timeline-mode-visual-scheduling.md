# Story 1.4.2: Timeline Mode Visual Scheduling

Status: drafted

## Story

As a **Production Planner / Operations Manager**,
I want **Gantt chart timeline view with drag-drop WO scheduling and visual capacity planning**,
so that **I can reschedule 7 Work Orders in 48 seconds (vs 14 minutes) and see line capacity bottlenecks at a glance**.

## Acceptance Criteria

### AC-1: Gantt Chart Timeline Component
- Create `<TimelineGantt>` component with X-axis = time (8:00-16:00), Y-axis = production lines (rows)
- WO boxes: Colored rectangles on timeline (width = duration, position = start_time, height = line row height)
- Zoom levels: Day view (15min grid), Week view (1h grid), Month view (4h grid)
- Time range selector: Date picker to select visible range (default = today + next 7 days)
- Line rows: One row per production line (Line A, Line B, Line C), expandable for multi-shift (Day/Swing/Night)
- Snap to grid: All drags/resizes snap to 15-minute increments (8:00, 8:15, 8:30, ..., 15:45, 16:00)

### AC-2: WO Box Visualization
- WO box content: WO number, product name (truncated), quantity + UoM, duration (e.g., "WO-0109 | CHICKEN-SAUSAGE | 1000 kg | 2h")
- Color coding by status: blue (planned), yellow (released), green (in_progress), gray (completed)
- Tooltip on hover: Full WO details (product, qty, BOM version, shift, scheduled_start, scheduled_end, operator)
- Click WO box → open WO Details Modal (read-only summary)
- Visual indicators: ⚠️ icon if materials shortage, 🔴 icon if overdue, ⭐ icon if priority #1

### AC-3: Drag-Drop Horizontal (Reschedule Time)
- Drag WO box left/right → change scheduled_start and scheduled_end (preserve duration)
- Visual feedback: Ghost box (50% opacity) at original position, dragged box follows cursor
- Drop zone indicator: Green vertical line at snap position (8:15, 8:30, 8:45)
- Conflict detection: Red outline on drop zone if overlap with existing WO on same line
- Auto-scheduling: On drop → shift downstream WOs if needed (recalculate all start/end times after drop point)
- Transaction: UPDATE work_orders SET scheduled_start, scheduled_end WHERE id = wo_id

### AC-4: Drag-Drop Vertical (Change Line)
- Drag WO box up/down → change production line (Line A → Line B)
- Visual feedback: Ghost box at original line, dragged box follows cursor
- Validation: Check if product can run on target line (allergen restrictions, line capabilities)
- Drop zone indicator: Green background on target line row if valid, red if invalid
- Conflict detection: If drop creates time overlap on new line → show ⚠️ "Conflict with WO-0110 (10:00-12:00)"
- Transaction: UPDATE work_orders SET line_id WHERE id = wo_id

### AC-5: Drag-Drop Diagonal (Reschedule + Reassign)
- Drag WO box diagonally → change both time AND line simultaneously
- Combined validation: Check time overlap + line capability
- Visual feedback: Ghost box at original position, cursor shows both axes movement
- Drop confirmation modal if major change: "Moving WO-0109 from Line A 8:00 to Line B 10:00. Confirm?"

### AC-6: Multi-Select & Batch Operations
- Ctrl+Click to select multiple WO boxes (blue border on selected boxes)
- Drag selected boxes together → all move by same time delta (e.g., +2 hours)
- Shift+Click to select range (all WOs between first and last click)
- Batch line change: Drag 4 selected WOs from Line A to Line B → all reassigned
- Keyboard shortcuts: Ctrl+A (select all), Esc (clear selection), Delete (delete selected WOs with confirmation)

### AC-7: Resize Handles (Adjust Duration)
- Resize handle on right edge of WO box (small square handle on hover)
- Drag right handle → extend duration (scheduled_end moves later, scheduled_start unchanged)
- Drag left handle → change start time (scheduled_start moves earlier, scheduled_end unchanged)
- Snap to grid: Resize snaps to 15-minute increments
- Duration constraints: Minimum 15 minutes, maximum 8 hours (1 shift)
- Visual feedback: Show new end time while dragging (e.g., "12:30 → 13:00")

### AC-8: Capacity Bars & Conflict Visualization
- Capacity bar per line: Horizontal bar below timeline showing % utilization (0-100%+)
- Color coding: Green (<75%), Yellow (75-100%), Red (>100% overbooked)
- Capacity calculation: Sum of all WO durations on line / available shift time × 100
- Conflict visualization: Overlapping WO boxes show red outline + diagonal stripes
- Capacity tooltip on hover: "Line A: 85% capacity (6.8h / 8h), 3 WOs scheduled"

### AC-9: Timeline Controls & Filters
- Zoom buttons: Day / Week / Month (change grid granularity)
- Time range picker: Select date range (default = today + 7 days)
- Filter by status: Show only Planned / Released / In Progress WOs (checkboxes)
- Filter by product: Dropdown to show only WOs for specific product
- Auto-refresh: Real-time updates via WebSocket (30-second polling fallback)
- "Fit to screen" button: Auto-zoom to show all WOs without horizontal scroll

### AC-10: Undo/Redo & Conflict Resolution
- Undo/Redo: Ctrl+Z / Ctrl+Y for all drag-drop operations (maintain stack of last 10 changes)
- Conflict resolution modal: If drop creates overlap → "Conflict detected. Options: [Cancel] [Force (overwrite)] [Auto-adjust (shift downstream)]"
- Auto-adjust algorithm: If "Auto-adjust" selected → shift all downstream WOs by conflict duration
- Optimistic UI: Show change immediately, revert if server rejects (with error toast)

### AC-11: Sync with Spreadsheet Mode
- Mode toggle: Top-right buttons (Spreadsheet ↔ Timeline) with bi-directional sync
- Row order → Timeline priority: Spreadsheet row #1 → Timeline leftmost WO (earliest start time)
- Timeline priority → Row order: Timeline leftmost WO → Spreadsheet row #1
- Sync on switch: When switching modes → recalculate priority, start/end times
- Conflict warning: If sync results in overlaps → show ⚠️ "Auto-schedule recommended"

### AC-12: Documentation
- Update `docs/architecture.md` with Timeline Mode workflow diagram
- Document drag-drop algorithm (horizontal, vertical, diagonal)
- Document capacity calculation formula
- Update `docs/API_REFERENCE.md` with timeline data endpoints
- Create keyboard shortcuts cheat sheet for Timeline Mode

## Tasks / Subtasks

### Task 1: Gantt Chart Timeline Component (AC-1, AC-2) - 14 hours
- [ ] 1.1: Research Gantt libraries (FullCalendar, DHTMLX Gantt, custom with react-beautiful-dnd)
- [ ] 1.2: Create `<TimelineGantt>` base component with X-axis (time) and Y-axis (lines)
- [ ] 1.3: Implement zoom levels (Day = 15min grid, Week = 1h, Month = 4h)
- [ ] 1.4: Add time range selector (date picker for visible range)
- [ ] 1.5: Render line rows (one per production line, expandable for shifts)
- [ ] 1.6: Implement snap-to-grid (15-minute increments)
- [ ] 1.7: Create `<WOBox>` component (colored rectangle with WO info)
- [ ] 1.8: Add WO box color coding by status (blue, yellow, green, gray)
- [ ] 1.9: Implement tooltip on WO box hover (full details)
- [ ] 1.10: Add visual indicators (⚠️ shortage, 🔴 overdue, ⭐ priority #1)

### Task 2: Drag-Drop Horizontal (AC-3) - 8 hours
- [ ] 2.1: Implement horizontal drag (left/right to reschedule time)
- [ ] 2.2: Visual feedback: ghost box at original position, dragged box follows cursor
- [ ] 2.3: Drop zone indicator: green vertical line at snap position
- [ ] 2.4: Conflict detection: red outline if overlap with existing WO
- [ ] 2.5: Auto-scheduling algorithm: shift downstream WOs on drop
- [ ] 2.6: Database transaction: UPDATE work_orders SET scheduled_start, scheduled_end
- [ ] 2.7: Add E2E test: drag WO-0109 from 8:00 to 10:00 → verify time updated

### Task 3: Drag-Drop Vertical & Diagonal (AC-4, AC-5) - 10 hours
- [ ] 3.1: Implement vertical drag (up/down to change line)
- [ ] 3.2: Line capability validation (check allergen restrictions, line type)
- [ ] 3.3: Drop zone indicator: green/red background on target line row
- [ ] 3.4: Conflict detection on new line (time overlap check)
- [ ] 3.5: Implement diagonal drag (simultaneous time + line change)
- [ ] 3.6: Drop confirmation modal for major changes
- [ ] 3.7: Database transaction: UPDATE work_orders SET line_id, scheduled_start, scheduled_end
- [ ] 3.8: Add E2E test: drag WO from Line A 8:00 to Line B 10:00 → verify both updated

### Task 4: Multi-Select & Batch Operations (AC-6) - 8 hours
- [ ] 4.1: Implement Ctrl+Click multi-select (blue border on selected boxes)
- [ ] 4.2: Implement Shift+Click range select
- [ ] 4.3: Batch drag: move all selected WOs by same time delta
- [ ] 4.4: Batch line change: drag selected WOs to new line
- [ ] 4.5: Keyboard shortcuts: Ctrl+A (select all), Esc (clear), Delete (delete with confirmation)
- [ ] 4.6: Add unit tests for multi-select logic, batch operations

### Task 5: Resize Handles (AC-7) - 6 hours
- [ ] 5.1: Add resize handle on right edge of WO box (small square on hover)
- [ ] 5.2: Implement drag right handle to extend duration
- [ ] 5.3: Implement drag left handle to change start time
- [ ] 5.4: Snap resize to 15-minute increments
- [ ] 5.5: Duration constraints: min 15 min, max 8 hours
- [ ] 5.6: Visual feedback: show new end time while dragging
- [ ] 5.7: Database transaction: UPDATE work_orders SET scheduled_end (or scheduled_start)

### Task 6: Capacity Bars & Conflict Visualization (AC-8) - 6 hours
- [ ] 6.1: Create capacity bar component (horizontal bar below timeline)
- [ ] 6.2: Calculate line capacity: sum(WO durations) / available_shift_time × 100
- [ ] 6.3: Color coding: green (<75%), yellow (75-100%), red (>100%)
- [ ] 6.4: Conflict visualization: red outline + diagonal stripes on overlapping boxes
- [ ] 6.5: Capacity tooltip: "Line A: 85% capacity (6.8h / 8h), 3 WOs"
- [ ] 6.6: Add unit tests for capacity calculation

### Task 7: Timeline Controls & Filters (AC-9) - 6 hours
- [ ] 7.1: Add zoom buttons (Day / Week / Month)
- [ ] 7.2: Add time range picker (date range selector)
- [ ] 7.3: Implement filter by status (checkboxes: Planned, Released, In Progress)
- [ ] 7.4: Implement filter by product (dropdown)
- [ ] 7.5: Auto-refresh with WebSocket real-time updates (30s polling fallback)
- [ ] 7.6: "Fit to screen" button (auto-zoom to show all WOs)

### Task 8: Undo/Redo & Conflict Resolution (AC-10) - 6 hours
- [ ] 8.1: Implement undo/redo stack (last 10 changes)
- [ ] 8.2: Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)
- [ ] 8.3: Conflict resolution modal (Cancel / Force / Auto-adjust options)
- [ ] 8.4: Auto-adjust algorithm: shift downstream WOs by conflict duration
- [ ] 8.5: Optimistic UI: show change immediately, revert if server rejects
- [ ] 8.6: Error toast on server rejection

### Task 9: Sync with Spreadsheet Mode (AC-11) - 6 hours
- [ ] 9.1: Mode toggle buttons (Spreadsheet ↔ Timeline) with state management
- [ ] 9.2: Row order → Timeline priority mapping (row #1 = leftmost WO)
- [ ] 9.3: Timeline priority → Row order mapping (leftmost WO = row #1)
- [ ] 9.4: Recalculate priority/times on mode switch
- [ ] 9.5: Conflict warning if sync results in overlaps
- [ ] 9.6: Add E2E test: drag row in Spreadsheet → switch to Timeline → verify WO position synced

### Task 10: E2E Tests (8 hours)
- [ ] 10.1: E2E test: Drag WO horizontally from 8:00 to 10:00 → verify time updated
- [ ] 10.2: E2E test: Drag WO vertically from Line A to Line B → verify line updated
- [ ] 10.3: E2E test: Diagonal drag (Line A 8:00 → Line B 10:00) → verify both updated
- [ ] 10.4: E2E test: Multi-select 4 WOs + drag together → all moved by same delta
- [ ] 10.5: E2E test: Resize WO duration (2h → 3h) → verify scheduled_end updated
- [ ] 10.6: E2E test: Drop creates conflict → modal shows → "Auto-adjust" → downstream WOs shifted
- [ ] 10.7: E2E test: Undo drag (Ctrl+Z) → WO reverts to original position
- [ ] 10.8: E2E test: Mode switch (Spreadsheet → Timeline → Spreadsheet) → data synced

### Task 11: Documentation (AC-12) - 2 hours
- [ ] 11.1: Run `pnpm docs:update` to regenerate API docs
- [ ] 11.2: Update `docs/architecture.md` with Timeline Mode workflow diagram
- [ ] 11.3: Document drag-drop algorithm (horizontal, vertical, diagonal)
- [ ] 11.4: Document capacity calculation formula
- [ ] 11.5: Create keyboard shortcuts cheat sheet (Ctrl+Z/Y, Ctrl+A, Esc, Delete, Ctrl+Click)

**Total Estimated Effort:** 80 hours (~10 days)

## Dev Notes

### Requirements Source
[Source: docs/ux-design-planning-module.md#Variant-C-Visual-Timeline, lines 468-510]

**Timeline Mode Key Features:**
- Gantt chart timeline view for visual capacity planning
- 94% time savings (7 WO adjustments in 48s vs 14 min)
- Drag-drop: horizontal (time), vertical (line), diagonal (both)
- Multi-select batch operations (Ctrl+Click, move 4 WOs together)
- Resize handles (adjust duration)
- Capacity bars (green <75%, yellow 75-100%, red >100%)
- Conflict detection (red outline on overlap)
- Snap to grid (15-minute increments)
- Zoom controls (Day/Week/Month view)

[Source: docs/ux-design-planning-module.md#Expected-Impact, lines 54-61]
**Quantitative Benefits:**
- Time to reschedule 7 WOs: 14 min → 48s (94% faster)
- Visual capacity planning (see bottlenecks at a glance)
- Conflict detection (prevent double-booking lines)

### Architecture Constraints

**Gantt Library Options:**

| Library | License | Cost | Pros | Cons |
|---------|---------|------|------|------|
| **FullCalendar Premium** | Commercial | $500/year | Full-featured, drag-drop, resource timeline | License cost, vendor lock-in |
| **DHTMLX Gantt** | Commercial | $699/year | Industry-standard, performance, extensive docs | License cost, jQuery dependency |
| **react-gantt-chart** | MIT | Free | Open-source, React-native, lightweight | Limited features, basic styling |
| **Custom (react-beautiful-dnd)** | MIT | Free | Full control, no license cost, tailored UX | High implementation effort (4 weeks) |

**Recommendation:** Start with **FullCalendar Premium** (1-month trial) for MVP, evaluate performance/UX, then decide: keep license OR migrate to custom build for Phase 2.

**Drag-Drop Algorithm:**

```typescript
// Horizontal drag (reschedule time)
function handleHorizontalDrag(woId: number, newStartTime: Date) {
  const wo = getWOById(woId);
  const duration = wo.scheduled_end - wo.scheduled_start; // preserve duration
  const newEndTime = new Date(newStartTime.getTime() + duration);

  // Snap to 15-minute grid
  const snappedStart = snapToGrid(newStartTime, 15); // round to nearest 15 min
  const snappedEnd = new Date(snappedStart.getTime() + duration);

  // Conflict detection
  const conflicts = checkConflicts(wo.line_id, snappedStart, snappedEnd, woId);
  if (conflicts.length > 0) {
    showConflictModal(conflicts); // user chooses: Cancel, Force, Auto-adjust
    return;
  }

  // Update database
  await updateWO(woId, { scheduled_start: snappedStart, scheduled_end: snappedEnd });

  // Optimistic UI update
  updateUIOptimistically(woId, snappedStart, snappedEnd);
}

// Vertical drag (change line)
function handleVerticalDrag(woId: number, newLineId: number) {
  const wo = getWOById(woId);

  // Validate line capability (allergen restrictions, line type)
  const lineValid = validateLineCapability(wo.product_id, newLineId);
  if (!lineValid) {
    showError("Product cannot run on this line (allergen restriction)");
    return;
  }

  // Conflict detection on new line
  const conflicts = checkConflicts(newLineId, wo.scheduled_start, wo.scheduled_end, woId);
  if (conflicts.length > 0) {
    showConflictModal(conflicts);
    return;
  }

  // Update database
  await updateWO(woId, { line_id: newLineId });
  updateUIOptimistically(woId, newLineId);
}

// Auto-scheduling: shift downstream WOs
function autoAdjustDownstream(lineId: number, insertTime: Date, duration: number) {
  const downstream = getWOsAfter(lineId, insertTime); // all WOs starting after insertTime
  const shiftDelta = duration; // shift all by inserted WO duration

  for (const wo of downstream) {
    const newStart = new Date(wo.scheduled_start.getTime() + shiftDelta);
    const newEnd = new Date(wo.scheduled_end.getTime() + shiftDelta);
    await updateWO(wo.id, { scheduled_start: newStart, scheduled_end: newEnd });
  }
}
```

**Capacity Calculation:**

```typescript
function calculateLineCapacity(lineId: number, date: Date, shift: Shift): number {
  const wos = getWOsForLineShift(lineId, date, shift);
  const totalDuration = wos.reduce((sum, wo) => sum + (wo.scheduled_end - wo.scheduled_start), 0);
  const shiftDuration = getShiftDuration(shift); // Day = 8h, Swing = 8h, Night = 8h
  return (totalDuration / shiftDuration) * 100; // % capacity
}
```

**Snap to Grid (15-minute increments):**

```typescript
function snapToGrid(time: Date, gridMinutes: number): Date {
  const minutes = time.getMinutes();
  const snappedMinutes = Math.round(minutes / gridMinutes) * gridMinutes;
  const snappedTime = new Date(time);
  snappedTime.setMinutes(snappedMinutes, 0, 0); // set minutes, reset seconds/ms
  return snappedTime;
}

// Example: 10:23 → snap to 15min grid → 10:30
// Example: 10:12 → snap to 15min grid → 10:15
```

### Testing Strategy

**Risk-Based E2E Coverage:**
- HIGH RISK: Drag-drop time change (production schedule impact) = E2E required
- HIGH RISK: Drag-drop line change (line capability validation) = E2E required
- COMPLEX: Multi-select batch drag (multiple WOs updated atomically) = E2E required
- COMPLEX: Conflict detection + auto-adjust (downstream WO shifting) = E2E required
- Simple: Capacity bar calculation, color coding = unit test sufficient

**E2E Test Scenarios:**
1. Drag WO horizontally (8:00 → 10:00) → verify scheduled_start/end updated
2. Drag WO vertically (Line A → Line B) → verify line_id updated, no allergen conflict
3. Diagonal drag (Line A 8:00 → Line B 10:00) → verify both time + line updated
4. Multi-select 4 WOs → drag together → all moved by same delta (+2 hours)
5. Resize WO duration (2h → 3h) → verify scheduled_end extended
6. Drop creates conflict → modal shows → "Auto-adjust" → downstream WOs shifted
7. Undo drag (Ctrl+Z) → WO reverts to original position
8. Mode switch (Spreadsheet → Timeline → Spreadsheet) → row order synced with timeline priority

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/components/TimelineGantt.tsx` - Main Gantt chart component
- `apps/frontend/components/WOBox.tsx` - WO rectangle component
- `apps/frontend/components/TimelineControls.tsx` - Zoom, filters, date range picker
- `apps/frontend/components/CapacityBar.tsx` - Line capacity visualization
- `apps/frontend/components/ConflictModal.tsx` - Conflict resolution modal
- `apps/frontend/lib/utils/timelineScheduler.ts` - Drag-drop logic, auto-scheduling algorithm
- `apps/frontend/lib/utils/capacityCalculator.ts` - Line capacity calculation
- `apps/frontend/lib/utils/snapToGrid.ts` - 15-minute snap utility
- `apps/frontend/app/api/work-orders/timeline/route.ts` - Timeline data endpoint
- `apps/frontend/__tests__/timelineGantt.test.ts` - Unit tests
- `apps/frontend/e2e/timeline-mode-visual-scheduling.spec.ts` - E2E tests
- `docs/architecture.md` - Timeline Mode documentation

### MVP Scope

✅ **MVP Features** (ship this):
- Gantt chart with WO boxes (Day view only, defer Week/Month to Growth)
- Drag-drop horizontal (reschedule time)
- Drag-drop vertical (change line)
- Conflict detection (red outline on overlap)
- Capacity bars (green/yellow/red color coding)
- Zoom: Day view only (15-minute grid)
- Sync with Spreadsheet Mode (bi-directional)

❌ **Growth Phase** (defer):
- Drag-drop diagonal (simultaneous time + line change) - use two drags in MVP
- Multi-select batch operations (Ctrl+Click) - drag one at a time in MVP
- Resize handles (adjust duration) - use edit modal to change duration in MVP
- Undo/Redo (Ctrl+Z/Y) - manual revert in MVP
- Auto-adjust downstream WOs - manual reschedule in MVP
- Week/Month zoom levels - Day view only in MVP
- Filter by product/status - show all WOs in MVP
- Real-time WebSocket updates - manual refresh in MVP

### Dependencies

**Prerequisites:**
- Story 1.4.1 (Spreadsheet Mode) - for data model sync and mode toggle
- Existing work_orders table with scheduled_start, scheduled_end, line_id, priority fields
- Production lines table (machines) with line capabilities

**Blocks:**
- None (Story 1.4.3 Wizard Mode is independent)

**Library Evaluation:**
- FullCalendar Premium (trial license for MVP) OR
- Custom build with react-beautiful-dnd (if license cost rejected)

### References

- [FullCalendar Timeline View](https://fullcalendar.io/docs/timeline-view)
- [DHTMLX Gantt Chart](https://docs.dhtmlx.com/gantt/)
- [react-gantt-chart (MIT)](https://github.com/MaTeMaTuK/gantt-task-react)
- [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)
- [Snap to Grid Algorithm](https://en.wikipedia.org/wiki/Rounding#Rounding_to_a_specified_multiple)

### Learnings from Previous Stories

**From Story 1.4.1 (Spreadsheet Mode):**
- Drag-drop row reordering pattern → apply to Timeline WO boxes
- Priority calculation → row order = timeline leftmost position
- Mode toggle with bi-directional sync → Timeline ↔ Spreadsheet

**From Story 1.1 (pgAudit Extension):**
- Performance testing required → Timeline must render 100+ WOs without lag (<200ms initial load)
- RLS policy → timeline data filtered by org_id

**From Epic 0 Retrospective:**
- Risk-Based E2E Strategy → drag-drop schedule changes are HIGH RISK (production impact)
- MVP Discipline → defer diagonal drag, multi-select, undo/redo to Growth Phase
- Incremental Documentation → document only Timeline Mode workflow, not full Planning module

**Reuse Patterns:**
- Drag-drop pattern from Story 1.4.1 (Spreadsheet row reordering) → apply to Timeline WO boxes
- Conflict detection pattern → similar to auto-scheduling conflict warnings in 1.4.1
- Mode toggle pattern → consistent with Spreadsheet ↔ Timeline toggle

### Keyboard Shortcuts Cheat Sheet

**Selection:**
- Ctrl+Click: Multi-select WO boxes (Growth Phase)
- Shift+Click: Range select (Growth Phase)
- Ctrl+A: Select all WOs (Growth Phase)
- Esc: Clear selection

**Operations:**
- Ctrl+Z: Undo last drag (Growth Phase)
- Ctrl+Y: Redo last undone drag (Growth Phase)
- Delete: Delete selected WOs (with confirmation)

**Navigation:**
- Arrow keys: Navigate between WO boxes (Growth Phase)
- Home/End: Jump to first/last WO (Growth Phase)

**View:**
- 1/2/3 keys: Switch zoom (Day/Week/Month) (Growth Phase)
- Ctrl+0: Fit to screen (auto-zoom)

## Dev Agent Record

### Context Reference

<!-- Will be added by story-context workflow -->

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
