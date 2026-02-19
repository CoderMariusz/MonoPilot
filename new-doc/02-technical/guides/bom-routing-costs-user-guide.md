# BOM-Routing Costs User Guide

Story: 02.9 - BOM-Routing Costs

## Overview

This guide explains how to calculate and manage product costs using Bills of Materials (BOM) and production routings in MonoPilot. Understanding your product costs is essential for pricing, margin analysis, and profitability tracking.

## Table of Contents

1. [Understanding Cost Components](#understanding-cost-components)
2. [Viewing BOM Costs](#viewing-bom-costs)
3. [Recalculating Costs](#recalculating-costs)
4. [Setting Up Routing Costs](#setting-up-routing-costs)
5. [Managing Material Costs](#managing-material-costs)
6. [Cost Breakdown Analysis](#cost-breakdown-analysis)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Understanding Cost Components

MonoPilot calculates product costs from five components:

```
Total Product Cost
  |
  |-- Material Cost (ingredients from BOM)
  |   |-- Quantity x Unit Cost
  |   +-- Scrap Allowance
  |
  |-- Labor Cost (operations from routing)
  |   |-- Duration x Labor Rate
  |   +-- Cleanup Time x Labor Rate
  |
  |-- Setup Cost (fixed per batch)
  |
  |-- Working Cost (variable per unit)
  |
  +-- Overhead Cost (percentage of subtotal)
```

### Material Cost

The sum of all ingredient costs from your BOM, including scrap allowance.

**Example:**
- Flour: 25 kg x 12.50 PLN/kg = 312.50 PLN
- Sugar: 10 kg x 13.00 PLN/kg = 130.00 PLN
- **Material Total: 442.50 PLN**

### Labor Cost

The sum of all operation labor costs from your routing.

**Calculation:** (Duration + Cleanup Time) / 60 x Hourly Rate

**Example:**
- Mixing: (30 min + 10 min) / 60 x 75 PLN/hr = 50.00 PLN
- Baking: (45 min + 15 min) / 60 x 75 PLN/hr = 75.00 PLN
- **Labor Total: 125.00 PLN**

### Setup Cost

A fixed cost per production batch, configured on the routing. This covers equipment preparation, changeovers, and initial setup.

**Example:** 50 PLN per batch

### Working Cost

A variable cost per unit produced. This covers consumables, utilities, and other per-unit expenses.

**Example:** 0.75 PLN/unit x 100 units = 75.00 PLN

### Overhead Cost

A percentage applied to the subtotal (Material + Labor + Setup + Working). This covers facility costs, administration, and other indirect expenses.

**Example:** 10% of 692.50 PLN = 69.25 PLN

---

## Viewing BOM Costs

### Access BOM Cost Summary

1. Navigate to **Technical > BOMs**
2. Click on a BOM to open the detail view
3. Find the **Cost Summary** card on the right panel

### Cost Summary Card

The Cost Summary card displays:

- **Total Cost per Batch**: Complete cost for the BOM output quantity
- **Cost per Unit**: Total cost divided by output quantity
- **Cost Breakdown Chart**: Visual breakdown by component
- **Last Calculated**: Timestamp of the last calculation

### Understanding the Display

**Total Cost per Batch (100 kg)**
```
770.83 PLN
```

**Cost per Unit**
```
7.71 PLN/kg
```

**Breakdown Chart:**
- Material: 58.4% (450.25 PLN)
- Labor: 16.3% (125.50 PLN)
- Routing: 16.2% (125.00 PLN)
- Overhead: 9.1% (70.08 PLN)

---

## Recalculating Costs

Costs should be recalculated when:
- Ingredient prices change
- BOM quantities are updated
- Routing times are modified
- Routing cost parameters change

### When to Recalculate

MonoPilot shows a **Stale Cost Warning** when the calculation may be outdated:

```
[ ! ] Cost may be outdated. Ingredient prices or routing may have changed.
      [ Recalculate ]
```

### How to Recalculate

1. Open the BOM detail view
2. Find the Cost Summary card
3. Click **Recalculate** button
4. Wait for calculation to complete
5. Review updated costs

### What Happens During Recalculation

When you click Recalculate:

1. Current ingredient prices are fetched from the products table
2. Scrap percentages are applied to get effective quantities
3. Routing operations are processed for labor costs
4. Routing-level costs (setup, working, overhead) are applied
5. Total cost is saved to the product_costs table
6. Display updates with new values

### Automatic vs Manual Recalculation

MonoPilot does not automatically recalculate costs to avoid unexpected changes. You control when costs are updated by clicking Recalculate.

**Best Practice:** Recalculate costs weekly or whenever you notice the stale warning.

---

## Setting Up Routing Costs

Routing costs are configured at the routing level and apply to all BOMs using that routing.

### Access Routing Settings

1. Navigate to **Technical > Routings**
2. Click on a routing to open the detail view
3. Find the **Cost Configuration** section

### Configuring Cost Parameters

#### Setup Cost

Fixed cost per production batch.

**When to use:**
- Equipment changeover costs
- Initial quality checks
- Batch documentation

**Example:** A production line requires 30 minutes of setup at 100 PLN/hour = 50 PLN setup cost

#### Working Cost per Unit

Variable cost for each unit produced.

**When to use:**
- Consumable materials not in BOM (e.g., packaging)
- Utility costs per unit
- Wear-and-tear allowance

**Example:** Packaging costs 0.50 PLN per unit

#### Overhead Percent

Percentage of subtotal to add for indirect costs.

**When to use:**
- Facility costs allocation
- Administrative overhead
- General business expenses

**Common ranges:**
- Simple products: 5-10%
- Standard manufacturing: 10-20%
- Complex production: 20-30%

### Configuring Operation Labor Rates

Each routing operation has its own labor rate.

1. Open the routing detail view
2. Click on an operation to edit
3. Set the **Labor Cost per Hour** field
4. Save the operation

**Factors to consider:**
- Worker skill level required
- Number of workers for the operation
- Shift premiums (if applicable)

---

## Managing Material Costs

Material costs come from the products table. Each product has a **Cost per Unit** field.

### Updating Ingredient Prices

1. Navigate to **Technical > Products**
2. Find the ingredient product
3. Click to edit
4. Update the **Cost per Unit** field
5. Save

**Note:** Price changes do not automatically update existing BOM costs. You must recalculate each affected BOM.

### Scrap Percentages

Scrap percentage accounts for material loss during production.

**Example:**
- Required quantity: 100 kg
- Scrap percentage: 3%
- Effective quantity: 103 kg
- Extra cost: 3 kg x unit cost

### Setting Scrap Percentage

1. Open the BOM detail view
2. Click on a BOM item to edit
3. Set the **Scrap %** field
4. Save

**Common scrap rates:**
- Dry goods (flour, sugar): 1-2%
- Liquids: 2-3%
- Fragile items: 5-10%

---

## Cost Breakdown Analysis

### Material Breakdown

View which ingredients contribute most to cost:

```
Material Cost Breakdown
|-- Flour (FLOUR-001)
|   Qty: 25 kg | Scrap: 2% | Effective: 25.5 kg
|   Unit Cost: 12.50 PLN | Line: 318.75 PLN | 70.8%
|
|-- Sugar (SUGAR-001)
|   Qty: 10 kg | Scrap: 1% | Effective: 10.1 kg
|   Unit Cost: 13.00 PLN | Line: 131.50 PLN | 29.2%
```

### Operation Breakdown

View labor costs by operation:

```
Operation Cost Breakdown
|-- Mixing (Seq 10)
|   Duration: 30 min | Cleanup: 10 min
|   Rate: 75 PLN/hr | Cost: 50.00 PLN | 39.8%
|
|-- Baking (Seq 20)
|   Duration: 45 min | Cleanup: 15 min
|   Rate: 75 PLN/hr | Cost: 75.50 PLN | 60.2%
```

### Using Breakdown for Optimization

**High material cost?**
- Look for alternative suppliers
- Reduce scrap percentages
- Consider reformulation

**High labor cost?**
- Review operation durations
- Automate manual steps
- Optimize cleanup procedures

**High overhead?**
- Review facility utilization
- Consolidate production runs
- Negotiate utility rates

---

## Common Tasks

### Task: Calculate Cost for a New BOM

**Steps:**
1. Create the BOM with all items
2. Assign a routing to the BOM
3. Ensure all ingredients have cost_per_unit set
4. Ensure all operations have labor_cost_per_hour set
5. Open the BOM detail view
6. Click **Recalculate** in the Cost Summary card

### Task: Update Pricing After Supplier Price Change

**Scenario:** Your flour supplier increased prices by 10%

**Steps:**
1. Go to Technical > Products
2. Find and edit FLOUR-001
3. Update Cost per Unit from 12.50 to 13.75 PLN
4. Save the product
5. Go to Technical > BOMs
6. Open each BOM using flour
7. Click **Recalculate** on each BOM

### Task: Add Overhead to All Products

**Scenario:** You want to add 15% overhead to all products

**Steps:**
1. Go to Technical > Routings
2. For each routing:
   - Open routing detail
   - Set Overhead Percent to 15
   - Save
3. Go to Technical > BOMs
4. Recalculate each BOM

### Task: Compare Costs Between BOM Versions

**Scenario:** You have two formulations and want to compare costs

**Steps:**
1. Open BOM version 1
2. Note the total cost (e.g., 750 PLN)
3. Open BOM version 2
4. Note the total cost (e.g., 820 PLN)
5. Calculate difference: 820 - 750 = 70 PLN (9.3% higher)

### Task: Identify Most Expensive Ingredient

**Steps:**
1. Open the BOM detail view
2. Expand the Material Breakdown section
3. Sort by percentage (highest first)
4. The top item is your highest-cost ingredient

---

## Troubleshooting

### Issue: "No cost data available"

**Cause:** The BOM has never been calculated or the BOM is missing required data.

**Solution:**
1. Check that the BOM has a routing assigned
2. Check that all BOM items have products with cost_per_unit
3. Click **Recalculate** to generate cost data

### Issue: Material cost shows 0

**Cause:** Ingredient products have no cost_per_unit set.

**Solution:**
1. Go to Technical > Products
2. Edit each ingredient used in the BOM
3. Set the Cost per Unit field
4. Recalculate the BOM

### Issue: Labor cost shows 0

**Cause:** Routing operations have no labor_cost_per_hour set.

**Solution:**
1. Go to Technical > Routings
2. Open the routing used by the BOM
3. Edit each operation
4. Set the Labor Cost per Hour field
5. Recalculate the BOM

### Issue: Setup/Working/Overhead costs show 0

**Cause:** Routing cost parameters are not configured.

**Solution:**
1. Go to Technical > Routings
2. Open the routing used by the BOM
3. Set Setup Cost, Working Cost per Unit, and/or Overhead Percent
4. Recalculate the BOM

### Issue: Cost seems wrong after recalculation

**Solution:**
1. Verify ingredient prices in Products
2. Verify BOM quantities and scrap percentages
3. Verify operation durations and labor rates
4. Verify routing cost parameters
5. Recalculate again
6. Compare each component to expected values

### Issue: "Stale cost" warning keeps appearing

**Cause:** Underlying data (prices, quantities, times) has changed since last calculation.

**Solution:**
1. Click Recalculate to update
2. The warning will disappear after recalculation
3. Consider establishing a regular recalculation schedule

---

## Best Practices

### Cost Accuracy

1. **Update prices regularly**: Review and update ingredient prices monthly
2. **Verify scrap rates**: Track actual scrap and adjust percentages
3. **Audit labor times**: Compare actual production times to estimates
4. **Review overhead**: Ensure overhead percentage reflects actual costs

### Cost Management

1. **Track cost trends**: Export costs periodically for analysis
2. **Set cost targets**: Establish target costs for products
3. **Monitor variances**: Compare calculated to actual costs
4. **Document assumptions**: Note why specific rates were chosen

### Process Integration

1. **Recalculate after BOM changes**: Always recalculate when modifying BOMs
2. **Update before pricing decisions**: Ensure costs are current for quotes
3. **Include in new product process**: Calculate costs before launch
4. **Regular cost reviews**: Schedule monthly or quarterly cost reviews

---

## See Also

- [BOM-Routing Costs API Reference](../../api/bom-routing-costs-api.md) - Technical API documentation
- [BOM Management](./bom-management.md) - Creating and managing BOMs
- [Routing Configuration](./routing-configuration.md) - Setting up production routings

---

## Version History

### v1.0 (2026-01-14)

- Initial release
- Material, labor, setup, working, and overhead cost components
- Scrap percentage support
- Cost breakdown by material and operation
- Recalculate functionality
- Stale cost warnings
