# TEC-013: Recipe Costing View

**Module**: Technical
**Feature**: Recipe Costing (Story 2.70-2.76)
**Type**: Page
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (With Costing Data)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Bread Loaf White > Costing                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Recipe Costing: Bread Loaf White (SKU: BREAD-001)                        │
│  BOM Version: 2.1    Effective: 2024-01-15    Batch Size: 100 kg          │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Cost Summary                                     [Recalculate]      │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Total Cost per Batch (100 kg):      $245.50                        │ │
│  │  Cost per kg:                         $2.46                         │ │
│  │  Cost per Unit (500g):                $1.23                         │ │
│  │                                                                      │ │
│  │  Standard Price:                      $2.80 /kg                     │ │
│  │  Target Margin:                       30%                           │ │
│  │  Actual Margin:                       13.8%    ⚠ Below target       │ │
│  │                                                                      │ │
│  │  Last Calculated: 2025-12-10 14:23    By: Jan Kowalski             │ │
│  │  Calculation Method: Standard (BOM + Routing)                       │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Material Costs                                  $185.50 (75.6%)    │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Ingredient           Qty      UoM    Unit Cost    Total    %       │ │
│  │  ─────────────────────────────────────────────────────────────────  │ │
│  │  Flour Type 550       50 kg     kg     $0.85      $42.50   17.3%   │ │
│  │  Water                30 L      L      $0.05      $1.50    0.6%    │ │
│  │  Yeast Fresh          2 kg      kg     $12.00     $24.00   9.8%    │ │
│  │  Salt                 1.5 kg    kg     $0.80      $1.20    0.5%    │ │
│  │  Sugar                3 kg      kg     $1.20      $3.60    1.5%    │ │
│  │  Butter               8 kg      kg     $6.50      $52.00   21.2%   │ │
│  │  Milk Powder          4 kg      kg     $8.20      $32.80   13.4%   │ │
│  │  Improver Bread       0.5 kg    kg     $18.00     $9.00    3.7%    │ │
│  │  Packaging Film       100 pcs   pcs    $0.12      $12.00   4.9%    │ │
│  │  Packaging Labels     100 pcs   pcs    $0.069     $6.90    2.8%    │ │
│  │                                                                      │ │
│  │  Scrap Allowance (2%):                           $3.71              │ │
│  │                                                   ──────             │ │
│  │  Total Material Cost:                            $185.50            │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Labor Costs                                     $42.00 (17.1%)     │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Operation         Machine        Time     Rate/hr    Cost    %     │ │
│  │  ─────────────────────────────────────────────────────────────────  │ │
│  │  10. Mixing        Spiral Mixer   20 min   $45.00    $15.00  6.1%  │ │
│  │  20. Dividing      Divider Auto   15 min   $40.00    $10.00  4.1%  │ │
│  │  30. Proofing      Proof Chamber   60 min   $0.00     $0.00   0.0%  │ │
│  │  40. Baking        Oven Deck #1    45 min   $30.00    $22.50  9.2%  │ │
│  │  50. Cooling       Cooling Rack    30 min   $0.00     $0.00   0.0%  │ │
│  │  60. Packing       Pack Line #2    25 min   $35.00    $14.58  5.9%  │ │
│  │                                                                      │ │
│  │  Setup Time (avg):                 15 min   $45.00    $11.25        │ │
│  │  Cleanup Time (avg):               10 min   $35.00    $5.83         │ │
│  │                                                        ──────        │ │
│  │  Total Labor Cost:                                    $42.00        │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Overhead Costs                                  $18.00 (7.3%)      │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  Allocation Method: Labor Hours                                     │ │
│  │  Overhead Rate: $12.00 per labor hour                               │ │
│  │                                                                      │ │
│  │  Total Labor Hours: 1.5 hrs                                         │ │
│  │  Allocated Overhead: $12.00 × 1.5 = $18.00                          │ │
│  │                                                                      │ │
│  │  Breakdown:                                                          │ │
│  │  - Utilities (electricity, water):        $7.20  (40%)              │ │
│  │  - Rent & facility:                       $5.40  (30%)              │ │
│  │  - Equipment depreciation:                $3.60  (20%)              │ │
│  │  - Other overhead:                        $1.80  (10%)              │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Cost Breakdown Chart                                                │ │
│  │                                                                      │ │
│  │  ████████████████████████████████████████ Material  75.6% ($185.50) │ │
│  │  ██████████ Labor  17.1% ($42.00)                                   │ │
│  │  ████ Overhead  7.3% ($18.00)                                       │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  [View Cost History]  [Export to CSV]  [Compare with Actual]  [Edit BOM] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Success State (No Costing Data Yet)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > New Product XYZ > Costing                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Recipe Costing: New Product XYZ (SKU: PROD-999)                          │
│  BOM Version: 1.0    Effective: 2025-12-11    Batch Size: 50 kg           │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │                          [Calculator Icon]                           │ │
│  │                                                                      │ │
│  │                  No Costing Data Available                           │ │
│  │                                                                      │ │
│  │  This product doesn't have ingredient costs configured yet.         │ │
│  │  To calculate recipe costing:                                       │ │
│  │                                                                      │ │
│  │  1. Ensure all BOM ingredients have cost data                       │ │
│  │  2. Verify routing operations are configured                        │ │
│  │  3. Click "Calculate Costing" below                                 │ │
│  │                                                                      │ │
│  │                      [Calculate Costing]                             │ │
│  │                                                                      │ │
│  │                    [Configure Ingredient Costs]                      │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Bread Loaf White > Costing                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Recipe Costing: Bread Loaf White (SKU: BREAD-001)                        │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │                          [Spinner Icon]                              │ │
│  │                                                                      │ │
│  │                  Calculating Recipe Costing...                       │ │
│  │                                                                      │ │
│  │  Processing BOM ingredients (10 items)...                            │ │
│  │  Calculating labor costs from routing...                             │ │
│  │  Allocating overhead...                                              │ │
│  │                                                                      │ │
│  │                      [Progress Bar 65%]                              │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Technical > Products > Bread Loaf White > Costing                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ⚠ Error: Cannot calculate costing - missing ingredient costs             │
│                                                                            │
│  Recipe Costing: Bread Loaf White (SKU: BREAD-001)                        │
│  BOM Version: 2.1    Effective: 2024-01-15    Batch Size: 100 kg          │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Costing Calculation Failed                                          │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  ❌ Missing ingredient costs (3 items):                              │ │
│  │                                                                      │ │
│  │  - Flour Type 550 (no cost data)                                    │ │
│  │  - Yeast Fresh (cost expired: last updated 2023-06-15)              │ │
│  │  - Improver Bread (no supplier cost)                                │ │
│  │                                                                      │ │
│  │  ⚠ Missing routing data:                                             │ │
│  │                                                                      │ │
│  │  - No routing assigned to this BOM version                          │ │
│  │                                                                      │ │
│  │  Please fix these issues and try again.                             │ │
│  │                                                                      │ │
│  │  [Configure Ingredient Costs]       [Assign Routing]                │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
(See "Success State (No Costing Data Yet)" above - this is the empty state)
```

---

## Key Components

### 1. Cost Summary Card
- **Total Cost per Batch**: Calculated sum of material + labor + overhead
- **Cost per kg**: Batch cost / output quantity
- **Cost per Unit**: For consumer packaging (e.g., 500g loaf)
- **Standard Price**: From product master (products.std_price)
- **Target Margin**: Configurable per product (default 30%)
- **Actual Margin**: Calculated as (std_price - cost) / std_price × 100
- **Margin Warning**: Red/yellow indicator if below target
- **Last Calculated**: Timestamp and user who ran calculation
- **Calculation Method**: Standard (from BOM) or Actual (from production)

### 2. Material Costs Section
- **Ingredient Table**: All BOM items with quantities and costs
- **Unit Cost**: From ingredient_costs table (effective date-based)
- **Total Cost**: Quantity × unit cost
- **Percentage**: Each ingredient's share of total cost
- **Scrap Allowance**: Configurable % added to material costs (default 2%)
- **Packaging Costs**: Film, labels, boxes included
- **Total Material Cost**: Sum including scrap allowance

### 3. Labor Costs Section
- **Operation Table**: From routing_operations
- **Machine**: Assigned work center/machine
- **Time**: Duration in minutes (from routing)
- **Rate/hr**: Labor cost per hour (from routing_operations.labor_cost_per_hour or bom_production_lines.labor_cost_per_hour)
- **Cost**: (time/60) × rate
- **Setup Time**: One-time cost per batch
- **Cleanup Time**: One-time cost per batch
- **Total Labor Cost**: Sum of all operations + setup + cleanup

### 4. Overhead Costs Section
- **Allocation Method**: Labor hours, machine hours, or material cost %
- **Overhead Rate**: Configurable per org (default $12/labor hour)
- **Total Labor Hours**: Sum of operation times
- **Allocated Overhead**: Rate × labor hours
- **Breakdown**: Utilities, rent, depreciation, other (configurable splits)

### 5. Cost Breakdown Chart
- **Visual Bar Chart**: ASCII representation of cost percentages
- **Material %**: Typically 60-80%
- **Labor %**: Typically 10-25%
- **Overhead %**: Typically 5-15%

### 6. Action Buttons
- **Recalculate**: Refresh costing with latest ingredient costs
- **View Cost History**: Navigate to TEC-015
- **Export to CSV**: Download detailed cost breakdown
- **Compare with Actual**: Compare standard vs actual costs from production
- **Edit BOM**: Navigate to BOM editor
- **Configure Ingredient Costs**: Navigate to ingredient cost management
- **Assign Routing**: If missing routing

---

## Main Actions

### Primary Actions
- **Calculate Costing** (Empty State):
  - Validates all ingredients have cost data
  - Validates routing exists
  - Calls `POST /api/technical/costing/products/:id/calculate`
  - Calculates material cost: Σ(ingredient cost × quantity)
  - Calculates labor cost: Σ(operation time × labor rate)
  - Allocates overhead based on allocation method
  - Saves to product_costs table
  - Shows success state with full breakdown
  - Toast: "Recipe costing calculated successfully"

- **Recalculate** (Success State):
  - Same as Calculate, but updates existing cost record
  - Creates new row in product_costs with effective_from = today
  - Archives previous cost record (sets effective_to)
  - Shows updated cost breakdown
  - Highlights changed values in yellow for 3 seconds
  - Toast: "Costing updated. Material cost changed by +5.2%"

### Secondary Actions
- **View Cost History**: Navigate to TEC-015 cost history page
- **Export to CSV**: Download cost breakdown with all details
- **Compare with Actual**: Shows variance analysis (standard vs actual from work orders)
- **Edit BOM**: Navigate to BOM editor (opens in new context)
- **Configure Ingredient Costs**: Navigate to ingredient cost management modal
- **Assign Routing**: Opens routing assignment modal

---

## 4 States (One-Line)

- **Loading**: Spinner + "Calculating Recipe Costing..." with progress indicator while POST /api/technical/costing/products/:id/calculate runs
- **Empty**: "No Costing Data Available" message with steps to configure + "Calculate Costing" button
- **Error**: Red banner with specific missing data (ingredient costs, routing) + links to fix issues
- **Success**: Full cost breakdown with material/labor/overhead sections, margin analysis, and visual chart

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Ingredient Costs | All BOM ingredients must have cost data with valid effective dates |
| Routing | BOM must have routing assigned (unless labor cost override exists) |
| Labor Rates | All operations must have labor_cost_per_hour (from routing or BOM line override) |
| Overhead Rate | Must be configured at org level or product level |
| Batch Size | Must match BOM.output_qty |
| Target Margin | Optional, 0-100%, default 30% |

**Validation Timing**:
- On page load: Check if costing data exists
- On Calculate: Validate all required data present
- On Recalculate: Same as Calculate

---

## Accessibility

- **Touch Targets**: All buttons >= 48x48dp
- **Contrast**: Error text (#DC2626), warning text (#F59E0B) pass WCAG AA
- **Screen Reader**: Announces "Recipe Costing View", section headings, cost values
- **Keyboard**: Tab navigation through sections, Enter to trigger actions
- **Focus**: Logical flow through cost sections
- **ARIA**: Table headers properly labeled, cost values announced with units

---

## Technical Notes

### API Endpoints
- **Get Costing**: `GET /api/technical/costing/products/:id`
- **Calculate**: `POST /api/technical/costing/products/:id/calculate`
- **Cost History**: `GET /api/technical/costing/products/:id/history`
- **Ingredient Costs**: `GET /api/technical/costing/ingredients/:id`
- **Export**: `GET /api/technical/costing/products/:id/export`

### Calculation Logic
```typescript
// Material Cost
materialCost = Σ(bom_item.quantity × ingredient_cost.cost_per_unit)
scrapCost = materialCost × (scrap_percent / 100)
totalMaterialCost = materialCost + scrapCost

// Labor Cost
laborCost = Σ((operation.duration / 60) × operation.labor_cost_per_hour)
setupCost = (setup_time / 60) × labor_rate
cleanupCost = (cleanup_time / 60) × labor_rate
totalLaborCost = laborCost + setupCost + cleanupCost

// Overhead Cost
totalLaborHours = Σ(operation.duration / 60)
overheadCost = totalLaborHours × overhead_rate

// Total Cost
totalCost = totalMaterialCost + totalLaborCost + overheadCost
costPerUnit = totalCost / output_qty

// Margin
actualMargin = ((std_price - costPerUnit) / std_price) × 100
```

### Data Structure
```typescript
{
  product_id: string;
  bom_id: string;
  cost_type: 'standard' | 'actual' | 'planned';
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
  batch_size: number;
  calculation_method: 'bom_routing' | 'actual_production';
  effective_from: Date;
  effective_to: Date | null;
  created_by: string;
  created_at: Date;
  breakdown: {
    materials: Array<{
      ingredient_id: string;
      name: string;
      quantity: number;
      uom: string;
      unit_cost: number;
      total_cost: number;
      percentage: number;
    }>;
    labor: Array<{
      operation_seq: number;
      name: string;
      machine: string;
      duration_minutes: number;
      labor_rate: number;
      cost: number;
      percentage: number;
    }>;
    overhead: {
      allocation_method: 'labor_hours' | 'machine_hours' | 'material_cost';
      overhead_rate: number;
      total_hours: number;
      allocated_cost: number;
      breakdown: {
        utilities: number;
        rent: number;
        depreciation: number;
        other: number;
      };
    };
  };
  margin_analysis: {
    std_price: number;
    target_margin_percent: number;
    actual_margin_percent: number;
    below_target: boolean;
  };
}
```

### Cost Update Triggers
- **Ingredient cost change**: Auto-recalculate if ingredient cost updated
- **BOM change**: Mark costing as outdated, require recalculation
- **Routing change**: Mark costing as outdated, require recalculation
- **Overhead rate change**: Recalculate all products using that rate

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:product:{productId}:costing'        // 10 min TTL
'org:{orgId}:ingredient:{ingredientId}:cost'     // 5 min TTL
'org:{orgId}:overhead-rate'                      // 30 min TTL
```

---

## Related Screens

- **BOM Detail**: [TEC-XXX] (parent screen with BOM items)
- **Cost History**: [TEC-015-cost-history.md] (historical cost trends)
- **Ingredient Cost Management**: Modal for setting ingredient costs
- **Production Variance**: Compare standard vs actual costs

---

## Business Rules

### Costing Calculation
1. **Material Cost Priority**:
   - Use most recent ingredient_cost with effective_from <= today
   - If multiple costs exist, use one with latest effective_from
   - If no cost exists, costing calculation fails

2. **Labor Cost Hierarchy**:
   - BOM line override (bom_production_lines.labor_cost_per_hour) > Routing operation default
   - If neither exists, use org default labor rate

3. **Overhead Allocation**:
   - Default method: labor_hours
   - Alternative: machine_hours (for capital-intensive processes)
   - Alternative: material_cost % (for material-intensive processes)

4. **Margin Analysis**:
   - Target margin configurable per product (default 30%)
   - Warning if actual margin < target margin
   - Error if actual margin < 0% (selling below cost)

5. **Cost Versioning**:
   - Each recalculation creates new cost record
   - Previous costs archived with effective_to = today
   - Cost history retained for audit and trend analysis

6. **FIFO/FEFO Impact**:
   - Costing uses AVERAGE ingredient cost, not FIFO/FEFO
   - Actual costs from production use FIFO/FEFO lot costs
   - Variance analysis shows difference between standard (average) and actual (FIFO/FEFO)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use standard page layout (not modal)
2. API service: `lib/services/costing-service.ts`
3. Zod schema: `lib/validation/costing-schema.ts`
4. Calculate button should show loading state during API call
5. Highlight changed values after recalculation (yellow flash)
6. Format currency with org locale (default USD)
7. Format percentages to 1 decimal place
8. Toast notifications for success/error
9. Cache cost data for 10 minutes to reduce API calls
10. Export CSV should include all breakdown details

### For BACKEND-DEV:
1. Implement cost calculation service with transaction support
2. Ensure ingredient_cost lookup uses correct effective dates
3. Create cost_variances table for actual vs standard comparison
4. Add trigger to mark costing outdated on BOM/routing change
5. Implement cost rollup for multi-level BOMs (recursive)
6. Add API rate limiting (max 10 calculations per minute per org)

---

**Status**: Auto-approved (autonomous mode)
**Approval Required**: No (auto-approve mode)
**Iterations**: 0 of 3
