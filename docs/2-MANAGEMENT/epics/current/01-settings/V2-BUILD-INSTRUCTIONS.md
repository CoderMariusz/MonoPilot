# 🚧 V2 BUILD INSTRUCTIONS - Epic 01 Settings

**READ THIS BEFORE STARTING ANY STORY IN EPIC 01**

---

## ⚠️ CRITICAL: We're Rebuilding Settings in v2

**All Epic 01 stories must be built in `settings-v2/` directory (parallel build strategy)**

### **Why?**
- V1 code is 52% incomplete (17/33 wireframes)
- V1 has wrong architectures (Locations: flat→tree, Allergens: read-only→CRUD)
- Clean rebuild prevents conflicts and ensures 100% wireframe compliance

---

## 📁 WHERE TO BUILD

### **✅ CREATE CODE HERE (v2):**
```
apps/frontend/
├── app/(authenticated)/settings-v2/{your-feature}/     ← YOUR PAGES
├── components/settings-v2/{your-feature}/              ← YOUR COMPONENTS
└── lib/
    ├── services/ (update if needed)
    ├── validation/ (update if needed)
    └── hooks/ (create new if needed)
```

### **❌ DO NOT TOUCH (v1 frozen):**
```
apps/frontend/
├── app/(authenticated)/settings/{your-feature}/        ← V1 FROZEN (read-only reference)
├── components/settings/{your-feature}/                 ← V1 FROZEN (read-only reference)
└── _archive-settings-v1-DO-NOT-TOUCH/                  ← ARCHIVE (read-only reference)
```

---

## 🎯 YOUR STORY-SPECIFIC HANDOFF

Each story has a ready-to-use handoff file with ALL details:

```
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/
├── 00-FOUNDATION-shared-components.yaml       (Foundation - do first!)
├── 01-CRITICAL-locations-tree-rewrite.yaml    (Story 01.9)
├── 02-CRITICAL-allergens-custom-rewrite.yaml  (Story 01.12)
├── 03-CRITICAL-tax-codes-effective-dates.yaml (Story 01.13)
├── 04-users-actions-menu.yaml                 (Story 01.5a)
├── 05-machines-2nd-row-maintenance.yaml       (Story 01.10)
└── 06-production-lines-machine-flow.yaml      (Story 01.11)

(More handoffs available or will be created as needed)
```

**Find your story's handoff and read it COMPLETELY before starting!**

---

## 📖 MUST-READ DOCUMENTS

### **1. Master Prompt (Copy-Paste Ready):**
```
docs/2-MANAGEMENT/epics/current/01-settings/MASTER-PROMPT-FOR-AGENTS.md
└─ Universal instructions for all agents
```

### **2. Migration Plan (Detailed Strategy):**
```
docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md
└─ Complete plan: why parallel build, timeline, rollback
```

### **3. Agent Start Guide (Quick Start):**
```
docs/2-MANAGEMENT/epics/current/01-settings/AGENT-START-HERE.md
└─ Quick reference
```

---

## 🛡️ ISOLATION RULES (UNIVERSAL)

### **✅ ALLOWED:**
- Read wireframes: `docs/3-ARCHITECTURE/ux/wireframes/SET-*.md`
- Read story files: `docs/2-MANAGEMENT/epics/current/01-settings/*.md`
- Use services: `lib/services/*.ts` (reuse or update)
- Use schemas: `lib/validation/*.ts` (verify vs wireframe, update if needed)
- Use hooks: `lib/hooks/*.ts` (reuse or create new)
- Create pages: `app/(authenticated)/settings-v2/`
- Create components: `components/settings-v2/`
- Reference v1 code: FOR LOGIC ONLY (API patterns, error handling)

### **❌ FORBIDDEN:**
- Edit files in: `app/(authenticated)/settings/` (v1 frozen)
- Edit files in: `components/settings/` (v1 frozen)
- Import from: `@/app/(authenticated)/settings/*` (v1 paths)
- Import from: `@/components/settings/*` (v1 paths - use `settings-v2/`)
- Copy-paste v1 UI code (rebuild from wireframe!)
- Touch files in: `_archive-settings-v1-DO-NOT-TOUCH/` (read-only archive)

---

## ✅ VERIFICATION (After Each Story)

**Always run after completing a story:**
```bash
bash scripts/check-settings-v2-isolation.sh
```

**Expected output:**
```
✅ No v1 app imports found
✅ No v1 component imports found
✅ TypeScript compiles successfully
✅ All isolation checks passed!
```

---

## 🎯 STORY-SPECIFIC INSTRUCTIONS

### **Each story has unique requirements. Check your story below:**

#### **01.9 - Locations (CRITICAL REWRITE)**
- Handoff: `01-CRITICAL-locations-tree-rewrite.yaml`
- Why: V1 is flat table, v2 needs tree view (Zone > Aisle > Rack > Bin)
- Effort: 14-16h (LONGEST)

#### **01.12 - Allergens (CRITICAL REWRITE)**
- Handoff: `02-CRITICAL-allergens-custom-rewrite.yaml`
- Why: V1 is read-only, v2 needs custom CRUD + multi-language
- Effort: 10-12h

#### **01.13 - Tax Codes (CRITICAL ADD DATES)**
- Handoff: `03-CRITICAL-tax-codes-effective-dates.yaml`
- Why: V1 missing effective_from/to (FR-SET-083)
- Effort: 8-10h

#### **01.5a - Users (REFACTOR)**
- Handoff: `04-users-actions-menu.yaml`
- Keep: Tabs (good v1 feature)
- Add: Actions menu [⋮], 10 PRD roles
- Effort: 8-10h

#### **01.10 - Machines (REFACTOR)**
- Handoff: `05-machines-2nd-row-maintenance.yaml`
- Add: 2nd row details, Maintenance actions
- Effort: 8-10h

#### **01.11 - Production Lines (REFACTOR)**
- Handoff: `06-production-lines-machine-flow.yaml`
- Add: Machine flow visualization (2nd row)
- Effort: 8-10h

#### **01.8 - Warehouses (MINOR MIGRATION)**
- Can migrate v1 components (85% compliant)
- Add: Activity Log panel
- Effort: 3-4h

#### **Other Stories:**
- Check `agent-handoffs/` directory for handoff file
- If no handoff yet, it will be created when needed

---

## 🔑 KEY POINTS

1. **Build from wireframes** (not from old code)
2. **V1 code is reference only** (for logic, not UI)
3. **Use settings-v2/ paths** (not settings/)
4. **Run isolation check** after each story
5. **Read your handoff file** completely before starting

---

## 🚀 READY TO START?

### **Step 1:** Read this file ✅ (you're here!)
### **Step 2:** Read `MASTER-PROMPT-FOR-AGENTS.md`
### **Step 3:** Find your story's handoff YAML file
### **Step 4:** Build in `settings-v2/` only
### **Step 5:** Verify with isolation script

---

**Migration Strategy:** Parallel Build → Atomic Swap
**Timeline:** ~15 days (1 agent) or ~15 days (3 agents parallel)
**Current Status:** Phase 0 complete, ready for Phase 1 (Foundation)

---

**Questions?** Read `EPIC-01-MIGRATION-PLAN.md` for full details
