# 🚀 EPIC 01 SETTINGS - AGENT START GUIDE

**Epic:** 01 - Settings Module v2 Rebuild
**Status:** ✅ Ready for Agents
**Branch:** `feature/settings-rebuild`
**Created:** 2025-12-23

---

## 📍 QUICK START

### **For First Agent (Foundation):**

```bash
# 1. Verify you're on correct branch
git branch --show-current
# Should show: feature/settings-rebuild

# 2. Read your handoff file
cat docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml

# 3. Start building
# Create 9 shared components in:
# apps/frontend/components/settings/shared/

# 4. Verify isolation after completion
bash scripts/check-settings-isolation.sh
```

---

## 📋 AGENT HANDOFF FILES

All prompts ready in:
```
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/
├── README.md (index of all handoffs)
├── 00-FOUNDATION-shared-components.yaml ← START HERE
├── 01-CRITICAL-locations-tree-rewrite.yaml (do after Foundation)
├── 02-CRITICAL-allergens-custom-rewrite.yaml
├── 03-CRITICAL-tax-codes-effective-dates.yaml
├── 04-users-actions-menu.yaml
├── 05-machines-2nd-row-maintenance.yaml
└── 06-production-lines-machine-flow.yaml

(More handoffs will be created as needed)
```

---

## 🎯 EXECUTION SEQUENCE

### **Phase 1: Foundation (Day 1)**
```
Agent: FRONTEND-DEV
Handoff: 00-FOUNDATION-shared-components.yaml
Output: 9 shared components
Blocks: All other work
Effort: 6-8 hours
```

### **Phase 2: Critical Rewrites (Day 2-5)**
```
Agent: FRONTEND-DEV
Handoff: 01-CRITICAL-locations-tree-rewrite.yaml
Output: Location tree view (Zone > Aisle > Rack > Bin)
Effort: 14-16 hours
Priority: HIGHEST (validates parallel build approach)

Agent: FRONTEND-DEV
Handoff: 02-CRITICAL-allergens-custom-rewrite.yaml
Output: Allergen management (custom + multi-language)
Effort: 10-12 hours
Priority: HIGHEST

Agent: FRONTEND-DEV
Handoff: 03-CRITICAL-tax-codes-effective-dates.yaml
Output: Tax codes with effective dates
Effort: 8-10 hours
Priority: HIGH
```

### **Phase 3: Core Refactors (Day 6-8)**
```
Agent: FRONTEND-DEV
Handoffs: 04, 05, 06 (Users, Machines, Production Lines)
Effort: 8-10 hours each
Can be parallelized
```

---

## 🛡️ UNIVERSAL RULES (ALL AGENTS READ THIS)

### **✅ ALLOWED:**
```yaml
Read:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-*.md
  - docs/2-MANAGEMENT/epics/current/01-settings/*.md
  - apps/frontend/app/(authenticated)/settings (reference only)/* (REFERENCE ONLY)

Use:
  - lib/services/*-service.ts (reuse/update)
  - lib/validation/*-schemas.ts (verify/update)
  - lib/hooks/* (reuse/create)

Create:
  - apps/frontend/app/(authenticated)/settings/*
  - apps/frontend/components/settings/*
```

### **❌ FORBIDDEN:**
```yaml
Do NOT:
  - Edit: app/(authenticated)/settings/* (v1 frozen)
  - Edit: components/settings/* (v1 frozen)
  - Import from: @/app/(authenticated)/settings/*
  - Import from: @/components/settings/* (use settings/)
  - Copy-paste v1 UI code
  - Touch: settings (reference only)/* (except reading)
```

### **⚠️ VERIFICATION (After Each Screen):**
```bash
# Run this after completing each handoff:
bash scripts/check-settings-isolation.sh

# Should output:
# ✅ No v1 app imports found
# ✅ No v1 component imports found
# ✅ TypeScript compiles successfully
```

---

## 📖 KEY DOCUMENTS

### **Must Read:**
   - Overall strategy
   - Why parallel build
   - Complete timeline

2. **Your Handoff File:** `agent-handoffs/XX-your-task.yaml`
   - Specific requirements
   - Output files
   - Acceptance criteria

3. **Wireframe(s):** `docs/3-ARCHITECTURE/ux/wireframes/SET-XXX.md`
   - Visual spec (ASCII wireframes)
   - All 4 states
   - Field definitions

### **Optional Reference:**
4. **Old Code:** `app/(authenticated)/settings (reference only)/`
   - FOR LOGIC UNDERSTANDING ONLY
   - DO NOT COPY UI CODE
   - Read API patterns, error handling

---

## 🎯 YOUR WORKFLOW

### **Step-by-Step:**

```
1. Read your handoff YAML file completely
   ├─ Understand requirements
   ├─ Note output files
   └─ Check reusable assets

2. Read assigned wireframe(s)
   ├─ Study ASCII wireframes for all 4 states
   ├─ Note Key Components section
   └─ Check Data Fields table

3. (Optional) Reference old code
   ├─ Only for logic understanding
   ├─ Note API endpoint patterns
   ├─ Note error handling
   └─ DO NOT copy UI code

4. Build in settings/
   ├─ Create page in app/(authenticated)/settings/
   ├─ Create components in components/settings/
   ├─ Use shared components
   └─ Follow wireframe exactly

5. Test
   ├─ All 4 states work (Loading, Success, Empty, Error)
   ├─ TypeScript compiles (npx tsc --noEmit)
   ├─ Import audit passes (check script)
   └─ Manual testing per handoff checklist

6. Create PR
   ├─ Branch: feature/set-v2-SET-XXX-screen-name
   ├─ Title: "feat(settings): implement SET-XXX [screen name]"
   ├─ Description: Link to wireframe + handoff file
   └─ Checklist: All acceptance criteria checked
```

---

## 🔍 DEBUGGING COMMON ISSUES

### **Issue: "Cannot import from v1 code"**
```
Error: import { WarehouseModal } from '@/components/settings/warehouses'

Fix:
- Use: import { WarehouseModal } from '@/components/settings/warehouses'
- Or rebuild component in settings/
```

### **Issue: "Wireframe doesn't match old code"**
```
Situation: Old code has tabs, wireframe doesn't

Decision Tree:
- Is v1 feature better UX? → Keep it (document in PR)
- Is v1 feature off-spec? → Follow wireframe exactly
- Unsure? → Ask in PR comments
```

### **Issue: "Service doesn't have method I need"**
```
Example: location-service.ts doesn't have getLocationTree()

Fix:
- Add method to existing service
- Document in PR: "Added getLocationTree() for tree view support"
```

---

## 📊 PROGRESS TRACKING

### **Check Status:**
```bash
# How many screens completed?
ls apps/frontend/app/\(authenticated\)/settings/ -d */ | wc -l

# Run isolation check
bash scripts/check-settings-isolation.sh

# Check TypeScript
cd apps/frontend && npx tsc --noEmit
```

### **Completion Checklist:**
```
Foundation:
  ☐ Shared components (9 files)

Critical Rewrites:
  ☐ Locations tree
  ☐ Allergens custom
  ☐ Tax codes dates

Core Refactors:
  ☐ Users
  ☐ Warehouses
  ☐ Machines
  ☐ Production Lines
  ☐ Modules
  ☐ Organization

New Screens (10):
  ☐ Roles & Permissions
  ☐ API Keys
  ☐ Webhooks
  ☐ Audit Logs
  ☐ Security
  ☐ Notifications
  ☐ Billing
  ☐ Import/Export
  ☐ Sessions
  ☐ Password

Verify Existing:
  ☐ Onboarding wizard

Total: 0/20 handoffs complete
```

---

## 🚨 CRITICAL SUCCESS FACTORS

### **1. Isolation**
- NEVER import from v1 code
- ALWAYS verify with isolation script
- Keep v1 frozen (read-only)

### **2. Wireframe Fidelity**
- Build from wireframe (not from old code)
- Match ASCII wireframes exactly
- Include all 4 states

### **3. Reuse Smart**
- Services: 100% reuse (update as needed)
- Schemas: Verify vs wireframe, update if needed
- Components: Only migrate if 95%+ compliant

### **4. Test Thoroughly**
- Manual testing per handoff checklist
- TypeScript compilation
- Import audit
- All 4 states render

---

## 📞 HELP & SUPPORT

### **Questions?**
- Check: Your handoff YAML file
- Review: Wireframe (SET-XXX.md)

### **Stuck?**
- Reference old code (logic only)
- Check shared components (use them!)
- Ask orchestrator agent

### **Before Creating PR:**
```bash
# Run full verification:
bash scripts/check-settings-isolation.sh
cd apps/frontend && npx tsc --noEmit
npm run test -- your-screen-name
```

---

## 🎬 READY TO START?

### **First Agent Task:**
```
Read: docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml

Build: 9 shared components in components/settings/shared/

Verify: bash scripts/check-settings-isolation.sh

Estimated: 6-8 hours

GO! 🚀
```

---

**Setup Complete:** ✅
**V1 Archived:** ✅
**V2 Structure Ready:** ✅
**Handoffs Created:** 7 files
**Isolation Enforced:** ✅
**Ready for Execution:** ✅

**Next Step:** Launch FRONTEND-DEV agent with handoff 00-FOUNDATION
