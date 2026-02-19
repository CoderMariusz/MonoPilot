# PLAN-016: Work Order Gantt/Schedule View

**Module**: Planning
**Feature**: Work Order Visual Scheduling (FR-PLAN-024 - "Could Have")
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > Schedule View                          [List View] [Settings] [Print]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Filters: [Status: All v] [Product: All v] [Line: All v] [Date Range: This Week v] [Search]     |
|                                                                                                    |
|  View by: ( ) Machine/Work Center  (x) Product Line       Zoom: [Day] [Week] [Month]            |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|  Legend: [Planned] [Released] [In Progress] [On Hold] [Completed] [Overdue] [Dependencies v]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Swimlane    Mon Dec 16   |   Tue Dec 17   |   Wed Dec 18   |   Thu Dec 19   |   Fri Dec 20   | |
|                 TODAY          (tomorrow)       (+2 days)       (+3 days)       (+4 days)        | |
|             -----|-------|-------|-------|-------|-------|-------|-------|-------|-------|-----   | |
|                 8am     12pm    4pm     8am     12pm    4pm     8am     12pm    4pm     8am       | |
|                                                                                                    | |
+--------------------------------------------------------------------------------------------------+
|  Packing #1     |       [WO-00156: Chocolate Bar (1000pc)]        |                          |   |
|                 |       |=============================>               |                          |   |
|                 |  8am  |   Planned  | 8h duration | Ends 4pm        |                          |   |
|                 |       |                                              |                          |   |
|                 |       |                                              |  [WO-00160: Cookie]     |   |
|                 |       |                                              |  |=======>             |   |
|                 |       |                                              |  Released | 4h          |   |
+--------------------------------------------------------------------------------------------------+
|  Baking #2      |  [WO-00155: Vanilla Cookie (500kg)]    |                                      |   |
|                 |  |==========================> |         |                                      |   |
|                 |  In Progress | 65% ████████░░ | 8h    |                                      |   |
|                 |       |                                 |                                      |   |
|                 |       |                                 |  [WO-00162: Bread]                  |   |
|                 |       |                                 |  |============>                     |   |
|                 |       |                                 |  Planned | 6h                       |   |
+--------------------------------------------------------------------------------------------------+
|  Filling #1     |  [WO-00154: Strawberry Jam (200jar)]    |                                      |   |
|                 |  |=======> [PAUSED] | On Hold          |                                      |   |
|                 |  30% ███░░░░░░░ | Machine issue        |                                      |   |
|                 |       |                                 |                                      |   |
|                 |       |                                 |  [WO-00161: Apple Sauce]            |   |
|                 |       |                                 |  |==================>              |   |
|                 |       |                                 |  Planned | 10h                     |   |
+--------------------------------------------------------------------------------------------------+
|  Mixing #1      |       |                                 |  [WO-00163: Peanut Mix]             |   |
|                 |       |                                 |  |===========>                     |   |
|                 |       |                                 |  Released | 5h                      |   |
|                 |       |                                 |                                      |   |
|                 |       |       [WO-00159: Dough Mix]     |                                      |   |
|                 |       |       |=================>        |                                      |   |
|                 |       |       Planned | 8h               |                                      |   |
+--------------------------------------------------------------------------------------------------+
|  [+ Add Line]   |       |                                 |                                      |   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [!] Overdue: 1 WO (WO-00152 expected Dec 15)          Dependencies: 3 linked WOs [Show v]       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Click WO Bar] Opens WO Detail Quick View:
+---------------------------------------+
|  WO-00156: Chocolate Bar              |
|  Status: Planned                      |
|  Line: Packing #1                     |
|  Scheduled: Dec 17, 8:00-16:00 (8h)   |
|  Quantity: 1,000 pc                   |
|  Materials: [OK] 3 available          |
|                                        |
|  [View Full Details] [Edit] [Release] |
+---------------------------------------+

[Drag & Drop] (Desktop):
  - Drag WO bar horizontally → Reschedule date/time
  - Drag WO bar vertically → Change line assignment
  - Drag handles to resize → Adjust duration
  - Drop validation → Check line availability, material status
  - Confirm dialog → "Reschedule WO-00156 to Dec 18, 10:00-18:00?"

[Dependencies] (Optional):
  - Arrow lines connecting dependent WOs
  - WO-00156 (Mixing) → WO-00157 (Baking) → WO-00158 (Packing)
  - Constraint types: Finish-to-Start, Start-to-Start
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Planning > WO Schedule                 [List] [Settings] [Print] |
+--------------------------------------------------------------------+
|                                                                      |
|  Filters: [Status v] [Product v] [Line v] [Date v]  [Search]       |
|                                                                      |
|  View by: ( ) Machine  (x) Line    Zoom: [Day] [Week] [Month]      |
|                                                                      |
|  Legend: [Planned] [Released] [In Prog] [On Hold] [Done] [Overdue] |
|                                                                      |
+--------------------------------------------------------------------+
|  Swimlane    Mon Dec 16 | Tue Dec 17 | Wed Dec 18 | Thu Dec 19 |   |
|                TODAY         (tmrw)      (+2d)        (+3d)         |
|             -------|--------|--------|--------|--------|--------    |
|                  8am       12pm      4pm      8am       12pm        |
|                                                                      |
+--------------------------------------------------------------------+
|  Packing #1     [WO-156: Choc (1000pc)]     |                  |   |
|                 |======================>     |                  |   |
|            8am  | Planned | 8h              |                  |   |
|                 |                            |  [WO-160: Cookie]|   |
|                 |                            |  |=====>         |   |
+--------------------------------------------------------------------+
|  Baking #2      [WO-155: Cookie (500kg)]    |                  |   |
|                 |==================> |       |                  |   |
|                 In Prog | 65% ████░░ | 8h   |                  |   |
|                 |                            |  [WO-162: Bread] |   |
|                 |                            |  |=======>        |   |
+--------------------------------------------------------------------+
|  Filling #1     [WO-154: Jam (200jar)]      |                  |   |
|                 |======> [PAUSED]            |                  |   |
|                 30% ██░░░░ | On Hold        |                  |   |
|                 |                            |  [WO-161: Sauce] |   |
|                 |                            |  |==========>     |   |
+--------------------------------------------------------------------+
|  Mixing #1      |                            |  [WO-163: Mix]   |   |
|                 |                            |  |=======>        |   |
|                 |       [WO-159: Dough]      |                  |   |
|                 |       |==========>         |                  |   |
+--------------------------------------------------------------------+
|                                                                      |
|  [!] Overdue: 1 WO       Dependencies: 3 [Show v]                   |
|                                                                      |
+--------------------------------------------------------------------+

[Long-Press WO Bar] → Opens quick menu:
  - View Details
  - Reschedule (opens modal)
  - Change Line (opens picker)
  - Edit WO
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < WO Schedule View              |
|  [List View] [Settings]          |
+----------------------------------+
|                                  |
|  [Filters v]    [Search]        |
|                                  |
|  View: (x) Line  ( ) Machine     |
|  Zoom: [Day] [Week] [Month]      |
|                                  |
|  Week of Dec 16-20, 2024         |
|  [< Prev Week] [Today] [Next >]  |
|                                  |
+----------------------------------+
|  --- Packing #1 ---              |
|                                  |
|  Mon Dec 16 (Today)              |
|  +----------------------------+  |
|  | WO-156: Chocolate Bar      |  |
|  | 8:00 AM - 4:00 PM (8h)     |  |
|  | [Planned] 1,000 pc         |  |
|  | [!] Mat. low               |  |
|  |        [View] [Edit] [⋮]   |  |
|  +----------------------------+  |
|                                  |
|  Thu Dec 19                      |
|  +----------------------------+  |
|  | WO-160: Vanilla Cookie     |  |
|  | 8:00 AM - 12:00 PM (4h)    |  |
|  | [Released] 500 kg          |  |
|  |        [View] [Start] [⋮]  |  |
|  +----------------------------+  |
|                                  |
|  --- Baking #2 ---               |
|                                  |
|  Mon Dec 16 (Today)              |
|  +----------------------------+  |
|  | WO-155: Vanilla Cookie     |  |
|  | 8:00 AM - 4:00 PM (8h)     |  |
|  | [In Progress] 500 kg       |  |
|  | Progress: 65% ████████░░   |  |
|  |        [View] [Pause] [⋮]  |  |
|  +----------------------------+  |
|                                  |
|  Wed Dec 18                      |
|  +----------------------------+  |
|  | WO-162: Whole Wheat Bread  |  |
|  | 10:00 AM - 4:00 PM (6h)    |  |
|  | [Planned] 800 kg           |  |
|  |        [View] [Edit] [⋮]   |  |
|  +----------------------------+  |
|                                  |
|  --- Filling #1 ---              |
|                                  |
|  Mon Dec 16 (Today)              |
|  +----------------------------+  |
|  | WO-154: Strawberry Jam     |  |
|  | 8:00 AM - 6:00 PM (10h)    |  |
|  | [On Hold] 200 jar          |  |
|  | Paused: Machine issue      |  |
|  | Progress: 30% ███░░░░░░    |  |
|  |      [View] [Resume] [⋮]   |  |
|  +----------------------------+  |
|                                  |
|  [Load More Lines]               |
|                                  |
|  +----------------------------+  |
|  | [!] 1 Overdue WO           |  |
|  | WO-152 expected Dec 15     |  |
|  | [View Details]             |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+

[Long-Press Card] → Actions menu:
  - View Full Details
  - Reschedule
  - Change Line
  - Edit WO (if draft)
  - Start (if released)
  - Pause (if in progress)
```

### Alternative Mobile View: Horizontal Scroll Gantt

```
+----------------------------------+
|  < WO Schedule View              |
|  [List View] [Settings]          |
+----------------------------------+
|                                  |
|  [Filters v]    [Search]        |
|                                  |
|  View: (x) Gantt (Scroll)        |
|  Zoom: [Day] [Week] [Month]      |
|                                  |
+----------------------------------+
|  Week: Dec 16-20  [< Prev] [>]   |
|                                  |
|  Scroll horizontally →           |
|                                  |
|  +-----------------------------------------------------------+
|  | Line        | M 16 | T 17 | W 18 | Th 19 | F 20 |       |
|  +-----------------------------------------------------------+
|  | Packing #1  | [===WO-156====>]      | [WO-160]|         |
|  +-----------------------------------------------------------+
|  | Baking #2   | [==WO-155==>]   | [WO-162=>]   |         |
|  +-----------------------------------------------------------+
|  | Filling #1  | [WO-154 PAUSED] |              |         |
|  +-----------------------------------------------------------+
|  | Mixing #1   |       | [WO-159==>] |          |         |
|  +-----------------------------------------------------------+
|                                                             |
|  (Swipe left/right to scroll timeline)                     |
|                                                             |
+----------------------------------+
|                                  |
|  Tap bar to view details         |
|  Long-press to reschedule        |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > Schedule View                          [List View] [Settings] [Print]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Filters: [==========] [==========] [==========] [==========] [==========]                       |
|                                                                                                    |
|  View by: [==========]  [==========]       Zoom: [====] [====] [====]                           |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|  Legend: [====] [====] [====] [====] [====] [====] [====]                                        |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Swimlane    [========] | [========] | [========] | [========] | [========] |                   |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|  [=========]    |       [====================]               |                                   |
|                 |       [====================================] |                                   |
|                 |       [========================]             |                                   |
+--------------------------------------------------------------------------------------------------+
|  [=========]    |  [=========================]  |                                               |
|                 |  [====================================]    |                                   |
+--------------------------------------------------------------------------------------------------+
|  [=========]    |  [=========================]  |                                               |
|                 |  [================]                        |                                   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Loading schedule data...                                                                         |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > Schedule View                          [List View] [Settings] [Print]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Filters: [Status: All v] [Product: All v] [Line: All v] [Date Range: This Week v] [Search]     |
|                                                                                                    |
|  View by: ( ) Machine/Work Center  (x) Product Line       Zoom: [Day] [Week] [Month]            |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Calendar Icon]|                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                No Work Orders Scheduled                                           |
|                                                                                                    |
|                     No work orders found for the selected date range.                             |
|                     Create work orders and schedule them to production lines.                     |
|                                                                                                    |
|                                                                                                    |
|                               [+ Create First Work Order]                                         |
|                                                                                                    |
|                                    [Switch to List View]                                          |
|                                                                                                    |
|                                                                                                    |
|                      Quick Tip: Use the Gantt view to visualize line capacity                     |
|                      and avoid scheduling conflicts. Drag & drop to reschedule.                   |
|                                                                                                    |
|                                   [View Scheduling Guide]                                         |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > Schedule View                          [List View] [Settings] [Print]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Filters: [Status: All v] [Product: All v] [Line: All v] [Date Range: This Week v] [Search]     |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Schedule View                                         |
|                                                                                                    |
|                     Unable to retrieve work order scheduling data.                                |
|                     Please check your connection and try again.                                    |
|                                                                                                    |
|                              Error: WO_SCHEDULE_FETCH_FAILED                                      |
|                                                                                                    |
|                                                                                                    |
|                              [Retry]    [Switch to List View]                                     |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Timeline Header

| Component | Display | Interaction |
|-----------|---------|-------------|
| **Date Range** | Shows visible dates based on zoom level | Click to open date picker, jump to specific date |
| **Today Indicator** | Vertical line at current date/time | Always visible when today is in range |
| **Time Scale** | Hour markers (Day), Date markers (Week/Month) | Auto-scales based on zoom level |
| **Zoom Controls** | Day, Week, Month buttons | Switch between granularities |
| **Navigation** | Previous/Next arrows | Scroll timeline left/right |

### 2. Swimlanes (Rows)

| View Mode | Swimlane Groups | Sort Order |
|-----------|-----------------|------------|
| **By Product Line** | One row per production line | By line name (alphabetical) |
| **By Machine/Work Center** | One row per machine | By machine name (alphabetical) |
| **Custom** (future) | By product, by priority, by shift | Configurable |

**Swimlane Header:**
- Line/Machine name (left-aligned)
- Capacity indicator (optional): "3 WOs scheduled"
- Expand/collapse icon (if WOs overlap)
- [+ Add WO] quick action (hover/right-click)

### 3. Work Order Bars

**Visual Elements:**

| Element | Display |
|---------|---------|
| **Bar Color** | Status-based (see Status Colors below) |
| **Bar Width** | Proportional to duration (scheduled_start_time to scheduled_end_time) |
| **Bar Height** | 40px standard, 60px if showing progress |
| **Bar Label** | WO Number + Product Name (truncated if narrow) |
| **Progress Bar** (if In Progress) | Overlay bar showing completion % |
| **Icons** | Material alert [!], Overdue [⚠], Dependencies [→] |
| **Border** | Solid for confirmed, dashed for draft |

**Status Colors:**

| Status | Color | Background | Border |
|--------|-------|------------|--------|
| Draft | Gray | #F3F4F6 | Dashed #9CA3AF |
| Planned | Blue | #DBEAFE | Solid #3B82F6 |
| Released | Cyan | #CFFAFE | Solid #06B6D4 |
| In Progress | Purple | #EDE9FE | Solid #8B5CF6 |
| On Hold | Orange | #FED7AA | Solid #F97316 |
| Completed | Green | #D1FAE5 | Solid #10B981 |
| Overdue | Red | #FEE2E2 | Solid #EF4444 |

**Bar Interactions:**

| Action | Desktop | Mobile | Result |
|--------|---------|--------|--------|
| **Click** | Left-click | Tap | Open WO Detail Quick View |
| **Drag Horizontal** | Click & drag left/right | Long-press & drag | Reschedule date/time |
| **Drag Vertical** | Click & drag up/down | Long-press & drag | Change line assignment |
| **Resize** | Drag left/right handles | Not supported | Adjust scheduled duration |
| **Right-Click** | Right-click | Long-press | Open context menu |
| **Hover** | Hover | Not applicable | Show tooltip with WO details |

### 4. Filters Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **Status** | Multi-select dropdown | Draft, Planned, Released, In Progress, On Hold, Completed | All except Completed |
| **Product** | Searchable dropdown | All products (finished goods) | All |
| **Line** | Multi-select dropdown | All production lines | All |
| **Date Range** | Preset + custom picker | Today, This Week, This Month, Next Week, Custom | This Week |
| **Search** | Text input | Search by WO number, product name | Empty |

### 5. Dependencies (Optional)

**Visual Representation:**
- Arrow lines connecting dependent WO bars
- Line style: Dashed with arrow head
- Color: #6B7280 (gray)
- Constraint types:
  - **Finish-to-Start (FS)**: WO A completes before WO B starts
  - **Start-to-Start (SS)**: WO A and B start together
  - **Finish-to-Finish (FF)**: WO A and B finish together

**Dependency Validation:**
- Warn if dragging creates circular dependency
- Warn if dependent WO scheduled before predecessor
- Auto-suggest reschedule if dependency broken

**Toggle:**
- [Show Dependencies] / [Hide Dependencies] button
- Stored in user preferences

### 6. Quick View Panel (Slide-in)

When WO bar clicked, slide in from right:

```
+---------------------------------------+
|  WO-00156: Chocolate Bar          [X] |
+---------------------------------------+
|  Status: [Planned]                    |
|  Product: FG-CHOC-001                 |
|  Line: Packing #1                     |
|  Machine: None                        |
|                                        |
|  Scheduled:                            |
|  Dec 17, 2024                          |
|  8:00 AM - 4:00 PM (8 hours)           |
|                                        |
|  Quantity: 1,000 pc                    |
|  Priority: Normal                      |
|                                        |
|  Materials:                            |
|  [OK] 3 available                      |
|  [!] 1 low (Sugar Fine)                |
|                                        |
|  Dependencies:                         |
|  → Follows: WO-00155 (Mixing)          |
|  → Precedes: WO-00157 (Packaging)      |
|                                        |
|  [View Full Details]                   |
|  [Edit WO] [Release] [Reschedule]     |
+---------------------------------------+
```

---

## Main Actions

### Primary Actions

| Action | Location | Description |
|--------|----------|-------------|
| **List View** | Header button | Switch to PLAN-013 WO List Page |
| **Settings** | Header button | Open Gantt view settings (swimlane mode, zoom default, colors) |
| **Print** | Header button | Print/export Gantt chart to PDF |
| **Create WO** | Empty state, quick actions | Opens PLAN-014 Create WO modal |

### Bar Actions (Context Menu)

| Action | Visibility | Description |
|--------|------------|-------------|
| **View Details** | Always | Opens PLAN-015 WO Detail page in new tab |
| **Edit** | Status = Draft | Opens PLAN-014 Edit WO modal |
| **Reschedule** | Status != Completed/Closed | Opens reschedule modal (change date/time/line) |
| **Change Line** | Status != Completed/Closed | Quick picker to reassign line |
| **Release** | Status = Planned AND materials ok | Changes status to Released |
| **Start** | Status = Released | Changes status to In Progress |
| **Pause** | Status = In Progress | Changes status to On Hold |
| **Resume** | Status = On Hold | Changes status to In Progress |
| **Complete** | Status = In Progress | Opens completion modal |
| **Cancel** | Status NOT IN (Completed, Closed) | Cancels WO with confirmation |
| **Duplicate** | Always | Creates copy as Draft |

### Drag & Drop Actions

**Desktop:**
1. **Horizontal Drag (Reschedule Date/Time):**
   - User drags WO bar left/right
   - Ghost bar shows during drag
   - Timeline auto-scrolls if near edge
   - Drop validation:
     - Check line availability (no overlapping WOs)
     - Check material availability for new date
     - Warn if dependencies broken
   - Confirmation dialog: "Reschedule WO-00156 to Dec 18, 10:00-18:00?"
   - On confirm: Update scheduled_date, scheduled_start_time, scheduled_end_time

2. **Vertical Drag (Change Line):**
   - User drags WO bar up/down to different swimlane
   - Ghost bar shows during drag
   - Drop validation:
     - Check new line compatibility with product
     - Check line availability at current time slot
     - Warn if line has different machine/capacity
   - Confirmation dialog: "Reassign WO-00156 to Baking #2?"
   - On confirm: Update line_id

3. **Resize (Adjust Duration):**
   - User drags left/right handles on WO bar
   - Duration updates in real-time
   - Validation:
     - Min duration: 1 hour
     - Max duration: 24 hours
     - Warn if overlaps with next WO on same line
   - On release: Update scheduled_end_time

**Mobile (Long-Press):**
- Long-press WO card → Opens action menu
- "Reschedule" → Opens modal with date/time pickers
- "Change Line" → Opens line picker dropdown
- No drag-and-drop (too small, imprecise)

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton swimlanes, skeleton bars, "Loading schedule data..." |
| **Empty** | No WOs scheduled in date range | Empty state illustration, Create WO button, Switch to List View link |
| **Success** | WOs loaded and displayed | Timeline, swimlanes, WO bars, filters, legend, today indicator |
| **Error** | API failure | Error message, retry button, Switch to List View link |
| **Filtered Empty** | Filters return no results | "No WOs match your filters" message, clear filters button |

---

## Data Fields

### Work Order Bar

| Field | Source | Display |
|-------|--------|---------|
| id | work_orders.id | Internal use |
| wo_number | work_orders.wo_number | "WO-00156" (bar label) |
| product_name | products.name via JOIN | "Chocolate Bar" (bar label) |
| product_code | products.code via JOIN | Tooltip/quick view |
| status | work_orders.status | Bar color, border style |
| priority | work_orders.priority | Icon (optional), tooltip |
| quantity | work_orders.quantity + uom | "1,000 pc" (quick view) |
| scheduled_date | work_orders.scheduled_date | Bar position on timeline |
| scheduled_start_time | work_orders.scheduled_start_time | Bar left edge time |
| scheduled_end_time | work_orders.scheduled_end_time | Bar right edge time |
| duration_hours | Calculated: end_time - start_time | Bar width |
| line_id | work_orders.line_id | Swimlane assignment |
| line_name | lines.name via JOIN | Swimlane label |
| machine_id | work_orders.machine_id | Optional, quick view |
| machine_name | machines.name via JOIN | Optional, quick view |
| progress_percent | Calculated | Progress bar overlay (if In Progress) |
| material_status | Calculated | Alert icon [!] if low/insufficient |
| is_overdue | Calculated | scheduled_end_time < now AND status != Completed |
| dependencies | work_order_dependencies table | Arrow lines to other WO bars |

### Swimlane

| Field | Source | Display |
|-------|--------|---------|
| line_id / machine_id | lines / machines table | Swimlane identifier |
| line_name / machine_name | lines.name / machines.name | Swimlane header label |
| capacity_hours_per_day | lines.capacity (optional) | Capacity indicator (optional) |
| wos_count | COUNT(work_orders) WHERE line_id AND date_range | "3 WOs scheduled" |

---

## API Endpoints

### Get Scheduled Work Orders (Gantt Data)

```
GET /api/planning/work-orders/schedule?view_by={line|machine}&from_date={date}&to_date={date}&status[]=planned&status[]=released&line_id={id}&product_id={id}&search={term}

Response:
{
  "success": true,
  "data": {
    "swimlanes": [
      {
        "id": "uuid-line-1",
        "name": "Packing #1",
        "type": "line",
        "capacity_hours_per_day": 16,
        "work_orders": [
          {
            "id": "uuid-wo-156",
            "wo_number": "WO-00156",
            "product": {
              "id": "uuid-choc",
              "code": "FG-CHOC-001",
              "name": "Chocolate Bar"
            },
            "status": "planned",
            "priority": "normal",
            "quantity": 1000,
            "uom": "pc",
            "scheduled_date": "2024-12-17",
            "scheduled_start_time": "08:00",
            "scheduled_end_time": "16:00",
            "duration_hours": 8,
            "progress_percent": 0,
            "material_status": "low",
            "is_overdue": false,
            "dependencies": [
              {
                "predecessor_wo_id": "uuid-wo-155",
                "predecessor_wo_number": "WO-00155",
                "type": "finish_to_start"
              }
            ],
            "created_at": "2024-12-14T09:30:00Z"
          },
          {
            "id": "uuid-wo-160",
            "wo_number": "WO-00160",
            "product": {
              "id": "uuid-cookie",
              "code": "FG-COOK-001",
              "name": "Vanilla Cookie"
            },
            "status": "released",
            "priority": "high",
            "quantity": 500,
            "uom": "kg",
            "scheduled_date": "2024-12-19",
            "scheduled_start_time": "08:00",
            "scheduled_end_time": "12:00",
            "duration_hours": 4,
            "progress_percent": 0,
            "material_status": "ok",
            "is_overdue": false,
            "dependencies": [],
            "created_at": "2024-12-14T10:15:00Z"
          }
        ]
      },
      {
        "id": "uuid-line-2",
        "name": "Baking #2",
        "type": "line",
        "capacity_hours_per_day": 16,
        "work_orders": [
          {
            "id": "uuid-wo-155",
            "wo_number": "WO-00155",
            "product": {
              "id": "uuid-cookie",
              "code": "FG-COOK-001",
              "name": "Vanilla Cookie"
            },
            "status": "in_progress",
            "priority": "normal",
            "quantity": 500,
            "uom": "kg",
            "scheduled_date": "2024-12-16",
            "scheduled_start_time": "08:00",
            "scheduled_end_time": "16:00",
            "duration_hours": 8,
            "progress_percent": 65,
            "material_status": "ok",
            "is_overdue": false,
            "dependencies": [],
            "started_at": "2024-12-16T08:05:00Z"
          }
        ]
      }
    ],
    "date_range": {
      "from_date": "2024-12-16",
      "to_date": "2024-12-20"
    },
    "filters_applied": {
      "view_by": "line",
      "status": ["planned", "released", "in_progress"],
      "line_id": null,
      "product_id": null
    }
  }
}
```

### Reschedule Work Order (Drag & Drop)

```
POST /api/planning/work-orders/{id}/reschedule
Body: {
  "scheduled_date": "2024-12-18",
  "scheduled_start_time": "10:00",
  "scheduled_end_time": "18:00",
  "line_id": "uuid-line-1",  // optional, if changing line
  "validate_dependencies": true,
  "validate_materials": true
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-wo-156",
    "wo_number": "WO-00156",
    "scheduled_date": "2024-12-18",
    "scheduled_start_time": "10:00",
    "scheduled_end_time": "18:00",
    "line_id": "uuid-line-1",
    "line_name": "Packing #1",
    "duration_hours": 8
  },
  "warnings": [
    "Material availability low for Sugar Fine (120 kg available, 150 kg needed)",
    "Dependent WO-00157 may need rescheduling"
  ],
  "conflicts": []
}
```

### Check Line Availability (Pre-Drop Validation)

```
POST /api/planning/work-orders/check-availability
Body: {
  "line_id": "uuid-line-1",
  "scheduled_date": "2024-12-18",
  "scheduled_start_time": "10:00",
  "scheduled_end_time": "18:00",
  "exclude_wo_id": "uuid-wo-156"  // current WO being dragged
}

Response:
{
  "success": true,
  "data": {
    "is_available": true,
    "conflicts": [],  // or list of overlapping WOs
    "capacity_utilization": 0.5,  // 50% of line capacity used
    "warnings": []
  }
}
```

### Get WO Dependencies

```
GET /api/planning/work-orders/{id}/dependencies

Response:
{
  "success": true,
  "data": {
    "predecessors": [
      {
        "id": "uuid-wo-155",
        "wo_number": "WO-00155",
        "product_name": "Chocolate Mix",
        "type": "finish_to_start",
        "scheduled_end_time": "2024-12-16T16:00:00Z"
      }
    ],
    "successors": [
      {
        "id": "uuid-wo-157",
        "wo_number": "WO-00157",
        "product_name": "Chocolate Packaging",
        "type": "finish_to_start",
        "scheduled_start_time": "2024-12-17T16:00:00Z"
      }
    ]
  }
}
```

### Export Gantt Chart to PDF

```
GET /api/planning/work-orders/schedule/export?format=pdf&from_date={date}&to_date={date}&view_by={line|machine}

Response: Binary PDF file download
```

---

## Permissions

| Role | View Gantt | Reschedule WO | Change Line | Release WO | Export PDF | Settings |
|------|------------|---------------|-------------|------------|------------|----------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Manager | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Operator | Yes | Limited (own WOs) | No | Yes | No | No |
| Planner | Yes | Yes | Yes | Yes | Yes | No |
| Viewer | Yes | No | No | No | Yes | No |

---

## Validation

### Drag & Drop Validation

| Rule | Check | Error/Warning |
|------|-------|---------------|
| **Line Availability** | No overlapping WOs on same line at same time | Error: "Line already scheduled for this time slot" |
| **Line Compatibility** | Product can be produced on target line | Warning: "Product not typically produced on this line" |
| **Material Availability** | Materials available for new date | Warning: "X materials below required quantity for new date" |
| **Dependencies** | Predecessors complete before start | Error: "WO-00155 must complete before this WO starts" |
| **Duration** | Min 1 hour, Max 24 hours | Error: "Duration must be between 1-24 hours" |
| **Date Range** | scheduled_date >= today (if not In Progress) | Error: "Cannot schedule in the past" |
| **Status** | Can only reschedule if status allows editing | Error: "Cannot reschedule completed WO" |

---

## Business Rules

### Swimlane Grouping

**By Product Line:**
- One swimlane per production line
- WOs ordered by scheduled_start_time within each line
- Empty swimlanes hidden (configurable in settings)
- Lines sorted alphabetically

**By Machine/Work Center:**
- One swimlane per machine
- WOs assigned to specific machine (optional field)
- If WO has no machine assignment, show in "Unassigned" swimlane
- Machines sorted alphabetically

### WO Bar Positioning

**Horizontal Position:**
- X-axis = time
- Bar left edge = scheduled_start_time
- Bar right edge = scheduled_end_time
- Bar width = (end_time - start_time) / zoom_level_scale

**Vertical Position:**
- Y-axis = swimlane (line or machine)
- Bar Y position = line_id or machine_id
- If multiple WOs overlap on same line/time → Stack vertically with small offset

### Today Indicator

- Vertical line at current date/time
- Color: #EF4444 (red), dashed
- Always on top layer (z-index highest)
- Auto-updates every 60 seconds
- Visible only if today's date within visible timeline range

### Zoom Levels

| Zoom | Time Scale | Visible Days | Hour Markers | WO Label Display |
|------|------------|--------------|--------------|------------------|
| **Day** | Hours (4h increments) | 1-3 days | Every 4 hours | Full: "WO-00156: Chocolate Bar (1000pc)" |
| **Week** | Days | 7-14 days | None (day only) | Truncated: "WO-00156: Choc..." |
| **Month** | Weeks | 30-60 days | None (week only) | Minimal: "WO-156" |

### Overdue Detection

```typescript
function isOverdue(wo: WorkOrder): boolean {
  if (wo.status === 'completed' || wo.status === 'closed') return false;

  const now = new Date();
  const scheduledEnd = new Date(`${wo.scheduled_date}T${wo.scheduled_end_time}`);

  return scheduledEnd < now;
}
```

### Capacity Utilization (Optional)

```typescript
// Calculate line capacity utilization for a day
function getLineCapacity(lineId: string, date: string): {
  total_hours: number;
  scheduled_hours: number;
  utilization_percent: number;
} {
  const line = getLine(lineId);
  const totalHours = line.capacity_hours_per_day || 16; // default 2 shifts

  const wos = getWorkOrders({ line_id: lineId, scheduled_date: date });
  const scheduledHours = wos.reduce((sum, wo) => sum + wo.duration_hours, 0);

  return {
    total_hours: totalHours,
    scheduled_hours: scheduledHours,
    utilization_percent: (scheduledHours / totalHours) * 100
  };
}

// Visual indicator: Show bar under line name
// 0-50%: Green, 50-80%: Yellow, 80-100%: Orange, >100%: Red
```

---

## Accessibility

### Touch Targets
- WO bars: minimum 48x48dp (48px height on desktop, 64px on mobile)
- Zoom buttons: 48x48dp
- Filter dropdowns: 48dp height
- Context menu items: 48dp height
- Swimlane headers: 48dp height (clickable to expand/collapse)

### Contrast
- WO bar text on status backgrounds: 4.5:1 minimum
- Timeline labels: 4.5:1 minimum
- Today indicator line: 3:1 minimum (red on white)
- Status badges in legend: WCAG AA compliant

### Screen Reader
- Gantt chart: role="application" aria-label="Work Order Schedule Gantt Chart"
- Swimlanes: role="rowgroup" aria-label="Production line: {line_name}, {wos_count} work orders scheduled"
- WO bars: role="button" aria-label="Work Order {wo_number}, {product_name}, {status}, scheduled {date} {start_time} to {end_time}, click to view details"
- Timeline header: role="columnheader" aria-label="Timeline: {date_range}"
- Drag & drop: aria-live="assertive" announcements: "Work Order {wo_number} moved to {new_date} {new_time}"
- Today indicator: aria-label="Current date and time indicator"

### Keyboard Navigation
- **Tab**: Move through filters, zoom controls, WO bars (sequential)
- **Arrow keys**: Navigate between WO bars (left/right for time, up/down for swimlanes)
- **Enter**: Open WO detail quick view
- **Space**: Toggle WO selection (for batch actions)
- **Ctrl+Arrow**: Drag & drop reschedule (move WO left/right by 1 hour, up/down by 1 line)
- **Escape**: Close quick view, cancel drag operation
- **Home/End**: Jump to first/last WO in swimlane
- **PageUp/PageDown**: Scroll timeline left/right by one day

### Focus Management
- On page load: Focus on first filter (Status dropdown)
- After drag & drop: Focus returns to dragged WO bar
- After quick view close: Focus returns to WO bar that opened it
- Visual focus indicator: 3px solid blue border on focused element

### ARIA Attributes
- Gantt chart container: role="application" aria-label="Work Order Schedule"
- Swimlanes: role="row" aria-labelledby="swimlane-{id}"
- WO bars: role="button" tabindex="0" aria-describedby="wo-{id}-tooltip"
- Drag handle: aria-grabbed="true|false" during drag
- Drop zones: aria-dropeffect="move" when drag active
- Today indicator: role="separator" aria-label="Today"

---

## Responsive Breakpoints

| Breakpoint | Layout | Changes |
|------------|--------|---------|
| Desktop (>1024px) | Full Gantt chart with drag & drop | All features enabled |
| Tablet (768-1024px) | Condensed Gantt chart, long-press to reschedule | Reduced bar height, simplified labels |
| Mobile (<768px) | List-based timeline OR horizontal scroll Gantt | Card layout preferred, horizontal scroll optional |

### Mobile-Specific Adaptations

**Option 1: List-Based Timeline (Recommended)**
- Swimlanes become collapsible sections
- WO bars become cards within each section
- Sorted by line, then by scheduled_start_time
- Long-press card to open action menu (no drag & drop)
- "Reschedule" opens modal with date/time pickers
- "Change Line" opens dropdown picker

**Option 2: Horizontal Scroll Gantt**
- Simplified Gantt chart with horizontal scroll
- Pinned swimlane names (left column)
- Swipe left/right to scroll timeline
- Tap bar to view details
- Long-press to reschedule (opens modal, no drag)
- Zoom limited to Day/Week (Month too cramped)

**Common Mobile Patterns:**
- Filters collapse into expandable drawer
- Legend shown in modal (tap "Legend" button)
- Quick actions in floating action button (FAB)
- WO detail quick view becomes full-screen modal
- Auto-scroll timeline to today on page load

---

## Performance Notes

### Query Optimization
- Index on: (org_id, line_id, scheduled_date, scheduled_start_time)
- Index on: (org_id, machine_id, scheduled_date, scheduled_start_time)
- Index on: (org_id, scheduled_date, status)
- Composite index: (org_id, line_id, scheduled_date, status)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:planning:schedule:{view_by}:{from_date}:{to_date}:{filters_hash}'  // 2 min TTL
'org:{orgId}:lines:active'                                                       // 5 min TTL
'org:{orgId}:machines:active'                                                    // 5 min TTL
'org:{orgId}:wo:{woId}:dependencies'                                             // 5 min TTL
```

### Load Time Targets
- Initial Gantt load: <1s (for 50 WOs across 5 lines, 7-day range)
- Filter change: <500ms
- Drag & drop validation: <200ms
- Reschedule API call: <800ms
- PDF export: <3s (for 7-day Gantt with 50 WOs)

### Lazy Loading
- **Progressive Rendering**: Load swimlanes sequentially (top to bottom)
- **Viewport Culling**: Only render WO bars in visible timeline range
- **Virtual Scrolling**: For >20 swimlanes, render only visible rows
- **On-Demand Dependencies**: Load dependency arrows only when "Show Dependencies" enabled

### Real-time Updates (WebSocket - Optional)
- **WebSocket Channel**: `planning:org:{orgId}:schedule`
- **Events**:
  - wo.created → Add new bar to Gantt
  - wo.rescheduled → Move bar to new position
  - wo.status_changed → Update bar color
  - wo.progress_updated → Update progress bar overlay
- **Auto-refresh**: Fallback to 60s polling if WebSocket unavailable

---

## Error Handling

### API Errors
- **Gantt Data Fetch Failed**: Show error state, allow retry, fallback to List View
- **Reschedule Failed**: Show error toast, revert drag operation, suggest manual edit
- **Dependency Load Failed**: Hide dependency arrows, show warning toast

### Drag & Drop Errors
- **Line Conflict**: Show error toast "Line already scheduled for this time slot", revert drag
- **Material Shortage**: Show warning dialog "2 materials below required quantity. Proceed?", allow override
- **Dependency Violation**: Show error dialog "WO-00155 must complete before this WO starts", revert drag
- **Invalid Time Range**: Show error toast "Duration must be at least 1 hour", revert drag

### Network Timeout
- **Gantt Data Load**: 8s timeout, retry once on failure
- **Reschedule API**: 5s timeout, retry once on failure
- **Availability Check**: 3s timeout, show warning "Could not validate availability"

---

## Testing Requirements

### Unit Tests
- **WO Bar Positioning**: Calculate correct X/Y position based on scheduled_date/time and line_id
- **Zoom Level Calculations**: Verify time scale and bar width at Day/Week/Month zoom
- **Overdue Detection**: Test isOverdue() for various statuses and dates
- **Capacity Utilization**: Calculate line capacity correctly (total hours, scheduled hours, %)
- **Drag & Drop Validation**: All 7 validation rules (line availability, compatibility, materials, dependencies, duration, date, status)
- **Status Color Mapping**: All 8 statuses render correct colors

### Integration Tests
- **API Endpoint Coverage**: All 5 endpoints (schedule data, reschedule, check availability, dependencies, export PDF)
- **RLS Policy Enforcement**: org_id isolation, no cross-org data leaks
- **Cache Invalidation**: On WO reschedule, update, status change
- **PDF Export Generation**: Valid PDF, correct Gantt rendering, all WOs included
- **Dependency Constraints**: Enforce FS, SS, FF constraints on reschedule

### E2E Tests
- **Page Load (Desktop)**:
  - Success state displays Gantt chart within 1s
  - All swimlanes and WO bars render correctly
  - Today indicator visible if today in range
  - Filters functional
- **Drag & Drop Reschedule (Desktop)**:
  - Drag WO bar right (later date) → Confirmation dialog → API call → Bar moves
  - Drag WO bar down (different line) → Confirmation dialog → API call → Bar moves to new line
  - Drag to conflicting time slot → Error toast → Bar reverts
- **Long-Press Reschedule (Mobile)**:
  - Long-press WO card → Action menu appears
  - Tap "Reschedule" → Modal opens with date/time pickers
  - Submit → API call → Card updates
- **WO Detail Quick View**:
  - Click WO bar → Quick view slides in from right
  - "View Full Details" → Opens PLAN-015 in new tab
  - "Edit WO" → Opens PLAN-014 modal
- **Filters**:
  - Filter by Status "Planned" → Only planned WOs display
  - Filter by Line "Packing #1" → Only Packing #1 swimlane shows
  - Clear filters → All WOs display
- **Zoom Levels**:
  - Day zoom → Hour markers visible, full WO labels
  - Week zoom → Day markers visible, truncated labels
  - Month zoom → Week markers visible, minimal labels
- **Empty State**:
  - No WOs in date range → "No work orders scheduled" message
  - "Create First Work Order" → Opens PLAN-014 modal
- **Error State**:
  - API failure → Error message, retry button, "Switch to List View" link
- **Responsive Behavior**:
  - Desktop: Full Gantt with drag & drop
  - Tablet: Condensed Gantt, long-press to reschedule
  - Mobile: List-based timeline or horizontal scroll Gantt

### Performance Tests
- **Gantt Load Time**: <1s for 50 WOs across 5 lines, 7-day range
- **Drag & Drop Latency**: <200ms for validation + visual feedback
- **Reschedule API Call**: <800ms for update + cache invalidation
- **PDF Export**: <3s for 7-day Gantt with 50 WOs
- **Real-time Update**: <500ms from WebSocket event to UI update

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile with 2 mobile options)
- [x] All API endpoints specified with request/response schemas (5 endpoints)
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (load times, caching, real-time updates)
- [x] Drag & drop interactions documented (Desktop: drag, Mobile: long-press + modal)
- [x] Swimlane grouping modes defined (By Line, By Machine, Custom future)
- [x] WO bar visual design specified (colors, borders, progress, icons)
- [x] Zoom levels defined (Day, Week, Month with time scales)
- [x] Dependencies feature documented (FS, SS, FF constraints, visual arrows)
- [x] Validation rules documented (7 drag & drop validations)
- [x] Business rules documented (positioning, overdue detection, capacity utilization)
- [x] Error handling strategy defined (API errors, drag errors, network timeout)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Work Order Gantt/Schedule View
story: PLAN-016
fr_coverage: FR-PLAN-024 (Could Have feature)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-016-wo-gantt-view.md
  api_endpoints:
    - GET /api/planning/work-orders/schedule
    - POST /api/planning/work-orders/{id}/reschedule
    - POST /api/planning/work-orders/check-availability
    - GET /api/planning/work-orders/{id}/dependencies
    - GET /api/planning/work-orders/schedule/export
states_per_screen: [loading, empty, error, success, filtered_empty]
breakpoints:
  mobile: "<768px (list-based timeline OR horizontal scroll Gantt, long-press actions)"
  tablet: "768-1024px (condensed Gantt, long-press to reschedule)"
  desktop: ">1024px (full Gantt, drag & drop enabled)"
accessibility:
  touch_targets: "48x48dp minimum (64dp mobile)"
  contrast: "4.5:1 minimum (text), 3:1 (status badges)"
  aria_roles: "application, row, rowgroup, button, separator"
  keyboard_nav: "Tab, Arrow keys, Enter, Space, Ctrl+Arrow, Escape, Home/End, PageUp/PageDown"
drag_and_drop:
  desktop: "Horizontal (reschedule date/time), Vertical (change line), Resize (adjust duration)"
  mobile: "Long-press → Action menu → Reschedule modal OR Change line picker"
  validation: "7 rules (line availability, compatibility, materials, dependencies, duration, date, status)"
zoom_levels: 3
  - "Day: Hours (4h increments), 1-3 days visible"
  - "Week: Days, 7-14 days visible"
  - "Month: Weeks, 30-60 days visible"
swimlane_modes: 2
  - "By Product Line (default)"
  - "By Machine/Work Center"
dependencies_support: true
  - "Finish-to-Start (FS)"
  - "Start-to-Start (SS)"
  - "Finish-to-Finish (FF)"
status_colors: 8
real_time_updates:
  websocket_optional: "planning:org:{orgId}:schedule channel"
  fallback_polling: "60s interval"
performance_targets:
  gantt_load: "<1s (50 WOs, 5 lines, 7 days)"
  drag_validation: "<200ms"
  reschedule_api: "<800ms"
  pdf_export: "<3s"
cache_ttl:
  schedule_data: "2min (real-time interactions)"
  lines_machines: "5min (static config)"
  dependencies: "5min (rarely change)"
prd_coverage:
  - "FR-PLAN-024: WO Gantt Chart View (Could Have) ✓"
  - "Section 7.9: Visual Scheduling ✓"
  - "Drag & drop reschedule ✓"
  - "Line/machine swimlanes ✓"
  - "Dependencies (optional) ✓"
related_screens:
  - PLAN-013: WO List Page
  - PLAN-014: WO Create/Edit Modal
  - PLAN-015: WO Detail Page
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 16-20 hours (most complex Planning wireframe - Gantt chart with drag & drop)
**Quality Target**: 97/100
**PRD Coverage**: 100% of FR-PLAN-024 "Could Have" feature (Gantt chart visualization)
**Wireframe Length**: ~1,100 lines (comprehensive, production-ready)

**Implementation Notes:**
- Consider using a Gantt chart library (e.g., DHTMLX Gantt, Frappe Gantt, or custom React implementation)
- Desktop drag & drop is critical UX feature
- Mobile fallback to list-based timeline recommended (more touch-friendly than cramped Gantt)
- Dependencies feature is optional Phase 2 (can defer to reduce complexity)
- Real-time updates via WebSocket enhance collaborative scheduling (optional)
- PDF export useful for printing production schedules (can use html2canvas + jsPDF)
