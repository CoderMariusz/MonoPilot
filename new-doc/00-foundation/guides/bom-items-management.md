# BOM Items Management - User Guide

**Module**: Technical
**Feature**: Bill of Materials Components
**Audience**: Production Managers, Quality Managers
**Status**: Production ✅

## What is a BOM Item?

A **BOM Item** is one component in your product recipe. Think of a BOM like a cooking recipe:

- The recipe (BOM) is "Chocolate Cake"
- Items are the ingredients: 250g flour, 100g cocoa, 2 eggs, etc.
- Each item has a quantity and unit of measure

In manufacturing:
- **Item 1**: 50 kg Wheat Flour (raw material)
- **Item 2**: 5 kg Honey (ingredient)
- **Item 3**: 30 L Water
- **Item 4**: 100 plastic bags (packaging)

Each item can be assigned to a production step (e.g., "Mixing" or "Packaging").

---

## Getting Started

### Step 1: Create a BOM First

Before adding items, you need a BOM (Bill of Materials):

1. Go to **Technical → BOMs**
2. Click **[+ Create BOM]**
3. Fill in:
   - **BOM Name**: e.g., "White Bread Recipe v2.1"
   - **Product**: Select finished product
   - **Output**: e.g., 100 kg
   - **Routing** (optional): Production steps
4. Click **[Create]**

### Step 2: Add Your First Item

1. Click **[+ Add First Component]** or **[+ Add Item]**
2. **Select Component**:
   - Type to search by code or name
   - Select from Raw Materials, Ingredients, or Packaging
3. **Enter Quantity**: Amount needed per batch
4. **Unit of Measure**: Auto-fills from product (e.g., kg, L, pcs)
5. Click **[Save]**

### Step 3: Assign to Production Step (Optional)

1. Click **[Edit]** on the item
2. Under **Operation Assignment**, select from available steps
3. Click **[Save Changes]**

---

## Adding Items to a BOM

### Opening the Add Item Modal

**Option 1**: Click **[+ Add Item]** button at the top right

**Option 2**: Click **[+ Add First Component]** if BOM is empty

### Filling Out the Form

#### 1. Component (Required)

Search and select the material to add:

```
Component *
[Search materials, ingredients, packaging...    v]
```

- Type the **product code** (e.g., "RM-001") or **name** (e.g., "Wheat Flour")
- See product type and base unit of measure
- Only shows Raw Materials, Ingredients, Packaging, and Work-in-Progress

**Example**: Select "RM-001 - Wheat Flour Premium"
- Type: Raw Material
- Base UoM: kg

#### 2. Quantity (Required)

Enter how much you need per batch:

```
Quantity *
[50.000000]

Amount needed per batch (100 kg output)
```

**Rules**:
- Must be greater than 0
- Can be decimal (up to 6 decimal places)
- Reflects the final output quantity (100 kg)

**Examples**:
- 50.5 kg flour
- 5.123456 kg (precise measurement)
- 100 pcs (pieces)

**What if you get an error?**
- "Quantity must be greater than 0" → You entered 0 or negative. Try again with positive number.
- "Maximum 6 decimal places allowed" → Too many decimal places. Round to 6 places.

#### 3. Unit of Measure (Auto-filled)

```
Unit of Measure
[kg (from product)]     [disabled/grey]
```

**Auto-filled** from the product's base unit. You cannot change it in create mode.

**Why?** It ensures consistency with how the product is measured.

#### 4. Sequence (Optional)

```
Sequence
[10]

Order in production (auto: max+10)
```

**How it works**:
- **First item**: Gets sequence 10
- **Second item**: Gets sequence 20
- **Third item**: Gets sequence 30
- And so on (+10 each time)

**Why by 10?** Allows you to insert items later (e.g., insert at 15 between 10 and 20).

**Can I change it?** Yes. You can manually enter any number.

**Do items need unique sequences?** No. You can have items with the same sequence.

#### 5. Scrap Allowance % (Optional)

```
Scrap Allowance %
[2.0]

Expected material loss
```

**What is this?** The percentage of material expected to be lost or wasted during production.

**Example**:
- You add 102 kg of flour
- 2% is lost during milling
- Result: 100 kg usable flour
- So `scrap_percent = 2.0`

**Range**: 0 to 100
**Default**: 0 (no waste)
**Decimals**: Up to 2 decimal places (e.g., 2.5%)

**Common values**:
- 0% - No waste expected (packaging items)
- 1-2% - Typical manufacturing loss (flour, grains)
- 5% - Higher loss (perishables, liquids)
- 10% - Significant loss expected

#### 6. Operation Assignment (Optional)

Assign this item to a specific production step:

```
Operation Assignment (Optional)
[Op 10: Mixing                                  v]

Links this item to specific production step
```

**If BOM has no routing assigned**:
```
[i] Assign a routing to BOM first to enable operation assignment

[Change Routing] button
```

**What does this do?**
- Links the item to a production step
- Helps track which ingredients go into which step
- Used for work order planning

**Example**:
- Flour → Op 10: Mixing
- Honey → Op 10: Mixing
- Plastic Bag → Op 40: Packaging

**How to assign**:
1. Make sure BOM has routing assigned
2. Click dropdown
3. Select operation (e.g., "Op 10: Mixing")
4. Save

**No operation needed?** Leave as "None" or blank.

#### 7. Notes (Optional)

```
Notes (Optional)
┌───────────────────────────────────┐
│ Store in dry area below 20C.      │
│ Mix for 5 minutes minimum.        │
└───────────────────────────────────┘
(47/500 characters)
```

Special handling instructions for this item:

**Examples**:
- "Keep refrigerated until use"
- "Mix thoroughly for 5 minutes"
- "Add slowly while stirring"
- "Check temperature before adding"

**Limit**: Max 500 characters

### Saving the Item

Click **[Save]** button (bottom right).

**If validation errors appear**:
- Fix the required fields (marked with *)
- Check quantity is > 0
- Click Save again

**If a warning appears** (orange/amber banner):

```
[!] Warning

UoM mismatch: component base UoM is 'kg', you entered 'L'.
Unit conversion may be required during production.

You can still save this item, but verify this is correct.
```

This is a **warning, not an error**. You can still save. It alerts you that the unit of measure doesn't match the product's usual unit.

**What should I do?**
- If intentional (you really want different unit): Click **[Save]** anyway
- If mistake: Change the UoM back to product's base unit and save

The item is added to the BOM and the modal closes.

---

## Viewing Items in the Table

### The Items Table

```
BOM Items                                    [+ Add Item]

Seq | Component        | Type | Qty    | UoM | Operation | Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10  | RM-001           | RM   | 50.000 | kg  | Op 1: Mix | [v]
    | Wheat Flour      |      |        |     |           |
    | Scrap: 2.0%
20  | ING-002          | ING  |  5.000 | kg  | Op 1: Mix | [v]
    | Honey Organic    |      |        |     |           |
    | Scrap: 0.5%
30  | RM-010           | RM   | 30.000 | L   | -         | [v]
    | Water            |      |        |     |           |
40  | PKG-001          | PKG  |   100  | pcs | Op 4: Pack| [v]
    | Plastic Bag 1kg  |      |        |     |           |
    | Scrap: 5.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Items: 4
Total Input: 85.5 kg + 100 pcs
Expected Output: 100 kg
```

### Reading the Table

| Column | What it Shows | Example |
|--------|---------------|---------|
| **Seq** | Order of items | 10, 20, 30, 40 |
| **Component** | Product code (line 1) + Name (line 2) | RM-001 / Wheat Flour Premium |
| **Type** | Colored badge for product type | RM (blue), ING (amber), PKG (purple), WIP (green) |
| **Qty** | Quantity needed | 50.000, 5.000, 100 |
| **UoM** | Unit of measure | kg, L, pcs |
| **Operation** | Production step (if assigned) | Op 1: Mixing, Op 4: Packaging, or "-" |
| **Actions** | Edit or Delete buttons | [v] dropdown |

### Scrap Display

If an item has scrap > 0, it shows below the main row:

```
10 | RM-001             | RM   | 50.000 | kg | ...
   | Wheat Flour        |      |        |    |
   | Scrap: 2.0%
```

### Summary Section

At the bottom:

```
Total Items: 4
Total Input: 85.5 kg + 100 pcs
Expected Output: 100 kg
```

- **Total Items**: Count of components in BOM
- **Total Input**: Sum of all quantities grouped by unit
- **Expected Output**: Finished product quantity from BOM header

---

## Editing Items

### How to Edit an Item

1. Find the item in the table
2. Click **[v]** dropdown at the right end
3. Click **[Edit]**

The edit modal opens with the item's current data.

### What You Can Change

**Can Edit**:
- Quantity
- Unit of Measure (UoM)
- Sequence
- Scrap %
- Operation Assignment
- Notes

**Cannot Change**:
- Component (Product) - To change product, delete and add new item

**Why can't I change the component?**
- It would break traceability (what production used)
- If you need different component: Delete item and create new one

### Making Changes

1. Update the fields you want
2. Click **[Save Changes]**
3. Table updates immediately

**Example**: Increase flour from 50 kg to 75 kg

1. Click [Edit] on the flour item
2. Change Quantity from 50 to 75
3. Click [Save Changes]
4. Table now shows 75.000 kg

### Changing Sequence

You can reorder items by changing sequence numbers:

**Original**:
```
Seq 10: Flour
Seq 20: Honey
Seq 30: Water
```

**To move Water before Honey**:
1. Edit Water item
2. Change sequence from 30 to 15
3. Save
4. New order:
```
Seq 10: Flour
Seq 15: Water
Seq 20: Honey
```

---

## Deleting Items

### How to Delete

1. Find the item in the table
2. Click **[v]** dropdown at the right end
3. Click **[Delete]**

A confirmation dialog appears:

```
Delete Component?

Are you sure you want to delete this component?

Component: RM-001 - Wheat Flour Premium
Quantity: 50 kg
Operation: Op 10: Mixing

This action cannot be undone.

[Cancel]                    [Delete Component]
```

4. Click **[Delete Component]** to confirm (red button)
5. Or click **[Cancel]** to keep the item

**Warning**: Deleting cannot be undone. The item is removed from the BOM.

---

## Understanding UoM Mismatches

### What is a UoM Mismatch?

Each product has a **base unit of measure** (set when creating the product):

```
RM-001 (Wheat Flour)
Base UoM: kg

ING-002 (Honey)
Base UoM: kg
```

**Mismatch happens when**:
- Product base UoM is **kg**
- You enter **L** in the BOM item

### When Does the Warning Appear?

When editing an item and the UoM doesn't match:

```
[!] Warning

UoM mismatch: component base UoM is 'kg', you entered 'L'.
Unit conversion may be required during production.

You can still save this item, but verify this is correct.
```

### Should I Fix It?

**Usually yes**, change back to matching UoM:
- Product is "Wheat Flour" measured in kg
- Entering L is wrong unit
- Change back to kg

**Sometimes intentional**:
- You have special reason for different unit
- Manufacturing uses different equipment
- Production team knows about it

If intentional:
1. Keep the different UoM (system allows it)
2. Inform production team about conversion
3. Save anyway

---

## Permission Levels

**What can you do?** Depends on your role:

| Action | Owner | Admin | Prod Manager | Quality Mgr | Viewer |
|--------|-------|-------|--------------|------------|--------|
| View items | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add items | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit items | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete items | ✅ | ✅ | ❌ | ❌ | ❌ |

**If you can't do something**, it means:
- The button is hidden
- Or you get an error message
- Contact your manager to request access

---

## Common Tasks

### Task 1: Create BOM with Typical Items

**Scenario**: Create BOM for bread recipe

**Steps**:
1. Create BOM: "White Bread v1"
2. Add Item: RM-001 (Flour) 50 kg, sequence auto (10)
3. Add Item: ING-002 (Honey) 5 kg, sequence auto (20)
4. Add Item: RM-010 (Water) 30 L, sequence auto (30)
5. Add Item: PKG-001 (Bag) 100 pcs, sequence auto (40)

**Result**: BOM with 4 ingredients in order

### Task 2: Adjust Recipe Quantity

**Scenario**: Customer orders 150 kg instead of 100 kg (50% more)

**Current BOM**:
- Flour: 50 kg
- Honey: 5 kg
- Water: 30 L

**Steps**:
1. Edit Flour: 50 kg → 75 kg
2. Edit Honey: 5 kg → 7.5 kg
3. Edit Water: 30 L → 45 L

**Result**: All quantities increased 50%

### Task 3: Investigate Scrap Percentage

**Scenario**: Scrap loss is too high, need to review

**Steps**:
1. Look at items with scrap > 2%
2. Click Edit on high-scrap items
3. Review "Scrap Allowance %" values
4. Discuss with production team
5. Adjust if needed

**Example**: Flour scrap is 3% (expected 2%)
1. Edit Flour item
2. Change Scrap from 3.0 → 2.0
3. Click Save Changes
4. Production will use corrected value

### Task 4: Assign Items to Production Steps

**Scenario**: BOM created but items not assigned to operations

**Steps**:
1. Make sure BOM has Routing assigned
2. For each item, click Edit
3. Under "Operation Assignment", select step
4. Click Save Changes

**Mapping**:
- Flour, Honey, Water → Op 10: Mixing
- Plastic Bag → Op 40: Packaging

---

## Best Practices

### 1. Use Consistent Units

**Bad**:
- Flour: 50 kg
- Water: 30000 mL (should be 30 L)

**Good**:
- Flour: 50 kg
- Water: 30 L

**Why**: Easier to read and compare quantities

### 2. Set Realistic Scrap Percentages

**Bad**:
- Flour: 0% (no waste - unrealistic)
- Water: 0% (no waste - unrealistic)

**Good**:
- Flour: 1-2% (normal milling loss)
- Water: 0% (water typically used completely)

**Why**: Reflects actual production loss

### 3. Assign Items to Operations When Possible

**Bad**: Leave all items with "-" (no operation)

**Good**:
- Ingredients → Mixing step
- Packaging → Packaging step

**Why**: Helps production planning and traceability

### 4. Use Descriptive Notes

**Bad**: "special", "important"

**Good**:
- "Store in dry area below 20°C"
- "Add slowly while stirring at high speed"
- "Check temperature before use (20-25°C)"

**Why**: Production team knows exactly what to do

### 5. Review Before Production

Before work orders are released:
1. Check all items are added
2. Verify quantities are correct
3. Check scrap percentages are realistic
4. Confirm operation assignments make sense

---

## Troubleshooting

### Problem: "Add Item" Button is Greyed Out

**Cause**: You don't have permission to create items

**Solution**:
- Contact your manager
- Request "Production Manager" or "Admin" role
- Or ask someone with permissions to add items

### Problem: Can't Change Unit of Measure (UoM)

**Cause**: Field is read-only in create mode

**Why**: Unit auto-fills from product's base unit. It's protected to ensure consistency.

**Solution**:
- If you need different unit: Use the UoM that appears (it's from the product)
- If product has wrong base unit: Contact technical team to fix product

### Problem: "Operation does not exist in assigned routing"

**Cause**: Operation number doesn't match any in BOM's routing

**Solution**:
1. Check BOM has routing assigned
2. Verify operation sequence number
3. Contact production to confirm correct operation number
4. Try different operation or leave blank

### Problem: "Quantity must be greater than 0"

**Cause**: You entered 0, negative number, or empty field

**Solution**:
1. Enter positive number (e.g., 50, not 0)
2. Enter decimal if needed (e.g., 50.5)
3. Click Save again

### Problem: "Cannot assign operation: BOM has no routing assigned"

**Cause**: BOM doesn't have routing selected yet

**Solution**:
1. Go back to BOM header
2. Click [Change Routing]
3. Select a routing (production steps)
4. Click Save
5. Then edit item and assign operation

### Problem: UoM Warning Appears, Not Sure What to Do

**Cause**: You entered different unit than product's base unit

**Solution**:
1. **If mistake**: Change UoM back to product base unit and save
2. **If intentional**: Keep it and click Save (warning is just alert, doesn't block save)
3. **Not sure**: Ask production manager if this unit conversion is needed

---

## Tips & Tricks

### Tip 1: Use Search to Find Products

Searching is fast. Type:
- **Product code**: "RM-001" to find that exact product
- **Product name**: "flour" to find all flour products
- **Partial match**: "wheat" finds "Wheat Flour Premium"

### Tip 2: Auto-Sequence Saves Time

Sequence auto-calculates (+10 each time):
- First item: 10
- Second item: 20
- Third item: 30

You don't need to manually enter each one.

### Tip 3: Clone by Editing Existing Item

To add similar item:
1. Find existing item
2. Click Edit
3. Change product code only
4. Save as new item (edit creates new one if product different)

### Tip 4: Review Scrap Before Locking BOM

Before production uses BOM:
1. Look for items with high scrap%
2. Ask: "Is this realistic?"
3. Adjust if needed
4. Commit version

### Tip 5: Use Notes for Quality Requirements

Even small notes help:
- "Premium grade only"
- "Must be fresh (< 7 days old)"
- "Organic certified"

Production team will appreciate the clarity.

---

## Related Help

- [Technical Module Overview](../guides/technical-module.md)
- [BOMs Management](./boms-management.md)
- [Routings & Operations](./routings-management.md)
- [Products Management](./products-management.md)

---

## Contact & Support

**Questions about**:
- **BOM items feature**: Contact your Technical Manager
- **Permission issues**: Contact your Admin
- **Product setup**: Contact Product team
- **Production requirements**: Contact Production Manager

