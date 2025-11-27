# UX Design Specification: Technical Module

**Module**: Technical (BOM Management, Products, Routings, Allergens)
**Priority**: P1 🟡 (Critical - Manufacturing Core)
**Created**: 2025-11-15
**Updated**: 2025-11-27 - Integrated with Shared UI System
**Status**: v2.0 - Hybrid (Existing Design + Shared System)
**Methodology**: 7-Step UX Design Process + Shared System Integration

---

## 🔗 INTEGRATION WITH SHARED UI SYSTEM (v2.0 - NEW)

This Technical Module design now **integrates with** the [Shared UI Design System](./ux-design-shared-system.md) while **maintaining existing features** (Timeline, Allergen Matrix, BOM Variants).

### Applied from Shared System:
- ✅ **ModuleHeader**: `Technical | Products | BOMs | Routings | Tracing | ⚙️` (consistent across all modules)
- ✅ **Stats Cards**: 4 cards on dashboard (Products, BOMs, Routings, Traceability) - 120px height, 2×2 grid
- ✅ **DataTable Base**: Products, BOMs, Routings tables (sortable, filterable, paginated)
- ✅ **Colors**: app-colors.ts (green-600 Create, gray-600 View/Edit, red-600 Delete)
- ✅ **Mobile Responsive**: Table → Card view on < 768px
- ✅ **Dark Mode Toggle**: Settings → Appearance
- ✅ **Keyboard Navigation**: Tab, Enter, Escape support

### Technical-Specific Features (Enhanced):
- 🎯 **BOM Timeline** (Variant B) - Visual Gantt chart for version management (overlap detection)
- 🎯 **Allergen Matrix** (Variant C) - Heatmap showing cross-contamination risks (P1)
- 🎯 **Integrated Routings** (Variant D) - Linked to Products/BOMs (not separate tab)
- 🎯 **BOM Grouping** (Dashboard) - Products grouped by type (Raw Materials, Finished Goods, Process)

### Layout Structure:

```
┌─────────────────────────────────────────┐
│ ModuleHeader: Technical│Products│BOMs...│  ← Shared
├─────────────────────────────────────────┤
│ [Create Product] [Create BOM] [Create RT]│  ← Shared buttons
├─────────────────────────────────────────┤
│ [Stats Cards: 4 cards, 2×2 grid]        │  ← Shared + stats API
├─────────────────────────────────────────┤
│ View Selector: [Table] [Timeline] [Matrix] ← Technical-specific
├─────────────────────────────────────────┤
│ Content Area:                           │
│ ├─ Table View (Standard DataTable)      │  ← Shared
│ ├─ Timeline View (BOM versions gantt)   │  ← Technical-specific
│ └─ Matrix View (Allergen heatmap)       │  ← Technical-specific
│                                         │
└─────────────────────────────────────────┘
```

### Stories Affected:
- 02-25: TechnicalHeader + TechnicalActionButtons (from Shared)
- 02-26: TechnicalStatsCards (4 cards from Shared)
- 02-27: Standard Tables (ProductsTable, BOMsTable, RoutingsTable from Shared)
- 02-28: Mobile responsive (from Shared)
- **Additional**: BOM Timeline + Allergen Matrix (Technical-specific, existing design kept)

---

## Executive Summary

### Business Context

The **Technical Module** is the heart of MonoPilot's manufacturing intelligence, managing:
- **Products** (Raw Materials, Finished Goods, Process intermediates)
- **BOMs (Bills of Materials)** with date-based versioning
- **Routings** (production operations sequences)
- **Allergen management** and cross-contamination tracking

**Current Pain Points**:
1. **Tab Overload**: 5 tabs (Meat, Dry Goods, Finished Goods, Process, Archive) create excessive context switching
2. **Version Confusion**: Date-based BOM versions lack visual timeline (overlaps hard to spot)
3. **Allergen Blindness**: No matrix view for cross-contamination risks
4. **Routing Disconnect**: Routings separated from Products/BOMs conceptually

**Target Users**:
- **Ewa (Technical Manager)**: Manages BOMs, versions, allergens (daily use)
- **Tomasz (Production Planner)**: Selects BOMs for Work Orders (weekly use)
- **Karol (R&D Technologist)**: Creates new products, updates recipes (monthly use)

### Design Strategy: From 5 Tabs to 3 Groups

**Rejected**: Variant A (Keep 5 tabs) - perpetuates navigation fatigue
**Selected (Hybrid)**:
- **Variant B (P1 MVP)**: Grouped Dashboard (3 categories: Raw Materials, Finished Products, Settings) + Visual BOM Timeline
- **Variant C (P1)**: Integrated Routings (linked to Products/BOMs, not separate tab)
- **Variant D (P2)**: Allergen Matrix (heatmap showing cross-contamination risks)

**Key Innovation**: Visual BOM Timeline with overlap detection and version gantt chart.

### Business Impact

**Time Savings**:
- BOM version selection: **5 min → 30 sec** (visual timeline vs date guessing)
- Allergen audit: **2 hours → 15 min** (matrix vs manual spreadsheet)
- Product lookup: **3 clicks → 1 click** (grouped dashboard vs tab switching)

**Risk Reduction**:
- **90% fewer version conflicts** (overlap detection warns before activation)
- **100% allergen audit coverage** (matrix forces review before approval)

**ROI**: 15 hours/week saved across 3 technical staff = **€18,000/year** (at €25/hour)

---

## Step 1: Project and Users Confirmation

### 1.1 Module Scope

**In Scope**:
1. **Product Catalog Management**
   - Raw Materials (Meat, Dry Goods)
   - Finished Goods (Composite products)
   - Process items (intermediates)
   - Product attributes: SKU, name, group, type, UoM, allergens, tax codes

2. **BOM (Bill of Materials) Management**
   - Multi-version BOMs with date-based activation (`effective_from` → `effective_to`)
   - BOM items (ingredients, quantities, scrap%, UoM, `consume_whole_lp` flag)
   - BOM lifecycle: Draft → Active → Phased Out → Inactive
   - Version cloning and history tracking

3. **Routing Management**
   - Operation sequences (Step 1 → Step 2 → Step 3)
   - Machine assignments per operation
   - Time estimates (setup, run time per unit)
   - Linked to Products (FG/PR only)

4. **Allergen Management**
   - 14 major allergens (EU Regulation 1169/2011)
   - Product-allergen linking
   - Cross-contamination tracking
   - Allergen audit reports

**Out of Scope (Separate Modules)**:
- NPD (New Product Development) - Growth/Enterprise phase
- Quality (Inspections, NCRs) - QA Module (separate spec)
- Costing (BOM costing, cost rollup) - Phase 4 Epic 4.4

### 1.2 User Personas

#### Persona 1: Ewa - Technical Manager
**Role**: Technical Manager
**Age**: 42
**Experience**: 15 years in food manufacturing (8 years as Technical Manager)
**Tech Savviness**: Medium (comfortable with ERP, Excel power user, hesitant with new UI patterns)

**Daily Tasks**:
- Review and approve new BOM versions created by R&D
- Audit allergen declarations before product launches
- Update BOM versions when supplier recipes change
- Coordinate with Planning to phase out old BOM versions

**Pain Points** (Current 5-Tab System):
1. **Version Confusion**: "I have 3 active BOM versions for Beef Burger. Which one is valid on Nov 20? I need to check dates in a table."
2. **Tab Fatigue**: "To review a Finished Good BOM, I click Finished Goods tab, then scroll. To check a Meat ingredient, I switch to Meat tab. Back and forth 10 times."
3. **Allergen Blindness**: "I export BOMs to Excel to check if we have cross-contamination risks. Takes 2 hours for a full audit."
4. **Overlap Fear**: "I once activated a new BOM version with overlapping dates. We produced 500 units with the wrong recipe before catching it."

**Goals**:
- Quickly validate which BOM version is active for any date
- See all products (RM + FG) in one view when reviewing a BOM
- Get warned BEFORE activating a BOM version that overlaps existing dates
- Generate allergen audit reports in 15 minutes, not 2 hours

**Quote**: *"I don't want to click 5 tabs to see what's in a burger. Just show me the recipe timeline."*

---

#### Persona 2: Tomasz - Production Planner
**Role**: Production Planner
**Age**: 35
**Experience**: 10 years in production planning (5 years at current company)
**Tech Savviness**: High (uses advanced Excel, comfortable with new tools)

**Weekly Tasks**:
- Create Work Orders for next week's production runs
- Select correct BOM version based on WO scheduled date
- Check routing times to estimate production capacity
- Coordinate with Warehouse on ingredient availability

**Pain Points**:
1. **BOM Version Guessing**: "When I create a WO for Nov 25, I see 3 BOM versions. I have to manually check `effective_from` dates to pick the right one."
2. **Routing Disconnect**: "Routings are separate from BOMs. I have to remember that 'Beef Burger' uses Routing 'R-001'. Why not link them?"
3. **No Timeline View**: "I can't see visually when a BOM version becomes active. I need a gantt chart for versions."

**Goals**:
- Automatically see which BOM version is valid for a given date (visual timeline)
- See Routing linked to Product/BOM (integrated view)
- Understand BOM lifecycle (when does Draft → Active → Phased Out happen?)

**Quote**: *"If I'm scheduling a WO for Dec 1, just show me the active BOM for that date. Don't make me read tables."*

---

#### Persona 3: Karol - R&D Technologist
**Role**: R&D Technologist
**Age**: 29
**Experience**: 5 years in food R&D (2 years at current company)
**Tech Savviness**: High (familiar with PLM tools, CAD, ERP)

**Monthly Tasks**:
- Develop new product recipes (BOM creation)
- Test ingredient substitutions (BOM version updates)
- Document allergen changes for compliance
- Clone existing BOMs for new product variants

**Pain Points**:
1. **Version Cloning Tedium**: "To create a 'Beef Burger Gluten-Free' variant, I clone the 'Beef Burger' BOM and manually edit 8 ingredients. Takes 30 minutes."
2. **Allergen Audit Anxiety**: "When I swap an ingredient, I have to manually check if the new allergen profile conflicts with existing cross-contamination rules."
3. **No Draft Preview**: "I create a Draft BOM but can't see how it compares to the Active version. I export both to Excel to diff them."

**Goals**:
- Clone BOMs with one click, auto-populate version fields
- See visual diff between Draft and Active BOM versions
- Get allergen warnings BEFORE saving a BOM change
- Understand BOM lifecycle (when can I activate a Draft?)

**Quote**: *"I'm innovating recipes, not fighting the UI. Let me clone, edit, activate—done."*

---

### 1.3 Current State Analysis

#### Current Implementation (as of 2025-11-15)

**File**: `apps/frontend/app/technical/bom/page.tsx`
**Component**: `BomCatalogClient.tsx`

**Current UI Structure**: Tab-Based (5 Tabs)

```
┌─────────────────────────────────────────────────────────────┐
│ Technical Module                                            │
├─────────────────────────────────────────────────────────────┤
│ [ Meat ] [ Dry Goods ] [ Finished Goods ] [ Process ] [ Archive ] │
├─────────────────────────────────────────────────────────────┤
│ (Active Tab Content: Table of Products)                    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ SKU      │ Name           │ Group      │ Type       │   │
│ │ RM-BEEF  │ Beef Mince     │ MEAT       │ RM_MEAT    │   │
│ │ RM-PORK  │ Pork Mince     │ MEAT       │ RM_MEAT    │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Current Tab Mapping**:
1. **Meat Tab**: `product_group = 'MEAT'` (Raw Material Meat)
2. **Dry Goods Tab**: `product_group = 'DRYGOODS'` (DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE)
3. **Finished Goods Tab**: `product_group = 'COMPOSITE' AND product_type = 'FG'`
4. **Process Tab**: `product_group = 'COMPOSITE' AND product_type = 'PR'`
5. **Archive Tab**: (Currently empty placeholder)

**Code Snippet** (`apps/frontend/app/technical/bom/page.tsx:10-30`):
```typescript
async function filterProducts(category: string) {
  const allProducts = await ProductsServerAPI.getAll();

  let filtered: any[] = [];

  switch (category) {
    case 'MEAT':
      filtered = allProducts.filter(p => p.product_group === 'MEAT');
      break;
    case 'DRYGOODS':
      filtered = allProducts.filter(p => p.product_group === 'DRYGOODS');
      break;
    case 'FINISHED_GOODS':
      filtered = allProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG');
      break;
    case 'PROCESS':
      filtered = allProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR');
      break;
    default:
      filtered = [];
  }

  return { data: filtered, current_page: 1, last_page: 1, total: filtered.length };
}
```

**Analysis**: Server-side filtering creates 5 separate data silos, forcing UI to use tabs for navigation.

---

#### Pain Points with Current System

**1. Tab Overload (Similar to Settings Module's 8-Tab Problem)**

**Issue**: Users must remember which tab contains which product type.

**Example Workflow** (Ewa reviewing Beef Burger BOM):
1. Click **Finished Goods** tab → Find "Beef Burger" → Click "View BOM"
2. BOM shows ingredients: "Beef Mince (RM-BEEF)", "Gluten-Free Flour (DG-001)"
3. To check Beef Mince details → Click **Meat** tab → Search "RM-BEEF"
4. To check Flour details → Click **Dry Goods** tab → Search "DG-001"
5. To return to Beef Burger → Click **Finished Goods** tab → Search again

**Result**: 5 tab switches, 3 searches, 2 minutes wasted (vs 10 seconds with grouped dashboard).

**2. BOM Version Confusion (No Visual Timeline)**

**Current BOM Versioning** (Database Schema):
```sql
CREATE TABLE boms (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  version_number INTEGER,
  effective_from DATE,
  effective_to DATE,
  status bom_status -- 'draft', 'active', 'phased_out', 'inactive'
);
```

**Issue**: Users see a table of BOM versions with dates, but no visual timeline.

**Example**: Product "Beef Burger" has 3 BOM versions:
| Version | Effective From | Effective To | Status |
|---------|----------------|--------------|--------|
| 1       | 2024-01-01     | 2024-06-30   | inactive |
| 2       | 2024-07-01     | 2024-12-31   | active |
| 3       | 2025-01-01     | NULL         | draft |

**Questions Users Ask** (requiring mental math):
- "Which BOM is valid on Nov 15, 2024?" → Version 2 (user must compare dates)
- "Can I activate Version 3 on Dec 1?" → NO (overlaps with Version 2) - no warning shown
- "When does Version 2 expire?" → Dec 31, 2024 (user must read table)

**Proposed Solution**: Visual BOM Timeline (gantt chart):
```
Jan 2024                Jul 2024                Jan 2025
|------------------------|------------------------|----------->
[   Version 1 (Inactive)   ]
                         [   Version 2 (Active)    ]
                                                  [  Version 3 (Draft)  ]
                                                   ↑ Overlap Warning!
```

**3. Allergen Audit Inefficiency**

**Current Process** (Ewa's manual workflow):
1. Export all products to Excel (300 rows)
2. Export all BOMs to Excel (150 BOMs x 8 ingredients = 1200 rows)
3. Manually create pivot table to see which products contain which allergens
4. Cross-reference with production schedule to check cross-contamination risks
5. **Time**: 2 hours

**Proposed Solution**: Allergen Matrix (heatmap):
```
Product         | Gluten | Dairy | Nuts | Soy | Eggs |
----------------|--------|-------|------|-----|------|
Beef Burger     |   ✓    |       |      |  ✓  |      |
Chicken Burger  |   ✓    |   ✓   |      |  ✓  |  ✓   |
Veggie Burger   |   ✓    |       |  ⚠️   |  ✓  |      |
                                    ↑
                          Cross-contamination risk (line shares equipment)
```
**Time**: 15 minutes (matrix auto-generated, warnings highlighted)

**4. Routing Disconnect**

**Current State**: Routings managed separately from Products/BOMs.

**Navigation**:
- Products → `/technical/bom` (tab-based UI)
- Routings → `/technical/routings` (separate page, not linked)

**Issue**: When Tomasz creates a Work Order, he sees:
- Product: "Beef Burger"
- BOM: Version 2
- Routing: ??? (must manually remember "Beef Burger uses R-001")

**Proposed Solution**: Integrated Routings (linked to Product card):
```
┌─────────────────────────────────────────────────┐
│ Beef Burger (FG-001)                            │
├─────────────────────────────────────────────────┤
│ Active BOM: Version 2 (Jul 2024 - Dec 2024)    │
│ Routing: R-001 (3 operations, 45 min total)    │  ← NEW: Linked Routing
│ Allergens: Gluten, Soy                          │
└─────────────────────────────────────────────────┘
```

---

### 1.4 Technical Constraints

**Database Tables** (from `docs/archive/modules/technical/TECHNICAL_MODULE_GUIDE.md`):
- `products` (SKU, name, product_group, product_type, UoM, allergens)
- `boms` (product_id, version_number, effective_from, effective_to, status)
- `bom_items` (bom_id, product_id, quantity, uom, scrap_percent, consume_whole_lp)
- `routings` (product_id, name, description)
- `routing_operations` (routing_id, operation_number, machine_id, setup_time, run_time_per_unit)
- `allergens` (name, code, EU regulation reference)
- `product_allergens` (product_id, allergen_id)

**API Classes** (from `apps/frontend/lib/api/`):
- `ProductsAPI` (15 methods: getAll, getById, create, update, delete, etc.)
- `BomsAPI` (18 methods: getAll, getByProduct, getActiveVersion, create, clone, activate, etc.)
- `RoutingsAPI` (12 methods)
- `AllergensAPI` (8 methods)
- `TaxCodesAPI` (6 methods)

**Key Business Rules**:
1. **BOM Version Overlap Prevention**: Database trigger prevents overlapping `effective_from` / `effective_to` dates for same product
2. **1:1 Consumption Flag**: `consume_whole_lp` on BOM items enforces full License Plate consumption (no partial splits)
3. **BOM Snapshot Pattern**: When WO is created, BOM is snapshot into `wo_materials` table (prevents mid-production recipe changes)
4. **No UoM Conversions**: System does NOT auto-convert units (e.g., kg → lbs) - must be explicit

**Technology Stack**:
- Next.js 15 (App Router), React 19, TypeScript 5.7
- Tailwind CSS 3.4
- Supabase (PostgreSQL, RLS)
- Lucide React icons

---

### 1.5 Success Metrics

**Quantitative Metrics**:
1. **BOM Version Selection Time**: 5 min → 30 sec (visual timeline)
2. **Allergen Audit Time**: 2 hours → 15 min (matrix)
3. **Product Lookup Clicks**: 3 clicks (tab switching) → 1 click (grouped dashboard)
4. **BOM Version Conflicts**: 2-3 per quarter → 0 (overlap detection)

**Qualitative Metrics**:
1. **User Satisfaction**: Ewa rates "ease of BOM version management" 4/10 → 9/10
2. **Training Time**: New Technical staff onboarding: 4 hours → 1 hour (simplified UI)
3. **Error Reduction**: Allergen declaration errors: 5% → 0.5% (matrix validation)

**Business Impact**:
- **Time Savings**: 15 hours/week across 3 technical staff = €18,000/year (at €25/hour)
- **Risk Reduction**: Prevent 1 allergen recall (€500,000 cost) = ROI of 2700%

---

## Step 2: Design Variants

### Variant A: Keep Current 5-Tab System (Status: ❌ REJECTED)

**Description**: Maintain existing tab-based navigation (Meat, Dry Goods, Finished Goods, Process, Archive).

**Pros**:
- No code changes required (zero development cost)
- Users familiar with current system (no retraining)

**Cons**:
- **Tab fatigue persists** (Ewa: "I still switch 5 tabs to review a BOM")
- **No visual timeline** (Tomasz: "I still guess BOM versions by reading dates")
- **No allergen matrix** (2-hour manual audit remains)
- **Routing disconnect** (separate page, not integrated)

**Why Rejected**: Fails to address core pain points. Users explicitly requested "stop making me click 5 tabs."

---

### Variant B: Grouped Dashboard (3 Categories) + Visual BOM Timeline (Status: ✅ SELECTED - P1 MVP)

**Description**: Replace 5 tabs with 3 grouped categories (Raw Materials, Finished Products, Technical Settings) + add Visual BOM Timeline for version management.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Technical Module Dashboard                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │ Raw Materials   │ │ Finished        │ │ Technical       ││
│ │                 │ │ Products        │ │ Settings        ││
│ │ 🥩 Meat (45)    │ │ 📦 Finished     │ │ 🏷️  Allergens   ││
│ │ 📦 Dry Goods    │ │    Goods (28)   │ │ 💰 Tax Codes    ││
│ │    (120)        │ │ 🧪 Process (12) │ │ 📐 Routings     ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **3 Groups vs 5 Tabs**: Reduces navigation complexity
   - **Raw Materials**: Combines Meat + Dry Goods (users rarely need to separate them)
   - **Finished Products**: Combines Finished Goods + Process (both are COMPOSITE products)
   - **Technical Settings**: Allergens, Tax Codes, Routings (reference data)

2. **Visual BOM Timeline**: Gantt chart showing version lifecycle
   ```
   Product: Beef Burger
   ┌──────────────────────────────────────────────────────┐
   │ 2024                                          2025   │
   │ Jan    Apr    Jul    Oct    Jan    Apr        Jul   │
   │ |------|------|------|------|------|----------|----->│
   │ [V1: Inactive ────────────┐                         │
   │                            [V2: Active ──────────┐  │
   │                                                   [V3:Draft]
   │                                                    ↑  │
   │                                              Overlap Warning!
   └──────────────────────────────────────────────────────┘
   ```

3. **Overlap Detection**: When activating V3, system warns:
   > ⚠️ **Version Conflict**: V3 effective_from (2025-01-01) overlaps with V2 effective_to (2024-12-31). Please adjust dates or phase out V2 first.

**Pros**:
- ✅ **Reduces clicks**: 3 groups vs 5 tabs (40% reduction)
- ✅ **Visual timeline**: Users see BOM lifecycle at a glance (Tomasz: "Finally, a gantt chart!")
- ✅ **Overlap prevention**: Warnings before activation (prevents version conflicts)
- ✅ **Grouped logic**: Raw Materials together, Finished Products together (mental model matches reality)

**Cons**:
- ⚠️ Does NOT address allergen audit (matrix not included in V1)
- ⚠️ Does NOT integrate routings yet (separate category)

**Development Effort**: 2-3 weeks (6 developer-weeks)
- Week 1: Refactor BomCatalogClient (3 groups instead of 5 tabs)
- Week 2: Build Visual BOM Timeline component (gantt chart, overlap detection)
- Week 3: Testing, edge cases, documentation

**Priority**: **P1 MVP** (critical for BOM version management, solves 60% of pain points)

---

### Variant C: Integrated Routings (Linked to Products) (Status: ✅ SELECTED - P1)

**Description**: Embed Routing information directly in Product cards (instead of separate page).

**Current State**: Routings are on separate page `/technical/routings`, not linked to Products.

**Proposed**: Product card shows linked Routing inline.

**Example Product Card** (Finished Good):
```
┌─────────────────────────────────────────────────────────────┐
│ 🍔 Beef Burger (FG-001)                                     │
├─────────────────────────────────────────────────────────────┤
│ Group: COMPOSITE | Type: FG | UoM: EA                       │
│ Allergens: Gluten, Soy                                      │
├─────────────────────────────────────────────────────────────┤
│ 📋 Active BOM: Version 2 (2024-07-01 → 2024-12-31)         │
│    8 ingredients, 2.5 kg total weight                       │
│    [View BOM Details →]                                     │
├─────────────────────────────────────────────────────────────┤
│ 🏭 Routing: R-001 "Standard Burger Line"                   │  ← NEW SECTION
│    3 operations, 45 min total time                          │
│    ├─ Op 10: Mix Ingredients (Machine: MIXER-01, 15 min)   │
│    ├─ Op 20: Form Patties (Machine: FORMER-01, 20 min)     │
│    └─ Op 30: Freeze (Machine: FREEZER-01, 10 min)          │
│    [Edit Routing →]                                         │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Routing embedded in Product card**: No need to navigate to separate page
2. **Operation preview**: Users see operation sequence, machines, times inline
3. **Edit link**: Click "Edit Routing" to open full routing editor (modal or side panel)

**Pros**:
- ✅ **Context**: Routing visible alongside BOM (Tomasz: "I can plan capacity without switching pages")
- ✅ **Discoverability**: Users learn that Routings exist (currently hidden on separate page)
- ✅ **Faster WO creation**: When creating WO, user sees BOM + Routing in one view

**Cons**:
- ⚠️ **Card complexity**: Product card grows from 5 lines to 12 lines (more scrolling)
- ⚠️ **Not all products have Routings**: Raw Materials don't have routings (only FG/PR) - need conditional display

**Development Effort**: 1 week (1 developer-week)
- Modify Product card component to conditionally show Routing section
- Fetch routing data when Product is FG or PR
- Add "Edit Routing" modal/panel

**Priority**: **P1** (high impact, low effort - quick win)

---

### Variant D: Allergen Matrix (Heatmap) (Status: ✅ SELECTED - P2)

**Description**: Add Allergen Matrix view showing which products contain which allergens (heatmap visualization).

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Allergen Matrix                         [Export PDF ↓]     │
├─────────────────────────────────────────────────────────────┤
│          │Gluten│Dairy│Nuts│Soy│Eggs│Fish│Shellfish│Celery││
├──────────┼──────┼─────┼────┼───┼────┼────┼─────────┼──────┤│
│Beef Burg │  ✓   │     │    │ ✓ │    │    │         │      ││
│Chicken B │  ✓   │  ✓  │    │ ✓ │ ✓  │    │         │      ││
│Veggie B  │  ✓   │     │ ⚠️  │ ✓ │    │    │         │  ✓   ││
│Fish Cake │  ✓   │     │    │   │ ✓  │ ✓  │         │      ││
└─────────────────────────────────────────────────────────────┘

Legend:
✓ = Declared allergen (in BOM)
⚠️ = Cross-contamination risk (shares production line with Nut products)
```

**Key Features**:
1. **Heatmap Visualization**: Quick visual scan shows allergen coverage
2. **Cross-Contamination Warnings**: ⚠️ icon for products sharing equipment with allergen-containing products
3. **Export to PDF**: Generate compliance report for auditors (FSMA 204, EU 1169/2011)
4. **Filter by Allergen**: Click "Gluten" column header → show only gluten-containing products

**Cross-Contamination Logic**:
```sql
-- Pseudocode: Detect cross-contamination risk
SELECT p1.name AS product, p2.name AS risk_source, a.name AS allergen
FROM products p1
JOIN production_lines pl ON p1.production_line_id = pl.id
JOIN products p2 ON p2.production_line_id = pl.id  -- Same line
JOIN product_allergens pa ON pa.product_id = p2.id
JOIN allergens a ON a.id = pa.allergen_id
WHERE p1.id != p2.id  -- Different product
  AND NOT EXISTS (
    SELECT 1 FROM product_allergens pa2
    WHERE pa2.product_id = p1.id AND pa2.allergen_id = a.id
  )  -- p1 doesn't declare this allergen
```

**Pros**:
- ✅ **Audit Speed**: 2 hours → 15 min (Ewa: "I can see all allergens at once")
- ✅ **Compliance**: Auto-generate allergen reports for FSMA 204, EU 1169/2011
- ✅ **Risk Detection**: Cross-contamination warnings prevent recalls

**Cons**:
- ⚠️ **Complexity**: Requires production line data (may not exist in database yet)
- ⚠️ **Performance**: Large matrix (300 products x 14 allergens = 4200 cells) - need virtualization

**Development Effort**: 3 weeks (3 developer-weeks)
- Week 1: Build matrix component (heatmap, cell rendering, virtualization)
- Week 2: Implement cross-contamination logic (production line detection)
- Week 3: Export to PDF, filtering, testing

**Priority**: **P2** (high value, but not MVP - can defer to Phase 2)

---

### Variant Comparison Summary

| Feature | Variant A (5 Tabs) | Variant B (Grouped Dashboard) | Variant C (Integrated Routings) | Variant D (Allergen Matrix) |
|---------|-------------------|-------------------------------|--------------------------------|----------------------------|
| **Navigation** | 5 tabs | 3 groups | (Same as B) | (Same as B) |
| **BOM Timeline** | ❌ No | ✅ Visual gantt | ✅ Inherited | ✅ Inherited |
| **Overlap Detection** | ❌ No | ✅ Yes | ✅ Inherited | ✅ Inherited |
| **Routing Integration** | ❌ Separate page | ❌ Separate category | ✅ Embedded in Product card | ✅ Inherited |
| **Allergen Matrix** | ❌ No | ❌ No | ❌ No | ✅ Heatmap |
| **Cross-Contamination** | ❌ Manual check | ❌ Manual check | ❌ Manual check | ✅ Auto-detected |
| **Development Effort** | 0 weeks | 2-3 weeks | +1 week | +3 weeks |
| **Priority** | ❌ Rejected | ✅ P1 MVP | ✅ P1 | ✅ P2 |

**Selected Hybrid Approach**:
- **Phase 1 (MVP)**: Variant B (Grouped Dashboard) + Variant C (Integrated Routings) = 3-4 weeks
- **Phase 2 (Growth)**: + Variant D (Allergen Matrix) = +3 weeks

**Total Timeline**: 6-7 weeks for full Technical Module UX redesign

---

## Step 3: Detailed Wireframes

### 3.1 Wireframe: Grouped Technical Dashboard (Desktop)

**Context**: Replaces 5-tab navigation with 3 grouped categories.

**Layout**: 1920x1080 desktop view

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ MonoPilot                                        [Search Products...]         👤 Ewa (Tech) │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🏭 Technical Module                                                                          │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ┌────────────────────┐ │
│  │ 🥩 Raw Materials             │  │ 📦 Finished Products         │  │ ⚙️ Technical       │ │
│  │                              │  │                              │  │    Settings        │ │
│  ├──────────────────────────────┤  ├──────────────────────────────┤  ├────────────────────┤ │
│  │                              │  │                              │  │                    │ │
│  │ 🥩 Meat Products             │  │ 📦 Finished Goods            │  │ 🏷️  Allergens (14) │ │
│  │    45 items                  │  │    28 items                  │  │                    │ │
│  │    [View →]                  │  │    [View →]                  │  │    [Manage →]      │ │
│  │                              │  │                              │  │                    │ │
│  │ ┌──────────────────────────┐ │  │ ┌──────────────────────────┐ │  │ 💰 Tax Codes (6)   │ │
│  │ │ RM-BEEF   Beef Mince     │ │  │ │ FG-001   Beef Burger     │ │  │                    │ │
│  │ │ 🏷️  No allergens          │ │  │ │ 🏷️  Gluten, Soy          │ │  │    [Manage →]      │ │
│  │ │ 📋 Used in 12 BOMs       │ │  │ │ 📋 BOM v2 (Active)       │ │  │                    │ │
│  │ └──────────────────────────┘ │  │ │ 🏭 Routing: R-001        │ │  │ 📐 Routings (22)   │ │
│  │                              │  │ └──────────────────────────┘ │  │                    │ │
│  │ 📦 Dry Goods                 │  │                              │  │    [Manage →]      │ │
│  │    120 items                 │  │ 🧪 Process Items             │  │                    │ │
│  │    [View →]                  │  │    12 items                  │  └────────────────────┘ │
│  │                              │  │    [View →]                  │                          │
│  │ ┌──────────────────────────┐ │  │                              │                          │
│  │ │ DG-001   Gluten-Free     │ │  │ ┌──────────────────────────┐ │                          │
│  │ │          Flour           │ │  │ │ PR-005   Burger Mix      │ │                          │
│  │ │ 🏷️  Gluten (certified)   │ │  │ │ 🏷️  Gluten, Soy          │ │                          │
│  │ │ 📋 Used in 8 BOMs        │ │  │ │ 📋 BOM v1 (Active)       │ │                          │
│  │ └──────────────────────────┘ │  │ └──────────────────────────┘ │                          │
│  │                              │  │                              │                          │
│  │ [+ Add Raw Material]         │  │ [+ Add Finished Product]     │                          │
│  │                              │  │                              │                          │
│  └──────────────────────────────┘  └──────────────────────────────┘                          │
│                                                                                              │
│  Quick Actions:                                                                              │
│  [📋 Create New BOM]  [🏭 Create Routing]  [📊 Allergen Matrix]  [📄 Export Catalog (PDF)] │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
1. **3 Grouped Sections** (not tabs):
   - **Raw Materials**: Meat (45) + Dry Goods (120) = 165 items
   - **Finished Products**: Finished Goods (28) + Process (12) = 40 items
   - **Technical Settings**: Allergens (14) + Tax Codes (6) + Routings (22)

2. **Product Cards** (preview):
   - SKU + Name
   - Allergen tags (🏷️)
   - BOM status (📋 BOM v2 Active)
   - Routing link (🏭 R-001)
   - Usage count (📋 Used in 12 BOMs)

3. **Search Bar** (global):
   - Search across all products (RM + FG + PR)
   - Filter by: SKU, Name, Allergen, BOM status

4. **Quick Actions**:
   - Create New BOM (shortcut to BOM wizard)
   - Create Routing (shortcut to routing editor)
   - Allergen Matrix (opens Variant D matrix view)
   - Export Catalog (PDF report for audits)

**Interactions**:
- **Click "View →"**: Expand category to full product list (table view)
- **Click Product Card**: Open product detail modal (Step 3.3)
- **Click BOM link**: Open BOM Timeline (Step 3.2)
- **Click Routing link**: Open Routing detail (Step 3.4)

**State Management**:
```typescript
// Component: TechnicalDashboard.tsx
const [expandedCategory, setExpandedCategory] = useState<'raw' | 'finished' | 'settings' | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

// Fetch all products (client-side filtering)
const { data: allProducts } = useSupabaseData(ProductsAPI.getAll);

// Filter by search query
useEffect(() => {
  const filtered = allProducts.filter(p =>
    p.sku.includes(searchQuery) ||
    p.name.includes(searchQuery) ||
    p.allergens.some(a => a.name.includes(searchQuery))
  );
  setFilteredProducts(filtered);
}, [searchQuery, allProducts]);
```

---

### 3.2 Wireframe: Visual BOM Timeline (Gantt Chart)

**Context**: Users click "View BOM" on a Product card → opens BOM Timeline showing all versions.

**Layout**: Full-screen modal (1600x900)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ BOM Timeline: Beef Burger (FG-001)                                              [✕ Close]    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  Product: Beef Burger (FG-001)                                                               │
│  Current Date: 2024-11-15                                          [+ Create New Version]   │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Timeline View                                                                          │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                        │ │
│  │  2024                                                            2025                  │ │
│  │  Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec   Jan   Feb   │ │
│  │  |─────|─────|─────|─────|─────|─────|─────|─────|─────|─────|─────|─────|─────|──── │ │
│  │                                                                  ↑                     │ │
│  │                                                               Today                    │ │
│  │                                                                                        │ │
│  │  [────────── Version 1 (Inactive) ──────────┐                                         │ │
│  │  │ 2024-01-01 → 2024-06-30                  │                                         │ │
│  │  │ Status: Inactive (expired)               │                                         │ │
│  │  │ 8 ingredients, 2.5 kg total              │                                         │ │
│  │  └──────────────────────────────────────────┘                                         │ │
│  │                                                                                        │ │
│  │                                  [───────── Version 2 (Active) ────────────┐           │ │
│  │                                  │ 2024-07-01 → 2024-12-31                │           │ │
│  │                                  │ Status: Active (currently used)        │           │ │
│  │                                  │ 8 ingredients, 2.6 kg total            │           │ │
│  │                                  │ [View Details] [Clone] [Edit]          │           │ │
│  │                                  └────────────────────────────────────────┘           │ │
│  │                                                                                        │ │
│  │                                                                   [── Version 3 ───┐   │ │
│  │                                                                   │ 2025-01-01 → ∞ │   │ │
│  │                                                                   │ Status: Draft  │   │ │
│  │                                                                   │ ⚠️  Overlap!   │   │ │
│  │                                                                   └────────────────┘   │ │
│  │                                                                    ↑                   │ │
│  │                                                    WARNING: Overlaps with V2!         │ │
│  │                                                    V2 ends 2024-12-31, V3 starts      │ │
│  │                                                    2025-01-01 (same date boundary)    │ │
│  │                                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Version Details (Table View)                                                          │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ Version │ Effective From │ Effective To │ Status   │ Ingredients │ Total Wt │ Actions │ │
│  ├─────────┼────────────────┼──────────────┼──────────┼─────────────┼──────────┼─────────┤ │
│  │ 1       │ 2024-01-01     │ 2024-06-30   │ Inactive │ 8           │ 2.5 kg   │ [👁️View]│ │
│  │ 2       │ 2024-07-01     │ 2024-12-31   │ Active   │ 8           │ 2.6 kg   │ [✏️Edit]│ │
│  │         │                │              │          │             │          │ [📋Clone]│ │
│  │ 3       │ 2025-01-01     │ -            │ Draft    │ 8           │ 2.6 kg   │ [✅Activate]│ │
│  │         │                │              │ ⚠️        │             │          │ [🗑️Delete]│ │
│  └─────────┴────────────────┴──────────────┴──────────┴─────────────┴──────────┴─────────┘ │
│                                                                                              │
│  Legend:                                                                                     │
│  ■ Green = Active  ■ Gray = Inactive  ■ Yellow = Draft  ⚠️ = Overlap Warning                │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:

1. **Gantt Timeline** (top section):
   - **X-axis**: Months (Jan 2024 → Feb 2025, 14-month view)
   - **Y-axis**: BOM versions (V1, V2, V3)
   - **Bars**: Color-coded by status
     - Green = Active
     - Gray = Inactive
     - Yellow = Draft
   - **Today Marker**: Vertical line showing current date (Nov 15, 2024)

2. **Overlap Detection**:
   - **Version 3 Warning**: ⚠️ icon + red border
   - **Tooltip**: "WARNING: Overlaps with V2! V2 ends 2024-12-31, V3 starts 2025-01-01"
   - **Why it's a problem**: Same date boundary (Dec 31 → Jan 1) can cause ambiguity in WO BOM selection

3. **Version Bars** (clickable):
   - **Hover**: Tooltip shows version details (dates, status, ingredients)
   - **Click**: Highlight corresponding row in table below
   - **Drag** (future feature): Adjust `effective_from` / `effective_to` dates visually

4. **Table View** (bottom section):
   - Same data as gantt, but in table format (for users who prefer tables)
   - **Actions column**:
     - 👁️ View: Open BOM detail (Step 3.5)
     - ✏️ Edit: Modify BOM items, dates
     - 📋 Clone: Create new version based on this one
     - ✅ Activate: Change Draft → Active (triggers overlap validation)
     - 🗑️ Delete: Remove Draft version (only allowed for Drafts)

**Interactions**:

**Scenario 1: Activate Version 3 (with overlap)**

1. User clicks "✅ Activate" on Version 3
2. System detects overlap:
   ```typescript
   // BomsAPI.activate(bomId)
   const existingActiveVersions = await BomsAPI.getActiveVersions(productId);
   const newVersion = await BomsAPI.getById(bomId);

   // Check overlap
   const overlap = existingActiveVersions.some(v =>
     (newVersion.effective_from >= v.effective_from && newVersion.effective_from <= v.effective_to) ||
     (newVersion.effective_to >= v.effective_from && newVersion.effective_to <= v.effective_to)
   );

   if (overlap) {
     throw new Error('Version overlap detected');
   }
   ```

3. Modal appears:
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ ⚠️  Version Overlap Detected                             │
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │ Version 3 (2025-01-01 → ∞) overlaps with:               │
   │ Version 2 (2024-07-01 → 2024-12-31)                     │
   │                                                         │
   │ Recommended Actions:                                    │
   │                                                         │
   │ Option A: Phase Out Version 2                           │
   │ • Change V2 effective_to to 2024-12-30                  │
   │ • Activate V3 starting 2024-12-31                       │
   │ • [Auto-Fix: Phase Out V2]                              │
   │                                                         │
   │ Option B: Delay Version 3                               │
   │ • Change V3 effective_from to 2025-01-02                │
   │ • Keep V2 active until 2024-12-31                       │
   │ • [Edit V3 Dates]                                       │
   │                                                         │
   │ Option C: Cancel Activation                             │
   │ • Keep V3 as Draft, manually resolve later              │
   │ • [Cancel]                                              │
   │                                                         │
   └─────────────────────────────────────────────────────────┘
   ```

4. User selects "Auto-Fix: Phase Out V2"
5. System updates:
   - V2: `effective_to = 2024-12-30`
   - V3: `status = 'active'`, `effective_from = 2024-12-31`
6. Timeline refreshes, showing gap-free transition

**Scenario 2: Clone Version 2 to create Version 4**

1. User clicks "📋 Clone" on Version 2
2. Modal appears:
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Clone BOM Version                                       │
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │ Cloning from: Version 2 (2024-07-01 → 2024-12-31)       │
   │                                                         │
   │ New Version Number: [4] (auto-generated)                │
   │ Effective From:     [2025-06-01] (date picker)          │
   │ Effective To:       [∞] (leave blank for indefinite)    │
   │ Status:             [Draft ▼] (dropdown)                │
   │                                                         │
   │ Copy Settings:                                          │
   │ ☑ Copy all BOM items (8 ingredients)                    │
   │ ☑ Copy quantities and UoMs                              │
   │ ☑ Copy allergen declarations                            │
   │ ☐ Copy routing (optional)                               │
   │                                                         │
   │ [Create Clone]  [Cancel]                                │
   │                                                         │
   └─────────────────────────────────────────────────────────┘
   ```

3. User clicks "Create Clone"
4. System creates new BOM:
   ```sql
   INSERT INTO boms (product_id, version_number, effective_from, effective_to, status)
   VALUES (product_id, 4, '2025-06-01', NULL, 'draft');

   -- Copy BOM items
   INSERT INTO bom_items (bom_id, product_id, quantity, uom, scrap_percent, consume_whole_lp)
   SELECT new_bom_id, product_id, quantity, uom, scrap_percent, consume_whole_lp
   FROM bom_items
   WHERE bom_id = old_bom_id;
   ```

5. Timeline refreshes, showing new Version 4 bar (yellow, Draft status)

---

### 3.3 Wireframe: Product Card (with Integrated Routing)

**Context**: Expanded product card showing BOM + Routing in one view (Variant C).

**Layout**: Side panel (400px wide, slides in from right)

```
┌──────────────────────────────────────────────────────────────┐
│ Product Details                                 [✕ Close]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🍔 Beef Burger                                              │
│  SKU: FG-001                                                 │
│  Group: COMPOSITE  │  Type: Finished Good  │  UoM: EA        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Allergens                                            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ 🏷️  Gluten (from Gluten-Free Flour)                 │   │
│  │ 🏷️  Soy (from Soy Protein Isolate)                  │   │
│  │                                                      │   │
│  │ ⚠️  Cross-Contamination Risk: Nuts                   │   │
│  │    (shares production line with Veggie Burger)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📋 Bill of Materials (BOM)                           │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Active Version: 2 (2024-07-01 → 2024-12-31)         │   │
│  │ Total Weight: 2.6 kg                                 │   │
│  │ Ingredients: 8                                       │   │
│  │                                                      │   │
│  │ Top 3 Ingredients:                                   │   │
│  │ • Beef Mince (RM-BEEF): 1.5 kg                       │   │
│  │ • Gluten-Free Flour (DG-001): 0.8 kg                 │   │
│  │ • Soy Protein Isolate (DG-045): 0.3 kg              │   │
│  │                                                      │   │
│  │ [View Full BOM Timeline →]                           │   │
│  │ [View All Ingredients (8) →]                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🏭 Routing: R-001 "Standard Burger Line"            │   │  ← NEW SECTION
│  ├──────────────────────────────────────────────────────┤   │
│  │ Total Time: 45 minutes                               │   │
│  │ Operations: 3                                        │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ Op 10: Mix Ingredients                         │  │   │
│  │ │ Machine: MIXER-01 (Industrial Mixer)           │  │   │
│  │ │ Setup: 5 min  │  Runtime: 10 min/batch         │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ Op 20: Form Patties                            │  │   │
│  │ │ Machine: FORMER-01 (Patty Former)              │  │   │
│  │ │ Setup: 3 min  │  Runtime: 15 min/batch         │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ Op 30: Freeze                                  │  │   │
│  │ │ Machine: FREEZER-01 (Blast Freezer)            │  │   │
│  │ │ Setup: 0 min  │  Runtime: 12 min/batch         │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ [Edit Routing →]  [Clone Routing →]                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Usage & History                                      │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Used in Work Orders: 42 (last 90 days)               │   │
│  │ Average Yield: 98.5%                                 │   │
│  │ Last Produced: 2024-11-10                            │   │
│  │                                                      │   │
│  │ [View Production History →]                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Actions:                                                    │
│  [✏️ Edit Product]  [📋 Create New BOM Version]             │
│  [🏭 Edit Routing]  [🗑️ Archive Product]                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Elements**:

1. **Routing Section** (new in Variant C):
   - **Routing Name**: R-001 "Standard Burger Line"
   - **Total Time**: 45 minutes (sum of all operations)
   - **Operations List**: 3 operations, each showing:
     - Operation number (10, 20, 30)
     - Operation name (Mix, Form, Freeze)
     - Machine assignment (MIXER-01, FORMER-01, FREEZER-01)
     - Setup time (one-time per batch)
     - Runtime (per batch)

2. **BOM Summary** (existing):
   - Active version number + date range
   - Total weight (for capacity planning)
   - Top 3 ingredients (preview, expandable to full list)
   - Link to BOM Timeline (Step 3.2)

3. **Allergen Section** (existing):
   - Declared allergens (from BOM ingredients)
   - Cross-contamination warnings (from production line analysis)

4. **Usage & History** (new):
   - Work Order usage count (last 90 days)
   - Average yield (from production outputs)
   - Last produced date

**Why Routing is Integrated**:
- **Context**: When Tomasz creates a WO, he needs BOM + Routing together (not separate pages)
- **Capacity Planning**: Routing times (45 min) help estimate production capacity
- **Machine Availability**: Seeing machine assignments (MIXER-01, FORMER-01) helps check availability

**Interactions**:
- **Click "Edit Routing"**: Open routing editor (modal or separate page)
- **Click "Clone Routing"**: Create new routing based on this one (for product variants)
- **Click "View Full BOM Timeline"**: Open BOM Timeline (Step 3.2)
- **Click Operation**: Expand to show detailed parameters (temperature, speed, etc.)

---

### 3.4 Wireframe: Allergen Matrix (Heatmap)

**Context**: Variant D - Allergen audit view showing cross-contamination risks.

**Layout**: Full-screen page (1920x1080)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Allergen Matrix                                                       [Export PDF ↓]  [Filter by Line ▼]         │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                  │
│  Production Line: All Lines ▼                                     Last Updated: 2024-11-15 14:30                │
│                                                                                                                  │
│  Legend: ✓ = Declared (in BOM)  │  ⚠️ = Cross-Contamination Risk  │  ○ = None                                  │
│                                                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │          │ Gluten │ Dairy │ Nuts │ Soy │ Eggs │ Fish │ Shellfish │ Celery │ Mustard │ Sesame │ Sulphites │  │
│  ├──────────┼────────┼───────┼──────┼─────┼──────┼──────┼───────────┼────────┼─────────┼────────┼───────────┤  │
│  │ Beef     │   ✓    │   ○   │  ○   │  ✓  │  ○   │  ○   │     ○     │   ○    │    ○    │   ○    │     ○     │  │
│  │ Burger   │ (GF    │       │      │(Soy │      │      │           │        │         │        │           │  │
│  │ (FG-001) │ Flour) │       │      │Prot)│      │      │           │        │         │        │           │  │
│  ├──────────┼────────┼───────┼──────┼─────┼──────┼──────┼───────────┼────────┼─────────┼────────┼───────────┤  │
│  │ Chicken  │   ✓    │   ✓   │  ○   │  ✓  │  ✓   │  ○   │     ○     │   ○    │    ○    │   ○    │     ○     │  │
│  │ Burger   │        │(Milk  │      │     │(Egg  │      │           │        │         │        │           │  │
│  │ (FG-002) │        │Powder)│      │     │White)│      │           │        │         │        │           │  │
│  ├──────────┼────────┼───────┼──────┼─────┼──────┼──────┼───────────┼────────┼─────────┼────────┼───────────┤  │
│  │ Veggie   │   ✓    │   ○   │  ⚠️   │  ✓  │  ○   │  ○   │     ○     │   ✓    │    ○    │   ○    │     ○     │  │
│  │ Burger   │        │       │ (Line│     │      │      │           │(Celery │         │        │           │  │
│  │ (FG-003) │        │       │ L-01)│     │      │      │           │ Salt)  │         │        │           │  │
│  │          │        │       │  ↓   │     │      │      │           │        │         │        │           │  │
│  │          │        │       │ Shares line with Almond Burger (FG-010)                │        │           │  │
│  ├──────────┼────────┼───────┼──────┼─────┼──────┼──────┼───────────┼────────┼─────────┼────────┼───────────┤  │
│  │ Fish     │   ✓    │   ○   │  ○   │  ○  │  ✓   │  ✓   │     ○     │   ○    │    ○    │   ○    │     ○     │  │
│  │ Cake     │        │       │      │     │      │(Cod  │           │        │         │        │           │  │
│  │ (FG-004) │        │       │      │     │      │Fillet│           │        │         │        │           │  │
│  ├──────────┼────────┼───────┼──────┼─────┼──────┼──────┼───────────┼────────┼─────────┼────────┼───────────┤  │
│  │ Sausage  │   ✓    │   ○   │  ○   │  ✓  │  ○   │  ○   │     ○     │   ○    │    ✓    │   ○    │     ✓     │  │
│  │ Roll     │        │       │      │     │      │      │           │        │(Mustard │        │(Sulphur   │  │
│  │ (FG-005) │        │       │      │     │      │      │           │        │ Seed)   │        │ Dioxide)  │  │
│  └──────────┴────────┴───────┴──────┴─────┴──────┴──────┴───────────┴────────┴─────────┴────────┴───────────┘  │
│                                                                                                                  │
│  Cross-Contamination Warnings (3):                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠️  Veggie Burger (FG-003) - Nuts Cross-Contamination                                                      │ │
│  │    Shares production line L-01 with Almond Burger (FG-010) which contains Tree Nuts (Almond).             │ │
│  │    Recommendation: Add allergen declaration "May contain traces of nuts" or use separate line.             │ │
│  │    [Add Declaration]  [Reassign Line]  [Dismiss]                                                           │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠️  Beef Burger (FG-001) - Dairy Cross-Contamination                                                       │ │
│  │    Shares production line L-01 with Chicken Burger (FG-002) which contains Dairy (Milk Powder).           │ │
│  │    Recommendation: Add allergen declaration "May contain traces of dairy" or use separate line.            │ │
│  │    [Add Declaration]  [Reassign Line]  [Dismiss]                                                           │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                  │
│  Summary Statistics:                                                                                            │
│  • Total Products Analyzed: 28                                                                                  │
│  • Products with Allergens: 24 (86%)                                                                            │
│  • Cross-Contamination Risks: 3 (11%)                                                                           │
│  • Most Common Allergen: Gluten (18 products, 64%)                                                              │
│                                                                                                                  │
│  Actions:                                                                                                        │
│  [📄 Export Allergen Report (PDF)]  [📧 Send to QA Manager]  [🔄 Refresh Matrix]                               │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:

1. **Matrix Table**:
   - **Rows**: Products (Finished Goods only, 28 products)
   - **Columns**: 14 major allergens (EU Regulation 1169/2011)
   - **Cells**:
     - ✓ = Declared allergen (from BOM ingredients)
     - ⚠️ = Cross-contamination risk (from production line analysis)
     - ○ = No allergen

2. **Cell Details** (hover tooltip):
   - **For ✓**: "Gluten (from Gluten-Free Flour, DG-001)"
   - **For ⚠️**: "Cross-contamination: Shares line L-01 with Almond Burger (FG-010)"

3. **Cross-Contamination Logic**:
   ```sql
   -- Detect cross-contamination risks
   SELECT p1.name AS product,
          p2.name AS risk_source,
          a.name AS allergen,
          pl.name AS production_line
   FROM products p1
   JOIN production_lines pl ON p1.production_line_id = pl.id
   JOIN products p2 ON p2.production_line_id = pl.id  -- Same line
   JOIN boms b2 ON b2.product_id = p2.id AND b2.status = 'active'
   JOIN bom_items bi2 ON bi2.bom_id = b2.id
   JOIN products ing ON ing.id = bi2.product_id
   JOIN product_allergens pa ON pa.product_id = ing.id
   JOIN allergens a ON a.id = pa.allergen_id
   WHERE p1.id != p2.id  -- Different product
     AND NOT EXISTS (
       -- p1 doesn't already declare this allergen
       SELECT 1 FROM boms b1
       JOIN bom_items bi1 ON bi1.bom_id = b1.id
       JOIN products ing1 ON ing1.id = bi1.product_id
       JOIN product_allergens pa1 ON pa1.product_id = ing1.id
       WHERE b1.product_id = p1.id
         AND b1.status = 'active'
         AND pa1.allergen_id = a.id
     );
   ```

4. **Warning Cards**:
   - **Title**: Product name + allergen risk
   - **Description**: Explanation of cross-contamination source (shared line, product)
   - **Recommendation**: Actionable advice (add declaration, reassign line)
   - **Actions**:
     - "Add Declaration": Auto-add "May contain traces of X" to product allergen list
     - "Reassign Line": Open production line assignment modal
     - "Dismiss": Hide warning (mark as reviewed)

5. **Summary Statistics**:
   - Total products analyzed
   - % with allergens
   - Cross-contamination risks count
   - Most common allergen (for procurement planning)

6. **Export to PDF**:
   - Generate compliance report (FSMA 204, EU 1169/2011)
   - Include: Matrix table, warnings, summary stats
   - Signed by: Ewa (Technical Manager), Date: 2024-11-15

**Interactions**:

**Scenario: Ewa reviews allergen warnings**

1. Ewa opens Allergen Matrix
2. System auto-detects 3 cross-contamination risks
3. Ewa clicks "Veggie Burger - Nuts Cross-Contamination" warning
4. Modal expands:
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Cross-Contamination Risk Details                        │
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │ Product: Veggie Burger (FG-003)                         │
   │ Risk Source: Almond Burger (FG-010)                     │
   │ Shared Resource: Production Line L-01                   │
   │ Allergen: Tree Nuts (Almond)                            │
   │                                                         │
   │ Risk Level: HIGH ⚠️                                      │
   │ Reason: Both products processed on same line without    │
   │         intermediate cleaning (allergen residue risk)   │
   │                                                         │
   │ Recommended Actions:                                    │
   │                                                         │
   │ Option A: Add "May Contain" Declaration                 │
   │ • Add to Veggie Burger allergen list:                   │
   │   "May contain traces of tree nuts (almond)"            │
   │ • Compliant with EU 1169/2011 labeling requirements     │
   │ • [Add Declaration]                                     │
   │                                                         │
   │ Option B: Reassign Production Line                      │
   │ • Move Veggie Burger to Line L-02 (nut-free)            │
   │ • Requires production schedule adjustment               │
   │ • [Reassign to L-02]                                    │
   │                                                         │
   │ Option C: Implement Cleaning Protocol                   │
   │ • Add 30-min cleaning between Almond Burger and         │
   │   Veggie Burger runs                                    │
   │ • Validate with swab test (ATP testing)                 │
   │ • [Create Cleaning SOP]                                 │
   │                                                         │
   │ [Cancel]                                                │
   │                                                         │
   └─────────────────────────────────────────────────────────┘
   ```

5. Ewa selects "Option A: Add Declaration"
6. System updates:
   ```sql
   -- Add allergen declaration to Veggie Burger
   INSERT INTO product_allergens (product_id, allergen_id, declaration_type)
   VALUES (
     'FG-003',
     (SELECT id FROM allergens WHERE code = 'TREE_NUTS'),
     'may_contain'  -- vs 'contains' (declared in BOM)
   );
   ```
7. Matrix refreshes:
   - Veggie Burger Nuts cell changes from ⚠️ → ✓ (now declared)
   - Warning card disappears
8. Ewa exports PDF report for QA review

---

### 3.5 Wireframe: BOM Detail View (Ingredient List)

**Context**: Users click "View All Ingredients" from Product Card or "View Details" from BOM Timeline.

**Layout**: Full-screen modal (1600x900)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ BOM Details: Beef Burger v2 (2024-07-01 → 2024-12-31)                          [✕ Close]    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  Product: Beef Burger (FG-001)                                                               │
│  BOM Version: 2 (Active)                                       [✏️ Edit] [📋 Clone] [📄 Print]│
│  Effective: 2024-07-01 → 2024-12-31                                                          │
│  Total Weight: 2.6 kg (per unit)                              Allergens: Gluten, Soy        │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Ingredients (8)                                     [+ Add Ingredient]                  │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ SKU      │ Name              │ Qty  │ UoM │ Scrap% │ Consume Whole LP │ Allergens      │ │
│  ├──────────┼───────────────────┼──────┼─────┼────────┼──────────────────┼────────────────┤ │
│  │ RM-BEEF  │ Beef Mince        │ 1.50 │ KG  │ 2%     │ ☑ Yes            │ -              │ │
│  │ DG-001   │ Gluten-Free Flour │ 0.80 │ KG  │ 5%     │ ☐ No             │ Gluten         │ │
│  │ DG-045   │ Soy Protein       │ 0.30 │ KG  │ 3%     │ ☐ No             │ Soy            │ │
│  │          │ Isolate           │      │     │        │                  │                │ │
│  │ DG-102   │ Onion Powder      │ 0.05 │ KG  │ 1%     │ ☐ No             │ -              │ │
│  │ DG-103   │ Garlic Powder     │ 0.03 │ KG  │ 1%     │ ☐ No             │ -              │ │
│  │ DG-104   │ Black Pepper      │ 0.02 │ KG  │ 1%     │ ☐ No             │ -              │ │
│  │ DG-105   │ Salt              │ 0.04 │ KG  │ 0%     │ ☐ No             │ -              │ │
│  │ DG-106   │ Water             │ 0.10 │ L   │ 0%     │ ☐ No             │ -              │ │
│  └──────────┴───────────────────┴──────┴─────┴────────┴──────────────────┴────────────────┘ │
│                                                                                              │
│  Calculated Totals:                                                                          │
│  • Gross Weight (100% yield): 2.84 kg                                                        │
│  • Net Weight (after scrap): 2.60 kg                                                         │
│  • Total Scrap: 0.24 kg (8.45% overall)                                                      │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ BOM Costing (Optional - Future Feature)                                                │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ Ingredient Costs:                                                                      │ │
│  │ • Beef Mince: €9.00 (€6.00/kg × 1.5 kg)                                                │ │
│  │ • Gluten-Free Flour: €3.20 (€4.00/kg × 0.8 kg)                                         │ │
│  │ • Soy Protein Isolate: €1.80 (€6.00/kg × 0.3 kg)                                       │ │
│  │ • Other ingredients: €0.50                                                             │ │
│  │                                                                                        │ │
│  │ Total Material Cost: €14.50/unit                                                       │ │
│  │ Labor Cost: €2.50/unit (45 min × €3.33/hour)                                           │ │
│  │ Overhead: €1.00/unit                                                                   │ │
│  │                                                                                        │ │
│  │ Total Cost: €18.00/unit                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Consume Whole LP Rules (2 items flagged)                                               │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ ℹ️  Beef Mince (RM-BEEF) requires full LP consumption                                  │ │
│  │    Reason: Allergen control (no partial splits allowed)                                │ │
│  │    Impact: Production must consume entire pallet (120 kg typical)                      │ │
│  │                                                                                        │ │
│  │ ⚠️  Warning: If LP weight ≠ 1.5 kg × batch size, yield will vary                       │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│  Actions:                                                                                    │
│  [📄 Export BOM (PDF)]  [📧 Send to Production]  [🔄 Refresh Costs]  [✏️ Edit BOM]         │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:

1. **Ingredients Table**:
   - **Columns**:
     - SKU: Ingredient product code
     - Name: Ingredient name
     - Qty: Required quantity per unit
     - UoM: Unit of measure (KG, L, EA, etc.)
     - Scrap%: Expected waste percentage
     - Consume Whole LP: Flag indicating 1:1 consumption rule
     - Allergens: Allergens present in ingredient

2. **Calculated Totals**:
   - **Gross Weight**: Sum of all ingredients (before scrap)
   - **Net Weight**: Final weight after scrap deduction
   - **Total Scrap**: Sum of scrap from all ingredients

3. **Consume Whole LP Rules**:
   - **Info Card**: Explains why flag is set (allergen control, traceability)
   - **Warning**: Alerts user to yield variation risk

4. **BOM Costing** (future feature, Phase 4 Epic 4.4):
   - Material costs per ingredient
   - Labor costs (based on routing time)
   - Overhead allocation
   - Total cost per unit

**Interactions**:

**Scenario: Ewa edits BOM (changes ingredient qty)**

1. Ewa clicks "✏️ Edit"
2. Table rows become editable:
   ```
   │ DG-001   │ Gluten-Free Flour │ [0.80] │ KG ▼│ [5]% │ ☐ No  │ Gluten │
                                      ↑ editable input
   ```
3. Ewa changes qty from 0.80 to 0.85 kg
4. System recalculates totals:
   - Gross Weight: 2.84 → 2.89 kg (+0.05 kg)
   - Net Weight: 2.60 → 2.65 kg (+0.05 kg)
   - Total Scrap: 0.24 → 0.24 kg (unchanged, scrap% same)

5. Ewa clicks "Save"
6. System creates new BOM version (Draft):
   ```sql
   -- Clone existing version
   INSERT INTO boms (product_id, version_number, effective_from, effective_to, status)
   VALUES (product_id, 3, NULL, NULL, 'draft');

   -- Copy BOM items with updated qty
   INSERT INTO bom_items (bom_id, product_id, quantity, uom, scrap_percent, consume_whole_lp)
   SELECT new_bom_id, product_id,
     CASE WHEN product_id = 'DG-001' THEN 0.85 ELSE quantity END,
     uom, scrap_percent, consume_whole_lp
   FROM bom_items
   WHERE bom_id = old_bom_id;
   ```

7. Modal shows success message:
   > ✅ **New Draft Created**: BOM Version 3 (Draft)
   > Changes saved. Activate when ready to use in production.
   > [View Version 3 →]

---

## Step 4: Component Library Specifications

### 4.1 Core Components

#### Component 1: `TechnicalDashboard` (Page)

**File**: `apps/frontend/app/technical/page.tsx`

**Purpose**: Main landing page for Technical Module, replacing 5-tab navigation.

**Props**:
```typescript
interface TechnicalDashboardProps {
  // No props - fetches data internally via Server Components
}
```

**State**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [expandedCategory, setExpandedCategory] = useState<'raw' | 'finished' | 'settings' | null>(null);
```

**Data Fetching**:
```typescript
// Server Component (RSC)
const allProducts = await ProductsServerAPI.getAll();
const allergens = await AllergensAPI.getAll();
const taxCodes = await TaxCodesAPI.getAll();
const routings = await RoutingsAPI.getAll();

// Group products by category
const rawMaterials = allProducts.filter(p =>
  p.product_group === 'MEAT' || p.product_group === 'DRYGOODS'
);
const finishedProducts = allProducts.filter(p =>
  p.product_group === 'COMPOSITE' && (p.product_type === 'FG' || p.product_type === 'PR')
);
```

**Styling** (Tailwind CSS):
```tsx
<div className="grid grid-cols-3 gap-6 p-8">
  <CategoryCard
    title="Raw Materials"
    icon={<Beef />}
    items={rawMaterials}
    onExpand={() => setExpandedCategory('raw')}
  />
  <CategoryCard
    title="Finished Products"
    icon={<Package />}
    items={finishedProducts}
    onExpand={() => setExpandedCategory('finished')}
  />
  <CategoryCard
    title="Technical Settings"
    icon={<Settings />}
    items={[allergens, taxCodes, routings]}
    onExpand={() => setExpandedCategory('settings')}
  />
</div>
```

**Accessibility**:
- `<h1>` for "Technical Module" heading (ARIA level 1)
- Search bar has `aria-label="Search products"`
- Category cards have `role="button"` and `aria-expanded` states
- Keyboard navigation: Tab → Card, Enter → Expand

**Performance Optimization**:
- Server-side rendering (RSC) for initial data fetch
- Client-side search filtering (no re-fetch on search)
- Virtualized product list (when expanded category > 100 items)

---

#### Component 2: `BomTimeline` (Modal)

**File**: `apps/frontend/components/BomTimeline.tsx`

**Purpose**: Visual gantt chart showing BOM version lifecycle + overlap detection.

**Props**:
```typescript
interface BomTimelineProps {
  productId: string;
  productName: string;
  onClose: () => void;
}
```

**State**:
```typescript
const [versions, setVersions] = useState<BomVersion[]>([]);
const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
const [overlapWarning, setOverlapWarning] = useState<OverlapWarning | null>(null);
```

**Data Fetching**:
```typescript
// Client Component (useEffect)
useEffect(() => {
  const fetchVersions = async () => {
    const bomVersions = await BomsAPI.getByProduct(productId);
    setVersions(bomVersions);

    // Detect overlaps
    const overlaps = detectOverlaps(bomVersions);
    if (overlaps.length > 0) {
      setOverlapWarning(overlaps[0]);
    }
  };
  fetchVersions();
}, [productId]);

// Overlap detection logic
function detectOverlaps(versions: BomVersion[]): OverlapWarning[] {
  const warnings: OverlapWarning[] = [];

  for (let i = 0; i < versions.length; i++) {
    for (let j = i + 1; j < versions.length; j++) {
      const v1 = versions[i];
      const v2 = versions[j];

      // Check date range overlap
      if (
        (v1.effective_from <= v2.effective_to && v1.effective_to >= v2.effective_from) ||
        (v2.effective_from <= v1.effective_to && v2.effective_to >= v1.effective_from)
      ) {
        warnings.push({
          version1: v1,
          version2: v2,
          message: `V${v1.version_number} overlaps with V${v2.version_number}`,
        });
      }
    }
  }

  return warnings;
}
```

**Gantt Chart Rendering** (using Recharts or custom SVG):
```tsx
<svg width={1400} height={300}>
  {versions.map((version, idx) => (
    <g key={version.id}>
      {/* Timeline bar */}
      <rect
        x={getX(version.effective_from)}
        y={idx * 60 + 20}
        width={getX(version.effective_to) - getX(version.effective_from)}
        height={40}
        fill={version.status === 'active' ? 'green' : version.status === 'draft' ? 'yellow' : 'gray'}
        className={overlapWarning && overlapWarning.version1.id === version.id ? 'border-2 border-red-500' : ''}
      />
      {/* Version label */}
      <text x={getX(version.effective_from) + 10} y={idx * 60 + 45} className="text-sm">
        V{version.version_number}
      </text>
    </g>
  ))}

  {/* Today marker */}
  <line
    x1={getX(new Date())}
    x2={getX(new Date())}
    y1={0}
    y2={300}
    stroke="blue"
    strokeWidth={2}
    strokeDasharray="5,5"
  />
</svg>

// Helper: Convert date to X position
function getX(date: Date): number {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-02-28');
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return (daysSinceStart / totalDays) * 1400;
}
```

**Overlap Warning Modal**:
```tsx
{overlapWarning && (
  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
    <h3 className="text-lg font-semibold text-red-800">⚠️ Version Overlap Detected</h3>
    <p className="text-sm text-red-700">
      {overlapWarning.message}
    </p>
    <div className="mt-4 space-x-2">
      <button onClick={() => handleAutoFix(overlapWarning)} className="btn-primary">
        Auto-Fix: Phase Out V{overlapWarning.version1.version_number}
      </button>
      <button onClick={() => setOverlapWarning(null)} className="btn-secondary">
        Dismiss
      </button>
    </div>
  </div>
)}
```

**Auto-Fix Logic**:
```typescript
async function handleAutoFix(warning: OverlapWarning) {
  const v1 = warning.version1;
  const v2 = warning.version2;

  // Adjust V1 end date to 1 day before V2 start
  const newEndDate = new Date(v2.effective_from);
  newEndDate.setDate(newEndDate.getDate() - 1);

  await BomsAPI.update(v1.id, {
    effective_to: newEndDate.toISOString().split('T')[0],
  });

  // Refresh versions
  const updatedVersions = await BomsAPI.getByProduct(productId);
  setVersions(updatedVersions);
  setOverlapWarning(null);

  toast.success('✅ Overlap resolved: V1 adjusted to end ' + newEndDate.toLocaleDateString());
}
```

---

#### Component 3: `ProductCard` (with Integrated Routing)

**File**: `apps/frontend/components/ProductCard.tsx`

**Purpose**: Unified product card showing BOM + Routing + Allergens + Usage stats.

**Props**:
```typescript
interface ProductCardProps {
  product: Product;
  onClose: () => void;
}
```

**State**:
```typescript
const [activeBom, setActiveBom] = useState<BomVersion | null>(null);
const [routing, setRouting] = useState<Routing | null>(null);
const [allergens, setAllergens] = useState<Allergen[]>([]);
const [crossContaminationRisks, setCrossContaminationRisks] = useState<CrossContaminationRisk[]>([]);
```

**Data Fetching**:
```typescript
useEffect(() => {
  const fetchProductDetails = async () => {
    // Fetch active BOM
    const bom = await BomsAPI.getActiveVersion(product.id);
    setActiveBom(bom);

    // Fetch routing (if FG or PR)
    if (product.product_type === 'FG' || product.product_type === 'PR') {
      const productRouting = await RoutingsAPI.getByProduct(product.id);
      setRouting(productRouting);
    }

    // Fetch allergens (from BOM ingredients)
    const bomAllergens = await AllergensAPI.getByBom(bom.id);
    setAllergens(bomAllergens);

    // Fetch cross-contamination risks
    const risks = await AllergensAPI.getCrossContaminationRisks(product.id);
    setCrossContaminationRisks(risks);
  };

  fetchProductDetails();
}, [product.id]);
```

**Rendering**:
```tsx
<div className="w-96 h-full bg-white shadow-lg p-6 overflow-y-auto">
  {/* Product Header */}
  <h2 className="text-2xl font-bold">{product.name}</h2>
  <p className="text-sm text-gray-600">SKU: {product.sku}</p>

  {/* Allergens Section */}
  <section className="mt-4 p-4 border border-gray-200 rounded">
    <h3 className="font-semibold">Allergens</h3>
    {allergens.map(allergen => (
      <div key={allergen.id} className="text-sm">
        🏷️ {allergen.name} (from {allergen.source_ingredient})
      </div>
    ))}
    {crossContaminationRisks.length > 0 && (
      <div className="mt-2 text-sm text-orange-600">
        ⚠️ Cross-Contamination Risk: {crossContaminationRisks[0].allergen}
        <br />
        (shares line with {crossContaminationRisks[0].source_product})
      </div>
    )}
  </section>

  {/* BOM Summary */}
  <section className="mt-4 p-4 border border-gray-200 rounded">
    <h3 className="font-semibold">📋 Bill of Materials (BOM)</h3>
    {activeBom && (
      <>
        <p className="text-sm">Active Version: {activeBom.version_number}</p>
        <p className="text-sm">
          {activeBom.effective_from} → {activeBom.effective_to || '∞'}
        </p>
        <p className="text-sm">Ingredients: {activeBom.items.length}</p>
        <p className="text-sm">Total Weight: {activeBom.total_weight} kg</p>
        <button onClick={() => openBomTimeline(product.id)} className="text-blue-600 text-sm mt-2">
          [View Full BOM Timeline →]
        </button>
      </>
    )}
  </section>

  {/* Routing Section (NEW) */}
  {routing && (
    <section className="mt-4 p-4 border border-gray-200 rounded">
      <h3 className="font-semibold">🏭 Routing: {routing.name}</h3>
      <p className="text-sm">Total Time: {routing.total_time} minutes</p>
      <p className="text-sm">Operations: {routing.operations.length}</p>
      {routing.operations.map(op => (
        <div key={op.id} className="mt-2 p-2 bg-gray-50 rounded text-sm">
          <strong>Op {op.operation_number}: {op.name}</strong>
          <br />
          Machine: {op.machine.name} ({op.machine.code})
          <br />
          Setup: {op.setup_time} min | Runtime: {op.run_time_per_unit} min/batch
        </div>
      ))}
      <button onClick={() => openRoutingEditor(routing.id)} className="text-blue-600 text-sm mt-2">
        [Edit Routing →]
      </button>
    </section>
  )}

  {/* Actions */}
  <div className="mt-6 space-x-2">
    <button className="btn-primary">✏️ Edit Product</button>
    <button className="btn-secondary">📋 Create New BOM Version</button>
  </div>
</div>
```

---

#### Component 4: `AllergenMatrix` (Page)

**File**: `apps/frontend/app/technical/allergen-matrix/page.tsx`

**Purpose**: Heatmap showing allergen declarations and cross-contamination risks.

**Props**:
```typescript
interface AllergenMatrixProps {
  // No props - fetches data internally
}
```

**State**:
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [allergens, setAllergens] = useState<Allergen[]>([]);
const [matrix, setMatrix] = useState<MatrixCell[][]>([]);
const [crossContaminationWarnings, setCrossContaminationWarnings] = useState<CrossContaminationWarning[]>([]);
```

**Data Fetching**:
```typescript
useEffect(() => {
  const fetchMatrixData = async () => {
    // Fetch all finished goods
    const allProducts = await ProductsAPI.getAll();
    const finishedGoods = allProducts.filter(p => p.product_type === 'FG');
    setProducts(finishedGoods);

    // Fetch all allergens
    const allAllergens = await AllergensAPI.getAll();
    setAllergens(allAllergens);

    // Build matrix (products × allergens)
    const matrixData: MatrixCell[][] = [];
    for (const product of finishedGoods) {
      const row: MatrixCell[] = [];
      for (const allergen of allAllergens) {
        const cell = await buildMatrixCell(product, allergen);
        row.push(cell);
      }
      matrixData.push(row);
    }
    setMatrix(matrixData);

    // Detect cross-contamination warnings
    const warnings = await AllergensAPI.getCrossContaminationWarnings();
    setCrossContaminationWarnings(warnings);
  };

  fetchMatrixData();
}, []);

async function buildMatrixCell(product: Product, allergen: Allergen): Promise<MatrixCell> {
  // Check if allergen is declared in BOM
  const isDeclared = await AllergensAPI.isAllergenDeclared(product.id, allergen.id);

  // Check cross-contamination risk
  const isCrossContamination = await AllergensAPI.isCrossContamination(product.id, allergen.id);

  return {
    product_id: product.id,
    allergen_id: allergen.id,
    status: isDeclared ? 'declared' : isCrossContamination ? 'cross_contamination' : 'none',
    source: isDeclared ? 'BOM ingredient' : isCrossContamination ? 'Shared production line' : null,
  };
}
```

**Rendering** (Table with virtualization):
```tsx
<table className="w-full border-collapse">
  <thead>
    <tr>
      <th className="border p-2">Product</th>
      {allergens.map(allergen => (
        <th key={allergen.id} className="border p-2 text-sm">
          {allergen.name}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {products.map((product, rowIdx) => (
      <tr key={product.id}>
        <td className="border p-2 font-semibold">{product.name}</td>
        {allergens.map((allergen, colIdx) => {
          const cell = matrix[rowIdx][colIdx];
          return (
            <td
              key={allergen.id}
              className={`border p-2 text-center ${
                cell.status === 'declared' ? 'bg-green-50' :
                cell.status === 'cross_contamination' ? 'bg-orange-50' :
                ''
              }`}
            >
              {cell.status === 'declared' && '✓'}
              {cell.status === 'cross_contamination' && '⚠️'}
              {cell.status === 'none' && '○'}
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>

{/* Cross-Contamination Warnings */}
<div className="mt-6 space-y-4">
  <h3 className="text-lg font-semibold">Cross-Contamination Warnings ({crossContaminationWarnings.length})</h3>
  {crossContaminationWarnings.map(warning => (
    <div key={warning.id} className="p-4 bg-orange-50 border border-orange-200 rounded">
      <h4 className="font-semibold">⚠️ {warning.product_name} - {warning.allergen_name} Cross-Contamination</h4>
      <p className="text-sm text-gray-700">
        Shares production line {warning.production_line} with {warning.source_product} which contains {warning.allergen_name}.
      </p>
      <p className="text-sm text-gray-700 mt-2">
        Recommendation: Add allergen declaration "May contain traces of {warning.allergen_name}" or use separate line.
      </p>
      <div className="mt-2 space-x-2">
        <button onClick={() => handleAddDeclaration(warning)} className="btn-primary text-sm">
          Add Declaration
        </button>
        <button onClick={() => handleReassignLine(warning)} className="btn-secondary text-sm">
          Reassign Line
        </button>
        <button onClick={() => handleDismissWarning(warning)} className="btn-ghost text-sm">
          Dismiss
        </button>
      </div>
    </div>
  ))}
</div>
```

**Export to PDF**:
```typescript
async function handleExportPDF() {
  // Use jsPDF or server-side PDF generation
  const pdf = new jsPDF();

  // Title
  pdf.setFontSize(18);
  pdf.text('Allergen Matrix Report', 20, 20);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  pdf.text(`Signed by: Ewa (Technical Manager)`, 20, 35);

  // Matrix table (simplified, use autoTable plugin for full table)
  pdf.autoTable({
    head: [['Product', ...allergens.map(a => a.name)]],
    body: products.map((product, rowIdx) => [
      product.name,
      ...allergens.map((allergen, colIdx) => {
        const cell = matrix[rowIdx][colIdx];
        return cell.status === 'declared' ? '✓' : cell.status === 'cross_contamination' ? '⚠️' : '○';
      }),
    ]),
    startY: 45,
  });

  // Warnings
  pdf.text('Cross-Contamination Warnings:', 20, pdf.lastAutoTable.finalY + 10);
  crossContaminationWarnings.forEach((warning, idx) => {
    pdf.text(
      `${idx + 1}. ${warning.product_name} - ${warning.allergen_name} (shares line ${warning.production_line})`,
      20,
      pdf.lastAutoTable.finalY + 20 + idx * 10
    );
  });

  pdf.save('allergen-matrix-report.pdf');
  toast.success('✅ PDF exported successfully');
}
```

---

### 4.2 Shared Components

- **`CategoryCard`**: Card component for dashboard categories (Raw Materials, Finished Products, Settings)
- **`ProductListItem`**: Product row in expanded category list
- **`BomVersionBar`**: Single version bar in gantt chart (with drag-to-adjust dates)
- **`RoutingOperationCard`**: Operation card showing machine, times, parameters
- **`AllergenBadge`**: Badge component for allergen tags (🏷️ Gluten, etc.)
- **`CrossContaminationWarning`**: Warning card for allergen risks

---

## Step 5: User Workflows & Time Savings

### Workflow 1: BOM Version Selection for Work Order

**Actor**: Tomasz (Production Planner)

**Goal**: Select correct BOM version when creating Work Order for Dec 10, 2024.

**Current Workflow** (5-Tab System):
1. Go to Planning → Work Orders → Create New WO
2. Select Product: "Beef Burger (FG-001)"
3. Enter Scheduled Date: 2024-12-10
4. BOM Version dropdown shows: "V1 (inactive)", "V2 (active)", "V3 (draft)"
5. Tomasz manually checks dates:
   - V1: 2024-01-01 → 2024-06-30 ❌ (expired)
   - V2: 2024-07-01 → 2024-12-31 ✅ (valid for Dec 10)
   - V3: 2025-01-01 → ∞ ❌ (not yet active)
6. Tomasz selects V2

**Time**: 5 minutes (date comparison, mental calculation)

**New Workflow** (Visual BOM Timeline):
1. Go to Planning → Work Orders → Create New WO
2. Select Product: "Beef Burger (FG-001)"
3. Enter Scheduled Date: 2024-12-10
4. BOM Version dropdown shows Visual Timeline:
   ```
   2024           2025
   ──────────────────>
   [V1 (Inactive)─┐
                  [V2 (Active)────┐  ← Highlighted (covers Dec 10)
                                  [V3 (Draft)]
                   ↑
                 Dec 10
   ```
5. Tomasz sees V2 highlighted automatically
6. Tomasz clicks "Use V2"

**Time**: 30 seconds (visual scan, one click)

**Time Saved**: 4 min 30 sec per WO × 20 WOs/week = **90 min/week**

---

### Workflow 2: Allergen Audit for Compliance

**Actor**: Ewa (Technical Manager)

**Goal**: Generate allergen audit report for FSMA 204 compliance (quarterly requirement).

**Current Workflow** (Manual Excel):
1. Export all products to Excel (300 rows)
2. Export all BOMs to Excel (150 BOMs × 8 ingredients = 1200 rows)
3. Manually create pivot table: Products × Allergens
4. Cross-reference with production schedule (Excel VLOOKUP)
5. Identify cross-contamination risks:
   - Find products sharing production lines (manual lookup in production_lines table)
   - Check if allergens differ between products on same line
   - Flag risks in Excel (manual highlighting)
6. Generate PDF report (copy-paste Excel table to Word, format, sign)
7. Email to QA Manager

**Time**: 2 hours

**New Workflow** (Allergen Matrix):
1. Go to Technical → Allergen Matrix
2. System auto-generates matrix (28 products × 14 allergens = 392 cells)
3. System auto-detects 3 cross-contamination warnings
4. Ewa reviews warnings:
   - Veggie Burger - Nuts: Click "Add Declaration" → Done
   - Beef Burger - Dairy: Click "Reassign Line" → Move to Line L-02 → Done
   - Chicken Burger - Gluten: Click "Dismiss" (acceptable risk, cleaning protocol in place)
5. Click "Export Allergen Report (PDF)"
6. System generates PDF:
   - Matrix table
   - Warnings (with actions taken)
   - Summary stats
   - Digital signature (Ewa, 2024-11-15)
7. Click "Send to QA Manager" → Email sent

**Time**: 15 minutes

**Time Saved**: 1 hour 45 min per quarter × 4 quarters/year = **7 hours/year**

---

### Workflow 3: Clone BOM for Product Variant

**Actor**: Karol (R&D Technologist)

**Goal**: Create "Beef Burger Gluten-Free" variant by cloning existing "Beef Burger" BOM and swapping flour.

**Current Workflow** (Manual Entry):
1. Go to Technical → BOM → Create New BOM
2. Select Product: [Create New Product first]
   - Create Product: "Beef Burger Gluten-Free (FG-020)"
   - Save Product
3. Enter BOM details:
   - Version: 1
   - Effective From: 2025-01-01
   - Status: Draft
4. Add ingredients (8 items, one by one):
   - RM-BEEF: 1.5 kg, 2% scrap, ☑ Consume Whole LP
   - DG-001: ❌ Remove (contains gluten)
   - DG-120: ✅ Add "Rice Flour (gluten-free)": 0.8 kg, 5% scrap
   - DG-045: 0.3 kg, 3% scrap
   - DG-102: 0.05 kg, 1% scrap
   - DG-103: 0.03 kg, 1% scrap
   - DG-104: 0.02 kg, 1% scrap
   - DG-105: 0.04 kg, 0% scrap
   - DG-106: 0.10 L, 0% scrap
5. Save BOM

**Time**: 30 minutes (manual entry, prone to errors)

**New Workflow** (BOM Cloning):
1. Go to Technical → Beef Burger (FG-001) → View BOM Timeline
2. Click "Clone" on Version 2
3. Modal appears:
   - Clone to: [Create New Product ▼] → "Beef Burger Gluten-Free (FG-020)"
   - Copy all BOM items: ☑ Yes
   - Effective From: 2025-01-01
4. Click "Create Clone"
5. System copies all 8 ingredients
6. Edit BOM:
   - Remove DG-001 (Gluten-Free Flour)
   - Add DG-120 (Rice Flour, gluten-free)
7. Save BOM

**Time**: 5 minutes

**Time Saved**: 25 min per variant × 12 variants/year = **5 hours/year**

---

### Total Time Savings Summary

| Workflow | Current Time | New Time | Savings per Instance | Frequency | Annual Savings |
|----------|--------------|----------|----------------------|-----------|----------------|
| BOM Version Selection | 5 min | 30 sec | 4.5 min | 20/week | **78 hours** |
| Allergen Audit | 2 hours | 15 min | 1 hr 45 min | 4/year | **7 hours** |
| Clone BOM for Variant | 30 min | 5 min | 25 min | 12/year | **5 hours** |
| **TOTAL** | | | | | **90 hours/year** |

**ROI Calculation**:
- 90 hours/year × €25/hour (avg. technical staff rate) = **€2,250/year**
- Development cost: 6 weeks × €800/week = €4,800
- **Payback period**: 2.1 years
- **3-year ROI**: (€6,750 - €4,800) / €4,800 = **40.6%**

---

## Step 6: Testing & Success Metrics

### 6.1 Unit Tests (Vitest)

**Component Tests**:

```typescript
// apps/frontend/__tests__/BomTimeline.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BomTimeline from '@/components/BomTimeline';
import { BomsAPI } from '@/lib/api/BomsAPI';

describe('BomTimeline Component', () => {
  it('renders BOM versions as gantt bars', async () => {
    const mockVersions = [
      { id: '1', version_number: 1, effective_from: '2024-01-01', effective_to: '2024-06-30', status: 'inactive' },
      { id: '2', version_number: 2, effective_from: '2024-07-01', effective_to: '2024-12-31', status: 'active' },
    ];

    vi.spyOn(BomsAPI, 'getByProduct').mockResolvedValue(mockVersions);

    render(<BomTimeline productId="product-1" productName="Beef Burger" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Version 1/)).toBeInTheDocument();
      expect(screen.getByText(/Version 2/)).toBeInTheDocument();
    });
  });

  it('detects BOM version overlaps and shows warning', async () => {
    const mockVersions = [
      { id: '1', version_number: 1, effective_from: '2024-01-01', effective_to: '2024-12-31', status: 'active' },
      { id: '2', version_number: 2, effective_from: '2024-06-01', effective_to: '2025-12-31', status: 'draft' },
    ];

    vi.spyOn(BomsAPI, 'getByProduct').mockResolvedValue(mockVersions);

    render(<BomTimeline productId="product-1" productName="Beef Burger" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Version Overlap Detected/)).toBeInTheDocument();
      expect(screen.getByText(/V1 overlaps with V2/)).toBeInTheDocument();
    });
  });

  it('auto-fixes overlap when user clicks "Auto-Fix" button', async () => {
    const mockVersions = [
      { id: '1', version_number: 1, effective_from: '2024-01-01', effective_to: '2024-12-31', status: 'active' },
      { id: '2', version_number: 2, effective_from: '2024-06-01', effective_to: '2025-12-31', status: 'draft' },
    ];

    vi.spyOn(BomsAPI, 'getByProduct').mockResolvedValue(mockVersions);
    vi.spyOn(BomsAPI, 'update').mockResolvedValue({ ...mockVersions[0], effective_to: '2024-05-31' });

    render(<BomTimeline productId="product-1" productName="Beef Burger" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-Fix/)).toBeInTheDocument();
    });

    const autoFixButton = screen.getByText(/Auto-Fix/);
    autoFixButton.click();

    await waitFor(() => {
      expect(BomsAPI.update).toHaveBeenCalledWith('1', { effective_to: '2024-05-31' });
      expect(screen.queryByText(/Overlap Detected/)).not.toBeInTheDocument();
    });
  });
});
```

```typescript
// apps/frontend/__tests__/AllergenMatrix.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AllergenMatrix from '@/app/technical/allergen-matrix/page';
import { AllergensAPI } from '@/lib/api/AllergensAPI';

describe('AllergenMatrix Component', () => {
  it('renders allergen matrix table with products and allergens', async () => {
    const mockProducts = [
      { id: '1', name: 'Beef Burger', product_type: 'FG' },
      { id: '2', name: 'Chicken Burger', product_type: 'FG' },
    ];

    const mockAllergens = [
      { id: 'a1', name: 'Gluten' },
      { id: 'a2', name: 'Dairy' },
    ];

    vi.spyOn(ProductsAPI, 'getAll').mockResolvedValue(mockProducts);
    vi.spyOn(AllergensAPI, 'getAll').mockResolvedValue(mockAllergens);

    render(<AllergenMatrix />);

    await waitFor(() => {
      expect(screen.getByText('Beef Burger')).toBeInTheDocument();
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
      expect(screen.getByText('Gluten')).toBeInTheDocument();
      expect(screen.getByText('Dairy')).toBeInTheDocument();
    });
  });

  it('shows cross-contamination warnings', async () => {
    const mockWarnings = [
      {
        id: 'w1',
        product_name: 'Veggie Burger',
        allergen_name: 'Nuts',
        production_line: 'L-01',
        source_product: 'Almond Burger',
      },
    ];

    vi.spyOn(AllergensAPI, 'getCrossContaminationWarnings').mockResolvedValue(mockWarnings);

    render(<AllergenMatrix />);

    await waitFor(() => {
      expect(screen.getByText(/Veggie Burger - Nuts Cross-Contamination/)).toBeInTheDocument();
      expect(screen.getByText(/shares line L-01 with Almond Burger/)).toBeInTheDocument();
    });
  });

  it('adds allergen declaration when "Add Declaration" is clicked', async () => {
    const mockWarning = {
      id: 'w1',
      product_id: 'p1',
      product_name: 'Veggie Burger',
      allergen_id: 'a1',
      allergen_name: 'Nuts',
      production_line: 'L-01',
      source_product: 'Almond Burger',
    };

    vi.spyOn(AllergensAPI, 'getCrossContaminationWarnings').mockResolvedValue([mockWarning]);
    vi.spyOn(AllergensAPI, 'addAllergenDeclaration').mockResolvedValue({ success: true });

    render(<AllergenMatrix />);

    await waitFor(() => {
      expect(screen.getByText(/Add Declaration/)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/Add Declaration/);
    addButton.click();

    await waitFor(() => {
      expect(AllergensAPI.addAllergenDeclaration).toHaveBeenCalledWith('p1', 'a1', 'may_contain');
    });
  });
});
```

---

### 6.2 E2E Tests (Playwright)

**Test Suite**: `apps/frontend/e2e/technical-module.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Technical Module - Grouped Dashboard', () => {
  test('should show 3 grouped categories instead of 5 tabs', async ({ page }) => {
    await page.goto('/technical');

    // Check for 3 categories
    await expect(page.locator('text=Raw Materials')).toBeVisible();
    await expect(page.locator('text=Finished Products')).toBeVisible();
    await expect(page.locator('text=Technical Settings')).toBeVisible();

    // Ensure old 5 tabs are gone
    await expect(page.locator('text=Meat').locator('role=tab')).not.toBeVisible();
    await expect(page.locator('text=Dry Goods').locator('role=tab')).not.toBeVisible();
  });

  test('should search across all products (RM + FG)', async ({ page }) => {
    await page.goto('/technical');

    // Search for "Beef"
    await page.fill('[aria-label="Search products"]', 'Beef');

    // Should show both RM-BEEF (Raw Material) and FG-001 Beef Burger (Finished Good)
    await expect(page.locator('text=Beef Mince')).toBeVisible(); // RM
    await expect(page.locator('text=Beef Burger')).toBeVisible(); // FG
  });

  test('should open Product Card when clicking product', async ({ page }) => {
    await page.goto('/technical');

    await page.click('text=Beef Burger');

    // Product card slides in from right
    await expect(page.locator('[role="dialog"]').locator('text=Beef Burger')).toBeVisible();
    await expect(page.locator('text=Bill of Materials (BOM)')).toBeVisible();
    await expect(page.locator('text=Routing:')).toBeVisible();
  });
});

test.describe('Technical Module - BOM Timeline', () => {
  test('should show gantt chart with version bars', async ({ page }) => {
    await page.goto('/technical');

    // Open Beef Burger product card
    await page.click('text=Beef Burger');

    // Click "View Full BOM Timeline"
    await page.click('text=View Full BOM Timeline');

    // Timeline modal appears
    await expect(page.locator('text=BOM Timeline: Beef Burger')).toBeVisible();

    // Check for version bars (SVG elements)
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();

    // Check for version labels
    await expect(page.locator('text=Version 1')).toBeVisible();
    await expect(page.locator('text=Version 2')).toBeVisible();
  });

  test('should detect and warn about overlapping BOM versions', async ({ page }) => {
    await page.goto('/technical');

    // Create overlapping versions scenario
    await page.click('text=Beef Burger');
    await page.click('text=View Full BOM Timeline');
    await page.click('text=Create New Version');

    // Fill form to create Version 3 with overlapping dates
    await page.fill('[name="effective_from"]', '2024-12-01'); // Overlaps with V2 (ends 2024-12-31)
    await page.fill('[name="effective_to"]', '2025-06-30');
    await page.click('button:has-text("Create")');

    // Overlap warning appears
    await expect(page.locator('text=Version Overlap Detected')).toBeVisible();
    await expect(page.locator('text=V3 overlaps with V2')).toBeVisible();
  });

  test('should auto-fix overlap when user clicks "Auto-Fix" button', async ({ page }) => {
    await page.goto('/technical');

    // Assume overlap already exists (from previous test or seed data)
    await page.click('text=Beef Burger');
    await page.click('text=View Full BOM Timeline');

    // Overlap warning visible
    await expect(page.locator('text=Version Overlap Detected')).toBeVisible();

    // Click "Auto-Fix"
    await page.click('button:has-text("Auto-Fix")');

    // Overlap warning disappears
    await expect(page.locator('text=Version Overlap Detected')).not.toBeVisible();

    // Success toast appears
    await expect(page.locator('text=Overlap resolved')).toBeVisible();
  });

  test('should clone BOM version with one click', async ({ page }) => {
    await page.goto('/technical');

    await page.click('text=Beef Burger');
    await page.click('text=View Full BOM Timeline');

    // Click "Clone" on Version 2
    await page.click('button:has-text("Clone")').first();

    // Clone modal appears
    await expect(page.locator('text=Clone BOM Version')).toBeVisible();

    // Fill form
    await page.fill('[name="effective_from"]', '2025-01-01');
    await page.click('button:has-text("Create Clone")');

    // New version appears in timeline
    await expect(page.locator('text=Version 3')).toBeVisible();
    await expect(page.locator('text=Draft')).toBeVisible();
  });
});

test.describe('Technical Module - Allergen Matrix', () => {
  test('should show allergen matrix table', async ({ page }) => {
    await page.goto('/technical/allergen-matrix');

    // Table visible
    await expect(page.locator('table')).toBeVisible();

    // Products in rows
    await expect(page.locator('text=Beef Burger')).toBeVisible();
    await expect(page.locator('text=Chicken Burger')).toBeVisible();

    // Allergens in columns
    await expect(page.locator('text=Gluten')).toBeVisible();
    await expect(page.locator('text=Dairy')).toBeVisible();
  });

  test('should show cross-contamination warnings', async ({ page }) => {
    await page.goto('/technical/allergen-matrix');

    // Warning cards visible
    await expect(page.locator('text=Cross-Contamination Warnings')).toBeVisible();
    await expect(page.locator('text=Veggie Burger - Nuts Cross-Contamination')).toBeVisible();
  });

  test('should add allergen declaration when clicking "Add Declaration"', async ({ page }) => {
    await page.goto('/technical/allergen-matrix');

    // Click "Add Declaration" on Veggie Burger warning
    await page.click('button:has-text("Add Declaration")').first();

    // Warning disappears
    await expect(page.locator('text=Veggie Burger - Nuts Cross-Contamination')).not.toBeVisible();

    // Matrix cell updates from ⚠️ to ✓
    const veggieNutsCell = page.locator('tr:has-text("Veggie Burger") td').nth(3); // Nuts column
    await expect(veggieNutsCell).toHaveText('✓');
  });

  test('should export allergen matrix to PDF', async ({ page }) => {
    await page.goto('/technical/allergen-matrix');

    // Click "Export PDF"
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Allergen Report (PDF)")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toBe('allergen-matrix-report.pdf');
  });
});

test.describe('Technical Module - Integrated Routing', () => {
  test('should show routing in Product Card', async ({ page }) => {
    await page.goto('/technical');

    await page.click('text=Beef Burger');

    // Routing section visible
    await expect(page.locator('text=Routing: R-001')).toBeVisible();
    await expect(page.locator('text=Total Time: 45 minutes')).toBeVisible();
    await expect(page.locator('text=Operations: 3')).toBeVisible();

    // Operations listed
    await expect(page.locator('text=Op 10: Mix Ingredients')).toBeVisible();
    await expect(page.locator('text=Machine: MIXER-01')).toBeVisible();
  });
});
```

---

### 6.3 Success Metrics (Post-Launch Monitoring)

**Quantitative Metrics**:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **BOM Version Selection Time** | < 1 min (from 5 min) | Measure time from WO creation start to BOM version selected (analytics event tracking) |
| **Allergen Audit Time** | < 20 min (from 2 hours) | Measure time from "Allergen Matrix" page open to PDF export (analytics event tracking) |
| **Product Lookup Clicks** | < 2 clicks (from 3+) | Count clicks from dashboard to product detail view (analytics) |
| **BOM Version Conflicts** | 0 per quarter (from 2-3) | Count BOM overlap errors caught by system vs manual fixes (database audit) |
| **User Satisfaction (Ewa)** | 8+/10 (from 4/10) | Quarterly UX survey: "Rate ease of BOM version management" |

**Qualitative Metrics**:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **User Adoption** | 100% of technical staff using grouped dashboard | Analytics: % of users clicking Technical → Dashboard (vs old tab navigation) |
| **Training Time** | < 2 hours (from 4 hours) | Measure onboarding time for new technical staff (HR data) |
| **Error Reduction** | 50% fewer allergen declaration errors | QA audit: Count allergen-related non-conformances (monthly) |

**Business Impact Metrics**:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Time Savings** | 90 hours/year | Calculate: (5 min - 30 sec) × 20 WOs/week × 52 weeks + 1.75 hours × 4 audits/year + 25 min × 12 clones/year |
| **Cost Savings** | €2,250/year | Time savings × €25/hour (avg. technical staff rate) |
| **ROI** | 40.6% (3-year) | (3-year savings - dev cost) / dev cost |
| **Allergen Recall Prevention** | 0 recalls due to cross-contamination | Track recalls attributed to allergen cross-contamination (vs historical baseline) |

---

### 6.4 A/B Testing Plan (Optional)

**Scenario**: Validate that grouped dashboard performs better than 5-tab navigation.

**Setup**:
- **Group A (Control)**: 50% of users see old 5-tab navigation
- **Group B (Treatment)**: 50% of users see new grouped dashboard
- **Duration**: 4 weeks
- **Sample Size**: 10 technical staff (5 per group)

**Metrics to Track**:
- **Task Completion Time**: How long to find a specific product (e.g., "Find Beef Mince RM-BEEF")
- **Click Count**: Number of clicks to complete task
- **User Preference**: Post-test survey: "Which UI do you prefer?"

**Expected Results**:
- Group B (grouped dashboard): 40% faster task completion, 30% fewer clicks, 90% prefer new UI

---

## Step 7: Implementation Roadmap

### 7.1 Phase 1 (MVP) - Weeks 1-4 (P1 Priority)

**Goal**: Replace 5-tab navigation with grouped dashboard + BOM visual timeline.

**Scope**:
- Variant B: Grouped Dashboard (3 categories)
- Variant C: Integrated Routings (in Product Card)
- BOM Timeline with overlap detection

**Deliverables**:

**Week 1: Refactor Dashboard Layout**
- **Tasks**:
  - Remove 5-tab navigation from `apps/frontend/app/technical/bom/page.tsx`
  - Create `TechnicalDashboard` component with 3 grouped sections
  - Implement `CategoryCard` component (reusable card for Raw Materials, Finished Products, Settings)
  - Server-side data fetching (RSC) for initial product list
- **Testing**:
  - Unit tests: CategoryCard rendering, data grouping logic
  - E2E tests: Dashboard loads, 3 categories visible
- **Story Points**: 13 (8 dev hours × 1.6 complexity)

**Week 2: BOM Timeline Component**
- **Tasks**:
  - Create `BomTimeline` modal component
  - Implement gantt chart rendering (SVG or Recharts)
  - Add "Today" marker (vertical line showing current date)
  - Color-code version bars (green=active, yellow=draft, gray=inactive)
- **Testing**:
  - Unit tests: Gantt bar rendering, date-to-X position calculation
  - E2E tests: Timeline opens, version bars visible
- **Story Points**: 13 (8 dev hours)

**Week 3: Overlap Detection & Auto-Fix**
- **Tasks**:
  - Implement overlap detection algorithm (`detectOverlaps()` function)
  - Create overlap warning modal (red border + warning message)
  - Implement auto-fix logic (adjust `effective_to` date of earlier version)
  - Add toast notifications for success/error
- **Testing**:
  - Unit tests: Overlap detection accuracy (edge cases: same day, null dates)
  - E2E tests: Auto-fix resolves overlap, no false positives
- **Story Points**: 8 (5 dev hours)

**Week 4: Integrated Routings + Product Card**
- **Tasks**:
  - Modify `ProductCard` component to fetch and display routing
  - Conditional rendering (only show routing for FG/PR products)
  - Link routing operations to machines (display machine name, code)
  - Add "Edit Routing" button (opens routing editor modal)
- **Testing**:
  - Unit tests: Routing data fetching, conditional display
  - E2E tests: Product card shows routing, operations visible
- **Story Points**: 8 (5 dev hours)

**Total Phase 1 Effort**: 42 Story Points (26 dev hours ≈ 3-4 weeks)

---

### 7.2 Phase 2 (Growth) - Weeks 5-7 (P2 Priority)

**Goal**: Add Allergen Matrix for cross-contamination detection.

**Scope**:
- Variant D: Allergen Matrix (heatmap)
- Cross-contamination warnings
- PDF export

**Deliverables**:

**Week 5: Allergen Matrix Table**
- **Tasks**:
  - Create `AllergenMatrix` page (`/technical/allergen-matrix`)
  - Implement matrix table (Products × Allergens)
  - Fetch data: Products (FG only), Allergens (14 major EU allergens)
  - Build matrix cells (✓ = declared, ⚠️ = cross-contamination, ○ = none)
  - Add cell hover tooltips (show ingredient source)
- **Testing**:
  - Unit tests: Matrix cell building logic, cell status calculation
  - E2E tests: Matrix table loads, cells populated
- **Story Points**: 13 (8 dev hours)

**Week 6: Cross-Contamination Detection**
- **Tasks**:
  - Implement cross-contamination logic (SQL query or API method)
  - Detect products sharing production lines
  - Identify allergen differences between products on same line
  - Create warning cards (product, allergen, production line, recommendation)
  - Add "Add Declaration", "Reassign Line", "Dismiss" buttons
- **Testing**:
  - Unit tests: Cross-contamination detection accuracy, edge cases
  - E2E tests: Warnings appear, actions work correctly
- **Story Points**: 13 (8 dev hours)

**Week 7: PDF Export & Compliance Report**
- **Tasks**:
  - Implement PDF generation (jsPDF or server-side)
  - Include: Matrix table, warnings, summary stats
  - Add digital signature (user name, date)
  - Compliance formatting (FSMA 204, EU 1169/2011)
  - Add "Send to QA Manager" email functionality
- **Testing**:
  - Unit tests: PDF generation, content validation
  - E2E tests: PDF downloads, email sends
- **Story Points**: 8 (5 dev hours)

**Total Phase 2 Effort**: 34 Story Points (21 dev hours ≈ 3 weeks)

---

### 7.3 Timeline & Milestones

**Total Effort**: 76 Story Points (47 dev hours ≈ **6-7 weeks**)

| Phase | Duration | Deliverables | Priority | Status |
|-------|----------|--------------|----------|--------|
| **Phase 1 (MVP)** | Weeks 1-4 | Grouped Dashboard, BOM Timeline, Integrated Routings | P1 | ⏳ Planned |
| **Phase 2 (Growth)** | Weeks 5-7 | Allergen Matrix, Cross-Contamination, PDF Export | P2 | ⏳ Planned |
| **Phase 3 (Future)** | TBD | BOM Costing (Epic 4.4), Advanced Timeline (drag-to-adjust dates) | P3 | 📋 Backlog |

**Milestones**:

| Milestone | Target Date | Success Criteria |
|-----------|-------------|------------------|
| **M1: Dashboard Refactor** | End of Week 1 | 3 grouped categories visible, old tabs removed, E2E tests passing |
| **M2: BOM Timeline** | End of Week 2 | Gantt chart renders, version bars color-coded, Today marker visible |
| **M3: Overlap Detection** | End of Week 3 | Overlap warnings appear, auto-fix resolves conflicts, 0 false positives in testing |
| **M4: Integrated Routings** | End of Week 4 | Product card shows routing, operations visible, Edit button works |
| **M5: Allergen Matrix MVP** | End of Week 5 | Matrix table loads, cells populated, hover tooltips work |
| **M6: Cross-Contamination** | End of Week 6 | Warnings appear, Add Declaration works, warnings disappear after action |
| **M7: PDF Export** | End of Week 7 | PDF generates, compliance formatting correct, email sends |

---

### 7.4 Risk Mitigation

**Risk 1: BOM Timeline Performance (Large Datasets)**

**Issue**: Rendering gantt chart for products with 10+ BOM versions may be slow.

**Mitigation**:
- **Solution A**: Limit timeline view to last 24 months (configurable)
- **Solution B**: Virtualize version bars (only render visible versions)
- **Solution C**: Use server-side rendering for initial gantt SVG (RSC)
- **Acceptance Criteria**: Timeline loads in < 2 seconds for 15 versions

**Risk 2: Allergen Matrix Performance (28 products × 14 allergens = 392 cells)**

**Issue**: Building 392 matrix cells may require 392 API calls (too slow).

**Mitigation**:
- **Solution A**: Batch API calls (fetch all products + allergens in 2 calls, build matrix client-side)
- **Solution B**: Server-side matrix building (single API call returns pre-built matrix)
- **Solution C**: Cache matrix data (15-min cache, refresh on demand)
- **Acceptance Criteria**: Matrix loads in < 5 seconds

**Risk 3: Cross-Contamination Detection Accuracy**

**Issue**: False positives (warning about cross-contamination when production line has cleaning protocol).

**Mitigation**:
- **Solution A**: Add "Cleaning Protocol" flag to production_lines table (suppress warnings if protocol exists)
- **Solution B**: Allow users to "Dismiss" warnings (mark as reviewed)
- **Solution C**: Add "Acceptable Risk" option (saves justification in database)
- **Acceptance Criteria**: < 10% false positive rate (validated by Ewa's manual audit)

**Risk 4: User Adoption Resistance**

**Issue**: Users may resist change from familiar 5-tab system.

**Mitigation**:
- **Solution A**: Provide training session (1-hour workshop before launch)
- **Solution B**: Add "Help" tooltips on dashboard (explain grouped categories)
- **Solution C**: Keep old 5-tab navigation as "Classic View" toggle for 4 weeks (deprecate after user adoption > 90%)
- **Acceptance Criteria**: 80% of users prefer new UI after 2 weeks (A/B test survey)

---

### 7.5 Deployment Strategy

**Staging Environment**:
1. Deploy Phase 1 to staging (Week 4)
2. User acceptance testing (UAT) with Ewa, Tomasz, Karol (3 days)
3. Collect feedback, fix bugs
4. Deploy Phase 2 to staging (Week 7)
5. UAT again (3 days)

**Production Rollout**:
1. **Soft Launch** (Week 8): Enable new UI for 3 pilot users (Ewa, Tomasz, Karol)
2. **Phased Rollout** (Week 9): Enable for 50% of technical staff
3. **Full Rollout** (Week 10): Enable for all users
4. **Deprecate Old UI** (Week 14): Remove 5-tab navigation code (if adoption > 90%)

**Rollback Plan**:
- Feature flag: `ENABLE_GROUPED_DASHBOARD` (toggle in settings.json)
- If critical bug detected: Disable feature flag, revert to 5-tab navigation
- Hotfix within 24 hours, re-enable after testing

---

### 7.6 Post-Launch Support

**Week 1-2 (Stabilization Period)**:
- Daily monitoring: Check error logs, user feedback
- Hotfix critical bugs within 24 hours
- Respond to user questions in Slack #technical-module-support

**Week 3-4 (Optimization)**:
- Performance tuning: Optimize slow queries, reduce API calls
- UX tweaks: Adjust colors, spacing based on user feedback
- Add missing features (e.g., "Export BOM to Excel" if requested)

**Month 2-3 (Analytics Review)**:
- Review success metrics (BOM version selection time, allergen audit time)
- Compare actual vs target savings (90 hours/year)
- User satisfaction survey (quarterly)
- Plan Phase 3 features based on feedback

---

## Summary & Next Steps

### Executive Summary Recap

**Problem**: Technical Module uses 5-tab navigation causing excessive context switching, lacks visual BOM timeline, has no allergen cross-contamination detection.

**Solution**: Grouped dashboard (3 categories), visual BOM timeline with overlap detection, integrated routings, allergen matrix (P2).

**Impact**:
- **Time Savings**: 90 hours/year (€2,250/year)
- **Error Reduction**: 90% fewer BOM version conflicts, 50% fewer allergen errors
- **User Satisfaction**: 4/10 → 9/10 (Ewa's rating)

**Timeline**: 6-7 weeks (Phase 1: 4 weeks MVP, Phase 2: 3 weeks Growth)

**ROI**: 40.6% (3-year), Payback period: 2.1 years

---

### Next Steps

**For Development Team**:
1. Review specification with Ewa, Tomasz, Karol (validate wireframes, workflows)
2. Estimate Story Points (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
3. Prioritize Phase 1 tasks in backlog
4. Assign developer(s) to Technical Module (recommend 1 senior dev, 6-7 weeks)
5. Set up staging environment for UAT

**For UX Designer** (if applicable):
1. Create high-fidelity mockups from wireframes (Figma, Sketch)
2. Design visual timeline color scheme (green/yellow/gray for version status)
3. Design allergen matrix heatmap colors (green=declared, orange=warning, white=none)
4. Create style guide for Technical Module (consistent with Planning, Production, Scanner modules)

**For Technical Manager (Ewa)**:
1. Review wireframes and workflows (validate against real-world usage)
2. Provide sample BOM data for testing (products with 3+ versions, overlapping dates)
3. Provide allergen cross-contamination examples (for testing warning logic)
4. Schedule training session for team (1 hour, Week 8)

**For Product Owner**:
1. Approve Phase 1 scope (MVP) and timeline (4 weeks)
2. Decide on Phase 2 timing (defer to Phase 2 or include in MVP?)
3. Communicate UX redesign to stakeholders (explain grouped dashboard change)
4. Plan user acceptance testing (3 days, Week 4 and Week 7)

---

**End of Technical Module UX Design Specification**

**Document Version**: v1.0
**Created**: 2025-11-15
**Author**: Claude (AI UX Designer)
**Approved By**: [Pending approval]

