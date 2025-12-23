# 🎯 MASTER PROMPT - Settings v2 Rebuild (Epic 01)

**Copy-paste this to agents starting work on Settings module**

---

## 📋 YOUR MISSION

You are rebuilding the Settings module (Epic 01) using **Parallel Build → Atomic Swap** strategy.

**Key Points:**
- Build NEW code in `settings/` directory
- OLD code in `settings/` is FROZEN (read-only reference)
- Build from WIREFRAMES (not from old code)
- Verify isolation after each file

---

## 📁 FILE STRUCTURE

### **Where You Work:**
```
✅ CREATE HERE:
apps/frontend/
├── app/(authenticated)/settings/          ← YOUR PAGES
├── components/settings/                   ← YOUR COMPONENTS
└── lib/
    ├── services/ (update if needed)
    ├── validation/ (update if needed)
    └── hooks/ (create new if needed)
```

### **Where You DON'T Touch:**
```
❌ DO NOT EDIT:
apps/frontend/
├── app/(authenticated)/settings/             ← V1 FROZEN
├── components/settings/                      ← V1 FROZEN
└── app/(authenticated)/settings (reference only)/  ← READ ONLY
```

---

## 🎯 YOUR HANDOFF FILE

**Find your task here:**
```
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/
├── 00-FOUNDATION-shared-components.yaml      ← If you're building Foundation
├── 01-CRITICAL-locations-tree-rewrite.yaml   ← If you're building Locations
├── 02-CRITICAL-allergens-custom-rewrite.yaml ← If you're building Allergens
├── 03-CRITICAL-tax-codes-effective-dates.yaml ← If you're building Tax Codes
├── 04-users-actions-menu.yaml                ← If you're building Users
├── 05-machines-2nd-row-maintenance.yaml      ← If you're building Machines
└── 06-production-lines-machine-flow.yaml     ← If you're building Production Lines
```

**Read your assigned handoff file COMPLETELY before starting.**

---

## 🛡️ ISOLATION RULES (CRITICAL!)

### **✅ YOU CAN:**
- ✅ Read wireframes (SET-*.md files)
- ✅ Read story files (docs/2-MANAGEMENT/epics/current/01-settings/*.md)
- ✅ Use services (lib/services/*.ts) - reuse or update
- ✅ Use schemas (lib/validation/*.ts) - verify vs wireframe, update if needed
- ✅ Create pages in `settings/`
- ✅ Create components in `settings/`
- ✅ Reference v1 code FOR LOGIC ONLY (understand API calls, error handling)

### **❌ YOU CANNOT:**
- ❌ Edit files in `app/(authenticated)/settings/` (v1 frozen)
- ❌ Edit files in `components/settings/` (v1 frozen)
- ❌ Import from `@/app/(authenticated)/settings/*` (v1 paths)
- ❌ Import from `@/components/settings/*` (v1 component paths)
- ❌ Copy-paste v1 UI code (rebuild from wireframe!)
- ❌ Edit files in `settings (reference only)/`

---

## 📖 WHAT TO READ (In Order)

### **1. Your Handoff File (YAML)**
```bash
# Example for Locations:
cat docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/01-CRITICAL-locations-tree-rewrite.yaml

# Contains:
# - Task description
# - Wireframes to read
# - Output files to create
# - Requirements (detailed)
# - Reusable assets
# - Acceptance criteria
# - Effort estimate
```

### **2. Assigned Wireframe(s)**
```bash
# Example for Locations:
cat docs/3-ARCHITECTURE/ux/wireframes/SET-014-location-hierarchy-view.md

# Contains:
# - ASCII wireframes (4 states: Loading, Success, Empty, Error)
# - Key Components list
# - Main Actions
# - Data Fields table
# - Permissions matrix
# - Validation rules
# - Technical notes
```

### **3. Story File (If Referenced)**
```bash
# Example:
cat docs/2-MANAGEMENT/epics/current/01-settings/01.9.locations-hierarchy.md

# Contains:
# - Acceptance Criteria (Given/When/Then)
# - Business requirements
# - Dependencies
```

### **4. (Optional) Reference V1 Code**
```bash
# Example for Locations:
cat apps/frontend/app/\(authenticated\)/settings (reference only)/locations/page.tsx

# Use for:
# - Understanding API endpoint patterns
# - Error handling logic
# - Service integration

# DO NOT:
# - Copy UI code (it's wrong architecture!)
# - Import from this path
# - Use as implementation guide (wireframe is the spec!)
```

---

## 🏗️ HOW TO BUILD

### **Step 1: Read Wireframe First**
```
Open wireframe and understand:
- What the screen looks like (ASCII art)
- What components are needed (Key Components section)
- What actions are available (Main Actions section)
- What data is displayed (Data Fields table)
- All 4 states (Loading, Success, Empty, Error)

BUILD FROM THIS (not from old code!)
```

### **Step 2: Check Reusable Assets**
```typescript
// Your handoff YAML lists reusable assets

// Example from Locations handoff:
reusable:
  services:
    - lib/services/location-service.ts (may need new methods)
  schemas:
    - lib/validation/location-schemas.ts (MUST UPDATE types)
  shared:
    - settings/shared/ActionsMenu.tsx
    - settings/shared/StatusBadge.tsx

// Check if they exist:
ls lib/services/location-service.ts
ls lib/validation/location-schemas.ts

// If schema needs update (per handoff) → update it first
```

### **Step 3: Build Components**
```typescript
// Follow output files list from handoff

// Example for Locations (from handoff):
output:
  pages:
    - settings/locations/page.tsx

  components:
    - components/settings/locations/LocationTreeView.tsx
    - components/settings/locations/LocationTreeNode.tsx
    - components/settings/locations/LocationModal.tsx
    // ... etc

// Create each file according to wireframe specs
// Use shared components from settings/shared/
```

### **Step 4: Implement All 4 States**
```typescript
// Every screen must have:

// Loading state (skeleton)
if (isLoading) {
  return <LoadingState rows={3} columns={5} />
}

// Error state (retry + support)
if (error) {
  return <ErrorState error={error} onRetry={refetch} />
}

// Empty state (illustration + CTA)
if (data.length === 0) {
  return <EmptyState
    icon={Warehouse}
    title="No Warehouses Found"
    action={{ label: "Add First Warehouse", onClick: handleCreate }}
  />
}

// Success state (table with data)
return <DataTableWithDetails ... />
```

### **Step 5: Verify Isolation**
```bash
# After creating files, run:
bash scripts/check-settings-isolation.sh

# Should pass all checks:
# ✅ No v1 imports
# ✅ TypeScript compiles
# ✅ No forbidden imports
```

---

## ✅ ACCEPTANCE CHECKLIST

### **Before Marking Task Complete:**

```
Visual:
  ☐ Rendered UI matches wireframe ASCII art (side-by-side comparison)
  ☐ All components from "Key Components" section present
  ☐ All actions from "Main Actions" section work
  ☐ All data fields from table displayed correctly

Functionality:
  ☐ All acceptance criteria from handoff YAML pass
  ☐ All acceptance criteria from story file pass (if applicable)
  ☐ Search works (if applicable)
  ☐ Filters work (if applicable)
  ☐ Pagination works (if applicable)
  ☐ Actions menu [⋮] has correct options

States:
  ☐ Loading state shows skeleton loaders
  ☐ Success state shows data table
  ☐ Empty state shows illustration + CTA
  ☐ Error state shows retry + support buttons

Isolation:
  ☐ Zero imports from v1 code (verified with script)
  ☐ Only imports from allowed paths (lib/*, settings/*, ui/*)
  ☐ TypeScript compiles with zero errors
  ☐ No console errors in browser

Testing:
  ☐ Manual testing checklist from handoff passed
  ☐ All 4 states tested manually
  ☐ Responsive design works (mobile, tablet, desktop)
  ☐ Keyboard navigation works
  ☐ Screen reader announcements correct (if specified)
```

---

## 🚨 CRITICAL SCREENS (Extra Attention)

### **Locations Tree (Handoff 01):**
- ⚠️ V1 code is FLAT TABLE (completely wrong!)
- ✅ V2 must be TREE VIEW (Zone > Aisle > Rack > Bin)
- 🎯 This is the HARDEST rewrite - validates parallel build approach
- ⏱️ 14-16 hours estimated

### **Allergens Custom (Handoff 02):**
- ⚠️ V1 code is READ-ONLY (AllergenReadOnlyBanner)
- ✅ V2 must support CUSTOM CRUD + Multi-language
- 🎯 Completely new architecture
- ⏱️ 10-12 hours estimated

### **Tax Codes Dates (Handoff 03):**
- ⚠️ V1 missing effective_from/to fields entirely
- ✅ V2 must have date range + expiration indicators (✓, ⏰, ⌛)
- 🎯 FR-SET-083 compliance requirement
- ⏱️ 8-10 hours estimated

---

## 💡 PRO TIPS

### **1. Wireframe is the Spec**
- Old code may be wrong or incomplete
- Wireframe is the source of truth
- When in doubt, follow wireframe

### **2. Shared Components First**
- Foundation handoff (00) must complete before others
- All other screens depend on shared components
- Don't duplicate code (use shared/)

### **3. Test Early, Test Often**
- Run isolation check after each file created
- Test each state as you build it
- Don't wait until end to test

### **4. Document Deviations**
- If you keep good v1 feature (e.g., Tabs) → document in PR
- If wireframe unclear → ask before building
- If old code has better UX → discuss (don't assume)

### **5. One Screen at a Time**
- Don't mix multiple wireframes
- Complete one handoff fully before next
- Create PR per screen

---

## 🎬 START COMMAND

### **For Foundation Agent:**
```bash
# You are building the foundation - all other agents depend on you!

# 1. Read handoff
cat docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml

# 2. Read reference wireframe
cat docs/3-ARCHITECTURE/ux/wireframes/SET-012-warehouse-list.md  # Best example

# 3. Create 9 components in:
# apps/frontend/components/settings/shared/

# 4. Verify
bash scripts/check-settings-isolation.sh

# 5. Create PR:
# Title: "feat(settings): create shared components (Foundation)"
# Branch: feature/set-v2-00-foundation
```

### **For Locations Agent:**
```bash
# You are building the HARDEST screen - validates entire approach!

# 1. Read handoff
cat docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/01-CRITICAL-locations-tree-rewrite.yaml

# 2. Read wireframes
cat docs/3-ARCHITECTURE/ux/wireframes/SET-014-location-hierarchy-view.md
cat docs/3-ARCHITECTURE/ux/wireframes/SET-015-location-create-edit-modal.md

# 3. (Optional) Reference v1 for API patterns only
cat apps/frontend/app/\(authenticated\)/settings (reference only)/locations/page.tsx
# NOTE: V1 has FLAT TABLE (wrong!) - DO NOT copy UI code

# 4. Update schema first
# Edit: lib/validation/location-schemas.ts
# Change types: Zone, Aisle, Rack, Bin, Shelf, Bulk Storage

# 5. Build tree components
# Create: components/settings/locations/LocationTreeView.tsx (recursive)

# 6. Test tree rendering
# Create test: Zone > Aisle > Rack > Bin
# Verify expand/collapse, hierarchy validation

# 7. Verify isolation
bash scripts/check-settings-isolation.sh

# Estimated: 14-16 hours (longest in Epic 1)
```

---

## 📊 SUCCESS METRICS

**Your screen is done when:**
- ✅ Matches wireframe ASCII art 95%+
- ✅ All acceptance criteria pass
- ✅ All 4 states implemented
- ✅ Isolation verified (zero v1 imports)
- ✅ TypeScript compiles
- ✅ Manual testing complete

**Then: Create PR and move to next handoff**

---

**Created:** 2025-12-23
**Branch:** `feature/settings-rebuild`
**Strategy:** Parallel Build → Atomic Swap
**Handoffs:** 7 ready (more will be created)
**Status:** Ready for Agent Execution

**GO BUILD! 🚀**
