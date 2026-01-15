# FIN-003: Work Order Cost Summary Card

**Module**: Finance (Cost Management)
**Feature**: WO Cost Summary Card (PRD Section FR-9.3.4, FR-9.3.6)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (On Work Order Detail Page)

```
+--------------------------------------------------------------------------------------------------+
|  Production > Work Orders > WO-2026-0042                                    [Edit] [Complete]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------+  +--------------------------------------------+   |
|  | Work Order Details                        |  | Cost Summary                       [Export]|   |
|  +-------------------------------------------+  +--------------------------------------------+   |
|  |                                           |  |                                            |   |
|  | Product:    Chocolate Bar 100g            |  |  +--------------------------------------+  |   |
|  | Planned:    100 units                     |  |  | Total Cost               [Refresh]  |  |   |
|  | Produced:   85 units                      |  |  |                                      |  |   |
|  | Status:     In Progress                   |  |  |     425.50 PLN                       |  |   |
|  | Line:       Production Line 2             |  |  |     vs Standard: 350.00 PLN         |  |   |
|  |                                           |  |  |     Variance: +75.50 PLN (+21.6%)   |  |   |
|  | Start:      2026-01-15 08:00              |  |  |     [!] OVER BUDGET                  |  |   |
|  | Target End: 2026-01-15 16:00              |  |  +--------------------------------------+  |   |
|  |                                           |  |                                            |   |
|  +-------------------------------------------+  |  Cost per Unit: 5.01 PLN                   |   |
|                                                 |  (Standard: 4.12 PLN)                       |   |
|                                                 |                                            |   |
|                                                 |  +--------------------------------------+  |   |
|                                                 |  | Cost Breakdown                       |  |   |
|                                                 |  +--------------------------------------+  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | Material   255.50 PLN  (60.1%)       |  |   |
|                                                 |  | [==============================|   ] |  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | Labor      110.00 PLN  (25.8%)       |  |   |
|                                                 |  | [=================|              ]   |  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | Overhead    60.00 PLN  (14.1%)       |  |   |
|                                                 |  | [==========|                     ]   |  |   |
|                                                 |  |                                      |  |   |
|                                                 |  +--------------------------------------+  |   |
|                                                 |                                            |   |
|                                                 |  +--------------------------------------+  |   |
|                                                 |  | Variance Breakdown                   |  |   |
|                                                 |  +--------------------------------------+  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | Material Variance:  +45.50 PLN       |  |   |
|                                                 |  |   Price:   +20.00 (supplier)         |  |   |
|                                                 |  |   Usage:   +25.50 (overpour)         |  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | Labor Variance:     +20.00 PLN       |  |   |
|                                                 |  |   Rate:    +0.00 (no change)         |  |   |
|                                                 |  |   Efficiency: +20.00 (slower)        |  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | Overhead Variance:  +10.00 PLN       |  |   |
|                                                 |  |                                      |  |   |
|                                                 |  | [View Detailed Breakdown]            |  |   |
|                                                 |  +--------------------------------------+  |   |
|                                                 |                                            |   |
|                                                 |  Last Updated: 2026-01-15 14:32:15        |   |
|                                                 +--------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Cost Summary Card - Detailed View

```
+--------------------------------------------+
| Cost Summary                       [Export] |
+--------------------------------------------+
|                                            |
|  +--------------------------------------+  |
|  | Total Actual Cost                    |  |
|  |                                      |  |
|  |     425.50 PLN                       |  |
|  |                                      |  |
|  | Standard Cost:     350.00 PLN        |  |
|  | Variance:          +75.50 PLN        |  |
|  | Variance %:        +21.6%            |  |
|  |                                      |  |
|  | Status: [OVER BUDGET] [!]            |  |
|  +--------------------------------------+  |
|                                            |
|  +--------------------------------------+  |
|  | Cost per Unit                        |  |
|  |                                      |  |
|  | Actual:    5.01 PLN/unit             |  |
|  | Standard:  4.12 PLN/unit             |  |
|  | Units:     85 produced               |  |
|  +--------------------------------------+  |
|                                            |
|  +--------------------------------------+  |
|  | Cost Breakdown          %    Amount  |  |
|  +--------------------------------------+  |
|  | Material             60.1%  255.50   |  |
|  | [==============================|  ]  |  |
|  |                                      |  |
|  | Labor                25.8%  110.00   |  |
|  | [=================|             ]    |  |
|  |                                      |  |
|  | Overhead             14.1%   60.00   |  |
|  | [==========|                    ]    |  |
|  +--------------------------------------+  |
|                                            |
|  [View Material Details]                   |
|  [View Labor Details]                      |
|  [View Variance Analysis]                  |
|                                            |
|  Last Updated: 2026-01-15 14:32:15         |
+--------------------------------------------+
```

### Status Indicators

```
+------------------------------------------+
| Cost Status Indicators                    |
+------------------------------------------+
|                                          |
| ON TRACK (Green)                         |
| +--------------------------------------+ |
| | Total Cost: 280.00 PLN               | |
| | Variance: -5.00 PLN (-1.8%)          | |
| | [ON TRACK] [checkmark]               | |
| +--------------------------------------+ |
|                                          |
| WARNING (Yellow)                         |
| +--------------------------------------+ |
| | Total Cost: 365.00 PLN               | |
| | Variance: +15.00 PLN (+4.3%)         | |
| | [WARNING] [!]                        | |
| | "4.3% over standard at current rate" | |
| +--------------------------------------+ |
|                                          |
| OVER BUDGET (Red)                        |
| +--------------------------------------+ |
| | Total Cost: 425.50 PLN               | |
| | Variance: +75.50 PLN (+21.6%)        | |
| | [OVER BUDGET] [!!]                   | |
| | "21.6% over standard - critical"     | |
| +--------------------------------------+ |
|                                          |
| PENDING (Gray)                           |
| +--------------------------------------+ |
| | Total Cost: 0.00 PLN                 | |
| | Status: Pending                      | |
| | "No costs recorded yet"              | |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  WO-2026-0042                    |
|  Chocolate Bar 100g              |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Cost Summary        [Exp]  |  |
|  +----------------------------+  |
|  |                            |  |
|  | Total: 425.50 PLN          |  |
|  | Std:   350.00 PLN          |  |
|  |                            |  |
|  | Variance: +75.50 PLN       |  |
|  | (+21.6%) [OVER BUDGET]     |  |
|  |                            |  |
|  | Unit Cost: 5.01 PLN        |  |
|  | (85 units produced)        |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Breakdown                  |  |
|  +----------------------------+  |
|  | Material: 255.50 (60%)     |  |
|  | [==================|    ]  |  |
|  |                            |  |
|  | Labor:    110.00 (26%)     |  |
|  | [===========|           ]  |  |
|  |                            |  |
|  | Overhead:  60.00 (14%)     |  |
|  | [======|                ]  |  |
|  +----------------------------+  |
|                                  |
|  [View Details]                  |
|                                  |
|  Updated: 14:32:15               |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------+
| Cost Summary                               |
+--------------------------------------------+
|                                            |
|  +--------------------------------------+  |
|  | [====|====|====|====|====|====]     |  |
|  |                                      |  |
|  | [====|====|====|====]               |  |
|  | [====|====|====]                    |  |
|  +--------------------------------------+  |
|                                            |
|  +--------------------------------------+  |
|  | [====|====|====|====|====]          |  |
|  | [====|====|====|====|====|====]     |  |
|  | [====|====|====]                    |  |
|  +--------------------------------------+  |
|                                            |
|  Calculating work order costs...           |
|                                            |
+--------------------------------------------+
```

### Empty State (No Costs Yet)

```
+--------------------------------------------+
| Cost Summary                               |
+--------------------------------------------+
|                                            |
|            [Calculator Icon]               |
|                                            |
|         No Costs Recorded Yet              |
|                                            |
|   Costs will appear automatically as       |
|   materials are consumed and labor         |
|   time is recorded for this work order.    |
|                                            |
|   +------------------------------------+   |
|   | Quick Actions                      |   |
|   +------------------------------------+   |
|   | [Record Material Consumption]      |   |
|   | [Log Labor Time]                   |   |
|   +------------------------------------+   |
|                                            |
|   Status: Pending                          |
|                                            |
+--------------------------------------------+
```

---

## Key Components

### 1. Total Cost Summary

Main cost total with comparison to standard.

| Field | Display | Color Coding |
|-------|---------|--------------|
| Total Actual Cost | Large number (e.g., "425.50 PLN") | Neutral |
| Standard Cost | "vs Standard: 350.00 PLN" | Muted |
| Variance Amount | "+75.50 PLN" or "-10.00 PLN" | Red (unfavorable) / Green (favorable) |
| Variance Percent | "(+21.6%)" | Same as amount |
| Status Badge | ON TRACK / WARNING / OVER BUDGET / PENDING | Green / Yellow / Red / Gray |

### 2. Cost per Unit

Unit economics display.

| Field | Description |
|-------|-------------|
| Actual Unit Cost | Total Cost / Quantity Produced |
| Standard Unit Cost | Standard Cost / Planned Quantity |
| Units Produced | Current production quantity |

### 3. Cost Breakdown

Stacked bar or progress bars showing category proportions.

| Category | Example | Display |
|----------|---------|---------|
| Material | 60.1% | Progress bar + amount |
| Labor | 25.8% | Progress bar + amount |
| Overhead | 14.1% | Progress bar + amount |

### 4. Variance Breakdown (Expanded)

Decomposed variance by category and type.

| Variance | Components | Description |
|----------|------------|-------------|
| Material Variance | Price + Usage | MPV and MQV |
| Labor Variance | Rate + Efficiency | LRV and LEV |
| Overhead Variance | Spending + Volume | Total overhead variance |

---

## Status Logic

### Status Calculation

```
If quantity_produced == 0:
  status = "pending"
Else:
  variance_percent = (actual - standard) / standard * 100

  If variance_percent <= 0:
    status = "on_track"
  Else If variance_percent <= 5:
    status = "on_track"  # Small positive variance OK
  Else If variance_percent <= 10:
    status = "warning"
  Else:
    status = "over_budget"  # Critical
```

### Status Badge Colors

| Status | Background | Text | Icon |
|--------|------------|------|------|
| On Track | Green-100 | Green-800 | Checkmark |
| Warning | Yellow-100 | Yellow-800 | Warning triangle |
| Over Budget | Red-100 | Red-800 | Exclamation |
| Pending | Gray-100 | Gray-600 | Clock |

---

## Main Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Export | Card header [Export] | Download cost summary as CSV |
| Refresh | Card header [Refresh] | Recalculate costs |
| View Material Details | Link | Navigate to material breakdown |
| View Labor Details | Link | Navigate to labor breakdown |
| View Variance Analysis | Link | Navigate to variance drill-down |

---

## States

### Loading State
- Skeleton placeholders for all metrics
- "Calculating work order costs..." text
- Spinner on total cost section

### Empty State
- Calculator illustration
- "No Costs Recorded Yet" headline
- Explanation about automatic cost tracking
- Quick action buttons for recording costs
- Status: Pending

### Populated State
- All cost metrics displayed
- Color-coded status badge
- Variance breakdown available
- Last updated timestamp

### Error State
- Warning icon
- "Failed to load costs" message
- [Retry] button
- Last known values displayed (if cached)

---

## API Endpoints

### Get WO Cost Summary

```
GET /api/finance/work-order-costs/:workOrderId

Response:
{
  "work_order_id": "uuid",
  "work_order_number": "WO-2026-0042",
  "product_id": "uuid",
  "product_name": "Chocolate Bar 100g",

  "material_cost_actual": 255.50,
  "labor_cost_actual": 110.00,
  "overhead_cost_actual": 60.00,
  "total_cost_actual": 425.50,

  "material_cost_standard": 210.00,
  "labor_cost_standard": 90.00,
  "overhead_cost_standard": 50.00,
  "total_cost_standard": 350.00,

  "material_variance": 45.50,
  "labor_variance": 20.00,
  "overhead_variance": 10.00,
  "total_variance": 75.50,

  "quantity_planned": 100,
  "quantity_produced": 85,

  "unit_cost_actual": 5.01,
  "unit_cost_standard": 4.12,

  "currency_code": "PLN",
  "status": "calculated",
  "last_calculated_at": "2026-01-15T14:32:15Z",

  "cost_breakdown": {
    "material_percent": 60.1,
    "labor_percent": 25.8,
    "overhead_percent": 14.1
  },

  "cost_status": {
    "status": "over_budget",
    "message": "21.6% over standard - critical",
    "color": "red"
  }
}
```

---

## Business Rules

1. **Real-Time Updates**: Cost summary auto-updates when material consumption or labor is recorded (via database trigger)
2. **Unit Cost Calculation**: Only calculated when quantity_produced > 0 to avoid division by zero
3. **Variance Direction**: Positive variance = unfavorable (over budget), Negative = favorable (under budget)
4. **Status Thresholds**: Configurable per organization in finance_settings
5. **Cost Lock**: Costs locked after WO completion (status = completed)
6. **Currency Consistency**: All costs displayed in organization base currency

---

## Accessibility

### Touch Targets
- Export button: 48x48dp
- View Details links: 48x48dp
- Refresh button: 48x48dp

### Contrast
- Cost values: 4.5:1 against card background
- Status badges: 4.5:1 with appropriate text colors
- Progress bars: Distinguishable colors

### Screen Reader
- **Card**: `role="region"` `aria-label="Work order cost summary showing total cost 425.50 PLN, 21.6% over budget"`
- **Status badge**: `aria-label="Cost status: Over Budget"`
- **Breakdown bars**: `aria-label="Material cost 60.1%, 255.50 PLN"`

---

## Handoff to FRONTEND-DEV

```yaml
feature: Work Order Cost Summary Card
story: FIN-003
prd_coverage: "Finance PRD FR-9.3.4, FR-9.3.6"
  - "Actual vs standard cost comparison"
  - "Cost breakdown by category"
  - "Variance analysis"
  - "Unit cost calculation"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-003-wo-cost-summary-card.md
  api_endpoints:
    - GET /api/finance/work-order-costs/:workOrderId
    - POST /api/finance/work-order-costs/:workOrderId/recalculate
    - GET /api/finance/work-order-costs/:workOrderId/export
states_per_screen: [loading, empty, populated, error]
components:
  - WOCostSummaryCard
  - CostBreakdownBar
  - CostStatusBadge
  - VarianceBreakdownPanel
integration:
  - Embed in Work Order Detail Page (/production/work-orders/[id])
  - Real-time updates via WebSocket or polling
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 4-6 hours
**Wireframe Length**: ~350 lines
