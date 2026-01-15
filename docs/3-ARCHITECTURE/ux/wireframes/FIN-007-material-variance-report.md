# FIN-007: Material Variance Report

**Module**: Finance (Cost Management)
**Feature**: Material Variance Report (PRD Section FR-9.4.1, FR-9.4.2, FR-FIN-052)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Reports > Material Variance                                             [Export]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters                                                                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Date Range: [2026-01-01]  to  [2026-01-15]     Product: [All Products          v]        |   |
|  |                                                                                            |   |
|  | Work Order: [                          ]       Min Variance %: [5    ]  [Apply Filters]  |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Total Material Variance                      |  | Variance Breakdown                       |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |         +1,550.00 PLN                        |  |  Price Variance   Usage Variance        |   |
|  |         (+6.2% vs standard)                  |  |  +520.00 PLN      +1,030.00 PLN         |   |
|  |                                              |  |  (34%)            (66%)                 |   |
|  |  Unfavorable                                 |  |                                          |   |
|  |  (Higher than standard)                      |  |  [=======|================]              |   |
|  |                                              |  |   Price        Usage                    |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Price Variance (MPV)                         |  | Usage Variance (MQV)                     |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |  Formula:                                    |  |  Formula:                                |   |
|  |  (Actual Price - Std Price) x Actual Qty    |  |  (Actual Qty - Std Qty) x Std Price     |   |
|  |                                              |  |                                          |   |
|  |  Cause: Supplier price increases,           |  |  Cause: Overpour, spillage, yield loss, |   |
|  |  exchange rate changes, quality premiums     |  |  inaccurate BOM quantities               |   |
|  |                                              |  |                                          |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Material Variance by Work Order                                       Showing 1-10 of 45 |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | WO Number   | Product         | Material      | Price Var | Usage Var | Total Var | %    |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | --------- | ---- |   |
|  | WO-2026-042 | Chocolate Bar   | Cocoa Powder  | +50.00    | +110.00   | +160.00   | +8.5%|   |
|  |             |                 | Std: 360.00   | (+4.0%)   | (+6.1%)   |           |      |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | --------- | ---- |   |
|  | WO-2026-042 | Chocolate Bar   | Sugar         | +10.00    | +25.00    | +35.00    | +3.5%|   |
|  |             |                 | Std: 100.00   | (+2.0%)   | (+5.0%)   |           |      |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | --------- | ---- |   |
|  | WO-2026-038 | Cookie Pack     | Flour         | +80.00    | +150.00   | +230.00   | +7.7%|   |
|  |             |                 | Std: 450.00   | (+3.6%)   | (+6.7%)   |           |      |   |
|  | ----------- | --------------- | ------------- | --------- | --------- | --------- | ---- |   |
|  | WO-2026-035 | Bread Loaf      | Yeast         | -5.00     | +8.00     | +3.00     | +2.0%|   |
|  |             |                 | Std: 45.00    | (-2.2%)   | (+3.6%)   |           |      |   |
|  |                                                                                            |   |
|  | [< Previous]  Page 1 of 5  [Next >]                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Top Variance Contributors                                                                  |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Rank | Material        | Total Variance | Price Var | Usage Var | WO Count | % of Total |   |
|  | ---- | --------------- | -------------- | --------- | --------- | -------- | ---------- |   |
|  | 1    | Cocoa Powder    | +420.00 PLN    | +150.00   | +270.00   | 8        | 27.1%      |   |
|  | 2    | Flour           | +350.00 PLN    | +80.00    | +270.00   | 12       | 22.6%      |   |
|  | 3    | Sugar           | +180.00 PLN    | +40.00    | +140.00   | 15       | 11.6%      |   |
|  | 4    | Butter          | +150.00 PLN    | +100.00   | +50.00    | 5        | 9.7%       |   |
|  | 5    | Vanilla Extract | +120.00 PLN    | +80.00    | +40.00    | 10       | 7.7%       |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Material Variance Detail Modal (Drill-Down)

```
+------------------------------------------------------------------+
|  Material Variance Detail - WO-2026-042 / Cocoa Powder     [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Work Order: WO-2026-042 (Chocolate Bar 100g)                     |
|  Material:   Cocoa Powder (PRD-MAT-001)                           |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Variance Summary                                              | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Total Material Variance:  +160.00 PLN (+8.5%)                | |
|  |                                                                | |
|  |  +---------------------------+  +---------------------------+  | |
|  |  | Price Variance (MPV)     |  | Usage Variance (MQV)       |  | |
|  |  |                          |  |                            |  | |
|  |  | +50.00 PLN               |  | +110.00 PLN                |  | |
|  |  | +4.0% (unfavorable)      |  | +6.1% (unfavorable)        |  | |
|  |  +---------------------------+  +---------------------------+  | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Price Variance Calculation                                    | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Standard Price:  12.00 PLN/kg                                 | |
|  | Actual Price:    12.50 PLN/kg (+0.50 difference)              | |
|  | Actual Quantity: 100 kg                                       | |
|  |                                                                | |
|  | MPV = (12.50 - 12.00) x 100 = +50.00 PLN                      | |
|  |                                                                | |
|  | Cause: Supplier price increase (effective 2026-01-10)         | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Usage Variance Calculation                                    | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Standard Quantity: 90.9 kg (30kg/batch x 100 units / 33 bps)  | |
|  | Actual Quantity:   100 kg (+9.1 kg difference)                | |
|  | Standard Price:    12.00 PLN/kg                               | |
|  |                                                                | |
|  | MQV = (100 - 90.9) x 12.00 = +109.20 PLN (rounded to 110)     | |
|  |                                                                | |
|  | Cause: Overpour during mixing operation                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Lot-Level Breakdown                                           | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Lot Number  | Qty Used | Unit Cost | Total Cost | LP Number  | |
|  | ----------- | -------- | --------- | ---------- | ---------- | |
|  | LOT-2026-01 | 50 kg    | 12.00 PLN | 600.00     | LP-00145   | |
|  | LOT-2026-02 | 50 kg    | 13.00 PLN | 650.00     | LP-00152   | |
|  | ----------- | -------- | --------- | ---------- | ---------- | |
|  | Total       | 100 kg   | Avg 12.50 | 1,250.00   |            | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [View Work Order]  [Export Detail]                      [Close]  |
+------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < Material Variance             |
|  [Export]                        |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total Variance             |  |
|  |                            |  |
|  |    +1,550.00 PLN           |  |
|  |    (+6.2% unfavorable)     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Breakdown                  |  |
|  |                            |  |
|  | Price:  +520.00 (34%)      |  |
|  | Usage: +1,030.00 (66%)     |  |
|  +----------------------------+  |
|                                  |
|  [Date Range v] [Product v]      |
|                                  |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | WO-2026-042           [>]  |  |
|  | Chocolate Bar - Cocoa      |  |
|  |                            |  |
|  | Price: +50.00 (+4.0%)      |  |
|  | Usage: +110.00 (+6.1%)     |  |
|  | Total: +160.00 (+8.5%)     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | WO-2026-042           [>]  |  |
|  | Chocolate Bar - Sugar      |  |
|  |                            |  |
|  | Price: +10.00 (+2.0%)      |  |
|  | Usage: +25.00 (+5.0%)      |  |
|  | Total: +35.00 (+3.5%)      |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Reports > Material Variance                                             [Export]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                       [Chart Icon]                                               |
|                                                                                                  |
|                                   No Material Variances Found                                    |
|                                                                                                  |
|                     Material variance analysis requires:                                         |
|                     - Completed work orders with material consumption                            |
|                     - Standard costs defined for materials                                       |
|                                                                                                  |
|                     No variances recorded for the selected period.                               |
|                                                                                                  |
|                                                                                                  |
|                                   [View All Work Orders]                                         |
|                                   [Adjust Date Range]                                            |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Variance Summary Cards

Overview of total material variance with breakdown.

| Card | Content |
|------|---------|
| Total Material Variance | Total variance amount and percentage |
| Variance Breakdown | Price vs Usage split with visual bar |
| Price Variance (MPV) | Explanation and formula |
| Usage Variance (MQV) | Explanation and formula |

### 2. Variance by Work Order Table

Detailed variance breakdown per work order and material.

| Column | Description |
|--------|-------------|
| WO Number | Work order identifier (link to detail) |
| Product | Finished product name |
| Material | Raw material/ingredient |
| Price Var | Price variance (MPV) with percentage |
| Usage Var | Usage variance (MQV) with percentage |
| Total Var | Combined variance |
| % | Total variance as percentage of standard |

### 3. Top Variance Contributors

Ranking of materials by total variance contribution.

| Column | Description |
|--------|-------------|
| Rank | 1-5 or 1-10 |
| Material | Material name |
| Total Variance | Sum of all variances for this material |
| Price Var | Total price variance |
| Usage Var | Total usage variance |
| WO Count | Number of affected work orders |
| % of Total | Contribution to total variance |

### 4. Variance Detail Modal

Deep-dive into specific variance calculation.

| Section | Content |
|---------|---------|
| Variance Summary | Total with MPV/MQV breakdown |
| Price Variance Calculation | Step-by-step formula with values |
| Usage Variance Calculation | Step-by-step formula with values |
| Lot-Level Breakdown | Which lots consumed at what cost |

---

## Variance Calculations

### Material Price Variance (MPV)

```
MPV = (Actual Price - Standard Price) x Actual Quantity

Where:
- Actual Price = Total Material Cost / Actual Quantity
- Standard Price = From standard_costs table
- Actual Quantity = From material_consumption_costs
```

### Material Quantity Variance (MQV)

```
MQV = (Actual Quantity - Standard Quantity) x Standard Price

Where:
- Actual Quantity = Sum of material_consumption
- Standard Quantity = BOM quantity x WO planned quantity
- Standard Price = From standard_costs table
```

### Color Coding

| Variance | Direction | Color |
|----------|-----------|-------|
| Positive | Unfavorable (over) | Red |
| Negative | Favorable (under) | Green |
| Zero | On target | Gray |

---

## API Endpoints

### Get Material Variance Report

```
GET /api/finance/reports/material-variance
Query: ?from_date=2026-01-01&to_date=2026-01-15&product_id=&min_variance_percent=5

Response:
{
  "summary": {
    "total_material_variance": 1550.00,
    "total_price_variance": 520.00,
    "total_usage_variance": 1030.00,
    "variance_percent": 6.2,
    "direction": "unfavorable"
  },
  "by_work_order": [
    {
      "work_order_id": "uuid",
      "work_order_number": "WO-2026-042",
      "product_name": "Chocolate Bar 100g",
      "variances": [
        {
          "material_id": "uuid",
          "material_name": "Cocoa Powder",
          "standard_cost": 360.00,
          "price_variance": {
            "amount": 50.00,
            "percent": 4.0,
            "direction": "unfavorable"
          },
          "usage_variance": {
            "amount": 110.00,
            "percent": 6.1,
            "direction": "unfavorable"
          },
          "total_variance": {
            "amount": 160.00,
            "percent": 8.5
          }
        }
      ]
    }
  ],
  "top_contributors": [
    {
      "material_id": "uuid",
      "material_name": "Cocoa Powder",
      "total_variance": 420.00,
      "price_variance": 150.00,
      "usage_variance": 270.00,
      "work_order_count": 8,
      "percent_of_total": 27.1
    }
  ]
}
```

### Get Material Variance Detail

```
GET /api/finance/work-order-costs/:workOrderId/material-breakdown

Response:
{
  "work_order_id": "uuid",
  "work_order_number": "WO-2026-042",
  "product_name": "Chocolate Bar 100g",
  "summary": {
    "total_material_variance": 195.00,
    "price_variance": 60.00,
    "usage_variance": 135.00
  },
  "items": [
    {
      "material_id": "uuid",
      "material_name": "Cocoa Powder",
      "standard_price": 12.00,
      "actual_price": 12.50,
      "standard_quantity": 90.9,
      "actual_quantity": 100.00,
      "price_variance": 50.00,
      "usage_variance": 110.00,
      "total_variance": 160.00,
      "lots_consumed": [
        {
          "lot_number": "LOT-2026-01",
          "quantity": 50.00,
          "unit_cost": 12.00,
          "total_cost": 600.00,
          "lp_number": "LP-00145"
        }
      ]
    }
  ]
}
```

---

## Business Rules

1. **Variance Calculation Timing**: Calculated on WO completion trigger
2. **Standard Cost Lookup**: Use cost effective on WO start date
3. **Positive = Unfavorable**: Higher actual vs standard
4. **Negative = Favorable**: Lower actual vs standard
5. **Lot Traceability**: Show which lots contributed to actual cost
6. **Root Cause Attribution**: Price (procurement) vs Usage (production)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Material Variance Report
story: FIN-007
prd_coverage: "Finance PRD FR-9.4.1, FR-9.4.2, FR-FIN-052"
  - "Material price variance calculation"
  - "Material usage variance calculation"
  - "Variance decomposition per BOM component"
  - "Lot-level cost tracking"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-007-material-variance-report.md
  api_endpoints:
    - GET /api/finance/reports/material-variance
    - GET /api/finance/work-order-costs/:workOrderId/material-breakdown
states_per_screen: [loading, empty, populated, error]
components:
  - VarianceSummaryCards
  - MaterialVarianceTable
  - TopContributorsTable
  - MaterialVarianceDetailModal
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 6-8 hours
**Wireframe Length**: ~400 lines
