# Epic 2 - Optimized Batch Plan
# Token-Efficient Parallel Execution Strategy

**Created:** 2025-01-23
**Goal:** Minimize token usage, maximize parallel work, clear dependencies

---

## 📊 Epic 2 Story Structure Analysis

### Stories by Module:
```
Products:        2.1, 2.2, 2.3, 2.4, 2.5      (5 stories)
BOM:            2.6, 2.7, 2.8, 2.9, 2.10,     (9 stories)
                2.11, 2.12, 2.13, 2.14
Routing:        2.15, 2.16, 2.17              (3 stories)
Traceability:   2.18, 2.19, 2.20, 2.21        (4 stories)
Settings:       2.22                           (1 story)
Dashboard:      2.23, 2.24                     (2 stories)
```

### Dependency Chain:
```
Settings (2.22) ──┐
                  ├──> Products (2.1-2.5) ──┬──> BOM (2.6-2.14) ──┬──> Traceability (2.18-2.21)
                  └────────────────────────┴──> Routing (2.15-2.17) ──┘
                                                                        └──> Dashboard (2.23-2.24)
```

**Key Insights:**
- ✅ Settings CAN be parallel with Products (independent)
- ✅ BOM and Routing CAN be parallel (both only need Products)
- ❌ Traceability NEEDS all of: Products, BOM, Routing
- ❌ Dashboard NEEDS everything

---

## 🎯 Proposed Plan: 4 Sequential Batches

### **BATCH 2A: Foundation (Products + Settings)**
**Stories:** 2.1-2.5, 2.22 (6 stories)
**Token Budget:** ~40-50k tokens
**Duration:** 2-3 days

#### Context Creation (Single Session):
```
Session 1: Create all context (15-20k tokens)
- Tech spec for Products + Settings
- 6 story files at once
- Database schema (products, product_versions, product_allergens, technical_settings)
```

#### Implementation (Single Session):
```
Session 2: Implement all (30-40k tokens)
- Story 2.1: Product CRUD
- Story 2.2: Product Versioning
- Story 2.3: Product History
- Story 2.4: Product Allergens
- Story 2.5: Product Types
- Story 2.22: Technical Settings

Total: ~50-60k tokens (2 sessions)
```

**Deliverables:**
- Products API complete
- Product versioning working
- Allergen assignments
- Technical settings UI

**Unlocks:**
- ✅ BOM can start
- ✅ Routing can start
- ✅ Epic 3 PO/TO can start

---

### **BATCH 2B: BOM System**
**Stories:** 2.6-2.14 (9 stories)
**Token Budget:** ~60-80k tokens
**Duration:** 3-4 days

#### Context Creation (Single Session):
```
Session 1: Create all context (20-25k tokens)
- Tech spec for BOM
- 9 story files at once
- Database schema (boms, bom_items)
- BOM validation rules
```

#### Implementation (Split into 2 sessions):
```
Session 2: BOM Foundation (30-35k tokens)
- Story 2.6: BOM CRUD
- Story 2.7: BOM Items
- Story 2.8: Date Validation
- Story 2.9: Timeline Viz
- Story 2.10: BOM Clone

Session 3: BOM Advanced (30-35k tokens)
- Story 2.11: BOM Compare
- Story 2.12: Conditional Items
- Story 2.13: By-Products
- Story 2.14: Allergen Inheritance

Total: ~80-95k tokens (3 sessions)
```

**Why Split?**
- BOM has complex business logic
- Allergen inheritance needs testing
- By-products need careful implementation

**Deliverables:**
- BOM with date validity
- BOM items with conditions
- By-products tracking
- Allergen inheritance

**Unlocks:**
- ✅ Traceability can start (needs Products + BOM + Routing)
- ✅ Epic 3 Work Orders can start

---

### **BATCH 2C: Routing System**
**Stories:** 2.15-2.17 (3 stories)
**Token Budget:** ~25-35k tokens
**Duration:** 1-2 days

#### Context + Implementation (Single Session):
```
Session 1: Full routing implementation (25-35k tokens)
- Tech spec for Routing (inline, lightweight)
- 3 story files
- Database schema (routings, routing_operations)
- Story 2.15: Routing CRUD
- Story 2.16: Routing Operations
- Story 2.17: Routing-Product Assignment

Total: ~30-40k tokens (1 session)
```

**Why Single Session?**
- Only 3 stories
- Straightforward CRUD operations
- No complex business logic

**Deliverables:**
- Routing with operations
- Product-routing assignments
- Operation sequence management

**Can Run Parallel With:**
- ✅ Batch 2B (BOM) - they don't depend on each other!

**Unlocks:**
- ✅ Traceability can start (with BOM + Products)
- ✅ Epic 3 WO routing integration

---

### **BATCH 2D: Traceability + Dashboard**
**Stories:** 2.18-2.21, 2.23-2.24 (7 stories)
**Token Budget:** ~50-70k tokens
**Duration:** 3-4 days

#### Context Creation (Single Session):
```
Session 1: Create all context (20-25k tokens)
- Tech spec for Traceability + Dashboard
- 7 story files at once
- Database schema (lot_genealogy, traceability_links)
- Graph traversal algorithms
```

#### Implementation (Split into 2 sessions):
```
Session 2: Traceability (30-35k tokens)
- Story 2.18: Forward Traceability
- Story 2.19: Backward Traceability
- Story 2.20: Recall Simulation
- Story 2.21: Genealogy Tree View

Session 3: Dashboard (20-25k tokens)
- Story 2.23: Product Dashboard
- Story 2.24: Allergen Matrix Visualization

Total: ~70-85k tokens (3 sessions)
```

**Why Split?**
- Traceability is complex (graph algorithms)
- Dashboard needs all data to visualize

**Deliverables:**
- Forward/backward traceability
- Recall simulation
- Genealogy tree visualization
- Technical module dashboard
- Allergen matrix

**Epic 2 Complete! ✅**

---

## ⚡ Parallel Execution Strategy

### Option A: Linear (Safest, Token-Efficient)
```
Week 1: Batch 2A (Products + Settings)
Week 2: Batch 2B (BOM)
Week 3: Batch 2C (Routing)
Week 4: Batch 2D (Traceability + Dashboard)

Total: 4 weeks, ~200-280k tokens (6-8 sessions)
```

### Option B: Partial Parallel (Faster, More Complex)
```
Week 1: Batch 2A (Products + Settings)
Week 2: Batch 2B (BOM) + Batch 2C (Routing) IN PARALLEL
        - 2 separate conversations
        - BOM sessions: 3
        - Routing session: 1
        - Both can run same day!
Week 3: Batch 2D (Traceability + Dashboard)

Total: 3 weeks, ~200-280k tokens (7 sessions)
```

**Savings with Option B:**
- 🕒 Save 1 week (25% faster)
- 💰 Same token cost
- ⚠️ Requires managing 2 parallel conversations in Week 2

---

## 💡 Token Optimization Strategies

### 1. Batch Context Creation
**Instead of:**
```
- Create tech spec (20k tokens)
- Create story 1 (5k tokens)
- Create story 2 (5k tokens)
- Create story 3 (5k tokens)
Total: 35k tokens
```

**Do this:**
```
- Create tech spec + all 3 stories at once (25k tokens)
Total: 25k tokens
Savings: 10k tokens (28%)
```

### 2. Group Similar Stories
**Group by database schema:**
- Products stories share same tables → batch together
- BOM stories share same tables → batch together

**Group by UI patterns:**
- All CRUD stories follow same pattern → reuse context

### 3. Reuse Architecture Context
**First batch:**
- Load full architecture docs (10k tokens)

**Subsequent batches:**
- Reference: "Use architecture from Batch 2A" (1k tokens)
- Savings: 9k tokens per batch

### 4. Incremental Seed Data
**Instead of:** Recreate seed script each batch (5k tokens each)
**Do this:** Update existing script (2k tokens each)
**Savings:** 3k tokens per batch

---

## 📋 Detailed Batch Breakdown

### BATCH 2A: Products + Settings

#### Session 1: Context Creation (15-20k tokens)
**Prompt:**
```
Create context for Epic 2 Batch 2A - Products + Settings

Stories: 2.1-2.5, 2.22 (6 stories)

Create:
1. Tech spec covering:
   - products table (code, name, type, version, etc)
   - product_versions table (history)
   - product_allergens table (many-to-many)
   - technical_settings table
   - API endpoints (CRUD, history, allergens)
   - Versioning logic (X.Y format)

2. Story files (save to docs/sprint-artifacts/stories/):
   - story-2-1-product-crud.md
   - story-2-2-product-versioning.md
   - story-2-3-product-history.md
   - story-2-4-product-allergens.md
   - story-2-5-product-types.md
   - story-2-22-technical-settings.md

Reference: docs/epics/epic-2-technical.md (stories 2.1-2.5, 2.22)
```

#### Session 2: Implementation (30-40k tokens)
**Prompt:**
```
Implement Batch 2A - Products + Settings

Context files:
- docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md
- docs/sprint-artifacts/stories/story-2-*.md (stories 2.1-2.5, 2.22)

Implement in order:
1. Story 2.1: Product CRUD
2. Story 2.2: Product Versioning
3. Story 2.3: Product History
4. Story 2.4: Product Allergens
5. Story 2.5: Product Types
6. Story 2.22: Technical Settings

For each:
- Create migration
- Implement API routes
- Create UI components
- Write tests
- Update seed script

Follow patterns from Epic 1.
```

---

### BATCH 2B: BOM System

#### Session 1: Context Creation (20-25k tokens)
**Prompt:**
```
Create context for Epic 2 Batch 2B - BOM System

Stories: 2.6-2.14 (9 stories)

Create:
1. Tech spec covering:
   - boms table (product_id, valid_from, valid_to)
   - bom_items table (product_id, quantity, is_byproduct, condition)
   - Date overlap validation logic
   - Allergen inheritance algorithm
   - By-products calculation

2. Story files (all 9):
   - story-2-6-bom-crud.md through story-2-14-allergen-inheritance.md

Reference:
- docs/epics/epic-2-technical.md (stories 2.6-2.14)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md (Products schema)
```

#### Session 2: BOM Foundation (30-35k tokens)
```
Implement BOM Foundation (Stories 2.6-2.10)

Context: tech-spec + story files

Implement:
- Story 2.6: BOM CRUD
- Story 2.7: BOM Items
- Story 2.8: Date Validation
- Story 2.9: Timeline Viz
- Story 2.10: BOM Clone
```

#### Session 3: BOM Advanced (30-35k tokens)
```
Implement BOM Advanced (Stories 2.11-2.14)

Context: Previous session work + remaining story files

Implement:
- Story 2.11: BOM Compare
- Story 2.12: Conditional Items
- Story 2.13: By-Products
- Story 2.14: Allergen Inheritance
```

---

### BATCH 2C: Routing

#### Session 1: Full Implementation (30-40k tokens)
**Prompt:**
```
Create context + implement Routing System

Stories: 2.15-2.17 (3 stories)

1. Create lightweight tech spec (inline):
   - routings table
   - routing_operations table
   - product_routing assignments

2. Implement all 3 stories:
   - Story 2.15: Routing CRUD
   - Story 2.16: Routing Operations
   - Story 2.17: Routing-Product Assignment

Reference:
- docs/epics/epic-2-technical.md (stories 2.15-2.17)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md (Products)
```

---

### BATCH 2D: Traceability + Dashboard

#### Session 1: Context Creation (20-25k tokens)
```
Create context for Traceability + Dashboard

Stories: 2.18-2.21, 2.23-2.24 (7 stories)

Create tech spec:
- lot_genealogy table
- traceability_links table
- Graph traversal algorithms (forward/backward)
- Recall simulation logic
- Dashboard aggregation queries

Create 7 story files.

Reference: All previous Batch 2A/2B/2C work
```

#### Session 2: Traceability (30-35k tokens)
```
Implement Traceability (Stories 2.18-2.21)

- Forward trace algorithm
- Backward trace algorithm
- Recall simulation
- Genealogy tree visualization
```

#### Session 3: Dashboard (20-25k tokens)
```
Implement Dashboard (Stories 2.23-2.24)

- Product overview dashboard
- Allergen matrix visualization
- Connect to all Epic 2 data
```

---

## 📊 Token Budget Summary

| Batch | Context | Implementation | Total | Sessions |
|-------|---------|----------------|-------|----------|
| 2A    | 15-20k  | 30-40k         | 50-60k | 2 |
| 2B    | 20-25k  | 60-70k         | 85-95k | 3 |
| 2C    | 10k (inline) | 20-30k   | 30-40k | 1 |
| 2D    | 20-25k  | 50-60k         | 75-85k | 3 |
| **Total** | **65-80k** | **160-200k** | **240-280k** | **9 sessions** |

**With parallel execution (Option B):**
- Same token cost
- Faster completion (3 weeks vs 4 weeks)

---

## ✅ Recommendations

### For Token Efficiency:
1. ✅ **Batch context creation** (25-30% savings)
2. ✅ **Group similar stories** (easier context reuse)
3. ✅ **Reuse architecture context** (don't reload each time)
4. ✅ **Incremental seed data** (update, don't recreate)

### For Speed:
1. ✅ **Run Batch 2B and 2C in parallel** (Week 2)
   - Open 2 conversations same day
   - BOM in conversation 1
   - Routing in conversation 2
   - No conflicts (different tables/APIs)

### For Quality:
1. ✅ **Test after each batch** before moving to next
2. ✅ **Don't skip seed data** - crucial for testing
3. ✅ **Run retrospective** after each batch

---

## 🎯 Which Plan to Choose?

### Choose **Linear (Option A)** if:
- ⚠️ You want safest approach
- ⚠️ You prefer one thing at a time
- ⚠️ You want clearest dependencies
- ✅ 4 weeks is acceptable

### Choose **Parallel (Option B)** if:
- ✅ You want 25% faster (3 weeks vs 4)
- ✅ You can manage 2 conversations
- ✅ Same token cost
- ✅ You're comfortable with parallel work

---

## 📝 Next Steps

**Ready to start?**

1. Choose execution plan (Linear or Parallel)
2. Read this file completely
3. Start Batch 2A:
   - Open NEW Claude conversation
   - Copy prompt from "Session 1: Context Creation"
   - Begin!

---

**Last Updated:** 2025-01-23
**Replaces:** IMPLEMENTATION_PLAN_EPIC_2_3.md (for Epic 2 only)
