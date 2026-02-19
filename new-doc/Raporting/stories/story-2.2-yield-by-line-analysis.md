> **Status:** ✅ IMPLEMENTED
> **Component:** `src/components/yield-by-line/YieldByLinePage.tsx`
> **Features:** Sortable table with W/W comparison, inline D3 sparkline trend charts, Top Gains/Losses panels, global filter bar (Week, Team, Shift, Line Manager, Product Category), factory average footer, copy-to-clipboard, drill-down to SKU view

# Story 2.2: Yield by Line Analysis

## Story Overview
**Epic**: Core Dashboard Views
**Priority**: High
**Estimated Effort**: 2-3 development sessions
**Dependencies**: Story 1.1, Story 1.2, Story 2.1

### User Story
> As a **Supervisor**, I want to **view yield performance broken down by production line** with sorting, filtering, and week-over-week comparison so that I can **identify which lines are performing well and which need attention**.

---

## Acceptance Criteria

### AC 2.2.1: Sortable Data Table
- **Given** line yields data is loaded and aggregated by line
- **When** the Yield by Line view is displayed
- **Then** a sortable table shows columns:
  | Column | Description | Sortable |
  |--------|-------------|----------|
  | Line | Production line ID | ✅ |
  | KG Output | Total KG produced | ✅ |
  | Yield % | Weighted average yield | ✅ |
  | Target % | Target yield for line | ✅ |
  | Variance % | Yield - Target | ✅ |
  | Variance £ | Financial impact | ✅ |
- **And** clicking a column header sorts ascending/descending
- **And** current sort column is indicated with ▲/▼ icon

### AC 2.2.2: Week-over-Week Comparison
- **Given** current and previous week data exists
- **When** comparison columns are displayed
- **Then** additional columns show:
  - Previous Week Yield %
  - W/W Change % (with green/red color coding)
  - W/W Change £
- **And** positive changes show green ↗, negative show red ↘

### AC 2.2.3: Inline Trend Charts
- **Given** a line row is displayed
- **When** the user clicks the expand icon on a row
- **Then** an inline sparkline/mini chart expands below showing:
  - 13-week yield trend for that specific line
  - Target line overlay
  - Hover tooltips with exact values
- **And** the chart is rendered with D3.js as a small area chart (120px height)

### AC 2.2.4: Top 3 Gains/Losses Panels
- **Given** week-over-week data exists
- **When** the panels are displayed
- **Then** Top 3 Gains shows lines with biggest positive W/W change £
- **And** Top 3 Losses shows lines with biggest negative W/W change £
- **And** panels are positioned above the table

### AC 2.2.5: Global Filter Bar
- **Given** the filter bar is displayed
- **When** the user applies filters
- **Then** the following filters are available:
  - **Week**: Week ending date selector
  - **Team**: Supervisor/team filter
  - **Shift**: AM/PM/Both
  - **Line Manager**: Dropdown of valid line managers
  - **Product Category**: Product type filter
- **And** filters apply to all table data and charts
- **And** active filters show as removable chips

### AC 2.2.6: Factory Average Footer
- **Given** the table is displayed
- **When** the footer row is rendered
- **Then** it shows factory-wide averages:
  - Total KG Output (sum)
  - Weighted Average Yield %
  - Average Target %
  - Total Variance £
- **And** the footer row is styled differently (bold, light background)

### AC 2.2.7: Copy to Clipboard
- **Given** the table is displayed
- **When** the user clicks "Copy to Clipboard"
- **Then** the table data is copied in tab-separated format
- **And** the format is compatible with Excel paste
- **And** a success toast confirms the copy

### AC 2.2.8: Drill-Down to SKU View
- **Given** a line row is displayed
- **When** the user clicks the line name or a "Details" button
- **Then** navigation goes to Yield by SKU view (Story 2.3)
- **And** the selected line is pre-filtered
- **And** breadcrumb shows: Overview > Yield by Line > [Line Name]

---

## Technical Implementation Plan

### Component Structure
```
src/components/yield-by-line/
├── YieldByLinePage.tsx           # Main page container
├── YieldByLineTable.tsx          # Sortable data table
├── InlineTrendChart.tsx          # Expandable sparkline
├── FilterBar.tsx                 # Global filter bar (reusable)
├── TopGainsLossesPanels.tsx     # Top 3 panels
└── CopyToClipboard.tsx          # Copy button
```

### Table Implementation
- Use a custom sortable table component (not a heavy library)
- Virtual scrolling if > 50 rows (unlikely for lines, but good practice)
- Sticky header for scrolling
- Row hover highlighting
- Expandable rows for inline charts

### Filter State Management
```typescript
interface FilterState {
  weekEnding: string;
  team: string | null;
  shift: 'AM' | 'PM' | 'both';
  lineManager: string | null;
  productCategory: string | null;
}
```

---

## UX Design Specification

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  📈 Yield by Line                    W/E: [07/02/2026 ▾]       │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [Team ▾] [Shift ▾] [Line Mgr ▾] [Category ▾]       │
│  Active: Team: S01 ✕ | Shift: AM ✕                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─── Top 3 Gains ──────┐  ┌─── Top 3 Losses ─────┐          │
│  │ L08 +£320 | L14 +£180│  │ L17 -£540 | L11 -£280│          │
│  └───────────────────────┘  └───────────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  Line │ KG Out │ Yield% │ Tgt% │ Var% │ Var£ │ PW% │ W/W │ ▼ │
│  ─────┼────────┼────────┼──────┼──────┼──────┼─────┼─────┼───│
│  L08  │ 12,450 │ 94.2%  │ 92%  │+2.2% │+£320 │93.9%│+0.3%│ ▶ │
│  L14  │  8,320 │ 93.8%  │ 92%  │+1.8% │+£180 │92.4%│+1.4%│ ▶ │
│  ...  │        │        │      │      │      │     │     │   │
│  ═════╪════════╪════════╪══════╪══════╪══════╪═════╪═════╪═══│
│  TOTAL│145,000 │ 92.4%  │ 92%  │+0.4% │-£2.3k│92.1%│+0.3%│   │
├─────────────────────────────────────────────────────────────────┤
│  [📋 Copy to Clipboard]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Design Tokens
- Table: White background, `#E9ECEF` row borders, alternating row tint
- Header: `#F8F9FA` background, 12px uppercase, `#636E72`
- Positive values: `#00D2D3`
- Negative values: `#FF6B6B`
- Footer: `#F0F0F5` background, bold text
- Filter chips: `#6C5CE7` background, white text, 20px radius

---

## Definition of Done
- [ ] All 8 acceptance criteria pass
- [ ] Table sorts correctly on all columns
- [ ] W/W comparison shows correct values with color coding
- [ ] Inline trend charts expand/collapse smoothly
- [ ] Filter bar filters data correctly
- [ ] Factory average footer calculates correctly
- [ ] Copy to clipboard works in Excel-compatible format
- [ ] Drill-down navigation to SKU view works
- [ ] Responsive layout works
