# Story 1.5.3: Realtime Dashboard Widgets (10 KPI Cards + Shop Floor TV)

Status: drafted

## Story

As a **Operations Director / Shop Floor Operator**,
I want **real-time KPI widgets on desktop dashboard and full-screen TV display for shop floor**,
so that **operators have 100% visibility (vs 0% currently) and decision-making is data-driven in real-time**.

## Acceptance Criteria

### AC-1: 10 Configurable KPI Widgets
- Widget types: OEE Gauge, Yield Trend Chart, WO List, Downtime Log, Material Shortages, Quality Holds, Line Utilization Bar, Output vs Target, Alerts Feed, Shift Summary
- Drag-drop widget placement (react-grid-layout)
- Resize widgets (small 1×1, medium 2×1, large 2×2 grid units)
- Widget configuration modal: title, data source, filters, refresh interval

### AC-2: TV Display Mode (Shop Floor)
- Full-screen TV display (`/production/tv-display`) - 1920×1080, 50" TV optimized
- Auto-rotating 6 screens (20 seconds each): OEE, Yield, Plan Accuracy, Running WOs, Delayed WOs, Material Shortages
- 120px font sizes (readable from 10+ meters)
- Red flash alerts for critical events (downtime >30 min, shortage blocking WO)
- No interaction (view-only, auto-refresh every 30s)

### AC-3: KPI Calculation Engine
- OEE% = Availability × Performance × Quality (standard formula)
- Line Utilization% = (Active Time / Total Shift Time) × 100
- Yield% = (Actual Output / Planned Output) × 100
- Plan Accuracy% = (WOs On-Time / Total WOs) × 100
- Material Shortage Detection: Check lp_reservations.qty_available < wo_materials.qty_required
- Quality Holds Count: COUNT(license_plates WHERE qa_status = 'on_hold')

### AC-4: Real-Time Data Refresh
- WebSocket connection to Supabase Realtime
- Subscribe to: work_orders, production_outputs, downtime_events, license_plates
- Update widgets on relevant table changes (optimistic UI)
- Polling fallback: 30-second interval if WebSocket fails

### AC-5: Widget Presets
- 3 pre-built dashboard layouts: "Production Manager", "Line Supervisor", "Operations Director"
- One-click apply preset (replaces current layout)
- Save custom layout as new preset

### AC-6: Export & Sharing
- Export dashboard as PDF (snapshot with current KPI values)
- Share dashboard URL (read-only link for stakeholders)
- Email daily summary (scheduled report with top 5 KPIs)

## Tasks / Subtasks

### Task 1: Widget Infrastructure (6h)
- [ ] Implement react-grid-layout for drag-drop widgets
- [ ] Create base `<Widget>` component with header, body, config icon
- [ ] Implement widget resize logic (small/medium/large)
- [ ] Widget configuration modal

### Task 2: 10 Widget Types (10h)
- [ ] OEE Gauge widget (circular gauge, color-coded)
- [ ] Yield Trend Chart widget (7-day line chart)
- [ ] WO List widget (table, filterable)
- [ ] Downtime Log widget (timeline view)
- [ ] Material Shortages widget (alert list)
- [ ] Quality Holds widget (LP list with qa_status)
- [ ] Line Utilization Bar widget (horizontal bars per line)
- [ ] Output vs Target widget (progress bar)
- [ ] Alerts Feed widget (scrolling list)
- [ ] Shift Summary widget (summary card)

### Task 3: TV Display Mode (8h)
- [ ] Create `/production/tv-display` page (full-screen)
- [ ] Implement auto-rotating screens (6 screens × 20s)
- [ ] 120px font sizes, high-contrast colors
- [ ] Red flash alert animation
- [ ] Auto-refresh every 30s

### Task 4: KPI Calculation Engine (6h)
- [ ] Create `KPICalculator` class with 10 KPI methods
- [ ] OEE calculation (Availability × Performance × Quality)
- [ ] Material shortage detection query
- [ ] Quality holds count query
- [ ] Add unit tests for all KPI calculations

### Task 5: Real-Time Updates (4h)
- [ ] WebSocket subscription to 4 tables
- [ ] Widget refresh on table change events
- [ ] Polling fallback (30s interval)
- [ ] Live indicator component

### Task 6: Widget Presets (4h)
- [ ] Define 3 preset layouts (JSON configs)
- [ ] "Apply Preset" button with preview
- [ ] "Save as Preset" custom layout feature

### Task 7: Export & Sharing (4h)
- [ ] PDF export (jsPDF, snapshot current KPIs)
- [ ] Share URL generation (read-only dashboard link)
- [ ] Email daily summary (scheduled job)

### Task 8: E2E Tests (4h)
- [ ] E2E: Drag widget to new position → layout saved
- [ ] E2E: TV display mode → screens auto-rotate every 20s
- [ ] E2E: Real-time update → production output added → widget refreshes
- [ ] E2E: Apply preset → layout changes to "Production Manager"

### Task 9: Documentation (2h)
- [ ] Update architecture.md with widget system
- [ ] Document KPI formulas
- [ ] TV display setup guide (hardware recommendations)

**Total Estimated Effort:** 48 hours (~6 days)

## Dev Notes

**Widget Layout Storage:**
```json
{
  "layout": [
    {"i": "oee-gauge", "x": 0, "y": 0, "w": 2, "h": 2},
    {"i": "yield-chart", "x": 2, "y": 0, "w": 4, "h": 2},
    {"i": "wo-list", "x": 0, "y": 2, "w": 6, "h": 3}
  ],
  "widgets": {
    "oee-gauge": {"type": "oee_gauge", "config": {"line_id": null, "shift": "Day"}},
    "yield-chart": {"type": "yield_trend", "config": {"days": 7, "product_id": null}}
  }
}
```

**TV Display Auto-Rotation:**
- Screen 1: OEE Gauge (all lines, large font)
- Screen 2: Yield % (today vs yesterday comparison)
- Screen 3: Plan Accuracy % (on-time WOs)
- Screen 4: Running WOs (list with progress bars)
- Screen 5: Delayed WOs (red alert, count + details)
- Screen 6: Material Shortages (blocking WOs list)

**MVP Scope:**
✅ 10 widgets, TV display, real-time updates, 3 presets, PDF export
❌ Growth: Custom SQL widgets, widget marketplace, advanced alerts (SMS/Slack)

**Dependencies:** Story 1.5.1 (WO Kanban Board) for KPI calculation logic reuse

## Dev Agent Record
### Context Reference
<!-- Will be added by story-context workflow -->
