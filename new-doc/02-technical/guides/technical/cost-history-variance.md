# User Guide: Cost History & Variance Analysis

**Feature**: Cost History & Variance Analysis (Story 02.15)
**Module**: Technical - Costing
**Audience**: Production Managers, Planners, Finance Managers
**Last Updated**: December 30, 2025

---

## Overview

The Cost History & Variance Analysis feature helps you track how your product costs change over time and compare what you planned to spend against what you actually spent during production. This guide shows you how to view trends, analyze what's driving cost changes, and export reports for decision-making.

**Key Capabilities:**
- View cost history with interactive trends
- Identify what components (materials, labor, overhead) are increasing or decreasing
- Compare standard costs to actual production costs
- Export cost data in multiple formats
- Spot variances that exceed acceptable thresholds

---

## Accessing Cost History

### Step 1: Navigate to a Product
1. Click **Technical** in the main navigation
2. Click **Products** to view your product list
3. Click the product name (e.g., "Bread Loaf White") to open its costing page
4. At the top of the costing page, click the **"View Cost History"** link or **History** tab

### Step 2: View Current Cost Summary

Once you're on the Cost History page, you immediately see:

| Field | Description | Example |
|-------|-------------|---------|
| **Current Total Cost** | Latest cost per unit with the date | $2.46/kg (as of 2025-12-10) |
| **Previous Cost** | Cost from the last calculation | $2.38/kg (2025-11-15) |
| **Change** | Absolute and percentage change | +$0.08 (+3.4%) |
| **30-Day Trend** | Cost movement over last month | +2.1% |
| **90-Day Trend** | Cost movement over last 3 months | +5.8% |
| **Year-to-Date** | Cost movement since January 1st | +12.3% |

**What the arrows mean:**
- **▲ Up arrow** = Cost increased
- **▼ Down arrow** = Cost decreased
- **→ No arrow** = No change (0%)

### Step 3: Understand the Trend Arrows

The trend arrows help you quickly spot cost movements:

```
30-Day Trend: +2.1% ▲  (costs going up short-term)
90-Day Trend: -5.8% ▼  (costs going down medium-term)
Year-to-Date: +12.3% ▲ (higher costs this year)
```

**What this means for your product "Bread Loaf White":**
- Short-term costs are rising slightly (2.1% in 30 days)
- Medium-term has improved (-5.8% in 90 days)
- But yearly costs are up significantly (+12.3% YTD)

---

## Working with the Cost Trend Chart

The interactive chart shows your cost movements visually over time.

### How to Read the Chart

**Chart axes:**
- **Y-axis (vertical)** = Cost per unit in dollars/euros/local currency
- **X-axis (horizontal)** = Time periods (months shown for 12-month view)

**Lines on the chart:**
- **Blue line** = Total cost (always shown)
- **Green line** = Material costs
- **Orange line** = Labor costs
- **Purple line** = Overhead costs

### Show/Hide Components

You can focus on specific cost components by toggling them on/off:

1. Look at the **Filters** section above the chart
2. Check/uncheck boxes for:
   - Material
   - Labor
   - Overhead
3. The chart updates instantly to show only what you selected

**Use case:** "I only want to see material cost trends this quarter" → Uncheck Labor and Overhead, keep only Material checked.

### Hover Over Data Points

Move your mouse over any dot on the chart to see detailed information:

```
Cost Breakdown - March 15, 2025

Material Cost:    $161.60 (74.1%)
Labor Cost:       $40.00  (18.3%)
Overhead Cost:    $16.50  (7.6%)
─────────────────────────
Total Cost:       $218.10 (100%)

Cost per Unit:    $2.18/kg
Change from Previous:  +$1.32 (+0.6%) ▲

BOM Version: v4 | Calculated by: System
[Click for Full Detail →]
```

**What this tells you:**
- **Percentages** show each component's share of total cost
- **Cost per Unit** helps you price your products
- **Change from Previous** shows if this period was better or worse than the last
- Click the link to see the full cost calculation details

### Click on Data Points

Click any data point to view the detailed cost calculation for that specific date. This shows:
- Exact ingredient costs
- Labor breakdown by operation
- Overhead allocation method
- Who calculated the cost and when

---

## Filtering Your Cost History

### By Date Range

1. Find the **Date Range** section in the Filters area
2. Click the **From** date field and select your start date
3. Click the **To** date field and select your end date
4. The chart and table update automatically

**Quick filters:**
- Last 30 days = Today to 30 days ago
- Last 90 days = Today to 90 days ago
- Last 12 months = Today to same date last year
- Custom = Your selected dates

### By Cost Type

Some products may have different cost types:

1. Find the **Cost Type** dropdown
2. Select from:
   - **All** = Show all cost calculations (default)
   - **Standard** = Planned/budgeted costs only
   - **Actual** = Real production costs only
   - **Planned** = Forecast costs only

### Reset to Defaults

Click **[Reset Filters]** to return to the default view:
- Last 12 months of data
- All cost types
- All components visible

---

## Understanding Cost Component Breakdown

This table shows what each component costs and how they've changed:

| Component | Current | 3 Months Ago | Change | % of Total |
|-----------|---------|--------------|--------|-----------|
| Material | $185.50 | $178.20 | +$7.30 (+4.1%) ▲ | 75.6% |
| Labor | $42.00 | $41.50 | +$0.50 (+1.2%) ▲ | 17.1% |
| Overhead | $18.00 | $17.80 | +$0.20 (+1.1%) ▲ | 7.3% |
| **Total** | **$245.50** | **$237.50** | **+$8.00 (+3.4%) ▲** | **100%** |

**How to interpret:**
- **Material dominates** at 75.6% of cost (most cost comes from ingredients)
- **Labor is second** at 17.1% (production time matters)
- **Overhead is smallest** at 7.3% (facility costs)
- **All components are up** compared to 3 months ago

**When to act:**
- If material is up >5%, consider sourcing alternatives
- If labor is up >5%, review production efficiency
- If overhead is up >5%, check facility costs or capacity utilization

---

## Identifying Top Cost Drivers

This section shows which ingredients have the biggest impact on your total cost changes:

| Ingredient | Current | 3 Months Ago | Change | Impact on Total |
|-----------|---------|--------------|--------|-----------------|
| Butter | $52.00 | $48.00 | +$4.00 (+8.3%) ▲ | +1.6% of total increase |
| Flour Type 550 | $42.50 | $40.50 | +$2.00 (+4.9%) ▲ | +0.8% of total increase |
| Milk Powder | $32.80 | $31.20 | +$1.60 (+5.1%) ▲ | +0.7% of total increase |
| Yeast Fresh | $24.00 | $24.50 | -$0.50 (-2.0%) ▼ | -0.2% of total decrease |
| Other (6 items) | $34.20 | $33.80 | +$0.40 (+1.2%) ▲ | +0.2% of total increase |

**Key insight:** "Biggest Driver: Butter (+$4.00, accounts for 50% of total increase)"

**How to use this:**
1. **Focus on the biggest drivers** → Butter is changing the most
2. **Negotiate with suppliers** → If Butter costs are up, talk to your butter supplier
3. **Find alternatives** → Consider different butter brands or substitute ingredients
4. **Small wins add up** → Even 2% savings on Flour could help

---

## Cost History Table

This table shows every cost calculation for your product in chronological order:

| Date | Type | Material | Labor | Overhead | Total | Change |
|------|------|----------|-------|----------|-------|--------|
| 2025-12-10 | Standard | $185.50 | $42.00 | $18.00 | $245.50 | +3.4% ▲ |
| 2025-11-15 | Standard | $178.20 | $41.50 | $17.80 | $237.50 | +2.1% ▲ |
| 2025-10-20 | Standard | $174.80 | $41.50 | $17.50 | $233.80 | +1.2% ▲ |

### Search and Sort

1. **Search:** Use the search box to find records by date or type
2. **Filter columns:** Click **[Columns ▼]** to show/hide specific columns
3. **Sort:** Click column headers to sort ascending/descending
4. **Pagination:** Use the dropdown to show 10, 25, 50, or 100 records per page

### Click on a Row

Click any row to view the complete cost calculation with:
- Full ingredient breakdown
- Labor operations and times
- Overhead allocation details
- Who made the calculation and when

---

## Variance Analysis: Actual vs Standard Costs

This section compares what you planned to spend (standard) against what you actually spent during production.

### Understanding Variance

A variance is the **difference between planned and actual costs**:

- **Positive variance** (▲) = You spent MORE than planned
- **Negative variance** (▼) = You spent LESS than planned
- **Zero variance** (→) = You spent exactly as planned

### Example Variance Report

**Period:** Last 30 Days
**Work Orders Analyzed:** 12 production runs

| Component | Standard | Actual | Variance | % Variance |
|-----------|----------|--------|----------|------------|
| Material | $185.50 | $188.20 | +$2.70 | +1.5% ▲ |
| Labor | $42.00 | $45.30 | +$3.30 | +7.9% ▲ |
| Overhead | $18.00 | $17.85 | -$0.15 | -0.8% ▼ |
| **Total** | **$245.50** | **$251.35** | **+$5.85** | **+2.4% ▲** |

**Significant variances (>5%):**
- ⚠️ Labor Cost: +7.9% (flagged because it exceeds 5% threshold)

### What This Means

**Material (+1.5%):** Minor overage. You spent slightly more on ingredients than budgeted. Common causes:
- Ingredient prices increased
- Slightly more waste than expected
- Different ingredient sources used

**Labor (+7.9%):** Significant overage! You spent 7.9% more on labor than planned. This needs investigation:
- Production took longer than standard
- More overtime than expected
- New staff training overhead
- Equipment issues slowing production

**Overhead (-0.8%):** Good news! Overhead came in slightly under budget.

**Total (+2.4%):** Overall, production costs were 2.4% higher than planned. With 12 work orders analyzed, this accounts for real production data.

---

## When to Change Your Standard Costs

You should update your standard costs when variances become consistent:

**Red flags for standard cost update:**
- Variance >5% for 2-3 consecutive weeks
- New baseline established (cost has increased permanently)
- Supplier prices changed
- Production process changed

**Process to update:**
1. Go to **Technical > Costing > Cost Calculation**
2. Click the product name
3. Update the ingredient costs or labor rates
4. Recalculate and save as new standard
5. The Cost History page will show the new baseline

---

## Exporting Cost History

### Export to CSV (Spreadsheet)

Use this to analyze data in Excel, Google Sheets, or other tools.

1. Click **[Export to CSV]** button
2. In the export dialog:
   - **Format:** CSV (Spreadsheet)
   - **Data to include:** Select what you want
     - ☑ Cost History Table
     - ☑ Cost Component Breakdown
     - ☑ Top Cost Drivers
     - ☑ Variance Analysis (if available)
   - **Date Range:** Uses your current filter
   - **Filename:** Auto-generated (e.g., `cost-history-BREAD-001-2025-12-14.csv`)
3. Click **[Download Export]**

**CSV format example:**
```
Date,Type,Material,Labor,Overhead,Total,Change,%Change
2025-12-10,Standard,185.50,42.00,18.00,245.50,8.00,3.4
2025-11-15,Standard,178.20,41.50,17.80,237.50,5.00,2.1
```

### Export to PDF (Full Report)

Creates a formatted report with charts and tables, good for printing or sharing with stakeholders.

1. Click **[Download Full Report (PDF)]**
2. The report includes:
   - Cost summary page
   - Trend chart with data
   - Component breakdown tables
   - Variance analysis
   - Cost driver analysis

### Export to PNG (Chart Only)

Extracts just the trend chart as an image for presentations or reports.

1. Click **[Export Chart as PNG]**
2. The image is 1200x600 pixels with transparent background
3. Good for: Presentations, emails, reports

### Export to Excel (Multi-sheet)

Professional format for detailed analysis.

1. Click **[Export]**, select Excel format
2. Includes multiple sheets:
   - **Summary:** Cost overview and trends
   - **History:** Full cost history table
   - **Breakdowns:** Component and driver analysis
   - **Charts:** Chart images and raw data

---

## Common Scenarios

### Scenario 1: "My costs keep going up. How do I fix it?"

**Steps:**
1. Go to Cost History page for the product
2. Click **Top Cost Drivers** section
3. Identify which ingredient(s) are increasing
4. Contact those suppliers to negotiate lower prices
5. If prices won't drop, consider alternatives or reformulations

**Track improvement:**
- Export history monthly
- Chart the trend
- See when negotiations took effect

### Scenario 2: "Production is over budget. Where's the problem?"

**Steps:**
1. Go to Variance Analysis section
2. Look for ⚠️ warnings (variances >5%)
3. Labor variance high? → Check production times, equipment issues
4. Material variance high? → Check ingredient waste, pricing changes
5. Click **[View Detailed Variance Report]** for work order breakdown

**Next action:**
- Implement corrective actions
- Track if next period's variance improves
- Update standard costs if new baseline is permanent

### Scenario 3: "I need to present costs to management"

**Steps:**
1. Open Cost History page
2. Set date range to desired period
3. Click **[Export Chart as PNG]** for presentation slide
4. Click **[Download Full Report (PDF)]** for detailed report
5. Use in PowerPoint, presentations, or board meetings

---

## Mobile App Notes

On tablets and phones, the interface adjusts:
- Sections stack vertically (chart above table)
- Touch-friendly buttons (larger targets)
- Swipe to navigate between tables
- Collapse/expand sections to focus on one at a time

---

## Troubleshooting

### "No Cost History Available"

This means the product hasn't been priced yet.

**Solution:**
1. Go to **Technical > Costing > Cost Calculation**
2. Select your product
3. Enter ingredient costs and labor rates
4. Click **Calculate** and **Save**
5. Return to Cost History page (now it will show data)

### "No Variance Data Available"

This means no production has run yet for this product.

**Solution:**
1. Go to **Production > Work Orders**
2. Create and complete a work order for this product
3. Return to Cost History page
4. Variance Analysis section will populate after work orders complete

### Chart Not Loading

Try these steps:
1. Refresh the page (F5 or browser refresh button)
2. Check internet connection
3. Clear browser cache
4. Try a different browser
5. Contact support if still failing

### Export Not Downloading

Try these steps:
1. Check that your browser isn't blocking downloads
2. Allow downloads from this website in browser settings
3. Try a different file format
4. Check your Downloads folder (file may have downloaded)

---

## Performance Tips

### Working with Large Date Ranges

If you have years of history, queries may slow down:
- Use date range filters to narrow to 6-12 months
- Export to Excel for analysis rather than viewing 5 years of data
- Use table pagination (show 25 items per page instead of 100)

### Before Exporting Large Reports

- Set filters to your desired date range first
- Check the file size estimate before downloading
- PDF reports are 5-10 MB depending on data size
- Consider exporting to CSV for large datasets (smaller files)

---

## Best Practices

1. **Review monthly:** Set a calendar reminder to check cost trends
2. **Act on variances:** Don't wait - investigate >5% variances immediately
3. **Compare periods:** Always look at 30d vs 90d vs YTD for context
4. **Document changes:** When you update costs or make supplier changes, note the date
5. **Export baseline:** Save monthly exports to track trends year over year
6. **Involve team:** Share variance reports with production team to identify root causes

---

## Getting Help

**In the system:** Each page has a help icon (?) with contextual guidance

**Contact support:** Click **Help** > **Contact Support** to report issues

**User community:** Check the FAQ for common questions

---

## See Also

- **Recipe Costing** - How to calculate and update standard costs
- **Production Dashboard** - Track actual costs during production
- **Finance Reports** - Company-wide cost and profit analysis
- **Ingredient Management** - Update ingredient costs and suppliers

