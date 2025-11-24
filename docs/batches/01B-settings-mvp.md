# Quick Start: Batch 1 - Products & BOM
# Epic 2 - Technical Core - Part 1

**Ready to start immediately? Follow this guide!**

---

## 🚀 Start Here (Copy-Paste to New Chat)

### Step 1: Initial Context Loading

Open a **NEW Claude conversation** and paste this:

```
I'm starting Batch 1 of Epic 2 & 3 implementation for MonoPilot MES.

Context files to read:
1. docs/sprint-artifacts/IMPLEMENTATION_PLAN_EPIC_2_3.md - Overall plan
2. docs/sprint-artifacts/BATCH_CHECKLIST.md - Batch 1 checklist
3. docs/epics/epic-2-technical.md - Epic 2 stories (read stories 2.1-2.14, 2.22)
4. docs/sprint-artifacts/tech-spec-epic-1.md - Template for tech spec format
5. docs/architecture/index-architecture.md - Architecture overview

After reading these files, confirm you understand:
- Batch 1 scope: 15 stories (Products + BOM + Technical Settings)
- Token budget: 100-120k tokens
- Dependencies: Epic 1 complete ✅
- Next steps: Create tech spec, then implement stories

Ready? Let's start!
```

---

### Step 2: Create Tech Spec

After Claude confirms context, say:

```
Let's create the tech spec for Epic 2 Batch 1.

Tech spec should cover:
1. Database Schema:
   - products table (with versioning fields)
   - product_versions table (history tracking)
   - product_allergens table (many-to-many)
   - boms table (with date validity)
   - bom_items table (with by-products)
   - technical_settings table

2. API Endpoints:
   - GET/POST/PUT/DELETE /api/technical/products
   - GET /api/technical/products/:id/history
   - POST /api/technical/products/:id/allergens
   - GET/POST/PUT/DELETE /api/technical/boms
   - GET/POST/PUT/DELETE /api/technical/boms/:id/items
   - GET/POST/PUT /api/technical/settings

3. Business Rules:
   - Product code immutable after creation
   - Version auto-increment (X.Y format)
   - BOM date overlap validation
   - Allergen inheritance from BOM items
   - By-products tracking

4. Architecture Decisions:
   - Versioning strategy (JSONB vs table)
   - BOM validation (constraint vs application)
   - Allergen inheritance algorithm

Format it like tech-spec-epic-1.md and save to:
docs/sprint-artifacts/tech-spec-epic-2.md
```

---

### Step 3: Verify Tech Spec

After Claude creates tech spec, review it and say:

```
Tech spec looks good! Now let's verify:

1. Check database schema matches our patterns:
   - All tables have org_id for multi-tenancy
   - All tables have audit fields (created_by, updated_by, created_at, updated_at)
   - Unique constraints include org_id
   - RLS policies defined

2. Check API patterns match Epic 1:
   - Consistent error handling
   - Query parameter validation
   - Response format standardization

3. Check business rules are clear and testable

If everything looks good, let's move to implementation!
```

---

### Step 4: Start Story Implementation

**Option A: Implement all stories sequentially**

```
Let's implement Story 2.1: Product CRUD

First, create the story file:
- Reference: docs/epics/epic-2-technical.md (Story 2.1)
- Save to: docs/sprint-artifacts/stories/story-2-1-product-crud.md

Then implement:
1. Database migration
2. API routes (GET/POST/PUT/DELETE /api/technical/products)
3. Frontend components
4. Tests (API + integration)
5. Update seed script

Follow the pattern from Epic 1 stories.
Ready to start?
```

**Option B: Use workflow (if available)**

```
/bmad:bmm:workflows:story-context

Then implement with:
/bmad:bmm:workflows:dev-story
```

---

### Step 5: Testing as You Go

After each story implementation:

```
Let's test Story 2.X:

1. Run API tests:
   cd apps/frontend
   pnpm test __tests__/api/technical/products.test.ts

2. Verify database:
   - Check migration applied
   - Verify RLS policies
   - Test CRUD operations

3. Manual testing:
   - Start dev server: pnpm dev
   - Navigate to /technical/products
   - Create, edit, delete test products
   - Check validation works

If all tests pass, mark story as done and move to next!
```

---

## 📋 Story-by-Story Quick Guide

### Story 2.1: Product CRUD
```
Implement:
- Migration: products table
- API: /api/technical/products (GET/POST/PUT/DELETE)
- UI: /technical/products page
- Tests: products.test.ts
- Seed: Add 5-10 sample products

Test: Create product, edit, delete, list all
```

### Story 2.2: Product Versioning
```
Implement:
- Migration: Add version field, product_versions table
- API: Auto-increment version on update
- Logic: X.Y versioning (1.9 → 2.0)
- Tests: Version increment scenarios

Test: Edit product multiple times, verify version increments
```

### Story 2.3: Product History
```
Implement:
- API: GET /api/technical/products/:id/history
- UI: History modal with timeline
- Display: Changed fields with old → new values

Test: View history after multiple edits
```

### Story 2.4: Product Allergens
```
Implement:
- Migration: product_allergens join table
- API: POST/DELETE /api/technical/products/:id/allergens
- UI: Allergen checkboxes in product form

Test: Assign allergens, remove allergens
```

### Story 2.5: Product Types
```
Implement:
- Migration: Add type field with enum
- API: Filter by type
- UI: Type selector, type badge

Test: Create products of each type, filter by type
```

### Story 2.6: BOM CRUD
```
Implement:
- Migration: boms table (with valid_from, valid_to)
- API: /api/technical/boms (GET/POST/PUT/DELETE)
- UI: /technical/boms page
- Tests: boms.test.ts

Test: Create BOM with date validity
```

### Story 2.7: BOM Items
```
Implement:
- Migration: bom_items table
- API: /api/technical/boms/:id/items
- UI: BOM items table with add/edit/delete
- Logic: Calculate total quantity

Test: Add items, edit quantities, remove items
```

### Story 2.8: BOM Date Validation
```
Implement:
- Validation: Check date overlaps
- API: Return 400 on overlap
- UI: Show error message
- Tests: Date overlap scenarios

Test: Try to create overlapping BOMs, verify error
```

### Story 2.9: BOM Timeline
```
Implement:
- UI: Timeline visualization component
- Display: BOM validity periods on timeline
- Interaction: Click to view BOM details

Test: View timeline with multiple BOMs
```

### Story 2.10: BOM Clone
```
Implement:
- API: POST /api/technical/boms/:id/clone
- Logic: Copy BOM with new dates
- UI: Clone button with date picker

Test: Clone BOM, verify new dates and items
```

### Story 2.11: BOM Compare
```
Implement:
- API: GET /api/technical/boms/compare?ids=x,y
- UI: Side-by-side comparison view
- Display: Highlight differences

Test: Compare two BOMs, verify diff shown
```

### Story 2.12: Conditional BOM Items
```
Implement:
- Migration: Add condition field to bom_items
- API: Support conditional items
- UI: Condition input (optional)
- Logic: Calculate based on conditions

Test: Add conditional items, verify calculation
```

### Story 2.13: By-Products
```
Implement:
- Migration: Add is_byproduct, yield_percentage to bom_items
- API: Support by-product flag
- UI: By-product checkbox, yield input
- Display: Separate by-products in BOM view

Test: Add by-products, verify yield calculation
```

### Story 2.14: Allergen Inheritance
```
Implement:
- Logic: Calculate product allergens from BOM items
- API: GET /api/technical/products/:id/inherited-allergens
- UI: Show inherited vs direct allergens
- Calculation: Recursive BOM traversal

Test: Verify allergen inheritance through BOM chain
```

### Story 2.22: Technical Settings
```
Implement:
- Migration: technical_settings table
- API: GET/PUT /api/technical/settings
- UI: Settings page (/technical/settings)
- Fields: Product fields config, BOM rules, versioning options

Test: Update settings, verify reflected in UI
```

---

## 🎯 Progress Tracking

Track your progress here (update as you go):

- [ ] Story 2.1: Product CRUD - ⏳ Not started | 🔄 In progress | ✅ Done
- [ ] Story 2.2: Product Versioning - ⏳
- [ ] Story 2.3: Product History - ⏳
- [ ] Story 2.4: Product Allergens - ⏳
- [ ] Story 2.5: Product Types - ⏳
- [ ] Story 2.6: BOM CRUD - ⏳
- [ ] Story 2.7: BOM Items - ⏳
- [ ] Story 2.8: BOM Validation - ⏳
- [ ] Story 2.9: BOM Timeline - ⏳
- [ ] Story 2.10: BOM Clone - ⏳
- [ ] Story 2.11: BOM Compare - ⏳
- [ ] Story 2.12: Conditional BOM - ⏳
- [ ] Story 2.13: By-Products - ⏳
- [ ] Story 2.14: Allergen Inheritance - ⏳
- [ ] Story 2.22: Technical Settings - ⏳

**Stories completed: 0 / 15**

---

## 🔧 Troubleshooting

### If Claude runs out of context:
1. Save current work
2. Start new conversation
3. Load context files again
4. Say: "Continuing from Story X.Y..."

### If tests fail:
1. Read error message carefully
2. Check database schema
3. Verify RLS policies
4. Check API route implementation
5. Ask Claude: "Test X is failing with error Y, how to fix?"

### If unsure about implementation:
1. Ask: "Show me example from Epic 1 for similar feature"
2. Reference: tech-spec-epic-1.md
3. Check: Epic 1 story files for patterns

---

## ✅ Batch 1 Complete Checklist

When all 15 stories done:

- [ ] All tests passing: `pnpm test`
- [ ] Type check: `pnpm type-check`
- [ ] Seed script: `node scripts/seed-epic2-batch1-data.mjs`
- [ ] Manual testing in browser
- [ ] Tech spec saved
- [ ] Git commit
- [ ] Ready for Batch 2! 🎉

---

## 📞 Need Help?

**Common Issues:**
- "Migration already exists" → Check migration number sequence
- "RLS policy error" → Verify org_id in policies
- "Type error" → Run `pnpm type-check` for details
- "Test timeout" → Increase timeout in vitest.config.ts

**Ask Claude:**
- "Show me Epic 1 example for [feature]"
- "How should I structure the API route for [endpoint]?"
- "What's the best way to test [functionality]?"
- "Review my code for [component/route]"

---

**Good luck! 🚀**

**Next:** After Batch 1 → Read `QUICK_START_BATCH_2.md`
