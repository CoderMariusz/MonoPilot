> **Status:** ✅ IMPLEMENTED
> **Component:** `src/components/overview/OverviewDashboard.tsx`
> **Features:** 5 KPI summary cards with W/W badges, 13-week D3.js trend chart, Top 3 Gains/Losses tabbed panels, variance by line bar chart, week selector, responsive layout, skeleton loading

# Story 2.1: Factory Overview Dashboard

## Story Overview
**Epic**: Core Dashboard Views
**Priority**: High (Primary landing page)
**Estimated Effort**: 3 development sessions
**Dependencies**: Story 1.1 (Scaffold), Story 1.2 (Calendar & Aggregation)

### User Story
> As a **Manager or Supervisor**, I want to **see a high-level overview of factory KPIs** on the main dashboard so that I can **quickly assess current performance, identify trends, and spot the biggest gains and losses at a glance**.

---

## Acceptance Criteria

### AC 2.1.1: 5 KPI Summary Cards
- **Given** line yields data is loaded
- **When** the Overview dashboard is displayed
- **Then** 5 KPI summary cards are shown:
  | Card | Metric | Calculation |
  |------|--------|-------------|
  | Yield % | Factory weighted average yield | Weighted by KG Usage |
  | GA % | Factory weighted average giveaway | Weighted by KG Usage |
  | Efficiency % | Factory average efficiency | Simple average |
  | Cases Produced | Total cases produced today | Sum from Prod Pallets TOT Prod |
  | Yield Var £ | Total yield variance in £ | Sum of all line variances |

### AC 2.1.2: Week-over-Week Change Badges
- **Given** KPI cards are displayed
- **When** current and previous week data is available
- **Then** each card shows a colored badge:
  - Green pill with ↗ for improvement (e.g., "+1.2%")
  - Red pill with ↘ for decline (e.g., "-0.8%")
  - Gray pill for no change
- **And** badge style matches `dash 1.png` reference (small rounded pills)

### AC 2.1.3: Top 3 Gains Panel
- **Given** week-over-week comparison data exists
- **When** the Top 3 Gains panel is displayed
- **Then** it shows the 3 lines/products with highest positive yield variance £
- **And** each entry shows: Line, Product, Variance £, Variance %
- **And** entries are sorted by £ impact descending

### AC 2.1.4: Top 3 Losses Panel
- **Given** week-over-week comparison data exists
- **When** the Top 3 Losses panel is displayed
- **Then** it shows the 3 lines/products with most negative yield variance £
- **And** each entry shows: Line, Product, Variance £, Variance %
- **And** entries are sorted by £ impact ascending (most negative first)

### AC 2.1.5: Weekly Yield Trend Chart (13 Weeks)
- **Given** at least 2 weeks of data exist
- **When** the trend chart is displayed
- **Then** a line chart shows:
  - X-axis: Week ending dates (last 13 weeks)
  - Y-axis: Yield %
  - Main line: Factory yield % per week
  - Dashed line: Target yield %
  - Area fill below the line (gradient)
- **And** the chart uses D3.js with smooth curve interpolation
- **And** hovering shows tooltip with exact values

### AC 2.1.6: Yield Variance by Line Bar Chart
- **Given** current week data exists
- **When** the variance chart is displayed
- **Then** a horizontal bar chart shows:
  - Each production line as a bar
  - Bar length = yield variance £ (positive right, negative left)
  - Green bars for positive variance, red for negative
  - Sorted by variance (most positive at top)
- **And** clicking a bar navigates to Yield by Line view for that line

### AC 2.1.7: Week Selector
- **Given** multiple weeks of data exist
- **When** the week selector dropdown is clicked
- **Then** it shows all available week ending dates
- **And** selecting a week updates all dashboard components
- **And** the format is "W/E DD/MM/YYYY"

### AC 2.1.8: Auto-Detect Latest Week
- **Given** data is loaded
- **When** the Overview dashboard first renders
- **Then** the most recent week is automatically selected
- **And** all components display data for that week

### AC 2.1.9: Responsive Layout
- **Given** the dashboard is viewed on different screen sizes
- **When** the viewport changes
- **Then**:
  - Desktop (≥1200px): 5 cards in a row, charts side by side
  - Tablet (768-1199px): 3+2 card rows, charts stacked
  - Mobile (≤767px): 2 cards per row, charts full width

### AC 2.1.10: Loading Skeleton States
- **Given** data is being aggregated
- **When** components are waiting for data
- **Then** skeleton loading states are shown:
  - Card skeletons with pulsing gray rectangles
  - Chart skeletons with placeholder shapes
  - Smooth transition to real data when ready

---

## Technical Implementation Plan

### Component Structure
```
src/components/overview/
├── OverviewDashboard.tsx        # Main container
├── KPISummaryRow.tsx            # 5 KPI cards container
├── KPICard.tsx                  # Individual KPI card (reusable)
├── TopGainsLosses.tsx           # Top 3 gains/losses panels
├── WeeklyTrendChart.tsx         # D3.js 13-week trend line
├── VarianceByLineChart.tsx      # D3.js horizontal bar chart
├── WeekSelector.tsx             # Week dropdown
└── SkeletonCard.tsx             # Loading skeleton
```

### D3.js Weekly Trend Chart

```typescript
// components/overview/WeeklyTrendChart.tsx
export function WeeklyTrendChart({
  data,
  target,
  width = 700,
  height = 300
}: {
  data: { weekEnding: string; yieldPct: number }[];
  target: number;
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scalePoint()
      .domain(data.map(d => d.weekEnding))
      .range([0, innerWidth]);

    const yMin = Math.min(d3.min(data, d => d.yieldPct) || 0, target - 2);
    const yMax = Math.max(d3.max(data, d => d.yieldPct) || 100, target + 2);

    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient area fill
    const gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#6C5CE7').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#6C5CE7').attr('stop-opacity', 0.02);

    const area = d3.area<typeof data[0]>()
      .x(d => x(d.weekEnding)!)
      .y0(innerHeight)
      .y1(d => y(d.yieldPct))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(data).attr('fill', 'url(#area-gradient)').attr('d', area);

    // Target line
    g.append('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', y(target)).attr('y2', y(target))
      .attr('stroke', '#FF6B6B').attr('stroke-dasharray', '6,4').attr('stroke-width', 1.5);

    g.append('text')
      .attr('x', innerWidth + 5).attr('y', y(target) + 4)
      .attr('font-size', '11px').attr('fill', '#FF6B6B')
      .text(`Target: ${target}%`);

    // Main line
    const line = d3.line<typeof data[0]>()
      .x(d => x(d.weekEnding)!)
      .y(d => y(d.yieldPct))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', '#6C5CE7')
      .attr('stroke-width', 2.5).attr('d', line);

    // Data points
    g.selectAll('.dot').data(data).enter().append('circle')
      .attr('cx', d => x(d.weekEnding)!)
      .attr('cy', d => y(d.yieldPct))
      .attr('r', 4)
      .attr('fill', d => d.yieldPct >= target ? '#00D2D3' : '#FF6B6B')
      .attr('stroke', '#fff').attr('stroke-width', 2);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => {
        const date = new Date(d as string);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }))
      .selectAll('text').attr('font-size', '10px');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text').attr('font-size', '10px');

  }, [data, target, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

### D3.js Variance Bar Chart

```typescript
// components/overview/VarianceByLineChart.tsx
export function VarianceByLineChart({
  data,
  width = 500,
}: {
  data: { line: string; variancePounds: number }[];
  width?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const barHeight = 28;
  const height = data.length * (barHeight + 6) + 60;

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const sorted = [...data].sort((a, b) => b.variancePounds - a.variancePounds);
    const margin = { top: 20, right: 60, bottom: 20, left: 50 };
    const innerWidth = width - margin.left - margin.right;

    const maxAbs = Math.max(
      Math.abs(d3.min(sorted, d => d.variancePounds) || 0),
      Math.abs(d3.max(sorted, d => d.variancePounds) || 0)
    );

    const x = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([0, innerWidth]);
    const y = d3.scaleBand()
      .domain(sorted.map(d => d.line))
      .range([0, sorted.length * (barHeight + 6)])
      .padding(0.15);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Center line
    g.append('line')
      .attr('x1', x(0)).attr('x2', x(0))
      .attr('y1', 0).attr('y2', sorted.length * (barHeight + 6))
      .attr('stroke', '#E9ECEF').attr('stroke-width', 1);

    // Bars
    g.selectAll('.bar').data(sorted).enter().append('rect')
      .attr('x', d => d.variancePounds >= 0 ? x(0) : x(d.variancePounds))
      .attr('y', d => y(d.line)!)
      .attr('width', d => Math.abs(x(d.variancePounds) - x(0)))
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => d.variancePounds >= 0 ? '#00D2D3' : '#FF6B6B')
      .attr('opacity', 0.85)
      .style('cursor', 'pointer');

    // Labels
    g.selectAll('.label').data(sorted).enter().append('text')
      .attr('x', d => d.variancePounds >= 0 ? x(d.variancePounds) + 5 : x(d.variancePounds) - 5)
      .attr('y', d => y(d.line)! + y.bandwidth() / 2)
      .attr('text-anchor', d => d.variancePounds >= 0 ? 'start' : 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '11px').attr('font-weight', '600')
      .attr('fill', '#636E72')
      .text(d => `£${Math.abs(d.variancePounds).toLocaleString()}`);

    // Y axis (line names)
    g.append('g').call(d3.axisLeft(y)).selectAll('text').attr('font-size', '11px');

  }, [data, width]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

---

## UX Design Specification

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Overview                              W/E: [07/02/2026 ▾]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ 📈 Yield │ │ 📉 GA    │ │ ⚡ Eff   │ │ 📦 Cases │ │ 💷 Var   ││
│  │          │ │          │ │          │ │          │ │          ││
│  │  92.4%   │ │  1.8%    │ │  76.2%   │ │  48,763  │ │ -£2,340  ││
│  │ +0.3% ↗  │ │ -0.1% ↗  │ │ +1.1% ↗  │ │ +1,204 ↗ │ │ +£450 ↗  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │  📈 Weekly Yield Trend   │  │  🏆 Top 3 Gains              │   │
│  │  (13 weeks)              │  │                               │   │
│  │                          │  │  1. L08 Ham +£320 (+2.1%)    │   │
│  │  [line chart with        │  │  2. L14 Turkey +£180 (+1.4%) │   │
│  │   target line and        │  │  3. L22 Chicken +£95 (+0.8%) │   │
│  │   gradient fill]         │  │                               │   │
│  │                          │  ├───────────────────────────────┤   │
│  │                          │  │  📉 Top 3 Losses              │   │
│  │                          │  │                               │   │
│  │                          │  │  1. L17 Beef -£540 (-3.2%)   │   │
│  │                          │  │  2. L11 Pork -£280 (-1.8%)   │   │
│  │                          │  │  3. L06 Lamb -£120 (-0.9%)   │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  📊 Yield Variance by Line (£)                               │  │
│  │                                                               │  │
│  │  L08  ████████████████████████  +£320                        │  │
│  │  L14  ██████████████████  +£180                              │  │
│  │  L22  ████████████  +£95                                     │  │
│  │  L09  ██████  +£45                                           │  │
│  │       ─────────────────────────── 0                          │  │
│  │  L06  ████████  -£120                                        │  │
│  │  L11  ██████████████████  -£280                              │  │
│  │  L17  ██████████████████████████████  -£540                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Tokens
- Cards: White, 12px radius, subtle shadow, 20px padding
- KPI value: 32px bold, `#2D3436`
- KPI label: 12px uppercase, `#636E72`
- Variance badge: 12px semibold, rounded pill (20px radius)
- Chart: Clean axes, `#E9ECEF` grid lines, `#6C5CE7` primary line
- Gains: `#00D2D3` (teal)
- Losses: `#FF6B6B` (red)

---

## Definition of Done
- [ ] All 10 acceptance criteria pass
- [ ] 5 KPI cards display with correct aggregated values
- [ ] Week-over-week badges show correct direction and color
- [ ] Top 3 Gains and Losses panels populated correctly
- [ ] 13-week trend chart renders with D3.js
- [ ] Variance by line bar chart renders with D3.js
- [ ] Week selector works and updates all components
- [ ] Auto-detects latest week on load
- [ ] Responsive layout works on desktop and tablet
- [ ] Loading skeletons display during data aggregation
- [ ] Design matches reference images
