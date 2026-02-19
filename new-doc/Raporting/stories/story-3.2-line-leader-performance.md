> **Status:** ✅ IMPLEMENTED
> **Component:** `src/components/line-leader/LineLeaderPage.tsx`
> **Features:** 4-component grading system (A/B/C/D), scorecard table, D3 performance heatmap, detail drawer with trend charts, grade criteria reference, Week/Period filtering toggle, product breakdown per leader

# Story 3.2: Line Leader Performance

## Story Overview
**Epic**: Advanced Analytics Views
**Priority**: Medium
**Estimated Effort**: 2-3 development sessions
**Dependencies**: Story 1.1, Story 1.2 (LINE YIELDS data aggregated by lineManager)

### User Story
> As a **Supervisor**, I want to **view individual line leader performance scorecards** with yield, GA, and efficiency metrics derived from LINE YIELDS data so that I can **conduct performance reviews and identify training needs**.

---

## Acceptance Criteria

### AC 3.2.1: Scorecard Table
- **Given** LINE YIELDS data is loaded and aggregated by line manager
- **When** the Line Leader Performance view is displayed
- **Then** a scorecard table shows:
  | Column | Description |
  |--------|-------------|
  | Name | Line leader name |
  | Team | Supervisor/team assignment |
  | KG Output | Total KG produced |
  | Yield % | Weighted average yield |
  | GA % | Weighted average giveaway |
  | Efficiency % | Average efficiency |
  | Grade | Performance grade (A/B/C/D) |
- **And** table is sortable on all columns
- **And** rows are color-coded by grade (A=green, B=blue, C=amber, D=red)

### AC 3.2.2: Individual Detail Panels
- **Given** a line leader row is clicked
- **When** the detail panel opens
- **Then** it shows:
  - 13-week trend charts for Yield, GA, and Efficiency from LINE YIELDS
  - Lines worked on with performance per line
  - Period summary with grade history
- **And** the panel slides in from the right (drawer pattern)

### AC 3.2.3: Ranking Heatmap
- **Given** multiple line leaders exist
- **When** the heatmap view is selected
- **Then** a D3.js heatmap shows:
  - Rows: Line leaders
  - Columns: Weeks (last 13)
  - Cell color: Performance metric (Yield/GA/Efficiency — tab selectable)
  - Color scale: Red (poor) → Yellow → Green (good)
- **And** tabs allow switching between Yield, GA, and Efficiency views

### AC 3.2.4: Grade Criteria Reference
- **Given** the performance view is displayed
- **When** the user clicks "Grade Criteria"
- **Then** a reference panel shows:
  | Grade | Yield % | GA % | Efficiency % |
  |-------|---------|------|-------------|
  | A | >= 95% | <= 1.5% | >= 80% |
  | B | >= 92% | <= 2.0% | >= 75% |
  | C | >= 90% | <= 2.5% | >= 70% |
  | D | < 90% | > 2.5% | < 70% |
- **Note**: Actual thresholds to be confirmed with management

### AC 3.2.5: Period Filtering
- **Given** the performance view is displayed
- **When** the user selects a period filter
- **Then** data is filtered to the selected 4-4-5 period
- **And** grades are recalculated for the filtered period
- **And** a period selector shows P1-P13 with date ranges

---

## Technical Implementation Plan

### Data Flow
```
LINE YIELDS data → aggregate by lineManager field → calculate weighted metrics per leader → apply grade criteria
```

### Component Structure
```
src/components/line-leader/
├── LineLeaderPage.tsx           # Main container
├── ScorecardTable.tsx           # Performance scorecard table
├── LeaderDetailDrawer.tsx       # Slide-in detail panel
├── PerformanceHeatmap.tsx       # D3.js ranking heatmap
├── GradeCriteria.tsx            # Grade reference panel
├── LeaderTrendCharts.tsx        # Individual trend charts
└── PeriodSelector.tsx           # Period filter
```

### Grade Calculation
```typescript
function calculateGrade(metrics: LeaderMetrics): 'A' | 'B' | 'C' | 'D' {
  const { yieldPct, gaPct, effPct } = metrics;

  if (yieldPct >= 95 && gaPct <= 1.5 && effPct >= 80) return 'A';
  if (yieldPct >= 92 && gaPct <= 2.0 && effPct >= 75) return 'B';
  if (yieldPct >= 90 && gaPct <= 2.5 && effPct >= 70) return 'C';
  return 'D';
}
```

### UX Design
- Scorecard uses card-based rows with grade badge
- Detail drawer: 400px wide, slides from right with overlay
- Heatmap: Full width, scrollable horizontally for many weeks
- Grade colors: A=`#00D2D3`, B=`#6C5CE7`, C=`#FECA57`, D=`#FF6B6B`

---

## Definition of Done
- [ ] All 5 acceptance criteria pass
- [ ] Scorecard table with correct grades based on Yield, GA, and Efficiency
- [ ] Individual detail panels with trend charts from LINE YIELDS data
- [ ] Ranking heatmap with D3.js
- [ ] Grade criteria reference accessible
- [ ] Period filtering works correctly
