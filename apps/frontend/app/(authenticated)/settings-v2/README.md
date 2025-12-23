1# Settings Module v2 - Clean Rebuild from Wireframes

**Status:** 🚧 In Development
**Epic:** 01 - Settings Module
**Wireframes:** 33 screens (SET-001 to SET-031)
**Migration Plan:** `docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md`
**Created:** 2025-12-23

---

## ⚠️ CRITICAL RULES FOR AGENTS

### ✅ ALLOWED:

```yaml
Read:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-*.md (ALL wireframes)
  - docs/2-MANAGEMENT/epics/current/01-settings/*.md (story files)
  - apps/frontend/lib/services/*-service.ts (reuse existing services)
  - apps/frontend/lib/validation/*-schemas.ts (verify + update if needed)
  - apps/frontend/app/(authenticated)/_archive-settings-v1-DO-NOT-TOUCH/* (READ ONLY for logic reference)
  - apps/frontend/components/_archive-settings-v1-DO-NOT-TOUCH/* (READ ONLY for logic reference)

Create:
  - apps/frontend/app/(authenticated)/settings-v2/* (THIS DIRECTORY)
  - apps/frontend/components/settings-v2/* (new components)

Use:
  - components/ui/* (ShadCN UI components)
  - lib/hooks/* (existing hooks, create new if needed)
  - lib/utils/* (utilities)
```

### ❌ FORBIDDEN:

```yaml
Do NOT:
  - Edit files in: app/(authenticated)/settings/ (v1 - FROZEN)
  - Edit files in: components/settings/ (v1 - FROZEN)
  - Import from: @/app/(authenticated)/settings/* (v1 paths)
  - Import from: @/components/settings/* (v1 paths, use settings-v2/)
  - Copy-paste v1 code without wireframe verification
  - Mix old and new UI patterns
  - Touch files in: _archive-settings-v1-DO-NOT-TOUCH/ (read-only reference)
```

---

## 📋 WIREFRAME → CODE MAPPING

### **Implemented (v2):**
```
☐ SET-001 to SET-006: Onboarding (6 screens)
☐ SET-007: Organization Profile
☐ SET-008: User List
☐ SET-009: User Modal
☐ SET-010: User Invitations
☐ SET-011: Roles & Permissions ← NEW SCREEN
☐ SET-012: Warehouse List
☐ SET-013: Warehouse Modal
☐ SET-014: Location Hierarchy TREE ← CRITICAL REWRITE
☐ SET-015: Location Modal
☐ SET-016: Machine List
☐ SET-017: Machine Modal
☐ SET-018: Production Line List
☐ SET-019: Production Line Modal
☐ SET-020: Allergen List ← CRITICAL REWRITE (custom + multi-lang)
☐ SET-021: Tax Code List ← CRITICAL (effective dates)
☐ SET-021a: Tax Code Create Modal
☐ SET-021b: Tax Code Edit Modal
☐ SET-022: Module Toggles ← REDESIGN (grouped sections)
☐ SET-023: API Keys ← NEW SCREEN
☐ SET-024: Webhooks ← NEW SCREEN
☐ SET-025: Audit Logs ← NEW SCREEN
☐ SET-026: Security Settings ← NEW SCREEN
☐ SET-027: Notification Settings ← NEW SCREEN
☐ SET-028: Subscription & Billing ← NEW SCREEN
☐ SET-029: Import/Export ← NEW SCREEN
☐ SET-030: Session Management ← NEW SCREEN
☐ SET-031: Password Settings ← NEW SCREEN
```

**Progress:** 0/33 screens (Starting Phase 1)

---

## 🎯 PRIORITY ORDER

### **Phase 1: FOUNDATION (Do First)**
1. **Shared Components** (blocks everything else)
   - DataTableWithDetails, ActionsMenu, Badges, States

### **Phase 2: CRITICAL REWRITES (Do Early to Validate Approach)**
2. **Locations Tree** (SET-014, SET-015) ← Hardest architectural change
3. **Allergens Custom** (SET-020) ← New architecture (custom CRUD + multi-lang)
4. **Tax Codes Dates** (SET-021, SET-021a, SET-021b) ← FR-SET-083 compliance

### **Phase 3: CORE UPDATES (Easier)**
5. Users (SET-008, SET-009, SET-010) + Roles (SET-011)
6. Warehouses (SET-012, SET-013) - mostly migration
7. Machines (SET-016, SET-017)
8. Production Lines (SET-018, SET-019)
9. Modules (SET-022)

### **Phase 4: NEW SCREENS (Independent)**
10. API Keys (SET-023)
11. Webhooks (SET-024)
12. Audit Logs (SET-025)
13. Security (SET-026)
14. Notifications (SET-027)
15. Billing (SET-028)
16. Import/Export (SET-029)
17. Sessions (SET-030)
18. Password (SET-031)

### **Phase 5: VERIFY EXISTING**
19. Onboarding (SET-001 to SET-006) - verify existing wizard

---

## 🛠️ REUSABLE ASSETS

### **Services (100% Reuse):**
```
✅ lib/services/warehouse-service.ts
✅ lib/services/location-service.ts (may need tree methods)
✅ lib/services/machine-service.ts
✅ lib/services/production-line-service.ts
✅ lib/services/allergen-service.ts (will add custom allergen methods)
✅ lib/services/tax-code-service.ts (will add effective date methods)
✅ lib/services/user-service.ts
✅ lib/services/permission-service.ts
✅ lib/services/onboarding-service.ts
✅ lib/services/module-settings-service.ts
```

### **Schemas (Verify + Update):**
```
⚠️ lib/validation/location-schemas.ts → UPDATE for tree types
⚠️ lib/validation/allergen-schemas.ts → UPDATE for custom + multi-lang
⚠️ lib/validation/tax-code-schemas.ts → UPDATE for effective dates
✅ lib/validation/warehouse-schemas.ts (ok as-is)
✅ lib/validation/machine-schemas.ts (ok as-is)
✅ lib/validation/production-line-schemas.ts (ok as-is)
✅ lib/validation/user-schemas.ts (ok as-is)
```

### **Components (Selective Migration):**
```
✅ MIGRATE if 95%+ wireframe compliant:
  - warehouses/WarehousesDataTable.tsx (85% → add Activity Log)
  - warehouses/WarehouseTypeBadge.tsx (reusable)
  - machines/MachineTypeBadge.tsx (reusable)
  - machines/MachineStatusBadge.tsx (reusable)
  - production-lines/MachineSequenceEditor.tsx (use in 2nd row!)
  - SettingsHeader.tsx (probably ok)

❌ REBUILD from wireframe:
  - locations/* (flat → tree, completely different)
  - allergens/* (read-only → custom CRUD)
  - tax-codes/TaxCodeModal.tsx (needs date fields)
  - modules/* (grid → grouped sections)
  - users/* (add actions menu)
```

---

## 📝 AGENT WORKFLOW

### **How Agents Should Work:**

```
1. Receive handoff (YAML file from docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/)
2. Read assigned wireframe(s) (e.g., SET-014-location-hierarchy-view.md)
3. Read story file (e.g., 01.9.locations-hierarchy.md)
4. Check reusable assets (services, schemas)
5. Build page + components in settings-v2/
6. Test isolation (no v1 imports)
7. Verify all 4 states (Loading, Success, Empty, Error)
8. Create PR with checklist

DO NOT:
- Look at v1 code first (read wireframe first!)
- Copy-paste from archive (rebuild from spec)
- Import from v1 paths
- Mix patterns
```

---

## 🔍 VERIFICATION COMMANDS

### **Run after completing each screen:**

```bash
# 1. Import audit (should return ZERO)
grep -r "from '@/app/(authenticated)/settings/'" apps/frontend/app/\(authenticated\)/settings-v2/

# 2. Component import audit (should return ZERO or only migrated components)
grep -r "from '@/components/settings/'" apps/frontend/components/settings-v2/

# 3. TypeScript check
cd apps/frontend && npx tsc --noEmit

# 4. Test
npm run test -- <screen-name>
```

---

## 📚 DOCUMENTATION REFERENCES

### **Main Documents:**
- **Migration Plan:** `docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md`
- **Wireframes:** `docs/3-ARCHITECTURE/ux/wireframes/SET-*.md`
- **Stories:** `docs/2-MANAGEMENT/epics/current/01-settings/*.md`
- **Agent Handoffs:** `docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/*.yaml`

### **Key References:**
- **Location Tree Rules:** SET-014 (hierarchy: Zone > Aisle > Rack > Bin)
- **Allergen Types:** SET-020 (EU14: A01-A14, Custom: C01-C99)
- **Tax Code Dates:** SET-021 (effective_from/to, expiration indicators)
- **10 PRD Roles:** SET-008 (Super Admin, Admin, Production Manager, Quality Manager, Warehouse Manager, Production Operator, Quality Inspector, Warehouse Operator, Planner, Viewer)

---

## 🚨 KNOWN ISSUES IN V1 (Why We're Rebuilding)

### **Locations (SET-014):**
- ❌ V1 uses flat table (Code, Name, Type, Warehouse, Zone, Capacity)
- ❌ V1 types: receiving/production/storage/shipping/transit/quarantine
- ✅ V2 needs: Tree view (Zone > Aisle > Rack > Bin)
- ✅ V2 types: Zone/Aisle/Rack/Bin/Shelf/Bulk Storage
- **Action:** COMPLETE REWRITE (cannot refactor flat → tree)

### **Allergens (SET-020):**
- ❌ V1 is READ-ONLY (AllergenReadOnlyBanner, no actions)
- ❌ V1 comment: "regulatory data" - niemożliwe do edycji
- ✅ V2 needs: Custom allergens CRUD + Language selector
- **Action:** COMPLETE REWRITE

### **Tax Codes (SET-021):**
- ❌ V1 has Country filter instead of Effective Date filter
- ❌ V1 missing: effective_from, effective_to fields
- ❌ V1 missing: Expiration indicators (✓, ⏰, ⌛)
- ✅ V2 needs: Date range support with expiration warnings
- **Action:** REBUILD with date logic

### **Users (SET-008):**
- ❌ V1 has inline buttons (Edit, Delete) instead of Actions menu [⋮]
- ❌ V1 roles: simplified (admin/manager/operator)
- ✅ V2 needs: Actions menu with 5 options + 10 PRD roles
- **Action:** REFACTOR (keep Tabs, add menu)

### **Production Lines (SET-018):**
- ❌ V1 shows machine count (number) instead of flow (Mixer → Oven → Cooler)
- ❌ V1 has "Output Location" column (not in wireframe)
- ✅ V2 needs: Machine flow visualization in 2nd row
- **Action:** REFACTOR (add 2nd row visualization)

---

## 💡 TIPS FOR SUCCESS

1. **Start with Foundation** - Shared components unlock everything
2. **Do hardest first** - Locations tree validates the approach
3. **One screen at a time** - Don't mix multiple wireframes
4. **Compare side-by-side** - Wireframe ASCII vs rendered UI
5. **Test isolation early** - Run import audit after every file
6. **Keep v1 running** - Don't break old code until swap

---

## 📞 QUESTIONS?

- **Migration Plan:** `docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md`
- **Handoff Files:** `docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/`
- **Isolation Check:** `scripts/check-settings-v2-isolation.sh`

---

**Last Updated:** 2025-12-23
**Current Phase:** Phase 0 Complete, Ready for Phase 1
**Next Step:** Build shared components (Foundation)
