# FIN-005: Inventory Valuation Report

**Module**: Finance (Cost Management)
**Feature**: Inventory Valuation (PRD Section FR-9.5.1, FR-9.5.2, FR-9.5.4)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Inventory Valuation                                          [Recalculate] [Export]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Valuation Method                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | [FIFO (First-In-First-Out)]  [Weighted Average Cost]                                      |   |
|  |      [Selected]                                                                            |   |
|  |                                                                                            |   |
|  | Valuation Date: [2026-01-15    v]              [Apply]                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Total Inventory Value                        |  | Value Distribution                       |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |           1,234,567.89 PLN                   |  |  [PIE CHART]                             |   |
|  |                                              |  |                                          |   |
|  |  Products:      856 active items             |  |  Raw Materials:    45%  (555,555 PLN)   |   |
|  |  Last Updated:  2026-01-15 10:00            |  |  Packaging:        15%  (185,185 PLN)   |   |
|  |  Method:        FIFO                         |  |  WIP:              25%  (308,642 PLN)   |   |
|  |                                              |  |  Finished Goods:   15%  (185,185 PLN)   |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters:                                                                                   |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | [Search by product name...             ]  Category: [All Categories v]                   |   |
|  |                                                                                            |   |
|  | Location: [All Warehouses v]  Value Range: [Min: ____] [Max: ____]  [Apply Filters]      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Inventory Valuation                                              Showing 1-25 of 856     |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Product Code | Product Name        | Qty on Hand | UOM | Avg Cost  | Total Value | Layers|   |
|  | ------------ | ------------------- | ----------- | --- | --------- | ----------- | ----- |   |
|  | PRD-MAT-001  | Cocoa Powder        | 500.00      | kg  | 12.50 PLN | 6,250.00    | 3     |   |
|  | PRD-MAT-002  | Sugar               | 2,000.00    | kg  | 2.45 PLN  | 4,900.00    | 5     |   |
|  | PRD-MAT-003  | Milk Powder         | 300.00      | kg  | 4.10 PLN  | 1,230.00    | 2     |   |
|  | PRD-FG-001   | Chocolate Bar 100g  | 1,500.00    | pcs | 3.50 PLN  | 5,250.00    | 4     |   |
|  | PRD-FG-002   | Cookie Pack 250g    | 800.00      | pcs | 5.75 PLN  | 4,600.00    | 2     |   |
|  | PRD-PKG-001  | Foil Wrapper        | 10,000.00   | pcs | 0.15 PLN  | 1,500.00    | 1     |   |
|  | PRD-PKG-002  | Outer Box           | 1,000.00    | pcs | 0.80 PLN  | 800.00      | 1     |   |
|  | ...          | ...                 | ...         | ... | ...       | ...         | ...   |   |
|  |                                                                                            |   |
|  | [< Previous]  Page 1 of 35  [Next >]                                                      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  Total on Page: 24,530.00 PLN                            Total All: 1,234,567.89 PLN           |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Product Valuation Detail (Modal/Drawer)

```
+------------------------------------------------------------------+
|  Product Valuation Detail - Cocoa Powder (PRD-MAT-001)     [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Summary                                                       | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Total Value:      6,250.00 PLN                                | |
|  | Quantity on Hand: 500.00 kg                                   | |
|  | Average Cost:     12.50 PLN/kg                                | |
|  | Valuation Method: FIFO                                        | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | FIFO Cost Layers                                              | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Layer | Receipt Date | Qty Received | Qty Remaining | Unit Cost| |
|  | ----- | ------------ | ------------ | ------------- | -------- | |
|  | 1     | 2026-01-05   | 200 kg       | 100 kg        | 11.50    | |
|  | 2     | 2026-01-10   | 200 kg       | 200 kg        | 12.00    | |
|  | 3     | 2026-01-14   | 250 kg       | 200 kg        | 13.50    | |
|  | ----- | ------------ | ------------ | ------------- | -------- | |
|  | Total |              | 650 kg       | 500 kg        | Avg 12.50| |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Valuation History (6 Months)                                  | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |     ^                                                          | |
|  |  7k |                               +-----                     | |
|  |     |                    +----------+                          | |
|  |  6k |     +--------------+                                     | |
|  |     +-----+                                                    | |
|  |  5k |                                                          | |
|  |     +----+----+----+----+----+----+                           | |
|  |       Aug  Sep  Oct  Nov  Dec  Jan                            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [View Transactions]  [Export Cost Layers]                        |
|                                                                    |
+------------------------------------------------------------------+
```

### Valuation Method Selector

```
+------------------------------------------------------------------+
|  Select Valuation Method                                          |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | ( ) FIFO (First-In-First-Out)                          [i]   | |
|  |     Oldest inventory used first. Shows cost layer detail.    | |
|  |     Best for: Perishable goods, GAAP compliance              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | (x) Weighted Average Cost (WAC)                        [i]   | |
|  |     Average cost of all inventory. Simpler calculation.      | |
|  |     Best for: Non-perishable goods, high-volume items        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Current Organization Setting: FIFO                               |
|                                                                    |
|  Note: Changing method will affect all valuation calculations.    |
|  This change will be logged for audit purposes.                   |
|                                                                    |
|  [Cancel]                                    [Apply Method]        |
+------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < Inventory Valuation           |
|  [Recalculate] [Export]          |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total Value                |  |
|  |                            |  |
|  |    1,234,567.89 PLN        |  |
|  |                            |  |
|  | 856 items | FIFO method    |  |
|  | Updated: 2026-01-15        |  |
|  +----------------------------+  |
|                                  |
|  Method: [FIFO         v]        |
|                                  |
|  [Search...                   ]  |
|  [Filters v]                     |
|                                  |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | PRD-MAT-001                |  |
|  | Cocoa Powder               |  |
|  |                            |  |
|  | Qty: 500.00 kg             |  |
|  | Avg Cost: 12.50 PLN/kg     |  |
|  | Value: 6,250.00 PLN        |  |
|  | Layers: 3                  |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | PRD-MAT-002                |  |
|  | Sugar                      |  |
|  |                            |  |
|  | Qty: 2,000.00 kg           |  |
|  | Avg Cost: 2.45 PLN/kg      |  |
|  | Value: 4,900.00 PLN        |  |
|  | Layers: 5                  |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
|  Total: 1,234,567.89 PLN         |
+----------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Inventory Valuation                                          [Recalculate] [Export]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                       [Warehouse Icon]                                           |
|                                                                                                  |
|                                   No Inventory to Value                                          |
|                                                                                                  |
|                     Inventory valuation requires:                                                |
|                     - Inventory on hand (License Plates)                                         |
|                     - Cost layers created from receipts                                          |
|                                                                                                  |
|                                                                                                  |
|                                   [Create First Receipt (GRN)]                                   |
|                                   [Configure Valuation Settings]                                 |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Valuation Method Selector

Toggle between FIFO and Weighted Average.

| Method | Description | Use Case |
|--------|-------------|----------|
| FIFO | First-In-First-Out, tracks cost layers | Perishable goods, GAAP/IFRS compliance |
| WAC | Weighted Average Cost, single average | High-volume, non-perishable items |

### 2. Total Value Card

Summary of total inventory value.

| Field | Description |
|-------|-------------|
| Total Value | Sum of all inventory values |
| Products Count | Number of unique products |
| Last Updated | Timestamp of last calculation |
| Method | Current valuation method |

### 3. Value Distribution Chart

Pie chart showing value by category.

| Category | Description |
|----------|-------------|
| Raw Materials | Ingredients and base materials |
| Packaging | Packaging materials |
| WIP | Work in Progress |
| Finished Goods | Completed products |

### 4. Inventory Valuation Table

Main data table with product-level valuation.

| Column | Type | Sortable | Description |
|--------|------|----------|-------------|
| Product Code | Text | Yes | Product identifier |
| Product Name | Text | Yes | Full product name |
| Qty on Hand | Number | Yes | Current quantity |
| UOM | Text | No | Unit of measure |
| Avg Cost | Currency | Yes | Average cost per unit |
| Total Value | Currency | Yes | Qty x Avg Cost |
| Layers | Number | Yes | FIFO cost layer count |

### 5. Product Detail Modal

Detailed view with cost layers (FIFO) or calculation (WAC).

| Section | Content |
|---------|---------|
| Summary | Total value, quantity, average cost |
| Cost Layers | Receipt date, quantities, unit costs (FIFO only) |
| Valuation History | 6-month trend chart |
| Actions | View transactions, export |

---

## Main Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Recalculate | Header button | Force recalculation of all valuations |
| Export | Header button | Download as CSV/Excel |
| Change Method | Method selector | Switch valuation method |
| View Detail | Row click | Open product detail modal |
| View Cost Layers | Detail modal | Expand FIFO layer breakdown |
| Export Cost Layers | Detail modal | Download layers as CSV |

---

## States

### Loading State
- Skeleton for total value card
- Skeleton table rows (5 rows)
- "Calculating inventory values..." text

### Empty State
- Warehouse illustration
- "No Inventory to Value" headline
- Explanation of requirements
- [Create First Receipt] CTA
- [Configure Settings] secondary action

### Populated State
- Total value card with distribution chart
- Valuation table with pagination
- Method selector active
- Filter options available

### Error State
- Warning icon
- "Failed to Calculate Valuation" headline
- Error details
- [Retry] button

---

## API Endpoints

### Get Inventory Valuation Summary

```
GET /api/finance/inventory-valuation
Query: ?method=fifo&valuation_date=2026-01-15&category=&location=

Response:
{
  "total_value": 1234567.89,
  "currency_code": "PLN",
  "valuation_method": "fifo",
  "valuation_date": "2026-01-15",
  "products_count": 856,
  "last_updated": "2026-01-15T10:00:00Z",

  "distribution": {
    "raw_materials": 555555.00,
    "packaging": 185185.00,
    "wip": 308642.00,
    "finished_goods": 185185.89
  },

  "valuations": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_code": "PRD-MAT-001",
      "product_name": "Cocoa Powder",
      "quantity_on_hand": 500.00,
      "uom": "kg",
      "average_unit_cost": 12.50,
      "total_value": 6250.00,
      "active_layers_count": 3,
      "oldest_layer_date": "2026-01-05",
      "newest_layer_date": "2026-01-14"
    }
  ],

  "pagination": {
    "total": 856,
    "page": 1,
    "limit": 25,
    "pages": 35
  }
}
```

### Get Product Valuation Detail

```
GET /api/finance/inventory-valuation/:productId

Response:
{
  "product_id": "uuid",
  "product_code": "PRD-MAT-001",
  "product_name": "Cocoa Powder",
  "total_value": 6250.00,
  "quantity_on_hand": 500.00,
  "average_unit_cost": 12.50,
  "valuation_method": "fifo",

  "cost_layers": [
    {
      "id": "uuid",
      "receipt_date": "2026-01-05",
      "quantity_received": 200.00,
      "quantity_remaining": 100.00,
      "unit_cost": 11.50,
      "total_cost": 1150.00,
      "lp_number": "LP-00001"
    }
  ],

  "historical_valuations": [
    {
      "period": "2025-08",
      "value": 5200.00
    }
  ]
}
```

### Recalculate Valuation

```
POST /api/finance/inventory-valuation/calculate
Body: {
  "product_id": null,  // null = all products
  "valuation_date": "2026-01-15"
}

Response:
{
  "success": true,
  "products_calculated": 856,
  "total_value": 1234567.89,
  "calculated_at": "2026-01-15T10:00:00Z"
}
```

---

## Business Rules

### FIFO Valuation

1. **Layer Ordering**: Consume oldest layers first (by receipt_date)
2. **Layer Creation**: New layer created on each LP receipt
3. **Layer Consumption**: Reduce quantity_remaining when inventory used
4. **Average Calculation**: For display only (not used in FIFO consumption)

### Weighted Average Valuation

1. **Calculation**: Total Value / Total Quantity
2. **Update Trigger**: Recalculated on each receipt
3. **Consumption**: Use current average cost for all issues

### Permissions

| Role | View | Recalculate | Change Method | Export |
|------|------|-------------|---------------|--------|
| Finance Manager | Yes | Yes | Yes | Yes |
| Cost Accountant | Yes | Yes | No | Yes |
| Warehouse Manager | Yes | No | No | Yes |
| Viewer | Yes | No | No | No |

---

## Handoff to FRONTEND-DEV

```yaml
feature: Inventory Valuation Report
story: FIN-005
prd_coverage: "Finance PRD FR-9.5.1, FR-9.5.2, FR-9.5.4"
  - "FIFO valuation with cost layers"
  - "Weighted average valuation"
  - "Inventory value report"
  - "Method configuration"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-005-inventory-valuation-report.md
  api_endpoints:
    - GET /api/finance/inventory-valuation
    - GET /api/finance/inventory-valuation/:productId
    - GET /api/finance/inventory-valuation/:productId/layers
    - POST /api/finance/inventory-valuation/calculate
states_per_screen: [loading, empty, populated, error]
components:
  - ValuationMethodSelector
  - TotalValueCard
  - ValueDistributionChart
  - InventoryValuationTable
  - ProductValuationDetailModal
  - CostLayersTable
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 6-8 hours
**Wireframe Length**: ~400 lines
