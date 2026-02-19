# Recipe Costing Guide

## Introduction

Recipe costing helps you understand the true cost of producing your products. By combining ingredient costs from your Bill of Materials (BOM) with labor and overhead costs from your production routings, you can:

- **Analyze margins**: See the difference between your selling price and production cost
- **Identify cost drivers**: Understand which ingredients or operations consume the most cost
- **Price products accurately**: Ensure prices cover costs and target margin
- **Optimize production**: Find where to reduce costs (materials, labor, or overhead)

Recipe costing calculates costs using current data—whenever ingredient costs or labor rates change, your costing automatically reflects the update.

---

## Prerequisites

Before you can calculate recipe costs, ensure the following setup is complete:

### 1. Products Have Cost Data

Every ingredient in your BOM must have a cost assigned.

**Check ingredient costs**:
1. Navigate to **Technical > Products**
2. Find each ingredient used in your BOMs
3. Verify the "Cost Per Unit" field is filled
4. Make sure the currency matches your organization setting

**Example ingredients that need costs**:
- Flour ($0.85 per kg)
- Yeast ($12.00 per kg)
- Butter ($6.50 per kg)
- Packaging materials

**No cost data?** Assign costs now:
1. Open the product
2. Scroll to "Pricing & Costing" section
3. Enter the cost per unit
4. Save the product

### 2. BOM Is Created with All Ingredients

Your product must have a BOM (Bill of Materials) that lists all ingredients with quantities.

**Check your BOM**:
1. Navigate to **Technical > Products**
2. Open your product
3. Click **Bill of Materials**
4. Verify all ingredients are listed with quantities
5. Check that ingredient quantities are realistic

**If BOM is missing**:
1. Click **Create BOM** on the product page
2. Add all ingredients and their quantities
3. Set scrap allowance (typically 2-5% for food products)
4. Save the BOM

### 3. Routing Is Assigned to BOM

Your BOM must be linked to a routing that describes the production process.

**Check routing assignment**:
1. Open **Technical > Bill of Materials** or find BOM from product page
2. Look for "Assigned Routing" field
3. If empty, click **Assign Routing** dropdown

**If routing is not assigned**:
1. Click **Assign Routing**
2. Select appropriate routing from the list
3. Save the BOM

**Don't have a routing yet?** Create one:
1. Navigate to **Technical > Routings**
2. Click **Create Routing**
3. Name it (e.g., "Bread Production - Standard")
4. Add operations (Mixing, Baking, Cooling, Packing, etc.)
5. For each operation, set:
   - Duration in minutes
   - Setup time (one-time per batch)
   - Cleanup time
   - Labor cost per hour ($45/hr for skilled labor, for example)
6. Set routing-level costs:
   - **Setup Cost**: Fixed cost per production run (e.g., $50)
   - **Working Cost Per Unit**: Variable cost per kg produced (e.g., $0.15)
   - **Overhead %**: Allocation rate (e.g., 12%)
7. Save the routing
8. Return to BOM and assign this routing

### 4. Routing Operations Have Labor Rates

Each operation in the routing must have a labor cost assigned.

**Check labor rates**:
1. Navigate to **Technical > Routings**
2. Open your routing
3. Click on each operation
4. Verify "Labor Cost Per Hour" is filled
5. Save any changes

**Example labor rates**:
- Mixing operation: $45/hour
- Baking operation: $30/hour
- Packing operation: $35/hour

---

## Viewing Costs

### Access the Cost Summary

Once your prerequisites are complete, view the cost breakdown:

1. Navigate to **Technical > Products**
2. Find your product
3. Click **View Product**
4. Look for the **Recipe Costing** section on the product details page
5. You'll see the cost breakdown

### Interpret the Cost Summary

The cost summary displays four key areas:

#### Total Cost Metrics
```
Total Cost per Batch (100 kg):    $206.47
Cost per kg:                       $2.06
Cost per Unit (500g loaf):         $1.03

Standard Price:                    $2.80 /kg
Target Margin:                     30%
Actual Margin:                     26.4%    (Within target)
```

- **Total Cost per Batch**: Sum of all material, labor, and overhead costs for one production batch
- **Cost per kg**: Total cost divided by batch size (useful for comparing across recipes)
- **Cost per Unit**: Cost for a single finished product (loaf, box, etc.)
- **Actual Margin**: The profit percentage at standard price
- **Margin Status**: Green if above target, yellow/red if below

#### Material Costs Breakdown

View the ingredient cost table to see:

| Ingredient | Quantity | Unit Cost | Total Cost | % of Total |
|------------|----------|-----------|-----------|-----------|
| Flour Type 550 | 50 kg | $0.85 | $42.50 | 22.9% |
| Yeast Fresh | 2 kg | $12.00 | $24.00 | 12.9% |
| Butter | 8 kg | $6.50 | $52.00 | 28.0% |
| Water | 30 L | $0.05 | $1.50 | 0.8% |
| **Scrap Allowance (2%)** | - | - | $3.71 | 2.0% |
| **Total Material Cost** | - | - | **$123.71** | **66.6%** |

**What to look for**:
- ✓ Are percentages reasonable? (Typically 60-80% of total for food)
- ✓ Is any ingredient unusually expensive?
- ✓ Are scrap allowances realistic?

**Cost too high?** Consider:
- Finding alternative suppliers with lower costs
- Reducing ingredient quantities if possible
- Changing recipe to cheaper ingredients

#### Labor Costs Breakdown

See time and cost for each production operation:

| Operation | Machine | Duration | Rate/hr | Cost | % of Total |
|-----------|---------|----------|---------|------|-----------|
| Mixing | Spiral Mixer | 20 min | $45.00 | $15.00 | 36.6% |
| Baking | Oven Deck #1 | 45 min | $30.00 | $22.50 | 54.9% |
| Setup (average) | - | 15 min | $45.00 | $11.25 | 27.4% |
| Cleanup (average) | - | 10 min | $35.00 | $5.83 | 14.2% |
| **Total Labor Cost** | - | - | - | **$42.00** | **20.2%** |

**What to look for**:
- ✓ Total labor is typically 10-25% of product cost
- ✓ Are operation durations realistic?
- ✓ Do labor rates match your facility standards?

**Cost too high?** Consider:
- Optimizing operation duration (reduce waste, improve efficiency)
- Using equipment with higher throughput
- Reviewing if labor rates match market (outsource if cheaper)

#### Overhead Allocation

Overhead is distributed based on labor hours. Example:

```
Allocation Method:    Labor Hours
Overhead Rate:        $12.00 per labor hour

Total Labor Hours:    1.5 hours
Allocated Overhead:   $12.00 × 1.5 = $18.00

Breakdown:
- Utilities (40%):           $7.20
- Rent & Facility (30%):     $5.40
- Equipment (20%):           $3.60
- Other (10%):               $1.80
```

Overhead is typically 5-15% of total cost.

#### Cost Breakdown Visualization

A horizontal bar chart shows the proportion of each cost component:

```
Material  ████████████████████████████████████  66.6%
Labor     ███████████████                        20.2%
Overhead  ███████                               13.2%
```

Use this to quickly identify which components consume the most cost.

---

## Recalculating Costs

Costs should be recalculated when data changes to ensure accuracy.

### When to Recalculate

Recalculate costs when:
- ✓ Ingredient cost changes (supplier price increase)
- ✓ BOM items change (add/remove ingredient)
- ✓ Routing operations change (duration adjusted)
- ✓ Labor rates change (wage increase)
- ✓ Before pricing decision (to get latest data)

Do NOT recalculate:
- ✗ Every time you view the page (wastes resources)
- ✗ For each production batch (costs stay the same)
- ✗ Unless data has actually changed

### How to Recalculate

1. Open your product's **Recipe Costing** page
2. Click the **[Recalculate]** button
3. Wait for the calculation to complete (usually < 2 seconds)
4. Review the updated costs
5. Note any significant changes
6. Save any pricing adjustments if needed

**What happens during recalculation**:
- ✓ All current ingredient costs are fetched
- ✓ All routing operation durations are checked
- ✓ Total cost is recalculated
- ✓ New record is created in the system (historical tracking)
- ✓ Any margin changes are highlighted

**Example result**:
```
Costing updated. Material cost changed by +5.2%
```

---

## Understanding the Cost Formula

### How Material Cost Is Calculated

```
For each ingredient:
  Cost = Quantity × Unit Cost × (1 + Scrap Percent)

Example:
  Flour: 50 kg × $0.85/kg × 1.02 = $42.85
  Yeast: 2 kg × $12.00/kg × 1.00 = $24.00
  Total Material Cost: $66.85
```

The scrap allowance accounts for waste during production (typically 2-5%).

### How Labor Cost Is Calculated

```
For each operation:
  Cost = (Duration Minutes ÷ 60) × Hourly Rate

Example:
  Mixing: (20 min ÷ 60) × $45/hr = $15.00
  Baking: (45 min ÷ 60) × $30/hr = $22.50
  Setup: (15 min ÷ 60) × $45/hr = $11.25
  Cleanup: (10 min ÷ 60) × $35/hr = $5.83
  Total Labor Cost: $52.58
```

### How Overhead Is Calculated

```
Overhead = (Material + Labor + Routing) × Overhead Rate

Example:
  Subtotal: $66.85 + $52.58 + $50.00 = $169.43
  Overhead Rate: 12%
  Overhead Cost: $169.43 × 0.12 = $20.33
```

### Total Cost Calculation

```
Total Cost = Material + Labor + Routing Setup + Overhead

Example:
  Material: $66.85
  Labor: $52.58
  Routing Setup: $50.00
  Overhead: $20.33
  Total: $189.76

Cost Per Unit = Total ÷ Batch Size
  $189.76 ÷ 100 kg = $1.90/kg
```

---

## Margin Analysis

Margin shows the profit percentage between your selling price and production cost.

### Understanding Your Margin

```
Standard Price:        $2.80 per kg
Cost Per Unit:         $1.90 per kg
Actual Margin:         32.1%
Target Margin:         30%
Status:                ✓ Above target (good)
```

**What the numbers mean**:
- **Standard Price**: Your selling price (from product master)
- **Cost Per Unit**: Production cost calculated from BOM + routing
- **Actual Margin %**: Profit as percentage of selling price
- **Target Margin**: Your goal margin (default 30%)

### Margin Warnings

If your actual margin falls below target, a warning appears:

```
⚠ Margin below target
Actual: 10.0% | Target: 30%
```

**This means**:
- You may not be making enough profit
- Consider raising price or reducing costs
- Review competitor pricing

### Actions When Margin Is Low

If margin is below your target:

1. **Increase Price**: Raise selling price to $3.20+/kg
2. **Reduce Material Costs**:
   - Find cheaper suppliers
   - Negotiate bulk discounts
   - Replace expensive ingredients with cheaper alternatives
3. **Improve Labor Efficiency**:
   - Optimize operation durations
   - Train operators to reduce waste
   - Use more efficient equipment
4. **Review Overhead**: Ensure overhead allocation is fair

---

## Troubleshooting

### "Missing cost data for: FLO-001 (Flour)"

**Problem**: An ingredient in the BOM has no cost assigned.

**Solution**:
1. Click **[Configure Ingredient Costs]** button
2. Find the ingredient (FLO-001 Flour)
3. Enter the cost per unit
4. Save
5. Return and click **[Recalculate]**

### "Assign routing to BOM to calculate labor costs"

**Problem**: The BOM is not linked to a routing.

**Solution**:
1. Click **[Assign Routing]** button
2. Select a routing from the dropdown
3. Click **Assign**
4. Return and click **[Recalculate]**

### Cost calculation is very slow (> 5 seconds)

**Problem**: Calculation is taking longer than expected.

**Causes**:
- Very large BOM (100+ ingredients)
- Server is under heavy load
- Network latency

**Solution**:
- Try again later if server is busy
- Consider splitting large BOMs into sub-assemblies
- Contact support if problem persists

### Cost changed dramatically after recalculation

**Likely reason**: An ingredient cost was updated significantly.

**Actions**:
1. Check the "Cost Changed by X%" message
2. Review which ingredient changed
3. Verify the new cost is correct
4. Adjust selling price if needed

---

## Best Practices

### Regular Costing Maintenance

**Weekly**:
- Review ingredient costs (check supplier price lists)
- Update costs if suppliers raise prices
- Recalculate costing to stay current

**Monthly**:
- Review margin analysis
- Compare actual production costs to standard
- Identify cost reduction opportunities
- Update selling prices if needed

**Quarterly**:
- Full cost audit across all products
- Review routing efficiency
- Renegotiate supplier contracts
- Benchmark against competitors

### Optimal Batch Sizes

Cost per unit typically decreases with larger batch sizes due to fixed setup costs being spread across more units. Example:

```
Batch 50 kg:   Cost per kg = $2.15 (high setup cost per unit)
Batch 100 kg:  Cost per kg = $1.95 (setup spread wider)
Batch 200 kg:  Cost per kg = $1.85 (more efficient)
```

If your margin is low, consider producing in larger batches.

### Version Control for Costing

The system automatically tracks cost history. Each time you recalculate, a new cost record is created. This allows you to:
- See historical cost trends
- Understand when costs increased/decreased
- Revert to previous costs if needed
- Audit costing decisions

### Ingredient Cost Management

Keep ingredient costs current:

**Create a supplier price list**:
- Monthly price updates from suppliers
- Track cost trends
- Identify best-value suppliers

**Set cost update schedule**:
- Ask procurement to update costs weekly
- Review market indices for commodities (flour, butter, etc.)
- Set alerts for significant price changes

**Document cost changes**:
- Keep notes on why costs changed
- Track supplier performance
- Make data-driven procurement decisions

### Multi-Recipe Costing Strategy

If you have multiple products using the same ingredients:

1. Set ingredient costs once (used by all products)
2. Create different BOMs for different product variants
3. Assign appropriate routing to each BOM
4. Costing automatically reflects product differences

Example:
- **Bread-Regular**: 100 kg batch, 8-hour production
- **Bread-Premium**: 50 kg batch, 12-hour production
- Both use the same ingredients at the same cost
- Different recipes = different total costs and margins

---

## Related Resources

- **[API Reference](../../4-API/technical/bom-costing.md)** - For developers integrating costing into systems
- **[Bill of Materials Guide](bom-management.md)** - How to create and manage BOMs
- **[Routing Guide](routing-management.md)** - How to define production routings
- **[Product Setup](product-setup.md)** - How to configure products with pricing

---

## Frequently Asked Questions

**Q: How often should I recalculate costing?**
A: Only when data changes (ingredient costs, labor rates, operations change). Don't recalculate every load—cache results for 10 minutes.

**Q: Can I lock costs to protect against accidental changes?**
A: Not in this MVP version. Please document important cost calculations offline if needed. Cost locking is planned for a future release.

**Q: What if I need costs in a different currency?**
A: Currently, all costs use your organization's default currency. Multi-currency support is planned for a future release.

**Q: How do I compare standard cost to actual production cost?**
A: Use the variance analysis feature (available after production runs are complete) to compare actual costs from work orders to your standard costing.

**Q: Can I export the cost breakdown for reporting?**
A: Yes, click **[Export to CSV]** on the cost summary to download detailed breakdown for Excel or reporting systems.

**Q: My margin seems wrong—should I trust it?**
A: Ensure:
1. Ingredient costs are complete and current
2. Routing includes all operations
3. Labor rates reflect actual wages
4. Standard price on product is set correctly

If all are correct, the margin calculation is accurate.

**Q: What if I want to price based on different margin targets?**
A: The system shows actual margin achieved at your standard price. Adjust price upward if actual margin < target margin. Formula: `Minimum Price = Cost ÷ (1 - Target Margin %)`

**Q: How does scrap percentage work?**
A: It adjusts ingredient quantities upward to account for waste. Example: 50 kg flour with 2% scrap = system needs 50 × 1.02 = 51 kg flour to produce 50 kg finished product.

---

**Questions or problems?** Contact support with:
- Product code
- BOM ID
- Screenshot of the issue
