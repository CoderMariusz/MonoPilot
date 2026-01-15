# FIN-009: Real-Time Variance Dashboard

**Module**: Finance (Cost Management)
**Feature**: Real-Time Variance Dashboard (PRD Section FR-FIN-050, FR-FIN-051, FR-FIN-055)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Live Dashboard)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Real-Time Variance Dashboard                    [Last Updated: 2s ago] [Auto-Refresh] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Active Variance Alerts               [3]     |  | Live Variance Monitor                    |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  | [!!] CRITICAL - WO-2026-0042                 |  |  In-Progress Work Orders: 12            |   |
|  |     Material variance +15.2% ($1,250)        |  |  Total Variance to Date: +$3,450        |   |
|  |     Threshold: 10%  |  Triggered: 5 min ago  |  |  Projected Final: +$4,200 (+6.8%)       |   |
|  |     [Acknowledge] [View Details]             |  |                                          |   |
|  |     ---------------------------------------- |  |  Threshold Status:                       |   |
|  |                                              |  |  [!] 3 Critical  [.] 5 Warning  [ ] 4 OK|   |
|  | [!] WARNING - WO-2026-0038                   |  |                                          |   |
|  |     Labor efficiency +8.5% ($340)            |  +------------------------------------------+   |
|  |     Threshold: 10%  |  Triggered: 12 min ago |  |                                          |   |
|  |     [Acknowledge] [View Details]             |  |  +--------------------------------------+ |   |
|  |     ---------------------------------------- |  |  | Variance by Category                 | |   |
|  |                                              |  |  +--------------------------------------+ |   |
|  | [!] WARNING - Cost Center CC-003             |  |  |                                      | |   |
|  |     Overhead variance +6.2% ($180)           |  |  | Material:  +$2,100  (61%)           | |   |
|  |     Threshold: 5%   |  Triggered: 1 hr ago   |  |  | [=======================|      ]    | |   |
|  |     [Acknowledge] [View Details]             |  |  |                                      | |   |
|  |                                              |  |  | Labor:     +$900    (26%)           | |   |
|  | [View All Alerts (7)]                        |  |  | [=========|                    ]    | |   |
|  +----------------------------------------------+  |  |                                      | |   |
|                                                    |  | Overhead:  +$450    (13%)           | |   |
|                                                    |  | [====|                         ]    | |   |
|                                                    |  +--------------------------------------+ |   |
|                                                    +------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Work Order Variance Status (In-Progress)                                                   |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | WO Number   | Product         | Progress | Actual   | Std Cost | Variance | Status | Proj |   |
|  | ----------- | --------------- | -------- | -------- | -------- | -------- | ------ | ---- |   |
|  | WO-2026-042 | Chocolate Bar   | [====|=] | $4,250   | $3,000   | +$1,250  | [!!]   | +18% |   |
|  |             | 75% complete    |          |          |          | +15.2%   |        |      |   |
|  | ----------- | --------------- | -------- | -------- | -------- | -------- | ------ | ---- |   |
|  | WO-2026-041 | Cookie Pack     | [===|==] | $2,100   | $2,000   | +$100    | [!]    | +6%  |   |
|  |             | 60% complete    |          |          |          | +5.0%    |        |      |   |
|  | ----------- | --------------- | -------- | -------- | -------- | -------- | ------ | ---- |   |
|  | WO-2026-040 | Bread Loaf      | [====|=] | $1,800   | $1,850   | -$50     | [OK]   | -3%  |   |
|  |             | 80% complete    |          |          |          | -2.7%    |        |      |   |
|  | ----------- | --------------- | -------- | -------- | -------- | -------- | ------ | ---- |   |
|  | WO-2026-039 | Muffin Pack     | [==|===] | $950     | $900     | +$50     | [!]    | +7%  |   |
|  |             | 40% complete    |          |          |          | +5.6%    |        |      |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Variance Trend (Today - Live)                                                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  |     ^                                                               * Current             |   |
|  |  +5k|                                                              *                      |   |
|  |     |                                          +----+            * |                      |   |
|  |  +3k|                      +------------------+      \          *  |                      |   |
|  |     |         +-----------+                          \--------*   |                      |   |
|  |  +1k|    +---+                                                     |                      |   |
|  |     +----+                                                         |                      |   |
|  |   0 |                                                              |                      |   |
|  |     +----+----+----+----+----+----+----+----+----+----+----+-----+                       |   |
|  |       8am  9am  10am 11am 12pm  1pm  2pm  3pm  4pm  5pm  6pm  Now                        |   |
|  |                                                                                            |   |
|  |     Projected trend continues: +$4,200 by end of shift                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Real-Time Variance Card (Detail for Single WO)

```
+------------------------------------------------------------------+
|  Real-Time Variance - WO-2026-0042                  [Refresh]     |
+------------------------------------------------------------------+
|                                                                    |
|  Chocolate Bar 100g                   Status: In Progress          |
|  Line: Production Line 2              Progress: 75% complete       |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Current Variance Status                     [!!] CRITICAL    | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Actual Cost to Date:      $4,250.00                          | |
|  |  Standard Cost (to date):  $3,000.00                          | |
|  |  Current Variance:         +$1,250.00 (+15.2%)                | |
|  |                                                                | |
|  |  Projected Final Variance: +$1,480.00 (+18.0%)                | |
|  |                                                                | |
|  |  Progress: [============================================|=]    | |
|  |            0%                                          75%  100%| |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Variance Breakdown                                            | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Material Variance:  +$850.00                                  | |
|  |   Price:   +$200.00 (supplier increase)                       | |
|  |   Usage:   +$650.00 (overpour on cocoa)                       | |
|  |                                                                | |
|  | Labor Variance:     +$300.00                                  | |
|  |   Rate:   +$0.00 (on target)                                  | |
|  |   Efficiency: +$300.00 (mixing took 30% longer)               | |
|  |                                                                | |
|  | Overhead Variance:  +$100.00                                  | |
|  |   (follows labor increase)                                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Alert History                                                 | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Time       | Event                      | Threshold           | |
|  | ---------- | -------------------------- | ------------------- | |
|  | 14:32      | Material +15% (CRITICAL)   | Exceeded 10%        | |
|  | 14:10      | Material +8% (WARNING)     | Exceeded 5%         | |
|  | 13:45      | Labor +7% (WARNING)        | Exceeded 5%         | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Last Updated: 2 seconds ago                    [View Full Details]|
+------------------------------------------------------------------+
```

### Variance Threshold Configuration

```
+------------------------------------------------------------------+
|  Variance Threshold Settings                               [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Configure alert thresholds for variance notifications.           |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Material Cost Variance                                        | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Warning Threshold:  [5     ] %                               | |
|  |  Critical Threshold: [10    ] %                               | |
|  |                                                                | |
|  |  [x] Active    [x] Email Notifications                        | |
|  |  Notify: [Finance Manager v] [Production Supervisor v]        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Labor Cost Variance                                           | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Warning Threshold:  [5     ] %                               | |
|  |  Critical Threshold: [10    ] %                               | |
|  |                                                                | |
|  |  [x] Active    [x] Email Notifications                        | |
|  |  Notify: [Finance Manager v] [Production Supervisor v]        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Overhead Cost Variance                                        | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Warning Threshold:  [5     ] %                               | |
|  |  Critical Threshold: [15    ] %                               | |
|  |                                                                | |
|  |  [x] Active    [ ] Email Notifications                        | |
|  |  Notify: [Finance Manager v]                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [Cancel]                                    [Save Thresholds]    |
+------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  Real-Time Variance              |
|  [Last Updated: 2s ago]          |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Alerts (3)           [!!]  |  |
|  +----------------------------+  |
|  |                            |  |
|  | WO-2026-0042 [CRITICAL]    |  |
|  | Material +15.2% ($1,250)   |  |
|  | [View]                     |  |
|  |                            |  |
|  | WO-2026-0038 [WARNING]     |  |
|  | Labor +8.5% ($340)         |  |
|  | [View]                     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Live Monitor               |  |
|  |                            |  |
|  | In-Progress: 12 WOs        |  |
|  | Total Variance: +$3,450    |  |
|  | Projected: +$4,200 (+6.8%) |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | WO Status                  |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | WO-2026-042       [!!]     |  |
|  | Chocolate Bar              |  |
|  | [====|=] 75%               |  |
|  |                            |  |
|  | Variance: +$1,250 (+15.2%) |  |
|  | Projected: +18%            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | WO-2026-041       [!]      |  |
|  | Cookie Pack                |  |
|  | [===|==] 60%               |  |
|  |                            |  |
|  | Variance: +$100 (+5.0%)    |  |
|  | Projected: +6%             |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Active Alerts Panel

Live feed of variance threshold breaches.

| Field | Description |
|-------|-------------|
| Severity | CRITICAL (red) or WARNING (yellow) badge |
| Work Order | WO number or cost center |
| Variance Type | Material, Labor, Overhead |
| Amount | Variance amount and percentage |
| Threshold | Which threshold was breached |
| Time | When alert was triggered |
| Actions | Acknowledge, View Details |

### 2. Live Variance Monitor

Real-time summary of all in-progress work orders.

| Metric | Description |
|--------|-------------|
| In-Progress Count | Number of active work orders |
| Total Variance | Sum of current variances |
| Projected Final | Estimated final variance based on trend |
| Threshold Status | Count by severity (Critical/Warning/OK) |

### 3. Work Order Variance Status Table

Grid of in-progress WOs with live variance data.

| Column | Description |
|--------|-------------|
| WO Number | Work order identifier |
| Product | Product being manufactured |
| Progress | Visual progress bar and percentage |
| Actual | Actual cost to date |
| Std Cost | Standard cost to date |
| Variance | Current variance (amount and %) |
| Status | OK/Warning/Critical badge |
| Proj | Projected final variance % |

### 4. Live Trend Chart

Real-time variance trend visualization.

| Feature | Description |
|---------|-------------|
| Chart Type | Line chart with live updates |
| X-Axis | Time (hourly intervals) |
| Y-Axis | Cumulative variance ($) |
| Update Frequency | Every 5 seconds |
| Projection | Dashed line showing projected trend |

---

## Real-Time Features

### WebSocket Updates

```
// Subscribe to variance updates
ws.subscribe('org:{orgId}:variance:live')

// Message format
{
  "type": "variance_update",
  "work_order_id": "uuid",
  "work_order_number": "WO-2026-0042",
  "current_variance": 1250.00,
  "variance_percent": 15.2,
  "projected_variance": 1480.00,
  "status": "critical",
  "timestamp": "2026-01-15T14:32:15Z"
}
```

### Alert Triggers

| Condition | Action |
|-----------|--------|
| Variance >= Warning % | Create WARNING alert |
| Variance >= Critical % | Create CRITICAL alert |
| Variance drops below | Resolve alert (auto) |
| User acknowledges | Mark as acknowledged |

---

## API Endpoints

### Get Live Variance Dashboard

```
GET /api/finance/dashboard/variance-live

Response:
{
  "summary": {
    "in_progress_count": 12,
    "total_variance": 3450.00,
    "projected_variance": 4200.00,
    "projected_percent": 6.8,
    "by_severity": {
      "critical": 3,
      "warning": 5,
      "ok": 4
    }
  },
  "work_orders": [
    {
      "id": "uuid",
      "number": "WO-2026-0042",
      "product_name": "Chocolate Bar 100g",
      "progress_percent": 75,
      "actual_cost": 4250.00,
      "standard_cost": 3000.00,
      "variance_amount": 1250.00,
      "variance_percent": 15.2,
      "projected_percent": 18.0,
      "status": "critical",
      "last_updated": "2026-01-15T14:32:15Z"
    }
  ],
  "trend": [
    {
      "time": "2026-01-15T08:00:00Z",
      "variance": 200.00
    }
  ],
  "active_alerts": [...],
  "last_updated": "2026-01-15T14:32:17Z"
}
```

### Get Real-Time Variance for WO

```
GET /api/finance/work-order-costs/:workOrderId/realtime

Response:
{
  "work_order_id": "uuid",
  "work_order_number": "WO-2026-0042",
  "product_name": "Chocolate Bar 100g",
  "progress_percent": 75,

  "actual_cost_to_date": 4250.00,
  "standard_cost_to_date": 3000.00,
  "current_variance": 1250.00,
  "current_variance_percent": 15.2,

  "projected_final_cost": 5660.00,
  "projected_final_variance": 1480.00,
  "projected_variance_percent": 18.0,

  "breakdown": {
    "material": {
      "variance": 850.00,
      "price_variance": 200.00,
      "usage_variance": 650.00
    },
    "labor": {
      "variance": 300.00,
      "rate_variance": 0.00,
      "efficiency_variance": 300.00
    },
    "overhead": {
      "variance": 100.00
    }
  },

  "alerts": [...],
  "last_updated": "2026-01-15T14:32:15Z"
}
```

---

## Handoff to FRONTEND-DEV

```yaml
feature: Real-Time Variance Dashboard
story: FIN-009
prd_coverage: "Finance PRD FR-FIN-050, FR-FIN-051, FR-FIN-055"
  - "Real-time variance calculation"
  - "Variance threshold alerts"
  - "Variance trend dashboard"
  - "WebSocket real-time updates"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-009-real-time-variance-dashboard.md
  api_endpoints:
    - GET /api/finance/dashboard/variance-live
    - GET /api/finance/work-order-costs/:workOrderId/realtime
    - GET /api/finance/variance-alerts
    - POST /api/finance/variance-alerts/:id/acknowledge
    - GET/PATCH /api/finance/variance-thresholds
states_per_screen: [loading, empty, populated, error]
real_time:
  websocket: "Subscribe to variance updates"
  refresh_rate: "5 seconds"
  fallback: "Polling every 30 seconds"
components:
  - ActiveAlertsPanel
  - LiveVarianceMonitor
  - WorkOrderVarianceTable
  - VarianceTrendChart
  - RealTimeVarianceCard
  - ThresholdSettingsModal
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 8-10 hours (WebSocket integration)
**Wireframe Length**: ~450 lines
