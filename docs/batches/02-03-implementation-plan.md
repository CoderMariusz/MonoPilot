# Implementation Plan: Epic 2 & 3
# MonoPilot - Technical Core & Planning Operations

**Date Created:** 2025-01-23
**Status:** Ready to Execute
**Total Stories:** 47 (Epic 2: 24, Epic 3: 23)
**Estimated Duration:** 3 batches (~15-20 days)

---

## 📋 Current Status

### ✅ Completed (Epic 1)
- All 14 stories implemented
- 85/86 tests passing (99%)
- Seed data ready
- Tech spec documented: `docs/sprint-artifacts/tech-spec-epic-1.md`

### 🎯 Next: Epic 2 & 3
- **Epic 2 (Technical Core):** Products, BOMs, Routing, Traceability
- **Epic 3 (Planning):** Purchase Orders, Transfer Orders, Work Orders

---

## 🔗 Dependencies Chain

```
Epic 1 (Settings) ✅
    ↓
Epic 2 (Technical) ⏳
    ↓ ↘
Epic 3 (Planning) ⏳  Epic 4 (Production)
    ↓ ↘
Epic 5 (Warehouse)  Epic 6 (Quality)
```

**Critical Path:**
- Epic 3 **REQUIRES** Epic 2 (Products, BOM, Routing)
- Cannot parallelize Epic 2 & 3 - must be sequential
- Epic 3.1-3.9 (PO/TO) can start after Epic 2.1-2.5 (Products)
- Epic 3.10+ (WO) requires complete Epic 2.1-2.17

---

## 📦 Batch Breakdown

### **BATCH 1: Epic 2 - Products & BOM Foundation**
**Target:** Complete product master data + BOM system
**Duration:** ~5-7 days
**Token Budget:** 100-120k tokens

#### Prerequisites (TO CREATE):
1. ✏️ **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-2.md`
   - Database schema (products, product_versions, boms, bom_items)
   - API endpoints
   - Business rules
   - Architecture decisions

2. ✏️ **Story Files:** Create 15 story files in `docs/sprint-artifacts/stories/`
   - `story-2-1-product-crud.md`
   - `story-2-2-product-versioning.md`
   - `story-2-3-product-history.md`
   - `story-2-4-product-allergens.md`
   - `story-2-5-product-types.md`
   - `story-2-6-bom-crud.md`
   - `story-2-7-bom-items.md`
   - `story-2-8-bom-validation.md`
   - `story-2-9-bom-timeline.md`
   - `story-2-10-bom-clone.md`
   - `story-2-11-bom-compare.md`
   - `story-2-12-conditional-bom.md`
   - `story-2-13-byproducts.md`
   - `story-2-14-allergen-inheritance.md`
   - `story-2-22-technical-settings.md`

3. 📚 **Architecture Docs:** (if needed)
   - `docs/architecture/modules/technical.md` (may already exist)
   - Product versioning strategy
   - BOM date overlap validation

#### Stories Included:
- **2.1-2.5:** Product CRUD + Versioning + Allergens (5 stories)
- **2.6-2.14:** BOM Complete System (9 stories)
- **2.22:** Technical Settings Configuration (1 story)

#### Key Deliverables:
- Products table with versioning
- Product allergen assignments
- BOM with date-based validity
- BOM items with by-products
- Allergen inheritance logic
- Technical module settings UI

#### Acceptance Criteria:
- [ ] All 15 stories completed
- [ ] API tests passing (>95%)
- [ ] Seed data for products + BOMs
- [ ] Tech spec documented
- [ ] Ready to unlock Epic 3.1-3.9

---

### **BATCH 2: Epic 3 - Purchase & Transfer Orders**
**Target:** Procurement + internal inventory moves
**Duration:** ~4-5 days
**Token Budget:** 80-100k tokens

#### Prerequisites (TO CREATE):
1. ✏️ **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-3-part1.md`
   - Database schema (purchase_orders, po_lines, transfer_orders, to_lines)
   - API endpoints
   - Business rules (approval workflows, status transitions)
   - Integration with Epic 2 Products

2. ✏️ **Story Files:** Create 9 story files in `docs/sprint-artifacts/stories/`
   - `story-3-1-po-crud.md`
   - `story-3-2-po-lines.md`
   - `story-3-3-bulk-po.md`
   - `story-3-4-po-approval.md`
   - `story-3-5-po-statuses.md`
   - `story-3-6-to-crud.md`
   - `story-3-7-to-lines.md`
   - `story-3-8-partial-shipments.md`
   - `story-3-9-lp-selection.md`

3. 📚 **Additional Docs:**
   - Supplier master data (if not in Epic 1)
   - PO approval workflow configuration

#### Stories Included:
- **3.1-3.5:** Purchase Order System (5 stories)
- **3.6-3.9:** Transfer Order System (4 stories)

#### Key Deliverables:
- Purchase orders with lines
- Bulk PO creation
- Approval workflows
- Transfer orders between warehouses
- LP selection for transfers
- Configurable statuses

#### Dependencies:
- ✅ Requires: Epic 2.1-2.5 (Products) from Batch 1
- ⚠️ Does NOT require: BOM, Routing (those come in Batch 3)

#### Acceptance Criteria:
- [ ] All 9 stories completed
- [ ] API tests passing (>95%)
- [ ] Seed data for PO + TO
- [ ] Status workflows tested
- [ ] Ready for WO development

---

### **BATCH 3: Epic 2 Routing + Epic 3 Work Orders + Traceability**
**Target:** Production routing + work order execution + genealogy
**Duration:** ~6-8 days
**Token Budget:** 120-140k tokens

#### Prerequisites (TO CREATE):
1. ✏️ **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-2-3-routing-wo.md`
   - Database schema (routings, routing_operations, work_orders, wo_materials)
   - Traceability schema (lot_genealogy, forward/backward links)
   - API endpoints
   - Business rules (material availability, routing-BOM sync)

2. ✏️ **Story Files:** Create 21 story files in `docs/sprint-artifacts/stories/`
   - Routing (3 files): `story-2-15-routing-crud.md`, `story-2-16-routing-ops.md`, `story-2-17-routing-product.md`
   - Traceability (4 files): `story-2-18-forward.md`, `story-2-19-backward.md`, `story-2-20-recall.md`, `story-2-21-genealogy-tree.md`
   - Dashboard (2 files): `story-2-23-product-dashboard.md`, `story-2-24-allergen-matrix.md`
   - Work Orders (14 files): `story-3-10-wo-crud.md` through `story-3-23-wo-completion.md`

3. 📚 **Architecture Docs:**
   - Genealogy tracking strategy
   - Lot numbering scheme
   - Material consumption logic

#### Stories Included:
- **2.15-2.17:** Routing System (3 stories)
- **2.18-2.21:** Traceability & Genealogy (4 stories)
- **2.23-2.24:** Technical Dashboards (2 stories)
- **3.10-3.23:** Work Order Complete System (14 stories)

#### Key Deliverables:
- Routing with operations
- Product-routing assignments
- Work order CRUD with BOM snapshot
- Material availability checks
- WO status lifecycle
- Forward/backward traceability
- Recall simulation
- Genealogy tree visualization
- Technical module dashboard

#### Dependencies:
- ✅ Requires: Epic 2.1-2.14 (Products + BOM) from Batch 1
- ✅ Requires: Epic 2.22 (Settings) from Batch 1
- ⚠️ Parallel to: Epic 3.1-3.9 (completed in Batch 2)

#### Acceptance Criteria:
- [ ] All 21 stories completed
- [ ] API tests passing (>95%)
- [ ] Seed data for routing + WO + genealogy
- [ ] Traceability tested (forward + backward)
- [ ] Epic 2 & 3 fully complete
- [ ] Ready to start Epic 4 (Production Execution)

---

## 🔄 Workflow for Each Batch

### Before Starting Batch
1. Run `/bmad:bmm:workflows:workflow-status` to check current state
2. Create Tech Spec using `/bmad:bmm:workflows:epic-tech-context`
3. Create story files using `/bmad:bmm:workflows:create-story`
4. Review architecture alignment
5. Prepare seed data strategy

### During Batch Execution
1. For each story:
   - Run `/bmad:bmm:workflows:story-context` to assemble context
   - Implement using `/bmad:bmm:workflows:dev-story`
   - Write tests (unit + integration)
   - Update seed script if needed
   - Mark story done: `/bmad:bmm:workflows:story-done`

2. Code quality:
   - Run `/bmad:bmm:workflows:code-review` after major features
   - Fix any issues before moving to next story

### After Batch Completion
1. Run full test suite
2. Verify seed data works
3. Run `/bmad:bmm:workflows:retrospective`
4. Document lessons learned
5. Prepare for next batch

---

## 📊 Token Budget Breakdown

| Batch | Stories | Estimated Tokens | Safety Margin | Max Budget |
|-------|---------|------------------|---------------|------------|
| 1     | 15      | 100-110k         | 50k           | 160k       |
| 2     | 9       | 80-90k           | 70k           | 160k       |
| 3     | 21      | 120-130k         | 30k           | 160k       |
| **Total** | **47** | **300-330k** | **150k** | **480k (3 conversations)** |

---

## 🎯 Success Criteria (Overall)

### Epic 2 Completion
- [ ] 24 stories implemented
- [ ] Products with full versioning
- [ ] BOM with allergen inheritance
- [ ] Routing system functional
- [ ] Traceability working (forward/backward/recall)
- [ ] Technical dashboard live
- [ ] >95% test coverage
- [ ] Seed data complete

### Epic 3 Completion
- [ ] 23 stories implemented
- [ ] PO system with approvals
- [ ] TO system with LP selection
- [ ] WO system with material checks
- [ ] All status workflows configured
- [ ] >95% test coverage
- [ ] Seed data complete

### Integration Tests
- [ ] Create PO → Receive → Create WO → Consume materials → Track lot
- [ ] Create product → Define BOM → Create routing → Create WO
- [ ] Forward trace: Raw material → Finished goods
- [ ] Backward trace: Finished goods → Raw materials
- [ ] Recall simulation works

---

## 📁 File Structure

```
docs/
├── sprint-artifacts/
│   ├── IMPLEMENTATION_PLAN_EPIC_2_3.md (THIS FILE)
│   ├── tech-spec-epic-1.md ✅
│   ├── tech-spec-epic-2.md ⏳ (TO CREATE)
│   ├── tech-spec-epic-3-part1.md ⏳ (TO CREATE)
│   ├── tech-spec-epic-2-3-routing-wo.md ⏳ (TO CREATE)
│   └── stories/
│       ├── story-2-1-product-crud.md ⏳
│       ├── story-2-2-product-versioning.md ⏳
│       ├── ... (45 more story files to create)
│       └── story-3-23-wo-completion.md ⏳
├── epics/
│   ├── epic-1-settings.md ✅
│   ├── epic-2-technical.md ✅ (reference)
│   └── epic-3-planning.md ✅ (reference)
└── architecture/
    ├── index-architecture.md ✅
    └── modules/
        ├── settings.md ✅
        ├── technical.md ⏳ (may need updates)
        └── planning.md ⏳ (may need updates)
```

---

## 🚀 Getting Started

### Ready to Start Batch 1?

**Step 1:** Create context
```bash
# Run workflow to create tech spec
/bmad:bmm:workflows:epic-tech-context

# Create initial story files
/bmad:bmm:workflows:create-story
```

**Step 2:** Review prerequisites
- [ ] Epic 2 reference: `docs/epics/epic-2-technical.md`
- [ ] Architecture doc: `docs/architecture/index-architecture.md`
- [ ] Epic 1 tech spec (as template): `docs/sprint-artifacts/tech-spec-epic-1.md`

**Step 3:** Begin implementation
- Start with Story 2.1 (Product CRUD)
- Use story-context workflow for each story
- Follow TDD approach
- Update seed script incrementally

---

## 📞 Questions & Clarifications

### Unresolved Items
1. **Supplier Master Data:** Is this in Epic 1 or Epic 3? (Check settings)
2. **License Plates:** Are LPs from Epic 1 or Epic 5? (Check warehouse stories)
3. **Cost Tracking:** Do we track product costs in Epic 2 or defer to Finance module?

### Architecture Decisions Needed
1. **Product Versioning Storage:** JSONB history vs separate version table?
2. **BOM Date Overlap:** Database constraint vs application validation?
3. **Genealogy Performance:** Real-time query vs pre-computed graph?

---

## 📝 Notes

- Keep conversations focused on single batch to stay within token budget
- Create comprehensive seed data at end of each batch
- Document any architecture changes immediately
- Update this plan if scope changes during implementation
- Mark stories as DONE in workflow-status after completion

---

**Last Updated:** 2025-01-23
**Next Review:** After Batch 1 completion
**Owner:** Mariusz K
