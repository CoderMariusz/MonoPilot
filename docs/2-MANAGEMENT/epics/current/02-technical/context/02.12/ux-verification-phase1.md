# UX Verification Report - Story 02.12 (Phase 1)

**Story**: Technical Dashboard (TEC-017)
**Phase**: 2E-1
**Verified**: 2025-12-26
**Status**: VERIFIED - Ready for Implementation

---

## Executive Summary

**Verification Result**: ✅ PASSED
**Wireframe Completeness**: 100%
**Component Specifications**: 6 primary components
**Missing Elements**: None
**Implementation Ready**: YES

The TEC-017 wireframe is comprehensive and meets all frontend.yaml requirements. All 4 states are defined, responsive breakpoints are documented, and component specifications are complete.

---

## ✅ Verified Wireframes

### Wireframe Coverage

| Screen State | Wireframe Status | Requirements Met | Notes |
|--------------|------------------|------------------|-------|
| Success (Desktop) | ✅ Complete | 100% | All 6 widgets defined |
| Success (Tablet) | ✅ Complete | 100% | 2x2 card grid, stacked panels |
| Success (Mobile) | ✅ Complete | 100% | Single column, scrollable |
| Loading | ✅ Complete | 100% | Skeleton loaders for all widgets |
| Empty | ✅ Complete | 100% | Onboarding CTAs present |
| Error | ✅ Complete | 100% | Retry + Support actions |

### Widget Completeness Matrix

| Widget | Wireframe | Props Defined | Interactions | States | Responsive |
|--------|-----------|---------------|--------------|--------|-----------|
| DashboardStatsCard (x4) | ✅ | ✅ | ✅ | ✅ | ✅ |
| AllergenMatrixPanel | ✅ | ✅ | ✅ | ✅ | ✅ |
| BomTimelinePanel | ✅ | ✅ | ✅ | ✅ | ✅ |
| RecentActivityPanel | ✅ | ✅ | ✅ | ✅ | ✅ |
| CostTrendsChart | ✅ | ✅ | ✅ | ✅ | ✅ |
| QuickActionsBar | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📋 Component Specifications

### 1. DashboardStatsCard (Reusable)

**Path**: `apps/frontend/app/(authenticated)/technical/components/DashboardStatsCard.tsx`

**Props**:
```typescript
interface DashboardStatsCardProps {
  icon: LucideIcon;              // Package, ClipboardList, Settings, DollarSign
  title: string;                 // "Products", "BOMs", "Routings", "Avg Cost"
  value: number | string;        // 247, "125.50 PLN"
  breakdown?: Array<{            // Active/Inactive counts
    label: string;
    value: number;
    type: 'active' | 'inactive' | 'phased';
  }>;
  trend?: {                      // Cost trend indicator
    percent: number;             // 5.2
    direction: 'up' | 'down' | 'neutral';
  };
  onClick?: () => void;          // Navigate to list page
  href?: string;                 // Alternative to onClick
  loading?: boolean;             // Show skeleton
}
```

**Interactions**:
- Hover: Elevation 2dp → 4dp, cursor pointer
- Click: Navigate to respective list page or cost history
- Keyboard: Tab to focus, Enter to activate

**States**:
- Loading: Skeleton card (3 bars)
- Success: Icon + Value + Breakdown + Trend (if applicable) + CTA
- Error: Handled by parent (DashboardPage error state)

**Styling**:
- Elevation: 2dp (hover: 4dp)
- Border radius: 8px
- Padding: 16px
- Background: #FFFFFF
- Card value: 28px, font-weight: 700

**Responsive**:
- Desktop: 25% width (4 in row)
- Tablet: 50% width (2x2 grid)
- Mobile: 100% width (stacked)

---

### 2. AllergenMatrixPanel

**Path**: `apps/frontend/app/(authenticated)/technical/components/AllergenMatrixPanel.tsx`

**Props**:
```typescript
interface AllergenMatrixPanelProps {
  data: AllergenMatrixResponse;  // { allergens, products }
  onCellClick?: (productId: string, allergenId: string) => void;
  onExportPdf?: () => void;
  loading?: boolean;
  error?: string;
}

type AllergenRelation = 'contains' | 'may_contain' | null;
```

**Interactions**:
- Click cell → Navigate to TEC-010 (Allergen Management) with product+allergen pre-selected
- Filter by product type → Dropdown (All, Raw Material, WIP, Finished Goods, Packaging)
- Export PDF → Downloads `allergen-matrix-{org_id}-{YYYY-MM-DD}.pdf`
- Horizontal scroll on tablet/mobile for allergen columns

**States**:
- Loading: Skeleton grid (5 rows × 6 columns)
- Success: Heatmap grid with color-coded cells + legend
- Empty: "No allergen data available. Assign allergens to products."
- Error: "Failed to load allergen matrix. [Retry]"

**Color Mapping**:
- Contains: 🔴 #EF4444 (red)
- May Contain: 🟡 #FBBF24 (yellow)
- Free From: 🟢 #10B981 (green)

**Data Flow**:
```
API: GET /api/technical/dashboard/allergen-matrix?product_type={type}
  → Service: fetchAllergenMatrix(productType?)
  → Hook: useAllergenMatrix(productType) [staleTime: 10min]
  → Component: Renders grid with color mapping
```

**Responsive**:
- Desktop: 60% width (left panel), full matrix visible
- Tablet: 100% width, horizontal scroll for allergens
- Mobile: 100% width, scroll both axes, abbreviated headers ("Glu", "Dairy")

---

### 3. BomTimelinePanel

**Path**: `apps/frontend/app/(authenticated)/technical/components/BomTimelinePanel.tsx`

**Props**:
```typescript
interface BomTimelinePanelProps {
  data: BomTimelineResponse;     // { timeline[], limit_reached }
  onDotClick?: (bomId: string) => void;
  onProductFilterChange?: (productId: string | null) => void;
  loading?: boolean;
  error?: string;
}
```

**Interactions**:
- Hover dot → Tooltip: "Wheat Bread v5 | 2025-03-15 | Changed by John Doe"
- Click dot → Navigate to TEC-006 (BOM Detail) with bomId
- Filter by product → Dropdown (All Products, or specific product SKU)

**States**:
- Loading: Skeleton timeline (6 dots on horizontal line)
- Success: Dots on timeline with hover tooltips
- Empty: "No BOM versions created in the last 6 months."
- Error: "Failed to load BOM timeline. [Retry]"

**Timeline Layout**:
- Horizontal axis: Last 6 months (Nov, Dec, Jan, Feb, Mar, Apr)
- Dots: BOM version changes (size: 10px, hover: 14px)
- Label: Product name below clustered dots

**Data Flow**:
```
API: GET /api/technical/dashboard/bom-timeline?product_id={id}&months=6
  → Service: fetchBomTimeline(productId?, months = 6)
  → Hook: useBomTimeline(productId, months) [staleTime: 5min]
  → Component: Renders horizontal timeline with dots
```

**Responsive**:
- Desktop: 40% width (right panel), 6 months visible
- Tablet: 100% width, horizontal scroll if >6 months
- Mobile: 100% width, vertical list instead of timeline

---

### 4. RecentActivityPanel

**Path**: `apps/frontend/app/(authenticated)/technical/components/RecentActivityPanel.tsx`

**Props**:
```typescript
interface RecentActivityPanelProps {
  data: RecentActivityResponse;  // { activities[] }
  onActivityClick?: (entityType: string, entityId: string) => void;
  loading?: boolean;
  error?: string;
}

type ActivityType = 'product_created' | 'product_updated' | 'bom_created'
  | 'bom_activated' | 'routing_created' | 'routing_updated';
```

**Interactions**:
- Click row → Navigate to detail page (product/BOM/routing) based on entity_type
- "View All Activity" link → Navigate to full activity log (future feature)

**Activity Row Format**:
```
[Icon] Description
       by User • Relative Time
```

**Icons** (Lucide React):
- product_created/updated: Package
- bom_created/activated: ClipboardList
- routing_created/updated: Settings

**States**:
- Loading: Skeleton list (5 rows)
- Success: Last 10 activities with icon + description + user + timestamp
- Empty: "No recent activity. Start creating products and BOMs."
- Error: "Failed to load recent activity. [Retry]"

**Relative Time Logic**:
- <1 hour: "X minutes ago"
- 1-24 hours: "X hours ago"
- 1-7 days: "X days ago"
- >7 days: Full date "Mar 15, 2025"

**Data Flow**:
```
API: GET /api/technical/dashboard/recent-activity?limit=10
  → Service: fetchRecentActivity(limit = 10)
  → Hook: useRecentActivity(limit) [staleTime: 30sec]
  → Component: Formats relative time, renders activity list
```

**Responsive**:
- Desktop: 60% width (bottom left), 10 items visible
- Tablet: 100% width, 5 items visible, "View All" link
- Mobile: 100% width, 3 items visible, "View All" link

---

### 5. CostTrendsChart

**Path**: `apps/frontend/app/(authenticated)/technical/components/CostTrendsChart.tsx`

**Props**:
```typescript
interface CostTrendsChartProps {
  data: CostTrendsResponse;      // { months[], data[], currency }
  onChartClick?: () => void;     // Navigate to TEC-015
  loading?: boolean;
  error?: string;
}
```

**Interactions**:
- Toggle buttons: Material / Labor / Overhead / Total (multi-select)
- Hover data point → Tooltip: "Nov 2025: Material: 80.50 PLN, Labor: 30.00 PLN..."
- Click chart → Navigate to TEC-015 (Cost History)

**States**:
- Loading: Skeleton chart (gray bars)
- Success: Recharts LineChart with toggleable lines
- Empty: "No cost data available. Add product costs to see trends."
- Error: "Failed to load cost trends. [Retry]"

**Chart Configuration** (Recharts):
```typescript
<LineChart data={costTrendsData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis label={{ value: 'Cost (PLN)', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="material_cost" stroke="#3B82F6" />
  <Line type="monotone" dataKey="labor_cost" stroke="#10B981" />
  <Line type="monotone" dataKey="overhead_cost" stroke="#FBBF24" />
  <Line type="monotone" dataKey="total_cost" stroke="#111827" strokeWidth={3} />
</LineChart>
```

**Data Flow**:
```
API: GET /api/technical/dashboard/cost-trends?months=6
  → Service: fetchCostTrends(months = 6)
  → Hook: useCostTrends(months) [staleTime: 5min]
  → Component: Renders Recharts LineChart with toggle state
```

**Responsive**:
- Desktop: 40% width (bottom right), full chart
- Tablet: 100% width, smaller chart (height: 250px)
- Mobile: 100% width, simplified chart (height: 200px), abbreviated X-axis labels

---

### 6. QuickActionsBar

**Path**: `apps/frontend/app/(authenticated)/technical/components/QuickActionsBar.tsx`

**Props**:
```typescript
interface QuickActionsBarProps {
  onNewProduct?: () => void;     // Opens ProductFormModal
  onNewBom?: () => void;         // Opens BomFormModal
  onNewRouting?: () => void;     // Opens RoutingFormModal
}
```

**Interactions**:
- Click "+ New Product" → Opens TEC-002 (Create Product modal)
- Click "+ New BOM" → Opens TEC-006 (Create BOM modal)
- Click "+ New Routing" → Opens TEC-008 (Create Routing modal)

**States**:
- Always visible (no loading/empty/error states)

**Button Styling**:
- Primary button (blue background, white text)
- Icon: Plus (Lucide)
- Min width: 120px, height: 40px (48dp touch target with padding)

**Responsive**:
- Desktop: Inline (3 buttons horizontally)
- Tablet: Inline (3 buttons horizontally)
- Mobile: Stacked (3 buttons vertically, full width)

---

## 📱 Responsive Design Notes

### Desktop (>1024px)

**Layout Grid**:
```
┌─────────┬─────────┬─────────┬─────────┐
│ Stats 1 │ Stats 2 │ Stats 3 │ Stats 4 │ (25% each)
└─────────┴─────────┴─────────┴─────────┘
┌──────────────────────┬──────────────────┐
│ Allergen Matrix 60%  │ BOM Timeline 40% │
└──────────────────────┴──────────────────┘
┌──────────────────────┬──────────────────┐
│ Recent Activity 60%  │ Cost Trends 40%  │
└──────────────────────┴──────────────────┘
└──────────────────────────────────────────┘
│ Quick Actions (inline)                   │
└──────────────────────────────────────────┘
```

**Specifications**:
- Stats cards: 4 in row, gap: 16px
- Panel gap: 16px
- Total width: 100% of container (max-width: 1440px)

### Tablet (768-1024px)

**Layout Grid**:
```
┌──────────┬──────────┐
│ Stats 1  │ Stats 2  │ (50% each)
├──────────┼──────────┤
│ Stats 3  │ Stats 4  │
└──────────┴──────────┘
┌──────────────────────┐
│ Allergen Matrix      │ (100%, horizontal scroll)
└──────────────────────┘
┌──────────────────────┐
│ BOM Timeline         │ (100%)
└──────────────────────┘
┌──────────────────────┐
│ Recent Activity      │ (100%)
└──────────────────────┘
┌──────────────────────┐
│ Cost Trends          │ (100%)
└──────────────────────┘
│ Quick Actions        │ (inline)
└──────────────────────┘
```

**Adjustments**:
- Allergen matrix: Horizontal scroll for allergens (sticky product column)
- BOM timeline: Horizontal scroll if >6 months
- Chart height: 250px (reduced from 300px)

### Mobile (<768px)

**Layout Stack**:
```
┌──────────────┐
│ Stats 1      │ (100%)
├──────────────┤
│ Stats 2      │
├──────────────┤
│ Stats 3      │
├──────────────┤
│ Stats 4      │
├──────────────┤
│ Allergen     │ (Scroll both axes)
│ Matrix       │
├──────────────┤
│ BOM Timeline │ (Vertical list)
├──────────────┤
│ Recent       │ (3 items + "View All")
│ Activity     │
├──────────────┤
│ Cost Trends  │ (Simplified chart)
├──────────────┤
│ Quick Action │ (Stacked buttons)
│ Buttons      │
└──────────────┘
```

**Adjustments**:
- Allergen matrix: Abbreviated headers ("Glu", "Dairy"), scroll both axes
- BOM timeline: Vertical list instead of horizontal timeline
- Recent activity: Show 3 items, "View All Activity" link
- Cost trends: Height 200px, abbreviated X-axis ("Nov", "Dec")
- Quick actions: 3 full-width buttons, stacked vertically

---

## 🎯 Implementation Notes

### Data Flow Architecture

```
Page Component (page.tsx)
  └─> TechnicalDashboardPage.tsx
       ├─> useDashboardStats() [staleTime: 1min]
       │    └─> 4x DashboardStatsCard
       │
       ├─> useAllergenMatrix() [staleTime: 10min]
       │    └─> AllergenMatrixPanel
       │         └─> onExportPdf() → jsPDF/pdfmake
       │
       ├─> useBomTimeline() [staleTime: 5min]
       │    └─> BomTimelinePanel
       │
       ├─> useRecentActivity() [staleTime: 30sec]
       │    └─> RecentActivityPanel
       │
       ├─> useCostTrends() [staleTime: 5min]
       │    └─> CostTrendsChart (Recharts)
       │
       └─> QuickActionsBar
```

### Performance Optimization

**Lazy Loading**:
- Stats cards: Load immediately (above fold)
- Allergen matrix, timeline, activity, cost trends: Use `IntersectionObserver` to lazy load on scroll
- PDF export library: Dynamic import `import('jspdf')` on button click

**Caching Strategy**:
```typescript
// React Query config
queryClient.setDefaultOptions({
  queries: {
    staleTime: {
      stats: 60 * 1000,           // 1 min
      allergenMatrix: 10 * 60 * 1000,  // 10 min
      bomTimeline: 5 * 60 * 1000,      // 5 min
      recentActivity: 30 * 1000,       // 30 sec
      costTrends: 5 * 60 * 1000,       // 5 min
    },
  },
});
```

**Code Splitting**:
```typescript
// Lazy load chart library
const CostTrendsChart = lazy(() => import('./CostTrendsChart'));
```

### Error Boundaries

**Component-Level Isolation**:
- Each panel has its own error boundary
- If allergen matrix fails, other panels continue to load
- User can retry failed panels individually

```typescript
<ErrorBoundary fallback={<PanelError onRetry={refetch} />}>
  <AllergenMatrixPanel data={allergenMatrix} />
</ErrorBoundary>
```

### Accessibility Requirements

**Touch Targets**:
- All cards: Min 48x48dp (includes padding)
- Chart data points: 12px visible, 48px hit area
- Timeline dots: 10px visible, 48px hit area
- Buttons: 40px height + 8px padding = 48dp

**ARIA Labels**:
```typescript
// Stats Card
<div role="region" aria-label="Products statistics: 247 total, 215 active">

// Allergen Matrix
<div role="grid" aria-label="Allergen matrix: products by allergens">
  <div role="row">
    <div role="columnheader">Gluten</div>
    <div role="gridcell" aria-label="Contains gluten">🔴</div>
  </div>
</div>

// BOM Timeline
<div role="list" aria-label="BOM version timeline, last 6 months">
  <div role="listitem" aria-label="Wheat Bread version 5, March 15th">•</div>
</div>

// Cost Trends
<div role="img" aria-label="Cost trends chart, last 6 months, total cost selected">
  <LineChart {...props} />
</div>
```

**Keyboard Navigation**:
- Tab order: Stats cards → Allergen matrix → Timeline → Activity → Chart → Quick actions
- Enter: Activate card/panel click
- Arrow keys: Navigate timeline dots (left/right)

### State Management

**Loading States**:
```typescript
// Parallel loading
const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
const { data: matrix, isLoading: isLoadingMatrix } = useAllergenMatrix();
const { data: timeline, isLoading: isLoadingTimeline } = useBomTimeline();
const { data: activity, isLoading: isLoadingActivity } = useRecentActivity();
const { data: costs, isLoading: isLoadingCosts } = useCostTrends();

// Show loading skeleton while fetching
if (isLoadingStats) return <DashboardStatsCardSkeleton />;
```

**Empty State Detection**:
```typescript
const isEmpty = stats?.products.total === 0
  && stats?.boms.total === 0
  && stats?.routings.total === 0;

if (isEmpty) return <DashboardEmptyState />;
```

---

## Implementation Checklist

### Phase 1: Core Components
- [ ] Create `DashboardStatsCard.tsx` (reusable component)
- [ ] Create `DashboardStatsCardSkeleton.tsx` (loading state)
- [ ] Create `TechnicalDashboardPage.tsx` (main page layout)
- [ ] Create `dashboard.ts` types file
- [ ] Create `use-dashboard.ts` hooks file

### Phase 2: Widget Components
- [ ] Create `AllergenMatrixPanel.tsx` with color mapping
- [ ] Create `BomTimelinePanel.tsx` with horizontal timeline
- [ ] Create `RecentActivityPanel.tsx` with activity list
- [ ] Create `CostTrendsChart.tsx` with Recharts
- [ ] Create `QuickActionsBar.tsx` with 3 buttons

### Phase 3: Service Layer
- [ ] Create `dashboard-service.ts` with 5 fetch functions
- [ ] Implement React Query hooks with staleTime configs
- [ ] Add error handling for each endpoint

### Phase 4: State Handling
- [ ] Implement loading skeletons for all panels
- [ ] Implement empty state with onboarding CTAs
- [ ] Implement error state with retry logic
- [ ] Add component-level error boundaries

### Phase 5: Responsive Design
- [ ] Desktop layout (4 cards row, 2-column panels)
- [ ] Tablet layout (2x2 cards, stacked panels)
- [ ] Mobile layout (single column, scrollable)
- [ ] Test breakpoint transitions (768px, 1024px)

### Phase 6: Interactions
- [ ] Stats card click → Navigate to list pages
- [ ] Allergen matrix cell click → Navigate to TEC-010
- [ ] PDF export → jsPDF implementation
- [ ] Timeline dot click → Navigate to TEC-006
- [ ] Activity row click → Navigate to detail pages
- [ ] Chart click → Navigate to TEC-015

### Phase 7: Accessibility
- [ ] Add ARIA labels (role="region", role="grid", role="list", role="img")
- [ ] Test keyboard navigation (Tab, Enter, Arrow keys)
- [ ] Verify touch targets >= 48x48dp
- [ ] Test screen reader announcements
- [ ] Verify color contrast (4.5:1 text, 3:1 charts)

### Phase 8: Performance
- [ ] Implement lazy loading for below-fold panels
- [ ] Add React Query caching with TTLs
- [ ] Code split Recharts library
- [ ] Test load times (<500ms stats, <1s matrix)

---

**Verification Complete**: 2025-12-26
**Next Step**: FRONTEND-DEV implementation
**Estimated Effort**: 8-10 hours
