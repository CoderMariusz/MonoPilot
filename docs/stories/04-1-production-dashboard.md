# Story 4.1: Production Dashboard

**Epic:** 4 - Production Execution
**Status:** drafted
**Priority:** P0 (MVP)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

---

## Goal

Create a real-time production dashboard showing KPIs, active work orders, and alerts for production managers to monitor operations.

## User Story

**As a** Production Manager
**I want** to see real-time production KPIs (orders completed today, units produced, yield, active WOs, material shortages)
**So that** I can monitor operations and respond quickly to issues

---

## Problem Statement

Production managers currently have no centralized view of:
1. Today's production metrics (orders completed, units, yield)
2. Active work orders and their progress
3. Real-time alerts (shortages, delays, quality holds)
4. Auto-refreshing dashboard for real-time monitoring

---

## Acceptance Criteria

### AC-4.1.1: Dashboard KPI Cards
**Given** the user navigates to `/production/dashboard`
**When** the page loads
**Then** they see KPI cards with:

| KPI | Calculation | Source |
|-----|-------------|--------|
| Orders Today | COUNT(work_orders WHERE completed_at >= TODAY) | work_orders table |
| Units Produced | SUM(production_outputs.quantity WHERE created_at >= TODAY) | production_outputs table |
| Avg Yield | **Weighted**: SUM(actual_output) / SUM(planned_qty) × 100% for WOs completed today | work_orders + production_outputs |
| Active WOs | COUNT(work_orders WHERE status IN ['in_progress', 'paused']) | work_orders table |
| Material Shortages | COUNT(wo_materials WHERE available_qty < required_qty) | calculated from license_plates |

**Success Criteria:**
- ✅ KPI cards display with current values
- ✅ Orders Today shows count (e.g., "12")
- ✅ Units Produced shows sum with default UoM (e.g., "1,250 kg" - use product.default_uom for display)
- ✅ Avg Yield shows percentage with color coding (green/yellow/red)
- ✅ Active WOs shows count with link to active list
- ✅ Material Shortages shows count with warning indicator
- ✅ Color coding: 🟢 Green >=95%, 🟡 Yellow 80-95%, 🔴 Red <80%

---

### AC-4.1.2: Active Work Orders Table
**Given** the user views the dashboard
**When** looking at "Active Work Orders" section
**Then** they see a table with columns:

| Column | Content | Sortable |
|--------|---------|----------|
| WO Number | Clickable link to detail page | ✅ |
| Product | Product name (from products table) | ✅ |
| Quantity | Planned vs actual output | ❌ |
| Status | Current status (in_progress, paused) | ✅ |
| Progress | Visual progress bar: actual_output / planned_qty | ❌ |
| Started | started_at timestamp | ✅ |
| Line | Production line assignment | ✅ |
| Actions | View details, Pause/Resume button | ❌ |

**Success Criteria:**
- ✅ Table sorted by started_at (ascending - oldest first)
- ✅ Max 10 rows, pagination to show more
- ✅ Progress bar colored: green >=100%, yellow 50-99%, gray 0-49%
- ✅ Pause button visible only if status = 'in_progress'
- ✅ Resume button visible only if status = 'paused'
- ✅ Empty state: "No active work orders" if list empty
- ✅ Clicking WO number opens detail page in new tab

---

### AC-4.1.3: Alerts Panel
**Given** the dashboard loads
**When** there are production issues
**Then** "Alerts" section displays:

**Alert Types:**

| Alert Type | Trigger | Icon | Severity |
|-----------|---------|------|----------|
| Material Shortage | wo_materials.available_qty < required_qty | ⚠️ | Warning |
| WO Delayed | WO > scheduled_date + 4 hours | ⏰ | Warning |
| Quality Hold | QA status = 'hold' on input LP | 🔒 | Critical |

**Success Criteria:**
- ✅ Alerts list shows max 5, with "View All" link
- ✅ Each alert shows: type, description, WO number (if applicable), timestamp
- ✅ Alerts sorted by severity (Critical > Warning) then timestamp (newest first)
- ✅ Critical alerts bold/red, warnings yellow
- ✅ Clicking alert navigates to relevant detail (WO, shortage, etc.)
- ✅ Empty state: "No active alerts" if list empty
- ✅ Dismiss button (stores in user preferences for 1 hour)

---

### AC-4.1.4: Auto-Refresh Mechanism
**Given** the user is on dashboard
**When** waiting
**Then** dashboard auto-refreshes every X seconds (configurable, default 30s)

**Success Criteria:**
- ✅ Refresh configured via production_settings.dashboard_refresh_seconds
- ✅ Default: 30 seconds
- ✅ Range: 30-300 seconds (minimum 30s to prevent server overload, configurable by admin)
- ✅ Manual refresh button available (top-right)
- ✅ Visual indicator: "Last updated: X seconds ago"
- ✅ Refresh only if data changed (compare prev vs current)
- ✅ No flash/flicker on refresh (smooth updates)

---

### AC-4.1.5: API Endpoints
**Given** the frontend makes API calls
**When** loading dashboard data
**Then** these endpoints provide data:

```typescript
// GET /api/production/dashboard/kpis
Response: {
  data: {
    orders_today: number,          // 12
    units_produced_today: number,  // 1250
    avg_yield_today: number,       // 87.5 (%) - weighted average: SUM(actual_output)/SUM(planned_qty) × 100
    active_wos: number,            // 5
    material_shortages: number     // 2
  }
}

// GET /api/production/dashboard/active-wos
Response: {
  data: [
    {
      id: uuid,
      wo_number: string,           // "WO-20251127-0001"
      product_name: string,        // "Flour 50kg"
      planned_qty: number,         // 100
      output_qty: number,          // 75
      status: string,              // "in_progress"
      progress_percent: number,    // 75
      started_at: timestamp,
      line_name: string,           // "Line A"
    }
  ]
}

// GET /api/production/dashboard/alerts
Response: {
  data: [
    {
      id: uuid,
      type: string,                // "material_shortage"
      severity: string,            // "warning" | "critical"
      description: string,         // "Material 'Flour' shortage: need 50kg, have 30kg"
      wo_id: uuid,
      created_at: timestamp
    }
  ]
}
```

**Success Criteria:**
- ✅ All endpoints return 200 OK with data
- ✅ Endpoints enforce org_id isolation (403 if wrong org)
- ✅ Endpoints check authentication (401 if not logged in)
- ✅ Endpoints return empty array if no data
- ✅ Response times < 500ms (cached if needed)

---

### AC-4.1.6: Permission & Role-Based Access
**Given** I am a Production Manager, Operator, or Admin
**When** accessing `/production/dashboard`
**Then** I see dashboard (read-only access)

| Role | Access | Notes |
|------|--------|-------|
| Production Manager | ✅ Full access, can pause/resume | Primary user |
| Operator | ✅ Read-only (no pause/resume) | View only |
| Planner | ✅ Read-only (no pause/resume) | For planning reference |
| Admin | ✅ Full access | Can pause/resume |
| Other | ❌ 403 Forbidden | No access |

**Success Criteria:**
- ✅ Role check on all API endpoints
- ✅ Pause/Resume buttons hidden for non-managers
- ✅ 403 error if unauthorized user tries endpoint

---

### AC-4.1.7: Responsive Design
**Given** the dashboard is viewed on different screen sizes
**When** viewing on desktop, tablet, or mobile
**Then** layout adapts appropriately

**Success Criteria:**
- ✅ Desktop (>1200px): 2-column layout (KPIs left, alerts right)
- ✅ Tablet (768-1200px): Stacked layout, full width
- ✅ Mobile (<768px): Single column, KPIs collapse to summary row
- ✅ Table scrollable on mobile (horizontal)
- ✅ All buttons touch-friendly (>44px) on mobile

---

### AC-4.1.8: Empty State & Loading States
**Given** dashboard is loading or has no data
**When** page initializes
**Then** appropriate states shown:

**Success Criteria:**
- ✅ Loading state: Skeleton screens for KPIs, table, alerts
- ✅ Error state: "Failed to load dashboard. Retry?" button
- ✅ Empty KPIs: Show "0" with appropriate message
- ✅ Empty table: "No active work orders"
- ✅ Empty alerts: "No active alerts"

---

## Tasks / Subtasks

### Phase 1: Database & Service Layer

- [ ] Task 1: Review production_settings table for dashboard config (AC: 4.1.4)
  - [ ] Subtask 1.1: Verify production_settings table has dashboard_refresh_seconds column
  - [ ] Subtask 1.2: Verify column has default value 30 and range constraints
  - [ ] Subtask 1.3: Add RLS policy if not present

- [ ] Task 2: Create dashboard service methods (AC: 4.1.1, 4.1.2, 4.1.3, 4.1.5)
  - [ ] Subtask 2.1: Implement getKPIs(orgId) → { orders_today, units_produced, avg_yield, active_wos, shortages }
  - [ ] Subtask 2.2: Implement getActiveWorkOrders(orgId) → WO list with progress
  - [ ] Subtask 2.3: Implement getAlerts(orgId) → alert list with type, severity
  - [ ] Subtask 2.4: Add org_id isolation to all methods
  - [ ] Subtask 2.5: Add proper error handling

### Phase 2: API Routes

- [ ] Task 3: Create API endpoints (AC: 4.1.5)
  - [ ] Subtask 3.1: Create `/api/production/dashboard/route.ts` wrapper
  - [ ] Subtask 3.2: Implement GET /api/production/dashboard/kpis
  - [ ] Subtask 3.3: Implement GET /api/production/dashboard/active-wos
  - [ ] Subtask 3.4: Implement GET /api/production/dashboard/alerts
  - [ ] Subtask 3.5: Add request validation (if needed)
  - [ ] Subtask 3.6: Add error handling + proper HTTP status codes

### Phase 3: Frontend UI

- [ ] Task 4: Create dashboard page (AC: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.7, 4.1.8)
  - [ ] Subtask 4.1: Create `/app/production/dashboard/page.tsx`
  - [ ] Subtask 4.2: Create KPI cards component (4 cards, color-coded)
  - [ ] Subtask 4.3: Create Active WOs table component with sorting
  - [ ] Subtask 4.4: Create Alerts panel component with type/severity icons
  - [ ] Subtask 4.5: Implement auto-refresh logic (useEffect with interval)
  - [ ] Subtask 4.6: Implement manual refresh button
  - [ ] Subtask 4.7: Add loading skeleton screens
  - [ ] Subtask 4.8: Add empty states for all sections
  - [ ] Subtask 4.9: Implement responsive breakpoints (desktop, tablet, mobile)
  - [ ] Subtask 4.10: Add "Last updated" timestamp

- [ ] Task 5: Implement user interactions (AC: 4.1.2, 4.1.3, 4.1.6)
  - [ ] Subtask 5.1: WO number link → detail page
  - [ ] Subtask 5.2: Pause button (POST /api/production/work-orders/:id/pause)
  - [ ] Subtask 5.3: Resume button (POST /api/production/work-orders/:id/resume)
  - [ ] Subtask 5.4: Alert dismiss/action (contextual based on type)
  - [ ] Subtask 5.5: Role-based visibility for pause/resume (managers only)

### Phase 4: Testing

- [ ] Task 6: Unit tests - Service layer (AC: 4.1.1, 4.1.2, 4.1.3)
  - [ ] Subtask 6.1: Test getKPIs() with mock data
  - [ ] Subtask 6.2: Test getActiveWorkOrders() filtering
  - [ ] Subtask 6.3: Test getAlerts() with various alert types
  - [ ] Subtask 6.4: Test org_id isolation
  - [ ] Subtask 6.5: Test error scenarios (no data, DB errors)
  - [ ] Subtask 6.6: Target: 95% coverage

- [ ] Task 7: Integration tests - API endpoints (AC: 4.1.5)
  - [ ] Subtask 7.1: Test GET /api/production/dashboard/kpis (200)
  - [ ] Subtask 7.2: Test GET /api/production/dashboard/active-wos (200, empty array)
  - [ ] Subtask 7.3: Test GET /api/production/dashboard/alerts (200)
  - [ ] Subtask 7.4: Test 401 without auth
  - [ ] Subtask 7.5: Test 403 with wrong org_id
  - [ ] Subtask 7.6: Target: 70% coverage

- [ ] Task 8: E2E tests - Full user journey (AC: All)
  - [ ] Subtask 8.1: Navigate to /production/dashboard
  - [ ] Subtask 8.2: Verify KPI cards load with values
  - [ ] Subtask 8.3: Verify Active WOs table shows data
  - [ ] Subtask 8.4: Verify Alerts panel displays (or empty state)
  - [ ] Subtask 8.5: Click manual refresh button
  - [ ] Subtask 8.6: Wait 30 seconds, verify auto-refresh occurs
  - [ ] Subtask 8.7: Click WO number → detail page opens
  - [ ] Subtask 8.8: Click Pause button (if in_progress)
  - [ ] Subtask 8.9: Verify pause successful
  - [ ] Subtask 8.10: Target: 100% critical path coverage

---

## Dev Notes

### Architecture Patterns

- **Dashboard Pattern**: Real-time KPI aggregation with auto-refresh
  - Reference: Standard dashboard pattern with interval polling or WebSocket
  - Location: `/app/production/dashboard/`

- **Service Layer**: Production-specific calculations (yield, shortages, etc.)
  - Location: `/lib/services/production-dashboard-service.ts` (new)
  - Methods: getKPIs(), getActiveWorkOrders(), getAlerts()

- **API Response Pattern**: Consistent with other endpoints
  - Format: `{ data: {...}, message?: string }`
  - Status codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Server Error

### Learnings from Previous Stories

**From Story 3.22 (Planning Settings) & 3.10 (Work Order CRUD):**
- Production module will have production_settings table for config (like planning_settings)
- Refresh_seconds pattern already established in planning_settings
- WO status tracking patterns established in Story 3.10
- Table UI patterns from Story 3.1-3.8 (PO/TO CRUD)

### Constraints & Decisions

- **Auto-refresh**: Polling via setInterval (not WebSocket) for simplicity
- **Alert prioritization**: Severity-based (Critical > Warning) then timestamp
- **Calculation timing**: Daily KPIs based on timestamps (>=TODAY start)
- **Future enhancements**: Real-time WebSocket, customizable KPIs, export reports

### Testing Strategy

- **Unit Tests** (target 95%):
  - KPI calculations with various data sets
  - Alert filtering by type/severity
  - WO progress percentage calculation
  - org_id isolation

- **Integration Tests** (target 70%):
  - API endpoint response format
  - Data aggregation accuracy
  - Permission checks (401, 403)
  - Database queries performance

- **E2E Tests** (target 100% critical paths):
  - Dashboard page load
  - Auto-refresh behavior
  - User interactions (pause, click, dismiss)
  - Role-based visibility

---

## Dev Agent Record

### Context Reference

Context file: [04-1-production-dashboard.context.xml](04-1-production-dashboard.context.xml)

### Agent Model Used

Claude Haiku 4.5 (2025-11-27)

### Debug Log References

*Will be populated during implementation*

### Completion Notes List

*Will be populated after tasks are completed*

### File List

*Will be populated as files are created/modified*

---

## Status

- **Created:** 2025-11-27
- **Current Status:** drafted
- **Target Status:** done (after all ACs met + tests pass)

---

## Change Log

- 2025-11-27: Story created by Claude Code (create-story workflow)
  - All acceptance criteria derived from Epic 4 requirements
  - Tasks mapped to ACs with clear subtasks
  - Prerequisites and dependencies documented
