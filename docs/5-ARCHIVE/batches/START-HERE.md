# 🚀 START HERE - Epic 2 & 3 Implementation Guide
# Token-Optimized Batch Execution Strategy

**Created:** 2025-01-23
**Status:** ✅ Ready to Execute
**Epic 1:** ✅ Complete (85/86 tests passing)

---

## 📋 Quick Navigation

### Primary Planning Documents (USE THESE!)
| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[EPIC_2_BATCH_PLAN_OPTIMIZED.md](./EPIC_2_BATCH_PLAN_OPTIMIZED.md)** | 4-batch plan for Epic 2 with token optimization | Epic 2 implementation |
| **[EPIC_3_BATCH_PLAN_OPTIMIZED.md](./EPIC_3_BATCH_PLAN_OPTIMIZED.md)** | 3-batch plan for Epic 3 with parallel options | Epic 3 implementation |

### Reference Documents
| Document | Purpose |
|----------|---------|
| `../epics/epic-2-technical.md` | Epic 2 stories (24 stories) |
| `../epics/epic-3-planning.md` | Epic 3 stories (23 stories) |
| `tech-spec-epic-1.md` | Template for tech specs |

---

## 🎯 The Optimized Strategy

### Why This Approach?

The previous 3-batch plan was rejected because it wasn't granular enough. The new optimized plans provide:

✅ **Granular batches** - Epic 2 split into 4 batches, Epic 3 into 3 batches
✅ **Token optimization** - 25-30% savings through batch context creation
✅ **Parallel execution** - Clear identification of what can run simultaneously
✅ **Session-by-session prompts** - Copy-paste ready instructions
✅ **Flexibility** - Linear or parallel execution options

---

## 📊 The New Structure at a Glance

### Epic 2: 4 Batches (24 stories, ~240-280k tokens)

```
Batch 2A: Products + Settings (6 stories)
  ├─ 2 sessions: Context + Implementation
  └─ ~50-60k tokens

Batch 2B: BOM System (9 stories) ◄── CAN RUN PARALLEL WITH 2C
  ├─ 3 sessions: Context + Foundation + Advanced
  └─ ~85-95k tokens

Batch 2C: Routing (3 stories) ◄── CAN RUN PARALLEL WITH 2B
  ├─ 1 session: Full implementation
  └─ ~30-40k tokens

Batch 2D: Traceability + Dashboard (7 stories)
  ├─ 3 sessions: Context + Traceability + Dashboard
  └─ ~75-85k tokens
```

### Epic 3: 3 Batches (23 stories, ~200-235k tokens)

```
Batch 3A: Purchase Orders (5 stories) ◄── CAN RUN PARALLEL WITH 3B
  ├─ 2 sessions: Context + Implementation
  └─ ~40-50k tokens

Batch 3B: Transfer Orders (4 stories) ◄── CAN RUN PARALLEL WITH 3A
  ├─ 1 session: Full implementation
  └─ ~35-45k tokens

Batch 3C: Work Orders (14 stories)
  ├─ 4 sessions: Context + Foundation + Scheduling + Advanced
  └─ ~125-140k tokens
```

---

## 🔗 Dependencies & Execution Order

### Option A: Linear Execution (Safest)

```
Week 1:  Epic 2 Batch 2A (Products + Settings)
Week 2:  Epic 2 Batch 2B (BOM)
Week 3:  Epic 2 Batch 2C (Routing)
Week 4:  Epic 2 Batch 2D (Traceability + Dashboard)
Week 5:  Epic 3 Batch 3A (Purchase Orders)
Week 6:  Epic 3 Batch 3B (Transfer Orders)
Week 7-8: Epic 3 Batch 3C (Work Orders)

Total: 8 weeks, ~440-515k tokens (7 conversations)
```

### Option B: Parallel Execution (RECOMMENDED - Faster!)

```
Week 1:  Epic 2 Batch 2A (Products + Settings)
         └─> Unlocks: 2B, 2C, 3A, 3B

Week 2:  🚀 4 PARALLEL CONVERSATIONS:
         ├─ Conversation 1: Epic 2 Batch 2B (BOM)
         ├─ Conversation 2: Epic 2 Batch 2C (Routing)
         ├─ Conversation 3: Epic 3 Batch 3A (PO)
         └─ Conversation 4: Epic 3 Batch 3B (TO)

Week 3:  Epic 2 Batch 2D (Traceability + Dashboard)

Week 4-5: Epic 3 Batch 3C (Work Orders)

Total: 5 weeks, ~440-515k tokens (7 conversations)
Savings: 3 weeks (38% faster!) ⚡
```

**Why Parallel Works:**
- BOM and Routing both only need Products (independent of each other)
- PO and TO both only need Products (independent of each other)
- No table conflicts, no API conflicts, no business logic overlap

---

## 🚀 Getting Started - Next Steps

### Step 1: Choose Your Path

**Choose Linear if:**
- You prefer one thing at a time
- You want simplest workflow
- 8 weeks is acceptable

**Choose Parallel if:** ✅ RECOMMENDED
- You want 38% faster completion (5 weeks vs 8)
- You can manage multiple conversations
- Same token cost

### Step 2: Start Epic 2 Batch 2A

**Open NEW Claude conversation** and copy-paste from:
📄 [EPIC_2_BATCH_PLAN_OPTIMIZED.md](./EPIC_2_BATCH_PLAN_OPTIMIZED.md) - Lines 262-293

Or use this quick prompt:

```
I'm starting Epic 2 Batch 2A - Products + Settings

Context files to read:
1. docs/sprint-artifacts/EPIC_2_BATCH_PLAN_OPTIMIZED.md
2. docs/epics/epic-2-technical.md (stories 2.1-2.5, 2.22)
3. docs/sprint-artifacts/tech-spec-epic-1.md (template)
4. docs/architecture/index-architecture.md

Create tech spec covering:
- products table (code, name, type, version, allergens)
- product_versions table (history)
- product_allergens table (many-to-many)
- technical_settings table
- API endpoints (CRUD, history, allergens)
- Versioning logic (X.Y format)

Then create 6 story files:
- story-2-1-product-crud.md
- story-2-2-product-versioning.md
- story-2-3-product-history.md
- story-2-4-product-allergens.md
- story-2-5-product-types.md
- story-2-22-technical-settings.md

Save tech spec to: docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md
Save stories to: docs/sprint-artifacts/stories/
```

### Step 3: After Batch 2A Completes

**If Linear:**
Continue with Batch 2B (BOM)

**If Parallel:**
Open 4 new conversations simultaneously:
1. Epic 2 Batch 2B (BOM)
2. Epic 2 Batch 2C (Routing)
3. Epic 3 Batch 3A (Purchase Orders)
4. Epic 3 Batch 3B (Transfer Orders)

All prompts are in the respective batch plan files!

---

## 💡 Token Optimization Strategies

### 1. Batch Context Creation (25-30% savings)
**Instead of:**
```
Session 1: Create tech spec (20k)
Session 2: Create story 1 (5k)
Session 3: Create story 2 (5k)
Total: 30k tokens
```

**Do this:**
```
Session 1: Create tech spec + all stories at once (22k)
Total: 22k tokens
Savings: 8k tokens (27%)
```

### 2. Reuse Architecture Context
**First batch:**
- Load full architecture (10k tokens)

**Subsequent batches:**
- Reference: "Use architecture from Batch 2A" (1k tokens)
- Savings: 9k tokens per batch

### 3. Group Similar Stories
- All CRUD stories follow same pattern → batch together
- Stories sharing same tables → implement in same session

### 4. Parallel Execution
- Run independent batches simultaneously
- No token cost increase
- Massive time savings (38% faster)

---

## 📦 What Gets Created in Each Batch

### Batch 2A Deliverables
- `products` table with versioning
- `product_versions` table (history)
- `product_allergens` table
- `technical_settings` table
- API: `/api/technical/products/*`
- UI: `/technical/products`, `/technical/settings`
- Tests: `products.test.ts`, `settings.test.ts`
- Seed: 10-15 sample products

### Batch 2B Deliverables
- `boms` table with date validity
- `bom_items` table with by-products
- API: `/api/technical/boms/*`
- UI: `/technical/boms` with timeline
- Tests: `boms.test.ts`
- Seed: 5-10 sample BOMs

### Batch 2C Deliverables
- `routings` table
- `routing_operations` table
- API: `/api/technical/routings/*`
- UI: `/technical/routings`
- Tests: `routings.test.ts`
- Seed: 5-10 sample routings

### Batch 2D Deliverables
- `lot_genealogy` table
- `traceability_links` table
- API: `/api/technical/traceability/*`
- UI: `/technical/traceability`, `/technical/dashboard`
- Tests: `traceability.test.ts`
- Seed: Complete traceability chains

### Batch 3A Deliverables
- `purchase_orders` table
- `po_lines` table
- `po_approvals` table
- API: `/api/planning/purchase-orders/*`
- UI: `/planning/purchase-orders`
- Tests: `purchase-orders.test.ts`
- Seed: 5-10 sample POs

### Batch 3B Deliverables
- `transfer_orders` table
- `to_lines` table
- API: `/api/planning/transfer-orders/*`
- UI: `/planning/transfer-orders`
- Tests: `transfer-orders.test.ts`
- Seed: 5-10 sample TOs

### Batch 3C Deliverables
- `work_orders` table
- `wo_materials` table
- `wo_operations` table
- API: `/api/planning/work-orders/*`
- UI: `/planning/work-orders`
- Tests: `work-orders.test.ts`
- Seed: 10-15 sample WOs with full lifecycle

---

## ✅ Success Criteria

### Per-Batch
- [ ] All stories implemented
- [ ] API tests passing (>95%)
- [ ] Integration tests passing
- [ ] Seed data working
- [ ] Type check passing (`pnpm type-check`)
- [ ] Tech spec documented

### Epic 2 Complete (After Batch 2D)
- [ ] 24 stories implemented
- [ ] Products with versioning working
- [ ] BOM with allergen inheritance
- [ ] Routing system functional
- [ ] Traceability (forward/backward/recall) working
- [ ] Technical dashboard live

### Epic 3 Complete (After Batch 3C)
- [ ] 23 stories implemented
- [ ] PO with approvals working
- [ ] TO with LP selection working
- [ ] WO with material checks working
- [ ] All status workflows configured

### Integration Tests (End-to-End)
- [ ] **Flow 1:** Product → BOM → Routing → WO → Material check
- [ ] **Flow 2:** PO → Receive → WO → Consume → Forward trace
- [ ] **Flow 3:** Finished goods → Backward trace → Recall simulation
- [ ] **Flow 4:** TO between warehouses → LP selection → Ship

---

## 🔧 Commands Reference

### Testing
```bash
pnpm test                    # Run all tests
pnpm test path/to/test.ts   # Run specific test
pnpm type-check             # Type checking
pnpm build                  # Build project
```

### Seed Scripts
```bash
node scripts/seed-epic1-data.mjs              # Epic 1 (existing)
node scripts/seed-epic2-batch2a-data.mjs      # Batch 2A (create)
node scripts/seed-epic2-batch2b-data.mjs      # Batch 2B (create)
node scripts/seed-epic3-batch3a-data.mjs      # Batch 3A (create)
# etc...
```

### Git Workflow
```bash
git checkout -b epic-2-batch-2a-products
git add .
git commit -m "feat(epic-2): complete batch 2a - products and settings"
git tag epic-2-batch-2a-complete
```

---

## 📊 Progress Tracking

### Epic 1 ✅
- [x] 14 stories complete
- [x] 85/86 tests passing
- [x] Seed data ready

### Epic 2 ⏳
- [ ] Batch 2A: Products + Settings (0/6 stories)
- [ ] Batch 2B: BOM System (0/9 stories)
- [ ] Batch 2C: Routing (0/3 stories)
- [ ] Batch 2D: Traceability + Dashboard (0/7 stories)

### Epic 3 ⏳
- [ ] Batch 3A: Purchase Orders (0/5 stories)
- [ ] Batch 3B: Transfer Orders (0/4 stories)
- [ ] Batch 3C: Work Orders (0/14 stories)

**Total Progress:** 14/61 stories (23%)

---

## 🎉 You're Ready!

### What You Have:
✅ Epic 1 complete and tested
✅ Comprehensive batch plans with prompts
✅ Clear parallel execution strategy
✅ Token optimization built in
✅ Session-by-session guidance

### What to Do Now:
1. ✅ Read this document (you're here!)
2. 📖 Skim [EPIC_2_BATCH_PLAN_OPTIMIZED.md](./EPIC_2_BATCH_PLAN_OPTIMIZED.md)
3. 🚀 **Open new Claude conversation**
4. 📋 Copy-paste the Batch 2A prompt (above)
5. ⚡ BEGIN!

---

## 📞 Questions?

**"Which execution option should I choose?"**
→ Parallel (Option B) - it's 38% faster with same token cost

**"Can I mix and match?"**
→ Yes! Start with Batch 2A, then decide if you want to parallelize Week 2

**"What if I run out of tokens mid-batch?"**
→ The plans split large batches into multiple sessions (3-4 sessions for large batches)

**"Do I need all the old planning docs?"**
→ No! Just use the two OPTIMIZED plans. They're comprehensive.

**"What about the old IMPLEMENTATION_PLAN_EPIC_2_3.md?"**
→ Outdated. Use EPIC_2_BATCH_PLAN_OPTIMIZED.md and EPIC_3_BATCH_PLAN_OPTIMIZED.md instead.

---

**Last Updated:** 2025-01-23
**Status:** Ready to Execute
**Recommended First Step:** Start Epic 2 Batch 2A (see prompt above)

🚀 **Let's build MonoPilot!**
