# Tech Spec: Technical UI Improvements (Epic 2 Batch 02E-2)

**Date:** 2025-11-28
**Author:** Claude AI
**Stories:** 2.25, 2.26, 2.27, 2.28
**Status:** Draft

---

## Overview

UI consistency and responsiveness improvements for the Technical module, ensuring consistent header layouts, stats cards, tables, and mobile-friendly design.

---

## Stories

### Story 2.25: Technical Header Layout
Consistent header layout across all Technical pages with title, breadcrumbs, and action buttons.

### Story 2.26: Technical Stats Cards
Reusable stats cards component showing key metrics (counts, totals) in consistent format.

### Story 2.27: Technical Tables Consistency
Standardized table styling, pagination, sorting, and filtering across all Technical module tables.

### Story 2.28: Technical Mobile Responsive
Mobile-friendly responsive design for all Technical module pages.

---

## Components

### Shared Components

```
apps/frontend/components/technical/
├── TechnicalPageHeader.tsx       # Story 2.25
├── TechnicalStatsCard.tsx        # Story 2.26
├── TechnicalDataTable.tsx        # Story 2.27
└── TechnicalMobileNav.tsx        # Story 2.28
```

### Design Tokens

```typescript
// Technical module color scheme
const technicalColors = {
  primary: 'blue-600',
  secondary: 'slate-600',
  success: 'green-600',
  warning: 'amber-600',
  error: 'red-600'
}

// Stats card variants
const statsCardVariants = ['default', 'success', 'warning', 'error']

// Breakpoints for responsive design
const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
}
```

---

## UI Patterns

### Page Header Pattern (Story 2.25)
```tsx
<TechnicalPageHeader
  title="Products"
  breadcrumbs={[{ label: 'Technical', href: '/technical' }, { label: 'Products' }]}
  actions={<Button>Add Product</Button>}
/>
```

### Stats Cards Pattern (Story 2.26)
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <TechnicalStatsCard title="Total Products" value={125} trend="+5%" />
  <TechnicalStatsCard title="Active BOMs" value={48} variant="success" />
  <TechnicalStatsCard title="Pending Reviews" value={3} variant="warning" />
</div>
```

### Data Table Pattern (Story 2.27)
```tsx
<TechnicalDataTable
  columns={columns}
  data={data}
  pagination={{ page: 1, limit: 50, total: 200 }}
  onSort={handleSort}
  onFilter={handleFilter}
  searchable
  selectable
/>
```

### Mobile Responsive Pattern (Story 2.28)
- Collapsible sidebar on mobile
- Stacked stats cards
- Horizontal scroll for tables with frozen first column
- Touch-friendly action buttons

---

## Acceptance Criteria Summary

### Story 2.25
- ✅ Consistent header across all Technical pages
- ✅ Breadcrumbs navigation
- ✅ Action buttons area

### Story 2.26
- ✅ Reusable stats card component
- ✅ Multiple variants (default, success, warning, error)
- ✅ Trend indicators (+/-)

### Story 2.27
- ✅ Consistent table styling
- ✅ Pagination controls
- ✅ Sort indicators
- ✅ Filter dropdowns
- ✅ Row selection

### Story 2.28
- ✅ Mobile-first responsive design
- ✅ Collapsible navigation
- ✅ Touch-friendly controls
- ✅ Readable on all screen sizes

---

## Testing Strategy

### Visual Regression Tests
- Screenshot comparison across breakpoints
- Component variants validation

### Accessibility Tests
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility

### Responsive Tests
- Mobile (320px - 640px)
- Tablet (768px - 1024px)
- Desktop (1024px+)
