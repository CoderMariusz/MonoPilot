> **Status:** ✅ IMPLEMENTED
> **Component:** `src/components/giveaway/GiveawayDashboard.tsx`
> **Features:** GA by Line table with variance analysis, SKU-level GA drill-down with contribution analysis, factory GA trend chart with target comparison, GA by Line Manager grouped bar chart, GA by Supervisor comparison view

# Story 3.1: Giveaway Analysis Dashboard

## Story Overview
**Epic**: Advanced Analytics Views
**Priority**: Medium-High
**Estimated Effort**: 2-3 development sessions
**Dependencies**: Story 1.1, Story 1.2

### User Story
> As a **Manager**, I want to **analyze giveaway (GA) performance by line, SKU, and manager** so that I can **identify where excess product is being given away and target cost reduction efforts**.

---

## Acceptance Criteria

### AC 3.1.1: GA by Line Table
- **Given** line yields data is loaded
- **When** the Giveaway Analysis view is displayed
- **Then** a sortable table shows GA % by line with variance analysis
- **And** columns include: Line, KG Usage, GA %, Target GA %, Variance %, Variance £
- **And** lines exceeding target GA are highlighted in red

### AC 3.1.2: SKU-Level GA Drill-Down
- **Given** a line is selected
- **When** the user drills down
- **Then** GA data is shown at SKU level with contribution analysis
- **And** each SKU shows its share of the line's total GA variance

### AC 3.1.3: Factory GA Trend Chart
- **Given** historical data exists
- **When** the trend chart is displayed
- **Then** a D3.js line chart shows factory-wide GA % over 13 weeks
- **And** a target line is overlaid
- **And** areas above target are shaded in light red (above target = bad for GA)

### AC 3.1.4: GA by Line Manager Bar Chart
- **Given** line manager data exists
- **When** the chart is displayed
- **Then** a grouped bar chart shows GA % by line manager
- **And** bars are colored by performance vs target
- **And** hovering shows detailed breakdown

### AC 3.1.5: GA by Supervisor Comparison
- **Given** supervisor data exists
- **When** the comparison view is displayed
- **Then** supervisors are compared on GA performance
- **And** a table shows each supervisor's team GA % with ranking

---

## Technical Implementation Plan

### Component Structure
```
src/components/giveaway/
├── GiveawayDashboard.tsx        # Main container
├── GAByLineTable.tsx            # GA by line table
├── GASKUDrillDown.tsx           # SKU-level drill-down
├── GATrendChart.tsx             # D3.js factory GA trend
├── GAByManagerChart.tsx         # D3.js grouped bar chart
└── GASupervisorComparison.tsx   # Supervisor comparison table
```

### Key Calculation
```typescript
// GA is "lower is better" — variance logic is inverted
function calculateGAVariance(actual: number, target: number): {
  variancePct: number;
  variancePounds: number;
  isGood: boolean;
} {
  const variancePct = actual - target;
  return {
    variancePct,
    variancePounds: variancePct * kgUsage * costPerKg, // Simplified
    isGood: actual <= target, // Lower GA is better
  };
}
```

### UX Design
- Same card-based layout as other dashboards
- GA-specific color logic: green when below target, red when above
- Donut chart showing GA category breakdown
- Filter bar consistent with other views

---

## Definition of Done
- [ ] All 5 acceptance criteria pass
- [ ] GA by line table with correct variance calculations
- [ ] SKU drill-down with contribution analysis
- [ ] Factory GA trend chart with D3.js
- [ ] GA by manager grouped bar chart
- [ ] Supervisor comparison view
- [ ] Color logic correct (lower GA = better = green)
