# Epic 3 - Optimized Batch Plan
# Token-Efficient Planning Operations Strategy

**Created:** 2025-01-23
**Prerequisites:** Epic 2 Batch 2A (Products) complete ✅
**Goal:** Minimize token usage for Purchase Orders, Transfer Orders, Work Orders

---

## 📊 Epic 3 Story Structure Analysis

### Stories by Module:
```
Purchase Orders:    3.1, 3.2, 3.3, 3.4, 3.5           (5 stories)
Transfer Orders:    3.6, 3.7, 3.8, 3.9                (4 stories)
Work Orders:        3.10, 3.11, 3.12, 3.13, 3.14,     (14 stories)
                    3.15, 3.16, 3.17, 3.18, 3.19,
                    3.20, 3.21, 3.22, 3.23
```

### Dependency Chain:
```
Epic 2 - Products (2.1-2.5) ──┬──> PO (3.1-3.5) ─────────┐
                              └──> TO (3.6-3.9) ─────────┤
                                                         ├──> (No interdependency)
Epic 2 - BOM (2.6-2.14) ──────┬──> WO Foundation ──────┤
Epic 2 - Routing (2.15-2.17) ─┘    (3.10-3.15)         │
                                          │              │
                                          └──> WO Advanced (3.16-3.23)
```

**Key Insights:**
- ✅ PO and TO are INDEPENDENT (can be parallel!)
- ✅ PO only needs Products (from Epic 2 Batch 2A)
- ✅ TO only needs Products (from Epic 2 Batch 2A)
- ❌ WO needs Products + BOM + Routing (Epic 2 Batches 2A, 2B, 2C)
- ❌ WO Advanced needs WO Foundation

---

## 🎯 Proposed Plan: 3 Sequential Batches

### **BATCH 3A: Purchase Orders**
**Stories:** 3.1-3.5 (5 stories)
**Token Budget:** ~35-45k tokens
**Duration:** 2-3 days
**Prerequisites:** Epic 2 Batch 2A (Products) ✅

#### Context Creation (Single Session):
```
Session 1: Create all context (15-18k tokens)
- Tech spec for PO
- 5 story files at once
- Database schema (purchase_orders, po_lines, po_approvals)
- Supplier data check (is it in Epic 1?)
```

#### Implementation (Single Session):
```
Session 2: Implement all (25-30k tokens)
- Story 3.1: PO CRUD ✅
- Story 3.2: PO Lines ✅
- Story 3.3: Bulk PO ⏭️ DEFERRED to P2 (Coming Soon UI added)
- Story 3.4: PO Approval ✅
- Story 3.5: PO Statuses ✅

Total: ~40-50k tokens (2 sessions)
```

**Deliverables:**
- Purchase orders with lines ✅
- Bulk creation ⏭️ (deferred to Phase 2, Coming Soon modal added)
- Approval workflow ✅
- Configurable statuses ✅

**Can Run Parallel With:**
- ✅ Batch 3B (Transfer Orders) - completely independent!

---

### **BATCH 3B: Transfer Orders**
**Stories:** 3.6-3.9 (4 stories)
**Token Budget:** ~30-40k tokens
**Duration:** 1-2 days
**Prerequisites:** Epic 2 Batch 2A (Products) ✅

#### Context + Implementation (Single Session):
```
Session 1: Full implementation (30-40k tokens)
- Tech spec for TO (inline, lightweight)
- 4 story files
- Database schema (transfer_orders, to_lines)
- Story 3.6: TO CRUD
- Story 3.7: TO Lines
- Story 3.8: Partial Shipments
- Story 3.9: LP Selection

Total: ~35-45k tokens (1 session)
```

**Why Single Session?**
- Only 4 stories
- Similar to PO (CRUD pattern)
- No complex workflows

**Deliverables:**
- Transfer orders between warehouses
- Partial shipment tracking
- License plate selection

**Can Run Parallel With:**
- ✅ Batch 3A (Purchase Orders) - completely independent!

---

### **BATCH 3C: Work Orders**
**Stories:** 3.10-3.23 (14 stories)
**Token Budget:** ~100-130k tokens
**Duration:** 5-7 days
**Prerequisites:** Epic 2 Batches 2A, 2B, 2C (Products + BOM + Routing) ✅

#### Context Creation (Single Session):
```
Session 1: Create all context (25-30k tokens)
- Tech spec for WO
- 14 story files at once
- Database schema (work_orders, wo_materials, wo_operations)
- Material availability algorithm
- Scheduling logic
- Costing calculation
```

#### Implementation (Split into 3 sessions):
```
Session 2: WO Foundation (35-40k tokens)
- Story 3.10: WO CRUD
- Story 3.11: BOM Auto-Selection
- Story 3.12: Materials Snapshot
- Story 3.13: Material Availability
- Story 3.14: Routing Copy to WO
- Story 3.15: WO Statuses

Session 3: WO Scheduling (30-35k tokens)
- Story 3.16: WO Scheduling
- Story 3.17: Capacity Planning
- Story 3.18: WO Dependencies
- Story 3.19: Batch Size Calculation

Session 4: WO Advanced (30-35k tokens)
- Story 3.20: Alternative Materials
- Story 3.21: WO Costing
- Story 3.22: WO Reporting
- Story 3.23: WO Completion

Total: ~120-140k tokens (4 sessions)
```

**Why Split into 3 Implementation Sessions?**
- 14 stories is too much for one session
- Complex business logic (material checks, scheduling)
- Natural grouping: Foundation → Scheduling → Advanced

**Deliverables:**
- Work orders with BOM/Routing integration
- Material availability checks
- Production scheduling
- Capacity planning
- WO costing
- Complete execution lifecycle

**Epic 3 Complete! ✅**

---

## ⚡ Parallel Execution Strategy

### Option A: Linear (Safest)
```
After Epic 2 Batch 2A:
  Week 1: Batch 3A (PO)
  Week 2: Batch 3B (TO)

After Epic 2 Batches 2A+2B+2C:
  Week 3-4: Batch 3C (WO)

Total: 4 weeks, ~210-260k tokens
```

### Option B: Parallel PO+TO (Recommended!)
```
After Epic 2 Batch 2A:
  Week 1: Batch 3A (PO) + Batch 3B (TO) IN PARALLEL
          - 2 separate conversations
          - PO sessions: 2
          - TO session: 1
          - Can run same day!

After Epic 2 Batches 2A+2B+2C:
  Week 2-3: Batch 3C (WO)

Total: 3 weeks, ~210-260k tokens
Savings: 1 week (25% faster)
```

**Why Parallel Works:**
- PO and TO use different tables
- PO and TO have different APIs
- No business logic overlap
- Both only need Products (same prerequisite)

---

## 📊 Token Budget Summary

| Batch | Context | Implementation | Total | Sessions |
|-------|---------|----------------|-------|----------|
| 3A (PO) | 15-18k | 25-30k | 40-50k | 2 |
| 3B (TO) | 10k (inline) | 25-30k | 35-45k | 1 |
| 3C (WO) | 25-30k | 95-110k | 125-140k | 4 |
| **Total** | **50-58k** | **145-170k** | **200-235k** | **7 sessions** |

---

## 💡 Token Optimization Strategies

### 1. PO + TO Context Reuse
```
Instead of separate tech specs:
- PO tech spec: 15k tokens
- TO tech spec: 15k tokens
Total: 30k tokens

Do this:
- Combined "Orders" tech spec: 20k tokens
- Reference PO patterns in TO
Savings: 10k tokens (33%)
```

### 2. WO Batch Story Creation
```
Create all 14 WO story files at once: 25k tokens
vs
Create individually (2k each × 14): 28k tokens
Savings: 3k tokens
```

### 3. Reuse Epic 2 Context
```
For WO implementation, reference:
"Use Products schema from Epic 2 Batch 2A"
"Use BOM schema from Epic 2 Batch 2B"
"Use Routing schema from Epic 2 Batch 2C"

Savings: ~10-15k tokens (don't reload schemas)
```

---

## 📋 Detailed Batch Breakdown

### BATCH 3A: Purchase Orders

#### Session 1: Context Creation (15-18k tokens)
**Prompt:**
```
Create context for Epic 3 Batch 3A - Purchase Orders

Stories: 3.1-3.5 (5 stories)

Prerequisites:
- Epic 2 Batch 2A complete (Products exist)

Create:
1. Tech spec covering:
   - purchase_orders table (supplier_id, warehouse_id, status, totals)
   - po_lines table (product_id, quantity, price, tax)
   - po_approvals table (if workflow enabled)
   - Supplier data: Check if in Epic 1, if not create suppliers table
   - Status workflow
   - Approval process
   - Bulk creation algorithm

2. Story files (save to docs/sprint-artifacts/stories/):
   - story-3-1-po-crud.md
   - story-3-2-po-lines.md
   - story-3-3-bulk-po.md
   - story-3-4-po-approval.md
   - story-3-5-po-statuses.md

Reference:
- docs/epics/epic-3-planning.md (stories 3.1-3.5)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md (Products)
```

#### Session 2: Implementation (25-30k tokens)
**Prompt:**
```
Implement Batch 3A - Purchase Orders

Context files:
- docs/sprint-artifacts/tech-spec-epic-3-batch-3a.md
- docs/sprint-artifacts/stories/story-3-*.md (stories 3.1-3.5)

Implement in order:
1. Story 3.1: PO CRUD
2. Story 3.2: PO Lines
3. Story 3.3: Bulk PO Creation
4. Story 3.4: PO Approval Workflow
5. Story 3.5: Configurable PO Statuses

For each:
- Create migration
- Implement API routes
- Create UI components
- Write tests
- Update seed script

Follow patterns from Epic 2 Batch 2A (Products).
```

---

### BATCH 3B: Transfer Orders

#### Session 1: Full Implementation (35-45k tokens)
**Prompt:**
```
Create context + implement Transfer Orders

Stories: 3.6-3.9 (4 stories)

Prerequisites:
- Epic 2 Batch 2A complete (Products exist)

1. Create lightweight tech spec (inline):
   - transfer_orders table (from_warehouse, to_warehouse, status)
   - to_lines table (product_id, quantity, lp_id)
   - Partial shipment logic
   - LP selection rules

2. Implement all 4 stories:
   - Story 3.6: TO CRUD
   - Story 3.7: TO Lines
   - Story 3.8: Partial Shipments
   - Story 3.9: LP Selection

Reference:
- docs/epics/epic-3-planning.md (stories 3.6-3.9)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md (Products)
- docs/sprint-artifacts/tech-spec-epic-3-batch-3a.md (PO patterns)
```

---

### BATCH 3C: Work Orders

#### Session 1: Context Creation (25-30k tokens)
**Prompt:**
```
Create context for Epic 3 Batch 3C - Work Orders

Stories: 3.10-3.23 (14 stories)

Prerequisites:
- Epic 2 Batch 2A complete (Products)
- Epic 2 Batch 2B complete (BOM)
- Epic 2 Batch 2C complete (Routing)

Create:
1. Tech spec covering:
   - work_orders table (product_id, bom_id, routing_id, quantity, status)
   - wo_materials table (snapshot of BOM items)
   - wo_operations table (snapshot of routing ops)
   - Material availability algorithm
   - Scheduling logic
   - Capacity planning rules
   - Costing calculation (labor + materials)
   - Alternative materials logic

2. Story files (all 14):
   - story-3-10-wo-crud.md through story-3-23-wo-completion.md

Reference:
- docs/epics/epic-3-planning.md (stories 3.10-3.23)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md (Products)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md (BOM)
- docs/sprint-artifacts/tech-spec-epic-2-batch-2c.md (Routing)
```

#### Session 2: WO Foundation (35-40k tokens)
```
Implement WO Foundation (Stories 3.10-3.15)

Context: tech-spec + story files

Implement:
- Story 3.10: WO CRUD
- Story 3.11: BOM Auto-Selection (from product)
- Story 3.12: WO Materials Snapshot (freeze BOM)
- Story 3.13: Material Availability Check
- Story 3.14: Routing Copy to WO (freeze routing)
- Story 3.15: Configurable WO Statuses

These are the foundation - all others depend on these.
```

#### Session 3: WO Scheduling (30-35k tokens)
```
Implement WO Scheduling (Stories 3.16-3.19)

Context: Previous session + story files

Implement:
- Story 3.16: WO Scheduling (start/end dates)
- Story 3.17: Capacity Planning (machine/line load)
- Story 3.18: WO Dependencies (precedence)
- Story 3.19: Batch Size Calculation (yield/waste)
```

#### Session 4: WO Advanced (30-35k tokens)
```
Implement WO Advanced Features (Stories 3.20-3.23)

Context: Previous sessions + story files

Implement:
- Story 3.20: Alternative Materials (substitutions)
- Story 3.21: WO Costing (materials + labor)
- Story 3.22: WO Reporting (production summary)
- Story 3.23: WO Completion (finalization logic)
```

---

## 🔄 Integration with Epic 2

### Execution Timeline (Recommended):

```
Week 1:  Epic 2 Batch 2A (Products + Settings)
         └─> Unlocks: Epic 3 Batch 3A, 3B

Week 2:  Epic 2 Batch 2B (BOM) + Epic 2 Batch 2C (Routing) IN PARALLEL
         └─> Also: Epic 3 Batch 3A (PO) + Epic 3 Batch 3B (TO) IN PARALLEL

Week 3:  Epic 2 Batch 2D (Traceability + Dashboard)
         └─> Unlocks: Epic 3 Batch 3C (WO)

Week 4-5: Epic 3 Batch 3C (Work Orders)

Total: 5 weeks for Epic 2 + 3 complete
```

**Max Parallelism:**
- Week 2: 4 conversations running!
  - Conversation 1: Epic 2 Batch 2B (BOM)
  - Conversation 2: Epic 2 Batch 2C (Routing)
  - Conversation 3: Epic 3 Batch 3A (PO)
  - Conversation 4: Epic 3 Batch 3B (TO)

---

## ✅ Recommendations

### For Token Efficiency:
1. ✅ **Run PO + TO in parallel** (Week 2)
2. ✅ **Batch all WO stories context creation** (25-30k savings)
3. ✅ **Reference Epic 2 schemas** (don't reload)
4. ✅ **Split WO into 3 implementation sessions** (better focus)

### For Speed:
1. ✅ **Start Epic 3 Batch 3A+3B immediately after Epic 2 Batch 2A**
   - Don't wait for Epic 2 to complete!
   - PO/TO only need Products
2. ✅ **Run Week 2 with 4 parallel conversations**
   - Epic 2: BOM + Routing
   - Epic 3: PO + TO

### For Quality:
1. ✅ **Test WO thoroughly** - most complex module
2. ✅ **Verify material availability logic** - critical for production
3. ✅ **Test BOM/Routing snapshot** - must freeze correctly

---

## 🎯 Which Plan to Choose?

### Choose **Linear** if:
- You prefer one module at a time
- You want clear, simple workflow
- 4 weeks is acceptable

### Choose **Parallel** (RECOMMENDED) if:
- You want fastest completion (save 1-2 weeks)
- You can manage multiple conversations
- Same token cost
- You're comfortable with parallel work

---

## 📝 Next Steps

**After Epic 2 Batch 2A complete:**

1. Choose execution plan (Linear or Parallel)
2. If Parallel: Open 2 conversations for PO + TO
3. Start Batch 3A + 3B simultaneously
4. Complete both before moving to WO

**After Epic 2 Batches 2A+2B+2C complete:**

1. Start Batch 3C (Work Orders)
2. Follow 4-session approach
3. Test thoroughly
4. Epic 3 complete! 🎉

---

**Last Updated:** 2025-01-23
**Companion:** EPIC_2_BATCH_PLAN_OPTIMIZED.md
