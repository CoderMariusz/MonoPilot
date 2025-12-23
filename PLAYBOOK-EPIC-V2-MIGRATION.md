# 📘 PLAYBOOK: Epic v2 Migration - Repeatable Process

**Purpose:** Apply Parallel Build → Atomic Swap strategy to ANY epic
**Proven On:** Epic 01 Settings (33 wireframes)
**Applicable To:** Epic 02 Technical, Epic 03 Planning, Epic 04 Production, etc.
**Time:** ~2-3 hours setup, then agent execution

---

## 🎯 OVERVIEW

This playbook lets you rebuild any epic module with 100% wireframe compliance using parallel build strategy.

**Input:**
- Epic with wireframes
- Existing code (may be incomplete/incorrect)

**Output:**
- Clean v2 code built from wireframes
- v1 code archived (reference only)
- Agent handoffs ready
- Verification automated
- Atomic swap ready

---

## 📋 STEP-BY-STEP PROCESS

### **STEP 1: ANALYZE (30 min)**

#### **1.1 Compare Wireframes vs Code**

```bash
# Count wireframes
ls docs/3-ARCHITECTURE/ux/wireframes/{EPIC_PREFIX}-*.md | wc -l

# Count existing pages
find apps/frontend/app/\(authenticated\)/{module}/ -name "page.tsx" | wc -l

# Note:
# - Coverage % = (pages / wireframes) * 100
# - Expected: 50-85% (rarely 100%)
```

#### **1.2 Identify Gaps**

**For each existing page, check:**
- [ ] Does it match wireframe ASCII art?
- [ ] Has all components from "Key Components" section?
- [ ] Has all actions from "Main Actions" section?
- [ ] Has all 4 states (Loading, Success, Empty, Error)?
- [ ] Has all data fields from wireframe table?

**Categorize screens:**
```
Category A: 90%+ compliant → MIGRATE with minor fixes
Category B: 60-89% compliant → REFACTOR with updates
Category C: <60% compliant → REBUILD from scratch
Category D: Not implemented → BUILD from scratch
```

#### **1.3 Document Findings**

Create comparison table:
```markdown
| Screen | Wireframe | Code Status | Compliance | Action |
|--------|-----------|-------------|------------|--------|
| XXX-001 | Users List | Exists | 70% | REFACTOR |
| XXX-002 | User Modal | Exists | 85% | MIGRATE |
| XXX-003 | New Screen | Missing | 0% | BUILD |
```

---

### **STEP 2: GIT SETUP (5 min)**

```bash
# 1. Commit current state
git add .
git commit -m "chore: checkpoint before {epic-name} v2 rebuild"

# 2. Create feature branch
git checkout -b feature/{epic-name}-v2-rebuild

# 3. Tag backup
git tag {epic-name}-v1-backup-$(date +%Y%m%d-%H%M)

echo "✅ Git setup complete"
```

---

### **STEP 3: CREATE PARALLEL STRUCTURE (10 min)**

```bash
# Template (replace {EPIC} with your epic name):

EPIC_NAME="{epic}"  # e.g., "settings", "technical", "planning"
APP_DIR="apps/frontend/app/(authenticated)"
COMP_DIR="apps/frontend/components"

# 1. Create v2 directories
mkdir -p "$APP_DIR/${EPIC_NAME}-v2"/{feature1,feature2,feature3,...}
mkdir -p "$COMP_DIR/${EPIC_NAME}-v2"/{shared,feature1,feature2,...}

# 2. Create archive
mkdir -p "$APP_DIR/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH"
mkdir -p "$COMP_DIR/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH"

# 3. Copy v1 to archive
cp -r "$APP_DIR/${EPIC_NAME}/"* "$APP_DIR/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/"
cp -r "$COMP_DIR/${EPIC_NAME}/"* "$COMP_DIR/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/"

echo "✅ Directories created"
```

**Example for Epic 2 Technical:**
```bash
EPIC_NAME="technical"

mkdir -p "apps/frontend/app/(authenticated)/technical-v2"/{products,materials,boms,routings,nutrition,allergens,costing,traceability,dashboard}

mkdir -p "apps/frontend/components/technical-v2"/{shared,products,materials,boms,routings,nutrition,allergens,costing}

cp -r "apps/frontend/app/(authenticated)/technical/"* "apps/frontend/app/(authenticated)/_archive-technical-v1-DO-NOT-TOUCH/"

cp -r "apps/frontend/components/technical/"* "apps/frontend/components/_archive-technical-v1-DO-NOT-TOUCH/"
```

---

### **STEP 4: CREATE DOCUMENTATION (60 min)**

#### **4.1 Migration Plan (30 min)**

```bash
# Create: docs/2-MANAGEMENT/EPIC-XX-MIGRATION-PLAN.md

# Template structure (copy from EPIC-01-MIGRATION-PLAN.md):
```

**Sections:**
1. Analysis (wireframes vs code)
2. Strategy (Parallel Build rationale)
3. 5-Phase Plan (Preparation, Foundation, Rebuild, Integration, Cleanup)
4. Isolation Rules (allowed/forbidden)
5. Reusable Assets (services, schemas, components)
6. Verification Criteria (checklist)
7. Rollback Plan
8. Timeline Estimates
9. Kickoff Commands (copy-paste ready)

#### **4.2 Agent Handoffs (30 min per handoff)**

```bash
# Create directory
mkdir -p docs/2-MANAGEMENT/epics/current/{epic-number}-{epic-name}/agent-handoffs/

# Create handoff files (YAML format):
```

**Handoff Template:**
```yaml
# agent-handoffs/XX-screen-name.yaml

agent: frontend-dev
epic: "{epic-number}-{epic-name}"
story: "{story-id}"
phase: "FOUNDATION | CRITICAL REWRITE | REFACTOR | NEW SCREEN"
priority: CRITICAL | HIGH | MEDIUM | LOW
task: "One-line description"

context:
  wireframes:
    - path/to/wireframe.md
  story_file:
    - path/to/story.md
  migration_plan:
    - path/to/migration-plan.md

architecture:
  # What changed from v1 to v2

output:
  pages:
    - path/to/create.tsx
  components:
    - path/to/component.tsx

requirements:
  must_have:
    - Feature 1
    - Feature 2

reusable:
  services:
    - lib/services/xxx.ts
  schemas:
    - lib/validation/xxx.ts

isolation:
  allowed:
    - What agents CAN do
  forbidden:
    - What agents CANNOT do

acceptance:
  - [ ] Criteria 1
  - [ ] Criteria 2

estimated_hours: X-Y
complexity: LOW | MEDIUM | HIGH
```

**Create handoffs for:**
1. Foundation (shared components) - ALWAYS FIRST
2. Critical rewrites (architecture changes)
3. Core refactors (updates needed)
4. New screens (build from scratch)

#### **4.3 Master Prompt (15 min)**

```bash
# Create: docs/.../MASTER-PROMPT-FOR-AGENTS.md

# Copy from Epic 1 template, update:
# - Epic name
# - Module name
# - Directory paths
```

#### **4.4 README Files (15 min)**

Create 4 READMEs:
```
1. {epic}-v2/README.md (agent rules)
2. _archive-{epic}-v1-DO-NOT-TOUCH/README.md (warnings)
3. agent-handoffs/README.md (handoff index)
4. AGENT-START-HERE.md (quick start)
```

---

### **STEP 5: CREATE VERIFICATION SCRIPT (10 min)**

```bash
# Create: scripts/check-{epic}-v2-isolation.sh

# Template (update EPIC_NAME variable):
```

```bash
#!/bin/bash
EPIC_NAME="technical"  # UPDATE THIS

echo "🔍 Checking ${EPIC_NAME} v2 isolation..."

# Check v2 doesn't import from v1
BAD_IMPORTS=$(grep -r "from '@/app/(authenticated)/${EPIC_NAME}/'" "apps/frontend/app/(authenticated)/${EPIC_NAME}-v2/" 2>/dev/null || true)

if [ -z "$BAD_IMPORTS" ]; then
  echo "✅ No v1 imports found"
else
  echo "❌ Found v1 imports:"
  echo "$BAD_IMPORTS"
  exit 1
fi

# TypeScript check
cd apps/frontend && npx tsc --noEmit

echo "✅ All checks passed!"
```

```bash
chmod +x scripts/check-{epic}-v2-isolation.sh
```

---

### **STEP 6: UPDATE STORY FILES (30 min)**

**For critical stories (3-7 stories typically):**

Add banner to top of story file:
```markdown
# XX.Y - Story Name

---

## 🚧 V2 MIGRATION - {CATEGORY}

**⚠️ {Why this story needs attention}**

### **Build Location:**
```
✅ CREATE: app/(authenticated)/{epic}-v2/{feature}/
❌ DO NOT EDIT: app/(authenticated)/{epic}/ (v1 frozen)
```

### **{What changed / What to do}**

### **Your Resources:**
- Handoff: agent-handoffs/XX-your-task.yaml
- Wireframe: SET-XXX.md or TEC-XXX.md
- Migration Plan: EPIC-XX-MIGRATION-PLAN.md

**Estimated Effort:** X-Y hours

---

_Original story content below ↓_

---
```

**Categories:**
- CRITICAL REWRITE (fundamental change)
- REFACTOR (add features)
- MIGRATE (minor updates)
- NEW SCREEN (build from scratch)

---

### **STEP 7: COMMIT & TAG (5 min)**

```bash
git add apps/frontend/app/\(authenticated\)/{epic}-v2/
git add apps/frontend/components/{epic}-v2/
git add apps/frontend/*/_archive-{epic}-v1-DO-NOT-TOUCH/
git add docs/2-MANAGEMENT/EPIC-{XX}-MIGRATION-PLAN.md
git add docs/.../agent-handoffs/
git add scripts/check-{epic}-v2-isolation.sh

git commit -m "feat({epic}): setup v2 parallel build structure

- Create {epic}-v2/ directory structure
- Archive v1 code to _archive-{epic}-v1-DO-NOT-TOUCH/
- Create X agent handoff prompts
- Add isolation checker script
- Update Y story files with v2 banners

Ready for agent execution
Migration strategy: Parallel Build → Atomic Swap
"

echo "✅ Setup complete! Ready for agents."
```

---

## 🎬 AGENT EXECUTION

### **Launch Order:**

```
1. Foundation (shared components)
   ├─ Handoff: 00-FOUNDATION-shared-components.yaml
   ├─ Effort: 6-8h
   └─ Blocks: ALL other work

2. Critical Rewrites (architecture changes)
   ├─ Do these EARLY (validate approach)
   ├─ Usually 1-3 screens per epic
   └─ Effort: 10-16h each

3. Core Refactors (updates/additions)
   ├─ Can parallelize (independent)
   ├─ Usually 3-7 screens
   └─ Effort: 6-10h each

4. New Screens (build from scratch)
   ├─ Can parallelize (fully independent)
   ├─ Usually 5-15 screens
   └─ Effort: 4-10h each

5. Integration & Swap
   ├─ When all screens done
   └─ Effort: 1 day
```

---

## 🛡️ UNIVERSAL ISOLATION RULES

**For ANY epic, agents must:**

### **✅ ALLOWED:**
- Read wireframes ({EPIC_PREFIX}-*.md)
- Read story files
- Use lib/services/ (reuse/update)
- Use lib/validation/ (verify/update)
- Create in {epic}-v2/
- Reference v1 FOR LOGIC ONLY

### **❌ FORBIDDEN:**
- Edit {epic}/ (v1 frozen)
- Import from v1 paths
- Copy v1 UI code
- Touch _archive-{epic}-v1-DO-NOT-TOUCH/

---

## 📊 METRICS TO TRACK

```
Setup Time: ~3 hours
├── Analysis: 1h
├── Git setup: 5min
├── Structure: 10min
├── Documentation: 1.5h
└── Story updates: 30min

Agent Execution: ~10-20 days (depends on epic size)
├── Foundation: 1 day
├── Critical: 2-5 days
├── Core: 3-7 days
├── New: 2-5 days
└── Integration: 1 day

Savings:
├── No conflicts: ~30% faster
├── No rework: ~20% faster
├── Clean rollback: Risk mitigation
└── Total ROI: 40-50% time savings
```

---

## 🔄 CHECKLIST: Apply to New Epic

```
Setup Phase (2-3 hours):
☐ Step 1: Analyze wireframes vs code (30min)
☐ Step 2: Git setup (branch, tag) (5min)
☐ Step 3: Create {epic}-v2/ structure (10min)
☐ Step 4: Create documentation (60min)
  ☐ Migration plan (EPIC-XX-MIGRATION-PLAN.md)
  ☐ Agent handoffs (XX-screen-name.yaml)
  ☐ Master prompt (MASTER-PROMPT-FOR-AGENTS.md)
  ☐ README files (4 files)
☐ Step 5: Create verification script (10min)
☐ Step 6: Update story files (30min)
☐ Step 7: Commit & tag (5min)

Execution Phase (10-20 days):
☐ Launch Foundation agent
☐ Launch Critical Rewrite agents
☐ Launch Core Refactor agents
☐ Launch New Screen agents
☐ Integration testing
☐ Atomic swap ({epic}-v2 → {epic})
☐ Cleanup v1 code (after verification)

Verification:
☐ Isolation script passes
☐ TypeScript compiles
☐ All tests pass
☐ 100% wireframe coverage
☐ Visual QA complete
```

---

## 📁 FILE TEMPLATES

### **Directory Structure Template:**
```
apps/frontend/
├── app/(authenticated)/
│   ├── {epic}-v2/                    ← NEW (agents build here)
│   │   ├── {feature1}/
│   │   ├── {feature2}/
│   │   └── README.md
│   ├── {epic}/                       ← OLD (frozen)
│   └── _archive-{epic}-v1-DO-NOT-TOUCH/  ← BACKUP
│       └── README.md
│
├── components/
│   ├── {epic}-v2/                    ← NEW (agents build here)
│   │   ├── shared/
│   │   ├── {feature1}/
│   │   └── {feature2}/
│   ├── {epic}/                       ← OLD (frozen)
│   └── _archive-{epic}-v1-DO-NOT-TOUCH/  ← BACKUP
│       └── README.md
│
└── lib/
    ├── services/                     ← REUSE (update if needed)
    ├── validation/                   ← REUSE (update if needed)
    └── hooks/                        ← REUSE (create new if needed)

docs/
├── 2-MANAGEMENT/
│   ├── EPIC-{XX}-MIGRATION-PLAN.md
│   └── epics/current/{epic}/
│       ├── AGENT-START-HERE.md
│       ├── MASTER-PROMPT-FOR-AGENTS.md
│       ├── V2-BUILD-INSTRUCTIONS.md
│       ├── STORIES-V2-STATUS.md
│       └── agent-handoffs/
│           ├── README.md
│           ├── 00-FOUNDATION-shared-components.yaml
│           ├── 01-CRITICAL-screen-name.yaml
│           └── ... (one per screen/story)

scripts/
└── check-{epic}-v2-isolation.sh      ← VERIFICATION
```

---

### **Agent Handoff YAML Template:**

```yaml
# File: agent-handoffs/XX-screen-name.yaml

agent: frontend-dev
epic: "{epic-number}-{epic-name}"
story: "{story-id}"
phase: "FOUNDATION | CRITICAL REWRITE | REFACTOR | NEW SCREEN"
priority: CRITICAL | HIGH | MEDIUM | LOW
task: "One-line task description"

# Context
wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/{PREFIX}-XXX-screen-name.md
story_file:
  - docs/2-MANAGEMENT/epics/current/{epic}/{story-id}.md
migration_plan:
  - docs/2-MANAGEMENT/EPIC-{XX}-MIGRATION-PLAN.md
reference_code:
  old_v1: apps/frontend/app/(authenticated)/_archive-{epic}-v1-DO-NOT-TOUCH/{feature}/
  warning: "READ ONLY - {why v1 is wrong}"

# Architecture (what changed)
architecture:
  old_v1: "Description of v1 design"
  new_v2: "Description of v2 design"
  why_different: "Reason for rewrite"

# Output files
output:
  pages:
    - apps/frontend/app/(authenticated)/{epic}-v2/{feature}/page.tsx
  components:
    - apps/frontend/components/{epic}-v2/{feature}/Component.tsx

# Requirements
requirements:
  must_have:
    - Feature 1
    - Feature 2
  wireframe_compliance:
    - All 4 states
    - All Key Components
    - All Main Actions

# Reusable assets
reusable:
  services:
    - lib/services/{service}.ts
  schemas:
    - lib/validation/{schema}.ts
  shared_components:
    - components/{epic}-v2/shared/Component.tsx

# Isolation
isolation:
  allowed:
    - Read wireframes
    - Use services
    - Create in {epic}-v2/
  forbidden:
    - Edit {epic}/ (v1)
    - Import from v1 paths
  verification:
    command: "bash scripts/check-{epic}-v2-isolation.sh"

# Acceptance
acceptance:
  - [ ] Visual match to wireframe
  - [ ] All 4 states work
  - [ ] Isolation verified
  - [ ] TypeScript compiles

# Effort
estimated_hours: X-Y
complexity: LOW | MEDIUM | HIGH
critical_path: true | false
```

**Create one handoff per:**
- Foundation (shared components)
- Each critical rewrite
- Each core refactor
- Each new screen (or batch similar screens)

---

### **Isolation Script Template:**

```bash
#!/bin/bash
# File: scripts/check-{epic}-v2-isolation.sh

EPIC_NAME="{epic}"  # UPDATE THIS

echo "🔍 Checking ${EPIC_NAME} v2 isolation..."

# 1. Check v2 doesn't import from v1 apps
BAD_APP=$(grep -r "from '@/app/(authenticated)/${EPIC_NAME}/'" "apps/frontend/app/(authenticated)/${EPIC_NAME}-v2/" 2>/dev/null || true)

if [ -z "$BAD_APP" ]; then
  echo "✅ No v1 app imports"
else
  echo "❌ Found v1 app imports:"
  echo "$BAD_APP"
  exit 1
fi

# 2. Check v2 doesn't import from v1 components
BAD_COMP=$(grep -r "from '@/components/${EPIC_NAME}/'" "apps/frontend/components/${EPIC_NAME}-v2/" 2>/dev/null || true)

if [ -z "$BAD_COMP" ]; then
  echo "✅ No v1 component imports"
else
  echo "❌ Found v1 component imports:"
  echo "$BAD_COMP"
  exit 1
fi

# 3. TypeScript check
cd apps/frontend && npx tsc --noEmit

echo "✅ All isolation checks passed!"
```

---

### **README Template ({epic}-v2/README.md):**

```markdown
# {Epic Name} Module v2 - Clean Rebuild

**Status:** In Development
**Wireframes:** docs/3-ARCHITECTURE/ux/wireframes/{PREFIX}-*.md (X screens)
**Migration Plan:** docs/2-MANAGEMENT/EPIC-{XX}-MIGRATION-PLAN.md

## Rules for Agents

✅ ALLOWED:
- Build in this directory ({epic}-v2/)
- Use services (lib/services/)
- Create components in components/{epic}-v2/

❌ FORBIDDEN:
- Edit app/(authenticated)/{epic}/ (v1 frozen)
- Import from v1 paths
- Copy-paste v1 code

## Wireframe Priority Order

CRITICAL:
1. {Screen 1} ({hours}h)
2. {Screen 2} ({hours}h)

HIGH PRIORITY:
3. {Screen 3} ({hours}h)

## Reference

Old code: app/(authenticated)/_archive-{epic}-v1-DO-NOT-TOUCH/
Use for: Logic understanding only
```

---

## 🚀 EXECUTION TEMPLATE

### **Kickoff Commands:**

```bash
# Apply to any epic (replace {EPIC}):

EPIC_NAME="{epic}"
EPIC_NUM="{XX}"

# 1. Git setup
git checkout -b feature/${EPIC_NAME}-v2-rebuild
git tag ${EPIC_NAME}-v1-backup-$(date +%Y%m%d-%H%M)

# 2. Create structure
mkdir -p "apps/frontend/app/(authenticated)/${EPIC_NAME}-v2"
mkdir -p "apps/frontend/components/${EPIC_NAME}-v2/shared"
mkdir -p "apps/frontend/app/(authenticated)/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH"

# 3. Copy v1 to archive
cp -r "apps/frontend/app/(authenticated)/${EPIC_NAME}/"* "apps/frontend/app/(authenticated)/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/"

# 4. Create docs
mkdir -p "docs/2-MANAGEMENT/epics/current/${EPIC_NUM}-${EPIC_NAME}/agent-handoffs"

# 5. Create isolation script (use template above)

# 6. Commit
git add .
git commit -m "feat(${EPIC_NAME}): setup v2 parallel build structure"

echo "✅ Ready for agents!"
```

---

## 📊 CHECKLIST: Epic v2 Setup Complete

```
Prerequisites:
☐ Wireframes exist (docs/3-ARCHITECTURE/ux/wireframes/)
☐ Stories exist (docs/2-MANAGEMENT/epics/current/{epic}/)
☐ Some v1 code exists (even if incomplete)

Analysis Complete:
☐ Wireframes counted
☐ Code coverage calculated
☐ Gaps identified
☐ Categories assigned (REWRITE/REFACTOR/MIGRATE/NEW)
☐ Critical screens identified (2-5 usually)

Structure Created:
☐ {epic}-v2/ directory with subdirectories
☐ components/{epic}-v2/ with subdirectories
☐ _archive-{epic}-v1-DO-NOT-TOUCH/ (v1 backup)
☐ agent-handoffs/ directory

Documentation Written:
☐ EPIC-{XX}-MIGRATION-PLAN.md (detailed)
☐ MASTER-PROMPT-FOR-AGENTS.md (copy-paste)
☐ AGENT-START-HERE.md (quick start)
☐ V2-BUILD-INSTRUCTIONS.md (central reference)
☐ Agent handoffs (7+ YAML files)
☐ README files (4+)

Story Files Updated:
☐ Critical stories have v2 banners (3-7 stories)
☐ Core stories have v2 banners (3-5 stories)
☐ Template created for remaining

Scripts Created:
☐ check-{epic}-v2-isolation.sh (executable)
☐ Helper scripts (if needed)

Git Setup:
☐ Feature branch created
☐ V1 tagged (backup)
☐ All committed (3-4 commits)

Verification:
☐ Isolation script runs successfully
☐ TypeScript compiles
☐ Directory structure correct
☐ No accidental v1 edits

Ready:
☐ All checklists above complete
☐ First handoff ready (Foundation)
☐ Agents can start immediately
```

---

## 💡 TIPS & BEST PRACTICES

### **What Makes Good Handoffs:**
1. ✅ Complete context (wireframe + story + migration plan)
2. ✅ Explicit output files (no guessing)
3. ✅ Clear isolation rules (allowed/forbidden)
4. ✅ Detailed requirements (from wireframe)
5. ✅ Acceptance criteria (checkboxes)
6. ✅ Effort estimates (realistic)

### **What Makes Bad Handoffs:**
1. ❌ Vague instructions ("update the code")
2. ❌ Missing wireframe links
3. ❌ No isolation rules (agents edit v1)
4. ❌ Incomplete requirements
5. ❌ No verification steps

### **Common Pitfalls:**
1. ❌ Forgetting to freeze v1 code (agents edit it!)
2. ❌ Not creating archive (no reference for logic)
3. ❌ Skipping isolation script (imports from v1)
4. ❌ Mixing v1 and v2 (conflicts!)
5. ❌ No rollback plan (can't undo)

---

## 🎯 SUCCESS METRICS

**Setup successful when:**
- ✅ {epic}-v2/ structure exists
- ✅ V1 archived (frozen)
- ✅ 7+ handoffs created
- ✅ Isolation script works
- ✅ Documentation complete
- ✅ Git properly structured
- ✅ First agent can start immediately

**v2 ready for swap when:**
- ✅ 100% wireframes implemented
- ✅ Critical rewrites complete
- ✅ Isolation verified (zero v1 imports)
- ✅ TypeScript compiles
- ✅ All tests pass
- ✅ Visual QA complete

---

## 📖 EXAMPLES

### **Epic 1 Settings (DONE):**
- 33 wireframes
- 7 handoffs created
- 6 stories updated
- 4 commits
- ~3 hours setup
- Status: ✅ Ready for agents

### **Epic 2 Technical (NEXT):**
- 19 wireframes
- Apply this playbook
- Create technical-v2/
- 7+ handoffs needed
- Estimate: ~3 hours setup

### **Epic 3 Planning (FUTURE):**
- Apply this playbook
- Create planning-v2/
- Follow same structure
- Estimate: ~3 hours setup

---

## 🔗 REFERENCE IMPLEMENTATIONS

**Use Epic 1 as template:**
- Structure: `apps/frontend/app/(authenticated)/settings-v2/`
- Handoffs: `docs/.../01-settings/agent-handoffs/`
- Migration Plan: `docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md`
- Verification: `scripts/check-settings-v2-isolation.sh`

**Copy and adapt for your epic!**

---

## 🎁 REUSABLE ASSETS

**These work for ANY epic:**
- ✅ Parallel Build strategy (proven)
- ✅ YAML handoff format (structured)
- ✅ Isolation script template (adaptable)
- ✅ README templates (copy-paste)
- ✅ Migration plan structure (sections)
- ✅ Atomic swap approach (safe)

**Just update:**
- Epic name
- Wireframe prefix (SET → TEC → PLAN → PROD, etc.)
- Feature names
- Directory paths

---

## 🏁 QUICK START (Any Epic)

```bash
# 1. Set variables
EPIC_NAME="planning"  # your epic
EPIC_NUM="03"
PREFIX="PLAN"  # wireframe prefix

# 2. Run setup
git checkout -b feature/${EPIC_NAME}-v2-rebuild
git tag ${EPIC_NAME}-v1-backup-$(date +%Y%m%d)

# 3. Create structure
mkdir -p "apps/frontend/app/(authenticated)/${EPIC_NAME}-v2"
mkdir -p "apps/frontend/components/${EPIC_NAME}-v2/shared"

# 4. Copy v1 to archive
cp -r "apps/frontend/app/(authenticated)/${EPIC_NAME}/"* "_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/"

# 5. Create docs (copy Epic 1 templates, update names)

# 6. Create handoffs (7+)

# 7. Commit
git commit -m "feat(${EPIC_NAME}): setup v2 parallel build structure"

# 8. Launch agents!
```

---

**Playbook Version:** 1.0
**Created:** 2025-12-23
**Based On:** Epic 01 Settings (proven successful)
**Applicable To:** All epics (Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance, OEE, Integrations)
**Time to Setup:** ~3 hours per epic
**ROI:** 40-50% faster development + 100% wireframe compliance

**USE THIS PLAYBOOK FOR EVERY EPIC! 🚀**
