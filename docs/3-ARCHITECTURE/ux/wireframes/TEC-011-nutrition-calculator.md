# TEC-011: Nutrition Calculator

**Module**: Technical
**Feature**: Nutrition Calculation Engine (FR-2.80 to FR-2.84)
**Type**: Modal Dialog / Tool
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Calculation Mode)

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Calculator: Whole Wheat Bread                  [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product: Whole Wheat Bread (PROD-157)                          │
│  BOM: v3 - Active (2025-01-01 to present)                       │
│  Batch Size: 500 kg → 1000 loaves (500g each)                   │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  INGREDIENT NUTRITION BREAKDOWN                                  │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Ingredient             Qty    Energy  Protein  Fat   Carbs │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Wheat Flour         300 kg   1020kc  36.0g   3.6g   204g  │ │
│  │ (PROD-001)           60%       68%     72%    40%    68%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Water               120 L      0kc    0.0g   0.0g     0g   │ │
│  │ (PROD-078)           24%        0%      0%     0%     0%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Whole Wheat Flour    50 kg    175kc   7.0g   1.0g    35g   │ │
│  │ (PROD-002)           10%       12%     14%    11%    12%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Yeast                10 kg     96kc   4.8g   0.5g    10g   │ │
│  │ (PROD-089)            2%        6%     10%     6%     3%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Salt                  8 kg      0kc   0.0g   0.0g     0g   │ │
│  │ (PROD-145)          1.6%        0%      0%     0%     0%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Sunflower Oil         6 kg    540kc   0.0g  60.0g     0g   │ │
│  │ (PROD-045)          1.2%       36%      0%    60%     0%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Honey                 4 kg    128kc   0.1g   0.0g    34g   │ │
│  │ (PROD-112)          0.8%        9%      1%     0%    11%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Walnut Pieces         2 kg    131kc   3.0g  13.0g     3g   │ │
│  │ (PROD-089)          0.4%        9%      6%    14%     1%   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ TOTAL (Input)       500 kg   2090kc  50.9g  78.1g   286g   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  YIELD ADJUSTMENT                                                │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  Yield Settings                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Expected Output:  500 kg (100% yield)                      │ │
│  │ Actual Output:    475 kg (95% yield) [Edit]                │ │
│  │                                                            │ │
│  │ Loss Factors:                                              │ │
│  │ • Moisture evaporation during baking: ~20 kg (4%)          │ │
│  │ • Trim/waste: ~5 kg (1%)                                   │ │
│  │                                                            │ │
│  │ Nutrient Concentration Factor: 1.053× (due to water loss)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  FINAL NUTRITION (Per 100g Finished Product)                     │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Energy:        440 kcal  (1841 kJ)                         │ │
│  │ Protein:       10.7 g    (21% of energy)                   │ │
│  │ Fat:           16.4 g    (33% of energy)                   │ │
│  │   Saturated:    2.1 g    (13% of fat)                      │ │
│  │   Trans:        0.0 g                                      │ │
│  │ Carbohydrate:  60.2 g    (55% of energy)                   │ │
│  │   Fiber:        5.2 g    (9% of carbs)                     │ │
│  │   Sugar:        8.9 g    (15% of carbs)                    │ │
│  │   Added Sugar:  2.1 g    (from honey)                      │ │
│  │ Sodium:        456 mg                                      │ │
│  │ Salt:          1.14 g    (19% DV)                          │ │
│  │                                                            │ │
│  │ Vitamins & Minerals:                                       │ │
│  │ • Iron:        2.4 mg    (13% DV)                          │ │
│  │ • Calcium:     45 mg     (3% DV)                           │ │
│  │ • Potassium:   180 mg    (4% DV)                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Recalculate] [Adjust Yield] [View Detailed Report] [Export]  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]       [Save to Product] [Generate Label] [Compare BOM] │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (Comparison Mode)

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Calculator: Compare BOM Versions               [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product: Whole Wheat Bread (PROD-157)                          │
│                                                                  │
│  Compare: [BOM v2 ▼] vs [BOM v3 (current) ▼]                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Nutrient          BOM v2        BOM v3       Δ Change      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Energy (kcal)      465          440         -25  (-5.4%) ↓ │ │
│  │ Protein (g)        10.2         10.7        +0.5 (+4.9%) ↑ │ │
│  │ Fat (g)            18.1         16.4        -1.7 (-9.4%) ↓ │ │
│  │ Carbs (g)          62.3         60.2        -2.1 (-3.4%) ↓ │ │
│  │ Fiber (g)           4.8          5.2        +0.4 (+8.3%) ↑ │ │
│  │ Sugar (g)          10.2          8.9        -1.3 (-13%) ↓  │ │
│  │ Sodium (mg)        512          456         -56  (-11%) ↓  │ │
│  │ Salt (g)           1.28         1.14       -0.14 (-11%) ↓  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Key Changes in BOM v3:                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ Reduced sunflower oil: 8 kg → 6 kg (-25%)                │ │
│  │ ✓ Reduced salt: 10 kg → 8 kg (-20%)                        │ │
│  │ ✓ Added whole wheat flour: 0 kg → 50 kg                    │ │
│  │ ✓ Reduced regular flour: 350 kg → 300 kg (-14%)            │ │
│  │                                                            │ │
│  │ Impact Summary:                                            │ │
│  │ • Lower fat content (healthier profile) ✓                  │ │
│  │ • Lower sodium (meets WHO guidelines) ✓                    │ │
│  │ • Higher fiber (whole wheat addition) ✓                    │ │
│  │ • Lower calories (weight management) ✓                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [View Ingredient Changes] [Export Comparison] [Clone to v4]    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]                                 [Apply BOM v3]          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Calculator: Whole Wheat Bread                  [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      [Spinner Animation]                         │
│                                                                  │
│              Calculating nutrition from BOM v3...                │
│                                                                  │
│  Progress:                                                       │
│  ✓ Loaded BOM items (8 ingredients)                             │
│  ✓ Retrieved nutrition data for all ingredients                 │
│  ⏳ Calculating weighted nutrient totals...                      │
│  ⏳ Applying yield adjustment factor...                          │
│  ⏳ Computing per-serving values...                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Calculator: Whole Wheat Bread                  [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠ Nutrition Calculation Failed                                 │
│                                                                  │
│  Missing nutrition data for ingredients:                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Ingredient                 Qty    Status        Action      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Wheat Flour (PROD-001)  300 kg   ❌ No data  [Add Data]    │ │
│  │ Sunflower Oil (PROD-045)  6 kg   ❌ No data  [Add Data]    │ │
│  │ Yeast (PROD-089)         10 kg   ❌ No data  [Add Data]    │ │
│  │ Water (PROD-078)        120 L    ✓ OK         -            │ │
│  │ Salt (PROD-145)           8 kg   ✓ OK         -            │ │
│  │ Other ingredients (3)      -     ✓ OK         -            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  To complete calculation, add nutrition data for all ingredients.│
│                                                                  │
│  [Add All Missing Data] [Skip and Use Partial Data] [Cancel]    │
│                                                                  │
│  ℹ Partial calculation will estimate missing values as zero.    │
│    This is not recommended for label generation.                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Calculator                                     [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          [🧮 Icon]                               │
│                                                                  │
│                 No Product or BOM Selected                       │
│                                                                  │
│  Select a product with an active BOM to calculate nutrition.     │
│                                                                  │
│  The nutrition calculator:                                       │
│  • Analyzes ingredient nutrition data from BOM                  │
│  • Calculates weighted nutrient totals per batch                │
│  • Adjusts for yield loss during production                     │
│  • Generates per-serving nutrition facts                        │
│  • Compares BOM versions for formulation changes                │
│                                                                  │
│                      [Select Product]                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Product & BOM Header
- **Product Info**: Name, code, product type
- **BOM Info**: Version, effective dates, status (active/inactive)
- **Batch Info**: Total batch size, output quantity, unit yield
- **Quick Links**: [View BOM] [Edit BOM] [Change BOM Version]

### 2. Ingredient Nutrition Breakdown Table
- **Columns**: Ingredient name/code, Quantity, Energy, Protein, Fat, Carbs
- **Percentage Row**: Shows each ingredient's contribution to total (e.g., 68% of energy)
- **Sortable**: Click column headers to sort by contribution
- **Color-coded**: Green (>20% contributor), Yellow (10-20%), Gray (<10%)
- **Expandable Rows**: Click to show full nutrient profile (fiber, sodium, vitamins, etc.)

### 3. Yield Adjustment Panel
- **Expected Output**: BOM-defined output quantity
- **Actual Output**: Editable (default = expected, adjusted for real yield)
- **Yield %**: Auto-calculated (actual / expected × 100)
- **Loss Factors**: Text descriptions of why yield differs (e.g., evaporation, trim)
- **Concentration Factor**: Multiplier applied to nutrients due to moisture loss
- **Example**: 500 kg input → 475 kg output = 95% yield → 1.053× concentration

### 4. Final Nutrition Display
- **Per 100g**: Standard display format (EU regulation)
- **Per Serving**: Also shown if serving size defined (see TEC-009)
- **Macros**: Energy (kcal/kJ), Protein, Fat (saturated/trans), Carbs (fiber/sugar/added sugar), Sodium, Salt
- **Micros**: Vitamins (A, C, D) and Minerals (Iron, Calcium, Potassium) if available
- **% Daily Value**: Calculated for FDA labels (based on 2,000 kcal diet)
- **% of Energy**: Shows macronutrient energy distribution

### 5. Comparison Mode
- **Side-by-side**: Two BOM versions in columns
- **Delta Column**: Absolute change + percentage change + arrow (↑/↓)
- **Color-coded Changes**: Green (improvement), Red (worse), Gray (neutral)
- **Change Summary**: Bullet points explaining key ingredient swaps
- **Impact Summary**: Health/nutritional implications of changes

### 6. Actions Toolbar
- **[Recalculate]**: Re-runs calculation (e.g., after yield adjustment)
- **[Adjust Yield]**: Opens yield editor (actual output, loss factors)
- **[View Detailed Report]**: Full PDF report with all nutrients, sources, calculations
- **[Export]**: CSV/Excel with ingredient breakdown and final nutrition
- **[Save to Product]**: Saves calculated nutrition to product nutrition table
- **[Generate Label]**: Opens nutrition label generator (TEC-009)
- **[Compare BOM]**: Switches to comparison mode

---

## Main Actions

### Primary Actions
- **[Recalculate]**: Triggers nutrition calculation
  - Validates BOM exists and is active
  - Checks all ingredients have nutrition data
  - Fetches ingredient nutrition from `ingredient_nutrition` table
  - Multiplies each nutrient by ingredient quantity
  - Sums weighted nutrients across all ingredients
  - Applies yield adjustment factor
  - Divides by batch output to get per 100g values
  - Updates display with results
  - Shows toast: "Nutrition calculated for batch of {qty} {unit}"

- **[Save to Product]**: Saves calculated nutrition to product
  - Validates calculation complete
  - Prompts: "Save nutrition data to product? This will update existing data."
  - Inserts/updates `product_nutrition` table
  - Sets `is_manual_override = false`, `calculated_at = now()`
  - Links to BOM version used for calculation
  - Closes calculator, refreshes product nutrition panel
  - Shows toast: "Nutrition saved to product {name}"

- **[Generate Label]**: Opens label generator
  - Validates nutrition data complete
  - Pre-fills label generator with calculated values
  - Opens TEC-009 modal with "calculated" mode
  - User can adjust serving size, format, export PDF/print

### Secondary Actions
- **[Adjust Yield]**: Opens yield adjustment dialog
  - Shows expected output (from BOM)
  - Input: Actual output quantity (editable)
  - Input: Loss factors (text descriptions)
  - Calculates yield % and concentration factor
  - Updates calculation with new yield
  - Shows toast: "Yield adjusted to {yield}%"

- **[View Detailed Report]**: Generates full report
  - PDF with:
    - Product and BOM details
    - Ingredient breakdown table (all nutrients)
    - Calculation methodology
    - Yield adjustments
    - Final nutrition (per 100g and per serving)
    - Data sources and timestamps
  - Downloads as `{product_code}_nutrition_report_{date}.pdf`

- **[Export]**: Exports data
  - Formats: CSV, Excel, JSON
  - Includes:
    - Ingredient list with nutrition per ingredient
    - Total batch nutrition
    - Per 100g final nutrition
    - Yield adjustments
    - Metadata (BOM version, calculation date)

- **[Compare BOM]**: Switches to comparison mode
  - Prompts: Select BOM versions to compare (dropdown × 2)
  - Calculates nutrition for both versions
  - Shows side-by-side comparison table
  - Highlights differences (green/red/gray)
  - Lists ingredient changes causing differences
  - Provides impact summary (health implications)

- **[Add Data]** (from error state): Opens ingredient nutrition entry
  - Pre-selects ingredient from error list
  - Opens ingredient nutrition modal
  - After save, returns to calculator and retries calculation

- **[Skip and Use Partial Data]**: Calculates with missing data
  - Shows warning: "Missing ingredients will be treated as zero nutrition"
  - Not recommended for label generation
  - Useful for rough estimates during formulation
  - Marks result as "partial" (cannot save to product)

---

## 4 States (One-Line)

- **Loading**: Spinner + progress steps ("Loaded BOM items", "Calculating totals", "Applying yield") while POST /api/technical/nutrition/calculate runs
- **Empty**: "No Product or BOM Selected" with explanation of calculator features + [Select Product] CTA
- **Error**: Red banner + table of ingredients missing nutrition data + [Add Data] links per ingredient + option to skip with partial data
- **Success**: Ingredient breakdown table + yield adjustment panel + final nutrition display (per 100g) + actions to save/export/generate label/compare

---

## Calculation Methodology

### Step-by-Step Process

1. **Load BOM Data**
   ```
   - Fetch active BOM for product
   - Retrieve all BOM items (ingredients + quantities)
   - Validate BOM has at least 1 item
   ```

2. **Fetch Ingredient Nutrition**
   ```
   - For each BOM item:
     - Lookup ingredient in ingredient_nutrition table
     - If missing: add to error list
   - If errors: stop and show error state
   ```

3. **Calculate Weighted Totals**
   ```
   For each nutrient (energy, protein, fat, carbs, etc.):
     total_nutrient = 0
     For each ingredient:
       ingredient_nutrient_per_100g = lookup from table
       ingredient_qty_kg = BOM item quantity
       weighted_nutrient = (ingredient_nutrient_per_100g / 100) × ingredient_qty_kg × 1000
       total_nutrient += weighted_nutrient
   ```

4. **Apply Yield Adjustment**
   ```
   yield_factor = expected_output_kg / actual_output_kg

   For each nutrient:
     adjusted_nutrient = total_nutrient × yield_factor
   ```

5. **Convert to Per 100g**
   ```
   actual_output_g = actual_output_kg × 1000

   For each nutrient:
     nutrient_per_100g = (adjusted_nutrient / actual_output_g) × 100
   ```

6. **Calculate Derived Values**
   ```
   - Energy from macros: (protein_g × 4) + (carbs_g × 4) + (fat_g × 9)
   - % Daily Value: (nutrient / DV) × 100 (FDA reference values)
   - % of Energy: (macro_kcal / total_kcal) × 100
   - Salt from Sodium: sodium_mg / 400 (conversion factor)
   ```

### Example Calculation

**Input**: 500 kg batch, 8 ingredients
```
Wheat Flour (300 kg):
  - Energy: 340 kcal/100g → 340 × 3000 = 1,020,000 kcal
  - Protein: 12 g/100g → 12 × 3000 = 36,000 g

Total Energy (all ingredients): 2,090,000 kcal
Total Protein: 50,900 g

Yield Adjustment: 475 kg output (95% yield)
  - Yield factor: 500 / 475 = 1.053

Adjusted Energy: 2,090,000 × 1.053 = 2,200,770 kcal
Adjusted Protein: 50,900 × 1.053 = 53,597 g

Per 100g:
  - Energy: (2,200,770 / 475,000) × 100 = 463 kcal/100g
  - Protein: (53,597 / 475,000) × 100 = 11.3 g/100g
```

---

## Validation Rules

### Prerequisites
- Product must exist
- Product must have active BOM
- BOM must have at least 1 item
- All BOM ingredients must have nutrition data in `ingredient_nutrition` table

### Yield Adjustment
- Expected output > 0 kg (from BOM)
- Actual output: 0.1 to 10,000 kg (realistic range)
- Yield %: 50% to 150% (outside this = warning)
- Concentration factor: 0.5× to 2× (calculated, not input)

### Data Quality
- Nutrient values: 0 to 999.9 g/100g (realistic range)
- Energy: 0 to 9,999 kcal/100g
- Total weight of nutrients ≤ 100g (sum of protein + fat + carbs + fiber + ash + moisture)
- Warning if sum > 100g (data quality issue)

---

## Accessibility

- **Touch Targets**: All buttons, table rows >= 48x48dp
- **Contrast**: All text passes WCAG AA (4.5:1 on white background)
- **Screen Reader**: Announces "Nutrition Calculator for {product}", table headers, nutrient values with units
- **Keyboard**: Tab navigation, Arrow keys for table navigation, Enter to expand rows
- **Focus**: Product selector auto-focused on open
- **Tables**: Proper `<th>` headers, `<caption>`, sortable columns announced

---

## Technical Notes

### API Endpoints
- **Calculate**: `POST /api/technical/nutrition/calculate`
  ```typescript
  Request: {
    product_id: string;
    bom_id?: string; // optional, defaults to active BOM
    actual_yield_kg?: number; // optional, defaults to expected
  }
  Response: {
    ingredients: { id, name, qty, nutrients }[];
    total_nutrients: { energy, protein, fat, ... };
    yield: { expected, actual, factor };
    final_per_100g: { energy, protein, fat, ... };
    metadata: { bom_version, calculated_at };
  }
  ```

- **Compare**: `POST /api/technical/nutrition/compare`
  ```typescript
  Request: {
    product_id: string;
    bom_id_1: string;
    bom_id_2: string;
  }
  Response: {
    bom_1: { version, nutrients };
    bom_2: { version, nutrients };
    differences: { nutrient, value_1, value_2, delta, percent };
    ingredient_changes: { added, removed, modified };
  }
  ```

### Caching Strategy
```typescript
// Cache calculation results (invalidate on BOM change)
'org:{orgId}:nutrition:calc:{productId}:{bomId}:{yieldKg}' // 5 min TTL

// Cache ingredient nutrition data
'org:{orgId}:ingredient:nutrition:{ingredientId}' // 10 min TTL
```

### Performance
- Calculation runs server-side (Edge Function)
- Batch ingredient nutrition lookups (single query)
- For large BOMs (>50 ingredients), show progress indicator
- Comparison mode: parallel calculation of both BOMs
- Expected response time: <2 seconds for typical BOM (10-20 ingredients)

---

## Related Screens

- **TEC-009-nutrition-panel**: Nutrition facts panel (uses calculated data)
- **Product Detail**: Opens calculator from [Calculate Nutrition] button
- **BOM Detail**: Opens calculator from [Preview Nutrition] link
- **Ingredient Nutrition Entry**: Opens from error state to add missing data
- **Nutrition Report**: PDF report generated from detailed report action

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use ShadCN Dialog (xl size: 900px) for calculator modal
2. Table component: ShadCN Table with sortable columns
3. Charts: Use Recharts for nutrient contribution pie chart (optional)
4. Number formatting: 1 decimal for macros, 0 decimals for calories
5. Unit display: Always show units (g, mg, kcal, kJ)
6. Expandable rows: Click to show full nutrient profile
7. Loading: Multi-step progress indicator (not just spinner)
8. Comparison: Side-by-side table with delta highlighting

### For BACKEND-DEV:
1. Implement calculation algorithm (weighted sum → yield adjustment → per 100g)
2. Validate all ingredients have nutrition data before calculation
3. Support yield adjustment in calculation
4. BOM comparison: diff algorithm for ingredient changes
5. PDF report generation with all data
6. CSV/Excel export with proper formatting
7. Cache calculation results (invalidate on BOM/ingredient changes)
8. Audit trail: log all calculations (who, when, which BOM version)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [TEC-011-nutrition-calculator]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV/BACKEND-DEV handoff
