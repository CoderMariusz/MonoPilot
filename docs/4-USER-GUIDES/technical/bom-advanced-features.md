# BOM Advanced Features User Guide

**Story:** 02.14 - BOM Advanced Features: Version Comparison, Yield & Scaling
**Status:** Production Ready
**Last Updated:** 2025-12-29
**Audience:** Product Managers, Technical Team, Production Staff

---

## Quick Start

The BOM Advanced Features help you manage recipe changes, understand how ingredients flow through your production process, and adjust batch sizes without manual recalculation.

**Four key capabilities:**
1. **Compare versions** - See what changed between recipe versions
2. **View multi-level explosion** - Understand all raw materials needed
3. **Scale batches** - Adjust quantities for larger or smaller production runs
4. **Manage yield** - Track and configure production efficiency expectations

---

## Table of Contents

1. [Comparing BOM Versions](#comparing-bom-versions)
2. [Viewing Multi-Level Explosions](#viewing-multi-level-explosions)
3. [Scaling Batch Sizes](#scaling-batch-sizes)
4. [Configuring Yield](#configuring-yield)
5. [Troubleshooting](#troubleshooting)

---

## Comparing BOM Versions

Use the comparison feature to see exactly what changed when updating a recipe.

### When to Use

- Reviewing recipe changes before approving a new version
- Identifying cost impacts from ingredient changes
- Training staff on what's new in updated recipes
- Compliance - document what changed and when

### How to Compare

#### Step 1: Navigate to BOMs List

Go to **Technical > BOMs**

You'll see a list of all your recipes with version numbers.

```
Product             Version    Status      Effective From
Whole Wheat Bread   1.0        Active      2025-01-01
Whole Wheat Bread   1.1        Active      2025-06-01
Sourdough Starter   2.0        Active      2025-02-15
```

#### Step 2: Click "Compare Versions"

Hover over a BOM row and click the **Compare** button (or select two BOMs and click "Compare Selected").

A modal opens showing version selector dropdowns.

#### Step 3: Select Versions to Compare

- **From Version**: Select the original recipe (usually older version)
- **To Version**: Select the new recipe version

The system automatically detects changes and categorizes them.

#### Step 4: Review the Comparison

The modal displays three sections:

**LEFT SIDE (From Version)**
Shows the original recipe with all ingredients listed.

```
Whole Wheat Bread v1.0
Output: 100 kg

Ingredient              Qty    UoM    Scrap
All-Purpose Flour      50     kg     0%
Water                  20     L      0%
Salt                   1      kg     0%
Yeast                  0.005  kg     0%
```

**RIGHT SIDE (To Version)**
Shows the updated recipe. Changed items are highlighted:
- Green = Added ingredients
- Red = Removed ingredients
- Yellow = Modified quantities/settings

```
Whole Wheat Bread v1.1
Output: 100 kg

Ingredient              Qty    UoM    Scrap
All-Purpose Flour      52     kg     0%     ← Modified (+4%)
Water                  20     L      0%
Kosher Salt            1.5    kg     0%     ← Modified (+50%)
Yeast                  0.005  kg     0%
```

**SUMMARY SECTION**
Quick overview of total changes:

```
Total Items v1.0:   4
Total Items v1.1:   4
Added:              0
Removed:            0
Modified:           2
Weight Change:      +3.5 kg (+3.5%)
```

### Reading the Diff

| Highlight | Meaning | Action |
|-----------|---------|--------|
| Green | Ingredient added in new version | Review sourcing/cost |
| Red | Ingredient removed from new version | Check stock usage |
| Yellow | Quantity or setting changed | Verify production impact |
| No highlight | No change | No action needed |

### Common Changes to Look For

- **Quantity increases**: May need larger batches of raw materials
- **New ingredients**: Ensure supplier is available
- **Removed ingredients**: Stop ordering or repurpose stock
- **Scrap % changes**: May affect yield targets

### Export Results

At the bottom of the comparison modal, click **Export to CSV** to download a detailed report. Useful for:
- Email to stakeholders
- Including in change logs
- Compliance documentation

---

## Viewing Multi-Level Explosions

A BOM explosion shows you exactly what raw materials are needed, including ingredients that go into sub-assemblies (work-in-progress components).

### When to Use

- Planning raw material procurement
- Understanding what happens to ingredients through multiple production steps
- Checking if you're using the right sub-components
- Identifying where material loss occurs
- Training on complete ingredient list

### The Problem It Solves

Your recipe might use "Basic Dough Mix" (a work-in-progress ingredient), but what's actually in that dough? The explosion shows the full breakdown:

```
Recipe: Sourdough Bread (100 kg)
├── Whole Wheat Flour (Level 1): 60 kg
├── Basic Dough Mix (Level 1): 30 kg
│   ├── Filtered Water (Level 2): 15 kg
│   ├── Starter Culture (Level 2): 0.5 kg
│   └── Salt (Level 2): 0.2 kg
└── Seeds & Nuts (Level 1): 10 kg
    ├── Sunflower Seeds (Level 2): 6 kg
    └── Walnuts (Level 2): 4 kg
```

### How to View Explosion

#### Step 1: Open BOM Detail

From the BOMs list, click on a BOM to open its detail view.

#### Step 2: Find "Multi-Level Explosion" Section

Scroll to the **"Multi-Level Explosion"** card.

```
Multi-Level Explosion
[Loading...] or [Tree View]
```

The system automatically loads the explosion on page load.

#### Step 3: Expand to See Sub-Items

Click the **arrow icon** next to any component to expand and see what's inside it.

```
► Whole Wheat Flour (60 kg)  [no sub-items - leaf node]
▼ Basic Dough Mix (30 kg)
  ├─ Filtered Water (15 kg)
  ├─ Starter Culture (0.5 kg)
  └─ Salt (0.2 kg)
```

#### Step 4: Review Raw Materials Summary

At the bottom of the explosion section, you'll see:

```
RAW MATERIALS TOTAL (all levels combined):
- Whole Wheat Flour: 60 kg
- Filtered Water: 15 kg
- Starter Culture: 0.5 kg
- Salt: 0.7 kg (0.2 kg from dough + 0.5 kg elsewhere)
- Sunflower Seeds: 6 kg
- Walnuts: 4 kg
```

### Understanding Levels

- **Level 1**: Direct ingredients in your recipe
- **Level 2+**: Ingredients that go into work-in-progress components
- **Leaf nodes** (no arrow): Raw materials - no further breakdown
- **Intermediate nodes** (arrow): Work-in-progress - can expand

### Quantity Information

For each item, you see:
- **Quantity**: Amount used at that level
- **Cumulative Qty**: Total amount needed considering scrap %

Example: If "Basic Dough Mix" has 2% scrap in the main recipe, the cumulative amount shown is 2% higher than the direct quantity.

### Component Type Icons

Different icons show ingredient category:

| Icon | Type | Notes |
|------|------|-------|
| 📦 | Raw Material | Directly sourced from suppliers |
| ⚙️ | Work-in-Progress | Created in-house, used in other recipes |
| ✓ | Finished Good | A complete product used as ingredient |
| 📦 | Packaging | Boxes, bags, labels |

### Depth Limit

By default, the explosion shows up to 10 levels deep. This protects against very complex nested recipes. If you reach the limit, you'll see a note:

```
"Showing 10 levels (maximum depth reached)"
```

### Error: Circular Reference

If your BOM has a circular reference (which shouldn't happen, but it's checked), you'll see:

```
Alert: Circular BOM reference detected
Component A → Component B → Component A

Please contact your technical team to fix the recipe structure.
```

---

## Scaling Batch Sizes

Adjust ingredient quantities up or down for different batch sizes without manual math.

### When to Use

- Customer orders a larger batch than standard
- Running a smaller test batch
- Adjusting production to meet demand
- Calculating costs for different batch sizes
- Training - what if analysis

### The Math

Scaling works by calculating a multiplier:

```
Scale Factor = New Batch Size / Original Batch Size

New Ingredient Qty = Original Qty × Scale Factor
```

**Example:**
- Original recipe: 100 kg output
- New batch: 150 kg output
- Scale factor: 1.5x
- Original flour: 50 kg → 50 × 1.5 = 75 kg

### How to Scale

#### Step 1: Open BOM Detail

From the BOMs list, click on a BOM.

#### Step 2: Click "Scale Batch" Button

In the header bar, click the **Scale** button (scales icon).

A modal opens with scaling options.

#### Step 3: Choose Scaling Method

**Option A: Target Batch Size**

Enter the desired output quantity:

```
New Batch Size: 150
Unit: kg (auto-filled from recipe)
```

The system calculates the scale factor automatically (1.5x in this example).

**Option B: Scale Factor**

Or directly enter a multiplier:

```
Scale Factor: 1.5
```

(Either method works - choose whichever is clearer)

#### Step 4: Review the Preview

Before saving, you'll see the scaled quantities:

```
Ingredient              Original    New         Change
All-Purpose Flour      50 kg       75.000 kg   +50%
Water                  20 L        30.000 L    +50%
Salt                   1 kg        1.500 kg    +50%
Yeast                  0.005 kg    0.008 kg    +60%  [rounded]
```

**Important**: Some quantities may be rounded to practical sizes:
- "Yeast rounded from 0.0075 to 0.008" (you can't measure 0.0075 kg easily)

Check the **warnings** section for any rounding notices.

#### Step 5: Choose Preview or Apply

**Preview Only** (default)
- Shows you what the scaled recipe would look like
- No changes saved to database
- Use this to check numbers before committing

**Apply Changes**
- Saves the scaled quantities to the BOM
- Updates the recipe permanently
- Only users with write permission can do this

To apply changes, uncheck "Preview Only" and click "Save".

#### Step 6: Confirmation

After applying, you'll see:

```
Success! BOM scaled from 100 kg to 150 kg
Scale factor: 1.5x
5 items scaled
```

The BOM detail page refreshes with the new quantities.

### Rounding & Warnings

Small quantities often don't scale evenly. For example:
- Original: 0.005 kg yeast
- Scaled: 0.0075 kg (using 1.5x factor)
- Rounded: 0.008 kg (practical measurement)

The system shows these as warnings:

```
⚠ Warnings:
- Active Dry Yeast rounded from 0.0075 kg to 0.008 kg
- Total rounding impact: 0.001 kg (0.01%)
```

Review these before applying. Most rounding is negligible.

### Undoing Scaling

If you applied scaling and want to go back, you can:

1. **Create a new version** - Make the original quantities again
2. **Use a previous version** - If you kept an older version with the right quantities

Scaling doesn't create an undo button, so use "Preview Only" first!

---

## Configuring Yield

Yield is the percentage of input ingredients that becomes finished product. The rest is loss (trim, moisture, cooking weight loss, etc.).

**Example:**
- Input: 500 kg raw ingredients
- Output: 475 kg finished product
- Yield: 95% (5% loss)

### When to Use

- Setting targets for production efficiency
- Identifying when production is underperforming
- Tracking moisture loss or trim waste
- Compliance - documenting expected waste
- Costing - accounting for waste in price calculations

### Understanding Yield

#### Theoretical Yield

Calculated automatically from your BOM:

```
Theoretical Yield = (Output Qty / Input Total Qty) × 100

Example:
Input: 500 kg (flour + water + salt)
Output: 100 kg (finished bread)
Theoretical: 20%
```

This is the pure math - what the recipe structure suggests.

#### Expected Yield

What you actually expect to achieve in production:

```
Expected Yield: 94% (user-configured)
```

This accounts for real-world inefficiencies like:
- Moisture loss during cooking
- Trim and preparation waste
- Spillage and handling loss

### How to Configure Yield

#### Step 1: Open BOM Detail

From BOMs list, click on a BOM.

#### Step 2: Find "Yield Analysis" Panel

Scroll down to the **"Yield Analysis"** card.

```
Yield Analysis

Theoretical Yield:     95%
Expected Yield:        [Not configured]
Loss Factors:
  - Trim: 3%
  - Moisture: 2%

[Configure] button
```

#### Step 3: Click "Configure"

A modal opens with yield settings.

#### Step 4: Set Expected Yield

Enter your target yield percentage (0-100):

```
Expected Yield (%):  93
```

This is what you want to achieve regularly.

#### Step 5: Set Variance Threshold (Optional)

When should the system alert you? Default is 5%:

```
Variance Threshold (%):  3
```

This means:
- If actual yield drops below 93% - 3% = 90%, you get a warning
- Adjust based on your acceptable variation

#### Step 6: Save

Click **Save**. The configuration is now applied.

```
✓ Yield configuration saved
Expected Yield: 93%
Variance Threshold: 3%
```

### Interpreting Yield Data

On the BOM detail page, you'll see:

```
YIELD ANALYSIS

Theoretical Yield:      95%
Expected Yield:         93%
Variance:               +2% (within threshold)

Input Total:           500 kg
Output:                475 kg (at 95% theoretical)
```

**Color coding:**
- Green: Variance within acceptable range
- Yellow: Variance approaching threshold
- Red: Variance exceeds threshold (production underperforming)

### Loss Factors

Currently showing standard loss categories:

| Type | Description | Typical Range |
|------|-------------|---------------|
| Trim | Preparation and cutting waste | 2-5% |
| Moisture | Weight loss during cooking | 1-8% |
| Process | Spillage and handling loss | 0.5-2% |

*Note: Custom loss factors coming in Phase 2*

### When Yield Warnings Appear

You'll see a warning when:
- Actual production yield < (Expected - Threshold)
- Indicates something might be wrong in production
- Prompt: Review production data and recipes

---

## Troubleshooting

### "Cannot compare to itself" Error

**Problem**: Tried to compare a BOM to itself

**Solution**: Select two different versions. In the modal:
- "From Version" must be different from "To Version"

---

### "Different products" Error

**Problem**: Tried to compare BOMs from different products

**Solution**: Version comparison only works within the same product. You can't compare "Bread v1" to "Cake v1".

---

### Circular Reference Error on Explosion

**Problem**: The explosion feature shows "Circular BOM reference detected"

**Solution**: This shouldn't happen with valid recipes, but if it does:
1. Report to your technical team
2. Check your BOM structure - likely A contains B, B contains A
3. Fix the recipe by removing the circular reference

---

### Rounding Creates Impractical Quantities

**Problem**: After scaling, a quantity is too small to measure
- Original: 0.001 kg salt
- Scaled by 100x: 0.1 kg (0.1 g)
- Too tiny to measure practically

**Solution**:
1. Use "Preview Only" before applying
2. Increase "Round Decimals" to keep more precision
3. Or manually adjust the scaled value if needed
4. Consider if this ingredient is needed at all in small batches

---

### Yield Keeps Getting Warnings

**Problem**: Production keeps falling below expected yield

**Causes**:
- Ingredient quality issues (more waste than expected)
- Process changes (longer cooking = more moisture loss)
- Operator error (spillage)
- Measuring/calculation errors

**What to do**:
1. Review the last 10 production batches
2. Compare actual loss to expected loss
3. Adjust expected yield if new factors exist
4. Or investigate why loss is higher than normal

---

### Can't Apply Scaling (Permission Denied)

**Problem**: Clicked "Apply Changes" but got an error

**Solution**: You need write permission to modify BOMs. Check with:
- Your admin (for permission upgrade)
- Product manager (to apply changes for you)

Preview mode doesn't require permissions - use that to check numbers.

---

### "No yield data" or Empty Yield Panel

**Problem**: Yield analysis shows no data

**Causes**:
- BOM has no items (empty recipe)
- Items have missing weight information
- BOM is draft/inactive

**Solution**:
- Add items to the BOM first
- Ensure items have quantities and units
- Activate the BOM (if in draft status)

---

## Tips & Best Practices

### Comparison Tips

1. **Always preview before approving** - Use comparison to catch mistakes
2. **Document major changes** - Export and attach to change log
3. **Train staff on new versions** - Use comparison to highlight what's new
4. **Version numbering** - Name versions logically (e.g., "Reduced Sugar", "Larger Batch")

### Explosion Tips

1. **Check depth** - If a BOM is deeply nested, explosion stops at 10 levels
2. **Understand sub-components** - Explosions reveal hidden dependencies
3. **Identify waste** - Scrap % shown at each level helps spot inefficiencies
4. **Plan procurement** - Use raw materials summary to order ingredients

### Scaling Tips

1. **Always preview first** - Check math before committing to database
2. **Watch for rounding** - Very small quantities may not scale linearly
3. **Keep original versions** - Don't overwrite - create new version with scaled amounts
4. **Document scaling** - Note why batch was scaled (customer order, test run, etc.)

### Yield Tips

1. **Set realistic targets** - Base on historical production data
2. **Narrow thresholds** - Start with 5%, tighten after you understand variations
3. **Review regularly** - Check actual vs expected weekly
4. **Investigate variances** - Don't ignore warnings - they indicate problems
5. **Account for season** - Humidity and temperature affect moisture loss

---

## Feature Availability

These features are available to:
- **Viewers**: Comparison, Explosion, Yield (read-only)
- **Planners**: All read-only features above
- **Technical Staff**: All above + Scaling (preview), Yield configuration
- **Admins**: Everything, plus can edit scaling without preview

---

## Related Documentation

- [BOM CRUD Guide](../technical/bom-crud.md) - Creating and editing BOMs
- [Costing Guide](../technical/costing.md) - How cost calculations work
- [API Documentation](../../3-ARCHITECTURE/api/bom-advanced.md) - For developers

---

## Support

For questions or issues:
- Contact your admin for permission questions
- Email support@monopilot.io for technical issues
- See [FAQ](../faq.md) for common questions

---

**Last updated:** 2025-12-29
**Version:** 1.0
**Production Status:** Ready
