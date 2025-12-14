# TEC-009: Nutrition Facts Panel

**Module**: Technical
**Feature**: Nutrition Management (FR-2.80 to FR-2.84)
**Type**: Modal Dialog (Product Detail View)
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Calculated)

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Facts: Whole Wheat Bread                      [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Calculation Status: ✓ Auto-Calculated from BOM             │ │
│  │ Last Updated: 2025-12-10 14:32 by System                   │ │
│  │ BOM Version: v3 (Active)           [Recalculate] [Override] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Serving Information                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Serving Size *         Servings Per Container *           │   │
│  │ [50___] [g ▼]          [10____]                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    NUTRITION FACTS                         │ │
│  │                                                            │ │
│  │  Serving Size: 50g (2 slices)                             │ │
│  │  Servings Per Container: 10                               │ │
│  │  ═══════════════════════════════════════════════════       │ │
│  │  Amount Per Serving                                        │ │
│  │  ───────────────────────────────────────────────────       │ │
│  │  Calories                              130                 │ │
│  │                                                            │ │
│  │                               % Daily Value*               │ │
│  │  ───────────────────────────────────────────────────       │ │
│  │  Total Fat 2g                                  3%          │ │
│  │    Saturated Fat 0.5g                          3%          │ │
│  │    Trans Fat 0g                                            │ │
│  │  Cholesterol 0mg                               0%          │ │
│  │  Sodium 240mg                                 10%          │ │
│  │  Total Carbohydrate 24g                        8%          │ │
│  │    Dietary Fiber 3g                           11%          │ │
│  │    Total Sugars 2g                                         │ │
│  │      Includes 0g Added Sugars                  0%          │ │
│  │  Protein 5g                                               │ │
│  │  ───────────────────────────────────────────────────       │ │
│  │  Vitamin D 0mcg                                0%          │ │
│  │  Calcium 40mg                                  3%          │ │
│  │  Iron 1.2mg                                    7%          │ │
│  │  Potassium 120mg                               3%          │ │
│  │  ═══════════════════════════════════════════════════       │ │
│  │  *The % Daily Value tells you how much a nutrient in       │ │
│  │   a serving contributes to a daily diet. 2,000 calories    │ │
│  │   a day is used for general nutrition advice.              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Label Format: [FDA 2016 ▼]  [EU Format] [Preview Label]        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]          [Export PDF]  [Print Label]  [Save Override]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (Manual Override)

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Facts: Organic Honey (Manual Override)        [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠ Manual Override Active                                   │ │
│  │ Last Updated: 2025-12-08 10:15 by Jane Smith              │ │
│  │ Reason: Lab-tested values from supplier CoA                │ │
│  │                        [Recalculate from BOM] [Edit Values] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Serving Information                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Serving Size *         Servings Per Container *           │   │
│  │ [21___] [g ▼]          [24____]                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Basic Nutrients (per 100g)                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Energy *          Protein *         Fat *                 │   │
│  │ [304__] [kcal ▼]  [0.3____] [g ▼]  [0.0____] [g ▼]       │   │
│  │                                                            │   │
│  │ Carbohydrates *   Sugar *           Fiber *               │   │
│  │ [82.4__] [g ▼]    [82.1__] [g ▼]   [0.2____] [g ▼]       │   │
│  │                                                            │   │
│  │ Sodium *          Salt              Saturated Fat         │   │
│  │ [4_____] [mg ▼]   [0.01__] [g ▼]   [0.0____] [g ▼]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Vitamins & Minerals (Optional)                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Vitamin D         Calcium           Iron                  │   │
│  │ [______] [mcg ▼]  [______] [mg ▼]   [______] [mg ▼]      │   │
│  │                                                            │   │
│  │ Potassium         Vitamin C         Vitamin A             │   │
│  │ [______] [mg ▼]   [______] [mg ▼]   [______] [mcg ▼]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Override Metadata                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Source: [Lab Test (CoA) ▼]                                │   │
│  │ Reference: [CoA-2024-HNY-001___________________]           │   │
│  │ Notes: [Supplier-provided values from certified lab____]  │   │
│  │        [_____________________________________________]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Cancel]                              [Save Manual Override]   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Facts: Whole Wheat Bread                      [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      [Spinner Animation]                         │
│                                                                  │
│              Calculating nutrition from BOM ingredients...       │
│                                                                  │
│                    Analyzing 8 ingredients                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Facts: Whole Wheat Bread                      [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠ Unable to Calculate Nutrition                                │
│                                                                  │
│  Missing nutrition data for the following ingredients:           │
│  • Wheat Flour (PROD-001) - No nutrition data entered           │
│  • Sunflower Oil (PROD-045) - No nutrition data entered         │
│  • Yeast (PROD-089) - No nutrition data entered                 │
│                                                                  │
│  To auto-calculate nutrition, you must first add ingredient      │
│  nutrition data for all BOM components.                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Quick Actions:                                             │ │
│  │ [Add Missing Ingredient Data] [Use Manual Override Instead]│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]                                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────┐
│  Nutrition Facts: Raw Sugar (No BOM)                     [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          [📊 Icon]                               │
│                                                                  │
│                   No Nutrition Data Available                    │
│                                                                  │
│  This product is a raw material with no BOM. Auto-calculation    │
│  requires a Bill of Materials with ingredient nutrition data.    │
│                                                                  │
│  You can manually enter nutrition values from:                   │
│  • Supplier Certificate of Analysis (CoA)                       │
│  • Lab test results                                             │
│  • Product specification sheet                                  │
│                                                                  │
│                    [Enter Nutrition Data Manually]              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]                                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Calculation Status Banner
- **Auto-Calculated**: Green banner, checkmark icon, shows BOM version, last update timestamp
- **Manual Override**: Yellow warning banner, shows override reason, who/when, reference document
- **Actions**: [Recalculate] (from BOM), [Override] (manual entry), [Edit Values]

### 2. Serving Information
- **Serving Size**: Numeric input + unit dropdown (g, ml, oz, cup, tbsp, piece)
- **Servings Per Container**: Numeric input
- **Required**: Both fields mandatory for label generation

### 3. FDA Nutrition Label Preview
- **Format**: FDA 2016 standard vertical format
- **Macronutrients**: Calories, Total Fat, Saturated Fat, Trans Fat, Cholesterol, Sodium, Total Carb, Fiber, Sugars, Added Sugars, Protein
- **Micronutrients**: Vitamin D, Calcium, Iron, Potassium (FDA 2016 required)
- **% Daily Value**: Auto-calculated based on 2,000 calorie diet
- **Live Preview**: Updates as serving size changes

### 4. EU Nutrition Format (Alternative)
- **Format**: Per 100g/100ml table
- **Required**: Energy (kJ/kcal), Fat, Saturates, Carbohydrate, Sugars, Protein, Salt
- **Optional**: Fiber, additional vitamins/minerals
- **Switch**: Toggle between FDA/EU formats

### 5. Manual Override Form
- **Basic Nutrients**: Energy, Protein, Fat, Carbs, Sugar, Fiber, Sodium, Salt, Saturated Fat
- **Vitamins & Minerals**: Optional fields for micronutrients
- **Units**: Dropdown for each field (g, mg, mcg, kcal, kJ)
- **Per 100g/100ml**: All values entered per 100 units, converted to serving size
- **Metadata**: Source dropdown (Lab Test, Supplier CoA, Database, Calculated), Reference field, Notes

### 6. Label Actions
- **Preview Label**: Opens full-size label preview (print-ready)
- **Export PDF**: Downloads nutrition label as PDF
- **Print Label**: Direct print to label printer
- **Label Format Dropdown**: FDA 2016, FDA 2020, EU FIC, Canada, Australia/NZ

---

## Main Actions

### Primary Actions
- **[Recalculate]**: Re-runs nutrition calculation from current active BOM ingredients
  - Validates all ingredients have nutrition data
  - Sums nutrients weighted by quantity
  - Adjusts for yield loss/processing
  - Updates calculation timestamp
  - Shows success toast: "Nutrition recalculated from BOM v{version}"

- **[Override]**: Switches to manual entry mode
  - Shows confirmation: "Auto-calculation will be disabled. Continue?"
  - Opens manual override form
  - Requires reason/source/reference
  - Saves with audit trail (who, when, why)

- **[Save Manual Override]**: Saves manually entered nutrition values
  - Validates required fields (energy, protein, fat, carbs, salt)
  - Sets `is_manual_override = true`
  - Stores override metadata (source, reference, notes)
  - Closes modal, shows toast: "Manual nutrition data saved"

- **[Recalculate from BOM]**: (From override mode) Returns to auto-calculation
  - Shows confirmation: "Manual values will be overwritten. Continue?"
  - Clears override flag
  - Re-runs calculation
  - Shows toast: "Switched to auto-calculation from BOM"

### Secondary Actions
- **[Export PDF]**: Generates compliant nutrition label PDF
  - Validates serving size entered
  - Renders label in selected format (FDA/EU/etc.)
  - Downloads as `{product_code}_nutrition_label.pdf`

- **[Print Label]**: Sends to label printer
  - Opens print dialog with label size options
  - 4x6", 2x3", A4, custom sizes

- **[Preview Label]**: Opens full-screen label preview modal
  - Shows print-ready label layout
  - Zoom controls, format selector

- **[Add Missing Ingredient Data]**: (From error state)
  - Opens ingredient nutrition entry workflow
  - Lists missing ingredients
  - Quick-add nutrition data for each

- **[Use Manual Override Instead]**: (From error state)
  - Skips auto-calculation
  - Opens manual override form directly

---

## 4 States (One-Line)

- **Loading**: Spinner + "Calculating nutrition from BOM ingredients..." while POST /api/technical/nutrition/products/:id/calculate runs
- **Empty**: "No Nutrition Data Available" for raw materials (no BOM) + "Enter Nutrition Data Manually" CTA
- **Error**: Red banner + list of ingredients missing nutrition data + quick actions to add data or use manual override
- **Success**: FDA nutrition label preview (calculated) OR manual override form with all nutrient fields + actions to export/print/recalculate

---

## Validation Rules

### Auto-Calculation Requirements
- Product must have active BOM
- All BOM ingredients must have nutrition data in `ingredient_nutrition` table
- Serving size > 0 and < 10,000g
- Servings per container > 0 and < 1,000

### Manual Override Requirements
| Field | Required | Format |
|-------|----------|--------|
| Energy (kcal) | Yes | 0-9999 kcal |
| Protein | Yes | 0-999.9 g |
| Fat | Yes | 0-999.9 g |
| Carbohydrates | Yes | 0-999.9 g |
| Salt | Yes | 0-99.9 g |
| Fiber | No | 0-999.9 g |
| Sugars | No | 0-999.9 g |
| Saturated Fat | No | 0-999.9 g |
| Sodium | No | 0-9999 mg |
| Vitamins/Minerals | No | 0-9999 (unit varies) |
| Source | Yes | Dropdown selection |
| Reference | Yes if source = Lab Test/CoA | Max 100 chars |
| Notes | No | Max 500 chars |

**Validation Timing**:
- On save: All required fields validated
- Format check: Numeric values, max decimals (1 decimal for most, 0 for calories)
- Range check: Values must be realistic (e.g., protein < total weight)

---

## Accessibility

- **Touch Targets**: All inputs, buttons >= 48x48dp
- **Contrast**: Banner colors pass WCAG AA (green: #059669, yellow: #D97706)
- **Screen Reader**: Announces "Nutrition Facts Panel for {product_name}", field labels, validation errors
- **Keyboard**: Tab navigation, Enter to save, Escape to close
- **Focus**: First input (serving size) auto-focused in override mode
- **Labels**: All form inputs have explicit labels (not placeholder-only)

---

## Technical Notes

### API Endpoints
- **Get**: `GET /api/technical/nutrition/products/:id`
- **Calculate**: `POST /api/technical/nutrition/products/:id/calculate`
- **Override**: `PUT /api/technical/nutrition/products/:id/override`
- **Label**: `GET /api/technical/nutrition/products/:id/label?format={fda|eu|canada}`

### Calculation Algorithm
```typescript
// Per nutrient:
nutrient_per_serving = Σ (ingredient_nutrient × ingredient_qty × yield_factor) / servings_per_batch

// Example for protein:
protein = (flour_protein × flour_kg × 0.95) + (milk_protein × milk_L × 1.0) + ...
protein_per_serving = protein / (output_qty / serving_size)
```

### Data Structure
```typescript
{
  product_id: string;
  serving_size: number;
  serving_unit: 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'piece';
  servings_per_container: number;
  is_manual_override: boolean;
  override_source?: 'lab_test' | 'supplier_coa' | 'database' | 'calculated';
  override_reference?: string;
  override_notes?: string;
  override_by?: string; // user_id
  override_at?: timestamp;
  calculated_at?: timestamp;

  // Macronutrients (per 100g/100ml)
  energy_kcal: number;
  energy_kj?: number;
  protein_g: number;
  fat_g: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  carbohydrate_g: number;
  sugar_g?: number;
  added_sugar_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  salt_g?: number;
  cholesterol_mg?: number;

  // Micronutrients (optional)
  vitamin_d_mcg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
  vitamin_c_mg?: number;
  vitamin_a_mcg?: number;

  // Additional fields (extensible)
  additional_nutrients?: {
    name: string;
    value: number;
    unit: string;
    daily_value_percent?: number;
  }[];
}
```

### Label Format Support
- **FDA 2016**: Vertical format, updated nutrients (Vit D, K instead of A, C)
- **FDA 2020**: Dual column for larger packages
- **EU FIC 1169/2011**: Per 100g table, energy in kJ + kcal
- **Canada**: Similar to FDA, bilingual (English/French)
- **Australia/NZ**: NIP format, per serving + per 100g

### Caching
```typescript
'org:{orgId}:product:{productId}:nutrition' // 10 min TTL, invalidate on BOM change
```

---

## Related Screens

- **Product Detail View**: Parent screen, [Nutrition Facts] button opens this modal
- **Ingredient Nutrition Entry**: `/technical/nutrition/ingredients/:id` (linked from error state)
- **BOM Detail**: Shows which BOM version used for calculation
- **Label Preview Modal**: Full-screen preview of print-ready label
- **TEC-011-nutrition-calculator**: Calculation engine details

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use ShadCN Dialog (xl size: 800px) for modal
2. Zod schema: `lib/validation/nutrition-schema.ts`
3. Service: `lib/services/nutrition-service.ts`
4. Label rendering: Use `@react-pdf/renderer` for PDF generation
5. FDA label component: `components/nutrition/FdaLabel.tsx`
6. EU label component: `components/nutrition/EuLabel.tsx`
7. Calculation runs server-side (Edge Function) to ensure accuracy
8. Cache nutrition data, invalidate on BOM changes
9. Print: Use browser print API with custom CSS for label sizes

### For BACKEND-DEV:
1. Implement calculation algorithm with yield adjustment
2. Validate all BOM ingredients have nutrition data before calculation
3. Store calculation metadata (version, timestamp, ingredients used)
4. Audit trail for manual overrides (who, when, why, source)
5. Label generation API with format parameter
6. Support PDF export with correct label dimensions

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [TEC-009-nutrition-panel]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV/BACKEND-DEV handoff
