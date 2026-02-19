# Routings Management User Guide

**Module**: Technical
**Last Updated**: 2025-12-28
**Audience**: Production Managers, Technical Leads, Quality Managers

---

## Overview

Routings are the production templates for your manufacturing facility. Each routing defines a sequence of production steps (operations) that can be reused across multiple products or used for a single product.

**What is a Routing?**

A routing is like a recipe or instruction manual for a production run. It lists:
- Each production step in order (Mixing → Baking → Cooling)
- Equipment needed (oven, mixer, cooler)
- Time required per step
- Labor costs
- Operations sequence

**Key Concepts**:
- **Routing**: The complete production workflow template (e.g., "Standard Bread Line")
- **Operation**: A single step within a routing (e.g., "Mixing" is one operation)
- **Sequence**: The order operations execute (1st, 2nd, 3rd, etc.)

---

## Getting Started

### Accessing Routings

1. Log in to MonoPilot
2. Click **Technical** in the left sidebar
3. Click **Routings**

You'll see the Routings list page showing all routings in your organization.

### Understanding the List View

The list shows a table with these columns:

| Column | Meaning |
|--------|---------|
| **Code** | Unique identifier (e.g., RTG-BREAD-01) |
| **Name** | Descriptive name (e.g., "Standard Bread Line") |
| **Description** | What this routing is used for |
| **Status** | Active (can be used) or Inactive (archived) |
| **Operations** | Number of production steps in this routing |
| **Actions** | Edit, Clone, or Delete buttons |

---

## Creating a Routing

### Step 1: Open Create Modal

Click the **[+ Add Routing]** button in the top right.

The "Create Routing" dialog opens.

### Step 2: Fill Basic Information

**Code** (Required)
- Unique identifier for this routing
- Must be 2-50 characters
- Use UPPERCASE letters, numbers, and hyphens only
- Examples: `RTG-BREAD-01`, `MIXING-LINE-A`, `BAKE-001`
- Format: Codes help with organization and sorting

**Name** (Required)
- Descriptive name for the production workflow
- Examples: "Standard Bread Line", "Quick-Rise Pastry", "Sauce Blending"
- Use your production team's terminology

**Description** (Optional)
- Additional details about this routing
- Examples: "High-volume line", "Includes quality checks", "For premium products"
- Max 500 characters

### Step 3: Configure Settings

**Status**
- **Active**: This routing can be used in new BOMs and production runs
- **Inactive**: Archive old routings. They won't appear in new BOM assignments.

**Reusable Routing** (checkbox)
- Check if this routing can be assigned to multiple different products
- Uncheck if this routing is product-specific (used by only one product)

### Step 4: Set Cost Configuration (Advanced)

Cost fields are optional. Skip if you don't have cost data yet—you can add it later.

**Setup Cost**
- Fixed cost incurred every time this routing runs
- Examples: Machine setup ($90), Material prep ($25), QC checks ($15)
- Used for: One-time costs that don't change based on quantity
- Format: Currency amount (e.g., 90.00)

**Working Cost per Unit**
- Variable cost per unit produced
- Examples: Labor ($1.50/unit), Machine time ($0.75/unit), Supplies ($0.25/unit)
- Used for: Costs that increase with production volume
- Format: Currency amount (e.g., 2.50)

**Overhead %**
- Factory overhead allocated to this routing
- Represents facility costs spread across production
- Examples: Facilities (5%), Quality (3%), Maintenance (4%), Admin (3%) = 15% total
- Range: 0-100%
- Format: Percentage (e.g., 15.00)

**Currency**
- Select the currency for all costs on this routing
- Options: PLN (Polish Zloty), EUR (Euro), USD (US Dollar), GBP (British Pound)
- All costs on a routing must use the same currency

**Example Cost Configuration**:
```
Setup Cost: 90.00 PLN (machine setup + QC)
Working Cost: 2.50 PLN per unit (0.5 hours labor @ 5 PLN/hour + supplies)
Overhead: 15% (facility overhead)
Currency: PLN
```

### Step 5: Save

Click **[Save Routing]** button.

**Success**: New routing appears in the list. System shows message: "Routing 'RTG-BREAD-01' created successfully"

**Error - Code Already Exists**:
```
"Code 'RTG-BREAD-01' already exists in your organization"
```
Solution: Use a different code (codes must be unique per organization)

**Error - Validation Failed**:
Check that:
- Code is 2-50 characters
- Code uses only UPPERCASE letters, numbers, hyphens
- Name is not empty
- Costs are non-negative
- Overhead is 0-100%

### What Happens Next?

After creation:
1. Routing appears in the list
2. You can now add **Operations** (production steps) to it
3. Other team members can see and use this routing
4. Once operations are added, the routing can be assigned to BOMs

---

## Editing a Routing

### When to Edit

Edit a routing when:
- Production process changes
- Costs change (labor rates, equipment costs)
- Need to rename or update description
- Need to activate/deactivate
- Operations change (different sequence or steps)

### How to Edit

1. Find the routing in the list
2. Click the **✏️ Edit** icon in the Actions column
3. Make your changes
4. Click **[Save Changes]**

### What Can Be Changed

✅ **Can Change**:
- Name
- Description
- Status (Active/Inactive)
- Reusable flag
- Cost fields (setup, working, overhead, currency)

❌ **Cannot Change**:
- Code (immutable after creation)
- If you need to use a different code, clone the routing with a new code

### Version Control

Every time you edit a routing, a **version number** increases.

**Why versions matter**:
- Track what changed and when
- BOMs remember which version they use
- Help with compliance and traceability

**When version increments**:
- Editing: Name, Description, Status, Costs, Currency
- Does NOT increment: Only viewing or checking operations

**Example**:
```
Created: Version 1 (Dec 20, 2025)
Edited name: Version 2 (Dec 22, 2025)
Edited costs: Version 3 (Dec 27, 2025)
```

---

## Cloning a Routing

### When to Clone

Clone a routing when:
- Creating a similar routing (e.g., "Bread Line B" based on "Bread Line A")
- Testing modifications without affecting existing BOMs
- Copying to a different facility or production area
- Seasonal variations (summer vs. winter setup)

### How to Clone

1. Find the routing in the list
2. Click the **📋 Clone** icon
3. "Clone Routing" dialog opens showing the source
4. Enter new code (e.g., if source is "RTG-BREAD-01", try "RTG-BREAD-02")
5. Enter new name (e.g., "Premium Bread Line")
6. Edit description if needed
7. Click **[Clone]**

### What Gets Copied

✅ **Copied**:
- All operations (production steps)
- Cost configuration (setup, working, overhead, currency)
- Description (can be edited)
- Status (defaults to Active)

**Example**:
```
Original: RTG-BREAD-01
  Setup: 90 PLN
  Working: 2.50 PLN/unit
  Operations: 5 steps
  ↓ Clone ↓
New: RTG-BREAD-02
  Setup: 90 PLN (copied)
  Working: 2.50 PLN/unit (copied)
  Operations: 5 steps (copied)
```

### After Cloning

- New routing appears in list
- Completely independent from original
- Can edit new routing without affecting original
- Can assign to different BOMs

---

## Deleting a Routing

### When to Delete

Delete a routing when:
- It's completely outdated
- Replaced by newer routing
- Was created by mistake
- No longer used in production

### How to Delete

1. Find the routing in the list
2. Click the **🗑 Delete** icon
3. "Delete Routing" dialog opens

### Before You Delete

**Dialog shows**:
- How many BOMs use this routing
- List of products using it
- Warning: "BOMs will be unassigned"

**Example Warning**:
```
⚠️ This routing is assigned to 3 BOMs:
  • BOM-BREAD-001 (White Bread) - ACTIVE
  • BOM-BREAD-002 (Whole Wheat) - ACTIVE
  • BOM-BREAD-003 (Premium) - DRAFT

If you delete, these BOMs will be unassigned.
You'll need to assign a different routing later.
```

### Confirm Deletion

Review the warning. If you're sure:
1. Click **[Delete Anyway]** button
2. Routing is permanently deleted
3. BOMs are unassigned (but not deleted—their formulation data remains)

**What Happens**:
- Routing is gone
- Its operations are deleted
- BOMs lose their production workflow assignment
- You'll need to assign a new routing to those BOMs

---

## Cost Configuration (Advanced)

### Understanding Costs

Costs are used to calculate how much it costs to produce each unit.

**Scenario**: Producing 100 units of White Bread

```
Materials: 5.00 PLN per unit
Routing Setup Cost: 90.00 PLN (one-time)
Routing Working Cost: 2.50 PLN per unit
Routing Overhead: 15%

Calculation:
  Subtotal per unit: 5.00 + 2.50 = 7.50
  Subtotal for 100 units: 750.00 PLN
  Setup (one-time): 90.00 PLN
  Total before overhead: 840.00 PLN
  Overhead (15%): 126.00 PLN
  TOTAL: 966.00 PLN
  Cost per unit: 9.66 PLN
```

### Cost Best Practices

**1. Use Consistent Data**
- Ensure costs reflect current labor rates
- Include all direct production costs
- Update quarterly when rates change

**2. Setup Cost**
- Include machine setup/calibration time
- Include material prep time
- Include QC checks
- Estimate as: (Setup hours) × (Labor rate per hour)

**3. Working Cost per Unit**
- Include direct labor hours per unit
- Include machine/equipment time
- Include consumable supplies
- Estimate as: (Labor hours per unit) × (Rate per hour)

**4. Overhead Percentage**
- Typical range: 10-25%
- Include facility costs (rent, utilities)
- Include supervision and management
- Include quality/maintenance overhead
- Calculate as: (Total overhead per month) / (Total production cost per month)

**5. Currency**
- Use one currency per routing
- Create separate routings for different currencies if needed
- Currency can be changed by editing

---

## Search and Filtering

### Search

Click the search box and type:
- **Code**: Type "BREAD" to find "RTG-BREAD-01", "RTG-BREAD-02"
- **Name**: Type "Line" to find "Bread Line", "Pastry Line"
- **Partial matches work**: "bread" finds all bread-related routings

Search is case-insensitive.

### Filter by Status

Use the status dropdown:
- **All**: Show active and inactive
- **Active**: Show only routings you can use in new BOMs
- **Inactive**: Show only archived routings

### Sorting

Click column headers to sort:
- Click **Code** to sort by code A→Z
- Click again to reverse (Z→A)
- Works for Code, Name, Status

---

## Troubleshooting

### Can't Create Routing - "Code Already Exists"

**Problem**: Error message: "Code 'RTG-BREAD-01' already exists"

**Solution**:
1. Use a different code
2. Check if a similar routing already exists
3. If you want to use existing routing, edit it instead of creating new one

### Can't Edit Routing - "Code Cannot Be Changed"

**Problem**: Trying to change the routing code in edit mode

**Solution**:
- Codes are immutable (cannot be changed after creation)
- If you need a different code, clone the routing instead
- Clone creates a new routing with the new code and copies all operations

### Deleted Routing by Mistake

**Problem**: Routing was permanently deleted

**Solution**:
- MonoPilot doesn't have undo for deletions
- If operations still exist somewhere:
  1. Create new routing with same code
  2. Re-add operations manually
  3. Re-assign to BOMs
- If you have recent backups, contact support

### Routing Shows in List but Can't Use in BOM

**Possible Causes**:

1. **Inactive Status**
   - Solution: Edit routing and set Status to "Active"

2. **No Operations**
   - Solution: Add operations to the routing (required before use in BOM)

3. **Permission Issue**
   - Solution: Check if you have Technical module access

---

## Examples

### Example 1: Standard Bread Production

**Goal**: Create routing for daily bread production

```
Code: RTG-BREAD-DAILY
Name: Standard Bread Line - Daily Production
Description: High-volume daily bread. 5 steps from dough to packaging.

Status: Active
Reusable: Yes (used by multiple bread products)

Setup Cost: 120 PLN
  - 1.5 hours equipment warmup @ 80 PLN/hour
  - 0.5 hours ingredient prep @ 80 PLN/hour

Working Cost: 3.00 PLN per unit
  - 0.5 hours labor @ 4 PLN/hour = 2.00 PLN
  - Utilities & supplies = 1.00 PLN

Overhead: 18%
  - Facility, quality, supervision

Currency: PLN
```

### Example 2: Premium Pastry (Seasonal)

**Goal**: Create seasonal routing for premium pastries

```
Code: RTG-PASTRY-PREMIUM-S25
Name: Premium Pastry Line - Summer 2025
Description: Seasonal premium line with extended cooling.
  Uses cold room for 4-hour proof cycle.

Status: Active
Reusable: No (product-specific for premium line)

Setup Cost: 180 PLN
  - 2 hours prep including cold room setup

Working Cost: 5.50 PLN per unit
  - 1 hour labor per unit (complex process)
  - Premium ingredients & utilities

Overhead: 22%
  - Cold room maintenance premium

Currency: PLN
```

### Example 3: Sauce Blending

**Goal**: Create routing for sauce production

```
Code: RTG-SAUCE-BLEND
Name: Sauce Blending & Pasteurization
Description: All sauce variants. Temperature control critical.

Status: Active
Reusable: Yes (multiple sauce products use this)

Setup Cost: 150 PLN
  - Temperature probe calibration
  - Vessel cleaning & setup

Working Cost: 1.20 PLN per unit
  - 0.2 hours stirring/monitoring
  - Energy (heating)

Overhead: 15%

Currency: PLN
```

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search box |
| `n` | New routing |
| `Escape` | Close modal |
| `Enter` | Submit form |

### Status Indicators

| Icon | Meaning |
|------|---------|
| ● Green | Active (can be used) |
| ○ Gray | Inactive (archived) |
| 5 | 5 operations in routing |
| 📋 | Clone action |
| ✏️ | Edit action |
| 🗑 | Delete action |

### Common Actions

**Create**: [+ Add Routing] button
**Edit**: Find routing → Click ✏️
**Clone**: Find routing → Click 📋
**Delete**: Find routing → Click 🗑
**Search**: Type in search box
**Filter**: Use Status dropdown

---

## FAQ

**Q: Can I use the same routing for different products?**
A: Yes, if `Reusable` is checked. Multiple BOMs can use the same routing.

**Q: Can I change a routing code?**
A: No, codes are permanent. Clone with a new code if needed.

**Q: What happens if I delete a routing that's in use?**
A: BOMs lose their routing assignment but aren't deleted. You'll need to reassign them.

**Q: Can I have costs in multiple currencies?**
A: No, one routing uses one currency. Create separate routings for other currencies.

**Q: How often should I update costs?**
A: Review quarterly when labor rates or material costs change significantly.

**Q: Does version number affect anything?**
A: No, it's for tracking changes. BOMs remember which version they use.

**Q: Can multiple people edit a routing at same time?**
A: No, only one person can edit. If someone else saves first, you'll see a conflict message.

---

## Getting Help

**For Questions**:
- Contact your Technical Lead
- Check Help section in app

**For Issues**:
- Note the error message
- Contact IT support with screenshot
- Include: Routing code, action you were doing, error message

---

**Last Updated**: 2025-12-28
**Version**: 1.0
