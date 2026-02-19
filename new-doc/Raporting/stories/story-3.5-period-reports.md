> **Status:** ✅ IMPLEMENTED & REVIEWED
> **Component:** `src/components/period-reports/PeriodReportsPage.tsx`
> **Review:** See `review.md` — production-ready, all AC met
> **Features:** P1-P13 summary table, period-over-period comparison, year-over-year comparison table, D3.js combo chart (bars + lines), year-end summary, print-optimized view, fiscal year selector

# Story 3.5: Period Reports (4-4-5 Calendar)

## Story Overview
**Epic**: Advanced Analytics Views
**Priority**: Medium
**Estimated Effort**: 2-3 development sessions
**Dependencies**: Story 1.2 (4-4-5 Calendar), Story 1.1

### User Story
> As a **Manager**, I want to **view KPI performance aggregated by 4-4-5 fiscal periods** with period-over-period and year-over-year comparisons so that I can **track long-term trends and prepare accurate financial reports**.

---

## Acceptance Criteria

### AC 3.5.1: Period Summary Table (P1-P13)
- **Given** line yields data spans multiple periods
- **When** the Period Reports view is displayed
- **Then** a table shows each period (P1-P13) with:
  | Column | Description |
  |--------|-------------|
  | Period | P1-P13 with date range |
  | Weeks | Number of weeks (4 or 5) |
  | KG Output | Total KG for period |
  | Yield % | Weighted average yield |
  | GA % | Weighted average GA |
  | Efficiency % | Average efficiency |
  | Variance £ | Total variance |
- **And** the current period is highlighted
- **And** completed periods show final values, current period shows YTD

### AC 3.5.2: Period-over-Period Comparison
- **Given** at least 2 periods of data exist
- **When** comparison columns are displayed
- **Then** each period shows:
  - Previous period values
  - Change % with color coding
  - Change £ with direction indicator
- **And** the comparison is between consecutive periods (P2 vs P1, P3 vs P2, etc.)

### AC 3.5.3: Year-over-Year Comparison
- **Given** data from multiple fiscal years exists
- **When** the YoY comparison is displayed
- **Then** a table shows:
  - Same period from current year vs previous year
  - Variance % and £ for each metric
  - Full year totals comparison
- **And** the year selector allows choosing comparison years

### AC 3.5.4: Period Trend Combo Chart
- **Given** period data exists
- **When** the trend chart is displayed
- **Then** a D3.js combo chart shows:
  - Bars: KG Output per period
  - Line: Yield % per period
  - Second line: GA % per period
  - Dashed lines: Targets
- **And** dual Y-axes (KG on left, % on right)
- **And** hovering shows all values for that period

### AC 3.5.5: Year-End Summary
- **Given** a full fiscal year of data exists
- **When** the year-end summary is displayed
- **Then** it shows:
  - Full year totals for all KPIs
  - Best and worst periods
  - Year-over-year improvement/decline
  - Key highlights and lowlights

### AC 3.5.6: Print-Optimized View
- **Given** the user wants to print period reports
- **When** they click "Print Report"
- **Then** a print-optimized layout generates:
  - Static chart images (SVG to canvas conversion)
  - Clean table formatting
  - Company header and date
  - Page breaks between sections
- **And** `@media print` CSS handles the layout

---

## Technical Implementation Plan

### Component Structure
```
src/components/period-reports/
├── PeriodReportsPage.tsx        # Main container
├── PeriodSummaryTable.tsx       # P1-P13 table
├── PeriodComparison.tsx         # Period-over-period
├── YearOverYearTable.tsx        # YoY comparison
├── PeriodTrendComboChart.tsx    # D3.js combo chart
├── YearEndSummary.tsx           # Full year summary
├── PrintableReport.tsx          # Print-optimized view
└── YearSelector.tsx             # Fiscal year selector
```

### D3.js Combo Chart (Bars + Lines)
```typescript
// Dual Y-axis combo chart
const yLeft = d3.scaleLinear()  // KG Output
  .domain([0, d3.max(data, d => d.kgOutput) || 0])
  .range([innerHeight, 0]);

const yRight = d3.scaleLinear() // Percentages
  .domain([
    Math.min(d3.min(data, d => Math.min(d.yieldPct, d.gaPct)) || 0, 85),
    Math.max(d3.max(data, d => d.yieldPct) || 100, 100)
  ])
  .range([innerHeight, 0]);

// Bars (KG Output)
g.selectAll('.bar').data(data).enter().append('rect')
  .attr('x', d => x(d.period)!)
  .attr('y', d => yLeft(d.kgOutput))
  .attr('width', x.bandwidth())
  .attr('height', d => innerHeight - yLeft(d.kgOutput))
  .attr('fill', '#6C5CE7')
  .attr('opacity', 0.7)
  .attr('rx', 4);

// Yield line
const yieldLine = d3.line<PeriodData>()
  .x(d => x(d.period)! + x.bandwidth() / 2)
  .y(d => yRight(d.yieldPct))
  .curve(d3.curveMonotoneX);

g.append('path').datum(data)
  .attr('fill', 'none')
  .attr('stroke', '#00D2D3')
  .attr('stroke-width', 2.5)
  .attr('d', yieldLine);

// GA line
const gaLine = d3.line<PeriodData>()
  .x(d => x(d.period)! + x.bandwidth() / 2)
  .y(d => yRight(d.gaPct))
  .curve(d3.curveMonotoneX);

g.append('path').datum(data)
  .attr('fill', 'none')
  .attr('stroke', '#FECA57')
  .attr('stroke-width', 2.5)
  .attr('d', gaLine);
```

### Print Implementation
```typescript
// Convert SVG charts to canvas for printing
async function svgToCanvas(svgElement: SVGSVGElement): Promise<HTMLCanvasElement> {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  });
}
```

### UX Design
- Period table with current period highlighted (light purple background)
- Combo chart: bars in purple, yield line in teal, GA line in amber
- YoY comparison: side-by-side columns with variance arrows
- Print button in header with preview option
- Year selector as tabs or dropdown

---

## Definition of Done
- [ ] All 6 acceptance criteria pass
- [ ] Period summary table shows P1-P13 correctly
- [ ] Period-over-period comparison works
- [ ] Year-over-year comparison works
- [ ] Combo chart renders with D3.js (bars + lines)
- [ ] Year-end summary calculates correctly
- [ ] Print view generates clean output with static charts
- [ ] 4-4-5 calendar calculations verified against Excel
