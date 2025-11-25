# Epic 2 & 3 Implementation Guide
# MonoPilot - Technical Core & Planning Operations

**Status:** ✅ Ready to Execute
**Created:** 2025-01-23
**Epic 1 Status:** ✅ Complete (85/86 tests passing)

---

## 📚 Documentation Suite

This directory contains complete planning and execution guides for Epic 2 & 3:

### 🎯 Planning Documents
| File | Purpose | When to Use |
|------|---------|-------------|
| **[IMPLEMENTATION_PLAN_EPIC_2_3.md](./IMPLEMENTATION_PLAN_EPIC_2_3.md)** | Master plan for all 3 batches | Read first - overall strategy |
| **[BATCH_CHECKLIST.md](./BATCH_CHECKLIST.md)** | Detailed checklist for each batch | Before/during/after each batch |
| **[QUICK_START_BATCH_1.md](./QUICK_START_BATCH_1.md)** | Step-by-step guide for Batch 1 | Starting Batch 1 NOW |

### 📖 Reference Documents
| File | Purpose |
|------|---------|
| `../epics/epic-2-technical.md` | Epic 2 stories (reference only) |
| `../epics/epic-3-planning.md` | Epic 3 stories (reference only) |
| `tech-spec-epic-1.md` | Template for tech specs |
| `../architecture/index-architecture.md` | Architecture overview |

### 📝 To Be Created
| File | Created During | Purpose |
|------|----------------|---------|
| `tech-spec-epic-2.md` | Batch 1 start | Technical specification for Products & BOM |
| `tech-spec-epic-3-part1.md` | Batch 2 start | Technical spec for PO & TO |
| `tech-spec-epic-2-3-routing-wo.md` | Batch 3 start | Technical spec for Routing & WO |
| `stories/story-2-*.md` | During implementation | 24 story files for Epic 2 |
| `stories/story-3-*.md` | During implementation | 23 story files for Epic 3 |

---

## 🚀 Quick Start

### 👉 Starting Batch 1 Now?

**Read these 3 files in order:**
1. 📖 [IMPLEMENTATION_PLAN_EPIC_2_3.md](./IMPLEMENTATION_PLAN_EPIC_2_3.md) - 5 min read
2. ✅ [BATCH_CHECKLIST.md](./BATCH_CHECKLIST.md) - Bookmark for reference
3. 🎯 [QUICK_START_BATCH_1.md](./QUICK_START_BATCH_1.md) - **Start here!**

**Then open NEW Claude conversation and copy-paste from QUICK_START_BATCH_1.md**

---

## 📊 Scope Overview

### Epic 2: Technical Core (24 stories)
**Goal:** Products, BOMs, Routing, Traceability

**Batches:**
- **Batch 1:** Stories 2.1-2.14, 2.22 (15 stories) - Products + BOM
- **Batch 3:** Stories 2.15-2.21, 2.23-2.24 (9 stories) - Routing + Traceability + Dashboard

### Epic 3: Planning Operations (23 stories)
**Goal:** Purchase Orders, Transfer Orders, Work Orders

**Batches:**
- **Batch 2:** Stories 3.1-3.9 (9 stories) - PO + TO
- **Batch 3:** Stories 3.10-3.23 (14 stories) - Work Orders

### Batch Summary
| Batch | Stories | Token Budget | Duration | Status |
|-------|---------|--------------|----------|--------|
| **1** | 15 (Epic 2 Part 1) | 100-120k | 5-7 days | 🎯 Next |
| **2** | 9 (Epic 3 Part 1) | 80-100k | 4-5 days | ⏳ Waiting |
| **3** | 23 (Epic 2+3 Part 2) | 120-140k | 6-8 days | ⏳ Waiting |
| **Total** | **47** | **300-360k** | **15-20 days** | |

---

## 🔗 Dependencies

```
Epic 1 (Settings) ✅ COMPLETE
    ↓
Batch 1: Products + BOM (Epic 2.1-2.14, 2.22) ⏳ NEXT
    ↓
Batch 2: PO + TO (Epic 3.1-3.9) ⏳ REQUIRES Batch 1
    ↓
Batch 3: Routing + WO + Traceability ⏳ REQUIRES Batch 1 + 2
    (Epic 2.15-2.24, Epic 3.10-3.23)
```

**Key Insight:**
- ❌ Cannot do Epic 2 & 3 in parallel
- ✅ Can do Epic 3.1-3.9 after Epic 2.1-2.5
- ✅ Must complete Epic 2.1-2.17 before Epic 3.10+

---

## 🎯 Context Needed Before Each Batch

### Batch 1 Prerequisites
**Files to create:**
- [ ] Tech spec: `tech-spec-epic-2.md`
- [ ] 15 story files: `stories/story-2-1.md` through `story-2-14.md`, `story-2-22.md`

**Architecture review:**
- [ ] Product versioning strategy
- [ ] BOM date overlap validation approach
- [ ] Allergen inheritance algorithm

**References needed:**
- Epic 2 stories (2.1-2.14, 2.22)
- Epic 1 tech spec (template)
- Architecture docs

### Batch 2 Prerequisites
**Files to create:**
- [ ] Tech spec: `tech-spec-epic-3-part1.md`
- [ ] 9 story files: `stories/story-3-1.md` through `story-3-9.md`

**Verify from Batch 1:**
- [ ] Products API working
- [ ] Product seed data exists
- [ ] BOM API working (for future WO reference)

**Architecture review:**
- [ ] PO approval workflow design
- [ ] TO status lifecycle
- [ ] Supplier management (check if in Epic 1 or create)

**References needed:**
- Epic 3 stories (3.1-3.9)
- Batch 1 deliverables (Products, BOM)

### Batch 3 Prerequisites
**Files to create:**
- [ ] Tech spec: `tech-spec-epic-2-3-routing-wo.md`
- [ ] 21 story files: Stories 2.15-2.21, 2.23-2.24, 3.10-3.21

**Verify from Batch 1 & 2:**
- [ ] Products + BOM working
- [ ] PO + TO working
- [ ] All previous tests passing

**Architecture review:**
- [ ] Genealogy tracking strategy
- [ ] Lot numbering scheme
- [ ] Material consumption logic
- [ ] WO scheduling algorithm

**References needed:**
- Epic 2 stories (2.15-2.24)
- Epic 3 stories (3.10-3.23)
- Batch 1 & 2 deliverables

---

## 📦 What Gets Created in Each Batch

### Batch 1 Deliverables
**Database:**
- `products` table with versioning
- `product_versions` table (history)
- `product_allergens` table (many-to-many)
- `boms` table with date validity
- `bom_items` table with by-products
- `technical_settings` table

**API Endpoints:**
- `/api/technical/products` (CRUD)
- `/api/technical/products/:id/history`
- `/api/technical/products/:id/allergens`
- `/api/technical/boms` (CRUD)
- `/api/technical/boms/:id/items`
- `/api/technical/boms/:id/clone`
- `/api/technical/boms/compare`
- `/api/technical/settings`

**UI Pages:**
- `/technical/products` (list + CRUD)
- `/technical/boms` (list + CRUD)
- `/technical/settings`

**Seed Data:**
- 10-15 sample products (various types)
- 5-10 sample BOMs with items
- Allergen assignments
- By-products examples

### Batch 2 Deliverables
**Database:**
- `purchase_orders` table
- `po_lines` table
- `transfer_orders` table
- `to_lines` table
- `po_approvals` table (if workflow enabled)

**API Endpoints:**
- `/api/planning/purchase-orders` (CRUD)
- `/api/planning/purchase-orders/:id/lines`
- `/api/planning/purchase-orders/:id/approve`
- `/api/planning/purchase-orders/bulk`
- `/api/planning/transfer-orders` (CRUD)
- `/api/planning/transfer-orders/:id/lines`
- `/api/planning/transfer-orders/:id/ship`

**UI Pages:**
- `/planning/purchase-orders`
- `/planning/transfer-orders`

**Seed Data:**
- 5-10 sample POs (various statuses)
- 5-10 sample TOs
- Supplier data (if not in Epic 1)

### Batch 3 Deliverables
**Database:**
- `routings` table
- `routing_operations` table
- `work_orders` table
- `wo_materials` table
- `lot_genealogy` table
- `traceability_links` table

**API Endpoints:**
- `/api/technical/routings` (CRUD)
- `/api/technical/routings/:id/operations`
- `/api/planning/work-orders` (CRUD)
- `/api/planning/work-orders/:id/materials`
- `/api/planning/work-orders/:id/check-availability`
- `/api/technical/traceability/forward/:lotId`
- `/api/technical/traceability/backward/:lotId`
- `/api/technical/traceability/recall-simulation`

**UI Pages:**
- `/technical/routings`
- `/planning/work-orders`
- `/technical/traceability`
- `/technical/dashboard` (product overview)

**Seed Data:**
- 5-10 sample routings
- 10-15 sample work orders (all statuses)
- Genealogy data for traceability demo
- Complete product → BOM → routing → WO chain

---

## ✅ Success Criteria

### Per-Batch Criteria
**Each batch must achieve:**
- [ ] All stories implemented and tested
- [ ] API tests passing (>95% coverage)
- [ ] Integration tests passing
- [ ] Seed data working
- [ ] Tech spec documented
- [ ] Type check passing
- [ ] Manual UI testing done

### Epic 2 Complete
- [ ] 24 stories implemented
- [ ] Products with versioning working
- [ ] BOM with allergen inheritance working
- [ ] Routing system functional
- [ ] Traceability complete (forward/backward/recall)
- [ ] Technical dashboard live

### Epic 3 Complete
- [ ] 23 stories implemented
- [ ] PO system with approvals working
- [ ] TO system with LP selection working
- [ ] WO system with material checks working
- [ ] All status workflows configured

### Integration Tests
- [ ] **E2E Flow 1:** Product → BOM → Routing → WO → Materials check
- [ ] **E2E Flow 2:** PO → Receive → Create WO → Consume → Trace forward
- [ ] **E2E Flow 3:** Finished goods → Backward trace → Recall simulation
- [ ] **E2E Flow 4:** TO between warehouses → LP selection → Shipment

---

## 🔧 Tools & Commands

### Workflows (if available)
```bash
/bmad:bmm:workflows:workflow-status      # Check current status
/bmad:bmm:workflows:epic-tech-context    # Create tech spec
/bmad:bmm:workflows:create-story         # Create story file
/bmad:bmm:workflows:story-context        # Get story context
/bmad:bmm:workflows:dev-story           # Implement story
/bmad:bmm:workflows:story-done          # Mark story complete
/bmad:bmm:workflows:code-review         # Review code
/bmad:bmm:workflows:retrospective       # Post-batch review
```

### Testing Commands
```bash
pnpm test                                # Run all tests
pnpm test path/to/test.ts               # Run specific test
pnpm type-check                         # Type checking
pnpm build                              # Build project
```

### Seed Scripts
```bash
node scripts/seed-epic1-data.mjs        # Epic 1 seed (existing)
node scripts/seed-epic2-batch1-data.mjs # Batch 1 seed (create)
node scripts/seed-epic3-batch2-data.mjs # Batch 2 seed (create)
node scripts/seed-epic2-3-batch3-data.mjs # Batch 3 seed (create)
```

### Git Workflow
```bash
git checkout -b epic-2-batch-1-products-bom
git add .
git commit -m "feat(epic-2): complete batch 1 - products and bom"
git tag epic-2-batch-1-complete
```

---

## 📊 Progress Tracking

### Epic 1 ✅
- [x] 14 stories complete
- [x] 85/86 tests passing
- [x] Seed data ready

### Epic 2 ⏳
- [ ] Batch 1: Stories 2.1-2.14, 2.22 (0/15) ⏳ NEXT
- [ ] Batch 3 Part 1: Stories 2.15-2.21, 2.23-2.24 (0/9)

### Epic 3 ⏳
- [ ] Batch 2: Stories 3.1-3.9 (0/9)
- [ ] Batch 3 Part 2: Stories 3.10-3.23 (0/14)

**Total Progress:** 14/61 stories (23%) - Epic 1 complete, ready for Epic 2/3

---

## 📞 Support & Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| "Migration already exists" | Check migration sequence number |
| "RLS policy error" | Verify org_id in all policies |
| "Type errors" | Run `pnpm type-check` for details |
| "Test timeout" | Increase timeout in vitest.config.ts |
| "Context overflow" | Start new conversation, reload context |

### When to Ask Claude
- "Show me Epic 1 example for [feature]"
- "How should I structure [component/API]?"
- "Review my implementation of [story]"
- "Help debug [error message]"
- "What's the best way to test [functionality]?"

---

## 🎉 Ready to Start?

1. ✅ Read this README
2. 📖 Read IMPLEMENTATION_PLAN_EPIC_2_3.md (5 min)
3. ✅ Open BATCH_CHECKLIST.md (bookmark it)
4. 🚀 Follow QUICK_START_BATCH_1.md step-by-step

**Open new Claude conversation → Copy from QUICK_START_BATCH_1.md → BEGIN!**

---

**Last Updated:** 2025-01-23
**Next Review:** After Batch 1 completion
**Questions?** Check IMPLEMENTATION_PLAN or BATCH_CHECKLIST
