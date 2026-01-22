# Shipping Dashboard User Guide

Story: **07.15 - Shipping Dashboard + KPIs**

The Shipping Dashboard provides real-time visibility into your shipping operations through KPIs, alerts, charts, and activity tracking.

## Accessing the Dashboard

Navigate to **Shipping** in the main menu. The dashboard is the default landing page at `/shipping/dashboard`.

## Dashboard Components

### KPI Cards

Four KPI cards display at the top of the dashboard:

| Card | Metrics | Description |
|------|---------|-------------|
| **Orders** | Total, by status, trend | Count of sales orders with breakdown (Draft, Confirmed, Allocated, Picking, Packing, Shipped, Delivered) |
| **Pick Lists** | Total, by status, trend | Count of pick lists (Pending, Assigned, In Progress, Completed) |
| **Shipments** | Total, by status, trend | Count of shipments (Pending, Packing, Packed, Shipped, Delivered) |
| **Backorders** | Count, total value | Lines with qty_allocated < qty_ordered |

**Trend Indicators:**
- Green up arrow: Increase vs. previous period
- Red down arrow: Decrease vs. previous period
- Gray dash: No change

The trend compares the current date range to an equal period immediately before (e.g., last 30 days vs. 30 days before that).

### Orders by Status Chart

A pie chart showing the distribution of sales orders by status:

| Status | Color |
|--------|-------|
| Draft | Gray |
| Confirmed | Blue |
| Allocated | Purple |
| Picking | Yellow |
| Packing | Orange |
| Shipped | Green |
| Delivered | Teal |

**Click** on a segment to navigate to the filtered orders list (e.g., clicking "Shipped" goes to `/shipping/sales-orders?status=shipped`).

### Shipments by Date Chart

A line chart showing daily shipment counts over the selected date range:
- X-axis: Dates (daily granularity)
- Y-axis: Shipment count
- Hover for exact date and count

### Alerts Section

Four alert types are monitored:

| Alert | Badge Color | Condition | Link |
|-------|-------------|-----------|------|
| **Backorders** | Red | qty_allocated < qty_ordered | Filtered orders |
| **Delayed Shipments** | Orange | promised_ship_date < today, not shipped | Filtered orders |
| **Pending Picks >24h** | Yellow | Pick list pending >24 hours | Pick lists list |
| **Allergen Conflicts** | Purple | allergen_validated = false | Filtered orders |

**Click** on any alert badge to navigate to the filtered list view.

When no alerts exist, a green success message displays: "All systems operational - No active alerts"

### Recent Activity Timeline

Shows the last 10 activities in reverse chronological order:

| Activity | Icon | Example |
|----------|------|---------|
| SO Created | Shopping Cart | "SO-2026-00123 created by John Doe" |
| SO Confirmed | Check Circle | "SO-2026-00123 confirmed" |
| SO Shipped | Truck | "SO-2026-00122 shipped" |
| Pick Completed | Package | "PL-2026-00045 completed" |
| Shipment Packed | Box | "SH-2026-00033 packed" |

**Click** on any entity link to navigate to the detail page.

Timestamps display as relative time (e.g., "2 minutes ago", "1 hour ago") or full date for older items.

### Quick Actions Panel

Three quick action buttons for common tasks:

| Action | Destination | Required Role |
|--------|-------------|---------------|
| **Create Sales Order** | /shipping/sales-orders/new | ADMIN, MANAGER, SALES |
| **Create Pick List** | /shipping/pick-lists/new | ADMIN, MANAGER, WAREHOUSE |
| **View Backorders** | /shipping/sales-orders?filter=backorders | All roles |

Users with VIEWER role see disabled buttons with "Insufficient permissions" tooltip.

## Date Range Filter

Filter all dashboard data by date range:

| Preset | Description |
|--------|-------------|
| Today | Current day only |
| Last 7 days | Rolling 7-day window |
| Last 30 days | Rolling 30-day window (default) |
| Custom range | Date picker (max 365 days) |

Changing the date range refreshes all KPIs, charts, and alerts within 300ms.

## Performance

The dashboard is designed for fast loading:
- Target load time: <500ms
- Data is cached for 60 seconds
- Skeleton loaders display during data fetch

Note: Due to caching, newly created items may take up to 60 seconds to appear.

## Mobile Experience

The dashboard is fully responsive:

| Screen Size | Layout |
|-------------|--------|
| Mobile (<768px) | KPIs stacked (1 column), charts full-width, quick actions dropdown |
| Tablet (768-1024px) | KPIs 2 columns, charts may stack |
| Desktop (>1024px) | KPIs 4 columns, charts side-by-side |

## Error States

| Error | Display | Action |
|-------|---------|--------|
| API failure | "Unable to load dashboard" | Retry button |
| Redis unavailable | "Real-time data (caching unavailable)" | Data still loads from database |
| Session expired | Redirect to login | Re-authenticate |
| No data | Empty state messages | Adjust date range |

## Related Features

| Feature | Story | Link |
|---------|-------|------|
| Sales Orders | 07.2 | /shipping/sales-orders |
| Pick Lists | 07.8 | /shipping/pick-lists |
| Shipments | 07.11 | /shipping/shipments |
| Allergen Validation | 07.6 | Automatic on SO confirmation |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| R | Refresh dashboard data |
| N | Create new sales order |
| P | Create new pick list |

## Troubleshooting

**Dashboard loads slowly:**
- Check network connection
- Redis cache may be unavailable (fallback to database)
- Large dataset - try narrower date range

**Data seems stale:**
- Cached data has 60-second TTL
- Wait or click refresh button

**Alerts not showing:**
- Verify date range includes expected data
- Check order/pick list/shipment statuses

**Charts empty:**
- No data exists for selected date range
- Try expanding date range

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-22 | Initial release |
