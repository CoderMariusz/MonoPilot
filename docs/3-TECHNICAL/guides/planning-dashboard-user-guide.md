# Planning Dashboard User Guide

**Story**: 03.16 - Planning Dashboard
**Version**: 1.0
**Last Updated**: 2026-01-02

## Table of Contents

1. [Overview](#overview)
2. [Accessing the Dashboard](#accessing-the-dashboard)
3. [Understanding KPI Cards](#understanding-kpi-cards)
4. [Working with Alerts](#working-with-alerts)
5. [Viewing Recent Activity](#viewing-recent-activity)
6. [Quick Actions](#quick-actions)
7. [Navigation Tips](#navigation-tips)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

The Planning Dashboard is your central command center for managing all planning operations in MonoPilot. It provides real-time visibility into:

- **Key metrics** across purchase orders, transfer orders, and work orders
- **Critical alerts** requiring immediate attention
- **Recent activity** showing what's happening across your organization

### Who Should Use This

- **Production Planners**: Monitor work order schedules and material availability
- **Purchasing Managers**: Track purchase order approvals and deliveries
- **Warehouse Supervisors**: Oversee transfer orders and inventory movements
- **Operations Managers**: Get high-level visibility into all planning activities

### What You'll Learn

By the end of this guide, you'll be able to:
- Navigate the dashboard efficiently
- Interpret KPI metrics
- Respond to critical alerts
- Track recent planning activity
- Create new orders quickly

---

## Accessing the Dashboard

### Route

```
https://app.monopilot.com/planning
```

### Navigation

1. Log in to MonoPilot
2. Click **Planning** in the main navigation menu
3. The dashboard loads automatically as the default Planning page

### Permissions

**Required Roles:**
- Production Planner
- Purchasing Manager
- Warehouse Supervisor
- Operations Manager

**Guest users cannot access the Planning Dashboard.**

---

## Understanding KPI Cards

The dashboard displays six key performance indicators (KPIs) in a responsive grid layout.

### KPI Card Layout

```
┌─────────────────────────┐
│ Title          [Icon]   │
│ 42             ↑ 15%    │ ← Value and trend (Phase 2)
│ vs last month: +5       │ ← Comparison (Phase 2)
└─────────────────────────┘
```

### The 6 KPIs

#### 1. PO Pending Approval

**What it shows:** Number of purchase orders awaiting approval

**Color:** Yellow

**Click action:** Opens purchase orders list filtered to pending approvals

**What to do:**
- If the number is high (>10), review and approve/reject pending POs
- Click the card to see the full list
- Prioritize time-sensitive orders

**Example:**
```
PO Pending Approval
12
```
Means: 12 purchase orders need your approval

---

#### 2. PO This Month

**What it shows:** Total purchase orders created in the current calendar month

**Color:** Blue

**Click action:** Opens purchase orders list filtered to this month

**What to do:**
- Track monthly purchasing activity
- Compare against budget or historical trends
- Identify unusual spikes or drops

**Example:**
```
PO This Month
45
```
Means: 45 purchase orders created in January 2026

---

#### 3. TO In Transit

**What it shows:** Transfer orders currently being shipped between warehouses

**Color:** Orange

**Click action:** Opens transfer orders list filtered to in-transit status

**What to do:**
- Monitor active transfers
- Ensure receiving warehouses are prepared
- Investigate delays if transit time exceeds expectations

**Example:**
```
TO In Transit
8
```
Means: 8 transfer orders are currently in transit

---

#### 4. WO Scheduled Today

**What it shows:** Work orders scheduled for production today

**Color:** Green

**Click action:** Opens work orders list filtered to today's date

**What to do:**
- Review today's production schedule
- Ensure materials are available
- Assign production lines and operators

**Example:**
```
WO Scheduled Today
15
```
Means: 15 work orders are scheduled for today

---

#### 5. WO Overdue

**What it shows:** Work orders past their scheduled date and not yet completed

**Color:** Red

**Click action:** Opens work orders list filtered to overdue status

**What to do:**
- **URGENT**: Investigate why WOs are delayed
- Reschedule or expedite overdue orders
- Communicate delays to customers if necessary

**Example:**
```
WO Overdue
3
```
Means: 3 work orders are past their scheduled date

---

#### 6. Open Orders

**What it shows:** Total purchase orders not yet closed or cancelled

**Color:** Purple

**Click action:** Opens purchase orders list filtered to open status

**What to do:**
- Track total active commitments
- Monitor cash flow impact
- Close completed orders to keep data clean

**Example:**
```
Open Orders
67
```
Means: 67 purchase orders are still active

---

### Interacting with KPI Cards

#### Click Navigation

All KPI cards are **clickable**. Clicking a card navigates to the corresponding list page with filters pre-applied.

**Example Flow:**
1. Click "WO Overdue" card showing `3`
2. Navigate to `/planning/work-orders?overdue=true`
3. See filtered list of 3 overdue work orders
4. Take action on each order

#### Keyboard Navigation

**Accessibility:** You can navigate KPI cards using your keyboard:
- **Tab**: Move between cards
- **Enter** or **Space**: Activate selected card
- **Shift+Tab**: Navigate backwards

#### Loading States

When the dashboard loads, you'll see skeleton placeholders:

```
┌─────────────────────────┐
│ ████████       [████]   │
│ ████                    │
│ ████████                │
└─────────────────────────┘
```

Wait 1-2 seconds for data to load.

#### Error States

If a KPI fails to load, you'll see:

```
┌─────────────────────────┐
│      ⚠️                 │
│  Failed to load KPI     │
│  Network error          │
│    [Retry]              │
└─────────────────────────┘
```

Click **Retry** to reload the KPI.

---

## Working with Alerts

The Alert Panel shows critical issues requiring immediate attention.

### Alert Panel Layout

```
┌─ Alerts (2) ────────────────┐
│                              │
│ ⚠️ PO-2024-00123  [Critical]│
│    5 days overdue            │
│    From: Acme Supplies       │
│                              │
│ ⚠️ PO-2024-00124  [Warning] │
│    Pending approval: 3 days  │
│    From: Baker Inc           │
│                              │
└──────────────────────────────┘
```

### Alert Types

#### 1. Overdue PO (Red Icon)

**What it means:** Purchase order past expected delivery date

**Severity:**
- **Warning** (Orange): 1-3 days overdue
- **Critical** (Red): 4+ days overdue

**Example:**
```
⚠️ PO-2024-00123  [Critical]
   PO-2024-00123 from Acme Supplies is 5 days overdue
   5 days overdue
```

**What to do:**
1. Click the alert to open the PO detail page
2. Contact the supplier to get an updated delivery date
3. Update the PO with the new expected delivery date
4. Inform stakeholders of the delay

---

#### 2. Pending Approval (Yellow Icon)

**What it means:** Purchase order waiting for approval for more than 2 days

**Severity:**
- **Warning** (Orange): 2-3 days pending
- **Critical** (Red): 4+ days pending

**Example:**
```
⚠️ PO-2024-00124  [Warning]
   PO-2024-00124 from Baker Inc pending approval for 3 days
```

**What to do:**
1. Click the alert to open the PO detail page
2. Review the PO details
3. Approve or reject the PO
4. The alert will disappear after approval/rejection

---

#### 3. Low Inventory (Phase 2)

**Status:** Coming Soon - Requires Warehouse Module

**What it will show:** Products below reorder point or safety stock

---

#### 4. Material Shortage (Phase 2)

**Status:** Coming Soon - Material Availability Check

**What it will show:** Work orders with insufficient materials to start production

---

### Alert Actions

**Click to Navigate:**
- Click any alert to navigate to the related entity (PO, TO, WO)
- The entity detail page opens for immediate action

**Keyboard Navigation:**
- **Tab**: Move between alerts
- **Enter** or **Space**: Open alert detail

### Alert Sorting

Alerts are automatically sorted:
1. **Critical** alerts first (red)
2. **Warning** alerts second (orange)
3. Within each severity, sorted alphabetically by entity number

### Empty State

When there are no alerts, you'll see:

```
┌─ Alerts ────────────────────┐
│                              │
│       ✅                     │
│   No alerts - all clear!     │
│   Keep up the good work!     │
│                              │
└──────────────────────────────┘
```

This is a **good thing**! It means everything is on track.

---

## Viewing Recent Activity

The Activity Feed shows the last 20 planning actions across all entities.

### Activity Feed Layout

```
┌─ Recent Activity ───────────┐
│                              │
│ 🛒 PO-2024-00125             │
│    was approved              │
│    by John Doe               │
│    2 hours ago               │
│                              │
│ 🏭 WO-2024-00045             │
│    was completed             │
│    by Jane Smith             │
│    Yesterday                 │
│                              │
└──────────────────────────────┘
```

### Entity Types

| Icon | Entity Type | Color |
|------|-------------|-------|
| 🛒 | Purchase Order (PO) | Blue |
| 🚚 | Transfer Order (TO) | Orange |
| 🏭 | Work Order (WO) | Green |

### Action Types

| Action | Description | Color |
|--------|-------------|-------|
| **created** | Entity was created | Green |
| **updated** | Entity was modified | Blue |
| **approved** | PO was approved | Green |
| **cancelled** | Entity was cancelled | Red |
| **completed** | Entity was closed/completed | Purple |

### Timestamp Display

The feed shows relative timestamps:

| Time Ago | Display |
|----------|---------|
| < 1 minute | "just now" |
| 1-59 minutes | "5 minutes ago" |
| 1-23 hours | "3 hours ago" |
| 1 day | "Yesterday" |
| 2-6 days | "3 days ago" |
| 7+ days | "12/25/2024" |

**Hover** over the timestamp to see the exact date and time.

### Activity Actions

**Click to Navigate:**
- Click any activity item to navigate to the entity detail page
- Useful for investigating recent changes

**Keyboard Navigation:**
- **Tab**: Move between activity items
- **Enter** or **Space**: Open activity detail

### Activity Limit

The feed shows **up to 20 activities**. To see older activity:
- Navigate to the specific entity list (PO, TO, WO)
- Use the entity's activity history or audit log

### Empty State

If there's no recent activity, you'll see:

```
┌─ Recent Activity ───────────┐
│                              │
│       📊                     │
│   No recent activity         │
│   Create your first PO,      │
│   TO, or WO to see           │
│   activity here              │
│                              │
└──────────────────────────────┘
```

---

## Quick Actions

Quick Action buttons in the header let you create new entities without navigating.

### Button Layout

```
┌─ Planning Dashboard ─────────────────┐
│                          [Create PO] │
│                          [Create TO] │
│                          [Create WO] │
└──────────────────────────────────────┘
```

### 1. Create PO (Primary Button)

**What it does:** Opens the Purchase Order creation form

**Click action:** Navigate to `/planning/purchase-orders/new`

**When to use:**
- You need to order materials from a supplier
- Reorder point reached for a product
- Urgent order required

**Result:** After creating the PO:
- PO appears in "PO This Month" KPI
- Activity feed shows "PO-XXXX was created by [You]"
- Dashboard data refreshes automatically

---

### 2. Create TO (Outline Button)

**What it does:** Opens the Transfer Order creation form

**Click action:** Navigate to `/planning/transfer-orders/new`

**When to use:**
- Move inventory between warehouses
- Rebalance stock levels
- Prepare for production at a different location

**Result:** After creating the TO:
- TO appears in "TO In Transit" KPI (once shipped)
- Activity feed shows "TO-XXXX was created by [You]"
- Dashboard data refreshes automatically

---

### 3. Create WO (Outline Button)

**What it does:** Opens the Work Order creation form

**Click action:** Navigate to `/planning/work-orders/new`

**When to use:**
- Schedule production for a product
- Create a batch based on customer order
- Manufacture to stock

**Result:** After creating the WO:
- WO appears in "WO Scheduled Today" KPI (if scheduled for today)
- Activity feed shows "WO-XXXX was created by [You]"
- Dashboard data refreshes automatically

---

### Mobile Quick Actions

On mobile devices, Quick Actions stack vertically for easy thumb access.

---

## Navigation Tips

### Best Practices

1. **Start with KPIs**: Quickly scan the 6 KPI cards every morning
2. **Address Alerts First**: Tackle critical alerts (red) before warnings (orange)
3. **Monitor Overdue WOs**: Zero is the goal - investigate any overdue work orders
4. **Review Activity**: Check recent activity to stay informed

### Common Workflows

#### Morning Routine (5 minutes)

```
1. Open Planning Dashboard
   ↓
2. Check "WO Overdue" KPI
   → If > 0: Click card, reschedule overdue WOs
   ↓
3. Check Alert Panel
   → If critical alerts: Click and resolve
   ↓
4. Check "PO Pending Approval" KPI
   → If > 5: Click card, approve/reject batch
   ↓
5. Scan Recent Activity for unusual patterns
```

#### Weekly Review (15 minutes)

```
1. Compare "PO This Month" to last month
   → Identify trends
   ↓
2. Review all alerts (even warnings)
   → Clear backlog
   ↓
3. Check "TO In Transit"
   → Ensure all transfers are progressing
   ↓
4. Review "Open Orders"
   → Close completed POs
```

---

## Troubleshooting

### Dashboard Not Loading

**Symptoms:** Blank page or infinite loading

**Solutions:**
1. Refresh the page (F5 or Ctrl+R)
2. Clear browser cache (Ctrl+Shift+Del)
3. Check internet connection
4. Log out and log back in
5. Contact support if issue persists

---

### KPI Shows "0" But I Have Data

**Symptoms:** KPI card shows 0 when you know there's data

**Possible Causes:**
- Data filters (e.g., "PO This Month" only shows current month)
- Status filters (e.g., "Open Orders" excludes closed/cancelled)
- Organization context (you're viewing wrong org)

**Solutions:**
1. Click the KPI card to see the filtered list
2. Verify filters are correct
3. Check organization selector in header
4. Refresh the dashboard (cache may be stale)

---

### Alert Panel Empty But I Know There Are Issues

**Symptoms:** Alert panel shows "No alerts" but you have overdue POs

**Possible Causes:**
- Alert thresholds not met (e.g., only 1 day overdue, need 1+ days)
- PO status is "receiving" (excludes from overdue alerts)
- Cache hasn't refreshed yet

**Solutions:**
1. Wait 2 minutes for cache to refresh
2. Hard refresh (Ctrl+F5)
3. Check PO list directly: `/planning/purchase-orders`

---

### Activity Feed Not Updating

**Symptoms:** Recent actions don't appear in activity feed

**Cause:** Cache TTL (2-minute delay)

**Solution:** Wait up to 2 minutes for cache to expire, then refresh

---

### Permission Denied

**Symptoms:** "You don't have permission to access this page"

**Solutions:**
1. Verify you have a planning role (Planner, Purchaser, Warehouse Supervisor)
2. Contact your administrator to request access
3. Check you're logged in to the correct organization

---

## FAQ

### How often does the dashboard update?

The dashboard data is cached for **2 minutes** for performance. After any action (create PO, approve WO, etc.), the cache is invalidated and the dashboard refreshes automatically.

**Auto-refresh:** The page refreshes every 2 minutes if left open.

---

### Can I customize which KPIs are shown?

**Phase 1 (Current):** No, all 6 KPIs are always shown.

**Phase 3 (Future):** Yes, you'll be able to customize dashboard layout and choose which widgets to display.

---

### Why are some alerts marked "Coming Soon"?

Some alert types require additional modules:
- **Low Inventory**: Requires Epic 05 (Warehouse Module)
- **Material Shortage**: Requires Story 03.13 (Material Availability Check)

These will be available in Phase 2.

---

### How do I export dashboard data?

**Phase 1 (Current):** No export functionality.

**Phase 2 (Future):** Export to Excel/PDF will be available via an "Export" button in the header.

---

### Can I see historical trends?

**Phase 1 (Current):** No historical data. KPIs show current state only.

**Phase 2 (Future):** Trend indicators will show "vs last month: +15%"

**Phase 3 (Future):** Full historical charting and drill-down analytics.

---

### What happens if I have multiple organizations?

Use the **organization selector** in the header to switch between organizations. The dashboard will reload with data for the selected organization.

All KPIs, alerts, and activity are **isolated by organization** for data security.

---

### Why can't I click on a loading skeleton?

Loading skeletons are **placeholders only** and not interactive. Wait for data to load (1-2 seconds), then the card becomes clickable.

---

### How do I know if an alert is urgent?

**Severity Indicators:**
- **Critical** (Red badge): Urgent, address immediately
- **Warning** (Orange badge): Important, address within 24 hours

**Priority Order:**
1. Critical alerts (4+ days overdue)
2. Warning alerts (1-3 days overdue)
3. Pending approvals

---

### Can I filter the activity feed?

**Phase 1 (Current):** No filters. Shows all activity types (PO, TO, WO).

**Phase 2 (Future):** Date range filter, entity type filter, action type filter.

---

### What's the difference between "Open Orders" and "PO This Month"?

- **PO This Month**: Purchase orders **created** in the current calendar month (may be closed by now)
- **Open Orders**: Purchase orders that are **currently active** (not closed or cancelled), regardless of creation date

Example: A PO created in December 2025 and still open in January 2026 would count in "Open Orders" but NOT "PO This Month" (in January).

---

## Support

### Need Help?

- **Technical Issues**: Contact IT support via help@monopilot.com
- **Feature Requests**: Submit via `/settings/feedback`
- **Training**: Watch video tutorials at `/help/videos`
- **Documentation**: Browse full docs at `/help/docs`

### Reporting Bugs

If you encounter a bug:
1. Note the exact steps to reproduce
2. Take a screenshot if possible
3. Email support with:
   - Dashboard URL
   - Browser and version
   - Organization name
   - Description of issue

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial user guide for Story 03.16 |

---

## Next Steps

After mastering the Planning Dashboard, explore:
- [Purchase Orders Guide](./purchase-orders-user-guide.md)
- [Transfer Orders Guide](./transfer-orders-user-guide.md)
- [Work Orders Guide](./work-orders-user-guide.md)
- [Approval Workflows](./approval-workflows-guide.md)

---

**Happy Planning!** 🎯
