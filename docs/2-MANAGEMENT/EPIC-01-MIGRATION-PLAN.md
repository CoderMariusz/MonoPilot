# 🎯 PLAN MIGRACJI: EPIC 1 SETTINGS - CLEAN REBUILD

**Data:** 2025-12-23
**Epic:** 01 - Settings Module
**Wireframes:** 33 pliki SET-*.md
**Obecny kod:** 17 pages + ~60 components
**Status wireframes:** ✅ Complete (Ready for Review)
**Status kod:** ⚠️ 52% pokrycie, 60-85% zgodność (partial implementation)
**Strategia:** Parallel Build → Atomic Swap

---

## 📊 ANALIZA: CO MAMY vs CO POTRZEBUJEMY

### **WIREFRAMES (SPEC) - 33 ekrany:**
```
ONBOARDING (6 screens):
  SET-001: Onboarding Launcher
  SET-002: Organization Step
  SET-003: Warehouse Step
  SET-004: Location Step
  SET-005: Product + Work Order Step
  SET-006: Completion

USER MANAGEMENT (4 screens):
  SET-007: Organization Profile
  SET-008: User List
  SET-009: User Create/Edit Modal
  SET-010: User Invitations
  SET-011: Roles & Permissions View

WAREHOUSE SETUP (4 screens):
  SET-012: Warehouse List
  SET-013: Warehouse Create/Edit Modal
  SET-014: Location Hierarchy View (TREE)
  SET-015: Location Create/Edit Modal

PRODUCTION SETUP (4 screens):
  SET-016: Machine List
  SET-017: Machine Create/Edit Modal
  SET-018: Production Line List
  SET-019: Production Line Create/Edit Modal

REGULATORY (2 screens):
  SET-020: Allergen List (Custom + Multi-language)
  SET-021: Tax Code List (Effective Dates)

SYSTEM SETTINGS (10 screens):
  SET-022: Module Toggles
  SET-023: API Keys List
  SET-024: Webhooks List
  SET-025: Audit Logs
  SET-026: Security Settings
  SET-027: Notification Settings
  SET-028: Subscription & Billing
  SET-029: Import/Export
  SET-030: Session Management
  SET-031: Password & Security Settings
```

### **KOD (OBECNY) - 17 pages:**
```
✅ Organization (90% zgodny)
   - Ma: OrganizationForm
   - Brak: Activity Log

⚠️ Users (70% zgodny)
   - Ma: Tabs (Users + Invitations) - DOBRY DODATEK
   - Brak: Actions menu [⋮], View Activity Log
   - Problem: Role names (admin/manager vs Super Admin/Production Manager)

✅ Warehouses (85% zgodny) - NAJLEPSZY
   - Ma: WarehousesDataTable, Set Default, Disable/Enable
   - Brak: View Activity Log (minor)

❌ Locations (30% zgodny) - NAJGORSZY
   - Wireframe: Tree view (Zone > Aisle > Rack > Bin)
   - Kod: FLAT TABLE z innymi typami (receiving/production/storage)
   - CAŁKOWICIE INNY DESIGN!

⚠️ Machines (70% zgodny)
   - Ma: MachinesDataTable, Type/Status badges
   - Brak: 2nd row (capacity/specs), Maintenance actions

⚠️ Production Lines (75% zgodny)
   - Ma: Search, filters, sortable columns
   - Brak: Machine flow visualization (Mixer → Oven → Cooler)
   - Dodane: Output Location (nie w wireframe), Info banner

❌ Allergens (30% zgodny) - READ-ONLY!
   - Wireframe: Custom allergens (C01, C02...) + Language selector
   - Kod: READ-ONLY EU14, AllergenReadOnlyBanner
   - BRAK CAŁEJ FUNKCJONALNOŚCI CUSTOM!

⚠️ Tax Codes (60% zgodny)
   - Ma: TaxCodesDataTable, Set Default, Delete dialogs
   - Brak: effective_from/effective_to fields, Expiration indicators (⏰)
   - Problem: Country filter zamiast Effective Date filter

⚠️ Modules (60% zgodny)
   - Ma: Grid layout, toggle switches, confirmation dialogs
   - Brak: Grouped sections (Core/Premium/New), Dependencies info, Price labels

❌ Roles & Permissions (SET-011) - BRAK
❌ API Keys (SET-023) - BRAK
❌ Webhooks (SET-024) - BRAK
❌ Audit Logs (SET-025) - BRAK
❌ Security (SET-026) - BRAK
❌ Notifications (SET-027) - BRAK
❌ Billing (SET-028) - BRAK
❌ Import/Export (SET-029) - BRAK
❌ Sessions (SET-030) - częściowo (users/[id]/sessions/)
❌ Password Settings (SET-031) - BRAK
```

---

## 🎯 STRATEGIA: "PARALLEL BUILD → ATOMIC SWAP"

### **DLACZEGO NIE "REFACTOR IN PLACE":**
❌ Konflikty podczas pracy agentów (mix stary/nowy kod)
❌ Trudno cofnąć się jeśli coś pójdzie nie tak
❌ User widzi "pół-działający" UI podczas developmentu
❌ Git history zakłócony przez częściowe zmiany
❌ Locations wymaga fundamentalnej zmiany (flat → tree)

### **DLACZEGO "PARALLEL BUILD":**
✅ Agenci pracują na czystym canvasie (zero conflicts)
✅ Stary kod dalej działa (zero downtime)
✅ Łatwy rollback (zmień symlink)
✅ Można porównać stary vs nowy side-by-side
✅ Clean git history (feature branch)
✅ Locations tree można zbudować od zera bez konfliktów

---

## 📋 PLAN 5-FAZOWY

### **FAZA 0: PREPARATION (2 godziny)**

#### **0.1 Freeze & Backup**
```bash
# 1. Commit current state
git add apps/frontend/app/\(authenticated\)/settings
git commit -m "chore: freeze settings module before v2 rebuild"

# 2. Create feature branch
git checkout -b feature/settings-v2-rebuild

# 3. Tag old code for reference
git tag settings-v1-backup-$(date +%Y%m%d)
```

#### **0.2 Create Parallel Structure**
```bash
# New directory dla clean build
mkdir -p apps/frontend/app/\(authenticated\)/settings-v2/{organization,users,warehouses,locations,machines,production-lines,allergens,tax-codes,modules,api-keys,webhooks,audit-logs,security,notifications,billing,import-export,sessions,password}

mkdir -p apps/frontend/components/settings-v2/{shared,onboarding,users,warehouses,locations,machines,production-lines,allergens,tax-codes,modules,system}

# Keep old code (frozen, read-only)
# apps/frontend/app/(authenticated)/settings/ ← NIE RUSZAMY!
```

#### **0.3 Identify Reusable Assets**
```typescript
// ✅ KEEP (100% reuse):
apps/frontend/lib/services/
  ├── warehouse-service.ts ✅
  ├── location-service.ts ✅ (WARNING: logic for tree needs review)
  ├── machine-service.ts ✅
  ├── production-line-service.ts ✅
  ├── allergen-service.ts ✅ (will need updates for custom allergens)
  ├── tax-code-service.ts ✅ (will need updates for effective dates)
  ├── module-settings-service.ts ✅
  ├── permission-service.ts ✅
  ├── onboarding-service.ts ✅
  └── user-service.ts ✅

apps/frontend/lib/validation/
  ├── warehouse-schemas.ts ✅
  ├── location-schemas.ts ⚠️ (needs update for tree types)
  ├── machine-schemas.ts ✅
  ├── production-line-schemas.ts ✅
  ├── allergen-schemas.ts ⚠️ (needs custom allergen fields)
  ├── tax-code-schemas.ts ⚠️ (needs effective_from/to fields)
  └── user-schemas.ts ✅

apps/frontend/lib/types/
  ├── warehouse.ts ✅
  ├── location.ts ⚠️ (needs tree hierarchy types)
  ├── machine.ts ✅
  ├── production-line.ts ✅
  ├── allergen.ts ⚠️ (needs custom type)
  ├── tax-code.ts ⚠️ (needs date fields)
  └── user.ts ✅

// ⚠️ REVIEW & ADAPT:
apps/frontend/components/settings/
  ├── SettingsHeader.tsx ✅ (probably ok)
  ├── warehouses/WarehouseModal.tsx ⚠️ (check vs SET-013)
  ├── warehouses/WarehousesDataTable.tsx ⚠️ (check compliance)
  ├── machines/MachineModal.tsx ⚠️ (check vs SET-017)
  └── tax-codes/TaxCodeModal.tsx ⚠️ (needs effective dates)

// ❌ REBUILD FROM SCRATCH:
apps/frontend/components/settings/
  ├── locations/* ❌ (całkowicie nowa architektura - tree)
  ├── allergens/* ❌ (custom allergens + language selector)
  ├── modules/* ❌ (grouped sections vs grid)
  └── users/* ⚠️ (check vs SET-008, may need actions menu)

apps/frontend/app/(authenticated)/settings/
  └── *.tsx ❌ (all pages rebuild from wireframes)
```

---

### **FAZA 1: FOUNDATION (1-2 dni)**

#### **1.1 Create Base Components (v2)**
```bash
# Cel: Shared components zgodne z wireframes

apps/frontend/components/settings-v2/shared/
  ├── DataTableWithDetails.tsx     # Base z 2nd row support
  ├── ActionsMenu.tsx              # [⋮] menu pattern (8 opcji)
  ├── StatusBadge.tsx              # Unified badge system
  ├── TypeBadge.tsx                # Type badges (warehouse, machine, etc.)
  ├── EmptyState.tsx               # Illustrations + CTA
  ├── ErrorState.tsx               # Error handling (Retry + Support)
  ├── LoadingState.tsx             # Skeleton loaders
  ├── ActivityLogPanel.tsx         # Reusable activity log (used by many screens)
  └── ConfirmationDialog.tsx       # Standardized confirm dialogs
```

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Create shared components for Settings v2
Context:
  - Read: docs/3-ARCHITECTURE/ux/wireframes/SET-012-warehouse-list.md (best example)
  - Pattern: ShadCN DataTable + actions menu [⋮]
  - Output: 9 shared components
DO NOT:
  - Touch old code in apps/frontend/app/(authenticated)/settings/
  - Import from old settings components
  - Mix v1 and v2 code
Estimated Effort: 6-8 hours
```

#### **1.2 Update Schemas & Types**
```bash
# Critical schema updates needed:

# 1. Location schemas (TREE hierarchy)
# Old: type = receiving/production/storage/shipping/transit/quarantine
# New: type = Zone/Aisle/Rack/Bin/Shelf/Bulk Storage
# Add: parent_location_id, level, path, lp_count (recursive)

# 2. Allergen schemas (CUSTOM support)
# Add: type = eu14 | custom
# Add: is_locked boolean
# Add: Multi-language fields (name_en, name_pl, name_de, name_fr)

# 3. Tax code schemas (EFFECTIVE DATES)
# Add: effective_from (date)
# Add: effective_to (date, nullable)
# Add: computed fields (expires_soon, is_currently_active, days_until_expiry)
```

**Agent handoff:**
```yaml
Agent: BACKEND-DEV
Task: Update validation schemas for v2 wireframe compliance
Files to update:
  - apps/frontend/lib/validation/location-schemas.ts (TREE types)
  - apps/frontend/lib/validation/allergen-schemas.ts (CUSTOM + multi-lang)
  - apps/frontend/lib/validation/tax-code-schemas.ts (EFFECTIVE dates)
  - apps/frontend/lib/types/location.ts (add hierarchy fields)
  - apps/frontend/lib/types/allergen.ts (add custom type)
  - apps/frontend/lib/types/tax-code.ts (add date fields)
Reference:
  - SET-014: Location types (Zone/Aisle/Rack/Bin/Shelf/Bulk)
  - SET-020: Allergen types (eu14/custom)
  - SET-021: Tax code dates (effective_from/to)
Estimated Effort: 4-6 hours
```

---

### **FAZA 2: REBUILD PAGES (5-7 dni)**

#### **2.1 Onboarding (SET-001 to SET-006) - Dzień 1-2**

**Status:** Częściowo istnieje (OnboardingWizardModal), ale verify compliance

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build/Verify Onboarding Wizard (6 steps)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-001-onboarding-launcher.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-002-onboarding-organization.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-003-onboarding-warehouse.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-004-onboarding-location.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-005-onboarding-product-workorder.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-006-onboarding-completion.md
Existing Code:
  - components/onboarding/OnboardingWizardModal.tsx (verify compliance)
  - components/onboarding/OnboardingGuard.tsx (verify compliance)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/wizard/page.tsx
  - components/settings-v2/onboarding/OnboardingWizard.tsx
  - components/settings-v2/onboarding/OrganizationStep.tsx
  - components/settings-v2/onboarding/WarehouseStep.tsx
  - components/settings-v2/onboarding/LocationStep.tsx
  - components/settings-v2/onboarding/ProductWorkOrderStep.tsx
  - components/settings-v2/onboarding/CompletionStep.tsx
  - components/settings-v2/onboarding/ProgressIndicator.tsx
Approach:
  - IF existing OnboardingWizardModal matches wireframes 95%+ → migrate to v2
  - ELSE rebuild from wireframes
Estimated Effort: 10-12 hours
```

#### **2.2 Organization Profile (SET-007) - Dzień 1**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Organization Profile page
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-007-organization-profile.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/organization/page.tsx (verify)
  - components/settings/OrganizationForm.tsx (check compliance)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/organization/page.tsx
  - components/settings-v2/organization/OrganizationForm.tsx
  - components/settings-v2/organization/ActivityLogPanel.tsx (NEW)
Key Features:
  - ✅ All form sections from SET-007
  - ✅ Activity Log panel (NEW)
  - ✅ Timezone selector
  - ✅ All 4 states
Estimated Effort: 4-6 hours
```

#### **2.3 Users (SET-008, SET-009, SET-010, SET-011) - Dzień 2**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build User Management (4 screens)
Priority: HIGH (complex permissions)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-008-user-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-009-user-create-edit-modal.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-010-user-invitations.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-011-roles-permissions-view.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/users/page.tsx (has Tabs - good!)
  - Keep: Tabs pattern (Users + Invitations)
  - Replace: Inline buttons → Actions menu [⋮]
Output:
  - apps/frontend/app/(authenticated)/settings-v2/users/page.tsx
  - components/settings-v2/users/UsersDataTable.tsx
  - components/settings-v2/users/UserModal.tsx (SET-009)
  - components/settings-v2/users/UserActionsMenu.tsx ([⋮] with 5 options)
  - components/settings-v2/users/InvitationsTable.tsx (SET-010)
  - components/settings-v2/users/RolesPermissionsMatrix.tsx (SET-011) ← NEW SCREEN
  - components/settings-v2/users/ActivityLogPanel.tsx
Key Features:
  - ✅ Actions menu [⋮]: Edit, Change Role, Disable, Resend Invite, Activity Log
  - ✅ 10 PRD roles (Super Admin, Admin, Production Manager, Quality Manager, Warehouse Manager, Production Operator, Quality Inspector, Warehouse Operator, Planner, Viewer)
  - ✅ Roles & Permissions matrix (10 roles × 11 modules) - SET-011
  - ✅ Keep Tabs (Users + Invitations) from v1
Estimated Effort: 10-12 hours
```

#### **2.4 Warehouses (SET-012, SET-013) - Dzień 1**

**Status:** Najlepszy kod w Epic 1, minor updates

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Migrate Warehouses (mostly working, minor fixes)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-012-warehouse-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-013-warehouse-create-edit-modal.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/warehouses/page.tsx (85% compliant)
  - components/settings/warehouses/WarehousesDataTable.tsx (good)
  - components/settings/warehouses/WarehouseModal.tsx (check compliance)
Approach:
  - MIGRATE existing code to v2 (copy + rename)
  - ADD: Activity Log panel (only missing feature)
  - VERIFY: All actions match wireframe
Output:
  - apps/frontend/app/(authenticated)/settings-v2/warehouses/page.tsx
  - components/settings-v2/warehouses/WarehousesDataTable.tsx (migrated)
  - components/settings-v2/warehouses/WarehouseModal.tsx (migrated)
  - components/settings-v2/warehouses/ActivityLogPanel.tsx (NEW)
Estimated Effort: 3-4 hours (mostly migration)
```

#### **2.5 Locations (SET-014, SET-015) - Dzień 2-3 - CRITICAL REWRITE**

**Status:** Najbardziej rozbieżny ekran - całkowite REWRITE

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Location Hierarchy Tree View from scratch - COMPLETE REWRITE
Priority: HIGHEST (fundamental architecture change)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-014-location-hierarchy-view.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-015-location-create-edit-modal.md
Story File:
  - docs/2-MANAGEMENT/epics/current/01-settings/context/01.9.locations-hierarchy.md (if exists)
Existing Code:
  - apps/frontend/app/(authenticated)/settings/locations/page.tsx ❌ IGNORE (flat table)
  - DO NOT USE OLD CODE (completely different design)
New Architecture:
  types:
    - Zone, Aisle, Rack, Bin, Shelf, Bulk Storage (OLD: receiving/production/storage)
  hierarchy:
    - parent_location_id (tree structure)
    - level (depth: 0-4)
    - path (computed: "ZONE-A/AISLE-A1/RACK-A1-01")
    - lp_count (recursive count including children)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/locations/page.tsx (TREE VIEW)
  - components/settings-v2/locations/LocationTreeView.tsx (recursive component)
  - components/settings-v2/locations/LocationTreeNode.tsx (single node)
  - components/settings-v2/locations/LocationModal.tsx (SET-015)
  - components/settings-v2/locations/AddChildLocationModal.tsx
  - components/settings-v2/locations/MoveLocationDialog.tsx
  - components/settings-v2/locations/HierarchyStats.tsx (summary footer)
  - components/settings-v2/locations/ExpandCollapseControls.tsx
Key Features:
  - ✅ Tree view with expand/collapse ([▼] [▸])
  - ✅ Hierarchical rendering (Zone > Aisle > Rack > Bin)
  - ✅ Parent-child indentation
  - ✅ LP count (recursive aggregation)
  - ✅ Hierarchy validation (parent-child rules per SET-014)
  - ✅ Expand All / Collapse All buttons
  - ✅ Add Child Location action
  - ✅ Move Location action (with tree parent selector)
  - ✅ Summary stats (Total, Active, Empty, With LPs)
Hierarchy Rules:
  - Root → Zone, Bulk Storage
  - Zone → Aisle, Shelf, Bulk Storage
  - Aisle → Rack
  - Rack → Bin, Shelf
  - Bin, Shelf, Bulk → Leaf nodes (no children)
  - Max depth: 4 levels
Estimated Effort: 14-16 hours (LONGEST in Epic 1)
```

#### **2.6 Machines (SET-016, SET-017) - Dzień 2**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Machines management with 2nd row details
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-016-machine-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-017-machine-create-edit-modal.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/machines/page.tsx (70% compliant)
  - components/settings/machines/MachinesDataTable.tsx (check 2nd row support)
  - components/settings/machines/MachineModal.tsx (check compliance)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/machines/page.tsx
  - components/settings-v2/machines/MachinesDataTable.tsx
  - components/settings-v2/machines/MachineModal.tsx (SET-017)
  - components/settings-v2/machines/MachineRowDetails.tsx (2nd row: capacity/specs + installation date)
  - components/settings-v2/machines/MaintenanceModal.tsx (Set to Maintenance action)
  - components/settings-v2/machines/MaintenanceHistoryPanel.tsx
  - components/settings-v2/machines/AssignToLineModal.tsx
Key Features:
  - ✅ 2nd row details (Capacity: 500L, Installed: 2023-01-15)
  - ✅ Actions menu: Edit, Assign to Line, Set Maintenance, Disable/Enable, View History, Activity Log
  - ✅ Type badges (Mixer, Oven, Packaging, Filling, Labeling, Other)
  - ✅ Status badges (Active, Maintenance, Disabled)
Estimated Effort: 8-10 hours
```

#### **2.7 Production Lines (SET-018, SET-019) - Dzień 2-3**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Production Lines with machine flow visualization
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-018-production-line-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-019-production-line-create-edit-modal.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/production-lines/page.tsx (75% compliant)
  - components/settings/production-lines/MachineSequenceEditor.tsx ✅ (exists in modal!)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/production-lines/page.tsx
  - components/settings-v2/production-lines/ProductionLinesDataTable.tsx
  - components/settings-v2/production-lines/ProductionLineModal.tsx (SET-019)
  - components/settings-v2/production-lines/MachineFlowVisualization.tsx (2nd row)
  - components/settings-v2/production-lines/CapacityDisplay.tsx
  - components/settings-v2/production-lines/ManageMachinesPanel.tsx
Key Features:
  - ✅ 2nd row: Machine flow (Mixer → Oven → Cooler → Packing)
  - ✅ Capacity per hour display
  - ✅ Actions menu: Edit, Manage Machines, View Work Orders, Disable/Enable, Activity Log
  - ✅ Warehouse filter
  - ✅ Reuse: MachineSequenceEditor from modal, show in list 2nd row
Note:
  - Remove: "Output Location" column (not in wireframe)
  - Remove: Info banner (not in wireframe)
Estimated Effort: 8-10 hours
```

#### **2.8 Allergens (SET-020) - Dzień 3 - CRITICAL REWRITE**

**Status:** Największa rozbieżność - READ-ONLY → FULL CRUD + CUSTOM

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Allergen Management with Custom allergens + Multi-language - COMPLETE REWRITE
Priority: HIGHEST (całkowicie nowa funkcjonalność)
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-020-allergen-list.md
Story File:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.3.product-allergens.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/allergens/page.tsx ❌ IGNORE (read-only banner)
  - components/settings/allergens/* ❌ IGNORE (all read-only)
New Architecture:
  - EU14 allergens (A01-A14): locked, only icon/description editable
  - Custom allergens (C01, C02...): full CRUD
  - Language selector: EN/PL/DE/FR switcher
  - Multi-language fields: name_xx, description_xx
Output:
  - apps/frontend/app/(authenticated)/settings-v2/allergens/page.tsx
  - components/settings-v2/allergens/AllergenManagementView.tsx
  - components/settings-v2/allergens/LanguageSelector.tsx (NEW)
  - components/settings-v2/allergens/CustomAllergenModal.tsx (NEW)
  - components/settings-v2/allergens/AllergenTypeBadge.tsx (EU14 vs Custom)
  - components/settings-v2/allergens/AllergensDataTable.tsx (with actions)
Key Features:
  - ✅ [+ Add Custom Allergen] button
  - ✅ Language selector (top-right): EN | PL | DE | FR
  - ✅ Type badges: EU14 (blue, locked), Custom (green, editable)
  - ✅ Actions menu: Edit (EU14: icon/desc only, Custom: all), View Products, Disable/Enable (Custom only), Activity Log
  - ✅ Auto-increment custom codes (C01, C02, C03...)
  - ✅ Multi-language support (name_en, name_pl, name_de, name_fr)
Compliance:
  - FR-SET-071: EU14 codes (A01-A14)
  - FR-SET-072: Multi-language support
Estimated Effort: 10-12 hours
```

#### **2.9 Tax Codes (SET-021, SET-021a, SET-021b) - Dzień 3-4**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Tax Codes with Effective Dates & Expiration indicators
Priority: HIGH (FR-SET-083 compliance)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-021-tax-code-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-021a-tax-code-create-modal.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-021b-tax-code-edit-modal.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/tax-codes/page.tsx (60% compliant)
  - components/settings/tax-codes/TaxCodeModal.tsx (needs date fields)
New Fields:
  - effective_from (date, optional)
  - effective_to (date, optional, nullable = ongoing)
  - expires_soon (computed: effective_to - today <= 30 days)
  - is_currently_active (computed: today between dates)
  - days_until_expiry (computed)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/tax-codes/page.tsx
  - components/settings-v2/tax-codes/TaxCodesDataTable.tsx
  - components/settings-v2/tax-codes/TaxCodeModal.tsx (with date fields)
  - components/settings-v2/tax-codes/EffectiveDateRangePicker.tsx (NEW)
  - components/settings-v2/tax-codes/ExpirationIndicator.tsx (✓, ⏰, ⌛ icons)
  - components/settings-v2/tax-codes/EffectiveDateFilter.tsx (NEW filter dropdown)
Key Features:
  - ✅ Kolumna "Effective" (DD/MM/YY-DD/MM/YY or "Ongoing")
  - ✅ Expiration indicators (✓ valid, ⏰ expires soon, ⌛ expired)
  - ✅ Effective Date filter: All / Currently Active / Expires Soon / Expired / Future
  - ✅ Date validation (no overlaps, proper ordering)
  - ✅ Warning toast if setting effective_to < 30 days
  - ✅ Pre-populated Polish VAT rates with dates (VAT-23, VAT-08, VAT-05, VAT-00, VAT-EX, VAT-NP)
Compliance:
  - FR-SET-083: Effective date support
Estimated Effort: 8-10 hours
```

#### **2.10 Modules (SET-022) - Dzień 4**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Rebuild Module Toggles with grouped sections & dependencies
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-022-module-toggles.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/modules/page.tsx (60% compliant)
  - Replace: Grid layout → Grouped sections
Output:
  - apps/frontend/app/(authenticated)/settings-v2/modules/page.tsx
  - components/settings-v2/modules/ModuleSection.tsx (Core/Premium/New)
  - components/settings-v2/modules/ModuleCard.tsx
  - components/settings-v2/modules/DependencyIndicator.tsx
  - components/settings-v2/modules/UpgradeButton.tsx ([🔒 UPGRADE])
  - components/settings-v2/modules/DependencyChainDiagram.tsx
Key Features:
  - ✅ 3 grouped sections: Core Modules, Premium Modules, New Modules
  - ✅ [Expand All ▼] per section
  - ✅ Dependency indicators: "Requires: X, Y"
  - ✅ Reverse dependencies: "Required for: X"
  - ✅ Price labels: "Free" (green), "$50/user/mo" (blue)
  - ✅ [🔒 UPGRADE] button dla premium (replaces disabled toggle)
  - ✅ Dependency validation modals
  - ✅ Active data warnings
Design:
  - Replace: Grid → Stacked sections (Core, Premium, New)
  - Each section collapsible
  - Module cards show: Icon, Name, Description, Dependencies, Price, Toggle
Estimated Effort: 8-10 hours
```

---

### **FAZA 3: NEW SCREENS (3-5 dni)**

Ekrany **NIE MAJĄCE** kodu v1 - buduj od zera:

#### **3.1 Roles & Permissions (SET-011) - Dzień 5**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Roles & Permissions Matrix - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-011-roles-permissions-view.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/roles/page.tsx
  - components/settings-v2/users/RolesPermissionsMatrix.tsx
  - components/settings-v2/users/PermissionCell.tsx
Key Features:
  - ✅ 10 roles × 11 modules matrix
  - ✅ Color-coded permissions (Full/View/None)
  - ✅ Read-only view (admin-configured)
  - ✅ Legend/key for permission levels
Services:
  - lib/services/permission-service.ts ✅ (exists)
Estimated Effort: 6-8 hours
```

#### **3.2 API Keys (SET-023) - Dzień 5-6**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build API Keys management - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-023-api-keys-list.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/api-keys/page.tsx
  - components/settings-v2/system/APIKeysDataTable.tsx
  - components/settings-v2/system/CreateAPIKeyModal.tsx
  - components/settings-v2/system/RevokeKeyDialog.tsx
Key Features:
  - ✅ API key list with masked keys
  - ✅ Create new key (name, permissions, expiry)
  - ✅ Revoke key action
  - ✅ Copy to clipboard
  - ✅ Last used timestamp
Services:
  - lib/services/api-key-service.ts (create new)
Estimated Effort: 6-8 hours
```

#### **3.3 Webhooks (SET-024) - Dzień 6**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Webhooks management - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-024-webhooks-list.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/webhooks/page.tsx
  - components/settings-v2/system/WebhooksDataTable.tsx
  - components/settings-v2/system/WebhookModal.tsx
  - components/settings-v2/system/WebhookTestDialog.tsx
Key Features:
  - ✅ Webhook list (URL, events, status)
  - ✅ Create/Edit webhook (URL, event subscriptions, headers)
  - ✅ Test webhook (send test payload)
  - ✅ Enable/Disable toggle
  - ✅ Delivery log (last 100 attempts)
Services:
  - lib/services/webhook-service.ts (create new)
Estimated Effort: 8-10 hours
```

#### **3.4 Audit Logs (SET-025) - Dzień 6-7**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Audit Logs viewer - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-025-audit-logs.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/audit-logs/page.tsx
  - components/settings-v2/system/AuditLogsTable.tsx
  - components/settings-v2/system/AuditLogFilters.tsx
  - components/settings-v2/system/AuditLogDetailModal.tsx
Key Features:
  - ✅ Filterable logs (user, action, resource, date range)
  - ✅ Timeline view
  - ✅ Detail modal (full change log)
  - ✅ Export to CSV
Services:
  - lib/services/audit-log-service.ts (create new)
Estimated Effort: 8-10 hours
```

#### **3.5 Security Settings (SET-026) - Dzień 7**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Security Settings - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-026-security-settings.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/security/page.tsx
  - components/settings-v2/system/SecuritySettings.tsx
  - components/settings-v2/system/PasswordPolicyForm.tsx
  - components/settings-v2/system/SessionSettingsForm.tsx
Key Features:
  - ✅ Password policy (length, complexity, expiry)
  - ✅ Session timeout settings
  - ✅ MFA enforcement
  - ✅ IP whitelist
Estimated Effort: 6-8 hours
```

#### **3.6 Notifications (SET-027) - Dzień 7**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Notification Settings - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-027-notification-settings.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/notifications/page.tsx
  - components/settings-v2/system/NotificationPreferences.tsx
Key Features:
  - ✅ Email notification toggles
  - ✅ In-app notification preferences
  - ✅ Notification channels (email, SMS, push)
Estimated Effort: 4-6 hours
```

#### **3.7 Billing (SET-028) - Dzień 8**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Subscription & Billing - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-028-subscription-billing.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/billing/page.tsx
  - components/settings-v2/system/SubscriptionCard.tsx
  - components/settings-v2/system/BillingHistory.tsx
  - components/settings-v2/system/UpgradeModal.tsx
Key Features:
  - ✅ Current plan display
  - ✅ Billing history table
  - ✅ Upgrade/downgrade actions
  - ✅ Payment method management
Estimated Effort: 8-10 hours
```

#### **3.8 Import/Export (SET-029) - Dzień 8**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Import/Export - NEW SCREEN
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-029-import-export.md
Output:
  - apps/frontend/app/(authenticated)/settings-v2/import-export/page.tsx
  - components/settings-v2/system/ImportWizard.tsx
  - components/settings-v2/system/ExportOptions.tsx
Key Features:
  - ✅ CSV import wizard (upload, map columns, preview, import)
  - ✅ Export options (products, BOMs, users, etc.)
  - ✅ Import history
Estimated Effort: 8-10 hours
```

#### **3.9 Sessions & Password (SET-030, SET-031) - Dzień 9**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Session Management & Password Settings - NEW SCREENS
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-030-session-management.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-031-password-security-settings.md
Existing Code:
  - apps/frontend/app/(authenticated)/settings/users/[id]/sessions/page.tsx (partial)
Output:
  - apps/frontend/app/(authenticated)/settings-v2/sessions/page.tsx
  - apps/frontend/app/(authenticated)/settings-v2/password/page.tsx
  - components/settings-v2/system/SessionsTable.tsx
  - components/settings-v2/system/PasswordChangeForm.tsx
Key Features:
  - ✅ Active sessions list (device, location, last active)
  - ✅ Revoke session action
  - ✅ Password change form
  - ✅ Password strength indicator
Estimated Effort: 6-8 hours (both screens)
```

---

### **FAZA 4: INTEGRATION & ROUTING (1 dzień)**

#### **4.1 Setup Routing Strategy**

**Option A: Symlink Swap (RECOMMENDED)**
```bash
# When v2 ready:
cd apps/frontend/app/\(authenticated\)/
mv settings settings-v1-backup
ln -s settings-v2 settings

# Instant atomic swap
# Rollback = rm settings && mv settings-v1-backup settings
```

**Option B: Direct Rename**
```bash
mv apps/frontend/app/\(authenticated\)/settings apps/frontend/app/\(authenticated\)/settings-v1-backup
mv apps/frontend/app/\(authenticated\)/settings-v2 apps/frontend/app/\(authenticated\)/settings

git add .
git commit -m "feat(settings): migrate to v2 UI (wireframes SET-001 to SET-031)"
```

#### **4.2 Update Navigation**
```typescript
// Update:
components/navigation/NavigationSidebar.tsx

// Add new menu items (for 10 new screens):
- Roles & Permissions
- API Keys
- Webhooks
- Audit Logs
- Security
- Notifications
- Billing
- Import/Export
- Sessions
- Password Settings
```

#### **4.3 Update Internal Links**
```bash
# Search for hardcoded links:
grep -r "/settings/" apps/frontend/components/
grep -r "router.push('/settings" apps/frontend/

# Update any found to use dynamic routing
```

---

### **FAZA 5: CLEANUP (0.5 dnia)**

```bash
# 1. Delete old code (after 1-2 weeks verification)
git rm -rf apps/frontend/app/\(authenticated\)/settings-v1-backup
git rm -rf apps/frontend/components/settings  # old components (if not migrated)

# 2. Update any remaining references
grep -r "settings-v2" apps/frontend/
# Should return ZERO results

# 3. Commit cleanup
git commit -m "chore: remove settings v1 code after v2 migration verified"

# 4. Delete backup tag (optional, after 30 days)
git tag -d settings-v1-backup-YYYYMMDD
```

---

## 🛡️ ISOLATION RULES (CRITICAL!)

### **FOR AGENTS:**

```yaml
# STRICT RULES dla agentów working on settings-v2:

ALLOWED:
  ✅ Read wireframes: docs/3-ARCHITECTURE/ux/wireframes/SET-*.md
  ✅ Read story files: docs/2-MANAGEMENT/epics/current/01-settings/*.md
  ✅ Use services: apps/frontend/lib/services/*-service.ts
  ✅ Use schemas: apps/frontend/lib/validation/*-schemas.ts (verify + update)
  ✅ Create in: apps/frontend/app/(authenticated)/settings-v2/
  ✅ Create in: apps/frontend/components/settings-v2/
  ✅ Reference old code: FOR READING ONLY (understand logic, don't copy)

FORBIDDEN:
  ❌ Edit files in: apps/frontend/app/(authenticated)/settings/ (v1)
  ❌ Edit files in: apps/frontend/components/settings/ (v1)
  ❌ Import from v1 paths (app/(authenticated)/settings/*)
  ❌ Import from old components (components/settings/*)
  ❌ Copy-paste old components (rebuild from wireframe)
  ❌ "Mix" old and new UI patterns

SPECIAL CASES:
  ⚠️ Warehouses: Can MIGRATE v1 code (85% compliant, just add Activity Log)
  ⚠️ Onboarding: VERIFY existing, migrate if compliant
  ❌ Locations: REBUILD from scratch (tree vs flat table)
  ❌ Allergens: REBUILD from scratch (read-only vs custom CRUD)
```

---

## 📦 CO ZACHOWAĆ, CO USUNĄĆ

### **✅ ZACHOWAĆ (100% reuse):**

```bash
# Services (all keep, some need updates)
apps/frontend/lib/services/
  ├── warehouse-service.ts ✅
  ├── location-service.ts ⚠️ (review for tree logic)
  ├── machine-service.ts ✅
  ├── production-line-service.ts ✅
  ├── allergen-service.ts ⚠️ (add custom allergen methods)
  ├── tax-code-service.ts ⚠️ (add effective date methods)
  ├── user-service.ts ✅
  ├── permission-service.ts ✅
  ├── onboarding-service.ts ✅
  └── module-settings-service.ts ✅

# Validation schemas (keep, update as needed)
apps/frontend/lib/validation/
  ├── warehouse-schemas.ts ✅
  ├── location-schemas.ts ⚠️ UPDATE (tree types)
  ├── machine-schemas.ts ✅
  ├── production-line-schemas.ts ✅
  ├── allergen-schemas.ts ⚠️ UPDATE (custom + multi-lang)
  ├── tax-code-schemas.ts ⚠️ UPDATE (effective dates)
  └── user-schemas.ts ✅

# API routes (100% reuse)
apps/frontend/app/api/v1/settings/
  └── * ✅ (all keep)

# Hooks (verify, keep most)
apps/frontend/lib/hooks/
  ├── use-warehouses.ts ✅
  ├── use-machines.ts ✅
  ├── use-tax-codes.ts ⚠️ (may need update for date filtering)
  └── useOnboardingStatus.ts ✅
```

### **⚠️ MIGRATE (if wireframe-compliant):**

```bash
# Check each component vs wireframe, migrate if 95%+ match:

apps/frontend/components/settings/warehouses/
  ├── WarehousesDataTable.tsx ⚠️ (85% compliant → migrate + add Activity Log)
  ├── WarehouseModal.tsx ⚠️ (check vs SET-013)
  ├── WarehouseTypeBadge.tsx ✅ (reusable)
  └── DisableConfirmDialog.tsx ✅ (reusable)

apps/frontend/components/settings/machines/
  ├── MachineModal.tsx ⚠️ (check vs SET-017)
  ├── MachineTypeBadge.tsx ✅ (reusable)
  ├── MachineStatusBadge.tsx ✅ (reusable)
  └── MachineCapacityDisplay.tsx ✅ (reusable)

apps/frontend/components/settings/production-lines/
  ├── MachineSequenceEditor.tsx ✅ (GOOD - use in list 2nd row!)
  └── ProductionLineModal.tsx ⚠️ (check vs SET-019)

apps/frontend/components/settings/onboarding/
  └── * ⚠️ (verify all steps vs SET-001 to SET-006)

# Migration process:
# 1. Read wireframe
# 2. Read component code
# 3. Compare field-by-field
# 4. IF match >= 95% → copy to settings-v2/ (rename if needed)
# 5. IF match < 95% → rebuild from wireframe
```

### **❌ REBUILD FROM SCRATCH:**

```bash
# Components requiring fundamental changes:

apps/frontend/components/settings/locations/
  └── * ❌ ALL (flat table → tree view)

apps/frontend/components/settings/allergens/
  └── * ❌ ALL (read-only → custom CRUD + multi-lang)

apps/frontend/components/settings/tax-codes/
  └── TaxCodeModal.tsx ❌ (needs effective date fields)

apps/frontend/components/settings/modules/
  └── * ❌ (grid → grouped sections)

apps/frontend/components/settings/users/
  └── * ⚠️ (keep Tabs, add actions menu)

# All pages:
apps/frontend/app/(authenticated)/settings/
  └── */page.tsx ❌ (rebuild from wireframes)
```

---

## 🎯 CHECKLIST: VERIFICATION CRITERIA

### **Before Swapping v1 → v2:**

```bash
# ✅ V2 Feature Parity Checklist

ONBOARDING (SET-001 to SET-006):
  ☐ All 6 steps implemented
  ☐ Progress indicator works
  ☐ Skip functionality works
  ☐ All validations per wireframes

ORGANIZATION (SET-007):
  ☐ All form sections present
  ☐ Activity Log panel works
  ☐ Timezone selector works

USERS (SET-008, SET-009, SET-010, SET-011):
  ☐ Actions menu [⋮] with 5 options (Edit, Change Role, Disable, Resend, Activity Log)
  ☐ 10 PRD roles displayed correctly (Super Admin, Production Manager, etc.)
  ☐ Tabs (Users + Invitations) work
  ☐ Roles & Permissions matrix (SET-011) implemented ← NEW SCREEN

WAREHOUSES (SET-012, SET-013):
  ☐ List matches SET-012
  ☐ Set Default works
  ☐ Disable/Enable works
  ☐ Activity Log panel added
  ☐ Type badges correct

LOCATIONS (SET-014, SET-015):
  ☐ TREE VIEW implemented (Zone > Aisle > Rack > Bin) ← CRITICAL
  ☐ Expand/Collapse controls work ([▼] [▸])
  ☐ [Expand All] / [Collapse All] buttons work
  ☐ Parent-child indentation shows hierarchy
  ☐ LP count (recursive) displays correctly
  ☐ Add Child Location action works
  ☐ Move Location action works
  ☐ Summary stats show (Total, Active, Empty, With LPs)
  ☐ Hierarchy validation (parent-child rules) enforced

MACHINES (SET-016, SET-017):
  ☐ 2nd row details (capacity/specs + installation date)
  ☐ Actions menu: Assign to Line, Set Maintenance, View History
  ☐ Type badges (Mixer, Oven, Packaging, Filling, Labeling, Other)
  ☐ Status badges (Active, Maintenance, Disabled)

PRODUCTION LINES (SET-018, SET-019):
  ☐ Machine flow visualization in 2nd row (Mixer → Oven → Cooler)
  ☐ Capacity per hour display
  ☐ Actions menu: Edit, Manage Machines, View Work Orders
  ☐ "Output Location" column REMOVED (not in wireframe)

ALLERGENS (SET-020):
  ☐ [+ Add Custom Allergen] button works ← CRITICAL
  ☐ Language selector (EN/PL/DE/FR) works ← CRITICAL
  ☐ Type badges (EU14 vs Custom) display correctly
  ☐ Custom allergens CRUD works (C01, C02...)
  ☐ EU14 allergens locked (only icon/desc editable)
  ☐ Multi-language display works
  ☐ READ-ONLY banner REMOVED

TAX CODES (SET-021, SET-021a, SET-021b):
  ☐ Effective Date column displays (DD/MM/YY-DD/MM/YY or "Ongoing") ← CRITICAL
  ☐ Expiration indicators (✓, ⏰, ⌛) work ← CRITICAL
  ☐ Effective Date filter dropdown works (All/Active/Expires Soon/Expired/Future)
  ☐ Date validation (no overlaps, proper ordering)
  ☐ Warning toast if setting effective_to < 30 days
  ☐ Pre-populated Polish VAT rates with dates

MODULES (SET-022):
  ☐ 3 grouped sections (Core, Premium, New) ← CRITICAL
  ☐ [Expand All ▼] per section works
  ☐ Dependency indicators ("Requires: X, Y")
  ☐ Reverse dependencies ("Required for: X")
  ☐ Price labels display ($50/user/mo)
  ☐ [🔒 UPGRADE] button for premium modules
  ☐ Grid layout REMOVED

NEW SCREENS (SET-023 to SET-031):
  ☐ API Keys management works (SET-023)
  ☐ Webhooks management works (SET-024)
  ☐ Audit Logs viewer works (SET-025)
  ☐ Security Settings works (SET-026)
  ☐ Notification Settings works (SET-027)
  ☐ Subscription & Billing works (SET-028)
  ☐ Import/Export wizard works (SET-029)
  ☐ Session Management works (SET-030)
  ☐ Password Settings works (SET-031)

INTEGRATION:
  ☐ All navigation links work
  ☐ No broken imports (run import audit)
  ☐ All API endpoints respond
  ☐ RLS policies enforced
  ☐ Tests pass (unit + integration)
  ☐ TypeScript compiles (zero errors)
  ☐ No console errors
```

### **Import Audit Commands:**

```bash
# Run before swap to verify isolation:

# 1. Check v2 doesn't import from v1
grep -r "from '@/app/(authenticated)/settings/'" apps/frontend/app/\(authenticated\)/settings-v2/
# → Should return ZERO results

grep -r "from '@/components/settings/'" apps/frontend/components/settings-v2/
# → Should return ZERO results (except migrated components)

# 2. Check TypeScript compilation
cd apps/frontend
npx tsc --noEmit
# → Zero errors

# 3. Check no hardcoded v1 routes
grep -r "/settings/" apps/frontend/components/settings-v2/ | grep -v "/settings-v2/"
# → Review results
```

---

## 🔄 MIGRATION SEQUENCE

### **Recommended Timeline:**

```
Week 1: Foundation + Core Setup
├── Day 1: Foundation (shared components) + Organization (SET-007)
├── Day 2: Users (SET-008, SET-009, SET-010) + Roles (SET-011)
├── Day 3: Warehouses (SET-012, SET-013) - mostly migration
├── Day 4: Locations TREE REWRITE (SET-014, SET-015) ← LONGEST
└── Day 5: Machines (SET-016, SET-017) + Production Lines (SET-018, SET-019)

Week 2: Regulatory + Advanced
├── Day 6: Allergens REWRITE (SET-020) ← COMPLEX (custom + multi-lang)
├── Day 7: Tax Codes (SET-021, SET-021a, SET-021b) ← COMPLEX (effective dates)
├── Day 8: Modules redesign (SET-022)
├── Day 9: API Keys (SET-023) + Webhooks (SET-024)
└── Day 10: Audit Logs (SET-025) + Security (SET-026)

Week 3: System Settings + Integration
├── Day 11: Notifications (SET-027) + Billing (SET-028)
├── Day 12: Import/Export (SET-029) + Sessions (SET-030) + Password (SET-031)
├── Day 13: Onboarding verification (SET-001 to SET-006)
├── Day 14: Integration testing, bug fixes
└── Day 15: Atomic swap + monitoring

CRITICAL PATH:
1. Shared components → unlocks all pages
2. Locations tree → most complex, do early
3. Allergens custom → new architecture
4. Tax codes dates → new architecture
```

---

## 🚀 EXECUTION STRATEGY

### **APPROACH: "One Agent, One Screen, One PR"**

```bash
# For each wireframe:

# 1. Create isolated branch
git checkout feature/settings-v2-rebuild
git checkout -b feature/set-v2-SET-008-users

# 2. Agent builds ONLY that screen
# Agent context: SET-008 wireframe + story + shared components

# 3. Test in isolation
npm run test -- users
npm run type-check

# 4. PR Review
# Compare: Wireframe SET-008 vs Rendered UI (side-by-side)
# Checklist: All 4 states, all fields, no v1 imports

# 5. Merge to feature/settings-v2-rebuild
git checkout feature/settings-v2-rebuild
git merge feature/set-v2-SET-008-users --no-ff

# 6. Repeat for next screen
git checkout -b feature/set-v2-SET-012-warehouses
```

---

## 💻 FINAL FILE STRUCTURE

### **After v2 Complete & Swap:**

```
apps/frontend/
├── app/(authenticated)/
│   └── settings/  ← v2 code (after swap)
│       ├── page.tsx (dashboard/home)
│       ├── wizard/
│       │   └── page.tsx (SET-001 to SET-006: Onboarding)
│       ├── organization/
│       │   └── page.tsx (SET-007: Org Profile)
│       ├── users/
│       │   ├── page.tsx (SET-008: User List)
│       │   └── [id]/sessions/page.tsx (SET-030: Sessions)
│       ├── roles/  ← NEW
│       │   └── page.tsx (SET-011: Roles & Permissions)
│       ├── warehouses/
│       │   ├── page.tsx (SET-012: Warehouse List)
│       │   └── [id]/locations/page.tsx (redirect to /locations?warehouse={id})
│       ├── locations/
│       │   └── page.tsx (SET-014: Location TREE) ← REWRITTEN
│       ├── machines/
│       │   ├── page.tsx (SET-016: Machine List)
│       │   └── [id]/page.tsx (Machine Detail)
│       ├── production-lines/
│       │   └── page.tsx (SET-018: Production Line List)
│       ├── allergens/
│       │   └── page.tsx (SET-020: Allergen Management) ← REWRITTEN
│       ├── tax-codes/
│       │   └── page.tsx (SET-021: Tax Code List) ← DATES ADDED
│       ├── modules/
│       │   └── page.tsx (SET-022: Module Toggles) ← REDESIGNED
│       ├── api-keys/  ← NEW
│       │   └── page.tsx (SET-023: API Keys)
│       ├── webhooks/  ← NEW
│       │   └── page.tsx (SET-024: Webhooks)
│       ├── audit-logs/  ← NEW
│       │   └── page.tsx (SET-025: Audit Logs)
│       ├── security/  ← NEW
│       │   └── page.tsx (SET-026: Security)
│       ├── notifications/  ← NEW
│       │   └── page.tsx (SET-027: Notifications)
│       ├── billing/  ← NEW
│       │   └── page.tsx (SET-028: Billing)
│       ├── import-export/  ← NEW
│       │   └── page.tsx (SET-029: Import/Export)
│       └── password/  ← NEW
│           └── page.tsx (SET-031: Password)
│
├── components/
│   └── settings/  ← v2 components
│       ├── shared/  ← NEW (reusable)
│       │   ├── DataTableWithDetails.tsx
│       │   ├── ActionsMenu.tsx
│       │   ├── StatusBadge.tsx
│       │   ├── TypeBadge.tsx
│       │   ├── EmptyState.tsx
│       │   ├── ErrorState.tsx
│       │   ├── LoadingState.tsx
│       │   ├── ActivityLogPanel.tsx
│       │   └── ConfirmationDialog.tsx
│       ├── onboarding/
│       │   ├── OnboardingWizard.tsx (SET-001)
│       │   ├── OrganizationStep.tsx (SET-002)
│       │   ├── WarehouseStep.tsx (SET-003)
│       │   ├── LocationStep.tsx (SET-004)
│       │   ├── ProductWorkOrderStep.tsx (SET-005)
│       │   └── CompletionStep.tsx (SET-006)
│       ├── users/
│       │   ├── UsersDataTable.tsx (SET-008)
│       │   ├── UserModal.tsx (SET-009)
│       │   ├── UserActionsMenu.tsx ([⋮] menu)
│       │   ├── InvitationsTable.tsx (SET-010)
│       │   └── RolesPermissionsMatrix.tsx (SET-011)
│       ├── warehouses/
│       │   ├── WarehousesDataTable.tsx (migrated from v1)
│       │   ├── WarehouseModal.tsx (SET-013)
│       │   └── ActivityLogPanel.tsx (added)
│       ├── locations/  ← COMPLETELY NEW
│       │   ├── LocationTreeView.tsx (SET-014)
│       │   ├── LocationTreeNode.tsx (recursive)
│       │   ├── LocationModal.tsx (SET-015)
│       │   ├── AddChildLocationModal.tsx
│       │   ├── MoveLocationDialog.tsx
│       │   ├── HierarchyStats.tsx
│       │   └── ExpandCollapseControls.tsx
│       ├── machines/
│       │   ├── MachinesDataTable.tsx
│       │   ├── MachineModal.tsx (SET-017)
│       │   ├── MachineRowDetails.tsx (2nd row)
│       │   ├── MaintenanceModal.tsx
│       │   └── MaintenanceHistoryPanel.tsx
│       ├── production-lines/
│       │   ├── ProductionLinesDataTable.tsx
│       │   ├── ProductionLineModal.tsx (SET-019)
│       │   ├── MachineFlowVisualization.tsx (2nd row)
│       │   └── ManageMachinesPanel.tsx
│       ├── allergens/  ← COMPLETELY NEW
│       │   ├── AllergenManagementView.tsx (SET-020)
│       │   ├── LanguageSelector.tsx
│       │   ├── CustomAllergenModal.tsx
│       │   ├── AllergenTypeBadge.tsx
│       │   └── AllergensDataTable.tsx
│       ├── tax-codes/
│       │   ├── TaxCodesDataTable.tsx
│       │   ├── TaxCodeModal.tsx (with dates)
│       │   ├── EffectiveDateRangePicker.tsx
│       │   ├── ExpirationIndicator.tsx
│       │   └── EffectiveDateFilter.tsx
│       ├── modules/
│       │   ├── ModuleSection.tsx (grouped)
│       │   ├── ModuleCard.tsx
│       │   ├── DependencyIndicator.tsx
│       │   └── UpgradeButton.tsx
│       └── system/  ← NEW (for SET-023 to SET-031)
│           ├── APIKeysDataTable.tsx
│           ├── WebhooksDataTable.tsx
│           ├── AuditLogsTable.tsx
│           ├── SecuritySettings.tsx
│           ├── NotificationPreferences.tsx
│           ├── SubscriptionCard.tsx
│           ├── ImportWizard.tsx
│           ├── SessionsTable.tsx
│           └── PasswordChangeForm.tsx
│
└── lib/
    ├── services/ ✅ (keep all, update some)
    ├── validation/ ✅ (update 3 schemas)
    ├── types/ ✅ (update 3 types)
    └── hooks/ ✅ (keep, may add new)
```

---

## 📈 SUCCESS METRICS

### **How to know v2 is ready:**

```bash
# 1. Coverage check
# All 33 wireframes implemented
ls apps/frontend/app/\(authenticated\)/settings-v2/ | wc -l
# Should show: 18+ directories (all screens)

# 2. Visual comparison (critical screens)
# Side-by-side: Wireframe vs UI
- SET-014 (Locations tree) - MUST match exactly
- SET-020 (Allergens custom) - MUST have language selector
- SET-021 (Tax codes dates) - MUST have expiration indicators
- SET-008 (Users) - MUST have actions menu [⋮]

# 3. Import audit
grep -r "from '@/app/(authenticated)/settings/'" apps/frontend/app/\(authenticated\)/settings-v2/
# → ZERO results

grep -r "from '@/components/settings/'" apps/frontend/components/settings-v2/ | grep -v "settings-v2"
# → ZERO results

# 4. Feature completeness
# 17 existing screens upgraded
# 16 NEW screens added
# Total: 33 screens (100% wireframe coverage)

# 5. Key regressions fixed
# Locations: flat table → tree view ✅
# Allergens: read-only → custom CRUD ✅
# Tax codes: no dates → effective dates ✅
# Users: inline buttons → actions menu ✅
# Modules: grid → grouped sections ✅

# 6. Performance
# All pages < 1s load time
# Search < 300ms response
# Tree expand/collapse < 100ms
```

---

## 🚦 KICKOFF COMMAND SEQUENCE

### **Copy-Paste Ready Commands:**

```bash
# ===========================================
# PHASE 0: PREPARATION
# ===========================================

# 1. Commit current state
git add .
git commit -m "chore: checkpoint before settings v2 rebuild"

# 2. Create feature branch
git checkout -b feature/settings-v2-rebuild

# 3. Tag old code
git tag settings-v1-backup-$(date +%Y%m%d)

# 4. Create parallel structure
mkdir -p apps/frontend/app/\(authenticated\)/settings-v2/{organization,users,roles,warehouses,locations,machines,production-lines,allergens,tax-codes,modules,api-keys,webhooks,audit-logs,security,notifications,billing,import-export,sessions,password,wizard}

mkdir -p apps/frontend/components/settings-v2/{shared,onboarding,users,warehouses,locations,machines,production-lines,allergens,tax-codes,modules,system}

# 5. Create README for agents
cat > apps/frontend/app/\(authenticated\)/settings-v2/README.md <<'EOF'
# Settings Module v2 - Clean Rebuild

**Status:** In Development
**Wireframes:** docs/3-ARCHITECTURE/ux/wireframes/SET-*.md (33 screens)
**Epic:** 01 - Settings Module

## Rules for Agents

✅ ALLOWED:
- Build pages in this directory (settings-v2/)
- Use services from lib/services/
- Use schemas from lib/validation/ (update if needed)
- Create components in components/settings-v2/
- Read old code (app/(authenticated)/settings/) FOR REFERENCE ONLY

❌ FORBIDDEN:
- Edit files in app/(authenticated)/settings/ (v1 code - frozen)
- Edit files in components/settings/ (v1 components - frozen)
- Import from v1 paths
- Copy-paste v1 code without wireframe verification

## Special Cases

⚠️ CAN MIGRATE (if 95%+ compliant):
- Warehouses (85% compliant - just add Activity Log)
- Some machine/production-line components

❌ MUST REBUILD:
- Locations (flat table → tree view)
- Allergens (read-only → custom CRUD + multi-lang)
- Tax Codes (add effective dates)
- Modules (grid → grouped sections)

## Wireframe Priority Order

CRITICAL (must be perfect):
1. SET-014: Locations Tree (flat→tree architecture change)
2. SET-020: Allergens (custom + multi-language)
3. SET-021: Tax Codes (effective dates)

HIGH PRIORITY:
4. SET-008: Users (actions menu)
5. SET-016, SET-018: Machines, Production Lines (2nd row + flow)
6. SET-022: Modules (grouped sections)
7. SET-011: Roles & Permissions (new screen)

MEDIUM PRIORITY:
8. SET-012: Warehouses (minor updates)
9. SET-001 to SET-006: Onboarding (verify existing)
10. SET-023 to SET-031: System Settings (new screens)
EOF

# 6. Create isolation checker script
cat > scripts/check-settings-v2-isolation.sh <<'EOF'
#!/bin/bash
echo "🔍 Checking Settings v2 isolation..."

echo ""
echo "1. Checking for v1 imports in v2 code..."
BAD_IMPORTS=$(grep -r "from '@/app/(authenticated)/settings/'" apps/frontend/app/\(authenticated\)/settings-v2/ 2>/dev/null | grep -v "settings-v2")
if [ -z "$BAD_IMPORTS" ]; then
  echo "✅ No v1 app imports found"
else
  echo "❌ Found v1 app imports:"
  echo "$BAD_IMPORTS"
  exit 1
fi

echo ""
echo "2. Checking for v1 component imports in v2..."
BAD_COMP=$(grep -r "from '@/components/settings/'" apps/frontend/components/settings-v2/ 2>/dev/null | grep -v "settings-v2")
if [ -z "$BAD_COMP" ]; then
  echo "✅ No v1 component imports found"
else
  echo "❌ Found v1 component imports:"
  echo "$BAD_COMP"
  exit 1
fi

echo ""
echo "3. TypeScript compilation check..."
cd apps/frontend
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ TypeScript compiles successfully"
else
  echo "❌ TypeScript errors found"
  exit 1
fi

echo ""
echo "4. Checking critical screens exist..."
CRITICAL_SCREENS=(
  "locations/page.tsx"
  "allergens/page.tsx"
  "tax-codes/page.tsx"
  "roles/page.tsx"
)

for screen in "${CRITICAL_SCREENS[@]}"; do
  if [ -f "apps/frontend/app/(authenticated)/settings-v2/$screen" ]; then
    echo "✅ $screen exists"
  else
    echo "❌ $screen missing"
    exit 1
  fi
done

echo ""
echo "✅ All isolation checks passed!"
EOF

chmod +x scripts/check-settings-v2-isolation.sh

# 7. Commit structure
git add apps/frontend/app/\(authenticated\)/settings-v2/
git add apps/frontend/components/settings-v2/
git add scripts/check-settings-v2-isolation.sh
git commit -m "feat(settings): create v2 structure for clean rebuild

- Create settings-v2 parallel directory structure
- Add README with agent rules and priority order
- Add isolation checker script
- Freeze settings/ (v1) as read-only reference
- Identify critical rewrites: Locations (tree), Allergens (custom), Tax Codes (dates)
"

echo ""
echo "✅ Setup complete! Ready to launch agents."
echo ""
echo "CRITICAL FIRST: Start with shared components (Foundation)"
echo "CRITICAL SECOND: Build Locations tree (hardest architectural change)"
echo ""
echo "Next: Launch FRONTEND-DEV agent with shared components task"
```

---

## 🎬 AGENT LAUNCH TEMPLATES

### **Priority 1: Foundation - Shared Components**

```yaml
agent: frontend-dev
task: "Create shared components for Settings v2 - Foundation"
priority: CRITICAL (blocks all other work)

output:
  - apps/frontend/components/settings-v2/shared/DataTableWithDetails.tsx
  - apps/frontend/components/settings-v2/shared/ActionsMenu.tsx
  - apps/frontend/components/settings-v2/shared/StatusBadge.tsx
  - apps/frontend/components/settings-v2/shared/TypeBadge.tsx
  - apps/frontend/components/settings-v2/shared/EmptyState.tsx
  - apps/frontend/components/settings-v2/shared/ErrorState.tsx
  - apps/frontend/components/settings-v2/shared/LoadingState.tsx
  - apps/frontend/components/settings-v2/shared/ActivityLogPanel.tsx
  - apps/frontend/components/settings-v2/shared/ConfirmationDialog.tsx

context:
  - Read: docs/3-ARCHITECTURE/ux/wireframes/SET-012-warehouse-list.md (best reference)
  - Read: docs/3-ARCHITECTURE/ux/wireframes/SET-008-user-list.md (actions menu example)
  - Pattern: ShadCN components + reusable patterns

requirements:
  - DataTableWithDetails: Support 2nd row for extra info
  - ActionsMenu: [⋮] dropdown with dynamic options
  - Badges: Consistent colors, WCAG AA contrast
  - States: Match wireframe ASCII art exactly
  - ActivityLogPanel: Reusable across all screens (timeline view)

estimated_hours: 6-8
```

---

### **Priority 2: Locations Tree - CRITICAL REWRITE**

```yaml
agent: frontend-dev
task: "Build Location Hierarchy Tree View - COMPLETE REWRITE from flat table"
priority: HIGHEST (fundamental architecture change)

wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-014-location-hierarchy-view.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-015-location-create-edit-modal.md

existing_code:
  - apps/frontend/app/(authenticated)/settings/locations/page.tsx
  - WARNING: DO NOT COPY THIS CODE
  - Old design: Flat table with types (receiving/production/storage)
  - New design: Tree with types (Zone/Aisle/Rack/Bin/Shelf/Bulk)
  - Architecture: Completely different!

new_architecture:
  types:
    - Zone, Aisle, Rack, Bin, Shelf, Bulk Storage
  hierarchy:
    - parent_location_id (nullable for root)
    - level (0-4, computed depth)
    - path (computed: "ZONE-A/AISLE-A1/RACK-A1-01")
    - lp_count (recursive: includes all children)
  hierarchy_rules:
    - Root (null) → Zone, Bulk Storage
    - Zone → Aisle, Shelf, Bulk Storage
    - Aisle → Rack
    - Rack → Bin, Shelf
    - Bin, Shelf, Bulk → Leaf nodes (no children)
    - Max depth: 4 levels

output:
  pages:
    - apps/frontend/app/(authenticated)/settings-v2/locations/page.tsx
  components:
    - components/settings-v2/locations/LocationTreeView.tsx (main recursive tree)
    - components/settings-v2/locations/LocationTreeNode.tsx (single node, recursive render)
    - components/settings-v2/locations/LocationModal.tsx (CREATE/EDIT with parent selector)
    - components/settings-v2/locations/AddChildLocationModal.tsx (parent pre-selected)
    - components/settings-v2/locations/MoveLocationDialog.tsx (tree parent selector)
    - components/settings-v2/locations/HierarchyStats.tsx (footer: Total, Active, Empty, With LPs)
    - components/settings-v2/locations/ExpandCollapseControls.tsx ([Expand All] [Collapse All])
    - components/settings-v2/locations/LocationTypeSelect.tsx (with hierarchy validation)

requirements:
  must_have:
    - Tree rendering (recursive component)
    - Expand/Collapse state management (per node)
    - Indentation shows hierarchy depth
    - [▼] expanded icon, [▸] collapsed icon
    - [Expand All] / [Collapse All] buttons
    - LP count (recursive: count this node + all descendants)
    - Add Child Location (parent pre-selected in modal)
    - Move Location (validate new parent, prevent circular refs)
    - Summary stats footer (Total: X, Active: X, Empty: X, With LPs: X)
    - Hierarchy validation (enforce parent-child rules)
    - Type badges (Zone/Aisle/Rack/Bin/Shelf/Bulk)
    - Status badges (Active/Empty/Full/Reserved/Disabled)

validation:
  - Parent-child type combinations (per SET-014 hierarchy table)
  - Max depth 4 levels (Zone → Aisle → Rack → Bin)
  - Cannot move parent into its own descendant (circular ref)
  - Cannot delete if has children or LPs

services:
  - lib/services/location-service.ts (may need tree-specific methods)
  - Add: getLocationTree(warehouse_id) → returns nested structure
  - Add: moveLocation(id, new_parent_id) → validates + moves subtree

schemas:
  - lib/validation/location-schemas.ts (UPDATE types)
  - Old: receiving/production/storage/shipping/transit/quarantine
  - New: Zone/Aisle/Rack/Bin/Shelf/Bulk Storage
  - Add: parent_location_id, level, path

estimated_hours: 14-16 (LONGEST in Epic 1)
complexity: HIGH
```

---

### **Priority 3: Allergens - CRITICAL REWRITE**

```yaml
agent: frontend-dev
task: "Build Allergen Management with Custom allergens + Multi-language - COMPLETE REWRITE"
priority: HIGHEST (całkowicie nowa funkcjonalność)

wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-020-allergen-list.md

existing_code:
  - apps/frontend/app/(authenticated)/settings/allergens/page.tsx
  - WARNING: DO NOT COPY THIS CODE
  - Old design: Read-only EU14 with AllergenReadOnlyBanner
  - New design: EU14 (locked) + Custom (full CRUD) + Multi-language
  - Comment in old code: "regulatory data" - INCORRECT!

new_architecture:
  types:
    - eu14: Locked allergens (A01-A14), only icon/description editable
    - custom: Full CRUD allergens (C01, C02...), all fields editable
  multi_language:
    - Fields: name_en, name_pl, name_de, name_fr
    - Fields: description_en, description_pl, description_de, description_fr
    - Selector: Language dropdown (EN/PL/DE/FR)
    - Display: Show fields based on selected language
  codes:
    - EU14: A01 to A14 (immutable, per FR-SET-071)
    - Custom: C01, C02, C03... (auto-increment)

output:
  pages:
    - apps/frontend/app/(authenticated)/settings-v2/allergens/page.tsx
  components:
    - components/settings-v2/allergens/AllergenManagementView.tsx
    - components/settings-v2/allergens/LanguageSelector.tsx (EN/PL/DE/FR dropdown)
    - components/settings-v2/allergens/CustomAllergenModal.tsx (create/edit C01, C02...)
    - components/settings-v2/allergens/AllergenTypeBadge.tsx (EU14 blue/locked, Custom green)
    - components/settings-v2/allergens/AllergensDataTable.tsx (with actions menu)
    - components/settings-v2/allergens/AllergenIcon.tsx (emoji display)

requirements:
  must_have:
    - [+ Add Custom Allergen] button (top-right)
    - Language selector (top-right): EN | PL | DE | FR
    - Display names/descriptions in selected language
    - Type column: EU14 (blue badge with lock icon), Custom (green badge)
    - Actions menu:
      - EU14: Edit (icon/description only), View Products, Activity Log
      - Custom: Edit (all fields), View Products, Disable/Enable, Activity Log
    - Custom allergen modal:
      - Code: Auto-generated (C01, C02..., read-only display)
      - Icon: Emoji picker (single emoji)
      - Name: Input for each language (EN required, others optional)
      - Description: Textarea for each language
    - Products count (link to filtered product list)
    - Search across all language fields (name_en, name_pl, name_de, name_fr)

compliance:
  - FR-SET-071: EU14 allergen codes (A01-A14)
  - FR-SET-072: Multi-language support
  - EU14 allergens: Pre-populated on org creation (seeded)
  - EU14 allergens: Cannot be deleted, only disabled if products_count = 0

services:
  - lib/services/allergen-service.ts (update for custom allergens)
  - Add: createCustomAllergen(data) → auto-assigns C01, C02...
  - Add: updateAllergen(id, data, type) → type determines editable fields

schemas:
  - lib/validation/allergen-schemas.ts (UPDATE)
  - Add: type = 'eu14' | 'custom'
  - Add: is_locked boolean
  - Add: name_en, name_pl, name_de, name_fr
  - Add: description_en, description_pl, description_de, description_fr

estimated_hours: 10-12
complexity: HIGH
```

---

### **Priority 4: Tax Codes - ADD Effective Dates**

```yaml
agent: frontend-dev
task: "Build Tax Codes with Effective Dates & Expiration Indicators"
priority: HIGH (FR-SET-083 compliance)

wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-021-tax-code-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-021a-tax-code-create-modal.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-021b-tax-code-edit-modal.md

existing_code:
  - apps/frontend/app/(authenticated)/settings/tax-codes/page.tsx (60% compliant)
  - Keep: Overall structure, TaxCodesDataTable pattern
  - Add: Effective dates column, expiration indicators, date filter

new_fields:
  - effective_from (date, optional, defaults to today)
  - effective_to (date, optional, nullable = ongoing)
  - expires_soon (computed: effective_to - today <= 30 days)
  - is_currently_active (computed: today between dates)
  - days_until_expiry (computed: days until effective_to)

output:
  pages:
    - apps/frontend/app/(authenticated)/settings-v2/tax-codes/page.tsx
  components:
    - components/settings-v2/tax-codes/TaxCodesDataTable.tsx (add Effective column)
    - components/settings-v2/tax-codes/TaxCodeModal.tsx (add date fields)
    - components/settings-v2/tax-codes/EffectiveDateRangePicker.tsx (date range input)
    - components/settings-v2/tax-codes/ExpirationIndicator.tsx (✓ valid, ⏰ warning, ⌛ expired)
    - components/settings-v2/tax-codes/EffectiveDateFilter.tsx (filter dropdown)

requirements:
  must_have:
    - "Effective" column (DD/MM/YY-DD/MM/YY or "Ongoing")
    - Expiration indicators:
      - ✓ (green) = currently valid
      - ⏰ (orange) = expires within 30 days
      - ⌛ (gray) = expired
    - Effective Date filter dropdown:
      - All
      - Currently Active (today between dates)
      - Expires Soon (<30 days)
      - Expired (effective_to < today)
      - Future (effective_from > today)
    - Date validation:
      - effective_to must be after effective_from
      - No overlapping date ranges for same code
      - Warning toast if effective_to < 30 days
    - Pre-populated Polish VAT rates with annual dates:
      - VAT-23 (23%): 2025-01-01 to 2025-12-31
      - VAT-08 (8%): 2025-01-01 to 2025-12-31
      - VAT-05 (5%): 2025-01-01 to 2025-12-31
      - VAT-00 (0%): 2025-01-01 to 2025-12-31
      - VAT-EX (0%): 2025-01-01 to 2025-12-31
      - VAT-NP (0%): NULL to NULL (ongoing)

compliance:
  - FR-SET-083: Effective date support

services:
  - lib/services/tax-code-service.ts (update)
  - Add: getActiveTaxCodes(date) → filters by date
  - Add: getTaxCodesExpiringSoon() → expires_soon = true

schemas:
  - lib/validation/tax-code-schemas.ts (UPDATE)
  - Add: effective_from (z.string().date().optional())
  - Add: effective_to (z.string().date().optional().nullable())
  - Add: date ordering validation (to > from)

estimated_hours: 8-10
complexity: MEDIUM-HIGH
```

---

### **Priority 5: Users - ADD Actions Menu**

```yaml
agent: frontend-dev
task: "Rebuild Users page with Actions Menu [⋮]"
priority: HIGH

wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/SET-008-user-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-009-user-create-edit-modal.md
  - docs/3-ARCHITECTURE/ux/wireframes/SET-010-user-invitations.md

existing_code:
  - apps/frontend/app/(authenticated)/settings/users/page.tsx
  - Keep: Tabs pattern (Users + Invitations) ← GOOD ADDITION not in wireframe
  - Replace: Inline Edit/Delete buttons → Actions menu [⋮]

output:
  pages:
    - apps/frontend/app/(authenticated)/settings-v2/users/page.tsx
  components:
    - components/settings-v2/users/UsersDataTable.tsx (with actions menu)
    - components/settings-v2/users/UserModal.tsx (SET-009)
    - components/settings-v2/users/UserActionsMenu.tsx ([⋮] menu)
    - components/settings-v2/users/InvitationsTable.tsx (SET-010)
    - components/settings-v2/users/ActivityLogPanel.tsx
    - components/settings-v2/users/ChangeRoleModal.tsx
    - components/settings-v2/users/ResendInviteButton.tsx

requirements:
  must_have:
    - Keep: Tabs (Users + Invitations) from v1 ← GOOD FEATURE
    - Add: Actions menu [⋮] with 5 options:
      1. Edit User
      2. Change Role (Super Admin only)
      3. Disable User (confirmation)
      4. Resend Invite (if status = invited)
      5. View Activity Log (side panel)
    - Replace: Role names to match PRD exactly:
      - Super Admin (not "admin")
      - Admin (not "manager")
      - Production Manager (not "production_manager")
      - Quality Manager
      - Warehouse Manager
      - Production Operator (not "operator")
      - Quality Inspector
      - Warehouse Operator
      - Planner
      - Viewer
    - 10 roles displayed (not 11 simplified roles)
    - Resend Invite inline link in Users tab (for invited status)

estimated_hours: 8-10
complexity: MEDIUM
```

---

## 🔄 ROLLBACK PLAN

### **If v2 has critical bugs:**

```bash
# Immediate rollback (< 5 minutes):

# Option A: Symlink swap back
cd apps/frontend/app/\(authenticated\)/
rm settings
mv settings-v1-backup settings
git add .
git commit -m "revert: rollback to settings v1 due to [ISSUE]"
git push

# Option B: Git revert
git revert HEAD  # if swap was last commit
git push

# Rollback decision criteria:
❌ ROLLBACK IF: Data loss, auth bypass, page load >5s, critical business logic bug
✅ FIX FORWARD IF: Minor UI glitch, missing icon, cosmetic issue
```

---

## 📅 ESTIMATED TIMELINE

### **Conservative Estimate (1 agent):**

```
Phase 0: Preparation           → 2 hours
Phase 1: Foundation            → 1-2 days (shared + schema updates)
Phase 2: Core Pages            → 7 days
  - Onboarding (verify): 1 day
  - Organization: 0.5 day
  - Users: 1 day
  - Warehouses (migrate): 0.5 day
  - Locations TREE: 2 days ← LONGEST
  - Machines: 1 day
  - Production Lines: 1 day
  - Allergens CUSTOM: 1.5 days
  - Tax Codes DATES: 1 day
  - Modules redesign: 1 day
Phase 3: New Screens           → 5 days (10 new screens)
Phase 4: Integration           → 1 day
Phase 5: Cleanup               → 0.5 day

TOTAL: ~15 days (3 weeks)
```

### **Aggressive Estimate (2-3 parallel agents):**

```
With agents working in parallel:
- Week 1: Foundation + Critical rewrites (Locations, Allergens, Tax Codes)
- Week 2: Remaining core + 5 new screens
- Week 3: Final 5 new screens + Integration + Testing

TOTAL: ~15 days (3 weeks) but overlapped = 3 weeks calendar time
```

---

## 🏁 SUCCESS DEFINITION

**v2 is ready when:**

1. ✅ All 33 wireframes have corresponding working UI
2. ✅ Visual inspection confirms 95%+ match to ASCII wireframes
3. ✅ Critical rewrites complete:
   - Locations: Tree view working (expand/collapse, hierarchy validation)
   - Allergens: Custom allergens CRUD + language selector
   - Tax Codes: Effective dates + expiration indicators
4. ✅ Import audit shows zero v1 dependencies
5. ✅ All settings pages load < 1s
6. ✅ TypeScript compiles with zero errors
7. ✅ All tests pass
8. ✅ 10 new screens functional (SET-023 to SET-031, SET-011)
9. ✅ Rollback plan tested
10. ✅ Team sign-off

**Then: Execute atomic swap (settings-v2 → settings)**

---

## 🎯 PRIORITY ORDER FOR AGENTS

### **Must Do First (Critical Path):**

1. **Shared Components** (blocks everything)
2. **Locations Tree** (hardest, validate approach early)
3. **Allergens Custom** (new architecture, critical for Technical)
4. **Tax Codes Dates** (FR-SET-083 compliance)

### **Can Do in Parallel (after Foundation):**

- Users + Warehouses + Machines (independent)
- Production Lines + Modules (independent)
- All 10 new screens (SET-023 to SET-031) - fully independent

### **Do Last:**

- Onboarding (verify existing)
- Integration testing
- Bug fixes & polish

---

**Document Version:** 1.0
**Created:** 2025-12-23
**Owner:** Settings Module Lead
**Epic:** 01 - Settings
**Wireframes:** 33 screens (SET-001 to SET-031)
**Target:** 100% wireframe coverage with clean v2 architecture
**Next Review:** After Locations tree complete (validates approach)
