# FIN-010: Variance Drill-Down Page

**Module**: Finance (Cost Management)
**Feature**: Variance Drill-Down (PRD Section FR-FIN-054, FR-FIN-056)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Multi-Dimensional Analysis)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Variance Drill-Down Analysis                                            [Export]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Dimension Selector                                                                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Analyze By:  [Product]  [Line]  [Shift]  [Cost Center]                                    |   |
|  |                Selected                                                                    |   |
|  |                                                                                            |   |
|  | Date Range: [2026-01-01]  to  [2026-01-15]     Variance Type: [All Types       v]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Variance by Product                                                    Showing 1-15 of 42 |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Rank | SKU       | Product           | Total Var  | Mat Var | Lab Var | OH Var | Contrib |   |
|  | ---- | --------- | ----------------- | ---------- | ------- | ------- | ------ | ------- |   |
|  | 1    | PRD-001   | Chocolate Bar     | +$5,234    | +$3,500 | +$1,234 | +$500  | 35.2%   |   |
|  |      |           | 12 WOs            | +12.5%     | +15.0%  | +8.0%   | +10%   |         |   |
|  | ---- | --------- | ----------------- | ---------- | ------- | ------- | ------ | ------- |   |
|  | 2    | PRD-005   | Cookie Pack       | +$2,890    | +$2,100 | +$590   | +$200  | 19.4%   |   |
|  |      |           | 8 WOs             | +8.2%      | +9.5%   | +5.0%   | +6%    |         |   |
|  | ---- | --------- | ----------------- | ---------- | ------- | ------- | ------ | ------- |   |
|  | 3    | PRD-010   | Bread Loaf        | +$1,450    | +$850   | +$450   | +$150  | 9.8%    |   |
|  |      |           | 15 WOs            | +5.8%      | +6.0%   | +5.0%   | +5%    |         |   |
|  | ---- | --------- | ----------------- | ---------- | ------- | ------- | ------ | ------- |   |
|  | 4    | PRD-015   | Cake Slice        | +$1,120    | +$700   | +$320   | +$100  | 7.5%    |   |
|  |      |           | 6 WOs             | +6.2%      | +7.0%   | +4.5%   | +5%    |         |   |
|  | ---- | --------- | ----------------- | ---------- | ------- | ------- | ------ | ------- |   |
|  | 5    | PRD-020   | Muffin Pack       | -$340      | -$200   | -$100   | -$40   | -2.3%   |   |
|  |      |           | 10 WOs            | -2.1%      | -2.5%   | -1.5%   | -1%    | (fav)   |   |
|  |                                                                                            |   |
|  | [< Previous]  Page 1 of 3  [Next >]                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Product Variance Trend (Selected: PRD-001)   |  | BOM Component Variance (PRD-001)         |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |     ^                                        |  |  Component      | Variance  | % of Prod |   |
|  |  +6k|     +                                  |  |  -------------- | --------- | --------- |   |
|  |     |    + +                                 |  |  Cocoa Powder   | +$1,800   | 51.4%     |   |
|  |  +4k|   +   +    +                           |  |  Sugar          | +$650     | 18.6%     |   |
|  |     |  +     +  + +                          |  |  Milk Powder    | +$450     | 12.9%     |   |
|  |  +2k| +       ++   +                         |  |  Packaging      | +$350     | 10.0%     |   |
|  |     |+              ++                       |  |  Other          | +$250     | 7.1%      |   |
|  |   0 +----------------+                       |  |  -------------- | --------- | --------- |   |
|  |     Jan 1     Jan 8     Jan 15              |  |  Total (Mat)    | +$3,500   | 100%      |   |
|  |                                              |  |                                          |   |
|  | [View Work Orders Contributing to Variance] |  | [View Component Details]                 |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Drill-Down by Production Line

```
+--------------------------------------------------------------------------------------------------+
|  Variance by Production Line                                                                     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Line Comparison                              |  | Shift Breakdown - Line 2                 |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  | Line    | Total Var | Mat Var | Lab Var | % |  |  Shift   | Rate Var | Eff Var | Total   |   |
|  | ------- | --------- | ------- | ------- | - |  |  ------- | -------- | ------- | ------- |   |
|  | Line 1  | +$2,500   | +$1,800 | +$700   | +4|  |  Day     | +$0      | +$850   | +$850   |   |
|  | Line 2  | +$4,200   | +$2,800 | +$1,400 | +8|  |  Night   | +$150    | +$450   | +$600   |   |
|  | Line 3  | +$1,800   | +$1,200 | +$600   | +5|  |  Weekend | +$0      | +$250   | +$250   |   |
|  | Packing | +$500     | +$400   | +$100   | +2|  |  ------- | -------- | ------- | ------- |   |
|  |         |           |         |         |   |  |  Total   | +$150    | +$1,550 | +$1,700 |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Line 2 - Efficiency Metrics                                                                |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Operation      | Std Hours | Act Hours | Efficiency | Variance | Impact                   |   |
|  | -------------- | --------- | --------- | ---------- | -------- | ------------------------ |   |
|  | Mixing         | 120 hrs   | 145 hrs   | 82.8%      | +$1,000  | Equipment issues         |   |
|  | Tempering      | 80 hrs    | 88 hrs    | 90.9%      | +$320    | New operator training    |   |
|  | Molding        | 60 hrs    | 63 hrs    | 95.2%      | +$120    | Within tolerance         |   |
|  | Wrapping       | 40 hrs    | 42 hrs    | 95.2%      | +$80     | Within tolerance         |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Drill-Down by Shift

```
+--------------------------------------------------------------------------------------------------+
|  Variance by Shift                                                                               |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Shift Comparison                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  |     Day Shift              Night Shift             Weekend Shift                          |   |
|  |     +$4,500                +$3,200                 +$1,300                                |   |
|  |     +5.5%                  +7.8%                   +4.2%                                  |   |
|  |                                                                                            |   |
|  |     [=========|    ]       [=======|     ]         [====|       ]                         |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Night Shift - Labor Variance Detail          |  | Night Shift - Overtime Impact            |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  | Rate Variance:      +$580                    |  |  Regular Hours:    180 hrs               |   |
|  |   (Overtime premium)                         |  |  Overtime Hours:   45 hrs                |   |
|  |                                              |  |  Overtime Rate:    1.5x                  |   |
|  | Efficiency Variance: +$2,620                 |  |                                          |   |
|  |   (Slower production)                        |  |  Overtime Cost Impact: +$900             |   |
|  |                                              |  |  (accounts for 28% of variance)          |   |
|  | Top Issues:                                  |  |                                          |   |
|  | - Equipment downtime (45 min avg)            |  |  Recommendation:                         |   |
|  | - Reduced visibility (quality checks)        |  |  Review staffing levels for night shift  |   |
|  | - Lower experience level                     |  |                                          |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Work Orders by Shift                                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | WO Number   | Product         | Shift   | Variance | Rate Var | Eff Var | Status         |   |
|  | ----------- | --------------- | ------- | -------- | -------- | ------- | -------------- |   |
|  | WO-2026-042 | Chocolate Bar   | Night   | +$650    | +$80     | +$570   | Completed      |   |
|  | WO-2026-038 | Cookie Pack     | Night   | +$420    | +$50     | +$370   | Completed      |   |
|  | WO-2026-035 | Bread Loaf      | Night   | +$380    | +$0      | +$380   | Completed      |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Overhead Variance Breakdown

```
+------------------------------------------------------------------+
|  Overhead Variance Breakdown                                       |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Overhead Variance Summary                                     | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Total Overhead Variance: +$1,450                             | |
|  |                                                                | |
|  |  Spending Variance:  +$650  (over budget on overhead costs)   | |
|  |  Volume Variance:    +$800  (lower activity than planned)     | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | By Cost Center                                                | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Cost Center      | Spending | Volume  | Total   | Alloc Basis | |
|  | ---------------- | -------- | ------- | ------- | ----------- | |
|  | Production OH    | +$400    | +$500   | +$900   | Labor Hrs   | |
|  | Utilities        | +$150    | +$200   | +$350   | Machine Hrs | |
|  | Maintenance      | +$100    | +$100   | +$200   | Labor Hrs   | |
|  | Quality Control  | +$0      | +$0     | +$0     | Units       | |
|  | ---------------- | -------- | ------- | ------- | ----------- | |
|  | Total            | +$650    | +$800   | +$1,450 |             | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Spending Variance = Actual OH - Budgeted OH                      |
|  Volume Variance = Budgeted OH - Applied OH                       |
|  Applied OH = Rate x Actual Activity                              |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < Variance Drill-Down           |
|  [Export]                        |
+----------------------------------+
|                                  |
|  Analyze By:                     |
|  [Product v]                     |
|                                  |
|  [Date Range v] [Type v]         |
|                                  |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | #1 PRD-001            [>]  |  |
|  | Chocolate Bar              |  |
|  |                            |  |
|  | Total: +$5,234 (+12.5%)    |  |
|  | Mat: +$3,500               |  |
|  | Lab: +$1,234               |  |
|  | OH:  +$500                 |  |
|  |                            |  |
|  | 12 WOs | 35.2% contrib     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | #2 PRD-005            [>]  |  |
|  | Cookie Pack                |  |
|  |                            |  |
|  | Total: +$2,890 (+8.2%)     |  |
|  | Mat: +$2,100               |  |
|  | Lab: +$590                 |  |
|  | OH:  +$200                 |  |
|  |                            |  |
|  | 8 WOs | 19.4% contrib      |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | #3 PRD-010            [>]  |  |
|  | Bread Loaf                 |  |
|  |                            |  |
|  | Total: +$1,450 (+5.8%)     |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Dimension Selector

Toggle between different drill-down perspectives.

| Dimension | Description |
|-----------|-------------|
| Product | Variance grouped by product/SKU |
| Line | Variance grouped by production line |
| Shift | Variance grouped by shift (Day/Night/Weekend) |
| Cost Center | Variance grouped by cost center (overhead) |

### 2. Variance by Product Table

Product-level variance ranking.

| Column | Description |
|--------|-------------|
| Rank | Position by absolute variance |
| SKU | Product code |
| Product | Product name |
| Total Var | Combined variance |
| Mat Var | Material variance |
| Lab Var | Labor variance |
| OH Var | Overhead variance |
| Contrib | % contribution to total |

### 3. Product Variance Trend Chart

Daily variance trend for selected product.

| Feature | Description |
|---------|-------------|
| Chart Type | Line chart |
| X-Axis | Date (daily) |
| Y-Axis | Variance amount |
| Interaction | Click data point to drill to specific date |

### 4. BOM Component Variance

Material breakdown for selected product.

| Column | Description |
|--------|-------------|
| Component | Ingredient/packaging name |
| Variance | Variance amount |
| % of Prod | Percentage of product's material variance |

### 5. Line Comparison Table

Production line variance comparison.

| Column | Description |
|--------|-------------|
| Line | Production line name |
| Total Var | Combined variance |
| Mat Var | Material variance |
| Lab Var | Labor variance |
| % | Variance as percentage |

### 6. Shift Breakdown Table

Shift-level variance decomposition.

| Column | Description |
|--------|-------------|
| Shift | Day/Night/Weekend |
| Rate Var | Labor rate variance |
| Eff Var | Labor efficiency variance |
| Total | Combined variance |

### 7. Overhead Variance Breakdown

Spending vs Volume variance by cost center.

| Column | Description |
|--------|-------------|
| Cost Center | Cost center name |
| Spending | Spending variance |
| Volume | Volume variance |
| Total | Combined overhead variance |
| Alloc Basis | Allocation basis used |

---

## API Endpoints

### Get Variance by Product

```
GET /api/finance/reports/variance-by-product
Query: ?dateFrom=2026-01-01&dateTo=2026-01-15

Response:
{
  "products": [
    {
      "product_id": "uuid",
      "sku": "PRD-001",
      "product_name": "Chocolate Bar 100g",
      "work_order_count": 12,
      "total_variance": 5234.00,
      "variance_percent": 12.5,
      "material_variance": 3500.00,
      "labor_variance": 1234.00,
      "overhead_variance": 500.00,
      "contribution_percent": 35.2
    }
  ],
  "pagination": {...}
}
```

### Get Product Variance Details

```
GET /api/finance/reports/variance-by-product/:productId/details
Query: ?dateFrom=2026-01-01&dateTo=2026-01-15

Response:
{
  "product_id": "uuid",
  "product_name": "Chocolate Bar 100g",
  "variance_trend": [
    {"date": "2026-01-01", "variance": 250.00}
  ],
  "work_orders": [
    {"id": "uuid", "number": "WO-2026-042", "variance": 650.00}
  ],
  "bom_components": [
    {"material_id": "uuid", "name": "Cocoa Powder", "variance": 1800.00}
  ]
}
```

### Get Overhead Variance

```
GET /api/finance/reports/overhead-variance
Query: ?dateFrom=2026-01-01&dateTo=2026-01-15

Response:
{
  "summary": {
    "spending_variance": 650.00,
    "volume_variance": 800.00,
    "total_variance": 1450.00
  },
  "by_cost_center": [
    {
      "cost_center_id": "uuid",
      "name": "Production OH",
      "spending_variance": 400.00,
      "volume_variance": 500.00,
      "total_variance": 900.00,
      "allocation_basis": "labor_hours"
    }
  ]
}
```

---

## Handoff to FRONTEND-DEV

```yaml
feature: Variance Drill-Down Page
story: FIN-010
prd_coverage: "Finance PRD FR-FIN-054, FR-FIN-056"
  - "Multi-dimensional drill-down (product/line/shift)"
  - "Overhead variance allocation"
  - "BOM component variance breakdown"
  - "Export drill-down data"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-010-variance-drill-down.md
  api_endpoints:
    - GET /api/finance/reports/variance-by-product
    - GET /api/finance/reports/variance-by-product/:productId/details
    - GET /api/finance/reports/variance-by-line
    - GET /api/finance/reports/variance-by-shift
    - GET /api/finance/reports/overhead-variance
states_per_screen: [loading, empty, populated, error]
components:
  - DimensionSelector
  - VarianceByProductTable
  - ProductVarianceTrendChart
  - BOMComponentVarianceTable
  - LineComparisonTable
  - ShiftBreakdownTable
  - OverheadVarianceBreakdown
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 7-9 hours
**Wireframe Length**: ~450 lines
