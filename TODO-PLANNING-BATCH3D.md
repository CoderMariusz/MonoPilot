# Planning Module - Batch 3D Implementation TODO

**Last Updated:** 2025-11-27
**Context Used:** ~97k / 200k tokens
**Commits:** 4 commits made

---

## ✅ COMPLETED

### Story 3.27: Work Orders Table View
- [x] Create TopWOCards component (`/components/planning/TopWOCards.tsx`)
  - Fetches 3 most recent WOs from API
  - Shows: WO #, Machine, Status, Progress % with progress bar
  - Max 100px height, compact card layout
  - Links to detail page on click
- [x] Add TopWOCards to Planning dashboard (`/planning/page.tsx`)

### Story 3.28: Transfer Orders Table View
- [x] Create TopTOCards component (`/components/planning/TopTOCards.tsx`)
  - Fetches 3 most recent TOs from API
  - Shows: TO #, From Warehouse, To Warehouse, Status
  - Max 100px height, compact card layout
  - Links to detail page on click
- [x] Add TopTOCards to Planning dashboard (`/planning/page.tsx`)

### Story 3.30: Color Consistency (PARTIAL - Ongoing)
- [x] Create `/lib/constants/planning-colors.ts` with PLANNING_COLORS and getStatusColor()
- [x] Apply color consistency to TopPOCards
  - Use getStatusColor() for badges
  - Remove hardcoded statusColors
- [x] Apply color consistency to TopWOCards
  - Use getStatusColor() for badges
  - Remove hardcoded statusColors
- [x] Apply color consistency to TopTOCards
  - Use getStatusColor() for badges
  - Remove hardcoded statusColors
- [x] Apply color consistency to PurchaseOrdersTable
  - Import PLANNING_COLORS.button.primary
  - Use getStatusColor() for status badges
  - Remove getStatusVariant() function
- [x] Apply color consistency to PlanningActionButtons
  - Use PLANNING_COLORS.button.primary for all Create buttons (PO, TO, WO)
  - Replace hardcoded green-600/green-700

**TypeScript:** ✅ All checks passed

---

## 🔄 IN PROGRESS / TODO

### Story 3.30: Color Consistency (Continue)
**Current Status:** planning-colors.ts updated to app-colors.ts (per story file update)

- [ ] **Rename** `planning-colors.ts` → `app-colors.ts`
  - Update all imports in:
    - TopPOCards
    - TopWOCards
    - TopTOCards
    - PurchaseOrdersTable
    - PlanningActionButtons

- [ ] Apply colors to **WorkOrdersTable**
  - Import getStatusColor
  - Update status badge rendering
  - Replace any hardcoded colors

- [ ] Apply colors to **TransferOrdersTable**
  - Import getStatusColor
  - Update status badge rendering
  - Replace any hardcoded colors

- [ ] Apply colors to **PlanningHeader**
  - Settings button styling (outline variant)

- [ ] Apply colors to **PlanningStatsCard**
  - Icon colors
  - Number colors
  - Links/actions

- [ ] Audit all components for hardcoded colors:
  - Search for: `bg-gray-`, `bg-blue-`, `bg-green-`, `bg-red-`, `text-gray-`, etc.
  - Replace with centralized PLANNING_COLORS

---

### Story 3.29: Mobile Responsive Design
**Status:** Ready for development

#### Phase 1: Foundation
- [ ] Create `/lib/hooks/useResponsiveView.ts` hook
  - Returns: `{ isMobile, isTablet, isDesktop }`
  - Based on breakpoints: sm=640px, md=768px, lg=1024px

#### Phase 2: Tables - Card View on Mobile
- [ ] Update **PurchaseOrdersTable**
  - Render as expandable cards on < 768px
  - Card structure: `[PO# | Status | Supplier | >]`
  - Expanded: Show all columns + actions
  - Smooth CSS transition (200ms)

- [ ] Update **WorkOrdersTable**
  - Card view on mobile
  - Card structure: `[WO# | Status | Machine | >]`
  - Expanded: Product, Qty, Progress, Actions

- [ ] Update **TransferOrdersTable**
  - Card view on mobile
  - Card structure: `[TO# | Status | WH-A→B | >]`
  - Expanded: Items, Date, Actions

#### Phase 3: Header & Navigation (Mobile)
- [ ] Update **PlanningHeader**
  - Hamburger menu icon on < 768px (lg:hidden)
  - Keep logo visible
  - Collapse nav tabs to hamburger

- [ ] Create **PlanningMobileNav** component
  - Full-screen overlay navigation
  - Current page indicator (●)
  - Close on tap outside or X button
  - Smooth animation (200ms)

#### Phase 4: Action Buttons & Layout
- [ ] Update **PlanningActionButtons**
  - Stack vertically on mobile
  - Full-width buttons on < 768px
  - Maintain 44px+ touch target height

- [ ] Update responsive padding across all pages
  - Mobile (sm): `px-4 py-4` (16px)
  - Tablet (md): `px-6 py-6` (24px)
  - Desktop (lg): `px-8 py-6` (32px)

- [ ] Hide Spreadsheet Mode toggle on mobile (WO page)
  - Only available on lg+ breakpoint

#### Phase 5: Verification
- [ ] Test on real devices:
  - iPhone 12 (390px)
  - iPhone SE (375px)
  - Pixel 6 (412px)
  - iPad (768px)
- [ ] Verify no horizontal scrolling
- [ ] Verify touch targets min 48px × 48px
- [ ] Verify min 8px spacing between clickable elements

---

## 📋 EXECUTION ORDER (Recommended)

1. **First:** Rename planning-colors.ts → app-colors.ts (quick)
   - Update all imports across 5 files
   - Run type-check
   - Commit: "refactor: Rename planning-colors to app-colors (shared)"

2. **Second:** Complete color consistency (WorkOrders, TransferOrders, Header, StatsCard)
   - 4 components, ~30 min
   - Run type-check
   - Commit: "refactor: Apply color consistency to all Planning components"

3. **Third:** Mobile responsive (Story 3.29)
   - Start with useResponsiveView hook
   - Then update each table component
   - Add header/nav mobile support
   - Takes ~2-3 hours

---

## 📁 FILES MODIFIED (Batch 3D)

### Created
- ✅ TopWOCards.tsx
- ✅ TopTOCards.tsx
- ✅ planning-colors.ts (→ app-colors.ts)

### Updated
- ✅ planning/page.tsx (added TopTOCards, TopWOCards)
- ✅ PurchaseOrdersTable.tsx (colors)
- ✅ PlanningActionButtons.tsx (colors)
- ✅ TopPOCards.tsx (colors)
- ✅ TopWOCards.tsx (colors)
- ✅ TopTOCards.tsx (colors)

### To Update
- [ ] WorkOrdersTable.tsx (colors + mobile)
- [ ] TransferOrdersTable.tsx (colors + mobile)
- [ ] PlanningHeader.tsx (colors + mobile)
- [ ] PlanningStatsCard.tsx (colors)
- [ ] All planning pages (responsive padding)

---

## 🎯 GIT COMMITS MADE

1. `d3b0835` - feat: Add TopWOCards and TopTOCards components to Planning dashboard
2. `7417943` - refactor: Apply color consistency to Planning cards (Story 3.30)
3. `048c065` - refactor: Apply color consistency to PurchaseOrdersTable (Story 3.30)
4. `306e80e` - refactor: Apply color consistency to PlanningActionButtons (Story 3.30)

---

## 🚀 NEXT STEPS FOR OPUS

When continuing with Claude Opus:

1. **Import this file** to understand context
2. **Run type-check** to verify current state
3. **Start with rename:** `planning-colors.ts` → `app-colors.ts`
4. **Apply remaining colors** to 4 components
5. **Build mobile responsive** incrementally (hook → tables → header → buttons)

**Key Points for Opus:**
- User emphasizes: "szybki, bardzo funkcjonalny, nie skomplikowany" (fast, functional, not complicated)
- Save tokens: Do iteratively, not all at once
- All UX designs are in `/docs/ux-design/` folder
- Color system defined in planning-colors.ts (to be renamed)
- Breaking changes: None - backward compatible refactoring

---

**Status:** Ready to hand off to Opus
**Estimated Remaining Time:** 2-3 hours for full completion
