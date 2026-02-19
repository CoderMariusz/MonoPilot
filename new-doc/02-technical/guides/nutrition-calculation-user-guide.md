# Nutrition Calculation User Guide

**Story**: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
**Version**: 1.0
**Last Updated**: 2025-12-29
**Audience**: Food Manufacturers, Production Managers, Quality Assurance

## Overview

MonoPilot's nutrition calculation system automatically computes nutrition facts from Bill of Materials (BOM) ingredients and generates FDA-compliant nutrition labels. This guide covers:

- Automatic nutrition calculation from BOM ingredients
- Manual nutrition data override with audit trail
- Serving size calculation methods
- FDA label generation and export
- FDA compliance best practices

## Table of Contents

1. [Auto-Calculation from BOM](#1-auto-calculation-from-bom)
2. [Manual Override Workflow](#2-manual-override-workflow)
3. [Serving Size Calculator](#3-serving-size-calculator)
4. [FDA Label Generation](#4-fda-label-generation)
5. [Understanding % Daily Value](#5-understanding-daily-value)
6. [FDA Compliance Requirements](#6-fda-compliance-requirements)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Auto-Calculation from BOM

### What is Auto-Calculation?

MonoPilot automatically calculates product nutrition facts by aggregating nutrition data from all ingredients in your Bill of Materials (BOM). The system uses a **weighted average** approach based on ingredient quantities.

### How It Works

**Step 1: Formula**

For each nutrient (e.g., protein, fat, carbohydrates):

```
Total Nutrient = SUM(ingredient_nutrient_per_100g × ingredient_quantity_kg × 10)
```

**Step 2: Yield Adjustment**

If actual production yield differs from expected:

```
Yield Factor = Expected Output (kg) / Actual Output (kg)
Adjusted Nutrient = Total Nutrient × Yield Factor
```

**Step 3: Per 100g Conversion**

```
Nutrient per 100g = (Adjusted Nutrient / Actual Output in grams) × 100
```

### Example Calculation

**Product**: Granola Bar (500g batch)

**Ingredients**:
- Oats: 300g (protein: 13.2g/100g)
- Honey: 150g (protein: 0.3g/100g)
- Almonds: 50g (protein: 21.2g/100g)

**Calculation**:
1. Oats protein: 13.2 × 3 = 39.6g
2. Honey protein: 0.3 × 1.5 = 0.45g
3. Almonds protein: 21.2 × 0.5 = 10.6g
4. **Total protein**: 39.6 + 0.45 + 10.6 = 50.65g
5. **Per 100g**: (50.65 / 500) × 100 = **10.13g protein per 100g**

### Prerequisites

Before auto-calculation can work:

- [ ] Product must have an **active BOM**
- [ ] All ingredients must have **nutrition data** in the system
- [ ] BOM must specify **quantities and UOMs** (units of measure)
- [ ] Expected **output quantity** must be set

### Using Auto-Calculation

**In the UI:**

1. Navigate to **Technical > Products > [Product Name]**
2. Click **Nutrition Facts** tab
3. Click **Calculate from BOM** button
4. Review the calculation breakdown showing:
   - Ingredient contributions (by weight)
   - Yield adjustment factor
   - Total per batch
   - **Per 100g values** (what appears on the label)
5. Click **Save** to store the calculated values

**What You'll See:**

```
Calculation Result:

Ingredients:
- Oats (300g): 79% contribution
  • Energy: 1,110 kcal
  • Protein: 39.6g
  • Fat: 19.8g
  • Carbs: 174g

- Honey (150g): 15% contribution
  • Energy: 456 kcal
  • Protein: 0.45g
  • Fat: 0g
  • Carbs: 122.4g

- Almonds (50g): 6% contribution
  • Energy: 289 kcal
  • Protein: 10.6g
  • Fat: 24.8g
  • Carbs: 10.8g

Yield:
- Expected: 500g
- Actual: 475g (5% evaporation)
- Adjustment Factor: 1.053

Final (per 100g):
- Energy: 390 kcal
- Protein: 10.7g
- Fat: 9.4g
- Carbohydrate: 64.7g
```

### Supported Units of Measure (UOM)

The system automatically converts between units:

**Weight Units:**
- kg (kilogram)
- g (gram)
- mg (milligram)
- lb, lbs (pound)
- oz (ounce)

**Volume Units** (converted using density):
- l, liter, litre (liter)
- ml (milliliter)

**Note**: Volume units assume water density (1g/ml) unless a product-specific density is defined.

### Handling Missing Ingredient Data

If any ingredient is missing nutrition data, you'll see:

```
⚠️ Cannot calculate: Missing nutrition data

Missing ingredients:
- Dark Chocolate Chips (CHOC-001): 100g
- Vanilla Extract (VAN-001): 5ml

Actions:
1. Add ingredient nutrition data
2. Skip these ingredients (partial calculation)
3. Use manual override instead
```

**Option 1: Add Missing Data**
- Navigate to **Technical > Ingredients > [Ingredient Name]**
- Click **Nutrition** tab
- Enter nutrition values (per 100g/100ml)
- Save and retry calculation

**Option 2: Partial Calculation**
- Click **Calculate Anyway** to exclude missing ingredients
- System will show warning: "Partial calculation - some ingredients excluded"
- Use only if missing ingredients are minor (<5% of total weight)

---

## 2. Manual Override Workflow

### When to Use Manual Override

Use manual override when:
- Laboratory test results are available (most accurate)
- Supplier Certificate of Analysis (CoA) is provided
- Auto-calculation is not possible (no BOM or missing data)
- Regulatory compliance requires third-party testing
- Product formulation is proprietary

### Override Process

**Step 1: Navigate to Override Form**

1. Go to **Technical > Products > [Product Name]**
2. Click **Nutrition Facts** tab
3. Click **Manual Override** button

**Step 2: Enter Nutrition Values**

All values are **per 100g** or **per 100ml**:

```
Required Fields:
✓ Energy (kcal)
✓ Protein (g)
✓ Fat (g)
✓ Carbohydrate (g)
✓ Serving Size (g or ml)
✓ Servings per Container

Recommended Fields:
• Saturated Fat (g)
• Trans Fat (g)
• Sugar (g)
• Added Sugar (g)
• Fiber (g)
• Sodium (mg)

FDA 2016 Required:
• Vitamin D (mcg)
• Calcium (mg)
• Iron (mg)
• Potassium (mg)
```

**Step 3: Document the Source**

**Critical for FDA compliance and audit trail:**

```
Source: [REQUIRED - Select one]
- Lab Test (preferred)
- Supplier CoA
- USDA Database
- Calculated
- Manual Entry

Reference: [REQUIRED]
- Lab report number (e.g., "LAB-2024-12345")
- CoA document ID (e.g., "COA-ALM-2024-Q4")
- Database source (e.g., "USDA SR-28, NDB #12345")

Notes: [OPTIONAL]
- Test method used (e.g., "AOAC 990.03")
- Confidence level
- Special conditions
- Expiration date
```

**Step 4: Review and Save**

The system automatically:
- Records **who** made the override (user ID)
- Records **when** the override was made (timestamp)
- Preserves the **previous calculated values** (audit trail)
- Marks the record as **manual override** (visible badge in UI)

### Example: Lab Test Override

**Scenario**: You sent your "Artisan Sourdough Bread" to a certified lab for nutrition testing.

**Lab Report**:
- Sample ID: LAB-2024-98765
- Test Date: 2024-12-20
- Method: AOAC Official Methods

**Results (per 100g)**:
- Energy: 265 kcal
- Protein: 8.9g
- Fat: 3.2g
- Saturated Fat: 0.6g
- Carbohydrate: 49.1g
- Fiber: 2.8g
- Sugar: 3.1g
- Sodium: 490mg

**How to Enter**:

1. Click **Manual Override**
2. Fill in values exactly as on lab report
3. Source: Select **Lab Test**
4. Reference: Enter `LAB-2024-98765`
5. Notes: Enter `AOAC method, tested by XYZ Labs, expires 2025-12-20`
6. Serving Size: 50g (2 slices)
7. Servings per Container: 16 (800g loaf)
8. Click **Save**

**Result**:
```
✓ Nutrition data saved (Manual Override)
Override Source: Lab Test (LAB-2024-98765)
Overridden By: John Smith (john@bakery.com)
Overridden At: 2024-12-29 14:35:22 UTC

⚠️ This data will be used for label generation.
```

### Viewing Audit Trail

To see the complete history:

1. Click **View History** button
2. See all changes:

```
Audit Trail:

2024-12-29 14:35:22 - Manual Override
User: John Smith
Source: Lab Test (LAB-2024-98765)
Changes: All fields updated from lab results

2024-12-15 10:22:45 - BOM Calculation
User: System (auto)
BOM Version: v3.2
Values: Energy 270kcal, Protein 9.1g, Fat 3.5g...

2024-11-01 09:15:30 - Manual Override
User: Sarah Jones
Source: Supplier CoA (COA-FLOUR-2024-Q3)
Changes: Initial values from flour supplier data
```

---

## 3. Serving Size Calculator

### Overview

FDA requires serving sizes based on **RACC** (Reference Amount Customarily Consumed). MonoPilot provides three calculation methods to determine appropriate serving sizes.

### Method 1: Weight Division

**Best for**: Products sold by weight (bread, cheese, meat)

**Formula**:
```
Serving Size (g) = Total Weight (g) / Number of Servings
```

**Example**: 800g bread loaf, want 16 servings
```
Serving Size = 800g / 16 = 50g (approximately 2 slices)
```

**In the UI**:
1. Click **Calculate Serving Size**
2. Select **Weight Division**
3. Enter Total Weight: `800` g
4. Enter Number of Servings: `16`
5. Result: **50g per serving**

### Method 2: Piece Dimensions

**Best for**: Discrete units (cookies, bars, tablets)

**Formula**:
```
Serving Size (g) = Total Weight (g) / Number of Pieces
```

**Example**: 500g batch makes 10 granola bars
```
Serving Size = 500g / 10 = 50g per bar
```

**In the UI**:
1. Click **Calculate Serving Size**
2. Select **Piece Dimensions**
3. Enter Total Weight: `500` g
4. Enter Number of Pieces: `10`
5. Result: **50g per piece**

### Method 3: Volume Division

**Best for**: Liquids and pourable products (juice, milk, oil)

**Formula**:
```
Servings = Total Volume (ml) / Serving Size (ml)
Weight (g) = Serving Size (ml) × Density (g/ml)
```

**Example**: 1000ml orange juice, FDA RACC is 240ml
```
Servings = 1000ml / 240ml = 4.17 ≈ 4 servings
Weight = 240ml × 1.04 g/ml = 249.6g ≈ 250g
```

**In the UI**:
1. Click **Calculate Serving Size**
2. Select **Volume Division**
3. Enter Total Volume: `1000` ml
4. Enter Serving Size: `240` ml
5. Select Product Type: `Juice` (for density correction)
6. Result: **250g (240ml) per serving, 4 servings per container**

**Density Values** (automatic conversion):
- Water: 1.00 g/ml
- Milk: 1.03 g/ml
- Cream: 1.01 g/ml
- Yogurt: 1.04 g/ml
- Juice: 1.04 g/ml
- Oil: 0.92 g/ml
- Honey: 1.42 g/ml
- Syrup: 1.35 g/ml

### FDA RACC Lookup

**What is RACC?**

RACC (Reference Amount Customarily Consumed) is the FDA-mandated serving size for nutrition labels. It represents the amount typically eaten in one sitting.

**How to Use RACC Lookup**:

1. Click **Look up FDA RACC**
2. Select your product category from dropdown:
   - Bread → 50g
   - Cookies → 30g
   - Milk → 240ml
   - Cheese → 30g
   - Yogurt → 170g
   - (and 100+ more categories)

3. System shows:
   ```
   FDA RACC for "Bread":
   - Reference Amount: 50g
   - Description: Sliced bread, rolls
   - Common Servings:
     • 1 slice (25g)
     • 2 slices (50g) ✓ RACC
   ```

4. Click **Use This Serving Size** to apply 50g

### RACC Variance Validation

FDA allows **±20% variance** from RACC without special disclosure.

**Example**: Your bread serving is 60g, RACC is 50g
```
Variance = (60g - 50g) / 50g × 100 = 20%
Status: ✓ Within FDA tolerance
```

**Example**: Your cookies are 50g each, RACC is 30g
```
Variance = (50g - 30g) / 30g × 100 = 67%
Status: ⚠️ Exceeds FDA tolerance (>20%)

Warning: Serving size differs from FDA RACC by 67% (larger).
Consider using 30g serving size or stating "2 cookies (50g)"
if 2 cookies is the RACC.
```

**Recommendations**:
- **< 20% variance**: No action needed, use your serving size
- **> 20% variance**: Consider:
  - Adjusting serving size to match RACC
  - Stating serving as "X pieces (Xg)" if multiple pieces = RACC
  - Consulting FDA regulations for your category

---

## 4. FDA Label Generation

### Label Formats Supported

1. **FDA 2016 Format** (US market) - Current standard
2. **EU Format** (European market) - Uses kJ and Salt

### Generating an FDA Label

**Step 1: Ensure Data is Complete**

Required data:
- [ ] Nutrition values (per 100g)
- [ ] Serving size (g or ml)
- [ ] Servings per container
- [ ] Energy in kcal (system auto-converts to kJ)

**Step 2: Generate Label**

1. Navigate to **Technical > Products > [Product Name]**
2. Click **Nutrition Facts** tab
3. Click **Generate FDA Label** button
4. Preview appears:

```
┌─────────────────────────────┐
│  Nutrition Facts            │
├─────────────────────────────┤
│ 16 servings per container   │
│ Serving size    50g (2slc)  │
├═════════════════════════════┤
│ Amount per serving          │
│ Calories            133     │
│                    % DV*    │
├─────────────────────────────┤
│ Total Fat 1.6g         2%   │
│   Saturated Fat 0.3g   2%   │
│   Trans Fat 0g              │
│ Cholesterol 0mg        0%   │
│ Sodium 245mg          11%   │
│ Total Carb 24.6g       9%   │
│   Dietary Fiber 1.4g   5%   │
│   Total Sugars 1.6g         │
│     Incl. 0g Added Sugars 0%│
│ Protein 4.5g                │
├─────────────────────────────┤
│ Vitamin D 0mcg         0%   │
│ Calcium 20mg           2%   │
│ Iron 1.2mg             7%   │
│ Potassium 85mg         2%   │
├─────────────────────────────┤
│ * % Daily Value (DV) tells │
│ you how much a nutrient in  │
│ a serving contributes to a  │
│ daily diet. 2,000 calories  │
│ a day is used for general   │
│ nutrition advice.           │
└─────────────────────────────┘
```

**Step 3: Review FDA 2016 Compliance**

The label automatically includes:

**Typography** (FDA mandated):
- Title "Nutrition Facts": 18pt bold, all caps
- "Calories": 16pt bold
- Nutrients: 8pt
- Footnote: 7pt

**Required Nutrients** (FDA 2016):
- ✓ Calories
- ✓ Total Fat (with % DV)
- ✓ Saturated Fat (with % DV)
- ✓ Trans Fat (no % DV)
- ✓ Cholesterol (with % DV)
- ✓ Sodium (with % DV)
- ✓ Total Carbohydrate (with % DV)
- ✓ Dietary Fiber (with % DV)
- ✓ Total Sugars (no % DV)
- ✓ Added Sugars (with % DV)
- ✓ Protein (no % DV unless claim made)
- ✓ Vitamin D (with % DV)
- ✓ Calcium (with % DV)
- ✓ Iron (with % DV)
- ✓ Potassium (with % DV)

**Note**: Vitamin A and Vitamin C are **no longer required** under FDA 2016 rules (changed from 1993 rules).

### Adding Allergen Information

If your product contains allergens:

1. Click **Add Allergens** button
2. Select allergens:
   - **Contains**: Milk, Eggs, Wheat, Soy, Peanuts, Tree Nuts, Fish, Shellfish, Sesame
   - **May Contain**: Same list (for cross-contamination warnings)

3. Example result:

```
Contains: Milk, Wheat, Tree Nuts (Almonds).
May Contain: Soy.
```

This appears at the bottom of the nutrition label.

### Exporting Labels

**PDF Export** (for printing):

1. Click **Export as PDF**
2. Options:
   - Page Size: 4" × 6" (default label size)
   - Or: 8.5" × 11" (letter size)
   - Resolution: 300 DPI (print quality)
3. Click **Download PDF**
4. File saved as: `nutrition-label-[PRODUCT-CODE]-[DATE].pdf`

**Use cases**:
- Print on label printer
- Send to packaging supplier
- Attach to product documentation
- Archive for compliance records

**SVG Export** (for professional printing):

1. Click **Export as SVG**
2. Vector format ensures perfect quality at any size
3. File saved as: `nutrition-label-[PRODUCT-CODE]-[DATE].svg`

**Use cases**:
- Send to graphic designer for packaging design
- Import into Adobe Illustrator / Inkscape
- Professional print shops
- Scalable to any size without quality loss

---

## 5. Understanding % Daily Value

### What is % Daily Value?

% Daily Value (% DV) tells consumers how much a nutrient in one serving contributes to a daily diet. FDA uses **2,000 calories per day** as the reference.

### FDA Daily Value Reference Table

| Nutrient | Daily Value | Unit |
|----------|-------------|------|
| Total Fat | 78 g | per day |
| Saturated Fat | 20 g | per day |
| Cholesterol | 300 mg | per day |
| Sodium | 2,300 mg | per day |
| Total Carbohydrate | 275 g | per day |
| Dietary Fiber | 28 g | per day |
| Added Sugars | 50 g | per day |
| Protein | 50 g | per day |
| Vitamin D | 20 mcg | per day |
| Calcium | 1,300 mg | per day |
| Iron | 18 mg | per day |
| Potassium | 4,700 mg | per day |

### Calculation Formula

```
% DV = (Nutrient Value per Serving / Daily Value) × 100
```

Round to nearest whole number.

### Examples

**Example 1: Sodium**

Your bread serving (50g) contains **245mg sodium**.

```
% DV = (245mg / 2,300mg) × 100 = 10.65% ≈ 11%
```

**Label shows**: "Sodium 245mg **11%**"

**Example 2: Fiber**

Your bread serving (50g) contains **1.4g fiber**.

```
% DV = (1.4g / 28g) × 100 = 5%
```

**Label shows**: "Dietary Fiber 1.4g **5%**"

**Example 3: Low Values (<1%)**

Your bread serving contains **0.3g saturated fat**.

```
% DV = (0.3g / 20g) × 100 = 1.5% ≈ 2%
```

**Label shows**: "Saturated Fat 0.3g **2%**"

If the value rounds to 0%, show **"<1%"** instead of 0%.

### Nutrients WITHOUT % DV

These nutrients do **not** show % DV on FDA 2016 labels:
- Trans Fat (show 0g or amount)
- Total Sugars (only Added Sugars shows % DV)
- Protein (unless a protein claim is made)

### Interpreting % DV

FDA guidance for consumers:

- **5% DV or less** = Low in that nutrient
- **20% DV or more** = High in that nutrient

**Example messaging**:
- Your granola bar has 15% DV Iron → "Good source of Iron"
- Your chips have 28% DV Sodium → "High in Sodium"

---

## 6. FDA Compliance Requirements

### FDA 2016 Update Summary

On May 27, 2016, FDA issued new nutrition labeling regulations. Key changes:

**Required Changes**:
1. ✓ Added Sugars (new requirement)
2. ✓ Vitamin D and Potassium (new requirements)
3. ✗ Vitamin A and Vitamin C (no longer required)
4. ✓ Updated Daily Values for sodium, fiber, Vitamin D
5. ✓ Larger, bold "Calories"
6. ✓ Updated serving sizes to reflect actual consumption

**Compliance Deadline**: January 1, 2021 (completed)

### MonoPilot FDA 2016 Compliance

MonoPilot automatically ensures:

- [x] All required nutrients included
- [x] Correct % DV calculations (2016 values)
- [x] Proper typography (18pt title, 16pt calories, 8pt nutrients)
- [x] Added Sugars shown separately
- [x] Vitamin D, Calcium, Iron, Potassium included
- [x] Vitamin A, Vitamin C excluded (unless product claims)
- [x] Trans Fat shown (even if 0g)
- [x] Correct footnote text
- [x] Serving sizes validated against RACC

### Common Compliance Mistakes (Avoided by MonoPilot)

**Mistake 1**: Using old (1993) Daily Values
- ❌ Old sodium DV: 2,400mg
- ✓ **Correct**: 2,300mg (2016 update)

**Mistake 2**: Not showing Added Sugars
- ❌ Only showing "Total Sugars"
- ✓ **Correct**: Show both "Total Sugars" and "Includes Xg Added Sugars"

**Mistake 3**: Including Vitamin A and C
- ❌ Showing Vit A and Vit C (1993 rules)
- ✓ **Correct**: Vit D, Ca, Fe, K only (2016 rules)

**Mistake 4**: Wrong typography
- ❌ Calories same size as other nutrients
- ✓ **Correct**: Calories 16pt bold (larger than 8pt nutrients)

**Mistake 5**: Incorrect rounding
- ❌ Showing "0%" for low values
- ✓ **Correct**: Show "<1%" if rounds to 0%

### Regulatory Requirements Checklist

Before printing labels, verify:

**Product Information**:
- [ ] Product name is accurate
- [ ] Net weight/volume declared
- [ ] Ingredient list complete (separate requirement)
- [ ] Allergens identified

**Nutrition Facts Panel**:
- [ ] All required nutrients present
- [ ] Serving size appropriate for product category
- [ ] Serving size within RACC tolerance (±20%)
- [ ] % DV calculated correctly
- [ ] Typography meets FDA specifications
- [ ] Footnote text verbatim from FDA rules

**Data Accuracy**:
- [ ] Lab test results on file (if claiming "lab tested")
- [ ] CoA from suppliers (for ingredient claims)
- [ ] Calculations documented (if BOM-derived)
- [ ] Audit trail preserved (who, when, source)

**Label Design** (outside MonoPilot):
- [ ] Nutrition Facts panel visible on package
- [ ] Minimum font size: 6pt for small packages, 8pt for standard
- [ ] Contrasting background (black on white preferred)
- [ ] Not obscured by folds, seams, or graphics

### Record Keeping (FDA CFR 101.9)

FDA requires you to **retain records** proving label accuracy:

**Required Records**:
1. Laboratory test results (3+ samples)
2. USDA/FDA database printouts (with dates)
3. Supplier CoAs (Certificates of Analysis)
4. Calculation worksheets (if BOM-derived)
5. Recipes/formulations (with versions)

**Retention Period**: **2 years minimum** (FDA may request during inspection)

**MonoPilot Automatically Provides**:
- ✓ Audit trail (who overrode, when, source)
- ✓ BOM version used for calculation
- ✓ Calculation breakdown (ingredient contributions)
- ✓ Historical changes log
- ✓ Export to PDF for archives

**Best Practice**:
1. Export calculation report as PDF after each change
2. Store in document management system
3. Link to lab reports / CoA files
4. Include in product technical file

---

## 7. Troubleshooting

### Issue 1: "Missing Nutrition Data" Error

**Symptom**: Cannot calculate nutrition, error lists missing ingredients.

**Cause**: One or more BOM ingredients don't have nutrition data.

**Solution**:

**Option A**: Add ingredient nutrition data
1. Go to **Technical > Ingredients > [Ingredient Name]**
2. Click **Nutrition** tab
3. Enter values (per 100g/100ml) from:
   - Supplier CoA
   - USDA FoodData Central (https://fdc.nal.usda.gov/)
   - Lab test
4. Set Source and Confidence Level
5. Save
6. Return to product and recalculate

**Option B**: Partial calculation
1. If missing ingredient is <5% of total weight
2. Click **Calculate Anyway** checkbox
3. System excludes missing ingredient
4. Label shows warning: "Partial calculation used"
5. **Not recommended for final labels**

**Option C**: Manual override
1. Use lab test results for final product
2. Skip BOM calculation entirely
3. See [Section 2: Manual Override](#2-manual-override-workflow)

---

### Issue 2: % DV Doesn't Match My Calculation

**Symptom**: You calculated 11% but label shows 10% (or vice versa).

**Cause**: Rounding differences or using old (1993) Daily Values.

**Check**:
1. Verify you're using **FDA 2016 Daily Values** (see table in Section 5)
2. Round to nearest whole number: 10.4% → 10%, 10.5% → 11%
3. Ensure calculation is per serving, not per 100g

**Example**:
```
Your bread: 245mg sodium per 50g serving
DV for sodium: 2,300mg (2016 value, NOT 2,400mg old value)

Calculation: (245 / 2,300) × 100 = 10.65%
Rounded: 11% ✓

If you used old DV: (245 / 2,400) × 100 = 10.21% → 10% ❌
```

---

### Issue 3: RACC Validation Warning

**Symptom**: "Serving size differs from FDA RACC by 35%"

**Cause**: Your serving size is more than 20% different from FDA reference.

**Solution**:

**Check RACC category**:
1. Click **Look up FDA RACC**
2. Ensure you selected correct category
   - Example: "Cookies" (30g) vs "Brownies" (40g) vs "Granola Bars" (40g)

**Adjust serving size**:
1. If variance is 20-50%, consider changing serving size to match RACC
2. Example: Your cookies are 50g each, RACC is 30g
   - Option A: State serving as "1 cookie (50g)" with footnote
   - Option B: Break into smaller cookies (30g each)

**Consult regulations**:
1. Some products allow dual servings
2. Example: Ice cream shows "2/3 cup (100g)" AND "1 cup (150g)"
3. See FDA CFR 101.9(b)(5) for details

---

### Issue 4: Label Export PDF is Blank

**Symptom**: Downloaded PDF file is blank or shows errors.

**Cause**: Browser PDF rendering issue or missing data.

**Solution**:

**Step 1**: Verify data is complete
- Ensure serving size is set
- Ensure at least energy, protein, fat, carbs are present

**Step 2**: Try SVG export instead
1. Click **Export as SVG**
2. Open SVG in browser to verify
3. Use browser "Print to PDF" feature

**Step 3**: Clear browser cache
1. Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac)
2. Clear cached images and files
3. Retry export

**Step 4**: Try different browser
- Chrome (recommended)
- Firefox
- Edge

---

### Issue 5: Allergen List Not Showing

**Symptom**: Added allergens but they don't appear on label.

**Cause**: Allergens must be explicitly added to product record.

**Solution**:
1. Go to **Technical > Products > [Product Name]**
2. Click **Allergens** tab (separate from Nutrition Facts)
3. Add allergens with relationship:
   - **Contains**: Ingredient contains this allergen
   - **May Contain**: Cross-contamination risk
4. Save
5. Return to Nutrition Facts and regenerate label
6. Allergens now appear at bottom: "Contains: Milk, Wheat."

---

### Issue 6: Yield Adjustment Not Working

**Symptom**: Expected yield adjustment not reflected in per-100g values.

**Cause**: Actual yield not entered or miscalculated.

**Solution**:

**Verify yield data**:
1. Expected output: From BOM settings (e.g., 500g)
2. Actual output: Enter from production record (e.g., 475g)
3. Yield factor: System calculates (500/475 = 1.053)

**Check calculation**:
```
Before yield adjustment:
Total protein (batch) = 50g
Per 100g = (50g / 500g) × 100 = 10g

After yield adjustment (actual 475g):
Adjusted total = 50g × 1.053 = 52.65g
Per 100g = (52.65g / 475g) × 100 = 11.08g ✓ Higher concentration
```

**Common mistake**: Entering actual yield as percentage instead of weight
- ❌ Wrong: Enter "95%" (percentage yield)
- ✓ Correct: Enter "475" grams (actual output weight)

---

## Appendix A: Quick Reference

### Calculation Workflow Cheat Sheet

```
1. Ensure BOM is complete
   └─> All ingredients have nutrition data

2. Navigate to Product > Nutrition Facts

3. Click "Calculate from BOM"
   ├─> Review ingredient contributions
   ├─> Enter actual yield if different from expected
   └─> Save

4. Calculate serving size
   ├─> Look up FDA RACC
   ├─> Use weight/piece/volume calculator
   └─> Validate against RACC (±20%)

5. Generate label
   ├─> Add allergens if applicable
   ├─> Preview FDA 2016 label
   └─> Export as PDF/SVG

6. Archive records
   ├─> Export calculation report
   ├─> Attach lab reports / CoAs
   └─> Store for 2+ years (FDA requirement)
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Calculate from BOM | `Ctrl+K` |
| Manual Override | `Ctrl+M` |
| Generate Label | `Ctrl+L` |
| Export PDF | `Ctrl+P` |
| Save | `Ctrl+S` |

### Common UOM Conversions

| From | To | Factor |
|------|-----|--------|
| 1 lb | g | × 453.592 |
| 1 oz | g | × 28.3495 |
| 1 cup (240ml) | g | × 240 (water) |
| 1 tbsp (15ml) | g | × 15 (water) |
| 1 kg | g | × 1000 |

### FDA Resources

- **FDA Nutrition Labeling Guide**: https://www.fda.gov/food/nutrition-facts-label
- **RACC Reference Table**: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?fr=101.12
- **Daily Values (2016)**: https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels
- **USDA FoodData Central**: https://fdc.nal.usda.gov/

---

**Document Version**: 1.0
**Story**: 02.13 - Nutrition Calculation
**Last Updated**: 2025-12-29
**Contact**: For technical issues, see [Technical Support]
