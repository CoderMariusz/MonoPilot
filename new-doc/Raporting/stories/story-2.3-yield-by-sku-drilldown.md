> **Status:** ✅ IMPLEMENTED
> **Component:** `src/components/yield-by-sku/YieldBySKUPage.tsx`
> **Features:** SKU table with contribution bars, 13-week trend charts per SKU (lazy loaded), breadcrumb navigation, line summary header, drill-down from Yield by Line

# Story 2.3: Yield by SKU Drill-Down

## Story Overview
**Epic**: Core Dashboard Views
**Priority**: Medium-High
**Estimated Effort**: 2 development sessions
**Dependencies**: Story 2.2 (Yield by Line)

### User Story
> As a **Supervisor**, I want to **drill down from a production line to see yield performance by individual SKU/product** so that I can **identify which specific products are causing yield gains or losses on a line**.

---

## Acceptance Criteria

### AC 2.3.1: Accessible from Line Drill-Down
- **Given** the user is on Yield by Line view
- **When** they click a line name or "Details" button
- **Then** the SKU drill-down view opens for that line
- **And** the view can also be accessed directly from the sidebar navigation

### AC 2.3.2: SKU Data Table
- **Given** a line is selected
- **When** the SKU table is displayed
- **Then** columns show:
  | Column | Description |
  |--------|-------------|
  | FG Code | Finished goods code |
  | Description | Product description |
  | KG Output | Total KG produced |
  | Yield % | Weighted average yield |
  | Target % | Target yield |
  | Variance % | Yield - Target |
  | Variance £ | Financial impact |
- **And** table is sortable on all columns

### AC 2.3.3: Contribution Percentage
- **Given** the SKU table is displayed
- **When** variance data exists
- **Then** an additional "Contribution %" column shows each SKU's share of the line's total variance
- **And** the contribution is calculated as: `(SKU Var £ / Line Total Var £) × 100`
- **And** a mini bar visualization shows the contribution visually

### AC 2.3.4: Inline SKU Trend Charts
- **Given** a SKU row is displayed
- **When** the user expands the row
- **Then** a 13-week trend chart shows that SKU's yield performance
- **And** the chart includes target line and hover tooltips

### AC 2.3.5: Breadcrumb Navigation
- **Given** the user navigated from Yield by Line
- **When** the breadcrumb is displayed
- **Then** it shows: `Overview > Yield by Line > Line XX > SKU Detail`
- **And** each breadcrumb segment is clickable for navigation back

### AC 2.3.6: Summary Header
- **Given** a line is selected
- **When** the summary header is displayed
- **Then** it shows:
  - Line name and description
  - Total KG Output for the week
  - Line Yield % with W/W change
  - Line Variance £
  - Number of SKUs produced

---

## Technical Implementation Plan

### Component Structure
```
src/components/yield-by-sku/
├── YieldBySKUPage.tsx           # Main page
├── SKUTable.tsx                 # SKU data table
├── ContributionBar.tsx          # Mini contribution visualization
├── SKUTrendChart.tsx            # Inline D3 trend chart
├── LineSummaryHeader.tsx        # Line summary at top
└── Breadcrumb.tsx               # Navigation breadcrumb (reusable)
```

### Data Flow
```
Line Yields Data → Filter by Line → Aggregate by FG Code → Calculate Contributions → Display
```

### Contribution Calculation
```typescript
function calculateContributions(skuData: AggregatedRow[], lineTotalVar: number): SKUWithContribution[] {
  return skuData.map(sku => ({
    ...sku,
    contributionPct: lineTotalVar !== 0 
      ? (sku.metrics.variancePounds / lineTotalVar) * 100 
      : 0,
  }));
}
```

---

## UX Design Specification

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Overview > Yield by Line > L08                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─── Line 08 Summary ──────────────────────────────────┐  │
│  │ KG Output: 12,450 │ Yield: 94.2% (+0.3%) │ Var: +£320│  │
│  │ SKUs Produced: 8   │ W/E: 07/02/2026                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  FG Code │ Description      │ KG Out │ Yld% │ Var£ │ Contr%│
│  ────────┼──────────────────┼────────┼──────┼──────┼───────│
│  A4887   │ Sweet Chilli 6x70│  3,200 │95.1% │+£180 │ 56% █│
│  B4011   │ Ham Sliced 200g  │  2,800 │93.8% │+£95  │ 30% █│
│  ...     │                  │        │      │      │      │
└─────────────────────────────────────────────────────────────┘
```

---

## Definition of Done
- [ ] All 6 acceptance criteria pass
- [ ] SKU table displays with correct data
- [ ] Contribution % calculated and visualized
- [ ] Inline trend charts work
- [ ] Breadcrumb navigation works
- [ ] Summary header shows correct line totals
- [ ] Responsive layout works
