# Batch Execution Checklist
# MonoPilot - Epic 2 & 3 Implementation

**Reference:** `IMPLEMENTATION_PLAN_EPIC_2_3.md`

---

## 🎯 BATCH 1: Products & BOM Foundation

### Pre-Batch Setup (Before Starting Session)

#### 1. Create Tech Spec
- [ ] Open new Claude conversation
- [ ] Say: "Create tech spec for Epic 2 Batch 1 - Products and BOM"
- [ ] OR use workflow: `/bmad:bmm:workflows:epic-tech-context`
- [ ] Review and save to: `docs/sprint-artifacts/tech-spec-epic-2.md`

#### 2. Create Story Files (15 files needed)
**Option A: Bulk create all at once**
```
Create story files for Batch 1:
- 2.1: Product CRUD
- 2.2: Product Versioning
- 2.3: Product History
- 2.4: Product Allergens
- 2.5: Product Types
- 2.6: BOM CRUD
- 2.7: BOM Items
- 2.8: BOM Validation
- 2.9: BOM Timeline
- 2.10: BOM Clone
- 2.11: BOM Compare
- 2.12: Conditional BOM
- 2.13: By-Products
- 2.14: Allergen Inheritance
- 2.22: Technical Settings

Save to: docs/sprint-artifacts/stories/story-2-X-*.md
```

**Option B: Create one-by-one as you implement**
```
For each story, run:
/bmad:bmm:workflows:create-story
```

#### 3. Review Reference Docs
- [ ] Read: `docs/epics/epic-2-technical.md` (stories 2.1-2.14, 2.22)
- [ ] Read: `docs/architecture/index-architecture.md`
- [ ] Review: `docs/sprint-artifacts/tech-spec-epic-1.md` (as template)

#### 4. Check Database Schema
- [ ] Verify migrations are up to date: `apps/frontend/lib/supabase/migrations/`
- [ ] Last migration number: ___ (note it down)

#### 5. Git Status
- [ ] Create feature branch: `git checkout -b epic-2-batch-1-products-bom`
- [ ] Ensure clean working directory

### During Implementation

#### Story Execution Flow (Repeat for each of 15 stories)
1. [ ] Run story-context: `/bmad:bmm:workflows:story-context`
2. [ ] Implement story: `/bmad:bmm:workflows:dev-story`
3. [ ] Write tests (unit + integration)
4. [ ] Run tests: `pnpm test`
5. [ ] Mark done: `/bmad:bmm:workflows:story-done`

#### Progress Tracking
- [ ] Story 2.1: Product CRUD ⏳
- [ ] Story 2.2: Product Versioning ⏳
- [ ] Story 2.3: Product History ⏳
- [ ] Story 2.4: Product Allergens ⏳
- [ ] Story 2.5: Product Types ⏳
- [ ] Story 2.6: BOM CRUD ⏳
- [ ] Story 2.7: BOM Items ⏳
- [ ] Story 2.8: BOM Validation ⏳
- [ ] Story 2.9: BOM Timeline ⏳
- [ ] Story 2.10: BOM Clone ⏳
- [ ] Story 2.11: BOM Compare ⏳
- [ ] Story 2.12: Conditional BOM ⏳
- [ ] Story 2.13: By-Products ⏳
- [ ] Story 2.14: Allergen Inheritance ⏳
- [ ] Story 2.22: Technical Settings ⏳

### Post-Batch Validation

#### Testing
- [ ] Run full test suite: `pnpm test`
- [ ] Test coverage >95%: `pnpm test:coverage`
- [ ] All API tests passing
- [ ] Type check: `pnpm type-check`

#### Seed Data
- [ ] Create/update seed script: `scripts/seed-epic2-batch1-data.mjs`
- [ ] Test seed script: `node scripts/seed-epic2-batch1-data.mjs`
- [ ] Verify data in Supabase dashboard

#### Documentation
- [ ] Tech spec complete and saved
- [ ] All story files saved
- [ ] Update architecture docs if needed
- [ ] Run retrospective: `/bmad:bmm:workflows:retrospective`

#### Git
- [ ] Commit all changes
- [ ] Create PR (optional)
- [ ] Tag: `git tag epic-2-batch-1-complete`

---

## 🎯 BATCH 2: Purchase & Transfer Orders

### Pre-Batch Setup

#### 1. Create Tech Spec
- [ ] New Claude conversation
- [ ] Say: "Create tech spec for Epic 3 Batch 2 - Purchase and Transfer Orders"
- [ ] Save to: `docs/sprint-artifacts/tech-spec-epic-3-part1.md`

#### 2. Create Story Files (9 files)
```
Stories for Batch 2:
- 3.1: PO CRUD
- 3.2: PO Lines
- 3.3: Bulk PO
- 3.4: PO Approval
- 3.5: PO Statuses
- 3.6: TO CRUD
- 3.7: TO Lines
- 3.8: Partial Shipments
- 3.9: LP Selection

Save to: docs/sprint-artifacts/stories/story-3-X-*.md
```

#### 3. Review Reference Docs
- [ ] Read: `docs/epics/epic-3-planning.md` (stories 3.1-3.9)
- [ ] Review Batch 1 deliverables (Products API)
- [ ] Check: Are suppliers in Epic 1 or need to create?

#### 4. Verify Batch 1 Completion
- [ ] Products API working
- [ ] Product seed data exists
- [ ] All Batch 1 tests passing

#### 5. Git Status
- [ ] Create branch: `git checkout -b epic-3-batch-2-po-to`
- [ ] Ensure Batch 1 merged/committed

### During Implementation

#### Progress Tracking
- [ ] Story 3.1: PO CRUD ⏳
- [ ] Story 3.2: PO Lines ⏳
- [ ] Story 3.3: Bulk PO ⏳
- [ ] Story 3.4: PO Approval ⏳
- [ ] Story 3.5: PO Statuses ⏳
- [ ] Story 3.6: TO CRUD ⏳
- [ ] Story 3.7: TO Lines ⏳
- [ ] Story 3.8: Partial Shipments ⏳
- [ ] Story 3.9: LP Selection ⏳

### Post-Batch Validation

#### Testing
- [ ] Run full test suite: `pnpm test`
- [ ] Integration test: Create product → Create PO with lines
- [ ] Integration test: Create TO between warehouses
- [ ] Test coverage >95%

#### Seed Data
- [ ] Create/update: `scripts/seed-epic3-batch2-data.mjs`
- [ ] Seed PO examples (draft, approved, completed)
- [ ] Seed TO examples (in-transit, delivered)
- [ ] Verify in Supabase

#### Documentation
- [ ] Tech spec saved
- [ ] All story files saved
- [ ] Run retrospective

#### Git
- [ ] Commit changes
- [ ] Tag: `git tag epic-3-batch-2-complete`

---

## 🎯 BATCH 3: Routing + Work Orders + Traceability

### Pre-Batch Setup

#### 1. Create Tech Spec
- [ ] New Claude conversation
- [ ] Say: "Create tech spec for Epic 2-3 Batch 3 - Routing, Work Orders, Traceability"
- [ ] Save to: `docs/sprint-artifacts/tech-spec-epic-2-3-routing-wo.md`

#### 2. Create Story Files (21 files)
```
Stories for Batch 3:

Routing (3):
- 2.15: Routing CRUD
- 2.16: Routing Operations
- 2.17: Routing-Product Assignment

Traceability (4):
- 2.18: Forward Traceability
- 2.19: Backward Traceability
- 2.20: Recall Simulation
- 2.21: Genealogy Tree

Dashboard (2):
- 2.23: Product Dashboard
- 2.24: Allergen Matrix

Work Orders (12 of 14):
- 3.10: WO CRUD
- 3.11: BOM Auto-Selection
- 3.12: WO Materials Snapshot
- 3.13: Material Availability
- 3.14: Routing Copy to WO
- 3.15: Configurable WO Statuses
- 3.16: WO Scheduling
- 3.17: Capacity Planning
- 3.18: WO Dependencies
- 3.19: Batch Size Calc
- 3.20: Alternative Materials
- 3.21: WO Costing

Save to: docs/sprint-artifacts/stories/story-2-X-*.md and story-3-X-*.md
```

#### 3. Review Reference Docs
- [ ] Read: `docs/epics/epic-2-technical.md` (stories 2.15-2.24)
- [ ] Read: `docs/epics/epic-3-planning.md` (stories 3.10-3.21)
- [ ] Review Batch 1 (Products, BOM)
- [ ] Review Batch 2 (PO, TO)

#### 4. Verify Previous Batches
- [ ] Products + BOM working (Batch 1)
- [ ] PO + TO working (Batch 2)
- [ ] All previous tests passing
- [ ] Seed data from Batch 1 & 2 exists

#### 5. Git Status
- [ ] Create branch: `git checkout -b epic-2-3-batch-3-routing-wo`
- [ ] Ensure Batch 1 & 2 merged

### During Implementation

#### Progress Tracking - Routing
- [ ] Story 2.15: Routing CRUD ⏳
- [ ] Story 2.16: Routing Operations ⏳
- [ ] Story 2.17: Routing-Product Assignment ⏳

#### Progress Tracking - Work Orders
- [ ] Story 3.10: WO CRUD ⏳
- [ ] Story 3.11: BOM Auto-Selection ⏳
- [ ] Story 3.12: Materials Snapshot ⏳
- [ ] Story 3.13: Material Availability ⏳
- [ ] Story 3.14: Routing Copy ⏳
- [ ] Story 3.15: WO Statuses ⏳
- [ ] Story 3.16: Scheduling ⏳
- [ ] Story 3.17: Capacity Planning ⏳
- [ ] Story 3.18: Dependencies ⏳
- [ ] Story 3.19: Batch Size ⏳
- [ ] Story 3.20: Alternative Materials ⏳
- [ ] Story 3.21: Costing ⏳

#### Progress Tracking - Traceability
- [ ] Story 2.18: Forward Trace ⏳
- [ ] Story 2.19: Backward Trace ⏳
- [ ] Story 2.20: Recall Simulation ⏳
- [ ] Story 2.21: Genealogy Tree ⏳

#### Progress Tracking - Dashboard
- [ ] Story 2.23: Product Dashboard ⏳
- [ ] Story 2.24: Allergen Matrix ⏳

### Post-Batch Validation

#### Testing
- [ ] Run full test suite: `pnpm test`
- [ ] Integration test: Create product → BOM → Routing → WO
- [ ] Integration test: Trace raw material → finished goods
- [ ] Integration test: Recall simulation
- [ ] Test coverage >95%

#### Seed Data
- [ ] Create/update: `scripts/seed-epic2-3-batch3-data.mjs`
- [ ] Seed routing examples
- [ ] Seed WO examples (all statuses)
- [ ] Seed genealogy data for traceability
- [ ] Verify in Supabase

#### End-to-End Testing
- [ ] **E2E Test 1:** Create product → Define BOM → Create routing → Create WO → Check materials
- [ ] **E2E Test 2:** Create PO → Receive materials → Create WO → Consume materials → Forward trace
- [ ] **E2E Test 3:** Finished goods → Backward trace to raw materials → Simulate recall

#### Documentation
- [ ] Tech spec saved
- [ ] All story files saved
- [ ] Run retrospective
- [ ] Update IMPLEMENTATION_PLAN with actual vs estimated

#### Git
- [ ] Commit all changes
- [ ] Tag: `git tag epic-2-3-complete`
- [ ] Create PR for review (optional)

---

## 🎉 Epic 2 & 3 Complete!

### Final Checklist
- [ ] All 47 stories implemented (Epic 2: 24, Epic 3: 23)
- [ ] All tests passing (>95% coverage)
- [ ] Complete seed data for all modules
- [ ] Tech specs documented
- [ ] Architecture docs updated
- [ ] Retrospective completed
- [ ] Ready to start Epic 4 (Production Execution)

### Celebration
- [ ] Run final test: `pnpm test`
- [ ] Take screenshot of passing tests
- [ ] Document lessons learned
- [ ] Prepare for Epic 4 planning

---

## 📝 Quick Commands Reference

### Workflows
```bash
# Check status
/bmad:bmm:workflows:workflow-status

# Create tech spec
/bmad:bmm:workflows:epic-tech-context

# Create story
/bmad:bmm:workflows:create-story

# Get story context
/bmad:bmm:workflows:story-context

# Implement story
/bmad:bmm:workflows:dev-story

# Mark story done
/bmad:bmm:workflows:story-done

# Code review
/bmad:bmm:workflows:code-review

# Retrospective
/bmad:bmm:workflows:retrospective
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test path/to/test.ts

# Type check
pnpm type-check

# Build
pnpm build
```

### Git
```bash
# Create branch
git checkout -b epic-X-batch-Y-description

# Commit
git add .
git commit -m "feat(epic-X): complete batch Y - description"

# Tag
git tag epic-X-batch-Y-complete
```

---

**Last Updated:** 2025-01-23
**Reference:** `IMPLEMENTATION_PLAN_EPIC_2_3.md`
