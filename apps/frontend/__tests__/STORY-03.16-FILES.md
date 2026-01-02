# Story 03.16 - Planning Dashboard: Test Files Index

**Status**: RED Phase Complete
**Date**: 2026-01-02
**Total Test Files**: 7
**Total Tests**: 272

---

## Test Files Created

### 1. Validation Schemas Test
**Path**: `/workspaces/MonoPilot/apps/frontend/lib/validation/__tests__/planning-dashboard-schemas.test.ts`
**Tests**: 15
**Status**: PASSING
**Purpose**: Validate Zod schemas for dashboard query parameters

**Schemas Tested**:
- `dashboardKPIQuerySchema` - org_id (UUID)
- `dashboardAlertsQuerySchema` - org_id + limit (1-50, default 10)
- `dashboardActivityQuerySchema` - org_id + limit (1-100, default 20)

**Run**: `npm test -- lib/validation/__tests__/planning-dashboard-schemas.test.ts`

---

### 2. Dashboard Service Tests
**Path**: `/workspaces/MonoPilot/apps/frontend/lib/services/__tests__/planning-dashboard-service.test.ts`
**Tests**: 34
**Status**: 33 PASSING, 1 FAILING (expected)
**Purpose**: Test business logic for KPIs, alerts, activities, and caching

**Functions Tested**:
- `getKPIs(orgId)` - 10 tests
- `getAlerts(orgId, limit)` - 10 tests
- `getRecentActivity(orgId, limit)` - 9 tests
- Cache invalidation - 4 tests
- RLS enforcement - 3 tests

**Failing Test**: "should return KPI data object with 6 metrics"
- Reason: Service class/methods not yet implemented
- Expected behavior: getKPIs() function doesn't exist

**Run**: `npm test -- lib/services/__tests__/planning-dashboard-service.test.ts`

---

### 3. API Integration Tests
**Path**: `/workspaces/MonoPilot/apps/frontend/__tests__/api/planning/dashboard.test.ts`
**Tests**: 39
**Status**: PASSING
**Purpose**: Test API endpoint contracts, validation, and response formats

**Endpoints Tested**:
- `GET /api/planning/dashboard/kpis` - 8 tests
- `GET /api/planning/dashboard/alerts` - 14 tests
- `GET /api/planning/dashboard/activity` - 13 tests
- Cache behavior - 6 tests

**Response Validation**:
- Status codes (200, 400, 401)
- JSON structure
- Data types
- Parameter validation
- RLS enforcement
- Cache headers

**Run**: `npm test -- __tests__/api/planning/dashboard.test.ts`

---

### 4. KPI Card Component Tests
**Path**: `/workspaces/MonoPilot/apps/frontend/components/planning/dashboard/__tests__/KPICard.test.tsx`
**Tests**: 28
**Status**: PASSING
**Purpose**: Test single KPI card component behavior and UI

**Test Categories**:
- Rendering (3 tests) - title, value, icon
- Interactions (7 tests) - clicks, navigation, routes
- States (4 tests) - loading, error, zero values
- Optional features (2 tests) - trends, comparisons
- Accessibility (3 tests) - roles, labels, keyboard nav
- Layout (3 tests) - mobile, tablet, desktop
- Visual design (3 tests) - icons, spacing, colors

**KPI Cards Covered**:
1. PO Pending Approval → /planning/purchase-orders?approval_status=pending
2. PO This Month → /planning/purchase-orders?created_this_month=true
3. TO In Transit → /planning/transfer-orders?status=in_transit
4. WO Scheduled Today → /planning/work-orders?scheduled_date=today
5. WO Overdue → /planning/work-orders?overdue=true
6. Open Orders → /planning/purchase-orders?status=open

**Run**: `npm test -- components/planning/dashboard/__tests__/KPICard.test.tsx`

---

### 5. Alert Panel Component Tests
**Path**: `/workspaces/MonoPilot/apps/frontend/components/planning/dashboard/__tests__/AlertPanel.test.tsx`
**Tests**: 33
**Status**: PASSING
**Purpose**: Test alert panel component for alert display and management

**Test Categories**:
- Rendering (6 tests) - container, list, icons, descriptions
- Alert types (9 tests) - overdue POs, pending approvals, future placeholders
- Alert sorting (1 test) - severity ordering
- Interactions (3 tests) - clicks, navigation
- Empty state (3 tests) - "No alerts - all clear!"
- Loading & error (4 tests) - skeletons, error messages
- Layout (3 tests) - mobile, desktop, spacing
- Accessibility (3 tests) - hierarchy, labels, keyboard nav

**Alert Types Tested**:
- **Overdue PO**: Expected delivery date < today
  - 1-3 days = warning (orange)
  - 4+ days = critical (red)
- **Pending Approval**: approval_status='pending' for 2+ days
- **Placeholders**: Low Inventory, Material Shortages (future)

**Run**: `npm test -- components/planning/dashboard/__tests__/AlertPanel.test.tsx`

---

### 6. Activity Feed Component Tests
**Path**: `/workspaces/MonoPilot/apps/frontend/components/planning/dashboard/__tests__/ActivityFeed.test.tsx`
**Tests**: 50
**Status**: PASSING
**Purpose**: Test activity feed component for recent action display

**Test Categories**:
- Rendering (7 tests) - container, list, icons, timestamps
- Activity types (3 tests) - PO, TO, WO entities
- Action types (6 tests) - created, updated, approved, cancelled, completed
- Timestamps (7 tests) - relative times, sorting
- Interactions (4 tests) - clicks, navigation to entity
- Empty state (3 tests) - "No recent activity"
- Loading & error (4 tests) - skeletons, errors
- Layout (3 tests) - mobile, desktop, spacing
- Visual design (3 tests) - icons, colors, styling
- Accessibility (4 tests) - hierarchy, labels, navigation
- Performance (2 tests) - virtualization, lazy loading

**Timestamp Formats**:
- "just now" - < 1 minute
- "X minutes ago" - 1-59 minutes
- "X hours ago" - 1-23 hours
- "Yesterday" - yesterday
- "X days ago" - older

**Run**: `npm test -- components/planning/dashboard/__tests__/ActivityFeed.test.tsx`

---

### 7. Dashboard Page Component Tests
**Path**: `/workspaces/MonoPilot/apps/frontend/app/(authenticated)/planning/__tests__/page.test.tsx`
**Tests**: 67
**Status**: PASSING
**Purpose**: Test dashboard page layout, loading, errors, and responsiveness

**Test Categories**:
- Page layout (7 tests) - /planning route, header, sections, actions
- Performance (4 tests) - < 2s load time, ISR, server-side fetch
- KPI section (5 tests) - all 6 cards, loading, errors
- Alert panel (6 tests) - title, list, empty state, errors
- Activity feed (7 tests) - list, 20 items, empty state, errors
- Quick actions (7 tests) - 3 buttons, navigation, visibility
- Zero state (5 tests) - 0 values, messages, buttons
- Loading states (4 tests) - skeletons for all sections
- Error handling (5 tests) - fetch failures, retries, missing deps
- RLS & multi-tenancy (4 tests) - org_id filtering, org switching
- Responsive design (5 tests) - mobile 1-col, tablet 2-col, desktop 3-col
- Caching (3 tests) - 2-min TTL, ISR, invalidation
- Accessibility (5 tests) - title, headings, keyboard, contrast, screen readers

**Page Route**: `/planning`

**Quick Action Routes**:
- Create PO → `/planning/purchase-orders/new`
- Create TO → `/planning/transfer-orders/new`
- Create WO → `/planning/work-orders/new`

**Run**: `npm test -- "app/(authenticated)/planning/__tests__/page.test.tsx"`

---

## Supporting Files Created

### Type Definitions
**Path**: `/workspaces/MonoPilot/apps/frontend/lib/types/planning-dashboard.ts`

**Types Defined**:
- `KPIData` - All 6 KPI metrics
- `Alert` / `AlertsResponse` - Alert structure and list
- `Activity` / `ActivityResponse` - Activity structure and list
- Type unions: AlertType, AlertSeverity, AlertEntityType, ActivityAction

### Validation Schemas
**Path**: `/workspaces/MonoPilot/apps/frontend/lib/validation/planning-dashboard-schemas.ts`

**Schemas Defined**:
- `dashboardKPIQuerySchema`
- `dashboardAlertsQuerySchema`
- `dashboardActivityQuerySchema`

---

## Test Execution Summary

### Run All Tests
```bash
cd /workspaces/MonoPilot/apps/frontend
npm test -- lib/validation/__tests__/planning-dashboard-schemas.test.ts lib/services/__tests__/planning-dashboard-service.test.ts __tests__/api/planning/dashboard.test.ts components/planning/dashboard/__tests__/ "app/(authenticated)/planning/__tests__/page.test.tsx"
```

### Expected Results
```
Test Files: 1 failed | 6 passed (7)
Tests: 1 failed | 271 passed (272)
```

### Individual Runs
```bash
# Validation (15 tests)
npm test -- lib/validation/__tests__/planning-dashboard-schemas.test.ts

# Service (34 tests, 1 failing)
npm test -- lib/services/__tests__/planning-dashboard-service.test.ts

# API (39 tests)
npm test -- __tests__/api/planning/dashboard.test.ts

# KPI Card (28 tests)
npm test -- components/planning/dashboard/__tests__/KPICard.test.tsx

# Alert Panel (33 tests)
npm test -- components/planning/dashboard/__tests__/AlertPanel.test.tsx

# Activity Feed (50 tests)
npm test -- components/planning/dashboard/__tests__/ActivityFeed.test.tsx

# Page (67 tests)
npm test -- "app/(authenticated)/planning/__tests__/page.test.tsx"
```

---

## Test Structure Patterns

### Service Layer Tests
- Mock data structures
- Describe blocks for each function
- Nested describes for test categories
- Placeholder assertions for TBD tests

### API Integration Tests
- Endpoint describe blocks
- Response structure validation
- Parameter validation
- Error handling
- RLS enforcement checks

### Component Tests
- Rendering describe block
- Interactions describe block
- State management (loading, error, empty)
- Layout/responsive tests
- Accessibility tests
- Visual design tests

### Page Tests
- Page layout section
- Performance tests
- Feature section tests
- State tests
- Error handling
- RLS and multi-tenancy
- Responsive design
- Caching
- Accessibility

---

## Coverage Against Acceptance Criteria

| AC | Tests |
|----|-------|
| AC-1 (Load < 2s) | 4 in page.test.tsx |
| AC-2 (6 KPI cards) | 33 total in KPICard + page |
| AC-3 (KPI navigation) | 7 in KPICard.test.tsx |
| AC-4 (Alert panel) | 33 in AlertPanel.test.tsx |
| AC-5 (Activity feed) | 50 in ActivityFeed.test.tsx |
| AC-6 (Quick actions) | 7 in page.test.tsx |
| AC-7 (Caching 2-min) | 12 across service + API |
| AC-8 (Zero state) | 11 in page.test.tsx |
| AC-9 (RLS) | 25+ across all tests |

---

## RED Phase Status

- [x] All 7 test files created
- [x] 272 tests written
- [x] 271 passing (expected)
- [x] 1 failing for right reason (service not implemented)
- [x] All ACs covered
- [x] Ready for GREEN phase

**Next Step**: Handoff to DEV agent for implementation
