# Story 1.5.1: WO Kanban Board (Real-Time Production Board)

Status: drafted

## Story

As a **Production Manager / Line Supervisor**,
I want **single-screen Kanban dashboard with real-time WO status, 10 KPI cards, and 4-column line board**,
so that **morning review takes 50 seconds (vs 8 minutes) and shift monitoring is passive (vs 98 minutes walking to office)**.

## Acceptance Criteria

### AC-1: Kanban Board Layout (4 Columns)
- Create `<ProductionKanban>` component with 4-column layout
- Column 1: Planned (blue) - WOs scheduled but not started
- Column 2: Released (yellow) - WOs ready for production
- Column 3: In Progress (green) - WOs currently running on lines
- Column 4: Completed (gray) - WOs finished today
- WO cards: Drag-drop between columns to change status (planned → released → in_progress → completed)
- Each card shows: WO#, Product name, Line, Quantity, Progress bar (%), Priority indicator (⭐ #1)
- Column counters: Show count of WOs per column (e.g., "In Progress (4)")

### AC-2: 10 KPI Cards (Top Section)
- KPI Card 1: OEE% (Overall Equipment Effectiveness) - green >85%, yellow 75-85%, red <75%
- KPI Card 2: Line Utilization% - green >80%, yellow 60-80%, red <60%
- KPI Card 3: Today's Output (kg) - actual vs planned with progress bar
- KPI Card 4: Active WOs - count of WOs in "In Progress" status
- KPI Card 5: Material Shortages - count of WOs blocked by missing materials (🔴 badge)
- KPI Card 6: Delayed WOs - count of WOs past due_date (⚠️ badge)
- KPI Card 7: Downtime (minutes today) - total downtime across all lines
- KPI Card 8: Yield% (today) - actual output / planned output
- KPI Card 9: Plan Accuracy% - WOs completed on-time / total WOs
- KPI Card 10: On-Time Delivery% - WOs delivered by due_date
- Real-time updates: KPIs refresh every 30 seconds (WebSocket or polling)

### AC-3: WO Card Component
- WO card displays: WO number, product name (truncated), line badge, quantity + UoM
- Progress bar: Visual % complete (actual_output / planned_quantity × 100)
- Status badge: Color-coded (blue planned, yellow released, green in_progress, gray completed)
- Priority indicator: ⭐ icon if priority = 1 (highest priority)
- Material shortage icon: 🔴 if any wo_materials have insufficient stock
- Overdue icon: ⚠️ if due_date < today AND status != completed
- Click card → open WO Details Modal (6 tabs)

### AC-4: Drag-Drop Status Change
- Drag WO card from "Planned" column → drop in "Released" column → status updated to 'released'
- Drag WO card from "Released" → "In Progress" → status updated to 'in_progress', actual_start timestamp set
- Drag WO card from "In Progress" → "Completed" → status updated to 'completed', actual_end timestamp set
- Visual feedback: Ghost card at original position, green drop zone indicator
- Validation: Cannot drag backwards (e.g., in_progress → released), show error toast
- Optimistic UI: Update immediately, revert if server rejects
- Database transaction: UPDATE work_orders SET status, actual_start/end WHERE id = wo_id

### AC-5: WO Details Modal (6 Tabs)
- Tab 1: Overview - WO summary (product, qty, line, dates, status, priority, notes)
- Tab 2: Operations - Operations table (seq, name, status, planned IN/OUT, actual IN/OUT, yield%, operator)
- Tab 3: Materials - Materials consumption table (material, BOM qty, actual consumed, variance, status)
- Tab 4: Yield - Yield analysis (PR/FG output, input, yield%, variance vs BOM)
- Tab 5: Trace - Forward/backward traceability tree (LP genealogy)
- Tab 6: History - Audit log (status changes, operations, output recordings, user, timestamp)
- Modal footer: Action buttons (Start WO, Complete WO, Record Downtime, Close)

### AC-6: Real-Time Updates (WebSocket)
- Connect to Supabase Realtime: LISTEN to work_orders table changes
- On INSERT/UPDATE/DELETE → refresh affected WO card (fetch updated data)
- KPI cards refresh every 30 seconds (calculate from aggregated data)
- Live indicator: Green dot "Live" in top-right corner (connected), red "Offline" (disconnected)
- Fallback: If WebSocket fails → polling every 30 seconds
- Visual notification: Toast "WO-0109 status changed to In Progress" (non-intrusive)

### AC-7: Mobile/Tablet Responsive (1280×800)
- Tablet layout: Stack KPI cards 2×5 grid (vs 10 horizontal on desktop)
- Kanban columns: Horizontal scroll on mobile (swipe left/right)
- WO cards: Larger touch targets (48px min height)
- Simplified card content: Hide secondary info (show only WO#, product, line, %)
- Modal: Full-screen on mobile (vs overlay on desktop)

### AC-8: Filters & Search
- Filter by Line: Dropdown to show only WOs for Line A, B, C, or D
- Filter by Priority: Checkbox to show only priority #1 WOs
- Filter by Status: Multi-select (Planned, Released, In Progress, Completed)
- Search: Input field to search by WO number or product name
- Clear filters button: Reset all filters to default (show all)

### AC-9: Documentation
- Update `docs/architecture.md` with Production Kanban workflow
- Document drag-drop status change logic
- Document KPI calculation formulas (OEE, utilization, yield)
- Update `docs/API_REFERENCE.md` with `/api/production/dashboard` endpoint

## Tasks / Subtasks

### Task 1: Kanban Board Layout (AC-1, AC-3) - 10 hours
- [ ] 1.1: Create `<ProductionKanban>` component with 4-column grid
- [ ] 1.2: Implement column headers (Planned, Released, In Progress, Completed)
- [ ] 1.3: Create `<WOCard>` component (WO#, product, line, qty, progress bar)
- [ ] 1.4: Add status badge color coding (blue, yellow, green, gray)
- [ ] 1.5: Add priority indicator (⭐ if priority = 1)
- [ ] 1.6: Add material shortage icon (🔴) and overdue icon (⚠️)
- [ ] 1.7: Column counters (show count of WOs per column)
- [ ] 1.8: Render WO cards in appropriate columns based on status

### Task 2: 10 KPI Cards (AC-2) - 8 hours
- [ ] 2.1: Create `<KPICard>` component (title, value, trend, color)
- [ ] 2.2: Implement OEE% calculation (Availability × Performance × Quality)
- [ ] 2.3: Implement Line Utilization% (active time / total shift time)
- [ ] 2.4: Implement Today's Output (sum of production_outputs.quantity)
- [ ] 2.5: Implement Active WOs count (WHERE status = 'in_progress')
- [ ] 2.6: Implement Material Shortages count (WOs with insufficient stock)
- [ ] 2.7: Implement Delayed WOs count (WHERE due_date < today AND status != completed)
- [ ] 2.8: Implement Downtime minutes (sum of downtime_events.duration_minutes)
- [ ] 2.9: Implement Yield% (actual output / planned output)
- [ ] 2.10: Implement Plan Accuracy% and On-Time Delivery%
- [ ] 2.11: Color coding logic (green/yellow/red thresholds)

### Task 3: Drag-Drop Status Change (AC-4) - 8 hours
- [ ] 3.1: Implement drag-drop using @dnd-kit/core or react-beautiful-dnd
- [ ] 3.2: Drag handler: detect source column and target column
- [ ] 3.3: Validate status transition (planned → released → in_progress → completed only)
- [ ] 3.4: Visual feedback: ghost card, green drop zone indicator
- [ ] 3.5: Optimistic UI update (show change immediately)
- [ ] 3.6: Database transaction: UPDATE work_orders SET status, actual_start/end
- [ ] 3.7: Error handling: revert if server rejects, show toast
- [ ] 3.8: Add E2E test: drag WO from Planned to Released → verify status updated

### Task 4: WO Details Modal (AC-5) - 10 hours
- [ ] 4.1: Create `<WODetailsModal>` component with 6-tab layout
- [ ] 4.2: Tab 1: Overview (summary fields, editable notes)
- [ ] 4.3: Tab 2: Operations (table with seq, name, status, IN/OUT, yield%)
- [ ] 4.4: Tab 3: Materials (consumption table, BOM vs actual, variance)
- [ ] 4.5: Tab 4: Yield (PR/FG analysis, variance chart)
- [ ] 4.6: Tab 5: Trace (forward/backward tree, reuse TraceabilityAPI)
- [ ] 4.7: Tab 6: History (audit log, status changes, timestamps)
- [ ] 4.8: Footer action buttons (Start WO, Complete WO, Record Downtime, Close)
- [ ] 4.9: Modal state management (open/close, active tab)

### Task 5: Real-Time Updates (AC-6) - 8 hours
- [ ] 5.1: Connect to Supabase Realtime (LISTEN to work_orders table)
- [ ] 5.2: On INSERT/UPDATE/DELETE → refresh affected WO card
- [ ] 5.3: KPI cards refresh logic (30-second interval)
- [ ] 5.4: Live indicator component (green "Live" / red "Offline")
- [ ] 5.5: WebSocket fallback: polling every 30 seconds if WebSocket fails
- [ ] 5.6: Visual notification toast ("WO-0109 status changed")
- [ ] 5.7: Add unit tests for real-time update logic

### Task 6: Mobile/Tablet Responsive (AC-7) - 6 hours
- [ ] 6.1: Tablet layout: Stack KPI cards 2×5 grid (Tailwind responsive classes)
- [ ] 6.2: Kanban columns: Horizontal scroll on mobile (overflow-x-auto)
- [ ] 6.3: WO cards: Larger touch targets (min-h-12 = 48px)
- [ ] 6.4: Simplified card content on mobile (hide secondary info)
- [ ] 6.5: Modal: Full-screen on mobile (Tailwind sm: classes)
- [ ] 6.6: Test on tablet device (1280×800)

### Task 7: Filters & Search (AC-8) - 4 hours
- [ ] 7.1: Implement filter by line (dropdown)
- [ ] 7.2: Implement filter by priority (checkbox for priority #1)
- [ ] 7.3: Implement filter by status (multi-select checkboxes)
- [ ] 7.4: Implement search by WO# or product name (input field)
- [ ] 7.5: Clear filters button (reset to show all)
- [ ] 7.6: Filter state management (query params or local state)

### Task 8: API Endpoint (Dashboard Data) - 6 hours
- [ ] 8.1: Create `GET /api/production/dashboard` endpoint
- [ ] 8.2: Return WOs grouped by status (planned, released, in_progress, completed)
- [ ] 8.3: Return 10 KPI values (OEE%, utilization%, output, shortages, etc.)
- [ ] 8.4: Optimize query performance (single query with aggregations)
- [ ] 8.5: Add caching (60-second cache for KPIs)
- [ ] 8.6: Add unit tests for dashboard API

### Task 9: E2E Tests (6 hours)
- [ ] 9.1: E2E test: Load dashboard → 10 KPIs displayed with correct values
- [ ] 9.2: E2E test: Drag WO from Planned to Released → status updated
- [ ] 9.3: E2E test: Click WO card → modal opens with 6 tabs
- [ ] 9.4: E2E test: Real-time update → WO card refreshes automatically
- [ ] 9.5: E2E test: Filter by line → only Line A WOs shown
- [ ] 9.6: E2E test: Mobile viewport → KPI cards stack 2×5

### Task 10: Documentation (AC-9) - 2 hours
- [ ] 10.1: Run `pnpm docs:update` to regenerate API docs
- [ ] 10.2: Update `docs/architecture.md` with Production Kanban workflow
- [ ] 10.3: Document drag-drop status change logic
- [ ] 10.4: Document KPI calculation formulas (OEE, utilization, yield)

**Total Estimated Effort:** 68 hours (~8-9 days)

## Dev Notes

### Requirements Source
[Source: docs/ux-design-production-module.md#Variant-B-Real-Time-Production-Board, lines 46-52]

**Real-Time Production Board Key Features:**
- Single-screen dashboard (no tab switching)
- 10 KPI cards + 4-column Kanban board
- Real-time updates via WebSocket (30-second refresh)
- WO Details Modal with 6 tabs
- Mobile/tablet responsive (1280×800)
- 83% faster morning review (8 min → 50s)
- 97% time saved on shift monitoring (98 min → 2 min passive)

### Architecture Constraints

**OEE Calculation (Industry Standard):**
```typescript
// OEE = Availability × Performance × Quality
// Availability = (Shift Time - Downtime) / Shift Time
// Performance = (Actual Output / Planned Output)
// Quality = (Good Output / Total Output)

function calculateOEE(shift_start: Date, shift_end: Date, line_id: number): number {
  const shift_minutes = (shift_end - shift_start) / (1000 * 60); // 480 min (8h)
  const downtime_minutes = sumDowntime(line_id, shift_start, shift_end);
  const availability = (shift_minutes - downtime_minutes) / shift_minutes;

  const planned_output = sumPlannedOutput(line_id, shift_start, shift_end);
  const actual_output = sumActualOutput(line_id, shift_start, shift_end);
  const performance = actual_output / planned_output;

  const total_output = actual_output;
  const good_output = sumGoodOutput(line_id, shift_start, shift_end); // qa_status = 'passed'
  const quality = good_output / total_output;

  return availability * performance * quality * 100; // return as %
}
```

**Drag-Drop Status Transition Logic:**
```typescript
function handleWODrop(woId: number, targetColumn: Column) {
  const wo = getWOById(woId);
  const validTransitions = {
    planned: ['released', 'cancelled'],
    released: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: ['closed'],
  };

  if (!validTransitions[wo.status].includes(targetColumn.status)) {
    showError(`Invalid status transition: ${wo.status} → ${targetColumn.status}`);
    return;
  }

  const updateData: Partial<WorkOrder> = { status: targetColumn.status };
  if (targetColumn.status === 'in_progress' && !wo.actual_start) {
    updateData.actual_start = new Date();
  }
  if (targetColumn.status === 'completed' && !wo.actual_end) {
    updateData.actual_end = new Date();
  }

  // Optimistic UI update
  updateUIOptimistically(woId, updateData);

  // Server update
  await updateWO(woId, updateData);
}
```

**Real-Time Updates (Supabase Realtime):**
```typescript
// Subscribe to work_orders table changes
const channel = supabase
  .channel('production_board')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'work_orders',
    filter: `org_id=eq.${orgId}`,
  }, (payload) => {
    const wo = payload.new as WorkOrder;
    // Update WO card in UI
    refreshWOCard(wo.id);
    showToast(`WO-${wo.wo_number} status changed to ${wo.status}`);
  })
  .subscribe();
```

### Testing Strategy

**Risk-Based E2E Coverage:**
- HIGH RISK: Drag-drop status change (production workflow impact) = E2E required
- HIGH RISK: Real-time updates (critical for supervisor monitoring) = E2E required
- COMPLEX: 6-tab WO Details Modal (multi-tab navigation) = E2E required
- Simple: KPI cards display, filter logic = unit test sufficient

**E2E Test Scenarios:**
1. Load dashboard → 10 KPIs shown → values correct (vs manual calculation)
2. Drag WO from Planned to Released → status updated → card moves to Released column
3. Click WO card → modal opens → 6 tabs accessible → data correct
4. Real-time: Create WO in DB → card appears on board automatically (<30s)
5. Filter by Line A → only Line A WOs shown → other lines hidden
6. Mobile viewport (1280×800) → KPI cards stack 2×5 → horizontal scroll works

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/components/ProductionKanban.tsx` - Main Kanban board
- `apps/frontend/components/KPICard.tsx` - KPI card component
- `apps/frontend/components/WOCard.tsx` - WO card component (reusable)
- `apps/frontend/components/WODetailsModal.tsx` - 6-tab modal
- `apps/frontend/components/LiveIndicator.tsx` - WebSocket status indicator
- `apps/frontend/lib/utils/oeeCalculator.ts` - OEE calculation logic
- `apps/frontend/lib/utils/kpiCalculator.ts` - KPI calculation utilities
- `apps/frontend/app/api/production/dashboard/route.ts` - Dashboard API endpoint
- `apps/frontend/app/production/page.tsx` - Replace existing 5-tab UI with Kanban
- `apps/frontend/__tests__/productionKanban.test.ts` - Unit tests
- `apps/frontend/e2e/production-kanban-board.spec.ts` - E2E tests
- `docs/architecture.md` - Production Kanban documentation

### MVP Scope

✅ **MVP Features** (ship this):
- 4-column Kanban board (Planned, Released, In Progress, Completed)
- 10 KPI cards (all metrics calculated)
- Drag-drop status change (planned → released → in_progress → completed)
- WO Details Modal (6 tabs)
- Real-time updates (WebSocket with polling fallback)
- Mobile responsive (tablet 1280×800)
- Basic filters (line, priority, status)

❌ **Growth Phase** (defer):
- Multi-line drag-drop (assign WO to different line) - single line in MVP
- Batch operations (select multiple WOs, bulk status change) - one at a time in MVP
- Advanced KPI trends (7-day chart, forecast) - current value only in MVP
- Downtime Tracker Modal (AC not in this story) - separate story
- AI-powered shift summary - separate story
- Custom column configuration (add/remove columns) - fixed 4 columns in MVP

### Dependencies

**Prerequisites:**
- Existing work_orders, production_outputs, downtime_events tables
- Supabase Realtime enabled (WebSocket support)
- TraceabilityAPI (for Tab 5: Trace)

**Blocks:**
- Story 1.5.3 (Realtime Dashboard Widgets) - depends on KPI calculation logic from 1.5.1

### References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [@dnd-kit/core Documentation](https://docs.dndkit.com/)
- [OEE Calculation Standard](https://en.wikipedia.org/wiki/Overall_equipment_effectiveness)
- [Kanban Board UX Patterns](https://www.nngroup.com/articles/kanban-boards/)

### Learnings from Previous Stories

**From Story 1.4.2 (Timeline Mode):**
- Drag-drop pattern → apply to Kanban WO cards
- Real-time sync → apply to WebSocket updates
- Conflict detection → validate status transitions

**From Story 1.4.1 (Spreadsheet Mode):**
- Optimistic UI pattern → apply to drag-drop status change
- Batch API pattern → could apply to multi-WO operations (Growth Phase)

**From Epic 0 Retrospective:**
- Risk-Based E2E Strategy → drag-drop status change is HIGH RISK
- MVP Discipline → defer batch operations, custom columns to Growth
- Incremental Documentation → document only Production Kanban, not full Production module

## Dev Agent Record

### Context Reference

<!-- Will be added by story-context workflow -->

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
