# Story 4.4: Shift Performance Overview

## Story Overview
**Epic**: Shift Report Analysis
**Priority**: High (Complete picture of daily shift performance)
**Estimated Effort**: 2-3 development sessions
**Dependencies**: Story 4.1 (Shift Report Data Parsing), Story 4.2 (Top 3 Issues), Story 4.3 (Supervisor Comments)

### User Story
> As a **Manager or Supervisor**, I want to **see a comprehensive overview of the day's shift performance** including KPI summary cards, QC holds, yield issues, safety incidents, and hourly performance trends so that I can **assess overall factory performance and identify areas needing attention**.

---

## Acceptance Criteria

### AC 4.4.1: KPI Summary Cards Row
- **Given** shift report data is loaded
- **When** the Shift Performance section is displayed
- **Then** a row of KPI summary cards shows:
  | Card | Value | Source |
  |------|-------|--------|
  | Efficiency % | 76% | REPORT Daily Row 3, Col 4 |
  | Hours vs Plan | -0.8 | REPORT Daily Row 3, Col 9 |
  | Changeovers | 22 | REPORT Daily Row 3, Col 14 |
  | Planned Lines | 19 | REPORT Daily Row 3, Col 20 |
  | Actual Lines | 19 | REPORT Daily Row 6, Col 20 |
  | Cases Produced | 48,763 | ACTIONS totals |
  | Packets Produced | 480,166 | ACTIONS totals |
- **And** each card has an icon, label, and large value
- **And** cards follow the design style from `dash 1.png` (clean white cards with subtle shadow)

### AC 4.4.2: Variance Indicators on Cards
- **Given** KPI cards are displayed
- **When** values have targets or expected ranges
- **Then** variance indicators show:
  - **Efficiency**: Green badge if ≥ target, red if below (e.g., "76% vs 76% target")
  - **Hours vs Plan**: Green if positive, red if negative (e.g., "-0.8 hrs" in red)
  - **Changeovers**: Neutral (informational only)
  - **Lines**: Green if actual ≥ planned, amber if below
- **And** badges use the same style as `dash 1.png` (small colored pill badges like "15.8% ↗")
- **And** hover on a card shows a tooltip with additional context

### AC 4.4.3: Secondary KPI Metrics
- **Given** the KPI section is displayed
- **When** the user scrolls to the secondary metrics area
- **Then** additional metrics are shown in a compact grid:
  | Metric | Value | Color Logic |
  |--------|-------|-------------|
  | Eng Downtime % | 2.7% | Red if > 3%, amber if > 2%, green otherwise |
  | Lost Eff (Grading) % | 0.0% | Green if 0%, red otherwise |
  | Lost Eff (Rates) % | 0.0% | Green if 0%, red otherwise |
  | Give Away % | 0.02 | Green if ≤ target, red otherwise |
  | Yield Variance £ | -£423 | Green if positive, red if negative |
  | Slow Running % | 17% | Red if > 15%, amber if > 10% |
  | Stops % | -19% | Context-dependent |
  | Die Changes | 3 | Informational |
  | Blowdowns | 3 | Informational |
  | Washdowns | 4 | Informational |
  | Staffing +/- | 2 | Green if 0, amber otherwise |
- **And** metrics are displayed in a 3-4 column grid of small cards

### AC 4.4.4: QC Hold Summary Panel
- **Given** QC Hold data exists in the shift report
- **When** the QC Hold panel is displayed
- **Then** a table shows:
  | Column | Description |
  |--------|-------------|
  | Line | Production line number |
  | Code | Product code (e.g., A5101) |
  | Boxes Held | Number of boxes on hold |
  | Boxes Rejected | Number rejected |
  | Staff | Number of staff involved |
  | Time Taken | Duration of hold |
  | Labour Hours | Total labour hours used |
  | Reason/Action | Reason for hold and corrective action |
- **And** the panel header shows total boxes held and total labour hours
- **And** rows with rejections > 0 are highlighted in red
- **And** if no QC holds exist, show "No QC holds today ✅" message

### AC 4.4.5: Yield Issues Panel
- **Given** yield issue data exists in the shift report (REPORT Daily rows 53-60)
- **When** the Yield Issues panel is displayed
- **Then** a table shows:
  | Column | Description |
  |--------|-------------|
  | Code | Product code |
  | Description | Product description |
  | Target Yield | Target yield % |
  | Actual Yield | Actual yield % |
  | Target GA | Target giveaway % |
  | Actual GA | Actual giveaway % |
  | Claim % | Claim percentage |
  | Value Covered | £ value covered |
  | Reason | Reason for yield issue |
- **And** rows where actual yield < target yield are highlighted
- **And** if no yield issues exist, show "No yield issues today ✅" message
- **And** a summary shows total value impact

### AC 4.4.6: Safety Summary
- **Given** safety data exists in the shift report
- **When** the Safety section is displayed
- **Then** it shows:
  - **Accidents**: Count badge (e.g., "1") with details text
  - **Near Miss Reports**: Count badge (e.g., "4")
  - Accident details from REPORT Daily rows 18-19
- **And** if accidents > 0, the section has a red alert border
- **And** if accidents = 0, show "No accidents ✅" in green
- **And** near miss count is always shown (even if 0)

### AC 4.4.7: AM vs PM Shift Comparison
- **Given** both AM and PM shift data is available
- **When** the user views the comparison section
- **Then** a side-by-side comparison table shows:
  | Metric | AM Shift | PM Shift | Daily |
  |--------|----------|----------|-------|
  | Efficiency % | 76% | 75% | 76% |
  | Hours vs Plan | -0.2 | -0.6 | -0.8 |
  | Changeovers | 13 | 9 | 22 |
  | Lines Run | 10 | 9 | 19 |
  | Cases | 25,718 | 23,045 | 48,763 |
  | Packets | 249,605 | 230,561 | 480,166 |
  | Total Downtime | X hrs | X hrs | 8.3 hrs |
- **And** the better-performing shift is highlighted in green for each metric
- **And** the comparison uses data from REPORT AM, REPORT PM, and REPORT Daily

### AC 4.4.8: Hourly Efficiency Trend Chart
- **Given** hourly data is available from HOURLY AM and HOURLY PM sheets
- **When** the hourly trend section is displayed
- **Then** a line chart shows:
  - X-axis: Hours of the day (H01-H08 AM, H09-H16 PM)
  - Y-axis: Efficiency %
  - Main line: Factory-wide efficiency per hour
  - Dashed line: Target efficiency
  - Vertical divider between AM and PM shifts
- **And** the chart is built with D3.js
- **And** hovering shows tooltip with hour, efficiency, cases, and packets
- **And** the chart area below target is shaded light red

### AC 4.4.9: Line-by-Line Performance Heatmap
- **Given** hourly line data is available
- **When** the heatmap section is displayed
- **Then** a grid/heatmap shows:
  - Rows: Production lines (L01-L26)
  - Columns: Hours of the day
  - Cell color: Efficiency % (green = high, red = low, gray = not running)
  - Cell text: Efficiency % value
- **And** hovering a cell shows: Line, Hour, SKU, Line Leader, Efficiency %, Cases
- **And** clicking a cell highlights that line's full row
- **And** lines not running during a period show as gray/empty
- **And** the heatmap uses D3.js with a sequential color scale

### AC 4.4.10: Export Daily Report
- **Given** the Shift Performance Overview is displayed
- **When** the user clicks "Export"
- **Then** they can choose:
  - **Copy to Clipboard**: Copies a formatted text summary for pasting into email/Teams
  - **Print PDF**: Opens print dialog with print-optimized layout
- **And** the clipboard copy includes:
  ```
  Shift Report — 10/02/2026
  ========================
  Efficiency: 76% (target: 76%)
  Hours vs Plan: -0.8
  Changeovers: 22
  Lines: 19/19
  Cases: 48,763 | Packets: 480,166
  
  Top 3 Issues:
  1. L22 — 95 min (Process: 60m, Plant: 35m)
  2. L17 — 75 min (Process: 60m, Plant: 15m)
  3. L14 — 60 min (Process: 60m)
  
  QC Holds: 1 (Line 13, Code A5101, 69 boxes)
  Accidents: 1 | Near Misses: 4
  ```

---

## Technical Implementation Plan

### Frontend Architecture

#### Component Structure
```
src/components/shift-report/
├── performance/
│   ├── ShiftPerformanceSection.tsx     # Main container
│   ├── KPISummaryCards.tsx             # Primary KPI cards row
│   ├── KPICard.tsx                     # Individual KPI card
│   ├── SecondaryMetricsGrid.tsx        # Secondary metrics grid
│   ├── QCHoldPanel.tsx                 # QC Hold table
│   ├── YieldIssuesPanel.tsx            # Yield issues table
│   ├── SafetySummary.tsx               # Accidents & near misses
│   ├── ShiftComparisonTable.tsx        # AM vs PM comparison
│   ├── HourlyEfficiencyChart.tsx       # D3.js hourly trend
│   ├── LinePerformanceHeatmap.tsx      # D3.js heatmap
│   └── ExportButton.tsx               # Export/copy functionality
```

#### KPI Card Component

```typescript
// components/shift-report/performance/KPICard.tsx
interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  target?: number;
  variance?: number;
  varianceDirection?: 'up' | 'down' | 'neutral';
  colorLogic?: 'higher-better' | 'lower-better' | 'neutral';
}

export function KPICard({ 
  icon, label, value, unit, target, variance, varianceDirection, colorLogic 
}: KPICardProps) {
  const getVarianceColor = () => {
    if (!variance || colorLogic === 'neutral') return 'text-gray-500';
    if (colorLogic === 'higher-better') {
      return variance >= 0 ? 'text-emerald-500' : 'text-red-500';
    }
    return variance <= 0 ? 'text-emerald-500' : 'text-red-500';
  };
  
  const getVarianceIcon = () => {
    if (!varianceDirection) return null;
    return varianceDirection === 'up' ? '↗' : '↘';
  };
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 
                    hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-lg text-gray-400">{unit}</span>}
        {variance !== undefined && (
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full 
                           ${getVarianceColor()} bg-opacity-10`}>
            {getVarianceIcon()} {Math.abs(variance)}%
          </span>
        )}
      </div>
      {target !== undefined && (
        <div className="text-xs text-gray-400 mt-1">
          Target: {target}{unit}
        </div>
      )}
    </div>
  );
}
```

#### D3.js Heatmap Implementation

```typescript
// components/shift-report/performance/LinePerformanceHeatmap.tsx
interface HeatmapCell {
  line: string;
  hour: string;
  efficiency: number | null;
  sku: string;
  lineLeader: string;
}

export function LinePerformanceHeatmap({ 
  data, 
  width = 900 
}: { data: HeatmapCell[]; width?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Get unique lines and hours
    const lines = [...new Set(data.map(d => d.line))].sort();
    const hours = [...new Set(data.map(d => d.hour))].sort();
    
    const cellSize = 40;
    const margin = { top: 40, right: 20, bottom: 20, left: 60 };
    const height = lines.length * cellSize + margin.top + margin.bottom;
    
    svg.attr('height', height);
    
    // Color scale: red (low eff) → yellow → green (high eff)
    const colorScale = d3.scaleSequential()
      .domain([50, 100])
      .interpolator(d3.interpolateRgbBasis(['#FF6B6B', '#FECA57', '#00D2D3']));
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // X scale (hours)
    const x = d3.scaleBand()
      .domain(hours)
      .range([0, hours.length * cellSize])
      .padding(0.05);
    
    // Y scale (lines)
    const y = d3.scaleBand()
      .domain(lines)
      .range([0, lines.length * cellSize])
      .padding(0.05);
    
    // Cells
    g.selectAll('.cell')
      .data(data)
      .enter().append('rect')
      .attr('x', d => x(d.hour)!)
      .attr('y', d => y(d.line)!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => d.efficiency !== null ? colorScale(d.efficiency) : '#f0f0f0')
      .attr('opacity', d => d.efficiency !== null ? 0.85 : 0.3);
    
    // Cell text
    g.selectAll('.cell-text')
      .data(data.filter(d => d.efficiency !== null))
      .enter().append('text')
      .attr('x', d => x(d.hour)! + x.bandwidth() / 2)
      .attr('y', d => y(d.line)! + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', d => (d.efficiency! > 75) ? '#fff' : '#333')
      .text(d => `${d.efficiency}%`);
    
    // Axis labels
    g.append('g')
      .attr('transform', `translate(0,-5)`)
      .selectAll('.hour-label')
      .data(hours)
      .enter().append('text')
      .attr('x', d => x(d)! + x.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#636E72')
      .text(d => d);
    
    g.append('g')
      .attr('transform', `translate(-5,0)`)
      .selectAll('.line-label')
      .data(lines)
      .enter().append('text')
      .attr('y', d => y(d)! + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '11px')
      .attr('fill', '#636E72')
      .text(d => d);
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', '#2D3436')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
    
    g.selectAll('rect')
      .on('mouseover', (event, d: any) => {
        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.line}</strong> — ${d.hour}<br/>
            Efficiency: ${d.efficiency !== null ? d.efficiency + '%' : 'N/A'}<br/>
            SKU: ${d.sku || 'N/A'}<br/>
            Leader: ${d.lineLeader || 'N/A'}
          `);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });
    
    return () => { tooltip.remove(); };
  }, [data, width]);
  
  return <svg ref={svgRef} width={width} />;
}
```

#### Clipboard Export

```typescript
// lib/export-utils.ts
export function generateShiftReportClipboard(data: ShiftReportData): string {
  const { summary, sortDaily } = data;
  const top3 = getTop3Issues(sortDaily);
  
  let text = `Shift Report — ${formatDate(data.date)}\n`;
  text += '========================\n';
  text += `Efficiency: ${summary.efficiency}% (target: ${summary.efficiencyTarget}%)\n`;
  text += `Hours vs Plan: ${summary.hoursVsPlan}\n`;
  text += `Changeovers: ${summary.changeovers}\n`;
  text += `Lines: ${summary.actualLines}/${summary.plannedLines}\n`;
  text += `Cases: ${formatNumber(summary.casesProduced)} | `;
  text += `Packets: ${formatNumber(summary.packetsProduced)}\n\n`;
  
  text += 'Top 3 Issues:\n';
  top3.forEach((issue, i) => {
    text += `${i + 1}. ${issue.line} — ${issue.overallTotalMins} min`;
    const parts = [];
    if (issue.peopleTotalMins > 0) parts.push(`People: ${issue.peopleTotalMins}m`);
    if (issue.processTotalMins > 0) parts.push(`Process: ${issue.processTotalMins}m`);
    if (issue.plantTotalMins > 0) parts.push(`Plant: ${issue.plantTotalMins}m`);
    text += ` (${parts.join(', ')})\n`;
  });
  
  text += `\nQC Holds: ${data.qcHoldAM.length + data.qcHoldPM.length}\n`;
  text += `Accidents: ${summary.accidents} | Near Misses: ${summary.nearMissReports}\n`;
  
  return text;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
```

### Layout Architecture

The Shift Report tab is organized as a scrollable single-page dashboard with sections:

```
┌─────────────────────────────────────────────────────────────────┐
│  SHIFT REPORT — 10/02/2026                    [📅] [Export ▾]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Eff% │ │Hrs  │ │C/O  │ │Plan │ │Act  │ │Cases│ │Pkts │   │
│  │ 76% │ │-0.8 │ │ 22  │ │ 19  │ │ 19  │ │48.7k│ │480k │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                                                 │
│  ┌─── Secondary Metrics ──────────────────────────────────┐   │
│  │ Eng DT: 2.7% │ GA: 0.02 │ Yield: -£423 │ Slow: 17%  │   │
│  │ Grading: 0%   │ Rates: 0% │ Stops: -19% │ Staff: +2  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── TOP 3 ISSUES ──────────────────────────────────────┐   │
│  │  [Issue Cards from Story 4.2]                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── SUPERVISOR COMMENTS ────────────────────────────────┐   │
│  │  [Timeline from Story 4.3]                             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── AM vs PM COMPARISON ────────────────────────────────┐   │
│  │  [Side-by-side table]                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── HOURLY EFFICIENCY TREND ────────────────────────────┐   │
│  │  [D3.js line chart]                                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── LINE PERFORMANCE HEATMAP ───────────────────────────┐   │
│  │  [D3.js heatmap grid]                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── QC HOLDS ──────────┐  ┌─── YIELD ISSUES ──────────┐   │
│  │  [Table]               │  │  [Table]                   │   │
│  └────────────────────────┘  └────────────────────────────┘   │
│                                                                 │
│  ┌─── SAFETY ─────────────────────────────────────────────┐   │
│  │  Accidents: 1 (details) │ Near Misses: 4              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Design Tokens

Following the reference designs (`dash 1.png` and `dash2.png`):

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-page` | `#F8F9FA` | Page background |
| `--bg-card` | `#FFFFFF` | Card backgrounds |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08)` | Card shadow |
| `--shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.12)` | Card hover shadow |
| `--radius-card` | `12px` | Card border radius |
| `--radius-badge` | `20px` | Badge/pill border radius |
| `--color-primary` | `#6C5CE7` | Primary accent (purple) |
| `--color-success` | `#00D2D3` | Positive values (teal) |
| `--color-warning` | `#FECA57` | Warning/amber values |
| `--color-danger` | `#FF6B6B` | Negative/danger values |
| `--color-text` | `#2D3436` | Primary text |
| `--color-text-secondary` | `#636E72` | Secondary text |
| `--color-border` | `#E9ECEF` | Borders |
| `--font-family` | `'Inter', system-ui, sans-serif` | Typography |
| `--font-size-kpi` | `32px` | KPI card values |
| `--font-size-label` | `12px` | Card labels |
| `--spacing-unit` | `8px` | Base spacing unit |

### Responsive Breakpoints

| Breakpoint | KPI Cards | Charts | Tables |
|-----------|-----------|--------|--------|
| ≥1400px | 7 in a row | Full width | Side by side |
| 1200-1399px | 4 + 3 rows | Full width | Side by side |
| 768-1199px | 3 + 2 + 2 rows | Full width | Stacked |
| ≤767px | 2 per row | Scrollable | Scrollable |

---

## Testing Strategy

### Unit Tests
- KPI extraction from parsed data
- Variance calculation logic
- Color logic for each metric type
- Clipboard text generation
- Number formatting (thousands separators)

### Visual Tests
- KPI cards render with correct values and colors
- Heatmap renders with correct color scale
- Hourly chart renders with target line
- AM vs PM comparison table is accurate
- QC Hold and Yield Issues tables display correctly

### Integration Tests
- Full data flow: Parse → Store → Display
- Date change updates all sections
- Export generates correct text
- Print layout renders correctly

### Edge Case Tests
- No QC holds (show success message)
- No yield issues (show success message)
- No accidents (show success message)
- Missing AM or PM data (show partial data)
- All lines at 0% efficiency
- Single line running

---

## Definition of Done
- [ ] All 10 acceptance criteria pass
- [ ] KPI summary cards display with correct values and variance indicators
- [ ] Secondary metrics grid shows all metrics with color coding
- [ ] QC Hold panel displays table or "no holds" message
- [ ] Yield Issues panel displays table or "no issues" message
- [ ] Safety summary shows accidents and near misses
- [ ] AM vs PM comparison table is accurate
- [ ] Hourly efficiency trend chart renders with D3.js
- [ ] Line performance heatmap renders with D3.js
- [ ] Export to clipboard works with formatted text
- [ ] Print layout generates clean output
- [ ] Responsive layout works on all breakpoints
- [ ] Design matches reference images (clean, modern, white cards)
- [ ] Code reviewed and documented
