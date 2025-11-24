# UX Design Specification: Production Module

**Project**: MonoPilot MES
**Module**: Production Module (Real-Time Dashboard)
**Version**: 1.0
**Date**: 2025-11-15
**Author**: UX Design Workflow (7-Step Methodology)
**Status**: Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Context](#project-context)
3. [Current State Analysis](#current-state-analysis)
4. [Design Variants](#design-variants)
5. [Detailed Wireframes](#detailed-wireframes)
6. [Component Library](#component-library)
7. [Detailed Workflows](#detailed-workflows)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Success Metrics](#success-metrics)
10. [Appendices](#appendices)

---

## Executive Summary

### Problem Statement

The current Production Module (`/production`) uses a **tab-based interface** (5 tabs: Work Orders, Yield, Consume, Operations, Trace) that requires extensive navigation and manual analysis. Production Managers spend **8-10 minutes** each morning reviewing production status by switching between tabs, opening Excel for calculations, and making phone calls to Line Supervisors. Line Supervisors walk to the office computer **28 times per shift** (1.68 km total) to check status, leading to **30+ minute lag** in issue detection.

**Key Pain Points**:
- No central dashboard (need 5 tabs to see full picture)
- No real-time updates (5-10 min data lag)
- No OEE tracking (manual calculation in Excel)
- No downtime tracking (end-of-shift Excel entry)
- No visual alerts (issues buried in tables)
- Not mobile-friendly (supervisors tied to office computer)
- No shop floor visibility (operators have no awareness of metrics)

### Solution Overview

A **3-variant UX redesign** of the Production Module, prioritized for phased implementation:

1. **Variant B: Real-Time Production Board** (P0 MVP, Weeks 1-6)
   - Single-screen dashboard with 10 KPI cards + 4-column Kanban-style line board
   - Real-time updates via WebSocket (30-second refresh)
   - WO Details Modal with 6 tabs (Overview, Operations, Materials, Yield, Trace, History)
   - Downtime Tracker Modal with auto-calculated impact
   - Mobile/tablet view for Line Supervisors (1280×800)
   - **Time Savings**: 83% faster morning review (8 min → 50s), 97% time saved on shift monitoring (98 min → 2 min)

2. **Variant C: KPI Focus Mode / TV Display** (P0 Growth, Weeks 7-9)
   - Full-screen TV display (1920×1080, 50" TVs) for shop floor visibility
   - Auto-rotating 6 screens (OEE, Yield, Plan Accuracy, Running WOs, Delayed WOs, Shortages)
   - 120px font sizes (readable from 10+ meters)
   - Red flash alerts for critical events
   - **Impact**: 100% operator awareness (vs 0% currently)

3. **Variant D: Customizable Widgets** (P2 Future, Weeks 10-12)
   - Drag-drop widget dashboard (react-grid-layout)
   - 10 widget types (OEE Gauge, Yield Trend, WO List, Downtime Log, etc.)
   - Custom SQL widget for ad-hoc analysis
   - Pre-built templates (Production Manager View, Line Supervisor View, etc.)
   - **Users**: Power users (20% adoption target)

### Business Impact

**Quantitative Benefits**:
- **175 minutes/day saved** across Production Manager + Line Supervisors (750 hours/year)
- **83% faster** morning review (8 min → 50s)
- **97% time saved** on shift monitoring (98 min → 2-3 min passive)
- **93% faster** downtime logging (5 min → 20s)
- **75% faster** WO investigation (10 min → 2.5 min)
- **60x faster** issue detection (30+ min lag → <30s real-time)

**Qualitative Benefits**:
- Real-time visibility (live indicator, <30s updates)
- Proactive issue detection (alerts before problems escalate)
- Operator engagement (shop floor TVs create feedback loop)
- Shift handoff accuracy (auto-generated summaries, 100% complete vs 60-70% memory-based)
- Reduced physical movement (0 office trips vs 28/shift = 1.68 km eliminated)

### Implementation Summary

- **Timeline**: 12 weeks (3 months)
- **Budget**: $73,450 ($72k labor + $1.5k hardware)
- **Team**: 2 developers (60% time), 1 designer (50%), 1 QA (25%), 1 PM (10%)
- **Technology**: Next.js 15, React 19, TypeScript, Supabase (PostgreSQL + Realtime), Tailwind CSS, Recharts
- **Deliverables**: 10 components, 5 API routes, 3 database tables, 80+ tests, 2 TVs deployed

---

## Project Context

### Business Context

**MonoPilot** is a Manufacturing Execution System (MES) for food manufacturing. The **Production Module** is one of 6 P0 modules (Technical, Planning, Production, Warehouse, Scanner, Settings) that are already implemented but require UX improvements for MVP readiness.

**User Personas**:

1. **Michał (Production Manager, 38)**
   - **Role**: Oversees 4 production lines (A, B, C, D), reports to Operations Director
   - **Goals**: Maximize OEE, minimize downtime, ensure on-time delivery
   - **Current Pain**: Spends 8-10 min each morning manually aggregating data from 5 tabs + Excel
   - **Tech Savvy**: High, prefers data-driven dashboards
   - **Device**: Desktop (1920×1080), office-based

2. **Anna (Line Supervisor, 32)**
   - **Role**: Manages Line A (Grinding & Mixing), supervises 3 operators per shift
   - **Goals**: Hit yield targets (>80%), respond to downtime quickly, communicate issues to manager
   - **Current Pain**: Walks to office 28 times/shift to check status, 30+ min lag in issue detection
   - **Tech Savvy**: Medium, needs simple mobile UI
   - **Device**: Tablet (1280×800), shop floor

3. **Tomasz (Operations Director, 45)**
   - **Role**: Strategic oversight, reviews weekly OEE trends, makes capital investment decisions
   - **Goals**: Long-term OEE improvement, cost reduction, compliance
   - **Current Pain**: No high-level visibility, relies on manual Excel reports from managers
   - **Tech Savvy**: Medium, needs executive dashboards
   - **Device**: Desktop (1920×1080), mobile (1280×800)

**Operator Persona** (Shop Floor):
- **Role**: Machine operators (10-15 per shift across 4 lines)
- **Goals**: Meet hourly targets, minimize scrap, report issues
- **Current Pain**: No visibility into performance metrics, no feedback loop
- **Device**: None (see TV displays only)

### Technical Context

**Current Architecture**:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL 15, Auth, RLS, Realtime)
- **State**: React Context, SWR for data fetching
- **API**: Class-based API services (`apps/frontend/lib/api/`)
- **Database**: 40+ tables, multi-tenant (`org_id` RLS)

**Existing Production Tables**:
- `work_orders` (wo_number, product_id, bom_id, quantity, priority, status, line_id, scheduled_start/end, actual_start/end)
- `wo_operations` (wo_id, sequence_number, operation_name, status, started_at, finished_at, expected_yield_pct)
- `wo_materials` (wo_id, material_id, qty_planned, qty_required, consume_whole_lp flag)
- `production_outputs` (wo_id, product_id, quantity, operation_seq, qa_status, type: 'PR'|'FG'|'BP')
- `production_lines` (line_id, name, description, warehouse_id, is_active)
- `license_plates` (lp_number, product_id, quantity, uom, status, expiry_date, batch_number)
- `lp_reservations` (lp_id, wo_id, qty_reserved, qty_consumed)

**New Tables (Phase 1)**:
- `downtime_events` (line_id, wo_id, reason_code, start_time, end_time, duration_minutes, oee_impact_pct, output_lost_kg)
- `action_items` (wo_id, title, assigned_to, priority, status, due_date)
- `shift_summaries` (shift_date, shift_name, supervisor_id, total_output_kg, oee_pct, work_orders_completed, downtime_minutes)

**Existing API Endpoints**:
- `/api/production/work-orders/:id` - WO details
- `/api/production/yield/pr` - PR recording
- `/api/production/yield/fg` - FG recording
- `/api/production/consume` - Material consumption
- `/api/production/trace/forward` - Forward trace
- `/api/production/trace/backward` - Backward trace

**New API Endpoints (Phase 1)**:
- `/api/production/dashboard` - Dashboard data (KPIs + line board)
- `/api/production/downtime` - Downtime CRUD
- `/api/production/action-items` - Action items CRUD
- `/api/production/shift-summary` - Shift summary generation (AI-powered)

### Design Methodology

**7-Step UX Design Process**:
1. ✅ Project & Users Confirmation (personas, context)
2. ✅ Current State Analysis + Design Variants (4 variants)
3. ✅ Detailed Wireframes (Variant B + Variant C)
4. ✅ Component Library (10 components, color palette, typography)
5. ✅ Detailed Workflows (6 workflows with timing)
6. ✅ Implementation Roadmap (12-week plan)
7. ✅ Save Design Specification (this document)

**Design Principles**:
- **Real-time first**: Live updates, <30s refresh
- **Mobile-responsive**: Tablet support for supervisors
- **Visual hierarchy**: Color-coded status (green/amber/red)
- **Progressive disclosure**: Summary → drill-down → details
- **Zero context switching**: All info in one place (modal with tabs)
- **Accessibility**: WCAG AA compliance, keyboard navigation, ARIA labels

---

## Current State Analysis

### Current UI Structure (Tab-Based)

**File**: `apps/frontend/app/production/page.tsx` (1,075 lines)

**5 Tabs**:

1. **Work Orders Tab** (Lines 81-360)
   - Table: WO#, Product, Line, Status, Priority, Scheduled Start/End, Actual Start/End, Quantity, Progress
   - Filters: Line, Status, Date Range
   - Actions: View Details, Start WO, Complete WO
   - **Pain Point**: No real-time updates, need to refresh page

2. **Yield Report Tab** (Lines 362-610)
   - 4 KPI Cards: Yield %, Consumption/kg, Plan Accuracy, On-Time WO%
   - PR/FG toggle
   - Time bucket selector (day/week/month)
   - Drill-down table: WO#, Product, Input, Output, Yield%, Variance
   - Export to Excel
   - **Pain Point**: No charts, just tables. No trend analysis.

3. **Consume Report Tab** (Lines 612-816)
   - 4 Summary Cards: Total Materials, Unique Materials, Work Orders, Total Variance
   - Material Variance Analysis table: Material, BOM Standard, Actual, Variance, Variance %
   - Filter by WO
   - **Pain Point**: No real-time alerts for over-consumption

4. **Operations Tab** (Lines 818-1074)
   - Select WO dropdown
   - Operations table: Seq, Operation Name, Planned IN/OUT, Actual IN/OUT, Losses, Yield%, Operator
   - RecordWeightsModal integration
   - **Pain Point**: Must select WO one at a time, no overview

5. **Trace Tab** (Lines 1075-end)
   - Search: LP number or WO number
   - Forward/Backward toggle
   - Tree visualization (indented nodes)
   - Node details panel
   - **Pain Point**: Separate tab, not integrated with WO view

**Current User Workflows**:

| Task | Steps | Time | Issues |
|------|-------|------|--------|
| Morning Review | Click 5 tabs, scan tables, open Excel, calculate | 8-10 min | Manual, slow, error-prone |
| Check WO Status | Click Work Orders tab, scroll table, find WO | 30-60s | No visual indicators |
| Investigate Yield Issue | Click Yield tab, find WO in table, click Operations tab, select WO, review | 5 min | 3 tab switches |
| Record Downtime | Walk to office, open Excel, type notes, calculate duration | 5+ min | Manual, not in system |
| Shift Handoff | Verbal + handwritten notes | 15-20 min | Incomplete, memory-based |

### Pain Points Summary

1. **No Central Dashboard**: Need 5 tabs to see full picture
2. **No Real-Time Updates**: 5-10 min data lag, must refresh page
3. **No OEE Tracking**: Manual calculation in Excel
4. **No Downtime Tracking**: End-of-shift Excel entry, data loss risk
5. **No Visual Alerts**: Issues buried in tables, easy to miss
6. **Not Mobile-Friendly**: Supervisors tied to office computer
7. **No Shop Floor Visibility**: Operators have no awareness of metrics
8. **Excessive Context Switching**: 5 tabs + Excel + phone calls

### Competitive Analysis

**Similar MES Systems**:

1. **Plex MES** (Rockwell Automation)
   - ✅ Real-time dashboard with KPI cards
   - ✅ Mobile app for supervisors
   - ✅ TV display mode for shop floor
   - ❌ Expensive ($50k+ setup, $500+/user/month)
   - ❌ Complex, 6+ month implementation

2. **Epicor MES**
   - ✅ Drag-drop dashboards
   - ✅ OEE calculation built-in
   - ❌ Desktop-only (no mobile)
   - ❌ No TV display mode

3. **Tulip.co** (No-Code MES)
   - ✅ Excellent mobile UI (tablet-first)
   - ✅ Real-time analytics
   - ✅ Shop floor apps
   - ❌ No food manufacturing features (traceability, lot tracking)
   - ❌ Expensive ($350/user/month)

**MonoPilot Competitive Advantages**:
- ✅ Food manufacturing specific (BOM versioning, 1:1 consumption, allergen tracking)
- ✅ Integrated traceability (genealogy tree, forward/backward trace)
- ✅ Lower cost (self-hosted Supabase)
- ✅ Full-stack real-time (WebSocket built-in)

---

## Design Variants

### Variant A: Enhanced Tab-Based Dashboard (Rejected)

**Concept**: Incremental improvement to existing tab-based UI

**Features**:
- Add "Dashboard" tab (new, 6th tab)
- 8 KPI cards at top (OEE, Yield, Running WOs, Delayed, etc.)
- Recent Alerts section (below KPI cards)
- Quick Actions buttons (Record Downtime, Create Action Item)
- Keep existing 5 tabs unchanged

**Pros**:
- Low implementation effort (1-2 weeks)
- Familiar to existing users
- Low risk (minimal changes)

**Cons**:
- ❌ Still requires tab switching (now 6 tabs!)
- ❌ Dashboard = 6th tab (not prominent)
- ❌ No real-time updates (still manual refresh)
- ❌ No mobile optimization
- ❌ No shop floor visibility

**Decision**: **Rejected** - Doesn't solve core pain points

---

### Variant B: Real-Time Production Board (RECOMMENDED - P0 MVP)

**Concept**: Single-screen Kanban-style dashboard with real-time updates

**Features**:

1. **KPI Cards Section** (Top, 140px height)
   - 10 KPI cards (180×120px each):
     - OEE % (Blue, with trend ↑ 2.1%)
     - Yield % (Purple, with target 80%)
     - Plan Accuracy % (Indigo, vs planned)
     - Running WOs (Green count)
     - Delayed WOs (Amber count)
     - Material Shortages (Red count)
     - Downtime Hours (Red, today)
     - Output kg (Teal, today)
     - Quality Holds (Orange count)
     - On-Time % (Emerald, this week)
   - Horizontal scroll if needed
   - Click card → drill-down modal

2. **Line Status Board** (Middle, 780px height)
   - 4 columns (460px width each): Line A, Line B, Line C, Line D
   - Each column has sections:
     - RUNNING (green header, WO cards with progress bars)
     - DELAYED (amber header, WO cards with alerts)
     - PLANNED (blue header, scheduled WOs)
     - COMPLETED (gray header, finished WOs)
     - DOWNTIME (red header, stopped WOs)
   - WO Cards (440×140px):
     - WO# + Product name
     - Progress bar (785/1000 kg, 78.5%)
     - Current operation (Op 2/3 Mixing)
     - Time remaining (⏱ 2h 15m left)
     - Operator badge (Anna K.)
     - Alert badges (🔴 ⚠️)
   - Drag-drop WO cards between sections (future)

3. **Alerts Feed** (Bottom, fixed 120px height)
   - Latest 5 alerts (horizontal scroll)
   - Live indicator (🔴 LIVE Updated 3s ago)
   - Alert types: Critical (red), Warning (amber), Success (green), Info (blue)
   - Click alert → open related WO modal

4. **WO Details Modal** (Click WO card)
   - 6 tabs:
     - **Overview**: Status, Progress, Operations summary, Materials summary, Issues & Alerts
     - **Operations**: Per-operation breakdown (seq, name, IN/OUT, losses, yield%, operator)
     - **Materials**: BOM snapshot vs actual (variance %, color-coded rows)
     - **Yield**: Trend chart (last 10 WOs), pattern detection
     - **Trace**: Forward/backward genealogy tree (reuse existing)
     - **History**: Audit log timeline (status changes, operations, outputs, alerts)
   - In-modal chat (real-time messaging with Line Supervisor)
   - Create Action Item button

5. **Downtime Tracker Modal** (Click "Record Downtime" on WO card)
   - Reason Code dropdown (8 codes: Machine Fault, Material Shortage, Changeover, Quality Hold, Planned Maintenance, Break, Operator Absence, Other)
   - Auto-filled Start/End Time (from system detection)
   - Auto-calculated: Duration, OEE Impact %, Output Lost kg
   - Notes field (optional, 250 chars)
   - Corrective Action Required checkbox
   - Save → creates downtime_event record

6. **Real-Time Updates**
   - WebSocket subscription (Supabase Realtime)
   - Auto-refresh every 30 seconds (fallback polling)
   - Live indicator shows last update time
   - Optimistic UI updates (instant feedback)

7. **Mobile/Tablet View** (1280×800)
   - Single-column layout
   - Line tabs (Line A, B, C, D tabs at top)
   - Larger touch targets (48px minimum)
   - Simplified KPIs (OEE only, not all 10)
   - Swipe gestures (swipe down → refresh)

**Pros**:
- ✅ Single-screen view (no tab switching)
- ✅ Real-time visibility (<30s updates)
- ✅ Visual status (color-coded cards, progress bars)
- ✅ Mobile-optimized (tablet support for supervisors)
- ✅ Proactive alerts (issues visible immediately)
- ✅ Zero office trips (tablet on shop floor)
- ✅ 83% faster morning review (8 min → 50s)

**Cons**:
- ⚠️ Higher implementation effort (6 weeks)
- ⚠️ Requires new database tables (downtime_events, etc.)
- ⚠️ Learning curve (new UI paradigm)

**Decision**: **SELECTED - P0 MVP** (Weeks 1-6)

---

### Variant C: KPI Focus Mode / TV Display (P0 Growth)

**Concept**: Full-screen TV display for shop floor visibility

**Features**:

1. **Auto-Rotating Screens** (6 screens, 10s each, 60s loop)
   - Screen 1: **OEE %** (huge gauge, 120px font, 800px diameter)
     - Main value: 82.5%
     - Breakdown: Availability 87.5%, Performance 95.0%, Quality 100%
     - Target: 80% (reference line on gauge)
     - Arc color: Green (≥ target), Amber (90-100% target), Red (< 90%)
   - Screen 2: **Yield %** (78.5%, amber arc, WO context)
   - Screen 3: **Plan Accuracy** (92%, green arc)
   - Screen 4: **Running WOs** (count + list with progress bars)
   - Screen 5: **Delayed WOs** (count + list with reasons)
   - Screen 6: **Material Shortages** (count + list with ETAs)
   - Auto-rotate indicator: "● ○ ○ ○ ○ ○ (1/6)", "→ Yield % in 7s..."

2. **Alert Flash Mechanism**
   - Critical alert detected → pause rotation
   - Red background flash (500ms on/off, 5× repeat)
   - Sound alert (optional browser beep)
   - Hold current screen 30 seconds
   - Resume rotation when alert dismissed (by supervisor on tablet)

3. **TV Display Settings Modal**
   - Configuration (accessed via tablet):
     - Display Name (text input)
     - Line Filter (All, Line A, Line B, etc.)
     - Metrics to Display (drag-to-reorder, checkboxes)
     - Rotation Interval (5s/10s/15s/30s/1min)
     - Alert Behavior (flash screen, sound alert, pause on alert)
     - Brightness (slider, 50-100%)
   - Save to localStorage (per-device config)
   - URL param: `/production/tv-display?config=line-a-config`

4. **Screen Saver Mode**
   - Activate after 2 hours idle (2am-6am)
   - Display: MonoPilot logo + clock
   - Wake on first alert or 6am

5. **End-of-Shift Summary**
   - Auto-show at shift end (14:00, 22:00, 06:00)
   - Display: Shift OEE, Total Output, Downtime, Issues
   - Duration: 2 minutes, then resume rotation

**Pros**:
- ✅ 100% operator awareness (vs 0% currently)
- ✅ Visible from 10+ meters (120px font)
- ✅ Passive monitoring (no interaction required)
- ✅ Behavioral change (visible goals → improved performance)
- ✅ Low setup cost (~$500 per TV)

**Cons**:
- ⚠️ Requires TV hardware (2× 50" TVs, mounts, Raspberry Pi)
- ⚠️ Network setup (WiFi or Ethernet to shop floor)
- ⚠️ Kiosk mode configuration (browser auto-start, no sleep)

**Decision**: **SELECTED - P0 Growth** (Weeks 7-9, after Variant B MVP)

---

### Variant D: Customizable Widget Dashboard (P2 Future)

**Concept**: Drag-drop widget dashboard for power users

**Features**:

1. **Widget Grid System** (react-grid-layout)
   - 12-column grid, responsive rows
   - Drag-drop widgets (resize, reorder)
   - Save layout to user preferences (database)

2. **Widget Catalog** (10 widget types)
   - **OEE Gauge Widget** (gauge chart, 4/6/12 cols)
   - **Yield Trend Chart Widget** (line chart, 6/12 cols)
   - **WO List Widget** (table, 6/12 cols)
   - **Downtime Log Widget** (timeline, 6/12 cols)
   - **Material Shortages Widget** (alert list, 4/6 cols)
   - **Alert Feed Widget** (horizontal scroll, 12 cols)
   - **Line Status Widget** (Kanban, 4/6/12 cols)
   - **Shift Summary Widget** (text report, 6/12 cols)
   - **Action Items Widget** (task list, 4/6 cols)
   - **Custom SQL Widget** (query builder, 6/12 cols)

3. **Per-Widget Settings**
   - Time bucket (today, this week, this month)
   - Line filter (All, Line A, etc.)
   - Metric selection (OEE, Yield, etc.)
   - Refresh interval (10s/30s/1min/5min)
   - Color scheme (light/dark)
   - Export data (CSV, Excel)

4. **Widget Templates**
   - Pre-built layouts:
     - "Production Manager View" (OEE + Yield + WO List + Alerts)
     - "Line Supervisor View" (Single Line + Downtime Log + Action Items)
     - "Operations Director View" (All Lines + Trends + Shortages)
   - Import/Export layouts (JSON)
   - Share templates between users

5. **Custom SQL Widget** (Power Users)
   - Query builder UI (drag-drop tables, select columns)
   - Whitelist allowed tables (read-only mode)
   - Auto-detect chart type (bar, line, pie, table)
   - Use case: Ad-hoc analysis ("Show top 10 products by yield")

**Pros**:
- ✅ Ultimate flexibility (each user customizes)
- ✅ Ad-hoc analysis (custom SQL queries)
- ✅ Executive dashboards (high-level KPIs)
- ✅ Reusable templates (share best practices)

**Cons**:
- ⚠️ High implementation effort (3 weeks)
- ⚠️ Complexity (may overwhelm non-power users)
- ⚠️ Maintenance (10+ widget types to support)
- ⚠️ Only 20% adoption expected (power users only)

**Decision**: **SELECTED - P2 Future** (Weeks 10-12, after Variant C)

---

## Detailed Wireframes

### Variant B: Real-Time Production Board (Desktop 1920×1080)

#### Main Dashboard (Full Screen)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ MonoPilot  Production Dashboard                    🔴 LIVE Updated 3s ago   [Michał] │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│ │ OEE %   │ │ Yield % │ │ Plan    │ │ Running │ │ Delayed │ │ Short-  │ │ Down-  │ │
│ │         │ │         │ │ Accuracy│ │ WOs     │ │ WOs     │ │ ages    │ │ time   │ │
│ │ ↑ 2.1%  │ │ Target  │ │         │ │         │ │         │ │         │ │        │ │
│ │  82.5%  │ │  78.5%  │ │  92%    │ │    6    │ │    2    │ │    1    │ │ 0.5h   │ │
│ │         │ │         │ │         │ │         │ │         │ │         │ │        │ │
│ │ ▁▂▃▅▆▇█ │ │ ▁▃▅▄▃▂▁ │ │ ▃▅▇█▆  │ │         │ │         │ │         │ │        │ │
│ │Target:  │ │Target:  │ │Target:  │ │         │ │         │ │         │ │        │ │
│ │ 80%     │ │ 80%     │ │ 90%     │ │         │ │         │ │         │ │        │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                                                 │
│ │ Output  │ │ Quality │ │ On-Time │                                                 │
│ │   kg    │ │  Holds  │ │    %    │                                                 │
│ │         │ │         │ │         │                                                 │
│ │  3200   │ │    0    │ │   94%   │                                                 │
│ └─────────┘ └─────────┘ └─────────┘                                                 │
│                                                                                       │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                          LINE STATUS BOARD                                            │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                         │
│ │ Line A     │ │ Line B     │ │ Line C     │ │ Line D     │                         │
│ │ Grinding & │ │ Stuffing   │ │ Packaging  │ │ Smoking    │                         │
│ │ Mixing     │ │            │ │            │ │            │                         │
│ ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤                         │
│ │ RUNNING(2) │ │ RUNNING(1) │ │ DOWNTIME(1)│ │ RUNNING(2) │                         │
│ ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤                         │
│ │┌──────────┐│ │┌──────────┐│ │┌──────────┐│ │┌──────────┐│                         │
│ ││WO-0105   ││ ││WO-0108   ││ ││WO-0112   ││ ││WO-0114   ││                         │
│ ││Andouille ││ ││Chorizo   ││ ││Bratwurst ││ ││Salami    ││                         │
│ ││150mm     ││ ││Mexican   ││ ││German    ││ ││Italian   ││                         │
│ ││          ││ ││          ││ ││          ││ ││          ││                         │
│ ││████████░░││ ││██████░░░░││ ││🔴DOWNTIME││ ││████████░ ││                         │
│ ││ 78.5%    ││ ││ 65%      ││ ││Machine   ││ ││ 85%      ││                         │
│ ││785/1000kg││ ││650/1000kg││ ││Fault     ││ ││850/1000kg││                         │
│ ││          ││ ││          ││ ││          ││ ││          ││                         │
│ ││Op 2/3    ││ ││Op 1/3    ││ ││Duration: ││ ││Op 3/4    ││                         │
│ ││Mixing    ││ ││Grinding  ││ ││15 min    ││ ││Smoking   ││                         │
│ ││          ││ ││          ││ ││          ││ ││          ││                         │
│ ││⏱2h 15m  ││ ││⏱4h 20m  ││ ││Started:  ││ ││⏱1h 05m  ││                         │
│ ││left      ││ ││left      ││ ││14:32     ││ ││left      ││                         │
│ ││          ││ ││          ││ ││          ││ ││          ││                         │
│ ││Anna K.   ││ ││Tomasz W. ││ ││Contact   ││ ││Ewa M.    ││                         │
│ ││Day Shift ││ ││Day Shift ││ ││Maint.    ││ ││Day Shift ││                         │
│ │└──────────┘│ │└──────────┘│ │└──────────┘│ │└──────────┘│                         │
│ │┌──────────┐│ │            │ │            │ │┌──────────┐│                         │
│ ││WO-0106   ││ │            │ │            │ ││WO-0115   ││                         │
│ ││Bratwurst ││ │            │ │            │ ││Pepperoni ││                         │
│ ││████████░ ││ │            │ │            │ ││███████░░ ││                         │
│ ││ 72%      ││ │            │ │            │ ││ 76%      ││                         │
│ │└──────────┘│ │            │ │            │ │└──────────┘│                         │
│ │            │ │            │ │            │ │            │                         │
│ │ DELAYED(1) │ │ PLANNED(2) │ │ PLANNED(1) │ │ PLANNED(1) │                         │
│ ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤                         │
│ │┌──────────┐│ │┌──────────┐│ │┌──────────┐│ │┌──────────┐│                         │
│ ││WO-0107⚠️ ││ ││WO-0109   ││ ││WO-0113   ││ ││WO-0116   ││                         │
│ ││Shortage  ││ ││Sched:16:00│││Sched:16:00│││Sched:22:00││                         │
│ ││Beef      ││ │└──────────┘│ │└──────────┘│ │└──────────┘│                         │
│ ││Trimmings ││ │┌──────────┐│ │            │ │            │                         │
│ ││          ││ ││WO-0110   ││ │            │ │            │                         │
│ ││-45 min   ││ ││Sched:18:00│││            │ │            │                         │
│ │└──────────┘│ │└──────────┘│ │            │ │            │                         │
│ │            │ │            │ │            │ │            │                         │
│ │COMPLETED(0)│ │COMPLETED(1)│ │COMPLETED(2)│ │COMPLETED(1)│                         │
│ │            │ ├────────────┤ ├────────────┤ ├────────────┤                         │
│ │            │ │┌──────────┐│ │┌──────────┐│ │┌──────────┐│                         │
│ │            │ ││WO-0107 ✓ ││ ││WO-0111 ✓ ││ ││WO-0113 ✓ ││                         │
│ │            │ ││1050kg    ││ ││950kg     ││ ││1100kg    ││                         │
│ │            │ ││105% plan ││ ││95% plan  ││ ││110% plan ││                         │
│ │            │ │└──────────┘│ │┌──────────┐│ │└──────────┘│                         │
│ │            │ │            │ ││WO-0112 ✓ ││ │            │                         │
│ │            │ │            │ │└──────────┘│ │            │                         │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                         │
│                                                                                       │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 🔴 LIVE ALERTS (Last 5)                                        Clear All ✕           │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │🔴 Line A - Material  │ │⚠️ Line B - Low Yield │ │✓ Line C - WO-0111   │          │
│ │   Shortage (Beef     │ │   (62% < 80%) WO-0108│ │   Completed (1050kg,│          │
│ │   Trimmings) WO-0105 │ │   Op2 • 5m ago       │ │   105% plan) 12m ago│          │
│ │   • 2m ago           │ │                      │ │                      │          │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘          │
│ ┌──────────────────────┐ ┌──────────────────────┐                                   │
│ │🔴 Line A - Downtime  │ │⚠️ Line D - Behind   │                                   │
│ │   Started (Machine   │ │   Schedule (WO-0114, │                                   │
│ │   Fault) • 18m ago   │ │   -45 min) • 25m ago │                                   │
│ └──────────────────────┘ └──────────────────────┘                                   │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- **10 KPI Cards** (top section, 140px height): Color-coded, sparklines, click for drill-down
- **4-Column Line Board** (middle, 780px height): Kanban-style sections (Running, Delayed, Planned, Completed, Downtime)
- **WO Cards** (440×140px): Progress bars, time remaining, operator badges, alert badges
- **Alerts Feed** (bottom, fixed 120px): Horizontal scroll, latest 5 alerts, live indicator
- **Real-Time Indicator** (top right): "🔴 LIVE Updated 3s ago" with pulse animation

---

#### WO Details Modal (Click WO-0105 Card)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ WO-0105 • Andouille 150mm                                               ✕   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Overview] [Operations] [Materials] [Yield] [Trace] [History]               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Status: ● RUNNING                     Line: Line A (Grinding & Mixing) │ │
│ │ Priority: 🔴 HIGH                     Operator: Anna K. (Day Shift)     │ │
│ │ Scheduled: 08:30-16:00                Started: 08:32 (5h 50m ago)       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ PROGRESS                                                                │ │
│ │                                                                         │ │
│ │ ████████████████░░░░ 78.5%                                              │ │
│ │ 785 kg / 1000 kg                                                        │ │
│ │                                                                         │ │
│ │ ⏱ Time Remaining: 2h 15m (on track ✓)                                  │ │
│ │ 📅 Target Completion: 16:00 (Today)                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌───────────────────────────┐ ┌────────────────────────────────────────┐   │
│ │ OPERATIONS (3 total)      │ │ MATERIALS (3 items)                    │   │
│ │                           │ │                                        │   │
│ │ ✓ Op1 Grinding            │ │ Beef Trimmings: 520 / 450 kg          │   │
│ │   92% yield (target 90%)  │ │ ⚠️ +15% over-consumed                  │   │
│ │   Completed 10:15         │ │                                        │   │
│ │                           │ │ Spices Mix: 19 / 20 kg                │   │
│ │ ● Op2 Mixing (CURRENT)    │ │ ✓ -5% (within tolerance)              │   │
│ │   78.3% yield ⚠️           │ │                                        │   │
│ │   (target 95%)            │ │ Casings 150mm: 1000 / 1000 units      │   │
│ │   Expected: 850 kg OUT    │ │ ✓ Exact match                         │   │
│ │   Actual: 665 kg OUT      │ │                                        │   │
│ │   Losses: 185 kg 🔴       │ │ 🔴 VARIANCE: +70 kg beef               │   │
│ │                           │ │                                        │   │
│ │ ○ Op3 Stuffing (PENDING)  │ │ BOM Version: v2.1 (eff. 2025-01-01)   │   │
│ │   Not started             │ │ Snapshot: 2025-11-15 08:30            │   │
│ └───────────────────────────┘ └────────────────────────────────────────┘   │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ ISSUES & ALERTS (2)                                                  │ │
│ │                                                                         │ │
│ │ 🔴 Low Yield - Op2 Mixing (78.3% < 95% target)                          │ │
│ │    Detected: 14:45 • Duration: 35 minutes                               │ │
│ │    Impact: -140 kg output lost                                          │ │
│ │    [ View Details ] [ Create Action Item ]                              │ │
│ │                                                                         │ │
│ │ ⚠️ Over-Consumption - Beef Trimmings (+15%, +70 kg)                     │ │
│ │    Detected: 14:20 • Expected: 450 kg, Actual: 520 kg                   │ │
│ │    Root Cause: Low yield Op2 (more input needed)                        │ │
│ │    [ Investigate ] [ Adjust BOM ]                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 💬 CHAT (Real-Time with Line Supervisor)                                │ │
│ │                                                                         │ │
│ │ Michał (14:50): Anna, check mixer blade on Op2, yield is low            │ │
│ │ Anna (14:51): Checking now, will report back                            │ │
│ │ Anna (14:52): Blade worn, replacing now. ETA 15 min.                    │ │
│ │ Michał (14:53): Thanks. Create action item for preventive maint.        │ │
│ │                                                                         │ │
│ │ [Type message...                                              ] [Send]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                                                   [Close] [Create Action]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**6 Tabs**:
1. **Overview** (shown above): Status, Progress, Operations summary, Materials summary, Issues, Chat
2. **Operations**: Per-operation table (seq, name, expected IN/OUT, actual IN/OUT, losses, yield%, operator)
3. **Materials**: BOM snapshot vs actual (material, BOM standard, actual consumed, variance, variance %)
4. **Yield**: Trend chart (last 10 WOs for same product), pattern detection
5. **Trace**: Forward/backward genealogy tree (reuse existing TraceTab)
6. **History**: Audit log timeline (created, started, operations, outputs, issues, completed)

---

#### Downtime Tracker Modal (Click "Record Downtime" on WO Card)

```
┌────────────────────────────────────────────────────────────────────┐
│ Record Downtime - Line A                                      ✕   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Work Order: WO-0105 Andouille 150mm                                │
│ Line: Line A (Grinding & Mixing)                                   │
│                                                                    │
│ Reason Code: *                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Machine Fault                                             ▼ │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐                 │
│ │ Start Time: *        │ │ End Time: *          │                 │
│ │ 14:32                │ │ 14:47                │                 │
│ │ (Auto-detected)      │ │ (Auto-detected)      │                 │
│ └──────────────────────┘ └──────────────────────┘                 │
│                                                                    │
│ Duration: 15 minutes (Auto-calculated)                             │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ 📊 IMPACT ANALYSIS                                           │   │
│ │                                                              │   │
│ │ OEE Impact:        -9.4%                                     │   │
│ │ Output Lost:       ~62 kg                                    │   │
│ │ Recovery Time:     +30 min estimated                         │   │
│ │                                                              │   │
│ │ Calculation:                                                 │   │
│ │ - Target rate: 250 kg/hour (from line config)               │   │
│ │ - Downtime: 15 min = 0.25 hours                             │   │
│ │ - Lost output: 250 × 0.25 = 62.5 kg                         │   │
│ │ - OEE impact: (15 min / 480 min shift) × 100 = 3.1%         │   │
│ │   × 3 lines affected = 9.4%                                 │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Notes (optional):                                                  │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Grinder bearing seized, replaced with spare. Maintenance     │   │
│ │ team notified for root cause analysis.                       │   │
│ │                                                              │   │
│ │ 250/250 characters                                           │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ☑ Corrective Action Required                                      │
│                                                                    │
│                        [Cancel]  [Save Downtime Event]            │
└────────────────────────────────────────────────────────────────────┘
```

**Auto-Filled Fields**:
- Start Time: 14:32:18 (from system detection when line went idle)
- End Time: 14:47:05 (from system detection when line resumed)
- Duration: 15 minutes (auto-calculated)
- OEE Impact: -9.4% (auto-calculated from line config + shift duration)
- Output Lost: 62 kg (auto-calculated from target rate × downtime)

**Manual Entry**:
- Reason Code: Dropdown (8 codes: Machine Fault, Material Shortage, Changeover, Quality Hold, Planned Maintenance, Break, Operator Absence, Other)
- Notes: Textarea (250 chars max)
- Corrective Action Required: Checkbox

---

### Variant B: Mobile/Tablet View (1280×800)

```
┌─────────────────────────────────────────────────────────────┐
│ MonoPilot  Production                 🔴 LIVE 3s ago  [AK]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ [Line A] [Line B] [Line C] [Line D]                    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ OEE %   │ │ Yield % │ │ Running │ │ Delayed │           │
│ │         │ │         │ │ WOs     │ │ WOs     │           │
│ │  82.5%  │ │  78.5%  │ │    2    │ │    1    │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Line A - Grinding & Mixing                           │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ RUNNING (2 WOs)                                      │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ ┌────────────────────────────────────────────────┐   │    │
│ │ │ WO-0105 • Andouille 150mm                      │   │    │
│ │ │                                                │   │    │
│ │ │ ████████████████░░░░ 78.5%                     │   │    │
│ │ │ 785 / 1000 kg                                  │   │    │
│ │ │                                                │   │    │
│ │ │ Op 2/3 Mixing                                  │   │    │
│ │ │ ⏱ 2h 15m left                                  │   │    │
│ │ │                                                │   │    │
│ │ │ Anna K. • Day Shift                            │   │    │
│ │ │                                                │   │    │
│ │ │ ⚠️ Low Yield Op2 (78.3%)                       │   │    │
│ │ │                                                │   │    │
│ │ │        [View Details] [Record Downtime]        │   │    │
│ │ └────────────────────────────────────────────────┘   │    │
│ │                                                      │    │
│ │ ┌────────────────────────────────────────────────┐   │    │
│ │ │ WO-0106 • Bratwurst German                     │   │    │
│ │ │                                                │   │    │
│ │ │ ████████████████░░ 72%                         │   │    │
│ │ │ 720 / 1000 kg                                  │   │    │
│ │ │                                                │   │    │
│ │ │ Op 1/3 Grinding                                │   │    │
│ │ │ ⏱ 3h 40m left                                  │   │    │
│ │ │                                                │   │    │
│ │ │ Anna K. • Day Shift                            │   │    │
│ │ └────────────────────────────────────────────────┘   │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ DELAYED (1 WO)                                       │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ ┌────────────────────────────────────────────────┐   │    │
│ │ │ WO-0107 • Andouille 175mm                      │   │    │
│ │ │                                                │   │    │
│ │ │ ⚠️ MATERIAL SHORTAGE                           │   │    │
│ │ │ Beef Trimmings - ETA 18:00 (4h)                │   │    │
│ │ │                                                │   │    │
│ │ │ -45 min behind schedule                        │   │    │
│ │ │                                                │   │    │
│ │ │           [View Details] [Contact WH]          │   │    │
│ │ └────────────────────────────────────────────────┘   │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ PLANNED (2 WOs)                                      │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ WO-0109 • Chorizo Mexican (Sched: 16:00)             │    │
│ │ WO-0110 • Salami Italian (Sched: 18:00)              │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 🔴 LATEST ALERTS (Tap to expand)                     │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ 🔴 Material Shortage (Beef) • 2m ago                 │    │
│ │ ⚠️ Low Yield WO-0105 Op2 • 5m ago                    │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                             │
│                    [⟳ Pull to Refresh]                      │
└─────────────────────────────────────────────────────────────┘
```

**Mobile/Tablet Adaptations**:
- **Line Tabs** (top): Tap to switch between Line A, B, C, D (single-column view)
- **Simplified KPIs**: Only 4 cards (OEE, Yield, Running, Delayed) instead of 10
- **Full-Width WO Cards**: 100% width (vs 440px desktop)
- **Larger Touch Targets**: 56px buttons (vs 44px desktop)
- **Swipe Gestures**: Swipe down → refresh, swipe left/right → switch lines
- **Collapsible Sections**: Tap section header to collapse/expand
- **Bottom Actions**: Fixed buttons for quick actions (View Details, Record Downtime)

---

### Variant C: TV Display (1920×1080, 50" TV)

#### Screen 1: OEE % (Full-Screen Gauge)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                                                                        │
│                           ╭─────────────╮                              │
│                         ╱                 ╲                            │
│                       ╱                     ╲                          │
│                     ╱           82.5          ╲                        │
│                   ╱              %              ╲                      │
│                  │                                │                    │
│                  │              OEE               │                    │
│                  │                                │                    │
│                   ╲                              ╱                     │
│                     ╲                          ╱                       │
│                       ╲                      ╱                         │
│                         ╲                  ╱                           │
│                           ╰────────────────╯                           │
│                                                                        │
│                  ████████████████████░░░░░                             │
│                                                                        │
│                                                                        │
│                         Target: 80% ✓                                  │
│                                                                        │
│                    Availability:  87.5%                                │
│                    Performance:   95.0%                                │
│                    Quality:      100.0%                                │
│                                                                        │
│                                                                        │
│           Auto-rotating to Yield % in 7 seconds...                     │
│           ● ○ ○ ○ ○ ○  (Step 1/6)                                     │
│                                                                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Key Design Elements**:
- **Huge Font**: 120px for main number (readable from 10+ meters)
- **Gauge Diameter**: 800px (fills screen)
- **Arc Color**: Green (82.5% ≥ 80% target)
- **Breakdown**: 3 OEE components (Availability, Performance, Quality) in 32px font
- **Auto-Rotate Indicator**: Bottom center, countdown + progress dots
- **No Interaction**: Display only, no buttons

---

#### Screen 2: Yield % (Full-Screen Gauge)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                                                                        │
│                           ╭─────────────╮                              │
│                         ╱                 ╲                            │
│                       ╱                     ╲                          │
│                     ╱           78.5          ╲                        │
│                   ╱              %              ╲                      │
│                  │                                │                    │
│                  │            YIELD               │                    │
│                  │                                │                    │
│                   ╲                              ╱                     │
│                     ╲                          ╱                       │
│                       ╲                      ╱                         │
│                         ╲                  ╱                           │
│                           ╰────────────────╯                           │
│                                                                        │
│                  ████████████████████░░░░░                             │
│                                                                        │
│                                                                        │
│                         Target: 80% ⚠️                                 │
│                                                                        │
│                    WO-0105 • Andouille 150mm                           │
│                    Input:  850 kg                                      │
│                    Output: 785 kg                                      │
│                    Losses:  65 kg                                      │
│                                                                        │
│                                                                        │
│           Auto-rotating to Plan Accuracy in 7 seconds...               │
│           ○ ● ○ ○ ○ ○  (Step 2/6)                                     │
│                                                                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Arc Color**: Amber (78.5% < 80% target, but ≥ 70%)

---

#### Screen 4: Running WOs (List View)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                                                                        │
│                                                                        │
│                          RUNNING WORK ORDERS                           │
│                                                                        │
│                                 6                                      │
│                                                                        │
│                                                                        │
│      Line A: WO-0105 Andouille 150mm     ████████░░ 78%                │
│                                                                        │
│      Line A: WO-0106 Bratwurst German    ███████░░░ 72%                │
│                                                                        │
│      Line B: WO-0108 Chorizo Mexican     ██████░░░░ 65% ⚠️             │
│                                                                        │
│      Line C: WO-0112 Bratwurst German    🔴 DOWNTIME                   │
│                                          Machine Fault                 │
│                                                                        │
│      Line D: WO-0114 Salami Italian      ████████░░ 85%                │
│                                                                        │
│      Line D: WO-0115 Pepperoni Pizza     █████████░ 92%                │
│                                                                        │
│                                                                        │
│                                                                        │
│           Auto-rotating to Delayed WOs in 7 seconds...                 │
│           ○ ○ ○ ● ○ ○  (Step 4/6)                                     │
│                                                                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

#### Alert Flash (Critical Event)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│ ████████████████████████████████████████████████████████████████████   │
│ ████████████████████████████████████████████████████████████████████   │
│ ████                                                            ████   │
│ ████                                                            ████   │
│ ████                  🔴  CRITICAL ALERT                        ████   │
│ ████                                                            ████   │
│ ████                                                            ████   │
│ ████              Line A - Material Shortage                    ████   │
│ ████                                                            ████   │
│ ████                   Beef Trimmings                           ████   │
│ ████                                                            ████   │
│ ████                   WO-0105 Delayed                          ████   │
│ ████                                                            ████   │
│ ████                   Contact Supervisor                       ████   │
│ ████                                                            ████   │
│ ████                                                            ████   │
│ ████████████████████████████████████████████████████████████████████   │
│ ████████████████████████████████████████████████████████████████████   │
│                                                                        │
│                                                                        │
│            Alert will clear in 30 seconds or when dismissed...         │
│                                                                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Behavior**:
- Red background flash (500ms on, 500ms off, 5× repeat = 5 seconds total)
- Sound alert (browser beep, optional)
- Pause rotation (hold screen 30 seconds)
- Resume rotation after:
  - 30 seconds elapsed, OR
  - Supervisor dismisses alert on tablet, OR
  - Alert resolved (e.g., material arrived)

---

## Component Library

### 1. Color Palette (Light Mode)

#### Status Colors

```
✓ SUCCESS / ON-TRACK / RUNNING
  Primary:   #10B981 (Green-500)
  Light:     #D1FAE5 (Green-100)
  Dark:      #047857 (Green-700)
  Text:      #065F46 (Green-800)

⚠️ WARNING / DELAYED / APPROACHING
  Primary:   #F59E0B (Amber-500)
  Light:     #FEF3C7 (Amber-100)
  Dark:      #D97706 (Amber-600)
  Text:      #92400E (Amber-900)

🔴 CRITICAL / SHORTAGE / DOWNTIME
  Primary:   #EF4444 (Red-500)
  Light:     #FEE2E2 (Red-100)
  Dark:      #DC2626 (Red-600)
  Text:      #991B1B (Red-800)

● IDLE / PLANNED / PENDING
  Primary:   #6B7280 (Gray-500)
  Light:     #F3F4F6 (Gray-100)
  Dark:      #4B5563 (Gray-600)
  Text:      #374151 (Gray-700)
```

#### KPI Colors

```
OEE %:              #3B82F6 (Blue-500)
Yield %:            #8B5CF6 (Purple-500)
Plan Accuracy:      #6366F1 (Indigo-500)
Running WOs:        #10B981 (Green-500)
Delayed WOs:        #F59E0B (Amber-500)
Material Shortages: #EF4444 (Red-500)
Downtime Hours:     #DC2626 (Red-600)
Output kg:          #14B8A6 (Teal-500)
Quality Holds:      #F97316 (Orange-500)
On-Time %:          #059669 (Emerald-600)
```

#### Background & Surfaces

```
Background:         #F9FAFB (Gray-50)
Card Surface:       #FFFFFF (White)
Card Hover:         #F3F4F6 (Gray-100)
Border Default:     #E5E7EB (Gray-200)
Border Active:      #D1D5DB (Gray-300)
Divider:            #E5E7EB (Gray-200)
```

#### Text Hierarchy

```
Primary Text:       #111827 (Gray-900)
Secondary Text:     #374151 (Gray-700)
Tertiary Text:      #6B7280 (Gray-500)
Disabled Text:      #9CA3AF (Gray-400)
Link Text:          #2563EB (Blue-600)
Link Hover:         #1D4ED8 (Blue-700)
```

### 2. Typography

#### Font Family

```
Primary:    system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif
Monospace:  'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace
```

#### Font Scale

```
Desktop:
  XXL - 120px / 700 Bold   → TV Display main numbers
  XL  - 48px / 700 Bold    → Desktop KPI card main numbers
  L   - 32px / 600 Semibold → Modal titles, Section headers
  M   - 24px / 600 Semibold → WO Card titles, Column headers
  R   - 16px / 400 Regular  → Body text, table cells, WO details
  S   - 14px / 400 Regular  → Metadata, timestamps, helper text
  XS  - 12px / 400 Regular  → Tooltips, fine print, timestamps

Mobile/Tablet:
  XL  - 36px / 700 Bold    → KPI card main numbers (scaled down)
  L   - 24px / 600 Semibold → Modal titles
  M   - 18px / 600 Semibold → WO Card titles
  R   - 16px / 400 Regular  → Body text (unchanged)
  S   - 14px / 400 Regular  → Metadata (unchanged)
```

### 3. Spacing System (Base Unit: 4px)

```
Space Scale:
  xs  = 4px   (0.25rem)
  sm  = 8px   (0.5rem)
  md  = 12px  (0.75rem)
  lg  = 16px  (1rem)
  xl  = 20px  (1.25rem)
  2xl = 24px  (1.5rem)
  3xl = 32px  (2rem)
  4xl = 48px  (3rem)
  5xl = 64px  (4rem)
```

#### Layout Dimensions (Desktop 1920×1080)

```
KPI Cards Section:
  - Container: 1920px width × 140px height
  - Card: 180px width × 120px height
  - Gap: 16px (lg)
  - Total: 10 cards × 180px + 9 gaps × 16px = 1944px (scroll if needed)

Line Status Board:
  - Container: 1920px width × 780px height
  - Column: 460px width × 780px height
  - Gap: 20px (xl)
  - Total: 4 columns × 460px + 3 gaps × 20px = 1900px

WO Card:
  - Width: 440px (fits in 460px column with 10px margin each side)
  - Height: Auto (min 140px, max 240px)
  - Padding: 12px (md)
  - Gap between cards: 12px (md)

Alerts Feed:
  - Container: 1920px width × 120px height
  - Alert item: 360px width × 48px height
  - Gap: 12px (md)
```

### 4. Core Components (10 Components)

#### Component 1: KPICard

**Purpose**: Display single metric with value, trend, and sparkline

**Props**:
```typescript
interface KPICardProps {
  label: string;              // "OEE %", "Yield %", etc.
  value: number;              // 82.5
  unit?: string;              // "%", "kg", "hrs"
  trend?: number;             // 2.1 (positive) or -1.5 (negative)
  trendPeriod?: string;       // "vs yesterday", "vs last week"
  target?: number;            // 80
  sparklineData?: number[];   // [78, 79, 80, 82, 83, 84, 85, 84, 83, 82, 81, 80]
  color: string;              // "#3B82F6" (Blue for OEE)
  status?: 'good' | 'warning' | 'critical';
  onClick?: () => void;
}
```

**Styling**:
- Size: 180×120px (desktop), 160×100px (mobile)
- Status border: 4px left border (green/amber/red)
- Hover: Shadow, -2px translateY
- Sparkline: 24px height, line chart

---

#### Component 2: WOCard

**Purpose**: Display Work Order summary in line board

**Props**:
```typescript
interface WOCardProps {
  woNumber: string;          // "WO-0105"
  productName: string;       // "Andouille 150mm"
  lineId: string;
  status: WOStatus;          // 'planned' | 'running' | 'delayed' | 'completed' | 'downtime'
  priority: 1 | 2 | 3;
  currentOperation?: {
    sequence: number;        // 2
    total: number;           // 3
    name: string;            // "Mixing"
  };
  progress: {
    actual: number;          // 785
    planned: number;         // 1000
    unit: string;            // "kg"
    percentage: number;      // 78.5
  };
  timeRemaining?: number;    // Minutes remaining
  operator?: {
    id: string;
    name: string;
    shift: string;
  };
  alerts?: { type: 'shortage' | 'downtime' | 'quality' | 'delay'; message: string; }[];
  onClick?: () => void;
}
```

**Styling**:
- Size: 440×140-240px (desktop), 100% width (mobile)
- Status border: 4px left (green/amber/red/gray/blue)
- Hover: Shadow, 4px translateX
- Priority ribbon: Corner ribbon for HIGH priority

---

#### Component 3: GaugeChart

**Purpose**: Circular gauge for OEE% and KPI visualization

**Props**:
```typescript
interface GaugeChartProps {
  value: number;             // 82.5
  max: number;               // 100
  unit: string;              // "%"
  label: string;             // "OEE"
  target?: number;           // 80
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  // small: 200px, medium: 400px, large: 600px, fullscreen: 800px
  color: string;
  breakdown?: { label: string; value: number; }[];
  animate?: boolean;
}
```

**Color Logic**:
- Green: value ≥ target
- Amber: value ≥ target × 0.9 (90-100% of target)
- Red: value < target × 0.9

---

#### Component 4: LineBoard

**Purpose**: Kanban-style board for line status visualization

**Props**:
```typescript
interface LineBoardProps {
  lines: {
    id: string;
    name: string;
    description: string;
    workOrders: WOCard[];
    isActive: boolean;
  }[];
  columnWidth: number;       // 460px (desktop), 100% (mobile)
  allowDragDrop?: boolean;
  onWOClick?: (woId: string) => void;
  onWOMove?: (woId: string, fromLine: string, toLine: string) => void;
}
```

**Layout**:
- Desktop: 4-column grid (460px × 4 + 60px gaps = 1900px)
- Mobile: Single column + line tabs

**Sections per Column**:
- RUNNING (green header)
- DELAYED (amber header)
- PLANNED (blue header)
- COMPLETED (gray header)
- DOWNTIME (red header)

---

#### Component 5: AlertsFeed

**Purpose**: Real-time alerts feed at bottom of dashboard

**Props**:
```typescript
interface AlertsFeedProps {
  alerts: Alert[];
  maxVisible?: number;       // Default: 5
  autoScroll?: boolean;
  allowDismiss?: boolean;
  onAlertClick?: (alertId: string) => void;
  onClearAll?: () => void;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  lineId?: string;
  woNumber?: string;
  message: string;
  timestamp: Date;
}
```

**Styling**:
- Fixed bottom position (120px height, z-index 40)
- Horizontal scroll (latest 5 alerts)
- Live indicator (🔴 pulse animation)
- Alert item: 360×48px, 4px left border (red/amber/green/blue)

---

#### Component 6: DowntimeCard

**Purpose**: Record downtime event with auto-calculated impact

**Props**:
```typescript
interface DowntimeCardProps {
  lineId: string;
  woNumber?: string;
  startTime: Date;
  endTime?: Date;
  reasonCodes: { id: string; label: string; category: 'planned' | 'unplanned'; }[];
  onSave: (data: DowntimeEvent) => Promise<void>;
  onCancel: () => void;
  showImpactAnalysis?: boolean;
}

interface DowntimeEvent {
  lineId: string;
  woId?: string;
  reasonCodeId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
  correctiveActionRequired: boolean;
  impact: {
    oeeReduction: number;
    outputLostKg: number;
    recoveryTimeMin: number;
  };
}
```

**Auto-Calculated Fields**:
- Duration (minutes)
- OEE Impact %
- Output Lost kg (from line target rate)
- Recovery Time (from historical data)

---

#### Component 7: ProgressBar

**Purpose**: Visual progress indicator for WO completion

**Props**:
```typescript
interface ProgressBarProps {
  value: number;
  max: number;
  unit?: string;
  showPercentage?: boolean;
  showLabels?: boolean;
  color?: string;
  height?: 'sm' | 'md' | 'lg'; // 8px | 16px | 24px
  variant?: 'default' | 'segmented';
  segments?: { label: string; value: number; max: number; }[];
}
```

**Auto-Color Logic**:
- Red: < 50% progress
- Amber: 50-80% progress
- Green: > 80% progress
- Emerald: 100% complete

---

#### Component 8: StatusIndicator

**Purpose**: Visual status badge for WO, operation, line

**Props**:
```typescript
interface StatusIndicatorProps {
  status: 'running' | 'delayed' | 'downtime' | 'planned' | 'completed' | 'paused' | 'idle';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  customLabel?: string;
}
```

**Styling**:
- Size: sm (16px), md (24px), lg (32px)
- Emoji icons: ● (running), ⚠️ (delayed), 🔴 (downtime), ○ (planned), ✓ (completed), ⏸ (paused)
- Color: Green (running), Amber (delayed), Red (downtime), Blue (planned), Gray (completed/paused)

---

#### Component 9: TimeRemaining

**Purpose**: Countdown timer for WO completion

**Props**:
```typescript
interface TimeRemainingProps {
  scheduledEnd: Date;
  actualProgress: number;
  plannedProgress: number;
  showWarning?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Logic**:
- On-track (green): actualProgress ≥ plannedProgress
- Tight (amber): actualProgress < plannedProgress - 10%
- Overdue (red): scheduledEnd < now

**Format**:
- "2h 15m left" (on-track)
- "45m left ⚠️" (tight)
- "-30m OVERDUE 🔴" (late)

---

#### Component 10: OperatorBadge

**Purpose**: Display operator info with avatar and shift

**Props**:
```typescript
interface OperatorBadgeProps {
  operatorId: string;
  operatorName: string;
  avatarUrl?: string;
  shift?: {
    name: string;
    startTime: string;
    endTime: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showShift?: boolean;
}
```

**Avatar Initials Logic**:
- "Anna Kowalska" → "AK"
- "Tomasz Wojcik" → "TW"
- Color: Blue background, white text

---

## Detailed Workflows

### Workflow 1: Production Manager Morning Review

**Persona**: Michał (Production Manager)
**Device**: Desktop (1920×1080)
**Goal**: Get daily production overview in <2 minutes

#### Current Method (8-10 minutes)

1. Navigate to `/production` (5s)
2. Click "Work Orders" tab, scan 20+ rows (30s)
3. Click "Yield Report" tab, change to "Today", scan KPIs (25s)
4. Click "Operations" tab, select 4 WOs from dropdown (60s)
5. Review operations tables (80s)
6. Open Excel, note issues (30s)
7. Click "Trace" tab, search LP (30s)

**Total**: ~8-10 min, 5 tabs, Excel, manual notes

#### New Method (<1 minute)

1. Navigate to `/production` (3s)
2. Scan 10 KPI cards at once (5s)
   - See: OEE 82.5% ✓, Yield 78.5% ⚠️, Delayed 2 WOs ⚠️, Shortages 1 🔴
3. Scan Line Status Board (10s)
   - Line A: 2 running, 1 delayed (shortage)
   - Line B: 1 running, 2 planned
   - Line C: 1 downtime (machine fault)
   - Line D: 2 running, 1 planned, 2 completed
4. Click WO-0107 (delayed) card → Modal opens (2s)
5. Read Overview tab (8s)
   - Issue: Material Shortage (Beef Trimmings)
6. Click "Materials" tab → See missing reservation (1s + 5s)
7. Close modal (1s)
8. Check Alerts Feed (5s)
   - 🔴 Material Shortage 2m ago
   - ⚠️ Low Yield WO-0108 Op2 5m ago
   - 🔴 Downtime Line C 18m ago
9. Click alert → WO modal re-opens (2s + 5s)
10. Close modal, mental note made (2s)

**Total**: ~50 seconds, 1 screen, 1 modal, 3 clicks

**Improvement**: 83% faster (8 min → 50s)

---

### Workflow 2: Line Supervisor Shift Monitoring (Tablet)

**Persona**: Anna (Line Supervisor, Line A)
**Device**: Tablet (1280×800)
**Goal**: Monitor Line A throughout shift, catch issues early

#### Current Method (Every 30 min, 7 min each = 98 min/shift)

1. Walk to office computer (60s)
2. Navigate to `/production`, filter Line A (20s)
3. Find current WO, check progress (25s)
4. Click "Operations" tab, review (25s)
5. Notice low yield, walk to machine (60s)
6. Check with operator (120s)
7. Walk back, open Excel, note issue (100s)

**Total per check**: ~7 min × 14 checks/shift = **98 min/shift**

#### New Method (Continuous passive, 2-3 min/shift)

**Setup (Once, 11s)**:
1. Open tablet, navigate to `/production` (5s)
2. Tap "Line A" tab (1s)
3. Pin tablet to wall mount (5s)

**Continuous Monitoring (Passive, 3s glance every 5 min)**:
- Glance at tablet (3s)
- See: 2 running WOs, progress bars, time remaining, alerts
- **No walking, no interaction**

**Active Check (When alert appears, ~2 min)**:
1. Alert: "⚠️ Low Yield WO-0105 Op2" (auto-notification)
2. Tap WO card → Modal opens (1s)
3. See yield 78.3% (Op2 Mixing) (8s)
4. Walk to machine (10s)
5. Adjust grinder settings (90s)
6. Return, see updated yield 79.1% (15s)

**Total shift**: 2-3 min active checks

**Improvement**: 97% time saved (98 min → 2-3 min)

---

### Workflow 3: Recording Downtime Event

**Persona**: Anna (Line Supervisor)
**Goal**: Log downtime in <30 seconds

#### Current Method (5+ minutes)

1. Machine stops (grinder bearing fails)
2. Walk to office (60s)
3. Open Excel, find row (25s)
4. Type "Downtime - Machine Fault" (10s)
5. Check clock, type start time (10s)
6. Wait for repair (15 min)
7. Type end time (10s)
8. Calculate duration (20s)
9. Estimate output lost (30s)
10. Type notes (30s)
11. Email manager (77s)

**Total**: ~5 min active work (not including repair time)

#### New Method (20 seconds)

1. Machine stops (auto-detected by system after 30s idle)
2. WO card turns red 🔴 DOWNTIME
3. Alert: "🔴 Line A Downtime Detected"
4. Tap "Record Downtime" button (1s)
5. Modal opens with pre-filled data:
   - Start: 14:32:18 (auto)
   - End: 14:47:05 (auto, when resumed)
   - Duration: 15 min (auto)
   - OEE Impact: -9.4% (auto)
   - Output Lost: 62 kg (auto)
6. Select "Machine Fault" from dropdown (3s)
7. Type notes: "Grinder bearing seized, replaced" (8s)
8. Check "Corrective Action Required" (1s)
9. Tap "Save Downtime Event" (1s)
10. Manager auto-notified (instant email)

**Total**: 20 seconds

**Improvement**: 93% faster (5 min → 20s)

---

### Workflow 4: WO Details Drill-Down (Investigating Issues)

**Persona**: Michał (Production Manager)
**Goal**: Investigate low yield on WO-0108

#### Current Method (10 minutes)

1. See "Low Yield" in email (10s)
2. Open Production page (5s)
3. Click "Yield Report" tab (3s)
4. Filter to "Today", scan table (25s)
5. See WO-0108: 62% yield (5s)
6. Click "Operations" tab (3s)
7. Select WO-0108 from dropdown (5s)
8. See Op2 Mixing: 58% yield (30s)
9. Click "Work Orders" tab (3s)
10. Check materials (15s)
11. Click "Consume Report" tab (3s)
12. See beef over-consumed +15% (30s)
13. Open Excel, calculate cost (60s)
14. Call Line Supervisor (300s - waiting)
15. Note in Excel (20s)

**Total**: ~10 min (5 tabs, Excel, phone)

#### New Method (2.5 minutes)

1. See alert: "⚠️ Low Yield WO-0108 Op2 62%" (2s)
2. Click alert → WO Details Modal opens (1s)
3. Overview tab auto-selected, scan (10s)
   - See Op2: 58% yield 🔴 (problem identified)
4. Click "Operations" tab (1s)
5. Review Op2 details (8s)
   - Losses: 360 kg ⚠️ very high
6. Click "Materials" tab (1s)
7. See beef over-consumed +70 kg (10s)
8. Click "Yield" tab (1s)
9. See trend declining 85% → 58% (5s)
10. Click "History" tab (1s)
11. See operator note: "Mixer slow" (5s)
12. Click "Chat" button (1s)
13. Send message: "Anna, check mixer blade" (5s)
14. Anna replies (90s - waiting)
15. Click "Create Action Item" (1s)
16. Type: "Schedule mixer blade replacement" (11s)
17. Assign to Maintenance, Priority High (4s)
18. Save action item (1s)

**Total**: ~2.5 min (1 modal, real-time chat, action tracked)

**Improvement**: 75% faster (10 min → 2.5 min)

---

### Workflow 5: TV Display Auto-Rotate (Passive Monitoring)

**Persona**: Operators (all lines)
**Device**: 50" TV (1920×1080) mounted in production area
**Goal**: Passive awareness of production status

#### Current Method (None - No Shop Floor Visibility)

- Operators work without visibility into performance
- Supervisors manually tell operators (intermittent, delayed)
- End-of-shift meeting reviews metrics (too late to correct)

**Result**: Reactive, no real-time feedback

#### New Method (Continuous Awareness)

**Auto-Rotate Sequence (60 seconds loop)**:

| Screen | Display | Duration | Purpose |
|--------|---------|----------|---------|
| 1 | OEE % (82.5%, green gauge) | 10s | Overall effectiveness |
| 2 | Yield % (78.5%, amber gauge) | 10s | Production efficiency |
| 3 | Plan Accuracy (92%, green) | 10s | Schedule adherence |
| 4 | Running WOs (6 WOs, progress bars) | 10s | Active production |
| 5 | Delayed WOs (2 WOs, reasons) | 10s | Issues needing attention |
| 6 | Material Shortages (1, ETA) | 10s | Supply chain issues |

**Loop repeats**: 6 screens × 10s = 60s full cycle

**Alert Behavior**:
- Critical alert detected → pause rotation
- Red flash (500ms on/off, 5× repeat)
- Hold screen 30 seconds
- Resume when dismissed

**Impact**:
- 100% operator awareness (vs 0% currently)
- Behavioral change (visible goals)
- Faster communication (fewer supervisor questions)

---

### Workflow 6: Shift Handoff (Supervisor to Supervisor)

**Persona**: Anna (Day Shift) → Tomasz (Night Shift)
**Goal**: Transfer knowledge in <5 minutes

#### Current Method (15-20 minutes)

1. Find night supervisor (may be late) (120s)
2. Verbal handoff (300s)
   - "Line A had yield issues..."
   - "WO-0107 delayed, waiting for beef..."
   - Relies on memory, incomplete
3. Night supervisor takes handwritten notes (180s)
4. Day supervisor leaves
5. Night supervisor reviews notes, has questions (60s)
6. **Info lost** (day supervisor gone)

**Total**: ~15-20 min, incomplete, memory-based

#### New Method (2 minutes)

1. Day supervisor taps "Shift Summary" button (1s)
2. System generates report (3s, AI-powered)
   - Auto-populated from database:
     - Shift Overview (output, OEE, WO counts, downtime)
     - Issues & Actions (low yield, shortages, downtimes)
     - Material Status (beef low, spices OK, casings OK)
     - Night Shift Priorities (resume WO-0107 at 18:00, monitor WO-0105 yield, schedule Line C maintenance)
3. Day supervisor reviews (30s)
4. Add manual note: "Watch Op2 closely" (10s)
5. Tap "Share with Night Shift" (1s)
6. Report auto-sent to Tomasz (1s)
7. Tomasz opens tablet, reviews report (60s)
8. Tomasz taps "Acknowledge Handoff" (1s)

**Total**: ~2 min, 100% complete, accurate

**Improvement**: 90% faster (15-20 min → 2 min)

---

## Implementation Roadmap

### Overview

**Total Duration**: 12 weeks (3 months)
**Team Size**: 2 developers (60% time), 1 designer (50%), 1 QA (25%), 1 PM (10%)
**Budget**: $73,450 ($72k labor + $1.5k hardware)

### Phase 1: Variant B - Real-Time Production Board (Weeks 1-6)

**Priority**: P0 MVP (CRITICAL)

#### Week 1-2: Foundation & Backend

**Week 1: Database & API Layer**
- [ ] Create 3 new tables: `downtime_events`, `action_items`, `shift_summaries`
- [ ] Run migrations via `pnpm gen-types`
- [ ] Create 5 API routes:
  - `/api/production/dashboard` (GET)
  - `/api/production/downtime` (POST, PATCH)
  - `/api/production/action-items` (POST, GET, PATCH)
  - `/api/production/shift-summary` (POST generate)
- [ ] Configure Supabase Realtime subscriptions
- [ ] Create `useRealtimeProduction()` hook

**Week 2: Core Components**
- [ ] 10 components:
  1. KPICard (4h)
  2. WOCard (6h)
  3. GaugeChart (4h)
  4. LineBoard (8h)
  5. AlertsFeed (4h)
  6. DowntimeCard (6h)
  7. ProgressBar (2h)
  8. StatusIndicator (2h)
  9. TimeRemaining (2h)
  10. OperatorBadge (2h)
- [ ] Storybook stories for each

#### Week 3-4: Dashboard Page & Modals

**Week 3: Main Dashboard**
- [ ] Create `/production/dashboard/page.tsx`
- [ ] Layout: KPI cards section + Line board + Alerts feed
- [ ] KPI calculations (`lib/production/kpis.ts`)
- [ ] WebSocket integration (30s refresh)
- [ ] Responsive layout (desktop, laptop, tablet)

**Week 4: WO Details Modal**
- [ ] Modal shell with 6 tabs
- [ ] Overview tab (status, progress, operations, materials, issues)
- [ ] Operations tab (per-operation breakdown)
- [ ] Materials tab (BOM snapshot, variance)
- [ ] Yield tab (trend chart, pattern detection)
- [ ] Trace tab (reuse existing)
- [ ] History tab (audit log timeline)

#### Week 5-6: Testing & Refinement

**Week 5: Testing**
- [ ] 60+ unit tests (KPIs, components, API routes)
- [ ] 10+ E2E tests (dashboard load, modal navigation, downtime recording, shift summary)
- [ ] Performance testing (100+ WOs, WebSocket latency)

**Week 6: Refinement & Documentation**
- [ ] UX refinements (WCAG AA, keyboard nav, ARIA labels)
- [ ] UAT with 5 users (3 managers, 2 supervisors)
- [ ] Documentation (`docs/PRODUCTION_DASHBOARD_GUIDE.md`)
- [ ] Video walkthrough (5 min)
- [ ] Training materials

**Deliverables**:
- ✅ Real-Time Production Dashboard (desktop + tablet)
- ✅ WO Details Modal (6 tabs)
- ✅ Downtime Tracker Modal
- ✅ 80+ tests passing
- ✅ Complete documentation

---

### Phase 2: Variant C - KPI Focus Mode / TV Display (Weeks 7-9)

**Priority**: P0 Growth (End of MVP)

#### Week 7: TV Display UI

- [ ] Create `/production/tv-display/page.tsx`
- [ ] 6 full-screen gauge views (OEE, Yield, Plan Accuracy, Running, Delayed, Shortages)
- [ ] Auto-rotate logic (10s per screen, 60s loop)
- [ ] TV Display Settings Modal (display name, line filter, metrics, rotation interval, alert behavior)
- [ ] Responsive layout (1920×1080, 1280×720)

#### Week 8: TV Display Features

- [ ] Alert flash mechanism (red background, sound, 30s pause)
- [ ] Screen saver mode (2am-6am idle)
- [ ] Multi-TV sync (optional, WebSocket broadcast)
- [ ] End-of-shift summary (auto-show at 14:00, 22:00, 06:00)

#### Week 9: Testing & Rollout

- [ ] Purchase 2× 50" TVs (~$500 each), wall mounts, Raspberry Pi
- [ ] Kiosk mode configuration (auto-start, full-screen, no sleep)
- [ ] E2E tests (auto-rotate, alert flash, screen saver)
- [ ] User training (supervisors, 15 min session)
- [ ] Install TVs on shop floor (Line A, Line B areas)

**Deliverables**:
- ✅ TV Display page (6 auto-rotating screens)
- ✅ 2 TVs installed and operational
- ✅ Settings modal (5 config options)
- ✅ E2E tests passing

---

### Phase 3: Variant D - Customizable Widgets (Weeks 10-12)

**Priority**: P2 Future (Nice-to-Have)

#### Week 10: Widget Framework

- [ ] Widget grid system (`react-grid-layout`, 12 columns)
- [ ] Create 10 widget types (OEE Gauge, Yield Trend, WO List, Downtime Log, Material Shortages, Alert Feed, Line Status, Shift Summary, Action Items, Custom SQL)
- [ ] Per-widget settings panel (time bucket, line filter, refresh interval)

#### Week 11: Widget Features

- [ ] Custom SQL Widget (query builder, whitelist tables, auto-detect chart type)
- [ ] Widget templates (3 pre-built: Production Manager, Line Supervisor, Operations Director)
- [ ] Import/Export layouts (JSON)
- [ ] Real-time widget updates (WebSocket per widget)

#### Week 12: Testing & Documentation

- [ ] E2E tests (drag-drop, resize, save layout, custom SQL)
- [ ] Performance optimization (lazy load, memoize, virtual scrolling)
- [ ] Documentation (widget library reference, custom SQL guide, template creation)
- [ ] Video tutorial (10 min)

**Deliverables**:
- ✅ Widget dashboard framework
- ✅ 10 widget types (including custom SQL)
- ✅ 3 pre-built templates
- ✅ Complete documentation

---

### Rollout Plan

#### Phase 1 Rollout (Week 6)

**Pre-Rollout (1 week before)**:
- User training (2 sessions, 1 hour each)
- Video walkthrough (5 min, shared via email)
- Pilot with 2 users (manager + supervisor)

**Go-Live (Friday end-of-shift)**:
- Deploy to production (Vercel)
- Run database migrations
- Monitor for errors (24h on-call)

**Post-Rollout (Week 7)**:
- Daily check-ins (first 3 days)
- Fix critical bugs (P0 priority)
- Gather feature requests

#### Phase 2 Rollout (Week 9)

**Hardware Installation**:
- Install 2 TVs on shop floor
- Configure kiosk mode (Raspberry Pi)
- Test network connectivity

**Go-Live**:
- Enable TV display URLs
- Train supervisors (15 min session)
- Monitor TV uptime (first week)

#### Phase 3 Rollout (Week 12)

**Feature Flag**:
- Enable for power users only (5 users beta)
- Gather feedback (2 weeks)
- Refine based on usage

**General Release**:
- Enable for all Production Manager role
- Share widget templates

---

## Success Metrics

### Phase 1 (Variant B MVP)

**Quantitative**:
- ✅ Dashboard load time < 2s (Lighthouse)
- ✅ Real-time update latency < 1s (WebSocket ping)
- ✅ 80% of Production Managers use daily (analytics)
- ✅ 60% of Line Supervisors use tablet on shop floor (usage logs)
- ✅ 50% reduction in issue detection time (8 min → 4 min, surveys)

**Qualitative**:
- ✅ 4/5 users rate UX as "Much Better" (survey)
- ✅ Zero critical bugs in first 2 weeks (bug tracker)
- ✅ Positive feedback in retrospective (team meeting notes)

### Phase 2 (Variant C TV Display)

**Quantitative**:
- ✅ 2 TVs installed and operational
- ✅ 95% uptime (auto-refresh logs)
- ✅ 30+ operator glances per hour (observations)

**Qualitative**:
- ✅ Operators report increased awareness (interviews)
- ✅ Supervisors report faster communication
- ✅ Management visibility on shop floor

### Phase 3 (Variant D Widgets)

**Quantitative**:
- ✅ 20% of power users customize dashboard (usage logs)
- ✅ 5+ custom SQL widgets created (query logs)
- ✅ Average 3 widgets per user dashboard (analytics)

**Qualitative**:
- ✅ Power users report "flexibility" and "control" (survey)
- ✅ Ad-hoc analysis time reduced (Excel → widgets)

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **OEE** | Overall Equipment Effectiveness = Availability × Performance × Quality |
| **Yield %** | (Actual Output / Actual Input) × 100% |
| **Plan Accuracy** | (Actual Output / Planned Quantity) × 100% |
| **Downtime** | Period when production line is stopped (machine fault, material shortage, changeover, etc.) |
| **1:1 Consumption** | consume_whole_lp flag enforces full LP consumption (no partial splits) |
| **BOM Snapshot** | Immutable BOM copy created at WO creation time |
| **Kanban** | Visual workflow management method (columns: Planned, Running, Delayed, Completed) |
| **WO** | Work Order (production order to manufacture a specific product) |
| **LP** | License Plate (atomic unit of inventory in warehouse) |
| **PR** | Production Report (material consumption recording) |
| **FG** | Finished Good (final product output) |
| **BP** | By-Product (secondary output from production) |

### Appendix B: References

**Design Inspiration**:
- Plex MES Dashboard (real-time KPIs, mobile app)
- Tulip.co (tablet-first UI, shop floor apps)
- Tableau Dashboard (color-coded KPIs, drill-down)
- Trello/Jira Board (Kanban-style line status)

**Technical Documentation**:
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- [Recharts Library](https://recharts.org/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

**Project Files**:
- Current Production Module: `apps/frontend/app/production/page.tsx`
- Production API: `apps/frontend/lib/api/productionLines.ts`
- Database Schema: `docs/DATABASE_SCHEMA.md`
- Planning Module UX: `docs/ux-design-planning-module.md`
- Scanner Module UX: `docs/ux-design-scanner-module.md`

### Appendix C: Database Schema Changes

**New Tables (Phase 1)**:

```sql
-- Downtime Events
CREATE TABLE downtime_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  line_id UUID NOT NULL REFERENCES production_lines(id),
  wo_id UUID REFERENCES work_orders(id),
  reason_code VARCHAR(50) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))/60) STORED,
  notes TEXT,
  corrective_action_required BOOLEAN DEFAULT FALSE,
  oee_impact_pct NUMERIC(5,2),
  output_lost_kg NUMERIC(10,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action Items
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID REFERENCES work_orders(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Shift Summaries
CREATE TABLE shift_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  shift_date DATE NOT NULL,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  supervisor_id UUID REFERENCES users(id),
  total_output_kg NUMERIC(10,2),
  oee_pct NUMERIC(5,2),
  work_orders_completed INTEGER,
  work_orders_running INTEGER,
  work_orders_delayed INTEGER,
  downtime_minutes INTEGER,
  quality_holds INTEGER,
  notes TEXT,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Appendix D: API Endpoints

**New Routes (Phase 1)**:

```typescript
// GET /api/production/dashboard
// Returns: { kpis: KPI[], lines: Line[], alerts: Alert[], lastUpdated: Date }

// POST /api/production/downtime
// Body: { lineId, woId?, reasonCode, startTime, endTime, notes, correctiveActionRequired }
// Returns: { downtimeEvent: DowntimeEvent, updatedWO: WorkOrder }

// POST /api/production/action-items
// Body: { woId, title, description, assignedTo, priority, dueDate }
// Returns: { actionItem: ActionItem }

// POST /api/production/shift-summary/generate
// Body: { shiftDate, shiftName, supervisorId }
// Returns: { shiftSummary: ShiftSummary (AI-generated) }
```

---

**End of UX Design Specification: Production Module**

**Next Steps**:
1. Review and approve this specification with stakeholders
2. Prioritize Phase 1 (Variant B) for immediate implementation (Weeks 1-6)
3. Allocate team: 2 devs (60% time), 1 designer (50%), 1 QA (25%)
4. Kick off Week 1: Database schema + API layer
5. Weekly check-ins with UAT users (Production Managers, Line Supervisors)

**Questions?** Contact Product Team or refer to `docs/ux-design-index.md` for methodology overview.
