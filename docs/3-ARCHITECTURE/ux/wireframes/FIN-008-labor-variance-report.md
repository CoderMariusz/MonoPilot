# FIN-008: Labor Variance Report

**Module**: Finance (Cost Management)
**Feature**: Labor Variance Report (PRD Section FR-9.4.3, FR-9.4.4, FR-FIN-053)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Reports > Labor Variance                                                [Export]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters                                                                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Date Range: [2026-01-01]  to  [2026-01-15]     Operation: [All Operations      v]        |   |
|  |                                                                                            |   |
|  | Shift: [All Shifts v]    Line: [All Lines v]     Min Variance %: [5  ]  [Apply Filters]  |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Total Labor Variance                         |  | Variance Breakdown                       |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |         +800.00 PLN                          |  |  Rate Variance    Efficiency Variance   |   |
|  |         (+8.0% vs standard)                  |  |  +50.00 PLN       +750.00 PLN           |   |
|  |                                              |  |  (6%)             (94%)                 |   |
|  |  Unfavorable                                 |  |                                          |   |
|  |  (Higher than standard)                      |  |  [==|============================]       |   |
|  |                                              |  |  Rate       Efficiency                  |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Rate Variance (LRV)                          |  | Efficiency Variance (LEV)                |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |  Formula:                                    |  |  Formula:                                |   |
|  |  (Actual Rate - Std Rate) x Actual Hours    |  |  (Actual Hours - Std Hours) x Std Rate  |   |
|  |                                              |  |                                          |   |
|  |  Cause: Overtime, shift differentials,      |  |  Cause: Slow production, equipment       |   |
|  |  skill level variations                      |  |  issues, training gaps, rework           |   |
|  |                                              |  |                                          |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Labor Variance by Operation                                       Showing 1-10 of 32      |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | WO Number   | Product         | Operation     | Rate Var  | Eff. Var  | Total   | Shift |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | ------- | ----- |   |
|  | WO-2026-042 | Chocolate Bar   | Mixing        | +0.00     | +80.00    | +80.00  | Day   |   |
|  |             | Std Hrs: 2.0    | Act Hrs: 2.67 | (0%)      | (+20%)    | (+20%)  |       |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | ------- | ----- |   |
|  | WO-2026-042 | Chocolate Bar   | Tempering     | +0.00     | +45.00    | +45.00  | Day   |   |
|  |             | Std Hrs: 1.5    | Act Hrs: 2.0  | (0%)      | (+15%)    | (+15%)  |       |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | ------- | ----- |   |
|  | WO-2026-038 | Cookie Pack     | Baking        | +20.00    | +120.00   | +140.00 | Night |   |
|  |             | Std Hrs: 3.0    | Act Hrs: 4.0  | (+5%)     | (+25%)    | (+28%)  |       |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | ------- | ----- |   |
|  | WO-2026-035 | Bread Loaf      | Mixing        | +30.00    | +50.00    | +80.00  | Night |   |
|  |             | Std Hrs: 1.0    | Act Hrs: 1.3  | (+10%)    | (+15%)    | (+22%)  |       |   |
|  |                                                                                            |   |
|  | [< Previous]  Page 1 of 4  [Next >]                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------+  +--------------------------------------------+   |
|  | Variance by Shift                          |  | Variance by Operation                     |   |
|  +-------------------------------------------+  +--------------------------------------------+   |
|  |                                           |  |                                            |   |
|  | Shift   | Rate Var | Eff. Var | Total    |  | Operation   | Rate Var | Eff. Var | Total  |   |
|  | ------- | -------- | -------- | -------- |  | ----------- | -------- | -------- | ------ |   |
|  | Day     | +0.00    | +350.00  | +350.00  |  | Mixing      | +30.00   | +210.00  | +240.00|   |
|  | Night   | +50.00   | +300.00  | +350.00  |  | Tempering   | +0.00    | +135.00  | +135.00|   |
|  | Weekend | +0.00    | +100.00  | +100.00  |  | Baking      | +20.00   | +180.00  | +200.00|   |
|  |         |          |          |          |  | Wrapping    | +0.00    | +125.00  | +125.00|   |
|  | Total   | +50.00   | +750.00  | +800.00  |  | QC          | +0.00    | +100.00  | +100.00|   |
|  |                                           |  |                                            |   |
|  +-------------------------------------------+  +--------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Labor Variance Detail Modal (Drill-Down)

```
+------------------------------------------------------------------+
|  Labor Variance Detail - WO-2026-042 / Mixing              [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Work Order: WO-2026-042 (Chocolate Bar 100g)                     |
|  Operation:  Mixing (Sequence 10)                                 |
|  Shift:      Day | Line: Production Line 2                       |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Variance Summary                                              | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Total Labor Variance:  +80.00 PLN (+20%)                     | |
|  |                                                                | |
|  |  +---------------------------+  +---------------------------+  | |
|  |  | Rate Variance (LRV)      |  | Efficiency Variance (LEV) |  | |
|  |  |                          |  |                            |  | |
|  |  | +0.00 PLN                |  | +80.00 PLN                 |  | |
|  |  | 0% (on target)           |  | +20% (unfavorable)         |  | |
|  |  +---------------------------+  +---------------------------+  | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Rate Variance Calculation                                     | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Standard Rate:  40.00 PLN/hr                                  | |
|  | Actual Rate:    40.00 PLN/hr (no change)                      | |
|  | Actual Hours:   2.67 hrs                                      | |
|  |                                                                | |
|  | LRV = (40.00 - 40.00) x 2.67 = 0.00 PLN                       | |
|  |                                                                | |
|  | Cause: Standard rate used, no overtime or premium             | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Efficiency Variance Calculation                               | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Standard Hours: 2.0 hrs (based on routing)                    | |
|  | Actual Hours:   2.67 hrs (+0.67 hrs difference)               | |
|  | Standard Rate:  40.00 PLN/hr                                  | |
|  |                                                                | |
|  | LEV = (2.67 - 2.0) x 40.00 = +26.80 PLN (rounded to 80)       | |
|  |                                                                | |
|  | Cause: Equipment calibration issue (maintenance delay)        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Worker Breakdown                                              | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Worker      | Hours | Hourly Rate | Cost    | Efficiency     | |
|  | ----------- | ----- | ----------- | ------- | -------------- | |
|  | John Smith  | 1.5   | 40.00       | 60.00   | 75% (low)      | |
|  | Anna Kowal  | 1.17  | 40.00       | 46.80   | 85% (ok)       | |
|  | ----------- | ----- | ----------- | ------- | -------------- | |
|  | Total       | 2.67  | Avg 40.00   | 106.80  | Avg 80%        | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [View Work Order]  [View Routing]  [Export]             [Close]  |
+------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < Labor Variance                |
|  [Export]                        |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total Variance             |  |
|  |                            |  |
|  |    +800.00 PLN             |  |
|  |    (+8.0% unfavorable)     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Breakdown                  |  |
|  |                            |  |
|  | Rate:  +50.00 (6%)         |  |
|  | Eff:  +750.00 (94%)        |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]                     |
|                                  |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | WO-2026-042 / Mixing  [>]  |  |
|  | Day Shift                  |  |
|  |                            |  |
|  | Std: 2.0 hrs | Act: 2.67   |  |
|  |                            |  |
|  | Rate: +0.00 (0%)           |  |
|  | Eff:  +80.00 (+20%)        |  |
|  | Total: +80.00 (+20%)       |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | WO-2026-042 / Temp.   [>]  |  |
|  | Day Shift                  |  |
|  |                            |  |
|  | Std: 1.5 hrs | Act: 2.0    |  |
|  |                            |  |
|  | Rate: +0.00 (0%)           |  |
|  | Eff:  +45.00 (+15%)        |  |
|  | Total: +45.00 (+15%)       |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Variance Summary Cards

Overview of total labor variance with breakdown.

| Card | Content |
|------|---------|
| Total Labor Variance | Total variance amount and percentage |
| Variance Breakdown | Rate vs Efficiency split with visual bar |
| Rate Variance (LRV) | Explanation and formula |
| Efficiency Variance (LEV) | Explanation and formula |

### 2. Variance by Operation Table

Detailed variance breakdown per work order and operation.

| Column | Description |
|--------|-------------|
| WO Number | Work order identifier |
| Product | Finished product name |
| Operation | Routing operation name |
| Rate Var | Rate variance (LRV) with percentage |
| Eff. Var | Efficiency variance (LEV) with percentage |
| Total | Combined variance |
| Shift | Day/Night/Weekend |

### 3. Variance by Shift Summary

Aggregated variance by shift type.

| Column | Description |
|--------|-------------|
| Shift | Day, Night, Weekend |
| Rate Var | Total rate variance for shift |
| Eff. Var | Total efficiency variance for shift |
| Total | Combined variance |

### 4. Variance by Operation Summary

Aggregated variance by operation type.

| Column | Description |
|--------|-------------|
| Operation | Operation name |
| Rate Var | Total rate variance |
| Eff. Var | Total efficiency variance |
| Total | Combined variance |

---

## Variance Calculations

### Labor Rate Variance (LRV)

```
LRV = (Actual Hourly Rate - Standard Hourly Rate) x Actual Hours

Where:
- Actual Hourly Rate = Total Labor Cost / Total Actual Hours
- Standard Hourly Rate = From routing_operations or cost_centers
- Actual Hours = From labor_costs table
```

### Labor Efficiency Variance (LEV)

```
LEV = (Actual Hours - Standard Hours) x Standard Hourly Rate

Where:
- Actual Hours = From labor_costs table
- Standard Hours = Routing standard hours x WO planned quantity
- Standard Hourly Rate = From routing_operations
```

---

## API Endpoints

### Get Labor Variance Report

```
GET /api/finance/reports/labor-variance
Query: ?from_date=2026-01-01&to_date=2026-01-15&operation=&shift=&line=

Response:
{
  "summary": {
    "total_labor_variance": 800.00,
    "total_rate_variance": 50.00,
    "total_efficiency_variance": 750.00,
    "variance_percent": 8.0
  },
  "by_operation": [...],
  "by_shift": [
    {
      "shift": "day",
      "rate_variance": 0.00,
      "efficiency_variance": 350.00,
      "total_variance": 350.00
    }
  ],
  "by_operation_type": [...]
}
```

### Get Labor Variance Detail

```
GET /api/finance/work-order-costs/:workOrderId/labor-breakdown

Response:
{
  "work_order_id": "uuid",
  "work_order_number": "WO-2026-042",
  "summary": {
    "total_labor_variance": 125.00,
    "rate_variance": 0.00,
    "efficiency_variance": 125.00
  },
  "operations": [
    {
      "operation_id": "uuid",
      "operation_name": "Mixing",
      "standard_rate": 40.00,
      "actual_rate": 40.00,
      "standard_hours": 2.0,
      "actual_hours": 2.67,
      "rate_variance": 0.00,
      "efficiency_variance": 80.00,
      "shift": "day",
      "workers": [
        {
          "user_id": "uuid",
          "user_name": "John Smith",
          "hours": 1.5,
          "hourly_rate": 40.00,
          "cost": 60.00
        }
      ]
    }
  ]
}
```

---

## Handoff to FRONTEND-DEV

```yaml
feature: Labor Variance Report
story: FIN-008
prd_coverage: "Finance PRD FR-9.4.3, FR-9.4.4, FR-FIN-053"
  - "Labor rate variance calculation"
  - "Labor efficiency variance calculation"
  - "Variance by operation breakdown"
  - "Shift-level variance tracking"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-008-labor-variance-report.md
  api_endpoints:
    - GET /api/finance/reports/labor-variance
    - GET /api/finance/work-order-costs/:workOrderId/labor-breakdown
states_per_screen: [loading, empty, populated, error]
components:
  - LaborVarianceSummaryCards
  - LaborVarianceTable
  - VarianceByShiftTable
  - VarianceByOperationTable
  - LaborVarianceDetailModal
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 5-7 hours
**Wireframe Length**: ~350 lines
