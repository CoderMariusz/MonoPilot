# 🎯 PLAN MIGRACJI: EPIC 2 TECHNICAL - CLEAN REBUILD

**Data:** 2025-12-23
**Epic:** 02 - Technical Module
**Wireframes:** 19 plików TEC-*.md (~19,000 linii)
**Obecny kod:** 10 pages + 14 components
**Status wireframes:** ✅ Complete (98% quality score)
**Status kod:** ⚠️ 70-85% zgodny (partial implementation)
**Strategia:** Parallel Build → Atomic Swap

---

## 📊 ANALIZA: CO MAMY vs CO POTRZEBUJEMY

### **WIREFRAMES (SPEC):**
```
TEC-001: Products List - row details (GTIN, supplier, stock, allergens)
TEC-002: Product Modal - full form (procurement, shelf life, stock)
TEC-003: Materials List - separate view dla RM
TEC-004: Material Modal - simplified form
TEC-005: BOMs List - needs Product Type & Date filters
TEC-006: BOM Modal - needs Advanced Settings accordion
TEC-006a: BOM Items Detail - complex (alternatives, byproducts, ops)
TEC-007: Routings List - mostly ok
TEC-008: Routing Modal - needs ADR-009 cost fields
TEC-008a: Routing Detail - NEW (operations CRUD, cost summary)
TEC-009: Nutrition Panel
TEC-010: Allergen Management
TEC-011: Nutrition Calculator
TEC-012: Allergen Warnings
TEC-013: Recipe Costing
TEC-014: Shelf Life Config
TEC-015: Cost History
TEC-016: Traceability Search
TEC-017: Technical Dashboard
```

### **KOD (OBECNY):**
```
✅ Products page (~80% zgodny)
   - Brak: row details (2nd row), actions menu [⋮], Clone action
   - Ma: Tabs (Products/BOMs), search, filters, pagination

✅ BOMs list (~70% zgodny)
   - Brak: Product Type filter, Date filter, Clone action
   - Ma: Search, status filter, inline actions

✅ BOMs detail (~75% zgodny)
   - Brak: Alternatives, Byproducts, Operation assignment
   - Ma: Tabs (Items/Allergens), items table

✅ Routings list (~85% zgodny)
   - Brak: minor illustrations
   - Ma: Search, filters, pagination

✅ Routings detail (~60% zgodny)
   - Brak: Operations CRUD inline, Cost summary, Related BOMs
   - Ma: Basic header, operations table

❌ Materials List/Modal (TEC-003/004) - BRAK
❌ Nutrition (TEC-009, TEC-011) - BRAK
❌ Allergen Management (TEC-010, TEC-012) - BRAK
❌ Recipe Costing (TEC-013) - BRAK
❌ Shelf Life Config (TEC-014) - BRAK
❌ Cost History (TEC-015) - BRAK
❌ Traceability Search (TEC-016) - BRAK
❌ Dashboard (TEC-017) - istnieje ale nie sprawdzony
```

---

## 🎯 STRATEGIA: "PARALLEL BUILD → ATOMIC SWAP"

### **DLACZEGO NIE "REFACTOR IN PLACE":**
❌ Konflikty podczas pracy agentów (mix stary/nowy kod)
❌ Trudno cofnąć się jeśli coś pójdzie nie tak
❌ User widzi "pół-działający" UI podczas developmentu
❌ Git history zakłócony przez częściowe zmiany

### **DLACZEGO "PARALLEL BUILD":**
✅ Agenci pracują na czystym canvasie (zero conflicts)
✅ Stary kod dalej działa (zero downtime)
✅ Łatwy rollback (zmień symlink)
✅ Można porównać stary vs nowy side-by-side
✅ Clean git history (feature branch)

---

## 📋 PLAN 5-FAZOWY

### **FAZA 0: PREPARATION (2 godziny)**

#### **0.1 Freeze & Backup**
```bash
# 1. Commit current state
git add apps/frontend/app/\(authenticated\)/technical
git commit -m "chore: freeze technical module before v2 rebuild"

# 2. Create feature branch
git checkout -b feature/technical-v2-rebuild

# 3. Tag old code for reference
git tag technical-v1-backup-$(date +%Y%m%d)
```

#### **0.2 Create Parallel Structure**
```bash
# New directory dla clean build
mkdir -p apps/frontend/app/\(authenticated\)/technical-v2/{products,materials,boms,routings,nutrition,allergens,costing,shelf-life,traceability,dashboard}
mkdir -p apps/frontend/components/technical-v2/{shared,products,materials,boms,routings,nutrition,allergens,costing}

# Keep old code (frozen, read-only)
# apps/frontend/app/(authenticated)/technical/ ← NIE RUSZAMY!
```

#### **0.3 Identify Reusable Assets**
```typescript
// ✅ KEEP (migrate to v2):
apps/frontend/lib/services/
  ├── bom-service.ts ✅
  ├── bom-item-service.ts ✅
  ├── bom-item-alternative-service.ts ✅
  ├── routing-service.ts ✅
  └── byproduct-service.ts ✅

apps/frontend/lib/validation/
  ├── bom-schemas.ts ✅ (może potrzebować minor updates)
  ├── product-schemas.ts ✅
  └── routing-schemas.ts ✅

apps/frontend/lib/types/
  └── production-line.ts ✅ (jeśli używane)

// ⚠️ REVIEW & ADAPT (check wireframe compliance):
apps/frontend/components/technical/
  ├── ProductFormModal.tsx ⚠️ (check vs TEC-002)
  ├── BOMFormModal.tsx ⚠️ (check vs TEC-006)
  ├── BOMItemFormModal.tsx ⚠️ (check vs TEC-006a)
  └── TechnicalHeader.tsx ✅ (probably reusable)

// ❌ IGNORE (rebuild from scratch):
apps/frontend/app/(authenticated)/technical/*.tsx ❌
```

---

### **FAZA 1: FOUNDATION (1 dzień)**

#### **1.1 Create Base Components (v2)**
```bash
# Cel: Shared components zgodne z wireframes

# Create:
apps/frontend/components/technical-v2/shared/
  ├── DataTableWithDetails.tsx     # Base component z 2nd row support
  ├── ActionsMenu.tsx              # [⋮] menu pattern
  ├── StatusBadge.tsx              # Unified badge system
  ├── TypeBadge.tsx                # Product/BOM type badges
  ├── EmptyState.tsx               # Illustrations + CTA
  ├── ErrorState.tsx               # Error handling
  └── LoadingState.tsx             # Skeleton loaders
```

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Create shared components for Technical v2
Context:
  - Read: docs/3-ARCHITECTURE/ux/wireframes/TEC-001-products-list.md (Key Components section)
  - Pattern: ShadCN DataTable + 2nd row details
  - Output: 7 shared components
DO NOT:
  - Touch old code in apps/frontend/app/(authenticated)/technical/
  - Import from old technical components
  - Mix v1 and v2 code
```

#### **1.2 Setup Types & Schemas**
```bash
# Verify/update existing schemas vs wireframes

# Review:
apps/frontend/lib/validation/
  ├── product-schemas.ts     # Check: GTIN-14, lead_time, MOQ (ADR-010)
  ├── bom-schemas.ts         # Check: Advanced Settings fields
  └── routing-schemas.ts     # Check: ADR-009 cost fields

# If gaps found → update schemas
# If ok → continue
```

---

### **FAZA 2: REBUILD PAGES (3-5 dni)**

#### **2.1 Products (TEC-001, TEC-002) - Dzień 1**

**PLAN:**
```bash
# 1. Create new page from scratch
touch apps/frontend/app/\(authenticated\)/technical-v2/products/page.tsx

# 2. Agent builds according to TEC-001 wireframe
# 3. Agent creates ProductFormModal-v2 according to TEC-002
# 4. Test isolation (no imports from v1)
```

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Products List (TEC-001) from scratch
Input Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-001-products-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-002-product-modal.md
Story File:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.1.products-crud-types.md
Reusable Assets:
  services:
    - lib/services/product-service.ts (verify exists, create if not)
  schemas:
    - lib/validation/product-schemas.ts (verify vs TEC-002)
  shared:
    - components/technical-v2/shared/* (from Phase 1)
Output Files:
  pages:
    - apps/frontend/app/(authenticated)/technical-v2/products/page.tsx
  components:
    - apps/frontend/components/technical-v2/products/ProductsDataTable.tsx
    - apps/frontend/components/technical-v2/products/ProductModal.tsx
    - apps/frontend/components/technical-v2/products/ProductRowDetails.tsx (2nd row)
    - apps/frontend/components/technical-v2/products/ProductActionsMenu.tsx
    - apps/frontend/components/technical-v2/products/CloneProductModal.tsx
Requirements:
  must_have:
    - 2nd row details (GTIN-14, Supplier, Stock, Allergen badges)
    - Actions menu [⋮] with 8 options (View, Edit, Allergens, BOMs, History, Clone, Status, Delete)
    - All 4 states (Loading, Success, Empty, Error) per wireframe
    - Search (min 2 chars) + Type filter + Status filter
    - Sortable columns (code, name, type, version, created)
    - Pagination (20/page)
  do_not:
    - Import from apps/frontend/app/(authenticated)/technical/ (v1 code)
    - Import from apps/frontend/components/technical/ (v1 components)
    - Copy-paste from v1 (read for logic only)
    - Mix ShadCN patterns (use consistent v2 approach)
    - Add features not in wireframe (MVP scope only)
Acceptance Criteria:
  - Compare rendered UI with TEC-001 ASCII wireframe line-by-line
  - All AC from 02.1.products-crud-types.md pass
  - No imports from v1 code (run: grep -r "technical/" page.tsx)
  - All 4 states render correctly
  - Actions menu matches wireframe exactly
Estimated Effort: 8-10 hours
```

#### **2.2 Materials (TEC-003, TEC-004) - Dzień 1-2**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Materials List (TEC-003) - simplified product view for RM only
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-003-materials-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-004-material-modal.md
Output:
  - apps/frontend/app/(authenticated)/technical-v2/materials/page.tsx
  - apps/frontend/components/technical-v2/materials/MaterialsDataTable.tsx
  - apps/frontend/components/technical-v2/materials/MaterialModal.tsx
Filter Logic:
  - Auto-filter: WHERE product_type = 'RM'
  - Simplified form (no shelf life, no finished goods fields)
Estimated Effort: 4-6 hours
```

#### **2.3 BOMs (TEC-005, TEC-006, TEC-006a) - Dzień 2-3**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build BOMs management (TEC-005, TEC-006, TEC-006a)
Priority: HIGH (TEC-006a is most complex screen in Technical)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-005-boms-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-006-bom-modal.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-006a-bom-items-detail.md
Story Files:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.4.boms-crud-validity.md
  - docs/2-MANAGEMENT/epics/current/02-technical/02.5.bom-items-management.md
Reusable:
  - lib/services/bom-service.ts ✅
  - lib/services/bom-item-service.ts ✅
  - lib/services/bom-item-alternative-service.ts ✅
  - lib/validation/bom-schemas.ts (verify fields)
Output Files:
  pages:
    - apps/frontend/app/(authenticated)/technical-v2/boms/page.tsx (TEC-005)
    - apps/frontend/app/(authenticated)/technical-v2/boms/[id]/page.tsx (TEC-006a)
  components:
    - components/technical-v2/boms/BOMsDataTable.tsx
    - components/technical-v2/boms/BOMModal.tsx (TEC-006)
    - components/technical-v2/boms/BOMItemsTable.tsx (with inline alternatives)
    - components/technical-v2/boms/AddItemModal.tsx
    - components/technical-v2/boms/AlternativeIngredientRow.tsx
    - components/technical-v2/boms/ByproductsTable.tsx
    - components/technical-v2/boms/SummaryPanel.tsx (cost + allergens)
    - components/technical-v2/boms/CloneBOMModal.tsx
    - components/technical-v2/boms/CompareBOMModal.tsx
Key Features:
  - ✅ TEC-005: Product Type filter + Date filter
  - ✅ TEC-006: Advanced Settings accordion
  - ✅ TEC-006a: Alternatives (FR-2.30)
  - ✅ TEC-006a: Byproducts (FR-2.27)
  - ✅ TEC-006a: Operation assignment (FR-2.31)
  - ✅ TEC-006a: Conditional flags (FR-2.26)
  - ✅ TEC-006a: Summary panel (expandable)
Estimated Effort: 16-20 hours (TEC-006a alone = 12-16h)
```

#### **2.4 Routings (TEC-007, TEC-008, TEC-008a) - Dzień 3-4**

**Agent handoff:**
```yaml
Agent: FRONTEND-DEV
Task: Build Routings + Operations (TEC-007, TEC-008, TEC-008a)
Critical: TEC-008a is NEW SCREEN (no existing code)
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-007-routings-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-008-routing-modal.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-008a-routing-detail.md
Story Files:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.7.routings-crud.md
  - docs/2-MANAGEMENT/epics/current/02-technical/02.8.routing-operations.md
Reusable:
  - lib/services/routing-service.ts ✅
  - lib/validation/routing-schemas.ts (add ADR-009 if missing)
Output Files:
  pages:
    - apps/frontend/app/(authenticated)/technical-v2/routings/page.tsx (TEC-007)
    - apps/frontend/app/(authenticated)/technical-v2/routings/[id]/page.tsx (TEC-008a)
  components:
    - components/technical-v2/routings/RoutingsDataTable.tsx
    - components/technical-v2/routings/RoutingModal.tsx (TEC-008 + cost fields)
    - components/technical-v2/routings/CostConfigurationSection.tsx
    - components/technical-v2/routings/OperationsTable.tsx
    - components/technical-v2/routings/OperationModal.tsx (create/edit)
    - components/technical-v2/routings/CostSummaryPanel.tsx (expandable)
    - components/technical-v2/routings/RelatedBOMsSection.tsx
    - components/technical-v2/routings/ReorderButtons.tsx
New Fields (ADR-009):
  - setup_cost (DECIMAL 10,2)
  - working_cost_per_unit (DECIMAL 10,4)
  - overhead_percent (DECIMAL 5,2, 0-100%)
  - currency (ENUM: PLN, EUR, USD, GBP)
Key Features:
  - ✅ TEC-008: Cost Configuration section
  - ✅ TEC-008a: Operations CRUD inline (not modal-only)
  - ✅ TEC-008a: Reorder operations (sequence up/down)
  - ✅ TEC-008a: Cost breakdown expandable
  - ✅ TEC-008a: cleanup_time + instructions fields
  - ✅ TEC-008a: Related BOMs section
Estimated Effort: 14-18 hours (TEC-008a = 12-16h)
```

---

### **FAZA 3: NEW SCREENS (2-3 dni)**

Ekrany **NIE MAJĄCE** kodu v1 - buduj od zera:

#### **3.1 Nutrition (TEC-009, TEC-011)**
```yaml
Agent: FRONTEND-DEV
Task: Build Nutrition Calculator from scratch
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-009-nutrition-panel.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-011-nutrition-calculator.md
Story File:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.13.nutrition-calculation.md
Output:
  - apps/frontend/app/(authenticated)/technical-v2/nutrition/page.tsx
  - components/technical-v2/nutrition/NutritionPanel.tsx (TEC-009)
  - components/technical-v2/nutrition/NutritionCalculator.tsx (TEC-011)
Services:
  - lib/services/nutrition-service.ts (create new)
Estimated Effort: 8-10 hours
```

#### **3.2 Allergen Management (TEC-010, TEC-012)**
```yaml
Agent: FRONTEND-DEV
Task: Build Allergen Management from scratch
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-010-allergen-management.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-012-allergen-warnings.md
Story File:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.3.product-allergens.md
Output:
  - apps/frontend/app/(authenticated)/technical-v2/allergens/page.tsx
  - components/technical-v2/allergens/AllergenManagementView.tsx
  - components/technical-v2/allergens/AllergenWarnings.tsx
Services:
  - lib/services/allergen-service.ts (verify exists from Settings epic)
Estimated Effort: 6-8 hours
```

#### **3.3 Recipe Costing (TEC-013, TEC-015)**
```yaml
Agent: FRONTEND-DEV
Task: Build Recipe Costing & Cost History
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-013-recipe-costing.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-015-cost-history.md
Story Files:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.9.bom-routing-costs.md
  - docs/2-MANAGEMENT/epics/current/02-technical/02.15.cost-history-variance.md
Output:
  - apps/frontend/app/(authenticated)/technical-v2/costing/page.tsx
  - components/technical-v2/costing/RecipeCostingView.tsx
  - components/technical-v2/costing/CostBreakdownPanel.tsx
  - components/technical-v2/costing/CostHistoryChart.tsx
Services:
  - lib/services/costing-service.ts (verify exists)
Estimated Effort: 8-10 hours
```

#### **3.4 Shelf Life & Traceability (TEC-014, TEC-016)**
```yaml
Agent: FRONTEND-DEV
Task: Build Shelf Life Config & Traceability Search
Wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-014-shelf-life-config.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-016-traceability-search.md
Story Files:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.11.shelf-life-calculation.md
  - docs/2-MANAGEMENT/epics/current/02-technical/02.10a.traceability-configuration.md
Output:
  - apps/frontend/app/(authenticated)/technical-v2/shelf-life/page.tsx
  - apps/frontend/app/(authenticated)/technical-v2/traceability/page.tsx
Services:
  - lib/services/shelf-life-service.ts (create new)
  - lib/services/traceability-service.ts (create new)
Estimated Effort: 6-8 hours
```

#### **3.5 Dashboard (TEC-017)**
```yaml
Agent: FRONTEND-DEV
Task: Build Technical Dashboard
Wireframe:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-017-dashboard.md
Story File:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.12.technical-dashboard.md
Output:
  - apps/frontend/app/(authenticated)/technical-v2/dashboard/page.tsx
  - components/technical-v2/dashboard/StatsCards.tsx
  - components/technical-v2/dashboard/AllergenMatrix.tsx
  - components/technical-v2/dashboard/BOMVersionTimeline.tsx
Estimated Effort: 6-8 hours
```

---

### **FAZA 4: INTEGRATION & ROUTING (1 dzień)**

#### **4.1 Setup Routing Strategy**

**Option A: Symlink Swap (RECOMMENDED)**
```bash
# When v2 ready:
cd apps/frontend/app/\(authenticated\)/
mv technical technical-v1-backup
ln -s technical-v2 technical

# Instant atomic swap
# Rollback = rm technical && mv technical-v1-backup technical
```

**Option B: Direct Rename**
```bash
# Rename directories
mv apps/frontend/app/\(authenticated\)/technical apps/frontend/app/\(authenticated\)/technical-v1-backup
mv apps/frontend/app/\(authenticated\)/technical-v2 apps/frontend/app/\(authenticated\)/technical

# Commit:
git add .
git commit -m "feat(technical): migrate to v2 UI (wireframes TEC-001 to TEC-017)"
```

**Option C: Feature Flag (if gradual rollout needed)**
```typescript
// lib/config/features.ts
export const USE_TECHNICAL_V2 = process.env.NEXT_PUBLIC_TECHNICAL_V2 === 'true'

// app/(authenticated)/technical/page.tsx
import dynamic from 'next/dynamic'

const TechnicalPage = USE_TECHNICAL_V2
  ? dynamic(() => import('@/app/(authenticated)/technical-v2/page'))
  : dynamic(() => import('./page-v1'))

export default TechnicalPage
```

#### **4.2 Update Navigation**
```typescript
// Update:
components/navigation/NavigationSidebar.tsx

// During development:
/technical → /technical-v2 (test new UI)

// After swap:
/technical (already points to v2 via symlink)
```

#### **4.3 Update Internal Links**
```bash
# Search for hardcoded links to old routes:
grep -r "/technical/" apps/frontend/components/
grep -r "router.push('/technical" apps/frontend/

# Update any found to use relative paths or dynamic routing
```

---

### **FAZA 5: CLEANUP (0.5 dnia)**

```bash
# 1. Delete old code (after 1-2 weeks verification in production)
git rm -rf apps/frontend/app/\(authenticated\)/technical-v1-backup
git rm -rf apps/frontend/components/technical  # old components (if not migrated)

# 2. Update any remaining references
grep -r "technical-v2" apps/frontend/
# Should return ZERO results (all paths should be /technical)

# 3. Commit cleanup
git commit -m "chore: remove technical v1 code after v2 migration verified"

# 4. Delete backup tag (optional, after 30 days)
git tag -d technical-v1-backup-YYYYMMDD
```

---

## 🛡️ ISOLATION RULES (CRITICAL!)

### **FOR AGENTS:**

```yaml
# STRICT RULES dla agentów working on technical-v2:

ALLOWED:
  ✅ Read wireframes: docs/3-ARCHITECTURE/ux/wireframes/TEC-*.md
  ✅ Read story files: docs/2-MANAGEMENT/epics/current/02-technical/*.md
  ✅ Use services: apps/frontend/lib/services/*-service.ts
  ✅ Use schemas: apps/frontend/lib/validation/*-schemas.ts
  ✅ Create in: apps/frontend/app/(authenticated)/technical-v2/
  ✅ Create in: apps/frontend/components/technical-v2/
  ✅ Reference old code: FOR READING ONLY (understand logic, don't copy-paste)

FORBIDDEN:
  ❌ Edit files in: apps/frontend/app/(authenticated)/technical/ (v1)
  ❌ Edit files in: apps/frontend/components/technical/ (v1)
  ❌ Import from v1 paths (app/(authenticated)/technical/*)
  ❌ Import from old components (components/technical/*)
  ❌ Copy-paste old components (rebuild from wireframe)
  ❌ "Mix" old and new UI patterns
```

---

## 📦 CO ZACHOWAĆ, CO USUNĄĆ

### **✅ ZACHOWAĆ (100% reuse):**

```bash
# Backend infrastructure
apps/frontend/lib/services/
  ├── bom-service.ts ✅
  ├── bom-item-service.ts ✅
  ├── bom-item-alternative-service.ts ✅
  ├── routing-service.ts ✅
  └── byproduct-service.ts ✅

apps/frontend/lib/validation/
  ├── bom-schemas.ts ✅ (verify vs wireframes, may need updates)
  ├── product-schemas.ts ✅ (verify vs TEC-002)
  └── routing-schemas.ts ✅ (add ADR-009 fields if missing)

# API routes (100% reuse)
apps/frontend/app/api/technical/
  ├── products/ ✅
  ├── boms/ ✅
  └── routings/ ✅

# Tests (keep, may need updates)
apps/frontend/__tests__/lib/validation/
  ├── bom-schemas.test.ts ✅
  ├── product-schemas.test.ts ✅
  └── routing-schemas.test.ts ✅
```

### **⚠️ REVIEW & ADAPT:**

```bash
# Components that MIGHT be reusable (check vs wireframes first)
apps/frontend/components/technical/
  ├── TechnicalHeader.tsx ⚠️ (probably ok)
  ├── ProductFormModal.tsx ⚠️ (check vs TEC-002 compliance)
  ├── BOMFormModal.tsx ⚠️ (check vs TEC-006 compliance)
  └── BOMItemFormModal.tsx ⚠️ (check vs TEC-006a compliance)

# HOW TO REVIEW:
# 1. Read wireframe (e.g., TEC-002)
# 2. Read component code (e.g., ProductFormModal.tsx)
# 3. Compare field-by-field
# 4. IF 95%+ match → copy to technical-v2/ (with rename)
# 5. IF <95% match → rebuild from wireframe
```

### **❌ USUŃ (Delete after v2 verified):**

```bash
# Old page files (rebuild from scratch)
apps/frontend/app/(authenticated)/technical/
  ├── products/page.tsx ❌
  ├── boms/page.tsx ❌
  ├── boms/[id]/page.tsx ❌
  ├── routings/page.tsx ❌
  └── routings/[id]/page.tsx ❌

# Old components (if not wireframe-compliant)
apps/frontend/components/technical/
  ├── ProductFormModal.tsx ❌ (if not TEC-002 compliant)
  ├── BOMFormModal.tsx ❌ (if not TEC-006 compliant)
  ├── BOMCloneModal.tsx ❌ (rebuild)
  ├── BOMCompareModal.tsx ❌ (rebuild)
  └── GenealogyTree.tsx ❓ (keep if traceability works)
```

---

## 🎯 CHECKLIST: VERIFICATION CRITERIA

### **Before Swapping v1 → v2:**

```bash
# ✅ V2 Feature Parity Checklist

Products (TEC-001, TEC-002):
  ☐ List page renders with 2nd row details
  ☐ 2nd row shows: GTIN-14, Supplier, Stock levels, Allergen badges
  ☐ Actions menu [⋮] has all 8 options (View, Edit, Allergens, BOMs, History, Clone, Status, Delete)
  ☐ Product modal matches TEC-002 exactly (all sections: Basic, Identification, Procurement, Inventory, Shelf Life)
  ☐ All 4 states work (Loading, Success, Empty, Error)
  ☐ Search + Type filter + Status filter + Sort work
  ☐ Pagination (20/page) works
  ☐ Clone product works
  ☐ Version history panel works

Materials (TEC-003, TEC-004):
  ☐ Materials list filters RM products only
  ☐ Simplified modal (no shelf life section)
  ☐ All 4 states work

BOMs (TEC-005, TEC-006, TEC-006a):
  ☐ List has Product Type filter
  ☐ List has Date filter (Current, Future, Expired)
  ☐ BOM modal has Advanced Settings accordion
  ☐ Detail page (TEC-006a) has Alternatives section with add/edit
  ☐ Detail page has Byproducts table with CRUD
  ☐ Detail page has Operation assignment dropdowns
  ☐ Detail page has Summary panel (cost + allergens + flags)
  ☐ Summary panel expands/collapses
  ☐ Clone BOM works
  ☐ Compare BOMs works (diff view)

Routings (TEC-007, TEC-008, TEC-008a):
  ☐ List page matches TEC-007
  ☐ Modal has ADR-009 cost fields (setup_cost, working_cost_per_unit, overhead_percent, currency)
  ☐ Detail page (TEC-008a) fully implemented
  ☐ Operations table has inline CRUD
  ☐ Operation modal has cleanup_time + instructions fields
  ☐ Reorder operations works (up/down arrows)
  ☐ Cost summary panel expands with breakdown
  ☐ Related BOMs section shows linked BOMs

New Screens:
  ☐ Nutrition calculator works (TEC-011)
  ☐ Nutrition panel component works (TEC-009)
  ☐ Allergen management works (TEC-010)
  ☐ Allergen warnings component works (TEC-012)
  ☐ Recipe costing works (TEC-013)
  ☐ Cost history chart works (TEC-015)
  ☐ Shelf life config works (TEC-014)
  ☐ Traceability search works (TEC-016)
  ☐ Dashboard updated (TEC-017)

Integration:
  ☐ All navigation links work
  ☐ No broken imports (run import audit below)
  ☐ All API endpoints respond
  ☐ RLS policies enforced
  ☐ Tests pass (unit + integration)
  ☐ No console errors
  ☐ TypeScript compiles with zero errors
```

### **Import Audit Commands:**

```bash
# Run before swap to verify isolation:

# 1. Check v2 doesn't import from v1
grep -r "from '@/app/(authenticated)/technical/'" apps/frontend/app/\(authenticated\)/technical-v2/
# → Should return ZERO results

grep -r "from '@/components/technical/'" apps/frontend/components/technical-v2/
# → Should return ZERO results

# 2. Check all imports resolve
cd apps/frontend
npx tsc --noEmit
# → Should show zero errors

# 3. Check no hardcoded v1 routes
grep -r "/technical/" apps/frontend/components/technical-v2/ | grep -v "/technical-v2/"
# → Review any results (should be minimal)
```

---

## 🔄 MIGRATION SEQUENCE

### **Recommended Timeline:**

```
Week 1: Core Pages
├── Day 1: Foundation (shared components) + Products (TEC-001, TEC-002)
├── Day 2: Materials (TEC-003, TEC-004) + BOMs List (TEC-005, TEC-006)
├── Day 3: BOM Items Detail (TEC-006a) ← LONGEST (12-16h)
├── Day 4: Routings List (TEC-007, TEC-008)
└── Day 5: Routing Detail (TEC-008a) ← NEW SCREEN (12-16h)

Week 2: Advanced Features
├── Day 6: Nutrition (TEC-009, TEC-011)
├── Day 7: Allergens (TEC-010, TEC-012)
├── Day 8: Costing (TEC-013, TEC-015)
├── Day 9: Shelf Life + Traceability (TEC-014, TEC-016)
└── Day 10: Dashboard (TEC-017) + Integration + Testing

Week 3: Polish & Deploy
├── Day 11-12: Bug fixes, UI polish, accessibility audit
├── Day 13: Integration testing, E2E tests
├── Day 14: Atomic swap (v1 → v2)
└── Day 15: Monitor, rollback plan ready, cleanup v1 (if stable)
```

**CRITICAL PATH:**
1. Shared components (Foundation) → unlocks everything
2. Products → needed for BOMs & Materials
3. BOMs → needed for Costing/Nutrition
4. Routings → needed for Operations/Costing

---

## 🚀 EXECUTION STRATEGY

### **APPROACH: "One Agent, One Screen, One PR"**

```bash
# For each wireframe:

# 1. Create isolated branch
git checkout feature/technical-v2-rebuild
git checkout -b feature/tech-v2-TEC-001-products

# 2. Agent builds ONLY that screen
# Agent context: TEC-001 wireframe + 02.1 story + shared components

# 3. Test in isolation
npm run test -- products
npm run type-check

# 4. PR Review
# Compare: Wireframe TEC-001 vs Rendered UI (side-by-side)
# Checklist: All 4 states, all AC from 02.1, no v1 imports

# 5. Merge to feature/technical-v2-rebuild
git checkout feature/technical-v2-rebuild
git merge feature/tech-v2-TEC-001-products --no-ff

# 6. Repeat for next screen
git checkout -b feature/tech-v2-TEC-003-materials
```

**Benefits:**
- ✅ Clear scope per agent (one wireframe)
- ✅ Reviewable in isolation
- ✅ Rollback individual screens if needed
- ✅ Parallel work possible (TEC-001 + TEC-007 simultaneously)
- ✅ Clean git history (one commit per screen)

---

## 💻 FINAL FILE STRUCTURE

### **After v2 Complete & Swap:**

```
apps/frontend/
├── app/(authenticated)/
│   └── technical/  ← v2 code (after swap from technical-v2)
│       ├── page.tsx (module home/dashboard)
│       ├── products/
│       │   ├── page.tsx (TEC-001: Products List)
│       │   └── [id]/page.tsx (Product Detail)
│       ├── materials/  ← NEW
│       │   └── page.tsx (TEC-003: Materials List)
│       ├── boms/
│       │   ├── page.tsx (TEC-005: BOMs List)
│       │   └── [id]/
│       │       └── page.tsx (TEC-006a: BOM Items Detail)
│       ├── routings/
│       │   ├── page.tsx (TEC-007: Routings List)
│       │   └── [id]/
│       │       └── page.tsx (TEC-008a: Routing Detail) ← NEW
│       ├── nutrition/  ← NEW
│       │   └── page.tsx (TEC-011: Nutrition Calculator)
│       ├── allergens/  ← NEW
│       │   └── page.tsx (TEC-010: Allergen Management)
│       ├── costing/  ← NEW
│       │   └── page.tsx (TEC-013: Recipe Costing)
│       ├── shelf-life/  ← NEW
│       │   └── page.tsx (TEC-014: Shelf Life Config)
│       └── traceability/
│           └── page.tsx (TEC-016: Traceability Search)
│
├── components/
│   └── technical/  ← v2 components (after swap)
│       ├── shared/  ← NEW (reusable patterns)
│       │   ├── DataTableWithDetails.tsx
│       │   ├── ActionsMenu.tsx
│       │   ├── StatusBadge.tsx
│       │   ├── TypeBadge.tsx
│       │   ├── EmptyState.tsx
│       │   ├── ErrorState.tsx
│       │   └── LoadingState.tsx
│       ├── products/
│       │   ├── ProductsDataTable.tsx
│       │   ├── ProductModal.tsx (TEC-002)
│       │   ├── ProductRowDetails.tsx (2nd row)
│       │   ├── ProductActionsMenu.tsx ([⋮] menu)
│       │   └── CloneProductModal.tsx
│       ├── materials/
│       │   ├── MaterialsDataTable.tsx
│       │   └── MaterialModal.tsx (TEC-004)
│       ├── boms/
│       │   ├── BOMsDataTable.tsx
│       │   ├── BOMModal.tsx (TEC-006)
│       │   ├── BOMItemsTable.tsx (with alternatives)
│       │   ├── AddItemModal.tsx
│       │   ├── AlternativeIngredientRow.tsx (expandable)
│       │   ├── ByproductsTable.tsx
│       │   ├── SummaryPanel.tsx (cost + allergens + flags)
│       │   ├── CloneBOMModal.tsx
│       │   └── CompareBOMModal.tsx
│       ├── routings/
│       │   ├── RoutingsDataTable.tsx
│       │   ├── RoutingModal.tsx (TEC-008 + ADR-009 cost fields)
│       │   ├── CostConfigurationSection.tsx
│       │   ├── OperationsTable.tsx (CRUD inline)
│       │   ├── OperationModal.tsx
│       │   ├── CostSummaryPanel.tsx (expandable breakdown)
│       │   ├── RelatedBOMsSection.tsx
│       │   └── ReorderButtons.tsx
│       ├── nutrition/
│       │   ├── NutritionPanel.tsx (TEC-009)
│       │   └── NutritionCalculator.tsx (TEC-011)
│       ├── allergens/
│       │   ├── AllergenManagementView.tsx (TEC-010)
│       │   └── AllergenWarnings.tsx (TEC-012)
│       └── costing/
│           ├── RecipeCostingView.tsx (TEC-013)
│           └── CostHistoryChart.tsx (TEC-015)
│
└── lib/
    ├── services/ ✅ (keep all, verify exist)
    ├── validation/ ✅ (verify + update if needed)
    └── types/ ✅ (keep all)
```

---

## 📈 SUCCESS METRICS

### **How to know v2 is ready:**

```bash
# 1. Visual comparison
# Open TEC-001 wireframe side-by-side with http://localhost:3000/technical-v2/products
# → Should match ASCII wireframe line-by-line

# 2. Import audit (run all 3 commands)
grep -r "from '@/app/(authenticated)/technical/'" apps/frontend/app/\(authenticated\)/technical-v2/
# → Should return ZERO results

grep -r "from '@/components/technical/'" apps/frontend/components/technical-v2/
# → Should return ZERO results

grep -r "import.*technical-v1" apps/frontend/
# → Should return ZERO results

# 3. Feature parity
# Run through Epic 02 AC checklist (all 15 stories)
# → All AC should pass in v2

# 4. No regressions
# All v1 functionality should exist in v2
# → Check docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md coverage

# 5. Performance (from Epic 02 DoD)
# Products list < 1s (500ms target)
# BOM explosion < 2s
# Search response < 300ms
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
git commit -m "chore: checkpoint before technical v2 rebuild"

# 2. Create feature branch
git checkout -b feature/technical-v2-rebuild

# 3. Tag old code
git tag technical-v1-backup-$(date +%Y%m%d)

# 4. Create parallel structure
mkdir -p apps/frontend/app/\(authenticated\)/technical-v2/{products,materials,boms,routings,nutrition,allergens,costing,shelf-life,traceability,dashboard}
mkdir -p apps/frontend/components/technical-v2/{shared,products,materials,boms,routings,nutrition,allergens,costing}

# 5. Create README for agents
cat > apps/frontend/app/\(authenticated\)/technical-v2/README.md <<'EOF'
# Technical Module v2 - Clean Rebuild

**Status:** In Development
**Wireframes:** docs/3-ARCHITECTURE/ux/wireframes/TEC-*.md (19 screens)
**Stories:** docs/2-MANAGEMENT/epics/current/02-technical/ (15 stories)

## Rules for Agents

✅ ALLOWED:
- Build pages in this directory (technical-v2/)
- Use services from lib/services/
- Use schemas from lib/validation/
- Create new components in components/technical-v2/
- Read old code (app/(authenticated)/technical/) FOR REFERENCE ONLY

❌ FORBIDDEN:
- Edit files in app/(authenticated)/technical/ (v1 code - frozen)
- Edit files in components/technical/ (v1 components - frozen)
- Import from v1 paths
- Copy-paste v1 code

## Reference

Old code available for READING ONLY:
- app/(authenticated)/technical/ ← understand logic, don't copy

## Wireframe Priority Order

1. TEC-001, TEC-002: Products (foundation)
2. TEC-003, TEC-004: Materials
3. TEC-005, TEC-006, TEC-006a: BOMs (complex)
4. TEC-007, TEC-008, TEC-008a: Routings
5. TEC-009 to TEC-017: Advanced features
EOF

# 6. Create isolation checker script
cat > scripts/check-technical-v2-isolation.sh <<'EOF'
#!/bin/bash
echo "🔍 Checking Technical v2 isolation..."

echo ""
echo "1. Checking for v1 imports in v2 code..."
BAD_IMPORTS=$(grep -r "from '@/app/(authenticated)/technical/'" apps/frontend/app/\(authenticated\)/technical-v2/ 2>/dev/null)
if [ -z "$BAD_IMPORTS" ]; then
  echo "✅ No v1 app imports found"
else
  echo "❌ Found v1 app imports:"
  echo "$BAD_IMPORTS"
  exit 1
fi

echo ""
echo "2. Checking for v1 component imports in v2..."
BAD_COMP=$(grep -r "from '@/components/technical/'" apps/frontend/components/technical-v2/ 2>/dev/null)
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
echo "✅ All isolation checks passed!"
EOF

chmod +x scripts/check-technical-v2-isolation.sh

# 7. Commit structure
git add apps/frontend/app/\(authenticated\)/technical-v2/
git add apps/frontend/components/technical-v2/
git add scripts/check-technical-v2-isolation.sh
git commit -m "feat(technical): create v2 structure for clean rebuild

- Create technical-v2 parallel directory structure
- Add README with agent rules
- Add isolation checker script
- Freeze technical/ (v1) as read-only reference
"

echo ""
echo "✅ Setup complete! Ready to launch agents."
echo ""
echo "Next step: Launch FRONTEND-DEV agent with TEC-001 wireframe"
echo "Command: Launch agent with handoff from section 2.1 above"
```

---

## 🎬 AGENT LAUNCH TEMPLATE

### **Story 02.1: Products (TEC-001, TEC-002)**

```yaml
agent: frontend-dev
epic: "02-technical"
story: "02.1"
task: "Build Products List (TEC-001) and Product Modal (TEC-002) from wireframes - CLEAN BUILD"

# Input context
wireframes:
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-001-products-list.md
  - docs/3-ARCHITECTURE/ux/wireframes/TEC-002-product-modal.md
story_file:
  - docs/2-MANAGEMENT/epics/current/02-technical/02.1.products-crud-types.md
reference_code_read_only:
  - apps/frontend/app/(authenticated)/technical/products/page.tsx (READ ONLY - for logic understanding)

# Reusable assets
reusable:
  services:
    - apps/frontend/lib/services/product-service.ts (verify exists, create if not)
  schemas:
    - apps/frontend/lib/validation/product-schemas.ts (verify vs TEC-002 fields)
  shared_components:
    - apps/frontend/components/technical-v2/shared/DataTableWithDetails.tsx
    - apps/frontend/components/technical-v2/shared/ActionsMenu.tsx
    - apps/frontend/components/technical-v2/shared/StatusBadge.tsx
    - apps/frontend/components/technical-v2/shared/TypeBadge.tsx

# Output files to create
output:
  pages:
    - apps/frontend/app/(authenticated)/technical-v2/products/page.tsx
  components:
    - apps/frontend/components/technical-v2/products/ProductsDataTable.tsx
    - apps/frontend/components/technical-v2/products/ProductModal.tsx
    - apps/frontend/components/technical-v2/products/ProductRowDetails.tsx
    - apps/frontend/components/technical-v2/products/ProductActionsMenu.tsx
    - apps/frontend/components/technical-v2/products/CloneProductModal.tsx
    - apps/frontend/components/technical-v2/products/VersionHistoryPanel.tsx

# Critical requirements
requirements:
  wireframe_compliance:
    - 2nd row details (GTIN-14, Supplier name, Stock levels, Allergen badges)
    - Actions menu [⋮] with 8 options exactly as in TEC-001
    - All 4 states (Loading, Success, Empty, Error) match ASCII wireframes
    - Search (min 2 chars) + Type filter + Status filter + Sort
    - Pagination (20 per page)
  modal_compliance:
    - All TEC-002 sections: Basic Info, Identification, Procurement (ADR-010), Inventory, Shelf Life
    - GTIN-14 validation
    - SKU immutability enforcement (locked in edit mode)
    - Product type immutability (locked in edit mode)

# Strict isolation
isolation:
  allowed_imports:
    - "@/lib/services/*"
    - "@/lib/validation/*"
    - "@/lib/types/*"
    - "@/components/technical-v2/*"
    - "@/components/ui/*"
    - "@/hooks/*"
  forbidden_imports:
    - "@/app/(authenticated)/technical/*" (v1 pages)
    - "@/components/technical/*" (v1 components)
  verification:
    - Run: grep -r "from '@/app/(authenticated)/technical/'" apps/frontend/app/\(authenticated\)/technical-v2/products/
    - Should return: ZERO results

# Acceptance criteria
acceptance:
  - [ ] Rendered UI matches TEC-001 ASCII wireframe line-by-line
  - [ ] All AC from 02.1.products-crud-types.md pass
  - [ ] Import audit passes (zero v1 imports)
  - [ ] All 4 states render correctly
  - [ ] Actions menu has exactly 8 options from wireframe
  - [ ] 2nd row details show all fields from wireframe
  - [ ] Product modal has all sections from TEC-002
  - [ ] TypeScript compiles with zero errors
  - [ ] No console errors in browser

# Effort
estimated_hours: 8-10
priority: HIGH (foundation for BOMs)
complexity: MEDIUM
```

---

## 📝 AGENT HANDOFF TEMPLATES

### **Template for Each Story:**

Create 15 files (one per story):
```bash
docs/2-MANAGEMENT/epics/current/02-technical/handoffs/
  ├── 02.1-products-handoff.yaml
  ├── 02.3-materials-handoff.yaml
  ├── 02.4-boms-handoff.yaml
  ├── 02.5-bom-items-handoff.yaml
  ├── 02.7-routings-handoff.yaml
  ├── 02.8-routing-ops-handoff.yaml
  ├── 02.9-costing-handoff.yaml
  ├── 02.10a-traceability-handoff.yaml
  ├── 02.11-shelf-life-handoff.yaml
  ├── 02.12-dashboard-handoff.yaml
  └── 02.13-nutrition-handoff.yaml
```

---

## 🔄 ROLLBACK PLAN

### **If v2 has critical bugs:**

```bash
# Immediate rollback (< 5 minutes):

# Option A: Symlink swap back
cd apps/frontend/app/\(authenticated\)/
rm technical
mv technical-v1-backup technical
git add .
git commit -m "revert: rollback to technical v1 due to [ISSUE]"
git push

# Option B: Git revert
git revert HEAD  # if swap was last commit
git push

# Option C: Branch rollback
git checkout main
git branch -D feature/technical-v2-rebuild
git push origin --delete feature/technical-v2-rebuild
```

### **Rollback decision criteria:**

```
Rollback if ANY of these occur within first 48h after swap:
❌ Critical bug: Data loss
❌ Critical bug: Auth bypass
❌ Performance: Page load >5s
❌ Accessibility: Screen reader broken
❌ Business logic: Wrong cost calculations
❌ User blocker: Cannot create products/BOMs

Don't rollback for:
✅ Minor UI glitches (fix forward)
✅ Missing icons (fix forward)
✅ Cosmetic issues (fix forward)
```

---

## 💡 BEST PRACTICES

### **For Agents:**

1. **Read wireframe FIRST** (before looking at any code)
2. **Build from wireframe** (not from old code)
3. **Reference old code** for logic only (don't copy UI)
4. **Test isolation** after every file created
5. **Verify all 4 states** before marking done

### **For Code Reviewers:**

1. **Side-by-side comparison** (wireframe ASCII vs rendered UI)
2. **Import audit** (zero v1 imports)
3. **Feature completeness** (all wireframe components present)
4. **Accessibility** (ARIA labels, keyboard nav)
5. **Performance** (meet Epic 02 DoD targets)

### **For Project Manager:**

1. **Track progress** (19 wireframes, check off as completed)
2. **Monitor isolation** (run check script daily)
3. **Review PRs** (one per wireframe)
4. **Plan swap date** (when all 19 wireframes done + tested)
5. **Prepare rollback** (backup v1 code, test rollback procedure)

---

## 🎯 FINAL CHECKLIST (Before Atomic Swap)

```bash
# Run before swapping technical-v2 → technical:

☐ All 19 wireframes implemented (TEC-001 to TEC-017)
☐ Import audit passes (zero v1 imports)
☐ TypeScript compiles (zero errors)
☐ All tests pass (unit + integration)
☐ Visual QA complete (all wireframes vs UI)
☐ Accessibility audit complete (WCAG 2.1 AA)
☐ Performance benchmarks met (Epic 02 DoD)
☐ All Epic 02 stories AC pass
☐ No console errors in browser
☐ Rollback plan tested (can revert in <5 min)
☐ Backup created (technical-v1-backup/ exists)
☐ Navigation updated (sidebar links to /technical-v2 during dev)
☐ API endpoints verified (all respond correctly)
☐ RLS policies enforced (org isolation works)
☐ Mobile responsive (test on 3 screen sizes)

# If all ☐ checked → READY FOR SWAP
```

---

## 📅 ESTIMATED TIMELINE

### **Conservative Estimate:**

```
Phase 0: Preparation          → 2 hours
Phase 1: Foundation           → 1 day (shared components)
Phase 2: Core Pages           → 5 days (Products, Materials, BOMs, Routings)
  - Products (TEC-001, TEC-002): 1 day
  - Materials (TEC-003, TEC-004): 0.5 day
  - BOMs (TEC-005, TEC-006, TEC-006a): 2 days
  - Routings (TEC-007, TEC-008, TEC-008a): 1.5 days
Phase 3: Advanced Screens     → 5 days (Nutrition, Allergens, Costing, etc.)
Phase 4: Integration          → 1 day (swap + testing)
Phase 5: Cleanup              → 0.5 day

TOTAL: ~13 days (2.5 weeks)
```

### **Aggressive Estimate (parallel agents):**

```
With 2-3 agents working in parallel:
- Week 1: Foundation + Core Pages (TEC-001 to TEC-008a)
- Week 2: Advanced Screens (TEC-009 to TEC-017) + Integration
- TOTAL: ~10 days (2 weeks)
```

---

## 🏁 SUCCESS DEFINITION

**v2 is ready when:**

1. ✅ All 19 wireframes have corresponding working UI
2. ✅ Visual inspection confirms 95%+ match to ASCII wireframes
3. ✅ All 15 Epic 02 stories have AC passing
4. ✅ Import audit shows zero v1 dependencies
5. ✅ Performance meets Epic 02 DoD (Products <1s, BOM <2s)
6. ✅ Accessibility audit passes (WCAG 2.1 AA)
7. ✅ TypeScript compiles with zero errors
8. ✅ All tests pass (100% of existing tests + new tests)
9. ✅ Rollback plan tested and documented
10. ✅ Team sign-off (Frontend Lead + Product Owner)

**Then: Execute atomic swap (technical-v2 → technical)**

---

**Document Version:** 1.0
**Created:** 2025-12-23
**Owner:** Technical Lead
**Review Date:** After Phase 2 complete
**Next Update:** After atomic swap
