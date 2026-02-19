# FIN-004: BOM Costing Page

**Module**: Finance (Cost Management)
**Feature**: BOM Costing (PRD Section FR-9.2.1, FR-9.2.2)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > BOM Costing > Chocolate Bar 100g (BOM-PRD-001-v2)                   [Simulate] [Export]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | BOM Information                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|  | Product: Chocolate Bar 100g        BOM Version: v2.0          Status: Active              |   |
|  | Batch Size: 100 units              Effective: 2025-01-01      Yield: 98%                  |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------+  +--------------------------------------------+   |
|  | Total BOM Cost                            |  | Cost per Unit                              |   |
|  +-------------------------------------------+  +--------------------------------------------+   |
|  |                                           |  |                                            |   |
|  |            925.00 PLN                     |  |            9.25 PLN/unit                   |   |
|  |            (per batch of 100)             |  |            (925.00 / 100 units)            |   |
|  |                                           |  |                                            |   |
|  |  Material:  550.00 PLN (59.5%)            |  |  Material:  5.50 PLN/unit                  |   |
|  |  Labor:     250.00 PLN (27.0%)            |  |  Labor:     2.50 PLN/unit                  |   |
|  |  Overhead:  125.00 PLN (13.5%)            |  |  Overhead:  1.25 PLN/unit                  |   |
|  |                                           |  |                                            |   |
|  +-------------------------------------------+  +--------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Ingredient Costs                                                      Last Updated: Today |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Component         | Type       | Qty/Batch | UOM  | Unit Cost | Total    | % of Mat      |   |
|  | ----------------- | ---------- | --------- | ---- | --------- | -------- | ------------- |   |
|  | Cocoa Powder      | Ingredient | 30.00     | kg   | 12.00 PLN | 360.00   | 65.5%         |   |
|  | Sugar             | Ingredient | 40.00     | kg   | 2.50 PLN  | 100.00   | 18.2%         |   |
|  | Milk Powder       | Ingredient | 15.00     | kg   | 4.00 PLN  | 60.00    | 10.9%         |   |
|  | Vanilla Extract   | Ingredient | 0.50      | L    | 30.00 PLN | 15.00    | 2.7%          |   |
|  | Lecithin          | Ingredient | 0.25      | kg   | 60.00 PLN | 15.00    | 2.7%          |   |
|  | ----------------- | ---------- | --------- | ---- | --------- | -------- | ------------- |   |
|  | SUBTOTAL (Ingredients)                                          | 550.00   | 100%          |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Packaging Costs                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Component         | Type       | Qty/Batch | UOM  | Unit Cost | Total    | % of Pkg      |   |
|  | ----------------- | ---------- | --------- | ---- | --------- | -------- | ------------- |   |
|  | Foil Wrapper      | Packaging  | 100       | pcs  | 0.15 PLN  | 15.00    | 60.0%         |   |
|  | Outer Box         | Packaging  | 10        | pcs  | 0.80 PLN  | 8.00     | 32.0%         |   |
|  | Label             | Packaging  | 100       | pcs  | 0.02 PLN  | 2.00     | 8.0%          |   |
|  | ----------------- | ---------- | --------- | ---- | --------- | -------- | ------------- |   |
|  | SUBTOTAL (Packaging)                                            | 25.00    | 100%          |   |
|  |                                                                                            |   |
|  | Note: Packaging included in Material Cost total                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Labor Costs (from Routing)                                                                 |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Operation         | Sequence | Std Hours | Hourly Rate | Total    | % of Labor           |   |
|  | ----------------- | -------- | --------- | ----------- | -------- | -------------------- |   |
|  | Mixing            | 10       | 2.0 hrs   | 40.00 PLN   | 80.00    | 32.0%                |   |
|  | Tempering         | 20       | 1.5 hrs   | 45.00 PLN   | 67.50    | 27.0%                |   |
|  | Molding           | 30       | 1.5 hrs   | 40.00 PLN   | 60.00    | 24.0%                |   |
|  | Wrapping          | 40       | 1.0 hrs   | 35.00 PLN   | 35.00    | 14.0%                |   |
|  | Quality Check     | 50       | 0.25 hrs  | 30.00 PLN   | 7.50     | 3.0%                 |   |
|  | ----------------- | -------- | --------- | ----------- | -------- | -------------------- |   |
|  | SUBTOTAL (Labor)                                                | 250.00   | 100%          |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Overhead Allocation                                                                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Allocation Basis: 50% of Labor Cost                                                       |   |
|  | Calculation: 250.00 PLN x 50% = 125.00 PLN                                                |   |
|  |                                                                                            |   |
|  | Cost Center: Production Overhead (CC-001)                                                 |   |
|  | Overhead Rate: 50%                                                                        |   |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [< Back to BOM List]              [Compare Versions]              [Recalculate Cost]           |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Cost Summary Card (Collapsible)

```
+------------------------------------------+
| Total BOM Cost                    [^]    |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |        925.00 PLN                  |  |
|  |        per batch (100 units)       |  |
|  +------------------------------------+  |
|                                          |
|  Cost per Unit: 9.25 PLN                 |
|                                          |
|  +------------------------------------+  |
|  | Breakdown              Amount   %  |  |
|  | -------------------- --------- --- |  |
|  | Ingredients          550.00   59% |  |
|  | [========================|     ]   |  |
|  |                                    |  |
|  | Packaging             25.00    3% |  |
|  | [=|                            ]   |  |
|  |                                    |  |
|  | Labor                250.00   27% |  |
|  | [================|            ]    |  |
|  |                                    |  |
|  | Overhead            125.00   14% |  |
|  | [========|                    ]    |  |
|  +------------------------------------+  |
|                                          |
|  [Simulate Cost] [Export to Excel]       |
|                                          |
+------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < BOM Costing                   |
|  Chocolate Bar 100g              |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total Cost                 |  |
|  |                            |  |
|  |     925.00 PLN             |  |
|  |     (batch of 100)         |  |
|  |                            |  |
|  | Unit Cost: 9.25 PLN        |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Breakdown                  |  |
|  | Material: 550.00 (59%)     |  |
|  | Labor:    250.00 (27%)     |  |
|  | Overhead: 125.00 (14%)     |  |
|  +----------------------------+  |
|                                  |
|  [Ingredients v]                 |
|  +----------------------------+  |
|  | Cocoa Powder               |  |
|  | 30 kg x 12.00 = 360.00     |  |
|  +----------------------------+  |
|  | Sugar                      |  |
|  | 40 kg x 2.50 = 100.00      |  |
|  +----------------------------+  |
|  | Milk Powder                |  |
|  | 15 kg x 4.00 = 60.00       |  |
|  +----------------------------+  |
|                                  |
|  [Packaging v]                   |
|  [Labor v]                       |
|  [Overhead v]                    |
|                                  |
|  [Simulate] [Export]             |
|                                  |
+----------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > BOM Costing                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                       [Recipe Book Icon]                                         |
|                                                                                                  |
|                                   No BOM Cost Data Available                                     |
|                                                                                                  |
|                     BOM costing requires:                                                        |
|                     - Standard costs defined for all BOM components                              |
|                     - Routing with labor hours (for labor cost)                                  |
|                     - Overhead rate configured (for overhead allocation)                         |
|                                                                                                  |
|                                                                                                  |
|                     Missing standard costs for 3 components:                                     |
|                     - Cocoa Powder (PRD-MAT-001)                                                 |
|                     - Vanilla Extract (PRD-MAT-004)                                              |
|                     - Lecithin (PRD-MAT-005)                                                     |
|                                                                                                  |
|                                                                                                  |
|                                   [Define Missing Costs]                                         |
|                              [View BOM Without Cost Data]                                        |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. BOM Information Header

Summary of BOM metadata.

| Field | Description |
|-------|-------------|
| Product | Product name with code |
| BOM Version | Current version number |
| Status | Active/Draft/Archived |
| Batch Size | Standard batch quantity |
| Effective Date | When BOM became active |
| Yield | Expected yield percentage |

### 2. Total Cost Cards

Two side-by-side cards showing cost summary.

| Card | Content |
|------|---------|
| Total BOM Cost | Total cost per batch with category breakdown |
| Cost per Unit | Per-unit cost with category breakdown |

### 3. Ingredient Costs Table

Detailed breakdown of ingredient/material costs.

| Column | Description |
|--------|-------------|
| Component | Ingredient name |
| Type | Ingredient/Packaging |
| Qty/Batch | Quantity required per batch |
| UOM | Unit of measure |
| Unit Cost | Standard cost per unit |
| Total | Qty x Unit Cost |
| % of Material | Percentage of total material cost |

### 4. Packaging Costs Table

Separate table for packaging materials.

| Column | Description |
|--------|-------------|
| Component | Packaging item name |
| Qty/Batch | Quantity per batch |
| Unit Cost | Cost per unit |
| Total | Extended cost |
| % of Packaging | Percentage contribution |

### 5. Labor Costs Table

Labor costs from routing operations.

| Column | Description |
|--------|-------------|
| Operation | Operation name |
| Sequence | Order in routing |
| Std Hours | Standard hours per batch |
| Hourly Rate | Labor rate per hour |
| Total | Hours x Rate |
| % of Labor | Percentage of total labor cost |

### 6. Overhead Allocation

Overhead cost calculation display.

| Field | Description |
|-------|-------------|
| Allocation Basis | How overhead is calculated (e.g., % of labor) |
| Calculation | Formula and result |
| Cost Center | Assigned cost center |
| Overhead Rate | Rate used for allocation |

---

## Main Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Simulate | Header [Simulate] | Opens BOM cost simulation modal |
| Export | Header [Export] | Download as CSV/Excel |
| Compare Versions | Footer | Navigate to version comparison |
| Recalculate Cost | Footer | Force recalculation of BOM cost |
| Define Missing Costs | Empty state | Navigate to standard cost definition |

---

## States

### Loading State
- Skeleton tables for all sections
- "Calculating BOM costs..." text

### Empty State (Missing Standard Costs)
- Recipe book illustration
- "No BOM Cost Data Available" headline
- List of components missing standard costs
- [Define Missing Costs] CTA
- [View BOM Without Cost Data] secondary action

### Populated State
- All cost tables populated
- Summary cards with totals
- Percentage breakdowns calculated

### Error State
- Warning icon
- "Failed to Calculate BOM Costs" message
- Error details
- [Retry] button

---

## API Endpoints

### Get BOM Cost Breakdown

```
GET /api/finance/bom-costs/:bomId

Response:
{
  "bom_id": "uuid",
  "bom_version": "v2.0",
  "product_id": "uuid",
  "product_name": "Chocolate Bar 100g",
  "batch_size": 100,
  "yield_percent": 98,
  "effective_from": "2025-01-01",
  "status": "active",

  "cost_summary": {
    "material_cost": 550.00,
    "packaging_cost": 25.00,
    "labor_cost": 250.00,
    "overhead_cost": 125.00,
    "total_cost": 925.00,
    "cost_per_unit": 9.25
  },

  "ingredients": [
    {
      "bom_item_id": "uuid",
      "product_id": "uuid",
      "product_name": "Cocoa Powder",
      "type": "ingredient",
      "quantity": 30.00,
      "uom": "kg",
      "unit_cost": 12.00,
      "total_cost": 360.00,
      "percent_of_material": 65.5
    }
  ],

  "packaging": [...],

  "labor": [
    {
      "operation_id": "uuid",
      "operation_name": "Mixing",
      "sequence": 10,
      "standard_hours": 2.0,
      "hourly_rate": 40.00,
      "total_cost": 80.00,
      "percent_of_labor": 32.0
    }
  ],

  "overhead": {
    "allocation_basis": "percent_of_labor",
    "overhead_rate": 50,
    "calculation": "250.00 x 50% = 125.00",
    "cost_center_id": "uuid",
    "cost_center_name": "Production Overhead"
  },

  "currency_code": "PLN",
  "last_calculated_at": "2026-01-15T10:00:00Z"
}
```

### Calculate BOM Cost

```
POST /api/finance/bom-costs/:bomId/calculate

Response:
{
  "success": true,
  "cost_summary": {...},
  "calculated_at": "2026-01-15T10:00:00Z"
}
```

---

## Business Rules

### Cost Calculation

1. **Material Cost**: Sum of (BOM item quantity x standard cost) for all ingredients and packaging
2. **Labor Cost**: Sum of (routing operation hours x hourly rate) for all operations
3. **Overhead Cost**: Calculated based on allocation basis (% of labor, % of material, or fixed rate)
4. **Total Cost**: Material + Labor + Overhead
5. **Cost per Unit**: Total Cost / Batch Size

### Missing Data Handling

1. If any BOM item lacks a standard cost, show warning and list missing items
2. If routing is missing, labor cost = 0 with warning
3. If overhead rate not configured, overhead = 0 with warning

### Yield Adjustment

```
Adjusted Cost = Total Cost / (Yield % / 100)
```

---

## Handoff to FRONTEND-DEV

```yaml
feature: BOM Costing Page
story: FIN-004
prd_coverage: "Finance PRD FR-9.2.1, FR-9.2.2"
  - "Ingredient costing from BOM quantities"
  - "Packaging cost calculation"
  - "Labor cost from routing"
  - "Overhead allocation"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-004-bom-costing-page.md
  api_endpoints:
    - GET /api/finance/bom-costs/:bomId
    - POST /api/finance/bom-costs/:bomId/calculate
states_per_screen: [loading, empty, populated, error]
components:
  - BOMCostSummaryCards
  - IngredientCostsTable
  - PackagingCostsTable
  - LaborCostsTable
  - OverheadAllocationCard
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 5-7 hours
**Wireframe Length**: ~350 lines
