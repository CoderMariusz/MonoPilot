# BOM Management User Guide

**Story**: 02.4 - BOMs CRUD + Date Validity
**Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [What is a BOM?](#what-is-a-bom)
3. [Getting Started](#getting-started)
4. [Creating Your First BOM](#creating-your-first-bom)
5. [BOM Versioning](#bom-versioning)
6. [Date Ranges Explained](#date-ranges-explained)
7. [Managing Multiple Versions](#managing-multiple-versions)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

The BOM (Bill of Materials) management system in MonoPilot helps you track the recipes and ingredients for your products. Each BOM defines:

- Which ingredients go into a product
- How much of each ingredient is needed
- When the recipe is valid (effective dates)
- Different versions of the recipe over time

Think of it as your digital recipe book, with version control built in.

---

## What is a BOM?

A **Bill of Materials (BOM)** is a list of ingredients and quantities required to produce one batch of your product.

### Key Concepts

**Version**: BOMs are versioned automatically. When you make changes to a recipe, a new version is created.
- Version 1: Original recipe
- Version 2: Recipe with improved ingredients
- Version 3: Seasonal variation

**Effective Dates**: Define when each BOM version is valid.
- Effective From: Start date (when this version becomes valid)
- Effective To: End date (when this version expires)
- Ongoing: Leave "Effective To" blank if the version never expires

**Status**: Shows the state of each BOM version.
- Draft: Work in progress, not yet used in production
- Active: Currently in use
- Phased Out: Being transitioned to a new version
- Inactive: No longer used

### Example

```
Product: Chocolate Chip Cookies

Version 1 (Jan 1 - Jun 30):
  - Winter flour: 2 kg
  - Butter: 1 kg
  - Chocolate chips: 0.5 kg

Version 2 (Jul 1 - ongoing):
  - Summer flour: 2.2 kg
  - Butter: 0.9 kg
  - Chocolate chips: 0.6 kg (premium)
```

---

## Getting Started

### Access the BOM Module

1. Log in to MonoPilot
2. Navigate to **Technical** > **BOMs**
3. You'll see the BOM list page

### Permissions Required

To work with BOMs, you need appropriate permissions:

| Action | Minimum Role | Permission |
|--------|--------------|-----------|
| View BOMs | Any user | Read-only |
| Create BOMs | Admin, Supervisor, or Technical:C | Create |
| Edit BOMs | Admin, Supervisor, or Technical:U | Update |
| Delete BOMs | Admin only | Delete |

If you don't have permission, contact your administrator.

---

## Creating Your First BOM

### Step 1: Go to Create BOM

1. Click **"New BOM"** button in the top right
2. Fill in the form:

### Step 2: Fill in BOM Details

**Required Fields**:

| Field | What to Enter | Example |
|-------|--------------|---------|
| Product | Select the product | "Chocolate Chip Cookies" |
| Effective From | Start date | "2025-01-01" |
| Output Quantity | How much one batch makes | "100" |
| Output Unit | Unit of measure | "kg" |

**Optional Fields**:

| Field | What to Enter |
|-------|--------------|
| Effective To | End date (leave blank for ongoing) |
| Status | Draft (default) or Active |
| Notes | Any special instructions |

### Step 3: Example Form

```
Product:              [Chocolate Chip Cookies ▼]
Effective From:       [2025-01-01]
Effective To:         [2025-06-30] or [Leave blank for ongoing]
Status:               [Draft ▼]
Output Quantity:      [100]
Output Unit:          [kg ▼]
Notes:                [Winter batch with extra chocolate]
```

### Step 4: Save

Click **"Create BOM"** button.

**What happens next**:
- System automatically assigns version 1
- BOM status is set to Draft
- You can now add ingredients to this BOM

---

## BOM Versioning

### How Versioning Works

**Automatic Versioning**: Each BOM gets a version number automatically:
- First BOM for a product = Version 1
- Second BOM for a product = Version 2
- And so on...

**Why Versions?**
- Track recipe changes over time
- Compare old vs new recipes
- Keep history for traceability
- Support multiple recipes simultaneously with different date ranges

### When to Create a New Version

Create a new version when:
- You change ingredients or quantities
- Seasonal ingredients become unavailable
- You want to improve the recipe
- A supplier discontinues an ingredient
- You find a better supplier at a lower cost

### Do NOT Create a New Version When

Do NOT create a new version to:
- Change effective dates (just update the current BOM)
- Update status (draft → active)
- Adjust output units (update the current BOM)

---

## Date Ranges Explained

### Understanding Effective Dates

Each BOM version has two date fields:

**Effective From**:
- The date when this BOM version starts being used
- Must be in the past or present
- Is included in the valid range (you can use it on this date)

**Effective To**:
- The date when this BOM version stops being used
- Can be in the future
- Is included in the valid range (you can still use it on this date)
- Leave blank if the version is ongoing (no end date)

### Date Range Examples

```
BOMs for Product: Cookies

Version 1:  2025-01-01 to 2025-06-30
            (Used Jan 1 through Jun 30)

Version 2:  2025-07-01 to 2025-12-31
            (Used Jul 1 through Dec 31)

Version 3:  2026-01-01 to (blank/ongoing)
            (Used from Jan 1, 2026 onwards, no end date)
```

### No Overlapping Dates

**Important Rule**: Date ranges cannot overlap for the same product.

❌ **Not Allowed**:
```
Version 1: 2025-01-01 to 2025-12-31
Version 2: 2025-06-01 to 2025-12-31
          ↑ Overlaps from Jun 1-Dec 31
```

✓ **Correct**:
```
Version 1: 2025-01-01 to 2025-05-31
Version 2: 2025-06-01 to 2025-12-31
          ↑ No overlap, seamless transition
```

### Only One Ongoing BOM

**Rule**: Only one BOM per product can have no end date (ongoing).

❌ **Not Allowed**:
```
Version 1: 2025-01-01 to (blank/ongoing)
Version 2: 2025-06-01 to (blank/ongoing)
          ↑ Two BOMs with no end date
```

✓ **Correct**:
```
Version 1: 2025-01-01 to 2025-05-31
Version 2: 2025-06-01 to (blank/ongoing)
          ↑ Only Version 2 has no end date
```

---

## Managing Multiple Versions

### Viewing Timeline

To see all versions of a product at once:

1. Go to **Technical** > **BOMs**
2. Click on a product
3. Scroll to **BOM Timeline** section

The timeline shows:
- All versions in chronological order
- Currently active version highlighted in blue
- Status badges (draft, active, phased_out, inactive)
- Date ranges for each version
- Any overlap warnings (orange warning icon)

### Updating a Version

To update an existing BOM:

1. Click on the BOM in the list or timeline
2. Click **Edit** button
3. You can change:
   - Effective dates
   - Output quantity/unit
   - Status
   - Notes
4. Click **Save**

**Cannot Change**: Product (locked) - need to delete and recreate

### Transitioning Between Versions

**Scenario**: You want to switch from Version 1 to Version 2 on July 1.

**Steps**:

1. **Edit Version 1**: Set Effective To = 2025-06-30
2. **Create Version 2**:
   - Set Effective From = 2025-07-01
   - Set Effective To = blank (ongoing)
   - Set Status = Active
3. **Timeline** now shows seamless transition

---

## Common Tasks

### Task 1: Create Seasonal BOMs

**Goal**: Different recipes for winter vs summer

**Steps**:

1. Create Version 1 (Winter):
   - Effective From: 2025-11-01
   - Effective To: 2025-04-30
   - Include winter ingredients

2. Create Version 2 (Summer):
   - Effective From: 2025-05-01
   - Effective To: 2025-10-31
   - Include summer ingredients

3. Repeat yearly

**Result**: System automatically uses correct version based on date

### Task 2: Test New Recipe Before Go-Live

**Goal**: Have new recipe ready before switching

**Steps**:

1. Create new BOM Version 2:
   - Effective From: 2025-07-01 (future date)
   - Status: Draft (work in progress)
   - Add and test ingredients

2. When ready:
   - Update Version 1: Effective To = 2025-06-30
   - Update Version 2: Status = Active
   - Work Orders can now use Version 2

**Benefit**: New version is ready and tested before it's needed

### Task 3: Archive Old Versions

**Goal**: Keep old recipes for history but mark as inactive

**Steps**:

1. Click old BOM version
2. Click **Edit**
3. Change Status to **Inactive** or **Phased_Out**
4. Save

**Result**: Old version won't show in "active BOMs" filters, but history remains

### Task 4: Handle Supplier Change

**Goal**: Same product, but ingredient supplier changed

**Steps**:

1. Create new BOM Version (Version 2):
   - Effective From: Tomorrow's date
   - Effective To: Leave blank (ongoing)
   - Update ingredient with new supplier
   - Keep quantity same

2. Update Version 1:
   - Edit Version 1
   - Effective To: Today's date
   - Save

3. Use Timeline to verify transition

---

## Troubleshooting

### Error: "Date range overlaps with existing BOM"

**Cause**: Your date range overlaps with another version.

**Solution**:
1. Check the timeline to see other BOMs
2. Adjust your dates to not overlap:
   - Change Effective To to before the next version starts
   - Or change Effective From to after the previous version ends

**Example Fix**:
```
Version 1: 2025-01-01 to 2025-06-30
Your dates: 2025-06-15 to 2025-12-31
                  ↑ Overlaps with Version 1

Fix: Use 2025-07-01 to 2025-12-31 instead
```

### Error: "Only one BOM can have no end date"

**Cause**: You tried to create two BOMs with no Effective To date.

**Solution**:
1. Check the timeline - find the existing ongoing BOM
2. Either:
   - Add an end date to the existing BOM
   - Or add an end date to your new BOM
   - Keep only one BOM without an end date

### Error: "Cannot delete BOM used in Work Orders"

**Cause**: This BOM is referenced by production work orders.

**Solution**:
- Cannot delete a BOM that's actively used
- Either:
  1. Complete/cancel the work orders first
  2. Or just set Status = Inactive instead of deleting
  3. Setting inactive preserves history while preventing new use

### Timeline Shows No Versions

**Cause**: No BOMs exist for this product yet.

**Solution**:
1. Create your first BOM
2. Click **New BOM** button
3. Select the product
4. Fill in required fields
5. Save

### Wrong BOM Used in Work Order

**Cause**: Work order was created with an older BOM version.

**Solution**:
- BOMs are locked at work order creation time
- Cannot change after creation
- Cancel work order and create new one if wrong BOM was selected

---

## FAQ

### Q: Can I use a BOM with a future effective date?

**A**: No. Work orders can only use BOMs where "today" falls within the effective date range.

Example:
- Today is 2025-12-26
- BOM Version 1 is effective Jan 1 - Jun 30 (past - cannot use)
- BOM Version 2 is effective Jul 1 - Dec 31 (active - can use)
- BOM Version 3 is effective Jan 1, 2026 onwards (future - cannot use yet)

### Q: Can I copy a BOM to create a new version?

**A**: Not through the UI currently. You must:
1. Note down the ingredients from old BOM
2. Create new BOM
3. Manually add ingredients (copy from old version)

This is a planned enhancement for future releases.

### Q: What happens if I change a BOM after creating work orders?

**A**: Work orders keep the BOM they were created with. Changes don't affect existing work orders - only new work orders use the updated BOM.

Example:
- Create Work Order WO-001 with BOM v1
- Update BOM v1 ingredients
- WO-001 still uses original ingredients
- New Work Order WO-002 uses updated ingredients

### Q: Can I delete a BOM version?

**A**: Only if it's not used in any work orders.

To archive instead of delete:
1. Click Edit
2. Change Status to "Inactive"
3. Save
4. History is preserved, won't be suggested for new work orders

### Q: What's the difference between "Phased_Out" and "Inactive" status?

**A**:

- **Phased_Out**: Currently transitioning to a new version. May still be used for existing work orders but won't be suggested for new ones.

- **Inactive**: No longer used. Work orders shouldn't use this version.

Use Phased_Out during transition period, then change to Inactive once fully migrated.

### Q: Can multiple products share the same BOM?

**A**: No. Each product has its own BOMs with independent version numbers.

Example:
- Product A (Cookies): versions 1, 2, 3
- Product B (Cakes): versions 1, 2
- Version numbers are independent per product

### Q: What if I make a mistake in the effective dates?

**A**: Just edit the BOM and fix the dates.

Steps:
1. Click the BOM
2. Click Edit
3. Adjust Effective From/Effective To
4. Click Save

Note: Must ensure no overlapping dates after change.

### Q: Can I view BOM history (who changed what)?

**A**: The audit trail shows:
- Created by: Which user created the BOM
- Created at: When it was created
- Updated by: Last user to edit it
- Updated at: When it was last changed

Full change history (line-by-line) is in the Item History, not yet shown in the current version.

---

## Best Practices

### 1. Plan Your Versions

Before creating BOMs, plan how many versions you'll need:
- Seasonal variations?
- Different suppliers?
- Quality improvements?

Create them all with non-overlapping date ranges.

### 2. Use Descriptive Notes

Always add notes explaining why each version exists:
- "Premium chocolate supplier" (Version 2)
- "Reduced sugar for diet product" (Version 3)
- "Winter wheat flour variant" (Version 1)

### 3. Date Precision

Use clear, non-overlapping dates:
- ✓ Good: v1 ends 2025-06-30, v2 starts 2025-07-01
- ✗ Avoid: v1 ends 2025-06-30, v2 starts 2025-06-30 (ambiguous)

### 4. Test Before Activating

Always test new BOMs before setting Status = Active:
1. Create new BOM with Status = Draft
2. Test with trial work orders
3. Verify ingredients and quantities
4. Change Status to Active

### 5. Don't Delete, Archive Instead

Instead of deleting old BOMs:
1. Set Status = Inactive
2. Keeps history for traceability
3. Can't accidentally use old version

---

## Next Steps

After creating BOMs:

1. **Add Ingredients**: Add BOM items (line items) with quantities
2. **Link Routing**: Assign production steps to this BOM
3. **Create Work Orders**: Use BOM in production work orders
4. **Track Production**: Monitor what was actually used vs. BOM

---

## Support

For questions or issues:
- Contact your administrator
- Check the Technical module documentation
- File an issue in the MonoPilot help system
