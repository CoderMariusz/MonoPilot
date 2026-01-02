# PO Totals, Tax Calculations & Approval Setup - User Guide

Stories: 03.4 (PO Totals + Tax Calculations) & 03.5a (PO Approval Setup)

## Overview

This guide explains how to work with Purchase Order (PO) totals, taxes, discounts, and approval workflows in MonoPilot.

## Table of Contents

1. [Understanding PO Calculations](#understanding-po-calculations)
2. [Managing Discounts](#managing-discounts)
3. [Handling Tax Rates](#handling-tax-rates)
4. [Adding Shipping Costs](#adding-shipping-costs)
5. [Setting Up Approval Workflow](#setting-up-approval-workflow)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)

---

## Understanding PO Calculations

### How PO Totals Work

When you create a Purchase Order, MonoPilot automatically calculates totals at multiple levels:

```
PO Total Calculation Formula:
├─ Line Totals (for each line)
│  ├─ Line Total = Quantity × Unit Price
│  ├─ Discount = Applied to line total
│  ├─ Subtotal After Discount = Line Total - Discount
│  └─ Line Tax = Subtotal After Discount × Tax Rate %
│
├─ PO Subtotal = Sum of all line totals
├─ PO Tax = Sum of all line taxes
├─ PO Discount = Sum of all line discounts
├─ Shipping Cost = PO-level shipping charge
│
└─ PO Total = Subtotal + Tax - Discount + Shipping
```

### Example Calculation

**Scenario**: Creating a PO with two lines, 23% VAT on line 1, 0% on line 2, with 50 PLN shipping.

**Line 1** (Regular goods, 23% VAT):
- Quantity: 5
- Unit Price: 100 PLN
- Line Total: 500 PLN
- Discount: 50 PLN (10% off)
- After Discount: 450 PLN
- Tax (23%): 103.50 PLN
- Line Total with Tax: 553.50 PLN

**Line 2** (Zero-rated goods, 0% VAT):
- Quantity: 10
- Unit Price: 50 PLN
- Line Total: 500 PLN
- Discount: 0 PLN
- After Discount: 500 PLN
- Tax (0%): 0 PLN
- Line Total with Tax: 500 PLN

**PO Totals**:
- Subtotal: 1000 PLN (500 + 500)
- Tax: 103.50 PLN
- Discount: 50 PLN
- Shipping: 50 PLN
- **Final Total: 1103.50 PLN** (1000 + 103.50 - 50 + 50)

---

## Managing Discounts

### Discount Modes

MonoPilot supports two ways to apply discounts:

#### 1. Percentage Discount

Apply a percentage off the line total:

**How to use**:
1. Click the `%` button in the Discount field
2. Enter a percentage (0-100%)
3. The discount amount is calculated automatically

**Example**:
- Line Total: 1000 PLN
- Discount: 10%
- Discount Amount: 100 PLN
- After Discount: 900 PLN

**Best for**:
- Bulk discounts
- Standard customer agreements
- Promotional discounts

#### 2. Fixed Amount Discount

Apply a specific currency amount:

**How to use**:
1. Click the `$` button (currency symbol) in the Discount field
2. Enter the discount amount in currency units
3. The percentage is shown as a helper

**Example**:
- Line Total: 1000 PLN
- Discount: 150 PLN
- Discount Percentage: 15%
- After Discount: 850 PLN

**Best for**:
- Specific negotiated discounts
- Promotional codes with fixed values
- Price adjustments

### Discount Validation

MonoPilot validates discounts to prevent errors:

- **Cannot be negative**: You cannot enter negative values
- **Cannot exceed line total**: A discount larger than the line total is rejected
- **Percentage limited to 100%**: Maximum percentage discount is 100%

### Switching Between Modes

You can switch between percentage and fixed amount modes:

1. Click the toggle button (% or $)
2. The system automatically converts:
   - **Percent → Amount**: 10% of 1000 PLN becomes 100 PLN
   - **Amount → Percent**: 100 PLN on 1000 PLN becomes 10%

**Important**: If your PO has no quantity or price, conversion may result in 0.

---

## Handling Tax Rates

### Single Tax Rate (Most Common)

If all lines in your PO use the same tax rate:

- The Totals Section displays: **Tax (23%): 230.00 PLN**
- This is clear and simple
- No additional breakdown needed

### Mixed Tax Rates

If different lines have different tax rates:

**Visual Indicator**: The Totals Section shows **Tax (mixed)** with an info icon

**View the breakdown**:
1. Click the expand button (▼) next to "Tax (mixed)"
2. Or hover over the info icon to see a quick tooltip

**Breakdown Display**:
```
23% on 450 PLN: 103.50 PLN
0% on 500 PLN: 0 PLN

Total Tax: 103.50 PLN
```

### Setting Tax Rates by Line

When adding a PO line, you'll see a tax rate field:

**How to set it**:
1. Click on the line or edit it
2. Enter the applicable tax rate (0-100%)
3. Common rates:
   - 23% - Standard VAT (Poland)
   - 8% - Reduced VAT
   - 0% - Zero-rated (exports, etc.)

**When to use different rates**:
- Different product categories (food, supplies, equipment)
- Export orders (often 0%)
- Items with special tax treatment
- Regional variations

### Tax Calculation Details

**Important**: Tax is calculated on the DISCOUNTED amount:

```
Tax Amount = (Line Total - Discount) × Tax Rate %

Example:
Line Total: 1000 PLN
Discount: 200 PLN
Tax Rate: 23%

Tax = (1000 - 200) × 23% = 184 PLN
```

This is the standard business practice in most EU countries.

---

## Adding Shipping Costs

### Setting Shipping Cost

Shipping cost is entered at the PO header level (applies to the whole order):

**How to add it**:
1. Scroll to the Totals section
2. Look for "Shipping Cost" field
3. Enter the amount in your default currency
4. The PO total updates automatically

**Example**:
- PO Subtotal: 1000 PLN
- Tax: 230 PLN
- Discount: 50 PLN
- Shipping: 75 PLN
- **New Total: 1255 PLN**

### Shipping Cost Validation

- **Cannot be negative**: You cannot enter negative values
- **Reasonable limits**: System prevents excessively large values (> 999,999.99)

### Common Shipping Scenarios

**Scenario 1: Free Shipping**
- Leave shipping cost empty or as 0

**Scenario 2: Fixed Shipping Fee**
- Enter the fee amount (e.g., 50 PLN)

**Scenario 3: Carrier Cost**
- Get quote from carrier
- Enter final quoted amount
- System includes it in PO total automatically

---

## Setting Up Approval Workflow

### Access Settings

1. Go to **Settings** (gear icon)
2. Select **Planning** tab
3. Find **Purchase Order Approval** section

### Configuration Options

#### 1. Enable/Disable Approval

**Toggle**: "Require Approval"

**When ON**:
- All POs (or POs above threshold) need approval before confirmation
- Submitted POs move to "Pending Approval" status
- Designated approvers receive notifications
- Approvers must review and approve/reject

**When OFF**:
- POs can be submitted and immediately confirmed
- No approval workflow

**Default**: OFF (approval is optional)

#### 2. Set Approval Threshold

**Field**: "Approval Threshold"

**How it works**:
- **Empty/Null**: All POs require approval (if enabled)
- **With amount**: Only POs ABOVE this amount require approval

**Examples**:

| Threshold | PO Amount | Action |
|-----------|-----------|--------|
| Not set | Any | Requires approval |
| 5000 | 2000 | Auto-confirmed |
| 5000 | 5001 | Requires approval |
| 5000 | 4999 | Auto-confirmed |

**Format**:
- Enter in your default currency (usually PLN)
- Up to 4 decimal places allowed
- Must be a positive number

**Common thresholds**:
- Small businesses: 1000-5000 PLN
- Medium businesses: 10000-50000 PLN
- Large businesses: 100000+ PLN

#### 3. Select Approval Roles

**Field**: "Approval Roles"

**What it does**:
- Defines who can approve POs in your organization
- Users with these roles see pending POs and can approve/reject

**How to select**:
1. Click "Approval Roles" dropdown
2. Check boxes for roles that can approve:
   - Admin
   - Manager
   - Procurement Manager
   - Finance Manager
   - Other roles...
3. Selected roles show as chips
4. Click X on chip to remove

**Must select at least one role**

**Who should be approvers?**:
- **Small company**: Admin/Owner
- **Medium company**: Manager + Procurement Lead
- **Large company**: Manager + Finance + Procurement + Operations

### Example Workflows

#### Small Business (No Approval)
```
Settings:
├─ Require Approval: OFF
└─ (Other settings ignored)

Workflow:
User submits PO → Auto-confirmed → Ready for receipt
```

#### Medium Business (Threshold-based)
```
Settings:
├─ Require Approval: ON
├─ Approval Threshold: 10000 PLN
└─ Approval Roles: Admin, Manager

Workflow:
User submits PO
├─ If amount < 10000: Auto-confirmed
└─ If amount >= 10000: Pending Approval
   ├─ Admin/Manager reviews
   ├─ Approves: PO confirmed
   └─ Rejects: PO returns to Draft
```

#### Large Business (All POs Need Approval)
```
Settings:
├─ Require Approval: ON
├─ Approval Threshold: (empty/null)
└─ Approval Roles: Finance, Procurement, Admin

Workflow:
User submits PO → Pending Approval
├─ Finance reviews costs
├─ Procurement verifies supplier
├─ Admin approves: PO confirmed
└─ Any reject: PO returns to Draft
```

---

## Common Tasks

### Task: View PO Totals

1. Open the PO in detail view or create/edit modal
2. Scroll to bottom to see **Totals Section**
3. You'll see:
   - Subtotal
   - Discount (if any)
   - Tax (with rate or "mixed" indicator)
   - Shipping (if any)
   - **Final Total**

### Task: Switch from Percent to Fixed Discount

**Scenario**: You initially entered a 10% discount but want to change it to 120 PLN

**Steps**:
1. Click the `$` button in Discount field
2. The 10% is automatically converted to fixed amount
3. Edit the amount if needed
4. Tax recalculates automatically

### Task: Add Multiple Tax Rates

**Scenario**: Same PO with both standard VAT (23%) and reduced VAT (8%) items

**Steps**:
1. Add line 1: Set tax_rate = 23
2. Add line 2: Set tax_rate = 8
3. View totals
4. Click expand arrow next to "Tax (mixed)"
5. See breakdown by rate

### Task: Enable Approval for Supplier Orders Over 5000 PLN

**Steps**:
1. Go to Settings > Planning
2. Find **Purchase Order Approval**
3. Turn ON "Require Approval"
4. Set Threshold to: 5000
5. Select Approval Roles: Check "Admin" and "Manager"
6. Click Save

**Result**:
- POs under 5000 PLN: Auto-confirmed
- POs 5000+ PLN: Require approval from Admin/Manager

### Task: Change Approvers from Just Admin to Admin + Procurement

**Steps**:
1. Go to Settings > Planning
2. In Approval Roles, see current selections
3. Click dropdown to expand role list
4. Check "Procurement Manager"
5. Click Save

**Result**: Both Admin and Procurement Manager can now approve POs

---

## Troubleshooting

### Issue: Discount Rejected - "Cannot Exceed Line Total"

**Cause**: You entered a discount larger than the line total

**Solution**:
1. Check the line total (Quantity × Unit Price)
2. Enter discount less than this amount
3. Example: If line total is 500, max discount is 500

**Fix options**:
- **Reduce discount amount**: Enter smaller value
- **Switch to percentage**: Try 20% instead of fixed amount
- **Verify quantities**: Check if quantity/price are correct

### Issue: Tax Not Calculating Correctly

**Cause**: Multiple reasons possible

**Troubleshooting**:

1. **Is the tax rate set?**
   - Check line detail
   - Ensure tax_rate is not 0 if you expect tax
   - Edit line and confirm tax_rate

2. **Are you on the right calculation?**
   - Remember: Tax = (Line Total - Discount) × Tax Rate %
   - Tax is applied AFTER discount, not before

3. **Mixing tax rates?**
   - Each line can have different rate
   - View breakdown to see per-rate calculation
   - All rates should appear in the breakdown

**Example Check**:
```
Line Total: 1000
Discount: 200
After Discount: 800
Tax Rate: 23%
Expected Tax: 800 × 0.23 = 184

If you see different number, verify discount is applied first.
```

### Issue: Approval Threshold Not Working

**Cause**: Settings not saved correctly

**Solution**:
1. Go back to Settings > Planning
2. Verify "Require Approval" is ON
3. Verify threshold is set to correct number
4. Click Save (watch for success message)
5. Create new PO to test

**Testing**:
- Create PO below threshold: Should auto-confirm
- Create PO above threshold: Should require approval

### Issue: Certain Roles Don't See Pending Approvals

**Cause**: Role not selected in approval settings

**Solution**:
1. Go to Settings > Planning
2. Check which roles are selected
3. Add any missing roles
4. Click Save
5. Users with that role should now see approvals

### Issue: Shipping Cost Not Included in Total

**Cause**: Shipping cost is 0 or not entered

**Solution**:
1. Open PO edit view
2. Scroll to "Shipping Cost" field
3. Enter the shipping amount
4. Save
5. Check totals section - should include shipping

---

## Tips & Best Practices

### For Accounting

1. **Always verify tax rates**: Incorrect tax rates are common errors
2. **Document high discounts**: If discount > 10%, note the reason
3. **Review mixed tax POs**: Flag POs with multiple tax rates for review
4. **Check shipping**: Make sure shipping is allocated correctly

### For Procurement

1. **Use thresholds**: Set appropriate approval thresholds to balance control and speed
2. **Prepare for approvals**: Brief approvers on threshold and their roles
3. **Track by status**: Use PO list filters to find pending approvals
4. **Bulk actions**: Export approved POs for batch processing

### For Administrators

1. **Monitor approval queue**: Check Settings to ensure roles are assigned
2. **Communicate policy**: Let users know approval process and times
3. **Audit discounts**: Periodically review POs with large discounts
4. **Test workflow**: Create test POs to verify approval process

---

## See Also

- [PO Components Reference](./po-components.md) - Technical component details
- [PO Calculation Service Reference](../api/po-calculation-service.md) - Formula details
- [Planning Settings API](../api/planning-settings-api.md) - API endpoints

---

## Getting Help

If you encounter issues:

1. **Check this guide**: Most common issues are covered in Troubleshooting
2. **Review examples**: Look at "Common Tasks" section for your scenario
3. **Contact support**: Reach out to your administrator
4. **Check logs**: View PO timeline to see what happened

---

## Version History

### v1.0 (2025-01-02)

- Initial release
- PO calculations with mixed tax rates
- Discount percentage/amount toggle
- Shipping cost support
- Approval workflow setup and management
