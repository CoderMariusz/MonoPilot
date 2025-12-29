# Handoff: Story 02.13 - Nutrition Calculation (RED Phase)

**From**: TEST-WRITER (RED Phase)
**To**: DEV Agent (GREEN Phase)
**Status**: RED PHASE COMPLETE - All tests FAILING (as expected)
**Date**: 2025-12-28
**Model**: Claude Haiku 4.5

---

## Executive Summary

The TEST-WRITER has completed the RED phase of Story 02.13 by writing **310+ comprehensive failing tests** across 7 test files. All tests MUST FAIL at this stage because the implementation code does not yet exist.

This handoff document provides everything the DEV agent needs to begin the GREEN phase (implementation).

---

## Test Files Created (7 files)

### Service Tests (3 files)

1. **nutrition-service.test.ts** - 60+ tests
   - Path: `apps/frontend/lib/services/__tests__/nutrition-service.test.ts`
   - Tests weighted average calculation, yield adjustment, missing ingredient handling, manual overrides, CRUD operations

2. **serving-calculator-service.test.ts** - 35+ tests
   - Path: `apps/frontend/lib/services/__tests__/serving-calculator-service.test.ts`
   - Tests serving size calculations (weight, dimensions, volume), FDA RACC lookup, RACC validation with variance detection

3. **label-export-service.test.ts** - 40+ tests
   - Path: `apps/frontend/lib/services/__tests__/label-export-service.test.ts`
   - Tests FDA 2016 label generation, EU format, PDF/SVG export, allergen label integration, compliance validation

### Validation Tests (2 files)

4. **nutrition-schema.test.ts** - 45+ tests
   - Path: `apps/frontend/lib/validation/__tests__/nutrition-schema.test.ts`
   - Tests nutrition override input validation, serving size, macronutrients, source/reference dependencies, notes field

5. **ingredient-nutrition-schema.test.ts** - 40+ tests
   - Path: `apps/frontend/lib/validation/__tests__/ingredient-nutrition-schema.test.ts`
   - Tests ingredient nutrition input validation, per unit basis, source types, confidence levels, nutrient value ranges

### API Route Tests (2 files)

6. **calculate.test.ts** - 50+ tests
   - Path: `apps/frontend/app/api/technical/nutrition/__tests__/calculate.test.ts`
   - Tests POST /api/technical/nutrition/products/:id/calculate endpoint, BOM calculation, missing ingredients, authentication, RLS isolation

7. **override.test.ts** - 40+ tests
   - Path: `apps/frontend/app/api/technical/nutrition/__tests__/override.test.ts`
   - Tests PUT /api/technical/nutrition/products/:id/override endpoint, manual override with audit trail, validation, RLS isolation

---

## What's Expected (RED Phase)

All tests MUST be failing. This is correct behavior for the RED phase.

```bash
npm test -- --testPathPattern="nutrition|serving|label"
```

Expected output:
```
FAILED  nutrition-service.test.ts ........... 60 tests failed
FAILED  serving-calculator-service.test.ts .. 35 tests failed
FAILED  label-export-service.test.ts ........ 40 tests failed
FAILED  nutrition-schema.test.ts ........... 45 tests failed
FAILED  ingredient-nutrition-schema.test.ts  40 tests failed
FAILED  calculate.test.ts ................... 50 tests failed
FAILED  override.test.ts .................... 40 tests failed

Test Suites: 7 failed, 7 total
Tests:       310 failed, 310 total
```

---

## Acceptance Criteria Coverage

**31 AC's covered by 310+ tests = 100% coverage**

### Critical Calculation Tests
- AC-13.3: Energy calculation formula (340 kcal/100g * 300kg = 1,020,000 kcal)
- AC-13.4: Yield adjustment (500kg input / 475kg output = 1.053 factor)
- AC-13.5: Per-100g macronutrient conversions
- AC-13.20: % DV calculation (240mg Na = 10% DV)

### Serving Calculator Tests
- AC-13.14: Weight division (500g / 10 = 50g per serving)
- AC-13.15: FDA RACC lookup (Bread = 50g)
- AC-13.16-13.17: RACC variance validation (>20% warning)

### Label Generation Tests
- AC-13.19: FDA typography (18pt title, 16pt calories, 8pt nutrients)
- AC-13.21: Required nutrients (Vit D, Ca, Fe, K - not A, C)
- AC-13.22-13.24: PDF/SVG export with validation

### Override & Manual Entry Tests
- AC-13.10-13.11: Manual override with audit trail
- AC-13.25-13.26: Allergen label integration
- AC-13.27-13.28: Ingredient nutrition entry

### Security Tests
- AC-13.31: RLS cross-tenant isolation

---

## Implementation Roadmap

The DEV agent should implement in this order:

### Phase 1: Core Services (Days 1-2)

1. **nutrition-service.ts**
   ```typescript
   // Key methods to implement:
   - getProductNutrition(productId: string): Promise<ProductNutrition | null>
   - calculateFromBOM(productId, bomId?, actualYieldKg?, allowPartial?): Promise<CalculationResult>
   - saveOverride(productId, data): Promise<ProductNutrition>
   - getIngredientNutrition(ingredientId): Promise<IngredientNutrition | null>
   - saveIngredientNutrition(ingredientId, data): Promise<IngredientNutrition>
   - getBatchIngredientNutrition(ingredientIds): Promise<Map<...>>
   ```

   Key formula to implement:
   ```
   1. total_N = SUM(ingredient_N_per_100g * ingredient_qty_kg * 10)
   2. yield_factor = expected_output_kg / actual_output_kg
   3. adjusted_N = total_N * yield_factor
   4. per_100g_N = adjusted_N / (actual_output_kg * 10)
   5. per_serving_N = per_100g_N * (serving_size_g / 100)
   6. percent_dv_N = (per_serving_N / daily_value_N) * 100
   ```

2. **serving-calculator-service.ts**
   ```typescript
   // Key methods:
   - calculateByWeight(totalWeightG, numServings): ServingSize
   - calculateByDimensions(totalWeightG, numPieces): ServingSize
   - calculateByVolume(totalVolumeMl, servingSizeMl): ServingSize
   - lookupRACC(category: string): RACCReference | null
   - validateAgainstRACC(servingSizeG, raccG): RACCValidation
   ```

   Must include FDA RACC table (139 categories)

3. **label-export-service.ts**
   ```typescript
   // Key methods:
   - generateFDALabel(nutrition): Promise<LabelOutput>
   - generateEULabel(nutrition): Promise<LabelOutput>
   - exportPDF(labelHtml, options?): Promise<Blob>
   - exportSVG(labelHtml): string
   - formatAllergenLabel(allergens): string
   ```

### Phase 2: Validation Schemas (Day 1)

1. **nutrition-schema.ts**
   - Zod schema for nutritionOverrideSchema
   - Conditional validation: reference required for lab_test/supplier_coa
   - Range validation for all nutrient fields

2. **ingredient-nutrition-schema.ts**
   - Zod schema for ingredient nutrition input
   - Source enumeration (usda, eurofir, supplier_coa, manual)
   - Confidence levels (high, medium, low)

### Phase 3: API Routes (Days 2-3)

1. **POST /api/technical/nutrition/products/:id/calculate**
   - Input: { bom_id?, actual_yield_kg?, allow_partial? }
   - Output: { ingredients, yield, total_per_batch, per_100g, missing_ingredients, warnings, metadata }
   - Error handling: NO_ACTIVE_BOM, MISSING_INGREDIENT_NUTRITION

2. **PUT /api/technical/nutrition/products/:id/override**
   - Input: { serving_size, serving_unit, servings_per_container, energy_kcal, protein_g, fat_g, carbohydrate_g, salt_g, [optionals], source, reference?, notes? }
   - Output: Complete ProductNutrition with audit trail
   - Audit: override_by, override_at, override_source, override_reference

3. **GET /api/technical/nutrition/products/:id**
   - Returns product nutrition data

4. **GET /api/technical/nutrition/products/:id/label**
   - Query: format ('fda'|'eu'|'canada'), output ('pdf'|'svg'|'html')
   - Returns label in requested format

5. **GET /api/technical/nutrition/racc**
   - Query: category (string)
   - Returns: { category, racc_grams, racc_description, common_servings }

6. **POST /api/technical/nutrition/ingredients/:id**
   - Create/update ingredient nutrition

7. **GET /api/technical/nutrition/ingredients/:id**
   - Get ingredient nutrition

### Phase 4: Database Migrations (Day 1)

Create migrations for:
- product_nutrition table (1:1 with products)
- ingredient_nutrition table (1:1 with products/ingredients)
- RLS policies for both tables

See `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/database.yaml` for schema

### Phase 5: Components (Handled by FRONTEND-DEV)
- NutritionPanelModal.tsx
- NutritionFactsPreview.tsx
- NutritionOverrideForm.tsx
- ServingCalculator.tsx
- IngredientBreakdownTable.tsx
- AllergenLabelSection.tsx
- LabelFormatSpec.tsx

---

## Key Technical Details

### Calculation Algorithm
```
For each nutrient N in BOM:
  1. Weighted total = SUM(ingredient_N/100g * qty_g) for all ingredients
  2. Apply yield factor = expected_output_kg / actual_output_kg
  3. Per 100g = (weighted_total * yield_factor) / output_grams * 100
  4. Per serving = per_100g * (serving_size_g / 100)
  5. % DV = (per_serving / FDA_daily_value) * 100 (rounded to nearest whole)
```

### FDA Daily Values (for % DV calculation)
```typescript
energy_kcal: 2000
fat_g: 78
saturated_fat_g: 20
cholesterol_mg: 300
sodium_mg: 2300
carbohydrate_g: 275
fiber_g: 28
sugar_g: 50
protein_g: 50
vitamin_d_mcg: 20
calcium_mg: 1300
iron_mg: 18
potassium_mg: 4700
```

### FDA RACC Examples (139 total categories)
- Bread: 50g
- Cookies: 30g
- Crackers: 30g
- Cheese: 30g
- Milk: 240g
- Yogurt: 225g
- Soft drinks: 360g

See context files for full table.

### Required FDA 2016 Nutrients
- Vitamin D (new)
- Calcium (new)
- Iron (new)
- Potassium (new)
- NOT: Vitamin A, Vitamin C (removed in 2016 update)

### Mandatory Macronutrients
- Energy (kcal)
- Protein
- Fat (total)
- Carbohydrates
- Salt (or Sodium)

### Performance SLAs
- Nutrition calculation: < 2 seconds
- Label generation: < 1 second
- RACC lookup: < 10ms
- PDF export: < 2 seconds

### RLS Pattern
```sql
WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

All nutrition tables must enforce RLS with this pattern to prevent cross-tenant access (AC-13.31).

---

## Testing During GREEN Phase

### Run Tests Continuously
```bash
npm test -- --testPathPattern="nutrition|serving|label" --watch
```

### Tests Should Progress as:
1. Start: All 310 tests FAILING
2. Implement NutritionService: ~60 tests should PASS
3. Implement ServingCalculatorService: +35 tests PASS (total 95)
4. Implement LabelExportService: +40 tests PASS (total 135)
5. Implement Schemas: +85 tests PASS (total 220)
6. Implement API routes: +90 tests PASS (total 310)

### Final Goal: All 310 tests PASSING

---

## Context References

The DEV agent should read:
1. `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/_index.yaml` - Story overview
2. `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/database.yaml` - Table schemas
3. `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/api.yaml` - API spec with schemas
4. `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/tests.yaml` - Test spec (this document)
5. `docs/1-BASELINE/product/modules/technical.md` - PRD sections FR-2.80 to FR-2.84
6. `docs/3-ARCHITECTURE/ux/wireframes/TEC-009-nutrition-panel.md` - UI wireframes
7. `docs/3-ARCHITECTURE/ux/wireframes/TEC-011-nutrition-calculator.md` - Calculator wireframes

---

## Notes for DEV Agent

### Critical Success Factors
1. **Calculation Accuracy**: Weighted average formula is core - test extensively
2. **FDA Compliance**: Label format must match 2016 spec exactly (typography, nutrients)
3. **RLS Isolation**: Cross-tenant data must be impossible to access
4. **Performance**: 2-second SLA for calculation is critical
5. **Audit Trail**: Override metadata must be immutable once saved

### Common Pitfalls to Avoid
1. Not concentrating nutrients when yield < 100%
2. Forgetting yield factor in calculation
3. Incorrect % DV rounding (should round to nearest whole)
4. Including Vitamin A/C in label (2016 removed them)
5. Not validating reference field for lab_test source
6. Missing RLS on ingredient_nutrition table

### Database Considerations
- Use gen_random_uuid() for IDs
- Set UNIQUE constraint on (org_id, product_id)
- Set UNIQUE constraint on (org_id, ingredient_id)
- Create indexes on org_id and product_id for RLS performance
- Use DECIMAL(10,2) for macronutrients, DECIMAL(10,4) for micronutrients

### Caching Strategy
- Cache nutrition calculation: 10-minute TTL
- Key: `org:{orgId}:product:{productId}:nutrition`
- Invalidate on: BOM change, ingredient nutrition change, manual override

---

## Ready for Implementation

All information needed for the GREEN phase is provided:
- 310+ comprehensive tests covering 31 acceptance criteria
- 100% AC coverage
- Complete calculation formulas
- FDA compliance specifications
- RLS security requirements
- Performance benchmarks
- Implementation roadmap
- Context references

**Status**: Ready for DEV agent to begin implementation.

---

## Questions?

Reference the context YAML files for additional details:
- Test specifications: `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/tests.yaml`
- API design: `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/api.yaml`
- Database schema: `docs/2-MANAGEMENT/epics/current/02-technical/context/02.13/database.yaml`
