# Epic 01 Stories - V2 Migration Status

**Last Updated:** 2025-12-23
**Total Stories:** 16+ (01.1 to 01.16+)
**V2 Ready:** 6 stories with migration banners
**Status:** Ready for agent execution

---

## ✅ STORIES WITH V2 MIGRATION BANNERS

### **Critical Rewrites (MUST DO EARLY):**
```
✅ 01.9 - Locations CRUD
   ├─ Banner: ✅ Added (CRITICAL REWRITE)
   ├─ Handoff: 01-CRITICAL-locations-tree-rewrite.yaml
   ├─ Why: Flat table → Tree view (Zone > Aisle > Rack > Bin)
   └─ Effort: 14-16h

✅ 01.12 - Allergens Management
   ├─ Banner: ✅ Added (CRITICAL REWRITE)
   ├─ Handoff: 02-CRITICAL-allergens-custom-rewrite.yaml
   ├─ Why: Read-only → Custom CRUD + Multi-language
   └─ Effort: 10-12h

✅ 01.13 - Tax Codes CRUD
   ├─ Banner: ✅ Added (ADD EFFECTIVE DATES)
   ├─ Handoff: 03-CRITICAL-tax-codes-effective-dates.yaml
   ├─ Why: Missing effective_from/to (FR-SET-083)
   └─ Effort: 8-10h
```

### **Core Refactors:**
```
✅ 01.5a - User Management CRUD
   ├─ Banner: ✅ Added (REFACTOR)
   ├─ Handoff: 04-users-actions-menu.yaml
   ├─ Change: Inline buttons → Actions menu [⋮]
   └─ Effort: 8-10h

✅ 01.10 - Machines CRUD
   ├─ Banner: ✅ Added (ADD 2ND ROW)
   ├─ Handoff: 05-machines-2nd-row-maintenance.yaml
   ├─ Add: 2nd row details, Maintenance actions
   └─ Effort: 8-10h

✅ 01.11 - Production Lines CRUD
   ├─ Banner: ✅ Added (ADD MACHINE FLOW)
   ├─ Handoff: 06-production-lines-machine-flow.yaml
   ├─ Add: Machine flow visualization (2nd row)
   └─ Effort: 8-10h
```

---

## ⏳ STORIES NEEDING BANNERS

### **Option A: Add Custom Banner (for stories with specific handoffs):**

Already done for 6 stories above.

### **Option B: Reference V2-BUILD-INSTRUCTIONS.md (for remaining stories):**

```
Stories that can reference central instructions:
├── 01.1 (Org Context - backend only)
├── 01.2 (Settings Shell)
├── 01.3, 01.4, 01.14 (Onboarding)
├── 01.5, 01.5b (Users - related to 01.5a)
├── 01.6 (Roles & Permissions - new screen)
├── 01.7 (Modules - needs custom banner)
├── 01.8 (Warehouses - needs custom banner)
├── 01.15 (Sessions)
└── 01.16 (Invitations)
```

**Recommendation:** Add reference link to V2-BUILD-INSTRUCTIONS.md at top of each

---

## 📋 BANNER TEMPLATE

For stories WITHOUT specific handoff yet:

```markdown
---

## 🚧 V2 MIGRATION NOTICE

**This story is part of Settings v2 rebuild**

**READ FIRST:** `docs/2-MANAGEMENT/epics/current/01-settings/V2-BUILD-INSTRUCTIONS.md`

**Build in:** `apps/frontend/app/(authenticated)/settings-v2/{feature}/`
**Do not edit:** `app/(authenticated)/settings/` (v1 frozen)
**Verify:** `bash scripts/check-settings-v2-isolation.sh`

---

_Original story content below ↓_

---
```

**Template available at:** `_V2-BANNER-TEMPLATE.txt`

---

## 🎯 RECOMMENDED ACTIONS

### **For Critical Stories (already done):**
- ✅ 01.9, 01.12, 01.13, 01.5a, 01.10, 01.11 have custom banners
- ✅ Point to specific handoff files
- ✅ Explain architecture changes

### **For Remaining Stories:**

**Option 1 (Quick):**
Add simple reference:
```markdown
> 🚧 **V2 Migration:** Read `V2-BUILD-INSTRUCTIONS.md` before starting. Build in `settings-v2/` only.
```

**Option 2 (Thorough):**
Use template from `_V2-BANNER-TEMPLATE.txt`

**Option 3 (Agent-driven):**
Agents read `V2-BUILD-INSTRUCTIONS.md` automatically (add to handoff context)

---

## ✅ VERIFICATION STATUS

```
Stories with v2 banners: 6/16 (37%)
Stories with handoffs: 7 (Foundation + 6 stories)

Critical stories covered: 100% (all 3 critical have banners + handoffs)
Core refactors covered: 100% (Users, Machines, Lines have banners + handoffs)

Remaining: Mostly new screens (will get handoffs as needed)
```

---

## 🚀 NEXT STEPS

1. ✅ **Critical stories ready** (Locations, Allergens, Tax Codes)
2. ✅ **Core refactors ready** (Users, Machines, Lines)
3. ⏳ **Add banners to remaining** (01.1, 01.2, 01.3, etc.) - optional
4. ⏳ **Create more handoffs** (for stories 07-20) - as needed
5. ⏳ **Launch first agent** (Foundation)

---

**Recommendation:** Start with Foundation now. Add banners to other stories as agents request them (on-demand).

---

**Created:** 2025-12-23
**Status:** 6/16 stories documented for v2
**Priority Stories:** All critical + core refactors covered ✅
