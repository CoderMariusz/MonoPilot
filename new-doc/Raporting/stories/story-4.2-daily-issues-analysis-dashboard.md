# Story 4.2: Daily Issues Analysis Dashboard (Top 3 Issues of the Day)

## Story Overview
**Epic**: Shift Report Analysis
**Priority**: High (Primary feature of the Shift Report tab)
**Estimated Effort**: 2-3 development sessions
**Dependencies**: Story 4.1 (Shift Report Data Parsing)

### User Story
> As a **Supervisor or Manager**, I want to **see the top 3 issues of the day at a glance** with downtime breakdown by category (People/Process/Plant) so that I can **quickly identify the biggest production problems and take corrective action**.

---

## Acceptance Criteria

### AC 4.2.1: Top 3 Issues Cards
- **Given** shift report data is loaded for a date
- **When** the Shift Report tab is displayed
- **Then** 3 prominent issue cards are shown at the top of the page
- **And** each card displays:
  - Rank badge (#1, #2, #3)
  - Line identifier (e.g., "Line 22")
  - Total downtime in minutes (e.g., "95 min")
  - Primary category icon and label
- **And** cards are ordered by total downtime descending (highest first)

### AC 4.2.2: Issue Card Detail Breakdown
- **Given** a Top 3 issue card is displayed
- **When** the user views the card
- **Then** each card shows a mini breakdown bar:
  - People minutes (blue segment)
  - Process minutes (amber segment)
  - Plant minutes (red segment)
- **And** the percentage split is shown (e.g., "People 0% | Process 63% | Plant 37%")
- **And** the dominant category is highlighted

### AC 4.2.3: Category Color Coding
- **Given** issue cards are rendered
- **When** the primary category is determined (highest minutes)
- **Then** cards are color-coded:
  - **People** issues: Left border `#6C5CE7` (purple-blue) with 👥 icon
  - **Process** issues: Left border `#FECA57` (amber) with ⚙️ icon
  - **Plant** issues: Left border `#FF6B6B` (red) with 🔧 icon
- **And** the card background has a subtle tint matching the category

### AC 4.2.4: Expandable Issue Details
- **Given** a Top 3 issue card is displayed
- **When** the user clicks "View Details" or the expand chevron
- **Then** the card expands to show:
  - **People Details**: Full text of people-related issues (if any)
  - **Process Details**: Full text of process-related issues
  - **Plant Details**: Full text of plant-related issues
  - Each detail section shows individual issue items parsed from the comma-separated text
- **And** each issue item shows its duration (e.g., "blow down change over — 15m")
- **And** the expanded view has a smooth slide-down animation (200ms ease)

### AC 4.2.5: All Lines Downtime Bar Chart
- **Given** shift report data is loaded
- **When** the Shift Report tab is displayed
- **Then** a horizontal bar chart shows ALL lines with downtime > 0
- **And** bars are sorted by total downtime descending
- **And** each bar is stacked with People (blue) / Process (amber) / Plant (red) segments
- **And** the line label is on the left, total minutes on the right
- **And** hovering a bar segment shows a tooltip with category details
- **And** the chart uses D3.js for rendering

### AC 4.2.6: Stacked Category Visualization
- **Given** the downtime bar chart is displayed
- **When** the user views the chart
- **Then** a legend shows:
  - 🔵 People: X.X hrs (XX%)
  - 🟡 Process: X.X hrs (XX%)
  - 🔴 Plant: X.X hrs (XX%)
- **And** clicking a legend item toggles that category's visibility
- **And** the chart smoothly re-renders when categories are toggled

### AC 4.2.7: Total Downtime Summary Card
- **Given** shift report data is loaded
- **When** the summary section is displayed
- **Then** a summary card shows:
  - **Total Downtime**: X.X hours (sum of all lines)
  - **People Total**: X.X hours
  - **Process Total**: X.X hours
  - **Plant Total**: X.X hours
  - **Lines Affected**: X of Y total lines
- **And** a donut chart shows the category split visually

### AC 4.2.8: Date Selector
- **Given** multiple shift reports have been loaded
- **When** the user clicks the date selector
- **Then** a dropdown shows all available dates (from IndexedDB)
- **And** selecting a date reloads all dashboard components with that date's data
- **And** the most recent date is selected by default
- **And** the date format is "DD/MM/YYYY (Day)" (e.g., "10/02/2026 (Tuesday)")

### AC 4.2.9: AM vs PM Shift Comparison
- **Given** shift report data is loaded
- **When** the user toggles to "Shift Comparison" view
- **Then** a side-by-side comparison shows:
  - AM shift top 3 issues (from SORT AM)
  - PM shift top 3 issues (from SORT PM)
  - Combined daily view (from SORT DAILY) — default
- **And** each shift shows its own total downtime
- **And** a toggle control allows switching: [Daily] [AM] [PM] [Compare]

### AC 4.2.10: Click-Through to Detailed Breakdown
- **Given** a Top 3 issue card is displayed
- **When** the user clicks "Full Breakdown" on a specific line
- **Then** a detail panel opens showing:
  - Hourly downtime for that line (from HOURLY AM/PM data)
  - Line leader and supervisor assigned
  - SKU being produced
  - Efficiency % for each hour
  - All downtime events with timestamps
- **And** the panel can be closed with an X button or clicking outside

---

## Technical Implementation Plan

### Frontend Architecture

#### Component Structure
```
src/components/shift-report/
├── issues/
│   ├── TopIssuesSection.tsx          # Container for top 3 cards
│   ├── IssueCard.tsx                 # Individual issue card
│   ├── IssueCardExpanded.tsx         # Expanded detail view
│   ├── DowntimeBarChart.tsx          # D3.js horizontal stacked bar
│   ├── DowntimeSummaryCard.tsx       # Total downtime donut chart
│   ├── CategoryDonutChart.tsx        # People/Process/Plant donut
│   ├── ShiftComparisonView.tsx       # AM vs PM side-by-side
│   ├── LineDetailPanel.tsx           # Click-through detail panel
│   └── DateSelector.tsx              # Date picker dropdown
```

#### Data Processing Logic

**Top 3 Issues Extraction** (`lib/shift-report-utils.ts`):
```typescript
export function getTop3Issues(sortData: DowntimeByLine[]): DowntimeByLine[] {
  return sortData
    .filter(row => row.overallTotalMins > 0)
    .sort((a, b) => b.overallTotalMins - a.overallTotalMins)
    .slice(0, 3)
    .map(row => ({
      ...row,
      primaryCategory: determinePrimaryCategory(row),
      peoplePercent: row.overallTotalMins > 0 
        ? (row.peopleTotalMins / row.overallTotalMins) * 100 : 0,
      processPercent: row.overallTotalMins > 0 
        ? (row.processTotalMins / row.overallTotalMins) * 100 : 0,
      plantPercent: row.overallTotalMins > 0 
        ? (row.plantTotalMins / row.overallTotalMins) * 100 : 0,
    }));
}

function determinePrimaryCategory(row: DowntimeByLine): 'people' | 'process' | 'plant' {
  const max = Math.max(row.peopleTotalMins, row.processTotalMins, row.plantTotalMins);
  if (max === row.peopleTotalMins) return 'people';
  if (max === row.processTotalMins) return 'process';
  return 'plant';
}

export function parseIssueDetails(detailText: string): IssueItem[] {
  // Parse comma-separated issue descriptions
  // Example: "blow down change over 15m , faulty top web art work 10m"
  return detailText
    .split(/,\s*/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      const durationMatch = item.match(/(\d+)\s*m\s*$/);
      return {
        description: item.replace(/\d+\s*m\s*$/, '').trim(),
        durationMins: durationMatch ? parseInt(durationMatch[1]) : null,
      };
    });
}
```

#### D3.js Horizontal Stacked Bar Chart

```typescript
// components/shift-report/issues/DowntimeBarChart.tsx
import * as d3 from 'd3';

interface BarChartProps {
  data: DowntimeByLine[];
  width?: number;
  height?: number;
}

export function DowntimeBarChart({ data, width = 600, height }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const filteredData = data.filter(d => d.overallTotalMins > 0);
  const barHeight = 32;
  const calculatedHeight = filteredData.length * (barHeight + 8) + 60;
  
  useEffect(() => {
    if (!svgRef.current || !filteredData.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 20, right: 80, bottom: 30, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    
    const x = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.overallTotalMins) || 0])
      .range([0, innerWidth]);
    
    const y = d3.scaleBand()
      .domain(filteredData.map(d => d.line))
      .range([0, filteredData.length * (barHeight + 8)])
      .padding(0.2);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Stacked bars
    const categories = ['peopleTotalMins', 'processTotalMins', 'plantTotalMins'];
    const colors = ['#6C5CE7', '#FECA57', '#FF6B6B'];
    
    // ... D3 stacked bar implementation
  }, [filteredData, width]);
  
  return <svg ref={svgRef} width={width} height={calculatedHeight} />;
}
```

#### Category Donut Chart (D3.js)
```typescript
// Small donut chart showing People/Process/Plant split
// Uses d3.pie() and d3.arc() with smooth transitions
// Center text shows total hours
// Segments are interactive (hover for tooltip)
```

### State Management

```typescript
// Using React Context for shift report state
interface ShiftReportState {
  currentDate: string | null;
  availableDates: string[];
  data: ShiftReportData | null;
  viewMode: 'daily' | 'am' | 'pm' | 'compare';
  isLoading: boolean;
  error: string | null;
}

// Actions
type ShiftReportAction =
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_DATA'; data: ShiftReportData }
  | { type: 'SET_VIEW_MODE'; mode: 'daily' | 'am' | 'pm' | 'compare' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string };
```

### Responsive Design Breakpoints
- **Desktop (≥1200px)**: 3 issue cards in a row, chart beside summary
- **Tablet (768-1199px)**: 3 issue cards in a row (smaller), chart below
- **Mobile (≤767px)**: Issue cards stacked vertically, chart full width

---

## UX Design Specification

### Top 3 Issues Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  📋 Shift Report — 10/02/2026 (Tuesday)     [Daily ▾] [📅 Date ▾]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TOP 3 ISSUES OF THE DAY                                               │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ #1  🔧 PLANT     │  │ #2  ⚙️ PROCESS   │  │ #3  ⚙️ PROCESS   │     │
│  │                   │  │                   │  │                   │     │
│  │  Line 22          │  │  Line 17          │  │  Line 14          │     │
│  │  95 min           │  │  75 min           │  │  60 min           │     │
│  │                   │  │                   │  │                   │     │
│  │  ░░░░████████░░░  │  │  ░░████████░░░░  │  │  ░░████████████░  │     │
│  │  P:0% Pr:63% Pl:37│  │  P:0% Pr:80% Pl:20│  │  P:0% Pr:100%    │     │
│  │                   │  │                   │  │                   │     │
│  │  [View Details ▾] │  │  [View Details ▾] │  │  [View Details ▾] │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐   │
│  │  DOWNTIME BY LINE                │  │  TOTAL DOWNTIME          │   │
│  │                                   │  │                          │   │
│  │  L22 ████████████████████  95m   │  │     ┌────┐              │   │
│  │  L17 ██████████████████    75m   │  │    /  8.3 \  hours      │   │
│  │  L14 ████████████████      60m   │  │   │  hrs  │             │   │
│  │  L11 ██████████████        55m   │  │    \      /             │   │
│  │  L08 ████████████          45m   │  │     └────┘              │   │
│  │  L12 ████████████          45m   │  │                          │   │
│  │  L06 ██████████            40m   │  │  👥 People:  0.2 hrs    │   │
│  │  L23 ██████                20m   │  │  ⚙️ Process: 4.6 hrs    │   │
│  │  L13 ██████                20m   │  │  🔧 Plant:   3.5 hrs    │   │
│  │  L21 ██████                20m   │  │                          │   │
│  │  L01 ████                  12m   │  │  Lines affected: 13/19  │   │
│  │  L15 ███                    8m   │  │                          │   │
│  │                                   │  │                          │   │
│  │  ■ People  ■ Process  ■ Plant    │  │                          │   │
│  └──────────────────────────────────┘  └──────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Expanded Issue Card
```
┌──────────────────────────────────────────────────────────┐
│ #1  🔧 PLANT/PROCESS                                    │
│                                                          │
│  Line 22                                    95 min total │
│                                                          │
│  ░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░░  │
│  People: 0 min | Process: 60 min | Plant: 35 min        │
│                                                          │
│  ─── Process Issues (60 min) ───                         │
│  • Blow down change over .......................... 15m  │
│  • Faulty top web art work ........................ 10m  │
│  • C/over blowdown ................................ 15m  │
│  • Change over, blow down ......................... 20m  │
│                                                          │
│  ─── Plant Issues (35 min) ───                           │
│  • Issue with cross cutters, engineer on line ..... 10m  │
│  • Run fault on incline control panel and              │
│    delamination on base web + labels after C/O .... 25m  │
│                                                          │
│  [Full Breakdown →]                          [Collapse ▲]│
└──────────────────────────────────────────────────────────┘
```

### Design Tokens (consistent with Story 4.1)
- **Card Style**: White background, 12px border-radius, subtle shadow
- **Issue Card #1**: Slightly larger, with a subtle gold/highlight border
- **Category Colors**: People `#6C5CE7`, Process `#FECA57`, Plant `#FF6B6B`
- **Bar Chart**: Rounded bar ends (4px radius), 32px bar height
- **Animations**: 200ms ease-out for expand/collapse, 300ms for chart transitions
- **Typography**: 
  - Card title: 14px semibold, uppercase, `#636E72`
  - Line ID: 24px bold, `#2D3436`
  - Minutes: 32px bold, category color
  - Details: 13px regular, `#636E72`

### Interaction Patterns
1. **Hover on issue card**: Subtle elevation increase (shadow deepens)
2. **Click "View Details"**: Smooth expand with slide-down animation
3. **Hover on bar chart segment**: Tooltip with category name and minutes
4. **Click on bar**: Highlights corresponding issue card
5. **Toggle shift view**: Smooth crossfade between data sets (150ms)
6. **Date change**: Loading skeleton while data loads from IndexedDB

---

## Testing Strategy

### Unit Tests
- `getTop3Issues()` returns correct top 3 sorted by downtime
- `determinePrimaryCategory()` correctly identifies dominant category
- `parseIssueDetails()` correctly splits comma-separated issues with durations
- Edge cases: all zeros, single line with issues, ties in downtime

### Visual Tests
- Issue cards render with correct colors and data
- Bar chart renders with correct proportions
- Donut chart segments match data percentages
- Responsive layout works at all breakpoints

### Integration Tests
- Date selector loads data from IndexedDB
- Shift toggle (AM/PM/Daily) updates all components
- Click-through to line detail panel works
- Expand/collapse animations are smooth

---

## Definition of Done
- [ ] All 10 acceptance criteria pass
- [ ] Top 3 issue cards display correctly with real data
- [ ] D3.js bar chart renders with stacked categories
- [ ] Donut chart shows category breakdown
- [ ] Date selector works with IndexedDB stored dates
- [ ] AM/PM/Daily toggle switches data correctly
- [ ] Expand/collapse animations are smooth
- [ ] Responsive layout works on desktop and tablet
- [ ] Click-through to line detail panel works
- [ ] Code reviewed and documented
