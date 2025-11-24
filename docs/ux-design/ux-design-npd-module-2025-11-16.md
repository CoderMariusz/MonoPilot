# MonoPilot NPD Module - UX Design Specification

**Projekt:** MonoPilot NPD (New Product Development) Module
**Wersja:** 1.0
**Data:** 2025-11-16
**Autor:** BMad UX Design Workflow
**Status:** Final - Ready for Implementation

---

## 1. Executive Summary

NPD Module to **premium add-on** dla MonoPilot, implementujący Stage-Gate methodology (G0 → G4) dla food manufacturers. Module wspiera full lifecycle New Product Development: od initial idea (G0), przez formulation development (G1-G2), regulatory approval (G3), do final handoff to production (G4).

**Core UX Principles:**
1. **Confidence before handoff** - Real-time validation, progress transparency, data completeness indicators
2. **Effortless iteration** - Spreadsheet-like formulation editing, keyboard shortcuts, inline edits
3. **Visual clarity** - Color-coded gates, Kanban dashboard, risk matrix visualization

**Target Users:**
- **Primary:** Food manufacturers (Growth/Enterprise, 50-250 employees) with R&D departments
- **Secondary:** R&D consultancies (NPD-only mode, without production integration)

**Roles:** NPD Lead, R&D Manager, Regulatory Specialist, Finance, Production

---

## 2. Design System Foundation

### 2.1 Design System Strategy

**Hybrid Approach:**
- **MonoPilot Core** (`/planning`, `/production`, `/warehouse`, `/scanner`): Zachowuje custom Tailwind components
- **NPD Module** (`/npd/*`): Używa **shadcn/ui** dla complex components (wizard stepper, formulation table, version timeline)

**Rationale:**
- **Bounded Context Architecture**: NPD route group `/npd` = naturalny boundary dla separate design system
- **Complexity**: NPD potrzebuje professional components (wizard, timeline, advanced tables)
- **ROI**: shadcn przyśpiesza development ~30% (gotowe accessible components)
- **Maintenance**: shadcn = copy-paste code (nie external dependency), łatwy customization

### 2.2 Technology Stack

- **UI Library:** shadcn/ui (Tailwind-native, Radix UI primitives)
- **Styling:** Tailwind CSS 3.4
- **Icons:** Lucide React
- **Charts:** Recharts (costing widgets)
- **Drag-Drop:** react-beautiful-dnd (Kanban)
- **Forms:** react-hook-form + Zod validation
- **Framework:** Next.js 15, React 19, TypeScript 5.7

### 2.3 shadcn/ui Components Used

7 shadcn components dla NPD:
1. **Stepper** - Handoff Wizard progress indicator
2. **Table** + **DataTable** - Formulation spreadsheet editor
3. **Slider** - Version timeline selector
4. **Card** - Kanban project cards
5. **Dialog** - Modals (full-screen wizard, create project)
6. **Form** - All forms with validation
7. **Badge** - Gate status, risk levels

---

## 3. Visual Foundation

### 3.1 Color Theme: Innovation Light ⭐ (Recommended)

**Interactive Preview:** `docs/ux-color-themes.html`

**Why Light Theme:**
- **Premium feel**: Light theme + gradient accents = modern, high-value perception (NPD = premium add-on)
- **R&D ergonomia**: Mniej męczący dla 4-6h formulation editing sessions
- **Bounded Context**: NPD route group = naturalny boundary (Production = dark, NPD = light)
- **shadcn/ui synergy**: shadcn components designed dla light themes

### 3.2 Color Palette Specification

**Primary Colors:**
- **Primary**: `blue-500` (#3B82F6) - CTA buttons, active states, links
- **Secondary**: `indigo-600` (#4F46E5) - Gradients, accents
- **Background**: `gray-50` (#F9FAFB) - Main background
- **Surface**: `white` (#FFFFFF) - Cards, modals, panels

**Text Colors:**
- **Text Primary**: `gray-900` (#111827)
- **Text Secondary**: `gray-700` (#374151)
- **Text Muted**: `gray-500` (#6B7280)

**Gate Status Colors (consistent across themes):**
- **G0 (Idea)**: `red-500` (#EF4444)
- **G1 (Concept)**: `orange-600` (#EA580C) - adjusted dla contrast
- **G2 (Development)**: `amber-500` (#F59E0B)
- **G3 (Testing)**: `lime-500` (#84CC16)
- **G4 (Launch)**: `green-600` (#16A34A) - adjusted dla contrast

**Risk Level Colors:**
- **Critical**: `red-600` (#DC2626)
- **High**: `orange-600` (#EA580C)
- **Medium**: `yellow-500` (#EAB308)
- **Low**: `green-600` (#16A34A)
- **Very Low**: `blue-500` (#3B82F6)

### 3.3 Accessibility

**WCAG 2.1 AA Compliance:**
- All color combinations tested dla 4.5:1 contrast minimum
- Gate colors adjusted dla accessibility (orange-500 → orange-600, green-500 → green-600)
- Focus indicators: 2px blue-500 outline (outline-offset-2)

---

## 4. Design Direction & Key Screens

**Interactive Mockups:** `docs/ux-design-directions.html` (6 full-screen designs)

### 4.1 Direction 1: Kanban Dashboard ⭐ (Primary View)

**Purpose:** Portfolio overview dla NPD Lead (all active projects at-a-glance)

**Layout:**
- **Topbar:** Logo, module title "NPD Dashboard", "+ New Project" CTA, user avatar
- **Stats Bar:** 5 metrics (Active Projects, G0 count, G1 count, G2-G3 count, Ready for Handoff)
- **Kanban Board:** 5 columns (G0 → G4), drag-drop cards between gates

**Card Design:**
- **Gradient background:** Color-coded per gate (G0 red → G4 green)
- **Header:** Project ID (bold), Risk indicator (colored circle: H/M/L)
- **Body:** Project name (2 lines max), truncated description
- **Footer:** Progress badges (e.g., "📋 Formulation v1.2", "⏳ Compliance 2/5 docs")
- **Ready for Handoff:** Blue badge "🚀 Ready for Handoff" (G3 cards only)

**Interactions:**
- **Drag-drop:** Move cards between adjacent gates (G0 → G1, not G0 → G3)
- **Click card:** Opens Project Detail view (modal or page)
- **Hover:** Shadow increases (hover:shadow-md → shadow-xl)

### 4.2 Direction 2: Formulation Spreadsheet Editor ⭐ (Core UX)

**Purpose:** Iterative formulation editing (most frequent R&D action)

**Layout:**
- **Topbar:** Formulation title, version selector dropdown, "Compare Versions", "+ New Version" buttons
- **Version Timeline:** Horizontal timeline (v1.0 → v1.1 → v1.2), visual indicator dla active version
- **Spreadsheet Table:** Google Sheets-like, columns: # | Ingredient Name | Percentage (%) | Quantity (kg) | Unit Cost | Allergens | Actions
- **Footer:** Sticky totals (Total: 100%, 10.0 kg, Est. Cost: $29.25)
- **Allergen Aggregation Panel:** Below table, yellow background, auto-updated allergen chips

**Interactions:**
- **Inline editing:** Click cell → border-blue-500 focus, type → Enter saves, ESC cancels
- **Keyboard nav:** ↑↓ navigate rows, Tab navigate columns, Ctrl+D duplicate row
- **Add ingredient:** Click "+ Add Ingredient" button → New row appears, focus on Ingredient Name cell
- **Remove ingredient:** Click "Remove" button → Confirmation dialog → Row deleted
- **Auto-save:** Debounced 500ms, toast notification "Changes saved"

**Version Management:**
- **Version selector:** Dropdown (v1.0, v1.1, v1.2 - Active)
- **New version:** Click "+ New Version" → Copies current version → Opens editor dla v1.3
- **Compare versions:** Side-by-side diff view (v1.0 vs v1.2, highlighted changes in yellow)

### 4.3 Direction 3: 5-Step Handoff Wizard ⭐ (Critical Path)

**Purpose:** NPD → Production transfer (one-way, irreversible operation)

**Layout:**
- **Progress Stepper:** Horizontal, 5 steps (1. Validation → 2. Product Decision → 3. BOM Transfer → 4. Pilot WO → 5. Execute)
- **Step indicator:** Completed (green ✓), Active (blue circle with number), Pending (gray circle)
- **Step content:** Form fields, validation messages, preview panels
- **Navigation:** "← Back" (left), "Next →" (right, disabled if validation fails)

**Step Breakdown:**

**Step 1: Validation**
- Auto-check: Formulation complete ✅, Compliance docs uploaded ✅, Costing approved ✅
- Display: Summary table (criteria | status | details)
- Validation: All ✅ required to proceed

**Step 2: Product Decision (Fork Path)**
- Choice: "Create New Product" (default) OR "Use Existing Product"
- **Fork A (Create New):**
  - Form fields: Part Number*, Product Name*, Product Type*, UoM*
  - Real-time validation (Part Number uniqueness check)
- **Fork B (Use Existing):**
  - Product selector dropdown
  - Warning: "This will create new BOM version dla selected product"

**Step 3: BOM Transfer**
- Preview: Formulation v1.2 → BOM v1.0 mapping
- Table: Ingredient Name → BOM Item, Percentage → Qty, Allergens auto-populated
- Confirmation: "Confirm BOM Transfer" button

**Step 4: Pilot WO**
- Auto-generated fields: Qty (minimum batch), Scheduled date (Today + 7 days)
- User input: Production Line selector, Notes (optional)
- Routing: Auto-generated simplified routing (2 operations: Mixing, Packaging)

**Step 5: Execute**
- Summary: Product created ✅, BOM transferred ✅, Pilot WO #001 created ✅
- Confirmation message: "Handoff complete. NPD-005 moved to G4 (Launch)."
- Actions: "Go to Production Module" (redirects to `/production`), "Close" (returns to Dashboard)

### 4.4 Direction 4: Costing Calculator Widget (Dashboard Panel)

**Purpose:** Finance role - Cost variance monitoring

**Layout:**
- **Header:** "Cost Analysis", Project ID
- **Comparison Bars:** 3 horizontal bars (Target, Estimated, Actual) with $ amounts
- **Variance Alert:** Red/Yellow/Green alert box based on threshold (Finance configurable)
- **Cost Breakdown:** Pie chart or table (Ingredients 77%, Packaging 11%, Labor 9%, Overhead 3%)

**Interactions:**
- **Approve Variance:** Button (if Estimated > Target by >10%) → Modal: "Reason?" → Submit
- **Reject:** Button → Sends notification to R&D "Cost optimization required"

### 4.5 Direction 5: Compliance Document Tracker (Dashboard Panel)

**Purpose:** Regulatory role - Gate-specific document checklist

**Layout:**
- **Header:** "Compliance Tracker", Gate badge (G2: Development 2/5 docs)
- **Checklist:** Table (Document Type | Status | Uploaded By | Date | Actions)
- **Status indicators:** ✅ green (uploaded), ❌ red (missing blocker), ○ gray (optional)
- **Gate Advancement Blocker:** Red alert box "Cannot advance to G3 - SDS missing"

**Interactions:**
- **Upload:** Click "Upload" button → Modal: Drag-drop PDF → Tag document type → Submit
- **View:** Click "View" button → Opens PDF in new tab
- **Status change:** Upload → ❌ → ✅ (auto-updates gate advancement validation)

### 4.6 Direction 6: Risk Matrix Visualization (Dashboard Panel)

**Purpose:** NPD Lead - Portfolio risk assessment

**Layout:**
- **2D Grid:** 3×3 (Likelihood × Impact), color-coded zones (red = critical, yellow = medium, green = low)
- **Projects:** Colored dots positioned in grid, hover tooltip (Project ID, Risk level)
- **Axes:** X-axis (Likelihood: Low → Medium → High), Y-axis (Impact: Low → Medium → High)
- **Legend:** Color-coded dots with labels (Critical Risk, High Risk, Medium Risk, Low Risk, Very Low Risk)

**Interactions:**
- **Hover dot:** Tooltip shows Project ID, Name, Risk level, Gate
- **Click dot:** Opens Project Detail view

---

## 5. User Journey Flows

### 5.1 Journey 1: NPD Lead - Create New Project & Monitor Progress

**Steps:**
1. Dashboard (Kanban) → Click "+ New Project"
2. Modal: Fill Project name, Target cost, Target gate date, Assign R&D owner → Submit
3. New card appears in G0 column (red, "Idea" badge)
4. Monitor: Drag card to G1 when R&D creates formulation v1.0
5. Gate advancement: Auto-move when validation met (formulation complete → G1 → G2)
6. Handoff: G3 card with "🚀 Ready for Handoff" badge → Click "Start Handoff Wizard"

### 5.2 Journey 2: R&D Manager - Create Formulation (Iterative)

**Steps:**
1. Dashboard → Click NPD-003 card → Project Detail view → Tab: "Formulation"
2. Click "+ Create Formulation v1.0"
3. Spreadsheet Editor:
   - Add ingredients (inline editing: Click → Type → Enter saves)
   - Observe allergen aggregation (auto-updates as ingredients added)
   - Footer shows Total: 100%, Estimated Cost: $29.25
4. Create v1.1: Version dropdown → "+ New Version" → Edit changes
5. Compare: "Compare Versions" → Side-by-side diff (v1.0 vs v1.1)
6. Activate v1.1: Set as "Active" (default dla handoff)

### 5.3 Journey 3: Finance - Review Costing & Approve Variance

**Steps:**
1. Dashboard → Filter "Finance Approval Required" (Estimated > Target by >10%)
2. Click NPD-003 → Tab: "Costing"
3. Costing Widget: See Target $25.00, Estimated $29.25, Variance +17.0%
4. Review breakdown: Ingredients $22.50, Packaging $3.25, Labor $2.50, Overhead $1.00
5. Decision: Click "Approve Variance" → Modal: "Reason?" → Type justification → Submit
6. Card updated: Finance approval ✅ (gate advancement unblocked)

### 5.4 Journey 4: Regulatory - Upload Compliance Documents

**Steps:**
1. Dashboard → Click NPD-004 card (G2) → Tab: "Compliance"
2. Compliance Tracker: See G2 checklist (HACCP ✅, Allergen Statement ✅, SDS ❌)
3. Click "Upload" dla SDS → Drag-drop PDF → Tag type: "Safety Data Sheet" → Submit
4. Status change: ❌ → ✅ (green checkmark)
5. Gate advancement: Blocker removed (all required docs uploaded)

### 5.5 Journey 5: NPD Lead - Execute Handoff Wizard

**Steps:**
1. Dashboard → NPD-005 "🚀 Ready for Handoff" badge → Click "Start Handoff"
2. **Step 1:** Validation auto-checks pass → Click "Next"
3. **Step 2:** Select "Create New Product" → Fill Part Number, Name, Type, UoM → Click "Next"
4. **Step 3:** Review BOM Transfer preview → Click "Confirm BOM Transfer"
5. **Step 4:** Auto-fill Pilot WO (Qty 10 kg, Date +7 days) → Select Production Line → Click "Create Pilot WO"
6. **Step 5:** Summary (Product ✅, BOM ✅, WO ✅) → Click "Go to Production Module" → Redirect to `/production`

### 5.6 Journey 6: Production - Execute Pilot WO & Report Actual Cost

**Steps:**
1. Production Module (`/production`) → WO #001 visible (Pilot for NPD-005)
2. Execute WO: Record consumption, yield, by-products
3. Actual cost calculated: Labor + overhead → $30.15
4. Sync to NPD: NPD-005 Costing Widget updated (Estimated $29.25 → Actual $30.15)
5. NPD Module → Costing tab shows Actual bar (red, variance +2.9%)

---

## 6. Component Library Strategy

### 6.1 NPD-Specific Components (shadcn/ui)

| Component | shadcn Base | Customization | Usage |
|-----------|-------------|---------------|-------|
| **Stepper** | `Stepper` | 5-step horizontal, blue-500 colors | Handoff Wizard progress |
| **Table** | `Table` + `DataTable` | Inline editing, keyboard nav, allergen chips | Formulation Editor |
| **Slider** | `Slider` | Version timeline (discrete v1.0, v1.1, v1.2) | Version selector |
| **Card** | `Card` | Gradient backgrounds (G0 red → G4 green), drag-drop | Kanban cards |
| **Dialog** | `Dialog` | Full-screen (Handoff Wizard), modal (Create Project) | Wizards & modals |
| **Form** | `Form` + `react-hook-form` + `zod` | Real-time validation, inline errors | All forms |
| **Badge** | `Badge` | Custom colors (gate status, risk levels) | Status indicators |

### 6.2 Custom NPD Components (New)

- **KanbanBoard** - Drag-drop columns (react-beautiful-dnd)
- **FormulationTable** - Extends shadcn DataTable with inline editing
- **AllergenAggregationPanel** - Auto-updated allergen chips
- **VersionTimeline** - Horizontal timeline slider (custom SVG)
- **CostingWidget** - Comparison bars (recharts), variance alerts
- **ComplianceChecklist** - Gate-specific document list
- **RiskMatrix** - 2D grid SVG, hover tooltips

### 6.3 Component Organization

```
apps/frontend/components/npd/
├── dashboard/
│   ├── KanbanBoard.tsx
│   ├── KanbanCard.tsx (shadcn Card extended)
│   └── KanbanColumn.tsx
├── formulation/
│   ├── FormulationTable.tsx (shadcn DataTable)
│   ├── AllergenAggregationPanel.tsx
│   ├── VersionTimeline.tsx
│   └── VersionDiffModal.tsx (shadcn Dialog)
├── handoff/
│   ├── HandoffWizard.tsx (shadcn Dialog)
│   ├── WizardStepper.tsx (shadcn Stepper)
│   └── steps/
│       ├── Step1Validation.tsx
│       ├── Step2ProductDecision.tsx (shadcn Form)
│       ├── Step3BOMTransfer.tsx
│       ├── Step4PilotWO.tsx (shadcn Form)
│       └── Step5Execute.tsx
├── widgets/
│   ├── CostingWidget.tsx (recharts)
│   ├── ComplianceWidget.tsx
│   └── RiskMatrixWidget.tsx
└── shared/
    ├── NPDCard.tsx (shadcn Card base)
    ├── GateBadge.tsx (shadcn Badge custom)
    └── RiskIndicator.tsx
```

---

## 7. UX Pattern Decisions

### 7.1 Navigation Patterns

- **Primary nav**: Sidebar `/npd` (icon: Lightbulb or Flask)
- **Secondary nav**: Tabs w Project Detail (Formulation | Costing | Compliance | Risk | History)
- **Breadcrumbs**: Dashboard > NPD-003 > Formulation v1.2
- **Back button**: Top-left, returns to Dashboard

### 7.2 Button Patterns

- **Primary CTA**: `bg-blue-500 hover:bg-blue-600 text-white` - "+ New Project", "Start Handoff", "Next"
- **Secondary**: `bg-gray-100 text-gray-700 hover:bg-gray-200` - "Back", "Cancel", "Compare Versions"
- **Destructive**: `bg-red-500 text-white hover:bg-red-600` - "Delete Project", "Remove Ingredient"
- **Size**: 44px height (touch-friendly), `text-sm font-medium`
- **Disabled**: `opacity-50 cursor-not-allowed`

### 7.3 Form Patterns

- **Validation**: Real-time (on blur), inline error messages (red text below field)
- **Required fields**: Asterisk (*) w label, red border on error
- **Input styling**: `px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`
- **Auto-save**: Debounced 500ms, toast "Changes saved"

### 7.4 Modal Patterns

- **Small**: 500px width (Create Project, Upload Document)
- **Large**: 900px width (Project Detail tabs)
- **Full-screen**: Handoff Wizard (`max-w-none`)
- **Backdrop**: `bg-black/50`, click outside closes (with unsaved changes confirmation)
- **Close**: Top-right ✕ icon, ESC key

### 7.5 Table Patterns

- **Header**: Sticky (`top-0`), `bg-gray-50`, uppercase `text-xs font-medium`
- **Rows**: Hover `bg-blue-50`, `cursor-pointer` if clickable
- **Sorting**: Click column → arrow icon (↑ asc, ↓ desc)
- **Inline editing**: Click cell → `border-blue-500 focus:ring-2`, Enter saves, ESC cancels
- **Footer**: Sticky (`bottom-0`), `bg-gray-50`, bold totals

### 7.6 Status Indicators

- **Gate badges**: Colored dots + text (G0 `red-500`, G1 `orange-600`, G2 `amber-500`, G3 `lime-500`, G4 `green-600`)
- **Risk badges**: Rounded-full (H `red-500`, M `yellow-500`, L `green-500`)
- **Progress badges**: % completion (65% `yellow-500`, 80% `lime-500`, 100% `green-500`)
- **Document status**: ✅ `green-500` (uploaded), ❌ `red-500` (missing), ○ `gray-300` (optional)

### 7.7 Drag-Drop Patterns

- **Kanban cards**: react-beautiful-dnd, 300ms animations, drop zones highlighted (`border-blue-500 dashed`)
- **Visual feedback**: Card shadow increases on drag (`hover:shadow-md` → `shadow-xl`), opacity 0.5 for placeholder
- **Constraints**: Only adjacent gates (G0 → G1, not G0 → G3), validation on drop

### 7.8 Loading States

- **Skeleton screens**: `bg-gray-200 animate-pulse` dla tables, cards
- **Spinner**: Lucide `Loader2` icon (`animate-spin`) dla buttons, modals
- **Optimistic updates**: Formulation edits render immediately, revert on error (toast "Failed to save")

### 7.9 Empty States

- **No projects**: Centered message + "+ New Project" CTA
- **No documents**: "No documents uploaded yet. Click Upload to add." + Upload button
- **G4 empty**: "No projects launched yet" + muted text

### 7.10 Error Handling

- **Inline errors**: Red text below field (`text-sm text-red-600`)
- **Toast errors**: Red toast (`bg-red-50 border-red-200 text-red-800`), auto-dismiss 5s
- **Wizard blockers**: Red alert box (`bg-red-50 border-red-200`) + icon (!) + message
- **Retry actions**: "Retry" button on failed operations

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Breakpoints

- **Mobile**: < 640px (sm) - Read-only views, vertical stacking
- **Tablet**: 640px - 1024px (sm-lg) - Hybrid (limited editing)
- **Desktop**: > 1024px (lg+) - Full editing capabilities

### 8.2 Responsive Layout Decisions

| Screen | Breakpoint | Dashboard | Formulation Editor | Handoff Wizard |
|--------|------------|-----------|-------------------|----------------|
| **Mobile** | < 640px | Kanban vertical stack (swipe columns) | Read-only table (horizontal scroll) | Not available (desktop-only) |
| **Tablet** | 640-1024px | 2-3 columns visible (horizontal scroll) | Simplified editing (touch-optimized) | Vertical stepper (not horizontal) |
| **Desktop** | > 1024px | All 5 columns visible | Full spreadsheet UX (keyboard nav) | Full horizontal stepper |

### 8.3 Touch Optimization

- **Tap targets**: Minimum 44×44px (WCAG 2.5.5)
- **Spacing**: 16px minimum between interactive elements
- **Gestures**: Swipe left/right (Kanban columns), long-press (context menu), no pinch-zoom

### 8.4 Accessibility (WCAG 2.1 AA)

**Keyboard Navigation:**
- **Tab order**: Logical (left-to-right, top-to-bottom)
- **Focus indicators**: `outline-2 outline-blue-500 outline-offset-2`
- **Shortcuts**:
  - `/` → Focus search
  - `ESC` → Close modal
  - `Ctrl+S` → Save formulation
  - `↑↓` → Navigate table rows
  - `Tab` → Navigate table columns

**Screen Reader Support:**
- **Semantic HTML**: `<nav>`, `<main>`, `<section>`, `<article>`
- **ARIA labels**:
  - Kanban cards: `aria-label="NPD-001: Gluten-Free Cookie, G0 Idea, High Risk"`
  - Wizard stepper: `aria-current="step"` dla active step
  - Icon-only buttons: `aria-label="Add ingredient"`
- **Live regions**: `aria-live="polite"` dla toasts, auto-save status

**Color Contrast:**
- All combinations tested dla 4.5:1 minimum (WCAG AA)
- Gate colors adjusted: `orange-500` → `orange-600`, `green-500` → `green-600`

**Focus Management:**
- **Modal open**: Focus first input (e.g., project name)
- **Modal close**: Return focus to trigger button
- **Wizard navigation**: Focus "Next" button after step validation

**Error Prevention:**
- **Confirmations**: "Are you sure?" before destructive actions
- **Unsaved changes**: "You have unsaved changes. Discard?" warning
- **Real-time validation**: On blur, not after submit

### 8.5 Performance Optimization

- **Code splitting**: Lazy-load Handoff Wizard (`React.lazy()`)
- **Image optimization**: Next.js `<Image>` component (auto WebP, lazy loading)
- **Virtual scrolling**: For large formulation tables (>100 rows) - `react-window`
- **Debounced auto-save**: 500ms (prevent excessive API calls)

---

## 9. Implementation Guidance

### 9.1 Installation Steps

```bash
# 1. Install shadcn/ui (if not already installed)
npx shadcn-ui@latest init

# 2. Add shadcn components
npx shadcn-ui@latest add stepper table slider card dialog form badge

# 3. Install additional dependencies
pnpm add recharts react-beautiful-dnd react-hook-form zod react-window

# 4. Configure components.json dla NPD namespace
# Edit components.json:
# "aliases": {
#   "components": "@/components/npd",
#   "utils": "@/lib/utils"
# }
```

### 9.2 Route Structure

```
apps/frontend/app/npd/
├── layout.tsx (NPD-specific layout, light theme override)
├── page.tsx (Dashboard - Kanban Board)
├── [projectId]/
│   ├── page.tsx (Project Detail view with tabs)
│   └── formulation/
│       └── page.tsx (Formulation Editor full-screen)
└── handoff/
    └── [projectId]/
        └── page.tsx (Handoff Wizard full-screen)
```

### 9.3 API Layer

**New API Classes:**
- `NPDProjectsAPI` - CRUD dla npd_projects
- `NPDFormulationsAPI` - CRUD dla npd_formulations + npd_formulation_items
- `NPDHandoffAPI` - Handoff wizard logic (validation, BOM transfer, Pilot WO creation)
- `NPDComplianceAPI` - Document upload/download, checklist management
- `NPDCostingAPI` - Cost calculations, variance tracking

**Endpoints:**
- `GET /api/npd/projects` - List all projects (filtered by gate, role)
- `POST /api/npd/projects` - Create new project
- `GET /api/npd/projects/:id` - Get project details
- `PATCH /api/npd/projects/:id` - Update project (gate advancement, risk level)
- `DELETE /api/npd/projects/:id` - Delete project (soft delete)
- `GET /api/npd/formulations/:projectId` - List formulation versions
- `POST /api/npd/formulations/:projectId` - Create new version
- `PATCH /api/npd/formulations/:id` - Update formulation (inline edits)
- `POST /api/npd/handoff/:projectId` - Execute handoff wizard
- `POST /api/npd/compliance/:projectId/upload` - Upload document
- `GET /api/npd/costing/:projectId` - Get cost analysis

### 9.4 State Management

**Context Providers:**
- `NPDProjectProvider` - Current project state (id, name, gate, formulation versions)
- `HandoffWizardProvider` - Wizard state (current step, form data, validation results)
- `FormulationEditorProvider` - Editor state (active version, unsaved changes, allergen aggregation)

**SWR Hooks:**
- `useNPDProjects()` - Fetch all projects (real-time subscription via Supabase)
- `useNPDProject(id)` - Fetch single project with details
- `useFormulations(projectId)` - Fetch formulation versions
- `useComplianceChecklist(projectId, gate)` - Fetch gate-specific document checklist

### 9.5 Testing Strategy

**Unit Tests (Vitest):**
- Component tests: KanbanCard, FormulationTable, WizardStepper
- Utility tests: Cost calculations, allergen aggregation logic, validation rules

**E2E Tests (Playwright):**
- `01-npd-dashboard.spec.ts` - Create project, drag-drop cards, filter by gate
- `02-npd-formulation.spec.ts` - Create formulation, inline editing, version comparison
- `03-npd-handoff-wizard.spec.ts` - Full wizard flow (5 steps), BOM transfer validation
- `04-npd-costing.spec.ts` - Variance alerts, Finance approval workflow
- `05-npd-compliance.spec.ts` - Document upload, gate advancement blockers

**Accessibility Tests:**
- `axe-core` integration (automated a11y checks)
- Keyboard navigation tests (Tab order, focus management)
- Screen reader tests (manual NVDA/JAWS testing)

### 9.6 Documentation Updates

After implementation, run:

```bash
pnpm docs:update  # Auto-generate API_REFERENCE.md, DATABASE_SCHEMA.md
```

Update manually:
- `docs/NPD_MODULE.md` - User guide dla NPD Module
- `docs/API_REFERENCE.md` - Add NPD API endpoints (if docs:update missed them)
- `docs/DATABASE_SCHEMA.md` - Add npd_* tables documentation

---

## 10. Appendix

### 10.1 Related Documents

- **Product Requirements Document:** `docs/MonoPilot-NPD-Module-PRD-2025-11-15.md`
- **Architecture Document:** `docs/NPD-Module-Architecture-2025-11-15.md`
- **Brainstorming Session:** `docs/brainstorming-npd-module-2025-11-15.md`
- **Color Theme Preview:** `docs/ux-color-themes.html`
- **Design Direction Mockups:** `docs/ux-design-directions.html`

### 10.2 Design Assets

**Interactive Prototypes:**
- Kanban Dashboard: `ux-design-directions.html#direction-1`
- Formulation Editor: `ux-design-directions.html#direction-2`
- Handoff Wizard: `ux-design-directions.html#direction-3`

**Color Palette:**
- Color Theme Comparison: `ux-color-themes.html`

### 10.3 Open Questions & Decisions Needed

1. **Sidebar Icon:** Lightbulb (innovation) OR Flask (R&D lab)? → **Decision:** Lightbulb (more universal)
2. **Dashboard Widget Layout:** Fixed 3-column grid OR configurable drag-drop widgets? → **Decision:** MVP = Fixed layout, P1 = Drag-drop customization
3. **Mobile Support:** Read-only mobile OR full editing with touch-optimized UX? → **Decision:** MVP = Read-only, P1 = Touch editing
4. **Version Comparison:** Side-by-side modal OR inline diff (like GitHub)? → **Decision:** Side-by-side modal (clearer dla long formulations)

### 10.4 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-16 | 1.0 | Initial UX Design Specification | BMad UX Workflow |

---

**End of UX Design Specification**

**Next Steps:**
1. Review UX Design with stakeholders (NPD Lead, R&D, Finance, Regulatory)
2. Validate design directions with user testing (prototype mockups in `ux-design-directions.html`)
3. Proceed to `/bmad:bmm:workflows:create-story` dla Epic NPD-1 (Stage-Gate Dashboard) story breakdown
4. Begin implementation (install shadcn/ui, create component structure)

**Questions?** Contact: BMad Method Team
