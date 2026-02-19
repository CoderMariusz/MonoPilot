> **Status:** ✅ IMPLEMENTED
> **Component:** `src/components/team-comparison/TeamComparisonPage.tsx`
> **Features:** Team summary table, combined trend charts (multi-line yield/GA), team by line comparison matrix, potential savings calculator, drill-down to individual leaders, view mode toggle (summary/trends/matrix/savings)

# Story 3.3: Supervisor Team Comparison View

## Story Overview
**Epic**: Advanced Analytics Views
**Priority**: Medium
**Estimated Effort**: 2 development sessions
**Dependencies**: Story 1.1, Story 1.2, Story 3.2

### User Story
> As a **Manager**, I want to **compare supervisor team performance side by side** so that I can **identify best practices from top-performing teams and calculate potential savings from performance improvements**.

---

## Acceptance Criteria

### AC 3.3.1: Team Summary Table
- **Given** data is aggregated by supervisor/team
- **When** the Team Comparison view is displayed
- **Then** a table shows:
  | Column | Description |
  |--------|-------------|
  | Supervisor | Team supervisor name |
  | Team Size | Number of line leaders |
  | KG Output | Total team KG output |
  | Yield % | Team weighted average yield |
  | GA % | Team weighted average GA |
  | Efficiency % | Team average efficiency |
  | Variance £ | Total team variance |
  | Ranking | Position (1st, 2nd, etc.) |
- **And** rows are ranked by yield % descending
- **And** top team is highlighted with a gold badge

### AC 3.3.2: Team Trend Charts
- **Given** historical team data exists
- **When** the trend section is displayed
- **Then** multi-line D3.js charts show:
  - All teams' yield % on one chart (different colors per team)
  - All teams' GA % on one chart
  - Target lines overlaid
- **And** legend allows toggling individual teams on/off
- **And** hovering shows tooltip with all team values for that week

### AC 3.3.3: Team by Line Comparison Matrix
- **Given** team data is available by line
- **When** the matrix view is displayed
- **Then** a grid shows:
  - Rows: Production lines
  - Columns: Supervisor teams
  - Cells: Yield % (color-coded)
- **And** this reveals which teams perform better on which lines

### AC 3.3.4: Potential Savings Calculation
- **Given** team performance data exists
- **When** the savings section is displayed
- **Then** it calculates:
  - "If all teams matched the best team's yield, savings would be £X"
  - Per-team improvement potential in £
  - Breakdown by line showing where biggest improvements are possible
- **And** the calculation uses: `(bestTeamYield - teamYield) × teamKgUsage × costPerKg`

### AC 3.3.5: Drill-Down to Individual Leaders
- **Given** a team row is displayed
- **When** the user clicks a team name
- **Then** navigation goes to Line Leader Performance (Story 3.2)
- **And** the view is pre-filtered to that supervisor's team

---

## Technical Implementation Plan

### Component Structure
```
src/components/team-comparison/
├── TeamComparisonPage.tsx       # Main container
├── TeamSummaryTable.tsx         # Comparison table
├── TeamTrendCharts.tsx          # Multi-line D3 charts
├── TeamLineMatrix.tsx           # Line × Team heatmap
├── PotentialSavings.tsx         # Savings calculator
└── TeamRankBadge.tsx            # Ranking badge component
```

### Multi-Line Chart (D3.js)
```typescript
// Multiple teams on one chart with interactive legend
const teams = [...new Set(data.map(d => d.supervisor))];
const colorScale = d3.scaleOrdinal()
  .domain(teams)
  .range(['#6C5CE7', '#00D2D3', '#FECA57', '#FF6B6B', '#A29BFE', '#55EFC4']);

// Each team gets its own line path
teams.forEach(team => {
  const teamData = data.filter(d => d.supervisor === team);
  g.append('path')
    .datum(teamData)
    .attr('fill', 'none')
    .attr('stroke', colorScale(team))
    .attr('stroke-width', 2)
    .attr('d', line);
});
```

### UX Design
- Team cards at top showing ranking with medal icons
- Multi-line chart with interactive legend (click to toggle)
- Savings section with prominent £ value and breakdown table
- Matrix heatmap using same color scale as other heatmaps

---

## Definition of Done
- [ ] All 5 acceptance criteria pass
- [ ] Team summary table with rankings
- [ ] Multi-line trend charts with D3.js
- [ ] Team x Line comparison matrix
- [ ] Potential savings calculated correctly
- [ ] Drill-down to individual leaders works
