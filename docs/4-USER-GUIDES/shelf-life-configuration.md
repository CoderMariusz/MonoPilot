# Shelf Life Configuration Guide

**Module**: Technical
**Feature**: Shelf Life Management
**Last Updated**: 2025-12-28
**Audience**: Production Managers, Quality Managers, Technical Directors

---

## Quick Start

**Time to complete**: 5-10 minutes per product

### Basic Workflow

1. Open Technical module > Products
2. Select product and click "Shelf Life Settings"
3. Review calculated shelf life from ingredients
4. Adjust if needed (override, storage conditions, FEFO settings)
5. Save and publish to production planning

---

## Understanding Shelf Life

### What is Shelf Life?

Shelf life is the number of days a product remains safe and maintains acceptable quality under specified storage conditions. In MonoPilot, shelf life determines:

- **Best Before Date**: Date printed on product labels
- **FEFO Picking Order**: Which lots to pick first when fulfilling orders
- **Shipment Eligibility**: Whether a lot can be shipped based on remaining shelf life

### Calculation Formula

MonoPilot automatically calculates shelf life using this formula:

```
Calculated Shelf Life = MIN(ingredient shelf lives) - processing impact - safety buffer

Where:
- MIN(ingredient shelf lives) = shortest shelf life among all BOM ingredients
- Processing impact = days lost due to heating, mixing, etc. (configurable)
- Safety buffer = percentage reduction for safety margin (default 20%)
- Result is at least 1 day (never zero)
```

**Example**:
- Flour shelf life: 180 days
- Yeast shelf life: 14 days (shortest)
- Water shelf life: Not tracked (unlimited)
- Processing impact: 2 days (baking process reduces freshness)
- Safety buffer: 20% of 14 = 2.8 ≈ 3 days
- **Calculated shelf life**: 14 - 2 - 3 = **9 days**

---

## Configuring Shelf Life

### Step 1: Open Shelf Life Configuration

In any product detail view:

```
1. Click "Shelf Life Settings" button
2. Dialog opens showing current configuration
3. Review calculated value from ingredients (if BOM exists)
```

### Step 2: Choose Calculation Method

#### Option A: Use Calculated Value (Default)

Best for: Most products made from ingredients with known shelf lives

```
Radio: "Use Calculated Value"
Result: Shelf life automatically = MIN(ingredients) - processing - buffer
Updates automatically when ingredient shelf lives change
```

**When to use**:
- Product ingredients have well-documented shelf lives
- BOM is complete and up-to-date
- No special testing or regulatory requirements

#### Option B: Manual Override

Best for: Products tested in-house or with regulatory requirements

```
Radio: "Manual Override"
Field "Shelf Life Days": Enter tested shelf life
Field "Override Reason": Explain why (required for audit)
Examples:
  - "Lab testing shows 7 days at room temperature"
  - "EU regulation requires minimum 5 days for fresh bread"
  - "Customer feedback indicates optimal consumption within 3 days"
```

**When to use**:
- Shelf life tested through accelerated testing or real-time studies
- Product doesn't fit standard ingredient-based calculation
- Regulatory or market requirements differ from calculated value
- Previous product batches have proven shelf life data

**Important**: Override reason is mandatory and becomes part of the audit trail. This is especially important for food safety compliance.

### Step 3: Configure Storage Conditions

Storage conditions directly affect actual shelf life. Products stored outside optimal conditions may spoil faster.

#### Temperature Range

Enter the minimum and maximum temperatures for safe storage:

```
Example for fresh bread:
  Minimum: 18°C
  Maximum: 25°C

⚠️ Rule: Minimum cannot exceed maximum
```

**Common ranges by product type**:

| Product Type | Min | Max | Notes |
|--------------|-----|-----|-------|
| Frozen products | -20°C | -15°C | Freezing required |
| Refrigerated (butter, yeast) | 2°C | 8°C | Cold chain essential |
| Room temperature (flour) | 15°C | 25°C | Dry storage |
| Shelf stable (canned goods) | 10°C | 30°C | Wide range acceptable |

#### Humidity Range (Optional)

For products sensitive to moisture (flour, powders):

```
Example for flour:
  Minimum: 30%
  Maximum: 50%

Leave blank for products not affected by humidity
```

#### Special Storage Conditions

Select all that apply:

- **Keep in original packaging**: Prevents contamination, maintains barrier properties
- **Protect from direct sunlight**: Light causes oxidation and quality loss
- **Refrigeration required**: Essential - product unsafe if not refrigerated
- **Freezing allowed**: Can be frozen without quality loss
- **Controlled atmosphere**: Requires oxygen/nitrogen-flushed packaging

#### Storage Instructions (Optional)

Add text that will print on product labels:

```
Example:
"Store in cool, dry place. Keep away from direct sunlight.
Once opened, consume within 2 days. Do not freeze."
```

This appears on packaging to guide customers on proper storage.

### Step 4: Configure Best Before Calculation

How MonoPilot calculates the "Best Before" date on labels.

#### Shelf Life Mode

**Fixed Days** (Recommended for most products):
```
Best Before Date = Production Date + Shelf Life Days

Example:
  Product made on: 2025-01-15
  Shelf life: 10 days
  Best Before: 2025-01-25
```

**Rolling** (For products with long ingredient shelf lives):
```
Best Before Date = Earliest Ingredient Expiry - Processing Impact

Example:
  Flour expires: 2025-06-30
  Yeast expires: 2025-01-25 (expires first)
  Processing impact: 2 days
  Best Before: 2025-01-23
```

Use Rolling mode only if:
- Multiple ingredients have widely different shelf lives
- One ingredient is the bottleneck
- You track individual ingredient lot expiries

#### Label Format

Choose how Best Before appears on product:

- **Best Before: DD/MM/YYYY** (Most common, e.g., "Best Before: 25/01/2025")
- **Best Before End: MM/YYYY** (For long shelf life, e.g., "Best Before: 01/2025")
- **Use By: DD/MM/YYYY** (High-risk foods, e.g., "Use By: 25/01/2025")

Regulation: High-risk foods (meat, dairy, ready-to-eat) should use "Use By" format.

### Step 5: Configure FEFO/FIFO Settings

Warehouse picking strategy and expiry enforcement.

#### Picking Strategy

**FEFO** (First Expired, First Out):
```
Recommendation: Use this for products with <30 day shelf life
System automatically picks lots expiring soonest
Prevents waste and ensures customer gets freshest product
```

**FIFO** (First In, First Out):
```
Recommendation: Use this for long shelf life products (>180 days)
System picks oldest lots first by receipt date
Works when expiry dates are far in the future
```

#### Minimum Remaining Shelf Life for Shipment

Specifies how much shelf life remaining before product can leave warehouse:

```
Example for bread (10 day shelf life):
  Minimum for shipment: 5 days

Meaning:
  - If lot has 5+ days remaining: Can ship
  - If lot has <5 days remaining: Cannot ship
  - This is 50% of total shelf life
```

**Common rules**:
- Fast-moving products (3-7 days): 50-70% minimum
- Shelf-stable products (>30 days): 25-50% minimum
- Fresh/refrigerated (2-5 days): 60-80% minimum

#### Enforcement Level

Controls system behavior when lot doesn't meet minimum:

**Suggest**:
```
Behavior: Show warning, allow operator to override
Use for: Low-risk products where some flexibility needed
Example: Flour (shelf stable, low risk)
```

**Warn**:
```
Behavior: Require supervisor confirmation to proceed
Use for: Most fresh products
Example: Fresh bread, pastries
```

**Block**:
```
Behavior: Prevent shipment entirely, no override possible
Use for: High-risk/regulated products
Example: Prepared salads, meat products
```

### Step 6: Set Expiry Warning Thresholds

Configure when quality team gets alerts:

```
Expiry Warning Days: 7 days (default)
  Alert when: Days remaining = warning threshold
  Action: Quality team reviews lot status

Expiry Critical Days: 3 days (default)
  Alert when: Days remaining = critical threshold
  Action: Escalate - lot should ship/reject soon or expires

Validation Rule: Critical days <= warning days
```

---

## Ingredient Shelf Life Configuration

Products need ingredient shelf life data to calculate automatically.

### Configuring an Ingredient

**Access**: Technical > Raw Materials > Select ingredient > Shelf Life tab

#### Required Information

**Shelf Life Days**:
```
Source: Supplier specification, lab testing, or regulatory requirement
Example: Yeast Fresh = 14 days
Must be: Positive number, 1-3650 days
```

**Shelf Life Source**:
```
Supplier: Product specification sheet from supplier
Internal Testing: Company's own shelf life study
Regulatory: Government standard (e.g., FDA, EU)
Industry Standard: Industry association guidelines
```

**Supplier & Specification**:
```
Supplier Name: "BioYeast Ltd."
Specification Reference: "SPEC-YEAST-2024-v2"
(Used for traceability and compliance documentation)
```

#### Storage Conditions

Same as product storage:

**Temperature Range** (Required):
```
Yeast: Min 2°C, Max 8°C (refrigeration essential)
Flour: Min 18°C, Max 25°C (room temperature)
```

**Humidity Range** (Optional):
```
Only if ingredient is affected by moisture
Flour: Min 30%, Max 50% (dry environment needed)
```

**Special Conditions**:
```
Checkboxes for special requirements
Example: Yeast might require "refrigeration_required"
```

#### Receiving Quality Checks

**Minimum Acceptable on Receipt**:
```
Example for Yeast (14 day total shelf life):
  Set to: 12 days

Meaning:
  Reject deliveries with <12 days remaining
  Ensures 2+ days shelf life buffer in inventory
```

**Quarantine**:
```
Enable if: Ingredient requires quality testing before use
Duration: How many days to quarantine (1-30 days)

Example: Fresh yeast requires 2-day freshness verification
```

### Triggering Recalculation

When you update ingredient shelf life, all products using that ingredient are automatically flagged for recalculation.

**What happens**:
1. Ingredient shelf life updated
2. All dependent products marked as "needs_recalculation"
3. System shows "Recalculation Queue" with affected products
4. Quality team can bulk recalculate when ready

**Bulk Recalculation**:
```
1. Go to Technical > Shelf Life > Recalculation Queue
2. See all products flagged for recalculation
3. Review changes (old shelf life → new shelf life)
4. Click "Recalculate All" or select specific products
5. System updates all affected products
6. Audit log shows what changed and why
```

---

## Common Scenarios

### Scenario 1: Fresh Bread with Yeast

**Ingredients**:
- Flour: 180 days shelf life
- Yeast: 14 days shelf life
- Water: Not tracked
- Butter: 60 days shelf life
- Milk powder: 365 days shelf life

**Calculation**:
```
Shortest ingredient: Yeast at 14 days
Processing impact: 2 days (from baking process)
Safety buffer: 20% of 14 = 3 days
Calculated: 14 - 2 - 3 = 9 days

Storage: 18-25°C, 40-60% humidity
Best Before: Fixed (9 days from production)
FEFO: Yes (enforce 5 days minimum for shipment)

Final Configuration: 9 day shelf life
```

### Scenario 2: Shelf-Stable Canned Product

**Ingredients**:
- All ingredients shelf stable (>365 days)

**Calculation**:
```
All ingredients have long shelf lives
No clear bottleneck
→ Use manual override based on regulatory requirement or testing

Set to: 365 days (1 year)
Reason: "Product tested per FDA guidelines. Sealed container prevents deterioration."
```

**Storage**: 10-30°C, no humidity control needed

**Best Before**: "Best Before End: MM/YYYY" (e.g., "12/2025")

**FIFO**: Yes (long shelf life allows FIFO picking)

### Scenario 3: Product with Changed Packaging

**Situation**: New packaging film extends shelf life by 20%

**Steps**:
```
1. Run lab testing with new packaging
2. Override shelf life with tested result
3. Reason: "New packaging film (PKG-2024) tested per accelerated study. Results show 20% improvement. Reference: SL-2024-017"
4. Optional: Set expiry date on override (3 months trial period)
5. Quality team monitors shipments for customer feedback
```

### Scenario 4: Ingredient Shelf Life Changed

**Situation**: Yeast supplier changes from 14 days to 12 days shelf life

**What MonoPilot does automatically**:
```
1. Update ingredient: 14 → 12 days
2. Flag all bread products for recalculation
3. Show in Recalculation Queue
4. When you recalculate:
   Old calculation: MIN(14) - 2 - 3 = 9 days
   New calculation: MIN(12) - 2 - 2 = 8 days (safety buffer reduced)
   Audit log records: "Yeast shelf life changed by Anna Nowak"
5. Labels automatically update to reflect 8-day shelf life
```

---

## Troubleshooting

### Error: "No Active BOM Found"

**Problem**: Cannot calculate shelf life automatically

**Causes**:
- Product has no BOM
- BOM is inactive (draft or archived)

**Solutions**:
1. Create or activate BOM for product
2. Add all ingredients with quantities
3. Save BOM and return to shelf life config
4. Click "Recalculate from Ingredients"

Or use manual override with tested shelf life.

### Error: "Missing Shelf Life for Ingredient"

**Problem**: Calculation failed because ingredient has no shelf life

**Causes**:
- Ingredient doesn't have shelf life configured
- Ingredient shelf life field is empty

**Solutions**:
1. Find the ingredient in the error message
2. Go to Technical > Raw Materials > Select ingredient
3. Configure shelf life days and source
4. Return to product shelf life config
5. Click "Recalculate from Ingredients"

### Error: "Minimum Temperature Cannot Exceed Maximum"

**Problem**: Temperature range validation failed

**Example**: Min: 25°C, Max: 18°C (invalid)

**Solution**: Correct to Min: 18°C, Max: 25°C

### Error: "Override Reason is Required"

**Problem**: Trying to save override without explanation

**Solution**: Click in "Override Reason" field and explain why you're overriding. Required for audit trail.

### Warning: "Override Exceeds Calculated Shelf Life"

**Example**:
```
Calculated: 10 days
Your override: 15 days
```

**Meaning**: You're extending shelf life beyond what ingredients support

**When this is okay**:
- Based on lab testing (reference test report)
- Regulatory requirement allows it
- Packaging improvement extends freshness

**Always provide reason** explaining the basis for extension.

---

## Best Practices

### 1. Use Calculated Method When Possible

**Advantage**: Automatically updates when ingredients change
**Requirement**: All BOM ingredients must have shelf life configured

### 2. Document Override Reasons

**Reason examples (good)**:
- "Accelerated shelf life study (ref: SL-2024-001) shows 14 days safe"
- "Customer testing confirms 7 days optimal freshness"
- "EU regulation (Reg 1169/2011) requires 5 day minimum for fresh bread"
- "New packaging film extends shelf life; test results in quality drive"

**Reason examples (bad - avoid)**:
- "Just longer"
- "Customer asked for it"
- "Industry standard" (cite which standard!)
- "Testing showed it's fine" (reference the actual test report)

### 3. Configure Storage Conditions Correctly

**Why it matters**: Affects shelf life in real world
- If you say 18-25°C but warehouse is 28°C, product spoils faster
- Customers follow label instructions → unhappy if product spoils early

**Solution**: Set realistic ranges or add storage instructions

```
Bad: "18-25°C" but warehouse is actually 22-28°C
Good: "18-28°C" (covers reality) or "20-25°C preferred, tolerance to 28°C"
```

### 4. Set Appropriate FEFO Minimums

**Too high** (e.g., 80% minimum for 10-day product = 8 days minimum):
- Only 2 days in warehouse before shipping
- Tight logistics, may miss orders

**Too low** (e.g., 10% minimum = 1 day remaining):
- Risk of customer complaints
- Products may expire in customer location

**Good rule of thumb**:
- Quick-spoil products (2-7 days): 50-70% minimum
- Normal products (7-30 days): 40-60% minimum
- Shelf-stable (>30 days): 20-40% minimum

### 5. Review Recalculation Queue Monthly

**When**: End of each month or after ingredient changes

**What to do**:
1. Check Recalculation Queue
2. Review products marked for recalculation
3. Understand which ingredient changed
4. Approve bulk recalculation
5. Verify updated shelf lives make sense
6. Document any surprises in quality notes

### 6. Audit Trail = Compliance

**MonoPilot automatically records**:
- Who changed what
- When changes occurred
- Old values vs. new values
- Reason for changes (if override)

**Use for**:
- Food safety audits
- Regulatory inspections
- Customer inquiries
- Root cause analysis if quality issue

---

## FAQ

**Q: If I set 10-day shelf life, does product expire on day 10?**

A: "Best Before" date is production date + shelf life days. Product is safe for some time after, but quality may decline. Use "Use By" for high-risk foods (meat, dairy).

**Q: Can I change shelf life after production starts?**

A: Yes, but labels already printed won't update. New production batches get new shelf life. Consider re-labeling high-value lots if shelf life significantly increases.

**Q: What if ingredient shelf life changes mid-month?**

A: MonoPilot flags affected products in Recalculation Queue. You can bulk update them. Labels for existing stock won't change - only future production.

**Q: Is FEFO always better than FIFO?**

A: For products <30 days: Yes, FEFO prevents waste. For stable products >180 days: Either works; FIFO simpler.

**Q: What if warehouse is warmer than recommended?**

A: Set temperature range to match reality, or use storage instructions: "Ideal 18-25°C; can tolerate up to 30°C for short periods."

**Q: How often should I update ingredient shelf lives?**

A: When supplier changes, or at least annually. Some suppliers change specs seasonally.

---

## Support

**Questions about**:
- Specific product shelf life: Contact Quality Manager
- Ingredient shelf life sources: Contact Supplier Management
- Storage condition specifications: Check product specification documents
- System errors: Contact Technical Support

---

