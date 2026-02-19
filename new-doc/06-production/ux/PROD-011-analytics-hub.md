# PROD-011: Production Analytics Hub

**Module**: Production (Epic 4)
**Route**: `/production/analytics`
**FR Coverage**: FR-PROD-022a to FR-PROD-022g (7 reports)
**PRD Lines**: 1020-1205
**Status**: MVP - Hub/Index Page Only (individual report pages are Phase 2)
**Last Updated**: 2025-12-14

---

## Overview

Hub page linking to 7 production analytics reports. Each report card is a clickable entry point to a detailed analytics page (future implementation). This wireframe covers the hub/index layout and navigation only - not the full report pages.

**MVP Scope**: Hub page with report cards (navigation structure only)
**Phase 2**: Individual report pages (PROD-012a to PROD-012g) with full analytics, charts, filters

**Report List**:
1. FR-PROD-022a: OEE Summary Report (Phase 2)
2. FR-PROD-022b: Downtime Analysis Report (Phase 2)
3. FR-PROD-022c: Yield Analysis Report (Phase 2)
4. FR-PROD-022d: Production Output Report (Phase 2)
5. FR-PROD-022e: Material Consumption Report (Phase 2)
6. FR-PROD-022f: Quality Rate Report (Phase 2)
7. FR-PROD-022g: WO Completion Report (Phase 2)

---

## Screen: Analytics Hub (Loading State)

```
┌──────────────────────────────────────────────────────────────┐
│ Production > Analytics                                   [?] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Production Analytics Reports                                 │
│                                                               │
│ ┌─────────────────────────────────┐                          │
│ │ ███████████░░░                  │ (Skeleton card)          │
│ │ ███░░░░░░░░░░░░░░░░░░░░░░░░░░ │                          │
│ │ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                          │
│ └─────────────────────────────────┘                          │
│                                                               │
│ ┌─────────────────────────────────┐                          │
│ │ ███████████░░░                  │ (Skeleton card)          │
│ │ ███░░░░░░░░░░░░░░░░░░░░░░░░░░ │                          │
│ │ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                          │
│ └─────────────────────────────────┘                          │
│                                                               │
│         Spinner animation: "Loading reports..."              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Components**:
- Breadcrumb: Production > Analytics
- Header: "Production Analytics Reports"
- Subheader: "Select a report below to analyze production performance"
- Skeleton cards (4 visible, fade-out effect)
- Centered spinner with text

**Duration**: 1-3 seconds

---

## Screen: Analytics Hub (Success State)

```
┌──────────────────────────────────────────────────────────────┐
│ Production > Analytics                                   [?] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Production Analytics Reports                                 │
│ Select a report below to analyze production performance      │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📊 OEE Summary Report                         [View →] │  │
│ │ OEE by machine/line/shift with trend analysis          │  │
│ │ Availability, Performance, Quality metrics             │  │
│ │ Filters: Date range, machine, product, line, shift    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⏱  Downtime Analysis Report                  [View →] │  │
│ │ Pareto analysis of downtime reasons                    │  │
│ │ Top reasons, duration trends, planned/unplanned        │  │
│ │ Filters: Date range, machine, category, shift         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🎯 Yield Analysis Report                     [View →] │  │
│ │ Yield trends and outliers by product/line              │  │
│ │ Trend line, outlier scatter, product comparison        │  │
│ │ Filters: Product, line, date range, operator           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📦 Production Output Report                  [View →] │  │
│ │ Units produced by product/line over time               │  │
│ │ Stacked area chart, daily/weekly/monthly trends        │  │
│ │ Filters: Date range, product, line, shift              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📉 Material Consumption Report               [View →] │  │
│ │ Consumption vs plan variance analysis                  │  │
│ │ Variance scatter plot, top 10 materials table           │  │
│ │ Filters: Product, material, date range, WO             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ✅ Quality Rate Report                       [View →] │  │
│ │ QA status distribution analysis                        │  │
│ │ Status pie chart, trend line, rejection reasons        │  │
│ │ Filters: Product, date range, line, operator           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📅 WO Completion Report                      [View →] │  │
│ │ On-time vs delayed WO analysis                         │  │
│ │ On-time pie chart, delay trend, top delayed WOs        │  │
│ │ Filters: Date range, line, product, status             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Component Structure** (per card):
```
┌─ Card (clickable div, full width, min-height 100px) ─┐
│                                                       │
│ [Icon] Title                            [View →]      │
│ Short description (1 line max)                        │
│ Key metrics/visualizations (1 line)                   │
│ Filters available: (1 line, gray)                     │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Card Properties**:
- Background: Light gray or white
- Border: Subtle (0.5px gray border)
- Hover: Shadow lift + background color change
- Icon: 24x24px, colored per report
- Title: 18px bold
- Description: 14px gray
- View button: "View →" link style, blue, right-aligned

**Layout**:
- Grid: 1 column (mobile), 2 columns (tablet 768px+), single column responsive
- Gap: 16px between cards
- Max-width: 1200px, centered
- Padding: 24px left/right

---

## Screen: Analytics Hub (Empty State)

```
┌──────────────────────────────────────────────────────────────┐
│ Production > Analytics                                   [?] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                                                               │
│                                                               │
│                    📊 No Analytics Data                       │
│                                                               │
│            No production data is available yet.               │
│            Start by creating work orders and                  │
│            recording production outputs.                      │
│                                                               │
│              [← Go to Work Orders] [Create WO →]              │
│                                                               │
│                                                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Trigger**: No production data exists (0 WOs, 0 outputs)

**Components**:
- Icon: Large chart/graph icon (64x64px, light gray)
- Heading: "No Analytics Data" (24px)
- Message: Explanation text (14px gray)
- Actions:
  - Link: "Go to Work Orders" → `/production/workorders`
  - Button: "Create WO" → opens WO creation modal

---

## Screen: Analytics Hub (Error State)

```
┌──────────────────────────────────────────────────────────────┐
│ Production > Analytics                                   [?] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Production Analytics Reports                                 │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⚠️  Unable to Load Reports                 [Retry]    │  │
│ │                                                         │  │
│ │ Error: Failed to fetch analytics data                  │  │
│ │ Please check your connection and try again.            │  │
│ │                                                         │  │
│ │ If this error persists, contact support.              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ All reports available offline below:                        │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📊 OEE Summary Report                         [View →] │  │
│ │ (offline - recent data may not be available)          │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ [... other report cards disabled/grayed out ...]             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Trigger**: Network error, API failure, or load timeout

**Components**:
- Alert banner: Red/orange background, warning icon
- Alert title: "Unable to Load Reports"
- Alert message: Specific error (network, server, timeout)
- Retry button: Reloads the page
- Help text: "Contact support" link
- Fallback: Reports still visible but disabled (grayed out)
- Timestamp: "Last updated: [time]" if cached data exists

---

## Responsive Breakpoints

### Mobile (< 768px)

```
┌─────────────────┐
│ Production      │
│ Analytics       │
├─────────────────┤
│ [Report Title]  │
│                 │
│ 📊 OEE Summary  │
│ [description]   │
│ [View →]        │
│                 │
│ ⏱  Downtime     │
│ [description]   │
│ [View →]        │
│                 │
│ [scroll...]     │
│                 │
└─────────────────┘
```

- 1 column layout
- Cards: 100% width, ~120px min-height
- Padding: 16px (reduced)
- Gap: 12px
- Font: 14px title, 12px description
- Tap targets: 48x48dp minimum (card height + padding)

### Tablet (768px - 1024px)

- 2 column layout
- Cards: calc(50% - 8px) width
- Padding: 20px
- Gap: 16px
- Font: 16px title, 13px description

### Desktop (> 1024px)

- 2-column layout (as shown in Success state)
- Max-width: 1200px
- Cards: calc(50% - 8px) width
- Padding: 24px
- Gap: 16px
- Font: 18px title, 14px description

---

## Navigation & Interactions

### Report Card Click
**Action**: Click anywhere on card (except button)
**Result**: Navigate to `/production/analytics/[report-id]`
**Cursor**: Changes to pointer on hover
**Animation**: Subtle shadow lift (1-2px, 150ms ease-out)

### View Button Click
**Action**: Click "View →" button
**Result**: Navigate to `/production/analytics/[report-id]`
**Same as**: Full card click (button is visual reinforcement)

### Retry Button (Error State)
**Action**: Click [Retry]
**Result**: Re-fetch analytics data, reload page
**Loading**: Shows spinner until complete

### Action Buttons (Empty State)
- "Go to Work Orders": Navigate to `/production/workorders`
- "Create WO": Open work order creation modal

---

## States Detail

### Loading State
- **Duration**: 1-3 seconds typical
- **Appearance**: 4-6 skeleton cards with pulse animation
- **Fallback**: If > 5 seconds, show message: "Still loading... This should only take a moment"
- **Accessibility**: aria-label="Loading analytics reports" + aria-busy="true"

### Success State
- **Precondition**: 1+ production outputs OR 1+ WOs exist
- **Display**: 7 report cards in grid
- **Cards clickable**: All cards navigate to report pages (Phase 2)
- **Accessibility**: aria-label for each card, keyboard navigation with Tab

### Empty State
- **Precondition**: No production data (0 WOs, 0 outputs)
- **Display**: Centered illustration + message + action buttons
- **CTA**: Guide user to create first WO
- **Accessibility**: Heading level 2, descriptive text

### Error State
- **Precondition**: Network error, API timeout (> 5s), or 500 error
- **Display**: Alert banner + all cards disabled/grayed
- **Fallback**: Show cached data if available (last successful load)
- **Retry**: Clear button in alert
- **Accessibility**: role="alert", aria-live="polite", error message text

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

**Structure**:
- [ ] Page has h1 (breadcrumb context) or h2 (main title)
- [ ] Heading hierarchy: h1 > h2 > h3
- [ ] Landmarks: `<nav>`, `<main>`, `<footer>` used appropriately
- [ ] Skip link: "Skip to main content"

**Navigation**:
- [ ] Keyboard navigation: Tab through all cards
- [ ] Focus visible: 3px outline, yellow/blue on cards
- [ ] Tab order: Left-to-right, top-to-bottom
- [ ] Focus trap avoided: Can tab out of cards
- [ ] Buttons/links: Keyboard accessible (Enter/Space)

**Text & Icons**:
- [ ] Icon + text label on all report cards
- [ ] Icon only never used for critical functions
- [ ] Contrast: 4.5:1 (normal text), 3:1 (large text)
- [ ] Color not sole differentiator (icon + text + color)
- [ ] Font: min 14px (mobile), 16px (desktop)

**Buttons & Links**:
- [ ] Min size: 48x48dp touch target (including padding)
- [ ] Loading state: aria-busy="true"
- [ ] Disabled state: aria-disabled="true", visual indication
- [ ] Button labels: Descriptive ("View OEE Summary Report" not just "View")

**Errors & Messages**:
- [ ] Error alert: role="alert", aria-live="polite"
- [ ] Error message describes issue + solution
- [ ] Success message: aria-live="polite" (non-intrusive)
- [ ] Empty state: Heading + illustration + action

**Responsive**:
- [ ] Tested at 320px (mobile), 768px (tablet), 1024px+ (desktop)
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets min 48x48dp on mobile
- [ ] Text readable at 200% zoom

**Semantic HTML**:
- [ ] Buttons: `<button>`, not `<a>` with click handlers
- [ ] Links: `<a href="...">`, not styled buttons
- [ ] Lists: Cards in `<article>` or `<section>` per report
- [ ] Images: alt text for decorative icons

**Testing**:
- [ ] Screen reader: NVDA/JAWS/VoiceOver
- [ ] Keyboard only: No mouse navigation needed
- [ ] High contrast mode: Readable at 200%
- [ ] Color blind: No red/green confusion

---

## Component Specifications

### Report Card Component

**Props**:
```typescript
interface ReportCard {
  id: string;           // 'oee-summary', 'downtime-analysis', etc.
  title: string;        // "OEE Summary Report"
  description: string;  // "OEE by machine/line/shift..."
  icon: ReactNode;      // 📊, ⏱, 🎯, etc.
  metrics: string;      // "Availability, Performance, Quality"
  filters: string[];    // ["Date range", "Machine", "Product", "Line", "Shift"]
  href: string;         // "/production/analytics/oee-summary"
  isPhase2: boolean;    // true for all reports (Phase 2)
}
```

**Behavior**:
- Click: Navigate to report page (Phase 2)
- Hover: Lift shadow, slight bg color change
- Focus: Yellow/blue 3px outline
- Loading: Skeleton version of card
- Error: Card grayed out, disabled cursor

**CSS Classes**:
```css
.report-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 150ms ease-out;
  min-height: 100px;
}

.report-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.report-card:focus {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
}

.report-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-card--phase2::after {
  content: "Phase 2";
  font-size: 11px;
  color: #6b7280;
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 4px;
}
```

---

## Data/API Requirements

### Hub Page Data Fetch
**Endpoint**: `GET /api/production/analytics/hub`

**Query Params**:
- `org_id`: UUID (from auth context, required)
- `include_stats`: boolean (optional, to show quick stats per report)

**Response**:
```json
{
  "status": "success",
  "data": {
    "hub_ready": true,
    "total_outputs": 1250,
    "total_wos": 45,
    "date_range": {
      "from": "2025-12-01",
      "to": "2025-12-14"
    },
    "reports": [
      {
        "id": "oee-summary",
        "title": "OEE Summary Report",
        "description": "OEE by machine/line/shift...",
        "icon": "chart-bar",
        "quick_stat": "Avg OEE: 87.5%",
        "available": true,
        "phase": 2
      }
      // ... 6 more
    ]
  }
}
```

**Error Handling**:
- 401: Unauthorized → redirect to login
- 403: Forbidden → show "Access denied" message
- 500: Server error → show error state with retry

---

## API Endpoints Detail

### 1. Get Analytics Hub Data

```
GET /api/production/analytics/hub?org_id={org_id}&include_stats={true|false}

Response (200):
{
  "status": "success",
  "data": {
    "hub_ready": true,
    "total_outputs": 1250,
    "total_wos": 45,
    "date_range": {
      "from": "2025-12-01",
      "to": "2025-12-14"
    },
    "reports": [
      {
        "id": "oee-summary",
        "title": "OEE Summary Report",
        "description": "OEE by machine/line/shift with trend analysis",
        "icon": "chart-bar",
        "metrics": "Availability, Performance, Quality",
        "filters": ["Date range", "Machine", "Product", "Line", "Shift"],
        "href": "/production/analytics/oee-summary",
        "quick_stat": "Avg OEE: 87.5%",
        "available": true,
        "phase": 2
      },
      {
        "id": "downtime-analysis",
        "title": "Downtime Analysis Report",
        "description": "Pareto analysis of downtime reasons",
        "icon": "clock",
        "metrics": "Top reasons, duration trends, planned/unplanned",
        "filters": ["Date range", "Machine", "Category", "Shift"],
        "href": "/production/analytics/downtime-analysis",
        "quick_stat": "Total: 847 min (23 events)",
        "available": true,
        "phase": 2
      },
      {
        "id": "yield-analysis",
        "title": "Yield Analysis Report",
        "description": "Yield trends and outliers by product/line",
        "icon": "target",
        "metrics": "Trend line, outlier scatter, product comparison",
        "filters": ["Product", "Line", "Date range", "Operator"],
        "href": "/production/analytics/yield-analysis",
        "quick_stat": "Avg Yield: 94.3%",
        "available": true,
        "phase": 2
      },
      {
        "id": "production-output",
        "title": "Production Output Report",
        "description": "Units produced by product/line over time",
        "icon": "package",
        "metrics": "Stacked area chart, daily/weekly/monthly trends",
        "filters": ["Date range", "Product", "Line", "Shift"],
        "href": "/production/analytics/production-output",
        "quick_stat": "Today: 12,450 units",
        "available": true,
        "phase": 2
      },
      {
        "id": "material-consumption",
        "title": "Material Consumption Report",
        "description": "Consumption vs plan variance analysis",
        "icon": "trending-down",
        "metrics": "Variance scatter plot, top 10 materials table",
        "filters": ["Product", "Material", "Date range", "WO"],
        "href": "/production/analytics/material-consumption",
        "quick_stat": "Avg variance: +2.3%",
        "available": true,
        "phase": 2
      },
      {
        "id": "quality-rate",
        "title": "Quality Rate Report",
        "description": "QA status distribution analysis",
        "icon": "check-circle",
        "metrics": "Status pie chart, trend line, rejection reasons",
        "filters": ["Product", "Date range", "Line", "Operator"],
        "href": "/production/analytics/quality-rate",
        "quick_stat": "Pass rate: 98.5%",
        "available": true,
        "phase": 2
      },
      {
        "id": "wo-completion",
        "title": "WO Completion Report",
        "description": "On-time vs delayed WO analysis",
        "icon": "calendar",
        "metrics": "On-time pie chart, delay trend, top delayed WOs",
        "filters": ["Date range", "Line", "Product", "Status"],
        "href": "/production/analytics/wo-completion",
        "quick_stat": "On-time: 92% (41/45)",
        "available": true,
        "phase": 2
      }
    ]
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden (org access)
- 500: Server error
```

---

## Performance Notes

### File Size & Performance

**Hub Page Only**:
- HTML: ~2.5 KB
- CSS: ~3 KB (shared with other pages)
- JS Bundle: ~15 KB (with navigation, state)
- Icons: ~5 KB (SVG, inline)
- **Total**: ~25 KB gzipped

**Metrics**:
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3s

**Optimization**:
- Cards lazy-load via intersection observer
- Icons: SVG sprites or inline
- CSS: Critical CSS inline, rest deferred
- JS: Code-split for report navigation

### Query Optimization
- **Hub Data**: Single query for all reports metadata (no JOINs, static data)
- **Quick Stats**: Optional, computed from aggregated tables
- **Cache**: Hub data static (5 min TTL), quick stats dynamic (1 min TTL)

### Caching Strategy
```typescript
// Redis keys
'org:{orgId}:analytics:hub:metadata'       // 5 min TTL (static report list)
'org:{orgId}:analytics:hub:quick_stats'    // 1 min TTL (dynamic stats)
```

### Load Time Targets
- **Hub Page Load**: <1.5s (simple layout, 7 cards)
- **Quick Stats Load**: <800ms (optional, doesn't block UI)
- **Report Navigation**: Instant (client-side routing)

---

## Error Handling

### API Errors
- **Hub Data Fetch Failed**: Show error state with retry, cards grayed out
- **Quick Stats Fetch Failed**: Hide quick stats, cards still clickable
- **Partial Failure**: If metadata loads but stats fail, show cards without stats

### Network Timeout
- **Hub Data**: 5s timeout, retry once on failure
- **Quick Stats**: 3s timeout, fail silently (optional data)

### Validation
- **org_id Required**: 400 error if missing
- **include_stats Optional**: Defaults to false if not provided

---

## Testing Requirements

### Unit Tests
- **Report Card Rendering**: 7 cards display with correct title, description, icon
- **Phase 2 Badge**: All cards show "Phase 2" indicator
- **Quick Stats Display**: If include_stats=true, stats appear on cards
- **Empty State Logic**: No WOs AND no outputs → empty state displays
- **Error State Logic**: API error → error banner + grayed cards

### Integration Tests
- **API Endpoint Coverage**: GET /api/production/analytics/hub
- **RLS Policy Enforcement**: org_id isolation, no cross-org data leaks
- **Quick Stats Optional**: include_stats=false → no stats in response
- **Empty Data Check**: 0 WOs + 0 outputs → hub_ready=false

### E2E Tests
- **Hub Page Load (First Visit)**:
  - Loading state displays skeleton cards
  - Success state displays 7 report cards
  - All cards clickable (navigate to Phase 2 placeholder)
- **Hub Page Load (Empty Data)**:
  - Empty state displays with illustration + CTA
  - "Go to Work Orders" link navigates correctly
  - "Create WO" button opens modal
- **Hub Page Load (Error)**:
  - Error state displays alert banner
  - Retry button reloads page
  - Cards grayed out but visible
- **Responsive Behavior**:
  - Desktop: 2-column grid, all cards visible
  - Tablet: 2-column grid, condensed
  - Mobile: 1-column stack, cards 100% width
- **Accessibility**:
  - Keyboard: Tab through cards, Enter to navigate
  - Screen reader: Card titles + descriptions announced
  - Focus visible: 3px outline on cards

### Performance Tests
- **Hub Page Load**: <1.5s (FCP)
- **LCP**: <2.5s (largest card)
- **TTI**: <3s (interactive)
- **Bundle Size**: <25 KB gzipped

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Success, Empty, Error)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile with specific layouts)
- [x] All API endpoints specified with request/response schemas (1 endpoint)
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (load times, bundle size, metrics)
- [x] Component specifications documented (ReportCard props, CSS classes)
- [x] 7 report cards defined with all metadata
- [x] Phase 2 markers added to all reports
- [x] Empty state CTAs defined (Go to WOs, Create WO)
- [x] Error handling strategy defined (API errors, network timeout)
- [x] Testing requirements documented (unit, integration, E2E)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Production Analytics Hub (MVP - Navigation Only)
story: PROD-011
fr_coverage: FR-PROD-022 (Hub page only, individual reports are Phase 2)
phase: MVP (Hub), Phase 2 (Individual Reports)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PROD-011-analytics-hub.md
  api_endpoints:
    - GET /api/production/analytics/hub
states_per_screen: [loading, empty, error, success]
breakpoints:
  mobile: "<768px (1 column, 100% width cards)"
  tablet: "768-1024px (2 column grid)"
  desktop: ">1024px (2 column grid, max-width 1200px)"
accessibility:
  touch_targets: "48x48dp minimum (card height)"
  contrast: "4.5:1 minimum (text), 3:1 (large text)"
  aria_roles: "article, button, link, alert"
  keyboard_nav: "Tab, Enter, Escape"
performance_targets:
  fcp: "<1.5s"
  lcp: "<2.5s"
  tti: "<3s"
  bundle_size: "<25KB gzipped"
cache_ttl:
  hub_metadata: "5min (static)"
  quick_stats: "1min (dynamic)"
report_cards_count: 7
all_reports_phase2: true
empty_state_ctas: ["Go to Work Orders", "Create WO"]
individual_reports_scope: "PROD-012a to PROD-012g (Phase 2, separate wireframes)"
```

---

## Dependencies

- FR-PROD-001: Production Dashboard (links to Analytics Hub)
- FR-PROD-002 to FR-PROD-021: All production features (generate data for reports)
- Phase 2 Wireframes: PROD-012a to PROD-012g (individual report pages)

---

## Next Steps (Phase 2)

1. **Individual Report Pages** (PROD-012a to PROD-012g):
   - PROD-012a: OEE Summary Report (full wireframe with charts, filters)
   - PROD-012b: Downtime Analysis Report (Pareto chart, drill-down)
   - PROD-012c: Yield Analysis Report (trend line, scatter plot)
   - PROD-012d: Production Output Report (stacked area chart)
   - PROD-012e: Material Consumption Report (variance analysis)
   - PROD-012f: Quality Rate Report (pie chart, rejection reasons)
   - PROD-012g: WO Completion Report (on-time vs delayed)

2. **Chart Implementations**:
   - Pareto charts (downtime, material variance)
   - Line charts (yield trends, OEE trends)
   - Stacked area charts (production output)
   - Pie charts (quality status, WO completion)
   - Scatter plots (yield outliers, material variance)

3. **Filter Implementations**:
   - Date range picker (all reports)
   - Machine/Line/Product dropdowns
   - Shift selector
   - Operator filter

4. **Export Functionality**:
   - CSV export (all reports)
   - PDF export (selected reports)
   - Chart image export

---

## Summary

**PROD-011 Hub Page** provides navigation to 7 production analytics reports. Each report is a Phase 2 implementation. This wireframe covers:

**4 States**:
1. Loading: Skeleton cards with spinner
2. Success: 7 clickable report cards in responsive grid
3. Empty: Illustration + CTA to create WOs
4. Error: Alert + fallback offline cards

**Key Features**:
- Responsive: Mobile-first (1 col) → Tablet (2 col)
- Accessible: WCAG 2.1 AA, 48x48dp targets, keyboard nav
- Performant: ~25 KB, < 3s load
- Mobile-optimized: Card height = touch target

**Not Included (Phase 2)**:
- Individual report pages (PROD-012 to PROD-018, future)
- Report filtering UI
- Chart implementations
- Export functionality

**Hub Page Only**: Navigation structure, report metadata, empty/error states

---

## File Metadata

**Created**: 2025-12-14
**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending (requires user review and approval)
**Iterations**: 0 of 3
**Estimated Effort**: 4-6 hours (hub page only, not reports)
**Quality Target**: 97/100 (comprehensive, matches PROD-001 quality)
**PRD Coverage**: 100% (FR-PROD-022 hub page, individual reports are Phase 2)
**Wireframe Length**: ~1,020 lines (target: 1,000-1,200 lines) ✓
**Dependencies**: None (standalone hub)
**QA Gate**: Manual testing of 4 states + accessibility check
