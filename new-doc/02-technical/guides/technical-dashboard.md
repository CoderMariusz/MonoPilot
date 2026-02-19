# Technical Dashboard User Guide

**Story**: 02.12 - Technical Dashboard: Stats, Charts & Allergen Matrix
**Module**: Technical
**Status**: Production Ready
**Last Updated**: 2025-12-28

## Welcome to the Technical Dashboard

The Technical Dashboard provides at-a-glance insights into your product catalog, allergen compliance, formulation history, recent changes, and cost trends. Use it to monitor product lifecycle operations and identify areas for improvement.

---

## Dashboard Overview

When you navigate to **Technical > Dashboard**, you'll see six main sections:

1. **Stats Cards** - Quick metrics for products, BOMs, routings, and costs
2. **Allergen Compliance Matrix** - Product-allergen relationships at a glance
3. **BOM Timeline** - History of BOM version changes
4. **Recent Activity** - Last 10 changes across your technical data
5. **Cost Trends** - 6-month cost analysis by category
6. **Quick Actions** - Buttons to create new items

---

## Stats Cards

### Four Quick Metrics

At the top of your dashboard, you'll see four cards showing key numbers:

| Card | Shows | Click To |
|------|-------|----------|
| **Products** | Total active products | Go to Products list |
| **BOMs** | Total Bill of Materials | Go to BOMs list |
| **Routings** | Total production routings | Go to Routings list |
| **Avg Cost** | Average product cost + trend | Go to cost history |

### Understanding the Cards

- **Number**: The metric value (e.g., "247")
- **Trend Arrow**: Green (up) or red (down) shows month-over-month change
- **Percentage**: How much the metric changed in last 30 days

### Example

If "Products" card shows 247 with a green "up" arrow and "5.2%", that means:
- You have 247 active products
- You added 5.2% more products in the last month compared to the previous month

---

## Allergen Compliance Matrix

### What It Shows

A color-coded grid with:
- **Rows**: Your products (Raw Materials, WIP, Finished Goods)
- **Columns**: Allergen names (Milk, Tree Nuts, Shellfish, etc.)
- **Cells**: Color indicates relationship

### Color Legend

| Color | Meaning | Action |
|-------|---------|--------|
| **Red** | Contains allergen | Must declare on label |
| **Yellow** | May contain traces | Best practice to declare |
| **Green** | Free from allergen | Safe for allergen-sensitive customers |

### How to Use

1. **Scan for Red Cells**: Ensure all your finished goods are properly declared
2. **Review Yellow Cells**: Consider declaring if high-risk processing
3. **Filter by Product Type**: Click dropdown to show only RM, WIP, or FG

### Example Workflow

You want to ensure Product "YOGURT-001" is safe for milk-free diets:

1. Find "YOGURT-001" row in the matrix
2. Look across for the "Milk" column
3. If cell is green - Product is milk-free
4. If cell is red or yellow - Product contains/may contain milk

### Exporting for Documentation

Need to share allergen info with regulators or customers?

1. Click **"Export PDF"** button (bottom-right of matrix)
2. PDF downloads with:
   - Full allergen matrix table
   - Color legend
   - Generation timestamp
   - Product and allergen names

### Product Type Filter

- **All**: Show every product
- **Raw Materials Only**: Show RM items
- **WIP Only**: Show work-in-progress items
- **Finished Goods Only**: Show FG items (most important for labeling)

---

## BOM Timeline

### What It Shows

A horizontal timeline showing when Bill of Materials were created or updated over the last 6 months.

### Understanding the Timeline

- **Horizontal Axis**: Time (last 6 months)
- **Dots on Line**: Each dot = BOM change(s) on that date
- **Number Inside Dot**: How many BOMs changed that day (e.g., "2" means 2 BOMs updated)

### Example Timeline

```
June        July       August      September   October     November    December
|-----------|----------|----------|----------|----------|----------|----------|
                               1              2                  3
```

In this example:
- August 15: 1 BOM was created/updated
- October 10: 2 BOMs changed
- November 20: 3 BOMs changed

### How to Use

1. **Identify Active Periods**: See when you made the most BOM updates
2. **Find Specific Changes**: Hover over a dot to see details
3. **Track Product Versions**: Filter by product to see just that product's BOM history

### Hovering Over a Dot

When you hover over any dot, a tooltip appears showing:
- Date of the change
- Product name and code
- BOM version number
- Who made the change (user name)
- Type of change (created vs updated)

### Filtering by Product

1. Click the **Product Filter** dropdown
2. Select a specific product
3. Timeline updates to show only that product's BOM changes

### Clicking on a Change

Click any dot to jump to the BOM detail page where you can:
- Review the full BOM contents
- See what changed from previous version
- Edit if needed
- View audit history

---

## Recent Activity Feed

### What It Shows

A list of the 10 most recent changes to products, BOMs, and routings in your organization.

### Activity Types

| Icon | Type | Means |
|------|------|-------|
| ➕ | Created | New item was added |
| ✏️ | Updated | Item was modified |
| 🔢 | Version Created | New version of BOM/Routing |
| 🗑️ | Deleted | Item was removed |

### What You Can See

For each activity:
- **Icon**: Type of change (created, updated, etc.)
- **Product Code**: Unique identifier (e.g., "YOGURT-001")
- **Product Name**: Full name
- **Who**: User who made the change
- **When**: "2 hours ago", "just now", "3 days ago"

### Example

```
✏️  YOGURT-001
    Strawberry Yogurt
    Updated by Maria Garcia
    2 hours ago
```

### Filtering by Time

Want to see activity from a specific period?

1. Click the time dropdown (top-right of Activity panel)
2. Choose:
   - **Last 7 days** (default)
   - **Last 14 days**
   - **Last 30 days**

3. List updates immediately

### Viewing Full Audit Log

The Recent Activity panel shows only the 10 most recent items. For comprehensive history:

1. Click **"View All Activity"** link at bottom
2. You'll be taken to full Audit Log page where you can:
   - See all 100+ activities
   - Filter by date range
   - Filter by change type
   - Search by product code
   - Export to CSV

---

## Cost Trends Chart

### What It Shows

A line graph showing how average product costs changed over the last 6 months, broken down by:
- **Material Cost** (blue line)
- **Labor Cost** (green line)
- **Overhead Cost** (amber line)
- **Total Cost** (purple line)

### Understanding the Chart

- **Horizontal Axis (X)**: Months (last 6)
- **Vertical Axis (Y)**: Cost in PLN
- **Lines**: Each cost category tracked separately

### Example Chart

```
80 |     ╱╲╱╲
   |    ╱  ╲╱╲        Material  ─── blue
70 |   ╱         ╲    Labor     ─── green
   |  ╱           ╲   Overhead  ─── amber
60 | ╱             ╲  Total     ─── purple
   |
   July  Aug   Sept  Oct   Nov   Dec
```

### Reading the Chart

At October, if:
- Blue line is at 42 PLN
- Green line is at 19 PLN
- Amber line is at 9 PLN

Then average product costs in October were:
- Material: 42 PLN
- Labor: 19 PLN
- Overhead: 9 PLN
- **Total: 70 PLN**

### Toggle Buttons

Show/hide cost categories using buttons below the chart:

| Button | Shows |
|--------|-------|
| **Material** | Raw material costs |
| **Labor** | Production labor costs |
| **Overhead** | Indirect costs (utilities, etc.) |
| **Total** | Sum of all three |

### Example: Finding Cost Increases

To find why costs increased in October:

1. Look at chart - see upward spike in October
2. Check which line(s) went up:
   - If blue up = material costs increased
   - If green up = labor costs increased
   - If amber up = overhead increased

3. Click that button to isolate and examine
4. Take action (negotiate supplier, adjust recipe, etc.)

### Hovering for Details

Hover your mouse anywhere on the chart to see a tooltip with exact values for that month:

```
October
Material: PLN 42.15
Labor: PLN 18.50
Overhead: PLN 9.25
Total: PLN 69.90
```

---

## Quick Actions

### Three Buttons at the Bottom

| Button | Creates | Shortcut |
|--------|---------|----------|
| **+ New Product** | New product record | For ingredients or finished goods |
| **+ New BOM** | New Bill of Materials | For product recipes |
| **+ New Routing** | New production routing | For process steps |

### How to Use

1. Click any button
2. Modal/form opens for that item type
3. Fill in required fields
4. Click Save

These buttons let you quickly jump to creating common items without navigating through menus.

---

## Interaction Examples

### Scenario 1: Checking Allergen Compliance

**Goal**: Ensure all finished goods are properly declared for milk allergen

**Steps**:
1. Look at Allergen Compliance Matrix
2. Filter to "Finished Goods Only"
3. Find "Milk" column
4. Scan your products:
   - Any RED cells? = Must declare on label
   - Any YELLOW cells? = Should declare (trace risk)
   - Any GREEN cells? = Milk-free (safe claim)

5. If missing declarations, click red/yellow cell
6. Update allergen information for that product

### Scenario 2: Tracking Recipe Changes

**Goal**: Review when and how Product X's recipe has changed

**Steps**:
1. Look at BOM Timeline
2. Use Product Filter dropdown to select "Product X"
3. Timeline shows only changes to Product X's BOM
4. Hover over dots to see details:
   - Which version was created
   - When (date)
   - Who made change
5. Click dot to see full BOM details
6. Compare with previous versions

### Scenario 3: Finding Recent Changes

**Goal**: See what your team changed in the last week

**Steps**:
1. Look at Recent Activity panel
2. Make sure time filter shows "Last 7 days"
3. Review the 10 most recent items
4. Click any activity to jump to that product/BOM/routing
5. Need more? Click "View All Activity" for full audit log

### Scenario 4: Analyzing Cost Trends

**Goal**: Understand why product costs went up last month

**Steps**:
1. Look at Cost Trends chart
2. Find the month with the spike (visual)
3. Hover over that point to see exact values
4. Check which cost line went up:
   - Material up? = Supplier costs increased
   - Labor up? = Production took longer
   - Overhead up? = Other expenses increased
5. Toggle buttons to isolate and focus on problem area
6. Take action (renegotiate, optimize process, etc.)

---

## Permissions & Access

### Who Can See the Dashboard?

All authenticated users in your organization can view the Technical Dashboard.

### What Data You See

- **Only your organization's data**: Multi-tenant isolation ensures you never see competitors' data
- **Your products, BOMs, routings**: Only items your org created
- **Your costs**: Only costs for your products

### What You Can Do

- **View**: All users can view all dashboard data
- **Create**: Users need appropriate role (e.g., "Technical Manager") to create new products/BOMs/routings
- **Edit**: Depends on your role and permissions
- **Delete**: Only administrators can delete items

---

## Performance Tips

### Dashboard Is Slow?

The dashboard caches data for best performance:

- **Stats Cards**: Refresh every 1 minute
- **Allergen Matrix**: Refresh every 10 minutes
- **BOM Timeline**: Refresh every 5 minutes
- **Recent Activity**: Refresh every 30 seconds
- **Cost Trends**: Refresh every 5 minutes

**To force refresh**:
1. Browser refresh (Ctrl+R / Cmd+R)
2. Or click refresh button if available

### Large Allergen Matrix?

If you have 500+ products, allergen matrix takes longer to load:

- **Filter by product type** (RM, WIP, FG) to reduce rows
- Use PDF export if you need the full matrix offline
- Consider archiving obsolete products

---

## Common Questions

### Q: Why is my product showing as "inactive"?

**A**: Products can be marked inactive when:
- No longer produced
- No longer sold
- Archived for historical purposes

Only active products count in the stats cards.

### Q: Can I change the allergen assignments?

**A**: Yes! Click any cell in the Allergen Matrix to open product allergen settings.

### Q: How often is the data updated?

**A**: Nearly real-time, but dashboard caches data for performance. See "Performance Tips" above.

### Q: Where is my cost data coming from?

**A**: Cost Trends uses the product costing module. Ensure costs are entered in Settings > Costing.

### Q: Can I export the entire dashboard?

**A**: You can export:
- Allergen Matrix as PDF
- Recent Activity as CSV (from Audit Log)
- Cost Trends can be screenshot or exported from spreadsheet integration

### Q: Why don't I see my recent change in "Recent Activity"?

**A**: Activity shows recent changes to products, BOMs, and routings. It may take 30 seconds to appear due to caching.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus stats card | Tab |
| Open product from stat | Enter |
| Navigate matrix | Arrow keys |
| Toggle cost line | Space on button |
| Jump to product | Click product name/code |

---

## Accessibility

This dashboard is designed to be accessible:

- **Screen readers**: Full ARIA labels on all widgets
- **Keyboard navigation**: Navigate entirely with Tab, Enter, Arrow keys
- **Color independent**: Information not conveyed by color alone (also use text labels)
- **Responsive**: Works on mobile, tablet, and desktop

**Need help?** Contact your organization administrator or support team.

---

## Mobile Experience

The dashboard is fully responsive and works on phones/tablets:

**Mobile Layout** (<768px):
- Stats cards stack in single column
- Matrix becomes scrollable (swipe left/right)
- Other panels stack vertically
- All functionality preserved

**Tablet Layout** (768-1024px):
- Stats cards in 2×2 grid
- Panels side-by-side when possible
- Touch-optimized tap targets

---

## Getting Help

### Still Have Questions?

1. **Contact Your Admin**: Ask your organization administrator for custom training
2. **Email Support**: technical-support@monopilot.com
3. **Documentation**: Browse `/docs/` for detailed guides

### Report a Bug

Found an issue?

1. Note what you were doing
2. Screenshot or screen recording
3. Email: bugs@monopilot.com
4. Include browser/device info

---

## Glossary

| Term | Definition |
|------|-----------|
| **BOM** | Bill of Materials - Recipe or formula for a product |
| **Routing** | Production steps and sequence for making a product |
| **Allergen** | Substance that causes allergic reactions (milk, nuts, etc.) |
| **Overhead** | Indirect costs (utilities, equipment depreciation, etc.) |
| **Audit Log** | Historical record of all changes made to items |
| **Org ID** | Your organization's unique identifier |
| **WIP** | Work in Progress - Partially processed product |
| **RM** | Raw Material - Ingredient |
| **FG** | Finished Good - Final product for sale |

---

## Related Resources

- **Products Management**: `/docs/4-USER-GUIDES/products.md`
- **BOMs Management**: `/docs/4-USER-GUIDES/boms.md`
- **Routings Management**: `/docs/4-USER-GUIDES/routings.md`
- **Allergen Settings**: `/docs/4-USER-GUIDES/allergen-management.md`
- **Costing**: `/docs/4-USER-GUIDES/costing.md`

---

**Version**: 1.0
**Status**: Production Ready
**Last Updated**: 2025-12-28
**QA Status**: PASS (30/30 acceptance criteria)
