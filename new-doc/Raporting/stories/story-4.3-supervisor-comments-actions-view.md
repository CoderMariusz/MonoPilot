# Story 4.3: Supervisor Comments & Actions View

## Story Overview
**Epic**: Shift Report Analysis
**Priority**: High (Key visibility for management)
**Estimated Effort**: 2 development sessions
**Dependencies**: Story 4.1 (Shift Report Data Parsing)

### User Story
> As a **Manager**, I want to **read all supervisor comments and actions taken during each shift** in a clear chronological timeline so that I can **understand what happened during the day, what corrective actions were taken, and what additional support is needed**.

---

## Acceptance Criteria

### AC 4.3.1: Chronological Timeline View
- **Given** shift report data is loaded
- **When** the Supervisor Comments section is displayed
- **Then** a vertical timeline shows all 2-hour review blocks in order:
  1. AM Shift: H01-H02, H03-H04, H05-H06, H07-H08
  2. PM Shift: H01-H02 (H09-H10), H03-H04 (H11-H12), H05-H06 (H13-H14), H07-H08 (H15-H16)
- **And** each block is connected by a vertical timeline line
- **And** AM and PM shifts are visually separated with a shift divider
- **And** the timeline reads top-to-bottom chronologically

### AC 4.3.2: Review Block Content
- **Given** a 2-hour review block is displayed
- **When** the user views the block
- **Then** each block shows:
  - **Hour Range**: e.g., "H01-H02 (06:00 - 08:00)" with shift badge (AM/PM)
  - **Issue 1**: Key Issue text with number badge "1)"
  - **Issue 2**: Key Issue text with number badge "2)" (if present)
  - **Actions Taken**: Text for each issue's corrective action
  - **Support Required**: Text (if any) highlighted with ⚠️ icon
- **And** empty fields show "No issues reported" in muted text
- **And** each issue-action pair is visually grouped together

### AC 4.3.3: Running KPI Indicators
- **Given** a 2-hour review block is displayed
- **When** the user views the right side of the block
- **Then** running KPIs are shown as mini metric badges:
  - **Eff %**: With color coding (green ≥ target, red < target)
  - **Hrs v Plan**: With +/- indicator and color
  - **Lines Run**: Count
  - **Cases**: Formatted number (e.g., "3,025")
  - **Packets**: Formatted number (e.g., "27,638")
- **And** KPIs that improved from previous block show ↑ green arrow
- **And** KPIs that worsened show ↓ red arrow

### AC 4.3.4: Efficiency Trend Line
- **Given** all review blocks are loaded
- **When** the efficiency trend section is displayed
- **Then** a small line chart shows efficiency % across all hours of the day
- **And** the chart combines AM and PM data points
- **And** a horizontal dashed line shows the target efficiency
- **And** areas below target are shaded in light red
- **And** the chart uses D3.js with smooth curve interpolation
- **And** hovering a data point shows the exact value and hour

### AC 4.3.5: Shift Filter Toggle
- **Given** the Supervisor Comments view is displayed
- **When** the user clicks the shift filter
- **Then** they can toggle between:
  - **Both** (default): Shows AM then PM chronologically
  - **AM Only**: Shows only AM shift blocks
  - **PM Only**: Shows only PM shift blocks
- **And** the toggle is a segmented control: `[Both] [AM] [PM]`
- **And** switching is instant with a smooth fade transition

### AC 4.3.6: Below-Target Highlighting
- **Given** a review block has efficiency below target
- **When** the block is rendered
- **Then** the block has a subtle red-tinted left border
- **And** the efficiency badge shows in red with a ⚠️ icon
- **And** blocks with efficiency ≥ target have a green-tinted left border
- **And** the target value is shown in parentheses (e.g., "70% (target: 76%)")

### AC 4.3.7: Support Required Alerts
- **Given** a review block has "Additional Support Required" text
- **When** the block is rendered
- **Then** a prominent alert banner appears within the block:
  ```
  ⚠️ SUPPORT REQUIRED: [support text]
  ```
- **And** the banner has an amber background with dark text
- **And** a summary count badge appears at the top: "X items need support"
- **And** clicking the badge scrolls to the first support-required block

### AC 4.3.8: Expandable/Collapsible Blocks
- **Given** the timeline has multiple blocks
- **When** the user clicks a block header
- **Then** the block content toggles between expanded and collapsed
- **And** collapsed blocks show only: Hour range, shift badge, and efficiency %
- **And** a "Collapse All" / "Expand All" button is available at the top
- **And** the default state is all blocks expanded
- **And** animation is smooth (200ms slide)

### AC 4.3.9: Print-Friendly View
- **Given** the user wants to print the supervisor comments
- **When** they click the "Print" button or use Ctrl+P
- **Then** a print-optimized layout is generated:
  - All blocks expanded
  - No interactive elements (buttons, toggles)
  - Clean black-and-white friendly layout
  - Date and shift clearly labeled at top
  - Page breaks between AM and PM shifts
  - Company header with "Shift Report — [Date]"
- **And** the print CSS is defined in `@media print` rules

### AC 4.3.10: Search Across Comments
- **Given** the Supervisor Comments view is displayed
- **When** the user types in the search box
- **Then** blocks are filtered to show only those containing the search term
- **And** matching text is highlighted in yellow within the blocks
- **And** search covers: Key Issues, Actions Taken, and Support Required fields
- **And** the search is case-insensitive
- **And** a "X results found" counter is shown
- **And** clearing the search restores all blocks

---

## Technical Implementation Plan

### Frontend Architecture

#### Component Structure
```
src/components/shift-report/
├── comments/
│   ├── SupervisorCommentsSection.tsx   # Main container
│   ├── ShiftTimeline.tsx              # Vertical timeline layout
│   ├── ReviewBlock.tsx                # Individual 2-hour review block
│   ├── ReviewBlockCollapsed.tsx       # Collapsed state
│   ├── KPIBadges.tsx                  # Mini KPI indicators
│   ├── SupportAlert.tsx              # Support required banner
│   ├── EfficiencyTrendChart.tsx       # D3.js efficiency line chart
│   ├── ShiftFilterToggle.tsx          # AM/PM/Both segmented control
│   ├── CommentsSearch.tsx             # Search input with highlighting
│   └── PrintView.tsx                  # Print-optimized layout
```

#### Data Transformation

**Timeline Data Builder** (`lib/shift-report-utils.ts`):
```typescript
interface TimelineBlock {
  id: string;
  shift: 'AM' | 'PM';
  hourRange: string;
  timeRange: string;
  issues: {
    number: string;
    keyIssue: string;
    actionsTaken: string;
    supportRequired: string;
  }[];
  kpis: {
    efficiencyPct: number | null;
    hrsVsPlan: number | null;
    linesRun: number | null;
    cases: number | null;
    packets: number | null;
  };
  isBelowTarget: boolean;
  hasSupportRequired: boolean;
}

export function buildTimeline(
  actionsAM: SupervisorReview[],
  actionsPM: SupervisorReview[],
  efficiencyTarget: number
): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  
  // Group AM reviews by hour block
  const amGroups = groupByHourBlock(actionsAM);
  const pmGroups = groupByHourBlock(actionsPM);
  
  // AM hour mapping
  const amTimeMap: Record<string, string> = {
    'H01': '06:00 - 08:00',
    'H03': '08:00 - 10:00',
    'H05': '10:00 - 12:00',
    'H07': '12:00 - 14:00',
  };
  
  // PM hour mapping
  const pmTimeMap: Record<string, string> = {
    'H01': '14:00 - 16:00',
    'H03': '16:00 - 18:00',
    'H05': '18:00 - 20:00',
    'H07': '20:00 - 22:00',
  };
  
  // Build AM blocks
  for (const [hour, reviews] of Object.entries(amGroups)) {
    blocks.push({
      id: `am-${hour}`,
      shift: 'AM',
      hourRange: `${hour}-${getNextHour(hour)}`,
      timeRange: amTimeMap[hour] || hour,
      issues: reviews.map(r => ({
        number: r.number,
        keyIssue: r.keyIssue,
        actionsTaken: r.actionsTaken,
        supportRequired: r.supportRequired,
      })),
      kpis: {
        efficiencyPct: reviews[0]?.efficiencyPct ?? null,
        hrsVsPlan: reviews[0]?.hrsVsPlan ?? null,
        linesRun: reviews[0]?.linesRun ?? null,
        cases: reviews[0]?.cases ?? null,
        packets: reviews[0]?.packets ?? null,
      },
      isBelowTarget: (reviews[0]?.efficiencyPct ?? 100) < efficiencyTarget,
      hasSupportRequired: reviews.some(r => r.supportRequired?.trim().length > 0),
    });
  }
  
  // Build PM blocks similarly...
  
  return blocks;
}

function groupByHourBlock(reviews: SupervisorReview[]): Record<string, SupervisorReview[]> {
  const groups: Record<string, SupervisorReview[]> = {};
  for (const review of reviews) {
    if (!groups[review.hour]) groups[review.hour] = [];
    groups[review.hour].push(review);
  }
  return groups;
}
```

#### D3.js Efficiency Trend Chart

```typescript
// components/shift-report/comments/EfficiencyTrendChart.tsx
interface TrendPoint {
  hour: string;
  time: string;
  efficiency: number;
  shift: 'AM' | 'PM';
}

export function EfficiencyTrendChart({ 
  data, 
  target,
  width = 800,
  height = 200 
}: { data: TrendPoint[]; target: number; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const x = d3.scalePoint()
      .domain(data.map(d => d.time))
      .range([0, innerWidth]);
    
    const y = d3.scaleLinear()
      .domain([
        Math.min(d3.min(data, d => d.efficiency) || 0, target - 10),
        Math.max(d3.max(data, d => d.efficiency) || 100, target + 10)
      ])
      .range([innerHeight, 0]);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Target line (dashed)
    g.append('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', y(target)).attr('y2', y(target))
      .attr('stroke', '#FF6B6B')
      .attr('stroke-dasharray', '6,4')
      .attr('stroke-width', 1.5);
    
    // Area below target (red shading)
    const areaBelow = d3.area<TrendPoint>()
      .x(d => x(d.time)!)
      .y0(d => Math.max(y(d.efficiency), y(target)))
      .y1(y(target))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(data.filter(d => d.efficiency < target))
      .attr('fill', 'rgba(255, 107, 107, 0.1)')
      .attr('d', areaBelow);
    
    // Main line
    const line = d3.line<TrendPoint>()
      .x(d => x(d.time)!)
      .y(d => y(d.efficiency))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6C5CE7')
      .attr('stroke-width', 2.5)
      .attr('d', line);
    
    // Data points
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('cx', d => x(d.time)!)
      .attr('cy', d => y(d.efficiency))
      .attr('r', 4)
      .attr('fill', d => d.efficiency >= target ? '#00D2D3' : '#FF6B6B')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));
    
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));
    
  }, [data, target, width, height]);
  
  return <svg ref={svgRef} width={width} height={height} />;
}
```

#### Search with Highlighting

```typescript
// components/shift-report/comments/CommentsSearch.tsx
import { useState, useMemo } from 'react';

export function useSearchFilter(blocks: TimelineBlock[], searchTerm: string) {
  return useMemo(() => {
    if (!searchTerm.trim()) return { filtered: blocks, count: blocks.length };
    
    const term = searchTerm.toLowerCase();
    const filtered = blocks.filter(block =>
      block.issues.some(issue =>
        issue.keyIssue.toLowerCase().includes(term) ||
        issue.actionsTaken.toLowerCase().includes(term) ||
        issue.supportRequired.toLowerCase().includes(term)
      )
    );
    
    return { filtered, count: filtered.length };
  }, [blocks, searchTerm]);
}

// Text highlighting component
export function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  
  const regex = new RegExp(`(${escapeRegex(highlight)})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) 
          ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}
```

#### Print CSS

```css
@media print {
  /* Hide interactive elements */
  .shift-filter-toggle,
  .comments-search,
  .collapse-all-btn,
  .expand-chevron,
  .print-btn,
  nav,
  .sidebar { display: none !important; }
  
  /* Expand all blocks */
  .review-block-content { 
    display: block !important;
    max-height: none !important;
  }
  
  /* Clean layout */
  .review-block {
    border: 1px solid #ddd;
    page-break-inside: avoid;
    margin-bottom: 12px;
  }
  
  /* Shift divider page break */
  .shift-divider { page-break-before: always; }
  
  /* Header */
  .print-header {
    display: block !important;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  /* Remove colors for B&W printing */
  .support-alert { 
    border: 2px solid #000;
    background: #f0f0f0 !important;
  }
}
```

### Responsive Design

#### Desktop (≥1200px)
```
┌─────────────────────────────────────────────────────────┐
│  [Both] [AM] [PM]    🔍 Search...    [Collapse All]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── AM SHIFT ──────────────────────────────────────     │
│                                                         │
│  ●─── H01-H02 (06:00-08:00) ──── [Eff: 70%] ────     │
│  │    Issue 1: Line A base web lifters down             │
│  │    Action: Issue not resolved by night shift...      │
│  │    Issue 2: Line 15 Issida incorrect weight...       │
│  │    Action: Recalibrated...                           │
│  │                                                      │
│  │    📊 Eff: 70% | Hrs: -0.7 | Lines: 9 | Cases: 3k │
│  │                                                      │
│  ●─── H03-H04 (08:00-10:00) ──── [Eff: 78%] ────     │
│  │    ...                                               │
│                                                         │
│  ── PM SHIFT ──────────────────────────────────────     │
│  ...                                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📈 Efficiency Trend Across Day                  │   │
│  │  [line chart with target line]                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Tablet (768-1199px)
- Timeline takes full width
- KPI badges wrap to second line
- Efficiency chart below timeline

#### Mobile (≤767px)
- Simplified blocks (key issue + efficiency only when collapsed)
- Search bar full width
- Chart hidden (available via "Show Chart" button)

---

## Testing Strategy

### Unit Tests
- `buildTimeline()` correctly groups reviews into blocks
- `groupByHourBlock()` handles missing hours
- `useSearchFilter()` filters and counts correctly
- KPI comparison (↑/↓ arrows) logic
- Below-target detection

### Visual Tests
- Timeline renders with correct chronological order
- Support required alerts are prominent
- Below-target blocks have red border
- Print view renders correctly
- Search highlighting works

### Integration Tests
- Shift filter toggle updates timeline
- Expand/collapse all works
- Search filters blocks in real-time
- Print button triggers print dialog
- Data loads from IndexedDB correctly

### Accessibility Tests
- Timeline is keyboard navigable
- Screen reader announces block content
- Search results are announced
- Print view is accessible

---

## Definition of Done
- [ ] All 10 acceptance criteria pass
- [ ] Timeline renders chronologically with AM then PM
- [ ] Each block shows issues, actions, and support required
- [ ] KPI badges show with trend arrows
- [ ] Efficiency trend chart renders with D3.js
- [ ] Shift filter toggle works (Both/AM/PM)
- [ ] Below-target blocks highlighted
- [ ] Support required alerts prominent
- [ ] Expand/collapse works with smooth animation
- [ ] Print view generates clean output
- [ ] Search filters and highlights text
- [ ] Responsive layout works on all breakpoints
- [ ] Code reviewed and documented
