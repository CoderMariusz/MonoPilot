# Story 1.6.5: Settings Templates Preconfig (Industry-Specific)

Status: drafted

## Story

As a **System Administrator**,
I want **pre-configured industry templates (food/beverage) with products, BOMs, allergens, tax codes**,
so that **I can start production in 1 day (vs 1 week manual data entry) and avoid 95% of setup errors**.

## Acceptance Criteria

### AC-1: Template Library
- 3 industry templates: "Meat Processing Starter", "Bakery Starter", "Dairy Starter"
- Each template includes: 10-15 sample products, 5-10 BOMs, 14 allergens (EU), 3 tax codes, 5 suppliers
- Template preview: Show what will be created (product list, BOM list)
- One-click apply: "Import Meat Processing Starter" button

### AC-2: Meat Processing Starter Template
- Products: PORK-SHOULDER (RM), BEEF-TRIM (RM), CHICKEN-BREAST (RM), SALT (RM), PEPPER (RM), CHICKEN-SAUSAGE (FG), BEEF-BURGER (FG), PORK-BACON (FG)
- BOMs: CHICKEN-SAUSAGE (85% Chicken, 10% Salt, 5% Pepper), BEEF-BURGER (90% Beef, 5% Salt, 5% Spices)
- Allergens: Gluten, Milk, Eggs, Soy (marked on relevant products)
- Tax Codes: Standard (21%), Reduced (9%), Zero-Rated (0%)
- Suppliers: ABC Meat Suppliers, XYZ Spice Co.

### AC-3: Bakery Starter Template
- Products: WHEAT-FLOUR (RM), SUGAR (RM), BUTTER (RM), EGGS (RM), YEAST (RM), WHITE-BREAD (FG), CROISSANT (FG), CAKE (FG)
- BOMs: WHITE-BREAD (70% Flour, 20% Water, 5% Yeast, 3% Sugar, 2% Salt), CROISSANT (60% Flour, 25% Butter, 10% Milk, 5% Sugar)
- Allergens: Gluten (Flour), Milk (Butter), Eggs

### AC-4: Dairy Starter Template
- Products: MILK (RM), CREAM (RM), YOGURT-CULTURE (RM), CHEESE (FG), YOGURT (FG), BUTTER (FG)
- BOMs: YOGURT (95% Milk, 5% Culture), CHEESE (100% Milk + rennet)
- Allergens: Milk (Lactose)

### AC-5: Template Application
- Import with namespace: All imported products prefixed with org_id (avoid duplicates)
- Conflict resolution: If product SKU already exists → skip or rename (user choice)
- Import report: "Imported 12 products, 8 BOMs, 14 allergens, 3 tax codes, 5 suppliers"

### AC-6: Template Customization
- After import, user can edit all data (products, BOMs, allergens)
- Delete unwanted items: "Delete all imported data" button (rollback import)

## Tasks / Subtasks

### Task 1: Template Definition (6h)
- [ ] Define Meat Processing template JSON (products, BOMs, allergens, tax codes, suppliers)
- [ ] Define Bakery template JSON
- [ ] Define Dairy template JSON

### Task 2: Template Library UI (4h)
- [ ] Create `/settings/templates` page
- [ ] Template cards (Meat, Bakery, Dairy) with preview
- [ ] "Import" button per template

### Task 3: Import Logic (6h)
- [ ] Batch insert: products, BOMs, allergens, tax_codes, suppliers
- [ ] Namespace prefix (org_id based)
- [ ] Conflict resolution (skip or rename existing SKUs)
- [ ] Import report generation

### Task 4: Post-Import Management (4h)
- [ ] Edit imported data (navigate to product list)
- [ ] "Delete all imported data" rollback button
- [ ] Import history log (timestamp, template, imported_by)

### Task 5: E2E Tests (3h)
- [ ] E2E: Import "Meat Processing Starter" → 12 products created
- [ ] E2E: Conflict (SKU exists) → user chooses "Rename" → product renamed
- [ ] E2E: Delete imported data → all items removed

### Task 6: Documentation (2h)
- [ ] Update architecture.md with template system
- [ ] Create template customization guide

**Total Estimated Effort:** 25 hours (~3 days)

## Dev Notes

**Template JSON Structure:**
```json
{
  "template_name": "Meat Processing Starter",
  "version": "1.0",
  "products": [
    {"sku": "PORK-SHOULDER", "name": "Pork Shoulder", "type": "RM-Meat", "uom": "kg", "allergens": []},
    {"sku": "CHICKEN-SAUSAGE", "name": "Chicken Sausage", "type": "FG", "uom": "kg", "allergens": ["Gluten", "Soy"]}
  ],
  "boms": [
    {
      "product_sku": "CHICKEN-SAUSAGE",
      "version": "1.0",
      "items": [
        {"material_sku": "CHICKEN-BREAST", "qty": 0.85, "uom": "kg"},
        {"material_sku": "SALT", "qty": 0.10, "uom": "kg"},
        {"material_sku": "PEPPER", "qty": 0.05, "uom": "kg"}
      ]
    }
  ],
  "allergens": ["Gluten", "Milk", "Eggs", "Soy", "Peanuts", "Fish", ...],
  "tax_codes": [
    {"code": "STANDARD", "rate": 0.21, "description": "Standard VAT 21%"},
    {"code": "REDUCED", "rate": 0.09, "description": "Reduced VAT 9%"}
  ],
  "suppliers": [
    {"name": "ABC Meat Suppliers", "contact": "info@abcmeat.com"}
  ]
}
```

**MVP Scope:**
✅ 3 industry templates, template library UI, import with conflict resolution, delete imported data
❌ Growth: Custom template builder (user creates own template), template marketplace (share templates), template versioning

**Dependencies:** Story 1.6.4 (Settings Wizard) for seamless onboarding flow

## Dev Agent Record
### Context Reference
<!-- Will be added by story-context workflow -->
