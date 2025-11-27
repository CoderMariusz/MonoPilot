# MonoPilot Shared UI Design System

**Date:** 2025-11-27
**Version:** 1.0
**Scope:** Desk-facing modules (Planning, Technical, Production, Warehouse, Quality, Shipping, NPD, Settings)
**Based on:** Epic 2 (Technical: 02-25 to 02-28) + Epic 3 (Planning: 03-24 to 03-30)

---

## Executive Summary

MonoPilot implements a **consistent, scalable UI design system** across all desk-facing modules. The design prioritizes:
- **Consistency**: Every module uses identical header, stats cards, tables, and responsive patterns
- **Scalability**: Shared components reduce development time and ensure cohesive experience
- **Accessibility**: WCAG AA compliance, keyboard navigation, dark mode support
- **Performance**: Responsive design optimized for desktop/tablet/mobile workflows

This document defines the **foundation** that applies to **all modules** (Epic 1-9). Module-specific extensions are documented in dedicated `ux-design-{module}-module.md` files.

---

## 1. Shared Architecture

### 1.1 Module Header Component

Every desk-facing module has a reusable header with consistent pattern.

**Component:** `ModuleHeader.tsx`

**Props:**
```typescript
interface ModuleHeaderProps {
  module: 'planning' | 'technical' | 'production' | 'warehouse' | 'quality' | 'shipping' | 'npd' | 'settings'
  currentPage: string // 'dashboard' | 'purchase-orders' | 'products' | etc
}
```

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Logo/App    [Module Tabs Navigation]                  ⚙️ Settings│  (60px height)
│             Example: Planning│PO│TO│WO│Suppliers│⚙️             │
│             Example: Technical│Products│BOMs│Routings│Tracing│⚙️ │
├─────────────────────────────────────────────────────────────────┤
│ [Create Button]  [Create Button]  [Create Button] (Module-specific) (40px height)
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Main Content - Tables, Stats, Forms, etc]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Header Details:**
- **Height**: 60px (compact)
- **Logo area**: Left side, 40px height
- **Navigation tabs**: Center, 14px font size, underline highlight for active tab
- **Settings button**: Right side, ⚙️ icon, outline style (not filled)
- **Action buttons row**: Below header, 40px height, flex-wrapped
- **Consistent padding**: All pages use `px-6 py-6`

**Module Navigation Tabs** (by epic):

| Module | Tabs |
|--------|------|
| **Planning** (Epic 3) | Planning \| PO \| TO \| WO \| Suppliers \| ⚙️ |
| **Technical** (Epic 2) | Technical \| Products \| BOMs \| Routings \| Tracing \| ⚙️ |
| **Production** (Epic 4) | Production \| Dashboard \| WOs \| Machines \| Yields \| ⚙️ |
| **Warehouse** (Epic 5) | Warehouse \| LPs \| ASN/GRN \| Movements \| Scanner \| ⚙️ |
| **Quality** (Epic 6) | Quality \| QA Status \| Specs \| Testing \| NCRs \| CoAs \| ⚙️ |
| **Shipping** (Epic 7) | Shipping \| Sales Orders \| Picking \| Packing \| Shipments \| ⚙️ |
| **NPD** (Epic 8) | NPD \| Projects \| Formulations \| Costing \| Compliance \| ⚙️ |
| **Settings** (Epic 1) | Settings \| Organization \| Users \| Warehouses \| Config \| ⚙️ |

---

### 1.2 Stats Cards Component

Every module dashboard shows compact, lightweight stat cards.

**Component:** `ModuleStatsCard.tsx` (generic) or module-specific (e.g., `PlanningStatsCard`, `TechnicalStatsCard`)

**Specs:**
- **Height**: Max 120px
- **Layout**: 2×2 grid (4 metrics per card)
- **Content**: Icon + Label (12px) + Value (18px)
- **Responsive**:
  - Desktop: 4 cards in 1 row (lg breakpoint)
  - Tablet: 2 cards per row (md breakpoint)
  - Mobile: 1 card per row (sm breakpoint)
- **Interaction**: Clickable → navigate to detail section
- **Styling**: Border, subtle shadow, hover effect

**Example: Planning Stats Card**
```
┌──────────────────────────────┐
│ 📊 Purchase Orders           │
├──────────┬───────────────────┤
│ Total    │ 156               │
│ Draft    │ 23                │
├──────────┼───────────────────┤
│ Pending  │ 45                │
│ Confirmed│ 88                │
└──────────┴───────────────────┘
   (120px height, 2×2 grid)
```

---

### 1.3 Tables Component

Standardized table pattern applied across all modules.

**Component:** `DataTable.tsx` (generic base) with module-specific variants

**Standard Columns Structure:**
```
[Checkbox] [Primary Column↕] [Status] [Date] [Details] [Action Buttons]
```

**Features:**
- **Sortable Headers**: Click to sort ascending/descending
- **Filters**: Inline filter buttons (Status, Type, Date Range, etc.)
- **Search**: Fuzzy search on primary columns
- **Pagination**: 20 items per page, pagination controls
- **Row Actions**: View, Edit, Clone (BOM only), Delete (inline buttons)
- **Alternating Rows**: Subtle background color alternation
- **Hover**: Row highlight on hover

**Action Buttons Pattern:**
```
[👁️ View] [✏️ Edit] [📋 Clone] [🗑️ Delete]  ← Inline buttons
Colors: gray-600 (View/Edit/Clone), red-600 (Delete)
```

**Sorting Example:**
```
PO # ↕ | Supplier | Date ↕ | Status | Total ↕ | Actions
        ↑                    ↑ Click to sort
```

**Filters Example:**
```
[Search POs...] [Status ▼] [Date Range ▼] [Supplier ▼]
```

**Mobile Responsive (< 768px):**
- Table converts to card view
- Each row becomes an expandable card
- Minimal info visible: Primary column + Status + expand button (>)
- Smooth animation on expand/collapse
- All columns visible when expanded

**Card View Example (Mobile):**
```
┌──────────────────────────────────┐
│ PO-001 │ Draft │ Supplier X │ >  │
├──────────────────────────────────┤
│ [Expanded content - all columns] │
│ Date: 2025-11-27                │
│ Total: €5,000                    │
│ Actions: [View] [Edit] [Delete] │
└──────────────────────────────────┘
```

---

## 2. Design System - Visual Foundation

### 2.1 Color Palette

**Primary Colors (Tailwind):**

```
PRIMARY (Create/CTA):     green-600   (#16a34a)
SECONDARY (Actions):     gray-600    (#4b5563)
DANGER (Delete):         red-600     (#dc2626)

STATUS BADGES:
├─ Active/Confirmed:     green-200   (#dcfce7) bg + green-800 text
├─ Pending/Draft:        yellow-200  (#fef08a) bg + yellow-800 text
├─ Inactive/Archived:    gray-200    (#e5e7eb) bg + gray-800 text
└─ Error/Expired:        red-200     (#fecaca) bg + red-800 text

NEUTRAL:
├─ Background:           white       (#ffffff) or gray-50 (#f9fafb)
├─ Surface:              white       (#ffffff)
├─ Border:               gray-200    (#e5e7eb)
├─ Text Primary:         gray-900    (#111827)
├─ Text Secondary:       gray-600    (#4b5563)
└─ Text Muted:           gray-500    (#6b7280)

ACCENTS:
├─ Info:                 blue-500    (#3b82f6)
├─ Warning:              amber-500   (#f59e0b)
└─ Success:              green-500   (#10b981)
```

**Dark Mode (Settings toggle):**
```
Background:              gray-900    (#111827)
Surface:                 gray-800    (#1f2937)
Border:                  gray-700    (#374151)
Text Primary:            gray-50     (#f9fafb)
Text Secondary:          gray-300    (#d1d5db)
Status colors:           Same hues, adjusted for contrast
```

**No Custom Colors:** All colors use Tailwind tokens (no hex overrides in components)

---

### 2.2 Typography

**Font Scale:**
```
h1:  Text-3xl (30px) - Page titles
h2:  Text-2xl (24px) - Section headers
h3:  Text-xl  (20px) - Card titles, column headers
h4:  Text-lg  (18px) - Metric values in stats cards
p:   Text-base (16px) - Body text, table data
sm:  Text-sm  (14px) - Labels, secondary text, tab navigation
xs:  Text-xs  (12px) - Hints, metadata, stat labels
```

**Font Weights:**
```
Bold (700):      Page titles, primary action buttons
SemiBold (600):  Card titles, column headers, metric values
Medium (500):    Body text, labels
Regular (400):   Secondary text, descriptions
```

**Font Family:**
```
Body:      Inter, system font stack
Mono:      Monaco, monospace (for codes, SKUs, LP numbers)
```

---

### 2.3 Spacing & Layout

**Base Unit:** 4px (Tailwind default)

**Spacing Scale:**
```
xs:  4px   (p-1)
sm:  8px   (p-2)
md:  16px  (p-4)
lg:  24px  (p-6)
xl:  32px  (p-8)
2xl: 48px  (p-12)
```

**Standard Paddings:**
```
Page padding:      px-6 py-6 (24px all sides)
Card padding:      p-4 (16px all sides)
Button padding:    px-4 py-2 (12px vertical, 16px horizontal)
Form input:        px-3 py-2 (8px vertical, 12px horizontal)
```

**Standard Gaps:**
```
Between sections:  gap-6 (24px)
Between items:     gap-4 (16px)
Between buttons:   gap-3 (12px)
```

**Responsive Spacing:**
```
Mobile (sm):   px-4 py-4 (16px)
Tablet (md):   px-6 py-6 (24px)
Desktop (lg):  px-8 py-6 (32px horizontal, 24px vertical)
```

---

### 2.4 Responsive Breakpoints

**Tailwind Defaults (mobile-first):**
```
sm:  640px   (mobile)
md:  768px   (tablet)
lg:  1024px  (desktop)
xl:  1280px  (large desktop)
2xl: 1536px  (extra large)
```

**Design Decisions by Breakpoint:**

| Breakpoint | Device | Layout | Navigation | Tables |
|-----------|--------|--------|------------|--------|
| **sm** (<640px) | Mobile phone | Single column, stacked | Hamburger menu | Card view (expandable) |
| **md** (640-768px) | Tablet portrait | 2 columns | Collapsed tabs | Card view |
| **lg** (768-1024px) | Tablet landscape | 2-3 columns | Full tabs | Full table |
| **xl** (1024px+) | Desktop | 3-4 columns | Full tabs | Full table |

**Header Responsive:**
```
sm:  Logo only, hamburger menu
md:  Logo + collapsed tabs (dropdown)
lg:  Logo + full tabs + settings
```

**Stats Cards Responsive:**
```
sm:  1 per row (stacked)
md:  2 per row
lg+: 4 per row (or 3 depending on module)
```

---

## 3. Component Library

### 3.1 ModuleHeader

```tsx
// Usage
<ModuleHeader
  module="planning"
  currentPage="purchase-orders"
/>
```

**Renders:**
- Logo + "MonoPilot" text
- Navigation tabs (Planning | PO | TO | WO | Suppliers | ⚙️)
- Active tab underlined
- Settings button links to `/settings/{module}`

---

### 3.2 ModuleActionButtons

```tsx
// Usage
<ModuleActionButtons
  buttons={[
    { label: 'Create PO', href: '/planning/purchase-orders/new', color: 'green-600' },
    { label: 'Create TO', href: '/planning/transfer-orders/new', color: 'green-600' },
    { label: 'Create WO', href: '/planning/work-orders/new', color: 'green-600' },
  ]}
/>
```

**Renders:**
- Flex-wrapped row of buttons
- 40px height
- Full-width on mobile (sm), inline on desktop

---

### 3.3 StatsCard

```tsx
// Usage
<StatsCard
  title="Purchase Orders"
  icon={<Package />}
  metrics={[
    { label: 'Total', value: '156' },
    { label: 'Draft', value: '23' },
    { label: 'Pending', value: '45' },
    { label: 'Confirmed', value: '88' },
  ]}
  href="/planning/purchase-orders"
/>
```

**Renders:**
- 120px height, 2×2 grid
- Clickable → navigate to href
- Hover effect (shadow, slight scale)

---

### 3.4 DataTable

```tsx
// Usage
<DataTable
  data={purchaseOrders}
  columns={[
    { key: 'po_number', label: 'PO #', sortable: true },
    { key: 'supplier', label: 'Supplier', sortable: false },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge>{val}</StatusBadge> },
    { key: 'total', label: 'Total', sortable: true },
  ]}
  actions={[
    { label: 'View', icon: Eye, onClick: (row) => navigate(`/planning/purchase-orders/${row.id}`) },
    { label: 'Edit', icon: Pencil, onClick: (row) => navigate(`/planning/purchase-orders/${row.id}/edit`) },
    { label: 'Delete', icon: Trash, onClick: (row) => handleDelete(row.id), color: 'red-600' },
  ]}
  onSearch={(query) => setSearchQuery(query)}
  filters={[
    { label: 'Status', key: 'status', options: ['Draft', 'Confirmed', 'Shipped'] },
    { label: 'Date Range', type: 'dateRange', key: 'date' },
  ]}
  pageSize={20}
/>
```

**Renders:**
- Full table on desktop (lg+)
- Card view on mobile (sm-md) with expand animations
- Sortable headers
- Search + filter UI
- Pagination controls

---

## 4. Interaction Patterns

### 4.1 Navigation

**Module Switching:**
- Click any tab in header → navigate to that module's dashboard
- Active tab underlined
- Smooth transition

**Within-Module Navigation:**
- Breadcrumbs optional (used on detail pages)
- Back button on detail pages
- Links in tables → navigate to detail page

---

### 4.2 Data Interactions

**Hover:**
- Row highlight (subtle gray background)
- Action buttons appear or become prominent
- Shadow on cards

**Click:**
- Primary action (row or card) → navigate to detail
- Action buttons → specific actions (edit, delete, etc.)
- Filters → filter table
- Sort headers → sort table

**Smooth Transitions:**
- Expand/collapse animations (200ms)
- Table → Card view conversion (smooth)
- Modal opens/closes (200ms fade)
- Color changes on hover (150ms)

---

### 4.3 Notifications & Feedback

**Toast Notifications:**
- **Position**: Center-bottom
- **Duration**: 3-5 seconds (auto-dismiss)
- **Types**:
  - Success (green): Operation completed
  - Error (red): Operation failed
  - Warning (yellow): Caution needed
  - Info (blue): Informational

**Example:**
```
✓ PO-001 created successfully
✗ Failed to delete PO - in use by WO
⚠ 3 items have expired expiry dates
ℹ Sync in progress...
```

**Inline Validation:**
- Form fields show error state on blur/submit
- Red border + error message below field
- Helper text for guidance

**Loading States:**
- Spinner in button while loading
- Skeleton screens for tables
- Progress bar for long operations

---

### 4.4 Dark Mode

**Toggle Location:** Settings (⚙️) → Appearance → Dark Mode toggle

**Implementation:**
- System preference auto-detect on first visit
- User preference saved in `localStorage`
- All colors have light + dark variants
- Smooth transition when toggling

---

## 5. Accessibility

### 5.1 Keyboard Navigation

- **Tab**: Navigate through focusable elements
- **Enter/Space**: Activate buttons, open modals, expand sections
- **Escape**: Close modals, cancel operations
- **Arrow Keys**: Navigate table rows, dropdowns
- **All interactive elements** reachable via keyboard

### 5.2 Screen Readers

- Semantic HTML: `<table>`, `<nav>`, `<main>`, `<section>`, etc.
- ARIA labels on icon buttons
- Form labels associated with inputs (`<label htmlFor="...">`)
- Status changes announced (aria-live regions)
- Table headers marked with `<th>` + scope attribute

### 5.3 Color Contrast

- **WCAG AA**: 4.5:1 text contrast minimum
- **WCAG AAA**: 7:1 text contrast (headings, important info)
- Dark mode tested for equal readability
- Don't rely on color alone (use icons + text)

### 5.4 Touch & Motor

- **Minimum tap target**: 48px × 48px
- **Spacing between targets**: 8px minimum
- **Avoid hover-only content** (touch devices don't have hover)
- **Double-click not required** (use single-click)

---

## 6. Performance Considerations

### 6.1 Rendering

- **Virtualization**: Large tables use virtual scrolling (e.g., react-window)
- **Lazy loading**: Images, tables load on-demand
- **Code splitting**: Module-specific routes lazy-load components
- **Memoization**: Prevent unnecessary re-renders

### 6.2 Data Loading

- **Pagination**: 20 items per page (don't load all at once)
- **API calls**: Debounce search, throttle scrolling
- **Caching**: Use SWR or React Query for data fetching
- **Skeleton screens**: Show placeholder while loading

---

## 7. Implementation Guidelines

### 7.1 File Structure

```
apps/frontend/
├── components/shared/
│   ├── ModuleHeader.tsx
│   ├── ModuleActionButtons.tsx
│   ├── StatsCard.tsx
│   ├── DataTable.tsx
│   └── StatusBadge.tsx
├── lib/constants/
│   └── app-colors.ts (shared across all modules)
├── app/(authenticated)/
│   ├── planning/
│   │   ├── page.tsx (dashboard with header + stats + tables)
│   │   ├── purchase-orders/page.tsx
│   │   ├── purchase-orders/[id]/page.tsx
│   │   └── ...
│   ├── technical/
│   │   ├── page.tsx
│   │   ├── products/page.tsx
│   │   └── ...
│   ├── production/
│   ├── warehouse/
│   ├── quality/
│   ├── shipping/
│   ├── npd/
│   └── settings/
└── styles/
    └── globals.css (Tailwind + dark mode config)
```

### 7.2 Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Use Tailwind defaults - no custom colors
      },
      spacing: {
        // Use Tailwind defaults
      },
    },
  },
  darkMode: 'class', // Dark mode via class
}
```

### 7.3 Component Template

```tsx
'use client'

import { ReactNode } from 'react'

interface ModuleHeaderProps {
  module: 'planning' | 'technical' | ...
  currentPage: string
}

export default function ModuleHeader({ module, currentPage }: ModuleHeaderProps) {
  const tabs = getTabsByModule(module)

  return (
    <header className="h-15 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center gap-2">
        {/* Logo SVG */}
        <span className="text-lg font-semibold">MonoPilot</span>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex gap-6 ml-8">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.href}
            className={`text-sm font-medium pb-1 border-b-2 ${
              currentPage === tab.key
                ? 'border-green-600 text-gray-900 dark:text-gray-50'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {/* Settings Button */}
      <a
        href={`/settings/${module}`}
        className="ml-auto text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        title="Settings"
      >
        <Settings size={20} />
      </a>
    </header>
  )
}
```

---

## 8. Module-Specific Extensions

Each module extends this shared system with additional components:

- **Planning**: TopPOCards, PurchaseOrdersTable, TOTable, WOTable
- **Technical**: ProductsTable, BOMsTable, RoutingsTable
- **Production**: ActiveWOsTable, YieldChart, KPIMetrics
- **Warehouse**: LPTable, ASNTable, GRNTable, MovementTable
- **Quality**: QAStatusTable, SpecsTable, TestResultsTable, NCRTable
- **Shipping**: SalesOrdersTable, PickingTable, ShipmentTable
- **NPD**: ProjectsTable, StageGateWorkflow, FormulationTable
- **Settings**: UsersTable, WarehousesTable, ConfigurationForm

See individual `ux-design-{module}-module.md` files for details.

---

## 9. Design Checklist

When implementing any module:

- [ ] Module has ModuleHeader with correct navigation tabs
- [ ] Module has action buttons row below header
- [ ] Dashboard shows StatsCard for key metrics
- [ ] All tables use DataTable component (sortable, filterable, paginated)
- [ ] Tables responsive: card view on <768px
- [ ] All buttons use app color palette (green-600, gray-600, red-600)
- [ ] Dark mode toggle works
- [ ] Keyboard navigation functional
- [ ] Screen reader labels present
- [ ] Touch targets ≥48px
- [ ] Contrast ratio ≥4.5:1 (WCAG AA)
- [ ] No custom colors (all Tailwind tokens)

---

## 10. Versions & Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-27 | Initial shared UI system - extracted from Epic 2 + 3 | Claude |

---

**End of Shared UI Design System Specification**
