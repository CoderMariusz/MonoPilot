# Cost History & Variance Analysis - User Guide

Story: 02.15 - Cost History + Variance

## Overview

This guide explains how to use MonoPilot's Cost History & Variance Analysis features to track product costs over time, identify trends, and analyze production variances. Understanding cost patterns helps you make informed decisions about pricing, sourcing, and production efficiency.

## Table of Contents

1. [Accessing Cost History](#accessing-cost-history)
2. [Understanding the Cost Summary](#understanding-the-cost-summary)
3. [Reading Cost Trends](#reading-cost-trends)
4. [Analyzing Component Breakdown](#analyzing-component-breakdown)
5. [Identifying Cost Drivers](#identifying-cost-drivers)
6. [Using Variance Analysis](#using-variance-analysis)
7. [Filtering and Exporting](#filtering-and-exporting)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Accessing Cost History

### Navigate to Cost History

1. Go to **Technical** in the main menu
2. Select **Costing**
3. Find your product in the product list
4. Click on the product row to open details
5. Click **View History** button

**Alternative path**:
- URL: `/technical/costing/products/{product-id}/history`

### What You See

The Cost History page displays:

```
+--------------------------------------------------+
|  Cost History & Trends: Chocolate Chip Cookie    |
|  SKU: FG-001                                     |
+--------------------------------------------------+
|  [Cost Summary Card]                             |
|  Current Cost: $12.50  |  Change: +5.93%         |
|  30d Trend: +2.5%  | 90d: +8.2%  | YTD: +12.5%   |
+--------------------------------------------------+
|  [Filters Bar]                                   |
|  Date Range: [Jan 1] to [Jan 31]                 |
|  Cost Type: [Standard v]  Components: [All]      |
+--------------------------------------------------+
|  [Cost Trend Chart]                              |
|  Line graph showing cost over time               |
+--------------------------------------------------+
|  [Component Breakdown]    |  [Cost Drivers]      |
|  Material: 68%            |  1. Chocolate +16.7% |
|  Labor: 16%               |  2. Flour +11.1%     |
|  Overhead: 16%            |  3. Sugar +5.2%      |
+--------------------------------------------------+
|  [Cost History Table]                            |
|  Date       | Type     | Total    | Change       |
|  Jan 15     | Standard | $12.50   | +5.93%       |
|  Dec 20     | Standard | $11.80   | +2.1%        |
+--------------------------------------------------+
|  [Variance Analysis Section]                     |
|  Period: [30 days v]                             |
|  Work Orders Analyzed: 15                        |
|  Significant Variances: Material +8.47%          |
+--------------------------------------------------+
```

---

## Understanding the Cost Summary

### Current Cost Card

The summary card at the top shows key cost metrics:

| Metric | Description | Example |
|--------|-------------|---------|
| **Current Cost** | Most recent cost calculation | $12.50 |
| **Cost Per Unit** | Cost divided by batch size | $0.25 |
| **Previous Cost** | Last cost before current | $11.80 |
| **Change Amount** | Dollar difference | +$0.70 |
| **Change Percentage** | Percentage difference | +5.93% |

### How Changes Are Calculated

```
Change Amount = Current Cost - Previous Cost
Change Percentage = (Change Amount / Previous Cost) x 100

Example:
Current: $12.50
Previous: $11.80
Change Amount: $12.50 - $11.80 = $0.70
Change Percentage: ($0.70 / $11.80) x 100 = 5.93%
```

### What the Colors Mean

- **Green**: Cost decreased (favorable)
- **Red**: Cost increased (unfavorable)
- **Gray**: No change or insufficient data

---

## Reading Cost Trends

### Trend Periods

MonoPilot calculates three trend periods automatically:

| Period | What It Shows | Use Case |
|--------|---------------|----------|
| **30-Day** | Recent short-term trend | Detect immediate price changes |
| **90-Day** | Quarter trend | Seasonal patterns |
| **Year-to-Date** | Annual performance | Budget vs actual |

### How Trends Are Calculated

Trends compare the oldest cost to the newest cost within each period:

```
Trend Percentage = ((Newest - Oldest) / Oldest) x 100

Example (30-day):
Oldest cost (Jan 1): $11.50
Newest cost (Jan 30): $12.50
Trend: (($12.50 - $11.50) / $11.50) x 100 = 8.7%
```

### Interpreting Trends

| Trend | Meaning | Action |
|-------|---------|--------|
| **+10% or more** | Significant increase | Investigate cost drivers |
| **+5% to +10%** | Moderate increase | Monitor closely |
| **-5% to +5%** | Stable | Normal operation |
| **-5% to -10%** | Moderate decrease | Good - verify quality maintained |
| **-10% or more** | Significant decrease | Excellent - document what changed |

### Limited Data Warning

If fewer than 3 data points exist:
- Trend chart is hidden
- Blue info banner appears: "Limited Data: Only X cost calculations available"
- More costing calculations are needed for trend analysis

---

## Analyzing Component Breakdown

### The Three Cost Components

Every product cost is broken into:

| Component | What It Includes | Typical % |
|-----------|------------------|-----------|
| **Material** | Raw ingredients, packaging | 50-70% |
| **Labor** | Direct labor for production | 15-25% |
| **Overhead** | Facility, utilities, equipment | 10-20% |

### Reading the Breakdown Table

```
Component Breakdown (vs Previous Period)
+------------+---------+----------+---------+
| Component  | Current | Previous | Change  |
+------------+---------+----------+---------+
| Material   | $8.50   | $8.00    | +6.25%  |
| Labor      | $2.00   | $1.90    | +5.26%  |
| Overhead   | $2.00   | $1.90    | +5.26%  |
| Total      | $12.50  | $11.80   | +5.93%  |
+------------+---------+----------+---------+
```

### Comparison Period Options

Select the comparison period using the dropdown:

| Option | Compares To |
|--------|-------------|
| **1 month** | Previous month's cost |
| **3 months** | Cost from 3 months ago |
| **6 months** | Cost from 6 months ago |
| **1 year** | Cost from 1 year ago |

### What to Look For

1. **Material dominating increases**: Check ingredient prices
2. **Labor increases**: Review production efficiency, wage changes
3. **Overhead increases**: Check utility costs, equipment depreciation
4. **Uneven changes**: If one component jumps while others stay flat, focus investigation there

---

## Identifying Cost Drivers

### What Are Cost Drivers?

Cost drivers are the ingredients that have the biggest impact on your product's cost changes. MonoPilot shows the top 5 drivers sorted by impact.

### Reading the Cost Drivers Panel

```
Top Cost Drivers
+------------------------+----------+--------+--------+
| Ingredient             | Change $ | Change% | Impact |
+------------------------+----------+--------+--------+
| Premium Chocolate Chips| +$0.50   | +16.7% | 45.5%  |
| Organic Flour          | +$0.20   | +11.1% | 28.3%  |
| Brown Sugar            | +$0.10   | +5.2%  | 14.2%  |
| Vanilla Extract        | +$0.05   | +3.1%  | 7.0%   |
| Butter                 | +$0.03   | +2.0%  | 5.0%   |
+------------------------+----------+--------+--------+
```

### Understanding Impact Percentage

Impact shows what percentage of total cost change each ingredient is responsible for:

```
Impact = (Ingredient Change / Total Change) x 100

Example:
Total cost increased by $0.70
Chocolate chips increased by $0.50
Impact: ($0.50 / $0.70) x 100 = 71.4%

This means chocolate chips are responsible for 71.4% of the cost increase.
```

### Using Cost Drivers

When you see a significant cost increase:

1. Check the top 2-3 drivers (usually account for 70%+ of change)
2. Investigate those specific ingredients:
   - Did supplier prices change?
   - Did you switch suppliers?
   - Is there a market shortage?
3. Consider alternatives:
   - Substitute ingredients
   - Renegotiate supplier contracts
   - Adjust batch sizes

---

## Using Variance Analysis

### What Is Variance Analysis?

Variance analysis compares your **standard costs** (what you expect to pay) against **actual costs** (what you actually paid during production).

### The Variance Section

Located at the bottom of the Cost History page:

```
Variance Analysis
+--------------------------------------------------+
| Period: [7 days] [30 days] [90 days] [365 days]  |
+--------------------------------------------------+
| Work Orders Analyzed: 15                          |
+--------------------------------------------------+
| Component  | Standard | Actual  | Variance        |
+--------------------------------------------------+
| Material   | $8.50    | $9.22   | +$0.72 (+8.47%) |
| Labor      | $2.00    | $2.15   | +$0.15 (+7.50%) |
| Overhead   | $2.00    | $1.95   | -$0.05 (-2.50%) |
| Total      | $12.50   | $13.32  | +$0.82 (+6.56%) |
+--------------------------------------------------+
| Significant Variances:                            |
| [!] Material: 8.47% over budget (threshold: 5%)   |
| [!] Labor: 7.50% over budget (threshold: 5%)      |
+--------------------------------------------------+
```

### Period Selection

Choose how far back to analyze:

| Period | Best For |
|--------|----------|
| **7 days** | Recent production issues |
| **30 days** | Monthly review |
| **90 days** | Quarterly analysis |
| **365 days** | Annual review |

### Variance Types

| Variance | Direction | Meaning | Color |
|----------|-----------|---------|-------|
| **Positive** | Over | Actual exceeded standard | Red |
| **Negative** | Under | Actual below standard | Green |
| **Zero** | On target | Matched standard | Gray |

### Significant Variance Threshold

By default, variances above **5%** are flagged as significant. These appear:
- In the "Significant Variances" list
- With warning icons
- Highlighted in the table

### Investigating Variances

When you see significant variances:

1. **Material variance high**:
   - Check if ingredient prices changed
   - Review waste during production
   - Verify BOM quantities are accurate

2. **Labor variance high**:
   - Check production times vs routing
   - Review overtime or staffing changes
   - Look for equipment slowdowns

3. **Overhead variance high**:
   - Check utility costs
   - Review equipment maintenance costs
   - Verify allocation method

---

## Filtering and Exporting

### Using Filters

The filter bar allows you to customize the view:

**Date Range**:
- Click the date fields to select start and end dates
- Filters history to show only records within range
- Trends recalculate based on filtered data

**Cost Type**:
| Option | Shows |
|--------|-------|
| **All** | All cost types |
| **Standard** | Expected/budgeted costs |
| **Actual** | Real production costs |
| **Planned** | Forecast costs |

**Components**:
Toggle which components appear in the chart:
- Material (checked by default)
- Labor (checked by default)
- Overhead (checked by default)
- Total (always shown)

### Export Options

Click the **Export** button to download data:

| Format | Best For |
|--------|----------|
| **CSV** | Spreadsheet analysis, import to other systems |
| **PDF** | Reports, printing, sharing |
| **PNG** | Presentations, documents |
| **Excel** | Advanced analysis with formulas |

**Note**: Export includes the filtered data based on current settings.

### Reset Filters

Click **Reset** to clear all filters and return to default view.

---

## Common Tasks

### Task: Find Why Costs Increased This Month

1. Go to Cost History for the product
2. Set date range to current month
3. Look at the **Cost Summary** for change percentage
4. Check **Cost Drivers** panel for top contributors
5. Review **Component Breakdown** to see which component increased most

**Example findings**:
- "Material increased 8%, driven by chocolate chips (+16.7%)"
- "Labor increased 5% due to new overtime policy"

### Task: Compare Quarter-Over-Quarter

1. Set **Comparison Period** dropdown to "3 months"
2. View the **Component Breakdown** table
3. Note changes column shows 3-month comparison
4. Export data if needed for reporting

### Task: Check Production Efficiency

1. Scroll to **Variance Analysis** section
2. Select "30 days" period
3. Look at **Labor** variance
4. If significantly over:
   - Check routing times vs actual
   - Review work order completion times
   - Look for equipment issues

### Task: Identify Sourcing Opportunities

1. View **Cost Drivers** panel
2. Note ingredients with highest change %
3. For each high-change ingredient:
   - Check current supplier pricing
   - Request quotes from alternatives
   - Consider bulk purchasing

### Task: Prepare Monthly Cost Report

1. Set date filter to last month
2. Review Cost Summary card
3. Check all trend percentages
4. Note any significant variances
5. Click **Export** and select PDF
6. Report includes:
   - Summary metrics
   - Trend charts
   - Component breakdown
   - Cost drivers
   - Variance analysis

---

## Troubleshooting

### Issue: "No Cost History Available"

**Cause**: Product has no cost calculations

**Solution**:
1. Go to Recipe Costing for this product
2. Calculate the cost at least once
3. Return to Cost History
4. Data should now appear

### Issue: Trends Show 0%

**Cause**: Only one data point or all costs are the same

**Check**:
1. How many records in history table?
2. If only 1: Need more cost calculations
3. If multiple but same value: Costs haven't changed

### Issue: Component Breakdown Shows All Zeros

**Cause**: BOM or routing not configured

**Solution**:
1. Verify BOM exists for product
2. Check that BOM items have costs
3. Verify routing operations have labor rates
4. Recalculate product cost

### Issue: Variance Analysis Shows "0 Work Orders"

**Cause**: No production data in selected period

**Check**:
1. Are there completed work orders for this product?
2. Is the period selection correct?
3. Try extending period to 90 or 365 days

### Issue: Cost Drivers Panel Is Empty

**Cause**: No BOM or BOM items without costs

**Solution**:
1. Check product has an active BOM
2. Verify BOM items have cost_per_unit set
3. Ensure BOM status is "active"

### Issue: Data Doesn't Match Finance Reports

**Possible causes**:
1. **Date range mismatch**: Ensure same date filters
2. **Cost type difference**: Check if using standard vs actual
3. **Currency conversion**: Verify same currency basis
4. **Rounding differences**: System uses 4 decimal places

---

## Tips & Best Practices

### For Cost Analysts

1. **Review weekly**: Check 7-day trends for early detection
2. **Document changes**: When you update costs, add notes explaining why
3. **Set benchmarks**: Know your target % for each component
4. **Track seasonality**: Some ingredients have seasonal price patterns

### For Production Managers

1. **Monitor variance**: High variance means production isn't matching plan
2. **Investigate immediately**: Don't let variances compound
3. **Update routing**: If process changes, update standard times
4. **Report anomalies**: Unusual waste or rework should be flagged

### For Finance/Accounting

1. **Monthly reconciliation**: Compare system costs to actual invoices
2. **Budget accuracy**: Use trends to improve forecasts
3. **Margin analysis**: Track cost % of selling price over time
4. **Audit trail**: Export data for records

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modals |
| `Enter` | Apply filters |
| `Tab` | Navigate between fields |

---

## See Also

- [Cost History & Variance API Reference](../../api/technical/cost-history-variance-api.md) - Technical API documentation
- [Recipe Costing Guide](./recipe-costing-guide.md) - How to calculate product costs
- [BOM Management Guide](./bom-management-guide.md) - Managing Bills of Materials

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review your product's BOM and routing setup
3. Verify cost calculations are up to date
4. Contact your system administrator

---

## Version History

### v1.0 (2026-01-14)

- Initial release
- Cost history viewing with trends
- Component breakdown analysis
- Cost driver identification
- Variance analysis with thresholds
- Export functionality
